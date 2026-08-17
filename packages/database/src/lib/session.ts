import { cookies } from 'next/headers';
import { encrypt, decrypt, SessionPayload } from './session-crypto';

export async function setSession(user: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt(user, expires);

  const cookieStore = await cookies();
  if (!cookieStore) return;
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  if (!cookieStore) return null;
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const parsed = await decrypt(session);
    return parsed.user;
  } catch (error) {
    // If token is invalid or expired, clear it proactively
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  if (!cookieStore) return;
  cookieStore.set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
