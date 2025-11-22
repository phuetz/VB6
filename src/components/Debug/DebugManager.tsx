import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VB6DebugEngine, VB6CallStackFrame, VB6Breakpoint } from '../../services/VB6DebugEngine';
import DebugToolbar from './DebugToolbar';
import WatchPanel from './WatchPanel';
import LocalsPanel from './LocalsPanel';
import CallStackPanel from './CallStackPanel';

interface DebugManagerProps {
  currentFile?: string;
  currentLine?: number;
  onNavigateToLocation?: (filename: string, line: number) => void;
  onBreakpointUpdate?: (breakpoints: VB6Breakpoint[]) => void;
}

export const DebugManager: React.FC<DebugManagerProps> = ({
  currentFile = 'Module1.bas',
  currentLine = 1,
  onNavigateToLocation,
  onBreakpointUpdate
}) => {
  const [debugEngine] = useState(() => VB6DebugEngine.getInstance());
  const [isDebugging, setIsDebugging] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<VB6CallStackFrame | null>(null);
  const [breakpoints, setBreakpoints] = useState<VB6Breakpoint[]>([]);
  const [activePanel, setActivePanel] = useState<'watch' | 'locals' | 'callstack'>('watch');
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Panel size state
  const [panelHeight, setPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create initial debug session
    debugEngine.createSession();

    const handleDebugStarted = () => {
      setIsDebugging(true);
    };

    const handleDebugStopped = () => {
      setIsDebugging(false);
      setSelectedFrame(null);
    };

    const handleBreakpointAdded = () => {
      updateBreakpoints();
    };

    const handleBreakpointRemoved = () => {
      updateBreakpoints();
    };

    const handleBreakpointToggled = () => {
      updateBreakpoints();
    };

    const updateBreakpoints = () => {
      const bps = debugEngine.getBreakpoints();
      setBreakpoints(bps);
      onBreakpointUpdate?.(bps);
    };

    // Initial breakpoints load
    updateBreakpoints();

    // Event listeners
    debugEngine.on('debugStarted', handleDebugStarted);
    debugEngine.on('debugStopped', handleDebugStopped);
    debugEngine.on('breakpointAdded', handleBreakpointAdded);
    debugEngine.on('breakpointRemoved', handleBreakpointRemoved);
    debugEngine.on('breakpointToggled', handleBreakpointToggled);

    return () => {
      debugEngine.off('debugStarted', handleDebugStarted);
      debugEngine.off('debugStopped', handleDebugStopped);
      debugEngine.off('breakpointAdded', handleBreakpointAdded);
      debugEngine.off('breakpointRemoved', handleBreakpointRemoved);
      debugEngine.off('breakpointToggled', handleBreakpointToggled);
    };
  }, [debugEngine, onBreakpointUpdate]);

  const handleFrameSelect = useCallback((frame: VB6CallStackFrame) => {
    setSelectedFrame(frame);
    onNavigateToLocation?.(frame.filename, frame.line);
  }, [onNavigateToLocation]);

  const handleBreakpointToggle = useCallback((filename: string, line: number) => {
    // Check if breakpoint already exists at this location
    const existingBreakpoint = breakpoints.find(
      bp => bp.filename === filename && bp.line === line
    );

    if (existingBreakpoint) {
      debugEngine.removeBreakpoint(existingBreakpoint.id);
    } else {
      debugEngine.addBreakpoint(filename, line);
    }
  }, [debugEngine, breakpoints]);

  // Handle panel resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const rect = resizeRef.current?.getBoundingClientRect();
      if (rect) {
        const newHeight = rect.bottom - e.clientY;
        setPanelHeight(Math.max(150, Math.min(600, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const getActiveBreakpointsCount = (): number => {
    return breakpoints.filter(bp => bp.enabled).length;
  };

  const getBreakpointForCurrentLine = (): VB6Breakpoint | undefined => {
    return breakpoints.find(bp => bp.filename === currentFile && bp.line === currentLine);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Debug Console</span>
            <div className={`text-sm ${isDebugging ? 'text-green-400' : 'text-gray-400'}`}>
              {isDebugging ? '● Running' : '○ Stopped'}
            </div>
            <div className="text-sm text-gray-400">
              {getActiveBreakpointsCount()} breakpoint{getActiveBreakpointsCount() !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Restore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-300 shadow-lg">
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="w-full h-1 bg-gray-300 hover:bg-blue-500 cursor-ns-resize"
      />

      <div style={{ height: `${panelHeight}px` }} className="flex flex-col">
        {/* Debug Toolbar */}
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-2 py-1">
          <DebugToolbar
            debugEngine={debugEngine}
            currentFile={currentFile}
            onBreakpointToggle={handleBreakpointToggle}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
              title="Minimize"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Debug Panel Tabs and Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel Tabs */}
          <div className="w-32 bg-gray-100 border-r border-gray-200 flex flex-col">
            <button
              onClick={() => setActivePanel('watch')}
              className={`p-2 text-left text-sm border-b border-gray-200 hover:bg-gray-50 ${
                activePanel === 'watch' ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-500' : 'text-gray-700'
              }`}
            >
              Watch
            </button>
            <button
              onClick={() => setActivePanel('locals')}
              className={`p-2 text-left text-sm border-b border-gray-200 hover:bg-gray-50 ${
                activePanel === 'locals' ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-500' : 'text-gray-700'
              }`}
            >
              Locals
            </button>
            <button
              onClick={() => setActivePanel('callstack')}
              className={`p-2 text-left text-sm border-b border-gray-200 hover:bg-gray-50 ${
                activePanel === 'callstack' ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-500' : 'text-gray-700'
              }`}
            >
              Call Stack
            </button>
            
            {/* Debug Status */}
            <div className="mt-auto p-2 text-xs text-gray-500">
              <div>Status: {isDebugging ? 'Active' : 'Inactive'}</div>
              <div>Breakpoints: {getActiveBreakpointsCount()}</div>
              {selectedFrame && (
                <div className="mt-1">
                  Frame: {selectedFrame.functionName}
                </div>
              )}
              {currentLine > 0 && (
                <div>Line: {currentLine}</div>
              )}
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1">
            {activePanel === 'watch' && (
              <WatchPanel
                debugEngine={debugEngine}
                isDebugging={isDebugging}
              />
            )}
            {activePanel === 'locals' && (
              <LocalsPanel
                debugEngine={debugEngine}
                isDebugging={isDebugging}
              />
            )}
            {activePanel === 'callstack' && (
              <CallStackPanel
                debugEngine={debugEngine}
                isDebugging={isDebugging}
                onFrameSelect={handleFrameSelect}
              />
            )}
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-2 py-1 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>File: {currentFile}</span>
            {currentLine > 0 && <span>Line: {currentLine}</span>}
            {getBreakpointForCurrentLine() && (
              <span className="text-red-600">● Breakpoint</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {selectedFrame && (
              <span>Frame: {selectedFrame.functionName}</span>
            )}
            <span className={isDebugging ? 'text-green-600' : 'text-gray-500'}>
              {isDebugging ? '● Debugging' : '○ Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugManager;