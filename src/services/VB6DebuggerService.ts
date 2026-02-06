// VB6 Debugger Service
// Provides debugging capabilities including breakpoints, stepping, watch expressions, and call stack

import { vb6Compiler } from './VB6Compiler';
import { vb6Runtime } from '../runtime/VB6Runtime';
import {
  DebugValue,
  DebugEventData,
  ExecutionContext,
  EventListener,
} from './types/VB6ServiceTypes';

// Debugger interfaces
export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  condition?: string;
  hitCount?: number;
  enabled: boolean;
  temporary?: boolean;
  logMessage?: string;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: DebugValue;
  type?: string;
  error?: string;
  expandable?: boolean;
  children?: WatchExpression[];
}

export interface CallStackFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column?: number;
  scope: VariableScope;
  isUserCode: boolean;
}

export interface VariableScope {
  locals: Variable[];
  globals: Variable[];
  module: Variable[];
  this?: Variable;
}

export interface Variable {
  name: string;
  value: DebugValue;
  type: string;
  readable: boolean;
  writable: boolean;
  expandable?: boolean;
  children?: Variable[];
}

export interface DebuggerState {
  status: 'idle' | 'running' | 'paused' | 'stepping' | 'evaluating';
  currentFile?: string;
  currentLine?: number;
  currentColumn?: number;
  breakpoints: Breakpoint[];
  watchExpressions: WatchExpression[];
  callStack: CallStackFrame[];
  currentFrame?: string;
  exception?: {
    message: string;
    type: string;
    stackTrace: string;
  };
}

export enum StepType {
  Into = 'stepInto',
  Over = 'stepOver',
  Out = 'stepOut',
  Continue = 'continue',
}

// Debug events
export interface DebugEvent {
  type: 'breakpoint' | 'step' | 'exception' | 'output' | 'statusChanged';
  data: DebugEventData;
  timestamp: Date;
}

// Browser-compatible EventEmitter
class DebugEventEmitter {
  private listeners: { [event: string]: EventListener[] } = {};

  on(event: string, callback: EventListener): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: EventListener): void {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  emit(event: string, data: DebugEventData): void {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Debug event listener error:', error);
      }
    });
  }
}

// Main Debugger Service
export class VB6DebuggerService {
  private static instance: VB6DebuggerService;
  private events = new DebugEventEmitter();
  private state: DebuggerState = {
    status: 'idle',
    breakpoints: [],
    watchExpressions: [],
    callStack: [],
  };

  // Execution context
  private executionContext: ExecutionContext | null = null;
  private sourceMap: Map<string, string[]> = new Map(); // file -> lines
  private pauseOnNextStatement = false;
  private stepDepth = 0;
  private targetStepDepth = 0;

  // Performance monitoring
  private executionStartTime: number = 0;
  private statementCount: number = 0;
  private breakpointHits: Map<string, number> = new Map();

  static getInstance(): VB6DebuggerService {
    if (!VB6DebuggerService.instance) {
      VB6DebuggerService.instance = new VB6DebuggerService();
    }
    return VB6DebuggerService.instance;
  }

  // Event handling
  on(event: string, callback: (...args: any[]) => any): void {
    this.events.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => any): void {
    this.events.off(event, callback);
  }

  // Breakpoint management
  addBreakpoint(file: string, line: number, options?: Partial<Breakpoint>): Breakpoint {
    const breakpoint: Breakpoint = {
      id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      line,
      enabled: true,
      hitCount: 0,
      ...options,
    };

    this.state.breakpoints.push(breakpoint);
    this.emitEvent('breakpoint', { action: 'added', breakpoint });

    return breakpoint;
  }

  removeBreakpoint(id: string): boolean {
    const index = this.state.breakpoints.findIndex(bp => bp.id === id);
    if (index >= 0) {
      const breakpoint = this.state.breakpoints[index];
      this.state.breakpoints.splice(index, 1);
      this.emitEvent('breakpoint', { action: 'removed', breakpoint });
      return true;
    }
    return false;
  }

  updateBreakpoint(id: string, updates: Partial<Breakpoint>): boolean {
    const breakpoint = this.state.breakpoints.find(bp => bp.id === id);
    if (breakpoint) {
      Object.assign(breakpoint, updates);
      this.emitEvent('breakpoint', { action: 'updated', breakpoint });
      return true;
    }
    return false;
  }

  toggleBreakpoint(id: string): boolean {
    const breakpoint = this.state.breakpoints.find(bp => bp.id === id);
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      this.emitEvent('breakpoint', { action: 'toggled', breakpoint });
      return true;
    }
    return false;
  }

  getBreakpoints(file?: string): Breakpoint[] {
    if (file) {
      return this.state.breakpoints.filter(bp => bp.file === file);
    }
    return [...this.state.breakpoints];
  }

  clearAllBreakpoints(): void {
    this.state.breakpoints = [];
    this.emitEvent('breakpoint', { action: 'clearedAll' });
  }

  // Watch expressions
  addWatch(expression: string): WatchExpression {
    const watch: WatchExpression = {
      id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expression,
    };

    this.state.watchExpressions.push(watch);
    this.evaluateWatch(watch);
    this.emitEvent('watch', { action: 'added', watch });

    return watch;
  }

  removeWatch(id: string): boolean {
    const index = this.state.watchExpressions.findIndex(w => w.id === id);
    if (index >= 0) {
      const watch = this.state.watchExpressions[index];
      this.state.watchExpressions.splice(index, 1);
      this.emitEvent('watch', { action: 'removed', watch });
      return true;
    }
    return false;
  }

  updateWatch(id: string, expression: string): boolean {
    const watch = this.state.watchExpressions.find(w => w.id === id);
    if (watch) {
      watch.expression = expression;
      this.evaluateWatch(watch);
      this.emitEvent('watch', { action: 'updated', watch });
      return true;
    }
    return false;
  }

  private evaluateWatch(watch: WatchExpression): void {
    if (this.state.status === 'paused' && this.executionContext) {
      try {
        // Create evaluation context with current scope
        const evalContext = this.createEvaluationContext();
        const result = this.evaluateExpression(watch.expression, evalContext);

        watch.value = result.value;
        watch.type = result.type;
        watch.error = undefined;
        watch.expandable = this.isExpandable(result.value);

        if (watch.expandable) {
          watch.children = this.expandValue(result.value);
        }
      } catch (error: any) {
        watch.error = error.message;
        watch.value = undefined;
        watch.type = undefined;
      }
    } else {
      watch.error = 'Not available';
      watch.value = undefined;
      watch.type = undefined;
    }
  }

  evaluateAllWatches(): void {
    this.state.watchExpressions.forEach(watch => this.evaluateWatch(watch));
    this.emitEvent('watch', { action: 'evaluatedAll' });
  }

  // Execution control
  async start(code: string, file: string = 'main.vb'): Promise<void> {
    try {
      this.updateStatus('running');
      this.executionStartTime = Date.now();
      this.statementCount = 0;

      // Compile with debug info
      const compiled = await vb6Compiler.compile(code, {
        debug: true,
        sourceMap: true,
        instrumentCode: true,
      });

      // Store source map
      this.sourceMap.set(file, code.split('\n'));

      // Create execution context with debug hooks
      this.executionContext = this.createExecutionContext(compiled, file);

      // Execute
      await this.executeCode(compiled.code);

      this.updateStatus('idle');
    } catch (error: any) {
      this.handleException(error);
    }
  }

  pause(): void {
    if (this.state.status === 'running') {
      this.pauseOnNextStatement = true;
      this.updateStatus('paused');
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.pauseOnNextStatement = false;
      this.updateStatus('running');
      this.continueExecution();
    }
  }

  async step(type: StepType): Promise<void> {
    if (this.state.status !== 'paused') return;

    this.updateStatus('stepping');

    switch (type) {
      case StepType.Into:
        this.pauseOnNextStatement = true;
        break;

      case StepType.Over:
        this.targetStepDepth = this.stepDepth;
        this.pauseOnNextStatement = false;
        break;

      case StepType.Out:
        this.targetStepDepth = Math.max(0, this.stepDepth - 1);
        this.pauseOnNextStatement = false;
        break;

      case StepType.Continue:
        this.pauseOnNextStatement = false;
        break;
    }

    this.continueExecution();
  }

  stop(): void {
    this.executionContext = null;
    this.updateStatus('idle');
    this.state.callStack = [];
    this.state.currentFile = undefined;
    this.state.currentLine = undefined;
    this.emitEvent('statusChanged', { status: 'stopped' });
  }

  // Call stack management
  getCallStack(): CallStackFrame[] {
    return [...this.state.callStack];
  }

  selectStackFrame(frameId: string): void {
    const frame = this.state.callStack.find(f => f.id === frameId);
    if (frame) {
      this.state.currentFrame = frameId;
      this.state.currentFile = frame.file;
      this.state.currentLine = frame.line;
      this.evaluateAllWatches();
      this.emitEvent('stackFrame', { action: 'selected', frame });
    }
  }

  // Variable inspection
  getVariables(frameId?: string): VariableScope {
    const frame = frameId
      ? this.state.callStack.find(f => f.id === frameId)
      : this.state.callStack[0];

    if (!frame) {
      return { locals: [], globals: [], module: [] };
    }

    return frame.scope;
  }

  async evaluateExpression(expression: string, frameId?: string): Promise<any> {
    if (this.state.status !== 'paused') {
      throw new Error('Debugger must be paused to evaluate expressions');
    }

    const frame = frameId
      ? this.state.callStack.find(f => f.id === frameId)
      : this.state.callStack[0];

    if (!frame) {
      throw new Error('No active stack frame');
    }

    const context = this.createEvaluationContext(frame);
    return this.evaluateInContext(expression, context);
  }

  // Private methods
  private createExecutionContext(compiled: any, file: string): any {
    return {
      ...this.executionContext,
      __debug: {
        onStatement: (line: number, column?: number) => {
          this.handleStatement(file, line, column);
        },
        onFunctionEnter: (name: string, args: any[]) => {
          this.handleFunctionEnter(name, file, args);
        },
        onFunctionExit: (name: string, returnValue: any) => {
          this.handleFunctionExit(name, returnValue);
        },
        onException: (error: any) => {
          this.handleException(error);
        },
      },
    };
  }

  private handleStatement(file: string, line: number, column?: number): void {
    this.statementCount++;
    this.state.currentFile = file;
    this.state.currentLine = line;
    this.state.currentColumn = column;

    // Check breakpoints
    const breakpoint = this.checkBreakpoint(file, line);
    if (breakpoint) {
      this.handleBreakpointHit(breakpoint);
      return;
    }

    // Check step conditions
    if (this.shouldPause()) {
      this.pauseExecution('step');
    }
  }

  private checkBreakpoint(file: string, line: number): Breakpoint | null {
    const breakpoints = this.state.breakpoints.filter(
      bp => bp.enabled && bp.file === file && bp.line === line
    );

    for (const bp of breakpoints) {
      // Check condition if present
      if (bp.condition) {
        try {
          const context = this.createEvaluationContext();
          const result = this.evaluateInContext(bp.condition, context);
          if (!result.value) continue;
        } catch {
          continue;
        }
      }

      // Update hit count
      bp.hitCount = (bp.hitCount || 0) + 1;
      this.breakpointHits.set(bp.id, bp.hitCount);

      // Check if it's a log point
      if (bp.logMessage) {
        this.logBreakpointMessage(bp);
        if (!bp.temporary) continue;
      }

      return bp;
    }

    return null;
  }

  private handleBreakpointHit(breakpoint: Breakpoint): void {
    // Remove if temporary
    if (breakpoint.temporary) {
      this.removeBreakpoint(breakpoint.id);
    }

    this.pauseExecution('breakpoint', breakpoint);
  }

  private shouldPause(): boolean {
    if (this.pauseOnNextStatement) return true;

    if (this.state.status === 'stepping') {
      if (this.stepDepth <= this.targetStepDepth) {
        return true;
      }
    }

    return false;
  }

  private pauseExecution(reason: string, data?: any): void {
    this.updateStatus('paused');
    this.updateCallStack();
    this.evaluateAllWatches();

    this.emitEvent('paused', {
      reason,
      data,
      file: this.state.currentFile,
      line: this.state.currentLine,
      callStack: this.state.callStack,
    });
  }

  private continueExecution(): void {
    // Resume execution - implementation depends on runtime integration
    this.updateStatus('running');
  }

  private handleFunctionEnter(name: string, file: string, args: any[]): void {
    this.stepDepth++;

    const frame: CallStackFrame = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      file,
      line: this.state.currentLine || 1,
      scope: this.captureScope(args),
      isUserCode: true,
    };

    this.state.callStack.unshift(frame);
    this.emitEvent('callStack', { action: 'push', frame });
  }

  private handleFunctionExit(name: string, returnValue: any): void {
    this.stepDepth = Math.max(0, this.stepDepth - 1);

    if (this.state.callStack.length > 0) {
      const frame = this.state.callStack.shift();
      this.emitEvent('callStack', { action: 'pop', frame, returnValue });
    }
  }

  private handleException(error: any): void {
    this.state.exception = {
      message: error.message || String(error),
      type: error.name || 'Error',
      stackTrace: error.stack || '',
    };

    this.pauseExecution('exception', this.state.exception);
    this.emitEvent('exception', this.state.exception);
  }

  private updateCallStack(): void {
    // Update call stack from execution context
    // This would integrate with the VB6 runtime to get actual stack info
  }

  private captureScope(args: any[]): VariableScope {
    // Capture current variable scope
    const locals: Variable[] = [];
    const globals: Variable[] = [];
    const module: Variable[] = [];

    // Add function arguments
    args.forEach((arg, index) => {
      locals.push(this.createVariable(`arg${index}`, arg));
    });

    // Add local variables from execution context
    if (this.executionContext) {
      // Integration with VB6 runtime to get variables
    }

    return { locals, globals, module };
  }

  private createVariable(name: string, value: any): Variable {
    const type = this.getValueType(value);
    return {
      name,
      value: this.formatValue(value),
      type,
      readable: true,
      writable: true,
      expandable: this.isExpandable(value),
      children: this.isExpandable(value) ? this.expandValue(value) : undefined,
    };
  }

  private getValueType(value: any): string {
    if (value === null) return 'Nothing';
    if (value === undefined) return 'Empty';
    if (typeof value === 'boolean') return 'Boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Integer' : 'Double';
    }
    if (typeof value === 'string') return 'String';
    if (value instanceof Date) return 'Date';
    if (Array.isArray(value)) return 'Array';
    if (typeof value === 'object') return 'Object';
    return 'Variant';
  }

  private formatValue(value: any): string {
    if (value === null) return 'Nothing';
    if (value === undefined) return 'Empty';
    if (typeof value === 'string') return `"${value}"`;
    if (value instanceof Date) return value.toLocaleString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return `Object {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    }
    return String(value);
  }

  private isExpandable(value: any): boolean {
    return (
      value !== null && value !== undefined && (Array.isArray(value) || typeof value === 'object')
    );
  }

  private expandValue(value: any): Variable[] {
    const children: Variable[] = [];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        children.push(this.createVariable(`[${index}]`, item));
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        children.push(this.createVariable(key, val));
      });
    }

    return children;
  }

  private createEvaluationContext(frame?: CallStackFrame): any {
    const context: any = {};

    if (frame) {
      // Add variables from scope
      frame.scope.locals.forEach(v => {
        context[v.name] = v.value;
      });
      frame.scope.globals.forEach(v => {
        context[v.name] = v.value;
      });
    }

    // Add VB6 runtime functions
    Object.assign(context, vb6Runtime);

    return context;
  }

  private evaluateInContext(expression: string, context: any): any {
    try {
      // Safe evaluation using Function constructor
      const func = new Function(...Object.keys(context), `return (${expression})`);
      const value = func(...Object.values(context));

      return {
        value,
        type: this.getValueType(value),
      };
    } catch (error: any) {
      throw new Error(`Evaluation error: ${error.message}`);
    }
  }

  private logBreakpointMessage(breakpoint: Breakpoint): void {
    if (!breakpoint.logMessage) return;

    let message = breakpoint.logMessage;

    // Replace expressions in {} with evaluated values
    const context = this.createEvaluationContext();
    message = message.replace(/\{([^}]+)\}/g, (match, expr) => {
      try {
        const result = this.evaluateInContext(expr, context);
        return String(result.value);
      } catch {
        return match;
      }
    });

    this.emitEvent('output', {
      type: 'logpoint',
      message,
      timestamp: new Date(),
      location: `${breakpoint.file}:${breakpoint.line}`,
    });
  }

  private updateStatus(status: DebuggerState['status']): void {
    const oldStatus = this.state.status;
    this.state.status = status;

    if (oldStatus !== status) {
      this.emitEvent('statusChanged', { oldStatus, newStatus: status });
    }
  }

  private emitEvent(type: string, data: any): void {
    const event: DebugEvent = {
      type: type as any,
      data,
      timestamp: new Date(),
    };

    this.events.emit(type, event);
    this.events.emit('debug', event); // Global debug event
  }

  private async executeCode(code: string): Promise<void> {
    // Execute instrumented code with debug hooks
    // This would integrate with the VB6 runtime
    try {
      const func = new Function('context', code);
      await func(this.executionContext);
    } catch (error) {
      this.handleException(error);
    }
  }

  // Public API for UI
  getState(): DebuggerState {
    return { ...this.state };
  }

  getSourceLines(file: string): string[] {
    return this.sourceMap.get(file) || [];
  }

  getExecutionStats(): any {
    const elapsed = this.executionStartTime ? Date.now() - this.executionStartTime : 0;

    return {
      elapsedTime: elapsed,
      statementCount: this.statementCount,
      statementsPerSecond: elapsed > 0 ? (this.statementCount / elapsed) * 1000 : 0,
      breakpointHits: Object.fromEntries(this.breakpointHits),
    };
  }
}

// Export singleton instance
export const vb6Debugger = VB6DebuggerService.getInstance();
