import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard')

  const [totalUsers, totalJobs, totalApplications, totalCVs, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.jobListing.count({ where: { isActive: true } }),
    prisma.application.count(),
    prisma.cV.count({ where: { isActive: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Totala användare', value: totalUsers },
          { label: 'Aktiva jobb', value: totalJobs },
          { label: 'Ansökningar', value: totalApplications },
          { label: 'CV:n', value: totalCVs },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-slate-800 p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Senaste användare</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Namn / E-post</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Roll</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase hidden md:table-cell">Registrerad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3">
                  <p className="text-white font-medium">{u.name ?? '—'}</p>
                  <p className="text-slate-400 text-xs">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs hidden md:table-cell">
                  {new Date(u.createdAt).toLocaleDateString('sv-SE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
