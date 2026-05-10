import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE() {
  const auth = await requireAuth()
  if (isAuthResponse(auth)) return auth

  try {
    // Delete all user data in order (respecting FK constraints)
    await prisma.jobMatch.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.generatedCV.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.coverLetter.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.application.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.searchTask.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.cV.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.userProfile.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.subscription.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.auditLog.deleteMany({ where: { userId: auth.dbUserId } })
    await prisma.user.delete({ where: { id: auth.dbUserId } })

    // Delete Supabase auth user
    const supabaseAdmin = await createAdminClient()
    await supabaseAdmin.auth.admin.deleteUser(auth.supabaseUserId)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunde inte ta bort konto' },
      { status: 500 }
    )
  }
}
