import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Performance Metric Types
export enum MetricType {
  CPU = 'CPU Usage',
  Memory = 'Memory Usage',
  DiskIO = 'Disk I/O',
  NetworkIO = 'Network I/O',
  GDI = 'GDI Objects',
  UserObjects = 'User Objects',
  Handles = 'Handles',
  Threads = 'Threads',
  ProcessorTime = 'Processor Time',
  WorkingSet = 'Working Set',
}

export enum ProfilingMode {
  Sampling = 'Sampling',
  Instrumentation = 'Instrumentation',
  Memory = 'Memory',
  Concurrency = 'Concurrency',
}

export enum PerformanceLevel {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
  Critical = 'Critical',
}

// Performance Metrics
export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  history: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  level: PerformanceLevel;
}

// Function Profile
export interface FunctionProfile {
  id: string;
  name: string;
  module: string;
  fileName: string;
  lineNumber: number;
  callCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  exclusiveTime: number;
  inclusiveTime: number;
  percentage: number;
  callers: Array<{
    name: string;
    callCount: number;
    time: number;
  }>;
  callees: Array<{
    name: string;
    callCount: number;
    time: number;
  }>;
  hotspots: Array<{
    lineNumber: number;
    hitCount: number;
    time: number;
  }>;
}

// Memory Analysis
export interface MemoryAnalysis {
  totalAllocated: number;
  totalFreed: number;
  currentUsage: number;
  peakUsage: number;
  allocations: Array<{
    address: string;
    size: number;
    type: string;
    stackTrace: string[];
    timestamp: Date;
    freed: boolean;
  }>;
  leaks: Array<{
    address: string;
    size: number;
    type: string;
    stackTrace: string[];
    age: number;
  }>;
  heapFragmentation: number;
  gcCollections: number;
}

// Performance Session
export interface PerformanceSession {
  id: string;
  name: string;
  applicationPath: string;
  profilingMode: ProfilingMode;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'Recording' | 'Stopped' | 'Analyzing' | 'Complete';
  metrics: PerformanceMetric[];
  functions: FunctionProfile[];
  memoryAnalysis: MemoryAnalysis;
  events: Array<{
    timestamp: Date;
    type: 'Performance' | 'Memory' | 'Exception' | 'GC';
    description: string;
    severity: 'Info' | 'Warning' | 'Error';
  }>;
  recommendations: Array<{
    category: string;
    issue: string;
    impact: 'High' | 'Medium' | 'Low';
    recommendation: string;
    codeLocation?: {
      file: string;
      line: number;
      function: string;
    };
  }>;
}

// Performance Counter
export interface PerformanceCounter {
  id: string;
  category: string;
  name: string;
  instance?: string;
  description: string;
  value: number;
  unit: string;
  enabled: boolean;
  color: string;
}

interface ApplicationPerformanceExplorerProps {
  onSessionChange?: (session: PerformanceSession | null) => void;
  onExport?: (session: PerformanceSession, format: 'HTML' | 'XML' | 'CSV') => void;
}

export const ApplicationPerformanceExplorer: React.FC<ApplicationPerformanceExplorerProps> = ({
  onSessionChange,
  onExport,
}) => {
  const [sessions, setSessions] = useState<PerformanceSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PerformanceSession | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'functions' | 'memory' | 'counters' | 'recommendations'
  >('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState('');
  const [selectedProfilingMode, setSelectedProfilingMode] = useState<ProfilingMode>(
    ProfilingMode.Sampling
  );
  const [performanceCounters, setPerformanceCounters] = useState<PerformanceCounter[]>([]);
  const [selectedCounters, setSelectedCounters] = useState<Set<string>>(new Set());
  const [realtimeUpdate, setRealtimeUpdate] = useState(true);
  const [chartTimeRange, setChartTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [sortBy, setSortBy] = useState<'totalTime' | 'callCount' | 'averageTime'>('totalTime');
  const [filterText, setFilterText] = useState('');

  const eventEmitter = useRef(new EventEmitter());
  const recordingTimer = useRef<NodeJS.Timeout>();
  const chartCanvas = useRef<HTMLCanvasElement>(null);

  // Initialize performance counters
  useEffect(() => {
    const defaultCounters: PerformanceCounter[] = [
      {
        id: '1',
        category: 'Processor',
        name: '% Processor Time',
        instance: '_Total',
        description:
          'The percentage of elapsed time that the processor spends executing a non-idle thread',
        value: 0,
        unit: '%',
        enabled: true,
        color: '#3b82f6',
      },
      {
        id: '2',
        category: 'Memory',
        name: 'Available MBytes',
        description: 'The amount of physical memory available to processes running on the computer',
        value: 0,
        unit: 'MB',
        enabled: true,
        color: '#10b981',
      },
      {
        id: '3',
        category: 'Process',
        name: 'Working Set',
        instance: 'YourApp',
        description: 'The current size of the Working Set of the process',
        value: 0,
        unit: 'KB',
        enabled: true,
        color: '#f59e0b',
      },
      {
        id: '4',
        category: 'Process',
        name: '% Processor Time',
        instance: 'YourApp',
        description:
          'The percentage of elapsed time that all threads of the process used the processor to execute instructions',
        value: 0,
        unit: '%',
        enabled: true,
        color: '#ef4444',
      },
      {
        id: '5',
        category: 'Process',
        name: 'Private Bytes',
        instance: 'YourApp',
        description:
          'The current size of memory that the process has allocated that cannot be shared with other processes',
        value: 0,
        unit: 'KB',
        enabled: false,
        color: '#8b5cf6',
      },
      {
        id: '6',
        category: 'PhysicalDisk',
        name: '% Disk Time',
        instance: '_Total',
        description:
          'The percentage of elapsed time that the disk drive was busy servicing read or write requests',
        value: 0,
        unit: '%',
        enabled: false,
        color: '#ec4899',
      },
    ];

    setPerformanceCounters(defaultCounters);
    setSelectedCounters(new Set(defaultCounters.filter(c => c.enabled).map(c => c.id)));
  }, []);

  // Start new performance session
  const startNewSession = useCallback(
    (applicationPath: string, mode: ProfilingMode) => {
      const newSession: PerformanceSession = {
        id: `session_${Date.now()}`,
        name: `Session ${sessions.length + 1}`,
        applicationPath,
        profilingMode: mode,
        startTime: new Date(),
        duration: 0,
        status: 'Recording',
        metrics: generateInitialMetrics(),
        functions: [],
        memoryAnalysis: {
          totalAllocated: 0,
          totalFreed: 0,
          currentUsage: 0,
          peakUsage: 0,
          allocations: [],
          leaks: [],
          heapFragmentation: 0,
          gcCollections: 0,
        },
        events: [
          {
            timestamp: new Date(),
            type: 'Performance',
            description: 'Performance session started',
            severity: 'Info',
          },
        ],
        recommendations: [],
      };

      setSessions(prev => [...prev, newSession]);
      setCurrentSession(newSession);
      setIsRecording(true);
      setShowNewSessionDialog(false);

      // Start recording timer
      recordingTimer.current = setInterval(() => {
        updateSessionData(newSession);
      }, 1000);

      onSessionChange?.(newSession);
    },
    [sessions, onSessionChange]
  );

  // Generate initial metrics
  const generateInitialMetrics = (): PerformanceMetric[] => [
    {
      id: 'cpu',
      name: 'CPU Usage',
      type: MetricType.CPU,
      value: 0,
      unit: '%',
      threshold: { warning: 70, critical: 90 },
      history: [],
      trend: 'stable',
      level: PerformanceLevel.Good,
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      type: MetricType.Memory,
      value: 0,
      unit: 'MB',
      threshold: { warning: 500, critical: 1000 },
      history: [],
      trend: 'stable',
      level: PerformanceLevel.Good,
    },
    {
      id: 'diskio',
      name: 'Disk I/O',
      type: MetricType.DiskIO,
      value: 0,
      unit: 'KB/s',
      threshold: { warning: 1000, critical: 5000 },
      history: [],
      trend: 'stable',
      level: PerformanceLevel.Good,
    },
  ];

  // Update session data with simulated performance data
  const updateSessionData = useCallback((session: PerformanceSession) => {
    setCurrentSession(prev => {
      if (!prev || prev.id !== session.id) return prev;

      const now = new Date();
      const updatedMetrics = prev.metrics.map(metric => {
        // Simulate realistic performance data
        let newValue = metric.value;
        switch (metric.type) {
          case MetricType.CPU:
            newValue = Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 10));
            break;
          case MetricType.Memory:
            newValue = Math.max(0, metric.value + (Math.random() - 0.3) * 50);
            break;
          case MetricType.DiskIO:
            newValue = Math.max(0, metric.value + (Math.random() - 0.5) * 200);
            break;
        }

        const level =
          newValue >= metric.threshold.critical
            ? PerformanceLevel.Critical
            : newValue >= metric.threshold.warning
              ? PerformanceLevel.Poor
              : newValue >= metric.threshold.warning * 0.7
                ? PerformanceLevel.Fair
                : newValue >= metric.threshold.warning * 0.4
                  ? PerformanceLevel.Good
                  : PerformanceLevel.Excellent;

        const trend =
          newValue > metric.value + 5 ? 'up' : newValue < metric.value - 5 ? 'down' : 'stable';

        return {
          ...metric,
          value: newValue,
          level,
          trend,
          history: [
            ...metric.history.slice(-59), // Keep last 60 points
            { timestamp: now, value: newValue },
          ],
        };
      });

      // Update function profiling data
      const updatedFunctions =
        prev.functions.length === 0
          ? generateSampleFunctions()
          : prev.functions.map(func => ({
              ...func,
              callCount: func.callCount + Math.floor(Math.random() * 10),
              totalTime: func.totalTime + Math.random() * 100,
            }));

      return {
        ...prev,
        duration: now.getTime() - prev.startTime.getTime(),
        metrics: updatedMetrics,
        functions: updatedFunctions,
      };
    });
  }, []);

  // Generate sample function data
  const generateSampleFunctions = (): FunctionProfile[] => [
    {
      id: '1',
      name: 'Form1_Load',
      module: 'Form1',
      fileName: 'Form1.frm',
      lineNumber: 45,
      callCount: 1,
      totalTime: 150,
      averageTime: 150,
      minTime: 150,
      maxTime: 150,
      exclusiveTime: 50,
      inclusiveTime: 150,
      percentage: 25.5,
      callers: [],
      callees: [
        { name: 'InitializeControls', callCount: 1, time: 75 },
        { name: 'LoadUserSettings', callCount: 1, time: 25 },
      ],
      hotspots: [
        { lineNumber: 50, hitCount: 1, time: 75 },
        { lineNumber: 55, hitCount: 1, time: 25 },
      ],
    },
    {
      id: '2',
      name: 'InitializeControls',
      module: 'Form1',
      fileName: 'Form1.frm',
      lineNumber: 120,
      callCount: 1,
      totalTime: 75,
      averageTime: 75,
      minTime: 75,
      maxTime: 75,
      exclusiveTime: 75,
      inclusiveTime: 75,
      percentage: 12.8,
      callers: [{ name: 'Form1_Load', callCount: 1, time: 75 }],
      callees: [],
      hotspots: [
        { lineNumber: 125, hitCount: 1, time: 30 },
        { lineNumber: 130, hitCount: 1, time: 45 },
      ],
    },
    {
      id: '3',
      name: 'DatabaseQuery',
      module: 'DataModule',
      fileName: 'DataModule.bas',
      lineNumber: 200,
      callCount: 5,
      totalTime: 250,
      averageTime: 50,
      minTime: 35,
      maxTime: 85,
      exclusiveTime: 200,
      inclusiveTime: 250,
      percentage: 42.6,
      callers: [
        { name: 'LoadData', callCount: 3, time: 150 },
        { name: 'SaveData', callCount: 2, time: 100 },
      ],
      callees: [
        { name: 'OpenConnection', callCount: 5, time: 25 },
        { name: 'ExecuteSQL', callCount: 5, time: 25 },
      ],
      hotspots: [
        { lineNumber: 205, hitCount: 5, time: 125 },
        { lineNumber: 220, hitCount: 5, time: 75 },
      ],
    },
  ];

  // Stop recording session
  const stopRecording = useCallback(() => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    setCurrentSession(prev => {
      if (!prev) return prev;

      const updatedSession = {
        ...prev,
        status: 'Complete' as const,
        endTime: new Date(),
        recommendations: generateRecommendations(prev),
      };

      setSessions(prevSessions => prevSessions.map(s => (s.id === prev.id ? updatedSession : s)));

      return updatedSession;
    });

    setIsRecording(false);
  }, []);

  // Generate performance recommendations
  const generateRecommendations = (session: PerformanceSession) => {
    const recommendations = [];

    // CPU usage recommendations
    const cpuMetric = session.metrics.find(m => m.type === MetricType.CPU);
    if (cpuMetric && cpuMetric.value > cpuMetric.threshold.warning) {
      recommendations.push({
        category: 'CPU Performance',
        issue: 'High CPU usage detected',
        impact: 'High' as const,
        recommendation:
          'Consider optimizing CPU-intensive operations or implementing background processing',
        codeLocation: {
          file: 'Form1.frm',
          line: 150,
          function: 'ProcessData',
        },
      });
    }

    // Memory recommendations
    const memoryMetric = session.metrics.find(m => m.type === MetricType.Memory);
    if (memoryMetric && memoryMetric.value > memoryMetric.threshold.warning) {
      recommendations.push({
        category: 'Memory Usage',
        issue: 'High memory consumption',
        impact: 'Medium' as const,
        recommendation: 'Review object lifecycle and implement proper disposal patterns',
        codeLocation: {
          file: 'DataModule.bas',
          line: 75,
          function: 'LoadLargeDataset',
        },
      });
    }

    // Function performance recommendations
    const slowFunctions = session.functions.filter(f => f.averageTime > 100);
    slowFunctions.forEach(func => {
      recommendations.push({
        category: 'Function Performance',
        issue: `Function ${func.name} has high execution time`,
        impact: 'Medium' as const,
        recommendation: 'Profile this function to identify bottlenecks and optimize critical paths',
        codeLocation: {
          file: func.fileName,
          line: func.lineNumber,
          function: func.name,
        },
      });
    });

    return recommendations;
  };

  // Export session data
  const exportSession = useCallback(
    (format: 'HTML' | 'XML' | 'CSV') => {
      if (!currentSession) return;

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (format) {
        case 'HTML':
          content = generateHTMLReport(currentSession);
          filename = `performance_report_${currentSession.id}.html`;
          mimeType = 'text/html';
          break;
        case 'XML':
          content = generateXMLReport(currentSession);
          filename = `performance_report_${currentSession.id}.xml`;
          mimeType = 'text/xml';
          break;
        case 'CSV':
          content = generateCSVReport(currentSession);
          filename = `performance_report_${currentSession.id}.csv`;
          mimeType = 'text/csv';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      onExport?.(currentSession, format);
    },
    [currentSession, onExport]
  );

  // Generate HTML report
  const generateHTMLReport = (session: PerformanceSession): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - ${session.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric-excellent { color: #10b981; }
        .metric-good { color: #3b82f6; }
        .metric-fair { color: #f59e0b; }
        .metric-poor { color: #ef4444; }
        .metric-critical { color: #dc2626; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Performance Report: ${session.name}</h1>
    <p><strong>Application:</strong> ${session.applicationPath}</p>
    <p><strong>Start Time:</strong> ${session.startTime.toLocaleString()}</p>
    <p><strong>Duration:</strong> ${Math.round(session.duration / 1000)}s</p>
    
    <h2>Performance Metrics</h2>
    <table>
        <tr><th>Metric</th><th>Value</th><th>Unit</th><th>Level</th></tr>
        ${session.metrics
          .map(
            metric =>
              `<tr>
            <td>${metric.name}</td>
            <td>${metric.value.toFixed(2)}</td>
            <td>${metric.unit}</td>
            <td class="metric-${metric.level.toLowerCase()}">${metric.level}</td>
          </tr>`
          )
          .join('')}
    </table>
    
    <h2>Function Profiling</h2>
    <table>
        <tr><th>Function</th><th>Calls</th><th>Total Time (ms)</th><th>Avg Time (ms)</th><th>Percentage</th></tr>
        ${session.functions
          .map(
            func =>
              `<tr>
            <td>${func.name}</td>
            <td>${func.callCount}</td>
            <td>${func.totalTime.toFixed(2)}</td>
            <td>${func.averageTime.toFixed(2)}</td>
            <td>${func.percentage.toFixed(1)}%</td>
          </tr>`
          )
          .join('')}
    </table>
</body>
</html>`;
  };

  // Generate XML report
  const generateXMLReport = (session: PerformanceSession): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<PerformanceReport>
    <Session id="${session.id}" name="${session.name}">
        <Application>${session.applicationPath}</Application>
        <StartTime>${session.startTime.toISOString()}</StartTime>
        <Duration>${session.duration}</Duration>
        <Status>${session.status}</Status>
        
        <Metrics>
            ${session.metrics
              .map(
                metric =>
                  `<Metric type="${metric.type}" name="${metric.name}" value="${metric.value}" unit="${metric.unit}" level="${metric.level}" />`
              )
              .join('')}
        </Metrics>
        
        <Functions>
            ${session.functions
              .map(
                func =>
                  `<Function name="${func.name}" calls="${func.callCount}" totalTime="${func.totalTime}" avgTime="${func.averageTime}" percentage="${func.percentage}" />`
              )
              .join('')}
        </Functions>
    </Session>
</PerformanceReport>`;
  };

  // Generate CSV report
  const generateCSVReport = (session: PerformanceSession): string => {
    let csv = 'Function Name,Call Count,Total Time (ms),Average Time (ms),Percentage\n';
    session.functions.forEach(func => {
      csv += `"${func.name}",${func.callCount},${func.totalTime.toFixed(2)},${func.averageTime.toFixed(2)},${func.percentage.toFixed(1)}\n`;
    });
    return csv;
  };

  // Filter functions based on search text
  const filteredFunctions =
    currentSession?.functions
      .filter(
        func =>
          func.name.toLowerCase().includes(filterText.toLowerCase()) ||
          func.module.toLowerCase().includes(filterText.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'totalTime':
            return b.totalTime - a.totalTime;
          case 'callCount':
            return b.callCount - a.callCount;
          case 'averageTime':
            return b.averageTime - a.averageTime;
          default:
            return 0;
        }
      }) || [];

  const renderOverviewTab = () => (
    <div className="p-4 space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentSession?.metrics.map(metric => (
          <div key={metric.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">{metric.name}</h3>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  metric.level === PerformanceLevel.Excellent
                    ? 'bg-green-100 text-green-800'
                    : metric.level === PerformanceLevel.Good
                      ? 'bg-blue-100 text-blue-800'
                      : metric.level === PerformanceLevel.Fair
                        ? 'bg-yellow-100 text-yellow-800'
                        : metric.level === PerformanceLevel.Poor
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                }`}
              >
                {metric.level}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {metric.value.toFixed(1)} {metric.unit}
              </span>
              <span
                className={`text-sm ${
                  metric.trend === 'up'
                    ? 'text-red-500'
                    : metric.trend === 'down'
                      ? 'text-green-500'
                      : 'text-gray-500'
                }`}
              >
                {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Warning: {metric.threshold.warning} {metric.unit}, Critical:{' '}
              {metric.threshold.critical} {metric.unit}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Performance Timeline</h3>
          <div className="flex gap-2">
            {['1m', '5m', '15m', '1h'].map(range => (
              <button
                key={range}
                onClick={() => setChartTimeRange(range as any)}
                className={`px-3 py-1 text-sm rounded ${
                  chartTimeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <canvas
          ref={chartCanvas}
          width={800}
          height={300}
          className="w-full h-64 border border-gray-200 rounded"
        />
      </div>

      {/* Session Info */}
      {currentSession && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Session Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Application:</span>
              <span className="ml-2 text-gray-600">{currentSession.applicationPath}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Profiling Mode:</span>
              <span className="ml-2 text-gray-600">{currentSession.profilingMode}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Start Time:</span>
              <span className="ml-2 text-gray-600">
                {currentSession.startTime.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration:</span>
              <span className="ml-2 text-gray-600">
                {Math.round(currentSession.duration / 1000)}s
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  currentSession.status === 'Recording'
                    ? 'bg-red-100 text-red-800'
                    : currentSession.status === 'Complete'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {currentSession.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFunctionsTab = () => (
    <div className="p-4">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Function Profiling</h3>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="totalTime">Sort by Total Time</option>
                <option value="callCount">Sort by Call Count</option>
                <option value="averageTime">Sort by Average Time</option>
              </select>
              <input
                type="text"
                placeholder="Filter functions..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Function
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Module
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Calls
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Time
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Time
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  %
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFunctions.map(func => (
                <tr key={func.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{func.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{func.module}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{func.callCount}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{func.totalTime.toFixed(2)}ms</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {func.averageTime.toFixed(2)}ms
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, func.percentage)}%` }}
                        />
                      </div>
                      {func.percentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 text-xs">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFunctions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {currentSession
              ? 'No functions match the current filter'
              : 'No profiling data available'}
          </div>
        )}
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Memory Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Memory Overview</h3>
          {currentSession?.memoryAnalysis && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Usage:</span>
                <span className="text-sm font-medium">
                  {(currentSession.memoryAnalysis.currentUsage / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Peak Usage:</span>
                <span className="text-sm font-medium">
                  {(currentSession.memoryAnalysis.peakUsage / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Allocated:</span>
                <span className="text-sm font-medium">
                  {(currentSession.memoryAnalysis.totalAllocated / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Freed:</span>
                <span className="text-sm font-medium">
                  {(currentSession.memoryAnalysis.totalFreed / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Heap Fragmentation:</span>
                <span className="text-sm font-medium">
                  {currentSession.memoryAnalysis.heapFragmentation.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Memory Leaks */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Memory Leaks</h3>
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">✅</div>
            <p>No memory leaks detected</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCountersTab = () => (
    <div className="p-4">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Performance Counters</h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {performanceCounters.map(counter => (
              <div
                key={counter.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCounters.has(counter.id)}
                    onChange={e => {
                      const newSelected = new Set(selectedCounters);
                      if (e.target.checked) {
                        newSelected.add(counter.id);
                      } else {
                        newSelected.delete(counter.id);
                      }
                      setSelectedCounters(newSelected);
                    }}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {counter.category}: {counter.name}
                      {counter.instance && ` (${counter.instance})`}
                    </div>
                    <div className="text-xs text-gray-500">{counter.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {counter.value.toFixed(1)} {counter.unit}
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: counter.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="p-4">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Performance Recommendations</h3>
        </div>

        <div className="p-4">
          {currentSession?.recommendations.length ? (
            <div className="space-y-4">
              {currentSession.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          rec.impact === 'High'
                            ? 'bg-red-100 text-red-800'
                            : rec.impact === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rec.impact} Impact
                      </span>
                      <span className="text-sm font-medium text-gray-900">{rec.category}</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">{rec.issue}</h4>
                  <p className="text-sm text-gray-600 mb-3">{rec.recommendation}</p>
                  {rec.codeLocation && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Location: {rec.codeLocation.file}:{rec.codeLocation.line} in{' '}
                      {rec.codeLocation.function}()
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>No performance issues detected</p>
              <p className="text-sm mt-1">Complete a profiling session to get recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Application Performance Explorer
            </h1>
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-600 font-medium">Recording</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={() => setShowNewSessionDialog(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Start Profiling
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Recording
              </button>
            )}

            {currentSession && (
              <div className="flex gap-1">
                <button
                  onClick={() => exportSession('HTML')}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Export HTML
                </button>
                <button
                  onClick={() => exportSession('CSV')}
                  className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'functions', label: 'Functions', icon: '⚡' },
            { id: 'memory', label: 'Memory', icon: '🧠' },
            { id: 'counters', label: 'Counters', icon: '📈' },
            { id: 'recommendations', label: 'Recommendations', icon: '💡' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!currentSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Session</h2>
              <p className="text-gray-600 mb-4">
                Start a performance profiling session to analyze your application
              </p>
              <button
                onClick={() => setShowNewSessionDialog(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Start New Session
              </button>
            </div>
          </div>
        ) : (
          <>
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'functions' && renderFunctionsTab()}
            {selectedTab === 'memory' && renderMemoryTab()}
            {selectedTab === 'counters' && renderCountersTab()}
            {selectedTab === 'recommendations' && renderRecommendationsTab()}
          </>
        )}
      </div>

      {/* New Session Dialog */}
      {showNewSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">New Performance Session</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Path
                </label>
                <input
                  type="text"
                  value={selectedApplication}
                  onChange={e => setSelectedApplication(e.target.value)}
                  placeholder="C:\\MyApp\\MyApp.exe"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profiling Mode
                </label>
                <select
                  value={selectedProfilingMode}
                  onChange={e => setSelectedProfilingMode(e.target.value as ProfilingMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(ProfilingMode).map(mode => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewSessionDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => startNewSession(selectedApplication, selectedProfilingMode)}
                disabled={!selectedApplication.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationPerformanceExplorer;
