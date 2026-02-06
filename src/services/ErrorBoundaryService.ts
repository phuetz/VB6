/**
 * Error Boundary Service
 * Advanced error handling and resilience for VB6 Studio
 */

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
  buildVersion: string;
  feature: string;
  action?: string;
  props?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  errorInfo: ErrorInfo;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  stackTrace: string;
  breadcrumbs: ErrorBreadcrumb[];
}

export interface ErrorBreadcrumb {
  timestamp: number;
  message: string;
  category: 'navigation' | 'user' | 'console' | 'network' | 'dom';
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

import { appVersion } from '@/config/env';
import { logEvent } from '@/logging/logger';

export interface RecoveryStrategy {
  id: string;
  name: string;
  condition: (error: Error, context: ErrorContext) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<boolean>;
  fallback?: () => React.ComponentType;
}

export class ErrorBoundaryService {
  private errorHistory: ErrorReport[] = [];
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private recoveryStrategies: RecoveryStrategy[] = [];
  private errorListeners: ((report: ErrorReport) => void)[] = [];
  private maxBreadcrumbs = 50;
  private maxErrorHistory = 100;
  private sessionId: string;
  private originalFetch?: typeof window.fetch;
  private eventHandlers: Array<{ element: EventTarget; event: string; handler: EventListener }> =
    [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Add error breadcrumb
   */
  addBreadcrumb(
    message: string,
    category: ErrorBreadcrumb['category'],
    level: ErrorBreadcrumb['level'] = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: ErrorBreadcrumb = {
      timestamp: Date.now(),
      message,
      category,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Handle error with full context
   */
  async handleError(
    error: Error,
    errorInfo: ErrorInfo,
    feature: string,
    props?: Record<string, any>
  ): Promise<boolean> {
    const context: ErrorContext = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      buildVersion: appVersion,
      feature,
      props,
    };

    const report = this.createErrorReport(error, errorInfo, context);

    // Add to history
    this.errorHistory.push(report);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }

    // Add error breadcrumb
    this.addBreadcrumb(`Error in ${feature}: ${error.message}`, 'console', 'error', {
      stack: error.stack,
      props,
    });

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(report);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Try recovery strategies
    const recovered = await this.attemptRecovery(error, context);

    // Log error if not recovered
    if (!recovered) {
      this.logError(report);
    }

    return recovered;
  }

  /**
   * Register recovery strategy
   */
  registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (report: ErrorReport) => void): () => void {
    this.errorListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByFeature: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recoverableErrors: number;
    recentErrors: ErrorReport[];
  } {
    const errorsByFeature: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    let recoverableErrors = 0;

    this.errorHistory.forEach(report => {
      // By feature
      errorsByFeature[report.context.feature] = (errorsByFeature[report.context.feature] || 0) + 1;

      // By severity
      errorsBySeverity[report.severity] = (errorsBySeverity[report.severity] || 0) + 1;

      // Recoverable count
      if (report.recoverable) {
        recoverableErrors++;
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByFeature,
      errorsBySeverity,
      recoverableErrors,
      recentErrors: this.errorHistory.slice(-10),
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.breadcrumbs = [];
  }

  /**
   * Export error data for debugging
   */
  exportErrorData(): string {
    const data = {
      sessionId: this.sessionId,
      errors: this.errorHistory,
      breadcrumbs: this.breadcrumbs,
      statistics: this.getErrorStatistics(),
      timestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Create error fallback component
   */
  createErrorFallback(
    title: string = 'Something went wrong',
    message: string = 'An unexpected error occurred',
    showDetails: boolean = false
  ): React.ComponentType<{ error?: Error; errorInfo?: ErrorInfo; retry?: () => void }> {
    return ({ error, errorInfo, retry }) => {
      const [showDebug, setShowDebug] = React.useState(false);

      return React.createElement(
        'div',
        {
          style: {
            padding: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe0e0',
            margin: '20px',
            fontFamily: 'Arial, sans-serif',
          },
        },
        [
          React.createElement(
            'h2',
            { key: 'title', style: { color: '#d63031', marginTop: 0 } },
            title
          ),
          React.createElement('p', { key: 'message', style: { color: '#2d3436' } }, message),

          retry &&
            React.createElement(
              'button',
              {
                key: 'retry',
                onClick: retry,
                style: {
                  padding: '8px 16px',
                  backgroundColor: '#0984e3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px',
                },
              },
              'Try Again'
            ),

          showDetails &&
            React.createElement(
              'button',
              {
                key: 'debug',
                onClick: () => setShowDebug(!showDebug),
                style: {
                  padding: '8px 16px',
                  backgroundColor: '#636e72',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                },
              },
              showDebug ? 'Hide Details' : 'Show Details'
            ),

          showDebug &&
            error &&
            React.createElement(
              'details',
              {
                key: 'details',
                style: { marginTop: '15px' },
              },
              [
                React.createElement('summary', { key: 'summary' }, 'Error Details'),
                React.createElement(
                  'pre',
                  {
                    key: 'stack',
                    style: {
                      backgroundColor: '#2d3436',
                      color: '#ddd',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      marginTop: '10px',
                    },
                  },
                  error.stack
                ),
              ]
            ),
        ]
      );
    };
  }

  // Private methods

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled promise rejection');
      error.stack = event.reason?.stack;

      this.handleError(error, { componentStack: '' }, 'promise-rejection');
    };
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    this.eventHandlers.push({
      element: window,
      event: 'unhandledrejection',
      handler: unhandledRejectionHandler as EventListener,
    });

    // Global JavaScript errors
    const errorHandler = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;

      this.handleError(error, { componentStack: '' }, 'global-error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };
    window.addEventListener('error', errorHandler);
    this.eventHandlers.push({
      element: window,
      event: 'error',
      handler: errorHandler as EventListener,
    });

    // Navigation tracking
    const popstateHandler = () => {
      this.addBreadcrumb('Navigation: popstate', 'navigation', 'info', {
        url: window.location.href,
      });
    };
    window.addEventListener('popstate', popstateHandler);
    this.eventHandlers.push({ element: window, event: 'popstate', handler: popstateHandler });

    // Network error tracking
    this.originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await this.originalFetch!(...args);

        if (!response.ok) {
          this.addBreadcrumb(`Network error: ${response.status}`, 'network', 'error', {
            url: args[0],
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        this.addBreadcrumb(`Network failure: ${error.message}`, 'network', 'error', {
          url: args[0],
          error: error.message,
        });
        throw error;
      }
    };
  }

  private createErrorReport(
    error: Error,
    errorInfo: ErrorInfo,
    context: ErrorContext
  ): ErrorReport {
    const severity = this.determineErrorSeverity(error, context);
    const recoverable = this.isErrorRecoverable(error, context);

    return {
      id: this.generateErrorId(),
      error,
      errorInfo,
      context,
      severity,
      recoverable,
      stackTrace: error.stack || '',
      breadcrumbs: [...this.breadcrumbs],
    };
  }

  private determineErrorSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    // Critical errors
    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk') ||
      error.name === 'ChunkLoadError'
    ) {
      return 'critical';
    }

    // Network-related errors
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return 'medium';
    }

    // Component errors in core features
    if (
      context.feature.includes('compiler') ||
      context.feature.includes('designer') ||
      context.feature.includes('editor')
    ) {
      return 'high';
    }

    // UI-related errors
    if (context.feature.includes('ui') || context.feature.includes('panel')) {
      return 'medium';
    }

    return 'low';
  }

  private isErrorRecoverable(error: Error, context: ErrorContext): boolean {
    // Network errors are often recoverable
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return true;
    }

    // Component-specific errors in non-critical areas
    if (!context.feature.includes('compiler') && !context.feature.includes('core')) {
      return true;
    }

    // Chunk loading errors can be recovered by reload
    if (error.name === 'ChunkLoadError') {
      return true;
    }

    return false;
  }

  private async attemptRecovery(error: Error, context: ErrorContext): Promise<boolean> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.condition(error, context)) {
        try {
          const recovered = await strategy.recover(error, context);
          if (recovered) {
            this.addBreadcrumb(`Recovery successful: ${strategy.name}`, 'console', 'info', {
              strategy: strategy.id,
            });
            return true;
          }
        } catch (recoveryError) {
          console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError);
        }
      }
    }

    return false;
  }

  private registerDefaultRecoveryStrategies(): void {
    // Chunk loading error recovery
    this.registerRecoveryStrategy({
      id: 'chunk-reload',
      name: 'Chunk Reload Recovery',
      condition: error =>
        error.name === 'ChunkLoadError' || error.message.includes('Loading chunk'),
      recover: async () => {
        window.location.reload();
        return true;
      },
    });

    // Network error retry
    this.registerRecoveryStrategy({
      id: 'network-retry',
      name: 'Network Retry Recovery',
      condition: error => error.message.includes('NetworkError') || error.message.includes('fetch'),
      recover: async (error, context) => {
        // Wait a bit and retry the action
        await new Promise(resolve => setTimeout(resolve, 1000));

        // If there's a retry action in context, use it
        if (context.action === 'retry') {
          return true;
        }

        return false;
      },
    });

    // Component reset recovery
    this.registerRecoveryStrategy({
      id: 'component-reset',
      name: 'Component Reset Recovery',
      condition: (error, context) =>
        !context.feature.includes('compiler') && !context.feature.includes('core'),
      recover: async () => {
        // Reset component state by forcing re-render
        // This would be implemented by the actual error boundary
        return true;
      },
    });
  }

  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private logError(report: ErrorReport): void {
    const logLevel =
      report.severity === 'critical'
        ? 'error'
        : report.severity === 'high'
          ? 'error'
          : report.severity === 'medium'
            ? 'warn'
            : 'info';

    console[logLevel]('VB6 Studio Error Report:', {
      id: report.id,
      feature: report.context.feature,
      severity: report.severity,
      message: report.error.message,
      stack: report.stackTrace,
      context: report.context,
      breadcrumbs: report.breadcrumbs.slice(-5), // Last 5 breadcrumbs
    });

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorReport(report);
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // This would send to your error reporting service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  /**
   * Clean up all event listeners and restore original functions
   */
  public destroy(): void {
    // Remove all event listeners
    this.eventHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventHandlers = [];

    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = undefined;
    }

    // Clear data
    this.errorHistory = [];
    this.breadcrumbs = [];
    this.errorListeners = [];
  }
}

// Export singleton instance
export const errorBoundaryService = new ErrorBoundaryService();

// React integration
import React from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: ErrorInfo; retry?: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class VB6ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Handle error through service
    errorBoundaryService.handleError(error, errorInfo, this.props.feature);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent =
        this.props.fallback ||
        errorBoundaryService.createErrorFallback(
          `Error in ${this.props.feature}`,
          'This component encountered an error and could not render.',
          process.env.NODE_ENV === 'development'
        );

      return React.createElement(FallbackComponent, {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        retry: this.retry,
      });

      // Emit structured client log (non-blocking)
      try {
        logEvent('errors', 'error', report.error.message, {
          id: report.id,
          severity: report.severity,
          recoverable: report.recoverable,
          feature: report.context.feature,
          url: report.context.url,
          stack: report.stackTrace?.slice(0, 2000),
        });
      } catch {
        // Error reporting failed, ignore
      }
    }

    return this.props.children;
  }
}
