// Types étendus pour toutes les fonctionnalités
export interface Project {
  id: string;
  name: string;
  version: string;
  created: Date;
  modified: Date;
  forms: Form[];
  modules: Module[];
  classModules: ClassModule[];
  userControls: UserControl[];
  resources: Resource[];
  settings: ProjectSettings;
  references: Reference[];
  components: Component[];
}

export interface ProjectSettings {
  title: string;
  description: string;
  version: string;
  autoIncrementVersion: boolean;
  compilationType: 'exe' | 'dll' | 'ocx';
  startupObject: string;
  icon: string;
  helpFile: string;
  threadingModel: 'apartment' | 'single' | 'free';
}

export interface Module {
  id: string;
  name: string;
  type: 'standard' | 'class' | 'user-control';
  code: string;
  procedures: Procedure[];
  variables: Variable[];
  constants: Constant[];
}

export interface Procedure {
  name: string;
  type: 'sub' | 'function' | 'property-get' | 'property-let' | 'property-set';
  scope: 'private' | 'public' | 'friend';
  parameters: Parameter[];
  returnType?: string;
  code: string;
  line: number;
}

export interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  byRef: boolean;
  defaultValue?: any;
}

export interface Variable {
  name: string;
  type: string;
  scope: 'private' | 'public' | 'dim' | 'static';
  value?: any;
  line: number;
}

export interface Constant {
  name: string;
  type: string;
  value: any;
  scope: 'private' | 'public';
}

export interface ClassModule extends Module {
  events: Event[];
  properties: Property[];
  methods: Method[];
}

export interface UserControl extends Module {
  controls: Control[];
  events: Event[];
  properties: Property[];
}

export interface Resource {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'cursor' | 'sound' | 'binary';
  data: string | ArrayBuffer;
  size: number;
  format: string;
}

export interface Reference {
  id: string;
  name: string;
  description: string;
  version: string;
  location: string;
  guid: string;
  checked: boolean;
  builtin: boolean;
  major: number;
  minor: number;
}

export interface Component {
  id: string;
  name: string;
  description: string;
  version: string;
  file: string;
  controls: ComponentControl[];
  checked: boolean;
}

export interface ComponentControl {
  name: string;
  class: string;
  progId: string;
  icon: string;
  toolboxBitmap: string;
}

export interface DebugState {
  mode: 'design' | 'run' | 'break';
  currentLine: number;
  currentFile: string;
  variables: { [key: string]: any };
  callStack: DebugFrame[];
  breakpoints: Set<string>;
  watchExpressions: WatchExpression[];
}

export interface DebugFrame {
  procedure: string;
  module: string;
  line: number;
  variables: { [key: string]: any };
}

export interface WatchExpression {
  expression: string;
  value: any;
  type: string;
  context: string;
  error?: string;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  disabled?: boolean;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
  };
  fonts: {
    primary: string;
    code: string;
    size: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  files: TemplateFile[];
  placeholders: { [key: string]: string };
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'form' | 'module' | 'class' | 'project';
}

export interface CompilerError {
  type: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  code: string;
}

export interface CompiledCode {
  javascript: string;
  sourceMap: string;
  errors: CompilerError[];
  dependencies: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  code: string;
  expected: any;
  actual?: any;
  status: 'pending' | 'passed' | 'failed';
  duration?: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  setup?: string;
  teardown?: string;
}
