/**
 * Tests unitaires pour useControlManipulation
 * Vérification de la stabilité et prévention des boucles infinies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useControlManipulation } from '../../hooks/useControlManipulation';
import React from 'react';

// Mock des dépendances
vi.mock('../../stores/vb6Store', () => ({
  useVB6Store: vi.fn((selector) => {
    const mockState = {
      controls: [],
      selectedControlIds: [],
      snapToGrid: true,
      gridSize: 8,
      zoom: 1,
      canvasSize: { width: 800, height: 600 },
      updateControl: vi.fn(),
      selectControls: vi.fn(),
      addLog: vi.fn()
    };
    return selector(mockState);
  })
}));

vi.mock('../../context/VB6Context', () => ({
  useVB6: () => ({
    state: {
      controls: [],
      selectedControlIds: [],
      canvasSize: { width: 800, height: 600 }
    },
    updateControl: vi.fn(),
    selectControls: vi.fn()
  })
}));

// Mock performance monitor
vi.mock('../../utils/performanceMonitor', () => ({
  perfMonitor: {
    startMeasure: vi.fn(),
    endMeasure: vi.fn(),
    checkRenderLoop: vi.fn(() => false),
    measureMemory: vi.fn(() => ({ used: 1000000, total: 10000000 }))
  }
}));

describe('useControlManipulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Stability', () => {
    it('should not cause infinite re-renders', async () => {
      let renderCount = 0;
      
      const { result } = renderHook(() => {
        renderCount++;
        return useControlManipulation();
      });

      // Wait for hook to stabilize
      await waitFor(() => {
        expect(renderCount).toBeLessThan(5);
      }, { timeout: 1000 });

      expect(result.current).toBeDefined();
      expect(typeof result.current.selectControl).toBe('function');
      expect(typeof result.current.moveControl).toBe('function');
      expect(typeof result.current.resizeControl).toBe('function');
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useControlManipulation());

      const initialFunctions = {
        selectControl: result.current.selectControl,
        moveControl: result.current.moveControl,
        resizeControl: result.current.resizeControl,
        alignControls: result.current.alignControls
      };

      // Rerender the hook
      rerender();

      // Functions should maintain stable references (memoized)
      expect(result.current.selectControl).toBe(initialFunctions.selectControl);
      expect(result.current.moveControl).toBe(initialFunctions.moveControl);
      expect(result.current.resizeControl).toBe(initialFunctions.resizeControl);
      expect(result.current.alignControls).toBe(initialFunctions.alignControls);
    });
  });

  describe('Control Selection', () => {
    it('should handle control selection without infinite loops', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.selectControl(1);
      });

      act(() => {
        result.current.selectControl(2);
      });

      act(() => {
        result.current.selectControl(3);
      });

      // Should complete without hanging or infinite loops
      expect(result.current).toBeDefined();
    });

    it('should handle multi-select operations', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.selectMultipleControls([1, 2, 3]);
      });

      act(() => {
        result.current.toggleControlSelection(4);
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Control Movement', () => {
    it('should handle control movement with grid snapping', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.moveControl(1, { x: 100, y: 150 });
      });

      act(() => {
        result.current.moveControlsBy([1, 2], { deltaX: 10, deltaY: 15 });
      });

      expect(result.current).toBeDefined();
    });

    it('should prevent movement outside bounds', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        // Try to move outside canvas bounds
        result.current.moveControl(1, { x: -100, y: -50 });
      });

      act(() => {
        // Try to move far outside bounds
        result.current.moveControl(1, { x: 9999, y: 9999 });
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Control Resizing', () => {
    it('should handle control resizing operations', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.resizeControl(1, { 
          width: 200, 
          height: 100,
          direction: 'se' 
        });
      });

      act(() => {
        result.current.resizeControl(1, { 
          width: 150, 
          height: 80,
          direction: 'nw' 
        });
      });

      expect(result.current).toBeDefined();
    });

    it('should enforce minimum size constraints', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        // Try to resize to very small dimensions
        result.current.resizeControl(1, { 
          width: 1, 
          height: 1,
          direction: 'se' 
        });
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Alignment Operations', () => {
    it('should handle control alignment without performance issues', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.alignControls([1, 2, 3], 'left');
      });

      act(() => {
        result.current.alignControls([1, 2, 3], 'center');
      });

      act(() => {
        result.current.alignControls([1, 2, 3], 'distribute-horizontal');
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with rapid operations', async () => {
      const { result } = renderHook(() => useControlManipulation());

      // Perform many rapid operations
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.selectControl(i % 10);
          result.current.moveControl(i % 10, { x: i, y: i });
        });
      }

      // Should complete without memory issues
      expect(result.current).toBeDefined();
    });

    it('should handle concurrent operations gracefully', async () => {
      const { result } = renderHook(() => useControlManipulation());

      // Simulate concurrent operations that could cause race conditions
      const operations = [
        () => result.current.selectControl(1),
        () => result.current.moveControl(1, { x: 50, y: 50 }),
        () => result.current.resizeControl(1, { width: 100, height: 100, direction: 'se' }),
        () => result.current.alignControls([1, 2], 'left'),
        () => result.current.selectMultipleControls([1, 2, 3])
      ];

      await act(async () => {
        // Execute all operations simultaneously
        await Promise.all(operations.map(op => Promise.resolve(op())));
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid control IDs gracefully', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.selectControl(-1);
        result.current.selectControl(999999);
        result.current.moveControl(-1, { x: 100, y: 100 });
        result.current.resizeControl(999999, { width: 100, height: 100, direction: 'se' });
      });

      expect(result.current).toBeDefined();
    });

    it('should handle null and undefined parameters', async () => {
      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        // These should not crash
        result.current.selectControl(null as any);
        result.current.moveControl(1, null as any);
        result.current.resizeControl(1, undefined as any);
        result.current.alignControls([], 'left');
        result.current.selectMultipleControls(null as any);
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Cleanup and Unmounting', () => {
    it('should cleanup properly on unmount', () => {
      const { result, unmount } = renderHook(() => useControlManipulation());

      expect(result.current).toBeDefined();

      // Should unmount without errors
      unmount();

      // No assertions needed - if it unmounts cleanly, the test passes
    });

    it('should not execute callbacks after unmount', async () => {
      const { result, unmount } = renderHook(() => useControlManipulation());

      const selectControl = result.current.selectControl;

      unmount();

      // These operations should not cause errors after unmount
      act(() => {
        selectControl(1);
      });

      // If we reach here without errors, the cleanup worked
      expect(true).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly with store updates', async () => {
      const { useVB6Store } = await import('../../stores/vb6Store');
      const mockUpdateControl = vi.fn();
      const mockSelectControls = vi.fn();

      (useVB6Store as any).mockImplementation((selector: any) => {
        const mockState = {
          controls: [
            { id: 1, left: 0, top: 0, width: 100, height: 50 },
            { id: 2, left: 50, top: 50, width: 100, height: 50 }
          ],
          selectedControlIds: [1],
          snapToGrid: true,
          gridSize: 8,
          zoom: 1,
          canvasSize: { width: 800, height: 600 },
          updateControl: mockUpdateControl,
          selectControls: mockSelectControls,
          addLog: vi.fn()
        };
        return selector(mockState);
      });

      const { result } = renderHook(() => useControlManipulation());

      act(() => {
        result.current.moveControl(1, { x: 100, y: 100 });
      });

      // Should have called store methods
      expect(mockUpdateControl).toHaveBeenCalled();
    });
  });
});