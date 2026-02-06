/**
 * VB6 Enum Support Implementation
 *
 * Provides full support for VB6 Enum declarations and usage
 */

export interface VB6EnumMember {
  name: string;
  value: number | string;
  explicitValue?: boolean;
}

export interface VB6EnumDeclaration {
  name: string;
  members: VB6EnumMember[];
  public: boolean;
  module: string;
  line: number;
}

export class VB6EnumProcessor {
  private enums: Map<string, VB6EnumDeclaration> = new Map();
  private currentModule: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 Enum declaration
   * Example:
   * Enum ErrorTypes
   *     errNone = 0
   *     errFile = 1
   *     errNetwork
   * End Enum
   */
  parseEnumDeclaration(code: string, line: number): VB6EnumDeclaration | null {
    const enumRegex = /^(Public\s+|Private\s+)?Enum\s+(\w+)\s*$/i;
    const match = code.match(enumRegex);

    if (!match) return null;

    const isPublic = match[1] ? match[1].toLowerCase().includes('public') : false;
    const enumName = match[2];

    return {
      name: enumName,
      members: [],
      public: isPublic,
      module: this.currentModule,
      line: line,
    };
  }

  /**
   * Parse enum member
   * Examples:
   * errNone = 0
   * errFile
   * errNetwork = &H10
   */
  parseEnumMember(code: string): VB6EnumMember | null {
    const memberRegex = /^\s*(\w+)(?:\s*=\s*(.+))?\s*$/;
    const match = code.match(memberRegex);

    if (!match) return null;

    const name = match[1];
    const valueStr = match[2];

    let value: number | string = 0;
    let explicitValue = false;

    if (valueStr) {
      explicitValue = true;
      value = this.parseEnumValue(valueStr.trim());
    }

    return {
      name,
      value,
      explicitValue,
    };
  }

  /**
   * Parse enum value (supports hex, oct, expressions)
   */
  private parseEnumValue(valueStr: string): number {
    // Hex values (&H prefix)
    if (valueStr.toLowerCase().startsWith('&h')) {
      return parseInt(valueStr.substring(2), 16);
    }

    // Octal values (&O prefix)
    if (valueStr.toLowerCase().startsWith('&o')) {
      return parseInt(valueStr.substring(2), 8);
    }

    // Binary values (&B prefix - VB6 extension)
    if (valueStr.toLowerCase().startsWith('&b')) {
      return parseInt(valueStr.substring(2), 2);
    }

    // Simple numeric value
    const numValue = parseInt(valueStr);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Expression evaluation (simplified)
    try {
      // Handle basic arithmetic expressions
      const sanitizedExpr = valueStr.replace(/[^0-9+*/()-]/g, '');
      return Function(`"use strict"; return (${sanitizedExpr})`)();
    } catch {
      return 0;
    }
  }

  /**
   * Process complete enum declaration
   */
  processEnum(enumDecl: VB6EnumDeclaration, memberLines: string[]): VB6EnumDeclaration {
    let currentValue = 0;

    for (const line of memberLines) {
      const member = this.parseEnumMember(line);
      if (member) {
        if (!member.explicitValue) {
          member.value = currentValue;
        }

        if (typeof member.value === 'number') {
          currentValue = member.value + 1;
        }

        enumDecl.members.push(member);
      }
    }

    return enumDecl;
  }

  /**
   * Register enum in global scope
   */
  registerEnum(enumDecl: VB6EnumDeclaration) {
    const fullName = enumDecl.public ? enumDecl.name : `${this.currentModule}.${enumDecl.name}`;
    this.enums.set(fullName, enumDecl);

    // Also register individual members for global access
    for (const member of enumDecl.members) {
      const memberKey = enumDecl.public ? member.name : `${this.currentModule}.${member.name}`;
      this.enums.set(memberKey, {
        ...enumDecl,
        members: [member],
      });
    }
  }

  /**
   * Get enum by name
   */
  getEnum(name: string): VB6EnumDeclaration | undefined {
    return this.enums.get(name) || this.enums.get(`${this.currentModule}.${name}`);
  }

  /**
   * Get enum member value
   */
  getEnumValue(enumName: string, memberName: string): number | undefined {
    const enumDecl = this.getEnum(enumName);
    if (!enumDecl) return undefined;

    const member = enumDecl.members.find(m => m.name === memberName);
    return typeof member?.value === 'number' ? member.value : undefined;
  }

  /**
   * Check if identifier is an enum member
   */
  isEnumMember(identifier: string): boolean {
    return this.enums.has(identifier) || this.enums.has(`${this.currentModule}.${identifier}`);
  }

  /**
   * Generate JavaScript code for enum
   */
  generateJavaScript(enumDecl: VB6EnumDeclaration): string {
    const enumName = enumDecl.name;
    const members = enumDecl.members;

    let jsCode = `// Enum ${enumName}\n`;
    jsCode += `const ${enumName} = {\n`;

    for (const member of members) {
      jsCode += `  ${member.name}: ${member.value},\n`;
    }

    jsCode += `};\n\n`;

    // Create reverse mapping (value to name)
    jsCode += `${enumName}._names = {\n`;
    for (const member of members) {
      jsCode += `  ${member.value}: "${member.name}",\n`;
    }
    jsCode += `};\n\n`;

    // Helper methods
    jsCode += `${enumName}.getName = function(value) { return this._names[value] || "Unknown"; };\n`;
    jsCode += `${enumName}.hasValue = function(value) { return value in this._names; };\n`;
    jsCode += `${enumName}.values = function() { return Object.values(this).filter(v => typeof v === 'number'); };\n`;
    jsCode += `${enumName}.names = function() { return Object.keys(this).filter(k => k !== '_names' && typeof this[k] === 'number'); };\n\n`;

    return jsCode;
  }

  /**
   * Generate TypeScript definitions
   */
  generateTypeScript(enumDecl: VB6EnumDeclaration): string {
    const enumName = enumDecl.name;
    const members = enumDecl.members;

    let tsCode = `enum ${enumName} {\n`;

    for (const member of members) {
      if (member.explicitValue) {
        tsCode += `  ${member.name} = ${member.value},\n`;
      } else {
        tsCode += `  ${member.name},\n`;
      }
    }

    tsCode += `}\n\n`;

    return tsCode;
  }

  /**
   * Get all enums in current module
   */
  getModuleEnums(): VB6EnumDeclaration[] {
    return Array.from(this.enums.values()).filter(e => e.module === this.currentModule);
  }

  /**
   * Clear all enums (for new compilation)
   */
  clear() {
    this.enums.clear();
  }

  /**
   * Export enum data for serialization
   */
  export(): { [key: string]: VB6EnumDeclaration } {
    const result: { [key: string]: VB6EnumDeclaration } = {};
    for (const [key, value] of this.enums.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Import enum data from serialization
   */
  import(data: { [key: string]: VB6EnumDeclaration }) {
    this.enums.clear();
    for (const [key, value] of Object.entries(data)) {
      this.enums.set(key, value);
    }
  }
}

// Common VB6 Enums (built-in)
export const VB6BuiltinEnums = {
  // VbMsgBoxResult
  VbMsgBoxResult: {
    name: 'VbMsgBoxResult',
    members: [
      { name: 'vbOK', value: 1, explicitValue: true },
      { name: 'vbCancel', value: 2, explicitValue: true },
      { name: 'vbAbort', value: 3, explicitValue: true },
      { name: 'vbRetry', value: 4, explicitValue: true },
      { name: 'vbIgnore', value: 5, explicitValue: true },
      { name: 'vbYes', value: 6, explicitValue: true },
      { name: 'vbNo', value: 7, explicitValue: true },
    ],
    public: true,
    module: 'VBA',
    line: 0,
  },

  // VbMsgBoxStyle
  VbMsgBoxStyle: {
    name: 'VbMsgBoxStyle',
    members: [
      { name: 'vbOKOnly', value: 0, explicitValue: true },
      { name: 'vbOKCancel', value: 1, explicitValue: true },
      { name: 'vbAbortRetryIgnore', value: 2, explicitValue: true },
      { name: 'vbYesNoCancel', value: 3, explicitValue: true },
      { name: 'vbYesNo', value: 4, explicitValue: true },
      { name: 'vbRetryCancel', value: 5, explicitValue: true },
      { name: 'vbCritical', value: 16, explicitValue: true },
      { name: 'vbQuestion', value: 32, explicitValue: true },
      { name: 'vbExclamation', value: 48, explicitValue: true },
      { name: 'vbInformation', value: 64, explicitValue: true },
    ],
    public: true,
    module: 'VBA',
    line: 0,
  },

  // VbVarType
  VbVarType: {
    name: 'VbVarType',
    members: [
      { name: 'vbEmpty', value: 0, explicitValue: true },
      { name: 'vbNull', value: 1, explicitValue: true },
      { name: 'vbInteger', value: 2, explicitValue: true },
      { name: 'vbLong', value: 3, explicitValue: true },
      { name: 'vbSingle', value: 4, explicitValue: true },
      { name: 'vbDouble', value: 5, explicitValue: true },
      { name: 'vbCurrency', value: 6, explicitValue: true },
      { name: 'vbDate', value: 7, explicitValue: true },
      { name: 'vbString', value: 8, explicitValue: true },
      { name: 'vbObject', value: 9, explicitValue: true },
      { name: 'vbError', value: 10, explicitValue: true },
      { name: 'vbBoolean', value: 11, explicitValue: true },
      { name: 'vbVariant', value: 12, explicitValue: true },
      { name: 'vbArray', value: 8192, explicitValue: true },
    ],
    public: true,
    module: 'VBA',
    line: 0,
  },
};

// Global enum processor instance
export const enumProcessor = new VB6EnumProcessor();

// Initialize with built-in enums
for (const [name, enumDecl] of Object.entries(VB6BuiltinEnums)) {
  enumProcessor.registerEnum(enumDecl);
}
