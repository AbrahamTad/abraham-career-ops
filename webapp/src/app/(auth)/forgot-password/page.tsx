'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/settings/password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">📧</div>
          <h1 className="mb-2 text-xl font-bold">Kolla din e-post</h1>
          <p className="text-sm text-slate-500">
            Vi har skickat en återställningslänk till <strong>{email}</strong>.
          </p>
          <Link href="/login" className="mt-6 block text-sm text-blue-600 hover:underline">
            Tillbaka till inloggning
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Återställ lösenord</h1>
        <p className="mb-8 text-sm text-slate-500">
          Ange din e-post så skickar vi en återställningslänk.
        </p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="din@email.com"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Skicka återställningslänk
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="text-blue-600 hover:underline">Tillbaka till inloggning</Link>
        </p>
      </div>
    </div>
  )
}
