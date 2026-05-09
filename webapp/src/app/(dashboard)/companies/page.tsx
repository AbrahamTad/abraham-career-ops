'use client'

import { useState } from 'react'
import { Building2, Loader2, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface DiscoveredCompany {
  name: string
  domain?: string
  industry?: string
  size?: string
  location?: string
  reason: string
  careerPageUrl?: string
  linkedinUrl?: string
  outreachMessage: string
}

export default function CompaniesPage() {
  const [targetRole, setTargetRole] = useState('')
  const [location, setLocation] = useState('Göteborg')
  const [liaFocus, setLiaFocus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<DiscoveredCompany[]>([])

  async function handleDiscover(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setCompanies([])
    try {
      const res = await fetch('/api/ai/discover-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, location, liaFocus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCompanies(data.companies)
      toast.success(`Hittade ${data.companies.length} relevanta företag`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sökning misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Företagsupptäckt</h1>
        <p className="mt-1 text-slate-500">
          AI hittar relevanta företag baserat på ditt CV och mål — inklusive LIA-platser utan öppna annonser
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <form onSubmit={handleDiscover} className="flex flex-wrap gap-3">
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            required
            placeholder="Önskad roll (t.ex. Frontend Developer)"
            className="flex-1 min-w-48 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Stad"
            className="w-36 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={liaFocus} onChange={(e) => setLiaFocus(e.target.checked)} className="rounded" />
            LIA-fokus
          </label>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            Hitta företag
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-slate-400">AI söker relevanta företag...</p>
        </div>
      )}

      {companies.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500">{companies.length} företag hittade</p>
          {companies.map((company, i) => (
            <div key={i} className="rounded-xl border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{company.name}</h3>
                    {company.industry && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{company.industry}</span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-slate-400">
                    {company.location && <span>📍 {company.location}</span>}
                    {company.size && <span>👥 {company.size}</span>}
                    {company.domain && <span>🌐 {company.domain}</span>}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{company.reason}</p>

                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-medium text-slate-500">Förslag på kontaktmeddelande:</p>
                    <p className="text-sm text-slate-700 italic">{company.outreachMessage}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(company.outreachMessage); toast.success('Kopierat!') }}
                      className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Copy className="h-3 w-3" /> Kopiera meddelande
                    </button>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {company.careerPageUrl && (
                    <a href={company.careerPageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                      <ExternalLink className="h-3 w-3" /> Karriärsida
                    </a>
                  )}
                  {company.linkedinUrl && (
                    <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                      <ExternalLink className="h-3 w-3" /> LinkedIn
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
