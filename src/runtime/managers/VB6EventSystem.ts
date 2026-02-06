/**
 * DESIGN PATTERN FIX: Extracted event system from god object
 * Single Responsibility: Event registration, firing, and management
 */

import { EventEmitter } from 'events';
import { VB6Parameter, VB6DataType } from '../types/VB6Types';

export interface VB6Event {
  name: string;
  procedure: string;
  parameters: VB6Parameter[];
  enabled: boolean;
  compiled: boolean;
  module: string;
  priority: number;
}

export interface EventSubscription {
  event: string;
  handler: (...args: any[]) => void | Promise<void>;
  context?: any;
  once: boolean;
  priority: number;
  module?: string;
}

export class VB6EventSystem extends EventEmitter {
  private events: Map<string, VB6Event> = new Map();
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventQueue: Array<{ event: string; args: any[]; timestamp: number }> = [];
  private processing = false;
  private maxQueueSize = 1000;

  constructor() {
    super();
    this.setMaxListeners(0); // Remove limit for VB6 compatibility
  }

  /**
   * DESIGN PATTERN FIX: Register VB6 event with validation
   */
  registerEvent(event: VB6Event): void {
    const key = `${event.module}.${event.name}`;

    // DESIGN PATTERN FIX: Validate event before registration
    this.validateEvent(event);

    if (this.events.has(key)) {
      console.warn(`Event '${key}' already exists, overriding...`);
    }

    this.events.set(key, event);
    this.emit('eventRegistered', event);
  }

  /**
   * DESIGN PATTERN FIX: Subscribe to events with priority support
   */
  subscribeToEvent(
    eventName: string,
    handler: (...args: any[]) => void | Promise<void>,
    options: {
      context?: any;
      once?: boolean;
      priority?: number;
      module?: string;
    } = {}
  ): void {
    const subscription: EventSubscription = {
      event: eventName,
      handler,
      context: options.context,
      once: options.once || false,
      priority: options.priority || 0,
      module: options.module,
    };

    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, []);
    }

    const eventSubs = this.subscriptions.get(eventName)!;
    eventSubs.push(subscription);

    // DESIGN PATTERN FIX: Sort by priority (higher priority first)
    eventSubs.sort((a, b) => b.priority - a.priority);

    this.emit('subscriptionAdded', subscription);
  }

  /**
   * DESIGN PATTERN FIX: Unsubscribe from events
   */
  unsubscribeFromEvent(
    eventName: string,
    handler?: (...args: any[]) => void | Promise<void>
  ): void {
    const eventSubs = this.subscriptions.get(eventName);
    if (!eventSubs) return;

    if (handler) {
      // Remove specific handler
      const index = eventSubs.findIndex(sub => sub.handler === handler);
      if (index !== -1) {
        const removed = eventSubs.splice(index, 1)[0];
        this.emit('subscriptionRemoved', removed);
      }
    } else {
      // Remove all handlers for this event
      const removed = eventSubs.splice(0);
      removed.forEach(sub => this.emit('subscriptionRemoved', sub));
    }

    // Clean up empty subscription arrays
    if (eventSubs.length === 0) {
      this.subscriptions.delete(eventName);
    }
  }

  /**
   * DESIGN PATTERN FIX: Fire event with parameter validation and queuing
   */
  async fireEvent(eventName: string, ...args: any[]): Promise<void> {
    const event = this.getEvent(eventName);

    if (event && !event.enabled) {
      return; // Event is disabled
    }

    // DESIGN PATTERN FIX: Validate parameters if event is registered
    if (event) {
      this.validateEventParameters(event, args);
    }

    // Add to queue for processing
    this.eventQueue.push({
      event: eventName,
      args,
      timestamp: Date.now(),
    });

    // Limit queue size to prevent memory issues
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift(); // Remove oldest event
      console.warn(`Event queue overflow, dropped oldest event`);
    }

    await this.processEventQueue();
  }

  /**
   * DESIGN PATTERN FIX: Process event queue to prevent blocking
   */
  private async processEventQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    try {
      while (this.eventQueue.length > 0) {
        const { event, args } = this.eventQueue.shift()!;
        await this.processEvent(event, args);
      }
    } catch (error) {
      this.emit('eventProcessingError', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * DESIGN PATTERN FIX: Process individual event with error handling
   */
  private async processEvent(eventName: string, args: any[]): Promise<void> {
    const subscriptions = this.subscriptions.get(eventName) || [];
    const toRemove: EventSubscription[] = [];

    for (const subscription of subscriptions) {
      try {
        // Apply context if provided
        if (subscription.context) {
          await subscription.handler.apply(subscription.context, args);
        } else {
          await subscription.handler(...args);
        }

        // Mark for removal if it's a one-time subscription
        if (subscription.once) {
          toRemove.push(subscription);
        }
      } catch (error) {
        this.emit('eventHandlerError', {
          event: eventName,
          subscription,
          error,
          args,
        });
      }
    }

    // Remove one-time subscriptions
    for (const sub of toRemove) {
      this.unsubscribeFromEvent(eventName, sub.handler);
    }

    // Emit to Node.js EventEmitter for compatibility
    this.emit(eventName, ...args);
  }

  /**
   * DESIGN PATTERN FIX: Get registered event information
   */
  getEvent(eventName: string): VB6Event | undefined {
    // Try exact match first
    if (this.events.has(eventName)) {
      return this.events.get(eventName);
    }

    // Try partial match (module.event format)
    for (const [key, event] of this.events) {
      if (key.endsWith(`.${eventName}`) || event.name === eventName) {
        return event;
      }
    }

    return undefined;
  }

  /**
   * DESIGN PATTERN FIX: Check if event has subscribers
   */
  hasSubscribers(eventName: string): boolean {
    const subscriptions = this.subscriptions.get(eventName);
    return subscriptions ? subscriptions.length > 0 : false;
  }

  /**
   * DESIGN PATTERN FIX: Get all registered events
   */
  getAllEvents(): VB6Event[] {
    return Array.from(this.events.values());
  }

  /**
   * DESIGN PATTERN FIX: Get event statistics
   */
  getEventStats(): {
    registeredEvents: number;
    totalSubscriptions: number;
    queueLength: number;
    processing: boolean;
  } {
    let totalSubscriptions = 0;
    for (const subs of this.subscriptions.values()) {
      totalSubscriptions += subs.length;
    }

    return {
      registeredEvents: this.events.size,
      totalSubscriptions,
      queueLength: this.eventQueue.length,
      processing: this.processing,
    };
  }

  /**
   * DESIGN PATTERN FIX: Enable/disable specific event
   */
  setEventEnabled(eventName: string, enabled: boolean): void {
    const event = this.getEvent(eventName);
    if (event) {
      event.enabled = enabled;
      this.emit('eventStateChanged', { event: eventName, enabled });
    }
  }

  /**
   * DESIGN PATTERN FIX: Clear all events and subscriptions
   */
  clearAll(): void {
    this.events.clear();
    this.subscriptions.clear();
    this.eventQueue.length = 0;
    this.removeAllListeners();
    this.emit('allEventsCleared');
  }

  /**
   * DESIGN PATTERN FIX: Private event validation
   */
  private validateEvent(event: VB6Event): void {
    if (!event.name || event.name.trim() === '') {
      throw new Error('Event name cannot be empty');
    }

    if (!event.module || event.module.trim() === '') {
      throw new Error('Event module cannot be empty');
    }

    if (!event.procedure || event.procedure.trim() === '') {
      throw new Error('Event procedure cannot be empty');
    }

    // Validate parameters
    event.parameters.forEach(param => {
      if (!param.name || param.name.trim() === '') {
        throw new Error('Event parameter name cannot be empty');
      }
    });
  }

  /**
   * DESIGN PATTERN FIX: Validate event parameters match expected signature
   */
  private validateEventParameters(event: VB6Event, args: any[]): void {
    const required = event.parameters.filter(p => !p.isOptional);

    if (args.length < required.length) {
      throw new Error(
        `Event '${event.name}' expects at least ${required.length} parameters, got ${args.length}`
      );
    }

    if (args.length > event.parameters.length && !event.parameters.some(p => p.isParamArray)) {
      throw new Error(
        `Event '${event.name}' expects at most ${event.parameters.length} parameters, got ${args.length}`
      );
    }

    // Type checking for provided parameters
    for (let i = 0; i < Math.min(args.length, event.parameters.length); i++) {
      const param = event.parameters[i];
      const arg = args[i];

      if (!this.isTypeCompatible(arg, param.type)) {
        console.warn(
          `Event '${event.name}' parameter '${param.name}' type mismatch: expected ${VB6DataType[param.type]}, got ${typeof arg}`
        );
      }
    }
  }

  /**
   * DESIGN PATTERN FIX: Type compatibility checking
   */
  private isTypeCompatible(value: any, targetType: VB6DataType): boolean {
    if (targetType === VB6DataType.vbVariant) return true;

    switch (targetType) {
      case VB6DataType.vbInteger:
      case VB6DataType.vbLong:
      case VB6DataType.vbByte:
        return typeof value === 'number' && Number.isInteger(value);
      case VB6DataType.vbSingle:
      case VB6DataType.vbDouble:
        return typeof value === 'number';
      case VB6DataType.vbString:
        return typeof value === 'string';
      case VB6DataType.vbBoolean:
        return typeof value === 'boolean';
      case VB6DataType.vbDate:
        return value instanceof Date;
      default:
        return true; // Allow for now
    }
  }

  /**
   * DESIGN PATTERN FIX: Configure queue size limit
   */
  setMaxQueueSize(size: number): void {
    if (size < 1) {
      throw new Error('Max queue size must be at least 1');
    }
    this.maxQueueSize = size;
  }
}
