import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { extractTextFromFile, validateCVText, parseCVProfile } from '@/lib/ai/cv-parser'

export async function GET() {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const cv = await prisma.cV.findFirst({
    where: { userId: auth.dbUserId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, fileName: true, rawText: true, createdAt: true, fileSize: true },
  })

  const profile = cv?.rawText ? parseCVProfile(cv.rawText) : null
  return NextResponse.json({ cv, profile })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const contentType = request.headers.get('content-type') ?? ''
  let rawText = ''
  let fileName: string | null = null
  let fileSize: number | null = null
  let mimeType: string | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Ingen fil hittades' }, { status: 400 })

    fileName = file.name
    fileSize = file.size
    mimeType = file.type

    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      rawText = await extractTextFromFile(buffer, file.type)
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Kunde inte läsa filen' }, { status: 400 })
    }
  } else {
    const body = await request.json()
    rawText = body.text as string
    if (!rawText?.trim()) return NextResponse.json({ error: 'Ingen text angiven' }, { status: 400 })
  }

  const validation = validateCVText(rawText)
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })

  const profile = parseCVProfile(rawText)

  // Deactivate old CVs
  await prisma.cV.updateMany({
    where: { userId: auth.dbUserId, isActive: true },
    data: { isActive: false },
  })

  const cv = await prisma.cV.create({
    data: {
      userId: auth.dbUserId,
      fileName,
      fileSize,
      mimeType,
      rawText,
      isActive: true,
    },
  })

  return NextResponse.json({ cv, profile }, { status: 201 })
}

export async function DELETE() {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  await prisma.cV.updateMany({
    where: { userId: auth.dbUserId, isActive: true },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
