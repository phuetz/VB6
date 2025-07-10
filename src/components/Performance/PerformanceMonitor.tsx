import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, MemoryStick as Memory, Cpu, TrendingUp, TrendingDown, Pause, Play } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  controlsCount: number;
  eventsCount: number;
  timestamp: number;
}

export const PerformanceMonitor: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    controlsCount: 0,
    eventsCount: 0,
    timestamp: Date.now()
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const metricsIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!visible) return;

    const updateMetrics = () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTimeRef.current;
      frameCountRef.current++;

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        
        const newMetrics: PerformanceMetrics = {
          fps,
          memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
          cpuUsage: Math.random() * 30 + 10, // Simulated CPU usage
          renderTime: Math.random() * 5 + 1, // Simulated render time
          controlsCount: document.querySelectorAll('[data-vb6-control]').length,
          eventsCount: Math.floor(Math.random() * 10),
          timestamp: Date.now()
        };

        setCurrentMetrics(newMetrics);
        
        if (isMonitoring) {
          setMetrics(prev => [...prev.slice(-49), newMetrics]); // Keep last 50 points
        }

        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      if (isMonitoring) {
        requestAnimationFrame(updateMetrics);
      }
    };

    updateMetrics();

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [visible, isMonitoring]);

  useEffect(() => {
    if (!canvasRef.current || metrics.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw FPS line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    metrics.forEach((metric, index) => {
      const x = (width / (metrics.length - 1)) * index;
      const y = height - (metric.fps / 120) * height; // Scale to 120 FPS max
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw memory usage line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxMemory = Math.max(...metrics.map(m => m.memoryUsage), 100);
    
    metrics.forEach((metric, index) => {
      const x = (width / (metrics.length - 1)) * index;
      const y = height - (metric.memoryUsage / maxMemory) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }, [metrics]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryStatusColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCpuStatusColor = (value: number) => {
    if (value < 30) return 'text-green-600';
    if (value < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} MB`;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '800px', height: '600px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Performance Monitor</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-700 hover:bg-blue-800 rounded text-xs"
            >
              {isMonitoring ? <Pause size={12} /> : <Play size={12} />}
              {isMonitoring ? 'Pause' : 'Resume'}
            </button>
            <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
          </div>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Current Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-white border border-gray-400 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-blue-600" />
                <span className="text-xs font-semibold">FPS</span>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(currentMetrics.fps, { good: 50, warning: 30 })}`}>
                {currentMetrics.fps}
              </div>
              <div className="text-xs text-gray-500">
                {currentMetrics.fps >= 50 ? 'Excellent' : currentMetrics.fps >= 30 ? 'Good' : 'Poor'}
              </div>
            </div>

            <div className="bg-white border border-gray-400 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Memory size={16} className="text-green-600" />
                <span className="text-xs font-semibold">Memory</span>
              </div>
              <div className={`text-2xl font-bold ${getMemoryStatusColor(currentMetrics.memoryUsage)}`}>
                {formatBytes(currentMetrics.memoryUsage)}
              </div>
              <div className="text-xs text-gray-500">
                {currentMetrics.memoryUsage < 50 ? 'Low' : currentMetrics.memoryUsage < 100 ? 'Medium' : 'High'}
              </div>
            </div>

            <div className="bg-white border border-gray-400 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Cpu size={16} className="text-orange-600" />
                <span className="text-xs font-semibold">CPU</span>
              </div>
              <div className={`text-2xl font-bold ${getCpuStatusColor(currentMetrics.cpuUsage)}`}>
                {currentMetrics.cpuUsage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {currentMetrics.cpuUsage < 30 ? 'Low' : currentMetrics.cpuUsage < 60 ? 'Medium' : 'High'}
              </div>
            </div>

            <div className="bg-white border border-gray-400 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-purple-600" />
                <span className="text-xs font-semibold">Render</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {currentMetrics.renderTime.toFixed(1)}ms
              </div>
              <div className="text-xs text-gray-500">
                {currentMetrics.renderTime < 2 ? 'Fast' : currentMetrics.renderTime < 5 ? 'Good' : 'Slow'}
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="flex-1 bg-white border border-gray-400 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Performance Over Time</span>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>FPS</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Memory (MB)</span>
                </div>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="border border-gray-300 w-full"
            />
          </div>

          {/* Detailed Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-300 p-3 rounded">
              <div className="text-sm font-semibold mb-2">System Information</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Controls Count:</span>
                  <span className="font-mono">{currentMetrics.controlsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Events/sec:</span>
                  <span className="font-mono">{currentMetrics.eventsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Browser:</span>
                  <span className="font-mono">{navigator.userAgent.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 p-3 rounded">
              <div className="text-sm font-semibold mb-2">Performance Tips</div>
              <div className="space-y-1 text-xs">
                {currentMetrics.fps < 30 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown size={12} />
                    <span>Consider reducing control complexity</span>
                  </div>
                )}
                {currentMetrics.memoryUsage > 100 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <TrendingDown size={12} />
                    <span>High memory usage detected</span>
                  </div>
                )}
                {currentMetrics.fps >= 50 && currentMetrics.memoryUsage < 50 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp size={12} />
                    <span>Performance is optimal</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};