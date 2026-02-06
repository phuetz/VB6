/**
 * VB6 Format Functions Implementation
 *
 * Complete implementation of VB6 formatting functions:
 * FormatCurrency, FormatDateTime, FormatNumber, FormatPercent
 */

// VB6 Format constants
export const VB6FormatConstants = {
  // Date/Time format constants
  vbGeneralDate: 0,
  vbLongDate: 1,
  vbShortDate: 2,
  vbLongTime: 3,
  vbShortTime: 4,

  // Number format constants
  vbUseDefault: -2,
  vbTrue: -1,
  vbFalse: 0,

  // TriState constants for UseParensForNegativeNumbers
  vbUseSystemDefault: -2,
  vbUseSystem: -1,
  vbDontUseSystem: 0,
};

/**
 * Format a number as currency
 * FormatCurrency(Expression [, NumDigitsAfterDecimal] [, IncludeLeadingDigit] [, UseParensForNegativeNumbers] [, GroupDigits])
 */
export function FormatCurrency(
  expression: number | string,
  numDigitsAfterDecimal: number = -1,
  includeLeadingDigit: number = VB6FormatConstants.vbUseDefault,
  useParensForNegativeNumbers: number = VB6FormatConstants.vbUseDefault,
  groupDigits: number = VB6FormatConstants.vbUseDefault
): string {
  if (expression === null || expression === undefined) return '';

  const num = typeof expression === 'string' ? parseFloat(expression) : expression;
  if (isNaN(num)) return '';

  // Get system settings (simplified for web environment)
  const systemCurrencySymbol = '$';
  const systemDecimalPlaces = numDigitsAfterDecimal === -1 ? 2 : numDigitsAfterDecimal;
  const systemGroupSeparator = ',';
  const systemDecimalSeparator = '.';

  // Format the number
  let formattedNumber = Math.abs(num).toFixed(systemDecimalPlaces);

  // Add thousands separators if groupDigits is true
  if (
    groupDigits === VB6FormatConstants.vbTrue ||
    groupDigits === VB6FormatConstants.vbUseDefault
  ) {
    const parts = formattedNumber.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, systemGroupSeparator);
    formattedNumber = parts.join(systemDecimalSeparator);
  }

  // Handle leading digit
  if (includeLeadingDigit === VB6FormatConstants.vbFalse && formattedNumber.startsWith('0.')) {
    formattedNumber = formattedNumber.substring(1);
  }

  // Handle negative numbers
  if (num < 0) {
    if (useParensForNegativeNumbers === VB6FormatConstants.vbTrue) {
      return `(${systemCurrencySymbol}${formattedNumber})`;
    } else {
      return `-${systemCurrencySymbol}${formattedNumber}`;
    }
  }

  return `${systemCurrencySymbol}${formattedNumber}`;
}

/**
 * Format a date/time value
 * FormatDateTime(Date [, NamedFormat])
 */
export function FormatDateTime(
  date: Date | string | number,
  namedFormat: number = VB6FormatConstants.vbGeneralDate
): string {
  if (date === null || date === undefined) return '';

  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    // VB6 dates are stored as doubles (days since 1899-12-30)
    const vb6BaseDate = new Date(1899, 11, 30); // December 30, 1899
    dateObj = new Date(vb6BaseDate.getTime() + date * 24 * 60 * 60 * 1000);
  } else {
    return '';
  }

  if (isNaN(dateObj.getTime())) return '';

  switch (namedFormat) {
    case VB6FormatConstants.vbLongDate:
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case VB6FormatConstants.vbShortDate:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

    case VB6FormatConstants.vbLongTime:
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

    case VB6FormatConstants.vbShortTime:
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    case VB6FormatConstants.vbGeneralDate:
    default: {
      // Show date if not today, time if no date part, or both
      const now = new Date();
      const isToday = dateObj.toDateString() === now.toDateString();
      const hasTimeComponent =
        dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0;

      if (isToday && hasTimeComponent) {
        return dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else if (!hasTimeComponent) {
        return dateObj.toLocaleDateString('en-US');
      } else {
        return `${dateObj.toLocaleDateString('en-US')} ${dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`;
      }
    }
  }
}

/**
 * Format a number
 * FormatNumber(Expression [, NumDigitsAfterDecimal] [, IncludeLeadingDigit] [, UseParensForNegativeNumbers] [, GroupDigits])
 */
export function FormatNumber(
  expression: number | string,
  numDigitsAfterDecimal: number = -1,
  includeLeadingDigit: number = VB6FormatConstants.vbUseDefault,
  useParensForNegativeNumbers: number = VB6FormatConstants.vbUseDefault,
  groupDigits: number = VB6FormatConstants.vbUseDefault
): string {
  if (expression === null || expression === undefined) return '';

  const num = typeof expression === 'string' ? parseFloat(expression) : expression;
  if (isNaN(num)) return '';

  // Get system settings
  const systemDecimalPlaces = numDigitsAfterDecimal === -1 ? 2 : numDigitsAfterDecimal;
  const systemGroupSeparator = ',';
  const systemDecimalSeparator = '.';

  // Format the number
  let formattedNumber = Math.abs(num).toFixed(systemDecimalPlaces);

  // Add thousands separators if groupDigits is true
  if (
    groupDigits === VB6FormatConstants.vbTrue ||
    groupDigits === VB6FormatConstants.vbUseDefault
  ) {
    const parts = formattedNumber.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, systemGroupSeparator);
    formattedNumber = parts.join(systemDecimalSeparator);
  }

  // Handle leading digit
  if (includeLeadingDigit === VB6FormatConstants.vbFalse && formattedNumber.startsWith('0.')) {
    formattedNumber = formattedNumber.substring(1);
  }

  // Handle negative numbers
  if (num < 0) {
    if (useParensForNegativeNumbers === VB6FormatConstants.vbTrue) {
      return `(${formattedNumber})`;
    } else {
      return `-${formattedNumber}`;
    }
  }

  return formattedNumber;
}

/**
 * Format a number as percentage
 * FormatPercent(Expression [, NumDigitsAfterDecimal] [, IncludeLeadingDigit] [, UseParensForNegativeNumbers] [, GroupDigits])
 */
export function FormatPercent(
  expression: number | string,
  numDigitsAfterDecimal: number = -1,
  includeLeadingDigit: number = VB6FormatConstants.vbUseDefault,
  useParensForNegativeNumbers: number = VB6FormatConstants.vbUseDefault,
  groupDigits: number = VB6FormatConstants.vbUseDefault
): string {
  if (expression === null || expression === undefined) return '';

  const num = typeof expression === 'string' ? parseFloat(expression) : expression;
  if (isNaN(num)) return '';

  // Convert to percentage (multiply by 100)
  const percentValue = num * 100;

  // Format using FormatNumber
  const formattedNumber = FormatNumber(
    percentValue,
    numDigitsAfterDecimal,
    includeLeadingDigit,
    useParensForNegativeNumbers,
    groupDigits
  );

  return formattedNumber + '%';
}

/**
 * Advanced Format function with custom format strings
 * Format(Expression [, Format] [, FirstDayOfWeek] [, FirstWeekOfYear])
 */
export function Format(
  expression: any,
  format?: string,
  firstDayOfWeek: number = 1,
  firstWeekOfYear: number = 1
): string {
  if (expression === null || expression === undefined) return '';

  // If no format specified, use default string conversion
  if (!format) {
    return String(expression);
  }

  // Handle date formats
  if (
    expression instanceof Date ||
    (typeof expression === 'string' && !isNaN(Date.parse(expression)))
  ) {
    return formatDate(expression instanceof Date ? expression : new Date(expression), format);
  }

  // Handle number formats
  if (
    typeof expression === 'number' ||
    (typeof expression === 'string' && !isNaN(parseFloat(expression)))
  ) {
    const num = typeof expression === 'number' ? expression : parseFloat(expression);
    return formatNumber(num, format);
  }

  // Handle string formats
  return formatString(String(expression), format);
}

/**
 * Internal date formatting function
 */
function formatDate(date: Date, format: string): string {
  const formatMap: { [key: string]: string } = {
    // Year formats
    yyyy: date.getFullYear().toString(),
    yy: date.getFullYear().toString().slice(-2),
    y: date.getFullYear().toString(),

    // Month formats
    mmmm: date.toLocaleDateString('en-US', { month: 'long' }),
    mmm: date.toLocaleDateString('en-US', { month: 'short' }),
    mm: String(date.getMonth() + 1).padStart(2, '0'),
    m: String(date.getMonth() + 1),

    // Day formats
    dddd: date.toLocaleDateString('en-US', { weekday: 'long' }),
    ddd: date.toLocaleDateString('en-US', { weekday: 'short' }),
    dd: String(date.getDate()).padStart(2, '0'),
    d: String(date.getDate()),

    // Hour formats (12-hour)
    hh: String(date.getHours() % 12 || 12).padStart(2, '0'),
    h: String(date.getHours() % 12 || 12),

    // Hour formats (24-hour)
    HH: String(date.getHours()).padStart(2, '0'),
    H: String(date.getHours()),

    // Minute formats
    nn: String(date.getMinutes()).padStart(2, '0'),
    n: String(date.getMinutes()),

    // Second formats
    ss: String(date.getSeconds()).padStart(2, '0'),
    s: String(date.getSeconds()),

    // AM/PM
    'AM/PM': date.getHours() >= 12 ? 'PM' : 'AM',
    'am/pm': date.getHours() >= 12 ? 'pm' : 'am',
    'A/P': date.getHours() >= 12 ? 'P' : 'A',
    'a/p': date.getHours() >= 12 ? 'p' : 'a',
  };

  let result = format;

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(formatMap).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const regex = new RegExp(key, 'gi');
    result = result.replace(regex, formatMap[key]);
  }

  return result;
}

/**
 * Internal number formatting function
 */
function formatNumber(num: number, format: string): string {
  // Handle predefined formats
  switch (format.toLowerCase()) {
    case 'general number':
    case 'g':
      return num.toString();

    case 'currency':
    case 'c':
      return FormatCurrency(num);

    case 'fixed':
    case 'f':
      return num.toFixed(2);

    case 'standard':
    case 'n':
      return FormatNumber(num, 2);

    case 'percent':
    case 'p':
      return FormatPercent(num);

    case 'scientific':
    case 'e':
      return num.toExponential();

    case 'yes/no':
      return num !== 0 ? 'Yes' : 'No';

    case 'true/false':
      return num !== 0 ? 'True' : 'False';

    case 'on/off':
      return num !== 0 ? 'On' : 'Off';
  }

  // Handle custom numeric formats (simplified)
  // This is a basic implementation - VB6's Format function is very complex
  let result = format;

  // Replace # with digits
  const numStr = Math.abs(num).toString();
  result = result.replace(/#/g, (match, offset) => {
    const digitIndex = offset;
    return digitIndex < numStr.length ? numStr[digitIndex] : '';
  });

  // Replace 0 with digits (with zero padding)
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.abs(num) - integerPart;

  if (result.includes('0')) {
    const parts = result.split('.');
    if (parts[0]) {
      const intStr = integerPart.toString().padStart(parts[0].length, '0');
      result = result.replace(/0+/, intStr);
    }
  }

  // Handle negative numbers
  if (num < 0 && !result.includes('-')) {
    result = '-' + result;
  }

  return result;
}

/**
 * Internal string formatting function
 */
function formatString(str: string, format: string): string {
  switch (format.toLowerCase()) {
    case '>':
      return str.toUpperCase();
    case '<':
      return str.toLowerCase();
    case '@':
      return str; // Character placeholder
    default:
      return str;
  }
}

// Additional formatting functions

/**
 * MonthName function - returns month name
 */
export function MonthName(month: number, abbreviate: boolean = false): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthsShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  if (month < 1 || month > 12) return '';

  return abbreviate ? monthsShort[month - 1] : months[month - 1];
}

/**
 * WeekdayName function - returns weekday name
 */
export function WeekdayName(
  weekday: number,
  abbreviate: boolean = false,
  firstDayOfWeek: number = 1
): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Adjust for first day of week
  const adjustedWeekday = (weekday - firstDayOfWeek + 7) % 7;

  if (adjustedWeekday < 0 || adjustedWeekday > 6) return '';

  return abbreviate ? weekdaysShort[adjustedWeekday] : weekdays[adjustedWeekday];
}

// Export all functions
export const VB6FormatFunctions = {
  Format,
  FormatCurrency,
  FormatDateTime,
  FormatNumber,
  FormatPercent,
  MonthName,
  WeekdayName,
  VB6FormatConstants,
};
