import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, PRO_AI_CALLS_LIMIT, FREE_AI_CALLS_LIMIT } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret || webhookSecret === 'whsec_REPLACE_ME') {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  // Build Stripe lazily so local development can run without billing keys.
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId ?? session.client_reference_id
      if (!userId || session.mode !== 'subscription' || !session.subscription) break

      const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string)
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: 'pro',
          status: 'active',
          stripeCustomerId: session.customer as string,
          stripeSubId: session.subscription as string,
          aiCallsLimit: PRO_AI_CALLS_LIMIT,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
        update: {
          plan: 'pro',
          status: 'active',
          stripeCustomerId: session.customer as string,
          stripeSubId: session.subscription as string,
          aiCallsLimit: PRO_AI_CALLS_LIMIT,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const status = sub.status === 'active' ? 'active' : sub.status
      await prisma.subscription.updateMany({
        where: { stripeSubId: sub.id },
        data: {
          status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubId: sub.id },
        data: {
          plan: 'free',
          status: 'canceled',
          aiCallsLimit: FREE_AI_CALLS_LIMIT,
          cancelAtPeriodEnd: false,
          stripeSubId: null,
        },
      })
      break
    }

    default:
      // Unhandled event type — not an error.
      break
  }

  return NextResponse.json({ received: true })
}
