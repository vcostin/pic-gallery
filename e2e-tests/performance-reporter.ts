import type { 
  Reporter, 
  FullConfig, 
  Suite, 
  TestCase, 
  TestResult, 
  FullResult 
} from '@playwright/test/reporter';

interface PerformanceData {
  testName: string;
  duration: number;
  status: string;
  projectName: string;
  workerIndex: number;
  startTime: number;
  endTime: number;
  retries: number;
}

interface ProjectStats {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  avgDuration: number;
  totalDuration: number;
  fastestTest: PerformanceData | null;
  slowestTest: PerformanceData | null;
}

/**
 * Enhanced Performance Reporter for E2E Test Optimization
 * 
 * This reporter provides detailed performance metrics including:
 * - Test execution times and patterns
 * - Worker efficiency analysis
 * - Performance regression detection
 * - Optimization recommendations
 */
class PerformanceReporter implements Reporter {
  private suiteStartTime: number = 0;
  private testResults: PerformanceData[] = [];
  private config: FullConfig | null = null;

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suiteStartTime = Date.now();
    
    console.log('\n🚀 E2E Performance Monitoring Started');
    console.log(`═══════════════════════════════════════`);
    console.log(`Workers: ${config.workers}`);
    console.log(`Projects: ${config.projects.length}`);
    console.log(`Test Directory: ${config.testDir}`);
    console.log(`═══════════════════════════════════════\n`);
  }

  onTestBegin(test: TestCase): void {
    // Test start tracking is handled by TestPerformanceMetrics
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const testData: PerformanceData = {
      testName: test.title,
      duration: result.duration,
      status: result.status,
      projectName: test.parent.project()?.name || 'unknown',
      workerIndex: result.workerIndex,
      startTime: result.startTime.getTime(),
      endTime: result.startTime.getTime() + result.duration,
      retries: result.retry
    };

    this.testResults.push(testData);

    // Log slow tests immediately for debugging
    if (result.duration > 30000) { // Tests over 30 seconds
      console.log(`⚠️  SLOW TEST DETECTED: ${test.title} (${result.duration}ms)`);
    }
  }

  onEnd(result: FullResult): void {
    const totalDuration = Date.now() - this.suiteStartTime;
    
    console.log('\n📊 E2E Performance Report');
    console.log('═══════════════════════════════════════');
    
    this.generateSummaryReport(result, totalDuration);
    this.generateProjectAnalysis();
    this.generateWorkerEfficiencyReport();
    this.generatePerformanceInsights();
    this.generateOptimizationRecommendations();
    
    console.log('═══════════════════════════════════════\n');
  }

  private generateSummaryReport(result: FullResult, totalDuration: number): void {
    const stats = {
      total: this.testResults.length,
      passed: this.testResults.filter(t => t.status === 'passed').length,
      failed: this.testResults.filter(t => t.status === 'failed').length,
      skipped: this.testResults.filter(t => t.status === 'skipped').length,
    };

    const avgTestDuration = this.testResults.length > 0 
      ? Math.round(this.testResults.reduce((sum, t) => sum + t.duration, 0) / this.testResults.length)
      : 0;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`   Tests: ${stats.total} (✅ ${stats.passed} | ❌ ${stats.failed} | ⏸️ ${stats.skipped})`);
    console.log(`   Average Test: ${this.formatDuration(avgTestDuration)}`);
    console.log(`   Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);
  }

  private generateProjectAnalysis(): void {
    const projects = this.groupByProject();
    
    console.log(`\n🏗️ Project Analysis:`);
    projects.forEach(project => {
      console.log(`   ${project.name}:`);
      console.log(`     Tests: ${project.total} (${this.formatDuration(project.totalDuration)})`);
      console.log(`     Average: ${this.formatDuration(project.avgDuration)}`);
      if (project.slowestTest) {
        console.log(`     Slowest: ${project.slowestTest.testName} (${this.formatDuration(project.slowestTest.duration)})`);
      }
    });
  }

  private generateWorkerEfficiencyReport(): void {
    const workerStats = this.analyzeWorkerEfficiency();
    
    console.log(`\n👷 Worker Efficiency:`);
    Object.entries(workerStats).forEach(([workerIndex, stats]) => {
      console.log(`   Worker ${workerIndex}: ${stats.testCount} tests, ${this.formatDuration(stats.totalTime)}`);
    });
  }

  private generatePerformanceInsights(): void {
    const insights = this.getPerformanceInsights();
    
    console.log(`\n💡 Performance Insights:`);
    insights.forEach(insight => {
      console.log(`   ${insight}`);
    });
  }

  private generateOptimizationRecommendations(): void {
    const recommendations = this.getOptimizationRecommendations();
    
    if (recommendations.length > 0) {
      console.log(`\n🎯 Optimization Recommendations:`);
      recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }
  }

  private groupByProject(): ProjectStats[] {
    const projectMap = new Map<string, PerformanceData[]>();
    
    this.testResults.forEach(test => {
      const project = test.projectName;
      if (!projectMap.has(project)) {
        projectMap.set(project, []);
      }
      projectMap.get(project)!.push(test);
    });

    return Array.from(projectMap.entries()).map(([name, tests]): ProjectStats => {
      const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
      const avgDuration = Math.round(totalDuration / tests.length);
      
      const sortedByDuration = tests.sort((a, b) => b.duration - a.duration);
      
      return {
        name,
        total: tests.length,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        skipped: tests.filter(t => t.status === 'skipped').length,
        avgDuration,
        totalDuration,
        fastestTest: sortedByDuration[sortedByDuration.length - 1] || null,
        slowestTest: sortedByDuration[0] || null
      };
    });
  }

  private analyzeWorkerEfficiency(): Record<string, { testCount: number; totalTime: number }> {
    const workerStats: Record<string, { testCount: number; totalTime: number }> = {};
    
    this.testResults.forEach(test => {
      const worker = test.workerIndex.toString();
      if (!workerStats[worker]) {
        workerStats[worker] = { testCount: 0, totalTime: 0 };
      }
      workerStats[worker].testCount++;
      workerStats[worker].totalTime += test.duration;
    });
    
    return workerStats;
  }

  private getPerformanceInsights(): string[] {
    const insights: string[] = [];
    
    // Check for slow tests
    const slowTests = this.testResults.filter(t => t.duration > 15000);
    if (slowTests.length > 0) {
      insights.push(`🐌 ${slowTests.length} tests took over 15 seconds`);
    }
    
    // Check retry patterns
    const retriedTests = this.testResults.filter(t => t.retries > 0);
    if (retriedTests.length > 0) {
      insights.push(`🔄 ${retriedTests.length} tests required retries`);
    }
    
    // Check worker distribution
    const workerStats = this.analyzeWorkerEfficiency();
    const workerTimes = Object.values(workerStats).map(w => w.totalTime);
    const maxTime = Math.max(...workerTimes);
    const minTime = Math.min(...workerTimes);
    if (maxTime > minTime * 1.5) {
      insights.push(`⚖️ Uneven worker distribution detected`);
    }
    
    return insights;
  }

  private getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const avgDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0) / this.testResults.length;
    
    // Recommend fast mode if tests are consistently quick
    if (avgDuration < 5000) {
      recommendations.push(`💨 Consider using PLAYWRIGHT_FAST=true for faster execution`);
    }
    
    // Recommend optimized mode for medium duration tests
    if (avgDuration > 5000 && avgDuration < 15000) {
      recommendations.push(`⚡ Consider using PLAYWRIGHT_OPTIMIZED=true for balanced performance`);
    }
    
    // Worker optimization
    const workers = this.config?.workers || 1;
    const totalTests = this.testResults.length;
    if (workers > 1 && totalTests / workers < 3) {
      recommendations.push(`👥 Consider reducing workers for better efficiency with ${totalTests} tests`);
    }
    
    // Check for test data optimization opportunities
    const galleryTests = this.testResults.filter(t => 
      t.testName.toLowerCase().includes('gallery') || 
      t.testName.toLowerCase().includes('upload')
    );
    if (galleryTests.length > 3) {
      recommendations.push(`🗃️ Consider using shared test data for gallery/upload tests`);
    }
    
    return recommendations;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}

export default PerformanceReporter;
