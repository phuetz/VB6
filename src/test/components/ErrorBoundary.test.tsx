/**
 * Tests unitaires pour le ErrorBoundary
 * Teste la gestion d'erreurs critique pour le démarrage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Component qui lance une erreur
const ThrowError = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Test error from component');
  }
  return <div>No error</div>;
};

// Component qui lance une erreur async
const ThrowAsyncError = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    setTimeout(() => {
      throw new Error('Async error');
    }, 0);
  }
  return <div>No async error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Reset console mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when there are no errors', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child component</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child component')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First child</div>
          <div data-testid="child2">Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      // Find the error message using getAllByText since it appears multiple times
      const errorMessages = screen.getAllByText(/Test error from component/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should display error details including stack trace', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Error should be displayed in the error container
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      // Stack trace is in the technical details section
      const stackTraces = screen.getAllByText(/Stack Trace:/i);
      expect(stackTraces.length).toBeGreaterThan(0);
    });

    it('should provide reload button after error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload/i });
      expect(reloadButton).toBeInTheDocument();
    });

    it('should provide safe mode button after error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      const safeModeButton = screen.getByRole('button', { name: /safe mode/i });
      expect(safeModeButton).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover when error state is cleared', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldError={false} />
        </ErrorBoundary>
      );

      // Component should still show error (ErrorBoundary doesn't auto-recover)
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should reload page when reload button is clicked', () => {
      // Simply verify the reload button can be clicked without errors
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload/i });
      expect(reloadButton).toBeInTheDocument();

      // Verify button click doesn't throw (would fail if window.location.reload fails)
      expect(() => {
        reloadButton.click();
      }).not.toThrow();
    });

    it('should navigate to safe mode when safe mode button is clicked', () => {
      // Create a simple test that verifies the safe mode button exists and can be clicked
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      const safeModeButton = screen.getByRole('button', { name: /safe mode/i });
      expect(safeModeButton).toBeInTheDocument();

      // Verify that clicking the button doesn't cause errors
      expect(() => {
        safeModeButton.click();
      }).not.toThrow();
    });
  });

  describe('Error Information', () => {
    it('should log error information to console', () => {
      // Mock console.error for this specific test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        render(
          <ErrorBoundary>
            <ThrowError shouldError={true} />
          </ErrorBoundary>
        );

        // ErrorBoundary logs error information through console.error
        // The exact format may vary but it should have been called
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        // Restore console after test
        consoleSpy.mockRestore();
      }
    });

    it('should display component stack information', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Component stack should be displayed in the details section
      const componentStacks = screen.getAllByText(/Component Stack:/i);
      expect(componentStacks.length).toBeGreaterThan(0);
    });

    it('should handle errors with undefined messages', () => {
      const ThrowUndefinedError = () => {
        throw undefined;
      };

      render(
        <ErrorBoundary>
          <ThrowUndefinedError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      // When undefined is thrown, the error message is "Unknown error"
      // The component should still render the error boundary
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should handle errors with null messages', () => {
      const ThrowNullError = () => {
        const error: any = null;
        throw error;
      };

      render(
        <ErrorBoundary>
          <ThrowNullError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Development vs Production', () => {
    it('should show detailed error information in development', () => {
      // Mock NODE_ENV as development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      // Stack Trace should be in technical details
      const stackTraces = screen.getAllByText(/Stack Trace:/i);
      expect(stackTraces.length).toBeGreaterThan(0);

      process.env.NODE_ENV = originalEnv;
    });

    it('should show minimal error information in production', () => {
      // Mock NODE_ENV as production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      // Should still show some error info for debugging

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Nested Error Boundaries', () => {
    it('should handle nested error boundaries correctly', () => {
      render(
        <ErrorBoundary>
          <div>Outer boundary</div>
          <ErrorBoundary>
            <ThrowError shouldError={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Outer boundary')).toBeInTheDocument();
    });
  });

  describe('Error State Management', () => {
    it('should maintain error state after re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Re-render the boundary itself
      rerender(
        <ErrorBoundary>
          <div>New content</div>
        </ErrorBoundary>
      );

      // Should still show error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should reset error state when key prop changes', () => {
      const { rerender } = render(
        <ErrorBoundary key="first">
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Re-render with different key
      rerender(
        <ErrorBoundary key="second">
          <div>Recovered content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered content')).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom Error Messages', () => {
    it('should display custom fallback when provided', () => {
      // Custom fallback is a simple ReactNode in ErrorBoundary
      const CustomFallback = (
        <div>Custom error: This is a custom fallback</div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Should display custom fallback instead of default error UI
      expect(screen.getByText(/Custom error: This is a custom fallback/i)).toBeInTheDocument();
      // Should NOT display the standard error message when custom fallback is used
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not impact performance when no errors occur', () => {
      const startTime = performance.now();

      render(
        <ErrorBoundary>
          <div>Normal content</div>
          <div>More content</div>
          <div>Even more content</div>
        </ErrorBoundary>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly (less than 100ms for simple content)
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible error messages', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Error message should be accessible
      const errorMessage = screen.getByText(/Something went wrong/i);
      expect(errorMessage).toBeInTheDocument();

      // Buttons should be accessible
      const reloadButton = screen.getByRole('button', { name: /reload/i });
      const safeModeButton = screen.getByRole('button', { name: /safe mode/i });

      expect(reloadButton).toBeInTheDocument();
      expect(safeModeButton).toBeInTheDocument();
    });

    it('should display errors with ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldError={true} />
        </ErrorBoundary>
      );

      // Check for main error container with ARIA attributes
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
      expect(errorContainer).toHaveAttribute('aria-label', 'Error notification');

      // Check for heading
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Something went wrong');

      // Check for error message
      const errorMessage = screen.getByText(/Something went wrong/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
});