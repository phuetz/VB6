/**
 * VB6 IDE Performance Dashboard
 * 
 * Real-time performance monitoring and optimization dashboard
 * showing metrics, bottlenecks, and optimization recommendations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { performanceOptimizer } from '../../performance/PerformanceOptimizer';
import { useVB6Performance } from '../../stores/OptimizedVB6Store';

interface PerformanceData {
  timestamp: number;
  fps: number;
  memory: number;
  renderTime: number;
  compilationTime: number;
  controlCount: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [historicalData, setHistoricalData] = useState<PerformanceData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceData>('fps');
  const [autoOptimize, setAutoOptimize] = useState(false);
  
  const { renderMetrics, operationHistory, recordOperation } = useVB6Performance();
  
  // Real-time metrics
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    compilationTime: 0,
    controlCount: 0,
    bundleSize: 0
  });
  
  // Update real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = performanceOptimizer.getMetrics();
      setRealTimeMetrics({
        fps: metrics.fps,
        memory: metrics.memoryUsage,
        renderTime: metrics.renderTime,
        compilationTime: metrics.compilationTime,
        controlCount: metrics.controlCount,
        bundleSize: metrics.bundleSize
      });
      
      // Add to historical data
      setHistoricalData(prev => {
        const newData = {
          timestamp: Date.now(),
          fps: metrics.fps,
          memory: metrics.memoryUsage,
          renderTime: metrics.renderTime,
          compilationTime: metrics.compilationTime,
          controlCount: metrics.controlCount
        };
        
        const updated = [...prev, newData];
        // Keep only last 100 data points
        return updated.slice(-100);
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Performance analysis
  const performanceAnalysis = useMemo(() => {
    const recent = historicalData.slice(-10);
    if (recent.length === 0) return null;
    
    const avgFPS = recent.reduce((sum, d) => sum + d.fps, 0) / recent.length;
    const avgMemory = recent.reduce((sum, d) => sum + d.memory, 0) / recent.length;
    const avgRenderTime = recent.reduce((sum, d) => sum + d.renderTime, 0) / recent.length;
    
    const issues = [];
    const recommendations = [];
    
    if (avgFPS < 30) {
      issues.push('Low FPS detected');
      recommendations.push('Enable control virtualization');
      recommendations.push('Reduce complexity of form designer');
    }
    
    if (avgMemory > 500) {
      issues.push('High memory usage');
      recommendations.push('Clear compilation cache');
      recommendations.push('Reduce number of open tabs');
    }
    
    if (avgRenderTime > 16) {
      issues.push('Slow rendering detected');
      recommendations.push('Enable render throttling');
      recommendations.push('Use memoized components');
    }
    
    return {
      avgFPS: avgFPS.toFixed(1),
      avgMemory: avgMemory.toFixed(1),
      avgRenderTime: avgRenderTime.toFixed(2),
      issues,
      recommendations,
      score: Math.max(0, 100 - issues.length * 20)
    };
  }, [historicalData]);
  
  // Auto-optimization
  useEffect(() => {
    if (autoOptimize && performanceAnalysis) {
      if (performanceAnalysis.issues.length > 0) {
        performAutoOptimization();
      }
    }
  }, [performanceAnalysis, autoOptimize]);
  
  const performAutoOptimization = useCallback(() => {
    recordOperation('auto-optimization', 0, { 
      issues: performanceAnalysis?.issues || [] 
    });
    
    // Trigger garbage collection
    performanceOptimizer.performGarbageCollection();
    
    // Clear caches if memory is high
    if (realTimeMetrics.memory > 400) {
      performanceOptimizer.performGarbageCollection();
    }
  }, [performanceAnalysis, realTimeMetrics.memory, recordOperation]);
  
  // Manual optimization actions
  const handleClearCaches = useCallback(() => {
    performanceOptimizer.performGarbageCollection();
    recordOperation('manual-cache-clear', 0);
  }, [recordOperation]);
  
  const handleGenerateReport = useCallback(() => {
    const report = performanceOptimizer.generateReport();
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Report:', report);
    }
    
    // Create downloadable report
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vb6-performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);
  
  // Chart data for selected metric
  const chartData = useMemo(() => {
    return historicalData.map(data => ({
      x: data.timestamp,
      y: data[selectedMetric]
    }));
  }, [historicalData, selectedMetric]);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Performance Dashboard"
      >
        📊
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 max-w-6xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">VB6 IDE Performance Dashboard</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoOptimize}
                onChange={(e) => setAutoOptimize(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-optimize</span>
            </label>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 p-6 overflow-y-auto">
            {/* Real-time Metrics */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Real-time Metrics</h3>
              <div className="space-y-3">
                <MetricCard
                  label="FPS"
                  value={realTimeMetrics.fps}
                  unit=""
                  status={realTimeMetrics.fps >= 30 ? 'good' : realTimeMetrics.fps >= 15 ? 'warning' : 'critical'}
                  target={60}
                />
                <MetricCard
                  label="Memory"
                  value={realTimeMetrics.memory}
                  unit="MB"
                  status={realTimeMetrics.memory <= 200 ? 'good' : realTimeMetrics.memory <= 500 ? 'warning' : 'critical'}
                  target={200}
                />
                <MetricCard
                  label="Render Time"
                  value={realTimeMetrics.renderTime}
                  unit="ms"
                  status={realTimeMetrics.renderTime <= 8 ? 'good' : realTimeMetrics.renderTime <= 16 ? 'warning' : 'critical'}
                  target={8}
                />
                <MetricCard
                  label="Bundle Size"
                  value={realTimeMetrics.bundleSize / 1024 / 1024}
                  unit="MB"
                  status={realTimeMetrics.bundleSize <= 3 * 1024 * 1024 ? 'good' : 'warning'}
                  target={2.5}
                />
              </div>
            </div>
            
            {/* Performance Score */}
            {performanceAnalysis && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Performance Score</h3>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    performanceAnalysis.score >= 80 ? 'text-green-600' :
                    performanceAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {performanceAnalysis.score}
                  </div>
                  <div className="text-sm text-gray-600">out of 100</div>
                </div>
              </div>
            )}
            
            {/* Issues & Recommendations */}
            {performanceAnalysis && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Issues & Recommendations</h3>
                
                {performanceAnalysis.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-600 mb-2">Issues</h4>
                    <ul className="text-sm space-y-1">
                      {performanceAnalysis.issues.map((issue, index) => (
                        <li key={index} className="text-red-600">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {performanceAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {performanceAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-600">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleClearCaches}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Clear Caches
              </button>
              <button
                onClick={performAutoOptimization}
                className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Optimize Now
              </button>
              <button
                onClick={handleGenerateReport}
                className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Metric Selector */}
            <div className="mb-6">
              <div className="flex space-x-2">
                {(['fps', 'memory', 'renderTime', 'compilationTime'] as const).map(metric => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-4 py-2 rounded transition-colors ${
                      selectedMetric === metric
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chart */}
            <div className="bg-white border rounded-lg p-4 mb-6" style={{ height: '300px' }}>
              <PerformanceChart data={chartData} metric={selectedMetric} />
            </div>
            
            {/* Operation History */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Recent Operations</h3>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {operationHistory.slice(-20).reverse().map((operation, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{operation.type}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(operation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{operation.duration.toFixed(2)}ms</div>
                      {operation.details && (
                        <div className="text-xs text-gray-500">
                          {JSON.stringify(operation.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  label: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  target: number;
}> = ({ label, value, unit, status, target }) => {
  const percentage = (value / target) * 100;
  
  return (
    <div className="bg-white p-3 rounded border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className={`w-3 h-3 rounded-full ${
          status === 'good' ? 'bg-green-500' :
          status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></span>
      </div>
      <div className="text-lg font-bold">
        {value.toFixed(1)} {unit}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full transition-all ${
            status === 'good' ? 'bg-green-500' :
            status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Target: {target} {unit}
      </div>
    </div>
  );
};

// Simple Performance Chart Component
const PerformanceChart: React.FC<{
  data: { x: number; y: number }[];
  metric: string;
}> = ({ data, metric }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }
  
  const maxY = Math.max(...data.map(d => d.y)) || 1;
  const minY = Math.min(...data.map(d => d.y)) || 0;
  const range = maxY - minY || 1;
  
  return (
    <div className="relative h-full">
      <svg className="w-full h-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(percent => (
          <line
            key={percent}
            x1="0"
            y1={`${percent * 100}%`}
            x2="100%"
            y2={`${percent * 100}%`}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Data line */}
        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = ((maxY - point.y) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
        )}
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = ((maxY - point.y) / range) * 100;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill="#3b82f6"
            />
          );
        })}
      </svg>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-8">
        <span>{maxY.toFixed(1)}</span>
        <span>{(minY + range * 0.75).toFixed(1)}</span>
        <span>{(minY + range * 0.5).toFixed(1)}</span>
        <span>{(minY + range * 0.25).toFixed(1)}</span>
        <span>{minY.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default PerformanceDashboard;