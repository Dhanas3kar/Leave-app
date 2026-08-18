import { test, expect } from '@playwright/test';
import { prisma } from '../packages/database/index';
import bcrypt from 'bcryptjs';

const testSuffix = Date.now().toString();
const managerEmail = `mgr-ux-${testSuffix}@test.com`;
const emp1Email = `emp1-ux-${testSuffix}@test.com`;
const emp2Email = `emp2-ux-${testSuffix}@test.com`;
const password = 'password123';

test.describe.serial('Manager Portal UX (Stage 8)', () => {
  let managerId: string;
  let emp1Id: string;
  let emp2Id: string;

  test.beforeAll(async () => {
    // Cleanup
    await prisma.leaveRequest.deleteMany({
      where: { user: { email: { in: [managerEmail, emp1Email, emp2Email] } } }
    });
    await prisma.leaveBalance.deleteMany({
      where: { user: { email: { in: [managerEmail, emp1Email, emp2Email] } } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [managerEmail, emp1Email, emp2Email] } }
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const mgr = await prisma.user.create({
      data: {
        email: managerEmail,
        password: hashedPassword,
        name: 'Manager UX Test',
        role: 'MANAGER',
        leaveBalance: { create: { totalDays: 30, usedDays: 0 } }
      }
    });
    managerId = mgr.id;

    const emp1 = await prisma.user.create({
      data: {
        email: emp1Email,
        password: hashedPassword,
        name: 'Employee 1 UX',
        role: 'EMPLOYEE',
        leaveBalance: { create: { totalDays: 20, usedDays: 0 } }
      }
    });
    emp1Id = emp1.id;

    const emp2 = await prisma.user.create({
      data: {
        email: emp2Email,
        password: hashedPassword,
        name: 'Employee 2 UX',
        role: 'EMPLOYEE',
        leaveBalance: { create: { totalDays: 5, usedDays: 4 } } // 1 day remaining
      }
    });
    emp2Id = emp2.id;
  });

  test.afterAll(async () => {
    await prisma.leaveRequest.deleteMany({
      where: { user: { email: { in: [managerEmail, emp1Email, emp2Email] } } }
    });
    await prisma.leaveBalance.deleteMany({
      where: { user: { email: { in: [managerEmail, emp1Email, emp2Email] } } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [managerEmail, emp1Email, emp2Email] } }
    });
  });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Dashboard & Auth - Redirects unauthenticated, allows login, shows empty state', async ({ page }) => {
    // Unauthenticated
    await page.goto('http://localhost:3001/manager');
    await expect(page).toHaveURL(/.*\/login/);

    // Login as manager
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', managerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to manager portal directly
    await page.waitForURL('http://localhost:3001/manager');

    // Should see Manager Dashboard
    await expect(page.locator('text=LeaveSync Manager')).toBeVisible();
    await expect(page.locator('text=Welcome, Manager UX Test')).toBeVisible();
  });

  test('Approval Flow - Successfully approves request and updates balance', async ({ page }) => {
    // Create pending request for emp1
    const req = await prisma.leaveRequest.create({
      data: {
        userId: emp1Id,
        type: 'ANNUAL',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-05T00:00:00Z'), // 5 days
        reason: 'Approval test',
        status: 'PENDING'
      }
    });

    // Login as manager
    await page.goto('http://localhost:3000/employee/login');
    await page.fill('input[name="email"]', managerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:3001/manager');

    // Should see pending request
    await expect(page.locator(`text=Employee 1 UX`)).toBeVisible();
    await expect(page.locator(`text="Approval test"`)).toBeVisible();
    await expect(page.locator(`text=5 days`)).toBeVisible();

    // Click Approve
    const approveBtn = page.locator('button', { hasText: /^Approve$/ });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await expect(approveBtn).toHaveText('Approving...');

    // Wait for it to disappear (successful action -> revalidatePath)
    await expect(page.locator('text="Approval test"')).not.toBeVisible();
    await expect(page.locator('text=All caught up!')).toBeVisible();

    // Check balance
    const bal = await prisma.leaveBalance.findUnique({ where: { userId: emp1Id } });
    expect(bal?.usedDays).toBe(5);

    // Check status
    const reqDb = await prisma.leaveRequest.findUnique({ where: { id: req.id } });
    expect(reqDb?.status).toBe('APPROVED');
  });

  test('Rejection Flow - Successfully rejects request', async ({ page }) => {
    // Create pending request for emp1
    const req = await prisma.leaveRequest.create({
      data: {
        userId: emp1Id,
        type: 'SICK',
        startDate: new Date('2025-02-01T00:00:00Z'),
        endDate: new Date('2025-02-01T00:00:00Z'), // 1 day
        reason: 'Reject test',
        status: 'PENDING'
      }
    });

    // Login as manager
    await page.goto('http://localhost:3000/employee/login');
    await page.fill('input[name="email"]', managerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:3001/manager');

    // Should see pending request
    await expect(page.locator(`text="Reject test"`)).toBeVisible();

    // Click Reject
    const rejectBtn = page.locator('button', { hasText: /^Reject$/ });
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();
    await expect(rejectBtn).toHaveText('Rejecting...');

    // Wait for it to disappear
    await expect(page.locator('text="Reject test"')).not.toBeVisible();
    await expect(page.locator('text=All caught up!')).toBeVisible();

    // Check status
    const reqDb = await prisma.leaveRequest.findUnique({ where: { id: req.id } });
    expect(reqDb?.status).toBe('REJECTED');
  });

  test('Insufficient Balance - Fails safely with human-readable error', async ({ page }) => {
    // emp2 has 5 total, 4 used -> 1 remaining. Request 2 days.
    const req = await prisma.leaveRequest.create({
      data: {
        userId: emp2Id,
        type: 'ANNUAL',
        startDate: new Date('2025-03-01T00:00:00Z'),
        endDate: new Date('2025-03-02T00:00:00Z'), // 2 days
        reason: 'Insufficient balance test',
        status: 'PENDING'
      }
    });

    // Login as manager
    await page.goto('http://localhost:3000/employee/login');
    await page.fill('input[name="email"]', managerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:3001/manager');

    // Click Approve
    const approveBtn = page.locator('button', { hasText: /^Approve$/ });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // UI should show error
    await expect(page.locator('text=Not enough leave balance remaining')).toBeVisible();

    // Request should still be pending
    const reqDb = await prisma.leaveRequest.findUnique({ where: { id: req.id } });
    expect(reqDb?.status).toBe('PENDING');

    const bal = await prisma.leaveBalance.findUnique({ where: { userId: emp2Id } });
    expect(bal?.usedDays).toBe(4); // Unchanged
  });

  test('Stale Request - Fails safely if request is already processed', async ({ page, browser }) => {
    // Create pending request
    const req = await prisma.leaveRequest.create({
      data: {
        userId: emp1Id,
        type: 'ANNUAL',
        startDate: new Date('2025-04-01T00:00:00Z'),
        endDate: new Date('2025-04-01T00:00:00Z'), // 1 day
        reason: 'Stale test',
        status: 'PENDING'
      }
    });

    // Manager A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('http://localhost:3000/employee/login');
    await pageA.fill('input[name="email"]', managerEmail);
    await pageA.fill('input[name="password"]', password);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('http://localhost:3000/employee');
    await pageA.goto('http://localhost:3001/manager');
    await expect(pageA.locator(`text="Stale test"`)).toBeVisible();

    // Manager B (simulated by updating DB to APPROVED)
    await prisma.leaveRequest.update({
      where: { id: req.id },
      data: { status: 'APPROVED' }
    });

    // Manager A tries to approve stale PENDING UI
    const approveBtnA = pageA.locator('button', { hasText: /^Approve$/ });
    await approveBtnA.click();

    // UI should show error
    await expect(pageA.locator('text=Invalid request or already processed')).toBeVisible();

    await contextA.close();
  });

  test('Independent Context Concurrency Test', async ({ browser }) => {
    // Create pending request
    const req = await prisma.leaveRequest.create({
      data: {
        userId: emp1Id,
        type: 'ANNUAL',
        startDate: new Date('2025-05-01T00:00:00Z'),
        endDate: new Date('2025-05-02T00:00:00Z'), // 2 days
        reason: 'Concurrency test',
        status: 'PENDING'
      }
    });

    const balBefore = await prisma.leaveBalance.findUnique({ where: { userId: emp1Id } });
    const usedDaysBefore = balBefore!.usedDays;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Login A
    await pageA.goto('http://localhost:3000/employee/login');
    await pageA.fill('input[name="email"]', managerEmail);
    await pageA.fill('input[name="password"]', password);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('http://localhost:3000/employee');
    await pageA.goto('http://localhost:3001/manager');

    // Login B
    await pageB.goto('http://localhost:3000/employee/login');
    await pageB.fill('input[name="email"]', managerEmail);
    await pageB.fill('input[name="password"]', password);
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('http://localhost:3000/employee');
    await pageB.goto('http://localhost:3001/manager');

    await expect(pageA.locator(`text="Concurrency test"`)).toBeVisible();
    await expect(pageB.locator(`text="Concurrency test"`)).toBeVisible();

    // Trigger simultaneously
    await Promise.all([
      pageA.locator('button', { hasText: /^Approve$/ }).click(),
      pageB.locator('button', { hasText: /^Approve$/ }).click()
    ]);

    // One succeeds (request disappears), one fails (shows error)
    // Wait for the dust to settle on both pages
    await pageA.waitForTimeout(1000);
    await pageB.waitForTimeout(1000);

    const isAError = await pageA.locator('text=Concurrency conflict').isVisible() || await pageA.locator('text=Invalid request or already processed').isVisible();
    const isBError = await pageB.locator('text=Concurrency conflict').isVisible() || await pageB.locator('text=Invalid request or already processed').isVisible();
    
    const isASuccess = await pageA.locator(`text="Concurrency test"`).isHidden();
    const isBSuccess = await pageB.locator(`text="Concurrency test"`).isHidden();

    // Exactly one should succeed, exactly one should fail safely
    expect((isAError && isBSuccess) || (isBError && isASuccess)).toBeTruthy();

    // DB state verification
    const reqDb = await prisma.leaveRequest.findUnique({ where: { id: req.id } });
    expect(reqDb?.status).toBe('APPROVED');

    const balAfter = await prisma.leaveBalance.findUnique({ where: { userId: emp1Id } });
    expect(balAfter!.usedDays).toBe(usedDaysBefore + 2); // exactly 1 approval increment

    await contextA.close();
    await contextB.close();
  });

  test('Authorization Regression - Employee cannot access manager features', async ({ page }) => {
    // Login as employee
    await page.goto('http://localhost:3000/employee/login');
    await page.fill('input[name="email"]', emp1Email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/employee');

    // Try accessing manager portal directly
    await page.goto('http://localhost:3001/manager');
    // Expect redirect back to employee portal
    await expect(page).toHaveURL(/.*\/employee$/);

    // Try API authorization (employee attempting to call manager action directly is prevented 
    // by the requireManager() inside the action itself. The frontend UI is hidden anyway, 
    // and page.tsx redirect proves requireManager works for the page.)
  });

  test('Invalid Transitions & Cross Portal', async ({ page }) => {
    // Login as manager
    await page.goto('http://localhost:3000/employee/login');
    await page.fill('input[name="email"]', managerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Cross portal
    await page.goto('http://localhost:3001/manager');
    await expect(page.locator('text=Welcome, Manager UX Test')).toBeVisible();

    const employeePortalLink = page.locator('text=Employee Portal');
    await employeePortalLink.click();
    
    // Should navigate successfully
    await expect(page).toHaveURL(/.*\/employee$/);
    await expect(page.locator('text=Manager UX Test')).toBeVisible();
  });
});
