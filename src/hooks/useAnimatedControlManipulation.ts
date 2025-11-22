// Enhanced Control Manipulation Hook with Smooth Animations
// Extends the base control manipulation with transition animations

import { useCallback, useRef, useState } from 'react';
import { Control } from '../context/types';
import { useControlAnimations } from './useAnimations';
import { useUndoRedo } from './useUndoRedo';

interface AnimatedControlManipulationOptions {
  snapToGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  enableKeyboardMovement: boolean;
  multiSelectEnabled: boolean;
  enableAnimations: boolean; // New option for enabling/disabling animations
  animationSpeed: 'slow' | 'normal' | 'fast'; // Animation speed setting
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  isAnimating: boolean; // New state for tracking animations
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  currentHandle: string | null;
  dragOffset: { x: number; y: number };
  beforePositions: Array<{id: number; x: number; y: number; width?: number; height?: number}>;
}

export const useAnimatedControlManipulation = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  options: AnimatedControlManipulationOptions
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    isAnimating: false,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    currentHandle: null,
    dragOffset: { x: 0, y: 0 },
    beforePositions: [],
  });

  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  const animations = useControlAnimations();
  const undoRedo = useUndoRedo();
  const isAnimatingRef = useRef(false);

  // Get animation duration based on speed setting
  const getAnimationDuration = useCallback((baseTime: number) => {
    const speedMultipliers = { slow: 1.5, normal: 1, fast: 0.7 };
    return baseTime * speedMultipliers[options.animationSpeed];
  }, [options.animationSpeed]);

  // Snap to grid function
  const snapToGrid = useCallback((value: number) => {
    if (!options.snapToGrid) return value;
    return Math.round(value / options.gridSize) * options.gridSize;
  }, [options.snapToGrid, options.gridSize]);

  // Calculate alignment guides
  const calculateAlignmentGuides = useCallback(() => {
    if (!options.showAlignmentGuides) return { x: [], y: [] };
    
    const guides = { x: [] as number[], y: [] as number[] };
    
    // Get all unselected controls for guide calculation
    const unselectedControls = controls.filter(
      control => !selectedControls.some(selected => selected.id === control.id)
    );

    unselectedControls.forEach(control => {
      // Vertical guides (x positions)
      guides.x.push(control.x); // Left edge
      guides.x.push(control.x + control.width); // Right edge
      guides.x.push(control.x + control.width / 2); // Center

      // Horizontal guides (y positions)
      guides.y.push(control.y); // Top edge
      guides.y.push(control.y + control.height); // Bottom edge
      guides.y.push(control.y + control.height / 2); // Center
    });

    return guides;
  }, [controls, selectedControls, options.showAlignmentGuides]);

  // Start drag operation with position capture
  const startDrag = useCallback((event: React.MouseEvent, controlId: number) => {
    if (isAnimatingRef.current) return false;

    const control = controls.find(c => c.id === controlId);
    if (!control) return false;

    // Capture initial positions for all selected controls
    const beforePositions = selectedControls.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height
    }));

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: { x: event.clientX, y: event.clientY },
      dragOffset: { x: event.clientX - control.x, y: event.clientY - control.y },
      beforePositions
    }));

    setAlignmentGuides(calculateAlignmentGuides());
    return true;
  }, [controls, selectedControls, calculateAlignmentGuides]);

  // Handle drag movement with smooth updates
  const handleDrag = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || isAnimatingRef.current) return;

    const deltaX = event.clientX - dragState.startPosition.x;
    const deltaY = event.clientY - dragState.startPosition.y;

    const updatedControls = controls.map(control => {
      const isSelected = selectedControls.some(selected => selected.id === control.id);
      if (!isSelected) return control;

      const originalPosition = dragState.beforePositions.find(bp => bp.id === control.id);
      if (!originalPosition) return control;

      let newX = originalPosition.x + deltaX;
      let newY = originalPosition.y + deltaY;

      // Apply snapping
      if (options.snapToGrid) {
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
      }

      return { ...control, x: newX, y: newY };
    });

    updateControls(updatedControls);
  }, [
    dragState.isDragging,
    dragState.startPosition,
    dragState.beforePositions,
    controls,
    selectedControls,
    updateControls,
    options.snapToGrid,
    snapToGrid
  ]);

  // End drag with animation
  const endDrag = useCallback(async () => {
    if (!dragState.isDragging || isAnimatingRef.current) return;

    setDragState(prev => ({ ...prev, isDragging: false, isAnimating: true }));
    isAnimatingRef.current = true;

    try {
      // Record for undo/redo
      const afterPositions = selectedControls.map(c => ({ id: c.id, x: c.x, y: c.y }));
      const beforePositions = dragState.beforePositions.map(bp => ({ id: bp.id, x: bp.x, y: bp.y }));
      
      undoRedo.recordMove(selectedControls, beforePositions);

      // If animations are enabled and we have significant movement, animate to final position
      if (options.enableAnimations) {
        const hasSignificantMovement = afterPositions.some((after, index) => {
          const before = beforePositions[index];
          return before && (Math.abs(after.x - before.x) > 2 || Math.abs(after.y - before.y) > 2);
        });

        if (hasSignificantMovement && options.snapToGrid) {
          // Calculate snapped positions
          const snappedPositions = afterPositions.map(pos => ({
            ...pos,
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          }));

          // Animate to snapped positions
          await animations.animateSnapToGrid(selectedControls, afterPositions, snappedPositions, {
            duration: getAnimationDuration(150),
            easing: 'ease-out'
          });

          // Update controls to final snapped positions
          const finalControls = controls.map(control => {
            const snappedPos = snappedPositions.find(sp => sp.id === control.id);
            return snappedPos ? { ...control, x: snappedPos.x, y: snappedPos.y } : control;
          });
          updateControls(finalControls);
        }
      }
    } finally {
      isAnimatingRef.current = false;
      setDragState(prev => ({ ...prev, isAnimating: false }));
      setAlignmentGuides({ x: [], y: [] });
    }
  }, [
    dragState.isDragging,
    dragState.beforePositions,
    selectedControls,
    controls,
    updateControls,
    undoRedo,
    options.enableAnimations,
    options.snapToGrid,
    animations,
    getAnimationDuration,
    snapToGrid
  ]);

  // Start resize operation
  const startResize = useCallback((event: React.MouseEvent, controlId: number, handle: string) => {
    if (isAnimatingRef.current) return false;

    const control = controls.find(c => c.id === controlId);
    if (!control) return false;

    // Capture initial sizes for all selected controls
    const beforePositions = selectedControls.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height
    }));

    setDragState(prev => ({
      ...prev,
      isResizing: true,
      currentHandle: handle,
      startPosition: { x: event.clientX, y: event.clientY },
      startSize: { width: control.width, height: control.height },
      beforePositions
    }));

    return true;
  }, [controls, selectedControls]);

  // Handle resize with constraints
  const handleResize = useCallback((event: React.MouseEvent) => {
    if (!dragState.isResizing || !dragState.currentHandle || isAnimatingRef.current) return;

    const deltaX = event.clientX - dragState.startPosition.x;
    const deltaY = event.clientY - dragState.startPosition.y;

    const updatedControls = controls.map(control => {
      const isSelected = selectedControls.some(selected => selected.id === control.id);
      if (!isSelected) return control;

      const originalSize = dragState.beforePositions.find(bp => bp.id === control.id);
      if (!originalSize) return control;

      let newX = originalSize.x;
      let newY = originalSize.y;
      let newWidth = originalSize.width;
      let newHeight = originalSize.height;

      // Apply resize based on handle
      const handle = dragState.currentHandle;
      if (handle.includes('e')) newWidth = Math.max(20, originalSize.width + deltaX);
      if (handle.includes('w')) {
        newWidth = Math.max(20, originalSize.width - deltaX);
        newX = originalSize.x + (originalSize.width - newWidth);
      }
      if (handle.includes('s')) newHeight = Math.max(20, originalSize.height + deltaY);
      if (handle.includes('n')) {
        newHeight = Math.max(20, originalSize.height - deltaY);
        newY = originalSize.y + (originalSize.height - newHeight);
      }

      // Apply grid snapping
      if (options.snapToGrid) {
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        newWidth = snapToGrid(newWidth);
        newHeight = snapToGrid(newHeight);
      }

      return { ...control, x: newX, y: newY, width: newWidth, height: newHeight };
    });

    updateControls(updatedControls);
  }, [
    dragState.isResizing,
    dragState.currentHandle,
    dragState.startPosition,
    dragState.beforePositions,
    controls,
    selectedControls,
    updateControls,
    options.snapToGrid,
    snapToGrid
  ]);

  // End resize with animation
  const endResize = useCallback(async () => {
    if (!dragState.isResizing || isAnimatingRef.current) return;

    setDragState(prev => ({ ...prev, isResizing: false, isAnimating: true }));
    isAnimatingRef.current = true;

    try {
      // Record for undo/redo
      const afterSizes = selectedControls.map(c => ({
        id: c.id, x: c.x, y: c.y, width: c.width, height: c.height
      }));
      
      undoRedo.recordResize(selectedControls, dragState.beforePositions);

      // Animate resize completion if enabled
      if (options.enableAnimations) {
        await animations.animateResize(
          selectedControls,
          dragState.beforePositions,
          afterSizes,
          {
            duration: getAnimationDuration(200),
            easing: 'bounce'
          }
        );
      }
    } finally {
      isAnimatingRef.current = false;
      setDragState(prev => ({ ...prev, isAnimating: false, currentHandle: null }));
    }
  }, [
    dragState.isResizing,
    dragState.beforePositions,
    selectedControls,
    undoRedo,
    options.enableAnimations,
    animations,
    getAnimationDuration
  ]);

  // Animated alignment function
  const alignControls = useCallback(async (alignmentType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedControls.length < 2 || isAnimatingRef.current) return;

    const beforePositions = selectedControls.map(c => ({ id: c.id, x: c.x, y: c.y }));
    
    // Calculate alignment positions
    let referenceValue: number;
    const bounds = selectedControls.reduce((acc, control) => ({
      left: Math.min(acc.left, control.x),
      right: Math.max(acc.right, control.x + control.width),
      top: Math.min(acc.top, control.y),
      bottom: Math.max(acc.bottom, control.y + control.height),
      centerX: (acc.left + acc.right) / 2,
      centerY: (acc.top + acc.bottom) / 2,
    }), {
      left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity,
      centerX: 0, centerY: 0
    });

    // Update control positions based on alignment type
    const alignedControls = controls.map(control => {
      const isSelected = selectedControls.some(selected => selected.id === control.id);
      if (!isSelected) return control;

      let newX = control.x;
      let newY = control.y;

      switch (alignmentType) {
        case 'left': newX = bounds.left; break;
        case 'center': newX = bounds.centerX - control.width / 2; break;
        case 'right': newX = bounds.right - control.width; break;
        case 'top': newY = bounds.top; break;
        case 'middle': newY = bounds.centerY - control.height / 2; break;
        case 'bottom': newY = bounds.bottom - control.height; break;
      }

      return { ...control, x: newX, y: newY };
    });

    // Get final positions for animation
    const afterPositions = selectedControls.map(c => {
      const aligned = alignedControls.find(ac => ac.id === c.id);
      return aligned ? { id: c.id, x: aligned.x, y: aligned.y } : { id: c.id, x: c.x, y: c.y };
    });

    setDragState(prev => ({ ...prev, isAnimating: true }));
    isAnimatingRef.current = true;

    try {
      // Record for undo/redo
      undoRedo.recordAlign(selectedControls, alignmentType, beforePositions);

      if (options.enableAnimations) {
        // Animate to aligned positions
        await animations.animateAlignment(
          selectedControls,
          beforePositions,
          afterPositions,
          alignmentType,
          {
            duration: getAnimationDuration(400),
            easing: 'bounce'
          }
        );
      }

      // Update controls to final positions
      updateControls(alignedControls);
    } finally {
      isAnimatingRef.current = false;
      setDragState(prev => ({ ...prev, isAnimating: false }));
    }
  }, [selectedControls, controls, updateControls, undoRedo, options.enableAnimations, animations, getAnimationDuration]);

  // Animated control creation
  const createControlWithAnimation = useCallback(async (newControl: Control) => {
    if (!options.enableAnimations) return;

    setDragState(prev => ({ ...prev, isAnimating: true }));
    isAnimatingRef.current = true;

    try {
      await animations.animateControlCreation([newControl]);
    } finally {
      isAnimatingRef.current = false;
      setDragState(prev => ({ ...prev, isAnimating: false }));
    }
  }, [options.enableAnimations, animations]);

  // Animated control deletion
  const deleteControlsWithAnimation = useCallback(async (controlsToDelete: Control[]) => {
    if (!options.enableAnimations) return;

    setDragState(prev => ({ ...prev, isAnimating: true }));
    isAnimatingRef.current = true;

    try {
      await animations.animateControlDeletion(controlsToDelete);
    } finally {
      isAnimatingRef.current = false;
      setDragState(prev => ({ ...prev, isAnimating: false }));
    }
  }, [options.enableAnimations, animations]);

  return {
    // State
    dragState,
    alignmentGuides,
    isAnimating: dragState.isAnimating,

    // Drag operations
    startDrag,
    handleDrag,
    endDrag,

    // Resize operations
    startResize,
    handleResize,
    endResize,

    // Alignment operations
    alignControls,

    // Animated operations
    createControlWithAnimation,
    deleteControlsWithAnimation,

    // Utility functions
    snapToGrid,
    calculateAlignmentGuides,
  };
};