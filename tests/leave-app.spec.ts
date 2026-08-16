import { test, expect } from '@playwright/test';

test.describe('Leave Management Flow', () => {

  const testEmail = `employee_${Date.now()}@test.com`;
  const managerEmail = `manager_${Date.now()}@test.com`;
  const password = 'password123';

  test.beforeAll(async ({ browser }) => {
    // Setup logic if needed, but we'll just register users in the tests
  });

  test('Normal Path: Register, Login, and submit a valid leave request', async ({ page }) => {
    // 1. Register Manager
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Manager Jane');
    await page.fill('input[name="email"]', managerEmail);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'MANAGER');
    await page.click('button[type="submit"]');

    // Should redirect to manager dashboard
    await expect(page).toHaveURL(/.*manager/);
    await page.click('text=Logout');
    await page.waitForURL(/.*login/);

    // 2. Register Employee
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Employee John');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');

    // Should redirect to employee dashboard
    await expect(page).toHaveURL(/.*employee/);

    // Verify initial balance is 20
    await expect(page.locator('text=20').first()).toBeVisible();

    // 3. Submit a valid leave request
    // Let's request 2 days (today to tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await page.fill('input[name="startDate"]', today.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('textarea[name="reason"]', 'Feeling sick');
    
    await page.click('button[type="submit"]');

    // Expect success message
    await expect(page.locator('text=Leave request submitted successfully!')).toBeVisible();
    await page.click('text=Logout');
    await page.waitForURL(/.*login/);
  });

  test('Edge Case: Employee requests exactly their remaining balance', async ({ page }) => {
    const edgeEmail = `edge_${Date.now()}@test.com`;
    // Register
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Edge Employee');
    await page.fill('input[name="email"]', edgeEmail);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');

    // Request exactly 20 days
    const today = new Date();
    const twentyDaysLater = new Date(today);
    twentyDaysLater.setDate(twentyDaysLater.getDate() + 19);

    await page.fill('input[name="startDate"]', today.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', twentyDaysLater.toISOString().split('T')[0]);
    await page.fill('textarea[name="reason"]', 'Long vacation');
    
    await page.click('button[type="submit"]');

    // Should succeed since balance is 20 days and request is 20 days
    await expect(page.locator('text=Leave request submitted successfully!')).toBeVisible();
  });

  test('Invalid Path: Employee requests more days than balance', async ({ page }) => {
    const invalidEmail = `invalid_${Date.now()}@test.com`;
    // Register
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Invalid Employee');
    await page.fill('input[name="email"]', invalidEmail);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button[type="submit"]');

    // Request 25 days (balance is 20)
    const today = new Date();
    const twentyFiveDaysLater = new Date(today);
    twentyFiveDaysLater.setDate(twentyFiveDaysLater.getDate() + 24);

    await page.fill('input[name="startDate"]', today.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', twentyFiveDaysLater.toISOString().split('T')[0]);
    await page.fill('textarea[name="reason"]', 'Too long vacation');
    
    await page.click('button[type="submit"]');

    // Expect an error
    await expect(page.locator('text=Not enough leave balance')).toBeVisible();
  });

  // Deliberately broken test for the "Red Run" requirement
  test('Red Run: Deliberately failing test to prove suite works', async ({ page }) => {
    await page.goto('/login');
    // We expect the login page to say "Welcome Back"
    // Let's assert it says "Welcome to Mars" which will fail
    await expect(page.locator('h1')).toHaveText('Welcome to Mars');
  });

});
