/**
 * VB6 Property System Implementation
 * Provides complete support for Property Get/Let/Set procedures
 */

import { createLogger } from './LoggingService';
import { PropertyValue } from './types/VB6ServiceTypes';

const logger = createLogger('PropertySystem');

export enum VB6PropertyType {
  Get = 'Get',
  Let = 'Let',
  Set = 'Set'
}

export interface VB6PropertyDescriptor {
  name: string;
  className: string;
  propertyType: VB6PropertyType;
  parameters: VB6PropertyParameter[];
  returnType?: string;
  isDefault?: boolean;
  isReadOnly?: boolean;
  isWriteOnly?: boolean;
  documentation?: string;
}

export interface VB6PropertyParameter {
  name: string;
  type: string;
  isOptional?: boolean;
  defaultValue?: PropertyValue;
  isByRef?: boolean;
  isParamArray?: boolean;
}

export interface VB6PropertyValueStore {
  value: PropertyValue;
  type: string;
  isObject: boolean;
  lastModified: Date;
  accessCount: number;
}

/**
 * VB6 Property System Manager
 * Handles property definitions, validation, and runtime management
 */
export class VB6PropertySystem {
  private properties: Map<string, Map<string, VB6PropertyDescriptor[]>> = new Map();
  private propertyValues: Map<string, Map<string, VB6PropertyValue>> = new Map();
  private propertyAccessors: Map<string, Map<string, any>> = new Map();
  private nextInstanceId: number = 1;

  /**
   * Register a property for a class
   */
  registerProperty(className: string, property: VB6PropertyDescriptor): void {
    if (!this.properties.has(className)) {
      this.properties.set(className, new Map<string, VB6PropertyDescriptor[]>());
    }

    const classProperties = this.properties.get(className)!;
    if (!classProperties.has(property.name)) {
      classProperties.set(property.name, []);
    }

    const propertyOverloads = classProperties.get(property.name)!;
    propertyOverloads.push(property);

    logger.debug(`Registered ${property.propertyType} property: ${className}.${property.name}`);
  }

  /**
   * Create a new instance of a class with properties
   */
  createInstance(className: string, instanceId?: string): string {
    const id = instanceId || `${className}_${this.nextInstanceId++}`;
    
    if (!this.propertyValues.has(id)) {
      this.propertyValues.set(id, new Map<string, VB6PropertyValue>());
    }

    if (!this.propertyAccessors.has(id)) {
      this.propertyAccessors.set(id, new Map<string, any>());
    }

    // Initialize default property values
    const classProperties = this.properties.get(className);
    if (classProperties) {
      for (const [propertyName, overloads] of classProperties) {
        // Find Get property to determine initial value
        const getProperty = overloads.find(p => p.propertyType === VB6PropertyType.Get);
        if (getProperty) {
          this.setPropertyValue(id, propertyName, this.getDefaultValue(getProperty.returnType || 'Variant'));
        }
      }
    }

    logger.debug(`Created instance: ${id} of class ${className}`);
    return id;
  }

  /**
   * Get property value (Property Get)
   */
  getProperty(instanceId: string, propertyName: string, ...args: any[]): any {
    const instanceValues = this.propertyValues.get(instanceId);
    if (!instanceValues) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Find the appropriate Property Get procedure
    const className = this.getClassNameFromInstance(instanceId);
    const classProperties = this.properties.get(className);
    if (!classProperties || !classProperties.has(propertyName)) {
      throw new Error(`Property '${propertyName}' not found in class '${className}'`);
    }

    const propertyOverloads = classProperties.get(propertyName)!;
    const getProperty = propertyOverloads.find(p => 
      p.propertyType === VB6PropertyType.Get && 
      this.matchParameters(p.parameters, args)
    );

    if (!getProperty) {
      throw new Error(`Property Get '${propertyName}' not found or parameter mismatch`);
    }

    // Check if there's a custom accessor
    const instanceAccessors = this.propertyAccessors.get(instanceId);
    const accessorKey = `${propertyName}_Get`;
    
    if (instanceAccessors && instanceAccessors.has(accessorKey)) {
      const accessor = instanceAccessors.get(accessorKey);
      return accessor(...args);
    }

    // Default behavior - return stored value
    const key = this.getPropertyKey(propertyName, args);
    const propertyValue = instanceValues.get(key);
    
    if (propertyValue) {
      propertyValue.accessCount++;
      return propertyValue.value;
    }

    return this.getDefaultValue(getProperty.returnType || 'Variant');
  }

  /**
   * Set property value (Property Let for value types)
   */
  letProperty(instanceId: string, propertyName: string, value: any, ...args: any[]): void {
    const instanceValues = this.propertyValues.get(instanceId);
    if (!instanceValues) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Find the appropriate Property Let procedure
    const className = this.getClassNameFromInstance(instanceId);
    const classProperties = this.properties.get(className);
    if (!classProperties || !classProperties.has(propertyName)) {
      throw new Error(`Property '${propertyName}' not found in class '${className}'`);
    }

    const propertyOverloads = classProperties.get(propertyName)!;
    const letProperty = propertyOverloads.find(p => 
      p.propertyType === VB6PropertyType.Let && 
      this.matchLetSetParameters(p.parameters, args)
    );

    if (!letProperty) {
      throw new Error(`Property Let '${propertyName}' not found or parameter mismatch`);
    }

    if (letProperty.isReadOnly) {
      throw new Error(`Property '${propertyName}' is read-only`);
    }

    // Check if there's a custom accessor
    const instanceAccessors = this.propertyAccessors.get(instanceId);
    const accessorKey = `${propertyName}_Let`;
    
    if (instanceAccessors && instanceAccessors.has(accessorKey)) {
      const accessor = instanceAccessors.get(accessorKey);
      accessor(value, ...args);
      return;
    }

    // Default behavior - store value
    this.setPropertyValue(instanceId, propertyName, value, args);
  }

  /**
   * Set property object reference (Property Set for object types)
   */
  setProperty(instanceId: string, propertyName: string, objectRef: any, ...args: any[]): void {
    const instanceValues = this.propertyValues.get(instanceId);
    if (!instanceValues) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Find the appropriate Property Set procedure
    const className = this.getClassNameFromInstance(instanceId);
    const classProperties = this.properties.get(className);
    if (!classProperties || !classProperties.has(propertyName)) {
      throw new Error(`Property '${propertyName}' not found in class '${className}'`);
    }

    const propertyOverloads = classProperties.get(propertyName)!;
    const setProperty = propertyOverloads.find(p => 
      p.propertyType === VB6PropertyType.Set && 
      this.matchLetSetParameters(p.parameters, args)
    );

    if (!setProperty) {
      throw new Error(`Property Set '${propertyName}' not found or parameter mismatch`);
    }

    if (setProperty.isReadOnly) {
      throw new Error(`Property '${propertyName}' is read-only`);
    }

    // Check if there's a custom accessor
    const instanceAccessors = this.propertyAccessors.get(instanceId);
    const accessorKey = `${propertyName}_Set`;
    
    if (instanceAccessors && instanceAccessors.has(accessorKey)) {
      const accessor = instanceAccessors.get(accessorKey);
      accessor(objectRef, ...args);
      return;
    }

    // Default behavior - store object reference
    this.setPropertyValue(instanceId, propertyName, objectRef, args, true);
  }

  /**
   * Register a custom property accessor function
   */
  registerPropertyAccessor(instanceId: string, propertyName: string, 
                          propertyType: VB6PropertyType, accessor: (...args: any[]) => any): void {
    const instanceAccessors = this.propertyAccessors.get(instanceId);
    if (!instanceAccessors) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    const accessorKey = `${propertyName}_${propertyType}`;
    instanceAccessors.set(accessorKey, accessor);
  }

  /**
   * Check if a property exists for a class
   */
  hasProperty(className: string, propertyName: string, propertyType?: VB6PropertyType): boolean {
    const classProperties = this.properties.get(className);
    if (!classProperties || !classProperties.has(propertyName)) {
      return false;
    }

    if (propertyType) {
      const propertyOverloads = classProperties.get(propertyName)!;
      return propertyOverloads.some(p => p.propertyType === propertyType);
    }

    return true;
  }

  /**
   * Get all properties for a class
   */
  getClassProperties(className: string): VB6PropertyDescriptor[] {
    const classProperties = this.properties.get(className);
    if (!classProperties) {
      return [];
    }

    const allProperties: VB6PropertyDescriptor[] = [];
    for (const overloads of classProperties.values()) {
      allProperties.push(...overloads);
    }

    return allProperties;
  }

  /**
   * Get property information
   */
  getPropertyInfo(className: string, propertyName: string): VB6PropertyDescriptor[] {
    const classProperties = this.properties.get(className);
    if (!classProperties || !classProperties.has(propertyName)) {
      return [];
    }

    return [...classProperties.get(propertyName)!];
  }

  /**
   * Validate property assignment
   */
  validatePropertyAssignment(className: string, propertyName: string, 
                           value: any, isObjectAssignment: boolean = false): boolean {
    const propertyInfo = this.getPropertyInfo(className, propertyName);
    
    const targetPropertyType = isObjectAssignment ? VB6PropertyType.Set : VB6PropertyType.Let;
    const property = propertyInfo.find(p => p.propertyType === targetPropertyType);
    
    if (!property) {
      return false;
    }

    if (property.isReadOnly) {
      return false;
    }

    // Type validation would go here
    return true;
  }

  /**
   * Get default value for a VB6 type
   */
  private getDefaultValue(type: string): any {
    switch (type.toLowerCase()) {
      case 'string':
        return '';
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
        return 0;
      case 'boolean':
        return false;
      case 'date':
        return new Date(1899, 11, 30); // VB6 date zero
      case 'variant':
      case 'object':
        return null;
      default:
        return null;
    }
  }

  /**
   * Check if parameters match a property signature (for Property Get)
   */
  private matchParameters(expectedParams: VB6PropertyParameter[], actualArgs: any[]): boolean {
    const requiredParams = expectedParams.filter(p => !p.isOptional);
    const actualParamCount = actualArgs.length;
    const expectedParamCount = expectedParams.length;
    
    // If no parameters expected and none provided, it's a match
    if (expectedParamCount === 0 && actualParamCount === 0) {
      return true;
    }
    
    // For Property Get, match exact parameter count
    const minRequired = requiredParams.length;
    const maxAllowed = expectedParamCount;
    
    // Check minimum required parameters
    if (actualParamCount < minRequired) {
      return false;
    }

    // Check maximum allowed parameters (unless ParamArray is used)
    if (actualParamCount > maxAllowed && !expectedParams.some(p => p.isParamArray)) {
      return false;
    }

    return true;
  }

  /**
   * Check if parameters match a Property Let/Set signature
   * For Let/Set, the last parameter is the value being assigned and is handled separately
   */
  private matchLetSetParameters(expectedParams: VB6PropertyParameter[], actualArgs: any[]): boolean {
    // For Property Let/Set, exclude the value parameter from matching
    const propertyParams = expectedParams.slice(0, -1); // Remove last parameter (the value)
    const actualParamCount = actualArgs.length;
    const expectedParamCount = propertyParams.length;
    
    // If no property parameters expected and none provided, it's a match
    if (expectedParamCount === 0 && actualParamCount === 0) {
      return true;
    }
    
    const requiredParams = propertyParams.filter(p => !p.isOptional);
    const minRequired = requiredParams.length;
    const maxAllowed = expectedParamCount;
    
    // Check minimum required parameters
    if (actualParamCount < minRequired) {
      return false;
    }

    // Check maximum allowed parameters (unless ParamArray is used)
    if (actualParamCount > maxAllowed && !propertyParams.some(p => p.isParamArray)) {
      return false;
    }

    return true;
  }

  /**
   * Set property value with type information
   */
  private setPropertyValue(instanceId: string, propertyName: string, 
                          value: any, args: any[] = [], isObject: boolean = false): void {
    const instanceValues = this.propertyValues.get(instanceId)!;
    const key = this.getPropertyKey(propertyName, args);
    
    const propertyValue: VB6PropertyValue = {
      value,
      type: this.getValueType(value),
      isObject,
      lastModified: new Date(),
      accessCount: 0
    };

    instanceValues.set(key, propertyValue);
  }

  /**
   * Generate property key for indexed properties
   */
  private getPropertyKey(propertyName: string, args: any[] = []): string {
    if (args.length === 0) {
      return propertyName;
    }
    
    const argString = args.map(arg => String(arg)).join(',');
    return `${propertyName}[${argString}]`;
  }

  /**
   * Get VB6 type name for a value
   */
  private getValueType(value: any): string {
    if (value === null || value === undefined) {
      return 'Nothing';
    }

    switch (typeof value) {
      case 'string':
        return 'String';
      case 'number':
        if (Number.isInteger(value)) {
          if (value >= -32768 && value <= 32767) return 'Integer';
          return 'Long';
        }
        return 'Double';
      case 'boolean':
        return 'Boolean';
      case 'object':
        if (value instanceof Date) return 'Date';
        if (Array.isArray(value)) return 'Array';
        return 'Object';
      default:
        return 'Variant';
    }
  }

  /**
   * Extract class name from instance ID
   */
  private getClassNameFromInstance(instanceId: string): string {
    const parts = instanceId.split('_');
    return parts[0];
  }

  /**
   * Remove instance and cleanup
   */
  destroyInstance(instanceId: string): void {
    this.propertyValues.delete(instanceId);
    this.propertyAccessors.delete(instanceId);
    logger.debug(`Destroyed instance: ${instanceId}`);
  }

  /**
   * Get instance statistics
   */
  getInstanceStats(instanceId: string): any {
    const instanceValues = this.propertyValues.get(instanceId);
    if (!instanceValues) {
      return null;
    }

    const stats = {
      instanceId,
      propertyCount: instanceValues.size,
      totalAccesses: 0,
      properties: [] as any[]
    };

    for (const [key, value] of instanceValues) {
      stats.totalAccesses += value.accessCount;
      stats.properties.push({
        name: key,
        type: value.type,
        isObject: value.isObject,
        accessCount: value.accessCount,
        lastModified: value.lastModified
      });
    }

    return stats;
  }
}

// Singleton instance
export const vb6PropertySystem = new VB6PropertySystem();

// Export helper functions for easier VB6 compatibility
export function Property(target: any, propertyName: string): PropertyDescriptor {
  return {
    get() {
      const instanceId = this._vb6InstanceId || 'default';
      return vb6PropertySystem.getProperty(instanceId, propertyName);
    },
    set(value: any) {
      const instanceId = this._vb6InstanceId || 'default';
      if (typeof value === 'object' && value !== null) {
        vb6PropertySystem.setProperty(instanceId, propertyName, value);
      } else {
        vb6PropertySystem.letProperty(instanceId, propertyName, value);
      }
    },
    enumerable: true,
    configurable: true
  };
}

export default vb6PropertySystem;