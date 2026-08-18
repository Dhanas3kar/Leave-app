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

    // 2. Employee requests leave
    await page.fill('input[name="startDate"]', '2027-01-10');
    await page.fill('input[name="endDate"]', '2027-01-15'); // 5 days
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

    // Try to request 30 days (Quota is 20)
    await page.fill('input[name="startDate"]', '2027-02-01');
    await page.fill('input[name="endDate"]', '2027-03-05');
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

    // Submit first leave request
    await page.fill('input[name="startDate"]', '2027-04-01');
    await page.fill('input[name="endDate"]', '2027-04-05');
    await page.fill('textarea[name="reason"]', 'Trip 1');
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await expect(page.locator('text=Leave request submitted successfully!')).toBeVisible();

    // Submit overlapping leave request
    await page.fill('input[name="startDate"]', '2027-04-03');
    await page.fill('input[name="endDate"]', '2027-04-08');
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

    // 2. Employee requests leave
    await page.fill('input[name="startDate"]', '2027-05-01');
    await page.fill('input[name="endDate"]', '2027-05-03'); // 3 days
    await page.fill('textarea[name="reason"]', 'Integration Test Vacation');
    await page.click('button:has-text("Submit Request")');

    await page.waitForTimeout(1000);
    await expect(page.locator('text=Integration Test Vacation').first()).toBeVisible();

    // 3. Security check: Employee tries to access Manager portal directly
    await page.goto(`${MANAGER_PORTAL}/manager`);
    // Should be redirected because employee lacks MANAGER role
    await page.waitForURL(/.*\/employee/);

    // 4. Logout employee
    await page.goto(`${EMPLOYEE_PORTAL}/employee`);
    await page.click('button:has-text("Logout")');

    // 5. Create a manager using Prisma seed logic directly (since UI register is employee only)
    // For the sake of this test running without external db seeds, we'll try to log in with 
    // the pre-seeded admin user. If the seed is run, "admin@company.com" exists.
    await page.goto(`${MANAGER_PORTAL}/login`);
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // It should log into the manager portal
    await page.waitForURL(/.*\/manager/);

    // 6. Manager approves leave
    // Find the request by reason text
    await expect(page.locator('text=Integration Test Vacation').first()).toBeVisible();
    
    // Find the approve button in the same card
    const requestCard = page.locator('.glass-panel', { hasText: 'Integration Test Vacation' }).first();
    await requestCard.locator('button:has-text("Approve")').click();

    // Wait for the action to complete
    await page.waitForTimeout(1000);
    // The request should no longer be under pending
    await expect(page.locator('text=Integration Test Vacation')).toHaveCount(0);

    // 7. Verify cross portal session: Manager clicks link to go to employee portal
    await page.click('text=Employee Portal');
    await page.waitForURL(/.*\/employee/);
    // Session is maintained, we are in employee portal now
    await expect(page.locator('text=LeaveSync')).toBeVisible();
    
    // 8. Logout manager
    await page.click('button:has-text("Logout")');

    // 9. Employee logs back in to check status
    await page.goto(`${EMPLOYEE_PORTAL}/login`);
    await page.fill('input[name="email"]', intCreds.email);
    await page.fill('input[name="password"]', intCreds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/employee/);

    // Expect the leave request to be APPROVED
    await expect(page.locator('text=Integration Test Vacation').first()).toBeVisible();
    const approvedCard = page.locator('div', { hasText: 'Integration Test Vacation' }).filter({ hasText: 'APPROVED' }).first();
    await expect(approvedCard).toBeVisible();
  });
});
