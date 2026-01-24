/**
 * VB6 Control Array Support
 * Implements VB6-style control arrays with event handling
 */

import { Control } from '../context/types';

// ============================================================================
// Types
// ============================================================================

export interface ControlArrayMember {
  index: number;
  control: Control;
  element?: HTMLElement;
}

export interface ControlArrayEventArgs {
  index: number;
  control: Control;
}

export type ControlArrayEventHandler = (index: number, ...args: any[]) => void;

// ============================================================================
// VB6 Control Array Class
// ============================================================================

export class VB6ControlArray<T extends Control = Control> implements Iterable<T> {
  private _name: string;
  private _type: string;
  private _members: Map<number, ControlArrayMember> = new Map();
  private _eventHandlers: Map<string, ControlArrayEventHandler[]> = new Map();
  private _nextAutoIndex: number = 0;
  private _templateControl: Partial<T> | null = null;

  constructor(name: string, type: string, templateControl?: Partial<T>) {
    this._name = name;
    this._type = type;
    this._templateControl = templateControl || null;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Array name (e.g., "Command1")
   */
  get Name(): string {
    return this._name;
  }

  /**
   * Control type (e.g., "CommandButton")
   */
  get Type(): string {
    return this._type;
  }

  /**
   * Number of controls in the array
   */
  get Count(): number {
    return this._members.size;
  }

  /**
   * Get lower bound (VB6 style - always 0 for control arrays)
   */
  get LBound(): number {
    if (this._members.size === 0) return 0;
    return Math.min(...this._members.keys());
  }

  /**
   * Get upper bound
   */
  get UBound(): number {
    if (this._members.size === 0) return -1;
    return Math.max(...this._members.keys());
  }

  // ============================================================================
  // Index Access
  // ============================================================================

  /**
   * Get control by index (VB6: ControlName(Index))
   */
  Item(index: number): T | undefined {
    const member = this._members.get(index);
    return member?.control as T | undefined;
  }

  /**
   * Check if index exists
   */
  Exists(index: number): boolean {
    return this._members.has(index);
  }

  /**
   * Get all indices
   */
  Indices(): number[] {
    return Array.from(this._members.keys()).sort((a, b) => a - b);
  }

  // ============================================================================
  // Control Management
  // ============================================================================

  /**
   * Add a control to the array at specific index
   */
  Add(control: T, index?: number): number {
    const actualIndex = index !== undefined ? index : this._nextAutoIndex;

    if (this._members.has(actualIndex)) {
      throw new Error(`Control array index ${actualIndex} already exists`);
    }

    // Apply template properties if available
    if (this._templateControl) {
      for (const [key, value] of Object.entries(this._templateControl)) {
        if (!(key in control)) {
          (control as any)[key] = value;
        }
      }
    }

    // Set control name with index
    control.name = `${this._name}(${actualIndex})`;

    const member: ControlArrayMember = {
      index: actualIndex,
      control
    };

    this._members.set(actualIndex, member);

    // Update auto index
    if (actualIndex >= this._nextAutoIndex) {
      this._nextAutoIndex = actualIndex + 1;
    }

    return actualIndex;
  }

  /**
   * Load a new control at runtime (VB6: Load ControlName(Index))
   */
  Load(index: number, sourceIndex?: number): T {
    if (this._members.has(index)) {
      throw new Error(`Control array element ${index} already exists`);
    }

    // Get template from source or first element
    const templateIndex = sourceIndex !== undefined ? sourceIndex : this.LBound;
    const template = this._members.get(templateIndex);

    if (!template) {
      throw new Error('No template control available for Load');
    }

    // Clone the control
    const newControl = this.cloneControl(template.control as T);
    newControl.name = `${this._name}(${index})`;

    // New controls are invisible by default (VB6 behavior)
    if (newControl.properties) {
      newControl.properties.Visible = false;
    }

    const member: ControlArrayMember = {
      index,
      control: newControl
    };

    this._members.set(index, member);

    return newControl;
  }

  /**
   * Unload a control at runtime (VB6: Unload ControlName(Index))
   */
  Unload(index: number): void {
    // Cannot unload index 0 (design-time control)
    if (index === 0) {
      throw new Error('Cannot unload design-time control array element');
    }

    if (!this._members.has(index)) {
      throw new Error(`Control array element ${index} does not exist`);
    }

    this._members.delete(index);
  }

  /**
   * Remove control (for design-time removal)
   */
  Remove(index: number): void {
    this._members.delete(index);
  }

  /**
   * Clear all controls
   */
  Clear(): void {
    this._members.clear();
    this._nextAutoIndex = 0;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Subscribe to control array event
   * Events are raised with index as first parameter
   */
  On(eventName: string, handler: ControlArrayEventHandler): void {
    if (!this._eventHandlers.has(eventName)) {
      this._eventHandlers.set(eventName, []);
    }
    this._eventHandlers.get(eventName)!.push(handler);
  }

  /**
   * Unsubscribe from control array event
   */
  Off(eventName: string, handler: ControlArrayEventHandler): void {
    const handlers = this._eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Raise event for a specific control
   */
  RaiseEvent(index: number, eventName: string, ...args: any[]): void {
    const handlers = this._eventHandlers.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        handler(index, ...args);
      }
    }
  }

  /**
   * Wire up events for a control element
   */
  WireEvents(index: number, element: HTMLElement): void {
    const member = this._members.get(index);
    if (!member) return;

    member.element = element;

    // Standard VB6 events
    element.addEventListener('click', () => this.RaiseEvent(index, 'Click'));
    element.addEventListener('dblclick', () => this.RaiseEvent(index, 'DblClick'));
    element.addEventListener('mousedown', (e) =>
      this.RaiseEvent(index, 'MouseDown', this.getMouseButton(e), e.shiftKey, e.clientX, e.clientY)
    );
    element.addEventListener('mouseup', (e) =>
      this.RaiseEvent(index, 'MouseUp', this.getMouseButton(e), e.shiftKey, e.clientX, e.clientY)
    );
    element.addEventListener('mousemove', (e) =>
      this.RaiseEvent(index, 'MouseMove', this.getMouseButton(e), e.shiftKey, e.clientX, e.clientY)
    );
    element.addEventListener('keydown', (e) =>
      this.RaiseEvent(index, 'KeyDown', (e as KeyboardEvent).keyCode, e.shiftKey)
    );
    element.addEventListener('keyup', (e) =>
      this.RaiseEvent(index, 'KeyUp', (e as KeyboardEvent).keyCode, e.shiftKey)
    );
    element.addEventListener('keypress', (e) =>
      this.RaiseEvent(index, 'KeyPress', (e as KeyboardEvent).keyCode)
    );
    element.addEventListener('focus', () => this.RaiseEvent(index, 'GotFocus'));
    element.addEventListener('blur', () => this.RaiseEvent(index, 'LostFocus'));
    element.addEventListener('change', () => this.RaiseEvent(index, 'Change'));
  }

  private getMouseButton(e: MouseEvent): number {
    if (e.button === 0) return 1; // vbLeftButton
    if (e.button === 2) return 2; // vbRightButton
    if (e.button === 1) return 4; // vbMiddleButton
    return 0;
  }

  // ============================================================================
  // Property Access (Batch Operations)
  // ============================================================================

  /**
   * Set property on all controls
   */
  SetProperty(propertyName: string, value: any): void {
    for (const member of this._members.values()) {
      if (member.control.properties) {
        member.control.properties[propertyName] = value;
      }
    }
  }

  /**
   * Get property from specific control
   */
  GetProperty(index: number, propertyName: string): any {
    const member = this._members.get(index);
    return member?.control.properties?.[propertyName];
  }

  /**
   * Set property on specific control
   */
  SetPropertyAt(index: number, propertyName: string, value: any): void {
    const member = this._members.get(index);
    if (member?.control.properties) {
      member.control.properties[propertyName] = value;
    }
  }

  // ============================================================================
  // Iteration
  // ============================================================================

  /**
   * Iterator for for...of loops
   */
  [Symbol.iterator](): Iterator<T> {
    const members = Array.from(this._members.values())
      .sort((a, b) => a.index - b.index)
      .map(m => m.control as T);
    let index = 0;

    return {
      next(): IteratorResult<T> {
        if (index < members.length) {
          return { value: members[index++], done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }

  /**
   * ForEach iteration
   */
  ForEach(callback: (control: T, index: number) => void): void {
    for (const [index, member] of this._members.entries()) {
      callback(member.control as T, index);
    }
  }

  /**
   * Map to new array
   */
  Map<U>(callback: (control: T, index: number) => U): U[] {
    const result: U[] = [];
    for (const [index, member] of this._members.entries()) {
      result.push(callback(member.control as T, index));
    }
    return result;
  }

  /**
   * Filter controls
   */
  Filter(predicate: (control: T, index: number) => boolean): T[] {
    const result: T[] = [];
    for (const [index, member] of this._members.entries()) {
      if (predicate(member.control as T, index)) {
        result.push(member.control as T);
      }
    }
    return result;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Export to JSON-serializable format
   */
  ToJSON(): object {
    return {
      name: this._name,
      type: this._type,
      members: this.Indices().map(index => ({
        index,
        control: this._members.get(index)!.control
      }))
    };
  }

  /**
   * Import from JSON
   */
  static FromJSON<T extends Control>(data: any): VB6ControlArray<T> {
    const array = new VB6ControlArray<T>(data.name, data.type);
    for (const member of data.members) {
      array.Add(member.control, member.index);
    }
    return array;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private cloneControl(source: T): T {
    return JSON.parse(JSON.stringify(source));
  }
}

// ============================================================================
// Control Array Manager
// ============================================================================

export class VB6ControlArrayManager {
  private arrays: Map<string, VB6ControlArray> = new Map();

  /**
   * Create or get a control array
   */
  GetOrCreate(name: string, type: string): VB6ControlArray {
    if (!this.arrays.has(name)) {
      this.arrays.set(name, new VB6ControlArray(name, type));
    }
    return this.arrays.get(name)!;
  }

  /**
   * Get an existing control array
   */
  Get(name: string): VB6ControlArray | undefined {
    return this.arrays.get(name);
  }

  /**
   * Check if control array exists
   */
  Exists(name: string): boolean {
    return this.arrays.has(name);
  }

  /**
   * Remove a control array
   */
  Remove(name: string): void {
    this.arrays.delete(name);
  }

  /**
   * Get all control array names
   */
  GetNames(): string[] {
    return Array.from(this.arrays.keys());
  }

  /**
   * Clear all control arrays
   */
  Clear(): void {
    this.arrays.clear();
  }

  /**
   * Find control by full name (e.g., "Command1(3)")
   */
  FindControl(fullName: string): Control | undefined {
    const match = fullName.match(/^(\w+)\((\d+)\)$/);
    if (!match) return undefined;

    const [, arrayName, indexStr] = match;
    const array = this.arrays.get(arrayName);
    if (!array) return undefined;

    return array.Item(parseInt(indexStr));
  }

  /**
   * Parse control name to array name and index
   */
  ParseControlName(fullName: string): { name: string; index?: number } | null {
    const match = fullName.match(/^(\w+)(?:\((\d+)\))?$/);
    if (!match) return null;

    return {
      name: match[1],
      index: match[2] ? parseInt(match[2]) : undefined
    };
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const controlArrayManager = new VB6ControlArrayManager();

// ============================================================================
// VB6-Compatible Functions
// ============================================================================

/**
 * VB6 Load statement for control arrays
 */
export function LoadControl(
  arrayName: string,
  index: number,
  sourceIndex?: number
): Control | undefined {
  const array = controlArrayManager.Get(arrayName);
  if (!array) {
    throw new Error(`Control array '${arrayName}' not found`);
  }
  return array.Load(index, sourceIndex);
}

/**
 * VB6 Unload statement for control arrays
 */
export function UnloadControl(arrayName: string, index: number): void {
  const array = controlArrayManager.Get(arrayName);
  if (!array) {
    throw new Error(`Control array '${arrayName}' not found`);
  }
  array.Unload(index);
}

/**
 * Get control from array
 */
export function GetControlArrayItem(
  arrayName: string,
  index: number
): Control | undefined {
  const array = controlArrayManager.Get(arrayName);
  return array?.Item(index);
}

// ============================================================================
// Export
// ============================================================================

export default {
  VB6ControlArray,
  VB6ControlArrayManager,
  controlArrayManager,
  LoadControl,
  UnloadControl,
  GetControlArrayItem
};
