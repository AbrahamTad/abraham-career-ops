import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// Simplified job scanner: hits Greenhouse/Ashby/Lever-style public APIs
// For full Playwright-based scanning, use the CLI tool in the parent project

const SWEDISH_COMPANIES = [
  { name: 'Volvo Cars', greenhouse: 'volvocars' },
  { name: 'Ericsson', greenhouse: 'ericsson' },
  { name: 'Spotify', greenhouse: 'spotify' },
  { name: 'Klarna', greenhouse: 'klarna' },
  { name: 'King', greenhouse: 'king' },
  { name: 'AFRY', lever: 'afry' },
  { name: 'Knowit', lever: 'knowit' },
]

async function fetchGreenhouseJobs(company: string, query: string): Promise<Array<{
  external_id: string; title: string; location: { name: string }; absolute_url: string; updated_at: string
}>> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json() as { jobs?: Array<{ external_id: string; title: string; location: { name: string }; absolute_url: string; updated_at: string }> }
    return (data.jobs ?? []).filter((j) =>
      !query || j.title.toLowerCase().includes(query.toLowerCase())
    )
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const body = await request.json()
  const { query = '', location = '', liaOnly = false } = body

  let count = 0
  const searchTask = await prisma.searchTask.create({
    data: {
      userId: auth.dbUserId,
      type: liaOnly ? 'LIA_SEARCH' : 'JOB_SCAN',
      status: 'RUNNING',
      query: { query, location, liaOnly },
      startedAt: new Date(),
    },
  })

  try {
    for (const co of SWEDISH_COMPANIES) {
      if (!co.greenhouse) continue
      const jobs = await fetchGreenhouseJobs(co.greenhouse, query)

      for (const job of jobs.slice(0, 10)) {
        const companySlug = slugify(co.name)
        const company = await prisma.company.upsert({
          where: { slug: companySlug },
          create: { name: co.name, slug: companySlug },
          update: {},
        })

        const existing = await prisma.jobListing.findFirst({
          where: { externalId: String(job.external_id), sourceAts: 'greenhouse' },
        })
        if (existing) continue

        await prisma.jobListing.create({
          data: {
            companyId: company.id,
            title: job.title,
            description: job.title,
            location: job.location?.name || location || 'Sverige',
            sourceUrl: job.absolute_url,
            sourceAts: 'greenhouse',
            externalId: String(job.external_id),
            isActive: true,
            isLia: liaOnly,
            postedAt: job.updated_at ? new Date(job.updated_at) : null,
          },
        })
        count++
      }
    }

    await prisma.searchTask.update({
      where: { id: searchTask.id },
      data: { status: 'COMPLETED', completedAt: new Date(), results: { count } },
    })
  } catch (err: unknown) {
    await prisma.searchTask.update({
      where: { id: searchTask.id },
      data: { status: 'FAILED', error: err instanceof Error ? err.message : 'Unknown error' },
    })
    return NextResponse.json({ error: 'Scanning misslyckades' }, { status: 500 })
  }

  return NextResponse.json({ count, taskId: searchTask.id })
}
