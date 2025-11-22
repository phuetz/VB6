// Animation Overlay Component
// Provides visual feedback during control manipulation animations

import React, { useEffect, useState, useCallback } from 'react';
import { Control } from '../../context/types';

interface AnimationFrame {
  animationId: string;
  type: string;
  targets: Array<{
    id: number;
    current: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      opacity?: number;
    };
  }>;
  metadata?: any;
}

interface AnimationOverlayProps {
  controls: Control[];
  zoom: number;
  canvasOffset: { x: number; y: number };
}

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  controls,
  zoom,
  canvasOffset
}) => {
  const [activeAnimations, setActiveAnimations] = useState<Map<string, AnimationFrame>>(new Map());

  // Listen for animation updates
  useEffect(() => {
    const handleAnimationUpdate = (event: CustomEvent<AnimationFrame>) => {
      const frame = event.detail;
      setActiveAnimations(prev => new Map(prev.set(frame.animationId, frame)));
    };

    const handleAnimationComplete = (event: CustomEvent<{ animationId: string }>) => {
      setActiveAnimations(prev => {
        const updated = new Map(prev);
        updated.delete(event.detail.animationId);
        return updated;
      });
    };

    window.addEventListener('vb6-animation-update', handleAnimationUpdate as EventListener);
    window.addEventListener('vb6-animation-complete', handleAnimationComplete as EventListener);

    return () => {
      window.removeEventListener('vb6-animation-update', handleAnimationUpdate as EventListener);
      window.removeEventListener('vb6-animation-complete', handleAnimationComplete as EventListener);
    };
  }, []);

  // Render animation effects
  const renderAnimationEffects = useCallback(() => {
    const effects: React.ReactNode[] = [];

    activeAnimations.forEach((frame, animationId) => {
      frame.targets.forEach((target, index) => {
        const control = controls.find(c => c.id === target.id);
        if (!control) return;

        const key = `${animationId}-${target.id}-${index}`;
        const style: React.CSSProperties = {
          position: 'absolute',
          left: (target.current.x + canvasOffset.x) * zoom,
          top: (target.current.y + canvasOffset.y) * zoom,
          width: (target.current.width || control.width) * zoom,
          height: (target.current.height || control.height) * zoom,
          opacity: target.current.opacity !== undefined ? target.current.opacity : 1,
          pointerEvents: 'none',
          zIndex: 1000,
        };

        // Different visual effects based on animation type
        switch (frame.type) {
          case 'move':
            effects.push(
              <div
                key={key}
                style={{
                  ...style,
                  border: '2px dashed #4CAF50',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  transition: 'none',
                }}
              />
            );
            break;

          case 'resize':
            effects.push(
              <div
                key={key}
                style={{
                  ...style,
                  border: '2px dashed #FF9800',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  transition: 'none',
                }}
              />
            );
            break;

          case 'snap':
            effects.push(
              <div
                key={key}
                style={{
                  ...style,
                  border: '2px solid #2196F3',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(33, 150, 243, 0.2)',
                  boxShadow: '0 0 10px rgba(33, 150, 243, 0.5)',
                  transition: 'none',
                }}
              />
            );
            break;

          case 'align': {
            const alignmentType = frame.metadata?.alignmentType || 'unknown';
            effects.push(
              <div
                key={key}
                style={{
                  ...style,
                  border: '3px solid #E91E63',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(233, 30, 99, 0.15)',
                  boxShadow: '0 0 15px rgba(233, 30, 99, 0.6)',
                  transition: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#E91E63',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    opacity: 0.9,
                  }}
                >
                  {alignmentType.toUpperCase()}
                </div>
              </div>
            );
            break;
          }

          case 'fade':
            effects.push(
              <div
                key={key}
                style={{
                  ...style,
                  border: '2px solid #9C27B0',
                  borderRadius: '4px',
                  backgroundColor: `rgba(156, 39, 176, ${target.current.opacity || 0.1})`,
                  transition: 'none',
                }}
              />
            );
            break;

          default:
            // Generic animation effect
            effects.push(
              <div
                key={key}
                style={{
                  ...style,
                  border: '2px dashed #607D8B',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(96, 125, 139, 0.1)',
                  transition: 'none',
                }}
              />
            );
        }
      });
    });

    return effects;
  }, [activeAnimations, controls, zoom, canvasOffset]);

  // Don't render if no active animations
  if (activeAnimations.size === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 999,
        overflow: 'hidden',
      }}
    >
      {renderAnimationEffects()}
    </div>
  );
};

export default AnimationOverlay;