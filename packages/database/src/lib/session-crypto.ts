import { SignJWT, jwtVerify } from 'jose';

export function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is missing in production.');
    }
    // Fallback for development only
    return new TextEncoder().encode('super-secret-key-for-prototype-dev-only-do-not-use-in-prod');
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long in production.');
  }

  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  id: string;
  role: string;
  name: string;
};

export async function encrypt(payload: SessionPayload, expiresAt: Date): Promise<string> {
  return await new SignJWT({ user: payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());
}

export async function decrypt(token: string): Promise<{ user: SessionPayload }> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ['HS256'],
  });

  // Verify subject exists
  if (!payload.sub) {
    throw new Error('JWT is missing subject (sub) claim.');
  }

  // Verify the structure matches our expected SessionPayload
  if (!payload.user || typeof payload.user !== 'object') {
    throw new Error('JWT is missing user data.');
  }
  
  const user = payload.user as SessionPayload;
  if (!user.id || !user.role || !user.name) {
      throw new Error('JWT user payload is malformed.');
  }

  // Ensure sub matches the user id
  if (payload.sub !== user.id) {
    throw new Error('JWT sub claim does not match user id.');
  }

  return { user };
}
