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

// All known VB6 control type names
export type ControlTypeName =
  | 'CommandButton'
  | 'Label'
  | 'TextBox'
  | 'Frame'
  | 'CheckBox'
  | 'OptionButton'
  | 'ListBox'
  | 'ComboBox'
  | 'Timer'
  | 'PictureBox'
  | 'Image'
  | 'Shape'
  | 'Line'
  | 'HScrollBar'
  | 'VScrollBar'
  | 'DriveListBox'
  | 'DirListBox'
  | 'FileListBox'
  | 'Data'
  | 'ADODataControl'
  | 'OLE'
  | 'Winsock'
  | 'Inet'
  | 'ProgressBar'
  | 'Slider'
  | 'UpDown'
  | 'TabStrip'
  | 'Toolbar'
  | 'ListView'
  | 'StatusBar'
  | 'ImageList'
  | 'TreeView'
  | 'DateTimePicker'
  | 'MonthView'
  | 'RichTextBox'
  | 'ImageCombo'
  | 'Animation'
  | 'FlatScrollBar'
  | 'MaskedEdit'
  | 'WebBrowser'
  | 'DataGrid'
  | 'DataList'
  | 'DataCombo'
  | 'DBList'
  | 'DBCombo'
  | 'DataRepeater'
  | 'MSChart'
  | 'PictureClip'
  | 'DataEnvironment'
  | 'DataReport'
  | 'CrystalReport'
  | 'MediaPlayer'
  | 'MMControl'
  | 'GraphicsCanvas'
  | 'ActiveXControl'
  | 'MSFlexGrid'
  | 'MAPISession'
  | 'MAPIMessages'
  | 'SysInfo'
  | 'Menu';

export interface ControlFont {
  name: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

// Base control interface with all explicitly-typed properties (no index signature)
export interface Control {
  id: number;
  type: ControlTypeName | (string & Record<never, never>);
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  enabled: boolean;
  tabIndex: number;
  tabStop: boolean;
  tag: string;
  toolTipText: string;

  // Common text/display
  caption?: string;
  text?: string;
  value?: VB6Value;
  backColor?: string;
  foreColor?: string;
  font?: ControlFont;

  // Control Array
  index?: number;
  arrayName?: string;
  isArray?: boolean;

  // Layout
  left?: number;
  top?: number;
  zIndex?: number;
  formId?: string;

  // Common optional properties (used across multiple control types)
  locked?: boolean;
  alignment?: number | string;
  borderStyle?: number | string;
  autoSize?: boolean;
  backStyle?: number;
  wordWrap?: boolean;
  multiLine?: boolean;
  scrollBars?: number;
  maxLength?: number;
  passwordChar?: string;
  style?: number | string;
  sorted?: boolean;
  multiSelect?: number;
  interval?: number;
  picture?: string | null;
  stretch?: boolean;
  appearance?: number;
  dragMode?: number;

  // Numeric range controls
  min?: number;
  max?: number;
  smallChange?: number;
  largeChange?: number;
  increment?: number;

  // Shape/Line
  shape?: number;
  fillColor?: string;
  fillStyle?: number;
  borderColor?: string;
  borderWidth?: number;
  drawMode?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  // File system controls
  drive?: string;
  path?: string;
  pattern?: string;
  fileName?: string;
  archive?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  system?: boolean;
  normal?: boolean;

  // Data controls
  dataSource?: string;
  dataField?: string;
  dataMember?: string;
  connectionString?: string;
  recordSource?: string;
  connect?: string;
  databaseName?: string;

  // Collection-based properties
  items?: unknown[];
  columns?: unknown[];
  data?: unknown;
  rows?: unknown[];
  nodes?: unknown[];
  tabs?: string[];
  buttons?: string[];
  panels?: unknown[];
  images?: unknown[];

  // Miscellaneous
  orientation?: string;
  view?: string;
  url?: string;
  file?: string;
  mask?: string;
  protocol?: number;
  default?: boolean;
  cancel?: boolean;

  // Dynamic properties bag (for VB6 properties not explicitly listed above)
  properties?: Record<string, ControlPropertyValue>;
}

// Helper to set a property on a control dynamically (replaces index signature usage)
export function setControlProperty(control: Control, property: string, value: unknown): Control {
  return { ...control, [property]: value };
}

// Helper to get a property from a control dynamically
export function getControlProperty(control: Control, property: string): unknown {
  return (control as Record<string, unknown>)[property];
}

// Specific control type interfaces for type narrowing
export interface TextBoxControl extends Control {
  type: 'TextBox';
}

export interface LabelControl extends Control {
  type: 'Label';
}

export interface CommandButtonControl extends Control {
  type: 'CommandButton';
}

export interface CheckBoxControl extends Control {
  type: 'CheckBox';
}

export interface OptionButtonControl extends Control {
  type: 'OptionButton';
}

export interface ListBoxControl extends Control {
  type: 'ListBox';
}

export interface ComboBoxControl extends Control {
  type: 'ComboBox';
}

export interface FrameControl extends Control {
  type: 'Frame';
}

export interface PictureBoxControl extends Control {
  type: 'PictureBox';
}

export interface TimerControl extends Control {
  type: 'Timer';
}

export interface ImageControl extends Control {
  type: 'Image';
}

export interface ShapeControl extends Control {
  type: 'Shape';
}

export interface LineControl extends Control {
  type: 'Line';
}

// Type guard helpers
export function isTextBox(c: Control): c is TextBoxControl {
  return c.type === 'TextBox';
}

export function isLabel(c: Control): c is LabelControl {
  return c.type === 'Label';
}

export function isCommandButton(c: Control): c is CommandButtonControl {
  return c.type === 'CommandButton';
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
  | {
      type: 'UPDATE_CONTROL';
      payload: { controlId: number; property: string; value: ControlPropertyValue };
    }
  | { type: 'DELETE_CONTROLS'; payload: { controlIds: number[] } }
  | { type: 'SELECT_CONTROLS'; payload: { controlIds: number[] } }
  | { type: 'COPY_CONTROLS' }
  | { type: 'PASTE_CONTROLS' }
  | { type: 'SET_GRID_SIZE'; payload: { size: number } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | {
      type: 'EXECUTE_EVENT';
      payload: { control: Control; eventName: string; eventData?: Record<string, VB6Value> };
    }
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
  | {
      type: 'SET_SELECTION_STATE';
      payload: { isSelecting: boolean; box?: SelectionBox; start?: MoveStart };
    }
  | {
      type: 'SET_RESIZE_STATE';
      payload: { isResizing: boolean; handle?: string; start?: ResizeStart };
    }
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
