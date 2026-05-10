import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateJobSearchQueries, getFriendlyAIError, matchJobToCv } from '@/lib/ai/service'
import { searchJobTech, uniqueExternalJobs } from '@/lib/jobs/jobtech'
import { persistExternalJobs } from '@/lib/jobs/persist'

function cleanJson(text: string) {
  return text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim()
}

function uniqueTerms(terms: string[]) {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const term of terms.map((value) => value.trim()).filter(Boolean)) {
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(term)
  }

  return unique.slice(0, 4)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const body = await request.json().catch(() => ({}))
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  let location = typeof body.location === 'string' ? body.location.trim() : ''

  const cv = await prisma.cV.findFirst({ where: { userId: auth.dbUserId, isActive: true } })
  if (!cv) return NextResponse.json({ error: 'Inget CV hittat. Ladda upp ett CV först.' }, { status: 400 })

  const subscription = await prisma.subscription.findUnique({ where: { userId: auth.dbUserId } })
  if (subscription && subscription.aiCallsThisMonth >= subscription.aiCallsLimit) {
    return NextResponse.json({ error: 'AI-gräns nådd för månaden.' }, { status: 429 })
  }

  if (!location) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: auth.dbUserId },
      select: { city: true, location: true },
    })
    location = profile?.city || profile?.location || ''
  }

  let searchData: { titles: string[]; skills: string[]; level: string; summary: string }
  try {
    const raw = await generateJobSearchQueries(cv.rawText)
    searchData = JSON.parse(cleanJson(raw))
  } catch (err: unknown) {
    const { message, status } = getFriendlyAIError(err, 'CV-analys misslyckades')
    return NextResponse.json({ error: `CV-analys misslyckades: ${message}` }, { status })
  }

  if (subscription) {
    await prisma.subscription.update({
      where: { userId: auth.dbUserId },
      data: { aiCallsThisMonth: { increment: 1 } },
    })
  }

  const titleTerms = Array.isArray(searchData.titles) ? searchData.titles : []
  const skillTerms = Array.isArray(searchData.skills) ? searchData.skills.slice(0, 3) : []
  const searchTerms = uniqueTerms([query, ...titleTerms, ...skillTerms])

  const results = await Promise.allSettled(
    searchTerms.map((term) => searchJobTech(term, location, 12))
  )
  const foundJobs = uniqueExternalJobs(results.flatMap((result) => result.status === 'fulfilled' ? result.value : []))
  const externalJobs = foundJobs.slice(0, 30)
  const { ids: jobIds, newCount } = await persistExternalJobs(externalJobs)

  const toMatch = jobIds.slice(0, 2)
  let matchedCount = 0

  for (const jobId of toMatch) {
    const alreadyMatched = await prisma.jobMatch.findUnique({
      where: { userId_jobListingId: { userId: auth.dbUserId, jobListingId: jobId } },
    })
    if (alreadyMatched) continue

    const jobListing = await prisma.jobListing.findUnique({
      where: { id: jobId },
      include: { company: true },
    })
    if (!jobListing || !jobListing.description) continue

    try {
      const matchText = await matchJobToCv(cv.rawText, jobListing.description, jobListing.title)
      const matchData = JSON.parse(cleanJson(matchText))

      await prisma.jobMatch.create({
        data: {
          userId: auth.dbUserId,
          jobListingId: jobId,
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
      matchedCount++
    } catch {
      // Matching failed for this job. Keep the imported listing so the user can still inspect it.
    }
  }

  return NextResponse.json({
    newJobs: newCount,
    totalFound: foundJobs.length,
    imported: jobIds.length,
    autoMatched: matchedCount,
    searchedFor: searchTerms,
    location,
    candidateSummary: searchData.summary,
    source: 'JobTech/Platsbanken',
  })
}
