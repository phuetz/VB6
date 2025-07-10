import React from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { Bug } from 'lucide-react';

const StatusBar: React.FC = () => {
  const { 
    executionMode, 
    selectedControls, 
    errorList, 
    logs,
    showLogPanel,
    toggleWindow 
  } = useVB6Store();
  
  // Get error counts for status bar
  const errorCount = logs.filter(l => l.level === 'error').length;
  const warningCount = logs.filter(l => l.level === 'warn').length;
  const lastLog = logs[logs.length - 1];

  return (
    <div className="h-6 bg-gray-200 border-t border-gray-400 flex items-center px-2 text-xs">
      <span>
        {executionMode === 'run' ? '▶ Running...' : 
         executionMode === 'break' ? '⏸ Break' : '■ Design mode'}
      </span>
      
      {selectedControls.length > 0 && (
        <span className="ml-4">
          {selectedControls.length === 1 
            ? `${selectedControls[0].name}: ${selectedControls[0].x}, ${selectedControls[0].y}, ${selectedControls[0].width} x ${selectedControls[0].height}`
            : `${selectedControls.length} controls selected`
          }
        </span>
      )}
      
      {errorList.length > 0 && (
        <span className="ml-4 text-red-600">
          {errorList.filter(e => e.type === 'error').length} errors, {errorList.filter(e => e.type === 'warning').length} warnings
        </span>
      )}
      
      {errorCount > 0 || warningCount > 0 && (
        <span className="ml-4">
          <button 
            onClick={() => toggleWindow('showLogPanel')}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:bg-gray-300"
            title="Show Debug Logs"
          >
            <Bug size={12} className={showLogPanel ? "text-green-600" : "text-gray-600"} />
            {errorCount > 0 && <span className="text-red-600">{errorCount} errors</span>}
            {errorCount > 0 && warningCount > 0 && <span>, </span>}
            {warningCount > 0 && <span className="text-yellow-600">{warningCount} warnings</span>}
          </button>
        </span>
      )}
      
      {/* Latest log message */}
      {lastLog && (
        <span className="ml-2 truncate max-w-md text-gray-500 italic overflow-hidden">
          Last: {lastLog.message}
        </span>
      )}
      
      <span className="ml-auto">
        {showCodeEditor && selectedControls.length === 1 && `${selectedControls[0].name}` }
        <span className="mx-1">|</span>
        Ln 1, Col 1
      </span>
    </div>
  );
};

export default StatusBar;