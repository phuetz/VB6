import { useCallback, useRef, useState } from 'react';
import { Control } from '../context/types';

interface ControlManipulationOptions {
  snapToGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  enableKeyboardMovement: boolean;
  multiSelectEnabled: boolean;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  currentHandle: string | null;
  dragOffset: { x: number; y: number };
}

export const useControlManipulation = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  options: ControlManipulationOptions
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    currentHandle: null,
    dragOffset: { x: 0, y: 0 }
  });

  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fonction pour aligner sur la grille
  const snapToGrid = useCallback((value: number) => {
    if (!options.snapToGrid) return value;
    return Math.round(value / options.gridSize) * options.gridSize;
  }, [options.snapToGrid, options.gridSize]);

  // Calculer les guides d'alignement
  const calculateAlignmentGuides = useCallback((movingControls: Control[], dx: number, dy: number) => {
    if (!options.showAlignmentGuides) {
      setAlignmentGuides({ x: [], y: [] });
      return;
    }

    const guides = { x: [], y: [] };
    const threshold = 5;

    movingControls.forEach(movingControl => {
      const newX = movingControl.x + dx;
      const newY = movingControl.y + dy;
      const newRight = newX + movingControl.width;
      const newBottom = newY + movingControl.height;
      const newCenterX = newX + movingControl.width / 2;
      const newCenterY = newY + movingControl.height / 2;

      controls.forEach(control => {
        if (movingControls.find(c => c.id === control.id)) return;

        const controlRight = control.x + control.width;
        const controlBottom = control.y + control.height;
        const controlCenterX = control.x + control.width / 2;
        const controlCenterY = control.y + control.height / 2;

        // Guides verticaux (lignes X)
        if (Math.abs(newX - control.x) < threshold) guides.x.push(control.x);
        if (Math.abs(newX - controlRight) < threshold) guides.x.push(controlRight);
        if (Math.abs(newRight - control.x) < threshold) guides.x.push(control.x);
        if (Math.abs(newRight - controlRight) < threshold) guides.x.push(controlRight);
        if (Math.abs(newCenterX - controlCenterX) < threshold) guides.x.push(controlCenterX);

        // Guides horizontaux (lignes Y)
        if (Math.abs(newY - control.y) < threshold) guides.y.push(control.y);
        if (Math.abs(newY - controlBottom) < threshold) guides.y.push(controlBottom);
        if (Math.abs(newBottom - control.y) < threshold) guides.y.push(control.y);
        if (Math.abs(newBottom - controlBottom) < threshold) guides.y.push(controlBottom);
        if (Math.abs(newCenterY - controlCenterY) < threshold) guides.y.push(controlCenterY);
      });
    });

    setAlignmentGuides(guides);
  }, [controls, options.showAlignmentGuides]);

  // Démarrer le déplacement
  const startDrag = useCallback((e: React.MouseEvent, control: Control) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      isResizing: false,
      startPosition: { x: control.x, y: control.y },
      startSize: { width: control.width, height: control.height },
      currentHandle: null,
      dragOffset: { x: offsetX, y: offsetY }
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Démarrer le redimensionnement
  const startResize = useCallback((e: React.MouseEvent, control: Control, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      isDragging: false,
      isResizing: true,
      startPosition: { x: control.x, y: control.y },
      startSize: { width: control.width, height: control.height },
      currentHandle: handle,
      dragOffset: { x: 0, y: 0 }
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Gérer le déplacement de la souris
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (dragState.isDragging) {
      // Déplacement des contrôles
      calculateAlignmentGuides(selectedControls, dx, dy);

      const updatedControls = controls.map(control => {
        const isSelected = selectedControls.find(sc => sc.id === control.id);
        if (isSelected) {
          return {
            ...control,
            x: snapToGrid(dragState.startPosition.x + dx),
            y: snapToGrid(dragState.startPosition.y + dy)
          };
        }
        return control;
      });

      updateControls(updatedControls);
    } else if (dragState.isResizing && selectedControls.length === 1) {
      // Redimensionnement du contrôle
      const control = selectedControls[0];
      let newWidth = dragState.startSize.width;
      let newHeight = dragState.startSize.height;
      let newX = dragState.startPosition.x;
      let newY = dragState.startPosition.y;

      switch (dragState.currentHandle) {
        case 'nw':
          newWidth = snapToGrid(Math.max(20, dragState.startSize.width - dx));
          newHeight = snapToGrid(Math.max(20, dragState.startSize.height - dy));
          newX = snapToGrid(dragState.startPosition.x + dx);
          newY = snapToGrid(dragState.startPosition.y + dy);
          break;
        case 'n':
          newHeight = snapToGrid(Math.max(20, dragState.startSize.height - dy));
          newY = snapToGrid(dragState.startPosition.y + dy);
          break;
        case 'ne':
          newWidth = snapToGrid(Math.max(20, dragState.startSize.width + dx));
          newHeight = snapToGrid(Math.max(20, dragState.startSize.height - dy));
          newY = snapToGrid(dragState.startPosition.y + dy);
          break;
        case 'e':
          newWidth = snapToGrid(Math.max(20, dragState.startSize.width + dx));
          break;
        case 'se':
          newWidth = snapToGrid(Math.max(20, dragState.startSize.width + dx));
          newHeight = snapToGrid(Math.max(20, dragState.startSize.height + dy));
          break;
        case 's':
          newHeight = snapToGrid(Math.max(20, dragState.startSize.height + dy));
          break;
        case 'sw':
          newWidth = snapToGrid(Math.max(20, dragState.startSize.width - dx));
          newHeight = snapToGrid(Math.max(20, dragState.startSize.height + dy));
          newX = snapToGrid(dragState.startPosition.x + dx);
          break;
        case 'w':
          newWidth = snapToGrid(Math.max(20, dragState.startSize.width - dx));
          newX = snapToGrid(dragState.startPosition.x + dx);
          break;
      }

      const updatedControls = controls.map(c => 
        c.id === control.id 
          ? { ...c, x: newX, y: newY, width: newWidth, height: newHeight }
          : c
      );

      updateControls(updatedControls);
    }
  }, [dragState, selectedControls, controls, updateControls, snapToGrid, calculateAlignmentGuides]);

  // Terminer le déplacement/redimensionnement
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 },
      currentHandle: null,
      dragOffset: { x: 0, y: 0 }
    });
    setAlignmentGuides({ x: [], y: [] });
    dragStartRef.current = null;
  }, []);

  // Déplacement au clavier
  const handleKeyboardMove = useCallback((e: KeyboardEvent) => {
    if (!options.enableKeyboardMovement || selectedControls.length === 0) return;

    const step = e.shiftKey ? options.gridSize : 1;
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      case 'ArrowUp':
        dy = -step;
        break;
      case 'ArrowDown':
        dy = step;
        break;
      default:
        return;
    }

    e.preventDefault();

    const updatedControls = controls.map(control => {
      const isSelected = selectedControls.find(sc => sc.id === control.id);
      if (isSelected) {
        return {
          ...control,
          x: Math.max(0, snapToGrid(control.x + dx)),
          y: Math.max(0, snapToGrid(control.y + dy))
        };
      }
      return control;
    });

    updateControls(updatedControls);
  }, [selectedControls, controls, updateControls, snapToGrid, options.enableKeyboardMovement, options.gridSize]);

  // Redimensionnement au clavier
  const handleKeyboardResize = useCallback((e: KeyboardEvent) => {
    if (!options.enableKeyboardMovement || selectedControls.length !== 1) return;

    const step = e.shiftKey ? options.gridSize : 1;
    const control = selectedControls[0];

    let newWidth = control.width;
    let newHeight = control.height;

    if (e.ctrlKey) {
      switch (e.key) {
        case 'ArrowLeft':
          newWidth = Math.max(20, control.width - step);
          break;
        case 'ArrowRight':
          newWidth = control.width + step;
          break;
        case 'ArrowUp':
          newHeight = Math.max(20, control.height - step);
          break;
        case 'ArrowDown':
          newHeight = control.height + step;
          break;
        default:
          return;
      }

      e.preventDefault();

      const updatedControls = controls.map(c => 
        c.id === control.id 
          ? { ...c, width: snapToGrid(newWidth), height: snapToGrid(newHeight) }
          : c
      );

      updateControls(updatedControls);
    }
  }, [selectedControls, controls, updateControls, snapToGrid, options.enableKeyboardMovement, options.gridSize]);

  // Aligner les contrôles sélectionnés
  const alignControls = useCallback((type: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v' | 'distribute-h' | 'distribute-v') => {
    if (selectedControls.length < 2) return;

    let updatedControls = [...controls];

    switch (type) {
      case 'left': {
        const leftMost = Math.min(...selectedControls.map(c => c.x));
        updatedControls = controls.map(c => {
          const selected = selectedControls.find(sc => sc.id === c.id);
          return selected ? { ...c, x: leftMost } : c;
        });
        break;
      }
      case 'right': {
        const rightMost = Math.max(...selectedControls.map(c => c.x + c.width));
        updatedControls = controls.map(c => {
          const selected = selectedControls.find(sc => sc.id === c.id);
          return selected ? { ...c, x: rightMost - c.width } : c;
        });
        break;
      }
      case 'top': {
        const topMost = Math.min(...selectedControls.map(c => c.y));
        updatedControls = controls.map(c => {
          const selected = selectedControls.find(sc => sc.id === c.id);
          return selected ? { ...c, y: topMost } : c;
        });
        break;
      }
      case 'bottom': {
        const bottomMost = Math.max(...selectedControls.map(c => c.y + c.height));
        updatedControls = controls.map(c => {
          const selected = selectedControls.find(sc => sc.id === c.id);
          return selected ? { ...c, y: bottomMost - c.height } : c;
        });
        break;
      }
      case 'center-h': {
        const leftMost = Math.min(...selectedControls.map(c => c.x));
        const rightMost = Math.max(...selectedControls.map(c => c.x + c.width));
        const centerX = (leftMost + rightMost) / 2;
        updatedControls = controls.map(c => {
          const selected = selectedControls.find(sc => sc.id === c.id);
          return selected ? { ...c, x: centerX - c.width / 2 } : c;
        });
        break;
      }
      case 'center-v': {
        const topMost = Math.min(...selectedControls.map(c => c.y));
        const bottomMost = Math.max(...selectedControls.map(c => c.y + c.height));
        const centerY = (topMost + bottomMost) / 2;
        updatedControls = controls.map(c => {
          const selected = selectedControls.find(sc => sc.id === c.id);
          return selected ? { ...c, y: centerY - c.height / 2 } : c;
        });
        break;
      }
      case 'distribute-h': {
        const sorted = [...selectedControls].sort((a, b) => a.x - b.x);
        const leftMost = sorted[0].x;
        const rightMost = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
        const totalWidth = sorted.reduce((sum, c) => sum + c.width, 0);
        const spacing = (rightMost - leftMost - totalWidth) / (sorted.length - 1);
        
        let currentX = leftMost;
        sorted.forEach(control => {
          updatedControls = updatedControls.map(c => 
            c.id === control.id ? { ...c, x: currentX } : c
          );
          currentX += control.width + spacing;
        });
        break;
      }
      case 'distribute-v': {
        const sorted = [...selectedControls].sort((a, b) => a.y - b.y);
        const topMost = sorted[0].y;
        const bottomMost = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
        const totalHeight = sorted.reduce((sum, c) => sum + c.height, 0);
        const spacing = (bottomMost - topMost - totalHeight) / (sorted.length - 1);
        
        let currentY = topMost;
        sorted.forEach(control => {
          updatedControls = updatedControls.map(c => 
            c.id === control.id ? { ...c, y: currentY } : c
          );
          currentY += control.height + spacing;
        });
        break;
      }
    }

    updateControls(updatedControls);
  }, [selectedControls, controls, updateControls]);

  // Redimensionner pour avoir la même taille
  const makeSameSize = useCallback((type: 'width' | 'height' | 'both') => {
    if (selectedControls.length < 2) return;

    const reference = selectedControls[0];
    const updatedControls = controls.map(c => {
      const selected = selectedControls.find(sc => sc.id === c.id);
      if (selected && c.id !== reference.id) {
        switch (type) {
          case 'width':
            return { ...c, width: reference.width };
          case 'height':
            return { ...c, height: reference.height };
          case 'both':
            return { ...c, width: reference.width, height: reference.height };
          default:
            return c;
        }
      }
      return c;
    });

    updateControls(updatedControls);
  }, [selectedControls, controls, updateControls]);

  return {
    dragState,
    alignmentGuides,
    startDrag,
    startResize,
    handleMouseMove,
    handleMouseUp,
    handleKeyboardMove,
    handleKeyboardResize,
    alignControls,
    makeSameSize
  };
};