import React, { useCallback, useRef, useState } from 'react';
import { Control } from '../../context/types';

interface SelectionManagerProps {
  controls: Control[];
  selectedControls: Control[];
  onSelectionChange: (controls: Control[]) => void;
  executionMode: 'design' | 'run';
  containerRef: React.RefObject<HTMLDivElement>;
}

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export const SelectionManager: React.FC<SelectionManagerProps> = ({
  controls,
  selectedControls,
  onSelectionChange,
  executionMode,
  containerRef,
}) => {
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (executionMode === 'run' || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsSelecting(true);
      selectionStartRef.current = { x, y };
      setSelectionBox({ x, y, width: 0, height: 0, visible: true });
    },
    [executionMode, containerRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting || !selectionStartRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const newBox = {
        x: Math.min(selectionStartRef.current.x, currentX),
        y: Math.min(selectionStartRef.current.y, currentY),
        width: Math.abs(currentX - selectionStartRef.current.x),
        height: Math.abs(currentY - selectionStartRef.current.y),
        visible: true,
      };

      setSelectionBox(newBox);

      // Sélectionner les contrôles dans la boîte
      const selectedInBox = controls.filter(control => {
        const controlRight = control.x + control.width;
        const controlBottom = control.y + control.height;
        const boxRight = newBox.x + newBox.width;
        const boxBottom = newBox.y + newBox.height;

        return !(
          controlRight < newBox.x ||
          control.x > boxRight ||
          controlBottom < newBox.y ||
          control.y > boxBottom
        );
      });

      onSelectionChange(selectedInBox);
    },
    [isSelecting, containerRef, controls, onSelectionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionBox(prev => ({ ...prev, visible: false }));
    selectionStartRef.current = null;
  }, []);

  // Gestionnaires d'événements globaux
  React.useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  const renderSelectionBox = () => {
    if (!selectionBox.visible) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: selectionBox.x,
          top: selectionBox.y,
          width: selectionBox.width,
          height: selectionBox.height,
          border: '1px dashed #0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />
    );
  };

  const renderSelectionInfo = () => {
    if (selectedControls.length === 0) return null;

    const bounds = selectedControls.reduce(
      (acc, control) => {
        return {
          left: Math.min(acc.left, control.x),
          top: Math.min(acc.top, control.y),
          right: Math.max(acc.right, control.x + control.width),
          bottom: Math.max(acc.bottom, control.y + control.height),
        };
      },
      {
        left: Infinity,
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity,
      }
    );

    return (
      <div
        style={{
          position: 'absolute',
          left: bounds.left,
          top: bounds.top - 25,
          backgroundColor: '#333',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          zIndex: 10001,
          pointerEvents: 'none',
        }}
      >
        {selectedControls.length} control{selectedControls.length > 1 ? 's' : ''} selected
        {selectedControls.length === 1 && (
          <span>
            {' '}
            | {selectedControls[0].name} ({selectedControls[0].x}, {selectedControls[0].y})
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: executionMode === 'design' ? 'auto' : 'none',
        cursor: executionMode === 'design' ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
    >
      {renderSelectionBox()}
      {renderSelectionInfo()}
    </div>
  );
};
