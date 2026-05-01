import { compactKey, normalizeKey } from '../../utils/strings.mjs';

export const ROLE_STOPWORDS = new Set([
  'junior', 'mid', 'middle', 'senior', 'staff', 'principal', 'lead', 'head',
  'chief', 'associate', 'intern', 'entry', 'level', 'manager', 'director',
  'remote', 'hybrid', 'onsite', 'contract', 'contractor', 'freelance',
  'fulltime', 'parttime', 'permanent', 'temporary', 'internship',
  'role', 'position', 'opportunity', 'team', 'based', 'engineer', 'engineering',
  'developer', 'utvecklare',
  'goteborg', 'gothenburg', 'stockholm', 'malmo', 'uppsala', 'lund',
  'sweden', 'sverige', 'europe', 'emea', 'apac', 'latam',
  'with', 'from', 'into', 'over', 'this', 'that',
]);

export function normalizeCompany(name = '') {
  return compactKey(name);
}

export function roleTokens(value = '') {
  return normalizeKey(value)
    .split(/\s+/)
    .filter((word) => word.length > 3 && !ROLE_STOPWORDS.has(word));
}

export function roleFuzzyMatch(a = '', b = '') {
  const wordsA = roleTokens(a);
  const wordsB = roleTokens(b);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setB = new Set(wordsB);
  const overlap = wordsA.filter((word) => setB.has(word)).length;
  const ratio = overlap / Math.min(wordsA.length, wordsB.length);

  return overlap >= 2 && ratio >= 0.6;
}

export function parseScore(value = '') {
  const match = String(value).replace(/\*\*/g, '').match(/([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

export function parseApplicationLine(line = '') {
  const parts = line.split('|').map((part) => part.trim());
  if (parts.length < 9) return null;
  const num = Number.parseInt(parts[1], 10);
  if (Number.isNaN(num) || num === 0) return null;
  return {
    num,
    date: parts[2],
    company: parts[3],
    role: parts[4],
    score: parts[5],
    status: parts[6],
    pdf: parts[7],
    report: parts[8],
    notes: parts[9] || '',
    raw: line,
  };
}
