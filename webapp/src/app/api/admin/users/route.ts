import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') return null
  return dbUser
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    include: { subscription: true, _count: { select: { applications: true, cvs: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ users })
}
