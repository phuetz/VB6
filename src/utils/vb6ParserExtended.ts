import { parseVB6Module, VB6ModuleAST, VB6Parameter, VB6Procedure, VB6Visibility, VB6ProcedureType, VB6Variable, VB6Event, VB6Property } from './vb6Parser';

// Extended interfaces for VB6 language features

export interface VB6UDTField {
  name: string;
  type: string;
  isArray?: boolean;
  arrayBounds?: string; // e.g., "(1 To 10)" or "(0 To 99, 1 To 50)"
  isFixedString?: boolean;
  fixedStringLength?: number;
}

export interface VB6UDT {
  name: string;
  visibility: VB6Visibility;
  fields: VB6UDTField[];
}

export interface VB6Enum {
  name: string;
  visibility: VB6Visibility;
  values: VB6EnumValue[];
}

export interface VB6EnumValue {
  name: string;
  value?: number | string; // Can be explicit value or auto-increment
}

export interface VB6Const {
  name: string;
  type?: string;
  value: string | number | boolean;
  visibility: VB6Visibility;
}

export interface VB6DeclareFunction {
  name: string;
  visibility: VB6Visibility;
  aliasName?: string;
  libraryName: string;
  parameters: VB6Parameter[];
  returnType?: string;
  isFunction: boolean; // true for Function, false for Sub
  charset?: 'Ansi' | 'Unicode' | 'Auto';
}

export interface VB6WithEventsVariable extends VB6Variable {
  withEvents: boolean;
  objectType?: string;
}

export interface VB6CustomEvent {
  name: string;
  parameters: VB6Parameter[];
  visibility: VB6Visibility;
}

export interface VB6Interface {
  name: string;
  visibility: VB6Visibility;
  methods: VB6Procedure[];
  properties: VB6Property[];
}

export interface VB6Class {
  name: string;
  visibility: VB6Visibility;
  implements?: string[]; // Interface names
  variables: VB6WithEventsVariable[];
  procedures: VB6Procedure[];
  properties: VB6Property[];
  events: VB6CustomEvent[];
}

export interface VB6ExtendedModuleAST extends VB6ModuleAST {
  udts: VB6UDT[];
  enums: VB6Enum[];
  constants: VB6Const[];
  declares: VB6DeclareFunction[];
  withEventsVariables: VB6WithEventsVariable[];
  interfaces: VB6Interface[];
  classes: VB6Class[];
}

/**
 * Extended VB6 parser that supports UDTs, Enums, Declares, WithEvents, etc.
 */
export function parseVB6ModuleExtended(code: string, name = 'Module1'): VB6ExtendedModuleAST {
  // Start with basic parsing
  const basicAST = parseVB6Module(code, name);
  
  // Initialize extended features
  const extendedAST: VB6ExtendedModuleAST = {
    ...basicAST,
    udts: [],
    enums: [],
    constants: [],
    declares: [],
    withEventsVariables: [],
    interfaces: [],
    classes: []
  };

  const lines = code.split(/\r?\n/);
  let currentUDT: VB6UDT | null = null;
  let currentEnum: VB6Enum | null = null;
  let currentInterface: VB6Interface | null = null;
  let currentClass: VB6Class | null = null;
  let inProcedure = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("'") || trimmed.startsWith('REM ')) {
      continue;
    }

    // Check if we're in a procedure (ignore UDT/Enum inside procedures)
    if (trimmed.match(/^(Public|Private)?\s*(Sub|Function|Property)\s+/i)) {
      inProcedure = true;
      continue;
    }
    if (trimmed.match(/^End\s+(Sub|Function|Property)/i)) {
      inProcedure = false;
      continue;
    }
    if (inProcedure) continue;

    // Parse UDT (User Defined Type)
    const udtStartMatch = trimmed.match(/^(Public|Private)?\s*Type\s+(\w+)/i);
    if (udtStartMatch && !currentUDT) {
      currentUDT = {
        name: udtStartMatch[2],
        visibility: (udtStartMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        fields: []
      };
      continue;
    }

    if (currentUDT && trimmed.match(/^End\s+Type/i)) {
      extendedAST.udts.push(currentUDT);
      currentUDT = null;
      continue;
    }

    if (currentUDT) {
      // Parse UDT field
      const fieldMatch = trimmed.match(/^(\w+)(?:\(([^)]+)\))?\s+As\s+(\w+)(?:\s*\*\s*(\d+))?/i);
      if (fieldMatch) {
        const field: VB6UDTField = {
          name: fieldMatch[1],
          type: fieldMatch[3],
          isArray: !!fieldMatch[2],
          arrayBounds: fieldMatch[2] || undefined,
          isFixedString: fieldMatch[3].toLowerCase() === 'string' && !!fieldMatch[4],
          fixedStringLength: fieldMatch[4] ? parseInt(fieldMatch[4]) : undefined
        };
        currentUDT.fields.push(field);
      }
      continue;
    }

    // Parse Enum
    const enumStartMatch = trimmed.match(/^(Public|Private)?\s*Enum\s+(\w+)/i);
    if (enumStartMatch && !currentEnum) {
      currentEnum = {
        name: enumStartMatch[2],
        visibility: (enumStartMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        values: []
      };
      continue;
    }

    if (currentEnum && trimmed.match(/^End\s+Enum/i)) {
      extendedAST.enums.push(currentEnum);
      currentEnum = null;
      continue;
    }

    if (currentEnum) {
      // Parse enum value
      const enumValueMatch = trimmed.match(/^(\w+)(?:\s*=\s*(.+))?/i);
      if (enumValueMatch) {
        const enumValue: VB6EnumValue = {
          name: enumValueMatch[1],
          value: enumValueMatch[2] ? parseEnumValue(enumValueMatch[2]) : undefined
        };
        currentEnum.values.push(enumValue);
      }
      continue;
    }

    // Parse Constants
    const constMatch = trimmed.match(/^(Public|Private)?\s*Const\s+(\w+)(?:\s+As\s+(\w+))?\s*=\s*(.+)/i);
    if (constMatch) {
      const constant: VB6Const = {
        name: constMatch[2],
        type: constMatch[3],
        value: parseConstantValue(constMatch[4]),
        visibility: (constMatch[1]?.toLowerCase() as VB6Visibility) || 'public'
      };
      extendedAST.constants.push(constant);
      continue;
    }

    // Parse Declare statements
    const declareMatch = trimmed.match(/^(Public|Private)?\s*Declare\s+(Function|Sub)\s+(\w+)\s+Lib\s+"([^"]+)"(?:\s+Alias\s+"([^"]+)")?(?:\s*\(([^)]*)\))?(?:\s+As\s+(\w+))?/i);
    if (declareMatch) {
      const declareFunc: VB6DeclareFunction = {
        name: declareMatch[3],
        visibility: (declareMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        aliasName: declareMatch[5],
        libraryName: declareMatch[4],
        parameters: parseParams(declareMatch[6] ? `(${declareMatch[6]})` : ''),
        returnType: declareMatch[7],
        isFunction: declareMatch[2].toLowerCase() === 'function'
      };
      extendedAST.declares.push(declareFunc);
      continue;
    }

    // Parse WithEvents variables
    const withEventsMatch = trimmed.match(/^(Public|Private)?\s*WithEvents\s+(\w+)\s+As\s+(\w+)/i);
    if (withEventsMatch) {
      const withEventsVar: VB6WithEventsVariable = {
        name: withEventsMatch[2],
        varType: withEventsMatch[3],
        withEvents: true,
        objectType: withEventsMatch[3]
      };
      extendedAST.withEventsVariables.push(withEventsVar);
      continue;
    }

    // Parse Interface definitions (simplified)
    const interfaceMatch = trimmed.match(/^(Public|Private)?\s*Interface\s+(\w+)/i);
    if (interfaceMatch && !currentInterface) {
      currentInterface = {
        name: interfaceMatch[2],
        visibility: (interfaceMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        methods: [],
        properties: []
      };
      continue;
    }

    if (currentInterface && trimmed.match(/^End\s+Interface/i)) {
      extendedAST.interfaces.push(currentInterface);
      currentInterface = null;
      continue;
    }

    // Parse Class definitions (simplified)
    const classMatch = trimmed.match(/^(Public|Private)?\s*Class\s+(\w+)/i);
    if (classMatch && !currentClass) {
      currentClass = {
        name: classMatch[2],
        visibility: (classMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        implements: [],
        variables: [],
        procedures: [],
        properties: [],
        events: []
      };
      continue;
    }

    if (currentClass && trimmed.match(/^End\s+Class/i)) {
      extendedAST.classes.push(currentClass);
      currentClass = null;
      continue;
    }

    // Parse Implements statement
    if (currentClass) {
      const implementsMatch = trimmed.match(/^Implements\s+(\w+)/i);
      if (implementsMatch) {
        currentClass.implements!.push(implementsMatch[1]);
        continue;
      }
    }

    // Parse Event declarations
    const eventMatch = trimmed.match(/^(Public|Private)?\s*Event\s+(\w+)\s*(\([^)]*\))?/i);
    if (eventMatch) {
      const customEvent: VB6CustomEvent = {
        name: eventMatch[2],
        parameters: parseParams(eventMatch[3]),
        visibility: (eventMatch[1]?.toLowerCase() as VB6Visibility) || 'public'
      };
      
      if (currentClass) {
        currentClass.events.push(customEvent);
      } else {
        // Module-level event (already handled by basic parser)
      }
      continue;
    }
  }

  return extendedAST;
}

function parseParams(paramStr?: string): VB6Parameter[] {
  if (!paramStr) return [];
  const cleaned = paramStr.replace(/[()]/g, '').trim();
  if (!cleaned) return [];
  
  return cleaned.split(',').map(p => {
    // Handle ByVal, ByRef, Optional, ParamArray
    const paramTrimmed = p.trim();
    const byValMatch = paramTrimmed.match(/^(?:(ByVal|ByRef|Optional|ParamArray)\s+)?(\w+)(?:\s+As\s+(\w+))?(?:\s*=\s*(.+))?/i);
    
    if (byValMatch) {
      return {
        name: byValMatch[2],
        type: byValMatch[3] || null,
        // Could extend to include modifier, default value, etc.
      };
    }
    
    return {
      name: paramTrimmed,
      type: null
    };
  });
}

function parseEnumValue(valueStr: string): number | string {
  const trimmed = valueStr.trim();
  
  // Try to parse as number
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue)) {
    return numValue;
  }
  
  // Handle hex numbers
  if (trimmed.match(/^&H[0-9A-F]+$/i)) {
    return parseInt(trimmed.substring(2), 16);
  }
  
  // Handle octal numbers
  if (trimmed.match(/^&O[0-7]+$/i)) {
    return parseInt(trimmed.substring(2), 8);
  }
  
  // Return as string (could be expression or constant reference)
  return trimmed;
}

function parseConstantValue(valueStr: string): string | number | boolean {
  const trimmed = valueStr.trim();
  
  // Boolean values
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  
  // Numeric values
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue)) {
    return numValue;
  }
  
  // Hex numbers
  if (trimmed.match(/^&H[0-9A-F]+$/i)) {
    return parseInt(trimmed.substring(2), 16);
  }
  
  // Octal numbers
  if (trimmed.match(/^&O[0-7]+$/i)) {
    return parseInt(trimmed.substring(2), 8);
  }
  
  // String values (remove quotes)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  
  // Return as-is for expressions
  return trimmed;
}

/**
 * Generate VB6 code from UDT definition
 */
export function generateUDTCode(udt: VB6UDT): string {
  let code = '';
  
  if (udt.visibility === 'public') {
    code += 'Public ';
  } else if (udt.visibility === 'private') {
    code += 'Private ';
  }
  
  code += `Type ${udt.name}\n`;
  
  for (const field of udt.fields) {
    code += '    ';
    code += field.name;
    
    if (field.isArray && field.arrayBounds) {
      code += `(${field.arrayBounds})`;
    }
    
    code += ` As ${field.type}`;
    
    if (field.isFixedString && field.fixedStringLength) {
      code += ` * ${field.fixedStringLength}`;
    }
    
    code += '\n';
  }
  
  code += 'End Type\n';
  
  return code;
}

/**
 * Generate VB6 code from Enum definition
 */
export function generateEnumCode(enumDef: VB6Enum): string {
  let code = '';
  
  if (enumDef.visibility === 'public') {
    code += 'Public ';
  } else if (enumDef.visibility === 'private') {
    code += 'Private ';
  }
  
  code += `Enum ${enumDef.name}\n`;
  
  for (const value of enumDef.values) {
    code += `    ${value.name}`;
    if (value.value !== undefined) {
      code += ` = ${value.value}`;
    }
    code += '\n';
  }
  
  code += 'End Enum\n';
  
  return code;
}

/**
 * Generate VB6 code from Declare statement
 */
export function generateDeclareCode(declare: VB6DeclareFunction): string {
  let code = '';
  
  if (declare.visibility === 'private') {
    code += 'Private ';
  } else {
    code += 'Public ';
  }
  
  code += 'Declare ';
  code += declare.isFunction ? 'Function ' : 'Sub ';
  code += declare.name;
  code += ` Lib "${declare.libraryName}"`;
  
  if (declare.aliasName) {
    code += ` Alias "${declare.aliasName}"`;
  }
  
  if (declare.parameters.length > 0) {
    code += ' (';
    code += declare.parameters.map(p => {
      let param = p.name;
      if (p.type) {
        param += ` As ${p.type}`;
      }
      return param;
    }).join(', ');
    code += ')';
  }
  
  if (declare.returnType) {
    code += ` As ${declare.returnType}`;
  }
  
  code += '\n';
  
  return code;
}

export default {
  parseVB6ModuleExtended,
  generateUDTCode,
  generateEnumCode,
  generateDeclareCode
};