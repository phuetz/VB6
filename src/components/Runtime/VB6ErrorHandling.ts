/**
 * VB6 Error Handling System
 * Implements On Error GoTo, On Error Resume Next, Err object, and Resume statements
 */

/**
 * VB6 Error Numbers (Common Errors)
 */
export enum VB6ErrorNumber {
  // File Errors
  FileNotFound = 53,
  PathNotFound = 76,
  PermissionDenied = 70,
  FileAlreadyOpen = 55,
  DeviceUnavailable = 68,
  DiskFull = 61,
  InputPastEndOfFile = 62,
  BadFileName = 64,

  // Math Errors
  DivisionByZero = 11,
  OverflowError = 6,

  // Type Errors
  TypeMismatch = 13,
  OutOfMemory = 7,
  SubscriptOutOfRange = 9,

  // Object Errors
  ObjectVariableNotSet = 91,
  ObjectRequired = 424,
  InvalidProcedureCall = 5,

  // Automation Errors
  AutomationError = 440,
  ObjectDoesNotSupportProperty = 438,

  // General
  CannotCreateObject = 429,
}

/**
 * Err Object - VB6 Global Error Object
 */
export class VB6Err {
  private _number: number = 0;
  private _source: string = '';
  private _description: string = '';
  private _helpFile: string = '';
  private _helpContext: number = 0;
  private _lastDllError: number = 0;

  /**
   * Error number
   */
  get Number(): number {
    return this._number;
  }

  set Number(value: number) {
    this._number = value;
    if (value !== 0 && !this._description) {
      this._description = this.getDefaultDescription(value);
    }
  }

  /**
   * Error description
   */
  get Description(): string {
    return this._description;
  }

  set Description(value: string) {
    this._description = value;
  }

  /**
   * Error source (component name)
   */
  get Source(): string {
    return this._source;
  }

  set Source(value: string) {
    this._source = value;
  }

  /**
   * Help file path
   */
  get HelpFile(): string {
    return this._helpFile;
  }

  set HelpFile(value: string) {
    this._helpFile = value;
  }

  /**
   * Help context ID
   */
  get HelpContext(): number {
    return this._helpContext;
  }

  set HelpContext(value: number) {
    this._helpContext = value;
  }

  /**
   * Last DLL error (from Declare statements)
   */
  get LastDllError(): number {
    return this._lastDllError;
  }

  /**
   * Clear all error information
   */
  Clear(): void {
    this._number = 0;
    this._source = '';
    this._description = '';
    this._helpFile = '';
    this._helpContext = 0;
  }

  /**
   * Raise an error
   */
  Raise(
    number: number,
    source?: string,
    description?: string,
    helpfile?: string,
    helpcontext?: number
  ): void {
    this._number = number;
    this._source = source || this._source || '';
    this._description = description || this.getDefaultDescription(number);
    this._helpFile = helpfile || this._helpFile;
    this._helpContext = helpcontext || this._helpContext;

    throw new VB6ErrorException(this);
  }

  /**
   * Get default error description for error number
   */
  private getDefaultDescription(number: number): string {
    const descriptions: Record<number, string> = {
      [VB6ErrorNumber.FileNotFound]: 'File not found',
      [VB6ErrorNumber.PathNotFound]: 'Path not found',
      [VB6ErrorNumber.PermissionDenied]: 'Permission denied',
      [VB6ErrorNumber.FileAlreadyOpen]: 'File already open',
      [VB6ErrorNumber.DeviceUnavailable]: 'Device unavailable',
      [VB6ErrorNumber.DiskFull]: 'Disk full',
      [VB6ErrorNumber.InputPastEndOfFile]: 'Input past end of file',
      [VB6ErrorNumber.BadFileName]: 'Bad file name or number',
      [VB6ErrorNumber.DivisionByZero]: 'Division by zero',
      [VB6ErrorNumber.OverflowError]: 'Overflow',
      [VB6ErrorNumber.OutOfRange]: 'Subscript out of range',
      [VB6ErrorNumber.TypeMismatch]: 'Type mismatch',
      [VB6ErrorNumber.OutOfMemory]: 'Out of memory',
      [VB6ErrorNumber.ObjectVariableNotSet]: 'Object variable or With block variable not set',
      [VB6ErrorNumber.ObjectRequired]: 'Object required',
      [VB6ErrorNumber.InvalidProcedureCall]: 'Invalid procedure call or argument',
      [VB6ErrorNumber.AutomationError]: 'Automation error',
      [VB6ErrorNumber.ObjectDoesNotSupportProperty]:
        "Object doesn't support this property or method",
      [VB6ErrorNumber.CannotCreateObject]: "ActiveX component can't create object",
    };

    return descriptions[number] || `Application-defined or object-defined error (${number})`;
  }
}

/**
 * VB6 Error Exception (internal use)
 */
export class VB6ErrorException extends Error {
  constructor(public err: VB6Err) {
    super(err.Description);
    this.name = 'VB6Error';
  }
}

/**
 * Error Handling Mode
 */
export enum ErrorHandlingMode {
  None = 'None',
  ResumeNext = 'ResumeNext',
  GoTo = 'GoTo',
}

/**
 * Error Handler Context
 */
export class ErrorHandler {
  private mode: ErrorHandlingMode = ErrorHandlingMode.None;
  private errorLabel: string = '';
  private err: VB6Err = new VB6Err();

  /**
   * Get the Err object
   */
  getErr(): VB6Err {
    return this.err;
  }

  /**
   * Set error handling to "On Error Resume Next"
   */
  onErrorResumeNext(): void {
    this.mode = ErrorHandlingMode.ResumeNext;
  }

  /**
   * Set error handling to "On Error GoTo <label>"
   */
  onErrorGoTo(label: string): void {
    if (label === '0') {
      this.mode = ErrorHandlingMode.None;
      this.errorLabel = '';
    } else {
      this.mode = ErrorHandlingMode.GoTo;
      this.errorLabel = label;
    }
  }

  /**
   * Handle an error
   * Returns the label to jump to, or null if error should propagate
   */
  handleError(error: any): string | null {
    // Populate Err object
    if (error instanceof VB6ErrorException) {
      // Already a VB6 error
      this.err = error.err;
    } else if (error instanceof Error) {
      this.err.Number = 440; // Automation error
      this.err.Description = error.message;
      this.err.Source = 'JavaScript';
    } else {
      this.err.Number = 440;
      this.err.Description = String(error);
      this.err.Source = 'Unknown';
    }

    switch (this.mode) {
      case ErrorHandlingMode.ResumeNext:
        // Swallow error and continue
        return null;

      case ErrorHandlingMode.GoTo:
        // Jump to error handler
        return this.errorLabel;

      case ErrorHandlingMode.None:
      default:
        // Propagate error
        throw error;
    }
  }

  /**
   * Resume execution (after error handler)
   */
  resume(): void {
    this.err.Clear();
    // Resume at the statement that caused the error
  }

  /**
   * Resume Next (after error handler)
   */
  resumeNext(): void {
    this.err.Clear();
    // Resume at the next statement after the one that caused the error
  }

  /**
   * Resume <label> (after error handler)
   */
  resumeLabel(label: string): void {
    this.err.Clear();
    // Resume at the specified label
  }
}

/**
 * Global error handler instance
 */
export const GlobalErrorHandler = new ErrorHandler();

/**
 * Helper functions for error handling in transpiled code
 */
export const ErrorHandlingHelpers = {
  /**
   * On Error Resume Next
   */
  onErrorResumeNext: (): void => {
    GlobalErrorHandler.onErrorResumeNext();
  },

  /**
   * On Error GoTo <label>
   */
  onErrorGoTo: (label: string): void => {
    GlobalErrorHandler.onErrorGoTo(label);
  },

  /**
   * Get Err object
   */
  getErr: (): VB6Err => {
    return GlobalErrorHandler.getErr();
  },

  /**
   * Try-catch wrapper for VB6 code blocks
   */
  tryExecute: (fn: () => void, errorLabel?: string): void => {
    try {
      fn();
    } catch (error) {
      const jumpLabel = GlobalErrorHandler.handleError(error);
      if (jumpLabel && errorLabel) {
        // In real implementation, this would jump to the error handler
        console.warn(`Should jump to error handler: ${jumpLabel}`);
      }
    }
  },

  /**
   * Resume execution
   */
  resume: (): void => {
    GlobalErrorHandler.resume();
  },

  /**
   * Resume Next
   */
  resumeNext: (): void => {
    GlobalErrorHandler.resumeNext();
  },
};

export default {
  VB6Err,
  VB6ErrorException,
  ErrorHandler,
  GlobalErrorHandler,
  ErrorHandlingHelpers,
  VB6ErrorNumber,
};
