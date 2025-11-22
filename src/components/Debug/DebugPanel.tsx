import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Square, SkipForward, ArrowDown, ArrowRight, 
  Bug, Eye, EyeOff, Trash2, Plus, Settings, Info, 
  ChevronRight, ChevronDown, Circle, AlertTriangle,
  Clock, Zap, Target, List, Code, Terminal, X
} from 'lucide-react';
import { 
  vb6Debugger, 
  Breakpoint, 
  WatchExpression, 
  CallStackFrame, 
  Variable,
  VariableScope,
  StepType 
} from '../../services/VB6DebuggerService';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
  currentFile?: string;
  onNavigateToLine?: (file: string, line: number) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  visible,
  onClose,
  currentFile,
  onNavigateToLine
}) => {
  const [activeTab, setActiveTab] = useState<'breakpoints' | 'watch' | 'callstack' | 'variables' | 'output'>('breakpoints');
  const [debuggerState, setDebuggerState] = useState(vb6Debugger.getState());
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [watchExpressions, setWatchExpressions] = useState<WatchExpression[]>([]);
  const [callStack, setCallStack] = useState<CallStackFrame[]>([]);
  const [variables, setVariables] = useState<VariableScope>({ locals: [], globals: [], module: [] });
  const [outputLines, setOutputLines] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [newWatchExpression, setNewWatchExpression] = useState('');
  const [executionStats, setExecutionStats] = useState<any>({});

  // Subscribe to debugger events
  useEffect(() => {
    if (!visible) return;

    const handleDebugEvent = (event: any) => {
      setDebuggerState(vb6Debugger.getState());
      setBreakpoints(vb6Debugger.getBreakpoints());
      setCallStack(vb6Debugger.getCallStack());
      setVariables(vb6Debugger.getVariables());
      setExecutionStats(vb6Debugger.getExecutionStats());
    };

    const handleBreakpointEvent = (event: any) => {
      setBreakpoints(vb6Debugger.getBreakpoints());
    };

    const handleWatchEvent = (event: any) => {
      setWatchExpressions([...debuggerState.watchExpressions]);
    };

    const handleOutputEvent = (event: any) => {
      setOutputLines(prev => [...prev, event.data]);
    };

    vb6Debugger.on('debug', handleDebugEvent);
    vb6Debugger.on('breakpoint', handleBreakpointEvent);
    vb6Debugger.on('watch', handleWatchEvent);
    vb6Debugger.on('output', handleOutputEvent);

    // Initial data load
    handleDebugEvent(null);

    return () => {
      vb6Debugger.off('debug', handleDebugEvent);
      vb6Debugger.off('breakpoint', handleBreakpointEvent);
      vb6Debugger.off('watch', handleWatchEvent);
      vb6Debugger.off('output', handleOutputEvent);
    };
  }, [visible, debuggerState.watchExpressions]);

  // Debug controls
  const handleStart = useCallback(async () => {
    if (currentFile) {
      // Get code from editor and start debugging
      // This would integrate with the Monaco editor
      const code = ''; // Get from editor
      await vb6Debugger.start(code, currentFile);
    }
  }, [currentFile]);

  const handlePause = useCallback(() => {
    vb6Debugger.pause();
  }, []);

  const handleResume = useCallback(() => {
    vb6Debugger.resume();
  }, []);

  const handleStop = useCallback(() => {
    vb6Debugger.stop();
    setOutputLines([]);
  }, []);

  const handleStep = useCallback((type: StepType) => {
    vb6Debugger.step(type);
  }, []);

  // Breakpoint management
  const handleAddBreakpoint = useCallback(() => {
    if (currentFile) {
      const line = 1; // Get current line from editor
      vb6Debugger.addBreakpoint(currentFile, line);
    }
  }, [currentFile]);

  const handleToggleBreakpoint = useCallback((id: string) => {
    vb6Debugger.toggleBreakpoint(id);
  }, []);

  const handleRemoveBreakpoint = useCallback((id: string) => {
    vb6Debugger.removeBreakpoint(id);
  }, []);

  const handleNavigateToBreakpoint = useCallback((breakpoint: Breakpoint) => {
    onNavigateToLine?.(breakpoint.file, breakpoint.line);
  }, [onNavigateToLine]);

  // Watch expression management
  const handleAddWatch = useCallback(() => {
    if (newWatchExpression.trim()) {
      vb6Debugger.addWatch(newWatchExpression.trim());
      setNewWatchExpression('');
    }
  }, [newWatchExpression]);

  const handleRemoveWatch = useCallback((id: string) => {
    vb6Debugger.removeWatch(id);
  }, []);

  // Call stack navigation
  const handleSelectFrame = useCallback((frameId: string) => {
    vb6Debugger.selectStackFrame(frameId);
    const frame = callStack.find(f => f.id === frameId);
    if (frame) {
      onNavigateToLine?.(frame.file, frame.line);
    }
  }, [callStack, onNavigateToLine]);

  // Variable expansion
  const toggleExpanded = useCallback((id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  }, [expandedItems]);

  // Render components
  const renderDebugControls = () => (
    <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-1">
        {debuggerState.status === 'idle' && (
          <button
            onClick={handleStart}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            title="Start Debugging (F5)"
          >
            <Play size={14} />
            Start
          </button>
        )}
        
        {debuggerState.status === 'running' && (
          <button
            onClick={handlePause}
            className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            title="Pause"
          >
            <Pause size={14} />
            Pause
          </button>
        )}
        
        {debuggerState.status === 'paused' && (
          <button
            onClick={handleResume}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            title="Continue (F5)"
          >
            <Play size={14} />
            Continue
          </button>
        )}
        
        <button
          onClick={handleStop}
          disabled={debuggerState.status === 'idle'}
          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
          title="Stop Debugging"
        >
          <Square size={14} />
          Stop
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => handleStep(StepType.Into)}
          disabled={debuggerState.status !== 'paused'}
          className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
          title="Step Into (F8)"
        >
          <ArrowDown size={16} />
        </button>
        <button
          onClick={() => handleStep(StepType.Over)}
          disabled={debuggerState.status !== 'paused'}
          className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
          title="Step Over (Shift+F8)"
        >
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => handleStep(StepType.Out)}
          disabled={debuggerState.status !== 'paused'}
          className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
          title="Step Out (Ctrl+Shift+F8)"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            debuggerState.status === 'running' ? 'bg-green-500' : 
            debuggerState.status === 'paused' ? 'bg-orange-500' : 
            'bg-gray-400'
          }`} />
          <span className="capitalize">{debuggerState.status}</span>
        </div>
        
        {executionStats.elapsedTime > 0 && (
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{(executionStats.elapsedTime / 1000).toFixed(1)}s</span>
          </div>
        )}
        
        {executionStats.statementCount > 0 && (
          <div className="flex items-center gap-1">
            <Zap size={12} />
            <span>{executionStats.statementCount} stmts</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderBreakpoints = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={handleAddBreakpoint}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <Plus size={14} />
          Add Breakpoint
        </button>
      </div>
      
      <div className="space-y-1 p-2">
        {breakpoints.map(bp => (
          <div
            key={bp.id}
            className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
              !bp.enabled ? 'opacity-50' : ''
            }`}
            onClick={() => handleNavigateToBreakpoint(bp)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBreakpoint(bp.id);
              }}
              className="flex-shrink-0"
            >
              <Circle
                size={12}
                className={`${bp.enabled ? 'text-red-500 fill-current' : 'text-gray-400'}`}
              />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {bp.file}:{bp.line}
              </div>
              {bp.condition && (
                <div className="text-xs text-gray-500 truncate">
                  Condition: {bp.condition}
                </div>
              )}
              {bp.hitCount !== undefined && bp.hitCount > 0 && (
                <div className="text-xs text-blue-600">
                  Hit {bp.hitCount} time{bp.hitCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveBreakpoint(bp.id);
              }}
              className="p-1 hover:bg-gray-200 rounded text-gray-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        
        {breakpoints.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Target size={24} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">No breakpoints set</div>
            <div className="text-xs text-gray-400 mt-1">
              Click in the editor gutter or use Add Breakpoint
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderWatchExpressions = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Expression to watch..."
            value={newWatchExpression}
            onChange={(e) => setNewWatchExpression(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddWatch()}
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddWatch}
            disabled={!newWatchExpression.trim()}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
      
      <div className="space-y-1 p-2">
        {watchExpressions.map(watch => (
          <div key={watch.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{watch.expression}</div>
              {watch.error ? (
                <div className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {watch.error}
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  <span className="text-blue-600">{watch.type}</span>: {String(watch.value)}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleRemoveWatch(watch.id)}
              className="p-1 hover:bg-gray-200 rounded text-gray-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        
        {watchExpressions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Eye size={24} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">No watch expressions</div>
            <div className="text-xs text-gray-400 mt-1">
              Add expressions to monitor their values
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCallStack = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1 p-2">
        {callStack.map((frame, index) => (
          <div
            key={frame.id}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
              debuggerState.currentFrame === frame.id ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            onClick={() => handleSelectFrame(frame.id)}
          >
            <div className="flex-shrink-0 text-xs text-gray-500 w-6 text-center">
              {index}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {frame.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {frame.file}:{frame.line}
              </div>
            </div>
            
            {!frame.isUserCode && (
              <div className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                System
              </div>
            )}
          </div>
        ))}
        
        {callStack.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <List size={24} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">No call stack</div>
            <div className="text-xs text-gray-400 mt-1">
              Call stack appears when debugging
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVariable = (variable: Variable, depth: number = 0) => {
    const hasChildren = variable.expandable && variable.children;
    const isExpanded = expandedItems.has(variable.name);
    
    return (
      <div key={variable.name} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-1 p-1 hover:bg-gray-50 rounded text-sm">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(variable.name)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <span className="font-medium text-blue-700">{variable.name}</span>
          <span className="text-gray-500 text-xs">({variable.type})</span>
          <span className="text-gray-700 flex-1 truncate ml-2">{variable.value}</span>
          
          {!variable.writable && (
            <EyeOff size={12} className="text-gray-400" title="Read-only" />
          )}
        </div>
        
        {hasChildren && isExpanded && variable.children && (
          <div>
            {variable.children.map(child => renderVariable(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderVariables = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-700 p-2 bg-gray-50 border-b">
        LOCALS
      </div>
      <div className="p-2">
        {variables.locals.map(variable => renderVariable(variable))}
        {variables.locals.length === 0 && (
          <div className="text-xs text-gray-500 py-2">No local variables</div>
        )}
      </div>
      
      <div className="text-xs font-semibold text-gray-700 p-2 bg-gray-50 border-b">
        GLOBALS
      </div>
      <div className="p-2">
        {variables.globals.map(variable => renderVariable(variable))}
        {variables.globals.length === 0 && (
          <div className="text-xs text-gray-500 py-2">No global variables</div>
        )}
      </div>
    </div>
  );

  const renderOutput = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 space-y-1">
        {outputLines.map((line, index) => (
          <div key={index} className="text-sm font-mono">
            <span className="text-gray-500 text-xs">
              [{line.timestamp?.toLocaleTimeString()}]
            </span>
            <span className={`ml-2 ${
              line.type === 'error' ? 'text-red-600' :
              line.type === 'warning' ? 'text-orange-600' :
              line.type === 'logpoint' ? 'text-blue-600' :
              'text-gray-800'
            }`}>
              {line.message}
            </span>
            {line.location && (
              <span className="text-gray-400 text-xs ml-2">
                at {line.location}
              </span>
            )}
          </div>
        ))}
        
        {outputLines.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Terminal size={24} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">No output</div>
            <div className="text-xs text-gray-400 mt-1">
              Debug output will appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[1000px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug className="text-green-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              VB6 Debugger
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Debug Controls */}
        {renderDebugControls()}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'breakpoints', label: 'Breakpoints', icon: Target },
            { id: 'watch', label: 'Watch', icon: Eye },
            { id: 'callstack', label: 'Call Stack', icon: List },
            { id: 'variables', label: 'Variables', icon: Code },
            { id: 'output', label: 'Output', icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'breakpoints' && renderBreakpoints()}
          {activeTab === 'watch' && renderWatchExpressions()}
          {activeTab === 'callstack' && renderCallStack()}
          {activeTab === 'variables' && renderVariables()}
          {activeTab === 'output' && renderOutput()}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;