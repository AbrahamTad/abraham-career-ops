'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Lösenordet måste vara minst 8 tecken')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      toast.success('Konto skapat! Kolla din e-post för att bekräfta.')
      router.push('/login')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registrering misslyckades')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Skapa konto gratis</h1>
        <p className="mb-8 text-sm text-slate-500">
          Börja hitta rätt jobb med AI-stöd
        </p>

        <button
          onClick={handleGoogleSignUp}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-lg border py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Fortsätt med Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs text-slate-400">
            <span className="bg-white px-2">eller med e-post</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Namn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ditt namn"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minst 8 tecken"
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Skapa konto
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Genom att registrera dig godkänner du våra{' '}
          <Link href="/terms" className="underline">Villkor</Link> och{' '}
          <Link href="/privacy" className="underline">Integritetspolicy</Link>.
        </p>

        <p className="mt-6 text-center text-sm text-slate-500">
          Har du redan ett konto?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  )
}
