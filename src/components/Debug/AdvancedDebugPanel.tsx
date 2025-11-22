/**
 * Advanced Debug Panel Component
 * 
 * Enhanced debugging interface with conditional breakpoints, tracepoints, and more
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { 
  VB6AdvancedDebugger, 
  Breakpoint, 
  DebugVariable, 
  DebugConsoleMessage,
  createAdvancedDebugger 
} from '../../services/VB6AdvancedDebugger';
import { DebugState } from '../../types/extended';

interface AdvancedDebugPanelProps {
  className?: string;
}

export const AdvancedDebugPanel: React.FC<AdvancedDebugPanelProps> = ({ className = '' }) => {
  const { debugState, setDebugState } = useVB6Store();
  const [activeTab, setActiveTab] = useState<'breakpoints' | 'watch' | 'callstack' | 'console' | 'profiler'>('breakpoints');
  const [showBreakpointDialog, setShowBreakpointDialog] = useState(false);
  const [editingBreakpoint, setEditingBreakpoint] = useState<Partial<Breakpoint> | null>(null);
  const [consoleFilter, setConsoleFilter] = useState<DebugConsoleMessage['type'] | 'all'>('all');
  const [profileData, setProfileData] = useState<any>(null);
  
  // Create debugger instance
  const debuggerInstance = useMemo(() => {
    return createAdvancedDebugger(
      (state: DebugState) => setDebugState(state),
      {
        enableSourceMaps: true,
        enableExceptionBreaking: true,
        enableJustMyCode: true,
        maxCallStackDepth: 1000,
        evaluationTimeout: 5000
      }
    );
  }, [setDebugState]);

  // Filter console messages
  const filteredConsoleMessages = useMemo(() => {
    const messages = (debugState as any).console || [];
    if (consoleFilter === 'all') return messages;
    return messages.filter((msg: DebugConsoleMessage) => msg.type === consoleFilter);
  }, [debugState, consoleFilter]);

  // Handle conditional breakpoint
  const handleAddConditionalBreakpoint = useCallback(() => {
    setEditingBreakpoint({
      file: '',
      line: 1,
      condition: '',
      type: 'conditional'
    });
    setShowBreakpointDialog(true);
  }, []);

  // Handle tracepoint
  const handleAddTracepoint = useCallback(() => {
    setEditingBreakpoint({
      file: '',
      line: 1,
      logMessage: 'Line {currentLine}: {variableName}',
      type: 'tracepoint'
    });
    setShowBreakpointDialog(true);
  }, []);

  // Save breakpoint
  const handleSaveBreakpoint = useCallback(() => {
    if (!editingBreakpoint) return;
    
    const { file, line, type, condition, logMessage, hitCount } = editingBreakpoint;
    
    if (!file || !line) return;
    
    if (type === 'conditional' && condition) {
      debuggerInstance.setConditionalBreakpoint(file, line, condition, hitCount);
    } else if (type === 'tracepoint' && logMessage) {
      debuggerInstance.setTracepoint(file, line, logMessage, condition);
    } else {
      debuggerInstance.setBreakpoint(file, line);
    }
    
    setShowBreakpointDialog(false);
    setEditingBreakpoint(null);
  }, [editingBreakpoint, debuggerInstance]);

  // Start profiling
  const handleStartProfiling = useCallback(() => {
    debuggerInstance.startProfiling();
    setProfileData(null);
  }, [debuggerInstance]);

  // Stop profiling
  const handleStopProfiling = useCallback(() => {
    const data = debuggerInstance.stopProfiling();
    setProfileData(data);
  }, [debuggerInstance]);

  // Take snapshot
  const handleTakeSnapshot = useCallback(() => {
    const description = prompt('Enter snapshot description:');
    if (description) {
      debuggerInstance.takeSnapshot(description);
    }
  }, [debuggerInstance]);

  return (
    <div className={`advanced-debug-panel ${className}`}>
      {/* Debug Controls */}
      <div className="debug-controls bg-gray-100 p-2 border-b flex items-center gap-2">
        <button
          onClick={() => debuggerInstance.run()}
          disabled={debugState.mode === 'run'}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          title="Run (F5)"
        >
          ▶ Run
        </button>
        
        <button
          onClick={() => debuggerInstance.pause()}
          disabled={debugState.mode !== 'run'}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          title="Pause"
        >
          ⏸ Pause
        </button>
        
        <button
          onClick={() => debuggerInstance.stop()}
          disabled={debugState.mode === 'design'}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          title="Stop (Shift+F5)"
        >
          ⏹ Stop
        </button>
        
        <div className="border-l mx-2 h-6" />
        
        <button
          onClick={() => debuggerInstance.step()}
          disabled={debugState.mode !== 'break'}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          title="Step Into (F11)"
        >
          ↓ Step Into
        </button>
        
        <button
          onClick={() => debuggerInstance.stepOver()}
          disabled={debugState.mode !== 'break'}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          title="Step Over (F10)"
        >
          → Step Over
        </button>
        
        <button
          onClick={() => debuggerInstance.stepOut()}
          disabled={debugState.mode !== 'break'}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          title="Step Out (Shift+F11)"
        >
          ↑ Step Out
        </button>
        
        <div className="border-l mx-2 h-6" />
        
        <button
          onClick={handleTakeSnapshot}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          title="Take Snapshot"
        >
          📸 Snapshot
        </button>
      </div>

      {/* Tabs */}
      <div className="debug-tabs flex border-b bg-gray-50">
        <button
          onClick={() => setActiveTab('breakpoints')}
          className={`px-4 py-2 ${activeTab === 'breakpoints' ? 'bg-white border-b-2 border-blue-500' : ''}`}
        >
          Breakpoints
        </button>
        <button
          onClick={() => setActiveTab('watch')}
          className={`px-4 py-2 ${activeTab === 'watch' ? 'bg-white border-b-2 border-blue-500' : ''}`}
        >
          Watch
        </button>
        <button
          onClick={() => setActiveTab('callstack')}
          className={`px-4 py-2 ${activeTab === 'callstack' ? 'bg-white border-b-2 border-blue-500' : ''}`}
        >
          Call Stack
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 ${activeTab === 'console' ? 'bg-white border-b-2 border-blue-500' : ''}`}
        >
          Console
        </button>
        <button
          onClick={() => setActiveTab('profiler')}
          className={`px-4 py-2 ${activeTab === 'profiler' ? 'bg-white border-b-2 border-blue-500' : ''}`}
        >
          Profiler
        </button>
      </div>

      {/* Tab Content */}
      <div className="debug-content p-2 overflow-auto" style={{ height: '300px' }}>
        {/* Breakpoints Tab */}
        {activeTab === 'breakpoints' && (
          <div className="breakpoints-panel">
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => debuggerInstance.setBreakpoint('Form1.vb', 10)}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Breakpoint
              </button>
              <button
                onClick={handleAddConditionalBreakpoint}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Conditional
              </button>
              <button
                onClick={handleAddTracepoint}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Tracepoint
              </button>
              <button
                onClick={() => debuggerInstance.setDataBreakpoint('myVariable', 'write')}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Data Breakpoint
              </button>
            </div>
            
            <div className="breakpoint-list">
              {Array.from(debugState.breakpoints).map((bp, index) => {
                const [file, line] = bp.split(':');
                return (
                  <div key={index} className="flex items-center gap-2 py-1 hover:bg-gray-100">
                    <input type="checkbox" checked={true} readOnly />
                    <span className="text-red-600">●</span>
                    <span className="flex-1">{file}:{line}</span>
                    <button
                      onClick={() => debuggerInstance.removeBreakpoint(file, parseInt(line))}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              
              {/* Show conditional breakpoints */}
              {(debugState as any).conditionalBreakpoints?.map((bp: Breakpoint) => (
                <div key={bp.id} className="flex items-center gap-2 py-1 hover:bg-gray-100">
                  <input type="checkbox" checked={bp.enabled} readOnly />
                  <span className="text-orange-600">●</span>
                  <span className="flex-1">
                    {bp.file}:{bp.line}
                    {bp.condition && <span className="text-gray-500 text-xs ml-2">[{bp.condition}]</span>}
                  </span>
                  <button
                    onClick={() => debuggerInstance.removeBreakpoint(bp.file, bp.line)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Show tracepoints */}
              {(debugState as any).tracepoints?.map((tp: Breakpoint) => (
                <div key={tp.id} className="flex items-center gap-2 py-1 hover:bg-gray-100">
                  <input type="checkbox" checked={tp.enabled} readOnly />
                  <span className="text-purple-600">◆</span>
                  <span className="flex-1">
                    {tp.file}:{tp.line}
                    <span className="text-gray-500 text-xs ml-2">"{tp.logMessage}"</span>
                  </span>
                  <button
                    onClick={() => debuggerInstance.removeBreakpoint(tp.file, tp.line)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch Tab */}
        {activeTab === 'watch' && (
          <div className="watch-panel">
            <div className="mb-2">
              <button
                onClick={() => {
                  const expr = prompt('Enter watch expression:');
                  if (expr) debuggerInstance.addWatch(expr);
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              >
                + Add Watch
              </button>
            </div>
            
            <div className="watch-list">
              {debugState.watchExpressions.map((watch, index) => (
                <div key={index} className="flex items-center gap-2 py-1 hover:bg-gray-100 font-mono text-sm">
                  <span className="flex-1">{watch.expression}</span>
                  <span className="text-gray-600">=</span>
                  <span className={watch.error ? 'text-red-500' : 'text-green-600'}>
                    {watch.error || watch.value}
                  </span>
                  <span className="text-gray-500">({watch.type})</span>
                  <button
                    onClick={() => debuggerInstance.removeWatch(watch.expression)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call Stack Tab */}
        {activeTab === 'callstack' && (
          <div className="callstack-panel">
            {debugState.callStack.length === 0 ? (
              <div className="text-gray-500 italic">No call stack available</div>
            ) : (
              <div className="callstack-list">
                {debugState.callStack.map((frame, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 py-1 hover:bg-gray-100 cursor-pointer ${
                      index === 0 ? 'font-bold' : ''
                    }`}
                  >
                    <span className="text-blue-500">→</span>
                    <span className="flex-1">
                      {frame.procedure} at {frame.module}:{frame.line}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Console Tab */}
        {activeTab === 'console' && (
          <div className="console-panel">
            <div className="mb-2 flex gap-2">
              <select
                value={consoleFilter}
                onChange={(e) => setConsoleFilter(e.target.value as any)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="all">All Messages</option>
                <option value="output">Output</option>
                <option value="error">Errors</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <button
                onClick={() => debuggerInstance.logConsole('info', 'Console cleared', 'User')}
                className="px-2 py-1 bg-gray-500 text-white rounded text-sm"
              >
                Clear
              </button>
            </div>
            
            <div className="console-messages font-mono text-sm">
              {filteredConsoleMessages.map((msg: DebugConsoleMessage, index: number) => (
                <div
                  key={index}
                  className={`py-1 ${
                    msg.type === 'error' ? 'text-red-600' :
                    msg.type === 'warning' ? 'text-yellow-600' :
                    msg.type === 'info' ? 'text-blue-600' :
                    msg.type === 'debug' ? 'text-gray-600' :
                    'text-black'
                  }`}
                >
                  <span className="text-gray-500">
                    [{new Date(msg.timestamp).toLocaleTimeString()}]
                  </span>
                  {msg.source && <span className="text-gray-600"> [{msg.source}]</span>}
                  <span> {msg.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profiler Tab */}
        {activeTab === 'profiler' && (
          <div className="profiler-panel">
            <div className="mb-2 flex gap-2">
              <button
                onClick={handleStartProfiling}
                className="px-2 py-1 bg-green-500 text-white rounded text-sm"
              >
                Start Profiling
              </button>
              <button
                onClick={handleStopProfiling}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Stop Profiling
              </button>
            </div>
            
            {profileData && (
              <div className="profile-results">
                <h4 className="font-bold mb-2">Profile Results</h4>
                <div className="mb-4">
                  <div>Total Time: {profileData.totalTime}ms</div>
                </div>
                
                <h5 className="font-semibold mb-1">Function Calls</h5>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left">Function</th>
                      <th className="text-right">Calls</th>
                      <th className="text-right">Total Time</th>
                      <th className="text-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.functionCalls.slice(0, 10).map((func: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td>{func.name}</td>
                        <td className="text-right">{func.calls}</td>
                        <td className="text-right">{func.duration}ms</td>
                        <td className="text-right">{func.averageTime.toFixed(2)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {profileData.hotspots && profileData.hotspots.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold mb-1">Hotspots</h5>
                    {profileData.hotspots.map((hotspot: any, index: number) => (
                      <div key={index} className="text-sm">
                        {hotspot.location}: {hotspot.executionCount} executions ({hotspot.percentageOfTotal.toFixed(1)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Breakpoint Dialog */}
      {showBreakpointDialog && editingBreakpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-96">
            <h3 className="text-lg font-bold mb-4">
              {editingBreakpoint.type === 'conditional' ? 'Conditional Breakpoint' :
               editingBreakpoint.type === 'tracepoint' ? 'Tracepoint' : 'Breakpoint'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">File</label>
              <input
                type="text"
                value={editingBreakpoint.file || ''}
                onChange={(e) => setEditingBreakpoint({ ...editingBreakpoint, file: e.target.value })}
                className="w-full px-2 py-1 border rounded"
                placeholder="Form1.vb"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Line</label>
              <input
                type="number"
                value={editingBreakpoint.line || 1}
                onChange={(e) => setEditingBreakpoint({ ...editingBreakpoint, line: parseInt(e.target.value) })}
                className="w-full px-2 py-1 border rounded"
                min="1"
              />
            </div>
            
            {editingBreakpoint.type === 'conditional' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <input
                    type="text"
                    value={editingBreakpoint.condition || ''}
                    onChange={(e) => setEditingBreakpoint({ ...editingBreakpoint, condition: e.target.value })}
                    className="w-full px-2 py-1 border rounded font-mono text-sm"
                    placeholder="i > 10 And x < 100"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Hit Count (optional)</label>
                  <input
                    type="number"
                    value={editingBreakpoint.hitCount || ''}
                    onChange={(e) => setEditingBreakpoint({ ...editingBreakpoint, hitCount: parseInt(e.target.value) || undefined })}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Break when hit count >= this value"
                    min="1"
                  />
                </div>
              </>
            )}
            
            {editingBreakpoint.type === 'tracepoint' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Log Message</label>
                  <textarea
                    value={editingBreakpoint.logMessage || ''}
                    onChange={(e) => setEditingBreakpoint({ ...editingBreakpoint, logMessage: e.target.value })}
                    className="w-full px-2 py-1 border rounded font-mono text-sm"
                    placeholder="Line {currentLine}: Variable x = {x}, y = {y}"
                    rows={3}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Use {'{expression}'} to log values
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Condition (optional)</label>
                  <input
                    type="text"
                    value={editingBreakpoint.condition || ''}
                    onChange={(e) => setEditingBreakpoint({ ...editingBreakpoint, condition: e.target.value })}
                    className="w-full px-2 py-1 border rounded font-mono text-sm"
                    placeholder="Only log when condition is true"
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowBreakpointDialog(false);
                  setEditingBreakpoint(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBreakpoint}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDebugPanel;