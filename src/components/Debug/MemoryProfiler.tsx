import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  memoryManager, 
  MemoryMetrics, 
  MemoryLeak 
} from '../../services/MemoryManagementService';
import { 
  Activity, 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';

interface MemoryProfilerProps {
  className?: string;
}

const MemoryProfiler: React.FC<MemoryProfilerProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
  const [history, setHistory] = useState<MemoryMetrics[]>([]);
  const [leaks, setLeaks] = useState<MemoryLeak[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start monitoring
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = memoryManager.getMemoryUsage();
      setMetrics(currentMetrics);
      
      memoryManager.trackMemoryUsage();
      const historyData = memoryManager.getMemoryHistory();
      setHistory(historyData);
      
      // Update suggestions periodically
      const newSuggestions = memoryManager.getOptimizationSuggestions();
      setSuggestions(newSuggestions);
    };

    // Initial update
    updateMetrics();

    // Update every second
    intervalRef.current = window.setInterval(updateMetrics, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Draw memory usage chart
  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 20;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // Find min/max values
    const maxHeap = Math.max(...history.map(m => m.heapUsed));
    const minHeap = Math.min(...history.map(m => m.heapUsed));

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw data
    if (history.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      history.forEach((metric, index) => {
        const x = padding + (width * index) / (history.length - 1);
        const y = padding + height - ((metric.heapUsed - minHeap) / (maxHeap - minHeap)) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      ctx.fillStyle = '#3b82f6';
      history.forEach((metric, index) => {
        const x = padding + (width * index) / (history.length - 1);
        const y = padding + height - ((metric.heapUsed - minHeap) / (maxHeap - minHeap)) * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minHeap + ((maxHeap - minHeap) * (5 - i)) / 5;
      const y = padding + (height * i) / 5;
      ctx.fillText(formatBytes(value), padding - 5, y + 3);
    }
  }, [history]);

  // Detect memory leaks
  const handleDetectLeaks = useCallback(() => {
    const detectedLeaks = memoryManager.detectMemoryLeaks();
    setLeaks(detectedLeaks);
  }, []);

  // Optimize memory
  const handleOptimize = useCallback(async () => {
    setIsOptimizing(true);
    
    // Run optimization
    const freedBytes = memoryManager.optimizeMemory();
    
    // Simulate delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsOptimizing(false);
    
    // Update metrics
    const newMetrics = memoryManager.getMemoryUsage();
    setMetrics(newMetrics);
    
    // Show result
    if (freedBytes > 0) {
      alert(`Freed ${formatBytes(freedBytes)} of memory`);
    }
  }, []);

  // Force garbage collection
  const handleForceGC = useCallback(() => {
    memoryManager.forceGarbageCollection();
    
    // Update metrics after a short delay
    setTimeout(() => {
      const newMetrics = memoryManager.getMemoryUsage();
      setMetrics(newMetrics);
    }, 100);
  }, []);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate percentage
  const getPercentage = (used: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  return (
    <div className={`bg-white border border-gray-400 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-2 flex items-center justify-between">
        <span className="text-sm font-bold flex items-center gap-2">
          <Activity size={16} />
          Memory Profiler
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleDetectLeaks}
            className="p-1 hover:bg-blue-700 rounded"
            title="Detect Memory Leaks"
          >
            <AlertTriangle size={14} />
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="p-1 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Optimize Memory"
          >
            {isOptimizing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
          </button>
          <button
            onClick={handleForceGC}
            className="p-1 hover:bg-blue-700 rounded"
            title="Force Garbage Collection"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Current Memory Usage */}
        {metrics && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Current Usage</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Heap Used</span>
                  <span>{formatBytes(metrics.heapUsed)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${getPercentage(metrics.heapUsed, metrics.heapTotal)}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-100 p-2 rounded">
                  <div className="text-gray-600">Total Heap</div>
                  <div className="font-semibold">{formatBytes(metrics.heapTotal)}</div>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <div className="text-gray-600">Heap Limit</div>
                  <div className="font-semibold">{formatBytes(metrics.external)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Memory Usage Chart */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Usage History</h3>
          <canvas
            ref={canvasRef}
            width={300}
            height={150}
            className="w-full border border-gray-300 rounded"
          />
        </div>

        {/* Memory Leaks */}
        {leaks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <AlertTriangle size={14} className="text-yellow-500" />
              Potential Memory Leaks
            </h3>
            <div className="space-y-2">
              {leaks.map((leak) => (
                <div key={leak.id} className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                  <div className="font-semibold">{leak.type}</div>
                  <div className="text-gray-600">
                    {leak.count} items • {formatBytes(leak.size)} retained
                  </div>
                  <div className="text-gray-500">{leak.location}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimization Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <TrendingUp size={14} className="text-green-500" />
              Optimization Suggestions
            </h3>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryProfiler;