# Abraham's Career-Ops - Sweden Job Search Bot

Career-Ops configured for Abraham Tadesse: Frontend Developer, QA, and junior AI-adjacent roles in Sweden, with Göteborg as the priority market.

Built on `career-ops` by santifer and adapted for Abraham's Sweden-focused job search.

## Quick Setup

```bash
npm install
npx playwright install chromium
npm run doctor
```

Required local files are already configured:

| File | Purpose |
|---|---|
| `cv.md` | Master CV source of truth |
| `article-digest.md` | Project proof points and GoldBot AI context |
| `config/profile.yml` | Personal profile, targets, and preferences |
| `modes/_profile.md` | Abraham-specific archetypes and stories |
| `portals.yml` | Sweden/Göteborg job sources and filters |

Keep secrets in `.env`. Do not commit real API keys.

## Architecture

```text
portals.yml
  -> scan.mjs
  -> src/services/pipeline
  -> data/pipeline.md
  -> liveness check with Playwright
  -> AI evaluation with modes + cv.md + article-digest.md
  -> reports/*.md
  -> templates/cv-template.html
  -> generate-pdf.mjs
  -> output/*.pdf
  -> batch/tracker-additions/*.tsv
  -> merge-tracker.mjs
  -> data/applications.md
```

Core folders:

| Folder | Responsibility |
|---|---|
| `src/services/pipeline/` | Portal API detection, parsing, filtering, scoring helpers |
| `src/services/browser/` | Playwright liveness checks and SPA-safe page inspection |
| `src/services/tracking/` | Status normalization, tracker parsing, fuzzy dedup helpers |
| `src/utils/` | Shared URL and string utilities |
| `modes/` | Agent behavior and evaluation methodology |
| `templates/` | CV and tracker format templates |
| `reports/`, `output/`, `data/` | Generated evaluations, PDFs, and user tracking data |

## How The Pipeline Works

1. `npm run scan` reads `portals.yml`, detects supported ATS APIs such as Greenhouse, Ashby, and Lever, filters titles, and adds new matches to `data/pipeline.md`.
2. `npm run liveness -- <url>` checks whether postings are still active using Playwright. Expired signals win over generic Apply text.
3. Evaluation reads `cv.md`, `article-digest.md`, `modes/_shared.md`, `modes/_profile.md`, and `modes/oferta.md` to produce a scored report.
4. `npm run pdf -- input.html output.pdf` renders ATS-friendly PDFs with Playwright.
5. Tracker changes are written as TSV files under `batch/tracker-additions/`.
6. `npm run merge` merges TSV additions into `data/applications.md`.
7. `npm run verify` checks statuses, tracker links, duplicates, scores, and pending TSVs.

Never add new rows directly to `data/applications.md`; use the TSV flow and merge script.

## Common Commands

```bash
npm run scan
npm run liveness -- https://example.com/job
npm run gemini:eval -- --file ./jds/example.txt
npm run pdf -- input.html output.pdf
npm run merge
npm run verify
npm test
npm run test:pipeline
```

## Extending Job Sources

Edit `portals.yml`:

1. Add a company under `tracked_companies`.
2. Prefer ATS URLs from Greenhouse, Ashby, or Lever when available.
3. Tune `title_filter.positive` for frontend, QA, LIA, internship, and junior AI roles.
4. Tune `title_filter.negative` for senior-only, management, and non-target stacks.
5. Run `npm run scan -- --dry-run` before saving new results.

## Abraham Matching Signals

The local scoring helpers extract:

| Signal | Examples |
|---|---|
| Tech stack | React, TypeScript, JavaScript, Cypress, Playwright, Azure, AI/ML |
| Location | Göteborg, Stockholm, Malmö, Lund, Sweden/Sverige |
| Work mode | Remote, Hybrid, On-site, Unspecified |
| Match reason | A short "Why this job matches Abraham" explanation |

AI evaluation still makes the final qualitative judgment, but deterministic signals make ranking and caching easier to test.

## Tracking Statuses

Use only canonical statuses from `templates/states.yml`:

`Evaluated`, `Applied`, `Responded`, `Interview`, `Offer`, `Rejected`, `Discarded`, `SKIP`

Never submit an application automatically. Generate drafts, PDFs, and form answers, then stop for Abraham's review.
