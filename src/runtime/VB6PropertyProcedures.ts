/**
 * VB6 Property Procedures Implementation
 * Complete support for Property Get, Let, and Set procedures
 */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export type PropertyAccessType = 'Get' | 'Let' | 'Set';

export interface VB6PropertyDescriptor {
  name: string;
  type: 'Get' | 'Let' | 'Set';
  dataType?: string;
  parameters?: VB6PropertyParameter[];
  isPublic?: boolean;
  isPrivate?: boolean;
  isFriend?: boolean;
  isStatic?: boolean;
  getter?: (...args: any[]) => any;
  setter?: (...args: any[]) => any;
  objectSetter?: (...args: any[]) => any;
}

export interface VB6PropertyParameter {
  name: string;
  type: string;
  byRef?: boolean;
  optional?: boolean;
  defaultValue?: any;
  paramArray?: boolean;
}

/**
 * VB6 Property Manager
 * Manages Property Get/Let/Set procedures for classes and forms
 */
export class VB6PropertyManager {
  private properties = new Map<string, Map<string, VB6PropertyDescriptor>>();
  private propertyValues = new Map<string, Map<string, any>>();
  private propertyHandlers = new Map<string, Map<PropertyAccessType, Function>>();
  
  /**
   * Define a Property Get procedure
   */
  definePropertyGet(
    className: string,
    propertyName: string,
    getter: Function,
    dataType?: string,
    parameters?: VB6PropertyParameter[]
  ): void {
    this.ensureClassMap(className);
    
    const propertyMap = this.properties.get(className)!;
    const existing = propertyMap.get(propertyName) || {} as VB6PropertyDescriptor;
    
    propertyMap.set(propertyName, {
      ...existing,
      name: propertyName,
      type: 'Get',
      dataType,
      parameters,
      getter
    });
    
    // Register handler
    this.registerHandler(className, propertyName, 'Get', getter);
  }
  
  /**
   * Define a Property Let procedure (for value types)
   */
  definePropertyLet(
    className: string,
    propertyName: string,
    setter: Function,
    dataType?: string,
    parameters?: VB6PropertyParameter[]
  ): void {
    this.ensureClassMap(className);
    
    const propertyMap = this.properties.get(className)!;
    const existing = propertyMap.get(propertyName) || {} as VB6PropertyDescriptor;
    
    propertyMap.set(propertyName, {
      ...existing,
      name: propertyName,
      type: 'Let',
      dataType,
      parameters,
      setter
    });
    
    // Register handler
    this.registerHandler(className, propertyName, 'Let', setter);
  }
  
  /**
   * Define a Property Set procedure (for object types)
   */
  definePropertySet(
    className: string,
    propertyName: string,
    objectSetter: Function,
    dataType?: string,
    parameters?: VB6PropertyParameter[]
  ): void {
    this.ensureClassMap(className);
    
    const propertyMap = this.properties.get(className)!;
    const existing = propertyMap.get(propertyName) || {} as VB6PropertyDescriptor;
    
    propertyMap.set(propertyName, {
      ...existing,
      name: propertyName,
      type: 'Set',
      dataType,
      parameters,
      objectSetter
    });
    
    // Register handler
    this.registerHandler(className, propertyName, 'Set', objectSetter);
  }
  
  /**
   * Get property value
   */
  getProperty(instance: any, className: string, propertyName: string, ...args: any[]): any {
    const handler = this.getHandler(className, propertyName, 'Get');
    
    if (handler) {
      return handler.call(instance, ...args);
    }
    
    // Fallback to stored value
    const classValues = this.propertyValues.get(className);
    if (classValues) {
      return classValues.get(propertyName);
    }
    
    return undefined;
  }
  
  /**
   * Set property value (Let)
   */
  letProperty(instance: any, className: string, propertyName: string, value: any, ...args: any[]): void {
    const handler = this.getHandler(className, propertyName, 'Let');
    
    if (handler) {
      handler.call(instance, ...args, value);
    } else {
      // Store value directly
      this.ensureValueMap(className);
      this.propertyValues.get(className)!.set(propertyName, value);
    }
  }
  
  /**
   * Set property object (Set)
   */
  setProperty(instance: any, className: string, propertyName: string, object: any, ...args: any[]): void {
    const handler = this.getHandler(className, propertyName, 'Set');
    
    if (handler) {
      handler.call(instance, ...args, object);
    } else {
      // Store object reference
      this.ensureValueMap(className);
      this.propertyValues.get(className)!.set(propertyName, object);
    }
  }
  
  /**
   * Create property accessors for a class
   */
  createPropertyAccessors(target: any, className: string): void {
    const properties = this.properties.get(className);
    if (!properties) return;
    
    properties.forEach((descriptor, propertyName) => {
      Object.defineProperty(target, propertyName, {
        get: () => {
          return this.getProperty(target, className, propertyName);
        },
        set: (value: any) => {
          if (typeof value === 'object' && value !== null) {
            this.setProperty(target, className, propertyName, value);
          } else {
            this.letProperty(target, className, propertyName, value);
          }
        },
        enumerable: true,
        configurable: true
      });
    });
  }
  
  private ensureClassMap(className: string): void {
    if (!this.properties.has(className)) {
      this.properties.set(className, new Map());
    }
    if (!this.propertyHandlers.has(className)) {
      this.propertyHandlers.set(className, new Map());
    }
  }
  
  private ensureValueMap(className: string): void {
    if (!this.propertyValues.has(className)) {
      this.propertyValues.set(className, new Map());
    }
  }
  
  private registerHandler(className: string, propertyName: string, type: PropertyAccessType, handler: Function): void {
    const key = `${propertyName}_${type}`;
    this.propertyHandlers.get(className)!.set(type, handler);
  }
  
  private getHandler(className: string, propertyName: string, type: PropertyAccessType): Function | undefined {
    const classHandlers = this.propertyHandlers.get(className);
    if (!classHandlers) return undefined;
    
    return classHandlers.get(type);
  }
}

// Global instance
export const PropertyManager = new VB6PropertyManager();

/**
 * Decorator for Property Get
 */
export function PropertyGet(dataType?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;
    PropertyManager.definePropertyGet(className, propertyKey, descriptor.get!, dataType);
    return descriptor;
  };
}

/**
 * Decorator for Property Let
 */
export function PropertyLet(dataType?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;
    PropertyManager.definePropertyLet(className, propertyKey, descriptor.set!, dataType);
    return descriptor;
  };
}

/**
 * Decorator for Property Set
 */
export function PropertySet(dataType?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;
    PropertyManager.definePropertySet(className, propertyKey, descriptor.set!, dataType);
    return descriptor;
  };
}

/**
 * Example VB6 Class with Properties
 */
export class VB6Class {
  private _name: string = '';
  private _value: number = 0;
  private _object: any = null;
  
  // Property Get Name() As String
  @PropertyGet('String')
  get Name(): string {
    return this._name;
  }
  
  // Property Let Name(ByVal value As String)
  @PropertyLet('String')
  set Name(value: string) {
    this._name = value;
  }
  
  // Property Get Value() As Long
  @PropertyGet('Long')
  get Value(): number {
    return this._value;
  }
  
  // Property Let Value(ByVal value As Long)
  @PropertyLet('Long')
  set Value(value: number) {
    if (value < 0) {
      throw new Error('Value must be positive');
    }
    this._value = value;
  }
  
  // Property Get Object() As Object
  @PropertyGet('Object')
  get Object(): any {
    return this._object;
  }
  
  // Property Set Object(ByVal obj As Object)
  @PropertySet('Object')
  set Object(obj: any) {
    this._object = obj;
  }
}

/**
 * Support for indexed properties (with parameters)
 */
export class IndexedPropertySupport {
  private indexedValues = new Map<string, any>();
  
  /**
   * Property Get Item(index As Long) As Variant
   */
  getItem(index: number): any {
    return this.indexedValues.get(String(index));
  }
  
  /**
   * Property Let Item(index As Long, value As Variant)
   */
  letItem(index: number, value: any): void {
    this.indexedValues.set(String(index), value);
  }
  
  /**
   * Property Set Item(index As Long, obj As Object)
   */
  setItem(index: number, obj: any): void {
    this.indexedValues.set(String(index), obj);
  }
}