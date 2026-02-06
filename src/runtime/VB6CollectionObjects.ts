/**
 * VB6 Collection and Dictionary Objects Implementation
 *
 * Complete implementation of VB6 Collection object and Microsoft Scripting Dictionary
 * Provides full compatibility with VB6 data structure operations
 */

import { errorHandler } from './VB6ErrorHandling';

// Collection item interface
export interface VB6CollectionItem {
  value: any;
  key?: string;
  index: number;
}

/**
 * VB6 Collection Object
 * Standard VB6 Collection with 1-based indexing and key support
 */
export class VB6Collection {
  private items: VB6CollectionItem[] = [];
  private keyMap: Map<string, number> = new Map(); // key -> index mapping
  private nextIndex: number = 1;

  constructor() {}

  /**
   * Count Property - Returns number of items in collection
   */
  get Count(): number {
    return this.items.length;
  }

  /**
   * Add Method - Adds an item to the collection
   * @param item The item to add
   * @param key Optional key for the item
   * @param before Optional position to insert before (1-based)
   * @param after Optional position to insert after (1-based)
   */
  Add(item: any, key?: string, before?: any, after?: any): void {
    try {
      // Validate key uniqueness
      if (key !== undefined) {
        if (this.keyMap.has(key)) {
          errorHandler.raiseError(457, `Key "${key}" already exists`, 'Collection.Add');
          return;
        }
      }

      let insertIndex = this.items.length; // Default: add at end

      // Handle before/after positioning
      if (before !== undefined) {
        const beforeIndex = this.getItemIndex(before);
        insertIndex = beforeIndex - 1; // Convert to 0-based
      } else if (after !== undefined) {
        const afterIndex = this.getItemIndex(after);
        insertIndex = afterIndex; // Convert to 0-based and add after
      }

      // Ensure valid insert position
      insertIndex = Math.max(0, Math.min(insertIndex, this.items.length));

      // Create collection item
      const collectionItem: VB6CollectionItem = {
        value: item,
        key: key,
        index: this.nextIndex++,
      };

      // Insert item at specified position
      this.items.splice(insertIndex, 0, collectionItem);

      // Update key mapping
      if (key !== undefined) {
        this.keyMap.set(key, insertIndex + 1); // Store 1-based index
      }

      // Update key mappings for items after insertion point
      this.updateKeyMappings();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Collection.Add');
    }
  }

  /**
   * Remove Method - Removes an item from the collection
   * @param index 1-based index or key of item to remove
   */
  Remove(index: number | string): void {
    try {
      const itemIndex = this.getItemIndex(index);
      const item = this.items[itemIndex - 1]; // Convert to 0-based

      if (!item) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Collection.Remove');
        return;
      }

      // Remove key mapping if exists
      if (item.key) {
        this.keyMap.delete(item.key);
      }

      // Remove item from array
      this.items.splice(itemIndex - 1, 1);

      // Update key mappings
      this.updateKeyMappings();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Collection.Remove');
    }
  }

  /**
   * Item Method - Gets an item from the collection
   * @param index 1-based index or key of item to retrieve
   */
  Item(index: number | string): any {
    try {
      const itemIndex = this.getItemIndex(index);
      const item = this.items[itemIndex - 1]; // Convert to 0-based

      if (!item) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Collection.Item');
        return null;
      }

      return item.value;
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Collection.Item');
      return null;
    }
  }

  /**
   * Clear Method - Removes all items from collection
   */
  Clear(): void {
    this.items = [];
    this.keyMap.clear();
    this.nextIndex = 1;
  }

  /**
   * Exists Method - Checks if a key exists in the collection
   * @param key The key to check
   */
  Exists(key: string): boolean {
    return this.keyMap.has(key);
  }

  /**
   * Keys Method - Returns array of all keys
   */
  get Keys(): string[] {
    return this.items.filter(item => item.key !== undefined).map(item => item.key!);
  }

  /**
   * Items Method - Returns array of all values
   */
  get Items(): any[] {
    return this.items.map(item => item.value);
  }

  /**
   * For Each support - Returns iterator
   */
  *[Symbol.iterator](): Iterator<any> {
    for (const item of this.items) {
      yield item.value;
    }
  }

  /**
   * Get item index from key or 1-based index
   */
  private getItemIndex(indexOrKey: number | string): number {
    if (typeof indexOrKey === 'string') {
      // Key lookup
      const index = this.keyMap.get(indexOrKey);
      if (index === undefined) {
        throw new Error(`Key "${indexOrKey}" not found`);
      }
      return index;
    } else {
      // 1-based index
      if (indexOrKey < 1 || indexOrKey > this.items.length) {
        throw new Error(`Index ${indexOrKey} out of range`);
      }
      return indexOrKey;
    }
  }

  /**
   * Update key mappings after array modification
   */
  private updateKeyMappings(): void {
    this.keyMap.clear();
    this.items.forEach((item, index) => {
      if (item.key) {
        this.keyMap.set(item.key, index + 1); // Store 1-based index
      }
    });
  }

  /**
   * ToString for debugging
   */
  toString(): string {
    return `Collection(Count=${this.Count})`;
  }
}

/**
 * VB6 Dictionary Object (Microsoft Scripting Dictionary)
 * Provides key-value pair storage with case-sensitive or case-insensitive keys
 */
export class VB6Dictionary {
  private items: Map<string, any> = new Map();
  private originalKeys: Map<string, string> = new Map(); // For case-insensitive mode
  private _compareMode: number = 0; // 0 = Binary (case sensitive), 1 = Text (case insensitive)

  constructor() {}

  /**
   * Count Property - Returns number of items in dictionary
   */
  get Count(): number {
    return this.items.size;
  }

  /**
   * CompareMode Property - Gets/sets comparison mode
   * 0 = Binary (case sensitive), 1 = Text (case insensitive)
   */
  get CompareMode(): number {
    return this._compareMode;
  }

  set CompareMode(value: number) {
    if (this.items.size > 0) {
      errorHandler.raiseError(
        5,
        'Cannot change CompareMode when dictionary contains items',
        'Dictionary.CompareMode'
      );
      return;
    }
    this._compareMode = value;
  }

  /**
   * Add Method - Adds a key-value pair to the dictionary
   * @param key The key
   * @param item The value
   */
  Add(key: any, item: any): void {
    try {
      const keyStr = this.normalizeKey(String(key));

      if (this.items.has(keyStr)) {
        errorHandler.raiseError(457, `Key "${key}" already exists`, 'Dictionary.Add');
        return;
      }

      this.items.set(keyStr, item);

      // Store original key for case-insensitive mode
      if (this._compareMode === 1) {
        this.originalKeys.set(keyStr, String(key));
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Dictionary.Add');
    }
  }

  /**
   * Remove Method - Removes a key-value pair from the dictionary
   * @param key The key to remove
   */
  Remove(key: any): void {
    try {
      const keyStr = this.normalizeKey(String(key));

      if (!this.items.has(keyStr)) {
        errorHandler.raiseError(32811, `Key "${key}" not found`, 'Dictionary.Remove');
        return;
      }

      this.items.delete(keyStr);

      if (this._compareMode === 1) {
        this.originalKeys.delete(keyStr);
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Dictionary.Remove');
    }
  }

  /**
   * Item Property - Gets or sets a value by key
   * @param key The key
   */
  Item(key: any): any;
  Item(key: any, value: any): void;
  Item(key: any, value?: any): any {
    const keyStr = this.normalizeKey(String(key));

    if (value !== undefined) {
      // Setter
      this.items.set(keyStr, value);

      if (this._compareMode === 1 && !this.originalKeys.has(keyStr)) {
        this.originalKeys.set(keyStr, String(key));
      }
    } else {
      // Getter
      if (!this.items.has(keyStr)) {
        // VB6 Dictionary returns Empty for non-existent keys
        return undefined;
      }
      return this.items.get(keyStr);
    }
  }

  /**
   * Exists Method - Checks if a key exists in the dictionary
   * @param key The key to check
   */
  Exists(key: any): boolean {
    const keyStr = this.normalizeKey(String(key));
    return this.items.has(keyStr);
  }

  /**
   * Keys Method - Returns array of all keys
   */
  Keys(): any[] {
    if (this._compareMode === 1) {
      // Return original keys for case-insensitive mode
      return Array.from(this.items.keys()).map(key => this.originalKeys.get(key) || key);
    } else {
      return Array.from(this.items.keys());
    }
  }

  /**
   * Items Method - Returns array of all values
   */
  Items(): any[] {
    return Array.from(this.items.values());
  }

  /**
   * RemoveAll Method - Removes all items from dictionary
   */
  RemoveAll(): void {
    this.items.clear();
    this.originalKeys.clear();
  }

  /**
   * Key Property - Changes a key
   * @param oldKey The current key
   * @param newKey The new key
   */
  Key(oldKey: any, newKey: any): void {
    try {
      const oldKeyStr = this.normalizeKey(String(oldKey));
      const newKeyStr = this.normalizeKey(String(newKey));

      if (!this.items.has(oldKeyStr)) {
        errorHandler.raiseError(32811, `Key "${oldKey}" not found`, 'Dictionary.Key');
        return;
      }

      if (this.items.has(newKeyStr) && oldKeyStr !== newKeyStr) {
        errorHandler.raiseError(457, `Key "${newKey}" already exists`, 'Dictionary.Key');
        return;
      }

      // Get the value and remove old key
      const value = this.items.get(oldKeyStr);
      this.items.delete(oldKeyStr);

      // Add with new key
      this.items.set(newKeyStr, value);

      // Update original keys mapping
      if (this._compareMode === 1) {
        this.originalKeys.delete(oldKeyStr);
        this.originalKeys.set(newKeyStr, String(newKey));
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Dictionary.Key');
    }
  }

  /**
   * For Each support - Returns iterator for keys
   */
  *[Symbol.iterator](): Iterator<string> {
    for (const key of this.items.keys()) {
      if (this._compareMode === 1) {
        yield this.originalKeys.get(key) || key;
      } else {
        yield key;
      }
    }
  }

  /**
   * Normalize key based on compare mode
   */
  private normalizeKey(key: string): string {
    return this._compareMode === 1 ? key.toLowerCase() : key;
  }

  /**
   * ToString for debugging
   */
  toString(): string {
    return `Dictionary(Count=${this.Count}, CompareMode=${this._compareMode})`;
  }
}

/**
 * VB6 Scripting.FileSystemObject Dictionary compatibility
 */
export class VB6FileSystemDictionary extends VB6Dictionary {
  constructor() {
    super();
    // FileSystem dictionaries are typically case-insensitive
    this.CompareMode = 1;
  }
}

/**
 * Create Collection - VB6 compatible Collection creation
 */
export function CreateCollection(): VB6Collection {
  return new VB6Collection();
}

/**
 * Create Dictionary - VB6 compatible Dictionary creation
 */
export function CreateDictionary(compareMode: number = 0): VB6Dictionary {
  const dict = new VB6Dictionary();
  dict.CompareMode = compareMode;
  return dict;
}

/**
 * CreateObject support for Collection and Dictionary
 */
export function CreateCollectionObject(progId: string): any {
  switch (progId.toLowerCase()) {
    case 'vb.collection':
    case 'collection':
      return new VB6Collection();

    case 'scripting.dictionary':
    case 'dictionary':
      return new VB6Dictionary();

    case 'scripting.filesystemobject.dictionary':
      return new VB6FileSystemDictionary();

    default:
      console.warn(`[VB6 Collections] Unknown collection object: ${progId}`);
      return null;
  }
}

/**
 * VB6 Collection utility functions
 */
export class VB6CollectionUtils {
  /**
   * Convert array to Collection
   */
  static fromArray(array: any[], keyProperty?: string): VB6Collection {
    const collection = new VB6Collection();

    array.forEach((item, index) => {
      let key: string | undefined = undefined;

      if (keyProperty && typeof item === 'object' && item[keyProperty]) {
        key = String(item[keyProperty]);
      }

      collection.Add(item, key);
    });

    return collection;
  }

  /**
   * Convert Collection to array
   */
  static toArray(collection: VB6Collection): any[] {
    return collection.Items;
  }

  /**
   * Convert object to Dictionary
   */
  static fromObject(obj: { [key: string]: any }): VB6Dictionary {
    const dictionary = new VB6Dictionary();

    for (const [key, value] of Object.entries(obj)) {
      dictionary.Add(key, value);
    }

    return dictionary;
  }

  /**
   * Convert Dictionary to object
   */
  static toObject(dictionary: VB6Dictionary): { [key: string]: any } {
    const obj: { [key: string]: any } = {};
    const keys = dictionary.Keys();

    keys.forEach(key => {
      obj[key] = dictionary.Item(key);
    });

    return obj;
  }

  /**
   * Find items in Collection by predicate
   */
  static find(collection: VB6Collection, predicate: (item: any, index: number) => boolean): any[] {
    const results: any[] = [];
    const items = collection.Items;

    items.forEach((item, index) => {
      if (predicate(item, index)) {
        results.push(item);
      }
    });

    return results;
  }

  /**
   * Sort Collection items
   */
  static sort(
    collection: VB6Collection,
    compareFunction?: (a: any, b: any) => number
  ): VB6Collection {
    const sortedItems = collection.Items.sort(compareFunction);
    const newCollection = new VB6Collection();

    sortedItems.forEach(item => {
      newCollection.Add(item);
    });

    return newCollection;
  }
}

// Global Collection and Dictionary constructors for VB6 compatibility
declare global {
  interface Window {
    VB6Collection: typeof VB6Collection;
    VB6Dictionary: typeof VB6Dictionary;
    Collection: typeof VB6Collection;
    Dictionary: typeof VB6Dictionary;
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.VB6Collection = VB6Collection;
  window.VB6Dictionary = VB6Dictionary;
  window.Collection = VB6Collection;
  window.Dictionary = VB6Dictionary;
}

// Export all collection objects and utilities
export const VB6CollectionObjects = {
  // Classes
  VB6Collection,
  VB6Dictionary,
  VB6FileSystemDictionary,

  // Factory functions
  CreateCollection,
  CreateDictionary,
  CreateCollectionObject,

  // Utilities
  VB6CollectionUtils,
};

// Example usage patterns
export const VB6CollectionExamples = {
  // Collection examples
  Collection: `
' VB6 Collection usage
Dim myCollection As Collection
Set myCollection = New Collection

' Add items with and without keys
myCollection.Add "First Item"
myCollection.Add "Second Item", "key2"
myCollection.Add "Third Item", , 1  ' Insert at beginning

' Access items
Debug.Print myCollection.Item(1)      ' "Third Item"
Debug.Print myCollection.Item("key2") ' "Second Item"
Debug.Print myCollection.Count        ' 3

' Remove items
myCollection.Remove(1)
myCollection.Remove("key2")
`,

  // Dictionary examples
  Dictionary: `
' VB6 Dictionary usage
Dim myDict As Object
Set myDict = CreateObject("Scripting.Dictionary")

' Set comparison mode
myDict.CompareMode = 1  ' Case insensitive

' Add items
myDict.Add "Name", "John Doe"
myDict.Add "Age", 25
myDict.Add "City", "New York"

' Access and modify items
Debug.Print myDict.Item("Name")  ' "John Doe"
myDict.Item("Name") = "Jane Doe" ' Modify value

' Check existence
If myDict.Exists("Age") Then
    Debug.Print "Age found: " & myDict.Item("Age")
End If

' Iterate over keys
Dim key As Variant
For Each key In myDict.Keys()
    Debug.Print key & " = " & myDict.Item(key)
Next key
`,
};
