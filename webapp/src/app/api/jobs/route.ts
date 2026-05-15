import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'

function visibleSourceUrl(sourceUrl: string | null, sourceAts: string | null) {
  // Demo rows must never expose fake example.com URLs as real job announcements.
  if (!sourceUrl || sourceAts === 'demo' || sourceUrl.includes('example.com')) return null
  return sourceUrl
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const location = searchParams.get('location') ?? ''
  const ids = searchParams.get('ids')?.split(',').map((id) => id.trim()).filter(Boolean) ?? []
  const lia = searchParams.get('lia') === '1'
  const remote = searchParams.get('remote') === '1'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const wholeSweden = ['sverige', 'sweden', 'hela sverige'].includes(location.trim().toLowerCase())
  const where: Record<string, unknown> = {
    isActive: true,
    NOT: { sourceAts: 'demo' },
  }

  if (ids.length) {
    // Loading exact imported IDs avoids hiding fresh AI results behind active filters.
    where.id = { in: ids.slice(0, 50) }
  } else if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (!ids.length && location && !wholeSweden) {
    where.location = { contains: location, mode: 'insensitive' }
  }
  if (!ids.length && lia) where.isLia = true
  if (!ids.length && remote) where.isRemote = true

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      include: {
        company: { select: { name: true, logoUrl: true } },
        matches: {
          where: { userId: auth.dbUserId },
          select: { score: true, tier: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.jobListing.count({ where }),
  ])

  const enriched = jobs.map((j) => ({
    ...j,
    sourceUrl: visibleSourceUrl(j.sourceUrl, j.sourceAts),
    match: j.matches[0] ?? null,
    matches: undefined,
  }))

  return NextResponse.json({ jobs: enriched, total, page, pages: Math.ceil(total / limit) })
}
