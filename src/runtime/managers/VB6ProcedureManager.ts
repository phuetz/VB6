/**
 * DESIGN PATTERN FIX: Extracted procedure management from god object
 * Single Responsibility: Procedure registration, calling, and execution
 */

import { EventEmitter } from 'events';
import { VB6Procedure, VB6Parameter, VB6DataType } from '../types/VB6Types';

export interface CallStackFrame {
  procedure: string;
  module: string;
  parameters: Record<string, any>;
  locals: Record<string, any>;
  returnValue?: any;
  lineNumber: number;
  timestamp: number;
}

export class VB6ProcedureManager extends EventEmitter {
  private procedures: Map<string, VB6Procedure> = new Map();
  private callStack: CallStackFrame[] = [];
  private maxCallStackDepth = 100; // DESIGN PATTERN FIX: Configurable limits

  constructor() {
    super();
  }

  /**
   * DESIGN PATTERN FIX: Proper procedure registration with validation
   */
  registerProcedure(procedure: VB6Procedure): void {
    const key = `${procedure.module}.${procedure.name}`;

    // DESIGN PATTERN FIX: Validate procedure before registration
    this.validateProcedure(procedure);

    if (this.procedures.has(key)) {
      if (!this.canOverrideProcedure(procedure)) {
        throw new Error(`Procedure '${key}' already exists and cannot be overridden`);
      }
    }

    this.procedures.set(key, procedure);
    this.emit('procedureRegistered', procedure);
  }

  /**
   * DESIGN PATTERN FIX: Type-safe procedure calling with parameter validation
   */
  async callProcedure(
    procedureName: string,
    moduleName: string,
    parameters: any[] = [],
    context?: any
  ): Promise<any> {
    const key = `${moduleName}.${procedureName}`;
    const procedure = this.procedures.get(key);

    if (!procedure) {
      throw new Error(`Procedure '${key}' not found`);
    }

    // DESIGN PATTERN FIX: Stack overflow protection
    if (this.callStack.length >= this.maxCallStackDepth) {
      throw new Error(`Stack overflow: Maximum call depth (${this.maxCallStackDepth}) exceeded`);
    }

    // DESIGN PATTERN FIX: Parameter validation and type checking
    const validatedParams = this.validateAndConvertParameters(procedure.parameters, parameters);

    const frame: CallStackFrame = {
      procedure: procedureName,
      module: moduleName,
      parameters: validatedParams,
      locals: {},
      lineNumber: 0,
      timestamp: Date.now(),
    };

    this.callStack.push(frame);
    this.emit('procedureEnter', frame);

    try {
      // Execute the procedure
      const result = await this.executeProcedure(procedure, validatedParams, context);

      frame.returnValue = result;
      this.emit('procedureExit', frame);

      return result;
    } catch (error) {
      this.emit('procedureError', { frame, error });
      throw error;
    } finally {
      this.callStack.pop();
    }
  }

  /**
   * DESIGN PATTERN FIX: Get current call stack for debugging
   */
  getCallStack(): CallStackFrame[] {
    return [...this.callStack]; // Return copy to prevent modification
  }

  /**
   * DESIGN PATTERN FIX: Current execution context
   */
  getCurrentFrame(): CallStackFrame | undefined {
    return this.callStack[this.callStack.length - 1];
  }

  /**
   * DESIGN PATTERN FIX: Procedure existence check
   */
  hasProcedure(procedureName: string, moduleName: string): boolean {
    return this.procedures.has(`${moduleName}.${procedureName}`);
  }

  /**
   * DESIGN PATTERN FIX: Get procedure metadata
   */
  getProcedure(procedureName: string, moduleName: string): VB6Procedure | undefined {
    return this.procedures.get(`${moduleName}.${procedureName}`);
  }

  /**
   * DESIGN PATTERN FIX: Private validation method
   */
  private validateProcedure(procedure: VB6Procedure): void {
    if (!procedure.name || procedure.name.trim() === '') {
      throw new Error('Procedure name cannot be empty');
    }

    if (!procedure.module || procedure.module.trim() === '') {
      throw new Error('Procedure module cannot be empty');
    }

    if (!['sub', 'function', 'property'].includes(procedure.type)) {
      throw new Error(`Invalid procedure type: ${procedure.type}`);
    }

    if (procedure.type === 'function' && !procedure.returnType) {
      throw new Error('Functions must specify a return type');
    }

    // Validate parameters
    procedure.parameters.forEach(param => {
      if (!param.name || param.name.trim() === '') {
        throw new Error('Parameter name cannot be empty');
      }
    });
  }

  /**
   * DESIGN PATTERN FIX: Override permission checking
   */
  private canOverrideProcedure(procedure: VB6Procedure): boolean {
    // In VB6, you can override procedures in certain circumstances
    // This would implement the VB6 override rules
    return procedure.isMustOverride || false;
  }

  /**
   * DESIGN PATTERN FIX: Parameter validation with VB6 type conversion
   */
  private validateAndConvertParameters(
    expectedParams: VB6Parameter[],
    actualParams: any[]
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (let i = 0; i < expectedParams.length; i++) {
      const expected = expectedParams[i];
      const actual = actualParams[i];

      if (actual === undefined) {
        if (!expected.isOptional) {
          throw new Error(`Missing required parameter: ${expected.name}`);
        }
        result[expected.name] = expected.defaultValue;
      } else {
        // DESIGN PATTERN FIX: Type conversion based on VB6 rules
        result[expected.name] = this.convertParameterValue(actual, expected.type);
      }
    }

    // Handle ParamArray (rest parameters)
    if (actualParams.length > expectedParams.length) {
      const lastParam = expectedParams[expectedParams.length - 1];
      if (lastParam?.isParamArray) {
        const extraParams = actualParams.slice(expectedParams.length);
        result[lastParam.name] = extraParams;
      } else {
        throw new Error('Too many parameters provided');
      }
    }

    return result;
  }

  /**
   * DESIGN PATTERN FIX: VB6-compatible parameter type conversion
   */
  private convertParameterValue(value: any, targetType: VB6DataType): any {
    // Implement VB6 type conversion rules for parameters
    switch (targetType) {
      case VB6DataType.vbInteger:
        return Math.max(-32768, Math.min(32767, Math.floor(Number(value))));
      case VB6DataType.vbLong:
        return Math.max(-2147483648, Math.min(2147483647, Math.floor(Number(value))));
      case VB6DataType.vbString:
        return value === null || value === undefined ? '' : String(value);
      case VB6DataType.vbBoolean:
        return Boolean(value);
      case VB6DataType.vbVariant:
        return value; // Variant accepts any type
      default:
        return value;
    }
  }

  /**
   * DESIGN PATTERN FIX: Procedure execution with proper context
   */
  private async executeProcedure(
    procedure: VB6Procedure,
    parameters: Record<string, any>,
    context?: any
  ): Promise<any> {
    // This would implement the actual VB6 code execution
    // For now, this is a placeholder that would integrate with
    // the VB6 interpreter/compiler

    this.emit('procedureExecuting', { procedure, parameters });

    // Simulate procedure execution
    // In a real implementation, this would parse and execute the procedure.body
    return procedure.type === 'function' ? null : undefined;
  }

  /**
   * DESIGN PATTERN FIX: Configure stack limits
   */
  setMaxCallStackDepth(depth: number): void {
    if (depth < 1) {
      throw new Error('Max call stack depth must be at least 1');
    }
    this.maxCallStackDepth = depth;
  }
}
