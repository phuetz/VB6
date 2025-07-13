import React from 'react';
import { useVB6 } from '../../../context/VB6Context';

const ControlTree: React.FC = () => {
  const { state, selectControls, dispatch } = useVB6();
  const activeFormId = state.activeFormId;
  const controls = state.controls.filter(c => !c.formId || c.formId === activeFormId);

  return (
    <div className="flex-1 border-b border-gray-400 flex flex-col max-h-64">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Controls</span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showControlTree' } })}
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1 text-xs">
        {controls.map(control => (
          <div
            key={control.id}
            className="cursor-pointer px-1 hover:bg-gray-200"
            onClick={() => selectControls([control.id])}
          >
            {control.name} ({control.type})
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlTree;
