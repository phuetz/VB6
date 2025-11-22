/**
 * VB6 Advanced Object-Oriented Programming Features
 * Implements, RaiseEvent, AddressOf, WithEvents, and Interface support
 */

// Interface definition system
export interface VB6Interface {
  __interfaceName: string;
  __interfaceMembers: string[];
}

// Event system types
export type VB6EventHandler = (...args: any[]) => void;
export type VB6AddressOfFunction = (...args: any[]) => any;

// Event registry for WithEvents and RaiseEvent
class VB6EventRegistry {
  private static instance: VB6EventRegistry;
  private eventHandlers: Map<string, Map<string, VB6EventHandler[]>> = new Map();
  private eventObjects: Map<string, any> = new Map();
  
  static getInstance(): VB6EventRegistry {
    if (!VB6EventRegistry.instance) {
      VB6EventRegistry.instance = new VB6EventRegistry();
    }
    return VB6EventRegistry.instance;
  }
  
  // Register an event handler for an object
  addEventHandler(objectName: string, eventName: string, handler: VB6EventHandler): void {
    if (!this.eventHandlers.has(objectName)) {
      this.eventHandlers.set(objectName, new Map());
    }
    
    const objectEvents = this.eventHandlers.get(objectName)!;
    if (!objectEvents.has(eventName)) {
      objectEvents.set(eventName, []);
    }
    
    objectEvents.get(eventName)!.push(handler);
  }
  
  // Remove an event handler
  removeEventHandler(objectName: string, eventName: string, handler: VB6EventHandler): void {
    const objectEvents = this.eventHandlers.get(objectName);
    if (!objectEvents) return;
    
    const handlers = objectEvents.get(eventName);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
  
  // Raise an event (RaiseEvent implementation)
  raiseEvent(objectName: string, eventName: string, ...args: any[]): void {
    const objectEvents = this.eventHandlers.get(objectName);
    if (!objectEvents) return;
    
    const handlers = objectEvents.get(eventName);
    if (!handlers) return;
    
    // Call all registered handlers
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Event handler error in ${objectName}.${eventName}:`, error);
      }
    });
  }
  
  // Register an object for events
  registerEventObject(objectName: string, obj: any): void {
    this.eventObjects.set(objectName, obj);
  }
  
  // Get registered event object
  getEventObject(objectName: string): any {
    return this.eventObjects.get(objectName);
  }
  
  // Clear all events for an object
  clearObjectEvents(objectName: string): void {
    this.eventHandlers.delete(objectName);
    this.eventObjects.delete(objectName);
  }
}

// Interface implementation system
class VB6InterfaceManager {
  private static instance: VB6InterfaceManager;
  private interfaces: Map<string, VB6Interface> = new Map();
  private implementations: Map<any, Set<string>> = new Map();
  
  static getInstance(): VB6InterfaceManager {
    if (!VB6InterfaceManager.instance) {
      VB6InterfaceManager.instance = new VB6InterfaceManager();
    }
    return VB6InterfaceManager.instance;
  }
  
  // Register an interface
  defineInterface(name: string, members: string[]): VB6Interface {
    const interface_ = {
      __interfaceName: name,
      __interfaceMembers: members
    };
    
    this.interfaces.set(name, interface_);
    return interface_;
  }
  
  // Implement an interface on an object
  implementInterface(obj: any, interfaceName: string): boolean {
    const interface_ = this.interfaces.get(interfaceName);
    if (!interface_) {
      throw new Error(`Interface '${interfaceName}' not found`);
    }
    
    // Check if object implements all required members
    for (const member of interface_.__interfaceMembers) {
      if (!(member in obj) || typeof obj[member] !== 'function') {
        throw new Error(`Object does not implement required interface member: ${member}`);
      }
    }
    
    // Mark object as implementing this interface
    if (!this.implementations.has(obj)) {
      this.implementations.set(obj, new Set());
    }
    
    this.implementations.get(obj)!.add(interfaceName);
    
    // Add interface marker to object
    obj.__implementedInterfaces = obj.__implementedInterfaces || [];
    if (!obj.__implementedInterfaces.includes(interfaceName)) {
      obj.__implementedInterfaces.push(interfaceName);
    }
    
    return true;
  }
  
  // Check if object implements an interface
  implementsInterface(obj: any, interfaceName: string): boolean {
    return this.implementations.get(obj)?.has(interfaceName) || false;
  }
  
  // Get all interfaces implemented by an object
  getImplementedInterfaces(obj: any): string[] {
    const interfaces = this.implementations.get(obj);
    return interfaces ? Array.from(interfaces) : [];
  }
}

// Function address system for AddressOf
class VB6AddressOfManager {
  private static instance: VB6AddressOfManager;
  private functionPointers: Map<string, VB6AddressOfFunction> = new Map();
  private nextId: number = 1;
  
  static getInstance(): VB6AddressOfManager {
    if (!VB6AddressOfManager.instance) {
      VB6AddressOfManager.instance = new VB6AddressOfManager();
    }
    return VB6AddressOfManager.instance;
  }
  
  // Get address of a function
  getAddressOf(func: VB6AddressOfFunction): string {
    const id = `func_${this.nextId++}`;
    this.functionPointers.set(id, func);
    return id;
  }
  
  // Call function by address
  callFunction(address: string, ...args: any[]): any {
    const func = this.functionPointers.get(address);
    if (!func) {
      throw new Error(`Function not found at address: ${address}`);
    }
    
    return func(...args);
  }
  
  // Release function address
  releaseAddress(address: string): void {
    this.functionPointers.delete(address);
  }
}

// Main VB6 Advanced OOP Functions
const eventRegistry = VB6EventRegistry.getInstance();
const interfaceManager = VB6InterfaceManager.getInstance();
const addressOfManager = VB6AddressOfManager.getInstance();

/**
 * Define an interface (VB6 Interface...End Interface equivalent)
 */
export function DefineInterface(name: string, members: string[]): VB6Interface {
  return interfaceManager.defineInterface(name, members);
}

/**
 * Implement an interface on an object (VB6 Implements statement)
 */
export function Implements(obj: any, interfaceName: string): boolean {
  return interfaceManager.implementInterface(obj, interfaceName);
}

/**
 * Check if object implements interface
 */
export function ImplementsInterface(obj: any, interfaceName: string): boolean {
  return interfaceManager.implementsInterface(obj, interfaceName);
}

/**
 * Raise an event (VB6 RaiseEvent statement)
 */
export function RaiseEvent(objectName: string, eventName: string, ...args: any[]): void {
  eventRegistry.raiseEvent(objectName, eventName, ...args);
}

/**
 * Register an event handler (WithEvents support)
 */
export function WithEvents(objectName: string, eventName: string, handler: VB6EventHandler): void {
  eventRegistry.addEventHandler(objectName, eventName, handler);
}

/**
 * Remove an event handler
 */
export function RemoveEventHandler(objectName: string, eventName: string, handler: VB6EventHandler): void {
  eventRegistry.removeEventHandler(objectName, eventName, handler);
}

/**
 * Register an object for event handling
 */
export function RegisterEventObject(objectName: string, obj: any): void {
  eventRegistry.registerEventObject(objectName, obj);
}

/**
 * Get address of a function (VB6 AddressOf operator)
 */
export function AddressOf(func: VB6AddressOfFunction): string {
  return addressOfManager.getAddressOf(func);
}

/**
 * Call a function by its address
 */
export function CallByAddress(address: string, ...args: any[]): any {
  return addressOfManager.callFunction(address, ...args);
}

/**
 * Release a function address
 */
export function ReleaseAddress(address: string): void {
  addressOfManager.releaseAddress(address);
}

/**
 * Create a class with events support
 */
export function CreateEventableClass(className: string, events: string[] = []): any {
  const classConstructor = function(this: any, ...args: any[]) {
    this.__className = className;
    this.__events = events;
    this.__eventHandlers = new Map();
    
    // Register this instance for events
    const instanceName = `${className}_${Math.random().toString(36).substr(2, 9)}`;
    this.__instanceName = instanceName;
    eventRegistry.registerEventObject(instanceName, this);
    
    // Initialize event handler methods
    events.forEach(eventName => {
      this[`on${eventName}`] = undefined; // Event handler property
    });
  };
  
  // Add RaiseEvent method to prototype
  classConstructor.prototype.RaiseEvent = function(eventName: string, ...args: any[]) {
    if (!this.__events.includes(eventName)) {
      throw new Error(`Event '${eventName}' is not defined for class '${this.__className}'`);
    }
    
    // Call the event handler if assigned
    const handlerName = `on${eventName}`;
    if (this[handlerName] && typeof this[handlerName] === 'function') {
      this[handlerName](...args);
    }
    
    // Also raise through event registry
    eventRegistry.raiseEvent(this.__instanceName, eventName, ...args);
  };
  
  return classConstructor;
}

/**
 * Event declaration decorator
 */
export function VB6Event(eventName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.__events) {
      target.__events = [];
    }
    target.__events.push(eventName);
  };
}

/**
 * Property with events support
 */
export function VB6Property(target: any, propertyKey: string) {
  let value: any;
  
  Object.defineProperty(target, propertyKey, {
    get: function() {
      return value;
    },
    set: function(newValue: any) {
      const oldValue = value;
      value = newValue;
      
      // Raise PropertyChanged event if object supports events
      if (this.RaiseEvent) {
        this.RaiseEvent('PropertyChanged', propertyKey, oldValue, newValue);
      }
    },
    enumerable: true,
    configurable: true
  });
}

/**
 * Method with events support
 */
export function VB6Method(eventName?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      // Raise BeforeMethod event
      if (this.RaiseEvent && eventName) {
        this.RaiseEvent(`Before${eventName}`, ...args);
      }
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Raise AfterMethod event
        if (this.RaiseEvent && eventName) {
          this.RaiseEvent(`After${eventName}`, result, ...args);
        }
        
        return result;
      } catch (error) {
        // Raise MethodError event
        if (this.RaiseEvent && eventName) {
          this.RaiseEvent(`${eventName}Error`, error, ...args);
        }
        throw error;
      }
    };
  };
}

/**
 * Create a collection class with events
 */
export function CreateEventableCollection(): any {
  return CreateEventableClass('VB6Collection', [
    'ItemAdded',
    'ItemRemoved',
    'ItemChanged',
    'CollectionCleared'
  ]);
}

/**
 * Create a form class with events
 */
export function CreateEventableForm(): any {
  return CreateEventableClass('VB6Form', [
    'Load',
    'Unload',
    'Activate',
    'Deactivate',
    'Resize',
    'Paint',
    'Click',
    'DblClick',
    'MouseDown',
    'MouseUp',
    'MouseMove',
    'KeyDown',
    'KeyUp',
    'KeyPress'
  ]);
}

/**
 * TypeOf...Is support for interface checking
 */
export function TypeOf(obj: any): {
  Is: (interfaceName: string) => boolean;
} {
  return {
    Is: (interfaceName: string) => {
      return interfaceManager.implementsInterface(obj, interfaceName);
    }
  };
}

/**
 * Set reference to object with events (VB6 Set statement with WithEvents)
 */
export function SetWithEvents(objectVar: any, sourceObject: any, variableName: string): any {
  if (sourceObject && sourceObject.__events) {
    // Copy event handlers from variable to source object
    sourceObject.__events.forEach((eventName: string) => {
      const handlerName = `${variableName}_${eventName}`;
      if (typeof (globalThis as any)[handlerName] === 'function') {
        WithEvents(sourceObject.__instanceName || variableName, eventName, (globalThis as any)[handlerName]);
      }
    });
  }
  
  return sourceObject;
}

// Export the advanced OOP system
export const VB6AdvancedOOP = {
  // Interface system
  DefineInterface,
  Implements,
  ImplementsInterface,
  TypeOf,
  
  // Event system
  RaiseEvent,
  WithEvents,
  RemoveEventHandler,
  RegisterEventObject,
  SetWithEvents,
  
  // AddressOf system
  AddressOf,
  CallByAddress,
  ReleaseAddress,
  
  // Class creation
  CreateEventableClass,
  CreateEventableCollection,
  CreateEventableForm,
  
  // Decorators
  VB6Event,
  VB6Property,
  VB6Method,
  
  // Managers
  EventRegistry: eventRegistry,
  InterfaceManager: interfaceManager,
  AddressOfManager: addressOfManager
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.VB6AdvancedOOP = VB6AdvancedOOP;
  
  // Expose individual functions globally for VB6 compatibility
  Object.assign(globalAny, {
    DefineInterface,
    Implements,
    ImplementsInterface,
    RaiseEvent,
    WithEvents,
    RemoveEventHandler,
    RegisterEventObject,
    AddressOf,
    CallByAddress,
    ReleaseAddress,
    CreateEventableClass,
    CreateEventableCollection,
    CreateEventableForm,
    SetWithEvents,
    TypeOf
  });
}

export default VB6AdvancedOOP;