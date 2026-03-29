import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/reports — platform-wide analytics
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: drawStats },
    { data: charityStats },
    { data: winnerStats },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('draws').select('total_pool, status').eq('status', 'published'),
    admin.from('user_charities').select('charity_id, contribution_percentage, charities(name)'),
    admin.from('winners').select('prize_amount, payment_status, verification_status'),
  ])

  const totalPrizePool = drawStats?.reduce((sum, d) => sum + (d.total_pool || 0), 0) || 0
  const totalWinnersCount = winnerStats?.length || 0
  const totalPaid = winnerStats?.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0) || 0

  // Charity breakdown (approximate from user contributions)
  const charityTotals: Record<string, { name: string; total: number }> = {}
  charityStats?.forEach((uc: any) => {
    const id = uc.charity_id
    if (!charityTotals[id]) {
      charityTotals[id] = { name: uc.charities?.name || 'Unknown', total: 0 }
    }
    // Each subscriber contributes ~£9.99 * percentage / 100 per month (approximate)
    charityTotals[id].total += 9.99 * (uc.contribution_percentage / 100)
  })

  return NextResponse.json({
    data: {
      total_users: totalUsers || 0,
      active_subscribers: activeSubscribers || 0,
      draws_completed: drawStats?.length || 0,
      total_prize_pool_all_time: totalPrizePool,
      total_winners: totalWinnersCount,
      total_paid_out: totalPaid,
      charity_breakdown: Object.entries(charityTotals).map(([id, v]) => ({
        charity_id: id,
        charity_name: v.name,
        total: Math.round(v.total * 100) / 100,
      })),
    },
  })
}
