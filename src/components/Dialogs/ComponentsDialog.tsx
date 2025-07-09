import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const ComponentsDialog: React.FC = () => {
  const { state, dispatch } = useVB6();

  const handleClose = () => {
    dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showComponents', show: false } });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '550px', height: '450px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Components</span>
          <button onClick={handleClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>
        
        <div className="p-4 flex flex-col h-full">
          <div className="flex gap-2 mb-2">
            <button className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs">Controls</button>
            <button className="px-2 py-1 bg-gray-100 border border-gray-400 text-xs">Designers</button>
            <button className="px-2 py-1 bg-gray-100 border border-gray-400 text-xs">Insertable Objects</button>
          </div>
          
          <div className="bg-white border border-gray-400 flex-1 overflow-y-auto mb-4">
            {state.components.map((comp: any, index: number) => (
              <div key={index} className="flex items-center p-1 hover:bg-gray-100 text-xs">
                <input 
                  type="checkbox" 
                  checked={comp.checked}
                  className="mr-2"
                />
                <span>{comp.name}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-100 border border-gray-400 p-2 text-xs mb-4">
            <div className="font-bold">Microsoft Windows Common Controls 6.0</div>
            <div>Location: C:\Windows\System32\MSCOMCTL.OCX</div>
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

export default ComponentsDialog;