import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const location = searchParams.get('location') ?? ''
  const lia = searchParams.get('lia') === '1'
  const remote = searchParams.get('remote') === '1'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const where: Record<string, unknown> = { isActive: true }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (location) {
    where.location = { contains: location, mode: 'insensitive' }
  }
  if (lia) where.isLia = true
  if (remote) where.isRemote = true

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
    match: j.matches[0] ?? null,
    matches: undefined,
  }))

  return NextResponse.json({ jobs: enriched, total, page, pages: Math.ceil(total / limit) })
}
