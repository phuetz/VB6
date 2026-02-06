// Browser Polyfills for Node.js modules - SIMPLIFIED VERSION
// Minimal polyfills to ensure startup compatibility
// Buffer polyfill - returns proper Uint8Array instances
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  const BufferPolyfill = {
    from(data: any, encoding?: string): Uint8Array {
      if (data === null || data === undefined) {
        return new Uint8Array(0);
      }

      if (typeof data === 'string') {
        const encoded = new TextEncoder().encode(data);
        return new Uint8Array(encoded);
      }

      if (Array.isArray(data)) {
        return new Uint8Array(data);
      }

      if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
      }

      if (data instanceof Uint8Array) {
        return new Uint8Array(data);
      }

      // Try to use it as array-like
      try {
        return new Uint8Array(data);
      } catch {
        return new Uint8Array(0);
      }
    },

    alloc(size: number, fill?: number | string | Uint8Array): Uint8Array {
      const buffer = new Uint8Array(size);

      if (fill !== undefined) {
        if (typeof fill === 'number') {
          buffer.fill(fill);
        } else if (typeof fill === 'string') {
          const encoded = new TextEncoder().encode(fill);
          for (let i = 0; i < size; i++) {
            buffer[i] = encoded[i % encoded.length];
          }
        } else if (fill instanceof Uint8Array) {
          for (let i = 0; i < size; i++) {
            buffer[i] = fill[i % fill.length];
          }
        }
      }

      return buffer;
    },

    allocUnsafe(size: number): Uint8Array {
      return new Uint8Array(size);
    },

    isBuffer(obj: any): boolean {
      return obj instanceof Uint8Array;
    },

    concat(buffers: Uint8Array[]): Uint8Array {
      if (!Array.isArray(buffers) || buffers.length === 0) {
        return new Uint8Array(0);
      }

      const totalLength = buffers.reduce((acc, buf) => acc + (buf?.length || 0), 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;

      for (const buf of buffers) {
        if (buf instanceof Uint8Array) {
          result.set(buf, offset);
          offset += buf.length;
        }
      }

      return result;
    },
  };

  globalThis.Buffer = BufferPolyfill as any;
}

// Process polyfill - minimal implementation
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = {
    env: { NODE_ENV: 'development' },
    platform: 'browser',
    version: '1.0.0',
    browser: true,
    nextTick: (callback: () => void) => setTimeout(callback, 0),
    cwd: () => '/',
    exit: () => {},
  };
}

// Util polyfill - minimal implementation
if (typeof globalThis !== 'undefined' && !globalThis.util) {
  globalThis.util = {
    inspect: (obj: any) => {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return String(obj);
      }
    },
    format: (f: string, ...args: any[]) => f, // Simplified format
  };
}

// Safe utility functions required by tests
if (typeof globalThis !== 'undefined') {
  // Safe property access with fallback
  globalThis.safeAccess = (obj: any, path: string, fallback?: any): any => {
    if (!obj || typeof path !== 'string') return fallback;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return fallback;
      }
      current = current[key];
    }

    return current !== undefined ? current : fallback;
  };

  // Safe JSON parsing with fallback
  globalThis.safeJSONParse = (json: string, fallback?: any): any => {
    if (typeof json !== 'string') return fallback;

    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  };

  // Safe JSON stringifying with fallback
  globalThis.safeJSONStringify = (obj: any, fallback?: string): string => {
    try {
      return JSON.stringify(obj);
    } catch {
      return fallback !== undefined ? fallback : '{}';
    }
  };

  // Deep freeze object for immutability
  globalThis.deepFreeze = <T>(obj: T): T => {
    if (obj == null || typeof obj !== 'object') return obj;

    Object.freeze(obj);

    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = (obj as any)[prop];
      if (value != null && typeof value === 'object' && !Object.isFrozen(value)) {
        globalThis.deepFreeze(value);
      }
    });

    return obj;
  };
}
export {};
