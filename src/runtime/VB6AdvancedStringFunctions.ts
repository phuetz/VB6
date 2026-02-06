/**
 * VB6 Advanced String Functions Implementation
 *
 * Complete implementation of all VB6 string manipulation functions
 * including StrConv, StrReverse, Space, String, Filter, and more
 */

// String conversion constants
export enum VbStrConv {
  vbUpperCase = 1,
  vbLowerCase = 2,
  vbProperCase = 3,
  vbWide = 4, // Not applicable in JavaScript
  vbNarrow = 8, // Not applicable in JavaScript
  vbKatakana = 16, // Japanese specific
  vbHiragana = 32, // Japanese specific
  vbUnicode = 64,
  vbFromUnicode = 128,
}

// String comparison constants
export enum VbCompareMethod {
  vbBinaryCompare = 0,
  vbTextCompare = 1,
  vbDatabaseCompare = 2,
}

/**
 * StrConv - Convert string to specified format
 */
export function StrConv(str: string, conversion: VbStrConv, localeID?: number): string {
  if (str === null || str === undefined) return '';

  let result = str;

  // Handle multiple conversions (flags can be combined)
  if (conversion & VbStrConv.vbUpperCase) {
    result = result.toUpperCase();
  }

  if (conversion & VbStrConv.vbLowerCase) {
    result = result.toLowerCase();
  }

  if (conversion & VbStrConv.vbProperCase) {
    result = result.replace(/\w\S*/g, txt => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  if (conversion & VbStrConv.vbUnicode) {
    // Convert from ANSI to Unicode (in JS, strings are already Unicode)
    // This would be used for byte array conversions in VB6
    // No conversion needed as JavaScript strings are already Unicode
  }

  if (conversion & VbStrConv.vbFromUnicode) {
    // Convert from Unicode to ANSI
    // In JavaScript, we'll just ensure ASCII characters
    result = result.replace(/[^\x20-\x7F]/g, '?');
  }

  // Japanese conversions (simplified)
  if (conversion & VbStrConv.vbKatakana) {
    // Convert Hiragana to Katakana
    result = result.replace(/[\u3041-\u3096]/g, match => {
      return String.fromCharCode(match.charCodeAt(0) + 0x60);
    });
  }

  if (conversion & VbStrConv.vbHiragana) {
    // Convert Katakana to Hiragana
    result = result.replace(/[\u30A1-\u30F6]/g, match => {
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
  }

  return result;
}

/**
 * StrReverse - Reverse a string
 */
export function StrReverse(str: string): string {
  if (str === null || str === undefined) return '';
  return str.split('').reverse().join('');
}

/**
 * Space - Returns a string of spaces
 */
export function Space(count: number): string {
  if (count < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return ' '.repeat(count);
}

/**
 * String - Returns a string of repeated characters
 */
export function String(count: number, character: string | number): string {
  if (count < 0) {
    throw new Error('Invalid procedure call or argument');
  }

  let char: string;
  if (typeof character === 'number') {
    // ASCII code
    char = String.fromCharCode(character);
  } else if (typeof character === 'string' && character.length > 0) {
    char = character.charAt(0);
  } else {
    throw new Error('Invalid procedure call or argument');
  }

  return char.repeat(count);
}

/**
 * Filter - Filter array based on search criteria
 */
export function Filter(
  sourceArray: string[],
  searchString: string,
  include: boolean = true,
  compare: VbCompareMethod = VbCompareMethod.vbBinaryCompare
): string[] {
  if (!Array.isArray(sourceArray)) {
    throw new Error('Type mismatch');
  }

  const isTextCompare = compare === VbCompareMethod.vbTextCompare;
  const searchLower = isTextCompare ? searchString.toLowerCase() : searchString;

  return sourceArray.filter(item => {
    if (item === null || item === undefined) return false;

    const itemStr = String(item);
    const itemCompare = isTextCompare ? itemStr.toLowerCase() : itemStr;
    const found = itemCompare.includes(searchLower);

    return include ? found : !found;
  });
}

/**
 * Join - Join array elements into string
 */
export function Join(sourceArray: any[], delimiter: string = ' '): string {
  if (!Array.isArray(sourceArray)) {
    throw new Error('Type mismatch');
  }

  return sourceArray
    .map(item => {
      if (item === null || item === undefined) return '';
      return String(item);
    })
    .join(delimiter);
}

/**
 * Split - Split string into array
 */
export function Split(
  expression: string,
  delimiter: string = ' ',
  limit: number = -1,
  compare: VbCompareMethod = VbCompareMethod.vbBinaryCompare
): string[] {
  if (expression === null || expression === undefined) {
    return [];
  }

  const str = String(expression);

  if (delimiter === '') {
    // VB6 returns single element array with whole string
    return [str];
  }

  // Handle text comparison
  if (compare === VbCompareMethod.vbTextCompare) {
    // Case-insensitive split
    const regex = new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const parts = str.split(regex);

    if (limit > 0 && parts.length > limit) {
      // Combine remaining parts
      const result = parts.slice(0, limit - 1);
      result.push(parts.slice(limit - 1).join(delimiter));
      return result;
    }

    return parts;
  } else {
    // Binary comparison (case-sensitive)
    const parts = str.split(delimiter);

    if (limit > 0 && parts.length > limit) {
      // Combine remaining parts
      const result = parts.slice(0, limit - 1);
      result.push(parts.slice(limit - 1).join(delimiter));
      return result;
    }

    return parts;
  }
}

/**
 * Replace - Replace occurrences in string
 */
export function Replace(
  expression: string,
  find: string,
  replacement: string,
  start: number = 1,
  count: number = -1,
  compare: VbCompareMethod = VbCompareMethod.vbBinaryCompare
): string {
  if (expression === null || expression === undefined) return '';
  if (find === '') return expression;

  let str = String(expression);

  // Handle start position (1-based in VB6)
  if (start > 1) {
    const prefix = str.substring(0, start - 1);
    str = str.substring(start - 1);
    return prefix + Replace(str, find, replacement, 1, count, compare);
  }

  // Create regex pattern
  const flags = compare === VbCompareMethod.vbTextCompare ? 'gi' : 'g';
  const pattern = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(pattern, flags);

  if (count === -1) {
    // Replace all occurrences
    return str.replace(regex, replacement);
  } else {
    // Replace limited occurrences
    let replacedCount = 0;
    return str.replace(regex, match => {
      if (replacedCount < count) {
        replacedCount++;
        return replacement;
      }
      return match;
    });
  }
}

/**
 * InStrRev - Find string from end
 */
export function InStrRev(
  stringCheck: string,
  stringMatch: string,
  start: number = -1,
  compare: VbCompareMethod = VbCompareMethod.vbBinaryCompare
): number {
  if (!stringCheck || !stringMatch) return 0;

  const str = String(stringCheck);
  const search = String(stringMatch);

  // Determine actual start position
  const startPos = start === -1 ? str.length : Math.min(start, str.length);

  // Get substring to search
  const searchStr = str.substring(0, startPos);

  // Perform search
  let lastIndex: number;
  if (compare === VbCompareMethod.vbTextCompare) {
    // Case-insensitive search
    lastIndex = searchStr.toLowerCase().lastIndexOf(search.toLowerCase());
  } else {
    // Case-sensitive search
    lastIndex = searchStr.lastIndexOf(search);
  }

  // VB6 returns 1-based index, 0 if not found
  return lastIndex === -1 ? 0 : lastIndex + 1;
}

/**
 * StrComp - Compare strings
 */
export function StrComp(
  string1: string | null,
  string2: string | null,
  compare: VbCompareMethod = VbCompareMethod.vbBinaryCompare
): number {
  // Handle null values
  if (string1 === null && string2 === null) return 0;
  if (string1 === null) return -1;
  if (string2 === null) return 1;

  const str1 = String(string1);
  const str2 = String(string2);

  let result: number;
  if (compare === VbCompareMethod.vbTextCompare) {
    // Case-insensitive comparison
    result = str1.toLowerCase().localeCompare(str2.toLowerCase());
  } else {
    // Case-sensitive comparison
    result = str1.localeCompare(str2);
  }

  // VB6 returns -1, 0, or 1
  return result < 0 ? -1 : result > 0 ? 1 : 0;
}

/**
 * MonthName - Get month name
 */
export function MonthName(month: number, abbreviate: boolean = false): string {
  if (month < 1 || month > 12) {
    throw new Error('Invalid procedure call or argument');
  }

  const monthNames = [
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

  const monthName = monthNames[month - 1];
  return abbreviate ? monthName.substring(0, 3) : monthName;
}

/**
 * WeekdayName - Get weekday name
 */
export function WeekdayName(
  weekday: number,
  abbreviate: boolean = false,
  firstDayOfWeek: number = 1
): string {
  if (weekday < 1 || weekday > 7) {
    throw new Error('Invalid procedure call or argument');
  }

  const weekdayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Adjust for first day of week
  const index = (weekday + 7 - firstDayOfWeek) % 7;

  const weekdayName = weekdayNames[index];
  return abbreviate ? weekdayName.substring(0, 3) : weekdayName;
}

/**
 * FormatCurrency - Format as currency
 */
export function FormatCurrency(
  expression: any,
  numDigitsAfterDecimal: number = -1,
  includeLeadingDigit: number = -2,
  useParensForNegativeNumbers: number = -2,
  groupDigits: number = -2
): string {
  const value = Number(expression);
  if (isNaN(value)) {
    throw new Error('Type mismatch');
  }

  // Use system defaults if -1 or -2
  const digits = numDigitsAfterDecimal >= 0 ? numDigitsAfterDecimal : 2;

  // Format as currency
  let formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: groupDigits !== 0,
  }).format(Math.abs(value));

  // Handle negative numbers
  if (value < 0) {
    if (useParensForNegativeNumbers !== 0) {
      formatted = `(${formatted})`;
    } else {
      formatted = `-${formatted}`;
    }
  }

  return formatted;
}

/**
 * FormatDateTime - Format date/time
 */
export function FormatDateTime(date: Date | string | number, namedFormat: number = 0): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Type mismatch');
  }

  switch (namedFormat) {
    case 0: // vbGeneralDate
      return dateObj.toLocaleString();
    case 1: // vbLongDate
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 2: // vbShortDate
      return dateObj.toLocaleDateString();
    case 3: // vbLongTime
      return dateObj.toLocaleTimeString();
    case 4: // vbShortTime
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      throw new Error('Invalid procedure call or argument');
  }
}

/**
 * FormatNumber - Format as number
 */
export function FormatNumber(
  expression: any,
  numDigitsAfterDecimal: number = -1,
  includeLeadingDigit: number = -2,
  useParensForNegativeNumbers: number = -2,
  groupDigits: number = -2
): string {
  const value = Number(expression);
  if (isNaN(value)) {
    throw new Error('Type mismatch');
  }

  // Use system defaults if -1 or -2
  const digits = numDigitsAfterDecimal >= 0 ? numDigitsAfterDecimal : 2;

  // Format as number
  let formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: groupDigits !== 0,
  }).format(Math.abs(value));

  // Handle leading digit for decimals
  if (includeLeadingDigit === 0 && Math.abs(value) < 1 && value !== 0) {
    formatted = formatted.replace(/^0\./, '.');
  }

  // Handle negative numbers
  if (value < 0) {
    if (useParensForNegativeNumbers !== 0) {
      formatted = `(${formatted})`;
    } else {
      formatted = `-${formatted}`;
    }
  }

  return formatted;
}

/**
 * FormatPercent - Format as percentage
 */
export function FormatPercent(
  expression: any,
  numDigitsAfterDecimal: number = -1,
  includeLeadingDigit: number = -2,
  useParensForNegativeNumbers: number = -2,
  groupDigits: number = -2
): string {
  const value = Number(expression);
  if (isNaN(value)) {
    throw new Error('Type mismatch');
  }

  // Use system defaults if -1 or -2
  const digits = numDigitsAfterDecimal >= 0 ? numDigitsAfterDecimal : 2;

  // Format as percentage
  let formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: groupDigits !== 0,
  }).format(Math.abs(value));

  // Handle negative numbers
  if (value < 0) {
    if (useParensForNegativeNumbers !== 0) {
      formatted = `(${formatted})`;
    } else {
      formatted = `-${formatted}`;
    }
  }

  return formatted;
}

/**
 * Escape - URL encode string
 */
export function Escape(str: string): string {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str);
}

/**
 * UnEscape - URL decode string
 */
export function UnEscape(str: string): string {
  if (str === null || str === undefined) return '';
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

// Export all functions
export const VB6AdvancedStringFunctions = {
  // Conversion
  StrConv,
  StrReverse,

  // Generation
  Space,
  String,

  // Array operations
  Filter,
  Join,
  Split,

  // Search and replace
  Replace,
  InStrRev,
  StrComp,

  // Date/time names
  MonthName,
  WeekdayName,

  // Formatting
  FormatCurrency,
  FormatDateTime,
  FormatNumber,
  FormatPercent,

  // URL encoding
  Escape,
  UnEscape,

  // Constants
  VbStrConv,
  VbCompareMethod,
};
