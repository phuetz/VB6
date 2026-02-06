/**
 * VB6 User Defined Types (UDT) Support Implementation
 *
 * Provides full support for VB6 Type declarations and usage
 */

export interface VB6UDTField {
  name: string;
  type: string;
  arrayDimensions?: number[];
  fixedLength?: number; // For fixed-length strings
  defaultValue?: any;
}

export interface VB6UDTDeclaration {
  name: string;
  fields: VB6UDTField[];
  public: boolean;
  module: string;
  line: number;
  size: number; // Total size in bytes
}

export class VB6UDTProcessor {
  private types: Map<string, VB6UDTDeclaration> = new Map();
  private currentModule: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 Type declaration
   * Example:
   * Type Employee
   *     Name As String * 50
   *     ID As Long
   *     Salary As Currency
   *     HireDate As Date
   *     Address As AddressType
   * End Type
   */
  parseTypeDeclaration(code: string, line: number): VB6UDTDeclaration | null {
    const typeRegex = /^(Public\s+|Private\s+)?Type\s+(\w+)\s*$/i;
    const match = code.match(typeRegex);

    if (!match) return null;

    const isPublic = match[1] ? match[1].toLowerCase().includes('public') : false;
    const typeName = match[2];

    return {
      name: typeName,
      fields: [],
      public: isPublic,
      module: this.currentModule,
      line: line,
      size: 0,
    };
  }

  /**
   * Parse type field
   * Examples:
   * Name As String * 50
   * ID As Long
   * Numbers(1 To 10) As Integer
   * Address As AddressType
   */
  parseTypeField(code: string): VB6UDTField | null {
    // Handle array declarations
    const arrayRegex = /^\s*(\w+)\s*\(([^)]+)\)\s+As\s+(.+)$/i;
    const arrayMatch = code.match(arrayRegex);

    if (arrayMatch) {
      const name = arrayMatch[1];
      const dimensions = this.parseArrayDimensions(arrayMatch[2]);
      const typeInfo = this.parseFieldType(arrayMatch[3]);

      return {
        name,
        type: typeInfo.type,
        arrayDimensions: dimensions,
        fixedLength: typeInfo.fixedLength,
      };
    }

    // Handle regular field declarations
    const fieldRegex = /^\s*(\w+)\s+As\s+(.+)$/i;
    const fieldMatch = code.match(fieldRegex);

    if (!fieldMatch) return null;

    const name = fieldMatch[1];
    const typeInfo = this.parseFieldType(fieldMatch[2]);

    return {
      name,
      type: typeInfo.type,
      fixedLength: typeInfo.fixedLength,
    };
  }

  /**
   * Parse array dimensions
   * Examples: "1 To 10", "0 To 5, 1 To 3", "10"
   */
  private parseArrayDimensions(dimensionStr: string): number[] {
    const dimensions: number[] = [];
    const parts = dimensionStr.split(',');

    for (const part of parts) {
      const trimmed = part.trim();

      if (trimmed.includes(' To ')) {
        const [start, end] = trimmed.split(' To ');
        const startNum = parseInt(start.trim());
        const endNum = parseInt(end.trim());
        dimensions.push(endNum - startNum + 1);
      } else {
        const size = parseInt(trimmed);
        dimensions.push(isNaN(size) ? 0 : size + 1); // VB6 arrays are 0-based by default
      }
    }

    return dimensions;
  }

  /**
   * Parse field type information
   * Examples: "String * 50", "Long", "Currency", "Date"
   */
  private parseFieldType(typeStr: string): { type: string; fixedLength?: number } {
    const fixedStringRegex = /^String\s*\*\s*(\d+)$/i;
    const fixedMatch = typeStr.match(fixedStringRegex);

    if (fixedMatch) {
      return {
        type: 'String',
        fixedLength: parseInt(fixedMatch[1]),
      };
    }

    return { type: typeStr.trim() };
  }

  /**
   * Calculate field size in bytes
   */
  private calculateFieldSize(field: VB6UDTField): number {
    let baseSize = this.getTypeSize(field.type, field.fixedLength);

    if (field.arrayDimensions && field.arrayDimensions.length > 0) {
      let totalElements = 1;
      for (const dim of field.arrayDimensions) {
        totalElements *= dim;
      }
      baseSize *= totalElements;
    }

    return baseSize;
  }

  /**
   * Get size of VB6 data type in bytes
   */
  private getTypeSize(typeName: string, fixedLength?: number): number {
    switch (typeName.toLowerCase()) {
      case 'byte':
        return 1;
      case 'boolean':
        return 2;
      case 'integer':
        return 2;
      case 'long':
        return 4;
      case 'single':
        return 4;
      case 'double':
        return 8;
      case 'currency':
        return 8;
      case 'date':
        return 8;
      case 'string':
        return fixedLength ? fixedLength : 4; // Variable-length string is a pointer
      case 'variant':
        return 16;
      case 'object':
        return 4; // Pointer
      default: {
        // Check if it's a user-defined type
        const udtType = this.getType(typeName);
        return udtType ? udtType.size : 4; // Default to pointer size
      }
    }
  }

  /**
   * Process complete type declaration
   */
  processType(typeDecl: VB6UDTDeclaration, fieldLines: string[]): VB6UDTDeclaration {
    let totalSize = 0;

    for (const line of fieldLines) {
      const field = this.parseTypeField(line);
      if (field) {
        const fieldSize = this.calculateFieldSize(field);
        totalSize += fieldSize;
        typeDecl.fields.push(field);
      }
    }

    typeDecl.size = totalSize;
    return typeDecl;
  }

  /**
   * Register type in global scope
   */
  registerType(typeDecl: VB6UDTDeclaration) {
    const fullName = typeDecl.public ? typeDecl.name : `${this.currentModule}.${typeDecl.name}`;
    this.types.set(fullName, typeDecl);
  }

  /**
   * Get type by name
   */
  getType(name: string): VB6UDTDeclaration | undefined {
    return this.types.get(name) || this.types.get(`${this.currentModule}.${name}`);
  }

  /**
   * Check if identifier is a UDT
   */
  isUDT(typeName: string): boolean {
    return this.types.has(typeName) || this.types.has(`${this.currentModule}.${typeName}`);
  }

  /**
   * Generate JavaScript class for UDT
   */
  generateJavaScript(typeDecl: VB6UDTDeclaration): string {
    const typeName = typeDecl.name;
    const fields = typeDecl.fields;

    let jsCode = `// User Defined Type: ${typeName}\n`;
    jsCode += `class ${typeName} {\n`;

    // Constructor
    jsCode += `  constructor() {\n`;
    for (const field of fields) {
      const defaultValue = this.getFieldDefaultValue(field);
      if (field.arrayDimensions) {
        jsCode += `    this.${field.name} = ${this.generateArrayInitializer(field)};\n`;
      } else {
        jsCode += `    this.${field.name} = ${defaultValue};\n`;
      }
    }
    jsCode += `  }\n\n`;

    // Clone method
    jsCode += `  clone() {\n`;
    jsCode += `    const copy = new ${typeName}();\n`;
    for (const field of fields) {
      if (field.arrayDimensions) {
        jsCode += `    copy.${field.name} = [...this.${field.name}];\n`;
      } else if (this.isUDT(field.type)) {
        jsCode += `    copy.${field.name} = this.${field.name}.clone();\n`;
      } else {
        jsCode += `    copy.${field.name} = this.${field.name};\n`;
      }
    }
    jsCode += `    return copy;\n`;
    jsCode += `  }\n\n`;

    // Serialize method
    jsCode += `  serialize() {\n`;
    jsCode += `    return {\n`;
    for (const field of fields) {
      jsCode += `      ${field.name}: this.${field.name},\n`;
    }
    jsCode += `    };\n`;
    jsCode += `  }\n\n`;

    // Deserialize method
    jsCode += `  static deserialize(data) {\n`;
    jsCode += `    const instance = new ${typeName}();\n`;
    jsCode += `    if (data) {\n`;
    for (const field of fields) {
      jsCode += `      if ('${field.name}' in data) instance.${field.name} = data.${field.name};\n`;
    }
    jsCode += `    }\n`;
    jsCode += `    return instance;\n`;
    jsCode += `  }\n\n`;

    // Size information
    jsCode += `  static get SIZE() { return ${typeDecl.size}; }\n`;
    jsCode += `  static get FIELDS() {\n`;
    jsCode += `    return [\n`;
    for (const field of fields) {
      jsCode += `      {\n`;
      jsCode += `        name: '${field.name}',\n`;
      jsCode += `        type: '${field.type}',\n`;
      if (field.fixedLength) jsCode += `        fixedLength: ${field.fixedLength},\n`;
      if (field.arrayDimensions)
        jsCode += `        arrayDimensions: [${field.arrayDimensions.join(', ')}],\n`;
      jsCode += `      },\n`;
    }
    jsCode += `    ];\n`;
    jsCode += `  }\n`;

    jsCode += `}\n\n`;

    return jsCode;
  }

  /**
   * Generate array initializer code
   */
  private generateArrayInitializer(field: VB6UDTField): string {
    if (!field.arrayDimensions || field.arrayDimensions.length === 0) {
      return 'null';
    }

    let totalElements = 1;
    for (const dim of field.arrayDimensions) {
      totalElements *= dim;
    }

    const defaultValue = this.getFieldDefaultValue(field);
    return `new Array(${totalElements}).fill(${defaultValue})`;
  }

  /**
   * Get default value for field type
   */
  private getFieldDefaultValue(field: VB6UDTField): string {
    switch (field.type.toLowerCase()) {
      case 'byte':
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
        return '0';
      case 'boolean':
        return 'false';
      case 'string':
        return field.fixedLength ? `"${' '.repeat(field.fixedLength)}"` : '""';
      case 'date':
        return 'new Date(0)';
      case 'variant':
        return 'null';
      case 'object':
        return 'null';
      default:
        // Check if it's a UDT
        if (this.isUDT(field.type)) {
          return `new ${field.type}()`;
        }
        return 'null';
    }
  }

  /**
   * Generate TypeScript interface for UDT
   */
  generateTypeScript(typeDecl: VB6UDTDeclaration): string {
    const typeName = typeDecl.name;
    const fields = typeDecl.fields;

    let tsCode = `interface ${typeName} {\n`;

    for (const field of fields) {
      let fieldType = this.mapVB6TypeToTypeScript(field.type);

      if (field.arrayDimensions && field.arrayDimensions.length > 0) {
        for (let i = 0; i < field.arrayDimensions.length; i++) {
          fieldType += '[]';
        }
      }

      tsCode += `  ${field.name}: ${fieldType};\n`;
    }

    tsCode += `}\n\n`;

    return tsCode;
  }

  /**
   * Map VB6 types to TypeScript types
   */
  private mapVB6TypeToTypeScript(vb6Type: string): string {
    switch (vb6Type.toLowerCase()) {
      case 'byte':
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'string':
        return 'string';
      case 'date':
        return 'Date';
      case 'variant':
        return 'any';
      case 'object':
        return 'object';
      default:
        // Assume it's a UDT or custom type
        return vb6Type;
    }
  }

  /**
   * Get all types in current module
   */
  getModuleTypes(): VB6UDTDeclaration[] {
    return Array.from(this.types.values()).filter(t => t.module === this.currentModule);
  }

  /**
   * Clear all types (for new compilation)
   */
  clear() {
    this.types.clear();
  }

  /**
   * Export type data for serialization
   */
  export(): { [key: string]: VB6UDTDeclaration } {
    const result: { [key: string]: VB6UDTDeclaration } = {};
    for (const [key, value] of this.types.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Import type data from serialization
   */
  import(data: { [key: string]: VB6UDTDeclaration }) {
    this.types.clear();
    for (const [key, value] of Object.entries(data)) {
      this.types.set(key, value);
    }
  }
}

// Common VB6 system types (Windows API)
export const VB6SystemTypes = {
  RECT: {
    name: 'RECT',
    fields: [
      { name: 'Left', type: 'Long' },
      { name: 'Top', type: 'Long' },
      { name: 'Right', type: 'Long' },
      { name: 'Bottom', type: 'Long' },
    ],
    public: true,
    module: 'System',
    line: 0,
    size: 16,
  },

  POINT: {
    name: 'POINT',
    fields: [
      { name: 'x', type: 'Long' },
      { name: 'y', type: 'Long' },
    ],
    public: true,
    module: 'System',
    line: 0,
    size: 8,
  },

  SIZE: {
    name: 'SIZE',
    fields: [
      { name: 'cx', type: 'Long' },
      { name: 'cy', type: 'Long' },
    ],
    public: true,
    module: 'System',
    line: 0,
    size: 8,
  },
};

// Global UDT processor instance
export const udtProcessor = new VB6UDTProcessor();

// Initialize with system types
for (const [name, typeDecl] of Object.entries(VB6SystemTypes)) {
  udtProcessor.registerType(typeDecl);
}
