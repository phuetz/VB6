/**
 * Control Array Manager for VB6 IDE
 * Handles creation, management, and manipulation of control arrays
 */

import { Control } from '../context/types';

export interface ControlArrayInfo {
  baseName: string;
  type: string;
  indices: number[];
  controls: Control[];
}

export class ControlArrayManager {
  /**
   * Creates a control array from a selected control
   */
  static createControlArray(control: Control, newIndex: number = 1): Control[] {
    if (control.isArray) {
      throw new Error('Control is already part of an array');
    }

    // Create the array version of the original control (index 0)
    const originalArrayControl: Control = {
      ...control,
      index: 0,
      arrayName: control.name,
      isArray: true,
      name: `${control.name}(0)`,
    };

    // Create the new control (index 1 by default)
    const newArrayControl: Control = {
      ...control,
      id: Date.now() + Math.random(), // Generate new unique ID
      index: newIndex,
      arrayName: control.name,
      isArray: true,
      name: `${control.name}(${newIndex})`,
      x: control.x + 20, // Offset position
      y: control.y + 20,
    };

    return [originalArrayControl, newArrayControl];
  }

  /**
   * Adds a new element to an existing control array
   */
  static addToControlArray(
    controls: Control[],
    arrayBaseName: string,
    sourceControl?: Control
  ): Control {
    const arrayControls = this.getControlArrayElements(controls, arrayBaseName);

    if (arrayControls.length === 0) {
      throw new Error(`Control array '${arrayBaseName}' not found`);
    }

    // Find the next available index
    const existingIndices = arrayControls.map(c => c.index || 0);
    const nextIndex = Math.max(...existingIndices) + 1;

    // Use the first array element as template, or provided source control
    const template = sourceControl || arrayControls[0];

    const newControl: Control = {
      ...template,
      id: Date.now() + Math.random(),
      index: nextIndex,
      arrayName: arrayBaseName,
      isArray: true,
      name: `${arrayBaseName}(${nextIndex})`,
      x: template.x + nextIndex * 20, // Cascade position
      y: template.y + nextIndex * 20,
    };

    return newControl;
  }

  /**
   * Removes an element from a control array
   */
  static removeFromControlArray(controls: Control[], controlToRemove: Control): Control[] {
    if (!controlToRemove.isArray || controlToRemove.arrayName === undefined) {
      throw new Error('Control is not part of an array');
    }

    const arrayControls = this.getControlArrayElements(controls, controlToRemove.arrayName);

    if (arrayControls.length <= 1) {
      throw new Error('Cannot remove the last element of a control array');
    }

    // Remove the control
    const updatedControls = controls.filter(c => c.id !== controlToRemove.id);

    // If we're removing index 0 and there's only one other element, convert back to single control
    if (arrayControls.length === 2 && controlToRemove.index === 0) {
      const remainingControl = arrayControls.find(c => c.id !== controlToRemove.id);
      if (remainingControl) {
        const singleControl: Control = {
          ...remainingControl,
          index: undefined,
          arrayName: undefined,
          isArray: false,
          name: remainingControl.arrayName || remainingControl.name,
        };

        return updatedControls.map(c => (c.id === remainingControl.id ? singleControl : c));
      }
    }

    return updatedControls;
  }

  /**
   * Gets all controls in a specific control array
   */
  static getControlArrayElements(controls: Control[], arrayBaseName: string): Control[] {
    return controls
      .filter(c => c.isArray && c.arrayName === arrayBaseName)
      .sort((a, b) => (a.index || 0) - (b.index || 0));
  }

  /**
   * Gets information about all control arrays in the form
   */
  static getControlArrays(controls: Control[]): ControlArrayInfo[] {
    const arrays = new Map<string, ControlArrayInfo>();

    controls.forEach(control => {
      if (control.isArray && control.arrayName) {
        if (!arrays.has(control.arrayName)) {
          arrays.set(control.arrayName, {
            baseName: control.arrayName,
            type: control.type,
            indices: [],
            controls: [],
          });
        }

        const arrayInfo = arrays.get(control.arrayName)!;
        arrayInfo.indices.push(control.index || 0);
        arrayInfo.controls.push(control);
      }
    });

    // Sort indices for each array
    arrays.forEach(arrayInfo => {
      arrayInfo.indices.sort((a, b) => a - b);
      arrayInfo.controls.sort((a, b) => (a.index || 0) - (b.index || 0));
    });

    return Array.from(arrays.values());
  }

  /**
   * Validates control array integrity
   */
  static validateControlArray(controls: Control[], arrayBaseName: string): string[] {
    const arrayControls = this.getControlArrayElements(controls, arrayBaseName);
    const errors: string[] = [];

    if (arrayControls.length === 0) {
      return [`Control array '${arrayBaseName}' has no elements`];
    }

    // Check for duplicate indices
    const indices = arrayControls.map(c => c.index || 0);
    const uniqueIndices = [...new Set(indices)];
    if (indices.length !== uniqueIndices.length) {
      errors.push(`Control array '${arrayBaseName}' has duplicate indices`);
    }

    // Check that all controls have the same type
    const types = [...new Set(arrayControls.map(c => c.type))];
    if (types.length > 1) {
      errors.push(
        `Control array '${arrayBaseName}' contains different control types: ${types.join(', ')}`
      );
    }

    // Check for missing index 0
    if (!indices.includes(0)) {
      errors.push(`Control array '${arrayBaseName}' is missing index 0`);
    }

    return errors;
  }

  /**
   * Generates a unique name for a new control, checking for existing arrays
   */
  static generateControlName(controls: Control[], type: string): string {
    const baseNames = controls
      .filter(c => c.type === type)
      .map(c => c.arrayName || c.name)
      .map(name => name.replace(/\(\d+\)$/, '')) // Remove array index from name
      .filter((name, index, arr) => arr.indexOf(name) === index); // Unique names

    let counter = 1;
    const baseName = type;

    // Find available name
    while (baseNames.includes(`${baseName}${counter}`)) {
      counter++;
    }

    return `${baseName}${counter}`;
  }

  /**
   * Converts a regular control to the first element of a control array
   */
  static convertToArray(control: Control): Control {
    if (control.isArray) {
      throw new Error('Control is already part of an array');
    }

    return {
      ...control,
      index: 0,
      arrayName: control.name,
      isArray: true,
      name: `${control.name}(0)`,
    };
  }

  /**
   * Converts a single-element array back to a regular control
   */
  static convertFromArray(control: Control): Control {
    if (!control.isArray || control.arrayName === undefined) {
      throw new Error('Control is not part of an array');
    }

    return {
      ...control,
      index: undefined,
      arrayName: undefined,
      isArray: false,
      name: control.arrayName,
    };
  }
}

export default ControlArrayManager;
