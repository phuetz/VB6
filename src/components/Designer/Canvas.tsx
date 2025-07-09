import React, { forwardRef, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import ControlRenderer from './ControlRenderer';
import Grid from './Grid';
import AlignmentGuides from './AlignmentGuides';
import SelectionBox from './SelectionBox';

interface CanvasProps {}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((props, ref) => {
  const { state, dispatch, createControl } = useVB6();

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    if (state.executionMode === 'run') return;
    e.preventDefault();
    e.stopPropagation();
    
    const controlType = e.dataTransfer.getData('controlType') || state.draggedControlType;
    if (!controlType) return;

    const canvas = ref as React.RefObject<HTMLDivElement>;
    if (!canvas.current) return;

    const rect = canvas.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createControl(controlType, x, y);
    
    dispatch({
      type: 'SET_DRAG_STATE',
      payload: { isDragging: false }
    });
  }, [state.draggedControlType, state.executionMode, createControl, dispatch, ref]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (state.executionMode === 'run') return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    
    const canvas = ref as React.RefObject<HTMLDivElement>;
    if (canvas.current) {
      const rect = canvas.current.getBoundingClientRect();
      dispatch({
        type: 'SET_DRAG_STATE',
        payload: {
          isDragging: true,
          position: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }
        }
      });
    }
  }, [state.executionMode, dispatch, ref]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (state.executionMode === 'run') return;
    if (!state.isSelecting) {
      dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [] } });
    }
  }, [state.executionMode, state.isSelecting, dispatch]);

  return (
    <div
      ref={ref}
      className="w-full h-full relative overflow-hidden"
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
      onDragEnter={(e) => e.preventDefault()}
      onDragLeave={(e) => e.preventDefault()}
      onClick={handleCanvasClick}
      style={{ cursor: state.isSelecting ? 'crosshair' : 'default' }}
    >
      <Grid />
      <AlignmentGuides />
      
      {/* Controls */}
      {state.controls.map(control => (
        <ControlRenderer key={control.id} control={control} />
      ))}
      
      <SelectionBox />
      
      {/* Drag Preview */}
      {state.isDragging && state.dragPosition.x > 0 && state.dragPosition.y > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: state.dragPosition.x - 25,
            top: state.dragPosition.y - 15,
            width: 50,
            height: 30,
            border: '2px dashed #0066cc',
            backgroundColor: 'rgba(0, 102, 204, 0.1)'
          }}
        />
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;