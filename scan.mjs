#!/usr/bin/env node

/**
 * scan.mjs - Zero-token portal scanner
 *
 * Compatibility CLI wrapper around src/services/pipeline/portal-scan.mjs.
 */

import {
  DEFAULT_SCAN_PATHS,
  PARSERS,
  appendToPipeline,
  appendToScanHistory,
  buildTitleFilter,
  detectApi,
  ensureScanDirs,
  fetchJson,
  loadPortalConfig,
  loadSeenCompanyRoles,
  loadSeenUrls,
  parallelLimit,
} from './src/services/pipeline/portal-scan.mjs';

const CONCURRENCY = 10;
const FETCH_TIMEOUT_MS = 10_000;

async function main() {
  ensureScanDirs();

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const companyFlag = args.indexOf('--company');
  const filterCompany = companyFlag !== -1 ? args[companyFlag + 1]?.toLowerCase() : null;

  let config;
  try {
    config = loadPortalConfig(DEFAULT_SCAN_PATHS.portals);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const companies = config.tracked_companies || [];
  const titleFilter = buildTitleFilter(config.title_filter);

  const targets = companies
    .filter((company) => company.enabled !== false)
    .filter((company) => !filterCompany || company.name.toLowerCase().includes(filterCompany))
    .map((company) => ({ ...company, _api: detectApi(company) }))
    .filter((company) => company._api !== null);

  const skippedCount = companies.filter((company) => company.enabled !== false).length - targets.length;

  console.log(`Scanning ${targets.length} companies via API (${skippedCount} skipped - no API detected)`);
  if (dryRun) console.log('(dry run - no files will be written)\n');

  const seenUrls = loadSeenUrls(DEFAULT_SCAN_PATHS);
  const seenCompanyRoles = loadSeenCompanyRoles(DEFAULT_SCAN_PATHS.applications);

  const date = new Date().toISOString().slice(0, 10);
  let totalFound = 0;
  let totalFiltered = 0;
  let totalDupes = 0;
  const newOffers = [];
  const errors = [];

  const tasks = targets.map((company) => async () => {
    const { type, url } = company._api;
    try {
      const json = await fetchJson(url, FETCH_TIMEOUT_MS);
      const jobs = PARSERS[type](json, company.name).filter((job) => job.url);
      totalFound += jobs.length;

      for (const job of jobs) {
        if (!titleFilter(job.title)) {
          totalFiltered++;
          continue;
        }
        if (seenUrls.has(job.url)) {
          totalDupes++;
          continue;
        }

        const key = `${job.company.toLowerCase()}::${job.title.toLowerCase()}`;
        if (seenCompanyRoles.has(key)) {
          totalDupes++;
          continue;
        }

        seenUrls.add(job.url);
        seenCompanyRoles.add(key);
        newOffers.push({ ...job, source: `${type}-api` });
      }
    } catch (err) {
      errors.push({ company: company.name, error: err.message });
    }
  });

  await parallelLimit(tasks, CONCURRENCY);

  if (!dryRun && newOffers.length > 0) {
    appendToPipeline(newOffers, DEFAULT_SCAN_PATHS.pipeline);
    appendToScanHistory(newOffers, date, DEFAULT_SCAN_PATHS.scanHistory);
  }

  console.log(`\n${'-'.repeat(45)}`);
  console.log(`Portal Scan - ${date}`);
  console.log(`${'-'.repeat(45)}`);
  console.log(`Companies scanned:     ${targets.length}`);
  console.log(`Total jobs found:      ${totalFound}`);
  console.log(`Filtered by title:     ${totalFiltered} removed`);
  console.log(`Duplicates:            ${totalDupes} skipped`);
  console.log(`New offers added:      ${newOffers.length}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const error of errors) console.log(`  x ${error.company}: ${error.error}`);
  }

  if (newOffers.length > 0) {
    console.log('\nNew offers:');
    for (const offer of newOffers) {
      console.log(`  + ${offer.company} | ${offer.title} | ${offer.location || 'N/A'}`);
    }
    console.log(dryRun
      ? '\n(dry run - run without --dry-run to save results)'
      : `\nResults saved to ${DEFAULT_SCAN_PATHS.pipeline} and ${DEFAULT_SCAN_PATHS.scanHistory}`);
  }

  console.log('\n-> Run /career-ops pipeline to evaluate new offers.');
  console.log('-> Share results and get help: https://discord.gg/8pRpHETxa4');
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
