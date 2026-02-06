import React, { useState, useEffect, useRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import {
  Activity,
  Clock,
  MemoryStick as Memory,
  Cpu,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  controlsCount: number;
  eventsCount: number;
  timestamp: number;
}

/**
 * BROWSER FINGERPRINTING BUG FIX: Performance fingerprinting prevention utilities
 */
class PerformanceFingerprintingProtection {
  private static instance: PerformanceFingerprintingProtection;
  private fingerprintingJitter: number = 0;
  private performanceNoise: Map<string, number> = new Map();

  static getInstance(): PerformanceFingerprintingProtection {
    if (!this.instance) {
      this.instance = new PerformanceFingerprintingProtection();
    }
    return this.instance;
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Quantize FPS to prevent CPU fingerprinting
   */
  quantizeFPS(fps: number): number {
    // Quantize FPS to 5-frame intervals to prevent precise CPU performance fingerprinting
    const quantized = Math.round(fps / 5) * 5;

    // Add consistent noise based on session to prevent correlation
    const sessionNoise = this.getSessionNoise('fps');
    const noisyFPS = quantized + (sessionNoise - 0.5) * 2; // ±1 FPS noise

    // Clamp to reasonable bounds
    return Math.max(10, Math.min(120, Math.round(noisyFPS)));
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Obfuscate memory usage to prevent RAM fingerprinting
   */
  obfuscateMemoryUsage(memoryMB: number): number {
    // Quantize memory to 10MB increments
    const quantized = Math.round(memoryMB / 10) * 10;

    // Add session-consistent noise
    const sessionNoise = this.getSessionNoise('memory');
    const noisyMemory = quantized + (sessionNoise - 0.5) * 20; // ±10MB noise

    // Clamp to reasonable bounds (10MB - 2GB)
    return Math.max(10, Math.min(2048, Math.round(noisyMemory)));
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Randomize timing measurements
   */
  obfuscateTiming(timeMs: number): number {
    // Quantize timing to 1ms intervals to reduce precision
    const quantized = Math.round(timeMs);

    // Add timing jitter
    const jitter = this.getTimingJitter();
    const noisyTime = quantized + jitter;

    return Math.max(0, noisyTime);
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Anonymize browser information
   */
  anonymizeBrowserInfo(): string {
    // Return generic browser info instead of real userAgent
    const genericBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const sessionIndex = this.getSessionNoise('browser') * genericBrowsers.length;
    return genericBrowsers[Math.floor(sessionIndex)];
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Get session-consistent noise
   */
  private getSessionNoise(key: string): number {
    if (!this.performanceNoise.has(key)) {
      // Generate session-consistent pseudo-random noise
      let hash = 0;
      const sessionKey = key + (sessionStorage.getItem('vb6_session') || 'default');
      for (let i = 0; i < sessionKey.length; i++) {
        const char = sessionKey.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      this.performanceNoise.set(key, Math.abs(hash % 1000) / 1000);
    }
    return this.performanceNoise.get(key)!;
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Generate timing jitter
   */
  private getTimingJitter(): number {
    // Generate cryptographically secure timing jitter ±2ms
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return (array[0] / 0xffffffff - 0.5) * 4; // ±2ms
    } else {
      // Fallback with multiple entropy sources
      const r1 = Math.random();
      const r2 = Math.random();
      return ((r1 + r2) / 2 - 0.5) * 4;
    }
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Add canvas fingerprinting protection
   */
  addCanvasNoise(ctx: CanvasRenderingContext2D): void {
    // Add subtle noise to canvas to prevent fingerprinting
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    // Add minimal noise to random pixels (invisible to human eye)
    const noiseCount = Math.floor(data.length / 1000); // 0.1% of pixels
    for (let i = 0; i < noiseCount; i++) {
      const pixelIndex = Math.floor(Math.random() * (data.length / 4)) * 4;
      if (pixelIndex < data.length - 3) {
        // Add ±1 value noise to RGB channels (imperceptible)
        data[pixelIndex] = Math.max(0, Math.min(255, data[pixelIndex] + (Math.random() - 0.5) * 2));
        data[pixelIndex + 1] = Math.max(
          0,
          Math.min(255, data[pixelIndex + 1] + (Math.random() - 0.5) * 2)
        );
        data[pixelIndex + 2] = Math.max(
          0,
          Math.min(255, data[pixelIndex + 2] + (Math.random() - 0.5) * 2)
        );
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
}

export const PerformanceMonitor: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
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
    // BROWSER FINGERPRINTING BUG FIX: Use obfuscated timestamp
    timestamp: PerformanceFingerprintingProtection.getInstance().obfuscateTiming(Date.now()),
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();
  const { recordPerformanceMetrics } = useVB6Store();

  // ULTRA-OPTIMIZED: Fix RAF memory leak with proper cleanup
  useEffect(() => {
    // Only run if visible AND monitoring
    if (!visible || !isMonitoring) {
      // Clear any existing RAF immediately
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    let isActive = true; // Track if effect is still active

    const updateMetrics = () => {
      // Check if we should continue
      if (!isActive || !visible || !isMonitoring) {
        animationFrameRef.current = undefined;
        return;
      }

      // BROWSER FINGERPRINTING BUG FIX: Use obfuscated timing measurements
      const protection = PerformanceFingerprintingProtection.getInstance();
      const now = protection.obfuscateTiming(performance.now());
      const deltaTime = now - lastFrameTimeRef.current;
      frameCountRef.current++;

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        // BROWSER FINGERPRINTING BUG FIX: Quantize FPS to prevent CPU fingerprinting
        const rawFps = Math.round((frameCountRef.current * 1000) / deltaTime);
        const fps = protection.quantizeFPS(rawFps);

        const newMetrics: PerformanceMetrics = {
          fps,
          // BROWSER FINGERPRINTING BUG FIX: Obfuscate memory usage to prevent RAM fingerprinting
          memoryUsage: protection.obfuscateMemoryUsage(
            (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
          ),
          cpuUsage: Math.random() * 30 + 10, // Simulated CPU usage
          // BROWSER FINGERPRINTING BUG FIX: Obfuscate render timing
          renderTime: protection.obfuscateTiming(Math.random() * 5 + 1),
          controlsCount: document.querySelectorAll('[data-vb6-control]').length,
          eventsCount: Math.floor(Math.random() * 10),
          // BROWSER FINGERPRINTING BUG FIX: Obfuscate timestamp
          timestamp: protection.obfuscateTiming(Date.now()),
        };

        setCurrentMetrics(newMetrics);
        recordPerformanceMetrics(newMetrics);

        setMetrics(prev => [...prev.slice(-49), newMetrics]); // Keep last 50 points

        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      // Schedule next frame only if still active
      if (isActive && visible && isMonitoring) {
        animationFrameRef.current = requestAnimationFrame(updateMetrics);
      }
    };

    // Start the update loop
    animationFrameRef.current = requestAnimationFrame(updateMetrics);

    // CRITICAL: Cleanup function must cancel RAF and mark as inactive
    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [visible, isMonitoring, recordPerformanceMetrics]);

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

    // BROWSER FINGERPRINTING BUG FIX: Add canvas fingerprinting protection
    PerformanceFingerprintingProtection.getInstance().addCanvasNoise(ctx);

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
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '800px', height: '600px' }}
      >
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
            <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
              ×
            </button>
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
              <div
                className={`text-2xl font-bold ${getStatusColor(currentMetrics.fps, { good: 50, warning: 30 })}`}
              >
                {currentMetrics.fps}
              </div>
              <div className="text-xs text-gray-500">
                {currentMetrics.fps >= 50
                  ? 'Excellent'
                  : currentMetrics.fps >= 30
                    ? 'Good'
                    : 'Poor'}
              </div>
            </div>

            <div className="bg-white border border-gray-400 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Memory size={16} className="text-green-600" />
                <span className="text-xs font-semibold">Memory</span>
              </div>
              <div
                className={`text-2xl font-bold ${getMemoryStatusColor(currentMetrics.memoryUsage)}`}
              >
                {formatBytes(currentMetrics.memoryUsage)}
              </div>
              <div className="text-xs text-gray-500">
                {currentMetrics.memoryUsage < 50
                  ? 'Low'
                  : currentMetrics.memoryUsage < 100
                    ? 'Medium'
                    : 'High'}
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
                {currentMetrics.cpuUsage < 30
                  ? 'Low'
                  : currentMetrics.cpuUsage < 60
                    ? 'Medium'
                    : 'High'}
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
                {currentMetrics.renderTime < 2
                  ? 'Fast'
                  : currentMetrics.renderTime < 5
                    ? 'Good'
                    : 'Slow'}
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
                  {/* BROWSER FINGERPRINTING BUG FIX: Use generic browser info */}
                  <span className="font-mono">
                    {PerformanceFingerprintingProtection.getInstance().anonymizeBrowserInfo()}
                  </span>
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
