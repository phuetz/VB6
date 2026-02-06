/**
 * VB6 Debug Object Implementation
 * Complete Debug.Print and Debug.Assert functionality
 */

// Debug output target
export enum DebugOutputTarget {
  Console = 'console',
  ImmediateWindow = 'immediate',
  File = 'file',
  Custom = 'custom',
}

// Debug output entry
export interface DebugEntry {
  timestamp: number;
  message: string;
  type: 'print' | 'assert' | 'error' | 'warning';
  source?: string;
  lineNumber?: number;
  stackTrace?: string;
}

// Debug configuration
export interface DebugConfig {
  enabled: boolean;
  outputTarget: DebugOutputTarget;
  maxHistorySize: number;
  includeTimestamp: boolean;
  includeStackTrace: boolean;
  logToFile?: string;
  customHandler?: (entry: DebugEntry) => void;
}

/**
 * VB6 Debug Object
 * Provides Debug.Print and Debug.Assert functionality
 */
export class VB6Debug {
  private static instance: VB6Debug;
  private history: DebugEntry[] = [];
  private outputHandlers: Map<DebugOutputTarget, (entry: DebugEntry) => void> = new Map();
  private immediateWindowCallback?: (text: string) => void;
  private fileHandle?: any;
  private assertionsEnabled: boolean = true;
  private printSeparator: string = ' ';
  private config: DebugConfig = {
    enabled: true,
    outputTarget: DebugOutputTarget.Console,
    maxHistorySize: 1000,
    includeTimestamp: true,
    includeStackTrace: false,
  };

  private constructor() {
    this.setupOutputHandlers();
  }

  static getInstance(): VB6Debug {
    if (!VB6Debug.instance) {
      VB6Debug.instance = new VB6Debug();
    }
    return VB6Debug.instance;
  }

  /**
   * Debug.Print - Output text to debug console
   * Supports multiple arguments and formatting
   */
  print(...args: any[]): void {
    if (!this.config.enabled) return;

    // Convert arguments to strings
    const parts = args.map(arg => this.formatValue(arg));
    const message = parts.join(this.printSeparator);

    // Create debug entry
    const entry: DebugEntry = {
      timestamp: Date.now(),
      message,
      type: 'print',
      source: this.getCallerInfo(),
      lineNumber: this.getCallerLineNumber(),
    };

    if (this.config.includeStackTrace) {
      entry.stackTrace = this.getStackTrace();
    }

    // Add to history
    this.addToHistory(entry);

    // Output to target
    this.output(entry);
  }

  /**
   * Debug.Assert - Assert a condition and break if false
   */
  assert(condition: boolean, message?: string): void {
    if (!this.assertionsEnabled || !this.config.enabled) return;

    if (!condition) {
      const assertMessage = message || 'Assertion failed';

      // Create assert entry
      const entry: DebugEntry = {
        timestamp: Date.now(),
        message: `ASSERT: ${assertMessage}`,
        type: 'assert',
        source: this.getCallerInfo(),
        lineNumber: this.getCallerLineNumber(),
        stackTrace: this.getStackTrace(),
      };

      // Add to history
      this.addToHistory(entry);

      // Output to target
      this.output(entry);

      // In debug mode, trigger debugger
      if (
        typeof window !== 'undefined' &&
        window.confirm(`Assertion Failed: ${assertMessage}\n\nBreak into debugger?`)
      ) {
        // eslint-disable-next-line no-debugger
        debugger;
      }
    }
  }

  /**
   * Clear debug output
   */
  clear(): void {
    this.history = [];

    // Clear immediate window if connected
    if (this.immediateWindowCallback) {
      this.immediateWindowCallback('[Clear]');
    }

    // Clear console
    if (this.config.outputTarget === DebugOutputTarget.Console && typeof console !== 'undefined') {
      console.clear();
    }
  }

  /**
   * Get debug history
   */
  getHistory(): DebugEntry[] {
    return [...this.history];
  }

  /**
   * Set configuration
   */
  configure(config: Partial<DebugConfig>): void {
    Object.assign(this.config, config);

    // Update file handle if needed
    if (config.logToFile && config.logToFile !== this.config.logToFile) {
      this.openLogFile(config.logToFile);
    }
  }

  /**
   * Connect to Immediate Window
   */
  connectImmediateWindow(callback: (text: string) => void): void {
    this.immediateWindowCallback = callback;
    this.config.outputTarget = DebugOutputTarget.ImmediateWindow;
  }

  /**
   * Disconnect from Immediate Window
   */
  disconnectImmediateWindow(): void {
    this.immediateWindowCallback = undefined;
    this.config.outputTarget = DebugOutputTarget.Console;
  }

  /**
   * Enable/disable assertions
   */
  setAssertionsEnabled(enabled: boolean): void {
    this.assertionsEnabled = enabled;
  }

  /**
   * Set print separator (space, tab, comma, semicolon)
   */
  setPrintSeparator(separator: string): void {
    this.printSeparator = separator;
  }

  /**
   * VB6-style formatting with zones
   * Semicolon (;) = no space, Comma (,) = tab to next zone
   */
  printWithFormat(format: string, ...args: any[]): void {
    if (!this.config.enabled) return;

    let output = '';
    let argIndex = 0;
    let zone = 0;
    const zoneWidth = 14; // VB6 default zone width

    for (let i = 0; i < format.length; i++) {
      const char = format[i];

      if (char === '?' && argIndex < args.length) {
        // Replace ? with argument
        output += this.formatValue(args[argIndex++]);
      } else if (char === ';') {
        // Semicolon - no spacing
        continue;
      } else if (char === ',') {
        // Comma - advance to next print zone
        zone++;
        const currentLength = output.length;
        const targetLength = zone * zoneWidth;
        output = output.padEnd(targetLength, ' ');
      } else if (char === '\t') {
        // Tab character
        output += '\t';
      } else {
        output += char;
      }
    }

    // Add remaining arguments
    while (argIndex < args.length) {
      output += ' ' + this.formatValue(args[argIndex++]);
    }

    this.print(output);
  }

  /**
   * Print with timestamp
   */
  printWithTime(...args: any[]): void {
    const timestamp = new Date().toISOString();
    this.print(`[${timestamp}]`, ...args);
  }

  /**
   * Print object properties (like VB6 Debug.Print for objects)
   */
  printObject(obj: any, indent: number = 0): void {
    if (!this.config.enabled) return;

    const spaces = ' '.repeat(indent * 2);

    if (obj === null || obj === undefined) {
      this.print(spaces + String(obj));
      return;
    }

    if (typeof obj !== 'object') {
      this.print(spaces + this.formatValue(obj));
      return;
    }

    // Print object type
    const typeName = obj.constructor?.name || 'Object';
    this.print(spaces + `${typeName} {`);

    // Print properties
    for (const key in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          this.print(spaces + `  ${key}:`);
          this.printObject(value, indent + 2);
        } else {
          this.print(spaces + `  ${key}: ${this.formatValue(value)}`);
        }
      }
    }

    this.print(spaces + '}');
  }

  /**
   * Print array contents
   */
  printArray(arr: any[], name?: string): void {
    if (!this.config.enabled) return;

    const header = name ? `${name}(${arr.length})` : `Array(${arr.length})`;
    this.print(header);

    arr.forEach((item, index) => {
      this.print(`  [${index}] = ${this.formatValue(item)}`);
    });
  }

  /**
   * Print table (2D array)
   */
  printTable(data: any[][], headers?: string[]): void {
    if (!this.config.enabled) return;

    if (headers) {
      this.print(headers.join('\t'));
      this.print('-'.repeat(headers.join('\t').length));
    }

    data.forEach(row => {
      this.print(row.map(cell => this.formatValue(cell)).join('\t'));
    });
  }

  private formatValue(value: any): string {
    if (value === null) return 'Null';
    if (value === undefined) return 'Nothing';
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private addToHistory(entry: DebugEntry): void {
    this.history.push(entry);

    // Trim history if needed
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }
  }

  private output(entry: DebugEntry): void {
    const handler = this.outputHandlers.get(this.config.outputTarget);
    if (handler) {
      handler(entry);
    }

    // Custom handler
    if (this.config.customHandler) {
      this.config.customHandler(entry);
    }
  }

  private setupOutputHandlers(): void {
    // Console handler
    this.outputHandlers.set(DebugOutputTarget.Console, entry => {
      if (typeof console === 'undefined') return;

      const prefix = this.config.includeTimestamp
        ? `[${new Date(entry.timestamp).toLocaleTimeString()}] `
        : '';

      switch (entry.type) {
        case 'assert':
          console.error(prefix + entry.message);
          if (entry.stackTrace) console.error(entry.stackTrace);
          break;
        case 'error':
          console.error(prefix + entry.message);
          break;
        case 'warning':
          console.warn(prefix + entry.message);
          break;
        default:
      }
    });

    // Immediate Window handler
    this.outputHandlers.set(DebugOutputTarget.ImmediateWindow, entry => {
      if (!this.immediateWindowCallback) return;

      const prefix = this.config.includeTimestamp
        ? `[${new Date(entry.timestamp).toLocaleTimeString()}] `
        : '';

      this.immediateWindowCallback(prefix + entry.message);

      if (entry.stackTrace && entry.type === 'assert') {
        this.immediateWindowCallback(entry.stackTrace);
      }
    });

    // File handler
    this.outputHandlers.set(DebugOutputTarget.File, entry => {
      if (!this.fileHandle) return;

      const line = JSON.stringify(entry) + '\n';
      // In a real implementation, write to file
    });
  }

  private getCallerInfo(): string {
    try {
      throw new Error();
    } catch (e: any) {
      const stack = e.stack?.split('\n');
      if (stack && stack.length > 3) {
        const callerLine = stack[3];
        const match = callerLine.match(/at\s+(\S+)/);
        return match ? match[1] : 'Unknown';
      }
    }
    return 'Unknown';
  }

  private getCallerLineNumber(): number {
    try {
      throw new Error();
    } catch (e: any) {
      const stack = e.stack?.split('\n');
      if (stack && stack.length > 3) {
        const callerLine = stack[3];
        const match = callerLine.match(/:(\d+):\d+/);
        return match ? parseInt(match[1]) : 0;
      }
    }
    return 0;
  }

  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (e: any) {
      return e.stack || '';
    }
  }

  private openLogFile(filename: string): void {
    // In a real implementation, open file for writing
    this.fileHandle = filename;
  }
}

// Global Debug instance
export const Debug = VB6Debug.getInstance();

/**
 * VB6 Debug functions for transpiled code
 */

// Debug.Print
export function DebugPrint(...args: any[]): void {
  Debug.print(...args);
}

// Debug.Assert
export function DebugAssert(condition: boolean, message?: string): void {
  Debug.assert(condition, message);
}

// Clear debug output
export function DebugClear(): void {
  Debug.clear();
}

// Print with formatting
export function DebugPrintFormat(format: string, ...args: any[]): void {
  Debug.printWithFormat(format, ...args);
}

// Print object
export function DebugPrintObject(obj: any): void {
  Debug.printObject(obj);
}

// Print array
export function DebugPrintArray(arr: any[], name?: string): void {
  Debug.printArray(arr, name);
}

/**
 * VB6 Stop statement (breakpoint)
 */
export function Stop(): void {
  if (Debug['config'].enabled) {
    Debug.print('STOP statement reached');
    // eslint-disable-next-line no-debugger
    debugger;
  }
}

/**
 * Example usage
 */
export class VB6DebugExample {
  demonstrateDebug(): void {
    // Basic Debug.Print
    Debug.print('Hello from VB6 Debug');
    Debug.print('Value:', 42, 'Text:', 'Test');

    // Print with formatting
    Debug.printWithFormat('Name: ? Age: ?', 'John', 30);

    // Print with zones (VB6 style)
    Debug.setPrintSeparator(',');
    Debug.print('Zone1', 'Zone2', 'Zone3');
    Debug.setPrintSeparator(' ');

    // Print object
    const obj = {
      name: 'Test Object',
      value: 123,
      nested: {
        prop1: 'value1',
        prop2: 'value2',
      },
    };
    Debug.printObject(obj);

    // Print array
    const arr = [1, 2, 3, 4, 5];
    Debug.printArray(arr, 'Numbers');

    // Print table
    const table = [
      ['Name', 'Age', 'City'],
      ['John', 30, 'New York'],
      ['Jane', 25, 'Boston'],
      ['Bob', 35, 'Chicago'],
    ];
    Debug.printTable(table.slice(1), table[0]);

    // Assertions
    Debug.assert(1 + 1 === 2, 'Math works');
    Debug.assert(false, 'This will trigger');

    // Print with timestamp
    Debug.printWithTime('Event occurred');

    // Clear output
    // Debug.clear();
  }
}

// Export all Debug functionality
export const VB6DebugAPI = {
  VB6Debug,
  Debug,
  DebugPrint,
  DebugAssert,
  DebugClear,
  DebugPrintFormat,
  DebugPrintObject,
  DebugPrintArray,
  Stop,
  VB6DebugExample,
  DebugOutputTarget,
};
