# E2E Scripts Simplification

## Summary
Reduced E2E test scripts from **17 to 8** essential commands, eliminating confusion and redundancy.

## Before (17 scripts):
- `test:e2e` - Main tests with AUTH_ONLY
- `test:e2e:fast` - Fast mode only
- `test:e2e:fail-fast` - Fail fast only
- `test:e2e:dev` - Fast + fail-fast combined
- `test:e2e:dev-ultra` - Ultra-fast dev config
- `test:e2e:optimized` - Optimized mode
- `test:e2e:perf` - Performance logging
- `test:e2e:parallel` - Parallel execution
- `test:e2e:profile` - Profiling with line reporter
- `test:e2e:validate` - Config validation
- `test:e2e:all` - Run multiple suites
- `test:e2e:ui` - Playwright UI
- `test:e2e:debug` - Debug mode
- `test:e2e:report` - Show reports
- `test:e2e:auth` - Auth tests only
- `test:e2e:gallery` - Gallery tests only
- `test:e2e:authenticated` - Authenticated tests only
- `e2e:cleanup` - Basic cleanup
- `e2e:cleanup:all` - Full cleanup with user deletion
- `e2e:cleanup:screenshots` - Screenshot cleanup

## After (8 scripts):

### 🏃‍♂️ **Core Testing Commands**
```bash
npm run test:e2e          # Standard E2E test suite
npm run test:e2e:dev      # Ultra-fast development (1s timeouts)
npm run test:e2e:fast     # Fast mode with fail-fast
```

### 🔧 **Development Tools**
```bash
npm run test:e2e:ui       # Playwright UI (visual test runner)
npm run test:e2e:debug    # Debug mode (step through tests)
npm run test:e2e:report   # View test reports
```

### 📊 **Performance & Monitoring**
```bash
npm run test:e2e:perf     # Performance logging and monitoring
```

### 🧹 **Maintenance**
```bash
npm run e2e:cleanup       # Clean up test data and screenshots
```

## Consolidated Features

### What Got Combined:
- **Fast + Fail-Fast** → Single `test:e2e:fast` command
- **Multiple cleanup commands** → Single `e2e:cleanup` with both functions
- **Redundant auth/gallery/authenticated** → Use main test suite (has proper ordering)
- **Optimized/parallel/profile modes** → Built into main config via environment variables

### What Got Removed:
- ❌ `test:e2e:validate` - Config validation (not needed regularly)
- ❌ `test:e2e:all` - Redundant (main test:e2e does this)
- ❌ `test:e2e:parallel` - Experimental (not stable yet)
- ❌ `test:e2e:profile` - Use perf mode instead
- ❌ Individual test suite runners - Use main suite with proper ordering

## Usage Guide

### Daily Development
```bash
npm run test:e2e:dev     # Quick feedback during development
npm run test:e2e:fast    # Fast mode when you need speed
npm run test:e2e         # Full test suite before commits
```

### Debugging & Analysis
```bash
npm run test:e2e:ui      # Visual test runner
npm run test:e2e:debug   # Step through failing tests
npm run test:e2e:report  # View detailed results
```

### Performance Monitoring
```bash
npm run test:e2e:perf    # Monitor test performance
```

### Maintenance
```bash
npm run e2e:cleanup      # Clean up after tests
```

## Benefits

1. **🎯 Reduced Complexity**: 53% fewer scripts (17 → 8)
2. **✨ Clearer Purpose**: Each script has a distinct, obvious purpose
3. **🚀 Faster Onboarding**: New developers can understand options quickly
4. **🔧 Easier Maintenance**: Fewer scripts to update and maintain
5. **📚 Better Documentation**: Simpler to document and remember

## Advanced Usage

If you need the old specific behaviors, you can still use environment variables:

```bash
# Old test:e2e:optimized equivalent
PLAYWRIGHT_OPTIMIZED=true npm run test:e2e

# Old test:e2e:fail-fast equivalent  
PLAYWRIGHT_FAIL_FAST=true npm run test:e2e

# Old test:e2e:auth equivalent (run specific files)
npx playwright test e2e-tests/01-auth-lifecycle.spec.ts
```
