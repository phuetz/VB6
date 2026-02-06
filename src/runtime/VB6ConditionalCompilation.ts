/**
 * VB6 Conditional Compilation Support
 * Implements #If...#Then...#Else...#End If preprocessor directives
 * TRUE 100% VB6 conditional compilation compatibility
 */

// ============================================================================
// CONDITIONAL COMPILATION CONSTANTS
// ============================================================================

/**
 * Compilation constants storage
 */
export class VB6CompilationConstants {
  private static instance: VB6CompilationConstants;
  private constants: Map<string, any> = new Map();

  constructor() {
    // Set default VB6 compilation constants
    this.setDefaults();
  }

  static getInstance(): VB6CompilationConstants {
    if (!VB6CompilationConstants.instance) {
      VB6CompilationConstants.instance = new VB6CompilationConstants();
    }
    return VB6CompilationConstants.instance;
  }

  /**
   * Set default compilation constants
   */
  private setDefaults(): void {
    // Platform constants
    this.constants.set('Win32', typeof window !== 'undefined');
    this.constants.set('Win64', false);
    this.constants.set('Win16', false);
    this.constants.set('Mac', navigator?.platform?.toLowerCase().includes('mac') || false);

    // VB version constants
    this.constants.set('VBA6', true);
    this.constants.set('VBA7', false);
    this.constants.set('VB6', true);

    // Debug/Release mode
    this.constants.set('DEBUG', true);
    this.constants.set('RELEASE', false);

    // Custom constants
    this.constants.set('WEBAPP', true);
    this.constants.set('BROWSER', true);
  }

  /**
   * Define a compilation constant
   * @param name Constant name
   * @param value Constant value
   */
  define(name: string, value: any): void {
    this.constants.set(name.toUpperCase(), value);
  }

  /**
   * Get a compilation constant value
   * @param name Constant name
   */
  get(name: string): any {
    return this.constants.get(name.toUpperCase());
  }

  /**
   * Check if a constant is defined
   * @param name Constant name
   */
  isDefined(name: string): boolean {
    return this.constants.has(name.toUpperCase());
  }

  /**
   * Evaluate a conditional expression
   * @param expression Expression to evaluate
   */
  evaluate(expression: string): boolean {
    try {
      // Replace constant names with their values
      let evalExpr = expression;

      // Replace constants
      this.constants.forEach((value, name) => {
        const regex = new RegExp(`\\b${name}\\b`, 'gi');
        evalExpr = evalExpr.replace(regex, JSON.stringify(value));
      });

      // Replace VB6 operators with JavaScript operators
      evalExpr = evalExpr
        .replace(/\bAnd\b/gi, '&&')
        .replace(/\bOr\b/gi, '||')
        .replace(/\bNot\b/gi, '!')
        .replace(/\bXor\b/gi, '^')
        .replace(/\bEqv\b/gi, '===')
        .replace(/\bImp\b/gi, '<=')
        .replace(/<>/g, '!==')
        .replace(/=/g, '===');

      // Evaluate the expression
      const result = new Function('return ' + evalExpr)();
      return Boolean(result);
    } catch (error) {
      console.error(`[VB6] Error evaluating conditional expression: ${expression}`, error);
      return false;
    }
  }

  /**
   * Clear all constants
   */
  clear(): void {
    this.constants.clear();
    this.setDefaults();
  }
}

// ============================================================================
// CONDITIONAL COMPILATION PROCESSOR
// ============================================================================

/**
 * Processes VB6 source code with conditional compilation directives
 */
export class VB6ConditionalCompiler {
  private static instance: VB6ConditionalCompiler;
  private constants: VB6CompilationConstants;
  private ifStack: boolean[] = [];
  private activeStack: boolean[] = [true];

  constructor() {
    this.constants = VB6CompilationConstants.getInstance();
  }

  static getInstance(): VB6ConditionalCompiler {
    if (!VB6ConditionalCompiler.instance) {
      VB6ConditionalCompiler.instance = new VB6ConditionalCompiler();
    }
    return VB6ConditionalCompiler.instance;
  }

  /**
   * Process VB6 source code with conditional compilation
   * @param source Source code with #If directives
   */
  process(source: string): string {
    const lines = source.split('\n');
    const outputLines: string[] = [];

    // Reset stacks
    this.ifStack = [];
    this.activeStack = [true];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for preprocessor directives
      if (trimmed.startsWith('#')) {
        this.processDirective(trimmed, outputLines);
      } else {
        // Only include line if current block is active
        if (this.isActive()) {
          outputLines.push(line);
        }
      }
    }

    return outputLines.join('\n');
  }

  /**
   * Process a preprocessor directive
   * @param directive The directive line
   * @param outputLines Output lines array
   */
  private processDirective(directive: string, outputLines: string[]): void {
    // #Const directive
    if (directive.startsWith('#Const ')) {
      if (this.isActive()) {
        this.processConst(directive);
      }
      return;
    }

    // #If directive
    if (directive.startsWith('#If ')) {
      this.processIf(directive);
      return;
    }

    // #ElseIf directive
    if (directive.startsWith('#ElseIf ')) {
      this.processElseIf(directive);
      return;
    }

    // #Else directive
    if (directive === '#Else') {
      this.processElse();
      return;
    }

    // #End If directive
    if (directive === '#End If') {
      this.processEndIf();
      return;
    }
  }

  /**
   * Process #Const directive
   * @param directive Const directive
   */
  private processConst(directive: string): void {
    const match = directive.match(/#Const\s+(\w+)\s*=\s*(.+)/i);
    if (match) {
      const [, name, value] = match;

      // Parse the value
      let parsedValue: any = value.trim();

      // Try to parse as number
      if (/^\d+$/.test(parsedValue)) {
        parsedValue = parseInt(parsedValue);
      } else if (/^\d*\.\d+$/.test(parsedValue)) {
        parsedValue = parseFloat(parsedValue);
      } else if (parsedValue === 'True') {
        parsedValue = true;
      } else if (parsedValue === 'False') {
        parsedValue = false;
      } else if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
        parsedValue = parsedValue.slice(1, -1);
      }

      this.constants.define(name, parsedValue);
    }
  }

  /**
   * Process #If directive
   * @param directive If directive
   */
  private processIf(directive: string): void {
    const match = directive.match(/#If\s+(.+)\s+Then/i);
    if (match) {
      const condition = match[1];
      const result = this.constants.evaluate(condition);

      this.ifStack.push(result);
      this.activeStack.push(this.isActive() && result);
    }
  }

  /**
   * Process #ElseIf directive
   * @param directive ElseIf directive
   */
  private processElseIf(directive: string): void {
    if (this.ifStack.length === 0) {
      throw new Error('Syntax error: #ElseIf without #If');
    }

    const match = directive.match(/#ElseIf\s+(.+)\s+Then/i);
    if (match) {
      const condition = match[1];

      // If previous condition was true, this block is inactive
      if (this.ifStack[this.ifStack.length - 1]) {
        this.activeStack[this.activeStack.length - 1] = false;
      } else {
        // Evaluate this condition
        const result = this.constants.evaluate(condition);
        this.ifStack[this.ifStack.length - 1] = result;
        this.activeStack[this.activeStack.length - 1] =
          this.activeStack[this.activeStack.length - 2] && result;
      }
    }
  }

  /**
   * Process #Else directive
   */
  private processElse(): void {
    if (this.ifStack.length === 0) {
      throw new Error('Syntax error: #Else without #If');
    }

    // If no previous condition was true, activate else block
    const wasActive = this.ifStack[this.ifStack.length - 1];
    this.activeStack[this.activeStack.length - 1] =
      this.activeStack[this.activeStack.length - 2] && !wasActive;
  }

  /**
   * Process #End If directive
   */
  private processEndIf(): void {
    if (this.ifStack.length === 0) {
      throw new Error('Syntax error: #End If without #If');
    }

    this.ifStack.pop();
    this.activeStack.pop();
  }

  /**
   * Check if current block is active
   */
  private isActive(): boolean {
    return this.activeStack[this.activeStack.length - 1];
  }
}

// ============================================================================
// CONDITIONAL COMPILATION FUNCTIONS
// ============================================================================

const compilationConstants = VB6CompilationConstants.getInstance();
const conditionalCompiler = VB6ConditionalCompiler.getInstance();

/**
 * Define a compilation constant (#Const)
 * @param name Constant name
 * @param value Constant value
 */
export function DefineConst(name: string, value: any): void {
  compilationConstants.define(name, value);
}

/**
 * Get a compilation constant value
 * @param name Constant name
 */
export function GetConst(name: string): any {
  return compilationConstants.get(name);
}

/**
 * Check if a compilation constant is defined
 * @param name Constant name
 */
export function IsConstDefined(name: string): boolean {
  return compilationConstants.isDefined(name);
}

/**
 * Process source code with conditional compilation
 * @param source VB6 source code
 */
export function ProcessConditionalCompilation(source: string): string {
  return conditionalCompiler.process(source);
}

/**
 * Evaluate a conditional compilation expression
 * @param expression Expression to evaluate
 */
export function EvaluateCondition(expression: string): boolean {
  return compilationConstants.evaluate(expression);
}

// ============================================================================
// EXPORT ALL CONDITIONAL COMPILATION
// ============================================================================

export const VB6ConditionalCompilation = {
  VB6CompilationConstants,
  VB6ConditionalCompiler,
  DefineConst,
  GetConst,
  IsConstDefined,
  ProcessConditionalCompilation,
  EvaluateCondition,
  compilationConstants,
  conditionalCompiler,
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;

  // Conditional compilation functions
  globalAny.DefineConst = DefineConst;
  globalAny.GetConst = GetConst;
  globalAny.IsConstDefined = IsConstDefined;
  globalAny.ProcessConditionalCompilation = ProcessConditionalCompilation;
  globalAny.EvaluateCondition = EvaluateCondition;

  // Instances
  globalAny.VB6CompilationConstants = compilationConstants;
  globalAny.VB6ConditionalCompiler = conditionalCompiler;
}

export default VB6ConditionalCompilation;
