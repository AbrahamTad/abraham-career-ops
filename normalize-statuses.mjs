#!/usr/bin/env node
/**
 * normalize-statuses.mjs - Clean non-canonical states in applications.md
 *
 * Run: node normalize-statuses.mjs [--dry-run]
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { normalizeStatus } from './src/services/tracking/statuses.mjs';

const CAREER_OPS = dirname(fileURLToPath(import.meta.url));
const APPS_FILE = existsSync(join(CAREER_OPS, 'data/applications.md'))
  ? join(CAREER_OPS, 'data/applications.md')
  : join(CAREER_OPS, 'applications.md');
const DRY_RUN = process.argv.includes('--dry-run');

mkdirSync(join(CAREER_OPS, 'data'), { recursive: true });

if (!existsSync(APPS_FILE)) {
  console.log('No applications.md found. Nothing to normalize.');
  process.exit(0);
}

const content = readFileSync(APPS_FILE, 'utf-8');
const lines = content.split('\n');
let changes = 0;
const unknowns = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.startsWith('|')) continue;

  const parts = line.split('|').map((part) => part.trim());
  if (parts.length < 9) continue;
  if (parts[1] === '#' || parts[1] === '---' || parts[1] === '') continue;

  const num = Number.parseInt(parts[1], 10);
  if (Number.isNaN(num)) continue;

  const rawStatus = parts[6];
  const result = normalizeStatus(rawStatus);

  if (result.unknown) {
    unknowns.push({ num, rawStatus, line: i + 1 });
    continue;
  }

  if (result.status === rawStatus && !parts[5]?.includes('**')) continue;

  parts[6] = result.status;
  parts[5] = (parts[5] || '').replace(/\*\*/g, '');

  if (result.moveToNotes) {
    const existing = parts[9] || '';
    if (!existing.includes(result.moveToNotes)) {
      parts[9] = result.moveToNotes + (existing ? `. ${existing}` : '');
    }
  }

  lines[i] = '| ' + parts.slice(1, -1).join(' | ') + ' |';
  changes++;
  console.log(`#${num}: "${rawStatus}" -> "${result.status}"`);
}

if (unknowns.length > 0) {
  console.log(`\nWarning: ${unknowns.length} unknown statuses:`);
  for (const unknown of unknowns) {
    console.log(`  #${unknown.num} (line ${unknown.line}): "${unknown.rawStatus}"`);
  }
}

console.log(`\n${changes} statuses normalized`);

if (!DRY_RUN && changes > 0) {
  copyFileSync(APPS_FILE, `${APPS_FILE}.bak`);
  writeFileSync(APPS_FILE, lines.join('\n'), 'utf-8');
  console.log('Written to applications.md (backup: applications.md.bak)');
} else if (DRY_RUN) {
  console.log('(dry-run - no changes written)');
} else {
  console.log('No changes needed');
}
