import React, { useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter
} from '@dnd-kit/core';
import { useVB6Store } from '../../stores/vb6Store';
import ControlRenderer from './ControlRenderer';
import Grid from './Grid';
import AlignmentGuides from './AlignmentGuides';
import SelectionBox from './SelectionBox';

// DragDropCanvas currently has no props.
type DragDropCanvasProps = Record<string, never>;

interface DragData {
  type: 'toolbox-control' | 'canvas-control';
  controlType?: string;
  controlId?: number;
}

const DragDropCanvas: React.FC<DragDropCanvasProps> = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    controls,
    executionMode,
    snapToGrid,
    gridSize,
    isDragging,
    dragPosition,
    draggedControlType,
    createControl,
    setDragState,
    selectControls
  } = useVB6Store();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current as DragData;
    
    if (dragData?.type === 'toolbox-control') {
      setDragState({
        isDragging: true,
        controlType: dragData.controlType,
        position: { x: 0, y: 0 }
      });
    }
  }, [setDragState]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (executionMode === 'run') return;
    
    const { delta } = event;
    if (canvasRef.current && isDragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = delta.x;
      let y = delta.y;
      
      // Snap to grid if enabled
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      
      setDragState({
        isDragging: true,
        position: {
          x: Math.max(0, x),
          y: Math.max(0, y)
        }
      });
    }
  }, [executionMode, isDragging, snapToGrid, gridSize, setDragState]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    const dragData = active.data.current as DragData;
    
    if (dragData?.type === 'toolbox-control' && dragData.controlType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = delta.x;
      let y = delta.y;
      
      // Snap to grid if enabled
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      
      // Ensure minimum position
      x = Math.max(0, x);
      y = Math.max(0, y);

      createControl(dragData.controlType, x, y);
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      controlType: null,
      position: { x: 0, y: 0 }
    });
  }, [createControl, snapToGrid, gridSize, setDragState]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (executionMode === 'run') return;
    // Deselect all controls when clicking on empty canvas
    selectControls([]);
  }, [executionMode, selectControls]);

  const renderDragOverlay = () => {
    if (!isDragging || !draggedControlType) return null;
    
    return (
      <div
        className="pointer-events-none"
        style={{
          width: 50,
          height: 30,
          border: '2px dashed #0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#0066cc'
        }}
      >
        {draggedControlType}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={canvasRef}
        className="w-full h-full relative overflow-hidden"
        onClick={handleCanvasClick}
        style={{ cursor: executionMode === 'design' ? 'default' : 'default' }}
      >
        <Grid />
        <AlignmentGuides />
        
        {/* Controls */}
        {controls.map(control => (
          <ControlRenderer key={control.id} control={control} />
        ))}
        
        <SelectionBox />
      </div>
      
      <DragOverlay>
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropCanvas;