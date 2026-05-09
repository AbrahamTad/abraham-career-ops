import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function analyzeCV(cvText: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert CV analyzer. Extract structured information from the CV text and return it as valid JSON.
Return ONLY a JSON object with these fields:
{
  "skills": [],
  "tools": [],
  "languages": [],
  "spokenLanguages": [],
  "education": [{"degree": "", "field": "", "institution": "", "year": ""}],
  "experience": [{"title": "", "company": "", "duration": "", "highlights": []}],
  "projects": [{"name": "", "description": "", "technologies": []}],
  "summary": "",
  "targetRoles": [],
  "seniorityLevel": "junior|mid|senior"
}`,
    messages: [
      {
        role: 'user',
        content: `Analyze this CV and return structured JSON:\n\n${cvText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

export async function matchJobToCv(cvText: string, jobDescription: string, jobTitle: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert job matching AI. Evaluate how well a candidate's CV matches a job description.
Return ONLY a JSON object with:
{
  "score": 0.0-5.0,
  "tier": "strong|medium|weak",
  "strengths": ["list of matching strengths"],
  "missingSkills": ["skills the candidate lacks"],
  "recommendations": ["specific suggestions to improve the application"],
  "aiSummary": "2-3 sentence summary of the match",
  "aiReasoning": "detailed reasoning paragraph"
}
Score guide: 4.5-5.0 = exceptional, 4.0-4.4 = strong, 3.0-3.9 = medium, below 3.0 = weak.`,
    messages: [
      {
        role: 'user',
        content: `Job: ${jobTitle}\n\nJob Description:\n${jobDescription}\n\nCandidate CV:\n${cvText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
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

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are an expert cover letter writer. Create a tailored, honest, and compelling cover letter based only on the candidate's actual experience. ${langInstruction} Tone: ${tone}. Do NOT invent experience or skills not present in the CV.`,
    messages: [
      {
        role: 'user',
        content: `Write a cover letter for:\nJob: ${jobTitle} at ${companyName}\n\nJob Description:\n${jobDescription}\n\nCandidate CV:\n${cvText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

export async function adaptCV(
  cvText: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert CV writer. Adapt the candidate's CV to better match the job posting, keeping all content honest. Improve wording, reorder bullet points to highlight relevant experience, and emphasize matching skills. Return the full adapted CV in markdown format.`,
    messages: [
      {
        role: 'user',
        content: `Adapt this CV for: ${jobTitle} at ${companyName}\n\nJob Description:\n${jobDescription}\n\nOriginal CV:\n${cvText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
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

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
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
    messages: [
      {
        role: 'user',
        content: `Find relevant companies for:\nRole: ${targetRole}\nLocation: ${location}\n\nCandidate CV:\n${cvText.slice(0, 3000)}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
