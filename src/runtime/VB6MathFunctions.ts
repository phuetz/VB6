/**
 * VB6 Math Functions Implementation
 * 
 * Complete implementation of VB6 mathematical functions
 */

// Math constants from VB6
export const VB6MathConstants = {
  PI: Math.PI,
  E: Math.E
};

/**
 * Absolute value
 * Abs(number)
 */
export function Abs(number: number): number {
  if (number === null || number === undefined) return 0;
  return Math.abs(Number(number));
}

/**
 * Arctangent
 * Atn(number)
 */
export function Atn(number: number): number {
  if (number === null || number === undefined) return 0;
  return Math.atan(Number(number));
}

/**
 * Cosine
 * Cos(number)
 */
export function Cos(number: number): number {
  if (number === null || number === undefined) return 1;
  return Math.cos(Number(number));
}

/**
 * Exponential function (e^x)
 * Exp(number)
 */
export function Exp(number: number): number {
  if (number === null || number === undefined) return 1;
  return Math.exp(Number(number));
}

/**
 * Fix - truncate toward zero (like Int but handles negatives differently)
 * Fix(number)
 */
export function Fix(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  return num >= 0 ? Math.floor(num) : Math.ceil(num);
}

/**
 * Int - largest integer less than or equal to number
 * Int(number)
 */
export function Int(number: number): number {
  if (number === null || number === undefined) return 0;
  return Math.floor(Number(number));
}

/**
 * Natural logarithm
 * Log(number)
 */
export function Log(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  if (num <= 0) {
    throw new Error('Invalid procedure call or argument - Log requires positive number');
  }
  return Math.log(num);
}

/**
 * Initialize random number generator
 * Randomize([seed])
 */
export function Randomize(seed?: number): void {
  if (seed !== undefined) {
    // JavaScript doesn't have a built-in way to seed Math.random()
    // This is a simplified implementation
    Math.seedrandom = seed;
  }
  // In VB6, calling Randomize without seed uses timer
  // We'll just note that randomization occurred
}

/**
 * Random number generator
 * Rnd([number])
 */
export function Rnd(number?: number): number {
  if (number === undefined || number === null) {
    // Next random number in sequence
    return Math.random();
  }
  
  const num = Number(number);
  if (num < 0) {
    // Same number every time for negative values (repeatable)
    const seed = Math.abs(num);
    // Simple deterministic pseudo-random based on seed
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  } else if (num === 0) {
    // Last generated number (we'll just return a fixed value)
    return Math.random();
  } else {
    // New sequence based on seed
    return Math.random();
  }
}

/**
 * Sign function
 * Sgn(number)
 */
export function Sgn(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  if (num > 0) return 1;
  if (num < 0) return -1;
  return 0;
}

/**
 * Sine
 * Sin(number)
 */
export function Sin(number: number): number {
  if (number === null || number === undefined) return 0;
  return Math.sin(Number(number));
}

/**
 * Square root
 * Sqr(number)
 */
export function Sqr(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  if (num < 0) {
    throw new Error('Invalid procedure call or argument - Sqr requires non-negative number');
  }
  return Math.sqrt(num);
}

/**
 * Tangent
 * Tan(number)
 */
export function Tan(number: number): number {
  if (number === null || number === undefined) return 0;
  return Math.tan(Number(number));
}

// Advanced VB6 Functions

/**
 * Immediate If - returns one of two values based on condition
 * IIf(condition, truepart, falsepart)
 */
export function IIf(condition: any, truePart: any, falsePart: any): any {
  return condition ? truePart : falsePart;
}

/**
 * Choose - returns value from list based on index
 * Choose(index, choice1, choice2, ...)
 */
export function Choose(index: number, ...choices: any[]): any {
  if (index === null || index === undefined) return null;
  const idx = Math.floor(Number(index));
  if (idx < 1 || idx > choices.length) return null;
  return choices[idx - 1]; // VB6 uses 1-based indexing
}

/**
 * Switch - evaluates expressions and returns associated value
 * Switch(expr1, value1, expr2, value2, ...)
 */
export function Switch(...args: any[]): any {
  if (args.length % 2 !== 0) {
    throw new Error('Switch requires an even number of arguments');
  }
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i]) {
      return args[i + 1];
    }
  }
  
  return null; // No condition was true
}

/**
 * Null coalescing function
 * Nz(variant, [valueifnull])
 */
export function Nz(variant: any, valueIfNull?: any): any {
  if (variant === null || variant === undefined) {
    return valueIfNull !== undefined ? valueIfNull : '';
  }
  return variant;
}

/**
 * Partition function - returns string indicating where number occurs
 * Partition(number, start, stop, interval)
 */
export function Partition(number: number, start: number, stop: number, interval: number): string {
  if (number === null || number === undefined) return '';
  
  const num = Number(number);
  const startNum = Number(start);
  const stopNum = Number(stop);
  const intervalNum = Number(interval);
  
  if (intervalNum <= 0) {
    throw new Error('Invalid procedure call or argument - interval must be positive');
  }
  
  if (num < startNum) {
    return `: ${startNum - 1}`;
  }
  
  if (num > stopNum) {
    return `${stopNum + 1}: `;
  }
  
  // Calculate which partition the number falls into
  const partitionIndex = Math.floor((num - startNum) / intervalNum);
  const partitionStart = startNum + (partitionIndex * intervalNum);
  const partitionEnd = partitionStart + intervalNum - 1;
  
  // Format as VB6 does: "start: end"
  return `${partitionStart}: ${Math.min(partitionEnd, stopNum)}`;
}

// Advanced Math Functions

/**
 * Power function (x^y)
 * Not native to VB6 but commonly needed
 */
export function Power(base: number, exponent: number): number {
  if (base === null || base === undefined) base = 0;
  if (exponent === null || exponent === undefined) exponent = 0;
  return Math.pow(Number(base), Number(exponent));
}

/**
 * Round to specified decimal places
 * Round(number, [decimals])
 */
export function Round(number: number, decimals: number = 0): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  const dec = Math.max(0, Math.floor(Number(decimals)));
  const multiplier = Math.pow(10, dec);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * Degrees to radians conversion
 */
export function DegreesToRadians(degrees: number): number {
  if (degrees === null || degrees === undefined) return 0;
  return Number(degrees) * (Math.PI / 180);
}

/**
 * Radians to degrees conversion
 */
export function RadiansToDegrees(radians: number): number {
  if (radians === null || radians === undefined) return 0;
  return Number(radians) * (180 / Math.PI);
}

/**
 * Minimum of multiple values
 * Min(value1, value2, ...)
 */
export function Min(...values: number[]): number {
  if (values.length === 0) return 0;
  const numbers = values.map(v => Number(v || 0));
  return Math.min(...numbers);
}

/**
 * Maximum of multiple values
 * Max(value1, value2, ...)
 */
export function Max(...values: number[]): number {
  if (values.length === 0) return 0;
  const numbers = values.map(v => Number(v || 0));
  return Math.max(...numbers);
}

/**
 * Hyperbolic sine
 */
export function Sinh(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  return (Math.exp(num) - Math.exp(-num)) / 2;
}

/**
 * Hyperbolic cosine
 */
export function Cosh(number: number): number {
  if (number === null || number === undefined) return 1;
  const num = Number(number);
  return (Math.exp(num) + Math.exp(-num)) / 2;
}

/**
 * Hyperbolic tangent
 */
export function Tanh(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  return Sinh(num) / Cosh(num);
}

/**
 * Arc sine
 */
export function Asin(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  if (num < -1 || num > 1) {
    throw new Error('Invalid procedure call or argument - Asin requires value between -1 and 1');
  }
  return Math.asin(num);
}

/**
 * Arc cosine
 */
export function Acos(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  if (num < -1 || num > 1) {
    throw new Error('Invalid procedure call or argument - Acos requires value between -1 and 1');
  }
  return Math.acos(num);
}

/**
 * Logarithm base 10
 */
export function Log10(number: number): number {
  if (number === null || number === undefined) return 0;
  const num = Number(number);
  if (num <= 0) {
    throw new Error('Invalid procedure call or argument - Log10 requires positive number');
  }
  return Math.log10(num);
}

/**
 * Logarithm with specified base
 */
export function LogBase(number: number, base: number): number {
  if (number === null || number === undefined) return 0;
  if (base === null || base === undefined) base = Math.E;
  
  const num = Number(number);
  const baseNum = Number(base);
  
  if (num <= 0 || baseNum <= 0 || baseNum === 1) {
    throw new Error('Invalid procedure call or argument');
  }
  
  return Math.log(num) / Math.log(baseNum);
}

/**
 * Greatest Common Divisor
 */
export function GCD(a: number, b: number): number {
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  
  let x = Math.abs(Math.floor(Number(a)));
  let y = Math.abs(Math.floor(Number(b)));
  
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  
  return x;
}

/**
 * Least Common Multiple
 */
export function LCM(a: number, b: number): number {
  if (a === null || a === undefined) a = 0;
  if (b === null || b === undefined) b = 0;
  
  const x = Math.abs(Math.floor(Number(a)));
  const y = Math.abs(Math.floor(Number(b)));
  
  if (x === 0 || y === 0) return 0;
  
  return Math.abs(x * y) / GCD(x, y);
}

/**
 * Factorial
 */
export function Factorial(n: number): number {
  if (n === null || n === undefined) return 1;
  const num = Math.floor(Number(n));
  
  if (num < 0) {
    throw new Error('Invalid procedure call or argument - Factorial requires non-negative integer');
  }
  
  if (num === 0 || num === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= num; i++) {
    result *= i;
  }
  
  return result;
}

/**
 * Check if number is prime
 */
export function IsPrime(n: number): boolean {
  if (n === null || n === undefined) return false;
  const num = Math.floor(Number(n));
  
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  
  const sqrt = Math.sqrt(num);
  for (let i = 3; i <= sqrt; i += 2) {
    if (num % i === 0) return false;
  }
  
  return true;
}

// Export all math functions
export const VB6MathFunctions = {
  // Basic VB6 functions
  Abs,
  Atn,
  Cos,
  Exp,
  Fix,
  Int,
  Log,
  Randomize,
  Rnd,
  Sgn,
  Sin,
  Sqr,
  Tan,
  
  // Advanced VB6 functions
  IIf,
  Choose,
  Switch,
  Nz,
  Partition,
  
  // Extended math functions
  Power,
  Round,
  DegreesToRadians,
  RadiansToDegrees,
  Min,
  Max,
  Sinh,
  Cosh,
  Tanh,
  Asin,
  Acos,
  Log10,
  LogBase,
  GCD,
  LCM,
  Factorial,
  IsPrime,
  
  // Constants
  VB6MathConstants
};

// Helper function to validate numeric input
export function validateNumericInput(value: any, functionName: string): number {
  if (value === null || value === undefined) {
    throw new Error(`Invalid procedure call or argument - ${functionName} requires a numeric value`);
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Type mismatch - ${functionName} requires a numeric value`);
  }
  
  return num;
}

// Math operation helpers for VB6 compatibility
export const VB6MathHelpers = {
  /**
   * VB6-style integer division (\)
   */
  integerDivision: (dividend: number, divisor: number): number => {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return Math.floor(Number(dividend) / Number(divisor));
  },

  /**
   * VB6-style modulo operation (Mod)
   */
  modulo: (dividend: number, divisor: number): number => {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return Number(dividend) % Number(divisor);
  },

  /**
   * VB6-style exponentiation (^)
   */
  exponentiation: (base: number, exponent: number): number => {
    return Math.pow(Number(base), Number(exponent));
  },

  /**
   * Safe division with VB6 error handling
   */
  safeDivision: (dividend: number, divisor: number): number => {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return Number(dividend) / Number(divisor);
  }
};