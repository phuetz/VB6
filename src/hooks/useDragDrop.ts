import { useCallback, useRef, useState } from 'react';

// Generic type for drag/drop items
type DragDropItem = Record<string, unknown>;

interface DragDropOptions<TItem extends DragDropItem = DragDropItem, TTarget extends DragDropItem = DragDropItem> {
  onDragStart?: (e: DragEvent, item: TItem) => void;
  onDragEnd?: (e: DragEvent, item: TItem) => void;
  onDrop?: (e: DragEvent, item: TItem, target: TTarget) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragEnter?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  acceptedTypes?: string[];
  transferData?: Record<string, unknown>;
}

export const useDragDrop = <TItem extends DragDropItem = DragDropItem, TTarget extends DragDropItem = DragDropItem>(
  options: DragDropOptions<TItem, TTarget> = {}
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TItem | null>(null);
  const [dropTarget, setDropTarget] = useState<TTarget | null>(null);
  const dragRef = useRef<HTMLElement>(null);
  const dropRef = useRef<HTMLElement>(null);

  const handleDragStart = useCallback(
    (e: DragEvent, item: TItem) => {
      setIsDragging(true);
      setDraggedItem(item);

      if (options.transferData) {
        Object.entries(options.transferData).forEach(([key, value]) => {
          e.dataTransfer?.setData(key, JSON.stringify(value));
        });
      }

      e.dataTransfer?.setData('text/plain', JSON.stringify(item));
      e.dataTransfer!.effectAllowed = 'move';

      options.onDragStart?.(e, item);
    },
    [options]
  );

  const handleDragEnd = useCallback(
    (e: DragEvent) => {
      setIsDragging(false);
      setDraggedItem(null);
      setDropTarget(null);

      options.onDragEnd?.(e, draggedItem);
    },
    [options, draggedItem]
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';

      options.onDragOver?.(e);
    },
    [options]
  );

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();

      options.onDragEnter?.(e);
    },
    [options]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      options.onDragLeave?.(e);
    },
    [options]
  );

  const handleDrop = useCallback(
    (e: DragEvent, target: TTarget) => {
      e.preventDefault();

      let droppedItem: TItem | null;

      try {
        const textData = e.dataTransfer?.getData('text/plain');
        droppedItem = textData ? JSON.parse(textData) : null;
      } catch (error) {
        console.error('Error parsing dropped data:', error);
        droppedItem = null;
      }

      if (droppedItem) {
        options.onDrop?.(e, droppedItem, target);
      }

      setIsDragging(false);
      setDraggedItem(null);
      setDropTarget(null);
    },
    [options]
  );

  const makeDraggable = useCallback(
    (element: HTMLElement, item: TItem) => {
      element.draggable = true;

      const startHandler = (e: DragEvent) => handleDragStart(e, item);
      const endHandler = (e: DragEvent) => handleDragEnd(e);

      element.addEventListener('dragstart', startHandler);
      element.addEventListener('dragend', endHandler);

      return () => {
        element.removeEventListener('dragstart', startHandler);
        element.removeEventListener('dragend', endHandler);
      };
    },
    [handleDragStart, handleDragEnd]
  );

  const makeDroppable = useCallback(
    (element: HTMLElement, target: TTarget) => {
      const overHandler = (e: DragEvent) => handleDragOver(e);
      const enterHandler = (e: DragEvent) => handleDragEnter(e);
      const leaveHandler = (e: DragEvent) => handleDragLeave(e);
      const dropHandler = (e: DragEvent) => handleDrop(e, target);

      element.addEventListener('dragover', overHandler);
      element.addEventListener('dragenter', enterHandler);
      element.addEventListener('dragleave', leaveHandler);
      element.addEventListener('drop', dropHandler);

      return () => {
        element.removeEventListener('dragover', overHandler);
        element.removeEventListener('dragenter', enterHandler);
        element.removeEventListener('dragleave', leaveHandler);
        element.removeEventListener('drop', dropHandler);
      };
    },
    [handleDragOver, handleDragEnter, handleDragLeave, handleDrop]
  );

  return {
    isDragging,
    draggedItem,
    dropTarget,
    dragRef,
    dropRef,
    makeDraggable,
    makeDroppable,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
};

// Hook spécialisé pour les contrôles VB6
export const useVB6ControlDragDrop = (
  onCreateControl: (type: string, x: number, y: number) => void
) => {
  const [dragPreview, setDragPreview] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: string;
  }>({ visible: false, x: 0, y: 0, type: '' });

  const handleControlDragStart = useCallback((e: DragEvent, controlType: string) => {
    e.dataTransfer?.setData('application/vb6-control', controlType);
    e.dataTransfer?.setData('text/plain', controlType);
    e.dataTransfer!.effectAllowed = 'copy';

    setDragPreview({ visible: true, x: 0, y: 0, type: controlType });
  }, []);

  const handleCanvasDragOver = useCallback((e: DragEvent, canvas: HTMLElement) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragPreview(prev => ({ ...prev, x, y }));
  }, []);

  const handleCanvasDrop = useCallback(
    (e: DragEvent, canvas: HTMLElement) => {
      e.preventDefault();

      const controlType =
        e.dataTransfer?.getData('application/vb6-control') || e.dataTransfer?.getData('text/plain');

      if (controlType) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        onCreateControl(controlType, x, y);
      }

      setDragPreview({ visible: false, x: 0, y: 0, type: '' });
    },
    [onCreateControl]
  );

  const handleDragEnd = useCallback(() => {
    setDragPreview({ visible: false, x: 0, y: 0, type: '' });
  }, []);

  return {
    dragPreview,
    handleControlDragStart,
    handleCanvasDragOver,
    handleCanvasDrop,
    handleDragEnd,
  };
};

// Hook pour le redimensionnement des contrôles
export const useControlResize = (
  onResize: (id: string, newBounds: { x: number; y: number; width: number; height: number }) => void
) => {
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    controlId: string | null;
    handle: string | null;
    startBounds: { x: number; y: number; width: number; height: number } | null;
    startMouse: { x: number; y: number } | null;
  }>({
    isResizing: false,
    controlId: null,
    handle: null,
    startBounds: null,
    startMouse: null,
  });

  const startResize = useCallback(
    (
      controlId: string,
      handle: string,
      currentBounds: { x: number; y: number; width: number; height: number },
      mouseEvent: MouseEvent
    ) => {
      setResizeState({
        isResizing: true,
        controlId,
        handle,
        startBounds: currentBounds,
        startMouse: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeState.isResizing || !resizeState.startBounds || !resizeState.startMouse) return;

      const deltaX = e.clientX - resizeState.startMouse.x;
      const deltaY = e.clientY - resizeState.startMouse.y;

      const newBounds = { ...resizeState.startBounds };

      switch (resizeState.handle) {
        case 'nw':
          newBounds.x += deltaX;
          newBounds.y += deltaY;
          newBounds.width -= deltaX;
          newBounds.height -= deltaY;
          break;
        case 'n':
          newBounds.y += deltaY;
          newBounds.height -= deltaY;
          break;
        case 'ne':
          newBounds.y += deltaY;
          newBounds.width += deltaX;
          newBounds.height -= deltaY;
          break;
        case 'e':
          newBounds.width += deltaX;
          break;
        case 'se':
          newBounds.width += deltaX;
          newBounds.height += deltaY;
          break;
        case 's':
          newBounds.height += deltaY;
          break;
        case 'sw':
          newBounds.x += deltaX;
          newBounds.width -= deltaX;
          newBounds.height += deltaY;
          break;
        case 'w':
          newBounds.x += deltaX;
          newBounds.width -= deltaX;
          break;
      }

      // Ensure minimum size
      newBounds.width = Math.max(20, newBounds.width);
      newBounds.height = Math.max(20, newBounds.height);

      onResize(resizeState.controlId!, newBounds);
    },
    [resizeState, onResize]
  );

  const stopResize = useCallback(() => {
    setResizeState({
      isResizing: false,
      controlId: null,
      handle: null,
      startBounds: null,
      startMouse: null,
    });
  }, []);

  return {
    resizeState,
    startResize,
    handleMouseMove,
    stopResize,
  };
};
