/**
 * VB6 Enum Support Test Suite
 * Tests complete support for Enum declarations and usage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VB6EnumProcessor, VB6BuiltinEnums } from '../../compiler/VB6EnumSupport';

describe('VB6 Enum Support', () => {

  describe('Enum Processor - Parsing', () => {
    let processor: VB6EnumProcessor;

    beforeEach(() => {
      processor = new VB6EnumProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should parse simple Enum declaration', () => {
      const code = 'Enum Colors';
      const result = processor.parseEnumDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Colors');
      expect(result?.public).toBe(false);
      expect(result?.module).toBe('TestModule');
    });

    it('should parse Public Enum declaration', () => {
      const code = 'Public Enum Status';
      const result = processor.parseEnumDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Status');
      expect(result?.public).toBe(true);
    });

    it('should parse Private Enum declaration', () => {
      const code = 'Private Enum InternalState';
      const result = processor.parseEnumDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('InternalState');
      expect(result?.public).toBe(false);
    });

    it('should parse enum member without explicit value', () => {
      const code = '    Red';
      const result = processor.parseEnumMember(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Red');
      expect(result?.explicitValue).toBe(false);
    });

    it('should parse enum member with explicit value', () => {
      const code = '    Red = 1';
      const result = processor.parseEnumMember(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Red');
      expect(result?.value).toBe(1);
      expect(result?.explicitValue).toBe(true);
    });

    it('should parse enum member with hex value', () => {
      const code = '    FlagA = &H10';
      const result = processor.parseEnumMember(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('FlagA');
      expect(result?.value).toBe(16);
      expect(result?.explicitValue).toBe(true);
    });

    it('should parse enum member with octal value', () => {
      const code = '    Octal = &O20';
      const result = processor.parseEnumMember(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Octal');
      expect(result?.value).toBe(16); // Octal 20 = decimal 16
      expect(result?.explicitValue).toBe(true);
    });

    it('should parse enum member with binary value', () => {
      const code = '    Binary = &B1010';
      const result = processor.parseEnumMember(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Binary');
      expect(result?.value).toBe(10);
      expect(result?.explicitValue).toBe(true);
    });

    it('should parse enum member with simple value', () => {
      const code = '    Calculated = 8';
      const result = processor.parseEnumMember(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Calculated');
      expect(result?.value).toBe(8);
      expect(result?.explicitValue).toBe(true);
    });

    it('should process complete enum with auto-increment', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Colors', 1);
      expect(enumDecl).not.toBeNull();

      const memberLines = [
        'Red',
        'Green',
        'Blue'
      ];

      const result = processor.processEnum(enumDecl!, memberLines);

      expect(result.members).toHaveLength(3);
      expect(result.members[0].name).toBe('Red');
      expect(result.members[0].value).toBe(0);
      expect(result.members[1].name).toBe('Green');
      expect(result.members[1].value).toBe(1);
      expect(result.members[2].name).toBe('Blue');
      expect(result.members[2].value).toBe(2);
    });

    it('should process enum with mixed explicit and implicit values', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Status', 1);
      expect(enumDecl).not.toBeNull();

      const memberLines = [
        'Unknown',           // 0
        'Pending',          // 1
        'Active = 10',      // 10
        'Paused',           // 11
        'Completed = 100',  // 100
        'Failed'            // 101
      ];

      const result = processor.processEnum(enumDecl!, memberLines);

      expect(result.members).toHaveLength(6);
      expect(result.members[0].value).toBe(0);
      expect(result.members[1].value).toBe(1);
      expect(result.members[2].value).toBe(10);
      expect(result.members[3].value).toBe(11);
      expect(result.members[4].value).toBe(100);
      expect(result.members[5].value).toBe(101);
    });

    it('should handle flag-style enums with powers of 2', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Permissions', 1);
      expect(enumDecl).not.toBeNull();

      const memberLines = [
        'None = 0',
        'Read = 1',
        'Write = 2',
        'Execute = 4',
        'Delete = 8',
        'All = &HF'  // 15
      ];

      const result = processor.processEnum(enumDecl!, memberLines);

      expect(result.members).toHaveLength(6);
      expect(result.members[0].value).toBe(0);
      expect(result.members[1].value).toBe(1);
      expect(result.members[2].value).toBe(2);
      expect(result.members[3].value).toBe(4);
      expect(result.members[4].value).toBe(8);
      expect(result.members[5].value).toBe(15);
    });
  });

  describe('Enum Processor - Registry & Lookup', () => {
    let processor: VB6EnumProcessor;

    beforeEach(() => {
      processor = new VB6EnumProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should register and retrieve public enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Public Enum Colors', 1);
      const memberLines = ['Red', 'Green', 'Blue'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      processor.registerEnum(processed);

      const retrieved = processor.getEnum('Colors');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Colors');
      expect(retrieved?.members).toHaveLength(3);
    });

    it('should register and retrieve private enum with module scope', () => {
      const enumDecl = processor.parseEnumDeclaration('Private Enum LocalColors', 1);
      const memberLines = ['Red', 'Green'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      processor.registerEnum(processed);

      const retrieved = processor.getEnum('LocalColors');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('LocalColors');
    });

    it('should get enum member value', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Status', 1);
      const memberLines = ['Unknown', 'Active = 10', 'Paused'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      processor.registerEnum(processed);

      expect(processor.getEnumValue('Status', 'Unknown')).toBe(0);
      expect(processor.getEnumValue('Status', 'Active')).toBe(10);
      expect(processor.getEnumValue('Status', 'Paused')).toBe(11);
    });

    it('should check if identifier is enum member', () => {
      const enumDecl = processor.parseEnumDeclaration('Public Enum Colors', 1);
      const memberLines = ['Red', 'Green', 'Blue'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      processor.registerEnum(processed);

      expect(processor.isEnumMember('Red')).toBe(true);
      expect(processor.isEnumMember('Green')).toBe(true);
      expect(processor.isEnumMember('Blue')).toBe(true);
      expect(processor.isEnumMember('Yellow')).toBe(false);
    });

    it('should get all module enums', () => {
      processor.setCurrentModule('Module1');

      const enum1 = processor.parseEnumDeclaration('Enum Colors', 1);
      processor.processEnum(enum1!, ['Red', 'Green']);
      processor.registerEnum(enum1!);

      const enum2 = processor.parseEnumDeclaration('Enum Status', 1);
      processor.processEnum(enum2!, ['Active', 'Inactive']);
      processor.registerEnum(enum2!);

      const moduleEnums = processor.getModuleEnums();

      // Note: This may include built-in enum members, so we filter
      const localEnums = moduleEnums.filter(e => e.module === 'Module1' && e.members.length > 1);
      expect(localEnums.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Enum Processor - Code Generation', () => {
    let processor: VB6EnumProcessor;

    beforeEach(() => {
      processor = new VB6EnumProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should generate JavaScript for simple enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Colors', 1);
      const memberLines = ['Red', 'Green = 5', 'Blue'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      const jsCode = processor.generateJavaScript(processed);

      expect(jsCode).toContain('const Colors');
      expect(jsCode).toContain('Red: 0');
      expect(jsCode).toContain('Green: 5');
      expect(jsCode).toContain('Blue: 6');
      expect(jsCode).toContain('_names');
      expect(jsCode).toContain('getName');
      expect(jsCode).toContain('hasValue');
    });

    it('should generate JavaScript with reverse mapping', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Status', 1);
      const memberLines = ['Active = 1', 'Paused = 2'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      const jsCode = processor.generateJavaScript(processed);

      expect(jsCode).toContain('_names');
      expect(jsCode).toContain('1: "Active"');
      expect(jsCode).toContain('2: "Paused"');
    });

    it('should generate JavaScript with helper methods', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Colors', 1);
      const memberLines = ['Red', 'Green', 'Blue'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      const jsCode = processor.generateJavaScript(processed);

      expect(jsCode).toContain('getName = function(value)');
      expect(jsCode).toContain('hasValue = function(value)');
      expect(jsCode).toContain('values = function()');
      expect(jsCode).toContain('names = function()');
    });

    it('should generate TypeScript enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Colors', 1);
      const memberLines = ['Red', 'Green = 5', 'Blue'];
      const processed = processor.processEnum(enumDecl!, memberLines);

      const tsCode = processor.generateTypeScript(processed);

      expect(tsCode).toContain('enum Colors');
      expect(tsCode).toContain('Red,');
      expect(tsCode).toContain('Green = 5,');
      expect(tsCode).toContain('Blue,');
    });

    it('should handle flag-style enum in JavaScript', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum FileAccess', 1);
      const memberLines = [
        'Read = 1',
        'Write = 2',
        'ReadWrite = 3'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);

      const jsCode = processor.generateJavaScript(processed);

      expect(jsCode).toContain('Read: 1');
      expect(jsCode).toContain('Write: 2');
      expect(jsCode).toContain('ReadWrite: 3');
    });
  });

  describe('VB6 Built-in Enums', () => {
    it('should have VbMsgBoxResult enum', () => {
      const msgBoxResult = VB6BuiltinEnums.VbMsgBoxResult;

      expect(msgBoxResult).toBeDefined();
      expect(msgBoxResult.name).toBe('VbMsgBoxResult');
      expect(msgBoxResult.public).toBe(true);

      const vbOK = msgBoxResult.members.find(m => m.name === 'vbOK');
      expect(vbOK?.value).toBe(1);

      const vbCancel = msgBoxResult.members.find(m => m.name === 'vbCancel');
      expect(vbCancel?.value).toBe(2);

      const vbYes = msgBoxResult.members.find(m => m.name === 'vbYes');
      expect(vbYes?.value).toBe(6);

      const vbNo = msgBoxResult.members.find(m => m.name === 'vbNo');
      expect(vbNo?.value).toBe(7);
    });

    it('should have VbMsgBoxStyle enum', () => {
      const msgBoxStyle = VB6BuiltinEnums.VbMsgBoxStyle;

      expect(msgBoxStyle).toBeDefined();
      expect(msgBoxStyle.name).toBe('VbMsgBoxStyle');

      const vbOKOnly = msgBoxStyle.members.find(m => m.name === 'vbOKOnly');
      expect(vbOKOnly?.value).toBe(0);

      const vbYesNo = msgBoxStyle.members.find(m => m.name === 'vbYesNo');
      expect(vbYesNo?.value).toBe(4);

      const vbCritical = msgBoxStyle.members.find(m => m.name === 'vbCritical');
      expect(vbCritical?.value).toBe(16);

      const vbInformation = msgBoxStyle.members.find(m => m.name === 'vbInformation');
      expect(vbInformation?.value).toBe(64);
    });

    it('should have VbVarType enum', () => {
      const varType = VB6BuiltinEnums.VbVarType;

      expect(varType).toBeDefined();
      expect(varType.name).toBe('VbVarType');

      const vbEmpty = varType.members.find(m => m.name === 'vbEmpty');
      expect(vbEmpty?.value).toBe(0);

      const vbString = varType.members.find(m => m.name === 'vbString');
      expect(vbString?.value).toBe(8);

      const vbArray = varType.members.find(m => m.name === 'vbArray');
      expect(vbArray?.value).toBe(8192);
    });
  });

  describe('Enum Edge Cases', () => {
    let processor: VB6EnumProcessor;

    beforeEach(() => {
      processor = new VB6EnumProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should handle empty enum gracefully', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Empty', 1);
      const processed = processor.processEnum(enumDecl!, []);

      expect(processed.members).toHaveLength(0);
    });

    it('should handle large enum values', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Large', 1);
      const memberLines = [
        'MaxInt = 2147483647',
        'Next'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);

      expect(processed.members[0].value).toBe(2147483647);
      expect(processed.members[1].value).toBe(2147483648);
    });

    it('should handle negative values', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Signed', 1);
      const code = processor.parseEnumMember('NegOne = -1');

      expect(code?.value).toBe(-1);
    });

    it('should handle hex values with uppercase', () => {
      const code = processor.parseEnumMember('HexUpper = &HFF');
      expect(code?.value).toBe(255);
    });

    it('should handle hex values with lowercase', () => {
      const code = processor.parseEnumMember('HexLower = &hff');
      expect(code?.value).toBe(255);
    });

    it('should handle whitespace variations', () => {
      const codes = [
        '   Value1',
        '\tValue2   ',
        '  Value3 = 5  '
      ];

      codes.forEach(code => {
        const result = processor.parseEnumMember(code);
        expect(result).not.toBeNull();
      });
    });

    it('should export and import enum data', () => {
      const enumDecl = processor.parseEnumDeclaration('Public Enum Colors', 1);
      const memberLines = ['Red', 'Green', 'Blue'];
      const processed = processor.processEnum(enumDecl!, memberLines);
      processor.registerEnum(processed);

      const exported = processor.export();
      expect(Object.keys(exported).length).toBeGreaterThan(0);

      const newProcessor = new VB6EnumProcessor();
      newProcessor.setCurrentModule('TestModule');
      newProcessor.import(exported);

      const retrieved = newProcessor.getEnum('Colors');
      expect(retrieved).toBeDefined();
      expect(retrieved?.members.length).toBeGreaterThan(0);
    });

    it('should clear all enums', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum Test', 1);
      processor.processEnum(enumDecl!, ['A', 'B']);
      processor.registerEnum(enumDecl!);

      expect(processor.getEnum('Test')).toBeDefined();

      processor.clear();

      expect(processor.getEnum('Test')).toBeUndefined();
    });
  });

  describe('Real-World VB6 Enum Scenarios', () => {
    let processor: VB6EnumProcessor;

    beforeEach(() => {
      processor = new VB6EnumProcessor();
      processor.setCurrentModule('App');
    });

    it('should handle HTTP status codes enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum HttpStatus', 1);
      const memberLines = [
        'OK = 200',
        'Created = 201',
        'BadRequest = 400',
        'Unauthorized = 401',
        'NotFound = 404',
        'ServerError = 500'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);

      expect(processed.members[0].value).toBe(200);
      expect(processed.members[2].value).toBe(400);
      expect(processed.members[5].value).toBe(500);
    });

    it('should handle file attributes enum with flags', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum FileAttributes', 1);
      const memberLines = [
        'Normal = 0',
        'ReadOnly = 1',
        'Hidden = 2',
        'System = 4',
        'Archive = &H20',
        'Temporary = &H100'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);

      expect(processed.members.find(m => m.name === 'Archive')?.value).toBe(32);
      expect(processed.members.find(m => m.name === 'Temporary')?.value).toBe(256);
    });

    it('should handle days of week enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum DayOfWeek', 1);
      const memberLines = [
        'Sunday = 1',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);

      expect(processed.members).toHaveLength(7);
      expect(processed.members[0].value).toBe(1);
      expect(processed.members[6].value).toBe(7);
    });

    it('should handle comparison operators enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum CompareMethod', 1);
      const memberLines = [
        'Binary = 0',
        'Text = 1',
        'DatabaseCompare = 2'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);
      processor.registerEnum(processed);

      const jsCode = processor.generateJavaScript(processed);
      expect(jsCode).toContain('Binary: 0');
      expect(jsCode).toContain('Text: 1');
    });

    it('should handle error codes enum', () => {
      const enumDecl = processor.parseEnumDeclaration('Enum ErrorCodes', 1);
      const memberLines = [
        'None = 0',
        'FileNotFound = 53',
        'DeviceUnavailable = 68',
        'DiskFull = 61',
        'EndOfFile = 62'
      ];
      const processed = processor.processEnum(enumDecl!, memberLines);

      expect(processed.members.find(m => m.name === 'FileNotFound')?.value).toBe(53);
      expect(processed.members.find(m => m.name === 'DiskFull')?.value).toBe(61);
    });
  });
});
