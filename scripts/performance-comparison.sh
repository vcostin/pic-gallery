#!/bin/bash

# Performance Comparison Tool - Phase 1 vs Phase 2 Optimizations
# Measures and compares performance improvements between optimization phases

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/performance-comparison"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Check dependencies
check_dependencies() {
    local deps=("node" "npx" "bc")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency '$dep' is not installed"
            exit 1
        fi
    done
}

# Create results directory
setup_results_dir() {
    mkdir -p "$RESULTS_DIR"
    cd "$PROJECT_ROOT"
}

# Run performance test for a specific configuration
run_performance_test() {
    local config_name=$1
    local config_file=$2
    local description=$3
    local runs=${4:-3}
    
    log_info "Testing $config_name configuration..."
    log_info "Description: $description"
    
    local total_time=0
    local test_count=0
    local results_file="$RESULTS_DIR/${config_name}-results.json"
    
    # Create results array
    echo "[]" > "$results_file"
    
    for ((i=1; i<=runs; i++)); do
        log_info "Run $i/$runs for $config_name..."
        
        # Start timer
        local start_time=$(date +%s)
        
        # Run the test
        if PLAYWRIGHT_PERF_LOG=true npx playwright test --config="$config_file" > "/tmp/test-output-$config_name-$i.log" 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            total_time=$((total_time + duration))
            test_count=$((test_count + 1))
            
            # Extract test count from output
            local tests_executed=$(grep -o "[0-9]\+ passed" "/tmp/test-output-$config_name-$i.log" | head -1 | grep -o "[0-9]\+" || echo "0")
            
            # Add result to JSON
            local result=$(cat "$results_file")
            echo "$result" | node -e "
                const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
                data.push({
                    run: $i,
                    duration: $duration,
                    testsExecuted: $tests_executed,
                    timestamp: new Date().toISOString()
                });
                console.log(JSON.stringify(data, null, 2));
            " > "$results_file"
            
            log_success "Run $i completed in ${duration}ms"
        else
            log_error "Run $i failed"
        fi
        
        # Cleanup between runs
        sleep 2
    done
    
    if [ $test_count -gt 0 ]; then
        local avg_time=$((total_time / test_count))
        log_success "$config_name average time: ${avg_time}ms ($test_count successful runs)"
        
        # Update results with summary
        local result=$(cat "$results_file")
        echo "$result" | node -e "
            const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
            const summary = {
                configName: '$config_name',
                description: '$description',
                totalRuns: $runs,
                successfulRuns: $test_count,
                averageTime: $avg_time,
                totalTime: $total_time,
                results: data
            };
            console.log(JSON.stringify(summary, null, 2));
        " > "$results_file"
        
        return 0
    else
        log_error "All runs failed for $config_name"
        return 1
    fi
}

# Compare results and generate report
generate_comparison_report() {
    log_info "Generating performance comparison report..."
    
    local report_file="$RESULTS_DIR/performance-comparison-report.json"
    local html_report="$RESULTS_DIR/performance-comparison-report.html"
    
    # Collect all result files
    local result_files=($(find "$RESULTS_DIR" -name "*-results.json" -type f))
    
    if [ ${#result_files[@]} -eq 0 ]; then
        log_error "No result files found"
        return 1
    fi
    
    # Generate JSON report
    node -e "
        const fs = require('fs');
        const path = require('path');
        
        const resultFiles = [$(printf "'%s'," "${result_files[@]}" | sed 's/,$//')]
        const results = [];
        
        for (const file of resultFiles) {
            try {
                const content = JSON.parse(fs.readFileSync(file, 'utf8'));
                results.push(content);
            } catch (error) {
                console.error('Error reading', file, error.message);
            }
        }
        
        // Calculate improvements
        const baseline = results.find(r => r.configName === 'original');
        const improvements = results.map(result => {
            const improvement = baseline ? 
                ((baseline.averageTime - result.averageTime) / baseline.averageTime * 100).toFixed(2) :
                0;
            return { ...result, improvementPercent: parseFloat(improvement) };
        });
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalConfigurations: results.length,
                baselineTime: baseline ? baseline.averageTime : 0,
                bestTime: Math.min(...results.map(r => r.averageTime)),
                maxImprovement: Math.max(...improvements.map(r => r.improvementPercent))
            },
            configurations: improvements.sort((a, b) => a.averageTime - b.averageTime)
        };
        
        fs.writeFileSync('$report_file', JSON.stringify(report, null, 2));
        console.log('Report generated:', '$report_file');
    "
    
    # Generate HTML report
    cat > "$html_report" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Performance Comparison Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; text-align: center; margin-bottom: 40px; }
        .summary { background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #059669; }
        .metric-label { color: #6b7280; font-size: 0.9em; }
        .config-card { border: 1px solid #e5e7eb; border-radius: 6px; margin: 15px 0; padding: 20px; }
        .config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .config-name { font-size: 1.2em; font-weight: bold; }
        .improvement { padding: 5px 12px; border-radius: 20px; font-weight: bold; }
        .improvement.positive { background: #dcfce7; color: #166534; }
        .improvement.negative { background: #fef2f2; color: #dc2626; }
        .improvement.neutral { background: #f3f4f6; color: #374151; }
        .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .result-item { background: #f9fafb; padding: 15px; border-radius: 4px; text-align: center; }
        .chart { margin: 20px 0; height: 300px; background: #f9fafb; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 E2E Performance Comparison Report</h1>
        
        <div class="summary">
            <h2>Performance Summary</h2>
            <div id="summary-content">Loading...</div>
        </div>
        
        <div id="configurations">Loading configurations...</div>
        
        <div class="chart">
            📊 Performance Chart (Implementation pending)
        </div>
    </div>
    
    <script>
        fetch('./performance-comparison-report.json')
            .then(response => response.json())
            .then(data => {
                // Update summary
                const summaryEl = document.getElementById('summary-content');
                summaryEl.innerHTML = `
                    <div class="metric">
                        <div class="metric-value">${data.configurations.length}</div>
                        <div class="metric-label">Configurations Tested</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${Math.round(data.summary.baselineTime)}ms</div>
                        <div class="metric-label">Baseline Time</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${Math.round(data.summary.bestTime)}ms</div>
                        <div class="metric-label">Best Time</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.summary.maxImprovement}%</div>
                        <div class="metric-label">Max Improvement</div>
                    </div>
                `;
                
                // Update configurations
                const configsEl = document.getElementById('configurations');
                configsEl.innerHTML = '<h2>Configuration Results</h2>' + 
                    data.configurations.map(config => {
                        const improvementClass = config.improvementPercent > 0 ? 'positive' : 
                                               config.improvementPercent < 0 ? 'negative' : 'neutral';
                        const improvementText = config.improvementPercent > 0 ? 
                                              `+${config.improvementPercent}% faster` :
                                              config.improvementPercent < 0 ?
                                              `${Math.abs(config.improvementPercent)}% slower` :
                                              'No change';
                        
                        return `
                            <div class="config-card">
                                <div class="config-header">
                                    <div class="config-name">${config.configName}</div>
                                    <div class="improvement ${improvementClass}">${improvementText}</div>
                                </div>
                                <div class="config-description">${config.description}</div>
                                <div class="results-grid">
                                    <div class="result-item">
                                        <div style="font-weight: bold;">${Math.round(config.averageTime)}ms</div>
                                        <div style="color: #6b7280; font-size: 0.8em;">Average Time</div>
                                    </div>
                                    <div class="result-item">
                                        <div style="font-weight: bold;">${config.successfulRuns}/${config.totalRuns}</div>
                                        <div style="color: #6b7280; font-size: 0.8em;">Success Rate</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
            })
            .catch(error => {
                console.error('Error loading report data:', error);
                document.getElementById('summary-content').innerHTML = 'Error loading data';
                document.getElementById('configurations').innerHTML = 'Error loading configurations';
            });
    </script>
</body>
</html>
EOF
    
    log_success "HTML report generated: $html_report"
    
    # Display summary
    if [ -f "$report_file" ]; then
        echo ""
        log_info "Performance Comparison Summary"
        echo "════════════════════════════════════════════════════════════════"
        
        node -e "
            const data = JSON.parse(require('fs').readFileSync('$report_file', 'utf8'));
            console.log('📊 Configurations tested:', data.summary.totalConfigurations);
            console.log('⏱️  Baseline time:', Math.round(data.summary.baselineTime) + 'ms');
            console.log('🚀 Best time:', Math.round(data.summary.bestTime) + 'ms');
            console.log('📈 Maximum improvement:', data.summary.maxImprovement + '%');
            console.log('');
            console.log('Configuration Rankings:');
            data.configurations.forEach((config, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                const improvement = config.improvementPercent > 0 ? 
                    '+' + config.improvementPercent + '% faster' :
                    config.improvementPercent < 0 ?
                    Math.abs(config.improvementPercent) + '% slower' :
                    'baseline';
                console.log(\`\${medal} \${config.configName}: \${Math.round(config.averageTime)}ms (\${improvement})\`);
            });
        "
        
        echo "════════════════════════════════════════════════════════════════"
        echo ""
    fi
}

# Show help
show_help() {
    cat << EOF
Performance Comparison Tool - E2E Test Optimization Analysis

USAGE:
    bash scripts/performance-comparison.sh [options]

OPTIONS:
    --configs LIST      Comma-separated list of configs to test (default: original,optimized,phase2)
    --runs NUM         Number of test runs per configuration (default: 3)
    --baseline CONFIG  Configuration to use as baseline (default: original)
    --output DIR       Output directory for results (default: performance-comparison)
    --quick            Quick test with 1 run per config
    --full             Full test with 5 runs per config
    --help, -h         Show this help message

EXAMPLES:
    # Standard comparison
    bash scripts/performance-comparison.sh

    # Quick comparison
    bash scripts/performance-comparison.sh --quick

    # Compare specific configurations
    bash scripts/performance-comparison.sh --configs "original,optimized,phase2" --runs 5

EOF
}

# Main execution
main() {
    # Default values
    local configs="original,optimized,phase2"
    local runs=3
    local baseline="original"
    local quick_mode=false
    local full_mode=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --configs)
                configs="$2"
                shift 2
                ;;
            --runs)
                runs="$2"
                shift 2
                ;;
            --baseline)
                baseline="$2"
                shift 2
                ;;
            --output)
                RESULTS_DIR="$2"
                shift 2
                ;;
            --quick)
                quick_mode=true
                runs=1
                shift
                ;;
            --full)
                full_mode=true
                runs=5
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Initialize
    check_dependencies
    setup_results_dir
    
    log_info "Starting E2E Performance Comparison"
    log_info "Configurations: $configs"
    log_info "Runs per config: $runs"
    log_info "Results directory: $RESULTS_DIR"
    
    # Convert comma-separated configs to array
    IFS=',' read -ra CONFIG_ARRAY <<< "$configs"
    
    # Run tests for each configuration
    local successful_tests=0
    for config in "${CONFIG_ARRAY[@]}"; do
        case $config in
            "original")
                if run_performance_test "original" "playwright.config.ts" "Default Playwright configuration (sequential, safe)" "$runs"; then
                    successful_tests=$((successful_tests + 1))
                fi
                ;;
            "optimized")
                if run_performance_test "optimized" "playwright.config.optimized.ts" "Phase 1 optimized configuration (6.6% faster, selective parallelization)" "$runs"; then
                    successful_tests=$((successful_tests + 1))
                fi
                ;;
            "phase2")
                if run_performance_test "phase2" "playwright.config.phase2.ts" "Phase 2 advanced optimizations (test sharding, browser pooling)" "$runs"; then
                    successful_tests=$((successful_tests + 1))
                fi
                ;;
            *)
                log_warning "Unknown configuration: $config"
                ;;
        esac
    done
    
    # Generate report if we have results
    if [ $successful_tests -gt 0 ]; then
        generate_comparison_report
        log_success "Performance comparison completed successfully!"
        log_info "Results saved to: $RESULTS_DIR"
        log_info "Open $RESULTS_DIR/performance-comparison-report.html in a browser to view the report"
    else
        log_error "No successful test runs completed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
