#!/bin/bash

# Phase 2 Test Execution - Advanced Performance Optimization
# Implements test sharding, browser pooling, and parallel execution

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_SHARD_COUNT=2
DEFAULT_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✅ $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ⚠️  $1"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${NC} ❌ $1"
}

# Display help
show_help() {
    cat << EOF
Phase 2 Performance Optimization - Test Sharding Execution

USAGE:
    bash scripts/phase2-execution.sh [options]

OPTIONS:
    --shards NUM        Number of shards to use (default: $DEFAULT_SHARD_COUNT)
    --timeout SECONDS   Timeout per shard in seconds (default: $DEFAULT_TIMEOUT)
    --fast             Enable fast mode optimizations
    --profile          Enable performance profiling
    --dry-run          Show what would be executed without running
    --help, -h         Show this help message

ENVIRONMENT VARIABLES:
    PLAYWRIGHT_FAST_MODE       Enable fast execution mode
    PLAYWRIGHT_PERF_LOG        Enable performance logging
    PLAYWRIGHT_POOL_SIZE       Browser pool size (default: 3)
    PLAYWRIGHT_HEADED          Run with headed browsers
    CI                         CI environment detection

EXAMPLES:
    # Standard execution with 2 shards
    bash scripts/phase2-execution.sh

    # Fast execution with 4 shards
    bash scripts/phase2-execution.sh --shards 4 --fast

    # Performance profiling
    bash scripts/phase2-execution.sh --profile

EOF
}

# Parse command line arguments
SHARD_COUNT="$DEFAULT_SHARD_COUNT"
TIMEOUT="$DEFAULT_TIMEOUT"
FAST_MODE=false
PROFILE_MODE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --shards)
            SHARD_COUNT="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --fast)
            FAST_MODE=true
            shift
            ;;
        --profile)
            PROFILE_MODE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate inputs
if ! [[ "$SHARD_COUNT" =~ ^[0-9]+$ ]] || [ "$SHARD_COUNT" -lt 1 ] || [ "$SHARD_COUNT" -gt 8 ]; then
    log_error "Shard count must be a number between 1 and 8"
    exit 1
fi

if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]] || [ "$TIMEOUT" -lt 60 ]; then
    log_error "Timeout must be at least 60 seconds"
    exit 1
fi

# Environment setup
cd "$PROJECT_ROOT"

export PLAYWRIGHT_SHARD_COUNT="$SHARD_COUNT"
export PLAYWRIGHT_POOL_SIZE="${PLAYWRIGHT_POOL_SIZE:-3}"

if [ "$FAST_MODE" = true ]; then
    export PLAYWRIGHT_FAST_MODE="true"
fi

if [ "$PROFILE_MODE" = true ]; then
    export PLAYWRIGHT_PERF_LOG="true"
fi

# Create results directory
mkdir -p test-results

# Display configuration
log_info "Phase 2 Test Execution Configuration"
echo "══════════════════════════════════════════════════"
echo "🔧 Shard count:      $SHARD_COUNT"
echo "⏱️  Timeout:          ${TIMEOUT}s per shard"
echo "🏃 Fast mode:        $([ "$FAST_MODE" = true ] && echo "✅ Enabled" || echo "❌ Disabled")"
echo "📊 Profile mode:     $([ "$PROFILE_MODE" = true ] && echo "✅ Enabled" || echo "❌ Disabled")"
echo "🌐 Browser pool:     ${PLAYWRIGHT_POOL_SIZE} instances"
echo "🖥️  Environment:      $([ -n "${CI:-}" ] && echo "CI" || echo "Local")"
echo "══════════════════════════════════════════════════"

if [ "$DRY_RUN" = true ]; then
    log_info "DRY RUN - Commands that would be executed:"
    for ((i=0; i<SHARD_COUNT; i++)); do
        echo "  Shard $((i+1)): PLAYWRIGHT_SHARD_INDEX=$i npx playwright test --config=playwright.config.phase2.ts"
    done
    exit 0
fi

# Function to run a single shard
run_shard() {
    local shard_index=$1
    local shard_number=$((shard_index + 1))
    
    log_info "Starting shard $shard_number/$SHARD_COUNT..."
    
    # Set shard-specific environment
    export PLAYWRIGHT_SHARD_INDEX="$shard_index"
    
    # Create shard-specific log file
    local log_file="test-results/shard-${shard_index}.log"
    
    # Run the shard with timeout using background process
    npx playwright test --config=playwright.config.phase2-lite.ts > "$log_file" 2>&1 &
    local test_pid=$!
    
    # Wait for the test with timeout
    local count=0
    while kill -0 $test_pid 2>/dev/null && [ $count -lt $TIMEOUT ]; do
        sleep 1
        count=$((count + 1))
    done
    
    if kill -0 $test_pid 2>/dev/null; then
        # Process is still running, kill it
        kill -TERM $test_pid 2>/dev/null
        sleep 2
        kill -KILL $test_pid 2>/dev/null
        log_error "Shard $shard_number timed out after ${TIMEOUT}s"
        return 124
    else
        # Process completed, check exit status
        wait $test_pid
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            log_success "Shard $shard_number completed successfully"
            return 0
        else
            log_error "Shard $shard_number failed with exit code $exit_code"
            # Show last few lines of log for debugging
            if [ -f "$log_file" ]; then
                log_warning "Last 5 lines from shard $shard_number log:"
                tail -5 "$log_file" | sed 's/^/    /'
            fi
            return $exit_code
        fi
    fi
}

# Pre-execution validation
log_info "Validating Phase 2 configuration..."
if ! node scripts/validate-config.js > /dev/null 2>&1; then
    log_error "Configuration validation failed"
    exit 1
fi
log_success "Configuration validation passed"

# Start execution timer
EXECUTION_START=$(date +%s)

# Execute shards in parallel
log_info "Starting Phase 2 test execution with $SHARD_COUNT shards..."

# Array to store background process PIDs
declare -a shard_pids=()
declare -a shard_results=()

# Start all shards in parallel
for ((i=0; i<SHARD_COUNT; i++)); do
    run_shard $i &
    shard_pids[$i]=$!
done

# Wait for all shards to complete
failed_shards=0
for ((i=0; i<SHARD_COUNT; i++)); do
    shard_number=$((i + 1))
    
    if wait ${shard_pids[$i]}; then
        shard_results[$i]="✅ PASSED"
        log_success "Shard $shard_number completed"
    else
        shard_results[$i]="❌ FAILED"
        failed_shards=$((failed_shards + 1))
        log_error "Shard $shard_number failed"
    fi
done

# Calculate execution time
EXECUTION_END=$(date +%s)
EXECUTION_TIME=$((EXECUTION_END - EXECUTION_START))

# Generate summary report
log_info "Phase 2 Execution Summary"
echo "══════════════════════════════════════════════════"
echo "⏱️  Total execution time: ${EXECUTION_TIME}s"
echo "🎯 Shards executed: $SHARD_COUNT"
echo "✅ Successful shards: $((SHARD_COUNT - failed_shards))"
echo "❌ Failed shards: $failed_shards"
echo ""

for ((i=0; i<SHARD_COUNT; i++)); do
    echo "   Shard $((i + 1)): ${shard_results[$i]}"
done

echo "══════════════════════════════════════════════════"

# Collect and merge reports
if command -v npx &> /dev/null; then
    log_info "Merging shard reports..."
    
    # Merge HTML reports if they exist
    if ls playwright-report-shard-* 1> /dev/null 2>&1; then
        mkdir -p playwright-report-phase2
        for shard_report in playwright-report-shard-*; do
            if [ -d "$shard_report" ]; then
                cp -r "$shard_report"/* playwright-report-phase2/ 2>/dev/null || true
            fi
        done
        log_success "Reports merged into playwright-report-phase2/"
    fi
    
    # Merge JUnit reports
    if ls test-results/junit-shard-*.xml 1> /dev/null 2>&1; then
        cat test-results/junit-shard-*.xml > test-results/junit-phase2-merged.xml 2>/dev/null || true
        log_success "JUnit reports merged"
    fi
fi

# Performance analysis
if [ "$PROFILE_MODE" = true ] && [ -f "test-results/phase2-performance-report.json" ]; then
    log_info "Performance analysis available in test-results/phase2-performance-report.json"
fi

# Exit with appropriate code
if [ $failed_shards -eq 0 ]; then
    log_success "🎉 All shards completed successfully! Phase 2 optimization executed in ${EXECUTION_TIME}s"
    exit 0
else
    log_error "❌ $failed_shards out of $SHARD_COUNT shards failed"
    exit 1
fi
