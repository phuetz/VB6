/**
 * DESIGN PATTERN FIX: Extracted error handling from god object
 * Single Responsibility: Error management, exception handling, and logging
 */

import { EventEmitter } from 'events';

export enum VB6ErrorCode {
  SYNTAX_ERROR = 2,
  TYPE_MISMATCH = 13,
  DIVISION_BY_ZERO = 11,
  OVERFLOW = 6,
  OUT_OF_MEMORY = 7,
  SUBSCRIPT_OUT_OF_RANGE = 9,
  INVALID_PROCEDURE_CALL = 5,
  FILE_NOT_FOUND = 53,
  PERMISSION_DENIED = 70,
  DISK_FULL = 61,
  DEVICE_UNAVAILABLE = 68,
  OBJECT_VARIABLE_NOT_SET = 91,
  INVALID_OBJECT_USE = 425,
  COMPONENT_NOT_AVAILABLE = 429,
  AUTOMATION_ERROR = 440,
  CONNECTION_BROKEN = 460,
}

export interface VB6Error {
  code: VB6ErrorCode;
  description: string;
  source: string;
  module: string;
  procedure: string;
  line: number;
  helpFile?: string;
  helpContext?: number;
  timestamp: Date;
  stack: string[];
}

export interface ErrorContext {
  module: string;
  procedure: string;
  line: number;
  localVariables?: Record<string, any>;
  parameters?: Record<string, any>;
}

export class VB6ErrorHandler extends EventEmitter {
  private errorStack: VB6Error[] = [];
  private maxErrorHistory = 100;
  private onErrorMode: 'goto-zero' | 'goto-next' | 'resume-next' = 'goto-zero';
  private errorHandlers: Map<string, (error: VB6Error) => boolean> = new Map();
  private currentContext?: ErrorContext;

  constructor() {
    super();
  }

  /**
   * DESIGN PATTERN FIX: Centralized error raising with proper context
   */
  raiseError(
    code: VB6ErrorCode,
    description?: string,
    source?: string,
    context?: ErrorContext
  ): void {
    const error: VB6Error = {
      code,
      description: description || this.getDefaultErrorDescription(code),
      source: source || 'VB6Runtime',
      module: context?.module || this.currentContext?.module || 'Unknown',
      procedure: context?.procedure || this.currentContext?.procedure || 'Unknown',
      line: context?.line || this.currentContext?.line || 0,
      timestamp: new Date(),
      stack: this.captureStack(),
    };

    // Add to error history
    this.errorStack.push(error);
    if (this.errorStack.length > this.maxErrorHistory) {
      this.errorStack.shift();
    }

    this.emit('error', error);

    // Handle error based on current error handling mode
    this.handleError(error);
  }

  /**
   * DESIGN PATTERN FIX: Context-aware error handling
   */
  setErrorContext(context: ErrorContext): void {
    this.currentContext = context;
  }

  /**
   * DESIGN PATTERN FIX: Clear error context when leaving scope
   */
  clearErrorContext(): void {
    this.currentContext = undefined;
  }

  /**
   * DESIGN PATTERN FIX: VB6-compatible error handling modes
   */
  setOnErrorMode(mode: 'goto-zero' | 'goto-next' | 'resume-next'): void {
    this.onErrorMode = mode;
  }

  /**
   * DESIGN PATTERN FIX: Register custom error handlers
   */
  registerErrorHandler(name: string, handler: (error: VB6Error) => boolean): void {
    this.errorHandlers.set(name, handler);
  }

  /**
   * DESIGN PATTERN FIX: Get last error for Err object compatibility
   */
  getLastError(): VB6Error | null {
    return this.errorStack.length > 0 ? this.errorStack[this.errorStack.length - 1] : null;
  }

  /**
   * DESIGN PATTERN FIX: Clear error state (like Err.Clear)
   */
  clearError(): void {
    // In VB6, this would clear the current error but keep history
    this.emit('errorCleared');
  }

  /**
   * DESIGN PATTERN FIX: Get error history for debugging
   */
  getErrorHistory(): VB6Error[] {
    return [...this.errorStack]; // Return copy to prevent modification
  }

  /**
   * DESIGN PATTERN FIX: Check if specific error occurred
   */
  hasErrorOccurred(code: VB6ErrorCode): boolean {
    return this.errorStack.some(error => error.code === code);
  }

  /**
   * DESIGN PATTERN FIX: Error validation for common scenarios
   */
  validateNotNull(value: any, variableName: string): void {
    if (value === null || value === undefined) {
      this.raiseError(
        VB6ErrorCode.OBJECT_VARIABLE_NOT_SET,
        `Object variable '${variableName}' is not set`
      );
    }
  }

  validateArrayBounds(index: number, arraySize: number, arrayName: string): void {
    if (index < 0 || index >= arraySize) {
      this.raiseError(
        VB6ErrorCode.SUBSCRIPT_OUT_OF_RANGE,
        `Array index ${index} is out of bounds for array '${arrayName}' (size: ${arraySize})`
      );
    }
  }

  validateDivisionByZero(divisor: number): void {
    if (divisor === 0) {
      this.raiseError(VB6ErrorCode.DIVISION_BY_ZERO, 'Division by zero');
    }
  }

  validateIntegerOverflow(value: number, typeName: string): void {
    let min: number, max: number;

    switch (typeName.toLowerCase()) {
      case 'integer':
        min = -32768;
        max = 32767;
        break;
      case 'long':
        min = -2147483648;
        max = 2147483647;
        break;
      case 'byte':
        min = 0;
        max = 255;
        break;
      default:
        return; // No validation for other types
    }

    if (value < min || value > max) {
      this.raiseError(
        VB6ErrorCode.OVERFLOW,
        `Value ${value} is out of range for ${typeName} (${min} to ${max})`
      );
    }
  }

  /**
   * DESIGN PATTERN FIX: Private error handling logic
   */
  private handleError(error: VB6Error): void {
    // Try custom error handlers first
    for (const [name, handler] of this.errorHandlers) {
      try {
        if (handler(error)) {
          return; // Handler dealt with the error
        }
      } catch (handlerError) {
        console.error(`Error in custom error handler '${name}':`, handlerError);
      }
    }

    // Default handling based on mode
    switch (this.onErrorMode) {
      case 'goto-zero':
        // Stop execution and show error
        throw new Error(`VB6 Runtime Error ${error.code}: ${error.description}`);
      case 'goto-next':
      case 'resume-next':
        // Continue execution (skip the error-causing line)
        console.warn(`VB6 Runtime Error ${error.code}: ${error.description} (continuing...)`);
        break;
    }
  }

  /**
   * DESIGN PATTERN FIX: Stack trace capture for debugging
   */
  private captureStack(): string[] {
    const stack = new Error().stack?.split('\n') || [];
    return stack.slice(3).map(line => line.trim()); // Skip first 3 lines (Error, this function, raiseError)
  }

  /**
   * DESIGN PATTERN FIX: Default error descriptions matching VB6
   */
  private getDefaultErrorDescription(code: VB6ErrorCode): string {
    switch (code) {
      case VB6ErrorCode.SYNTAX_ERROR:
        return 'Syntax error';
      case VB6ErrorCode.TYPE_MISMATCH:
        return 'Type mismatch';
      case VB6ErrorCode.DIVISION_BY_ZERO:
        return 'Division by zero';
      case VB6ErrorCode.OVERFLOW:
        return 'Overflow';
      case VB6ErrorCode.OUT_OF_MEMORY:
        return 'Out of memory';
      case VB6ErrorCode.SUBSCRIPT_OUT_OF_RANGE:
        return 'Subscript out of range';
      case VB6ErrorCode.INVALID_PROCEDURE_CALL:
        return 'Invalid procedure call or argument';
      case VB6ErrorCode.FILE_NOT_FOUND:
        return 'File not found';
      case VB6ErrorCode.PERMISSION_DENIED:
        return 'Permission denied';
      case VB6ErrorCode.DISK_FULL:
        return 'Disk full';
      case VB6ErrorCode.DEVICE_UNAVAILABLE:
        return 'Device unavailable';
      case VB6ErrorCode.OBJECT_VARIABLE_NOT_SET:
        return 'Object variable or With block variable not set';
      case VB6ErrorCode.INVALID_OBJECT_USE:
        return 'Invalid object use';
      case VB6ErrorCode.COMPONENT_NOT_AVAILABLE:
        return "ActiveX component can't create object";
      case VB6ErrorCode.AUTOMATION_ERROR:
        return 'Automation error';
      case VB6ErrorCode.CONNECTION_BROKEN:
        return 'Connection to type library or object library for remote process has been lost';
      default:
        return `Unknown error (code: ${code})`;
    }
  }

  /**
   * DESIGN PATTERN FIX: Configure error history limit
   */
  setMaxErrorHistory(max: number): void {
    if (max < 1) {
      throw new Error('Max error history must be at least 1');
    }
    this.maxErrorHistory = max;

    // Trim existing history if needed
    while (this.errorStack.length > max) {
      this.errorStack.shift();
    }
  }
}
