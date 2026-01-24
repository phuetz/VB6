/**
 * VB6 Enhanced Collections
 * Complete implementation of VB6 Collection and Dictionary objects
 * with advanced features for compatibility
 */

// ============================================================================
// VB6 Collection Class - Complete Implementation
// ============================================================================

export class VB6Collection<T = any> implements Iterable<T> {
  private items: Map<string | number, T> = new Map();
  private orderedKeys: (string | number)[] = [];
  private autoKeyCounter: number = 0;

  /**
   * Add an item to the collection
   * @param item - Item to add
   * @param key - Optional string key
   * @param before - Add before this key/index
   * @param after - Add after this key/index
   */
  Add(item: T, key?: string, before?: string | number, after?: string | number): void {
    const actualKey = key !== undefined ? key : `__auto_${++this.autoKeyCounter}`;

    if (this.items.has(actualKey)) {
      throw new Error(`Key already exists: ${actualKey}`);
    }

    this.items.set(actualKey, item);

    // Determine insertion position
    let insertIndex = this.orderedKeys.length;

    if (before !== undefined) {
      const beforeIndex = this.getIndexOf(before);
      if (beforeIndex === -1) {
        throw new Error(`Invalid key or index: ${before}`);
      }
      insertIndex = beforeIndex;
    } else if (after !== undefined) {
      const afterIndex = this.getIndexOf(after);
      if (afterIndex === -1) {
        throw new Error(`Invalid key or index: ${after}`);
      }
      insertIndex = afterIndex + 1;
    }

    this.orderedKeys.splice(insertIndex, 0, actualKey);
  }

  /**
   * Remove an item from the collection
   * @param keyOrIndex - Key or 1-based index
   */
  Remove(keyOrIndex: string | number): void {
    const key = this.resolveKey(keyOrIndex);
    if (key === undefined) {
      throw new Error(`Invalid key or index: ${keyOrIndex}`);
    }

    this.items.delete(key);
    const index = this.orderedKeys.indexOf(key);
    if (index !== -1) {
      this.orderedKeys.splice(index, 1);
    }
  }

  /**
   * Get an item from the collection
   * @param keyOrIndex - Key or 1-based index
   */
  Item(keyOrIndex: string | number): T {
    const key = this.resolveKey(keyOrIndex);
    if (key === undefined || !this.items.has(key)) {
      throw new Error(`Invalid key or index: ${keyOrIndex}`);
    }
    return this.items.get(key)!;
  }

  /**
   * Get the count of items
   */
  get Count(): number {
    return this.items.size;
  }

  /**
   * Clear all items
   */
  Clear(): void {
    this.items.clear();
    this.orderedKeys = [];
    this.autoKeyCounter = 0;
  }

  /**
   * Check if a key exists
   */
  Exists(key: string): boolean {
    return this.items.has(key);
  }

  /**
   * Get all keys
   */
  Keys(): string[] {
    return this.orderedKeys.filter(k => typeof k === 'string') as string[];
  }

  /**
   * Get all items as array
   */
  Items(): T[] {
    return this.orderedKeys.map(k => this.items.get(k)!);
  }

  /**
   * Iterator support for For Each
   */
  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this.orderedKeys.map(k => this.items.get(k)!);
    return {
      next: (): IteratorResult<T> => {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }

  /**
   * VB6-style For Each enumeration
   */
  ForEach(callback: (item: T, key: string | number) => void): void {
    for (const key of this.orderedKeys) {
      callback(this.items.get(key)!, key);
    }
  }

  /**
   * Get index of a key (0-based internal)
   */
  private getIndexOf(keyOrIndex: string | number): number {
    if (typeof keyOrIndex === 'number') {
      // VB6 uses 1-based indexing
      return keyOrIndex - 1;
    }
    return this.orderedKeys.indexOf(keyOrIndex);
  }

  /**
   * Resolve key from index or key
   */
  private resolveKey(keyOrIndex: string | number): string | number | undefined {
    if (typeof keyOrIndex === 'string') {
      return this.items.has(keyOrIndex) ? keyOrIndex : undefined;
    }
    // VB6 uses 1-based indexing
    const index = keyOrIndex - 1;
    return index >= 0 && index < this.orderedKeys.length ? this.orderedKeys[index] : undefined;
  }
}

// ============================================================================
// VB6 Dictionary Class - Scripting.Dictionary
// ============================================================================

export type CompareMethod = 'BinaryCompare' | 'TextCompare' | 'DatabaseCompare';

export class VB6Dictionary<TKey = string, TValue = any> implements Iterable<TKey> {
  private items: Map<string, TValue> = new Map();
  private originalKeys: Map<string, TKey> = new Map();
  private _compareMode: CompareMethod = 'BinaryCompare';

  constructor(compareMode?: CompareMethod) {
    if (compareMode) {
      this._compareMode = compareMode;
    }
  }

  /**
   * Add a key/item pair
   */
  Add(key: TKey, item: TValue): void {
    const normalizedKey = this.normalizeKey(key);
    if (this.items.has(normalizedKey)) {
      throw new Error(`This key is already associated with an element of this collection`);
    }
    this.items.set(normalizedKey, item);
    this.originalKeys.set(normalizedKey, key);
  }

  /**
   * Get or set an item
   */
  Item(key: TKey, value?: TValue): TValue {
    const normalizedKey = this.normalizeKey(key);

    if (value !== undefined) {
      // Set mode - creates if doesn't exist (unlike Add which throws)
      this.items.set(normalizedKey, value);
      this.originalKeys.set(normalizedKey, key);
      return value;
    }

    // Get mode - creates empty entry if doesn't exist
    if (!this.items.has(normalizedKey)) {
      this.items.set(normalizedKey, undefined as any);
      this.originalKeys.set(normalizedKey, key);
    }
    return this.items.get(normalizedKey)!;
  }

  /**
   * Check if key exists
   */
  Exists(key: TKey): boolean {
    return this.items.has(this.normalizeKey(key));
  }

  /**
   * Get array of all keys
   */
  Keys(): TKey[] {
    return Array.from(this.originalKeys.values());
  }

  /**
   * Get array of all items
   */
  Items(): TValue[] {
    return Array.from(this.items.values());
  }

  /**
   * Remove a key/item pair
   */
  Remove(key: TKey): void {
    const normalizedKey = this.normalizeKey(key);
    if (!this.items.has(normalizedKey)) {
      throw new Error(`Key not found: ${key}`);
    }
    this.items.delete(normalizedKey);
    this.originalKeys.delete(normalizedKey);
  }

  /**
   * Remove all items
   */
  RemoveAll(): void {
    this.items.clear();
    this.originalKeys.clear();
  }

  /**
   * Change an existing key
   */
  Key(oldKey: TKey, newKey: TKey): void {
    const oldNormalized = this.normalizeKey(oldKey);
    const newNormalized = this.normalizeKey(newKey);

    if (!this.items.has(oldNormalized)) {
      throw new Error(`Key not found: ${oldKey}`);
    }
    if (this.items.has(newNormalized)) {
      throw new Error(`Key already exists: ${newKey}`);
    }

    const value = this.items.get(oldNormalized)!;
    this.items.delete(oldNormalized);
    this.originalKeys.delete(oldNormalized);
    this.items.set(newNormalized, value);
    this.originalKeys.set(newNormalized, newKey);
  }

  /**
   * Get/set compare mode
   */
  get CompareMode(): CompareMethod {
    return this._compareMode;
  }

  set CompareMode(value: CompareMethod) {
    if (this.items.size > 0) {
      throw new Error(`Can't change CompareMode of Dictionary containing data`);
    }
    this._compareMode = value;
  }

  /**
   * Get count of items
   */
  get Count(): number {
    return this.items.size;
  }

  /**
   * Iterator for For Each
   */
  [Symbol.iterator](): Iterator<TKey> {
    return this.originalKeys.values();
  }

  /**
   * Normalize key based on compare mode
   */
  private normalizeKey(key: TKey): string {
    const keyStr = String(key);
    if (this._compareMode === 'TextCompare') {
      return keyStr.toLowerCase();
    }
    return keyStr;
  }
}

// ============================================================================
// VB6 Stack Class
// ============================================================================

export class VB6Stack<T = any> {
  private items: T[] = [];

  /**
   * Push item onto stack
   */
  Push(item: T): void {
    this.items.push(item);
  }

  /**
   * Pop item from stack
   */
  Pop(): T {
    if (this.items.length === 0) {
      throw new Error('Stack is empty');
    }
    return this.items.pop()!;
  }

  /**
   * Peek at top item without removing
   */
  Peek(): T {
    if (this.items.length === 0) {
      throw new Error('Stack is empty');
    }
    return this.items[this.items.length - 1];
  }

  /**
   * Get count of items
   */
  get Count(): number {
    return this.items.length;
  }

  /**
   * Check if stack is empty
   */
  get IsEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Clear all items
   */
  Clear(): void {
    this.items = [];
  }

  /**
   * Convert to array
   */
  ToArray(): T[] {
    return [...this.items].reverse();
  }
}

// ============================================================================
// VB6 Queue Class
// ============================================================================

export class VB6Queue<T = any> {
  private items: T[] = [];

  /**
   * Add item to queue
   */
  Enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * Remove and return first item
   */
  Dequeue(): T {
    if (this.items.length === 0) {
      throw new Error('Queue is empty');
    }
    return this.items.shift()!;
  }

  /**
   * Peek at first item without removing
   */
  Peek(): T {
    if (this.items.length === 0) {
      throw new Error('Queue is empty');
    }
    return this.items[0];
  }

  /**
   * Get count of items
   */
  get Count(): number {
    return this.items.length;
  }

  /**
   * Check if queue is empty
   */
  get IsEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Clear all items
   */
  Clear(): void {
    this.items = [];
  }

  /**
   * Convert to array
   */
  ToArray(): T[] {
    return [...this.items];
  }
}

// ============================================================================
// VB6 ArrayList Class (Similar to .NET ArrayList)
// ============================================================================

export class VB6ArrayList<T = any> implements Iterable<T> {
  private items: T[] = [];
  private _capacity: number = 0;

  constructor(capacity?: number) {
    if (capacity !== undefined) {
      this._capacity = capacity;
    }
  }

  /**
   * Add item and return index
   */
  Add(item: T): number {
    this.items.push(item);
    return this.items.length - 1;
  }

  /**
   * Add range of items
   */
  AddRange(items: T[]): void {
    this.items.push(...items);
  }

  /**
   * Insert item at index
   */
  Insert(index: number, item: T): void {
    if (index < 0 || index > this.items.length) {
      throw new Error('Index out of range');
    }
    this.items.splice(index, 0, item);
  }

  /**
   * Remove first occurrence of item
   */
  Remove(item: T): boolean {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove item at index
   */
  RemoveAt(index: number): void {
    if (index < 0 || index >= this.items.length) {
      throw new Error('Index out of range');
    }
    this.items.splice(index, 1);
  }

  /**
   * Remove range of items
   */
  RemoveRange(index: number, count: number): void {
    if (index < 0 || index + count > this.items.length) {
      throw new Error('Index out of range');
    }
    this.items.splice(index, count);
  }

  /**
   * Get or set item at index
   */
  Item(index: number, value?: T): T {
    if (index < 0 || index >= this.items.length) {
      throw new Error('Index out of range');
    }
    if (value !== undefined) {
      this.items[index] = value;
    }
    return this.items[index];
  }

  /**
   * Get index of item
   */
  IndexOf(item: T, startIndex?: number): number {
    return this.items.indexOf(item, startIndex);
  }

  /**
   * Get last index of item
   */
  LastIndexOf(item: T): number {
    return this.items.lastIndexOf(item);
  }

  /**
   * Check if contains item
   */
  Contains(item: T): boolean {
    return this.items.includes(item);
  }

  /**
   * Get count of items
   */
  get Count(): number {
    return this.items.length;
  }

  /**
   * Get/set capacity
   */
  get Capacity(): number {
    return Math.max(this._capacity, this.items.length);
  }

  set Capacity(value: number) {
    if (value < this.items.length) {
      throw new Error('Capacity too small');
    }
    this._capacity = value;
  }

  /**
   * Clear all items
   */
  Clear(): void {
    this.items = [];
  }

  /**
   * Sort items
   */
  Sort(comparer?: (a: T, b: T) => number): void {
    if (comparer) {
      this.items.sort(comparer);
    } else {
      this.items.sort();
    }
  }

  /**
   * Reverse items
   */
  Reverse(): void {
    this.items.reverse();
  }

  /**
   * Binary search (requires sorted list)
   */
  BinarySearch(item: T): number {
    let low = 0;
    let high = this.items.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = this.items[mid];

      if (midVal < item) {
        low = mid + 1;
      } else if (midVal > item) {
        high = mid - 1;
      } else {
        return mid;
      }
    }

    return -(low + 1); // Not found, return insertion point
  }

  /**
   * Get range of items
   */
  GetRange(index: number, count: number): T[] {
    return this.items.slice(index, index + count);
  }

  /**
   * Convert to array
   */
  ToArray(): T[] {
    return [...this.items];
  }

  /**
   * Trim to size
   */
  TrimToSize(): void {
    this._capacity = this.items.length;
  }

  /**
   * Iterator for For Each
   */
  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this.items;
    return {
      next: (): IteratorResult<T> => {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}

// ============================================================================
// VB6 SortedList Class
// ============================================================================

export class VB6SortedList<TKey = string, TValue = any> {
  private keys: TKey[] = [];
  private values: TValue[] = [];
  private comparer: (a: TKey, b: TKey) => number;

  constructor(comparer?: (a: TKey, b: TKey) => number) {
    this.comparer = comparer || ((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }

  /**
   * Add key/value pair
   */
  Add(key: TKey, value: TValue): void {
    const index = this.findInsertIndex(key);
    if (index < this.keys.length && this.comparer(this.keys[index], key) === 0) {
      throw new Error('Key already exists');
    }
    this.keys.splice(index, 0, key);
    this.values.splice(index, 0, value);
  }

  /**
   * Get value by key
   */
  Item(key: TKey): TValue | undefined {
    const index = this.IndexOfKey(key);
    return index >= 0 ? this.values[index] : undefined;
  }

  /**
   * Set value by key
   */
  SetByKey(key: TKey, value: TValue): void {
    const index = this.IndexOfKey(key);
    if (index >= 0) {
      this.values[index] = value;
    } else {
      this.Add(key, value);
    }
  }

  /**
   * Remove by key
   */
  Remove(key: TKey): boolean {
    const index = this.IndexOfKey(key);
    if (index >= 0) {
      this.keys.splice(index, 1);
      this.values.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove at index
   */
  RemoveAt(index: number): void {
    if (index < 0 || index >= this.keys.length) {
      throw new Error('Index out of range');
    }
    this.keys.splice(index, 1);
    this.values.splice(index, 1);
  }

  /**
   * Check if key exists
   */
  ContainsKey(key: TKey): boolean {
    return this.IndexOfKey(key) >= 0;
  }

  /**
   * Check if value exists
   */
  ContainsValue(value: TValue): boolean {
    return this.values.includes(value);
  }

  /**
   * Get index of key
   */
  IndexOfKey(key: TKey): number {
    let low = 0;
    let high = this.keys.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cmp = this.comparer(this.keys[mid], key);

      if (cmp < 0) {
        low = mid + 1;
      } else if (cmp > 0) {
        high = mid - 1;
      } else {
        return mid;
      }
    }

    return -1;
  }

  /**
   * Get index of value
   */
  IndexOfValue(value: TValue): number {
    return this.values.indexOf(value);
  }

  /**
   * Get key at index
   */
  GetKey(index: number): TKey {
    if (index < 0 || index >= this.keys.length) {
      throw new Error('Index out of range');
    }
    return this.keys[index];
  }

  /**
   * Get value at index
   */
  GetByIndex(index: number): TValue {
    if (index < 0 || index >= this.values.length) {
      throw new Error('Index out of range');
    }
    return this.values[index];
  }

  /**
   * Set value at index
   */
  SetByIndex(index: number, value: TValue): void {
    if (index < 0 || index >= this.values.length) {
      throw new Error('Index out of range');
    }
    this.values[index] = value;
  }

  /**
   * Get count of items
   */
  get Count(): number {
    return this.keys.length;
  }

  /**
   * Get all keys
   */
  Keys(): TKey[] {
    return [...this.keys];
  }

  /**
   * Get all values
   */
  Values(): TValue[] {
    return [...this.values];
  }

  /**
   * Clear all items
   */
  Clear(): void {
    this.keys = [];
    this.values = [];
  }

  /**
   * Find insertion index
   */
  private findInsertIndex(key: TKey): number {
    let low = 0;
    let high = this.keys.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.comparer(this.keys[mid], key) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new VB6 Collection
 */
export function CreateCollection<T = any>(): VB6Collection<T> {
  return new VB6Collection<T>();
}

/**
 * Create a new VB6 Dictionary (Scripting.Dictionary)
 */
export function CreateDictionary<TKey = string, TValue = any>(
  compareMode?: CompareMethod
): VB6Dictionary<TKey, TValue> {
  return new VB6Dictionary<TKey, TValue>(compareMode);
}

/**
 * Create a new VB6 Stack
 */
export function CreateStack<T = any>(): VB6Stack<T> {
  return new VB6Stack<T>();
}

/**
 * Create a new VB6 Queue
 */
export function CreateQueue<T = any>(): VB6Queue<T> {
  return new VB6Queue<T>();
}

/**
 * Create a new VB6 ArrayList
 */
export function CreateArrayList<T = any>(capacity?: number): VB6ArrayList<T> {
  return new VB6ArrayList<T>(capacity);
}

/**
 * Create a new VB6 SortedList
 */
export function CreateSortedList<TKey = string, TValue = any>(
  comparer?: (a: TKey, b: TKey) => number
): VB6SortedList<TKey, TValue> {
  return new VB6SortedList<TKey, TValue>(comparer);
}

// ============================================================================
// Export All
// ============================================================================

export const VB6EnhancedCollections = {
  Collection: VB6Collection,
  Dictionary: VB6Dictionary,
  Stack: VB6Stack,
  Queue: VB6Queue,
  ArrayList: VB6ArrayList,
  SortedList: VB6SortedList,
  CreateCollection,
  CreateDictionary,
  CreateStack,
  CreateQueue,
  CreateArrayList,
  CreateSortedList
};

export default VB6EnhancedCollections;
