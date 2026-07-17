import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const adminUsername = 'Kabir2528'
const passwordSalt = '5b6b3741e639e587fecc609c8d43d9bd'
const passwordHash = '810234b940bb7fe68abbbd14aaef1c3991e3729c2d463acda74c070c6faa9195'
const iterations = 210000
const keyLength = 32
const digest = 'sha256'
export const sessionCookieName = 'mk-admin-session'
const sessionMaxAge = 60 * 60 * 12

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || passwordHash
}

function signSession(token: string) {
  return createHmac('sha256', getSessionSecret()).update(token).digest('hex')
}

function verifyPassword(password: string) {
  const attemptedHash = pbkdf2Sync(password, passwordSalt, iterations, keyLength, digest)
  const storedHash = Buffer.from(passwordHash, 'hex')

  return attemptedHash.length === storedHash.length && timingSafeEqual(attemptedHash, storedHash)
}

export function verifyAdminCredentials(username: string, password: string) {
  return username === adminUsername && verifyPassword(password)
}

export function createAdminSession(response: NextResponse) {
  const token = randomBytes(32).toString('hex')
  const signedToken = `${token}.${signSession(token)}`

  response.cookies.set(sessionCookieName, signedToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionMaxAge,
    path: '/',
  })
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })
}

export async function isAdminAuthenticated(request?: NextRequest) {
  const cookieStore = request?.cookies ?? (await cookies())
  const session = cookieStore.get(sessionCookieName)?.value

  if (!session) {
    return false
  }

  const [token, signature] = session.split('.')

  if (!token || !signature) {
    return false
  }

  const expectedSignature = signSession(token)
  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer)
}

export async function requireAdmin(request?: NextRequest) {
  if (await isAdminAuthenticated(request)) {
    return null
  }

  return NextResponse.json({ message: 'Please login as admin.' }, { status: 401 })
}
