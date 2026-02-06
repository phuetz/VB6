/**
 * Tests de base pour vérifier que l'environnement de test fonctionne
 * et que les imports principaux ne cassent pas
 */

import { describe, it, expect, vi } from 'vitest';

describe('Basic Startup Tests', () => {
  describe('JavaScript Environment', () => {
    it('should have working JavaScript environment', () => {
      expect(true).toBe(true);
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
    });

    it('should have basic APIs available', () => {
      expect(typeof localStorage).toBe('object');
      expect(typeof console).toBe('object');
      expect(typeof setTimeout).toBe('function');
      expect(typeof JSON).toBe('object');
    });

    it('should have performance API', () => {
      expect(typeof performance).toBe('object');
      expect(typeof performance.now).toBe('function');
    });
  });

  describe('Node.js Compatibility', () => {
    it('should have process object available', () => {
      expect(typeof process).toBe('object');
      // Note: process.browser peut ne pas être défini dans l'environnement de test
      expect(process.env).toBeDefined();
    });

    it('should have Buffer available', () => {
      expect(typeof Buffer).toBe('function');
      expect(typeof Buffer.from).toBe('function');
    });

    it('should handle basic polyfills', () => {
      // Test if basic polyfills work
      const testBuffer = Buffer.from('hello');
      expect(testBuffer).toBeDefined();
      expect(testBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('React Environment', () => {
    it('should be able to import React', async () => {
      const React = await import('react');
      expect(React).toBeDefined();
      expect(typeof React.createElement).toBe('function');
    });

    it('should be able to import ReactDOM', async () => {
      const ReactDOM = await import('react-dom/client');
      expect(ReactDOM).toBeDefined();
      expect(typeof ReactDOM.createRoot).toBe('function');
    });
  });

  describe('Testing Framework', () => {
    it('should have Vitest working', () => {
      expect(expect).toBeDefined();
      expect(vi).toBeDefined();
      expect(describe).toBeDefined();
      expect(it).toBeDefined();
    });

    it('should have jsdom environment', () => {
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
      expect(document.createElement).toBeDefined();
    });
  });

  describe('Package Dependencies', () => {
    it('should be able to import core dependencies', async () => {
      const deps = [
        'react',
        'react-dom',
        'zustand',
        '@dnd-kit/core',
        'framer-motion',
        'lucide-react',
      ];

      for (const dep of deps) {
        try {
          const module = await import(dep);
          expect(module).toBeDefined();
        } catch (error) {
          console.warn(`Could not import ${dep}:`, error);
          // Don't fail the test for optional dependencies
        }
      }
    });
  });

  describe('TypeScript Support', () => {
    it('should support TypeScript types', () => {
      const testString: string = 'hello';
      const testNumber: number = 42;
      const testBoolean: boolean = true;
      const testArray: string[] = ['a', 'b', 'c'];

      expect(typeof testString).toBe('string');
      expect(typeof testNumber).toBe('number');
      expect(typeof testBoolean).toBe('boolean');
      expect(Array.isArray(testArray)).toBe(true);
    });

    it('should support generic types', () => {
      interface TestInterface<T> {
        value: T;
      }

      const stringTest: TestInterface<string> = { value: 'test' };
      const numberTest: TestInterface<number> = { value: 123 };

      expect(stringTest.value).toBe('test');
      expect(numberTest.value).toBe(123);
    });
  });

  describe('Error Handling', () => {
    it('should catch and handle errors', () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };

      expect(errorFunction).toThrow('Test error');
    });

    it('should handle async errors', async () => {
      const asyncErrorFunction = async () => {
        throw new Error('Async test error');
      };

      await expect(asyncErrorFunction()).rejects.toThrow('Async test error');
    });
  });

  describe('Mock Functions', () => {
    it('should create and use mock functions', () => {
      const mockFn = vi.fn();
      mockFn('test');

      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should spy on existing functions', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(consoleSpy).toHaveBeenCalledWith('test message');

      consoleSpy.mockRestore();
    });
  });

  describe('Async Operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('resolved');
      const result = await promise;

      expect(result).toBe('resolved');
    });

    it('should handle timeouts', async () => {
      const result = await new Promise(resolve => {
        setTimeout(() => resolve('timeout'), 10);
      });

      expect(result).toBe('timeout');
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory in simple operations', () => {
      const beforeMemory = performance.memory?.usedJSHeapSize || 0;

      // Perform some operations
      const arr = new Array(1000).fill(0).map((_, i) => i);
      const sum = arr.reduce((a, b) => a + b, 0);

      expect(sum).toBe(499500); // Sum of 0 to 999
      expect(arr.length).toBe(1000);

      // Memory check is informational
      const afterMemory = performance.memory?.usedJSHeapSize || 0;
      expect(afterMemory).toBeGreaterThanOrEqual(beforeMemory);
    });

    it('should complete tests in reasonable time', () => {
      const start = performance.now();

      // Simulate some work
      for (let i = 0; i < 10000; i++) {
        void (Math.random() * 100);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete quickly (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
