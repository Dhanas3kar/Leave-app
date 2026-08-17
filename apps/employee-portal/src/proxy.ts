import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@leave-app/database/src/lib/session-crypto';

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;
  let isValid = false;

  if (session) {
    try {
      await decrypt(session);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  if (!isValid && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (session) {
      response.cookies.set('session', '', { maxAge: 0 });
    }
    return response;
  }

  if (isValid && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
