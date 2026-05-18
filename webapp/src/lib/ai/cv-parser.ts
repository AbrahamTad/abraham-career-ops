// CV text extraction and structured parsing from uploaded files

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8')
  }

  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

export function validateCVText(text: string): { valid: boolean; error?: string } {
  if (text.length < 100) {
    return { valid: false, error: 'CV verkar vara för kort. Kontrollera att filen innehåller text.' }
  }
  if (text.length > 50000) {
    return { valid: false, error: 'CV är för långt. Maximalt 50 000 tecken.' }
  }
  return { valid: true }
}

export interface CVProfile {
  techStack: string[]
  languages: string[]
  isLIAEligible: boolean
  hasQAExperience: boolean
  hasFrontendExperience: boolean
  hasAIExperience: boolean
  educationLevel: 'yh' | 'university' | 'bootcamp' | 'unknown'
  swedishLevel: 'native' | 'b2' | 'b1' | 'none' | 'unknown'
  locationMentioned: string[]
}

const FRONTEND_SIGNALS = ['react', 'typescript', 'javascript', 'next.js', 'vue', 'angular', 'html', 'css', 'tailwind', 'styled components', 'responsive']
const QA_SIGNALS = ['cypress', 'playwright', 'jest', 'testing library', 'qa', 'quality assurance', 'testare', 'e2e', 'end-to-end', 'test automation']
const AI_SIGNALS = ['python', 'machine learning', 'ml', 'ai', 'scikit', 'lightgbm', 'tensorflow', 'pytorch', 'onnx', 'neural', 'llm']
const TECH_KEYWORDS = [
  'react', 'typescript', 'javascript', 'node.js', 'next.js', 'vue', 'angular',
  'html', 'css', 'tailwind', 'cypress', 'playwright', 'jest',
  'python', 'docker', 'aws', 'azure', 'sql', 'graphql', 'rest',
  'git', 'github', 'figma', 'jira', 'prisma', 'sqlite', 'express', 'flask',
  'scikit-learn', 'lightgbm', 'onnx', 'ai', 'ml',
]
const YH_SIGNALS = ['yrkeshögskola', 'yh', 'medieinstitutet', 'lia', 'lärande i arbete']
const SWEDEN_LOCATIONS = ['göteborg', 'stockholm', 'malmö', 'lund', 'uppsala', 'gothenburg', 'sweden', 'sverige']

/**
 * Extract a structured profile from raw CV text.
 * This is purely heuristic — good enough for keyword matching without needing an LLM.
 */
export function parseCVProfile(text: string): CVProfile {
  const lower = text.toLowerCase()

  const techStack = TECH_KEYWORDS.filter((kw) => lower.includes(kw))

  const languages: string[] = []
  if (/\b(swedish|svenska)\b/i.test(text)) languages.push('Swedish')
  if (/\b(english|engelska)\b/i.test(text)) languages.push('English')
  if (/\b(amharic|amhariska)\b/i.test(text)) languages.push('Amharic')
  if (/\b(oromo)\b/i.test(text)) languages.push('Oromo')

  const isLIAEligible = YH_SIGNALS.some((s) => lower.includes(s))
  const hasFrontendExperience = FRONTEND_SIGNALS.filter((s) => lower.includes(s)).length >= 3
  const hasQAExperience = QA_SIGNALS.filter((s) => lower.includes(s)).length >= 2
  const hasAIExperience = AI_SIGNALS.filter((s) => lower.includes(s)).length >= 2

  let educationLevel: CVProfile['educationLevel'] = 'unknown'
  if (YH_SIGNALS.some((s) => lower.includes(s))) educationLevel = 'yh'
  else if (/\b(university|högskola|bachelor|master|bsc|msc)\b/i.test(text)) educationLevel = 'university'
  else if (/\b(bootcamp|academy|coding school)\b/i.test(text)) educationLevel = 'bootcamp'

  let swedishLevel: CVProfile['swedishLevel'] = 'unknown'
  if (/svenska.*\b(native|modersmål|modersmálsspråk)\b/i.test(text)) swedishLevel = 'native'
  else if (/\b(b2|good working|arbets)\b.*sven/i.test(text) || /sven.*\b(b2)\b/i.test(text)) swedishLevel = 'b2'
  else if (/\b(b1|basic|grundläggande)\b.*sven/i.test(text)) swedishLevel = 'b1'
  else if (/\b(swedish|svenska)\b/i.test(text)) swedishLevel = 'b2'

  const locationMentioned = SWEDEN_LOCATIONS.filter((loc) => lower.includes(loc))

  return {
    techStack,
    languages,
    isLIAEligible,
    hasQAExperience,
    hasFrontendExperience,
    hasAIExperience,
    educationLevel,
    swedishLevel,
    locationMentioned,
  }
}
