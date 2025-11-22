/**
 * VB6 UpDown (Spin Button) Control Implementation
 * 
 * Spinner control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface UpDownControl {
  type: 'UpDown';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Value Properties
  min: number;
  max: number;
  value: number;
  increment: number;
  
  // Behavior
  wrap: boolean; // Wrap around when reaching min/max
  autoRepeat: boolean; // Auto-repeat when holding button
  
  // Buddy Control
  buddyControl: string; // Name of associated control
  buddyProperty: string; // Property to update in buddy
  
  // Appearance
  orientation: number; // 0=Vertical, 1=Horizontal
  alignment: number; // 0=Right/Bottom, 1=Left/Top
  
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
  onUpClick?: string;
  onDownClick?: string;
}

interface UpDownControlProps {
  control: UpDownControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const UpDownControl: React.FC<UpDownControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 16,
    height = 20,
    min = 0,
    max = 100,
    value = 0,
    increment = 1,
    wrap = false,
    autoRepeat = true,
    buddyControl = '',
    buddyProperty = 'Text',
    orientation = 0,
    alignment = 0,
    enabled = true,
    visible = true,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = ''
  } = control;

  const [currentValue, setCurrentValue] = useState(value);
  const [isUpPressed, setIsUpPressed] = useState(false);
  const [isDownPressed, setIsDownPressed] = useState(false);
  const [autoRepeatTimeout, setAutoRepeatTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoRepeatInterval, setAutoRepeatInterval] = useState<NodeJS.Timeout | null>(null);

  // Sync with control value
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleValueChange = useCallback((newValue: number, direction: 'up' | 'down') => {
    let clampedValue = newValue;
    
    if (wrap) {
      // Wrap around
      if (newValue > max) {
        clampedValue = min;
      } else if (newValue < min) {
        clampedValue = max;
      }
    } else {
      // Clamp to range
      clampedValue = Math.max(min, Math.min(max, newValue));
    }
    
    if (clampedValue !== currentValue) {
      setCurrentValue(clampedValue);
      onPropertyChange?.('value', clampedValue);
      
      // Update buddy control if specified
      if (buddyControl && buddyProperty) {
        // In a real implementation, this would find and update the buddy control
        console.log(`Updating ${buddyControl}.${buddyProperty} = ${clampedValue}`);
      }
      
      // Fire events
      onEvent?.('Change');
      if (direction === 'up') {
        onEvent?.('UpClick');
      } else {
        onEvent?.('DownClick');
      }
    }
  }, [currentValue, min, max, wrap, buddyControl, buddyProperty, onPropertyChange, onEvent]);

  const handleUpClick = useCallback(() => {
    if (!enabled) return;
    handleValueChange(currentValue + increment, 'up');
  }, [enabled, currentValue, increment, handleValueChange]);

  const handleDownClick = useCallback(() => {
    if (!enabled) return;
    handleValueChange(currentValue - increment, 'down');
  }, [enabled, currentValue, increment, handleValueChange]);

  const startAutoRepeat = useCallback((action: () => void) => {
    if (!autoRepeat || !enabled) return;
    
    // Clear any existing timers
    if (autoRepeatTimeout) clearTimeout(autoRepeatTimeout);
    if (autoRepeatInterval) clearInterval(autoRepeatInterval);
    
    // Start with a delay, then repeat
    const timeout = setTimeout(() => {
      const interval = setInterval(action, 100); // Repeat every 100ms
      setAutoRepeatInterval(interval);
    }, 500); // Initial delay of 500ms
    
    setAutoRepeatTimeout(timeout);
  }, [autoRepeat, enabled, autoRepeatTimeout, autoRepeatInterval]);

  const stopAutoRepeat = useCallback(() => {
    if (autoRepeatTimeout) {
      clearTimeout(autoRepeatTimeout);
      setAutoRepeatTimeout(null);
    }
    if (autoRepeatInterval) {
      clearInterval(autoRepeatInterval);
      setAutoRepeatInterval(null);
    }
  }, [autoRepeatTimeout, autoRepeatInterval]);

  const handleUpMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    event.preventDefault();
    setIsUpPressed(true);
    handleUpClick();
    startAutoRepeat(handleUpClick);
  }, [enabled, handleUpClick, startAutoRepeat]);

  const handleDownMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    event.preventDefault();
    setIsDownPressed(true);
    handleDownClick();
    startAutoRepeat(handleDownClick);
  }, [enabled, handleDownClick, startAutoRepeat]);

  const handleMouseUp = useCallback(() => {
    setIsUpPressed(false);
    setIsDownPressed(false);
    stopAutoRepeat();
  }, [stopAutoRepeat]);

  const handleMouseLeave = useCallback(() => {
    setIsUpPressed(false);
    setIsDownPressed(false);
    stopAutoRepeat();
  }, [stopAutoRepeat]);

  // Keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        handleUpClick();
        break;
      case 'ArrowDown':
        event.preventDefault();
        handleDownClick();
        break;
    }
  }, [enabled, handleUpClick, handleDownClick]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopAutoRepeat();
    };
  }, [stopAutoRepeat]);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px outset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'default';
  };

  const isVertical = orientation === 0;

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: getBorderStyle(),
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row' as const
  };

  const buttonStyle = {
    flex: 1,
    border: 'none',
    background: '#e0e0e0',
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    userSelect: 'none' as const,
    ':hover': {
      background: enabled ? '#f0f0f0' : '#e0e0e0'
    }
  };

  const upButtonStyle = {
    ...buttonStyle,
    background: isUpPressed ? '#d0d0d0' : '#e0e0e0',
    borderBottom: isVertical ? '1px solid #808080' : 'none',
    borderRight: !isVertical ? '1px solid #808080' : 'none'
  };

  const downButtonStyle = {
    ...buttonStyle,
    background: isDownPressed ? '#d0d0d0' : '#e0e0e0'
  };

  return (
    <div
      className={`vb6-updown ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      tabIndex={enabled ? 0 : -1}
      onKeyDown={handleKeyDown}
      onMouseLeave={handleMouseLeave}
      data-name={name}
      data-type="UpDown"
    >
      {/* Up/Left Button */}
      <button
        style={upButtonStyle}
        onMouseDown={handleUpMouseDown}
        onMouseUp={handleMouseUp}
        disabled={!enabled}
      >
        {isVertical ? '▲' : '◄'}
      </button>

      {/* Down/Right Button */}
      <button
        style={downButtonStyle}
        onMouseDown={handleDownMouseDown}
        onMouseUp={handleMouseUp}
        disabled={!enabled}
      >
        {isVertical ? '▼' : '►'}
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
          {buddyControl && (
            <div>Buddy: {buddyControl}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpDownControl;