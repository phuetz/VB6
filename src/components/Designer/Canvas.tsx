import React, { forwardRef, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import ControlRenderer from './ControlRenderer';
import Grid from './Grid';
import AlignmentGuides from './AlignmentGuides';
import SelectionBox from './SelectionBox';

// Canvas currently has no props.
type CanvasProps = Record<string, never>;

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((props, ref) => {
  const { state, dispatch, createControl } = useVB6();

  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (state.executionMode === 'run') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Try multiple data formats
    let controlType = e.dataTransfer.getData('application/vb6-control') || 
                     e.dataTransfer.getData('text/plain') ||
                     state.draggedControlType;
    
    // Clean up the control type
    if (controlType && controlType.includes('{')) {
      try {
        const controlData = JSON.parse(controlType);
        controlType = controlData.type;
      } catch {
        // If parsing fails, use as is
      }
    }
    
    if (!controlType) return;

    const canvas = ref as React.RefObject<HTMLDivElement>;
    if (!canvas.current) return;

    const rect = canvas.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Snap to grid if enabled
    if (state.snapToGrid) {
      x = Math.round(x / state.gridSize) * state.gridSize;
      y = Math.round(y / state.gridSize) * state.gridSize;
    }
    
    // Ensure minimum position
    x = Math.max(0, x);
    y = Math.max(0, y);

    console.log('Creating control:', controlType, 'at position:', x, y);
    createControl(controlType, x, y);
    
    // Reset drag state
    dispatch({
      type: 'SET_DRAG_STATE',
      payload: { isDragging: false, controlType: null, position: { x: 0, y: 0 } }
    });
  }, [state.draggedControlType, state.executionMode, state.snapToGrid, state.gridSize, createControl, dispatch, ref]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (state.executionMode === 'run') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    
    const canvas = ref as React.RefObject<HTMLDivElement>;
    if (canvas.current) {
      const rect = canvas.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      
      // Snap to grid if enabled
      if (state.snapToGrid) {
        x = Math.round(x / state.gridSize) * state.gridSize;
        y = Math.round(y / state.gridSize) * state.gridSize;
      }
      
      dispatch({
        type: 'SET_DRAG_STATE',
        payload: {
          isDragging: true,
          position: {
            x: Math.max(0, x),
            y: Math.max(0, y)
          }
        }
      });
    }
  }, [state.executionMode, state.snapToGrid, state.gridSize, dispatch, ref]);

  const handleCanvasDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (state.executionMode === 'run') return;
    e.preventDefault();
    e.stopPropagation();
  }, [state.executionMode]);

  const handleCanvasDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (state.executionMode === 'run') return;
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide drag preview if we're really leaving the canvas
    const canvas = ref as React.RefObject<HTMLDivElement>;
    if (canvas.current && !canvas.current.contains(e.relatedTarget as Node)) {
      dispatch({
        type: 'SET_DRAG_STATE',
        payload: { isDragging: false, controlType: null, position: { x: 0, y: 0 } }
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
      onDragEnter={handleCanvasDragEnter}
      onDragLeave={handleCanvasDragLeave}
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
      {state.isDragging && state.dragPosition && state.dragPosition.x >= 0 && state.dragPosition.y >= 0 && state.draggedControlType && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: state.dragPosition.x,
            top: state.dragPosition.y,
            width: 50,
            height: 30,
            border: '2px dashed #0066cc',
            backgroundColor: 'rgba(0, 102, 204, 0.1)',
            zIndex: 9999
          }}
        >
          <div className="text-xs text-center text-blue-600 font-semibold p-1">
            {state.draggedControlType}
          </div>
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;