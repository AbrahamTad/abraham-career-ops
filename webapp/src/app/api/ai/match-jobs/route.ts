import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canUseLocalAIFallback, getFriendlyAIError, matchJobToCv } from '@/lib/ai/service'
import { hasReachedAiLimit } from '@/lib/subscription'

function buildLocalMatch(jobTitle: string, jobDescription: string) {
  const text = jobDescription.toLowerCase()
  const strengths = [
    text.includes('team') || text.includes('samarbete') ? 'Rollen verkar värdera samarbete och kommunikation.' : 'Rollen matchar den sökta yrkesinriktningen.',
    text.includes('junior') || text.includes('trainee') || text.includes('lia') ? 'Annonsen verkar öppen för junior/LIA-profil.' : 'Annonsen kan passa om kraven stämmer med CV:t.',
  ]

  // Local fallback creates a conservative match instead of blocking the workflow.
  return {
    score: text.includes('senior') ? 2.8 : 3.6,
    tier: text.includes('senior') ? 'medium' : 'medium',
    strengths,
    missingSkills: ['Kontrollera annonsens måste-krav manuellt.'],
    recommendations: [`Anpassa CV:t tydligt mot ${jobTitle} och lyft relevanta exempel.`],
    recommendation: 'Möjlig match, men granska annonsen innan ansökan.',
    cvImprovement: 'Lägg till 2-3 konkreta exempel som speglar jobbannonsens viktigaste krav.',
    coverLetterAngle: 'Fokusera på motivation, lärande och praktisk erfarenhet kopplad till rollen.',
    aiSummary: 'Extern AI var inte tillgänglig, så detta är en konservativ lokal matchning.',
    aiReasoning: 'Matchningen bygger på jobbannonsens text och generella signaler, inte full AI-analys.',
    source: 'local-fallback',
  }
}

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
  if (hasReachedAiLimit(subscription)) {
    return NextResponse.json({ error: 'AI-gräns nådd' }, { status: 429 })
  }

  try {
    const matchText = await matchJobToCv(cv.rawText, job.description, job.title)
    const matchData = JSON.parse(matchText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim())

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
        recommendation: matchData.recommendation,
        cvImprovement: matchData.cvImprovement,
        coverLetterAngle: matchData.coverLetterAngle,
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
        recommendation: matchData.recommendation,
        cvImprovement: matchData.cvImprovement,
        coverLetterAngle: matchData.coverLetterAngle,
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
    if (canUseLocalAIFallback(err)) {
      const matchData = buildLocalMatch(job.title, job.description)
      const jobMatch = await prisma.jobMatch.upsert({
        where: { userId_jobListingId: { userId: auth.dbUserId, jobListingId } },
        create: {
          userId: auth.dbUserId,
          jobListingId,
          cvId: cv.id,
          score: matchData.score,
          tier: matchData.tier,
          missingSkills: matchData.missingSkills,
          strengths: matchData.strengths,
          recommendations: matchData.recommendations,
          recommendation: matchData.recommendation,
          cvImprovement: matchData.cvImprovement,
          coverLetterAngle: matchData.coverLetterAngle,
          aiSummary: matchData.aiSummary,
          aiReasoning: matchData.aiReasoning,
          rawAnalysis: matchData,
        },
        update: {
          cvId: cv.id,
          score: matchData.score,
          tier: matchData.tier,
          missingSkills: matchData.missingSkills,
          strengths: matchData.strengths,
          recommendations: matchData.recommendations,
          recommendation: matchData.recommendation,
          cvImprovement: matchData.cvImprovement,
          coverLetterAngle: matchData.coverLetterAngle,
          aiSummary: matchData.aiSummary,
          aiReasoning: matchData.aiReasoning,
          rawAnalysis: matchData,
        },
      })

      return NextResponse.json({ match: jobMatch, fallback: true })
    }

    const { message, status } = getFriendlyAIError(err, 'Matchning misslyckades')
    return NextResponse.json({ error: message }, { status })
  }
}
