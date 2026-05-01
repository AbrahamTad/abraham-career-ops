import { chromium } from 'playwright';
import { classifyLiveness } from '../../../liveness-core.mjs';

export async function checkUrlWithPage(page, url, options = {}) {
  const timeout = options.timeout ?? 15_000;
  const spaDelay = options.spaDelay ?? 2_000;

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    const status = response?.status() ?? 0;

    await page.waitForTimeout(spaDelay);

    const finalUrl = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const applyControls = await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]')
      );

      return candidates
        .filter((element) => {
          if (element.closest('nav, header, footer')) return false;
          if (element.closest('[aria-hidden="true"]')) return false;

          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (!element.getClientRects().length) return false;

          return Array.from(element.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
        })
        .map((element) => [
          element.innerText,
          element.value,
          element.getAttribute('aria-label'),
          element.getAttribute('title'),
        ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    });

    return classifyLiveness({ status, finalUrl, bodyText, applyControls });
  } catch (err) {
    return { result: 'expired', reason: `navigation error: ${err.message.split('\n')[0]}` };
  }
}

export async function checkUrls(urls, options = {}) {
  const browser = await chromium.launch({ headless: options.headless ?? true });
  try {
    const page = await browser.newPage();
    const results = [];
    for (const url of urls) {
      results.push({ url, ...(await checkUrlWithPage(page, url, options)) });
    }
    return results;
  } finally {
    await browser.close();
  }
}
