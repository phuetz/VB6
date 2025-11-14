/**
 * Lazy-loaded Monaco Editor wrapper component
 * This component uses React.lazy() and code splitting to load Monaco Editor
 * only when needed, reducing initial bundle size by ~10MB
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
 * Lazy Monaco Editor with Suspense boundary
 * This component automatically handles code splitting and lazy loading
 */
const LazyMonacoEditor: React.FC = () => {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <MonacoCodeEditor />
    </Suspense>
  );
};

export default LazyMonacoEditor;
