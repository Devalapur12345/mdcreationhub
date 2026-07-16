import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ isLoggedIn: await isAdminAuthenticated() })
}
