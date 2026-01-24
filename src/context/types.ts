// Types de base pour les valeurs VB6
export type VB6Value = string | number | boolean | null | undefined | Date | object;
export type ControlPropertyValue = string | number | boolean | null | undefined;

// Types pour les modules VB6
export interface VB6Module {
  id: number;
  name: string;
  code: string;
  type: 'standard' | 'class' | 'form';
}

export interface VB6UserControl {
  id: number;
  name: string;
  code: string;
  designerCode?: string;
}

export interface VB6Reference {
  name: string;
  guid?: string;
  version?: string;
  path?: string;
  checked: boolean;
}

export interface VB6Component {
  name: string;
  filename: string;
  guid?: string;
  selected: boolean;
}

// Types pour IntelliSense
export interface IntelliSenseSuggestion {
  label: string;
  kind: 'method' | 'property' | 'event' | 'variable' | 'constant' | 'keyword' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText?: string;
}

// Types pour le débogage
export interface WatchExpression {
  id: string;
  expression: string;
  value: VB6Value;
  type?: string;
  error?: string;
}

export interface CallStackFrame {
  id: string;
  procedure: string;
  module: string;
  line: number;
}

export interface VB6Error {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

// Types pour l'historique
export interface HistoryEntry {
  controls: Control[];
  nextId: number;
  timestamp: number;
}

// Types pour la sélection et le redimensionnement
export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeStart {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MoveStart {
  x: number;
  y: number;
}

// Types pour les projets
export interface VB6Project {
  name: string;
  forms: Form[];
  modules: VB6Module[];
  classModules: VB6Module[];
  userControls?: VB6UserControl[];
  references?: VB6Reference[];
  components?: VB6Component[];
}

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
  value?: VB6Value;
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
  // Control Array properties
  index?: number; // Index in control array (undefined for non-array controls)
  arrayName?: string; // Base name for control array (e.g., "Command1" for Command1(0), Command1(1))
  isArray?: boolean; // Whether this control is part of an array
  // Additional dynamic properties
  left?: number;
  top?: number;
  zIndex?: number;
  formId?: string;
  properties?: Record<string, ControlPropertyValue>;
  [key: string]: ControlPropertyValue | Record<string, ControlPropertyValue> | undefined;
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
  modules: VB6Module[];
  classModules: VB6Module[];
  userControls: VB6UserControl[];
  references: VB6Reference[];
  components: VB6Component[];

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
  designerZoom: number;

  // Windows visibility
  showProjectExplorer: boolean;
  showPropertiesWindow: boolean;
  showControlTree: boolean;
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
  showOptionsDialog: boolean;

  // Code Editor
  selectedEvent: string;
  eventCode: { [key: string]: string };
  intellisenseVisible: boolean;
  intellisensePosition: { x: number; y: number };
  intellisenseSuggestions: IntelliSenseSuggestion[];

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
    [key: string]: ControlPropertyValue;
  };

  // Debug
  consoleOutput: string[];
  immediateCommand: string;
  breakpoints: { [key: string]: boolean };
  watchExpressions: WatchExpression[];
  localVariables: Record<string, VB6Value>;
  callStack: CallStackFrame[];
  errorList: VB6Error[];

  // History
  history: HistoryEntry[];
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
  | { type: 'UPDATE_CONTROL'; payload: { controlId: number; property: string; value: ControlPropertyValue } }
  | { type: 'DELETE_CONTROLS'; payload: { controlIds: number[] } }
  | { type: 'SELECT_CONTROLS'; payload: { controlIds: number[] } }
  | { type: 'COPY_CONTROLS' }
  | { type: 'PASTE_CONTROLS' }
  | { type: 'SET_GRID_SIZE'; payload: { size: number } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'EXECUTE_EVENT'; payload: { control: Control; eventName: string; eventData?: Record<string, VB6Value> } }
  | { type: 'SAVE_PROJECT' }
  | { type: 'LOAD_PROJECT'; payload: { file: File } }
  | { type: 'SET_EXECUTION_MODE'; payload: { mode: 'design' | 'run' | 'break' } }
  | { type: 'TOGGLE_WINDOW'; payload: { windowName: string } }
  | { type: 'SET_SELECTED_EVENT'; payload: { eventName: string } }
  | { type: 'UPDATE_EVENT_CODE'; payload: { eventKey: string; code: string } }
  | {
      type: 'SET_DRAG_STATE';
      payload: { isDragging: boolean; controlType?: string; position?: { x: number; y: number } };
    }
  | { type: 'SET_SELECTION_STATE'; payload: { isSelecting: boolean; box?: SelectionBox; start?: MoveStart } }
  | { type: 'SET_RESIZE_STATE'; payload: { isResizing: boolean; handle?: string; start?: ResizeStart } }
  | { type: 'SET_MOVE_STATE'; payload: { isMoving: boolean; start?: MoveStart } }
  | { type: 'UPDATE_FORM_PROPERTY'; payload: { property: string; value: ControlPropertyValue } }
  | { type: 'ADD_FORM'; payload: { name: string } }
  | { type: 'SET_ACTIVE_FORM'; payload: { id: number } }
  | { type: 'RENAME_FORM'; payload: { id: number; name: string } }
  | { type: 'SET_PROJECT'; payload: { project: VB6Project } }
  | { type: 'ADD_CONSOLE_OUTPUT'; payload: { message: string } }
  | { type: 'CLEAR_CONSOLE' }
  | { type: 'SET_IMMEDIATE_COMMAND'; payload: { command: string } }
  | { type: 'SHOW_DIALOG'; payload: { dialogName: string; show: boolean } }
  | { type: 'SET_DESIGNER_ZOOM'; payload: { zoom: number } };
