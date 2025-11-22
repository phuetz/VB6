import React, { useEffect, useRef } from 'react';
import { Control } from '../../context/types';
import { useControlManipulation } from '../../hooks/useControlManipulation';

interface ControlManipulatorProps {
  control: Control;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: (control: Control, addToSelection: boolean) => void;
  onUpdateControl: (control: Control) => void;
  onUpdateControls: (controls: Control[]) => void;
  allControls: Control[];
  selectedControls: Control[];
  executionMode: 'design' | 'run';
  snapToGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  children: React.ReactNode;
}

export const ControlManipulator: React.FC<ControlManipulatorProps> = ({
  control,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdateControl,
  onUpdateControls,
  allControls,
  selectedControls,
  executionMode,
  snapToGrid,
  gridSize,
  showAlignmentGuides,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    dragState,
    alignmentGuides,
    startDrag,
    startResize,
    handleMouseMove,
    handleMouseUp,
    handleKeyboardMove,
    handleKeyboardResize,
  } = useControlManipulation(allControls, selectedControls, onUpdateControls, {
    snapToGrid,
    gridSize,
    showAlignmentGuides,
    enableKeyboardMovement: true,
    multiSelectEnabled: true,
  });

  // Gestionnaires d'événements globaux
  useEffect(() => {
    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // MEMORY LEAK FIX: Combined keyboard handler to prevent duplicate listeners
  useEffect(() => {
    if (isSelected && executionMode === 'design') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Check if it's a move or resize operation
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          if (e.ctrlKey) {
            handleKeyboardResize(e);
          } else {
            handleKeyboardMove(e);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isSelected, executionMode, handleKeyboardMove, handleKeyboardResize]);

  const handleControlClick = (e: React.MouseEvent) => {
    if (executionMode === 'design') {
      e.stopPropagation();
      onSelect(control, e.ctrlKey || e.metaKey);
    }
  };

  const handleControlMouseDown = (e: React.MouseEvent) => {
    if (executionMode === 'design' && isSelected) {
      startDrag(e, control);
    }
  };

  const renderResizeHandles = () => {
    if (executionMode === 'run' || !isSelected) return null;

    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: 6,
      height: 6,
      backgroundColor: '#0066cc',
      border: '1px solid #fff',
      zIndex: 10000,
      cursor: 'pointer',
    };

    const handles = [
      { position: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
      { position: 'n', style: { top: -4, left: '50%', marginLeft: -3, cursor: 'n-resize' } },
      { position: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
      { position: 'e', style: { top: '50%', right: -4, marginTop: -3, cursor: 'e-resize' } },
      { position: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
      { position: 's', style: { bottom: -4, left: '50%', marginLeft: -3, cursor: 's-resize' } },
      { position: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
      { position: 'w', style: { top: '50%', left: -4, marginTop: -3, cursor: 'w-resize' } },
    ];

    return (
      <>
        {handles.map(handle => (
          <div
            key={handle.position}
            style={{ ...handleStyle, ...handle.style }}
            onMouseDown={e => startResize(e, control, handle.position)}
          />
        ))}
      </>
    );
  };

  const renderAlignmentGuides = () => {
    if (!showAlignmentGuides || executionMode === 'run') return null;

    return (
      <>
        {alignmentGuides.x.map((x, index) => (
          <div
            key={`guide-x-${index}`}
            style={{
              position: 'fixed',
              left: x,
              top: 0,
              width: 1,
              height: '100vh',
              backgroundColor: '#ff0000',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
        ))}
        {alignmentGuides.y.map((y, index) => (
          <div
            key={`guide-y-${index}`}
            style={{
              position: 'fixed',
              left: 0,
              top: y,
              width: '100vw',
              height: 1,
              backgroundColor: '#ff0000',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
        ))}
      </>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: control.x,
          top: control.y,
          width: control.width,
          height: control.height,
          cursor:
            executionMode === 'design' ? (dragState.isDragging ? 'move' : 'pointer') : 'default',
          border: isSelected && executionMode === 'design' ? '1px dashed #0066cc' : 'none',
          zIndex: isSelected ? 1000 : control.tabIndex || 1,
        }}
        onClick={handleControlClick}
        onMouseDown={handleControlMouseDown}
      >
        {children}
        {renderResizeHandles()}
      </div>
      {renderAlignmentGuides()}
    </>
  );
};
