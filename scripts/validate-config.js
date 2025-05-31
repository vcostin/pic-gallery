#!/usr/bin/env node

/**
 * Playwright Configuration Validator
 * 
 * This script validates the optimized Playwright configuration before running tests.
 * It catches common configuration errors and ensures environment variables are set correctly.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironment() {
  log('\n🔍 Validating environment configuration...', colors.blue);
  
  const checks = [];
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    checks.push({ name: 'Node.js version', status: 'pass', value: nodeVersion });
  } else {
    checks.push({ name: 'Node.js version', status: 'fail', value: nodeVersion, error: 'Node.js 16+ required' });
  }
  
  // Check environment variables
  const envVars = [
    { name: 'PLAYWRIGHT_FAST_MODE', required: false, description: 'Enables fast parallel execution' },
    { name: 'PLAYWRIGHT_SHARED_DATA', required: false, description: 'Enables data sharing between tests' },
    { name: 'PLAYWRIGHT_PERF_LOG', required: false, description: 'Enables performance logging' },
    { name: 'PLAYWRIGHT_DEBUG', required: false, description: 'Enables debug mode' },
    { name: 'CI', required: false, description: 'CI environment detection' },
    { name: 'NODE_ENV', required: false, description: 'Node environment setting' }
  ];
  
  envVars.forEach(envVar => {
    const value = process.env[envVar.name];
    if (value !== undefined) {
      checks.push({ 
        name: `ENV: ${envVar.name}`, 
        status: 'pass', 
        value: value,
        description: envVar.description
      });
    } else if (envVar.required) {
      checks.push({ 
        name: `ENV: ${envVar.name}`, 
        status: 'fail', 
        value: 'undefined',
        error: 'Required environment variable missing'
      });
    } else {
      checks.push({ 
        name: `ENV: ${envVar.name}`, 
        status: 'info', 
        value: 'undefined',
        description: envVar.description
      });
    }
  });
  
  return checks;
}

function validateFiles() {
  log('\n📁 Validating required files...', colors.blue);
  
  const checks = [];
  const requiredFiles = [
    'playwright.config.optimized.ts',
    'e2e-tests/test-helpers.optimized.ts',
    'e2e-tests/global-setup.ts',
    'e2e-tests/global-teardown.ts',
    'package.json',
    '.env'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      checks.push({ name: `File: ${file}`, status: 'pass', value: 'exists' });
    } else {
      checks.push({ name: `File: ${file}`, status: 'warn', value: 'missing', error: 'Optional file not found' });
    }
  });
  
  return checks;
}

function validatePackageJson() {
  log('\n📦 Validating package.json scripts...', colors.blue);
  
  const checks = [];
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    return [{ name: 'package.json', status: 'fail', value: 'missing', error: 'package.json not found' }];
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredScripts = [
      'test:e2e:fast',
      'test:e2e:parallel', 
      'test:e2e:profile',
      'test:e2e'
    ];
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        checks.push({ name: `Script: ${script}`, status: 'pass', value: 'defined' });
      } else {
        checks.push({ name: `Script: ${script}`, status: 'warn', value: 'missing', error: 'Recommended script not found' });
      }
    });
    
    // Check for Playwright dependency
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (dependencies['@playwright/test']) {
      checks.push({ name: 'Playwright dependency', status: 'pass', value: dependencies['@playwright/test'] });
    } else {
      checks.push({ name: 'Playwright dependency', status: 'fail', value: 'missing', error: '@playwright/test not found' });
    }
    
  } catch (error) {
    checks.push({ name: 'package.json parsing', status: 'fail', value: 'error', error: error.message });
  }
  
  return checks;
}

function validatePlaywrightConfig() {
  log('\n⚙️ Validating Playwright configuration...', colors.blue);
  
  const checks = [];
  const configPath = path.join(process.cwd(), 'playwright.config.optimized.ts');
  
  if (!fs.existsSync(configPath)) {
    return [{ name: 'Optimized config', status: 'fail', value: 'missing', error: 'playwright.config.optimized.ts not found' }];
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for key optimizations
    const optimizations = [
      { name: 'Environment detection', pattern: /isCI.*=.*process\.env\.CI/i },
      { name: 'Performance config helper', pattern: /getPerformanceConfig/i },
      { name: 'Performance monitoring', pattern: /performanceStartTime/i },
      { name: 'Selective parallelization', pattern: /fullyParallel.*isFastMode/i },
      { name: 'Environment-aware workers', pattern: /workers.*perfConfig\.workers/i },
      { name: 'CI-specific timeouts', pattern: /timeout.*isCI/i },
      { name: 'Browser optimizations', pattern: /--disable-dev-shm-usage/i },
      { name: 'Project dependencies', pattern: /dependencies.*\[/i }
    ];
    
    optimizations.forEach(opt => {
      if (opt.pattern.test(configContent)) {
        checks.push({ name: opt.name, status: 'pass', value: 'implemented' });
      } else {
        checks.push({ name: opt.name, status: 'warn', value: 'missing', error: 'Optimization not found' });
      }
    });
    
  } catch (error) {
    checks.push({ name: 'Config parsing', status: 'fail', value: 'error', error: error.message });
  }
  
  return checks;
}

function printResults(title, checks) {
  log(`\n${colors.bold}${title}${colors.reset}`);
  log('─'.repeat(50));
  
  checks.forEach(check => {
    let statusColor, statusSymbol;
    
    switch (check.status) {
      case 'pass':
        statusColor = colors.green;
        statusSymbol = '✅';
        break;
      case 'fail':
        statusColor = colors.red;
        statusSymbol = '❌';
        break;
      case 'warn':
        statusColor = colors.yellow;
        statusSymbol = '⚠️';
        break;
      case 'info':
        statusColor = colors.blue;
        statusSymbol = 'ℹ️';
        break;
      default:
        statusColor = colors.reset;
        statusSymbol = '❓';
    }
    
    const name = check.name.padEnd(25);
    const value = check.value || '';
    const description = check.description ? ` (${check.description})` : '';
    const error = check.error ? ` - ${check.error}` : '';
    
    log(`${statusSymbol} ${statusColor}${name}${colors.reset} ${value}${description}${error}`);
  });
}

function main() {
  log(`${colors.bold}🔧 Playwright Configuration Validator${colors.reset}`, colors.blue);
  log('═'.repeat(50));
  
  const allChecks = [
    { title: 'Environment Configuration', checks: validateEnvironment() },
    { title: 'File System', checks: validateFiles() },
    { title: 'Package Configuration', checks: validatePackageJson() },
    { title: 'Playwright Configuration', checks: validatePlaywrightConfig() }
  ];
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let warningChecks = 0;
  
  allChecks.forEach(({ title, checks }) => {
    printResults(title, checks);
    
    checks.forEach(check => {
      totalChecks++;
      switch (check.status) {
        case 'pass': passedChecks++; break;
        case 'fail': failedChecks++; break;
        case 'warn': warningChecks++; break;
      }
    });
  });
  
  // Summary
  log(`\n${colors.bold}📊 Validation Summary${colors.reset}`);
  log('═'.repeat(30));
  log(`${colors.green}✅ Passed: ${passedChecks}${colors.reset}`);
  log(`${colors.yellow}⚠️ Warnings: ${warningChecks}${colors.reset}`);
  log(`${colors.red}❌ Failed: ${failedChecks}${colors.reset}`);
  log(`📝 Total: ${totalChecks}`);
  
  // Performance recommendations
  if (process.env.PLAYWRIGHT_FAST_MODE !== 'true') {
    log(`\n${colors.yellow}💡 Performance Tip: Set PLAYWRIGHT_FAST_MODE=true for optimized execution${colors.reset}`);
  }
  
  if (process.env.PLAYWRIGHT_PERF_LOG !== 'true') {
    log(`${colors.yellow}💡 Monitoring Tip: Set PLAYWRIGHT_PERF_LOG=true to enable performance logging${colors.reset}`);
  }
  
  // Exit code
  if (failedChecks > 0) {
    log(`\n${colors.red}❌ Validation failed with ${failedChecks} errors${colors.reset}`);
    process.exit(1);
  } else if (warningChecks > 0) {
    log(`\n${colors.yellow}⚠️ Validation completed with ${warningChecks} warnings${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.green}✅ All validations passed! Configuration is optimal.${colors.reset}`);
    process.exit(0);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, validateFiles, validatePackageJson, validatePlaywrightConfig };
