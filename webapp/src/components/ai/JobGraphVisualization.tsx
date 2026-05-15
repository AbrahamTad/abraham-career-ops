'use client'

interface JobGraphVisualizationProps {
  running?: boolean
  matchesFound?: number
  skills?: string[]
}

const TONE_CYCLE = [
  'fill-sky-500',
  'fill-cyan-500',
  'fill-violet-500',
  'fill-indigo-500',
  'fill-emerald-500',
  'fill-amber-500',
  'fill-rose-500',
  'fill-teal-500',
  'fill-orange-400',
]

const DEFAULT_SKILLS = ['React', 'JavaScript', 'QA', 'Cypress', 'Frontend', 'LIA', 'Göteborg', 'Remote']

function buildSkillNodes(skills: string[]) {
  const clamped = skills.slice(0, 8)
  const count = clamped.length
  const radius = 34

  return clamped.map((label, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      label,
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      size: 38,
      tone: TONE_CYCLE[i % TONE_CYCLE.length],
      delay: `${i * 120}ms`,
    }
  })
}

export default function JobGraphVisualization({
  running = false,
  matchesFound = 0,
  skills,
}: JobGraphVisualizationProps) {
  const displaySkills = skills && skills.length > 0 ? skills : DEFAULT_SKILLS
  const nodes = buildSkillNodes(displaySkills)

  return (
    <section className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/70 bg-slate-950 p-5 shadow-xl shadow-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.22),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(168,85,247,0.16),transparent_32%)]" />
      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Graph construction</p>
          <h2 className="text-lg font-bold text-white">CV to job network</h2>
        </div>
        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
          {matchesFound > 0 ? `${matchesFound} strong match${matchesFound !== 1 ? 'es' : ''}` : 'Awaiting search'}
        </div>
      </div>

      <svg viewBox="0 0 100 100" className="relative h-72 w-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges: center → each skill node */}
        {nodes.map((node, index) => (
          <line
            key={`edge-${node.label}`}
            x1={50}
            y1={50}
            x2={node.x}
            y2={node.y}
            className={`stroke-white/25 ${running ? 'animate-pulse' : ''}`}
            strokeWidth="0.45"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}

        {/* Skill nodes */}
        {nodes.map((node) => (
          <g
            key={node.label}
            className={running ? 'animate-[nodeIn_1.8s_ease-in-out_infinite]' : ''}
            style={{ animationDelay: node.delay }}
          >
            <circle cx={node.x} cy={node.y} r={node.size / 10} className={`${node.tone} opacity-95`} filter="url(#glow)" />
            <circle cx={node.x} cy={node.y} r={node.size / 7.2} className="fill-white/5 stroke-white/15" />
            <text x={node.x} y={node.y + node.size / 10 + 3.8} textAnchor="middle" className="fill-white text-[3px] font-semibold">
              {node.label.length > 10 ? `${node.label.slice(0, 9)}…` : node.label}
            </text>
          </g>
        ))}

        {/* Center: User CV node */}
        <g className={running ? 'animate-[nodeIn_1.8s_ease-in-out_infinite]' : ''}>
          <circle cx={50} cy={50} r={6.5} className="fill-slate-200 opacity-95" filter="url(#glow)" />
          <circle cx={50} cy={50} r={8.5} className="fill-white/5 stroke-white/20" />
          <text x={50} y={51.2} textAnchor="middle" className="fill-slate-950 text-[3.2px] font-black">CV</text>
        </g>
      </svg>

      <style jsx>{`
        @keyframes nodeIn {
          0%, 100% { opacity: 0.65; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
    </section>
  )
}
