import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import { useVB6Store } from '../../stores/vb6Store';
import { shallow } from 'zustand/shallow';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);

  // Make canvas a droppable zone
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: 'canvas-drop-zone',
    data: {
      accepts: ['toolbox-control', 'existing-control'],
    },
  });
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const {
    controls,
    executionMode,
    snapToGrid,
    gridSize,
    isDragging,
    dragPosition,
    draggedControlType,
  } = useVB6Store(
    state => ({
      controls: state.controls,
      executionMode: state.executionMode,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
      isDragging: state.isDragging,
      dragPosition: state.dragPosition,
      draggedControlType: state.draggedControlType,
    }),
    shallow
  );

  // Actions don't need shallow comparison
  const createControl = useVB6Store(state => state.createControl);
  const updateControl = useVB6Store(state => state.updateControl);
  const setDragState = useVB6Store(state => state.setDragState);
  const selectControls = useVB6Store(state => state.selectControls);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Track mouse position during drag for accurate positioning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isTracking && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    if (isTracking) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isTracking]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const dragData = active.data.current as DragData;

      if (dragData?.type === 'toolbox-control') {
        setIsTracking(true);
        setDragState({
          isDragging: true,
          controlType: dragData.controlType,
          position: { x: 0, y: 0 },
        });
      }
    },
    [setDragState]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (executionMode === 'run') return;

      if (canvasRef.current && isDragging) {
        let x = mousePosition.x;
        let y = mousePosition.y;

        // Snap to grid if enabled
        if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
        }

        // Ensure position is within canvas bounds
        x = Math.max(0, x);
        y = Math.max(0, y);

        setDragState({
          isDragging: true,
          position: { x, y },
        });
      }
    },
    [executionMode, isDragging, snapToGrid, gridSize, setDragState, mousePosition]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const dragData = active.data.current as DragData;

      setIsTracking(false);

      if (dragData?.type === 'toolbox-control' && dragData.controlType && canvasRef.current) {
        let x = mousePosition.x;
        let y = mousePosition.y;

        // Snap to grid if enabled
        if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
        }

        // Ensure minimum position and stay within reasonable bounds
        x = Math.max(0, x);
        y = Math.max(0, y);

        // Only create control if position is valid (not negative after snapping)
        if (x >= 0 && y >= 0) {
          createControl(dragData.controlType, x, y);
        }
      } else if (dragData?.type === 'existing-control' && dragData.controlId && canvasRef.current) {
        let x = mousePosition.x;
        let y = mousePosition.y;

        // Snap to grid if enabled
        if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
        }

        // Ensure minimum position and stay within reasonable bounds
        x = Math.max(0, x);
        y = Math.max(0, y);

        // Update existing control position
        if (x >= 0 && y >= 0) {
          updateControl(dragData.controlId, 'x', x);
          updateControl(dragData.controlId, 'y', y);
        }
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        controlType: null,
        position: { x: 0, y: 0 },
      });
      setMousePosition({ x: 0, y: 0 });
    },
    [createControl, updateControl, snapToGrid, gridSize, setDragState, mousePosition]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (executionMode === 'run') return;
      // Deselect all controls when clicking on empty canvas
      selectControls([]);
    },
    [executionMode, selectControls]
  );

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
          color: '#0066cc',
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
        ref={node => {
          canvasRef.current = node;
          setDroppableRef(node);
        }}
        className={`w-full h-full relative overflow-hidden ${isOver ? 'bg-blue-50' : ''}`}
        onClick={handleCanvasClick}
        style={{
          cursor: executionMode === 'design' ? 'default' : 'default',
          transition: 'background-color 200ms ease',
        }}
      >
        <Grid />
        <AlignmentGuides />

        {/* Controls */}
        {controls.map(control => (
          <ControlRenderer key={control.id} control={control} />
        ))}

        <SelectionBox />
      </div>

      <DragOverlay>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
};

export default DragDropCanvas;
