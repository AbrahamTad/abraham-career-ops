import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { matchJobToCv } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const { jobListingId } = await request.json()
  if (!jobListingId) return NextResponse.json({ error: 'jobListingId krävs' }, { status: 400 })

  const [cv, job] = await Promise.all([
    prisma.cV.findFirst({ where: { userId: auth.dbUserId, isActive: true } }),
    prisma.jobListing.findUnique({ where: { id: jobListingId }, include: { company: true } }),
  ])

  if (!cv) return NextResponse.json({ error: 'Inget CV hittat' }, { status: 400 })
  if (!job) return NextResponse.json({ error: 'Jobbet hittades inte' }, { status: 404 })

  const subscription = await prisma.subscription.findUnique({
    where: { userId: auth.dbUserId },
  })
  if (subscription && subscription.aiCallsThisMonth >= subscription.aiCallsLimit) {
    return NextResponse.json({ error: 'AI-gräns nådd' }, { status: 429 })
  }

  try {
    const matchText = await matchJobToCv(cv.rawText, job.description, job.title)
    const matchData = JSON.parse(matchText)

    const jobMatch = await prisma.jobMatch.upsert({
      where: { userId_jobListingId: { userId: auth.dbUserId, jobListingId } },
      create: {
        userId: auth.dbUserId,
        jobListingId,
        cvId: cv.id,
        score: matchData.score,
        tier: matchData.tier,
        missingSkills: matchData.missingSkills ?? [],
        strengths: matchData.strengths ?? [],
        recommendations: matchData.recommendations ?? [],
        aiSummary: matchData.aiSummary,
        aiReasoning: matchData.aiReasoning,
        rawAnalysis: matchData,
      },
      update: {
        cvId: cv.id,
        score: matchData.score,
        tier: matchData.tier,
        missingSkills: matchData.missingSkills ?? [],
        strengths: matchData.strengths ?? [],
        recommendations: matchData.recommendations ?? [],
        aiSummary: matchData.aiSummary,
        aiReasoning: matchData.aiReasoning,
        rawAnalysis: matchData,
      },
    })

    if (subscription) {
      await prisma.subscription.update({
        where: { userId: auth.dbUserId },
        data: { aiCallsThisMonth: { increment: 1 } },
      })
    }

    return NextResponse.json({ match: jobMatch })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Matchning misslyckades' }, { status: 500 })
  }
}
