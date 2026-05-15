import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function clearAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith('sb-') || cookie.name.includes('supabase'))
    .forEach((cookie) => {
      // Expire every Supabase auth cookie, including chunked auth-token cookies.
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        sameSite: 'lax',
      })
    })

  response.headers.set('Cache-Control', 'no-store')
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  clearAuthCookies(request, response)
  return response
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true })
  clearAuthCookies(request, response)
  return response
}
