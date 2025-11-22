/**
 * VB6 String Functions Implementation
 * 
 * Complete implementation of VB6 string manipulation functions
 */

// VB6 String comparison constants
export const VB6StringConstants = {
  vbBinaryCompare: 0,
  vbTextCompare: 1,
  vbDatabaseCompare: 2,
  
  // StrConv constants
  vbUpperCase: 1,
  vbLowerCase: 2,
  vbProperCase: 3,
  vbWide: 4,
  vbNarrow: 8,
  vbKatakana: 16,
  vbHiragana: 32,
  vbUnicode: 64,
  vbFromUnicode: 128
};

/**
 * Compare two strings with specified comparison method
 * StrComp(string1, string2, [compare])
 */
export function StrComp(string1: string, string2: string, compare: number = VB6StringConstants.vbBinaryCompare): number {
  if (string1 === null || string1 === undefined) string1 = '';
  if (string2 === null || string2 === undefined) string2 = '';
  
  let str1 = String(string1);
  let str2 = String(string2);
  
  // Apply comparison type
  if (compare === VB6StringConstants.vbTextCompare) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
  }
  
  if (str1 < str2) return -1;
  if (str1 > str2) return 1;
  return 0;
}

/**
 * Convert string case and character width
 * StrConv(string, conversion, [LCID])
 */
export function StrConv(inputString: string, conversion: number, LCID?: number): string {
  if (inputString === null || inputString === undefined) return '';
  
  let result = String(inputString);
  
  // Apply conversions (can be combined with bitwise OR)
  if (conversion & VB6StringConstants.vbUpperCase) {
    result = result.toUpperCase();
  }
  
  if (conversion & VB6StringConstants.vbLowerCase) {
    result = result.toLowerCase();
  }
  
  if (conversion & VB6StringConstants.vbProperCase) {
    result = result.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Note: vbWide, vbNarrow, vbKatakana, vbHiragana would require complex Unicode handling
  // Simplified implementation for web environment
  if (conversion & VB6StringConstants.vbWide) {
    // Convert to full-width characters (simplified)
    result = result.replace(/[A-Za-z0-9]/g, char => {
      const code = char.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(code - 33 + 0xFF01);
      }
      return char;
    });
  }
  
  if (conversion & VB6StringConstants.vbNarrow) {
    // Convert to half-width characters (simplified)
    result = result.replace(/[\uFF01-\uFF5E]/g, char => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(code - 0xFF01 + 33);
    });
  }
  
  return result;
}

/**
 * Reverse a string
 * StrReverse(string1)
 */
export function StrReverse(string1: string): string {
  if (string1 === null || string1 === undefined) return '';
  return String(string1).split('').reverse().join('');
}

/**
 * Create a string with repeated spaces
 * Space(number)
 */
export function Space(number: number): string {
  if (number < 0) return '';
  return ' '.repeat(Math.floor(number));
}

/**
 * Create a string with repeated characters
 * String(number, character)
 */
export function StringFunc(number: number, character: string | number): string {
  if (number < 0) return '';
  
  let char: string;
  if (typeof character === 'number') {
    char = String.fromCharCode(character);
  } else {
    char = String(character).charAt(0) || ' ';
  }
  
  return char.repeat(Math.floor(number));
}

/**
 * Filter array of strings based on criteria
 * Filter(sourcearray, match, [include], [compare])
 */
export function Filter(
  sourceArray: string[],
  match: string,
  include: boolean = true,
  compare: number = VB6StringConstants.vbBinaryCompare
): string[] {
  if (!Array.isArray(sourceArray)) return [];
  
  const matchStr = String(match);
  const compareFunc = compare === VB6StringConstants.vbTextCompare 
    ? (s: string) => s.toLowerCase()
    : (s: string) => s;
  
  const normalizedMatch = compareFunc(matchStr);
  
  return sourceArray.filter(item => {
    const normalizedItem = compareFunc(String(item));
    const contains = normalizedItem.indexOf(normalizedMatch) >= 0;
    return include ? contains : !contains;
  });
}

/**
 * Split string into array
 * Split(expression, [delimiter], [limit], [compare])
 */
export function Split(
  expression: string,
  delimiter: string = ' ',
  limit: number = -1,
  compare: number = VB6StringConstants.vbBinaryCompare
): string[] {
  if (expression === null || expression === undefined) return [''];
  
  const str = String(expression);
  const delim = String(delimiter);
  
  if (delim === '') {
    // Split every character
    const chars = str.split('');
    return limit > 0 ? chars.slice(0, limit) : chars;
  }
  
  let parts: string[];
  
  if (compare === VB6StringConstants.vbTextCompare) {
    // Case-insensitive split (more complex implementation needed)
    const regex = new RegExp(delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    parts = str.split(regex);
  } else {
    parts = str.split(delim);
  }
  
  return limit > 0 ? parts.slice(0, limit) : parts;
}

/**
 * Join array of strings
 * Join(sourcearray, [delimiter])
 */
export function Join(sourceArray: string[], delimiter: string = ' '): string {
  if (!Array.isArray(sourceArray)) return '';
  return sourceArray.join(String(delimiter));
}

/**
 * Replace occurrences of substring
 * Replace(expression, find, replace, [start], [count], [compare])
 */
export function Replace(
  expression: string,
  find: string,
  replaceWith: string,
  start: number = 1,
  count: number = -1,
  compare: number = VB6StringConstants.vbBinaryCompare
): string {
  if (expression === null || expression === undefined) return '';
  if (find === null || find === undefined) return String(expression);
  
  let str = String(expression);
  const findStr = String(find);
  const replaceStr = String(replaceWith);
  
  // Adjust for VB6 1-based indexing
  const startIndex = Math.max(0, start - 1);
  str = str.substring(startIndex);
  
  if (findStr === '') return str;
  
  let flags = 'g';
  if (compare === VB6StringConstants.vbTextCompare) {
    flags += 'i';
  }
  
  const regex = new RegExp(findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  
  if (count === -1) {
    return str.replace(regex, replaceStr);
  } else {
    let result = str;
    let replacements = 0;
    
    result = result.replace(regex, (match, ...args) => {
      if (replacements < count) {
        replacements++;
        return replaceStr;
      }
      return match;
    });
    
    return result;
  }
}

/**
 * Get substring from left
 * Left(string, length)
 */
export function Left(inputString: string, length: number): string {
  if (inputString === null || inputString === undefined) return '';
  const str = String(inputString);
  return str.substring(0, Math.max(0, Math.floor(length)));
}

/**
 * Get substring from right
 * Right(string, length)
 */
export function Right(inputString: string, length: number): string {
  if (inputString === null || inputString === undefined) return '';
  const str = String(inputString);
  const len = Math.max(0, Math.floor(length));
  return str.substring(Math.max(0, str.length - len));
}

/**
 * Get substring from middle
 * Mid(string, start, [length])
 */
export function Mid(inputString: string, start: number, length?: number): string {
  if (inputString === null || inputString === undefined) return '';
  const str = String(inputString);
  
  // VB6 uses 1-based indexing
  const startIndex = Math.max(0, start - 1);
  
  if (length === undefined) {
    return str.substring(startIndex);
  } else {
    const len = Math.max(0, Math.floor(length));
    return str.substring(startIndex, startIndex + len);
  }
}

/**
 * Find position of substring
 * InStr([start], string1, string2, [compare])
 */
export function InStr(
  start: number | string,
  string1?: string,
  string2?: string,
  compare?: number
): number {
  // Handle overloaded parameters
  let startPos: number;
  let searchIn: string;
  let searchFor: string;
  let compareType: number;
  
  if (typeof start === 'string') {
    // InStr(string1, string2, [compare])
    startPos = 1;
    searchIn = start;
    searchFor = string1 || '';
    compareType = (string2 as number) || VB6StringConstants.vbBinaryCompare;
  } else {
    // InStr(start, string1, string2, [compare])
    startPos = start || 1;
    searchIn = string1 || '';
    searchFor = string2 || '';
    compareType = compare || VB6StringConstants.vbBinaryCompare;
  }
  
  if (searchIn === '' || searchFor === '') return 0;
  
  // Adjust for VB6 1-based indexing
  const startIndex = Math.max(0, startPos - 1);
  const substr = searchIn.substring(startIndex);
  
  let index: number;
  if (compareType === VB6StringConstants.vbTextCompare) {
    index = substr.toLowerCase().indexOf(searchFor.toLowerCase());
  } else {
    index = substr.indexOf(searchFor);
  }
  
  return index >= 0 ? index + startIndex + 1 : 0; // Convert back to 1-based
}

/**
 * Find position of substring from right
 * InStrRev(stringcheck, stringmatch, [start], [compare])
 */
export function InStrRev(
  stringCheck: string,
  stringMatch: string,
  start?: number,
  compare: number = VB6StringConstants.vbBinaryCompare
): number {
  if (stringCheck === null || stringCheck === undefined) return 0;
  if (stringMatch === null || stringMatch === undefined) return 0;
  
  const checkStr = String(stringCheck);
  const matchStr = String(stringMatch);
  
  if (checkStr === '' || matchStr === '') return 0;
  
  let searchStr = checkStr;
  if (start !== undefined && start > 0) {
    // VB6 uses 1-based indexing
    searchStr = checkStr.substring(0, start);
  }
  
  let index: number;
  if (compare === VB6StringConstants.vbTextCompare) {
    index = searchStr.toLowerCase().lastIndexOf(matchStr.toLowerCase());
  } else {
    index = searchStr.lastIndexOf(matchStr);
  }
  
  return index >= 0 ? index + 1 : 0; // Convert to 1-based
}

/**
 * Remove leading spaces
 * LTrim(string)
 */
export function LTrim(inputString: string): string {
  if (inputString === null || inputString === undefined) return '';
  return String(inputString).replace(/^\s+/, '');
}

/**
 * Remove trailing spaces
 * RTrim(string)
 */
export function RTrim(inputString: string): string {
  if (inputString === null || inputString === undefined) return '';
  return String(inputString).replace(/\s+$/, '');
}

/**
 * Remove leading and trailing spaces
 * Trim(string)
 */
export function Trim(inputString: string): string {
  if (inputString === null || inputString === undefined) return '';
  return String(inputString).trim();
}

/**
 * Get length of string
 * Len(string)
 */
export function Len(inputString: string | any): number {
  if (inputString === null || inputString === undefined) return 0;
  return String(inputString).length;
}

/**
 * Get ASCII code of character
 * Asc(string)
 */
export function Asc(inputString: string): number {
  if (inputString === null || inputString === undefined || inputString === '') {
    throw new Error('Invalid procedure call or argument');
  }
  return String(inputString).charCodeAt(0);
}

/**
 * Get character from ASCII code
 * Chr(charcode)
 */
export function Chr(charCode: number): string {
  if (charCode < 0 || charCode > 65535) {
    throw new Error('Invalid procedure call or argument');
  }
  return String.fromCharCode(Math.floor(charCode));
}

/**
 * Convert string to uppercase
 * UCase(string)
 */
export function UCase(inputString: string): string {
  if (inputString === null || inputString === undefined) return '';
  return String(inputString).toUpperCase();
}

/**
 * Convert string to lowercase
 * LCase(string)
 */
export function LCase(inputString: string): string {
  if (inputString === null || inputString === undefined) return '';
  return String(inputString).toLowerCase();
}

/**
 * Check if character is alphabetic
 * IsAlpha(string) - Custom VB6 extension
 */
export function IsAlpha(inputString: string): boolean {
  if (inputString === null || inputString === undefined || inputString === '') return false;
  const char = String(inputString).charAt(0);
  return /^[A-Za-z]$/.test(char);
}

/**
 * Check if character is numeric
 * IsNumeric(expression)
 */
export function IsNumeric(expression: any): boolean {
  if (expression === null || expression === undefined || expression === '') return false;
  const str = String(expression).trim();
  return !isNaN(Number(str)) && isFinite(Number(str));
}

/**
 * Like operator implementation
 * Like(string, pattern)
 */
export function Like(inputString: string, pattern: string): boolean {
  if (inputString === null || inputString === undefined) inputString = '';
  if (pattern === null || pattern === undefined) pattern = '';
  
  const str = String(inputString);
  const pat = String(pattern);
  
  // Convert VB6 Like pattern to RegExp
  const regexPattern = pat
    .replace(/\\/g, '\\\\')
    .replace(/\./g, '\\.')
    .replace(/\^/g, '\\^')
    .replace(/\$/g, '\\$')
    .replace(/\+/g, '\\+')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\?/g, '.')        // ? matches any single character
    .replace(/\*/g, '.*');      // * matches any sequence of characters
  
  try {
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(str);
  } catch {
    return false;
  }
}

// Export all string functions
export const VB6StringFunctions = {
  StrComp,
  StrConv,
  StrReverse,
  Space,
  String: StringFunc,
  Filter,
  Split,
  Join,
  Replace,
  Left,
  Right,
  Mid,
  InStr,
  InStrRev,
  LTrim,
  RTrim,
  Trim,
  Len,
  Asc,
  Chr,
  UCase,
  LCase,
  IsAlpha,
  IsNumeric,
  Like,
  VB6StringConstants
};