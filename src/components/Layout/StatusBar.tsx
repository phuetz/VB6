import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const StatusBar: React.FC = () => {
  const { state } = useVB6();

  return (
    <div className="h-6 bg-gray-200 border-t border-gray-400 flex items-center px-2 text-xs">
      <span>
        {state.executionMode === 'run' ? '▶ Running...' : 
         state.executionMode === 'break' ? '⏸ Break' : '■ Design mode'}
      </span>
      
      {state.selectedControls.length > 0 && (
        <span className="ml-4">
          {state.selectedControls.length === 1 
            ? `${state.selectedControls[0].name}: ${state.selectedControls[0].x}, ${state.selectedControls[0].y}, ${state.selectedControls[0].width} x ${state.selectedControls[0].height}`
            : `${state.selectedControls.length} controls selected`
          }
        </span>
      )}
      
      {state.errorList.length > 0 && (
        <span className="ml-4 text-red-600">
          {state.errorList.filter(e => e.type === 'error').length} errors, {state.errorList.filter(e => e.type === 'warning').length} warnings
        </span>
      )}
      
      <span className="ml-auto">
        {state.showCodeEditor && state.selectedControls.length === 1 && `${state.selectedControls[0].name}.${state.selectedEvent} | `}
        Ln 1, Col 1
      </span>
    </div>
  );
};

export default StatusBar;