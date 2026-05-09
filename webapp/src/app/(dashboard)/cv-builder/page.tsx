'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2, Download, Copy, RotateCcw } from 'lucide-react'

export default function CVBuilderPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [language, setLanguage] = useState<'sv' | 'en'>('sv')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ content: string; id: string } | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/cv/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, companyName, jobDescription, language }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      const data = await res.json()
      setResult(data)
      toast.success('CV anpassat!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fel vid generering')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result.content)
      toast.success('Kopierat!')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI CV-generator</h1>
        <p className="mt-1 text-slate-500">Anpassa ditt CV automatiskt för en specifik tjänst</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-5 font-semibold text-slate-900">Jobbinformation</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Jobbtitel</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                placeholder="Frontend Developer"
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Företag</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Volvo Cars"
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Jobbannons (klistra in texten)</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={6}
                placeholder="Klistra in hela jobbannonsen här..."
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Språk</label>
              <div className="flex gap-3">
                {(['sv', 'en'] as const).map((l) => (
                  <label key={l} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={l}
                      checked={language === l}
                      onChange={() => setLanguage(l)}
                    />
                    <span className="text-sm">{l === 'sv' ? '🇸🇪 Svenska' : '🇬🇧 English'}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Genererar...' : 'Generera anpassat CV'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Resultat</h2>
            {result && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <Copy className="h-3.5 w-3.5" />
                  Kopiera
                </button>
                <button onClick={() => setResult(null)} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Rensa
                </button>
              </div>
            )}
          </div>
          {result ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed max-h-96 overflow-y-auto">
              {result.content}
            </pre>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="mt-4 text-sm text-slate-400">AI anpassar ditt CV...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Sparkles className="h-10 w-10 text-slate-200" />
              <p className="mt-4 text-sm text-slate-400">
                Fyll i jobbet till vänster och klicka på generera
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-blue-50 p-5">
        <h3 className="mb-2 font-semibold text-blue-900">Hur fungerar det?</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• AI läser ditt CV och jobbannonsens krav</li>
          <li>• Relevanta erfarenheter lyfts fram och omformuleras</li>
          <li>• Innehållet förblir alltid äkta — inga påhittade erfarenheter</li>
          <li>• Du kan redigera resultatet fritt innan du skickar</li>
        </ul>
      </div>
    </div>
  )
}
