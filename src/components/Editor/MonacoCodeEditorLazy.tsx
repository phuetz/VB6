import React, { lazy, Suspense } from 'react';
import { Activity } from 'lucide-react';

// ULTRA-OPTIMIZED: Lazy load Monaco Editor to reduce initial bundle by 4.7MB
const MonacoCodeEditor = lazy(() => 
  import('./MonacoCodeEditor').then(module => ({
    default: module.default
  }))
);

// Loading fallback component
const MonacoLoadingFallback: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">Loading Code Editor...</h3>
        <p className="text-gray-400 text-sm">
          Initializing Monaco Editor (4.7MB)
        </p>
        <div className="mt-4 w-64 bg-gray-800 rounded-full h-2 mx-auto overflow-hidden">
          <div className="bg-blue-500 h-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
};

// Error boundary for Monaco loading failures
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
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h3 className="text-red-500 text-lg font-semibold mb-2">
              Failed to Load Code Editor
            </h3>
            <p className="text-gray-400 text-sm mb-4">
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

// ULTRA-OPTIMIZED: Lazy-loaded Monaco wrapper
export const MonacoCodeEditorLazy: React.FC = () => {
  return (
    <MonacoErrorBoundary>
      <Suspense fallback={<MonacoLoadingFallback />}>
        <MonacoCodeEditor />
      </Suspense>
    </MonacoErrorBoundary>
  );
};

export default MonacoCodeEditorLazy;