// Ultra-Think Hook for Virtualized Alignment Guides
// React hook avec optimisations de performance avancées

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Control } from '../context/types';
import { 
  viewportGuideVirtualizer, 
  ViewportBounds, 
  AlignmentGuide, 
  GuideCalculationResult 
} from '../services/ViewportGuideVirtualizer';

export interface UseVirtualizedGuidesOptions {
  enabled?: boolean;
  debounceMs?: number;
  maxGuides?: number;
  minStrength?: number;
  showPerformanceMetrics?: boolean;
}

export interface UseVirtualizedGuidesReturn {
  // Guide data
  horizontalGuides: AlignmentGuide[];
  verticalGuides: AlignmentGuide[];
  
  // Performance metrics
  performanceMetrics: {
    totalControls: number;
    visibleControls: number;
    cacheHitRate: number;
    calculationTimeMs: number;
    averageCalculationTime: number;
    memoryUsage: number;
  };
  
  // Control methods
  updateViewport: (bounds: ViewportBounds) => void;
  invalidateCache: () => void;
  setEnabled: (enabled: boolean) => void;
  
  // State
  isCalculating: boolean;
  isEnabled: boolean;
}

const DEFAULT_OPTIONS: Required<UseVirtualizedGuidesOptions> = {
  enabled: true,
  debounceMs: 16, // ~60fps
  maxGuides: 50,
  minStrength: 0.1,
  showPerformanceMetrics: false
};

export const useVirtualizedGuides = (
  controls: Control[],
  selectedControlIds: string[] = [],
  options: UseVirtualizedGuidesOptions = {}
): UseVirtualizedGuidesReturn => {
  
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  
  // State management
  const [horizontalGuides, setHorizontalGuides] = useState<AlignmentGuide[]>([]);
  const [verticalGuides, setVerticalGuides] = useState<AlignmentGuide[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEnabled, setIsEnabled] = useState(config.enabled);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalControls: 0,
    visibleControls: 0,
    cacheHitRate: 0,
    calculationTimeMs: 0,
    averageCalculationTime: 0,
    memoryUsage: 0
  });

  // Refs for optimization
  const lastViewportRef = useRef<ViewportBounds | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const calculationIdRef = useRef<number>(0);
  const lastControlsHashRef = useRef<string>('');

  // Memoized controls hash for change detection
  const controlsHash = useMemo(() => {
    return controls
      .map(c => `${c.name}:${c.x},${c.y},${c.width},${c.height}`)
      .sort()
      .join('|');
  }, [controls]);

  // Memoized selected controls hash
  const selectedHash = useMemo(() => {
    return selectedControlIds.sort().join(',');
  }, [selectedControlIds]);

  // Ultra-optimized calculation function
  const calculateGuides = useCallback(async (
    viewport: ViewportBounds,
    immediate = false
  ) => {
    if (!isEnabled || controls.length === 0) {
      setHorizontalGuides([]);
      setVerticalGuides([]);
      return;
    }

    // Skip calculation if nothing changed
    const currentHash = `${controlsHash}_${selectedHash}_${JSON.stringify(viewport)}`;
    if (currentHash === lastControlsHashRef.current && !immediate) {
      return;
    }
    lastControlsHashRef.current = currentHash;

    const calculationId = ++calculationIdRef.current;
    
    if (!immediate && config.debounceMs > 0) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the calculation
      debounceTimerRef.current = setTimeout(() => {
        performCalculation(viewport, calculationId);
      }, config.debounceMs);
    } else {
      performCalculation(viewport, calculationId);
    }
  }, [isEnabled, controls, controlsHash, selectedHash, config.debounceMs]);

  // Internal calculation performer
  const performCalculation = useCallback((viewport: ViewportBounds, calculationId: number) => {
    if (calculationId !== calculationIdRef.current) {
      return; // Stale calculation, ignore
    }

    setIsCalculating(true);

    // Use RAF for smooth performance
    viewportGuideVirtualizer.scheduleCalculation(() => {
      try {
        const result: GuideCalculationResult = viewportGuideVirtualizer.calculateVisibleGuides(
          controls,
          viewport,
          selectedControlIds
        );

        // Check if this is still the current calculation
        if (calculationId === calculationIdRef.current) {
          // Apply limits from configuration
          const limitedHorizontal = result.horizontalGuides
            .filter(g => g.strength >= config.minStrength)
            .slice(0, config.maxGuides);
            
          const limitedVertical = result.verticalGuides
            .filter(g => g.strength >= config.minStrength)
            .slice(0, config.maxGuides);

          setHorizontalGuides(limitedHorizontal);
          setVerticalGuides(limitedVertical);

          // Update performance metrics
          if (config.showPerformanceMetrics) {
            const serviceMetrics = viewportGuideVirtualizer.getPerformanceMetrics();
            setPerformanceMetrics({
              totalControls: result.totalControls,
              visibleControls: result.visibleControls,
              cacheHitRate: result.cacheHitRate,
              calculationTimeMs: result.calculationTimeMs,
              averageCalculationTime: serviceMetrics.averageCalculationTime,
              memoryUsage: serviceMetrics.memoryUsage
            });
          }
        }
      } catch (error) {
        console.error('Guide calculation error:', error);
      } finally {
        setIsCalculating(false);
      }
    });
  }, [controls, selectedControlIds, config.minStrength, config.maxGuides, config.showPerformanceMetrics]);

  // Viewport update handler
  const updateViewport = useCallback((bounds: ViewportBounds) => {
    lastViewportRef.current = bounds;
    calculateGuides(bounds);
  }, [calculateGuides]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    viewportGuideVirtualizer.clearCache();
    if (lastViewportRef.current) {
      calculateGuides(lastViewportRef.current, true);
    }
  }, [calculateGuides]);

  // Enable/disable toggle
  const setEnabledHandler = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setHorizontalGuides([]);
      setVerticalGuides([]);
    } else if (lastViewportRef.current) {
      calculateGuides(lastViewportRef.current, true);
    }
  }, [calculateGuides]);

  // Effect to handle controls changes
  useEffect(() => {
    if (lastViewportRef.current) {
      calculateGuides(lastViewportRef.current);
    }
  }, [controlsHash, selectedHash, calculateGuides]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Auto-enable/disable based on control count for performance
  useEffect(() => {
    const shouldAutoDisable = controls.length > 500; // Disable for very large sets
    if (shouldAutoDisable && isEnabled && config.enabled) {
      console.warn(`Auto-disabling guides for ${controls.length} controls to maintain performance`);
      setIsEnabled(false);
    } else if (!shouldAutoDisable && !isEnabled && config.enabled) {
      setIsEnabled(true);
    }
  }, [controls.length, isEnabled, config.enabled]);

  return {
    // Guide data
    horizontalGuides,
    verticalGuides,
    
    // Performance metrics
    performanceMetrics,
    
    // Control methods
    updateViewport,
    invalidateCache,
    setEnabled: setEnabledHandler,
    
    // State
    isCalculating,
    isEnabled
  };
};

// Performance monitoring hook
export const useGuidePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(() => 
    viewportGuideVirtualizer.getPerformanceMetrics()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(viewportGuideVirtualizer.getPerformanceMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};