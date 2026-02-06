/**
 * VB6 Property Get/Let/Set Support - Comprehensive Test Suite
 *
 * Tests all aspects of VB6 property procedures
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VB6PropertyProcessor,
  VB6PropertyDeclaration,
  VB6PropertyGroup,
} from '../../compiler/VB6PropertySupport';

describe('VB6 Property Support', () => {
  describe('Property Processor - Parsing', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should parse simple Property Get', () => {
      const code = 'Property Get Value() As Variant';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Value');
      expect(result!.type).toBe('Get');
      expect(result!.returnType).toBe('Variant');
      expect(result!.parameters).toHaveLength(0);
      expect(result!.public).toBe(true);
      expect(result!.static).toBe(false);
    });

    it('should parse Property Let', () => {
      const code = 'Property Let Value(ByVal vNewValue As Variant)';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Value');
      expect(result!.type).toBe('Let');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('vNewValue');
      expect(result!.parameters[0].type).toBe('Variant');
      expect(result!.parameters[0].byRef).toBe(false); // ByVal
    });

    it('should parse Property Set', () => {
      const code = 'Property Set Font(ByVal vNewFont As Object)';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Font');
      expect(result!.type).toBe('Set');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].type).toBe('Object');
    });

    it('should parse Public Property', () => {
      const code = 'Public Property Get Name() As String';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.public).toBe(true);
    });

    it('should parse Private Property', () => {
      const code = 'Private Property Get Value() As Long';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.public).toBe(false);
    });

    it('should parse Friend Property', () => {
      const code = 'Friend Property Get Count() As Integer';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      // Friend is treated as public at module level
      expect(result!.public).toBe(false);
    });

    it('should parse Static Property', () => {
      const code = 'Public Static Property Get Instance() As Object';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.static).toBe(true);
    });

    it('should parse Property with typed return', () => {
      const code = 'Property Get Age() As Integer';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.returnType).toBe('Integer');
    });

    it('should parse Property Let with ByRef parameter', () => {
      const code = 'Property Let Data(ByRef vData As String)';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].byRef).toBe(true); // ByRef explicitly specified
    });

    it('should parse Property with optional parameter', () => {
      const code = 'Property Get Item(Optional ByVal Index As Long = 0) As Variant';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].optional).toBe(true);
      expect(result!.parameters[0].defaultValue).toBe(0);
    });

    it('should parse indexed Property Get', () => {
      const code = 'Property Get Item(ByVal Index As Long) As Variant';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Item');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('Index');
    });

    it('should parse indexed Property Let', () => {
      const code = 'Property Let Item(ByVal Index As Long, ByVal vNewItem As Variant)';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(2);
      expect(result!.parameters[0].name).toBe('Index');
      expect(result!.parameters[1].name).toBe('vNewItem');
    });
  });

  describe('Property Processor - Registration', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should register and retrieve Property Get', () => {
      const code = 'Property Get Value() As Long';
      const propDecl = processor.parsePropertyDeclaration(code, 1);

      expect(propDecl).not.toBeNull();
      processor.registerProperty(propDecl!);

      const retrieved = processor.getProperty('Value');
      expect(retrieved).toBeDefined();
      expect(retrieved!.getter).toBeDefined();
      expect(retrieved!.getter!.name).toBe('Value');
    });

    it('should register Property Get and Let together', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Long', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Long)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const retrieved = processor.getProperty('Value');
      expect(retrieved).toBeDefined();
      expect(retrieved!.getter).toBeDefined();
      expect(retrieved!.letter).toBeDefined();
      expect(retrieved!.readOnly).toBe(false);
      expect(retrieved!.writeOnly).toBe(false);
    });

    it('should identify read-only property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Count() As Long', 1);
      processor.registerProperty(getter!);

      const retrieved = processor.getProperty('Count');
      expect(retrieved).toBeDefined();
      expect(retrieved!.readOnly).toBe(true);
      expect(retrieved!.writeOnly).toBe(false);
    });

    it('should identify write-only property', () => {
      const letter = processor.parsePropertyDeclaration(
        'Property Let Password(ByVal vNewPassword As String)',
        1
      );
      processor.registerProperty(letter!);

      const retrieved = processor.getProperty('Password');
      expect(retrieved).toBeDefined();
      expect(retrieved!.readOnly).toBe(false);
      expect(retrieved!.writeOnly).toBe(true);
    });

    it('should register Property Set for objects', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Font() As Object', 1);
      const setter = processor.parsePropertyDeclaration(
        'Property Set Font(ByVal vNewFont As Object)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(setter!);

      const retrieved = processor.getProperty('Font');
      expect(retrieved).toBeDefined();
      expect(retrieved!.getter).toBeDefined();
      expect(retrieved!.setter).toBeDefined();
      expect(retrieved!.letter).toBeUndefined();
    });

    it('should get module properties', () => {
      processor.registerProperty(
        processor.parsePropertyDeclaration('Property Get Value1() As Long', 1)!
      );
      processor.registerProperty(
        processor.parsePropertyDeclaration('Property Get Value2() As Long', 2)!
      );

      const moduleProps = processor.getModuleProperties();
      expect(moduleProps).toHaveLength(2);
    });
  });

  describe('Property Processor - Code Generation', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should generate JavaScript for simple property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Long', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Long)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Value');
      const jsCode = processor.generateJavaScript(propertyGroup!);

      expect(jsCode).toContain('get Value()');
      expect(jsCode).toContain('set Value(value)');
      expect(jsCode).toContain('_value');
    });

    it('should generate JavaScript for read-only property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Count() As Long', 1);
      processor.registerProperty(getter!);

      const propertyGroup = processor.getProperty('Count');
      const jsCode = processor.generateJavaScript(propertyGroup!);

      expect(jsCode).toContain('get Count()');
      expect(jsCode).not.toContain('set Count');
    });

    it('should generate JavaScript for object property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Font() As Object', 1);
      const setter = processor.parsePropertyDeclaration(
        'Property Set Font(ByVal vNewFont As Object)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(setter!);

      const propertyGroup = processor.getProperty('Font');
      const jsCode = processor.generateJavaScript(propertyGroup!);

      expect(jsCode).toContain('set Font(value)');
      expect(jsCode).toContain("typeof value !== 'object'");
      expect(jsCode).toContain('Property Set can only be used with object values');
    });

    it('should generate TypeScript interface', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Long', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Long)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Value');
      const tsCode = processor.generateTypeScript(propertyGroup!);

      expect(tsCode).toContain('Value');
      expect(tsCode).toContain('number');
    });

    it('should generate readonly TypeScript property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Count() As Long', 1);
      processor.registerProperty(getter!);

      const propertyGroup = processor.getProperty('Count');
      const tsCode = processor.generateTypeScript(propertyGroup!);

      expect(tsCode).toContain('readonly');
      expect(tsCode).toContain('Count');
    });

    it('should generate write-only TypeScript property', () => {
      const letter = processor.parsePropertyDeclaration(
        'Property Let Password(ByVal vNewPassword As String)',
        1
      );
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Password');
      const tsCode = processor.generateTypeScript(propertyGroup!);

      expect(tsCode).toContain('Password');
      expect(tsCode).toContain('string');
      expect(tsCode).toContain('Write-only');
    });

    it('should map VB6 types to TypeScript correctly', () => {
      const types = [
        { vb6: 'Long', ts: 'number' },
        { vb6: 'String', ts: 'string' },
        { vb6: 'Boolean', ts: 'boolean' },
        { vb6: 'Date', ts: 'Date' },
        { vb6: 'Variant', ts: 'any' },
        { vb6: 'Object', ts: 'object' },
      ];

      for (const type of types) {
        const getter = processor.parsePropertyDeclaration(`Property Get Value() As ${type.vb6}`, 1);
        processor.registerProperty(getter!);

        const propertyGroup = processor.getProperty('Value');
        const tsCode = processor.generateTypeScript(propertyGroup!);

        expect(tsCode).toContain(type.ts);
        processor.clear();
      }
    });
  });

  describe('Property Processor - Validation', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should validate type consistency between Get and Let', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Long', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Long)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Value');
      const errors = processor.validatePropertyConsistency(propertyGroup!);

      expect(errors).toHaveLength(0);
    });

    it('should detect type mismatch between Get and Let', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Long', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As String)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Value');
      const errors = processor.validatePropertyConsistency(propertyGroup!);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Get returns');
      expect(errors[0]).toContain('expects');
    });

    it('should allow Variant type compatibility', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Variant', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Long)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Value');
      const errors = processor.validatePropertyConsistency(propertyGroup!);

      expect(errors).toHaveLength(0);
    });

    it('should validate Set is used with object types', () => {
      const setter = processor.parsePropertyDeclaration(
        'Property Set Value(ByVal vNewValue As Long)',
        1
      );
      processor.registerProperty(setter!);

      const propertyGroup = processor.getProperty('Value');
      const errors = processor.validatePropertyConsistency(propertyGroup!);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Property Set should be used with Object types');
    });

    it('should warn if Let is used with Object types', () => {
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Object)',
        1
      );
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Value');
      const errors = processor.validatePropertyConsistency(propertyGroup!);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Property Let should not be used with Object types');
    });
  });

  describe('Property Processor - Export/Import', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should export and import property data', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Value() As Long', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Value(ByVal vNewValue As Long)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const exported = processor.export();
      expect(Object.keys(exported).length).toBeGreaterThan(0);

      const newProcessor = new VB6PropertyProcessor();
      newProcessor.setCurrentModule('TestModule');
      newProcessor.import(exported);

      const retrieved = newProcessor.getProperty('Value');
      expect(retrieved).toBeDefined();
      expect(retrieved!.getter).toBeDefined();
      expect(retrieved!.letter).toBeDefined();
    });

    it('should clear all properties', () => {
      processor.registerProperty(
        processor.parsePropertyDeclaration('Property Get Value() As Long', 1)!
      );
      expect(processor.getProperty('Value')).toBeDefined();

      processor.clear();
      expect(processor.getProperty('Value')).toBeUndefined();
    });
  });

  describe('Real-World VB6 Property Scenarios', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('MainModule');
    });

    it('should handle simple value property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Name() As String', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Name(ByVal vNewName As String)',
        2
      );

      expect(getter).not.toBeNull();
      expect(letter).not.toBeNull();

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Name');
      expect(propertyGroup!.readOnly).toBe(false);
      expect(propertyGroup!.writeOnly).toBe(false);
    });

    it('should handle validated property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Age() As Integer', 1);
      const letter = processor.parsePropertyDeclaration(
        'Property Let Age(ByVal vNewAge As Integer)',
        2
      );

      getter!.body = ['Age = m_age'];
      letter!.body = [
        'If vNewAge < 0 Or vNewAge > 150 Then',
        '    Err.Raise 5, , "Invalid age value"',
        'End If',
        'm_age = vNewAge',
      ];

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Age');
      const jsCode = processor.generateJavaScript(propertyGroup!);

      expect(jsCode).toContain('get Age()');
      expect(jsCode).toContain('set Age(value)');
    });

    it('should handle indexed property', () => {
      const getter = processor.parsePropertyDeclaration(
        'Property Get Item(ByVal Index As Long) As Variant',
        1
      );
      const letter = processor.parsePropertyDeclaration(
        'Property Let Item(ByVal Index As Long, ByVal vNewItem As Variant)',
        2
      );

      expect(getter!.parameters).toHaveLength(1);
      expect(letter!.parameters).toHaveLength(2);

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Item');
      expect(propertyGroup).toBeDefined();
    });

    it('should handle default property (Item)', () => {
      const getter = processor.parsePropertyDeclaration(
        'Property Get Item(ByVal Index As Variant) As Variant',
        1
      );
      const letter = processor.parsePropertyDeclaration(
        'Property Let Item(ByVal Index As Variant, ByVal vNewItem As Variant)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(letter!);

      const propertyGroup = processor.getProperty('Item');
      expect(propertyGroup).toBeDefined();
      expect(propertyGroup!.getter!.parameters).toHaveLength(1);
      expect(propertyGroup!.letter!.parameters).toHaveLength(2);
    });

    it('should handle object property with Font example', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Font() As Object', 1);
      const setter = processor.parsePropertyDeclaration(
        'Property Set Font(ByVal vNewFont As Object)',
        2
      );

      processor.registerProperty(getter!);
      processor.registerProperty(setter!);

      const propertyGroup = processor.getProperty('Font');
      const jsCode = processor.generateJavaScript(propertyGroup!);

      expect(jsCode).toContain("typeof value !== 'object'");
    });

    it('should handle read-only Count property', () => {
      const getter = processor.parsePropertyDeclaration('Property Get Count() As Long', 1);
      getter!.body = ['Count = m_items.Count'];

      processor.registerProperty(getter!);

      const propertyGroup = processor.getProperty('Count');
      expect(propertyGroup!.readOnly).toBe(true);

      const tsCode = processor.generateTypeScript(propertyGroup!);
      expect(tsCode).toContain('readonly');
    });
  });

  describe('Edge Cases', () => {
    let processor: VB6PropertyProcessor;

    beforeEach(() => {
      processor = new VB6PropertyProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should handle property with no return type', () => {
      const code = 'Property Get Value()';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.returnType).toBeUndefined();
    });

    it('should handle property with multiple parameters', () => {
      const code = 'Property Get Cell(ByVal Row As Long, ByVal Col As Long) As String';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(2);
      expect(result!.parameters[0].name).toBe('Row');
      expect(result!.parameters[1].name).toBe('Col');
    });

    it('should handle case-insensitive keywords', () => {
      const code = 'PROPERTY GET Value() AS LONG';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Value');
    });

    it('should handle whitespace variations', () => {
      const code = 'Property  Get   Value  (  )  As  Long';
      const result = processor.parsePropertyDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Value');
    });

    it('should handle module context switching', () => {
      processor.setCurrentModule('Module1');
      processor.registerProperty(
        processor.parsePropertyDeclaration('Private Property Get Value1() As Long', 1)!
      );

      processor.setCurrentModule('Module2');
      processor.registerProperty(
        processor.parsePropertyDeclaration('Private Property Get Value2() As Long', 1)!
      );

      processor.setCurrentModule('Module1');
      const moduleProps = processor.getModuleProperties();
      expect(moduleProps.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate property accessors for class', () => {
      processor.registerProperty(
        processor.parsePropertyDeclaration('Property Get Value() As Long', 1)!
      );
      processor.registerProperty(
        processor.parsePropertyDeclaration('Property Let Value(ByVal vNewValue As Long)', 2)!
      );

      const jsCode = processor.generatePropertyAccessors('MyClass');
      expect(jsCode).toContain('MyClass');
      expect(jsCode).toContain('get Value()');
      expect(jsCode).toContain('set Value(value)');
    });
  });
});
