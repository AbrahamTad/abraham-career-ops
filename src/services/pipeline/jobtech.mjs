/**
 * jobtech.mjs — Arbetsförmedlingen / JobTech Dev API client
 *
 * Uses Sweden's free public job search API (no auth required).
 * API docs: https://jobsearch.api.jobtechdev.se/
 *
 * Searches Platsbanken for frontend, QA, junior, and LIA/praktik roles
 * in Göteborg (municipality 1480) and the broader Västra Götaland region.
 */

const BASE_URL = 'https://jobsearch.api.jobtechdev.se/search';
const FETCH_TIMEOUT_MS = 12_000;

// Göteborg municipality code in Platsbanken taxonomy
const MUNICIPALITY_GOTHENBURG = '1480';
// Västra Götaland region code
const REGION_VASTRA_GOTALAND = '23';

/**
 * All search queries to run. Each hits a distinct slice of the job market.
 * Keeping these focused avoids pulling thousands of irrelevant results.
 */
export const JOBTECH_QUERIES = [
  // LIA / praktik — top priority
  { q: 'LIA frontend', municipality: MUNICIPALITY_GOTHENBURG, label: 'LIA frontend Göteborg' },
  { q: 'LIA webbutvecklare', municipality: MUNICIPALITY_GOTHENBURG, label: 'LIA webbutvecklare Göteborg' },
  { q: 'praktik frontendutvecklare', municipality: MUNICIPALITY_GOTHENBURG, label: 'praktik frontend Göteborg' },
  { q: 'LIA yrkeshögskola IT', region: REGION_VASTRA_GOTALAND, label: 'LIA YH IT Västra Götaland' },
  { q: 'internship frontend developer', municipality: MUNICIPALITY_GOTHENBURG, label: 'internship frontend Göteborg' },

  // Junior frontend
  { q: 'junior frontendutvecklare', municipality: MUNICIPALITY_GOTHENBURG, label: 'junior frontend Göteborg' },
  { q: 'frontendutvecklare React', municipality: MUNICIPALITY_GOTHENBURG, label: 'frontend React Göteborg' },
  { q: 'webbutvecklare TypeScript', municipality: MUNICIPALITY_GOTHENBURG, label: 'webbutvecklare TS Göteborg' },
  { q: 'frontend developer React', municipality: MUNICIPALITY_GOTHENBURG, label: 'frontend React (EN) Göteborg' },

  // QA / test automation
  { q: 'testare QA Cypress', municipality: MUNICIPALITY_GOTHENBURG, label: 'QA Cypress Göteborg' },
  { q: 'test automation junior', region: REGION_VASTRA_GOTALAND, label: 'test automation VG' },

  // Remote-friendly
  { q: 'frontendutvecklare distans', label: 'frontend distans Sverige' },
  { q: 'junior frontend developer remote', label: 'junior frontend remote Sverige' },
];

/**
 * Fetch a single JobTech query. Returns parsed job objects.
 *
 * @param {object} query - { q, municipality?, region?, label }
 * @param {number} limit - max results per query (API max is 100)
 */
export async function fetchJobtechQuery(query, limit = 25) {
  const params = new URLSearchParams({
    q: query.q,
    limit: String(limit),
    offset: '0',
  });

  if (query.municipality) params.set('municipality-id', query.municipality);
  else if (query.region) params.set('region-id', query.region);

  const url = `${BASE_URL}?${params}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return parseJobtechResponse(json, query.label);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse the JobTech API response into the standard offer shape.
 */
function parseJobtechResponse(json, queryLabel) {
  const hits = json.hits || [];
  return hits.map((hit) => ({
    title: hit.headline || '',
    url: hit.webpage_url || hit.application_url || '',
    company: hit.employer?.name || '',
    location: hit.workplace_address?.municipality || hit.workplace_address?.city || '',
    source: `jobtech-api:${queryLabel}`,
    description: hit.description?.text_formatted?.slice(0, 500) || '',
    publishedAt: hit.publication_date || '',
    isLIA: /\b(lia|praktik|lärande i arbete|internship|trainee)\b/i.test(hit.headline + ' ' + (hit.description?.text || '')),
  })).filter((j) => j.url && j.title);
}

/**
 * Run all configured queries and return deduplicated offers.
 * Deduplication is by URL only — the caller handles cross-source dedup.
 */
export async function scanAllJobtech(limit = 25) {
  const seen = new Set();
  const offers = [];
  const errors = [];

  for (const query of JOBTECH_QUERIES) {
    try {
      const results = await fetchJobtechQuery(query, limit);
      for (const offer of results) {
        if (!seen.has(offer.url)) {
          seen.add(offer.url);
          offers.push(offer);
        }
      }
    } catch (err) {
      errors.push({ query: query.label, error: err.message });
    }
  }

  return { offers, errors };
}
