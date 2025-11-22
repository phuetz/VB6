import { VB6Enum, VB6UDT, VB6Const, VB6DeclareFunction, VB6ExtendedModuleAST } from '../utils/vb6ParserExtended';
import { vb6TypeSystem } from './VB6TypeSystem';

/**
 * VB6 to JavaScript Transpiler for Extended Language Features
 * Handles UDTs, Enums, Constants, Declares, etc.
 */
export class VB6EnumTranspiler {
  
  /**
   * Transpile VB6 Enum to JavaScript
   */
  transpileEnum(enumDef: VB6Enum): string {
    let js = '';
    
    // Create enum object
    // PARSER EDGE CASE FIX: Sanitize enum name to prevent code injection
    const safeName = this.sanitizeIdentifier(enumDef.name);
    js += `// ${enumDef.visibility} Enum ${safeName}\n`;
    js += `const ${safeName} = Object.freeze({\n`;
    
    let currentValue = 0;
    const enumEntries: string[] = [];
    
    for (const value of enumDef.values) {
      if (value.value !== undefined) {
        if (typeof value.value === 'number') {
          currentValue = value.value;
        } else {
          // Handle string expressions
          const resolvedValue = this.resolveEnumExpression(value.value.toString());
          currentValue = resolvedValue;
        }
      }
      
      // PARSER EDGE CASE FIX: Sanitize enum value names
      const safeValueName = this.sanitizeIdentifier(value.name);
      enumEntries.push(`  ${safeValueName}: ${currentValue}`);
      
      // Also create reverse mapping for debugging
      if (typeof currentValue === 'number' && currentValue >= -2147483648 && currentValue <= 2147483647) {
        enumEntries.push(`  ${currentValue}: '${safeValueName}'`);
      }
      
      currentValue++;
    }
    
    js += enumEntries.join(',\n');
    js += '\n});\n\n';
    
    // Register in type system
    // PARSER EDGE CASE FIX: Use safe JSON stringify
    js += `vb6TypeSystem.registerEnum(${this.safeJsonStringify(enumDef)});\n\n`;
    
    return js;
  }

  /**
   * Transpile VB6 UDT to JavaScript class
   */
  transpileUDT(udt: VB6UDT): string {
    let js = '';
    
    // Create UDT class
    // PARSER EDGE CASE FIX: Sanitize UDT name
    const safeName = this.sanitizeIdentifier(udt.name);
    js += `// ${udt.visibility} Type ${safeName}\n`;
    js += `class ${safeName} {\n`;
    
    // Constructor
    js += '  constructor() {\n';
    for (const field of udt.fields) {
      const defaultValue = this.getFieldDefaultValue(field);
      // PARSER EDGE CASE FIX: Sanitize field names
      js += `    this.${this.sanitizeIdentifier(field.name)} = ${defaultValue};\n`;
    }
    js += '  }\n\n';
    
    // Clone method for copying UDT instances
    js += '  clone() {\n';
    js += `    const copy = new ${safeName}();\n`;
    for (const field of udt.fields) {
      const safeFieldName = this.sanitizeIdentifier(field.name);
      if (field.isArray) {
        js += `    copy.${safeFieldName} = [...this.${safeFieldName}];\n`;
      } else {
        js += `    copy.${safeFieldName} = this.${safeFieldName};\n`;
      }
    }
    js += '    return copy;\n';
    js += '  }\n\n';
    
    // toString method for debugging
    js += '  toString() {\n';
    js += `    return \`${safeName} { \${Object.entries(this).map(([k,v]) => \`\${k}: \${v}\`).join(', ')} }\`;\n`;
    js += '  }\n';
    
    js += '}\n\n';
    
    // Register in type system
    // PARSER EDGE CASE FIX: Use safe JSON stringify
    js += `vb6TypeSystem.registerUDT(${this.safeJsonStringify(udt)});\n\n`;
    
    return js;
  }

  /**
   * Transpile VB6 Const to JavaScript
   */
  transpileConstant(constant: VB6Const): string {
    let js = '';
    
    const jsValue = this.transpileConstantValue(constant.value);
    js += `// ${constant.visibility} Const ${constant.name}`;
    if (constant.type) {
      js += ` As ${constant.type}`;
    }
    js += '\n';
    // PARSER EDGE CASE FIX: Sanitize constant name
    js += `const ${this.sanitizeIdentifier(constant.name)} = ${jsValue};\n\n`;
    
    // Register in type system
    // PARSER EDGE CASE FIX: Use safe JSON stringify
    js += `vb6TypeSystem.registerConstant(${this.safeJsonStringify(constant)});\n\n`;
    
    return js;
  }

  /**
   * Transpile VB6 Declare to JavaScript function stub
   */
  transpileDeclare(declare: VB6DeclareFunction): string {
    let js = '';
    
    js += `// ${declare.visibility} Declare ${declare.isFunction ? 'Function' : 'Sub'} ${declare.name}\n`;
    // PARSER EDGE CASE FIX: Escape library name
    js += `// Lib "${this.escapeString(declare.libraryName)}"`;
    if (declare.aliasName) {
      js += ` Alias "${this.escapeString(declare.aliasName)}"`;
    }
    js += '\n';
    
    // PARSER EDGE CASE FIX: Sanitize parameter and function names
    const params = declare.parameters.map(p => this.sanitizeIdentifier(p.name)).join(', ');
    const safeName = this.sanitizeIdentifier(declare.name);
    
    js += `${declare.isFunction ? 'function' : 'function'} ${safeName}(${params}) {\n`;
    js += '  // Windows API call simulation\n';
    js += `  console.warn('Windows API call: ${this.escapeString(declare.name)} from ${this.escapeString(declare.libraryName)}');\n`;
    
    if (declare.isFunction) {
      // Return appropriate default value based on return type
      const defaultReturn = this.getTypeDefaultValue(declare.returnType || 'Long');
      js += `  return ${defaultReturn}; // Simulated return value\n`;
    }
    
    js += '}\n\n';
    
    // Register in type system
    // PARSER EDGE CASE FIX: Use safe JSON stringify
    js += `vb6TypeSystem.registerDeclare(${this.safeJsonStringify(declare)});\n\n`;
    
    return js;
  }

  /**
   * Transpile WithEvents variable declaration
   */
  transpileWithEventsVariable(varName: string, className: string): string {
    let js = '';
    
    // PARSER EDGE CASE FIX: Sanitize variable and class names
    const safeVarName = this.sanitizeIdentifier(varName);
    const safeClassName = this.sanitizeIdentifier(className);
    js += `// WithEvents ${safeVarName} As ${safeClassName}\n`;
    js += `let ${safeVarName} = null;\n`;
    js += `let ${safeVarName}_Events = new EventTarget();\n\n`;
    
    // Helper function to connect events
    js += `function Connect${safeVarName}() {\n`;
    js += `  if (${varName} && ${varName}.addEventListener) {\n`;
    js += `    // Connect VB6 events to JavaScript events\n`;
    js += `    Object.getOwnPropertyNames(Object.getPrototypeOf(${varName}))\n`;
    js += `      .filter(name => name.startsWith('on'))\n`;
    js += `      .forEach(eventName => {\n`;
    js += `        const vb6EventName = eventName.slice(2); // Remove 'on' prefix\n`;
    js += `        ${varName}.addEventListener(vb6EventName, (e) => {\n`;
    js += `          ${varName}_Events.dispatchEvent(new CustomEvent(vb6EventName, { detail: e }));\n`;
    js += `        });\n`;
    js += `      });\n`;
    js += `  }\n`;
    js += `}\n\n`;
    
    return js;
  }

  /**
   * Transpile RaiseEvent statement
   */
  transpileRaiseEvent(eventName: string, parameters: string[]): string {
    let js = '';
    
    const paramList = parameters.join(', ');
    js += `// RaiseEvent ${eventName}(${paramList})\n`;
    js += `if (typeof ${eventName}_Event === 'function') {\n`;
    js += `  ${eventName}_Event(${paramList});\n`;
    js += `}\n`;
    js += `// Also dispatch as custom event\n`;
    // PARSER EDGE CASE FIX: Sanitize event name
    js += `document.dispatchEvent(new CustomEvent('${this.escapeString(eventName)}', {\n`;
    js += `  detail: { ${parameters.map((p, i) => `param${i}: ${p}`).join(', ')} }\n`;
    js += `}));\n\n`;
    
    return js;
  }

  /**
   * Transpile Property Get/Let/Set procedures
   */
  transpileProperty(propertyName: string, propertyType: 'get' | 'let' | 'set', 
                   parameters: string[], returnType?: string, body?: string): string {
    let js = '';
    
    const backingField = `_${propertyName}`;
    
    if (propertyType === 'get') {
      js += `// Property Get ${propertyName}\n`;
      js += `get ${propertyName}() {\n`;
      if (body) {
        js += this.transpilePropertyBody(body);
      } else {
        js += `  return this.${backingField};\n`;
      }
      js += `}\n\n`;
    } else if (propertyType === 'let') {
      js += `// Property Let ${propertyName}\n`;
      js += `set ${propertyName}(value) {\n`;
      if (body) {
        js += this.transpilePropertyBody(body);
      } else {
        js += `  this.${backingField} = value;\n`;
      }
      js += `}\n\n`;
    } else if (propertyType === 'set') {
      js += `// Property Set ${propertyName}\n`;
      js += `set ${propertyName}(objRef) {\n`;
      if (body) {
        js += this.transpilePropertyBody(body);
      } else {
        js += `  this.${backingField} = objRef;\n`;
      }
      js += `}\n\n`;
    }
    
    return js;
  }

  /**
   * Transpile entire extended module
   */
  transpileExtendedModule(ast: VB6ExtendedModuleAST): string {
    let js = '';
    
    // Header comment
    // PARSER EDGE CASE FIX: Sanitize module name in comment
    js += `// Transpiled from VB6 module: ${this.escapeString(ast.name)}\n`;
    js += `// Generated on ${new Date().toISOString()}\n\n`;
    
    // Import type system
    js += `import { vb6TypeSystem } from './VB6TypeSystem';\n\n`;
    
    // Transpile constants first (they might be used by other constructs)
    js += '// ===== CONSTANTS =====\n';
    for (const constant of ast.constants) {
      js += this.transpileConstant(constant);
    }
    
    // Transpile enums
    js += '// ===== ENUMS =====\n';
    for (const enumDef of ast.enums) {
      js += this.transpileEnum(enumDef);
    }
    
    // Transpile UDTs
    js += '// ===== USER DEFINED TYPES =====\n';
    for (const udt of ast.udts) {
      js += this.transpileUDT(udt);
    }
    
    // Transpile declare statements
    js += '// ===== DECLARE STATEMENTS =====\n';
    for (const declare of ast.declares) {
      js += this.transpileDeclare(declare);
    }
    
    // Transpile WithEvents variables
    js += '// ===== WITH EVENTS VARIABLES =====\n';
    for (const withEventsVar of ast.withEventsVariables) {
      js += this.transpileWithEventsVariable(withEventsVar.name, withEventsVar.objectType || 'Object');
    }
    
    return js;
  }

  /**
   * Resolve enum expression (handle constants and arithmetic)
   */
  private resolveEnumExpression(expression: string): number {
    // Simple expression evaluator for enum values
    // PARSER EDGE CASE FIX: Add bounds checking and validation
    
    if (typeof expression !== 'string' || expression.length > 100) {
      return 0;
    }
    
    // Try direct number parsing with bounds check
    const numValue = parseFloat(expression);
    if (!isNaN(numValue) && isFinite(numValue) && numValue >= -2147483648 && numValue <= 2147483647) {
      return Math.floor(numValue);
    }
    
    // Handle hex numbers
    // PARSER EDGE CASE FIX: Limit hex number length
    if (expression.match(/^&H[0-9A-F]{1,8}$/i)) {
      const hexValue = parseInt(expression.substring(2), 16);
      if (!isNaN(hexValue) && hexValue >= -2147483648 && hexValue <= 2147483647) {
        return hexValue;
      }
    }
    
    // Handle octal numbers
    // PARSER EDGE CASE FIX: Limit octal number length
    if (expression.match(/^&O[0-7]{1,11}$/i)) {
      const octValue = parseInt(expression.substring(2), 8);
      if (!isNaN(octValue) && octValue >= -2147483648 && octValue <= 2147483647) {
        return octValue;
      }
    }
    
    // Try to resolve as constant
    try {
      return vb6TypeSystem.getConstantValue(expression);
    } catch {
      // If can't resolve, return 0
      return 0;
    }
  }

  /**
   * Get default value for a UDT field
   */
  private getFieldDefaultValue(field: any): string {
    if (field.isArray) {
      if (field.arrayBounds) {
        // Parse array bounds like "(1 To 10)" or "(0 To 99, 1 To 50)"
        const bounds = this.parseArrayBounds(field.arrayBounds);
        return this.createArrayWithBounds(bounds);
      }
      return '[]';
    }
    
    return this.getTypeDefaultValue(field.type);
  }

  /**
   * Get default value for a VB6 type
   */
  private getTypeDefaultValue(vb6Type: string): string {
    const lowerType = vb6Type.toLowerCase();
    
    switch (lowerType) {
      case 'byte':
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
        return '0';
      case 'string':
        return '""';
      case 'boolean':
        return 'false';
      case 'date':
        return 'new Date(1899, 11, 30)'; // VB6 date zero
      case 'variant':
      case 'object':
        return 'null';
      default:
        // UDT or Enum
        if (vb6TypeSystem.getAllUDTs().some(u => u.name.toLowerCase() === lowerType)) {
          return `new ${vb6Type}()`;
        }
        return '0'; // Default for enums
    }
  }

  /**
   * Transpile constant value to JavaScript
   */
  private transpileConstantValue(value: string | number | boolean): string {
    if (typeof value === 'string') {
      // PARSER EDGE CASE FIX: Properly escape string literals
      return JSON.stringify(value);
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else if (typeof value === 'number') {
      // PARSER EDGE CASE FIX: Validate number bounds
      if (!isFinite(value)) return '0';
      return value.toString();
    } else {
      return '0';
    }
  }

  /**
   * Parse VB6 array bounds
   */
  private parseArrayBounds(bounds: string): Array<{lower: number, upper: number}> {
    // PARSER EDGE CASE FIX: Add input validation
    if (typeof bounds !== 'string' || bounds.length > 1000) {
      return [{lower: 0, upper: 0}];
    }
    
    // Remove parentheses and split by comma for multi-dimensional arrays
    const cleaned = bounds.replace(/[()]/g, '').trim();
    const dimensions = cleaned.split(',').slice(0, 10); // Limit dimensions
    
    return dimensions.map(dim => {
      const trimmed = dim.trim();
      // PARSER EDGE CASE FIX: Use bounded regex
      const toMatch = trimmed.match(/^(\d{1,10})\s+To\s+(\d{1,10})$/i);
      
      if (toMatch) {
        // PARSER EDGE CASE FIX: Add bounds checking
        const lower = parseInt(toMatch[1], 10);
        const upper = parseInt(toMatch[2], 10);
        if (!isNaN(lower) && !isNaN(upper) && lower >= 0 && upper >= lower && upper < 100000) {
          return { lower, upper };
        }
      } else {
        // Single number means 0 to that number
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 0 && num < 100000) {
          return { lower: 0, upper: num };
        }
      }
      return { lower: 0, upper: 0 };
    });
  }

  /**
   * Create JavaScript array initialization with VB6 bounds
   */
  private createArrayWithBounds(bounds: Array<{lower: number, upper: number}>): string {
    if (bounds.length === 1) {
      // Single dimension
      const size = bounds[0].upper - bounds[0].lower + 1;
      return `new Array(${size}).fill(${this.getTypeDefaultValue('Variant')})`;
    } else {
      // Multi-dimensional - create nested arrays
      let result = 'Array.from({length: ' + (bounds[0].upper - bounds[0].lower + 1) + '}, () => ';
      for (let i = 1; i < bounds.length; i++) {
        result += 'Array.from({length: ' + (bounds[i].upper - bounds[i].lower + 1) + '}, () => ';
      }
      result += this.getTypeDefaultValue('Variant');
      for (let i = 1; i < bounds.length; i++) {
        result += ')';
      }
      result += ')';
      return result;
    }
  }

  /**
   * Transpile property body (simplified)
   */
  private transpilePropertyBody(body: string): string {
    // This would need a full VB6 to JS transpiler
    // PARSER EDGE CASE FIX: Add input validation
    if (typeof body !== 'string' || body.length > 100000) {
      return '  // Body too large or invalid\n';
    }
    
    let js = body;
    
    // Basic VB6 to JS transformations
    js = js.replace(/\bDim\b/gi, 'let');
    js = js.replace(/\bAs\s+\w+/gi, ''); // Remove type declarations
    js = js.replace(/\bThen\b/gi, '');
    js = js.replace(/\bEnd\s+If\b/gi, '}');
    js = js.replace(/\bElse\b/gi, '} else {');
    js = js.replace(/\bIf\b/gi, 'if (');
    js = js.replace(/\bAnd\b/gi, '&&');
    js = js.replace(/\bOr\b/gi, '||');
    js = js.replace(/\bNot\b/gi, '!');
    
    return '  ' + js.split('\n').join('\n  ') + '\n';
  }
  // PARSER EDGE CASE FIX: Add sanitization helper methods
  private sanitizeIdentifier(name: string): string {
    if (!name || typeof name !== 'string') return 'InvalidIdentifier';
    const sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '_');
    if (/^[0-9]/.test(sanitized)) {
      return '_' + sanitized;
    }
    return sanitized.substring(0, 100);
  }

  private escapeString(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[\\'"\n\r\t]/g, (match) => {
      const escapes: {[key: string]: string} = {
        '\\': '\\\\',
        "'": "\\'",
        '"': '\\"',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t'
      };
      return escapes[match] || match;
    }).substring(0, 1000);
  }

  private safeJsonStringify(obj: any): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        if (typeof value === 'string' && value.length > 10000) {
          return value.substring(0, 10000) + '...';
        }
        return value;
      });
    } catch (error) {
      return 'null';
    }
  }
}

export const vb6EnumTranspiler = new VB6EnumTranspiler();
export default vb6EnumTranspiler;