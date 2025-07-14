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
  duplicateControls: () => void;
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
    showCodeEditor: false,
    showGrid: true,
    gridSize: 8,
    showAlignmentGuides: true,
    alignmentGuides: { x: [], y: [] },
    designerZoom: 100,

    // Windows visibility
    showProjectExplorer: true,
    showPropertiesWindow: true,
    showControlTree: false,
    showToolbox: true,
    showImmediateWindow: false,
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

    // Logging
    logs: [],
    performanceLogs: [],
    showLogPanel: false,
    // Todo list
    todoItems: [],
    showTodoList: false,

    // History helper
    pushHistory: (controls: Control[], nextId: number) => {
      const state = get();
      const snapshot = {
        controls: controls.map(c => ({ ...c })),
        nextId,
      };
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), snapshot];
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },

    // Actions
    createControl: (type: string, x = 50, y = 50) => {
      const state = get();
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

    updateControl: (controlId: number, property: string, value: any) => {
      const state = get();

      if (property !== 'x' && property !== 'y') {
        state.addLog(
          'debug',
          'ControlUpdate',
          `Updating control #${controlId}: ${property} = ${value}`
        );
      }

      const updatedControls = state.controls.map(control =>
        control.id === controlId ? { ...control, [property]: value } : control
      );

      const updatedSelectedControls = state.selectedControls.map(control =>
        control.id === controlId ? { ...control, [property]: value } : control
      );

      set({
        controls: updatedControls,
        selectedControls: updatedSelectedControls,
      });
      state.pushHistory(updatedControls, state.nextId);
    },

    deleteControls: (controlIds: number[]) => {
      const state = get();
      state.addLog('info', 'ControlDeletion', `Deleting controls: ${controlIds.join(', ')}`);

      set({
        controls: state.controls.filter(control => !controlIds.includes(control.id)),
        selectedControls: [],
      });
      state.pushHistory(
        state.controls.filter(control => !controlIds.includes(control.id)),
        state.nextId
      );
    },

    selectControls: (controlIds: number[]) => {
      const state = get();
      state.addLog('debug', 'ControlSelection', `Selecting controls: ${controlIds.join(', ')}`);

      const selectedControls = state.controls.filter(control => controlIds.includes(control.id));
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

      state.addLog(
        'info',
        'Clipboard',
        `Pasting ${state.clipboard.length} controls from clipboard`
      );

      const newControls = state.clipboard.map((control, index) => ({
        ...control,
        id: state.nextId + index,
        name: `${control.type}${state.nextId + index}`,
        x: control.x + 20,
        y: control.y + 20,
      }));

      set({
        controls: [...state.controls, ...newControls],
        selectedControls: newControls,
        nextId: state.nextId + state.clipboard.length,
      });
      state.pushHistory([...state.controls, ...newControls], state.nextId + state.clipboard.length);
    },

    duplicateControls: () => {
      const state = get();
      if (state.selectedControls.length === 0) return;

      state.addLog(
        'info',
        'Clipboard',
        `Duplicating ${state.selectedControls.length} control(s)`
      );

      const newControls = state.selectedControls.map((control, index) => ({
        ...control,
        id: state.nextId + index,
        name: `${control.type}${state.nextId + index}`,
        x: control.x + 20,
        y: control.y + 20,
      }));

      set({
        controls: [...state.controls, ...newControls],
        selectedControls: newControls,
        nextId: state.nextId + newControls.length,
      });

      state.pushHistory([...state.controls, ...newControls], state.nextId + newControls.length);
    },

    setExecutionMode: (mode: 'design' | 'run' | 'break') => {
      const state = get();
      state.addLog('info', 'Execution', `Mode changed: ${mode}`);

      set({ executionMode: mode });
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
      set({
        consoleOutput: [...state.consoleOutput, message],
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
      set({
        controls: snapshot.controls.map((c: Control) => ({ ...c })),
        selectedControls: [],
        nextId: snapshot.nextId,
        historyIndex: prevIndex,
      });
    },

    redo: () => {
      const state = get();
      if (state.historyIndex >= state.history.length - 1) return;
      const nextIndex = state.historyIndex + 1;
      const snapshot = state.history[nextIndex];
      set({
        controls: snapshot.controls.map((c: Control) => ({ ...c })),
        selectedControls: [],
        nextId: snapshot.nextId,
        historyIndex: nextIndex,
      });
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
      console.log('Formatting code with options:', options);
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
      console.log(`Converting code to ${targetLanguage} with options:`, options);
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
  }))
);
