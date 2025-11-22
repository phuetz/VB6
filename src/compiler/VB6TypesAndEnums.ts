/**
 * VB6 Types and Enums Support Implementation
 * 
 * Complete implementation of VB6 User-Defined Types (UDT) and Enumerations
 * Provides type parsing, validation, and JavaScript code generation
 */

import { errorHandler } from '../runtime/VB6ErrorHandling';

// Type definition interfaces
export interface VB6TypeField {
  name: string;
  type: string;
  arrayDimensions?: number[];
  fixedLength?: number; // For fixed-length strings
  defaultValue?: any;
  line: number;
}

export interface VB6TypeDefinition {
  name: string;
  fields: VB6TypeField[];
  isPublic: boolean;
  module: string;
  line: number;
}

export interface VB6EnumMember {
  name: string;
  value: number;
  explicitValue: boolean;
  line: number;
}

export interface VB6EnumDefinition {
  name: string;
  members: VB6EnumMember[];
  isPublic: boolean;
  module: string;
  line: number;
}

/**
 * VB6 Types and Enums Processor
 */
export class VB6TypesAndEnumsProcessor {
  private types: Map<string, VB6TypeDefinition> = new Map();
  private enums: Map<string, VB6EnumDefinition> = new Map();
  private currentModule: string = 'Module1';

  setCurrentModule(module: string): void {
    this.currentModule = module;
  }

  /**
   * Parse Type definition
   * Example:
   * Type Employee
   *     Name As String * 50
   *     ID As Long
   *     Salary As Currency
   *     HireDate As Date
   *     Skills(10) As String
   * End Type
   */
  parseTypeDefinition(code: string, startLine: number): VB6TypeDefinition | null {
    const lines = code.split('\n');
    const firstLine = lines[0].trim();
    
    const typeMatch = firstLine.match(/^(Public\s+|Private\s+)?Type\s+(\w+)$/i);
    if (!typeMatch) return null;

    const isPublic = typeMatch[1] ? typeMatch[1].trim().toLowerCase() === 'public' : false;
    const typeName = typeMatch[2];

    const fields: VB6TypeField[] = [];
    let currentLine = startLine;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      currentLine++;

      if (line.toLowerCase() === 'end type') {
        break;
      }

      if (line && !line.startsWith("'")) {
        const field = this.parseTypeField(line, currentLine);
        if (field) {
          fields.push(field);
        }
      }
    }

    const typeDef: VB6TypeDefinition = {
      name: typeName,
      fields,
      isPublic,
      module: this.currentModule,
      line: startLine
    };

    this.registerType(typeDef);
    return typeDef;
  }

  /**
   * Parse type field
   */
  private parseTypeField(line: string, lineNumber: number): VB6TypeField | null {
    // Match field declaration with optional array and fixed-length string
    const fieldRegex = /^(\w+)(?:\(([^)]+)\))?\s+As\s+(.+)$/i;
    const match = line.match(fieldRegex);

    if (!match) return null;

    const fieldName = match[1];
    const arraySpec = match[2];
    const typeSpec = match[3].trim();

    const field: VB6TypeField = {
      name: fieldName,
      type: typeSpec,
      line: lineNumber
    };

    // Parse array dimensions
    if (arraySpec) {
      field.arrayDimensions = this.parseArrayDimensions(arraySpec);
    }

    // Parse fixed-length string
    const fixedStringMatch = typeSpec.match(/^String\s*\*\s*(\d+)$/i);
    if (fixedStringMatch) {
      field.type = 'String';
      field.fixedLength = parseInt(fixedStringMatch[1]);
    }

    // Set default value based on type
    field.defaultValue = this.getDefaultValueForType(field.type);

    return field;
  }

  /**
   * Parse array dimensions
   */
  private parseArrayDimensions(spec: string): number[] {
    const dimensions: number[] = [];
    const parts = spec.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes(' To ')) {
        // Range: "1 To 10"
        const [start, end] = trimmed.split(/\s+To\s+/i).map(s => parseInt(s.trim()));
        dimensions.push(end - start + 1);
      } else {
        // Single dimension: "10"
        dimensions.push(parseInt(trimmed) + 1); // VB6 arrays are 0-based by default
      }
    }

    return dimensions;
  }

  /**
   * Parse Enum definition
   * Example:
   * Enum ErrorTypes
   *     errNone = 0
   *     errFile = 1
   *     errNetwork = 2
   *     errDatabase
   * End Enum
   */
  parseEnumDefinition(code: string, startLine: number): VB6EnumDefinition | null {
    const lines = code.split('\n');
    const firstLine = lines[0].trim();

    const enumMatch = firstLine.match(/^(Public\s+|Private\s+)?Enum\s+(\w+)$/i);
    if (!enumMatch) return null;

    const isPublic = enumMatch[1] ? enumMatch[1].trim().toLowerCase() === 'public' : true; // Enums are public by default
    const enumName = enumMatch[2];

    const members: VB6EnumMember[] = [];
    let currentLine = startLine;
    let nextValue = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      currentLine++;

      if (line.toLowerCase() === 'end enum') {
        break;
      }

      if (line && !line.startsWith("'")) {
        const member = this.parseEnumMember(line, currentLine, nextValue);
        if (member) {
          members.push(member);
          nextValue = member.value + 1;
        }
      }
    }

    const enumDef: VB6EnumDefinition = {
      name: enumName,
      members,
      isPublic,
      module: this.currentModule,
      line: startLine
    };

    this.registerEnum(enumDef);
    return enumDef;
  }

  /**
   * Parse enum member
   */
  private parseEnumMember(line: string, lineNumber: number, defaultValue: number): VB6EnumMember | null {
    const memberRegex = /^(\w+)(?:\s*=\s*(.+))?$/;
    const match = line.match(memberRegex);

    if (!match) return null;

    const memberName = match[1];
    const valueExpr = match[2];

    let value = defaultValue;
    let explicitValue = false;

    if (valueExpr) {
      // Evaluate the expression
      value = this.evaluateEnumExpression(valueExpr);
      explicitValue = true;
    }

    return {
      name: memberName,
      value,
      explicitValue,
      line: lineNumber
    };
  }

  /**
   * Evaluate enum expression
   */
  private evaluateEnumExpression(expr: string): number {
    const trimmed = expr.trim();

    // Check for hex value
    if (trimmed.startsWith('&H') || trimmed.startsWith('&h')) {
      return parseInt(trimmed.substring(2), 16);
    }

    // Check for octal value
    if (trimmed.startsWith('&O') || trimmed.startsWith('&o')) {
      return parseInt(trimmed.substring(2), 8);
    }

    // Check for reference to another enum member
    const enumRef = this.findEnumMemberValue(trimmed);
    if (enumRef !== null) {
      return enumRef;
    }

    // Simple arithmetic expressions
    try {
      // Safe evaluation for simple expressions
      const safeExpr = trimmed.replace(/[^0-9+\-*/\s()]/g, '');
      if (safeExpr.trim() === '') return 0;
      
      // Use safe math evaluator
      return Math.floor(this.safeMathEvaluator(safeExpr));
    } catch {
      return 0;
    }
  }

  private safeMathEvaluator(expr: string): number {
    // Remove whitespace and validate input
    const cleanExpr = expr.replace(/\s/g, '');
    
    // Only allow numbers, operators, and parentheses
    if (!/^[\d+\-*/().]+$/.test(cleanExpr) || cleanExpr === '') {
      throw new Error('Invalid characters in expression');
    }

    // Simple recursive descent parser for arithmetic expressions
    let index = 0;
    
    const parseNumber = (): number => {
      let num = '';
      while (index < cleanExpr.length && /[\d.]/.test(cleanExpr[index])) {
        num += cleanExpr[index++];
      }
      const parsed = parseFloat(num);
      if (isNaN(parsed)) throw new Error('Invalid number');
      return parsed;
    };

    const parseFactor = (): number => {
      if (cleanExpr[index] === '(') {
        index++; // skip '('
        const result = parseExpression();
        if (cleanExpr[index] !== ')') throw new Error('Missing closing parenthesis');
        index++; // skip ')'
        return result;
      }
      if (cleanExpr[index] === '-') {
        index++; // skip '-'
        return -parseFactor();
      }
      if (cleanExpr[index] === '+') {
        index++; // skip '+'
        return parseFactor();
      }
      return parseNumber();
    };

    const parseTerm = (): number => {
      let result = parseFactor();
      while (index < cleanExpr.length && (cleanExpr[index] === '*' || cleanExpr[index] === '/')) {
        const op = cleanExpr[index++];
        const factor = parseFactor();
        if (op === '*') {
          result *= factor;
        } else {
          if (factor === 0) throw new Error('Division by zero');
          result /= factor;
        }
      }
      return result;
    };

    const parseExpression = (): number => {
      let result = parseTerm();
      while (index < cleanExpr.length && (cleanExpr[index] === '+' || cleanExpr[index] === '-')) {
        const op = cleanExpr[index++];
        const term = parseTerm();
        if (op === '+') {
          result += term;
        } else {
          result -= term;
        }
      }
      return result;
    };

    const result = parseExpression();
    if (index < cleanExpr.length) {
      throw new Error('Unexpected characters at end of expression');
    }
    return result;
  }

  /**
   * Find enum member value by reference
   */
  private findEnumMemberValue(ref: string): number | null {
    // Check if it's a qualified reference (EnumName.MemberName)
    const parts = ref.split('.');
    
    if (parts.length === 2) {
      const [enumName, memberName] = parts;
      const enumDef = this.getEnum(enumName);
      if (enumDef) {
        const member = enumDef.members.find(m => m.name === memberName);
        if (member) return member.value;
      }
    } else {
      // Search in all enums
      for (const enumDef of this.enums.values()) {
        const member = enumDef.members.find(m => m.name === ref);
        if (member) return member.value;
      }
    }

    return null;
  }

  /**
   * Register type definition
   */
  registerType(typeDef: VB6TypeDefinition): void {
    const key = typeDef.isPublic ? typeDef.name : `${this.currentModule}.${typeDef.name}`;
    this.types.set(key, typeDef);
    console.log(`[VB6 Types] Registered type: ${typeDef.name}`);
  }

  /**
   * Register enum definition
   */
  registerEnum(enumDef: VB6EnumDefinition): void {
    const key = enumDef.isPublic ? enumDef.name : `${this.currentModule}.${enumDef.name}`;
    this.enums.set(key, enumDef);
    console.log(`[VB6 Enums] Registered enum: ${enumDef.name}`);
  }

  /**
   * Get type definition
   */
  getType(typeName: string): VB6TypeDefinition | undefined {
    return this.types.get(typeName) || this.types.get(`${this.currentModule}.${typeName}`);
  }

  /**
   * Get enum definition
   */
  getEnum(enumName: string): VB6EnumDefinition | undefined {
    return this.enums.get(enumName) || this.enums.get(`${this.currentModule}.${enumName}`);
  }

  /**
   * Get default value for type
   */
  private getDefaultValueForType(type: string): any {
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
        return new Date(0);
      case 'variant':
      case 'object':
        return null;
      default:
        // Check if it's a custom type
        if (this.getType(type)) {
          return {}; // Will be initialized later
        }
        return null;
    }
  }

  /**
   * Generate JavaScript for Type
   */
  generateTypeJavaScript(typeDef: VB6TypeDefinition): string {
    let js = `// VB6 Type: ${typeDef.name}\n`;
    
    // Generate constructor function
    js += `function ${typeDef.name}() {\n`;
    
    for (const field of typeDef.fields) {
      if (field.arrayDimensions) {
        // Initialize array
        js += `  this.${field.name} = new Array(${field.arrayDimensions.join(' * ')});\n`;
        
        // Fill array with default values
        js += `  for (let i = 0; i < this.${field.name}.length; i++) {\n`;
        js += `    this.${field.name}[i] = ${this.getJSDefaultValue(field.type)};\n`;
        js += `  }\n`;
      } else if (field.fixedLength) {
        // Fixed-length string
        js += `  this.${field.name} = ''.padEnd(${field.fixedLength}, ' ');\n`;
      } else {
        // Regular field
        js += `  this.${field.name} = ${this.getJSDefaultValue(field.type)};\n`;
      }
    }
    
    js += `}\n\n`;
    
    // Generate factory function
    js += `function Create${typeDef.name}() {\n`;
    js += `  return new ${typeDef.name}();\n`;
    js += `}\n\n`;
    
    // Generate copy function
    js += `${typeDef.name}.prototype.copy = function() {\n`;
    js += `  const copy = new ${typeDef.name}();\n`;
    for (const field of typeDef.fields) {
      if (field.arrayDimensions) {
        js += `  copy.${field.name} = [...this.${field.name}];\n`;
      } else {
        js += `  copy.${field.name} = this.${field.name};\n`;
      }
    }
    js += `  return copy;\n`;
    js += `};\n\n`;
    
    return js;
  }

  /**
   * Generate JavaScript for Enum
   */
  generateEnumJavaScript(enumDef: VB6EnumDefinition): string {
    let js = `// VB6 Enum: ${enumDef.name}\n`;
    js += `const ${enumDef.name} = {\n`;
    
    for (const member of enumDef.members) {
      js += `  ${member.name}: ${member.value},\n`;
    }
    
    js += `};\n\n`;
    
    // Add reverse mapping for debugging
    js += `// Reverse mapping for ${enumDef.name}\n`;
    js += `${enumDef.name}._names = {\n`;
    for (const member of enumDef.members) {
      js += `  ${member.value}: '${member.name}',\n`;
    }
    js += `};\n\n`;
    
    // Add helper function to get name from value
    js += `${enumDef.name}.getName = function(value) {\n`;
    js += `  return ${enumDef.name}._names[value] || 'Unknown';\n`;
    js += `};\n\n`;
    
    // Make enum values global (VB6 style)
    js += `// Global enum members\n`;
    for (const member of enumDef.members) {
      js += `const ${member.name} = ${member.value};\n`;
    }
    js += `\n`;
    
    return js;
  }

  /**
   * Get JavaScript default value
   */
  private getJSDefaultValue(type: string): string {
    switch (type.toLowerCase()) {
      case 'integer':
      case 'long':
      case 'byte':
        return '0';
      case 'single':
      case 'double':
      case 'currency':
        return '0.0';
      case 'string':
        return "''";
      case 'boolean':
        return 'false';
      case 'date':
        return 'new Date(0)';
      case 'variant':
      case 'object':
        return 'null';
      default:
        // Check if it's a custom type
        if (this.getType(type)) {
          return `new ${type}()`;
        }
        return 'null';
    }
  }

  /**
   * Validate type usage
   */
  validateTypeUsage(typeName: string, context: string): boolean {
    const typeDef = this.getType(typeName);
    if (!typeDef) {
      console.error(`[VB6 Types] Unknown type: ${typeName} in ${context}`);
      return false;
    }
    return true;
  }

  /**
   * Validate enum usage
   */
  validateEnumUsage(enumName: string, memberName: string, context: string): boolean {
    const enumDef = this.getEnum(enumName);
    if (!enumDef) {
      console.error(`[VB6 Enums] Unknown enum: ${enumName} in ${context}`);
      return false;
    }

    if (memberName && !enumDef.members.find(m => m.name === memberName)) {
      console.error(`[VB6 Enums] Unknown member ${memberName} in enum ${enumName}`);
      return false;
    }

    return true;
  }

  /**
   * Generate TypeScript interface for Type
   */
  generateTypeScriptInterface(typeDef: VB6TypeDefinition): string {
    let ts = `// VB6 Type: ${typeDef.name}\n`;
    ts += `interface ${typeDef.name} {\n`;
    
    for (const field of typeDef.fields) {
      const tsType = this.mapVB6TypeToTypeScript(field.type);
      
      if (field.arrayDimensions) {
        ts += `  ${field.name}: ${tsType}[];\n`;
      } else {
        ts += `  ${field.name}: ${tsType};\n`;
      }
    }
    
    ts += `}\n\n`;
    
    return ts;
  }

  /**
   * Generate TypeScript enum
   */
  generateTypeScriptEnum(enumDef: VB6EnumDefinition): string {
    let ts = `// VB6 Enum: ${enumDef.name}\n`;
    ts += `enum ${enumDef.name} {\n`;
    
    for (const member of enumDef.members) {
      ts += `  ${member.name} = ${member.value},\n`;
    }
    
    ts += `}\n\n`;
    
    return ts;
  }

  /**
   * Map VB6 type to TypeScript type
   */
  private mapVB6TypeToTypeScript(vb6Type: string): string {
    switch (vb6Type.toLowerCase()) {
      case 'integer':
      case 'long':
      case 'byte':
      case 'single':
      case 'double':
      case 'currency':
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
        // Assume it's a custom type
        return vb6Type;
    }
  }

  /**
   * Clear all types and enums
   */
  clear(): void {
    this.types.clear();
    this.enums.clear();
  }

  /**
   * Export data for serialization
   */
  export(): {
    types: { [key: string]: VB6TypeDefinition };
    enums: { [key: string]: VB6EnumDefinition };
  } {
    const types: { [key: string]: VB6TypeDefinition } = {};
    const enums: { [key: string]: VB6EnumDefinition } = {};

    for (const [key, value] of this.types.entries()) {
      types[key] = value;
    }

    for (const [key, value] of this.enums.entries()) {
      enums[key] = value;
    }

    return { types, enums };
  }

  /**
   * Import data from serialization
   */
  import(data: {
    types: { [key: string]: VB6TypeDefinition };
    enums: { [key: string]: VB6EnumDefinition };
  }): void {
    this.clear();

    for (const [key, value] of Object.entries(data.types)) {
      this.types.set(key, value);
    }

    for (const [key, value] of Object.entries(data.enums)) {
      this.enums.set(key, value);
    }
  }
}

// Global processor instance
export const typesAndEnumsProcessor = new VB6TypesAndEnumsProcessor();

// Example VB6 patterns
export const VB6TypesAndEnumsExamples = {
  // Basic type
  EmployeeType: `
Type Employee
    Name As String * 50
    ID As Long
    Salary As Currency
    HireDate As Date
    Active As Boolean
End Type
`,

  // Type with arrays
  MatrixType: `
Type Matrix
    Rows As Integer
    Columns As Integer
    Data(100, 100) As Double
    Labels(100) As String
End Type
`,

  // Nested types
  CompanyType: `
Type Address
    Street As String * 100
    City As String * 50
    State As String * 2
    ZipCode As String * 10
End Type

Type Company
    Name As String * 100
    MainAddress As Address
    Branches(10) As Address
    EmployeeCount As Long
End Type
`,

  // Basic enum
  ErrorEnum: `
Enum ErrorTypes
    errNone = 0
    errFile = 1
    errNetwork = 2
    errDatabase = 3
    errUser = 100
    errSystem = 200
End Enum
`,

  // Enum with expressions
  ColorEnum: `
Enum Colors
    clrRed = &HFF
    clrGreen = &HFF00
    clrBlue = &HFF0000
    clrYellow = clrRed + clrGreen
    clrCyan = clrGreen + clrBlue
    clrMagenta = clrRed + clrBlue
    clrWhite = clrRed + clrGreen + clrBlue
End Enum
`,

  // Flag enum
  FileAttributesEnum: `
Enum FileAttributes
    faReadOnly = 1
    faHidden = 2
    faSystem = 4
    faDirectory = 16
    faArchive = 32
    faNormal = 128
    faTemporary = 256
    faCompressed = 2048
End Enum
`
};

// Export types
export {
  VB6TypeField,
  VB6TypeDefinition,
  VB6EnumMember,
  VB6EnumDefinition
};