/**
 * VB6 User-Defined Types (UDT) Test Suite
 * Tests complete support for Type declarations and usage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UDTProcessor } from '../../compiler/VB6UDTSupport';
import {
  VB6UDTRegistry,
  DefineType,
  CreateUDT,
  CreateUDTArray,
  VB6FixedString,
  UDTRegistry
} from '../../runtime/VB6UserDefinedTypes';

describe('VB6 UDT Support', () => {

  describe('UDT Processor - Parsing', () => {
    let processor: VB6UDTProcessor;

    beforeEach(() => {
      processor = new VB6UDTProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should parse simple Type declaration', () => {
      const code = 'Type Employee';
      const result = processor.parseTypeDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Employee');
      expect(result?.public).toBe(false);
      expect(result?.module).toBe('TestModule');
    });

    it('should parse Public Type declaration', () => {
      const code = 'Public Type Customer';
      const result = processor.parseTypeDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Customer');
      expect(result?.public).toBe(true);
    });

    it('should parse Private Type declaration', () => {
      const code = 'Private Type InternalData';
      const result = processor.parseTypeDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('InternalData');
      expect(result?.public).toBe(false);
    });

    it('should parse simple field', () => {
      const code = '    ID As Long';
      const result = processor.parseTypeField(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('ID');
      expect(result?.type).toBe('Long');
    });

    it('should parse fixed-length string field', () => {
      const code = '    Name As String * 50';
      const result = processor.parseTypeField(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Name');
      expect(result?.type).toBe('String');
      expect(result?.fixedLength).toBe(50);
    });

    it('should parse array field with simple dimension', () => {
      const code = '    Numbers(10) As Integer';
      const result = processor.parseTypeField(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Numbers');
      expect(result?.type).toBe('Integer');
      expect(result?.arrayDimensions).toEqual([11]); // 0-based, so 0 to 10 = 11 elements
    });

    it('should parse array field with explicit range', () => {
      const code = '    Items(1 To 10) As Long';
      const result = processor.parseTypeField(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Items');
      expect(result?.type).toBe('Long');
      expect(result?.arrayDimensions).toEqual([10]); // 1 to 10 = 10 elements
    });

    it('should parse 2D array field', () => {
      const code = '    Matrix(0 To 2, 0 To 2) As Double';
      const result = processor.parseTypeField(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Matrix');
      expect(result?.type).toBe('Double');
      expect(result?.arrayDimensions).toEqual([3, 3]); // 0 to 2 = 3 elements each
    });

    it('should parse nested UDT field', () => {
      const code = '    Address As AddressType';
      const result = processor.parseTypeField(code);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Address');
      expect(result?.type).toBe('AddressType');
    });

    it('should process complete Type with multiple fields', () => {
      const typeDecl = processor.parseTypeDeclaration('Type Person', 1);
      expect(typeDecl).not.toBeNull();

      const fieldLines = [
        'ID As Long',
        'Name As String * 50',
        'Age As Integer',
        'Salary As Currency',
        'HireDate As Date',
        'IsActive As Boolean'
      ];

      const result = processor.processType(typeDecl!, fieldLines);

      expect(result.fields).toHaveLength(6);
      expect(result.fields[0].name).toBe('ID');
      expect(result.fields[1].name).toBe('Name');
      expect(result.fields[1].fixedLength).toBe(50);
      expect(result.fields[2].name).toBe('Age');
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('UDT Processor - Code Generation', () => {
    let processor: VB6UDTProcessor;

    beforeEach(() => {
      processor = new VB6UDTProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should generate JavaScript class for simple UDT', () => {
      const typeDecl = processor.parseTypeDeclaration('Type Point', 1);
      const fieldLines = ['X As Long', 'Y As Long'];
      const processed = processor.processType(typeDecl!, fieldLines);
      processor.registerType(processed);

      const jsCode = processor.generateJavaScript(processed);

      expect(jsCode).toContain('class Point');
      expect(jsCode).toContain('constructor()');
      expect(jsCode).toContain('this.X = 0');
      expect(jsCode).toContain('this.Y = 0');
      expect(jsCode).toContain('clone()');
      expect(jsCode).toContain('serialize()');
    });

    it('should generate TypeScript interface for UDT', () => {
      const typeDecl = processor.parseTypeDeclaration('Type Rectangle', 1);
      const fieldLines = [
        'Left As Long',
        'Top As Long',
        'Width As Long',
        'Height As Long'
      ];
      const processed = processor.processType(typeDecl!, fieldLines);

      const tsCode = processor.generateTypeScript(processed);

      expect(tsCode).toContain('interface Rectangle');
      expect(tsCode).toContain('Left: number');
      expect(tsCode).toContain('Top: number');
      expect(tsCode).toContain('Width: number');
      expect(tsCode).toContain('Height: number');
    });
  });

  describe('UDT Runtime - Registry', () => {
    beforeEach(() => {
      // Registry uses singleton, so we test with fresh types
    });

    it('should register and create simple UDT', () => {
      DefineType('TestPoint', [
        { name: 'X', type: 'Long' },
        { name: 'Y', type: 'Long' }
      ]);

      const point = CreateUDT('TestPoint');
      expect(point).toBeDefined();
      expect(point.X).toBe(0);
      expect(point.Y).toBe(0);
    });

    it('should initialize UDT with values', () => {
      DefineType('TestPerson', [
        { name: 'Name', type: 'String' },
        { name: 'Age', type: 'Integer' }
      ]);

      const person = CreateUDT('TestPerson', {
        Name: 'John Doe',
        Age: 30
      });

      expect(person.Name).toBe('John Doe');
      expect(person.Age).toBe(30);
    });

    it('should handle fixed-length strings', () => {
      DefineType('TestRecord', [
        { name: 'Code', type: 'String', isFixedString: true, size: 10 }
      ]);

      const record = CreateUDT('TestRecord');
      expect(record.Code).toBeInstanceOf(VB6FixedString);
      expect(record.Code.length).toBe(10);
    });

    it('should create UDT arrays', () => {
      DefineType('TestEmployee', [
        { name: 'ID', type: 'Long' },
        { name: 'Salary', type: 'Currency' }
      ]);

      const employees = CreateUDTArray('TestEmployee', 5);
      expect(employees).toHaveLength(5);
      expect(employees[0].ID).toBe(0);
      expect(employees[4].Salary).toBe(0);
    });

    it('should create multi-dimensional UDT arrays', () => {
      DefineType('TestCell', [
        { name: 'Value', type: 'Double' }
      ]);

      const grid = CreateUDTArray('TestCell', 3, 3);
      expect(grid).toHaveLength(3);
      expect(grid[0]).toHaveLength(3);
      expect(grid[2][2].Value).toBe(0);
    });

    it('should copy UDT instances', () => {
      DefineType('TestData', [
        { name: 'Value', type: 'Long' },
        { name: 'Name', type: 'String' }
      ]);

      const original = CreateUDT('TestData', {
        Value: 42,
        Name: 'Original'
      });

      const copy = UDTRegistry.copyInstance(original, 'TestData');

      expect(copy.Value).toBe(42);
      expect(copy.Name).toBe('Original');

      // Verify it's a deep copy
      copy.Value = 100;
      expect(original.Value).toBe(42);
    });

    it('should compare UDT instances', () => {
      DefineType('TestCompare', [
        { name: 'A', type: 'Long' },
        { name: 'B', type: 'String' }
      ]);

      const obj1 = CreateUDT('TestCompare', { A: 1, B: 'test' });
      const obj2 = CreateUDT('TestCompare', { A: 1, B: 'test' });
      const obj3 = CreateUDT('TestCompare', { A: 2, B: 'test' });

      expect(UDTRegistry.compareInstances(obj1, obj2, 'TestCompare')).toBe(true);
      expect(UDTRegistry.compareInstances(obj1, obj3, 'TestCompare')).toBe(false);
    });
  });

  describe('UDT Runtime - Nested Types', () => {
    it('should handle nested UDTs', () => {
      DefineType('TestAddress', [
        { name: 'Street', type: 'String', isFixedString: true, size: 100 },
        { name: 'City', type: 'String', isFixedString: true, size: 50 }
      ]);

      DefineType('TestCustomer', [
        { name: 'Name', type: 'String' },
        { name: 'HomeAddress', type: 'TestAddress', isUDT: true, udtTypeName: 'TestAddress' },
        { name: 'WorkAddress', type: 'TestAddress', isUDT: true, udtTypeName: 'TestAddress' }
      ]);

      const customer = CreateUDT('TestCustomer');

      expect(customer.HomeAddress).toBeDefined();
      expect(customer.WorkAddress).toBeDefined();
      expect(customer.HomeAddress.Street).toBeInstanceOf(VB6FixedString);
    });

    it('should copy nested UDTs correctly', () => {
      DefineType('TestLocation', [
        { name: 'Lat', type: 'Double' },
        { name: 'Lng', type: 'Double' }
      ]);

      DefineType('TestPlace', [
        { name: 'Name', type: 'String' },
        { name: 'Coordinates', type: 'TestLocation', isUDT: true, udtTypeName: 'TestLocation' }
      ]);

      const original = CreateUDT('TestPlace');
      original.Name = 'Paris';
      original.Coordinates.Lat = 48.8566;
      original.Coordinates.Lng = 2.3522;

      const copy = UDTRegistry.copyInstance(original, 'TestPlace');

      expect(copy.Coordinates.Lat).toBe(48.8566);

      copy.Coordinates.Lat = 0;
      expect(original.Coordinates.Lat).toBe(48.8566); // Verify deep copy
    });
  });

  describe('UDT Runtime - Arrays in UDTs', () => {
    it('should handle array fields in UDTs', () => {
      DefineType('TestMatrix', [
        { name: 'Name', type: 'String' },
        { name: 'Values', type: 'Double', isArray: true, dimensions: [3, 3] }
      ]);

      const matrix = CreateUDT('TestMatrix');

      expect(matrix.Values).toBeDefined();
      expect(matrix.Values).toHaveLength(3);
      expect(matrix.Values[0]).toHaveLength(3);
    });

    it('should initialize array fields correctly', () => {
      DefineType('TestVector', [
        { name: 'Components', type: 'Single', isArray: true, dimensions: [3] }
      ]);

      const vector = CreateUDT('TestVector');

      expect(vector.Components).toHaveLength(3);
      expect(vector.Components[0]).toBe(0);
      expect(vector.Components[1]).toBe(0);
      expect(vector.Components[2]).toBe(0);
    });
  });

  describe('VB6 Fixed-Length Strings', () => {
    it('should create fixed-length string', () => {
      const str = new VB6FixedString(10, 'Hello');
      expect(str.length).toBe(10);
      expect(str.value).toBe('Hello     '); // Padded to 10 chars
    });

    it('should truncate strings that are too long', () => {
      const str = new VB6FixedString(5, 'HelloWorld');
      expect(str.value).toBe('Hello');
      expect(str.length).toBe(5);
    });

    it('should pad strings that are too short', () => {
      const str = new VB6FixedString(10, 'Hi');
      expect(str.value).toBe('Hi        ');
      expect(str.length).toBe(10);
    });

    it('should provide trimmed value', () => {
      const str = new VB6FixedString(10, 'Test');
      expect(str.value).toBe('Test      ');
      expect(str.trimmed()).toBe('Test');
    });

    it('should update value correctly', () => {
      const str = new VB6FixedString(10, 'First');
      str.value = 'Second';
      expect(str.value).toBe('Second    ');
    });
  });

  describe('Windows API System Types', () => {
    it('should provide RECT type', () => {
      expect(UDTRegistry.hasType('RECT')).toBe(true);

      const rect = CreateUDT('RECT');
      expect(rect.Left).toBe(0);
      expect(rect.Top).toBe(0);
      expect(rect.Right).toBe(0);
      expect(rect.Bottom).toBe(0);
    });

    it('should provide POINT type', () => {
      expect(UDTRegistry.hasType('POINT')).toBe(true);

      const point = CreateUDT('POINT');
      expect(point.X).toBe(0);
      expect(point.Y).toBe(0);
    });

    it('should provide SIZE type', () => {
      expect(UDTRegistry.hasType('SIZE')).toBe(true);

      const size = CreateUDT('SIZE');
      expect(size.cx).toBe(0);
      expect(size.cy).toBe(0);
    });

    it('should provide SYSTEMTIME type', () => {
      expect(UDTRegistry.hasType('SYSTEMTIME')).toBe(true);

      const sysTime = CreateUDT('SYSTEMTIME');
      expect(sysTime.wYear).toBe(0);
      expect(sysTime.wMonth).toBe(0);
      expect(sysTime.wDay).toBe(0);
    });

    it('should provide FILETIME type', () => {
      expect(UDTRegistry.hasType('FILETIME')).toBe(true);

      const fileTime = CreateUDT('FILETIME');
      expect(fileTime.dwLowDateTime).toBe(0);
      expect(fileTime.dwHighDateTime).toBe(0);
    });
  });

  describe('Complex VB6 UDT Scenarios', () => {
    it('should handle complete Employee example', () => {
      const employee = CreateUDT('Employee', {
        ID: 1001,
        Salary: 75000.50
      });

      expect(employee.ID).toBe(1001);
      expect(employee.Salary).toBe(75000.50);
      expect(employee.IsActive).toBe(false); // Default
    });

    it('should handle complete Customer example', () => {
      const customer = CreateUDT('Customer');

      customer.CustomerID = 5001;
      customer.CompanyName = new VB6FixedString(100, 'Acme Corporation');
      customer.BillingAddress.Street = new VB6FixedString(100, '123 Main Street');
      customer.BillingAddress.City = new VB6FixedString(50, 'New York');
      customer.BillingAddress.State = new VB6FixedString(2, 'NY');
      customer.CreditLimit = 50000;

      expect(customer.CustomerID).toBe(5001);
      expect(customer.CompanyName.trimmed()).toBe('Acme Corporation');
      expect(customer.BillingAddress.City.trimmed()).toBe('New York');
      expect(customer.CreditLimit).toBe(50000);
    });

    it('should handle Matrix3x3 example', () => {
      const matrix = CreateUDT('Matrix3x3');

      // Set values
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          matrix.Values[i][j] = i * 3 + j + 1;
        }
      }

      expect(matrix.Values[0][0]).toBe(1);
      expect(matrix.Values[1][1]).toBe(5);
      expect(matrix.Values[2][2]).toBe(9);
    });

    it('should calculate UDT size correctly', () => {
      const pointSize = UDTRegistry.calculateSize('POINT');
      expect(pointSize).toBe(8); // 2 Longs = 2 * 4 bytes

      const rectSize = UDTRegistry.calculateSize('RECT');
      expect(rectSize).toBe(16); // 4 Longs = 4 * 4 bytes
    });
  });
});
