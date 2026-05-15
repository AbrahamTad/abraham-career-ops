import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { adaptCV, canUseLocalAIFallback, getFriendlyAIError } from '@/lib/ai/service'
import { hasReachedAiLimit } from '@/lib/subscription'

function buildLocalAdaptedCV(cvText: string, jobTitle: string, companyName: string, jobDescription: string) {
  const cvPreview = cvText.replace(/\s+/g, ' ').trim().slice(0, 1800)
  const jobKeywords = Array.from(new Set(jobDescription.match(/\b[A-Za-zÅÄÖåäö0-9+#.]{4,}\b/g) ?? []))
    .slice(0, 12)
    .join(', ')

  // Local fallback keeps export/testing usable when external AI quota is exhausted.
  return `# Anpassat CV - ${jobTitle}

## Målroll
${jobTitle} hos ${companyName}

## Profil
Jag söker rollen som ${jobTitle} och lyfter här fram de delar av min bakgrund som bäst matchar annonsen. Jag har praktisk erfarenhet, stark vilja att lära mig och kan snabbt anpassa mig till arbetsplatsens arbetssätt.

## Relevanta nyckelord från annonsen
${jobKeywords || 'Se jobbannonsen och kontrollera vilka krav arbetsgivaren prioriterar.'}

## Utvald CV-information
${cvPreview}

## Kontroll innan ansökan
- Kontrollera att allt ovan stämmer med din faktiska erfarenhet.
- Lägg till konkreta exempel som matchar ${companyName}s annons.
- Ta bort delar som inte är relevanta för ${jobTitle}.`
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  const { jobTitle, companyName, jobDescription } = await request.json()
  if (!jobTitle || !companyName || !jobDescription) {
    return NextResponse.json({ error: 'jobTitle, companyName och jobDescription krävs' }, { status: 400 })
  }

  const cv = await prisma.cV.findFirst({ where: { userId: auth.dbUserId, isActive: true } })
  if (!cv) return NextResponse.json({ error: 'Inget CV hittat' }, { status: 400 })

  const subscription = await prisma.subscription.findUnique({ where: { userId: auth.dbUserId } })
  if (hasReachedAiLimit(subscription)) {
    return NextResponse.json({ error: 'AI-gräns nådd' }, { status: 429 })
  }

  try {
    const content = await adaptCV(cv.rawText, jobTitle, companyName, jobDescription)

    const saved = await prisma.generatedCV.create({
      data: {
        userId: auth.dbUserId,
        title: `${jobTitle} – ${companyName}`,
        content,
        jobTitle,
        companyName,
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
    if (canUseLocalAIFallback(err)) {
      const content = buildLocalAdaptedCV(cv.rawText, jobTitle, companyName, jobDescription)
      const saved = await prisma.generatedCV.create({
        data: {
          userId: auth.dbUserId,
          title: `${jobTitle} – ${companyName}`,
          content,
          jobTitle,
          companyName,
        },
      })

      return NextResponse.json({ content, id: saved.id, fallback: true })
    }

    const { message, status } = getFriendlyAIError(err, 'Generering misslyckades')
    return NextResponse.json({ error: message }, { status })
  }
}
