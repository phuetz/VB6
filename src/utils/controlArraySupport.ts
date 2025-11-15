/**
 * Control Array Support
 * Enables VB6-style control arrays where multiple controls share the same name
 * but are differentiated by an Index property
 */

import { Control } from '../context/types';

/**
 * Control array definition
 */
export interface ControlArrayDefinition {
  name: string;
  controlType: string;
  indices: number[];
  controls: Map<number, Control>;
}

/**
 * Control Array Manager
 */
export class ControlArrayManager {
  private arrays: Map<string, ControlArrayDefinition> = new Map();

  /**
   * Create or get a control array
   */
  createArray(name: string, controlType: string): ControlArrayDefinition {
    if (!this.arrays.has(name)) {
      this.arrays.set(name, {
        name,
        controlType,
        indices: [],
        controls: new Map(),
      });
    }
    return this.arrays.get(name)!;
  }

  /**
   * Add a control to an array
   */
  addControl(name: string, index: number, control: Control): void {
    const array = this.arrays.get(name);
    if (!array) {
      throw new Error(`Control array ${name} does not exist`);
    }

    if (array.controls.has(index)) {
      throw new Error(`Control ${name}(${index}) already exists`);
    }

    array.indices.push(index);
    array.indices.sort((a, b) => a - b);
    array.controls.set(index, control);
  }

  /**
   * Remove a control from an array
   */
  removeControl(name: string, index: number): void {
    const array = this.arrays.get(name);
    if (!array) return;

    array.controls.delete(index);
    array.indices = array.indices.filter(i => i !== index);

    // If array is empty, remove it
    if (array.indices.length === 0) {
      this.arrays.delete(name);
    }
  }

  /**
   * Get a specific control from an array
   */
  getControl(name: string, index: number): Control | undefined {
    const array = this.arrays.get(name);
    if (!array) return undefined;
    return array.controls.get(index);
  }

  /**
   * Get all controls in an array
   */
  getAllControls(name: string): Control[] {
    const array = this.arrays.get(name);
    if (!array) return [];
    return Array.from(array.controls.values());
  }

  /**
   * Check if a control array exists
   */
  hasArray(name: string): boolean {
    return this.arrays.has(name);
  }

  /**
   * Get array definition
   */
  getArray(name: string): ControlArrayDefinition | undefined {
    return this.arrays.get(name);
  }

  /**
   * Get the lowest available index for a control array
   */
  getNextIndex(name: string): number {
    const array = this.arrays.get(name);
    if (!array || array.indices.length === 0) return 0;

    // Find first gap in indices
    for (let i = 0; i < array.indices.length; i++) {
      if (array.indices[i] !== i) {
        return i;
      }
    }

    // No gaps, return next sequential index
    return array.indices[array.indices.length - 1] + 1;
  }

  /**
   * Get the LBound (lower bound) of a control array
   */
  getLBound(name: string): number {
    const array = this.arrays.get(name);
    if (!array || array.indices.length === 0) {
      throw new Error(`Control array ${name} has no elements`);
    }
    return Math.min(...array.indices);
  }

  /**
   * Get the UBound (upper bound) of a control array
   */
  getUBound(name: string): number {
    const array = this.arrays.get(name);
    if (!array || array.indices.length === 0) {
      throw new Error(`Control array ${name} has no elements`);
    }
    return Math.max(...array.indices);
  }

  /**
   * Get the count of controls in an array
   */
  getCount(name: string): number {
    const array = this.arrays.get(name);
    if (!array) return 0;
    return array.indices.length;
  }

  /**
   * Load a control at runtime (like VB6's Load statement)
   */
  loadControl(name: string, index: number, template: Control): Control {
    const array = this.getArray(name);
    if (!array) {
      throw new Error(`Control array ${name} does not exist`);
    }

    if (array.controls.has(index)) {
      throw new Error(`Control ${name}(${index}) already loaded`);
    }

    // Clone the template control
    const newControl: Control = {
      ...template,
      id: Date.now() + Math.random(), // Generate unique ID
      name: name,
      visible: true,
    };

    this.addControl(name, index, newControl);
    return newControl;
  }

  /**
   * Unload a control at runtime (like VB6's Unload statement)
   */
  unloadControl(name: string, index: number): void {
    const array = this.getArray(name);
    if (!array) {
      throw new Error(`Control array ${name} does not exist`);
    }

    if (!array.controls.has(index)) {
      throw new Error(`Control ${name}(${index}) is not loaded`);
    }

    this.removeControl(name, index);
  }

  /**
   * Check if a control is loaded
   */
  isLoaded(name: string, index: number): boolean {
    const array = this.getArray(name);
    if (!array) return false;
    return array.controls.has(index);
  }

  /**
   * Get all control arrays
   */
  getAllArrays(): ControlArrayDefinition[] {
    return Array.from(this.arrays.values());
  }

  /**
   * Clear all control arrays
   */
  clear(): void {
    this.arrays.clear();
  }
}

/**
 * Global instance of the control array manager
 */
export const globalControlArrayManager = new ControlArrayManager();

/**
 * Helper functions for VB6 compatibility
 */

/**
 * Load a control (VB6 Load statement)
 * Usage: Load(controlArray, index, templateControl)
 */
export function Load(arrayName: string, index: number, template: Control): Control {
  return globalControlArrayManager.loadControl(arrayName, index, template);
}

/**
 * Unload a control (VB6 Unload statement)
 * Usage: Unload(controlArray, index)
 */
export function Unload(arrayName: string, index: number): void {
  globalControlArrayManager.unloadControl(arrayName, index);
}

/**
 * Check if control is part of an array
 */
export function isControlArray(controlName: string): boolean {
  return globalControlArrayManager.hasArray(controlName);
}

/**
 * Get control from array by index
 */
export function getControlByIndex(arrayName: string, index: number): Control | undefined {
  return globalControlArrayManager.getControl(arrayName, index);
}

/**
 * Iterate over all controls in an array
 */
export function* iterateControlArray(arrayName: string): Generator<[number, Control]> {
  const array = globalControlArrayManager.getArray(arrayName);
  if (!array) return;

  for (const [index, control] of array.controls.entries()) {
    yield [index, control];
  }
}

/**
 * Example usage:
 *
 * // Create a control array
 * const manager = new ControlArrayManager();
 * manager.createArray('txtInput', 'TextBox');
 *
 * // Add controls
 * manager.addControl('txtInput', 0, { ...textBoxControl });
 * manager.addControl('txtInput', 1, { ...textBoxControl });
 *
 * // Access control
 * const txt0 = manager.getControl('txtInput', 0);
 *
 * // Load control at runtime
 * Load('txtInput', 2, templateControl);
 *
 * // Unload control
 * Unload('txtInput', 1);
 *
 * // Iterate
 * for (const [index, control] of iterateControlArray('txtInput')) {
 *   console.log(`txtInput(${index})`, control);
 * }
 */
