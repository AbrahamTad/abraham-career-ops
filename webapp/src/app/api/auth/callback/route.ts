import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert user in our database
      await prisma.user.upsert({
        where: { supabaseId: data.user.id },
        create: {
          supabaseId: data.user.id,
          email: data.user.email!,
          name: (data.user.user_metadata?.name as string) || null,
          avatarUrl: (data.user.user_metadata?.avatar_url as string) || null,
          subscription: {
            create: { plan: 'free', status: 'active' },
          },
        },
        update: {
          email: data.user.email!,
          name: (data.user.user_metadata?.name as string) || null,
          avatarUrl: (data.user.user_metadata?.avatar_url as string) || null,
        },
      })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-error`)
}
