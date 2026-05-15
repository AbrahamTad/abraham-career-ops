import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export interface AuthContext {
  supabaseUserId: string
  dbUserId: string
  email: string
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ensure user exists in DB (handles first-time login without OAuth callback)
  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    create: {
      supabaseId: user.id,
      email: user.email!,
      name: (user.user_metadata?.name as string) || null,
      // New local test accounts get a larger dev quota; production still uses schema defaults.
      subscription: { create: { plan: 'free', status: 'active', aiCallsLimit: process.env.NODE_ENV === 'production' ? 50 : 500 } },
    },
    update: {},
    select: { id: true },
  })

  return {
    supabaseUserId: user.id,
    dbUserId: dbUser.id,
    email: user.email!,
  }
}

export function isAuthResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}
