import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Performance Metrics
export interface PerformanceMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  handleCount: number;
  threadCount: number;
  gcCollections: number;
  workingSet: number;
  privateMemory: number;
  virtualMemory: number;
}

// Function Profile
export interface FunctionProfile {
  name: string;
  module: string;
  line: number;
  column: number;
  callCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  selfTime: number;
  childTime: number;
  percentage: number;
  callers: Array<{
    name: string;
    callCount: number;
    totalTime: number;
  }>;
  callees: Array<{
    name: string;
    callCount: number;
    totalTime: number;
  }>;
}

// Memory Allocation
export interface MemoryAllocation {
  id: string;
  type: string;
  size: number;
  address: string;
  stackTrace: string[];
  timestamp: number;
  freed: boolean;
  lifespan?: number;
}

// Performance Session
export interface ProfilingSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  applicationName: string;
  processId: number;
  threadId: number;
  metrics: PerformanceMetrics[];
  functions: FunctionProfile[];
  allocations: MemoryAllocation[];
  events: Array<{
    timestamp: number;
    type: string;
    description: string;
    impact: 'Low' | 'Medium' | 'High';
  }>;
  settings: {
    sampleInterval: number;
    trackMemory: boolean;
    trackCalls: boolean;
    trackExceptions: boolean;
    filterNativeCalls: boolean;
    minFunctionTime: number;
  };
}

// Performance Issue
export interface PerformanceIssue {
  id: string;
  type: 'Memory Leak' | 'CPU Hotspot' | 'Slow Function' | 'Excessive Allocations' | 'Long GC Pause';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  location: {
    function: string;
    module: string;
    line: number;
  };
  impact: {
    performance: number;
    memory: number;
    stability: number;
  };
  suggestions: string[];
  evidence: {
    metrics: string[];
    stackTrace?: string[];
    samples: number;
  };
}

// Optimization Suggestion
export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'Algorithm' | 'Memory' | 'I/O' | 'UI' | 'Database' | 'General';
  impact: 'Low' | 'Medium' | 'High';
  effort: 'Easy' | 'Medium' | 'Hard';
  before: string;
  after: string;
  expectedGain: string;
}

interface CodeProfilerProps {
  onProfilingStart?: (session: ProfilingSession) => void;
  onProfilingStop?: (session: ProfilingSession) => void;
  onIssueDetected?: (issue: PerformanceIssue) => void;
}

export const CodeProfiler: React.FC<CodeProfilerProps> = ({
  onProfilingStart,
  onProfilingStop,
  onIssueDetected
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'functions' | 'memory' | 'timeline' | 'issues' | 'suggestions'>('overview');
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<ProfilingSession | null>(null);
  const [sessions, setSessions] = useState<ProfilingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ProfilingSession | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [functionProfiles, setFunctionProfiles] = useState<FunctionProfile[]>([]);
  const [memoryAllocations, setMemoryAllocations] = useState<MemoryAllocation[]>([]);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [settings, setSettings] = useState({
    sampleInterval: 100,
    trackMemory: true,
    trackCalls: true,
    trackExceptions: true,
    filterNativeCalls: false,
    minFunctionTime: 1,
    autoDetectIssues: true,
    generateSuggestions: true
  });
  const [selectedFunction, setSelectedFunction] = useState<FunctionProfile | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'tree' | 'flame'>('table');
  const [sortBy, setSortBy] = useState<'totalTime' | 'callCount' | 'averageTime' | 'percentage'>('totalTime');
  const [filterText, setFilterText] = useState('');

  const eventEmitter = useRef(new EventEmitter());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `profile_${nextId.current++}`, []);

  // Sample function profiles data
  const sampleFunctions: FunctionProfile[] = [
    {
      name: 'Form_Load',
      module: 'Form1.frm',
      line: 15,
      column: 1,
      callCount: 1,
      totalTime: 250.5,
      averageTime: 250.5,
      minTime: 250.5,
      maxTime: 250.5,
      selfTime: 45.2,
      childTime: 205.3,
      percentage: 15.8,
      callers: [],
      callees: [
        { name: 'InitializeComponents', callCount: 1, totalTime: 120.3 },
        { name: 'LoadData', callCount: 1, totalTime: 85.0 }
      ]
    },
    {
      name: 'ProcessRecords',
      module: 'DataModule.bas',
      line: 45,
      column: 1,
      callCount: 1547,
      totalTime: 1250.8,
      averageTime: 0.81,
      minTime: 0.12,
      maxTime: 15.6,
      selfTime: 890.3,
      childTime: 360.5,
      percentage: 78.9,
      callers: [
        { name: 'MainLoop', callCount: 1547, totalTime: 1250.8 }
      ],
      callees: [
        { name: 'ValidateRecord', callCount: 1547, totalTime: 180.2 },
        { name: 'SaveRecord', callCount: 1245, totalTime: 180.3 }
      ]
    },
    {
      name: 'StringConcatenation',
      module: 'Utils.bas',
      line: 122,
      column: 1,
      callCount: 15470,
      totalTime: 89.4,
      averageTime: 0.006,
      minTime: 0.001,
      maxTime: 0.85,
      selfTime: 89.4,
      childTime: 0,
      percentage: 5.6,
      callers: [
        { name: 'ProcessRecords', callCount: 15470, totalTime: 89.4 }
      ],
      callees: []
    }
  ];

  // Sample performance issues
  const sampleIssues: PerformanceIssue[] = [
    {
      id: 'issue_1',
      type: 'CPU Hotspot',
      severity: 'High',
      title: 'String concatenation in tight loop',
      description: 'Function StringConcatenation is consuming 78.9% of total execution time due to inefficient string operations in a loop.',
      location: {
        function: 'ProcessRecords',
        module: 'DataModule.bas',
        line: 45
      },
      impact: {
        performance: 85,
        memory: 40,
        stability: 10
      },
      suggestions: [
        'Use StringBuilder or array concatenation instead of string concatenation',
        'Consider processing records in batches',
        'Cache frequently accessed strings'
      ],
      evidence: {
        metrics: ['High CPU usage during string operations', 'Excessive string allocations'],
        stackTrace: ['ProcessRecords', 'StringConcatenation', 'String.Concat'],
        samples: 1547
      }
    },
    {
      id: 'issue_2',
      type: 'Memory Leak',
      severity: 'Medium',
      title: 'Possible memory leak in Form_Load',
      description: 'Objects allocated in Form_Load are not being properly disposed, leading to gradual memory increase.',
      location: {
        function: 'Form_Load',
        module: 'Form1.frm',
        line: 15
      },
      impact: {
        performance: 30,
        memory: 75,
        stability: 60
      },
      suggestions: [
        'Ensure all objects are properly disposed in Form_Unload',
        'Use Set obj = Nothing for all object variables',
        'Check for circular references'
      ],
      evidence: {
        metrics: ['Growing heap size', 'Unreleased object references'],
        samples: 1
      }
    }
  ];

  // Sample optimization suggestions
  const sampleSuggestions: OptimizationSuggestion[] = [
    {
      id: 'opt_1',
      title: 'Replace string concatenation with StringBuilder pattern',
      description: 'Use array-based string building for better performance in loops.',
      category: 'Algorithm',
      impact: 'High',
      effort: 'Easy',
      before: `Dim result As String\nFor i = 1 To 1000\n    result = result & "item" & i\nNext i`,
      after: `Dim parts() As String\nReDim parts(1000)\nFor i = 1 To 1000\n    parts(i) = "item" & i\nNext i\nresult = Join(parts, "")`,
      expectedGain: '70-80% reduction in string operation time'
    },
    {
      id: 'opt_2',
      title: 'Implement object pooling for frequently created objects',
      description: 'Reuse objects instead of creating new ones to reduce garbage collection pressure.',
      category: 'Memory',
      impact: 'Medium',
      effort: 'Medium',
      before: `For Each record In records\n    Dim processor As New RecordProcessor\n    processor.Process record\n    Set processor = Nothing\nNext`,
      after: `Dim processor As RecordProcessor\nSet processor = GetPooledProcessor()\nFor Each record In records\n    processor.Process record\nNext\nReturnToPool processor`,
      expectedGain: '40-50% reduction in object allocation overhead'
    }
  ];

  // Start profiling
  const startProfiling = useCallback(() => {
    const newSession: ProfilingSession = {
      id: generateId(),
      name: `Session ${new Date().toLocaleTimeString()}`,
      startTime: new Date(),
      duration: 0,
      applicationName: 'VB6 Application',
      processId: Math.floor(Math.random() * 10000) + 1000,
      threadId: Math.floor(Math.random() * 100) + 1,
      metrics: [],
      functions: [],
      allocations: [],
      events: [],
      settings: {
        sampleInterval: settings.sampleInterval,
        trackMemory: settings.trackMemory,
        trackCalls: settings.trackCalls,
        trackExceptions: settings.trackExceptions,
        filterNativeCalls: settings.filterNativeCalls,
        minFunctionTime: settings.minFunctionTime
      }
    };

    setCurrentSession(newSession);
    setSelectedSession(newSession);
    setIsRunning(true);
    setPerformanceMetrics([]);
    setFunctionProfiles(sampleFunctions);
    setMemoryAllocations([]);
    setIssues(settings.autoDetectIssues ? sampleIssues : []);
    setSuggestions(settings.generateSuggestions ? sampleSuggestions : []);

    // Start collecting metrics
    intervalRef.current = setInterval(() => {
      const newMetric: PerformanceMetrics = {
        timestamp: Date.now(),
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 1024 * 1024 * 512, // Up to 512MB
        handleCount: Math.floor(Math.random() * 1000) + 100,
        threadCount: Math.floor(Math.random() * 10) + 1,
        gcCollections: Math.floor(Math.random() * 5),
        workingSet: Math.random() * 1024 * 1024 * 256,
        privateMemory: Math.random() * 1024 * 1024 * 128,
        virtualMemory: Math.random() * 1024 * 1024 * 1024
      };

      setPerformanceMetrics(prev => [...prev, newMetric]);
    }, settings.sampleInterval);

    onProfilingStart?.(newSession);
    eventEmitter.current.emit('profilingStarted', newSession);
  }, [settings, generateId, onProfilingStart]);

  // Stop profiling
  const stopProfiling = useCallback(() => {
    if (!currentSession || !isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const endTime = new Date();
    const finalSession: ProfilingSession = {
      ...currentSession,
      endTime,
      duration: endTime.getTime() - currentSession.startTime.getTime(),
      metrics: [...performanceMetrics],
      functions: [...functionProfiles],
      allocations: [...memoryAllocations],
      events: [
        {
          timestamp: currentSession.startTime.getTime(),
          type: 'Session Start',
          description: 'Profiling session started',
          impact: 'Low'
        },
        {
          timestamp: endTime.getTime(),
          type: 'Session End',
          description: 'Profiling session completed',
          impact: 'Low'
        }
      ]
    };

    setSessions(prev => [...prev, finalSession]);
    setCurrentSession(null);
    setIsRunning(false);

    onProfilingStop?.(finalSession);
    eventEmitter.current.emit('profilingStopped', finalSession);
  }, [currentSession, isRunning, performanceMetrics, functionProfiles, memoryAllocations, onProfilingStop]);

  // Filter functions
  const filteredFunctions = functionProfiles.filter(func =>
    !filterText || 
    func.name.toLowerCase().includes(filterText.toLowerCase()) ||
    func.module.toLowerCase().includes(filterText.toLowerCase())
  );

  // Sort functions
  const sortedFunctions = [...filteredFunctions].sort((a, b) => {
    switch (sortBy) {
      case 'totalTime':
        return b.totalTime - a.totalTime;
      case 'callCount':
        return b.callCount - a.callCount;
      case 'averageTime':
        return b.averageTime - a.averageTime;
      case 'percentage':
        return b.percentage - a.percentage;
      default:
        return 0;
    }
  });

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Format memory
  const formatMemory = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Code Profiler</h1>
            {isRunning && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">Recording</span>
              </div>
            )}
            {selectedSession && (
              <span className="text-sm text-gray-600">
                {isRunning ? 'Current Session' : selectedSession.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedSession?.id || ''}
              onChange={(e) => {
                const session = sessions.find(s => s.id === e.target.value);
                setSelectedSession(session || null);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={isRunning}
            >
              <option value="">Select session...</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.name} ({formatTime(session.duration)})
                </option>
              ))}
            </select>
            {isRunning ? (
              <button
                onClick={stopProfiling}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Profiling
              </button>
            ) : (
              <button
                onClick={startProfiling}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Start Profiling
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'overview', label: 'Overview', count: 0 },
            { key: 'functions', label: 'Functions', count: functionProfiles.length },
            { key: 'memory', label: 'Memory', count: memoryAllocations.length },
            { key: 'timeline', label: 'Timeline', count: performanceMetrics.length },
            { key: 'issues', label: 'Issues', count: issues.length },
            { key: 'suggestions', label: 'Suggestions', count: suggestions.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'overview' && (
          <div className="p-6">
            {selectedSession ? (
              <div className="space-y-6">
                {/* Session Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTime(selectedSession.duration)}
                    </div>
                    <div className="text-sm text-blue-800">Duration</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSession.functions.length}
                    </div>
                    <div className="text-sm text-green-800">Functions Profiled</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {issues.length}
                    </div>
                    <div className="text-sm text-yellow-800">Issues Detected</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {suggestions.length}
                    </div>
                    <div className="text-sm text-purple-800">Optimizations</div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Top Functions by Time</h4>
                      {sortedFunctions.slice(0, 5).map((func, index) => (
                        <div key={index} className="flex justify-between py-1">
                          <span className="text-sm truncate">{func.name}</span>
                          <span className="text-sm font-mono">{formatTime(func.totalTime)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Critical Issues</h4>
                      {issues.filter(i => i.severity === 'High' || i.severity === 'Critical').slice(0, 3).map((issue, index) => (
                        <div key={index} className="flex items-center gap-2 py-1">
                          <span className={`w-2 h-2 rounded-full ${
                            issue.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'
                          }`}></span>
                          <span className="text-sm truncate">{issue.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg">No profiling session selected</p>
                <p className="text-sm mt-2">Start profiling or select an existing session to view performance data</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'functions' && (
          <div className="flex flex-col h-full">
            {/* Function Controls */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Filter functions..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded w-64"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="totalTime">Sort by Total Time</option>
                    <option value="callCount">Sort by Call Count</option>
                    <option value="averageTime">Sort by Average Time</option>
                    <option value="percentage">Sort by Percentage</option>
                  </select>
                </div>
                <div className="flex border border-gray-300 rounded">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-3 py-1 text-sm ${viewMode === 'tree' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                  >
                    Tree
                  </button>
                  <button
                    onClick={() => setViewMode('flame')}
                    className={`px-3 py-1 text-sm ${viewMode === 'flame' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                  >
                    Flame Graph
                  </button>
                </div>
              </div>
            </div>

            {/* Function List */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Function</th>
                        <th className="text-left p-3 font-medium">Module</th>
                        <th className="text-right p-3 font-medium">Calls</th>
                        <th className="text-right p-3 font-medium">Total Time</th>
                        <th className="text-right p-3 font-medium">Avg Time</th>
                        <th className="text-right p-3 font-medium">Self Time</th>
                        <th className="text-right p-3 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFunctions.map((func, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedFunction(func)}
                        >
                          <td className="p-3 font-mono text-sm">{func.name}</td>
                          <td className="p-3 text-sm text-gray-600">{func.module}</td>
                          <td className="p-3 text-right font-mono text-sm">{func.callCount.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-sm">{formatTime(func.totalTime)}</td>
                          <td className="p-3 text-right font-mono text-sm">{formatTime(func.averageTime)}</td>
                          <td className="p-3 text-right font-mono text-sm">{formatTime(func.selfTime)}</td>
                          <td className="p-3 text-right font-mono text-sm">{func.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === 'tree' && (
                <div className="p-4">
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🌳</div>
                    <p className="text-lg">Call Tree View</p>
                    <p className="text-sm mt-2">Hierarchical view of function calls coming soon</p>
                  </div>
                </div>
              )}

              {viewMode === 'flame' && (
                <div className="p-4">
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🔥</div>
                    <p className="text-lg">Flame Graph</p>
                    <p className="text-sm mt-2">Interactive flame graph visualization coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'memory' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🧠</div>
              <p className="text-lg">Memory Profiler</p>
              <p className="text-sm mt-2">Memory allocation tracking and leak detection</p>
            </div>
          </div>
        )}

        {selectedTab === 'timeline' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📈</div>
              <p className="text-lg">Performance Timeline</p>
              <p className="text-sm mt-2">Real-time performance metrics visualization</p>
            </div>
          </div>
        )}

        {selectedTab === 'issues' && (
          <div className="p-6">
            <div className="space-y-4">
              {issues.map(issue => (
                <div key={issue.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${
                        issue.severity === 'Critical' ? 'bg-red-500' :
                        issue.severity === 'High' ? 'bg-orange-500' :
                        issue.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></span>
                      <h3 className="font-medium text-lg">{issue.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        issue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                        issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {issue.type}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{issue.description}</p>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Location:</strong> {issue.location.function} in {issue.location.module}:{issue.location.line}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <strong>Performance Impact:</strong> {issue.impact.performance}%
                    </div>
                    <div>
                      <strong>Memory Impact:</strong> {issue.impact.memory}%
                    </div>
                    <div>
                      <strong>Stability Impact:</strong> {issue.impact.stability}%
                    </div>
                  </div>
                  
                  <div>
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm text-gray-700">
                      {issue.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              
              {issues.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-lg">No performance issues detected</p>
                  <p className="text-sm mt-2">Your code is performing well!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'suggestions' && (
          <div className="p-6">
            <div className="space-y-6">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-lg">{suggestion.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        suggestion.impact === 'High' ? 'bg-green-100 text-green-800' :
                        suggestion.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {suggestion.impact} Impact
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        suggestion.effort === 'Easy' ? 'bg-green-100 text-green-800' :
                        suggestion.effort === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {suggestion.effort} Effort
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {suggestion.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{suggestion.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2">Before:</h4>
                      <pre className="bg-red-50 p-3 rounded text-xs font-mono overflow-x-auto">
                        {suggestion.before}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">After:</h4>
                      <pre className="bg-green-50 p-3 rounded text-xs font-mono overflow-x-auto">
                        {suggestion.after}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded">
                    <strong>Expected Gain:</strong> {suggestion.expectedGain}
                  </div>
                </div>
              ))}
              
              {suggestions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">💡</div>
                  <p className="text-lg">No optimization suggestions</p>
                  <p className="text-sm mt-2">Start profiling to get performance recommendations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeProfiler;