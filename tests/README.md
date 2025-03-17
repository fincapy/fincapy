# End-to-End Testing with Playwright

This directory contains end-to-end tests for the application using Playwright.

## Running Tests

There are two ways to run the tests:

1. **Using Docker Compose** (recommended for CI/CD):

```bash
npm run test:e2e
```

This command will:

- Start the NextJS application and Redis services if they aren't already running
- Build and run the Playwright container
- Execute all tests
- Generate a report

2. **Locally** (for development):

```bash
npm run test:e2e:dev
```

This requires Playwright to be installed locally:

```bash
npx playwright install
```

## Test Structure

- `tests/system/` - Contains all test files
  - `example.spec.js` - Basic example test
  - `testPenetration.js` - Security tests

## Adding New Tests

Create new test files in the `tests/system/` directory with the `.spec.js` or `.test.js` extension.

Example:

```javascript
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
  await page.goto('/');
  // Your test code here
});
```

## Configuration

The Playwright configuration is in `playwright.config.js` at the root of the project.
