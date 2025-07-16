import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useVB6 } from '../../../context/VB6Context';

const ControlTree: React.FC = () => {
  const { state, selectControls, dispatch } = useVB6();
  const [expandedForms, setExpandedForms] = useState<Set<number>>(new Set([state.activeFormId]));

  const toggleForm = useCallback((formId: number) => {
    setExpandedForms(prev => {
      const next = new Set(prev);
      if (next.has(formId)) {
        next.delete(formId);
      } else {
        next.add(formId);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex-1 border-b border-gray-400 flex flex-col max-h-64">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Controls</span>
        <button
          onClick={() =>
            dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showControlTree' } })
          }
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1 text-xs">
        {state.forms.map(form => (
          <div key={form.id} className="mb-1">
            <div
              className="flex items-center cursor-pointer px-1 hover:bg-gray-200"
              onClick={() => toggleForm(form.id)}
            >
              {expandedForms.has(form.id) ? (
                <ChevronDown size={12} className="mr-1" />
              ) : (
                <ChevronRight size={12} className="mr-1" />
              )}
              <span className={form.id === state.activeFormId ? 'font-bold' : ''}>{form.name}</span>
            </div>
            {expandedForms.has(form.id) && (
              <div className="ml-4">
                {state.controls
                  .filter(c => !c.formId || c.formId === form.id)
                  .map(control => (
                    <div
                      key={control.id}
                      className="cursor-pointer px-1 hover:bg-gray-200"
                      onClick={() => {
                        selectControls([control.id]);
                        dispatch({ type: 'SET_ACTIVE_FORM', payload: { id: form.id } });
                      }}
                    >
                      {control.name} ({control.type})
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlTree;
