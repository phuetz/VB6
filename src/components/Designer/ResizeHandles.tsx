import React from 'react';
import { Control } from '../../context/types';
import { useVB6 } from '../../context/VB6Context';

interface ResizeHandlesProps {
  control: Control;
  onStartResize?: (e: React.MouseEvent, control: Control, handle: string) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ control, onStartResize }) => {
  const { state } = useVB6();

  // EDGE CASE FIX: Only show resize handles for single selection
  if (
    state.executionMode === 'run' ||
    state.selectedControls.length !== 1 ||
    !onStartResize ||
    control.locked === true
  )
    return null;

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#0066cc',
    border: '1px solid #fff',
    zIndex: 10000,
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    onStartResize(e, control, handle);
  };

  return (
    <>
      <div
        style={{ ...handleStyle, top: -4, left: -4, cursor: 'nw-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'nw')}
      />
      <div
        style={{ ...handleStyle, top: -4, left: '50%', marginLeft: -3, cursor: 'n-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'n')}
      />
      <div
        style={{ ...handleStyle, top: -4, right: -4, cursor: 'ne-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'ne')}
      />
      <div
        style={{ ...handleStyle, top: '50%', right: -4, marginTop: -3, cursor: 'e-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'e')}
      />
      <div
        style={{ ...handleStyle, bottom: -4, right: -4, cursor: 'se-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'se')}
      />
      <div
        style={{ ...handleStyle, bottom: -4, left: '50%', marginLeft: -3, cursor: 's-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 's')}
      />
      <div
        style={{ ...handleStyle, bottom: -4, left: -4, cursor: 'sw-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'sw')}
      />
      <div
        style={{ ...handleStyle, top: '50%', left: -4, marginTop: -3, cursor: 'w-resize' }}
        onMouseDown={e => handleResizeMouseDown(e, 'w')}
      />
    </>
  );
};

export default ResizeHandles;
