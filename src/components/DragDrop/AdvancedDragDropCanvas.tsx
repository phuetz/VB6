import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useDragDrop } from './DragDropProvider';
import { DroppableZone } from './DroppableZone';
import { AnimatedDrop, MagneticSnap, PulseHighlight, RippleEffect } from './AnimatedTransitions';
import { useVB6Store } from '../../stores/vb6Store';
import ControlRenderer from '../Designer/ControlRenderer';
import Grid from '../Designer/Grid';
import { useControlManipulation } from '../../hooks/useControlManipulation';
import { Control } from '../../context/types';

// Add more descriptive logging to help debug issues
interface AdvancedDragDropCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

const CanvasContent: React.FC<AdvancedDragDropCanvasProps> = ({
  width = 800,
  height = 600,
  backgroundColor = '#8080FF',
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [rippleTriggered, setRippleTriggered] = useState(false);
  const [snapGuides, setSnapGuides] = useState<
    Array<{ x?: number; y?: number; controlId?: number }>
  >([]);
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    active: boolean;
  }>({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, active: false });

  const controls = useVB6Store(state => state.controls);
  const selectedControls = useVB6Store(state => state.selectedControls);
  const executionMode = useVB6Store(state => state.executionMode);
  const snapToGrid = useVB6Store(state => state.snapToGrid);
  const gridSize = useVB6Store(state => state.gridSize);
  const createControl = useVB6Store(state => state.createControl);
  const updateControl = useVB6Store(state => state.updateControl);
  const selectControls = useVB6Store(state => state.selectControls);
  const showGrid = useVB6Store(state => state.showGrid);
  const designerZoom = useVB6Store(state => state.designerZoom);
  const addLog = useVB6Store(state => state.addLog);

  // Intégration du système de manipulation de contrôles
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
    controls,
    // PERFORMANCE FIX: O(n²) → O(n) - Use Map for O(1) lookup
    (() => {
      const controlsMap = new Map(controls.map(c => [c.id, c]));
      return selectedControls.map(id => controlsMap.get(id)).filter(Boolean) as Control[];
    })(),
    (updatedControls: Control[]) => {
      updatedControls.forEach(control => {
        updateControl(control.id, 'x', control.x);
        updateControl(control.id, 'y', control.y);
        updateControl(control.id, 'width', control.width);
        updateControl(control.id, 'height', control.height);
      });
    },
    {
      snapToGrid: snapToGrid,
      gridSize: gridSize,
      showAlignmentGuides: true,
      enableKeyboardMovement: true,
      multiSelectEnabled: true,
    }
  );

  const { isDragging: isToolboxDragging, vibrate, playDropSound, dragData } = useDragDrop();

  const zoomFactor = designerZoom / 100;

  // CRITICAL FIX: Cursor state machine to resolve conflicts
  const getCursor = useMemo(() => {
    if (selectionBox.active) return 'crosshair';
    if (dragState.isResizing) {
      const handle = dragState.currentHandle;
      switch (handle) {
        case 'nw':
        case 'se':
          return 'nw-resize';
        case 'ne':
        case 'sw':
          return 'ne-resize';
        case 'n':
        case 's':
          return 'n-resize';
        case 'e':
        case 'w':
          return 'w-resize';
        default:
          return 'resize';
      }
    }
    if (dragState.isDragging) return 'grabbing';
    if (isToolboxDragging) return 'copy';
    return 'default';
  }, [
    selectionBox.active,
    dragState.isResizing,
    dragState.isDragging,
    dragState.currentHandle,
    isToolboxDragging,
  ]);

  // Event listeners globaux pour le système de manipulation
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

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = getCursor;

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [dragState.isDragging, dragState.isResizing, handleMouseMove, handleMouseUp, getCursor]);

  // Raccourcis clavier pour manipulation
  useEffect(() => {
    if (executionMode === 'design') {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
  }, [executionMode, handleKeyboardMove, handleKeyboardResize]);

  // Gestion du drop de nouveaux contrôles
  const handleControlDrop = useCallback(
    (data: any, position: { x: number; y: number }) => {
      addLog('debug', 'CanvasDrop', `Drop event received`, { data, position });

      if (data.type === 'new-control') {
        addLog('info', 'CanvasDrop', `Creating new ${data.controlType} control`, { position });

        // Créer un nouveau contrôle
        let finalX = position.x / zoomFactor;
        let finalY = position.y / zoomFactor;

        // Snap to grid
        if (snapToGrid) {
          finalX = Math.round(finalX / gridSize) * gridSize;
          finalY = Math.round(finalY / gridSize) * gridSize;
        }

        // EDGE CASE FIX: Zoom-aware contraintes de position
        const scaledWidth = (width - 100) / zoomFactor;
        const scaledHeight = (height - 30) / zoomFactor;
        finalX = Math.max(0, Math.min(finalX, scaledWidth));
        finalY = Math.max(0, Math.min(finalY, scaledHeight));

        if (data.copy && data.originalId) {
          // Copie d'un contrôle existant
          const originalControl = controls.find(c => c.id === data.originalId);
          addLog(
            'debug',
            'CanvasDrop',
            `Copying existing control #${data.originalId}`,
            originalControl
          );

          if (originalControl) {
            createControl(originalControl.type, finalX, finalY);
          }
        } else {
          createControl(data.controlType, finalX, finalY);
        }

        setRippleTriggered(true);
        playDropSound();
        vibrate([50, 20, 50]);
      } else if (data.type === 'existing-control') {
        // Déplacer un contrôle existant
        // PERFORMANCE FIX: Single lookup instead of double find()
        const existingControl = controls.find(c => c.id === data.controlId);
        addLog('info', 'CanvasDrop', `Moving existing control #${data.controlId}`, {
          from: {
            x: existingControl?.x,
            y: existingControl?.y,
          },
          to: position,
        });

        let finalX = position.x / zoomFactor;
        let finalY = position.y / zoomFactor;

        if (snapToGrid) {
          finalX = Math.round(finalX / gridSize) * gridSize;
          finalY = Math.round(finalY / gridSize) * gridSize;
        }

        // EDGE CASE FIX: Zoom-aware bounds for existing control movement
        const scaledWidth = (width - 50) / zoomFactor;
        const scaledHeight = (height - 50) / zoomFactor;
        finalX = Math.max(0, Math.min(finalX, scaledWidth));
        finalY = Math.max(0, Math.min(finalY, scaledHeight));

        // Ensure controlId exists
        if (data.controlId !== undefined) {
          updateControl(data.controlId, 'x', finalX);
          updateControl(data.controlId, 'y', finalY);
        } else {
          addLog('error', 'CanvasDrop', `Cannot update control: missing controlId`, { data });
        }

        playDropSound();
        vibrate(30);
      } else {
        addLog('warn', 'CanvasDrop', `Unhandled drop data type: ${data?.type}`, data);
      }
    },
    [
      snapToGrid,
      gridSize,
      width,
      height,
      controls,
      createControl,
      updateControl,
      playDropSound,
      vibrate,
      addLog,
      zoomFactor,
    ]
  );

  // Gestion de la sélection multiple
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (executionMode === 'run' || isToolboxDragging) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoomFactor;
      const y = (e.clientY - rect.top) / zoomFactor;

      // Commencer la sélection
      setSelectionBox({
        start: { x, y },
        end: { x, y },
        active: true,
      });

      // Désélectionner tous les contrôles
      if (!e.ctrlKey && !e.metaKey) {
        selectControls([]);
      }
    },
    [executionMode, isToolboxDragging, selectControls, zoomFactor]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!selectionBox.active) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoomFactor;
      const y = (e.clientY - rect.top) / zoomFactor;

      setSelectionBox(prev => ({
        ...prev,
        end: { x, y },
      }));

      // Calculer les contrôles dans la boîte de sélection
      const selectionRect = {
        left: Math.min(selectionBox.start.x, x),
        top: Math.min(selectionBox.start.y, y),
        right: Math.max(selectionBox.start.x, x),
        bottom: Math.max(selectionBox.start.y, y),
      };

      const selectedIds = controls
        .filter(
          control =>
            control.x >= selectionRect.left &&
            control.y >= selectionRect.top &&
            control.x + control.width <= selectionRect.right &&
            control.y + control.height <= selectionRect.bottom
        )
        .map(control => control.id);

      selectControls(selectedIds);
    },
    [selectionBox, controls, selectControls, zoomFactor]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setSelectionBox(prev => ({ ...prev, active: false }));
  }, []);

  // Calculer les guides d'alignement
  useEffect(() => {
    if (isToolboxDragging && selectedControls.length > 0) {
      const guides: Array<{ x?: number; y?: number }> = [];

      controls.forEach(control => {
        if (!selectedControls.some(sc => sc.id === control.id)) {
          // Guides verticaux
          guides.push({ x: control.x });
          guides.push({ x: control.x + control.width });
          guides.push({ x: control.x + control.width / 2 });

          // Guides horizontaux
          guides.push({ y: control.y });
          guides.push({ y: control.y + control.height });
          guides.push({ y: control.y + control.height / 2 });
        }
      });

      setSnapGuides(guides);
    } else {
      setSnapGuides([]);
    }
  }, [isToolboxDragging, selectedControls, controls]);

  const dropConstraints = React.useMemo(
    () => ({
      snapToGrid,
      gridSize,
      allowedAreas: [
        {
          x: 0,
          y: 0,
          width: (width || 800) * zoomFactor,
          height: (height || 600) * zoomFactor,
        },
      ],
    }),
    [snapToGrid, gridSize, width, height, zoomFactor]
  );

  const acceptedTypes = React.useMemo(() => ['new-control', 'existing-control'], []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <DroppableZone
        id="form-canvas"
        accepts={acceptedTypes}
        onDrop={handleControlDrop}
        constraints={dropConstraints}
        showGrid={showGrid}
        className="w-full h-full relative"
        style={{
          width: width * zoomFactor,
          height: height * zoomFactor,
          backgroundColor,
          border: '1px solid #000',
          cursor: getCursor,
        }}
      >
        <div
          ref={canvasRef}
          className="w-full h-full relative"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{ width, height, transform: `scale(${zoomFactor})`, transformOrigin: 'top left' }}
        >
          {/* Grille */}
          {showGrid && <Grid />}

          {/* Guides d'alignement unifiés */}
          {/* Guides rouges pour le drag depuis la toolbox */}
          {isToolboxDragging &&
            snapGuides.map((guide, index) => (
              <div
                key={`toolbox-guide-${index}`}
                className="absolute pointer-events-none z-50"
                style={{
                  ...(guide.x !== undefined && {
                    left: guide.x,
                    top: 0,
                    width: 2,
                    height: '100%',
                    backgroundColor: '#ff4444',
                    opacity: 0.8,
                    zIndex: 1000,
                  }),
                  ...(guide.y !== undefined && {
                    left: 0,
                    top: guide.y,
                    width: '100%',
                    height: 2,
                    backgroundColor: '#ff4444',
                    opacity: 0.8,
                    zIndex: 1000,
                  }),
                }}
              >
                {guide.controlId && (
                  <div className="absolute text-xs bg-red-600 text-white px-1 rounded">
                    {guide.x !== undefined ? 'x' : 'y'}: {guide.x ?? guide.y}
                  </div>
                )}
              </div>
            ))}

          {/* Guides verts pour la manipulation de contrôles existants */}
          {(dragState.isDragging || dragState.isResizing) && (
            <>
              {alignmentGuides.x.map((x, index) => (
                <div
                  key={`control-guide-x-${index}`}
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: x,
                    top: 0,
                    width: 2,
                    height: '100%',
                    backgroundColor: '#00dd00',
                    opacity: 0.9,
                    zIndex: 1001,
                    boxShadow: '0 0 2px rgba(0,221,0,0.5)',
                  }}
                />
              ))}
              {alignmentGuides.y.map((y, index) => (
                <div
                  key={`control-guide-y-${index}`}
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: 0,
                    top: y,
                    width: '100%',
                    height: 2,
                    backgroundColor: '#00dd00',
                    opacity: 0.9,
                    zIndex: 1001,
                    boxShadow: '0 0 2px rgba(0,221,0,0.5)',
                  }}
                />
              ))}
            </>
          )}

          {/* Contrôles */}
          {controls.map(control => (
            <PulseHighlight
              key={control.id}
              isActive={selectedControls.some(sc => sc.id === control.id)}
            >
              <AnimatedDrop isVisible={control.visible} delay={control.id * 50}>
                <ControlRenderer
                  control={control}
                  onStartDrag={startDrag}
                  onStartResize={startResize}
                  dragState={dragState}
                />
              </AnimatedDrop>
            </PulseHighlight>
          ))}

          {/* Boîte de sélection */}
          {selectionBox.active && (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-none"
              style={{
                left: Math.min(selectionBox.start.x, selectionBox.end.x),
                top: Math.min(selectionBox.start.y, selectionBox.end.y),
                width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                height: Math.abs(selectionBox.end.y - selectionBox.start.y),
                zIndex: 1001,
              }}
            />
          )}

          {/* Debug overlay */}
          {isToolboxDragging && dragData && (
            <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-xs p-2 rounded border border-gray-400 z-50 pointer-events-none">
              <div>
                <strong>Dragging:</strong> {dragData.controlType || dragData.type}
              </div>
              <div>
                <strong>Grid:</strong> {gridSize}px{snapToGrid ? ' (snap on)' : ' (snap off)'}
              </div>
              <div>
                <strong>Guides:</strong> {snapGuides.length}
              </div>
            </div>
          )}

          {/* Debug overlay pour le système de manipulation */}
          {(dragState.isDragging || dragState.isResizing) && (
            <div className="absolute top-2 left-2 bg-green-100 bg-opacity-90 text-xs p-2 rounded border border-green-400 z-50 pointer-events-none">
              <div>
                <strong>Mode:</strong> {dragState.isResizing ? 'Resizing' : 'Dragging'}
              </div>
              {dragState.isResizing && (
                <div>
                  <strong>Handle:</strong> {dragState.currentHandle}
                </div>
              )}
              <div>
                <strong>Guides:</strong> X:{alignmentGuides.x.length} Y:{alignmentGuides.y.length}
              </div>
            </div>
          )}

          {/* Effet de ripple pour les drops */}
          <RippleEffect
            isTriggered={rippleTriggered}
            onComplete={() => setRippleTriggered(false)}
          />
        </div>
      </DroppableZone>
    </div>
  );
};

export const AdvancedDragDropCanvas: React.FC<AdvancedDragDropCanvasProps> = props => {
  return <CanvasContent {...props} />;
};
