import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeCV, getFriendlyAIError } from '@/lib/ai/service'

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
    // Claude sometimes wraps JSON in markdown code blocks — strip them
    const cleaned = analysisText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedData: any
    try {
      parsedData = JSON.parse(cleaned)
    } catch {
      // If Claude returns non-parseable output, store a minimal stub so the CV is still usable
      parsedData = { raw: cleaned, parseError: true }
    }

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

    // Auto-update profile with extracted data (only if parsing succeeded)
    const skills = Array.isArray(parsedData.skills) ? parsedData.skills as string[] : []
    const targetRoles = Array.isArray(parsedData.targetRoles) ? parsedData.targetRoles as string[] : []
    const spokenLanguages = Array.isArray(parsedData.spokenLanguages) ? parsedData.spokenLanguages as string[] : []

    if (skills.length || targetRoles.length) {
      await prisma.userProfile.upsert({
        where: { userId: auth.dbUserId },
        create: {
          userId: auth.dbUserId,
          skills,
          targetRoles,
          spokenLanguages,
        },
        update: {
          skills: skills.length ? skills : undefined,
          targetRoles: targetRoles.length ? targetRoles : undefined,
          spokenLanguages: spokenLanguages.length ? spokenLanguages : undefined,
        },
      })
    }

    return NextResponse.json({ analysis: parsedData })
  } catch (err: unknown) {
    const { message, status } = getFriendlyAIError(err, 'AI-analys misslyckades')
    return NextResponse.json({ error: message }, { status })
  }
}
