#!/usr/bin/env node

/**
 * check-liveness.mjs - Playwright job link liveness checker
 *
 * Compatibility CLI wrapper around src/services/browser/liveness-checker.mjs.
 */

import { readFile } from 'fs/promises';
import { checkUrls } from './src/services/browser/liveness-checker.mjs';
import { isHttpUrl } from './src/utils/url.mjs';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node check-liveness.mjs <url1> [url2] ...');
    console.error('       node check-liveness.mjs --file urls.txt');
    process.exit(1);
  }

  let urls;
  if (args[0] === '--file') {
    if (!args[1]) {
      console.error('Error: --file requires a path');
      process.exit(1);
    }
    const text = await readFile(args[1], 'utf-8');
    urls = text.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  } else {
    urls = args;
  }

  const malformed = urls.filter((url) => !isHttpUrl(url));
  if (malformed.length > 0) {
    console.error(`Error: malformed URL(s): ${malformed.join(', ')}`);
    process.exit(1);
  }

  console.log(`Checking ${urls.length} URL(s)...\n`);

  const results = await checkUrls(urls);
  let active = 0;
  let expired = 0;
  let uncertain = 0;

  for (const { url, result, reason } of results) {
    const icon = { active: 'OK', expired: 'NO', uncertain: '??' }[result];
    console.log(`${icon} ${result.padEnd(10)} ${url}`);
    if (result !== 'active') console.log(`           ${reason}`);
    if (result === 'active') active++;
    else if (result === 'expired') expired++;
    else uncertain++;
  }

  console.log(`\nResults: ${active} active  ${expired} expired  ${uncertain} uncertain`);
  if (expired > 0 || uncertain > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
