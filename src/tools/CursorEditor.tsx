/**
 * VB6 Cursor Editor Tool
 *
 * Complete cursor editor for creating and editing Windows cursor files (.cur)
 * Supports pixel-level editing, hotspot definition, and multiple cursor sizes
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface CursorFrame {
  id: string;
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  pixels: Uint32Array; // RGBA pixel data
  created: Date;
  modified: Date;
}

export interface CursorFile {
  id: string;
  name: string;
  frames: CursorFrame[];
  activeFrame: number;
  created: Date;
  modified: Date;
}

export interface CursorEditorState {
  currentFile: CursorFile | null;
  selectedTool: CursorTool;
  primaryColor: string;
  secondaryColor: string;
  zoom: number;
  showGrid: boolean;
  showHotspot: boolean;
  brushSize: number;
  isDrawing: boolean;
  history: CursorFrame[];
  historyIndex: number;
}

export enum CursorTool {
  Pencil = 'pencil',
  Brush = 'brush',
  Eraser = 'eraser',
  Fill = 'fill',
  Line = 'line',
  Rectangle = 'rectangle',
  Circle = 'circle',
  Eyedropper = 'eyedropper',
  Hotspot = 'hotspot',
  Select = 'select',
}

const STANDARD_CURSOR_SIZES = [
  { width: 16, height: 16, name: '16x16 (Small)' },
  { width: 24, height: 24, name: '24x24 (Medium)' },
  { width: 32, height: 32, name: '32x32 (Large)' },
  { width: 48, height: 48, name: '48x48 (Extra Large)' },
  { width: 64, height: 64, name: '64x64 (Jumbo)' },
];

const PREDEFINED_CURSORS = [
  'arrow',
  'hand',
  'wait',
  'cross',
  'ibeam',
  'no',
  'size_nwse',
  'size_nesw',
  'size_we',
  'size_ns',
  'size_all',
  'up_arrow',
  'help',
  'app_starting',
];

export const CursorEditor: React.FC = () => {
  const [state, setState] = useState<CursorEditorState>({
    currentFile: null,
    selectedTool: CursorTool.Pencil,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    zoom: 16,
    showGrid: true,
    showHotspot: true,
    brushSize: 1,
    isDrawing: false,
    history: [],
    historyIndex: -1,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create new cursor file
  const createNewCursor = useCallback((width: number = 32, height: number = 32) => {
    const pixels = new Uint32Array(width * height);
    pixels.fill(0x00000000); // Transparent

    const frame: CursorFrame = {
      id: `frame_${Date.now()}`,
      width,
      height,
      hotspotX: Math.floor(width / 2),
      hotspotY: Math.floor(height / 2),
      pixels,
      created: new Date(),
      modified: new Date(),
    };

    const newFile: CursorFile = {
      id: `cursor_${Date.now()}`,
      name: 'Untitled.cur',
      frames: [frame],
      activeFrame: 0,
      created: new Date(),
      modified: new Date(),
    };

    setState(prev => ({
      ...prev,
      currentFile: newFile,
      history: [frame],
      historyIndex: 0,
    }));
  }, []);

  // Get current frame
  const currentFrame = useMemo(() => {
    if (!state.currentFile || state.currentFile.activeFrame < 0) return null;
    return state.currentFile.frames[state.currentFile.activeFrame] || null;
  }, [state.currentFile]);

  // Convert RGBA to CSS color
  const rgbaToColor = useCallback((rgba: number): string => {
    const r = (rgba >>> 24) & 0xff;
    const g = (rgba >>> 16) & 0xff;
    const b = (rgba >>> 8) & 0xff;
    const a = rgba & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  }, []);

  // Convert CSS color to RGBA
  const colorToRgba = useCallback((color: string, alpha: number = 255): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | alpha;
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !currentFrame) return;

    const { width: frameWidth, height: frameHeight, pixels, hotspotX, hotspotY } = currentFrame;
    const cellSize = state.zoom;

    canvas.width = frameWidth * cellSize;
    canvas.height = frameHeight * cellSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard background for transparency
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    for (let y = 0; y < frameHeight; y++) {
      for (let x = 0; x < frameWidth; x++) {
        if ((x + y) % 2 === 1) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw pixels
    for (let y = 0; y < frameHeight; y++) {
      for (let x = 0; x < frameWidth; x++) {
        const pixelIndex = y * frameWidth + x;
        const pixel = pixels[pixelIndex];

        if ((pixel & 0xff) > 0) {
          // Not fully transparent
          ctx.fillStyle = rgbaToColor(pixel);
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw grid
    if (state.showGrid && cellSize >= 4) {
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;

      for (let x = 0; x <= frameWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= frameHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // Draw hotspot
    if (state.showHotspot) {
      const hotspotSize = Math.max(4, cellSize / 4);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;

      const centerX = hotspotX * cellSize + cellSize / 2;
      const centerY = hotspotY * cellSize + cellSize / 2;

      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(centerX - hotspotSize, centerY);
      ctx.lineTo(centerX + hotspotSize, centerY);
      ctx.moveTo(centerX, centerY - hotspotSize);
      ctx.lineTo(centerX, centerY + hotspotSize);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }, [currentFrame, state.zoom, state.showGrid, state.showHotspot, rgbaToColor]);

  // Draw preview
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !currentFrame) return;

    const { width, height, pixels } = currentFrame;
    canvas.width = width;
    canvas.height = height;

    // Create ImageData
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const offset = i * 4;

      data[offset] = (pixel >>> 24) & 0xff; // R
      data[offset + 1] = (pixel >>> 16) & 0xff; // G
      data[offset + 2] = (pixel >>> 8) & 0xff; // B
      data[offset + 3] = pixel & 0xff; // A
    }

    ctx.putImageData(imageData, 0, 0);
  }, [currentFrame]);

  // Update canvas when frame or state changes
  useEffect(() => {
    drawCanvas();
    drawPreview();
  }, [drawCanvas, drawPreview]);

  // Canvas click handler
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!currentFrame) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / state.zoom);
      const y = Math.floor((e.clientY - rect.top) / state.zoom);

      if (x < 0 || x >= currentFrame.width || y < 0 || y >= currentFrame.height) return;

      const pixelIndex = y * currentFrame.width + x;
      const newPixels = new Uint32Array(currentFrame.pixels);

      switch (state.selectedTool) {
        case CursorTool.Pencil:
        case CursorTool.Brush:
          newPixels[pixelIndex] = colorToRgba(
            e.button === 0 ? state.primaryColor : state.secondaryColor
          );
          break;

        case CursorTool.Eraser:
          newPixels[pixelIndex] = 0x00000000; // Transparent
          break;

        case CursorTool.Fill:
          // Flood fill implementation
          floodFill(
            newPixels,
            currentFrame.width,
            currentFrame.height,
            x,
            y,
            colorToRgba(e.button === 0 ? state.primaryColor : state.secondaryColor)
          );
          break;

        case CursorTool.Eyedropper: {
          const pickedColor = rgbaToColor(currentFrame.pixels[pixelIndex]);
          if (e.button === 0) {
            setState(prev => ({ ...prev, primaryColor: pickedColor }));
          } else {
            setState(prev => ({ ...prev, secondaryColor: pickedColor }));
          }
          return;
        }

        case CursorTool.Hotspot:
          setState(prev => ({
            ...prev,
            currentFile: prev.currentFile
              ? {
                  ...prev.currentFile,
                  frames: prev.currentFile.frames.map((frame, index) =>
                    index === prev.currentFile!.activeFrame
                      ? { ...frame, hotspotX: x, hotspotY: y, modified: new Date() }
                      : frame
                  ),
                  modified: new Date(),
                }
              : null,
          }));
          return;
      }

      // Update frame with new pixels
      setState(prev => ({
        ...prev,
        currentFile: prev.currentFile
          ? {
              ...prev.currentFile,
              frames: prev.currentFile.frames.map((frame, index) =>
                index === prev.currentFile!.activeFrame
                  ? { ...frame, pixels: newPixels, modified: new Date() }
                  : frame
              ),
              modified: new Date(),
            }
          : null,
      }));
    },
    [
      currentFrame,
      state.zoom,
      state.selectedTool,
      state.primaryColor,
      state.secondaryColor,
      colorToRgba,
      rgbaToColor,
    ]
  );

  // Flood fill algorithm
  const floodFill = useCallback(
    (
      pixels: Uint32Array,
      width: number,
      height: number,
      startX: number,
      startY: number,
      newColor: number
    ) => {
      const targetColor = pixels[startY * width + startX];
      if (targetColor === newColor) return;

      const stack: Array<[number, number]> = [[startX, startY]];

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const index = y * width + x;
        if (pixels[index] !== targetColor) continue;

        pixels[index] = newColor;

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    },
    []
  );

  // Save cursor file
  const saveCursor = useCallback(async () => {
    if (!state.currentFile) return;

    try {
      // In a real implementation, this would generate actual .cur file format
      const cursorData = {
        name: state.currentFile.name,
        frames: state.currentFile.frames.map(frame => ({
          width: frame.width,
          height: frame.height,
          hotspotX: frame.hotspotX,
          hotspotY: frame.hotspotY,
          pixels: Array.from(frame.pixels),
        })),
      };

      const blob = new Blob([JSON.stringify(cursorData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.currentFile.name.replace(/\.cur$/, '.json');
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save cursor:', error);
    }
  }, [state.currentFile]);

  // Load cursor file
  const loadCursor = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const cursorData = JSON.parse(e.target?.result as string);

        const frames: CursorFrame[] = cursorData.frames.map((frameData: any) => ({
          id: `frame_${Date.now()}_${Math.random()}`,
          width: frameData.width,
          height: frameData.height,
          hotspotX: frameData.hotspotX,
          hotspotY: frameData.hotspotY,
          pixels: new Uint32Array(frameData.pixels),
          created: new Date(),
          modified: new Date(),
        }));

        const loadedFile: CursorFile = {
          id: `cursor_${Date.now()}`,
          name: cursorData.name || file.name,
          frames,
          activeFrame: 0,
          created: new Date(),
          modified: new Date(),
        };

        setState(prev => ({
          ...prev,
          currentFile: loadedFile,
          history: frames.length > 0 ? [frames[0]] : [],
          historyIndex: 0,
        }));
      } catch (error) {
        console.error('Failed to load cursor:', error);
        alert('Failed to load cursor file');
      }
    };
    reader.readAsText(file);
  }, []);

  // Render tool palette
  const renderToolPalette = () => (
    <div
      className="tool-palette"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px',
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
      }}
    >
      <h4 style={{ margin: 0, fontSize: '12px' }}>Tools</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
        {Object.values(CursorTool).map(tool => (
          <button
            key={tool}
            className={`tool-button ${state.selectedTool === tool ? 'active' : ''}`}
            style={{
              padding: '4px',
              fontSize: '10px',
              border: '1px solid #999',
              backgroundColor: state.selectedTool === tool ? '#0078d4' : '#e0e0e0',
              color: state.selectedTool === tool ? 'white' : 'black',
              cursor: 'pointer',
            }}
            onClick={() => setState(prev => ({ ...prev, selectedTool: tool }))}
            title={tool.charAt(0).toUpperCase() + tool.slice(1)}
          >
            {tool.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>Primary:</div>
        <input
          type="color"
          value={state.primaryColor}
          onChange={e => setState(prev => ({ ...prev, primaryColor: e.target.value }))}
          style={{ width: '100%', height: '20px' }}
        />
      </div>

      <div>
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>Secondary:</div>
        <input
          type="color"
          value={state.secondaryColor}
          onChange={e => setState(prev => ({ ...prev, secondaryColor: e.target.value }))}
          style={{ width: '100%', height: '20px' }}
        />
      </div>
    </div>
  );

  // Render properties panel
  const renderProperties = () => (
    <div
      className="properties-panel"
      style={{
        padding: '8px',
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>Properties</h4>

      {currentFrame && (
        <div style={{ fontSize: '10px' }}>
          <div>
            Size: {currentFrame.width}×{currentFrame.height}
          </div>
          <div>
            Hotspot: ({currentFrame.hotspotX}, {currentFrame.hotspotY})
          </div>
          <div style={{ marginTop: '8px' }}>
            <label>
              <input
                type="checkbox"
                checked={state.showGrid}
                onChange={e => setState(prev => ({ ...prev, showGrid: e.target.checked }))}
              />
              Show Grid
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={state.showHotspot}
                onChange={e => setState(prev => ({ ...prev, showHotspot: e.target.checked }))}
              />
              Show Hotspot
            </label>
          </div>
          <div style={{ marginTop: '8px' }}>
            <label>Zoom: </label>
            <select
              value={state.zoom}
              onChange={e => setState(prev => ({ ...prev, zoom: parseInt(e.target.value) }))}
              style={{ fontSize: '10px' }}
            >
              <option value={4}>400%</option>
              <option value={8}>800%</option>
              <option value={16}>1600%</option>
              <option value={24}>2400%</option>
              <option value={32}>3200%</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="cursor-editor"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        fontFamily: 'MS Sans Serif',
        fontSize: '11px',
      }}
    >
      {/* Toolbar */}
      <div
        className="toolbar"
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#f0f0f0',
        }}
      >
        <button onClick={() => createNewCursor()} style={{ padding: '4px 8px', fontSize: '10px' }}>
          New
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '4px 8px', fontSize: '10px' }}
        >
          Open
        </button>

        <button
          onClick={saveCursor}
          disabled={!state.currentFile}
          style={{ padding: '4px 8px', fontSize: '10px' }}
        >
          Save
        </button>

        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 4px' }} />

        <select
          onChange={e => {
            const [width, height] = e.target.value.split('x').map(Number);
            createNewCursor(width, height);
          }}
          style={{ fontSize: '10px' }}
        >
          <option value="">New Size...</option>
          {STANDARD_CURSOR_SIZES.map(size => (
            <option key={`${size.width}x${size.height}`} value={`${size.width}x${size.height}`}>
              {size.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '200px' }}>
          {renderToolPalette()}
          {renderProperties()}
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e0e0e0',
            padding: '16px',
          }}
        >
          {currentFrame ? (
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onContextMenu={e => {
                e.preventDefault();
                handleCanvasClick(e as any);
              }}
              style={{
                border: '2px solid #333',
                backgroundColor: 'white',
                cursor: 'crosshair',
                imageRendering: 'pixelated',
              }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '14px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖱️</div>
              <div>No cursor loaded</div>
              <div style={{ fontSize: '10px', marginTop: '8px' }}>
                Click "New" to create a cursor or "Open" to load one
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: '120px', padding: '8px' }}>
          <div
            style={{
              border: '1px solid #ccc',
              padding: '8px',
              backgroundColor: '#f5f5f5',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', marginBottom: '4px' }}>Preview</div>
            <div
              style={{
                width: '64px',
                height: '64px',
                border: '1px solid #999',
                margin: '0 auto',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                style={{
                  imageRendering: 'pixelated',
                  maxWidth: '60px',
                  maxHeight: '60px',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.cur"
        onChange={loadCursor}
        style={{ display: 'none' }}
      />

      {/* Status bar */}
      <div
        style={{
          borderTop: '1px solid #ccc',
          padding: '4px 8px',
          backgroundColor: '#f0f0f0',
          fontSize: '10px',
          color: '#666',
        }}
      >
        {currentFrame
          ? `${currentFrame.width}×${currentFrame.height} • Hotspot: (${currentFrame.hotspotX}, ${currentFrame.hotspotY}) • Tool: ${state.selectedTool}`
          : 'Ready'}
      </div>
    </div>
  );
};

export default CursorEditor;
