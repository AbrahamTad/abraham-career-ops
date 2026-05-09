import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, BrainCircuit, ClipboardList, Search, TrendingUp } from 'lucide-react'
import { formatDate, APP_STATUS_LABELS, APP_STATUS_COLORS } from '@/lib/utils'
import type { AppStatusType } from '@/types'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user!.id },
    include: { profile: true, cvs: { where: { isActive: true }, take: 1 } },
  })

  const [applicationStats, recentMatches, recentApplications] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { userId: dbUser?.id ?? '' },
      _count: true,
    }),
    prisma.jobMatch.findMany({
      where: { userId: dbUser?.id ?? '' },
      include: { jobListing: { include: { company: true } } },
      orderBy: { score: 'desc' },
      take: 5,
    }),
    prisma.application.findMany({
      where: { userId: dbUser?.id ?? '' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ])

  const statsMap = Object.fromEntries(applicationStats.map((s) => [s.status, s._count]))
  const totalApplications = applicationStats.reduce((sum, s) => sum + s._count, 0)
  const hasCV = (dbUser?.cvs?.length ?? 0) > 0

  const name = (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || 'där'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hej, {name}! 👋</h1>
        <p className="mt-1 text-slate-500">Här är en översikt av din jobbsökning</p>
      </div>

      {/* Onboarding alert */}
      {!hasCV && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <BrainCircuit className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-blue-900">Kom igång — ladda upp ditt CV</h2>
              <p className="mt-1 text-sm text-blue-700">
                Ladda upp ditt CV för att låta AI analysera dina styrkor och matcha dig med rätt jobb.
              </p>
              <Link
                href="/profile"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
              >
                Ladda upp CV <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Totalt ansökningar', value: totalApplications, icon: ClipboardList, color: 'blue' },
          { label: 'Intervjuer', value: statsMap['INTERVIEW'] ?? 0, icon: TrendingUp, color: 'purple' },
          { label: 'Erbjudanden', value: statsMap['OFFER'] ?? 0, icon: TrendingUp, color: 'green' },
          { label: 'AI-matchningar', value: recentMatches.length, icon: Search, color: 'orange' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent matches */}
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Bästa jobbmatchningar</h2>
            <Link href="/jobs" className="text-sm text-blue-600 hover:underline">Visa alla →</Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Inga matchningar än. Starta en jobbsökning!</p>
              <Link href="/jobs" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                Sök jobb →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentMatches.map((match) => (
                <li key={match.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {match.jobListing.title}
                    </p>
                    <p className="text-xs text-slate-400">{match.jobListing.company.name}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      match.score >= 4 ? 'bg-green-100 text-green-700' :
                      match.score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {match.score.toFixed(1)}/5
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent applications */}
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Senaste ansökningar</h2>
            <Link href="/applications" className="text-sm text-blue-600 hover:underline">Visa alla →</Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Inga ansökningar ännu.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentApplications.map((app) => (
                <li key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{app.jobTitle}</p>
                    <p className="text-xs text-slate-400">{app.companyName} · {formatDate(app.createdAt)}</p>
                  </div>
                  <span className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${APP_STATUS_COLORS[app.status as AppStatusType]}`}>
                    {APP_STATUS_LABELS[app.status as AppStatusType]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 font-semibold text-slate-900">Snabbåtgärder</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { href: '/profile', label: 'Uppdatera CV', icon: '📄' },
            { href: '/jobs', label: 'Sök jobb', icon: '🔍' },
            { href: '/cv-builder', label: 'Generera CV', icon: '✨' },
            { href: '/companies', label: 'Hitta företag', icon: '🏢' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center hover:border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
