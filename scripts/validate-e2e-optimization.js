#!/usr/bin/env node

/**
 * E2E Optimization Validation Script
 * 
 * This script validates the E2E optimization setup and provides
 * performance benchmarks for different optimization modes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 E2E Optimization System Validation');
console.log('═══════════════════════════════════════\n');

// Check if required files exist
const requiredFiles = [
  'playwright.config.optimized.ts',
  'e2e-tests/enhanced-wait-helpers.ts',
  'e2e-tests/test-performance-metrics.ts',
  'e2e-tests/optimized-test-data-factory.ts',
  'e2e-tests/optimized-test-session.ts',
  'e2e-tests/performance-reporter.ts'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Missing required files. Please ensure all optimization files are present.');
  process.exit(1);
}

// Check TypeScript compilation for optimization files only
console.log('\n🔧 Checking TypeScript compilation for optimization files...');
try {
  const optimizationFiles = [
    'playwright.config.optimized.ts',
    'e2e-tests/performance-reporter.ts',
    'e2e-tests/test-performance-metrics.ts',
    'e2e-tests/optimized-test-data-factory.ts',
    'e2e-tests/optimized-test-session.ts'
  ].join(' ');
  
  execSync(`npx tsc --noEmit ${optimizationFiles}`, { stdio: 'pipe' });
  console.log('   ✅ Optimization files TypeScript compilation successful');
} catch (error) {
  console.log('   ❌ Optimization files TypeScript compilation failed');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Validate Playwright config
console.log('\n⚙️  Validating Playwright configurations...');
try {
  execSync('npx playwright test --list --config=playwright.config.optimized.ts', { stdio: 'pipe' });
  console.log('   ✅ Optimized config valid');
} catch (error) {
  console.log('   ❌ Optimized config invalid');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Check npm scripts
console.log('\n📜 Checking npm scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'test:e2e:fast',
  'test:e2e:optimized', 
  'test:e2e:perf',
  'test:e2e:parallel'
];

requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`   ${exists ? '✅' : '❌'} ${script}`);
});

// Performance benchmark (if requested)
if (process.argv.includes('--benchmark')) {
  console.log('\n🏁 Running performance benchmark...');
  console.log('   This will run a subset of tests in different modes');
  
  const benchmarkTests = [
    'e2e-tests/optimized-gallery-workflow.spec.ts'
  ];
  
  const modes = [
    { name: 'Standard', env: {}, suffix: '' },
    { name: 'Fast', env: { PLAYWRIGHT_FAST: 'true' }, suffix: ':fast' },
    { name: 'Optimized', env: { PLAYWRIGHT_OPTIMIZED: 'true' }, suffix: ':optimized' }
  ];
  
  console.log('\n   Mode         | Duration | Status');
  console.log('   -------------|----------|--------');
  
  modes.forEach(mode => {
    try {
      const start = Date.now();
      const env = { ...process.env, ...mode.env };
      
      execSync(`npm run test:e2e${mode.suffix} -- --grep="should create gallery"`, {
        stdio: 'pipe',
        env: env,
        timeout: 60000
      });
      
      const duration = Date.now() - start;
      console.log(`   ${mode.name.padEnd(12)} | ${(duration/1000).toFixed(1)}s    | ✅ Pass`);
    } catch (error) {
      console.log(`   ${mode.name.padEnd(12)} | --       | ❌ Fail`);
    }
  });
}

console.log('\n✅ E2E Optimization System Validation Complete!');
console.log('\n🚀 Quick Start:');
console.log('   npm run test:e2e:fast      # Fast mode (development)');
console.log('   npm run test:e2e:optimized # Optimized mode (CI/CD)');
console.log('   npm run test:e2e:perf      # Performance monitoring');
console.log('\n📖 See docs/E2E_OPTIMIZATION_GUIDE.md for detailed usage');
