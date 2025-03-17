// Import necessary dependencies
import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { SetupNewTenantService } from '../../src/backend/services/setupNewTenantService.js';
import { TransactionManager } from '../../src/backend/adapters/transactionManager.js';

/**
 * Penetration tests for the signin functionality
 *
 * These tests are designed to check for common security vulnerabilities in the authentication system.
 * We'll test for:
 * 3. CSRF (Cross-Site Request Forgery)
 * 4. Rate limiting
 * 5. Brute force protection
 * 6. Session fixation/hijacking
 * 7. Input validation bypass
 */

// Helper function to generate a random email
const generateRandomEmail = () => `test-${uuidv4()}@example.com`;
const password = 'secure!Password123';
const transactionManager = new TransactionManager();
const setupNewTenantService = new SetupNewTenantService({
  transactionManager,
});

test.describe.serial('Signin Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the signin page before each test
    await page.goto('/signin');
    // Wait for the page to fully load
    await page.waitForSelector('form');
  });

  test('should not leak sensitive information in error messages', async ({
    page,
  }) => {
    // Create a valid user for testing
    const validEmail = generateRandomEmail();
    await setupNewTenantService.execute({
      tenantId: uuidv4(),
      userId: uuidv4(),
      name: 'Test User',
      role: 'owner',
      whitelistBilling: false,
      email: validEmail,
      password: password,
    });

    // Try valid username with invalid password
    await page.fill('input[type="email"]', validEmail);
    await page.fill('input[type="password"]', 'wrong-password');

    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Error should be generic and not disclose if the email exists
    const errorMessage = await page.getByText('Invalid email or password');
    expect(errorMessage).toBeVisible();
  });

  test('should prevent username enumeration', async ({ page }) => {
    // Create a valid user for testing
    const validEmail = generateRandomEmail();
    await setupNewTenantService.execute({
      tenantId: uuidv4(),
      userId: uuidv4(),
      name: 'Test User',
      role: 'owner',
      whitelistBilling: false,
      email: validEmail,
      password: password,
    });

    // Try with random non-existent email
    const nonExistentEmail = generateRandomEmail();
    await page.fill('input[type="email"]', nonExistentEmail);
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    const errorMessage1 = await page.getByText('Invalid email or password');
    expect(errorMessage1).toBeVisible();

    // Try with a valid email but wrong password
    await page.fill('input[type="email"]', validEmail);
    await page.fill('input[type="password"]', 'wrong-password');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    const errorMessage2 = await page.getByText('Invalid email or password');
    expect(errorMessage2).toBeVisible();
  });

  // Isolate rate limiting test to prevent affecting other tests
  // This test can be run separately or last in the test sequence
  // test.describe.serial('Rate Limiting Tests', () => {
  //   test.beforeEach(async ({ page }) => {
  //     // Navigate to the signin page before each test
  //     await page.goto('/signin');
  //     // Wait for the page to fully load
  //     await page.waitForSelector('form');
  //   });

  //   test('should have rate limiting for failed login attempts', async ({
  //     page,
  //     request,
  //   }) => {
  //     // Create a valid user for testing
  //     const validEmail = generateRandomEmail();
  //     await setupNewTenantService.execute({
  //       tenantId: uuidv4(),
  //       userId: uuidv4(),
  //       name: 'Test User',
  //       role: 'owner',
  //       whitelistBilling: false,
  //       email: validEmail,
  //       password: password,
  //     });

  //     // Attempt multiple failed logins in quick succession
  //     const maxAttempts = 10;

  //     for (let i = 0; i < maxAttempts; i++) {
  //       await page.fill('input[type="email"]', validEmail);
  //       await page.fill('input[type="password"]', 'wrong-password');

  //       // Click and wait for response
  //       await Promise.all([
  //         page.waitForLoadState('networkidle'),
  //         page.click('button[type="submit"]'),
  //       ]);

  //       // Wait a small delay between attempts
  //       await page.waitForTimeout(500);
  //     }

  //     // Try one more time - should be rate limited
  //     await page.fill('input[type="email"]', validEmail);
  //     await page.fill('input[type="password"]', 'wrong-password');

  //     await Promise.all([
  //       page.waitForLoadState('networkidle'),
  //       page.click('button[type="submit"]'),
  //     ]);

  //     // Wait for error message
  //     await page.waitForTimeout(500);

  //     // Check if we get a rate limit error - more flexible approach to checking
  //     const pageContent = await page.content();
  //     const isRateLimited =
  //       pageContent.includes('rate limit') ||
  //       pageContent.includes('too many attempts') ||
  //       pageContent.includes('try again later') ||
  //       pageContent.includes('limit') ||
  //       pageContent.includes('locked') ||
  //       // Check for HTTP status codes in the URL that might indicate rate limiting
  //       page.url().includes('429') ||
  //       // If none of these, consider check for any new error message that wasn't there before
  //       (await page.isVisible('.error, .alert, [role="alert"]'));

  //     expect(isRateLimited).toBeTruthy();

  //     // OPTION: If you have an admin API to reset rate limits, you could call it here
  //     // For example:
  //     // await request.post('/api/admin/reset-rate-limits', {
  //     //   headers: { 'Authorization': 'Bearer admin-token' }
  //     // });
  //   });

  //   // Optional: Add an after hook that could reset the rate limits if you have an API endpoint for it
  //   test.afterAll(async ({ request }) => {
  //     // If you have an admin API to reset rate limits:
  //     // await request.post('/api/admin/reset-rate-limits', {
  //     //   headers: { 'Authorization': 'Bearer admin-token' }
  //     // });

  //     // Or wait for a sufficient time for rate limits to expire naturally
  //     // This is just a placeholder - might need to be implemented outside of Playwright
  //     console.log(
  //       'Rate limit test complete - subsequent tests may need to wait for rate limit to reset'
  //     );
  //   });
  // });

  test('should have HTTP-only secure cookies', async ({ page, context }) => {
    // Login with valid credentials
    const randomEmail = generateRandomEmail();
    await setupNewTenantService.execute({
      tenantId: uuidv4(),
      userId: uuidv4(),
      name: 'Test User',
      role: 'owner',
      whitelistBilling: false,
      email: randomEmail,
      password: password,
    });
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', password);

    // Use Promise.all to wait for both the click and the navigation
    // This waits for the first navigation after clicking the submit button
    await Promise.all([
      page.waitForLoadState('networkidle'), // Wait for network to be idle after redirect
      page.click('button[type="submit"]'),
    ]);

    // Wait a moment for cookies to be fully set
    await page.waitForTimeout(500);

    // Check cookie security attributes
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(
      (c) => c.name == 'emailPasswordAuthenticatedToken'
    );

    expect(sessionCookies.length).toBeGreaterThan(0);

    for (const cookie of sessionCookies) {
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.sameSite).toMatch(/Lax|Strict/);
    }
  });
});
