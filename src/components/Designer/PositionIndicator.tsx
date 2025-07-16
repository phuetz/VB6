import React from 'react';
import { Control } from '../../context/types';

interface PositionIndicatorProps {
  control: Control;
  isVisible: boolean;
  showSize?: boolean;
  showCoordinates?: boolean;
}

export const PositionIndicator: React.FC<PositionIndicatorProps> = ({
  control,
  isVisible,
  showSize = true,
  showCoordinates = true,
}) => {
  if (!isVisible) return null;

  const formatValue = (value: number) => Math.round(value);

  return (
    <div
      style={{
        position: 'absolute',
        left: control.x,
        top: control.y - 20,
        backgroundColor: '#333',
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '10px',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        zIndex: 10001,
        pointerEvents: 'none',
      }}
    >
      {showCoordinates && `X: ${formatValue(control.x)}, Y: ${formatValue(control.y)}`}
      {showCoordinates && showSize && ' | '}
      {showSize && `W: ${formatValue(control.width)}, H: ${formatValue(control.height)}`}
    </div>
  );
};
