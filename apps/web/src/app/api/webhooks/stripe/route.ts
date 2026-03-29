import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendSubscriptionCancelledEmail } from '@/lib/email'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {

    // ----- Subscription Created -----
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      const plan = sub.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        plan,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        charity_percentage: parseInt(sub.metadata.charity_percentage || '10'),
      }, { onConflict: 'stripe_subscription_id' })

      // Fetch user and send welcome email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (profile) {
        await sendWelcomeEmail(profile.email, profile.full_name)
      }
      break
    }

    // ----- Subscription Updated -----
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({
          status: sub.status as any,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ----- Subscription Deleted / Cancelled -----
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (profile) {
        const endDate = new Date(sub.current_period_end * 1000).toLocaleDateString('en-GB')
        await sendSubscriptionCancelledEmail(profile.email, profile.full_name, endDate)
      }
      break
    }

    // ----- Payment Failed -----
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subId)
      break
    }

    default:
      console.log(`Unhandled webhook event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
