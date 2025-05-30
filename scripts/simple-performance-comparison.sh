#!/bin/bash

# Simple Performance Comparison Script
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
echo "🔧 Test: Single toast component test"
echo "📊 Runs per config: $RUNS_PER_CONFIG"
echo "⏱️  Test timeout: ${TEST_TIMEOUT}s"
echo "📁 Results directory: $RESULTS_DIR"
echo "══════════════════════════════════════════════════"

# Test configurations
configs_phase1_optimized="playwright.config.optimized.ts"
configs_phase2_lite="playwright.config.phase2-lite.ts"

# Results storage
declare -A total_times
declare -A test_counts

# Initialize arrays
total_times["phase1-optimized"]=0
test_counts["phase1-optimized"]=0
total_times["phase2-lite"]=0
test_counts["phase2-lite"]=0

# Test each configuration
test_config() {
    local config_name=$1
    local config_file=$2
    
    log_info "Testing $config_name configuration..."
    echo "Description: ${config_file}"
    
    for ((i=1; i<=RUNS_PER_CONFIG; i++)); do
        log_info "Run $i/$RUNS_PER_CONFIG for $config_name..."
        
        start_time=$(date +%s)
        
        # Run the test with timeout
        if timeout "${TEST_TIMEOUT}s" bash -c "
            cd '$PWD' && 
            PLAYWRIGHT_FAST_MODE=true npx playwright test --config='$config_file' toast-component.spec.ts --timeout=30000 --workers=1 > /tmp/test-output-$config_name-$i.log 2>&1
        "; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            total_times[$config_name]=$((total_times[$config_name] + duration))
            test_counts[$config_name]=$((test_counts[$config_name] + 1))
            
            log_success "Run $i completed in ${duration}s"
            
            # Save individual result
            cat > "$RESULTS_DIR/result-$config_name-$i.json" << EOF
{
  "config": "$config_name",
  "run": $i,
  "duration": $duration,
  "timestamp": "$(date -Iseconds)",
  "status": "success"
}
EOF
        else
            log_error "Run $i failed or timed out"
            
            # Save failure result
            cat > "$RESULTS_DIR/result-$config_name-$i.json" << EOF
{
  "config": "$config_name",
  "run": $i,
  "duration": $TEST_TIMEOUT,
  "timestamp": "$(date -Iseconds)",
  "status": "failed"
}
EOF
        fi
        
        # Clean up
        rm -f "/tmp/test-output-$config_name-$i.log"
        
        # Short pause between runs
        sleep 2
    done
}

# Run tests for each configuration
test_config "phase1-optimized" "$configs_phase1_optimized"
test_config "phase2-lite" "$configs_phase2_lite"

# Calculate averages and generate report
log_info "Generating performance comparison report..."

echo ""
echo "Performance Comparison Results"
echo "════════════════════════════════════════════════════════════════"

declare -A avg_times
best_config=""
best_time=999999

for config_name in "phase1-optimized" "phase2-lite"; do
    if [ "${test_counts[$config_name]}" -gt 0 ]; then
        avg_time=$((total_times[$config_name] / test_counts[$config_name]))
        avg_times[$config_name]=$avg_time
        
        echo "📊 $config_name:"
        echo "   ⏱️  Average time: ${avg_time}s"
        echo "   ✅ Successful runs: ${test_counts[$config_name]}/$RUNS_PER_CONFIG"
        echo "   📁 Total time: ${total_times[$config_name]}s"
        
        if [ "$avg_time" -lt "$best_time" ]; then
            best_time=$avg_time
            best_config=$config_name
        fi
    else
        echo "❌ $config_name: All runs failed"
        avg_times[$config_name]=999999
    fi
    echo ""
done

# Calculate improvements
if [ -n "$best_config" ] && [ "${avg_times[phase1-optimized]:-999999}" -ne 999999 ] && [ "${avg_times[phase2-lite]:-999999}" -ne 999999 ]; then
    phase1_time=${avg_times[phase1-optimized]}
    phase2_time=${avg_times[phase2-lite]}
    
    if [ "$phase1_time" -gt "$phase2_time" ]; then
        improvement=$(( (phase1_time - phase2_time) * 100 / phase1_time ))
        log_success "🚀 Phase 2 Lite is ${improvement}% faster than Phase 1 Optimized"
        log_success "   Phase 1: ${phase1_time}s → Phase 2: ${phase2_time}s"
    elif [ "$phase2_time" -gt "$phase1_time" ]; then
        regression=$(( (phase2_time - phase1_time) * 100 / phase1_time ))
        log_warning "⚠️  Phase 2 Lite is ${regression}% slower than Phase 1 Optimized"
        log_warning "   Phase 1: ${phase1_time}s → Phase 2: ${phase2_time}s"
    else
        log_info "📊 Phase 1 and Phase 2 have similar performance"
    fi
fi

echo "════════════════════════════════════════════════════════════════"
log_success "🏆 Best configuration: $best_config (${best_time}s average)"

# Generate JSON summary
cat > "$RESULTS_DIR/summary.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test": "toast-component.spec.ts",
  "runsPerConfig": $RUNS_PER_CONFIG,
  "testTimeout": $TEST_TIMEOUT,
  "results": {
    "phase1-optimized": {
      "averageTime": ${avg_times[phase1-optimized]:-null},
      "totalTime": ${total_times[phase1-optimized]:-0},
      "successfulRuns": ${test_counts[phase1-optimized]:-0}
    },
    "phase2-lite": {
      "averageTime": ${avg_times[phase2-lite]:-null},
      "totalTime": ${total_times[phase2-lite]:-0},
      "successfulRuns": ${test_counts[phase2-lite]:-0}
    }
  },
  "bestConfig": "$best_config",
  "bestTime": $best_time
}
EOF

log_success "📄 Detailed results saved to: $RESULTS_DIR/"

echo ""
echo "Files generated:"
echo "  📊 $RESULTS_DIR/summary.json - Overall comparison"
echo "  📝 $RESULTS_DIR/result-*.json - Individual test results"

exit 0
