/**
 * VB6 Error Handling Implementation
 *
 * Complete implementation of VB6 error handling:
 * On Error Resume Next, On Error GoTo, Err object, etc.
 */

export interface VB6Error {
  number: number;
  description: string;
  source: string;
  helpContext: number;
  helpFile: string;
  lastDllError: number;
}

export class VB6ErrorHandler {
  private static instance: VB6ErrorHandler;
  private errorMode: 'none' | 'resume' | 'goto' = 'none';
  private errorLabel: string = '';
  private errorStack: VB6Error[] = [];
  private currentError: VB6Error | null = null;
  private isInErrorHandler = false;
  private errorHandlers: Map<string, () => void> = new Map();

  static getInstance(): VB6ErrorHandler {
    if (!VB6ErrorHandler.instance) {
      VB6ErrorHandler.instance = new VB6ErrorHandler();
    }
    return VB6ErrorHandler.instance;
  }

  /**
   * Initialize error object
   */
  constructor() {
    this.currentError = {
      number: 0,
      description: '',
      source: '',
      helpContext: 0,
      helpFile: '',
      lastDllError: 0,
    };
  }

  /**
   * Set error handling mode: On Error Resume Next
   */
  onErrorResumeNext(): void {
    this.errorMode = 'resume';
    this.errorLabel = '';
    this.clearError();
  }

  /**
   * Set error handling mode: On Error GoTo label
   */
  onErrorGoto(label: string): void {
    this.errorMode = 'goto';
    this.errorLabel = label;
    this.clearError();
  }

  /**
   * Disable error handling: On Error GoTo 0
   */
  onErrorGoto0(): void {
    this.errorMode = 'none';
    this.errorLabel = '';
    this.clearError();
  }

  /**
   * Register error handler for a label
   */
  registerErrorHandler(label: string, handler: () => void): void {
    this.errorHandlers.set(label, handler);
  }

  /**
   * Raise an error (Error statement)
   */
  raiseError(
    number: number,
    description?: string,
    source?: string,
    helpFile?: string,
    helpContext?: number
  ): void {
    this.setError(number, description, source, helpFile, helpContext);
    this.handleError();
  }

  /**
   * Set error information
   */
  setError(
    number: number,
    description?: string,
    source?: string,
    helpFile?: string,
    helpContext?: number
  ): void {
    this.currentError = {
      number: number,
      description: description || this.getErrorDescription(number),
      source: source || 'VB6 Runtime',
      helpContext: helpContext || 0,
      helpFile: helpFile || '',
      lastDllError: 0,
    };

    // Add to error stack
    this.errorStack.push({ ...this.currentError });
  }

  /**
   * Handle error based on current error mode
   */
  handleError(): void {
    if (this.isInErrorHandler) {
      // Prevent infinite error loops
      throw new Error(`Unhandled error in error handler: ${this.currentError?.description}`);
    }

    switch (this.errorMode) {
      case 'resume':
        // Continue execution - error is stored but execution continues
        break;

      case 'goto':
        if (this.errorLabel && this.errorHandlers.has(this.errorLabel)) {
          this.isInErrorHandler = true;
          try {
            const handler = this.errorHandlers.get(this.errorLabel)!;
            handler();
          } finally {
            this.isInErrorHandler = false;
          }
        } else {
          throw new Error(`Error handler label '${this.errorLabel}' not found`);
        }
        break;

      case 'none':
      default:
        // No error handling - throw JavaScript error
        throw new Error(this.currentError?.description || 'Unknown error');
    }
  }

  /**
   * Resume execution after error handler
   */
  resume(): void {
    this.clearError();
    // Continue execution from the statement that caused the error
  }

  /**
   * Resume execution from next statement
   */
  resumeNext(): void {
    this.clearError();
    // Continue execution from the statement after the one that caused the error
  }

  /**
   * Clear current error
   */
  clearError(): void {
    if (this.currentError) {
      this.currentError.number = 0;
      this.currentError.description = '';
      this.currentError.source = '';
      this.currentError.helpContext = 0;
      this.currentError.helpFile = '';
      this.currentError.lastDllError = 0;
    }
  }

  /**
   * Get current error object (Err)
   */
  getError(): VB6Error {
    return (
      this.currentError || {
        number: 0,
        description: '',
        source: '',
        helpContext: 0,
        helpFile: '',
        lastDllError: 0,
      }
    );
  }

  /**
   * Check if there's an active error
   */
  hasError(): boolean {
    return this.currentError !== null && this.currentError.number !== 0;
  }

  /**
   * Get error description by number
   */
  private getErrorDescription(errorNumber: number): string {
    const errorDescriptions: { [key: number]: string } = {
      // System errors
      3: 'Return without GoSub',
      5: 'Invalid procedure call or argument',
      6: 'Overflow',
      7: 'Out of memory',
      9: 'Subscript out of range',
      10: 'This array is fixed or temporarily locked',
      11: 'Division by zero',
      13: 'Type mismatch',
      14: 'Out of string space',
      16: 'Expression too complex',
      17: "Can't perform requested operation",
      18: 'User interrupt occurred',
      20: 'Resume without error',
      28: 'Out of stack space',
      35: 'Sub or Function not defined',
      47: 'Too many DLL application clients',
      48: 'Error in loading DLL',
      49: 'Bad DLL calling convention',
      51: 'Internal error',
      52: 'Bad file name or number',
      53: 'File not found',
      54: 'Bad file mode',
      55: 'File already open',
      57: 'Device I/O error',
      58: 'File already exists',
      59: 'Bad record length',
      61: 'Disk full',
      62: 'Input past end of file',
      63: 'Bad record number',
      67: 'Too many files',
      68: 'Device unavailable',
      70: 'Permission denied',
      71: 'Disk not ready',
      74: "Can't rename with different drive",
      75: 'Path/File access error',
      76: 'Path not found',
      91: 'Object variable or With block variable not set',
      92: 'For loop not initialized',
      93: 'Invalid pattern string',
      94: 'Invalid use of Null',

      // Runtime errors
      340: "Control array element doesn't exist",
      380: 'Invalid property value',
      381: 'Invalid property array index',
      382: "Property Set can't be executed at run time",
      383: "Property Set can't be used with a read-only property",
      385: 'Need property array index',
      387: 'Property Set not permitted',
      393: "Property Get can't be executed at run time",
      394: "Property Get can't be executed on write-only property",

      // ActiveX/COM errors
      429: "ActiveX component can't create object",
      430: 'Class does not support Automation or does not support expected interface',
      432: 'File name or class name not found during Automation operation',
      438: "Object doesn't support this property or method",
      440: 'Automation error',
      445: "Object doesn't support this action",
      446: "Object doesn't support named arguments",
      447: "Object doesn't support current locale setting",
      448: 'Named argument not found',
      449: 'Argument not optional',
      450: 'Wrong number of arguments or invalid property assignment',
      451: 'Property let procedure not defined and property get procedure did not return an object',
      452: 'Invalid ordinal',
      453: 'Specified DLL function not found',
      454: 'Code resource not found',
      455: 'Code resource lock error',
      457: 'This key is already associated with an element of this collection',
      458: 'Variable uses an Automation type not supported in VB',
      459: 'Object or class does not support the set of events',
      460: 'Invalid clipboard format',
      461: 'Method or data member not found',
      462: 'The remote server machine does not exist or is unavailable',
      463: 'Class not registered on local machine',

      // Database errors
      3001: 'Invalid argument',
      3003: 'Too few parameters. Expected [number]',
      3021: 'No current record',
      3201: 'You cannot add or change a record because a related record is required',
      3251: 'Operation is not supported for this type of object',
      3265: 'Item not found in this collection',

      // Custom errors (32767 - 65535 range available for custom errors)
      32755: 'User canceled operation',
    };

    return errorDescriptions[errorNumber] || `Unknown error (${errorNumber})`;
  }

  /**
   * CVErr function - Create error value
   */
  cvErr(errorNumber: number): any {
    return { __vb6_error: true, number: errorNumber };
  }

  /**
   * IsError function - Check if value is an error
   */
  isError(value: any): boolean {
    return value && typeof value === 'object' && value.__vb6_error === true;
  }

  /**
   * Error function - Get error description
   */
  error(errorNumber?: number): string {
    if (errorNumber === undefined) {
      return this.currentError?.description || '';
    }
    return this.getErrorDescription(errorNumber);
  }

  /**
   * Get error stack (for debugging)
   */
  getErrorStack(): VB6Error[] {
    return [...this.errorStack];
  }

  /**
   * Clear error stack
   */
  clearErrorStack(): void {
    this.errorStack = [];
  }

  /**
   * Execute code with error handling
   */
  executeWithErrorHandling<T>(code: () => T, errorHandler?: (error: VB6Error) => T): T {
    try {
      return code();
    } catch (error) {
      let errorNumber = 0;
      let errorDescription = '';

      if (error instanceof Error) {
        errorDescription = error.message;

        // Map JavaScript errors to VB6 error numbers
        if (error.name === 'ReferenceError') {
          errorNumber = 91; // Object variable not set
        } else if (error.name === 'TypeError') {
          errorNumber = 13; // Type mismatch
        } else if (error.name === 'RangeError') {
          errorNumber = 9; // Subscript out of range
        } else {
          errorNumber = 440; // Automation error
        }
      } else {
        errorNumber = 440;
        errorDescription = String(error);
      }

      this.setError(errorNumber, errorDescription);

      if (errorHandler) {
        return errorHandler(this.getError());
      } else {
        this.handleError();
        throw error; // Re-throw if not handled
      }
    }
  }
}

// Global error handler instance
export const errorHandler = VB6ErrorHandler.getInstance();

// Err object (global)
export const Err = {
  get Number(): number {
    return errorHandler.getError().number;
  },

  set Number(value: number) {
    const error = errorHandler.getError();
    error.number = value;
    if (value !== 0) {
      error.description = errorHandler['getErrorDescription'](value);
    } else {
      error.description = '';
    }
  },

  get Description(): string {
    return errorHandler.getError().description;
  },

  set Description(value: string) {
    errorHandler.getError().description = value;
  },

  get Source(): string {
    return errorHandler.getError().source;
  },

  set Source(value: string) {
    errorHandler.getError().source = value;
  },

  get HelpContext(): number {
    return errorHandler.getError().helpContext;
  },

  set HelpContext(value: number) {
    errorHandler.getError().helpContext = value;
  },

  get HelpFile(): string {
    return errorHandler.getError().helpFile;
  },

  set HelpFile(value: string) {
    errorHandler.getError().helpFile = value;
  },

  get LastDllError(): number {
    return errorHandler.getError().lastDllError;
  },

  Clear(): void {
    errorHandler.clearError();
  },

  Raise(
    number: number,
    source?: string,
    description?: string,
    helpFile?: string,
    helpContext?: number
  ): void {
    errorHandler.raiseError(number, description, source, helpFile, helpContext);
  },
};

// Global error handling functions
export function OnErrorResumeNext(): void {
  errorHandler.onErrorResumeNext();
}

export function OnErrorGoto(label: string): void {
  errorHandler.onErrorGoto(label);
}

export function OnErrorGoto0(): void {
  errorHandler.onErrorGoto0();
}

export function Resume(): void {
  errorHandler.resume();
}

export function ResumeNext(): void {
  errorHandler.resumeNext();
}

export function CVErr(errorNumber: number): any {
  return errorHandler.cvErr(errorNumber);
}

export function IsError(value: any): boolean {
  return errorHandler.isError(value);
}

export function Error(errorNumber?: number): string {
  return errorHandler.error(errorNumber);
}

// Helper function to wrap VB6 code execution
export function VB6Execute<T>(code: () => T, errorLabel?: string, errorHandler?: () => void): T {
  const handler = VB6ErrorHandler.getInstance();

  if (errorLabel && errorHandler) {
    handler.registerErrorHandler(errorLabel, errorHandler);
  }

  return handler.executeWithErrorHandling(code);
}

// Export everything
export const VB6ErrorHandling = {
  errorHandler,
  Err,
  OnErrorResumeNext,
  OnErrorGoto,
  OnErrorGoto0,
  Resume,
  ResumeNext,
  CVErr,
  IsError,
  Error,
  VB6Execute,
};
