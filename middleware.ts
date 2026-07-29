import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth')
  const isPublicApi = request.nextUrl.pathname.startsWith('/api/cfo-insights') || request.nextUrl.pathname.startsWith('/api/send-reminders')

  // Allow auth API and some public webhooks/crons
  if (isAuthApi || isPublicApi) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('admin_auth')?.value

  // If there's no auth cookie, redirect to /login
  if (!authCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If there is an auth cookie and user is on /login, redirect to /
  if (authCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
