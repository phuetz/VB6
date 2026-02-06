// Security Helpers - Safe execution and error prevention
// 🛡️ Prevents common runtime errors and provides safe fallbacks

// Safe property access with fallback
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return fallback;
      }
      current = current[key];
    }

    return current !== undefined ? current : fallback;
  } catch (e) {
    console.warn('Safe get error:', e);
    return fallback;
  }
}

// Safe array access
export function safeArrayAccess<T>(arr: any[], index: number, fallback: T): T {
  try {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
      return fallback;
    }
    return arr[index] !== undefined ? arr[index] : fallback;
  } catch (e) {
    console.warn('Safe array access error:', e);
    return fallback;
  }
}

// Safe function execution
export function safeExecute<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.warn('Safe execute error:', e);
    return fallback;
  }
}

// Safe async function execution
export async function safeExecuteAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn('Safe async execute error:', e);
    return fallback;
  }
}

// Safe string operations
export function safeString(value: any, fallback: string = ''): string {
  try {
    if (value == null) return fallback;
    if (typeof value === 'string') return value;
    return String(value);
  } catch (e) {
    console.warn('Safe string error:', e);
    return fallback;
  }
}

// Safe number operations
export function safeNumber(value: any, fallback: number = 0): number {
  try {
    if (value == null) return fallback;
    if (typeof value === 'number' && !isNaN(value)) return value;
    const parsed = Number(value);
    return !isNaN(parsed) ? parsed : fallback;
  } catch (e) {
    console.warn('Safe number error:', e);
    return fallback;
  }
}

// Safe boolean operations
export function safeBoolean(value: any, fallback: boolean = false): boolean {
  try {
    if (value == null) return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    return Boolean(value);
  } catch (e) {
    console.warn('Safe boolean error:', e);
    return fallback;
  }
}

// Safe DOM operations
export function safeQuerySelector(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch (e) {
    console.warn('Safe query selector error:', e);
    return null;
  }
}

export function safeQuerySelectorAll(selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (e) {
    console.warn('Safe query selector all error:', e);
    return [];
  }
}

// Safe local storage operations
export function safeLocalStorageGet(key: string, fallback: string = ''): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    console.warn('Safe localStorage get error:', e);
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('Safe localStorage set error:', e);
    return false;
  }
}

// Safe event handling
export function safeAddEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): boolean {
  try {
    element.addEventListener(event, handler, options);
    return true;
  } catch (e) {
    console.warn('Safe addEventListener error:', e);
    return false;
  }
}

// Safe URL operations
export function safeURL(url: string): URL | null {
  try {
    return new URL(url);
  } catch (e) {
    console.warn('Safe URL error:', e);
    return null;
  }
}

// Safe fetch with timeout
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    console.warn('Safe fetch error:', e);
    return null;
  }
}

// Safe crypto operations
export function safeRandomUUID(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  } catch (e) {
    console.warn('Safe UUID error:', e);
    // Ultimate fallback
    return Date.now().toString(36) + Math.random().toString(36);
  }
}

// Safe performance measurements
export function safePerformanceNow(): number {
  try {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  } catch (e) {
    console.warn('Safe performance.now error:', e);
    return Date.now();
  }
}

// Safe memory measurement
export function safeMemoryUsage(): { used: number; total: number } {
  try {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize || 0,
        total: performance.memory.totalJSHeapSize || 0,
      };
    }
    return { used: 0, total: 0 };
  } catch (e) {
    console.warn('Safe memory usage error:', e);
    return { used: 0, total: 0 };
  }
}

// Anti-phishing protection helper
export function isValidLength(value: any): boolean {
  try {
    if (value == null) return false;
    if (typeof value === 'string' || Array.isArray(value)) {
      return typeof value.length === 'number' && value.length >= 0;
    }
    // Also handle objects with length property (like NodeList, HTMLCollection, etc.)
    if (typeof value === 'object' && 'length' in value) {
      return typeof value.length === 'number' && value.length >= 0;
    }
    return false;
  } catch (e) {
    console.warn('Length validation error:', e);
    return false;
  }
}

// Safe object validation
export function isValidObject(value: any): boolean {
  try {
    return value != null && typeof value === 'object';
  } catch (e) {
    console.warn('Object validation error:', e);
    return false;
  }
}

// Global error boundary helper
export function createErrorBoundary(fallback: () => void) {
  return function safeWrapper<T extends any[], R>(
    fn: (...args: T) => R
  ): (...args: T) => R | undefined {
    return (...args: T) => {
      try {
        return fn(...args);
      } catch (e) {
        console.warn('Error boundary caught:', e);
        fallback();
        return undefined;
      }
    };
  };
}

export default {
  safeGet,
  safeArrayAccess,
  safeExecute,
  safeExecuteAsync,
  safeString,
  safeNumber,
  safeBoolean,
  safeQuerySelector,
  safeQuerySelectorAll,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeAddEventListener,
  safeURL,
  safeFetch,
  safeRandomUUID,
  safePerformanceNow,
  safeMemoryUsage,
  isValidLength,
  isValidObject,
  createErrorBoundary,
};
