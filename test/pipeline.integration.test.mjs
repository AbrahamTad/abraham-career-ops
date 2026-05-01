import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTitleFilter,
  detectApi,
  parseAshby,
  parseGreenhouse,
  parseLever,
} from '../src/services/pipeline/portal-scan.mjs';

test('detects supported ATS APIs from configured company URLs', () => {
  assert.equal(detectApi({ careers_url: 'https://jobs.ashbyhq.com/acme' }).type, 'ashby');
  assert.equal(detectApi({ careers_url: 'https://jobs.lever.co/acme' }).type, 'lever');
  assert.equal(detectApi({ careers_url: 'https://job-boards.eu.greenhouse.io/acme' }).type, 'greenhouse');
});

test('parses provider payloads into common job shape', () => {
  assert.deepEqual(parseGreenhouse({ jobs: [{ title: 'Frontend', absolute_url: 'https://gh.test/job', location: { name: 'Göteborg' } }] }, 'GH')[0], {
    title: 'Frontend',
    url: 'https://gh.test/job',
    company: 'GH',
    location: 'Göteborg',
  });
  assert.equal(parseAshby({ jobs: [{ title: 'QA', jobUrl: 'https://ashby.test/job', location: 'Remote' }] }, 'Ashby')[0].title, 'QA');
  assert.equal(parseLever([{ text: 'React Dev', hostedUrl: 'https://lever.test/job', categories: { location: 'Sweden' } }], 'Lever')[0].location, 'Sweden');
});

test('applies title filters consistently', () => {
  const filter = buildTitleFilter({ positive: ['frontend', 'qa'], negative: ['senior'] });
  assert.equal(filter('Frontend Developer'), true);
  assert.equal(filter('Senior Frontend Developer'), false);
  assert.equal(filter('Product Manager'), false);
});
