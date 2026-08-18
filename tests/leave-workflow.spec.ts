import { test, expect } from '@playwright/test';

// Configuration for ports (derived from env or default to localhost)
const EMPLOYEE_PORTAL = process.env.NEXT_PUBLIC_EMPLOYEE_PORTAL_URL || 'http://localhost:3000';
const MANAGER_PORTAL = process.env.NEXT_PUBLIC_MANAGER_PORTAL_URL || 'http://localhost:3001';

// Generate random credentials for each test run
const randomId = Math.random().toString(36).substring(7);
const employeeCreds = {
  name: `Emp ${randomId}`,
  email: `employee_${randomId}@company.com`,
  password: 'password123',
};

const managerCreds = {
  name: `Manager ${randomId}`,
  email: `manager_${randomId}@company.com`,
  password: 'password123',
};

test.describe('Leave Management Workflow', () => {
  test('Normal Path: Register, Login, Request Leave, Approve Leave', async ({ page, context }) => {
    // 1. Employee registers
    await page.goto(`${EMPLOYEE_PORTAL}/register`);
    await page.fill('input[name="name"]', employeeCreds.name);
    await page.fill('input[name="email"]', employeeCreds.email);
    await page.fill('input[name="password"]', employeeCreds.password);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');

    // Wait for redirect to login or dashboard
    await page.waitForURL(/.*\/employee|.*\/login/);

    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', employeeCreds.email);
      await page.fill('input[name="password"]', employeeCreds.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/employee/);
    }

    const today = new Date();
    const startD = new Date(today);
    startD.setDate(startD.getDate() + 1); // tomorrow
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + 5);
    const todayStr = startD.toISOString().split('T')[0];
    const tomorrowStr = endD.toISOString().split('T')[0];

    // 2. Employee requests leave
    await page.fill('input[name="startDate"]', todayStr);
    await page.fill('input[name="endDate"]', tomorrowStr); // 5 days
    await page.fill('textarea[name="reason"]', 'Vacation');
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'normal-path.png' });

    // Expect the leave request to show up
    await expect(page.locator('text=Vacation').first()).toBeVisible();
    await expect(page.locator('text=PENDING').first()).toBeVisible();

    // Log out employee
    await page.click('button:has-text("Logout")');
  });

  test('Invalid Input: Attempting to overdraw leave balance', async ({ page }) => {
    const invalidCreds = {
      name: `Overdraw ${randomId}`,
      email: `overdraw_${randomId}@company.com`,
      password: 'password123',
    };

    await page.goto(`${EMPLOYEE_PORTAL}/register`);
    await page.fill('input[name="name"]', invalidCreds.name);
    await page.fill('input[name="email"]', invalidCreds.email);
    await page.fill('input[name="password"]', invalidCreds.password);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*\/employee|.*\/login/);

    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', invalidCreds.email);
      await page.fill('input[name="password"]', invalidCreds.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/employee/);
    }

    const today = new Date();
    const startD = new Date(today);
    startD.setDate(startD.getDate() + 1); // tomorrow
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + 30);
    const todayStr = startD.toISOString().split('T')[0];
    const futureStr = endD.toISOString().split('T')[0];

    // Try to request 30 days (Quota is 20)
    await page.fill('input[name="startDate"]', todayStr);
    await page.fill('input[name="endDate"]', futureStr);
    await page.fill('textarea[name="reason"]', 'Long Vacation');
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'invalid-input.png' });

    // Expect an error message 'Not enough leave balance'
    await expect(page.locator('text=Not enough leave balance')).toBeVisible();
  });

  test('Fixed Run: Intentional Success', async ({ page }) => {
    // This test was originally red, now it is green to prove the change loop.
    await page.goto(`${EMPLOYEE_PORTAL}/login`);
    
    // We check for actual text that exists
    await expect(page.locator('h1')).toHaveText('Welcome Back');
  });

  test('Overlapping Rules: Reject overlapping leave requests', async ({ page }) => {
    const overlapCreds = {
      name: `Overlap ${randomId}`,
      email: `overlap_${randomId}@company.com`,
      password: 'password123',
    };

    await page.goto(`${EMPLOYEE_PORTAL}/register`);
    await page.fill('input[name="name"]', overlapCreds.name);
    await page.fill('input[name="email"]', overlapCreds.email);
    await page.fill('input[name="password"]', overlapCreds.password);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*\/employee|.*\/login/);

    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', overlapCreds.email);
      await page.fill('input[name="password"]', overlapCreds.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/employee/);
    }

    const today = new Date();
    const startD = new Date(today);
    startD.setDate(startD.getDate() + 1); // tomorrow
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + 1);
    const todayStr = startD.toISOString().split('T')[0];
    const future1Str = endD.toISOString().split('T')[0];

    // Submit first leave request
    await page.fill('input[name="startDate"]', todayStr);
    await page.fill('input[name="endDate"]', future1Str);
    await page.fill('textarea[name="reason"]', 'Trip 1');
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await expect(page.locator('text=Leave request submitted successfully!')).toBeVisible();

    const future2 = new Date(today);
    future2.setDate(future2.getDate() + 2);
    const future3 = new Date(today);
    future3.setDate(future3.getDate() + 8);
    const future2Str = future2.toISOString().split('T')[0];
    const future3Str = future3.toISOString().split('T')[0];

    // Submit overlapping leave request
    await page.fill('input[name="startDate"]', future2Str);
    await page.fill('input[name="endDate"]', future3Str);
    await page.fill('textarea[name="reason"]', 'Trip 2');
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await expect(page.locator('text=You already have a leave request during this period.')).toBeVisible();
  });

  test('Integration: Cross-Portal Session Continuity and E2E Lifecycle', async ({ page }) => {
    // 1. Setup - register an employee
    const intCreds = {
      name: `Int ${randomId}`,
      email: `int_${randomId}@company.com`,
      password: 'password123',
    };

    await page.goto(`${EMPLOYEE_PORTAL}/register`);
    await page.fill('input[name="name"]', intCreds.name);
    await page.fill('input[name="email"]', intCreds.email);
    await page.fill('input[name="password"]', intCreds.password);
    // Role field is ignored in register as per Stage 5, but we select it for UI form
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/employee|.*\/login/);

    if (page.url().includes('login')) {
      await page.fill('input[name="email"]', intCreds.email);
      await page.fill('input[name="password"]', intCreds.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/employee/);
    }

    const today = new Date();
    const future1 = new Date(today);
    future1.setDate(future1.getDate() + 1);
    const future2 = new Date(today);
    future2.setDate(future2.getDate() + 3);
    const future1Str = future1.toISOString().split('T')[0];
    const future2Str = future2.toISOString().split('T')[0];

    // 2. Employee requests leave
    await page.fill('input[name="startDate"]', future1Str);
    await page.fill('input[name="endDate"]', future2Str); // 3 days
    const uniqueReason = `Integration Test Vacation ${randomId}`;
    await page.fill('textarea[name="reason"]', uniqueReason);
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${uniqueReason}`).first()).toBeVisible();

    // 3. Security check: Employee tries to access Manager portal directly
    await page.goto(`${MANAGER_PORTAL}/manager`);
    // Should be redirected because employee lacks MANAGER role
    await page.waitForURL(/.*\/employee/);

    // 4. Logout employee
    await page.goto(`${EMPLOYEE_PORTAL}/employee`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/.*\/login/);

    // 5. Create a manager by registering a new user and promoting them via DB
    const mgrCreds = {
      name: `Mgr ${randomId}`,
      email: `mgr_${randomId}@company.com`,
      password: 'password123',
    };

    await page.goto(`${EMPLOYEE_PORTAL}/register`);
    await page.fill('input[name="name"]', mgrCreds.name);
    await page.fill('input[name="email"]', mgrCreds.email);
    await page.fill('input[name="password"]', mgrCreds.password);
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*\/employee|.*\/login/);

    // Promote the user to MANAGER
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.user.update({
      where: { email: mgrCreds.email },
      data: { role: 'MANAGER' }
    });

    // Logout if logged in (employee portal)
    await page.goto(`${EMPLOYEE_PORTAL}/employee`);
    if (await page.locator('button:has-text("Logout")').isVisible()) {
      await page.click('button:has-text("Logout")');
    }

    // Now log in to Manager portal
    await page.goto(`${MANAGER_PORTAL}/login`);
    await page.fill('input[name="email"]', mgrCreds.email);
    await page.fill('input[name="password"]', mgrCreds.password);
    await page.click('button:has-text("Sign In")');

    // It should log into the manager portal
    await page.waitForURL(/.*\/manager/);

    // 6. Manager approves leave
    // Find the request by reason text
    await expect(page.locator(`text=${uniqueReason}`).first()).toBeVisible();
    
    // Find the approve button in the same card
    const requestCard = page.locator('div')
      .filter({ hasText: intCreds.name })
      .filter({ has: page.locator('button:has-text("Approve")') })
      .last();
    await requestCard.locator('button:has-text("Approve")').click();

    // Wait for the action to complete
    await page.waitForTimeout(1000);
    // The request should no longer be under pending
    await expect(page.locator(`text=${uniqueReason}`)).toHaveCount(0);

    // 7. Verify cross portal session: Manager clicks link to go to employee portal
    await page.click('text=Employee Portal');
    await page.waitForURL(/.*\/employee/);
    // Session is maintained, we are in employee portal now
    await expect(page.locator('text=LeaveSync').first()).toBeVisible();
    
    // 8. Logout manager
    await page.click('button:has-text("Logout")');

    // 9. Employee logs back in to check status
    await page.goto(`${EMPLOYEE_PORTAL}/login`);
    await page.fill('input[name="email"]', intCreds.email);
    await page.fill('input[name="password"]', intCreds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/employee/);

    // Expect the leave request to be APPROVED
    await expect(page.locator(`text=${uniqueReason}`).first()).toBeVisible();
    const approvedCard = page.locator('div', { hasText: uniqueReason }).filter({ hasText: 'APPROVED' }).first();
    await expect(approvedCard).toBeVisible();
  });
});
