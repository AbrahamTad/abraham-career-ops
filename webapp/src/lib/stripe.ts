import Stripe from 'stripe'

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'sk_test_REPLACE_ME') {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }

  return key
}

// Create the Stripe client only when a billing route actually needs it.
export function getStripe() {
  return new Stripe(getStripeSecretKey(), {
    apiVersion: '2025-02-24.acacia',
  })
}

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? ''

export const PRO_AI_CALLS_LIMIT = 200
export const FREE_AI_CALLS_LIMIT = 50
