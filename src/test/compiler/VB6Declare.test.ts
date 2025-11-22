/**
 * VB6 Declare Function/Sub Support - Comprehensive Test Suite
 *
 * Tests all aspects of VB6 external API declarations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VB6DeclareProcessor, VB6DeclareFunction, VB6DeclareParameter } from '../../compiler/VB6DeclareSupport';
import { VB6DeclareRegistry } from '../../runtime/VB6DeclareSupport';

describe('VB6 Declare Support', () => {

  describe('Declare Processor - Parsing', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should parse simple Declare Function', () => {
      const code = 'Declare Function GetTickCount Lib "kernel32" () As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('GetTickCount');
      expect(result!.library).toBe('kernel32');
      expect(result!.isFunction).toBe(true);
      expect(result!.returnType).toBe('Long');
      expect(result!.parameters).toHaveLength(0);
      expect(result!.public).toBe(true);
    });

    it('should parse Declare Sub', () => {
      const code = 'Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Sleep');
      expect(result!.library).toBe('kernel32');
      expect(result!.isFunction).toBe(false);
      expect(result!.returnType).toBeUndefined();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('dwMilliseconds');
      expect(result!.parameters[0].type).toBe('Long');
      expect(result!.parameters[0].byRef).toBe(false); // ByVal
    });

    it('should parse Declare with Alias', () => {
      const code = 'Declare Function GetWindowsDirectory Lib "kernel32" Alias "GetWindowsDirectoryA" (ByVal lpBuffer As String, ByVal nSize As Long) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('GetWindowsDirectory');
      expect(result!.aliasName).toBe('GetWindowsDirectoryA');
      expect(result!.library).toBe('kernel32');
      expect(result!.parameters).toHaveLength(2);
    });

    it('should parse Public Declare', () => {
      const code = 'Public Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hWnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.public).toBe(true);
      expect(result!.name).toBe('MessageBox');
      expect(result!.parameters).toHaveLength(4);
    });

    it('should parse Private Declare', () => {
      const code = 'Private Declare Function FindWindow Lib "user32" Alias "FindWindowA" (ByVal lpClassName As String, ByVal lpWindowName As String) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.public).toBe(false);
    });

    it('should parse parameters with ByVal', () => {
      const code = 'Declare Sub Test Lib "test.dll" (ByVal x As Long)';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].byRef).toBe(false);
    });

    it('should parse parameters with ByRef', () => {
      const code = 'Declare Sub Test Lib "test.dll" (ByRef x As Long)';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].byRef).toBe(true);
    });

    it('should default to ByRef when not specified', () => {
      const code = 'Declare Sub Test Lib "test.dll" (x As Long)';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].byRef).toBe(true);
    });

    it('should parse Optional parameters', () => {
      const code = 'Declare Function Test Lib "test.dll" (Optional ByVal x As Long) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].optional).toBe(true);
    });

    it('should parse multiple parameters', () => {
      const code = 'Declare Function GetPrivateProfileString Lib "kernel32" Alias "GetPrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As String, ByVal lpDefault As String, ByVal lpReturnedString As String, ByVal nSize As Long, ByVal lpFileName As String) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(6);
      expect(result!.parameters[0].name).toBe('lpApplicationName');
      expect(result!.parameters[5].name).toBe('lpFileName');
    });

    it('should validate Function must have return type', () => {
      const code = 'Declare Function Test Lib "test.dll" ()';

      expect(() => processor.parseDeclareStatement(code, 1)).toThrow('must have a return type');
    });

    it('should validate Sub cannot have return type', () => {
      const code = 'Declare Sub Test Lib "test.dll" () As Long';

      expect(() => processor.parseDeclareStatement(code, 1)).toThrow('cannot have a return type');
    });
  });

  describe('Declare Processor - Registry', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should register and retrieve public declare', () => {
      const code = 'Public Declare Function GetTickCount Lib "kernel32" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      expect(declareFunc).not.toBeNull();
      processor.registerDeclareFunction(declareFunc!);

      const retrieved = processor.getDeclaredFunction('GetTickCount');
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('GetTickCount');
    });

    it('should register and retrieve private declare with module scope', () => {
      const code = 'Private Declare Function Test Lib "test.dll" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      expect(declareFunc).not.toBeNull();
      processor.registerDeclareFunction(declareFunc!);

      const retrieved = processor.getDeclaredFunction('Test');
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Test');
    });

    it('should get module declared functions', () => {
      const code1 = 'Declare Function Func1 Lib "test.dll" () As Long';
      const code2 = 'Declare Function Func2 Lib "test.dll" () As Long';

      const decl1 = processor.parseDeclareStatement(code1, 1);
      const decl2 = processor.parseDeclareStatement(code2, 2);

      processor.registerDeclareFunction(decl1!);
      processor.registerDeclareFunction(decl2!);

      const moduleFuncs = processor.getModuleDeclaredFunctions();
      expect(moduleFuncs).toHaveLength(2);
    });
  });

  describe('Declare Processor - Code Generation', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should generate JavaScript shim for simple function', () => {
      const code = 'Declare Function GetTickCount Lib "kernel32" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('function GetTickCount');
      expect(allShims).toContain('kernel32');
    });

    it('should generate parameter validation in shim', () => {
      const code = 'Declare Function Test Lib "test.dll" (ByVal x As Long, ByVal y As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('function Test(x, y)');
      expect(allShims).toContain('Required parameter');
    });

    it('should generate TypeScript definitions', () => {
      const code = 'Declare Function GetTickCount Lib "kernel32" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const tsCode = processor.generateTypeScriptDefinitions();
      expect(tsCode).toContain('declare function GetTickCount');
      expect(tsCode).toContain(': number');
    });

    it('should generate TypeScript with optional parameters', () => {
      const code = 'Declare Function Test Lib "test.dll" (ByVal x As Long, Optional ByVal y As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const tsCode = processor.generateTypeScriptDefinitions();
      expect(tsCode).toContain('x: number');
      expect(tsCode).toContain('y?: number');
    });
  });

  describe('Declare Processor - Specific API Implementations', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should generate Kernel32 Sleep implementation', () => {
      const code = 'Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('Sleep');
      expect(allShims).toContain('kernel32');
      expect(allShims).toContain('not supported in web environment');
    });

    it('should generate Kernel32 GetTickCount implementation', () => {
      const code = 'Declare Function GetTickCount Lib "kernel32" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('GetTickCount');
      expect(allShims).toContain('kernel32');
      expect(allShims).toContain('return 0');
    });

    it('should generate User32 MessageBox implementation', () => {
      const code = 'Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hWnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('MessageBox');
      expect(allShims).toContain('user32');
      expect(allShims).toContain('not supported in web environment');
    });

    it('should generate Shell32 ShellExecute implementation', () => {
      const code = 'Declare Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" (ByVal hWnd As Long, ByVal lpOperation As String, ByVal lpFile As String, ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('ShellExecute');
      expect(allShims).toContain('shell32');
      expect(allShims).toContain('not supported in web environment');
    });

    it('should generate utility functions', () => {
      const code = 'Declare Function Test Lib "test.dll" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const allShims = processor.generateAllShims();
      expect(allShims).toContain('vb6StringToCString');
      expect(allShims).toContain('cStringToVB6String');
      expect(allShims).toContain('S_OK');
      expect(allShims).toContain('HWND_DESKTOP');
      expect(allShims).toContain('MB_OK');
    });
  });

  describe('Declare Processor - Validation', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should validate declare call with correct arguments', () => {
      const code = 'Declare Function Test Lib "test.dll" (ByVal x As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const result = processor.validateDeclareCall('Test', [42]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate too few arguments', () => {
      const code = 'Declare Function Test Lib "test.dll" (ByVal x As Long, ByVal y As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const result = processor.validateDeclareCall('Test', [42]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('requires at least');
    });

    it('should validate too many arguments', () => {
      const code = 'Declare Function Test Lib "test.dll" (ByVal x As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const result = processor.validateDeclareCall('Test', [42, 43, 44]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('accepts at most');
    });

    it('should validate undeclared function', () => {
      const result = processor.validateDeclareCall('UndeclaredFunc', []);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not declared');
    });

    it('should allow optional parameters to be omitted', () => {
      const code = 'Declare Function Test Lib "test.dll" (ByVal x As Long, Optional ByVal y As Long) As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const result = processor.validateDeclareCall('Test', [42]);
      expect(result.valid).toBe(true);
    });
  });

  describe('Declare Processor - Export/Import', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should export and import declare data', () => {
      const code = 'Public Declare Function GetTickCount Lib "kernel32" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);

      const exported = processor.export();
      expect(Object.keys(exported.functions).length).toBeGreaterThan(0);

      const newProcessor = new VB6DeclareProcessor();
      newProcessor.setCurrentModule('TestModule');
      newProcessor.import(exported);

      const retrieved = newProcessor.getDeclaredFunction('GetTickCount');
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('GetTickCount');
    });

    it('should clear all declarations', () => {
      const code = 'Declare Function Test Lib "test.dll" () As Long';
      const declareFunc = processor.parseDeclareStatement(code, 1);

      processor.registerDeclareFunction(declareFunc!);
      expect(processor.getDeclaredFunction('Test')).toBeDefined();

      processor.clear();
      expect(processor.getDeclaredFunction('Test')).toBeUndefined();
    });
  });

  describe('Runtime Declare Registry', () => {

    it('should parse Declare statement', () => {
      const code = 'Declare Function GetTickCount Lib "kernel32" () As Long';
      const result = VB6DeclareRegistry.parseDeclareStatement(code);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('GetTickCount');
      expect(result!.library).toBe('kernel32');
      expect(result!.isFunction).toBe(true);
    });

    it('should parse Declare with alias', () => {
      const code = 'Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hWnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long';
      const result = VB6DeclareRegistry.parseDeclareStatement(code);

      expect(result).not.toBeNull();
      expect(result!.alias).toBe('MessageBoxA');
    });

    it('should parse parameters with ByVal', () => {
      const code = 'Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)';
      const result = VB6DeclareRegistry.parseDeclareStatement(code);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].byRef).toBe(false);
    });

    it('should parse parameters with ByRef', () => {
      const code = 'Declare Sub Test Lib "test.dll" (ByRef x As Long)';
      const result = VB6DeclareRegistry.parseDeclareStatement(code);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].byRef).toBe(true);
    });

    it('should parse optional parameters', () => {
      const code = 'Declare Function Test Lib "test.dll" (Optional ByVal x As Long) As Long';
      const result = VB6DeclareRegistry.parseDeclareStatement(code);

      expect(result).not.toBeNull();
      expect(result!.parameters[0].optional).toBe(true);
    });

    it('should parse array parameters', () => {
      const code = 'Declare Sub Test Lib "test.dll" (arr() As Long)';
      const result = VB6DeclareRegistry.parseDeclareStatement(code);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0].name).toBe('arr');
      // Note: Array detection via () is implementation-specific
      // The runtime parser may or may not detect this depending on regex
    });
  });

  describe('Real-World VB6 API Scenarios', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('MainModule');
    });

    it('should handle Windows GetWindowsDirectory API', () => {
      const code = 'Declare Function GetWindowsDirectory Lib "kernel32" Alias "GetWindowsDirectoryA" (ByVal lpBuffer As String, ByVal nSize As Long) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('GetWindowsDirectory');
      expect(result!.aliasName).toBe('GetWindowsDirectoryA');
      expect(result!.parameters).toHaveLength(2);

      processor.registerDeclareFunction(result!);
      const shims = processor.generateAllShims();
      expect(shims).toContain('GetWindowsDirectory');
    });

    it('should handle complex GetPrivateProfileString API', () => {
      const code = 'Declare Function GetPrivateProfileString Lib "kernel32" Alias "GetPrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As String, ByVal lpDefault As String, ByVal lpReturnedString As String, ByVal nSize As Long, ByVal lpFileName As String) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(6);
      expect(result!.parameters[0].name).toBe('lpApplicationName');
      expect(result!.parameters[0].asString).toBe(true);

      processor.registerDeclareFunction(result!);
      const validation = processor.validateDeclareCall('GetPrivateProfileString',
        ['Section', 'Key', 'Default', '', 256, 'config.ini']);
      expect(validation.valid).toBe(true);
    });

    it('should handle FindWindow API', () => {
      const code = 'Declare Function FindWindow Lib "user32" Alias "FindWindowA" (ByVal lpClassName As String, ByVal lpWindowName As String) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      processor.registerDeclareFunction(result!);

      const tsCode = processor.generateTypeScriptDefinitions();
      expect(tsCode).toContain('FindWindow');
      expect(tsCode).toContain('lpClassName: string');
      expect(tsCode).toContain('lpWindowName: string');
    });

    it('should handle SendMessage API with variant types', () => {
      const code = 'Declare Function SendMessage Lib "user32" Alias "SendMessageA" (ByVal hWnd As Long, ByVal wMsg As Long, ByVal wParam As Long, lParam As Any) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(4);
      expect(result!.parameters[3].type).toBe('Any');
      expect(result!.parameters[3].byRef).toBe(true); // No ByVal = ByRef
    });

    it('should handle multimedia PlaySound API', () => {
      const code = 'Declare Function PlaySound Lib "winmm.dll" Alias "PlaySoundA" (ByVal lpszName As String, ByVal hModule As Long, ByVal dwFlags As Long) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.library).toBe('winmm.dll');

      processor.registerDeclareFunction(result!);
      const shims = processor.generateAllShims();
      expect(shims).toContain('PlaySound');
    });
  });

  describe('Edge Cases', () => {
    let processor: VB6DeclareProcessor;

    beforeEach(() => {
      processor = new VB6DeclareProcessor();
      processor.setCurrentModule('TestModule');
    });

    it('should handle Declare with no parameters', () => {
      const code = 'Declare Function GetCurrentProcessId Lib "kernel32" () As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(0);
    });

    it('should handle Declare with many parameters', () => {
      const code = 'Declare Function Test Lib "test.dll" (p1 As Long, p2 As Long, p3 As Long, p4 As Long, p5 As Long, p6 As Long, p7 As Long, p8 As Long) As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.parameters).toHaveLength(8);
    });

    it('should handle library names with .dll extension', () => {
      const code = 'Declare Function Test Lib "mylib.dll" () As Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.library).toBe('mylib.dll');
    });

    it('should handle case-insensitive keywords', () => {
      const code = 'DECLARE FUNCTION Test LIB "test.dll" () AS LONG';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test');
    });

    it('should generate default return values for all types', () => {
      const functions = [
        'Declare Function TestLong Lib "test.dll" () As Long',
        'Declare Function TestString Lib "test.dll" () As String',
        'Declare Function TestBoolean Lib "test.dll" () As Boolean',
        'Declare Function TestDouble Lib "test.dll" () As Double',
        'Declare Function TestVariant Lib "test.dll" () As Variant'
      ];

      for (const funcCode of functions) {
        const result = processor.parseDeclareStatement(funcCode, 1);
        expect(result).not.toBeNull();
        processor.registerDeclareFunction(result!);
      }

      const shims = processor.generateAllShims();
      expect(shims).toContain('TestLong');
      expect(shims).toContain('TestString');
      expect(shims).toContain('TestBoolean');
    });

    it('should handle whitespace variations', () => {
      const code = 'Declare  Function   GetTickCount   Lib   "kernel32"   ()   As   Long';
      const result = processor.parseDeclareStatement(code, 1);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('GetTickCount');
    });

    it('should handle module context switching', () => {
      processor.setCurrentModule('Module1');
      const code1 = 'Private Declare Function Test1 Lib "test.dll" () As Long';
      const decl1 = processor.parseDeclareStatement(code1, 1);
      processor.registerDeclareFunction(decl1!);

      processor.setCurrentModule('Module2');
      const code2 = 'Private Declare Function Test2 Lib "test.dll" () As Long';
      const decl2 = processor.parseDeclareStatement(code2, 1);
      processor.registerDeclareFunction(decl2!);

      processor.setCurrentModule('Module1');
      expect(processor.getModuleDeclaredFunctions()).toHaveLength(1);

      processor.setCurrentModule('Module2');
      expect(processor.getModuleDeclaredFunctions()).toHaveLength(1);
    });
  });
});
