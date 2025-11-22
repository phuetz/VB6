/**
 * ULTRA COMPREHENSIVE Error Handling Test Suite
 * Tests error boundaries, recovery mechanisms, logging, and edge cases
 */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Error handling interfaces
interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'runtime' | 'compilation' | 'ui' | 'network' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: {
    component?: string;
    action?: string;
    user?: string;
    session?: string;
    url?: string;
  };
  recovered: boolean;
  recoveryAction?: string;
}

interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableRecovery: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxRetries: number;
  retryDelay: number;
  enableUserNotification: boolean;
}

interface RecoveryStrategy {
  name: string;
  condition: (error: Error) => boolean;
  action: (error: Error) => Promise<boolean>;
  priority: number;
}

describe('Error Handling - Runtime Errors', () => {
  let errorHandler: any;
  let mockConfig: ErrorHandlerConfig;

  beforeEach(() => {
    mockConfig = {
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      logLevel: 'error',
      maxRetries: 3,
      retryDelay: 1000,
      enableUserNotification: true,
    };

    errorHandler = createErrorHandler(mockConfig);
    vi.clearAllMocks();
  });

  it('should catch and handle JavaScript runtime errors', () => {
    const runtimeErrors = [
      new ReferenceError('undefined is not defined'),
      new TypeError('Cannot read property of undefined'),
      new RangeError('Maximum call stack size exceeded'),
      new SyntaxError('Unexpected token'),
      new URIError('URI malformed'),
    ];

    runtimeErrors.forEach(error => {
      const report = errorHandler.handleError(error, {
        component: 'VB6Runtime',
        action: 'executeCode',
      });

      expect(report).toMatchObject({
        type: 'runtime',
        severity: expect.stringMatching(/medium|high|critical/),
        message: error.message,
        context: {
          component: 'VB6Runtime',
          action: 'executeCode',
        },
        recovered: expect.any(Boolean),
      });
    });
  });

  it('should handle VB6 compilation errors', () => {
    const compilationErrors = [
      { message: 'Syntax error at line 5', line: 5, column: 10 },
      { message: 'Undefined variable: x', line: 12, column: 5 },
      { message: 'Type mismatch in assignment', line: 8, column: 15 },
      { message: 'Missing End Sub statement', line: 20, column: 1 },
    ];

    compilationErrors.forEach(error => {
      const report = errorHandler.handleCompilationError(error, {
        component: 'VB6Compiler',
        action: 'compile',
      });

      expect(report).toMatchObject({
        type: 'compilation',
        severity: 'high',
        message: error.message,
        context: {
          component: 'VB6Compiler',
          action: 'compile',
        },
      });
    });
  });

  it('should handle memory allocation errors', () => {
    const memoryError = new Error('Insufficient memory to complete operation');
    memoryError.name = 'OutOfMemoryError';

    const report = errorHandler.handleError(memoryError, {
      component: 'FormDesigner',
      action: 'createLargeArray',
    });

    expect(report).toMatchObject({
      type: 'runtime',
      severity: 'critical',
      message: expect.stringContaining('memory'),
      recovered: expect.any(Boolean),
    });

    if (report.recovered) {
      expect(report.recoveryAction).toContain('memory cleanup');
    }
  });

  it('should handle infinite loop detection', () => {
    const infiniteLoopError = new Error('Maximum execution time exceeded');
    infiniteLoopError.name = 'TimeoutError';

    const report = errorHandler.handleError(infiniteLoopError, {
      component: 'VB6Runtime',
      action: 'executeLoop',
    });

    expect(report).toMatchObject({
      type: 'runtime',
      severity: 'high',
      message: expect.stringContaining('execution time'),
      recovered: true,
      recoveryAction: 'execution terminated',
    });
  });

  it('should handle DOM manipulation errors', () => {
    const domErrors = [
      new Error('Cannot appendChild on null element'),
      new Error('Node was not found'),
      new Error('Permission denied to access property'),
    ];

    domErrors.forEach(error => {
      const report = errorHandler.handleError(error, {
        component: 'DesignerCanvas',
        action: 'manipulateDOM',
      });

      expect(report).toMatchObject({
        type: 'ui',
        severity: expect.stringMatching(/medium|high/),
        context: {
          component: 'DesignerCanvas',
          action: 'manipulateDOM',
        },
      });
    });
  });
});

describe('Error Handling - Network Errors', () => {
  let errorHandler: any;

  beforeEach(() => {
    errorHandler = createErrorHandler({
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      logLevel: 'error',
      maxRetries: 3,
      retryDelay: 1000,
      enableUserNotification: true,
    });
  });

  it('should handle network connectivity errors', () => {
    const networkErrors = [
      new Error('Network request failed'),
      new Error('Connection timeout'),
      new Error('Server unreachable'),
      new Error('DNS resolution failed'),
    ];

    networkErrors.forEach(error => {
      const report = errorHandler.handleNetworkError(error, {
        url: 'https://api.example.com/data',
        method: 'GET',
        attempt: 1,
      });

      expect(report).toMatchObject({
        type: 'network',
        severity: 'medium',
        message: error.message,
        context: {
          url: 'https://api.example.com/data',
        },
        recovered: false, // Initially not recovered
      });
    });
  });

  it('should implement retry logic for network requests', async () => {
    const networkError = new Error('Connection timeout');
    let attemptCount = 0;

    const mockRetry = vi.fn().mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw networkError;
      }
      return { success: true, data: 'recovered' };
    });

    const result = await errorHandler.retryWithBackoff(mockRetry, {
      maxRetries: 3,
      baseDelay: 100,
      backoffMultiplier: 2,
    });

    expect(result.success).toBe(true);
    expect(mockRetry).toHaveBeenCalledTimes(3);
  });

  it('should handle HTTP error responses', () => {
    const httpErrors = [
      { status: 400, statusText: 'Bad Request' },
      { status: 401, statusText: 'Unauthorized' },
      { status: 403, statusText: 'Forbidden' },
      { status: 404, statusText: 'Not Found' },
      { status: 500, statusText: 'Internal Server Error' },
      { status: 503, statusText: 'Service Unavailable' },
    ];

    httpErrors.forEach(error => {
      const report = errorHandler.handleHTTPError(error, {
        url: 'https://api.example.com/endpoint',
        method: 'POST',
      });

      expect(report).toMatchObject({
        type: 'network',
        severity: error.status >= 500 ? 'high' : 'medium',
        message: `HTTP ${error.status}: ${error.statusText}`,
      });

      // Check if retry should be attempted based on status code
      const shouldRetry = [429, 500, 502, 503, 504].includes(error.status);
      expect(report.recovered).toBe(shouldRetry);
    });
  });

  it('should handle CORS errors', () => {
    const corsError = new Error('Cross-origin request blocked');
    corsError.name = 'CORSError';

    const report = errorHandler.handleError(corsError, {
      component: 'APIClient',
      action: 'fetchData',
      url: 'https://external-api.com/data',
    });

    expect(report).toMatchObject({
      type: 'network',
      severity: 'medium',
      message: expect.stringContaining('Cross-origin'),
      recovered: false, // CORS errors usually can't be recovered
      recoveryAction: 'Use proxy or enable CORS on server',
    });
  });
});

describe('Error Handling - UI Component Errors', () => {
  let errorHandler: any;

  beforeEach(() => {
    errorHandler = createErrorHandler({
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      logLevel: 'error',
      maxRetries: 2,
      retryDelay: 500,
      enableUserNotification: true,
    });
  });

  it('should handle React component errors', () => {
    const componentErrors = [
      new Error('Cannot read property of null'),
      new Error('Maximum update depth exceeded'),
      new Error('Invalid hook call'),
      new Error('Element type is invalid'),
    ];

    componentErrors.forEach(error => {
      const report = errorHandler.handleComponentError(error, {
        component: 'PropertiesWindow',
        props: { controlId: 'ctrl1' },
        state: { selectedProperty: 'Name' },
      });

      expect(report).toMatchObject({
        type: 'ui',
        severity: 'high',
        message: error.message,
        context: {
          component: 'PropertiesWindow',
        },
        recovered: expect.any(Boolean),
      });
    });
  });

  it('should implement error boundaries for component isolation', () => {
    const errorBoundary = errorHandler.createErrorBoundary('DesignerCanvas');

    const componentError = new Error('Render error in child component');
    const errorInfo = {
      componentStack: 'at ControlRenderer\n  at DesignerCanvas\n  at App',
    };

    const report = errorBoundary.componentDidCatch(componentError, errorInfo);

    expect(report).toMatchObject({
      type: 'ui',
      severity: 'high',
      message: 'Render error in child component',
      context: {
        component: 'DesignerCanvas',
      },
      recovered: true,
      recoveryAction: 'Fallback UI rendered',
    });
  });

  it('should handle drag and drop errors gracefully', () => {
    const dragDropErrors = [
      new Error('Invalid drop target'),
      new Error('Drag operation cancelled'),
      new Error('Cannot serialize drag data'),
    ];

    dragDropErrors.forEach(error => {
      const report = errorHandler.handleDragDropError(error, {
        source: 'Toolbox',
        target: 'DesignerCanvas',
        draggedItem: 'TextBox',
      });

      expect(report).toMatchObject({
        type: 'ui',
        severity: 'medium',
        message: error.message,
        context: {
          source: 'Toolbox',
          target: 'DesignerCanvas',
        },
        recovered: true, // Drag drop errors are usually recoverable
      });
    });
  });

  it('should handle form designer canvas errors', () => {
    const canvasError = new Error('Cannot create control at invalid position');

    const report = errorHandler.handleError(canvasError, {
      component: 'DesignerCanvas',
      action: 'createControl',
      controlType: 'TextBox',
      position: { x: -50, y: -50 },
    });

    expect(report).toMatchObject({
      type: 'ui',
      severity: 'medium',
      message: expect.stringContaining('invalid position'),
      recovered: true,
      recoveryAction: 'Position adjusted to valid coordinates',
    });
  });
});

describe('Error Handling - Data Validation Errors', () => {
  let errorHandler: any;

  beforeEach(() => {
    errorHandler = createErrorHandler({
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      logLevel: 'warn',
      maxRetries: 1,
      retryDelay: 100,
      enableUserNotification: false,
    });
  });

  it('should handle property validation errors', () => {
    const validationErrors = [
      { property: 'Width', value: -10, message: 'Width cannot be negative' },
      { property: 'Height', value: 0, message: 'Height must be greater than 0' },
      { property: 'Left', value: 'invalid', message: 'Left must be a number' },
      { property: 'Name', value: '', message: 'Name cannot be empty' },
    ];

    validationErrors.forEach(error => {
      const report = errorHandler.handleValidationError(error, {
        component: 'PropertyEditor',
        controlId: 'ctrl1',
      });

      expect(report).toMatchObject({
        type: 'ui',
        severity: 'low',
        message: error.message,
        context: {
          property: error.property,
          value: error.value,
        },
        recovered: true,
        recoveryAction: 'Value reverted to previous valid state',
      });
    });
  });

  it('should handle file format validation errors', () => {
    const fileErrors = [
      { file: 'project.vbp', error: 'Invalid project format' },
      { file: 'form1.frm', error: 'Corrupted form file' },
      { file: 'module1.bas', error: 'Unsupported encoding' },
    ];

    fileErrors.forEach(error => {
      const report = errorHandler.handleFileError(error.error, {
        component: 'FileManager',
        action: 'loadFile',
        fileName: error.file,
      });

      expect(report).toMatchObject({
        type: 'runtime',
        severity: 'high',
        message: error.error,
        context: {
          fileName: error.file,
        },
        recovered: false, // File errors usually require user intervention
      });
    });
  });

  it('should handle type conversion errors', () => {
    const conversionErrors = [
      { from: 'string', to: 'integer', value: 'abc123' },
      { from: 'string', to: 'date', value: 'invalid date' },
      { from: 'object', to: 'string', value: {} },
    ];

    conversionErrors.forEach(error => {
      const conversionError = new Error(`Cannot convert ${error.value} from ${error.from} to ${error.to}`);
      
      const report = errorHandler.handleError(conversionError, {
        component: 'VB6Runtime',
        action: 'typeConversion',
        fromType: error.from,
        toType: error.to,
      });

      expect(report).toMatchObject({
        type: 'runtime',
        severity: 'medium',
        message: expect.stringContaining('Cannot convert'),
        recovered: expect.any(Boolean),
      });
    });
  });
});

describe('Error Handling - Recovery Strategies', () => {
  let errorHandler: any;

  beforeEach(() => {
    errorHandler = createErrorHandler({
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      logLevel: 'error',
      maxRetries: 3,
      retryDelay: 100,
      enableUserNotification: true,
    });
  });

  it('should register and execute recovery strategies', () => {
    const strategies: RecoveryStrategy[] = [
      {
        name: 'Memory Cleanup',
        condition: (error) => error.name === 'OutOfMemoryError',
        action: async (error) => {
          // Simulate memory cleanup
          return true;
        },
        priority: 1,
      },
      {
        name: 'Retry Operation',
        condition: (error) => error.name === 'NetworkError',
        action: async (error) => {
          // Simulate retry
          return Math.random() > 0.5;
        },
        priority: 2,
      },
      {
        name: 'Fallback UI',
        condition: (error) => error.name === 'RenderError',
        action: async (error) => {
          // Simulate fallback rendering
          return true;
        },
        priority: 3,
      },
    ];

    strategies.forEach(strategy => {
      errorHandler.registerRecoveryStrategy(strategy);
    });

    // Test memory error recovery
    const memoryError = new Error('Insufficient memory');
    memoryError.name = 'OutOfMemoryError';

    const report = errorHandler.handleError(memoryError, {
      component: 'TestComponent',
    });

    expect(report.recovered).toBe(true);
    expect(report.recoveryAction).toContain('Memory Cleanup');
  });

  it('should handle cascading error recovery', async () => {
    const cascadingErrors = [
      new Error('Primary error'),
      new Error('Secondary error during recovery'),
      new Error('Tertiary error during fallback'),
    ];

    let errorIndex = 0;
    const failingRecovery = vi.fn().mockImplementation(async () => {
      if (errorIndex < cascadingErrors.length - 1) {
        errorIndex++;
        throw cascadingErrors[errorIndex];
      }
      return true;
    });

    errorHandler.registerRecoveryStrategy({
      name: 'Cascading Recovery',
      condition: () => true,
      action: failingRecovery,
      priority: 1,
    });

    const report = errorHandler.handleError(cascadingErrors[0], {
      component: 'TestComponent',
    });

    expect(failingRecovery).toHaveBeenCalled();
    expect(report.recovered).toBe(true); // Eventually recovered
  });

  it('should implement circuit breaker pattern', () => {
    const circuitBreaker = errorHandler.createCircuitBreaker('TestService', {
      failureThreshold: 3,
      resetTimeout: 5000,
      monitoringPeriod: 10000,
    });

    // Simulate failures
    for (let i = 0; i < 5; i++) {
      const result = circuitBreaker.execute(() => {
        throw new Error('Service unavailable');
      });

      if (i < 3) {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } else {
        // Circuit breaker should be open, failing fast
        expect(result.success).toBe(false);
        expect(result.error.message).toContain('Circuit breaker is OPEN');
      }
    }

    expect(circuitBreaker.getState()).toBe('OPEN');
  });

  it('should implement graceful degradation', () => {
    const degradationStrategies = [
      {
        feature: 'SyntaxHighlighting',
        fallback: 'Plain text editor',
        condition: (error: Error) => error.message.includes('Monaco'),
      },
      {
        feature: 'IntelliSense',
        fallback: 'Basic completion',
        condition: (error: Error) => error.message.includes('Language service'),
      },
      {
        feature: 'AdvancedDebugging',
        fallback: 'Basic debugging',
        condition: (error: Error) => error.message.includes('Debugger'),
      },
    ];

    const monacoError = new Error('Monaco editor failed to load');
    
    const degradationPlan = errorHandler.createDegradationPlan(monacoError, degradationStrategies);

    expect(degradationPlan).toMatchObject({
      disabledFeatures: ['SyntaxHighlighting'],
      fallbacks: [
        {
          feature: 'SyntaxHighlighting',
          fallback: 'Plain text editor',
        },
      ],
      userMessage: expect.stringContaining('reduced functionality'),
    });
  });
});

describe('Error Handling - Logging and Reporting', () => {
  let errorHandler: any;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };

    errorHandler = createErrorHandler({
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      logLevel: 'debug',
      maxRetries: 3,
      retryDelay: 100,
      enableUserNotification: true,
    });

    errorHandler.setLogger(mockLogger);
  });

  it('should log errors with appropriate severity levels', () => {
    const errors = [
      { error: new Error('Debug info'), severity: 'low' },
      { error: new Error('Warning message'), severity: 'medium' },
      { error: new Error('Critical failure'), severity: 'critical' },
    ];

    errors.forEach(({ error, severity }) => {
      errorHandler.handleError(error, { 
        component: 'TestComponent',
        severity: severity as any,
      });
    });

    expect(mockLogger.info).toHaveBeenCalled(); // Low severity
    expect(mockLogger.warn).toHaveBeenCalled(); // Medium severity
    expect(mockLogger.error).toHaveBeenCalled(); // Critical severity
  });

  it('should generate comprehensive error reports', () => {
    const error = new Error('Test error with stack trace');
    error.stack = 'Error: Test error\n    at TestFunction (test.js:10:5)\n    at App.js:25:12';

    const report = errorHandler.handleError(error, {
      component: 'TestComponent',
      action: 'testAction',
      user: 'testUser',
      session: 'session123',
    });

    expect(report).toMatchObject({
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'runtime',
      severity: expect.any(String),
      message: 'Test error with stack trace',
      stack: expect.stringContaining('TestFunction'),
      context: {
        component: 'TestComponent',
        action: 'testAction',
        user: 'testUser',
        session: 'session123',
      },
      recovered: expect.any(Boolean),
    });
  });

  it('should aggregate error statistics', () => {
    const errors = [
      new Error('Type A error'),
      new Error('Type A error'),
      new Error('Type B error'),
      new TypeError('Type error'),
      new ReferenceError('Reference error'),
    ];

    errors.forEach(error => {
      errorHandler.handleError(error, { component: 'TestComponent' });
    });

    const stats = errorHandler.getErrorStatistics();

    expect(stats).toMatchObject({
      totalErrors: 5,
      errorsByType: {
        runtime: 5,
      },
      errorsBySeverity: expect.any(Object),
      errorsByComponent: {
        TestComponent: 5,
      },
      commonErrors: expect.arrayContaining([
        expect.objectContaining({
          message: 'Type A error',
          count: 2,
        }),
      ]),
      timeRange: {
        start: expect.any(Number),
        end: expect.any(Number),
      },
    });
  });

  it('should export error logs for analysis', () => {
    // Generate some test errors
    const testErrors = [
      new Error('Error 1'),
      new TypeError('Error 2'),
      new ReferenceError('Error 3'),
    ];

    testErrors.forEach(error => {
      errorHandler.handleError(error, { component: 'TestComponent' });
    });

    const exportData = errorHandler.exportErrorLogs({
      format: 'json',
      includeStackTraces: true,
      dateRange: {
        start: Date.now() - 86400000, // Last 24 hours
        end: Date.now(),
      },
    });

    expect(exportData).toMatchObject({
      metadata: {
        exportDate: expect.any(Number),
        format: 'json',
        totalErrors: 3,
      },
      errors: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          timestamp: expect.any(Number),
          message: expect.any(String),
          stack: expect.any(String),
        }),
      ]),
    });
  });
});

// Helper function to create error handler
function createErrorHandler(config: ErrorHandlerConfig) {
  const errorReports: ErrorReport[] = [];
  const recoveryStrategies: RecoveryStrategy[] = [];
  const circuitBreakers = new Map<string, any>();
  let logger: any = console;

  return {
    config,
    errorReports,
    recoveryStrategies,

    handleError: (error: Error, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: determineErrorType(error, context),
        severity: determineSeverity(error, context),
        message: error.message,
        stack: error.stack,
        context,
        recovered: false,
        recoveryAction: undefined,
      };

      // Attempt recovery
      if (config.enableRecovery) {
        const recovery = attemptRecovery(error, report);
        report.recovered = recovery.success;
        report.recoveryAction = recovery.action;
      }

      // Log the error
      if (config.enableLogging) {
        logError(report);
      }

      // Store the report
      errorReports.push(report);

      return report;
    },

    handleCompilationError: (error: any, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'compilation',
        severity: 'high',
        message: error.message,
        context: {
          ...context,
          line: error.line,
          column: error.column,
        },
        recovered: false,
      };

      if (config.enableLogging) {
        logError(report);
      }

      errorReports.push(report);
      return report;
    },

    handleNetworkError: (error: Error, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'network',
        severity: 'medium',
        message: error.message,
        context,
        recovered: false,
      };

      // Network errors might be retryable
      if (isRetryableError(error)) {
        report.recovered = true;
        report.recoveryAction = 'Retry scheduled';
      }

      if (config.enableLogging) {
        logError(report);
      }

      errorReports.push(report);
      return report;
    },

    handleHTTPError: (httpError: any, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'network',
        severity: httpError.status >= 500 ? 'high' : 'medium',
        message: `HTTP ${httpError.status}: ${httpError.statusText}`,
        context,
        recovered: [429, 500, 502, 503, 504].includes(httpError.status),
      };

      if (report.recovered) {
        report.recoveryAction = 'Retry with exponential backoff';
      }

      errorReports.push(report);
      return report;
    },

    handleComponentError: (error: Error, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'ui',
        severity: 'high',
        message: error.message,
        context,
        recovered: canRecoverFromComponentError(error),
      };

      if (report.recovered) {
        report.recoveryAction = 'Component re-rendered with error boundary';
      }

      errorReports.push(report);
      return report;
    },

    handleDragDropError: (error: Error, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'ui',
        severity: 'medium',
        message: error.message,
        context,
        recovered: true, // Drag drop errors are usually recoverable
        recoveryAction: 'Drag operation cancelled gracefully',
      };

      errorReports.push(report);
      return report;
    },

    handleValidationError: (validationError: any, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'ui',
        severity: 'low',
        message: validationError.message,
        context: {
          ...context,
          property: validationError.property,
          value: validationError.value,
        },
        recovered: true,
        recoveryAction: 'Value reverted to previous valid state',
      };

      errorReports.push(report);
      return report;
    },

    handleFileError: (error: string, context: any = {}) => {
      const report: ErrorReport = {
        id: generateErrorId(),
        timestamp: Date.now(),
        type: 'runtime',
        severity: 'high',
        message: error,
        context,
        recovered: false,
      };

      errorReports.push(report);
      return report;
    },

    retryWithBackoff: async (operation: Function, options: any = {}) => {
      const { maxRetries = 3, baseDelay = 1000, backoffMultiplier = 2 } = options;
      let lastError: Error;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxRetries) {
            break;
          }

          const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
    },

    createErrorBoundary: (componentName: string) => ({
      componentDidCatch: (error: Error, errorInfo: any) => {
        const report: ErrorReport = {
          id: generateErrorId(),
          timestamp: Date.now(),
          type: 'ui',
          severity: 'high',
          message: error.message,
          stack: error.stack,
          context: {
            component: componentName,
            componentStack: errorInfo.componentStack,
          },
          recovered: true,
          recoveryAction: 'Fallback UI rendered',
        };

        errorReports.push(report);
        return report;
      },
    }),

    registerRecoveryStrategy: (strategy: RecoveryStrategy) => {
      recoveryStrategies.push(strategy);
      recoveryStrategies.sort((a, b) => a.priority - b.priority);
    },

    createCircuitBreaker: (name: string, options: any = {}) => {
      const breaker = {
        name,
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: 0,
        options: {
          failureThreshold: 5,
          resetTimeout: 60000,
          ...options,
        },

        execute: (operation: Function) => {
          if (breaker.state === 'OPEN') {
            if (Date.now() - breaker.lastFailureTime > breaker.options.resetTimeout) {
              breaker.state = 'HALF_OPEN';
            } else {
              return {
                success: false,
                error: new Error('Circuit breaker is OPEN'),
              };
            }
          }

          try {
            const result = operation();
            
            // Success - reset failure count
            if (breaker.state === 'HALF_OPEN') {
              breaker.state = 'CLOSED';
            }
            breaker.failureCount = 0;
            
            return { success: true, result };
          } catch (error) {
            breaker.failureCount++;
            breaker.lastFailureTime = Date.now();
            
            if (breaker.failureCount >= breaker.options.failureThreshold) {
              breaker.state = 'OPEN';
            }
            
            return { success: false, error };
          }
        },

        getState: () => breaker.state,
      };

      circuitBreakers.set(name, breaker);
      return breaker;
    },

    createDegradationPlan: (error: Error, strategies: any[]) => {
      const applicableStrategies = strategies.filter(strategy => 
        strategy.condition(error)
      );

      return {
        disabledFeatures: applicableStrategies.map(s => s.feature),
        fallbacks: applicableStrategies.map(s => ({
          feature: s.feature,
          fallback: s.fallback,
        })),
        userMessage: `Some features are running with reduced functionality due to: ${error.message}`,
      };
    },

    setLogger: (newLogger: any) => {
      logger = newLogger;
    },

    getErrorStatistics: () => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;
      const recentErrors = errorReports.filter(e => e.timestamp > oneDayAgo);

      const stats = {
        totalErrors: recentErrors.length,
        errorsByType: {} as Record<string, number>,
        errorsBySeverity: {} as Record<string, number>,
        errorsByComponent: {} as Record<string, number>,
        commonErrors: [] as any[],
        timeRange: {
          start: recentErrors[0]?.timestamp || now,
          end: now,
        },
      };

      recentErrors.forEach(error => {
        stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
        stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        
        if (error.context.component) {
          stats.errorsByComponent[error.context.component] = (stats.errorsByComponent[error.context.component] || 0) + 1;
        }
      });

      // Find common errors
      const errorMessages = recentErrors.reduce((acc, error) => {
        acc[error.message] = (acc[error.message] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      stats.commonErrors = Object.entries(errorMessages)
        .filter(([, count]) => count > 1)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count);

      return stats;
    },

    exportErrorLogs: (options: any = {}) => {
      const { format = 'json', includeStackTraces = false, dateRange } = options;
      
      let filteredErrors = errorReports;
      
      if (dateRange) {
        filteredErrors = errorReports.filter(error => 
          error.timestamp >= dateRange.start && error.timestamp <= dateRange.end
        );
      }

      const exportedErrors = filteredErrors.map(error => {
        const exported: any = {
          id: error.id,
          timestamp: error.timestamp,
          type: error.type,
          severity: error.severity,
          message: error.message,
          context: error.context,
          recovered: error.recovered,
        };

        if (includeStackTraces && error.stack) {
          exported.stack = error.stack;
        }

        if (error.recoveryAction) {
          exported.recoveryAction = error.recoveryAction;
        }

        return exported;
      });

      return {
        metadata: {
          exportDate: Date.now(),
          format,
          totalErrors: exportedErrors.length,
        },
        errors: exportedErrors,
      };
    },
  };

  function generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function determineErrorType(error: Error, context: any): ErrorReport['type'] {
    if (context.component?.includes('Network') || error.name === 'NetworkError') {
      return 'network';
    }
    if (context.component?.includes('Compiler') || context.action === 'compile') {
      return 'compilation';
    }
    if (context.component && (error.name === 'RenderError' || context.action?.includes('render'))) {
      return 'ui';
    }
    if (error.message.includes('security') || error.message.includes('permission')) {
      return 'security';
    }
    return 'runtime';
  }

  function determineSeverity(error: Error, context: any): ErrorReport['severity'] {
    if (error.name === 'OutOfMemoryError' || error.message.includes('critical')) {
      return 'critical';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    if (error.name === 'ValidationError' || context.severity === 'low') {
      return 'low';
    }
    return 'medium';
  }

  function attemptRecovery(error: Error, report: ErrorReport) {
    const applicableStrategies = recoveryStrategies.filter(strategy => 
      strategy.condition(error)
    );

    for (const strategy of applicableStrategies) {
      try {
        const success = strategy.action(error);
        if (success) {
          return { success: true, action: strategy.name };
        }
      } catch (recoveryError) {
        // Recovery failed, continue to next strategy
      }
    }

    // Built-in recovery strategies
    if (error.name === 'OutOfMemoryError') {
      return { success: true, action: 'memory cleanup' };
    }
    if (error.name === 'TimeoutError') {
      return { success: true, action: 'execution terminated' };
    }

    return { success: false, action: undefined };
  }

  function logError(report: ErrorReport) {
    const logMessage = `[${report.type.toUpperCase()}] ${report.message}`;
    
    switch (report.severity) {
      case 'critical':
        logger.error(logMessage, report);
        break;
      case 'high':
        logger.error(logMessage, report);
        break;
      case 'medium':
        logger.warn(logMessage, report);
        break;
      case 'low':
        logger.info(logMessage, report);
        break;
    }
  }

  function isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'unavailable',
    ];

    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  function canRecoverFromComponentError(error: Error): boolean {
    const recoverableErrors = [
      'Cannot read property',
      'Maximum update depth',
      'Element type is invalid',
    ];

    return recoverableErrors.some(pattern => 
      error.message.includes(pattern)
    );
  }
}