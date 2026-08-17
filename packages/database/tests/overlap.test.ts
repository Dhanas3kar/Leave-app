import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../index';
import { createLeaveRequest } from '../src/actions/leave';
import * as sessionModule from '../src/lib/session';
import { vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Overlap Detection', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'employee_overlap@test.com',
        name: 'Employee',
        password: 'pass',
        role: 'EMPLOYEE',
      }
    });
    userId = user.id;

    await prisma.leaveBalance.create({
      data: {
        userId,
        totalDays: 20,
        usedDays: 0,
      }
    });

    vi.spyOn(sessionModule, 'getCurrentUser').mockResolvedValue({
      id: userId,
      email: 'employee_overlap@test.com',
      role: 'EMPLOYEE',
      name: 'Employee'
    } as any);
  });

  afterAll(async () => {
    await prisma.leaveRequest.deleteMany({ where: { userId } });
    await prisma.leaveBalance.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    vi.restoreAllMocks();
  });

  it('should allow first request', async () => {
    const formData = new FormData();
    formData.append('startDate', '2027-01-10');
    formData.append('endDate', '2027-01-15');
    formData.append('type', 'ANNUAL');
    formData.append('reason', 'Test');
    
    const res = await createLeaveRequest(null, formData);
    expect(res).toEqual({ success: true });
  });

  it('should reject overlapping request inside the same window', async () => {
    const formData = new FormData();
    formData.append('startDate', '2027-01-12');
    formData.append('endDate', '2027-01-14');
    formData.append('type', 'ANNUAL');
    formData.append('reason', 'Test overlap inner');
    
    const res = await createLeaveRequest(null, formData);
    expect(res).toEqual({ error: 'You already have a leave request during this period.' });
  });

  it('should reject overlapping request starting before and ending inside', async () => {
    const formData = new FormData();
    formData.append('startDate', '2027-01-08');
    formData.append('endDate', '2027-01-11');
    formData.append('type', 'ANNUAL');
    formData.append('reason', 'Test overlap left');
    
    const res = await createLeaveRequest(null, formData);
    expect(res).toEqual({ error: 'You already have a leave request during this period.' });
  });

  it('should allow non-overlapping request after', async () => {
    const formData = new FormData();
    formData.append('startDate', '2027-01-16');
    formData.append('endDate', '2027-01-18');
    formData.append('type', 'ANNUAL');
    formData.append('reason', 'Test no overlap');
    
    const res = await createLeaveRequest(null, formData);
    expect(res).toEqual({ success: true });
  });
});
