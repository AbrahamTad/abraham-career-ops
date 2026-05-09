import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeCV } from '@/lib/ai/claude'

export async function POST() {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const cv = await prisma.cV.findFirst({
    where: { userId: auth.dbUserId, isActive: true },
  })
  if (!cv) return NextResponse.json({ error: 'Inget CV hittat. Ladda upp ett CV först.' }, { status: 400 })

  const subscription = await prisma.subscription.findUnique({
    where: { userId: auth.dbUserId },
  })
  if (subscription && subscription.aiCallsThisMonth >= subscription.aiCallsLimit) {
    return NextResponse.json({ error: 'Du har nått din AI-gräns för månaden. Uppgradera till Pro.' }, { status: 429 })
  }

  try {
    const analysisText = await analyzeCV(cv.rawText)
    const parsedData = JSON.parse(analysisText)

    await prisma.cV.update({
      where: { id: cv.id },
      data: { parsedData },
    })

    if (subscription) {
      await prisma.subscription.update({
        where: { userId: auth.dbUserId },
        data: { aiCallsThisMonth: { increment: 1 } },
      })
    }

    // Auto-update profile with extracted data
    if (parsedData.skills?.length || parsedData.targetRoles?.length) {
      await prisma.userProfile.upsert({
        where: { userId: auth.dbUserId },
        create: {
          userId: auth.dbUserId,
          skills: parsedData.skills ?? [],
          targetRoles: parsedData.targetRoles ?? [],
          spokenLanguages: parsedData.spokenLanguages ?? [],
        },
        update: {
          skills: parsedData.skills?.length ? parsedData.skills : undefined,
          targetRoles: parsedData.targetRoles?.length ? parsedData.targetRoles : undefined,
          spokenLanguages: parsedData.spokenLanguages?.length ? parsedData.spokenLanguages : undefined,
        },
      })
    }

    return NextResponse.json({ analysis: parsedData })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI-analys misslyckades' }, { status: 500 })
  }
}
