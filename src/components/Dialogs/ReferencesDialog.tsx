import React from 'react';
import { useVB6 } from '../../context/VB6Context';
import { useWindowStore } from '../../stores/windowStore';

const ReferencesDialog: React.FC = () => {
  const { state } = useVB6();
  const windowShowDialog = useWindowStore(state => state.showDialog);

  const handleClose = () => {
    windowShowDialog('showReferences', false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '500px', height: '400px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>References - {state.projectName}</span>
          <button onClick={handleClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 flex flex-col h-full">
          <div className="bg-white border border-gray-400 flex-1 overflow-y-auto mb-4">
            {state.references.map((ref: any, index: number) => (
              <div key={index} className="flex items-start p-1 hover:bg-gray-100 text-xs">
                <input
                  type="checkbox"
                  checked={ref.checked}
                  disabled={ref.builtin}
                  className="mr-2 mt-1"
                />
                <div className="flex-1">
                  <div className={ref.checked ? 'font-bold' : ''}>{ref.name}</div>
                  <div className="text-gray-600">{ref.location}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-100 border border-gray-400 p-2 text-xs mb-4 h-16">
            Location: <span className="font-mono">C:\Windows\System32\</span>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400">
              Browse...
            </button>
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

export default ReferencesDialog;
