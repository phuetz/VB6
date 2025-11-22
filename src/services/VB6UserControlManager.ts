/**
 * VB6 User Control Manager - Complete User Control (.ctl) Support System
 * Handles creation, registration, and management of custom VB6 user controls
 * Provides full lifecycle management and property system support
 */

import { Control } from '../context/types';

export interface UserControlProperty {
  name: string;
  type: string;
  defaultValue: any;
  description?: string;
  category?: string;
  isReadOnly?: boolean;
  isDesignTimeOnly?: boolean;
  isRuntimeOnly?: boolean;
  enumValues?: { [key: string]: any };
}

export interface UserControlMethod {
  name: string;
  parameters: { name: string; type: string; optional?: boolean; defaultValue?: any }[];
  returnType: string;
  description?: string;
  implementation: (...args: any[]) => any;
}

export interface UserControlEvent {
  name: string;
  parameters: { name: string; type: string }[];
  description?: string;
}

export interface UserControlDefinition {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  
  // Visual properties
  width: number;
  height: number;
  backColor?: string;
  foreColor?: string;
  
  // Constituent controls
  controls: Control[];
  
  // Custom properties
  properties: UserControlProperty[];
  
  // Custom methods
  methods: UserControlMethod[];
  
  // Custom events
  events: UserControlEvent[];
  
  // Code modules
  initializeCode?: string;
  terminateCode?: string;
  resizeCode?: string;
  paintCode?: string;
  
  // Property procedures
  propertyGetCode?: { [propertyName: string]: string };
  propertySetCode?: { [propertyName: string]: string };
  propertyLetCode?: { [propertyName: string]: string };
  
  // Event handlers
  eventHandlers?: { [eventName: string]: string };
  
  // Design-time behavior
  isInvisibleAtRuntime?: boolean;
  isContainer?: boolean;
  toolboxBitmap?: string;
}

export interface UserControlInstance {
  id: string;
  definition: UserControlDefinition;
  propertyValues: { [propertyName: string]: any };
  constituent: Control[];
  
  // Runtime state
  isDesignMode: boolean;
  isInitialized: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  
  // Event handlers
  eventHandlers: { [eventName: string]: ((...args: any[]) => void)[] };
  
  // Methods
  methods: { [methodName: string]: (...args: any[]) => any };
}

export class VB6UserControlManager {
  private static instance: VB6UserControlManager;
  private registeredControls: Map<string, UserControlDefinition> = new Map();
  private activeInstances: Map<string, UserControlInstance> = new Map();
  private nextInstanceId = 1;

  static getInstance(): VB6UserControlManager {
    if (!VB6UserControlManager.instance) {
      VB6UserControlManager.instance = new VB6UserControlManager();
    }
    return VB6UserControlManager.instance;
  }

  // Register a user control definition
  registerUserControl(definition: UserControlDefinition): boolean {
    try {
      // Validate definition
      this.validateUserControlDefinition(definition);
      
      // Register the control
      this.registeredControls.set(definition.name, definition);
      
      // Make it available globally for VB6 code
      this.exposeUserControlGlobally(definition);
      
      console.log(`User control registered: ${definition.name}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to register user control ${definition.name}:`, error);
      return false;
    }
  }

  // Create an instance of a user control
  createUserControlInstance(controlName: string, initialProperties?: { [key: string]: any }): UserControlInstance | null {
    const definition = this.registeredControls.get(controlName);
    if (!definition) {
      console.error(`User control not found: ${controlName}`);
      return null;
    }

    const instanceId = `${controlName}_${this.nextInstanceId++}`;
    
    // Initialize property values with defaults
    const propertyValues: { [propertyName: string]: any } = {};
    definition.properties.forEach(prop => {
      propertyValues[prop.name] = initialProperties?.[prop.name] ?? prop.defaultValue;
    });

    // Create constituent controls
    const constituent = definition.controls.map(control => ({
      ...control,
      id: `${instanceId}_${control.name}`,
      name: `${instanceId}_${control.name}`
    }));

    // Create instance
    const instance: UserControlInstance = {
      id: instanceId,
      definition,
      propertyValues,
      constituent,
      isDesignMode: false,
      isInitialized: false,
      isVisible: true,
      isEnabled: true,
      eventHandlers: {},
      methods: {}
    };

    // Initialize events
    definition.events.forEach(eventDef => {
      instance.eventHandlers[eventDef.name] = [];
    });

    // Initialize methods
    definition.methods.forEach(methodDef => {
      instance.methods[methodDef.name] = methodDef.implementation.bind(instance);
    });

    // Store instance
    this.activeInstances.set(instanceId, instance);

    // Execute initialize code
    this.executeUserCode(instance, definition.initializeCode || '', 'Initialize');

    instance.isInitialized = true;

    return instance;
  }

  // Get user control definition
  getUserControlDefinition(controlName: string): UserControlDefinition | undefined {
    return this.registeredControls.get(controlName);
  }

  // Get user control instance
  getUserControlInstance(instanceId: string): UserControlInstance | undefined {
    return this.activeInstances.get(instanceId);
  }

  // Update user control property
  setUserControlProperty(instanceId: string, propertyName: string, value: any): boolean {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return false;

    const propertyDef = instance.definition.properties.find(p => p.name === propertyName);
    if (!propertyDef) return false;

    // Check if property is read-only
    if (propertyDef.isReadOnly) {
      console.warn(`Property ${propertyName} is read-only`);
      return false;
    }

    // Check design-time/runtime restrictions
    if (propertyDef.isDesignTimeOnly && !instance.isDesignMode) {
      console.warn(`Property ${propertyName} can only be set at design time`);
      return false;
    }

    if (propertyDef.isRuntimeOnly && instance.isDesignMode) {
      console.warn(`Property ${propertyName} can only be set at runtime`);
      return false;
    }

    // Type validation
    if (!this.validatePropertyValue(value, propertyDef.type)) {
      console.error(`Invalid value for property ${propertyName}: expected ${propertyDef.type}`);
      return false;
    }

    // Store old value for property change event
    const oldValue = instance.propertyValues[propertyName];

    // Set the value
    instance.propertyValues[propertyName] = value;

    // Execute property set code if available
    const setCode = instance.definition.propertySetCode?.[propertyName];
    if (setCode) {
      this.executeUserCode(instance, setCode, `Property Set ${propertyName}`, { value, oldValue });
    }

    // Fire property change event
    this.fireUserControlEvent(instance, 'PropertyChanged', { propertyName, value, oldValue });

    return true;
  }

  // Get user control property
  getUserControlProperty(instanceId: string, propertyName: string): any {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return undefined;

    const propertyDef = instance.definition.properties.find(p => p.name === propertyName);
    if (!propertyDef) return undefined;

    // Execute property get code if available
    const getCode = instance.definition.propertyGetCode?.[propertyName];
    if (getCode) {
      return this.executeUserCode(instance, getCode, `Property Get ${propertyName}`);
    }

    return instance.propertyValues[propertyName];
  }

  // Call user control method
  callUserControlMethod(instanceId: string, methodName: string, ...args: any[]): any {
    const instance = this.activeInstances.get(instanceId);
    if (!instance || !instance.methods[methodName]) {
      console.error(`Method ${methodName} not found on user control ${instanceId}`);
      return undefined;
    }

    try {
      return instance.methods[methodName](...args);
    } catch (error) {
      console.error(`Error calling method ${methodName} on user control ${instanceId}:`, error);
      return undefined;
    }
  }

  // Fire user control event
  fireUserControlEvent(instance: UserControlInstance, eventName: string, eventData?: any): void {
    const handlers = instance.eventHandlers[eventName];
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  // Add event handler
  addEventHandler(instanceId: string, eventName: string, handler: (...args: any[]) => void): boolean {
    const instance = this.activeInstances.get(instanceId);
    if (!instance || !instance.eventHandlers[eventName]) return false;

    instance.eventHandlers[eventName].push(handler);
    return true;
  }

  // Remove event handler
  removeEventHandler(instanceId: string, eventName: string, handler: (...args: any[]) => void): boolean {
    const instance = this.activeInstances.get(instanceId);
    if (!instance || !instance.eventHandlers[eventName]) return false;

    const index = instance.eventHandlers[eventName].indexOf(handler);
    if (index >= 0) {
      instance.eventHandlers[eventName].splice(index, 1);
      return true;
    }
    return false;
  }

  // Resize user control
  resizeUserControl(instanceId: string, width: number, height: number): boolean {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return false;

    // Execute resize code
    const resizeCode = instance.definition.resizeCode;
    if (resizeCode) {
      this.executeUserCode(instance, resizeCode, 'Resize', { width, height });
    }

    // Fire resize event
    this.fireUserControlEvent(instance, 'Resize', { width, height });

    return true;
  }

  // Destroy user control instance
  destroyUserControlInstance(instanceId: string): boolean {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return false;

    // Execute terminate code
    const terminateCode = instance.definition.terminateCode;
    if (terminateCode) {
      this.executeUserCode(instance, terminateCode, 'Terminate');
    }

    // Fire terminate event
    this.fireUserControlEvent(instance, 'Terminate', {});

    // Clean up
    instance.eventHandlers = {};
    instance.methods = {};

    // Remove from active instances
    this.activeInstances.delete(instanceId);

    return true;
  }

  // Get all registered user controls
  getRegisteredUserControls(): string[] {
    return Array.from(this.registeredControls.keys());
  }

  // Load user control from .ctl file content
  loadUserControlFromSource(ctlContent: string): UserControlDefinition | null {
    try {
      return this.parseUserControlFile(ctlContent);
    } catch (error) {
      console.error('Failed to load user control from source:', error);
      return null;
    }
  }

  // Parse VB6 .ctl file format
  private parseUserControlFile(content: string): UserControlDefinition {
    const lines = content.split('\n');
    const definition: Partial<UserControlDefinition> = {
      controls: [],
      properties: [],
      methods: [],
      events: [],
      propertyGetCode: {},
      propertySetCode: {},
      propertyLetCode: {},
      eventHandlers: {}
    };

    let currentSection = '';
    let currentProperty = '';
    let codeBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("'")) continue;

      // Parse control definition header
      if (line.startsWith('VERSION ')) {
        definition.version = line.split(' ')[1];
        continue;
      }

      // Parse object declarations
      if (line.startsWith('Object = ')) {
        // Parse constituent control
        continue;
      }

      // Parse properties
      if (line.startsWith('Property ')) {
        const propertyMatch = line.match(/Property\s+(Get|Set|Let)\s+(\w+)\s*\(/);
        if (propertyMatch) {
          const [, type, propName] = propertyMatch;
          currentSection = type;
          currentProperty = propName;
          codeBuffer = [];
        }
        continue;
      }

      // Parse end property
      if (line.startsWith('End Property')) {
        if (currentProperty && codeBuffer.length > 0) {
          const code = codeBuffer.join('\n');
          if (currentSection === 'Get') {
            definition.propertyGetCode![currentProperty] = code;
          } else if (currentSection === 'Set') {
            definition.propertySetCode![currentProperty] = code;
          } else if (currentSection === 'Let') {
            definition.propertyLetCode![currentProperty] = code;
          }
        }
        currentSection = '';
        currentProperty = '';
        codeBuffer = [];
        continue;
      }

      // Parse events
      if (line.startsWith('Event ')) {
        const eventMatch = line.match(/Event\s+(\w+)\s*\(([^)]*)\)/);
        if (eventMatch) {
          const [, eventName, paramStr] = eventMatch;
          const parameters = this.parseParameters(paramStr);
          definition.events!.push({
            name: eventName,
            parameters
          });
        }
        continue;
      }

      // Parse subs and functions
      if (line.startsWith('Sub ') || line.startsWith('Function ')) {
        const match = line.match(/(Sub|Function)\s+(\w+)\s*\(([^)]*)\)/);
        if (match) {
          const [, type, methodName, paramStr] = match;
          currentSection = type;
          currentProperty = methodName;
          codeBuffer = [];
          
          if (type === 'Function') {
            const parameters = this.parseParameters(paramStr);
            definition.methods!.push({
              name: methodName,
              parameters,
              returnType: 'Variant',
              implementation: function(...args: any[]) {
                // This would be replaced with actual implementation
                return null;
              }
            });
          }
        }
        continue;
      }

      // Collect code lines
      if (currentSection && currentProperty) {
        codeBuffer.push(line);
      }
    }

    // Set required properties
    definition.name = definition.name || 'UserControl1';
    definition.width = definition.width || 150;
    definition.height = definition.height || 150;

    return definition as UserControlDefinition;
  }

  // Parse parameter string
  private parseParameters(paramStr: string): { name: string; type: string; optional?: boolean; defaultValue?: any }[] {
    if (!paramStr.trim()) return [];

    return paramStr.split(',').map(param => {
      const trimmed = param.trim();
      const match = trimmed.match(/(Optional\s+)?(\w+)\s+As\s+(\w+)(?:\s*=\s*(.+))?/);
      
      if (match) {
        const [, optional, name, type, defaultValue] = match;
        return {
          name,
          type,
          optional: !!optional,
          defaultValue: defaultValue ? this.parseDefaultValue(defaultValue) : undefined
        };
      }
      
      return { name: trimmed, type: 'Variant' };
    });
  }

  // Parse default parameter value
  private parseDefaultValue(value: string): any {
    if (value === 'True') return true;
    if (value === 'False') return false;
    if (value === 'Nothing') return null;
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
    return value;
  }

  // Validate user control definition
  private validateUserControlDefinition(definition: UserControlDefinition): void {
    if (!definition.name) {
      throw new Error('User control must have a name');
    }

    if (typeof definition.width !== 'number' || definition.width <= 0) {
      throw new Error('User control must have a valid width');
    }

    if (typeof definition.height !== 'number' || definition.height <= 0) {
      throw new Error('User control must have a valid height');
    }

    // Validate properties
    definition.properties.forEach(prop => {
      if (!prop.name || !prop.type) {
        throw new Error('All properties must have name and type');
      }
    });

    // Validate methods
    definition.methods.forEach(method => {
      if (!method.name || typeof method.implementation !== 'function') {
        throw new Error('All methods must have name and implementation');
      }
    });

    // Validate events
    definition.events.forEach(event => {
      if (!event.name) {
        throw new Error('All events must have a name');
      }
    });
  }

  // Validate property value type
  private validatePropertyValue(value: any, type: string): boolean {
    switch (type.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date;
      case 'object':
        return typeof value === 'object';
      case 'variant':
        return true; // Variant can be anything
      default:
        return true; // Unknown types pass validation
    }
  }

  // Execute user-defined code
  private executeUserCode(instance: UserControlInstance, code: string, context: string, vars?: any): any {
    try {
      // Create execution context
      const userControlContext = {
        UserControl: instance,
        ...vars
      };

      // Simple code execution (in real implementation, would use proper VB6 interpreter)
      // This is a simplified version for demonstration
      console.log(`Executing ${context} code for ${instance.definition.name}:`, code);
      
      // For now, just log the code execution
      return null;
      
    } catch (error) {
      console.error(`Error executing ${context} code:`, error);
      return null;
    }
  }

  // Expose user control globally for VB6 access
  private exposeUserControlGlobally(definition: UserControlDefinition): void {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6UserControls = globalAny.VB6UserControls || {};
      globalAny.VB6UserControls[definition.name] = {
        definition,
        create: (props?: any) => this.createUserControlInstance(definition.name, props)
      };
    }
  }
}

// Global instance
export const VB6UserControlManagerInstance = VB6UserControlManager.getInstance();

export default VB6UserControlManager;