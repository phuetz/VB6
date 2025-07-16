import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const projectTemplates = [
  { name: 'Standard EXE', description: 'A standard Windows application', icon: '🖥️' },
  { name: 'ActiveX DLL', description: 'An ActiveX dynamic-link library', icon: '📚' },
  { name: 'ActiveX Control', description: 'An ActiveX control project', icon: '🎛️' },
  { name: 'Data Project', description: 'A database application', icon: '🗄️' },
  {
    name: 'IIS Application',
    description: 'An Internet Information Server application',
    icon: '🌐',
  },
  { name: 'Add-In', description: 'A Visual Basic Add-In', icon: '🔌' },
];

const NewProjectDialog: React.FC = () => {
  const { dispatch } = useVB6();

  const handleClose = () => {
    dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showNewProjectDialog', show: false } });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '500px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>New Project</span>
          <button onClick={handleClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="bg-white border border-gray-400 p-4 mb-4 h-64 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              {projectTemplates.map((template, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center cursor-pointer hover:bg-blue-100 p-2 rounded"
                  onDoubleClick={handleClose}
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <div className="text-xs text-center">{template.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 border border-gray-400 p-2 text-xs mb-4">
            Select a project template
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={handleClose}
            >
              OK
            </button>
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectDialog;
