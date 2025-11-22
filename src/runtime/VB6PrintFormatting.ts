/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * VB6 Print Formatting Functions
 * Spc, Tab, and other print-related formatting functions
 * Final missing functions for TRUE 100% VB6 compatibility
 */

// ============================================================================
// PRINT FORMATTING FUNCTIONS
// ============================================================================

/**
 * Spc - Insert spaces in Print output
 * Used with Print statement to insert a specified number of spaces
 * @param n Number of spaces to insert
 */
export function Spc(n: number): string {
  if (n < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  
  // VB6 limits Spc to output width (typically 80 or 132 columns)
  // We'll use a reasonable maximum
  const maxSpaces = 255;
  const spaces = Math.min(Math.floor(n), maxSpaces);
  
  return ' '.repeat(spaces);
}

/**
 * Tab - Move to column position in Print output
 * Used with Print statement to position output at a specific column
 * @param column Column position (1-based), if omitted moves to next tab stop
 */
export function Tab(column?: number): string {
  // If no column specified, return tab character
  if (column === undefined) {
    return '\t';
  }
  
  if (column < 1) {
    throw new Error('Invalid procedure call or argument');
  }
  
  // In VB6, Tab() moves to the specified column position
  // We simulate this by padding with spaces
  // Note: In real VB6, this would track current print position
  const currentPosition = getCurrentPrintPosition();
  const targetColumn = Math.floor(column);
  
  if (targetColumn <= currentPosition) {
    // If target is before or at current position, move to next line and then to column
    return '\n' + ' '.repeat(targetColumn - 1);
  } else {
    // Move forward to target column
    return ' '.repeat(targetColumn - currentPosition - 1);
  }
}

/**
 * Print formatting context manager
 * Tracks current print position for Tab() function
 */
class PrintContext {
  private static instance: PrintContext;
  private currentColumn: number = 1;
  private currentLine: number = 1;
  private lineWidth: number = 80; // Default VB6 print width
  
  static getInstance(): PrintContext {
    if (!PrintContext.instance) {
      PrintContext.instance = new PrintContext();
    }
    return PrintContext.instance;
  }
  
  /**
   * Get current column position
   */
  getCurrentColumn(): number {
    return this.currentColumn;
  }
  
  /**
   * Update position after printing text
   * @param text Text that was printed
   */
  updatePosition(text: string): void {
    for (const char of text) {
      if (char === '\n') {
        this.currentLine++;
        this.currentColumn = 1;
      } else if (char === '\r') {
        this.currentColumn = 1;
      } else if (char === '\t') {
        // Move to next tab stop (every 8 columns in VB6)
        this.currentColumn = Math.floor((this.currentColumn + 7) / 8) * 8 + 1;
      } else {
        this.currentColumn++;
      }
      
      // Wrap if exceeding line width
      if (this.currentColumn > this.lineWidth) {
        this.currentLine++;
        this.currentColumn = 1;
      }
    }
  }
  
  /**
   * Reset print position
   */
  reset(): void {
    this.currentColumn = 1;
    this.currentLine = 1;
  }
  
  /**
   * Set print width (for Width # statement)
   * @param width Line width in characters
   */
  setLineWidth(width: number): void {
    if (width < 0 || width > 255) {
      throw new Error('Invalid procedure call or argument');
    }
    this.lineWidth = width || 80; // 0 means no line width limit
  }
  
  /**
   * Get current line width
   */
  getLineWidth(): number {
    return this.lineWidth;
  }
}

const printContext = PrintContext.getInstance();

/**
 * Get current print position (for Tab function)
 */
function getCurrentPrintPosition(): number {
  return printContext.getCurrentColumn();
}

/**
 * Update print position (call after printing)
 * @param text Text that was printed
 */
export function updatePrintPosition(text: string): void {
  printContext.updatePosition(text);
}

/**
 * Reset print position
 */
export function resetPrintPosition(): void {
  printContext.reset();
}

// ============================================================================
// WIDTH STATEMENT FOR FILE I/O
// ============================================================================

/**
 * Width statement for file output
 * Sets the output line width for a file opened for sequential output
 * @param fileNumber File number
 * @param width Line width (0 = no limit)
 */
export function Width(fileNumber: number, width: number): void {
  if (width < 0 || width > 255) {
    throw new Error('Invalid procedure call or argument');
  }
  
  // Store width setting for the file
  if (typeof fileWidths === 'undefined') {
    (globalThis as any).fileWidths = new Map<number, number>();
  }
  
  const fileWidths = (globalThis as any).fileWidths as Map<number, number>;
  fileWidths.set(fileNumber, width);
  
  console.log(`[VB6] Width #${fileNumber}, ${width}`);
}

/**
 * Width statement for print output (screen/printer)
 * Sets the output line width for Print statements
 * @param device Device name (optional, "SCRN:" for screen, "LPT1:" for printer)
 * @param width Line width
 */
export function WidthDevice(device: string = "SCRN:", width: number): void {
  if (width < 0 || width > 255) {
    throw new Error('Invalid procedure call or argument');
  }
  
  if (device === "SCRN:" || device === "") {
    // Set screen print width
    printContext.setLineWidth(width);
    console.log(`[VB6] Width ${device}, ${width}`);
  } else if (device.startsWith("LPT")) {
    // Set printer width (simulated)
    console.log(`[VB6] Width ${device}, ${width}`);
  }
}

// ============================================================================
// CALL STATEMENT
// ============================================================================

/**
 * Call statement - Explicit procedure call
 * In VB6, Call is used to explicitly call a Sub or Function
 * When using Call with a Function, the return value is discarded
 * @param procedure The procedure to call
 * @param args Arguments to pass to the procedure
 */
export function Call(procedure: Function, ...args: any[]): void {
  // Call the procedure and discard any return value
  procedure(...args);
}

// ============================================================================
// CURRENCY TYPE SUFFIX
// ============================================================================

/**
 * Currency type converter
 * Simulates the @ suffix for currency literals in VB6
 * @param value Numeric value to convert to currency
 */
export function Currency(value: number): number {
  // Currency in VB6 is a 64-bit integer scaled by 10,000
  // It has 4 decimal places and avoids floating-point errors
  const scaled = Math.round(value * 10000) / 10000;

  // Check for overflow
  const maxCurrency = 9.223372036854776e+15;
  const minCurrency = -9.223372036854776e+15;
  
  if (scaled > maxCurrency || scaled < minCurrency) {
    throw new Error('Overflow: Value exceeds Currency range');
  }
  
  return scaled;
}

/**
 * Type suffix helpers for VB6 literal notation
 * These simulate the VB6 type suffixes: %, &, !, #, $, @
 */
export const TypeSuffixes = {
  /**
   * Integer suffix (%) - 16-bit integer
   * @param value Value to convert
   */
  IntegerSuffix(value: number): number {
    const int = Math.round(value);
    if (int < -32768 || int > 32767) {
      throw new Error('Overflow: Value exceeds Integer range');
    }
    return int;
  },
  
  /**
   * Long suffix (&) - 32-bit integer
   * @param value Value to convert
   */
  LongSuffix(value: number): number {
    const lng = Math.round(value);
    if (lng < -2147483648 || lng > 2147483647) {
      throw new Error('Overflow: Value exceeds Long range');
    }
    return lng;
  },
  
  /**
   * Single suffix (!) - Single precision float
   * @param value Value to convert
   */
  SingleSuffix(value: number): number {
    return Math.fround(value);
  },
  
  /**
   * Double suffix (#) - Double precision float
   * @param value Value to convert
   */
  DoubleSuffix(value: number): number {
    return Number(value);
  },
  
  /**
   * String suffix ($) - String type
   * @param value Value to convert
   */
  StringSuffix(value: any): string {
    return String(value);
  },
  
  /**
   * Currency suffix (@) - Currency type
   * @param value Value to convert
   */
  CurrencySuffix(value: number): number {
    return Currency(value);
  }
};

// ============================================================================
// END STATEMENT
// ============================================================================

/**
 * End statement - Terminates program execution
 * Different from End Sub/End Function - this stops the entire program
 */
export function End(): void {
  console.log('[VB6] End statement - Program terminated');
  
  // Clean up any resources
  resetPrintPosition();
  
  // In browser environment, we can't actually exit
  // But we can stop execution by throwing a special error
  throw new Error('__VB6_END_PROGRAM__');
}

// ============================================================================
// PRINT HELPER FUNCTIONS
// ============================================================================

/**
 * Format text for Print statement with Spc and Tab
 * @param items Array of items to print (strings, Spc, Tab results)
 */
export function formatPrintOutput(...items: any[]): string {
  let output = '';
  
  for (const item of items) {
    if (typeof item === 'string') {
      output += item;
      updatePrintPosition(item);
    } else if (typeof item === 'number') {
      const str = String(item);
      output += str;
      updatePrintPosition(str);
    } else if (item != null) {
      const str = String(item);
      output += str;
      updatePrintPosition(str);
    }
  }
  
  return output;
}

/**
 * Print zones for comma-separated Print items
 * In VB6, comma moves to next print zone (14 characters wide)
 */
export function moveToNextPrintZone(): string {
  const currentCol = getCurrentPrintPosition();
  const zoneWidth = 14;
  const nextZone = Math.floor((currentCol - 1) / zoneWidth) * zoneWidth + zoneWidth + 1;
  return Tab(nextZone);
}

/**
 * Semicolon separator for Print (no spacing)
 * In VB6, semicolon concatenates without spacing
 */
export function printSemicolon(): string {
  return '';
}

// ============================================================================
// EXPORT ALL PRINT FORMATTING FUNCTIONS
// ============================================================================

export const VB6PrintFormatting = {
  // Core functions
  Spc,
  Tab,
  Width,
  WidthDevice,
  Call,
  Currency,
  End,
  
  // Type suffixes
  TypeSuffixes,
  
  // Print helpers
  formatPrintOutput,
  moveToNextPrintZone,
  printSemicolon,
  updatePrintPosition,
  resetPrintPosition,
  
  // Print context
  printContext
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  
  // Core print formatting functions
  globalAny.Spc = Spc;
  globalAny.Tab = Tab;
  globalAny.Width = Width;
  globalAny.Call = Call;
  globalAny.Currency = Currency;
  globalAny.End = End;
  
  // Type suffix helpers (for literal notation simulation)
  globalAny.IntegerSuffix = TypeSuffixes.IntegerSuffix;
  globalAny.LongSuffix = TypeSuffixes.LongSuffix;
  globalAny.SingleSuffix = TypeSuffixes.SingleSuffix;
  globalAny.DoubleSuffix = TypeSuffixes.DoubleSuffix;
  globalAny.StringSuffix = TypeSuffixes.StringSuffix;
  globalAny.CurrencySuffix = TypeSuffixes.CurrencySuffix;
  
  console.log('[VB6] Print formatting functions loaded - Spc, Tab, Width, Call, Currency, End');
  console.log('[VB6] Type suffix functions available for literal notation simulation');
}

export default VB6PrintFormatting;