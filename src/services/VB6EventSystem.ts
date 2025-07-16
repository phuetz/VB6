/**
 * VB6 Event System - Complete Event Management
 * Handles all VB6 events with proper propagation and cancellation
 */

export interface VB6Event {
  name: string;
  sender: string;
  timestamp: number;
  data: any;
  cancelled?: boolean;
  bubbles?: boolean;
  cancelable?: boolean;
}

export interface EventHandler {
  id: string;
  controlName: string;
  eventName: string;
  handler: (event: VB6Event) => void | boolean;
  priority?: number;
  once?: boolean;
}

export class VB6EventSystem {
  private static instance: VB6EventSystem;
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventQueue: VB6Event[] = [];
  private isProcessing: boolean = false;
  private eventHistory: VB6Event[] = [];
  private maxHistorySize: number = 1000;
  private globalHandlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  static getInstance(): VB6EventSystem {
    if (!VB6EventSystem.instance) {
      VB6EventSystem.instance = new VB6EventSystem();
    }
    return VB6EventSystem.instance;
  }

  // Register event handler
  on(controlName: string, eventName: string, handler: (event: VB6Event) => void | boolean, options?: {
    priority?: number;
    once?: boolean;
    id?: string;
  }): string {
    const handlerId = options?.id || `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const eventHandler: EventHandler = {
      id: handlerId,
      controlName,
      eventName,
      handler,
      priority: options?.priority || 0,
      once: options?.once || false,
    };

    const key = this.getEventKey(controlName, eventName);
    const handlers = this.handlers.get(key) || [];
    handlers.push(eventHandler);
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    this.handlers.set(key, handlers);
    
    return handlerId;
  }

  // Register global event handler (catches all events of a type)
  onGlobal(eventName: string, handler: (event: VB6Event) => void | boolean, options?: {
    priority?: number;
    once?: boolean;
    id?: string;
  }): string {
    const handlerId = options?.id || `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const eventHandler: EventHandler = {
      id: handlerId,
      controlName: '*',
      eventName,
      handler,
      priority: options?.priority || 0,
      once: options?.once || false,
    };

    const handlers = this.globalHandlers.get(eventName) || [];
    handlers.push(eventHandler);
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.globalHandlers.set(eventName, handlers);
    
    return handlerId;
  }

  // Remove event handler
  off(handlerId: string): boolean {
    // Remove from regular handlers
    for (const [key, handlers] of this.handlers) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.handlers.delete(key);
        }
        return true;
      }
    }

    // Remove from global handlers
    for (const [eventName, handlers] of this.globalHandlers) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.globalHandlers.delete(eventName);
        }
        return true;
      }
    }

    return false;
  }

  // Remove all handlers for a control
  offAll(controlName: string, eventName?: string): void {
    if (eventName) {
      const key = this.getEventKey(controlName, eventName);
      this.handlers.delete(key);
    } else {
      // Remove all events for the control
      const keysToRemove: string[] = [];
      for (const key of this.handlers.keys()) {
        if (key.startsWith(`${controlName}:`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this.handlers.delete(key));
    }
  }

  // Fire an event
  fire(controlName: string, eventName: string, data?: any, options?: {
    bubbles?: boolean;
    cancelable?: boolean;
    async?: boolean;
  }): boolean {
    const event: VB6Event = {
      name: eventName,
      sender: controlName,
      timestamp: Date.now(),
      data: data || {},
      bubbles: options?.bubbles ?? this.getDefaultBubbles(eventName),
      cancelable: options?.cancelable ?? this.getDefaultCancelable(eventName),
    };

    // Add to history
    this.addToHistory(event);

    if (options?.async) {
      // Queue for async processing
      this.eventQueue.push(event);
      this.processQueue();
      return true;
    } else {
      // Process synchronously
      return this.processEvent(event);
    }
  }

  // Process event synchronously
  private processEvent(event: VB6Event): boolean {
    let cancelled = false;

    // Process global handlers first
    const globalHandlers = this.globalHandlers.get(event.name) || [];
    for (const handler of globalHandlers) {
      try {
        const result = handler.handler(event);
        if (result === false && event.cancelable) {
          event.cancelled = true;
          cancelled = true;
          break;
        }
        
        if (handler.once) {
          this.off(handler.id);
        }
      } catch (error) {
        console.error(`Error in global event handler for ${event.name}:`, error);
      }
    }

    if (!cancelled) {
      // Process specific handlers
      const key = this.getEventKey(event.sender, event.name);
      const handlers = this.handlers.get(key) || [];
      
      for (const handler of handlers) {
        try {
          const result = handler.handler(event);
          if (result === false && event.cancelable) {
            event.cancelled = true;
            cancelled = true;
            break;
          }
          
          if (handler.once) {
            this.off(handler.id);
          }
        } catch (error) {
          console.error(`Error in event handler for ${key}:`, error);
        }
      }
    }

    // Handle event bubbling
    if (!cancelled && event.bubbles) {
      // In VB6, events typically bubble to the form
      const parentControl = this.getParentControl(event.sender);
      if (parentControl) {
        return this.fire(parentControl, event.name, event.data, {
          bubbles: true,
          cancelable: event.cancelable,
        });
      }
    }

    return !cancelled;
  }

  // Process event queue asynchronously
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        await new Promise(resolve => {
          setTimeout(() => {
            this.processEvent(event);
            resolve(undefined);
          }, 0);
        });
      }
    }

    this.isProcessing = false;
  }

  // VB6-specific event helpers
  private getDefaultBubbles(eventName: string): boolean {
    // Most VB6 events don't bubble, except for some specific ones
    const bubblingEvents = ['KeyDown', 'KeyUp', 'KeyPress'];
    return bubblingEvents.includes(eventName);
  }

  private getDefaultCancelable(eventName: string): boolean {
    // Many VB6 events are cancelable
    const cancelableEvents = [
      'QueryUnload', 'Unload', 'Validate', 'BeforeUpdate',
      'BeforeLabelEdit', 'BeforeColEdit', 'OLEDragDrop',
      'BeforeDelete', 'BeforeInsert', 'BeforeNavigate'
    ];
    return cancelableEvents.includes(eventName);
  }

  private getParentControl(controlName: string): string | null {
    // This would need to be integrated with the actual control hierarchy
    // For now, return 'Form' as the parent
    return controlName !== 'Form' ? 'Form' : null;
  }

  private getEventKey(controlName: string, eventName: string): string {
    return `${controlName}:${eventName}`;
  }

  private addToHistory(event: VB6Event): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  // Get event history
  getHistory(filter?: {
    controlName?: string;
    eventName?: string;
    startTime?: number;
    endTime?: number;
  }): VB6Event[] {
    let history = [...this.eventHistory];

    if (filter) {
      if (filter.controlName) {
        history = history.filter(e => e.sender === filter.controlName);
      }
      if (filter.eventName) {
        history = history.filter(e => e.name === filter.eventName);
      }
      if (filter.startTime) {
        history = history.filter(e => e.timestamp >= filter.startTime);
      }
      if (filter.endTime) {
        history = history.filter(e => e.timestamp <= filter.endTime);
      }
    }

    return history;
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // VB6 Standard Events
  static readonly StandardEvents = {
    // Mouse Events
    Click: 'Click',
    DblClick: 'DblClick',
    MouseDown: 'MouseDown',
    MouseUp: 'MouseUp',
    MouseMove: 'MouseMove',
    MouseEnter: 'MouseEnter',
    MouseLeave: 'MouseLeave',
    
    // Keyboard Events
    KeyDown: 'KeyDown',
    KeyUp: 'KeyUp',
    KeyPress: 'KeyPress',
    
    // Focus Events
    GotFocus: 'GotFocus',
    LostFocus: 'LostFocus',
    Enter: 'Enter',
    Exit: 'Exit',
    
    // Form Events
    Load: 'Load',
    Unload: 'Unload',
    QueryUnload: 'QueryUnload',
    Activate: 'Activate',
    Deactivate: 'Deactivate',
    Initialize: 'Initialize',
    Terminate: 'Terminate',
    Resize: 'Resize',
    Paint: 'Paint',
    
    // Data Events
    Change: 'Change',
    Validate: 'Validate',
    Updated: 'Updated',
    BeforeUpdate: 'BeforeUpdate',
    AfterUpdate: 'AfterUpdate',
    
    // List/Grid Events
    ItemClick: 'ItemClick',
    ItemCheck: 'ItemCheck',
    SelChange: 'SelChange',
    Scroll: 'Scroll',
    ColumnClick: 'ColumnClick',
    HeadClick: 'HeadClick',
    RowColChange: 'RowColChange',
    
    // Tree Events
    NodeClick: 'NodeClick',
    NodeCheck: 'NodeCheck',
    Expand: 'Expand',
    Collapse: 'Collapse',
    BeforeLabelEdit: 'BeforeLabelEdit',
    AfterLabelEdit: 'AfterLabelEdit',
    
    // OLE Events
    OLEStartDrag: 'OLEStartDrag',
    OLEDragOver: 'OLEDragOver',
    OLEDragDrop: 'OLEDragDrop',
    OLECompleteDrag: 'OLECompleteDrag',
    OLEGiveFeedback: 'OLEGiveFeedback',
    OLESetData: 'OLESetData',
    
    // Timer Event
    Timer: 'Timer',
    
    // Error Event
    Error: 'Error',
  };

  // Create event with VB6 parameters
  createMouseEvent(button: number, shift: number, x: number, y: number): any {
    return {
      button, // 1=Left, 2=Right, 4=Middle
      shift,  // 1=Shift, 2=Ctrl, 4=Alt
      x,
      y,
    };
  }

  createKeyEvent(keyCode: number, shift: number): any {
    return {
      keyCode,
      shift, // 1=Shift, 2=Ctrl, 4=Alt
    };
  }

  createKeyPressEvent(keyAscii: number): any {
    return {
      keyAscii,
    };
  }

  createCancelableEvent(cancel: boolean = false): any {
    return {
      cancel,
    };
  }

  // Event batching for performance
  batch(callback: () => void): void {
    const originalAsync = this.eventQueue.length > 0;
    const batchedEvents: VB6Event[] = [];
    
    // Temporarily redirect events to batch
    const originalFire = this.fire.bind(this);
    this.fire = (controlName, eventName, data, options) => {
      const event: VB6Event = {
        name: eventName,
        sender: controlName,
        timestamp: Date.now(),
        data: data || {},
        bubbles: options?.bubbles ?? this.getDefaultBubbles(eventName),
        cancelable: options?.cancelable ?? this.getDefaultCancelable(eventName),
      };
      batchedEvents.push(event);
      return true;
    };

    // Execute callback
    callback();

    // Restore original fire method
    this.fire = originalFire;

    // Process batched events
    batchedEvents.forEach(event => {
      this.eventQueue.push(event);
    });

    if (!originalAsync) {
      this.processQueue();
    }
  }
}

// Global event system instance
export const eventSystem = VB6EventSystem.getInstance();

// React hook for using events
export function useVB6Events(controlName: string) {
  const fire = (eventName: string, data?: any, options?: any) => {
    return eventSystem.fire(controlName, eventName, data, options);
  };

  const on = (eventName: string, handler: (event: VB6Event) => void | boolean, options?: any) => {
    return eventSystem.on(controlName, eventName, handler, options);
  };

  const off = (handlerId: string) => {
    return eventSystem.off(handlerId);
  };

  return { fire, on, off };
}