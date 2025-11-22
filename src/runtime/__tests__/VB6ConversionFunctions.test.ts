import { describe, it, expect } from 'vitest';
import {
  CBool,
  CByte,
  CInt,
  CLng,
  CSng,
  CDbl,
  CCur,
  CDate,
  CStr,
  CDec,
  CVar,
  CVErr,
  Error,
  Fix,
  Int,
  Hex,
  Oct,
  Str,
  Val,
  Format,
  FormatCurrency,
  FormatNumber,
  FormatPercent,
  FormatDateTime,
  VB6FormatConstants
} from '../VB6ConversionFunctions';

describe('VB6ConversionFunctions', () => {
  describe('CBool', () => {
    it('should convert numbers to boolean', () => {
      expect(CBool(0)).toBe(false);
      expect(CBool(1)).toBe(true);
      expect(CBool(-1)).toBe(true);
      expect(CBool(100)).toBe(true);
    });

    it('should convert strings to boolean', () => {
      expect(CBool('True')).toBe(true);
      expect(CBool('False')).toBe(false);
      expect(CBool('1')).toBe(true);
      expect(CBool('0')).toBe(false);
      expect(CBool('Hello')).toBe(true);
      expect(CBool('')).toBe(false);
    });

    it('should convert null/undefined to false', () => {
      expect(CBool(null)).toBe(false);
      expect(CBool(undefined)).toBe(false);
    });
  });

  describe('CByte', () => {
    it('should convert to byte (0-255)', () => {
      expect(CByte(0)).toBe(0);
      expect(CByte(255)).toBe(255);
      expect(CByte(100.7)).toBe(100);
      expect(CByte('42')).toBe(42);
    });

    it('should throw on overflow', () => {
      expect(() => CByte(256)).toThrow('Overflow');
      expect(() => CByte(-1)).toThrow('Overflow');
    });
  });

  describe('CInt', () => {
    it('should convert to integer with banker\'s rounding', () => {
      expect(CInt(1.5)).toBe(2);  // Round to even
      expect(CInt(2.5)).toBe(2);  // Round to even
      expect(CInt(3.5)).toBe(4);  // Round to even
      expect(CInt(1.6)).toBe(2);
      expect(CInt(-1.5)).toBe(-2);
    });

    it('should handle string conversion', () => {
      expect(CInt('123')).toBe(123);
      expect(CInt('-456')).toBe(-456);
    });

    it('should throw on overflow', () => {
      expect(() => CInt(32768)).toThrow('Overflow');
      expect(() => CInt(-32769)).toThrow('Overflow');
    });
  });

  describe('CLng', () => {
    it('should convert to long integer', () => {
      expect(CLng(123456)).toBe(123456);
      expect(CLng('999999')).toBe(999999);
      expect(CLng(1.5)).toBe(2);
    });
  });

  describe('CSng', () => {
    it('should convert to single precision', () => {
      expect(CSng(3.14159)).toBeCloseTo(3.14159, 5);
      expect(CSng('1.23')).toBeCloseTo(1.23, 2);
    });

    it('should handle underflow', () => {
      expect(CSng(1e-50)).toBe(0);
    });
  });

  describe('CDbl', () => {
    it('should convert to double', () => {
      expect(CDbl(3.14159265359)).toBe(3.14159265359);
      expect(CDbl('2.71828')).toBe(2.71828);
      expect(CDbl(true)).toBe(-1);
      expect(CDbl(false)).toBe(0);
    });
  });

  describe('CCur', () => {
    it('should convert to currency (4 decimal places)', () => {
      expect(CCur(123.45678)).toBe(123.4568);
      expect(CCur('99.999')).toBe(99.999);
      expect(CCur(0.00005)).toBe(0.0001);
    });
  });

  describe('CDate', () => {
    it('should convert strings to dates', () => {
      const date1 = CDate('1/1/2024');
      expect(date1.getFullYear()).toBe(2024);
      expect(date1.getMonth()).toBe(0);
      expect(date1.getDate()).toBe(1);
    });

    it('should convert date serial numbers', () => {
      const date2 = CDate(0); // 12/30/1899
      expect(date2.getFullYear()).toBe(1899);
      expect(date2.getMonth()).toBe(11);
      expect(date2.getDate()).toBe(30);
    });
  });

  describe('CStr', () => {
    it('should convert to string', () => {
      expect(CStr(123)).toBe('123');
      expect(CStr(true)).toBe('True');
      expect(CStr(false)).toBe('False');
      expect(CStr(null)).toBe('');
    });

    it('should format dates', () => {
      const date = new Date(2024, 0, 1, 12, 30, 0);
      const str = CStr(date);
      expect(str).toContain('1/1/2024');
      expect(str).toContain('12:30');
    });
  });

  describe('Val', () => {
    it('should extract numeric value from string', () => {
      expect(Val('123')).toBe(123);
      expect(Val('  456.78')).toBe(456.78);
      expect(Val('12.34abc')).toBe(12.34);
      expect(Val('abc123')).toBe(0);
      expect(Val('-99.9')).toBe(-99.9);
      expect(Val('+42')).toBe(42);
    });
  });

  describe('Hex', () => {
    it('should convert to hexadecimal', () => {
      expect(Hex(255)).toBe('FF');
      expect(Hex(16)).toBe('10');
      expect(Hex(-1)).toBe('FFFFFFFF');
    });
  });

  describe('Oct', () => {
    it('should convert to octal', () => {
      expect(Oct(8)).toBe('10');
      expect(Oct(64)).toBe('100');
      expect(Oct(7)).toBe('7');
    });
  });

  describe('Fix and Int', () => {
    it('Fix should truncate towards zero', () => {
      expect(Fix(1.7)).toBe(1);
      expect(Fix(-1.7)).toBe(-1);
      expect(Fix(0)).toBe(0);
    });

    it('Int should always round down', () => {
      expect(Int(1.7)).toBe(1);
      expect(Int(-1.7)).toBe(-2);
      expect(Int(0)).toBe(0);
    });
  });

  describe('Format', () => {
    it('should format numbers with predefined formats', () => {
      expect(Format(1234.5, 'Currency')).toBe('$1,234.50');
      expect(Format(0.75, 'Percent')).toBe('75.00%');
      expect(Format(1234567.89, 'Standard')).toBe('1,234,567.89');
      expect(Format(1234.5, 'Fixed')).toBe('1234.50');
      expect(Format(1234.5, 'Scientific')).toBe('1.23e+3');
    });

    it('should format boolean values', () => {
      expect(Format(1, 'Yes/No')).toBe('Yes');
      expect(Format(0, 'Yes/No')).toBe('No');
      expect(Format(-1, 'True/False')).toBe('True');
      expect(Format(0, 'On/Off')).toBe('Off');
    });

    it('should format dates', () => {
      const date = new Date(2024, 0, 15);
      expect(Format(date, 'mm/dd/yyyy')).toBe('01/15/2024');
      expect(Format(date, 'd mmmm yyyy')).toBe('15 January 2024');
    });
  });

  describe('FormatCurrency', () => {
    it('should format as currency', () => {
      expect(FormatCurrency(1234.567)).toBe('$1,234.57');
      expect(FormatCurrency(-1234.567)).toBe('($1,234.57)');
      expect(FormatCurrency(1234.567, 0)).toBe('$1,235');
      expect(FormatCurrency(0.5, 2, 0)).toBe('$.50');
    });
  });

  describe('FormatNumber', () => {
    it('should format numbers', () => {
      expect(FormatNumber(1234.567)).toBe('1,234.57');
      expect(FormatNumber(-1234.567)).toBe('(1,234.57)');
      expect(FormatNumber(1234.567, 3)).toBe('1,234.567');
      expect(FormatNumber(1234567.89, 0)).toBe('1,234,568');
    });
  });

  describe('FormatPercent', () => {
    it('should format as percentage', () => {
      expect(FormatPercent(0.75)).toBe('75.00%');
      expect(FormatPercent(1.5)).toBe('150.00%');
      expect(FormatPercent(-0.25)).toBe('(25.00%)');
      expect(FormatPercent(0.12345, 1)).toBe('12.3%');
    });
  });

  describe('FormatDateTime', () => {
    it('should format date/time with named formats', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      
      expect(FormatDateTime(date, VB6FormatConstants.vbShortDate)).toBe('1/15/2024');
      expect(FormatDateTime(date, VB6FormatConstants.vbLongDate)).toContain('January');
      expect(FormatDateTime(date, VB6FormatConstants.vbShortTime)).toMatch(/2:30/);
      expect(FormatDateTime(date, VB6FormatConstants.vbLongTime)).toMatch(/2:30:45/);
    });
  });

  describe('CVErr', () => {
    it('should create error objects', () => {
      const err = CVErr(13);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Type mismatch');
      expect((err as any).number).toBe(13);
    });
  });

  describe('Error', () => {
    it('should return error message', () => {
      expect(Error(6)).toBe('Overflow');
      expect(Error(13)).toBe('Type mismatch');
      expect(Error(9)).toBe('Subscript out of range');
    });
  });
});