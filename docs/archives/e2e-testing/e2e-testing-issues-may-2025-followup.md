# E2E Testing Issues - May 2025 Follow-up

## Summary

This document addresses ongoing issues with E2E test cleanup and authentication stability in the pic-gallery application.

## Issues Addressed

1. **Authentication Issues**
   - Fixed infinite login recursion causing test freezes
   - Added better auth state detection with multiple selector strategies
   - Added rate limiting for auth endpoints to prevent server crashes during tests
   - Improved handling of connection resets (ECONNRESET errors)

2. **Cleanup API Enhancements**
   - Made cleanup API more robust with better error handling
   - Added POST support for cleanup API with _method=DELETE parameter
   - Improved database transaction error handling
   - Enhanced request validation and error reporting

3. **Test Reliability Improvements**
   - Added failsafe UI-based cleanup when API fails
   - Added a manual cleanup script for troubleshooting
   - Added rate limit bypass for E2E tests

## Technical Changes

1. **Code Improvements**
   - Enhanced TestHelpers.isAuthenticated() with multiple selector strategies
   - Fixed infinite recursion in TestHelpers.login() with skipRegistration parameter
   - Made fallbackCleanup() method public for direct access
   - Added better error handling in global setup/teardown

2. **New Capabilities**
   - Added a dedicated cleanup script for manual cleanup
   - Added rate limiting middleware specifically for auth endpoints
   - Improved robustness of server-side cleanup API

3. **Middleware Improvements**
   - Added rate limiting for auth endpoints to prevent server crashes
   - Special handling for E2E test requests with higher limits

## Usage Instructions

### Manual Cleanup

If tests fail and leave data behind, you can now use the dedicated cleanup script:

```bash
# Clean up all test data but keep user account:
npm run e2e:cleanup

# Clean up all test data AND delete user account:
npm run e2e:cleanup:all
```

### Troubleshooting Authentication Issues

1. Check auth state is persisted correctly:
   ```bash
   # Look for the auth file:
   cat playwright/.auth/user.json
   ```

2. Rate limiting issues:
   - Add `x-e2e-test: true` header to requests
   - Use throttling in TestHelpers methods when making multiple auth requests

## Future Work

1. Move from in-memory rate limiting to Redis for multi-instance support
2. Add more granular test data management (delete specific galleries)
3. Consider implementing API key authentication for E2E tests
4. Monitor performance of auth endpoints during tests
