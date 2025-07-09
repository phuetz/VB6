import React from 'react';

interface AnimatedDropProps {
  children: React.ReactNode;
  isVisible: boolean;
  delay?: number;
}

export const AnimatedDrop: React.FC<AnimatedDropProps> = ({ 
  children, 
  isVisible, 
  delay = 0 
}) => {
  const [shouldRender, setShouldRender] = React.useState(isVisible);
  const [animationClass, setAnimationClass] = React.useState('');

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setTimeout(() => {
        setAnimationClass('animate-drop-in');
      }, delay);
    } else {
      setAnimationClass('animate-drop-out');
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isVisible, delay]);

  if (!shouldRender) return null;

  return (
    <div className={`transition-all duration-300 ${animationClass}`}>
      {children}
    </div>
  );
};

interface MagneticSnapProps {
  children: React.ReactNode;
  isSnapping: boolean;
  snapPosition: { x: number; y: number };
}

export const MagneticSnap: React.FC<MagneticSnapProps> = ({ 
  children, 
  isSnapping, 
  snapPosition 
}) => {
  const [currentPosition, setCurrentPosition] = React.useState(snapPosition);

  React.useEffect(() => {
    if (isSnapping) {
      // Animation de snap magnétique
      const startTime = Date.now();
      const startPos = currentPosition;
      const duration = 200;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function pour un effet de rebond
        const easeOutBack = (t: number) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };

        const easedProgress = easeOutBack(progress);
        
        setCurrentPosition({
          x: startPos.x + (snapPosition.x - startPos.x) * easedProgress,
          y: startPos.y + (snapPosition.y - startPos.y) * easedProgress,
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isSnapping, snapPosition, currentPosition]);

  return (
    <div
      style={{
        transform: `translate(${currentPosition.x}px, ${currentPosition.y}px)`,
        transition: isSnapping ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      {children}
    </div>
  );
};

interface PulseHighlightProps {
  children: React.ReactNode;
  isActive: boolean;
  color?: string;
}

export const PulseHighlight: React.FC<PulseHighlightProps> = ({ 
  children, 
  isActive, 
  color = 'rgb(59, 130, 246)' 
}) => {
  return (
    <div className="relative">
      {children}
      {isActive && (
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${color}`,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
};

interface RippleEffectProps {
  isTriggered: boolean;
  onComplete?: () => void;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({ 
  isTriggered, 
  onComplete 
}) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  React.useEffect(() => {
    if (isTriggered) {
      const newRipple = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
      };

      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        onComplete?.();
      }, 600);
    }
  }, [isTriggered, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute rounded-full bg-blue-400 opacity-30"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            animation: 'ripple 0.6s ease-out forwards',
          }}
        />
      ))}
    </div>
  );
};

// Styles CSS pour les animations (à ajouter dans votre fichier CSS global)
export const animationStyles = `
@keyframes dropZoneValid {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.02); opacity: 0.5; }
}

@keyframes dropZoneInvalid {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes dropZonePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.3;
  }
  100% {
    width: 100px;
    height: 100px;
    margin-left: -50px;
    margin-top: -50px;
    opacity: 0;
  }
}

@keyframes animate-drop-in {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes animate-drop-out {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
}

.dragging {
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.drop-zone-valid {
  background-color: rgba(34, 197, 94, 0.1);
  border: 2px dashed #22c55e;
}

.drop-zone-invalid {
  background-color: rgba(239, 68, 68, 0.1);
  border: 2px dashed #ef4444;
}

.drop-zone-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;