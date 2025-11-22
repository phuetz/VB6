/**
 * VB6 CoolBar Control Implementation
 * 
 * Advanced toolbar with resizable bands and full VB6 compatibility
 */

import React, { useState, useCallback, useRef } from 'react';

export interface CoolBarBand {
  index: number;
  key: string;
  caption: string;
  child: string; // Name of child control
  width: number;
  minWidth: number;
  fixedSize: boolean;
  newRow: boolean;
  visible: boolean;
  enabled: boolean;
  image: number; // ImageList index
  tag: string;
}

export interface CoolBarControl {
  type: 'CoolBar';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Band management
  bands: CoolBarBand[];
  
  // Appearance
  allowResize: boolean;
  allowVertical: boolean;
  fixedOrder: boolean;
  orientation: number; // 0=Horizontal, 1=Vertical
  
  // Band appearance
  bandBorders: boolean;
  bandMaxWidth: number;
  bandMinHeight: number;
  
  // ImageList associations
  imageList: string; // ImageList control name
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  
  // Appearance
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  mousePointer: number;
  tag: string;
  
  // Events
  onBandClick?: string;
  onChange?: string;
  onHeightChanged?: string;
}

interface CoolBarControlProps {
  control: CoolBarControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const CoolBarControl: React.FC<CoolBarControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 400,
    height = 50,
    bands = [],
    allowResize = true,
    allowVertical = false,
    fixedOrder = false,
    orientation = 0,
    bandBorders = true,
    bandMaxWidth = 0,
    bandMinHeight = 25,
    imageList = '',
    enabled = true,
    visible = true,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = ''
  } = control;

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragType: 'resize' | 'move' | null;
    bandIndex: number;
    startX: number;
    startWidth: number;
  }>({
    isDragging: false,
    dragType: null,
    bandIndex: -1,
    startX: 0,
    startWidth: 0
  });

  const [hoveredBand, setHoveredBand] = useState<number>(-1);
  const coolBarRef = useRef<HTMLDivElement>(null);

  const isHorizontal = orientation === 0;

  const handleBandClick = useCallback((band: CoolBarBand, event: React.MouseEvent) => {
    if (!enabled || !band.enabled) return;
    
    event.preventDefault();
    onEvent?.('BandClick', { band: band.index, key: band.key });
  }, [enabled, onEvent]);

  const handleResizeStart = useCallback((bandIndex: number, event: React.MouseEvent) => {
    if (!allowResize || !enabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    setDragState({
      isDragging: true,
      dragType: 'resize',
      bandIndex,
      startX: event.clientX,
      startWidth: bands[bandIndex]?.width || 100
    });
  }, [allowResize, enabled, bands]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    const deltaX = event.clientX - dragState.startX;
    
    if (dragState.dragType === 'resize') {
      const band = bands[dragState.bandIndex];
      if (!band) return;
      
      const newWidth = Math.max(
        band.minWidth || 50,
        dragState.startWidth + deltaX
      );
      
      if (bandMaxWidth > 0) {
        Math.min(newWidth, bandMaxWidth);
      }
      
      // Update band width
      const updatedBands = bands.map((b, index) => 
        index === dragState.bandIndex ? { ...b, width: newWidth } : b
      );
      
      onPropertyChange?.('bands', updatedBands);
      onEvent?.('Change');
    }
  }, [dragState, bands, bandMaxWidth, onPropertyChange, onEvent]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      bandIndex: -1,
      startX: 0,
      startWidth: 0
    });
  }, []);

  const handleBandMouseEnter = useCallback((bandIndex: number) => {
    setHoveredBand(bandIndex);
  }, []);

  const handleBandMouseLeave = useCallback(() => {
    setHoveredBand(-1);
  }, []);

  // Mouse event listeners
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

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
    return cursors[mousePointer] || 'default';
  };

  const getBandStyle = (band: CoolBarBand, index: number) => {
    const isHovered = hoveredBand === index;
    
    let background = '#f0f0f0';
    const border = bandBorders ? '1px outset #d0d0d0' : 'none';
    
    if (isHovered && enabled && band.enabled) {
      background = '#f8f8f8';
    }
    
    if (!band.enabled) {
      background = '#e0e0e0';
    }
    
    return {
      display: band.visible ? 'flex' : 'none',
      alignItems: 'center',
      width: band.fixedSize ? `${band.width}px` : 'auto',
      minWidth: `${band.minWidth || 50}px`,
      height: `${Math.max(bandMinHeight, height - 4)}px`,
      background,
      border,
      cursor: band.enabled && enabled ? 'default' : 'not-allowed',
      position: 'relative' as const,
      marginRight: '2px',
      padding: '2px 4px',
      overflow: 'hidden'
    };
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: getBorderStyle(),
    background: '#f0f0f0',
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column' as const,
    alignItems: 'stretch',
    overflow: 'hidden',
    userSelect: 'none' as const
  };

  // Group bands by rows
  const bandRows: CoolBarBand[][] = [];
  let currentRow: CoolBarBand[] = [];
  
  for (const band of bands) {
    if (band.newRow && currentRow.length > 0) {
      bandRows.push(currentRow);
      currentRow = [];
    }
    if (band.visible) {
      currentRow.push(band);
    }
  }
  if (currentRow.length > 0) {
    bandRows.push(currentRow);
  }

  return (
    <div
      ref={coolBarRef}
      className={`vb6-coolbar ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      data-name={name}
      data-type="CoolBar"
    >
      {bandRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column' as const,
            width: '100%',
            minHeight: `${bandMinHeight}px`
          }}
        >
          {row.map((band, bandIndex) => {
            const actualIndex = bands.indexOf(band);
            
            return (
              <div
                key={band.key || actualIndex}
                style={getBandStyle(band, actualIndex)}
                onClick={(e) => handleBandClick(band, e)}
                onMouseEnter={() => handleBandMouseEnter(actualIndex)}
                onMouseLeave={handleBandMouseLeave}
              >
                {/* Band Gripper */}
                <div
                  style={{
                    width: '8px',
                    height: '100%',
                    background: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 1px,
                      #c0c0c0 1px,
                      #c0c0c0 2px
                    )`,
                    marginRight: '4px',
                    cursor: fixedOrder ? 'default' : 'move'
                  }}
                />

                {/* Band Image */}
                {band.image >= 0 && imageList && (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      background: `url(images/${imageList}) -${band.image * 16}px 0`,
                      marginRight: '4px'
                    }}
                  />
                )}

                {/* Band Caption */}
                {band.caption && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: band.enabled && enabled ? '#000' : '#808080',
                      marginRight: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {band.caption}
                  </span>
                )}

                {/* Child Control Placeholder */}
                {band.child && (
                  <div
                    style={{
                      flex: 1,
                      height: '100%',
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px dashed #c0c0c0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#666'
                    }}
                  >
                    {isDesignMode ? band.child : ''}
                  </div>
                )}

                {/* Resize Handle */}
                {allowResize && !band.fixedSize && (
                  <div
                    style={{
                      width: '4px',
                      height: '100%',
                      background: '#d0d0d0',
                      cursor: 'col-resize',
                      marginLeft: '2px',
                      borderLeft: '1px solid #a0a0a0'
                    }}
                    onMouseDown={(e) => handleResizeStart(actualIndex, e)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

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
          {name} ({bands.length} bands)
          {allowResize && <span> - Resizable</span>}
        </div>
      )}
    </div>
  );
};

// Helper functions for CoolBar management
export const CoolBarHelpers = {
  /**
   * Create default band
   */
  createBand: (index: number, caption: string = '', width: number = 100): CoolBarBand => ({
    index,
    key: `band${index}`,
    caption,
    child: '',
    width,
    minWidth: 50,
    fixedSize: false,
    newRow: false,
    visible: true,
    enabled: true,
    image: -1,
    tag: ''
  }),

  /**
   * Add band to coolbar
   */
  addBand: (bands: CoolBarBand[], caption: string = '', width: number = 100): CoolBarBand[] => {
    const newBand = CoolBarHelpers.createBand(bands.length, caption, width);
    return [...bands, newBand];
  },

  /**
   * Remove band from coolbar
   */
  removeBand: (bands: CoolBarBand[], index: number): CoolBarBand[] => {
    return bands.filter((_, i) => i !== index).map((band, i) => ({
      ...band,
      index: i
    }));
  },

  /**
   * Set band child control
   */
  setBandChild: (bands: CoolBarBand[], index: number, childName: string): CoolBarBand[] => {
    return bands.map((band, i) => 
      i === index ? { ...band, child: childName } : band
    );
  },

  /**
   * Set band width
   */
  setBandWidth: (bands: CoolBarBand[], index: number, width: number): CoolBarBand[] => {
    return bands.map((band, i) => 
      i === index ? { ...band, width } : band
    );
  },

  /**
   * Set band on new row
   */
  setBandNewRow: (bands: CoolBarBand[], index: number, newRow: boolean): CoolBarBand[] => {
    return bands.map((band, i) => 
      i === index ? { ...band, newRow } : band
    );
  },

  /**
   * Move band to new position
   */
  moveBand: (bands: CoolBarBand[], fromIndex: number, toIndex: number): CoolBarBand[] => {
    const newBands = [...bands];
    const [moved] = newBands.splice(fromIndex, 1);
    newBands.splice(toIndex, 0, moved);
    
    // Update indices
    return newBands.map((band, index) => ({ ...band, index }));
  },

  /**
   * Calculate total width of all bands
   */
  calculateTotalWidth: (bands: CoolBarBand[]): number => {
    return bands
      .filter(band => band.visible)
      .reduce((total, band) => total + band.width + 10, 0); // +10 for margins/borders
  },

  /**
   * Calculate required height for all band rows
   */
  calculateRequiredHeight: (bands: CoolBarBand[], bandMinHeight: number): number => {
    const rows = CoolBarHelpers.getBandRows(bands);
    return rows.length * (bandMinHeight + 4); // +4 for margins
  },

  /**
   * Group bands into rows
   */
  getBandRows: (bands: CoolBarBand[]): CoolBarBand[][] => {
    const rows: CoolBarBand[][] = [];
    let currentRow: CoolBarBand[] = [];
    
    for (const band of bands) {
      if (band.newRow && currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      if (band.visible) {
        currentRow.push(band);
      }
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    return rows;
  }
};

export default CoolBarControl;