import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSwedenLocation,
  extractTechStack,
  extractWorkMode,
  scoreJobAgainstProfile,
} from '../src/services/pipeline/job-intelligence.mjs';

test('extracts tech stack, Sweden location, and work mode', () => {
  const text = 'Hybrid Frontend role in Göteborg using React, TypeScript, Cypress and Azure.';
  assert.deepEqual(extractTechStack(text).slice(0, 4), ['React', 'TypeScript', 'Cypress', 'Azure']);
  assert.deepEqual(extractSwedenLocation(text), ['Göteborg']);
  assert.equal(extractWorkMode(text), 'Hybrid');
});

test('scores Abraham-friendly junior frontend roles above poor-fit roles', () => {
  const good = scoreJobAgainstProfile('Junior LIA frontend React TypeScript Cypress Göteborg hybrid');
  const poor = scoreJobAgainstProfile('Senior Java manager onsite outside Sweden');
  assert.ok(good.score > poor.score);
  assert.match(good.why, /Abraham/);
});
