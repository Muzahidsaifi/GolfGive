import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/scores — fetch current user's scores
export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: scores, error } = await supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: scores })
}

// POST /api/scores — add a new score (enforces rolling 5)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
  }

  const body = await req.json()
  const { score, played_at } = body

  // Validate
  if (!score || score < 1 || score > 45) {
    return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
  }
  if (!played_at) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  // Count existing scores
  const { data: existingScores } = await supabase
    .from('golf_scores')
    .select('id, played_at')
    .eq('user_id', user.id)
    .order('played_at', { ascending: true })

  // If already 5 scores, delete the oldest
  if (existingScores && existingScores.length >= 5) {
    const oldest = existingScores[0]
    await supabase.from('golf_scores').delete().eq('id', oldest.id)
  }

  // Insert new score
  const { data: newScore, error } = await supabase
    .from('golf_scores')
    .insert({ user_id: user.id, score, played_at })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: newScore }, { status: 201 })
}
