import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/charity
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_charities')
    .select('*, charities(*)')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || null })
}

// POST /api/user/charity
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { charity_id, contribution_percentage } = await req.json()

  if (!charity_id) return NextResponse.json({ error: 'charity_id required' }, { status: 400 })
  if (contribution_percentage < 10 || contribution_percentage > 100) {
    return NextResponse.json({ error: 'Percentage must be between 10 and 100' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_charities')
    .upsert({
      user_id: user.id,
      charity_id,
      contribution_percentage,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*, charities(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
