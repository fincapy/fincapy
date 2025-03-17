# Playwright Performance Optimization

This document explains how we've optimized Playwright tests for better performance.

## Worker Configuration

We use a dynamic worker allocation strategy that automatically adjusts based on the available system resources:

- In development: Uses approximately 70% of available CPU cores
- In CI: Uses a more conservative approach to avoid resource contention

The worker configuration is in `playwright.config.js` and uses the `os` module to detect available resources.

## Run Times

Typical run times for our tests:

- Fast mode (chromium only): ~1-2 minutes
- Full test suite (all browsers): ~3-5 minutes
- CI pipeline: ~4-6 minutes

## Docker Resource Allocation

When running in Docker, we allocate specific resources to ensure consistent performance:

- CPU: 2-8 cores (reservations and limits)
- Memory: 2-4 GB (reservations and limits)

## Performance Tips

1. **Use the fast mode for quick feedback**:

   ```bash
   npm run test:e2e:fast
   ```

2. **Run specific tests to save time**:

   ```bash
   npx playwright test testFileName.spec.js
   ```

3. **Run tests in a single browser**:

   ```bash
   npx playwright test --project=chromium
   ```

4. **Use the UI mode for debugging**:

   ```bash
   npm run test:e2e:ui
   ```

5. **Optimize your tests**:
   - Use `test.describe.parallel` for test suites that can run in parallel
   - Reuse authenticated state with `storageState`
   - Reduce unnecessary navigation and setup steps
   - Use fixtures to share expensive setup operations

## Monitoring Performance

To identify slow tests, use the HTML report generated after running the tests. It shows detailed timing information for each test.

## Common Bottlenecks

- Network requests to external services
- Large DOM operations
- File system operations
- Database interactions

Consider mocking these operations when possible for faster tests.
