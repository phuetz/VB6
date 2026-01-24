/**
 * Form Designer Performance Optimization Utilities
 * Provides efficient rendering, hit testing, and spatial indexing
 */

// ============================================================================
// Types
// ============================================================================

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SpatialItem<T> {
  id: string;
  bounds: Rectangle;
  data: T;
}

// ============================================================================
// Quadtree for Spatial Indexing
// ============================================================================

export class Quadtree<T> {
  private items: SpatialItem<T>[] = [];
  private children: Quadtree<T>[] | null = null;
  private readonly maxItems: number;
  private readonly maxDepth: number;
  private readonly depth: number;

  constructor(
    public bounds: Rectangle,
    maxItems: number = 10,
    maxDepth: number = 8,
    depth: number = 0
  ) {
    this.maxItems = maxItems;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  /**
   * Insert an item into the quadtree
   */
  insert(item: SpatialItem<T>): boolean {
    if (!this.intersects(this.bounds, item.bounds)) {
      return false;
    }

    if (this.children === null) {
      this.items.push(item);

      if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
        this.subdivide();
      }
      return true;
    }

    for (const child of this.children) {
      child.insert(item);
    }
    return true;
  }

  /**
   * Remove an item from the quadtree
   */
  remove(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }

    if (this.children) {
      for (const child of this.children) {
        if (child.remove(id)) return true;
      }
    }

    return false;
  }

  /**
   * Query items in a rectangular region
   */
  query(region: Rectangle): SpatialItem<T>[] {
    const result: SpatialItem<T>[] = [];

    if (!this.intersects(this.bounds, region)) {
      return result;
    }

    for (const item of this.items) {
      if (this.intersects(item.bounds, region)) {
        result.push(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        result.push(...child.query(region));
      }
    }

    return result;
  }

  /**
   * Query items at a specific point
   */
  queryPoint(point: Point): SpatialItem<T>[] {
    return this.query({
      x: point.x,
      y: point.y,
      width: 1,
      height: 1
    }).filter(item => this.containsPoint(item.bounds, point));
  }

  /**
   * Find the topmost item at a point (last in Z-order)
   */
  findTopmostAtPoint(point: Point): SpatialItem<T> | null {
    const items = this.queryPoint(point);
    return items.length > 0 ? items[items.length - 1] : null;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items = [];
    this.children = null;
  }

  /**
   * Rebuild the quadtree with new items
   */
  rebuild(items: SpatialItem<T>[]): void {
    this.clear();
    for (const item of items) {
      this.insert(item);
    }
  }

  /**
   * Get all items
   */
  getAllItems(): SpatialItem<T>[] {
    const result = [...this.items];
    if (this.children) {
      for (const child of this.children) {
        result.push(...child.getAllItems());
      }
    }
    return result;
  }

  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.children = [
      new Quadtree<T>({ x, y, width: halfWidth, height: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
      new Quadtree<T>({ x: x + halfWidth, y, width: halfWidth, height: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
      new Quadtree<T>({ x, y: y + halfHeight, width: halfWidth, height: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1),
      new Quadtree<T>({ x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight }, this.maxItems, this.maxDepth, this.depth + 1)
    ];

    for (const item of this.items) {
      for (const child of this.children) {
        child.insert(item);
      }
    }

    this.items = [];
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  private containsPoint(rect: Rectangle, point: Point): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }
}

// ============================================================================
// Update Batching
// ============================================================================

export class UpdateBatcher<T> {
  private updates: Map<string, T> = new Map();
  private flushCallback: (updates: Map<string, T>) => void;
  private frameId: number | null = null;
  private isScheduled: boolean = false;

  constructor(flushCallback: (updates: Map<string, T>) => void) {
    this.flushCallback = flushCallback;
  }

  /**
   * Queue an update
   */
  queue(id: string, update: T): void {
    this.updates.set(id, update);
    this.scheduleFlush();
  }

  /**
   * Queue multiple updates
   */
  queueMany(updates: Array<{ id: string; update: T }>): void {
    for (const { id, update } of updates) {
      this.updates.set(id, update);
    }
    this.scheduleFlush();
  }

  /**
   * Force immediate flush
   */
  flush(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isScheduled = false;

    if (this.updates.size > 0) {
      const updates = new Map(this.updates);
      this.updates.clear();
      this.flushCallback(updates);
    }
  }

  /**
   * Cancel all pending updates
   */
  cancel(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isScheduled = false;
    this.updates.clear();
  }

  private scheduleFlush(): void {
    if (this.isScheduled) return;
    this.isScheduled = true;

    this.frameId = requestAnimationFrame(() => {
      this.flush();
    });
  }
}

// ============================================================================
// Throttle and Debounce
// ============================================================================

export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(lastThis, lastArgs!);
    }, delay);
  } as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      timeoutId = null;
      fn.apply(lastThis, lastArgs);
    }
  };

  return debounced;
}

// ============================================================================
// LRU Cache
// ============================================================================

export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Delete existing key to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Remove oldest if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Virtual List for Large Control Lists
// ============================================================================

export interface VirtualListConfig {
  itemHeight: number;
  overscan: number;
  containerHeight: number;
}

export interface VirtualListState {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  visibleCount: number;
}

export function calculateVirtualList(
  totalItems: number,
  scrollTop: number,
  config: VirtualListConfig
): VirtualListState {
  const { itemHeight, overscan, containerHeight } = config;

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    offsetY,
    visibleCount
  };
}

// ============================================================================
// Dirty Rectangle Tracking
// ============================================================================

export class DirtyRectTracker {
  private dirtyRects: Rectangle[] = [];
  private fullRedraw: boolean = false;

  /**
   * Mark a region as dirty
   */
  markDirty(rect: Rectangle): void {
    if (this.fullRedraw) return;
    this.dirtyRects.push(rect);
  }

  /**
   * Mark full canvas as needing redraw
   */
  markFullRedraw(): void {
    this.fullRedraw = true;
    this.dirtyRects = [];
  }

  /**
   * Get the combined dirty region
   */
  getDirtyRegion(): Rectangle | null {
    if (this.fullRedraw || this.dirtyRects.length === 0) return null;

    // Calculate bounding box of all dirty rects
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const rect of this.dirtyRects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Check if full redraw is needed
   */
  needsFullRedraw(): boolean {
    return this.fullRedraw;
  }

  /**
   * Check if any region is dirty
   */
  isDirty(): boolean {
    return this.fullRedraw || this.dirtyRects.length > 0;
  }

  /**
   * Clear dirty state
   */
  clear(): void {
    this.fullRedraw = false;
    this.dirtyRects = [];
  }
}

// ============================================================================
// Off-Screen Canvas Rendering
// ============================================================================

export class OffscreenCanvasRenderer {
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    // Use OffscreenCanvas if available
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(width, height);
      this.ctx = this.canvas.getContext('2d')!;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d')!;
    }
  }

  /**
   * Get the rendering context
   */
  getContext(): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Resize the canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    if (this.canvas instanceof OffscreenCanvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    } else {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Copy to a visible canvas
   */
  copyTo(targetCtx: CanvasRenderingContext2D, region?: Rectangle): void {
    if (region) {
      targetCtx.drawImage(
        this.canvas as any,
        region.x, region.y, region.width, region.height,
        region.x, region.y, region.width, region.height
      );
    } else {
      targetCtx.drawImage(this.canvas as any, 0, 0);
    }
  }

  /**
   * Get image data
   */
  getImageData(region?: Rectangle): ImageData {
    if (region) {
      return this.ctx.getImageData(region.x, region.y, region.width, region.height);
    }
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }
}

// ============================================================================
// Alignment Guide Calculator (Optimized)
// ============================================================================

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
  sourceId: string;
  alignType: 'edge' | 'center';
}

export function calculateAlignmentGuides(
  movingRect: Rectangle,
  staticRects: Array<{ id: string; bounds: Rectangle }>,
  threshold: number = 5
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const movingCenterX = movingRect.x + movingRect.width / 2;
  const movingCenterY = movingRect.y + movingRect.height / 2;
  const movingRight = movingRect.x + movingRect.width;
  const movingBottom = movingRect.y + movingRect.height;

  for (const { id, bounds } of staticRects) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const right = bounds.x + bounds.width;
    const bottom = bounds.y + bounds.height;

    // Left edge alignment
    if (Math.abs(movingRect.x - bounds.x) <= threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.x,
        start: Math.min(movingRect.y, bounds.y),
        end: Math.max(movingBottom, bottom),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Right edge alignment
    if (Math.abs(movingRight - right) <= threshold) {
      guides.push({
        type: 'vertical',
        position: right,
        start: Math.min(movingRect.y, bounds.y),
        end: Math.max(movingBottom, bottom),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Left to right alignment
    if (Math.abs(movingRect.x - right) <= threshold) {
      guides.push({
        type: 'vertical',
        position: right,
        start: Math.min(movingRect.y, bounds.y),
        end: Math.max(movingBottom, bottom),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Right to left alignment
    if (Math.abs(movingRight - bounds.x) <= threshold) {
      guides.push({
        type: 'vertical',
        position: bounds.x,
        start: Math.min(movingRect.y, bounds.y),
        end: Math.max(movingBottom, bottom),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Center X alignment
    if (Math.abs(movingCenterX - centerX) <= threshold) {
      guides.push({
        type: 'vertical',
        position: centerX,
        start: Math.min(movingRect.y, bounds.y),
        end: Math.max(movingBottom, bottom),
        sourceId: id,
        alignType: 'center'
      });
    }

    // Top edge alignment
    if (Math.abs(movingRect.y - bounds.y) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.y,
        start: Math.min(movingRect.x, bounds.x),
        end: Math.max(movingRight, right),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Bottom edge alignment
    if (Math.abs(movingBottom - bottom) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: bottom,
        start: Math.min(movingRect.x, bounds.x),
        end: Math.max(movingRight, right),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Top to bottom alignment
    if (Math.abs(movingRect.y - bottom) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: bottom,
        start: Math.min(movingRect.x, bounds.x),
        end: Math.max(movingRight, right),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Bottom to top alignment
    if (Math.abs(movingBottom - bounds.y) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: bounds.y,
        start: Math.min(movingRect.x, bounds.x),
        end: Math.max(movingRight, right),
        sourceId: id,
        alignType: 'edge'
      });
    }

    // Center Y alignment
    if (Math.abs(movingCenterY - centerY) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: centerY,
        start: Math.min(movingRect.x, bounds.x),
        end: Math.max(movingRight, right),
        sourceId: id,
        alignType: 'center'
      });
    }
  }

  // Deduplicate guides
  const uniqueGuides: AlignmentGuide[] = [];
  const seen = new Set<string>();

  for (const guide of guides) {
    const key = `${guide.type}-${guide.position}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueGuides.push(guide);
    }
  }

  return uniqueGuides;
}

// ============================================================================
// Snap Position Calculator
// ============================================================================

export function calculateSnappedPosition(
  position: Point,
  guides: AlignmentGuide[],
  gridSize: number = 8
): Point {
  let snappedX = position.x;
  let snappedY = position.y;
  let snappedToGuide = false;

  // Try to snap to guides first
  for (const guide of guides) {
    if (guide.type === 'vertical') {
      snappedX = guide.position;
      snappedToGuide = true;
      break;
    }
  }

  for (const guide of guides) {
    if (guide.type === 'horizontal') {
      snappedY = guide.position;
      snappedToGuide = true;
      break;
    }
  }

  // If not snapped to guide, snap to grid
  if (!snappedToGuide) {
    snappedX = Math.round(position.x / gridSize) * gridSize;
    snappedY = Math.round(position.y / gridSize) * gridSize;
  }

  return { x: snappedX, y: snappedY };
}

// ============================================================================
// Performance Monitor
// ============================================================================

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private maxSamples: number;
  private renderCallbacks: (() => void)[] = [];
  private isRunning: boolean = false;

  constructor(maxSamples: number = 60) {
    this.maxSamples = maxSamples;
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Add render callback
   */
  onRender(callback: () => void): () => void {
    this.renderCallbacks.push(callback);
    return () => {
      const index = this.renderCallbacks.indexOf(callback);
      if (index !== -1) this.renderCallbacks.splice(index, 1);
    };
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * Get frame time statistics
   */
  getStats(): { fps: number; avgFrameTime: number; minFrameTime: number; maxFrameTime: number } {
    if (this.frameTimes.length === 0) {
      return { fps: 0, avgFrameTime: 0, minFrameTime: 0, maxFrameTime: 0 };
    }

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const minFrameTime = Math.min(...this.frameTimes);
    const maxFrameTime = Math.max(...this.frameTimes);

    return {
      fps: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      avgFrameTime,
      minFrameTime,
      maxFrameTime
    };
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }

    for (const callback of this.renderCallbacks) {
      callback();
    }

    requestAnimationFrame(this.tick);
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  Quadtree,
  UpdateBatcher,
  throttle,
  debounce,
  LRUCache,
  calculateVirtualList,
  DirtyRectTracker,
  OffscreenCanvasRenderer,
  calculateAlignmentGuides,
  calculateSnappedPosition,
  PerformanceMonitor
};
