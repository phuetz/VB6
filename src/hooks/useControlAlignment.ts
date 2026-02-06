import { useCallback, useMemo, useState } from 'react';
import { Control } from '../context/types';

interface AlignmentOptions {
  showAlignmentGuides: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export const useControlAlignment = (
  controls: Control[],
  selectedControls: Control[],
  updateControls: (controls: Control[]) => void,
  options: AlignmentOptions
) => {
  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

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
      guides.x.push(control.x, control.x + control.width, control.x + control.width / 2);
      guides.y.push(control.y, control.y + control.height, control.y + control.height / 2);
    });

    return {
      x: [...new Set(guides.x)].sort((a, b) => a - b),
      y: [...new Set(guides.y)].sort((a, b) => a - b),
    };
  }, [controls, options.showAlignmentGuides]);

  // Calculate alignment guides for moving controls
  const calculateAlignmentGuides = useCallback(
    (movingControls: Control[], dx: number, dy: number) => {
      if (!options.showAlignmentGuides) {
        setAlignmentGuides({ x: [], y: [] });
        return;
      }

      const guides = { x: [] as number[], y: [] as number[] };
      const threshold = 5;

      movingControls.forEach(movingControl => {
        const newX = movingControl.x + dx;
        const newY = movingControl.y + dy;
        const newRight = newX + movingControl.width;
        const newBottom = newY + movingControl.height;
        const newCenterX = newX + movingControl.width / 2;
        const newCenterY = newY + movingControl.height / 2;

        staticAlignmentGuides.x.forEach(guideX => {
          if (
            Math.abs(newX - guideX) < threshold ||
            Math.abs(newRight - guideX) < threshold ||
            Math.abs(newCenterX - guideX) < threshold
          ) {
            guides.x.push(guideX);
          }
        });

        staticAlignmentGuides.y.forEach(guideY => {
          if (
            Math.abs(newY - guideY) < threshold ||
            Math.abs(newBottom - guideY) < threshold ||
            Math.abs(newCenterY - guideY) < threshold
          ) {
            guides.y.push(guideY);
          }
        });
      });

      setAlignmentGuides({
        x: [...new Set(guides.x)],
        y: [...new Set(guides.y)],
      });
    },
    [staticAlignmentGuides, options.showAlignmentGuides]
  );

  const clearAlignmentGuides = useCallback(() => {
    setAlignmentGuides({ x: [], y: [] });
  }, []);

  // Align selected controls
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
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, x: leftMost } : c;
          });
          break;
        }
        case 'right': {
          const rightMost = Math.max(...selectedControls.map(c => c.x + c.width));
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, x: rightMost - c.width } : c;
          });
          break;
        }
        case 'top': {
          const topMost = Math.min(...selectedControls.map(c => c.y));
          const selectedIds = new Set(selectedControls.map(sc => sc.id));
          updatedControls = controls.map(c => {
            return selectedIds.has(c.id) ? { ...c, y: topMost } : c;
          });
          break;
        }
        case 'bottom': {
          const bottomMost = Math.max(...selectedControls.map(c => c.y + c.height));
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

  // Make selected controls the same size
  const makeSameSize = useCallback(
    (type: 'width' | 'height' | 'both') => {
      if (selectedControls.length < 2) return;

      const reference = selectedControls[0];
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

  return {
    alignmentGuides,
    snapToGrid,
    calculateAlignmentGuides,
    clearAlignmentGuides,
    alignControls,
    makeSameSize,
  };
};
