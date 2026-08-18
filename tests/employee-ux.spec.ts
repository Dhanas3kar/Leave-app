import { test, expect } from '@playwright/test';
import { prisma } from '../packages/database/index';
import bcrypt from 'bcryptjs';

// Use a unique suffix for accounts created in this test
const testSuffix = Date.now().toString();
const empEmail = `emp-ux-${testSuffix}@test.com`;
const password = 'password123';

test.describe('Employee Portal UX (Stage 7)', () => {
  let employeeId: string;

  test.beforeAll(async () => {
    // Clean up possible left-overs just in case
    await prisma.leaveRequest.deleteMany({
      where: { user: { email: empEmail } }
    });
    await prisma.leaveBalance.deleteMany({
      where: { user: { email: empEmail } }
    });
    await prisma.user.deleteMany({
      where: { email: empEmail }
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const emp = await prisma.user.create({
      data: {
        email: empEmail,
        password: hashedPassword,
        name: 'UX Test Employee',
        role: 'EMPLOYEE',
        leaveBalance: {
          create: { totalDays: 30, usedDays: 0 }
        }
      }
    });
    employeeId = emp.id;
  });

  test.afterAll(async () => {
    if (!employeeId) return;
    await prisma.leaveRequest.deleteMany({
      where: { userId: employeeId }
    });
    await prisma.leaveBalance.deleteMany({
      where: { userId: employeeId }
    });
    await prisma.user.delete({
      where: { id: employeeId }
    });
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', empEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('http://localhost:3000/employee');
  });

  test('Shows empty state when no requests exist', async ({ page }) => {
    // By default, no requests exist right after creation
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('text=You haven\'t submitted any leave requests yet.')).toBeVisible();
  });

  test('Shows dynamic duration preview and calculates correct days', async ({ page }) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Select start date
    await page.fill('input[name="startDate"]', todayStr);
    // Select end date
    await page.fill('input[name="endDate"]', tomorrowStr);

    // Should show "Duration: 2 days" dynamically
    await expect(page.locator('.duration-preview')).toBeVisible();
    await expect(page.locator('.duration-preview')).toContainText('Duration: 2 days');

    // Submit request
    await page.fill('textarea[name="reason"]', 'Testing dynamic duration');
    await page.click('button:has-text("Submit Request")');

    // Wait for success
    try {
      await expect(page.locator('text=Leave request submitted successfully!')).toBeVisible({ timeout: 5000 });
    } catch (e) {
      await page.screenshot({ path: 'employee-ux-submit-fail.png' });
      throw e;
    }

    // The history should now show the request without empty state
    await expect(page.locator('.empty-state')).not.toBeVisible();
    await expect(page.locator('.leave-history-list .leave-card').first()).toContainText('Testing dynamic duration');
    // Ensure the duration displayed in the card is correct (2 days)
    await expect(page.locator('.leave-history-list .leave-card').first()).toContainText('(2 days)');
  });

  test('Cancellation flow - button exists for PENDING and updates UI', async ({ page }) => {
    // We already have a PENDING request from the previous test
    const leaveCard = page.locator('.leave-history-list .leave-card').first();
    await expect(leaveCard).toBeVisible();

    // Ensure status is PENDING
    await expect(leaveCard.locator('.status-badge')).toContainText('PENDING');

    // Click Cancel
    const cancelBtn = leaveCard.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Verify status turns to CANCELLED and button goes away
    await expect(leaveCard.locator('.status-badge')).toContainText('CANCELLED');
    await expect(leaveCard.locator('button:has-text("Cancel")')).not.toBeVisible();
  });

  test('Cancellation button is NOT visible for APPROVED requests', async ({ page }) => {
    // First, let's create a new request and force its status to APPROVED via DB
    const req = await prisma.leaveRequest.create({
      data: {
        userId: employeeId,
        startDate: new Date(),
        endDate: new Date(),
        type: 'ANNUAL',
        reason: 'Approved test request',
        status: 'APPROVED'
      }
    });

    // Reload page
    await page.reload();

    const approvedCard = page.locator('.leave-card', { hasText: 'Approved test request' });
    await expect(approvedCard).toBeVisible();
    await expect(approvedCard.locator('.status-badge')).toContainText('APPROVED');

    // Ensure there is no cancel button on this card
    await expect(approvedCard.locator('button:has-text("Cancel")')).not.toBeVisible();
  });

  test('Responsive Dashboard - Layout adapts', async ({ page }) => {
    // Start wide
    await page.setViewportSize({ width: 1200, height: 800 });
    const gridWide = page.locator('.dashboard-grid');
    const wideBox = await gridWide.boundingBox();
    expect(wideBox).not.toBeNull();
    // In wide mode it's 1fr 2fr, so > 800px width typically
    
    // Switch to narrow mobile view
    await page.setViewportSize({ width: 375, height: 812 });
    const gridNarrow = page.locator('.dashboard-grid');
    const narrowBox = await gridNarrow.boundingBox();
    expect(narrowBox?.width).toBeLessThan(400);

    // Ensure components remain visible
    await expect(page.locator('.balance-metrics')).toBeVisible();
    await expect(page.locator('form[action]').first()).toBeVisible(); // Request Form or Logout Form
  });
});
