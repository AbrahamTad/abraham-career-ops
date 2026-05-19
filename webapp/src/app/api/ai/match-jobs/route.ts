import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeAndSaveJobMatch, buildLocalMatch, saveJobMatch } from '@/lib/ai/aiMatchingService'
import { canUseLocalAIFallback, getFriendlyAIError } from '@/lib/ai/service'
import { hasReachedAiLimit } from '@/lib/subscription'

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
    const jobMatch = await analyzeAndSaveJobMatch(auth.dbUserId, cv, job)

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
      const jobMatch = await saveJobMatch(auth.dbUserId, cv.id, jobListingId, matchData)

      return NextResponse.json({ match: jobMatch, fallback: true })
    }

    const { message, status } = getFriendlyAIError(err, 'Matchning misslyckades')
    return NextResponse.json({ error: message }, { status })
  }
}
