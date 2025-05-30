#!/bin/bash

# Exit on any error, undefined variables, and pipe failures
set -euo pipefail

# E2E Test Performance Comparison Script
# Compares original vs optimized configuration performance

echo "🚀 E2E Test Performance Optimization Comparison"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handling function
handle_error() {
    local line_number="$1"
    echo -e "${RED}❌ Script failed at line $line_number${NC}" >&2
    echo -e "${YELLOW}📋 Cleaning up temporary files...${NC}" >&2
    cleanup_temp_files
    exit 1
}

# Trap errors and call error handler
trap 'handle_error $LINENO' ERR

# Cleanup function for temporary files
cleanup_temp_files() {
    rm -f /tmp/test_output_*.log 2>/dev/null || true
}

# Validation function for required commands
validate_dependencies() {
    local missing_deps=()
    
    # Check for required commands
    command -v npm >/dev/null 2>&1 || missing_deps+=("npm")
    command -v bc >/dev/null 2>&1 || missing_deps+=("bc")
    command -v date >/dev/null 2>&1 || missing_deps+=("date")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required dependencies: ${missing_deps[*]}${NC}" >&2
        echo "Please install the missing dependencies and try again." >&2
        exit 1
    fi
}

# Validation function for npm scripts
validate_npm_scripts() {
    local required_scripts=("test:e2e" "test:e2e:fast" "test:e2e:parallel")
    local missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if ! npm run --silent "$script" --dry-run >/dev/null 2>&1; then
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Missing npm scripts: ${missing_scripts[*]}${NC}" >&2
        echo "Some performance tests may be skipped." >&2
    fi
}

# Function to run tests and measure time
run_test_suite() {
    local config_name="$1"
    local npm_script="$2"
    local description="$3"
    local log_file="/tmp/test_output_${config_name}.log"
    
    echo -e "${BLUE}Testing: ${description}${NC}"
    echo "Command: npm run $npm_script"
    echo "----------------------------------------"
    
    # Validate npm script exists before running
    if ! npm run --silent "$npm_script" --dry-run >/dev/null 2>&1; then
        echo -e "${RED}❌ npm script '$npm_script' not found${NC}"
        echo "-1"
        return 0
    fi
    
    local start_time=$(date +%s)
    local start_time_ms=$(date +%s%3N)
    
    # Run the test suite with timeout protection
    if timeout 1800 npm run "$npm_script" > "$log_file" 2>&1; then
        local end_time=$(date +%s)
        local end_time_ms=$(date +%s%3N)
        local duration=$((end_time - start_time))
        local duration_ms=$((end_time_ms - start_time_ms))
        
        echo -e "${GREEN}✅ $description completed successfully${NC}"
        echo -e "${GREEN}⏱️  Duration: ${duration}s (${duration_ms}ms)${NC}"
        
        # Extract test results with error handling
        local total_tests
        if total_tests=$(grep -o '[0-9]\+ passed' "$log_file" | head -1 | grep -o '[0-9]\+' 2>/dev/null); then
            echo -e "${GREEN}📊 Tests passed: $total_tests${NC}"
        else
            echo -e "${YELLOW}📊 Test count could not be determined${NC}"
        fi
        
        # Return duration for comparison
        echo "$duration_ms"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local exit_code=$?
        
        if [ $exit_code -eq 124 ]; then
            echo -e "${RED}❌ $description timed out after 30 minutes${NC}"
        else
            echo -e "${RED}❌ $description failed after ${duration}s (exit code: $exit_code)${NC}"
        fi
        
        echo -e "${YELLOW}📋 Last few lines of output:${NC}"
        if [ -f "$log_file" ]; then
            tail -10 "$log_file" 2>/dev/null || echo "No output available"
        fi
        
        # Return failure indicator
        echo "-1"
    fi
    
    echo ""
}

# Function to calculate improvement percentage
calculate_improvement() {
    local original="$1"
    local optimized="$2"
    
    # Validate inputs are numeric
    if ! [[ "$original" =~ ^[0-9]+$ ]] || ! [[ "$optimized" =~ ^[0-9]+$ ]]; then
        echo "N/A"
        return 0
    fi
    
    if [ "$original" -gt 0 ] && [ "$optimized" -gt 0 ]; then
        local improvement
        if improvement=$(echo "scale=1; (($original - $optimized) * 100) / $original" | bc -l 2>/dev/null); then
            echo "$improvement"
        else
            echo "N/A"
        fi
    else
        echo "N/A"
    fi
}

echo "🔧 Starting performance comparison..."
echo ""

# Initialize and validate environment
echo "🔍 Validating environment..."
validate_dependencies
validate_npm_scripts

# Setup cleanup on script exit
trap cleanup_temp_files EXIT

echo ""

# Test 1: Original Configuration
echo -e "${YELLOW}Phase 1: Testing Original Configuration${NC}"
echo "========================================"
original_duration=$(run_test_suite "original" "test:e2e" "Original E2E Configuration")

# Wait a bit between tests
echo "⏳ Waiting 10 seconds between test runs..."
sleep 10

# Test 2: Fast Mode Configuration
echo -e "${YELLOW}Phase 2: Testing Optimized Fast Mode${NC}"
echo "====================================="
fast_duration=$(run_test_suite "fast" "test:e2e:fast" "Optimized Fast Mode Configuration")

# Wait a bit between tests
echo "⏳ Waiting 10 seconds between test runs..."
sleep 10

# Test 3: Parallel Mode Configuration (if data allows)
echo -e "${YELLOW}Phase 3: Testing Parallel Mode (Experimental)${NC}"
echo "=============================================="
parallel_duration=$(run_test_suite "parallel" "test:e2e:parallel" "Optimized Parallel Mode Configuration")

echo ""
echo "📊 PERFORMANCE COMPARISON RESULTS"
echo "=================================="

# Display results table
printf "${BLUE}%-25s %-15s %-15s %-15s${NC}\n" "Configuration" "Duration (ms)" "Duration (s)" "Status"
echo "--------------------------------------------------------------------"

if [ "$original_duration" != "-1" ]; then
    original_seconds=$(echo "scale=1; $original_duration / 1000" | bc -l)
    printf "%-25s %-15s %-15s %-15s\n" "Original" "${original_duration}ms" "${original_seconds}s" "✅ Success"
else
    printf "%-25s %-15s %-15s %-15s\n" "Original" "N/A" "N/A" "❌ Failed"
fi

if [ "$fast_duration" != "-1" ]; then
    fast_seconds=$(echo "scale=1; $fast_duration / 1000" | bc -l)
    printf "%-25s %-15s %-15s %-15s\n" "Fast Mode" "${fast_duration}ms" "${fast_seconds}s" "✅ Success"
else
    printf "%-25s %-15s %-15s %-15s\n" "Fast Mode" "N/A" "N/A" "❌ Failed"
fi

if [ "$parallel_duration" != "-1" ]; then
    parallel_seconds=$(echo "scale=1; $parallel_duration / 1000" | bc -l)
    printf "%-25s %-15s %-15s %-15s\n" "Parallel Mode" "${parallel_duration}ms" "${parallel_seconds}s" "✅ Success"
else
    printf "%-25s %-15s %-15s %-15s\n" "Parallel Mode" "N/A" "N/A" "❌ Failed"
fi

echo ""
echo "🎯 PERFORMANCE IMPROVEMENTS"
echo "==========================="

# Calculate improvements
if [ "$original_duration" != "-1" ] && [ "$fast_duration" != "-1" ]; then
    fast_improvement=$(calculate_improvement "$original_duration" "$fast_duration")
    echo -e "${GREEN}Fast Mode Improvement: ${fast_improvement}%${NC}"
fi

if [ "$original_duration" != "-1" ] && [ "$parallel_duration" != "-1" ]; then
    parallel_improvement=$(calculate_improvement "$original_duration" "$parallel_duration")
    echo -e "${GREEN}Parallel Mode Improvement: ${parallel_improvement}%${NC}"
fi

if [ "$fast_duration" != "-1" ] && [ "$parallel_duration" != "-1" ]; then
    parallel_vs_fast=$(calculate_improvement "$fast_duration" "$parallel_duration")
    echo -e "${GREEN}Parallel vs Fast Improvement: ${parallel_vs_fast}%${NC}"
fi

echo ""
echo "📋 RECOMMENDATIONS"
echo "=================="

# Provide recommendations based on results
if [ "$fast_duration" != "-1" ] && [ "$original_duration" != "-1" ]; then
    if [ "$fast_duration" -lt "$original_duration" ]; then
        echo -e "${GREEN}✅ Fast Mode is recommended for daily development${NC}"
    else
        echo -e "${YELLOW}⚠️  Fast Mode didn't provide improvement - investigate configuration${NC}"
    fi
fi

if [ "$parallel_duration" != "-1" ] && [ "$fast_duration" != "-1" ]; then
    if [ "$parallel_duration" -lt "$fast_duration" ]; then
        echo -e "${GREEN}✅ Parallel Mode can be used for CI/CD pipelines${NC}"
    else
        echo -e "${YELLOW}⚠️  Parallel Mode has data dependencies - use with caution${NC}"
    fi
fi

echo ""
echo "🔗 NEXT STEPS"
echo "============="
echo "1. Review test output logs in /tmp/test_output_*.log"
echo "2. Update playwright.config.ts with optimized settings"
echo "3. Update package.json scripts for daily use"
echo "4. Consider implementing shared test data for parallel execution"

echo ""
echo "📂 Log Files Generated:"
echo "- /tmp/test_output_original.log"
echo "- /tmp/test_output_fast.log" 
echo "- /tmp/test_output_parallel.log"

echo ""
echo -e "${GREEN}🎉 Performance comparison completed!${NC}"
