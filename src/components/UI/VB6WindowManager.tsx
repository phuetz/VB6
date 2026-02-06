import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Minimize2,
  Maximize2,
  X,
  Move,
  RotateCcw,
  Copy,
  Layers,
  Settings,
  Monitor,
} from 'lucide-react';

interface VB6Window {
  id: string;
  title: string;
  content: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  visible: boolean;
  resizable: boolean;
  movable: boolean;
  icon?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
}

interface VB6WindowManagerProps {
  windows: VB6Window[];
  onWindowUpdate: (id: string, updates: Partial<VB6Window>) => void;
  onWindowClose: (id: string) => void;
  onWindowBringToFront: (id: string) => void;
  activeWindowId?: string;
}

const VB6WindowManager: React.FC<VB6WindowManagerProps> = ({
  windows,
  onWindowUpdate,
  onWindowClose,
  onWindowBringToFront,
  activeWindowId,
}) => {
  const [dragState, setDragState] = useState<{
    windowId: string;
    isDragging: boolean;
    startX: number;
    startY: number;
    startWindowX: number;
    startWindowY: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    windowId: string;
    isResizing: boolean;
    direction: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startWindowX: number;
    startWindowY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState?.isDragging) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        onWindowUpdate(dragState.windowId, {
          x: Math.max(0, dragState.startWindowX + deltaX),
          y: Math.max(0, dragState.startWindowY + deltaY),
        });
      }

      if (resizeState?.isResizing) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;

        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.startWindowX;
        let newY = resizeState.startWindowY;

        // Handle different resize directions
        const { direction } = resizeState;

        if (direction.includes('e')) {
          newWidth = Math.max(200, resizeState.startWidth + deltaX);
        }
        if (direction.includes('w')) {
          newWidth = Math.max(200, resizeState.startWidth - deltaX);
          newX = resizeState.startWindowX + deltaX;
          if (newWidth === 200) newX = resizeState.startWindowX + resizeState.startWidth - 200;
        }
        if (direction.includes('s')) {
          newHeight = Math.max(150, resizeState.startHeight + deltaY);
        }
        if (direction.includes('n')) {
          newHeight = Math.max(150, resizeState.startHeight - deltaY);
          newY = resizeState.startWindowY + deltaY;
          if (newHeight === 150) newY = resizeState.startWindowY + resizeState.startHeight - 150;
        }

        onWindowUpdate(resizeState.windowId, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        });
      }
    },
    [dragState, resizeState, onWindowUpdate]
  );

  // Handle mouse up to end dragging/resizing
  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState?.isDragging || resizeState?.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState?.isDragging ? 'move' : 'nw-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState, resizeState, handleMouseMove, handleMouseUp]);

  // Start dragging a window
  const startDrag = (windowId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const window = windows.find(w => w.id === windowId);
    if (!window || !window.movable) return;

    setDragState({
      windowId,
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startWindowX: window.x,
      startWindowY: window.y,
    });

    onWindowBringToFront(windowId);
  };

  // Start resizing a window
  const startResize = (windowId: string, direction: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const window = windows.find(w => w.id === windowId);
    if (!window || !window.resizable) return;

    setResizeState({
      windowId,
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: window.width,
      startHeight: window.height,
      startWindowX: window.x,
      startWindowY: window.y,
    });

    onWindowBringToFront(windowId);
  };

  // Toggle window minimized state
  const toggleMinimize = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    onWindowUpdate(windowId, {
      minimized: !window.minimized,
      maximized: false,
    });

    window.onMinimize?.();
  };

  // Toggle window maximized state
  const toggleMaximize = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    if (window.maximized) {
      // Restore to previous size/position
      onWindowUpdate(windowId, {
        maximized: false,
        x: 100,
        y: 100,
        width: 800,
        height: 600,
      });
    } else {
      // Maximize to full container
      onWindowUpdate(windowId, {
        maximized: true,
        minimized: false,
        x: 0,
        y: 0,
        width: containerRef.current?.clientWidth || 1200,
        height: (containerRef.current?.clientHeight || 800) - 40, // Leave space for taskbar
      });
    }

    window.onMaximize?.();
  };

  // Close window
  const closeWindow = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (window?.onClose) {
      window.onClose();
    } else {
      onWindowClose(windowId);
    }
  };

  // Get cursor style for resize handles
  const getResizeCursor = (direction: string) => {
    const cursors: { [key: string]: string } = {
      n: 'n-resize',
      ne: 'ne-resize',
      e: 'e-resize',
      se: 'se-resize',
      s: 's-resize',
      sw: 'sw-resize',
      w: 'w-resize',
      nw: 'nw-resize',
    };
    return cursors[direction] || 'default';
  };

  // Filter and sort windows
  const visibleWindows = windows
    .filter(w => w.visible && !w.minimized)
    .sort((a, b) => {
      // Active window on top
      if (a.id === activeWindowId) return 1;
      if (b.id === activeWindowId) return -1;
      return 0;
    });

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
      {/* Render windows */}
      {visibleWindows.map((window, index) => (
        <div
          key={window.id}
          className={`
            absolute bg-white border border-gray-300 shadow-2xl rounded-lg overflow-hidden
            pointer-events-auto transition-all duration-200 ease-out
            ${window.maximized ? 'rounded-none' : ''}
            ${window.id === activeWindowId ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            ${window.className || ''}
          `}
          style={{
            left: window.x,
            top: window.y,
            width: window.width,
            height: window.height,
            zIndex: 1000 + index,
            transform: window.id === activeWindowId ? 'scale(1)' : 'scale(0.98)',
          }}
          onClick={() => onWindowBringToFront(window.id)}
        >
          {/* Title Bar */}
          <div
            className={`
              flex items-center justify-between px-3 py-2 
              bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-move select-none
              ${window.id === activeWindowId ? 'from-blue-700 to-indigo-700' : 'from-gray-400 to-gray-500'}
            `}
            onMouseDown={e => startDrag(window.id, e)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {window.icon && <div className="flex-shrink-0">{window.icon}</div>}
              <span className="text-sm font-medium truncate">{window.title}</span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleMinimize(window.id);
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="Minimize"
              >
                <Minimize2 size={14} />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleMaximize(window.id);
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title={window.maximized ? 'Restore' : 'Maximize'}
              >
                <Maximize2 size={14} />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  closeWindow(window.id);
                }}
                className="p-1 hover:bg-red-500 rounded transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 overflow-hidden" style={{ height: window.height - 40 }}>
            {window.content}
          </div>

          {/* Resize Handles */}
          {window.resizable && !window.maximized && (
            <>
              {/* Corner handles */}
              <div
                className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize"
                onMouseDown={e => startResize(window.id, 'nw', e)}
              />
              <div
                className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize"
                onMouseDown={e => startResize(window.id, 'ne', e)}
              />
              <div
                className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize"
                onMouseDown={e => startResize(window.id, 'sw', e)}
              />
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize"
                onMouseDown={e => startResize(window.id, 'se', e)}
              />

              {/* Edge handles */}
              <div
                className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize"
                onMouseDown={e => startResize(window.id, 'n', e)}
              />
              <div
                className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize"
                onMouseDown={e => startResize(window.id, 's', e)}
              />
              <div
                className="absolute -left-1 top-3 bottom-3 w-2 cursor-w-resize"
                onMouseDown={e => startResize(window.id, 'w', e)}
              />
              <div
                className="absolute -right-1 top-3 bottom-3 w-2 cursor-e-resize"
                onMouseDown={e => startResize(window.id, 'e', e)}
              />
            </>
          )}
        </div>
      ))}

      {/* Taskbar for minimized windows */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-200 border-t border-gray-300 flex items-center px-2 gap-1 pointer-events-auto">
        {windows
          .filter(w => w.minimized)
          .map(window => (
            <button
              key={window.id}
              onClick={() => toggleMinimize(window.id)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-50 border border-gray-300 rounded text-sm max-w-48"
              title={window.title}
            >
              {window.icon && <div className="flex-shrink-0">{window.icon}</div>}
              <span className="truncate">{window.title}</span>
            </button>
          ))}
      </div>
    </div>
  );
};

export default VB6WindowManager;
