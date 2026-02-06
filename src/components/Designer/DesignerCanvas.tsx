import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Control } from '../../context/types';
import { useVB6 } from '../../context/VB6Context';
import { ControlManipulator } from './ControlManipulator';
import { PositionIndicator } from './PositionIndicator';
import { GridManager } from './GridManager';
import { SelectionManager } from './SelectionManager';
import { DesignToolbar } from './DesignToolbar';
import { PropertyPanel } from './PropertyPanel';
import { useControlManipulation } from '../../hooks/useControlManipulation';
import { useVirtualizedGuides } from '../../hooks/useVirtualizedGuides';
import { VirtualizedGuideRenderer } from './VirtualizedGuideRenderer';
import { GuidePerformanceMonitor } from '../Performance/GuidePerformanceMonitor';
import { ViewportBounds } from '../../services/ViewportGuideVirtualizer';
import ControlRenderer from './ControlRenderer';

interface DesignerCanvasProps {
  width: number;
  height: number;
  backgroundColor: string;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  width,
  height,
  backgroundColor,
}) => {
  const { state, dispatch, updateControl, copyControls, pasteControls } = useVB6();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Ultra-Think: Performance monitoring and viewport state
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [viewport, setViewport] = useState<ViewportBounds>({
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    zoom: 1,
  });

  // Update viewport when canvas dimensions change
  useEffect(() => {
    setViewport(prev => ({
      ...prev,
      right: prev.left + width,
      bottom: prev.top + height,
      width,
      height,
    }));
  }, [width, height]);

  const {
    dragState,
    alignmentGuides,
    startDrag,
    startResize,
    handleMouseMove,
    handleMouseUp,
    handleKeyboardMove,
    handleKeyboardResize,
    alignControls,
    makeSameSize,
  } = useControlManipulation(
    state.controls,
    state.selectedControls,
    controls => {
      // PERFORMANCE ANTI-PATTERN BUG FIX: Batch control updates instead of individual calls
      controls.forEach(control => {
        // Batch all property updates into a single call for better performance
        dispatch({
          type: 'BATCH_UPDATE_CONTROL',
          payload: {
            controlId: control.id,
            updates: {
              x: control.x,
              y: control.y,
              width: control.width,
              height: control.height,
            },
          },
        });
      });
    },
    {
      snapToGrid: true,
      gridSize: state.gridSize,
      showAlignmentGuides: state.showAlignmentGuides,
      enableKeyboardMovement: true,
      multiSelectEnabled: true,
    }
  );

  // Ultra-Think: Virtualized guides for maximum performance
  const selectedControlNames = useMemo(
    () => state.selectedControls.map(c => c.name),
    [state.selectedControls]
  );

  const {
    horizontalGuides: virtualizedHorizontalGuides,
    verticalGuides: virtualizedVerticalGuides,
    performanceMetrics,
    updateViewport,
    invalidateCache,
    isCalculating,
    isEnabled: guidesEnabled,
  } = useVirtualizedGuides(state.controls, selectedControlNames, {
    enabled: state.showAlignmentGuides && state.controls.length > 10, // Only for complex scenarios
    debounceMs: 16,
    maxGuides: 30,
    minStrength: 0.15,
    showPerformanceMetrics: showPerformanceMonitor,
  });

  // Viewport update handler for scroll/zoom events
  const handleViewportChange = useCallback(
    (newViewport: Partial<ViewportBounds>) => {
      setViewport(prev => {
        const updated = { ...prev, ...newViewport };
        updateViewport(updated);
        return updated;
      });
    },
    [updateViewport]
  );

  // Performance: Update viewport on scroll/zoom
  const handleCanvasScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      handleViewportChange({
        left: target.scrollLeft,
        top: target.scrollTop,
        right: target.scrollLeft + target.clientWidth,
        bottom: target.scrollTop + target.clientHeight,
      });
    },
    [handleViewportChange]
  );

  // Global event listeners for drag and resize operations
  useEffect(() => {
    if (dragState.isDragging || dragState.isResizing) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        handleMouseMove(e);
      };

      const handleGlobalMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        handleMouseUp();
      };

      // Add global event listeners
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      // Disable text selection during drag/resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = dragState.isResizing ? 'resize' : 'move';

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [dragState.isDragging, dragState.isResizing, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts for manipulation
  useEffect(() => {
    if (state.executionMode === 'design') {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // Ultra-Think: Performance monitor toggle (Ctrl+Shift+P)
        if (e.key === 'P' && e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          setShowPerformanceMonitor(prev => !prev);
          return;
        }

        // Cache invalidation shortcut (Ctrl+Shift+R)
        if (e.key === 'R' && e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          invalidateCache();
          return;
        }

        // Handle movement and resize shortcuts
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          if (e.ctrlKey) {
            handleKeyboardResize(e);
          } else {
            handleKeyboardMove(e);
          }
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [state.executionMode, handleKeyboardMove, handleKeyboardResize, invalidateCache]);

  // PERFORMANCE FIX: Memoize selected control IDs for O(1) lookup
  const selectedControlIds = useMemo(
    () => new Set(state.selectedControls.map(c => c.id)),
    [state.selectedControls]
  );

  const handleControlSelect = useCallback(
    (control: Control, addToSelection: boolean) => {
      if (addToSelection) {
        const isSelected = selectedControlIds.has(control.id);
        if (isSelected) {
          dispatch({
            type: 'SELECT_CONTROLS',
            payload: {
              controlIds: state.selectedControls.filter(c => c.id !== control.id).map(c => c.id),
            },
          });
        } else {
          dispatch({
            type: 'SELECT_CONTROLS',
            payload: { controlIds: [...state.selectedControls.map(c => c.id), control.id] },
          });
        }
      } else {
        dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [control.id] } });
      }
    },
    [state.selectedControls, dispatch]
  );

  const handleSelectionChange = useCallback(
    (controls: Control[]) => {
      dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: controls.map(c => c.id) } });
    },
    [dispatch]
  );

  const handleUpdateControls = useCallback(
    (controls: Control[]) => {
      controls.forEach(control => {
        updateControl(control.id, 'x', control.x);
        updateControl(control.id, 'y', control.y);
        updateControl(control.id, 'width', control.width);
        updateControl(control.id, 'height', control.height);
      });
    },
    [updateControl]
  );

  const handleMove = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
      const step = amount * state.gridSize;

      state.selectedControls.forEach(control => {
        switch (direction) {
          case 'up':
            updateControl(control.id, 'y', Math.max(0, control.y - step));
            break;
          case 'down':
            updateControl(control.id, 'y', control.y + step);
            break;
          case 'left':
            updateControl(control.id, 'x', Math.max(0, control.x - step));
            break;
          case 'right':
            updateControl(control.id, 'x', control.x + step);
            break;
        }
      });
    },
    [state.selectedControls, state.gridSize, updateControl]
  );

  const handleResize = useCallback(
    (direction: 'width' | 'height', amount: number) => {
      const step = amount * state.gridSize;

      state.selectedControls.forEach(control => {
        if (direction === 'width') {
          updateControl(control.id, 'width', Math.max(20, control.width + step));
        } else {
          updateControl(control.id, 'height', Math.max(20, control.height + step));
        }
      });
    },
    [state.selectedControls, state.gridSize, updateControl]
  );

  const handleBringToFront = useCallback(() => {
    const maxZIndex = Math.max(...state.controls.map(c => c.tabIndex || 0));
    state.selectedControls.forEach(control => {
      updateControl(control.id, 'tabIndex', maxZIndex + 1);
    });
  }, [state.controls, state.selectedControls, updateControl]);

  const handleSendToBack = useCallback(() => {
    const minZIndex = Math.min(...state.controls.map(c => c.tabIndex || 0));
    state.selectedControls.forEach(control => {
      updateControl(control.id, 'tabIndex', minZIndex - 1);
    });
  }, [state.controls, state.selectedControls, updateControl]);

  const handleLock = useCallback(() => {
    state.selectedControls.forEach(control => {
      updateControl(control.id, 'locked', true);
    });
  }, [state.selectedControls, updateControl]);

  const handleUnlock = useCallback(() => {
    state.selectedControls.forEach(control => {
      updateControl(control.id, 'locked', false);
    });
  }, [state.selectedControls, updateControl]);

  const handleToggleVisibility = useCallback(() => {
    const allVisible = state.selectedControls.every(c => c.visible);
    state.selectedControls.forEach(control => {
      updateControl(control.id, 'visible', !allVisible);
    });
  }, [state.selectedControls, updateControl]);

  const handleDelete = useCallback(() => {
    if (state.selectedControls.length > 0) {
      dispatch({
        type: 'DELETE_CONTROLS',
        payload: { controlIds: state.selectedControls.map(c => c.id) },
      });
    }
  }, [state.selectedControls, dispatch]);

  const handlePropertyChange = useCallback(
    (control: Control, property: string, value: any) => {
      if (property.includes('.')) {
        const [top, sub] = property.split('.');
        const updated = {
          ...((control as Record<string, unknown>)[top] as Record<string, unknown>),
          [sub]: value,
        };
        updateControl(control.id, top, updated);
      } else {
        updateControl(control.id, property, value);
      }
    },
    [updateControl]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {state.executionMode === 'design' && (
        <DesignToolbar
          selectedControls={state.selectedControls}
          onAlign={alignControls}
          onMakeSameSize={makeSameSize}
          onMove={handleMove}
          onResize={handleResize}
          onCopy={copyControls}
          onCut={() => {
            copyControls();
            handleDelete();
          }}
          onPaste={pasteControls}
          onDelete={handleDelete}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onLock={handleLock}
          onUnlock={handleUnlock}
          onToggleVisibility={handleToggleVisibility}
          showGrid={state.showGrid}
          onToggleGrid={() =>
            dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showGrid' } })
          }
          snapToGrid={true}
          onToggleSnap={() => {}}
          gridSize={state.gridSize}
          onGridSizeChange={size => dispatch({ type: 'SET_GRID_SIZE', payload: { size } })}
        />
      )}

      {/* Canvas Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 p-4 overflow-auto bg-gray-300" onScroll={handleCanvasScroll}>
          <div
            ref={canvasRef}
            role="application"
            aria-label="Form Designer Canvas"
            aria-roledescription="design surface"
            className="relative shadow-lg mx-auto"
            style={{
              width,
              height,
              backgroundColor,
              border: '1px solid #000',
            }}
          >
            {/* Ultra-Think: Virtualized Guide Renderer */}
            {guidesEnabled && state.showAlignmentGuides && (
              <VirtualizedGuideRenderer
                horizontalGuides={virtualizedHorizontalGuides}
                verticalGuides={virtualizedVerticalGuides}
                viewport={viewport}
                width={width}
                height={height}
                showStrength={true}
                style={{ zIndex: 5 }}
              />
            )}

            {/* Legacy alignment guides (fallback for small control sets) */}
            {!guidesEnabled &&
              state.showAlignmentGuides &&
              alignmentGuides.map((guide, index) => (
                <div
                  key={index}
                  className="absolute pointer-events-none"
                  style={{
                    left: guide.type === 'vertical' ? guide.position : 0,
                    top: guide.type === 'horizontal' ? guide.position : 0,
                    width: guide.type === 'vertical' ? '1px' : '100%',
                    height: guide.type === 'horizontal' ? '1px' : '100%',
                    backgroundColor: '#ff6b6b',
                    borderStyle: 'dashed',
                    zIndex: 5,
                  }}
                />
              ))}
            {/* Grid */}
            <GridManager
              show={state.showGrid && state.executionMode === 'design'}
              size={state.gridSize}
              containerWidth={width}
              containerHeight={height}
            />

            {/* Selection Manager */}
            {state.executionMode === 'design' && (
              <SelectionManager
                controls={state.controls}
                selectedControls={state.selectedControls}
                onSelectionChange={handleSelectionChange}
                executionMode={state.executionMode}
                containerRef={canvasRef}
              />
            )}

            {/* Controls */}
            {state.controls.map(control => (
              <ControlManipulator
                key={control.id}
                control={control}
                isSelected={selectedControlIds.has(control.id)}
                isMultiSelected={state.selectedControls.length > 1}
                onSelect={handleControlSelect}
                onUpdateControl={updatedControl => handleUpdateControls([updatedControl])}
                onUpdateControls={handleUpdateControls}
                allControls={state.controls}
                selectedControls={state.selectedControls}
                executionMode={state.executionMode}
                snapToGrid={true}
                gridSize={state.gridSize}
                showAlignmentGuides={state.showAlignmentGuides}
              >
                <ControlRenderer
                  control={control}
                  onStartDrag={startDrag}
                  onStartResize={startResize}
                  dragState={dragState}
                />
              </ControlManipulator>
            ))}

            {/* Position Indicators */}
            {state.executionMode === 'design' &&
              state.selectedControls.map(control => (
                <PositionIndicator
                  key={`indicator-${control.id}`}
                  control={control}
                  isVisible={true}
                  showSize={true}
                  showCoordinates={true}
                />
              ))}
          </div>
        </div>

        {/* Property Panel */}
        {state.executionMode === 'design' && state.selectedControls.length === 1 && (
          <div className="w-64 p-4 bg-gray-100 border-l border-gray-400">
            <PropertyPanel
              control={state.selectedControls[0]}
              onPropertyChange={(property, value) =>
                handlePropertyChange(state.selectedControls[0], property, value)
              }
            />
          </div>
        )}
      </div>

      {/* Ultra-Think: Performance Monitor */}
      <GuidePerformanceMonitor
        visible={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
        position="bottom-right"
        compact={false}
      />

      {/* Performance monitoring indicator when guides are calculating */}
      {isCalculating && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-purple-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Optimizing guides...
        </div>
      )}

      {/* Debug info overlay (Ctrl+Shift+P to toggle) */}
      {showPerformanceMonitor && (
        <div className="fixed top-20 left-4 z-40 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
          <div>Controls: {state.controls.length}</div>
          <div>Visible: {performanceMetrics.visibleControls}</div>
          <div>H-Guides: {virtualizedHorizontalGuides.length}</div>
          <div>V-Guides: {virtualizedVerticalGuides.length}</div>
          <div>Cache: {(performanceMetrics.cacheHitRate * 100).toFixed(0)}%</div>
          <div>Calc: {performanceMetrics.calculationTimeMs.toFixed(1)}ms</div>
        </div>
      )}
    </div>
  );
};
