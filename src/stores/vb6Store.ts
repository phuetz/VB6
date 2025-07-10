import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Control, VB6State } from '../context/types';
import { getDefaultProperties } from '../utils/controlDefaults';

interface VB6Store extends VB6State {
  // Actions
  createControl: (type: string, x?: number, y?: number) => void;
  updateControl: (controlId: number, property: string, value: any) => void;
  deleteControls: (controlIds: number[]) => void;
  selectControls: (controlIds: number[]) => void;
  copyControls: () => void;
  pasteControls: () => void;
  setExecutionMode: (mode: 'design' | 'run' | 'break') => void;
  toggleWindow: (windowName: string) => void;
  setSelectedEvent: (eventName: string) => void;
  updateEventCode: (eventKey: string, code: string) => void;
  setDragState: (payload: { isDragging: boolean; controlType?: string; position?: { x: number; y: number } }) => void;
  updateFormProperty: (property: string, value: any) => void;
  addConsoleOutput: (message: string) => void;
  clearConsole: () => void;
  setImmediateCommand: (command: string) => void;
  showDialog: (dialogName: string, show: boolean) => void;
  undo: () => void;
  redo: () => void;
}

export const useVB6Store = create<VB6Store>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    projectName: 'Project1',
    forms: [{ id: 1, name: 'Form1', caption: 'Form1', controls: [] }],
    activeFormId: 1,
    modules: [],
    classModules: [],
    userControls: [],
    references: [
      { name: 'Visual Basic For Applications', location: 'VBA6.DLL', checked: true, builtin: true },
      { name: 'Visual Basic runtime objects and procedures', location: 'MSVBVM60.DLL', checked: true, builtin: true },
      { name: 'Visual Basic objects and procedures', location: 'VB6.OLB', checked: true, builtin: true },
      { name: 'OLE Automation', location: 'stdole2.tlb', checked: true, builtin: true }
    ],
    components: [],

    // Controls
    controls: [],
    selectedControls: [],
    nextId: 1,
    clipboard: [],

    // UI State
    executionMode: 'design',
    showCodeEditor: false,
    showGrid: true,
    gridSize: 8,
    showAlignmentGuides: true,
    alignmentGuides: { x: [], y: [] },

    // Windows visibility
    showProjectExplorer: true,
    showPropertiesWindow: true,
    showToolbox: true,
    showImmediateWindow: false,
    showFormLayout: false,
    showObjectBrowser: false,
    showWatchWindow: false,
    showLocalsWindow: false,
    showCallStack: false,
    showErrorList: false,
    showCodeAnalyzer: false,
    showRefactorTools: false,
    showBreakpointManager: false,
    showPerformanceMonitor: false,

    // Dialogs
    showMenuEditor: false,
    showNewProjectDialog: false,
    showReferences: false,
    showComponents: false,
    showTabOrder: false,
    showObjectBrowser: false,
    showUserControlDesigner: false,

    // Code Editor
    selectedEvent: 'Click',
    eventCode: {},
    intellisenseVisible: false,
    intellisensePosition: { x: 0, y: 0 },
    intellisenseSuggestions: [],

    // Form Properties
    formProperties: {
      Caption: 'Form1',
      BackColor: '#8080FF',
      Width: 640,
      Height: 480,
      StartUpPosition: '2 - CenterScreen',
      BorderStyle: '2 - Sizable',
      MaxButton: true,
      MinButton: true,
      ControlBox: true,
      ShowInTaskbar: true
    },

    // Debug
    consoleOutput: [
      'Microsoft Visual Basic 6.0 Clone',
      'Copyright (c) 2024 - Web Edition',
      '================================',
      '',
      'Ready.',
      ''
    ],
    immediateCommand: '',
    breakpoints: {},
    watchExpressions: [],
    localVariables: {},
    callStack: [],
    errorList: [],
    breakpoints: [],
    intellisenseItems: [],
    codeAnalysisResults: {
      issues: [],
      metrics: {
        linesOfCode: 0,
        complexity: 0,
        maintainability: 0,
        unusedVariables: 0,
        qualityScore: 0
      }
    },

    // History
    history: [],
    historyIndex: -1,

    // Drag & Drop
    draggedControlType: null,
    isDragging: false,
    dragPosition: { x: 0, y: 0 },
    snapToGrid: true,

    // Selection
    isSelecting: false,
    selectionBox: { x: 0, y: 0, width: 0, height: 0 },
    selectionStart: { x: 0, y: 0 },

    // Resize
    isResizing: false,
    resizeHandle: null,
    resizeStart: { x: 0, y: 0, width: 0, height: 0 },

    // Move
    isMoving: false,
    moveStart: { x: 0, y: 0 },

    // Toolbox
    selectedToolboxTab: 'General',

    // Actions
    createControl: (type: string, x = 50, y = 50) => {
      const state = get();
      const newControl = {
        ...getDefaultProperties(type, state.nextId),
        x,
        y
      };
      
      set({
        controls: [...state.controls, newControl],
        selectedControls: [newControl],
        nextId: state.nextId + 1
      });
    },

    updateControl: (controlId: number, property: string, value: any) => {
      const state = get();
      const updatedControls = state.controls.map(control =>
        control.id === controlId ? { ...control, [property]: value } : control
      );
      
      const updatedSelectedControls = state.selectedControls.map(control =>
        control.id === controlId ? { ...control, [property]: value } : control
      );

      set({
        controls: updatedControls,
        selectedControls: updatedSelectedControls
      });
    },

    deleteControls: (controlIds: number[]) => {
      const state = get();
      set({
        controls: state.controls.filter(control => !controlIds.includes(control.id)),
        selectedControls: []
      });
    },

    selectControls: (controlIds: number[]) => {
      const state = get();
      const selectedControls = state.controls.filter(control => controlIds.includes(control.id));
      set({ selectedControls });
    },

    copyControls: () => {
      const state = get();
      set({ clipboard: [...state.selectedControls] });
    },

    pasteControls: () => {
      const state = get();
      if (state.clipboard.length === 0) return;

      const newControls = state.clipboard.map((control, index) => ({
        ...control,
        id: state.nextId + index,
        name: `${control.type}${state.nextId + index}`,
        x: control.x + 20,
        y: control.y + 20
      }));

      set({
        controls: [...state.controls, ...newControls],
        selectedControls: newControls,
        nextId: state.nextId + state.clipboard.length
      });
    },

    setExecutionMode: (mode: 'design' | 'run' | 'break') => {
      set({ executionMode: mode });
    },

    toggleWindow: (windowName: string) => {
      const state = get();
      set({ [windowName]: !state[windowName as keyof VB6State] });
    },

    setSelectedEvent: (eventName: string) => {
      set({ selectedEvent: eventName });
    },

    updateEventCode: (eventKey: string, code: string) => {
      const state = get();
      set({
        eventCode: {
          ...state.eventCode,
          [eventKey]: code
        }
      });
    },

    setDragState: (payload) => {
      const state = get();
      set({
        isDragging: payload.isDragging,
        draggedControlType: payload.controlType !== undefined ? payload.controlType : state.draggedControlType,
        dragPosition: payload.position || state.dragPosition
      });
    },

    updateFormProperty: (property: string, value: any) => {
      const state = get();
      set({
        formProperties: {
          ...state.formProperties,
          [property]: value
        }
      });
    },

    addConsoleOutput: (message: string) => {
      const state = get();
      set({
        consoleOutput: [...state.consoleOutput, message]
      });
    },

    clearConsole: () => {
      set({ consoleOutput: [] });
    },

    setImmediateCommand: (command: string) => {
      set({ immediateCommand: command });
    },

    showDialog: (dialogName: string, show: boolean) => {
      set({ [dialogName]: show });
    },

    undo: () => {
      // Implementation for undo
      console.log('Undo action');
    },

    redo: () => {
      // Implementation for redo
      console.log('Redo action');
    },

    // Code Analysis
    analyzeCode: () => {
      console.log('Analyzing code...');
      // Implementation would analyze the code and update state
    },

    // Refactoring
    applyRefactoring: (type: string, options: any) => {
      console.log(`Applying refactoring ${type} with options:`, options);
      // Implementation would apply the refactoring and update code
    },

    // Breakpoint Management
    addBreakpoint: (breakpoint: any) => {
      const state = get();
      set({
        breakpoints: [...state.breakpoints, breakpoint]
      });
    },

    removeBreakpoint: (id: string) => {
      const state = get();
      set({
        breakpoints: state.breakpoints.filter(bp => bp.id !== id)
      });
    },

    updateBreakpoint: (id: string, updates: any) => {
      const state = get();
      set({
        breakpoints: state.breakpoints.map(bp => 
          bp.id === id ? { ...bp, ...updates } : bp
        )
      });
    },

    // Enhanced IntelliSense
    showIntelliSense: (position: { x: number; y: number }, items: any[]) => {
      set({
        intellisenseVisible: true,
        intellisensePosition: position,
        intellisenseItems: items
      });
    }
  }))
);