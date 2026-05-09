'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BrainCircuit,
  LayoutDashboard,
  FileText,
  Search,
  ClipboardList,
  Sparkles,
  Mail,
  Building2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Översikt' },
  { href: '/profile', icon: FileText, label: 'CV & Profil' },
  { href: '/jobs', icon: Search, label: 'Jobbsökning' },
  { href: '/applications', icon: ClipboardList, label: 'Ansökningar' },
  { href: '/cv-builder', icon: Sparkles, label: 'CV-generator' },
  { href: '/cover-letter', icon: Mail, label: 'Personligt brev' },
  { href: '/companies', icon: Building2, label: 'Företag' },
  { href: '/settings', icon: Settings, label: 'Inställningar' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 flex-col border-r bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <BrainCircuit className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-slate-900">CareerOps AI</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-700">Gratis plan</p>
          <p className="mt-0.5 text-xs text-blue-600">10/50 AI-analyser använda</p>
          <div className="mt-2 h-1.5 rounded-full bg-blue-100">
            <div className="h-1.5 w-1/5 rounded-full bg-blue-500" />
          </div>
          <Link href="/pricing" className="mt-2 block text-xs font-medium text-blue-700 hover:underline">
            Uppgradera till Pro →
          </Link>
        </div>
      </div>
    </aside>
  )
}
