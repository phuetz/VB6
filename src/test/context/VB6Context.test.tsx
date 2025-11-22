/**
 * ULTRA COMPREHENSIVE VB6 Context and Reducer Test Suite
 * Tests React Context, reducer actions, state transitions, and context providers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React, { useContext, ReactNode } from 'react';

// Mock React Context
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
  visible: boolean;
  enabled: boolean;
  parent?: string;
  children?: string[];
}

interface VB6Form {
  id: string;
  name: string;
  caption: string;
  width: number;
  height: number;
  controls: string[];
  properties: Record<string, any>;
}

interface VB6ContextState {
  currentForm: VB6Form | null;
  forms: VB6Form[];
  controls: Map<string, VB6Control>;
  selectedControls: string[];
  clipboard: VB6Control[];
  isDragging: boolean;
  draggedControl: VB6Control | null;
  zoom: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  
  // Project state
  project: {
    name: string;
    path: string;
    modified: boolean;
  } | null;
  
  // IDE state
  activeTab: string | null;
  panels: {
    toolbox: boolean;
    properties: boolean;
    projectExplorer: boolean;
    codeEditor: boolean;
  };
  
  // Undo/Redo
  history: VB6ContextState[];
  historyIndex: number;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

type VB6Action = 
  | { type: 'SET_CURRENT_FORM'; payload: VB6Form | null }
  | { type: 'ADD_FORM'; payload: VB6Form }
  | { type: 'UPDATE_FORM'; payload: { id: string; updates: Partial<VB6Form> } }
  | { type: 'DELETE_FORM'; payload: string }
  | { type: 'ADD_CONTROL'; payload: VB6Control }
  | { type: 'UPDATE_CONTROL'; payload: { id: string; updates: Partial<VB6Control> } }
  | { type: 'DELETE_CONTROL'; payload: string }
  | { type: 'SELECT_CONTROLS'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'COPY_CONTROLS'; payload: string[] }
  | { type: 'CUT_CONTROLS'; payload: string[] }
  | { type: 'PASTE_CONTROLS'; payload: { x: number; y: number } }
  | { type: 'START_DRAG'; payload: VB6Control }
  | { type: 'END_DRAG' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'TOGGLE_SNAP_TO_GRID' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_PROJECT'; payload: { name: string; path: string; modified?: boolean } | null }
  | { type: 'SET_ACTIVE_TAB'; payload: string | null }
  | { type: 'TOGGLE_PANEL'; payload: keyof VB6ContextState['panels'] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_TO_HISTORY' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

interface VB6ContextValue {
  state: VB6ContextState;
  dispatch: React.Dispatch<VB6Action>;
  
  // Computed values
  selectedControlsData: VB6Control[];
  canUndo: boolean;
  canRedo: boolean;
  hasUnsavedChanges: boolean;
  
  // Helper functions
  getControlById: (id: string) => VB6Control | undefined;
  getFormById: (id: string) => VB6Form | undefined;
  generateControlName: (type: string) => string;
  isControlSelected: (id: string) => boolean;
}

// Mock context and provider
const VB6Context = React.createContext<VB6ContextValue | null>(null);

describe('VB6 Context - Reducer State Management', () => {
  let initialState: VB6ContextState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  it('should handle SET_CURRENT_FORM action', () => {
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    const action: VB6Action = { type: 'SET_CURRENT_FORM', payload: form };
    const newState = vb6Reducer(initialState, action);

    expect(newState.currentForm).toEqual(form);
  });

  it('should handle ADD_FORM action', () => {
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    const action: VB6Action = { type: 'ADD_FORM', payload: form };
    const newState = vb6Reducer(initialState, action);

    expect(newState.forms).toContain(form);
    expect(newState.currentForm).toEqual(form);
  });

  it('should handle UPDATE_FORM action', () => {
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Original Caption',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    initialState.forms = [form];
    initialState.currentForm = form;

    const updates = { caption: 'Updated Caption', width: 6000 };
    const action: VB6Action = { type: 'UPDATE_FORM', payload: { id: 'form1', updates } };
    const newState = vb6Reducer(initialState, action);

    const updatedForm = newState.forms.find(f => f.id === 'form1');
    expect(updatedForm?.caption).toBe('Updated Caption');
    expect(updatedForm?.width).toBe(6000);
    expect(newState.currentForm?.caption).toBe('Updated Caption');
  });

  it('should handle DELETE_FORM action', () => {
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: ['ctrl1'],
      properties: {},
    };

    const control = createTestControl('ctrl1');
    
    initialState.forms = [form];
    initialState.currentForm = form;
    initialState.controls.set('ctrl1', control);

    const action: VB6Action = { type: 'DELETE_FORM', payload: 'form1' };
    const newState = vb6Reducer(initialState, action);

    expect(newState.forms).not.toContain(form);
    expect(newState.currentForm).toBeNull();
    expect(newState.controls.has('ctrl1')).toBe(false);
  });

  it('should handle ADD_CONTROL action', () => {
    const control = createTestControl('ctrl1');
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    initialState.currentForm = form;
    initialState.forms = [form];

    const action: VB6Action = { type: 'ADD_CONTROL', payload: control };
    const newState = vb6Reducer(initialState, action);

    expect(newState.controls.has('ctrl1')).toBe(true);
    expect(newState.currentForm?.controls).toContain('ctrl1');
  });

  it('should handle UPDATE_CONTROL action', () => {
    const control = createTestControl('ctrl1');
    initialState.controls.set('ctrl1', control);

    const updates = { left: 200, top: 100, width: 150 };
    const action: VB6Action = { type: 'UPDATE_CONTROL', payload: { id: 'ctrl1', updates } };
    const newState = vb6Reducer(initialState, action);

    const updatedControl = newState.controls.get('ctrl1');
    expect(updatedControl?.left).toBe(200);
    expect(updatedControl?.top).toBe(100);
    expect(updatedControl?.width).toBe(150);
  });

  it('should handle DELETE_CONTROL action', () => {
    const control = createTestControl('ctrl1');
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: ['ctrl1'],
      properties: {},
    };

    initialState.controls.set('ctrl1', control);
    initialState.currentForm = form;
    initialState.forms = [form];
    initialState.selectedControls = ['ctrl1'];

    const action: VB6Action = { type: 'DELETE_CONTROL', payload: 'ctrl1' };
    const newState = vb6Reducer(initialState, action);

    expect(newState.controls.has('ctrl1')).toBe(false);
    expect(newState.currentForm?.controls).not.toContain('ctrl1');
    expect(newState.selectedControls).not.toContain('ctrl1');
  });

  it('should handle SELECT_CONTROLS action', () => {
    const controlIds = ['ctrl1', 'ctrl2'];
    
    const action: VB6Action = { type: 'SELECT_CONTROLS', payload: controlIds };
    const newState = vb6Reducer(initialState, action);

    expect(newState.selectedControls).toEqual(controlIds);
  });

  it('should handle CLEAR_SELECTION action', () => {
    initialState.selectedControls = ['ctrl1', 'ctrl2'];

    const action: VB6Action = { type: 'CLEAR_SELECTION' };
    const newState = vb6Reducer(initialState, action);

    expect(newState.selectedControls).toHaveLength(0);
  });

  it('should handle clipboard operations', () => {
    const controls = [createTestControl('ctrl1'), createTestControl('ctrl2')];
    controls.forEach(ctrl => initialState.controls.set(ctrl.id, ctrl));

    // Copy controls
    const copyAction: VB6Action = { type: 'COPY_CONTROLS', payload: ['ctrl1', 'ctrl2'] };
    let newState = vb6Reducer(initialState, copyAction);

    expect(newState.clipboard).toHaveLength(2);
    expect(newState.controls.has('ctrl1')).toBe(true); // Original still exists

    // Cut controls
    const cutAction: VB6Action = { type: 'CUT_CONTROLS', payload: ['ctrl1'] };
    newState = vb6Reducer(newState, cutAction);

    expect(newState.clipboard).toHaveLength(1);
    expect(newState.controls.has('ctrl1')).toBe(false); // Original removed
  });

  it('should handle PASTE_CONTROLS action', () => {
    const clipboardControl = createTestControl('clipboard1');
    initialState.clipboard = [clipboardControl];

    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };
    initialState.currentForm = form;
    initialState.forms = [form];

    const action: VB6Action = { type: 'PASTE_CONTROLS', payload: { x: 200, y: 150 } };
    const newState = vb6Reducer(initialState, action);

    const pastedControls = Array.from(newState.controls.values())
      .filter(c => c.left === 200 && c.top === 150);

    expect(pastedControls).toHaveLength(1);
    expect(pastedControls[0].type).toBe('TextBox');
    expect(pastedControls[0].id).not.toBe('clipboard1'); // New ID generated
  });

  it('should handle drag state management', () => {
    const control = createTestControl('ctrl1');

    // Start drag
    let action: VB6Action = { type: 'START_DRAG', payload: control };
    let newState = vb6Reducer(initialState, action);

    expect(newState.isDragging).toBe(true);
    expect(newState.draggedControl).toEqual(control);

    // End drag
    action = { type: 'END_DRAG' };
    newState = vb6Reducer(newState, action);

    expect(newState.isDragging).toBe(false);
    expect(newState.draggedControl).toBeNull();
  });

  it('should handle UI state changes', () => {
    // Zoom
    let action: VB6Action = { type: 'SET_ZOOM', payload: 150 };
    let newState = vb6Reducer(initialState, action);
    expect(newState.zoom).toBe(150);

    // Grid size
    action = { type: 'SET_GRID_SIZE', payload: 16 };
    newState = vb6Reducer(newState, action);
    expect(newState.gridSize).toBe(16);

    // Toggle snap to grid
    action = { type: 'TOGGLE_SNAP_TO_GRID' };
    newState = vb6Reducer(newState, action);
    expect(newState.snapToGrid).toBe(!initialState.snapToGrid);

    // Toggle grid visibility
    action = { type: 'TOGGLE_GRID' };
    newState = vb6Reducer(newState, action);
    expect(newState.showGrid).toBe(!initialState.showGrid);
  });

  it('should handle project state management', () => {
    const project = { name: 'TestProject', path: '/projects/test', modified: false };

    const action: VB6Action = { type: 'SET_PROJECT', payload: project };
    const newState = vb6Reducer(initialState, action);

    expect(newState.project).toEqual(project);
  });

  it('should handle panel visibility', () => {
    const action: VB6Action = { type: 'TOGGLE_PANEL', payload: 'properties' };
    const newState = vb6Reducer(initialState, action);

    expect(newState.panels.properties).toBe(!initialState.panels.properties);
  });
});

describe('VB6 Context - History Management', () => {
  let initialState: VB6ContextState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  it('should save state to history', () => {
    const action: VB6Action = { type: 'SAVE_TO_HISTORY' };
    const newState = vb6Reducer(initialState, action);

    expect(newState.history).toHaveLength(1);
    expect(newState.historyIndex).toBe(0);
  });

  it('should perform undo operation', () => {
    // Set up history
    const stateWithControl = {
      ...initialState,
      controls: new Map([['ctrl1', createTestControl('ctrl1')]]),
    };

    const stateWithHistory = {
      ...stateWithControl,
      history: [initialState, stateWithControl],
      historyIndex: 1,
    };

    const action: VB6Action = { type: 'UNDO' };
    const newState = vb6Reducer(stateWithHistory, action);

    expect(newState.historyIndex).toBe(0);
    expect(newState.controls.size).toBe(0); // Back to initial state
  });

  it('should perform redo operation', () => {
    const stateWithControl = {
      ...initialState,
      controls: new Map([['ctrl1', createTestControl('ctrl1')]]),
    };

    const stateWithHistory = {
      ...initialState,
      history: [initialState, stateWithControl],
      historyIndex: 0,
    };

    const action: VB6Action = { type: 'REDO' };
    const newState = vb6Reducer(stateWithHistory, action);

    expect(newState.historyIndex).toBe(1);
    expect(newState.controls.size).toBe(1); // Forward to state with control
  });

  it('should handle history limits', () => {
    let state = initialState;

    // Add multiple history entries
    for (let i = 0; i < 12; i++) {
      state = vb6Reducer(state, { type: 'SAVE_TO_HISTORY' });
    }

    // Should maintain maximum history size
    expect(state.history.length).toBeLessThanOrEqual(10);
  });
});

describe('VB6 Context - Provider Integration', () => {
  let TestComponent: React.FC;
  let contextValue: VB6ContextValue | null = null;

  beforeEach(() => {
    TestComponent = () => {
      contextValue = useContext(VB6Context);
      return <div data-testid="test-component">Test Component</div>;
    };
  });

  afterEach(() => {
    contextValue = null;
  });

  it('should provide context value to children', () => {
    const VB6Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
      const [state, dispatch] = React.useReducer(vb6Reducer, createInitialState());
      
      const value: VB6ContextValue = React.useMemo(() => ({
        state,
        dispatch,
        selectedControlsData: getSelectedControls(state),
        canUndo: state.historyIndex > 0,
        canRedo: state.historyIndex < state.history.length - 1,
        hasUnsavedChanges: state.project?.modified || false,
        getControlById: (id: string) => state.controls.get(id),
        getFormById: (id: string) => state.forms.find(f => f.id === id),
        generateControlName: (type: string) => generateControlName(state, type),
        isControlSelected: (id: string) => state.selectedControls.includes(id),
      }), [state]);

      return (
        <VB6Context.Provider value={value}>
          {children}
        </VB6Context.Provider>
      );
    };

    render(
      <VB6Provider>
        <TestComponent />
      </VB6Provider>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(contextValue).not.toBeNull();
    expect(contextValue?.state).toBeDefined();
    expect(contextValue?.dispatch).toBeInstanceOf(Function);
  });

  it('should update context when actions are dispatched', () => {
    const VB6Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
      const [state, dispatch] = React.useReducer(vb6Reducer, createInitialState());
      
      const value: VB6ContextValue = React.useMemo(() => ({
        state,
        dispatch,
        selectedControlsData: getSelectedControls(state),
        canUndo: state.historyIndex > 0,
        canRedo: state.historyIndex < state.history.length - 1,
        hasUnsavedChanges: state.project?.modified || false,
        getControlById: (id: string) => state.controls.get(id),
        getFormById: (id: string) => state.forms.find(f => f.id === id),
        generateControlName: (type: string) => generateControlName(state, type),
        isControlSelected: (id: string) => state.selectedControls.includes(id),
      }), [state]);

      return (
        <VB6Context.Provider value={value}>
          {children}
        </VB6Context.Provider>
      );
    };

    const TestControlComponent: React.FC = () => {
      const context = useContext(VB6Context);
      
      const addControl = () => {
        if (context) {
          context.dispatch({
            type: 'ADD_CONTROL',
            payload: createTestControl('test-ctrl'),
          });
        }
      };

      return (
        <div>
          <button onClick={addControl} data-testid="add-control">
            Add Control
          </button>
          <div data-testid="control-count">
            {context?.state.controls.size || 0}
          </div>
        </div>
      );
    };

    render(
      <VB6Provider>
        <TestControlComponent />
      </VB6Provider>
    );

    expect(screen.getByTestId('control-count')).toHaveTextContent('0');

    fireEvent.click(screen.getByTestId('add-control'));

    expect(screen.getByTestId('control-count')).toHaveTextContent('1');
  });

  it('should provide computed values correctly', () => {
    const VB6Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
      const [state, dispatch] = React.useReducer(vb6Reducer, () => {
        const initialState = createInitialState();
        initialState.controls.set('ctrl1', createTestControl('ctrl1'));
        initialState.controls.set('ctrl2', createTestControl('ctrl2'));
        initialState.selectedControls = ['ctrl1'];
        return initialState;
      });
      
      const value: VB6ContextValue = React.useMemo(() => ({
        state,
        dispatch,
        selectedControlsData: getSelectedControls(state),
        canUndo: state.historyIndex > 0,
        canRedo: state.historyIndex < state.history.length - 1,
        hasUnsavedChanges: state.project?.modified || false,
        getControlById: (id: string) => state.controls.get(id),
        getFormById: (id: string) => state.forms.find(f => f.id === id),
        generateControlName: (type: string) => generateControlName(state, type),
        isControlSelected: (id: string) => state.selectedControls.includes(id),
      }), [state]);

      return (
        <VB6Context.Provider value={value}>
          {children}
        </VB6Context.Provider>
      );
    };

    const TestComputedComponent: React.FC = () => {
      const context = useContext(VB6Context);
      
      return (
        <div>
          <div data-testid="selected-count">
            {context?.selectedControlsData.length || 0}
          </div>
          <div data-testid="ctrl1-selected">
            {context?.isControlSelected('ctrl1') ? 'true' : 'false'}
          </div>
          <div data-testid="ctrl2-selected">
            {context?.isControlSelected('ctrl2') ? 'true' : 'false'}
          </div>
        </div>
      );
    };

    render(
      <VB6Provider>
        <TestComputedComponent />
      </VB6Provider>
    );

    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('ctrl1-selected')).toHaveTextContent('true');
    expect(screen.getByTestId('ctrl2-selected')).toHaveTextContent('false');
  });

  it('should handle context without provider', () => {
    const TestComponentWithoutProvider: React.FC = () => {
      const context = useContext(VB6Context);
      return (
        <div data-testid="no-provider">
          {context ? 'Has Context' : 'No Context'}
        </div>
      );
    };

    render(<TestComponentWithoutProvider />);

    expect(screen.getByTestId('no-provider')).toHaveTextContent('No Context');
  });
});

describe('VB6 Context - Error Handling', () => {
  let initialState: VB6ContextState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  it('should handle SET_ERROR action', () => {
    const errorMessage = 'Test error occurred';
    const action: VB6Action = { type: 'SET_ERROR', payload: errorMessage };
    const newState = vb6Reducer(initialState, action);

    expect(newState.error).toBe(errorMessage);
  });

  it('should clear error when set to null', () => {
    initialState.error = 'Previous error';

    const action: VB6Action = { type: 'SET_ERROR', payload: null };
    const newState = vb6Reducer(initialState, action);

    expect(newState.error).toBeNull();
  });

  it('should handle SET_LOADING action', () => {
    const action: VB6Action = { type: 'SET_LOADING', payload: true };
    const newState = vb6Reducer(initialState, action);

    expect(newState.isLoading).toBe(true);
  });

  it('should handle RESET_STATE action', () => {
    // Modify state
    const modifiedState: VB6ContextState = {
      ...initialState,
      zoom: 200,
      controls: new Map([['ctrl1', createTestControl('ctrl1')]]),
      selectedControls: ['ctrl1'],
      error: 'Some error',
    };

    const action: VB6Action = { type: 'RESET_STATE' };
    const newState = vb6Reducer(modifiedState, action);

    expect(newState.zoom).toBe(100); // Reset to default
    expect(newState.controls.size).toBe(0);
    expect(newState.selectedControls).toHaveLength(0);
    expect(newState.error).toBeNull();
  });

  it('should handle unknown action gracefully', () => {
    const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
    const newState = vb6Reducer(initialState, unknownAction);

    expect(newState).toEqual(initialState); // State unchanged
  });
});

describe('VB6 Context - Complex State Transitions', () => {
  let initialState: VB6ContextState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  it('should handle complex form and control operations', () => {
    let state = initialState;

    // Add form
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    state = vb6Reducer(state, { type: 'ADD_FORM', payload: form });

    // Add multiple controls
    const controls = [
      createTestControl('ctrl1'),
      createTestControl('ctrl2'),
      createTestControl('ctrl3'),
    ];

    controls.forEach(control => {
      state = vb6Reducer(state, { type: 'ADD_CONTROL', payload: control });
    });

    expect(state.controls.size).toBe(3);
    expect(state.currentForm?.controls).toHaveLength(3);

    // Select multiple controls
    state = vb6Reducer(state, { 
      type: 'SELECT_CONTROLS', 
      payload: ['ctrl1', 'ctrl3'] 
    });

    expect(state.selectedControls).toEqual(['ctrl1', 'ctrl3']);

    // Copy selected controls
    state = vb6Reducer(state, { 
      type: 'COPY_CONTROLS', 
      payload: ['ctrl1', 'ctrl3'] 
    });

    expect(state.clipboard).toHaveLength(2);

    // Paste controls
    state = vb6Reducer(state, { 
      type: 'PASTE_CONTROLS', 
      payload: { x: 300, y: 200 } 
    });

    expect(state.controls.size).toBe(5); // Original 3 + pasted 2
  });

  it('should handle parent-child control relationships', () => {
    let state = initialState;

    // Add form
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    state = vb6Reducer(state, { type: 'ADD_FORM', payload: form });

    // Add parent control (Frame)
    const frameControl: VB6Control = {
      ...createTestControl('frame1'),
      type: 'Frame',
      children: [],
    };

    state = vb6Reducer(state, { type: 'ADD_CONTROL', payload: frameControl });

    // Add child control
    const textBoxControl: VB6Control = {
      ...createTestControl('text1'),
      parent: 'frame1',
    };

    state = vb6Reducer(state, { type: 'ADD_CONTROL', payload: textBoxControl });

    // Update parent to include child
    state = vb6Reducer(state, {
      type: 'UPDATE_CONTROL',
      payload: {
        id: 'frame1',
        updates: { children: ['text1'] },
      },
    });

    const frame = state.controls.get('frame1');
    const textBox = state.controls.get('text1');

    expect(frame?.children).toContain('text1');
    expect(textBox?.parent).toBe('frame1');

    // Delete parent should affect child
    state = vb6Reducer(state, { type: 'DELETE_CONTROL', payload: 'frame1' });

    expect(state.controls.has('frame1')).toBe(false);
    // In a real implementation, orphaned children might be handled
  });

  it('should maintain consistency during bulk operations', () => {
    let state = initialState;

    // Set up form and controls
    const form: VB6Form = {
      id: 'form1',
      name: 'Form1',
      caption: 'Test Form',
      width: 4800,
      height: 3600,
      controls: [],
      properties: {},
    };

    state = vb6Reducer(state, { type: 'ADD_FORM', payload: form });

    // Perform multiple operations in sequence
    const operations: VB6Action[] = [
      { type: 'ADD_CONTROL', payload: createTestControl('ctrl1') },
      { type: 'ADD_CONTROL', payload: createTestControl('ctrl2') },
      { type: 'SELECT_CONTROLS', payload: ['ctrl1', 'ctrl2'] },
      { type: 'UPDATE_CONTROL', payload: { id: 'ctrl1', updates: { left: 200 } } },
      { type: 'COPY_CONTROLS', payload: ['ctrl1', 'ctrl2'] },
      { type: 'PASTE_CONTROLS', payload: { x: 400, y: 300 } },
    ];

    operations.forEach(action => {
      state = vb6Reducer(state, action);
    });

    // Verify final state consistency
    expect(state.controls.size).toBe(4); // 2 original + 2 pasted
    expect(state.currentForm?.controls).toHaveLength(4);
    expect(state.clipboard).toHaveLength(2);
    expect(state.selectedControls).toHaveLength(2); // From paste operation

    // Verify control positions
    const pastedControls = Array.from(state.controls.values())
      .filter(c => c.left === 400 && c.top === 300);
    
    expect(pastedControls).toHaveLength(1); // First pasted control
  });
});

// Helper functions
function createInitialState(): VB6ContextState {
  return {
    currentForm: null,
    forms: [],
    controls: new Map(),
    selectedControls: [],
    clipboard: [],
    isDragging: false,
    draggedControl: null,
    zoom: 100,
    gridSize: 8,
    snapToGrid: true,
    showGrid: true,
    project: null,
    activeTab: null,
    panels: {
      toolbox: true,
      properties: true,
      projectExplorer: true,
      codeEditor: false,
    },
    history: [],
    historyIndex: -1,
    isLoading: false,
    error: null,
  };
}

function createTestControl(id: string): VB6Control {
  return {
    id,
    type: 'TextBox',
    name: `Text${id.slice(-1)}`,
    left: 100,
    top: 50,
    width: 120,
    height: 25,
    properties: {
      Text: '',
      Font: 'MS Sans Serif, 8pt',
      BackColor: 0x80000005,
      ForeColor: 0x80000008,
    },
    zIndex: 1,
    visible: true,
    enabled: true,
  };
}

function vb6Reducer(state: VB6ContextState, action: VB6Action): VB6ContextState {
  switch (action.type) {
    case 'SET_CURRENT_FORM':
      return { ...state, currentForm: action.payload };

    case 'ADD_FORM':
      return {
        ...state,
        forms: [...state.forms, action.payload],
        currentForm: action.payload,
      };

    case 'UPDATE_FORM': {
      const updatedForms = state.forms.map(form =>
        form.id === action.payload.id
          ? { ...form, ...action.payload.updates }
          : form
      );

      return {
        ...state,
        forms: updatedForms,
        currentForm: state.currentForm?.id === action.payload.id
          ? { ...state.currentForm, ...action.payload.updates }
          : state.currentForm,
      };
    }

    case 'DELETE_FORM': {
      const formToDelete = state.forms.find(f => f.id === action.payload);
      const updatedForms = state.forms.filter(f => f.id !== action.payload);
      
      // Delete associated controls
      const newControls = new Map(state.controls);
      if (formToDelete) {
        formToDelete.controls.forEach(ctrlId => {
          newControls.delete(ctrlId);
        });
      }

      return {
        ...state,
        forms: updatedForms,
        controls: newControls,
        currentForm: state.currentForm?.id === action.payload ? null : state.currentForm,
      };
    }

    case 'ADD_CONTROL': {
      const newControls = new Map(state.controls);
      newControls.set(action.payload.id, action.payload);

      const updatedForms = state.forms.map(form =>
        form.id === state.currentForm?.id
          ? { ...form, controls: [...form.controls, action.payload.id] }
          : form
      );

      return {
        ...state,
        controls: newControls,
        forms: updatedForms,
        currentForm: state.currentForm
          ? { ...state.currentForm, controls: [...state.currentForm.controls, action.payload.id] }
          : state.currentForm,
      };
    }

    case 'UPDATE_CONTROL': {
      const newControls = new Map(state.controls);
      const existingControl = newControls.get(action.payload.id);
      
      if (existingControl) {
        newControls.set(action.payload.id, {
          ...existingControl,
          ...action.payload.updates,
        });
      }

      return { ...state, controls: newControls };
    }

    case 'DELETE_CONTROL': {
      const newControls = new Map(state.controls);
      newControls.delete(action.payload);

      const updatedForms = state.forms.map(form => ({
        ...form,
        controls: form.controls.filter(id => id !== action.payload),
      }));

      return {
        ...state,
        controls: newControls,
        forms: updatedForms,
        currentForm: state.currentForm
          ? {
              ...state.currentForm,
              controls: state.currentForm.controls.filter(id => id !== action.payload),
            }
          : state.currentForm,
        selectedControls: state.selectedControls.filter(id => id !== action.payload),
      };
    }

    case 'SELECT_CONTROLS':
      return { ...state, selectedControls: [...action.payload] };

    case 'CLEAR_SELECTION':
      return { ...state, selectedControls: [] };

    case 'COPY_CONTROLS': {
      const controlsToCopy = action.payload
        .map(id => state.controls.get(id))
        .filter(Boolean) as VB6Control[];

      return { ...state, clipboard: [...controlsToCopy] };
    }

    case 'CUT_CONTROLS': {
      const controlsToCopy = action.payload
        .map(id => state.controls.get(id))
        .filter(Boolean) as VB6Control[];

      const newControls = new Map(state.controls);
      action.payload.forEach(id => newControls.delete(id));

      return {
        ...state,
        controls: newControls,
        clipboard: [...controlsToCopy],
        selectedControls: [],
      };
    }

    case 'PASTE_CONTROLS': {
      if (state.clipboard.length === 0) return state;

      const newControls = new Map(state.controls);
      const pastedIds: string[] = [];

      state.clipboard.forEach((clipboardControl, index) => {
        const newId = `pasted_${Date.now()}_${index}`;
        const newControl: VB6Control = {
          ...clipboardControl,
          id: newId,
          left: action.payload.x + (index * 20),
          top: action.payload.y + (index * 20),
        };
        
        newControls.set(newId, newControl);
        pastedIds.push(newId);
      });

      const updatedForms = state.forms.map(form =>
        form.id === state.currentForm?.id
          ? { ...form, controls: [...form.controls, ...pastedIds] }
          : form
      );

      return {
        ...state,
        controls: newControls,
        forms: updatedForms,
        currentForm: state.currentForm
          ? { ...state.currentForm, controls: [...state.currentForm.controls, ...pastedIds] }
          : state.currentForm,
        selectedControls: pastedIds,
      };
    }

    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        draggedControl: action.payload,
      };

    case 'END_DRAG':
      return {
        ...state,
        isDragging: false,
        draggedControl: null,
      };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: action.payload };

    case 'TOGGLE_SNAP_TO_GRID':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_PROJECT':
      return { ...state, project: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'TOGGLE_PANEL':
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.payload]: !state.panels[action.payload],
        },
      };

    case 'SAVE_TO_HISTORY': {
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), { ...state }];
      
      // Limit history size
      if (newHistory.length > 10) {
        newHistory.shift();
      }

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'UNDO':
      if (state.historyIndex > 0) {
        const previousState = state.history[state.historyIndex - 1];
        return {
          ...previousState,
          historyIndex: state.historyIndex - 1,
          history: state.history, // Preserve history
        };
      }
      return state;

    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        return {
          ...nextState,
          historyIndex: state.historyIndex + 1,
          history: state.history, // Preserve history
        };
      }
      return state;

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET_STATE':
      return createInitialState();

    default:
      return state;
  }
}

function getSelectedControls(state: VB6ContextState): VB6Control[] {
  return state.selectedControls
    .map(id => state.controls.get(id))
    .filter(Boolean) as VB6Control[];
}

function generateControlName(state: VB6ContextState, type: string): string {
  const existingNames = Array.from(state.controls.values())
    .filter(c => c.type === type)
    .map(c => c.name);

  const baseName = type.replace(/([A-Z])/g, '$1').trim();
  let counter = 1;
  let name = `${baseName}${counter}`;

  while (existingNames.includes(name)) {
    counter++;
    name = `${baseName}${counter}`;
  }

  return name;
}