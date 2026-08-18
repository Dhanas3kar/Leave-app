/**
 * Development seed script for creating test accounts.
 * 
 * This is the ONLY mechanism for creating MANAGER accounts.
 * Public registration always creates EMPLOYEE accounts.
 * 
 * Usage: npx tsx packages/database/prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...\n');

  // Create a test manager account
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@leavesync.dev' },
    update: {},
    create: {
      email: 'manager@leavesync.dev',
      password: managerPassword,
      name: 'Dev Manager',
      role: 'MANAGER',
    },
  });
  console.log(`✅ Manager: ${manager.email} (password: manager123)`);

  // Create a test employee account
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@leavesync.dev' },
    update: {},
    create: {
      email: 'employee@leavesync.dev',
      password: employeePassword,
      name: 'Dev Employee',
      role: 'EMPLOYEE',
    },
  });
  console.log(`✅ Employee: ${employee.email} (password: employee123)`);

  // Create leave balance for the employee
  await prisma.leaveBalance.upsert({
    where: { userId: employee.id },
    update: {},
    create: {
      userId: employee.id,
      totalDays: 20,
      usedDays: 0,
    },
  });
  console.log(`✅ Leave balance created for ${employee.email}`);

  console.log('\n🌱 Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
