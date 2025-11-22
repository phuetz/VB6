/**
 * VB6 Property Get/Let/Set Support Implementation
 * 
 * Complete support for VB6 property procedures
 */

export interface VB6PropertyDeclaration {
  name: string;
  type: 'Get' | 'Let' | 'Set';
  returnType?: string;
  parameters: VB6PropertyParameter[];
  body: string[];
  public: boolean;
  static: boolean;
  module: string;
  line: number;
}

export interface VB6PropertyParameter {
  name: string;
  type: string;
  byRef: boolean;
  optional: boolean;
  defaultValue?: any;
}

export interface VB6PropertyGroup {
  name: string;
  getter?: VB6PropertyDeclaration;
  letter?: VB6PropertyDeclaration;
  setter?: VB6PropertyDeclaration;
  readOnly: boolean;
  writeOnly: boolean;
}

export class VB6PropertyProcessor {
  private properties: Map<string, VB6PropertyGroup> = new Map();
  private currentModule: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 Property declaration
   * Examples:
   * Property Get Value() As Variant
   * Property Let Value(ByVal vNewValue As Variant)
   * Property Set Value(ByVal vNewValue As Object)
   */
  parsePropertyDeclaration(code: string, line: number): VB6PropertyDeclaration | null {
    const propertyRegex = /^(Public\s+|Private\s+|Friend\s+)?(Static\s+)?Property\s+(Get|Let|Set)\s+(\w+)\s*\(([^)]*)\)(?:\s+As\s+(.+))?$/i;
    const match = code.match(propertyRegex);
    
    if (!match) return null;

    const scope = match[1] ? match[1].trim().toLowerCase() : 'public';
    const isStatic = match[2] ? true : false;
    const type = match[3] as 'Get' | 'Let' | 'Set';
    const name = match[4];
    const parameterList = match[5] || '';
    const returnType = match[6];

    const parameters = this.parseParameterList(parameterList);

    return {
      name,
      type,
      returnType,
      parameters,
      body: [],
      public: scope === 'public',
      static: isStatic,
      module: this.currentModule,
      line
    };
  }

  /**
   * Parse parameter list
   */
  private parseParameterList(parameterList: string): VB6PropertyParameter[] {
    if (!parameterList.trim()) return [];

    const parameters: VB6PropertyParameter[] = [];
    const params = parameterList.split(',');

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
    
    // String literals
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.substring(1, trimmed.length - 1);
    }
    
    // Numeric values
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }
    
    // Boolean values
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // Constants
    if (trimmed.toLowerCase() === 'nothing') return null;
    if (trimmed.toLowerCase() === 'empty') return undefined;
    
    return trimmed; // Return as string for other cases
  }

  /**
   * Register property declaration
   */
  registerProperty(propDecl: VB6PropertyDeclaration) {
    const key = propDecl.public ? propDecl.name : `${this.currentModule}.${propDecl.name}`;
    
    let propertyGroup = this.properties.get(key);
    if (!propertyGroup) {
      propertyGroup = {
        name: propDecl.name,
        readOnly: false,
        writeOnly: false
      };
      this.properties.set(key, propertyGroup);
    }

    switch (propDecl.type) {
      case 'Get':
        propertyGroup.getter = propDecl;
        break;
      case 'Let':
        propertyGroup.letter = propDecl;
        break;
      case 'Set':
        propertyGroup.setter = propDecl;
        break;
    }

    // Update read/write only flags
    propertyGroup.readOnly = !!propertyGroup.getter && !propertyGroup.letter && !propertyGroup.setter;
    propertyGroup.writeOnly = !propertyGroup.getter && (!!propertyGroup.letter || !!propertyGroup.setter);
  }

  /**
   * Get property group
   */
  getProperty(name: string): VB6PropertyGroup | undefined {
    return this.properties.get(name) || this.properties.get(`${this.currentModule}.${name}`);
  }

  /**
   * Generate JavaScript getter/setter
   */
  generateJavaScript(propertyGroup: VB6PropertyGroup): string {
    const propName = propertyGroup.name;
    let jsCode = `// Property: ${propName}\n`;

    // Private backing field
    const backingField = `_${propName.toLowerCase()}`;
    jsCode += `${backingField}: null,\n\n`;

    // Getter
    if (propertyGroup.getter) {
      const getter = propertyGroup.getter;
      jsCode += `get ${propName}() {\n`;
      
      if (getter.body.length > 0) {
        // Custom getter implementation
        jsCode += `  ${this.generatePropertyBody(getter.body)}\n`;
      } else {
        // Default getter
        jsCode += `  return this.${backingField};\n`;
      }
      
      jsCode += `},\n\n`;
    }

    // Setter (Let or Set)
    const setter = propertyGroup.letter || propertyGroup.setter;
    if (setter) {
      const isObjectSetter = setter.type === 'Set';
      jsCode += `set ${propName}(value) {\n`;
      
      // Type checking for Set properties
      if (isObjectSetter) {
        jsCode += `  if (value !== null && typeof value !== 'object') {\n`;
        jsCode += `    throw new Error('Property Set can only be used with object values');\n`;
        jsCode += `  }\n`;
      }
      
      if (setter.body.length > 0) {
        // Custom setter implementation
        jsCode += `  ${this.generatePropertyBody(setter.body, 'value')}\n`;
      } else {
        // Default setter
        jsCode += `  this.${backingField} = value;\n`;
      }
      
      jsCode += `},\n\n`;
    }

    return jsCode;
  }

  /**
   * Generate property body code
   */
  private generatePropertyBody(body: string[], paramName?: string): string {
    // This is a simplified implementation
    // In a real compiler, this would transpile VB6 code to JavaScript
    const jsBody = body.map(line => {
      let jsLine = line;
      
      // Replace VB6 specific constructs
      jsLine = jsLine.replace(/\bMe\b/g, 'this');
      jsLine = jsLine.replace(/\bNothing\b/g, 'null');
      jsLine = jsLine.replace(/\bTrue\b/g, 'true');
      jsLine = jsLine.replace(/\bFalse\b/g, 'false');
      jsLine = jsLine.replace(/\bAnd\b/g, '&&');
      jsLine = jsLine.replace(/\bOr\b/g, '||');
      jsLine = jsLine.replace(/\bNot\b/g, '!');
      
      // Handle property assignment
      if (paramName) {
        jsLine = jsLine.replace(new RegExp(`\\b${paramName}\\b`, 'g'), 'value');
      }
      
      return `  ${jsLine}`;
    });
    
    return jsBody.join('\n');
  }

  /**
   * Generate TypeScript interface
   */
  generateTypeScript(propertyGroup: VB6PropertyGroup): string {
    const propName = propertyGroup.name;
    const getter = propertyGroup.getter;
    const setter = propertyGroup.letter || propertyGroup.setter;
    
    let tsType = 'any';
    
    if (getter && getter.returnType) {
      tsType = this.mapVB6TypeToTypeScript(getter.returnType);
    } else if (setter && setter.parameters.length > 0) {
      tsType = this.mapVB6TypeToTypeScript(setter.parameters[0].type);
    }
    
    let declaration = '';
    
    if (propertyGroup.readOnly) {
      declaration = `readonly ${propName}: ${tsType};`;
    } else if (propertyGroup.writeOnly) {
      declaration = `${propName}: ${tsType}; // Write-only`;
    } else {
      declaration = `${propName}: ${tsType};`;
    }
    
    return declaration;
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
        return 'object';
      default:
        return vb6Type; // Assume it's a custom type
    }
  }

  /**
   * Validate property consistency
   */
  validatePropertyConsistency(propertyGroup: VB6PropertyGroup): string[] {
    const errors: string[] = [];
    const getter = propertyGroup.getter;
    const setter = propertyGroup.letter || propertyGroup.setter;

    // Check if Get and Let/Set have compatible types
    if (getter && setter && getter.returnType && setter.parameters.length > 0) {
      const getterType = getter.returnType.toLowerCase();
      const setterType = setter.parameters[0].type.toLowerCase();
      
      if (getterType !== setterType && getterType !== 'variant' && setterType !== 'variant') {
        errors.push(`Property ${propertyGroup.name}: Get returns ${getter.returnType} but ${setter.type} expects ${setter.parameters[0].type}`);
      }
    }

    // Check if Set is used with object types
    if (propertyGroup.setter) {
      const setter = propertyGroup.setter;
      if (setter.parameters.length > 0) {
        const paramType = setter.parameters[0].type.toLowerCase();
        if (paramType !== 'object' && paramType !== 'variant') {
          errors.push(`Property ${propertyGroup.name}: Property Set should be used with Object types, not ${setter.parameters[0].type}`);
        }
      }
    }

    // Check if Let is used with non-object types
    if (propertyGroup.letter) {
      const letter = propertyGroup.letter;
      if (letter.parameters.length > 0) {
        const paramType = letter.parameters[0].type.toLowerCase();
        if (paramType === 'object' && !paramType.includes('variant')) {
          errors.push(`Property ${propertyGroup.name}: Property Let should not be used with Object types, use Property Set instead`);
        }
      }
    }

    return errors;
  }

  /**
   * Generate property accessor methods
   */
  generatePropertyAccessors(className: string): string {
    let jsCode = `// Property accessors for ${className}\n`;
    
    for (const [key, propertyGroup] of this.properties.entries()) {
      if (!key.includes('.') || key.startsWith(this.currentModule)) {
        const propCode = this.generateJavaScript(propertyGroup);
        jsCode += propCode;
        
        // Add validation
        const errors = this.validatePropertyConsistency(propertyGroup);
        if (errors.length > 0) {
          jsCode += `// Validation errors:\n`;
          for (const error of errors) {
            jsCode += `// ${error}\n`;
          }
        }
      }
    }
    
    return jsCode;
  }

  /**
   * Clear all properties (for new compilation)
   */
  clear() {
    this.properties.clear();
  }

  /**
   * Get all properties in current module
   */
  getModuleProperties(): VB6PropertyGroup[] {
    return Array.from(this.properties.values())
      .filter(prop => {
        const key = Array.from(this.properties.keys())
          .find(k => this.properties.get(k) === prop);
        return key && (key.startsWith(this.currentModule) || !key.includes('.'));
      });
  }

  /**
   * Export property data for serialization
   */
  export(): { [key: string]: VB6PropertyGroup } {
    const result: { [key: string]: VB6PropertyGroup } = {};
    for (const [key, value] of this.properties.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Import property data from serialization
   */
  import(data: { [key: string]: VB6PropertyGroup }) {
    this.properties.clear();
    for (const [key, value] of Object.entries(data)) {
      this.properties.set(key, value);
    }
  }
}

// Example VB6 Property patterns
export const VB6PropertyExamples = {
  // Simple property with backing field
  SimpleProperty: `
Property Get Value() As Variant
    Value = m_value
End Property

Property Let Value(ByVal vNewValue As Variant)
    m_value = vNewValue
End Property
`,

  // Read-only property
  ReadOnlyProperty: `
Property Get Count() As Long
    Count = m_items.Count
End Property
`,

  // Object property with Set
  ObjectProperty: `
Property Get Font() As Object
    Set Font = m_font
End Property

Property Set Font(ByVal vNewFont As Object)
    Set m_font = vNewFont
End Property
`,

  // Property with validation
  ValidatedProperty: `
Property Get Age() As Integer
    Age = m_age
End Property

Property Let Age(ByVal vNewAge As Integer)
    If vNewAge < 0 Or vNewAge > 150 Then
        Err.Raise 5, , "Invalid age value"
    End If
    m_age = vNewAge
End Property
`,

  // Indexed property
  IndexedProperty: `
Property Get Item(ByVal Index As Variant) As Variant
    Item = m_items(Index)
End Property

Property Let Item(ByVal Index As Variant, ByVal vNewItem As Variant)
    m_items(Index) = vNewItem
End Property
`
};

// Global property processor instance
export const propertyProcessor = new VB6PropertyProcessor();