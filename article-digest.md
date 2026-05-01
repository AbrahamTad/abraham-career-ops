# Abraham Tadesse — Proof Points & Project Deep Dives

This file gives career-ops detailed context about my projects for use in evaluations, CVs, and cover letters. It takes precedence over cv.md for specific metrics and technical details.

---

## GoldBot AI — Live Autonomous ML Trading System

**Stack:** Python · scikit-learn · LightGBM · ONNX (Informer Transformer) · Flask · MetaTrader 5 · MQL5 · Google Colab Pro T4  
**Status:** Live since April 17, 2026 on real Pepperstone brokerage account  
**Repo:** github.com/AbrahamTad/-GoldBot-AI (private)  
**Files:** `C:\Users\eshki\Desktop\GoldBot\`

### What it does
Autonomous XAUUSD (gold) trading agent. Every tick during session hours (07:00–12:00 UTC, 14:00–21:00 UTC):
1. Pulls live OHLCV data from MetaTrader 5
2. Runs 50+ feature indicators (RSI, MACD, ATR, Bollinger, Smart Money concepts)
3. Feeds ensemble: RandomForest (55%) + LightGBM (45%) + Informer Transformer (ONNX, 0% weight currently)
4. Votes on direction (UP/DOWN/RANGE) with confidence thresholds: UP/DOWN=0.26, STRONG=0.27, RANGE=0.33
5. Applies Kelly Criterion risk sizing (capped: R=3.0, hard minimum 0.01 lot)
6. Executes via MQL5 EA on MT5

### Self-learning pipeline
Daily retraining via `daily_retrain.bat` — 6 steps: layer1 (data), layer2 (features), layer3a (RF), layer3b (LGBM), layer3c (Informer), self_learning.py (model weights update)

### Key engineering challenges solved
- Disabled MiroFish model due to sklearn scaler mismatch — isolated root cause, removed from ensemble
- Fixed dynamic threshold override from `confidence_threshold.json` — was being ignored
- Fixed `ensemble_vote()` returning `'SKIP'` string as direction — caused type errors in execution
- Rewrote `self_learning.py` to prevent `risk_config.pkl` resetting `max_lot` on each run
- Fixed Kelly lot sizing overflow — capped R at 3.0, added hard 0.01 lot floor
- Flask dashboard on port 5500 for live system monitoring

### AI/ML credentials from this project
- Trained Informer Transformer (attention-based time series) on Google Colab Pro T4 — achieved 65% precision at 0.65 confidence threshold
- Feature engineering at scale: 50+ indicators across multiple timeframes
- Ensemble voting with weighted confidence — not just majority vote
- Production deployment: model → ONNX export → Python inference → MT5 execution
- End-to-end ML ops: data pipeline → training → validation → deployment → monitoring → retraining

---

## E-commerce App

**Stack:** Next.js 15 · React · TypeScript · Prisma · SQLite · Cypress · Tailwind  
**Repo:** github.com/AbrahamTad/ecommerce

### What I built
- Product catalog with dynamic routing (`/products/[id]`)
- CartContext (React Context API) — add, remove, quantity, persist across navigation
- Admin panel: full CRUD for products (create/edit/delete) against Prisma/SQLite
- Checkout flow with form validation
- Cypress E2E test suite: add to cart, checkout, admin create/edit/delete product

### Engineering challenges
- Next.js 15 broke dynamic route params — had to async-unwrap `params` before reading `id`
- Cart state was resetting on navigation — fixed with Context + useEffect persistence pattern
- Cypress tests were flaky on async data load — fixed with `cy.intercept()` wait patterns

### What this proves for employers
- I write tests (Cypress E2E), not just code
- I handle real framework upgrade issues (Next.js 15+ breaking changes)
- I understand state management beyond useState (Context API, cart lifecycle)

---

## Student Dashboard

**Stack:** React · TypeScript · Styled Components · React Router v6  
**Repo:** github.com/AbrahamTad/student-dashboard  
**Live:** Netlify (deployed)

### What I built
- SPA with React Router v6: `createBrowserRouter`, nested routes, `<Outlet>`, `<Link>`
- JSONPlaceholder API: users, posts, todos — async fetch with loading/error states
- Open-Meteo weather API integration — live weather for Stockholm
- Responsive layout with Styled Components — breakpoints, theme variables
- WCAG compliance: semantic HTML, aria labels, keyboard navigation, color contrast

### What this proves
- React Router SPA architecture (not just useState apps)
- TypeScript discipline — zero type errors in production
- Accessible, production-quality frontend (WCAG)
- Deployment workflow (Netlify + `_redirects` for SPA routing)

---

## IT Ambassador — Göteborgs Stad (8 years)

This isn't just a job — it's 8 years of applied UX research.

**What I actually did:**
- First-line IT support for staff in a large public sector organization (healthcare + social services)
- Identified recurring failure patterns in enterprise software UX
- Created documentation and visual guides that reduced repeat requests for top issues
- Coordinated between IT department and non-technical staff as a translator
- Worked in SharePoint, internal case management systems, Windows environments

**What this means for a tech employer:**
- I understand how real non-technical users interact with software — not theoretical UX, lived UX
- I can communicate across the technical/non-technical boundary (valuable in client-facing roles)
- Swedish public sector experience = trusted, local, reliable
- 8 years of professional consistency — not a job hopper
