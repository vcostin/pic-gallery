# E2E Testing for Pic Gallery

This directory contains end-to-end tests for the Pic Gallery application using Playwright.

## Test Structure

The tests are organized as follows:

- **Auth Tests**: Tests for authentication flows
- **Gallery Tests**: Tests for gallery creation, editing, and management
- **Image Tests**: Tests for image upload and management
- **Comprehensive Tests**: End-to-end workflows testing multiple features together
- **Cleanup Tests**: Tests for the E2E cleanup functionality

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e-tests/comprehensive-gallery-workflow.spec.ts

# Run tests with UI
npx playwright test --ui
```

## Test User

The tests use a dedicated E2E test user account, defined in `.env`:

```
E2E_TEST_USER_EMAIL="e2e-test@example.com"
E2E_TEST_USER_PASSWORD="TestPassword123!"
E2E_TEST_USER_NAME="E2E Test User"
```

## Cleanup System

The E2E tests include a robust cleanup system that can:

1. **Clean up test data only**: Removes galleries, images, etc. but preserves the user
2. **Complete cleanup**: Removes all data AND deletes the user account

### Automatic Cleanup

Tests automatically clean up using:

- **Global teardown**: Runs after all tests complete
- **Test-specific cleanup**: Some tests clean up in their `afterAll` hooks

### Manual Cleanup

During development, you can use:

1. **Cleanup UI Button**: Available at the bottom left when logged in as the test user
2. **API endpoint**: `DELETE /api/e2e/cleanup` (requires authentication)

### Cleanup Options

#### Data-only Cleanup

```typescript
// In tests
await TestHelpers.cleanupTestData(page);

// In global teardown (default behavior)
// No special configuration needed
```

#### Complete Cleanup (including user account)

```typescript
// In tests
await TestHelpers.completeCleanup(page);

// In global teardown
// Set environment variable:
// E2E_DELETE_USER_ON_TEARDOWN=true
```

### Important Notes

1. When deleting the test user, you'll need to recreate it for subsequent tests
2. Global setup automatically creates the test user if it doesn't exist
3. The cleanup system has safety checks to only delete the designated test user

## Documentation

For more details, see:
- [E2E Test Cleanup Documentation](../docs/e2e-test-cleanup.md)
- [E2E Testing Guide](../docs/e2e-testing-guide.md)
