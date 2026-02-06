/**
 * VB6 VScrollBar Control Implementation
 *
 * Vertical scrollbar control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface VScrollBarControl {
  type: 'VScrollBar';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // VB6 VScrollBar Properties
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

interface VScrollBarControlProps {
  control: VScrollBarControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const VScrollBarControl: React.FC<VScrollBarControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 20,
    height = 100,
    min = 0,
    max = 100,
    value = 0,
    smallChange = 1,
    largeChange = 10,
    enabled = true,
    visible = true,
    mousePointer = 0,
    tag = '',
  } = control;

  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, value: 0 });
  const scrollbarRef = useRef<HTMLDivElement>(null);

  // Sync with control value
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Calculate thumb position and size
  const range = max - min;
  const thumbHeight = Math.max(20, (largeChange / range) * height * 0.8);
  const trackHeight = height - 40; // Subtract arrow button heights
  const thumbPosition = ((currentValue - min) / range) * (trackHeight - thumbHeight);

  const handleValueChange = useCallback(
    (newValue: number) => {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      setCurrentValue(clampedValue);
      onPropertyChange?.('value', clampedValue);

      // Fire events
      if (onEvent) {
        onEvent('Change');
        onEvent('Scroll');
      }
    },
    [min, max, onPropertyChange, onEvent]
  );

  const handleUpArrowClick = useCallback(() => {
    if (!enabled) return;
    handleValueChange(currentValue - smallChange);
  }, [currentValue, smallChange, enabled, handleValueChange]);

  const handleDownArrowClick = useCallback(() => {
    if (!enabled) return;
    handleValueChange(currentValue + smallChange);
  }, [currentValue, smallChange, enabled, handleValueChange]);

  const handleTrackClick = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled || isDragging) return;

      const rect = scrollbarRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickY = event.clientY - rect.top - 20; // Subtract top arrow height
      const trackHeight = height - 40 - thumbHeight;
      const percentage = Math.max(0, Math.min(1, clickY / trackHeight));
      const newValue = min + percentage * range;

      handleValueChange(newValue);
    },
    [enabled, isDragging, height, thumbHeight, min, range, handleValueChange]
  );

  const handleThumbMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled) return;

      event.preventDefault();
      setIsDragging(true);
      setDragStart({
        y: event.clientY,
        value: currentValue,
      });
    },
    [enabled, currentValue]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !enabled) return;

      const deltaY = event.clientY - dragStart.y;
      const trackHeight = height - 40 - thumbHeight;
      const valueChange = (deltaY / trackHeight) * range;
      const newValue = dragStart.value + valueChange;

      handleValueChange(newValue);
    },
    [isDragging, enabled, dragStart, height, thumbHeight, range, handleValueChange]
  );

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
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          handleValueChange(currentValue - smallChange);
          break;
        case 'ArrowDown':
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
    },
    [enabled, currentValue, smallChange, largeChange, min, max, handleValueChange]
  );

  if (!visible) {
    return null;
  }

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

  return (
    <div
      ref={scrollbarRef}
      className={`vb6-vscrollbar ${!enabled ? 'disabled' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: getCursorStyle(),
        opacity: enabled ? 1 : 0.5,
        outline: isDesignMode ? '1px dotted #333' : 'none',
      }}
      tabIndex={enabled ? 0 : -1}
      onKeyDown={handleKeyDown}
      data-name={name}
      data-type="VScrollBar"
    >
      {/* Up Arrow Button */}
      <button
        className="scroll-arrow up-arrow"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${width}px`,
          height: '20px',
          border: '1px solid #999',
          background: enabled ? '#f0f0f0' : '#e0e0e0',
          cursor: enabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
        }}
        disabled={!enabled}
        onMouseDown={e => {
          e.preventDefault();
          handleUpArrowClick();
        }}
      >
        ▲
      </button>

      {/* Track */}
      <div
        className="scroll-track"
        style={{
          position: 'absolute',
          left: 0,
          top: '20px',
          width: `${width}px`,
          height: `${height - 40}px`,
          border: '1px inset #999',
          background: '#f8f8f8',
          cursor: enabled ? 'pointer' : 'not-allowed',
        }}
        onClick={handleTrackClick}
      >
        {/* Thumb */}
        <div
          className="scroll-thumb"
          style={{
            position: 'absolute',
            left: '2px',
            top: `${thumbPosition}px`,
            width: `${width - 4}px`,
            height: `${thumbHeight}px`,
            border: '1px outset #999',
            background: enabled ? '#d0d0d0' : '#e0e0e0',
            cursor: enabled ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
            userSelect: 'none',
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>

      {/* Down Arrow Button */}
      <button
        className="scroll-arrow down-arrow"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: `${width}px`,
          height: '20px',
          border: '1px solid #999',
          background: enabled ? '#f0f0f0' : '#e0e0e0',
          cursor: enabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
        }}
        disabled={!enabled}
        onMouseDown={e => {
          e.preventDefault();
          handleDownArrowClick();
        }}
      >
        ▼
      </button>

      {/* Design Mode Info */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '100%',
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {name} ({currentValue})
        </div>
      )}
    </div>
  );
};

export default VScrollBarControl;
