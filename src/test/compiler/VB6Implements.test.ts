import { describe, it, expect, beforeEach } from 'vitest';
import { VB6InterfaceProcessor } from '../../compiler/VB6InterfaceSupport';

describe('VB6 Implements - Interface Declarations', () => {
  let processor: VB6InterfaceProcessor;

  beforeEach(() => {
    processor = new VB6InterfaceProcessor();
    processor.setCurrentModule('TestModule');
  });

  describe('Parsing Interface Declarations', () => {
    it('should parse simple Interface declaration', () => {
      const code = 'Interface IComparable';
      const result = processor.parseInterfaceDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('IComparable');
      expect(result!.public).toBe(true); // Default is public
      expect(result!.module).toBe('TestModule');
      expect(result!.line).toBe(1);
      expect(result!.methods).toHaveLength(0);
      expect(result!.properties).toHaveLength(0);
    });

    it('should parse Public Interface declaration', () => {
      const code = 'Public Interface IDrawable';
      const result = processor.parseInterfaceDeclaration(code, 5);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('IDrawable');
      expect(result!.public).toBe(true);
      expect(result!.line).toBe(5);
    });

    it('should parse Private Interface declaration', () => {
      const code = 'Private Interface IInternal';
      const result = processor.parseInterfaceDeclaration(code, 10);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('IInternal');
      expect(result!.public).toBe(false);
    });

    it('should return null for non-Interface declaration', () => {
      const code = 'Class MyClass';
      const result = processor.parseInterfaceDeclaration(code, 1);

      expect(result).toBeNull();
    });

    it('should handle Interface with different spacing', () => {
      const code = 'Public   Interface   ISpacey';
      const result = processor.parseInterfaceDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('ISpacey');
    });

    it('should handle case-insensitive keywords', () => {
      const code = 'interface ILowerCase';
      const result = processor.parseInterfaceDeclaration(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('ILowerCase');
    });
  });

  describe('Parsing Interface Methods', () => {
    it('should parse Function with return type', () => {
      const code = 'Function CompareTo(obj As Object) As Integer';
      const result = processor.parseInterfaceMethod(code, 10);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('CompareTo');
      expect(result!.isFunction).toBe(true);
      expect(result!.returnType).toBe('Integer');
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('obj');
      expect(result!.parameters[0].type).toBe('Object');
    });

    it('should parse Sub without return type', () => {
      const code = 'Sub Draw()';
      const result = processor.parseInterfaceMethod(code, 15);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Draw');
      expect(result!.isFunction).toBe(false);
      expect(result!.returnType).toBeUndefined();
      expect(result!.parameters).toHaveLength(0);
    });

    it('should parse method with multiple parameters', () => {
      const code = 'Function Calculate(ByVal x As Integer, ByVal y As Integer) As Integer';
      const result = processor.parseInterfaceMethod(code, 20);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(2);
      expect(result!.parameters[0].name).toBe('x');
      expect(result!.parameters[0].type).toBe('Integer');
      expect(result!.parameters[0].byRef).toBe(false);
      expect(result!.parameters[1].name).toBe('y');
      expect(result!.parameters[1].type).toBe('Integer');
    });

    it('should parse method with ByRef parameter', () => {
      const code = 'Sub Swap(ByRef a As Integer, ByRef b As Integer)';
      const result = processor.parseInterfaceMethod(code, 25);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(2);
      expect(result!.parameters[0].byRef).toBe(true);
      expect(result!.parameters[1].byRef).toBe(true);
    });

    it('should default to ByRef when not specified', () => {
      const code = 'Sub Process(value As String)';
      const result = processor.parseInterfaceMethod(code, 30);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].byRef).toBe(true);
    });

    it('should parse method with optional parameter', () => {
      const code = 'Function Format(text As String, Optional style As Integer) As String';
      const result = processor.parseInterfaceMethod(code, 35);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(2);
      expect(result!.parameters[0].optional).toBe(false);
      expect(result!.parameters[1].optional).toBe(true);
    });

    it('should throw error for Function without return type', () => {
      const code = 'Function GetValue()';

      expect(() => processor.parseInterfaceMethod(code, 40)).toThrow('must have a return type');
    });

    it('should throw error for Sub with return type', () => {
      const code = 'Sub DoSomething() As Integer';

      expect(() => processor.parseInterfaceMethod(code, 45)).toThrow('cannot have a return type');
    });
  });

  describe('Parsing Interface Properties', () => {
    it('should parse Property Get', () => {
      const code = 'Property Get Width() As Long';
      const result = processor.parseInterfaceProperty(code, 50);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Width');
      expect(result!.type).toBe('Long');
      expect(result!.readOnly).toBe(true);
      expect(result!.writeOnly).toBe(false);
    });

    it('should parse Property Let', () => {
      const code = 'Property Let Height(ByVal value As Long) As Long';
      const result = processor.parseInterfaceProperty(code, 55);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Height');
      expect(result!.type).toBe('Long');
      expect(result!.readOnly).toBe(false);
      expect(result!.writeOnly).toBe(true);
    });

    it('should parse Property Set', () => {
      const code = 'Property Set Owner(ByVal value As Object) As Object';
      const result = processor.parseInterfaceProperty(code, 60);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Owner');
      expect(result!.type).toBe('Object');
      expect(result!.writeOnly).toBe(true);
    });

    it('should return null for non-Property declaration', () => {
      const code = 'Function GetWidth() As Long';
      const result = processor.parseInterfaceProperty(code, 1);

      expect(result).toBeNull();
    });
  });

  describe('Parsing Implements Statement', () => {
    it('should parse simple Implements statement', () => {
      const code = 'Implements IComparable';
      const result = processor.parseImplementsStatement(code, 70);

      expect(result).not.toBeNull();
      expect(result).toBe('IComparable');
    });

    it('should parse Implements with different spacing', () => {
      const code = 'Implements   IDrawable';
      const result = processor.parseImplementsStatement(code, 75);

      expect(result).toBe('IDrawable');
    });

    it('should handle case-insensitive keywords', () => {
      const code = 'implements IInterface';
      const result = processor.parseImplementsStatement(code, 80);

      expect(result).toBe('IInterface');
    });

    it('should return null for non-Implements statement', () => {
      const code = 'Dim x As Integer';
      const result = processor.parseImplementsStatement(code, 1);

      expect(result).toBeNull();
    });
  });

  describe('Parsing Interface Method Implementation', () => {
    it('should parse Private Function implementation', () => {
      const code = 'Private Function IComparable_CompareTo(obj As Object) As Integer';
      const result = processor.parseInterfaceMethodImplementation(code, 90);

      expect(result).not.toBeNull();
      expect(result!.interfaceMethod).toBe('IComparable.CompareTo');
      expect(result!.implementationMethod).toBe('IComparable_CompareTo');
    });

    it('should parse Public Sub implementation', () => {
      const code = 'Public Sub IDrawable_Draw()';
      const result = processor.parseInterfaceMethodImplementation(code, 95);

      expect(result).not.toBeNull();
      expect(result!.interfaceMethod).toBe('IDrawable.Draw');
      expect(result!.implementationMethod).toBe('IDrawable_Draw');
    });

    it('should parse implementation without scope modifier', () => {
      const code = 'Function ICalculator_Add(x As Integer, y As Integer) As Integer';
      const result = processor.parseInterfaceMethodImplementation(code, 100);

      expect(result).not.toBeNull();
      expect(result!.interfaceMethod).toBe('ICalculator.Add');
    });

    it('should return null for non-interface method', () => {
      const code = 'Private Function RegularMethod() As Integer';
      const result = processor.parseInterfaceMethodImplementation(code, 1);

      expect(result).toBeNull();
    });
  });

  describe('Registration and Retrieval', () => {
    it('should register and retrieve Interface', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      processor.registerInterface(interfaceDecl!);

      const retrieved = processor.getInterface('IComparable');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.name).toBe('IComparable');
    });

    it('should register Public Interface globally', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Public Interface IDrawable', 1);
      processor.registerInterface(interfaceDecl!);

      const retrieved = processor.getInterface('IDrawable');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.public).toBe(true);
    });

    it('should register Private Interface with module scope', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Private Interface IInternal', 1);
      processor.registerInterface(interfaceDecl!);

      const retrieved = processor.getInterface('IInternal');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.public).toBe(false);
    });

    it('should add method to Interface', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      processor.registerInterface(interfaceDecl!);

      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      processor.addMethodToInterface('IComparable', method!);

      const retrieved = processor.getInterface('IComparable');
      expect(retrieved!.methods).toHaveLength(1);
      expect(retrieved!.methods[0].name).toBe('CompareTo');
    });

    it('should add property to Interface', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IDrawable', 1);
      processor.registerInterface(interfaceDecl!);

      const property = processor.parseInterfaceProperty('Property Get Width() As Long', 2);
      processor.addPropertyToInterface('IDrawable', property!);

      const retrieved = processor.getInterface('IDrawable');
      expect(retrieved!.properties).toHaveLength(1);
      expect(retrieved!.properties[0].name).toBe('Width');
    });

    it('should merge Property Get and Let for same property', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IDrawable', 1);
      processor.registerInterface(interfaceDecl!);

      const propertyGet = processor.parseInterfaceProperty('Property Get Width() As Long', 2);
      const propertyLet = processor.parseInterfaceProperty('Property Let Width(ByVal value As Long) As Long', 3);

      processor.addPropertyToInterface('IDrawable', propertyGet!);
      processor.addPropertyToInterface('IDrawable', propertyLet!);

      const retrieved = processor.getInterface('IDrawable');
      expect(retrieved!.properties).toHaveLength(1);
      expect(retrieved!.properties[0].readOnly).toBe(false); // Has both Get and Let
      expect(retrieved!.properties[0].writeOnly).toBe(false);
    });

    it('should register Implements', () => {
      processor.registerImplements('Rectangle', 'IDrawable', 10);

      const implementation = processor.getImplementation('Rectangle', 'IDrawable');
      expect(implementation).not.toBeUndefined();
      expect(implementation!.className).toBe('Rectangle');
      expect(implementation!.interfaceName).toBe('IDrawable');
    });

    it('should add method implementation', () => {
      processor.registerImplements('Rectangle', 'IDrawable', 10);

      const methodImpl = processor.parseInterfaceMethodImplementation(
        'Private Sub IDrawable_Draw()',
        20
      );

      processor.addMethodImplementation('Rectangle', 'IDrawable', methodImpl!);

      const implementation = processor.getImplementation('Rectangle', 'IDrawable');
      expect(implementation!.implementedMethods.size).toBe(1);
      expect(implementation!.implementedMethods.has('IDrawable.Draw')).toBe(true);
    });

    it('should get all module interfaces', () => {
      processor.setCurrentModule('Module1');

      const iface1 = processor.parseInterfaceDeclaration('Interface IFirst', 1);
      const iface2 = processor.parseInterfaceDeclaration('Interface ISecond', 2);

      processor.registerInterface(iface1!);
      processor.registerInterface(iface2!);

      const moduleInterfaces = processor.getModuleInterfaces();
      expect(moduleInterfaces.length).toBe(2);
    });

    it('should get all module implementations', () => {
      processor.setCurrentModule('Module1');

      processor.registerImplements('Class1', 'IFirst', 10);
      processor.registerImplements('Class2', 'ISecond', 20);

      const moduleImplementations = processor.getModuleImplementations();
      expect(moduleImplementations.length).toBe(2);
    });
  });

  describe('JavaScript Code Generation', () => {
    it('should generate JavaScript for Interface', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);

      interfaceDecl!.methods.push(method!);

      const js = processor.generateJavaScript(interfaceDecl!);

      expect(js).toContain('// Interface: IComparable');
      expect(js).toContain('class IComparable');
      expect(js).toContain('// Function: CompareTo');
      expect(js).toContain('obj: Object');
      expect(js).toContain(': Integer');
    });

    it('should generate JavaScript for Interface with properties', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IDrawable', 1);
      const property = processor.parseInterfaceProperty('Property Get Width() As Long', 2);

      interfaceDecl!.properties.push(property!);

      const js = processor.generateJavaScript(interfaceDecl!);

      expect(js).toContain('// Property: Width: Long');
      expect(js).toContain('(ReadOnly)');
    });

    it('should generate JavaScript implementation', () => {
      // Create interface
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      interfaceDecl!.methods.push(method!);
      processor.registerInterface(interfaceDecl!);

      // Create implementation
      processor.registerImplements('Rectangle', 'IComparable', 10);

      const implementation = processor.getImplementation('Rectangle', 'IComparable');
      const js = processor.generateImplementationJS(implementation!);

      expect(js).toContain('// Implementation of IComparable by Rectangle');
      expect(js).toContain('IComparable_CompareTo: function(');
      expect(js).toContain('obj');
    });

    it('should generate TypeScript interface', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      interfaceDecl!.methods.push(method!);

      const ts = processor.generateTypeScript(interfaceDecl!);

      expect(ts).toContain('interface IComparable');
      expect(ts).toContain('CompareTo(obj: object | null): number;');
    });

    it('should generate TypeScript with readonly property', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IDrawable', 1);
      const property = processor.parseInterfaceProperty('Property Get Width() As Long', 2);
      interfaceDecl!.properties.push(property!);

      const ts = processor.generateTypeScript(interfaceDecl!);

      expect(ts).toContain('readonly Width: number;');
    });

    it('should generate TypeScript with optional parameters', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IFormatter', 1);
      const method = processor.parseInterfaceMethod('Function Format(text As String, Optional style As Integer) As String', 2);
      interfaceDecl!.methods.push(method!);

      const ts = processor.generateTypeScript(interfaceDecl!);

      expect(ts).toContain('Format(text: string, style?: number): string;');
    });
  });

  describe('Validation', () => {
    it('should validate complete implementation', () => {
      // Create interface
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      interfaceDecl!.methods.push(method!);
      processor.registerInterface(interfaceDecl!);

      // Create implementation
      processor.registerImplements('Rectangle', 'IComparable', 10);
      const methodImpl = processor.parseInterfaceMethodImplementation(
        'Private Function IComparable_CompareTo(obj As Object) As Integer',
        20
      );
      processor.addMethodImplementation('Rectangle', 'IComparable', methodImpl!);

      const errors = processor.validateImplementation('Rectangle', 'IComparable');
      expect(errors).toHaveLength(0);
    });

    it('should detect missing method implementation', () => {
      // Create interface
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      interfaceDecl!.methods.push(method!);
      processor.registerInterface(interfaceDecl!);

      // Create implementation without implementing method
      processor.registerImplements('Rectangle', 'IComparable', 10);

      const errors = processor.validateImplementation('Rectangle', 'IComparable');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('CompareTo');
      expect(errors[0]).toContain('not implemented');
    });

    it('should detect missing property implementation', () => {
      // Create interface
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IDrawable', 1);
      const property = processor.parseInterfaceProperty('Property Get Width() As Long', 2);
      interfaceDecl!.properties.push(property!);
      processor.registerInterface(interfaceDecl!);

      // Create implementation without implementing property
      processor.registerImplements('Rectangle', 'IDrawable', 10);

      const errors = processor.validateImplementation('Rectangle', 'IDrawable');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Width');
      expect(errors[0]).toContain('not implemented');
    });

    it('should detect non-existent interface', () => {
      processor.registerImplements('Rectangle', 'IUnknown', 10);

      const errors = processor.validateImplementation('Rectangle', 'IUnknown');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Interface IUnknown not found');
    });

    it('should detect non-existent implementation', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      processor.registerInterface(interfaceDecl!);

      const errors = processor.validateImplementation('Unknown', 'IComparable');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('does not implement');
    });
  });

  describe('Export and Import', () => {
    it('should export interface data', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      processor.registerInterface(interfaceDecl!);

      const exported = processor.export();
      expect(exported.interfaces).toBeDefined();
      expect(Object.keys(exported.interfaces).length).toBeGreaterThan(0);
    });

    it('should export implementation data', () => {
      processor.registerImplements('Rectangle', 'IDrawable', 10);

      const exported = processor.export();
      expect(exported.implementations).toBeDefined();
      expect(Object.keys(exported.implementations).length).toBeGreaterThan(0);
    });

    it('should import interface data', () => {
      const data = {
        interfaces: {
          'IComparable': {
            name: 'IComparable',
            methods: [],
            properties: [],
            public: true,
            module: 'TestModule',
            line: 1
          }
        },
        implementations: {}
      };

      processor.import(data);

      const retrieved = processor.getInterface('IComparable');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved!.name).toBe('IComparable');
    });

    it('should import implementation data', () => {
      const data = {
        interfaces: {},
        implementations: {
          'TestModule.Rectangle.IDrawable': {
            className: 'Rectangle',
            interfaceName: 'IDrawable',
            implementedMethods: {},
            implementedProperties: {},
            module: 'TestModule',
            line: 10
          }
        }
      };

      processor.import(data);

      const implementation = processor.getImplementation('Rectangle', 'IDrawable');
      expect(implementation).not.toBeUndefined();
    });

    it('should clear all data', () => {
      const interfaceDecl = processor.parseInterfaceDeclaration('Interface IComparable', 1);
      processor.registerInterface(interfaceDecl!);
      processor.registerImplements('Rectangle', 'IComparable', 10);

      processor.clear();

      expect(processor.getInterface('IComparable')).toBeUndefined();
      expect(processor.getImplementation('Rectangle', 'IComparable')).toBeUndefined();
    });
  });
});

describe('VB6 Implements - Real-World Scenarios', () => {
  let processor: VB6InterfaceProcessor;

  beforeEach(() => {
    processor = new VB6InterfaceProcessor();
    processor.setCurrentModule('TestModule');
  });

  describe('IComparable Implementation', () => {
    it('should handle complete IComparable implementation', () => {
      // Define interface
      const interfaceDecl = processor.parseInterfaceDeclaration('Public Interface IComparable', 1);
      const method = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      interfaceDecl!.methods.push(method!);
      processor.registerInterface(interfaceDecl!);

      // Implement in Rectangle class
      processor.registerImplements('Rectangle', 'IComparable', 10);
      const methodImpl = processor.parseInterfaceMethodImplementation(
        'Private Function IComparable_CompareTo(obj As Object) As Integer',
        20
      );
      processor.addMethodImplementation('Rectangle', 'IComparable', methodImpl!);

      // Validate
      const errors = processor.validateImplementation('Rectangle', 'IComparable');
      expect(errors).toHaveLength(0);

      // Generate code
      const implementation = processor.getImplementation('Rectangle', 'IComparable');
      const js = processor.generateImplementationJS(implementation!);

      expect(js).toContain('IComparable_CompareTo');
    });
  });

  describe('IDrawable with Properties', () => {
    it('should handle interface with properties and methods', () => {
      // Define interface
      const interfaceDecl = processor.parseInterfaceDeclaration('Public Interface IDrawable', 1);

      // Add methods to declaration
      const drawMethod = processor.parseInterfaceMethod('Sub Draw()', 4);
      const areaMethod = processor.parseInterfaceMethod('Function GetArea() As Long', 5);
      interfaceDecl!.methods.push(drawMethod!, areaMethod!);

      // Register interface first
      processor.registerInterface(interfaceDecl!);

      // Then add properties (which will be merged)
      const widthGet = processor.parseInterfaceProperty('Property Get Width() As Long', 2);
      const widthLet = processor.parseInterfaceProperty('Property Let Width(ByVal value As Long) As Long', 3);
      processor.addPropertyToInterface('IDrawable', widthGet!);
      processor.addPropertyToInterface('IDrawable', widthLet!);

      // Check merged property
      const retrieved = processor.getInterface('IDrawable');
      expect(retrieved!.properties).toHaveLength(1);
      expect(retrieved!.properties[0].readOnly).toBe(false);
      expect(retrieved!.properties[0].writeOnly).toBe(false);

      expect(retrieved!.methods).toHaveLength(2);
    });
  });

  describe('Multiple Interface Implementation', () => {
    it('should handle class implementing multiple interfaces', () => {
      // Define IComparable
      const iComparable = processor.parseInterfaceDeclaration('Public Interface IComparable', 1);
      const compareMethod = processor.parseInterfaceMethod('Function CompareTo(obj As Object) As Integer', 2);
      iComparable!.methods.push(compareMethod!);
      processor.registerInterface(iComparable!);

      // Define IDrawable
      const iDrawable = processor.parseInterfaceDeclaration('Public Interface IDrawable', 10);
      const drawMethod = processor.parseInterfaceMethod('Sub Draw()', 11);
      iDrawable!.methods.push(drawMethod!);
      processor.registerInterface(iDrawable!);

      // Rectangle implements both
      processor.registerImplements('Rectangle', 'IComparable', 20);
      processor.registerImplements('Rectangle', 'IDrawable', 21);

      const implComparable = processor.getImplementation('Rectangle', 'IComparable');
      const implDrawable = processor.getImplementation('Rectangle', 'IDrawable');

      expect(implComparable).not.toBeUndefined();
      expect(implDrawable).not.toBeUndefined();
    });
  });

  describe('IEnumerable Pattern', () => {
    it('should handle IEnumerable and IEnumerator interfaces', () => {
      // Define IEnumerator
      const iEnumerator = processor.parseInterfaceDeclaration('Public Interface IEnumerator', 1);
      const currentProp = processor.parseInterfaceProperty('Property Get Current() As Variant', 2);
      const moveNextMethod = processor.parseInterfaceMethod('Function MoveNext() As Boolean', 3);
      const resetMethod = processor.parseInterfaceMethod('Sub Reset()', 4);

      iEnumerator!.properties.push(currentProp!);
      iEnumerator!.methods.push(moveNextMethod!, resetMethod!);
      processor.registerInterface(iEnumerator!);

      // Define IEnumerable
      const iEnumerable = processor.parseInterfaceDeclaration('Public Interface IEnumerable', 10);
      const getEnumeratorMethod = processor.parseInterfaceMethod('Function GetEnumerator() As IEnumerator', 11);
      iEnumerable!.methods.push(getEnumeratorMethod!);
      processor.registerInterface(iEnumerable!);

      // Verify
      const enumerator = processor.getInterface('IEnumerator');
      const enumerable = processor.getInterface('IEnumerable');

      expect(enumerator!.methods).toHaveLength(2);
      expect(enumerator!.properties).toHaveLength(1);
      expect(enumerable!.methods).toHaveLength(1);
    });
  });
});
