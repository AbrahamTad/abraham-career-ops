'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CheckoutButtonProps {
  className?: string
  label?: string
}

export default function CheckoutButton({ className, label = 'Starta Pro' }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Checkout is not available yet. Contact support.')
        return
      }

      window.location.href = data.url
    } catch {
      toast.error('Could not start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
