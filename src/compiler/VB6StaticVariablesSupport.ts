/**
 * VB6 Static Variables Support Implementation
 * 
 * Complete support for VB6 Static variables that preserve values between calls
 */

export interface VB6StaticVariable {
  name: string;
  type: string;
  initialValue: any;
  currentValue: any;
  function: string; // Function/Sub name where declared
  module: string;
  line: number;
  scope: 'local' | 'global'; // Local to function or global static
}

export interface VB6StaticDeclaration {
  variables: VB6StaticVariable[];
  function: string;
  module: string;
  line: number;
}

export class VB6StaticVariablesProcessor {
  private staticVariables: Map<string, VB6StaticVariable> = new Map();
  private staticStorage: Map<string, any> = new Map(); // Runtime storage
  private currentModule: string = '';
  private currentFunction: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  setCurrentFunction(functionName: string) {
    this.currentFunction = functionName;
  }

  /**
   * Parse VB6 Static variable declaration
   * Examples:
   * Static counter As Integer
   * Static initialized As Boolean = False
   * Static values(10) As String
   */
  parseStaticDeclaration(code: string, line: number): VB6StaticDeclaration | null {
    const staticRegex = /^Static\s+(.+)$/i;
    const match = code.match(staticRegex);
    
    if (!match) return null;

    const variableList = match[1];
    const variables = this.parseVariableList(variableList, line);

    return {
      variables,
      function: this.currentFunction,
      module: this.currentModule,
      line
    };
  }

  /**
   * Parse variable list from Static declaration
   */
  private parseVariableList(variableList: string, line: number): VB6StaticVariable[] {
    const variables: VB6StaticVariable[] = [];
    const parts = variableList.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Parse: variableName [As Type] [= initialValue]
      const varRegex = /^(\w+)(?:\(([^)]*)\))?(?:\s+As\s+(.+?))?(?:\s*=\s*(.+))?$/i;
      const match = trimmed.match(varRegex);

      if (match) {
        const varName = match[1];
        const arrayBounds = match[2]; // For arrays
        const varType = match[3] || 'Variant';
        const initialValueStr = match[4];

        let initialValue = this.getTypeDefaultValue(varType);
        if (initialValueStr) {
          initialValue = this.parseInitialValue(initialValueStr, varType);
        }

        // Handle arrays
        if (arrayBounds) {
          initialValue = this.createStaticArray(arrayBounds, varType);
        }

        const staticVar: VB6StaticVariable = {
          name: varName,
          type: arrayBounds ? `${varType}()` : varType,
          initialValue,
          currentValue: initialValue,
          function: this.currentFunction,
          module: this.currentModule,
          line,
          scope: this.currentFunction ? 'local' : 'global'
        };

        variables.push(staticVar);
      }
    }

    return variables;
  }

  /**
   * Parse initial value
   */
  private parseInitialValue(value: string, type: string): any {
    const trimmed = value.trim();
    
    // String literals
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.substring(1, trimmed.length - 1);
    }
    
    // Numeric values
    if (!isNaN(Number(trimmed))) {
      const num = Number(trimmed);
      
      switch (type.toLowerCase()) {
        case 'integer':
        case 'long':
          return Math.floor(num);
        case 'single':
        case 'double':
        case 'currency':
          return num;
        default:
          return num;
      }
    }
    
    // Boolean values
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // VB6 constants
    if (trimmed.toLowerCase() === 'nothing') return null;
    if (trimmed.toLowerCase() === 'empty') return undefined;
    if (trimmed.toLowerCase() === 'null') return null;
    
    // Date literals
    if (trimmed.startsWith('#') && trimmed.endsWith('#')) {
      const dateStr = trimmed.substring(1, trimmed.length - 1);
      return new Date(dateStr);
    }
    
    return trimmed; // Return as string for further processing
  }

  /**
   * Create static array
   */
  private createStaticArray(bounds: string, elementType: string): any[] {
    const dimensions = bounds.split(',').map(bound => {
      const trimmed = bound.trim();
      if (trimmed.includes(' To ')) {
        // INTEGER OVERFLOW FIX: Validate parseInt results to prevent NaN in calculations
        const parts = trimmed.split(' To ').map(s => {
          const parsed = parseInt(s.trim(), 10);
          if (isNaN(parsed)) {
            throw new Error(`Invalid array bound: '${s.trim()}' is not a valid integer`);
          }
          return parsed;
        });
        if (parts.length !== 2) {
          throw new Error(`Invalid array bounds format: '${trimmed}'`);
        }
        const [start, end] = parts;
        return { start, end, size: end - start + 1 };
      } else {
        // INTEGER OVERFLOW FIX: Validate parseInt results to prevent NaN in calculations
        const endIndex = parseInt(trimmed, 10);
        if (isNaN(endIndex) || endIndex < 0) {
          throw new Error(`Invalid array size: '${trimmed}' is not a valid positive integer`);
        }
        const size = endIndex + 1; // VB6 arrays are 0-based by default
        return { start: 0, end: endIndex, size };
      }
    });

    // For simplicity, create 1D array (could be extended for multi-dimensional)
    const size = dimensions[0].size;
    const defaultValue = this.getTypeDefaultValue(elementType);
    return new Array(size).fill(defaultValue);
  }

  /**
   * Get default value for VB6 type
   */
  private getTypeDefaultValue(type: string): any {
    switch (type.toLowerCase()) {
      case 'integer':
      case 'long':
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
      case 'date':
        return new Date(0); // VB6 date zero
      case 'variant':
        return undefined; // Empty variant
      case 'object':
        return null; // Nothing
      default:
        return null; // Custom types default to Nothing
    }
  }

  /**
   * Register static variable
   */
  registerStaticVariable(staticVar: VB6StaticVariable) {
    const key = this.getStaticVariableKey(staticVar);
    this.staticVariables.set(key, staticVar);
    
    // Initialize storage if not exists
    if (!this.staticStorage.has(key)) {
      this.staticStorage.set(key, staticVar.initialValue);
    }
  }

  /**
   * Get static variable key for storage
   */
  private getStaticVariableKey(staticVar: VB6StaticVariable): string {
    if (staticVar.scope === 'global') {
      return `${staticVar.module}.${staticVar.name}`;
    } else {
      return `${staticVar.module}.${staticVar.function}.${staticVar.name}`;
    }
  }

  /**
   * Get static variable value
   */
  getStaticValue(module: string, functionName: string | null, variableName: string): any {
    const key = functionName 
      ? `${module}.${functionName}.${variableName}`
      : `${module}.${variableName}`;
    
    return this.staticStorage.get(key);
  }

  /**
   * Set static variable value
   */
  setStaticValue(module: string, functionName: string | null, variableName: string, value: any) {
    const key = functionName 
      ? `${module}.${functionName}.${variableName}`
      : `${module}.${variableName}`;
    
    this.staticStorage.set(key, value);
  }

  /**
   * Generate JavaScript for static variables
   */
  generateJavaScript(declaration: VB6StaticDeclaration): string {
    let jsCode = `// Static variables for ${declaration.function || 'module'}\n`;
    
    // Generate static storage object
    jsCode += `if (typeof __staticStorage === 'undefined') {\n`;
    jsCode += `  var __staticStorage = {};\n`;
    jsCode += `}\n\n`;

    for (const staticVar of declaration.variables) {
      const key = this.getStaticVariableKey(staticVar);
      
      jsCode += `// Static variable: ${staticVar.name}\n`;
      jsCode += `if (typeof __staticStorage['${key}'] === 'undefined') {\n`;
      jsCode += `  __staticStorage['${key}'] = ${this.valueToJS(staticVar.initialValue)};\n`;
      jsCode += `}\n`;
      jsCode += `var ${staticVar.name} = __staticStorage['${key}'];\n\n`;
    }

    // Generate helper functions for accessing static variables
    jsCode += this.generateStaticHelpers(declaration);

    return jsCode;
  }

  /**
   * Generate helper functions for static variable access
   */
  private generateStaticHelpers(declaration: VB6StaticDeclaration): string {
    let jsCode = `// Static variable helpers\n`;
    
    for (const staticVar of declaration.variables) {
      const key = this.getStaticVariableKey(staticVar);
      const varName = staticVar.name;
      
      jsCode += `function set${varName}Static(value) {\n`;
      jsCode += `  __staticStorage['${key}'] = value;\n`;
      jsCode += `  ${varName} = value;\n`;
      jsCode += `}\n\n`;
      
      jsCode += `function get${varName}Static() {\n`;
      jsCode += `  return __staticStorage['${key}'];\n`;
      jsCode += `}\n\n`;
    }

    // Function exit handler to save static values
    if (declaration.function) {
      jsCode += `// Save static values on function exit\n`;
      jsCode += `function save${declaration.function}StaticVars() {\n`;
      
      for (const staticVar of declaration.variables) {
        const key = this.getStaticVariableKey(staticVar);
        jsCode += `  __staticStorage['${key}'] = ${staticVar.name};\n`;
      }
      
      jsCode += `}\n\n`;
    }

    return jsCode;
  }

  /**
   * Generate function wrapper with static variable handling
   */
  generateFunctionWrapper(functionName: string, originalBody: string): string {
    const staticVars = this.getStaticVariablesForFunction(functionName);
    if (staticVars.length === 0) {
      return originalBody; // No static variables
    }

    let jsCode = `// Function ${functionName} with static variables\n`;
    jsCode += `function ${functionName}(...args) {\n`;
    
    // Initialize static variables
    for (const staticVar of staticVars) {
      const key = this.getStaticVariableKey(staticVar);
      jsCode += `  if (typeof __staticStorage['${key}'] === 'undefined') {\n`;
      jsCode += `    __staticStorage['${key}'] = ${this.valueToJS(staticVar.initialValue)};\n`;
      jsCode += `  }\n`;
      jsCode += `  var ${staticVar.name} = __staticStorage['${key}'];\n`;
    }
    
    jsCode += `\n`;
    jsCode += `  // Original function body\n`;
    jsCode += `  try {\n`;
    jsCode += `    ${originalBody}\n`;
    jsCode += `  } finally {\n`;
    jsCode += `    // Save static variables\n`;
    
    for (const staticVar of staticVars) {
      const key = this.getStaticVariableKey(staticVar);
      jsCode += `    __staticStorage['${key}'] = ${staticVar.name};\n`;
    }
    
    jsCode += `  }\n`;
    jsCode += `}\n`;
    
    return jsCode;
  }

  /**
   * Get static variables for a specific function
   */
  private getStaticVariablesForFunction(functionName: string): VB6StaticVariable[] {
    return Array.from(this.staticVariables.values())
      .filter(v => v.function === functionName && v.module === this.currentModule);
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
    if (value instanceof Date) return `new Date("${value.toISOString()}")`;
    if (Array.isArray(value)) {
      const elements = value.map(v => this.valueToJS(v)).join(', ');
      return `[${elements}]`;
    }
    
    return `"${value}"`; // Default to string representation
  }

  /**
   * Generate TypeScript interface
   */
  generateTypeScript(declaration: VB6StaticDeclaration): string {
    let tsCode = `// Static variables interface\n`;
    tsCode += `interface ${declaration.function || this.currentModule}StaticVars {\n`;
    
    for (const staticVar of declaration.variables) {
      const tsType = this.mapVB6TypeToTypeScript(staticVar.type);
      tsCode += `  ${staticVar.name}: ${tsType};\n`;
    }
    
    tsCode += `}\n\n`;
    
    // Static storage interface
    tsCode += `interface StaticStorage {\n`;
    for (const staticVar of declaration.variables) {
      const key = this.getStaticVariableKey(staticVar);
      const tsType = this.mapVB6TypeToTypeScript(staticVar.type);
      tsCode += `  '${key}': ${tsType};\n`;
    }
    tsCode += `}\n`;
    
    return tsCode;
  }

  /**
   * Map VB6 types to TypeScript types
   */
  private mapVB6TypeToTypeScript(vb6Type: string): string {
    const baseType = vb6Type.replace(/\(\)$/, ''); // Remove array indicator
    const isArray = vb6Type.endsWith('()');
    
    let tsType: string;
    switch (baseType.toLowerCase()) {
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
      case 'byte':
        tsType = 'number';
        break;
      case 'string':
        tsType = 'string';
        break;
      case 'boolean':
        tsType = 'boolean';
        break;
      case 'date':
        tsType = 'Date';
        break;
      case 'variant':
        tsType = 'any';
        break;
      case 'object':
        tsType = 'object | null';
        break;
      default:
        tsType = baseType; // Assume it's a custom type
    }
    
    return isArray ? `${tsType}[]` : tsType;
  }

  /**
   * Reset static variables (for testing)
   */
  resetStaticVariables() {
    this.staticStorage.clear();
  }

  /**
   * Clear all static data (for new compilation)
   */
  clear() {
    this.staticVariables.clear();
    this.staticStorage.clear();
  }

  /**
   * Get all static variables in current module
   */
  getModuleStaticVariables(): VB6StaticVariable[] {
    return Array.from(this.staticVariables.values())
      .filter(v => v.module === this.currentModule);
  }

  /**
   * Export static data for serialization
   */
  export(): { variables: { [key: string]: VB6StaticVariable }, storage: { [key: string]: any } } {
    const variables: { [key: string]: VB6StaticVariable } = {};
    const storage: { [key: string]: any } = {};
    
    for (const [key, value] of this.staticVariables.entries()) {
      variables[key] = value;
    }
    
    for (const [key, value] of this.staticStorage.entries()) {
      storage[key] = value;
    }
    
    return { variables, storage };
  }

  /**
   * Import static data from serialization
   */
  import(data: { variables: { [key: string]: VB6StaticVariable }, storage: { [key: string]: any } }) {
    this.staticVariables.clear();
    this.staticStorage.clear();
    
    for (const [key, value] of Object.entries(data.variables)) {
      this.staticVariables.set(key, value);
    }
    
    for (const [key, value] of Object.entries(data.storage)) {
      this.staticStorage.set(key, value);
    }
  }
}

// Example VB6 Static variable patterns
export const VB6StaticVariableExamples = {
  // Simple static counter
  StaticCounter: `
Function GetNextID() As Long
    Static counter As Long
    counter = counter + 1
    GetNextID = counter
End Function
`,

  // Static array
  StaticArray: `
Function GetCachedValue(index As Integer) As String
    Static cache(100) As String
    Static initialized As Boolean
    
    If Not initialized Then
        ' Initialize cache
        For i = 0 To 100
            cache(i) = "Item " & i
        Next i
        initialized = True
    End If
    
    GetCachedValue = cache(index)
End Function
`,

  // Static object
  StaticObject: `
Function GetDatabase() As Object
    Static db As Object
    
    If db Is Nothing Then
        Set db = CreateObject("ADODB.Connection")
        db.Open "connectionstring"
    End If
    
    Set GetDatabase = db
End Function
`,

  // Multiple static variables
  MultipleStatics: `
Function ProcessData(data As String) As String
    Static processCount As Long
    Static lastData As String
    Static results As Collection
    
    If results Is Nothing Then
        Set results = New Collection
    End If
    
    processCount = processCount + 1
    lastData = data
    
    ProcessData = "Processed: " & data & " (Count: " & processCount & ")"
End Function
`
};

// Global static variables processor instance
export const staticVariablesProcessor = new VB6StaticVariablesProcessor();