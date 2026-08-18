import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as leaveActions from '../src/actions/leave';
import * as sessionModule from '../src/lib/session';
import { prisma } from '../index';

describe('Leave Actions Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLeaveRequest', () => {
    it('denies unauthenticated access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(null);
      const result = await leaveActions.createLeaveRequest(null, new FormData());
      expect(result).toEqual({ error: 'Authentication required.' });
    });

    it('denies manager access (privilege escalation)', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: '1', role: 'MANAGER', name: 'Test' });
      const result = await leaveActions.createLeaveRequest(null, new FormData());
      expect(result).toEqual({ error: 'You do not have permission to perform this action.' });
    });
  });

  describe('cancelLeaveRequest', () => {
    it('denies unauthenticated access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(null);
      const result = await leaveActions.cancelLeaveRequest('req-1');
      expect(result).toEqual({ error: 'Authentication required.' });
    });

    it('denies manager access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: '1', role: 'MANAGER', name: 'Test' });
      const result = await leaveActions.cancelLeaveRequest('req-1');
      expect(result).toEqual({ error: 'You do not have permission to perform this action.' });
    });

    it('denies if request does not belong to user (IDOR)', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: 'user-1', role: 'EMPLOYEE', name: 'Test' });
      vi.spyOn(prisma.leaveRequest, 'findUnique').mockResolvedValue({ id: 'req-1', userId: 'user-2' } as any);

      const result = await leaveActions.cancelLeaveRequest('req-1');
      expect(result).toEqual({ error: 'You do not have permission to perform this action.' });
    });

    it('denies cancellation of APPROVED requests', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: 'user-1', role: 'EMPLOYEE', name: 'Test' });
      vi.spyOn(prisma.leaveRequest, 'findUnique').mockResolvedValue({ id: 'req-1', userId: 'user-1', status: 'APPROVED' } as any);
      vi.spyOn(prisma.leaveRequest, 'updateMany').mockResolvedValue({ count: 0 } as any);

      const result = await leaveActions.cancelLeaveRequest('req-1');
      expect(result).toEqual({ error: 'Invalid request or cannot be cancelled' });
    });
  });

  describe('approveLeaveRequest', () => {
    it('denies unauthenticated access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(null);
      const result = await leaveActions.approveLeaveRequest('req-1');
      expect(result).toEqual({ error: 'Authentication required.' });
    });

    it('denies employee access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: 'user-1', role: 'EMPLOYEE', name: 'Test' });
      const result = await leaveActions.approveLeaveRequest('req-1');
      expect(result).toEqual({ error: 'You do not have permission to perform this action.' });
    });

    it('denies manager self-approval', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: 'manager-1', role: 'MANAGER', name: 'Test' });
      
      // We need to simulate the transaction. Since we're just checking the error handling,
      // we can mock prisma.$transaction to immediately execute and throw the inner error
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
         await cb({
           leaveRequest: {
             findUnique: vi.fn().mockResolvedValue({ id: 'req-1', userId: 'manager-1', status: 'PENDING' })
           }
         });
      });

      const result = await leaveActions.approveLeaveRequest('req-1');
      expect(result).toEqual({ error: 'Managers cannot approve their own leave requests.' });
    });
  });

  describe('rejectLeaveRequest', () => {
    it('denies unauthenticated access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(null);
      const result = await leaveActions.rejectLeaveRequest('req-1');
      expect(result).toEqual({ error: 'Authentication required.' });
    });

    it('denies employee access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: 'user-1', role: 'EMPLOYEE', name: 'Test' });
      const result = await leaveActions.rejectLeaveRequest('req-1');
      expect(result).toEqual({ error: 'You do not have permission to perform this action.' });
    });
  });
  
  describe('getLeaveStats', () => {
    it('returns null for unauthenticated access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue(null);
      const result = await leaveActions.getLeaveStats();
      expect(result).toBeNull();
    });

    it('returns null for employee access', async () => {
      vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({ id: 'user-1', role: 'EMPLOYEE', name: 'Test' });
      const result = await leaveActions.getLeaveStats();
      expect(result).toBeNull();
    });
  });
});
