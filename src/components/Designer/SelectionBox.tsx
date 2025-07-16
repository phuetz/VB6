import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const SelectionBox: React.FC = () => {
  const { state } = useVB6();

  if (!state.isSelecting || state.executionMode === 'run') return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: state.selectionBox.x,
        top: state.selectionBox.y,
        width: state.selectionBox.width,
        height: state.selectionBox.height,
        border: '1px dashed #0066cc',
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        zIndex: 9998,
      }}
    />
  );
};

export default SelectionBox;
