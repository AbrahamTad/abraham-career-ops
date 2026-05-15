import type { Subscription } from '@prisma/client'

const DEV_AI_CALLS_LIMIT = 500

function usageLimitsDisabled() {
  return process.env.DISABLE_AI_USAGE_LIMITS === 'true'
}

export function getEffectiveAiLimit(subscription: Pick<Subscription, 'aiCallsLimit'> | null) {
  if (usageLimitsDisabled()) return Number.MAX_SAFE_INTEGER

  const storedLimit = subscription?.aiCallsLimit ?? 50

  // Local development gets a larger temporary quota while the product is being tested.
  if (process.env.NODE_ENV !== 'production') {
    return Math.max(storedLimit, Number(process.env.DEV_AI_CALLS_LIMIT ?? DEV_AI_CALLS_LIMIT))
  }

  return storedLimit
}

export function hasReachedAiLimit(subscription: Pick<Subscription, 'aiCallsThisMonth' | 'aiCallsLimit'> | null) {
  if (usageLimitsDisabled()) return false
  if (!subscription) return false
  return subscription.aiCallsThisMonth >= getEffectiveAiLimit(subscription)
}
