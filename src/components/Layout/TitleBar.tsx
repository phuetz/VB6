import React from 'react';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { useVB6 } from '../../context/VB6Context';

const TitleBar: React.FC = () => {
  const { state } = useVB6();

  return (
    <div className="h-7 bg-gradient-to-r from-blue-800 to-blue-500 flex items-center px-2 text-white text-sm">
      <span className="flex-1">
        {state.projectName} - Microsoft Visual Basic [{state.executionMode}]
      </span>
      <button className="w-5 h-5 bg-gray-300 text-black flex items-center justify-center text-xs hover:bg-gray-400 mx-1">
        <Minimize2 size={10} />
      </button>
      <button className="w-5 h-5 bg-gray-300 text-black flex items-center justify-center text-xs hover:bg-gray-400 mx-1">
        <Maximize2 size={10} />
      </button>
      <button className="w-5 h-5 bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600">
        <X size={10} />
      </button>
    </div>
  );
};

export default TitleBar;
