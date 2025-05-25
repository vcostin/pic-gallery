# Single-User E2E Testing Strategy

## Overview
This implements a single-user authentication strategy where:
0. **Delete existing test user** - Sometimes the test user might already exist in DB, make sure to delete it before we run the test suite
1. **One test user** is created in global setup
2. **Same user** is used across all tests  
3. **User deletion** happens only in the final test for verification
4. **Sequential execution** ensures proper test order

## Test Execution Order

### 0. Pre-Setup Cleanup (Global Setup)
- 🗑️ **Delete existing test user** - Ensures clean state by removing any leftover test user from previous runs
- ✅ **Create single test user** - Fresh user account for the entire test suite
- ✅ **Save authentication state** - Ready for all tests to use

### 1. Authentication Lifecycle (`01-auth-lifecycle.spec.ts`)
- ✅ Verify user registration/existence  
- ✅ Test login/logout flow
- ✅ Save authentication state for feature tests
- **User persists after these tests**

### 2. Feature Tests (`02-feature-tests.spec.ts`)
- Uses saved authentication state
- ✅ Dashboard access
- ✅ Gallery creation and management
- ✅ Image upload and management
- **Same authenticated user throughout**

### 3. Data Cleanup (`03-data-cleanup.spec.ts`)
- Uses saved authentication state
- ✅ Delete galleries via API
- ✅ Delete images via API  
- ✅ Verify cleanup completion
- **User account still active**

### 4. Final User Deletion (`04-final-user-deletion.spec.ts`)
- Uses saved authentication state one last time
- ✅ Delete user profile via UI (/profile page)
- ✅ Verify deletion by attempting login (should fail)
- **User completely removed**

## Benefits

- **Clean Slate Guarantee**: Deletes any existing test user before starting
- **Clean Console Output**: No authentication spam
- **Predictable Tests**: Same user, consistent state
- **Proper Lifecycle Testing**: Full user journey from creation to deletion
- **Verification**: Can confirm user deletion worked
- **Simplified Authentication**: One user, one auth state
- **Conflict Prevention**: No issues with leftover test data

## Configuration

- **Sequential Execution**: `fullyParallel: false, workers: 1`
- **Single User**: Defined in `auth-config.ts`
- **Saved Auth State**: `./playwright/.auth/single-user.json`
- **Minimal Teardown**: User deletion verified in tests

## Usage

```bash
# Run all tests in order
npm run test:e2e

# The tests will:
# 0. Delete existing test user (global setup)
# 1. Create new test user (global setup)
# 2. Run auth tests (user persists)
# 3. Run feature tests (same user)
# 4. Clean up data (user persists)
# 5. Delete user and verify (final test)
# 6. Minimal global teardown
```

This strategy eliminates authentication chaos and provides clean, reliable E2E testing!
