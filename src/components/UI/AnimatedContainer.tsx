import React, { useEffect, useRef, useState, ReactNode } from 'react';

export type AnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'scaleIn'
  | 'scaleInUp'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'bounce'
  | 'elastic'
  | 'flip';

export interface AnimatedContainerProps {
  children: ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  className?: string;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeIn',
  duration = 600,
  delay = 0,
  trigger = true,
  onAnimationComplete,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger && !hasAnimated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [trigger, delay, hasAnimated]);

  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onAnimationComplete]);

  const getAnimationClasses = () => {
    const baseClass = 'transition-all ease-out';

    const animations = {
      fadeIn: isVisible ? 'opacity-100' : 'opacity-0',

      fadeInUp: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',

      fadeInDown: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',

      fadeInLeft: isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',

      fadeInRight: isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',

      scaleIn: isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',

      scaleInUp: isVisible
        ? 'opacity-100 scale-100 translate-y-0'
        : 'opacity-0 scale-95 translate-y-2',

      slideInUp: isVisible ? 'translate-y-0' : 'translate-y-full',

      slideInDown: isVisible ? 'translate-y-0' : '-translate-y-full',

      slideInLeft: isVisible ? 'translate-x-0' : '-translate-x-full',

      slideInRight: isVisible ? 'translate-x-0' : 'translate-x-full',

      bounce: isVisible ? 'animate-bounce opacity-100' : 'opacity-0',

      elastic: isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50',

      flip: isVisible ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180',
    };

    return `${baseClass} ${animations[animation]}`;
  };

  const style = {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction:
      animation === 'elastic'
        ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        : animation === 'bounce'
          ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          : 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  };

  return (
    <div ref={containerRef} className={`${getAnimationClasses()} ${className}`} style={style}>
      {children}
    </div>
  );
};

export default AnimatedContainer;
