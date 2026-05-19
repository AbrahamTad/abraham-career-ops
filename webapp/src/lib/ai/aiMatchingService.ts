import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { matchJobToCv } from './service'

type MatchTier = 'strong' | 'medium' | 'weak'

type MatchableJob = Prisma.JobListingGetPayload<{ include: { company: true } }>

export interface JobMatchAnalysis {
  score: number
  tier: MatchTier
  reason: string
  strengths: string[]
  missingSkills: string[]
  recommendations: string[]
  recommendation: string
  cvImprovement: string
  suggestedCvImprovements: string[]
  coverLetterAngle: string
  aiSummary: string
  aiReasoning: string
  source?: string
}

function cleanJson(text: string) {
  return text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim()
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function clampScore(value: unknown) {
  const score = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(score)) return 0
  return Math.max(0, Math.min(5, score))
}

function tierFromScore(score: number): MatchTier {
  if (score >= 4) return 'strong'
  if (score >= 3) return 'medium'
  return 'weak'
}

function normalizeAnalysis(value: Record<string, unknown>): JobMatchAnalysis {
  const score = clampScore(value.score)
  const tier = value.tier === 'strong' || value.tier === 'medium' || value.tier === 'weak'
    ? value.tier
    : tierFromScore(score)
  const reason =
    typeof value.reason === 'string' ? value.reason
    : typeof value.aiReasoning === 'string' ? value.aiReasoning
    : typeof value.aiSummary === 'string' ? value.aiSummary
    : 'Matchningen jämför CV, erfarenhet, kompetenser och jobbannonsens krav.'
  const recommendations = asStringArray(value.recommendations)
  const cvImprovement =
    typeof value.cvImprovement === 'string' ? value.cvImprovement
    : asStringArray(value.suggestedCvImprovements)[0] ?? 'Lyft konkreta exempel som matchar jobbannonsens viktigaste krav.'

  return {
    score,
    tier,
    reason,
    strengths: asStringArray(value.strengths),
    missingSkills: asStringArray(value.missingSkills),
    recommendations,
    recommendation: typeof value.recommendation === 'string' ? value.recommendation : reason,
    cvImprovement,
    suggestedCvImprovements: asStringArray(value.suggestedCvImprovements).length
      ? asStringArray(value.suggestedCvImprovements)
      : [cvImprovement],
    coverLetterAngle: typeof value.coverLetterAngle === 'string' ? value.coverLetterAngle : 'Koppla motivationen till rollen och arbetsgivarens behov.',
    aiSummary: typeof value.aiSummary === 'string' ? value.aiSummary : reason,
    aiReasoning: reason,
    source: typeof value.source === 'string' ? value.source : 'ai-provider',
  }
}

export function parseMatchAnalysis(text: string): JobMatchAnalysis {
  const parsed = JSON.parse(cleanJson(text)) as Record<string, unknown>
  return normalizeAnalysis(parsed)
}

export function buildLocalMatch(jobTitle: string, jobDescription: string): JobMatchAnalysis {
  const text = jobDescription.toLowerCase()
  const senior = text.includes('senior')
  const strengths = [
    text.includes('team') || text.includes('samarbete') ? 'Rollen verkar värdera samarbete och kommunikation.' : 'Rollen matchar den sökta yrkesinriktningen.',
    text.includes('junior') || text.includes('trainee') || text.includes('lia') ? 'Annonsen verkar öppen för junior/LIA-profil.' : 'Annonsen kan passa om kraven stämmer med CV:t.',
  ]

  return {
    score: senior ? 2.8 : 3.6,
    tier: 'medium',
    reason: 'Extern AI var inte tillgänglig, så detta är en konservativ lokal matchning.',
    strengths,
    missingSkills: ['Kontrollera annonsens måste-krav manuellt.'],
    recommendations: [`Anpassa CV:t tydligt mot ${jobTitle} och lyft relevanta exempel.`],
    recommendation: 'Möjlig match, men granska annonsen innan ansökan.',
    cvImprovement: 'Lägg till 2-3 konkreta exempel som speglar jobbannonsens viktigaste krav.',
    suggestedCvImprovements: ['Lägg till 2-3 konkreta exempel som speglar jobbannonsens viktigaste krav.'],
    coverLetterAngle: 'Fokusera på motivation, lärande och praktisk erfarenhet kopplad till rollen.',
    aiSummary: 'Extern AI var inte tillgänglig, så detta är en konservativ lokal matchning.',
    aiReasoning: 'Matchningen bygger på jobbannonsens text och generella signaler, inte full AI-analys.',
    source: 'local-fallback',
  }
}

function buildJobContext(job: MatchableJob) {
  return [
    `Title: ${job.title}`,
    `Employer: ${job.company.name}`,
    `Location: ${job.location ?? job.city ?? 'Not specified'}`,
    job.requirements ? `Requirements: ${job.requirements}` : '',
    `Description: ${job.description}`,
  ].filter(Boolean).join('\n\n')
}

function buildCvContext(rawText: string, parsedData: Prisma.JsonValue | null) {
  const structured = parsedData && typeof parsedData === 'object'
    ? `Structured CV data:\n${JSON.stringify(parsedData).slice(0, 4000)}\n\n`
    : ''

  return `${structured}Raw CV:\n${rawText.slice(0, 12000)}`
}

export async function analyzeJobMatch(cv: { rawText: string; parsedData: Prisma.JsonValue | null }, job: MatchableJob) {
  const matchText = await matchJobToCv(
    buildCvContext(cv.rawText, cv.parsedData),
    buildJobContext(job),
    job.title
  )

  return parseMatchAnalysis(matchText)
}

export async function saveJobMatch(userId: string, cvId: string, jobListingId: string, analysis: JobMatchAnalysis) {
  const rawAnalysis = {
    ...analysis,
    reason: analysis.reason,
    suggestedCvImprovements: analysis.suggestedCvImprovements,
  } as Prisma.InputJsonObject

  return prisma.jobMatch.upsert({
    where: { userId_jobListingId: { userId, jobListingId } },
    create: {
      userId,
      jobListingId,
      cvId,
      score: analysis.score,
      tier: analysis.tier,
      missingSkills: analysis.missingSkills,
      strengths: analysis.strengths,
      recommendations: analysis.recommendations,
      recommendation: analysis.recommendation,
      cvImprovement: analysis.cvImprovement,
      coverLetterAngle: analysis.coverLetterAngle,
      aiSummary: analysis.aiSummary,
      aiReasoning: analysis.aiReasoning,
      rawAnalysis,
    },
    update: {
      cvId,
      score: analysis.score,
      tier: analysis.tier,
      missingSkills: analysis.missingSkills,
      strengths: analysis.strengths,
      recommendations: analysis.recommendations,
      recommendation: analysis.recommendation,
      cvImprovement: analysis.cvImprovement,
      coverLetterAngle: analysis.coverLetterAngle,
      aiSummary: analysis.aiSummary,
      aiReasoning: analysis.aiReasoning,
      rawAnalysis,
    },
  })
}

export async function analyzeAndSaveJobMatch(userId: string, cv: { id: string; rawText: string; parsedData: Prisma.JsonValue | null }, job: MatchableJob) {
  const analysis = await analyzeJobMatch(cv, job)
  return saveJobMatch(userId, cv.id, job.id, analysis)
}
