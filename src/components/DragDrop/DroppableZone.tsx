import React, { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDragDrop } from './DragDropProvider';
import { useVB6Store } from '../../stores/vb6Store';

interface DroppableZoneProps {
  id: string;
  accepts: string[];
  onDrop: (data: any, position: { x: number; y: number }) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  constraints?: {
    snapToGrid?: boolean;
    gridSize?: number;
    allowedAreas?: Array<{ x: number; y: number; width: number; height: number }>;
  };
  showGrid?: boolean;
  disabled?: boolean;
}

export const DroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  accepts,
  onDrop,
  children,
  className = '',
  style = {},
  constraints,
  showGrid = false,
  disabled = false,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { registerDropZone, unregisterDropZone, isDragging } = useDragDrop();
  const { addLog } = useVB6Store.getState();

  // Log initialization
  useEffect(() => {
    addLog('debug', 'DroppableZone', `${id} initialized with accepts: ${accepts.join(', ')}`);
  }, [id, accepts, addLog]);

  // useDroppable config
  const { 
    isOver,
    setNodeRef,
    active,
  } = useDroppable({ 
    id,
    disabled,
  });

  // Calculate drop validity after active is initialized
  const activeType = active?.data?.current?.type;
  const canDrop = active && activeType && accepts.includes(activeType);
  const isValidDrop = isOver && canDrop;
  const isInvalidDrop = isOver && !canDrop;

  // Log drop validity changes
  useEffect(() => {
    if (isOver) {
      addLog('debug', 'DroppableZone', `${id} is being hovered with ${activeType}`, { 
        canDrop, 
        accepts 
      });
    }
  }, [isOver, canDrop, id, activeType, addLog, accepts]);

  // Enregistrer la zone de dépôt (une seule fois ou lorsque ses propriétés changent)
  useEffect(() => {
    if (elementRef.current) {
      addLog('debug', 'DroppableZone', `${id} ref element available, registering`, {
        elementBounds: elementRef.current.getBoundingClientRect(),
      });

      if (!disabled) {
        registerDropZone({
          id,
          element: elementRef.current,
          accepts,
          onDrop,
          highlight: isOver,
          constraints,
        });
      }
    }

    return () => {
      if (!disabled) {
        unregisterDropZone(id);
        addLog('debug', 'DroppableZone', `${id} unregistered`);
      }
    };
    // intentionally omit isOver to avoid re-registration loops when drag state updates
  }, [id, accepts, onDrop, constraints, disabled, registerDropZone, unregisterDropZone, addLog]);

  const dropStyle: React.CSSProperties = {
    transition: 'all 200ms ease',
    position: 'relative' as const,
    ...style,
  };

  // Log state changes
  useEffect(() => {
    if (isOver) {
      addLog('debug', 'DroppableZone', `${id} drop zone is over`, { canDrop, isValidDrop });
    }
  }, [isOver, canDrop, isValidDrop, id, addLog]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (elementRef.current !== node) {
          elementRef.current = node;
        }
      }}
      style={dropStyle}
      className={`
        ${className}
        ${isValidDrop ? 'drop-zone-valid' : ''}
        ${isInvalidDrop ? 'drop-zone-invalid' : ''}
        ${disabled ? 'drop-zone-disabled' : ''}
      `}
      data-droppable-id={id}
      data-accepts={accepts.join(',')}
      data-is-over={isOver}
      data-can-drop={canDrop}
    >
      {isDragging && (
        <div className="absolute top-0 right-0 bg-blue-900 text-white text-xs px-2 py-1 m-1 rounded z-50 pointer-events-none">
          {id} {isOver ? 'isOver' : ''} {canDrop ? 'canDrop' : ''}
        </div>
      )}

      {children}
      
      {/* Grille visible si activée */}
      {showGrid && constraints?.snapToGrid && constraints.gridSize && (
        <div className="absolute bottom-0 left-0 bg-blue-900 text-white text-xs px-2 py-1 m-1 rounded z-50 pointer-events-none">
          Grid: {constraints.gridSize}px
        </div>
      )}
      {showGrid && constraints?.snapToGrid && constraints.gridSize && (
        <GridBackground gridSize={constraints.gridSize} />
      )}
      
      {/* Overlay d'état */}
      {isOver && (
        <div 
          className={`absolute inset-0 pointer-events-none rounded transition-all duration-200 ${
            canDrop 
              ? 'bg-green-200 bg-opacity-30 border-2 border-green-500 border-dashed' 
              : 'bg-red-200 bg-opacity-30 border-2 border-red-500 border-dashed'
          }`}
          style={{
            animation: canDrop ? 'dropZoneValid 1s ease-in-out infinite' : 'dropZoneInvalid 0.5s ease-in-out infinite',
          }}
        />
      )}
      
      {/* Message d'aide */}
      {isOver && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`text-xs px-2 py-1 rounded ${
            canDrop 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {canDrop ? '✓ Drop here' : '✗ Invalid drop'}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant de grille de fond
const GridBackground: React.FC<{ gridSize: number }> = ({ gridSize }) => {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
};