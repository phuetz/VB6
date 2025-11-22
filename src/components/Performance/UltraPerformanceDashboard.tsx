/**
 * ULTRA-OPTIMIZED PERFORMANCE DASHBOARD
 * Monitoring avancé des performances avec métriques temps réel
 * Détection proactive des goulots d'étranglement et fuites mémoire
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '../../stores/UIStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import {
  Activity,
  Cpu,
  MemoryStick,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  Gauge,
  BarChart3,
  X,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

// ULTRA-OPTIMIZE: Types pour les métriques de performance
interface PerformanceMetric {
  timestamp: number;
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: number;
  bundleSize: number;
  componentsLoaded: number;
  storeUpdates: number;
  networkRequests: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: number;
  action?: () => void;
}

// ULTRA-OPTIMIZE: Hook de monitoring des performances
function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const fpsCounter = useRef({ frames: 0, lastTime: 0 });

  // ULTRA-OPTIMIZE: Calcul FPS optimisé
  const measureFPS = () => {
    return new Promise<number>((resolve) => {
      let frames = 0;
      const startTime = performance.now();
      
      const countFrame = () => {
        frames++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frames);
        }
      };
      
      requestAnimationFrame(countFrame);
    });
  };

  // ULTRA-OPTIMIZE: Collecte de métriques
  const collectMetrics = async (): Promise<PerformanceMetric> => {
    const now = performance.now();
    
    // FPS
    const fps = await measureFPS();
    
    // Mémoire
    const memory = (performance as any).memory || { usedJSHeapSize: 0, totalJSHeapSize: 0 };
    const memoryUsed = memory.usedJSHeapSize / 1024 / 1024; // MB
    const memoryTotal = memory.totalJSHeapSize / 1024 / 1024; // MB
    
    // Bundle size (estimation)
    const bundleSize = document.querySelectorAll('script[src]').length * 0.5; // MB estimation
    
    // Composants chargés
    const componentsLoaded = document.querySelectorAll('[data-react-component]').length;
    
    return {
      timestamp: now,
      fps,
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: (memoryUsed / memoryTotal) * 100
      },
      renderTime: 0, // Sera calculé par le profiler
      bundleSize,
      componentsLoaded,
      storeUpdates: 0, // À implémenter avec les stores
      networkRequests: 0 // À implémenter avec l'intercepteur
    };
  };

  // ULTRA-OPTIMIZE: Détection d'alertes
  const checkForAlerts = (metric: PerformanceMetric) => {
    const newAlerts: PerformanceAlert[] = [];
    
    // FPS trop bas
    if (metric.fps < 30) {
      newAlerts.push({
        id: `fps-${Date.now()}`,
        type: 'warning',
        title: 'Low FPS Detected',
        description: `Current FPS: ${metric.fps}. Consider optimizing renders.`,
        timestamp: Date.now()
      });
    }
    
    // Mémoire élevée
    if (metric.memory.percentage > 80) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'error',
        title: 'High Memory Usage',
        description: `Memory usage: ${metric.memory.percentage.toFixed(1)}%. Risk of memory leak.`,
        timestamp: Date.now(),
        action: () => {
          // Suggérer un garbage collection
          if ((window as any).gc) {
            (window as any).gc();
          }
        }
      });
    }
    
    // Trop de composants
    if (metric.componentsLoaded > 100) {
      newAlerts.push({
        id: `components-${Date.now()}`,
        type: 'info',
        title: 'Many Components Loaded',
        description: `${metric.componentsLoaded} components active. Consider lazy loading.`,
        timestamp: Date.now()
      });
    }
    
    setAlerts(prev => [...prev.slice(-10), ...newAlerts]); // Garder les 10 dernières
  };

  // Démarrer/arrêter le monitoring
  const startMonitoring = () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    intervalRef.current = setInterval(async () => {
      try {
        const metric = await collectMetrics();
        setMetrics(prev => [...prev.slice(-50), metric]); // Garder les 50 dernières
        checkForAlerts(metric);
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      }
    }, 1000); // Collecte chaque seconde
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts: () => setAlerts([]),
    clearMetrics: () => setMetrics([])
  };
}

// ULTRA-OPTIMIZE: Composant de graphique de performance
interface PerformanceChartProps {
  metrics: PerformanceMetric[];
  type: 'fps' | 'memory' | 'renderTime';
  height?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ metrics, type, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Get data based on type
    const data = metrics.map(m => {
      switch (type) {
        case 'fps': return m.fps;
        case 'memory': return m.memory.percentage;
        case 'renderTime': return m.renderTime;
        default: return 0;
      }
    });

    if (data.length === 0) return;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (canvasHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = type === 'fps' ? '#10b981' : type === 'memory' ? '#f59e0b' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = (width / (data.length - 1)) * index;
      const y = canvasHeight - ((value - minValue) / range) * canvasHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw current value
    const currentValue = data[data.length - 1];
    const unit = type === 'fps' ? ' FPS' : type === 'memory' ? '%' : 'ms';
    ctx.fillStyle = '#374151';
    ctx.font = '12px monospace';
    ctx.fillText(`${currentValue.toFixed(1)}${unit}`, 10, 20);

  }, [metrics, type]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className="w-full border border-gray-200 rounded"
      style={{ height: `${height}px` }}
    />
  );
};

// ULTRA-OPTIMIZE: Dashboard principal
interface UltraPerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export const UltraPerformanceDashboard: React.FC<UltraPerformanceDashboardProps> = ({
  visible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'alerts' | 'optimization'>('overview');
  const { isMonitoring, startMonitoring, stopMonitoring, metrics, alerts, clearAlerts, clearMetrics } = usePerformanceMonitoring();

  // Auto-start monitoring when dashboard opens
  useEffect(() => {
    if (visible && !isMonitoring) {
      startMonitoring();
    }
  }, [visible, isMonitoring]);

  const currentMetric = metrics[metrics.length - 1];

  // ULTRA-OPTIMIZE: Calculs des statistiques
  const stats = useMemo(() => {
    if (metrics.length === 0) return null;

    const recent = metrics.slice(-10);
    const avgFps = recent.reduce((sum, m) => sum + m.fps, 0) / recent.length;
    const avgMemory = recent.reduce((sum, m) => sum + m.memory.percentage, 0) / recent.length;
    const memoryTrend = recent.length > 1 ? recent[recent.length - 1].memory.percentage - recent[0].memory.percentage : 0;

    return {
      avgFps: avgFps.toFixed(1),
      avgMemory: avgMemory.toFixed(1),
      memoryTrend,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.type === 'error').length
    };
  }, [metrics, alerts]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Gauge className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Ultra Performance Dashboard
            </h2>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isMonitoring 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {isMonitoring ? 'MONITORING' : 'STOPPED'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isMonitoring
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMonitoring ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'charts', label: 'Charts', icon: BarChart3 },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'optimization', label: 'Optimization', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'alerts' && alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1 rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* FPS */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">FPS</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentMetric?.fps.toFixed(0) || '0'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {stats?.avgFps || '0'}
                    </p>
                  </div>
                  <Activity className="text-green-600" size={24} />
                </div>
              </div>

              {/* Memory */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Memory</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentMetric?.memory.percentage.toFixed(1) || '0'}%
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      {stats?.memoryTrend ? (
                        <>
                          {stats.memoryTrend > 0 ? (
                            <TrendingUp className="text-red-500 mr-1" size={12} />
                          ) : (
                            <TrendingDown className="text-green-500 mr-1" size={12} />
                          )}
                          {Math.abs(stats.memoryTrend).toFixed(1)}%
                        </>
                      ) : '0%'}
                    </p>
                  </div>
                  <MemoryStick className="text-amber-600" size={24} />
                </div>
              </div>

              {/* Components */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Components</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentMetric?.componentsLoaded || '0'}
                    </p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <Eye className="text-blue-600" size={24} />
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alerts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalAlerts || '0'}
                    </p>
                    <p className="text-xs text-red-500">
                      {stats?.criticalAlerts || '0'} critical
                    </p>
                  </div>
                  <AlertTriangle 
                    className={stats?.criticalAlerts ? 'text-red-600' : 'text-gray-400'} 
                    size={24} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">FPS Over Time</h3>
                  <PerformanceChart metrics={metrics} type="fps" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Memory Usage</h3>
                  <PerformanceChart metrics={metrics} type="memory" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Performance Alerts</h3>
                <button
                  onClick={clearAlerts}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Clear All
                </button>
              </div>
              
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto mb-2" size={48} />
                  <p>No performance alerts</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'error' 
                        ? 'bg-red-50 border-red-500 dark:bg-red-900/20'
                        : alert.type === 'warning'
                        ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/20'
                        : 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {alert.action && (
                        <button
                          onClick={alert.action}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Fix
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Performance Optimization Tips</h3>
              
              <div className="grid gap-4">
                {/* Bundle Size */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium flex items-center">
                    <Download className="mr-2" size={16} />
                    Bundle Size Optimization
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Current bundle: ~{currentMetric?.bundleSize.toFixed(1) || '0'}MB
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Use lazy loading for heavy components</li>
                    <li>• Configure Monaco Editor to load only VB6 language</li>
                    <li>• Enable tree shaking and dead code elimination</li>
                  </ul>
                </div>

                {/* Memory */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-medium flex items-center">
                    <MemoryStick className="mr-2" size={16} />
                    Memory Management
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Current usage: {currentMetric?.memory.used.toFixed(1) || '0'}MB
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Clean up event listeners and timeouts</li>
                    <li>• Use React.memo for expensive components</li>
                    <li>• Implement virtual scrolling for large lists</li>
                  </ul>
                </div>

                {/* Rendering */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium flex items-center">
                    <Zap className="mr-2" size={16} />
                    Render Performance
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Current FPS: {currentMetric?.fps.toFixed(0) || '0'}
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Use Zustand shallow selectors</li>
                    <li>• Debounce expensive operations</li>
                    <li>• Optimize alignment guide calculations</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UltraPerformanceDashboard;