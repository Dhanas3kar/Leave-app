import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt, decrypt, getSecretKey } from '../src/lib/session-crypto';
import { SignJWT } from 'jose';

describe('Session Crypto', () => {
  const mockUser = {
    id: 'user-123',
    role: 'EMPLOYEE',
    name: 'Test User'
  };

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('valid token -> decrypts correctly', async () => {
    const token = await encrypt(mockUser, tomorrow);
    const parsed = await decrypt(token);
    expect(parsed.user).toEqual(mockUser);
  });

  it('expired token -> throws error', async () => {
    const token = await encrypt(mockUser, yesterday);
    await expect(decrypt(token)).rejects.toThrow();
  });

  it('tampered token -> throws error', async () => {
    const token = await encrypt(mockUser, tomorrow);
    const tampered = token.slice(0, -5) + 'xxxxx';
    await expect(decrypt(tampered)).rejects.toThrow();
  });

  it('wrong signing secret -> throws error', async () => {
    const wrongKey = new TextEncoder().encode('wrong-secret-key-that-is-long-enough');
    const badToken = await new SignJWT({ user: mockUser })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(mockUser.id)
      .setExpirationTime(tomorrow)
      .sign(wrongKey);

    await expect(decrypt(badToken)).rejects.toThrow();
  });

  it('unexpected algorithm (e.g. none) -> throws error', async () => {
    // jose library actively prevents 'none' alg, but we can simulate a different alg
    const badToken = await new SignJWT({ user: mockUser })
      .setProtectedHeader({ alg: 'HS512' })
      .setSubject(mockUser.id)
      .setExpirationTime(tomorrow)
      .sign(getSecretKey());

    await expect(decrypt(badToken)).rejects.toThrow();
  });

  it('missing sub claim -> throws error', async () => {
    const badToken = await new SignJWT({ user: mockUser })
      .setProtectedHeader({ alg: 'HS256' })
      // missing setSubject
      .setExpirationTime(tomorrow)
      .sign(getSecretKey());

    await expect(decrypt(badToken)).rejects.toThrow('JWT is missing subject (sub) claim.');
  });

  it('sub claim mismatch -> throws error', async () => {
    const badToken = await new SignJWT({ user: mockUser })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('wrong-id')
      .setExpirationTime(tomorrow)
      .sign(getSecretKey());

    await expect(decrypt(badToken)).rejects.toThrow('JWT sub claim does not match user id.');
  });

  it('malformed user data -> throws error', async () => {
    const badToken = await new SignJWT({ user: { id: 'user-123' } }) // missing role, name
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-123')
      .setExpirationTime(tomorrow)
      .sign(getSecretKey());

    await expect(decrypt(badToken)).rejects.toThrow('JWT user payload is malformed.');
  });

  it('requires strong secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', 'weak');

    expect(() => getSecretKey()).toThrow('SESSION_SECRET must be at least 32 characters long in production.');
  });
});
