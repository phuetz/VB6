import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Square, RefreshCw, Cpu, Clock, AlertTriangle, Activity, Eye, Code, Settings, Filter, Search, Target, Zap, Lock, Unlock, ArrowRight, ChevronDown, ChevronRight, Bug, Info, AlertCircle } from 'lucide-react';

// Types
export enum ThreadState {
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
  BLOCKED = 'Blocked',
  WAITING = 'Waiting',
  TERMINATED = 'Terminated',
  INITIALIZING = 'Initializing',
  READY = 'Ready',
  STANDBY = 'Standby'
}

export enum ThreadPriority {
  IDLE = 'Idle',
  LOWEST = 'Lowest',
  BELOW_NORMAL = 'Below Normal',
  NORMAL = 'Normal',
  ABOVE_NORMAL = 'Above Normal',
  HIGHEST = 'Highest',
  TIME_CRITICAL = 'Time Critical'
}

export enum SynchronizationObjectType {
  MUTEX = 'Mutex',
  SEMAPHORE = 'Semaphore',
  EVENT = 'Event',
  CRITICAL_SECTION = 'Critical Section',
  CONDITION_VARIABLE = 'Condition Variable'
}

export interface StackFrame {
  id: string;
  functionName: string;
  moduleName: string;
  fileName?: string;
  lineNumber?: number;
  address: string;
  parameters: Array<{
    name: string;
    type: string;
    value: string;
  }>;
  locals: Array<{
    name: string;
    type: string;
    value: string;
  }>;
}

export interface SynchronizationObject {
  id: string;
  name: string;
  type: SynchronizationObjectType;
  owner?: string;
  waitingThreads: string[];
  isSignaled: boolean;
  maxCount?: number;
  currentCount?: number;
}

export interface ThreadException {
  id: string;
  type: string;
  message: string;
  stackTrace: StackFrame[];
  timestamp: Date;
  handled: boolean;
}

export interface DebugThread {
  id: string;
  name: string;
  state: ThreadState;
  priority: ThreadPriority;
  cpuUsage: number;
  startTime: Date;
  runTime: number; // milliseconds
  stackFrames: StackFrame[];
  lastException?: ThreadException;
  syncObjects: string[];
  isMainThread: boolean;
  processId: number;
  nativeId: number;
  apartment: 'STA' | 'MTA' | 'Unknown';
}

export interface DeadlockInfo {
  id: string;
  threadIds: string[];
  syncObjects: string[];
  detected: Date;
  resolved: boolean;
}

interface ThreadsWindowProps {
  isOpen: boolean;
  onClose: () => void;
  processName?: string;
  processId?: number;
}

export const ThreadsWindow: React.FC<ThreadsWindowProps> = ({
  isOpen,
  onClose,
  processName = 'MyVB6App.exe',
  processId = 1234
}) => {
  const [threads, setThreads] = useState<DebugThread[]>([
    {
      id: 'thread-1',
      name: 'Main Thread',
      state: ThreadState.RUNNING,
      priority: ThreadPriority.NORMAL,
      cpuUsage: 15.3,
      startTime: new Date(Date.now() - 300000),
      runTime: 295420,
      isMainThread: true,
      processId: 1234,
      nativeId: 5678,
      apartment: 'STA',
      syncObjects: ['mutex-1'],
      stackFrames: [
        {
          id: 'frame-1',
          functionName: 'Form1.cmdCalculate_Click',
          moduleName: 'Form1.frm',
          fileName: 'C:\\MyProject\\Form1.frm',
          lineNumber: 45,
          address: '0x004012A0',
          parameters: [
            { name: 'sender', type: 'Object', value: 'CommandButton1' }
          ],
          locals: [
            { name: 'result', type: 'Double', value: '123.45' },
            { name: 'i', type: 'Integer', value: '10' }
          ]
        },
        {
          id: 'frame-2',
          functionName: 'CalculationEngine.Calculate',
          moduleName: 'CalculationEngine.cls',
          fileName: 'C:\\MyProject\\CalculationEngine.cls',
          lineNumber: 78,
          address: '0x00401850',
          parameters: [
            { name: 'value1', type: 'Double', value: '100.0' },
            { name: 'value2', type: 'Double', value: '23.45' }
          ],
          locals: [
            { name: 'temp', type: 'Double', value: '77.55' }
          ]
        },
        {
          id: 'frame-3',
          functionName: 'VBA6!VBE6::CompileProject',
          moduleName: 'vba6.dll',
          address: '0x10002340',
          parameters: [],
          locals: []
        }
      ]
    },
    {
      id: 'thread-2',
      name: 'Worker Thread #1',
      state: ThreadState.WAITING,
      priority: ThreadPriority.BELOW_NORMAL,
      cpuUsage: 0.8,
      startTime: new Date(Date.now() - 120000),
      runTime: 45670,
      isMainThread: false,
      processId: 1234,
      nativeId: 9012,
      apartment: 'MTA',
      syncObjects: ['event-1', 'semaphore-1'],
      stackFrames: [
        {
          id: 'frame-4',
          functionName: 'WorkerThread.ProcessData',
          moduleName: 'Worker.cls',
          fileName: 'C:\\MyProject\\Worker.cls',
          lineNumber: 125,
          address: '0x00402100',
          parameters: [
            { name: 'data', type: 'Variant', value: 'Array(0 to 99)' }
          ],
          locals: [
            { name: 'index', type: 'Long', value: '45' },
            { name: 'processed', type: 'Boolean', value: 'False' }
          ]
        },
        {
          id: 'frame-5',
          functionName: 'kernel32!WaitForSingleObject',
          moduleName: 'kernel32.dll',
          address: '0x77E61D70',
          parameters: [
            { name: 'hHandle', type: 'HANDLE', value: '0x000001BC' },
            { name: 'dwMilliseconds', type: 'DWORD', value: 'INFINITE' }
          ],
          locals: []
        }
      ],
      lastException: {
        id: 'ex-1',
        type: 'VBRuntime.OutOfMemoryException',
        message: 'Not enough memory to complete operation',
        timestamp: new Date(Date.now() - 60000),
        handled: true,
        stackTrace: []
      }
    },
    {
      id: 'thread-3',
      name: 'Database Thread',
      state: ThreadState.BLOCKED,
      priority: ThreadPriority.ABOVE_NORMAL,
      cpuUsage: 5.2,
      startTime: new Date(Date.now() - 180000),
      runTime: 156890,
      isMainThread: false,
      processId: 1234,
      nativeId: 3456,
      apartment: 'STA',
      syncObjects: ['mutex-1', 'critical-section-1'],
      stackFrames: [
        {
          id: 'frame-6',
          functionName: 'DatabaseManager.ExecuteQuery',
          moduleName: 'DatabaseManager.cls',
          fileName: 'C:\\MyProject\\DatabaseManager.cls',
          lineNumber: 234,
          address: '0x00403200',
          parameters: [
            { name: 'sql', type: 'String', value: '"SELECT * FROM Users"' },
            { name: 'timeout', type: 'Long', value: '30' }
          ],
          locals: [
            { name: 'recordset', type: 'ADODB.Recordset', value: 'Object' },
            { name: 'connectionString', type: 'String', value: '"Provider=SQLOLEDB..."' }
          ]
        }
      ]
    }
  ]);

  const [syncObjects, setSyncObjects] = useState<SynchronizationObject[]>([
    {
      id: 'mutex-1',
      name: 'DatabaseMutex',
      type: SynchronizationObjectType.MUTEX,
      owner: 'thread-1',
      waitingThreads: ['thread-3'],
      isSignaled: false
    },
    {
      id: 'event-1',
      name: 'DataProcessedEvent',
      type: SynchronizationObjectType.EVENT,
      waitingThreads: ['thread-2'],
      isSignaled: false
    },
    {
      id: 'semaphore-1',
      name: 'ConnectionPoolSemaphore',
      type: SynchronizationObjectType.SEMAPHORE,
      waitingThreads: [],
      isSignaled: true,
      maxCount: 10,
      currentCount: 7
    },
    {
      id: 'critical-section-1',
      name: 'LogFileCriticalSection',
      type: SynchronizationObjectType.CRITICAL_SECTION,
      owner: 'thread-1',
      waitingThreads: ['thread-3'],
      isSignaled: false
    }
  ]);

  const [deadlocks, setDeadlocks] = useState<DeadlockInfo[]>([
    {
      id: 'deadlock-1',
      threadIds: ['thread-1', 'thread-3'],
      syncObjects: ['mutex-1', 'critical-section-1'],
      detected: new Date(Date.now() - 30000),
      resolved: false
    }
  ]);

  const [selectedThread, setSelectedThread] = useState<string | null>('thread-1');
  const [activeTab, setActiveTab] = useState<'threads' | 'callstack' | 'sync' | 'deadlocks' | 'exceptions'>('threads');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<ThreadState | 'all'>('all');
  const [expandedFrames, setExpandedFrames] = useState<Set<string>>(new Set(['frame-1']));
  const [showSystemThreads, setShowSystemThreads] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate real-time updates
    const interval = setInterval(() => {
      setThreads(prev => prev.map(thread => ({
        ...thread,
        cpuUsage: Math.max(0, Math.min(100, thread.cpuUsage + (Math.random() - 0.5) * 10)),
        runTime: thread.runTime + 1000,
        state: Math.random() > 0.95 ? 
          (thread.state === ThreadState.RUNNING ? ThreadState.WAITING : ThreadState.RUNNING) : 
          thread.state
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const refreshThreads = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const suspendThread = (threadId: string) => {
    setThreads(prev => prev.map(thread =>
      thread.id === threadId ? { ...thread, state: ThreadState.SUSPENDED } : thread
    ));
  };

  const resumeThread = (threadId: string) => {
    setThreads(prev => prev.map(thread =>
      thread.id === threadId ? { ...thread, state: ThreadState.RUNNING } : thread
    ));
  };

  const terminateThread = (threadId: string) => {
    setThreads(prev => prev.map(thread =>
      thread.id === threadId ? { ...thread, state: ThreadState.TERMINATED } : thread
    ));
  };

  const getStateColor = (state: ThreadState) => {
    switch (state) {
      case ThreadState.RUNNING:
        return 'text-green-600';
      case ThreadState.SUSPENDED:
        return 'text-yellow-600';
      case ThreadState.BLOCKED:
        return 'text-red-600';
      case ThreadState.WAITING:
        return 'text-blue-600';
      case ThreadState.TERMINATED:
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStateIcon = (state: ThreadState) => {
    switch (state) {
      case ThreadState.RUNNING:
        return <Play className="w-3 h-3 text-green-600" />;
      case ThreadState.SUSPENDED:
        return <Pause className="w-3 h-3 text-yellow-600" />;
      case ThreadState.BLOCKED:
        return <Lock className="w-3 h-3 text-red-600" />;
      case ThreadState.WAITING:
        return <Clock className="w-3 h-3 text-blue-600" />;
      case ThreadState.TERMINATED:
        return <Square className="w-3 h-3 text-gray-600" />;
      default:
        return <Activity className="w-3 h-3 text-gray-600" />;
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.id.includes(searchTerm);
    const matchesFilter = filterState === 'all' || thread.state === filterState;
    const matchesSystemFilter = showSystemThreads || !thread.name.includes('System');
    
    return matchesSearch && matchesFilter && matchesSystemFilter;
  });

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  const toggleFrameExpansion = (frameId: string) => {
    const newExpanded = new Set(expandedFrames);
    if (newExpanded.has(frameId)) {
      newExpanded.delete(frameId);
    } else {
      newExpanded.add(frameId);
    }
    setExpandedFrames(newExpanded);
  };

  const renderThreadsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search threads..."
              className="pl-8 pr-3 py-1.5 border rounded text-sm w-48"
            />
          </div>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as ThreadState | 'all')}
            className="px-3 py-1.5 border rounded text-sm"
          >
            <option value="all">All States</option>
            <option value={ThreadState.RUNNING}>Running</option>
            <option value={ThreadState.SUSPENDED}>Suspended</option>
            <option value={ThreadState.BLOCKED}>Blocked</option>
            <option value={ThreadState.WAITING}>Waiting</option>
            <option value={ThreadState.TERMINATED}>Terminated</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showSystemThreads}
              onChange={(e) => setShowSystemThreads(e.target.checked)}
            />
            Show system threads
          </label>
        </div>
        <button
          onClick={refreshThreads}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b">
            <tr>
              <th className="p-2 text-left border-r">Thread</th>
              <th className="p-2 text-left border-r">State</th>
              <th className="p-2 text-left border-r">Priority</th>
              <th className="p-2 text-left border-r">CPU %</th>
              <th className="p-2 text-left border-r">Runtime</th>
              <th className="p-2 text-left border-r">Apartment</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredThreads.map(thread => (
              <tr
                key={thread.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedThread === thread.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedThread(thread.id)}
              >
                <td className="p-2 border-r">
                  <div className="flex items-center gap-2">
                    {getStateIcon(thread.state)}
                    <div>
                      <div className="font-medium">
                        {thread.name}
                        {thread.isMainThread && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Main</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        ID: {thread.nativeId} | PID: {thread.processId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`p-2 border-r font-medium ${getStateColor(thread.state)}`}>
                  {thread.state}
                </td>
                <td className="p-2 border-r">{thread.priority}</td>
                <td className="p-2 border-r">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, thread.cpuUsage)}%` }}
                      />
                    </div>
                    <span className="text-xs">{thread.cpuUsage.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="p-2 border-r">
                  {Math.floor(thread.runTime / 1000)}s
                </td>
                <td className="p-2 border-r">{thread.apartment}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {thread.state === ThreadState.RUNNING ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          suspendThread(thread.id);
                        }}
                        className="p-1 hover:bg-yellow-100 rounded"
                        title="Suspend"
                      >
                        <Pause className="w-3 h-3 text-yellow-600" />
                      </button>
                    ) : thread.state === ThreadState.SUSPENDED ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resumeThread(thread.id);
                        }}
                        className="p-1 hover:bg-green-100 rounded"
                        title="Resume"
                      >
                        <Play className="w-3 h-3 text-green-600" />
                      </button>
                    ) : null}
                    {!thread.isMainThread && thread.state !== ThreadState.TERMINATED && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          terminateThread(thread.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Terminate"
                      >
                        <Square className="w-3 h-3 text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCallStackTab = () => {
    if (!selectedThreadData) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Select a thread to view call stack</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b bg-gray-50">
          <h4 className="font-semibold">Call Stack - {selectedThreadData.name}</h4>
          <div className="text-sm text-gray-600">
            {selectedThreadData.stackFrames.length} frames
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="space-y-1 p-2">
            {selectedThreadData.stackFrames.map((frame, index) => (
              <div key={frame.id} className="border rounded">
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => toggleFrameExpansion(frame.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedFrames.has(frame.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      #{index}
                    </span>
                    <div>
                      <div className="font-medium">{frame.functionName}</div>
                      <div className="text-sm text-gray-600">
                        {frame.moduleName}
                        {frame.fileName && frame.lineNumber && (
                          <span> • Line {frame.lineNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{frame.address}</div>
                </div>
                
                {expandedFrames.has(frame.id) && (
                  <div className="p-3 border-t bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {frame.parameters.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 text-sm">Parameters</h5>
                          <div className="space-y-1">
                            {frame.parameters.map((param, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="font-mono">{param.name}</span>
                                <span className="text-gray-600">{param.type}</span>
                                <span className="font-mono">{param.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {frame.locals.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 text-sm">Local Variables</h5>
                          <div className="space-y-1">
                            {frame.locals.map((local, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="font-mono">{local.name}</span>
                                <span className="text-gray-600">{local.type}</span>
                                <span className="font-mono">{local.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {frame.fileName && (
                      <div className="mt-3 pt-3 border-t">
                        <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View Source
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSyncObjectsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h4 className="font-semibold">Synchronization Objects</h4>
        <div className="text-sm text-gray-600">
          {syncObjects.length} objects • {syncObjects.filter(obj => obj.waitingThreads.length > 0).length} contended
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {syncObjects.map(obj => (
            <div key={obj.id} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {obj.isSignaled ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">{obj.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{obj.type}</span>
                </div>
                <div className={`text-sm ${obj.isSignaled ? 'text-green-600' : 'text-red-600'}`}>
                  {obj.isSignaled ? 'Signaled' : 'Not Signaled'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {obj.owner && (
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <span className="ml-2 font-mono">{threads.find(t => t.id === obj.owner)?.name || obj.owner}</span>
                  </div>
                )}
                
                {obj.type === SynchronizationObjectType.SEMAPHORE && obj.maxCount && (
                  <div>
                    <span className="text-gray-600">Count:</span>
                    <span className="ml-2 font-mono">{obj.currentCount} / {obj.maxCount}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Waiting Threads:</span>
                  <span className="ml-2 font-mono">{obj.waitingThreads.length}</span>
                </div>
              </div>
              
              {obj.waitingThreads.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <h5 className="font-medium mb-2 text-sm">Waiting Threads:</h5>
                  <div className="space-y-1">
                    {obj.waitingThreads.map(threadId => {
                      const thread = threads.find(t => t.id === threadId);
                      return (
                        <div key={threadId} className="flex items-center gap-2 text-sm">
                          {getStateIcon(thread?.state || ThreadState.WAITING)}
                          <span>{thread?.name || threadId}</span>
                          <span className="text-gray-600">({thread?.state})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDeadlocksTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h4 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Deadlocks
        </h4>
        <div className="text-sm text-gray-600">
          {deadlocks.length} detected • {deadlocks.filter(d => !d.resolved).length} unresolved
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {deadlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No deadlocks detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlocks.map(deadlock => (
              <div key={deadlock.id} className={`border rounded p-3 ${
                deadlock.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${deadlock.resolved ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="font-medium">Deadlock #{deadlock.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      deadlock.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {deadlock.resolved ? 'Resolved' : 'Active'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {deadlock.detected.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Involved Threads:</h5>
                    <div className="space-y-1">
                      {deadlock.threadIds.map(threadId => {
                        const thread = threads.find(t => t.id === threadId);
                        return (
                          <div key={threadId} className="flex items-center gap-2">
                            {getStateIcon(thread?.state || ThreadState.BLOCKED)}
                            <span>{thread?.name || threadId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Synchronization Objects:</h5>
                    <div className="space-y-1">
                      {deadlock.syncObjects.map(objId => {
                        const obj = syncObjects.find(o => o.id === objId);
                        return (
                          <div key={objId} className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-gray-600" />
                            <span>{obj?.name || objId}</span>
                            <span className="text-xs text-gray-600">({obj?.type})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {!deadlock.resolved && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={() => setDeadlocks(prev => prev.map(d =>
                        d.id === deadlock.id ? { ...d, resolved: true } : d
                      ))}
                      className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Force Resolution
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderExceptionsTab = () => {
    const threadsWithExceptions = threads.filter(t => t.lastException);
    
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b bg-gray-50">
          <h4 className="font-semibold flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-600" />
            Thread Exceptions
          </h4>
          <div className="text-sm text-gray-600">
            {threadsWithExceptions.length} threads with exceptions
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {threadsWithExceptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
              <p>No exceptions in any thread</p>
            </div>
          ) : (
            <div className="space-y-3">
              {threadsWithExceptions.map(thread => (
                <div key={thread.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-red-600" />
                      <span className="font-medium">{thread.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      thread.lastException?.handled ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {thread.lastException?.handled ? 'Handled' : 'Unhandled'}
                    </span>
                  </div>
                  
                  {thread.lastException && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-red-600">{thread.lastException.type}</span>
                      </div>
                      <div className="text-gray-700">{thread.lastException.message}</div>
                      <div className="text-xs text-gray-600">
                        {thread.lastException.timestamp.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95%] h-[90%] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Threads</h2>
            <span className="text-sm text-gray-600">
              {processName} (PID: {processId})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{threads.filter(t => t.state === ThreadState.RUNNING).length} Running</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{threads.filter(t => t.state === ThreadState.SUSPENDED).length} Suspended</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{threads.filter(t => t.state === ThreadState.BLOCKED).length} Blocked</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'threads'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1" />
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setActiveTab('callstack')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'callstack'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Code className="w-4 h-4 inline mr-1" />
            Call Stack
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-1" />
            Sync Objects ({syncObjects.length})
          </button>
          <button
            onClick={() => setActiveTab('deadlocks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'deadlocks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Deadlocks ({deadlocks.filter(d => !d.resolved).length})
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'exceptions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Bug className="w-4 h-4 inline mr-1" />
            Exceptions ({threads.filter(t => t.lastException).length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'threads' && renderThreadsTab()}
          {activeTab === 'callstack' && renderCallStackTab()}
          {activeTab === 'sync' && renderSyncObjectsTab()}
          {activeTab === 'deadlocks' && renderDeadlocksTab()}
          {activeTab === 'exceptions' && renderExceptionsTab()}
        </div>

        {/* Status Bar */}
        <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>Total CPU: {threads.reduce((sum, t) => sum + t.cpuUsage, 0).toFixed(1)}%</span>
            <span>Active Threads: {threads.filter(t => t.state === ThreadState.RUNNING).length}</span>
            <span>Sync Objects: {syncObjects.length}</span>
          </div>
          <div className="flex items-center gap-4">
            {deadlocks.filter(d => !d.resolved).length > 0 && (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {deadlocks.filter(d => !d.resolved).length} active deadlock(s)
              </span>
            )}
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};