export interface Control {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  enabled: boolean;
  caption?: string;
  text?: string;
  value?: any;
  backColor?: string;
  foreColor?: string;
  font?: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  tabIndex: number;
  tabStop: boolean;
  tag: string;
  toolTipText: string;
  [key: string]: any;
}

export interface Form {
  id: number;
  name: string;
  caption: string;
  controls: Control[];
}

export interface VB6State {
  // Project
  projectName: string;
  forms: Form[];
  activeFormId: number;
  modules: any[];
  classModules: any[];
  userControls: any[];
  references: any[];
  components: any[];

  // Controls
  controls: Control[];
  selectedControls: Control[];
  nextId: number;
  clipboard: Control[];

  // UI State
  executionMode: 'design' | 'run' | 'break';
  showCodeEditor: boolean;
  showGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  alignmentGuides: { x: number[]; y: number[] };

  // Windows visibility
  showProjectExplorer: boolean;
  showPropertiesWindow: boolean;
  showToolbox: boolean;
  showImmediateWindow: boolean;
  showFormLayout: boolean;
  showObjectBrowser: boolean;
  showWatchWindow: boolean;
  showLocalsWindow: boolean;
  showCallStack: boolean;
  showErrorList: boolean;

  // Dialogs
  showMenuEditor: boolean;
  showNewProjectDialog: boolean;
  showReferences: boolean;
  showComponents: boolean;
  showTabOrder: boolean;
  showUserControlDesigner: boolean;

  // Code Editor
  selectedEvent: string;
  eventCode: { [key: string]: string };
  intellisenseVisible: boolean;
  intellisensePosition: { x: number; y: number };
  intellisenseSuggestions: any[];

  // Form Properties
  formProperties: {
    Caption: string;
    BackColor: string;
    Width: number;
    Height: number;
    BorderStyle: string;
    StartUpPosition: string;
    MaxButton: boolean;
    MinButton: boolean;
    ControlBox: boolean;
    ShowInTaskbar: boolean;
    [key: string]: any;
  };

  // Debug
  consoleOutput: string[];
  immediateCommand: string;
  breakpoints: { [key: string]: boolean };
  watchExpressions: any[];
  localVariables: { [key: string]: any };
  callStack: any[];
  errorList: any[];

  // History
  history: any[];
  historyIndex: number;

  // Drag & Drop
  draggedControlType: string | null;
  isDragging: boolean;
  dragPosition: { x: number; y: number };
  snapToGrid: boolean;

  // Selection
  isSelecting: boolean;
  selectionBox: { x: number; y: number; width: number; height: number };
  selectionStart: { x: number; y: number };

  // Resize
  isResizing: boolean;
  resizeHandle: string | null;
  resizeStart: { x: number; y: number; width: number; height: number };

  // Move
  isMoving: boolean;
  moveStart: { x: number; y: number };

  // Toolbox
  selectedToolboxTab: string;
}

export type VB6Action =
  | { type: 'CREATE_CONTROL'; payload: { type: string; x: number; y: number } }
  | { type: 'UPDATE_CONTROL'; payload: { controlId: number; property: string; value: any } }
  | { type: 'DELETE_CONTROLS'; payload: { controlIds: number[] } }
  | { type: 'SELECT_CONTROLS'; payload: { controlIds: number[] } }
  | { type: 'COPY_CONTROLS' }
  | { type: 'PASTE_CONTROLS' }
  | { type: 'SET_GRID_SIZE'; payload: { size: number } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'EXECUTE_EVENT'; payload: { control: any; eventName: string; eventData?: any } }
  | { type: 'SAVE_PROJECT' }
  | { type: 'LOAD_PROJECT'; payload: { file: File } }
  | { type: 'SET_EXECUTION_MODE'; payload: { mode: 'design' | 'run' | 'break' } }
  | { type: 'TOGGLE_WINDOW'; payload: { windowName: string } }
  | { type: 'SET_SELECTED_EVENT'; payload: { eventName: string } }
  | { type: 'UPDATE_EVENT_CODE'; payload: { eventKey: string; code: string } }
  | { type: 'SET_DRAG_STATE'; payload: { isDragging: boolean; controlType?: string; position?: { x: number; y: number } } }
  | { type: 'SET_SELECTION_STATE'; payload: { isSelecting: boolean; box?: any; start?: any } }
  | { type: 'SET_RESIZE_STATE'; payload: { isResizing: boolean; handle?: string; start?: any } }
  | { type: 'SET_MOVE_STATE'; payload: { isMoving: boolean; start?: any } }
  | { type: 'UPDATE_FORM_PROPERTY'; payload: { property: string; value: any } }
  | { type: 'ADD_FORM'; payload: { name: string } }
  | { type: 'SET_ACTIVE_FORM'; payload: { id: number } }
  | { type: 'RENAME_FORM'; payload: { id: number; name: string } }
  | { type: 'SET_PROJECT'; payload: { project: any } }
  | { type: 'ADD_CONSOLE_OUTPUT'; payload: { message: string } }
  | { type: 'CLEAR_CONSOLE' }
  | { type: 'SET_IMMEDIATE_COMMAND'; payload: { command: string } }
  | { type: 'SHOW_DIALOG'; payload: { dialogName: string; show: boolean } };