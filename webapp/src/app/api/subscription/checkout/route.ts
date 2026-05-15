import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import { getStripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe'

export async function POST() {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  if (!STRIPE_PRO_PRICE_ID || STRIPE_PRO_PRICE_ID === 'price_REPLACE_ME') {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const stripe = getStripe()

  // Create a hosted Stripe checkout session for the logged-in user.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
    customer_email: auth.email,
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/pricing`,
    client_reference_id: auth.dbUserId,
    metadata: { userId: auth.dbUserId },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
