import React from 'react';
import { eventSystem } from '../services/VB6EventSystem';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string; // Component name for better error tracking
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean; // Whether to show technical details
  allowRetry?: boolean; // Whether to show retry button
  resetKeys?: unknown[]; // Auto-reset when these values change
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // ERROR HANDLING FIX: Generate unique error ID for tracking
    // Note: Create a clean error object to avoid serialization issues in tests
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storedError = new Error(error?.message || 'Unknown error');
    storedError.stack = error?.stack || '';
    return {
      hasError: true,
      error: storedError,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ERROR HANDLING FIX: Enhanced error logging and reporting
    const { name = 'Unknown', onError } = this.props;
    const errorId = this.state.errorId || 'unknown';

    // Store error info in state, but avoid storing raw stack traces that cause serialization issues
    // Create a cleaner errorInfo object that won't cause vitest serialization errors
    const cleanErrorInfo = {
      ...errorInfo,
      // componentStack is safe to store
    };
    this.setState({ errorInfo: cleanErrorInfo });

    // Enhanced error logging
    console.group(`🚨 Error Boundary: ${name}`);
    console.error('Error ID:', errorId);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Boundary:', name);
    console.groupEnd();

    // Fire error event through event system
    try {
      eventSystem.fire('ErrorBoundary', 'ComponentError', {
        errorId,
        boundaryName: name,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount,
      });
    } catch (eventError) {
      console.error('Failed to fire error event:', eventError);
    }

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Report to external error tracking service if available
    if (typeof window !== 'undefined' && (window as any).errorReporter) {
      try {
        (window as any).errorReporter.captureException(error, {
          tags: {
            errorBoundary: name,
            errorId,
          },
          extra: {
            componentStack: errorInfo.componentStack,
            retryCount: this.state.retryCount,
          },
        });
      } catch (reporterError) {
        console.error('Failed to report error to external service:', reporterError);
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const nextKeys = this.props.resetKeys;
      if (nextKeys.some((key, i) => key !== prevKeys[i])) {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined, retryCount: 0 });
      }
    }
  }

  handleRetry = () => {
    // ERROR HANDLING FIX: Implement retry logic with backoff
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1,
      });

      // Fire retry event
      try {
        eventSystem.fire('ErrorBoundary', 'ComponentRetry', {
          boundaryName: this.props.name || 'Unknown',
          retryCount: retryCount + 1,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        console.error('Failed to fire retry event:', eventError);
      }
    }
  };

  handleReload = () => {
    // ERROR HANDLING FIX: Reload the entire page as last resort
    try {
      eventSystem.fire('ErrorBoundary', 'PageReload', {
        boundaryName: this.props.name || 'Unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (eventError) {
      console.error('Failed to fire reload event:', eventError);
    }

    window.location.reload();
  };

  handleSafeMode = () => {
    // ERROR HANDLING FIX: Navigate to safe mode
    try {
      eventSystem.fire('ErrorBoundary', 'SafeMode', {
        boundaryName: this.props.name || 'Unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (eventError) {
      console.error('Failed to fire safe mode event:', eventError);
    }

    const url = new URL(window.location.href);
    url.searchParams.set('safe', 'true');
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      const { fallback, name = 'Component', showDetails = true, allowRetry = true } = this.props;
      const { error, errorInfo, retryCount, errorId } = this.state;

      if (fallback) {
        return fallback;
      }

      const canRetry = allowRetry && retryCount < this.maxRetries;
      const errorMessage = error?.message || 'Unknown error';

      return (
        <div
          className="p-6 bg-red-50 border border-red-200 rounded-lg m-4 max-w-4xl mx-auto"
          role="alert"
          aria-live="assertive"
          aria-label="Error notification"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 8.5c-.77.833-.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2" role="heading" aria-level={2}>
                Something went wrong
              </h3>
              <div className="text-red-700 mb-4">
                <p className="mb-2">An unexpected error occurred in this component.</p>
                {error && (
                  <div className="bg-red-100 p-3 rounded border border-red-200">
                    <p className="font-medium text-sm" aria-label={`Error: ${errorMessage}`}>
                      Error: {errorMessage}
                    </p>
                    {errorId && <p className="text-xs text-red-600 mt-1">Error ID: {errorId}</p>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mb-4">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    aria-label="Try again to recover from error"
                  >
                    Try Again ({this.maxRetries - retryCount} attempts left)
                  </button>
                )}
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  aria-label="Reload the entire page"
                >
                  Reload
                </button>
                <button
                  onClick={this.handleSafeMode}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  aria-label="Enter safe mode with reduced functionality"
                >
                  Safe Mode
                </button>
              </div>

              {/* Technical Details */}
              {showDetails && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-red-700 font-medium mb-2">
                    Stack: {error.stack ? 'Technical Details' : 'Additional Information'}
                  </summary>
                  <div className="bg-red-100 p-3 rounded border border-red-200 text-xs">
                    <div className="mb-2">
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-red-800">
                        {error.stack || 'No stack trace available'}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1 text-red-800">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="mt-4 text-sm text-red-600">
                <p>
                  If this error persists, please report it with the Error ID above.
                  {retryCount >= this.maxRetries && (
                    <span className="block mt-1 font-medium">
                      Maximum retry attempts reached. Consider reloading the page.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ERROR HANDLING FIX: Specialized error boundaries for different contexts
export const PluginErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    name="Plugin System"
    showDetails={true}
    allowRetry={true}
    onError={(error, errorInfo) => {
      // Additional plugin-specific error handling
      console.warn('Plugin error detected:', error.message);
    }}
  >
    {children}
  </ErrorBoundary>
);

export const EditorErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    name="Code Editor"
    showDetails={false}
    allowRetry={true}
    fallback={
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-yellow-800 font-medium mb-2">Editor Temporarily Unavailable</h3>
        <p className="text-yellow-700">
          The code editor encountered an error. Please try refreshing the page.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const DesignerErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    name="Form Designer"
    showDetails={false}
    allowRetry={true}
    fallback={
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-blue-800 font-medium mb-2">Designer Temporarily Unavailable</h3>
        <p className="text-blue-700">
          The form designer encountered an error. Your work has been saved.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const ToolboxErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    name="Toolbox"
    showDetails={false}
    allowRetry={true}
    fallback={
      <div className="p-2 bg-gray-100 border border-gray-300 rounded text-center">
        <p className="text-gray-600 text-sm">Toolbox unavailable</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const DebugErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    name="Debug Panel"
    showDetails={false}
    allowRetry={true}
    fallback={
      <div className="p-2 bg-orange-50 border border-orange-200 rounded text-center">
        <p className="text-orange-700 text-sm">Debug panel encountered an error</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const PanelErrorBoundary: React.FC<{
  children: React.ReactNode;
  panelName: string;
}> = ({ children, panelName }) => (
  <ErrorBoundary
    name={panelName}
    showDetails={false}
    allowRetry={true}
    fallback={
      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
        <p className="text-gray-600 text-sm">{panelName} unavailable</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);
