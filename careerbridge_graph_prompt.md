# CareerBridge AI — Graph Intelligence Engine
## Engineering Prompt for Claude Code / Codex

---

## CONTEXT & MISSION

Build a **real AI-powered candidate-to-job relationship graph engine** for CareerBridge AI.
This is NOT a visual demo. Every node, edge, and weight must represent a real computed
relationship derived from actual data — CV content, job listings, location, industry signals.

The inspiration is systems like MiroFish, Palantir Gotham, and LinkedIn Talent Graph:
intelligence-first, visualization second.

---

## ARCHITECTURE OVERVIEW

Split the work cleanly into three layers:

```
Layer 1: Graph Construction Engine (Backend / API)
Layer 2: Graph Data Contract (Shared Types)
Layer 3: Graph Visualization Component (Frontend)
```

Do not mix them. The frontend must never generate its own fake node data.

---

## LAYER 1 — GRAPH CONSTRUCTION ENGINE (Backend)

### Endpoint
```
POST /api/graph/build
Body: { cvText: string, jobQuery: string, location: string }
Response: GraphPayload
```

### What the engine must actually compute:

**Step 1 — CV Parsing**
- Extract: skills, years of experience per skill, education level, profession category,
  languages, certifications, location.
- Detect profession domain using classification
  (e.g. "Undersköterska" → Healthcare → Patient Care → Elderly Care).

**Step 2 — Job Query Analysis**
- Parse job title into: profession category, required skills, industry, seniority level.
- Do NOT pull skills from CV here. Use job-domain knowledge only.

**Step 3 — Relationship Graph Construction**
Build a weighted directed graph with these node types:

| Node Type       | Example                        |
|-----------------|-------------------------------|
| Candidate       | User CV profile               |
| Skill           | "Patientvård", "Journalsystem"|
| Profession      | Undersköterska                |
| Industry        | Healthcare / Elderly Care     |
| Company         | Capio, Humana, Region Västra  |
| Location        | Göteborg, Kungälv             |
| JobPosting      | Specific matched job          |
| CareerPath      | Trainee → Junior → Senior     |
| HiringSignal    | "Actively hiring", LIA open   |

**Step 4 — Edge Weight Calculation**
Every connection must have:
```typescript
interface GraphEdge {
  source: string        // node id
  target: string        // node id
  type: RelationType    // e.g. HAS_SKILL, WORKS_IN, REQUIRES, LOCATED_IN
  weight: number        // 0.0–1.0 (computed match score)
  reason: string        // Human-readable: "4 years experience in patient care"
  confidence: number    // AI confidence in this relationship
}
```

**Step 5 — Clustering**
Group nodes into clusters:
- Core Identity Cluster (Candidate + Profession + Skills)
- Opportunity Cluster (Jobs + Companies + HiringSignals)
- Geographic Cluster (Locations)
- Growth Cluster (CareerPaths + SkillTransfers)

**Step 6 — Ranking**
Return nodes sorted by `hiringProbabilityScore` (0–1).
This score combines: skill overlap + location match + industry alignment + hiring signal.

---

## LAYER 2 — SHARED DATA CONTRACT

```typescript
interface GraphNode {
  id: string
  label: string
  type: 'Candidate' | 'Skill' | 'Profession' | 'Industry' |
        'Company' | 'Location' | 'JobPosting' | 'CareerPath' | 'HiringSignal'
  weight: number          // 0.0–1.0 — drives visual size/glow
  cluster: string
  metadata: Record<string, string>
}

interface GraphEdge {
  source: string
  target: string
  type: string
  weight: number
  reason: string
  confidence: number
}

interface GraphPayload {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: GraphCluster[]
  processingStages: ProcessingStage[]
  summary: {
    strongMatches: number
    hiringProbability: number
    topOpportunities: string[]
  }
}

interface ProcessingStage {
  id: string
  label: string             // "Extracting profession identity..."
  status: 'pending' | 'active' | 'complete'
  durationMs?: number
}
```

---

## LAYER 3 — GRAPH VISUALIZATION COMPONENT (Frontend)

### Tech Stack
- **Graph rendering:** `react-force-graph-2d` (or `d3-force` directly)
- **Animations:** Framer Motion for panels; canvas for graph physics
- **State:** Zustand or existing store

### Visual Rules

**Node appearance (driven by data, not hardcoded):**
```
node.weight > 0.8  → large, bright glow, pulse animation
node.weight > 0.5  → medium, soft glow
node.weight < 0.5  → small, dim, secondary
```

**Node color by type:**
```
Candidate     → #FFD700  (gold — always center)
Skill         → #00C8FF  (cyan)
Profession    → #00FF88  (green)
Company       → #FF6B35  (orange)
Location      → #A78BFA  (purple)
JobPosting    → #34D399  (emerald)
HiringSignal  → #F59E0B  (amber, animated pulse)
CareerPath    → #94A3B8  (slate)
```

**Edge appearance:**
```
edge.weight > 0.7  → bright solid line, animated dash flow
edge.weight > 0.4  → medium opacity line
edge.weight < 0.4  → barely visible, no animation
```

**Physics:**
- Use d3-force with: `charge(-120)`, `linkDistance` proportional to `1 - edge.weight`
- Strong matches cluster tightly. Weak matches drift to periphery.
- Smooth transition when new nodes arrive (interpolated positions).

### Interaction Requirements

**On node hover:**
Show tooltip panel with:
```
[Node Label]
Type: Company
Match Score: 87%
Why connected:
  "Capio actively hires Undersköterskor in Göteborg.
   3 open positions. LIA available Q3 2026."
```

**On node click:**
Expand: show all edges from that node, highlight path back to Candidate.

**Graph Modes (tab switcher):**
1. Full Network — everything
2. Opportunity Map — only Jobs + Companies + HiringSignals
3. Skill Transfer — Candidate Skills → adjacent learnable skills → new professions
4. Career Path — linear progression view
5. Geographic Heat — location nodes enlarged by job density

### AI Processing Stages UI

Render each `ProcessingStage` from the API response as an animated checklist.
Stages complete sequentially with real timing from backend.
Do NOT fake/hardcode stage timings on the frontend.

Example stages (generated by backend, not frontend):
```
✓ Reading CV                    (120ms)
✓ Extracting profession identity (340ms)
✓ Building semantic graph        (890ms)
⟳ Connecting industry signals... (active)
  Ranking hiring probability
  Discovering hidden opportunities
  Finalizing candidate intelligence map
```

### What to NOT build
- No floating particles unconnected to data
- No randomly placed decorative nodes
- No hardcoded skill names from CV when searching an unrelated profession
- No fake "92% match" badges without a computed score behind them
- No stage animations with arbitrary fake timers

---

## UI DESIGN SPEC

**Theme:** Dark intelligence terminal — not "startup SaaS dark mode"

```css
--bg-primary:     #050810
--bg-panel:       rgba(10, 15, 30, 0.85)
--border:         rgba(0, 200, 255, 0.12)
--text-primary:   #E2E8F0
--text-secondary: #64748B
--accent-gold:    #FFD700
--accent-cyan:    #00C8FF
--accent-green:   #00FF88
--glow-strong:    0 0 20px rgba(0, 200, 255, 0.6)
--glow-soft:      0 0 8px rgba(0, 200, 255, 0.2)
```

Panels: glassmorphism with `backdrop-filter: blur(12px)`.
Typography: `IBM Plex Mono` for data labels, `Inter` for body.
No gradients on text. No rainbow accents. Restrained, confident, institutional.

---

## IMPLEMENTATION ORDER

1. Define and finalize `GraphPayload` TypeScript types (shared)
2. Build `/api/graph/build` endpoint with mock data first, real AI second
3. Build `GraphCanvas` component consuming real `GraphPayload`
4. Wire up processing stages to real API timing
5. Add graph modes as filter/transform on existing payload (no extra API calls)
6. Add hover tooltips with `reason` field from edges
7. Polish physics, glow, and transitions last

---

## SUCCESS CRITERIA

The graph is considered correct when:
- Searching "Undersköterska" shows Healthcare nodes, NOT React/Cypress nodes
- Every visible node traces back to a real data relationship
- Hovering any connection shows a human-readable reason
- Strong matches visually dominate; weak matches recede
- Processing stages reflect real backend timing
- A developer can explain why every node exists
