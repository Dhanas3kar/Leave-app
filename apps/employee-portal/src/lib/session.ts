import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET || 'super-secret-key-for-prototype';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function setSession(user: { id: string; role: string; name: string }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

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

export async function getSession() {
  const cookieStore = await cookies();
  if (!cookieStore) return null;
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const parsed = await decrypt(session);
    return parsed.user as { id: string; role: string; name: string };
  } catch (error) {
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
