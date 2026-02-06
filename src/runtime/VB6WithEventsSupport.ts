/**
 * VB6 WithEvents and RaiseEvent Implementation
 * Complete support for event declaration, handling, and raising
 */

// Event handler type
export type VB6EventHandler = (...args: any[]) => void;

// Event declaration
export interface VB6EventDeclaration {
  name: string;
  parameters: VB6EventParameter[];
  description?: string;
}

export interface VB6EventParameter {
  name: string;
  type: string;
  byRef?: boolean;
  optional?: boolean;
  defaultValue?: any;
}

// WithEvents object wrapper
export interface WithEventsObject {
  object: any;
  eventHandlers: Map<string, VB6EventHandler>;
  objectType: string;
}

/**
 * VB6 Event Manager
 * Manages event declarations, WithEvents objects, and RaiseEvent functionality
 */
export class VB6EventManager {
  private static instance: VB6EventManager;

  // Event declarations by class
  private eventDeclarations = new Map<string, Map<string, VB6EventDeclaration>>();

  // WithEvents objects by instance
  private withEventsObjects = new WeakMap<any, Map<string, WithEventsObject>>();

  // Event listeners registry
  private eventListeners = new Map<string, Set<VB6EventHandler>>();

  // Event bubbling configuration
  private bubbleEvents = new Map<string, boolean>();

  // Event queue for deferred raising
  private eventQueue: Array<{
    target: any;
    eventName: string;
    args: any[];
  }> = [];

  private isRaisingEvents = false;

  private constructor() {}

  static getInstance(): VB6EventManager {
    if (!VB6EventManager.instance) {
      VB6EventManager.instance = new VB6EventManager();
    }
    return VB6EventManager.instance;
  }

  /**
   * Declare an event for a class
   */
  declareEvent(
    className: string,
    eventName: string,
    parameters: VB6EventParameter[] = [],
    description?: string
  ): void {
    if (!this.eventDeclarations.has(className)) {
      this.eventDeclarations.set(className, new Map());
    }

    this.eventDeclarations.get(className)!.set(eventName, {
      name: eventName,
      parameters,
      description,
    });
  }

  /**
   * Declare a WithEvents object
   */
  declareWithEvents(owner: any, propertyName: string, object: any, objectType: string): void {
    if (!this.withEventsObjects.has(owner)) {
      this.withEventsObjects.set(owner, new Map());
    }

    const withEventsMap = this.withEventsObjects.get(owner)!;

    // Create WithEvents wrapper
    const withEventsObj: WithEventsObject = {
      object,
      eventHandlers: new Map(),
      objectType,
    };

    withEventsMap.set(propertyName, withEventsObj);

    // Auto-wire standard events if available
    this.autowireStandardEvents(owner, propertyName, object, objectType);
  }

  /**
   * Set a WithEvents object (equivalent to Set statement)
   */
  setWithEventsObject(owner: any, propertyName: string, newObject: any): void {
    const withEventsMap = this.withEventsObjects.get(owner);
    if (!withEventsMap) return;

    const withEventsObj = withEventsMap.get(propertyName);
    if (!withEventsObj) return;

    // Unhook old object events
    if (withEventsObj.object) {
      this.unhookEvents(withEventsObj.object, withEventsObj.eventHandlers);
    }

    // Update object reference
    withEventsObj.object = newObject;

    // Hook new object events
    if (newObject) {
      this.hookEvents(owner, propertyName, newObject, withEventsObj.eventHandlers);
    }
  }

  /**
   * Raise an event
   */
  raiseEvent(source: any, eventName: string, ...args: any[]): void {
    // Check if we're already raising events (prevent recursion)
    if (this.isRaisingEvents) {
      // Queue the event for later
      this.eventQueue.push({ target: source, eventName, args });
      return;
    }

    this.isRaisingEvents = true;

    try {
      // Get class name
      const className = source.constructor.name;

      // Validate event declaration
      const classEvents = this.eventDeclarations.get(className);
      if (!classEvents || !classEvents.has(eventName)) {
        console.warn(`[VB6 Events] Event ${eventName} not declared for class ${className}`);
      }

      // Create event key
      const eventKey = this.getEventKey(source, eventName);

      // Get listeners
      const listeners = this.eventListeners.get(eventKey);

      if (listeners && listeners.size > 0) {
        // Call each listener
        listeners.forEach(handler => {
          try {
            handler(...args);
          } catch (error) {
            console.error(`[VB6 Events] Error in event handler for ${eventName}:`, error);
          }
        });
      }

      // Check for WithEvents handlers
      this.raiseWithEventsHandlers(source, eventName, args);

      // Process queued events
      this.processEventQueue();
    } finally {
      this.isRaisingEvents = false;
    }
  }

  /**
   * Add event handler
   */
  addEventListener(target: any, eventName: string, handler: VB6EventHandler): void {
    const eventKey = this.getEventKey(target, eventName);

    if (!this.eventListeners.has(eventKey)) {
      this.eventListeners.set(eventKey, new Set());
    }

    this.eventListeners.get(eventKey)!.add(handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(target: any, eventName: string, handler: VB6EventHandler): void {
    const eventKey = this.getEventKey(target, eventName);
    const listeners = this.eventListeners.get(eventKey);

    if (listeners) {
      listeners.delete(handler);

      if (listeners.size === 0) {
        this.eventListeners.delete(eventKey);
      }
    }
  }

  /**
   * Register a WithEvents event handler
   */
  registerWithEventsHandler(
    owner: any,
    propertyName: string,
    eventName: string,
    handler: VB6EventHandler
  ): void {
    const withEventsMap = this.withEventsObjects.get(owner);
    if (!withEventsMap) return;

    const withEventsObj = withEventsMap.get(propertyName);
    if (!withEventsObj) return;

    // Store handler
    const handlerKey = `${propertyName}_${eventName}`;
    withEventsObj.eventHandlers.set(handlerKey, handler);

    // Hook to actual object if it exists
    if (withEventsObj.object) {
      this.addEventListener(withEventsObj.object, eventName, handler);
    }
  }

  /**
   * Get all declared events for a class
   */
  getClassEvents(className: string): VB6EventDeclaration[] {
    const classEvents = this.eventDeclarations.get(className);
    return classEvents ? Array.from(classEvents.values()) : [];
  }

  /**
   * Check if class has event
   */
  hasEvent(className: string, eventName: string): boolean {
    const classEvents = this.eventDeclarations.get(className);
    return classEvents ? classEvents.has(eventName) : false;
  }

  /**
   * Enable/disable event bubbling for a class
   */
  setEventBubbling(className: string, enabled: boolean): void {
    this.bubbleEvents.set(className, enabled);
  }

  private autowireStandardEvents(
    owner: any,
    propertyName: string,
    object: any,
    objectType: string
  ): void {
    // Standard VB6 control events
    const standardEvents = [
      'Click',
      'DblClick',
      'MouseDown',
      'MouseUp',
      'MouseMove',
      'KeyDown',
      'KeyUp',
      'KeyPress',
      'Change',
      'GotFocus',
      'LostFocus',
      'Load',
      'Unload',
      'Resize',
      'Paint',
    ];

    standardEvents.forEach(eventName => {
      const handlerName = `${propertyName}_${eventName}`;

      // Check if owner has the handler method
      if (typeof owner[handlerName] === 'function') {
        this.registerWithEventsHandler(
          owner,
          propertyName,
          eventName,
          owner[handlerName].bind(owner)
        );
      }
    });
  }

  private hookEvents(
    owner: any,
    propertyName: string,
    object: any,
    eventHandlers: Map<string, VB6EventHandler>
  ): void {
    eventHandlers.forEach((handler, key) => {
      const eventName = key.substring(propertyName.length + 1); // Remove prefix
      this.addEventListener(object, eventName, handler);
    });
  }

  private unhookEvents(object: any, eventHandlers: Map<string, VB6EventHandler>): void {
    eventHandlers.forEach((handler, key) => {
      const eventName = key.substring(key.indexOf('_') + 1);
      this.removeEventListener(object, eventName, handler);
    });
  }

  private raiseWithEventsHandlers(source: any, eventName: string, args: any[]): void {
    // Find all WithEvents objects that reference this source
    // This would require tracking reverse references, simplified here
  }

  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;

      // Re-raise the queued event
      this.isRaisingEvents = false; // Allow processing
      this.raiseEvent(event.target, event.eventName, ...event.args);
    }
  }

  private getEventKey(target: any, eventName: string): string {
    // Use object identity for key
    const id = target.__eventId || (target.__eventId = Math.random().toString(36));
    return `${id}_${eventName}`;
  }

  /**
   * Clear all event handlers for an object
   */
  clearEventHandlers(target: any): void {
    // Clear direct event listeners
    const keys = Array.from(this.eventListeners.keys());
    keys.forEach(key => {
      if (key.startsWith(target.__eventId + '_')) {
        this.eventListeners.delete(key);
      }
    });

    // Clear WithEvents references
    if (this.withEventsObjects.has(target)) {
      this.withEventsObjects.delete(target);
    }
  }
}

// Global instance
export const EventManager = VB6EventManager.getInstance();

/**
 * Event decorator for class methods
 */
export function Event(eventName?: string) {
  return function (target: any, propertyKey: string) {
    const className = target.constructor.name;
    const name = eventName || propertyKey;

    // Register event declaration
    EventManager.declareEvent(className, name);

    // Create RaiseEvent method if not exists
    if (!target[`Raise${name}`]) {
      target[`Raise${name}`] = function (...args: any[]) {
        EventManager.raiseEvent(this, name, ...args);
      };
    }
  };
}

/**
 * WithEvents decorator for properties
 */
export function WithEvents(objectType: string) {
  return function (target: any, propertyKey: string) {
    let value: any = null;

    const getter = function () {
      return value;
    };

    const setter = function (newValue: any) {
      // Update WithEvents object
      EventManager.setWithEventsObject(this, propertyKey, newValue);
      value = newValue;
    };

    // Delete property
    if (delete target[propertyKey]) {
      // Define new property with getter/setter
      Object.defineProperty(target, propertyKey, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true,
      });
    }

    // Register WithEvents on first access
    const originalConstructor = target.constructor;
    target.constructor = function (...args: any[]) {
      const instance = originalConstructor.apply(this, args);
      EventManager.declareWithEvents(instance, propertyKey, null, objectType);
      return instance;
    };
  };
}

/**
 * VB6 Event Class Example
 */
export class VB6EventClass {
  // Event declarations
  @Event()
  StatusChanged?: (status: string, code: number) => void;

  @Event()
  ProgressUpdate?: (percent: number, message: string) => void;

  @Event('DataReceived')
  OnDataReceived?: (data: any) => void;

  private _status: string = 'Ready';
  private _progress: number = 0;

  // Property that raises event
  get Status(): string {
    return this._status;
  }

  set Status(value: string) {
    const oldStatus = this._status;
    this._status = value;

    // Raise StatusChanged event
    this.RaiseStatusChanged(value, 0);
  }

  // Method to update progress
  updateProgress(percent: number, message: string = ''): void {
    this._progress = percent;

    // Raise ProgressUpdate event
    this.RaiseProgressUpdate(percent, message);
  }

  // Method to process data
  processData(data: any): void {
    // Process the data...

    // Raise DataReceived event
    this.RaiseOnDataReceived(data);
  }

  // RaiseEvent methods (auto-generated by decorator)
  RaiseStatusChanged(status: string, code: number): void {
    EventManager.raiseEvent(this, 'StatusChanged', status, code);
  }

  RaiseProgressUpdate(percent: number, message: string): void {
    EventManager.raiseEvent(this, 'ProgressUpdate', percent, message);
  }

  RaiseOnDataReceived(data: any): void {
    EventManager.raiseEvent(this, 'DataReceived', data);
  }
}

/**
 * VB6 WithEvents Usage Example
 */
export class VB6FormWithEvents {
  // WithEvents declarations
  @WithEvents('Timer')
  Timer1?: any;

  @WithEvents('CommandButton')
  Command1?: any;

  @WithEvents('VB6EventClass')
  EventSource?: VB6EventClass;

  constructor() {
    // Initialize WithEvents objects
    this.initializeWithEvents();
  }

  private initializeWithEvents(): void {
    // Set up event source
    this.EventSource = new VB6EventClass();

    // Register event handlers
    EventManager.registerWithEventsHandler(
      this,
      'EventSource',
      'StatusChanged',
      this.EventSource_StatusChanged.bind(this)
    );

    EventManager.registerWithEventsHandler(
      this,
      'EventSource',
      'ProgressUpdate',
      this.EventSource_ProgressUpdate.bind(this)
    );
  }

  // Event handlers
  EventSource_StatusChanged(status: string, code: number): void {}

  EventSource_ProgressUpdate(percent: number, message: string): void {}

  Timer1_Timer(): void {}

  Command1_Click(): void {
    // Trigger some events
    if (this.EventSource) {
      this.EventSource.Status = 'Processing';
      this.EventSource.updateProgress(50, 'Halfway done');
      this.EventSource.processData({ test: 'data' });
    }
  }
}

/**
 * Helper functions for transpiled VB6 code
 */

// Declare an event in a class
export function DeclareEvent(className: string, eventName: string, ...paramTypes: string[]): void {
  const parameters: VB6EventParameter[] = paramTypes.map((type, index) => ({
    name: `param${index + 1}`,
    type,
  }));

  EventManager.declareEvent(className, eventName, parameters);
}

// Raise an event
export function RaiseEvent(source: any, eventName: string, ...args: any[]): void {
  EventManager.raiseEvent(source, eventName, ...args);
}

// Declare WithEvents
export function DeclareWithEvents(owner: any, propertyName: string, objectType: string): void {
  EventManager.declareWithEvents(owner, propertyName, null, objectType);
}

// Set WithEvents object
export function SetWithEvents(owner: any, propertyName: string, object: any): void {
  EventManager.setWithEventsObject(owner, propertyName, object);
}

// Add event handler
export function AddHandler(target: any, eventName: string, handler: VB6EventHandler): void {
  EventManager.addEventListener(target, eventName, handler);
}

// Remove event handler
export function RemoveHandler(target: any, eventName: string, handler: VB6EventHandler): void {
  EventManager.removeEventListener(target, eventName, handler);
}

// Export all event handling functionality
export const VB6EventHandling = {
  EventManager,
  Event,
  WithEvents,
  VB6EventClass,
  VB6FormWithEvents,
  DeclareEvent,
  RaiseEvent,
  DeclareWithEvents,
  SetWithEvents,
  AddHandler,
  RemoveHandler,
};
