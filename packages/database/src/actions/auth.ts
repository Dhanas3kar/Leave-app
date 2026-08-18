"use server";

import { prisma } from '../../index';
import { setSession, clearSession } from '../lib/session';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getEmployeePortalUrl, getManagerPortalUrl } from '../lib/config';

// Public registration schema — no role field.
// All public registrations create EMPLOYEE accounts.
// Manager promotion is an administrative operation.
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(prevState: any, formData: FormData) {
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: 'Invalid input. Please check your details.' };
  }

  const { email, password, name } = result.data;
  // Role is ALWAYS EMPLOYEE for public registration.
  // Any client-supplied "role" field is silently ignored.
  const role = 'EMPLOYEE';

  const existingUser = await prisma.user.findUnique({ 
    where: { email },
    select: { id: true }
  });
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

  await prisma.leaveBalance.create({
    data: {
      userId: user.id,
      totalDays: 20,
      usedDays: 0,
    },
  });

  await setSession({ id: user.id, role: user.role, name: user.name });
  
  return { redirectUrl: `${getEmployeePortalUrl()}/employee` };
}

export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: 'Invalid email or password format.' };
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ 
    where: { email },
    select: { id: true, password: true, role: true, name: true }
  });
  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { error: 'Invalid email or password.' };
  }

  await setSession({ id: user.id, role: user.role, name: user.name });
  
  if (user.role === 'MANAGER') {
    return { redirectUrl: `${getManagerPortalUrl()}/manager` };
  } else {
    return { redirectUrl: `${getEmployeePortalUrl()}/employee` };
  }
}

export async function logout() {
  await clearSession();
  redirect('/login');
}
