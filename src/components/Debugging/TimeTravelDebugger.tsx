/**
 * Time-Travel Debugger
 * Revolutionary debugging with state snapshots and time manipulation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVB6Store } from '../../stores/vb6Store';
import { eventSystem } from '../../services/VB6EventSystem';

interface ExecutionSnapshot {
  id: string;
  timestamp: number;
  line: number;
  column: number;
  file: string;
  variables: Map<string, any>;
  callStack: CallFrame[];
  controls: any[];
  formState: any;
  console: string[];
  event?: string;
  description?: string;
}

interface CallFrame {
  function: string;
  file: string;
  line: number;
  arguments: any[];
  locals: Map<string, any>;
}

interface WatchExpression {
  id: string;
  expression: string;
  value: any;
  error?: string;
}

interface DebuggerState {
  isRunning: boolean;
  isPaused: boolean;
  isRecording: boolean;
  currentSnapshot: number;
  snapshots: ExecutionSnapshot[];
  breakpoints: Set<string>;
  watchExpressions: WatchExpression[];
  executionSpeed: number;
  maxSnapshots: number;
}

export const TimeTravelDebugger: React.FC = () => {
  const [state, setState] = useState<DebuggerState>({
    isRunning: false,
    isPaused: false,
    isRecording: false,
    currentSnapshot: -1,
    snapshots: [],
    breakpoints: new Set(),
    watchExpressions: [],
    executionSpeed: 1,
    maxSnapshots: 1000,
  });

  const [showDebugger, setShowDebugger] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ExecutionSnapshot | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<ExecutionSnapshot | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showVariables, setShowVariables] = useState(true);
  const [showCallStack, setShowCallStack] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'breakpoints' | 'events' | 'errors'>('all');
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const { currentCode, controls, formProperties } = useVB6Store();

  // Create execution snapshot
  const createSnapshot = (line: number, event?: string): ExecutionSnapshot => {
    const snapshot: ExecutionSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      line,
      column: 0,
      file: 'Form1.frm',
      variables: new Map([
        ['i', Math.floor(Math.random() * 100)],
        ['total', Math.floor(Math.random() * 1000)],
        ['userName', 'John Doe'],
        ['isActive', Math.random() > 0.5],
      ]),
      callStack: [
        {
          function: 'Command1_Click',
          file: 'Form1.frm',
          line,
          arguments: [],
          locals: new Map([['temp', Math.random() * 10]]),
        },
      ],
      controls: [...controls],
      formState: { ...formProperties },
      console: [`Line ${line} executed`],
      event,
      description: event || `Executed line ${line}`,
    };

    return snapshot;
  };

  // Start debugging
  const startDebugging = () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      isRecording: true,
      snapshots: [],
      currentSnapshot: -1,
    }));

    // Simulate code execution
    simulateExecution();
  };

  // Ref to store interval ID
  const executionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate code execution with snapshots
  const simulateExecution = () => {
    // Clear any existing interval
    if (executionIntervalRef.current) {
      clearInterval(executionIntervalRef.current);
      executionIntervalRef.current = null;
    }

    let line = 1;
    const lines = currentCode.split('\n').length;
    
    executionIntervalRef.current = setInterval(() => {
      if (!state.isRunning || state.isPaused) {
        if (executionIntervalRef.current) {
          clearInterval(executionIntervalRef.current);
          executionIntervalRef.current = null;
        }
        return;
      }

      // Create snapshot
      const snapshot = createSnapshot(line);
      
      setState(prev => {
        const newSnapshots = [...prev.snapshots, snapshot];
        
        // Limit snapshots
        if (newSnapshots.length > prev.maxSnapshots) {
          newSnapshots.shift();
        }
        
        return {
          ...prev,
          snapshots: newSnapshots,
          currentSnapshot: newSnapshots.length - 1,
        };
      });

      // Check for breakpoints
      if (state.breakpoints.has(`${line}:0`)) {
        pauseExecution();
      }

      line++;
      if (line > lines) {
        stopDebugging();
      }
    }, 1000 / state.executionSpeed);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (executionIntervalRef.current) {
        clearInterval(executionIntervalRef.current);
        executionIntervalRef.current = null;
      }
    };
  }, []);

  // Pause execution
  const pauseExecution = () => {
    setState(prev => ({ ...prev, isPaused: true }));
    eventSystem.fire('Debugger', 'Paused', {});
  };

  // Resume execution
  const resumeExecution = () => {
    setState(prev => ({ ...prev, isPaused: false }));
    if (state.isRunning) {
      simulateExecution();
    }
  };

  // Stop debugging
  const stopDebugging = () => {
    // Clear interval when stopping
    if (executionIntervalRef.current) {
      clearInterval(executionIntervalRef.current);
      executionIntervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      isRecording: false,
    }));
  };

  // Step to specific snapshot
  const stepToSnapshot = (index: number) => {
    if (index >= 0 && index < state.snapshots.length) {
      setState(prev => ({ ...prev, currentSnapshot: index }));
      setSelectedSnapshot(state.snapshots[index]);
      
      // Restore state from snapshot
      restoreSnapshot(state.snapshots[index]);
    }
  };

  // Restore application state from snapshot
  const restoreSnapshot = (snapshot: ExecutionSnapshot) => {
    // In a real implementation, this would restore:
    // - Variable values
    // - Control states
    // - Form properties
    // - Call stack
    
    eventSystem.fire('Debugger', 'SnapshotRestored', { snapshot });
  };

  // Add breakpoint
  const toggleBreakpoint = (line: number, column: number = 0) => {
    const key = `${line}:${column}`;
    setState(prev => {
      const newBreakpoints = new Set(prev.breakpoints);
      if (newBreakpoints.has(key)) {
        newBreakpoints.delete(key);
      } else {
        newBreakpoints.add(key);
      }
      return { ...prev, breakpoints: newBreakpoints };
    });
  };

  // Add watch expression
  const addWatchExpression = (expression: string) => {
    const watch: WatchExpression = {
      id: `watch_${Date.now()}`,
      expression,
      value: evaluateExpression(expression),
    };
    
    setState(prev => ({
      ...prev,
      watchExpressions: [...prev.watchExpressions, watch],
    }));
  };

  // Evaluate expression in current context
  const evaluateExpression = (expression: string): any => {
    // In a real implementation, this would evaluate the expression
    // in the context of the current snapshot
    try {
      return `[Value of ${expression}]`;
    } catch (error) {
      return { error: error.message };
    }
  };

  // Filter snapshots
  const filteredSnapshots = useMemo(() => {
    let filtered = state.snapshots;
    
    if (searchQuery) {
      filtered = filtered.filter(snap => 
        snap.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snap.event?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    switch (filterType) {
      case 'breakpoints':
        filtered = filtered.filter(snap => 
          state.breakpoints.has(`${snap.line}:${snap.column}`)
        );
        break;
      case 'events':
        filtered = filtered.filter(snap => snap.event);
        break;
      case 'errors':
        filtered = filtered.filter(snap => 
          snap.console.some(log => log.includes('Error'))
        );
        break;
    }
    
    return filtered;
  }, [state.snapshots, searchQuery, filterType, state.breakpoints]);

  // Timeline visualization
  const renderTimeline = () => {
    const totalTime = state.snapshots.length > 0
      ? state.snapshots[state.snapshots.length - 1].timestamp - state.snapshots[0].timestamp
      : 0;

    return (
      <div className="relative h-24 bg-gray-900 rounded-lg overflow-hidden">
        {/* Timeline track */}
        <div className="absolute inset-x-0 top-1/2 h-1 bg-gray-700 transform -translate-y-1/2" />
        
        {/* Snapshots */}
        {state.snapshots.map((snapshot, index) => {
          const position = totalTime > 0
            ? ((snapshot.timestamp - state.snapshots[0].timestamp) / totalTime) * 100
            : 0;
            
          const isBreakpoint = state.breakpoints.has(`${snapshot.line}:${snapshot.column}`);
          const isCurrent = index === state.currentSnapshot;
          const hasError = snapshot.console.some(log => log.includes('Error'));
          
          return (
            <motion.div
              key={snapshot.id}
              className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
              style={{ left: `${position}%` }}
              whileHover={{ scale: 1.5 }}
              onClick={() => stepToSnapshot(index)}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  isCurrent ? 'w-5 h-5 ring-4 ring-purple-400' : ''
                } ${
                  hasError ? 'bg-red-500' :
                  isBreakpoint ? 'bg-yellow-500' :
                  snapshot.event ? 'bg-blue-500' :
                  'bg-green-500'
                }`}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {snapshot.description}
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {/* Current position indicator */}
        {state.currentSnapshot >= 0 && (
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-purple-500"
            animate={{
              left: `${((state.snapshots[state.currentSnapshot]?.timestamp - state.snapshots[0]?.timestamp) / totalTime) * 100}%`
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Debug Button */}
      <motion.button
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-red-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center text-white z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowDebugger(!showDebugger)}
      >
        <span className="text-2xl">🐞</span>
      </motion.button>

      {/* Debugger Panel */}
      <AnimatePresence>
        {showDebugger && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 h-[600px] bg-gray-900 text-white shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Time-Travel Debugger</h3>
                  <p className="text-sm opacity-90">Debug through space and time</p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-2">
                  {!state.isRunning ? (
                    <button
                      onClick={startDebugging}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span>▶</span> Start
                    </button>
                  ) : (
                    <>
                      {state.isPaused ? (
                        <button
                          onClick={resumeExecution}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <span>▶</span> Resume
                        </button>
                      ) : (
                        <button
                          onClick={pauseExecution}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <span>⏸</span> Pause
                        </button>
                      )}
                      <button
                        onClick={stopDebugging}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <span>⏹</span> Stop
                      </button>
                    </>
                  )}
                  
                  {/* Speed control */}
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm">Speed:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={state.executionSpeed}
                      onChange={(e) => setState(prev => ({ ...prev, executionSpeed: parseFloat(e.target.value) }))}
                      className="w-24"
                    />
                    <span className="text-sm">{state.executionSpeed}x</span>
                  </div>
                  
                  <button
                    onClick={() => setShowDebugger(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {showTimeline && (
              <div className="p-4 border-b border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Execution Timeline</h4>
                  <div className="flex gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-2 py-1 bg-gray-800 rounded text-sm"
                    >
                      <option value="all">All</option>
                      <option value="breakpoints">Breakpoints</option>
                      <option value="events">Events</option>
                      <option value="errors">Errors</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-2 py-1 bg-gray-800 rounded text-sm"
                    />
                  </div>
                </div>
                {renderTimeline()}
                
                {/* Snapshot info */}
                {selectedSnapshot && (
                  <div className="mt-2 text-sm text-gray-400">
                    Snapshot {state.currentSnapshot + 1} of {state.snapshots.length} - 
                    Line {selectedSnapshot.line} - 
                    {new Date(selectedSnapshot.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Variables */}
              {showVariables && (
                <div className="w-1/3 border-r border-gray-800 p-4 overflow-y-auto">
                  <h4 className="font-semibold mb-3">Variables</h4>
                  {selectedSnapshot && (
                    <div className="space-y-2">
                      {Array.from(selectedSnapshot.variables.entries()).map(([name, value]) => (
                        <div key={name} className="flex justify-between text-sm">
                          <span className="text-gray-400">{name}:</span>
                          <span className="text-green-400 font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Watch expressions */}
                  <div className="mt-6">
                    <h5 className="font-medium mb-2">Watch</h5>
                    <div className="space-y-1">
                      {state.watchExpressions.map(watch => (
                        <div key={watch.id} className="flex justify-between text-sm">
                          <span className="text-gray-400">{watch.expression}:</span>
                          <span className="text-blue-400 font-mono">{watch.value}</span>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add expression..."
                      className="mt-2 w-full px-2 py-1 bg-gray-800 rounded text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          addWatchExpression(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Call Stack */}
              {showCallStack && (
                <div className="w-1/3 border-r border-gray-800 p-4 overflow-y-auto">
                  <h4 className="font-semibold mb-3">Call Stack</h4>
                  {selectedSnapshot && (
                    <div className="space-y-2">
                      {selectedSnapshot.callStack.map((frame, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700"
                        >
                          <div className="font-medium">{frame.function}</div>
                          <div className="text-gray-400 text-xs">
                            {frame.file}:{frame.line}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Console */}
              {showConsole && (
                <div className="flex-1 p-4 overflow-y-auto">
                  <h4 className="font-semibold mb-3">Console</h4>
                  <div className="space-y-1 font-mono text-sm">
                    {selectedSnapshot?.console.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.includes('Error') ? 'text-red-400' :
                          log.includes('Warning') ? 'text-yellow-400' :
                          'text-gray-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="p-2 bg-gray-800 text-xs text-gray-400 flex justify-between">
              <div>Recording: {state.isRecording ? 'ON' : 'OFF'}</div>
              <div>Snapshots: {state.snapshots.length} / {state.maxSnapshots}</div>
              <div>Memory: {(state.snapshots.length * 0.1).toFixed(1)} MB</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TimeTravelDebugger;