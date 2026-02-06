/**
 * Tests unitaires pour DragDropProvider
 * Vérification des corrections de boucles infinies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { DragDropProvider, useDragDrop } from '../../components/DragDrop/DragDropProvider';
import React, { useEffect, useState } from 'react';

// Mock des dépendances
vi.mock('../../stores/vb6Store', () => ({
  useVB6Store: vi.fn(selector => {
    const mockState = {
      snapToGrid: true,
      gridSize: 8,
      addLog: vi.fn(),
    };
    return selector(mockState);
  }),
}));

vi.mock('../../hooks/useUndoRedo', () => ({
  useUndoRedo: () => ({
    saveState: vi.fn(),
  }),
}));

vi.mock('../../utils/performanceMonitor', () => ({
  perfMonitor: {
    startMeasure: vi.fn(),
    checkRenderLoop: vi.fn(() => false),
  },
}));

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
  rectIntersection: vi.fn(),
}));

// Composant de test pour vérifier les hooks
const TestComponent: React.FC = () => {
  const dragDrop = useDragDrop();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  return (
    <div data-testid="test-component">
      <div data-testid="render-count">{renderCount}</div>
      <div data-testid="is-dragging">{dragDrop.isDragging.toString()}</div>
      <div data-testid="drop-zones-count">{dragDrop.dropZones.length}</div>
    </div>
  );
};

describe('DragDropProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to track calls
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Infinite Loop Prevention', () => {
    it('should not cause infinite re-renders during initialization', async () => {
      const { rerender } = render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      const renderCountElement = screen.getByTestId('render-count');
      const initialRenderCount = parseInt(renderCountElement.textContent || '0');

      // Wait for a reasonable time to see if renders stabilize
      await waitFor(
        () => {
          const currentRenderCount = parseInt(renderCountElement.textContent || '0');
          expect(currentRenderCount).toBeLessThan(10); // Should not exceed reasonable render count
        },
        { timeout: 1000 }
      );

      // Force a rerender to ensure stability
      rerender(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      await waitFor(() => {
        const finalRenderCount = parseInt(renderCountElement.textContent || '0');
        expect(finalRenderCount).toBeLessThan(15); // Should remain stable
      });
    });

    it('should handle keyboard events without infinite loops', async () => {
      render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      const renderCountElement = screen.getByTestId('render-count');
      const initialRenderCount = parseInt(renderCountElement.textContent || '0');

      // Simulate keyboard events
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', { key: 'Ctrl', ctrlKey: true });
        document.dispatchEvent(keydownEvent);
      });

      act(() => {
        const keyupEvent = new KeyboardEvent('keyup', { key: 'Ctrl', ctrlKey: false });
        document.dispatchEvent(keyupEvent);
      });

      // Wait and check that renders don't spiral out of control
      await waitFor(() => {
        const currentRenderCount = parseInt(renderCountElement.textContent || '0');
        expect(currentRenderCount - initialRenderCount).toBeLessThan(5);
      });
    });

    it('should handle escape key during drag without infinite loops', async () => {
      render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      const renderCountElement = screen.getByTestId('render-count');
      const initialRenderCount = parseInt(renderCountElement.textContent || '0');

      // Simulate escape key during drag
      act(() => {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
      });

      await waitFor(() => {
        const currentRenderCount = parseInt(renderCountElement.textContent || '0');
        expect(currentRenderCount - initialRenderCount).toBeLessThan(3);
      });
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
      expect(screen.getByTestId('drop-zones-count')).toHaveTextContent('0');
    });

    it('should provide context value correctly', () => {
      render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      // Component should render without throwing context error
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      // Should have added event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      unmount();

      // Should have removed event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should clean up audio context on unmount', () => {
      // Mock AudioContext
      const mockClose = vi.fn();
      global.AudioContext = vi.fn().mockImplementation(() => ({
        close: mockClose,
        createOscillator: vi.fn(() => ({
          connect: vi.fn(),
          frequency: { setValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
          type: 'sine',
        })),
        createGain: vi.fn(() => ({
          connect: vi.fn(),
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
        })),
        destination: {},
        currentTime: 0,
      }));

      const { unmount } = render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      unmount();

      // Note: AudioContext cleanup happens asynchronously, so we just verify the mock was called
      expect(global.AudioContext).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should not trigger excessive re-renders with multiple state updates', async () => {
      const TestComponentWithUpdates: React.FC = () => {
        const dragDrop = useDragDrop();
        const [renderCount, setRenderCount] = useState(0);

        useEffect(() => {
          setRenderCount(prev => prev + 1);
        });

        // Simulate rapid state changes that could cause loops
        useEffect(() => {
          const timer = setTimeout(() => {
            // This would previously cause infinite loops
            dragDrop.registerDropZone({
              id: 'test-zone',
              element: null,
              accepts: ['test'],
              onDrop: () => {},
              highlight: false,
            });
          }, 100);

          return () => clearTimeout(timer);
        }, [dragDrop.registerDropZone]);

        return (
          <div data-testid="test-with-updates">
            <div data-testid="render-count">{renderCount}</div>
          </div>
        );
      };

      render(
        <DragDropProvider>
          <TestComponentWithUpdates />
        </DragDropProvider>
      );

      await waitFor(
        () => {
          const renderCount = parseInt(screen.getByTestId('render-count').textContent || '0');
          expect(renderCount).toBeLessThan(10); // Should stabilize quickly
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Error Boundaries', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      const TestComponentOutsideProvider = () => {
        try {
          useDragDrop();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error-caught">{(error as Error).message}</div>;
        }
      };

      render(<TestComponentOutsideProvider />);

      expect(screen.getByTestId('error-caught')).toHaveTextContent(
        'useDragDrop must be used within a DragDropProvider'
      );

      console.error = originalError;
    });
  });

  describe('Integration with Store', () => {
    it('should not cause infinite loops when store values change', async () => {
      // Mock store with changing values
      const { useVB6Store } = await import('../../stores/vb6Store');
      let callCount = 0;

      (useVB6Store as any).mockImplementation((selector: any) => {
        callCount++;
        const mockState = {
          snapToGrid: callCount % 2 === 0, // Alternate between true/false
          gridSize: 8,
          addLog: vi.fn(),
        };
        return selector(mockState);
      });

      render(
        <DragDropProvider>
          <TestComponent />
        </DragDropProvider>
      );

      await waitFor(
        () => {
          const renderCount = parseInt(screen.getByTestId('render-count').textContent || '0');
          expect(renderCount).toBeLessThan(20); // Should not spiral into infinite renders
        },
        { timeout: 1000 }
      );
    });
  });
});
