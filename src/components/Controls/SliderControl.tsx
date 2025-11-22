/**
 * VB6 Slider/TrackBar Control Implementation
 * 
 * Slider control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface SliderControl {
  type: 'Slider';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Value Properties
  min: number;
  max: number;
  value: number;
  smallChange: number;
  largeChange: number;
  
  // Tick Properties
  tickFrequency: number;
  tickStyle: number; // 0=Bottom/Right, 1=Top/Left, 2=Both, 3=None
  
  // Appearance
  backColor: string;
  foreColor: string;
  orientation: number; // 0=Horizontal, 1=Vertical
  
  // Selection
  selStart: number;
  selLength: number;
  clearSel: boolean;
  
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
  onScroll?: string;
  onClick?: string;
}

interface SliderControlProps {
  control: SliderControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 150,
    height = 45,
    min = 0,
    max = 10,
    value = 0,
    smallChange = 1,
    largeChange = 5,
    tickFrequency = 1,
    tickStyle = 0,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    orientation = 0,
    selStart = 0,
    selLength = 0,
    clearSel = true,
    enabled = true,
    visible = true,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = ''
  } = control;

  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, value: 0 });
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Sync with control value
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const isHorizontal = orientation === 0;
  const range = max - min;
  const percentage = range > 0 ? ((currentValue - min) / range) * 100 : 0;

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const snappedValue = Math.round(clampedValue / smallChange) * smallChange;
    
    setCurrentValue(snappedValue);
    onPropertyChange?.('value', snappedValue);
    
    // Fire events
    if (onEvent) {
      onEvent('Change');
      onEvent('Scroll');
    }
  }, [min, max, smallChange, onPropertyChange, onEvent]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;

    event.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
      value: currentValue
    });

    // If clicking on track (not thumb), jump to position
    if (event.target !== thumbRef.current) {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (rect) {
        const trackSize = isHorizontal ? width - 20 : height - 20;
        const clickPos = isHorizontal 
          ? event.clientX - rect.left - 10
          : rect.bottom - event.clientY - 10;
        
        const newPercentage = Math.max(0, Math.min(100, (clickPos / trackSize) * 100));
        const newValue = min + (newPercentage / 100) * range;
        
        handleValueChange(newValue);
        onEvent?.('Click');
      }
    }
  }, [enabled, currentValue, isHorizontal, width, height, min, range, handleValueChange, onEvent]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !enabled) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    const trackSize = isHorizontal ? width - 20 : height - 20;
    const delta = isHorizontal ? deltaX : -deltaY;
    
    const valueChange = (delta / trackSize) * range;
    const newValue = dragStart.value + valueChange;
    
    handleValueChange(newValue);
  }, [isDragging, enabled, dragStart, isHorizontal, width, height, range, handleValueChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;
    
    let newValue = currentValue;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        newValue = currentValue - smallChange;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        newValue = currentValue + smallChange;
        break;
      case 'PageDown':
        event.preventDefault();
        newValue = currentValue - largeChange;
        break;
      case 'PageUp':
        event.preventDefault();
        newValue = currentValue + largeChange;
        break;
      case 'Home':
        event.preventDefault();
        newValue = min;
        break;
      case 'End':
        event.preventDefault();
        newValue = max;
        break;
    }
    
    if (newValue !== currentValue) {
      handleValueChange(newValue);
    }
  }, [enabled, currentValue, smallChange, largeChange, min, max, handleValueChange]);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px inset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || (isDragging ? 'grabbing' : 'pointer');
  };

  // Calculate thumb position
  const trackSize = isHorizontal ? width - 20 : height - 20;
  const thumbPosition = (percentage / 100) * trackSize;

  // Generate tick marks
  const generateTicks = () => {
    if (tickStyle === 3 || tickFrequency <= 0) return [];
    
    const ticks = [];
    const numTicks = Math.floor(range / tickFrequency) + 1;
    
    for (let i = 0; i < numTicks; i++) {
      const tickValue = min + (i * tickFrequency);
      if (tickValue > max) break;
      
      const tickPercentage = ((tickValue - min) / range) * 100;
      const tickPosition = (tickPercentage / 100) * trackSize;
      
      // Top/Left ticks
      if (tickStyle === 1 || tickStyle === 2) {
        ticks.push(
          <div
            key={`tick-top-${i}`}
            style={{
              position: 'absolute',
              backgroundColor: foreColor,
              ...(isHorizontal ? {
                left: `${10 + tickPosition}px`,
                top: '2px',
                width: '1px',
                height: '6px'
              } : {
                left: '2px',
                bottom: `${10 + tickPosition}px`,
                width: '6px',
                height: '1px'
              })
            }}
          />
        );
      }
      
      // Bottom/Right ticks
      if (tickStyle === 0 || tickStyle === 2) {
        ticks.push(
          <div
            key={`tick-bottom-${i}`}
            style={{
              position: 'absolute',
              backgroundColor: foreColor,
              ...(isHorizontal ? {
                left: `${10 + tickPosition}px`,
                bottom: '2px',
                width: '1px',
                height: '6px'
              } : {
                right: '2px',
                bottom: `${10 + tickPosition}px`,
                width: '6px',
                height: '1px'
              })
            }}
          />
        );
      }
    }
    
    return ticks;
  };

  return (
    <div
      ref={sliderRef}
      className={`vb6-slider ${!enabled ? 'disabled' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: backColor,
        border: getBorderStyle(),
        cursor: getCursorStyle(),
        opacity: enabled ? 1 : 0.5,
        outline: isDesignMode ? '1px dotted #333' : 'none'
      }}
      tabIndex={enabled ? 0 : -1}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      data-name={name}
      data-type="Slider"
    >
      {/* Track */}
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#808080',
          border: '1px inset #d0d0d0',
          ...(isHorizontal ? {
            left: '10px',
            top: '50%',
            width: `${width - 20}px`,
            height: '4px',
            transform: 'translateY(-50%)'
          } : {
            left: '50%',
            bottom: '10px',
            width: '4px',
            height: `${height - 20}px`,
            transform: 'translateX(-50%)'
          })
        }}
      />

      {/* Selection range (if enabled) */}
      {selLength > 0 && !clearSel && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: '#0078d4',
            ...(isHorizontal ? {
              left: `${10 + (selStart / range) * trackSize}px`,
              top: '50%',
              width: `${(selLength / range) * trackSize}px`,
              height: '4px',
              transform: 'translateY(-50%)'
            } : {
              left: '50%',
              bottom: `${10 + (selStart / range) * trackSize}px`,
              width: '4px',
              height: `${(selLength / range) * trackSize}px`,
              transform: 'translateX(-50%)'
            })
          }}
        />
      )}

      {/* Thumb */}
      <div
        ref={thumbRef}
        style={{
          position: 'absolute',
          width: '12px',
          height: '20px',
          backgroundColor: '#e0e0e0',
          border: '1px outset #d0d0d0',
          cursor: isDragging ? 'grabbing' : 'grab',
          ...(isHorizontal ? {
            left: `${4 + thumbPosition}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          } : {
            left: '50%',
            bottom: `${4 + thumbPosition}px`,
            transform: 'translateX(-50%) rotate(90deg)',
            transformOrigin: 'center'
          })
        }}
      />

      {/* Tick marks */}
      {generateTicks()}

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
            zIndex: 1000
          }}
        >
          {name} ({currentValue}/{max})
        </div>
      )}
    </div>
  );
};

export default SliderControl;