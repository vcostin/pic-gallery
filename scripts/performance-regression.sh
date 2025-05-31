#!/bin/bash

# Performance Regression Detection Script
# This script runs tests and compares performance against baseline thresholds
# to detect performance regressions automatically.

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BASELINE_FILE="$PROJECT_ROOT/.performance-baseline"
RESULTS_DIR="$PROJECT_ROOT/performance-results"
THRESHOLD_PERCENT=10  # Alert if performance degrades by more than 10%

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Performance measurement function
measure_performance() {
    local config=$1
    local mode=$2
    
    log "Measuring performance for $config in $mode mode..."
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Set up environment
    export PLAYWRIGHT_PERF_LOG=true
    if [ "$mode" = "fast" ]; then
        export PLAYWRIGHT_FAST_MODE=true
    fi
    
    # Run tests and capture timing
    local start_time=$(date +%s%3N)
    local result_file="$RESULTS_DIR/result-$config-$mode-$(date +%s).json"
    
    # Run the test and capture output
    local npm_script=""
    case "$mode" in
        "fast") npm_script="test:e2e:fast" ;;
        "standard") npm_script="test:e2e" ;;
        "parallel") npm_script="test:e2e:parallel" ;;
        *) npm_script="test:e2e" ;;
    esac
    
    log "Running npm run $npm_script..."
    
    # Capture both timing and test results
    if timeout 1800 npm run "$npm_script" > "$result_file.log" 2>&1; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        local test_count=$(grep -o "passed\|failed" "$result_file.log" | wc -l | tr -d ' ')
        local passed_count=$(grep -o "passed" "$result_file.log" | wc -l | tr -d ' ')
        
        # Create JSON result
        cat > "$result_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "config": "$config",
  "mode": "$mode",
  "duration_ms": $duration,
  "test_count": $test_count,
  "passed_count": $passed_count,
  "success_rate": $(echo "scale=2; $passed_count * 100 / $test_count" | bc -l),
  "environment": {
    "ci": "${CI:-false}",
    "node_version": "$(node --version)",
    "playwright_version": "$(npm list @playwright/test --depth=0 2>/dev/null | grep @playwright/test | sed 's/.*@//' | sed 's/ .*//')"
  }
}
EOF
        
        echo "$duration"
        return 0
    else
        error "Test execution failed"
        return 1
    fi
}

# Compare with baseline
compare_with_baseline() {
    local current_duration=$1
    local mode=$2
    
    if [ ! -f "$BASELINE_FILE" ]; then
        warning "No baseline found. Creating baseline with current performance."
        echo "$mode:$current_duration" > "$BASELINE_FILE"
        return 0
    fi
    
    local baseline_duration=$(grep "^$mode:" "$BASELINE_FILE" | cut -d':' -f2)
    
    if [ -z "$baseline_duration" ]; then
        warning "No baseline for $mode mode. Adding to baseline."
        echo "$mode:$current_duration" >> "$BASELINE_FILE"
        return 0
    fi
    
    # Calculate percentage change
    local percent_change=$(echo "scale=2; ($current_duration - $baseline_duration) * 100 / $baseline_duration" | bc -l)
    local abs_change=$(echo "$percent_change" | sed 's/-//')
    
    log "Performance comparison for $mode mode:"
    log "  Baseline: ${baseline_duration}ms"
    log "  Current:  ${current_duration}ms"
    log "  Change:   ${percent_change}%"
    
    # Check for regression
    if (( $(echo "$percent_change > $THRESHOLD_PERCENT" | bc -l) )); then
        error "Performance regression detected! ${percent_change}% slower than baseline"
        error "Threshold: ${THRESHOLD_PERCENT}%, Actual: ${percent_change}%"
        return 1
    elif (( $(echo "$percent_change < -5" | bc -l) )); then
        success "Performance improvement detected! ${percent_change}% faster than baseline"
        # Update baseline with better performance
        sed -i.bak "s/^$mode:.*/$mode:$current_duration/" "$BASELINE_FILE"
        return 0
    else
        success "Performance within acceptable range (${percent_change}%)"
        return 0
    fi
}

# Generate performance report
generate_report() {
    local results_files=("$RESULTS_DIR"/result-*.json)
    
    if [ ${#results_files[@]} -eq 0 ]; then
        warning "No performance results found"
        return
    fi
    
    log "Generating performance report..."
    
    local report_file="$RESULTS_DIR/performance-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .good { background: #d4edda; border-color: #c3e6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 E2E Test Performance Report</h1>
        <p>Generated on: <strong>$(date)</strong></p>
    </div>
    
    <h2>📊 Latest Results</h2>
    <table>
        <tr>
            <th>Configuration</th>
            <th>Mode</th>
            <th>Duration (ms)</th>
            <th>Test Count</th>
            <th>Success Rate</th>
            <th>Timestamp</th>
        </tr>
EOF
    
    # Add results to table
    for result_file in "${results_files[@]}"; do
        if [ -f "$result_file" ]; then
            local config=$(jq -r '.config' "$result_file")
            local mode=$(jq -r '.mode' "$result_file")
            local duration=$(jq -r '.duration_ms' "$result_file")
            local test_count=$(jq -r '.test_count' "$result_file")
            local success_rate=$(jq -r '.success_rate' "$result_file")
            local timestamp=$(jq -r '.timestamp' "$result_file")
            
            cat >> "$report_file" << EOF
        <tr>
            <td>$config</td>
            <td>$mode</td>
            <td>$duration</td>
            <td>$test_count</td>
            <td>$success_rate%</td>
            <td>$timestamp</td>
        </tr>
EOF
        fi
    done
    
    cat >> "$report_file" << 'EOF'
    </table>
    
    <h2>📈 Performance Trends</h2>
    <p>Track performance over time to identify trends and regressions.</p>
    
    <div id="chart" style="height: 400px; background: #f9f9f9; border: 1px solid #ddd; margin: 20px 0;"></div>
    
    <h2>🔍 Analysis</h2>
    <ul>
        <li>Monitor for consistent performance improvements</li>
        <li>Watch for performance regressions > 10%</li>
        <li>Compare different configurations and modes</li>
        <li>Track success rates alongside performance</li>
    </ul>
</body>
</html>
EOF
    
    success "Performance report generated: $report_file"
}

# Main execution
main() {
    log "🔍 Starting performance regression detection..."
    
    cd "$PROJECT_ROOT"
    
    # Validate configuration first
    if [ -f "scripts/validate-config.js" ]; then
        log "Validating configuration..."
        if ! node scripts/validate-config.js; then
            error "Configuration validation failed"
            exit 1
        fi
    fi
    
    # Test configurations to check
    local configurations=("optimized")
    local modes=("fast" "standard")
    local has_regression=false
    
    for config in "${configurations[@]}"; do
        for mode in "${modes[@]}"; do
            log "Testing $config configuration in $mode mode..."
            
            if duration=$(measure_performance "$config" "$mode"); then
                success "Performance test completed: ${duration}ms"
                
                if ! compare_with_baseline "$duration" "$mode"; then
                    has_regression=true
                fi
            else
                error "Performance test failed for $config/$mode"
                has_regression=true
            fi
        done
    done
    
    # Generate report
    generate_report
    
    # Final status
    if [ "$has_regression" = true ]; then
        error "Performance regression detected! See report for details."
        exit 1
    else
        success "All performance tests passed!"
        exit 0
    fi
}

# Usage information
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "Performance Regression Detection Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --reset       Reset performance baseline"
    echo "  --report      Generate report only (no tests)"
    echo ""
    echo "Environment variables:"
    echo "  THRESHOLD_PERCENT   Performance degradation threshold (default: 10)"
    echo "  PLAYWRIGHT_DEBUG    Enable debug mode"
    echo ""
    exit 0
fi

# Reset baseline
if [ "${1:-}" = "--reset" ]; then
    if [ -f "$BASELINE_FILE" ]; then
        rm "$BASELINE_FILE"
        success "Performance baseline reset"
    else
        warning "No baseline file found"
    fi
    exit 0
fi

# Report only
if [ "${1:-}" = "--report" ]; then
    generate_report
    exit 0
fi

# Run main function
main "$@"
