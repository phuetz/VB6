/**
 * VB6 DoEvents Implementation
 * Processes pending messages and allows UI to remain responsive
 */

// Message types
export enum VB6MessageType {
  Paint = 'paint',
  Click = 'click',
  KeyPress = 'keypress',
  MouseMove = 'mousemove',
  Resize = 'resize',
  Timer = 'timer',
  Custom = 'custom',
}

// Message structure
export interface VB6Message {
  type: VB6MessageType;
  target?: any;
  data?: any;
  timestamp: number;
  priority: number;
}

// DoEvents configuration
export interface DoEventsConfig {
  maxMessagesPerCycle?: number;
  timeoutMs?: number;
  yieldToUI?: boolean;
  processTimers?: boolean;
  processPaint?: boolean;
}

/**
 * VB6 DoEvents Manager
 * Manages message processing and UI responsiveness
 */
export class VB6DoEventsManager {
  private static instance: VB6DoEventsManager;
  private messageQueue: VB6Message[] = [];
  private isProcessing: boolean = false;
  private isPaused: boolean = false;
  private processCount: number = 0;
  private lastProcessTime: number = 0;
  private animationFrameId: number | null = null;
  private timers: Map<number, NodeJS.Timeout | number> = new Map();
  private nextTimerId: number = 1;
  private config: DoEventsConfig = {
    maxMessagesPerCycle: 100,
    timeoutMs: 16, // ~60fps
    yieldToUI: true,
    processTimers: true,
    processPaint: true,
  };

  private constructor() {
    this.setupEventCapture();
  }

  static getInstance(): VB6DoEventsManager {
    if (!VB6DoEventsManager.instance) {
      VB6DoEventsManager.instance = new VB6DoEventsManager();
    }
    return VB6DoEventsManager.instance;
  }

  /**
   * Main DoEvents function - processes pending messages
   */
  doEvents(): Promise<void> {
    return new Promise(resolve => {
      if (this.isProcessing || this.isPaused) {
        resolve();
        return;
      }

      this.isProcessing = true;
      this.processCount++;

      // Process messages in chunks
      const startTime = performance.now();
      let messagesProcessed = 0;

      while (
        this.messageQueue.length > 0 &&
        messagesProcessed < this.config.maxMessagesPerCycle! &&
        performance.now() - startTime < this.config.timeoutMs!
      ) {
        const message = this.messageQueue.shift()!;
        this.processMessage(message);
        messagesProcessed++;
      }

      // Update last process time
      this.lastProcessTime = performance.now();

      // Yield to browser if configured
      if (this.config.yieldToUI && typeof window !== 'undefined') {
        // Use requestAnimationFrame for smooth UI updates
        this.animationFrameId = requestAnimationFrame(() => {
          this.isProcessing = false;
          this.animationFrameId = null;
          resolve();
        });
      } else if (typeof setImmediate !== 'undefined') {
        // Node.js environment
        setImmediate(() => {
          this.isProcessing = false;
          resolve();
        });
      } else {
        // Fallback to setTimeout
        setTimeout(() => {
          this.isProcessing = false;
          resolve();
        }, 0);
      }
    });
  }

  /**
   * Synchronous DoEvents (blocking version)
   */
  doEventsSync(): void {
    if (this.isProcessing || this.isPaused) {
      return;
    }

    this.isProcessing = true;
    this.processCount++;

    const startTime = performance.now();
    let messagesProcessed = 0;

    while (this.messageQueue.length > 0 && messagesProcessed < this.config.maxMessagesPerCycle!) {
      const message = this.messageQueue.shift()!;
      this.processMessage(message);
      messagesProcessed++;

      // Prevent infinite loops
      if (performance.now() - startTime > this.config.timeoutMs! * 10) {
        console.warn('[VB6 DoEvents] Breaking out of sync processing - timeout');
        break;
      }
    }

    this.lastProcessTime = performance.now();
    this.isProcessing = false;
  }

  /**
   * DoEvents with custom configuration
   */
  async doEventsWithConfig(config: Partial<DoEventsConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    Object.assign(this.config, config);

    try {
      await this.doEvents();
    } finally {
      this.config = oldConfig;
    }
  }

  /**
   * Add message to queue
   */
  postMessage(type: VB6MessageType, target?: any, data?: any, priority: number = 5): void {
    const message: VB6Message = {
      type,
      target,
      data,
      timestamp: performance.now(),
      priority,
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.messageQueue.findIndex(m => m.priority < priority);
    if (insertIndex === -1) {
      this.messageQueue.push(message);
    } else {
      this.messageQueue.splice(insertIndex, 0, message);
    }
  }

  /**
   * Clear message queue
   */
  clearMessages(type?: VB6MessageType): void {
    if (type) {
      this.messageQueue = this.messageQueue.filter(m => m.type !== type);
    } else {
      this.messageQueue = [];
    }
  }

  /**
   * Pause message processing
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume message processing
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Get queue statistics
   */
  getStatistics(): {
    queueLength: number;
    processCount: number;
    isProcessing: boolean;
    isPaused: boolean;
    lastProcessTime: number;
    averageProcessTime: number;
  } {
    return {
      queueLength: this.messageQueue.length,
      processCount: this.processCount,
      isProcessing: this.isProcessing,
      isPaused: this.isPaused,
      lastProcessTime: this.lastProcessTime,
      averageProcessTime: this.lastProcessTime / Math.max(this.processCount, 1),
    };
  }

  /**
   * Create a VB6-style timer
   */
  setTimer(callback: () => void, interval: number): number {
    const timerId = this.nextTimerId++;

    if (typeof window !== 'undefined') {
      const id = window.setInterval(() => {
        if (this.config.processTimers) {
          this.postMessage(VB6MessageType.Timer, null, { callback, timerId }, 8);
        } else {
          callback();
        }
      }, interval);
      this.timers.set(timerId, id);
    } else {
      const id = setInterval(() => {
        if (this.config.processTimers) {
          this.postMessage(VB6MessageType.Timer, null, { callback, timerId }, 8);
        } else {
          callback();
        }
      }, interval);
      this.timers.set(timerId, id);
    }

    return timerId;
  }

  /**
   * Clear a timer
   */
  clearTimer(timerId: number): void {
    const id = this.timers.get(timerId);
    if (id !== undefined) {
      if (typeof window !== 'undefined') {
        window.clearInterval(id as number);
      } else {
        clearInterval(id as NodeJS.Timeout);
      }
      this.timers.delete(timerId);
    }
  }

  /**
   * Force paint/refresh
   */
  refresh(): void {
    if (this.config.processPaint) {
      this.postMessage(VB6MessageType.Paint, null, null, 9);
    }

    if (typeof window !== 'undefined' && window.document) {
      // Force browser repaint
      const body = window.document.body;
      body.style.display = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      body.offsetHeight; // Trigger reflow
      body.style.display = '';
    }
  }

  /**
   * Sleep function using DoEvents
   */
  async sleep(milliseconds: number): Promise<void> {
    const endTime = performance.now() + milliseconds;

    while (performance.now() < endTime) {
      await this.doEvents();

      // Small delay to prevent CPU spinning
      await new Promise(resolve => setTimeout(resolve, Math.min(10, milliseconds / 10)));
    }
  }

  /**
   * Process long operation with DoEvents
   */
  async processLongOperation<T>(
    operation: () => Generator<T, void, unknown>,
    onProgress?: (value: T, index: number) => void
  ): Promise<void> {
    const generator = operation();
    let index = 0;
    let result = generator.next();

    while (!result.done) {
      if (onProgress) {
        onProgress(result.value, index);
      }

      // Process messages periodically
      if (index % 10 === 0) {
        await this.doEvents();
      }

      result = generator.next();
      index++;
    }
  }

  private processMessage(message: VB6Message): void {
    try {
      switch (message.type) {
        case VB6MessageType.Timer:
          if (message.data?.callback) {
            message.data.callback();
          }
          break;

        case VB6MessageType.Paint:
          this.handlePaintMessage(message);
          break;

        case VB6MessageType.Click:
        case VB6MessageType.KeyPress:
        case VB6MessageType.MouseMove:
        case VB6MessageType.Resize:
          this.handleUIMessage(message);
          break;

        case VB6MessageType.Custom:
          if (message.data?.handler) {
            message.data.handler(message);
          }
          break;
      }
    } catch (error) {
      console.error('[VB6 DoEvents] Error processing message:', error);
    }
  }

  private handlePaintMessage(message: VB6Message): void {
    if (message.target && typeof message.target.repaint === 'function') {
      message.target.repaint();
    }
  }

  private handleUIMessage(message: VB6Message): void {
    if (message.target && message.data?.event) {
      // Dispatch event to target
      if (typeof message.target.dispatchEvent === 'function') {
        message.target.dispatchEvent(message.data.event);
      } else if (typeof message.target.handleEvent === 'function') {
        message.target.handleEvent(message.data.event);
      }
    }
  }

  private setupEventCapture(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Capture high-priority events
    const captureEvents = ['click', 'keypress', 'keydown', 'keyup'];

    captureEvents.forEach(eventType => {
      window.addEventListener(
        eventType,
        event => {
          if (this.isPaused) return;

          const messageType = this.mapEventToMessageType(eventType);
          if (messageType) {
            this.postMessage(messageType, event.target, { event }, 7);
          }
        },
        true
      ); // Use capture phase
    });
  }

  private mapEventToMessageType(eventType: string): VB6MessageType | null {
    const mapping: { [key: string]: VB6MessageType } = {
      click: VB6MessageType.Click,
      keypress: VB6MessageType.KeyPress,
      keydown: VB6MessageType.KeyPress,
      keyup: VB6MessageType.KeyPress,
      mousemove: VB6MessageType.MouseMove,
      resize: VB6MessageType.Resize,
    };

    return mapping[eventType] || null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clear all timers
    this.timers.forEach((id, timerId) => {
      this.clearTimer(timerId);
    });
    this.timers.clear();

    // Clear message queue
    this.messageQueue = [];

    // Cancel animation frame
    if (this.animationFrameId !== null && typeof window !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset state
    this.isProcessing = false;
    this.isPaused = false;
    this.processCount = 0;
    this.lastProcessTime = 0;
  }
}

// Global instance
export const DoEventsManager = VB6DoEventsManager.getInstance();

/**
 * Main DoEvents function for VB6 compatibility
 */
export async function DoEvents(): Promise<void> {
  return DoEventsManager.doEvents();
}

/**
 * Synchronous DoEvents
 */
export function DoEventsSync(): void {
  DoEventsManager.doEventsSync();
}

/**
 * Sleep with DoEvents
 */
export async function Sleep(milliseconds: number): Promise<void> {
  return DoEventsManager.sleep(milliseconds);
}

/**
 * Refresh/Repaint
 */
export function Refresh(): void {
  DoEventsManager.refresh();
}

/**
 * VB6 Timer implementation
 */
export class VB6Timer {
  private timerId: number | null = null;
  private _enabled: boolean = false;
  private _interval: number = 1000;
  private _onTimer?: () => void;

  constructor(interval?: number, onTimer?: () => void) {
    if (interval !== undefined) {
      this._interval = interval;
    }
    if (onTimer) {
      this._onTimer = onTimer;
    }
  }

  get Enabled(): boolean {
    return this._enabled;
  }

  set Enabled(value: boolean) {
    if (value !== this._enabled) {
      this._enabled = value;

      if (value) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  get Interval(): number {
    return this._interval;
  }

  set Interval(value: number) {
    this._interval = Math.max(1, value);

    if (this._enabled) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    if (this.timerId === null && this._onTimer) {
      this.timerId = DoEventsManager.setTimer(this._onTimer, this._interval);
      this._enabled = true;
    }
  }

  stop(): void {
    if (this.timerId !== null) {
      DoEventsManager.clearTimer(this.timerId);
      this.timerId = null;
      this._enabled = false;
    }
  }

  dispose(): void {
    this.stop();
    this._onTimer = undefined;
  }
}

/**
 * Example usage of DoEvents in long operations
 */
export class VB6LongOperation {
  private cancelled: boolean = false;

  /**
   * Example: Process large array with DoEvents
   */
  async processLargeArray(array: any[], processor: (item: any) => void): Promise<void> {
    const chunkSize = 100;

    for (let i = 0; i < array.length; i += chunkSize) {
      if (this.cancelled) {
        break;
      }

      // Process chunk
      const chunk = array.slice(i, Math.min(i + chunkSize, array.length));
      chunk.forEach(processor);

      // Update progress
      const progress = Math.round((i / array.length) * 100);

      // Allow UI to update
      await DoEvents();
    }
  }

  /**
   * Example: Fibonacci calculation with DoEvents
   */
  async *calculateFibonacci(n: number): AsyncGenerator<number> {
    let a = 0,
      b = 1;

    for (let i = 0; i < n; i++) {
      if (this.cancelled) {
        return;
      }

      yield a;
      [a, b] = [b, a + b];

      // Process messages every 10 iterations
      if (i % 10 === 0) {
        await DoEvents();
      }
    }
  }

  /**
   * Example: File processing with progress
   */
  async processFiles(
    files: string[],
    processor: (file: string) => Promise<void>,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const total = files.length;

    for (let i = 0; i < total; i++) {
      if (this.cancelled) {
        break;
      }

      // Process file
      await processor(files[i]);

      // Report progress
      if (onProgress) {
        onProgress(i + 1, total);
      }

      // Allow UI updates
      await DoEvents();
    }
  }

  cancel(): void {
    this.cancelled = true;
  }
}

// Export all DoEvents functionality
export const VB6DoEventsAPI = {
  VB6DoEventsManager,
  DoEventsManager,
  DoEvents,
  DoEventsSync,
  Sleep,
  Refresh,
  VB6Timer,
  VB6LongOperation,
  VB6MessageType,
};
