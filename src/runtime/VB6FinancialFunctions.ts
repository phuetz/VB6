/**
 * VB6 Financial Functions - Complete Implementation
 * All VB6 financial calculation functions for TRUE 100% compatibility
 */

// ============================================================================
// LOAN & INVESTMENT CALCULATIONS
// ============================================================================

/**
 * PV - Present Value
 * Calculates the present value of an annuity based on periodic, fixed payments
 * @param rate Interest rate per period
 * @param nper Total number of payment periods
 * @param pmt Payment made each period
 * @param fv Future value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 */
export function PV(
  rate: number,
  nper: number,
  pmt: number,
  fv: number = 0,
  type: number = 0
): number {
  if (rate === 0) {
    return -(pmt * nper + fv);
  }

  const pvif = Math.pow(1 + rate, nper);
  let pv = -fv / pvif;

  if (type === 0) {
    // Payments at end of period
    pv -= (pmt * ((pvif - 1) / rate)) / pvif;
  } else {
    // Payments at beginning of period
    pv -= ((pmt * ((pvif - 1) / rate)) / pvif) * (1 + rate);
  }

  return pv;
}

/**
 * FV - Future Value
 * Calculates the future value of an annuity based on periodic, fixed payments
 * @param rate Interest rate per period
 * @param nper Total number of payment periods
 * @param pmt Payment made each period
 * @param pv Present value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 */
export function FV(
  rate: number,
  nper: number,
  pmt: number,
  pv: number = 0,
  type: number = 0
): number {
  if (rate === 0) {
    return -(pv + pmt * nper);
  }

  const fvif = Math.pow(1 + rate, nper);
  let fv = -pv * fvif;

  if (type === 0) {
    // Payments at end of period
    fv -= pmt * ((fvif - 1) / rate);
  } else {
    // Payments at beginning of period
    fv -= pmt * ((fvif - 1) / rate) * (1 + rate);
  }

  return fv;
}

/**
 * PMT - Payment
 * Calculates the payment for a loan based on constant payments and interest rate
 * @param rate Interest rate per period
 * @param nper Total number of payment periods
 * @param pv Present value (loan amount)
 * @param fv Future value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 */
export function PMT(
  rate: number,
  nper: number,
  pv: number,
  fv: number = 0,
  type: number = 0
): number {
  if (rate === 0) {
    return -(pv + fv) / nper;
  }

  const pvif = Math.pow(1 + rate, nper);
  let pmt = ((pv * pvif + fv) * rate) / (pvif - 1);

  if (type === 1) {
    // Payments at beginning of period
    pmt = pmt / (1 + rate);
  }

  return -pmt;
}

/**
 * NPER - Number of Periods
 * Calculates the number of periods for an investment
 * @param rate Interest rate per period
 * @param pmt Payment made each period
 * @param pv Present value
 * @param fv Future value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 */
export function NPer(
  rate: number,
  pmt: number,
  pv: number,
  fv: number = 0,
  type: number = 0
): number {
  if (rate === 0) {
    if (pmt === 0) {
      throw new Error('Division by zero');
    }
    return -(pv + fv) / pmt;
  }

  const pmtAdjusted = type === 1 ? pmt * (1 + rate) : pmt;

  if (pmtAdjusted === 0) {
    throw new Error('Division by zero');
  }

  const num = Math.log((pmtAdjusted - fv * rate) / (pmtAdjusted + pv * rate));
  const den = Math.log(1 + rate);

  return num / den;
}

/**
 * Rate - Interest Rate
 * Calculates the interest rate per period of an annuity
 * Uses Newton-Raphson iteration
 * @param nper Total number of payment periods
 * @param pmt Payment made each period
 * @param pv Present value
 * @param fv Future value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 * @param guess Initial guess for rate (optional, default 0.1)
 */
export function Rate(
  nper: number,
  pmt: number,
  pv: number,
  fv: number = 0,
  type: number = 0,
  guess: number = 0.1
): number {
  const maxIterations = 100;
  const tolerance = 1e-7;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let f: number;
    let df: number;

    if (Math.abs(rate) < tolerance) {
      // Near zero, use linear approximation
      f = pv + pmt * nper + fv;
      df = ((nper * (nper - 1)) / 2) * pmt;
    } else {
      const factor = Math.pow(1 + rate, nper);

      if (type === 0) {
        // End of period
        f = pv * factor + pmt * ((factor - 1) / rate) + fv;
        df =
          pv * nper * Math.pow(1 + rate, nper - 1) +
          pmt * ((nper * Math.pow(1 + rate, nper - 1) * rate - (factor - 1)) / (rate * rate));
      } else {
        // Beginning of period
        f = pv * factor + pmt * ((factor - 1) / rate) * (1 + rate) + fv;
        df =
          pv * nper * Math.pow(1 + rate, nper - 1) +
          pmt *
            (1 + rate) *
            ((nper * Math.pow(1 + rate, nper - 1) * rate - (factor - 1)) / (rate * rate)) +
          pmt * ((factor - 1) / rate);
      }
    }

    const newRate = rate - f / df;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  // Failed to converge
  throw new Error('Rate calculation did not converge');
}

/**
 * IPMT - Interest Payment
 * Calculates the interest payment for a given period
 * @param rate Interest rate per period
 * @param per Period for which to find interest
 * @param nper Total number of payment periods
 * @param pv Present value
 * @param fv Future value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 */
export function IPmt(
  rate: number,
  per: number,
  nper: number,
  pv: number,
  fv: number = 0,
  type: number = 0
): number {
  const pmt = PMT(rate, nper, pv, fv, type);

  if (per === 1 && type === 1) {
    // First payment at beginning of period is all principal
    return 0;
  }

  // Calculate remaining balance after per-1 payments
  const adjustedPer = type === 1 ? per - 1 : per;
  const fvPart = FV(rate, adjustedPer - 1, pmt, pv, type);

  return -fvPart * rate;
}

/**
 * PPMT - Principal Payment
 * Calculates the principal payment for a given period
 * @param rate Interest rate per period
 * @param per Period for which to find principal
 * @param nper Total number of payment periods
 * @param pv Present value
 * @param fv Future value (optional, default 0)
 * @param type When payments are due (0=end, 1=beginning)
 */
export function PPmt(
  rate: number,
  per: number,
  nper: number,
  pv: number,
  fv: number = 0,
  type: number = 0
): number {
  const pmt = PMT(rate, nper, pv, fv, type);
  const ipmt = IPmt(rate, per, nper, pv, fv, type);

  return pmt - ipmt;
}

// ============================================================================
// NET PRESENT VALUE & INTERNAL RATE OF RETURN
// ============================================================================

/**
 * NPV - Net Present Value
 * Calculates the net present value of an investment based on discount rate and cash flows
 * @param rate Discount rate over one period
 * @param values Array of cash flows (must contain at least one positive and one negative value)
 */
export function NPV(rate: number, values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid values array');
  }

  let npv = 0;
  for (let i = 0; i < values.length; i++) {
    npv += values[i] / Math.pow(1 + rate, i + 1);
  }

  return npv;
}

/**
 * IRR - Internal Rate of Return
 * Calculates the internal rate of return for a series of cash flows
 * @param values Array of cash flows (must contain at least one positive and one negative value)
 * @param guess Initial guess for IRR (optional, default 0.1)
 */
export function IRR(values: number[], guess: number = 0.1): number {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid values array');
  }

  // Check for at least one positive and one negative value
  let hasPositive = false;
  let hasNegative = false;
  for (const value of values) {
    if (value > 0) hasPositive = true;
    if (value < 0) hasNegative = true;
  }

  if (!hasPositive || !hasNegative) {
    throw new Error('IRR requires at least one positive and one negative cash flow');
  }

  const maxIterations = 100;
  const tolerance = 1e-7;
  let rate = guess;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let npv = 0;
    let dnpv = 0;

    for (let i = 0; i < values.length; i++) {
      const factor = Math.pow(1 + rate, i);
      npv += values[i] / factor;
      dnpv -= (i * values[i]) / Math.pow(1 + rate, i + 1);
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  throw new Error('IRR calculation did not converge');
}

/**
 * MIRR - Modified Internal Rate of Return
 * Calculates the modified internal rate of return for a series of cash flows
 * @param values Array of cash flows
 * @param finance_rate Interest rate paid on money used in cash flows
 * @param reinvest_rate Interest rate received on cash flows reinvested
 */
export function MIRR(values: number[], finance_rate: number, reinvest_rate: number): number {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid values array');
  }

  const n = values.length;
  let positive_pv = 0;
  let negative_pv = 0;

  for (let i = 0; i < n; i++) {
    if (values[i] > 0) {
      positive_pv += values[i] / Math.pow(1 + reinvest_rate, i);
    } else {
      negative_pv += values[i] / Math.pow(1 + finance_rate, i);
    }
  }

  if (negative_pv === 0 || positive_pv === 0) {
    throw new Error('MIRR requires both positive and negative cash flows');
  }

  const fv_positive = positive_pv * Math.pow(1 + reinvest_rate, n - 1);
  const pv_negative = -negative_pv;

  return Math.pow(fv_positive / pv_negative, 1 / (n - 1)) - 1;
}

// ============================================================================
// DEPRECIATION FUNCTIONS
// ============================================================================

/**
 * DDB - Double Declining Balance Depreciation
 * Calculates depreciation using the double-declining balance method
 * @param cost Initial cost of the asset
 * @param salvage Value at the end of depreciation
 * @param life Useful life of the asset
 * @param period Period for which to calculate depreciation
 * @param factor Rate at which balance declines (optional, default 2)
 */
export function DDB(
  cost: number,
  salvage: number,
  life: number,
  period: number,
  factor: number = 2
): number {
  if (cost < 0 || salvage < 0 || life <= 0 || period <= 0 || period > life) {
    throw new Error('Invalid arguments');
  }

  const rate = factor / life;
  let depreciation = 0;
  let bookValue = cost;

  for (let i = 1; i <= period; i++) {
    depreciation = Math.min(bookValue * rate, bookValue - salvage);
    bookValue -= depreciation;

    if (bookValue <= salvage) {
      if (i === period) {
        depreciation = Math.max(0, bookValue - salvage);
      } else {
        depreciation = 0;
      }
      break;
    }
  }

  return depreciation;
}

/**
 * SLN - Straight Line Depreciation
 * Calculates straight-line depreciation for an asset
 * @param cost Initial cost of the asset
 * @param salvage Value at the end of depreciation
 * @param life Useful life of the asset
 */
export function SLN(cost: number, salvage: number, life: number): number {
  if (life <= 0) {
    throw new Error('Life must be greater than 0');
  }

  return (cost - salvage) / life;
}

/**
 * SYD - Sum of Years Digits Depreciation
 * Calculates sum-of-years' digits depreciation
 * @param cost Initial cost of the asset
 * @param salvage Value at the end of depreciation
 * @param life Useful life of the asset
 * @param period Period for which to calculate depreciation
 */
export function SYD(cost: number, salvage: number, life: number, period: number): number {
  if (life <= 0 || period <= 0 || period > life) {
    throw new Error('Invalid arguments');
  }

  const sumYears = (life * (life + 1)) / 2;
  const remainingLife = life - period + 1;

  return ((cost - salvage) * remainingLife) / sumYears;
}

/**
 * VDB - Variable Declining Balance Depreciation
 * Calculates depreciation using variable declining balance method
 * @param cost Initial cost of the asset
 * @param salvage Value at the end of depreciation
 * @param life Useful life of the asset
 * @param start_period Starting period
 * @param end_period Ending period
 * @param factor Declining balance factor (optional, default 2)
 * @param no_switch Don't switch to straight-line (optional, default false)
 */
export function VDB(
  cost: number,
  salvage: number,
  life: number,
  start_period: number,
  end_period: number,
  factor: number = 2,
  no_switch: boolean = false
): number {
  if (cost < 0 || salvage < 0 || life <= 0) {
    throw new Error('Invalid arguments');
  }

  if (start_period < 0 || end_period > life || start_period >= end_period) {
    throw new Error('Invalid period arguments');
  }

  let depreciation = 0;
  let bookValue = cost;
  const rate = factor / life;

  for (let period = 1; period <= end_period; period++) {
    let currentDepreciation: number;

    if (no_switch) {
      // Always use declining balance
      currentDepreciation = bookValue * rate;
    } else {
      // Switch to straight-line if it gives higher depreciation
      const remainingLife = life - period + 1;
      const straightLine = (bookValue - salvage) / remainingLife;
      const decliningBalance = bookValue * rate;

      currentDepreciation = Math.max(straightLine, decliningBalance);
    }

    // Don't depreciate below salvage value
    currentDepreciation = Math.min(currentDepreciation, bookValue - salvage);

    if (period > start_period) {
      depreciation += currentDepreciation;
    }

    bookValue -= currentDepreciation;
  }

  return depreciation;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate compound interest factor
 */
function compoundInterestFactor(rate: number, periods: number): number {
  return Math.pow(1 + rate, periods);
}

/**
 * Calculate annuity factor
 */
function annuityFactor(rate: number, periods: number): number {
  if (rate === 0) {
    return periods;
  }
  return (Math.pow(1 + rate, periods) - 1) / rate;
}

// ============================================================================
// EXPORT ALL FINANCIAL FUNCTIONS
// ============================================================================

export const VB6FinancialFunctions = {
  // Loan & Investment
  PV,
  FV,
  PMT,
  NPer,
  Rate,
  IPmt,
  PPmt,

  // Net Present Value & IRR
  NPV,
  IRR,
  MIRR,

  // Depreciation
  DDB,
  SLN,
  SYD,
  VDB,

  // Helpers (not exposed in VB6 but useful)
  compoundInterestFactor,
  annuityFactor,
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;

  // Loan & Investment functions
  globalAny.PV = PV;
  globalAny.FV = FV;
  globalAny.PMT = PMT;
  globalAny.NPer = NPer;
  globalAny.Rate = Rate;
  globalAny.IPmt = IPmt;
  globalAny.PPmt = PPmt;

  // NPV & IRR functions
  globalAny.NPV = NPV;
  globalAny.IRR = IRR;
  globalAny.MIRR = MIRR;

  // Depreciation functions
  globalAny.DDB = DDB;
  globalAny.SLN = SLN;
  globalAny.SYD = SYD;
  globalAny.VDB = VDB;
}

export default VB6FinancialFunctions;
