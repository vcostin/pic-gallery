#!/bin/bash

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

# Function to run tests and measure time
run_test_suite() {
    local config_name="$1"
    local npm_script="$2"
    local description="$3"
    
    echo -e "${BLUE}Testing: ${description}${NC}"
    echo "Command: npm run $npm_script"
    echo "----------------------------------------"
    
    local start_time=$(date +%s)
    local start_time_ms=$(date +%s%3N)
    
    # Run the test suite
    if npm run "$npm_script" > /tmp/test_output_$config_name.log 2>&1; then
        local end_time=$(date +%s)
        local end_time_ms=$(date +%s%3N)
        local duration=$((end_time - start_time))
        local duration_ms=$((end_time_ms - start_time_ms))
        
        echo -e "${GREEN}✅ $description completed successfully${NC}"
        echo -e "${GREEN}⏱️  Duration: ${duration}s (${duration_ms}ms)${NC}"
        
        # Extract test results
        local total_tests=$(grep -o '[0-9]\+ passed' /tmp/test_output_$config_name.log | head -1 | grep -o '[0-9]\+')
        echo -e "${GREEN}📊 Tests passed: $total_tests${NC}"
        
        # Return duration for comparison
        echo "$duration_ms"
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo -e "${RED}❌ $description failed after ${duration}s${NC}"
        echo -e "${YELLOW}📋 Last few lines of output:${NC}"
        tail -10 /tmp/test_output_$config_name.log
        
        # Return failure indicator
        echo "-1"
    fi
    
    echo ""
}

# Function to calculate improvement percentage
calculate_improvement() {
    local original="$1"
    local optimized="$2"
    
    if [ "$original" -gt 0 ] && [ "$optimized" -gt 0 ]; then
        local improvement=$(echo "scale=1; (($original - $optimized) * 100) / $original" | bc -l)
        echo "$improvement"
    else
        echo "N/A"
    fi
}

echo "🔧 Starting performance comparison..."
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
