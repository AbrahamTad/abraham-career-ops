import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { BrainCircuit, LayoutDashboard, Users, FileText, Settings } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { role: true } })
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <aside className="w-56 flex-col border-r border-slate-700 hidden md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-4">
          <BrainCircuit className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {[
            { href: '/admin', icon: LayoutDashboard, label: 'Översikt' },
            { href: '/admin/users', icon: Users, label: 'Användare' },
            { href: '/admin/jobs', icon: FileText, label: 'Jobb' },
            { href: '/admin/settings', icon: Settings, label: 'Inställningar' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white">← Tillbaka till app</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
