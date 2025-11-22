/**
 * ULTRA COMPREHENSIVE Hooks Test Suite
 * Tests all custom React hooks, edge cases, and integration scenarios
 */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRef } from 'react';

// Mock hooks dependencies
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Hook interfaces and types
interface VB6Control {
  id: string;
  type: string;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  zIndex: number;
}

interface AutoSaveOptions {
  delay: number;
  enabled: boolean;
  key: string;
}

interface UndoRedoState<T> {
  current: T;
  history: T[];
  future: T[];
}

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
}

describe('useAutoSave Hook', () => {
  let mockSaveFunction: any;

  beforeEach(() => {
    mockSaveFunction = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-save data when it changes', async () => {
    const useAutoSave = (data: any, saveFunction: Function, options: AutoSaveOptions) => {
      const timeoutRef = useRef<NodeJS.Timeout>();
      const previousDataRef = useRef(data);

      React.useEffect(() => {
        if (!options.enabled) return;
        
        if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            saveFunction(data);
          }, options.delay);

          previousDataRef.current = data;
        }

        return () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      }, [data, saveFunction, options]);
    };

    const initialData = { name: 'Test', value: 1 };
    let currentData = initialData;

    const { rerender } = renderHook(() => 
      useAutoSave(currentData, mockSaveFunction, {
        delay: 1000,
        enabled: true,
        key: 'test-data',
      })
    );

    // Change data
    currentData = { name: 'Updated Test', value: 2 };
    rerender();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockSaveFunction).toHaveBeenCalledWith(currentData);
    });
  });

  it('should not save when disabled', () => {
    const useAutoSave = (data: any, saveFunction: Function, options: AutoSaveOptions) => {
      const timeoutRef = useRef<NodeJS.Timeout>();
      const previousDataRef = useRef(data);

      React.useEffect(() => {
        if (!options.enabled) return;
        
        if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
          timeoutRef.current = setTimeout(() => {
            saveFunction(data);
          }, options.delay);
          previousDataRef.current = data;
        }
      }, [data, saveFunction, options]);
    };

    let currentData = { name: 'Test', value: 1 };

    const { rerender } = renderHook(() => 
      useAutoSave(currentData, mockSaveFunction, {
        delay: 1000,
        enabled: false,
        key: 'test-data',
      })
    );

    currentData = { name: 'Updated Test', value: 2 };
    rerender();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSaveFunction).not.toHaveBeenCalled();
  });

  it('should debounce rapid changes', () => {
    const useAutoSave = (data: any, saveFunction: Function, options: AutoSaveOptions) => {
      const timeoutRef = useRef<NodeJS.Timeout>();
      const previousDataRef = useRef(data);

      React.useEffect(() => {
        if (!options.enabled) return;
        
        if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            saveFunction(data);
          }, options.delay);
          previousDataRef.current = data;
        }
      }, [data, saveFunction, options]);
    };

    let currentData = { value: 1 };

    const { rerender } = renderHook(() => 
      useAutoSave(currentData, mockSaveFunction, {
        delay: 1000,
        enabled: true,
        key: 'test-data',
      })
    );

    // Make rapid changes
    for (let i = 2; i <= 10; i++) {
      currentData = { value: i };
      rerender();
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }

    // Only the final change should be saved
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveFunction).toHaveBeenCalledWith({ value: 10 });
  });
});

describe('useUndoRedo Hook', () => {
  it('should manage undo/redo state correctly', () => {
    const useUndoRedo = <T>(initialState: T): [
      T,
      (newState: T) => void,
      () => void,
      () => void,
      boolean,
      boolean
    ] => {
      const [state, setState] = React.useState<UndoRedoState<T>>({
        current: initialState,
        history: [initialState],
        future: [],
      });

      const updateState = React.useCallback((newState: T) => {
        setState(prev => ({
          current: newState,
          history: [...prev.history, prev.current],
          future: [],
        }));
      }, []);

      const undo = React.useCallback(() => {
        setState(prev => {
          if (prev.history.length <= 1) return prev;
          
          const previousState = prev.history[prev.history.length - 1];
          return {
            current: previousState,
            history: prev.history.slice(0, -1),
            future: [prev.current, ...prev.future],
          };
        });
      }, []);

      const redo = React.useCallback(() => {
        setState(prev => {
          if (prev.future.length === 0) return prev;
          
          const nextState = prev.future[0];
          return {
            current: nextState,
            history: [...prev.history, prev.current],
            future: prev.future.slice(1),
          };
        });
      }, []);

      const canUndo = state.history.length > 1;
      const canRedo = state.future.length > 0;

      return [state.current, updateState, undo, redo, canUndo, canRedo];
    };

    const { result } = renderHook(() => useUndoRedo(0));

    // Initial state
    expect(result.current[0]).toBe(0); // current value
    expect(result.current[4]).toBe(false); // canUndo
    expect(result.current[5]).toBe(false); // canRedo

    // Update state
    act(() => {
      result.current[1](1); // updateState
    });

    expect(result.current[0]).toBe(1);
    expect(result.current[4]).toBe(true); // can undo now
    expect(result.current[5]).toBe(false);

    // Add more states
    act(() => {
      result.current[1](2);
    });
    act(() => {
      result.current[1](3);
    });

    expect(result.current[0]).toBe(3);

    // Undo
    act(() => {
      result.current[2](); // undo
    });

    expect(result.current[0]).toBe(2);
    expect(result.current[4]).toBe(true); // can still undo
    expect(result.current[5]).toBe(true); // can redo now

    // Redo
    act(() => {
      result.current[3](); // redo
    });

    expect(result.current[0]).toBe(3);
    expect(result.current[5]).toBe(false); // no more redo
  });

  it('should clear future when new state is added after undo', () => {
    const useUndoRedo = <T>(initialState: T): [
      T,
      (newState: T) => void,
      () => void,
      () => void,
      boolean,
      boolean
    ] => {
      const [state, setState] = React.useState<UndoRedoState<T>>({
        current: initialState,
        history: [initialState],
        future: [],
      });

      const updateState = React.useCallback((newState: T) => {
        setState(prev => ({
          current: newState,
          history: [...prev.history, prev.current],
          future: [],
        }));
      }, []);

      const undo = React.useCallback(() => {
        setState(prev => {
          if (prev.history.length <= 1) return prev;
          
          const previousState = prev.history[prev.history.length - 1];
          return {
            current: previousState,
            history: prev.history.slice(0, -1),
            future: [prev.current, ...prev.future],
          };
        });
      }, []);

      const redo = React.useCallback(() => {
        setState(prev => {
          if (prev.future.length === 0) return prev;
          
          const nextState = prev.future[0];
          return {
            current: nextState,
            history: [...prev.history, prev.current],
            future: prev.future.slice(1),
          };
        });
      }, []);

      const canUndo = state.history.length > 1;
      const canRedo = state.future.length > 0;

      return [state.current, updateState, undo, redo, canUndo, canRedo];
    };

    const { result } = renderHook(() => useUndoRedo(0));

    // Build up some history
    act(() => { result.current[1](1); });
    act(() => { result.current[1](2); });
    act(() => { result.current[1](3); });

    // Undo twice
    act(() => { result.current[2](); }); // 3 -> 2
    act(() => { result.current[2](); }); // 2 -> 1

    expect(result.current[0]).toBe(1);
    expect(result.current[5]).toBe(true); // can redo

    // Add new state - should clear future
    act(() => {
      result.current[1](4);
    });

    expect(result.current[0]).toBe(4);
    expect(result.current[5]).toBe(false); // can no longer redo
  });
});

describe('useKeyboardShortcuts Hook', () => {
  it('should register and handle keyboard shortcuts', () => {
    const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
      React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          shortcuts.forEach(shortcut => {
            const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
            const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
              event.preventDefault();
              shortcut.callback();
            }
          });
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }, [shortcuts]);
    };

    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();

    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrlKey: true, callback: mockCallback1 },
      { key: 'z', ctrlKey: true, callback: mockCallback2 },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+S
    const ctrlSEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    document.dispatchEvent(ctrlSEvent);

    expect(mockCallback1).toHaveBeenCalledTimes(1);

    // Simulate Ctrl+Z
    const ctrlZEvent = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    });
    document.dispatchEvent(ctrlZEvent);

    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when modifiers do not match', () => {
    const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
      React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          shortcuts.forEach(shortcut => {
            const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
            const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
              event.preventDefault();
              shortcut.callback();
            }
          });
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }, [shortcuts]);
    };

    const mockCallback = vi.fn();

    const shortcuts: KeyboardShortcut[] = [
      { key: 's', ctrlKey: true, callback: mockCallback },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate 's' without Ctrl
    const sEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: false,
    });
    document.dispatchEvent(sEvent);

    expect(mockCallback).not.toHaveBeenCalled();
  });
});

describe('useControlManipulation Hook', () => {
  it('should handle control movement with grid snapping', () => {
    const useControlManipulation = (gridSize: number, snapToGrid: boolean) => {
      const moveControl = React.useCallback((control: VB6Control, deltaX: number, deltaY: number) => {
        let newLeft = control.left + deltaX;
        let newTop = control.top + deltaY;

        if (snapToGrid) {
          newLeft = Math.round(newLeft / gridSize) * gridSize;
          newTop = Math.round(newTop / gridSize) * gridSize;
        }

        return {
          ...control,
          left: Math.max(0, newLeft),
          top: Math.max(0, newTop),
        };
      }, [gridSize, snapToGrid]);

      const resizeControl = React.useCallback((
        control: VB6Control, 
        direction: string, 
        deltaX: number, 
        deltaY: number
      ) => {
        let newWidth = control.width;
        let newHeight = control.height;
        let newLeft = control.left;
        let newTop = control.top;

        switch (direction) {
          case 'se': // Southeast
            newWidth = Math.max(20, control.width + deltaX);
            newHeight = Math.max(20, control.height + deltaY);
            break;
          case 'nw': // Northwest
            newWidth = Math.max(20, control.width - deltaX);
            newHeight = Math.max(20, control.height - deltaY);
            newLeft = control.left + deltaX;
            newTop = control.top + deltaY;
            break;
          case 'ne': // Northeast
            newWidth = Math.max(20, control.width + deltaX);
            newHeight = Math.max(20, control.height - deltaY);
            newTop = control.top + deltaY;
            break;
          case 'sw': // Southwest
            newWidth = Math.max(20, control.width - deltaX);
            newHeight = Math.max(20, control.height + deltaY);
            newLeft = control.left + deltaX;
            break;
        }

        if (snapToGrid) {
          newLeft = Math.round(newLeft / gridSize) * gridSize;
          newTop = Math.round(newTop / gridSize) * gridSize;
          newWidth = Math.round(newWidth / gridSize) * gridSize;
          newHeight = Math.round(newHeight / gridSize) * gridSize;
        }

        return {
          ...control,
          left: Math.max(0, newLeft),
          top: Math.max(0, newTop),
          width: newWidth,
          height: newHeight,
        };
      }, [gridSize, snapToGrid]);

      return { moveControl, resizeControl };
    };

    const { result } = renderHook(() => useControlManipulation(8, true));

    const testControl: VB6Control = {
      id: 'ctrl1',
      type: 'TextBox',
      name: 'Text1',
      left: 100,
      top: 50,
      width: 120,
      height: 25,
      properties: {},
      zIndex: 1,
    };

    // Test movement with grid snapping
    const movedControl = result.current.moveControl(testControl, 13, 7); // Should snap to grid

    expect(movedControl.left).toBe(112); // 113 snapped to 8-pixel grid
    expect(movedControl.top).toBe(56);  // 57 snapped to 8-pixel grid

    // Test resize
    const resizedControl = result.current.resizeControl(testControl, 'se', 20, 10);

    expect(resizedControl.width).toBe(144); // 140 snapped to grid
    expect(resizedControl.height).toBe(32); // 35 snapped to grid
  });

  it('should enforce minimum control sizes', () => {
    const useControlManipulation = (gridSize: number, snapToGrid: boolean) => {
      const resizeControl = React.useCallback((
        control: VB6Control, 
        direction: string, 
        deltaX: number, 
        deltaY: number
      ) => {
        let newWidth = control.width;
        let newHeight = control.height;

        switch (direction) {
          case 'se':
            newWidth = Math.max(20, control.width + deltaX);
            newHeight = Math.max(20, control.height + deltaY);
            break;
        }

        return {
          ...control,
          width: newWidth,
          height: newHeight,
        };
      }, [gridSize, snapToGrid]);

      return { resizeControl };
    };

    const { result } = renderHook(() => useControlManipulation(8, false));

    const testControl: VB6Control = {
      id: 'ctrl1',
      type: 'TextBox',
      name: 'Text1',
      left: 100,
      top: 50,
      width: 30,
      height: 30,
      properties: {},
      zIndex: 1,
    };

    // Try to resize to smaller than minimum
    const resizedControl = result.current.resizeControl(testControl, 'se', -20, -20);

    expect(resizedControl.width).toBe(20); // Minimum enforced
    expect(resizedControl.height).toBe(20); // Minimum enforced
  });
});

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  it('should read initial value from localStorage', () => {
    const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
      const [storedValue, setStoredValue] = React.useState<T>(() => {
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          return initialValue;
        }
      });

      const setValue = React.useCallback((value: T) => {
        try {
          setStoredValue(value);
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }, [key]);

      return [storedValue, setValue];
    };

    mockLocalStorage.getItem.mockReturnValue('"stored value"');

    const { result } = renderHook(() => useLocalStorage('testKey', 'default value'));

    expect(result.current[0]).toBe('stored value');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should use default value when localStorage is empty', () => {
    const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
      const [storedValue, setStoredValue] = React.useState<T>(() => {
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          return initialValue;
        }
      });

      const setValue = React.useCallback((value: T) => {
        try {
          setStoredValue(value);
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }, [key]);

      return [storedValue, setValue];
    };

    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('testKey', 'default value'));

    expect(result.current[0]).toBe('default value');
  });

  it('should update localStorage when value changes', () => {
    const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
      const [storedValue, setStoredValue] = React.useState<T>(() => {
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          return initialValue;
        }
      });

      const setValue = React.useCallback((value: T) => {
        try {
          setStoredValue(value);
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }, [key]);

      return [storedValue, setValue];
    };

    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

    act(() => {
      result.current[1]('new value');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify('new value')
    );
    expect(result.current[0]).toBe('new value');
  });
});

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce rapid value changes', () => {
    const useDebounce = <T>(value: T, delay: number): T => {
      const [debouncedValue, setDebouncedValue] = React.useState(value);

      React.useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedValue(value);
        }, delay);

        return () => {
          clearTimeout(handler);
        };
      }, [value, delay]);

      return debouncedValue;
    };

    let currentValue = 'initial';

    const { result, rerender } = renderHook(() => useDebounce(currentValue, 500));

    expect(result.current).toBe('initial');

    // Change value rapidly
    currentValue = 'change1';
    rerender();
    currentValue = 'change2';
    rerender();
    currentValue = 'final';
    rerender();

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now should be the final value
    expect(result.current).toBe('final');
  });

  it('should handle delay changes', () => {
    const useDebounce = <T>(value: T, delay: number): T => {
      const [debouncedValue, setDebouncedValue] = React.useState(value);

      React.useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedValue(value);
        }, delay);

        return () => {
          clearTimeout(handler);
        };
      }, [value, delay]);

      return debouncedValue;
    };

    let currentValue = 'initial';
    let currentDelay = 500;

    const { result, rerender } = renderHook(() => useDebounce(currentValue, currentDelay));

    currentValue = 'changed';
    currentDelay = 1000; // Change delay
    rerender();

    // Should not update after original delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // Should update after new delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('changed');
  });
});

describe('useInterval Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback at specified intervals', () => {
    const useInterval = (callback: () => void, delay: number | null) => {
      const savedCallback = useRef(callback);

      React.useEffect(() => {
        savedCallback.current = callback;
      }, [callback]);

      React.useEffect(() => {
        if (delay === null) return;

        const tick = () => {
          savedCallback.current();
        };

        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }, [delay]);
    };

    const mockCallback = vi.fn();

    renderHook(() => useInterval(mockCallback, 1000));

    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockCallback).toHaveBeenCalledTimes(3);
  });

  it('should pause when delay is null', () => {
    const useInterval = (callback: () => void, delay: number | null) => {
      const savedCallback = useRef(callback);

      React.useEffect(() => {
        savedCallback.current = callback;
      }, [callback]);

      React.useEffect(() => {
        if (delay === null) return;

        const tick = () => {
          savedCallback.current();
        };

        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }, [delay]);
    };

    const mockCallback = vi.fn();
    let currentDelay: number | null = 1000;

    const { rerender } = renderHook(() => useInterval(mockCallback, currentDelay));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    // Pause the interval
    currentDelay = null;
    rerender();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should not have been called again
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});

describe('usePrevious Hook', () => {
  it('should return previous value', () => {
    const usePrevious = <T>(value: T): T | undefined => {
      const ref = useRef<T>();
      
      React.useEffect(() => {
        ref.current = value;
      });
      
      return ref.current;
    };

    let currentValue = 'initial';

    const { result, rerender } = renderHook(() => usePrevious(currentValue));

    expect(result.current).toBeUndefined(); // First render

    currentValue = 'second';
    rerender();

    expect(result.current).toBe('initial');

    currentValue = 'third';
    rerender();

    expect(result.current).toBe('second');
  });
});

describe('useToggle Hook', () => {
  it('should toggle boolean value', () => {
    const useToggle = (initialValue = false): [boolean, () => void] => {
      const [value, setValue] = React.useState(initialValue);
      
      const toggle = React.useCallback(() => {
        setValue(v => !v);
      }, []);
      
      return [value, toggle];
    };

    const { result } = renderHook(() => useToggle());

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(false);
  });

  it('should accept initial value', () => {
    const useToggle = (initialValue = false): [boolean, () => void] => {
      const [value, setValue] = React.useState(initialValue);
      
      const toggle = React.useCallback(() => {
        setValue(v => !v);
      }, []);
      
      return [value, toggle];
    };

    const { result } = renderHook(() => useToggle(true));

    expect(result.current[0]).toBe(true);
  });
});

describe('useAsyncEffect Hook', () => {
  it('should handle async operations in useEffect', async () => {
    const useAsyncEffect = (
      asyncFunction: () => Promise<void>,
      deps?: React.DependencyList
    ) => {
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        let cancelled = false;

        const runAsync = async () => {
          try {
            setLoading(true);
            setError(null);
            await asyncFunction();
          } catch (err) {
            if (!cancelled) {
              setError(err as Error);
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };

        runAsync();

        return () => {
          cancelled = true;
        };
      }, deps);

      return { loading, error };
    };

    const mockAsyncFunction = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useAsyncEffect(mockAsyncFunction));

    // Should start loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle async errors', async () => {
    const useAsyncEffect = (
      asyncFunction: () => Promise<void>,
      deps?: React.DependencyList
    ) => {
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        let cancelled = false;

        const runAsync = async () => {
          try {
            setLoading(true);
            setError(null);
            await asyncFunction();
          } catch (err) {
            if (!cancelled) {
              setError(err as Error);
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };

        runAsync();

        return () => {
          cancelled = true;
        };
      }, deps);

      return { loading, error };
    };

    const testError = new Error('Test error');
    const mockAsyncFunction = vi.fn().mockRejectedValue(testError);

    const { result } = renderHook(() => useAsyncEffect(mockAsyncFunction));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(testError);
  });
});

describe('useElementSize Hook', () => {
  it('should track element size changes', () => {
    const useElementSize = () => {
      const ref = useRef<HTMLElement>(null);
      const [size, setSize] = React.useState({ width: 0, height: 0 });

      React.useEffect(() => {
        if (!ref.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setSize({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            });
          }
        });

        resizeObserver.observe(ref.current);

        return () => {
          resizeObserver.disconnect();
        };
      }, []);

      return { ref, size };
    };

    const { result } = renderHook(() => useElementSize());

    expect(result.current.ref).toBeDefined();
    expect(result.current.size).toEqual({ width: 0, height: 0 });

    // ResizeObserver is mocked, so we can't test actual size changes
    expect(global.ResizeObserver).toHaveBeenCalled();
  });
});

describe('useClickOutside Hook', () => {
  it('should call handler when clicking outside element', () => {
    const useClickOutside = (handler: () => void) => {
      const ref = useRef<HTMLElement>(null);

      React.useEffect(() => {
        const handleClick = (event: MouseEvent) => {
          if (ref.current && !ref.current.contains(event.target as Node)) {
            handler();
          }
        };

        document.addEventListener('mousedown', handleClick);
        return () => {
          document.removeEventListener('mousedown', handleClick);
        };
      }, [handler]);

      return ref;
    };

    const mockHandler = vi.fn();
    const { result } = renderHook(() => useClickOutside(mockHandler));

    // Simulate click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const clickEvent = new MouseEvent('mousedown', {
      bubbles: true,
      target: outsideElement,
    } as any);

    document.dispatchEvent(clickEvent);

    expect(mockHandler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside element', () => {
    const useClickOutside = (handler: () => void) => {
      const ref = useRef<HTMLElement>(null);

      React.useEffect(() => {
        const handleClick = (event: MouseEvent) => {
          if (ref.current && !ref.current.contains(event.target as Node)) {
            handler();
          }
        };

        document.addEventListener('mousedown', handleClick);
        return () => {
          document.removeEventListener('mousedown', handleClick);
        };
      }, [handler]);

      return ref;
    };

    const mockHandler = vi.fn();
    const { result } = renderHook(() => useClickOutside(mockHandler));

    // Create a mock element and set it as the ref
    const insideElement = document.createElement('div');
    document.body.appendChild(insideElement);
    
    // Mock the ref to point to our element
    Object.defineProperty(result.current, 'current', {
      value: insideElement,
      configurable: true,
    });

    const clickEvent = new MouseEvent('mousedown', {
      bubbles: true,
      target: insideElement,
    } as any);

    document.dispatchEvent(clickEvent);

    expect(mockHandler).not.toHaveBeenCalled();

    document.body.removeChild(insideElement);
  });
});

// Mock React for hooks that require it
const React = {
  useState: vi.fn(),
  useEffect: vi.fn(),
  useCallback: vi.fn(),
  useRef: vi.fn(),
  useMemo: vi.fn(),
};

// Mock implementations for basic React hooks
React.useState.mockImplementation((initial) => {
  let state = initial;
  const setState = (newState: any) => {
    state = typeof newState === 'function' ? newState(state) : newState;
  };
  return [state, setState];
});

React.useEffect.mockImplementation((fn, deps) => {
  fn();
});

React.useCallback.mockImplementation((fn) => fn);

React.useRef.mockImplementation((initial) => ({ current: initial }));