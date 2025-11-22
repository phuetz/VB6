/**
 * VB6 Native Runtime Library
 * 
 * Provides runtime support for native compiled VB6 programs
 * including memory management, string handling, and VB6 built-in functions
 */

// Runtime configuration
export interface RuntimeConfig {
  heapSize: number;
  stackSize: number;
  stringPoolSize: number;
  maxHandles: number;
  enableDebug: boolean;
}

// Memory management
export class VB6MemoryManager {
  private heap: ArrayBuffer;
  private heapView: DataView;
  private freeList: FreeBlock[];
  private allocations: Map<number, AllocationInfo>;
  
  constructor(heapSize: number) {
    this.heap = new ArrayBuffer(heapSize);
    this.heapView = new DataView(this.heap);
    this.freeList = [{ offset: 0, size: heapSize }];
    this.allocations = new Map();
  }
  
  allocate(size: number, type: string = 'variant'): number {
    // Align to 8 bytes
    size = Math.ceil(size / 8) * 8;
    
    // Find suitable free block
    for (let i = 0; i < this.freeList.length; i++) {
      const block = this.freeList[i];
      if (block.size >= size) {
        const ptr = block.offset;
        
        // Update free list
        if (block.size === size) {
          this.freeList.splice(i, 1);
        } else {
          block.offset += size;
          block.size -= size;
        }
        
        // Track allocation
        this.allocations.set(ptr, { size, type, refCount: 1 });
        
        return ptr;
      }
    }
    
    throw new Error('Out of memory');
  }
  
  free(ptr: number): void {
    const info = this.allocations.get(ptr);
    if (!info) return;
    
    info.refCount--;
    if (info.refCount > 0) return;
    
    // Add back to free list
    this.allocations.delete(ptr);
    this.freeList.push({ offset: ptr, size: info.size });
    this.coalesce();
  }
  
  private coalesce(): void {
    // Merge adjacent free blocks
    this.freeList.sort((a, b) => a.offset - b.offset);
    
    for (let i = 0; i < this.freeList.length - 1; i++) {
      const current = this.freeList[i];
      const next = this.freeList[i + 1];
      
      if (current.offset + current.size === next.offset) {
        current.size += next.size;
        this.freeList.splice(i + 1, 1);
        i--;
      }
    }
  }
  
  readInt32(ptr: number): number {
    return this.heapView.getInt32(ptr, true);
  }
  
  writeInt32(ptr: number, value: number): void {
    this.heapView.setInt32(ptr, value, true);
  }
  
  readFloat64(ptr: number): number {
    return this.heapView.getFloat64(ptr, true);
  }
  
  writeFloat64(ptr: number, value: number): void {
    this.heapView.setFloat64(ptr, value, true);
  }
}

// String management
export class VB6StringPool {
  private strings: Map<number, string>;
  private nextId: number;
  
  constructor() {
    this.strings = new Map();
    this.nextId = 1;
  }
  
  allocateString(value: string): number {
    const id = this.nextId++;
    this.strings.set(id, value);
    return id;
  }
  
  getString(id: number): string {
    return this.strings.get(id) || '';
  }
  
  freeString(id: number): void {
    this.strings.delete(id);
  }
  
  concatenate(id1: number, id2: number): number {
    const str1 = this.getString(id1);
    const str2 = this.getString(id2);
    return this.allocateString(str1 + str2);
  }
}

// Variant type implementation
export class VB6Variant {
  type: VariantType;
  value: any;
  
  constructor(type: VariantType = VariantType.Empty, value: any = null) {
    this.type = type;
    this.value = value;
  }
  
  toBoolean(): boolean {
    switch (this.type) {
      case VariantType.Boolean:
        return this.value;
      case VariantType.Integer:
      case VariantType.Long:
      case VariantType.Single:
      case VariantType.Double:
        return this.value !== 0;
      case VariantType.String:
        return this.value.length > 0;
      default:
        return false;
    }
  }
  
  toNumber(): number {
    switch (this.type) {
      case VariantType.Integer:
      case VariantType.Long:
      case VariantType.Single:
      case VariantType.Double:
        return this.value;
      case VariantType.String:
        return parseFloat(this.value) || 0;
      case VariantType.Boolean:
        return this.value ? -1 : 0;
      default:
        return 0;
    }
  }
  
  toString(): string {
    switch (this.type) {
      case VariantType.String:
        return this.value;
      case VariantType.Integer:
      case VariantType.Long:
      case VariantType.Single:
      case VariantType.Double:
        return String(this.value);
      case VariantType.Boolean:
        return this.value ? 'True' : 'False';
      case VariantType.Date:
        return this.value.toLocaleString();
      case VariantType.Null:
        return 'Null';
      case VariantType.Empty:
        return '';
      default:
        return String(this.value);
    }
  }
}

export enum VariantType {
  Empty = 0,
  Null = 1,
  Integer = 2,
  Long = 3,
  Single = 4,
  Double = 5,
  Currency = 6,
  Date = 7,
  String = 8,
  Object = 9,
  Error = 10,
  Boolean = 11,
  Variant = 12,
  DataObject = 13,
  Decimal = 14,
  Byte = 17,
  Array = 8192,
}

// VB6 Runtime API
export class VB6NativeRuntime {
  private memory: VB6MemoryManager;
  private strings: VB6StringPool;
  private errorHandler: ErrorHandler | null = null;
  private collections: Map<number, any[]>;
  private handles: Map<number, Handle>;
  private nextHandle: number;
  
  constructor(config: RuntimeConfig) {
    this.memory = new VB6MemoryManager(config.heapSize);
    this.strings = new VB6StringPool();
    this.collections = new Map();
    this.handles = new Map();
    this.nextHandle = 1;
  }
  
  // Memory allocation
  allocate(size: number, type: string = 'variant'): number {
    return this.memory.allocate(size, type);
  }
  
  free(ptr: number): void {
    this.memory.free(ptr);
  }
  
  // String functions
  createString(value: string): number {
    return this.strings.allocateString(value);
  }
  
  getString(id: number): string {
    return this.strings.getString(id);
  }
  
  // Math functions
  abs(value: number): number {
    return Math.abs(value);
  }
  
  sgn(value: number): number {
    return value > 0 ? 1 : value < 0 ? -1 : 0;
  }
  
  int(value: number): number {
    return Math.floor(value);
  }
  
  fix(value: number): number {
    return value >= 0 ? Math.floor(value) : Math.ceil(value);
  }
  
  round(value: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  rnd(seed?: number): number {
    // VB6 Rnd function behavior
    if (seed !== undefined) {
      if (seed < 0) {
        // Use seed for repeatable sequence
        return this.seededRandom(seed);
      } else if (seed === 0) {
        // Return last generated number
        return this.lastRandom || 0;
      }
    }
    this.lastRandom = Math.random();
    return this.lastRandom;
  }
  
  private lastRandom: number = 0;
  
  private seededRandom(seed: number): number {
    // Simple seeded random
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  // String functions
  len(str: string): number {
    return str.length;
  }
  
  left(str: string, length: number): string {
    return str.substring(0, length);
  }
  
  right(str: string, length: number): string {
    return str.substring(str.length - length);
  }
  
  mid(str: string, start: number, length?: number): string {
    // VB6 uses 1-based indexing
    return length === undefined 
      ? str.substring(start - 1)
      : str.substring(start - 1, start - 1 + length);
  }
  
  inStr(start: number, str1: string, str2: string, compare: number = 0): number {
    // VB6 uses 1-based indexing
    const index = compare === 0 
      ? str1.indexOf(str2, start - 1)
      : str1.toLowerCase().indexOf(str2.toLowerCase(), start - 1);
    return index + 1; // Convert to 1-based
  }
  
  replace(expression: string, find: string, replace: string, start: number = 1, count: number = -1, compare: number = 0): string {
    if (count === 0) return expression;
    
    let result = expression.substring(start - 1);
    const regex = new RegExp(
      find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
      compare === 0 ? 'g' : 'gi'
    );
    
    if (count === -1) {
      result = result.replace(regex, replace);
    } else {
      let replaced = 0;
      result = result.replace(regex, (match) => {
        if (replaced < count) {
          replaced++;
          return replace;
        }
        return match;
      });
    }
    
    return expression.substring(0, start - 1) + result;
  }
  
  trim(str: string): string {
    return str.trim();
  }
  
  lTrim(str: string): string {
    return str.trimStart();
  }
  
  rTrim(str: string): string {
    return str.trimEnd();
  }
  
  uCase(str: string): string {
    return str.toUpperCase();
  }
  
  lCase(str: string): string {
    return str.toLowerCase();
  }
  
  space(number: number): string {
    return ' '.repeat(number);
  }
  
  string(number: number, character: string | number): string {
    const char = typeof character === 'string' ? character : String.fromCharCode(character);
    return char.repeat(number);
  }
  
  // Date/Time functions
  now(): Date {
    return new Date();
  }
  
  date(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  time(): Date {
    const d = new Date();
    const t = new Date(1899, 11, 30); // VB6 time epoch
    t.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    return t;
  }
  
  dateAdd(interval: string, number: number, date: Date): Date {
    const result = new Date(date);
    
    switch (interval.toLowerCase()) {
      case 'yyyy': result.setFullYear(result.getFullYear() + number); break;
      case 'q': result.setMonth(result.getMonth() + number * 3); break;
      case 'm': result.setMonth(result.getMonth() + number); break;
      case 'y':
      case 'd': result.setDate(result.getDate() + number); break;
      case 'w': result.setDate(result.getDate() + number * 7); break;
      case 'ww': result.setDate(result.getDate() + number * 7); break;
      case 'h': result.setHours(result.getHours() + number); break;
      case 'n': result.setMinutes(result.getMinutes() + number); break;
      case 's': result.setSeconds(result.getSeconds() + number); break;
    }
    
    return result;
  }
  
  dateDiff(interval: string, date1: Date, date2: Date): number {
    const diff = date2.getTime() - date1.getTime();
    
    switch (interval.toLowerCase()) {
      case 'yyyy': return date2.getFullYear() - date1.getFullYear();
      case 'q': return Math.floor((date2.getMonth() - date1.getMonth() + (date2.getFullYear() - date1.getFullYear()) * 12) / 3);
      case 'm': return date2.getMonth() - date1.getMonth() + (date2.getFullYear() - date1.getFullYear()) * 12;
      case 'd': return Math.floor(diff / (1000 * 60 * 60 * 24));
      case 'h': return Math.floor(diff / (1000 * 60 * 60));
      case 'n': return Math.floor(diff / (1000 * 60));
      case 's': return Math.floor(diff / 1000);
      default: return 0;
    }
  }
  
  // Type conversion
  cBool(expression: any): boolean {
    if (expression instanceof VB6Variant) {
      return expression.toBoolean();
    }
    return Boolean(expression);
  }
  
  cByte(expression: any): number {
    const num = this.cDbl(expression);
    if (num < 0 || num > 255) {
      throw new Error('Overflow');
    }
    return Math.floor(num);
  }
  
  cInt(expression: any): number {
    const num = this.cDbl(expression);
    if (num < -32768 || num > 32767) {
      throw new Error('Overflow');
    }
    return Math.round(num);
  }
  
  cLng(expression: any): number {
    const num = this.cDbl(expression);
    if (num < -2147483648 || num > 2147483647) {
      throw new Error('Overflow');
    }
    return Math.round(num);
  }
  
  cSng(expression: any): number {
    return Number(expression);
  }
  
  cDbl(expression: any): number {
    if (expression instanceof VB6Variant) {
      return expression.toNumber();
    }
    return Number(expression);
  }
  
  cStr(expression: any): string {
    if (expression instanceof VB6Variant) {
      return expression.toString();
    }
    return String(expression);
  }
  
  // Array functions
  createArray(dimensions: number[], baseIndex: number = 0): number {
    const size = dimensions.reduce((a, b) => a * b, 1);
    const ptr = this.allocate(size * 8, 'array');
    
    // Store array metadata
    this.collections.set(ptr, {
      dimensions,
      baseIndex,
      data: new Array(size),
    });
    
    return ptr;
  }
  
  redimArray(ptr: number, dimensions: number[], preserve: boolean = false): void {
    const array = this.collections.get(ptr);
    if (!array) return;
    
    const oldData = preserve ? array.data : null;
    const newSize = dimensions.reduce((a, b) => a * b, 1);
    array.dimensions = dimensions;
    array.data = new Array(newSize);
    
    if (preserve && oldData) {
      // Copy old data to new array
      const copySize = Math.min(oldData.length, newSize);
      for (let i = 0; i < copySize; i++) {
        array.data[i] = oldData[i];
      }
    }
  }
  
  // Collection support
  createCollection(): number {
    const handle = this.nextHandle++;
    this.handles.set(handle, {
      type: 'collection',
      data: [],
    });
    return handle;
  }
  
  collectionAdd(handle: number, item: any, key?: string): void {
    const collection = this.handles.get(handle);
    if (!collection || collection.type !== 'collection') return;
    
    collection.data.push({ item, key });
  }
  
  collectionRemove(handle: number, index: number | string): void {
    const collection = this.handles.get(handle);
    if (!collection || collection.type !== 'collection') return;
    
    if (typeof index === 'number') {
      collection.data.splice(index - 1, 1); // VB6 uses 1-based indexing
    } else {
      const idx = collection.data.findIndex(item => item.key === index);
      if (idx >= 0) collection.data.splice(idx, 1);
    }
  }
  
  collectionItem(handle: number, index: number | string): any {
    const collection = this.handles.get(handle);
    if (!collection || collection.type !== 'collection') return null;
    
    if (typeof index === 'number') {
      return collection.data[index - 1]?.item; // VB6 uses 1-based indexing
    } else {
      return collection.data.find(item => item.key === index)?.item;
    }
  }
  
  collectionCount(handle: number): number {
    const collection = this.handles.get(handle);
    if (!collection || collection.type !== 'collection') return 0;
    
    return collection.data.length;
  }
  
  // Error handling
  setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }
  
  raiseError(number: number, source: string, description: string): void {
    const error = new VB6Error(number, source, description);
    
    if (this.errorHandler) {
      this.errorHandler(error);
    } else {
      throw error;
    }
  }
  
  // File I/O stubs (would need platform-specific implementation)
  fileOpen(filename: string, mode: FileMode, access: FileAccess, handle: number): void {
    console.log(`File open: ${filename}, mode: ${mode}, handle: ${handle}`);
  }
  
  fileClose(handle: number): void {
    console.log(`File close: handle ${handle}`);
  }
  
  fileRead(handle: number, buffer: number, size: number): number {
    console.log(`File read: handle ${handle}, size: ${size}`);
    return 0;
  }
  
  fileWrite(handle: number, buffer: number, size: number): number {
    console.log(`File write: handle ${handle}, size: ${size}`);
    return size;
  }
}

// Supporting types
interface FreeBlock {
  offset: number;
  size: number;
}

interface AllocationInfo {
  size: number;
  type: string;
  refCount: number;
}

interface Handle {
  type: string;
  data: any;
}

export class VB6Error extends Error {
  number: number;
  source: string;
  
  constructor(number: number, source: string, description: string) {
    super(description);
    this.number = number;
    this.source = source;
    this.name = 'VB6Error';
  }
}

export type ErrorHandler = (error: VB6Error) => void;

export enum FileMode {
  Input = 1,
  Output = 2,
  Random = 4,
  Append = 8,
  Binary = 32,
}

export enum FileAccess {
  Read = 1,
  Write = 2,
  ReadWrite = 3,
}

// Export factory function
export function createVB6Runtime(config: Partial<RuntimeConfig> = {}): VB6NativeRuntime {
  const defaultConfig: RuntimeConfig = {
    heapSize: 16 * 1024 * 1024, // 16MB
    stackSize: 1 * 1024 * 1024,  // 1MB
    stringPoolSize: 1024 * 1024, // 1MB
    maxHandles: 1024,
    enableDebug: false,
    ...config,
  };
  
  return new VB6NativeRuntime(defaultConfig);
}