/**
 * VB6 PictureClip Control Implementation
 *
 * Image clipping control for sprite handling with full VB6 compatibility
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface PictureClipControl {
  type: 'PictureClip';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // Picture Properties
  picture: string; // Image source
  stretch: boolean; // Stretch to fit control

  // Clipping Properties
  rows: number; // Number of rows in sprite sheet
  cols: number; // Number of columns in sprite sheet
  clipX: number; // Current clip X position
  clipY: number; // Current clip Y position
  clipWidth: number; // Width of each clip
  clipHeight: number; // Height of each clip

  // Current Selection
  graphicCell: number; // Current cell (0-based index)

  // Behavior
  enabled: boolean;
  visible: boolean;

  // Appearance
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  mousePointer: number;
  tag: string;

  // Events
  onClick?: string;
}

interface PictureClipControlProps {
  control: PictureClipControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const PictureClipControl: React.FC<PictureClipControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 100,
    height = 100,
    picture = '',
    stretch = false,
    rows = 1,
    cols = 1,
    clipX = 0,
    clipY = 0,
    clipWidth = 0,
    clipHeight = 0,
    graphicCell = 0,
    enabled = true,
    visible = true,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = '',
  } = control;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [currentCell, setCurrentCell] = useState(graphicCell);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when picture changes
  useEffect(() => {
    if (picture && imageRef.current) {
      setImageLoaded(false);
      setImageError(null);
      imageRef.current.src = picture;
    }
  }, [picture]);

  // Update current cell when graphicCell changes
  useEffect(() => {
    setCurrentCell(graphicCell);
  }, [graphicCell]);

  // VB6-compatible methods exposed globally
  const pictureClipMethods = useCallback(
    () => ({
      // Navigation methods
      nextCell: () => {
        const maxCells = rows * cols;
        const nextIndex = (currentCell + 1) % maxCells;
        setGraphicCell(nextIndex);
      },

      prevCell: () => {
        const maxCells = rows * cols;
        const prevIndex = currentCell > 0 ? currentCell - 1 : maxCells - 1;
        setGraphicCell(prevIndex);
      },

      gotoCell: (cellIndex: number) => {
        setGraphicCell(cellIndex);
      },

      // Clipboard operations
      copyToClipboard: async () => {
        if (!canvasRef.current) return;
        try {
          const canvas = canvasRef.current;
          canvas.toBlob(async blob => {
            if (blob && navigator.clipboard) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            }
          });
        } catch (error) {
          console.warn('Failed to copy to clipboard:', error);
        }
      },

      // Get current clip as data URL
      getClipDataURL: (format = 'image/png') => {
        if (!canvasRef.current) return '';
        return canvasRef.current.toDataURL(format);
      },

      // Get clip dimensions
      getClipRect: () => {
        const actualClipWidth = clipWidth > 0 ? clipWidth : Math.floor(naturalWidth / cols);
        const actualClipHeight = clipHeight > 0 ? clipHeight : Math.floor(naturalHeight / rows);
        const cellRow = Math.floor(currentCell / cols);
        const cellCol = currentCell % cols;

        return {
          x: clipX + cellCol * actualClipWidth,
          y: clipY + cellRow * actualClipHeight,
          width: actualClipWidth,
          height: actualClipHeight,
        };
      },

      // Refresh display
      refresh: () => {
        drawCurrentClip();
      },

      // Point testing
      pointInClip: (x: number, y: number) => {
        const rect = pictureClipMethods().getClipRect();
        return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
      },
    }),
    [
      currentCell,
      rows,
      cols,
      clipX,
      clipY,
      clipWidth,
      clipHeight,
      naturalWidth,
      naturalHeight,
      setGraphicCell,
      drawCurrentClip,
    ]
  );

  // Expose methods globally for VB6 compatibility
  useEffect(() => {
    const global = window as any;
    if (!global.VB6Controls) global.VB6Controls = {};
    global.VB6Controls[name] = pictureClipMethods();

    return () => {
      if (global.VB6Controls) {
        delete global.VB6Controls[name];
      }
    };
  }, [name, pictureClipMethods]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageLoaded(true);
      setImageError(null);
      setNaturalWidth(imageRef.current.naturalWidth);
      setNaturalHeight(imageRef.current.naturalHeight);
      drawCurrentClip();
    }
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageError('Failed to load image');
  }, []);

  const drawCurrentClip = useCallback(() => {
    if (!imageLoaded || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate clip dimensions
    const actualClipWidth = clipWidth > 0 ? clipWidth : Math.floor(naturalWidth / cols);
    const actualClipHeight = clipHeight > 0 ? clipHeight : Math.floor(naturalHeight / rows);

    // Calculate current cell position
    const cellRow = Math.floor(currentCell / cols);
    const cellCol = currentCell % cols;

    const actualClipX = clipX + cellCol * actualClipWidth;
    const actualClipY = clipY + cellRow * actualClipHeight;

    // Draw the clipped portion
    if (stretch) {
      ctx.drawImage(
        imageRef.current,
        actualClipX,
        actualClipY,
        actualClipWidth,
        actualClipHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } else {
      ctx.drawImage(
        imageRef.current,
        actualClipX,
        actualClipY,
        actualClipWidth,
        actualClipHeight,
        0,
        0,
        actualClipWidth,
        actualClipHeight
      );
    }
  }, [
    imageLoaded,
    naturalWidth,
    naturalHeight,
    clipX,
    clipY,
    clipWidth,
    clipHeight,
    currentCell,
    rows,
    cols,
    stretch,
  ]);

  // Redraw when relevant properties change
  useEffect(() => {
    drawCurrentClip();
  }, [drawCurrentClip]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled) return;
      onEvent?.('Click', { x: event.clientX, y: event.clientY });
    },
    [enabled, onEvent]
  );

  const setGraphicCell = useCallback(
    (cellIndex: number) => {
      const maxCells = rows * cols;
      const validIndex = Math.max(0, Math.min(maxCells - 1, cellIndex));

      setCurrentCell(validIndex);
      onPropertyChange?.('graphicCell', validIndex);
    },
    [rows, cols, onPropertyChange]
  );

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px inset #d0d0d0';
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
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const canvasStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    display: imageLoaded ? 'block' : 'none',
  };

  return (
    <div
      className={`vb6-picture-clip ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onClick={handleClick}
      data-name={name}
      data-type="PictureClip"
    >
      {/* Hidden image for loading */}
      <img
        ref={imageRef}
        style={{ display: 'none' }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        alt=""
      />

      {/* Canvas for displaying clipped image */}
      <canvas
        ref={canvasRef}
        width={stretch ? width - 4 : clipWidth > 0 ? clipWidth : Math.floor(naturalWidth / cols)}
        height={
          stretch ? height - 4 : clipHeight > 0 ? clipHeight : Math.floor(naturalHeight / rows)
        }
        style={canvasStyle}
      />

      {/* Placeholder when no image or error */}
      {!imageLoaded && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            padding: '8px',
          }}
        >
          {imageError ? (
            <>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>⚠️</div>
              <div>Error loading image</div>
            </>
          ) : picture ? (
            <>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>⏳</div>
              <div>Loading...</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>🖼️</div>
              <div>PictureClip</div>
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                {rows}×{cols} grid
              </div>
            </>
          )}
        </div>
      )}

      {/* Design Mode Controls */}
      {isDesignMode && imageLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            display: 'flex',
            gap: '2px',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px',
            borderRadius: '2px',
          }}
        >
          <button
            style={{
              width: '16px',
              height: '16px',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              cursor: 'pointer',
              fontSize: '8px',
            }}
            onClick={e => {
              e.stopPropagation();
              setGraphicCell(Math.max(0, currentCell - 1));
            }}
            disabled={currentCell <= 0}
          >
            ◄
          </button>

          <div
            style={{
              color: 'white',
              fontSize: '8px',
              lineHeight: '16px',
              minWidth: '20px',
              textAlign: 'center',
            }}
          >
            {currentCell}
          </div>

          <button
            style={{
              width: '16px',
              height: '16px',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              cursor: 'pointer',
              fontSize: '8px',
            }}
            onClick={e => {
              e.stopPropagation();
              setGraphicCell(Math.min(rows * cols - 1, currentCell + 1));
            }}
            disabled={currentCell >= rows * cols - 1}
          >
            ►
          </button>
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
          {name} - Cell {currentCell} ({rows}×{cols})
        </div>
      )}
    </div>
  );
};

// Helper functions for PictureClip
export const PictureClipHelpers = {
  /**
   * Calculate cell index from row and column
   */
  cellFromRowCol: (row: number, col: number, cols: number): number => {
    return row * cols + col;
  },

  /**
   * Calculate row and column from cell index
   */
  rowColFromCell: (cellIndex: number, cols: number): { row: number; col: number } => {
    return {
      row: Math.floor(cellIndex / cols),
      col: cellIndex % cols,
    };
  },

  /**
   * Get clip coordinates for a specific cell
   */
  getClipCoords: (
    cellIndex: number,
    rows: number,
    cols: number,
    imageWidth: number,
    imageHeight: number,
    clipX: number = 0,
    clipY: number = 0,
    clipWidth: number = 0,
    clipHeight: number = 0
  ) => {
    const actualClipWidth = clipWidth > 0 ? clipWidth : Math.floor(imageWidth / cols);
    const actualClipHeight = clipHeight > 0 ? clipHeight : Math.floor(imageHeight / rows);

    const { row, col } = PictureClipHelpers.rowColFromCell(cellIndex, cols);

    return {
      x: clipX + col * actualClipWidth,
      y: clipY + row * actualClipHeight,
      width: actualClipWidth,
      height: actualClipHeight,
    };
  },

  /**
   * Extract image data for a specific cell
   */
  extractCellImage: (
    imageElement: HTMLImageElement,
    cellIndex: number,
    rows: number,
    cols: number,
    clipX: number = 0,
    clipY: number = 0,
    clipWidth: number = 0,
    clipHeight: number = 0
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const coords = PictureClipHelpers.getClipCoords(
      cellIndex,
      rows,
      cols,
      imageElement.naturalWidth,
      imageElement.naturalHeight,
      clipX,
      clipY,
      clipWidth,
      clipHeight
    );

    canvas.width = coords.width;
    canvas.height = coords.height;

    ctx.drawImage(
      imageElement,
      coords.x,
      coords.y,
      coords.width,
      coords.height,
      0,
      0,
      coords.width,
      coords.height
    );

    return canvas;
  },

  /**
   * Create sprite animation sequence
   */
  createAnimationSequence: (startCell: number, endCell: number): number[] => {
    const sequence: number[] = [];
    for (let i = startCell; i <= endCell; i++) {
      sequence.push(i);
    }
    return sequence;
  },

  /**
   * Load image and get dimensions
   */
  loadImage: (src: string): Promise<{ image: HTMLImageElement; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          image: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = src;
    });
  },

  /**
   * Generate CSS sprite sheet
   */
  generateSpriteCSS: (
    imagePath: string,
    rows: number,
    cols: number,
    cellWidth: number,
    cellHeight: number,
    classPrefix: string = 'sprite'
  ): string => {
    let css = `.${classPrefix} {\n`;
    css += `  background-image: url('${imagePath}');\n`;
    css += `  background-repeat: no-repeat;\n`;
    css += `  width: ${cellWidth}px;\n`;
    css += `  height: ${cellHeight}px;\n`;
    css += `}\n\n`;

    for (let i = 0; i < rows * cols; i++) {
      const { row, col } = PictureClipHelpers.rowColFromCell(i, cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      css += `.${classPrefix}-${i} {\n`;
      css += `  background-position: -${x}px -${y}px;\n`;
      css += `}\n\n`;
    }

    return css;
  },
};

// VB6 PictureClip methods simulation
export const PictureClipMethods = {
  /**
   * Get graphic at specific cell
   */
  getGraphic: (control: PictureClipControl, cellIndex: number) => {
    return {
      ...control,
      graphicCell: Math.max(0, Math.min(control.rows * control.cols - 1, cellIndex)),
    };
  },

  /**
   * Set clipping area
   */
  setClip: (control: PictureClipControl, x: number, y: number, width: number, height: number) => {
    return {
      ...control,
      clipX: x,
      clipY: y,
      clipWidth: width,
      clipHeight: height,
    };
  },

  /**
   * Set grid dimensions
   */
  setGrid: (control: PictureClipControl, rows: number, cols: number) => {
    return {
      ...control,
      rows: Math.max(1, rows),
      cols: Math.max(1, cols),
      graphicCell: 0, // Reset to first cell
    };
  },
};

export default PictureClipControl;
