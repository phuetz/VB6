/**
 * VB6 Comprehensive String Functions
 * Complete implementation of all VB6 string manipulation functions
 */

// ============================================================================
// Core String Functions
// ============================================================================

/**
 * Asc - Returns ASCII code of first character
 */
export function Asc(character: string): number {
  if (!character || character.length === 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return character.charCodeAt(0);
}

/**
 * AscB - Returns byte value of first byte in string
 */
export function AscB(character: string): number {
  if (!character || character.length === 0) {
    throw new Error('Invalid procedure call or argument');
  }
  const encoder = new TextEncoder();
  const bytes = encoder.encode(character);
  return bytes[0] || 0;
}

/**
 * AscW - Returns Unicode code of first character
 */
export function AscW(character: string): number {
  if (!character || character.length === 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return character.charCodeAt(0);
}

/**
 * Chr - Returns character from ASCII code
 */
export function Chr(charCode: number): string {
  if (charCode < 0 || charCode > 255) {
    throw new Error('Invalid procedure call or argument');
  }
  return String.fromCharCode(charCode);
}

/**
 * ChrB - Returns single-byte character
 */
export function ChrB(charCode: number): string {
  if (charCode < 0 || charCode > 255) {
    throw new Error('Invalid procedure call or argument');
  }
  return String.fromCharCode(charCode);
}

/**
 * ChrW - Returns character from Unicode code
 */
export function ChrW(charCode: number): string {
  if (charCode < -32768 || charCode > 65535) {
    throw new Error('Invalid procedure call or argument');
  }
  return String.fromCharCode(charCode < 0 ? charCode + 65536 : charCode);
}

/**
 * InStr - Find substring position (1-based)
 */
export function InStr(
  start: number | string,
  string1?: string,
  string2?: string,
  compare?: number
): number {
  let startPos: number;
  let searchIn: string;
  let searchFor: string;
  let compareMode: number;

  // Handle overloaded signatures
  if (typeof start === 'string') {
    startPos = 1;
    searchIn = start;
    searchFor = string1 || '';
    compareMode = typeof string2 === 'number' ? string2 : 0;
  } else {
    startPos = start;
    searchIn = string1 || '';
    searchFor = string2 || '';
    compareMode = compare || 0;
  }

  if (startPos < 1) {
    throw new Error('Invalid procedure call or argument');
  }

  if (searchIn === '' || startPos > searchIn.length) {
    return 0;
  }

  if (searchFor === '') {
    return startPos;
  }

  // Binary or text comparison
  if (compareMode === 1) {
    // Text comparison (case-insensitive)
    const lowerSearchIn = searchIn.toLowerCase();
    const lowerSearchFor = searchFor.toLowerCase();
    const index = lowerSearchIn.indexOf(lowerSearchFor, startPos - 1);
    return index === -1 ? 0 : index + 1;
  } else {
    // Binary comparison (case-sensitive)
    const index = searchIn.indexOf(searchFor, startPos - 1);
    return index === -1 ? 0 : index + 1;
  }
}

/**
 * InStrB - Find byte position in string
 */
export function InStrB(
  start: number | string,
  string1?: string,
  string2?: string,
  compare?: number
): number {
  // For simplicity, treat as InStr in browser environment
  return InStr(start, string1, string2, compare);
}

/**
 * InStrRev - Find substring from end (1-based)
 */
export function InStrRev(
  stringCheck: string,
  stringMatch: string,
  start?: number,
  compare?: number
): number {
  if (!stringCheck) return 0;
  if (!stringMatch) return start || stringCheck.length;

  const startPos = start !== undefined ? start : stringCheck.length;
  const compareMode = compare || 0;

  if (startPos < 1 || startPos > stringCheck.length) {
    if (startPos === -1) {
      // -1 means start from end
      const searchIn = compareMode === 1 ? stringCheck.toLowerCase() : stringCheck;
      const searchFor = compareMode === 1 ? stringMatch.toLowerCase() : stringMatch;
      const index = searchIn.lastIndexOf(searchFor);
      return index === -1 ? 0 : index + 1;
    }
    throw new Error('Invalid procedure call or argument');
  }

  const searchPortion = stringCheck.substring(0, startPos);
  const searchIn = compareMode === 1 ? searchPortion.toLowerCase() : searchPortion;
  const searchFor = compareMode === 1 ? stringMatch.toLowerCase() : stringMatch;
  const index = searchIn.lastIndexOf(searchFor);

  return index === -1 ? 0 : index + 1;
}

/**
 * LCase - Convert to lowercase
 */
export function LCase(str: string): string {
  return str?.toLowerCase() || '';
}

/**
 * UCase - Convert to uppercase
 */
export function UCase(str: string): string {
  return str?.toUpperCase() || '';
}

/**
 * Left - Extract left portion of string
 */
export function Left(str: string, length: number): string {
  if (length < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  if (!str) return '';
  return str.substring(0, length);
}

/**
 * LeftB - Extract left bytes
 */
export function LeftB(str: string, length: number): string {
  // Simplified implementation for browser
  return Left(str, Math.floor(length / 2));
}

/**
 * Right - Extract right portion of string
 */
export function Right(str: string, length: number): string {
  if (length < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  if (!str) return '';
  if (length >= str.length) return str;
  return str.substring(str.length - length);
}

/**
 * RightB - Extract right bytes
 */
export function RightB(str: string, length: number): string {
  return Right(str, Math.floor(length / 2));
}

/**
 * Mid - Extract middle portion of string
 */
export function Mid(str: string, start: number, length?: number): string {
  if (start < 1) {
    throw new Error('Invalid procedure call or argument');
  }
  if (!str) return '';
  if (start > str.length) return '';

  const startIndex = start - 1;
  if (length === undefined) {
    return str.substring(startIndex);
  }
  if (length < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return str.substring(startIndex, startIndex + length);
}

/**
 * MidB - Extract middle bytes
 */
export function MidB(str: string, start: number, length?: number): string {
  return Mid(str, Math.ceil(start / 2), length !== undefined ? Math.floor(length / 2) : undefined);
}

/**
 * Len - Get string length
 */
export function Len(expression: any): number {
  if (expression === null || expression === undefined) {
    return 0;
  }
  if (typeof expression === 'string') {
    return expression.length;
  }
  // For other types, return size in memory (simplified)
  if (typeof expression === 'number') {
    return Number.isInteger(expression) ? 4 : 8;
  }
  if (typeof expression === 'boolean') {
    return 2;
  }
  return String(expression).length;
}

/**
 * LenB - Get byte length
 */
export function LenB(expression: any): number {
  if (expression === null || expression === undefined) {
    return 0;
  }
  if (typeof expression === 'string') {
    return expression.length * 2; // Unicode = 2 bytes per char
  }
  return Len(expression) * 2;
}

/**
 * LTrim - Remove leading spaces
 */
export function LTrim(str: string): string {
  return str?.replace(/^\s+/, '') || '';
}

/**
 * RTrim - Remove trailing spaces
 */
export function RTrim(str: string): string {
  return str?.replace(/\s+$/, '') || '';
}

/**
 * Trim - Remove leading and trailing spaces
 */
export function Trim(str: string): string {
  return str?.trim() || '';
}

/**
 * Space - Create string of spaces
 */
export function Space(number: number): string {
  if (number < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return ' '.repeat(number);
}

/**
 * String - Create string of repeated character
 */
export function String$(number: number, character: string | number): string {
  if (number < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  const char = typeof character === 'number' ? Chr(character) : character.charAt(0);
  return char.repeat(number);
}

/**
 * StrComp - Compare two strings
 */
export function StrComp(string1: string, string2: string, compare?: number): number {
  const compareMode = compare || 0;

  let s1 = string1 || '';
  let s2 = string2 || '';

  if (compareMode === 1) {
    // Text comparison
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  }

  if (s1 === s2) return 0;
  if (s1 < s2) return -1;
  return 1;
}

/**
 * StrConv - Convert string format
 */
export function StrConv(str: string, conversion: number, LCID?: number): string {
  if (!str) return '';

  let result = str;

  // vbUpperCase = 1
  if (conversion & 1) {
    result = result.toUpperCase();
  }
  // vbLowerCase = 2
  if (conversion & 2) {
    result = result.toLowerCase();
  }
  // vbProperCase = 3
  if ((conversion & 3) === 3) {
    result = result.replace(/\w\S*/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
  // vbWide = 4 (half-width to full-width)
  if (conversion & 4) {
    result = result.replace(/[\x21-\x7E]/g, char =>
      String.fromCharCode(char.charCodeAt(0) + 0xFEE0)
    );
  }
  // vbNarrow = 8 (full-width to half-width)
  if (conversion & 8) {
    result = result.replace(/[\uFF01-\uFF5E]/g, char =>
      String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    );
  }
  // vbKatakana = 16
  // vbHiragana = 32
  // vbUnicode = 64
  // vbFromUnicode = 128

  return result;
}

/**
 * StrReverse - Reverse string
 */
export function StrReverse(expression: string): string {
  if (!expression) return '';
  return expression.split('').reverse().join('');
}

/**
 * Replace - Replace occurrences in string
 */
export function Replace(
  expression: string,
  find: string,
  replace: string,
  start?: number,
  count?: number,
  compare?: number
): string {
  if (!expression) return '';
  if (!find) return expression;

  const startPos = start || 1;
  const maxCount = count !== undefined ? count : -1;
  const compareMode = compare || 0;

  if (startPos < 1) {
    throw new Error('Invalid procedure call or argument');
  }

  // Get portion from start position
  let result = startPos > 1 ? expression.substring(startPos - 1) : expression;

  if (compareMode === 1) {
    // Text comparison (case-insensitive)
    let replaced = 0;
    const findLower = find.toLowerCase();
    let pos = 0;

    while (true) {
      const foundPos = result.toLowerCase().indexOf(findLower, pos);
      if (foundPos === -1) break;
      if (maxCount !== -1 && replaced >= maxCount) break;

      result = result.substring(0, foundPos) + replace + result.substring(foundPos + find.length);
      pos = foundPos + replace.length;
      replaced++;
    }
  } else {
    // Binary comparison
    if (maxCount === -1) {
      result = result.split(find).join(replace);
    } else {
      let replaced = 0;
      let pos = 0;

      while (replaced < maxCount) {
        const foundPos = result.indexOf(find, pos);
        if (foundPos === -1) break;

        result = result.substring(0, foundPos) + replace + result.substring(foundPos + find.length);
        pos = foundPos + replace.length;
        replaced++;
      }
    }
  }

  return result;
}

/**
 * Split - Split string into array
 */
export function Split(
  expression: string,
  delimiter?: string,
  limit?: number,
  compare?: number
): string[] {
  if (!expression) return [''];

  const delim = delimiter !== undefined ? delimiter : ' ';
  const maxParts = limit !== undefined ? limit : -1;
  const compareMode = compare || 0;

  if (delim === '') {
    return [expression];
  }

  let parts: string[];

  if (compareMode === 1) {
    // Case-insensitive split
    const delimLower = delim.toLowerCase();
    const exprLower = expression.toLowerCase();
    const indices: number[] = [];
    let pos = 0;

    while (true) {
      const idx = exprLower.indexOf(delimLower, pos);
      if (idx === -1) break;
      indices.push(idx);
      pos = idx + delim.length;
    }

    parts = [];
    let lastEnd = 0;

    for (const idx of indices) {
      parts.push(expression.substring(lastEnd, idx));
      lastEnd = idx + delim.length;
    }
    parts.push(expression.substring(lastEnd));
  } else {
    parts = expression.split(delim);
  }

  if (maxParts > 0 && parts.length > maxParts) {
    const excess = parts.splice(maxParts - 1);
    parts.push(excess.join(delim));
  }

  return parts;
}

/**
 * Join - Join array into string
 */
export function Join(sourceArray: any[], delimiter?: string): string {
  if (!sourceArray || sourceArray.length === 0) return '';
  const delim = delimiter !== undefined ? delimiter : ' ';
  return sourceArray.join(delim);
}

/**
 * Filter - Filter array by criteria
 */
export function Filter(
  sourceArray: string[],
  match: string,
  include?: boolean,
  compare?: number
): string[] {
  if (!sourceArray || sourceArray.length === 0) return [];

  const shouldInclude = include !== false;
  const compareMode = compare || 0;

  const matchLower = compareMode === 1 ? match.toLowerCase() : match;

  return sourceArray.filter(item => {
    const itemToCheck = compareMode === 1 ? item.toLowerCase() : item;
    const found = itemToCheck.includes(matchLower);
    return shouldInclude ? found : !found;
  });
}

// ============================================================================
// Format Functions
// ============================================================================

/**
 * Format$ - Format a value
 */
export function Format$(
  expression: any,
  format?: string,
  firstDayOfWeek?: number,
  firstWeekOfYear?: number
): string {
  if (format === undefined || format === '') {
    return String(expression);
  }

  // Number formats
  if (typeof expression === 'number') {
    return formatNumber(expression, format);
  }

  // Date formats
  if (expression instanceof Date) {
    return formatDate(expression, format, firstDayOfWeek, firstWeekOfYear);
  }

  // String - just return
  return String(expression);
}

function formatNumber(num: number, format: string): string {
  const formatLower = format.toLowerCase();

  // Predefined formats
  switch (formatLower) {
    case 'general number':
      return String(num);
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    case 'fixed':
      return num.toFixed(2);
    case 'standard':
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(num);
    case 'percent':
      return (num * 100).toFixed(2) + '%';
    case 'scientific':
      return num.toExponential(2);
    case 'yes/no':
      return num ? 'Yes' : 'No';
    case 'true/false':
      return num ? 'True' : 'False';
    case 'on/off':
      return num ? 'On' : 'Off';
  }

  // Custom format with # and 0
  let result = format;

  // Count decimal places in format
  const decimalPos = format.indexOf('.');
  let decimalPlaces = 0;
  if (decimalPos !== -1) {
    const afterDecimal = format.substring(decimalPos + 1);
    decimalPlaces = (afterDecimal.match(/[0#]/g) || []).length;
  }

  // Format the number
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixedNum = absNum.toFixed(decimalPlaces);

  // Replace format placeholders
  result = format.replace(/[0#,.]+\.?[0#]*/g, fixedNum);

  if (isNegative && !format.includes('-')) {
    result = '-' + result;
  }

  return result;
}

function formatDate(
  date: Date,
  format: string,
  firstDayOfWeek?: number,
  firstWeekOfYear?: number
): string {
  const formatLower = format.toLowerCase();

  // Predefined formats
  switch (formatLower) {
    case 'general date':
      return date.toLocaleString();
    case 'long date':
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    case 'medium date':
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    case 'short date':
      return date.toLocaleDateString('en-US');
    case 'long time':
      return date.toLocaleTimeString('en-US');
    case 'medium time':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'short time':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // Custom format
  const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');

  const replacements: Record<string, string> = {
    'yyyy': date.getFullYear().toString(),
    'yy': (date.getFullYear() % 100).toString().padStart(2, '0'),
    'mmmm': date.toLocaleDateString('en-US', { month: 'long' }),
    'mmm': date.toLocaleDateString('en-US', { month: 'short' }),
    'mm': pad(date.getMonth() + 1),
    'm': (date.getMonth() + 1).toString(),
    'dddd': date.toLocaleDateString('en-US', { weekday: 'long' }),
    'ddd': date.toLocaleDateString('en-US', { weekday: 'short' }),
    'dd': pad(date.getDate()),
    'd': date.getDate().toString(),
    'hh': pad(date.getHours()),
    'h': date.getHours().toString(),
    'nn': pad(date.getMinutes()),
    'n': date.getMinutes().toString(),
    'ss': pad(date.getSeconds()),
    's': date.getSeconds().toString(),
    'am/pm': date.getHours() < 12 ? 'AM' : 'PM',
    'a/p': date.getHours() < 12 ? 'A' : 'P'
  };

  let result = format;
  // Sort by length descending to replace longer patterns first
  const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const regex = new RegExp(key, 'gi');
    result = result.replace(regex, replacements[key]);
  }

  return result;
}

/**
 * FormatCurrency - Format as currency
 */
export function FormatCurrency(
  expression: number,
  numDigitsAfterDecimal?: number,
  includeLeadingDigit?: number,
  useParensForNegativeNumbers?: number,
  groupDigits?: number
): string {
  const digits = numDigitsAfterDecimal !== undefined ? numDigitsAfterDecimal : 2;
  const useParens = useParensForNegativeNumbers === -1;
  const useGrouping = groupDigits !== 0;

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping
  };

  let result = new Intl.NumberFormat('en-US', options).format(Math.abs(expression));

  if (expression < 0) {
    result = useParens ? `(${result})` : `-${result}`;
  }

  return result;
}

/**
 * FormatNumber - Format as number
 */
export function FormatNumber(
  expression: number,
  numDigitsAfterDecimal?: number,
  includeLeadingDigit?: number,
  useParensForNegativeNumbers?: number,
  groupDigits?: number
): string {
  const digits = numDigitsAfterDecimal !== undefined ? numDigitsAfterDecimal : 2;
  const useParens = useParensForNegativeNumbers === -1;
  const useGrouping = groupDigits !== 0;
  const leadingDigit = includeLeadingDigit !== 0;

  let absValue = Math.abs(expression);
  let result: string;

  if (useGrouping) {
    result = absValue.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  } else {
    result = absValue.toFixed(digits);
  }

  // Handle leading digit
  if (!leadingDigit && absValue < 1 && absValue > 0) {
    result = result.replace(/^0\./, '.');
  }

  if (expression < 0) {
    result = useParens ? `(${result})` : `-${result}`;
  }

  return result;
}

/**
 * FormatPercent - Format as percentage
 */
export function FormatPercent(
  expression: number,
  numDigitsAfterDecimal?: number,
  includeLeadingDigit?: number,
  useParensForNegativeNumbers?: number,
  groupDigits?: number
): string {
  const digits = numDigitsAfterDecimal !== undefined ? numDigitsAfterDecimal : 2;
  const useParens = useParensForNegativeNumbers === -1;

  const percentage = expression * 100;
  let result = FormatNumber(Math.abs(percentage), digits, includeLeadingDigit, 0, groupDigits);

  result = result + '%';

  if (expression < 0) {
    result = useParens ? `(${result})` : `-${result}`;
  }

  return result;
}

/**
 * FormatDateTime - Format date/time
 */
export function FormatDateTime(
  date: Date | string | number,
  namedFormat?: number
): string {
  const d = date instanceof Date ? date : new Date(date);

  switch (namedFormat) {
    case 0: // vbGeneralDate
      return d.toLocaleString();
    case 1: // vbLongDate
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    case 2: // vbShortDate
      return d.toLocaleDateString('en-US');
    case 3: // vbLongTime
      return d.toLocaleTimeString('en-US');
    case 4: // vbShortTime
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    default:
      return d.toLocaleString();
  }
}

// ============================================================================
// Export all functions
// ============================================================================

export const VB6StringFunctions = {
  Asc,
  AscB,
  AscW,
  Chr,
  ChrB,
  ChrW,
  InStr,
  InStrB,
  InStrRev,
  LCase,
  UCase,
  Left,
  LeftB,
  Right,
  RightB,
  Mid,
  MidB,
  Len,
  LenB,
  LTrim,
  RTrim,
  Trim,
  Space,
  String$,
  StrComp,
  StrConv,
  StrReverse,
  Replace,
  Split,
  Join,
  Filter,
  Format$,
  FormatCurrency,
  FormatNumber,
  FormatPercent,
  FormatDateTime
};

export default VB6StringFunctions;
