/**
 * VB6 Comprehensive Math Functions
 * Complete implementation of all VB6 mathematical functions
 */

// ============================================================================
// Basic Math Functions
// ============================================================================

/**
 * Abs - Returns absolute value
 */
export function Abs(number: number): number {
  return Math.abs(number);
}

/**
 * Sgn - Returns sign of number
 */
export function Sgn(number: number): number {
  if (number > 0) return 1;
  if (number < 0) return -1;
  return 0;
}

/**
 * Int - Returns integer portion (floor)
 */
export function Int(number: number): number {
  return Math.floor(number);
}

/**
 * Fix - Returns integer portion (truncate toward zero)
 */
export function Fix(number: number): number {
  return Math.trunc(number);
}

/**
 * Round - Banker's rounding (round half to even)
 */
export function Round(number: number, numDecimalPlaces?: number): number {
  const places = numDecimalPlaces || 0;
  const multiplier = Math.pow(10, places);
  const shifted = number * multiplier;
  const truncated = Math.trunc(shifted);
  const decimal = shifted - truncated;

  // Banker's rounding: round 0.5 to nearest even
  if (Math.abs(decimal) === 0.5) {
    if (truncated % 2 === 0) {
      return truncated / multiplier;
    } else {
      return (truncated + (number >= 0 ? 1 : -1)) / multiplier;
    }
  }

  return Math.round(shifted) / multiplier;
}

/**
 * Sqr - Square root
 */
export function Sqr(number: number): number {
  if (number < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return Math.sqrt(number);
}

/**
 * Exp - e raised to power
 */
export function Exp(number: number): number {
  return Math.exp(number);
}

/**
 * Log - Natural logarithm
 */
export function Log(number: number): number {
  if (number <= 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return Math.log(number);
}

/**
 * Log10 - Base 10 logarithm (extension)
 */
export function Log10(number: number): number {
  if (number <= 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return Math.log10(number);
}

// ============================================================================
// Trigonometric Functions
// ============================================================================

/**
 * Sin - Sine (angle in radians)
 */
export function Sin(number: number): number {
  return Math.sin(number);
}

/**
 * Cos - Cosine (angle in radians)
 */
export function Cos(number: number): number {
  return Math.cos(number);
}

/**
 * Tan - Tangent (angle in radians)
 */
export function Tan(number: number): number {
  return Math.tan(number);
}

/**
 * Atn - Arctangent (returns radians)
 */
export function Atn(number: number): number {
  return Math.atan(number);
}

/**
 * Atn2 - Arctangent of y/x (extension, returns radians)
 */
export function Atn2(y: number, x: number): number {
  return Math.atan2(y, x);
}

/**
 * ASin - Arcsine (extension, returns radians)
 */
export function ASin(number: number): number {
  if (number < -1 || number > 1) {
    throw new Error('Invalid procedure call or argument');
  }
  return Math.asin(number);
}

/**
 * ACos - Arccosine (extension, returns radians)
 */
export function ACos(number: number): number {
  if (number < -1 || number > 1) {
    throw new Error('Invalid procedure call or argument');
  }
  return Math.acos(number);
}

/**
 * Sinh - Hyperbolic sine (extension)
 */
export function Sinh(number: number): number {
  return Math.sinh(number);
}

/**
 * Cosh - Hyperbolic cosine (extension)
 */
export function Cosh(number: number): number {
  return Math.cosh(number);
}

/**
 * Tanh - Hyperbolic tangent (extension)
 */
export function Tanh(number: number): number {
  return Math.tanh(number);
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Degrees - Convert radians to degrees (extension)
 */
export function Degrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Radians - Convert degrees to radians (extension)
 */
export function Radians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================================================
// Random Number Functions
// ============================================================================

// Random number generator state
let randomSeed = Date.now();

/**
 * Randomize - Initialize random number generator
 */
export function Randomize(number?: number): void {
  if (number !== undefined) {
    randomSeed = number;
  } else {
    randomSeed = Date.now();
  }
}

/**
 * Rnd - Generate random number
 */
export function Rnd(number?: number): number {
  if (number !== undefined) {
    if (number < 0) {
      // Same seed produces same sequence
      randomSeed = Math.abs(number);
    } else if (number === 0) {
      // Return previous number (simplified - just use current seed)
      // In real VB6, this returns the most recently generated number
    }
    // number > 0 or undefined: generate next number
  }

  // Linear congruential generator (simplified)
  randomSeed = (randomSeed * 1103515245 + 12345) & 0x7fffffff;
  return randomSeed / 0x7fffffff;
}

/**
 * RandomInt - Generate random integer in range (extension)
 */
export function RandomInt(min: number, max: number): number {
  return Math.floor(Rnd() * (max - min + 1)) + min;
}

// ============================================================================
// Financial Functions
// ============================================================================

/**
 * Pmt - Payment for a loan
 */
export function Pmt(
  rate: number,
  nper: number,
  pv: number,
  fv?: number,
  type?: number
): number {
  const futureValue = fv || 0;
  const paymentType = type || 0;

  if (rate === 0) {
    return -(pv + futureValue) / nper;
  }

  const pvif = Math.pow(1 + rate, nper);
  let pmt = (rate * (pv * pvif + futureValue)) / (pvif - 1);

  if (paymentType === 1) {
    pmt = pmt / (1 + rate);
  }

  return -pmt;
}

/**
 * PV - Present value
 */
export function PV(
  rate: number,
  nper: number,
  pmt: number,
  fv?: number,
  type?: number
): number {
  const futureValue = fv || 0;
  const paymentType = type || 0;

  if (rate === 0) {
    return -pmt * nper - futureValue;
  }

  const pvif = Math.pow(1 + rate, nper);
  let present = (-pmt * (pvif - 1) / rate - futureValue) / pvif;

  if (paymentType === 1) {
    present = present * (1 + rate);
  }

  return present;
}

/**
 * FV - Future value
 */
export function FV(
  rate: number,
  nper: number,
  pmt: number,
  pv?: number,
  type?: number
): number {
  const presentValue = pv || 0;
  const paymentType = type || 0;

  if (rate === 0) {
    return -presentValue - pmt * nper;
  }

  const pvif = Math.pow(1 + rate, nper);
  let future: number;

  if (paymentType === 1) {
    future = -presentValue * pvif - pmt * (1 + rate) * (pvif - 1) / rate;
  } else {
    future = -presentValue * pvif - pmt * (pvif - 1) / rate;
  }

  return future;
}

/**
 * NPer - Number of periods
 */
export function NPer(
  rate: number,
  pmt: number,
  pv: number,
  fv?: number,
  type?: number
): number {
  const futureValue = fv || 0;
  const paymentType = type || 0;

  if (rate === 0) {
    return -(pv + futureValue) / pmt;
  }

  const pmtAdj = paymentType === 1 ? pmt * (1 + rate) : pmt;
  const num = pmtAdj - futureValue * rate;
  const den = pv * rate + pmtAdj;

  return Math.log(num / den) / Math.log(1 + rate);
}

/**
 * Rate - Interest rate per period
 */
export function Rate(
  nper: number,
  pmt: number,
  pv: number,
  fv?: number,
  type?: number,
  guess?: number
): number {
  const futureValue = fv || 0;
  const paymentType = type || 0;
  let rate = guess || 0.1;

  const maxIterations = 100;
  const tolerance = 1e-10;

  for (let i = 0; i < maxIterations; i++) {
    const calculatedFV = FV(rate, nper, pmt, pv, paymentType);
    const diff = calculatedFV - futureValue;

    if (Math.abs(diff) < tolerance) {
      return rate;
    }

    // Newton-Raphson method (simplified derivative)
    const delta = 0.0001;
    const fvPlus = FV(rate + delta, nper, pmt, pv, paymentType);
    const derivative = (fvPlus - calculatedFV) / delta;

    if (derivative === 0) break;

    rate = rate - diff / derivative;
  }

  return rate;
}

/**
 * NPV - Net present value
 */
export function NPV(rate: number, ...values: number[]): number {
  let npv = 0;
  for (let i = 0; i < values.length; i++) {
    npv += values[i] / Math.pow(1 + rate, i + 1);
  }
  return npv;
}

/**
 * IRR - Internal rate of return
 */
export function IRR(values: number[], guess?: number): number {
  let rate = guess || 0.1;
  const maxIterations = 100;
  const tolerance = 1e-10;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < values.length; j++) {
      const factor = Math.pow(1 + rate, j);
      npv += values[j] / factor;
      dnpv -= j * values[j] / (factor * (1 + rate));
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (dnpv === 0) break;

    rate = rate - npv / dnpv;
  }

  throw new Error('IRR did not converge');
}

/**
 * MIRR - Modified internal rate of return
 */
export function MIRR(
  values: number[],
  financeRate: number,
  reinvestRate: number
): number {
  const n = values.length;
  let positiveValue = 0;
  let negativeValue = 0;

  for (let i = 0; i < n; i++) {
    if (values[i] >= 0) {
      positiveValue += values[i] * Math.pow(1 + reinvestRate, n - 1 - i);
    } else {
      negativeValue += values[i] / Math.pow(1 + financeRate, i);
    }
  }

  if (negativeValue === 0 || positiveValue === 0) {
    throw new Error('MIRR requires at least one positive and one negative value');
  }

  return Math.pow(-positiveValue / negativeValue, 1 / (n - 1)) - 1;
}

/**
 * IPmt - Interest payment for a period
 */
export function IPmt(
  rate: number,
  per: number,
  nper: number,
  pv: number,
  fv?: number,
  type?: number
): number {
  const payment = Pmt(rate, nper, pv, fv, type);
  const presentValue = PV(rate, per - 1, payment, 0, type);
  return presentValue * rate;
}

/**
 * PPmt - Principal payment for a period
 */
export function PPmt(
  rate: number,
  per: number,
  nper: number,
  pv: number,
  fv?: number,
  type?: number
): number {
  const payment = Pmt(rate, nper, pv, fv, type);
  const interest = IPmt(rate, per, nper, pv, fv, type);
  return payment - interest;
}

/**
 * SLN - Straight-line depreciation
 */
export function SLN(cost: number, salvage: number, life: number): number {
  return (cost - salvage) / life;
}

/**
 * SYD - Sum-of-years-digits depreciation
 */
export function SYD(
  cost: number,
  salvage: number,
  life: number,
  period: number
): number {
  const depreciable = cost - salvage;
  const sumYears = (life * (life + 1)) / 2;
  return depreciable * (life - period + 1) / sumYears;
}

/**
 * DDB - Double-declining balance depreciation
 */
export function DDB(
  cost: number,
  salvage: number,
  life: number,
  period: number,
  factor?: number
): number {
  const declineFactor = factor || 2;
  const rate = declineFactor / life;
  let totalDepreciation = 0;
  let currentValue = cost;

  for (let i = 1; i <= period; i++) {
    let depreciation = currentValue * rate;
    if (currentValue - depreciation < salvage) {
      depreciation = currentValue - salvage;
    }
    if (i === period) {
      return depreciation;
    }
    totalDepreciation += depreciation;
    currentValue -= depreciation;
  }

  return 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Min - Minimum of values (extension)
 */
export function Min(...values: number[]): number {
  return Math.min(...values);
}

/**
 * Max - Maximum of values (extension)
 */
export function Max(...values: number[]): number {
  return Math.max(...values);
}

/**
 * Mod - Modulo operation
 */
export function Mod(dividend: number, divisor: number): number {
  if (divisor === 0) {
    throw new Error('Division by zero');
  }
  return dividend % divisor;
}

/**
 * Power - Raise to power (extension for x^y)
 */
export function Power(base: number, exponent: number): number {
  return Math.pow(base, exponent);
}

/**
 * Ceiling - Round up to nearest integer (extension)
 */
export function Ceiling(number: number): number {
  return Math.ceil(number);
}

/**
 * Floor - Round down to nearest integer (extension)
 */
export function Floor(number: number): number {
  return Math.floor(number);
}

/**
 * Truncate - Remove decimal portion (extension)
 */
export function Truncate(number: number): number {
  return Math.trunc(number);
}

/**
 * IsNaN - Check if value is Not a Number (extension)
 */
export function IsNaN(value: any): boolean {
  return Number.isNaN(value);
}

/**
 * IsFinite - Check if value is finite (extension)
 */
export function IsFinite(value: any): boolean {
  return Number.isFinite(value);
}

// ============================================================================
// Constants
// ============================================================================

export const PI = Math.PI;
export const E = Math.E;
export const LN2 = Math.LN2;
export const LN10 = Math.LN10;
export const LOG2E = Math.LOG2E;
export const LOG10E = Math.LOG10E;
export const SQRT2 = Math.SQRT2;
export const SQRT1_2 = Math.SQRT1_2;

// ============================================================================
// Export all functions
// ============================================================================

export const VB6MathFunctions = {
  // Basic
  Abs,
  Sgn,
  Int,
  Fix,
  Round,
  Sqr,
  Exp,
  Log,
  Log10,

  // Trigonometric
  Sin,
  Cos,
  Tan,
  Atn,
  Atn2,
  ASin,
  ACos,
  Sinh,
  Cosh,
  Tanh,

  // Conversion
  Degrees,
  Radians,

  // Random
  Randomize,
  Rnd,
  RandomInt,

  // Financial
  Pmt,
  PV,
  FV,
  NPer,
  Rate,
  NPV,
  IRR,
  MIRR,
  IPmt,
  PPmt,
  SLN,
  SYD,
  DDB,

  // Utility
  Min,
  Max,
  Mod,
  Power,
  Ceiling,
  Floor,
  Truncate,
  IsNaN,
  IsFinite,

  // Constants
  PI,
  E,
  LN2,
  LN10,
  LOG2E,
  LOG10E,
  SQRT2,
  SQRT1_2
};

export default VB6MathFunctions;
