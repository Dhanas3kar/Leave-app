import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    // We would ideally parse the JWT here to redirect to specific role dashboard,
    // but Jose requires async in middleware or we can just redirect to a generic /dashboard
    // Let's redirect to a generic endpoint which then redirects based on role
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
