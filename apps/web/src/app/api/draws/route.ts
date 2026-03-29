import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  generateRandomDraw,
  generateAlgorithmicDraw,
  calculatePrizePool,
  simulateDraw,
} from '@/lib/draw-engine'

// GET /api/draws — list all published draws
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'published'

  const { data: draws, error } = await supabase
    .from('draws')
    .select('*')
    .eq('status', status)
    .order('draw_date', { ascending: false })
    .limit(12)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: draws })
}

// POST /api/draws — admin: create or run a draw
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, drawId, logic, month, title, draw_date } = body

  const adminClient = createAdminClient()

  // --- Create a new draw ---
  if (action === 'create') {
    const { data: draw, error } = await adminClient
      .from('draws')
      .insert({ month, title, draw_date, logic: logic || 'random', status: 'upcoming' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: draw }, { status: 201 })
  }

  // --- Simulate or run draw ---
  if (action === 'simulate' || action === 'publish') {
    // Fetch all active subscribers' scores
    const { data: activeUsers } = await adminClient
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')

    const userIds = activeUsers?.map(u => u.user_id) || []

    const { data: allScores } = await adminClient
      .from('golf_scores')
      .select('user_id, score')
      .in('user_id', userIds)

    // Group scores by user
    const scoresByUser = new Map<string, number[]>()
    allScores?.forEach(row => {
      if (!scoresByUser.has(row.user_id)) scoresByUser.set(row.user_id, [])
      scoresByUser.get(row.user_id)!.push(row.score)
    })

    const allUserScores = Array.from(scoresByUser.values())
    const allFlatScores = allUserScores.flat()

    // Generate winning numbers
    const winningNumbers =
      logic === 'algorithmic'
        ? generateAlgorithmicDraw(allFlatScores)
        : generateRandomDraw()

    // Get previous jackpot rollover
    const { data: prevDraw } = await adminClient
      .from('draws')
      .select('jackpot_amount')
      .eq('jackpot_rolled_to', drawId)
      .single()

    const rollover = prevDraw?.jackpot_amount || 0
    const prizePool = calculatePrizePool(userIds.length, 9.99, 0.5, rollover)
    const simulation = simulateDraw(allUserScores, winningNumbers, prizePool)

    if (action === 'simulate') {
      return NextResponse.json({ data: { simulation, winningNumbers, prizePool } })
    }

    // --- Publish draw ---
    const { error: updateError } = await adminClient
      .from('draws')
      .update({
        winning_numbers: winningNumbers,
        status: 'published',
        jackpot_amount: prizePool.jackpotPool,
        four_match_amount: prizePool.fourMatchPool,
        three_match_amount: prizePool.threeMatchPool,
        total_pool: prizePool.totalPool,
        participant_count: userIds.length,
        published_at: new Date().toISOString(),
      })
      .eq('id', drawId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Save draw entries for each user
    const entries = []
    for (const [userId, scores] of scoresByUser) {
      const matchType = getMatchTypeLocal(scores, winningNumbers)
      const prizeAmount = getPrizeAmount(matchType, simulation)
      entries.push({
        draw_id: drawId,
        user_id: userId,
        scores_snapshot: scores,
        match_type: matchType,
        prize_amount: prizeAmount,
      })
    }

    await adminClient.from('draw_entries').insert(entries)

    // Create winner records for matching users
    const winners = entries.filter(e => e.match_type !== 'no-match')
    if (winners.length > 0) {
      await adminClient.from('winners').insert(
        winners.map(w => ({
          draw_id: w.draw_id,
          user_id: w.user_id,
          draw_entry_id: null, // will be updated
          match_type: w.match_type,
          prize_amount: w.prize_amount,
          verification_status: 'pending',
          payment_status: 'pending',
        }))
      )
    }

    // Jackpot rollover if no 5-match winner
    if (simulation.jackpotRolls) {
      await adminClient
        .from('draws')
        .update({ jackpot_rolled_to: drawId })
        .eq('id', drawId)
    }

    return NextResponse.json({ data: { message: 'Draw published', simulation } })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

function getMatchTypeLocal(userScores: number[], winning: number[]): string {
  const winSet = new Set(winning)
  const matches = userScores.filter(s => winSet.has(s)).length
  if (matches >= 5) return '5-match'
  if (matches >= 4) return '4-match'
  if (matches >= 3) return '3-match'
  return 'no-match'
}

function getPrizeAmount(matchType: string, sim: ReturnType<typeof simulateDraw>): number {
  if (matchType === '5-match') return sim.prizePerFiveMatch
  if (matchType === '4-match') return sim.prizePerFourMatch
  if (matchType === '3-match') return sim.prizePerThreeMatch
  return 0
}
