'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { APP_STATUS_LABELS, APP_STATUS_COLORS } from '@/types'
import type { AppStatusType } from '@/types'
import { PageHero } from '@/components/ui/ModernShell'

interface Application {
  id: string
  companyName: string
  jobTitle: string
  jobUrl?: string | null
  status: AppStatusType
  score?: number | null
  createdAt: string
  notes?: string | null
}

const ALL_STATUSES = ['SAVED', 'APPLIED', 'RESPONDED', 'INTERVIEW', 'OFFER', 'REJECTED', 'DISCARDED'] as AppStatusType[]

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AppStatusType | 'ALL'>('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/applications')
    if (res.ok) {
      const data = await res.json()
      setApps(data.applications)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(id: string, status: AppStatusType) {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApps(apps.map((a) => (a.id === id ? { ...a, status } : a)))
    } else {
      toast.error('Kunde inte uppdatera status')
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setApps(apps.filter((a) => a.id !== id))
      setDeleteId(null)
      toast.success('Ansökan borttagen')
    }
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAdding(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.get('companyName'),
          jobTitle: form.get('jobTitle'),
          jobUrl: form.get('jobUrl') || null,
          status: 'SAVED',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Ansökan tillagd')
      setShowAdd(false)
      await load()
    } catch {
      toast.error('Fel vid tillägg')
    } finally {
      setAdding(false)
    }
  }

  const filtered = filter === 'ALL' ? apps : apps.filter((a) => a.status === filter)

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length
    return acc
  }, {} as Record<AppStatusType, number>)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Application pipeline"
        title="Track every opportunity from saved to offer"
        description="Keep applications, scores, statuses, and next actions visible as your AI search produces stronger matches."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ansökningsspårare</h1>
          <p className="mt-1 text-slate-500">{apps.length} totala ansökningar</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Lägg till
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
          {/* Manual entry preserves existing tracker functionality. */}
          <h2 className="mb-4 font-semibold text-slate-900">Lägg till ansökan manuellt</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
            <input name="companyName" required placeholder="Företag" className="flex-1 min-w-32 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input name="jobTitle" required placeholder="Roll" className="flex-1 min-w-32 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input name="jobUrl" type="url" placeholder="URL (valfritt)" className="flex-1 min-w-40 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <button type="submit" disabled={adding} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Lägg till
            </button>
          </form>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'border text-slate-600 hover:bg-slate-50'}`}
        >
          Alla ({apps.length})
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === s ? 'bg-slate-900 text-white' : 'border text-slate-600 hover:bg-slate-50'}`}
          >
            {APP_STATUS_LABELS[s]} ({statusCounts[s]})
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <p className="text-slate-400">Inga ansökningar hittades</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
          {/* Tracker table keeps status updates fast while retaining existing actions. */}
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Företag</th>
                <th className="px-4 py-3 text-left">Roll</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Datum</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Poäng</th>
                <th className="px-4 py-3 text-right">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{app.companyName}</td>
                  <td className="px-4 py-3 text-slate-600">{app.jobTitle}</td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as AppStatusType)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${APP_STATUS_COLORS[app.status]}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{APP_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{formatDate(app.createdAt)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {app.score ? (
                      <span className={`font-semibold ${app.score >= 4 ? 'text-green-600' : app.score >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {app.score.toFixed(1)}/5
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.jobUrl && (
                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {deleteId === app.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">Säker?</span>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Ja
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded border px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Nej
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(app.id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
