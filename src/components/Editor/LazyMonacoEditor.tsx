/**
 * Lazy-loaded Monaco Editor wrapper component
 * This component uses React.lazy() and code splitting to load Monaco Editor
 * only when needed, reducing initial bundle size by ~4.7MB
 */
import React, { Suspense } from 'react';

// Lazy load the Monaco Editor component
const MonacoCodeEditor = React.lazy(() => import('./MonacoCodeEditor'));

/**
 * Loading fallback component displayed while Monaco Editor loads
 */
const EditorLoadingFallback: React.FC = () => (
  <div className="flex-1 bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <div className="text-gray-600">Loading Code Editor...</div>
      <div className="text-xs text-gray-400 mt-2">Initializing Monaco Editor</div>
    </div>
  </div>
);

/**
 * Error boundary for Monaco loading failures
 */
class MonacoErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h3 className="text-red-600 text-lg font-semibold mb-2">Failed to Load Code Editor</h3>
            <p className="text-gray-600 text-sm mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy Monaco Editor with Suspense boundary and error handling
 */
const LazyMonacoEditor: React.FC = () => {
  return (
    <MonacoErrorBoundary>
      <Suspense fallback={<EditorLoadingFallback />}>
        <MonacoCodeEditor />
      </Suspense>
    </MonacoErrorBoundary>
  );
};

export default LazyMonacoEditor;
