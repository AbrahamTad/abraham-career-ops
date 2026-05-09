'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Loader2, Star, ExternalLink, BookmarkPlus } from 'lucide-react'
import { toast } from 'sonner'
import { formatSalary } from '@/lib/utils'

interface JobListing {
  id: string
  title: string
  location: string | null
  isRemote: boolean
  isHybrid: boolean
  isLia: boolean
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  sourceUrl: string | null
  postedAt: string | null
  jobType: string | null
  company: { name: string; logoUrl: string | null }
  match?: { score: number; tier: string } | null
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [liaOnly, setLiaOnly] = useState(false)
  const [remoteOnly, setRemoteOnly] = useState(false)

  useEffect(() => { loadJobs() }, [])

  async function loadJobs(params?: URLSearchParams) {
    setLoading(true)
    try {
      const url = params ? `/api/jobs?${params}` : '/api/jobs'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (location) params.set('location', location)
    if (liaOnly) params.set('lia', '1')
    if (remoteOnly) params.set('remote', '1')
    await loadJobs(params)
  }

  async function handleSave(jobId: string) {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobListingId: jobId, status: 'SAVED' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Jobb sparat i dina ansökningar')
    } catch {
      toast.error('Kunde inte spara jobbet')
    }
  }

  async function handleScanPortals() {
    setSearching(true)
    toast.info('Söker på jobbportaler... Det kan ta en stund.')
    try {
      const res = await fetch('/api/jobs/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, location, liaOnly }) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`Hittade ${data.count} nya jobb!`)
      await loadJobs()
    } catch {
      toast.error('Scanning misslyckades')
    } finally {
      setSearching(false)
    }
  }

  const tierColors: Record<string, string> = {
    strong: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    weak: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobbsökning</h1>
          <p className="mt-1 text-slate-500">Hitta och matcha relevanta tjänster med AI</p>
        </div>
        <button
          onClick={handleScanPortals}
          disabled={searching}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Skanna portaler
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 min-w-40">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Roll, kompetens..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 min-w-32">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Stad"
              className="flex-1 text-sm outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={liaOnly} onChange={(e) => setLiaOnly(e.target.checked)} className="rounded" />
            LIA
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="rounded" />
            Remote
          </label>
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            <Filter className="h-4 w-4" />
            Filtrera
          </button>
        </div>
      </form>

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">Inga jobb hittade</p>
          <p className="mt-1 text-sm text-slate-400">Prova att skanna portaler eller ändra sökkriterierna</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    {job.isLia && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">LIA</span>
                    )}
                    {job.match && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tierColors[job.match.tier]}`}>
                        {job.match.score.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-blue-600">{job.company.name}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.isRemote && <span>🌐 Remote</span>}
                    {job.isHybrid && <span>🏠 Hybrid</span>}
                    {(job.salaryMin || job.salaryMax) && (
                      <span>💰 {formatSalary(job.salaryMin, job.salaryMax, job.currency ?? 'SEK')}</span>
                    )}
                    {job.jobType && <span>⏰ {job.jobType}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleSave(job.id)}
                    title="Spara"
                    className="rounded-lg border p-2 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </button>
                  {job.sourceUrl && (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Öppna
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
