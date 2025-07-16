/**
 * Metrics Service
 * Collects and reports application metrics
 */

import { logger } from '../utils/logger';

interface Metric {
  count: number;
  sum: number;
  min: number;
  max: number;
  last: number;
  timestamp: number;
}

export class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, Metric> = new Map();
  private timers: Map<string, number> = new Map();
  private intervals: NodeJS.Timeout[] = [];
  
  private constructor() {
    this.startReporting();
  }
  
  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }
  
  private startReporting() {
    // Report metrics every 5 minutes
    const interval = setInterval(() => {
      this.report();
    }, 5 * 60 * 1000);
    
    this.intervals.push(interval);
  }
  
  increment(name: string, value: number = 1): void {
    const metric = this.getOrCreateMetric(name);
    metric.count += 1;
    metric.sum += value;
    metric.last = value;
    metric.timestamp = Date.now();
    
    if (value < metric.min) metric.min = value;
    if (value > metric.max) metric.max = value;
  }
  
  decrement(name: string, value: number = 1): void {
    this.increment(name, -value);
  }
  
  gauge(name: string, value: number): void {
    const metric = this.getOrCreateMetric(name);
    metric.last = value;
    metric.timestamp = Date.now();
  }
  
  timing(name: string, duration: number): void {
    const metric = this.getOrCreateMetric(name);
    metric.count += 1;
    metric.sum += duration;
    metric.last = duration;
    metric.timestamp = Date.now();
    
    if (duration < metric.min) metric.min = duration;
    if (duration > metric.max) metric.max = duration;
  }
  
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }
  
  endTimer(name: string): number {
    const start = this.timers.get(name);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.timing(name, duration);
    this.timers.delete(name);
    
    return duration;
  }
  
  getMetrics(prefix?: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, metric] of this.metrics) {
      if (!prefix || name.startsWith(prefix)) {
        const avg = metric.count > 0 ? metric.sum / metric.count : 0;
        result[name] = {
          count: metric.count,
          sum: metric.sum,
          avg: Number(avg.toFixed(2)),
          min: metric.min === Number.MAX_VALUE ? 0 : metric.min,
          max: metric.max === Number.MIN_VALUE ? 0 : metric.max,
          last: metric.last,
          timestamp: metric.timestamp,
        };
      }
    }
    
    return result;
  }
  
  private getOrCreateMetric(name: string): Metric {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = {
        count: 0,
        sum: 0,
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE,
        last: 0,
        timestamp: Date.now(),
      };
      this.metrics.set(name, metric);
    }
    return metric;
  }
  
  private report(): void {
    const metrics = this.getMetrics();
    
    // Log summary
    logger.info('Metrics Report', {
      timestamp: new Date().toISOString(),
      metrics: Object.keys(metrics).reduce((acc, key) => {
        const m = metrics[key];
        if (m.count > 0) {
          acc[key] = {
            count: m.count,
            avg: m.avg,
            last: m.last,
          };
        }
        return acc;
      }, {} as Record<string, any>),
    });
    
    // Reset certain metrics after reporting
    for (const [name, metric] of this.metrics) {
      if (name.includes('.duration') || name.includes('.count')) {
        metric.count = 0;
        metric.sum = 0;
        metric.min = Number.MAX_VALUE;
        metric.max = Number.MIN_VALUE;
      }
    }
  }
  
  reset(): void {
    this.metrics.clear();
    this.timers.clear();
  }
  
  close(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
  }
  
  // Convenience methods for common metrics
  
  recordDatabaseQuery(connectionId: string, duration: number, success: boolean): void {
    this.timing(`database.query.duration.${connectionId}`, duration);
    this.increment(`database.query.${success ? 'success' : 'failure'}.${connectionId}`);
  }
  
  recordApiRequest(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.timing(`api.request.duration.${method}.${endpoint}`, duration);
    this.increment(`api.request.status.${statusCode}`);
    
    if (statusCode >= 200 && statusCode < 300) {
      this.increment('api.request.success');
    } else if (statusCode >= 400 && statusCode < 500) {
      this.increment('api.request.client_error');
    } else if (statusCode >= 500) {
      this.increment('api.request.server_error');
    }
  }
  
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', duration: number): void {
    this.increment(`cache.${operation}`);
    this.timing(`cache.operation.duration.${operation}`, duration);
  }
}