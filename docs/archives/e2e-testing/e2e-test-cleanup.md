# E2E Test Data Cleanup

This document outlines the E2E test data cleanup mechanism implemented for the Pic Gallery application.

## Purpose

During E2E testing, test data is created that needs to be cleaned up after tests complete. This includes:
- Test galleries
- Test images
- Gallery-image relationships
- Optionally, the test user account itself

## Implementation

### API Endpoint

We've created a dedicated API endpoint for cleaning up E2E test data:

```
DELETE /api/e2e/cleanup
```

This endpoint:
1. Verifies the authenticated user is the E2E test user (based on email)
2. Deletes all galleries and gallery-image relationships created by the test user
3. Deletes all images created by the test user
4. Optionally deletes the test user account if requested
5. Returns statistics about what was deleted

#### Query Parameters:

- `deleteUser=true` - When provided, also deletes the test user account

### Cleanup in Test Helpers

For automated test cleanup, use the methods in `TestHelpers`:

```typescript
// Clean up test data only
await TestHelpers.cleanupTestData(page);

// Clean up test data AND delete the test user account
await TestHelpers.completeCleanup(page);
```

### Global Teardown

The global teardown script automatically performs cleanup after all tests complete:

```typescript
// In global-teardown.ts
async function globalTeardown(config: FullConfig) {
  // Authenticates and calls the cleanup API endpoint
  // Optionally deletes the user if E2E_DELETE_USER_ON_TEARDOWN=true
}
```

### Cleanup Button

For manual testing and development, a cleanup button is available:
- Only visible to the E2E test user
- Only visible in development or when NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES=true
- Located at the bottom left of the screen
- Shows success/failure status and deletion statistics

## Environment Variables

The cleanup mechanism requires these environment variables:

```
# Server-side variables for API authentication verification
E2E_TEST_USER_EMAIL="test@example.com"
E2E_TEST_USER_PASSWORD="TestPassword123!"

# Client-side variable for showing/hiding the cleanup button
NEXT_PUBLIC_E2E_TEST_USER_EMAIL="test@example.com"

# Optional: Enable E2E test features in non-development environments
NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES="true"

# Optional: Enable user deletion during global teardown (use with caution)
E2E_DELETE_USER_ON_TEARDOWN="true"
```

### Feature Flag: NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES

This feature flag controls the visibility of E2E testing utilities in the application:

- **Purpose**: Controls whether E2E test-related UI components (like the cleanup button) are visible
- **Default**: `false` (disabled in all environments)
- **When to enable**: 
  - During local development when you're running E2E tests
  - In CI/CD environments when running automated tests
  - In testing/staging environments when manual E2E testing is needed
- **When to disable**:
  - In production environments
  - When not actively running E2E tests

The E2E test features are automatically enabled in development mode (`NODE_ENV === 'development'`) even without this flag. The flag is primarily needed for enabling these features in non-development environments.

## Security Considerations

- The cleanup endpoint only works for the authenticated E2E test user
- The endpoint checks both authentication and email matching
- The cleanup button is not included in production builds unless explicitly enabled
- The user deletion option provides an additional layer of cleanup but should be used carefully

## Usage in Automated Tests

In your test teardown or after-all hooks, you can add:

```typescript
// Example cleanup in a Playwright test
test.afterAll(async ({ page }) => {
  // Clean up test data only
  await TestHelpers.cleanupTestData(page);
  
  // OR to clean up everything including the user account:
  // await TestHelpers.completeCleanup(page);
});
```

## Complete Cleanup Flow

When complete cleanup is needed (including user account deletion):

1. **Test phase**: Create test data, run tests
2. **Cleanup phase**: Call the cleanup API with `deleteUser=true`
3. **Next run setup**: Global setup will recreate the E2E test user
4. **Safety mechanism**: The API will only delete users that match the E2E test email

## Troubleshooting

If cleanup is not working as expected:

1. **Authentication issues**: Verify the test user is properly authenticated
2. **Missing data**: Check the user ID is correctly associated with test content
3. **API errors**: Review server logs for detailed error messages
4. **Environment variables**: Ensure all required variables are correctly set

For user deletion issues, manually create a new test user through the registration form or global setup if needed.
