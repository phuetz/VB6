import React from 'react';

interface GridManagerProps {
  show: boolean;
  size: number;
  color?: string;
  opacity?: number;
  containerWidth: number;
  containerHeight: number;
}

export const GridManager: React.FC<GridManagerProps> = ({
  show,
  size,
  color = '#e0e0e0',
  opacity = 0.5,
  containerWidth,
  containerHeight,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        backgroundImage: `
          repeating-linear-gradient(0deg, ${color}, ${color} 1px, transparent 1px, transparent ${size}px),
          repeating-linear-gradient(90deg, ${color}, ${color} 1px, transparent 1px, transparent ${size}px)
        `,
        opacity,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};
