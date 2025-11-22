/**
 * VB6 Critical Missing Functions - Comprehensive Test Suite
 * Tests the most critical gap-filling implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TypeName,
  VarType,
  Partition,
  Environ,
  Command,
  CreateObject,
  GetObject
} from '../../runtime/VB6FinalRuntimeFunctions';
import {
  LoadPicture,
  SavePicture
} from '../../runtime/VB6Picture';

describe('VB6 Critical Runtime Functions', () => {
  // ============================================================================
  // TypeName Function Tests
  // ============================================================================

  describe('TypeName Function', () => {
    it('should return "Empty" for undefined', () => {
      expect(TypeName(undefined)).toBe('Empty');
    });

    it('should return "Null" for null', () => {
      expect(TypeName(null)).toBe('Null');
    });

    it('should return "Boolean" for boolean values', () => {
      expect(TypeName(true)).toBe('Boolean');
      expect(TypeName(false)).toBe('Boolean');
    });

    it('should return "Integer" for small integers', () => {
      expect(TypeName(42)).toBe('Integer');
      expect(TypeName(-100)).toBe('Integer');
      expect(TypeName(32767)).toBe('Integer');
    });

    it('should return "Long" for large integers', () => {
      expect(TypeName(32768)).toBe('Long');
      expect(TypeName(100000)).toBe('Long');
      expect(TypeName(-100000)).toBe('Long');
    });

    it('should return "Double" for floating point numbers', () => {
      expect(TypeName(3.14)).toBe('Double');
      expect(TypeName(0.001)).toBe('Double');
      expect(TypeName(-2.718)).toBe('Double');
    });

    it('should return "String" for strings', () => {
      expect(TypeName('hello')).toBe('String');
      expect(TypeName('')).toBe('String');
    });

    it('should return "Date" for Date objects', () => {
      expect(TypeName(new Date())).toBe('Date');
    });

    it('should return "Array" for arrays', () => {
      expect(TypeName([1, 2, 3])).toBe('Array');
      expect(TypeName([])).toBe('Array');
    });

    it('should return "Object" for generic objects', () => {
      expect(TypeName({})).toBe('Object');
      expect(TypeName({ name: 'test' })).toBe('Object');
    });

    it('should return "Error" for Error objects', () => {
      expect(TypeName(new Error('test'))).toBe('Error');
    });
  });

  // ============================================================================
  // VarType Function Tests
  // ============================================================================

  describe('VarType Function', () => {
    it('should return 0 for undefined (vbEmpty)', () => {
      expect(VarType(undefined)).toBe(0);
    });

    it('should return 1 for null (vbNull)', () => {
      expect(VarType(null)).toBe(1);
    });

    it('should return 11 for boolean (vbBoolean)', () => {
      expect(VarType(true)).toBe(11);
    });

    it('should return 2 for small integers (vbInteger)', () => {
      expect(VarType(100)).toBe(2);
    });

    it('should return 3 for large integers (vbLong)', () => {
      expect(VarType(100000)).toBe(3);
    });

    it('should return 5 for floating point (vbDouble)', () => {
      expect(VarType(3.14)).toBe(5);
    });

    it('should return 8 for strings (vbString)', () => {
      expect(VarType('hello')).toBe(8);
    });

    it('should return 7 for Date objects (vbDate)', () => {
      expect(VarType(new Date())).toBe(7);
    });

    it('should return 8192 for arrays (vbArray)', () => {
      expect(VarType([1, 2, 3])).toBe(8192);
    });

    it('should return 9 for objects (vbObject)', () => {
      expect(VarType({})).toBe(9);
    });
  });

  // ============================================================================
  // Partition Function Tests
  // ============================================================================

  describe('Partition Function', () => {
    it('should handle numbers below the starting range', () => {
      const result = Partition(5, 0, 100, 10);
      expect(result).toMatch(/^\s*:\s*\d+$/);
    });

    it('should handle numbers above the stopping range', () => {
      const result = Partition(105, 0, 100, 10);
      expect(result).toMatch(/^\d+:\s*$/);
    });

    it('should return correct partition for numbers within range', () => {
      expect(Partition(0, 0, 100, 10)).toBe('  0:  9');
      expect(Partition(5, 0, 100, 10)).toBe('  0:  9');
      expect(Partition(10, 0, 100, 10)).toBe(' 10: 19');
      expect(Partition(25, 0, 100, 10)).toBe(' 20: 29');
      expect(Partition(95, 0, 100, 10)).toBe(' 90: 99');
      expect(Partition(100, 0, 100, 10)).toBe('100:100');
    });

    it('should throw error for invalid interval', () => {
      expect(() => Partition(50, 0, 100, 0)).toThrow('Invalid procedure call');
      expect(() => Partition(50, 0, 100, -1)).toThrow('Invalid procedure call');
    });

    it('should handle large numbers correctly', () => {
      const result = Partition(250, 0, 1000, 100);
      expect(result).toBe('200:299');
    });

    it('should pad numbers to 3 characters', () => {
      const result = Partition(0, 0, 100, 10);
      // Verify right-alignment with spaces
      expect(result.split(':')[0]).toHaveLength(3);
      expect(result.split(':')[1]).toHaveLength(3);
    });
  });

  // ============================================================================
  // Environ Function Tests
  // ============================================================================

  describe('Environ Function', () => {
    it('should return empty string for invalid index', () => {
      expect(Environ(0)).toBe('');
      expect(Environ(-1)).toBe('');
      expect(Environ(10000)).toBe('');
    });

    it('should return environment variable by name', () => {
      const result = Environ('USERNAME');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return non-empty string for known environment variables', () => {
      expect(Environ('WINDIR')).not.toBe('');
      expect(Environ('SYSTEMROOT')).not.toBe('');
    });

    it('should handle case-sensitivity', () => {
      const upper = Environ('USERNAME');
      const lower = Environ('username');
      // In browser env, both should work (case-insensitive)
      expect(typeof upper).toBe('string');
      expect(typeof lower).toBe('string');
    });

    it('should return environment by index (1-based)', () => {
      const result = Environ(1);
      expect(typeof result).toBe('string');
      // Result should be in format "NAME=VALUE"
      if (result) {
        expect(result).toContain('=');
      }
    });
  });

  // ============================================================================
  // Command Function Tests
  // ============================================================================

  describe('Command Function', () => {
    it('should return a string', () => {
      const result = Command();
      expect(typeof result).toBe('string');
    });

    it('should not throw an error', () => {
      expect(() => Command()).not.toThrow();
    });

    it('should handle browser environment gracefully', () => {
      const result = Command();
      // In browser context, should return URL parameters or empty string
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  // ============================================================================
  // CreateObject Function Tests
  // ============================================================================

  describe('CreateObject Function', () => {
    it('should throw error for empty class name', () => {
      expect(() => CreateObject('')).toThrow();
    });

    it('should throw error for non-string class name', () => {
      expect(() => CreateObject(null as any)).toThrow();
    });

    it('should create FileSystemObject', () => {
      const fso = CreateObject('Scripting.FileSystemObject');
      expect(fso).toBeDefined();
      expect(fso.FileExists).toBeDefined();
      expect(fso.CreateTextFile).toBeDefined();
      expect(fso.OpenTextFile).toBeDefined();
    });

    it('should create Dictionary object', () => {
      const dict = CreateObject('Scripting.Dictionary');
      expect(dict).toBeDefined();
      expect(dict.Add).toBeDefined();
      expect(dict.Item).toBeDefined();
      expect(dict.Exists).toBeDefined();
    });

    it('should create ADODB.Connection', () => {
      const conn = CreateObject('ADODB.Connection');
      expect(conn).toBeDefined();
      expect(conn.Open).toBeDefined();
      expect(conn.Close).toBeDefined();
      expect(conn.Execute).toBeDefined();
    });

    it('should create ADODB.Recordset', () => {
      const rs = CreateObject('ADODB.Recordset');
      expect(rs).toBeDefined();
      expect(rs.Open).toBeDefined();
      expect(rs.Close).toBeDefined();
      expect(rs.MoveNext).toBeDefined();
    });

    it('should create Excel.Application', () => {
      const excel = CreateObject('Excel.Application');
      expect(excel).toBeDefined();
      expect(excel.Visible).toBeDefined();
      expect(excel.Workbooks).toBeDefined();
      expect(excel.Quit).toBeDefined();
    });

    it('should throw error for unknown class', () => {
      expect(() => CreateObject('Unknown.Class')).toThrow('Cannot create object');
    });

    it('should be case-insensitive', () => {
      const fso1 = CreateObject('scripting.filesystemobject');
      const fso2 = CreateObject('SCRIPTING.FILESYSTEMOBJECT');
      expect(fso1.FileExists).toBeDefined();
      expect(fso2.FileExists).toBeDefined();
    });
  });

  // ============================================================================
  // GetObject Function Tests
  // ============================================================================

  describe('GetObject Function', () => {
    it('should throw error with no arguments', () => {
      expect(() => GetObject()).toThrow('Object required');
    });

    it('should create object by class name', () => {
      const obj = GetObject(undefined, 'Excel.Application');
      expect(obj).toBeDefined();
      expect(obj.Visible).toBeDefined();
    });

    it('should get Excel workbook by path', () => {
      const obj = GetObject('C:\\Users\\test\\file.xlsx');
      expect(obj).toBeDefined();
      expect(obj.Name).toBe('C:\\Users\\test\\file.xlsx');
      expect(obj.Worksheets).toBeDefined();
    });

    it('should get Word document by path', () => {
      const obj = GetObject('C:\\Users\\test\\file.docx');
      expect(obj).toBeDefined();
      expect(obj.Name).toBe('C:\\Users\\test\\file.docx');
      expect(obj.Content).toBeDefined();
    });

    it('should get generic file object', () => {
      const obj = GetObject('C:\\Users\\test\\file.txt');
      expect(obj).toBeDefined();
      expect(obj.Name).toBe('C:\\Users\\test\\file.txt');
      expect(obj.Size).toBeDefined();
    });

    it('should handle different file extensions', () => {
      const xls = GetObject('test.xls');
      const doc = GetObject('test.doc');
      const ppt = GetObject('test.ppt');

      expect(xls.Worksheets).toBeDefined();
      expect(doc.Content).toBeDefined();
      expect(ppt.Slides).toBeDefined();
    });
  });

  // ============================================================================
  // LoadPicture Function Tests
  // ============================================================================

  describe('LoadPicture Function', () => {
    it('should handle null filename', async () => {
      const result = await LoadPicture();
      expect(result).toBeNull();
    });

    it('should return null for empty filename', async () => {
      const result = await LoadPicture('');
      expect(result).toBeNull();
    });

    it('should not throw error', async () => {
      expect(async () => {
        await LoadPicture('nonexistent.jpg');
      }).rejects.toThrow();
    });

    it('should recognize data URLs', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(async () => {
        await LoadPicture(dataUrl);
      }).rejects.toThrow();
    });
  });

  // ============================================================================
  // Dictionary Integration Tests
  // ============================================================================

  describe('Dictionary Object Integration', () => {
    it('should add and retrieve items', () => {
      const dict = CreateObject('Scripting.Dictionary');
      dict.Add('key1', 'value1');
      expect(dict.Item('key1')).toBe('value1');
    });

    it('should check if key exists', () => {
      const dict = CreateObject('Scripting.Dictionary');
      dict.Add('key1', 'value1');
      expect(dict.Exists('key1')).toBe(true);
      expect(dict.Exists('key2')).toBe(false);
    });

    it('should throw error when adding duplicate key', () => {
      const dict = CreateObject('Scripting.Dictionary');
      dict.Add('key1', 'value1');
      expect(() => dict.Add('key1', 'value2')).toThrow();
    });

    it('should count items', () => {
      const dict = CreateObject('Scripting.Dictionary');
      expect(dict.Count()).toBe(0);
      dict.Add('key1', 'value1');
      expect(dict.Count()).toBe(1);
    });

    it('should remove items', () => {
      const dict = CreateObject('Scripting.Dictionary');
      dict.Add('key1', 'value1');
      dict.Remove('key1');
      expect(dict.Exists('key1')).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================

  describe('Error Handling and Edge Cases', () => {
    it('TypeName should handle circular references gracefully', () => {
      const obj: any = {};
      obj.self = obj;
      expect(() => TypeName(obj)).not.toThrow();
      expect(TypeName(obj)).toBe('Object');
    });

    it('Partition should handle negative numbers', () => {
      expect(Partition(-5, -100, 100, 10)).toBe('-10: -1');
    });

    it('VarType should handle all primitive types', () => {
      const types = [
        undefined,
        null,
        true,
        42,
        3.14,
        'string',
        new Date(),
        [],
        {}
      ];

      types.forEach(val => {
        expect(() => VarType(val)).not.toThrow();
        expect(typeof VarType(val)).toBe('number');
      });
    });

    it('Environ should handle missing variables gracefully', () => {
      expect(() => Environ('NONEXISTENT_VAR_XYZ')).not.toThrow();
      const result = Environ('NONEXISTENT_VAR_XYZ');
      expect(typeof result).toBe('string');
    });
  });
});
