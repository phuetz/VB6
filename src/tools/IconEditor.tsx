import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EventEmitter } from 'events';

// Icon Format Constants
export enum IconFormat {
  ICO = 'ico',
  CUR = 'cur',
  PNG = 'png',
  BMP = 'bmp',
}

// Icon Size Constants
export enum IconSize {
  Size16x16 = 16,
  Size24x24 = 24,
  Size32x32 = 32,
  Size48x48 = 48,
  Size64x64 = 64,
  Size128x128 = 128,
  Size256x256 = 256,
}

// Icon Color Depth
export enum IconColorDepth {
  Mono = 1,
  Color16 = 4,
  Color256 = 8,
  TrueColor = 24,
  TrueColorAlpha = 32,
}

// Drawing Tools
export enum DrawingTool {
  Pencil = 'pencil',
  Brush = 'brush',
  Line = 'line',
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Fill = 'fill',
  Eraser = 'eraser',
  ColorPicker = 'colorpicker',
  Text = 'text',
  Select = 'select',
  Move = 'move',
}

// Icon Layer
export interface IconLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  data: ImageData;
}

// Icon Frame (for animated cursors)
export interface IconFrame {
  duration: number;
  hotspotX: number;
  hotspotY: number;
  data: ImageData;
}

// Icon Project
export interface IconProject {
  name: string;
  format: IconFormat;
  width: number;
  height: number;
  colorDepth: IconColorDepth;
  layers: IconLayer[];
  frames?: IconFrame[];
  hotspotX?: number;
  hotspotY?: number;
}

interface IconEditorProps {
  initialProject?: IconProject;
  onSave?: (project: IconProject) => void;
  onExport?: (data: Blob, format: IconFormat) => void;
}

export const IconEditor: React.FC<IconEditorProps> = ({ initialProject, onSave, onExport }) => {
  const [project, setProject] = useState<IconProject>(
    initialProject || {
      name: 'New Icon',
      format: IconFormat.ICO,
      width: IconSize.Size32x32,
      height: IconSize.Size32x32,
      colorDepth: IconColorDepth.TrueColorAlpha,
      layers: [],
    }
  );

  const [selectedTool, setSelectedTool] = useState<DrawingTool>(DrawingTool.Pencil);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(1);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [zoom, setZoom] = useState(8);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // Initialize with empty layer
  useEffect(() => {
    if (project.layers.length === 0) {
      addLayer();
    }
  }, []);

  // Update preview whenever project changes
  useEffect(() => {
    updatePreview();
  }, [project]);

  const addLayer = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = project.width;
    canvas.height = project.height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(project.width, project.height);

    // Initialize with transparent pixels
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 0; // R
      imageData.data[i + 1] = 0; // G
      imageData.data[i + 2] = 0; // B
      imageData.data[i + 3] = 0; // A
    }

    const newLayer: IconLayer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${project.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      data: imageData,
    };

    setProject(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
    }));

    setSelectedLayer(newLayer.id);
  }, [project.width, project.height, project.layers.length]);

  const removeLayer = useCallback(
    (layerId: string) => {
      if (project.layers.length <= 1) return; // Keep at least one layer

      setProject(prev => ({
        ...prev,
        layers: prev.layers.filter(l => l.id !== layerId),
      }));

      if (selectedLayer === layerId) {
        setSelectedLayer(project.layers[0]?.id || null);
      }
    },
    [project.layers, selectedLayer]
  );

  const updateLayer = useCallback((layerId: string, updates: Partial<IconLayer>) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => (l.id === layerId ? { ...l, ...updates } : l)),
    }));
  }, []);

  const getCurrentLayer = useCallback((): IconLayer | null => {
    return project.layers.find(l => l.id === selectedLayer) || null;
  }, [project.layers, selectedLayer]);

  const saveToHistory = useCallback(() => {
    const layer = getCurrentLayer();
    if (!layer) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(
      new ImageData(new Uint8ClampedArray(layer.data.data), layer.data.width, layer.data.height)
    );

    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [getCurrentLayer, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const layer = getCurrentLayer();
      if (!layer) return;

      const previousData = history[historyIndex - 1];
      updateLayer(layer.id, {
        data: new ImageData(
          new Uint8ClampedArray(previousData.data),
          previousData.width,
          previousData.height
        ),
      });

      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, history, getCurrentLayer, updateLayer]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const layer = getCurrentLayer();
      if (!layer) return;

      const nextData = history[historyIndex + 1];
      updateLayer(layer.id, {
        data: new ImageData(new Uint8ClampedArray(nextData.data), nextData.width, nextData.height),
      });

      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history, getCurrentLayer, updateLayer]);

  const getPixelIndex = (x: number, y: number): number => {
    return (y * project.width + x) * 4;
  };

  const setPixel = useCallback(
    (x: number, y: number, color: string, alpha: number = 255) => {
      const layer = getCurrentLayer();
      if (!layer || layer.locked) return;

      if (x < 0 || x >= project.width || y < 0 || y >= project.height) return;

      const index = getPixelIndex(x, y);
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      layer.data.data[index] = r;
      layer.data.data[index + 1] = g;
      layer.data.data[index + 2] = b;
      layer.data.data[index + 3] = alpha * layer.opacity;

      updateLayer(layer.id, { data: layer.data });
    },
    [getCurrentLayer, project.width, project.height, updateLayer]
  );

  const getPixelColor = useCallback(
    (x: number, y: number): string => {
      const layer = getCurrentLayer();
      if (!layer) return '#000000';

      if (x < 0 || x >= project.width || y < 0 || y >= project.height) return '#000000';

      const index = getPixelIndex(x, y);
      const r = layer.data.data[index];
      const g = layer.data.data[index + 1];
      const b = layer.data.data[index + 2];

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },
    [getCurrentLayer, project.width, project.height]
  );

  const drawLine = useCallback(
    (x0: number, y0: number, x1: number, y1: number, color: string) => {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        setPixel(x0, y0, color);

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
    },
    [setPixel]
  );

  const drawRectangle = useCallback(
    (x0: number, y0: number, x1: number, y1: number, color: string, filled: boolean) => {
      const minX = Math.min(x0, x1);
      const maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1);
      const maxY = Math.max(y0, y1);

      if (filled) {
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            setPixel(x, y, color);
          }
        }
      } else {
        // Top and bottom edges
        for (let x = minX; x <= maxX; x++) {
          setPixel(x, minY, color);
          setPixel(x, maxY, color);
        }
        // Left and right edges
        for (let y = minY; y <= maxY; y++) {
          setPixel(minX, y, color);
          setPixel(maxX, y, color);
        }
      }
    },
    [setPixel]
  );

  const drawEllipse = useCallback(
    (cx: number, cy: number, rx: number, ry: number, color: string, filled: boolean) => {
      const plot = (x: number, y: number) => {
        if (filled) {
          for (let i = cx - x; i <= cx + x; i++) {
            setPixel(i, cy + y, color);
            setPixel(i, cy - y, color);
          }
        } else {
          setPixel(cx + x, cy + y, color);
          setPixel(cx - x, cy + y, color);
          setPixel(cx + x, cy - y, color);
          setPixel(cx - x, cy - y, color);
        }
      };

      let x = 0;
      let y = ry;
      const rx2 = rx * rx;
      const ry2 = ry * ry;
      const twoRx2 = 2 * rx2;
      const twoRy2 = 2 * ry2;
      let p;
      let px = 0;
      let py = twoRx2 * y;

      plot(x, y);

      // Region 1
      p = Math.round(ry2 - rx2 * ry + 0.25 * rx2);
      while (px < py) {
        x++;
        px += twoRy2;
        if (p < 0) {
          p += ry2 + px;
        } else {
          y--;
          py -= twoRx2;
          p += ry2 + px - py;
        }
        plot(x, y);
      }

      // Region 2
      p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
      while (y > 0) {
        y--;
        py -= twoRx2;
        if (p > 0) {
          p += rx2 - py;
        } else {
          x++;
          px += twoRy2;
          p += rx2 - py + px;
        }
        plot(x, y);
      }
    },
    [setPixel]
  );

  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const layer = getCurrentLayer();
      if (!layer || layer.locked) return;

      const targetColor = getPixelColor(startX, startY);
      if (targetColor === fillColor) return;

      const stack: Array<[number, number]> = [[startX, startY]];
      const visited = new Set<string>();

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (x < 0 || x >= project.width || y < 0 || y >= project.height) continue;

        if (getPixelColor(x, y) !== targetColor) continue;

        setPixel(x, y, fillColor);

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    },
    [getCurrentLayer, getPixelColor, setPixel, project.width, project.height]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);

      setIsDrawing(true);
      setLastPosition({ x, y });

      saveToHistory();

      const color = e.button === 2 ? secondaryColor : primaryColor;

      switch (selectedTool) {
        case DrawingTool.Pencil:
        case DrawingTool.Brush:
          setPixel(x, y, color);
          break;
        case DrawingTool.Fill:
          floodFill(x, y, color);
          break;
        case DrawingTool.ColorPicker: {
          const pickedColor = getPixelColor(x, y);
          if (e.button === 2) {
            setSecondaryColor(pickedColor);
          } else {
            setPrimaryColor(pickedColor);
          }
          break;
        }
        case DrawingTool.Eraser:
          setPixel(x, y, '#000000', 0);
          break;
      }
    },
    [
      zoom,
      selectedTool,
      primaryColor,
      secondaryColor,
      setPixel,
      floodFill,
      getPixelColor,
      saveToHistory,
    ]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);

      const color = e.button === 2 ? secondaryColor : primaryColor;

      switch (selectedTool) {
        case DrawingTool.Pencil:
        case DrawingTool.Brush:
          if (lastPosition) {
            drawLine(lastPosition.x, lastPosition.y, x, y, color);
          }
          break;
        case DrawingTool.Eraser:
          if (lastPosition) {
            const dx = x - lastPosition.x;
            const dy = y - lastPosition.y;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));

            for (let i = 0; i <= steps; i++) {
              const xi = Math.round(lastPosition.x + (dx * i) / steps);
              const yi = Math.round(lastPosition.y + (dy * i) / steps);
              setPixel(xi, yi, '#000000', 0);
            }
          }
          break;
      }

      setLastPosition({ x, y });
    },
    [isDrawing, zoom, selectedTool, primaryColor, secondaryColor, lastPosition, drawLine, setPixel]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPosition(null);
  }, []);

  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard background
    const tileSize = 8 * zoom;
    for (let y = 0; y < canvas.height; y += tileSize) {
      for (let x = 0; x < canvas.width; x += tileSize) {
        const isLight = (x / tileSize + y / tileSize) % 2 === 0;
        ctx.fillStyle = isLight ? '#CCCCCC' : '#FFFFFF';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Draw layers
    project.layers.forEach(layer => {
      if (!layer.visible) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = project.width;
      tempCanvas.height = project.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(layer.data, 0, 0);

      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(tempCanvas, 0, 0, project.width * zoom, project.height * zoom);
      ctx.globalAlpha = 1;
    });

    // Draw grid
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= project.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, project.height * zoom);
        ctx.stroke();
      }

      for (let y = 0; y <= project.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(project.width * zoom, y * zoom);
        ctx.stroke();
      }
    }

    // Draw selection
    if (selection) {
      ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        selection.x * zoom,
        selection.y * zoom,
        selection.width * zoom,
        selection.height * zoom
      );
      ctx.setLineDash([]);
    }
  }, [project, zoom, showGrid, selection]);

  const updatePreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    canvas.width = project.width;
    canvas.height = project.height;
    const ctx = canvas.getContext('2d')!;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers
    project.layers.forEach(layer => {
      if (!layer.visible) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = project.width;
      tempCanvas.height = project.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(layer.data, 0, 0);

      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.globalAlpha = 1;
    });
  }, [project]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const handleExport = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      blob => {
        if (blob) {
          onExport?.(blob, project.format);
        }
      },
      `image/${project.format === IconFormat.ICO ? 'x-icon' : project.format}`
    );
  }, [project.format, onExport]);

  const handleSave = useCallback(() => {
    onSave?.(project);
  }, [project, onSave]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        setProject(prev => ({
          ...prev,
          width: img.width,
          height: img.height,
          layers: [
            {
              id: `layer_${Date.now()}`,
              name: 'Imported',
              visible: true,
              locked: false,
              opacity: 1,
              data: imageData,
            },
          ],
        }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Icon Editor</h2>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
            >
              Import
            </label>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 bg-gray-200 border-r border-gray-300 p-2">
          <div className="space-y-2">
            {Object.values(DrawingTool).map(tool => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool)}
                className={`w-12 h-12 rounded flex items-center justify-center ${
                  selectedTool === tool ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
                }`}
                title={tool}
              >
                {tool === DrawingTool.Pencil && '✏️'}
                {tool === DrawingTool.Brush && '🖌️'}
                {tool === DrawingTool.Line && '📏'}
                {tool === DrawingTool.Rectangle && '▭'}
                {tool === DrawingTool.Ellipse && '⭕'}
                {tool === DrawingTool.Fill && '🪣'}
                {tool === DrawingTool.Eraser && '🧹'}
                {tool === DrawingTool.ColorPicker && '💧'}
                {tool === DrawingTool.Text && '🔤'}
                {tool === DrawingTool.Select && '⬚'}
                {tool === DrawingTool.Move && '✋'}
              </button>
            ))}
          </div>

          {/* Color Selection */}
          <div className="mt-4 space-y-2">
            <div className="relative">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
                title="Primary Color"
              />
              <div className="absolute top-0 left-0 text-xs bg-white px-1 rounded">1</div>
            </div>
            <div className="relative">
              <input
                type="color"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
                title="Secondary Color"
              />
              <div className="absolute top-0 left-0 text-xs bg-white px-1 rounded">2</div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div className="inline-block border border-gray-400 bg-white">
            <canvas
              ref={canvasRef}
              width={project.width * zoom}
              height={project.height * zoom}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onContextMenu={e => e.preventDefault()}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Preview */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-700 mb-2">Preview</h3>
            <div className="flex items-center justify-center bg-gray-100 p-4 rounded">
              <canvas
                ref={previewCanvasRef}
                style={{ imageRendering: 'auto' }}
                className="border border-gray-300"
              />
            </div>
          </div>

          {/* Properties */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-700 mb-2">Properties</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Size:</span>
                <select
                  value={project.width}
                  onChange={e => {
                    const size = parseInt(e.target.value);
                    setProject(prev => ({ ...prev, width: size, height: size }));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded"
                >
                  {Object.values(IconSize)
                    .filter(s => typeof s === 'number')
                    .map(size => (
                      <option key={size} value={size}>
                        {size}x{size}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <select
                  value={project.format}
                  onChange={e =>
                    setProject(prev => ({ ...prev, format: e.target.value as IconFormat }))
                  }
                  className="px-2 py-1 border border-gray-300 rounded"
                >
                  {Object.values(IconFormat).map(format => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between">
                <span>Color Depth:</span>
                <select
                  value={project.colorDepth}
                  onChange={e =>
                    setProject(prev => ({
                      ...prev,
                      colorDepth: parseInt(e.target.value) as IconColorDepth,
                    }))
                  }
                  className="px-2 py-1 border border-gray-300 rounded"
                >
                  <option value={IconColorDepth.Mono}>Monochrome</option>
                  <option value={IconColorDepth.Color16}>16 Colors</option>
                  <option value={IconColorDepth.Color256}>256 Colors</option>
                  <option value={IconColorDepth.TrueColor}>True Color</option>
                  <option value={IconColorDepth.TrueColorAlpha}>True Color + Alpha</option>
                </select>
              </div>
            </div>
          </div>

          {/* View Options */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-700 mb-2">View</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Zoom: {zoom}x</span>
                <input
                  type="range"
                  min="1"
                  max="32"
                  value={zoom}
                  onChange={e => setZoom(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={e => setShowGrid(e.target.checked)}
                />
                Show Grid
              </label>
            </div>
          </div>

          {/* Layers */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">Layers</h3>
              <button
                onClick={addLayer}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Add Layer
              </button>
            </div>
            <div className="space-y-1">
              {project.layers.map(layer => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`p-2 border rounded cursor-pointer text-sm ${
                    selectedLayer === layer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={e => {
                          e.stopPropagation();
                          updateLayer(layer.id, { visible: e.target.checked });
                        }}
                      />
                      <span>{layer.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateLayer(layer.id, { locked: !layer.locked });
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={layer.locked ? 'Unlock' : 'Lock'}
                      >
                        {layer.locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                        title="Delete Layer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={e => {
                        e.stopPropagation();
                        updateLayer(layer.id, { opacity: parseFloat(e.target.value) });
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex-1 px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex-1 px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ↷ Redo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconEditor;
