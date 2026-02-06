/**
 * VB6 Declare Function/Sub Support Implementation
 *
 * Complete support for VB6 external API declarations
 */

export interface VB6DeclareParameter {
  name: string;
  type: string;
  byRef: boolean;
  optional: boolean;
  defaultValue?: any;
  asString: boolean; // ByVal as String
}

export interface VB6DeclareFunction {
  name: string;
  aliasName?: string;
  library: string;
  returnType?: string; // undefined for Sub
  parameters: VB6DeclareParameter[];
  isFunction: boolean; // true for Function, false for Sub
  public: boolean;
  module: string;
  line: number;
  ordinal?: number; // For ordinal-based calls
}

export interface VB6LibraryMapping {
  originalName: string;
  webEquivalent?: string; // Web API equivalent
  shimFunction?: string; // Custom shim function name
  available: boolean;
  description: string;
}

export class VB6DeclareProcessor {
  private declaredFunctions: Map<string, VB6DeclareFunction> = new Map();
  private libraryMappings: Map<string, VB6LibraryMapping> = new Map();
  private shimFunctions: Map<string, string> = new Map(); // Function name -> JavaScript code
  private currentModule: string = '';

  constructor() {
    this.initializeCommonLibraries();
  }

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 Declare statement
   * Examples:
   * Declare Function GetWindowsDirectory Lib "kernel32" Alias "GetWindowsDirectoryA" (ByVal lpBuffer As String, ByVal nSize As Long) As Long
   * Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
   * Declare Function GetPrivateProfileString Lib "kernel32" Alias "GetPrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As String, ByVal lpDefault As String, ByVal lpReturnedString As String, ByVal nSize As Long, ByVal lpFileName As String) As Long
   */
  parseDeclareStatement(code: string, line: number): VB6DeclareFunction | null {
    const declareRegex =
      /^(Public\s+|Private\s+)?Declare\s+(Function|Sub)\s+(\w+)\s+Lib\s+"([^"]+)"(?:\s+Alias\s+"([^"]+)")?(?:\s+\(([^)]*)\))?(?:\s+As\s+(.+))?$/i;
    const match = code.match(declareRegex);

    if (!match) return null;

    const scope = match[1] ? match[1].trim().toLowerCase() : 'public';
    const type = match[2].toLowerCase();
    const functionName = match[3];
    const library = match[4];
    const aliasName = match[5];
    const parameterList = match[6] || '';
    const returnType = match[7];

    const parameters = this.parseParameterList(parameterList);
    const isFunction = type === 'function';

    // Validate return type for functions
    if (isFunction && !returnType) {
      throw new Error(`Function ${functionName} must have a return type`);
    }
    if (!isFunction && returnType) {
      throw new Error(`Sub ${functionName} cannot have a return type`);
    }

    return {
      name: functionName,
      aliasName,
      library,
      returnType,
      parameters,
      isFunction,
      public: scope === 'public',
      module: this.currentModule,
      line,
    };
  }

  /**
   * Parse parameter list for Declare statement
   */
  private parseParameterList(parameterList: string): VB6DeclareParameter[] {
    if (!parameterList.trim()) return [];

    const parameters: VB6DeclareParameter[] = [];
    const params = this.splitParameters(parameterList);

    for (const param of params) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      const paramRegex =
        /^(Optional\s+)?(ByRef\s+|ByVal\s+)?(\w+)(?:\s+As\s+(.+?))?(?:\s*=\s*(.+))?$/i;
      const match = trimmed.match(paramRegex);

      if (match) {
        const isOptional = match[1] ? true : false;
        const byRef = match[2] ? !match[2].toLowerCase().includes('byval') : true; // Default is ByRef
        const paramName = match[3];
        const paramType = match[4] || 'Any';
        const defaultValue = match[5];

        parameters.push({
          name: paramName,
          type: paramType,
          byRef,
          optional: isOptional,
          defaultValue: defaultValue ? this.parseDefaultValue(defaultValue) : undefined,
          asString: paramType.toLowerCase() === 'string',
        });
      }
    }

    return parameters;
  }

  /**
   * Split parameters considering nested parentheses
   */
  private splitParameters(parameterList: string): string[] {
    const params: string[] = [];
    let current = '';
    let parenCount = 0;
    let inQuotes = false;

    for (let i = 0; i < parameterList.length; i++) {
      const char = parameterList[i];

      if (char === '"' && (i === 0 || parameterList[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      }

      if (!inQuotes) {
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === ',' && parenCount === 0) {
          params.push(current.trim());
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      params.push(current.trim());
    }

    return params;
  }

  /**
   * Parse default value
   */
  private parseDefaultValue(value: string): any {
    const trimmed = value.trim();

    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.substring(1, trimmed.length - 1);
    }

    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }

    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed.toLowerCase() === 'nothing') return null;

    return trimmed;
  }

  /**
   * Register declared function
   */
  registerDeclareFunction(declareFunc: VB6DeclareFunction) {
    const key = declareFunc.public ? declareFunc.name : `${this.currentModule}.${declareFunc.name}`;
    this.declaredFunctions.set(key, declareFunc);

    // Generate shim function if needed
    this.generateShimFunction(declareFunc);
  }

  /**
   * Get declared function
   */
  getDeclaredFunction(name: string): VB6DeclareFunction | undefined {
    return (
      this.declaredFunctions.get(name) ||
      this.declaredFunctions.get(`${this.currentModule}.${name}`)
    );
  }

  /**
   * Generate JavaScript shim function
   */
  private generateShimFunction(declareFunc: VB6DeclareFunction) {
    const library = this.getLibraryMapping(declareFunc.library);

    if (library?.shimFunction) {
      // Use predefined shim
      this.shimFunctions.set(declareFunc.name, library.shimFunction);
      return;
    }

    // Generate generic shim
    let shimCode = `// Declare ${declareFunc.isFunction ? 'Function' : 'Sub'}: ${declareFunc.name}\n`;
    shimCode += `function ${declareFunc.name}(`;

    const paramNames = declareFunc.parameters.map(p => p.name);
    shimCode += paramNames.join(', ');
    shimCode += `) {\n`;

    // Add parameter validation
    for (const param of declareFunc.parameters) {
      if (!param.optional) {
        shimCode += `  if (${param.name} === undefined) {\n`;
        shimCode += `    throw new Error('Required parameter ${param.name} is missing');\n`;
        shimCode += `  }\n`;
      }
    }

    // Library-specific handling
    shimCode += `  // Library: ${declareFunc.library}\n`;

    if (this.isUnsupportedLibrary(declareFunc.library)) {
      shimCode += `  console.warn('${declareFunc.library} not supported in web environment');\n`;

      if (declareFunc.isFunction) {
        const defaultReturn = this.getDefaultReturnValue(declareFunc.returnType || 'Long');
        shimCode += `  return ${this.valueToJS(defaultReturn)}; // Default return value\n`;
      }
    } else {
      // Try to provide web equivalent
      const webImpl = this.generateWebImplementation(declareFunc);
      shimCode += webImpl;
    }

    shimCode += `}\n`;

    this.shimFunctions.set(declareFunc.name, shimCode);
  }

  /**
   * Generate web-compatible implementation
   */
  private generateWebImplementation(declareFunc: VB6DeclareFunction): string {
    const funcName = declareFunc.aliasName || declareFunc.name;
    const library = declareFunc.library.toLowerCase();

    // Common Windows API implementations
    if (library.includes('kernel32')) {
      return this.generateKernel32Implementation(funcName, declareFunc);
    } else if (library.includes('user32')) {
      return this.generateUser32Implementation(funcName, declareFunc);
    } else if (library.includes('advapi32')) {
      return this.generateAdvapi32Implementation(funcName, declareFunc);
    } else if (library.includes('shell32')) {
      return this.generateShell32Implementation(funcName, declareFunc);
    } else {
      return this.generateGenericImplementation(declareFunc);
    }
  }

  /**
   * Generate Kernel32 API implementations
   */
  private generateKernel32Implementation(
    funcName: string,
    declareFunc: VB6DeclareFunction
  ): string {
    const lowerName = funcName.toLowerCase();

    if (lowerName.includes('getwindowsdirectory')) {
      return (
        `  // GetWindowsDirectory simulation\n` +
        `  const winDir = "C:\\\\Windows";\n` +
        `  if (lpBuffer && nSize > winDir.length) {\n` +
        `    // In real implementation, would copy to buffer\n` +
        `    console.log('GetWindowsDirectory called:', winDir);\n` +
        `    return winDir.length;\n` +
        `  }\n` +
        `  return 0;\n`
      );
    }

    if (lowerName === 'sleep') {
      return (
        `  // Sleep simulation with setTimeout\n` +
        `  return new Promise(resolve => {\n` +
        `    setTimeout(resolve, dwMilliseconds);\n` +
        `  });\n`
      );
    }

    if (lowerName.includes('gettickcount')) {
      return `  // GetTickCount simulation\n` + `  return Math.floor(performance.now());\n`;
    }

    if (lowerName.includes('getprivateprofilestring')) {
      return (
        `  // GetPrivateProfileString simulation\n` +
        `  console.log('GetPrivateProfileString:', lpApplicationName, lpKeyName, lpFileName);\n` +
        `  // Return default value\n` +
        `  return lpDefault ? lpDefault.length : 0;\n`
      );
    }

    return this.generateGenericImplementation(declareFunc);
  }

  /**
   * Generate User32 API implementations
   */
  private generateUser32Implementation(funcName: string, declareFunc: VB6DeclareFunction): string {
    const lowerName = funcName.toLowerCase();

    if (lowerName.includes('messagebox')) {
      return (
        `  // MessageBox simulation\n` +
        `  const result = window.confirm(lpText + '\\n\\n' + lpCaption);\n` +
        `  return result ? 1 : 2; // IDOK : IDCANCEL\n`
      );
    }

    if (lowerName.includes('findwindow')) {
      return (
        `  // FindWindow simulation\n` +
        `  console.log('FindWindow called:', lpClassName, lpWindowName);\n` +
        `  return 0; // No window found in web environment\n`
      );
    }

    if (lowerName.includes('getcursorpos')) {
      return (
        `  // GetCursorPos simulation\n` +
        `  // Note: Limited in web environment due to security\n` +
        `  console.log('GetCursorPos called');\n` +
        `  return 0;\n`
      );
    }

    return this.generateGenericImplementation(declareFunc);
  }

  /**
   * Generate Advapi32 API implementations
   */
  private generateAdvapi32Implementation(
    funcName: string,
    declareFunc: VB6DeclareFunction
  ): string {
    const lowerName = funcName.toLowerCase();

    if (lowerName.includes('regopen') || lowerName.includes('regquery')) {
      return (
        `  // Registry access simulation\n` +
        `  console.warn('Registry access not available in web environment');\n` +
        `  return 2; // ERROR_FILE_NOT_FOUND\n`
      );
    }

    return this.generateGenericImplementation(declareFunc);
  }

  /**
   * Generate Shell32 API implementations
   */
  private generateShell32Implementation(funcName: string, declareFunc: VB6DeclareFunction): string {
    const lowerName = funcName.toLowerCase();

    if (lowerName.includes('shellexecute')) {
      return (
        `  // ShellExecute simulation\n` +
        `  console.log('ShellExecute:', lpFile, lpParameters);\n` +
        `  if (lpFile.startsWith('http://') || lpFile.startsWith('https://')) {\n` +
        `    window.open(lpFile, '_blank');\n` +
        `    return 42; // Success\n` +
        `  }\n` +
        `  console.warn('File execution not supported in web environment');\n` +
        `  return 2; // File not found\n`
      );
    }

    return this.generateGenericImplementation(declareFunc);
  }

  /**
   * Generate generic implementation
   */
  private generateGenericImplementation(declareFunc: VB6DeclareFunction): string {
    let impl = `  // Generic implementation for ${declareFunc.name}\n`;
    impl += `  console.log('API call: ${declareFunc.name}', arguments);\n`;
    impl += `  console.warn('${declareFunc.library} API not fully supported in web environment');\n`;

    if (declareFunc.isFunction) {
      const defaultReturn = this.getDefaultReturnValue(declareFunc.returnType || 'Long');
      impl += `  return ${this.valueToJS(defaultReturn)};\n`;
    }

    return impl;
  }

  /**
   * Get default return value for type
   */
  private getDefaultReturnValue(returnType: string): any {
    switch (returnType.toLowerCase()) {
      case 'long':
      case 'integer':
      case 'byte':
        return 0;
      case 'single':
      case 'double':
      case 'currency':
        return 0.0;
      case 'string':
        return '';
      case 'boolean':
        return false;
      case 'variant':
        return null;
      default:
        return 0;
    }
  }

  /**
   * Check if library is unsupported in web environment
   */
  private isUnsupportedLibrary(library: string): boolean {
    const unsupported = [
      'kernel32',
      'user32',
      'advapi32',
      'shell32',
      'gdi32',
      'comdlg32',
      'winmm',
      'ole32',
      'oleaut32',
      'version',
    ];

    return unsupported.some(lib => library.toLowerCase().includes(lib));
  }

  /**
   * Get library mapping
   */
  private getLibraryMapping(libraryName: string): VB6LibraryMapping | undefined {
    return this.libraryMappings.get(libraryName.toLowerCase());
  }

  /**
   * Initialize common Windows libraries
   */
  private initializeCommonLibraries() {
    const libraries: VB6LibraryMapping[] = [
      {
        originalName: 'kernel32',
        available: false,
        description: 'Windows Kernel API - Limited simulation available',
      },
      {
        originalName: 'user32',
        available: false,
        description: 'Windows User Interface API - Limited simulation available',
      },
      {
        originalName: 'advapi32',
        available: false,
        description: 'Advanced Windows API - Not available in web environment',
      },
      {
        originalName: 'shell32',
        available: false,
        description: 'Windows Shell API - Limited simulation available',
      },
      {
        originalName: 'gdi32',
        available: false,
        description: 'Graphics Device Interface - Not available in web environment',
      },
      {
        originalName: 'wininet',
        webEquivalent: 'fetch',
        available: true,
        description: 'Internet functions - Use fetch API instead',
      },
    ];

    for (const lib of libraries) {
      this.libraryMappings.set(lib.originalName.toLowerCase(), lib);
    }
  }

  /**
   * Generate all JavaScript shims
   */
  generateAllShims(): string {
    let allShims = `// VB6 Declare Function/Sub Shims\n`;
    allShims += `// Generated automatically - do not edit\n\n`;

    for (const [funcName, shimCode] of this.shimFunctions.entries()) {
      allShims += shimCode + '\n';
    }

    // Add utility functions
    allShims += this.generateUtilityFunctions();

    return allShims;
  }

  /**
   * Generate utility functions for API simulation
   */
  private generateUtilityFunctions(): string {
    return `
// Utility functions for API simulation

// Convert VB6 string to null-terminated C string
function vb6StringToCString(vb6String) {
  return vb6String + '\\0';
}

// Convert C string to VB6 string
function cStringToVB6String(cString) {
  const nullIndex = cString.indexOf('\\0');
  return nullIndex >= 0 ? cString.substring(0, nullIndex) : cString;
}

// Simulate HRESULT success/failure
const S_OK = 0;
const E_FAIL = 0x80004005;
const E_NOTIMPL = 0x80004001;

// Common Windows constants
const HWND_DESKTOP = 0;
const SW_HIDE = 0;
const SW_SHOW = 5;
const SW_MAXIMIZE = 3;
const SW_MINIMIZE = 6;

// MessageBox constants
const MB_OK = 0;
const MB_OKCANCEL = 1;
const MB_YESNO = 4;
const IDOK = 1;
const IDCANCEL = 2;
const IDYES = 6;
const IDNO = 7;
`;
  }

  /**
   * Convert value to JavaScript representation
   */
  private valueToJS(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();

    return '""';
  }

  /**
   * Validate declare function call
   */
  validateDeclareCall(functionName: string, args: any[]): { valid: boolean; errors: string[] } {
    const declareFunc = this.getDeclaredFunction(functionName);
    if (!declareFunc) {
      return { valid: false, errors: [`Function ${functionName} is not declared`] };
    }

    const errors: string[] = [];

    // Check argument count
    const requiredParams = declareFunc.parameters.filter(p => !p.optional).length;
    if (args.length < requiredParams) {
      errors.push(
        `Function ${functionName} requires at least ${requiredParams} arguments, got ${args.length}`
      );
    }

    if (args.length > declareFunc.parameters.length) {
      errors.push(
        `Function ${functionName} accepts at most ${declareFunc.parameters.length} arguments, got ${args.length}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate TypeScript definitions
   */
  generateTypeScriptDefinitions(): string {
    let tsCode = `// VB6 Declare Function/Sub TypeScript Definitions\n\n`;

    for (const [name, declareFunc] of this.declaredFunctions.entries()) {
      tsCode += `// Declared in: ${declareFunc.module} (${declareFunc.library})\n`;
      tsCode += `declare function ${declareFunc.name}(`;

      const paramSignatures = declareFunc.parameters.map(param => {
        const tsType = this.mapVB6TypeToTypeScript(param.type);
        const optional = param.optional ? '?' : '';
        return `${param.name}${optional}: ${tsType}`;
      });

      tsCode += paramSignatures.join(', ');
      tsCode += ')';

      if (declareFunc.isFunction && declareFunc.returnType) {
        const returnType = this.mapVB6TypeToTypeScript(declareFunc.returnType);
        tsCode += `: ${returnType}`;
      } else {
        tsCode += ': void';
      }

      tsCode += ';\n\n';
    }

    return tsCode;
  }

  /**
   * Map VB6 types to TypeScript types
   */
  private mapVB6TypeToTypeScript(vb6Type: string): string {
    switch (vb6Type.toLowerCase()) {
      case 'long':
      case 'integer':
      case 'byte':
      case 'single':
      case 'double':
      case 'currency':
        return 'number';
      case 'string':
        return 'string';
      case 'boolean':
        return 'boolean';
      case 'variant':
      case 'any':
        return 'any';
      case 'object':
        return 'object';
      default:
        return 'any';
    }
  }

  /**
   * Clear all declarations (for new compilation)
   */
  clear() {
    this.declaredFunctions.clear();
    this.shimFunctions.clear();
  }

  /**
   * Get all declared functions in current module
   */
  getModuleDeclaredFunctions(): VB6DeclareFunction[] {
    return Array.from(this.declaredFunctions.values()).filter(
      func => func.module === this.currentModule
    );
  }

  /**
   * Export declare data for serialization
   */
  export(): { functions: { [key: string]: VB6DeclareFunction }; shims: { [key: string]: string } } {
    const functions: { [key: string]: VB6DeclareFunction } = {};
    const shims: { [key: string]: string } = {};

    for (const [key, value] of this.declaredFunctions.entries()) {
      functions[key] = value;
    }

    for (const [key, value] of this.shimFunctions.entries()) {
      shims[key] = value;
    }

    return { functions, shims };
  }

  /**
   * Import declare data from serialization
   */
  import(data: {
    functions: { [key: string]: VB6DeclareFunction };
    shims: { [key: string]: string };
  }) {
    this.declaredFunctions.clear();
    this.shimFunctions.clear();

    for (const [key, value] of Object.entries(data.functions)) {
      this.declaredFunctions.set(key, value);
    }

    for (const [key, value] of Object.entries(data.shims)) {
      this.shimFunctions.set(key, value);
    }
  }
}

// Example VB6 Declare statements
export const VB6DeclareExamples = {
  // Windows API examples
  GetWindowsDirectory: `
Declare Function GetWindowsDirectory Lib "kernel32" Alias "GetWindowsDirectoryA" (ByVal lpBuffer As String, ByVal nSize As Long) As Long
`,

  MessageBox: `
Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hWnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long
`,

  Sleep: `
Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
`,

  GetPrivateProfileString: `
Declare Function GetPrivateProfileString Lib "kernel32" Alias "GetPrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As String, ByVal lpDefault As String, ByVal lpReturnedString As String, ByVal nSize As Long, ByVal lpFileName As String) As Long
`,

  ShellExecute: `
Declare Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" (ByVal hWnd As Long, ByVal lpOperation As String, ByVal lpFile As String, ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long
`,

  GetTickCount: `
Declare Function GetTickCount Lib "kernel32" () As Long
`,

  FindWindow: `
Declare Function FindWindow Lib "user32" Alias "FindWindowA" (ByVal lpClassName As String, ByVal lpWindowName As String) As Long
`,
};

// Global declare processor instance
export const declareProcessor = new VB6DeclareProcessor();
