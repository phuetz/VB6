/**
 * Tests unitaires pour les utilitaires de sécurité
 * Teste toutes les fonctions de sécurité critiques
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from '../../utils/securityHelpers';

describe('Security Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeGet', () => {
    it('should safely access nested object properties', () => {
      const obj = {
        level1: {
          level2: {
            value: 'found',
            number: 42,
          },
        },
      };

      expect(safeGet(obj, 'level1.level2.value', 'default')).toBe('found');
      expect(safeGet(obj, 'level1.level2.number', 0)).toBe(42);
      expect(safeGet(obj, 'level1.nonexistent.value', 'default')).toBe('default');
      expect(safeGet(obj, 'nonexistent.path', 'fallback')).toBe('fallback');
    });

    it('should handle null and undefined objects', () => {
      expect(safeGet(null, 'any.path', 'fallback')).toBe('fallback');
      expect(safeGet(undefined, 'any.path', 'fallback')).toBe('fallback');
    });

    it('should handle empty paths', () => {
      const obj = { value: 'test' };
      expect(safeGet(obj, '', 'default')).toBe('default');
    });

    it('should handle exceptions gracefully', () => {
      const obj = {
        get badProperty() {
          throw new Error('Property access error');
        },
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(safeGet(obj, 'badProperty', 'safe')).toBe('safe');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('safeArrayAccess', () => {
    it('should safely access array elements', () => {
      const arr = ['a', 'b', 'c'];

      expect(safeArrayAccess(arr, 0, 'default')).toBe('a');
      expect(safeArrayAccess(arr, 2, 'default')).toBe('c');
      expect(safeArrayAccess(arr, 5, 'default')).toBe('default');
      expect(safeArrayAccess(arr, -1, 'default')).toBe('default');
    });

    it('should handle non-arrays', () => {
      expect(safeArrayAccess('not array' as any, 0, 'default')).toBe('default');
      expect(safeArrayAccess(null as any, 0, 'default')).toBe('default');
      expect(safeArrayAccess(undefined as any, 0, 'default')).toBe('default');
    });

    it('should handle undefined array elements', () => {
      const sparseArray = new Array(5);
      sparseArray[2] = 'defined';

      expect(safeArrayAccess(sparseArray, 2, 'default')).toBe('defined');
      expect(safeArrayAccess(sparseArray, 0, 'default')).toBe('default');
    });
  });

  describe('safeExecute', () => {
    it('should execute function safely', () => {
      const successFn = () => 'success';
      const errorFn = () => {
        throw new Error('Function error');
      };

      expect(safeExecute(successFn, 'fallback')).toBe('success');
      expect(safeExecute(errorFn, 'fallback')).toBe('fallback');
    });

    it('should log errors to console', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorFn = () => {
        throw new Error('Test error');
      };

      safeExecute(errorFn, 'fallback');

      expect(consoleSpy).toHaveBeenCalledWith('Safe execute error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('safeExecuteAsync', () => {
    it('should execute async function safely', async () => {
      const successFn = async () => 'async success';
      const errorFn = async () => {
        throw new Error('Async error');
      };

      expect(await safeExecuteAsync(successFn, 'fallback')).toBe('async success');
      expect(await safeExecuteAsync(errorFn, 'fallback')).toBe('fallback');
    });

    it('should handle promise rejections', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const rejectFn = async () => Promise.reject(new Error('Promise rejected'));

      const result = await safeExecuteAsync(rejectFn, 'safe');

      expect(result).toBe('safe');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('safeString', () => {
    it('should convert values to strings safely', () => {
      expect(safeString('hello')).toBe('hello');
      expect(safeString(123)).toBe('123');
      expect(safeString(true)).toBe('true');
      expect(safeString(null)).toBe('');
      expect(safeString(undefined)).toBe('');
      expect(safeString(null, 'fallback')).toBe('fallback');
    });

    it('should handle objects with toString method', () => {
      const obj = { toString: () => 'custom string' };
      expect(safeString(obj)).toBe('custom string');
    });

    it('should handle objects that throw in toString', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const badObj = {
        toString: () => {
          throw new Error('toString error');
        },
      };

      expect(safeString(badObj, 'safe')).toBe('safe');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('safeNumber', () => {
    it('should convert values to numbers safely', () => {
      expect(safeNumber(42)).toBe(42);
      expect(safeNumber('42')).toBe(42);
      expect(safeNumber('42.5')).toBe(42.5);
      expect(safeNumber(true)).toBe(1);
      expect(safeNumber(false)).toBe(0);
      expect(safeNumber('invalid')).toBe(0);
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber('invalid', 99)).toBe(99);
    });

    it('should handle special number values', () => {
      expect(safeNumber(Infinity)).toBe(Infinity);
      expect(safeNumber(-Infinity)).toBe(-Infinity);
    });
  });

  describe('safeBoolean', () => {
    it('should convert values to booleans safely', () => {
      expect(safeBoolean(true)).toBe(true);
      expect(safeBoolean(false)).toBe(false);
      expect(safeBoolean('true')).toBe(true);
      expect(safeBoolean('TRUE')).toBe(true);
      expect(safeBoolean('1')).toBe(true);
      expect(safeBoolean('yes')).toBe(true);
      expect(safeBoolean('false')).toBe(false);
      expect(safeBoolean('0')).toBe(false);
      expect(safeBoolean('no')).toBe(false);
      expect(safeBoolean(1)).toBe(true);
      expect(safeBoolean(0)).toBe(false);
      expect(safeBoolean(null)).toBe(false);
      expect(safeBoolean(undefined)).toBe(false);
      expect(safeBoolean(null, true)).toBe(true);
    });
  });

  describe('DOM Operations', () => {
    beforeEach(() => {
      // Mock DOM methods
      document.querySelector = vi.fn();
      document.querySelectorAll = vi.fn();
    });

    describe('safeQuerySelector', () => {
      it('should safely query DOM elements', () => {
        const mockElement = document.createElement('div');
        (document.querySelector as any).mockReturnValue(mockElement);

        const result = safeQuerySelector('.test-class');
        expect(result).toBe(mockElement);
        expect(document.querySelector).toHaveBeenCalledWith('.test-class');
      });

      it('should handle query selector errors', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (document.querySelector as any).mockImplementation(() => {
          throw new Error('Invalid selector');
        });

        const result = safeQuerySelector('invalid[selector');
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('safeQuerySelectorAll', () => {
      it('should safely query multiple DOM elements', () => {
        const mockElements = [document.createElement('div'), document.createElement('span')];
        (document.querySelectorAll as any).mockReturnValue(mockElements);

        const result = safeQuerySelectorAll('.test-class');
        expect(result).toEqual(mockElements);
      });

      it('should handle query selector all errors', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (document.querySelectorAll as any).mockImplementation(() => {
          throw new Error('Invalid selector');
        });

        const result = safeQuerySelectorAll('invalid[selector');
        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('localStorage Operations', () => {
    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
        },
        writable: true,
      });
    });

    describe('safeLocalStorageGet', () => {
      it('should safely get localStorage values', () => {
        (localStorage.getItem as any).mockReturnValue('stored value');

        const result = safeLocalStorageGet('test-key', 'default');
        expect(result).toBe('stored value');
        expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
      });

      it('should return fallback for null values', () => {
        (localStorage.getItem as any).mockReturnValue(null);

        const result = safeLocalStorageGet('non-existent', 'fallback');
        expect(result).toBe('fallback');
      });

      it('should handle localStorage errors', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (localStorage.getItem as any).mockImplementation(() => {
          throw new Error('localStorage access denied');
        });

        const result = safeLocalStorageGet('test-key', 'safe');
        expect(result).toBe('safe');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('safeLocalStorageSet', () => {
      it('should safely set localStorage values', () => {
        const result = safeLocalStorageSet('test-key', 'test-value');
        expect(result).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      });

      it('should handle localStorage set errors', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (localStorage.setItem as any).mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        const result = safeLocalStorageSet('test-key', 'test-value');
        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('safeAddEventListener', () => {
    it('should safely add event listeners', () => {
      const mockElement = {
        addEventListener: vi.fn(),
      };
      const mockHandler = vi.fn();

      const result = safeAddEventListener(mockElement as any, 'click', mockHandler);
      expect(result).toBe(true);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', mockHandler, undefined);
    });

    it('should handle event listener errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockElement = {
        addEventListener: vi.fn(() => {
          throw new Error('Event listener error');
        }),
      };

      const result = safeAddEventListener(mockElement as any, 'click', vi.fn());
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('safeURL', () => {
    it('should safely create URL objects', () => {
      const result = safeURL('https://example.com/path?query=value');
      expect(result).toBeInstanceOf(URL);
      expect(result?.hostname).toBe('example.com');
    });

    it('should handle invalid URLs', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = safeURL('invalid-url');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('safeFetch', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
      global.AbortController = vi.fn().mockImplementation(() => ({
        signal: {},
        abort: vi.fn(),
      }));
    });

    it('should safely perform fetch requests', async () => {
      const mockResponse = new Response('test data');
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await safeFetch('https://api.example.com/data');
      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', {
        signal: expect.any(Object),
      });
    });

    it('should handle fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await safeFetch('https://api.example.com/data');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle timeout', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a fetch that respects AbortController
      (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
        return new Promise((resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new Error('AbortError'));
            });
          }
          // Never resolve normally to simulate slow request
        });
      });

      const result = await safeFetch('https://slow-api.example.com/data', {}, 100);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Safe fetch error:', expect.any(Error));

      consoleSpy.mockRestore();
    }, 1000); // Reduced timeout since it should abort quickly
  });

  describe('Crypto Operations', () => {
    describe('safeRandomUUID', () => {
      it('should generate UUID using crypto.randomUUID when available', () => {
        const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
        global.crypto = {
          randomUUID: vi.fn().mockReturnValue(mockUUID),
        } as any;

        const result = safeRandomUUID();
        expect(result).toBe(mockUUID);
        expect(global.crypto.randomUUID).toHaveBeenCalled();
      });

      it('should generate fallback UUID when crypto.randomUUID unavailable', () => {
        global.crypto = {} as any;

        const result = safeRandomUUID();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/^[a-f0-9-]+$/);
      });

      it('should handle crypto errors', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        global.crypto = {
          randomUUID: vi.fn(() => {
            throw new Error('Crypto error');
          }),
        } as any;

        const result = safeRandomUUID();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Performance Measurements', () => {
    describe('safePerformanceNow', () => {
      it('should use performance.now when available', () => {
        const mockTime = 123.456;
        global.performance = {
          now: vi.fn().mockReturnValue(mockTime),
        } as any;

        const result = safePerformanceNow();
        expect(result).toBe(mockTime);
        expect(global.performance.now).toHaveBeenCalled();
      });

      it('should fallback to Date.now when performance.now unavailable', () => {
        global.performance = {} as any;
        const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1234567890);

        const result = safePerformanceNow();
        expect(result).toBe(1234567890);
        expect(dateSpy).toHaveBeenCalled();

        dateSpy.mockRestore();
      });
    });

    describe('safeMemoryUsage', () => {
      it('should return memory usage when available', () => {
        global.performance = {
          memory: {
            usedJSHeapSize: 1024000,
            totalJSHeapSize: 2048000,
          },
        } as any;

        const result = safeMemoryUsage();
        expect(result).toEqual({
          used: 1024000,
          total: 2048000,
        });
      });

      it('should return zero values when memory info unavailable', () => {
        global.performance = {} as any;

        const result = safeMemoryUsage();
        expect(result).toEqual({
          used: 0,
          total: 0,
        });
      });
    });
  });

  describe('Validation Helpers', () => {
    describe('isValidLength', () => {
      it('should validate objects with length property', () => {
        expect(isValidLength('hello')).toBe(true);
        expect(isValidLength([1, 2, 3])).toBe(true);
        expect(isValidLength({ length: 5 } as any)).toBe(true);
        expect(isValidLength(null)).toBe(false);
        expect(isValidLength(undefined)).toBe(false);
        expect(isValidLength({})).toBe(false);
        expect(isValidLength({ length: 'invalid' })).toBe(false);
      });
    });

    describe('isValidObject', () => {
      it('should validate objects', () => {
        expect(isValidObject({})).toBe(true);
        expect(isValidObject([])).toBe(true);
        expect(isValidObject(new Date())).toBe(true);
        expect(isValidObject(null)).toBe(false);
        expect(isValidObject(undefined)).toBe(false);
        expect(isValidObject('string')).toBe(false);
        expect(isValidObject(42)).toBe(false);
      });
    });
  });

  describe('createErrorBoundary', () => {
    it('should create error boundary wrapper', () => {
      const fallbackFn = vi.fn();
      const errorBoundary = createErrorBoundary(fallbackFn);

      const successFn = vi.fn().mockReturnValue('success');
      const errorFn = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const wrappedSuccess = errorBoundary(successFn);
      const wrappedError = errorBoundary(errorFn);

      expect(wrappedSuccess('arg1', 'arg2')).toBe('success');
      expect(successFn).toHaveBeenCalledWith('arg1', 'arg2');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(wrappedError('arg1', 'arg2')).toBeUndefined();
      expect(errorFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(fallbackFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
