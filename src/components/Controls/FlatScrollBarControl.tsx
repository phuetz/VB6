/**
 * VB6 FlatScrollBar Control Implementation
 * 
 * Flat-style scrollbar with full VB6 compatibility
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface FlatScrollBarControl {
  type: 'FlatScrollBar';
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
  
  // Orientation
  orientation: number; // 0=Horizontal, 1=Vertical
  
  // Flat Appearance Properties
  appearance: number; // 0=Flat, 1=3D
  arrows: boolean; // Show arrow buttons
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  
  // Appearance
  mousePointer: number;
  tag: string;
  
  // Events
  onChange?: string;
  onScroll?: string;
}

interface FlatScrollBarControlProps {
  control: FlatScrollBarControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const FlatScrollBarControl: React.FC<FlatScrollBarControlProps> = ({
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
    orientation = 0,
    appearance = 0,
    arrows = true,
    enabled = true,
    visible = true,
    mousePointer = 0,
    tag = ''
  } = control;

  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, value: 0 });
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [pressedPart, setPressedPart] = useState<string | null>(null);

  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isHorizontal = orientation === 0;

  // Sync with control value
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    if (clampedValue !== currentValue) {
      setCurrentValue(clampedValue);
      onPropertyChange?.('value', clampedValue);
      onEvent?.('Change');
      onEvent?.('Scroll');
    }
  }, [currentValue, min, max, onPropertyChange, onEvent]);

  const getThumbPosition = useCallback(() => {
    if (max <= min) return 0;
    const range = max - min;
    const valueOffset = currentValue - min;
    const percentage = valueOffset / range;
    
    const trackSize = isHorizontal ? width - (arrows ? 32 : 0) : height - (arrows ? 32 : 0);
    const thumbSize = Math.max(20, trackSize * 0.1);
    const availableSpace = trackSize - thumbSize;
    
    return percentage * availableSpace;
  }, [currentValue, min, max, isHorizontal, width, height, arrows]);

  const getThumbSize = useCallback(() => {
    const trackSize = isHorizontal ? width - (arrows ? 32 : 0) : height - (arrows ? 32 : 0);
    return Math.max(20, trackSize * 0.1);
  }, [isHorizontal, width, height, arrows]);

  const handleArrowClick = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!enabled) return;
    
    let delta = 0;
    if ((isHorizontal && direction === 'left') || (!isHorizontal && direction === 'up')) {
      delta = -smallChange;
    } else if ((isHorizontal && direction === 'right') || (!isHorizontal && direction === 'down')) {
      delta = smallChange;
    }
    
    handleValueChange(currentValue + delta);
  }, [enabled, isHorizontal, smallChange, currentValue, handleValueChange]);

  const handleTrackClick = useCallback((event: React.MouseEvent) => {
    if (!enabled || !scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickPos = isHorizontal 
      ? event.clientX - rect.left - (arrows ? 16 : 0)
      : event.clientY - rect.top - (arrows ? 16 : 0);
    
    const trackSize = isHorizontal ? width - (arrows ? 32 : 0) : height - (arrows ? 32 : 0);
    const thumbSize = getThumbSize();
    const thumbPos = getThumbPosition();
    
    // Check if click is on thumb
    if (clickPos >= thumbPos && clickPos <= thumbPos + thumbSize) {
      return; // Don't handle track click if clicking on thumb
    }
    
    // Determine direction
    const isBeforeThumb = clickPos < thumbPos;
    const delta = isBeforeThumb ? -largeChange : largeChange;
    
    handleValueChange(currentValue + delta);
  }, [enabled, isHorizontal, arrows, width, height, currentValue, largeChange, handleValueChange, getThumbPosition, getThumbSize]);

  const handleThumbMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
      value: currentValue
    });
  }, [enabled, currentValue]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !enabled || !scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const trackSize = isHorizontal ? width - (arrows ? 32 : 0) : height - (arrows ? 32 : 0);
    const thumbSize = getThumbSize();
    const availableSpace = trackSize - thumbSize;
    
    const delta = isHorizontal 
      ? event.clientX - dragStart.x 
      : event.clientY - dragStart.y;
    
    const pixelsPerValue = availableSpace / (max - min);
    const valueDelta = delta / pixelsPerValue;
    
    handleValueChange(dragStart.value + valueDelta);
  }, [isDragging, enabled, isHorizontal, width, height, arrows, dragStart, max, min, getThumbSize, handleValueChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setPressedPart(null);
  }, []);

  const handlePartMouseEnter = useCallback((part: string) => {
    setHoveredPart(part);
  }, []);

  const handlePartMouseLeave = useCallback(() => {
    setHoveredPart(null);
  }, []);

  const handlePartMouseDown = useCallback((part: string) => {
    setPressedPart(part);
  }, []);

  // Mouse event listeners
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

  const getPartStyle = (part: string, baseStyle: React.CSSProperties) => {
    const isHovered = hoveredPart === part;
    const isPressed = pressedPart === part;
    
    let background = appearance === 0 ? '#e0e0e0' : '#f0f0f0';
    let border = appearance === 0 ? 'none' : '1px outset #d0d0d0';
    
    if (isPressed) {
      background = '#c0c0c0';
      border = appearance === 0 ? '1px inset #808080' : '1px inset #d0d0d0';
    } else if (isHovered && enabled) {
      background = '#f0f0f0';
      border = appearance === 0 ? '1px solid #808080' : '1px outset #d0d0d0';
    }
    
    return {
      ...baseStyle,
      background,
      border,
      cursor: enabled ? 'pointer' : 'not-allowed'
    };
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    background: appearance === 0 ? '#f8f8f8' : '#f0f0f0',
    border: appearance === 0 ? '1px solid #c0c0c0' : '1px inset #d0d0d0',
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column' as const,
    userSelect: 'none' as const
  };

  const arrowButtonStyle = {
    width: isHorizontal ? '16px' : '100%',
    height: isHorizontal ? '100%' : '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: enabled ? '#000' : '#808080'
  };

  const trackStyle = {
    flex: 1,
    position: 'relative' as const,
    background: appearance === 0 ? '#f8f8f8' : '#e0e0e0',
    border: appearance === 0 ? 'none' : '1px inset #c0c0c0'
  };

  const thumbPosition = getThumbPosition();
  const thumbSize = getThumbSize();

  const thumbStyle = {
    position: 'absolute' as const,
    [isHorizontal ? 'left' : 'top']: `${thumbPosition}px`,
    [isHorizontal ? 'width' : 'height']: `${thumbSize}px`,
    [isHorizontal ? 'height' : 'width']: '100%',
    background: appearance === 0 ? '#d0d0d0' : '#e8e8e8',
    border: appearance === 0 ? '1px solid #a0a0a0' : '1px outset #d0d0d0',
    cursor: enabled ? (isHorizontal ? 'ew-resize' : 'ns-resize') : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div
      ref={scrollbarRef}
      className={`vb6-flatscrollbar ${!enabled ? 'disabled' : ''} ${isHorizontal ? 'horizontal' : 'vertical'}`}
      style={containerStyle}
      data-name={name}
      data-type="FlatScrollBar"
    >
      {/* Start Arrow */}
      {arrows && (
        <div
          style={getPartStyle('startArrow', arrowButtonStyle)}
          onMouseDown={() => {
            handlePartMouseDown('startArrow');
            handleArrowClick(isHorizontal ? 'left' : 'up');
          }}
          onMouseEnter={() => handlePartMouseEnter('startArrow')}
          onMouseLeave={handlePartMouseLeave}
        >
          {isHorizontal ? '◄' : '▲'}
        </div>
      )}

      {/* Track */}
      <div
        style={trackStyle}
        onClick={handleTrackClick}
        onMouseEnter={() => handlePartMouseEnter('track')}
        onMouseLeave={handlePartMouseLeave}
      >
        {/* Thumb */}
        <div
          style={thumbStyle}
          onMouseDown={handleThumbMouseDown}
          onMouseEnter={() => handlePartMouseEnter('thumb')}
          onMouseLeave={handlePartMouseLeave}
        >
          {/* Thumb grip (for flat appearance) */}
          {appearance === 0 && (
            <div
              style={{
                width: isHorizontal ? '8px' : '100%',
                height: isHorizontal ? '100%' : '8px',
                background: `repeating-${isHorizontal ? 'linear' : 'linear'}-gradient(
                  ${isHorizontal ? '90deg' : '0deg'},
                  transparent,
                  transparent 1px,
                  #a0a0a0 1px,
                  #a0a0a0 2px
                )`
              }}
            />
          )}
        </div>
      </div>

      {/* End Arrow */}
      {arrows && (
        <div
          style={getPartStyle('endArrow', arrowButtonStyle)}
          onMouseDown={() => {
            handlePartMouseDown('endArrow');
            handleArrowClick(isHorizontal ? 'right' : 'down');
          }}
          onMouseEnter={() => handlePartMouseEnter('endArrow')}
          onMouseLeave={handlePartMouseLeave}
        >
          {isHorizontal ? '►' : '▼'}
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
            zIndex: 1000
          }}
        >
          {name} ({currentValue}/{max}) - {isHorizontal ? 'H' : 'V'}
        </div>
      )}
    </div>
  );
};

// Helper functions for FlatScrollBar
export const FlatScrollBarHelpers = {
  /**
   * Create horizontal flat scrollbar
   */
  createHorizontal: (width: number = 100): Partial<FlatScrollBarControl> => ({
    type: 'FlatScrollBar',
    orientation: 0,
    width,
    height: 17, // Standard height for horizontal scrollbar
    appearance: 0, // Flat
    arrows: true
  }),

  /**
   * Create vertical flat scrollbar
   */
  createVertical: (height: number = 100): Partial<FlatScrollBarControl> => ({
    type: 'FlatScrollBar',
    orientation: 1,
    width: 17, // Standard width for vertical scrollbar
    height,
    appearance: 0, // Flat
    arrows: true
  }),

  /**
   * Calculate thumb size based on visible content ratio
   */
  calculateThumbSize: (trackSize: number, contentSize: number, visibleSize: number): number => {
    if (contentSize <= visibleSize) return trackSize;
    const ratio = visibleSize / contentSize;
    return Math.max(20, trackSize * ratio);
  },

  /**
   * Calculate value from pixel position
   */
  pixelToValue: (pixel: number, trackSize: number, thumbSize: number, min: number, max: number): number => {
    const availableSpace = trackSize - thumbSize;
    if (availableSpace <= 0) return min;
    
    const ratio = Math.max(0, Math.min(1, pixel / availableSpace));
    return min + (max - min) * ratio;
  },

  /**
   * Calculate pixel position from value
   */
  valueToPixel: (value: number, trackSize: number, thumbSize: number, min: number, max: number): number => {
    if (max <= min) return 0;
    const ratio = (value - min) / (max - min);
    const availableSpace = trackSize - thumbSize;
    return ratio * availableSpace;
  }
};

export default FlatScrollBarControl;