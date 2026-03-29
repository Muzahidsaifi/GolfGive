import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '@/lib/email'

// GET /api/admin/winners — admin: list all winners
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const admin = createAdminClient()
  let query = admin
    .from('winners')
    .select('*, profiles(full_name, email), draws(title, month)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('verification_status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// PATCH /api/admin/winners — admin: approve/reject/mark paid
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { winnerId, action, admin_notes } = body

  const admin = createAdminClient()

  // Fetch winner with profile
  const { data: winner } = await admin
    .from('winners')
    .select('*, profiles(email, full_name)')
    .eq('id', winnerId)
    .single()

  if (!winner) return NextResponse.json({ error: 'Winner not found' }, { status: 404 })

  if (action === 'approve') {
    await admin.from('winners').update({
      verification_status: 'approved',
      admin_notes,
      verified_at: new Date().toISOString(),
    }).eq('id', winnerId)

    if (winner.profiles) {
      await sendVerificationApprovedEmail(
        winner.profiles.email,
        winner.profiles.full_name,
        winner.prize_amount
      )
    }
  } else if (action === 'reject') {
    await admin.from('winners').update({
      verification_status: 'rejected',
      admin_notes,
      verified_at: new Date().toISOString(),
    }).eq('id', winnerId)

    if (winner.profiles) {
      await sendVerificationRejectedEmail(
        winner.profiles.email,
        winner.profiles.full_name,
        admin_notes
      )
    }
  } else if (action === 'mark_paid') {
    await admin.from('winners').update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    }).eq('id', winnerId)
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ message: 'Updated successfully' })
}
