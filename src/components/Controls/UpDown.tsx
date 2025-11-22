import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Control } from '../../context/types';

interface UpDownProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

const UpDown: React.FC<UpDownProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUpPressed, setIsUpPressed] = useState(false);
  const [isDownPressed, setIsDownPressed] = useState(false);
  const [autoRepeatTimer, setAutoRepeatTimer] = useState<NodeJS.Timeout | null>(null);

  const properties = control.properties || {};

  // VB6 UpDown Properties
  const value = properties.Value || 0;
  const min = properties.Min || 0;
  const max = properties.Max || 100;
  const increment = properties.Increment || 1;
  const orientation = properties.Orientation || 0; // 0=Vertical, 1=Horizontal
  const autoRepeat = properties.AutoRepeat !== false;
  const autoRepeatDelay = properties.AutoRepeatDelay || 500; // Initial delay in ms
  const autoRepeatInterval = properties.AutoRepeatInterval || 50; // Repeat interval in ms
  const buddyControl = properties.BuddyControl || null; // Associated control
  const buddyProperty = properties.BuddyProperty || 'Text'; // Property to update
  const syncBuddy = properties.SyncBuddy !== false;
  const thousands = properties.Thousands === true; // Show thousands separator
  const wrap = properties.Wrap === true; // Wrap at min/max
  const hotTracking = properties.HotTracking === true;

  // Handle value change
  const handleValueChange = useCallback((newValue: number, direction: 'up' | 'down') => {
    let clampedValue = newValue;

    if (wrap) {
      if (newValue > max) {
        clampedValue = min;
      } else if (newValue < min) {
        clampedValue = max;
      }
    } else {
      clampedValue = Math.max(min, Math.min(max, newValue));
    }

    // Update control value
    if (control.events?.onChange) {
      control.events.onChange('Value', clampedValue);
    }

    // Update buddy control if specified
    if (buddyControl && syncBuddy && control.events?.onUpdateBuddy) {
      const displayValue = thousands 
        ? clampedValue.toLocaleString()
        : clampedValue.toString();
      control.events.onUpdateBuddy(buddyControl, buddyProperty, displayValue);
    }

    // Trigger VB6 events
    if (control.events?.Change) {
      control.events.Change();
    }

    if (direction === 'up' && control.events?.UpClick) {
      control.events.UpClick();
    } else if (direction === 'down' && control.events?.DownClick) {
      control.events.DownClick();
    }
  }, [min, max, wrap, buddyControl, syncBuddy, buddyProperty, thousands, control.events]);

  // Handle up button
  const handleUp = useCallback(() => {
    handleValueChange(value + increment, 'up');
  }, [value, increment, handleValueChange]);

  // Handle down button
  const handleDown = useCallback(() => {
    handleValueChange(value - increment, 'down');
  }, [value, increment, handleValueChange]);

  // Start auto-repeat
  const startAutoRepeat = useCallback((action: 'up' | 'down') => {
    if (!autoRepeat) return;

    // Clear existing timer
    if (autoRepeatTimer) {
      clearTimeout(autoRepeatTimer);
    }

    // Initial delay
    const timer = setTimeout(() => {
      // Start repeating
      const repeatAction = () => {
        if (action === 'up') {
          handleUp();
        } else {
          handleDown();
        }
      };

      // Repeat interval
      const interval = setInterval(repeatAction, autoRepeatInterval);
      
      // Store interval for cleanup
      setAutoRepeatTimer(interval as any);
    }, autoRepeatDelay);

    setAutoRepeatTimer(timer);
  }, [autoRepeat, autoRepeatTimer, autoRepeatDelay, autoRepeatInterval, handleUp, handleDown]);

  // Stop auto-repeat
  const stopAutoRepeat = useCallback(() => {
    if (autoRepeatTimer) {
      clearTimeout(autoRepeatTimer);
      clearInterval(autoRepeatTimer);
      setAutoRepeatTimer(null);
    }
  }, [autoRepeatTimer]);

  // Mouse event handlers for buttons
  const handleUpMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsUpPressed(true);
    handleUp();
    startAutoRepeat('up');
  }, [handleUp, startAutoRepeat]);

  const handleDownMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDownPressed(true);
    handleDown();
    startAutoRepeat('down');
  }, [handleDown, startAutoRepeat]);

  const handleButtonMouseUp = useCallback(() => {
    setIsUpPressed(false);
    setIsDownPressed(false);
    stopAutoRepeat();
  }, [stopAutoRepeat]);

  // Mouse event handlers for control dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();

    if (e.detail === 2) {
      onDoubleClick();
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handles
    const handleSize = 8;
    const isOnRightEdge = x >= control.width - handleSize;
    const isOnBottomEdge = y >= control.height - handleSize;
    const isOnLeftEdge = x <= handleSize;
    const isOnTopEdge = y <= handleSize;

    if (selected && (isOnRightEdge || isOnBottomEdge || isOnLeftEdge || isOnTopEdge)) {
      setIsResizing(true);
      let corner = '';
      if (isOnTopEdge && isOnLeftEdge) corner = 'nw';
      else if (isOnTopEdge && isOnRightEdge) corner = 'ne';
      else if (isOnBottomEdge && isOnLeftEdge) corner = 'sw';
      else if (isOnBottomEdge && isOnRightEdge) corner = 'se';
      else if (isOnTopEdge) corner = 'n';
      else if (isOnBottomEdge) corner = 's';
      else if (isOnLeftEdge) corner = 'w';
      else if (isOnRightEdge) corner = 'e';
      setResizeCorner(corner);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleDown();
        break;
      case 'Home':
        e.preventDefault();
        handleValueChange(min, value < min ? 'up' : 'down');
        break;
      case 'End':
        e.preventDefault();
        handleValueChange(max, value > max ? 'down' : 'up');
        break;
      case 'PageUp':
        e.preventDefault();
        handleValueChange(value + increment * 10, 'up');
        break;
      case 'PageDown':
        e.preventDefault();
        handleValueChange(value - increment * 10, 'down');
        break;
    }
  }, [handleUp, handleDown, handleValueChange, min, max, value, increment]);

  // Global mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        onMove(deltaX, deltaY);
      } else if (isResizing) {
        onResize(resizeCorner, deltaX, deltaY);
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner('');
      handleButtonMouseUp();
    };

    if (isDragging || isResizing || isUpPressed || isDownPressed) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isUpPressed, isDownPressed, dragStart, resizeCorner, onMove, onResize, handleButtonMouseUp]);

  // Cleanup auto-repeat on unmount
  useEffect(() => {
    return () => {
      stopAutoRepeat();
    };
  }, [stopAutoRepeat]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '1px solid #808080',
    backgroundColor: properties.BackColor || '#c0c0c0',
    cursor: isDragging ? 'move' : 'default',
    display: 'flex',
    flexDirection: orientation === 0 ? 'column' : 'row',
    fontFamily: 'MS Sans Serif',
    fontSize: '8pt',
    overflow: 'hidden'
  };

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#c0c0c0',
    border: '1px outset #c0c0c0',
    cursor: properties.Enabled !== false ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    userSelect: 'none',
    opacity: properties.Enabled !== false ? 1 : 0.5
  };

  const upButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    border: isUpPressed ? '1px inset #c0c0c0' : '1px outset #c0c0c0',
    backgroundColor: isUpPressed ? '#a0a0a0' : '#c0c0c0'
  };

  const downButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    border: isDownPressed ? '1px inset #c0c0c0' : '1px outset #c0c0c0',
    backgroundColor: isDownPressed ? '#a0a0a0' : '#c0c0c0'
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="vb6-updown"
      title={`UpDown - Value: ${value} (${min}-${max})`}
    >
      {/* Up/Left Button */}
      <div
        style={upButtonStyle}
        onMouseDown={handleUpMouseDown}
        onMouseEnter={hotTracking ? (e) => {
          if (!isUpPressed) {
            e.currentTarget.style.backgroundColor = '#d0d0d0';
          }
        } : undefined}
        onMouseLeave={hotTracking ? (e) => {
          if (!isUpPressed) {
            e.currentTarget.style.backgroundColor = '#c0c0c0';
          }
        } : undefined}
      >
        {orientation === 0 ? '▲' : '◀'}
      </div>

      {/* Down/Right Button */}
      <div
        style={downButtonStyle}
        onMouseDown={handleDownMouseDown}
        onMouseEnter={hotTracking ? (e) => {
          if (!isDownPressed) {
            e.currentTarget.style.backgroundColor = '#d0d0d0';
          }
        } : undefined}
        onMouseLeave={hotTracking ? (e) => {
          if (!isDownPressed) {
            e.currentTarget.style.backgroundColor = '#c0c0c0';
          }
        } : undefined}
      >
        {orientation === 0 ? '▼' : '▶'}
      </div>

      {/* Value display (for debugging, not visible in real VB6) */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: -16,
            left: 0,
            backgroundColor: '#ffffe0',
            border: '1px solid #808080',
            padding: '1px 4px',
            fontSize: '8px',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {thousands ? value.toLocaleString() : value}
        </div>
      )}

      {/* Resize handles */}
      {selected && (
        <>
          <div className="vb6-resize-handle nw" style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'nw-resize' }} />
          <div className="vb6-resize-handle ne" style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'ne-resize' }} />
          <div className="vb6-resize-handle sw" style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'sw-resize' }} />
          <div className="vb6-resize-handle se" style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'se-resize' }} />
          <div className="vb6-resize-handle n" style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'n-resize' }} />
          <div className="vb6-resize-handle s" style={{ position: 'absolute', bottom: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 's-resize' }} />
          <div className="vb6-resize-handle w" style={{ position: 'absolute', top: '50%', left: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'w-resize' }} />
          <div className="vb6-resize-handle e" style={{ position: 'absolute', top: '50%', right: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'e-resize' }} />
        </>
      )}
    </div>
  );
};

export default UpDown;