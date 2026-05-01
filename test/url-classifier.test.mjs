import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHttpUrls, isHttpUrl, normalizeJobUrl } from '../src/utils/url.mjs';

test('validates only http and https URLs', () => {
  assert.equal(isHttpUrl('https://example.com/jobs/1'), true);
  assert.equal(isHttpUrl('http://example.com/jobs/1'), true);
  assert.equal(isHttpUrl('javascript:alert(1)'), false);
  assert.equal(isHttpUrl('not a url'), false);
});

test('normalizes tracking parameters and hash fragments', () => {
  assert.equal(
    normalizeJobUrl('https://example.com/job/1?utm_source=x&ref=feed&id=9#apply'),
    'https://example.com/job/1?id=9'
  );
});

test('extracts URLs from pipeline-style text', () => {
  const urls = extractHttpUrls('- [ ] https://jobs.example.com/role?utm_campaign=x | Example | Role');
  assert.deepEqual(urls, ['https://jobs.example.com/role']);
});
