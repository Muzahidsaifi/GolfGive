import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer, createCheckoutSession, createPortalSession, PLANS } from '@/lib/stripe'

// POST /api/subscriptions/checkout
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const { plan, charity_id, charity_percentage, action } = body

  // --- Customer Portal ---
  if (action === 'portal') {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const session = await createPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    )

    return NextResponse.json({ url: session.url })
  }

  // --- New Checkout ---
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    profile.email,
    profile.full_name
  )

  const session = await createCheckoutSession({
    customerId,
    priceId: planConfig.priceId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?cancelled=true`,
    metadata: {
      supabase_user_id: user.id,
      charity_id: charity_id || '',
      charity_percentage: String(charity_percentage || 10),
    },
  })

  // Store charity selection immediately
  if (charity_id) {
    await supabase.from('user_charities').upsert({
      user_id: user.id,
      charity_id,
      contribution_percentage: charity_percentage || 10,
    }, { onConflict: 'user_id' })
  }

  return NextResponse.json({ url: session.url })
}
