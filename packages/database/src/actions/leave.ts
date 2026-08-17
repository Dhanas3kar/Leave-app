"use server";

import { prisma } from '../../index';
import { getCurrentUser } from '../lib/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createLeaveSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  type: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY']).default('ANNUAL'),
  reason: z.string().min(1),
});

import { isValidDateRange, calculateLeaveDays } from '../lib/dates';

export async function createLeaveRequest(prevState: any, formData: FormData) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'EMPLOYEE') {
    return { error: 'Unauthorized' };
  }

  const result = createLeaveSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: 'Invalid input data.' };
  }

  const { startDate, endDate, type, reason } = result.data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!isValidDateRange(start, end)) {
    return { error: 'Invalid dates or end date cannot be before start date' };
  }

  const requestedDays = calculateLeaveDays(start, end);

  // Check for overlapping pending or approved requests
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      userId: session.id,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } }
      ]
    }
  });

  if (overlapping) {
    return { error: 'You already have a leave request during this period.' };
  }

  const balance = await prisma.leaveBalance.findUnique({
    where: { userId: session.id }
  });

  if (!balance) {
    return { error: 'Leave balance not found' };
  }

  if (balance.totalDays - balance.usedDays < requestedDays) {
    return { error: 'Not enough leave balance' };
  }

  await prisma.leaveRequest.create({
    data: {
      userId: session.id,
      startDate: start,
      endDate: end,
      reason,
      type,
      status: 'PENDING'
    }
  });

  revalidatePath('/employee');
  return { success: true };
}

export async function cancelLeaveRequest(requestId: string) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'EMPLOYEE') {
    return { error: 'Unauthorized' };
  }

  // PENDING -> CANCELLED
  const result = await prisma.leaveRequest.updateMany({
    where: { id: requestId, userId: session.id, status: 'PENDING' },
    data: { status: 'CANCELLED' }
  });

  if (result.count === 0) {
    return { error: 'Invalid request or cannot be cancelled' };
  }

  revalidatePath('/employee');
}

export async function getLeaveStats() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MANAGER') {
    return null;
  }

  const [pending, approved, rejected, cancelled] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.leaveRequest.count({ where: { status: 'APPROVED' } }),
    prisma.leaveRequest.count({ where: { status: 'REJECTED' } }),
    prisma.leaveRequest.count({ where: { status: 'CANCELLED' } })
  ]);

  return { pending, approved, rejected, cancelled };
}

export async function approveLeaveRequest(requestId: string) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MANAGER') {
    return { error: 'Unauthorized' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({ where: { id: requestId } });
      
      if (!request || request.status !== 'PENDING') {
        throw new Error('Invalid request or already processed');
      }

      const requestedDays = calculateLeaveDays(request.startDate, request.endDate);

      const balance = await tx.leaveBalance.findUnique({ where: { userId: request.userId } });
      if (!balance || balance.totalDays - balance.usedDays < requestedDays) {
        throw new Error('Not enough leave balance remaining');
      }

      // Optimistic concurrency check on usedDays
      const updatedBalance = await tx.leaveBalance.updateMany({
        where: { userId: request.userId, usedDays: balance.usedDays },
        data: { usedDays: { increment: requestedDays } }
      });

      if (updatedBalance.count === 0) {
        throw new Error('Concurrency conflict on balance');
      }

      // Optimistic concurrency check on status PENDING
      const updatedRequest = await tx.leaveRequest.updateMany({
        where: { id: requestId, status: 'PENDING' },
        data: { status: 'APPROVED' }
      });

      if (updatedRequest.count === 0) {
        throw new Error('Concurrency conflict on request status');
      }
    });

    revalidatePath('/manager');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function rejectLeaveRequest(requestId: string) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MANAGER') {
    return { error: 'Unauthorized' };
  }

  // PENDING -> REJECTED
  const result = await prisma.leaveRequest.updateMany({
    where: { id: requestId, status: 'PENDING' },
    data: { status: 'REJECTED' }
  });

  if (result.count === 0) {
    return { error: 'Invalid request or already processed' };
  }

  revalidatePath('/manager');
  return { success: true };
}
