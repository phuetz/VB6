import React from 'react';
import { useVB6 } from '../../../context/VB6Context';
import { controlCategories } from '../../../data/controlCategories';

const Toolbox: React.FC = () => {
  const { state, dispatch, createControl } = useVB6();

  const handleToolboxDragStart = (e: React.DragEvent, controlType: string) => {
    if (state.executionMode === 'run') return;

    dispatch({
      type: 'SET_DRAG_STATE',
      payload: { isDragging: true, controlType },
    });

    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('controlType', controlType);
  };

  return (
    <div className="w-48 bg-gray-100 border-r border-gray-400 flex flex-col">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Toolbox</span>
        <button
          onClick={() =>
            dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showToolbox' } })
          }
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>

      <div className="flex border-b border-gray-300">
        {Object.keys(controlCategories).map(tab => (
          <button
            key={tab}
            className={`flex-1 text-xs p-1 ${
              state.selectedToolboxTab === tab
                ? 'bg-white border-b-2 border-blue-600'
                : 'bg-gray-200'
            }`}
            onClick={() =>
              dispatch({
                type: 'TOGGLE_WINDOW',
                payload: { windowName: 'selectedToolboxTab' },
              })
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        <div className="grid grid-cols-2 gap-1">
          {controlCategories[state.selectedToolboxTab]?.map(control => (
            <div
              key={control.type}
              className="bg-gray-200 border border-gray-400 p-2 text-center cursor-pointer hover:bg-gray-300 text-xs select-none"
              draggable={state.executionMode === 'design'}
              onDragStart={e => handleToolboxDragStart(e, control.type)}
              onDragEnd={() =>
                dispatch({
                  type: 'SET_DRAG_STATE',
                  payload: { isDragging: false },
                })
              }
              onDoubleClick={() => state.executionMode === 'design' && createControl(control.type)}
              title={control.name}
            >
              <div className="text-lg mb-1">{control.icon}</div>
              <div className="text-xs">{control.name}</div>
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
};

export default Toolbox;
