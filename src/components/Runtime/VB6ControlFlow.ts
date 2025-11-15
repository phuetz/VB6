/**
 * VB6 Control Flow Runtime Support
 * Provides runtime support for Select Case, ReDim, Exit, and GoTo statements
 */

import {
  VB6SelectCase,
  VB6CaseClause,
  VB6ReDimStatement,
  VB6ExitStatement,
  VB6GoToLabel,
  VB6GoToStatement,
} from '../../utils/vb6Parser';

/**
 * Exception types for control flow
 */
export class VB6ExitException extends Error {
  constructor(public exitType: 'for' | 'do' | 'sub' | 'function' | 'property') {
    super(`Exit ${exitType}`);
    this.name = 'VB6ExitException';
  }
}

export class VB6GoToException extends Error {
  constructor(public target: string) {
    super(`GoTo ${target}`);
    this.name = 'VB6GoToException';
  }
}

/**
 * Select Case Evaluator
 */
export class VB6SelectCaseEvaluator {
  /**
   * Evaluate a Select Case statement and return the matching case body
   */
  static evaluate(selectCase: VB6SelectCase, value: any, context: any = {}): string | null {
    for (const caseClause of selectCase.cases) {
      if (caseClause.isElse) {
        return caseClause.body;
      }

      if (this.matchesCase(value, caseClause.conditions, context)) {
        return caseClause.body;
      }
    }
    return null;
  }

  /**
   * Check if a value matches any of the case conditions
   */
  static matchesCase(value: any, conditions: string[], context: any = {}): boolean {
    return conditions.some(condition => this.matchesCondition(value, condition, context));
  }

  /**
   * Check if a value matches a single case condition
   * Supports:
   * - Simple value: Case 1
   * - Multiple values: Case 1, 2, 3
   * - Range: Case 1 To 10
   * - Comparison: Case Is > 10, Case Is <= 5
   */
  static matchesCondition(value: any, condition: string, context: any = {}): boolean {
    condition = condition.trim();

    // Case Is comparison (e.g., "Is > 10", "Is <= 5")
    const isMatch = condition.match(/^Is\s*([><=]+)\s*(.+)/i);
    if (isMatch) {
      const operator = isMatch[1];
      const compareValue = this.evaluateExpression(isMatch[2], context);

      switch (operator) {
        case '>':
          return value > compareValue;
        case '<':
          return value < compareValue;
        case '>=':
          return value >= compareValue;
        case '<=':
          return value <= compareValue;
        case '=':
        case '==':
          return value === compareValue;
        case '<>':
        case '!=':
          return value !== compareValue;
        default:
          return false;
      }
    }

    // Case range (e.g., "1 To 10")
    const toMatch = condition.match(/^(.+)\s+To\s+(.+)/i);
    if (toMatch) {
      const startValue = this.evaluateExpression(toMatch[1], context);
      const endValue = this.evaluateExpression(toMatch[2], context);
      return value >= startValue && value <= endValue;
    }

    // Simple value comparison
    const conditionValue = this.evaluateExpression(condition, context);
    return value === conditionValue;
  }

  /**
   * Evaluate a simple expression (number, string, or variable)
   */
  static evaluateExpression(expr: string, context: any = {}): any {
    expr = expr.trim();

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // Number
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // Boolean
    if (expr.toLowerCase() === 'true') return true;
    if (expr.toLowerCase() === 'false') return false;

    // Variable from context
    if (context[expr] !== undefined) {
      return context[expr];
    }

    // Return as-is if can't evaluate
    return expr;
  }
}

/**
 * ReDim Array Manager
 */
export class VB6ReDimManager {
  /**
   * Redimension an array with or without preserving data
   */
  static redim(
    arrayName: string,
    dimensions: string[],
    preserve: boolean,
    context: any = {}
  ): any[] {
    const currentArray = context[arrayName];

    // Parse dimensions (e.g., "0 To 10" or "10")
    const parsedDims = dimensions.map(dim => this.parseDimension(dim, context));

    // Calculate total size
    const totalSize = parsedDims.reduce((acc, dim) => acc * (dim.upper - dim.lower + 1), 1);

    if (!preserve || !currentArray) {
      // Create new array without preserving data
      return this.createArray(parsedDims);
    }

    // Create new array and preserve data
    const newArray = this.createArray(parsedDims);
    this.preserveData(currentArray, newArray, parsedDims);
    return newArray;
  }

  /**
   * Parse a dimension string (e.g., "0 To 10" or "10")
   */
  static parseDimension(dim: string, context: any = {}): { lower: number; upper: number } {
    const toMatch = dim.match(/^(.+)\s+To\s+(.+)/i);
    if (toMatch) {
      return {
        lower: this.evaluateNumber(toMatch[1], context),
        upper: this.evaluateNumber(toMatch[2], context),
      };
    }

    const upper = this.evaluateNumber(dim, context);
    return { lower: 0, upper };
  }

  /**
   * Evaluate a number expression
   */
  static evaluateNumber(expr: string, context: any = {}): number {
    expr = expr.trim();
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }
    if (context[expr] !== undefined) {
      return Number(context[expr]);
    }
    return 0;
  }

  /**
   * Create a multi-dimensional array
   */
  static createArray(dimensions: { lower: number; upper: number }[]): any[] {
    if (dimensions.length === 0) return [];

    const dim = dimensions[0];
    const size = dim.upper - dim.lower + 1;
    const arr = new Array(size);

    if (dimensions.length === 1) {
      // Fill single-dimensional array
      for (let i = 0; i < size; i++) {
        arr[i] = undefined;
      }
    } else {
      // Recursively create multi-dimensional array
      const restDims = dimensions.slice(1);
      for (let i = 0; i < size; i++) {
        arr[i] = this.createArray(restDims);
      }
    }

    return arr;
  }

  /**
   * Preserve data from old array to new array
   */
  static preserveData(
    oldArray: any[],
    newArray: any[],
    dimensions: { lower: number; upper: number }[]
  ): void {
    if (dimensions.length === 1) {
      const copyLength = Math.min(oldArray.length, newArray.length);
      for (let i = 0; i < copyLength; i++) {
        newArray[i] = oldArray[i];
      }
    } else {
      const copyLength = Math.min(oldArray.length, newArray.length);
      const restDims = dimensions.slice(1);
      for (let i = 0; i < copyLength; i++) {
        if (Array.isArray(oldArray[i]) && Array.isArray(newArray[i])) {
          this.preserveData(oldArray[i], newArray[i], restDims);
        }
      }
    }
  }
}

/**
 * Exit Statement Handler
 */
export class VB6ExitHandler {
  /**
   * Throw an exit exception to break out of a loop or procedure
   */
  static exit(exitType: 'for' | 'do' | 'sub' | 'function' | 'property'): never {
    throw new VB6ExitException(exitType);
  }

  /**
   * Check if an error is an exit exception
   */
  static isExitException(error: any): error is VB6ExitException {
    return error instanceof VB6ExitException;
  }

  /**
   * Handle exit in a loop context
   */
  static handleLoopExit(error: any, loopType: 'for' | 'do'): boolean {
    if (this.isExitException(error) && error.exitType === loopType) {
      return true; // Exit the loop
    }
    throw error; // Re-throw if not matching exit type
  }

  /**
   * Handle exit in a procedure context
   */
  static handleProcedureExit(error: any, procType: 'sub' | 'function' | 'property'): boolean {
    if (this.isExitException(error) && error.exitType === procType) {
      return true; // Exit the procedure
    }
    throw error; // Re-throw if not matching exit type
  }
}

/**
 * GoTo Label Manager
 */
export class VB6GoToManager {
  private labels: Map<string, number> = new Map();
  private currentLine: number = 0;

  /**
   * Register a label with its line number
   */
  registerLabel(label: string, line: number): void {
    this.labels.set(label, line);
  }

  /**
   * Register multiple labels
   */
  registerLabels(labels: VB6GoToLabel[]): void {
    for (const label of labels) {
      this.registerLabel(label.label, label.line);
    }
  }

  /**
   * Jump to a label
   */
  goto(target: string): never {
    if (!this.labels.has(target)) {
      throw new Error(`Label not found: ${target}`);
    }
    throw new VB6GoToException(target);
  }

  /**
   * Get the line number for a label
   */
  getLabelLine(label: string): number | undefined {
    return this.labels.get(label);
  }

  /**
   * Check if an error is a goto exception
   */
  static isGoToException(error: any): error is VB6GoToException {
    return error instanceof VB6GoToException;
  }

  /**
   * Set current execution line
   */
  setCurrentLine(line: number): void {
    this.currentLine = line;
  }

  /**
   * Get current execution line
   */
  getCurrentLine(): number {
    return this.currentLine;
  }

  /**
   * Clear all labels
   */
  clear(): void {
    this.labels.clear();
    this.currentLine = 0;
  }
}

/**
 * VB6 Control Flow Runtime
 * Main class for managing all control flow operations
 */
export class VB6ControlFlowRuntime {
  private gotoManager: VB6GoToManager;

  constructor() {
    this.gotoManager = new VB6GoToManager();
  }

  /**
   * Execute a Select Case statement
   */
  executeSelectCase(selectCase: VB6SelectCase, value: any, context: any = {}): string | null {
    return VB6SelectCaseEvaluator.evaluate(selectCase, value, context);
  }

  /**
   * Execute a ReDim statement
   */
  executeReDim(statement: VB6ReDimStatement, context: any = {}): any[] {
    return VB6ReDimManager.redim(
      statement.variableName,
      statement.dimensions,
      statement.preserve,
      context
    );
  }

  /**
   * Execute an Exit statement
   */
  executeExit(statement: VB6ExitStatement): never {
    VB6ExitHandler.exit(statement.exitType);
  }

  /**
   * Execute a GoTo statement
   */
  executeGoTo(statement: VB6GoToStatement): never {
    this.gotoManager.goto(statement.target);
  }

  /**
   * Register labels for GoTo
   */
  registerLabels(labels: VB6GoToLabel[]): void {
    this.gotoManager.registerLabels(labels);
  }

  /**
   * Get GoTo manager
   */
  getGoToManager(): VB6GoToManager {
    return this.gotoManager;
  }
}

/**
 * Global control flow runtime instance
 */
export const globalControlFlowRuntime = new VB6ControlFlowRuntime();

/**
 * Helper functions for VB6 compatibility
 */

/**
 * Evaluate a Select Case expression
 */
export function selectCase(expression: any, cases: VB6CaseClause[], context: any = {}): any {
  for (const caseClause of cases) {
    if (caseClause.isElse) {
      return caseClause.body;
    }

    if (VB6SelectCaseEvaluator.matchesCase(expression, caseClause.conditions, context)) {
      return caseClause.body;
    }
  }
  return null;
}

/**
 * ReDim an array
 */
export function reDim(
  arrayName: string,
  dimensions: string[],
  preserve: boolean = false,
  context: any = {}
): any[] {
  return VB6ReDimManager.redim(arrayName, dimensions, preserve, context);
}

/**
 * Exit a loop or procedure
 */
export function exitFor(): never {
  VB6ExitHandler.exit('for');
}

export function exitDo(): never {
  VB6ExitHandler.exit('do');
}

export function exitSub(): never {
  VB6ExitHandler.exit('sub');
}

export function exitFunction(): never {
  VB6ExitHandler.exit('function');
}

export function exitProperty(): never {
  VB6ExitHandler.exit('property');
}

export default {
  VB6SelectCaseEvaluator,
  VB6ReDimManager,
  VB6ExitHandler,
  VB6GoToManager,
  VB6ControlFlowRuntime,
  VB6ExitException,
  VB6GoToException,
  globalControlFlowRuntime,
  selectCase,
  reDim,
  exitFor,
  exitDo,
  exitSub,
  exitFunction,
  exitProperty,
};
