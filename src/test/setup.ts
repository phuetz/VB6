import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Ensure Array.isArray is always available
if (typeof Array.isArray !== 'function') {
  (Array as any).isArray = function(obj: any): obj is any[] {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };
}

// Patch Error handling to prevent serialization issues in vitest
// This prevents the 'Cannot read properties of undefined (reading 'length')' error
const originalToString = Error.prototype.toString;
Object.defineProperty(Error.prototype, 'toString', {
  value: function(this: any) {
    try {
      if (typeof originalToString === 'function') {
        return originalToString.call(this);
      }
    } catch (e) {
      // Fallback if toString fails
    }
    return `${this.constructor?.name || 'Error'}: ${this.message || ''}`;
  },
  writable: false,
  configurable: true
});


// Setup process global before anything else
if (typeof global.process === 'undefined' || global.process.platform !== 'browser') {
  global.process = {
    env: { NODE_ENV: 'test' },
    browser: true,
    nextTick: (fn: () => void) => setTimeout(fn, 0),
    cwd: () => '/',
    exit: () => {},
    versions: {
      node: '16.0.0',
      v8: '9.0.0'
    },
    platform: 'browser',
    pid: 1,
    title: 'browser',
    argv: [],
    hrtime: {
      bigint: () => BigInt(Date.now() * 1000000)
    },
    listeners: vi.fn().mockReturnValue([]),
    listenerCount: vi.fn().mockReturnValue(0),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
    emit: vi.fn(),
    prependListener: vi.fn(),
    prependOnceListener: vi.fn(),
    setMaxListeners: vi.fn(),
    getMaxListeners: vi.fn().mockReturnValue(10),
    rawListeners: vi.fn().mockReturnValue([]),
    eventNames: vi.fn().mockReturnValue([]),
  } as any;
}

// Setup import.meta mock
if (typeof globalThis.import === 'undefined') {
  Object.defineProperty(globalThis, 'import', {
    value: {
      meta: {
        url: 'file:///test/',
        resolve: (id: string) => 'file:///test/' + id
      }
    },
    configurable: true
  });
}

// Setup Worker mock for tests - use function constructor to avoid instanceof issues
function WorkerMock(url: string | URL, options?: WorkerOptions) {
  // Handle URL object properly
  let urlString: string;
  if (typeof url === 'string') {
    urlString = url;
  } else if (typeof url === 'object' && url !== null && 'href' in url) {
    urlString = (url as any).href;
  } else {
    urlString = String(url);
  }

  // Mock worker for test environment
  this.postMessage = vi.fn();
  this.terminate = vi.fn();
  this.addEventListener = vi.fn();
  this.removeEventListener = vi.fn();
  this.onmessage = null;
  this.onerror = null;

  setTimeout(() => {
    // Simulate worker ready message
    if (this.onmessage) {
      this.onmessage({ data: { type: 'ready' } } as any);
    }
  }, 0);
}

WorkerMock.prototype.postMessage = vi.fn();
WorkerMock.prototype.terminate = vi.fn();
WorkerMock.prototype.addEventListener = vi.fn();
WorkerMock.prototype.removeEventListener = vi.fn();

global.Worker = WorkerMock as any;

// Setup Buffer global - returns proper Uint8Array instances
// Force override to ensure we use our polyfill in tests (not Node.js Buffer)
{
  // Create a Buffer constructor-like function
  function BufferPolyfill(data?: any, encodingOrSize?: any, fill?: any): any {
    // Handle Buffer.from(), Buffer.alloc() patterns
    return new Uint8Array(0);
  }

  // Add static methods to BufferPolyfill
  BufferPolyfill.from = function(data: any, encoding?: string): Uint8Array {
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
  };

  BufferPolyfill.alloc = function(size: number, fill?: number | string | Uint8Array): Uint8Array {
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
  };

  BufferPolyfill.allocUnsafe = function(size: number): Uint8Array {
    return new Uint8Array(size);
  };

  BufferPolyfill.isBuffer = function(obj: any): boolean {
    return obj instanceof Uint8Array;
  };

  BufferPolyfill.concat = function(buffers: Uint8Array[]): Uint8Array {
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
  };

  global.Buffer = BufferPolyfill as any;
}

// Setup util global
if (typeof global.util === 'undefined') {
  global.util = {
    format: (format?: string, ...args: any[]) => {
      if (!format) return '';
      let result = format;
      let argIndex = 0;
      result = result.replace(/%[sdj%]/g, (match) => {
        if (match === '%%') return '%';
        if (argIndex >= args.length) return match;
        const arg = args[argIndex++];
        switch (match) {
          case '%s': return String(arg);
          case '%d': return Number(arg).toString();
          case '%j': return JSON.stringify(arg);
          default: return match;
        }
      });
      if (args.length > argIndex) {
        return result + ' ' + args.slice(argIndex).join(' ');
      }
      return result;
    },
    inspect: (obj: any) => {
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return String(obj);
      }
    },
    isArray: Array.isArray,
    isString: (val: any) => typeof val === 'string',
    isNumber: (val: any) => typeof val === 'number',
    isObject: (val: any) => val !== null && typeof val === 'object',
    inherits: (ctor: any, superCtor: any) => {
      if (superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    },
    deprecate: (fn: (...args: any[]) => any, msg: string) => {
      const warned = new Set();
      return function(...args: any[]) {
        const key = msg;
        if (!warned.has(key)) {
          warned.add(key);
          console.warn(`(node) ${msg}`);
        }
        return fn.apply(this, args);
      };
    },
    debuglog: (section: string) => {
      const enabled = false; // Could check DEBUG env var
      return enabled 
        ? (...args: any[]) => console.log(`${section} ${process.pid}:`, ...args)
        : () => {};
    }
  } as any;
}

// Also set on window for browser compatibility
(window as any).process = global.process;
(window as any).Buffer = global.Buffer;
(window as any).util = global.util;

// Global mocks
beforeEach(() => {
  // Mock window.matchMedia - ensure it's available immediately
  const matchMediaMock = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  });
  
  // Also set on global for consistency
  if (typeof global !== 'undefined') {
    (global as any).matchMedia = matchMediaMock;
  }

  // Mock ResizeObserver - use function constructor to avoid instanceof issues
  function ResizeObserverMock() {
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  global.ResizeObserver = ResizeObserverMock as any;

  // Mock IntersectionObserver - use function constructor to avoid instanceof issues
  function IntersectionObserverMock() {
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  global.IntersectionObserver = IntersectionObserverMock as any;

  // Mock localStorage - actual implementation that stores data
  const localStorageData = new Map<string, string>();
  const localStorageMock = {
    getItem: vi.fn((key: string) => localStorageData.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => localStorageData.set(key, value)),
    removeItem: vi.fn((key: string) => localStorageData.delete(key)),
    clear: vi.fn(() => localStorageData.clear()),
    length: 0,
    key: vi.fn((index: number) => {
      const keys = Array.from(localStorageData.keys());
      return keys[index] ?? null;
    }),
  };

  Object.defineProperty(localStorageMock, 'length', {
    get: () => localStorageData.size,
    configurable: true,
  });

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock sessionStorage - use same implementation
  const sessionStorageData = new Map<string, string>();
  const sessionStorageMock = {
    getItem: vi.fn((key: string) => sessionStorageData.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => sessionStorageData.set(key, value)),
    removeItem: vi.fn((key: string) => sessionStorageData.delete(key)),
    clear: vi.fn(() => sessionStorageData.clear()),
    length: 0,
    key: vi.fn((index: number) => {
      const keys = Array.from(sessionStorageData.keys());
      return keys[index] ?? null;
    }),
  };

  Object.defineProperty(sessionStorageMock, 'length', {
    get: () => sessionStorageData.size,
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Mock URL class and related methods - use function constructor to avoid instanceof issues
  if (typeof global.URL === 'undefined' || !global.URL.createObjectURL) {
    function MockURL(url: string | URL, base?: string | URL) {
      // Validate input - throw for invalid URLs like real URL does
      if (!url) {
        throw new TypeError('Invalid URL');
      }

      // Handle different input types safely
      let urlString: string;
      if (typeof url === 'string') {
        urlString = url;
      } else if (url && typeof url === 'object' && 'href' in url) {
        urlString = (url as any).href;
      } else {
        urlString = String(url);
      }

      // Validate URL format
      if (!urlString || urlString.trim() === '') {
        throw new TypeError('Invalid URL');
      }

      // Parse URL properly
      const httpMatch = urlString.match(/^(https?):\/\/([^/?#:]+)(:\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
      const fileMatch = urlString.match(/^file:\/\/\/(.*)/);

      if (httpMatch) {
        this.protocol = httpMatch[1] + ':';
        this.hostname = httpMatch[2];
        this.port = httpMatch[3] ? httpMatch[3].substring(1) : '';
        this.pathname = httpMatch[4] || '/';
        this.search = httpMatch[5] || '';
        this.hash = httpMatch[6] || '';
        this.host = this.hostname + (this.port ? ':' + this.port : '');
        this.origin = `${this.protocol}//${this.host}`;
        this.href = urlString;
      } else if (fileMatch) {
        this.protocol = 'file:';
        this.hostname = '';
        this.port = '';
        this.pathname = '/' + fileMatch[1];
        this.search = '';
        this.hash = '';
        this.host = '';
        this.origin = 'file://';
        this.href = urlString;
      } else if (base) {
        // Try to resolve relative URL with base
        const baseUrl = typeof base === 'string' ? new (MockURL as any)(base) : base;
        this.protocol = (baseUrl as any).protocol;
        this.hostname = (baseUrl as any).hostname;
        this.port = (baseUrl as any).port;
        this.pathname = urlString.startsWith('/') ? urlString : (baseUrl as any).pathname + '/' + urlString;
        this.search = '';
        this.hash = '';
        this.host = (baseUrl as any).host;
        this.origin = (baseUrl as any).origin;
        this.href = this.origin + this.pathname;
      } else {
        // For anything else that doesn't look like a valid URL, throw error
        // Only accept file paths that start with / or ./ or ../
        if (urlString.match(/^([./]|\.\.\/)/)) {
          this.href = `file:///${urlString.replace(/^[./]*/, '')}`;
          this.origin = 'file://';
          this.pathname = '/' + urlString.replace(/^[./]*/, '');
          this.search = '';
          this.hash = '';
          this.protocol = 'file:';
          this.hostname = '';
          this.port = '';
          this.host = '';
        } else {
          // Invalid URL format - throw error like real URL constructor
          throw new TypeError('Invalid URL');
        }
      }
    }

    MockURL.prototype.toString = function() {
      return this.href;
    };

    MockURL.prototype.toJSON = function() {
      return this.href;
    };

    (MockURL as any).createObjectURL = vi.fn(() => 'mocked-url');
    (MockURL as any).revokeObjectURL = vi.fn();

    global.URL = MockURL as any;
  } else {
    global.URL.createObjectURL = vi.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = vi.fn();
  }

  // Mock fetch
  global.fetch = vi.fn();

  // Mock crypto
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: vi.fn().mockImplementation((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
    },
    writable: true,
  });

  // Mock performance
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
    },
    writable: true,
  });

  // Setup Monaco Editor mock
  global.monaco = {
    editor: {
      create: vi.fn(() => ({
        setValue: vi.fn(),
        getValue: vi.fn(() => ''),
        getModel: vi.fn(() => ({
          onDidChangeContent: vi.fn(),
          dispose: vi.fn()
        })),
        dispose: vi.fn(),
        onDidChangeModelContent: vi.fn(),
        focus: vi.fn(),
        updateOptions: vi.fn()
      })),
      defineTheme: vi.fn(),
      setTheme: vi.fn()
    },
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      setLanguageConfiguration: vi.fn(),
      registerCompletionItemProvider: vi.fn()
    }
  };
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
  });
  global.cancelAnimationFrame = vi.fn();

  // Helper function to convert hex color to RGBA
  const colorToRGBA = (color: string): { r: number; g: number; b: number; a: number } => {
    // Handle #RRGGBB format
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
          a: 255
        };
      }
    }
    // Handle rgb() format
    if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
      const match = color.match(/[\d.]+/g);
      if (match && match.length >= 3) {
        return {
          r: Math.floor(parseFloat(match[0])),
          g: Math.floor(parseFloat(match[1])),
          b: Math.floor(parseFloat(match[2])),
          a: match.length > 3 ? Math.floor(parseFloat(match[3]) * 255) : 255
        };
      }
    }
    // Default to black
    return { r: 0, g: 0, b: 0, a: 255 };
  };

  // Mock HTMLCanvasElement with comprehensive canvas methods
  // Store pixel data and context per canvas element (keyed by element reference)
  const canvasPixelData = new WeakMap<HTMLCanvasElement, Map<string, Uint8ClampedArray>>();
  const canvasContexts = new WeakMap<HTMLCanvasElement, any>();

  const createMockContext = function(this: HTMLCanvasElement) {
    // Return cached context if it exists (same context instance for same canvas)
    if (canvasContexts.has(this)) {
      return canvasContexts.get(this)!;
    }

    // Get or create pixel storage for this specific canvas
    if (!canvasPixelData.has(this)) {
      canvasPixelData.set(this, new Map());
    }
    const pixelData = canvasPixelData.get(this)!;

    // Create a context object with mutable properties
    const contextObj: any = {
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',

      fillRect: vi.fn(function(x: number, y: number, w: number, h: number) {
        // Store pixel color for fillRect calls (used by PSet)
        if (w === 1 && h === 1) {
          // This is likely a pixel fill from PSet
          const pixelColor = contextObj.fillStyle;
          // Convert hex color to RGB values
          const rgba = colorToRGBA(pixelColor);
          const data = new Uint8ClampedArray(4);
          data[0] = rgba.r;
          data[1] = rgba.g;
          data[2] = rgba.b;
          data[3] = rgba.a;
          pixelData.set(`${Math.floor(x)},${Math.floor(y)}`, data);
        }
      }),
      clearRect: vi.fn((x: number, y: number, w: number, h: number) => {
        // Clear pixels in the rect
        for (let px = Math.floor(x); px < x + w; px++) {
          for (let py = Math.floor(y); py < y + h; py++) {
            pixelData.delete(`${px},${py}`);
          }
        }
      }),
      getImageData: vi.fn((x: number, y: number, w: number, h: number) => {
        // Return actual pixel data if stored, otherwise return black pixels
        // Floor coordinates to match how fillRect stores them
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        if (pixelData.has(key)) {
          return {
            data: pixelData.get(key)!,
            width: w,
            height: h,
            colorSpace: 'srgb'
          };
        }
        // Return default black pixel (0,0,0,255) in RGBA format
        const data = new Uint8ClampedArray(4);
        data[0] = 0;  // R
        data[1] = 0;  // G
        data[2] = 0;  // B
        data[3] = 255; // A
        return {
          data,
          width: w,
          height: h,
          colorSpace: 'srgb'
        };
      }),
      putImageData: vi.fn((imageData: any, x: number, y: number) => {
        const key = `${x},${y}`;
        pixelData.set(key, imageData.data);
      }),
      createImageData: vi.fn((w: number, h?: number) => {
        if (typeof h === 'number') {
          return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
        }
        // Assume w is ImageData
        return { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      }),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      setLineDash: vi.fn(),
      createPattern: vi.fn((canvas: HTMLCanvasElement, repeat: string) => {
        // Return a mock pattern object that can be used as fillStyle
        return { type: 'pattern', canvas, repeat };
      }),
    };

    // Cache the context for this canvas
    canvasContexts.set(this, contextObj);
    return contextObj;
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement) {
    return createMockContext.call(this);
  });

  // Mock WebRTC - use function constructor to avoid instanceof issues
  function RTCPeerConnectionMock() {
    return {
      createOffer: vi.fn().mockResolvedValue({}),
      createAnswer: vi.fn().mockResolvedValue({}),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
      setRemoteDescription: vi.fn().mockResolvedValue(undefined),
      addIceCandidate: vi.fn().mockResolvedValue(undefined),
      createDataChannel: vi.fn().mockReturnValue({
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
      }),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }
  global.RTCPeerConnection = RTCPeerConnectionMock as any;

  // Mock Monaco Editor
  Object.defineProperty(window, 'monaco', {
    value: {
      editor: {
        create: vi.fn(() => ({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => ''),
          getModel: vi.fn(() => ({
            dispose: vi.fn(),
          })),
          layout: vi.fn(),
          focus: vi.fn(),
          onDidChangeModelContent: vi.fn(),
          getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
          setPosition: vi.fn(),
          getSelection: vi.fn(() => ({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
            isEmpty: () => true,
          })),
        })),
        defineTheme: vi.fn(),
        setTheme: vi.fn(),
      },
      languages: {
        register: vi.fn(),
        setMonarchTokensProvider: vi.fn(),
        registerCompletionItemProvider: vi.fn(),
        registerHoverProvider: vi.fn(),
      },
    },
    writable: true,
  });

  // Mock file system APIs - use proper constructors to avoid instanceof issues
  function FileMock(bits: any[], name: string, options?: any) {
    return {
      name,
      size: bits.reduce((acc: number, bit: any) => acc + (bit.length || 0), 0),
      type: options?.type || 'text/plain',
      lastModified: Date.now(),
      slice: vi.fn(),
      stream: vi.fn(),
      text: vi.fn().mockResolvedValue(''),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
  }

  global.File = FileMock as any;

  function FileReaderMock() {
    return {
      readAsText: vi.fn(),
      readAsDataURL: vi.fn(),
      readAsArrayBuffer: vi.fn(),
      result: null,
      error: null,
      onload: null,
      onerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }

  global.FileReader = FileReaderMock as any;

  // Mock Clipboard API
  try {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
      writable: true,
      configurable: true,
    });
  } catch (e) {
    // If property already defined, just override it
    (navigator as any).clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    };
  }

  // Mock console methods to reduce test noise
  // Note: These mocks can interfere with vitest's error serialization
  // Only mock if necessary for specific tests
  // vi.spyOn(console, 'warn').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
  // vi.spyOn(console, 'log').mockImplementation(() => {});
});

// ULTRA THINK DOM SETUP: Complete DOM environment for VB6 IDE
beforeEach(() => {
  // Skip setup for tests that provide their own complete DOM mocks
  const testName = expect.getState().currentTestName || '';
  const hasCustomMock = testName.includes('ThemeManager');
  
  if (hasCustomMock) {
    return; // Let ThemeManager use its own complete mock
  }
  
  // PHASE 1: Complete document structure for other tests
  if (!document.documentElement) {
    const html = document.createElement('html');
    document.appendChild(html);
  }
  
  if (!document.head) {
    const head = document.createElement('head');
    document.documentElement.appendChild(head);
  }
  
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }
  
  // PHASE 2: Complete DOM APIs for VB6Runtime
  if (!document.documentElement.style) {
    document.documentElement.style = {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      getPropertyValue: vi.fn().mockReturnValue(''),
      cssText: '',
      length: 0,
    } as any;
  }
  
  // Essential document methods for VB6Runtime
  if (!document.addEventListener) {
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    document.dispatchEvent = vi.fn();
  }
  
  // Essential document query methods
  if (!document.getElementById) {
    document.getElementById = vi.fn().mockImplementation((id) => {
      // Return existing element or create new one
      const existingElements = document.getElementsByTagName('div');
      for (let i = 0; i < existingElements.length; i++) {
        if (existingElements[i].id === id) {
          return existingElements[i];
        }
      }
      // Create new element if not found
      const div = document.createElement('div');
      div.setAttribute('id', id);
      if (document.body) {
        document.body.appendChild(div);
      }
      return div;
    });
  }
  
  if (!document.querySelector) {
    document.querySelector = vi.fn().mockReturnValue(null);
    document.querySelectorAll = vi.fn().mockReturnValue([]);
  }
  
  // Complete body with all needed properties
  if (document.body && !document.body.classList) {
    document.body.classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
      toggle: vi.fn(),
      replace: vi.fn(),
    } as any;
    document.body.className = '';
  }
  
  // Window APIs for VB6Runtime
  if (!global.window.matchMedia) {
    global.window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }
  
  // PHASE 3: React root container for non-ThemeManager tests
  if (document.body && document.createElement) {
    const existing = document.getElementById('root');
    if (!existing) {
      const div = document.createElement('div');
      div.setAttribute('id', 'root');
      document.body.appendChild(div);
    }
  }
});

// ULTRA THINK CLEANUP: Complete cleanup after each test
afterEach(() => {
  cleanup();
  
  // Clean up DOM container
  if (document && document.getElementById) {
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.parentNode) {
      rootElement.parentNode.removeChild(rootElement);
    }
  }
  
  // Reset document.body className for ThemeManager tests
  if (document.body) {
    document.body.className = '';
  }
  
  // Clear all mocks and restore original implementations
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
