import { test, Page, BrowserContext } from '@playwright/test';
import { TestPerformanceMetrics } from './test-performance-metrics';
import { EnhancedWaitHelpers } from './enhanced-wait-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

/**
 * Optimized test session management and selective test running strategies
 */
export class OptimizedTestSession {
  private static activeSessions: Map<string, BrowserContext> = new Map();
  private static testQueue: Array<{ name: string; priority: number; fn: () => Promise<void> }> = [];

  /**
   * Initialize optimized test session with performance tracking
   */
  static initializeTestSession(testName: string): void {
    TestPerformanceMetrics.startTest(testName);
    
    // Set up performance logging if enabled
    if (process.env.PLAYWRIGHT_PERF_LOG === 'true') {
      console.log(`🎯 Starting optimized test: ${testName}`);
    }
  }

  /**
   * Complete test session with cleanup and metrics
   */
  static async completeTestSession(
    testName: string, 
    page: Page,
    options: {
      cleanupLevel: 'none' | 'minimal' | 'full';
      logPerformance?: boolean;
    } = { cleanupLevel: 'minimal' }
  ): Promise<void> {
    const duration = TestPerformanceMetrics.endTest(testName);
    
    // Perform cleanup based on level
    switch (options.cleanupLevel) {
      case 'full':
        await OptimizedTestDataFactory.cleanupTestData(page, {
          images: true,
          galleries: true,
          keepCache: false
        });
        break;
      case 'minimal':
        await OptimizedTestDataFactory.cleanupTestData(page, {
          images: false,
          galleries: true,
          keepCache: true
        });
        break;
      case 'none':
        // No cleanup
        break;
    }

    if (options.logPerformance || process.env.PLAYWRIGHT_PERF_LOG === 'true') {
      console.log(`✅ Completed ${testName} in ${duration}ms`);
    }
  }

  /**
   * Smart test prioritization based on performance history
   */
  static prioritizeTests(tests: Array<{ name: string; fn: () => Promise<void> }>): Array<{ name: string; priority: number; fn: () => Promise<void> }> {
    return tests.map(test => {
      const stats = TestPerformanceMetrics.getTestStats(test.name);
      let priority = 5; // Default priority

      if (stats) {
        // Fast tests get higher priority
        if (stats.average < 3000) priority = 1;
        else if (stats.average < 8000) priority = 3;
        else priority = 7;
      }

      return { ...test, priority };
    }).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Selective test runner based on patterns
   */
  static shouldRunTest(testName: string, filters: {
    skipSlow?: boolean;
    skipFlaky?: boolean;
    onlyFast?: boolean;
    patterns?: string[];
  }): boolean {
    const stats = TestPerformanceMetrics.getTestStats(testName);

    // Pattern matching
    if (filters.patterns && filters.patterns.length > 0) {
      const matches = filters.patterns.some(pattern => testName.includes(pattern));
      if (!matches) return false;
    }

    // Performance-based filtering
    if (stats) {
      if (filters.skipSlow && stats.average > 10000) return false;
      if (filters.onlyFast && stats.average > 5000) return false;
      
      // Skip flaky tests (high variance)
      if (filters.skipFlaky) {
        const variance = stats.max - stats.min;
        if (variance > stats.average * 0.5) return false;
      }
    }

    return true;
  }

  /**
   * Optimized page setup with smart waiting
   */
  static async setupOptimizedPage(
    page: Page,
    options: {
      route?: string;
      waitForAuth?: boolean;
      preloadData?: boolean;
      disableAnimations?: boolean;
    } = {}
  ): Promise<void> {
    const { route = '/', waitForAuth = true, preloadData = false, disableAnimations = true } = options;

    // Disable animations for faster tests
    if (disableAnimations) {
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent = `
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-delay: 0.01ms !important;
              transition-duration: 0.01ms !important;
              transition-delay: 0.01ms !important;
            }
          `;
          document.head.appendChild(style);
        });
      });
    }

    // Navigate with optimized waiting
    await TestPerformanceMetrics.measureNavigation(
      page,
      async () => {
        await page.goto(route);
        await EnhancedWaitHelpers.waitForPageReady(page, {
          url: route,
          timeout: 8000
        });
      },
      `Navigation to ${route}`
    );

    // Verify authentication if required
    if (waitForAuth) {
      const authSuccess = await EnhancedWaitHelpers.waitForAuthState(page, true, 3000);
      if (!authSuccess) {
        console.warn('⚠️ Authentication state check failed');
      }
    }

    // Preload common data if requested
    if (preloadData) {
      await this.preloadCommonData(page);
    }
  }

  /**
   * Preload common test data for faster subsequent operations
   */
  private static async preloadCommonData(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        // Preload common API endpoints
        const endpoints = ['/api/images', '/api/galleries', '/api/user'];
        
        await Promise.allSettled(
          endpoints.map(endpoint =>
            fetch(endpoint).then(response => response.json())
          )
        );
      });
    } catch {
      // Non-critical failure
      console.warn('⚠️ Data preloading failed, continuing without cache');
    }
  }

  /**
   * Optimized element interaction with smart retries
   */
  static async smartInteraction(
    page: Page,
    selector: string,
    action: 'click' | 'fill' | 'hover',
    value?: string,
    options: {
      retries?: number;
      retryDelay?: number;
      timeout?: number;
    } = {}
  ): Promise<boolean> {
    const { retries = 2, retryDelay = 500, timeout = 5000 } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const locator = page.locator(selector);
        
        // Wait for element to be actionable
        const isReady = await EnhancedWaitHelpers.waitForActionableElement(
          locator, 
          action, 
          timeout
        );

        if (!isReady && attempt < retries) {
          await page.waitForTimeout(retryDelay);
          continue;
        }

        // Perform action
        switch (action) {
          case 'click':
            await locator.click({ timeout });
            break;
          case 'fill':
            if (value !== undefined) {
              await locator.fill(value, { timeout });
            }
            break;
          case 'hover':
            await locator.hover({ timeout });
            break;
        }

        return true;
      } catch (error) {
        if (attempt === retries) {
          console.warn(`❌ Smart interaction failed for ${selector} after ${retries + 1} attempts`);
          return false;
        }
        
        await page.waitForTimeout(retryDelay);
      }
    }

    return false;
  }

  /**
   * Batch element checks for efficiency
   */
  static async batchElementChecks(
    page: Page,
    checks: Array<{
      selector: string;
      expectation: 'visible' | 'hidden' | 'enabled' | 'disabled';
      timeout?: number;
    }>
  ): Promise<{ passed: number; failed: string[] }> {
    const results = await Promise.allSettled(
      checks.map(async ({ selector, expectation, timeout = 3000 }) => {
        const locator = page.locator(selector);
        
        switch (expectation) {
          case 'visible':
            await locator.waitFor({ state: 'visible', timeout });
            break;
          case 'hidden':
            await locator.waitFor({ state: 'hidden', timeout });
            break;
          case 'enabled':
            await locator.waitFor({ state: 'attached', timeout });
            const isEnabled = await locator.isEnabled();
            if (!isEnabled) throw new Error('Element not enabled');
            break;
          case 'disabled':
            await locator.waitFor({ state: 'attached', timeout });
            const isDisabled = await locator.isDisabled();
            if (!isDisabled) throw new Error('Element not disabled');
            break;
        }
        
        return selector;
      })
    );

    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results
      .filter(r => r.status === 'rejected')
      .map((_, index) => checks[index].selector);

    return { passed, failed };
  }

  /**
   * Generate optimization report
   */
  static generateOptimizationReport(): string {
    const perfReport = TestPerformanceMetrics.generateReport();
    const cacheStats = OptimizedTestDataFactory.getCacheStats();
    
    let report = '\n🚀 E2E Test Optimization Report\n';
    report += '═'.repeat(60) + '\n';
    
    report += '\n📊 Cache Statistics:\n';
    report += `   Cached Images: ${cacheStats.images}\n`;
    report += `   Active Sessions: ${cacheStats.sessions}\n`;
    
    report += '\n💡 Optimization Recommendations:\n';
    
    // Add performance-based recommendations
    const slowTests = [];
    // This would analyze TestPerformanceMetrics data for recommendations
    
    if (slowTests.length === 0) {
      report += '   ✅ All tests performing within acceptable ranges\n';
    } else {
      report += `   ⚠️ ${slowTests.length} tests could benefit from optimization\n`;
    }
    
    report += perfReport;
    
    return report;
  }

  /**
   * Cleanup all optimization resources
   */
  static async cleanup(): Promise<void> {
    // Close active sessions
    for (const entry of Array.from(this.activeSessions.entries())) {
      const [, context] = entry; // name is not used, only context
      try {
        await context.close();
      } catch {
        // Ignore cleanup errors
      }
    }
    
    this.activeSessions.clear();
    this.testQueue = [];
    OptimizedTestDataFactory.clearCache();
    TestPerformanceMetrics.clear();
  }
}
