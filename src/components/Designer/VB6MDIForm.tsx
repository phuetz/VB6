/**
 * VB6 MDI Form Component
 * Implements Multiple Document Interface forms for VB6 compatibility
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext
} from 'react';

// ============================================================================
// Types
// ============================================================================

export interface MDIChildWindow {
  id: string;
  title: string;
  component: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  active: boolean;
  visible: boolean;
  icon?: string;
}

export interface MDIContextType {
  children: MDIChildWindow[];
  activeChild: string | null;
  addChild: (child: Omit<MDIChildWindow, 'id' | 'active'>) => string;
  removeChild: (id: string) => void;
  activateChild: (id: string) => void;
  minimizeChild: (id: string) => void;
  maximizeChild: (id: string) => void;
  restoreChild: (id: string) => void;
  moveChild: (id: string, x: number, y: number) => void;
  resizeChild: (id: string, width: number, height: number) => void;
  cascadeWindows: () => void;
  tileHorizontal: () => void;
  tileVertical: () => void;
  arrangeIcons: () => void;
}

// ============================================================================
// MDI Context
// ============================================================================

const MDIContext = createContext<MDIContextType | null>(null);

export const useMDI = () => {
  const context = useContext(MDIContext);
  if (!context) {
    throw new Error('useMDI must be used within MDIProvider');
  }
  return context;
};

// ============================================================================
// MDI Provider
// ============================================================================

interface MDIProviderProps {
  children: React.ReactNode;
}

export const MDIProvider: React.FC<MDIProviderProps> = ({ children }) => {
  const [mdiChildren, setMDIChildren] = useState<MDIChildWindow[]>([]);
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const nextIdRef = useRef(1);

  const addChild = useCallback(
    (child: Omit<MDIChildWindow, 'id' | 'active'>): string => {
      const id = `mdi-child-${nextIdRef.current++}`;
      setMDIChildren(prev => [
        ...prev.map(c => ({ ...c, active: false })),
        { ...child, id, active: true }
      ]);
      setActiveChild(id);
      return id;
    },
    []
  );

  const removeChild = useCallback((id: string) => {
    setMDIChildren(prev => {
      const newChildren = prev.filter(c => c.id !== id);
      if (newChildren.length > 0) {
        const last = newChildren[newChildren.length - 1];
        return newChildren.map(c => ({
          ...c,
          active: c.id === last.id
        }));
      }
      return newChildren;
    });
    setActiveChild(prev => (prev === id ? null : prev));
  }, []);

  const activateChild = useCallback((id: string) => {
    setMDIChildren(prev =>
      prev.map(c => ({
        ...c,
        active: c.id === id
      }))
    );
    setActiveChild(id);
  }, []);

  const minimizeChild = useCallback((id: string) => {
    setMDIChildren(prev =>
      prev.map(c => (c.id === id ? { ...c, minimized: true, maximized: false } : c))
    );
  }, []);

  const maximizeChild = useCallback((id: string) => {
    setMDIChildren(prev =>
      prev.map(c => (c.id === id ? { ...c, maximized: true, minimized: false } : c))
    );
  }, []);

  const restoreChild = useCallback((id: string) => {
    setMDIChildren(prev =>
      prev.map(c => (c.id === id ? { ...c, minimized: false, maximized: false } : c))
    );
  }, []);

  const moveChild = useCallback((id: string, x: number, y: number) => {
    setMDIChildren(prev => prev.map(c => (c.id === id ? { ...c, x, y } : c)));
  }, []);

  const resizeChild = useCallback((id: string, width: number, height: number) => {
    setMDIChildren(prev => prev.map(c => (c.id === id ? { ...c, width, height } : c)));
  }, []);

  const cascadeWindows = useCallback(() => {
    setMDIChildren(prev => {
      let offset = 0;
      return prev.map(c => {
        if (!c.minimized) {
          const result = {
            ...c,
            x: 20 + offset,
            y: 20 + offset,
            maximized: false
          };
          offset += 30;
          return result;
        }
        return c;
      });
    });
  }, []);

  const tileHorizontal = useCallback(() => {
    setMDIChildren(prev => {
      const visible = prev.filter(c => !c.minimized);
      const count = visible.length;
      if (count === 0) return prev;

      const height = Math.floor(100 / count);
      let y = 0;

      return prev.map(c => {
        if (!c.minimized) {
          const result = {
            ...c,
            x: 0,
            y: y,
            width: 100,
            height,
            maximized: false
          };
          y += height;
          return result;
        }
        return c;
      });
    });
  }, []);

  const tileVertical = useCallback(() => {
    setMDIChildren(prev => {
      const visible = prev.filter(c => !c.minimized);
      const count = visible.length;
      if (count === 0) return prev;

      const width = Math.floor(100 / count);
      let x = 0;

      return prev.map(c => {
        if (!c.minimized) {
          const result = {
            ...c,
            x,
            y: 0,
            width,
            height: 100,
            maximized: false
          };
          x += width;
          return result;
        }
        return c;
      });
    });
  }, []);

  const arrangeIcons = useCallback(() => {
    setMDIChildren(prev => {
      let x = 10;
      let y = 10;
      const iconWidth = 100;
      const iconHeight = 30;

      return prev.map(c => {
        if (c.minimized) {
          const result = { ...c, x, y };
          x += iconWidth + 10;
          if (x > 500) {
            x = 10;
            y += iconHeight + 10;
          }
          return result;
        }
        return c;
      });
    });
  }, []);

  const value: MDIContextType = {
    children: mdiChildren,
    activeChild,
    addChild,
    removeChild,
    activateChild,
    minimizeChild,
    maximizeChild,
    restoreChild,
    moveChild,
    resizeChild,
    cascadeWindows,
    tileHorizontal,
    tileVertical,
    arrangeIcons
  };

  return <MDIContext.Provider value={value}>{children}</MDIContext.Provider>;
};

// ============================================================================
// MDI Child Window Component
// ============================================================================

interface MDIChildProps {
  window: MDIChildWindow;
}

const MDIChild: React.FC<MDIChildProps> = ({ window }) => {
  const mdi = useMDI();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('mdi-title-bar')) {
        e.preventDefault();
        mdi.activateChild(window.id);
        setIsDragging(true);
        setDragStart({ x: e.clientX - window.x, y: e.clientY - window.y });
      }
    },
    [mdi, window.id, window.x, window.y]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        mdi.moveChild(window.id, e.clientX - dragStart.x, e.clientY - dragStart.y);
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        mdi.resizeChild(
          window.id,
          Math.max(200, window.width + deltaX),
          Math.max(100, window.height + deltaY)
        );
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, mdi, window]);

  if (!window.visible) return null;

  // Minimized state - show as icon
  if (window.minimized) {
    return (
      <div
        className="mdi-minimized"
        style={{
          position: 'absolute',
          left: window.x,
          top: window.y,
          width: 160,
          height: 26,
          backgroundColor: window.active ? '#000080' : '#808080',
          border: '2px outset #c0c0c0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          cursor: 'pointer'
        }}
        onDoubleClick={() => mdi.restoreChild(window.id)}
        onClick={() => mdi.activateChild(window.id)}
      >
        <span
          style={{
            color: 'white',
            fontSize: '11px',
            fontFamily: 'MS Sans Serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {window.title}
        </span>
      </div>
    );
  }

  const windowStyle: React.CSSProperties = window.maximized
    ? {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: window.active ? 100 : 1
      }
    : {
        position: 'absolute',
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.active ? 100 : 1
      };

  return (
    <div
      ref={containerRef}
      className="mdi-child"
      style={{
        ...windowStyle,
        backgroundColor: '#c0c0c0',
        border: '2px outset #ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: window.active ? '2px 2px 8px rgba(0,0,0,0.3)' : 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div
        className="mdi-title-bar"
        style={{
          backgroundColor: window.active ? '#000080' : '#808080',
          color: 'white',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move',
          userSelect: 'none',
          height: '20px'
        }}
        onDoubleClick={() =>
          window.maximized ? mdi.restoreChild(window.id) : mdi.maximizeChild(window.id)
        }
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'MS Sans Serif',
            fontWeight: 'bold'
          }}
        >
          {window.title}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            style={{
              width: '16px',
              height: '14px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#c0c0c0',
              fontSize: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => {
              e.stopPropagation();
              mdi.minimizeChild(window.id);
            }}
          >
            _
          </button>
          <button
            style={{
              width: '16px',
              height: '14px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#c0c0c0',
              fontSize: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => {
              e.stopPropagation();
              window.maximized ? mdi.restoreChild(window.id) : mdi.maximizeChild(window.id);
            }}
          >
            {window.maximized ? '❐' : '□'}
          </button>
          <button
            style={{
              width: '16px',
              height: '14px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#c0c0c0',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => {
              e.stopPropagation();
              mdi.removeChild(window.id);
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#ffffff'
        }}
      >
        {window.component}
      </div>

      {/* Resize Handle */}
      {!window.maximized && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: 'se-resize',
            background:
              'linear-gradient(135deg, transparent 50%, #808080 50%, #808080 60%, transparent 60%, transparent 70%, #808080 70%)'
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
};

// ============================================================================
// MDI Form Component
// ============================================================================

interface VB6MDIFormProps {
  name?: string;
  caption?: string;
  backColor?: string;
  menuBar?: React.ReactNode;
  toolBar?: React.ReactNode;
  statusBar?: React.ReactNode;
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export const VB6MDIForm: React.FC<VB6MDIFormProps> = ({
  name = 'MDIForm1',
  caption = 'MDI Application',
  backColor = '#808080',
  menuBar,
  toolBar,
  statusBar,
  width = 800,
  height = 600,
  children
}) => {
  const mdi = useMDI();

  return (
    <div
      className="vb6-mdi-form"
      data-name={name}
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#c0c0c0',
        border: '2px outset #ffffff',
        fontFamily: 'MS Sans Serif',
        fontSize: '11px'
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          backgroundColor: '#000080',
          color: 'white',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '20px'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{caption}</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            style={{
              width: '16px',
              height: '14px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#c0c0c0',
              fontSize: '8px',
              cursor: 'pointer'
            }}
          >
            _
          </button>
          <button
            style={{
              width: '16px',
              height: '14px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#c0c0c0',
              fontSize: '8px',
              cursor: 'pointer'
            }}
          >
            □
          </button>
          <button
            style={{
              width: '16px',
              height: '14px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#c0c0c0',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      {menuBar && (
        <div
          style={{
            backgroundColor: '#c0c0c0',
            borderBottom: '1px solid #808080'
          }}
        >
          {menuBar}
        </div>
      )}

      {/* Toolbar */}
      {toolBar && (
        <div
          style={{
            backgroundColor: '#c0c0c0',
            borderBottom: '1px solid #808080',
            padding: '2px'
          }}
        >
          {toolBar}
        </div>
      )}

      {/* MDI Client Area */}
      <div
        className="mdi-client"
        style={{
          flex: 1,
          backgroundColor: backColor,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {mdi.children.map(child => (
          <MDIChild key={child.id} window={child} />
        ))}
        {children}
      </div>

      {/* Status Bar */}
      {statusBar && (
        <div
          style={{
            backgroundColor: '#c0c0c0',
            borderTop: '1px solid #ffffff',
            padding: '2px 4px',
            height: '20px'
          }}
        >
          {statusBar}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MDI Menu Component
// ============================================================================

interface MDIWindowMenuProps {
  className?: string;
}

export const MDIWindowMenu: React.FC<MDIWindowMenuProps> = ({ className }) => {
  const mdi = useMDI();

  return (
    <div className={className} style={{ display: 'flex', gap: '4px' }}>
      <button
        onClick={mdi.cascadeWindows}
        style={{
          padding: '2px 8px',
          backgroundColor: '#c0c0c0',
          border: '1px outset #ffffff',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Cascade
      </button>
      <button
        onClick={mdi.tileHorizontal}
        style={{
          padding: '2px 8px',
          backgroundColor: '#c0c0c0',
          border: '1px outset #ffffff',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Tile Horizontal
      </button>
      <button
        onClick={mdi.tileVertical}
        style={{
          padding: '2px 8px',
          backgroundColor: '#c0c0c0',
          border: '1px outset #ffffff',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Tile Vertical
      </button>
      <button
        onClick={mdi.arrangeIcons}
        style={{
          padding: '2px 8px',
          backgroundColor: '#c0c0c0',
          border: '1px outset #ffffff',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Arrange Icons
      </button>
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default {
  MDIProvider,
  VB6MDIForm,
  MDIChild,
  MDIWindowMenu,
  useMDI
};
