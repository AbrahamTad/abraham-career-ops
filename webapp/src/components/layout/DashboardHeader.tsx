'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import { LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function DashboardHeader({ user }: { user: User }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const name = (user.user_metadata?.name as string) || user.email || ''

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Du har loggats ut')
    router.push('/')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {getInitials(name)}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 md:block">
            {name}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg">
            <div className="border-b px-3 py-2">
              <p className="text-xs font-medium text-slate-900 truncate">{name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logga ut
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
