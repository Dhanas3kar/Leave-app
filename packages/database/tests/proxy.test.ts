import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from '../../../apps/employee-portal/src/proxy';
import { encrypt } from '../src/lib/session-crypto';
import { NextRequest } from 'next/server';

vi.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: vi.fn((url) => {
        return {
          cookies: { set: vi.fn() },
          url: url.toString()
        };
      }),
      next: vi.fn(() => ({ status: 'next' }))
    }
  };
});

describe('Proxy Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (sessionCookie: string | null, path: string) => {
    return {
      cookies: {
        get: (name: string) => (name === 'session' && sessionCookie ? { value: sessionCookie } : undefined)
      },
      nextUrl: {
        pathname: path
      },
      url: 'http://test.local' + path
    } as unknown as NextRequest;
  };

  it('No session -> redirects to /login', async () => {
    const req = createRequest(null, '/employee');
    const res = await proxy(req) as any;
    expect(res.url).toContain('/login');
  });

  it('Valid session -> protected request continues', async () => {
    const validToken = await encrypt({ id: '1', role: 'EMPLOYEE', name: 'Test' }, new Date(Date.now() + 100000));
    const req = createRequest(validToken, '/employee');
    const res = await proxy(req) as any;
    expect(res.status).toBe('next');
  });

  it('Expired session -> cookie removed -> /login', async () => {
    const expiredToken = await encrypt({ id: '1', role: 'EMPLOYEE', name: 'Test' }, new Date(Date.now() - 10000));
    const req = createRequest(expiredToken, '/employee');
    const res = await proxy(req) as any;
    expect(res.url).toContain('/login');
    expect(res.cookies.set).toHaveBeenCalledWith('session', '', { maxAge: 0 });
  });

  it('Tampered session -> cookie removed -> /login', async () => {
    const validToken = await encrypt({ id: '1', role: 'EMPLOYEE', name: 'Test' }, new Date(Date.now() + 100000));
    const tampered = validToken.slice(0, -5) + 'xxxxx';
    const req = createRequest(tampered, '/employee');
    const res = await proxy(req) as any;
    expect(res.url).toContain('/login');
    expect(res.cookies.set).toHaveBeenCalledWith('session', '', { maxAge: 0 });
  });

  it('Malformed session -> cookie removed -> /login', async () => {
    const req = createRequest('not-a-jwt', '/employee');
    const res = await proxy(req) as any;
    expect(res.url).toContain('/login');
    expect(res.cookies.set).toHaveBeenCalledWith('session', '', { maxAge: 0 });
  });
});
