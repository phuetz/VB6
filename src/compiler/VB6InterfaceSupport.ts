/**
 * VB6 Interface Support Implementation
 * 
 * Complete support for VB6 Interface declarations and Implements statement
 */

export interface VB6InterfaceMethod {
  name: string;
  parameters: VB6InterfaceParameter[];
  returnType?: string; // undefined for Sub
  isFunction: boolean;
  line: number;
}

export interface VB6InterfaceParameter {
  name: string;
  type: string;
  byRef: boolean;
  optional: boolean;
  defaultValue?: any;
}

export interface VB6InterfaceProperty {
  name: string;
  type: string;
  readOnly: boolean;
  writeOnly: boolean;
  line: number;
}

export interface VB6InterfaceDeclaration {
  name: string;
  methods: VB6InterfaceMethod[];
  properties: VB6InterfaceProperty[];
  public: boolean;
  module: string;
  line: number;
}

export interface VB6ImplementsDeclaration {
  className: string;
  interfaceName: string;
  implementedMethods: Map<string, VB6InterfaceMethodImpl>;
  implementedProperties: Map<string, VB6InterfacePropertyImpl>;
  module: string;
  line: number;
}

export interface VB6InterfaceMethodImpl {
  interfaceMethod: string; // Original interface method name
  implementationMethod: string; // Class method implementing it
  body: string[];
  line: number;
}

export interface VB6InterfacePropertyImpl {
  interfaceProperty: string;
  implementationProperty: string;
  getter?: string; // Get method name
  setter?: string; // Let/Set method name
  line: number;
}

export class VB6InterfaceProcessor {
  private interfaces: Map<string, VB6InterfaceDeclaration> = new Map();
  private implementations: Map<string, VB6ImplementsDeclaration> = new Map();
  private currentModule: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 Interface declaration
   * Example:
   * Public Interface IComparable
   *     Function CompareTo(obj As Object) As Integer
   *     Property Get Value() As Variant
   *     Property Let Value(ByVal vNewValue As Variant)
   * End Interface
   */
  parseInterfaceDeclaration(code: string, line: number): VB6InterfaceDeclaration | null {
    const interfaceRegex = /^(Public\s+|Private\s+)?Interface\s+(\w+)$/i;
    const match = code.match(interfaceRegex);
    
    if (!match) return null;

    const scope = match[1] ? match[1].trim().toLowerCase() : 'public';
    const interfaceName = match[2];

    return {
      name: interfaceName,
      methods: [],
      properties: [],
      public: scope === 'public',
      module: this.currentModule,
      line
    };
  }

  /**
   * Parse interface method declaration
   */
  parseInterfaceMethod(code: string, line: number): VB6InterfaceMethod | null {
    const methodRegex = /^(Function|Sub)\s+(\w+)\s*\(([^)]*)\)(?:\s+As\s+(.+))?$/i;
    const match = code.match(methodRegex);
    
    if (!match) return null;

    const type = match[1].toLowerCase();
    const methodName = match[2];
    const parameterList = match[3] || '';
    const returnType = match[4];
    const isFunction = type === 'function';

    // Validate return type
    if (isFunction && !returnType) {
      throw new Error(`Interface function ${methodName} must have a return type`);
    }
    if (!isFunction && returnType) {
      throw new Error(`Interface sub ${methodName} cannot have a return type`);
    }

    const parameters = this.parseParameterList(parameterList);

    return {
      name: methodName,
      parameters,
      returnType,
      isFunction,
      line
    };
  }

  /**
   * Parse interface property declaration
   */
  parseInterfaceProperty(code: string, line: number): VB6InterfaceProperty | null {
    const propertyRegex = /^Property\s+(Get|Let|Set)\s+(\w+)\s*(?:\(([^)]*)\))?\s+As\s+(.+)$/i;
    const match = code.match(propertyRegex);
    
    if (!match) return null;

    const propertyType = match[1].toLowerCase();
    const propertyName = match[2];
    const parameters = match[3] || '';
    const dataType = match[4];

    // For interface properties, we need to determine if it's read-only, write-only, or read-write
    // This will be determined by collecting all Property declarations for the same name
    return {
      name: propertyName,
      type: dataType,
      readOnly: propertyType === 'get',
      writeOnly: propertyType === 'let' || propertyType === 'set',
      line
    };
  }

  /**
   * Parse parameter list
   */
  private parseParameterList(parameterList: string): VB6InterfaceParameter[] {
    if (!parameterList.trim()) return [];

    const parameters: VB6InterfaceParameter[] = [];
    const params = parameterList.split(',');

    for (const param of params) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      const paramRegex = /^(Optional\s+)?(ByRef\s+|ByVal\s+)?(\w+)(?:\s+As\s+(.+?))?(?:\s*=\s*(.+))?$/i;
      const match = trimmed.match(paramRegex);

      if (match) {
        const isOptional = match[1] ? true : false;
        const byRef = match[2] ? !match[2].toLowerCase().includes('byval') : true;
        const paramName = match[3];
        const paramType = match[4] || 'Variant';
        const defaultValue = match[5];

        parameters.push({
          name: paramName,
          type: paramType,
          byRef,
          optional: isOptional,
          defaultValue: defaultValue ? this.parseDefaultValue(defaultValue) : undefined
        });
      }
    }

    return parameters;
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
   * Parse Implements statement
   * Example: Implements IComparable
   */
  parseImplementsStatement(code: string, line: number): string | null {
    const implementsRegex = /^Implements\s+(\w+)$/i;
    const match = code.match(implementsRegex);
    
    return match ? match[1] : null;
  }

  /**
   * Parse interface method implementation
   * Example: Private Function IComparable_CompareTo(obj As Object) As Integer
   */
  parseInterfaceMethodImplementation(code: string, line: number): VB6InterfaceMethodImpl | null {
    const implRegex = /^(Private\s+|Public\s+)?(Function|Sub)\s+(\w+)_(\w+)\s*\(([^)]*)\)(?:\s+As\s+(.+))?$/i;
    const match = code.match(implRegex);
    
    if (!match) return null;

    const interfaceName = match[3];
    const methodName = match[4];
    const interfaceMethod = `${interfaceName}.${methodName}`;
    const implementationMethod = `${interfaceName}_${methodName}`;

    return {
      interfaceMethod,
      implementationMethod,
      body: [],
      line
    };
  }

  /**
   * Register interface
   */
  registerInterface(interfaceDecl: VB6InterfaceDeclaration) {
    const key = interfaceDecl.public ? interfaceDecl.name : `${this.currentModule}.${interfaceDecl.name}`;
    this.interfaces.set(key, interfaceDecl);
  }

  /**
   * Add method to interface
   */
  addMethodToInterface(interfaceName: string, method: VB6InterfaceMethod) {
    const interfaceDecl = this.getInterface(interfaceName);
    if (interfaceDecl) {
      interfaceDecl.methods.push(method);
    }
  }

  /**
   * Add property to interface
   */
  addPropertyToInterface(interfaceName: string, property: VB6InterfaceProperty) {
    const interfaceDecl = this.getInterface(interfaceName);
    if (interfaceDecl) {
      // Check if property already exists and merge Get/Let/Set
      const existing = interfaceDecl.properties.find(p => p.name === property.name);
      if (existing) {
        existing.readOnly = existing.readOnly && property.readOnly;
        existing.writeOnly = existing.writeOnly && property.writeOnly;
      } else {
        interfaceDecl.properties.push(property);
      }
    }
  }

  /**
   * Register class implementing interface
   */
  registerImplements(className: string, interfaceName: string, line: number) {
    const key = `${this.currentModule}.${className}.${interfaceName}`;
    
    const implementation: VB6ImplementsDeclaration = {
      className,
      interfaceName,
      implementedMethods: new Map(),
      implementedProperties: new Map(),
      module: this.currentModule,
      line
    };
    
    this.implementations.set(key, implementation);
  }

  /**
   * Add method implementation
   */
  addMethodImplementation(className: string, interfaceName: string, methodImpl: VB6InterfaceMethodImpl) {
    const key = `${this.currentModule}.${className}.${interfaceName}`;
    const implementation = this.implementations.get(key);
    
    if (implementation) {
      implementation.implementedMethods.set(methodImpl.interfaceMethod, methodImpl);
    }
  }

  /**
   * Get interface
   */
  getInterface(interfaceName: string): VB6InterfaceDeclaration | undefined {
    return this.interfaces.get(interfaceName) || this.interfaces.get(`${this.currentModule}.${interfaceName}`);
  }

  /**
   * Get implementation
   */
  getImplementation(className: string, interfaceName: string): VB6ImplementsDeclaration | undefined {
    const key = `${this.currentModule}.${className}.${interfaceName}`;
    return this.implementations.get(key);
  }

  /**
   * Generate JavaScript interface
   */
  generateJavaScript(interfaceDecl: VB6InterfaceDeclaration): string {
    let jsCode = `// Interface: ${interfaceDecl.name}\n`;
    jsCode += `// This is a TypeScript-style interface for documentation\n`;
    jsCode += `class ${interfaceDecl.name} {\n`;
    
    // Generate method signatures as comments
    for (const method of interfaceDecl.methods) {
      jsCode += `  // ${method.isFunction ? 'Function' : 'Sub'}: ${method.name}(`;
      const paramList = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
      jsCode += paramList;
      jsCode += ')';
      if (method.isFunction && method.returnType) {
        jsCode += `: ${method.returnType}`;
      }
      jsCode += '\n';
    }
    
    // Generate property signatures
    for (const property of interfaceDecl.properties) {
      jsCode += `  // Property: ${property.name}: ${property.type}`;
      if (property.readOnly) jsCode += ' (ReadOnly)';
      if (property.writeOnly) jsCode += ' (WriteOnly)';
      jsCode += '\n';
    }
    
    jsCode += `}\n\n`;
    
    return jsCode;
  }

  /**
   * Generate JavaScript implementation class
   */
  generateImplementationJS(implementation: VB6ImplementsDeclaration): string {
    const interfaceDecl = this.getInterface(implementation.interfaceName);
    if (!interfaceDecl) {
      throw new Error(`Interface ${implementation.interfaceName} not found`);
    }

    let jsCode = `// Implementation of ${implementation.interfaceName} by ${implementation.className}\n`;
    jsCode += `// Interface methods for ${implementation.className}\n\n`;
    
    // Generate interface method implementations
    for (const method of interfaceDecl.methods) {
      const implMethod = implementation.implementedMethods.get(`${implementation.interfaceName}.${method.name}`);
      
      jsCode += `// Interface method: ${method.name}\n`;
      jsCode += `${implMethod?.implementationMethod || `${implementation.interfaceName}_${method.name}`}: function(`;
      
      const paramNames = method.parameters.map(p => p.name);
      jsCode += paramNames.join(', ');
      jsCode += ') {\n';
      
      if (implMethod && implMethod.body.length > 0) {
        for (const line of implMethod.body) {
          jsCode += `  ${this.transpileVB6Line(line)}\n`;
        }
      } else {
        jsCode += `  throw new Error('Method ${method.name} not implemented');\n`;
      }
      
      if (method.isFunction) {
        jsCode += `  // return ${this.getDefaultReturnValue(method.returnType || 'Variant')};\n`;
      }
      
      jsCode += `},\n\n`;
    }
    
    return jsCode;
  }

  /**
   * Basic VB6 to JavaScript line transpilation
   */
  private transpileVB6Line(line: string): string {
    let jsLine = line;
    
    // Basic VB6 to JavaScript conversions
    jsLine = jsLine.replace(/\bMe\b/g, 'this');
    jsLine = jsLine.replace(/\bNothing\b/g, 'null');
    jsLine = jsLine.replace(/\bTrue\b/g, 'true');
    jsLine = jsLine.replace(/\bFalse\b/g, 'false');
    jsLine = jsLine.replace(/\bAnd\b/g, '&&');
    jsLine = jsLine.replace(/\bOr\b/g, '||');
    jsLine = jsLine.replace(/\bNot\b/g, '!');
    jsLine = jsLine.replace(/\bThen\b/g, '');
    jsLine = jsLine.replace(/\bEnd If\b/g, '}');
    jsLine = jsLine.replace(/\bIf\b(.+)\bThen\b/g, 'if ($1) {');
    
    return jsLine;
  }

  /**
   * Get default return value for type
   */
  private getDefaultReturnValue(returnType: string): string {
    switch (returnType.toLowerCase()) {
      case 'integer':
      case 'long':
      case 'byte':
        return '0';
      case 'single':
      case 'double':
      case 'currency':
        return '0.0';
      case 'string':
        return '""';
      case 'boolean':
        return 'false';
      case 'date':
        return 'new Date(0)';
      case 'variant':
        return 'null';
      case 'object':
        return 'null';
      default:
        return 'null';
    }
  }

  /**
   * Generate TypeScript interface
   */
  generateTypeScript(interfaceDecl: VB6InterfaceDeclaration): string {
    let tsCode = `// VB6 Interface: ${interfaceDecl.name}\n`;
    tsCode += `interface ${interfaceDecl.name} {\n`;
    
    // Generate method signatures
    for (const method of interfaceDecl.methods) {
      tsCode += `  ${method.name}(`;
      
      const paramSignatures = method.parameters.map(param => {
        const tsType = this.mapVB6TypeToTypeScript(param.type);
        const optional = param.optional ? '?' : '';
        return `${param.name}${optional}: ${tsType}`;
      });
      
      tsCode += paramSignatures.join(', ');
      tsCode += ')';
      
      if (method.isFunction && method.returnType) {
        const returnType = this.mapVB6TypeToTypeScript(method.returnType);
        tsCode += `: ${returnType}`;
      } else {
        tsCode += ': void';
      }
      
      tsCode += ';\n';
    }
    
    // Generate property signatures
    for (const property of interfaceDecl.properties) {
      const tsType = this.mapVB6TypeToTypeScript(property.type);
      let modifier = '';
      
      if (property.readOnly) modifier = 'readonly ';
      
      tsCode += `  ${modifier}${property.name}: ${tsType};\n`;
    }
    
    tsCode += `}\n\n`;
    
    return tsCode;
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
        return vb6Type; // Assume it's a custom type or interface
    }
  }

  /**
   * Validate interface implementation
   */
  validateImplementation(className: string, interfaceName: string): string[] {
    const interfaceDecl = this.getInterface(interfaceName);
    const implementation = this.getImplementation(className, interfaceName);
    
    if (!interfaceDecl) {
      return [`Interface ${interfaceName} not found`];
    }
    
    if (!implementation) {
      return [`Class ${className} does not implement interface ${interfaceName}`];
    }
    
    const errors: string[] = [];
    
    // Check all interface methods are implemented
    for (const method of interfaceDecl.methods) {
      const methodKey = `${interfaceName}.${method.name}`;
      const implMethod = implementation.implementedMethods.get(methodKey);
      
      if (!implMethod) {
        errors.push(`Method ${method.name} from interface ${interfaceName} is not implemented in class ${className}`);
      }
    }
    
    // Check all interface properties are implemented
    for (const property of interfaceDecl.properties) {
      const propertyKey = `${interfaceName}.${property.name}`;
      const implProperty = implementation.implementedProperties.get(propertyKey);
      
      if (!implProperty) {
        errors.push(`Property ${property.name} from interface ${interfaceName} is not implemented in class ${className}`);
      }
    }
    
    return errors;
  }

  /**
   * Clear all interfaces and implementations
   */
  clear() {
    this.interfaces.clear();
    this.implementations.clear();
  }

  /**
   * Get all interfaces in current module
   */
  getModuleInterfaces(): VB6InterfaceDeclaration[] {
    return Array.from(this.interfaces.values())
      .filter(iface => iface.module === this.currentModule);
  }

  /**
   * Get all implementations in current module
   */
  getModuleImplementations(): VB6ImplementsDeclaration[] {
    return Array.from(this.implementations.values())
      .filter(impl => impl.module === this.currentModule);
  }

  /**
   * Export interface data for serialization
   */
  export(): { interfaces: { [key: string]: VB6InterfaceDeclaration }, implementations: { [key: string]: VB6ImplementsDeclaration } } {
    const interfaces: { [key: string]: VB6InterfaceDeclaration } = {};
    const implementations: { [key: string]: VB6ImplementsDeclaration } = {};
    
    for (const [key, value] of this.interfaces.entries()) {
      interfaces[key] = value;
    }
    
    for (const [key, value] of this.implementations.entries()) {
      // Convert Map to plain object for serialization
      implementations[key] = {
        ...value,
        implementedMethods: Object.fromEntries(value.implementedMethods) as any,
        implementedProperties: Object.fromEntries(value.implementedProperties) as any
      };
    }
    
    return { interfaces, implementations };
  }

  /**
   * Import interface data from serialization
   */
  import(data: { interfaces: { [key: string]: VB6InterfaceDeclaration }, implementations: { [key: string]: VB6ImplementsDeclaration } }) {
    this.interfaces.clear();
    this.implementations.clear();
    
    for (const [key, value] of Object.entries(data.interfaces)) {
      this.interfaces.set(key, value);
    }
    
    for (const [key, value] of Object.entries(data.implementations)) {
      // Convert plain object back to Map
      const implementation = {
        ...value,
        implementedMethods: new Map(Object.entries(value.implementedMethods as any)),
        implementedProperties: new Map(Object.entries(value.implementedProperties as any))
      };
      this.implementations.set(key, implementation);
    }
  }
}

// Example VB6 Interface patterns
export const VB6InterfaceExamples = {
  // Simple interface
  IComparable: `
Public Interface IComparable
    Function CompareTo(obj As Object) As Integer
End Interface
`,

  // Interface with properties
  IDrawable: `
Public Interface IDrawable
    Property Get Width() As Long
    Property Let Width(ByVal value As Long)
    Property Get Height() As Long  
    Property Let Height(ByVal value As Long)
    Sub Draw()
    Function GetArea() As Long
End Interface
`,

  // Implementation
  Rectangle: `
Public Class Rectangle
    Implements IDrawable
    Implements IComparable
    
    Private m_width As Long
    Private m_height As Long
    
    Private Property Get IDrawable_Width() As Long
        IDrawable_Width = m_width
    End Property
    
    Private Property Let IDrawable_Width(ByVal value As Long)
        m_width = value
    End Property
    
    Private Property Get IDrawable_Height() As Long
        IDrawable_Height = m_height
    End Property
    
    Private Property Let IDrawable_Height(ByVal value As Long)
        m_height = value
    End Property
    
    Private Sub IDrawable_Draw()
        ' Draw implementation
    End Sub
    
    Private Function IDrawable_GetArea() As Long
        IDrawable_GetArea = m_width * m_height
    End Function
    
    Private Function IComparable_CompareTo(obj As Object) As Integer
        Dim other As Rectangle
        Set other = obj
        IComparable_CompareTo = Me.IDrawable_GetArea() - other.IDrawable_GetArea()
    End Function
End Class
`,

  // Multiple interfaces
  IEnumerable: `
Public Interface IEnumerable
    Function GetEnumerator() As IEnumerator
End Interface

Public Interface IEnumerator
    Property Get Current() As Variant
    Function MoveNext() As Boolean
    Sub Reset()
End Interface
`
};

// Global interface processor instance
export const interfaceProcessor = new VB6InterfaceProcessor();