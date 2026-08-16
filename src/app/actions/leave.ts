"use server";

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function createLeaveRequest(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return { error: 'Unauthorized' };
  }

  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const reason = formData.get('reason') as string;
  const type = formData.get('type') as string || 'ANNUAL';

  if (!startDate || !endDate || !reason) {
    return { error: 'All fields are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return { error: 'End date cannot be before start date' };
  }

  const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

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
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return { error: 'Unauthorized' };
  }

  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!request || request.userId !== session.id || request.status !== 'PENDING') {
    return { error: 'Invalid request' };
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' }
  });

  revalidatePath('/employee');
}

export async function getLeaveStats() {
  const session = await getSession();
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
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { error: 'Unauthorized' };
  }

  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== 'PENDING') {
    return { error: 'Invalid request' };
  }

  const requestedDays = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 3600 * 24)) + 1;

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    }),
    prisma.leaveBalance.update({
      where: { userId: request.userId },
      data: { usedDays: { increment: requestedDays } }
    })
  ]);

  revalidatePath('/manager');
}

export async function rejectLeaveRequest(requestId: string) {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { error: 'Unauthorized' };
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' }
  });

  revalidatePath('/manager');
}
