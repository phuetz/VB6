import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Control } from '../context/types';

interface MoveOptions {
  enableKeyboardMovement: boolean;
  gridSize: number;
}

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  dragOffset: { x: number; y: number };
}

export const useControlMove = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  snapToGrid: (value: number) => number,
  calculateAlignmentGuides: (movingControls: Control[], dx: number, dy: number) => void,
  clearAlignmentGuides: () => void,
  options: MoveOptions
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
  });

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const updateRAFRef = useRef<number | null>(null);

  const startDrag = useCallback((e: React.MouseEvent, control: Control) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      startPosition: { x: control.x, y: control.y },
      dragOffset: { x: offsetX, y: offsetY },
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleDragMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current || !dragState.isDragging) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (updateRAFRef.current !== null) {
        cancelAnimationFrame(updateRAFRef.current);
      }

      updateRAFRef.current = requestAnimationFrame(() => {
        if (!dragState.isDragging) {
          updateRAFRef.current = null;
          return;
        }

        React.startTransition(() => {
          calculateAlignmentGuides(selectedControls, dx, dy);

          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          const updatedControls = controls.map(control => {
            if (selectedIds.has(control.id)) {
              return {
                ...control,
                x: snapToGrid(dragState.startPosition.x + dx),
                y: snapToGrid(dragState.startPosition.y + dy),
              };
            }
            return control;
          });

          updateControls(updatedControls);
        });
      });
    },
    [dragState, selectedControls, controls, updateControls, snapToGrid, calculateAlignmentGuides]
  );

  const endDrag = useCallback(() => {
    if (updateRAFRef.current !== null) {
      cancelAnimationFrame(updateRAFRef.current);
      updateRAFRef.current = null;
    }

    setDragState({
      isDragging: false,
      startPosition: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
    });
    clearAlignmentGuides();
    dragStartRef.current = null;
  }, [clearAlignmentGuides]);

  const handleKeyboardMove = useCallback(
    (e: KeyboardEvent) => {
      if (!options.enableKeyboardMovement || selectedControls.length === 0) return;

      const step = e.shiftKey ? options.gridSize : 1;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowLeft':
          dx = -step;
          break;
        case 'ArrowRight':
          dx = step;
          break;
        case 'ArrowUp':
          dy = -step;
          break;
        case 'ArrowDown':
          dy = step;
          break;
        default:
          return;
      }

      e.preventDefault();

      const selectedIds = new Set(selectedControls.map(sc => sc.id));
      const updatedControls = controls.map(control => {
        if (selectedIds.has(control.id)) {
          return {
            ...control,
            x: Math.max(0, snapToGrid(control.x + dx)),
            y: Math.max(0, snapToGrid(control.y + dy)),
          };
        }
        return control;
      });

      updateControls(updatedControls);
    },
    [
      selectedControls,
      controls,
      updateControls,
      snapToGrid,
      options.enableKeyboardMovement,
      options.gridSize,
    ]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateRAFRef.current !== null) {
        cancelAnimationFrame(updateRAFRef.current);
        updateRAFRef.current = null;
      }
    };
  }, []);

  return {
    dragState,
    startDrag,
    handleDragMouseMove,
    endDrag,
    handleKeyboardMove,
  };
};
