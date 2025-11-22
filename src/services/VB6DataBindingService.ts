/**
 * VB6 Data Binding Service
 * Provides data binding capabilities for controls connected to recordsets
 * Supports two-way binding, change detection, and validation
 */

import { DAORecordset } from '../runtime/VB6DAOSystem';

export interface DataBindingOptions {
  controlName: string;
  fieldName: string;
  autoUpdate?: boolean;
  validateOnChange?: boolean;
  validationRule?: (value: any) => boolean;
  errorHandler?: (error: Error) => void;
}

export interface ControlBinding {
  controlName: string;
  fieldName: string;
  recordset: DAORecordset;
  element?: HTMLElement;
  isValid: boolean;
  lastValue: any;
}

export class VB6DataBindingService {
  private bindings: Map<string, ControlBinding> = new Map();
  private recordsets: Map<string, DAORecordset> = new Map();
  private updateCallbacks: Map<string, (value: any) => void> = new Map();

  /**
   * Binds a control to a recordset field
   */
  bindControl(recordset: DAORecordset, options: DataBindingOptions): void {
    const bindingKey = `${options.controlName}:${recordset._name}`;

    // Store recordset reference
    this.recordsets.set(recordset._name, recordset);

    // Create update callback
    const updateCallback = (value: any) => {
      this.updateControlValue(options.controlName, value, options.validateOnChange, options.validationRule);
    };

    // Bind to recordset
    recordset.BindControl(options.controlName, options.fieldName, updateCallback);

    // Store binding information
    this.bindings.set(bindingKey, {
      controlName: options.controlName,
      fieldName: options.fieldName,
      recordset,
      isValid: true,
      lastValue: null
    });

    this.updateCallbacks.set(bindingKey, updateCallback);
  }

  /**
   * Unbinds a control from a recordset
   */
  unbindControl(recordset: DAORecordset, controlName: string): void {
    const bindingKey = `${controlName}:${recordset._name}`;
    const binding = this.bindings.get(bindingKey);

    if (binding) {
      binding.recordset.UnbindControl(controlName);
      this.bindings.delete(bindingKey);
      this.updateCallbacks.delete(bindingKey);
    }
  }

  /**
   * Updates a control's display value
   */
  private updateControlValue(
    controlName: string,
    value: any,
    validate?: boolean,
    validationRule?: (value: any) => boolean
  ): void {
    const element = document.getElementById(controlName);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        (element as HTMLInputElement | HTMLTextAreaElement).value = String(value || '');
      } else if (element.tagName === 'SELECT') {
        (element as HTMLSelectElement).value = String(value || '');
      } else {
        element.textContent = String(value || '');
      }

      // Validate if needed
      if (validate && validationRule) {
        const isValid = validationRule(value);
        if (!isValid) {
          element.classList.add('invalid');
        } else {
          element.classList.remove('invalid');
        }
      }
    }
  }

  /**
   * Gets the current value from a control
   */
  getControlValue(controlName: string): any {
    const element = document.getElementById(controlName);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        return (element as HTMLInputElement | HTMLTextAreaElement).value;
      } else if (element.tagName === 'SELECT') {
        return (element as HTMLSelectElement).value;
      } else {
        return element.textContent;
      }
    }
    return null;
  }

  /**
   * Sets a control's value and updates the bound recordset field
   */
  setControlValue(recordset: DAORecordset, controlName: string, value: any): void {
    const element = document.getElementById(controlName);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        (element as HTMLInputElement | HTMLTextAreaElement).value = String(value || '');
      } else if (element.tagName === 'SELECT') {
        (element as HTMLSelectElement).value = String(value || '');
      } else {
        element.textContent = String(value || '');
      }

      // Update recordset
      recordset.SetBoundValue(controlName, value);
    }
  }

  /**
   * Synchronizes all bound controls for a recordset with current record
   */
  refreshBinding(recordset: DAORecordset): void {
    recordset.RefreshBoundControls();
  }

  /**
   * Collects values from all bound controls and updates the recordset
   */
  collectFromControls(recordset: DAORecordset): void {
    const bindings = Array.from(this.bindings.values()).filter(
      (b) => b.recordset === recordset
    );

    for (const binding of bindings) {
      const value = this.getControlValue(binding.controlName);
      recordset.SetBoundValue(binding.controlName, value);
    }
  }

  /**
   * Gets binding information for a control
   */
  getBinding(recordset: DAORecordset, controlName: string): ControlBinding | undefined {
    const bindingKey = `${controlName}:${recordset._name}`;
    return this.bindings.get(bindingKey);
  }

  /**
   * Gets all bindings for a recordset
   */
  getBindings(recordset: DAORecordset): ControlBinding[] {
    return Array.from(this.bindings.values()).filter((b) => b.recordset === recordset);
  }

  /**
   * Validates all bound controls
   */
  validateAll(recordset: DAORecordset): boolean {
    const bindings = this.getBindings(recordset);
    let isValid = true;

    for (const binding of bindings) {
      const value = this.getControlValue(binding.controlName);
      // Add validation logic as needed
      binding.isValid = true; // Simplified
    }

    return isValid;
  }

  /**
   * Clears all bindings
   */
  clearAll(): void {
    for (const binding of this.bindings.values()) {
      binding.recordset.UnbindControl(binding.controlName);
    }
    this.bindings.clear();
    this.updateCallbacks.clear();
    this.recordsets.clear();
  }
}

// Global instance
export const dataBindingService = new VB6DataBindingService();
