import { getAIProviderKey, getSelectedAIProvider, type AIProvider } from '@/lib/server/env'
import { gptSw3Provider } from './gptSw3Provider'
import { openaiProvider } from './openaiProvider'
import { AIProviderError, providerLabel, type CompletionRequest, parseProviderError } from './providers'

const ANTHROPIC_VERSION = '2023-06-01'
const ANTHROPIC_MODEL = 'claude-sonnet-4-6'

function selectedProvider(): AIProvider {
  try {
    return getSelectedAIProvider()
  } catch (error) {
    throw new AIProviderError(
      'request_failed',
      'openai',
      error instanceof Error ? error.message : 'Invalid AI provider configuration.'
    )
  }
}

function providerKey(provider: AIProvider): string {
  try {
    return getAIProviderKey(provider)
  } catch {
    const envName =
      provider === 'openai' ? 'OPENAI_API_KEY'
      : provider === 'gpt-sw3' ? 'HUGGINGFACE_API_TOKEN'
      : 'ANTHROPIC_API_KEY'
    throw new AIProviderError(
      'missing_api_key',
      provider,
      `Missing ${envName}.`
    )
  }
}

function canUseProvider(provider: AIProvider): boolean {
  try {
    getAIProviderKey(provider)
    return true
  } catch {
    return false
  }
}

function shouldTryFallback(error: unknown): error is AIProviderError {
  if (!(error instanceof AIProviderError)) return false
  if (error.provider === 'gpt-sw3' && error.code === 'missing_api_key') return true
  if (error.code !== 'request_failed') return false

  // Quota/rate-limit, network, and provider-side errors can use the backup provider.
  return !error.status || error.status === 429 || error.status >= 500
}

function safeLogAIError(error: AIProviderError) {
  console.error('AI provider request failed', {
    provider: error.provider,
    code: error.code,
    status: error.status,
  })
}

export function getFriendlyAIError(error: unknown, fallback = 'AI request failed') {
  if (!(error instanceof AIProviderError)) {
    return { message: fallback, status: 500 }
  }

  safeLogAIError(error)

  if (error.code === 'missing_api_key') {
    return { message: error.message, status: 500 }
  }

  if (error.code === 'invalid_api_key') {
    return {
      message: `Invalid ${providerLabel(error.provider)} API key. Check your environment variables.`,
      status: 401,
    }
  }

  if (!error.status) {
    return {
      message: `Could not reach ${providerLabel(error.provider)}. Check your internet connection, firewall, or provider status.`,
      status: 502,
    }
  }

  if (error.status === 429) {
    return {
      message: `${providerLabel(error.provider)} quota or rate limit reached. Check billing, credits, or rate limits.`,
      status: 429,
    }
  }

  return {
    message: `${providerLabel(error.provider)} request failed. Please try again.`,
    status: error.status && error.status >= 400 && error.status < 500 ? error.status : 502,
  }
}

export function canUseLocalAIFallback(error: unknown) {
  return shouldTryFallback(error)
}

async function requestAnthropic({ system, user, maxTokens }: CompletionRequest): Promise<string> {
  const provider = 'anthropic'
  const apiKey = providerKey(provider)
  let response: Response

  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
  } catch (error) {
    throw new AIProviderError(
      'request_failed',
      provider,
      error instanceof Error ? error.message : 'Anthropic request could not be sent.'
    )
  }

  if (!response.ok) {
    const message = await parseProviderError(response)
    throw new AIProviderError(response.status === 401 ? 'invalid_api_key' : 'request_failed', provider, message, response.status)
  }

  const data = await response.json()
  const text = data?.content?.find((item: { type?: string }) => item.type === 'text')?.text
  if (typeof text !== 'string') {
    throw new AIProviderError('request_failed', provider, 'Unexpected Anthropic response format.')
  }

  return text
}

function completeWithProvider(provider: AIProvider, request: CompletionRequest): Promise<string> {
  if (provider === 'gpt-sw3') return gptSw3Provider(request)
  if (provider === 'anthropic') return requestAnthropic(request)
  return openaiProvider(request)
}

async function complete(request: CompletionRequest): Promise<string> {
  const preferredProvider = selectedProvider()
  const providers = [
    preferredProvider,
    ...(preferredProvider !== 'openai' && canUseProvider('openai') ? ['openai' as const] : []),
  ]

  let lastError: unknown
  for (const provider of providers) {
    try {
      // Await here so provider quota/network errors are caught and can fall back cleanly.
      return await completeWithProvider(provider, request)
    } catch (error) {
      lastError = error
      const canRetryWithNextProvider = provider !== providers[providers.length - 1] && shouldTryFallback(error)

      if (!canRetryWithNextProvider) break

      console.warn('AI provider failed; trying fallback provider', {
        provider,
        fallbackProvider: providers[providers.indexOf(provider) + 1],
        status: error instanceof AIProviderError ? error.status : undefined,
      })
    }
  }

  throw lastError
}

export async function analyzeCV(cvText: string): Promise<string> {
  return complete({
    maxTokens: 2048,
    system: `You are an expert CV analyzer covering all Swedish job market sectors: IT/tech, healthcare (vård/omsorg), education (utbildning), trades (yrkesarbeten), transport, and office/economy roles.
Extract structured information and return ONLY valid JSON:
{
  "skills": ["technical and professional skills"],
  "tools": ["specific tools, software, systems used"],
  "languages": ["programming/technical languages"],
  "spokenLanguages": ["human languages: Swedish, English, Arabic, etc."],
  "education": [{"degree": "", "field": "", "institution": "", "year": ""}],
  "experience": [{"title": "", "company": "", "duration": "", "highlights": []}],
  "projects": [{"name": "", "description": "", "technologies": []}],
  "summary": "2-sentence plain language summary",
  "targetRoles": ["3-6 Swedish AND English job title keywords matching their background, e.g. 'Frontendutvecklare', 'Frontend Developer', 'QA Testare', 'Undersköterska'"],
  "seniorityLevel": "junior|mid|senior",
  "isLIAEligible": true/false,
  "sectors": ["it", "healthcare", "education", "trades", "office"]
}
Include Swedish job titles in targetRoles — they are critical for Swedish job searches.`,
    user: `Analyze this CV and return structured JSON:\n\n${cvText}`,
  })
}

export async function matchJobToCv(cvText: string, jobDescription: string, jobTitle: string): Promise<string> {
  return complete({
    maxTokens: 2048,
    system: `You are an expert career coach and recruiter. Evaluate how well a candidate's CV matches a job description.
Use clear, natural language. Be specific and practical, not generic or robotic.
Reason across CV summary, education, real experience, projects, skills, tools, spoken languages, LIA/internship dates, job title, description, explicit requirements, location, remote/on-site preference, employer context, and junior/student suitability.
Return ONLY a JSON object with:
{
  "score": 0.0-5.0,
  "tier": "strong|medium|weak",
  "reason": "one grounded paragraph explaining the match",
  "strengths": ["list of matching strengths"],
  "missingSkills": ["skills the candidate lacks"],
  "recommendations": ["specific human-readable suggestions to improve the application"],
  "recommendation": "short final recommendation for whether to apply",
  "cvImprovement": "one concrete way to improve the CV for this job",
  "suggestedCvImprovements": ["2-4 concrete CV edits for this job"],
  "coverLetterAngle": "suggested cover letter angle grounded in the CV",
  "aiSummary": "2-3 natural sentences explaining the match in plain language",
  "aiReasoning": "one grounded paragraph with concrete evidence from the CV and job ad"
}
Score guide: 4.5-5.0 = exceptional, 4.0-4.4 = strong, 3.0-3.9 = medium, below 3.0 = weak.`,
    user: `Job: ${jobTitle}\n\nJob Description:\n${jobDescription}\n\nCandidate CV:\n${cvText}`,
  })
}

export async function generateCoverLetter(
  cvText: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  language: 'en' | 'sv' = 'sv',
  tone: string = 'professional'
): Promise<string> {
  const langInstruction = language === 'sv'
    ? 'Write the cover letter in Swedish (Svenska).'
    : 'Write the cover letter in English.'

  return complete({
    maxTokens: 1024,
    system: `You are an expert cover letter writer. Create a tailored, honest, and compelling cover letter based only on the candidate's actual experience. ${langInstruction} Tone: ${tone}. Do NOT invent experience or skills not present in the CV.`,
    user: `Write a cover letter for:\nJob: ${jobTitle} at ${companyName}\n\nJob Description:\n${jobDescription}\n\nCandidate CV:\n${cvText}`,
  })
}

export async function adaptCV(
  cvText: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string
): Promise<string> {
  return complete({
    maxTokens: 3072,
    system: `You are a senior CV writer and career coach. Adapt the candidate's CV to the job posting in a warm, natural, human voice.

Rules:
- Keep every claim honest and grounded in the original CV. Do not invent jobs, certificates, education, employers, dates, tools, languages, or metrics.
- Rewrite in natural language that sounds like a real person, not a template and not AI-generated.
- Prefer simple, confident sentences over buzzwords.
- Mirror important words from the job ad only when they genuinely fit the candidate's experience.
- Reorder and emphasize the most relevant experience for this exact role.
- Keep the candidate's personality and practical strengths visible.
- Remove vague filler such as "dynamic", "passionate", "results-driven", "leveraging", and "proven track record" unless the original CV uses them naturally.
- If the job ad is Swedish, write the adapted CV in Swedish. If the job ad is English, write it in English.
- Return only the complete adapted CV in clean markdown.
- Do not add explanation sections such as "Anpassning för rollen", "Tailoring for this role", notes, comments, or analysis. The output must be ready to send to an employer.`,
    user: `Adapt this CV for: ${jobTitle} at ${companyName}\n\nJob Description:\n${jobDescription}\n\nOriginal CV:\n${cvText}`,
  })
}

export async function generateJobSearchQueries(cvText: string): Promise<string> {
  return complete({
    maxTokens: 768,
    system: `You are a Swedish job search assistant. Read the candidate's CV and extract search queries for the Swedish job market.
Return ONLY a JSON object:
{
  "titles": ["6-8 job title search terms mixing Swedish and English, e.g. 'Frontendutvecklare', 'Frontend Developer', 'QA Testare', 'Undersköterska' — include Swedish titles as Platsbanken uses them"],
  "skills": ["top 6 skills from the CV most relevant for job matching"],
  "level": "junior|mid|senior",
  "isLIAEligible": true/false,
  "liaTerms": ["2-3 LIA/praktik search terms if the candidate is a YH student, e.g. 'LIA frontendutvecklare', 'praktik QA testare'"],
  "summary": "one sentence describing the candidate"
}
IMPORTANT: Always include Swedish job title terms — these are essential for Swedish Platsbanken searches.`,
    user: `Extract Swedish job search queries from this CV:\n\n${cvText}`,
  })
}

export async function discoverCompanies(
  cvText: string,
  targetRole: string,
  location: string,
  liaFocus: boolean = false
): Promise<string> {
  const context = liaFocus
    ? 'The candidate is looking for LIA (internship) placements at Swedish companies, even if they do not have open job postings.'
    : 'The candidate is actively job searching.'

  return complete({
    maxTokens: 2048,
    system: `You are a company discovery AI helping job seekers find relevant employers. ${context}
Return a JSON array of companies:
[{
  "name": "",
  "domain": "",
  "industry": "",
  "size": "",
  "location": "",
  "reason": "why this company is a good fit",
  "careerPageUrl": "",
  "linkedinUrl": "",
  "outreachMessage": "short personalized outreach message"
}]`,
    user: `Find relevant companies for:\nRole: ${targetRole}\nLocation: ${location}\n\nCandidate CV:\n${cvText.slice(0, 3000)}`,
  })
}
