/**
 * VB6 Implements Interface Support
 * Complete implementation of interface inheritance and contract enforcement
 */

// Interface member types
export enum InterfaceMemberType {
  Property = 'property',
  Method = 'method',
  Event = 'event'
}

// Interface member descriptor
export interface InterfaceMember {
  name: string;
  type: InterfaceMemberType;
  signature?: string;
  parameters?: InterfaceParameter[];
  returnType?: string;
  propertyType?: 'Get' | 'Let' | 'Set';
  isOptional?: boolean;
}

// Interface parameter
export interface InterfaceParameter {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: any;
  byRef?: boolean;
}

// Interface definition
export interface InterfaceDefinition {
  name: string;
  members: InterfaceMember[];
  extends?: string[];
  guid?: string;
  version?: string;
}

/**
 * VB6 Interface Registry
 * Manages interface definitions and implementations
 */
export class VB6InterfaceRegistry {
  private static instance: VB6InterfaceRegistry;
  private interfaces = new Map<string, InterfaceDefinition>();
  private implementations = new Map<string, Set<string>>();
  private interfaceProxies = new Map<string, any>();
  
  private constructor() {
    this.registerBuiltInInterfaces();
  }
  
  static getInstance(): VB6InterfaceRegistry {
    if (!VB6InterfaceRegistry.instance) {
      VB6InterfaceRegistry.instance = new VB6InterfaceRegistry();
    }
    return VB6InterfaceRegistry.instance;
  }
  
  /**
   * Register an interface definition
   */
  registerInterface(definition: InterfaceDefinition): void {
    this.interfaces.set(definition.name, definition);
    
    // Process extended interfaces
    if (definition.extends) {
      definition.extends.forEach(parentInterface => {
        const parent = this.interfaces.get(parentInterface);
        if (parent) {
          // Inherit members from parent
          definition.members = [...parent.members, ...definition.members];
        }
      });
    }
    
    console.log(`[VB6 Interface] Registered interface: ${definition.name}`);
  }
  
  /**
   * Register that a class implements an interface
   */
  registerImplementation(className: string, interfaceName: string): void {
    if (!this.implementations.has(interfaceName)) {
      this.implementations.set(interfaceName, new Set());
    }
    
    this.implementations.get(interfaceName)!.add(className);
    
    console.log(`[VB6 Interface] ${className} implements ${interfaceName}`);
  }
  
  /**
   * Validate that a class properly implements an interface
   */
  validateImplementation(
    classInstance: any,
    interfaceName: string
  ): { valid: boolean; errors: string[] } {
    const interfaceDef = this.interfaces.get(interfaceName);
    if (!interfaceDef) {
      return { valid: false, errors: [`Interface '${interfaceName}' not found`] };
    }
    
    const errors: string[] = [];
    const className = classInstance.constructor.name;
    
    interfaceDef.members.forEach(member => {
      const memberName = this.getImplementationName(interfaceName, member.name);
      
      switch (member.type) {
        case InterfaceMemberType.Method:
          if (typeof classInstance[memberName] !== 'function') {
            if (!member.isOptional) {
              errors.push(`Missing method implementation: ${memberName}`);
            }
          } else {
            // Validate method signature
            const method = classInstance[memberName];
            if (method.length !== (member.parameters?.length || 0)) {
              errors.push(`Method '${memberName}' has incorrect parameter count`);
            }
          }
          break;
          
        case InterfaceMemberType.Property: {
          const descriptor = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(classInstance),
            memberName
          );

          if (!descriptor && !member.isOptional) {
            errors.push(`Missing property implementation: ${memberName}`);
          } else if (descriptor) {
            if (member.propertyType === 'Get' && !descriptor.get) {
              errors.push(`Property '${memberName}' missing getter`);
            }
            if ((member.propertyType === 'Let' || member.propertyType === 'Set') && !descriptor.set) {
              errors.push(`Property '${memberName}' missing setter`);
            }
          }
          break;
        }
          
        case InterfaceMemberType.Event: {
          // Check if event is declared
          const eventName = `${memberName}_Event`;
          if (!classInstance[eventName] && !member.isOptional) {
            errors.push(`Missing event declaration: ${eventName}`);
          }
          break;
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Create interface proxy for late binding
   */
  createInterfaceProxy(interfaceName: string): any {
    if (this.interfaceProxies.has(interfaceName)) {
      return this.interfaceProxies.get(interfaceName);
    }
    
    const interfaceDef = this.interfaces.get(interfaceName);
    if (!interfaceDef) {
      throw new Error(`Interface '${interfaceName}' not found`);
    }
    
    const proxy = new Proxy({}, {
      get: (target, prop) => {
        const member = interfaceDef.members.find(m => m.name === String(prop));
        if (member) {
          switch (member.type) {
            case InterfaceMemberType.Method:
              return function(...args: any[]) {
                console.log(`[Interface Proxy] Calling ${interfaceName}.${String(prop)}`);
                return null;
              };
            case InterfaceMemberType.Property:
              return null;
            case InterfaceMemberType.Event:
              return function() {};
          }
        }
        return undefined;
      },
      set: (target, prop, value) => {
        const member = interfaceDef.members.find(m => m.name === String(prop));
        if (member && member.type === InterfaceMemberType.Property) {
          console.log(`[Interface Proxy] Setting ${interfaceName}.${String(prop)} = ${value}`);
          return true;
        }
        return false;
      }
    });
    
    this.interfaceProxies.set(interfaceName, proxy);
    return proxy;
  }
  
  /**
   * Cast object to interface
   */
  castToInterface(obj: any, interfaceName: string): any {
    const validation = this.validateImplementation(obj, interfaceName);
    
    if (!validation.valid) {
      console.warn(`Object does not fully implement ${interfaceName}:`, validation.errors);
    }
    
    const interfaceDef = this.interfaces.get(interfaceName);
    if (!interfaceDef) {
      return obj;
    }
    
    // Create interface view of object
    const interfaceView: any = {};
    
    interfaceDef.members.forEach(member => {
      const memberName = this.getImplementationName(interfaceName, member.name);
      
      if (member.type === InterfaceMemberType.Method) {
        if (typeof obj[memberName] === 'function') {
          interfaceView[member.name] = obj[memberName].bind(obj);
        }
      } else if (member.type === InterfaceMemberType.Property) {
        Object.defineProperty(interfaceView, member.name, {
          get: () => obj[memberName],
          set: (value) => { obj[memberName] = value; },
          enumerable: true
        });
      }
    });
    
    return interfaceView;
  }
  
  /**
   * Check if object implements interface
   */
  implementsInterface(obj: any, interfaceName: string): boolean {
    const className = obj.constructor.name;
    const implementations = this.implementations.get(interfaceName);
    
    if (implementations && implementations.has(className)) {
      return true;
    }
    
    // Check duck typing
    const validation = this.validateImplementation(obj, interfaceName);
    return validation.valid;
  }
  
  /**
   * Get all interfaces implemented by a class
   */
  getImplementedInterfaces(className: string): string[] {
    const implemented: string[] = [];
    
    this.implementations.forEach((classes, interfaceName) => {
      if (classes.has(className)) {
        implemented.push(interfaceName);
      }
    });
    
    return implemented;
  }
  
  /**
   * Get implementation name for interface member
   * VB6 style: InterfaceName_MemberName
   */
  private getImplementationName(interfaceName: string, memberName: string): string {
    return `${interfaceName}_${memberName}`;
  }
  
  /**
   * Register built-in interfaces
   */
  private registerBuiltInInterfaces(): void {
    // IUnknown interface (COM base)
    this.registerInterface({
      name: 'IUnknown',
      members: [
        {
          name: 'QueryInterface',
          type: InterfaceMemberType.Method,
          parameters: [
            { name: 'riid', type: 'String', byRef: false },
            { name: 'ppvObject', type: 'Object', byRef: true }
          ],
          returnType: 'Long'
        },
        {
          name: 'AddRef',
          type: InterfaceMemberType.Method,
          returnType: 'Long'
        },
        {
          name: 'Release',
          type: InterfaceMemberType.Method,
          returnType: 'Long'
        }
      ],
      guid: '{00000000-0000-0000-C000-000000000046}'
    });
    
    // IDispatch interface (COM automation)
    this.registerInterface({
      name: 'IDispatch',
      extends: ['IUnknown'],
      members: [
        {
          name: 'GetTypeInfoCount',
          type: InterfaceMemberType.Method,
          parameters: [
            { name: 'pctinfo', type: 'Long', byRef: true }
          ],
          returnType: 'Long'
        },
        {
          name: 'GetTypeInfo',
          type: InterfaceMemberType.Method,
          parameters: [
            { name: 'iTInfo', type: 'Long', byRef: false },
            { name: 'lcid', type: 'Long', byRef: false },
            { name: 'ppTInfo', type: 'Object', byRef: true }
          ],
          returnType: 'Long'
        },
        {
          name: 'GetIDsOfNames',
          type: InterfaceMemberType.Method,
          returnType: 'Long'
        },
        {
          name: 'Invoke',
          type: InterfaceMemberType.Method,
          returnType: 'Long'
        }
      ],
      guid: '{00020400-0000-0000-C000-000000000046}'
    });
    
    // IEnumerable interface
    this.registerInterface({
      name: 'IEnumerable',
      members: [
        {
          name: 'GetEnumerator',
          type: InterfaceMemberType.Method,
          returnType: 'IEnumerator'
        }
      ]
    });
    
    // IEnumerator interface
    this.registerInterface({
      name: 'IEnumerator',
      members: [
        {
          name: 'Current',
          type: InterfaceMemberType.Property,
          propertyType: 'Get',
          returnType: 'Variant'
        },
        {
          name: 'MoveNext',
          type: InterfaceMemberType.Method,
          returnType: 'Boolean'
        },
        {
          name: 'Reset',
          type: InterfaceMemberType.Method
        }
      ]
    });
    
    // IComparable interface
    this.registerInterface({
      name: 'IComparable',
      members: [
        {
          name: 'CompareTo',
          type: InterfaceMemberType.Method,
          parameters: [
            { name: 'obj', type: 'Object', byRef: false }
          ],
          returnType: 'Integer'
        }
      ]
    });
    
    // ICloneable interface
    this.registerInterface({
      name: 'ICloneable',
      members: [
        {
          name: 'Clone',
          type: InterfaceMemberType.Method,
          returnType: 'Object'
        }
      ]
    });
    
    // IDisposable interface
    this.registerInterface({
      name: 'IDisposable',
      members: [
        {
          name: 'Dispose',
          type: InterfaceMemberType.Method
        }
      ]
    });
  }
}

// Global registry instance
export const InterfaceRegistry = VB6InterfaceRegistry.getInstance();

/**
 * Decorator for interface implementation
 */
export function Implements(...interfaces: string[]) {
  return function(constructor: any) {
    const className = constructor.name;
    
    interfaces.forEach(interfaceName => {
      InterfaceRegistry.registerImplementation(className, interfaceName);
      
      // Validate implementation at runtime
      const instance = new constructor();
      const validation = InterfaceRegistry.validateImplementation(instance, interfaceName);
      
      if (!validation.valid) {
        console.error(`Class ${className} does not properly implement ${interfaceName}:`);
        validation.errors.forEach(error => console.error(`  - ${error}`));
      }
    });
    
    return constructor;
  };
}

/**
 * Define an interface
 */
export function DefineInterface(definition: InterfaceDefinition): void {
  InterfaceRegistry.registerInterface(definition);
}

/**
 * Check if object implements interface
 */
export function TypeOf(obj: any, interfaceName: string): boolean {
  return InterfaceRegistry.implementsInterface(obj, interfaceName);
}

/**
 * Cast object to interface
 */
export function CastAs(obj: any, interfaceName: string): any {
  return InterfaceRegistry.castToInterface(obj, interfaceName);
}

/**
 * Example: Custom interface definition
 */
DefineInterface({
  name: 'IShape',
  members: [
    {
      name: 'Area',
      type: InterfaceMemberType.Property,
      propertyType: 'Get',
      returnType: 'Double'
    },
    {
      name: 'Perimeter',
      type: InterfaceMemberType.Property,
      propertyType: 'Get',
      returnType: 'Double'
    },
    {
      name: 'Draw',
      type: InterfaceMemberType.Method,
      parameters: [
        { name: 'canvas', type: 'Object', byRef: false }
      ]
    },
    {
      name: 'Move',
      type: InterfaceMemberType.Method,
      parameters: [
        { name: 'x', type: 'Double', byRef: false },
        { name: 'y', type: 'Double', byRef: false }
      ]
    }
  ]
});

DefineInterface({
  name: 'IColorable',
  members: [
    {
      name: 'Color',
      type: InterfaceMemberType.Property,
      propertyType: 'Get',
      returnType: 'Long'
    },
    {
      name: 'Color',
      type: InterfaceMemberType.Property,
      propertyType: 'Let',
      parameters: [
        { name: 'value', type: 'Long', byRef: false }
      ]
    },
    {
      name: 'Fill',
      type: InterfaceMemberType.Method,
      parameters: [
        { name: 'color', type: 'Long', byRef: false }
      ]
    }
  ]
});

/**
 * Example: Class implementing interface
 */
@Implements('IShape', 'IColorable')
export class Circle {
  private _x: number = 0;
  private _y: number = 0;
  private _radius: number = 0;
  private _color: number = 0;
  
  constructor(x: number, y: number, radius: number) {
    this._x = x;
    this._y = y;
    this._radius = radius;
  }
  
  // IShape implementation
  get IShape_Area(): number {
    return Math.PI * this._radius * this._radius;
  }
  
  get IShape_Perimeter(): number {
    return 2 * Math.PI * this._radius;
  }
  
  IShape_Draw(canvas: any): void {
    console.log(`Drawing circle at (${this._x}, ${this._y}) with radius ${this._radius}`);
  }
  
  IShape_Move(x: number, y: number): void {
    this._x = x;
    this._y = y;
  }
  
  // IColorable implementation
  get IColorable_Color(): number {
    return this._color;
  }
  
  set IColorable_Color(value: number) {
    this._color = value;
  }
  
  IColorable_Fill(color: number): void {
    this._color = color;
    console.log(`Filling circle with color ${color}`);
  }
}

/**
 * Example: Class implementing IEnumerable
 */
@Implements('IEnumerable', 'ICloneable')
export class VB6Collection {
  private items: any[] = [];
  private currentIndex: number = -1;
  
  Add(item: any): void {
    this.items.push(item);
  }
  
  // IEnumerable implementation
  IEnumerable_GetEnumerator(): any {
    return {
      items: [...this.items],
      index: -1,
      MoveNext: function() {
        this.index++;
        return this.index < this.items.length;
      },
      get Current() {
        return this.items[this.index];
      },
      Reset: function() {
        this.index = -1;
      }
    };
  }
  
  // ICloneable implementation
  ICloneable_Clone(): VB6Collection {
    const clone = new VB6Collection();
    clone.items = [...this.items];
    return clone;
  }
  
  // Collection methods
  get Count(): number {
    return this.items.length;
  }
  
  Item(index: number): any {
    return this.items[index];
  }
}

/**
 * Example: Interface polymorphism
 */
export class InterfacePolymorphismExample {
  drawShapes(shapes: any[]): void {
    shapes.forEach(shape => {
      if (TypeOf(shape, 'IShape')) {
        const shapeInterface = CastAs(shape, 'IShape');
        shapeInterface.Draw(null);
        console.log(`Area: ${shapeInterface.Area}`);
      }
    });
  }
  
  colorObjects(objects: any[], color: number): void {
    objects.forEach(obj => {
      if (TypeOf(obj, 'IColorable')) {
        const colorable = CastAs(obj, 'IColorable');
        colorable.Fill(color);
      }
    });
  }
  
  demonstrateInterfaces(): void {
    const circle = new Circle(10, 10, 5);
    
    // Check interface implementation
    console.log('Circle implements IShape:', TypeOf(circle, 'IShape'));
    console.log('Circle implements IColorable:', TypeOf(circle, 'IColorable'));
    
    // Use through interface
    const shape = CastAs(circle, 'IShape');
    shape.Draw(null);
    shape.Move(20, 20);
    
    const colorable = CastAs(circle, 'IColorable');
    colorable.Fill(0xFF0000);
    
    // Collection example
    const collection = new VB6Collection();
    collection.Add('Item1');
    collection.Add('Item2');
    collection.Add('Item3');
    
    // Use IEnumerable
    if (TypeOf(collection, 'IEnumerable')) {
      const enumerable = CastAs(collection, 'IEnumerable');
      const enumerator = enumerable.GetEnumerator();
      
      while (enumerator.MoveNext()) {
        console.log('Item:', enumerator.Current);
      }
    }
    
    // Clone collection
    if (TypeOf(collection, 'ICloneable')) {
      const cloneable = CastAs(collection, 'ICloneable');
      const cloned = cloneable.Clone();
      console.log('Cloned collection count:', cloned.Count);
    }
  }
}

// Export all interface functionality
export const VB6Interfaces = {
  InterfaceMemberType,
  VB6InterfaceRegistry,
  InterfaceRegistry,
  Implements,
  DefineInterface,
  TypeOf,
  CastAs,
  Circle,
  VB6Collection,
  InterfacePolymorphismExample
};