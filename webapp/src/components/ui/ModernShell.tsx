import type { ReactNode } from 'react'

export function PageSurface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/70 bg-white/80 shadow-sm shadow-slate-200/70 backdrop-blur ${className}`}>
      {children}
    </div>
  )
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-xl shadow-slate-200">
      {/* Shared page hero creates one modern dashboard language across updated pages. */}
      <div className="relative">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-2xl font-bold md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center">
      {/* Empty states explain the next best action without blocking the workflow. */}
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
