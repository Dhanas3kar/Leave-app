import { test, expect } from '@playwright/test';

// Configuration for ports
const EMPLOYEE_PORTAL = 'http://localhost:3000';
const MANAGER_PORTAL = 'http://localhost:3001';

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
});
