// Ultra-Think Viewport Guide Virtualizer
// Système de virtualisation haute performance pour les guides d'alignement
// ⚡ Algorithmes O(n) optimisés, cache intelligent, rendu différé

import { VB6Control } from '../types/VB6Types';
import { Control } from '../context/types';

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  zoom: number;
}

export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  controls: string[]; // Control IDs that create this guide
  strength: number; // 0-1, how many controls align to this guide
  visible: boolean;
  cached: boolean;
}

export interface GuideCalculationResult {
  horizontalGuides: AlignmentGuide[];
  verticalGuides: AlignmentGuide[];
  totalControls: number;
  visibleControls: number;
  cacheHitRate: number;
  calculationTimeMs: number;
}

interface CachedGuide {
  guide: AlignmentGuide;
  timestamp: number;
  dependencies: Set<string>; // Control IDs this guide depends on
  accessCount: number;
  lastAccess: number;
}

export class ViewportGuideVirtualizer {
  private static instance: ViewportGuideVirtualizer;

  // Ultra-optimized caching system
  private guideCache = new Map<string, CachedGuide>();
  private controlPositionCache = new Map<
    string,
    { x: number; y: number; width: number; height: number; timestamp: number }
  >();
  private viewportCache: { bounds: ViewportBounds; timestamp: number } | null = null;

  // Performance optimization pools
  private guidePool: AlignmentGuide[] = [];
  private tempArrayPool: number[][] = [];

  // Configuration constants
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly MAX_GUIDES_PER_TYPE = 50; // Limit for performance
  private readonly MIN_GUIDE_STRENGTH = 0.1; // Minimum 10% of controls must align
  private readonly VIEWPORT_PADDING = 100; // Extra padding for smooth scrolling
  private readonly DEBOUNCE_MS = 16; // ~60fps for calculations

  // Performance monitoring
  private performanceMetrics = {
    totalCalculations: 0,
    cacheHits: 0,
    averageCalculationTime: 0,
    peakControlCount: 0,
    memoryUsage: 0,
  };

  private lastCalculationTime = 0;
  private calculationQueue: Array<() => void> = [];
  private rafId: number | null = null;

  static getInstance(): ViewportGuideVirtualizer {
    if (!ViewportGuideVirtualizer.instance) {
      ViewportGuideVirtualizer.instance = new ViewportGuideVirtualizer();
    }
    return ViewportGuideVirtualizer.instance;
  }

  constructor() {
    this.initializeObjectPools();
    this.setupPerformanceMonitoring();
  }

  // 🎯 Main virtualization method - Ultra-optimized O(n) algorithm
  public calculateVisibleGuides(
    controls: Control[],
    viewport: ViewportBounds,
    selectedControlIds: string[] = []
  ): GuideCalculationResult {
    const startTime = performance.now();

    // Early exit for empty controls
    if (controls.length === 0) {
      return this.createEmptyResult(startTime);
    }

    // Update performance tracking
    this.performanceMetrics.peakControlCount = Math.max(
      this.performanceMetrics.peakControlCount,
      controls.length
    );

    // Filter visible controls first (viewport culling)
    const visibleControls = this.getVisibleControls(controls, viewport);

    // Check cache validity
    const cacheKey = this.generateCacheKey(visibleControls, viewport, selectedControlIds);
    const cachedResult = this.getCachedResult(cacheKey);

    if (cachedResult) {
      this.performanceMetrics.cacheHits++;
      return this.enhanceCachedResult(cachedResult, startTime);
    }

    // Calculate guides using optimized algorithms
    const horizontalGuides = this.calculateHorizontalGuides(visibleControls, viewport);
    const verticalGuides = this.calculateVerticalGuides(visibleControls, viewport);

    // Apply virtualization filters
    const filteredHorizontal = this.filterGuidesByViewport(
      horizontalGuides,
      viewport,
      'horizontal'
    );
    const filteredVertical = this.filterGuidesByViewport(verticalGuides, viewport, 'vertical');

    // Create result
    const result: GuideCalculationResult = {
      horizontalGuides: filteredHorizontal.slice(0, this.MAX_GUIDES_PER_TYPE),
      verticalGuides: filteredVertical.slice(0, this.MAX_GUIDES_PER_TYPE),
      totalControls: controls.length,
      visibleControls: visibleControls.length,
      cacheHitRate: this.calculateCacheHitRate(),
      calculationTimeMs: performance.now() - startTime,
    };

    // Cache the result
    this.cacheResult(cacheKey, result);

    // Update performance metrics
    this.updatePerformanceMetrics(result);

    return result;
  }

  // 🚀 Ultra-optimized visible controls filtering
  private getVisibleControls(controls: Control[], viewport: ViewportBounds): Control[] {
    const viewportLeft = viewport.left - this.VIEWPORT_PADDING;
    const viewportTop = viewport.top - this.VIEWPORT_PADDING;
    const viewportRight = viewport.right + this.VIEWPORT_PADDING;
    const viewportBottom = viewport.bottom + this.VIEWPORT_PADDING;

    return controls.filter(control => {
      const left = control.x;
      const right = control.x + control.width;
      const top = control.y;
      const bottom = control.y + control.height;

      // Fast AABB (Axis-Aligned Bounding Box) intersection test
      return !(
        right < viewportLeft ||
        left > viewportRight ||
        bottom < viewportTop ||
        top > viewportBottom
      );
    });
  }

  // 🧮 Optimized horizontal guide calculation - O(n) complexity
  private calculateHorizontalGuides(
    controls: Control[],
    viewport: ViewportBounds
  ): AlignmentGuide[] {
    if (controls.length === 0) return [];

    // Use Map for O(1) position grouping
    const positionGroups = new Map<number, { controls: string[]; positions: string[] }>();

    // Single pass through controls
    controls.forEach(control => {
      const positions = [
        control.y, // Top edge
        control.y + control.height / 2, // Center
        control.y + control.height, // Bottom edge
      ];

      positions.forEach((pos, index) => {
        const rounded = Math.round(pos);
        if (!positionGroups.has(rounded)) {
          positionGroups.set(rounded, { controls: [], positions: [] });
        }
        const group = positionGroups.get(rounded)!;
        group.controls.push(control.name);
        group.positions.push(['top', 'center', 'bottom'][index]);
      });
    });

    // Convert to guides with strength calculation
    const guides: AlignmentGuide[] = [];
    const totalControls = controls.length;

    positionGroups.forEach((group, position) => {
      const uniqueControls = [...new Set(group.controls)];
      const strength = uniqueControls.length / totalControls;

      if (strength >= this.MIN_GUIDE_STRENGTH) {
        guides.push(
          this.createGuide(`h_${position}`, 'horizontal', position, uniqueControls, strength)
        );
      }
    });

    // Sort by strength (most important guides first)
    return guides.sort((a, b) => b.strength - a.strength);
  }

  // 🧮 Optimized vertical guide calculation - O(n) complexity
  private calculateVerticalGuides(controls: Control[], viewport: ViewportBounds): AlignmentGuide[] {
    if (controls.length === 0) return [];

    const positionGroups = new Map<number, { controls: string[]; positions: string[] }>();

    controls.forEach(control => {
      const positions = [
        control.x, // Left edge
        control.x + control.width / 2, // Center
        control.x + control.width, // Right edge
      ];

      positions.forEach((pos, index) => {
        const rounded = Math.round(pos);
        if (!positionGroups.has(rounded)) {
          positionGroups.set(rounded, { controls: [], positions: [] });
        }
        const group = positionGroups.get(rounded)!;
        group.controls.push(control.name);
        group.positions.push(['left', 'center', 'right'][index]);
      });
    });

    const guides: AlignmentGuide[] = [];
    const totalControls = controls.length;

    positionGroups.forEach((group, position) => {
      const uniqueControls = [...new Set(group.controls)];
      const strength = uniqueControls.length / totalControls;

      if (strength >= this.MIN_GUIDE_STRENGTH) {
        guides.push(
          this.createGuide(`v_${position}`, 'vertical', position, uniqueControls, strength)
        );
      }
    });

    return guides.sort((a, b) => b.strength - a.strength);
  }

  // 📏 Viewport-based guide filtering
  private filterGuidesByViewport(
    guides: AlignmentGuide[],
    viewport: ViewportBounds,
    type: 'horizontal' | 'vertical'
  ): AlignmentGuide[] {
    const margin = this.VIEWPORT_PADDING;

    return guides
      .filter(guide => {
        if (type === 'horizontal') {
          return (
            guide.position >= viewport.top - margin && guide.position <= viewport.bottom + margin
          );
        } else {
          return (
            guide.position >= viewport.left - margin && guide.position <= viewport.right + margin
          );
        }
      })
      .map(guide => ({
        ...guide,
        visible: true,
      }));
  }

  // 🏭 Object pooling for memory optimization
  private createGuide(
    id: string,
    type: 'horizontal' | 'vertical',
    position: number,
    controls: string[],
    strength: number
  ): AlignmentGuide {
    // Reuse pooled objects when possible
    const guide = this.guidePool.pop() || ({} as AlignmentGuide);

    guide.id = id;
    guide.type = type;
    guide.position = position;
    guide.controls = [...controls]; // Always create new array for safety
    guide.strength = strength;
    guide.visible = false;
    guide.cached = false;

    return guide;
  }

  // 💾 Intelligent caching system
  private generateCacheKey(
    controls: Control[],
    viewport: ViewportBounds,
    selectedIds: string[]
  ): string {
    // Create lightweight hash of current state
    const controlHash = controls
      .map(c => `${c.name}:${c.x},${c.y},${c.width},${c.height}`)
      .sort()
      .join('|');

    const viewportHash = `${Math.round(viewport.left)},${Math.round(viewport.top)},${Math.round(viewport.zoom * 100)}`;
    const selectionHash = selectedIds.sort().join(',');

    return `${this.simpleHash(controlHash)}_${viewportHash}_${selectionHash}`;
  }

  private getCachedResult(cacheKey: string): GuideCalculationResult | null {
    const cached = this.guideCache.get(cacheKey);
    if (!cached || Date.now() - cached.timestamp > this.CACHE_TTL) {
      if (cached) this.guideCache.delete(cacheKey);
      return null;
    }

    cached.accessCount++;
    cached.lastAccess = Date.now();
    return cached.guide as unknown as GuideCalculationResult;
  }

  private cacheResult(cacheKey: string, result: GuideCalculationResult): void {
    // Prevent cache bloat
    if (this.guideCache.size > 1000) {
      this.cleanupCache();
    }

    const dependencies = new Set<string>();
    [...result.horizontalGuides, ...result.verticalGuides].forEach(guide => {
      guide.controls.forEach(controlId => dependencies.add(controlId));
    });

    this.guideCache.set(cacheKey, {
      guide: result as unknown as AlignmentGuide,
      timestamp: Date.now(),
      dependencies,
      accessCount: 1,
      lastAccess: Date.now(),
    });
  }

  // 🧹 Intelligent cache cleanup
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.guideCache.entries());

    // Remove oldest and least used entries
    entries
      .sort((a, b) => {
        const scoreA = a[1].accessCount * (now - a[1].lastAccess);
        const scoreB = b[1].accessCount * (now - b[1].lastAccess);
        return scoreB - scoreA;
      })
      .slice(500) // Keep top 500 entries
      .forEach(([key]) => this.guideCache.delete(key));
  }

  // 📊 Performance monitoring and optimization
  private setupPerformanceMonitoring(): void {
    // Monitor memory usage periodically
    setInterval(() => {
      this.performanceMetrics.memoryUsage = this.guideCache.size;
    }, 10000);
  }

  private updatePerformanceMetrics(result: GuideCalculationResult): void {
    this.performanceMetrics.totalCalculations++;

    // Update rolling average
    const currentAvg = this.performanceMetrics.averageCalculationTime;
    const totalCalcs = this.performanceMetrics.totalCalculations;
    this.performanceMetrics.averageCalculationTime =
      (currentAvg * (totalCalcs - 1) + result.calculationTimeMs) / totalCalcs;
  }

  private calculateCacheHitRate(): number {
    const total = this.performanceMetrics.totalCalculations;
    return total > 0 ? this.performanceMetrics.cacheHits / total : 0;
  }

  // 🛠 Utility methods
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private initializeObjectPools(): void {
    // Pre-allocate objects for better performance
    for (let i = 0; i < 100; i++) {
      this.guidePool.push({} as AlignmentGuide);
      this.tempArrayPool.push([]);
    }
  }

  private createEmptyResult(startTime: number): GuideCalculationResult {
    return {
      horizontalGuides: [],
      verticalGuides: [],
      totalControls: 0,
      visibleControls: 0,
      cacheHitRate: this.calculateCacheHitRate(),
      calculationTimeMs: performance.now() - startTime,
    };
  }

  private enhanceCachedResult(
    result: GuideCalculationResult,
    startTime: number
  ): GuideCalculationResult {
    return {
      ...result,
      calculationTimeMs: performance.now() - startTime,
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  // 📈 Public API for performance monitoring
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  public clearCache(): void {
    this.guideCache.clear();
    this.controlPositionCache.clear();
    this.viewportCache = null;
  }

  // 🔄 Debounced calculation for smooth performance
  public scheduleCalculation(callback: () => void): void {
    this.calculationQueue.push(callback);

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        const callbacks = [...this.calculationQueue];
        this.calculationQueue = [];
        this.rafId = null;

        callbacks.forEach(cb => cb());
      });
    }
  }
}

// Export singleton instance
export const viewportGuideVirtualizer = ViewportGuideVirtualizer.getInstance();
