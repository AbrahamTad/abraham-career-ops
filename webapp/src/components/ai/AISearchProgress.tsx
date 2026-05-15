'use client'

import { CheckCircle2, Circle, Loader2, Radar, Timer } from 'lucide-react'

export interface AISearchProgressStats {
  progress: number
  currentStep: string
  sourcesScanned: number
  jobsFound: number
  companiesFound: number
  matchesFound: number
  estimatedTime: string
}

const steps = [
  'Reading your CV',
  'Extracting skills and experience',
  'Building candidate profile graph',
  'Searching job sources',
  'Discovering companies',
  'Connecting CV skills to job requirements',
  'Ranking best matches',
  'Preparing recommendations',
]

export function createAISearchStats(progress: number, totalJobs = 0): AISearchProgressStats {
  const clamped = Math.max(8, Math.min(100, progress))
  const currentIndex = Math.min(steps.length - 1, Math.floor((clamped / 100) * steps.length))

  return {
    progress: clamped,
    currentStep: steps[currentIndex],
    sourcesScanned: Math.max(1, Math.round(clamped / 25)),
    jobsFound: Math.max(totalJobs, Math.round(clamped * 0.9)),
    companiesFound: Math.max(1, Math.round(clamped / 18)),
    matchesFound: Math.max(0, Math.round(clamped / 28)),
    estimatedTime: clamped >= 95 ? 'Almost ready' : `${Math.max(3, Math.round((100 - clamped) / 5))} sec`,
  }
}

export default function AISearchProgress({ stats }: { stats: AISearchProgressStats }) {
  const activeIndex = Math.min(steps.length - 1, Math.floor((stats.progress / 100) * steps.length))

  return (
    <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-xl shadow-sky-100/70 backdrop-blur">
      {/* AI progress header keeps users oriented while the search runs. */}
      <div className="relative border-b border-slate-200/70 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-5 py-5">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Radar className="h-6 w-6 animate-pulse" />
              <span className="absolute inset-0 animate-ping rounded-2xl bg-sky-400/30" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">AI graph search</p>
              <h2 className="text-lg font-bold text-slate-950">{stats.currentStep}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-600">
            <Timer className="h-4 w-4 text-sky-600" />
            {stats.estimatedTime}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const done = index < activeIndex
            const active = index === activeIndex

            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  active ? 'border-sky-200 bg-sky-50/80 shadow-sm' : done ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-100 bg-white/70'
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-500 text-white' : active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${active ? 'text-sky-900' : done ? 'text-emerald-900' : 'text-slate-500'}`}>{step}</p>
                  {active && <p className="mt-0.5 text-xs text-sky-700">Scanning, connecting, and ranking live.</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {[
            ['Sources scanned', stats.sourcesScanned],
            ['Job nodes found', stats.jobsFound],
            ['Company nodes found', stats.companiesFound],
            ['Strong matches', stats.matchesFound],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
