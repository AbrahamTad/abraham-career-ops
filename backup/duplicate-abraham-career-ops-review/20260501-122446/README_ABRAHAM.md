# 🇸🇪 Abraham's Career-Ops — Sweden Job Search Agent

Career-Ops configured for **Abraham Tadesse** — Frontend Developer / QA / AI-curious, Göteborg.

Built on [career-ops](https://github.com/santifer/career-ops) by santifer + merged with your Sweden Job Agent.

---

## ✅ Setup (do this once, takes ~5 min)

```bash
# 1. Unzip and enter the project
cd abraham-career-ops

# 2. Install Node dependencies
npm install

# 3. Install Playwright browser (needed for PDF + scanning)
npx playwright install chromium

# 4. Verify everything is working
npm run doctor
# → Should show all ✓ green

# 5. Install Claude Code CLI (if not already installed)
npm install -g @anthropic-ai/claude-code

# 6. Start Claude Code in this directory
cd abraham-career-ops
claude
```

**That's it.** Claude Code will read `CLAUDE.md` automatically and know who you are and what to do.

---

## 🚀 Start Job Searching Today

Open Claude Code in this directory, then paste any of these:

### Paste a job URL (most common)
```
/career-ops https://www.linkedin.com/jobs/view/XXXXXXXXXX
```

### Paste a job description directly
```
/career-ops

Företag: Knowit Göteborg
Roll: Frontend Developer
Vi söker en junior frontend-utvecklare med erfarenhet av React och TypeScript...
[paste full job description]
```

### Scan Swedish job boards automatically
```
/career-ops scan
```

### Generate ATS-optimized PDF for a job
```
/career-ops pdf
```

### View your application pipeline
```
/career-ops tracker
```

### Get interview prep for a company
```
/career-ops deep Klarna
```

---

## 📁 Your Files (already configured)

| File | What it is | Status |
|------|-----------|--------|
| `cv.md` | Your master CV — Abraham Tadesse | ✅ Done |
| `article-digest.md` | Deep dives on GoldBot AI + all projects | ✅ Done |
| `config/profile.yml` | Your contact info, salary targets, goals | ✅ Done |
| `modes/_profile.md` | Your archetypes, STAR stories, negotiation scripts | ✅ Done |
| `portals.yml` | Swedish job boards + Göteborg companies | ✅ Done |

---

## 🇸🇪 Sweden-specific: Top Companies to Check First

| Company | Type | Notes |
|---------|------|-------|
| Göteborgs Stad Intraservice | Public sector | Your current employer — LIA target |
| Knowit Göteborg | Consulting | Junior-friendly, React |
| Sogeti | QA/Test consulting | Cypress = perfect fit |
| tretton37 | Dev consultancy | Known for junior hiring |
| AFRY | Engineering consulting | Göteborg HQ, lots of roles |
| Epsilon | Automotive tech | Göteborg, consultancy |
| Bravura / TNG | Staffing | Lots of junior placements |

---

## 💡 Pro Tips

1. **Start with a real job URL** — paste it into Claude Code as `/career-ops [url]`
2. **The system scores A–F** — only apply to A/B/C rated jobs
3. **Every evaluation generates a PDF** — check `output/` folder
4. **Your GoldBot AI project is your differentiator** — the system knows to use it for AI-adjacent roles
5. **Run `/career-ops scan` once a week** to discover new openings automatically

---

## 📊 After Each Application

Update `data/applications.md` status:
```
Discovered → CV Generated → Ready to Send → Applied → Interview → Offer
```

---

Built April 2026 | Göteborg, Sweden
