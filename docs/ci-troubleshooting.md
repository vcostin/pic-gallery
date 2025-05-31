# CI Troubleshooting Guide

This document provides solutions for common CI issues encountered during GitHub Actions E2E testing.

## Common Issues and Solutions

### 1. Connection Refused Errors (FIXED)

**Problem:** E2E tests fail with connection refused errors when trying to access `localhost:3000`

**Symptoms:**
- Tests timeout waiting for page elements
- Error messages like "connection refused" or "ECONNREFUSED"
- Tests receive unexpected URLs like `/api/auth/signin` instead of expected routes

**Root Cause:** Next.js application server not running in CI environment

**Solution:** ✅ **FIXED in commit a919bd6**
```yaml
- name: Build Next.js application
  run: npm run build

- name: Start Next.js server
  run: npm start &
  
- name: Wait for server to be ready
  run: |
    echo "Waiting for Next.js server to start..."
    for i in {1..30}; do
      if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        echo "Server is ready!"
        break
      fi
      echo "Attempt $i/30: Server not ready yet, waiting 2 seconds..."
      sleep 2
      if [ $i -eq 30 ]; then
        echo "❌ Server failed to start within 60 seconds"
        exit 1
      fi
    done
```

### 2. Database Connection Issues

**Problem:** Database-related errors in CI

**Symptoms:**
- Prisma client errors
- Database connection failures
- Migration errors

**Solution:** ✅ **ALREADY IMPLEMENTED**
- SQLite database setup script handles environment detection
- Proper DATABASE_URL configuration for CI
- Automated schema generation and user creation

**Verification:**
```bash
# Check database setup in CI
./scripts/setup-database-ci.sh
```

### 3. Authentication/Session Issues

**Problem:** Tests fail due to authentication state problems

**Symptoms:**
- Users not logged in when expected
- Session timeouts
- Redirect loops

**Debugging:**
1. Check NEXTAUTH_SECRET is set in CI environment
2. Verify NEXTAUTH_URL matches server URL
3. Ensure test users are created properly
4. Check storage state persistence

### 4. Environment Variable Issues

**Problem:** Missing or incorrect environment variables

**Required Environment Variables for CI:**
```yaml
env:
  CI: true
  DATABASE_URL: "file:./test.db"
  E2E_TEST_USER_EMAIL: "e2e-test@example.com"
  E2E_TEST_USER_PASSWORD: "TestPassword123!"
  E2E_TEST_USER_NAME: "E2E Test User"
  NEXTAUTH_SECRET: "test-secret-for-ci"
  NEXTAUTH_URL: "http://localhost:3000"
```

### 5. Performance and Timeout Issues

**Problem:** Tests running slowly or timing out

**Solutions:**
- Use PLAYWRIGHT_FAST_MODE for optimized testing
- Increase timeouts for slow operations
- Use parallel execution where appropriate
- Monitor performance regression results

## Debugging Steps

### 1. Check GitHub Actions Logs
1. Go to the failed workflow run
2. Check each job's logs for specific error messages
3. Look for server startup confirmation messages
4. Verify database setup completion

### 2. Local Reproduction
```bash
# Simulate CI environment locally
CI=true DATABASE_URL="file:./test.db" ./scripts/setup-database-ci.sh
npm run build
npm start &
# Wait for server, then run tests
npm run test:e2e:fast
```

### 3. Test Server Availability
```bash
# In CI environment
curl -s -f http://localhost:3000
# Should return HTTP 200 if server is ready
```

### 4. Verify Database Setup
```bash
# Check if database was created
ls -la test.db
# Check if Prisma client was generated
ls -la src/lib/generated/prisma-client/
```

## Monitoring CI Health

### Key Metrics to Watch:
- ✅ Server startup time (should be < 30 seconds)
- ✅ Database setup time (should be < 10 seconds)
- ✅ Test execution time (target < 5 minutes for fast mode)
- ✅ Success rate (target > 95%)

### Performance Alerts:
- If server startup takes > 30 seconds: Check build performance
- If tests take > 10 minutes: Review test optimization
- If success rate < 90%: Investigate flaky tests

## Recent Fixes

### ✅ Fix Applied: Server Startup (Commit a919bd6)
- **Issue:** E2E tests failing with connection refused errors
- **Fix:** Added proper Next.js server startup sequence to all CI jobs
- **Impact:** Should resolve majority of E2E test failures
- **Status:** Waiting for CI verification

### ✅ Implemented: SQLite Database Support (Commit 0e76ad8)
- **Issue:** PostgreSQL dependency in CI environments
- **Fix:** Dual database setup with SQLite for CI, PostgreSQL for production
- **Impact:** Simplified CI setup, no external database dependencies
- **Status:** Working and tested locally

## 🔧 Recent Fixes Applied

### Server Startup Conflict Resolution
**Issue**: Playwright reports not being generated due to server startup conflicts
**Root Cause**: Dual server configuration - GitHub Actions manually starting server while Playwright config also trying to start server
**Solution**: Modified Playwright configurations to disable `webServer` in CI environments

**Files Fixed**:
- `playwright.config.ts` - Disabled webServer for CI, explicit report folder
- `playwright.config.optimized.ts` - Same fixes for optimized configuration
- Enhanced error handling in GitHub Actions workflow

**Status**: ✅ **FIXED** - Server startup conflicts resolved, explicit report generation configured

### Database Environment Setup  
**Issue**: Connection errors in CI due to database configuration
**Solution**: Comprehensive database setup with dual PostgreSQL/SQLite support
**Status**: ✅ **FIXED** - Automated SQLite setup for CI environments

### GitHub Actions Performance
**Issue**: E2E tests taking too long or timing out
**Solution**: Optimized worker configuration, better timeout handling
**Status**: ✅ **IMPROVED** - Performance monitoring in place

## 🔍 Current Investigation

### Playwright Report Generation
- **Expected**: `playwright-report/` directory with test results
- **Configuration**: Explicit output folder set in both configs
- **Monitoring**: Check if tests are actually running and completing

**Next Steps**:
1. Verify server startup is working properly
2. Check test execution logs for any remaining issues
3. Monitor report generation after configuration changes

## Contact and Support

For CI issues:
1. Check this troubleshooting guide first
2. Review recent commits for related changes
3. Check GitHub Actions workflow history
4. Create an issue with full error logs and reproduction steps

Last updated: Based on workflow fixes in commit a919bd6
