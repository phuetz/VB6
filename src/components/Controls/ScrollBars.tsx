import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Control } from '../../context/types';

interface ScrollBarProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
  orientation: 'horizontal' | 'vertical';
}

const ScrollBar: React.FC<ScrollBarProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize,
  orientation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [thumbStart, setThumbStart] = useState(0);

  const properties = control.properties || {};

  // VB6 ScrollBar Properties
  const value = Math.max(properties.Min || 0, Math.min(properties.Max || 100, properties.Value || 0));
  const min = properties.Min || 0;
  const max = properties.Max || 100;
  const smallChange = properties.SmallChange || 1;
  const largeChange = properties.LargeChange || 10;
  const enabled = properties.Enabled !== false;

  // Calculate thumb position and size
  const range = max - min;
  const trackSize = orientation === 'horizontal' ? control.width - 32 : control.height - 32; // Subtract arrow buttons
  const thumbSize = Math.max(20, trackSize * largeChange / (range + largeChange));
  const thumbPosition = range > 0 ? ((value - min) / range) * (trackSize - thumbSize) : 0;

  // Handle thumb drag
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled) return;
    
    setIsThumbDragging(true);
    setThumbStart(orientation === 'horizontal' ? e.clientX : e.clientY);
  }, [enabled, orientation]);

  // Handle track click
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!enabled || isThumbDragging) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos = orientation === 'horizontal' 
      ? e.clientX - rect.left - 16 // Subtract left arrow button
      : e.clientY - rect.top - 16;  // Subtract top arrow button

    const newValue = clickPos < thumbPosition 
      ? Math.max(min, value - largeChange)
      : Math.min(max, value + largeChange);

    // Update value
    if (control.events?.onChange) {
      control.events.onChange('Value', newValue);
    }

    // Trigger VB6 events
    if (control.events?.Change) {
      control.events.Change();
    }
  }, [enabled, isThumbDragging, orientation, thumbPosition, value, min, max, largeChange, control.events]);

  // Handle arrow button clicks
  const handleArrowClick = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!enabled) return;

    let newValue = value;
    switch (direction) {
      case 'left':
      case 'up':
        newValue = Math.max(min, value - smallChange);
        break;
      case 'right':
      case 'down':
        newValue = Math.min(max, value + smallChange);
        break;
    }

    // Update value
    if (control.events?.onChange) {
      control.events.onChange('Value', newValue);
    }

    // Trigger VB6 events
    if (control.events?.Change) {
      control.events.Change();
    }
  }, [enabled, value, min, max, smallChange, control.events]);

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

  // Global mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isThumbDragging) {
        const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
        const delta = currentPos - thumbStart;
        const newThumbPos = thumbPosition + delta;
        const normalizedPos = Math.max(0, Math.min(trackSize - thumbSize, newThumbPos));
        const newValue = min + (normalizedPos / (trackSize - thumbSize)) * range;
        const clampedValue = Math.max(min, Math.min(max, Math.round(newValue)));

        if (control.events?.onChange) {
          control.events.onChange('Value', clampedValue);
        }

        setThumbStart(currentPos);
      } else if (isDragging || isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        if (isDragging) {
          onMove(deltaX, deltaY);
        } else if (isResizing) {
          onResize(resizeCorner, deltaX, deltaY);
        }

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (isThumbDragging && control.events?.Scroll) {
        control.events.Scroll();
      }
      
      setIsDragging(false);
      setIsResizing(false);
      setIsThumbDragging(false);
      setResizeCorner('');
    };

    if (isDragging || isResizing || isThumbDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isThumbDragging, dragStart, thumbStart, thumbPosition, trackSize, thumbSize, range, min, max, orientation, onMove, onResize, resizeCorner, control.events]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '1px solid #808080',
    backgroundColor: '#c0c0c0',
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    cursor: isDragging ? 'move' : 'default',
    opacity: enabled ? 1 : 0.5
  };

  const arrowButtonStyle: React.CSSProperties = {
    width: orientation === 'horizontal' ? 16 : '100%',
    height: orientation === 'horizontal' ? '100%' : 16,
    backgroundColor: '#c0c0c0',
    border: '1px outset #c0c0c0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'default',
    fontSize: '8px',
    userSelect: 'none'
  };

  const trackStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#808080',
    position: 'relative',
    cursor: enabled ? 'pointer' : 'default'
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#c0c0c0',
    border: '1px outset #c0c0c0',
    cursor: enabled ? (orientation === 'horizontal' ? 'ew-resize' : 'ns-resize') : 'default',
    ...(orientation === 'horizontal' ? {
      left: thumbPosition,
      top: 0,
      width: thumbSize,
      height: '100%'
    } : {
      left: 0,
      top: thumbPosition,
      width: '100%',
      height: thumbSize
    })
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      className={`vb6-scrollbar vb6-${orientation}-scrollbar`}
    >
      {/* First arrow button */}
      <div
        style={arrowButtonStyle}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleArrowClick(orientation === 'horizontal' ? 'left' : 'up');
        }}
      >
        {orientation === 'horizontal' ? '◀' : '▲'}
      </div>

      {/* Track */}
      <div
        style={trackStyle}
        onClick={handleTrackClick}
      >
        {/* Thumb */}
        <div
          ref={thumbRef}
          style={thumbStyle}
          onMouseDown={handleThumbMouseDown}
        />
      </div>

      {/* Second arrow button */}
      <div
        style={arrowButtonStyle}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleArrowClick(orientation === 'horizontal' ? 'right' : 'down');
        }}
      >
        {orientation === 'horizontal' ? '▶' : '▼'}
      </div>

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

// HScrollBar component
export const HScrollBar: React.FC<Omit<ScrollBarProps, 'orientation'>> = (props) => (
  <ScrollBar {...props} orientation="horizontal" />
);

// VScrollBar component
export const VScrollBar: React.FC<Omit<ScrollBarProps, 'orientation'>> = (props) => (
  <ScrollBar {...props} orientation="vertical" />
);

export default ScrollBar;