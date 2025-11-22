/**
 * TEST COVERAGE GAP FIX: Comprehensive tests for VB6Compiler
 * Tests compilation logic, error handling, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VB6Compiler } from '../services/VB6Compiler';
import type { Project, Module, Form, ClassModule } from '../types/extended';

describe('VB6Compiler', () => {
  let compiler: VB6Compiler;
  
  beforeEach(() => {
    compiler = new VB6Compiler();
  });

  const createMockProject = (): Project => ({
    id: '1',
    name: 'TestProject',
    version: '1.0',
    created: new Date(),
    modified: new Date(),
    forms: [],
    modules: [],
    classModules: [],
    userControls: [],
    resources: [],
    settings: {
      title: 'Test App',
      description: 'Test application',
      version: '1.0',
      autoIncrementVersion: false,
      compilationType: 'exe',
      startupObject: 'Form1',
      icon: '',
      helpFile: '',
      threadingModel: 'apartment'
    },
    references: [],
    components: []
  });

  const createMockModule = (name: string, code: string): Module => ({
    id: `module-${name}`,
    name,
    type: 'standard',
    code,
    procedures: [],
    variables: [],
    constants: []
  });

  const createMockForm = (name: string): Form => ({
    id: `form-${name}`,
    name,
    caption: name,
    controls: [],
    properties: {},
    events: {}
  });

  describe('Basic Compilation', () => {
    it('should compile empty project successfully', async () => {
      const project = createMockProject();
      const result = await compiler.compile(project);
      
      expect(result.errors).toHaveLength(0);
      expect(result.javascript).toContain('TestProject');
      expect(result.javascript).toContain('Generated VB6 Application');
    });

    it('should compile project with simple module', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function Add(a As Integer, b As Integer) As Integer
          Add = a + b
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.errors).toHaveLength(0);
      expect(result.javascript).toContain('Module1');
      expect(result.javascript).toContain('function Add');
    });

    it('should compile project with forms', async () => {
      const project = createMockProject();
      project.forms = [createMockForm('Form1')];
      
      const result = await compiler.compile(project);
      
      expect(result.errors).toHaveLength(0);
      expect(result.javascript).toContain('Form1');
      expect(result.javascript).toContain('VB6Form');
    });

    it('should compile project with class modules', async () => {
      const project = createMockProject();
      const classModule: ClassModule = {
        id: 'class-MyClass',
        name: 'MyClass',
        type: 'class',
        code: `
          Private m_Value As Integer
          
          Public Property Get Value() As Integer
            Value = m_Value
          End Property
          
          Public Property Let Value(newValue As Integer)
            m_Value = newValue
          End Property
        `,
        procedures: [],
        variables: [],
        constants: [],
        events: [],
        properties: [],
        methods: []
      };
      project.classModules = [classModule];
      
      const result = await compiler.compile(project);
      
      expect(result.errors).toHaveLength(0);
      expect(result.javascript).toContain('MyClass');
      expect(result.javascript).toContain('class MyClass');
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors in modules', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function InvalidSyntax(
          ' Missing closing parenthesis and End Function
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('error');
      expect(result.errors[0].message).toContain('syntax');
    });

    it('should handle missing variable declarations', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function UseUndeclaredVar() As Integer
          UseUndeclaredVar = undeclaredVariable + 1
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.errors.some(e => e.message.includes('undeclared') || e.message.includes('undefined'))).toBe(true);
    });

    it('should handle type mismatches', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function TypeMismatch() As Integer
          Dim s As String
          s = "Hello"
          TypeMismatch = s ' String assigned to Integer
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      // Should generate warnings or errors for type mismatches
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle circular dependencies', async () => {
      const project = createMockProject();
      project.modules = [
        createMockModule('Module1', `
          Public Function CallModule2() As Integer
            CallModule2 = Module2Function()
          End Function
        `),
        createMockModule('Module2', `
          Public Function Module2Function() As Integer
            Module2Function = Module1Function() ' Circular call
          End Function
          
          Public Function Module1Function() As Integer
            Module1Function = CallModule2()
          End Function
        `)
      ];
      
      const result = await compiler.compile(project);
      
      // Should detect circular dependency
      expect(result.errors.some(e => e.message.includes('circular') || e.message.includes('dependency'))).toBe(true);
    });
  });

  describe('Code Generation', () => {
    it('should generate proper JavaScript for VB6 functions', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function Calculate(x As Double, y As Double) As Double
          Calculate = x * y + 10
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.javascript).toContain('function Calculate');
      expect(result.javascript).toContain('x * y + 10');
    });

    it('should handle VB6 specific constructs', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Sub TestSub()
          Dim i As Integer
          For i = 1 To 10
            Debug.Print i
          Next i
          
          If i > 5 Then
            MsgBox "Greater than 5"
          ElseIf i = 5 Then
            MsgBox "Equal to 5"
          Else
            MsgBox "Less than 5"
          End If
        End Sub
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.javascript).toContain('for');
      expect(result.javascript).toContain('if');
      expect(result.javascript).toContain('console.log'); // Debug.Print -> console.log
      expect(result.javascript).toContain('alert'); // MsgBox -> alert
    });

    it('should generate proper form initialization code', async () => {
      const project = createMockProject();
      const form = createMockForm('Form1');
      form.controls = [
        {
          id: 1,
          type: 'CommandButton',
          name: 'Command1',
          caption: 'Click Me',
          x: 100,
          y: 100,
          width: 80,
          height: 25,
          visible: true,
          enabled: true,
          tabIndex: 1,
          events: {
            Click: 'MsgBox "Button clicked"'
          }
        }
      ];
      project.forms = [form];
      
      const result = await compiler.compile(project);
      
      expect(result.javascript).toContain('Form1');
      expect(result.javascript).toContain('Command1');
      expect(result.javascript).toContain('Click Me');
      expect(result.javascript).toContain('Button clicked');
    });
  });

  describe('Source Map Generation', () => {
    it('should generate source maps for debugging', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function Test() As Integer
          Test = 42
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.sourceMap).toBeDefined();
      expect(result.sourceMap).toContain('version');
      expect(result.sourceMap).toContain('sources');
      expect(result.sourceMap).toContain('mappings');
    });
  });

  describe('Dependency Extraction', () => {
    it('should extract project dependencies', async () => {
      const project = createMockProject();
      project.references = [
        {
          id: 'ref1',
          name: 'Microsoft Excel Object Library',
          description: 'Excel automation',
          version: '1.0',
          location: 'C:\\Program Files\\Microsoft Office\\Excel.exe',
          guid: '{00020813-0000-0000-C000-000000000046}',
          checked: true,
          builtin: false,
          major: 1,
          minor: 0
        }
      ];
      
      const result = await compiler.compile(project);
      
      expect(result.dependencies).toContain('Microsoft Excel Object Library');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code blocks', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', '')];
      
      const result = await compiler.compile(project);
      
      expect(result.errors).toHaveLength(0);
      expect(result.javascript).toBeDefined();
    });

    it('should handle very long function names', async () => {
      const longName = 'VeryLongFunctionName' + 'x'.repeat(100);
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function ${longName}() As Integer
          ${longName} = 1
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      // Should handle long names gracefully
      expect(result.javascript).toContain(longName);
    });

    it('should handle special characters in strings', async () => {
      const project = createMockProject();
      project.modules = [createMockModule('Module1', `
        Public Function SpecialChars() As String
          SpecialChars = "Hello \\"World\\" with 'quotes' and \\n newlines"
        End Function
      `)];
      
      const result = await compiler.compile(project);
      
      expect(result.javascript).toContain('Hello');
      expect(result.javascript).toContain('World');
    });

    it('should handle deeply nested structures', async () => {
      const project = createMockProject();
      const deepCode = `
        Public Function DeepNesting() As Integer
          If True Then
            If True Then
              If True Then
                If True Then
                  If True Then
                    DeepNesting = 1
                  End If
                End If
              End If
            End If
          End If
        End Function
      `;
      project.modules = [createMockModule('Module1', deepCode)];
      
      const result = await compiler.compile(project);
      
      // Should handle deep nesting without stack overflow
      expect(result.javascript).toBeDefined();
    });

    it('should handle compilation failure gracefully', async () => {
      const project = createMockProject();
      
      // Mock a compilation failure
      const originalCompileModules = (compiler as any).compileModules;
      (compiler as any).compileModules = vi.fn().mockImplementation(() => {
        throw new Error('Simulated compilation failure');
      });
      
      const result = await compiler.compile(project);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Compilation failed');
      expect(result.errors[0].code).toBe('COMP001');
      
      // Restore original method
      (compiler as any).compileModules = originalCompileModules;
    });
  });

  describe('Performance Tests', () => {
    it('should handle large projects efficiently', async () => {
      const project = createMockProject();
      
      // Create a large number of modules
      for (let i = 0; i < 100; i++) {
        project.modules.push(createMockModule(`Module${i}`, `
          Public Function Func${i}() As Integer
            Func${i} = ${i}
          End Function
        `));
      }
      
      const startTime = performance.now();
      const result = await compiler.compile(project);
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle memory efficiently with large code blocks', async () => {
      const project = createMockProject();
      const largeCode = 'Dim x As Integer\n'.repeat(10000);
      project.modules = [createMockModule('Module1', `
        Public Sub LargeFunction()
          ${largeCode}
        End Sub
      `)];
      
      const result = await compiler.compile(project);
      
      // Should handle large code blocks without memory issues
      expect(result.javascript).toBeDefined();
    });
  });
});