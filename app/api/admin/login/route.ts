import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, verifyAdminCredentials } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { username, password } = (await request.json()) as { username?: string; password?: string }

  if (!username || !password || !verifyAdminCredentials(username, password)) {
    return NextResponse.json({ message: 'Wrong credentials. Please try again.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  createAdminSession(response)
  return response
}
