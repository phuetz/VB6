// Ultra-Think Virtualized Guide Renderer
// Rendu haute performance des guides d'alignement avec Canvas optimisé

import React, { useRef, useEffect, useCallback, memo } from 'react';
import { AlignmentGuide, ViewportBounds } from '../../services/ViewportGuideVirtualizer';

export interface VirtualizedGuideRendererProps {
  horizontalGuides: AlignmentGuide[];
  verticalGuides: AlignmentGuide[];
  viewport: ViewportBounds;
  width: number;
  height: number;
  showStrength?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface RenderStyle {
  strongGuideColor: string;
  mediumGuideColor: string;
  weakGuideColor: string;
  lineWidth: number;
  dashPattern: number[];
  glowEffect: boolean;
}

const DEFAULT_STYLE: RenderStyle = {
  strongGuideColor: '#FF6B6B', // Red for strong alignment (>70%)
  mediumGuideColor: '#4ECDC4', // Teal for medium alignment (>40%)
  weakGuideColor: '#95E1D3', // Light teal for weak alignment
  lineWidth: 1,
  dashPattern: [5, 5],
  glowEffect: true,
};

// Memoized component for maximum performance
export const VirtualizedGuideRenderer = memo<VirtualizedGuideRendererProps>(
  ({
    horizontalGuides,
    verticalGuides,
    viewport,
    width,
    height,
    showStrength = true,
    className = '',
    style = {},
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const renderStyleRef = useRef<RenderStyle>(DEFAULT_STYLE);

    // Performance optimization: pre-computed path cache
    const pathCacheRef = useRef<Map<string, Path2D>>(new Map());
    const lastRenderHashRef = useRef<string>('');

    // Initialize canvas context with optimizations
    const initializeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d', {
        alpha: true,
        antialias: true,
        desynchronized: true, // Allow async rendering for better performance
      });

      if (!ctx) return null;

      // Enable optimizations
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      contextRef.current = ctx;
      return ctx;
    }, []);

    // Ultra-optimized render function
    const renderGuides = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      if (!canvas || !ctx) return;

      // Performance optimization: check if we need to re-render
      const renderHash = generateRenderHash(
        horizontalGuides,
        verticalGuides,
        viewport,
        width,
        height
      );
      if (renderHash === lastRenderHashRef.current) {
        return; // No changes, skip render
      }
      lastRenderHashRef.current = renderHash;

      // Clear canvas efficiently
      ctx.clearRect(0, 0, width, height);

      // Set up rendering context for guides
      ctx.save();

      // Apply viewport transformation
      ctx.translate(-viewport.left, -viewport.top);
      ctx.scale(viewport.zoom, viewport.zoom);

      // Render horizontal guides
      renderGuideSet(ctx, horizontalGuides, 'horizontal');

      // Render vertical guides
      renderGuideSet(ctx, verticalGuides, 'vertical');

      ctx.restore();
    }, [horizontalGuides, verticalGuides, viewport, width, height]);

    // Optimized guide set rendering
    const renderGuideSet = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        guides: AlignmentGuide[],
        type: 'horizontal' | 'vertical'
      ) => {
        if (guides.length === 0) return;

        // Group guides by strength for batch rendering
        const strongGuides = guides.filter(g => g.strength >= 0.7);
        const mediumGuides = guides.filter(g => g.strength >= 0.4 && g.strength < 0.7);
        const weakGuides = guides.filter(g => g.strength < 0.4);

        // Render in batches for better performance
        renderGuideBatch(ctx, strongGuides, type, renderStyleRef.current.strongGuideColor);
        renderGuideBatch(ctx, mediumGuides, type, renderStyleRef.current.mediumGuideColor);
        renderGuideBatch(ctx, weakGuides, type, renderStyleRef.current.weakGuideColor);
      },
      []
    );

    // Batch rendering for same-style guides
    const renderGuideBatch = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        guides: AlignmentGuide[],
        type: 'horizontal' | 'vertical',
        color: string
      ) => {
        if (guides.length === 0) return;

        ctx.save();

        // Set up style for this batch
        ctx.strokeStyle = color;
        ctx.lineWidth = renderStyleRef.current.lineWidth / viewport.zoom;
        ctx.lineCap = 'round';
        ctx.setLineDash(renderStyleRef.current.dashPattern);

        // Add glow effect for strong guides
        if (
          renderStyleRef.current.glowEffect &&
          color === renderStyleRef.current.strongGuideColor
        ) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 4 / viewport.zoom;
        }

        // Begin path for batch drawing
        ctx.beginPath();

        guides.forEach(guide => {
          if (type === 'horizontal') {
            // Horizontal line across viewport
            const y = guide.position;
            const startX = viewport.left - 50;
            const endX = viewport.right + 50;

            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
          } else {
            // Vertical line across viewport
            const x = guide.position;
            const startY = viewport.top - 50;
            const endY = viewport.bottom + 50;

            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
          }
        });

        // Draw all lines in one batch operation
        ctx.stroke();

        // Render strength indicators if enabled
        if (showStrength) {
          renderStrengthIndicators(ctx, guides, type);
        }

        ctx.restore();
      },
      [viewport, showStrength]
    );

    // Render strength indicators (small numbers showing alignment percentage)
    const renderStrengthIndicators = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        guides: AlignmentGuide[],
        type: 'horizontal' | 'vertical'
      ) => {
        ctx.save();

        ctx.font = `${Math.max(10, 12 / viewport.zoom)}px monospace`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        guides.forEach(guide => {
          const percentage = Math.round(guide.strength * 100);
          const text = `${percentage}%`;

          if (type === 'horizontal') {
            // Position text at left edge of viewport
            const x = viewport.left + 20;
            const y = guide.position;

            // Background for readability
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x - textWidth / 2 - 2, y - 6, textWidth + 4, 12);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(text, x, y);
          } else {
            // Position text at top edge of viewport
            const x = guide.position;
            const y = viewport.top + 20;

            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x - textWidth / 2 - 2, y - 6, textWidth + 4, 12);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(text, x, y);
          }
        });

        ctx.restore();
      },
      [viewport]
    );

    // Generate hash for render optimization
    const generateRenderHash = (
      hGuides: AlignmentGuide[],
      vGuides: AlignmentGuide[],
      vp: ViewportBounds,
      w: number,
      h: number
    ): string => {
      const guidesHash = [...hGuides, ...vGuides]
        .map(g => `${g.id}:${g.position}:${g.strength}`)
        .join('|');

      return `${guidesHash}_${vp.left}_${vp.top}_${vp.zoom}_${w}_${h}`;
    };

    // Scheduled rendering with RAF
    const scheduleRender = useCallback(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        renderGuides();
        animationFrameRef.current = null;
      });
    }, [renderGuides]);

    // Initialize canvas on mount
    useEffect(() => {
      initializeCanvas();
    }, [initializeCanvas]);

    // Handle canvas resize
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set actual canvas size for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale context for high DPI displays
      const ctx = contextRef.current;
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Set CSS size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      scheduleRender();
    }, [width, height, scheduleRender]);

    // Trigger re-render when guides change
    useEffect(() => {
      scheduleRender();
    }, [horizontalGuides, verticalGuides, viewport, scheduleRender]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`virtualized-guide-renderer ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 10,
          ...style,
        }}
        width={width}
        height={height}
      />
    );
  }
);

VirtualizedGuideRenderer.displayName = 'VirtualizedGuideRenderer';

export default VirtualizedGuideRenderer;
