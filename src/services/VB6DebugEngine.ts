import { EventEmitter } from 'events';

// Debug Event Types
export enum DebugEventType {
  Breakpoint = 'breakpoint',
  Step = 'step',
  Continue = 'continue',
  Stop = 'stop',
  Exception = 'exception',
  VariableChanged = 'variableChanged',
  CallStackChanged = 'callStackChanged'
}

// Debug States
export enum DebugState {
  NotStarted = 'not_started',
  Running = 'running',
  Paused = 'paused',
  Stopped = 'stopped',
  Error = 'error'
}

// Variable Types
export enum VariableType {
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  String = 'String',
  Boolean = 'Boolean',
  Date = 'Date',
  Object = 'Object',
  Variant = 'Variant',
  Array = 'Array',
  UserDefined = 'UserDefined'
}

// Variable Scope
export enum VariableScope {
  Local = 'Local',
  Module = 'Module',
  Global = 'Global',
  Static = 'Static'
}

// Breakpoint
export interface VB6Breakpoint {
  id: string;
  filename: string;
  line: number;
  column?: number;
  enabled: boolean;
  condition?: string;
  hitCount: number;
  temporary?: boolean;
}

// Variable
export interface VB6Variable {
  name: string;
  type: VariableType;
  value: any;
  scope: VariableScope;
  isArray: boolean;
  arrayBounds?: Array<{ lower: number; upper: number }>;
  members?: VB6Variable[];
  address?: string;
  size?: number;
}

// Call Stack Frame
export interface VB6CallStackFrame {
  functionName: string;
  filename: string;
  line: number;
  column: number;
  module: string;
  level: number;
  parameters: VB6Variable[];
  locals: VB6Variable[];
}

// Watch Expression
export interface VB6WatchExpression {
  id: string;
  expression: string;
  value: any;
  type: VariableType;
  isValid: boolean;
  error?: string;
}

// Exception Information
export interface VB6Exception {
  number: number;
  description: string;
  source: string;
  helpFile?: string;
  helpContext?: number;
  stack: VB6CallStackFrame[];
}

// Debug Session
export interface VB6DebugSession {
  id: string;
  state: DebugState;
  currentFrame: VB6CallStackFrame | null;
  callStack: VB6CallStackFrame[];
  variables: Map<string, VB6Variable>;
  watchExpressions: VB6WatchExpression[];
  breakpoints: Map<string, VB6Breakpoint>;
  exception?: VB6Exception;
  startTime: Date;
  pauseTime?: Date;
}

export class VB6DebugEngine extends EventEmitter {
  private static instance: VB6DebugEngine;
  private sessions: Map<string, VB6DebugSession> = new Map();
  private activeSessionId: string | null = null;
  private breakpointCounter = 0;
  private watchCounter = 0;
  
  // Runtime execution context
  private executionContext: {
    variables: Map<string, any>;
    callStack: string[];
    currentLine: number;
    currentFile: string;
    isRunning: boolean;
  } = {
    variables: new Map(),
    callStack: [],
    currentLine: 0,
    currentFile: '',
    isRunning: false
  };

  public static getInstance(): VB6DebugEngine {
    if (!VB6DebugEngine.instance) {
      VB6DebugEngine.instance = new VB6DebugEngine();
    }
    return VB6DebugEngine.instance;
  }

  // Session Management
  public createSession(): string {
    const sessionId = `session_${Date.now()}`;
    const session: VB6DebugSession = {
      id: sessionId,
      state: DebugState.NotStarted,
      currentFrame: null,
      callStack: [],
      variables: new Map(),
      watchExpressions: [],
      breakpoints: new Map(),
      startTime: new Date()
    };
    
    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    
    this.emit('sessionCreated', session);
    return sessionId;
  }

  public getActiveSession(): VB6DebugSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) || null;
  }

  public setActiveSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.emit('sessionChanged', sessionId);
      return true;
    }
    return false;
  }

  public destroySession(sessionId: string): boolean {
    if (this.sessions.delete(sessionId)) {
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
      }
      this.emit('sessionDestroyed', sessionId);
      return true;
    }
    return false;
  }

  // Breakpoint Management
  public addBreakpoint(filename: string, line: number, condition?: string): VB6Breakpoint {
    const session = this.getActiveSession();
    if (!session) throw new Error('No active debug session');

    const breakpoint: VB6Breakpoint = {
      id: `bp_${++this.breakpointCounter}`,
      filename,
      line,
      enabled: true,
      condition,
      hitCount: 0,
      temporary: false
    };

    session.breakpoints.set(breakpoint.id, breakpoint);
    this.emit('breakpointAdded', breakpoint);
    return breakpoint;
  }

  public removeBreakpoint(breakpointId: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const removed = session.breakpoints.delete(breakpointId);
    if (removed) {
      this.emit('breakpointRemoved', breakpointId);
    }
    return removed;
  }

  public toggleBreakpoint(breakpointId: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const breakpoint = session.breakpoints.get(breakpointId);
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      this.emit('breakpointToggled', breakpoint);
      return true;
    }
    return false;
  }

  public getBreakpoints(): VB6Breakpoint[] {
    const session = this.getActiveSession();
    if (!session) return [];
    return Array.from(session.breakpoints.values());
  }

  // Watch Expressions
  public addWatchExpression(expression: string): VB6WatchExpression {
    const session = this.getActiveSession();
    if (!session) throw new Error('No active debug session');

    const watch: VB6WatchExpression = {
      id: `watch_${++this.watchCounter}`,
      expression,
      value: null,
      type: VariableType.Variant,
      isValid: false
    };

    // Try to evaluate immediately
    this.evaluateWatchExpression(watch);
    
    session.watchExpressions.push(watch);
    this.emit('watchAdded', watch);
    return watch;
  }

  public removeWatchExpression(watchId: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const index = session.watchExpressions.findIndex(w => w.id === watchId);
    if (index >= 0) {
      session.watchExpressions.splice(index, 1);
      this.emit('watchRemoved', watchId);
      return true;
    }
    return false;
  }

  public updateWatchExpression(watchId: string, expression: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    const watch = session.watchExpressions.find(w => w.id === watchId);
    if (watch) {
      watch.expression = expression;
      this.evaluateWatchExpression(watch);
      this.emit('watchUpdated', watch);
      return true;
    }
    return false;
  }

  private evaluateWatchExpression(watch: VB6WatchExpression): void {
    try {
      // Simplified expression evaluation
      const value = this.evaluateExpression(watch.expression);
      watch.value = value;
      watch.type = this.inferType(value);
      watch.isValid = true;
      watch.error = undefined;
    } catch (error) {
      watch.value = null;
      watch.isValid = false;
      watch.error = error instanceof Error ? error.message : String(error);
    }
  }

  private evaluateExpression(expression: string): any {
    // Simple expression evaluator for VB6 syntax
    const trimmed = expression.trim();
    
    // Handle literals
    if (trimmed === 'True') return true;
    if (trimmed === 'False') return false;
    if (trimmed === 'Nothing') return null;
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    if (/^\d*\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    
    // Handle variables
    if (this.executionContext.variables.has(trimmed)) {
      return this.executionContext.variables.get(trimmed);
    }
    
    // Handle simple expressions
    if (trimmed.includes('+')) {
      const parts = trimmed.split('+').map(p => this.evaluateExpression(p.trim()));
      return parts.reduce((a, b) => a + b);
    }
    
    throw new Error(`Cannot evaluate expression: ${expression}`);
  }

  private inferType(value: any): VariableType {
    if (value === null || value === undefined) return VariableType.Variant;
    if (typeof value === 'boolean') return VariableType.Boolean;
    if (typeof value === 'string') return VariableType.String;
    if (typeof value === 'number') {
      return Number.isInteger(value) ? VariableType.Integer : VariableType.Double;
    }
    if (value instanceof Date) return VariableType.Date;
    if (Array.isArray(value)) return VariableType.Array;
    if (typeof value === 'object') return VariableType.Object;
    return VariableType.Variant;
  }

  // Variable Management
  public getVariables(scope?: VariableScope): VB6Variable[] {
    const session = this.getActiveSession();
    if (!session) return [];

    const variables: VB6Variable[] = [];
    
    // Get variables from current context
    this.executionContext.variables.forEach((value, name) => {
      const variable: VB6Variable = {
        name,
        type: this.inferType(value),
        value,
        scope: VariableScope.Local, // Simplified
        isArray: Array.isArray(value)
      };
      
      if (variable.isArray) {
        variable.arrayBounds = [{ lower: 0, upper: (value as any[]).length - 1 }];
      }
      
      variables.push(variable);
    });

    return scope ? variables.filter(v => v.scope === scope) : variables;
  }

  public setVariable(name: string, value: any): boolean {
    this.executionContext.variables.set(name, value);
    this.emit('variableChanged', { name, value });
    return true;
  }

  // Call Stack Management
  public getCallStack(): VB6CallStackFrame[] {
    const session = this.getActiveSession();
    if (!session) return [];
    return session.callStack;
  }

  private updateCallStack(): void {
    const session = this.getActiveSession();
    if (!session) return;

    // Build call stack from execution context
    const frames: VB6CallStackFrame[] = [];
    
    this.executionContext.callStack.forEach((functionName, index) => {
      const frame: VB6CallStackFrame = {
        functionName,
        filename: this.executionContext.currentFile,
        line: this.executionContext.currentLine,
        column: 1,
        module: 'Module1', // Simplified
        level: index,
        parameters: [],
        locals: this.getVariables(VariableScope.Local)
      };
      frames.push(frame);
    });

    session.callStack = frames;
    session.currentFrame = frames[0] || null;
    this.emit('callStackChanged', frames);
  }

  // Execution Control
  public startDebug(filename: string): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    session.state = DebugState.Running;
    this.executionContext.isRunning = true;
    this.executionContext.currentFile = filename;
    this.executionContext.currentLine = 1;
    
    this.emit('debugStarted', session);
    return true;
  }

  public pauseDebug(): boolean {
    const session = this.getActiveSession();
    if (!session || session.state !== DebugState.Running) return false;

    session.state = DebugState.Paused;
    session.pauseTime = new Date();
    this.executionContext.isRunning = false;
    
    this.updateCallStack();
    this.updateWatchExpressions();
    
    this.emit('debugPaused', session);
    return true;
  }

  public continueDebug(): boolean {
    const session = this.getActiveSession();
    if (!session || session.state !== DebugState.Paused) return false;

    session.state = DebugState.Running;
    session.pauseTime = undefined;
    this.executionContext.isRunning = true;
    
    this.emit('debugContinued', session);
    return true;
  }

  public stopDebug(): boolean {
    const session = this.getActiveSession();
    if (!session) return false;

    session.state = DebugState.Stopped;
    this.executionContext.isRunning = false;
    this.executionContext.callStack = [];
    this.executionContext.variables.clear();
    
    this.emit('debugStopped', session);
    return true;
  }

  public stepOver(): boolean {
    const session = this.getActiveSession();
    if (!session || session.state !== DebugState.Paused) return false;

    this.executionContext.currentLine++;
    this.updateCallStack();
    this.updateWatchExpressions();
    
    this.emit('stepOver', this.executionContext.currentLine);
    return true;
  }

  public stepInto(): boolean {
    const session = this.getActiveSession();
    if (!session || session.state !== DebugState.Paused) return false;

    // Simulate stepping into a function
    this.executionContext.callStack.push('NewFunction');
    this.executionContext.currentLine++;
    this.updateCallStack();
    this.updateWatchExpressions();
    
    this.emit('stepInto', this.executionContext.currentLine);
    return true;
  }

  public stepOut(): boolean {
    const session = this.getActiveSession();
    if (!session || session.state !== DebugState.Paused) return false;

    if (this.executionContext.callStack.length > 0) {
      this.executionContext.callStack.pop();
    }
    this.executionContext.currentLine++;
    this.updateCallStack();
    this.updateWatchExpressions();
    
    this.emit('stepOut', this.executionContext.currentLine);
    return true;
  }

  // Exception Handling
  public handleException(exception: Partial<VB6Exception>): void {
    const session = this.getActiveSession();
    if (!session) return;

    const fullException: VB6Exception = {
      number: exception.number || 0,
      description: exception.description || 'Unknown error',
      source: exception.source || 'VB6Runtime',
      helpFile: exception.helpFile,
      helpContext: exception.helpContext,
      stack: session.callStack
    };

    session.exception = fullException;
    session.state = DebugState.Error;
    
    this.emit('exception', fullException);
  }

  private updateWatchExpressions(): void {
    const session = this.getActiveSession();
    if (!session) return;

    session.watchExpressions.forEach(watch => {
      this.evaluateWatchExpression(watch);
    });
    
    this.emit('watchExpressionsUpdated', session.watchExpressions);
  }

  // Utility Methods
  public getCurrentLine(): number {
    return this.executionContext.currentLine;
  }

  public getCurrentFile(): string {
    return this.executionContext.currentFile;
  }

  public isRunning(): boolean {
    return this.executionContext.isRunning;
  }

  public simulateExecution(filename: string, lineNumber: number): void {
    this.executionContext.currentFile = filename;
    this.executionContext.currentLine = lineNumber;
    
    // Check for breakpoints
    const session = this.getActiveSession();
    if (session) {
      const breakpoint = Array.from(session.breakpoints.values()).find(
        bp => bp.enabled && bp.filename === filename && bp.line === lineNumber
      );
      
      if (breakpoint) {
        breakpoint.hitCount++;
        
        // Check condition if present
        if (breakpoint.condition) {
          try {
            const conditionResult = this.evaluateExpression(breakpoint.condition);
            if (!conditionResult) return;
          } catch {
            // Condition evaluation failed, break anyway
          }
        }
        
        this.pauseDebug();
        this.emit('breakpointHit', breakpoint);
      }
    }
  }

  // Mock data for testing
  public initializeMockData(): void {
    this.setVariable('intCounter', 42);
    this.setVariable('strMessage', 'Hello World');
    this.setVariable('blnFlag', true);
    this.setVariable('arrNumbers', [1, 2, 3, 4, 5]);
    this.setVariable('objForm', { Name: 'Form1', Caption: 'My Form' });
    
    this.executionContext.callStack = ['Main', 'Form_Load', 'cmdButton_Click'];
    this.updateCallStack();
  }
}

export default VB6DebugEngine;