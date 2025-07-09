import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableItemProps {
  id: string;
  data: any;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const DraggableItem = forwardRef<HTMLDivElement, DraggableItemProps>(
  ({ id, data, disabled = false, children, className = '', style = {}, onDragStart, onDragEnd }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
      isOver,
    } = useDraggable({
      id,
      data,
      disabled,
    });

    const dragStyle = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 'auto',
      cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
      transition: isDragging ? 'none' : 'all 200ms ease',
      ...style,
    };

    React.useEffect(() => {
      if (isDragging && onDragStart) {
        onDragStart();
      } else if (!isDragging && onDragEnd) {
        onDragEnd();
      }
    }, [isDragging, onDragStart, onDragEnd]);

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        style={dragStyle}
        className={`${className} ${isDragging ? 'dragging' : ''} ${disabled ? 'opacity-50' : ''}`}
        {...listeners}
        {...attributes}
        data-dragging={isDragging}
        data-draggable-id={id}
      >
        {children}
        
        {/* Indicateur de drag */}
        {isDragging && (
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">
            DRAG
          </div>
        )}
      </div>
    );
  }
);

DraggableItem.displayName = 'DraggableItem';