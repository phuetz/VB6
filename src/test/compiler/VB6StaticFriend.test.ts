import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VB6AdvancedLanguageProcessor,
  advancedLanguageProcessor,
  VB6StaticVariable,
} from '../../compiler/VB6AdvancedLanguageFeatures';
import { VB6VariableManager } from '../../runtime/managers/VB6VariableManager';
import { VB6DataType } from '../../runtime/types/VB6Types';

describe('VB6 Static Variables - Advanced Language Processor', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
    processor.setCurrentContext('TestModule', 'TestProc');
  });

  afterEach(() => {
    processor.clear();
  });

  describe('Static Variable Declaration', () => {
    it('should declare a static variable', () => {
      const value = processor.declareStaticVariable('counter', 'Integer', 0);

      expect(value).toBe(0);
    });

    it('should initialize with default value', () => {
      const value = processor.declareStaticVariable('count', 'Integer');

      expect(value).toBe(0); // Default value for Integer
    });

    it('should initialize with custom value', () => {
      const value = processor.declareStaticVariable('total', 'Long', 100);

      expect(value).toBe(100);
    });

    it('should support different data types', () => {
      const intValue = processor.declareStaticVariable('num', 'Integer', 42);
      const strValue = processor.declareStaticVariable('text', 'String', 'Hello');
      const boolValue = processor.declareStaticVariable('flag', 'Boolean', true);

      expect(intValue).toBe(42);
      expect(strValue).toBe('Hello');
      expect(boolValue).toBe(true);
    });

    it('should use default values for unspecified types', () => {
      processor.setCurrentContext('Module1', 'Proc1');

      const intValue = processor.declareStaticVariable('i', 'Integer');
      const dblValue = processor.declareStaticVariable('d', 'Double');
      const strValue = processor.declareStaticVariable('s', 'String');
      const boolValue = processor.declareStaticVariable('b', 'Boolean');

      expect(intValue).toBe(0);
      expect(dblValue).toBe(0.0);
      expect(strValue).toBe('');
      expect(boolValue).toBe(false);
    });
  });

  describe('Static Variable Persistence', () => {
    it('should retain value between calls', () => {
      processor.setCurrentContext('Module1', 'Counter');

      // First call
      processor.declareStaticVariable('count', 'Integer', 0);
      processor.setStaticVariable('count', 1);

      expect(processor.getStaticVariable('count')).toBe(1);

      // Simulate procedure exit and re-entry (same context)
      processor.setCurrentContext('Module1', 'Counter');

      // Second call - should return existing value, not reinitialize
      const value = processor.declareStaticVariable('count', 'Integer', 0);
      expect(value).toBe(1); // Should still be 1, not 0
    });

    it('should maintain independent values for different procedures', () => {
      // Procedure 1
      processor.setCurrentContext('Module1', 'Proc1');
      processor.declareStaticVariable('x', 'Integer', 10);
      processor.setStaticVariable('x', 20);

      // Procedure 2
      processor.setCurrentContext('Module1', 'Proc2');
      processor.declareStaticVariable('x', 'Integer', 5);
      processor.setStaticVariable('x', 15);

      // Check values are independent
      processor.setCurrentContext('Module1', 'Proc1');
      expect(processor.getStaticVariable('x')).toBe(20);

      processor.setCurrentContext('Module1', 'Proc2');
      expect(processor.getStaticVariable('x')).toBe(15);
    });

    it('should maintain independent values for different modules', () => {
      // Module1.Proc1
      processor.setCurrentContext('Module1', 'Proc1');
      processor.declareStaticVariable('value', 'Integer', 100);
      processor.setStaticVariable('value', 200);

      // Module2.Proc1 (same procedure name, different module)
      processor.setCurrentContext('Module2', 'Proc1');
      processor.declareStaticVariable('value', 'Integer', 50);
      processor.setStaticVariable('value', 150);

      // Check values are independent
      processor.setCurrentContext('Module1', 'Proc1');
      expect(processor.getStaticVariable('value')).toBe(200);

      processor.setCurrentContext('Module2', 'Proc1');
      expect(processor.getStaticVariable('value')).toBe(150);
    });

    it('should support multiple static variables in same procedure', () => {
      processor.setCurrentContext('Module1', 'TestProc');

      processor.declareStaticVariable('var1', 'Integer', 1);
      processor.declareStaticVariable('var2', 'String', 'test');
      processor.declareStaticVariable('var3', 'Boolean', true);

      expect(processor.getStaticVariable('var1')).toBe(1);
      expect(processor.getStaticVariable('var2')).toBe('test');
      expect(processor.getStaticVariable('var3')).toBe(true);

      // Update values
      processor.setStaticVariable('var1', 10);
      processor.setStaticVariable('var2', 'updated');
      processor.setStaticVariable('var3', false);

      expect(processor.getStaticVariable('var1')).toBe(10);
      expect(processor.getStaticVariable('var2')).toBe('updated');
      expect(processor.getStaticVariable('var3')).toBe(false);
    });
  });

  describe('Static Variable Get/Set', () => {
    beforeEach(() => {
      processor.setCurrentContext('Module1', 'TestProc');
      processor.declareStaticVariable('counter', 'Integer', 0);
    });

    it('should get static variable value', () => {
      processor.setStaticVariable('counter', 42);

      expect(processor.getStaticVariable('counter')).toBe(42);
    });

    it('should set static variable value', () => {
      processor.setStaticVariable('counter', 100);

      expect(processor.getStaticVariable('counter')).toBe(100);
    });

    it('should throw if getting non-existent variable', () => {
      expect(() => processor.getStaticVariable('nonexistent')).toThrow(/not found/i);
    });

    it('should throw if setting non-existent variable', () => {
      expect(() => processor.setStaticVariable('nonexistent', 10)).toThrow(/not found/i);
    });

    it('should allow multiple updates', () => {
      processor.setStaticVariable('counter', 1);
      expect(processor.getStaticVariable('counter')).toBe(1);

      processor.setStaticVariable('counter', 2);
      expect(processor.getStaticVariable('counter')).toBe(2);

      processor.setStaticVariable('counter', 3);
      expect(processor.getStaticVariable('counter')).toBe(3);
    });
  });

  describe('Static Variable Code Generation', () => {
    it('should generate JavaScript for static variable', () => {
      processor.setCurrentContext('Module1', 'GetNextID');

      const js = processor.generateStaticVariableJS('currentID', 'Long', 0);

      expect(js).toContain('window.__vb6_static');
      expect(js).toContain('Module1_GetNextID_currentID');
      expect(js).toContain('currentID');
    });

    it('should generate correct storage key', () => {
      processor.setCurrentContext('MyModule', 'MyProcedure');

      const js = processor.generateStaticVariableJS('myVar', 'Integer', 10);

      expect(js).toContain('MyModule_MyProcedure_myVar');
    });

    it('should handle different initial values', () => {
      processor.setCurrentContext('Module1', 'Proc1');

      const jsInt = processor.generateStaticVariableJS('x', 'Integer', 42);
      const jsStr = processor.generateStaticVariableJS('name', 'String', 'test');
      const jsBool = processor.generateStaticVariableJS('flag', 'Boolean', true);

      expect(jsInt).toContain('42');
      expect(jsStr).toContain('"test"');
      expect(jsBool).toContain('true');
    });

    it('should generate getter/setter properties', () => {
      const js = processor.generateStaticVariableJS('counter', 'Integer', 0);

      expect(js).toContain('Object.defineProperty');
      expect(js).toContain('get: function()');
      expect(js).toContain('set: function(value)');
    });

    it('should preserve scope between calls', () => {
      processor.setCurrentContext('Module1', 'Counter');
      const js = processor.generateStaticVariableJS('count', 'Integer', 0);

      // Generated code should check if variable exists
      expect(js).toContain('if (!window.__vb6_static)');
      expect(js).toContain("if (!window.__vb6_static['Module1_Counter_count'])");
    });
  });
});

describe('VB6 Friend Scope - Advanced Language Processor', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
  });

  afterEach(() => {
    processor.clear();
  });

  describe('Friend Access Control', () => {
    it('should allow access within same project', () => {
      const isAccessible = processor.isFriendAccessible(
        'MyProject.Module1',
        'MyProject.Module2',
        'FriendMethod'
      );

      expect(isAccessible).toBe(true);
    });

    it('should deny access from different project', () => {
      const isAccessible = processor.isFriendAccessible(
        'ProjectA.Module1',
        'ProjectB.Module1',
        'FriendMethod'
      );

      expect(isAccessible).toBe(false);
    });

    it('should allow access within same module', () => {
      const isAccessible = processor.isFriendAccessible(
        'App.UserModule',
        'App.UserModule',
        'HelperFunction'
      );

      expect(isAccessible).toBe(true);
    });

    it('should allow access between modules in same project', () => {
      const isAccessible = processor.isFriendAccessible(
        'MyApp.DataModule',
        'MyApp.UIModule',
        'GetData'
      );

      expect(isAccessible).toBe(true);
    });

    it('should handle simple module names', () => {
      const isAccessible = processor.isFriendAccessible('Module1', 'Module2', 'TestMethod');

      // Different "projects" - simple names without prefix are treated as separate projects
      expect(isAccessible).toBe(false);

      // Same module should be accessible
      const sameModule = processor.isFriendAccessible('Module1', 'Module1', 'TestMethod');
      expect(sameModule).toBe(true);
    });

    it('should handle different project prefixes', () => {
      const isAccessible1 = processor.isFriendAccessible(
        'LibraryA.Utilities',
        'LibraryB.Helpers',
        'UtilityMethod'
      );

      const isAccessible2 = processor.isFriendAccessible(
        'SameLib.Module1',
        'SameLib.Module2',
        'SharedMethod'
      );

      expect(isAccessible1).toBe(false); // Different projects
      expect(isAccessible2).toBe(true); // Same project
    });
  });

  describe('Friend Scope Real-World Scenarios', () => {
    it('should enforce friend access in class library', () => {
      // Internal helper method should be accessible within library
      const internal = processor.isFriendAccessible(
        'MyLibrary.InternalHelpers',
        'MyLibrary.PublicAPI',
        'InternalMethod'
      );

      // But not from external application
      const external = processor.isFriendAccessible(
        'MyLibrary.InternalHelpers',
        'ClientApp.Main',
        'InternalMethod'
      );

      expect(internal).toBe(true);
      expect(external).toBe(false);
    });

    it('should allow friend access in multi-tier application', () => {
      // Business logic layer accessing data layer (same app)
      const dataAccess = processor.isFriendAccessible(
        'MyApp.DataLayer',
        'MyApp.BusinessLayer',
        'ExecuteQuery'
      );

      // UI layer accessing business layer (same app)
      const businessAccess = processor.isFriendAccessible(
        'MyApp.BusinessLayer',
        'MyApp.UILayer',
        'ProcessOrder'
      );

      expect(dataAccess).toBe(true);
      expect(businessAccess).toBe(true);
    });

    it('should protect internal implementation details', () => {
      // Friend methods should be accessible within project
      const friendAccess = processor.isFriendAccessible(
        'MyProject.Implementation',
        'MyProject.Facade',
        'InternalDetail'
      );

      // But not from external code
      const externalAccess = processor.isFriendAccessible(
        'MyProject.Implementation',
        'ThirdParty.Plugin',
        'InternalDetail'
      );

      expect(friendAccess).toBe(true);
      expect(externalAccess).toBe(false);
    });
  });
});

describe('VB6 Static Variables - Variable Manager', () => {
  let manager: VB6VariableManager;

  beforeEach(() => {
    manager = new VB6VariableManager();
  });

  describe('Static Variable Declaration in Manager', () => {
    it('should declare static variable', () => {
      const variable = manager.declareVariable(
        'counter',
        VB6DataType.vbInteger,
        'procedure',
        'Module1',
        'Proc1',
        true // isStatic
      );

      expect(variable.isStatic).toBe(true);
      expect(variable.name).toBe('counter');
      expect(variable.type).toBe(VB6DataType.vbInteger);
    });

    it('should store static variables separately', () => {
      // Declare static variable
      manager.declareVariable(
        'staticVar',
        VB6DataType.vbLong,
        'procedure',
        'Module1',
        'Proc1',
        true
      );

      // Declare normal procedure variable with same name
      manager.declareVariable(
        'staticVar',
        VB6DataType.vbLong,
        'procedure',
        'Module1',
        'Proc2',
        false
      );

      // Both should exist independently
      const static1 = manager.getVariable('staticVar', 'Module1', 'Proc1');
      const normal1 = manager.getVariable('staticVar', 'Module1', 'Proc2');

      expect(static1).toBeDefined();
      expect(normal1).toBeDefined();
      expect(static1?.isStatic).toBe(true);
      expect(normal1?.isStatic).toBe(false);
    });

    it('should retrieve static variable', () => {
      manager.declareVariable(
        'myStatic',
        VB6DataType.vbString,
        'procedure',
        'TestModule',
        'TestProc',
        true
      );

      const variable = manager.getVariable('myStatic', 'TestModule', 'TestProc');

      expect(variable).toBeDefined();
      expect(variable?.isStatic).toBe(true);
      expect(variable?.name).toBe('myStatic');
    });

    it('should set static variable value', () => {
      manager.declareVariable(
        'count',
        VB6DataType.vbInteger,
        'procedure',
        'Module1',
        'Counter',
        true
      );

      const result = manager.setVariable('count', 42, 'Module1', 'Counter');

      expect(result).toBe(true);

      const variable = manager.getVariable('count', 'Module1', 'Counter');
      expect(variable?.value).toBe(42);
    });
  });

  describe('Static vs Non-Static Variables', () => {
    it('should distinguish static from regular variables', () => {
      // Static variable
      const staticVar = manager.declareVariable(
        'static1',
        VB6DataType.vbInteger,
        'procedure',
        'Module1',
        'Proc1',
        true
      );

      // Regular variable
      const regularVar = manager.declareVariable(
        'regular1',
        VB6DataType.vbInteger,
        'procedure',
        'Module1',
        'Proc1',
        false
      );

      expect(staticVar.isStatic).toBe(true);
      expect(regularVar.isStatic).toBe(false);
    });

    it('should cleanup regular variables but preserve static', () => {
      // Declare both types
      manager.declareVariable('static1', VB6DataType.vbInteger, 'procedure', 'M1', 'P1', true);
      manager.declareVariable('regular1', VB6DataType.vbInteger, 'procedure', 'M1', 'P1', false);

      // Cleanup procedure scope (simulates procedure exit)
      manager.cleanupProcedureScope('P1');

      // Static variable should still be accessible
      const staticVar = manager.getVariable('static1', 'M1', 'P1');
      expect(staticVar).toBeDefined();

      // Regular variable should be gone
      const regularVar = manager.getVariable('regular1', 'M1', 'P1');
      expect(regularVar).toBeUndefined();
    });
  });

  describe('Static Variable Scope Resolution', () => {
    it('should resolve static variables before procedure variables', () => {
      // Declare static variable
      manager.declareVariable('x', VB6DataType.vbInteger, 'procedure', 'Module1', 'Proc1', true);
      manager.setVariable('x', 100, 'Module1', 'Proc1');

      // Declare another static in different procedure
      manager.declareVariable('x', VB6DataType.vbInteger, 'procedure', 'Module1', 'Proc2', true);
      manager.setVariable('x', 200, 'Module1', 'Proc2');

      // Each should resolve to its own static value
      const var1 = manager.getVariable('x', 'Module1', 'Proc1');
      const var2 = manager.getVariable('x', 'Module1', 'Proc2');

      expect(var1?.value).toBe(100);
      expect(var2?.value).toBe(200);
    });

    it('should handle scope chain correctly', () => {
      // Global variable
      manager.declareVariable('z', VB6DataType.vbInteger, 'global', undefined, undefined, false);
      manager.setVariable('z', 1);

      // Module variable
      manager.declareVariable('z', VB6DataType.vbInteger, 'module', 'Module1', undefined, false);
      manager.setVariable('z', 2, 'Module1');

      // Static procedure variable
      manager.declareVariable('z', VB6DataType.vbInteger, 'procedure', 'Module1', 'Proc1', true);
      manager.setVariable('z', 3, 'Module1', 'Proc1');

      // Should resolve to static variable (highest priority)
      const variable = manager.getVariable('z', 'Module1', 'Proc1');
      expect(variable?.value).toBe(3);
    });
  });
});

describe('VB6 Static Variables - Real-World Scenarios', () => {
  let processor: VB6AdvancedLanguageProcessor;

  beforeEach(() => {
    processor = new VB6AdvancedLanguageProcessor();
  });

  afterEach(() => {
    processor.clear();
  });

  it('should implement counter function', () => {
    processor.setCurrentContext('Module1', 'GetNextID');

    // First call
    let id = processor.declareStaticVariable('currentID', 'Long', 0);
    id = id + 1;
    processor.setStaticVariable('currentID', id);
    expect(id).toBe(1);

    // Second call (simulated)
    processor.setCurrentContext('Module1', 'GetNextID');
    id = processor.declareStaticVariable('currentID', 'Long', 0); // Should get existing value
    id = id + 1;
    processor.setStaticVariable('currentID', id);
    expect(id).toBe(2);

    // Third call
    processor.setCurrentContext('Module1', 'GetNextID');
    id = processor.declareStaticVariable('currentID', 'Long', 0);
    id = id + 1;
    processor.setStaticVariable('currentID', id);
    expect(id).toBe(3);
  });

  it('should implement initialization flag', () => {
    processor.setCurrentContext('Module1', 'Initialize');

    // First call - not initialized
    let isInitialized = processor.declareStaticVariable('initialized', 'Boolean', false);
    expect(isInitialized).toBe(false);

    // Perform initialization
    processor.setStaticVariable('initialized', true);

    // Second call - should be initialized
    processor.setCurrentContext('Module1', 'Initialize');
    isInitialized = processor.declareStaticVariable('initialized', 'Boolean', false);
    expect(isInitialized).toBe(true); // Still true from first call
  });

  it('should implement accumulator pattern', () => {
    processor.setCurrentContext('Module1', 'RunningTotal');

    // Add values over multiple calls
    const values = [10, 20, 30, 40, 50];
    let total = 0;

    values.forEach(value => {
      processor.setCurrentContext('Module1', 'RunningTotal');
      total = processor.declareStaticVariable('sum', 'Long', 0);
      total += value;
      processor.setStaticVariable('sum', total);
    });

    expect(total).toBe(150);
  });

  it('should implement call count tracker', () => {
    processor.setCurrentContext('Module1', 'TrackedFunction');

    // Track number of calls
    for (let i = 0; i < 5; i++) {
      processor.setCurrentContext('Module1', 'TrackedFunction');
      let callCount = processor.declareStaticVariable('calls', 'Integer', 0);
      callCount++;
      processor.setStaticVariable('calls', callCount);
    }

    const finalCount = processor.getStaticVariable('calls');
    expect(finalCount).toBe(5);
  });

  it('should implement cached calculation', () => {
    processor.setCurrentContext('Module1', 'ExpensiveCalculation');

    // First call - calculate and cache
    let cached = processor.declareStaticVariable('cachedResult', 'Double', 0);
    let computed = processor.declareStaticVariable('isComputed', 'Boolean', false);

    if (!computed) {
      // Simulate expensive calculation
      cached = Math.PI * Math.E;
      processor.setStaticVariable('cachedResult', cached);
      processor.setStaticVariable('isComputed', true);
    }

    const firstResult = processor.getStaticVariable('cachedResult');

    // Second call - use cached value
    processor.setCurrentContext('Module1', 'ExpensiveCalculation');
    cached = processor.declareStaticVariable('cachedResult', 'Double', 0);
    computed = processor.declareStaticVariable('isComputed', 'Boolean', false);

    const secondResult = processor.getStaticVariable('cachedResult');

    expect(secondResult).toBe(firstResult);
    expect(computed).toBe(true);
  });
});
