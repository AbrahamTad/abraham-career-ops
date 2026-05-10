import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const subscription = await prisma.subscription.findUnique({
    where: { userId: auth.dbUserId },
    select: { plan: true, status: true, aiCallsThisMonth: true, aiCallsLimit: true },
  })

  if (!subscription) {
    return NextResponse.json({ plan: 'free', status: 'active', aiCallsThisMonth: 0, aiCallsLimit: 50 })
  }

  return NextResponse.json(subscription)
}
