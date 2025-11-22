/**
 * VB6 Line Numbers and Labels Implementation
 * Support for legacy BASIC line numbers and label-based flow control
 */

// Line/Label types
export enum LineTargetType {
  LineNumber = 'linenumber',
  Label = 'label',
  Procedure = 'procedure'
}

// Jump instruction types
export enum JumpType {
  GoTo = 'goto',
  GoSub = 'gosub',
  OnError = 'onerror',
  Resume = 'resume',
  OnGoTo = 'ongoto',
  OnGoSub = 'ongosub'
}

// Line/Label entry
export interface LineEntry {
  type: LineTargetType;
  identifier: string | number;
  lineNumber: number;
  codePosition: number;
  procedure?: string;
  module?: string;
}

// Execution context
export interface ExecutionContext {
  currentLine: number;
  currentPosition: number;
  currentProcedure: string;
  currentModule: string;
  returnStack: number[];
  errorHandler?: string | number;
  locals: Map<string, any>;
}

/**
 * VB6 Line Number Manager
 * Manages line numbers, labels, and flow control
 */
export class VB6LineNumberManager {
  private static instance: VB6LineNumberManager;
  private lineMap = new Map<string, Map<string | number, LineEntry>>();
  private executionStack: ExecutionContext[] = [];
  private currentContext: ExecutionContext | null = null;
  private breakpoints = new Set<string>();
  private traceMode = false;
  private stepMode = false;
  private maxStackDepth = 1000;
  
  private constructor() {}
  
  static getInstance(): VB6LineNumberManager {
    if (!VB6LineNumberManager.instance) {
      VB6LineNumberManager.instance = new VB6LineNumberManager();
    }
    return VB6LineNumberManager.instance;
  }
  
  /**
   * Register a line number
   */
  registerLineNumber(
    lineNumber: number,
    codePosition: number,
    procedure: string = 'Main',
    module: string = 'Module1'
  ): void {
    const key = `${module}.${procedure}`;
    
    if (!this.lineMap.has(key)) {
      this.lineMap.set(key, new Map());
    }
    
    this.lineMap.get(key)!.set(lineNumber, {
      type: LineTargetType.LineNumber,
      identifier: lineNumber,
      lineNumber,
      codePosition,
      procedure,
      module
    });
  }
  
  /**
   * Register a label
   */
  registerLabel(
    label: string,
    lineNumber: number,
    codePosition: number,
    procedure: string = 'Main',
    module: string = 'Module1'
  ): void {
    const key = `${module}.${procedure}`;
    
    if (!this.lineMap.has(key)) {
      this.lineMap.set(key, new Map());
    }
    
    this.lineMap.get(key)!.set(label, {
      type: LineTargetType.Label,
      identifier: label,
      lineNumber,
      codePosition,
      procedure,
      module
    });
    
    console.log(`[VB6 Lines] Registered label '${label}' at line ${lineNumber}`);
  }
  
  /**
   * Enter a procedure
   */
  enterProcedure(
    procedure: string,
    module: string = 'Module1',
    startLine: number = 1
  ): void {
    const context: ExecutionContext = {
      currentLine: startLine,
      currentPosition: 0,
      currentProcedure: procedure,
      currentModule: module,
      returnStack: [],
      locals: new Map()
    };
    
    this.executionStack.push(context);
    this.currentContext = context;
    
    if (this.traceMode) {
      console.log(`[VB6 Trace] Entering ${module}.${procedure}`);
    }
  }
  
  /**
   * Exit current procedure
   */
  exitProcedure(): void {
    if (this.executionStack.length > 0) {
      const exitingContext = this.executionStack.pop()!;
      
      if (this.traceMode) {
        console.log(`[VB6 Trace] Exiting ${exitingContext.currentModule}.${exitingContext.currentProcedure}`);
      }
      
      this.currentContext = this.executionStack.length > 0 
        ? this.executionStack[this.executionStack.length - 1]
        : null;
    }
  }
  
  /**
   * Set current line number
   */
  setCurrentLine(lineNumber: number): void {
    if (this.currentContext) {
      this.currentContext.currentLine = lineNumber;
      
      if (this.traceMode) {
        console.log(`[VB6 Trace] Line ${lineNumber}`);
      }
      
      // Check breakpoint
      const breakKey = `${this.currentContext.currentModule}.${this.currentContext.currentProcedure}.${lineNumber}`;
      if (this.breakpoints.has(breakKey)) {
        this.handleBreakpoint(lineNumber);
      }
      
      // Handle step mode
      if (this.stepMode) {
        this.handleStep(lineNumber);
      }
    }
  }
  
  /**
   * GoTo implementation
   */
  goTo(target: string | number): number {
    if (!this.currentContext) {
      throw new Error('No execution context');
    }
    
    const key = `${this.currentContext.currentModule}.${this.currentContext.currentProcedure}`;
    const targets = this.lineMap.get(key);
    
    if (!targets) {
      throw new Error(`No line numbers/labels in ${key}`);
    }
    
    const entry = targets.get(target);
    if (!entry) {
      throw new Error(`Line/Label '${target}' not found`);
    }
    
    if (this.traceMode) {
      console.log(`[VB6 Trace] GoTo ${target} (line ${entry.lineNumber})`);
    }
    
    this.currentContext.currentLine = entry.lineNumber;
    this.currentContext.currentPosition = entry.codePosition;
    
    return entry.codePosition;
  }
  
  /**
   * GoSub implementation
   */
  goSub(target: string | number): number {
    if (!this.currentContext) {
      throw new Error('No execution context');
    }
    
    // Check stack depth
    if (this.currentContext.returnStack.length >= this.maxStackDepth) {
      throw new Error('Out of stack space');
    }
    
    // Save return position
    this.currentContext.returnStack.push(this.currentContext.currentPosition + 1);
    
    // Jump to target
    return this.goTo(target);
  }
  
  /**
   * Return implementation
   */
  return(): number {
    if (!this.currentContext) {
      throw new Error('No execution context');
    }
    
    if (this.currentContext.returnStack.length === 0) {
      throw new Error('Return without GoSub');
    }
    
    const returnPosition = this.currentContext.returnStack.pop()!;
    
    if (this.traceMode) {
      console.log(`[VB6 Trace] Return to position ${returnPosition}`);
    }
    
    this.currentContext.currentPosition = returnPosition;
    
    return returnPosition;
  }
  
  /**
   * On...GoTo implementation
   */
  onGoTo(index: number, ...targets: (string | number)[]): number | null {
    if (index < 1 || index > targets.length) {
      // Index out of range - continue to next statement
      return null;
    }
    
    const target = targets[index - 1];
    return this.goTo(target);
  }
  
  /**
   * On...GoSub implementation
   */
  onGoSub(index: number, ...targets: (string | number)[]): number | null {
    if (index < 1 || index > targets.length) {
      // Index out of range - continue to next statement
      return null;
    }
    
    const target = targets[index - 1];
    return this.goSub(target);
  }
  
  /**
   * Set error handler (On Error GoTo)
   */
  setErrorHandler(target: string | number | null): void {
    if (this.currentContext) {
      this.currentContext.errorHandler = target || undefined;
      
      if (this.traceMode) {
        console.log(`[VB6 Trace] On Error GoTo ${target || '0'}`);
      }
    }
  }
  
  /**
   * Handle error - jump to error handler
   */
  handleError(errorNumber: number): number | null {
    if (!this.currentContext || !this.currentContext.errorHandler) {
      return null;
    }
    
    if (this.traceMode) {
      console.log(`[VB6 Trace] Error ${errorNumber} - jumping to ${this.currentContext.errorHandler}`);
    }
    
    return this.goTo(this.currentContext.errorHandler);
  }
  
  /**
   * Resume at specific line/label
   */
  resumeAt(target: string | number): number {
    return this.goTo(target);
  }
  
  /**
   * Set/clear breakpoint
   */
  setBreakpoint(
    lineNumber: number,
    procedure: string = 'Main',
    module: string = 'Module1',
    enabled: boolean = true
  ): void {
    const key = `${module}.${procedure}.${lineNumber}`;
    
    if (enabled) {
      this.breakpoints.add(key);
      console.log(`[VB6 Debug] Breakpoint set at ${key}`);
    } else {
      this.breakpoints.delete(key);
      console.log(`[VB6 Debug] Breakpoint cleared at ${key}`);
    }
  }
  
  /**
   * Clear all breakpoints
   */
  clearBreakpoints(): void {
    this.breakpoints.clear();
    console.log('[VB6 Debug] All breakpoints cleared');
  }
  
  /**
   * Enable/disable trace mode
   */
  setTraceMode(enabled: boolean): void {
    this.traceMode = enabled;
    console.log(`[VB6 Debug] Trace mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Enable/disable step mode
   */
  setStepMode(enabled: boolean): void {
    this.stepMode = enabled;
    console.log(`[VB6 Debug] Step mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get current execution info
   */
  getCurrentInfo(): {
    line: number;
    procedure: string;
    module: string;
    stackDepth: number;
  } | null {
    if (!this.currentContext) {
      return null;
    }
    
    return {
      line: this.currentContext.currentLine,
      procedure: this.currentContext.currentProcedure,
      module: this.currentContext.currentModule,
      stackDepth: this.executionStack.length
    };
  }
  
  /**
   * Get call stack
   */
  getCallStack(): string[] {
    return this.executionStack.map(ctx => 
      `${ctx.currentModule}.${ctx.currentProcedure} (Line ${ctx.currentLine})`
    );
  }
  
  /**
   * Get or set local variable
   */
  getLocal(name: string): any {
    return this.currentContext?.locals.get(name);
  }
  
  setLocal(name: string, value: any): void {
    if (this.currentContext) {
      this.currentContext.locals.set(name, value);
    }
  }
  
  private handleBreakpoint(lineNumber: number): void {
    console.log(`[VB6 Debug] Breakpoint hit at line ${lineNumber}`);

    // In browser environment, could trigger debugger
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
  
  private handleStep(lineNumber: number): void {
    console.log(`[VB6 Debug] Step at line ${lineNumber}`);
    
    // Could pause execution or trigger debugger
    if (typeof window !== 'undefined') {
      // Could show step dialog or pause
    }
  }
  
  /**
   * Reset all state
   */
  reset(): void {
    this.lineMap.clear();
    this.executionStack = [];
    this.currentContext = null;
    this.breakpoints.clear();
    this.traceMode = false;
    this.stepMode = false;
  }
}

// Global instance
export const LineNumberManager = VB6LineNumberManager.getInstance();

/**
 * Helper functions for transpiled code
 */

// Register line number
export function RegisterLine(
  lineNumber: number,
  position: number,
  procedure?: string,
  module?: string
): void {
  LineNumberManager.registerLineNumber(lineNumber, position, procedure, module);
}

// Register label
export function RegisterLabel(
  label: string,
  lineNumber: number,
  position: number,
  procedure?: string,
  module?: string
): void {
  LineNumberManager.registerLabel(label, lineNumber, position, procedure, module);
}

// GoTo statement
export function GoTo(target: string | number): void {
  const position = LineNumberManager.goTo(target);
  // In transpiled code, would use this position to jump
}

// GoSub statement
export function GoSub(target: string | number): void {
  const position = LineNumberManager.goSub(target);
  // In transpiled code, would use this position to jump
}

// Return statement
export function Return(): void {
  const position = LineNumberManager.return();
  // In transpiled code, would use this position to return
}

// On...GoTo statement
export function OnGoTo(index: number, ...targets: (string | number)[]): void {
  const position = LineNumberManager.onGoTo(index, ...targets);
  // In transpiled code, would use this position to jump
}

// On...GoSub statement
export function OnGoSub(index: number, ...targets: (string | number)[]): void {
  const position = LineNumberManager.onGoSub(index, ...targets);
  // In transpiled code, would use this position to jump
}

// Set current line for tracking
export function SetLine(lineNumber: number): void {
  LineNumberManager.setCurrentLine(lineNumber);
}

// Stop statement (breakpoint)
export function Stop(): void {
  const info = LineNumberManager.getCurrentInfo();
  if (info) {
    console.log(`[VB6] STOP at ${info.module}.${info.procedure}:${info.line}`);
  }

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-debugger
    debugger;
  }
}

// End statement
export function End(): void {
  console.log('[VB6] END - Program terminated');
  LineNumberManager.reset();
}

/**
 * Erl function - Get error line number
 */
export function Erl(): number {
  const info = LineNumberManager.getCurrentInfo();
  return info ? info.line : 0;
}

/**
 * Example: Legacy BASIC code with line numbers
 */
export class VB6LineNumberExample {
  demonstrateLineNumbers(): void {
    // Register line numbers and labels
    RegisterLine(10, 0, 'Main', 'Module1');
    RegisterLine(20, 1, 'Main', 'Module1');
    RegisterLine(30, 2, 'Main', 'Module1');
    RegisterLabel('ErrorHandler', 100, 10, 'Main', 'Module1');
    RegisterLabel('Cleanup', 200, 20, 'Main', 'Module1');
    
    // Enter procedure
    LineNumberManager.enterProcedure('Main', 'Module1', 10);
    
    // Simulate execution with line tracking
    SetLine(10);
    console.log('10 PRINT "Starting program"');
    
    SetLine(20);
    console.log('20 INPUT "Enter value: ", value');
    
    SetLine(30);
    console.log('30 IF value > 100 THEN GOTO ErrorHandler');
    
    // Conditional jump
    const value = 150;
    if (value > 100) {
      GoTo('ErrorHandler');
    }
    
    // Error handler
    SetLine(100);
    console.log('100 ErrorHandler:');
    console.log('110 PRINT "Error: Value too large"');
    
    // Cleanup
    GoTo('Cleanup');
    SetLine(200);
    console.log('200 Cleanup:');
    console.log('210 PRINT "Cleaning up"');
    
    // Exit procedure
    LineNumberManager.exitProcedure();
  }
  
  demonstrateOnGoTo(): void {
    console.log('ON...GOTO Example:');
    
    // Register targets
    RegisterLabel('Option1', 100, 10);
    RegisterLabel('Option2', 200, 20);
    RegisterLabel('Option3', 300, 30);
    
    // ON...GOTO based on user choice
    const choice = 2;
    OnGoTo(choice, 'Option1', 'Option2', 'Option3');
    
    // Would jump to Option2
    console.log('Jumped to Option2');
  }
  
  demonstrateGoSub(): void {
    console.log('GOSUB Example:');
    
    // Register subroutine
    RegisterLabel('PrintHeader', 1000, 100);
    
    // Main code
    console.log('Main: Before GoSub');
    GoSub('PrintHeader');
    console.log('Main: After Return');
    
    // Subroutine
    SetLine(1000);
    console.log('1000 PrintHeader:');
    console.log('1010 PRINT "=== Header ==="');
    Return();
  }
  
  demonstrateDebugging(): void {
    // Enable trace mode
    LineNumberManager.setTraceMode(true);
    
    // Set breakpoints
    LineNumberManager.setBreakpoint(50, 'TestProc', 'Module1');
    
    // Enter procedure
    LineNumberManager.enterProcedure('TestProc', 'Module1');
    
    // Execute with tracking
    SetLine(10);
    SetLine(20);
    SetLine(30);
    SetLine(40);
    SetLine(50); // Will hit breakpoint
    
    // Get call stack
    const stack = LineNumberManager.getCallStack();
    console.log('Call Stack:', stack);
    
    // Exit procedure
    LineNumberManager.exitProcedure();
    
    // Disable trace mode
    LineNumberManager.setTraceMode(false);
  }
}

/**
 * Classic BASIC program transpiled example
 */
export function ClassicBASICProgram(): void {
  // 10 REM Classic BASIC Program
  RegisterLine(10, 0);
  SetLine(10);
  
  // 20 DIM A(10)
  RegisterLine(20, 1);
  SetLine(20);
  const A = new Array(10);
  
  // 30 FOR I = 1 TO 10
  RegisterLine(30, 2);
  SetLine(30);
  for (let I = 1; I <= 10; I++) {
    // 40 A(I) = I * I
    RegisterLine(40, 3);
    SetLine(40);
    A[I - 1] = I * I;
    
    // 50 PRINT I, A(I)
    RegisterLine(50, 4);
    SetLine(50);
    console.log(I, A[I - 1]);
  }
  // 60 NEXT I
  RegisterLine(60, 5);
  SetLine(60);
  
  // 70 GOSUB 1000
  RegisterLine(70, 6);
  SetLine(70);
  GoSub(1000);
  
  // 80 END
  RegisterLine(80, 7);
  SetLine(80);
  End();
  
  // 1000 REM Subroutine
  RegisterLine(1000, 100);
  SetLine(1000);
  console.log('Subroutine called');
  
  // 1010 RETURN
  RegisterLine(1010, 101);
  SetLine(1010);
  Return();
}

// Export all line number functionality
export const VB6LineNumbers = {
  LineTargetType,
  JumpType,
  VB6LineNumberManager,
  LineNumberManager,
  RegisterLine,
  RegisterLabel,
  GoTo,
  GoSub,
  Return,
  OnGoTo,
  OnGoSub,
  SetLine,
  Stop,
  End,
  Erl,
  VB6LineNumberExample,
  ClassicBASICProgram
};