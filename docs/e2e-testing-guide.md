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

# Run only authentication-related tests in Chromium
npm run test:e2e:auth

# Run only gallery-related tests in Chromium
npm run test:e2e:gallery

# Run authenticated tests using pre-authenticated state
npm run test:e2e:authenticated
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
- `auth.spec.ts` - Tests for authentication flows (login, registration, etc.)
- `authenticated.spec.ts` - Tests that run with pre-authenticated state
- `helpers.ts` - Shared helper functions for common operations
- `global-setup.ts` - Setup that runs before all tests
- `global-teardown.ts` - Cleanup that runs after all tests
- `auth.setup.ts` - Setup for authenticated tests

## Selector Strategy

To ensure tests are reliable and maintainable, we follow these practices for selectors:

1. **Prefer `data-testid` attributes** - Add these to components specifically for testing
2. **Use semantic selectors** as a fallback - `getByRole()`, `getByLabel()`, etc.
3. **Avoid CSS selectors** based on styles or non-semantic attributes
4. **Avoid text-based selectors** that might change with copy updates

### Example of data-testid Usage

In component:
```tsx
<button 
  onClick={handleClick}
  className="primary-button"
  data-testid="submit-form"
>
  Submit
</button>
```

In test:
```typescript
await page.getByTestId('submit-form').click();
```

### Common data-testid Patterns

We use the following naming conventions for data-testid attributes:

- Form inputs: `{form-name}-{field-name}` (e.g., `login-email`)
- Form submission: `{form-name}-submit` (e.g., `login-submit`)
- Error messages: `{form-name}-error` (e.g., `login-error`)
- List items: `{list-type}-item` (e.g., `gallery-item`)
- Detail elements: `{entity}-detail-{property}` (e.g., `gallery-detail-title`)

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
    await page.getByTestId('action-button').click();
    
    // Assert - verify the expected outcome
    await expect(page.getByTestId('result-message')).toContainText('Expected Result');
  });
});
```

## Authentication in Tests

For tests requiring authentication, we provide three approaches:

1. **Persistent Authentication State**
   - Use tests in the `authenticated` project which automatically use the saved auth state
   - Run with `npm run test:e2e:authenticated`
   - These tests will always start in an authenticated state without having to log in
   - Authentication state is set up by the `auth.setup.ts` file which:
     - Performs UI login with the test user
     - Verifies authentication was successful
     - Saves the browser storage state to a file for reuse in other tests
  
2. **Helper Functions**
   - Use `TestHelpers.login()` to log in programmatically within a test
   - Best for tests where you need different users or authentication is part of what you're testing

3. **Skip Authentication**
   - Use `test.skip()` for tests that require complex auth setup in some environments

### Authentication Troubleshooting

If authenticated tests are failing with redirects to the login page:

1. **Check the auth storage file**: Verify `playwright/.auth/user.json` contains valid session cookies
2. **Run the auth setup manually**: Run `npx playwright test auth.setup.ts --project=setup`
3. **Browser inconsistencies**: Ensure you're using the same browser configuration for auth setup and tests
4. **Session expiration**: Check if your NextAuth session is configured with a very short expiration time
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

## Adding New Tests

When adding new tests:

1. Add appropriate `data-testid` attributes to components
2. Write tests that use these attributes for selection
3. Keep tests focused on user-facing functionality
4. Add the test file to the `e2e-tests` directory
5. Create a dedicated npm script if it's a major feature area
