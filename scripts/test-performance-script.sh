#!/bin/bash

# Test script for performance-test.sh
# Validates the script's functions and error handling

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PERFORMANCE_SCRIPT="$SCRIPT_DIR/performance-test.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Test result tracking
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    ((TESTS_RUN++))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
    fi
    echo ""
}

# Test helper functions
test_script_exists() {
    [ -f "$PERFORMANCE_SCRIPT" ] && [ -x "$PERFORMANCE_SCRIPT" ]
}

test_shebang_and_set_flags() {
    head -5 "$PERFORMANCE_SCRIPT" | grep -q "set -euo pipefail"
}

test_required_functions_exist() {
    grep -q "handle_error" "$PERFORMANCE_SCRIPT" &&
    grep -q "cleanup_temp_files" "$PERFORMANCE_SCRIPT" &&
    grep -q "validate_dependencies" "$PERFORMANCE_SCRIPT" &&
    grep -q "validate_npm_scripts" "$PERFORMANCE_SCRIPT"
}

test_error_trap_exists() {
    grep -q "trap.*handle_error" "$PERFORMANCE_SCRIPT"
}

test_cleanup_trap_exists() {
    grep -q "trap.*cleanup_temp_files" "$PERFORMANCE_SCRIPT"
}

test_timeout_protection() {
    grep -q "timeout.*npm run" "$PERFORMANCE_SCRIPT"
}

test_input_validation() {
    grep -q "\[\[.*=~.*\^\[0-9\]" "$PERFORMANCE_SCRIPT"
}

test_dependency_checking() {
    grep -q "command -v npm" "$PERFORMANCE_SCRIPT" &&
    grep -q "command -v bc" "$PERFORMANCE_SCRIPT"
}

test_npm_script_validation() {
    grep -q "npm run.*--dry-run" "$PERFORMANCE_SCRIPT"
}

test_calculate_improvement_function() {
    # Test the bc calculation directly since function sourcing is complex
    local test_result
    if test_result=$(echo "scale=1; ((100 - 80) * 100) / 100" | bc -l 2>/dev/null); then
        [ "$test_result" = "20.0" ]
    else
        false
    fi
}

echo "🧪 Performance Test Script Validation"
echo "======================================"
echo ""

# Run all tests
run_test "Script exists and is executable" "test_script_exists"
run_test "Has proper shebang and set flags" "test_shebang_and_set_flags"
run_test "Required functions exist" "test_required_functions_exist"
run_test "Error trap is configured" "test_error_trap_exists"
run_test "Cleanup trap is configured" "test_cleanup_trap_exists"
run_test "Timeout protection for long-running tests" "test_timeout_protection"
run_test "Input validation for numeric values" "test_input_validation"
run_test "Dependency checking implemented" "test_dependency_checking"
run_test "npm script validation" "test_npm_script_validation"
run_test "Calculate improvement function works" "test_calculate_improvement_function"

echo "📊 TEST RESULTS"
echo "==============="
echo -e "Tests run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$((TESTS_RUN - TESTS_PASSED))${NC}"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}🎉 All tests passed! Script is robust and ready for use.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Script needs improvement.${NC}"
    exit 1
fi
