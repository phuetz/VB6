/**
 * VB6 Late Binding and CallByName Implementation
 * Provides dynamic method invocation and property access
 */

// CallByName operation types
export enum VbCallType {
  VbGet = 2, // Get property value
  VbLet = 4, // Set property value
  VbSet = 8, // Set object reference
  VbMethod = 1, // Call method
}

// Late binding error types
export class LateBingingError extends Error {
  constructor(
    message: string,
    public memberName?: string,
    public objectType?: string
  ) {
    super(message);
    this.name = 'LateBingingError';
  }
}

// Object metadata cache for performance
class ObjectMetadataCache {
  private static instance: ObjectMetadataCache;
  private cache: Map<any, ObjectMetadata> = new Map();

  static getInstance(): ObjectMetadataCache {
    if (!ObjectMetadataCache.instance) {
      ObjectMetadataCache.instance = new ObjectMetadataCache();
    }
    return ObjectMetadataCache.instance;
  }

  getMetadata(obj: any): ObjectMetadata {
    if (!this.cache.has(obj)) {
      this.cache.set(obj, new ObjectMetadata(obj));
    }
    return this.cache.get(obj)!;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Object metadata for late binding
class ObjectMetadata {
  private properties: Set<string> = new Set();
  private methods: Set<string> = new Set();
  private staticProperties: Set<string> = new Set();
  private staticMethods: Set<string> = new Set();

  constructor(private obj: any) {
    this.analyzeObject();
  }

  private analyzeObject(): void {
    if (!this.obj) return;

    // Analyze instance properties and methods
    let current = this.obj;
    while (current) {
      const descriptors = Object.getOwnPropertyDescriptors(current);

      for (const [name, descriptor] of Object.entries(descriptors)) {
        if (name === 'constructor' || name.startsWith('__')) continue;

        if (typeof descriptor.value === 'function') {
          this.methods.add(name);
        } else if (descriptor.get || descriptor.set || descriptor.value !== undefined) {
          this.properties.add(name);
        }
      }

      current = Object.getPrototypeOf(current);
      if (current === Object.prototype) break;
    }

    // Analyze constructor properties and methods (static)
    if (this.obj.constructor && this.obj.constructor !== Object) {
      const constructorDescriptors = Object.getOwnPropertyDescriptors(this.obj.constructor);

      for (const [name, descriptor] of Object.entries(constructorDescriptors)) {
        if (name === 'length' || name === 'name' || name === 'prototype') continue;

        if (typeof descriptor.value === 'function') {
          this.staticMethods.add(name);
        } else {
          this.staticProperties.add(name);
        }
      }
    }
  }

  hasProperty(name: string): boolean {
    return this.properties.has(name) || this.staticProperties.has(name);
  }

  hasMethod(name: string): boolean {
    return this.methods.has(name) || this.staticMethods.has(name);
  }

  isStatic(name: string): boolean {
    return this.staticProperties.has(name) || this.staticMethods.has(name);
  }
}

// Default property handling for VB6 objects
class DefaultPropertyManager {
  private static instance: DefaultPropertyManager;
  private defaultProperties: Map<string, string> = new Map();

  static getInstance(): DefaultPropertyManager {
    if (!DefaultPropertyManager.instance) {
      DefaultPropertyManager.instance = new DefaultPropertyManager();
    }
    return DefaultPropertyManager.instance;
  }

  // Register default property for a class
  registerDefaultProperty(className: string, propertyName: string): void {
    this.defaultProperties.set(className, propertyName);
  }

  // Get default property for an object
  getDefaultProperty(obj: any): string | null {
    if (!obj || !obj.constructor) return null;

    const className = obj.constructor.name;
    return this.defaultProperties.get(className) || null;
  }

  // Check if object has default property
  hasDefaultProperty(obj: any): boolean {
    return this.getDefaultProperty(obj) !== null;
  }
}

const metadataCache = ObjectMetadataCache.getInstance();
const defaultPropertyManager = DefaultPropertyManager.getInstance();

// Register common VB6 default properties
defaultPropertyManager.registerDefaultProperty('String', 'value');
defaultPropertyManager.registerDefaultProperty('Array', 'item');
defaultPropertyManager.registerDefaultProperty('Collection', 'item');
defaultPropertyManager.registerDefaultProperty('Dictionary', 'item');
defaultPropertyManager.registerDefaultProperty('TextBox', 'Text');
defaultPropertyManager.registerDefaultProperty('Label', 'Caption');
defaultPropertyManager.registerDefaultProperty('CommandButton', 'Caption');

/**
 * CallByName - VB6's dynamic method/property invocation
 * @param obj - Object to call method or access property on
 * @param procName - Name of method or property
 * @param callType - Type of call (VbGet, VbLet, VbSet, VbMethod)
 * @param args - Arguments for method calls or new value for property sets
 */
export function CallByName(obj: any, procName: string, callType: VbCallType, ...args: any[]): any {
  if (!obj) {
    throw new LateBingingError('Object is null or undefined', procName);
  }

  // Convert property name to correct case if needed
  const actualPropName = findActualPropertyName(obj, procName);
  const targetName = actualPropName || procName;

  try {
    switch (callType) {
      case VbCallType.VbGet:
        return getProperty(obj, targetName);

      case VbCallType.VbLet:
        return setProperty(obj, targetName, args[0], false);

      case VbCallType.VbSet:
        return setProperty(obj, targetName, args[0], true);

      case VbCallType.VbMethod:
        return callMethod(obj, targetName, args);

      default:
        throw new LateBingingError(`Invalid call type: ${callType}`, procName);
    }
  } catch (error) {
    if (error instanceof LateBingingError) {
      throw error;
    }

    throw new LateBingingError(
      `Error calling '${procName}': ${error.message}`,
      procName,
      obj.constructor?.name
    );
  }
}

/**
 * Get property value with late binding
 */
function getProperty(obj: any, propName: string): any {
  // Try direct property access
  if (propName in obj) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, propName);
    if (descriptor?.get) {
      return descriptor.get.call(obj);
    }
    return obj[propName];
  }

  // Try prototype chain
  let current = obj;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, propName);
    if (descriptor) {
      if (descriptor.get) {
        return descriptor.get.call(obj);
      }
      return descriptor.value;
    }
    current = Object.getPrototypeOf(current);
    if (current === Object.prototype) break;
  }

  // Try default property if property not found
  const defaultProp = defaultPropertyManager.getDefaultProperty(obj);
  if (defaultProp && defaultProp !== propName) {
    const defaultValue = getProperty(obj, defaultProp);
    if (defaultValue && typeof defaultValue === 'object' && propName in defaultValue) {
      return defaultValue[propName];
    }
  }

  // Property not found
  throw new LateBingingError(`Property '${propName}' not found`, propName, obj.constructor?.name);
}

/**
 * Set property value with late binding
 */
function setProperty(obj: any, propName: string, value: any, isObjectReference: boolean): any {
  // Try direct property access
  if (propName in obj) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, propName);
    if (descriptor?.set) {
      descriptor.set.call(obj, value);
      return value;
    }

    if (descriptor?.writable !== false) {
      obj[propName] = value;
      return value;
    }
  }

  // Try prototype chain for setter
  let current = obj;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, propName);
    if (descriptor?.set) {
      descriptor.set.call(obj, value);
      return value;
    }
    current = Object.getPrototypeOf(current);
    if (current === Object.prototype) break;
  }

  // Try default property if property not found
  const defaultProp = defaultPropertyManager.getDefaultProperty(obj);
  if (defaultProp && defaultProp !== propName) {
    const defaultValue = getProperty(obj, defaultProp);
    if (defaultValue && typeof defaultValue === 'object') {
      defaultValue[propName] = value;
      return value;
    }
  }

  // Create new property if allowed
  if (obj && typeof obj === 'object') {
    obj[propName] = value;
    return value;
  }

  throw new LateBingingError(`Cannot set property '${propName}'`, propName, obj.constructor?.name);
}

/**
 * Call method with late binding
 */
function callMethod(obj: any, methodName: string, args: any[]): any {
  // Try direct method access
  if (methodName in obj && typeof obj[methodName] === 'function') {
    return obj[methodName](...args);
  }

  // Try prototype chain
  let current = obj;
  while (current) {
    if (methodName in current && typeof current[methodName] === 'function') {
      return current[methodName].call(obj, ...args);
    }
    current = Object.getPrototypeOf(current);
    if (current === Object.prototype) break;
  }

  // Try static methods on constructor
  if (obj.constructor && typeof obj.constructor[methodName] === 'function') {
    return obj.constructor[methodName](...args);
  }

  // Method not found
  throw new LateBingingError(`Method '${methodName}' not found`, methodName, obj.constructor?.name);
}

/**
 * Find actual property name with case-insensitive search
 */
function findActualPropertyName(obj: any, propName: string): string | null {
  if (!obj || !propName) return null;

  const lowerPropName = propName.toLowerCase();

  // Check own properties
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (key.toLowerCase() === lowerPropName) {
      return key;
    }
  }

  // Check prototype chain
  let current = Object.getPrototypeOf(obj);
  while (current && current !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(current)) {
      if (key.toLowerCase() === lowerPropName) {
        return key;
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return null;
}

/**
 * Check if object has property or method
 */
export function HasMember(obj: any, memberName: string): boolean {
  if (!obj) return false;

  try {
    const actualName = findActualPropertyName(obj, memberName);
    const targetName = actualName || memberName;

    // Check if property exists
    if (targetName in obj) return true;

    // Check prototype chain
    let current = obj;
    while (current) {
      if (targetName in current) return true;
      current = Object.getPrototypeOf(current);
      if (current === Object.prototype) break;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get all members of an object
 */
export function GetMembers(obj: any): { properties: string[]; methods: string[] } {
  if (!obj) return { properties: [], methods: [] };

  const metadata = metadataCache.getMetadata(obj);

  return {
    properties: Array.from(metadata['properties'] || []),
    methods: Array.from(metadata['methods'] || []),
  };
}

/**
 * Dynamic property access (VB6 style with default properties)
 */
export function GetDynamicProperty(obj: any, ...indices: any[]): any {
  if (!obj) return undefined;

  // If no indices, return the object itself
  if (indices.length === 0) return obj;

  // Try default property first
  const defaultProp = defaultPropertyManager.getDefaultProperty(obj);
  if (defaultProp) {
    const defaultValue = getProperty(obj, defaultProp);
    if (defaultValue) {
      if (indices.length === 1) {
        return defaultValue[indices[0]];
      } else {
        return GetDynamicProperty(defaultValue[indices[0]], ...indices.slice(1));
      }
    }
  }

  // Direct property access
  if (indices.length === 1) {
    return getProperty(obj, indices[0]);
  }

  // Multi-dimensional access
  return GetDynamicProperty(getProperty(obj, indices[0]), ...indices.slice(1));
}

/**
 * Dynamic property assignment
 */
export function SetDynamicProperty(obj: any, value: any, ...indices: any[]): void {
  if (!obj || indices.length === 0) return;

  if (indices.length === 1) {
    setProperty(obj, indices[0], value, false);
    return;
  }

  // Multi-dimensional assignment
  const parentObj = GetDynamicProperty(obj, ...indices.slice(0, -1));
  if (parentObj) {
    setProperty(parentObj, indices[indices.length - 1], value, false);
  }
}

/**
 * TypeOf with late binding support
 */
export function LateBindingTypeOf(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  // Check for VB6 type information
  if (obj.__vb6Type) return obj.__vb6Type;
  if (obj.constructor && obj.constructor.__vb6Type) return obj.constructor.__vb6Type;

  // Standard JavaScript types
  const jsType = typeof obj;
  if (jsType !== 'object') return jsType;

  // Object types
  if (Array.isArray(obj)) return 'array';
  if (obj instanceof Date) return 'date';
  if (obj instanceof RegExp) return 'regexp';

  // Constructor name
  return obj.constructor?.name || 'object';
}

/**
 * IsObject for late binding
 */
export function IsObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object';
}

/**
 * GetRef - get object reference for Set operations
 */
export function GetRef(obj: any, propName: string): any {
  return getProperty(obj, propName);
}

/**
 * SetRef - set object reference
 */
export function SetRef(obj: any, propName: string, value: any): any {
  return setProperty(obj, propName, value, true);
}

// Export the late binding system
export const VB6LateBinding = {
  // Core functions
  CallByName,
  HasMember,
  GetMembers,

  // Dynamic property access
  GetDynamicProperty,
  SetDynamicProperty,

  // Type checking
  LateBindingTypeOf,
  IsObject,

  // Object references
  GetRef,
  SetRef,

  // Default property management
  RegisterDefaultProperty:
    defaultPropertyManager.registerDefaultProperty.bind(defaultPropertyManager),

  // Constants
  VbCallType,

  // Error type
  LateBingingError,
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.VB6LateBinding = VB6LateBinding;

  // Expose individual functions globally for VB6 compatibility
  Object.assign(globalAny, {
    CallByName,
    HasMember,
    GetMembers,
    GetDynamicProperty,
    SetDynamicProperty,
    LateBindingTypeOf,
    IsObject,
    GetRef,
    SetRef,
    VbGet: VbCallType.VbGet,
    VbLet: VbCallType.VbLet,
    VbSet: VbCallType.VbSet,
    VbMethod: VbCallType.VbMethod,
  });
}

export default VB6LateBinding;
