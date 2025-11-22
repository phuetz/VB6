// React Hook for Smooth Animations in VB6 IDE
// Provides easy integration with the AnimationService

import { useCallback, useEffect, useRef } from 'react';
import { animationService, AnimationConfig } from '../services/AnimationService';
import { Control } from '../context/types';

export interface UseAnimationsReturn {
  // Movement animations
  animateMove: (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    config?: Partial<AnimationConfig>
  ) => Promise<void>;

  // Resize animations
  animateResize: (
    controls: Control[],
    fromSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    toSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    config?: Partial<AnimationConfig>
  ) => Promise<void>;

  // Snap-to-grid animations
  animateSnapToGrid: (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    config?: Partial<AnimationConfig>
  ) => Promise<void>;

  // Alignment animations
  animateAlignment: (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    alignmentType: string,
    config?: Partial<AnimationConfig>
  ) => Promise<void>;

  // Fade animations
  animateFade: (
    controlIds: number[],
    fromOpacity: number,
    toOpacity: number,
    config?: Partial<AnimationConfig>
  ) => Promise<void>;

  // Utility functions
  stopAnimation: (animationId: string) => void;
  stopAllAnimations: () => void;
  isAnimating: (animationId: string) => boolean;
  getActiveAnimations: () => string[];
}

export const useAnimations = (): UseAnimationsReturn => {
  const activeAnimationsRef = useRef<Set<string>>(new Set());

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      // Stop all animations started by this hook instance
      activeAnimationsRef.current.forEach(animationId => {
        animationService.stopAnimation(animationId);
      });
    };
  }, []);

  // Track animation lifecycle
  const trackAnimation = useCallback((animationPromise: Promise<void>, animationId?: string) => {
    if (animationId) {
      activeAnimationsRef.current.add(animationId);
      animationPromise.finally(() => {
        activeAnimationsRef.current.delete(animationId);
      });
    }
    return animationPromise;
  }, []);

  // Movement animations with smooth easing
  const animateMove = useCallback(async (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    config: Partial<AnimationConfig> = {}
  ) => {
    const controlIds = controls.map(c => c.id);
    const animationId = `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animationPromise = animationService.animateMove(controlIds, fromPositions, toPositions, {
      duration: 300,
      easing: 'ease-out',
      ...config
    });

    return trackAnimation(animationPromise, animationId);
  }, [trackAnimation]);

  // Resize animations with spring effect
  const animateResize = useCallback(async (
    controls: Control[],
    fromSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    toSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    config: Partial<AnimationConfig> = {}
  ) => {
    const controlIds = controls.map(c => c.id);
    const animationId = `resize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animationPromise = animationService.animateResize(controlIds, fromSizes, toSizes, {
      duration: 250,
      easing: 'ease-out',
      ...config
    });

    return trackAnimation(animationPromise, animationId);
  }, [trackAnimation]);

  // Snap-to-grid with magnetic effect
  const animateSnapToGrid = useCallback(async (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    config: Partial<AnimationConfig> = {}
  ) => {
    const controlIds = controls.map(c => c.id);
    const animationId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animationPromise = animationService.animateSnapToGrid(controlIds, fromPositions, toPositions, {
      duration: 150,
      easing: 'ease-out',
      ...config
    });

    return trackAnimation(animationPromise, animationId);
  }, [trackAnimation]);

  // Alignment with elastic bounce effect
  const animateAlignment = useCallback(async (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    alignmentType: string,
    config: Partial<AnimationConfig> = {}
  ) => {
    const controlIds = controls.map(c => c.id);
    const animationId = `align_${alignmentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animationPromise = animationService.animateAlignment(
      controlIds, 
      fromPositions, 
      toPositions, 
      alignmentType, 
      {
        duration: 400,
        easing: 'bounce',
        delay: 50,
        ...config
      }
    );

    return trackAnimation(animationPromise, animationId);
  }, [trackAnimation]);

  // Fade effect for creation/deletion
  const animateFade = useCallback(async (
    controlIds: number[],
    fromOpacity: number,
    toOpacity: number,
    config: Partial<AnimationConfig> = {}
  ) => {
    const animationId = `fade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animationPromise = animationService.animateFade(controlIds, fromOpacity, toOpacity, {
      duration: 200,
      easing: 'ease-in-out',
      ...config
    });

    return trackAnimation(animationPromise, animationId);
  }, [trackAnimation]);

  // Control functions
  const stopAnimation = useCallback((animationId: string) => {
    animationService.stopAnimation(animationId);
    activeAnimationsRef.current.delete(animationId);
  }, []);

  const stopAllAnimations = useCallback(() => {
    animationService.stopAllAnimations();
    activeAnimationsRef.current.clear();
  }, []);

  const isAnimating = useCallback((animationId: string) => {
    return animationService.isAnimating(animationId);
  }, []);

  const getActiveAnimations = useCallback(() => {
    return animationService.getActiveAnimations();
  }, []);

  return {
    animateMove,
    animateResize,
    animateSnapToGrid,
    animateAlignment,
    animateFade,
    stopAnimation,
    stopAllAnimations,
    isAnimating,
    getActiveAnimations,
  };
};

// Utility hook for common animation patterns
export const useControlAnimations = () => {
  const animations = useAnimations();

  // Animate control creation with fade-in
  const animateControlCreation = useCallback(async (controls: Control[]) => {
    const controlIds = controls.map(c => c.id);
    await animations.animateFade(controlIds, 0, 1, {
      duration: 300,
      easing: 'ease-out'
    });
  }, [animations]);

  // Animate control deletion with fade-out
  const animateControlDeletion = useCallback(async (controls: Control[]) => {
    const controlIds = controls.map(c => c.id);
    await animations.animateFade(controlIds, 1, 0, {
      duration: 200,
      easing: 'ease-in'
    });
  }, [animations]);

  // Animate drag with smooth movement
  const animateDragMovement = useCallback(async (
    controls: Control[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>
  ) => {
    await animations.animateMove(controls, fromPositions, toPositions, {
      duration: 200,
      easing: 'ease-out'
    });
  }, [animations]);

  // Animate resize with elastic effect
  const animateControlResize = useCallback(async (
    controls: Control[],
    fromSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    toSizes: Array<{id: number; x: number; y: number; width: number; height: number}>
  ) => {
    await animations.animateResize(controls, fromSizes, toSizes, {
      duration: 300,
      easing: 'bounce'
    });
  }, [animations]);

  // Animate paste with scale effect (using opacity as scale proxy)
  const animateControlPaste = useCallback(async (controls: Control[]) => {
    const controlIds = controls.map(c => c.id);
    // First make them invisible
    await animations.animateFade(controlIds, 0, 0, { duration: 1 });
    // Then animate them in with a slight delay
    await animations.animateFade(controlIds, 0, 1, {
      duration: 400,
      easing: 'bounce',
      delay: 100
    });
  }, [animations]);

  return {
    ...animations,
    animateControlCreation,
    animateControlDeletion,
    animateDragMovement,
    animateControlResize,
    animateControlPaste,
  };
};