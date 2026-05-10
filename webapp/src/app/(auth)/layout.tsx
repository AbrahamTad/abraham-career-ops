import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BrainCircuit className="h-7 w-7 text-blue-600" />
        <span className="text-2xl font-bold text-slate-900">CareerBridge AI</span>
      </Link>
      {children}
      <p className="mt-8 text-xs text-slate-400">
        © {new Date().getFullYear()} CareerBridge AI · Byggt för den svenska arbetsmarknaden
      </p>
    </div>
  )
}
