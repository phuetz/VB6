/**
 * VB6 Advanced Array Functions
 * 
 * Extended array manipulation functions for VB6 runtime
 */

export class VB6ArrayFunctions {
  /**
   * Filter - Returns an array containing part of a string array based on filter criteria
   * @param sourceArray Source array to filter
   * @param match String to search for
   * @param include If true, include matches; if false, exclude matches
   * @param compare Comparison method (0=vbBinaryCompare, 1=vbTextCompare)
   */
  static Filter(
    sourceArray: string[],
    match: string,
    include: boolean = true,
    compare: number = 0
  ): string[] {
    if (!Array.isArray(sourceArray)) {
      throw new Error('Type mismatch: sourceArray must be an array');
    }

    const compareFunc = compare === 1 
      ? (a: string, b: string) => a.toLowerCase().includes(b.toLowerCase())
      : (a: string, b: string) => a.includes(b);

    return sourceArray.filter(item => {
      const matches = compareFunc(String(item), match);
      return include ? matches : !matches;
    });
  }

  /**
   * Join - Returns a string created by joining array elements
   * @param sourceArray Array to join
   * @param delimiter Delimiter string (default is space)
   */
  static Join(sourceArray: any[], delimiter: string = ' '): string {
    if (!Array.isArray(sourceArray)) {
      throw new Error('Type mismatch: sourceArray must be an array');
    }
    return sourceArray.map(item => String(item)).join(delimiter);
  }

  /**
   * Split - Returns a zero-based array containing substrings
   * @param expression String to split
   * @param delimiter Delimiter string (default is space)
   * @param limit Maximum number of substrings to return (-1 = all)
   * @param compare Comparison method
   */
  static Split(
    expression: string,
    delimiter: string = ' ',
    limit: number = -1,
    compare: number = 0
  ): string[] {
    if (expression === null || expression === undefined) {
      return [];
    }

    const str = String(expression);
    if (str === '') {
      return [''];
    }

    // Handle regex special characters in delimiter
    const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = compare === 1
      ? new RegExp(escapedDelimiter, 'gi')
      : new RegExp(escapedDelimiter, 'g');

    let result = str.split(regex);
    
    if (limit > 0 && result.length > limit) {
      // VB6 behavior: last element contains remainder
      const limited = result.slice(0, limit - 1);
      limited.push(result.slice(limit - 1).join(delimiter));
      result = limited;
    }

    return result;
  }

  /**
   * Array - Creates a Variant array from argument list
   * @param arglist Variable number of arguments
   */
  static Array(...arglist: any[]): any[] {
    return arglist;
  }

  /**
   * IsArray - Tests whether a variable is an array
   * @param varname Variable to test
   */
  static IsArray(varname: any): boolean {
    return Array.isArray(varname);
  }

  /**
   * LBound - Returns the smallest subscript for a dimension of an array
   * @param arrayname Array to check
   * @param dimension Dimension number (1-based)
   */
  static LBound(arrayname: any[], dimension: number = 1): number {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }
    
    // VB6 arrays can have custom lower bounds, but JS arrays always start at 0
    // For multi-dimensional arrays, we'd need metadata
    if (dimension !== 1) {
      // For simplicity, assume all dimensions start at 0
      return 0;
    }
    
    return 0;
  }

  /**
   * UBound - Returns the largest subscript for a dimension of an array
   * @param arrayname Array to check
   * @param dimension Dimension number (1-based)
   */
  static UBound(arrayname: any[], dimension: number = 1): number {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }
    
    if (dimension === 1) {
      return arrayname.length - 1;
    }
    
    // For multi-dimensional arrays, check first element
    if (arrayname.length > 0 && Array.isArray(arrayname[0])) {
      if (dimension === 2) {
        return arrayname[0].length - 1;
      }
    }
    
    throw new Error('Subscript out of range');
  }

  /**
   * ReDim - Resizes an array (returns new array in JS)
   * @param arrayname Original array
   * @param dimensions New dimensions
   * @param preserve Preserve existing data
   */
  static ReDim(
    arrayname: any[],
    dimensions: number | number[],
    preserve: boolean = false
  ): any[] {
    if (typeof dimensions === 'number') {
      // Single dimension
      const newArray = new Array(dimensions + 1);
      
      if (preserve && Array.isArray(arrayname)) {
        const copyLength = Math.min(arrayname.length, newArray.length);
        for (let i = 0; i < copyLength; i++) {
          newArray[i] = arrayname[i];
        }
      }
      
      // Initialize undefined elements
      for (let i = 0; i < newArray.length; i++) {
        if (newArray[i] === undefined) {
          newArray[i] = null;
        }
      }
      
      return newArray;
    } else if (Array.isArray(dimensions)) {
      // Multi-dimensional array
      return this.createMultiDimensionalArray(dimensions, preserve ? arrayname : null);
    }
    
    throw new Error('Invalid dimensions');
  }

  /**
   * Erase - Reinitializes array elements
   * @param arrays Arrays to erase
   */
  static Erase(...arrays: any[][]): void {
    for (const arr of arrays) {
      if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = null;
        }
      }
    }
  }

  /**
   * ArraySort - Sorts an array (VB6 doesn't have built-in sort)
   * @param arrayname Array to sort
   * @param ascending Sort order
   * @param compareMode Comparison mode
   */
  static ArraySort(
    arrayname: any[],
    ascending: boolean = true,
    compareMode: number = 0
  ): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const sorted = [...arrayname];
    
    sorted.sort((a, b) => {
      // Handle null/undefined
      if (a === null || a === undefined) return ascending ? -1 : 1;
      if (b === null || b === undefined) return ascending ? 1 : -1;
      
      // Text comparison
      if (compareMode === 1) {
        const strA = String(a).toLowerCase();
        const strB = String(b).toLowerCase();
        return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }
      
      // Numeric comparison if possible
      const numA = Number(a);
      const numB = Number(b);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return ascending ? numA - numB : numB - numA;
      }
      
      // Default to string comparison
      const strA = String(a);
      const strB = String(b);
      return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
    
    return sorted;
  }

  /**
   * ArrayReverse - Reverses array elements
   * @param arrayname Array to reverse
   */
  static ArrayReverse(arrayname: any[]): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }
    return [...arrayname].reverse();
  }

  /**
   * ArrayFind - Finds element in array (returns index or -1)
   * @param arrayname Array to search
   * @param searchElement Element to find
   * @param startIndex Starting index
   * @param compareMode Comparison mode
   */
  static ArrayFind(
    arrayname: any[],
    searchElement: any,
    startIndex: number = 0,
    compareMode: number = 0
  ): number {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    for (let i = startIndex; i < arrayname.length; i++) {
      if (this.compareElements(arrayname[i], searchElement, compareMode)) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * ArrayCount - Counts occurrences of element in array
   * @param arrayname Array to search
   * @param searchElement Element to count
   * @param compareMode Comparison mode
   */
  static ArrayCount(
    arrayname: any[],
    searchElement: any,
    compareMode: number = 0
  ): number {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    let count = 0;
    for (const element of arrayname) {
      if (this.compareElements(element, searchElement, compareMode)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * ArrayUnique - Returns array with duplicate elements removed
   * @param arrayname Source array
   * @param compareMode Comparison mode
   */
  static ArrayUnique(arrayname: any[], compareMode: number = 0): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const unique: any[] = [];
    const seen = new Set<string>();
    
    for (const element of arrayname) {
      const key = compareMode === 1 && typeof element === 'string'
        ? element.toLowerCase()
        : String(element);
        
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(element);
      }
    }
    
    return unique;
  }

  /**
   * ArrayCopy - Creates a deep copy of an array
   * @param sourceArray Array to copy
   */
  static ArrayCopy(sourceArray: any[]): any[] {
    if (!Array.isArray(sourceArray)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    return this.deepCopyArray(sourceArray);
  }

  /**
   * ArraySlice - Returns a portion of an array
   * @param arrayname Source array
   * @param startIndex Starting index (inclusive)
   * @param endIndex Ending index (inclusive, -1 for end)
   */
  static ArraySlice(
    arrayname: any[],
    startIndex: number,
    endIndex: number = -1
  ): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const start = Math.max(0, startIndex);
    const end = endIndex === -1 ? arrayname.length : Math.min(arrayname.length, endIndex + 1);
    
    return arrayname.slice(start, end);
  }

  /**
   * ArrayInsert - Inserts elements into array at specified position
   * @param arrayname Target array
   * @param index Insert position
   * @param elements Elements to insert
   */
  static ArrayInsert(arrayname: any[], index: number, ...elements: any[]): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const result = [...arrayname];
    result.splice(index, 0, ...elements);
    return result;
  }

  /**
   * ArrayRemove - Removes elements from array
   * @param arrayname Target array
   * @param index Starting index
   * @param count Number of elements to remove
   */
  static ArrayRemove(arrayname: any[], index: number, count: number = 1): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const result = [...arrayname];
    result.splice(index, count);
    return result;
  }

  /**
   * ArrayFill - Fills array with specified value
   * @param arrayname Target array
   * @param value Fill value
   * @param startIndex Starting index
   * @param endIndex Ending index (-1 for end)
   */
  static ArrayFill(
    arrayname: any[],
    value: any,
    startIndex: number = 0,
    endIndex: number = -1
  ): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const result = [...arrayname];
    const start = Math.max(0, startIndex);
    const end = endIndex === -1 ? result.length : Math.min(result.length, endIndex + 1);
    
    for (let i = start; i < end; i++) {
      result[i] = value;
    }
    
    return result;
  }

  /**
   * ArrayMap - Applies function to each element
   * @param arrayname Source array
   * @param func Function to apply
   */
  static ArrayMap(arrayname: any[], func: (value: any, index: number) => any): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    return arrayname.map(func);
  }

  /**
   * ArrayReduce - Reduces array to single value
   * @param arrayname Source array
   * @param func Reducer function
   * @param initialValue Initial value
   */
  static ArrayReduce(
    arrayname: any[],
    func: (accumulator: any, value: any, index: number) => any,
    initialValue?: any
  ): any {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    if (arrayname.length === 0 && initialValue === undefined) {
      throw new Error('Reduce of empty array with no initial value');
    }

    return arguments.length >= 3
      ? arrayname.reduce(func, initialValue)
      : arrayname.reduce(func);
  }

  /**
   * ArraySum - Calculates sum of numeric array elements
   * @param arrayname Array of numbers
   */
  static ArraySum(arrayname: any[]): number {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    return arrayname.reduce((sum, value) => {
      const num = Number(value);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }

  /**
   * ArrayAverage - Calculates average of numeric array elements
   * @param arrayname Array of numbers
   */
  static ArrayAverage(arrayname: any[]): number {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    if (arrayname.length === 0) {
      return 0;
    }

    const sum = this.ArraySum(arrayname);
    return sum / arrayname.length;
  }

  /**
   * ArrayMin - Finds minimum value in array
   * @param arrayname Array to search
   */
  static ArrayMin(arrayname: any[]): any {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    if (arrayname.length === 0) {
      return null;
    }

    return arrayname.reduce((min, value) => {
      if (min === null || min === undefined) return value;
      if (value === null || value === undefined) return min;
      
      const numMin = Number(min);
      const numValue = Number(value);
      
      if (!isNaN(numMin) && !isNaN(numValue)) {
        return numValue < numMin ? value : min;
      }
      
      return String(value) < String(min) ? value : min;
    });
  }

  /**
   * ArrayMax - Finds maximum value in array
   * @param arrayname Array to search
   */
  static ArrayMax(arrayname: any[]): any {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    if (arrayname.length === 0) {
      return null;
    }

    return arrayname.reduce((max, value) => {
      if (max === null || max === undefined) return value;
      if (value === null || value === undefined) return max;
      
      const numMax = Number(max);
      const numValue = Number(value);
      
      if (!isNaN(numMax) && !isNaN(numValue)) {
        return numValue > numMax ? value : max;
      }
      
      return String(value) > String(max) ? value : max;
    });
  }

  /**
   * ArrayFlatten - Flattens multi-dimensional array
   * @param arrayname Array to flatten
   * @param depth Depth to flatten (Infinity for full flatten)
   */
  static ArrayFlatten(arrayname: any[], depth: number = 1): any[] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    if (depth <= 0) {
      return [...arrayname];
    }

    return arrayname.reduce((acc, val) => {
      if (Array.isArray(val) && depth > 0) {
        return acc.concat(this.ArrayFlatten(val, depth - 1));
      }
      return acc.concat(val);
    }, []);
  }

  /**
   * ArrayZip - Combines multiple arrays element-wise
   * @param arrays Arrays to zip
   */
  static ArrayZip(...arrays: any[][]): any[][] {
    if (arrays.length === 0) {
      return [];
    }

    // Verify all arguments are arrays
    for (const arr of arrays) {
      if (!Array.isArray(arr)) {
        throw new Error('Type mismatch: all arguments must be arrays');
      }
    }

    const minLength = Math.min(...arrays.map(arr => arr.length));
    const result: any[][] = [];

    for (let i = 0; i < minLength; i++) {
      result.push(arrays.map(arr => arr[i]));
    }

    return result;
  }

  /**
   * ArrayPartition - Splits array into two based on predicate
   * @param arrayname Array to partition
   * @param predicate Function that returns true/false
   */
  static ArrayPartition(
    arrayname: any[],
    predicate: (value: any, index: number) => boolean
  ): [any[], any[]] {
    if (!Array.isArray(arrayname)) {
      throw new Error('Type mismatch: argument must be an array');
    }

    const truthy: any[] = [];
    const falsy: any[] = [];

    arrayname.forEach((value, index) => {
      if (predicate(value, index)) {
        truthy.push(value);
      } else {
        falsy.push(value);
      }
    });

    return [truthy, falsy];
  }

  // Helper methods

  private static compareElements(a: any, b: any, compareMode: number): boolean {
    if (a === b) return true;
    
    if (compareMode === 1) {
      // Text compare - case insensitive
      if (typeof a === 'string' && typeof b === 'string') {
        return a.toLowerCase() === b.toLowerCase();
      }
    }
    
    // Try numeric comparison
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA === numB;
    }
    
    // String comparison
    return String(a) === String(b);
  }

  private static createMultiDimensionalArray(
    dimensions: number[],
    sourceArray: any[] | null
  ): any[] {
    if (dimensions.length === 0) {
      return [];
    }

    const size = dimensions[0] + 1;
    const result = new Array(size);

    if (dimensions.length === 1) {
      // Single dimension
      for (let i = 0; i < size; i++) {
        result[i] = sourceArray && sourceArray[i] !== undefined ? sourceArray[i] : null;
      }
    } else {
      // Recursive for multi-dimensions
      const subDimensions = dimensions.slice(1);
      for (let i = 0; i < size; i++) {
        const sourceSubArray = sourceArray && Array.isArray(sourceArray[i]) ? sourceArray[i] : null;
        result[i] = this.createMultiDimensionalArray(subDimensions, sourceSubArray);
      }
    }

    return result;
  }

  private static deepCopyArray(arr: any[]): any[] {
    return arr.map(item => {
      if (Array.isArray(item)) {
        return this.deepCopyArray(item);
      } else if (item !== null && typeof item === 'object') {
        // Deep copy objects
        return { ...item };
      }
      return item;
    });
  }
}

// Export individual functions for easier use
export const {
  Filter,
  Join,
  Split,
  Array: ArrayFunc,
  IsArray,
  LBound,
  UBound,
  ReDim,
  Erase,
  ArraySort,
  ArrayReverse,
  ArrayFind,
  ArrayCount,
  ArrayUnique,
  ArrayCopy,
  ArraySlice,
  ArrayInsert,
  ArrayRemove,
  ArrayFill,
  ArrayMap,
  ArrayReduce,
  ArraySum,
  ArrayAverage,
  ArrayMin,
  ArrayMax,
  ArrayFlatten,
  ArrayZip,
  ArrayPartition
} = VB6ArrayFunctions;

// VB6 Constants
export const VB6ArrayConstants = {
  vbBinaryCompare: 0,
  vbTextCompare: 1,
  vbDatabaseCompare: 2
};

// Type definitions for better TypeScript support
export interface VB6Array<T = any> extends Array<T> {
  lBound?: number;
  uBound?: number;
  dimensions?: number[];
}

// Array creation helper
export function createVB6Array<T = any>(
  size: number | number[],
  lowerBound: number = 0
): VB6Array<T> {
  if (typeof size === 'number') {
    const arr = new Array(size + 1) as VB6Array<T>;
    arr.lBound = lowerBound;
    arr.uBound = lowerBound + size;
    return arr;
  } else {
    // Multi-dimensional
    const arr = VB6ArrayFunctions.createMultiDimensionalArray(size, null) as VB6Array<T>;
    arr.dimensions = size;
    return arr;
  }
}