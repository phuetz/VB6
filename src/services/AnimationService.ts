// Animation Service for VB6 IDE
// Provides smooth transition animations for control manipulation

export interface AnimationConfig {
  duration: number; // Animation duration in milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  delay?: number; // Optional delay before animation starts
}

export interface AnimationTarget {
  id: number; // Control ID
  from: { x: number; y: number; width?: number; height?: number; opacity?: number; };
  to: { x: number; y: number; width?: number; height?: number; opacity?: number; };
}

export interface AnimationSequence {
  id: string;
  targets: AnimationTarget[];
  config: AnimationConfig;
  onComplete?: () => void;
  onUpdate?: (progress: number, targets: AnimationTarget[]) => void;
}

export class AnimationService {
  private static instance: AnimationService;
  private activeAnimations = new Map<string, {
    sequence: AnimationSequence;
    startTime: number;
    rafId: number;
  }>();
  
  private animationCallbacks = new Map<string, (frame: any) => void>();

  static getInstance(): AnimationService {
    if (!AnimationService.instance) {
      AnimationService.instance = new AnimationService();
    }
    return AnimationService.instance;
  }

  // Easing functions
  private easingFunctions = {
    linear: (t: number) => t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    bounce: (t: number) => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    },
    elastic: (t: number) => {
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    }
  };

  // Start an animation sequence
  startAnimation(sequence: AnimationSequence): void {
    // Stop any existing animation with the same ID
    this.stopAnimation(sequence.id);

    const startTime = Date.now() + (sequence.config.delay || 0);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / sequence.config.duration, 1);
      
      if (progress < 0) {
        // Still in delay period
        const rafId = requestAnimationFrame(animate);
        this.activeAnimations.set(sequence.id, { sequence, startTime, rafId });
        return;
      }

      // Apply easing
      const easedProgress = this.easingFunctions[sequence.config.easing](progress);
      
      // Calculate current values for each target
      const currentTargets = sequence.targets.map(target => ({
        ...target,
        current: {
          x: this.interpolate(target.from.x, target.to.x, easedProgress),
          y: this.interpolate(target.from.y, target.to.y, easedProgress),
          width: target.from.width !== undefined && target.to.width !== undefined 
            ? this.interpolate(target.from.width, target.to.width, easedProgress)
            : undefined,
          height: target.from.height !== undefined && target.to.height !== undefined 
            ? this.interpolate(target.from.height, target.to.height, easedProgress)
            : undefined,
          opacity: target.from.opacity !== undefined && target.to.opacity !== undefined 
            ? this.interpolate(target.from.opacity, target.to.opacity, easedProgress)
            : undefined,
        }
      }));

      // Call update callback
      if (sequence.onUpdate) {
        sequence.onUpdate(progress, currentTargets);
      }

      if (progress >= 1) {
        // Animation complete
        this.activeAnimations.delete(sequence.id);
        if (sequence.onComplete) {
          sequence.onComplete();
        }
      } else {
        // Continue animation
        const rafId = requestAnimationFrame(animate);
        this.activeAnimations.set(sequence.id, { sequence, startTime, rafId });
      }
    };

    const rafId = requestAnimationFrame(animate);
    this.activeAnimations.set(sequence.id, { sequence, startTime, rafId });
  }

  // Stop a specific animation
  stopAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      cancelAnimationFrame(animation.rafId);
      this.activeAnimations.delete(animationId);
    }
  }

  // Stop all animations
  stopAllAnimations(): void {
    for (const [id, animation] of this.activeAnimations) {
      cancelAnimationFrame(animation.rafId);
    }
    this.activeAnimations.clear();
  }

  // Check if an animation is running
  isAnimating(animationId: string): boolean {
    return this.activeAnimations.has(animationId);
  }

  // Get all active animation IDs
  getActiveAnimations(): string[] {
    return Array.from(this.activeAnimations.keys());
  }

  // Interpolation helper
  private interpolate(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
  }

  // Convenience methods for common animations

  // Animate control movement
  animateMove(
    controlIds: number[], 
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationId = `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const targets: AnimationTarget[] = controlIds.map(id => {
        const fromPos = fromPositions.find(p => p.id === id) || { id, x: 0, y: 0 };
        const toPos = toPositions.find(p => p.id === id) || { id, x: 0, y: 0 };
        
        return {
          id,
          from: { x: fromPos.x, y: fromPos.y },
          to: { x: toPos.x, y: toPos.y }
        };
      });

      this.startAnimation({
        id: animationId,
        targets,
        config: {
          duration: 300,
          easing: 'ease-out',
          ...config
        },
        onComplete: resolve,
        onUpdate: (progress, currentTargets) => {
          // Emit update event for UI to handle
          this.emitAnimationUpdate(animationId, 'move', currentTargets);
        }
      });
    });
  }

  // Animate control resizing
  animateResize(
    controlIds: number[],
    fromSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    toSizes: Array<{id: number; x: number; y: number; width: number; height: number}>,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationId = `resize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const targets: AnimationTarget[] = controlIds.map(id => {
        const from = fromSizes.find(s => s.id === id) || { id, x: 0, y: 0, width: 100, height: 30 };
        const to = toSizes.find(s => s.id === id) || { id, x: 0, y: 0, width: 100, height: 30 };
        
        return {
          id,
          from: { x: from.x, y: from.y, width: from.width, height: from.height },
          to: { x: to.x, y: to.y, width: to.width, height: to.height }
        };
      });

      this.startAnimation({
        id: animationId,
        targets,
        config: {
          duration: 250,
          easing: 'ease-out',
          ...config
        },
        onComplete: resolve,
        onUpdate: (progress, currentTargets) => {
          this.emitAnimationUpdate(animationId, 'resize', currentTargets);
        }
      });
    });
  }

  // Animate snap-to-grid effect
  animateSnapToGrid(
    controlIds: number[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const targets: AnimationTarget[] = controlIds.map(id => {
        const from = fromPositions.find(p => p.id === id) || { id, x: 0, y: 0 };
        const to = toPositions.find(p => p.id === id) || { id, x: 0, y: 0 };
        
        return {
          id,
          from: { x: from.x, y: from.y },
          to: { x: to.x, y: to.y }
        };
      });

      this.startAnimation({
        id: animationId,
        targets,
        config: {
          duration: 150,
          easing: 'ease-out',
          ...config
        },
        onComplete: resolve,
        onUpdate: (progress, currentTargets) => {
          this.emitAnimationUpdate(animationId, 'snap', currentTargets);
        }
      });
    });
  }

  // Animate alignment effect
  animateAlignment(
    controlIds: number[],
    fromPositions: Array<{id: number; x: number; y: number}>,
    toPositions: Array<{id: number; x: number; y: number}>,
    alignmentType: string,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationId = `align_${alignmentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const targets: AnimationTarget[] = controlIds.map(id => {
        const from = fromPositions.find(p => p.id === id) || { id, x: 0, y: 0 };
        const to = toPositions.find(p => p.id === id) || { id, x: 0, y: 0 };
        
        return {
          id,
          from: { x: from.x, y: from.y },
          to: { x: to.x, y: to.y }
        };
      });

      this.startAnimation({
        id: animationId,
        targets,
        config: {
          duration: 400,
          easing: 'elastic',
          delay: 100, // Small delay for visual effect
          ...config
        },
        onComplete: resolve,
        onUpdate: (progress, currentTargets) => {
          this.emitAnimationUpdate(animationId, 'align', currentTargets, { alignmentType });
        }
      });
    });
  }

  // Animate fade effect
  animateFade(
    controlIds: number[],
    fromOpacity: number,
    toOpacity: number,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationId = `fade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const targets: AnimationTarget[] = controlIds.map(id => ({
        id,
        from: { x: 0, y: 0, opacity: fromOpacity },
        to: { x: 0, y: 0, opacity: toOpacity }
      }));

      this.startAnimation({
        id: animationId,
        targets,
        config: {
          duration: 200,
          easing: 'ease-in-out',
          ...config
        },
        onComplete: resolve,
        onUpdate: (progress, currentTargets) => {
          this.emitAnimationUpdate(animationId, 'fade', currentTargets);
        }
      });
    });
  }

  // Event emission for UI updates
  private emitAnimationUpdate(
    animationId: string, 
    type: string, 
    targets: any[], 
    metadata?: any
  ): void {
    const callback = this.animationCallbacks.get(animationId);
    if (callback) {
      callback({
        animationId,
        type,
        targets,
        metadata
      });
    }

    // Also emit to global listeners
    window.dispatchEvent(new CustomEvent('vb6-animation-update', {
      detail: { animationId, type, targets, metadata }
    }));
  }

  // Subscribe to animation updates
  subscribe(animationId: string, callback: (frame: any) => void): () => void {
    this.animationCallbacks.set(animationId, callback);
    
    return () => {
      this.animationCallbacks.delete(animationId);
    };
  }

  // Get animation statistics
  getStats(): {
    activeAnimations: number;
    totalAnimationsStarted: number;
    averageFrameRate: number;
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      totalAnimationsStarted: 0, // Would need to track this
      averageFrameRate: 60 // Placeholder - would need to calculate actual
    };
  }
}

// Export singleton instance
export const animationService = AnimationService.getInstance();