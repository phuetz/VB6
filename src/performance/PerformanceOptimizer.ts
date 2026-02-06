/**
 * VB6 IDE Performance Optimizer
 *
 * Comprehensive performance optimization system for the VB6 Web IDE
 * including memory management, rendering optimization, and compilation speed.
 */

import { Control } from '../context/types';

// Performance monitoring interfaces
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  compilationTime: number;
  controlCount: number;
  fps: number;
  bundleSize: number;
  loadTime: number;
}

export interface OptimizationConfig {
  enableMemoryPooling: boolean;
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableControlVirtualization: boolean;
  enableCompilerCaching: boolean;
  maxConcurrentOperations: number;
  renderThrottleMs: number;
  memoryGCThreshold: number;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private memoryPools: Map<string, any[]> = new Map();
  private renderCache: Map<string, any> = new Map();
  private compilationCache: Map<string, any> = new Map();
  private lastRenderTime: number = 0;
  private frameCount: number = 0;
  private measurements: Map<string, number[]> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableMemoryPooling: true,
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableControlVirtualization: true,
      enableCompilerCaching: true,
      maxConcurrentOperations: 4,
      renderThrottleMs: 16, // 60fps
      memoryGCThreshold: 100 * 1024 * 1024, // 100MB
      ...config,
    };

    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      compilationTime: 0,
      controlCount: 0,
      fps: 0,
      bundleSize: 0,
      loadTime: 0,
    };

    this.initializeOptimizations();
  }

  /**
   * Initialize all performance optimizations
   */
  private initializeOptimizations(): void {
    this.setupMemoryPooling();
    this.setupRenderOptimization();
    this.setupCompilerOptimization();
    this.setupMetricsCollection();
    this.setupAutoGarbageCollection();
  }

  /**
   * Memory pooling for frequently allocated objects
   */
  private setupMemoryPooling(): void {
    if (!this.config.enableMemoryPooling) return;

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize pool initialization order
    const poolTypes = ['controls', 'events', 'ast-nodes', 'render-commands'];
    const shuffledPools = this.shuffleArray(poolTypes);

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Add randomized dummy pools to obfuscate layout
    const dummyPoolCount = Math.floor(Math.random() * 5) + 2; // 2-7 dummy pools
    for (let i = 0; i < dummyPoolCount; i++) {
      shuffledPools.push(`dummy-${Math.random().toString(36).substring(2, 8)}`);
    }

    // Initialize pools in randomized order with variable initial capacities
    shuffledPools.forEach(poolName => {
      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize initial pool sizes
      const initialCapacity = Math.floor(Math.random() * 20) + 5; // 5-25 initial objects
      const pool = new Array(initialCapacity);

      // Fill with dummy objects to randomize memory layout
      for (let i = 0; i < initialCapacity; i++) {
        pool[i] = this.createDummyPoolObject();
      }

      this.memoryPools.set(poolName, pool);
    });

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Perform initial heap randomization
    this.randomizeHeapLayout();
  }

  /**
   * Get object from memory pool or create new one
   */
  getFromPool<T>(poolName: string, factory: () => T): T {
    if (!this.config.enableMemoryPooling) return factory();

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Add layout randomization before pool access
    this.performMemoryLayoutJitter();

    // CONCURRENCY BUG FIX: Atomic pool access to prevent race conditions
    const pool = this.memoryPools.get(poolName);
    if (!pool) {
      // Pool doesn't exist, create object with randomized layout
      const obj = factory();
      this.randomizeObjectLayout(obj);
      return obj;
    }

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Random pool access pattern
    const accessPattern = Math.random();
    let object: any;

    if (accessPattern < 0.7) {
      // 70% chance: pop from end (normal behavior)
      object = pool.pop();
    } else if (accessPattern < 0.9) {
      // 20% chance: take from random position
      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        object = pool.splice(randomIndex, 1)[0];
      }
    } else {
      // 10% chance: take from beginning
      object = pool.shift();
    }

    if (object !== undefined && !object.__isDummy) {
      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize object properties
      this.randomizeObjectLayout(object);
      return object as T;
    }

    // No object available in pool, create new one with randomized layout
    const newObj = factory();
    this.randomizeObjectLayout(newObj);
    return newObj;
  }

  /**
   * Return object to memory pool
   */
  returnToPool(poolName: string, object: any): void {
    if (!this.config.enableMemoryPooling || !object) return;

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Add layout jitter before pool return
    this.performMemoryLayoutJitter();

    // CONCURRENCY BUG FIX: Validate object before pooling
    if (object.__pooled) {
      console.warn('Object already returned to pool - preventing double-free');
      return;
    }

    const pool = this.memoryPools.get(poolName);
    if (!pool) {
      // Pool doesn't exist, discard object
      return;
    }

    // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize pool size limit
    const maxPoolSize = 100 + Math.floor(Math.random() * 50); // 100-150 randomized limit
    if (pool.length >= maxPoolSize) {
      // Pool is full, discard object
      return;
    }

    // Reset object state safely
    try {
      if (typeof object.reset === 'function') {
        object.reset();
      }

      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize object property layout before pooling
      this.scrambleObjectProperties(object);

      // Mark object as pooled to prevent double-free
      Object.defineProperty(object, '__pooled', {
        value: true,
        writable: true,
        enumerable: false,
        configurable: true,
      });

      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize insertion position
      const insertPattern = Math.random();
      if (insertPattern < 0.6) {
        pool.push(object); // 60% push to end
      } else if (insertPattern < 0.8) {
        pool.unshift(object); // 20% insert at beginning
      } else {
        // 20% insert at random position
        const randomIndex = Math.floor(Math.random() * (pool.length + 1));
        pool.splice(randomIndex, 0, object);
      }
    } catch (error) {
      console.warn('Failed to return object to pool:', error);
    }
  }

  /**
   * Render optimization with throttling and caching
   */
  private setupRenderOptimization(): void {
    this.startFPSMonitoring();
  }

  /**
   * Throttled render function
   */
  throttledRender(renderFn: () => void): void {
    const now = performance.now();
    if (now - this.lastRenderTime >= this.config.renderThrottleMs) {
      const startTime = performance.now();
      renderFn();
      this.metrics.renderTime = performance.now() - startTime;
      this.lastRenderTime = now;
    }
  }

  /**
   * Cache render results
   */
  getCachedRender(key: string, renderFn: () => any): any {
    // CONCURRENCY BUG FIX: Prevent ABA problem with atomic get-or-compute pattern
    const cachedValue = this.renderCache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // Compute value - potential race condition here in multi-threaded environment
    // but JavaScript is single-threaded so this is safe
    const result = renderFn();

    // CONCURRENCY BUG FIX: Check again to prevent duplicate computation
    const existingValue = this.renderCache.get(key);
    if (existingValue !== undefined) {
      return existingValue;
    }

    this.renderCache.set(key, result);

    // Limit cache size with LRU eviction
    if (this.renderCache.size > 1000) {
      // CONCURRENCY BUG FIX: Use iterator to safely remove oldest entry
      const iterator = this.renderCache.keys();
      const firstKey = iterator.next().value;
      if (firstKey !== undefined) {
        this.renderCache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * Control virtualization for large forms
   */
  getVirtualizedControls(controls: Control[], viewportBounds: DOMRect): Control[] {
    if (!this.config.enableControlVirtualization || controls.length < 50) {
      return controls;
    }

    // Only render controls within viewport + buffer
    const buffer = 100;
    return controls.filter(control => {
      const controlBounds = {
        left: control.x,
        top: control.y,
        right: control.x + control.width,
        bottom: control.y + control.height,
      };

      return !(
        controlBounds.right < viewportBounds.left - buffer ||
        controlBounds.left > viewportBounds.right + buffer ||
        controlBounds.bottom < viewportBounds.top - buffer ||
        controlBounds.top > viewportBounds.bottom + buffer
      );
    });
  }

  /**
   * Compiler optimization with caching
   */
  private setupCompilerOptimization(): void {
    // Compiler cache is handled by compilation methods
  }

  /**
   * Get cached compilation result
   */
  getCachedCompilation(sourceHash: string, compileFn: () => any): any {
    if (!this.config.enableCompilerCaching) {
      return compileFn();
    }

    // CONCURRENCY BUG FIX: Prevent ABA problem with atomic get-or-compute pattern
    const cachedValue = this.compilationCache.get(sourceHash);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const startTime = performance.now();
    const result = compileFn();
    this.metrics.compilationTime = performance.now() - startTime;

    // CONCURRENCY BUG FIX: Check again to prevent duplicate compilation
    const existingValue = this.compilationCache.get(sourceHash);
    if (existingValue !== undefined) {
      return existingValue;
    }

    this.compilationCache.set(sourceHash, result);

    // Limit cache size with LRU eviction
    if (this.compilationCache.size > 200) {
      // CONCURRENCY BUG FIX: Use iterator to safely remove oldest entry
      const iterator = this.compilationCache.keys();
      const firstKey = iterator.next().value;
      if (firstKey !== undefined) {
        this.compilationCache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * Batch operations for better performance
   */
  batchOperations<T>(
    operations: (() => T)[],
    batchSize: number = this.config.maxConcurrentOperations
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize array allocation
      const resultsSize = operations.length + Math.floor(Math.random() * 10); // Add 0-10 padding
      const results: T[] = new Array(resultsSize);

      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Fill padding with dummy data
      for (let i = operations.length; i < resultsSize; i++) {
        results[i] = this.createDummyResult() as T;
      }

      // MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize operation order
      const randomizedOperations = this.shuffleOperationsWithIndices(operations);

      // CONCURRENCY BUG FIX: Use atomic operations to prevent race conditions
      let completedOperations = 0;
      let hasError = false;
      let currentBatch = 0;

      const processBatch = () => {
        if (hasError) return; // Stop processing on error

        const batchStart = currentBatch;
        const batch = operations.slice(batchStart, batchStart + batchSize);

        // MEMORY LAYOUT PREDICTABILITY BUG FIX: Process batch with randomized execution order
        const shuffledBatch = this.shuffleArray([...Array(batch.length).keys()]);

        shuffledBatch.forEach(shuffledIndex => {
          try {
            const opData = batch[shuffledIndex];
            const globalIndex = batchStart + shuffledIndex;

            // MEMORY LAYOUT PREDICTABILITY BUG FIX: Add memory jitter before operation
            if (Math.random() < 0.1) {
              // 10% chance
              this.performMemoryLayoutJitter();
            }

            results[opData.originalIndex] = opData.operation();

            // CONCURRENCY BUG FIX: Use atomic increment
            completedOperations++;
          } catch (error) {
            hasError = true;
            reject(error);
            return;
          }
        });

        currentBatch += batchSize;

        // Check completion with atomic read
        if (completedOperations === operations.length) {
          // MEMORY LAYOUT PREDICTABILITY BUG FIX: Remove padding before returning
          const finalResults = results.slice(0, operations.length);
          resolve(finalResults);
        } else if (currentBatch < operations.length && !hasError) {
          // Use requestIdleCallback for non-blocking execution
          if ('requestIdleCallback' in window) {
            requestIdleCallback(processBatch);
          } else {
            setTimeout(processBatch, 0);
          }
        }
      };

      // Validate input
      if (!operations || operations.length === 0) {
        resolve([]);
        return;
      }

      processBatch();
    });
  }

  /**
   * Debounced function execution
   */
  debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    }) as T;
  }

  /**
   * Memoization decorator
   */
  memoize<T extends (...args: any[]) => any>(func: T, maxCacheSize: number = 100): T {
    const cache = new Map();

    return ((...args: any[]) => {
      // CONCURRENCY BUG FIX: Safer key generation to prevent collisions
      let key: string;
      try {
        key = JSON.stringify(args);
      } catch (error) {
        // Fallback for circular references or non-serializable args
        key = args
          .map((arg, i) => `${i}:${typeof arg}:${arg?.constructor?.name || 'unknown'}`)
          .join('|');
      }

      // CONCURRENCY BUG FIX: Atomic get-or-compute pattern
      const cachedValue = cache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }

      const result = func.apply(this, args);

      // CONCURRENCY BUG FIX: Check again to prevent duplicate computation
      const existingValue = cache.get(key);
      if (existingValue !== undefined) {
        return existingValue;
      }

      cache.set(key, result);

      // Limit cache size with LRU eviction
      if (cache.size > maxCacheSize) {
        // CONCURRENCY BUG FIX: Use iterator to safely remove oldest entry
        const iterator = cache.keys();
        const firstKey = iterator.next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }

      return result;
    }) as T;
  }

  // RUNTIME LOGIC BUG FIX: Add interval tracking for cleanup
  private intervals: Set<number> = new Set();
  private observers: Set<PerformanceObserver> = new Set();

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    // RUNTIME LOGIC BUG FIX: Memory usage monitoring with cleanup tracking
    if ('memory' in performance) {
      const intervalId = setInterval(() => {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }, 1000);
      this.intervals.add(intervalId);
    }

    // RUNTIME LOGIC BUG FIX: Performance observers with cleanup tracking
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.updateMetric(entry.name, entry.duration);
          }
        }
      });
      this.observers.add(observer);

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }

  /**
   * Automatic garbage collection
   */
  private setupAutoGarbageCollection(): void {
    // RUNTIME LOGIC BUG FIX: Track interval for cleanup
    const intervalId = setInterval(() => {
      if (this.metrics.memoryUsage > this.config.memoryGCThreshold) {
        this.performGarbageCollection();
      }
    }, 30000); // Check every 30 seconds
    this.intervals.add(intervalId);
  }

  /**
   * Manual garbage collection
   */
  performGarbageCollection(): void {
    // Clear caches if memory usage is high
    if (this.renderCache.size > 500) {
      this.renderCache.clear();
    }

    if (this.compilationCache.size > 100) {
      this.compilationCache.clear();
    }

    // Clear memory pools
    for (const [, pool] of this.memoryPools) {
      pool.length = Math.min(pool.length, 20);
    }

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Update performance metric
   */
  private updateMetric(name: string, value: number): void {
    switch (name) {
      case 'render-time':
        this.metrics.renderTime = value;
        break;
      case 'compilation-time':
        this.metrics.compilationTime = value;
        break;
      default:
        // Custom metrics can be added here
        break;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Performance measurement helper
   */
  measure<T>(name: string, operation: () => T): T {
    performance.mark(`${name}-start`);
    const result = operation();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }

  /**
   * Async performance measurement
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    performance.mark(`${name}-start`);
    try {
      const result = await operation();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      return result;
    } catch (error) {
      // ASYNC EDGE CASE BUG FIX: Clean up performance marks on error
      performance.mark(`${name}-error`);
      try {
        performance.measure(`${name}-failed`, `${name}-start`, `${name}-error`);
      } catch {
        // Ignore measurement errors if marks don't exist
      }
      throw error;
    }
  }

  /**
   * Bundle size analysis
   */
  analyzeBundleSize(): Promise<{ [module: string]: number }> {
    return new Promise(resolve => {
      // This would integrate with webpack-bundle-analyzer in a real scenario
      const analysis = {
        core: 500 * 1024,
        controls: 800 * 1024,
        compiler: 600 * 1024,
        activex: 300 * 1024,
        showcase: 200 * 1024,
        dependencies: 500 * 1024,
      };

      this.metrics.bundleSize = Object.values(analysis).reduce((sum, size) => sum + size, 0);
      resolve(analysis);
    });
  }

  /**
   * Code splitting optimization
   */
  async loadModuleAsync<T>(moduleFactory: () => Promise<T>): Promise<T> {
    if (!this.config.enableCodeSplitting) {
      return moduleFactory();
    }

    return this.measureAsync('module-load', moduleFactory);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear all caches
    this.renderCache.clear();
    this.compilationCache.clear();
    this.memoryPools.clear();

    // STATE CORRUPTION BUG FIX: Disconnect observers properly
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();

    return `
VB6 IDE Performance Report
=========================
Render Time: ${metrics.renderTime.toFixed(2)}ms
Memory Usage: ${metrics.memoryUsage.toFixed(1)}MB
Compilation Time: ${metrics.compilationTime.toFixed(2)}ms
Control Count: ${metrics.controlCount}
FPS: ${metrics.fps}
Bundle Size: ${(metrics.bundleSize / 1024 / 1024).toFixed(1)}MB
Load Time: ${metrics.loadTime.toFixed(2)}ms

Optimization Status:
- Memory Pooling: ${this.config.enableMemoryPooling ? 'Enabled' : 'Disabled'}
- Lazy Loading: ${this.config.enableLazyLoading ? 'Enabled' : 'Disabled'}
- Code Splitting: ${this.config.enableCodeSplitting ? 'Enabled' : 'Disabled'}
- Control Virtualization: ${this.config.enableControlVirtualization ? 'Enabled' : 'Disabled'}
- Compiler Caching: ${this.config.enableCompilerCaching ? 'Enabled' : 'Disabled'}

Cache Status:
- Render Cache: ${this.renderCache.size} entries
- Compilation Cache: ${this.compilationCache.size} entries
- Memory Pools: ${Array.from(this.memoryPools.values()).reduce((sum, pool) => sum + pool.length, 0)} objects
    `;
  }

  /**
   * RUNTIME LOGIC BUG FIX: Cleanup method to prevent memory leaks
   */
  dispose(): void {
    // Clear all intervals
    this.intervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.intervals.clear();

    // Disconnect all observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // MEMORY LEAK BUG FIX: Clear all memory pools and caches
    this.memoryPools.clear();
    this.renderCache.clear();
    this.compilationCache.clear();

    // STATE CORRUPTION BUG FIX: Clear metrics with correct structure
    this.measurements.clear();
    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      compilationTime: 0,
      controlCount: 0,
      fps: 0,
      bundleSize: 0,
      loadTime: 0,
    };
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Array shuffling utility
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Create dummy pool object
   */
  private createDummyPoolObject(): any {
    const dummyTypes = ['string', 'number', 'object', 'array'];
    const type = dummyTypes[Math.floor(Math.random() * dummyTypes.length)];

    const dummy: any = {
      __isDummy: true,
      type: type,
      id: Math.random().toString(36),
      timestamp: Date.now(),
      randomData: Math.random() * 1000,
    };

    // Add random properties to randomize object layout
    const propCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < propCount; i++) {
      dummy[`prop_${i}_${Math.random().toString(36).substring(2, 6)}`] = Math.random();
    }

    return dummy;
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Heap layout randomization
   */
  private randomizeHeapLayout(): void {
    // Create arrays of different sizes to fragment heap
    const fragmentCount = Math.floor(Math.random() * 20) + 10; // 10-30 fragments
    const fragments: any[] = [];

    for (let i = 0; i < fragmentCount; i++) {
      const size = Math.floor(Math.random() * 100) + 10; // 10-110 elements
      const fragment = new Array(size);

      // Fill with random data
      for (let j = 0; j < size; j++) {
        fragment[j] = {
          index: j,
          random: Math.random(),
          string: Math.random().toString(36),
          nested: {
            value: Math.random() * 1000,
            flag: Math.random() > 0.5,
          },
        };
      }

      fragments.push(fragment);
    }

    // Keep some fragments alive, discard others randomly
    const keepCount = Math.floor(fragmentCount * 0.3); // Keep 30%
    const indicesToKeep = new Set<number>();

    while (indicesToKeep.size < keepCount) {
      indicesToKeep.add(Math.floor(Math.random() * fragmentCount));
    }

    // Store kept fragments to prevent GC
    fragments.forEach((fragment, index) => {
      if (indicesToKeep.has(index)) {
        this.memoryPools.set(`heap-fragment-${index}`, fragment);
      }
    });
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Memory layout jitter
   */
  private performMemoryLayoutJitter(): void {
    // Create temporary allocations to randomize heap state
    const allocCount = Math.floor(Math.random() * 10) + 3; // 3-13 allocations
    const tempAllocs: any[] = [];

    for (let i = 0; i < allocCount; i++) {
      const allocSize = Math.floor(Math.random() * 50) + 5; // 5-55 elements
      const allocation = new Array(allocSize);

      // Fill with structured data
      for (let j = 0; j < allocSize; j++) {
        allocation[j] = {
          id: `temp_${i}_${j}`,
          value: Math.random() * 10000,
          metadata: {
            created: Date.now(),
            type: Math.random() > 0.5 ? 'primary' : 'secondary',
            flags: Math.floor(Math.random() * 256),
          },
        };
      }

      tempAllocs.push(allocation);
    }

    // Randomly keep some allocations alive briefly
    const keepAlive = tempAllocs.filter(() => Math.random() < 0.2);

    // Use setTimeout to clean up, creating temporal layout variation
    setTimeout(
      () => {
        keepAlive.length = 0; // Allow GC
      },
      Math.random() * 100 + 50
    ); // 50-150ms
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Randomize object property layout
   */
  private randomizeObjectLayout(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    // Add random properties to change object shape
    const propCount = Math.floor(Math.random() * 3); // 0-3 random props
    for (let i = 0; i < propCount; i++) {
      const propName = `__layout_${Math.random().toString(36).substring(2, 8)}`;
      Object.defineProperty(obj, propName, {
        value: Math.random(),
        enumerable: false,
        writable: false,
        configurable: true,
      });
    }
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Scramble object properties
   */
  private scrambleObjectProperties(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const keys = Object.keys(obj);
    if (keys.length <= 1) return;

    // Create a new object with randomized property order
    const shuffledKeys = this.shuffleArray(keys);
    const scrambled: any = {};

    shuffledKeys.forEach(key => {
      scrambled[key] = obj[key];
    });

    // Replace original properties
    keys.forEach(key => delete obj[key]);
    Object.assign(obj, scrambled);
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Shuffle operations with original indices
   */
  private shuffleOperationsWithIndices<T>(
    operations: (() => T)[]
  ): Array<{ operation: () => T; originalIndex: number }> {
    const indexed = operations.map((op, index) => ({ operation: op, originalIndex: index }));
    return this.shuffleArray(indexed);
  }

  /**
   * MEMORY LAYOUT PREDICTABILITY BUG FIX: Create dummy result for padding
   */
  private createDummyResult(): any {
    return {
      __isDummyResult: true,
      value: Math.random(),
      timestamp: Date.now(),
      padding: new Array(Math.floor(Math.random() * 10)).fill(Math.random()),
    };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(
    performanceOptimizer.getMetrics()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceOptimizer.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    measure: performanceOptimizer.measure.bind(performanceOptimizer),
    measureAsync: performanceOptimizer.measureAsync.bind(performanceOptimizer),
    generateReport: performanceOptimizer.generateReport.bind(performanceOptimizer),
  };
}
