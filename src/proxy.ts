import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'session'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password']

// Routes that allow guest access (show demo data without authentication)
const GUEST_ALLOWED_ROUTES = [
  '/dashboard',
  '/app-analytics',
  '/revenue',
  '/dev-insights',
  '/website-analytics',
  '/product-analytics',
  '/customer-support',
  '/investors',
  '/fundraising',
  '/okrs',
  '/documents',
  '/notes',
  '/templates',
  '/roadmap',
  '/calendar',
  '/tasks',
  '/activity',
  '/ai-studio',
]

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

  // Guest-allowed routes - allow access even without session (show demo data)
  if (GUEST_ALLOWED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Protected routes (settings, team, integrations) - require authentication
  if (pathname.startsWith('/settings') || pathname.startsWith('/team') || pathname.startsWith('/integrations')) {
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
