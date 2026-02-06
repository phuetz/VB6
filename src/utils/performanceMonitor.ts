interface RenderLoopTracker {
  count: number;
  lastTime: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  private renderLoopTrackers: Map<string, RenderLoopTracker> = new Map();
  private readonly RENDER_LOOP_THRESHOLD = 10; // renders per second
  private readonly RENDER_LOOP_TIME_WINDOW = 1000; // 1 second

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    if (process.env.NODE_ENV === 'development') {
      // noop
    }
    this.startTimes.set(name, performance.now());

    // Track render loops
    const tracker = this.renderLoopTrackers.get(name) || { count: 0, lastTime: 0 };
    const now = Date.now();

    if (now - tracker.lastTime < this.RENDER_LOOP_TIME_WINDOW) {
      tracker.count++;
    } else {
      tracker.count = 1;
      tracker.lastTime = now;
    }

    this.renderLoopTrackers.set(name, tracker);

    // Create performance mark if available
    if (typeof performance.mark === 'function') {
      try {
        performance.mark(`${name}-start`);
      } catch (e) {
        // Ignore errors from performance API
      }
    }
  }

  endMeasure(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`⏱️ [PERF] No start time for measure: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      // noop
    }

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Clean up
    this.startTimes.delete(name);

    // Warn if too slow
    if (duration > 1000) {
      console.warn(`⚠️ [PERF] ${name} took more than 1 second!`);
    }

    // Create performance mark and measure if available
    if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Ignore errors from performance API
      }
    }

    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;

    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  logSummary(): void {
    if (process.env.NODE_ENV === 'development') {
      // noop
    }
    this.metrics.forEach((times, name) => {
      const avg = this.getAverageTime(name);
      const min = Math.min(...times);
      const max = Math.max(...times);
      if (process.env.NODE_ENV === 'development') {
        // noop
      }
    });
  }

  checkRenderLoop(componentName: string): boolean {
    const tracker = this.renderLoopTrackers.get(componentName);
    if (!tracker) return false;

    const now = Date.now();
    if (now - tracker.lastTime > this.RENDER_LOOP_TIME_WINDOW) {
      // Reset if outside time window
      tracker.count = 0;
      tracker.lastTime = now;
      return false;
    }

    return tracker.count > this.RENDER_LOOP_THRESHOLD;
  }

  getLastTime(name: string): number | null {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return null;
    return times[times.length - 1];
  }

  getAllMetrics(): Map<string, { average: number; last: number; count: number }> {
    const result = new Map<string, { average: number; last: number; count: number }>();

    this.metrics.forEach((times, name) => {
      const average = this.getAverageTime(name);
      const last = this.getLastTime(name) || 0;
      const count = times.length;

      result.set(name, { average, last, count });
    });

    return result;
  }

  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.renderLoopTrackers.clear();
    if (process.env.NODE_ENV === 'development') {
      // noop
    }
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();
