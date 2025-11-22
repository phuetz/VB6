/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * VB6 User Defined Types (UDTs) Implementation
 * Complete support for Type declarations and structured data
 */

// Field descriptor for UDT fields
export interface UDTFieldDescriptor {
  name: string;
  type: string;
  size?: number;           // For fixed-length strings
  dimensions?: number[];    // For arrays
  isArray?: boolean;
  isFixedString?: boolean;
  isUDT?: boolean;
  udtTypeName?: string;
  defaultValue?: any;
}

// UDT definition
export interface UDTDefinition {
  name: string;
  fields: UDTFieldDescriptor[];
  size?: number;            // Total size in bytes
  alignment?: number;       // Memory alignment
  isPublic?: boolean;
}

// Fixed-length string implementation
export class VB6FixedString {
  private _value: string;
  private _length: number;
  
  constructor(length: number, initialValue: string = '') {
    this._length = length;
    this._value = this.padOrTruncate(initialValue);
  }
  
  get value(): string {
    return this._value;
  }
  
  set value(newValue: string) {
    this._value = this.padOrTruncate(newValue);
  }
  
  get length(): number {
    return this._length;
  }
  
  private padOrTruncate(str: string): string {
    if (str.length > this._length) {
      return str.substring(0, this._length);
    } else if (str.length < this._length) {
      return str.padEnd(this._length, ' ');
    }
    return str;
  }
  
  toString(): string {
    return this._value;
  }
  
  trimmed(): string {
    return this._value.trimEnd();
  }
}

/**
 * VB6 UDT Registry
 * Manages Type definitions and instances
 */
export class VB6UDTRegistry {
  private static instance: VB6UDTRegistry;
  private typeDefinitions = new Map<string, UDTDefinition>();
  private typeConstructors = new Map<string, Function>();
  
  private constructor() {
    this.registerBuiltInTypes();
  }
  
  static getInstance(): VB6UDTRegistry {
    if (!VB6UDTRegistry.instance) {
      VB6UDTRegistry.instance = new VB6UDTRegistry();
    }
    return VB6UDTRegistry.instance;
  }
  
  /**
   * Register a User Defined Type
   */
  registerType(definition: UDTDefinition): void {
    this.typeDefinitions.set(definition.name, definition);
    
    // Create constructor function
    const constructor = this.createTypeConstructor(definition);
    this.typeConstructors.set(definition.name, constructor);
    
    console.log(`[VB6 UDT] Registered type: ${definition.name}`);
  }
  
  /**
   * Create an instance of a UDT
   */
  createInstance(typeName: string, initialValues?: any): any {
    const constructor = this.typeConstructors.get(typeName);
    if (!constructor) {
      throw new Error(`Type '${typeName}' is not defined`);
    }
    
    const instance = new (constructor as any)();
    
    // Set initial values if provided
    if (initialValues) {
      Object.assign(instance, initialValues);
    }
    
    return instance;
  }
  
  /**
   * Create an array of UDT instances
   */
  createArray(typeName: string, dimensions: number[]): any {
    const definition = this.typeDefinitions.get(typeName);
    if (!definition) {
      throw new Error(`Type '${typeName}' is not defined`);
    }
    
    return this.createMultiDimensionalArray(dimensions, () => {
      return this.createInstance(typeName);
    });
  }
  
  /**
   * Get type definition
   */
  getTypeDefinition(typeName: string): UDTDefinition | undefined {
    return this.typeDefinitions.get(typeName);
  }
  
  /**
   * Check if type exists
   */
  hasType(typeName: string): boolean {
    return this.typeDefinitions.has(typeName);
  }
  
  /**
   * Copy UDT instance (deep copy)
   */
  copyInstance(source: any, typeName?: string): any {
    if (!typeName) {
      typeName = source.constructor.name;
    }
    
    const definition = this.typeDefinitions.get(typeName);
    if (!definition) {
      throw new Error(`Type '${typeName}' is not defined`);
    }
    
    const copy = this.createInstance(typeName);
    
    definition.fields.forEach(field => {
      if (field.isArray) {
        copy[field.name] = this.copyArray(source[field.name]);
      } else if (field.isUDT) {
        copy[field.name] = this.copyInstance(source[field.name], field.udtTypeName);
      } else if (field.isFixedString) {
        copy[field.name] = new VB6FixedString(field.size!, source[field.name].value);
      } else {
        copy[field.name] = source[field.name];
      }
    });
    
    return copy;
  }
  
  /**
   * Compare two UDT instances
   */
  compareInstances(a: any, b: any, typeName?: string): boolean {
    if (!typeName) {
      typeName = a.constructor.name;
    }
    
    const definition = this.typeDefinitions.get(typeName);
    if (!definition) {
      return false;
    }
    
    for (const field of definition.fields) {
      if (field.isArray) {
        if (!this.compareArrays(a[field.name], b[field.name])) {
          return false;
        }
      } else if (field.isUDT) {
        if (!this.compareInstances(a[field.name], b[field.name], field.udtTypeName)) {
          return false;
        }
      } else if (field.isFixedString) {
        if (a[field.name].value !== b[field.name].value) {
          return false;
        }
      } else {
        if (a[field.name] !== b[field.name]) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Calculate size of UDT in bytes
   */
  calculateSize(typeName: string): number {
    const definition = this.typeDefinitions.get(typeName);
    if (!definition) {
      return 0;
    }
    
    let size = 0;
    
    definition.fields.forEach(field => {
      size += this.getFieldSize(field);
    });
    
    return size;
  }
  
  private createTypeConstructor(definition: UDTDefinition): Function {
    const fields = definition.fields;
    
    // Create constructor function
    function UDTConstructor(this: any) {
      // Initialize each field
      fields.forEach(field => {
        if (field.isArray && field.dimensions) {
          this[field.name] = VB6UDTRegistry.getInstance().createMultiDimensionalArray(
            field.dimensions,
            () => VB6UDTRegistry.getInstance().getDefaultValue(field)
          );
        } else if (field.isFixedString) {
          this[field.name] = new VB6FixedString(field.size || 255, '');
        } else if (field.isUDT && field.udtTypeName) {
          this[field.name] = VB6UDTRegistry.getInstance().createInstance(field.udtTypeName);
        } else {
          this[field.name] = VB6UDTRegistry.getInstance().getDefaultValue(field);
        }
      });
      
      // Add type metadata
      Object.defineProperty(this, '__typeName', {
        value: definition.name,
        writable: false,
        enumerable: false
      });
    }
    
    // Set constructor name
    Object.defineProperty(UDTConstructor, 'name', {
      value: definition.name,
      writable: false
    });
    
    return UDTConstructor;
  }
  
  private createMultiDimensionalArray(dimensions: number[], creator: () => any): any {
    if (dimensions.length === 0) {
      return creator();
    }
    
    const [size, ...rest] = dimensions;
    const array = new Array(size);
    
    for (let i = 0; i < size; i++) {
      if (rest.length > 0) {
        array[i] = this.createMultiDimensionalArray(rest, creator);
      } else {
        array[i] = creator();
      }
    }
    
    return array;
  }
  
  private copyArray(source: any[]): any[] {
    if (!Array.isArray(source)) {
      return source;
    }
    
    return source.map(item => {
      if (Array.isArray(item)) {
        return this.copyArray(item);
      } else if (typeof item === 'object' && item !== null) {
        if (item instanceof VB6FixedString) {
          return new VB6FixedString(item.length, item.value);
        } else if (item.__typeName) {
          return this.copyInstance(item, item.__typeName);
        }
      }
      return item;
    });
  }
  
  private compareArrays(a: any[], b: any[]): boolean {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return a === b;
    }
    
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      if (Array.isArray(a[i])) {
        if (!this.compareArrays(a[i], b[i])) {
          return false;
        }
      } else if (typeof a[i] === 'object' && a[i] !== null) {
        if (a[i] instanceof VB6FixedString) {
          if (a[i].value !== b[i].value) {
            return false;
          }
        } else if (a[i].__typeName) {
          if (!this.compareInstances(a[i], b[i], a[i].__typeName)) {
            return false;
          }
        }
      } else if (a[i] !== b[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  private getDefaultValue(field: UDTFieldDescriptor): any {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }
    
    switch (field.type.toLowerCase()) {
      case 'boolean':
        return false;
      case 'byte':
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
        return 0;
      case 'date':
        return new Date(0);
      case 'string':
        return '';
      case 'variant':
      case 'object':
        return null;
      default:
        return null;
    }
  }
  
  private getFieldSize(field: UDTFieldDescriptor): number {
    let baseSize = 0;
    
    switch (field.type.toLowerCase()) {
      case 'boolean':
      case 'byte':
        baseSize = 1;
        break;
      case 'integer':
        baseSize = 2;
        break;
      case 'long':
      case 'single':
        baseSize = 4;
        break;
      case 'double':
      case 'currency':
      case 'date':
        baseSize = 8;
        break;
      case 'string':
        if (field.isFixedString) {
          baseSize = field.size || 255;
        } else {
          baseSize = 4; // Pointer size
        }
        break;
      case 'variant':
        baseSize = 16;
        break;
      case 'object':
        baseSize = 4; // Pointer size
        break;
      default:
        if (field.isUDT && field.udtTypeName) {
          baseSize = this.calculateSize(field.udtTypeName);
        }
    }
    
    // Calculate array size
    if (field.isArray && field.dimensions) {
      const totalElements = field.dimensions.reduce((a, b) => a * b, 1);
      baseSize *= totalElements;
    }
    
    return baseSize;
  }
  
  private registerBuiltInTypes(): void {
    // Register SYSTEMTIME (Windows API)
    this.registerType({
      name: 'SYSTEMTIME',
      fields: [
        { name: 'wYear', type: 'Integer' },
        { name: 'wMonth', type: 'Integer' },
        { name: 'wDayOfWeek', type: 'Integer' },
        { name: 'wDay', type: 'Integer' },
        { name: 'wHour', type: 'Integer' },
        { name: 'wMinute', type: 'Integer' },
        { name: 'wSecond', type: 'Integer' },
        { name: 'wMilliseconds', type: 'Integer' }
      ]
    });
    
    // Register RECT (Windows API)
    this.registerType({
      name: 'RECT',
      fields: [
        { name: 'Left', type: 'Long' },
        { name: 'Top', type: 'Long' },
        { name: 'Right', type: 'Long' },
        { name: 'Bottom', type: 'Long' }
      ]
    });
    
    // Register POINT (Windows API)
    this.registerType({
      name: 'POINT',
      fields: [
        { name: 'X', type: 'Long' },
        { name: 'Y', type: 'Long' }
      ]
    });
    
    // Register SIZE (Windows API)
    this.registerType({
      name: 'SIZE',
      fields: [
        { name: 'cx', type: 'Long' },
        { name: 'cy', type: 'Long' }
      ]
    });
    
    // Register FILETIME (Windows API)
    this.registerType({
      name: 'FILETIME',
      fields: [
        { name: 'dwLowDateTime', type: 'Long' },
        { name: 'dwHighDateTime', type: 'Long' }
      ]
    });
  }
}

// Global instance
export const UDTRegistry = VB6UDTRegistry.getInstance();

/**
 * Helper function to define a UDT
 */
export function DefineType(
  name: string,
  fields: UDTFieldDescriptor[],
  isPublic: boolean = true
): void {
  UDTRegistry.registerType({
    name,
    fields,
    isPublic
  });
}

/**
 * Helper function to create UDT instance
 */
export function CreateUDT(typeName: string, initialValues?: any): any {
  return UDTRegistry.createInstance(typeName, initialValues);
}

/**
 * Helper function to create UDT array
 */
export function CreateUDTArray(typeName: string, ...dimensions: number[]): any {
  return UDTRegistry.createArray(typeName, dimensions);
}

/**
 * Helper function to create fixed-length string
 */
export function FixedString(length: number, initialValue: string = ''): VB6FixedString {
  return new VB6FixedString(length, initialValue);
}

/**
 * Example VB6 UDT Definitions
 */

// Example: Employee Type
DefineType('Employee', [
  { name: 'ID', type: 'Long' },
  { name: 'Name', type: 'String', isFixedString: true, size: 50 },
  { name: 'Department', type: 'String', isFixedString: true, size: 30 },
  { name: 'Salary', type: 'Currency' },
  { name: 'HireDate', type: 'Date' },
  { name: 'IsActive', type: 'Boolean' }
]);

// Example: Customer Type with nested Address
DefineType('Address', [
  { name: 'Street', type: 'String', isFixedString: true, size: 100 },
  { name: 'City', type: 'String', isFixedString: true, size: 50 },
  { name: 'State', type: 'String', isFixedString: true, size: 2 },
  { name: 'ZipCode', type: 'String', isFixedString: true, size: 10 },
  { name: 'Country', type: 'String', isFixedString: true, size: 50 }
]);

DefineType('Customer', [
  { name: 'CustomerID', type: 'Long' },
  { name: 'CompanyName', type: 'String', isFixedString: true, size: 100 },
  { name: 'ContactName', type: 'String', isFixedString: true, size: 50 },
  { name: 'BillingAddress', type: 'Address', isUDT: true, udtTypeName: 'Address' },
  { name: 'ShippingAddress', type: 'Address', isUDT: true, udtTypeName: 'Address' },
  { name: 'CreditLimit', type: 'Currency' },
  { name: 'Orders', type: 'Long', isArray: true, dimensions: [100] }
]);

// Example: Matrix Type with 2D array
DefineType('Matrix3x3', [
  { name: 'Values', type: 'Double', isArray: true, dimensions: [3, 3] },
  { name: 'Determinant', type: 'Double' }
]);

// Example: File Record Type
DefineType('FileRecord', [
  { name: 'RecordNumber', type: 'Long' },
  { name: 'FileName', type: 'String', isFixedString: true, size: 255 },
  { name: 'FileSize', type: 'Long' },
  { name: 'CreatedDate', type: 'Date' },
  { name: 'ModifiedDate', type: 'Date' },
  { name: 'Attributes', type: 'Byte', isArray: true, dimensions: [16] },
  { name: 'Checksum', type: 'Long' }
]);

/**
 * Example usage class
 */
export class VB6TypeExample {
  // Declare UDT variables
  private employee: any;
  private employees: any[];
  private customer: any;
  private matrix: any;
  
  constructor() {
    // Create instances
    this.employee = CreateUDT('Employee', {
      ID: 1001,
      Name: new VB6FixedString(50, 'John Doe'),
      Department: new VB6FixedString(30, 'Engineering'),
      Salary: 75000,
      HireDate: new Date('2020-01-15'),
      IsActive: true
    });
    
    // Create array of employees
    this.employees = CreateUDTArray('Employee', 10);
    
    // Create customer with nested address
    this.customer = CreateUDT('Customer');
    this.customer.CustomerID = 5001;
    this.customer.CompanyName = new VB6FixedString(100, 'Acme Corp');
    this.customer.BillingAddress.Street = new VB6FixedString(100, '123 Main St');
    this.customer.BillingAddress.City = new VB6FixedString(50, 'New York');
    
    // Create matrix
    this.matrix = CreateUDT('Matrix3x3');
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.matrix.Values[i][j] = i * 3 + j;
      }
    }
  }
  
  // Example methods using UDTs
  getEmployeeInfo(): string {
    return `Employee: ${this.employee.Name.trimmed()} (ID: ${this.employee.ID})`;
  }
  
  copyEmployee(): any {
    return UDTRegistry.copyInstance(this.employee, 'Employee');
  }
  
  compareEmployees(emp1: any, emp2: any): boolean {
    return UDTRegistry.compareInstances(emp1, emp2, 'Employee');
  }
}

// Export all UDT functionality
export const VB6UDT = {
  VB6FixedString,
  VB6UDTRegistry,
  UDTRegistry,
  DefineType,
  CreateUDT,
  CreateUDTArray,
  FixedString,
  VB6TypeExample
};