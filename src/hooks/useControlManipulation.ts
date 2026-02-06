import { useCallback } from 'react';
import { Control } from '../context/types';
import { useControlAlignment } from './useControlAlignment';
import { useControlMove } from './useControlMove';
import { useControlResize } from './useControlResize';

interface ControlManipulationOptions {
  snapToGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  enableKeyboardMovement: boolean;
  multiSelectEnabled: boolean;
}

export const useControlManipulation = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  options: ControlManipulationOptions
) => {
  const {
    alignmentGuides,
    snapToGrid,
    calculateAlignmentGuides,
    clearAlignmentGuides,
    alignControls,
    makeSameSize,
  } = useControlAlignment(controls, selectedControls, updateControls, options);

  const { dragState, startDrag, handleDragMouseMove, endDrag, handleKeyboardMove } = useControlMove(
    controls,
    selectedControls,
    updateControls,
    snapToGrid,
    calculateAlignmentGuides,
    clearAlignmentGuides,
    options
  );

  const { resizeState, startResize, handleResizeMouseMove, endResize, handleKeyboardResize } =
    useControlResize(controls, selectedControls, updateControls, snapToGrid, options);

  // Unified mouse move handler that delegates to drag or resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        handleDragMouseMove(e);
      } else if (resizeState.isResizing) {
        handleResizeMouseMove(e);
      }
    },
    [dragState.isDragging, resizeState.isResizing, handleDragMouseMove, handleResizeMouseMove]
  );

  // Unified mouse up handler
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      endDrag();
    }
    if (resizeState.isResizing) {
      endResize();
    }
  }, [dragState.isDragging, resizeState.isResizing, endDrag, endResize]);

  return {
    dragState: {
      isDragging: dragState.isDragging,
      isResizing: resizeState.isResizing,
      startPosition: dragState.isDragging ? dragState.startPosition : resizeState.startPosition,
      startSize: resizeState.startSize,
      currentHandle: resizeState.currentHandle,
      dragOffset: dragState.dragOffset,
    },
    alignmentGuides,
    startDrag,
    startResize,
    handleMouseMove,
    handleMouseUp,
    handleKeyboardMove,
    handleKeyboardResize,
    alignControls,
    makeSameSize,
  };
};
