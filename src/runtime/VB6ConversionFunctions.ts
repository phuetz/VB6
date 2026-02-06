/**
 * VB6 Extended Conversion Functions
 *
 * Comprehensive conversion functions for VB6 runtime
 */

export class VB6ConversionFunctions {
  /**
   * CBool - Converts expression to Boolean
   * @param expression Expression to convert
   */
  static CBool(expression: any): boolean {
    if (expression === null || expression === undefined) {
      return false;
    }

    // VB6 numeric to boolean: 0 = False, anything else = True
    if (typeof expression === 'number') {
      return expression !== 0;
    }

    if (typeof expression === 'string') {
      const str = expression.trim().toLowerCase();

      // VB6 string literals
      if (str === 'true' || str === '#true#') return true;
      if (str === 'false' || str === '#false#') return false;

      // Try numeric conversion
      const num = Number(expression);
      if (!isNaN(num)) {
        return num !== 0;
      }

      // Non-empty string = True in VB6
      return expression.length > 0;
    }

    if (typeof expression === 'boolean') {
      return expression;
    }

    // Objects and arrays are True if not null
    return true;
  }

  /**
   * CByte - Converts expression to Byte (0-255)
   * @param expression Expression to convert
   */
  static CByte(expression: any): number {
    const num = this.toNumber(expression);

    if (num < 0 || num > 255) {
      throw new Error('Overflow: Value must be between 0 and 255');
    }

    return Math.floor(num);
  }

  /**
   * CInt - Converts expression to Integer (-32768 to 32767)
   * @param expression Expression to convert
   */
  static CInt(expression: any): number {
    const num = this.toNumber(expression);

    // VB6 CInt uses banker's rounding
    const rounded = this.bankersRound(num);

    if (rounded < -32768 || rounded > 32767) {
      throw new Error('Overflow: Value must be between -32768 and 32767');
    }

    return rounded;
  }

  /**
   * CLng - Converts expression to Long (-2147483648 to 2147483647)
   * @param expression Expression to convert
   */
  static CLng(expression: any): number {
    const num = this.toNumber(expression);

    // VB6 CLng uses banker's rounding
    const rounded = this.bankersRound(num);

    if (rounded < -2147483648 || rounded > 2147483647) {
      throw new Error('Overflow: Value must be between -2147483648 and 2147483647');
    }

    return rounded;
  }

  /**
   * CSng - Converts expression to Single (float)
   * @param expression Expression to convert
   */
  static CSng(expression: any): number {
    const num = this.toNumber(expression);

    // JavaScript's number is already double precision
    // Simulate single precision limits
    if (Math.abs(num) > 3.402823e38) {
      throw new Error('Overflow: Value exceeds Single precision range');
    }

    if (Math.abs(num) < 1.401298e-45 && num !== 0) {
      return 0; // Underflow to zero
    }

    // Reduce precision to simulate Single
    return Math.fround(num);
  }

  /**
   * CDbl - Converts expression to Double
   * @param expression Expression to convert
   */
  static CDbl(expression: any): number {
    return this.toNumber(expression);
  }

  /**
   * CCur - Converts expression to Currency
   * @param expression Expression to convert
   */
  static CCur(expression: any): number {
    const num = this.toNumber(expression);

    // Currency in VB6 has a specific range
    // Using safe integer limits to avoid precision loss
    const minCurrency = -Number.MAX_SAFE_INTEGER;
    const maxCurrency = Number.MAX_SAFE_INTEGER;
    if (num < minCurrency || num > maxCurrency) {
      throw new Error('Overflow: Value exceeds Currency range');
    }

    // Currency has 4 decimal places
    return Math.round(num * 10000) / 10000;
  }

  /**
   * CDate - Converts expression to Date
   * @param expression Expression to convert
   */
  static CDate(expression: any): Date {
    if (expression instanceof Date) {
      return new Date(expression);
    }

    if (typeof expression === 'number') {
      // VB6 date serial number (days since 1899-12-30)
      const baseDate = new Date(1899, 11, 30);
      return new Date(baseDate.getTime() + expression * 24 * 60 * 60 * 1000);
    }

    if (typeof expression === 'string') {
      // Try parsing various date formats
      const date = new Date(expression);

      if (isNaN(date.getTime())) {
        // Try VB6 specific formats
        const vb6Date = this.parseVB6DateString(expression);
        if (vb6Date) return vb6Date;

        throw new Error('Type mismatch: Cannot convert to Date');
      }

      return date;
    }

    throw new Error('Type mismatch: Cannot convert to Date');
  }

  /**
   * CStr - Converts expression to String
   * @param expression Expression to convert
   */
  static CStr(expression: any): string {
    if (expression === null || expression === undefined) {
      return '';
    }

    if (typeof expression === 'boolean') {
      return expression ? 'True' : 'False';
    }

    if (expression instanceof Date) {
      return this.formatVB6Date(expression);
    }

    if (typeof expression === 'number') {
      // Handle special cases
      if (expression === Infinity) return 'Infinity';
      if (expression === -Infinity) return '-Infinity';
      if (isNaN(expression)) return '';

      // Format number VB6 style
      return this.formatVB6Number(expression);
    }

    return String(expression);
  }

  /**
   * CDec - Converts expression to Decimal
   * @param expression Expression to convert
   */
  static CDec(expression: any): number {
    const num = this.toNumber(expression);

    // VB6 Decimal has 28-29 significant digits
    // JavaScript can't fully represent this, but we'll validate range
    const maxDecimal = 7.922816251426434e28;
    if (Math.abs(num) > maxDecimal) {
      throw new Error('Overflow: Value exceeds Decimal range');
    }

    return num;
  }

  /**
   * CVar - Converts expression to Variant (any type)
   * @param expression Expression to convert
   */
  static CVar(expression: any): any {
    // Variant can hold any type, so just return the value
    return expression;
  }

  /**
   * CVErr - Creates an error value
   * @param errorNumber Error number
   */
  static CVErr(errorNumber: number): Error {
    const errorMap: { [key: number]: string } = {
      3: 'Return without GoSub',
      5: 'Invalid procedure call',
      6: 'Overflow',
      7: 'Out of memory',
      9: 'Subscript out of range',
      11: 'Division by zero',
      13: 'Type mismatch',
      14: 'Out of string space',
      28: 'Out of stack space',
      35: 'Sub or Function not defined',
      48: 'Error in loading DLL',
      51: 'Internal error',
      52: 'Bad file name or number',
      53: 'File not found',
      54: 'Bad file mode',
      55: 'File already open',
      57: 'Device I/O error',
      58: 'File already exists',
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
      91: 'Object variable not set',
      92: 'For loop not initialized',
      93: 'Invalid pattern string',
      94: 'Invalid use of Null',
    };

    const message = errorMap[errorNumber] || `Error ${errorNumber}`;
    const error = new Error(message);
    (error as any).number = errorNumber;
    return error;
  }

  /**
   * Error - Returns error message for error number
   * @param errorNumber Error number
   */
  static Error(errorNumber: number): string {
    const error = this.CVErr(errorNumber);
    return error.message;
  }

  /**
   * Fix - Returns integer portion of number
   * @param number Number to truncate
   */
  static Fix(number: any): number {
    const num = this.toNumber(number);

    if (num >= 0) {
      return Math.floor(num);
    } else {
      return Math.ceil(num);
    }
  }

  /**
   * Int - Returns integer portion of number (always rounds down)
   * @param number Number to truncate
   */
  static Int(number: any): number {
    const num = this.toNumber(number);
    return Math.floor(num);
  }

  /**
   * Hex - Returns hexadecimal string representation
   * @param number Number to convert
   */
  static Hex(number: any): string {
    const num = this.CLng(number);

    if (num < 0) {
      // VB6 uses two's complement for negative numbers
      return (num >>> 0).toString(16).toUpperCase();
    }

    return num.toString(16).toUpperCase();
  }

  /**
   * Oct - Returns octal string representation
   * @param number Number to convert
   */
  static Oct(number: any): string {
    const num = this.CLng(number);

    if (num < 0) {
      // VB6 uses two's complement for negative numbers
      return (num >>> 0).toString(8);
    }

    return num.toString(8);
  }

  /**
   * Str - Returns string representation of number with leading space for positive
   * @param number Number to convert
   */
  static Str(number: any): string {
    const num = this.toNumber(number);

    if (num >= 0) {
      return ' ' + num.toString();
    } else {
      return num.toString();
    }
  }

  /**
   * Val - Returns numeric value of string
   * @param stringExpression String to convert
   */
  static Val(stringExpression: any): number {
    if (typeof stringExpression !== 'string') {
      stringExpression = String(stringExpression);
    }

    // VB6 Val stops at first non-numeric character
    let numStr = '';
    let decimalFound = false;
    let signFound = false;

    for (let i = 0; i < stringExpression.length; i++) {
      const char = stringExpression[i];

      // Skip leading spaces
      if (char === ' ' && numStr === '') continue;

      // Handle sign
      if ((char === '+' || char === '-') && !signFound && numStr === '') {
        numStr += char;
        signFound = true;
        continue;
      }

      // Handle decimal point
      if (char === '.' && !decimalFound) {
        numStr += char;
        decimalFound = true;
        continue;
      }

      // Handle digits
      if (char >= '0' && char <= '9') {
        numStr += char;
        continue;
      }

      // Stop at first non-numeric character
      break;
    }

    if (numStr === '' || numStr === '+' || numStr === '-' || numStr === '.') {
      return 0;
    }

    return parseFloat(numStr);
  }

  /**
   * Format - Formats expression according to format string
   * @param expression Expression to format
   * @param formatString Format specification
   */
  static Format(expression: any, formatString?: string): string {
    if (!formatString) {
      return this.CStr(expression);
    }

    // Handle predefined formats
    const format = formatString.toLowerCase();

    if (expression instanceof Date || !isNaN(Date.parse(expression))) {
      const date = expression instanceof Date ? expression : new Date(expression);
      return this.formatDate(date, formatString);
    }

    if (typeof expression === 'number' || !isNaN(Number(expression))) {
      const num = Number(expression);
      return this.formatNumber(num, formatString);
    }

    // String formatting
    return this.formatString(String(expression), formatString);
  }

  /**
   * FormatCurrency - Formats number as currency
   * @param expression Number to format
   * @param numDigitsAfterDecimal Decimal places
   * @param includeLeadingDigit Include leading zero
   * @param useParensForNegativeNumbers Use parentheses for negative
   * @param groupDigits Use thousands separator
   */
  static FormatCurrency(
    expression: any,
    numDigitsAfterDecimal: number = 2,
    includeLeadingDigit: number = -2,
    useParensForNegativeNumbers: number = -2,
    groupDigits: number = -2
  ): string {
    const num = this.toNumber(expression);
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let result = this.formatWithOptions(
      absNum,
      numDigitsAfterDecimal,
      includeLeadingDigit,
      groupDigits
    );

    // Add currency symbol
    result = '$' + result;

    // Handle negative numbers
    if (isNegative) {
      if (useParensForNegativeNumbers === -1 || useParensForNegativeNumbers === -2) {
        result = '(' + result + ')';
      } else {
        result = '-' + result;
      }
    }

    return result;
  }

  /**
   * FormatNumber - Formats number
   * @param expression Number to format
   * @param numDigitsAfterDecimal Decimal places
   * @param includeLeadingDigit Include leading zero
   * @param useParensForNegativeNumbers Use parentheses for negative
   * @param groupDigits Use thousands separator
   */
  static FormatNumber(
    expression: any,
    numDigitsAfterDecimal: number = 2,
    includeLeadingDigit: number = -2,
    useParensForNegativeNumbers: number = -2,
    groupDigits: number = -2
  ): string {
    const num = this.toNumber(expression);
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let result = this.formatWithOptions(
      absNum,
      numDigitsAfterDecimal,
      includeLeadingDigit,
      groupDigits
    );

    // Handle negative numbers
    if (isNegative) {
      if (useParensForNegativeNumbers === -1 || useParensForNegativeNumbers === -2) {
        result = '(' + result + ')';
      } else {
        result = '-' + result;
      }
    }

    return result;
  }

  /**
   * FormatPercent - Formats number as percentage
   * @param expression Number to format
   * @param numDigitsAfterDecimal Decimal places
   * @param includeLeadingDigit Include leading zero
   * @param useParensForNegativeNumbers Use parentheses for negative
   * @param groupDigits Use thousands separator
   */
  static FormatPercent(
    expression: any,
    numDigitsAfterDecimal: number = 2,
    includeLeadingDigit: number = -2,
    useParensForNegativeNumbers: number = -2,
    groupDigits: number = -2
  ): string {
    const num = this.toNumber(expression) * 100;
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let result = this.formatWithOptions(
      absNum,
      numDigitsAfterDecimal,
      includeLeadingDigit,
      groupDigits
    );

    // Add percent symbol
    result = result + '%';

    // Handle negative numbers
    if (isNegative) {
      if (useParensForNegativeNumbers === -1 || useParensForNegativeNumbers === -2) {
        result = '(' + result + ')';
      } else {
        result = '-' + result;
      }
    }

    return result;
  }

  /**
   * FormatDateTime - Formats date/time
   * @param date Date to format
   * @param namedFormat Format type
   */
  static FormatDateTime(date: any, namedFormat: number = 0): string {
    const d = this.CDate(date);

    switch (namedFormat) {
      case 0: // vbGeneralDate
        return this.formatVB6Date(d);
      case 1: // vbLongDate
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 2: // vbShortDate
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      case 3: // vbLongTime
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      case 4: // vbShortTime
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        throw new Error('Invalid procedure call or argument');
    }
  }

  // Helper methods

  private static toNumber(expression: any): number {
    if (typeof expression === 'number') {
      return expression;
    }

    if (typeof expression === 'boolean') {
      return expression ? -1 : 0; // VB6 True = -1
    }

    if (expression instanceof Date) {
      // Convert to VB6 date serial number
      const baseDate = new Date(1899, 11, 30);
      return (expression.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000);
    }

    if (typeof expression === 'string') {
      const trimmed = expression.trim();
      if (trimmed === '') return 0;

      // Handle VB6 boolean strings
      if (trimmed.toLowerCase() === 'true') return -1;
      if (trimmed.toLowerCase() === 'false') return 0;

      // Try parsing as number
      const num = Number(trimmed);
      if (isNaN(num)) {
        throw new Error('Type mismatch');
      }
      return num;
    }

    if (expression === null || expression === undefined) {
      return 0;
    }

    throw new Error('Type mismatch');
  }

  private static bankersRound(num: number): number {
    const integer = Math.floor(num);
    const decimal = num - integer;

    if (decimal === 0.5) {
      // Round to even
      return integer % 2 === 0 ? integer : integer + 1;
    } else if (decimal > 0.5) {
      return integer + 1;
    } else {
      return integer;
    }
  }

  private static parseVB6DateString(str: string): Date | null {
    // Try common VB6 date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // M/D/Y
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, // M-D-Y
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // Y/M/D
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // Y-M-D
    ];

    for (const format of formats) {
      const match = str.match(format);
      if (match) {
        let year = parseInt(match[3]);
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 30 ? 2000 : 1900;
        }

        return new Date(year, month - 1, day);
      }
    }

    return null;
  }

  private static formatVB6Date(date: Date): string {
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    const timeStr = date.toLocaleTimeString('en-US');

    // Only include time if not midnight
    if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
      return dateStr;
    }

    return `${dateStr} ${timeStr}`;
  }

  private static formatVB6Number(num: number): string {
    // VB6 default number formatting
    if (Number.isInteger(num)) {
      return num.toString();
    }

    // Remove trailing zeros
    let str = num.toString();
    if (str.includes('.')) {
      str = str.replace(/\.?0+$/, '');
    }

    return str;
  }

  private static formatWithOptions(
    num: number,
    decimalPlaces: number,
    includeLeadingDigit: number,
    groupDigits: number
  ): string {
    let str = num.toFixed(decimalPlaces);

    // Handle leading zero
    if (includeLeadingDigit === 0 && str.startsWith('0.')) {
      str = str.substring(1);
    }

    // Handle grouping
    if (groupDigits === -1 || groupDigits === -2) {
      const parts = str.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      str = parts.join('.');
    }

    return str;
  }

  private static formatDate(date: Date, format: string): string {
    const replacements: { [key: string]: () => string } = {
      yyyy: () => date.getFullYear().toString(),
      yy: () => date.getFullYear().toString().slice(-2),
      mmmm: () => date.toLocaleString('en-US', { month: 'long' }),
      mmm: () => date.toLocaleString('en-US', { month: 'short' }),
      mm: () => (date.getMonth() + 1).toString().padStart(2, '0'),
      m: () => (date.getMonth() + 1).toString(),
      dddd: () => date.toLocaleString('en-US', { weekday: 'long' }),
      ddd: () => date.toLocaleString('en-US', { weekday: 'short' }),
      dd: () => date.getDate().toString().padStart(2, '0'),
      d: () => date.getDate().toString(),
      hh: () => date.getHours().toString().padStart(2, '0'),
      h: () => date.getHours().toString(),
      nn: () => date.getMinutes().toString().padStart(2, '0'),
      n: () => date.getMinutes().toString(),
      ss: () => date.getSeconds().toString().padStart(2, '0'),
      s: () => date.getSeconds().toString(),
    };

    let result = format;

    // Sort by length to replace longer patterns first
    const patterns = Object.keys(replacements).sort((a, b) => b.length - a.length);

    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'gi');
      result = result.replace(regex, replacements[pattern]());
    }

    return result;
  }

  private static formatNumber(num: number, format: string): string {
    // Handle predefined numeric formats
    const lowerFormat = format.toLowerCase();

    switch (lowerFormat) {
      case 'general number':
        return this.formatVB6Number(num);
      case 'currency':
        return this.FormatCurrency(num);
      case 'fixed':
        return num.toFixed(2);
      case 'standard':
        return this.FormatNumber(num);
      case 'percent':
        return this.FormatPercent(num);
      case 'scientific':
        return num.toExponential(2);
      case 'yes/no':
        return num !== 0 ? 'Yes' : 'No';
      case 'true/false':
        return num !== 0 ? 'True' : 'False';
      case 'on/off':
        return num !== 0 ? 'On' : 'Off';
    }

    // Custom format string
    return this.applyCustomNumberFormat(num, format);
  }

  private static formatString(str: string, format: string): string {
    // Handle string format characters
    let result = '';
    let strIndex = 0;

    for (let i = 0; i < format.length; i++) {
      const char = format[i];

      switch (char) {
        case '@':
          // Character placeholder
          if (strIndex < str.length) {
            result += str[strIndex++];
          } else {
            result += ' ';
          }
          break;
        case '&':
          // Character placeholder (no space)
          if (strIndex < str.length) {
            result += str[strIndex++];
          }
          break;
        case '<':
          // Force lowercase
          return str.toLowerCase();
        case '>':
          // Force uppercase
          return str.toUpperCase();
        case '!':
          // Fill from left
          return str;
        default:
          result += char;
      }
    }

    return result;
  }

  private static applyCustomNumberFormat(num: number, format: string): string {
    // Simple custom format implementation
    // VB6 supports complex formats with sections for positive/negative/zero

    const sections = format.split(';');
    let selectedFormat: string;

    if (num > 0) {
      selectedFormat = sections[0];
    } else if (num < 0) {
      selectedFormat = sections[1] || sections[0];
      num = Math.abs(num); // Remove sign, format handles it
    } else {
      selectedFormat = sections[2] || sections[0];
    }

    // Count decimal places
    const decimalMatch = selectedFormat.match(/\.([0#]+)/);
    const decimalPlaces = decimalMatch ? decimalMatch[1].length : 0;

    // Format the number
    let result = num.toFixed(decimalPlaces);

    // Add thousands separator if comma present before decimal
    if (
      selectedFormat.indexOf(',') > -1 &&
      selectedFormat.indexOf(',') < selectedFormat.indexOf('.')
    ) {
      const parts = result.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      result = parts.join('.');
    }

    // Handle percentage
    if (selectedFormat.includes('%')) {
      result = (num * 100).toFixed(decimalPlaces) + '%';
    }

    return result;
  }
}

// Export individual functions for easier use
export const {
  CBool,
  CByte,
  CInt,
  CLng,
  CSng,
  CDbl,
  CCur,
  CDate,
  CStr,
  CDec,
  CVar,
  CVErr,
  Error,
  Fix,
  Int,
  Hex,
  Oct,
  Str,
  Val,
  Format,
  FormatCurrency,
  FormatNumber,
  FormatPercent,
  FormatDateTime,
} = VB6ConversionFunctions;

// VB6 Format constants
export const VB6FormatConstants = {
  // Named date/time formats
  vbGeneralDate: 0,
  vbLongDate: 1,
  vbShortDate: 2,
  vbLongTime: 3,
  vbShortTime: 4,

  // Tristate values
  vbUseDefault: -2,
  vbTrue: -1,
  vbFalse: 0,

  // First day of week
  vbUseSystemDayOfWeek: 0,
  vbSunday: 1,
  vbMonday: 2,
  vbTuesday: 3,
  vbWednesday: 4,
  vbThursday: 5,
  vbFriday: 6,
  vbSaturday: 7,

  // First week of year
  vbUseSystem: 0,
  vbFirstJan1: 1,
  vbFirstFourDays: 2,
  vbFirstFullWeek: 3,
};

// Type conversion error codes
export const VB6ConversionErrors = {
  OVERFLOW: 6,
  TYPE_MISMATCH: 13,
  INVALID_PROCEDURE_CALL: 5,
};
