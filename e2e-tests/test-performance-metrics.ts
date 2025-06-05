import { Page } from '@playwright/test';

/**
 * Test performance metrics collection and analysis
 */
export class TestPerformanceMetrics {
  private static metrics: Map<string, number[]> = new Map();
  private static testStartTimes: Map<string, number> = new Map();

  /**
   * Start tracking performance for a test
   */
  static startTest(testName: string): void {
    this.testStartTimes.set(testName, Date.now());
  }

  /**
   * End tracking and record performance for a test
   */
  static endTest(testName: string): number {
    const startTime = this.testStartTimes.get(testName);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    
    if (!this.metrics.has(testName)) {
      this.metrics.set(testName, []);
    }
    this.metrics.get(testName)!.push(duration);
    
    this.testStartTimes.delete(testName);
    return duration;
  }

  /**
   * Get performance statistics for a test
   */
  static getTestStats(testName: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const durations = this.metrics.get(testName);
    if (!durations || durations.length === 0) return null;

    return {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  }

  /**
   * Generate performance report
   */
  static generateReport(): string {
    let report = '\n📊 E2E Test Performance Report\n';
    report += '═'.repeat(50) + '\n';

    for (const entry of Array.from(this.metrics.entries())) {
      const [testName] = entry; // Only need testName, durations accessed via getTestStats
      const stats = this.getTestStats(testName);
      if (stats) {
        report += `\n🔍 ${testName}\n`;
        report += `   Average: ${stats.average.toFixed(0)}ms\n`;
        report += `   Range: ${stats.min}ms - ${stats.max}ms\n`;
        report += `   Runs: ${stats.count}\n`;
        
        // Performance assessment
        if (stats.average < 3000) {
          report += `   Status: ✅ FAST\n`;
        } else if (stats.average < 8000) {
          report += `   Status: ⚠️ MODERATE\n`;
        } else {
          report += `   Status: 🐌 SLOW - Consider optimization\n`;
        }
      }
    }

    report += '\n' + '═'.repeat(50) + '\n';
    return report;
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
    this.testStartTimes.clear();
  }

  /**
   * Measure page navigation performance
   */
  static async measureNavigation(
    page: Page, 
    operation: () => Promise<void>, 
    label: string
  ): Promise<number> {
    const startTime: number = Date.now();
    
    // Start navigation timing
    await page.evaluate(() => {
      performance.mark('nav-start');
    });

    await operation();

    // End navigation timing
    const duration = await page.evaluate(() => {
      performance.mark('nav-end');
      const measure = performance.measure('navigation', 'nav-start', 'nav-end');
      return measure.duration;
    });

    const totalTime = Date.now() - startTime;
    
    if (process.env.PLAYWRIGHT_PERF_LOG === 'true') {
      console.log(`🚀 ${label}: ${totalTime}ms (Browser: ${duration.toFixed(0)}ms)`);
    }

    return totalTime;
  }

  /**
   * Measure element wait performance
   */
  static async measureElementWait(
    operation: () => Promise<any>,
    label: string
  ): Promise<{ result: any; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    if (process.env.PLAYWRIGHT_PERF_LOG === 'true') {
      console.log(`⏳ ${label}: ${duration}ms`);
    }

    return { result, duration };
  }
}
