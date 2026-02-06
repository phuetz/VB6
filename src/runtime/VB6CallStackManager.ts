/**
 * VB6 Call Stack Manager
 * Manages procedure call depth and prevents stack overflow
 *
 * Features:
 * - Tracks call depth for recursion prevention
 * - Maintains call stack for debugging
 * - Provides error context for runtime errors
 */

// ============================================================================
// Call Stack Types
// ============================================================================

export interface CallStackFrame {
  procedureName: string;
  moduleName: string;
  line: number;
  timestamp: number;
  arguments: Record<string, any>;
}

export interface CallStackError {
  message: string;
  stack: CallStackFrame[];
  depth: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_MAX_DEPTH = 1000;
const DEFAULT_MAX_STACK_SIZE = 10000;

// ============================================================================
// Call Stack Manager Class
// ============================================================================

export class VB6CallStackManager {
  private stack: CallStackFrame[] = [];
  private maxDepth: number = DEFAULT_MAX_DEPTH;
  private maxStackSize: number = DEFAULT_MAX_STACK_SIZE;
  private isEnabled: boolean = true;
  private onStackOverflow?: (error: CallStackError) => void;
  private onProcedureEnter?: (frame: CallStackFrame) => void;
  private onProcedureExit?: (frame: CallStackFrame) => void;

  constructor(options?: {
    maxDepth?: number;
    maxStackSize?: number;
    onStackOverflow?: (error: CallStackError) => void;
    onProcedureEnter?: (frame: CallStackFrame) => void;
    onProcedureExit?: (frame: CallStackFrame) => void;
  }) {
    if (options) {
      this.maxDepth = options.maxDepth || DEFAULT_MAX_DEPTH;
      this.maxStackSize = options.maxStackSize || DEFAULT_MAX_STACK_SIZE;
      this.onStackOverflow = options.onStackOverflow;
      this.onProcedureEnter = options.onProcedureEnter;
      this.onProcedureExit = options.onProcedureExit;
    }
  }

  /**
   * Enter a procedure - push frame onto stack
   */
  enter(
    procedureName: string,
    moduleName: string = 'Module1',
    line: number = 0,
    args: Record<string, any> = {}
  ): void {
    if (!this.isEnabled) return;

    // Check for stack overflow
    if (this.stack.length >= this.maxDepth) {
      const error: CallStackError = {
        message: `Stack overflow: Maximum recursion depth of ${this.maxDepth} exceeded`,
        stack: this.getStackCopy(),
        depth: this.stack.length,
      };

      if (this.onStackOverflow) {
        this.onStackOverflow(error);
      }

      throw new Error(error.message);
    }

    // Check for overall stack size limit
    if (this.stack.length >= this.maxStackSize) {
      // Trim old entries to prevent memory issues
      this.stack = this.stack.slice(-Math.floor(this.maxStackSize / 2));
    }

    const frame: CallStackFrame = {
      procedureName,
      moduleName,
      line,
      timestamp: Date.now(),
      arguments: { ...args },
    };

    this.stack.push(frame);

    if (this.onProcedureEnter) {
      this.onProcedureEnter(frame);
    }
  }

  /**
   * Exit a procedure - pop frame from stack
   */
  exit(): CallStackFrame | undefined {
    if (!this.isEnabled) return undefined;

    const frame = this.stack.pop();

    if (frame && this.onProcedureExit) {
      this.onProcedureExit(frame);
    }

    return frame;
  }

  /**
   * Get current call depth
   */
  getDepth(): number {
    return this.stack.length;
  }

  /**
   * Get current procedure name
   */
  getCurrentProcedure(): string | undefined {
    const frame = this.stack[this.stack.length - 1];
    return frame?.procedureName;
  }

  /**
   * Get current module name
   */
  getCurrentModule(): string | undefined {
    const frame = this.stack[this.stack.length - 1];
    return frame?.moduleName;
  }

  /**
   * Get full call stack for debugging
   */
  getStack(): ReadonlyArray<CallStackFrame> {
    return this.stack;
  }

  /**
   * Get copy of call stack
   */
  getStackCopy(): CallStackFrame[] {
    return [...this.stack];
  }

  /**
   * Get formatted stack trace string
   */
  getStackTrace(): string {
    if (this.stack.length === 0) {
      return '(empty stack)';
    }

    return this.stack
      .map((frame, index) => {
        const indent = '  '.repeat(index);
        const args = Object.entries(frame.arguments)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(', ');
        return `${indent}${frame.moduleName}.${frame.procedureName}(${args}) [Line ${frame.line}]`;
      })
      .join('\n');
  }

  /**
   * Get VB6-style error location
   */
  getErrorLocation(): string {
    const frame = this.stack[this.stack.length - 1];
    if (!frame) {
      return 'Unknown location';
    }
    return `${frame.moduleName}.${frame.procedureName}, Line ${frame.line}`;
  }

  /**
   * Clear call stack
   */
  clear(): void {
    this.stack = [];
  }

  /**
   * Enable/disable stack tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if stack tracking is enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set maximum recursion depth
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = Math.max(1, depth);
  }

  /**
   * Get maximum recursion depth
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }

  /**
   * Check if we're in a recursive call
   */
  isRecursive(procedureName: string, moduleName?: string): boolean {
    return this.stack.some(
      frame =>
        frame.procedureName === procedureName &&
        (moduleName === undefined || frame.moduleName === moduleName)
    );
  }

  /**
   * Count recursive calls to a procedure
   */
  getRecursionCount(procedureName: string, moduleName?: string): number {
    return this.stack.filter(
      frame =>
        frame.procedureName === procedureName &&
        (moduleName === undefined || frame.moduleName === moduleName)
    ).length;
  }

  /**
   * Get caller information (for debugging)
   */
  getCaller(): CallStackFrame | undefined {
    return this.stack[this.stack.length - 2];
  }

  /**
   * Find frame by procedure name
   */
  findFrame(procedureName: string): CallStackFrame | undefined {
    return this.stack.find(frame => frame.procedureName === procedureName);
  }

  /**
   * Export stack for serialization
   */
  export(): CallStackFrame[] {
    return this.getStackCopy();
  }

  /**
   * Import stack from serialization
   */
  import(frames: CallStackFrame[]): void {
    this.stack = frames.map(frame => ({ ...frame }));
  }
}

// ============================================================================
// Global Call Stack Instance
// ============================================================================

export const globalCallStack = new VB6CallStackManager({
  maxDepth: 1000,
  onStackOverflow: error => {
    console.error('[VB6 Runtime Error] Stack Overflow');
    console.error('Call Stack:');
    console.error(
      error.stack
        .slice(-20)
        .map(f => `  ${f.moduleName}.${f.procedureName}`)
        .join('\n')
    );
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Decorator for tracking procedure calls
 */
export function TrackProcedure(moduleName: string = 'Module1') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      globalCallStack.enter(propertyKey, moduleName, 0, {});
      try {
        return originalMethod.apply(this, args);
      } finally {
        globalCallStack.exit();
      }
    };

    return descriptor;
  };
}

/**
 * Wrap a function with call stack tracking
 */
export function withCallTracking<T extends (...args: any[]) => any>(
  fn: T,
  procedureName: string,
  moduleName: string = 'Module1'
): T {
  return function (...args: any[]) {
    globalCallStack.enter(procedureName, moduleName, 0, {});
    try {
      return fn(...args);
    } finally {
      globalCallStack.exit();
    }
  } as T;
}

/**
 * Execute with recursion limit
 */
export function withRecursionLimit<T>(
  fn: () => T,
  procedureName: string,
  maxDepth: number = 100
): T {
  const currentDepth = globalCallStack.getRecursionCount(procedureName);

  if (currentDepth >= maxDepth) {
    throw new Error(`Maximum recursion depth (${maxDepth}) exceeded for ${procedureName}`);
  }

  globalCallStack.enter(procedureName, 'Module1', 0, {});
  try {
    return fn();
  } finally {
    globalCallStack.exit();
  }
}

// ============================================================================
// VB6 Runtime Integration
// ============================================================================

/**
 * VB6-compatible procedure entry point
 */
export function ProcedureEnter(name: string, module: string = 'Module1', line: number = 0): void {
  globalCallStack.enter(name, module, line, {});
}

/**
 * VB6-compatible procedure exit point
 */
export function ProcedureExit(): void {
  globalCallStack.exit();
}

/**
 * Get current procedure for error messages
 */
export function GetCurrentProcedure(): string {
  return globalCallStack.getCurrentProcedure() || '(unknown)';
}

/**
 * Get current module for error messages
 */
export function GetCurrentModule(): string {
  return globalCallStack.getCurrentModule() || '(unknown)';
}

/**
 * Get formatted call stack for Err object
 */
export function GetCallStackString(): string {
  return globalCallStack.getStackTrace();
}

// ============================================================================
// Export
// ============================================================================

export default globalCallStack;
