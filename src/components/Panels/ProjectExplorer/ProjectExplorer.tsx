import React from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { useVB6 } from '../../../context/VB6Context';

const ProjectExplorer: React.FC = () => {
  const { state, dispatch } = useVB6();

  return (
    <div className="flex-1 border-b border-gray-400 flex flex-col max-h-64">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Project - {state.projectName}</span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showProjectExplorer' } })}
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>
      
      <div className="flex-1 p-2 text-xs overflow-y-auto">
        <div className="flex items-center">
          <ChevronDown size={12} />
          <span className="ml-1 font-bold">{state.projectName} ({state.projectName})</span>
        </div>
        
        <div className="ml-4 mt-1">
          <div className="flex items-center">
            <ChevronDown size={12} />
            <span className="ml-1">Forms</span>
          </div>
          
          <div className="ml-4">
            {state.forms.map(form => (
              <div 
                key={form.id}
                className={`flex items-center cursor-pointer hover:bg-gray-200 px-1 ${
                  form.id === state.activeFormId ? 'bg-blue-100' : ''
                }`}
                onClick={() => {
                  // TODO: Set active form
                }}
              >
                <FileText size={12} />
                <span className="ml-1">{form.name} ({form.name})</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center mt-2">
            <ChevronDown size={12} />
            <span className="ml-1">Modules</span>
          </div>
          
          <div className="ml-4">
            {state.modules.map((module: any) => (
              <div 
                key={module.id}
                className="flex items-center cursor-pointer hover:bg-gray-200 px-1"
                onDoubleClick={() => {
                  dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showCodeEditor' } });
                }}
              >
                <FileText size={12} />
                <span className="ml-1">{module.name} ({module.name})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-300">
          <button
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded w-full text-left"
            onClick={() => {
              const formName = prompt('Form name:', `Form${state.forms.length + 1}`);
              if (formName) {
                // TODO: Add form action
              }
            }}
          >
            + Add Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;