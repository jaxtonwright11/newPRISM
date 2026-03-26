import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/settings', '/profile', '/messages', '/bookmarks'];

// Routes that are always public
const publicRoutes = ['/', '/login', '/signup', '/onboarding', '/search', '/landing', '/apply', '/admin'];

// Prefixes that are always public
const publicPrefixes = ['/topic/', '/community/', '/perspective/', '/api/', '/_next/', '/favicon', '/auth/'];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check for Supabase auth cookie
  if (isProtectedRoute(pathname)) {
    // Supabase stores auth tokens in cookies prefixed with sb-
    const hasAuthCookie = request.cookies.getAll().some(
      (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    );

    if (!hasAuthCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
