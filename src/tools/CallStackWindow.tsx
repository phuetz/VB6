import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Call Stack Types
export enum ProcedureType {
  Sub = 'Sub',
  Function = 'Function',
  Property = 'Property',
  Event = 'Event',
  Constructor = 'Constructor',
  Destructor = 'Destructor'
}

export enum CallType {
  Direct = 'Direct',
  Indirect = 'Indirect',
  Event = 'Event',
  Timer = 'Timer',
  DLL = 'DLL',
  COM = 'COM',
  System = 'System'
}

export enum StackFrameStatus {
  Active = 'Active',
  Current = 'Current',
  Exception = 'Exception',
  System = 'System',
  External = 'External'
}

export interface StackFrame {
  id: string;
  level: number;
  procedureName: string;
  procedureType: ProcedureType;
  moduleName: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  status: StackFrameStatus;
  callType: CallType;
  arguments: Array<{
    name: string;
    value: any;
    type: string;
    byRef: boolean;
  }>;
  localVariables: Array<{
    name: string;
    value: any;
    type: string;
  }>;
  returnValue?: any;
  returnType?: string;
  executionTime?: number;
  callCount?: number;
  sourceCode?: string;
  timestamp: Date;
  threadId?: number;
  isRecursive: boolean;
  recursionDepth?: number;
  hasException: boolean;
  exceptionMessage?: string;
  canNavigate: boolean;
}

export interface CallStackSession {
  id: string;
  threadId: number;
  threadName: string;
  isActive: boolean;
  isPaused: boolean;
  frames: StackFrame[];
  currentFrameIndex: number;
  totalDepth: number;
  lastUpdated: Date;
}

export interface CallStackSettings {
  showArguments: boolean;
  showLocalVariables: boolean;
  showReturnValues: boolean;
  showSourceCode: boolean;
  showExecutionTime: boolean;
  showLineNumbers: boolean;
  showColumnNumbers: boolean;
  maxFramesToShow: number;
  highlightCurrentFrame: boolean;
  autoRefresh: boolean;
  fontSize: number;
  compactView: boolean;
}

interface CallStackWindowProps {
  debugSession?: CallStackSession;
  onNavigateToFrame?: (frame: StackFrame) => void;
  onNavigateToSource?: (fileName: string, lineNumber: number) => void;
  onCopyStackTrace?: (frames: StackFrame[]) => void;
  onSaveStackTrace?: (frames: StackFrame[]) => void;
}

export const CallStackWindow: React.FC<CallStackWindowProps> = ({
  debugSession,
  onNavigateToFrame,
  onNavigateToSource,
  onCopyStackTrace,
  onSaveStackTrace
}) => {
  const [selectedFrame, setSelectedFrame] = useState<StackFrame | null>(null);
  const [expandedFrames, setExpandedFrames] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<CallStackSettings>({
    showArguments: true,
    showLocalVariables: false,
    showReturnValues: true,
    showSourceCode: false,
    showExecutionTime: false,
    showLineNumbers: true,
    showColumnNumbers: false,
    maxFramesToShow: 50,
    highlightCurrentFrame: true,
    autoRefresh: true,
    fontSize: 11,
    compactView: false
  });
  const [searchText, setSearchText] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuFrame, setContextMenuFrame] = useState<StackFrame | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const eventEmitter = useRef(new EventEmitter());

  // Initialize with sample call stack
  useEffect(() => {
    if (!debugSession) return;

    // Simulate current frame selection
    if (debugSession.frames.length > 0) {
      setSelectedFrame(debugSession.frames[debugSession.currentFrameIndex] || debugSession.frames[0]);
    }
  }, [debugSession]);

  // Sample debug session for demonstration
  const sampleDebugSession: CallStackSession = {
    id: 'session1',
    threadId: 1,
    threadName: 'Main Thread',
    isActive: true,
    isPaused: true,
    currentFrameIndex: 0,
    totalDepth: 5,
    lastUpdated: new Date(),
    frames: [
      {
        id: 'frame1',
        level: 0,
        procedureName: 'Button1_Click',
        procedureType: ProcedureType.Event,
        moduleName: 'Form1',
        fileName: 'Form1.frm',
        lineNumber: 45,
        columnNumber: 12,
        status: StackFrameStatus.Current,
        callType: CallType.Event,
        arguments: [],
        localVariables: [
          { name: 'intResult', value: 42, type: 'Integer' },
          { name: 'strMessage', value: 'Hello World', type: 'String' }
        ],
        timestamp: new Date(),
        isRecursive: false,
        hasException: false,
        canNavigate: true
      },
      {
        id: 'frame2',
        level: 1,
        procedureName: 'ProcessData',
        procedureType: ProcedureType.Sub,
        moduleName: 'DataModule',
        fileName: 'DataModule.bas',
        lineNumber: 128,
        columnNumber: 8,
        status: StackFrameStatus.Active,
        callType: CallType.Direct,
        arguments: [
          { name: 'strInput', value: 'test data', type: 'String', byRef: false },
          { name: 'intCount', value: 10, type: 'Integer', byRef: true }
        ],
        localVariables: [
          { name: 'i', value: 5, type: 'Integer' },
          { name: 'arrData', value: ['a', 'b', 'c'], type: 'String()' }
        ],
        executionTime: 156.7,
        timestamp: new Date(Date.now() - 1000),
        isRecursive: false,
        hasException: false,
        canNavigate: true
      },
      {
        id: 'frame3',
        level: 2,
        procedureName: 'CalculateResult',
        procedureType: ProcedureType.Function,
        moduleName: 'MathModule',
        fileName: 'MathModule.bas',
        lineNumber: 67,
        status: StackFrameStatus.Active,
        callType: CallType.Direct,
        arguments: [
          { name: 'dblValue1', value: 15.5, type: 'Double', byRef: false },
          { name: 'dblValue2', value: 23.8, type: 'Double', byRef: false }
        ],
        localVariables: [
          { name: 'dblTemp', value: 39.3, type: 'Double' }
        ],
        returnValue: 39.3,
        returnType: 'Double',
        executionTime: 89.2,
        timestamp: new Date(Date.now() - 2500),
        isRecursive: false,
        hasException: false,
        canNavigate: true
      },
      {
        id: 'frame4',
        level: 3,
        procedureName: 'ValidateInput',
        procedureType: ProcedureType.Function,
        moduleName: 'ValidationModule',
        fileName: 'ValidationModule.bas',
        lineNumber: 34,
        status: StackFrameStatus.Active,
        callType: CallType.Direct,
        arguments: [
          { name: 'varInput', value: 'test', type: 'Variant', byRef: false }
        ],
        localVariables: [
          { name: 'blnValid', value: true, type: 'Boolean' }
        ],
        returnValue: true,
        returnType: 'Boolean',
        executionTime: 12.4,
        timestamp: new Date(Date.now() - 3000),
        isRecursive: false,
        hasException: false,
        canNavigate: true
      },
      {
        id: 'frame5',
        level: 4,
        procedureName: 'RecursiveFunction',
        procedureType: ProcedureType.Function,
        moduleName: 'UtilModule',
        fileName: 'UtilModule.bas',
        lineNumber: 89,
        status: StackFrameStatus.Active,
        callType: CallType.Direct,
        arguments: [
          { name: 'intDepth', value: 3, type: 'Integer', byRef: false }
        ],
        localVariables: [
          { name: 'intResult', value: 6, type: 'Integer' }
        ],
        returnValue: 6,
        returnType: 'Integer',
        executionTime: 45.1,
        timestamp: new Date(Date.now() - 3500),
        isRecursive: true,
        recursionDepth: 3,
        hasException: false,
        canNavigate: true
      }
    ]
  };

  const currentSession = debugSession || sampleDebugSession;

  // Filter frames based on search
  const filteredFrames = useMemo(() => {
    if (!searchText) return currentSession.frames;

    const searchLower = searchText.toLowerCase();
    return currentSession.frames.filter(frame =>
      frame.procedureName.toLowerCase().includes(searchLower) ||
      frame.moduleName.toLowerCase().includes(searchLower) ||
      frame.fileName.toLowerCase().includes(searchLower)
    );
  }, [currentSession.frames, searchText]);

  // Toggle frame expansion
  const toggleFrameExpansion = useCallback((frameId: string) => {
    setExpandedFrames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(frameId)) {
        newSet.delete(frameId);
      } else {
        newSet.add(frameId);
      }
      return newSet;
    });
  }, []);

  // Navigate to specific frame
  const navigateToFrame = useCallback((frame: StackFrame) => {
    setSelectedFrame(frame);
    onNavigateToFrame?.(frame);
  }, [onNavigateToFrame]);

  // Navigate to source code
  const navigateToSource = useCallback((frame: StackFrame) => {
    if (frame.canNavigate) {
      onNavigateToSource?.(frame.fileName, frame.lineNumber);
    }
  }, [onNavigateToSource]);

  // Copy stack trace to clipboard
  const copyStackTrace = useCallback(() => {
    const stackTrace = filteredFrames.map(frame => {
      let line = `${frame.level}: ${frame.procedureName} in ${frame.moduleName}`;
      if (settings.showLineNumbers) {
        line += `:${frame.lineNumber}`;
      }
      if (settings.showArguments && frame.arguments.length > 0) {
        const args = frame.arguments.map(arg => 
          `${arg.name}=${arg.value} (${arg.type}${arg.byRef ? ', ByRef' : ''})`
        ).join(', ');
        line += ` [${args}]`;
      }
      return line;
    }).join('\n');

    navigator.clipboard.writeText(stackTrace);
    onCopyStackTrace?.(filteredFrames);
  }, [filteredFrames, settings, onCopyStackTrace]);

  // Get frame status icon
  const getFrameStatusIcon = (frame: StackFrame): string => {
    if (frame.hasException) return '❌';
    if (frame.status === StackFrameStatus.Current) return '👉';
    if (frame.isRecursive) return '🔄';
    
    switch (frame.callType) {
      case CallType.Event:
        return '⚡';
      case CallType.DLL:
        return '📚';
      case CallType.COM:
        return '🔗';
      case CallType.System:
        return '⚙️';
      default:
        return '📋';
    }
  };

  // Get procedure type icon
  const getProcedureTypeIcon = (type: ProcedureType): string => {
    switch (type) {
      case ProcedureType.Function:
        return '🔧';
      case ProcedureType.Sub:
        return '⚡';
      case ProcedureType.Property:
        return '🏷️';
      case ProcedureType.Event:
        return '⚡';
      case ProcedureType.Constructor:
        return '🏗️';
      case ProcedureType.Destructor:
        return '🗑️';
      default:
        return '📄';
    }
  };

  // Format argument value
  const formatArgValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return '<Nothing>';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `{${type}}`;
    return String(value);
  };

  // Render frame details
  const renderFrameDetails = (frame: StackFrame, isExpanded: boolean): React.ReactNode => {
    if (!isExpanded) return null;

    return (
      <div className="ml-8 mt-2 p-2 bg-gray-50 border-l-2 border-blue-300 text-xs">
        {/* Arguments */}
        {settings.showArguments && frame.arguments.length > 0 && (
          <div className="mb-2">
            <div className="font-medium text-gray-700 mb-1">Arguments:</div>
            {frame.arguments.map((arg, index) => (
              <div key={index} className="ml-2 text-gray-600">
                <span className="font-medium">{arg.name}</span>
                <span className="text-gray-500"> ({arg.type}{arg.byRef ? ', ByRef' : ''})</span>
                <span> = </span>
                <span className="font-mono">{formatArgValue(arg.value, arg.type)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Local Variables */}
        {settings.showLocalVariables && frame.localVariables.length > 0 && (
          <div className="mb-2">
            <div className="font-medium text-gray-700 mb-1">Local Variables:</div>
            {frame.localVariables.map((variable, index) => (
              <div key={index} className="ml-2 text-gray-600">
                <span className="font-medium">{variable.name}</span>
                <span className="text-gray-500"> ({variable.type})</span>
                <span> = </span>
                <span className="font-mono">{formatArgValue(variable.value, variable.type)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Return Value */}
        {settings.showReturnValues && frame.returnValue !== undefined && (
          <div className="mb-2">
            <div className="font-medium text-gray-700 mb-1">Return Value:</div>
            <div className="ml-2 text-gray-600">
              <span className="text-gray-500">({frame.returnType})</span>
              <span> = </span>
              <span className="font-mono">{formatArgValue(frame.returnValue, frame.returnType || '')}</span>
            </div>
          </div>
        )}

        {/* Execution Time */}
        {settings.showExecutionTime && frame.executionTime && (
          <div className="mb-2">
            <div className="font-medium text-gray-700 mb-1">Execution Time:</div>
            <div className="ml-2 text-gray-600">{frame.executionTime.toFixed(2)} ms</div>
          </div>
        )}

        {/* Recursion Info */}
        {frame.isRecursive && (
          <div className="mb-2">
            <div className="font-medium text-orange-700 mb-1">Recursive Call:</div>
            <div className="ml-2 text-orange-600">Depth: {frame.recursionDepth}</div>
          </div>
        )}

        {/* Exception Info */}
        {frame.hasException && (
          <div className="mb-2">
            <div className="font-medium text-red-700 mb-1">Exception:</div>
            <div className="ml-2 text-red-600">{frame.exceptionMessage}</div>
          </div>
        )}

        {/* Source Code Preview */}
        {settings.showSourceCode && frame.sourceCode && (
          <div className="mb-2">
            <div className="font-medium text-gray-700 mb-1">Source:</div>
            <div className="ml-2 bg-white p-2 border rounded font-mono text-xs">
              {frame.sourceCode}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render single frame
  const renderFrame = (frame: StackFrame, index: number): React.ReactNode => {
    const isSelected = selectedFrame?.id === frame.id;
    const isExpanded = expandedFrames.has(frame.id);
    const isCurrent = frame.status === StackFrameStatus.Current;

    return (
      <div key={frame.id} className="border-b border-gray-100">
        <div
          className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer ${
            isSelected ? 'bg-blue-100' : ''
          } ${isCurrent && settings.highlightCurrentFrame ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''} ${
            frame.hasException ? 'bg-red-50' : ''
          }`}
          style={{ fontSize: `${settings.fontSize}px` }}
          onClick={() => navigateToFrame(frame)}
          onDoubleClick={() => navigateToSource(frame)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuFrame(frame);
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
          }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFrameExpansion(frame.id);
            }}
            className="w-4 text-center text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? '▼' : '▶'}
          </button>

          {/* Frame Level */}
          <div className="w-8 text-center text-xs text-gray-500 font-mono">
            {frame.level}
          </div>

          {/* Status Icon */}
          <span className="w-6 text-center">{getFrameStatusIcon(frame)}</span>

          {/* Procedure Type Icon */}
          <span className="w-6 text-center">{getProcedureTypeIcon(frame.procedureType)}</span>

          {/* Procedure Name */}
          <div className="w-40 font-mono font-medium text-gray-800 truncate">
            {frame.procedureName}
            {frame.isRecursive && (
              <span className="text-orange-600 ml-1" title={`Recursive (depth: ${frame.recursionDepth})`}>
                ↻
              </span>
            )}
          </div>

          {/* Module Name */}
          <div className="w-32 text-sm text-gray-600 truncate">
            {frame.moduleName}
          </div>

          {/* Location */}
          <div className="w-32 text-xs text-gray-500 font-mono">
            {settings.showLineNumbers && (
              <>
                {frame.fileName}:{frame.lineNumber}
                {settings.showColumnNumbers && frame.columnNumber && `:${frame.columnNumber}`}
              </>
            )}
          </div>

          {/* Arguments Summary */}
          {settings.showArguments && !settings.compactView && (
            <div className="flex-1 text-xs text-gray-600 truncate">
              {frame.arguments.length > 0 ? (
                <span>
                  ({frame.arguments.map(arg => 
                    `${arg.name}=${formatArgValue(arg.value, arg.type)}`
                  ).join(', ')})
                </span>
              ) : (
                <span className="text-gray-400">No arguments</span>
              )}
            </div>
          )}

          {/* Execution Time */}
          {settings.showExecutionTime && frame.executionTime && (
            <div className="w-16 text-xs text-gray-500 text-right">
              {frame.executionTime.toFixed(1)}ms
            </div>
          )}

          {/* Navigation indicator */}
          {frame.canNavigate && (
            <span className="w-4 text-center text-blue-600" title="Double-click to navigate">
              🔍
            </span>
          )}
        </div>

        {/* Expanded Details */}
        {renderFrameDetails(frame, isExpanded)}
      </div>
    );
  };

  // Context menu items
  const contextMenuItems = [
    {
      label: 'Navigate to Frame',
      action: () => contextMenuFrame && navigateToFrame(contextMenuFrame)
    },
    {
      label: 'Go to Source',
      enabled: contextMenuFrame?.canNavigate || false,
      action: () => contextMenuFrame && navigateToSource(contextMenuFrame)
    },
    {
      label: 'Copy Frame Info',
      action: () => {
        if (!contextMenuFrame) return;
        const info = `${contextMenuFrame.procedureName} in ${contextMenuFrame.moduleName}:${contextMenuFrame.lineNumber}`;
        navigator.clipboard.writeText(info);
      }
    },
    {
      label: 'Expand All',
      action: () => {
        const allFrameIds = new Set(filteredFrames.map(f => f.id));
        setExpandedFrames(allFrameIds);
      }
    },
    {
      label: 'Collapse All',
      action: () => setExpandedFrames(new Set())
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Call Stack</h3>
          {currentSession.isActive && (
            <span className={`px-2 py-1 text-xs rounded ${
              currentSession.isPaused 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {currentSession.isPaused ? 'Paused' : 'Running'}
            </span>
          )}
          <span className="text-xs text-gray-500">
            Thread: {currentSession.threadName} ({currentSession.threadId})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded w-20"
          />
          
          <button
            onClick={copyStackTrace}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Copy Stack Trace"
          >
            📋
          </button>
          
          <button
            onClick={() => onSaveStackTrace?.(filteredFrames)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Save Stack Trace"
          >
            💾
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showArguments}
                onChange={(e) => setSettings(prev => ({ ...prev, showArguments: e.target.checked }))}
              />
              Show Arguments
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showLocalVariables}
                onChange={(e) => setSettings(prev => ({ ...prev, showLocalVariables: e.target.checked }))}
              />
              Local Variables
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showReturnValues}
                onChange={(e) => setSettings(prev => ({ ...prev, showReturnValues: e.target.checked }))}
              />
              Return Values
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showExecutionTime}
                onChange={(e) => setSettings(prev => ({ ...prev, showExecutionTime: e.target.checked }))}
              />
              Execution Time
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.compactView}
                onChange={(e) => setSettings(prev => ({ ...prev, compactView: e.target.checked }))}
              />
              Compact View
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.highlightCurrentFrame}
                onChange={(e) => setSettings(prev => ({ ...prev, highlightCurrentFrame: e.target.checked }))}
              />
              Highlight Current
            </label>
          </div>
        </div>
      )}

      {/* Column Headers */}
      <div 
        className="flex items-center py-2 px-2 bg-gray-200 border-b border-gray-300 text-xs font-medium text-gray-700"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <div className="w-4"></div>
        <div className="w-8">Level</div>
        <div className="w-6"></div>
        <div className="w-6"></div>
        <div className="w-40">Procedure</div>
        <div className="w-32">Module</div>
        <div className="w-32">Location</div>
        {settings.showArguments && !settings.compactView && <div className="flex-1">Arguments</div>}
        {settings.showExecutionTime && <div className="w-16">Time</div>}
        <div className="w-4"></div>
      </div>

      {/* Frames List */}
      <div className="flex-1 overflow-y-auto">
        {currentSession.isActive ? (
          filteredFrames.length > 0 ? (
            filteredFrames.slice(0, settings.maxFramesToShow).map((frame, index) => 
              renderFrame(frame, index)
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <p>No matching stack frames</p>
                {searchText && <p className="text-sm mt-1">Try adjusting your search</p>}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg">No active debug session</p>
              <p className="text-sm mt-2">Start debugging to view call stack</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg z-50 py-1"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y
          }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          {contextMenuItems.map((item, index) => (
            <button
              key={index}
              className={`block w-full text-left px-3 py-1 text-sm ${
                item.enabled !== false ? 'hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={item.enabled === false}
              onClick={() => {
                if (item.enabled !== false) {
                  item.action();
                }
                setShowContextMenu(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Frames: {filteredFrames.length}/{currentSession.totalDepth}</span>
          <span>Recursive: {filteredFrames.filter(f => f.isRecursive).length}</span>
          <span>Exceptions: {filteredFrames.filter(f => f.hasException).length}</span>
          {selectedFrame && (
            <span>
              Selected: {selectedFrame.procedureName} (Level {selectedFrame.level})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Updated: {currentSession.lastUpdated.toLocaleTimeString()}</span>
          {currentSession.isActive && (
            <span className="text-green-600">Active Session</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallStackWindow;