import React, { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDragDrop } from './DragDropProvider';

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
  const { registerDropZone, unregisterDropZone } = useDragDrop();

  const {
    isOver,
    setNodeRef,
    active,
  } = useDroppable({
    id,
    disabled,
  });

  const canDrop = active && accepts.includes(active.data.current?.type);
  const isValidDrop = isOver && canDrop;
  const isInvalidDrop = isOver && !canDrop;

  // Enregistrer la zone de dépôt
  useEffect(() => {
    if (elementRef.current && !disabled) {
      const zone = {
        id,
        element: elementRef.current,
        accepts,
        onDrop,
        highlight: isOver,
        constraints,
      };
      registerDropZone(zone);
    }

    return () => {
      if (!disabled) {
        unregisterDropZone(id);
      }
    };
  }, [id, accepts, onDrop, constraints, isOver, disabled, registerDropZone, unregisterDropZone]);

  const dropStyle = {
    transition: 'all 200ms ease',
    position: 'relative' as const,
    ...style,
  };

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
      {children}
      
      {/* Grille visible si activée */}
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