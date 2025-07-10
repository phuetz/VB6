import { VB6State, VB6Action } from './types';
import { getDefaultProperties } from '../utils/controlDefaults';

export const initialState: VB6State = {
  // Project
  // Project
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

  // Dialogs
  showMenuEditor: false,
  showNewProjectDialog: false,
  showReferences: false,
  showComponents: false,
  showTabOrder: false,
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
  selectedToolboxTab: 'General'
};

export const vb6Reducer = (state: VB6State, action: VB6Action): VB6State => {
  switch (action.type) {
    case 'SET_GRID_SIZE': {
      return {
        ...state,
        gridSize: action.payload.size
      };
    }

    case 'COPY_CONTROLS': {
      return {
        ...state,
        clipboard: [...state.selectedControls]
      };
    }

    case 'PASTE_CONTROLS': {
      if (state.clipboard.length === 0) return state;

      const newControls = state.clipboard.map((control, index) => ({
        ...control,
        id: state.nextId + index,
        name: `${control.type}${state.nextId + index}`,
        x: control.x + 20,
        y: control.y + 20
      }));

      return {
        ...state,
        controls: [...state.controls, ...newControls],
        selectedControls: newControls,
        nextId: state.nextId + state.clipboard.length
      };
    }

    case 'CREATE_CONTROL': {
      const newControl = {
        ...getDefaultProperties(action.payload.type, state.nextId),
        x: action.payload.x,
        y: action.payload.y
      };
      
      return {
        ...state,
        controls: [...state.controls, newControl],
        selectedControls: [newControl],
        nextId: state.nextId + 1
      };
    }

    case 'UPDATE_CONTROL': {
      const { controlId, property, value } = action.payload;
      const updatedControls = state.controls.map(control =>
        control.id === controlId ? { ...control, [property]: value } : control
      );
      
      const updatedSelectedControls = state.selectedControls.map(control =>
        control.id === controlId ? { ...control, [property]: value } : control
      );

      return {
        ...state,
        controls: updatedControls,
        selectedControls: updatedSelectedControls
      };
    }

    case 'DELETE_CONTROLS': {
      const { controlIds } = action.payload;
      const remainingControls = state.controls.filter(
        control => !controlIds.includes(control.id)
      );

      return {
        ...state,
        controls: remainingControls,
        selectedControls: []
      };
    }

    case 'SELECT_CONTROLS': {
      const { controlIds } = action.payload;
      const selectedControls = state.controls.filter(
        control => controlIds.includes(control.id)
      );

      return {
        ...state,
        selectedControls
      };
    }

    case 'SET_EXECUTION_MODE': {
      return {
        ...state,
        executionMode: action.payload.mode
      };
    }

    case 'TOGGLE_WINDOW': {
      const { windowName } = action.payload;
      return {
        ...state,
        [windowName]: !state[windowName as keyof VB6State]
      };
    }

    case 'SET_SELECTED_EVENT': {
      return {
        ...state,
        selectedEvent: action.payload.eventName
      };
    }

    case 'UPDATE_EVENT_CODE': {
      const { eventKey, code } = action.payload;
      return {
        ...state,
        eventCode: {
          ...state.eventCode,
          [eventKey]: code
        }
      };
    }

    case 'SET_DRAG_STATE': {
      const { isDragging, controlType, position } = action.payload;
      return {
        ...state,
        isDragging,
        draggedControlType: controlType !== undefined ? controlType : state.draggedControlType,
        dragPosition: position || state.dragPosition
      };
    }

    case 'SET_SELECTION_STATE': {
      const { isSelecting, box, start } = action.payload;
      return {
        ...state,
        isSelecting,
        selectionBox: box || state.selectionBox,
        selectionStart: start || state.selectionStart
      };
    }

    case 'SET_RESIZE_STATE': {
      const { isResizing, handle, start } = action.payload;
      return {
        ...state,
        isResizing,
        resizeHandle: handle || null,
        resizeStart: start || state.resizeStart
      };
    }

    case 'SET_MOVE_STATE': {
      const { isMoving, start } = action.payload;
      return {
        ...state,
        isMoving,
        moveStart: start || state.moveStart
      };
    }

    case 'UPDATE_FORM_PROPERTY': {
      const { property, value } = action.payload;
      return {
        ...state,
        formProperties: {
          ...state.formProperties,
          [property]: value
        }
      };
    }

    case 'ADD_CONSOLE_OUTPUT': {
      return {
        ...state,
        consoleOutput: [...state.consoleOutput, action.payload.message]
      };
    }

    case 'CLEAR_CONSOLE': {
      return {
        ...state,
        consoleOutput: []
      };
    }

    case 'SET_IMMEDIATE_COMMAND': {
      return {
        ...state,
        immediateCommand: action.payload.command
      };
    }

    case 'SHOW_DIALOG': {
      const { dialogName, show } = action.payload;
      return {
        ...state,
        [dialogName]: show
      };
    }

    case 'ADD_FORM': {
      const newId = state.forms.length > 0 ? Math.max(...state.forms.map(f => f.id)) + 1 : 1;
      const name = action.payload.name;
      const newForm = { id: newId, name, caption: name, controls: [] };
      return {
        ...state,
        forms: [...state.forms, newForm],
        activeFormId: newId,
        formProperties: {
          ...state.formProperties,
          Caption: name
        }
      };
    }

    case 'SET_ACTIVE_FORM': {
      return {
        ...state,
        activeFormId: action.payload.id
      };
    }

    case 'RENAME_FORM': {
      const { id, name } = action.payload;
      return {
        ...state,
        forms: state.forms.map(f => f.id === id ? { ...f, name } : f),
        formProperties: state.activeFormId === id ? { ...state.formProperties, Caption: name } : state.formProperties
      };
    }

    case 'SET_PROJECT': {
      const project = action.payload.project;
      return {
        ...state,
        projectName: project.name,
        forms: project.forms || [],
        modules: project.modules || [],
        classModules: project.classModules || [],
        activeFormId: project.forms && project.forms.length > 0 ? project.forms[0].id : state.activeFormId
      };
    }

    case 'UNDO': {
      // Implementation for undo
      return state;
    }

    case 'REDO': {
      // Implementation for redo
      return state;
    }

    default:
      return state;
  }
};