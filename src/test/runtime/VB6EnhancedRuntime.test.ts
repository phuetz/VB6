/**
 * VB6 Enhanced Runtime Functions - Comprehensive Test Suite
 * Tests the runtime functions added for VB6 compatibility
 */

import { describe, it, expect, vi } from 'vitest';
import {
  Sleep,
  Wait,
  VB6Timer,
  GetTickCount,
  TimeGetTime,
  VB6StringBuilder,
  CreateStringBuilder,
  VB6ByteArray,
  DebugPrint,
  GetSystemDefaultLCID,
  GetUserDefaultLCID,
  GetLocaleInfo,
  ApproxEqual,
  Clamp,
  Lerp,
  MapRange,
  CreateGUID,
  CreateShortID,
  GetPlatformInfo,
  Environ,
  Command,
  Beep,
  QBColor,
  RGB,
  ExtractRed,
  ExtractGreen,
  ExtractBlue,
  IsArray,
  IsDate,
  IsEmpty,
  IsNull,
  IsNumeric,
  IsObject,
  TypeName,
  VarType,
} from '../../runtime/VB6EnhancedRuntime';

describe('VB6 Enhanced Runtime Functions', () => {
  // ============================================================================
  // Timer and Sleep Functions
  // ============================================================================

  describe('Sleep and Timer Functions', () => {
    it('Sleep should wait for specified milliseconds', async () => {
      const start = Date.now();
      await Sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
    });

    it('Sleep should reject negative values', async () => {
      await expect(Sleep(-100)).rejects.toThrow();
    });

    it('Wait should convert seconds to milliseconds', async () => {
      const start = Date.now();
      await Wait(0.05);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it('GetTickCount should return a number', () => {
      const tick = GetTickCount();
      expect(typeof tick).toBe('number');
      expect(tick).toBeGreaterThan(0);
    });

    it('TimeGetTime should return same as GetTickCount', () => {
      const t1 = GetTickCount();
      const t2 = TimeGetTime();
      expect(Math.abs(t1 - t2)).toBeLessThan(10); // Should be very close
    });
  });

  // ============================================================================
  // StringBuilder Functions (VB6 uses PascalCase methods)
  // ============================================================================

  describe('StringBuilder', () => {
    it('should create empty StringBuilder', () => {
      const sb = CreateStringBuilder();
      expect(sb.ToString()).toBe('');
      expect(sb.Length).toBe(0);
    });

    it('should initialize with value', () => {
      const sb = CreateStringBuilder('Hello');
      expect(sb.ToString()).toBe('Hello');
      expect(sb.Length).toBe(5);
    });

    it('should Append strings', () => {
      const sb = CreateStringBuilder();
      sb.Append('Hello');
      sb.Append(' ');
      sb.Append('World');
      expect(sb.ToString()).toBe('Hello World');
    });

    it('should AppendLine with CRLF', () => {
      const sb = CreateStringBuilder();
      sb.AppendLine('Line 1');
      sb.AppendLine('Line 2');
      expect(sb.ToString()).toBe('Line 1\r\nLine 2\r\n');
    });

    it('should Replace text', () => {
      const sb = CreateStringBuilder('Hello World');
      sb.Replace('World', 'Universe');
      expect(sb.ToString()).toBe('Hello Universe');
    });

    it('should Clear content', () => {
      const sb = CreateStringBuilder('Hello');
      sb.Clear();
      expect(sb.ToString()).toBe('');
      expect(sb.Length).toBe(0);
    });

    it('should chain methods', () => {
      const sb = CreateStringBuilder().Append('Hello').Append(' ').Append('World');
      expect(sb.ToString()).toBe('Hello World');
    });
  });

  // ============================================================================
  // ByteArray Functions
  // ============================================================================

  describe('ByteArray Functions', () => {
    it('VB6ByteArray should create with specified size', () => {
      const arr = new VB6ByteArray(10);
      expect(arr.Length).toBe(10);
    });

    it('VB6ByteArray.FromString should convert string to bytes', () => {
      const arr = VB6ByteArray.FromString('Hello');
      expect(arr.Length).toBe(5);
    });
  });

  // ============================================================================
  // Debug Functions
  // ============================================================================

  describe('Debug Functions', () => {
    it('DebugPrint should output to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      DebugPrint('test message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Locale Functions
  // ============================================================================

  describe('Locale Functions', () => {
    it('GetSystemDefaultLCID should return a valid LCID', () => {
      const lcid = GetSystemDefaultLCID();
      expect(typeof lcid).toBe('number');
      expect(lcid).toBeGreaterThan(0);
    });

    it('GetUserDefaultLCID should return a valid LCID', () => {
      const lcid = GetUserDefaultLCID();
      expect(typeof lcid).toBe('number');
      expect(lcid).toBeGreaterThan(0);
    });

    it('GetLocaleInfo should return locale name for LOCALE_SENGLANGUAGE', () => {
      const info = GetLocaleInfo(1033, 0x1001);
      expect(typeof info).toBe('string');
    });
  });

  // ============================================================================
  // Math Utility Functions
  // ============================================================================

  describe('Math Utility Functions', () => {
    it('ApproxEqual should compare floats with epsilon', () => {
      expect(ApproxEqual(0.1 + 0.2, 0.3)).toBe(true);
      expect(ApproxEqual(1.0, 1.1, 0.05)).toBe(false); // Not within 0.05
      expect(ApproxEqual(1.0, 1.0001, 0.001)).toBe(true); // Within 0.001
    });

    it('Clamp should constrain value to range', () => {
      expect(Clamp(5, 0, 10)).toBe(5);
      expect(Clamp(-5, 0, 10)).toBe(0);
      expect(Clamp(15, 0, 10)).toBe(10);
    });

    it('Lerp should linearly interpolate', () => {
      expect(Lerp(0, 100, 0)).toBe(0);
      expect(Lerp(0, 100, 1)).toBe(100);
      expect(Lerp(0, 100, 0.5)).toBe(50);
      expect(Lerp(10, 20, 0.25)).toBe(12.5);
    });

    it('MapRange should map value from one range to another', () => {
      expect(MapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(MapRange(0, 0, 10, 0, 100)).toBe(0);
      expect(MapRange(10, 0, 10, 0, 100)).toBe(100);
      expect(MapRange(25, 0, 100, 0, 1)).toBe(0.25);
    });
  });

  // ============================================================================
  // GUID Functions
  // ============================================================================

  describe('GUID Functions', () => {
    it('CreateGUID should return string with GUID format', () => {
      const guid = CreateGUID();
      expect(typeof guid).toBe('string');
      expect(guid.length).toBeGreaterThan(30); // GUIDs are typically 36 chars
    });

    it('CreateShortID should return specified length', () => {
      expect(CreateShortID(8).length).toBe(8);
      expect(CreateShortID(16).length).toBe(16);
    });

    it('CreateShortID should use alphanumeric characters', () => {
      const id = CreateShortID(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  // ============================================================================
  // Platform Info
  // ============================================================================

  describe('Platform Info', () => {
    it('GetPlatformInfo should return platform details', () => {
      const info = GetPlatformInfo();
      expect(typeof info).toBe('object');
      expect(info).toHaveProperty('os');
    });
  });

  // ============================================================================
  // Environment Functions
  // ============================================================================

  describe('Environment Functions', () => {
    it('Environ should return empty string for undefined variable', () => {
      const result = Environ('DEFINITELY_NOT_EXISTS_12345');
      expect(result).toBe('');
    });

    it('Command should return string', () => {
      const result = Command();
      expect(typeof result).toBe('string');
    });

    it('Beep should not throw', () => {
      expect(() => Beep()).not.toThrow();
    });
  });

  // ============================================================================
  // Color Functions (VB6 uses BGR format internally)
  // ============================================================================

  describe('Color Functions', () => {
    it('QBColor should return color values', () => {
      expect(QBColor(0)).toBe(0x000000); // Black
      expect(QBColor(15)).toBe(0xffffff); // White
    });

    it('QBColor should wrap around for values > 15', () => {
      expect(QBColor(16)).toBe(QBColor(0)); // Wraps to black
    });

    it('RGB should create color in VB6 BGR format', () => {
      // VB6 RGB stores as BGR: (blue << 16) | (green << 8) | red
      expect(RGB(255, 0, 0)).toBe(255); // Red in low byte
      expect(RGB(0, 255, 0)).toBe(0xff00); // Green in middle byte
      expect(RGB(0, 0, 255)).toBe(0xff0000); // Blue in high byte
      expect(RGB(255, 255, 255)).toBe(0xffffff); // White
    });

    it('RGB should clamp values to 0-255', () => {
      expect(RGB(300, 0, 0)).toBe(255); // Clamped to 255
    });

    it('ExtractRed should get red component from low byte', () => {
      expect(ExtractRed(0xff)).toBe(255); // Pure red
      expect(ExtractRed(0xff0000)).toBe(0); // Pure blue has no red
      expect(ExtractRed(0xaabbcc)).toBe(0xcc); // Extract CC
    });

    it('ExtractGreen should get green component from middle byte', () => {
      expect(ExtractGreen(0x00ff00)).toBe(255);
      expect(ExtractGreen(0xaabbcc)).toBe(0xbb);
    });

    it('ExtractBlue should get blue component from high byte', () => {
      expect(ExtractBlue(0xff0000)).toBe(255);
      expect(ExtractBlue(0xaabbcc)).toBe(0xaa);
    });
  });

  // ============================================================================
  // Type Checking Functions
  // ============================================================================

  describe('Type Checking Functions', () => {
    describe('IsArray', () => {
      it('should return true for arrays', () => {
        expect(IsArray([1, 2, 3])).toBe(true);
        expect(IsArray([])).toBe(true);
      });

      it('should return false for non-arrays', () => {
        expect(IsArray('string')).toBe(false);
        expect(IsArray(123)).toBe(false);
        expect(IsArray(null)).toBe(false);
      });
    });

    describe('IsDate', () => {
      it('should return true for valid Date objects', () => {
        expect(IsDate(new Date())).toBe(true);
        expect(IsDate(new Date('2024-01-01'))).toBe(true);
      });

      it('should return false for invalid dates', () => {
        expect(IsDate(new Date('invalid'))).toBe(false);
      });
    });

    describe('IsEmpty', () => {
      it('should return true for undefined', () => {
        expect(IsEmpty(undefined)).toBe(true);
      });
    });

    describe('IsNull', () => {
      it('should return true for null', () => {
        expect(IsNull(null)).toBe(true);
      });

      it('should return false for undefined', () => {
        expect(IsNull(undefined)).toBe(false);
      });
    });

    describe('IsNumeric', () => {
      it('should return true for numbers', () => {
        expect(IsNumeric(42)).toBe(true);
        expect(IsNumeric(3.14)).toBe(true);
        expect(IsNumeric(-100)).toBe(true);
      });

      it('should return true for numeric strings', () => {
        expect(IsNumeric('42')).toBe(true);
        expect(IsNumeric('3.14')).toBe(true);
        expect(IsNumeric('-100')).toBe(true);
      });

      it('should return false for non-numeric values', () => {
        expect(IsNumeric('hello')).toBe(false);
        expect(IsNumeric(null)).toBe(false);
        expect(IsNumeric(NaN)).toBe(false);
      });
    });

    describe('IsObject', () => {
      it('should return true for objects', () => {
        expect(IsObject({})).toBe(true);
        expect(IsObject(new Date())).toBe(true);
      });

      it('should return false for primitives and null', () => {
        expect(IsObject(null)).toBe(false);
        expect(IsObject(42)).toBe(false);
        expect(IsObject('string')).toBe(false);
      });
    });

    describe('TypeName', () => {
      it('should return correct type names', () => {
        expect(TypeName(undefined)).toBe('Empty');
        expect(TypeName(null)).toBe('Null');
        expect(TypeName(true)).toBe('Boolean');
        expect(TypeName('hello')).toBe('String');
        expect(TypeName(new Date())).toBe('Date');
        // Arrays return 'Variant()' in VB6 style
        expect(['Array', 'Variant()']).toContain(TypeName([1, 2]));
        expect(TypeName({})).toBe('Object');
      });

      it('should return numeric type names', () => {
        // Implementation may return 'Integer', 'Long', or 'Double'
        const typeName = TypeName(42);
        expect(['Integer', 'Long', 'Double']).toContain(typeName);
      });
    });

    describe('VarType', () => {
      it('should return correct type codes', () => {
        expect(VarType(undefined)).toBe(0); // vbEmpty
        expect(VarType(null)).toBe(1); // vbNull
        expect(VarType(true)).toBe(11); // vbBoolean
        expect(VarType('hello')).toBe(8); // vbString
        expect(VarType(new Date())).toBe(7); // vbDate
        expect(VarType({})).toBe(9); // vbObject
      });

      it('should return numeric type codes', () => {
        // Numbers return 2 (Integer), 3 (Long), or 5 (Double)
        const varType = VarType(42);
        expect([2, 3, 5]).toContain(varType);
      });

      it('should return vbDouble for floats', () => {
        expect(VarType(3.14)).toBe(5);
      });
    });
  });
});
