import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const Grid: React.FC = () => {
  const { state } = useVB6();

  if (!state.showGrid || state.executionMode === 'run') return null;
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, #e0e0e0, #e0e0e0 1px, transparent 1px, transparent ${state.gridSize}px),
          repeating-linear-gradient(90deg, #e0e0e0, #e0e0e0 1px, transparent 1px, transparent ${state.gridSize}px)
        `
      }}
    />
  );
};

export default Grid;