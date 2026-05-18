const TECH_PATTERNS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Next.js', 'Vue', 'Angular',
  'HTML', 'CSS', 'Tailwind', 'Cypress', 'Playwright', 'Jest', 'Testing Library',
  'Python', 'Azure', 'AWS', 'Docker', 'SQL', 'GraphQL', 'REST', 'AI', 'ML',
];

const SWEDEN_CITIES = [
  'Goteborg', 'Gothenburg', 'Göteborg', 'Stockholm', 'Malmö', 'Malmo', 'Lund',
  'Uppsala', 'Västerås', 'Vasteras', 'Linköping', 'Linkoping', 'Helsingborg',
  'Örebro', 'Orebro', 'Umeå', 'Umea', 'Jönköping', 'Jonkoping', 'Sweden', 'Sverige',
];

export function extractTechStack(text = '') {
  const haystack = text.toLowerCase();
  return TECH_PATTERNS.filter((tech) => haystack.includes(tech.toLowerCase()));
}

export function extractSwedenLocation(text = '') {
  const matches = SWEDEN_CITIES.filter((city) =>
    new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );
  return [...new Set(matches.map((city) => city.replace('Gothenburg', 'Göteborg').replace('Goteborg', 'Göteborg')))];
}

export function extractWorkMode(text = '') {
  const lower = text.toLowerCase();
  if (/\b(remote|distans|remote-first)\b/.test(lower)) return 'Remote';
  if (/\b(hybrid|hybridroll|hybridarbete)\b/.test(lower)) return 'Hybrid';
  if (/\b(on-?site|office|kontor)\b/.test(lower)) return 'On-site';
  return 'Unspecified';
}

const LIA_PATTERN = /\b(lia|praktik|praktikplats|lärande i arbete|internship|trainee|yrkeshögskola|yh-?student)\b/i;
const JUNIOR_PATTERN = /\b(junior|entry.?level|ny.?examinerad|nyexaminerad)\b/i;

/**
 * Extract tech keywords from a raw CV text string.
 * Returns lowercase keywords that appear in the CV.
 */
export function extractCVKeywords(cvText = '') {
  const text = cvText.toLowerCase();
  const found = TECH_PATTERNS.filter((t) => text.includes(t.toLowerCase())).map((t) => t.toLowerCase());

  // Also extract plain language keywords relevant to job matching
  const extraPatterns = [
    'cypress', 'playwright', 'jest', 'testing', 'wcag', 'accessibility',
    'prisma', 'sqlite', 'express', 'flask', 'scikit', 'lightgbm', 'onnx',
    'figma', 'jira', 'scrum', 'agile', 'git', 'github',
  ];
  for (const pat of extraPatterns) {
    if (text.includes(pat) && !found.includes(pat)) found.push(pat);
  }
  return found;
}

/**
 * Score a job against a profile (and optionally a raw CV text).
 *
 * @param {string} jobText - full job description text
 * @param {object} profile - { preferredTech, preferredLocations, avoid }
 * @param {string} [cvText] - raw CV text for deeper skill matching
 */
export function scoreJobAgainstProfile(jobText = '', profile = {}, cvText = '') {
  const text = jobText.toLowerCase();

  const preferredTech = profile.preferredTech
    || ['react', 'typescript', 'javascript', 'cypress', 'playwright', 'ai'];
  const preferredLocations = profile.preferredLocations
    || ['göteborg', 'goteborg', 'gothenburg', 'sweden', 'sverige', 'remote', 'hybrid'];
  const avoid = profile.avoid
    || ['senior only', 'lead', 'manager', 'director', 'java ', '.net', 'php'];

  const techHits = preferredTech.filter((k) => text.includes(k.toLowerCase()));
  const locationHits = preferredLocations.filter((k) => text.includes(k.toLowerCase()));
  const avoidHits = avoid.filter((k) => text.includes(k.toLowerCase()));

  const isLIA = LIA_PATTERN.test(jobText);
  const isJunior = JUNIOR_PATTERN.test(jobText);

  // CV-based bonus: skills mentioned in CV that also appear in the job
  let cvBonus = 0;
  if (cvText) {
    const cvKeywords = extractCVKeywords(cvText);
    const cvHits = cvKeywords.filter((k) => text.includes(k));
    cvBonus = Math.min(0.6, cvHits.length * 0.08);
  }

  // LIA is top priority — give it a strong signal, not a small hint
  const liaBoost = isLIA ? 1.2 : 0;
  const juniorBoost = isJunior && !isLIA ? 0.3 : 0;

  const raw = 2.4
    + Math.min(1.4, techHits.length * 0.28)
    + Math.min(0.7, locationHits.length * 0.2)
    + liaBoost
    + juniorBoost
    + cvBonus
    - avoidHits.length * 0.45;

  const score = Math.max(1, Math.min(5, Number(raw.toFixed(1))));

  return {
    score,
    techStack: extractTechStack(jobText),
    locations: extractSwedenLocation(jobText),
    workMode: extractWorkMode(jobText),
    isLIA,
    isJunior,
    positiveSignals: [...techHits, ...locationHits],
    riskSignals: avoidHits,
    why: explainMatch({ score, techHits, locationHits, avoidHits, isLIA, isJunior, cvBonus }),
  };
}

function explainMatch({ score, techHits, locationHits, avoidHits, isLIA, isJunior, cvBonus }) {
  const reasons = [];
  if (isLIA) reasons.push('is a LIA/praktik/internship opportunity (top priority)');
  else if (isJunior) reasons.push('targets junior/entry-level candidates');
  if (techHits.length) reasons.push(`matches target tech stack: ${techHits.slice(0, 4).join(', ')}`);
  if (locationHits.length) reasons.push('fits Sweden/Göteborg location target');
  if (cvBonus > 0) reasons.push('aligns with skills found in the uploaded CV');
  if (avoidHits.length) reasons.push(`has risk signals: ${avoidHits.join(', ')}`);
  if (!reasons.length) reasons.push('has limited explicit overlap with the configured target profile');
  return `Score ${score}/5 — ${reasons.join('; ')}.`;
}
