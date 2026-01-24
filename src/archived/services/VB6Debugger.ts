import { DebugState, DebugFrame, WatchExpression, CompilerError } from '../types/extended';

export class VB6Debugger {
  private breakpoints: Set<string> = new Set();
  private watchExpressions: Map<string, WatchExpression> = new Map();
  private callStack: DebugFrame[] = [];
  private currentFrame: DebugFrame | null = null;
  private variables: Map<string, any> = new Map();
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentLine: number = 0;
  private currentFile: string = '';

  constructor(private onStateChange: (state: DebugState) => void) {}

  setBreakpoint(file: string, line: number): void {
    const key = `${file}:${line}`;
    this.breakpoints.add(key);
    this.notifyStateChange();
  }

  removeBreakpoint(file: string, line: number): void {
    const key = `${file}:${line}`;
    this.breakpoints.delete(key);
    this.notifyStateChange();
  }

  toggleBreakpoint(file: string, line: number): void {
    const key = `${file}:${line}`;
    if (this.breakpoints.has(key)) {
      this.breakpoints.delete(key);
    } else {
      this.breakpoints.add(key);
    }
    this.notifyStateChange();
  }

  clearAllBreakpoints(): void {
    this.breakpoints.clear();
    this.notifyStateChange();
  }

  addWatch(expression: string): void {
    const watch: WatchExpression = {
      expression,
      value: '<Not evaluated>',
      type: 'Variant',
      context: this.currentFile,
    };

    this.watchExpressions.set(expression, watch);
    this.evaluateWatch(watch);
    this.notifyStateChange();
  }

  removeWatch(expression: string): void {
    this.watchExpressions.delete(expression);
    this.notifyStateChange();
  }

  async run(): Promise<void> {
    this.isRunning = true;
    this.isPaused = false;
    this.notifyStateChange();

    try {
      await this.executeCode();
    } catch (error) {
      this.handleError(error);
    }
  }

  pause(): void {
    this.isPaused = true;
    this.notifyStateChange();
  }

  continue(): void {
    this.isPaused = false;
    this.notifyStateChange();
    this.executeCode();
  }

  step(): void {
    if (!this.isPaused) return;

    this.currentLine++;
    this.evaluateCurrentLine();
    this.notifyStateChange();
  }

  stepOver(): void {
    if (!this.isPaused) return;

    // Step over function calls
    const currentDepth = this.callStack.length;
    this.step();

    while (this.callStack.length > currentDepth && !this.shouldBreak()) {
      this.step();
    }
  }

  stepOut(): void {
    if (!this.isPaused) return;

    // Step out of current function
    const currentDepth = this.callStack.length;

    while (this.callStack.length >= currentDepth && !this.shouldBreak()) {
      this.step();
    }
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.callStack = [];
    this.currentFrame = null;
    this.variables.clear();
    this.notifyStateChange();
  }

  evaluateExpression(expression: string): any {
    try {
      // Simple expression evaluator
      const context = this.createEvaluationContext();
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch (error) {
      return `<Error: ${error.message}>`;
    }
  }

  getVariableValue(name: string): any {
    if (this.currentFrame && this.currentFrame.variables[name] !== undefined) {
      return this.currentFrame.variables[name];
    }
    return this.variables.get(name);
  }

  setVariableValue(name: string, value: any): void {
    if (this.currentFrame) {
      this.currentFrame.variables[name] = value;
    }
    this.variables.set(name, value);
    this.updateWatches();
    this.notifyStateChange();
  }

  getCurrentState(): DebugState {
    return {
      mode: this.isRunning ? (this.isPaused ? 'break' : 'run') : 'design',
      currentLine: this.currentLine,
      currentFile: this.currentFile,
      variables: this.currentFrame?.variables || {},
      callStack: [...this.callStack],
      breakpoints: new Set(this.breakpoints),
      watchExpressions: Array.from(this.watchExpressions.values()),
    };
  }

  private async executeCode(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      if (this.shouldBreak()) {
        this.isPaused = true;
        break;
      }

      await this.executeNextStatement();

      // Allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private async executeNextStatement(): Promise<void> {
    // Simulate code execution
    this.currentLine++;

    // Check for procedure calls
    if (this.isFunction(this.currentLine)) {
      this.enterFunction();
    } else if (this.isReturn(this.currentLine)) {
      this.exitFunction();
    }

    this.evaluateCurrentLine();
  }

  private evaluateCurrentLine(): void {
    // Update watches
    this.updateWatches();

    // Update variables
    this.updateVariables();
  }

  private shouldBreak(): boolean {
    const key = `${this.currentFile}:${this.currentLine}`;
    return this.breakpoints.has(key);
  }

  private enterFunction(): void {
    const frame: DebugFrame = {
      procedure: `Procedure${this.currentLine}`,
      module: this.currentFile,
      line: this.currentLine,
      variables: {},
    };

    this.callStack.push(frame);
    this.currentFrame = frame;
  }

  private exitFunction(): void {
    this.callStack.pop();
    this.currentFrame = this.callStack[this.callStack.length - 1] || null;
  }

  private isFunction(line: number): boolean {
    // Simple heuristic - in real implementation, this would parse the code
    return line % 10 === 0;
  }

  private isReturn(line: number): boolean {
    // Simple heuristic - in real implementation, this would parse the code
    return line % 15 === 0;
  }

  private updateWatches(): void {
    this.watchExpressions.forEach(watch => {
      this.evaluateWatch(watch);
    });
  }

  private evaluateWatch(watch: WatchExpression): void {
    try {
      watch.value = this.evaluateExpression(watch.expression);
      watch.type = typeof watch.value;
      delete watch.error;
    } catch (error) {
      watch.error = error.message;
      watch.value = '<Error>';
    }
  }

  private updateVariables(): void {
    // Simulate variable updates during execution
    if (this.currentFrame) {
      this.currentFrame.variables[`var${this.currentLine}`] = this.currentLine;
    }
  }

  private createEvaluationContext(): any {
    const context: any = {};

    // Add current variables
    this.variables.forEach((value, key) => {
      context[key] = value;
    });

    // Add current frame variables
    if (this.currentFrame) {
      Object.assign(context, this.currentFrame.variables);
    }

    // Add built-in functions
    context.Len = (str: string) => str.length;
    context.Left = (str: string, n: number) => str.substring(0, n);
    context.Right = (str: string, n: number) => str.substring(str.length - n);
    context.Mid = (str: string, start: number, length?: number) =>
      str.substring(start - 1, length ? start - 1 + length : undefined);
    context.UCase = (str: string) => str.toUpperCase();
    context.LCase = (str: string) => str.toLowerCase();
    context.Val = (str: string) => parseFloat(str) || 0;
    context.Now = () => new Date();

    return context;
  }

  private handleError(error: any): void {
    console.error('Debug error:', error);
    this.stop();
  }

  private notifyStateChange(): void {
    this.onStateChange(this.getCurrentState());
  }

  // Performance profiling
  startProfiling(): void {
    // Implementation for performance profiling
  }

  stopProfiling(): ProfileData {
    // Return profiling data
    return {
      totalTime: 0,
      functionCalls: [],
      memoryUsage: 0,
    };
  }

  // Code coverage
  startCodeCoverage(): void {
    // Implementation for code coverage
  }

  getCodeCoverage(): CoverageData {
    // Return coverage data
    return {
      totalLines: 0,
      coveredLines: 0,
      coverage: 0,
      uncoveredLines: [],
    };
  }
}

interface ProfileData {
  totalTime: number;
  functionCalls: FunctionCall[];
  memoryUsage: number;
}

interface FunctionCall {
  name: string;
  duration: number;
  calls: number;
}

interface CoverageData {
  totalLines: number;
  coveredLines: number;
  coverage: number;
  uncoveredLines: number[];
}
