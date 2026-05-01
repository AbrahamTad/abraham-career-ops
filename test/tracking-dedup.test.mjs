import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStatus, validateStatus } from '../src/services/tracking/statuses.mjs';
import { parseApplicationLine, parseScore, roleFuzzyMatch } from '../src/services/tracking/tracker-utils.mjs';

test('normalizes tracker status aliases', () => {
  assert.deepEqual(normalizeStatus('Evaluada'), { status: 'Evaluated' });
  assert.equal(validateStatus('Aplicado 2026-04-20'), 'Applied');
  assert.equal(validateStatus('geo blocker'), 'SKIP');
});

test('detects fuzzy duplicates without matching generic roles only', () => {
  assert.equal(roleFuzzyMatch('Frontend Developer React TypeScript', 'React TypeScript Frontend Engineer'), true);
  assert.equal(roleFuzzyMatch('Frontend Developer', 'QA Engineer'), false);
});

test('parses application rows and scores', () => {
  const row = '| 7 | 2026-05-01 | Acme | Frontend Developer | 4.2/5 | Evaluated | NO | [7](reports/007-acme.md) | note |';
  const parsed = parseApplicationLine(row);
  assert.equal(parsed.company, 'Acme');
  assert.equal(parseScore(parsed.score), 4.2);
});
