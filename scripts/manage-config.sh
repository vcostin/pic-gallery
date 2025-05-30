#!/bin/bash

# Configuration Rollback and Management Script
# This script provides easy switching between different Playwright configurations
# and rollback capabilities if optimizations cause issues.

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/.config-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Configuration mapping functions
get_config_file() {
    case "$1" in
        "original") echo "playwright.config.ts" ;;
        "optimized") echo "playwright.config.optimized.ts" ;;
        "no-auth") echo "playwright.config.no-auth.ts" ;;
        "toast-test") echo "playwright.config.toast-test.ts" ;;
        *) echo "" ;;
    esac
}

get_config_description() {
    case "$1" in
        "original") echo "Default Playwright configuration (sequential, safe)" ;;
        "optimized") echo "Performance-optimized configuration (6.6% faster, selective parallelization)" ;;
        "no-auth") echo "No-authentication testing configuration" ;;
        "toast-test") echo "Toast component testing configuration" ;;
        *) echo "Unknown configuration" ;;
    esac
}

get_all_configs() {
    echo "original optimized no-auth toast-test"
}

# Show available configurations
list_configurations() {
    log "Available Playwright configurations:"
    echo ""
    
    for config in $(get_all_configs); do
        local file=$(get_config_file "$config")
        local description=$(get_config_description "$config")
        local status="❓"
        
        if [ -f "$PROJECT_ROOT/$file" ]; then
            status="✅"
        else
            status="❌"
        fi
        
        echo -e "  $status ${YELLOW}$config${NC}: $description"
        echo -e "     File: $file"
        echo ""
    done
}

# Backup current configuration
backup_current_config() {
    local current_config="$PROJECT_ROOT/playwright.config.ts"
    
    if [ -f "$current_config" ]; then
        local backup_file="$BACKUP_DIR/playwright.config.ts.backup-$TIMESTAMP"
        cp "$current_config" "$backup_file"
        success "Current configuration backed up to: $(basename "$backup_file")"
        echo "$backup_file" > "$BACKUP_DIR/latest-backup"
        return 0
    else
        warning "No current configuration found to backup"
        return 1
    fi
}

# Switch to specific configuration
switch_configuration() {
    local target_config=$1
    local config_file=$(get_config_file "$target_config")
    
    if [ -z "$config_file" ]; then
        error "Unknown configuration: $target_config"
        echo "Available configurations:"
        for config in $(get_all_configs); do
            echo "  - $config"
        done
        return 1
    fi
    
    local source_file="$PROJECT_ROOT/$config_file"
    local target_file="$PROJECT_ROOT/playwright.config.ts"
    
    if [ ! -f "$source_file" ]; then
        error "Configuration file not found: $source_file"
        return 1
    fi
    
    log "Switching to $target_config configuration..."
    
    # Backup current configuration
    backup_current_config
    
    # Copy new configuration
    cp "$source_file" "$target_file"
    
    # Update package.json scripts if needed
    update_package_scripts "$target_config"
    
    success "Successfully switched to $target_config configuration"
    success "Description: $(get_config_description "$target_config")"
    
    return 0
}

# Update package.json scripts based on configuration
update_package_scripts() {
    local config=$1
    local package_file="$PROJECT_ROOT/package.json"
    
    if [ ! -f "$package_file" ]; then
        warning "package.json not found, skipping script updates"
        return 0
    fi
    
    log "Updating package.json scripts for $config configuration..."
    
    case "$config" in
        "optimized")
            # Ensure optimized scripts are available
            if ! grep -q "test:e2e:fast" "$package_file"; then
                warning "Optimized scripts not found in package.json"
                warning "You may need to add the optimized scripts manually"
            fi
            ;;
        "original")
            log "Using original test scripts"
            ;;
        *)
            log "No special script updates needed for $config"
            ;;
    esac
}

# Rollback to previous configuration
rollback() {
    local latest_backup_file="$BACKUP_DIR/latest-backup"
    
    if [ ! -f "$latest_backup_file" ]; then
        error "No backup found to rollback to"
        return 1
    fi
    
    local backup_file=$(cat "$latest_backup_file")
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Rolling back to previous configuration..."
    
    # Backup current state before rollback
    backup_current_config
    
    # Restore from backup
    cp "$backup_file" "$PROJECT_ROOT/playwright.config.ts"
    
    success "Successfully rolled back to previous configuration"
    return 0
}

# Validate configuration
validate_configuration() {
    local config_file="$PROJECT_ROOT/playwright.config.ts"
    
    if [ ! -f "$config_file" ]; then
        error "No active configuration found"
        return 1
    fi
    
    log "Validating current configuration..."
    
    # Run configuration validator if available
    if [ -f "$PROJECT_ROOT/scripts/validate-config.js" ]; then
        if node "$PROJECT_ROOT/scripts/validate-config.js"; then
            success "Configuration validation passed"
            return 0
        else
            error "Configuration validation failed"
            return 1
        fi
    else
        # Basic syntax check
        if node -c "$config_file"; then
            success "Configuration syntax is valid"
            return 0
        else
            error "Configuration has syntax errors"
            return 1
        fi
    fi
}

# Quick test of configuration
test_configuration() {
    local test_type=${1:-basic}
    
    log "Running quick test with current configuration..."
    
    cd "$PROJECT_ROOT"
    
    case "$test_type" in
        "basic")
            # Run a single quick test
            if npm run test:e2e:auth 2>/dev/null || npm run test:e2e -- --grep "basic" --max-failures=1; then
                success "Quick test passed"
                return 0
            else
                error "Quick test failed"
                return 1
            fi
            ;;
        "fast")
            if npm run test:e2e:fast 2>/dev/null; then
                success "Fast test passed"
                return 0
            else
                error "Fast test failed"
                return 1
            fi
            ;;
        *)
            error "Unknown test type: $test_type"
            return 1
            ;;
    esac
}

# Show current configuration status
show_status() {
    log "Configuration Status:"
    echo ""
    
    # Current active configuration
    local current_config="$PROJECT_ROOT/playwright.config.ts"
    if [ -f "$current_config" ]; then
        success "Active configuration: playwright.config.ts"
        
        # Try to identify which configuration it is
        for config in $(get_all_configs); do
            local source_file="$PROJECT_ROOT/$(get_config_file "$config")"
            if [ -f "$source_file" ] && cmp -s "$current_config" "$source_file"; then
                echo -e "  ${GREEN}Matches: $config${NC} - $(get_config_description "$config")"
                break
            fi
        done
    else
        error "No active configuration found"
    fi
    
    echo ""
    
    # Available configurations
    list_configurations
    
    # Recent backups
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo ""
        log "Recent backups:"
        ls -la "$BACKUP_DIR"/*.backup-* 2>/dev/null | tail -5 | while read line; do
            echo "  $line"
        done
    fi
}

# Clean old backups
cleanup_backups() {
    local days=${1:-7}
    
    log "Cleaning backups older than $days days..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.backup-*" -mtime +$days -delete
        success "Cleanup completed"
    else
        log "No backup directory found"
    fi
}

# Show help
show_help() {
    echo "Playwright Configuration Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  list                    List available configurations"
    echo "  switch <config>         Switch to specified configuration"
    echo "  rollback                Rollback to previous configuration"
    echo "  status                  Show current configuration status"
    echo "  validate                Validate current configuration"
    echo "  test [basic|fast]       Test current configuration"
    echo "  cleanup [days]          Clean old backups (default: 7 days)"
    echo "  help                    Show this help message"
    echo ""
    echo "Available configurations:"
    for config in $(get_all_configs); do
        echo "  - $config"
    done
    echo ""
    echo "Examples:"
    echo "  $0 switch optimized     # Switch to optimized configuration"
    echo "  $0 rollback            # Rollback to previous configuration"
    echo "  $0 test fast           # Test current configuration with fast mode"
    echo ""
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    case "${1:-help}" in
        "list")
            list_configurations
            ;;
        "switch")
            if [ -z "${2:-}" ]; then
                error "Configuration name required"
                echo "Use: $0 list to see available configurations"
                exit 1
            fi
            switch_configuration "$2"
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "validate")
            validate_configuration
            ;;
        "test")
            test_configuration "${2:-basic}"
            ;;
        "cleanup")
            cleanup_backups "${2:-7}"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
