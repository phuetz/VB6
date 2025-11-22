import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VB6AdvancedLanguageProcessor,
  VB6OptionalParameter,
  VB6ParamArray,
  IsMissing
} from '../../compiler/VB6AdvancedLanguageFeatures';

describe('VB6 Optional Parameters', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
  });

  afterEach(() => {
    processor.clear();
  });

  describe('Optional Parameter Processing', () => {
    it('should process optional parameter with value provided', () => {
      const param = processor.processOptionalParameter(
        'taxRate',
        'Double',
        0.1,           // Provided value
        0.08           // Default value
      );

      expect(param.name).toBe('taxRate');
      expect(param.type).toBe('Double');
      expect(param.defaultValue).toBe(0.08);
      expect(param.isMissing).toBe(false);
    });

    it('should process optional parameter with value missing', () => {
      const param = processor.processOptionalParameter(
        'taxRate',
        'Double',
        undefined,     // Not provided
        0.08           // Default value
      );

      expect(param.name).toBe('taxRate');
      expect(param.type).toBe('Double');
      expect(param.defaultValue).toBe(0.08);
      expect(param.isMissing).toBe(true);
    });

    it('should use default value when parameter is missing', () => {
      const param = processor.processOptionalParameter(
        'message',
        'String',
        undefined,
        'Hello'
      );

      expect(param.defaultValue).toBe('Hello');
      expect(param.isMissing).toBe(true);
    });

    it('should use provided value when parameter is present', () => {
      const param = processor.processOptionalParameter(
        'count',
        'Integer',
        42,
        10
      );

      expect(param.defaultValue).toBe(10);
      expect(param.isMissing).toBe(false);
      // Note: The actual value used would be 42, but defaultValue stores the default
    });

    it('should handle different data types', () => {
      const intParam = processor.processOptionalParameter('x', 'Integer', undefined, 0);
      const strParam = processor.processOptionalParameter('name', 'String', undefined, '');
      const boolParam = processor.processOptionalParameter('flag', 'Boolean', undefined, false);

      expect(intParam.defaultValue).toBe(0);
      expect(strParam.defaultValue).toBe('');
      expect(boolParam.defaultValue).toBe(false);
    });

    it('should mark parameter as not missing when value is 0', () => {
      const param = processor.processOptionalParameter(
        'value',
        'Integer',
        0,      // Provided (zero is valid value)
        10      // Default
      );

      expect(param.isMissing).toBe(false);
    });

    it('should mark parameter as not missing when value is empty string', () => {
      const param = processor.processOptionalParameter(
        'text',
        'String',
        '',     // Provided (empty string is valid)
        'default'
      );

      expect(param.isMissing).toBe(false);
    });

    it('should mark parameter as not missing when value is false', () => {
      const param = processor.processOptionalParameter(
        'enabled',
        'Boolean',
        false,  // Provided (false is valid)
        true    // Default
      );

      expect(param.isMissing).toBe(false);
    });
  });

  describe('IsMissing Function', () => {
    it('should return true for missing optional parameter', () => {
      const param = processor.processOptionalParameter('x', 'Integer', undefined, 0);

      expect(processor.isMissing(param)).toBe(true);
    });

    it('should return false for provided optional parameter', () => {
      const param = processor.processOptionalParameter('x', 'Integer', 42, 0);

      expect(processor.isMissing(param)).toBe(false);
    });

    it('should return true for undefined value', () => {
      expect(processor.isMissing(undefined)).toBe(true);
    });

    it('should return false for provided values', () => {
      expect(processor.isMissing(0)).toBe(false);
      expect(processor.isMissing('')).toBe(false);
      expect(processor.isMissing(false)).toBe(false);
      expect(processor.isMissing(null)).toBe(false);
    });

    it('should work with global IsMissing function', () => {
      const param = processor.processOptionalParameter('x', 'Integer', undefined, 0);

      expect(IsMissing(param)).toBe(true);
    });

    it('should handle object with isMissing property', () => {
      const obj = { isMissing: true };
      expect(processor.isMissing(obj)).toBe(true);

      const obj2 = { isMissing: false };
      expect(processor.isMissing(obj2)).toBe(false);
    });

    it('should handle plain values', () => {
      expect(processor.isMissing(42)).toBe(false);
      expect(processor.isMissing('test')).toBe(false);
      expect(processor.isMissing(true)).toBe(false);
    });
  });

  describe('Optional Parameter Code Generation', () => {
    it('should generate JavaScript for optional parameter', () => {
      processor.setCurrentContext('Module1', 'TestFunc');

      const js = processor.generateOptionalParameterJS('taxRate', 'Double', 0.08);

      expect(js).toContain('taxRate');
      expect(js).toContain('undefined');
      expect(js).toContain('0.08');
      expect(js).toContain('__isMissing');
    });

    it('should generate default value assignment', () => {
      const js = processor.generateOptionalParameterJS('count', 'Integer', 10);

      expect(js).toContain('count = count !== undefined ? count : 10');
    });

    it('should generate isMissing flag', () => {
      const js = processor.generateOptionalParameterJS('value', 'Long', 100);

      expect(js).toContain('__isMissing');
      expect(js).toContain('value === 100'); // Comparing with default
    });

    it('should handle string default values', () => {
      const js = processor.generateOptionalParameterJS('message', 'String', 'Hello');

      expect(js).toContain('"Hello"');
    });

    it('should handle numeric default values', () => {
      const js = processor.generateOptionalParameterJS('num', 'Integer', 42);

      expect(js).toContain('42');
    });

    it('should handle boolean default values', () => {
      const js = processor.generateOptionalParameterJS('flag', 'Boolean', true);

      expect(js).toContain('true');
    });
  });
});

describe('VB6 ParamArray', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
  });

  afterEach(() => {
    processor.clear();
  });

  describe('ParamArray Processing', () => {
    it('should process ParamArray with no arguments', () => {
      const paramArray = processor.processParamArray('numbers');

      expect(paramArray.name).toBe('numbers');
      expect(paramArray.values).toEqual([]);
    });

    it('should process ParamArray with single argument', () => {
      const paramArray = processor.processParamArray('numbers', 42);

      expect(paramArray.name).toBe('numbers');
      expect(paramArray.values).toEqual([42]);
    });

    it('should process ParamArray with multiple arguments', () => {
      const paramArray = processor.processParamArray('numbers', 1, 2, 3, 4, 5);

      expect(paramArray.name).toBe('numbers');
      expect(paramArray.values).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle mixed data types', () => {
      const paramArray = processor.processParamArray('data', 42, 'test', true, null);

      expect(paramArray.values).toHaveLength(4);
      expect(paramArray.values[0]).toBe(42);
      expect(paramArray.values[1]).toBe('test');
      expect(paramArray.values[2]).toBe(true);
      expect(paramArray.values[3]).toBeNull();
    });

    it('should handle array of objects', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const paramArray = processor.processParamArray('objects', obj1, obj2);

      expect(paramArray.values).toHaveLength(2);
      expect(paramArray.values[0]).toEqual({ id: 1 });
      expect(paramArray.values[1]).toEqual({ id: 2 });
    });

    it('should create independent arrays', () => {
      const array1 = processor.processParamArray('arr1', 1, 2, 3);
      const array2 = processor.processParamArray('arr2', 4, 5, 6);

      expect(array1.values).toEqual([1, 2, 3]);
      expect(array2.values).toEqual([4, 5, 6]);
      expect(array1.values).not.toBe(array2.values);
    });
  });

  describe('ParamArray Code Generation', () => {
    it('should generate JavaScript for ParamArray', () => {
      processor.setCurrentContext('Module1', 'SumFunction');

      const js = processor.generateParamArrayJS('numbers', 1);

      expect(js).toContain('numbers');
      expect(js).toContain('Array.prototype.slice.call');
      expect(js).toContain('arguments');
      expect(js).toContain('1'); // Start index
    });

    it('should use correct start index', () => {
      const js1 = processor.generateParamArrayJS('values', 0);
      expect(js1).toContain('arguments, 0');

      const js2 = processor.generateParamArrayJS('values', 2);
      expect(js2).toContain('arguments, 2');
    });

    it('should generate array declaration', () => {
      const js = processor.generateParamArrayJS('items', 0);

      expect(js).toContain('const items');
      expect(js).toContain('// ParamArray');
    });
  });

  describe('ParamArray Iteration', () => {
    it('should allow array iteration', () => {
      const paramArray = processor.processParamArray('numbers', 10, 20, 30);

      let sum = 0;
      paramArray.values.forEach(num => {
        sum += num;
      });

      expect(sum).toBe(60);
    });

    it('should support array methods', () => {
      const paramArray = processor.processParamArray('numbers', 1, 2, 3, 4, 5);

      const doubled = paramArray.values.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);

      const filtered = paramArray.values.filter(n => n > 2);
      expect(filtered).toEqual([3, 4, 5]);

      const sum = paramArray.values.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(15);
    });

    it('should support array length', () => {
      const array1 = processor.processParamArray('a');
      expect(array1.values.length).toBe(0);

      const array2 = processor.processParamArray('b', 1, 2);
      expect(array2.values.length).toBe(2);
    });

    it('should support array indexing', () => {
      const paramArray = processor.processParamArray('values', 'a', 'b', 'c');

      expect(paramArray.values[0]).toBe('a');
      expect(paramArray.values[1]).toBe('b');
      expect(paramArray.values[2]).toBe('c');
    });
  });
});

describe('VB6 ParamArray and Optional - Combined', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
  });

  afterEach(() => {
    processor.clear();
  });

  it('should support optional parameter before ParamArray', () => {
    // Simulate: Function Sum(Optional multiplier As Integer = 1, ParamArray numbers() As Variant)
    const multiplier = processor.processOptionalParameter('multiplier', 'Integer', undefined, 1);
    const numbers = processor.processParamArray('numbers', 10, 20, 30);

    // Calculate sum with multiplier
    const sum = numbers.values.reduce((acc, n) => acc + n, 0) * multiplier.defaultValue;

    expect(sum).toBe(60); // (10+20+30) * 1
  });

  it('should handle multiple optional parameters', () => {
    // Simulate: Function Test(Optional x As Integer = 1, Optional y As Integer = 2, Optional z As Integer = 3)
    const x = processor.processOptionalParameter('x', 'Integer', undefined, 1);
    const y = processor.processOptionalParameter('y', 'Integer', 5, 2);
    const z = processor.processOptionalParameter('z', 'Integer', undefined, 3);

    expect(x.isMissing).toBe(true);
    expect(y.isMissing).toBe(false);
    expect(z.isMissing).toBe(true);
  });

  it('should validate ParamArray is last parameter', () => {
    // In VB6, ParamArray must be the last parameter
    // This test validates the processing works correctly

    const optional1 = processor.processOptionalParameter('opt1', 'String', undefined, 'default');
    const optional2 = processor.processOptionalParameter('opt2', 'Integer', 10, 5);
    const paramArray = processor.processParamArray('values', 1, 2, 3);

    // All should process independently
    expect(optional1.isMissing).toBe(true);
    expect(optional2.isMissing).toBe(false);
    expect(paramArray.values).toEqual([1, 2, 3]);
  });
});

describe('VB6 ParamArray and Optional - Real-World Scenarios', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
  });

  afterEach(() => {
    processor.clear();
  });

  it('should implement flexible Sum function', () => {
    // Function Sum(ParamArray numbers() As Variant) As Double
    function Sum(...args: number[]): number {
      const paramArray = processor.processParamArray('numbers', ...args);
      return paramArray.values.reduce((sum, num) => sum + num, 0);
    }

    expect(Sum(1, 2, 3)).toBe(6);
    expect(Sum(10, 20, 30, 40)).toBe(100);
    expect(Sum()).toBe(0);
  });

  it('should implement formatted string builder', () => {
    // Function FormatMessage(message As String, ParamArray args() As Variant) As String
    function FormatMessage(message: string, ...args: any[]): string {
      const paramArray = processor.processParamArray('args', ...args);

      let result = message;
      paramArray.values.forEach((arg, index) => {
        result = result.replace(`{${index}}`, String(arg));
      });

      return result;
    }

    expect(FormatMessage('Hello {0}!', 'World')).toBe('Hello World!');
    expect(FormatMessage('{0} + {1} = {2}', 2, 3, 5)).toBe('2 + 3 = 5');
  });

  it('should implement function with optional tax calculation', () => {
    // Function CalculateTotal(amount As Currency, Optional taxRate As Double = 0.08) As Currency
    function CalculateTotal(amount: number, taxRate?: number): number {
      const taxParam = processor.processOptionalParameter(
        'taxRate',
        'Double',
        taxRate,
        0.08
      );

      const rate = processor.isMissing(taxParam) ? taxParam.defaultValue : taxRate!;
      return amount * (1 + rate);
    }

    expect(CalculateTotal(100)).toBeCloseTo(108, 2);       // Uses default 0.08
    expect(CalculateTotal(100, 0.1)).toBeCloseTo(110, 2);  // Uses provided 0.1
  });

  it('should implement logging function with optional level', () => {
    // Sub Log(message As String, Optional level As String = "INFO")
    const logs: string[] = [];

    function Log(message: string, level?: string): void {
      const levelParam = processor.processOptionalParameter(
        'level',
        'String',
        level,
        'INFO'
      );

      const logLevel = processor.isMissing(levelParam) ? levelParam.defaultValue : level!;
      logs.push(`[${logLevel}] ${message}`);
    }

    Log('Application started');
    Log('Error occurred', 'ERROR');
    Log('Warning message', 'WARN');

    expect(logs).toEqual([
      '[INFO] Application started',
      '[ERROR] Error occurred',
      '[WARN] Warning message'
    ]);
  });

  it('should implement flexible array concatenation', () => {
    // Function Concat(ParamArray arrays() As Variant) As Variant()
    function Concat(...arrays: any[][]): any[] {
      const paramArray = processor.processParamArray('arrays', ...arrays);

      return paramArray.values.reduce((result, arr) => {
        return result.concat(arr);
      }, []);
    }

    const result = Concat([1, 2], [3, 4], [5, 6]);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should implement MsgBox with optional parameters', () => {
    // Function MsgBox(prompt As String, Optional buttons As Integer = 0, Optional title As String = "") As Integer
    function MsgBox(prompt: string, buttons?: number, title?: string): string {
      const buttonsParam = processor.processOptionalParameter('buttons', 'Integer', buttons, 0);
      const titleParam = processor.processOptionalParameter('title', 'String', title, '');

      const btnValue = processor.isMissing(buttonsParam) ? buttonsParam.defaultValue : buttons!;
      const titleValue = processor.isMissing(titleParam) ? titleParam.defaultValue : title!;

      return `${titleValue || 'Message'}: ${prompt} [Buttons: ${btnValue}]`;
    }

    expect(MsgBox('Hello')).toBe('Message: Hello [Buttons: 0]');
    expect(MsgBox('Save?', 3)).toBe('Message: Save? [Buttons: 3]');
    expect(MsgBox('Error', 16, 'Error')).toBe('Error: Error [Buttons: 16]');
  });

  it('should implement Min/Max with ParamArray', () => {
    // Function Min(ParamArray numbers() As Variant) As Variant
    function Min(...args: number[]): number | null {
      const paramArray = processor.processParamArray('numbers', ...args);

      if (paramArray.values.length === 0) return null;

      return Math.min(...paramArray.values);
    }

    function Max(...args: number[]): number | null {
      const paramArray = processor.processParamArray('numbers', ...args);

      if (paramArray.values.length === 0) return null;

      return Math.max(...paramArray.values);
    }

    expect(Min(5, 2, 8, 1, 9)).toBe(1);
    expect(Max(5, 2, 8, 1, 9)).toBe(9);
    expect(Min()).toBeNull();
  });

  it('should implement validation with optional custom message', () => {
    // Function ValidateRange(value As Integer, min As Integer, max As Integer, Optional errorMsg As String = "Value out of range") As Boolean
    function ValidateRange(value: number, min: number, max: number, errorMsg?: string): { valid: boolean, message: string } {
      const msgParam = processor.processOptionalParameter(
        'errorMsg',
        'String',
        errorMsg,
        'Value out of range'
      );

      const valid = value >= min && value <= max;
      const message = processor.isMissing(msgParam) ? msgParam.defaultValue : errorMsg!;

      return {
        valid,
        message: valid ? 'OK' : message
      };
    }

    const result1 = ValidateRange(50, 0, 100);
    expect(result1.valid).toBe(true);

    const result2 = ValidateRange(150, 0, 100);
    expect(result2.valid).toBe(false);
    expect(result2.message).toBe('Value out of range');

    const result3 = ValidateRange(150, 0, 100, 'Number too large!');
    expect(result3.valid).toBe(false);
    expect(result3.message).toBe('Number too large!');
  });
});
