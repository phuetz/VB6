/**
 * VB6 Error Lookup Tool
 * Complete database of VB6 runtime error codes and descriptions
 */

// ============================================================================
// Types
// ============================================================================

export interface VB6Error {
  code: number;
  description: string;
  cause: string;
  solution: string;
  category: ErrorCategory;
}

export type ErrorCategory =
  | 'runtime'
  | 'file'
  | 'object'
  | 'memory'
  | 'database'
  | 'network'
  | 'system'
  | 'user';

// ============================================================================
// Complete VB6 Error Database
// ============================================================================

export const VB6_ERRORS: VB6Error[] = [
  // Runtime Errors (3-100)
  {
    code: 3,
    description: 'Return without GoSub',
    cause: 'A Return statement was executed without a matching GoSub.',
    solution: 'Ensure every Return has a corresponding GoSub, or use Exit Sub/Function instead.',
    category: 'runtime'
  },
  {
    code: 5,
    description: 'Invalid procedure call or argument',
    cause: 'A procedure was called with invalid arguments or in an invalid way.',
    solution: 'Check procedure parameters, array bounds, and argument types.',
    category: 'runtime'
  },
  {
    code: 6,
    description: 'Overflow',
    cause: 'An arithmetic operation resulted in a number too large for the data type.',
    solution: 'Use a larger data type (Long instead of Integer, Double instead of Single).',
    category: 'runtime'
  },
  {
    code: 7,
    description: 'Out of memory',
    cause: 'The application has exhausted available memory.',
    solution: 'Close other applications, release object references, or reduce memory usage.',
    category: 'memory'
  },
  {
    code: 9,
    description: 'Subscript out of range',
    cause: 'An array index is outside the bounds of the array.',
    solution: 'Check array bounds using LBound and UBound before accessing elements.',
    category: 'runtime'
  },
  {
    code: 10,
    description: 'This array is fixed or temporarily locked',
    cause: 'Attempting to resize a fixed array or an array in use.',
    solution: 'Use a dynamic array (ReDim) or wait until the array is not in use.',
    category: 'runtime'
  },
  {
    code: 11,
    description: 'Division by zero',
    cause: 'An arithmetic division by zero was attempted.',
    solution: 'Check divisor is not zero before performing division.',
    category: 'runtime'
  },
  {
    code: 13,
    description: 'Type mismatch',
    cause: 'Data type cannot be converted to the required type.',
    solution: 'Use appropriate conversion functions (CInt, CLng, CStr, etc.) or fix variable types.',
    category: 'runtime'
  },
  {
    code: 14,
    description: 'Out of string space',
    cause: 'A string operation has exceeded available string space.',
    solution: 'Release unused strings, use fixed-length strings, or break into smaller operations.',
    category: 'memory'
  },
  {
    code: 16,
    description: 'Expression too complex',
    cause: 'An expression contains too many nested operations.',
    solution: 'Break the expression into smaller parts using temporary variables.',
    category: 'runtime'
  },
  {
    code: 17,
    description: "Can't perform requested operation",
    cause: 'The requested operation cannot be completed.',
    solution: 'Check if the operation is valid in the current context.',
    category: 'runtime'
  },
  {
    code: 18,
    description: 'User interrupt occurred',
    cause: 'User pressed Ctrl+Break to interrupt the program.',
    solution: 'This is not an error; the user intentionally stopped the program.',
    category: 'user'
  },
  {
    code: 20,
    description: 'Resume without error',
    cause: 'A Resume statement was executed when no error was active.',
    solution: 'Only use Resume within an error handler when an error has occurred.',
    category: 'runtime'
  },
  {
    code: 28,
    description: 'Out of stack space',
    cause: 'Too many nested procedure calls or excessive local variables.',
    solution: 'Reduce recursion depth, move variables to module level, or simplify call hierarchy.',
    category: 'memory'
  },
  {
    code: 35,
    description: 'Sub or Function not defined',
    cause: 'A call was made to a Sub or Function that does not exist.',
    solution: 'Check spelling, ensure the procedure is declared, and verify references.',
    category: 'runtime'
  },
  {
    code: 48,
    description: 'Error in loading DLL',
    cause: 'A DLL could not be loaded.',
    solution: 'Verify DLL exists, is the correct version, and all dependencies are available.',
    category: 'system'
  },
  {
    code: 49,
    description: 'Bad DLL calling convention',
    cause: 'The DLL function was declared with incorrect parameters.',
    solution: 'Check Declare statement matches the actual DLL function signature.',
    category: 'system'
  },
  {
    code: 51,
    description: 'Internal error',
    cause: 'An internal error occurred in Visual Basic.',
    solution: 'Save your work, restart the application, and contact support if persistent.',
    category: 'system'
  },
  {
    code: 52,
    description: 'Bad file name or number',
    cause: 'An invalid file name or file number was used.',
    solution: 'Check file name for invalid characters and ensure file number is valid (1-511).',
    category: 'file'
  },
  {
    code: 53,
    description: 'File not found',
    cause: 'The specified file does not exist.',
    solution: 'Verify the file path is correct and the file exists.',
    category: 'file'
  },
  {
    code: 54,
    description: 'Bad file mode',
    cause: 'A file operation is incompatible with the mode the file was opened in.',
    solution: 'Open the file in the correct mode (Input, Output, Append, Binary, Random).',
    category: 'file'
  },
  {
    code: 55,
    description: 'File already open',
    cause: 'The file is already open with an incompatible lock.',
    solution: 'Close the file first or use a shared open mode.',
    category: 'file'
  },
  {
    code: 57,
    description: 'Device I/O error',
    cause: 'A device error occurred during input/output.',
    solution: 'Check the device is working correctly and try the operation again.',
    category: 'file'
  },
  {
    code: 58,
    description: 'File already exists',
    cause: 'Attempting to create a file that already exists.',
    solution: 'Delete the existing file first or use a different name.',
    category: 'file'
  },
  {
    code: 59,
    description: 'Bad record length',
    cause: 'The record length does not match the file specification.',
    solution: 'Ensure the Len parameter in Open matches the record size.',
    category: 'file'
  },
  {
    code: 61,
    description: 'Disk full',
    cause: 'No more space available on the disk.',
    solution: 'Free up disk space or write to a different drive.',
    category: 'file'
  },
  {
    code: 62,
    description: 'Input past end of file',
    cause: 'Attempting to read past the end of a file.',
    solution: 'Check EOF before reading or handle the end of file condition.',
    category: 'file'
  },
  {
    code: 63,
    description: 'Bad record number',
    cause: 'An invalid record number was specified.',
    solution: 'Ensure record number is valid (1 to file size / record length).',
    category: 'file'
  },
  {
    code: 67,
    description: 'Too many files',
    cause: 'Maximum number of files are already open.',
    solution: 'Close some files. Increase files setting in CONFIG.SYS.',
    category: 'file'
  },
  {
    code: 68,
    description: 'Device unavailable',
    cause: 'The specified device is not available.',
    solution: 'Check device is connected, powered on, and working correctly.',
    category: 'system'
  },
  {
    code: 70,
    description: 'Permission denied',
    cause: 'Access to the file or resource is denied.',
    solution: 'Check file permissions, ensure file is not read-only or in use.',
    category: 'file'
  },
  {
    code: 71,
    description: 'Disk not ready',
    cause: 'The disk drive is not ready.',
    solution: 'Ensure disk is inserted and drive door is closed.',
    category: 'file'
  },
  {
    code: 74,
    description: "Can't rename with different drive",
    cause: 'Attempting to rename a file to a different drive.',
    solution: 'Copy the file to the new drive, then delete the original.',
    category: 'file'
  },
  {
    code: 75,
    description: 'Path/File access error',
    cause: 'The path or file cannot be accessed.',
    solution: 'Check path exists, is spelled correctly, and you have permissions.',
    category: 'file'
  },
  {
    code: 76,
    description: 'Path not found',
    cause: 'The specified path does not exist.',
    solution: 'Verify the path is correct or create the directory first.',
    category: 'file'
  },

  // Object Errors (91-94, 420-460)
  {
    code: 91,
    description: 'Object variable or With block variable not set',
    cause: 'Using an object variable before it is set with Set statement.',
    solution: 'Use Set statement to assign object reference before using it.',
    category: 'object'
  },
  {
    code: 92,
    description: 'For loop not initialized',
    cause: 'A For Each loop variable was used incorrectly.',
    solution: 'Ensure the For Each collection is valid and not Nothing.',
    category: 'runtime'
  },
  {
    code: 93,
    description: 'Invalid pattern string',
    cause: 'The pattern string in Like operator is invalid.',
    solution: 'Check the pattern for valid wildcard characters (*, ?, #, [], !).',
    category: 'runtime'
  },
  {
    code: 94,
    description: 'Invalid use of Null',
    cause: 'Null was used in an operation that does not accept Null.',
    solution: 'Check for Null with IsNull() before using the value.',
    category: 'runtime'
  },
  {
    code: 322,
    description: "Can't create necessary temporary file",
    cause: 'Unable to create a temporary file.',
    solution: 'Check TEMP folder permissions and available disk space.',
    category: 'file'
  },
  {
    code: 325,
    description: 'Invalid format in resource file',
    cause: 'The resource file format is invalid.',
    solution: 'Recreate or repair the resource file (.RES).',
    category: 'file'
  },
  {
    code: 380,
    description: 'Invalid property value',
    cause: 'A property was assigned an invalid value.',
    solution: 'Check the valid range of values for the property.',
    category: 'object'
  },
  {
    code: 381,
    description: 'Invalid property array index',
    cause: 'The property array index is out of range.',
    solution: 'Check the index is within the valid range for the property.',
    category: 'object'
  },
  {
    code: 382,
    description: "Set not supported (read-only property)",
    cause: 'Attempting to set a read-only property.',
    solution: 'This property cannot be changed at runtime.',
    category: 'object'
  },
  {
    code: 383,
    description: "Set not supported at run time",
    cause: 'The property can only be set at design time.',
    solution: 'Set this property in the Properties window at design time.',
    category: 'object'
  },
  {
    code: 384,
    description: "Get not supported (write-only property)",
    cause: 'Attempting to read a write-only property.',
    solution: 'This property can only be written to, not read.',
    category: 'object'
  },
  {
    code: 385,
    description: "Need property array index",
    cause: 'A control array property was accessed without an index.',
    solution: 'Specify the index when accessing control array properties.',
    category: 'object'
  },
  {
    code: 387,
    description: "Set not permitted",
    cause: 'The property cannot be set in the current context.',
    solution: 'Check when and how this property can be modified.',
    category: 'object'
  },
  {
    code: 393,
    description: "Get not permitted",
    cause: 'The property cannot be read in the current context.',
    solution: 'Check when and how this property can be accessed.',
    category: 'object'
  },
  {
    code: 422,
    description: 'Property not found',
    cause: 'The property does not exist on the object.',
    solution: 'Check spelling and verify the property exists.',
    category: 'object'
  },
  {
    code: 423,
    description: 'Property or method not found',
    cause: 'The property or method does not exist on the object.',
    solution: 'Check object type and spelling of property/method name.',
    category: 'object'
  },
  {
    code: 424,
    description: 'Object required',
    cause: 'An object is expected but a non-object value was provided.',
    solution: 'Use Set statement for object assignment, not Let.',
    category: 'object'
  },
  {
    code: 429,
    description: "ActiveX component can't create object",
    cause: 'The ActiveX object could not be created.',
    solution: 'Verify the component is registered and version is correct.',
    category: 'object'
  },
  {
    code: 430,
    description: "Class does not support Automation",
    cause: 'The class cannot be used with Automation.',
    solution: 'Use a class that supports Automation/COM.',
    category: 'object'
  },
  {
    code: 432,
    description: 'File name or class name not found during Automation operation',
    cause: 'The specified file or class could not be found.',
    solution: 'Check the file path or class name is correct.',
    category: 'object'
  },
  {
    code: 438,
    description: "Object doesn't support this property or method",
    cause: 'The object does not have the specified property or method.',
    solution: 'Check the object type supports the property/method being used.',
    category: 'object'
  },
  {
    code: 440,
    description: 'Automation error',
    cause: 'An error occurred in an Automation operation.',
    solution: 'Check the specific error in Err.LastDllError for details.',
    category: 'object'
  },
  {
    code: 443,
    description: 'Automation object does not have a default value',
    cause: 'Trying to use an object as a value when it has no default property.',
    solution: 'Explicitly access a property of the object.',
    category: 'object'
  },
  {
    code: 445,
    description: "Object doesn't support this action",
    cause: 'The object cannot perform the requested action.',
    solution: 'Check if the action is valid for this type of object.',
    category: 'object'
  },
  {
    code: 446,
    description: "Object doesn't support named arguments",
    cause: 'Named arguments are not supported by this method.',
    solution: 'Use positional arguments instead of named arguments.',
    category: 'object'
  },
  {
    code: 447,
    description: "Object doesn't support current locale setting",
    cause: 'The object cannot handle the current locale.',
    solution: 'Change the locale setting or use a different object.',
    category: 'object'
  },
  {
    code: 448,
    description: 'Named argument not found',
    cause: 'The specified named argument does not exist.',
    solution: 'Check the spelling of the argument name.',
    category: 'object'
  },
  {
    code: 449,
    description: 'Argument not optional',
    cause: 'A required argument was not provided.',
    solution: 'Provide all required arguments to the procedure.',
    category: 'runtime'
  },
  {
    code: 450,
    description: 'Wrong number of arguments or invalid property assignment',
    cause: 'Incorrect number of arguments or invalid assignment.',
    solution: 'Check the number of arguments and their types.',
    category: 'runtime'
  },
  {
    code: 451,
    description: 'Property let procedure not defined and property get procedure did not return an object',
    cause: 'Object property assignment without Let procedure.',
    solution: 'Define a Property Let procedure or use Set statement.',
    category: 'object'
  },
  {
    code: 452,
    description: 'Invalid ordinal',
    cause: 'Invalid ordinal number in DLL function call.',
    solution: 'Use the correct ordinal or function name in Declare statement.',
    category: 'system'
  },
  {
    code: 453,
    description: 'Specified DLL function not found',
    cause: 'The function does not exist in the specified DLL.',
    solution: 'Verify function name and DLL path in Declare statement.',
    category: 'system'
  },
  {
    code: 455,
    description: 'Code resource lock error',
    cause: 'Error locking a code resource.',
    solution: 'Close other applications using the resource.',
    category: 'system'
  },
  {
    code: 457,
    description: 'This key is already associated with an element of this collection',
    cause: 'Attempting to add a duplicate key to a Collection.',
    solution: 'Use a unique key or check if key exists before adding.',
    category: 'object'
  },
  {
    code: 458,
    description: "Variable uses an Automation type not supported in Visual Basic",
    cause: 'Unsupported Automation data type.',
    solution: 'Convert to a supported data type before use.',
    category: 'object'
  },
  {
    code: 459,
    description: "Object or class does not support the set of events",
    cause: 'The object does not support the specified events.',
    solution: 'Check if the object supports events or use different object.',
    category: 'object'
  },
  {
    code: 460,
    description: 'Invalid clipboard format',
    cause: 'The clipboard format is not valid.',
    solution: 'Use a supported clipboard format (vbCFText, vbCFBitmap, etc.).',
    category: 'system'
  },
  {
    code: 461,
    description: 'Method or data member not found',
    cause: 'The specified method or data member does not exist.',
    solution: 'Check spelling and verify member exists on the object.',
    category: 'object'
  },
  {
    code: 462,
    description: 'The remote server machine does not exist or is unavailable',
    cause: 'Cannot connect to the remote server.',
    solution: 'Check network connection and server availability.',
    category: 'network'
  },
  {
    code: 463,
    description: 'Class not registered on local machine',
    cause: 'The COM class is not registered.',
    solution: 'Register the COM component using regsvr32.',
    category: 'object'
  },
  {
    code: 481,
    description: 'Invalid picture',
    cause: 'The picture format is invalid or corrupted.',
    solution: 'Use a valid picture file format (BMP, GIF, JPEG, ICO, etc.).',
    category: 'object'
  },
  {
    code: 482,
    description: 'Printer error',
    cause: 'An error occurred while printing.',
    solution: 'Check printer is connected, online, and has paper.',
    category: 'system'
  },
  {
    code: 483,
    description: 'Printer driver does not support specified property',
    cause: 'The printer driver cannot handle this property.',
    solution: 'Update printer driver or change the property value.',
    category: 'system'
  },

  // Database Errors (3000+)
  {
    code: 3021,
    description: 'No current record',
    cause: 'Attempting to access a record when none is current (BOF or EOF).',
    solution: 'Check BOF and EOF before accessing record fields.',
    category: 'database'
  },
  {
    code: 3022,
    description: 'The changes you requested to the table were not successful',
    cause: 'Database constraint violation (duplicate key, etc.).',
    solution: 'Check for duplicate primary keys or constraint violations.',
    category: 'database'
  },
  {
    code: 3027,
    description: "Can't update. Database or object is read-only",
    cause: 'Attempting to modify a read-only database or recordset.',
    solution: 'Open with write access or use an updatable recordset type.',
    category: 'database'
  },
  {
    code: 3044,
    description: 'Invalid path',
    cause: 'The database path is invalid.',
    solution: 'Verify the database file path is correct.',
    category: 'database'
  },
  {
    code: 3051,
    description: 'The Microsoft Jet database engine cannot open the file',
    cause: 'Database file cannot be opened.',
    solution: 'Check permissions, file is not in use, and path is valid.',
    category: 'database'
  },
  {
    code: 3061,
    description: 'Too few parameters',
    cause: 'SQL query has unresolved parameters.',
    solution: 'Provide values for all query parameters.',
    category: 'database'
  },
  {
    code: 3075,
    description: 'Syntax error in query expression',
    cause: 'Invalid SQL syntax.',
    solution: 'Check SQL statement syntax and field/table names.',
    category: 'database'
  },
  {
    code: 3077,
    description: 'Syntax error in date in query expression',
    cause: 'Invalid date format in SQL query.',
    solution: 'Use #MM/DD/YYYY# format for dates in SQL.',
    category: 'database'
  },
  {
    code: 3078,
    description: 'The Microsoft Jet database engine cannot find the input table or query',
    cause: 'Table or query does not exist.',
    solution: 'Verify table or query name is spelled correctly.',
    category: 'database'
  },
  {
    code: 3079,
    description: 'The specified field could refer to more than one table',
    cause: 'Ambiguous field name in query.',
    solution: 'Qualify field name with table name (TableName.FieldName).',
    category: 'database'
  },
  {
    code: 3131,
    description: 'Syntax error in FROM clause',
    cause: 'Invalid FROM clause in SQL statement.',
    solution: 'Check table names and JOIN syntax.',
    category: 'database'
  },
  {
    code: 3134,
    description: 'Syntax error in INSERT INTO statement',
    cause: 'Invalid INSERT statement syntax.',
    solution: 'Check field names and VALUES syntax.',
    category: 'database'
  },
  {
    code: 3144,
    description: 'Syntax error in UPDATE statement',
    cause: 'Invalid UPDATE statement syntax.',
    solution: 'Check SET clause and WHERE clause syntax.',
    category: 'database'
  },
  {
    code: 3146,
    description: 'ODBC Call Failed',
    cause: 'ODBC operation failed.',
    solution: 'Check ODBC connection and source database.',
    category: 'database'
  },
  {
    code: 3265,
    description: "Item cannot be found in the collection",
    cause: 'Requested item does not exist in collection.',
    solution: 'Check item name/index is valid.',
    category: 'database'
  }
];

// ============================================================================
// Error Lookup Functions
// ============================================================================

export class VB6ErrorLookup {
  private errors: Map<number, VB6Error> = new Map();

  constructor() {
    for (const error of VB6_ERRORS) {
      this.errors.set(error.code, error);
    }
  }

  /**
   * Look up error by code
   */
  getError(code: number): VB6Error | undefined {
    return this.errors.get(code);
  }

  /**
   * Get error description
   */
  getDescription(code: number): string {
    return this.errors.get(code)?.description || `Error ${code}`;
  }

  /**
   * Search errors by keyword
   */
  search(keyword: string): VB6Error[] {
    const lowerKeyword = keyword.toLowerCase();
    return VB6_ERRORS.filter(e =>
      e.description.toLowerCase().includes(lowerKeyword) ||
      e.cause.toLowerCase().includes(lowerKeyword) ||
      e.solution.toLowerCase().includes(lowerKeyword) ||
      e.code.toString().includes(keyword)
    );
  }

  /**
   * Get errors by category
   */
  getByCategory(category: ErrorCategory): VB6Error[] {
    return VB6_ERRORS.filter(e => e.category === category);
  }

  /**
   * Get all error codes
   */
  getAllCodes(): number[] {
    return Array.from(this.errors.keys()).sort((a, b) => a - b);
  }

  /**
   * Get all errors
   */
  getAllErrors(): VB6Error[] {
    return [...VB6_ERRORS];
  }

  /**
   * Get all categories
   */
  getCategories(): ErrorCategory[] {
    const categories = new Set<ErrorCategory>();
    for (const error of VB6_ERRORS) {
      categories.add(error.category);
    }
    return Array.from(categories);
  }

  /**
   * Format error for display
   */
  formatError(code: number): string {
    const error = this.errors.get(code);
    if (!error) {
      return `Error ${code}: Unknown error`;
    }
    return `Error ${code}: ${error.description}`;
  }

  /**
   * Get detailed error information
   */
  getDetailedInfo(code: number): string {
    const error = this.errors.get(code);
    if (!error) {
      return `Error ${code}: Unknown error\n\nNo additional information available.`;
    }

    return [
      `Error ${code}: ${error.description}`,
      '',
      'Category: ' + error.category.charAt(0).toUpperCase() + error.category.slice(1),
      '',
      'Possible Cause:',
      error.cause,
      '',
      'Solution:',
      error.solution
    ].join('\n');
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const errorLookup = new VB6ErrorLookup();

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Look up VB6 error by code
 */
export function LookupError(code: number): VB6Error | undefined {
  return errorLookup.getError(code);
}

/**
 * Get error message
 */
export function GetErrorMessage(code: number): string {
  return errorLookup.formatError(code);
}

// ============================================================================
// Export
// ============================================================================

export default {
  VB6_ERRORS,
  VB6ErrorLookup,
  errorLookup,
  LookupError,
  GetErrorMessage
};
