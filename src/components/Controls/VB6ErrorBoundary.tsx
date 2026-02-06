/**
 * VB6 Error Boundary Component
 * Prevents control errors from crashing the entire form designer
 *
 * Features:
 * - Catches JavaScript errors in child components
 * - Displays user-friendly error messages
 * - Provides recovery options
 * - Logs errors for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  controlName?: string;
  controlType?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isExpanded: boolean;
}

export class VB6ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExpanded: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console with VB6-style formatting
    console.error(
      `[VB6 Runtime Error] Control: ${this.props.controlName || 'Unknown'}\n` +
        `Type: ${this.props.controlType || 'Unknown'}\n` +
        `Error: ${error.message}\n` +
        `Stack: ${errorInfo.componentStack}`
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isExpanded: false,
    });
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ isExpanded: !prev.isExpanded }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error display
      return (
        <div
          style={{
            border: '2px solid #CC0000',
            backgroundColor: '#FFEEEE',
            padding: '8px',
            margin: '2px',
            fontFamily: 'MS Sans Serif, Arial, sans-serif',
            fontSize: '11px',
            minWidth: '100px',
            minHeight: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#CC0000', fontWeight: 'bold' }}>!</span>
            <span style={{ color: '#CC0000' }}>Error in {this.props.controlName || 'Control'}</span>
          </div>

          {this.props.showDetails && (
            <>
              <div style={{ marginTop: '4px' }}>
                <button
                  onClick={this.toggleDetails}
                  style={{
                    background: '#E0E0E0',
                    border: '1px solid #808080',
                    padding: '2px 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    marginRight: '4px',
                  }}
                >
                  {this.state.isExpanded ? 'Hide Details' : 'Show Details'}
                </button>
                <button
                  onClick={this.handleRetry}
                  style={{
                    background: '#E0E0E0',
                    border: '1px solid #808080',
                    padding: '2px 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>

              {this.state.isExpanded && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '4px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CCCCCC',
                    maxHeight: '100px',
                    overflow: 'auto',
                    fontSize: '10px',
                    fontFamily: 'Consolas, monospace',
                  }}
                >
                  <div style={{ color: '#CC0000' }}>{this.state.error?.message}</div>
                  {this.state.error?.stack && (
                    <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-Order Component to wrap any control with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  controlType: string
): React.FC<P & { name?: string }> {
  return function WithErrorBoundary(props: P & { name?: string }) {
    return (
      <VB6ErrorBoundary
        controlName={props.name || controlType}
        controlType={controlType}
        showDetails={true}
      >
        <WrappedComponent {...props} />
      </VB6ErrorBoundary>
    );
  };
}

/**
 * Inline error boundary for quick wrapping
 */
export const SafeControl: React.FC<{
  children: ReactNode;
  name?: string;
  type?: string;
}> = ({ children, name, type }) => (
  <VB6ErrorBoundary controlName={name} controlType={type} showDetails={true}>
    {children}
  </VB6ErrorBoundary>
);

export default VB6ErrorBoundary;
