# E2E Testing: FAIL-FAST RULE

## ⚠️ CRITICAL RULE: ALWAYS STOP ON FIRST FAILING TEST

### Why This Rule Exists
- **Time Efficiency**: Full suite = 2-3 minutes, Fail-fast = 30-40 seconds
- **Resource Management**: Users have limited time/API quotas
- **Focus**: Fix ONE issue at a time, don't get overwhelmed

### DEFAULT BEHAVIOR
- **Fail-fast is now DEFAULT** (`PLAYWRIGHT_FAIL_FAST !== 'false'`)
- Always run: `npm run test:e2e:dev` (includes fail-fast)
- To disable: `PLAYWRIGHT_FAIL_FAST=false npm run test:e2e`

### Development Workflow
1. Run test with fail-fast: `npm run test:e2e:dev`
2. Fix the FIRST failing test only
3. Run again to see next failure
4. Repeat until all tests pass

### Commands
```bash
# DEFAULT - Fail-fast enabled
npm run test:e2e:dev

# Only to see all failures (rare case)
PLAYWRIGHT_FAIL_FAST=false npm run test:e2e
```

### FOR AI ASSISTANTS
- **NEVER run full test suites unless explicitly requested**
- **ALWAYS use fail-fast mode by default**
- **Fix ONE test at a time**
- **Don't waste user's time with long test runs**
