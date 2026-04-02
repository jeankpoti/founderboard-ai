import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'session'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password']

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Check if user has a session cookie (basic check - full verification in layout)
  const hasSession = !!sessionCookie

  // Auth routes (login/signup) - redirect to dashboard if already logged in
  if (AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Public routes - allow access
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Protected routes (dashboard, etc.) - redirect to login if no session
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/tasks') || pathname.startsWith('/ai-studio')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
