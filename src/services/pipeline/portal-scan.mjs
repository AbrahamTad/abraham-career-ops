import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { extractHttpUrls, normalizeJobUrl } from '../../utils/url.mjs';

const require = createRequire(import.meta.url);

export const DEFAULT_SCAN_PATHS = {
  portals: 'portals.yml',
  scanHistory: 'data/scan-history.tsv',
  pipeline: 'data/pipeline.md',
  applications: 'data/applications.md',
};

export function detectApi(company = {}) {
  if (company.api && company.api.includes('greenhouse')) {
    return { type: 'greenhouse', url: company.api };
  }

  const url = company.careers_url || '';
  const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/);
  if (ashbyMatch) {
    return { type: 'ashby', url: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}?includeCompensation=true` };
  }

  const leverMatch = url.match(/jobs\.lever\.co\/([^/?#]+)/);
  if (leverMatch) {
    return { type: 'lever', url: `https://api.lever.co/v0/postings/${leverMatch[1]}` };
  }

  const ghEuMatch = url.match(/job-boards(?:\.eu)?\.greenhouse\.io\/([^/?#]+)/);
  if (ghEuMatch && !company.api) {
    return { type: 'greenhouse', url: `https://boards-api.greenhouse.io/v1/boards/${ghEuMatch[1]}/jobs` };
  }

  return null;
}

export function parseGreenhouse(json, companyName) {
  return (json.jobs || []).map((job) => ({
    title: job.title || '',
    url: normalizeJobUrl(job.absolute_url || '') || '',
    company: companyName,
    location: job.location?.name || '',
  }));
}

export function parseAshby(json, companyName) {
  return (json.jobs || []).map((job) => ({
    title: job.title || '',
    url: normalizeJobUrl(job.jobUrl || '') || '',
    company: companyName,
    location: job.location || '',
  }));
}

export function parseLever(json, companyName) {
  if (!Array.isArray(json)) return [];
  return json.map((job) => ({
    title: job.text || '',
    url: normalizeJobUrl(job.hostedUrl || '') || '',
    company: companyName,
    location: job.categories?.location || '',
  }));
}

export const PARSERS = { greenhouse: parseGreenhouse, ashby: parseAshby, lever: parseLever };

export function buildTitleFilter(titleFilter = {}) {
  const positive = (titleFilter.positive || []).map((keyword) => keyword.toLowerCase());
  const negative = (titleFilter.negative || []).map((keyword) => keyword.toLowerCase());

  return (title = '') => {
    const lower = title.toLowerCase();
    const hasPositive = positive.length === 0 || positive.some((keyword) => lower.includes(keyword));
    const hasNegative = negative.some((keyword) => lower.includes(keyword));
    return hasPositive && !hasNegative;
  };
}

export function loadSeenUrls(paths = DEFAULT_SCAN_PATHS) {
  const seen = new Set();

  if (existsSync(paths.scanHistory)) {
    const lines = readFileSync(paths.scanHistory, 'utf-8').split('\n');
    for (const line of lines.slice(1)) {
      const url = normalizeJobUrl(line.split('\t')[0] || '');
      if (url) seen.add(url);
    }
  }

  if (existsSync(paths.pipeline)) {
    const text = readFileSync(paths.pipeline, 'utf-8');
    for (const url of extractHttpUrls(text)) seen.add(url);
  }

  if (existsSync(paths.applications)) {
    const text = readFileSync(paths.applications, 'utf-8');
    for (const url of extractHttpUrls(text)) seen.add(url);
  }

  return seen;
}

export function loadSeenCompanyRoles(applicationsPath = DEFAULT_SCAN_PATHS.applications) {
  const seen = new Set();
  if (!existsSync(applicationsPath)) return seen;

  const text = readFileSync(applicationsPath, 'utf-8');
  for (const match of text.matchAll(/\|[^|]+\|[^|]+\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g)) {
    const company = match[1].trim().toLowerCase();
    const role = match[2].trim().toLowerCase();
    if (company && role && company !== 'company') seen.add(`${company}::${role}`);
  }
  return seen;
}

export async function fetchJson(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function parallelLimit(tasks, limit) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex++];
      results.push(await task());
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

export function appendToPipeline(offers, pipelinePath = DEFAULT_SCAN_PATHS.pipeline) {
  if (offers.length === 0) return;

  let text = existsSync(pipelinePath)
    ? readFileSync(pipelinePath, 'utf-8')
    : '# Pipeline - Pending Evaluations\n\n## Pendientes\n\n## Procesadas\n';

  const marker = '## Pendientes';
  const idx = text.indexOf(marker);
  const block = '\n' + offers.map((offer) => `- [ ] ${offer.url} | ${offer.company} | ${offer.title}`).join('\n') + '\n';

  if (idx === -1) {
    text += `\n${marker}\n${block}`;
  } else {
    const afterMarker = idx + marker.length;
    const nextSection = text.indexOf('\n## ', afterMarker);
    const insertAt = nextSection === -1 ? text.length : nextSection;
    text = text.slice(0, insertAt) + block + text.slice(insertAt);
  }

  writeFileSync(pipelinePath, text, 'utf-8');
}

export function appendToScanHistory(offers, date, scanHistoryPath = DEFAULT_SCAN_PATHS.scanHistory) {
  if (!existsSync(scanHistoryPath)) {
    writeFileSync(scanHistoryPath, 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n', 'utf-8');
  }

  const lines = offers
    .map((offer) => `${offer.url}\t${date}\t${offer.source}\t${offer.title}\t${offer.company}\tadded`)
    .join('\n') + '\n';

  appendFileSync(scanHistoryPath, lines, 'utf-8');
}

export function loadPortalConfig(path = DEFAULT_SCAN_PATHS.portals) {
  if (!existsSync(path)) throw new Error('portals.yml not found. Run onboarding first.');
  const yaml = require('js-yaml');
  return yaml.load(readFileSync(path, 'utf-8'));
}

export function ensureScanDirs() {
  mkdirSync('data', { recursive: true });
}
