"use server";

import { prisma } from '@/lib/prisma';
import { setSession, clearSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function register(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !name || !role) {
    return { error: 'All fields are required.' };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'Email already exists.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  });

  if (role === 'EMPLOYEE') {
    await prisma.leaveBalance.create({
      data: {
        userId: user.id,
        totalDays: 20,
        usedDays: 0,
      },
    });
  }

  await setSession({ id: user.id, role: user.role, name: user.name });
  
  if (false) {
    return { redirectUrl: 'http://localhost:3001/manager' };
  } else {
    return { redirectUrl: '/employee' };
  }
}

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { error: 'Invalid email or password.' };
  }

  await setSession({ id: user.id, role: user.role, name: user.name });
  
  if (false) {
    return { redirectUrl: 'http://localhost:3001/manager' };
  } else {
    return { redirectUrl: '/employee' };
  }
}

export async function logout() {
  await clearSession();
  redirect('/login');
}
