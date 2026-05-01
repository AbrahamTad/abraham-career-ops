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

export function scoreJobAgainstProfile(jobText = '', profile = {}) {
  const text = jobText.toLowerCase();
  const preferredTech = profile.preferredTech || ['react', 'typescript', 'javascript', 'cypress', 'playwright', 'ai'];
  const preferredLocations = profile.preferredLocations || ['göteborg', 'goteborg', 'gothenburg', 'sweden', 'sverige', 'remote', 'hybrid'];
  const avoid = profile.avoid || ['senior only', 'lead', 'manager', 'director', 'java ', '.net', 'php'];

  const techHits = preferredTech.filter((keyword) => text.includes(keyword.toLowerCase()));
  const locationHits = preferredLocations.filter((keyword) => text.includes(keyword.toLowerCase()));
  const avoidHits = avoid.filter((keyword) => text.includes(keyword.toLowerCase()));
  const internshipBoost = /\b(lia|praktik|internship|junior)\b/i.test(jobText) ? 0.5 : 0;

  const raw = 2.4 + Math.min(1.4, techHits.length * 0.28) + Math.min(0.7, locationHits.length * 0.2) + internshipBoost - avoidHits.length * 0.45;
  const score = Math.max(1, Math.min(5, Number(raw.toFixed(1))));

  return {
    score,
    techStack: extractTechStack(jobText),
    locations: extractSwedenLocation(jobText),
    workMode: extractWorkMode(jobText),
    positiveSignals: [...techHits, ...locationHits],
    riskSignals: avoidHits,
    why: explainMatch({ score, techHits, locationHits, avoidHits, internshipBoost }),
  };
}

function explainMatch({ score, techHits, locationHits, avoidHits, internshipBoost }) {
  const reasons = [];
  if (techHits.length) reasons.push(`matches Abraham's stack through ${techHits.slice(0, 4).join(', ')}`);
  if (locationHits.length) reasons.push(`fits the Sweden/Göteborg location target`);
  if (internshipBoost) reasons.push('is junior/LIA-friendly');
  if (avoidHits.length) reasons.push(`has risk signals: ${avoidHits.join(', ')}`);
  if (!reasons.length) reasons.push('has limited explicit overlap with the configured target profile');
  return `Score ${score}/5 because it ${reasons.join('; ')}.`;
}
