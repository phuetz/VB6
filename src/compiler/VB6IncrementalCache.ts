/**
 * Advanced Incremental Compilation Cache for VB6
 * 
 * Features:
 * - Content-based fingerprinting
 * - Multi-level caching (AST, IR, JS, WASM)
 * - Smart invalidation with dependency tracking
 * - Persistent disk cache with IndexedDB
 * - Memory pressure management
 * - Cache warming and precompilation
 */

interface CacheEntry {
  fingerprint: string;
  timestamp: number;
  level: CacheLevel;
  data: any;
  size: number;
  hits: number;
  lastAccess: number;
  dependencies: Set<string>;
  metadata: CacheMetadata;
}

enum CacheLevel {
  AST = 'ast',
  IR = 'ir',              // Intermediate representation
  OPTIMIZED_IR = 'opt_ir',
  JAVASCRIPT = 'js',
  WASM = 'wasm',
  SOURCEMAP = 'sourcemap'
}

interface CacheMetadata {
  sourceFile: string;
  compilerVersion: string;
  optimizationLevel: number;
  targetPlatform: string;
  features: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
}

export class VB6IncrementalCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private diskCache: IDBDatabase | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entries: 0
  };
  
  private readonly maxMemorySize: number;
  private readonly maxDiskSize: number;
  private readonly evictionPolicy: EvictionPolicy;
  
  constructor(options: {
    maxMemorySize?: number;
    maxDiskSize?: number;
    evictionPolicy?: EvictionPolicy;
  } = {}) {
    this.maxMemorySize = options.maxMemorySize || 100 * 1024 * 1024; // 100MB
    this.maxDiskSize = options.maxDiskSize || 500 * 1024 * 1024; // 500MB
    this.evictionPolicy = options.evictionPolicy || new LRUEvictionPolicy();
    
    this.initializeDiskCache();
  }
  
  /**
   * Get cached compilation result
   */
  async get(
    fingerprint: string,
    level: CacheLevel
  ): Promise<any | null> {
    // Check memory cache first
    const memKey = this.getCacheKey(fingerprint, level);
    const memEntry = this.memoryCache.get(memKey);
    
    if (memEntry) {
      this.stats.hits++;
      memEntry.hits++;
      memEntry.lastAccess = Date.now();
      return memEntry.data;
    }
    
    // Check disk cache
    const diskEntry = await this.getDiskEntry(fingerprint, level);
    if (diskEntry) {
      this.stats.hits++;
      // Promote to memory cache
      this.promoteToMemory(diskEntry);
      return diskEntry.data;
    }
    
    this.stats.misses++;
    return null;
  }
  
  /**
   * Store compilation result in cache
   */
  async set(
    fingerprint: string,
    level: CacheLevel,
    data: any,
    dependencies: Set<string> = new Set(),
    metadata?: Partial<CacheMetadata>
  ): Promise<void> {
    const entry: CacheEntry = {
      fingerprint,
      timestamp: Date.now(),
      level,
      data,
      size: this.estimateSize(data),
      hits: 0,
      lastAccess: Date.now(),
      dependencies,
      metadata: {
        sourceFile: metadata?.sourceFile || '',
        compilerVersion: metadata?.compilerVersion || '1.0.0',
        optimizationLevel: metadata?.optimizationLevel || 0,
        targetPlatform: metadata?.targetPlatform || 'web',
        features: metadata?.features || []
      }
    };
    
    // Store in memory cache
    const key = this.getCacheKey(fingerprint, level);
    this.memoryCache.set(key, entry);
    this.stats.size += entry.size;
    this.stats.entries++;
    
    // Check memory pressure
    if (this.stats.size > this.maxMemorySize) {
      await this.evictMemory();
    }
    
    // Store in disk cache asynchronously
    this.storeToDisk(entry).catch(console.error);
  }
  
  /**
   * Invalidate cache entries
   */
  async invalidate(fingerprint: string, cascade: boolean = true): Promise<void> {
    // Invalidate all levels for this fingerprint
    for (const level of Object.values(CacheLevel)) {
      const key = this.getCacheKey(fingerprint, level);
      const entry = this.memoryCache.get(key);
      
      if (entry) {
        this.stats.size -= entry.size;
        this.stats.entries--;
        this.memoryCache.delete(key);
        
        // Cascade invalidation to dependents
        if (cascade) {
          for (const [depKey, depEntry] of this.memoryCache) {
            if (depEntry.dependencies.has(fingerprint)) {
              await this.invalidate(depEntry.fingerprint, true);
            }
          }
        }
      }
    }
    
    // Invalidate disk cache
    await this.invalidateDisk(fingerprint);
  }
  
  /**
   * Warm cache with precompiled results
   */
  async warmCache(
    entries: Array<{
      fingerprint: string;
      level: CacheLevel;
      data: any;
      dependencies?: Set<string>;
    }>
  ): Promise<void> {
    console.log(`Warming cache with ${entries.length} entries...`);
    
    for (const entry of entries) {
      await this.set(
        entry.fingerprint,
        entry.level,
        entry.data,
        entry.dependencies
      );
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      entries: 0
    };
    
    if (this.diskCache) {
      const transaction = this.diskCache.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    }
  }
  
  /**
   * Analyze cache efficiency
   */
  analyzeEfficiency(): CacheAnalysis {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    const avgEntrySize = this.stats.size / this.stats.entries || 0;
    const memoryUtilization = this.stats.size / this.maxMemorySize;
    
    const hotEntries: CacheEntry[] = [];
    const coldEntries: CacheEntry[] = [];
    
    for (const entry of this.memoryCache.values()) {
      if (entry.hits > 10) {
        hotEntries.push(entry);
      } else if (entry.hits === 0) {
        coldEntries.push(entry);
      }
    }
    
    return {
      hitRate,
      avgEntrySize,
      memoryUtilization,
      hotEntries: hotEntries.length,
      coldEntries: coldEntries.length,
      recommendations: this.generateRecommendations(hitRate, memoryUtilization)
    };
  }
  
  // Private methods
  
  private async initializeDiskCache(): Promise<void> {
    if (!('indexedDB' in window)) return;
    
    const request = indexedDB.open('VB6CompilerCache', 1);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB for cache');
    };
    
    request.onsuccess = () => {
      this.diskCache = request.result;
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'key' });
        store.createIndex('fingerprint', 'fingerprint', { unique: false });
        store.createIndex('level', 'level', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  }
  
  private getCacheKey(fingerprint: string, level: CacheLevel): string {
    return `${fingerprint}:${level}`;
  }
  
  private estimateSize(data: any): number {
    // Rough estimation of object size in bytes
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      return data.byteLength;
    }
    
    const str = JSON.stringify(data);
    return str.length * 2; // Assuming 2 bytes per character
  }
  
  private async evictMemory(): Promise<void> {
    const entriesToEvict = this.evictionPolicy.selectEvictions(
      Array.from(this.memoryCache.values()),
      this.stats.size - this.maxMemorySize * 0.8 // Target 80% utilization
    );
    
    for (const entry of entriesToEvict) {
      const key = this.getCacheKey(entry.fingerprint, entry.level);
      this.memoryCache.delete(key);
      this.stats.size -= entry.size;
      this.stats.entries--;
      this.stats.evictions++;
      
      // Ensure it's persisted to disk before eviction
      await this.storeToDisk(entry);
    }
  }
  
  private async getDiskEntry(
    fingerprint: string,
    level: CacheLevel
  ): Promise<CacheEntry | null> {
    if (!this.diskCache) return null;
    
    const key = this.getCacheKey(fingerprint, level);
    const transaction = this.diskCache.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    const request = store.get(key);
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Deserialize dependencies Set
          result.dependencies = new Set(result.dependencies);
          resolve(result);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        resolve(null);
      };
    });
  }
  
  private async storeToDisk(entry: CacheEntry): Promise<void> {
    if (!this.diskCache) return;
    
    const key = this.getCacheKey(entry.fingerprint, entry.level);
    const serialized = {
      ...entry,
      key,
      dependencies: Array.from(entry.dependencies) // Serialize Set
    };
    
    const transaction = this.diskCache.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    store.put(serialized);
  }
  
  private async invalidateDisk(fingerprint: string): Promise<void> {
    if (!this.diskCache) return;
    
    const transaction = this.diskCache.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('fingerprint');
    const request = index.openCursor(IDBKeyRange.only(fingerprint));
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
  
  private promoteToMemory(entry: CacheEntry): void {
    const key = this.getCacheKey(entry.fingerprint, entry.level);
    this.memoryCache.set(key, entry);
    this.stats.size += entry.size;
    this.stats.entries++;
    
    // Check memory pressure
    if (this.stats.size > this.maxMemorySize) {
      this.evictMemory().catch(console.error);
    }
  }
  
  private generateRecommendations(
    hitRate: number,
    memoryUtilization: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (hitRate < 0.7) {
      recommendations.push('Low hit rate detected. Consider warming cache with common modules.');
    }
    
    if (memoryUtilization > 0.9) {
      recommendations.push('High memory utilization. Consider increasing cache size or more aggressive eviction.');
    }
    
    if (this.stats.evictions > this.stats.hits * 0.1) {
      recommendations.push('High eviction rate. Cache may be too small for working set.');
    }
    
    return recommendations;
  }
}

/**
 * Cache eviction policies
 */
interface EvictionPolicy {
  selectEvictions(entries: CacheEntry[], targetSize: number): CacheEntry[];
}

class LRUEvictionPolicy implements EvictionPolicy {
  selectEvictions(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    // Sort by last access time
    const sorted = entries.sort((a, b) => a.lastAccess - b.lastAccess);
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

class LFUEvictionPolicy implements EvictionPolicy {
  selectEvictions(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    // Sort by hit count
    const sorted = entries.sort((a, b) => a.hits - b.hits);
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

class FIFOEvictionPolicy implements EvictionPolicy {
  selectEvictions(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    // Sort by timestamp
    const sorted = entries.sort((a, b) => a.timestamp - b.timestamp);
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

interface CacheAnalysis {
  hitRate: number;
  avgEntrySize: number;
  memoryUtilization: number;
  hotEntries: number;
  coldEntries: number;
  recommendations: string[];
}