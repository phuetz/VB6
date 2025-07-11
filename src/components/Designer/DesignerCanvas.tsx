import React, { useRef, useCallback } from 'react';
import { Control } from '../../context/types';
import { useVB6 } from '../../context/VB6Context';
import { ControlManipulator } from './ControlManipulator';
import { PositionIndicator } from './PositionIndicator';
import { GridManager } from './GridManager';
import { SelectionManager } from './SelectionManager';
import { DesignToolbar } from './DesignToolbar';
import { PropertyPanel } from './PropertyPanel';
import { useControlManipulation } from '../../hooks/useControlManipulation';
import ControlRenderer from './ControlRenderer';

interface DesignerCanvasProps {
  width: number;
  height: number;
  backgroundColor: string;
  zoom: number;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  width,
  height,
  backgroundColor,
  zoom
}) => {
  const { state, dispatch, updateControl, copyControls, pasteControls } = useVB6();
  const scale = zoom / 100;
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const {
    alignmentGuides,
    alignControls,
    makeSameSize
  } = useControlManipulation(
    state.controls,
    state.selectedControls,
    (controls) => {
      controls.forEach(control => {
        updateControl(control.id, 'x', control.x);
        updateControl(control.id, 'y', control.y);
        updateControl(control.id, 'width', control.width);
        updateControl(control.id, 'height', control.height);
      });
    },
    {
      snapToGrid: true,
      gridSize: state.gridSize,
      showAlignmentGuides: state.showAlignmentGuides,
      enableKeyboardMovement: true,
      multiSelectEnabled: true
    }
  );

  const handleControlSelect = useCallback((control: Control, addToSelection: boolean) => {
    if (addToSelection) {
      const isSelected = state.selectedControls.find(c => c.id === control.id);
      if (isSelected) {
        dispatch({ 
          type: 'SELECT_CONTROLS', 
          payload: { controlIds: state.selectedControls.filter(c => c.id !== control.id).map(c => c.id) }
        });
      } else {
        dispatch({ 
          type: 'SELECT_CONTROLS', 
          payload: { controlIds: [...state.selectedControls.map(c => c.id), control.id] }
        });
      }
    } else {
      dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [control.id] } });
    }
  }, [state.selectedControls, dispatch]);

  const handleSelectionChange = useCallback((controls: Control[]) => {
    dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: controls.map(c => c.id) } });
  }, [dispatch]);

  const handleUpdateControls = useCallback((controls: Control[]) => {
    controls.forEach(control => {
      updateControl(control.id, 'x', control.x);
      updateControl(control.id, 'y', control.y);
      updateControl(control.id, 'width', control.width);
      updateControl(control.id, 'height', control.height);
    });
  }, [updateControl]);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
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
  }, [state.selectedControls, state.gridSize, updateControl]);

  const handleResize = useCallback((direction: 'width' | 'height', amount: number) => {
    const step = amount * state.gridSize;
    
    state.selectedControls.forEach(control => {
      if (direction === 'width') {
        updateControl(control.id, 'width', Math.max(20, control.width + step));
      } else {
        updateControl(control.id, 'height', Math.max(20, control.height + step));
      }
    });
  }, [state.selectedControls, state.gridSize, updateControl]);

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
        payload: { controlIds: state.selectedControls.map(c => c.id) }
      });
    }
  }, [state.selectedControls, dispatch]);

  const handlePropertyChange = useCallback((control: Control, property: string, value: any) => {
    updateControl(control.id, property, value);
  }, [updateControl]);

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
          onToggleGrid={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showGrid' } })}
          snapToGrid={true}
          onToggleSnap={() => {}}
          gridSize={state.gridSize}
          onGridSizeChange={(size) => dispatch({ type: 'SET_GRID_SIZE', payload: { size } })}
          zoom={state.zoom}
          onZoomChange={(z) => dispatch({ type: 'SET_ZOOM', payload: { zoom: z } })}
        />
      )}

      {/* Canvas Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 p-4 overflow-auto bg-gray-300">
          <div style={{ width: width * scale, height: height * scale }}>
            <div
              ref={canvasRef}
              className="relative shadow-lg mx-auto"
              style={{
                width,
                height,
                backgroundColor,
                border: '1px solid #000',
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            >
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
                isSelected={state.selectedControls.some(c => c.id === control.id)}
                isMultiSelected={state.selectedControls.length > 1}
                onSelect={handleControlSelect}
                onUpdateControl={(updatedControl) => handleUpdateControls([updatedControl])}
                onUpdateControls={handleUpdateControls}
                allControls={state.controls}
                selectedControls={state.selectedControls}
                executionMode={state.executionMode}
                snapToGrid={true}
                gridSize={state.gridSize}
                showAlignmentGuides={state.showAlignmentGuides}
              >
                <ControlRenderer control={control} />
              </ControlManipulator>
            ))}

            {/* Position Indicators */}
            {state.executionMode === 'design' && state.selectedControls.map(control => (
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
    </div>
  );
};