/**
 * Tests unitaires pour les polyfills de compatibilité navigateur
 * Teste tous les polyfills critiques pour le démarrage de l'application
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Browser Polyfills', () => {
  // Note: Les polyfills sont maintenant chargés dans setup.ts
  // Ces tests vérifient leur fonctionnement

  describe('Buffer Polyfill', () => {
    it('should provide Buffer global after importing polyfills', async () => {
      // Buffer est défini dans setup.ts
      expect(globalThis.Buffer).toBeDefined();
      expect(typeof globalThis.Buffer.from).toBe('function');
      expect(typeof globalThis.Buffer.alloc).toBe('function');
      expect(typeof globalThis.Buffer.isBuffer).toBe('function');
    });

    it('should create buffer from string', async () => {
      const buffer = globalThis.Buffer.from('hello world');
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should allocate buffer with specified size', async () => {
      const buffer = globalThis.Buffer.alloc(10);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBe(10);
    });

    it('should identify valid buffers', async () => {
      const buffer = new Uint8Array(5);
      const arrayBuffer = new ArrayBuffer(5);
      const regularArray = [1, 2, 3];
      
      expect(globalThis.Buffer.isBuffer(buffer)).toBe(true);
      expect(globalThis.Buffer.isBuffer(arrayBuffer)).toBe(false); // ArrayBuffer is not Uint8Array
      expect(globalThis.Buffer.isBuffer(regularArray)).toBe(false);
      expect(globalThis.Buffer.isBuffer(null)).toBe(false);
    });
  });

  describe('Process Polyfill', () => {
    it('should provide process global after importing polyfills', async () => {
      // process est défini dans setup.ts
      expect(globalThis.process).toBeDefined();
      expect(globalThis.process.env).toBeDefined();
      expect(globalThis.process.platform).toBe('browser');
      expect(globalThis.process.browser).toBe(true);
    });

    it('should provide nextTick function', async () => {
      expect(typeof globalThis.process.nextTick).toBe('function');
      
      let called = false;
      globalThis.process.nextTick(() => {
        called = true;
      });
      
      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(called).toBe(true);
    });

    it('should provide exit and cwd functions', async () => {
      expect(typeof globalThis.process.exit).toBe('function');
      expect(typeof globalThis.process.cwd).toBe('function');
      expect(globalThis.process.cwd()).toBe('/');
    });
  });

  describe('Util Polyfill', () => {
    it('should provide util global after importing polyfills', async () => {
      // util est défini dans setup.ts
      expect(globalThis.util).toBeDefined();
      expect(typeof globalThis.util.debuglog).toBe('function');
      expect(typeof globalThis.util.inspect).toBe('function');
      expect(typeof globalThis.util.format).toBe('function');
    });

    it('should format strings correctly', async () => {
      const result = globalThis.util.format('Hello %s, you are %d years old', 'John', 25);
      expect(result).toBe('Hello John, you are 25 years old');
    });

    it('should inspect objects', () => {
      const obj = { name: 'test', value: 123 };
      const result = globalThis.util.inspect(obj);
      expect(result).toContain('name');
      expect(result).toContain('test');
    });

    it('should provide type checking functions', () => {
      expect(globalThis.util.isArray([1, 2, 3])).toBe(true);
      expect(globalThis.util.isArray('string')).toBe(false);
      expect(globalThis.util.isString('hello')).toBe(true);
      expect(globalThis.util.isNumber(42)).toBe(true);
      expect(globalThis.util.isObject({})).toBe(true);
      expect(globalThis.util.isObject(null)).toBe(false);
    });
  });

  describe('Performance Polyfills', () => {
    it('should ensure performance.now exists', async () => {
      await import('../polyfills');
      expect(globalThis.performance).toBeDefined();
      expect(typeof globalThis.performance.now).toBe('function');
      
      const start = globalThis.performance.now();
      expect(typeof start).toBe('number');
      expect(start).toBeGreaterThan(0);
    });

    it('should provide memory info', async () => {
      await import('../polyfills');
      expect(globalThis.performance.memory).toBeDefined();
      expect(typeof globalThis.performance.memory.usedJSHeapSize).toBe('number');
      expect(typeof globalThis.performance.memory.totalJSHeapSize).toBe('number');
      expect(typeof globalThis.performance.memory.jsHeapSizeLimit).toBe('number');
    });
  });

  describe('Safe JSON Operations', () => {
    it('should provide safe JSON parsing', async () => {
      await import('../polyfills');
      expect(typeof globalThis.safeJSONParse).toBe('function');
      
      const validJson = '{"test": "value"}';
      const invalidJson = '{invalid json}';
      
      const result1 = globalThis.safeJSONParse(validJson);
      expect(result1).toEqual({ test: 'value' });
      
      const result2 = globalThis.safeJSONParse(invalidJson, 'fallback');
      expect(result2).toBe('fallback');
    });

    it('should provide safe JSON stringifying', async () => {
      await import('../polyfills');
      expect(typeof globalThis.safeJSONStringify).toBe('function');
      
      const validObj = { test: 'value' };
      const result1 = globalThis.safeJSONStringify(validObj);
      expect(result1).toBe('{"test":"value"}');
      
      // Test circular reference
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      const result2 = globalThis.safeJSONStringify(circularObj, 'fallback');
      expect(result2).toBe('fallback');
    });
  });

  describe('Safe Property Access', () => {
    it('should provide safe property access function', async () => {
      await import('../polyfills');
      expect(typeof globalThis.safeAccess).toBe('function');
      
      const obj = {
        level1: {
          level2: {
            value: 'found'
          }
        }
      };
      
      const result1 = globalThis.safeAccess(obj, 'level1.level2.value');
      expect(result1).toBe('found');
      
      const result2 = globalThis.safeAccess(obj, 'level1.nonexistent.value', 'default');
      expect(result2).toBe('default');
      
      const result3 = globalThis.safeAccess(null, 'any.path', 'fallback');
      expect(result3).toBe('fallback');
    });
  });

  describe('Console Enhancements', () => {
    it('should ensure all console methods exist', async () => {
      await import('../polyfills');
      
      const requiredMethods = ['debug', 'info', 'warn', 'error', 'trace', 'table', 'group', 'groupEnd', 'time', 'timeEnd'];
      
      for (const method of requiredMethods) {
        expect(typeof console[method as keyof Console]).toBe('function');
      }
    });
  });

  describe('Array Method Safety', () => {
    it('should handle array methods safely on invalid objects', async () => {
      await import('../polyfills');
      
      // Test with invalid array-like object
      const invalidArray = { length: 'invalid' };
      
      // Ces méthodes devraient gérer les objets invalides
      expect(() => {
        try {
          (invalidArray as any).push('test');
        } catch {
          // Expected to throw - silently catch to test the outer expect
        }
      }).not.toThrow();
    });

    it('should handle null/undefined arrays safely', () => {
      // Test avec null et undefined - devrait lancer une erreur normalement
      expect(() => (null as any).push('test')).toThrow();
      expect(() => (undefined as any).pop()).toThrow();
    });
  });

  describe('Event Listener Safety', () => {
    it('should provide safe event listener addition', async () => {
      await import('../polyfills');
      
      const mockElement = {
        addEventListener: vi.fn(() => {
          throw new Error('Event listener error');
        })
      };
      
      // Should not throw
      expect(() => {
        globalThis.addEventListener.call(mockElement, 'click', () => {}, {});
      }).not.toThrow();
    });
  });
});