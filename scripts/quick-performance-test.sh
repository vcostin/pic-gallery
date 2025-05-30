#!/bin/bash

# Simple Performance Comparison Script - Compatible Version
# Compares Phase 1 optimized vs Phase 2 Lite configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUNS_PER_CONFIG=3
TEST_TIMEOUT=60

log_info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] $1${NC}"
}

# Create results directory
RESULTS_DIR="performance-comparison-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

log_info "Starting Simple Performance Comparison"
echo "══════════════════════════════════════════════════"
echo "🔧 Test: Single toast component test (e2e-tests/toast-component.spec.ts)"
echo "📊 Runs per config: $RUNS_PER_CONFIG"
echo "⏱️  Test timeout: ${TEST_TIMEOUT}s"
echo "📁 Results directory: $RESULTS_DIR"
echo "══════════════════════════════════════════════════"

# Test Phase 1 Optimized
log_info "Testing phase1-optimized configuration..."
config_file="playwright.config.optimized.ts"
echo "Description: $config_file"

phase1_total_time=0
phase1_successful_runs=0

for ((i=1; i<=RUNS_PER_CONFIG; i++)); do
    log_info "Run $i/$RUNS_PER_CONFIG for phase1-optimized..."
    
    start_time=$(date +%s)
    
    # Run the test with a simple background process approach
    if (cd "$PWD" && PLAYWRIGHT_FAST_MODE=true npx playwright test --config="$config_file" e2e-tests/toast-component.spec.ts --timeout=30000 --workers=1 > "/tmp/test-output-phase1-$i.log" 2>&1); then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        phase1_total_time=$((phase1_total_time + duration))
        phase1_successful_runs=$((phase1_successful_runs + 1))
        
        log_success "Run $i completed in ${duration}s"
        
        # Save individual result
        cat > "$RESULTS_DIR/result-phase1-optimized-$i.json" << EOF
{
  "config": "phase1-optimized",
  "run": $i,
  "duration": $duration,
  "timestamp": "$(date -Iseconds)",
  "status": "success"
}
EOF
    else
        log_error "Run $i failed or timed out"
        
        # Save failure result
        cat > "$RESULTS_DIR/result-phase1-optimized-$i.json" << EOF
{
  "config": "phase1-optimized",
  "run": $i,
  "duration": $TEST_TIMEOUT,
  "timestamp": "$(date -Iseconds)",
  "status": "failed"
}
EOF
    fi
    
    # Clean up
    rm -f "/tmp/test-output-phase1-$i.log"
    
    # Short pause between runs
    sleep 2
done

# Test Phase 2 Lite
log_info "Testing phase2-lite configuration..."
config_file="playwright.config.phase2-lite.ts"
echo "Description: $config_file"

phase2_total_time=0
phase2_successful_runs=0

for ((i=1; i<=RUNS_PER_CONFIG; i++)); do
    log_info "Run $i/$RUNS_PER_CONFIG for phase2-lite..."
    
    start_time=$(date +%s)
    
    # Run the test
    if (cd "$PWD" && PLAYWRIGHT_FAST_MODE=true npx playwright test --config="$config_file" e2e-tests/toast-component.spec.ts --timeout=30000 --workers=1 > "/tmp/test-output-phase2-$i.log" 2>&1); then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        phase2_total_time=$((phase2_total_time + duration))
        phase2_successful_runs=$((phase2_successful_runs + 1))
        
        log_success "Run $i completed in ${duration}s"
        
        # Save individual result
        cat > "$RESULTS_DIR/result-phase2-lite-$i.json" << EOF
{
  "config": "phase2-lite",
  "run": $i,
  "duration": $duration,
  "timestamp": "$(date -Iseconds)",
  "status": "success"
}
EOF
    else
        log_error "Run $i failed or timed out"
        
        # Save failure result
        cat > "$RESULTS_DIR/result-phase2-lite-$i.json" << EOF
{
  "config": "phase2-lite",
  "run": $i,
  "duration": $TEST_TIMEOUT,
  "timestamp": "$(date -Iseconds)",
  "status": "failed"
}
EOF
    fi
    
    # Clean up
    rm -f "/tmp/test-output-phase2-$i.log"
    
    # Short pause between runs
    sleep 2
done

# Calculate averages and generate report
log_info "Generating performance comparison report..."

echo ""
echo "Performance Comparison Results"
echo "════════════════════════════════════════════════════════════════"

# Calculate Phase 1 average
if [ "$phase1_successful_runs" -gt 0 ]; then
    phase1_avg_time=$((phase1_total_time / phase1_successful_runs))
    echo "📊 phase1-optimized:"
    echo "   ⏱️  Average time: ${phase1_avg_time}s"
    echo "   ✅ Successful runs: $phase1_successful_runs/$RUNS_PER_CONFIG"
    echo "   📁 Total time: ${phase1_total_time}s"
else
    echo "❌ phase1-optimized: All runs failed"
    phase1_avg_time=999999
fi
echo ""

# Calculate Phase 2 average
if [ "$phase2_successful_runs" -gt 0 ]; then
    phase2_avg_time=$((phase2_total_time / phase2_successful_runs))
    echo "📊 phase2-lite:"
    echo "   ⏱️  Average time: ${phase2_avg_time}s"
    echo "   ✅ Successful runs: $phase2_successful_runs/$RUNS_PER_CONFIG"
    echo "   📁 Total time: ${phase2_total_time}s"
else
    echo "❌ phase2-lite: All runs failed"
    phase2_avg_time=999999
fi
echo ""

# Calculate improvements
if [ "$phase1_avg_time" -ne 999999 ] && [ "$phase2_avg_time" -ne 999999 ]; then
    if [ "$phase1_avg_time" -gt "$phase2_avg_time" ]; then
        improvement=$(( (phase1_avg_time - phase2_avg_time) * 100 / phase1_avg_time ))
        log_success "🚀 Phase 2 Lite is ${improvement}% faster than Phase 1 Optimized"
        log_success "   Phase 1: ${phase1_avg_time}s → Phase 2: ${phase2_avg_time}s"
        best_config="phase2-lite"
        best_time=$phase2_avg_time
    elif [ "$phase2_avg_time" -gt "$phase1_avg_time" ]; then
        regression=$(( (phase2_avg_time - phase1_avg_time) * 100 / phase1_avg_time ))
        log_warning "⚠️  Phase 2 Lite is ${regression}% slower than Phase 1 Optimized"
        log_warning "   Phase 1: ${phase1_avg_time}s → Phase 2: ${phase2_avg_time}s"
        best_config="phase1-optimized"
        best_time=$phase1_avg_time
    else
        log_info "📊 Phase 1 and Phase 2 have similar performance"
        best_config="tie"
        best_time=$phase1_avg_time
    fi
elif [ "$phase1_avg_time" -ne 999999 ]; then
    best_config="phase1-optimized"
    best_time=$phase1_avg_time
elif [ "$phase2_avg_time" -ne 999999 ]; then
    best_config="phase2-lite"
    best_time=$phase2_avg_time
else
    best_config="none"
    best_time=999999
fi

echo "════════════════════════════════════════════════════════════════"
if [ "$best_config" != "none" ]; then
    log_success "🏆 Best configuration: $best_config (${best_time}s average)"
else
    log_error "❌ All configurations failed"
fi

# Generate JSON summary
cat > "$RESULTS_DIR/summary.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test": "e2e-tests/toast-component.spec.ts",
  "runsPerConfig": $RUNS_PER_CONFIG,
  "testTimeout": $TEST_TIMEOUT,
  "results": {
    "phase1-optimized": {
      "averageTime": $([ "$phase1_avg_time" -eq 999999 ] && echo "null" || echo "$phase1_avg_time"),
      "totalTime": $phase1_total_time,
      "successfulRuns": $phase1_successful_runs
    },
    "phase2-lite": {
      "averageTime": $([ "$phase2_avg_time" -eq 999999 ] && echo "null" || echo "$phase2_avg_time"),
      "totalTime": $phase2_total_time,
      "successfulRuns": $phase2_successful_runs
    }
  },
  "bestConfig": "$best_config",
  "bestTime": $([ "$best_time" -eq 999999 ] && echo "null" || echo "$best_time")
}
EOF

log_success "📄 Detailed results saved to: $RESULTS_DIR/"

echo ""
echo "Files generated:"
echo "  📊 $RESULTS_DIR/summary.json - Overall comparison"
echo "  📝 $RESULTS_DIR/result-*.json - Individual test results"

exit 0
