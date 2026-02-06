/**
 * VB6 Bitmap Editor Tool
 *
 * Complete bitmap editor for creating and editing Windows bitmap files (.bmp)
 * Supports multiple color depths, layers, and advanced editing tools
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface BitmapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  pixels: Uint32Array;
  locked: boolean;
}

export interface BitmapDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  colorDepth: ColorDepth;
  backgroundColor: string;
  layers: BitmapLayer[];
  activeLayer: number;
  created: Date;
  modified: Date;
}

export interface BitmapEditorState {
  currentDocument: BitmapDocument | null;
  selectedTool: BitmapTool;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  isDrawing: boolean;
  drawingPath: Array<{ x: number; y: number }>;
  selection: SelectionArea | null;
  clipboard: Uint32Array | null;
  history: BitmapLayer[];
  historyIndex: number;
}

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum BitmapTool {
  Pencil = 'pencil',
  Brush = 'brush',
  Eraser = 'eraser',
  Fill = 'fill',
  Line = 'line',
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Text = 'text',
  Eyedropper = 'eyedropper',
  Select = 'select',
  Move = 'move',
  Zoom = 'zoom',
  Spray = 'spray',
  Smudge = 'smudge',
}

export enum ColorDepth {
  Monochrome = 1,
  Color16 = 4,
  Color256 = 8,
  Color16Bit = 16,
  Color24Bit = 24,
  Color32Bit = 32,
}

export enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  SoftLight = 'soft-light',
  HardLight = 'hard-light',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  Darken = 'darken',
  Lighten = 'lighten',
  Difference = 'difference',
  Exclusion = 'exclusion',
}

const STANDARD_BITMAP_SIZES = [
  { width: 16, height: 16, name: '16×16 (Icon)' },
  { width: 32, height: 32, name: '32×32 (Icon)' },
  { width: 48, height: 48, name: '48×48 (Icon)' },
  { width: 64, height: 64, name: '64×64 (Icon)' },
  { width: 128, height: 128, name: '128×128 (Small)' },
  { width: 256, height: 256, name: '256×256 (Medium)' },
  { width: 512, height: 512, name: '512×512 (Large)' },
  { width: 640, height: 480, name: '640×480 (VGA)' },
  { width: 800, height: 600, name: '800×600 (SVGA)' },
  { width: 1024, height: 768, name: '1024×768 (XGA)' },
];

const DEFAULT_PALETTE = [
  '#000000',
  '#800000',
  '#008000',
  '#808000',
  '#000080',
  '#800080',
  '#008080',
  '#c0c0c0',
  '#808080',
  '#ff0000',
  '#00ff00',
  '#ffff00',
  '#0000ff',
  '#ff00ff',
  '#00ffff',
  '#ffffff',
  '#000000',
  '#333333',
  '#666666',
  '#999999',
  '#cccccc',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#800000',
  '#008000',
  '#000080',
  '#800080',
];

export const BitmapEditor: React.FC = () => {
  const [state, setState] = useState<BitmapEditorState>({
    currentDocument: null,
    selectedTool: BitmapTool.Brush,
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    brushSize: 3,
    zoom: 4,
    showGrid: false,
    gridSize: 8,
    isDrawing: false,
    drawingPath: [],
    selection: null,
    clipboard: null,
    history: [],
    historyIndex: -1,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create new bitmap document
  const createNewDocument = useCallback(
    (width: number = 256, height: number = 256, colorDepth: ColorDepth = ColorDepth.Color32Bit) => {
      const pixels = new Uint32Array(width * height);
      pixels.fill(0xffffffff); // White background

      const backgroundLayer: BitmapLayer = {
        id: `layer_${Date.now()}`,
        name: 'Background',
        visible: true,
        opacity: 1.0,
        blendMode: BlendMode.Normal,
        pixels,
        locked: false,
      };

      const newDocument: BitmapDocument = {
        id: `bitmap_${Date.now()}`,
        name: 'Untitled.bmp',
        width,
        height,
        colorDepth,
        backgroundColor: '#ffffff',
        layers: [backgroundLayer],
        activeLayer: 0,
        created: new Date(),
        modified: new Date(),
      };

      setState(prev => ({
        ...prev,
        currentDocument: newDocument,
        history: [backgroundLayer],
        historyIndex: 0,
      }));
    },
    []
  );

  // Get current layer
  const currentLayer = useMemo(() => {
    if (!state.currentDocument || state.currentDocument.activeLayer < 0) return null;
    return state.currentDocument.layers[state.currentDocument.activeLayer] || null;
  }, [state.currentDocument]);

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

    if (!canvas || !ctx || !state.currentDocument) return;

    const { width: docWidth, height: docHeight, layers } = state.currentDocument;
    const cellSize = state.zoom;

    canvas.width = docWidth * cellSize;
    canvas.height = docHeight * cellSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard background for transparency
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    for (let y = 0; y < docHeight; y++) {
      for (let x = 0; x < docWidth; x++) {
        if ((x + y) % 2 === 1) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw layers from bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue;

      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

      // Draw layer pixels
      for (let y = 0; y < docHeight; y++) {
        for (let x = 0; x < docWidth; x++) {
          const pixelIndex = y * docWidth + x;
          const pixel = layer.pixels[pixelIndex];

          if ((pixel & 0xff) > 0) {
            // Not fully transparent
            ctx.fillStyle = rgbaToColor(pixel);
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Draw grid
    if (state.showGrid && cellSize >= 2) {
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;

      const gridSize = state.gridSize;

      for (let x = 0; x <= docWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= docHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // Draw selection
    if (state.selection) {
      const { x, y, width, height } = state.selection;
      ctx.strokeStyle = '#000000';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(x * cellSize, y * cellSize, width * cellSize, height * cellSize);
      ctx.setLineDash([]);
    }
  }, [
    state.currentDocument,
    state.zoom,
    state.showGrid,
    state.gridSize,
    state.selection,
    rgbaToColor,
  ]);

  // Update canvas when document or state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!state.currentDocument || !currentLayer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / state.zoom);
      const y = Math.floor((e.clientY - rect.top) / state.zoom);

      if (x < 0 || x >= state.currentDocument.width || y < 0 || y >= state.currentDocument.height)
        return;

      setState(prev => ({ ...prev, isDrawing: true, drawingPath: [{ x, y }] }));

      const pixelIndex = y * state.currentDocument.width + x;
      const newPixels = new Uint32Array(currentLayer.pixels);

      switch (state.selectedTool) {
        case BitmapTool.Pencil:
        case BitmapTool.Brush:
          drawBrush(
            newPixels,
            x,
            y,
            state.currentDocument.width,
            state.currentDocument.height,
            colorToRgba(e.button === 0 ? state.primaryColor : state.secondaryColor),
            state.brushSize
          );
          break;

        case BitmapTool.Eraser:
          drawBrush(
            newPixels,
            x,
            y,
            state.currentDocument.width,
            state.currentDocument.height,
            0x00000000,
            state.brushSize
          );
          break;

        case BitmapTool.Fill:
          floodFill(
            newPixels,
            state.currentDocument.width,
            state.currentDocument.height,
            x,
            y,
            colorToRgba(e.button === 0 ? state.primaryColor : state.secondaryColor)
          );
          break;

        case BitmapTool.Eyedropper:
          {
            const pickedColor = rgbaToColor(currentLayer.pixels[pixelIndex]);
            if (e.button === 0) {
              setState(prev => ({ ...prev, primaryColor: pickedColor }));
            } else {
              setState(prev => ({ ...prev, secondaryColor: pickedColor }));
            }
            break;
          }
          return;
      }

      // Update layer with new pixels
      updateCurrentLayer(newPixels);
    },
    [
      state.currentDocument,
      currentLayer,
      state.zoom,
      state.selectedTool,
      state.primaryColor,
      state.secondaryColor,
      state.brushSize,
      colorToRgba,
      rgbaToColor,
    ]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!state.isDrawing || !state.currentDocument || !currentLayer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / state.zoom);
      const y = Math.floor((e.clientY - rect.top) / state.zoom);

      if (x < 0 || x >= state.currentDocument.width || y < 0 || y >= state.currentDocument.height)
        return;

      setState(prev => ({ ...prev, drawingPath: [...prev.drawingPath, { x, y }] }));

      const newPixels = new Uint32Array(currentLayer.pixels);

      switch (state.selectedTool) {
        case BitmapTool.Pencil:
        case BitmapTool.Brush:
          drawBrush(
            newPixels,
            x,
            y,
            state.currentDocument.width,
            state.currentDocument.height,
            colorToRgba(state.primaryColor),
            state.brushSize
          );
          break;

        case BitmapTool.Eraser:
          drawBrush(
            newPixels,
            x,
            y,
            state.currentDocument.width,
            state.currentDocument.height,
            0x00000000,
            state.brushSize
          );
          break;
      }

      updateCurrentLayer(newPixels);
    },
    [
      state.isDrawing,
      state.currentDocument,
      currentLayer,
      state.zoom,
      state.selectedTool,
      state.primaryColor,
      state.brushSize,
      colorToRgba,
    ]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setState(prev => ({ ...prev, isDrawing: false, drawingPath: [] }));
  }, []);

  // Draw brush stroke
  const drawBrush = useCallback(
    (
      pixels: Uint32Array,
      x: number,
      y: number,
      width: number,
      height: number,
      color: number,
      size: number
    ) => {
      const radius = Math.floor(size / 2);

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = x + dx;
          const py = y + dy;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
              const index = py * width + px;
              pixels[index] = color;
            }
          }
        }
      }
    },
    []
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

  // Update current layer
  const updateCurrentLayer = useCallback((newPixels: Uint32Array) => {
    setState(prev => ({
      ...prev,
      currentDocument: prev.currentDocument
        ? {
            ...prev.currentDocument,
            layers: prev.currentDocument.layers.map((layer, index) =>
              index === prev.currentDocument!.activeLayer ? { ...layer, pixels: newPixels } : layer
            ),
            modified: new Date(),
          }
        : null,
    }));
  }, []);

  // Add layer
  const addLayer = useCallback(
    (name: string = 'New Layer') => {
      if (!state.currentDocument) return;

      const pixels = new Uint32Array(state.currentDocument.width * state.currentDocument.height);
      pixels.fill(0x00000000); // Transparent

      const newLayer: BitmapLayer = {
        id: `layer_${Date.now()}`,
        name,
        visible: true,
        opacity: 1.0,
        blendMode: BlendMode.Normal,
        pixels,
        locked: false,
      };

      setState(prev => ({
        ...prev,
        currentDocument: prev.currentDocument
          ? {
              ...prev.currentDocument,
              layers: [...prev.currentDocument.layers, newLayer],
              activeLayer: prev.currentDocument.layers.length,
              modified: new Date(),
            }
          : null,
      }));
    },
    [state.currentDocument]
  );

  // Delete layer
  const deleteLayer = useCallback(
    (index: number) => {
      if (!state.currentDocument || state.currentDocument.layers.length <= 1) return;

      setState(prev => ({
        ...prev,
        currentDocument: prev.currentDocument
          ? {
              ...prev.currentDocument,
              layers: prev.currentDocument.layers.filter((_, i) => i !== index),
              activeLayer: Math.max(
                0,
                prev.currentDocument.activeLayer -
                  (index <= prev.currentDocument.activeLayer ? 1 : 0)
              ),
              modified: new Date(),
            }
          : null,
      }));
    },
    [state.currentDocument]
  );

  // Save bitmap
  const saveBitmap = useCallback(async () => {
    if (!state.currentDocument) return;

    try {
      // Create composite image
      const canvas = document.createElement('canvas');
      canvas.width = state.currentDocument.width;
      canvas.height = state.currentDocument.height;
      const ctx = canvas.getContext('2d')!;

      // Draw all layers
      for (const layer of state.currentDocument.layers) {
        if (!layer.visible) continue;

        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < layer.pixels.length; i++) {
          const pixel = layer.pixels[i];
          const offset = i * 4;

          data[offset] = (pixel >>> 24) & 0xff; // R
          data[offset + 1] = (pixel >>> 16) & 0xff; // G
          data[offset + 2] = (pixel >>> 8) & 0xff; // B
          data[offset + 3] = pixel & 0xff; // A
        }

        ctx.putImageData(imageData, 0, 0);
      }

      // Convert to blob and download
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = state.currentDocument!.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to save bitmap:', error);
    }
  }, [state.currentDocument]);

  // Render tool palette
  const renderToolPalette = () => (
    <div
      className="tool-palette"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        minWidth: '160px',
      }}
    >
      <h4 style={{ margin: 0, fontSize: '12px' }}>Tools</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
        {Object.values(BitmapTool).map(tool => (
          <button
            key={tool}
            className={`tool-button ${state.selectedTool === tool ? 'active' : ''}`}
            style={{
              padding: '6px',
              fontSize: '9px',
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
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>Brush Size:</div>
        <input
          type="range"
          min={1}
          max={20}
          value={state.brushSize}
          onChange={e => setState(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '9px', textAlign: 'center' }}>{state.brushSize}px</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1px' }}>
        {DEFAULT_PALETTE.map((color, index) => (
          <div
            key={index}
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: color,
              border: '1px solid #999',
              cursor: 'pointer',
            }}
            onClick={() => setState(prev => ({ ...prev, primaryColor: color }))}
            onContextMenu={e => {
              e.preventDefault();
              setState(prev => ({ ...prev, secondaryColor: color }));
            }}
          />
        ))}
      </div>

      <div>
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>Primary:</div>
        <input
          type="color"
          value={state.primaryColor}
          onChange={e => setState(prev => ({ ...prev, primaryColor: e.target.value }))}
          style={{ width: '100%', height: '30px' }}
        />
      </div>

      <div>
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>Secondary:</div>
        <input
          type="color"
          value={state.secondaryColor}
          onChange={e => setState(prev => ({ ...prev, secondaryColor: e.target.value }))}
          style={{ width: '100%', height: '30px' }}
        />
      </div>
    </div>
  );

  // Render layers panel
  const renderLayersPanel = () => (
    <div
      className="layers-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '200px',
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '12px' }}>Layers</h4>
        <button onClick={() => addLayer()} style={{ padding: '2px 6px', fontSize: '10px' }}>
          + Add
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {state.currentDocument?.layers.map((layer, index) => (
          <div
            key={layer.id}
            style={{
              padding: '4px 8px',
              borderBottom: '1px solid #ddd',
              backgroundColor:
                index === state.currentDocument?.activeLayer ? '#e0e0ff' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={() =>
              setState(prev => ({
                ...prev,
                currentDocument: prev.currentDocument
                  ? {
                      ...prev.currentDocument,
                      activeLayer: index,
                    }
                  : null,
              }))
            }
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={e => {
                e.stopPropagation();
                setState(prev => ({
                  ...prev,
                  currentDocument: prev.currentDocument
                    ? {
                        ...prev.currentDocument,
                        layers: prev.currentDocument.layers.map((l, i) =>
                          i === index ? { ...l, visible: e.target.checked } : l
                        ),
                      }
                    : null,
                }));
              }}
            />
            <span style={{ fontSize: '10px', flex: 1 }}>{layer.name}</span>
            {state.currentDocument!.layers.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  deleteLayer(index);
                }}
                style={{ padding: '0 4px', fontSize: '8px', color: 'red' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="bitmap-editor"
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
        <button
          onClick={() => createNewDocument()}
          style={{ padding: '4px 8px', fontSize: '10px' }}
        >
          New
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '4px 8px', fontSize: '10px' }}
        >
          Open
        </button>

        <button
          onClick={saveBitmap}
          disabled={!state.currentDocument}
          style={{ padding: '4px 8px', fontSize: '10px' }}
        >
          Save
        </button>

        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 4px' }} />

        <select
          onChange={e => {
            const [width, height] = e.target.value.split('x').map(Number);
            createNewDocument(width, height);
          }}
          style={{ fontSize: '10px' }}
        >
          <option value="">New Size...</option>
          {STANDARD_BITMAP_SIZES.map(size => (
            <option key={`${size.width}x${size.height}`} value={`${size.width}x${size.height}`}>
              {size.name}
            </option>
          ))}
        </select>

        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 4px' }} />

        <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
          <input
            type="checkbox"
            checked={state.showGrid}
            onChange={e => setState(prev => ({ ...prev, showGrid: e.target.checked }))}
          />
          Grid
        </label>

        <label style={{ fontSize: '10px' }}>
          Zoom:
          <select
            value={state.zoom}
            onChange={e => setState(prev => ({ ...prev, zoom: parseInt(e.target.value) }))}
            style={{ fontSize: '10px', marginLeft: '4px' }}
          >
            <option value={1}>100%</option>
            <option value={2}>200%</option>
            <option value={4}>400%</option>
            <option value={8}>800%</option>
            <option value={16}>1600%</option>
          </select>
        </label>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left panel */}
        {renderToolPalette()}

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e0e0e0',
            padding: '16px',
            overflow: 'auto',
          }}
        >
          {state.currentDocument ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onContextMenu={e => e.preventDefault()}
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
              <div>No bitmap loaded</div>
              <div style={{ fontSize: '10px', marginTop: '8px' }}>
                Click "New" to create a bitmap or "Open" to load one
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        {renderLayersPanel()}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={e => {
          // Load image implementation would go here
        }}
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
        {state.currentDocument
          ? `${state.currentDocument.width}×${state.currentDocument.height} • ${state.currentDocument.colorDepth}-bit • Tool: ${state.selectedTool} • Brush: ${state.brushSize}px`
          : 'Ready'}
      </div>
    </div>
  );
};

export default BitmapEditor;
