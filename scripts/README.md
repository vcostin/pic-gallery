# Performance Testing Scripts

This directory contains scripts for testing and comparing E2E test performance optimizations.

## Scripts

### `performance-test.sh`
Main script for comparing performance between different Playwright configurations.

#### Features
- **Robust Error Handling**: Uses `set -euo pipefail` to catch errors early
- **Dependency Validation**: Checks for required commands (npm, bc, date)
- **npm Script Validation**: Verifies test scripts exist before running
- **Timeout Protection**: 30-minute timeout for long-running tests
- **Input Validation**: Validates numeric inputs for calculations
- **Automatic Cleanup**: Removes temporary files on exit
- **Comprehensive Logging**: Detailed output with color-coded results

#### Usage
```bash
# Run performance comparison
./scripts/performance-test.sh

# The script will automatically run:
# 1. Original configuration (test:e2e)
# 2. Fast mode (test:e2e:fast)
# 3. Parallel mode (test:e2e:parallel)
```

#### Output
- Performance metrics for each configuration
- Improvement percentages
- Recommendations based on results
- Log files in `/tmp/test_output_*.log`

### `test-performance-script.sh`
Validation script for testing the robustness of `performance-test.sh`.

#### Features
- Tests all error handling mechanisms
- Validates function implementations
- Checks for proper script flags and traps
- Verifies timeout protection
- Tests input validation

#### Usage
```bash
# Validate the performance script
./scripts/test-performance-script.sh
```

## Improvements Made

### Error Handling
1. **Added `set -euo pipefail`** - Catches errors early and prevents silent failures
2. **Error trap function** - Handles script failures gracefully
3. **Cleanup on exit** - Removes temporary files automatically
4. **Timeout protection** - Prevents hanging on long-running tests

### Validation
1. **Dependency checking** - Ensures required commands are available
2. **npm script validation** - Checks scripts exist before running
3. **Input validation** - Validates numeric inputs for calculations
4. **Exit code handling** - Proper error reporting with exit codes

### Robustness
1. **Automatic cleanup** - Temporary files removed on exit/error
2. **Better error messages** - Clear indication of what went wrong
3. **Graceful degradation** - Script continues if individual tests fail
4. **Log file protection** - Safe handling of missing/corrupt log files

## Testing

The `test-performance-script.sh` validates:
- ✅ Script exists and is executable
- ✅ Has proper shebang and set flags (`set -euo pipefail`)
- ✅ Required functions exist
- ✅ Error trap is configured
- ✅ Cleanup trap is configured  
- ✅ Timeout protection for long-running tests
- ✅ Input validation for numeric values
- ✅ Dependency checking implemented
- ✅ npm script validation
- ✅ Calculate improvement function works

## Dependencies

### Required Commands
- `npm` - For running test scripts
- `bc` - For percentage calculations
- `date` - For timing measurements
- `timeout` - For preventing hanging tests

### Required npm Scripts
- `test:e2e` - Original E2E test configuration
- `test:e2e:fast` - Optimized fast mode configuration
- `test:e2e:parallel` - Parallel execution configuration

## Error Recovery

If the script fails:
1. Check the error message for the specific line number
2. Review log files in `/tmp/test_output_*.log`
3. Ensure all dependencies are installed
4. Verify npm scripts exist in package.json
5. Check that the development server can start

## Best Practices

1. **Run tests in clean environment** - No conflicting processes
2. **Sufficient system resources** - Ensure adequate CPU/memory
3. **Stable network connection** - For any external dependencies
4. **Updated dependencies** - Keep Playwright and other tools current

## Integration with CI/CD

The script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Performance Test Comparison
  run: ./scripts/performance-test.sh
  timeout-minutes: 60
```

## Future Enhancements

1. **JSON output format** - For automated processing
2. **Historical tracking** - Compare against previous runs
3. **Performance regression detection** - Alert on degradation
4. **Integration with monitoring tools** - Send metrics to dashboards
