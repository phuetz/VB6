import { describe, it, expect, beforeEach } from 'vitest';
import { 
  VB6PropertySystem, 
  VB6PropertyType, 
  VB6PropertyDescriptor 
} from '../services/VB6PropertySystem';

describe('VB6PropertySystem', () => {
  let propertySystem: VB6PropertySystem;
  let testInstanceId: string;

  beforeEach(() => {
    propertySystem = new VB6PropertySystem();
    testInstanceId = propertySystem.createInstance('TestClass');
  });

  describe('Property Registration', () => {
    it('should register Property Get procedures', () => {
      const getProperty: VB6PropertyDescriptor = {
        name: 'Name',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'String'
      };

      propertySystem.registerProperty('TestClass', getProperty);
      
      expect(propertySystem.hasProperty('TestClass', 'Name', VB6PropertyType.Get)).toBe(true);
    });

    it('should register Property Let procedures', () => {
      const letProperty: VB6PropertyDescriptor = {
        name: 'Age',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [
          { name: 'value', type: 'Integer' }
        ]
      };

      propertySystem.registerProperty('TestClass', letProperty);
      
      expect(propertySystem.hasProperty('TestClass', 'Age', VB6PropertyType.Let)).toBe(true);
    });

    it('should register Property Set procedures', () => {
      const setProperty: VB6PropertyDescriptor = {
        name: 'Owner',
        className: 'TestClass',
        propertyType: VB6PropertyType.Set,
        parameters: [
          { name: 'objectRef', type: 'Object' }
        ]
      };

      propertySystem.registerProperty('TestClass', setProperty);
      
      expect(propertySystem.hasProperty('TestClass', 'Owner', VB6PropertyType.Set)).toBe(true);
    });
  });

  describe('Property Get/Let/Set Operations', () => {
    beforeEach(() => {
      // Register test properties
      propertySystem.registerProperty('TestClass', {
        name: 'Name',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'String'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'Name',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'String' }]
      });

      propertySystem.registerProperty('TestClass', {
        name: 'Owner',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'Object'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'Owner',
        className: 'TestClass',
        propertyType: VB6PropertyType.Set,
        parameters: [{ name: 'objectRef', type: 'Object' }]
      });
    });

    it('should get and set string properties', () => {
      propertySystem.letProperty(testInstanceId, 'Name', 'John Doe');
      const value = propertySystem.getProperty(testInstanceId, 'Name');
      
      expect(value).toBe('John Doe');
    });

    it('should handle object property assignments', () => {
      const testObject = { id: 1, name: 'Test Object' };
      
      propertySystem.setProperty(testInstanceId, 'Owner', testObject);
      const value = propertySystem.getProperty(testInstanceId, 'Owner');
      
      expect(value).toEqual(testObject);
    });

    it('should return default values for uninitialized properties', () => {
      const value = propertySystem.getProperty(testInstanceId, 'Name');
      expect(value).toBe(''); // Default string value
    });

    it('should throw error for non-existent properties', () => {
      expect(() => {
        propertySystem.getProperty(testInstanceId, 'NonExistent');
      }).toThrow("Property 'NonExistent' not found");
    });
  });

  describe('Parameterized Properties', () => {
    beforeEach(() => {
      // Register parameterized property (like Item property)
      propertySystem.registerProperty('TestClass', {
        name: 'Item',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [{ name: 'index', type: 'Integer' }],
        returnType: 'String'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'Item',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [
          { name: 'index', type: 'Integer' },
          { name: 'value', type: 'String' }
        ]
      });
    });

    it('should handle parameterized property assignment', () => {
      propertySystem.letProperty(testInstanceId, 'Item', 'First Item', 0);
      propertySystem.letProperty(testInstanceId, 'Item', 'Second Item', 1);
      
      const item0 = propertySystem.getProperty(testInstanceId, 'Item', 0);
      const item1 = propertySystem.getProperty(testInstanceId, 'Item', 1);
      
      expect(item0).toBe('First Item');
      expect(item1).toBe('Second Item');
    });
  });

  describe('Custom Property Accessors', () => {
    it('should support custom getter functions', () => {
      propertySystem.registerProperty('TestClass', {
        name: 'ComputedValue',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'Integer'
      });

      // Register custom accessor
      propertySystem.registerPropertyAccessor(
        testInstanceId, 
        'ComputedValue', 
        VB6PropertyType.Get, 
        () => 42 * 2
      );

      const value = propertySystem.getProperty(testInstanceId, 'ComputedValue');
      expect(value).toBe(84);
    });

    it('should support custom setter functions', () => {
      let storedValue = '';
      
      propertySystem.registerProperty('TestClass', {
        name: 'CustomProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'String' }]
      });

      // Register custom accessor
      propertySystem.registerPropertyAccessor(
        testInstanceId, 
        'CustomProp', 
        VB6PropertyType.Let, 
        (value: string) => {
          storedValue = value.toUpperCase();
        }
      );

      propertySystem.letProperty(testInstanceId, 'CustomProp', 'hello world');
      expect(storedValue).toBe('HELLO WORLD');
    });
  });

  describe('Property Validation', () => {
    beforeEach(() => {
      propertySystem.registerProperty('TestClass', {
        name: 'ReadOnlyProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'String',
        isReadOnly: true
      });
    });

    it('should validate property assignments', () => {
      const isValid = propertySystem.validatePropertyAssignment(
        'TestClass', 
        'ReadOnlyProp', 
        'test value'
      );
      
      expect(isValid).toBe(false); // Should be false for read-only property
    });
  });

  describe('Instance Management', () => {
    it('should create instances with unique IDs', () => {
      const instance1 = propertySystem.createInstance('TestClass');
      const instance2 = propertySystem.createInstance('TestClass');
      
      expect(instance1).not.toBe(instance2);
    });

    it('should create instances with custom IDs', () => {
      const customId = 'MyCustomInstance';
      const instanceId = propertySystem.createInstance('TestClass', customId);
      
      expect(instanceId).toBe(customId);
    });

    it('should destroy instances and cleanup', () => {
      propertySystem.registerProperty('TestClass', {
        name: 'TestProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'String' }]
      });

      propertySystem.letProperty(testInstanceId, 'TestProp', 'test');
      
      // Instance should exist and have data
      const stats = propertySystem.getInstanceStats(testInstanceId);
      expect(stats).toBeTruthy();
      expect(stats.propertyCount).toBeGreaterThan(0);
      
      // Destroy instance
      propertySystem.destroyInstance(testInstanceId);
      
      // Instance should no longer exist
      const statsAfterDestroy = propertySystem.getInstanceStats(testInstanceId);
      expect(statsAfterDestroy).toBeNull();
    });
  });

  describe('Property Information', () => {
    beforeEach(() => {
      propertySystem.registerProperty('TestClass', {
        name: 'ComplexProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'String',
        documentation: 'A complex property for testing'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'ComplexProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'String' }],
        documentation: 'Sets the complex property value'
      });
    });

    it('should retrieve property information', () => {
      const propertyInfo = propertySystem.getPropertyInfo('TestClass', 'ComplexProp');
      
      expect(propertyInfo).toHaveLength(2); // Get and Let
      expect(propertyInfo.some(p => p.propertyType === VB6PropertyType.Get)).toBe(true);
      expect(propertyInfo.some(p => p.propertyType === VB6PropertyType.Let)).toBe(true);
    });

    it('should retrieve all class properties', () => {
      const allProperties = propertySystem.getClassProperties('TestClass');
      
      expect(allProperties.length).toBeGreaterThan(0);
      expect(allProperties.some(p => p.name === 'ComplexProp')).toBe(true);
    });
  });

  describe('Type System Integration', () => {
    it('should handle VB6 data types correctly', () => {
      // Test Integer property
      propertySystem.registerProperty('TestClass', {
        name: 'IntProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'Integer'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'IntProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'Integer' }]
      });

      propertySystem.letProperty(testInstanceId, 'IntProp', 42);
      const intValue = propertySystem.getProperty(testInstanceId, 'IntProp');
      expect(intValue).toBe(42);

      // Test Boolean property
      propertySystem.registerProperty('TestClass', {
        name: 'BoolProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'Boolean'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'BoolProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'Boolean' }]
      });

      propertySystem.letProperty(testInstanceId, 'BoolProp', true);
      const boolValue = propertySystem.getProperty(testInstanceId, 'BoolProp');
      expect(boolValue).toBe(true);

      // Test Date property
      propertySystem.registerProperty('TestClass', {
        name: 'DateProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Get,
        parameters: [],
        returnType: 'Date'
      });

      propertySystem.registerProperty('TestClass', {
        name: 'DateProp',
        className: 'TestClass',
        propertyType: VB6PropertyType.Let,
        parameters: [{ name: 'value', type: 'Date' }]
      });

      const testDate = new Date('2023-12-25');
      propertySystem.letProperty(testInstanceId, 'DateProp', testDate);
      const dateValue = propertySystem.getProperty(testInstanceId, 'DateProp');
      expect(dateValue).toEqual(testDate);
    });
  });
});