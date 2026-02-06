// Enhanced Control Manipulation Hook with Smooth Animations
// Composes base control manipulation with animation and undo/redo layers

import React, { useCallback, useRef } from 'react';
import { Control } from '../context/types';
import { useControlManipulation } from './useControlManipulation';
import { useControlAnimation } from './useControlAnimation';
import { useUndoRedo } from './useUndoRedo';

interface AnimatedControlManipulationOptions {
  snapToGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  enableKeyboardMovement: boolean;
  multiSelectEnabled: boolean;
  enableAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export const useAnimatedControlManipulation = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  options: AnimatedControlManipulationOptions
) => {
  const base = useControlManipulation(controls, selectedControls, updateControls, options);
  const anim = useControlAnimation(options);
  const undoRedo = useUndoRedo();
  const beforePositionsRef = useRef<
    Array<{ id: number; x: number; y: number; width: number; height: number }>
  >([]);

  const captureBeforePositions = useCallback(() => {
    beforePositionsRef.current = selectedControls.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
    }));
  }, [selectedControls]);

  // Wrap startDrag: animation guard + capture before positions
  const startDrag = useCallback(
    (e: React.MouseEvent, control: Control) => {
      if (anim.isAnimatingRef.current) return;
      captureBeforePositions();
      base.startDrag(e, control);
    },
    [base, anim.isAnimatingRef, captureBeforePositions]
  );

  // Wrap startResize: animation guard + capture before positions
  const startResize = useCallback(
    (e: React.MouseEvent, control: Control, handle: string) => {
      if (anim.isAnimatingRef.current) return;
      captureBeforePositions();
      base.startResize(e, control, handle);
    },
    [base, anim.isAnimatingRef, captureBeforePositions]
  );

  // Wrap handleMouseUp: base cleanup + undo recording + animations
  const handleMouseUp = useCallback(async () => {
    const wasDragging = base.dragState.isDragging;
    const wasResizing = base.dragState.isResizing;
    base.handleMouseUp();

    if (wasDragging) {
      const beforeMovePositions = beforePositionsRef.current.map(bp => ({
        id: bp.id,
        x: bp.x,
        y: bp.y,
      }));
      undoRedo.recordMove(selectedControls, beforeMovePositions);

      if (options.enableAnimations && options.snapToGrid) {
        const afterPositions = selectedControls.map(c => ({ id: c.id, x: c.x, y: c.y }));
        const hasMovement = afterPositions.some((after, i) => {
          const before = beforePositionsRef.current[i];
          return before && (Math.abs(after.x - before.x) > 2 || Math.abs(after.y - before.y) > 2);
        });
        if (hasMovement) {
          const snapped = afterPositions.map(p => ({
            ...p,
            x: Math.round(p.x / options.gridSize) * options.gridSize,
            y: Math.round(p.y / options.gridSize) * options.gridSize,
          }));
          await anim.withAnimationGuard(async () => {
            await anim.animateSnapToGrid(selectedControls, afterPositions, snapped);
            updateControls(
              controls.map(c => {
                const s = snapped.find(sp => sp.id === c.id);
                return s ? { ...c, x: s.x, y: s.y } : c;
              })
            );
          });
        }
      }
    }

    if (wasResizing) {
      undoRedo.recordResize(selectedControls, beforePositionsRef.current);
      if (options.enableAnimations) {
        const afterSizes = selectedControls.map(c => ({
          id: c.id,
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
        }));
        await anim.withAnimationGuard(() =>
          anim.animateResizeEnd(selectedControls, beforePositionsRef.current, afterSizes)
        );
      }
    }
  }, [base, selectedControls, controls, updateControls, undoRedo, options, anim]);

  // Animated alignment with undo recording
  const alignControls = useCallback(
    async (alignmentType: AlignmentType) => {
      if (selectedControls.length < 2 || anim.isAnimatingRef.current) return;

      const beforePositions = selectedControls.map(c => ({ id: c.id, x: c.x, y: c.y }));
      const left = Math.min(...selectedControls.map(c => c.x));
      const right = Math.max(...selectedControls.map(c => c.x + c.width));
      const top = Math.min(...selectedControls.map(c => c.y));
      const bottom = Math.max(...selectedControls.map(c => c.y + c.height));
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;

      const selectedIds = new Set(selectedControls.map(c => c.id));
      const alignedControls = controls.map(c => {
        if (!selectedIds.has(c.id)) return c;
        switch (alignmentType) {
          case 'left':
            return { ...c, x: left };
          case 'center':
            return { ...c, x: cx - c.width / 2 };
          case 'right':
            return { ...c, x: right - c.width };
          case 'top':
            return { ...c, y: top };
          case 'middle':
            return { ...c, y: cy - c.height / 2 };
          case 'bottom':
            return { ...c, y: bottom - c.height };
          default:
            return c;
        }
      });

      const afterPositions = selectedControls.map(c => {
        const a = alignedControls.find(ac => ac.id === c.id);
        return a ? { id: c.id, x: a.x, y: a.y } : { id: c.id, x: c.x, y: c.y };
      });
      undoRedo.recordAlign(selectedControls, alignmentType, beforePositions);
      await anim.withAnimationGuard(async () => {
        await anim.animateAlignmentTransition(
          selectedControls,
          beforePositions,
          afterPositions,
          alignmentType
        );
        updateControls(alignedControls);
      });
    },
    [selectedControls, controls, updateControls, undoRedo, anim]
  );

  // Animated control creation
  const createControlWithAnimation = useCallback(
    async (control: Control) => {
      await anim.withAnimationGuard(() => anim.animateCreation([control]));
    },
    [anim]
  );

  // Animated control deletion
  const deleteControlsWithAnimation = useCallback(
    async (controlsToDelete: Control[]) => {
      await anim.withAnimationGuard(() => anim.animateDeletion(controlsToDelete));
    },
    [anim]
  );

  return {
    ...base,
    isAnimating: anim.isAnimating,
    startDrag,
    startResize,
    handleMouseUp,
    alignControls,
    createControlWithAnimation,
    deleteControlsWithAnimation,
  };
};
