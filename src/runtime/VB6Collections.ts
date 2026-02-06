/**
 * VB6 Collection and Dictionary Objects Implementation
 * Complete implementation of VB.Collection and Scripting.Dictionary
 */

/**
 * VB6 Collection Object
 * Native VB6 collection with 1-based indexing
 */
export class VB6Collection {
  private items: Map<string, any> = new Map();
  private keys: string[] = [];
  private indexMap: Map<number, string> = new Map();
  private nextAutoKey: number = 1;

  constructor() {}

  /**
   * Count property - number of items in collection
   */
  get Count(): number {
    return this.items.size;
  }

  /**
   * Add method - adds an item to the collection
   * @param item The item to add
   * @param key Optional key for the item
   * @param before Optional key or 1-based index to insert before
   * @param after Optional key or 1-based index to insert after
   */
  Add(item: any, key?: string, before?: string | number, after?: string | number): void {
    // Generate automatic key if not provided
    const itemKey = key || `~AUTO_${this.nextAutoKey++}`;

    // Check for duplicate key
    if (this.items.has(itemKey)) {
      throw new Error(`Key '${key}' already exists in collection`);
    }

    // Determine insertion position
    let insertIndex = this.keys.length;

    if (before !== undefined) {
      if (typeof before === 'string') {
        const beforeIndex = this.keys.indexOf(before);
        if (beforeIndex === -1) {
          throw new Error(`Key '${before}' not found in collection`);
        }
        insertIndex = beforeIndex;
      } else {
        // 1-based index
        if (before < 1 || before > this.keys.length + 1) {
          throw new Error(`Index ${before} out of range`);
        }
        insertIndex = before - 1;
      }
    } else if (after !== undefined) {
      if (typeof after === 'string') {
        const afterIndex = this.keys.indexOf(after);
        if (afterIndex === -1) {
          throw new Error(`Key '${after}' not found in collection`);
        }
        insertIndex = afterIndex + 1;
      } else {
        // 1-based index
        if (after < 0 || after > this.keys.length) {
          throw new Error(`Index ${after} out of range`);
        }
        insertIndex = after;
      }
    }

    // Insert the item
    this.keys.splice(insertIndex, 0, itemKey);
    this.items.set(itemKey, item);
    this.rebuildIndexMap();
  }

  /**
   * Item method - retrieves an item by key or index
   * @param keyOrIndex Key string or 1-based index
   */
  Item(keyOrIndex: string | number): any {
    if (typeof keyOrIndex === 'string') {
      if (!this.items.has(keyOrIndex)) {
        throw new Error(`Key '${keyOrIndex}' not found in collection`);
      }
      return this.items.get(keyOrIndex);
    } else {
      // Convert 1-based to 0-based index
      const index = keyOrIndex - 1;
      if (index < 0 || index >= this.keys.length) {
        throw new Error(`Index ${keyOrIndex} out of range`);
      }
      const key = this.keys[index];
      return this.items.get(key);
    }
  }

  /**
   * Remove method - removes an item by key or index
   * @param keyOrIndex Key string or 1-based index
   */
  Remove(keyOrIndex: string | number): void {
    let key: string;

    if (typeof keyOrIndex === 'string') {
      key = keyOrIndex;
      if (!this.items.has(key)) {
        throw new Error(`Key '${key}' not found in collection`);
      }
    } else {
      // Convert 1-based to 0-based index
      const index = keyOrIndex - 1;
      if (index < 0 || index >= this.keys.length) {
        throw new Error(`Index ${keyOrIndex} out of range`);
      }
      key = this.keys[index];
    }

    // Remove the item
    this.items.delete(key);
    const keyIndex = this.keys.indexOf(key);
    this.keys.splice(keyIndex, 1);
    this.rebuildIndexMap();
  }

  /**
   * Clear method - removes all items
   */
  Clear(): void {
    this.items.clear();
    this.keys = [];
    this.indexMap.clear();
    this.nextAutoKey = 1;
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
    // Filter out auto-generated keys
    return this.keys.filter(k => !k.startsWith('~AUTO_'));
  }

  /**
   * Get all items as array
   */
  Items(): any[] {
    return this.keys.map(key => this.items.get(key));
  }

  /**
   * For...Each enumeration support
   */
  [Symbol.iterator](): Iterator<any> {
    const items = this.Items();
    return items[Symbol.iterator]();
  }

  /**
   * VB6 _NewEnum support
   */
  get _NewEnum(): Iterator<any> {
    return this[Symbol.iterator]();
  }

  /**
   * Access by index (for bracket notation)
   */
  [index: number]: any;

  private rebuildIndexMap(): void {
    this.indexMap.clear();
    this.keys.forEach((key, index) => {
      this.indexMap.set(index + 1, key); // 1-based indexing
    });
  }
}

/**
 * VB6 Dictionary Object (Scripting.Dictionary)
 * COM-compatible dictionary implementation
 */
export class VB6Dictionary {
  private items: Map<any, any> = new Map();
  private keyArray: any[] = [];
  private _compareMode: CompareMethod = CompareMethod.BinaryCompare;

  constructor() {}

  /**
   * Count property - number of items
   */
  get Count(): number {
    return this.items.size;
  }

  /**
   * CompareMode property - how keys are compared
   */
  get CompareMode(): CompareMethod {
    return this._compareMode;
  }

  set CompareMode(value: CompareMethod) {
    if (this.items.size > 0) {
      throw new Error('Cannot change CompareMode when dictionary contains data');
    }
    this._compareMode = value;
  }

  /**
   * Add method - adds a key/item pair
   */
  Add(key: any, item: any): void {
    const normalizedKey = this.normalizeKey(key);

    if (this.hasKey(normalizedKey)) {
      throw new Error(`Key already exists`);
    }

    this.items.set(normalizedKey, item);
    this.keyArray.push(key); // Store original key
  }

  /**
   * Exists method - checks if key exists
   */
  Exists(key: any): boolean {
    const normalizedKey = this.normalizeKey(key);
    return this.hasKey(normalizedKey);
  }

  /**
   * Item property - get/set item by key
   */
  Item(key: any): any {
    const normalizedKey = this.normalizeKey(key);

    if (!this.hasKey(normalizedKey)) {
      // VB6 Dictionary auto-adds missing keys
      this.items.set(normalizedKey, undefined);
      this.keyArray.push(key);
    }

    return this.items.get(normalizedKey);
  }

  /**
   * Set item value
   */
  SetItem(key: any, value: any): void {
    const normalizedKey = this.normalizeKey(key);

    if (!this.hasKey(normalizedKey)) {
      this.keyArray.push(key);
    }

    this.items.set(normalizedKey, value);
  }

  /**
   * Key property - get/set key
   */
  Key(key: any): any {
    const normalizedKey = this.normalizeKey(key);

    if (!this.hasKey(normalizedKey)) {
      throw new Error('Key not found');
    }

    // Return original key
    const index = this.findKeyIndex(normalizedKey);
    return this.keyArray[index];
  }

  /**
   * Change a key
   */
  SetKey(oldKey: any, newKey: any): void {
    const oldNormalized = this.normalizeKey(oldKey);
    const newNormalized = this.normalizeKey(newKey);

    if (!this.hasKey(oldNormalized)) {
      throw new Error('Key not found');
    }

    if (oldNormalized !== newNormalized && this.hasKey(newNormalized)) {
      throw new Error('New key already exists');
    }

    // Get the value
    const value = this.items.get(oldNormalized);

    // Update in map
    if (oldNormalized !== newNormalized) {
      this.items.delete(oldNormalized);
      this.items.set(newNormalized, value);
    }

    // Update in key array
    const index = this.findKeyIndex(oldNormalized);
    this.keyArray[index] = newKey;
  }

  /**
   * Remove method - removes a key/item pair
   */
  Remove(key: any): void {
    const normalizedKey = this.normalizeKey(key);

    if (!this.hasKey(normalizedKey)) {
      throw new Error('Key not found');
    }

    this.items.delete(normalizedKey);

    // Remove from key array
    const index = this.findKeyIndex(normalizedKey);
    this.keyArray.splice(index, 1);
  }

  /**
   * RemoveAll method - removes all items
   */
  RemoveAll(): void {
    this.items.clear();
    this.keyArray = [];
  }

  /**
   * Keys method - returns array of keys
   */
  Keys(): any[] {
    return [...this.keyArray];
  }

  /**
   * Items method - returns array of items
   */
  Items(): any[] {
    return this.keyArray.map(key => {
      const normalizedKey = this.normalizeKey(key);
      return this.items.get(normalizedKey);
    });
  }

  /**
   * For...Each enumeration support (iterates keys)
   */
  [Symbol.iterator](): Iterator<[any, any]> {
    const keys = this.keyArray;
    const items = this.items;
    const normalizeKey = this.normalizeKey.bind(this);

    let index = 0;

    return {
      next(): IteratorResult<[any, any]> {
        if (index < keys.length) {
          const key = keys[index];
          const normalizedKey = normalizeKey(key);
          const value = items.get(normalizedKey);
          index++;
          return { value: [key, value], done: false };
        }
        return { value: undefined as any, done: true };
      },
    };
  }

  /**
   * VB6 _NewEnum support
   */
  get _NewEnum(): Iterator<[any, any]> {
    return this[Symbol.iterator]();
  }

  private normalizeKey(key: any): any {
    if (key === null || key === undefined) {
      return '~NULL~';
    }

    if (this._compareMode === CompareMethod.TextCompare && typeof key === 'string') {
      // Case-insensitive comparison
      return key.toUpperCase();
    }

    if (this._compareMode === CompareMethod.DatabaseCompare && typeof key === 'string') {
      // Database comparison (case-insensitive, ignore trailing spaces)
      return key.toUpperCase().trimEnd();
    }

    return key;
  }

  private hasKey(normalizedKey: any): boolean {
    return this.items.has(normalizedKey);
  }

  private findKeyIndex(normalizedKey: any): number {
    for (let i = 0; i < this.keyArray.length; i++) {
      if (this.normalizeKey(this.keyArray[i]) === normalizedKey) {
        return i;
      }
    }
    return -1;
  }
}

/**
 * Compare methods for Dictionary
 */
export enum CompareMethod {
  BinaryCompare = 0, // vbBinaryCompare - case sensitive
  TextCompare = 1, // vbTextCompare - case insensitive
  DatabaseCompare = 2, // vbDatabaseCompare - case insensitive, ignore trailing spaces
}

/**
 * Factory function to create collections
 */
export function CreateCollection(): VB6Collection {
  return new VB6Collection();
}

/**
 * Factory function to create dictionary
 */
export function CreateDictionary(): VB6Dictionary {
  return new VB6Dictionary();
}

/**
 * Helper to check if object is a collection
 */
export function IsCollection(obj: any): boolean {
  return obj instanceof VB6Collection;
}

/**
 * Helper to check if object is a dictionary
 */
export function IsDictionary(obj: any): boolean {
  return obj instanceof VB6Dictionary;
}

/**
 * Example usage demonstrating VB6 compatibility
 */
export class CollectionExample {
  demonstrateCollection(): void {
    // Create a collection
    const col = new VB6Collection();

    // Add items with auto-generated keys
    col.Add('First Item');
    col.Add('Second Item');

    // Add items with specific keys
    col.Add('Named Item', 'MyKey');
    col.Add('Another Named', 'Key2');

    // Add with positioning
    col.Add('Inserted Before', 'InsKey', 2); // Insert before index 2
    col.Add('Inserted After', undefined, undefined, 'MyKey'); // Insert after 'MyKey'

    // Access by index (1-based)

    // Access by key

    // Check existence

    // Iterate with for...of
    for (const item of col) {
      // Demonstrates iteration over VB6 Collection
      void item;
    }

    // Remove by key
    col.Remove('MyKey');

    // Remove by index
    col.Remove(1);
  }

  demonstrateDictionary(): void {
    // Create a dictionary
    const dict = new VB6Dictionary();

    // Set compare mode before adding items
    dict.CompareMode = CompareMethod.TextCompare;

    // Add key/value pairs
    dict.Add('Name', 'John Doe');
    dict.Add('Age', 30);
    dict.Add('City', 'New York');

    // Case-insensitive access due to TextCompare

    // Auto-add missing keys
    dict.SetItem('Country', 'USA'); // Adds if not exists

    // Check existence

    // Change a key
    dict.SetKey('City', 'Location');

    // Get all keys

    // Get all items

    // Iterate key/value pairs
    for (const [key, value] of dict) {
      // Demonstrates iteration over VB6 Dictionary
      void key;
      void value;
    }

    // Remove item
    dict.Remove('Age');

    // Clear all
    dict.RemoveAll();
  }
}

// Export all collection functionality
export const VB6Collections = {
  VB6Collection,
  VB6Dictionary,
  CompareMethod,
  CreateCollection,
  CreateDictionary,
  IsCollection,
  IsDictionary,
  CollectionExample,
};
