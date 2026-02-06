/**
 * Optimized Designer Canvas
 *
 * High-performance version of the form designer with advanced optimizations:
 * - Control virtualization for large forms
 * - Render caching and throttling
 * - Memory pooling for objects
 * - Efficient event handling
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Control } from '../../context/types';
import { performanceOptimizer } from '../../performance/PerformanceOptimizer';

interface OptimizedDesignerCanvasProps {
  controls: Control[];
  selectedControls: string[];
  onControlSelect: (controlIds: string[]) => void;
  onControlUpdate: (controlId: string, updates: Partial<Control>) => void;
  onControlMove: (controlId: string, deltaX: number, deltaY: number) => void;
  onControlResize: (controlId: string, newBounds: { width: number; height: number }) => void;
  zoom: number;
  gridSize: number;
  showGrid: boolean;
  showAlignmentGuides: boolean;
  enableSnapping: boolean;
}

// Virtualized control renderer
const VirtualizedControl = React.memo<{
  control: Control;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onUpdate: (updates: Partial<Control>) => void;
}>(({ control, isSelected, zoom, onSelect, onUpdate }) => {
  const controlRef = useRef<HTMLDivElement>(null);

  // Memoized style calculation
  const style = useMemo(
    () => ({
      position: 'absolute' as const,
      left: control.x * zoom,
      top: control.y * zoom,
      width: control.width * zoom,
      height: control.height * zoom,
      border: isSelected ? '2px solid #007ACC' : '1px solid #ccc',
      backgroundColor: control.backgroundColor || '#f0f0f0',
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      cursor: 'move',
      userSelect: 'none' as const,
      zIndex: isSelected ? 1000 : control.zIndex || 1,
    }),
    [control, isSelected, zoom]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(control.id.toString());
    },
    [control.id, onSelect]
  );

  return (
    <div
      ref={controlRef}
      style={style}
      onClick={handleClick}
      data-control-id={control.id}
      data-control-type={control.type}
    >
      {control.caption || control.text || control.name}
    </div>
  );
});

VirtualizedControl.displayName = 'VirtualizedControl';

export const OptimizedDesignerCanvas: React.FC<OptimizedDesignerCanvasProps> = ({
  controls,
  selectedControls,
  onControlSelect,
  onControlUpdate,
  onControlMove,
  onControlResize,
  zoom,
  gridSize,
  showGrid,
  showAlignmentGuides,
  enableSnapping,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewportBounds, setViewportBounds] = useState<DOMRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastRenderTime = useRef<number>(0);

  // Virtualized controls based on viewport
  const visibleControls = useMemo(() => {
    if (!viewportBounds || controls.length < 100) {
      return controls;
    }

    return performanceOptimizer.getVirtualizedControls(controls, viewportBounds);
  }, [controls, viewportBounds]);

  // Throttled render function
  const throttledRender = useCallback((renderFn: () => void) => {
    performanceOptimizer.throttledRender(renderFn);
  }, []);

  // Update viewport bounds on scroll/resize
  useEffect(() => {
    const updateViewport = () => {
      if (canvasRef.current) {
        setViewportBounds(canvasRef.current.getBoundingClientRect());
      }
    };

    updateViewport();

    const resizeObserver = new ResizeObserver(updateViewport);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Optimized event handlers using event delegation
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const controlId = target.dataset.controlId;

      if (controlId) {
        const rect = target.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setIsDragging(true);
        onControlSelect([controlId]);
      } else {
        // Clear selection when clicking empty space
        onControlSelect([]);
      }
    },
    [onControlSelect]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || selectedControls.length === 0) return;

      throttledRender(() => {
        const selectedControl = controls.find(c => selectedControls.includes(c.id.toString()));
        if (!selectedControl) return;

        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
        const newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;

        // Snap to grid if enabled
        const snappedX = enableSnapping ? Math.round(newX / gridSize) * gridSize : newX;
        const snappedY = enableSnapping ? Math.round(newY / gridSize) * gridSize : newY;

        const deltaX = snappedX - selectedControl.x;
        const deltaY = snappedY - selectedControl.y;

        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
          onControlMove(selectedControl.id.toString(), deltaX, deltaY);
        }
      });
    },
    [
      isDragging,
      selectedControls,
      controls,
      zoom,
      enableSnapping,
      gridSize,
      dragOffset,
      throttledRender,
      onControlMove,
    ]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Memoized grid pattern
  const gridPattern = useMemo(() => {
    if (!showGrid) return null;

    const scaledGridSize = gridSize * zoom;
    return (
      <defs>
        <pattern
          id="grid"
          width={scaledGridSize}
          height={scaledGridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
    );
  }, [showGrid, gridSize, zoom]);

  // Memoized alignment guides
  const alignmentGuides = useMemo(() => {
    if (!showAlignmentGuides || selectedControls.length === 0) return null;

    const selectedControl = controls.find(c => selectedControls.includes(c.id.toString()));
    if (!selectedControl) return null;

    const guides = [];
    const centerX = selectedControl.x + selectedControl.width / 2;
    const centerY = selectedControl.y + selectedControl.height / 2;

    // Find alignment opportunities with other controls
    controls.forEach(control => {
      if (control.id === selectedControl.id) return;

      const controlCenterX = control.x + control.width / 2;
      const controlCenterY = control.y + control.height / 2;

      // Vertical alignment
      if (Math.abs(centerX - controlCenterX) < 5) {
        guides.push(
          <line
            key={`v-${control.id}`}
            x1={controlCenterX * zoom}
            y1={0}
            x2={controlCenterX * zoom}
            y2="100%"
            stroke="#ff6b6b"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        );
      }

      // Horizontal alignment
      if (Math.abs(centerY - controlCenterY) < 5) {
        guides.push(
          <line
            key={`h-${control.id}`}
            x1={0}
            y1={controlCenterY * zoom}
            x2="100%"
            y2={controlCenterY * zoom}
            stroke="#ff6b6b"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        );
      }
    });

    return guides;
  }, [showAlignmentGuides, selectedControls, controls, zoom]);

  // Optimized control selection handler
  const handleControlSelect = useCallback(
    (controlId: string) => {
      onControlSelect([controlId]);
    },
    [onControlSelect]
  );

  // Optimized control update handler
  const handleControlUpdate = useCallback(
    (controlId: string, updates: Partial<Control>) => {
      onControlUpdate(controlId, updates);
    },
    [onControlUpdate]
  );

  // Performance measurement
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > 16) {
      // Log slow renders (> 1 frame at 60fps)
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
  });

  return (
    <div
      ref={canvasRef}
      className="designer-canvas relative w-full h-full overflow-auto bg-white select-none"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      style={{
        cursor: isDragging ? 'grabbing' : 'default',
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      {/* SVG overlay for grid and guides */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        style={{ zIndex: 0 }}
      >
        {gridPattern}
        {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
        {alignmentGuides}
      </svg>

      {/* Virtualized controls */}
      {visibleControls.map(control => (
        <VirtualizedControl
          key={control.id}
          control={control}
          isSelected={selectedControls.includes(control.id.toString())}
          zoom={1} // Already scaled by container
          onSelect={handleControlSelect}
          onUpdate={updates => handleControlUpdate(control.id.toString(), updates)}
        />
      ))}

      {/* Performance overlay in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Controls: {controls.length}</div>
          <div>Visible: {visibleControls.length}</div>
          <div>Selected: {selectedControls.length}</div>
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
};

export default OptimizedDesignerCanvas;
