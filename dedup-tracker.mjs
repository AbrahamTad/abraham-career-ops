#!/usr/bin/env node
/**
 * dedup-tracker.mjs - Remove duplicate entries from applications.md
 *
 * Run: node dedup-tracker.mjs [--dry-run]
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  normalizeCompany,
  parseApplicationLine,
  parseScore,
  roleFuzzyMatch,
} from './src/services/tracking/tracker-utils.mjs';

const CAREER_OPS = dirname(fileURLToPath(import.meta.url));
const APPS_FILE = existsSync(join(CAREER_OPS, 'data/applications.md'))
  ? join(CAREER_OPS, 'data/applications.md')
  : join(CAREER_OPS, 'applications.md');
const DRY_RUN = process.argv.includes('--dry-run');

const STATUS_RANK = {
  skip: 0,
  discarded: 0,
  rejected: 1,
  evaluated: 2,
  applied: 3,
  responded: 4,
  interview: 5,
  offer: 6,
  no_aplicar: 0,
  'no aplicar': 0,
  descartado: 0,
  descartada: 0,
  rechazado: 1,
  rechazada: 1,
  evaluada: 2,
  aplicado: 3,
  respondido: 4,
  entrevista: 5,
  oferta: 6,
};

mkdirSync(join(CAREER_OPS, 'data'), { recursive: true });

if (!existsSync(APPS_FILE)) {
  console.log('No applications.md found. Nothing to dedup.');
  process.exit(0);
}

const content = readFileSync(APPS_FILE, 'utf-8');
const lines = content.split('\n');
const entries = [];
const entryLineMap = new Map();

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('|')) continue;
  const app = parseApplicationLine(lines[i]);
  if (app && app.num > 0) {
    entries.push(app);
    entryLineMap.set(app.num, i);
  }
}

console.log(`${entries.length} entries loaded`);

const groups = new Map();
for (const entry of entries) {
  const key = normalizeCompany(entry.company);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(entry);
}

let removed = 0;
const linesToRemove = new Set();

for (const companyEntries of groups.values()) {
  if (companyEntries.length < 2) continue;

  const processed = new Set();
  for (let i = 0; i < companyEntries.length; i++) {
    if (processed.has(i)) continue;
    const cluster = [companyEntries[i]];
    processed.add(i);

    for (let j = i + 1; j < companyEntries.length; j++) {
      if (processed.has(j)) continue;
      if (roleFuzzyMatch(companyEntries[i].role, companyEntries[j].role)) {
        cluster.push(companyEntries[j]);
        processed.add(j);
      }
    }

    if (cluster.length < 2) continue;

    cluster.sort((a, b) => parseScore(b.score) - parseScore(a.score));
    const keeper = cluster[0];
    let bestStatusRank = STATUS_RANK[keeper.status.toLowerCase()] || 0;
    let bestStatus = keeper.status;

    for (const candidate of cluster.slice(1)) {
      const rank = STATUS_RANK[candidate.status.toLowerCase()] || 0;
      if (rank > bestStatusRank) {
        bestStatusRank = rank;
        bestStatus = candidate.status;
      }
    }

    if (bestStatus !== keeper.status) {
      const lineIdx = entryLineMap.get(keeper.num);
      if (lineIdx !== undefined) {
        const parts = lines[lineIdx].split('|').map((part) => part.trim());
        parts[6] = bestStatus;
        lines[lineIdx] = '| ' + parts.slice(1, -1).join(' | ') + ' |';
        console.log(`#${keeper.num}: status promoted to "${bestStatus}"`);
      }
    }

    for (const duplicate of cluster.slice(1)) {
      const lineIdx = entryLineMap.get(duplicate.num);
      if (lineIdx !== undefined) {
        linesToRemove.add(lineIdx);
        removed++;
        console.log(`Remove #${duplicate.num} (${duplicate.company} - ${duplicate.role}) -> kept #${keeper.num}`);
      }
    }
  }
}

for (const idx of [...linesToRemove].sort((a, b) => b - a)) {
  lines.splice(idx, 1);
}

console.log(`\n${removed} duplicates removed`);

if (!DRY_RUN && removed > 0) {
  copyFileSync(APPS_FILE, `${APPS_FILE}.bak`);
  writeFileSync(APPS_FILE, lines.join('\n'), 'utf-8');
  console.log('Written to applications.md (backup: applications.md.bak)');
} else if (DRY_RUN) {
  console.log('(dry-run - no changes written)');
} else {
  console.log('No duplicates found');
}
