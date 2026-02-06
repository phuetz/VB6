/**
 * VB6 ProgressBar Control Implementation
 *
 * Progress indicator control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface ProgressBarControl {
  type: 'ProgressBar';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // Progress Properties
  min: number;
  max: number;
  value: number;

  // Appearance
  backColor: string;
  foreColor: string;
  scrolling: number; // 0=Standard, 1=Smooth
  orientation: number; // 0=Horizontal, 1=Vertical

  // Behavior
  enabled: boolean;
  visible: boolean;

  // Appearance
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  mousePointer: number;
  tag: string;

  // Events
  onChange?: string;
}

interface ProgressBarControlProps {
  control: ProgressBarControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const ProgressBarControl: React.FC<ProgressBarControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 150,
    height = 20,
    min = 0,
    max = 100,
    value = 0,
    backColor = '#C0C0C0',
    foreColor = '#0000FF',
    scrolling = 0,
    orientation = 0,
    enabled = true,
    visible = true,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = '',
  } = control;

  const [currentValue, setCurrentValue] = useState(value);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Sync with control value
  useEffect(() => {
    if (scrolling === 1) {
      // Smooth scrolling animation
      const startValue = currentValue;
      const endValue = value;
      const duration = 300; // ms
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const interpolatedValue = startValue + (endValue - startValue) * easedProgress;
        setCurrentValue(interpolatedValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setCurrentValue(value);
    }
  }, [value, scrolling, currentValue]);

  // Calculate progress percentage
  const range = max - min;
  const clampedValue = Math.max(min, Math.min(max, currentValue));
  const percentage = range > 0 ? ((clampedValue - min) / range) * 100 : 0;

  // Handle value change
  const handleValueChange = useCallback(
    (newValue: number) => {
      const clampedNewValue = Math.max(min, Math.min(max, newValue));
      setCurrentValue(clampedNewValue);
      onPropertyChange?.('value', clampedNewValue);
      onEvent?.('Change');
    },
    [min, max, onPropertyChange, onEvent]
  );

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '2px inset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default',
      'auto',
      'crosshair',
      'text',
      'wait',
      'help',
      'pointer',
      'not-allowed',
      'move',
      'col-resize',
      'row-resize',
      'n-resize',
      's-resize',
      'e-resize',
      'w-resize',
    ];
    return cursors[mousePointer] || 'default';
  };

  const isHorizontal = orientation === 0;

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: backColor,
    border: getBorderStyle(),
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    overflow: 'hidden',
  };

  const progressStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    backgroundColor: foreColor,
    transition: scrolling === 1 ? 'all 0.3s ease-out' : 'none',
    ...(isHorizontal
      ? {
          width: `${percentage}%`,
          height: '100%',
        }
      : {
          width: '100%',
          height: `${percentage}%`,
          top: `${100 - percentage}%`,
        }),
  };

  // Chunked progress bar style (Windows classic)
  const renderChunkedProgress = () => {
    const chunkSize = isHorizontal ? 10 : 8;
    const chunkSpacing = 2;
    const totalSize = isHorizontal ? width - 4 : height - 4;
    const availableSize = (totalSize * percentage) / 100;

    const numChunks = Math.floor(availableSize / (chunkSize + chunkSpacing));
    const chunks = [];

    for (let i = 0; i < numChunks; i++) {
      const chunkStyle = {
        position: 'absolute' as const,
        backgroundColor: foreColor,
        ...(isHorizontal
          ? {
              left: `${2 + i * (chunkSize + chunkSpacing)}px`,
              top: '2px',
              width: `${chunkSize}px`,
              height: `${height - 4}px`,
            }
          : {
              left: '2px',
              bottom: `${2 + i * (chunkSize + chunkSpacing)}px`,
              width: `${width - 4}px`,
              height: `${chunkSize}px`,
            }),
      };

      chunks.push(<div key={i} style={chunkStyle} />);
    }

    return chunks;
  };

  return (
    <div
      className={`vb6-progressbar ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      data-name={name}
      data-type="ProgressBar"
    >
      {/* Progress fill */}
      {scrolling === 0 ? (
        // Chunked style (classic Windows)
        renderChunkedProgress()
      ) : (
        // Smooth style
        <div style={progressStyle} />
      )}

      {/* Progress text overlay (optional) */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: percentage > 50 ? backColor : foreColor,
            fontWeight: 'bold',
            pointerEvents: 'none',
            textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
          }}
        >
          {Math.round(percentage)}%
        </div>
      )}

      {/* Design Mode Info */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {name} ({currentValue.toFixed(0)}/{max})
        </div>
      )}
    </div>
  );
};

export default ProgressBarControl;
