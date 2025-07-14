import React, { useCallback, useRef, useState, useEffect } from 'react';
import { DragDropProvider, useDragDrop } from './DragDropProvider';
import { DroppableZone } from './DroppableZone';
import { AnimatedDrop, MagneticSnap, PulseHighlight, RippleEffect } from './AnimatedTransitions';
import { useVB6Store } from '../../stores/vb6Store';
import ControlRenderer from '../Designer/ControlRenderer';
import Grid from '../Designer/Grid';

// Add more descriptive logging to help debug issues
interface AdvancedDragDropCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

const CanvasContent: React.FC<AdvancedDragDropCanvasProps> = ({
  width = 800,
  height = 600,
  backgroundColor = '#8080FF'
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [rippleTriggered, setRippleTriggered] = useState(false);
  const [snapGuides, setSnapGuides] = useState<Array<{ x?: number; y?: number; controlId?: number }>>([]);
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    active: boolean;
  }>({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, active: false });

  const {
    controls,
    selectedControls,
    executionMode,
    snapToGrid,
    gridSize,
    createControl,
    updateControl,
    selectControls,
    showGrid,
    designerZoom,
  } = useVB6Store(state => ({
    controls: state.controls,
    selectedControls: state.selectedControls,
    executionMode: state.executionMode,
    snapToGrid: state.snapToGrid,
    gridSize: state.gridSize,
    createControl: state.createControl,
    updateControl: state.updateControl,
    selectControls: state.selectControls,
    showGrid: state.showGrid,
    designerZoom: state.designerZoom,
  }));
  const { addLog } = useVB6Store.getState();

  const { isDragging, vibrate, playDropSound } = useDragDrop();

  const zoomFactor = designerZoom / 100;

  // Gestion du drop de nouveaux contrôles
  const handleControlDrop = useCallback((data: any, position: { x: number; y: number }) => {
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

      // Contraintes de position
      finalX = Math.max(0, Math.min(finalX, width - 100));
      finalY = Math.max(0, Math.min(finalY, height - 30));

      if (data.copy && data.originalId) {
        // Copie d'un contrôle existant
        const originalControl = controls.find(c => c.id === data.originalId);
        addLog('debug', 'CanvasDrop', `Copying existing control #${data.originalId}`, originalControl);
        
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
      addLog('info', 'CanvasDrop', `Moving existing control #${data.controlId}`, { 
        from: { 
          x: controls.find(c => c.id === data.controlId)?.x, 
          y: controls.find(c => c.id === data.controlId)?.y 
        }, 
        to: position 
      });
      
      let finalX = position.x / zoomFactor;
      let finalY = position.y / zoomFactor;

      if (snapToGrid) {
        finalX = Math.round(finalX / gridSize) * gridSize;
        finalY = Math.round(finalY / gridSize) * gridSize;
      }

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
  }, [snapToGrid, gridSize, width, height, controls, createControl, updateControl, playDropSound, vibrate, addLog]);

  // Gestion de la sélection multiple
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (executionMode === 'run' || isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoomFactor;
    const y = (e.clientY - rect.top) / zoomFactor;

    // Commencer la sélection
    setSelectionBox({
      start: { x, y },
      end: { x, y },
      active: true
    });

    // Désélectionner tous les contrôles
    if (!e.ctrlKey && !e.metaKey) {
      selectControls([]);
    }
  }, [executionMode, isDragging, selectControls]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectionBox.active) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoomFactor;
    const y = (e.clientY - rect.top) / zoomFactor;

    setSelectionBox(prev => ({
      ...prev,
      end: { x, y }
    }));

    // Calculer les contrôles dans la boîte de sélection
    const selectionRect = {
      left: Math.min(selectionBox.start.x, x),
      top: Math.min(selectionBox.start.y, y),
      right: Math.max(selectionBox.start.x, x),
      bottom: Math.max(selectionBox.start.y, y)
    };

    const selectedIds = controls
      .filter(control => 
        control.x >= selectionRect.left &&
        control.y >= selectionRect.top &&
        control.x + control.width <= selectionRect.right &&
        control.y + control.height <= selectionRect.bottom
      )
      .map(control => control.id);

    selectControls(selectedIds);
  }, [selectionBox, controls, selectControls]);

  const handleCanvasMouseUp = useCallback(() => {
    setSelectionBox(prev => ({ ...prev, active: false }));
  }, []);

  // Calculer les guides d'alignement
  useEffect(() => {
    if (isDragging && selectedControls.length > 0) {
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
  }, [isDragging, selectedControls, controls]);

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

  const acceptedTypes = React.useMemo(
    () => ['new-control', 'existing-control'],
    []
  );

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
          cursor: selectionBox.active ? 'crosshair' : 'default',
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
          
          {/* Guides d'alignement */}
          {snapGuides.map((guide, index) => (
            <div
              key={index}
              className="absolute pointer-events-none z-50"
              style={{
                ...(guide.x !== undefined && {
                  left: guide.x,
                  top: 0,
                  width: 1,
                  height: '100%',
                  backgroundColor: '#ff0000',
                  opacity: 0.7,
                  zIndex: 1000
                }),
                ...(guide.y !== undefined && {
                  left: 0,
                  top: guide.y,
                  width: '100%',
                  height: 1,
                  backgroundColor: '#ff0000',
                  opacity: 0.7,
                  zIndex: 1000
                })
              }}
            >
              {guide.controlId && (
                <div className="absolute text-xs bg-red-600 text-white px-1 rounded">
                  {guide.x !== undefined ? 'x' : 'y'}: {guide.x ?? guide.y}
                </div>
              )}
            </div>
          ))}
          
          {/* Contrôles */}
          {controls.map(control => (
            <PulseHighlight 
              key={control.id} 
              isActive={selectedControls.some(sc => sc.id === control.id)}
            >
              <AnimatedDrop isVisible={control.visible} delay={control.id * 50}>
                <ControlRenderer control={control} />
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
                zIndex: 1001
              }}
            />
          )}
          
          {/* Debug overlay */}
          {isDragging && (
            <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-xs p-2 rounded border border-gray-400 z-50 pointer-events-none">
              <div><strong>Dragging:</strong> {draggedControlType}</div>
              <div><strong>Position:</strong> x: {Math.round(dragPosition?.x || 0)}, y: {Math.round(dragPosition?.y || 0)}</div>
              <div><strong>Grid:</strong> {gridSize}px{snapToGrid ? ' (snap on)' : ' (snap off)'}</div>
              <div><strong>Guides:</strong> {snapGuides.length}</div>
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

export const AdvancedDragDropCanvas: React.FC<AdvancedDragDropCanvasProps> = (props) => {
  return (
    <DragDropProvider>
      <CanvasContent {...props} />
    </DragDropProvider>
  );
};