import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { discoverCompanies } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const { targetRole, location = 'Sverige', liaFocus = false } = await request.json()
  if (!targetRole) return NextResponse.json({ error: 'targetRole krävs' }, { status: 400 })

  const cv = await prisma.cV.findFirst({ where: { userId: auth.dbUserId, isActive: true } })
  if (!cv) return NextResponse.json({ error: 'Inget CV hittat' }, { status: 400 })

  const subscription = await prisma.subscription.findUnique({ where: { userId: auth.dbUserId } })
  if (subscription && subscription.aiCallsThisMonth >= subscription.aiCallsLimit) {
    return NextResponse.json({ error: 'AI-gräns nådd' }, { status: 429 })
  }

  try {
    const result = await discoverCompanies(cv.rawText, targetRole, location, liaFocus)
    const companies = JSON.parse(result)

    if (subscription) {
      await prisma.subscription.update({
        where: { userId: auth.dbUserId },
        data: { aiCallsThisMonth: { increment: 1 } },
      })
    }

    return NextResponse.json({ companies })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sökning misslyckades' }, { status: 500 })
  }
}
