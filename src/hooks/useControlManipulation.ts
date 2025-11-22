import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
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
    dragOffset: { x: 0, y: 0 },
  });

  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  
  // RAF reference to prevent race conditions
  const updateRAFRef = useRef<number | null>(null);

  // Fonction pour aligner sur la grille
  const snapToGrid = useCallback(
    (value: number) => {
      if (!options.snapToGrid) return value;
      return Math.round(value / options.gridSize) * options.gridSize;
    },
    [options.snapToGrid, options.gridSize]
  );

  // PERFORMANCE OPTIMIZATION: Memoize static alignment guides calculation
  const staticAlignmentGuides = useMemo(() => {
    if (!options.showAlignmentGuides) return { x: [], y: [] };
    
    const guides = { x: [] as number[], y: [] as number[] };
    controls.forEach(control => {
      // Pre-calculate all possible alignment points for each control
      guides.x.push(control.x, control.x + control.width, control.x + control.width / 2);
      guides.y.push(control.y, control.y + control.height, control.y + control.height / 2);
    });
    
    // Remove duplicates and sort for faster lookup
    return {
      x: [...new Set(guides.x)].sort((a, b) => a - b),
      y: [...new Set(guides.y)].sort((a, b) => a - b)
    };
  }, [controls, options.showAlignmentGuides]);

  // Calculer les guides d'alignement optimisé
  const calculateAlignmentGuides = useCallback(
    (movingControls: Control[], dx: number, dy: number) => {
      if (!options.showAlignmentGuides) {
        setAlignmentGuides({ x: [], y: [] });
        return;
      }

      const guides = { x: [] as number[], y: [] as number[] };
      const threshold = 5;

      // OPTIMIZATION: Use pre-calculated static guides for faster lookup
      movingControls.forEach(movingControl => {
        const newX = movingControl.x + dx;
        const newY = movingControl.y + dy;
        const newRight = newX + movingControl.width;
        const newBottom = newY + movingControl.height;
        const newCenterX = newX + movingControl.width / 2;
        const newCenterY = newY + movingControl.height / 2;

        // Check alignment with pre-calculated guides
        staticAlignmentGuides.x.forEach(guideX => {
          if (Math.abs(newX - guideX) < threshold ||
              Math.abs(newRight - guideX) < threshold ||
              Math.abs(newCenterX - guideX) < threshold) {
            guides.x.push(guideX);
          }
        });

        staticAlignmentGuides.y.forEach(guideY => {
          if (Math.abs(newY - guideY) < threshold ||
              Math.abs(newBottom - guideY) < threshold ||
              Math.abs(newCenterY - guideY) < threshold) {
            guides.y.push(guideY);
          }
        });
      });

      // Remove duplicates
      setAlignmentGuides({
        x: [...new Set(guides.x)],
        y: [...new Set(guides.y)]
      });
    },
    [staticAlignmentGuides, options.showAlignmentGuides]
  );

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
      dragOffset: { x: offsetX, y: offsetY },
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Démarrer le redimensionnement
  const startResize = useCallback((e: React.MouseEvent, control: Control, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    resizeStartRef.current = {};
    selectedControls.forEach(c => {
      resizeStartRef.current[c.id] = { x: c.x, y: c.y, width: c.width, height: c.height };
    });

    setDragState({
      isDragging: false,
      isResizing: true,
      startPosition: { x: control.x, y: control.y },
      startSize: { width: control.width, height: control.height },
      currentHandle: handle,
      dragOffset: { x: 0, y: 0 },
    });

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // ULTRA-OPTIMIZED: RAF memory leak fix with proper cleanup
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      // Early exit if not dragging or resizing
      if (!dragState.isDragging && !dragState.isResizing) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Cancel any pending update
      if (updateRAFRef.current !== null) {
        cancelAnimationFrame(updateRAFRef.current);
        updateRAFRef.current = null;
      }

      // RUNTIME LOGIC BUG FIX: Use React.startTransition for atomic state updates
      updateRAFRef.current = requestAnimationFrame(() => {
        // Double-check state validity
        if (!dragState.isDragging && !dragState.isResizing) {
          updateRAFRef.current = null;
          return;
        }
        
        if (dragState.isDragging) {
          React.startTransition(() => {
            // Déplacement des contrôles
            calculateAlignmentGuides(selectedControls, dx, dy);

            // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
            const selectedIds = new Set(selectedControls.map(sc => sc.id));
            const updatedControls = controls.map(control => {
              if (selectedIds.has(control.id)) {
                return {
                  ...control,
                  x: snapToGrid(dragState.startPosition.x + dx),
                  y: snapToGrid(dragState.startPosition.y + dy),
                };
              }
              return control;
            });

            updateControls(updatedControls);
          });
        } else if (dragState.isResizing && selectedControls.length === 1) {
          React.startTransition(() => {
            const updatedControls = controls.map(c => {
              const start = resizeStartRef.current[c.id];
              if (!start) return c;

              let newWidth = start.width;
              let newHeight = start.height;
              let newX = start.x;
              let newY = start.y;

              switch (dragState.currentHandle) {
                case 'nw':
                  newWidth = snapToGrid(Math.max(20, start.width - dx));
                  newHeight = snapToGrid(Math.max(20, start.height - dy));
                  newX = snapToGrid(start.x + dx);
                  newY = snapToGrid(start.y + dy);
                  break;
                case 'n':
                  newHeight = snapToGrid(Math.max(20, start.height - dy));
                  newY = snapToGrid(start.y + dy);
                  break;
                case 'ne':
                  newWidth = snapToGrid(Math.max(20, start.width + dx));
                  newHeight = snapToGrid(Math.max(20, start.height - dy));
                  newY = snapToGrid(start.y + dy);
                  break;
                case 'e':
                  newWidth = snapToGrid(Math.max(20, start.width + dx));
                  break;
                case 'se':
                  newWidth = snapToGrid(Math.max(20, start.width + dx));
                  newHeight = snapToGrid(Math.max(20, start.height + dy));
                  break;
                case 's':
                  newHeight = snapToGrid(Math.max(20, start.height + dy));
                  break;
                case 'sw':
                  newWidth = snapToGrid(Math.max(20, start.width - dx));
                  newHeight = snapToGrid(Math.max(20, start.height + dy));
                  newX = snapToGrid(start.x + dx);
                  break;
                case 'w':
                  newWidth = snapToGrid(Math.max(20, start.width - dx));
                  newX = snapToGrid(start.x + dx);
                  break;
              }

              return { ...c, x: newX, y: newY, width: newWidth, height: newHeight };
            });
            updateControls(updatedControls);
          });
        }
      });
    },
    [dragState, selectedControls, controls, updateControls, snapToGrid, calculateAlignmentGuides]
  );

  // Terminer le déplacement/redimensionnement
  const handleMouseUp = useCallback(() => {
    // MEMORY LEAK FIX: Cancel pending animation frame to prevent stale callbacks
    if (updateRAFRef.current !== null) {
      cancelAnimationFrame(updateRAFRef.current);
      updateRAFRef.current = null;
    }
    
    setDragState({
      isDragging: false,
      isResizing: false,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 },
      currentHandle: null,
      dragOffset: { x: 0, y: 0 },
    });
    setAlignmentGuides({ x: [], y: [] });
    dragStartRef.current = null;
    // CRITICAL FIX: Clear resize references to prevent memory leak
    resizeStartRef.current = {};
  }, []);

  // Déplacement au clavier
  const handleKeyboardMove = useCallback(
    (e: KeyboardEvent) => {
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

      // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
      const selectedIds = new Set(selectedControls.map(sc => sc.id));
      const updatedControls = controls.map(control => {
        if (selectedIds.has(control.id)) {
          return {
            ...control,
            x: Math.max(0, snapToGrid(control.x + dx)),
            y: Math.max(0, snapToGrid(control.y + dy)),
          };
        }
        return control;
      });

      updateControls(updatedControls);
    },
    [
      selectedControls,
      controls,
      updateControls,
      snapToGrid,
      options.enableKeyboardMovement,
      options.gridSize,
    ]
  );

  // Redimensionnement au clavier
  const handleKeyboardResize = useCallback(
    (e: KeyboardEvent) => {
      if (!options.enableKeyboardMovement || selectedControls.length === 0) return;

      const step = e.shiftKey ? options.gridSize : 1;

      if (e.ctrlKey) {
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

        // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
        const selectedIds = new Set(selectedControls.map(sc => sc.id));
        const updatedControls = controls.map(c => {
          if (selectedIds.has(c.id)) {
            return {
              ...c,
              width: snapToGrid(Math.max(20, c.width + dx)),
              height: snapToGrid(Math.max(20, c.height + dy)),
            };
          }
          return c;
        });

        updateControls(updatedControls);
      }
    },
    [
      selectedControls,
      controls,
      updateControls,
      snapToGrid,
      options.enableKeyboardMovement,
      options.gridSize,
    ]
  );

  // Aligner les contrôles sélectionnés
  const alignControls = useCallback(
    (
      type:
        | 'left'
        | 'right'
        | 'top'
        | 'bottom'
        | 'center-h'
        | 'center-v'
        | 'distribute-h'
        | 'distribute-v'
    ) => {
      if (selectedControls.length < 2) return;

      let updatedControls = [...controls];

      switch (type) {
        case 'left': {
          const leftMost = Math.min(...selectedControls.map(c => c.x));
          // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, x: leftMost } : c;
          });
          break;
        }
        case 'right': {
          const rightMost = Math.max(...selectedControls.map(c => c.x + c.width));
          // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, x: rightMost - c.width } : c;
          });
          break;
        }
        case 'top': {
          const topMost = Math.min(...selectedControls.map(c => c.y));
          // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, y: topMost } : c;
          });
          break;
        }
        case 'bottom': {
          const bottomMost = Math.max(...selectedControls.map(c => c.y + c.height));
          // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, y: bottomMost - c.height } : c;
          });
          break;
        }
        case 'center-h': {
          const leftMost = Math.min(...selectedControls.map(c => c.x));
          const rightMost = Math.max(...selectedControls.map(c => c.x + c.width));
          const centerX = (leftMost + rightMost) / 2;
          // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, x: centerX - c.width / 2 } : c;
          });
          break;
        }
        case 'center-v': {
          const topMost = Math.min(...selectedControls.map(c => c.y));
          const bottomMost = Math.max(...selectedControls.map(c => c.y + c.height));
          const centerY = (topMost + bottomMost) / 2;
          // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, y: centerY - c.height / 2 } : c;
          });
          break;
        }
        case 'distribute-h': {
          const sorted = [...selectedControls].sort((a, b) => a.x - b.x);
          const leftMost = sorted[0].x;
          const rightMost = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
          const totalWidth = sorted.reduce((sum, c) => sum + c.width, 0);
          const spacing = (rightMost - leftMost - totalWidth) / (sorted.length - 1);

          // PERFORMANCE FIX: O(n²) → O(n) - Build position map first, then single pass
          const positionMap = new Map<number, number>();
          let currentX = leftMost;
          sorted.forEach(control => {
            positionMap.set(control.id, currentX);
            currentX += control.width + spacing;
          });

          updatedControls = controls.map(c => {
            const newX = positionMap.get(c.id);
            return newX !== undefined ? { ...c, x: newX } : c;
          });
          break;
        }
        case 'distribute-v': {
          const sorted = [...selectedControls].sort((a, b) => a.y - b.y);
          const topMost = sorted[0].y;
          const bottomMost = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
          const totalHeight = sorted.reduce((sum, c) => sum + c.height, 0);
          const spacing = (bottomMost - topMost - totalHeight) / (sorted.length - 1);

          // PERFORMANCE FIX: O(n²) → O(n) - Build position map first, then single pass
          const positionMap = new Map<number, number>();
          let currentY = topMost;
          sorted.forEach(control => {
            positionMap.set(control.id, currentY);
            currentY += control.height + spacing;
          });

          updatedControls = controls.map(c => {
            const newY = positionMap.get(c.id);
            return newY !== undefined ? { ...c, y: newY } : c;
          });
          break;
        }
      }

      updateControls(updatedControls);
    },
    [selectedControls, controls, updateControls]
  );

  // Redimensionner pour avoir la même taille
  const makeSameSize = useCallback(
    (type: 'width' | 'height' | 'both') => {
      if (selectedControls.length < 2) return;

      const reference = selectedControls[0];
      // PERFORMANCE FIX: O(n²) → O(n) - Use Set for O(1) lookup
      const selectedIds = new Set(selectedControls.map(sc => sc.id));
      const updatedControls = controls.map(c => {
        if (selectedIds.has(c.id) && c.id !== reference.id) {
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
    },
    [selectedControls, controls, updateControls]
  );

  // MEMORY LEAK FIX: Cleanup effect to prevent stale animation frames
  useEffect(() => {
    return () => {
      // Clean up any pending animation frame when hook is destroyed
      if (updateRAFRef.current !== null) {
        cancelAnimationFrame(updateRAFRef.current);
        updateRAFRef.current = null;
      }
    };
  }, []);

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
    makeSameSize,
  };
};
