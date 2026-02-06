import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Control } from '../context/types';

interface ResizeOptions {
  enableKeyboardMovement: boolean;
  gridSize: number;
}

interface ResizeState {
  isResizing: boolean;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  currentHandle: string | null;
}

export const useControlResize = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  snapToGrid: (value: number) => number,
  options: ResizeOptions
) => {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    currentHandle: null,
  });

  const resizeStartRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const updateRAFRef = useRef<number | null>(null);

  const startResize = useCallback((e: React.MouseEvent, control: Control, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    resizeStartRef.current = {};
    selectedControls.forEach(c => {
      resizeStartRef.current[c.id] = { x: c.x, y: c.y, width: c.width, height: c.height };
    });

    setResizeState({
      isResizing: true,
      startPosition: { x: control.x, y: control.y },
      startSize: { width: control.width, height: control.height },
      currentHandle: handle,
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleResizeMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current || !resizeState.isResizing) return;
      if (selectedControls.length !== 1) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (updateRAFRef.current !== null) {
        cancelAnimationFrame(updateRAFRef.current);
      }

      updateRAFRef.current = requestAnimationFrame(() => {
        if (!resizeState.isResizing) {
          updateRAFRef.current = null;
          return;
        }

        React.startTransition(() => {
          const updatedControls = controls.map(c => {
            const start = resizeStartRef.current[c.id];
            if (!start) return c;

            let newWidth = start.width;
            let newHeight = start.height;
            let newX = start.x;
            let newY = start.y;

            switch (resizeState.currentHandle) {
              case 'nw':
                newWidth = snapToGrid(Math.max(20, start.width - dx));
                newHeight = snapToGrid(Math.max(20, start.height - dy));
                newX = snapToGrid(start.x + dx);
                newY = snapToGrid(start.y + dy);
                break;
              case 'n':
                newHeight = snapToGrid(Math.max(20, start.height - dy));
                newY = snapToGrid(start.y + dy);
                break;
              case 'ne':
                newWidth = snapToGrid(Math.max(20, start.width + dx));
                newHeight = snapToGrid(Math.max(20, start.height - dy));
                newY = snapToGrid(start.y + dy);
                break;
              case 'e':
                newWidth = snapToGrid(Math.max(20, start.width + dx));
                break;
              case 'se':
                newWidth = snapToGrid(Math.max(20, start.width + dx));
                newHeight = snapToGrid(Math.max(20, start.height + dy));
                break;
              case 's':
                newHeight = snapToGrid(Math.max(20, start.height + dy));
                break;
              case 'sw':
                newWidth = snapToGrid(Math.max(20, start.width - dx));
                newHeight = snapToGrid(Math.max(20, start.height + dy));
                newX = snapToGrid(start.x + dx);
                break;
              case 'w':
                newWidth = snapToGrid(Math.max(20, start.width - dx));
                newX = snapToGrid(start.x + dx);
                break;
            }

            return { ...c, x: newX, y: newY, width: newWidth, height: newHeight };
          });
          updateControls(updatedControls);
        });
      });
    },
    [resizeState, selectedControls, controls, updateControls, snapToGrid]
  );

  const endResize = useCallback(() => {
    if (updateRAFRef.current !== null) {
      cancelAnimationFrame(updateRAFRef.current);
      updateRAFRef.current = null;
    }

    setResizeState({
      isResizing: false,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 },
      currentHandle: null,
    });
    dragStartRef.current = null;
    resizeStartRef.current = {};
  }, []);

  const handleKeyboardResize = useCallback(
    (e: KeyboardEvent) => {
      if (!options.enableKeyboardMovement || selectedControls.length === 0) return;

      const step = e.shiftKey ? options.gridSize : 1;

      if (e.ctrlKey) {
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
        const updatedControls = controls.map(c => {
          if (selectedIds.has(c.id)) {
            return {
              ...c,
              width: snapToGrid(Math.max(20, c.width + dx)),
              height: snapToGrid(Math.max(20, c.height + dy)),
            };
          }
          return c;
        });

        updateControls(updatedControls);
      }
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
    resizeState,
    startResize,
    handleResizeMouseMove,
    endResize,
    handleKeyboardResize,
  };
};
