/**
 * VB6 Optional Parameters Support Implementation
 * 
 * Complete support for VB6 Optional parameters with default values
 */

export interface VB6OptionalParameter {
  name: string;
  type: string;
  defaultValue: any;
  byRef: boolean;
  position: number;
}

export interface VB6FunctionSignature {
  name: string;
  returnType?: string;
  parameters: VB6OptionalParameter[];
  requiredParams: number;
  optionalParams: number;
  module: string;
  isFunction: boolean; // true for Function, false for Sub
  public: boolean;
  static: boolean;
}

export class VB6OptionalParametersProcessor {
  private functions: Map<string, VB6FunctionSignature> = new Map();
  private currentModule: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 function/sub declaration with optional parameters
   * Examples:
   * Function Calculate(x As Double, Optional y As Double = 1.0) As Double
   * Sub ShowMessage(msg As String, Optional title As String = "Information")
   */
  parseFunctionDeclaration(code: string, line: number): VB6FunctionSignature | null {
    const functionRegex = /^(Public\s+|Private\s+|Friend\s+)?(Static\s+)?(Function|Sub)\s+(\w+)\s*\(([^)]*)\)(?:\s+As\s+(.+))?$/i;
    const match = code.match(functionRegex);
    
    if (!match) return null;

    const scope = match[1] ? match[1].trim().toLowerCase() : 'public';
    const isStatic = match[2] ? true : false;
    const functionType = match[3].toLowerCase();
    const functionName = match[4];
    const parameterList = match[5] || '';
    const returnType = match[6];

    const parameters = this.parseParameterList(parameterList);
    const requiredParams = parameters.filter(p => p.defaultValue === undefined).length;
    const optionalParams = parameters.length - requiredParams;

    return {
      name: functionName,
      returnType,
      parameters,
      requiredParams,
      optionalParams,
      module: this.currentModule,
      isFunction: functionType === 'function',
      public: scope === 'public',
      static: isStatic
    };
  }

  /**
   * Parse parameter list with optional parameters
   */
  private parseParameterList(parameterList: string): VB6OptionalParameter[] {
    if (!parameterList.trim()) return [];

    const parameters: VB6OptionalParameter[] = [];
    const params = parameterList.split(',');
    let position = 0;

    for (const param of params) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      const paramRegex = /^(Optional\s+)?(ByRef\s+|ByVal\s+)?(\w+)(?:\s+As\s+(.+?))?(?:\s*=\s*(.+))?$/i;
      const match = trimmed.match(paramRegex);

      if (match) {
        const isOptional = match[1] ? true : false;
        const byRef = match[2] ? match[2].toLowerCase().includes('byref') : false;
        const paramName = match[3];
        const paramType = match[4] || 'Variant';
        const defaultValueStr = match[5];

        let defaultValue = undefined;
        if (isOptional || defaultValueStr) {
          defaultValue = defaultValueStr ? this.parseDefaultValue(defaultValueStr, paramType) : this.getTypeDefaultValue(paramType);
        }

        parameters.push({
          name: paramName,
          type: paramType,
          defaultValue,
          byRef,
          position
        });
      }

      position++;
    }

    return parameters;
  }

  /**
   * Parse default value from string
   */
  private parseDefaultValue(value: string, type: string): any {
    const trimmed = value.trim();
    
    // String literals
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.substring(1, trimmed.length - 1);
    }
    
    // Numeric values
    if (!isNaN(Number(trimmed))) {
      const num = Number(trimmed);
      
      // Return appropriate type based on parameter type
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
    
    // Enum or constant values
    return trimmed; // Return as string for further processing
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
   * Register function signature
   */
  registerFunction(signature: VB6FunctionSignature) {
    const key = signature.public ? signature.name : `${this.currentModule}.${signature.name}`;
    this.functions.set(key, signature);
  }

  /**
   * Get function signature
   */
  getFunction(name: string): VB6FunctionSignature | undefined {
    return this.functions.get(name) || this.functions.get(`${this.currentModule}.${name}`);
  }

  /**
   * Generate JavaScript function with optional parameters
   * @param signature The function signature
   * @param bodyCode Optional transpiled JavaScript body code
   */
  generateJavaScript(signature: VB6FunctionSignature, bodyCode?: string): string {
    const funcName = signature.name;
    const params = signature.parameters;

    let jsCode = `// ${signature.isFunction ? 'Function' : 'Sub'}: ${funcName}\n`;
    jsCode += `${funcName}: function(`;

    // Generate parameter list (all parameters, but with defaults)
    const paramNames = params.map(p => p.name);
    jsCode += paramNames.join(', ');
    jsCode += `) {\n`;

    // Handle optional parameters with default values
    for (const param of params) {
      if (param.defaultValue !== undefined) {
        jsCode += `  if (${param.name} === undefined) {\n`;
        jsCode += `    ${param.name} = ${this.valueToJS(param.defaultValue)};\n`;
        jsCode += `  }\n`;
      }
    }

    // Add IsMissing function simulation
    jsCode += `\n  // IsMissing function for optional parameters\n`;
    jsCode += `  const IsMissing = (param) => param === undefined;\n\n`;

    // Add parameter validation
    jsCode += this.generateParameterValidation(signature);

    // Add function body if provided, otherwise generate a stub
    if (bodyCode && bodyCode.trim()) {
      // Indent the body code
      const indentedBody = bodyCode.split('\n')
        .map(line => line ? '  ' + line : line)
        .join('\n');
      jsCode += indentedBody;
      if (!indentedBody.endsWith('\n')) jsCode += '\n';
    } else if (signature.isFunction) {
      // Default return for functions without body
      jsCode += `  return ${this.getTypeDefaultValue(signature.returnType || 'Variant')};\n`;
    }

    jsCode += `},\n\n`;

    return jsCode;
  }

  /**
   * Generate JavaScript function as a class method
   * @param signature The function signature
   * @param bodyCode Optional transpiled JavaScript body code
   */
  generateJavaScriptMethod(signature: VB6FunctionSignature, bodyCode?: string): string {
    const funcName = signature.name;
    const params = signature.parameters;

    let jsCode = `${funcName}(`;

    // Generate parameter list
    const paramNames = params.map(p => p.name);
    jsCode += paramNames.join(', ');
    jsCode += `) {\n`;

    // Handle optional parameters with default values
    for (const param of params) {
      if (param.defaultValue !== undefined) {
        jsCode += `  if (${param.name} === undefined) ${param.name} = ${this.valueToJS(param.defaultValue)};\n`;
      }
    }

    // Add function body if provided
    if (bodyCode && bodyCode.trim()) {
      const indentedBody = bodyCode.split('\n')
        .map(line => line ? '  ' + line : line)
        .join('\n');
      jsCode += indentedBody;
      if (!indentedBody.endsWith('\n')) jsCode += '\n';
    } else if (signature.isFunction) {
      jsCode += `  return ${this.getTypeDefaultValue(signature.returnType || 'Variant')};\n`;
    }

    jsCode += `}\n`;

    return jsCode;
  }

  /**
   * Generate ES6 arrow function with optional parameters
   * @param signature The function signature
   * @param bodyCode Optional transpiled JavaScript body code
   */
  generateArrowFunction(signature: VB6FunctionSignature, bodyCode?: string): string {
    const funcName = signature.name;
    const params = signature.parameters;

    // Build parameter list with default values inline
    const paramList = params.map(p => {
      if (p.defaultValue !== undefined) {
        return `${p.name} = ${this.valueToJS(p.defaultValue)}`;
      }
      return p.name;
    }).join(', ');

    let jsCode = `const ${funcName} = (${paramList}) => {\n`;

    // Add function body if provided
    if (bodyCode && bodyCode.trim()) {
      const indentedBody = bodyCode.split('\n')
        .map(line => line ? '  ' + line : line)
        .join('\n');
      jsCode += indentedBody;
      if (!indentedBody.endsWith('\n')) jsCode += '\n';
    } else if (signature.isFunction) {
      jsCode += `  return ${this.getTypeDefaultValue(signature.returnType || 'Variant')};\n`;
    }

    jsCode += `};\n`;

    return jsCode;
  }

  /**
   * Generate parameter validation code
   */
  private generateParameterValidation(signature: VB6FunctionSignature): string {
    let validationCode = '';
    
    for (const param of signature.parameters) {
      if (param.defaultValue === undefined) {
        // Required parameter
        validationCode += `  if (${param.name} === undefined) {\n`;
        validationCode += `    throw new Error('Required parameter ${param.name} is missing');\n`;
        validationCode += `  }\n`;
      }
      
      // Type validation (simplified)
      if (param.type.toLowerCase() !== 'variant') {
        validationCode += `  // Type validation for ${param.name} (${param.type})\n`;
        validationCode += this.generateTypeValidation(param);
      }
    }
    
    return validationCode + '\n';
  }

  /**
   * Generate type validation for parameter
   */
  private generateTypeValidation(param: VB6OptionalParameter): string {
    const paramName = param.name;
    const paramType = param.type.toLowerCase();
    
    let validation = '';
    
    switch (paramType) {
      case 'integer':
      case 'long':
      case 'byte':
        validation += `  if (${paramName} !== undefined && (!Number.isInteger(${paramName}) || ${paramName} < ${this.getTypeMinValue(paramType)} || ${paramName} > ${this.getTypeMaxValue(paramType)})) {\n`;
        validation += `    throw new Error('Parameter ${paramName} must be a valid ${param.type}');\n`;
        validation += `  }\n`;
        break;
      case 'single':
      case 'double':
      case 'currency':
        validation += `  if (${paramName} !== undefined && typeof ${paramName} !== 'number') {\n`;
        validation += `    throw new Error('Parameter ${paramName} must be a number');\n`;
        validation += `  }\n`;
        break;
      case 'string':
        validation += `  if (${paramName} !== undefined && typeof ${paramName} !== 'string') {\n`;
        validation += `    throw new Error('Parameter ${paramName} must be a string');\n`;
        validation += `  }\n`;
        break;
      case 'boolean':
        validation += `  if (${paramName} !== undefined && typeof ${paramName} !== 'boolean') {\n`;
        validation += `    throw new Error('Parameter ${paramName} must be a boolean');\n`;
        validation += `  }\n`;
        break;
      case 'date':
        validation += `  if (${paramName} !== undefined && !(${paramName} instanceof Date)) {\n`;
        validation += `    throw new Error('Parameter ${paramName} must be a Date');\n`;
        validation += `  }\n`;
        break;
      case 'object':
        validation += `  if (${paramName} !== undefined && ${paramName} !== null && typeof ${paramName} !== 'object') {\n`;
        validation += `    throw new Error('Parameter ${paramName} must be an object or Nothing');\n`;
        validation += `  }\n`;
        break;
    }
    
    return validation;
  }

  /**
   * Get minimum value for numeric type
   */
  private getTypeMinValue(type: string): number {
    switch (type.toLowerCase()) {
      case 'byte': return 0;
      case 'integer': return -32768;
      case 'long': return -2147483648;
      default: return Number.MIN_SAFE_INTEGER;
    }
  }

  /**
   * Get maximum value for numeric type
   */
  private getTypeMaxValue(type: string): number {
    switch (type.toLowerCase()) {
      case 'byte': return 255;
      case 'integer': return 32767;
      case 'long': return 2147483647;
      default: return Number.MAX_SAFE_INTEGER;
    }
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
    
    return `"${value}"`; // Default to string representation
  }

  /**
   * Generate function call with optional parameters
   */
  generateFunctionCall(functionName: string, args: string[]): string {
    const signature = this.getFunction(functionName);
    if (!signature) {
      return `${functionName}(${args.join(', ')})`;
    }
    
    // Pad arguments with undefined for missing optional parameters
    const paddedArgs = [...args];
    while (paddedArgs.length < signature.parameters.length) {
      paddedArgs.push('undefined');
    }
    
    return `${functionName}(${paddedArgs.join(', ')})`;
  }

  /**
   * Generate TypeScript interface
   */
  generateTypeScript(signature: VB6FunctionSignature): string {
    const funcName = signature.name;
    const params = signature.parameters;
    
    let tsSignature = `${funcName}(`;
    
    const paramSignatures = params.map(param => {
      const isOptional = param.defaultValue !== undefined;
      const paramType = this.mapVB6TypeToTypeScript(param.type);
      return `${param.name}${isOptional ? '?' : ''}: ${paramType}`;
    });
    
    tsSignature += paramSignatures.join(', ');
    tsSignature += ')';
    
    if (signature.isFunction && signature.returnType) {
      const returnType = this.mapVB6TypeToTypeScript(signature.returnType);
      tsSignature += `: ${returnType}`;
    } else if (!signature.isFunction) {
      tsSignature += ': void';
    }
    
    return tsSignature + ';';
  }

  /**
   * Map VB6 types to TypeScript types
   */
  private mapVB6TypeToTypeScript(vb6Type: string): string {
    switch (vb6Type.toLowerCase()) {
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
      case 'byte':
        return 'number';
      case 'string':
        return 'string';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'Date';
      case 'variant':
        return 'any';
      case 'object':
        return 'object | null';
      default:
        return vb6Type; // Assume it's a custom type
    }
  }

  /**
   * Generate IsMissing function implementation
   */
  generateIsMissingFunction(): string {
    return `
// IsMissing function for checking optional parameters
function IsMissing(parameter) {
  return parameter === undefined;
}

// Helper function for parameter default values
function getDefaultValue(value, type) {
  if (value !== undefined) return value;
  
  switch (type?.toLowerCase()) {
    case 'integer':
    case 'long':
    case 'byte':
    case 'single':
    case 'double':
    case 'currency':
      return 0;
    case 'string':
      return '';
    case 'boolean':
      return false;
    case 'date':
      return new Date(0);
    case 'object':
      return null;
    default:
      return undefined; // Variant Empty
  }
}
`;
  }

  /**
   * Validate function calls with optional parameters
   */
  validateFunctionCall(functionName: string, args: any[]): { valid: boolean, errors: string[] } {
    const signature = this.getFunction(functionName);
    if (!signature) {
      return { valid: true, errors: [] }; // Can't validate unknown function
    }
    
    const errors: string[] = [];
    
    // Check minimum required parameters
    if (args.length < signature.requiredParams) {
      errors.push(`Function ${functionName} requires at least ${signature.requiredParams} parameters, got ${args.length}`);
    }
    
    // Check maximum parameters
    if (args.length > signature.parameters.length) {
      errors.push(`Function ${functionName} accepts at most ${signature.parameters.length} parameters, got ${args.length}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear all functions (for new compilation)
   */
  clear() {
    this.functions.clear();
  }

  /**
   * Get all functions in current module
   */
  getModuleFunctions(): VB6FunctionSignature[] {
    return Array.from(this.functions.values())
      .filter(f => f.module === this.currentModule);
  }

  /**
   * Export function data for serialization
   */
  export(): { [key: string]: VB6FunctionSignature } {
    const result: { [key: string]: VB6FunctionSignature } = {};
    for (const [key, value] of this.functions.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Import function data from serialization
   */
  import(data: { [key: string]: VB6FunctionSignature }) {
    this.functions.clear();
    for (const [key, value] of Object.entries(data)) {
      this.functions.set(key, value);
    }
  }
}

// Example VB6 functions with optional parameters
export const VB6OptionalParameterExamples = {
  // Simple optional parameter
  FormatMessage: `
Function FormatMessage(msg As String, Optional prefix As String = "Info") As String
    FormatMessage = prefix & ": " & msg
End Function
`,

  // Multiple optional parameters
  CreateRectangle: `
Function CreateRectangle(Optional x As Long = 0, Optional y As Long = 0, Optional width As Long = 100, Optional height As Long = 100) As Rectangle
    Dim rect As New Rectangle
    rect.x = x
    rect.y = y
    rect.width = width
    rect.height = height
    Set CreateRectangle = rect
End Function
`,

  // Mixed required and optional
  ShowMessage: `
Sub ShowMessage(message As String, Optional title As String = "Information", Optional buttons As Long = vbOKOnly)
    MsgBox message, buttons, title
End Sub
`,

  // Optional with IsMissing
  CalculateTotal: `
Function CalculateTotal(price As Double, Optional tax As Variant, Optional discount As Variant) As Double
    Dim total As Double
    total = price
    
    If Not IsMissing(tax) Then
        total = total + (total * tax)
    End If
    
    If Not IsMissing(discount) Then
        total = total - discount
    End If
    
    CalculateTotal = total
End Function
`
};

// Global optional parameters processor instance
export const optionalParametersProcessor = new VB6OptionalParametersProcessor();