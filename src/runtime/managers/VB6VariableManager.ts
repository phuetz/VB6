/**
 * DESIGN PATTERN FIX: Extracted variable management from god object
 * Single Responsibility: Variable scope and lifecycle management
 */

import { EventEmitter } from 'events';
import { VB6Variable, VB6DataType } from '../types/VB6Types';

export class VB6VariableManager extends EventEmitter {
  private globalVariables: Map<string, VB6Variable> = new Map();
  private moduleVariables: Map<string, Map<string, VB6Variable>> = new Map();
  private procedureVariables: Map<string, Map<string, VB6Variable>> = new Map();
  private staticVariables: Map<string, VB6Variable> = new Map();

  constructor() {
    super();
  }

  /**
   * DESIGN PATTERN FIX: Clear variable scoping rules
   */
  declareVariable(
    name: string, 
    type: VB6DataType, 
    scope: 'global' | 'module' | 'procedure',
    moduleContext?: string,
    procedureContext?: string,
    isStatic: boolean = false
  ): VB6Variable {
    
    const variable: VB6Variable = {
      name,
      type,
      value: this.getDefaultValue(type),
      isArray: false,
      isPublic: scope === 'global',
      isPrivate: scope !== 'global',
      isStatic,
      isDim: true,
      isConst: false,
      scope
    };

    switch (scope) {
      case 'global':
        this.globalVariables.set(name, variable);
        break;
      case 'module':
        if (!moduleContext) throw new Error('Module context required for module variable');
        if (!this.moduleVariables.has(moduleContext)) {
          this.moduleVariables.set(moduleContext, new Map());
        }
        this.moduleVariables.get(moduleContext)!.set(name, variable);
        break;
      case 'procedure':
        if (!procedureContext) throw new Error('Procedure context required for procedure variable');
        if (isStatic) {
          this.staticVariables.set(`${procedureContext}.${name}`, variable);
        } else {
          if (!this.procedureVariables.has(procedureContext)) {
            this.procedureVariables.set(procedureContext, new Map());
          }
          this.procedureVariables.get(procedureContext)!.set(name, variable);
        }
        break;
    }

    this.emit('variableDeclared', variable);
    return variable;
  }

  /**
   * DESIGN PATTERN FIX: Variable resolution with proper scope chain
   */
  getVariable(
    name: string,
    moduleContext?: string,
    procedureContext?: string
  ): VB6Variable | undefined {
    
    // First check procedure scope (if in procedure)
    if (procedureContext) {
      const staticKey = `${procedureContext}.${name}`;
      if (this.staticVariables.has(staticKey)) {
        return this.staticVariables.get(staticKey);
      }
      
      const procedureVars = this.procedureVariables.get(procedureContext);
      if (procedureVars?.has(name)) {
        return procedureVars.get(name);
      }
    }

    // Then check module scope (if in module)
    if (moduleContext) {
      const moduleVars = this.moduleVariables.get(moduleContext);
      if (moduleVars?.has(name)) {
        return moduleVars.get(name);
      }
    }

    // Finally check global scope
    return this.globalVariables.get(name);
  }

  /**
   * DESIGN PATTERN FIX: Type-safe variable assignment
   */
  setVariable(
    name: string,
    value: any,
    moduleContext?: string,
    procedureContext?: string
  ): boolean {
    
    const variable = this.getVariable(name, moduleContext, procedureContext);
    if (!variable) {
      this.emit('error', new Error(`Variable '${name}' not found`));
      return false;
    }

    if (variable.isConst) {
      this.emit('error', new Error(`Cannot assign to constant '${name}'`));
      return false;
    }

    // DESIGN PATTERN FIX: Type checking before assignment
    if (!this.isTypeCompatible(value, variable.type)) {
      this.emit('error', new Error(`Type mismatch: Cannot assign ${typeof value} to ${VB6DataType[variable.type]}`));
      return false;
    }

    variable.value = this.convertValue(value, variable.type);
    this.emit('variableChanged', variable);
    return true;
  }

  /**
   * DESIGN PATTERN FIX: Cleanup procedure variables when procedure exits
   */
  cleanupProcedureScope(procedureContext: string): void {
    this.procedureVariables.delete(procedureContext);
    this.emit('scopeCleaned', { type: 'procedure', context: procedureContext });
  }

  /**
   * DESIGN PATTERN FIX: Type-safe default value initialization
   */
  private getDefaultValue(type: VB6DataType): any {
    switch (type) {
      case VB6DataType.vbInteger:
      case VB6DataType.vbLong:
      case VB6DataType.vbByte:
        return 0;
      case VB6DataType.vbSingle:
      case VB6DataType.vbDouble:
      case VB6DataType.vbCurrency:
      case VB6DataType.vbDecimal:
        return 0.0;
      case VB6DataType.vbString:
        return '';
      case VB6DataType.vbBoolean:
        return false;
      case VB6DataType.vbDate:
        return new Date(0); // VB6 date zero
      case VB6DataType.vbVariant:
      case VB6DataType.vbEmpty:
        return null;
      case VB6DataType.vbObject:
        return null;
      default:
        return null;
    }
  }

  /**
   * DESIGN PATTERN FIX: Runtime type checking
   */
  private isTypeCompatible(value: any, targetType: VB6DataType): boolean {
    // Implement VB6 type compatibility rules
    if (targetType === VB6DataType.vbVariant) return true;
    
    switch (targetType) {
      case VB6DataType.vbInteger:
      case VB6DataType.vbLong:
      case VB6DataType.vbByte:
        return typeof value === 'number' && Number.isInteger(value);
      case VB6DataType.vbSingle:
      case VB6DataType.vbDouble:
        return typeof value === 'number';
      case VB6DataType.vbString:
        return typeof value === 'string';
      case VB6DataType.vbBoolean:
        return typeof value === 'boolean';
      case VB6DataType.vbDate:
        return value instanceof Date;
      default:
        return true; // Allow for now
    }
  }

  /**
   * DESIGN PATTERN FIX: VB6-compatible type conversion
   */
  private convertValue(value: any, targetType: VB6DataType): any {
    // Implement VB6 type conversion rules
    switch (targetType) {
      case VB6DataType.vbInteger:
        return Math.max(-32768, Math.min(32767, Math.floor(Number(value))));
      case VB6DataType.vbLong:
        return Math.max(-2147483648, Math.min(2147483647, Math.floor(Number(value))));
      case VB6DataType.vbString:
        return String(value);
      case VB6DataType.vbBoolean:
        return Boolean(value);
      default:
        return value;
    }
  }
}