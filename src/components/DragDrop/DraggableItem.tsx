import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useVB6Store } from '../../stores/vb6Store';

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
  (
    { id, data, disabled = false, children, className = '', style = {}, onDragStart, onDragEnd },
    ref
  ) => {
    const addLog = useVB6Store(state => state.addLog);

    const { attributes, listeners, setNodeRef, transform, isDragging, isOver } = useDraggable(
      data?.type
        ? {
            id,
            data,
            disabled,
          }
        : { id, data, disabled }
    );

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
        addLog('info', 'DraggableItem', `Drag started for ${id}`, { data });
      } else if (!isDragging && onDragEnd) {
        onDragEnd();
        if (transform) {
          addLog('info', 'DraggableItem', `Drag ended for ${id}`, {
            transform: { x: transform.x, y: transform.y },
          });
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, onDragStart, onDragEnd, id, data, addLog]);

    return (
      <div
        ref={node => {
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
        {(isDragging || data?.type === 'new-control') && (
          <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1 py-0.5 rounded-tl">
            {data?.type || 'DRAG'} {id.substring(id.indexOf('-') + 1)}
          </div>
        )}
      </div>
    );
  }
);

DraggableItem.displayName = 'DraggableItem';
