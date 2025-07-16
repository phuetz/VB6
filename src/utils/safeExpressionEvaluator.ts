/**
 * Safe expression evaluator for VB6 immediate window
 * Replaces dangerous eval() usage with a sandboxed environment
 */

interface VB6BuiltIns {
  [key: string]: any;
}

// VB6 built-in functions and objects
const VB6_BUILTINS: VB6BuiltIns = {
  // Debug object
  Debug: {
    Print: (...args: any[]) => {
      return args.map(arg => String(arg)).join(' ');
    },
  },

  // Math functions
  Abs: Math.abs,
  Sin: Math.sin,
  Cos: Math.cos,
  Tan: Math.tan,
  Sqr: Math.sqrt,
  Log: Math.log,
  Exp: Math.exp,
  Int: Math.floor,
  Rnd: Math.random,

  // String functions
  Len: (str: any) => String(str).length,
  Left: (str: any, length: number) => String(str).substring(0, length),
  Right: (str: any, length: number) => {
    const s = String(str);
    return s.substring(s.length - length);
  },
  Mid: (str: any, start: number, length?: number) => {
    const s = String(str);
    return length ? s.substring(start - 1, start - 1 + length) : s.substring(start - 1);
  },
  UCase: (str: any) => String(str).toUpperCase(),
  LCase: (str: any) => String(str).toLowerCase(),
  Trim: (str: any) => String(str).trim(),

  // Type conversion
  CStr: String,
  CInt: (val: any) => parseInt(String(val), 10),
  CLng: (val: any) => parseInt(String(val), 10),
  CDbl: (val: any) => parseFloat(String(val)),
  CBool: Boolean,

  // Date functions
  Now: () => new Date(),
  Date: () => new Date().toDateString(),
  Time: () => new Date().toTimeString(),

  // Array functions
  UBound: (arr: any[]) => arr.length - 1,
  LBound: () => 0,

  // Constants
  vbCrLf: '\r\n',
  vbCr: '\r',
  vbLf: '\n',
  vbTab: '\t',
  vbTrue: true,
  vbFalse: false,
  vbNull: null,
  vbEmpty: '',
};

class SafeExpressionEvaluator {
  private allowedOperators = [
    '+',
    '-',
    '*',
    '/',
    '&',
    'And',
    'Or',
    'Not',
    '=',
    '<>',
    '<',
    '>',
    '<=',
    '>=',
    'Mod',
  ];
  private allowedKeywords = ['True', 'False', 'Null', 'Empty'];

  /**
   * Evaluates a VB6 expression safely without using eval()
   */
  evaluate(expression: string, context: Record<string, any> = {}): any {
    try {
      // Sanitize the expression
      const sanitized = this.sanitizeExpression(expression.trim());

      // Handle simple cases first
      if (this.isSimpleValue(sanitized)) {
        return this.parseSimpleValue(sanitized);
      }

      // Handle Debug.Print specially
      if (sanitized.startsWith('Debug.Print')) {
        return this.handleDebugPrint(sanitized);
      }

      // Handle function calls
      if (this.isFunctionCall(sanitized)) {
        return this.evaluateFunctionCall(sanitized, context);
      }

      // Handle simple arithmetic expressions
      if (this.isArithmeticExpression(sanitized)) {
        return this.evaluateArithmetic(sanitized, context);
      }

      // Handle variable access
      if (this.isVariableAccess(sanitized)) {
        return this.getVariable(sanitized, context);
      }

      throw new Error(`Unsupported expression: ${expression}`);
    } catch (error) {
      throw new Error(`Expression evaluation error: ${(error as Error).message}`);
    }
  }

  private sanitizeExpression(expr: string): string {
    // Remove potentially dangerous characters and keywords
    const dangerous = ['eval', 'Function', 'setTimeout', 'setInterval', 'XMLHttpRequest', 'fetch'];

    for (const danger of dangerous) {
      if (expr.includes(danger)) {
        throw new Error(`Dangerous function not allowed: ${danger}`);
      }
    }

    return expr;
  }

  private isSimpleValue(expr: string): boolean {
    // Check if it's a number, string, or boolean literal
    return /^(-?\d+(\.\d+)?|"[^"]*"|'[^']*'|True|False|Null|Empty)$/i.test(expr);
  }

  private parseSimpleValue(expr: string): any {
    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return expr.includes('.') ? parseFloat(expr) : parseInt(expr, 10);
    }

    // Strings
    if (/^"[^"]*"$/.test(expr) || /^'[^']*'$/.test(expr)) {
      return expr.slice(1, -1);
    }

    // Keywords
    switch (expr.toLowerCase()) {
      case 'true':
        return true;
      case 'false':
        return false;
      case 'null':
        return null;
      case 'empty':
        return '';
      default:
        throw new Error(`Unknown literal: ${expr}`);
    }
  }

  private handleDebugPrint(expr: string): string {
    // Extract arguments from Debug.Print expression
    const match = expr.match(/Debug\.Print\s*(.*)$/i);
    if (!match) return '';

    const args = match[1];
    if (!args.trim()) return '';

    // Simple parsing for Debug.Print arguments
    const evaluated = this.evaluate(args);
    return String(evaluated);
  }

  private isFunctionCall(expr: string): boolean {
    return /^\w+\s*\([^)]*\)$/.test(expr);
  }

  private evaluateFunctionCall(expr: string, context: Record<string, any>): any {
    const match = expr.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (!match) throw new Error(`Invalid function call: ${expr}`);

    const [, funcName, argsStr] = match;

    // Check if it's a built-in function
    if (VB6_BUILTINS[funcName]) {
      const args = this.parseArguments(argsStr, context);
      return VB6_BUILTINS[funcName](...args);
    }

    // Check in context
    if (context[funcName] && typeof context[funcName] === 'function') {
      const args = this.parseArguments(argsStr, context);
      return context[funcName](...args);
    }

    throw new Error(`Unknown function: ${funcName}`);
  }

  private parseArguments(argsStr: string, context: Record<string, any>): any[] {
    if (!argsStr.trim()) return [];

    // Simple argument parsing (doesn't handle nested function calls yet)
    const args = argsStr.split(',').map(arg => arg.trim());
    return args.map(arg => {
      if (this.isSimpleValue(arg)) {
        return this.parseSimpleValue(arg);
      }
      return this.getVariable(arg, context);
    });
  }

  private isArithmeticExpression(expr: string): boolean {
    return /^[\w\s+\-*/().]+$/.test(expr) && /[+\-*/]/.test(expr);
  }

  private evaluateArithmetic(expr: string, context: Record<string, any>): number {
    // Very basic arithmetic evaluation - would need a proper parser for complex expressions
    // This is a simplified implementation
    try {
      // Replace variables with their values
      let processedExpr = expr;

      // Simple variable substitution
      const varPattern = /\b[a-zA-Z_]\w*\b/g;
      processedExpr = processedExpr.replace(varPattern, match => {
        if (/^\d/.test(match)) return match; // Skip if starts with digit
        if (this.allowedKeywords.includes(match)) return match;

        const value = this.getVariable(match, context);
        return String(value);
      });

      // Use Function constructor for arithmetic only (still safer than eval)
      // Only allow basic arithmetic operations
      if (!/^[\d\s+\-*/.()]+$/.test(processedExpr)) {
        throw new Error('Invalid arithmetic expression');
      }

      return new Function(`return ${processedExpr}`)();
    } catch (error) {
      throw new Error(`Arithmetic evaluation error: ${(error as Error).message}`);
    }
  }

  private isVariableAccess(expr: string): boolean {
    return /^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*$/.test(expr);
  }

  private getVariable(name: string, context: Record<string, any>): any {
    // Check built-ins first
    if (VB6_BUILTINS[name] !== undefined) {
      return VB6_BUILTINS[name];
    }

    // Check context
    if (context[name] !== undefined) {
      return context[name];
    }

    // Handle object property access
    if (name.includes('.')) {
      const parts = name.split('.');
      let current = VB6_BUILTINS[parts[0]] || context[parts[0]];

      for (let i = 1; i < parts.length; i++) {
        if (current && typeof current === 'object') {
          current = current[parts[i]];
        } else {
          throw new Error(`Property '${parts[i]}' not found on '${parts[i - 1]}'`);
        }
      }

      return current;
    }

    throw new Error(`Variable '${name}' is not defined`);
  }
}

export const safeEvaluator = new SafeExpressionEvaluator();
export default safeEvaluator;
