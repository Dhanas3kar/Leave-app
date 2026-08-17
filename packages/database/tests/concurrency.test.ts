import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../index';
import { approveLeaveRequest, createLeaveRequest } from '../src/actions/leave';
import { getCurrentUser } from '../src/lib/session';

// We need to mock getCurrentUser to test the server actions.
import * as sessionModule from '../src/lib/session';
import { vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Concurrency & Approvals', () => {
  let userId: string;
  let req1Id: string;
  let req2Id: string;
  let managerId: string;

  beforeAll(async () => {
    // 1. Create a dummy manager
    const manager = await prisma.user.create({
      data: {
        email: 'manager_concurrency@test.com',
        name: 'Manager',
        password: 'pass',
        role: 'MANAGER',
      }
    });
    managerId = manager.id;

    // 2. Create a dummy employee
    const user = await prisma.user.create({
      data: {
        email: 'employee_concurrency@test.com',
        name: 'Employee',
        password: 'pass',
        role: 'EMPLOYEE',
      }
    });
    userId = user.id;

    // 3. Create a leave balance with exactly 5 total days, 0 used.
    await prisma.leaveBalance.create({
      data: {
        userId: userId,
        totalDays: 5,
        usedDays: 0,
      }
    });

    // 4. Directly insert two overlapping requests (each 4 days) directly to bypass createLeaveRequest overlap checks for this specific concurrency test, because we want to test the approval race condition specifically.
    // Or we can create two non-overlapping 4-day requests? The requirement says "Request A = 4 days, Request B = 4 days, attempt to approve both".
    // Let's create two non-overlapping requests, so it's a pure balance concurrency test!
    
    const r1 = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: new Date('2028-01-01'),
        endDate: new Date('2028-01-04'), // 4 days
        reason: 'Req 1',
        type: 'ANNUAL',
        status: 'PENDING'
      }
    });
    req1Id = r1.id;

    const r2 = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: new Date('2028-02-01'),
        endDate: new Date('2028-02-04'), // 4 days
        reason: 'Req 2',
        type: 'ANNUAL',
        status: 'PENDING'
      }
    });
    req2Id = r2.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.leaveRequest.deleteMany({ where: { userId } });
    await prisma.leaveBalance.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.user.delete({ where: { id: managerId } });
    
    // restore mock
    vi.restoreAllMocks();
  });

  it('should prevent concurrent approvals from exceeding the balance quota', async () => {
    // Mock the session to be the manager
    vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
      id: managerId,
      email: 'manager_concurrency@test.com',
      role: 'MANAGER',
      name: 'Manager'
    } as any);

    // Fire both approveLeaveRequest promises simultaneously
    const results = await Promise.all([
      approveLeaveRequest(req1Id),
      approveLeaveRequest(req2Id)
    ]);

    // One should succeed, one should fail
    const successes = results.filter(r => r && (r as any).success);
    const errors = results.filter(r => r && (r as any).error);

    expect(successes.length).toBe(1);
    expect(errors.length).toBe(1);
    expect((errors[0] as any).error).toMatch(/Concurrency conflict|Not enough leave balance/);

    // Verify balance in database
    const balance = await prisma.leaveBalance.findUnique({ where: { userId } });
    expect(balance?.usedDays).toBe(4);
    expect(balance?.totalDays).toBe(5);

    // Verify request statuses
    const req1 = await prisma.leaveRequest.findUnique({ where: { id: req1Id } });
    const req2 = await prisma.leaveRequest.findUnique({ where: { id: req2Id } });

    // Exactly one should be APPROVED, the other PENDING
    const statuses = [req1?.status, req2?.status];
    expect(statuses).toContain('APPROVED');
    expect(statuses).toContain('PENDING');
  });
});
