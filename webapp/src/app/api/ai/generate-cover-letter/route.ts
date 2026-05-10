import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateCoverLetter, getFriendlyAIError } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const body = await request.json()
  const { jobTitle, companyName, jobDescription, language = 'sv', tone = 'professional' } = body

  if (!jobTitle || !companyName || !jobDescription) {
    return NextResponse.json({ error: 'jobTitle, companyName och jobDescription krävs' }, { status: 400 })
  }

  const cv = await prisma.cV.findFirst({ where: { userId: auth.dbUserId, isActive: true } })
  if (!cv) return NextResponse.json({ error: 'Inget CV hittat. Ladda upp ett CV först.' }, { status: 400 })

  const subscription = await prisma.subscription.findUnique({ where: { userId: auth.dbUserId } })
  if (subscription && subscription.aiCallsThisMonth >= subscription.aiCallsLimit) {
    return NextResponse.json({ error: 'AI-gräns nådd' }, { status: 429 })
  }

  try {
    const content = await generateCoverLetter(cv.rawText, jobTitle, companyName, jobDescription, language as 'en' | 'sv', tone)

    const saved = await prisma.coverLetter.create({
      data: {
        userId: auth.dbUserId,
        title: `${jobTitle} – ${companyName}`,
        content,
        jobTitle,
        companyName,
        language,
        tone,
      },
    })

    if (subscription) {
      await prisma.subscription.update({
        where: { userId: auth.dbUserId },
        data: { aiCallsThisMonth: { increment: 1 } },
      })
    }

    return NextResponse.json({ content, id: saved.id })
  } catch (err: unknown) {
    const { message, status } = getFriendlyAIError(err, 'Generering misslyckades')
    return NextResponse.json({ error: message }, { status })
  }
}
