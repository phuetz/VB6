import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Control, VB6State } from '../context/types';
import { getDefaultProperties } from '../utils/controlDefaults';
import ControlArrayManager from '../utils/controlArrayManager';
import { DebugState } from '../types/extended';
import { authService } from '../services/AuthService';

interface VB6Store extends VB6State {
  // Debug state
  debugState: DebugState;
  
  // Performance metrics state
  performanceMetrics?: {
    renderTime: number;
    memoryUsage: number;
    cpuUsage?: number;
    fps?: number;
  };
  
  // Project state
  isDirty?: boolean;
  lastSaved?: Date | null;
  currentCode?: string;
  selectedControlId?: string;
  history: any[];
  historyIndex: number;
  
  // Actions
  createControl: (type: string, x?: number, y?: number) => void;
  addControl: (control: Control) => void; // For backward compatibility
  updateControl: (controlId: number | string, propertyOrUpdates: string | object, value?: any) => void;
  updateControls: (updatedControls: Control[]) => void;
  updateCode: (code: string) => void;
  insertCode: (code: string, position: number) => void;
  setDebugState: (debugState: DebugState) => void;
  deleteControls: (controlIds: number[]) => void;
  deleteControl: (controlId: number) => void; // Singular version for backward compatibility
  selectControls: (controlIds: number[]) => void;
  selectControl: (controlId: number) => void; // Singular version for backward compatibility
  updatePerformanceMetrics: (metrics: { renderTime: number; memoryUsage: number; cpuUsage?: number; fps?: number }) => void;
  loadProject: (projectData: any) => void;
  copyControl: (controlId: string) => void;
  copyControls: () => void;
  pasteControls: () => void;
  pasteControl: () => void; // Backward compatibility
  duplicateControls: () => void;
  duplicateControl: (controlId: string) => void; // Backward compatibility
  saveProject: () => void;
  newProject: () => void;
  toggleDesignMode: () => void;
  togglePanel: (panelName: string) => void;
  setZoomLevel: (zoom: number) => void;
  resetStore: () => void;
  setExecutionMode: (mode: 'design' | 'run' | 'break') => void;
  toggleWindow: (windowName: string) => void;
  setSelectedEvent: (eventName: string) => void;
  updateEventCode: (eventKey: string, code: string) => void;
  setDragState: (payload: {
    isDragging: boolean;
    controlType?: string;
    position?: { x: number; y: number };
  }) => void;
  updateFormProperty: (property: string, value: any) => void;
  addConsoleOutput: (message: string) => void;
  clearConsole: () => void;
  setImmediateCommand: (command: string) => void;
  showDialog: (dialogName: string, show: boolean) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (controls: Control[], nextId: number) => void;
  showTemplateManager: boolean;
  showOptionsDialog: boolean;
  recordPerformanceMetrics: (metric: any) => void;
  clearPerformanceLogs: () => void;
  // Todo list
  todoItems: { id: string; text: string; completed: boolean }[];
  showTodoList: boolean;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setDesignerZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  // Control Array actions
  createControlArray: (controlId: number) => void;
  addToControlArray: (arrayName: string) => void;
  removeFromControlArray: (controlId: number) => void;
  showControlArrayDialog: boolean;
  showMemoryProfiler: boolean;
  showTestRunner: boolean;
}

export const useVB6Store = create<VB6Store>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    projectName: 'VB6 Project',
    forms: [{ id: 1, name: 'Form1', caption: 'Form1', controls: [] }],
    activeFormId: 1,
    modules: [],
    classModules: [],
    userControls: [],
    references: [
      { name: 'Visual Basic For Applications', location: 'VBA6.DLL', checked: true, builtin: true },
      {
        name: 'Visual Basic runtime objects and procedures',
        location: 'MSVBVM60.DLL',
        checked: true,
        builtin: true,
      },
      {
        name: 'Visual Basic objects and procedures',
        location: 'VB6.OLB',
        checked: true,
        builtin: true,
      },
      { name: 'OLE Automation', location: 'stdole2.tlb', checked: true, builtin: true },
    ],
    components: [],

    // Controls
    controls: [],
    selectedControls: [],
    nextId: 1,
    clipboard: [],

    // UI State
    executionMode: 'design',
    isDesignMode: true,
    showToolbox: true,
    showProperties: true,
    showProjectExplorer: true,
    showImmediateWindow: false,
    canvasSize: { width: 800, height: 600 },
    zoomLevel: 1,
    
    // Debug state
    debugState: {
      mode: 'design',
      currentLine: 0,
      currentFile: '',
      variables: {},
      callStack: [],
      breakpoints: new Set<string>(),
      watchExpressions: []
    } as DebugState,
    
    // Performance metrics
    performanceMetrics: {
      renderTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      fps: 60,
    },
    
    // Project state
    isDirty: false,
    lastSaved: null,
    currentCode: '',
    selectedControlId: null,
    showCodeEditor: false,
    showGrid: true,
    gridSize: 8,
    snapToGrid: true,
    showAlignmentGuides: true,
    alignmentGuides: { x: [], y: [] },
    designerZoom: 100,
    clipboardData: null,

    // Windows visibility - OPTIMIZED STARTUP (reduced clutter)
    showPropertiesWindow: false,
    showControlTree: false,
    showFormLayout: false,
    showObjectBrowser: false,
    showWatchWindow: false,
    showLocalsWindow: false,
    showCallStack: false,
    showErrorList: false,
    showCommandPalette: false,
    showExportDialog: false,
    showTemplateManager: false,
    showSnippetManager: false,
    showCodeFormatter: false,
    showCodeConverter: false,
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
    showUserControlDesigner: false,
    showOptionsDialog: false,

    // Code Editor
    selectedEvent: 'Click',
    eventCode: {},
    intellisenseVisible: false,
    intellisensePosition: { x: 0, y: 0 },
    intellisenseSuggestions: [],

    // Snippets
    snippets: [
      {
        id: '1',
        title: 'Error Handler',
        description: 'Basic error handling template',
        code: `On Error GoTo ErrorHandler

'Your code here

Exit Sub

ErrorHandler:
MsgBox "Error " & Err.Number & ": " & Err.Description
Resume Next`,
        language: 'vb',
        category: 'Error Handling',
        tags: ['error', 'handler', 'exception'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorite: true,
        usageCount: 0,
      },
      {
        id: '2',
        title: 'Database Connection',
        description: 'Create an ADO database connection',
        code: `Dim conn As ADODB.Connection
Set conn = New ADODB.Connection

conn.ConnectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\\Path\\Database.mdb;"
conn.Open

'Use connection here

conn.Close
Set conn = Nothing`,
        language: 'vb',
        category: 'Database',
        tags: ['ado', 'connection', 'database'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorite: false,
        usageCount: 0,
      },
      {
        id: '3',
        title: 'File Open Dialog',
        description: 'Show file open dialog and get selected file',
        code: `Dim fileName As String

With CommonDialog1
  .Filter = "All Files (*.*)|*.*|Text Files (*.txt)|*.txt"
  .FilterIndex = 1
  .ShowOpen
  
  If Len(.FileName) > 0 Then
    fileName = .FileName
    'Process the file here
  End If
End With`,
        language: 'vb',
        category: 'Dialogs',
        tags: ['file', 'open', 'dialog'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorite: true,
        usageCount: 0,
      },
      {
        id: '4',
        title: 'Input Validation',
        description: 'Common input validation functions',
        code: `Function IsNumeric(text As String) As Boolean
  On Error GoTo ErrorHandler
  Dim n As Double
  n = Val(text)
  IsNumeric = True
  Exit Function
  
ErrorHandler:
  IsNumeric = False
End Function

Function IsValidEmail(email As String) As Boolean
  Dim regex As Object
  Set regex = CreateObject("VBScript.RegExp")
  regex.Pattern = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
  IsValidEmail = regex.Test(email)
End Function`,
        language: 'vb',
        category: 'Validation',
        tags: ['validate', 'input', 'check'],
        createdAt: new Date(),
        updatedAt: new Date(),
        favorite: false,
        usageCount: 0,
      },
    ],

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
      ShowInTaskbar: true,
    },

    // Debug
    consoleOutput: [
      'Microsoft Visual Basic 6.0 Clone',
      'Copyright (c) 2024 - Web Edition',
      '================================',
      '',
      'Ready.',
      '',
      '💡 Tip: Use View menu or F4 to show panels',
      '',
    ],
    immediateCommand: '',
    watchExpressions: [],
    localVariables: {},
    callStack: [],
    breakpoints: [],
    errorList: [],
    intellisenseItems: [],
    codeAnalysisResults: {
      issues: [],
      metrics: {
        linesOfCode: 0,
        complexity: 0,
        maintainability: 0,
        unusedVariables: 0,
        qualityScore: 0,
      },
    },

    // History
    history: [],
    historyIndex: -1,

    // Drag & Drop
    draggedControlType: null,
    isDragging: false,
    dragPosition: { x: 0, y: 0 },

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

    // Logging
    logs: [],
    performanceLogs: [],
    showLogPanel: false,
    // Todo list
    todoItems: [],
    showTodoList: false,
    showControlArrayDialog: false,
    // Git integration
    showGitPanel: false,
    // Memory profiler
    showMemoryProfiler: false,
    // Test runner
    showTestRunner: false,

    // History helper
    pushHistory: (controls: Control[], nextId: number) => {
      const state = get();
      
      // Limit history size to prevent memory issues
      const MAX_HISTORY_SIZE = 50;
      
      // Only push to history if there are actual changes
      const lastSnapshot = state.history[state.historyIndex];
      if (lastSnapshot && 
          lastSnapshot.controls.length === controls.length &&
          lastSnapshot.nextId === nextId) {
        // Quick check if anything changed
        const hasChanges = controls.some((c, i) => {
          const prev = lastSnapshot.controls[i];
          return !prev || prev.id !== c.id || prev.x !== c.x || prev.y !== c.y;
        });
        if (!hasChanges) return;
      }
      
      const snapshot = {
        controls: controls.map(c => ({ ...c })),
        nextId,
      };
      
      let newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(snapshot);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory = newHistory.slice(-MAX_HISTORY_SIZE);
      }
      
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },

    // Actions
    createControl: (type: string, x = 50, y = 50) => {
      const state = get();
      
      // BUSINESS LOGIC BYPASS BUG FIX: Enforce control limits based on subscription
      const MAX_CONTROLS_FREE = 50;
      const MAX_CONTROLS_PRO = 500;
      const MAX_CONTROLS_ENTERPRISE = 5000;
      
      // Get user's control limit based on subscription
      let maxControls = MAX_CONTROLS_FREE;
      if (authService.getState().user?.subscription?.plan === 'pro') {
        maxControls = MAX_CONTROLS_PRO;
      } else if (authService.getState().user?.subscription?.plan === 'enterprise') {
        maxControls = MAX_CONTROLS_ENTERPRISE;
      }
      
      // Check control limit
      if (state.controls.length >= maxControls) {
        state.addLog(
          'error',
          'ControlCreation',
          `Control limit reached (${maxControls} controls). Upgrade your subscription for more controls.`
        );
        return;
      }
      
      // BUSINESS LOGIC BYPASS BUG FIX: Validate control type to prevent privilege escalation
      const allowedControlTypes = [
        'TextBox', 'Label', 'CommandButton', 'CheckBox', 'RadioButton',
        'ComboBox', 'ListBox', 'PictureBox', 'Frame', 'Timer',
        'ScrollBar', 'Shape', 'Line', 'Image', 'FileListBox',
        'DirListBox', 'DriveListBox', 'DataControl', 'OLE'
      ];
      
      // Premium controls require subscription
      const premiumControls = ['DataGrid', 'MSFlexGrid', 'MSChart', 'CrystalReportViewer'];
      const enterpriseControls = ['WebBrowser', 'WinsockControl', 'RemoteDataControl'];
      
      if (!allowedControlTypes.includes(type) && 
          !premiumControls.includes(type) && 
          !enterpriseControls.includes(type)) {
        state.addLog('error', 'ControlCreation', `Invalid control type: ${type}`);
        return;
      }
      
      // Check premium control access
      if (premiumControls.includes(type)) {
        const userPlan = authService.getState().user?.subscription?.plan || 'free';
        if (userPlan === 'free') {
          state.addLog('error', 'ControlCreation', `Premium control ${type} requires Pro subscription`);
          return;
        }
      }
      
      if (enterpriseControls.includes(type)) {
        const userPlan = authService.getState().user?.subscription?.plan || 'free';
        if (userPlan !== 'enterprise') {
          state.addLog('error', 'ControlCreation', `Enterprise control ${type} requires Enterprise subscription`);
          return;
        }
      }
      
      const log = state.addLog(
        'debug',
        'ControlCreation',
        `Creating control: ${type} at (${x}, ${y})`
      );

      const newControl = {
        ...getDefaultProperties(type, state.nextId),
        x,
        y,
      };

      set({
        controls: [...state.controls, newControl],
        selectedControls: [newControl],
        nextId: state.nextId + 1,
      });
      state.pushHistory([...state.controls, newControl], state.nextId + 1);

      state.addLog(
        'info',
        'ControlCreation',
        `Created control: ${newControl.name} (${type})`,
        newControl
      );
    },

    updateControl: (controlId: number | string, propertyOrUpdates: string | object, value?: any) => {
      const state = get();

      // Find control by ID (support both string and number IDs)
      const controlIndex = state.controls.findIndex(c => 
        c.id === controlId || c.id.toString() === controlId.toString() || c.name === controlId
      );
      if (controlIndex === -1) return;
      
      const control = state.controls[controlIndex];
      const updatedControl = { ...control };

      // Support both formats: updateControl(id, property, value) and updateControl(id, updates)
      if (typeof propertyOrUpdates === 'string') {
        // Format: updateControl(id, 'property', value)
        updatedControl[propertyOrUpdates] = value;
      } else if (typeof propertyOrUpdates === 'object' && propertyOrUpdates !== null) {
        // Format: updateControl(id, { properties: {...}, left: 10, ... })
        Object.assign(updatedControl, propertyOrUpdates);
      }

      const updatedControls = [...state.controls];
      updatedControls[controlIndex] = updatedControl;

      // Update selectedControls if the control is selected
      let updatedSelectedControls = state.selectedControls;
      const selectedIndex = state.selectedControls.findIndex(c => 
        c.id === controlId || c.id.toString() === controlId.toString() || c.name === controlId
      );
      if (selectedIndex !== -1) {
        updatedSelectedControls = [...state.selectedControls];
        updatedSelectedControls[selectedIndex] = updatedControl;
      }

      set({
        controls: updatedControls,
        selectedControls: updatedSelectedControls,
        isDirty: true,
      });
      
      // Push to history for significant changes
      state.pushHistory(updatedControls, state.nextId);
    },

    updateControls: (updatedControls: Control[]) => {
      const state = get();
      
      // Update all controls in the main controls array
      const updatedControlsMap = new Map(updatedControls.map(c => [c.id, c]));
      const newControls = state.controls.map(control => 
        updatedControlsMap.has(control.id) ? updatedControlsMap.get(control.id)! : control
      );
      
      // Update selectedControls if any of them were updated
      const newSelectedControls = state.selectedControls.map(control =>
        updatedControlsMap.has(control.id) ? updatedControlsMap.get(control.id)! : control
      );
      
      set({
        controls: newControls,
        selectedControls: newSelectedControls,
      });
      
      // Add to history for undo/redo
      state.pushHistory(newControls, state.nextId);
      
      state.addLog('info', 'LayoutTools', `Updated ${updatedControls.length} controls`);
    },

    deleteControls: (controlIds: number[]) => {
      const state = get();
      if (controlIds.length === 0) return;
      
      state.addLog('info', 'ControlDeletion', `Deleting controls: ${controlIds.join(', ')}`);

      // Use Set for O(1) lookup
      const idsToDelete = new Set(controlIds);
      const filteredControls = state.controls.filter(control => !idsToDelete.has(control.id));
      
      // STATE CORRUPTION BUG FIX: Only remove deleted controls from selection, preserve others
      const filteredSelectedControls = state.selectedControls.filter(control => !idsToDelete.has(control.id));
      
      set({
        controls: filteredControls,
        selectedControls: filteredSelectedControls,
      });
      state.pushHistory(filteredControls, state.nextId);
    },

    selectControls: (controlIds: number[]) => {
      const state = get();
      
      // Skip if selection hasn't changed
      if (controlIds.length === state.selectedControls.length &&
          controlIds.every(id => state.selectedControls.some(c => c.id === id))) {
        return;
      }
      
      state.addLog('debug', 'ControlSelection', `Selecting controls: ${controlIds.join(', ')}`);

      // Use Set for O(1) lookup
      const selectedIds = new Set(controlIds);
      const selectedControls = state.controls.filter(control => selectedIds.has(control.id));
      set({ selectedControls });
    },

    copyControls: () => {
      const state = get();
      state.addLog(
        'info',
        'Clipboard',
        `Copying ${state.selectedControls.length} controls to clipboard`
      );

      set({ clipboard: [...state.selectedControls] });
    },

    pasteControls: () => {
      const state = get();
      if (state.clipboard.length === 0) return;

      // BUSINESS LOGIC BYPASS BUG FIX: Enforce control limits on paste operations
      const MAX_CONTROLS_FREE = 50;
      const MAX_CONTROLS_PRO = 500;
      const MAX_CONTROLS_ENTERPRISE = 5000;
      
      let maxControls = MAX_CONTROLS_FREE;
      const userPlan = authService.getState().user?.subscription?.plan || 'free';
      if (userPlan === 'pro') {
        maxControls = MAX_CONTROLS_PRO;
      } else if (userPlan === 'enterprise') {
        maxControls = MAX_CONTROLS_ENTERPRISE;
      }
      
      const availableSlots = maxControls - state.controls.length;
      if (availableSlots <= 0) {
        state.addLog(
          'error',
          'Clipboard',
          `Cannot paste: Control limit reached (${maxControls} controls)`
        );
        return;
      }
      
      // Limit paste to available slots
      const controlsToPaste = state.clipboard.slice(0, availableSlots);
      if (controlsToPaste.length < state.clipboard.length) {
        state.addLog(
          'warning',
          'Clipboard',
          `Only pasting ${controlsToPaste.length} of ${state.clipboard.length} controls due to limit`
        );
      }

      state.addLog(
        'info',
        'Clipboard',
        `Pasting ${controlsToPaste.length} controls from clipboard`
      );

      const newControls = controlsToPaste.map((control, index) => ({
        ...control,
        id: state.nextId + index,
        name: `${control.type}${state.nextId + index}`,
        x: control.x + 20,
        y: control.y + 20,
      }));

      const newNextId = state.nextId + controlsToPaste.length;
      const updatedControls = [...state.controls, ...newControls];
      
      set({
        controls: updatedControls,
        selectedControls: newControls,
        nextId: newNextId,
      });
      
      // STATE CORRUPTION BUG FIX: Use consistent nextId value for history
      state.pushHistory(updatedControls, newNextId);
    },

    pasteControl: () => {
      // Backward compatibility - delegate to pasteControls
      const state = get();
      state.pasteControls();
    },

    saveProject: () => {
      const state = get();
      const projectData = {
        projectName: state.projectName,
        forms: state.forms,
        modules: state.modules,
        classModules: state.classModules,
        userControls: state.userControls,
        references: state.references,
        components: state.components,
        controls: state.controls,
        eventCode: state.eventCode,
        formProperties: state.formProperties
      };
      
      // Save to localStorage for now
      try {
        localStorage.setItem('vb6-project', JSON.stringify(projectData));
        set({ isDirty: false, lastSaved: new Date() });
        state.addLog('info', 'Project', 'Project saved successfully');
      } catch (error) {
        state.addLog('error', 'Project', `Failed to save project: ${error}`);
      }
    },

    duplicateControls: () => {
      const state = get();
      if (state.selectedControls.length === 0) return;

      // BUSINESS LOGIC BYPASS BUG FIX: Enforce control limits on duplicate operations
      const MAX_CONTROLS_FREE = 50;
      const MAX_CONTROLS_PRO = 500;
      const MAX_CONTROLS_ENTERPRISE = 5000;
      
      let maxControls = MAX_CONTROLS_FREE;
      const userPlan = authService.getState().user?.subscription?.plan || 'free';
      if (userPlan === 'pro') {
        maxControls = MAX_CONTROLS_PRO;
      } else if (userPlan === 'enterprise') {
        maxControls = MAX_CONTROLS_ENTERPRISE;
      }
      
      const availableSlots = maxControls - state.controls.length;
      if (availableSlots <= 0) {
        state.addLog(
          'error',
          'Clipboard',
          `Cannot duplicate: Control limit reached (${maxControls} controls)`
        );
        return;
      }
      
      // Limit duplication to available slots
      const controlsToDuplicate = state.selectedControls.slice(0, availableSlots);
      if (controlsToDuplicate.length < state.selectedControls.length) {
        state.addLog(
          'warning',
          'Clipboard',
          `Only duplicating ${controlsToDuplicate.length} of ${state.selectedControls.length} controls due to limit`
        );
      }

      state.addLog('info', 'Clipboard', `Duplicating ${controlsToDuplicate.length} control(s)`);

      const newControls = controlsToDuplicate.map((control, index) => ({
        ...control,
        id: state.nextId + index,
        name: `${control.type}${state.nextId + index}`,
        x: control.x + 20,
        y: control.y + 20,
      }));

      const newNextId = state.nextId + newControls.length;
      const updatedControls = [...state.controls, ...newControls];
      
      set({
        controls: updatedControls,
        selectedControls: newControls,
        nextId: newNextId,
      });

      // STATE CORRUPTION BUG FIX: Use consistent nextId value for history
      state.pushHistory(updatedControls, newNextId);
    },

    setExecutionMode: (mode: 'design' | 'run' | 'break') => {
      const state = get();
      state.addLog('info', 'Execution', `Mode changed: ${mode}`);

      set((draft) => {
        draft.executionMode = mode;
        draft.debugState.mode = mode;
      });
    },
    
    setDebugState: (debugState: DebugState) => {
      set((draft) => {
        draft.debugState = debugState;
        draft.executionMode = debugState.mode;
      });
    },

    toggleWindow: (windowName: string) => {
      const state = get();

      if (windowName !== 'showLogPanel') {
        state.addLog(
          'debug',
          'UI',
          `Toggling window: ${windowName} (current: ${!state[windowName as keyof VB6State]})`
        );
      }

      set({ [windowName]: !state[windowName as keyof VB6State] });
    },

    setSelectedEvent: (eventName: string) => {
      set({ selectedEvent: eventName });
    },

    updateEventCode: (eventKey: string, code: string) => {
      const state = get();
      // Check if we're in a procedure or general declarations
      let finalCode = code;
      if (eventKey.includes('_') && !code.includes('Sub') && !code.includes('Function')) {
        // We're in a procedure, remove any procedure wrapper from the editor
        finalCode = code.replace(/Private Sub.*?\(\)\n/g, '').replace(/\nEnd Sub$/g, '');
      }

      set({
        eventCode: {
          ...state.eventCode,
          [eventKey]: finalCode,
        },
      });
    },

    setDragState: payload => {
      const state = get();
      if (payload.isDragging && payload.controlType) {
        state.addLog('debug', 'DragDrop', `Drag started: ${payload.controlType}`, payload);
      } else if (!payload.isDragging && state.isDragging) {
        state.addLog('debug', 'DragDrop', `Drag ended`, {
          controlType: state.draggedControlType,
          position: payload.position || state.dragPosition,
        });
      }

      set({
        isDragging: payload.isDragging,
        draggedControlType:
          payload.controlType !== undefined ? payload.controlType : state.draggedControlType,
        dragPosition: payload.position || state.dragPosition,
      });
    },

    updateFormProperty: (property: string, value: any) => {
      const state = get();
      set({
        formProperties: {
          ...state.formProperties,
          [property]: value,
        },
      });
    },

    addConsoleOutput: (message: string) => {
      const state = get();
      
      // PERFORMANCE ANTI-PATTERN BUG FIX: Limit console output size and batch updates
      const maxConsoleLines = 1000;
      let newConsoleOutput = [...state.consoleOutput, message];
      
      // Remove old entries if we exceed the limit
      if (newConsoleOutput.length > maxConsoleLines) {
        newConsoleOutput = newConsoleOutput.slice(-maxConsoleLines);
      }
      
      set({
        consoleOutput: newConsoleOutput,
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
      const state = get();
      if (state.historyIndex <= 0) return;
      const prevIndex = state.historyIndex - 1;
      const snapshot = state.history[prevIndex];
      
      // STATE CORRUPTION BUG FIX: Validate selectedControls exist in restored state
      const restoredControls = snapshot.controls.map((c: Control) => ({ ...c }));
      const restoredControlIds = new Set(restoredControls.map(c => c.id));
      const validSelectedControls = state.selectedControls.filter(control => 
        restoredControlIds.has(control.id)
      ).map(control => {
        // Update with restored control data
        const restoredControl = restoredControls.find(c => c.id === control.id);
        return restoredControl || control;
      });
      
      set({
        controls: restoredControls,
        selectedControls: validSelectedControls,
        nextId: snapshot.nextId,
        historyIndex: prevIndex,
        currentCode: snapshot.currentCode || state.currentCode,
        isDirty: true,
        // STATE CONSISTENCY BUG FIX: Clear related UI state when undoing
        alignmentGuides: { x: [], y: [] },
        isSelecting: false,
        selectionBox: { x: 0, y: 0, width: 0, height: 0 },
        isResizing: false,
        resizeHandle: null,
        isMoving: false,
        isDragging: false,
      });
    },

    redo: () => {
      const state = get();
      if (state.historyIndex >= state.history.length - 1) return;
      const nextIndex = state.historyIndex + 1;
      const snapshot = state.history[nextIndex];
      
      // STATE CORRUPTION BUG FIX: Validate selectedControls exist in restored state
      const restoredControls = snapshot.controls.map((c: Control) => ({ ...c }));
      const restoredControlIds = new Set(restoredControls.map(c => c.id));
      const validSelectedControls = state.selectedControls.filter(control => 
        restoredControlIds.has(control.id)
      ).map(control => {
        // Update with restored control data
        const restoredControl = restoredControls.find(c => c.id === control.id);
        return restoredControl || control;
      });
      
      set({
        controls: restoredControls,
        selectedControls: validSelectedControls,
        nextId: snapshot.nextId,
        historyIndex: nextIndex,
        currentCode: snapshot.currentCode || state.currentCode,
        isDirty: true,
        // STATE CONSISTENCY BUG FIX: Clear related UI state when redoing
        alignmentGuides: { x: [], y: [] },
        isSelecting: false,
        selectionBox: { x: 0, y: 0, width: 0, height: 0 },
        isResizing: false,
        resizeHandle: null,
        isMoving: false,
        isDragging: false,
      });
    },

    // Code Analysis
    analyzeCode: () => {
      // Implementation would analyze the code and update state
    },

    // Refactoring
    applyRefactoring: (type: string, options: any) => {
      // Implementation would apply the refactoring and update code
    },

    // Breakpoint Management
    addBreakpoint: (breakpoint: any) => {
      const state = get();
      set({
        breakpoints: [...state.breakpoints, breakpoint],
      });
    },

    removeBreakpoint: (id: string) => {
      const state = get();
      set({
        breakpoints: state.breakpoints.filter(bp => bp.id !== id),
      });
    },

    updateBreakpoint: (id: string, updates: any) => {
      const state = get();
      set({
        breakpoints: state.breakpoints.map(bp => (bp.id === id ? { ...bp, ...updates } : bp)),
      });
    },

    // Enhanced IntelliSense
    showIntelliSense: (position: { x: number; y: number }, items: any[]) => {
      set({
        intellisenseVisible: true,
        intellisensePosition: position,
        intellisenseItems: items,
      });
    },

    // Error List Management
    addError: (error: any) => {
      const state = get();
      set({
        errorList: [...state.errorList, error],
      });
    },

    clearErrors: () => {
      set({
        errorList: [],
      });
    },

    // Snippet Manager
    insertSnippet: (snippet: any) => {
      const state = get();

      if (state.showCodeEditor && state.selectedControls.length > 0 && state.selectedEvent) {
        const control = state.selectedControls[0];
        const eventKey = `${control.name}_${state.selectedEvent}`;
        const currentCode = state.eventCode[eventKey] || '';

        // Update the snippet usage count
        const updatedSnippets = state.snippets.map(s =>
          s.id === snippet.id ? { ...s, usageCount: s.usageCount + 1 } : s
        );

        // Insert the snippet code into the current code
        set({
          eventCode: {
            ...state.eventCode,
            [eventKey]: currentCode + (currentCode ? '\n\n' : '') + snippet.code,
          },
          snippets: updatedSnippets,
        });
      }
    },

    addSnippet: (snippet: any) => {
      const state = get();
      set({
        snippets: [...state.snippets, snippet],
      });
    },

    updateSnippet: (id: string, updates: any) => {
      const state = get();
      set({
        snippets: state.snippets.map(s => (s.id === id ? { ...s, ...updates } : s)),
      });
    },

    deleteSnippet: (id: string) => {
      const state = get();
      set({
        snippets: state.snippets.filter(s => s.id !== id),
      });
    },

    // Code Formatting
    formatCode: (options = {}) => {
      const state = get();
      if (state.selectedControls.length > 0 && state.selectedEvent) {
        const control = state.selectedControls[0];
        const eventKey = `${control.name}_${state.selectedEvent}`;
        const currentCode = state.eventCode[eventKey] || '';

        // Simple formatting: add proper indentation
        let formattedCode = '';
        const lines = currentCode.split('\n');
        let indentLevel = 0;

        for (const line of lines) {
          const trimmedLine = line.trim();

          // Check if this line should reduce indent
          if (
            /^End\s+(Sub|Function|If|Select|With|Type|Enum|Property)/i.test(trimmedLine) ||
            /^Next\b/i.test(trimmedLine) ||
            /^Loop\b/i.test(trimmedLine) ||
            /^Wend\b/i.test(trimmedLine)
          ) {
            indentLevel = Math.max(0, indentLevel - 1);
          }

          // Add indentation to the line
          formattedCode += '    '.repeat(indentLevel) + trimmedLine + '\n';

          // Check if next line should be indented more
          if (
            /^\s*(Sub|Function|If|For|Do|While|With|Select|Type|Enum|Property)/i.test(
              trimmedLine
            ) &&
            !/^If.*Then.*End If/i.test(trimmedLine)
          ) {
            indentLevel++;
          }
        }

        // Update the code
        set({
          eventCode: {
            ...state.eventCode,
            [eventKey]: formattedCode.trim(),
          },
        });
      }
    },

    // Code Conversion
    convertCode: (targetLanguage: string, options = {}) => {
      // Implementation would convert the current code to the target language
    },

    // Logging system
    addLog: (
      level: 'info' | 'warn' | 'error' | 'debug',
      source: string,
      message: string,
      data?: any
    ) => {
      const state = get();

      const log = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        level,
        source,
        message,
        data,
      };

      // Log to console as well for development
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${log.source}] ${log.message}`,
        data || ''
      );

      set({
        logs: [...state.logs.slice(-999), log], // Keep last 1000 logs
      });

      return log;
    },

    recordPerformanceMetrics: (metric: any) => {
      const state = get();
      // Keep last 500 metrics
      set({
        performanceLogs: [...state.performanceLogs.slice(-499), metric],
      });

      state.addLog(
        'debug',
        'Performance',
        `FPS ${metric.fps} | Memory ${metric.memoryUsage.toFixed(1)}MB | CPU ${metric.cpuUsage.toFixed(1)}%`
      );
    },

    clearPerformanceLogs: () => set({ performanceLogs: [] }),

    clearLogs: () => set({ logs: [] }),

    setDesignerZoom: (zoom: number) => {
      const clamped = Math.max(25, Math.min(400, zoom));
      set({ designerZoom: clamped });
    },

    zoomIn: () => {
      const state = get();
      const next = Math.min(state.designerZoom + 25, 400);
      set({ designerZoom: next });
    },

    zoomOut: () => {
      const state = get();
      const next = Math.max(state.designerZoom - 25, 25);
      set({ designerZoom: next });
    },

    resetZoom: () => set({ designerZoom: 100 }),

    addTodo: (text: string) =>
      set(state => ({
        todoItems: [...state.todoItems, { id: Date.now().toString(), text, completed: false }],
      })),

    toggleTodo: (id: string) =>
      set(state => ({
        todoItems: state.todoItems.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)),
      })),

    deleteTodo: (id: string) =>
      set(state => ({
        todoItems: state.todoItems.filter(t => t.id !== id),
      })),

    // Control Array actions
    createControlArray: (controlId: number) => {
      const state = get();
      const control = state.controls.find(c => c.id === controlId);
      if (!control || control.isArray) return;

      const arrayControls = ControlArrayManager.createControlArray(control);
      const [originalControl, newControl] = arrayControls;

      set({
        controls: state.controls
          .map(c => (c.id === controlId ? originalControl : c))
          .concat([newControl]),
        selectedControls: [newControl],
        nextId: state.nextId + 1,
      });

      state.pushHistory(
        state.controls.map(c => (c.id === controlId ? originalControl : c)).concat([newControl]),
        state.nextId + 1
      );
      state.addLog('info', 'ControlArray', `Created control array: ${control.name}`, {
        originalControl,
        newControl,
      });
    },

    addToControlArray: (arrayName: string) => {
      const state = get();
      try {
        const newControl = ControlArrayManager.addToControlArray(state.controls, arrayName);
        newControl.id = state.nextId;

        set({
          controls: [...state.controls, newControl],
          selectedControls: [newControl],
          nextId: state.nextId + 1,
        });

        state.pushHistory([...state.controls, newControl], state.nextId + 1);
        state.addLog('info', 'ControlArray', `Added element to array: ${arrayName}`, newControl);
      } catch (error) {
        state.addLog(
          'error',
          'ControlArray',
          `Failed to add to array: ${(error as Error).message}`
        );
      }
    },

    removeFromControlArray: (controlId: number) => {
      const state = get();
      const control = state.controls.find(c => c.id === controlId);
      if (!control) return;

      try {
        const updatedControls = ControlArrayManager.removeFromControlArray(state.controls, control);

        set({
          controls: updatedControls,
          selectedControls: state.selectedControls.filter(c => c.id !== controlId),
        });

        state.pushHistory(updatedControls, state.nextId);
        state.addLog(
          'info',
          'ControlArray',
          `Removed element from array: ${control.name}`,
          control
        );
      } catch (error) {
        state.addLog(
          'error',
          'ControlArray',
          `Failed to remove from array: ${(error as Error).message}`
        );
      }
    },

    // Backward compatibility methods for tests
    deleteControl: (controlId: number) => {
      const state = get();
      state.deleteControls([controlId]);
      set({ isDirty: true });
    },

    selectControl: (controlId: number) => {
      const state = get();
      state.selectControls([controlId]);
      set({ selectedControlId: controlId.toString() });
    },

    updatePerformanceMetrics: (metrics: { renderTime: number; memoryUsage: number; cpuUsage?: number; fps?: number }) => {
      set(state => ({
        performanceMetrics: {
          ...state.performanceMetrics,
          ...metrics,
        },
      }));
    },

    updateCode: (code: string) => {
      const state = get();
      
      // Push current state to history before updating
      if (state.currentCode !== code) {
        // Store a snapshot that will allow restoring to the current state
        const snapshot = {
          controls: [...state.controls],
          nextId: state.nextId,
          currentCode: code, // Store the new code to restore to
        };
        
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);
        
        set({ 
          currentCode: code, 
          isDirty: true,
          history: newHistory,
          historyIndex: newHistory.length - 1
        });
      }
      
      if (state.selectedControls.length > 0 && state.selectedEvent) {
        const control = state.selectedControls[0];
        const eventKey = `${control.name}_${state.selectedEvent}`;
        state.updateEventCode(eventKey, code);
      }
    },

    insertCode: (code: string, position: number) => {
      const state = get();
      const currentCode = state.currentCode || '';
      const before = currentCode.substring(0, position);
      const after = currentCode.substring(position);
      const newCode = before + code + after;
      set({ currentCode: newCode, isDirty: true });
    },

    addControl: (control: Control) => {
      const state = get();
      const newControl = {
        ...control,
        id: control.id || state.nextId,
      };
      set({
        controls: [...state.controls, newControl],
        nextId: state.nextId + 1,
        isDirty: true,
      });
      state.pushHistory([...state.controls, newControl], state.nextId + 1);
    },

    loadProject: (projectData: any) => {
      try {
        set({
          projectName: projectData.projectName || projectData.name || 'Project1',
          currentCode: projectData.currentCode || '',
          controls: projectData.controls || [],
          forms: projectData.forms || [{ id: 1, name: 'Form1', caption: 'Form1', controls: [] }],
          modules: projectData.modules || [],
          classModules: projectData.classModules || [],
          isDirty: false,
          lastSaved: new Date(),
        });
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    },

    copyControl: (controlId: string) => {
      const state = get();
      const control = state.controls.find(c => c.id.toString() === controlId || c.name === controlId);
      if (control) {
        set({ 
          clipboard: [control],
          clipboardData: {
            type: 'control',
            data: control
          }
        });
      }
    },

    // Missing methods for backward compatibility
    duplicateControl: (controlId: string) => {
      const state = get();
      const control = state.controls.find(c => c.id.toString() === controlId || c.name === controlId);
      if (control) {
        const newControl = {
          ...control,
          id: state.nextId,
          name: `${control.type}${state.nextId}`,
          left: control.left + 10,
          top: control.top + 10,
        };
        set({
          controls: [...state.controls, newControl],
          nextId: state.nextId + 1,
          isDirty: true,
        });
        state.pushHistory([...state.controls, newControl], state.nextId + 1);
      }
    },

    newProject: () => {
      set({
        projectName: 'Project1',
        controls: [],
        forms: [{ id: 1, name: 'Form1', caption: 'Form1', controls: [] }],
        activeFormId: 1,
        modules: [],
        classModules: [],
        currentCode: '',
        selectedControlId: null,
        selectedControls: [],
        clipboard: null,
        isDirty: false,
        lastSaved: null,
        history: [],
        historyIndex: -1,
        nextId: 1,
      });
    },

    toggleDesignMode: () => {
      const state = get();
      set({ isDesignMode: !state.isDesignMode });
    },

    togglePanel: (panelName: string) => {
      const state = get();
      switch (panelName) {
        case 'toolbox':
          set({ showToolbox: !state.showToolbox });
          break;
        case 'properties':
          set({ showProperties: !state.showProperties });
          break;
        case 'projectExplorer':
          set({ showProjectExplorer: !state.showProjectExplorer });
          break;
        case 'immediateWindow':
          set({ showImmediateWindow: !state.showImmediateWindow });
          break;
        default:
          break;
      }
    },

    setZoomLevel: (zoom: number) => {
      const clampedZoom = Math.max(0.25, Math.min(4, zoom));
      set({ zoomLevel: clampedZoom });
    },

    resetStore: () => {
      set({
        projectName: 'VB6 Project',
        controls: [],
        selectedControls: [],
        nextId: 1,
        clipboard: [],
        isDesignMode: true,
        showToolbox: true,
        showProperties: true,
        showProjectExplorer: true,
        showImmediateWindow: false,
        canvasSize: { width: 800, height: 600 },
        zoomLevel: 1,
        isDirty: false,
        lastSaved: null,
        currentCode: '',
        selectedControlId: null,
        clipboardData: null,
        history: [],
        historyIndex: -1,
        performanceMetrics: {
          renderTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          fps: 60,
        },
      });
    },
  }))
);
