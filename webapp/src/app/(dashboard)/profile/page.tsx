'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, FileText, Loader2, CheckCircle, Trash2 } from 'lucide-react'

export default function ProfilePage() {
  const [cv, setCv] = useState<{ id: string; fileName?: string | null; rawText: string; createdAt: string } | null>(null)
  const [profile, setProfile] = useState<{
    fullName?: string | null
    phone?: string | null
    city?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    targetRoles?: string[]
    targetSalaryMin?: number | null
    targetSalaryMax?: number | null
    workPreference?: string[]
    jobTypes?: string[]
    liaEnabled?: boolean
    liaDate1Start?: string | null
    liaDate1End?: string | null
    skills?: string[]
    bio?: string | null
  } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cvRes, profileRes] = await Promise.all([
        fetch('/api/cv'),
        fetch('/api/profile'),
      ])
      if (cvRes.ok) {
        const data = await cvRes.json()
        setCv(data.cv)
      }
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile ?? {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleFileUpload(file: File) {
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Filen är för stor. Max 5 MB.')
      return
    }
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowed.includes(file.type)) {
      toast.error('Filformat stöds inte. Använd PDF, DOCX eller TXT.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/cv', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('CV uppladdat!')
      await loadData()

      // Auto-analyze
      setAnalyzing(true)
      const analyzeRes = await fetch('/api/ai/analyze-cv', { method: 'POST' })
      if (analyzeRes.ok) toast.success('CV analyserat av AI')
      else toast.error('AI-analys misslyckades – försök igen')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Uppladdning misslyckades')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  async function handlePasteCV() {
    const text = prompt('Klistra in ditt CV som text:')
    if (!text?.trim()) return
    setUploading(true)
    try {
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('CV sparat!')
      await loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fel')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteCV() {
    if (!cv) return
    if (!confirm('Ta bort ditt CV?')) return
    const res = await fetch('/api/cv', { method: 'DELETE' })
    if (res.ok) { toast.success('CV borttaget'); setCv(null) }
    else toast.error('Fel vid borttagning')
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    const form = new FormData(e.currentTarget)
    const data = {
      fullName: form.get('fullName') as string,
      phone: form.get('phone') as string,
      city: form.get('city') as string,
      linkedinUrl: form.get('linkedinUrl') as string,
      githubUrl: form.get('githubUrl') as string,
      targetSalaryMin: parseInt(form.get('salaryMin') as string) || null,
      targetSalaryMax: parseInt(form.get('salaryMax') as string) || null,
      bio: form.get('bio') as string,
      liaEnabled: form.get('liaEnabled') === 'on',
      liaDate1Start: form.get('liaDate1Start') as string || null,
      liaDate1End: form.get('liaDate1End') as string || null,
      targetRoles: (form.get('targetRoles') as string).split(',').map(s => s.trim()).filter(Boolean),
      skills: (form.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean),
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Profil sparad!')
      setProfile(data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fel')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CV & Profil</h1>
        <p className="mt-1 text-slate-500">Hantera ditt CV och profilinformation</p>
      </div>

      {/* CV Upload */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Ditt CV</h2>
        {cv ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{cv.fileName ?? 'CV uppladdad'}</p>
                  <p className="text-xs text-green-600">{cv.rawText.length.toLocaleString()} tecken</p>
                </div>
              </div>
              <button onClick={handleDeleteCV} className="text-slate-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f) }}
            className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}
          >
            <Upload className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="mb-2 font-medium text-slate-600">Dra och släpp ditt CV här</p>
            <p className="mb-4 text-sm text-slate-400">PDF, DOCX eller TXT · Max 5 MB</p>
            <div className="flex items-center justify-center gap-3">
              <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Välj fil'}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                />
              </label>
              <button
                onClick={handlePasteCV}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
                Klistra in text
              </button>
            </div>
          </div>
        )}
        {analyzing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI analyserar ditt CV...
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Profilinformation</h2>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Namn</label>
              <input name="fullName" defaultValue={profile?.fullName ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Förnamn Efternamn" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Telefon</label>
              <input name="phone" defaultValue={profile?.phone ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="+46 70 000 00 00" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Stad</label>
            <input name="city" defaultValue={profile?.city ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Göteborg" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">LinkedIn</label>
              <input name="linkedinUrl" defaultValue={profile?.linkedinUrl ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="linkedin.com/in/..." />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">GitHub</label>
              <input name="githubUrl" defaultValue={profile?.githubUrl ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="github.com/..." />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Önskade roller (kommaseparerade)</label>
            <input name="targetRoles" defaultValue={profile?.targetRoles?.join(', ') ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Frontend Developer, QA Engineer" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kompetenser (kommaseparerade)</label>
            <input name="skills" defaultValue={profile?.skills?.join(', ') ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="React, TypeScript, Python" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Lägsta lön (SEK/mån)</label>
              <input name="salaryMin" type="number" defaultValue={profile?.targetSalaryMin ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="35000" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Högsta lön (SEK/mån)</label>
              <input name="salaryMax" type="number" defaultValue={profile?.targetSalaryMax ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="45000" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="liaEnabled" type="checkbox" defaultChecked={profile?.liaEnabled ?? false} className="rounded" />
              <span className="text-sm font-medium text-slate-700">Jag söker LIA-plats</span>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">LIA 1 start</label>
              <input name="liaDate1Start" type="date" defaultValue={profile?.liaDate1Start?.slice(0, 10) ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">LIA 1 slut</label>
              <input name="liaDate1End" type="date" defaultValue={profile?.liaDate1End?.slice(0, 10) ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Om dig (kort bio)</label>
            <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ''} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Berätta kort om dig själv och vad du söker..." />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            Spara profil
          </button>
        </form>
      </div>
    </div>
  )
}
