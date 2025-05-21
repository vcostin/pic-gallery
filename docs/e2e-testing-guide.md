# End-to-End Testing with Playwright

This document provides guidelines for working with our end-to-end (E2E) tests for the Pic Gallery application.

## Overview

We use [Playwright](https://playwright.dev/) for E2E testing because it offers:

1. **Fast and reliable execution** across multiple browsers (Chrome, Firefox, Safari)
2. **Built-in auto-waiting** for elements to be ready for interaction
3. **Powerful debugging tools** including snapshot testing and video recording
4. **Cross-browser compatibility** and mobile emulation
5. **Strong TypeScript support** integrated with our codebase

## Getting Started

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View the HTML test report
npm run test:e2e:report
```

### Running Tests in Specific Browsers

```bash
# Run tests in Chromium only
npx playwright test --project=chromium

# Run tests in Firefox only
npx playwright test --project=firefox

# Run tests in Safari only
npx playwright test --project=webkit
```

## Test Structure

Tests are organized in the `e2e-tests` directory:

- `gallery.spec.ts` - Tests for gallery browsing and image viewing functionality
- `auth.spec.ts` - Tests for authentication flows
- `helpers.ts` - Shared helper functions for common operations
- `global-setup.ts` - Setup that runs before all tests

## Writing Tests

Follow these best practices when writing new tests:

1. **Use page objects or helper functions** for reusable operations
2. **Keep tests independent** - each test should work on its own
3. **Add appropriate waiting** - let Playwright handle timing with auto-wait
4. **Use meaningful assertions** that verify the actual behavior
5. **Use test data isolation** - clean up after tests when needed

### Example Test Pattern

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Feature Name', () => {
  test('should perform specific action', async ({ page }) => {
    // Arrange - set up the test conditions
    await page.goto('/specific-page');
    
    // Act - perform the action being tested
    await page.getByRole('button', { name: 'Action' }).click();
    
    // Assert - verify the expected outcome
    await expect(page.locator('.result')).toContainText('Expected Result');
  });
});
```

## CI/CD Integration

Tests will run automatically:
- On pull requests to main branch
- On nightly builds

## Troubleshooting

If tests are failing:

1. Check the HTML report for screenshots and traces
2. Try running in debug mode with `npm run test:e2e:debug`
3. Check for timing issues - look for race conditions
4. Verify selectors are stable and resilient
