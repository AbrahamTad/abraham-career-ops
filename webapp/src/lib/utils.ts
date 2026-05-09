import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatSalary(min?: number | null, max?: number | null, currency = 'SEK'): string {
  if (!min && !max) return 'Ej angiven'
  if (min && max) return `${min.toLocaleString('sv-SE')} – ${max.toLocaleString('sv-SE')} ${currency}`
  if (min) return `Från ${min.toLocaleString('sv-SE')} ${currency}`
  return `Upp till ${max!.toLocaleString('sv-SE')} ${currency}`
}

export function scoreToTier(score: number): 'strong' | 'medium' | 'weak' {
  if (score >= 4.0) return 'strong'
  if (score >= 3.0) return 'medium'
  return 'weak'
}

export function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    strong: 'Stark matchning',
    medium: 'God matchning',
    weak: 'Svag matchning',
  }
  return labels[tier] ?? tier
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
