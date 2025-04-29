// Import necessary dependencies
import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { SetupNewTenantService } from '../../src/backend/services/setupNewTenantService.js';
import { TransactionManager } from '../../src/backend/adapters/transactionManager.js';

/**
 * Session validation tests
 *
 * These tests verify that users without valid sessions are properly redirected
 * to the signin page. This includes:
 * 1. Users with no session cookie
 * 2. Users with invalid/expired session cookies
 */

const generateRandomEmail = () => `test-${uuidv4()}@example.com`;
const password = 'secure!Password123';
const transactionManager = new TransactionManager();
const setupNewTenantService = new SetupNewTenantService({
  transactionManager,
});

test.describe('Session Validation Tests', () => {
  let validEmail;
  let validUserId;

  test.beforeAll(async () => {
    // Create a valid user for testing
    validEmail = generateRandomEmail();
    validUserId = uuidv4();
    await setupNewTenantService.execute({
      tenantId: uuidv4(),
      userId: validUserId,
      name: 'Test User',
      role: 'owner',
      whitelistBilling: false,
      email: validEmail,
      password: password,
    });
  });

  test.beforeEach(async ({ page }) => {
    // Start each test at the root URL
    await page.goto('/');
  });

  test('should redirect to signin when no session cookie exists', async ({
    page,
  }) => {
    // Try to access a protected route
    await page.goto('/app');

    // Verify we get redirected to signin
    await expect(page).toHaveURL('/signin');
    await expect(page.locator('form')).toBeVisible();
  });

  test('should redirect to signin with invalid session cookie', async ({
    page,
  }) => {
    // Set an invalid session cookie
    await page.context().addCookies([
      {
        name: 'session-id',
        value: 'invalid',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      },
    ]);

    // Try to access a protected route
    await page.goto('/app');

    // Verify we get redirected to signin
    await expect(page).toHaveURL('/signin');
    await expect(page.locator('form')).toBeVisible();
  });
});
