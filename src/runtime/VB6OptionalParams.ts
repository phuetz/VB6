/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * VB6 Optional Parameters and ParamArray Implementation
 * Support for optional parameters with default values and variable argument lists
 */

// Parameter metadata
export interface VB6ParameterInfo {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: any;
  byRef?: boolean;
  byVal?: boolean;
  paramArray?: boolean;
}

// Function signature metadata
export interface VB6FunctionSignature {
  name: string;
  parameters: VB6ParameterInfo[];
  returnType?: string;
  isPublic?: boolean;
  isPrivate?: boolean;
  isFriend?: boolean;
}

// IsMissing result
export class VB6Missing {
  private static readonly instance = new VB6Missing();
  
  private constructor() {}
  
  static getInstance(): VB6Missing {
    return VB6Missing.instance;
  }
  
  toString(): string {
    return '[Missing]';
  }
  
  valueOf(): undefined {
    return undefined;
  }
}

// Global Missing value
export const Missing = VB6Missing.getInstance();

/**
 * VB6 Optional Parameters Manager
 * Handles optional parameters and default values
 */
export class VB6OptionalParamsManager {
  private static instance: VB6OptionalParamsManager;
  private functionSignatures = new Map<string, VB6FunctionSignature>();
  
  private constructor() {}
  
  static getInstance(): VB6OptionalParamsManager {
    if (!VB6OptionalParamsManager.instance) {
      VB6OptionalParamsManager.instance = new VB6OptionalParamsManager();
    }
    return VB6OptionalParamsManager.instance;
  }
  
  /**
   * Register a function signature
   */
  registerFunction(signature: VB6FunctionSignature): void {
    this.functionSignatures.set(signature.name, signature);
  }
  
  /**
   * Process function arguments with optional parameters
   */
  processArguments(
    functionName: string,
    providedArgs: any[],
    namedArgs?: { [key: string]: any }
  ): any[] {
    const signature = this.functionSignatures.get(functionName);
    if (!signature) {
      return providedArgs;
    }
    
    const processedArgs: any[] = [];
    let providedIndex = 0;
    let paramArrayStartIndex = -1;
    
    for (let i = 0; i < signature.parameters.length; i++) {
      const param = signature.parameters[i];
      
      if (param.paramArray) {
        // ParamArray - collect remaining arguments
        paramArrayStartIndex = i;
        const paramArrayArgs = [];
        
        // Collect from positional arguments
        while (providedIndex < providedArgs.length) {
          paramArrayArgs.push(providedArgs[providedIndex++]);
        }
        
        processedArgs.push(paramArrayArgs);
        break; // ParamArray must be last
      } else if (namedArgs && param.name in namedArgs) {
        // Named argument provided
        processedArgs.push(namedArgs[param.name]);
      } else if (providedIndex < providedArgs.length) {
        // Positional argument provided
        const value = providedArgs[providedIndex++];
        processedArgs.push(value === undefined ? Missing : value);
      } else if (param.optional) {
        // Optional parameter not provided - use default or Missing
        processedArgs.push(param.defaultValue !== undefined ? param.defaultValue : Missing);
      } else {
        // Required parameter not provided
        throw new Error(`Required parameter '${param.name}' not provided for function '${functionName}'`);
      }
    }
    
    return processedArgs;
  }
  
  /**
   * Create a function wrapper with optional parameter support
   */
  createWrapper(
    fn: Function,
    signature: VB6FunctionSignature
  ): Function {
    this.registerFunction(signature);
    
    return function(this: any, ...args: any[]) {
      const processedArgs = VB6OptionalParamsManager.getInstance().processArguments(
        signature.name,
        args
      );
      
      return fn.apply(this, processedArgs);
    };
  }
}

// Global manager instance
export const OptionalParamsManager = VB6OptionalParamsManager.getInstance();

/**
 * Check if a parameter is missing (IsMissing function)
 */
export function IsMissing(value: any): boolean {
  return value === Missing || value === undefined || value instanceof VB6Missing;
}

/**
 * Get parameter value or default if missing
 */
export function GetParamValue<T>(value: any, defaultValue: T): T {
  return IsMissing(value) ? defaultValue : value as T;
}

/**
 * Create optional parameter with default value
 */
export function Optional<T>(defaultValue: T): T | VB6Missing {
  return Missing;
}

/**
 * ParamArray implementation
 */
export class VB6ParamArray<T = any> extends Array<T> {
  constructor(...items: T[]) {
    super(...items);
    Object.setPrototypeOf(this, VB6ParamArray.prototype);
  }
  
  /**
   * Get count of arguments
   */
  get Count(): number {
    return this.length;
  }
  
  /**
   * Check if empty
   */
  get IsEmpty(): boolean {
    return this.length === 0;
  }
  
  /**
   * Get lower bound (VB6 compatibility)
   */
  LBound(): number {
    return 0;
  }
  
  /**
   * Get upper bound (VB6 compatibility)
   */
  UBound(): number {
    return this.length - 1;
  }
  
  /**
   * Get item at index
   */
  Item(index: number): T | undefined {
    return this[index];
  }
}

/**
 * Decorator for optional parameters
 */
export function OptionalParam(defaultValue?: any) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingParams: VB6ParameterInfo[] = 
      Reflect.getOwnMetadata('optionalParams', target, propertyKey) || [];
    
    existingParams[parameterIndex] = {
      name: `param${parameterIndex}`,
      type: 'Variant',
      optional: true,
      defaultValue
    };
    
    Reflect.defineMetadata('optionalParams', existingParams, target, propertyKey);
  };
}

/**
 * Decorator for ParamArray
 */
export function ParamArray(target: any, propertyKey: string | symbol, parameterIndex: number) {
  const existingParams: VB6ParameterInfo[] = 
    Reflect.getOwnMetadata('paramArray', target, propertyKey) || [];
  
  existingParams[parameterIndex] = {
    name: `paramArray`,
    type: 'Variant',
    paramArray: true
  };
  
  Reflect.defineMetadata('paramArray', existingParams, target, propertyKey);
}

/**
 * Function builder with VB6-style parameters
 */
export class VB6Function {
  private signature: VB6FunctionSignature;
  private implementation: Function;
  
  constructor(name: string) {
    this.signature = {
      name,
      parameters: []
    };
    this.implementation = () => {};
  }
  
  /**
   * Add required parameter
   */
  param(name: string, type: string = 'Variant', byRef: boolean = false): this {
    this.signature.parameters.push({
      name,
      type,
      byRef,
      byVal: !byRef
    });
    return this;
  }
  
  /**
   * Add optional parameter
   */
  optionalParam(name: string, defaultValue?: any, type: string = 'Variant'): this {
    this.signature.parameters.push({
      name,
      type,
      optional: true,
      defaultValue
    });
    return this;
  }
  
  /**
   * Add ParamArray
   */
  paramArray(name: string = 'args'): this {
    this.signature.parameters.push({
      name,
      type: 'Variant',
      paramArray: true
    });
    return this;
  }
  
  /**
   * Set return type
   */
  returns(type: string): this {
    this.signature.returnType = type;
    return this;
  }
  
  /**
   * Set implementation
   */
  implement(fn: Function): this {
    this.implementation = fn;
    return this;
  }
  
  /**
   * Build the function
   */
  build(): Function {
    return OptionalParamsManager.createWrapper(this.implementation, this.signature);
  }
}

/**
 * Example VB6 Functions with Optional Parameters
 */

// Example: MsgBox with optional parameters
export const MsgBox = new VB6Function('MsgBox')
  .param('prompt', 'String')
  .optionalParam('buttons', 0, 'Integer')
  .optionalParam('title', '', 'String')
  .optionalParam('helpfile', '', 'String')
  .optionalParam('context', 0, 'Integer')
  .returns('Integer')
  .implement((prompt: string, buttons?: number, title?: string, helpfile?: string, context?: number) => {
    const actualButtons = GetParamValue(buttons, 0);
    const actualTitle = GetParamValue(title, 'Message');
    
    if (typeof window !== 'undefined') {
      // Simple browser implementation
      if (actualButtons === 4) { // vbYesNo
        return confirm(`${actualTitle}\n\n${prompt}`) ? 6 : 7; // vbYes : vbNo
      } else {
        alert(`${actualTitle}\n\n${prompt}`);
        return 1; // vbOK
      }
    } else {
      console.log(`[MsgBox] ${actualTitle}: ${prompt}`);
      return 1;
    }
  })
  .build();

// Example: Format function with optional parameters
export const Format = new VB6Function('Format')
  .param('expression', 'Variant')
  .optionalParam('format', '', 'String')
  .optionalParam('firstDayOfWeek', 1, 'Integer')
  .optionalParam('firstWeekOfYear', 1, 'Integer')
  .returns('String')
  .implement((expression: any, format?: string, firstDayOfWeek?: number, firstWeekOfYear?: number) => {
    const actualFormat = GetParamValue(format, '');
    
    if (!actualFormat) {
      return String(expression);
    }
    
    // Simple format implementation
    if (expression instanceof Date) {
      // Date formatting
      const options: Intl.DateTimeFormatOptions = {};
      
      if (actualFormat.toLowerCase() === 'short date') {
        return expression.toLocaleDateString();
      } else if (actualFormat.toLowerCase() === 'long date') {
        options.dateStyle = 'full';
        return expression.toLocaleDateString(undefined, options);
      } else if (actualFormat.toLowerCase() === 'short time') {
        return expression.toLocaleTimeString();
      }
    } else if (typeof expression === 'number') {
      // Number formatting
      if (actualFormat === 'Currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(expression);
      } else if (actualFormat === 'Percent') {
        return (expression * 100).toFixed(2) + '%';
      }
    }
    
    return String(expression);
  })
  .build();

// Example: Sum function with ParamArray
export const Sum = new VB6Function('Sum')
  .paramArray('numbers')
  .returns('Double')
  .implement((numbers: VB6ParamArray<number>) => {
    return numbers.reduce((acc, val) => acc + val, 0);
  })
  .build();

// Example: Join function with optional delimiter
export const Join = new VB6Function('Join')
  .param('sourceArray', 'Variant')
  .optionalParam('delimiter', ' ', 'String')
  .returns('String')
  .implement((sourceArray: any[], delimiter?: string) => {
    const actualDelimiter = GetParamValue(delimiter, ' ');
    return sourceArray.join(actualDelimiter);
  })
  .build();

/**
 * Example class using optional parameters
 */
export class VB6OptionalParamsExample {
  /**
   * Example method with optional parameters
   */
  openFile(
    filename: string,
    mode: string = 'Read',
    access?: string,
    lockMode?: string
  ): void {
    const actualAccess = GetParamValue(access, 'ReadWrite');
    const actualLockMode = GetParamValue(lockMode, 'Shared');
    
    console.log(`Opening file: ${filename}`);
    console.log(`Mode: ${mode}`);
    console.log(`Access: ${actualAccess}`);
    console.log(`Lock: ${actualLockMode}`);
  }
  
  /**
   * Example method with ParamArray
   */
  concatenate(separator: string, ...values: any[]): string {
    const paramArray = new VB6ParamArray(...values);
    
    if (paramArray.IsEmpty) {
      return '';
    }
    
    return paramArray.join(separator);
  }
  
  /**
   * Example method demonstrating IsMissing
   */
  processData(
    data: any,
    filter?: string,
    sort?: boolean,
    limit?: number
  ): any[] {
    console.log(`Filter missing: ${IsMissing(filter)}`);
    console.log(`Sort missing: ${IsMissing(sort)}`);
    console.log(`Limit missing: ${IsMissing(limit)}`);
    
    let result = Array.isArray(data) ? data : [data];
    
    // Apply filter if provided
    if (!IsMissing(filter)) {
      result = result.filter(item => String(item).includes(filter));
    }
    
    // Apply sort if provided
    if (!IsMissing(sort) && sort) {
      result.sort();
    }
    
    // Apply limit if provided
    if (!IsMissing(limit)) {
      result = result.slice(0, limit);
    }
    
    return result;
  }
}

// Export all optional parameter functionality
export const VB6OptionalParameters = {
  VB6Missing,
  Missing,
  VB6OptionalParamsManager,
  OptionalParamsManager,
  IsMissing,
  GetParamValue,
  Optional,
  VB6ParamArray,
  OptionalParam,
  ParamArray,
  VB6Function,
  MsgBox,
  Format,
  Sum,
  Join,
  VB6OptionalParamsExample
};