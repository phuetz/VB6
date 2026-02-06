import React from 'react';
// ULTRA-OPTIMIZED: Import domain-specific stores
import { useUIStore } from '../../stores/UIStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import { useDebugStore, debugSelectors } from '../../stores/DebugStore';
import { useVB6Store } from '../../stores/vb6Store'; // Keep for legacy features
import { shallow } from 'zustand/shallow';
import { Bug } from 'lucide-react';

const StatusBar: React.FC = () => {
  // ULTRA-OPTIMIZED: Use domain-specific stores
  const { executionMode, showLogPanel, showCodeEditor, toggleWindow } = useUIStore();
  const { selectedControls } = useDesignerStore();
  // PERFORMANCE FIX: Use shallow selector
  const { errorList, logs } = useVB6Store(
    state => ({ errorList: state.errorList, logs: state.logs }),
    shallow
  );

  // CRITICAL: Safe access to logs array
  const safeErrorList = errorList || [];
  const safeLogs = logs || [];

  // Get error counts for status bar
  const errorCount = safeLogs.filter(l => l?.level === 'error').length;
  const warningCount = safeLogs.filter(l => l?.level === 'warn').length;
  const lastLog = safeLogs[safeLogs.length - 1];

  return (
    <div
      className="h-6 bg-gray-200 border-t border-gray-400 flex items-center px-2 text-xs"
      role="status"
      aria-live="polite"
      aria-label="Application Status"
    >
      <span>
        {executionMode === 'run'
          ? '▶ Running...'
          : executionMode === 'break'
            ? '⏸ Break'
            : '■ Design mode'}
      </span>

      {selectedControls && selectedControls.length > 0 && (
        <span className="ml-4">
          {selectedControls.length === 1
            ? `${selectedControls[0]?.name || 'Control'}: ${selectedControls[0]?.x || 0}, ${selectedControls[0]?.y || 0}, ${selectedControls[0]?.width || 0} x ${selectedControls[0]?.height || 0}`
            : `${selectedControls.length} controls selected`}
        </span>
      )}

      {safeErrorList.length > 0 && (
        <span className="ml-4 text-red-600">
          {safeErrorList.filter(e => e?.type === 'error').length} errors,{' '}
          {safeErrorList.filter(e => e?.type === 'warning').length} warnings
        </span>
      )}

      {errorCount > 0 ||
        (warningCount > 0 && (
          <span className="ml-4">
            <button
              onClick={() => toggleWindow('showLogPanel')}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:bg-gray-300"
              title="Show Debug Logs"
              aria-label="Show Debug Logs"
            >
              <Bug size={12} className={showLogPanel ? 'text-green-600' : 'text-gray-600'} />
              {errorCount > 0 && <span className="text-red-600">{errorCount} errors</span>}
              {errorCount > 0 && warningCount > 0 && <span>, </span>}
              {warningCount > 0 && <span className="text-yellow-600">{warningCount} warnings</span>}
            </button>
          </span>
        ))}

      {/* Latest log message */}
      {lastLog && (
        <span className="ml-2 truncate max-w-md text-gray-500 italic overflow-hidden">
          Last: {lastLog.message}
        </span>
      )}

      <span className="ml-auto">
        {showCodeEditor && selectedControls.length === 1 && `${selectedControls[0].name}`}
        <span className="mx-1">|</span>
        Ln 1, Col 1
      </span>
    </div>
  );
};

export default StatusBar;
