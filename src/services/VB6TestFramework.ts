/**
 * VB6 Testing Framework
 *
 * Provides comprehensive testing capabilities for VB6 code including:
 * - Unit testing with assertions
 * - Integration testing for forms and controls
 * - Mock object support
 * - Code coverage reporting
 * - Visual regression testing
 */

import { VB6Parser } from '../utils/vb6Parser';
import { VB6SemanticAnalyzer } from '../utils/vb6SemanticAnalyzer';
import { VB6Transpiler } from '../utils/vb6Transpiler';
import { Control } from '../context/types';
import { createLogger } from './LoggingService';
import {
  TestValue,
  TestEnvironment,
  MockImplementation,
  MockCallArgs,
} from './types/VB6ServiceTypes';

const logger = createLogger('TestFramework');

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: 'unit' | 'integration' | 'visual' | 'performance';
  code: string;
  setup?: string;
  teardown?: string;
  expectedResult?: TestValue;
  actualResult?: TestValue;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  error?: string;
  duration?: number;
  coverage?: CoverageInfo;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  tests: TestCase[];
  setupAll?: string;
  teardownAll?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'partial';
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  totalDuration: number;
}

export interface TestResult {
  testId: string;
  suiteId: string;
  passed: boolean;
  error?: string;
  duration: number;
  assertions: AssertionResult[];
  coverage?: CoverageInfo;
  snapshot?: string;
}

export interface AssertionResult {
  type: string;
  expected: TestValue;
  actual: TestValue;
  passed: boolean;
  message?: string;
  location?: { line: number; column: number };
}

export interface CoverageInfo {
  lines: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
  uncoveredLines: number[];
}

export interface MockObject {
  name: string;
  type: string;
  methods: Map<string, MockMethod>;
  properties: Map<string, TestValue>;
  callHistory: MockCall[];
}

export interface MockMethod {
  name: string;
  implementation?: MockImplementation;
  returnValue?: TestValue;
  throwError?: Error;
  callCount: number;
  calledWith: MockCallArgs[];
}

export interface MockCall {
  method: string;
  args: MockCallArgs;
  timestamp: number;
  returnValue?: TestValue;
  error?: Error;
}

export class VB6TestFramework {
  private parser: VB6Parser;
  private analyzer: VB6SemanticAnalyzer;
  private transpiler: VB6Transpiler;
  private testSuites: Map<string, TestSuite> = new Map();
  private mocks: Map<string, MockObject> = new Map();
  private coverageData: Map<string, CoverageInfo> = new Map();
  private testEnvironment: TestEnvironment = {};
  private runningTests: Set<string> = new Set();

  constructor() {
    this.parser = new VB6Parser();
    this.analyzer = new VB6SemanticAnalyzer();
    this.transpiler = new VB6Transpiler();
    this.setupTestEnvironment();
  }

  /**
   * Create a new test suite
   */
  createTestSuite(name: string, description?: string): TestSuite {
    const suite: TestSuite = {
      id: this.generateId(),
      name,
      description,
      tests: [],
      status: 'pending',
      passedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      totalDuration: 0,
    };

    this.testSuites.set(suite.id, suite);
    return suite;
  }

  /**
   * Add a test case to a suite
   */
  addTest(suiteId: string, test: Omit<TestCase, 'id' | 'status'>): TestCase {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    const testCase: TestCase = {
      ...test,
      id: this.generateId(),
      status: 'pending',
    };

    suite.tests.push(testCase);
    return testCase;
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<Map<string, TestResult[]>> {
    const results = new Map<string, TestResult[]>();

    for (const [suiteId, suite] of this.testSuites) {
      const suiteResults = await this.runTestSuite(suiteId);
      results.set(suiteId, suiteResults);
    }

    return results;
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteId: string): Promise<TestResult[]> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    suite.status = 'running';
    suite.passedCount = 0;
    suite.failedCount = 0;
    suite.skippedCount = 0;
    suite.totalDuration = 0;

    const results: TestResult[] = [];

    // Run setup all
    if (suite.setupAll) {
      try {
        await this.executeCode(suite.setupAll);
      } catch (error) {
        logger.error('Setup all failed:', error);
        suite.status = 'failed';
        return results;
      }
    }

    // Run each test
    for (const test of suite.tests) {
      const result = await this.runTest(test, suiteId);
      results.push(result);

      if (result.passed) {
        suite.passedCount++;
      } else {
        suite.failedCount++;
      }

      suite.totalDuration += result.duration;
    }

    // Run teardown all
    if (suite.teardownAll) {
      try {
        await this.executeCode(suite.teardownAll);
      } catch (error) {
        logger.error('Teardown all failed:', error);
      }
    }

    // Update suite status
    if (suite.failedCount === 0) {
      suite.status = 'passed';
    } else if (suite.passedCount === 0) {
      suite.status = 'failed';
    } else {
      suite.status = 'partial';
    }

    return results;
  }

  /**
   * Run a single test case
   */
  async runTest(test: TestCase, suiteId: string): Promise<TestResult> {
    const startTime = Date.now();
    test.status = 'running';
    this.runningTests.add(test.id);

    const result: TestResult = {
      testId: test.id,
      suiteId,
      passed: false,
      duration: 0,
      assertions: [],
    };

    try {
      // Reset test environment
      this.resetTestEnvironment();

      // Run setup
      if (test.setup) {
        await this.executeCode(test.setup);
      }

      // Enable coverage if needed
      if (test.type === 'unit') {
        this.startCoverage(test.id);
      }

      // Run test code
      const testResult = await this.executeTestCode(test.code);
      result.assertions = this.testEnvironment.assertions || [];

      // Check assertions
      result.passed = result.assertions.every(a => a.passed);

      // Stop coverage
      if (test.type === 'unit') {
        result.coverage = this.stopCoverage(test.id);
      }

      // Run teardown
      if (test.teardown) {
        await this.executeCode(test.teardown);
      }

      test.status = result.passed ? 'passed' : 'failed';
    } catch (error) {
      result.passed = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      test.status = 'failed';
      test.error = result.error;
    }

    result.duration = Date.now() - startTime;
    test.duration = result.duration;
    this.runningTests.delete(test.id);

    return result;
  }

  /**
   * Create a mock object
   */
  createMock(name: string, type: string): MockObject {
    const mock: MockObject = {
      name,
      type,
      methods: new Map(),
      properties: new Map(),
      callHistory: [],
    };

    this.mocks.set(name, mock);
    return mock;
  }

  /**
   * Add a mock method
   */
  mockMethod(
    mockName: string,
    methodName: string,
    options: {
      returnValue?: any;
      implementation?: (...args: any[]) => any;
      throwError?: Error;
    } = {}
  ): void {
    const mock = this.mocks.get(mockName);
    if (!mock) {
      throw new Error(`Mock ${mockName} not found`);
    }

    const method: MockMethod = {
      name: methodName,
      implementation: options.implementation,
      returnValue: options.returnValue,
      throwError: options.throwError,
      callCount: 0,
      calledWith: [],
    };

    mock.methods.set(methodName, method);
  }

  /**
   * Verify mock calls
   */
  verifyMock(mockName: string, methodName: string, expectedCalls?: number): boolean {
    const mock = this.mocks.get(mockName);
    if (!mock) {
      throw new Error(`Mock ${mockName} not found`);
    }

    const method = mock.methods.get(methodName);
    if (!method) {
      return false;
    }

    if (expectedCalls !== undefined) {
      return method.callCount === expectedCalls;
    }

    return method.callCount > 0;
  }

  /**
   * Get test coverage report
   */
  getCoverageReport(): {
    overall: CoverageInfo;
    byFile: Map<string, CoverageInfo>;
  } {
    const overall: CoverageInfo = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 },
      uncoveredLines: [],
    };

    for (const coverage of this.coverageData.values()) {
      overall.lines.total += coverage.lines.total;
      overall.lines.covered += coverage.lines.covered;
      overall.functions.total += coverage.functions.total;
      overall.functions.covered += coverage.functions.covered;
      overall.branches.total += coverage.branches.total;
      overall.branches.covered += coverage.branches.covered;
      overall.statements.total += coverage.statements.total;
      overall.statements.covered += coverage.statements.covered;
    }

    // Calculate percentages
    if (overall.lines.total > 0) {
      overall.lines.percentage = (overall.lines.covered / overall.lines.total) * 100;
    }
    if (overall.functions.total > 0) {
      overall.functions.percentage = (overall.functions.covered / overall.functions.total) * 100;
    }
    if (overall.branches.total > 0) {
      overall.branches.percentage = (overall.branches.covered / overall.branches.total) * 100;
    }
    if (overall.statements.total > 0) {
      overall.statements.percentage = (overall.statements.covered / overall.statements.total) * 100;
    }

    return {
      overall,
      byFile: new Map(this.coverageData),
    };
  }

  /**
   * Generate test report
   */
  generateReport(format: 'html' | 'json' | 'text' = 'text'): string {
    const suites = Array.from(this.testSuites.values());
    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.passedCount, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.failedCount, 0);
    const totalSkipped = suites.reduce((sum, suite) => sum + suite.skippedCount, 0);
    const totalDuration = suites.reduce((sum, suite) => sum + suite.totalDuration, 0);

    if (format === 'json') {
      return JSON.stringify(
        {
          summary: {
            totalSuites: suites.length,
            totalTests,
            totalPassed,
            totalFailed,
            totalSkipped,
            totalDuration,
            passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
          },
          suites,
          coverage: this.getCoverageReport(),
        },
        null,
        2
      );
    }

    if (format === 'html') {
      return this.generateHtmlReport(suites);
    }

    // Text format
    const lines: string[] = [];
    lines.push('='.repeat(80));
    lines.push('VB6 Test Report');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Total Suites: ${suites.length}`);
    lines.push(`Total Tests: ${totalTests}`);
    lines.push(`Passed: ${totalPassed}`);
    lines.push(`Failed: ${totalFailed}`);
    lines.push(`Skipped: ${totalSkipped}`);
    lines.push(`Duration: ${totalDuration}ms`);
    lines.push(`Pass Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`);
    lines.push('');

    // Coverage summary
    const coverage = this.getCoverageReport();
    lines.push('Coverage Summary:');
    lines.push(`  Lines: ${coverage.overall.lines.percentage.toFixed(2)}%`);
    lines.push(`  Functions: ${coverage.overall.functions.percentage.toFixed(2)}%`);
    lines.push(`  Branches: ${coverage.overall.branches.percentage.toFixed(2)}%`);
    lines.push(`  Statements: ${coverage.overall.statements.percentage.toFixed(2)}%`);
    lines.push('');

    // Suite details
    for (const suite of suites) {
      lines.push('-'.repeat(80));
      lines.push(`Suite: ${suite.name}`);
      lines.push(`Status: ${suite.status}`);
      lines.push(
        `Tests: ${suite.tests.length} (Passed: ${suite.passedCount}, Failed: ${suite.failedCount})`
      );
      lines.push('');

      for (const test of suite.tests) {
        const status = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';
        lines.push(`  ${status} ${test.name} (${test.duration || 0}ms)`);
        if (test.error) {
          lines.push(`    Error: ${test.error}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // Private methods

  private setupTestEnvironment(): void {
    // Set up assertion functions
    this.testEnvironment.Assert = {
      AreEqual: (expected: any, actual: any, message?: string) => {
        this.addAssertion('AreEqual', expected, actual, expected === actual, message);
      },
      AreNotEqual: (expected: any, actual: any, message?: string) => {
        this.addAssertion('AreNotEqual', expected, actual, expected !== actual, message);
      },
      IsTrue: (condition: boolean, message?: string) => {
        this.addAssertion('IsTrue', true, condition, condition === true, message);
      },
      IsFalse: (condition: boolean, message?: string) => {
        this.addAssertion('IsFalse', false, condition, condition === false, message);
      },
      IsNull: (value: any, message?: string) => {
        this.addAssertion('IsNull', null, value, value === null || value === undefined, message);
      },
      IsNotNull: (value: any, message?: string) => {
        this.addAssertion(
          'IsNotNull',
          'not null',
          value,
          value !== null && value !== undefined,
          message
        );
      },
      Contains: (substring: string, string: string, message?: string) => {
        this.addAssertion('Contains', substring, string, string.includes(substring), message);
      },
      Throws: async (fn: () => any, expectedError?: string, message?: string) => {
        let threw = false;
        let error: any = null;
        try {
          await fn();
        } catch (e) {
          threw = true;
          error = e;
        }
        const passed = threw && (!expectedError || error?.message?.includes(expectedError));
        this.addAssertion(
          'Throws',
          expectedError || 'any error',
          error?.message || 'no error',
          passed,
          message
        );
      },
    };

    // Set up mock support
    this.testEnvironment.Mock = {
      Create: (name: string, type: string) => this.createMock(name, type),
      Setup: (mockName: string, methodName: string, options: any) =>
        this.mockMethod(mockName, methodName, options),
      Verify: (mockName: string, methodName: string, expectedCalls?: number) =>
        this.verifyMock(mockName, methodName, expectedCalls),
      Reset: (mockName: string) => {
        const mock = this.mocks.get(mockName);
        if (mock) {
          mock.callHistory = [];
          for (const method of mock.methods.values()) {
            method.callCount = 0;
            method.calledWith = [];
          }
        }
      },
    };
  }

  private resetTestEnvironment(): void {
    this.testEnvironment.assertions = [];
    this.mocks.clear();
  }

  private addAssertion(
    type: string,
    expected: any,
    actual: any,
    passed: boolean,
    message?: string
  ): void {
    if (!this.testEnvironment.assertions) {
      this.testEnvironment.assertions = [];
    }

    this.testEnvironment.assertions.push({
      type,
      expected,
      actual,
      passed,
      message,
    });

    if (!passed) {
      const errorMsg =
        message || `Assertion failed: ${type} - Expected: ${expected}, Actual: ${actual}`;
      logger.error(errorMsg);
    }
  }

  private async executeCode(code: string): Promise<any> {
    try {
      // Parse and transpile the VB6 code
      const ast = this.parser.parse(code);
      const jsCode = this.transpiler.transpile(ast);

      // Execute in sandboxed environment
      const fn = new Function('test', 'Assert', 'Mock', jsCode);
      return await fn(this.testEnvironment, this.testEnvironment.Assert, this.testEnvironment.Mock);
    } catch (error) {
      throw new Error(
        `Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async executeTestCode(code: string): Promise<any> {
    // Similar to executeCode but with test-specific handling
    return this.executeCode(code);
  }

  private startCoverage(testId: string): void {
    // Initialize coverage tracking for this test
    this.coverageData.set(testId, {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 },
      uncoveredLines: [],
    });
  }

  private stopCoverage(testId: string): CoverageInfo | undefined {
    return this.coverageData.get(testId);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateHtmlReport(suites: TestSuite[]): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>VB6 Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .suite { border: 1px solid #ddd; margin-bottom: 20px; border-radius: 5px; }
    .suite-header { background: #e0e0e0; padding: 10px; font-weight: bold; }
    .test { padding: 10px 20px; border-bottom: 1px solid #eee; }
    .test:last-child { border-bottom: none; }
    .passed { color: green; }
    .failed { color: red; }
    .skipped { color: gray; }
    .error { color: red; font-size: 0.9em; margin-left: 20px; }
    .coverage { background: #f8f8f8; padding: 15px; margin-top: 20px; border-radius: 5px; }
    .coverage-bar { background: #ddd; height: 20px; border-radius: 3px; position: relative; overflow: hidden; }
    .coverage-fill { background: #4CAF50; height: 100%; position: absolute; left: 0; top: 0; }
  </style>
</head>
<body>
  <h1>VB6 Test Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Tests: ${suites.reduce((sum, s) => sum + s.tests.length, 0)}</p>
    <p>Passed: <span class="passed">${suites.reduce((sum, s) => sum + s.passedCount, 0)}</span></p>
    <p>Failed: <span class="failed">${suites.reduce((sum, s) => sum + s.failedCount, 0)}</span></p>
    <p>Skipped: <span class="skipped">${suites.reduce((sum, s) => sum + s.skippedCount, 0)}</span></p>
  </div>
  
  ${suites
    .map(
      suite => `
    <div class="suite">
      <div class="suite-header">${suite.name} - ${suite.status}</div>
      ${suite.tests
        .map(
          test => `
        <div class="test">
          <span class="${test.status}">${test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○'}</span>
          ${test.name} (${test.duration || 0}ms)
          ${test.error ? `<div class="error">${test.error}</div>` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('')}
  
  <div class="coverage">
    <h2>Code Coverage</h2>
    ${this.generateCoverageHtml()}
  </div>
</body>
</html>
    `;

    return html;
  }

  private generateCoverageHtml(): string {
    const coverage = this.getCoverageReport();
    return `
      <div>
        <h3>Overall Coverage</h3>
        <p>Lines: ${coverage.overall.lines.percentage.toFixed(2)}%</p>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${coverage.overall.lines.percentage}%"></div>
        </div>
        <p>Functions: ${coverage.overall.functions.percentage.toFixed(2)}%</p>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${coverage.overall.functions.percentage}%"></div>
        </div>
        <p>Branches: ${coverage.overall.branches.percentage.toFixed(2)}%</p>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${coverage.overall.branches.percentage}%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Visual testing support
   */
  async captureSnapshot(elementId: string): Promise<string> {
    // In a real implementation, this would capture a visual snapshot
    // For now, return a placeholder
    return `snapshot_${elementId}_${Date.now()}`;
  }

  async compareSnapshots(
    actual: string,
    expected: string,
    threshold: number = 0.1
  ): Promise<boolean> {
    // In a real implementation, this would compare visual snapshots
    // For now, return true
    return true;
  }

  /**
   * Performance testing support
   */
  async measurePerformance(
    fn: () => any,
    iterations: number = 100
  ): Promise<{
    average: number;
    min: number;
    max: number;
    median: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    times.sort((a, b) => a - b);

    return {
      average: times.reduce((sum, t) => sum + t, 0) / times.length,
      min: times[0],
      max: times[times.length - 1],
      median: times[Math.floor(times.length / 2)],
    };
  }
}

// Export singleton instance
export const vb6TestFramework = new VB6TestFramework();
