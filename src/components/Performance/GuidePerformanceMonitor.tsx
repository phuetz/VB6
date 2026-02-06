// Ultra-Think Guide Performance Monitor
// Surveillance en temps réel des performances de virtualisation

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Eye, Target, Clock, Database } from 'lucide-react';
import { useGuidePerformanceMonitor } from '../../hooks/useVirtualizedGuides';

export interface GuidePerformanceMonitorProps {
  visible: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export const GuidePerformanceMonitor: React.FC<GuidePerformanceMonitorProps> = ({
  visible,
  onClose,
  position = 'top-right',
  compact = false,
}) => {
  const metrics = useGuidePerformanceMonitor();
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [expanded, setExpanded] = useState(!compact);

  // Monitor for performance issues
  useEffect(() => {
    const newAlerts: PerformanceAlert[] = [];

    // Check calculation time
    if (metrics.averageCalculationTime > 16) {
      // >16ms means <60fps
      newAlerts.push({
        id: 'calc-time',
        type: 'warning',
        message: `Slow calculations: ${metrics.averageCalculationTime.toFixed(1)}ms avg`,
        timestamp: Date.now(),
      });
    }

    // Check cache hit rate
    if (metrics.cacheHits / Math.max(metrics.totalCalculations, 1) < 0.5) {
      newAlerts.push({
        id: 'cache-rate',
        type: 'warning',
        message: `Low cache hit rate: ${((metrics.cacheHits / Math.max(metrics.totalCalculations, 1)) * 100).toFixed(1)}%`,
        timestamp: Date.now(),
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > 500) {
      newAlerts.push({
        id: 'memory',
        type: 'error',
        message: `High memory usage: ${metrics.memoryUsage} cached guides`,
        timestamp: Date.now(),
      });
    }

    // Update alerts (keep only recent ones)
    setAlerts(prev => {
      const recent = prev.filter(alert => Date.now() - alert.timestamp < 10000);
      const existingIds = new Set(recent.map(a => a.id));
      const uniqueNew = newAlerts.filter(alert => !existingIds.has(alert.id));
      return [...recent, ...uniqueNew];
    });
  }, [metrics]);

  if (!visible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number, decimals = 1) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 font-mono text-xs transition-all duration-300 ${
        expanded ? 'w-80' : 'w-48'
      }`}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} />
          <span className="font-semibold">Guide Performance</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <Target size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200">
          {alerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`flex items-center gap-2 text-xs ${
                alert.type === 'error'
                  ? 'text-red-600'
                  : alert.type === 'warning'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  alert.type === 'error'
                    ? 'bg-red-500'
                    : alert.type === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                }`}
              />
              <span className="truncate">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="p-3 space-y-3">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <Clock size={10} />
              <span className="text-gray-600">Calc Time</span>
            </div>
            <div
              className={`font-bold ${getPerformanceColor(metrics.averageCalculationTime, { good: 8, warning: 16 })}`}
            >
              {metrics.averageCalculationTime.toFixed(1)}ms
            </div>
          </div>

          <div className="bg-gray-50 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <Zap size={10} />
              <span className="text-gray-600">Cache Hit</span>
            </div>
            <div
              className={`font-bold ${getPerformanceColor(
                100 - (metrics.cacheHits / Math.max(metrics.totalCalculations, 1)) * 100,
                { good: 20, warning: 50 }
              )}`}
            >
              {((metrics.cacheHits / Math.max(metrics.totalCalculations, 1)) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {expanded && (
          <>
            {/* Detailed Metrics */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Controls:</span>
                <span className="font-semibold">{formatNumber(metrics.peakControlCount, 0)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Calculations:</span>
                <span className="font-semibold">{formatNumber(metrics.totalCalculations, 0)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Memory Usage:</span>
                <span
                  className={`font-semibold ${getPerformanceColor(metrics.memoryUsage, { good: 100, warning: 300 })}`}
                >
                  {metrics.memoryUsage} guides
                </span>
              </div>
            </div>

            {/* Performance Graph (simplified) */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 mb-2">
                <Activity size={10} />
                <span className="text-gray-600">Performance Trend</span>
              </div>

              <div className="flex items-end justify-between h-8 bg-gray-100 rounded px-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const height = Math.random() * 24 + 4; // Simulated performance data
                  const color =
                    height > 20 ? 'bg-red-400' : height > 12 ? 'bg-yellow-400' : 'bg-green-400';
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-t ${color}`}
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0ms</span>
                <span>16ms</span>
                <span>32ms+</span>
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 mb-2">
                <Eye size={10} />
                <span className="text-gray-600">Tips</span>
              </div>

              <ul className="space-y-1 text-xs text-gray-600">
                {metrics.averageCalculationTime > 16 && (
                  <li className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span>
                    <span>Reduce control count or zoom out</span>
                  </li>
                )}
                {metrics.cacheHits / Math.max(metrics.totalCalculations, 1) < 0.5 && (
                  <li className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span>Move controls less frequently</span>
                  </li>
                )}
                {metrics.memoryUsage > 300 && (
                  <li className="flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    <span>Clear cache or restart session</span>
                  </li>
                )}
                {alerts.length === 0 && (
                  <li className="flex items-start gap-1">
                    <span className="text-green-500">•</span>
                    <span>Performance is optimal</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  // Clear cache action would go here
                  if (process.env.NODE_ENV === 'development') {
                    // noop
                  }
                }}
                className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Clear Cache
              </button>
              <button
                onClick={() => {
                  // Reset metrics action would go here
                  if (process.env.NODE_ENV === 'development') {
                    // noop
                  }
                }}
                className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GuidePerformanceMonitor;
