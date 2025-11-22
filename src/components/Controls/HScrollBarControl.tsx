/**
 * VB6 HScrollBar Control Implementation
 * 
 * Horizontal scrollbar control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface HScrollBarControl {
  type: 'HScrollBar';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // VB6 HScrollBar Properties
  min: number;
  max: number;
  value: number;
  smallChange: number;
  largeChange: number;
  enabled: boolean;
  visible: boolean;
  
  // Appearance
  mousePointer: number;
  tag: string;
  
  // Events
  onChange?: string;
  onScroll?: string;
}

interface HScrollBarControlProps {
  control: HScrollBarControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const HScrollBarControl: React.FC<HScrollBarControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 100,
    height = 20,
    min = 0,
    max = 100,
    value = 0,
    smallChange = 1,
    largeChange = 10,
    enabled = true,
    visible = true,
    mousePointer = 0,
    tag = ''
  } = control;

  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, value: 0 });
  const scrollbarRef = useRef<HTMLDivElement>(null);

  // Sync with control value
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Calculate thumb position and size
  const range = max - min;
  const thumbWidth = Math.max(20, (largeChange / range) * width * 0.8);
  const trackWidth = width - 40; // Subtract arrow button widths
  const thumbPosition = ((currentValue - min) / range) * (trackWidth - thumbWidth);

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setCurrentValue(clampedValue);
    onPropertyChange?.('value', clampedValue);
    
    // Fire events
    if (onEvent) {
      onEvent('Change');
      onEvent('Scroll');
    }
  }, [min, max, onPropertyChange, onEvent]);

  const handleLeftArrowClick = useCallback(() => {
    if (!enabled) return;
    handleValueChange(currentValue - smallChange);
  }, [currentValue, smallChange, enabled, handleValueChange]);

  const handleRightArrowClick = useCallback(() => {
    if (!enabled) return;
    handleValueChange(currentValue + smallChange);
  }, [currentValue, smallChange, enabled, handleValueChange]);

  const handleTrackClick = useCallback((event: React.MouseEvent) => {
    if (!enabled || isDragging) return;
    
    const rect = scrollbarRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = event.clientX - rect.left - 20; // Subtract left arrow width
    const trackWidth = width - 40 - thumbWidth;
    const percentage = Math.max(0, Math.min(1, clickX / trackWidth));
    const newValue = min + (percentage * range);
    
    handleValueChange(newValue);
  }, [enabled, isDragging, width, thumbWidth, min, range, handleValueChange]);

  const handleThumbMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: event.clientX,
      value: currentValue
    });
  }, [enabled, currentValue]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !enabled) return;
    
    const deltaX = event.clientX - dragStart.x;
    const trackWidth = width - 40 - thumbWidth;
    const valueChange = (deltaX / trackWidth) * range;
    const newValue = dragStart.value + valueChange;
    
    handleValueChange(newValue);
  }, [isDragging, enabled, dragStart, width, thumbWidth, range, handleValueChange]);

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
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handleValueChange(currentValue - smallChange);
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleValueChange(currentValue + smallChange);
        break;
      case 'PageUp':
        event.preventDefault();
        handleValueChange(currentValue - largeChange);
        break;
      case 'PageDown':
        event.preventDefault();
        handleValueChange(currentValue + largeChange);
        break;
      case 'Home':
        event.preventDefault();
        handleValueChange(min);
        break;
      case 'End':
        event.preventDefault();
        handleValueChange(max);
        break;
    }
  }, [enabled, currentValue, smallChange, largeChange, min, max, handleValueChange]);

  if (!visible) {
    return null;
  }

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'default';
  };

  return (
    <div
      ref={scrollbarRef}
      className={`vb6-hscrollbar ${!enabled ? 'disabled' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: getCursorStyle(),
        opacity: enabled ? 1 : 0.5,
        outline: isDesignMode ? '1px dotted #333' : 'none'
      }}
      tabIndex={enabled ? 0 : -1}
      onKeyDown={handleKeyDown}
      data-name={name}
      data-type="HScrollBar"
    >
      {/* Left Arrow Button */}
      <button
        className="scroll-arrow left-arrow"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '20px',
          height: `${height}px`,
          border: '1px solid #999',
          background: enabled ? '#f0f0f0' : '#e0e0e0',
          cursor: enabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px'
        }}
        disabled={!enabled}
        onMouseDown={handleLeftArrowClick}
        onMouseDown={(e) => {
          e.preventDefault();
          handleLeftArrowClick();
        }}
      >
        ◀
      </button>

      {/* Track */}
      <div
        className="scroll-track"
        style={{
          position: 'absolute',
          left: '20px',
          top: 0,
          width: `${width - 40}px`,
          height: `${height}px`,
          border: '1px inset #999',
          background: '#f8f8f8',
          cursor: enabled ? 'pointer' : 'not-allowed'
        }}
        onClick={handleTrackClick}
      >
        {/* Thumb */}
        <div
          className="scroll-thumb"
          style={{
            position: 'absolute',
            left: `${thumbPosition}px`,
            top: '2px',
            width: `${thumbWidth}px`,
            height: `${height - 4}px`,
            border: '1px outset #999',
            background: enabled ? '#d0d0d0' : '#e0e0e0',
            cursor: enabled ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
            userSelect: 'none'
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>

      {/* Right Arrow Button */}
      <button
        className="scroll-arrow right-arrow"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '20px',
          height: `${height}px`,
          border: '1px solid #999',
          background: enabled ? '#f0f0f0' : '#e0e0e0',
          cursor: enabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px'
        }}
        disabled={!enabled}
        onMouseDown={(e) => {
          e.preventDefault();
          handleRightArrowClick();
        }}
      >
        ▶
      </button>

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
          {name} ({currentValue})
        </div>
      )}
    </div>
  );
};

export default HScrollBarControl;