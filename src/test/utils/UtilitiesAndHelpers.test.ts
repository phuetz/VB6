import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCode, minifyCode, beautifyCode } from '../../utils/codeFormatter';
import {
  createControlArray,
  getControlArrayIndex,
  isControlArray,
} from '../../utils/controlArrayManager';
import {
  getDefaultProperties,
  mergeProperties,
  validateProperties,
} from '../../utils/controlDefaults';
import {
  evaluateExpression,
  validateExpression,
  parseExpression,
} from '../../utils/safeExpressionEvaluator';
import {
  debounce,
  throttle,
  memoize,
  deepClone,
  deepMerge,
  isEqual,
  pick,
  omit,
  groupBy,
  sortBy,
  chunk,
  flatten,
  unique,
} from '../../utils/helpers';

describe('Utilities and Helpers Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Code Formatter Utils', () => {
    it('should format VB6 code with proper indentation', () => {
      const code = `Public Sub Main()
Dim x As Integer
If x > 0 Then
MsgBox "Positive"
Else
MsgBox "Non-positive"
End If
End Sub`;

      const formatted = formatCode(code);

      expect(formatted).toContain('    Dim x As Integer'); // 4 spaces indent
      expect(formatted).toContain('        MsgBox "Positive"'); // 8 spaces for nested
    });

    it('should handle nested structures', () => {
      const code = `For i = 1 To 10
For j = 1 To 10
If i = j Then
Debug.Print i
End If
Next j
Next i`;

      const formatted = formatCode(code);

      const lines = formatted.split('\n');
      expect(lines[0]).toMatch(/^For i = 1 To 10$/);
      expect(lines[1]).toMatch(/^\s{4}For j = 1 To 10$/);
      expect(lines[2]).toMatch(/^\s{8}If i = j Then$/);
      expect(lines[3]).toMatch(/^\s{12}Debug\.Print i$/);
    });

    it('should preserve comments', () => {
      const code = `' This is a comment
Public Sub Test() ' Inline comment
    ' Indented comment
    Dim x As Integer
End Sub`;

      const formatted = formatCode(code);

      expect(formatted).toContain("' This is a comment");
      expect(formatted).toContain("' Inline comment");
      expect(formatted).toContain("    ' Indented comment");
    });

    it('should minify code by removing unnecessary whitespace', () => {
      const code = `Public Sub Test()
    Dim x As Integer
    x = 10
End Sub`;

      const minified = minifyCode(code);

      expect(minified).not.toContain('\n');
      expect(minified).toContain('Public Sub Test()Dim x As Integer:x=10:End Sub');
    });

    it('should beautify minified code', () => {
      const minified = 'Public Sub Test()Dim x As Integer:x=10:End Sub';
      const beautified = beautifyCode(minified);

      expect(beautified).toContain('\n');
      expect(beautified).toContain('    Dim x As Integer');
    });

    it('should handle line continuations', () => {
      const code = `Dim longVariable As String = _
    "This is a very long string " & _
    "that continues on multiple lines"`;

      const formatted = formatCode(code);

      expect(formatted).toContain(' _');
      expect(formatted.split('_').length).toBe(3);
    });
  });

  describe('Control Array Manager', () => {
    it('should create control array', () => {
      const controls = createControlArray('TextBox', 'Text', 5);

      expect(controls).toHaveLength(5);
      expect(controls[0].name).toBe('Text(0)');
      expect(controls[4].name).toBe('Text(4)');
    });

    it('should detect control arrays', () => {
      expect(isControlArray('Text(0)')).toBe(true);
      expect(isControlArray('Text(10)')).toBe(true);
      expect(isControlArray('TextBox1')).toBe(false);
    });

    it('should extract array index', () => {
      expect(getControlArrayIndex('Text(0)')).toBe(0);
      expect(getControlArrayIndex('Command(5)')).toBe(5);
      expect(getControlArrayIndex('TextBox1')).toBe(-1);
    });

    it('should handle array operations', () => {
      const array = createControlArray('CommandButton', 'Command', 3);

      // Add element
      const newControl = { name: 'Command(3)', type: 'CommandButton' };
      array.push(newControl);

      expect(array).toHaveLength(4);
      expect(array[3].name).toBe('Command(3)');
    });

    it('should validate array consistency', () => {
      const controls = [
        { name: 'Text(0)' },
        { name: 'Text(1)' },
        { name: 'Text(3)' }, // Gap in indices
      ];

      const isValid = controls.every((c, i) => getControlArrayIndex(c.name) === i);

      expect(isValid).toBe(false);
    });

    it('should support dynamic array creation', () => {
      const baseControl = {
        type: 'TextBox',
        width: 100,
        height: 25,
      };

      const array = createControlArray(baseControl.type, 'DynamicText', 0, baseControl);

      // Dynamically add controls
      for (let i = 0; i < 3; i++) {
        array.push({
          ...baseControl,
          name: `DynamicText(${i})`,
          top: 50 * i,
        });
      }

      expect(array).toHaveLength(3);
      expect(array[2].top).toBe(100);
    });
  });

  describe('Control Defaults', () => {
    it('should provide default properties for controls', () => {
      const textBoxDefaults = getDefaultProperties('TextBox');

      expect(textBoxDefaults).toHaveProperty('Width', 121);
      expect(textBoxDefaults).toHaveProperty('Height', 21);
      expect(textBoxDefaults).toHaveProperty('Text', '');
      expect(textBoxDefaults).toHaveProperty('Enabled', true);
    });

    it('should merge properties with defaults', () => {
      const defaults = getDefaultProperties('CommandButton');
      const custom = {
        Caption: 'Click Me',
        Width: 150,
      };

      const merged = mergeProperties(defaults, custom);

      expect(merged.Caption).toBe('Click Me');
      expect(merged.Width).toBe(150);
      expect(merged.Height).toBe(defaults.Height); // Default preserved
    });

    it('should validate property values', () => {
      const props = {
        Width: -10, // Invalid
        Height: 100,
        Visible: 'yes', // Should be boolean
      };

      const validation = validateProperties('TextBox', props);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Width must be positive');
      expect(validation.errors).toContain('Visible must be boolean');
    });

    it('should handle control-specific validations', () => {
      const timerProps = {
        Interval: 0, // Should be > 0 for enabled timer
      };

      const validation = validateProperties('Timer', timerProps);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Interval must be greater than 0');
    });

    it('should provide property metadata', () => {
      const metadata = getPropertyMetadata('TextBox', 'MaxLength');

      expect(metadata.type).toBe('number');
      expect(metadata.min).toBe(0);
      expect(metadata.max).toBe(65535);
      expect(metadata.default).toBe(0);
    });
  });

  describe('Safe Expression Evaluator', () => {
    it('should evaluate simple expressions', () => {
      expect(evaluateExpression('2 + 2')).toBe(4);
      expect(evaluateExpression('10 * 5')).toBe(50);
      expect(evaluateExpression('100 / 4')).toBe(25);
    });

    it('should handle variables', () => {
      const context = {
        x: 10,
        y: 20,
      };

      expect(evaluateExpression('x + y', context)).toBe(30);
      expect(evaluateExpression('x * 2 + y', context)).toBe(40);
    });

    it('should support functions', () => {
      const context = {
        Math: Math,
      };

      expect(evaluateExpression('Math.sqrt(16)', context)).toBe(4);
      expect(evaluateExpression('Math.max(10, 20, 30)', context)).toBe(30);
    });

    it('should validate expressions before evaluation', () => {
      expect(validateExpression('2 + 2')).toBe(true);
      expect(validateExpression('eval("alert(1)")')).toBe(false); // Dangerous
      expect(validateExpression('__proto__')).toBe(false); // Prototype pollution
    });

    it('should parse expression AST', () => {
      const ast = parseExpression('a + b * c');

      expect(ast.type).toBe('BinaryExpression');
      expect(ast.operator).toBe('+');
      expect(ast.right.type).toBe('BinaryExpression');
      expect(ast.right.operator).toBe('*');
    });

    it('should handle errors gracefully', () => {
      expect(() => evaluateExpression('undefined.property')).not.toThrow();
      expect(evaluateExpression('undefined.property')).toBeUndefined();
    });

    it('should support conditional expressions', () => {
      const context = { x: 10 };

      expect(evaluateExpression('x > 5 ? "big" : "small"', context)).toBe('big');
      expect(evaluateExpression('x < 5 ? "small" : "big"', context)).toBe('big');
    });
  });

  describe('General Helper Functions', () => {
    describe('Debounce', () => {
      it('should debounce function calls', async () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced();
        debounced();

        expect(fn).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 150));

        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('should pass latest arguments', async () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 50);

        debounced(1);
        debounced(2);
        debounced(3);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(fn).toHaveBeenCalledWith(3);
      });
    });

    describe('Throttle', () => {
      it('should throttle function calls', async () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        await new Promise(resolve => setTimeout(resolve, 50));
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 60));
        throttled();

        expect(fn).toHaveBeenCalledTimes(2);
      });
    });

    describe('Memoize', () => {
      it('should cache function results', () => {
        const expensive = vi.fn((n: number) => n * n);
        const memoized = memoize(expensive);

        expect(memoized(5)).toBe(25);
        expect(memoized(5)).toBe(25);
        expect(expensive).toHaveBeenCalledTimes(1);

        expect(memoized(6)).toBe(36);
        expect(expensive).toHaveBeenCalledTimes(2);
      });

      it('should handle multiple arguments', () => {
        const fn = vi.fn((a: number, b: number) => a + b);
        const memoized = memoize(fn);

        memoized(2, 3);
        memoized(2, 3);
        memoized(3, 2);

        expect(fn).toHaveBeenCalledTimes(2); // Different argument order
      });
    });

    describe('Deep Clone', () => {
      it('should deep clone objects', () => {
        const original = {
          a: 1,
          b: { c: 2, d: [3, 4] },
          e: new Date(),
        };

        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.b).not.toBe(original.b);
        expect(cloned.b.d).not.toBe(original.b.d);
      });

      it('should handle circular references', () => {
        const obj: any = { a: 1 };
        obj.self = obj;

        const cloned = deepClone(obj);

        expect(cloned.a).toBe(1);
        expect(cloned.self).toBe(cloned);
      });
    });

    describe('Deep Merge', () => {
      it('should deep merge objects', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { b: { d: 3 }, e: 4 };

        const merged = deepMerge(obj1, obj2);

        expect(merged).toEqual({
          a: 1,
          b: { c: 2, d: 3 },
          e: 4,
        });
      });

      it('should handle arrays', () => {
        const obj1 = { arr: [1, 2] };
        const obj2 = { arr: [3, 4] };

        const merged = deepMerge(obj1, obj2);

        expect(merged.arr).toEqual([3, 4]); // Arrays are replaced, not merged
      });
    });

    describe('Deep Equality', () => {
      it('should check deep equality', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: 1, b: { c: 2 } };
        const obj3 = { a: 1, b: { c: 3 } };

        expect(isEqual(obj1, obj2)).toBe(true);
        expect(isEqual(obj1, obj3)).toBe(false);
      });

      it('should handle special cases', () => {
        expect(isEqual(NaN, NaN)).toBe(true);
        expect(isEqual(0, -0)).toBe(false);
        expect(isEqual(null, undefined)).toBe(false);
      });
    });

    describe('Object Utilities', () => {
      it('should pick properties', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const picked = pick(obj, ['a', 'c']);

        expect(picked).toEqual({ a: 1, c: 3 });
      });

      it('should omit properties', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 };
        const omitted = omit(obj, ['b', 'd']);

        expect(omitted).toEqual({ a: 1, c: 3 });
      });
    });

    describe('Array Utilities', () => {
      it('should group by property', () => {
        const items = [
          { type: 'fruit', name: 'apple' },
          { type: 'fruit', name: 'banana' },
          { type: 'vegetable', name: 'carrot' },
        ];

        const grouped = groupBy(items, 'type');

        expect(grouped.fruit).toHaveLength(2);
        expect(grouped.vegetable).toHaveLength(1);
      });

      it('should sort by property', () => {
        const items = [
          { id: 3, name: 'c' },
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
        ];

        const sorted = sortBy(items, 'id');

        expect(sorted[0].id).toBe(1);
        expect(sorted[2].id).toBe(3);
      });

      it('should chunk arrays', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7];
        const chunks = chunk(arr, 3);

        expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      });

      it('should flatten arrays', () => {
        const nested = [1, [2, 3], [[4]], [5, [6]]];
        const flat = flatten(nested);

        expect(flat).toEqual([1, 2, 3, 4, 5, 6]);
      });

      it('should get unique values', () => {
        const arr = [1, 2, 2, 3, 3, 3, 4];
        const uniq = unique(arr);

        expect(uniq).toEqual([1, 2, 3, 4]);
      });
    });
  });

  describe('String Utilities', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('camelCaseString')).toBe('camel-case-string');
      expect(toKebabCase('XMLHttpRequest')).toBe('xml-http-request');
    });

    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });

    it('should truncate strings', () => {
      const long = 'This is a very long string that needs to be truncated';
      expect(truncate(long, 20)).toBe('This is a very long...');
      expect(truncate(long, 20, '…')).toBe('This is a very long…');
    });

    it('should escape HTML', () => {
      const html = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(html);

      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should generate slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('VB6 & Web IDE')).toBe('vb6-web-ide');
    });
  });

  describe('Date Utilities', () => {
    it('should format dates', () => {
      const date = new Date('2024-01-15T10:30:00');

      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/01/2024');
      expect(formatDate(date, 'HH:mm:ss')).toBe('10:30:00');
    });

    it('should calculate date differences', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-31');

      expect(daysBetween(date1, date2)).toBe(30);
    });

    it('should add/subtract date intervals', () => {
      const date = new Date('2024-01-15');

      const future = addDays(date, 10);
      expect(future.getDate()).toBe(25);

      const past = subtractDays(date, 5);
      expect(past.getDate()).toBe(10);
    });

    it('should check relative dates', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isToday(today)).toBe(true);
      expect(isYesterday(yesterday)).toBe(true);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('not a url')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });

    it('should validate credit cards', () => {
      expect(isValidCreditCard('4111111111111111')).toBe(true); // Visa test
      expect(isValidCreditCard('1234567890123456')).toBe(false);
    });
  });

  describe('Performance Utilities', () => {
    it('should measure execution time', async () => {
      const timer = startTimer();

      await new Promise(resolve => setTimeout(resolve, 100));

      const elapsed = timer.stop();
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(150);
    });

    it('should profile function performance', () => {
      const fn = () => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i;
        }
        return sum;
      };

      const profile = profileFunction(fn);

      expect(profile.result).toBeDefined();
      expect(profile.time).toBeGreaterThan(0);
      expect(profile.memory).toBeDefined();
    });

    it('should batch operations', async () => {
      const operations = [];
      const batcher = createBatcher(items => {
        operations.push(items);
      }, 50);

      batcher.add(1);
      batcher.add(2);
      batcher.add(3);

      expect(operations).toHaveLength(0);

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(operations).toHaveLength(1);
      expect(operations[0]).toEqual([1, 2, 3]);
    });
  });
});
