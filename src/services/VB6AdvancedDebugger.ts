/**
 * VB6 Advanced Debugger Service
 *
 * Enhanced debugging capabilities with conditional breakpoints, tracepoints, and more
 */

import { DebugState, DebugFrame, WatchExpression } from '../types/extended';
import { DebugValue, EvaluationContext, MemorySnapshot } from './types/VB6ServiceTypes';

// Enhanced breakpoint types
export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
  hitCount?: number;
  logMessage?: string;
  type: 'breakpoint' | 'tracepoint' | 'conditional';
}

export interface DebugVariable {
  name: string;
  value: DebugValue;
  type: string;
  scope: 'local' | 'module' | 'global';
  canEdit: boolean;
  children?: DebugVariable[];
}

export interface DebuggerOptions {
  enableSourceMaps: boolean;
  enableExceptionBreaking: boolean;
  enableJustMyCode: boolean;
  maxCallStackDepth: number;
  evaluationTimeout: number;
}

export interface ExceptionBreakpoint {
  type: string;
  enabled: boolean;
  condition?: 'always' | 'unhandled' | 'userUnhandled';
}

export interface DebugConsoleMessage {
  type: 'output' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  source?: string;
}

export interface DebugSnapshot {
  id: string;
  timestamp: Date;
  callStack: DebugFrame[];
  variables: Map<string, DebugVariable>;
  breakpoints: Breakpoint[];
  description: string;
}

export class VB6AdvancedDebugger {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private watchExpressions: Map<string, WatchExpression> = new Map();
  private callStack: DebugFrame[] = [];
  private currentFrame: DebugFrame | null = null;
  private variables: Map<string, DebugVariable> = new Map();
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentLine: number = 0;
  private currentFile: string = '';
  
  // Advanced features
  private conditionalBreakpoints: Map<string, Breakpoint> = new Map();
  private tracepoints: Map<string, Breakpoint> = new Map();
  private exceptionBreakpoints: Map<string, ExceptionBreakpoint> = new Map();
  private debugConsole: DebugConsoleMessage[] = [];
  private snapshots: Map<string, DebugSnapshot> = new Map();
  private hitCounts: Map<string, number> = new Map();
  private options: DebuggerOptions;
  private executionHistory: string[] = [];
  private dataBreakpoints: Map<string, DataBreakpoint> = new Map();
  
  constructor(
    private onStateChange: (state: DebugState) => void,
    options?: Partial<DebuggerOptions>
  ) {
    this.options = {
      enableSourceMaps: true,
      enableExceptionBreaking: true,
      enableJustMyCode: true,
      maxCallStackDepth: 1000,
      evaluationTimeout: 5000,
      ...options
    };
    
    this.initializeExceptionBreakpoints();
  }

  // Conditional breakpoint management
  setConditionalBreakpoint(
    file: string,
    line: number,
    condition: string,
    hitCount?: number
  ): string {
    const id = `${file}:${line}:${Date.now()}`;
    const breakpoint: Breakpoint = {
      id,
      file,
      line,
      enabled: true,
      condition,
      hitCount,
      type: 'conditional'
    };
    
    this.conditionalBreakpoints.set(id, breakpoint);
    this.breakpoints.set(`${file}:${line}`, breakpoint);
    this.notifyStateChange();
    
    return id;
  }

  // Tracepoint management
  setTracepoint(
    file: string,
    line: number,
    logMessage: string,
    condition?: string
  ): string {
    const id = `${file}:${line}:trace:${Date.now()}`;
    const tracepoint: Breakpoint = {
      id,
      file,
      line,
      enabled: true,
      logMessage,
      condition,
      type: 'tracepoint'
    };
    
    this.tracepoints.set(id, tracepoint);
    this.notifyStateChange();
    
    return id;
  }

  // Data breakpoint (break when variable changes)
  setDataBreakpoint(
    variableName: string,
    accessType: 'read' | 'write' | 'readWrite'
  ): string {
    const id = `data:${variableName}:${Date.now()}`;
    const dataBreakpoint: DataBreakpoint = {
      id,
      variableName,
      accessType,
      enabled: true,
      lastValue: this.getVariableValue(variableName)
    };
    
    this.dataBreakpoints.set(id, dataBreakpoint);
    this.notifyStateChange();
    
    return id;
  }

  // Enhanced breakpoint evaluation
  private async shouldBreak(): Promise<boolean> {
    const key = `${this.currentFile}:${this.currentLine}`;
    const breakpoint = this.breakpoints.get(key);
    
    if (!breakpoint || !breakpoint.enabled) {
      return false;
    }
    
    // Check hit count
    if (breakpoint.hitCount !== undefined) {
      const currentHits = (this.hitCounts.get(breakpoint.id) || 0) + 1;
      this.hitCounts.set(breakpoint.id, currentHits);
      
      if (currentHits < breakpoint.hitCount) {
        return false;
      }
    }
    
    // Evaluate condition
    if (breakpoint.condition) {
      try {
        const result = await this.evaluateCondition(breakpoint.condition);
        if (!result) {
          return false;
        }
      } catch (error) {
        this.logConsole('error', `Breakpoint condition error: ${error.message}`);
        return false;
      }
    }
    
    return true;
  }

  // Process tracepoints
  private async processTracepoints(): Promise<void> {
    const key = `${this.currentFile}:${this.currentLine}`;
    
    for (const [id, tracepoint] of this.tracepoints) {
      if (tracepoint.file === this.currentFile && 
          tracepoint.line === this.currentLine && 
          tracepoint.enabled) {
        
        // Evaluate condition if exists
        if (tracepoint.condition) {
          try {
            const result = await this.evaluateCondition(tracepoint.condition);
            if (!result) continue;
          } catch (error) {
            continue;
          }
        }
        
        // Process log message
        const message = await this.interpolateLogMessage(tracepoint.logMessage!);
        this.logConsole('info', message, 'Tracepoint');
      }
    }
  }

  // Interpolate variables in log messages
  private async interpolateLogMessage(message: string): Promise<string> {
    const regex = /\{([^}]+)\}/g;
    let result = message;
    let match;
    
    while ((match = regex.exec(message)) !== null) {
      const expression = match[1];
      try {
        const value = await this.evaluateExpression(expression);
        result = result.replace(match[0], String(value));
      } catch (error) {
        result = result.replace(match[0], `<Error: ${error.message}>`);
      }
    }
    
    return result;
  }

  // Enhanced expression evaluation with timeout
  async evaluateExpression(expression: string, timeout?: number): Promise<DebugValue> {
    return new Promise((resolve, reject) => {
      const timeoutMs = timeout || this.options.evaluationTimeout;
      const timer = setTimeout(() => {
        reject(new Error('Evaluation timeout'));
      }, timeoutMs);

      try {
        const context = this.createEvaluationContext();
        const func = new Function(...Object.keys(context), `return ${expression}`);
        const result = func(...Object.values(context));
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  // Evaluate condition asynchronously
  private async evaluateCondition(condition: string): Promise<boolean> {
    try {
      const result = await this.evaluateExpression(condition);
      return Boolean(result);
    } catch (error) {
      return false;
    }
  }

  // Exception breakpoint handling
  private initializeExceptionBreakpoints() {
    // VB6 common exceptions
    this.exceptionBreakpoints.set('Error', {
      type: 'Error',
      enabled: true,
      condition: 'always'
    });
    
    this.exceptionBreakpoints.set('TypeMismatch', {
      type: 'TypeMismatch',
      enabled: true,
      condition: 'unhandled'
    });
    
    this.exceptionBreakpoints.set('Overflow', {
      type: 'Overflow',
      enabled: true,
      condition: 'unhandled'
    });
    
    this.exceptionBreakpoints.set('OutOfMemory', {
      type: 'OutOfMemory',
      enabled: true,
      condition: 'always'
    });
  }

  // Handle exceptions
  private async handleException(error: Error | { constructor?: { name?: string }; message?: string }): Promise<void> {
    const exceptionType = error.constructor?.name || 'Error';
    const exceptionBreakpoint = this.exceptionBreakpoints.get(exceptionType);
    
    if (exceptionBreakpoint && exceptionBreakpoint.enabled) {
      const shouldBreak = 
        exceptionBreakpoint.condition === 'always' ||
        (exceptionBreakpoint.condition === 'unhandled' && !this.isExceptionHandled());
      
      if (shouldBreak) {
        this.isPaused = true;
        this.logConsole('error', `Exception: ${error.message}`, 'Exception');
        this.notifyStateChange();
      }
    }
  }

  // Check if current exception is handled
  private isExceptionHandled(): boolean {
    // Check if we're in an error handler
    return this.callStack.some(frame => 
      frame.procedure.includes('_Error') || 
      frame.procedure.includes('ErrorHandler')
    );
  }

  // Debug console logging
  logConsole(
    type: DebugConsoleMessage['type'],
    message: string,
    source?: string
  ): void {
    const consoleMessage: DebugConsoleMessage = {
      type,
      message,
      timestamp: new Date(),
      source
    };
    
    this.debugConsole.push(consoleMessage);
    
    // Limit console history
    if (this.debugConsole.length > 1000) {
      this.debugConsole.shift();
    }
    
    this.notifyStateChange();
  }

  // Snapshot management
  takeSnapshot(description: string): string {
    const id = `snapshot_${Date.now()}`;
    const snapshot: DebugSnapshot = {
      id,
      timestamp: new Date(),
      callStack: [...this.callStack],
      variables: new Map(this.variables),
      breakpoints: Array.from(this.breakpoints.values()),
      description
    };
    
    this.snapshots.set(id, snapshot);
    this.logConsole('info', `Snapshot taken: ${description}`, 'Debugger');
    
    return id;
  }

  // Restore from snapshot
  restoreSnapshot(id: string): boolean {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      return false;
    }
    
    this.callStack = [...snapshot.callStack];
    this.variables = new Map(snapshot.variables);
    this.currentFrame = this.callStack[this.callStack.length - 1] || null;
    
    this.logConsole('info', `Restored snapshot: ${snapshot.description}`, 'Debugger');
    this.notifyStateChange();
    
    return true;
  }

  // Enhanced variable inspection
  inspectVariable(name: string): DebugVariable | null {
    const variable = this.variables.get(name);
    if (!variable) {
      return null;
    }
    
    // Add detailed type information
    const detailedVariable: DebugVariable = {
      ...variable,
      children: this.getVariableChildren(variable)
    };
    
    return detailedVariable;
  }

  // Get children for complex variables
  private getVariableChildren(variable: DebugVariable): DebugVariable[] | undefined {
    if (typeof variable.value !== 'object' || variable.value === null) {
      return undefined;
    }
    
    const children: DebugVariable[] = [];
    
    if (Array.isArray(variable.value)) {
      variable.value.forEach((item, index) => {
        children.push({
          name: `[${index}]`,
          value: item,
          type: this.getVariableType(item),
          scope: variable.scope,
          canEdit: true
        });
      });
    } else {
      Object.entries(variable.value).forEach(([key, value]) => {
        children.push({
          name: key,
          value: value,
          type: this.getVariableType(value),
          scope: variable.scope,
          canEdit: true
        });
      });
    }
    
    return children.length > 0 ? children : undefined;
  }

  // Get detailed type information
  private getVariableType(value: DebugValue): string {
    if (value === null) return 'Null';
    if (value === undefined) return 'Empty';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (value instanceof Date) return 'Date';
    if (typeof value === 'object') return (value as object).constructor?.name || 'Object';
    return typeof value;
  }

  // Enhanced stepping with filtering
  async stepWithFilter(filter: StepFilter): Promise<void> {
    if (!this.isPaused) return;
    
    do {
      await this.step();
    } while (!this.matchesFilter(filter) && this.isRunning && !this.isPaused);
  }

  // Check if current position matches filter
  private matchesFilter(filter: StepFilter): boolean {
    if (filter.justMyCode && this.isSystemCode()) {
      return false;
    }
    
    if (filter.modulePattern && !this.currentFile.match(filter.modulePattern)) {
      return false;
    }
    
    if (filter.excludePattern && this.currentFile.match(filter.excludePattern)) {
      return false;
    }
    
    return true;
  }

  // Check if current code is system code
  private isSystemCode(): boolean {
    return this.currentFile.includes('node_modules') ||
           this.currentFile.includes('system') ||
           this.currentFile.startsWith('[');
  }

  // Get execution history
  getExecutionHistory(limit: number = 100): string[] {
    return this.executionHistory.slice(-limit);
  }

  // Record execution step
  private recordExecutionStep() {
    const step = `${this.currentFile}:${this.currentLine}`;
    this.executionHistory.push(step);
    
    // Limit history size
    if (this.executionHistory.length > 10000) {
      this.executionHistory = this.executionHistory.slice(-5000);
    }
  }

  // Performance profiling with enhanced metrics
  startProfiling(): void {
    this.profilingData = {
      startTime: Date.now(),
      functionCalls: new Map(),
      lineExecutions: new Map(),
      memorySnapshots: []
    };
  }

  stopProfiling(): EnhancedProfileData {
    if (!this.profilingData) {
      return {
        totalTime: 0,
        functionCalls: [],
        hotspots: [],
        memoryLeaks: [],
        performanceBottlenecks: []
      };
    }
    
    const totalTime = Date.now() - this.profilingData.startTime;
    const functionCalls = Array.from(this.profilingData.functionCalls.entries())
      .map(([name, data]) => ({
        name,
        duration: data.totalTime,
        calls: data.calls,
        averageTime: data.totalTime / data.calls,
        minTime: data.minTime,
        maxTime: data.maxTime
      }))
      .sort((a, b) => b.duration - a.duration);
    
    const hotspots = this.identifyHotspots();
    const memoryLeaks = this.detectMemoryLeaks();
    const performanceBottlenecks = this.identifyBottlenecks();
    
    return {
      totalTime,
      functionCalls,
      hotspots,
      memoryLeaks,
      performanceBottlenecks
    };
  }

  // Identify code hotspots
  private identifyHotspots(): Hotspot[] {
    if (!this.profilingData) return [];
    
    const lineExecutions = Array.from(this.profilingData.lineExecutions.entries())
      .map(([line, count]) => ({ line, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return lineExecutions.map(({ line, count }) => ({
      location: line,
      executionCount: count,
      percentageOfTotal: (count / this.executionHistory.length) * 100
    }));
  }

  // Detect potential memory leaks
  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    // Check for growing collections
    this.variables.forEach((variable, name) => {
      if (Array.isArray(variable.value) && variable.value.length > 1000) {
        leaks.push({
          variableName: name,
          type: 'GrowingArray',
          size: variable.value.length,
          recommendation: 'Consider clearing or limiting array size'
        });
      }
    });
    
    return leaks;
  }

  // Identify performance bottlenecks
  private identifyBottlenecks(): PerformanceBottleneck[] {
    if (!this.profilingData) return [];
    
    const bottlenecks: PerformanceBottleneck[] = [];
    
    this.profilingData.functionCalls.forEach((data, name) => {
      if (data.maxTime > 1000) {
        bottlenecks.push({
          location: name,
          issue: 'SlowFunction',
          impact: 'high',
          recommendation: `Function ${name} takes ${data.maxTime}ms. Consider optimization.`
        });
      }
    });
    
    return bottlenecks;
  }

  // Enhanced state management
  getCurrentState(): EnhancedDebugState {
    return {
      mode: this.isRunning ? (this.isPaused ? 'break' : 'run') : 'design',
      currentLine: this.currentLine,
      currentFile: this.currentFile,
      variables: Object.fromEntries(
        Array.from(this.variables.entries()).map(([k, v]) => [k, v.value])
      ),
      callStack: [...this.callStack],
      breakpoints: new Set(Array.from(this.breakpoints.keys())),
      watchExpressions: Array.from(this.watchExpressions.values()),
      conditionalBreakpoints: Array.from(this.conditionalBreakpoints.values()),
      tracepoints: Array.from(this.tracepoints.values()),
      dataBreakpoints: Array.from(this.dataBreakpoints.values()),
      console: [...this.debugConsole],
      snapshots: Array.from(this.snapshots.keys()),
      executionHistory: this.getExecutionHistory(50)
    };
  }

  // Data breakpoint monitoring
  private async checkDataBreakpoints(): Promise<boolean> {
    for (const [id, dataBreakpoint] of this.dataBreakpoints) {
      if (!dataBreakpoint.enabled) continue;
      
      const currentValue = this.getVariableValue(dataBreakpoint.variableName);
      const changed = currentValue !== dataBreakpoint.lastValue;
      
      if (changed && 
          (dataBreakpoint.accessType === 'write' || 
           dataBreakpoint.accessType === 'readWrite')) {
        dataBreakpoint.lastValue = currentValue;
        this.logConsole('info', 
          `Data breakpoint hit: ${dataBreakpoint.variableName} changed to ${currentValue}`,
          'DataBreakpoint'
        );
        return true;
      }
    }
    
    return false;
  }

  // Override base methods with enhanced functionality
  async run(): Promise<void> {
    this.isRunning = true;
    this.isPaused = false;
    this.executionHistory = [];
    this.notifyStateChange();

    try {
      await this.executeCode();
    } catch (error) {
      await this.handleException(error);
    }
  }

  private async executeCode(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      // Check breakpoints
      if (await this.shouldBreak()) {
        this.isPaused = true;
        this.logConsole('info', `Breakpoint hit at ${this.currentFile}:${this.currentLine}`, 'Breakpoint');
        break;
      }
      
      // Check data breakpoints
      if (await this.checkDataBreakpoints()) {
        this.isPaused = true;
        break;
      }
      
      // Process tracepoints
      await this.processTracepoints();
      
      // Record execution
      this.recordExecutionStep();
      
      // Execute statement
      await this.executeNextStatement();

      // Allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private async executeNextStatement(): Promise<void> {
    // Update profiling data
    if (this.profilingData) {
      const line = `${this.currentFile}:${this.currentLine}`;
      this.profilingData.lineExecutions.set(
        line,
        (this.profilingData.lineExecutions.get(line) || 0) + 1
      );
    }
    
    // Execute statement
    this.currentLine++;
    
    // Check for procedure calls
    if (this.isFunction(this.currentLine)) {
      this.enterFunction();
    } else if (this.isReturn(this.currentLine)) {
      this.exitFunction();
    }
    
    this.evaluateCurrentLine();
  }

  // Clean up
  dispose(): void {
    this.stop();
    this.breakpoints.clear();
    this.conditionalBreakpoints.clear();
    this.tracepoints.clear();
    this.dataBreakpoints.clear();
    this.watchExpressions.clear();
    this.debugConsole = [];
    this.snapshots.clear();
    this.executionHistory = [];
  }
  
  // Private members from base class
  private profilingData?: ProfilingData;
  
  private createEvaluationContext(): EvaluationContext {
    const context: EvaluationContext = {};

    // Add current variables
    this.variables.forEach((variable, key) => {
      context[key] = variable.value;
    });

    // Add current frame variables
    if (this.currentFrame) {
      Object.entries(this.currentFrame.variables).forEach(([key, value]) => {
        context[key] = value;
      });
    }

    // Add VB6 built-in functions
    context.Len = (str: string) => str?.length || 0;
    context.Left = (str: string, n: number) => str?.substring(0, n) || '';
    context.Right = (str: string, n: number) => str?.substring(str.length - n) || '';
    context.Mid = (str: string, start: number, length?: number) =>
      str?.substring(start - 1, length ? start - 1 + length : undefined) || '';
    context.UCase = (str: string) => str?.toUpperCase() || '';
    context.LCase = (str: string) => str?.toLowerCase() || '';
    context.Val = (str: string) => parseFloat(str) || 0;
    context.Now = () => new Date();
    context.Date = () => new Date().toLocaleDateString();
    context.Time = () => new Date().toLocaleTimeString();
    context.Abs = Math.abs;
    context.Int = Math.floor;
    context.Round = Math.round;
    context.Sqr = Math.sqrt;
    context.IsNull = (val: DebugValue) => val === null;
    context.IsEmpty = (val: DebugValue) => val === undefined || val === '';
    context.IsNumeric = (val: DebugValue) => !isNaN(Number(val));
    context.TypeName = (val: DebugValue) => this.getVariableType(val);

    return context;
  }
  
  private notifyStateChange(): void {
    this.onStateChange(this.getCurrentState() as DebugState);
  }
  
  private evaluateCurrentLine(): void {
    // Update watches
    this.updateWatches();
    // Update variables
    this.updateVariables();
  }
  
  private updateWatches(): void {
    this.watchExpressions.forEach(watch => {
      this.evaluateWatch(watch);
    });
  }
  
  private async evaluateWatch(watch: WatchExpression): Promise<void> {
    try {
      watch.value = await this.evaluateExpression(watch.expression);
      watch.type = this.getVariableType(watch.value);
      delete watch.error;
    } catch (error) {
      watch.error = error.message;
      watch.value = '<Error>';
    }
  }
  
  private updateVariables(): void {
    // Simulate variable updates during execution
    if (this.currentFrame) {
      const varName = `var${this.currentLine}`;
      this.currentFrame.variables[varName] = this.currentLine;
      this.variables.set(varName, {
        name: varName,
        value: this.currentLine,
        type: 'Integer',
        scope: 'local',
        canEdit: true
      });
    }
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
    
    if (this.profilingData) {
      const funcData = this.profilingData.functionCalls.get(frame.procedure) || {
        calls: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        startTime: Date.now()
      };
      funcData.calls++;
      funcData.startTime = Date.now();
      this.profilingData.functionCalls.set(frame.procedure, funcData);
    }
  }
  
  private exitFunction(): void {
    const frame = this.callStack.pop();
    this.currentFrame = this.callStack[this.callStack.length - 1] || null;
    
    if (frame && this.profilingData) {
      const funcData = this.profilingData.functionCalls.get(frame.procedure);
      if (funcData && funcData.startTime) {
        const duration = Date.now() - funcData.startTime;
        funcData.totalTime += duration;
        funcData.minTime = Math.min(funcData.minTime, duration);
        funcData.maxTime = Math.max(funcData.maxTime, duration);
        delete funcData.startTime;
      }
    }
  }
  
  private isFunction(line: number): boolean {
    // Simple heuristic - in real implementation, this would parse the code
    return line % 10 === 0;
  }
  
  private isReturn(line: number): boolean {
    // Simple heuristic - in real implementation, this would parse the code
    return line % 15 === 0;
  }
  
  private getVariableValue(name: string): DebugValue {
    const variable = this.variables.get(name);
    if (variable) {
      return variable.value;
    }

    if (this.currentFrame && this.currentFrame.variables[name] !== undefined) {
      return this.currentFrame.variables[name];
    }

    return undefined;
  }
  
  // Additional public methods from base class
  setBreakpoint(file: string, line: number): void {
    const key = `${file}:${line}`;
    const breakpoint: Breakpoint = {
      id: key,
      file,
      line,
      enabled: true,
      type: 'breakpoint'
    };
    this.breakpoints.set(key, breakpoint);
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
      this.setBreakpoint(file, line);
    }
  }

  clearAllBreakpoints(): void {
    this.breakpoints.clear();
    this.conditionalBreakpoints.clear();
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

  pause(): void {
    this.isPaused = true;
    this.notifyStateChange();
  }

  continue(): void {
    this.isPaused = false;
    this.notifyStateChange();
    this.executeCode();
  }

  async step(): Promise<void> {
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
    this.hitCounts.clear();
    this.notifyStateChange();
  }

  setVariableValue(name: string, value: DebugValue): void {
    const variable = this.variables.get(name);
    if (variable) {
      variable.value = value;
      this.updateWatches();
      this.notifyStateChange();
    }
  }
}

// Additional interfaces
interface DataBreakpoint {
  id: string;
  variableName: string;
  accessType: 'read' | 'write' | 'readWrite';
  enabled: boolean;
  lastValue: DebugValue;
}

interface StepFilter {
  justMyCode?: boolean;
  modulePattern?: RegExp;
  excludePattern?: RegExp;
}

interface EnhancedDebugState extends DebugState {
  conditionalBreakpoints: Breakpoint[];
  tracepoints: Breakpoint[];
  dataBreakpoints: DataBreakpoint[];
  console: DebugConsoleMessage[];
  snapshots: string[];
  executionHistory: string[];
}

interface ProfilingData {
  startTime: number;
  functionCalls: Map<string, FunctionProfileData>;
  lineExecutions: Map<string, number>;
  memorySnapshots: MemorySnapshot[];
}

interface FunctionProfileData {
  calls: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  startTime?: number;
}

interface EnhancedProfileData {
  totalTime: number;
  functionCalls: Array<{
    name: string;
    duration: number;
    calls: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  }>;
  hotspots: Hotspot[];
  memoryLeaks: MemoryLeak[];
  performanceBottlenecks: PerformanceBottleneck[];
}

interface Hotspot {
  location: string;
  executionCount: number;
  percentageOfTotal: number;
}

interface MemoryLeak {
  variableName: string;
  type: string;
  size: number;
  recommendation: string;
}

interface PerformanceBottleneck {
  location: string;
  issue: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

// Export singleton factory
export function createAdvancedDebugger(
  onStateChange: (state: DebugState) => void,
  options?: Partial<DebuggerOptions>
): VB6AdvancedDebugger {
  return new VB6AdvancedDebugger(onStateChange, options);
}