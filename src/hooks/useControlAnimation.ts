// Animation state management and primitives for control manipulation
// Wraps useControlAnimations with animation guards and speed configuration

import { useCallback, useRef, useState } from 'react';
import { Control } from '../context/types';
import { useControlAnimations } from './useAnimations';

interface ControlAnimationOptions {
  enableAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

interface PositionRef {
  id: number;
  x: number;
  y: number;
}

interface SizeRef extends PositionRef {
  width: number;
  height: number;
}

export const useControlAnimation = (options: ControlAnimationOptions) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const animations = useControlAnimations();

  const getAnimationDuration = useCallback(
    (baseTime: number) => {
      const multipliers = { slow: 1.5, normal: 1, fast: 0.7 };
      return baseTime * multipliers[options.animationSpeed];
    },
    [options.animationSpeed]
  );

  const withAnimationGuard = useCallback(async (fn: () => Promise<void>): Promise<void> => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    try {
      await fn();
    } finally {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  }, []);

  const animateSnapToGrid = useCallback(
    (controls: Control[], from: PositionRef[], to: PositionRef[]) =>
      animations.animateSnapToGrid(controls, from, to, {
        duration: getAnimationDuration(150),
        easing: 'ease-out',
      }),
    [animations, getAnimationDuration]
  );

  const animateResizeEnd = useCallback(
    (controls: Control[], from: SizeRef[], to: SizeRef[]) =>
      animations.animateResize(controls, from, to, {
        duration: getAnimationDuration(200),
        easing: 'bounce',
      }),
    [animations, getAnimationDuration]
  );

  const animateAlignmentTransition = useCallback(
    (controls: Control[], from: PositionRef[], to: PositionRef[], alignmentType: string) =>
      animations.animateAlignment(controls, from, to, alignmentType, {
        duration: getAnimationDuration(400),
        easing: 'bounce',
      }),
    [animations, getAnimationDuration]
  );

  const animateCreation = useCallback(
    (controls: Control[]) => animations.animateControlCreation(controls),
    [animations]
  );

  const animateDeletion = useCallback(
    (controls: Control[]) => animations.animateControlDeletion(controls),
    [animations]
  );

  return {
    isAnimating,
    isAnimatingRef,
    withAnimationGuard,
    animateSnapToGrid,
    animateResizeEnd,
    animateAlignmentTransition,
    animateCreation,
    animateDeletion,
  };
};
