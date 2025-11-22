/**
 * Memory Management Service for VB6 IDE
 * 
 * Provides memory optimization and monitoring capabilities
 */

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

export interface MemoryLeak {
  id: string;
  type: string;
  size: number;
  retainedSize: number;
  location: string;
  count: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  size: number;
}

export class MemoryManagementService {
  private static instance: MemoryManagementService;
  private memoryMetrics: MemoryMetrics[] = [];
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private weakRefs: Map<string, WeakRef<any>> = new Map();
  private cleanupInterval: number | null = null;
  private maxMetricsHistory = 100;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;

  private constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): MemoryManagementService {
    if (!MemoryManagementService.instance) {
      MemoryManagementService.instance = new MemoryManagementService();
    }
    return MemoryManagementService.instance;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryMetrics {
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      const memory = (window.performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.jsHeapSizeLimit,
        arrayBuffers: 0,
        timestamp: Date.now()
      };
    } else {
      // Fallback for non-Chrome browsers
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Track memory usage over time
   */
  trackMemoryUsage(): void {
    const metrics = this.getMemoryUsage();
    this.memoryMetrics.push(metrics);
    
    // Keep only recent history
    if (this.memoryMetrics.length > this.maxMetricsHistory) {
      this.memoryMetrics.shift();
    }
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory(): MemoryMetrics[] {
    return [...this.memoryMetrics];
  }

  /**
   * Create a memory-managed cache
   */
  createCache<T>(name: string): {
    get: (key: string) => T | undefined;
    set: (key: string, value: T, size?: number) => void;
    delete: (key: string) => void;
    clear: () => void;
    size: () => number;
  } {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
    }

    const cache = this.caches.get(name)!;

    return {
      get: (key: string) => {
        const entry = cache.get(key);
        if (entry) {
          entry.accessCount++;
          entry.timestamp = Date.now();
          return entry.data;
        }
        return undefined;
      },

      set: (key: string, value: T, size: number = 1024) => {
        // Remove old entry if exists
        const oldEntry = cache.get(key);
        if (oldEntry) {
          this.currentCacheSize -= oldEntry.size;
        }

        // Check if we need to evict items
        while (this.currentCacheSize + size > this.maxCacheSize) {
          this.evictLRU();
        }

        cache.set(key, {
          data: value,
          timestamp: Date.now(),
          accessCount: 1,
          size
        });

        this.currentCacheSize += size;
      },

      delete: (key: string) => {
        const entry = cache.get(key);
        if (entry) {
          this.currentCacheSize -= entry.size;
          cache.delete(key);
        }
      },

      clear: () => {
        for (const entry of cache.values()) {
          this.currentCacheSize -= entry.size;
        }
        cache.clear();
      },

      size: () => cache.size
    };
  }

  /**
   * Create a weak reference to an object
   */
  createWeakRef<T extends object>(key: string, obj: T): void {
    this.weakRefs.set(key, new WeakRef(obj));
  }

  /**
   * Get a weak reference
   */
  getWeakRef<T extends object>(key: string): T | undefined {
    const ref = this.weakRefs.get(key);
    if (ref) {
      const obj = ref.deref();
      if (obj) {
        return obj as T;
      } else {
        // Object has been garbage collected
        this.weakRefs.delete(key);
      }
    }
    return undefined;
  }

  /**
   * Object pooling for frequently created/destroyed objects
   */
  createObjectPool<T>(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize: number = 100
  ): {
    acquire: () => T;
    release: (obj: T) => void;
    size: () => number;
    clear: () => void;
  } {
    const available: T[] = [];
    const inUse = new Set<T>();

    return {
      acquire: () => {
        let obj = available.pop();
        if (!obj) {
          obj = factory();
        }
        inUse.add(obj);
        return obj;
      },

      release: (obj: T) => {
        if (inUse.has(obj)) {
          inUse.delete(obj);
          reset(obj);
          if (available.length < maxSize) {
            available.push(obj);
          }
        }
      },

      size: () => available.length + inUse.size,

      clear: () => {
        available.length = 0;
        inUse.clear();
      }
    };
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Check for DOM elements not attached to document
    if (typeof document !== 'undefined') {
      const detachedElements = this.findDetachedDOMElements();
      if (detachedElements.length > 0) {
        leaks.push({
          id: 'detached-dom',
          type: 'Detached DOM Elements',
          size: detachedElements.length * 100, // Estimate
          retainedSize: detachedElements.length * 500, // Estimate
          location: 'DOM Tree',
          count: detachedElements.length
        });
      }
    }

    // Check for large arrays or objects in caches
    for (const [cacheName, cache] of this.caches) {
      let totalSize = 0;
      let oldEntries = 0;
      const now = Date.now();

      for (const [key, entry] of cache) {
        totalSize += entry.size;
        // Consider entries older than 1 hour as potential leaks
        if (now - entry.timestamp > 3600000) {
          oldEntries++;
        }
      }

      if (oldEntries > 10) {
        leaks.push({
          id: `cache-${cacheName}`,
          type: 'Stale Cache Entries',
          size: totalSize,
          retainedSize: totalSize,
          location: `Cache: ${cacheName}`,
          count: oldEntries
        });
      }
    }

    // Check for event listeners
    const listeners = this.countEventListeners();
    if (listeners > 1000) {
      leaks.push({
        id: 'event-listeners',
        type: 'Excessive Event Listeners',
        size: listeners * 50, // Estimate
        retainedSize: listeners * 100, // Estimate
        location: 'Event System',
        count: listeners
      });
    }

    return leaks;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Optimize memory by clearing caches and running cleanup
   */
  optimizeMemory(): number {
    const beforeSize = this.currentCacheSize;
    
    // Clear old cache entries
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [cacheName, cache] of this.caches) {
      const toDelete: string[] = [];
      
      for (const [key, entry] of cache) {
        if (now - entry.timestamp > maxAge && entry.accessCount < 5) {
          toDelete.push(key);
          this.currentCacheSize -= entry.size;
        }
      }

      toDelete.forEach(key => cache.delete(key));
    }

    // Clean up weak references
    const toDeleteRefs: string[] = [];
    for (const [key, ref] of this.weakRefs) {
      if (!ref.deref()) {
        toDeleteRefs.push(key);
      }
    }
    toDeleteRefs.forEach(key => this.weakRefs.delete(key));

    // Force GC if available
    this.forceGarbageCollection();

    return beforeSize - this.currentCacheSize;
  }

  /**
   * Get memory optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getMemoryUsage();

    // Check heap usage
    if (metrics.heapUsed > metrics.heapTotal * 0.9) {
      suggestions.push('Memory usage is very high. Consider closing unused forms or clearing data.');
    }

    // Check cache size
    if (this.currentCacheSize > this.maxCacheSize * 0.8) {
      suggestions.push('Cache is nearly full. Old entries will be evicted automatically.');
    }

    // Check for memory leaks
    const leaks = this.detectMemoryLeaks();
    if (leaks.length > 0) {
      suggestions.push(`Detected ${leaks.length} potential memory leaks. Run memory optimization.`);
    }

    // Check metrics history for memory growth
    if (this.memoryMetrics.length >= 10) {
      const oldMetrics = this.memoryMetrics[this.memoryMetrics.length - 10];
      const growth = metrics.heapUsed - oldMetrics.heapUsed;
      if (growth > 10 * 1024 * 1024) { // 10MB growth
        suggestions.push('Memory usage has increased significantly. Monitor for memory leaks.');
      }
    }

    return suggestions;
  }

  // Private helper methods

  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = window.setInterval(() => {
      this.trackMemoryUsage();
      
      // Auto-optimize if memory usage is high
      const metrics = this.getMemoryUsage();
      if (metrics.heapUsed > metrics.heapTotal * 0.95) {
        this.optimizeMemory();
      }
    }, 5 * 60 * 1000);
  }

  private evictLRU(): void {
    let oldestEntry: { cache: string; key: string; entry: CacheEntry<any> } | null = null;
    
    for (const [cacheName, cache] of this.caches) {
      for (const [key, entry] of cache) {
        if (!oldestEntry || entry.timestamp < oldestEntry.entry.timestamp) {
          oldestEntry = { cache: cacheName, key, entry };
        }
      }
    }

    if (oldestEntry) {
      const cache = this.caches.get(oldestEntry.cache);
      if (cache) {
        cache.delete(oldestEntry.key);
        this.currentCacheSize -= oldestEntry.entry.size;
      }
    }
  }

  private findDetachedDOMElements(): Element[] {
    const detached: Element[] = [];
    
    if (typeof document !== 'undefined') {
      // This is a simplified check - in reality, detecting detached DOM is complex
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (!document.body.contains(el) && el.parentNode) {
          detached.push(el);
        }
      });
    }

    return detached;
  }

  private countEventListeners(): number {
    // This is an approximation - actual counting would require browser internals
    let count = 0;
    
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll('*');
      // Estimate based on common event types
      const eventTypes = ['click', 'change', 'input', 'keydown', 'keyup', 'mouseover', 'mouseout'];
      count = elements.length * eventTypes.length * 0.1; // Assume 10% have listeners
    }

    return Math.floor(count);
  }

  /**
   * Cleanup when service is no longer needed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.caches.clear();
    this.weakRefs.clear();
    this.memoryMetrics = [];
    this.currentCacheSize = 0;
  }
}

// Export singleton instance
export const memoryManager = MemoryManagementService.getInstance();