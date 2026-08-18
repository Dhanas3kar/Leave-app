import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  requireAuthenticatedUser, 
  requireRole, 
  requireEmployee, 
  requireManager,
  authorizeLeaveOwnership,
  AuthenticationError,
  AuthorizationError
} from '../src/lib/authorization';
import * as sessionModule from '../src/lib/session';

describe('Central Authorization Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuthenticatedUser', () => {
    it('throws AuthenticationError if no session', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(null);
      await expect(requireAuthenticatedUser()).rejects.toThrow(AuthenticationError);
    });

    it('returns user if session exists', async () => {
      const user = { id: '1', role: 'EMPLOYEE', name: 'Test' };
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(user);
      await expect(requireAuthenticatedUser()).resolves.toEqual(user);
    });
  });

  describe('requireRole', () => {
    it('throws AuthorizationError if role mismatch', async () => {
      const user = { id: '1', role: 'EMPLOYEE', name: 'Test' };
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(user);
      await expect(requireRole('MANAGER')).rejects.toThrow(AuthorizationError);
    });

    it('returns user if role matches', async () => {
      const user = { id: '1', role: 'MANAGER', name: 'Test' };
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(user);
      await expect(requireRole('MANAGER')).resolves.toEqual(user);
    });
  });

  describe('authorizeLeaveOwnership', () => {
    it('throws AuthorizationError if request not found', async () => {
      const user = { id: '1', role: 'EMPLOYEE', name: 'Test' };
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(user);
      
      const mockPrisma = {
        leaveRequest: {
          findUnique: vi.fn().mockResolvedValue(null)
        }
      };

      await expect(authorizeLeaveOwnership('req-1', mockPrisma as any)).rejects.toThrow(AuthorizationError);
    });

    it('throws AuthorizationError if request belongs to another user (IDOR)', async () => {
      const user = { id: '1', role: 'EMPLOYEE', name: 'Test' };
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(user);
      
      const mockPrisma = {
        leaveRequest: {
          findUnique: vi.fn().mockResolvedValue({ id: 'req-1', userId: '2' })
        }
      };

      await expect(authorizeLeaveOwnership('req-1', mockPrisma as any)).rejects.toThrow(AuthorizationError);
    });

    it('returns request if ownership is verified', async () => {
      const user = { id: '1', role: 'EMPLOYEE', name: 'Test' };
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(user);
      
      const request = { id: 'req-1', userId: '1' };
      const mockPrisma = {
        leaveRequest: {
          findUnique: vi.fn().mockResolvedValue(request)
        }
      };

      await expect(authorizeLeaveOwnership('req-1', mockPrisma as any)).resolves.toEqual(request);
    });
  });
});
