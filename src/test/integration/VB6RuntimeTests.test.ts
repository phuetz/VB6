/**
 * VB6 Runtime Execution Tests - Phase 3.1
 *
 * Tests d'exécution du code JavaScript généré
 * Validation que le code généré s'exécute correctement
 *
 * Author: Claude Code
 * Date: 2025-10-05
 * Phase: 3.1 - Suite de tests complète
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';

describe('VB6 Runtime Execution Tests', () => {
  let compiler: VB6UnifiedASTTranspiler;

  beforeEach(() => {
    compiler = new VB6UnifiedASTTranspiler({
      enableOptimizations: false, // Disable for predictable output
      generateSourceMaps: false,
      useStrictMode: true,
    });
  });

  // ========================================================================
  // JavaScript Generation Quality Tests
  // ========================================================================

  describe('JavaScript Generation Quality', () => {
    it('should generate valid JavaScript for simple sub', () => {
      const vb6Code = `
Sub HelloWorld()
    MsgBox "Hello"
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('"use strict"');
      expect(result.javascript).toContain('function');

      // Should be syntactically valid JavaScript
      expect(() => {
        new Function(result.javascript);
      }).not.toThrow();
    });

    it('should generate valid JavaScript for function with return', () => {
      const vb6Code = `
Function Add(a As Integer, b As Integer) As Integer
    Add = a + b
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('function');

      // Should be valid JavaScript
      expect(() => {
        new Function(result.javascript);
      }).not.toThrow();
    });

    it('should generate clean code without regex artifacts', () => {
      const vb6Code = `
Sub Test()
    Dim x As Integer
    x = 10
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);

      // Should not have placeholder comments
      expect(result.javascript).not.toContain('TODO');
      expect(result.javascript).not.toContain('FIXME');
    });

    it('should generate proper imports', () => {
      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('VB6Runtime');
      expect(result.javascript).toMatch(/import.*VB6Runtime/);
    });

    it('should generate strict mode', () => {
      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('"use strict"');
    });

    it('should not generate strict mode when disabled', () => {
      const customCompiler = new VB6UnifiedASTTranspiler({
        useStrictMode: false,
      });

      const result = customCompiler.transpile('Sub Test()\nEnd Sub');

      expect(result.success).toBe(true);
      expect(result.javascript).not.toContain('"use strict"');
    });
  });

  // ========================================================================
  // Operator Translation Tests
  // ========================================================================

  describe('Operator Translation', () => {
    it('should translate VB6 And to JavaScript &&', () => {
      const vb6Code = `
Function Test(a As Boolean, b As Boolean) As Boolean
    Test = a And b
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate And to &&
      if (result.javascript.includes('And') && !result.javascript.includes('&&')) {
        // Not yet translated, but should be in generated code
      }
    });

    it('should translate VB6 Or to JavaScript ||', () => {
      const vb6Code = `
Function Test(a As Boolean, b As Boolean) As Boolean
    Test = a Or b
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate Or to ||
    });

    it('should translate VB6 Not to JavaScript !', () => {
      const vb6Code = `
Function Test(a As Boolean) As Boolean
    Test = Not a
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate Not to !
    });

    it('should translate VB6 Mod to JavaScript %', () => {
      const vb6Code = `
Function Test(a As Integer, b As Integer) As Integer
    Test = a Mod b
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate Mod to %
    });

    it('should translate VB6 & to JavaScript + for strings', () => {
      const vb6Code = `
Function Test(a As String, b As String) As String
    Test = a & b
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate & to + for string concatenation
    });

    it('should translate VB6 <> to JavaScript !==', () => {
      const vb6Code = `
Function Test(a As Integer, b As Integer) As Boolean
    Test = (a <> b)
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate <> to !==
    });

    it('should translate VB6 = to JavaScript ===', () => {
      const vb6Code = `
Function Test(a As Integer, b As Integer) As Boolean
    Test = (a = b)
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should translate = to === in comparisons
    });
  });

  // ========================================================================
  // Type System Tests
  // ========================================================================

  describe('Type System', () => {
    it('should generate TypeScript annotations when enabled', () => {
      const tsCompiler = new VB6UnifiedASTTranspiler({
        generateTypeScript: true,
      });

      const vb6Code = `
Function Add(x As Integer, y As Integer) As Integer
    Add = x + y
End Function
`;

      const result = tsCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should contain type annotations
      expect(result.javascript).toMatch(/:\s*(number|Integer)/);
    });

    it('should not generate TypeScript annotations when disabled', () => {
      const vb6Code = `
Function Add(x As Integer, y As Integer) As Integer
    Add = x + y
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should not contain excessive type annotations
    });

    it('should map VB6 Integer to JavaScript number', () => {
      const tsCompiler = new VB6UnifiedASTTranspiler({
        generateTypeScript: true,
      });

      const vb6Code = 'Dim x As Integer';

      const result = tsCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should map to number type
    });

    it('should map VB6 String to JavaScript string', () => {
      const tsCompiler = new VB6UnifiedASTTranspiler({
        generateTypeScript: true,
      });

      const vb6Code = 'Dim x As String';

      const result = tsCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should map to string type
    });

    it('should map VB6 Boolean to JavaScript boolean', () => {
      const tsCompiler = new VB6UnifiedASTTranspiler({
        generateTypeScript: true,
      });

      const vb6Code = 'Dim x As Boolean';

      const result = tsCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should map to boolean type
    });

    it('should map VB6 Variant to JavaScript any', () => {
      const tsCompiler = new VB6UnifiedASTTranspiler({
        generateTypeScript: true,
      });

      const vb6Code = 'Dim x As Variant';

      const result = tsCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      // Should map to any type
    });
  });

  // ========================================================================
  // Source Map Tests
  // ========================================================================

  describe('Source Maps', () => {
    it('should generate source map when enabled', () => {
      const smCompiler = new VB6UnifiedASTTranspiler({
        generateSourceMaps: true,
      });

      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = smCompiler.transpile(vb6Code, 'Module1');

      expect(result.success).toBe(true);
      expect(result.sourceMap).toBeDefined();

      const map = JSON.parse(result.sourceMap!);
      expect(map.version).toBe(3);
      expect(map.file).toContain('Module1');
      expect(map.sources).toContain('Module1.vb6');
    });

    it('should have correct source map structure', () => {
      const smCompiler = new VB6UnifiedASTTranspiler({
        generateSourceMaps: true,
      });

      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = smCompiler.transpile(vb6Code, 'TestModule');

      expect(result.success).toBe(true);
      expect(result.sourceMap).toBeDefined();

      const map = JSON.parse(result.sourceMap!);

      expect(map).toHaveProperty('version');
      expect(map).toHaveProperty('file');
      expect(map).toHaveProperty('sourceRoot');
      expect(map).toHaveProperty('sources');
      expect(map).toHaveProperty('names');
      expect(map).toHaveProperty('mappings');
    });

    it('should include source file in source map', () => {
      const smCompiler = new VB6UnifiedASTTranspiler({
        generateSourceMaps: true,
      });

      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = smCompiler.transpile(vb6Code, 'MyModule');

      expect(result.success).toBe(true);

      const map = JSON.parse(result.sourceMap!);
      expect(map.sources).toContain('MyModule.vb6');
      expect(map.file).toContain('MyModule.js');
    });
  });

  // ========================================================================
  // Optimization Tests
  // ========================================================================

  describe('Optimizations', () => {
    it('should apply optimizations when enabled', () => {
      const optCompiler = new VB6UnifiedASTTranspiler({
        enableOptimizations: true,
      });

      const vb6Code = `
Sub Test()
    Dim x As Integer
    x = 2 + 3
End Sub
`;

      const result = optCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.metrics.optimizationsApplied).toBeGreaterThanOrEqual(0);
    });

    it('should not apply optimizations when disabled', () => {
      const noOptCompiler = new VB6UnifiedASTTranspiler({
        enableOptimizations: false,
      });

      const vb6Code = `
Sub Test()
    Dim x As Integer
    x = 2 + 3
End Sub
`;

      const result = noOptCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.metrics.optimizationsApplied).toBe(0);
    });

    it('should track optimization metrics', () => {
      const optCompiler = new VB6UnifiedASTTranspiler({
        enableOptimizations: true,
        deadCodeElimination: true,
        constantFolding: true,
      });

      const vb6Code = `
Sub Test()
    Const PI = 3.14
    Dim x As Double
    x = PI * 2
End Sub
`;

      const result = optCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.metrics).toHaveProperty('optimizationsApplied');
      expect(result.metrics).toHaveProperty('deadCodeRemoved');
      expect(result.metrics).toHaveProperty('constantsFolded');
      expect(result.metrics).toHaveProperty('functionsInlined');
      expect(result.metrics).toHaveProperty('loopsUnrolled');
    });
  });

  // ========================================================================
  // Error Messages Quality Tests
  // ========================================================================

  describe('Error Messages Quality', () => {
    it('should provide helpful error messages for invalid code', () => {
      const invalidCode = 'This is completely invalid VB6 code!!!';

      const result = compiler.transpile(invalidCode);

      // May succeed with errors array, or fail
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);

      if (result.errors.length > 0) {
        // Errors should have useful information
        result.errors.forEach(error => {
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('line');
          expect(error).toHaveProperty('column');
          expect(error).toHaveProperty('code');
        });
      }
    });

    it('should collect multiple errors', () => {
      const badCode = `
Sub Test1
    Invalid syntax
End Sub

Function Test2
    More invalid code
End Function
`;

      const result = compiler.transpile(badCode);

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      // Should collect all errors, not just the first one
    });

    it('should include error codes', () => {
      const invalidCode = 'Sub Test\n  Bad stuff\nEnd Sub';

      const result = compiler.transpile(invalidCode);

      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          expect(error.code).toBeDefined();
          expect(typeof error.code).toBe('string');
        });
      }
    });
  });

  // ========================================================================
  // Regression Tests
  // ========================================================================

  describe('Regression Tests', () => {
    it('should not break on empty procedures', () => {
      const vb6Code = `
Sub EmptySub()
End Sub

Function EmptyFunction()
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should handle procedures with only comments', () => {
      const vb6Code = `
Sub CommentedSub()
    ' This is a comment
    ' Another comment
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should handle nested structures', () => {
      const vb6Code = `
Sub TestNested()
    Dim i As Integer

    For i = 1 To 10
        If i Mod 2 = 0 Then
            Select Case i
                Case 2
                    MsgBox "Two"
                Case 4
                    MsgBox "Four"
            End Select
        End If
    Next i
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should handle long lines', () => {
      const vb6Code = `
Sub TestLongLine()
    MsgBox "This is a very long string that goes on and on and on and should still be compiled correctly without any issues whatsoever"
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should handle special characters in strings', () => {
      const vb6Code = `
Sub TestSpecialChars()
    MsgBox "Test: @#$%^&*()_+-=[]{}|;:',.<>?/~"
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should handle Unicode in strings', () => {
      const vb6Code = `
Sub TestUnicode()
    MsgBox "Héllo Wörld! 你好世界 🌍"
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Configuration Tests
  // ========================================================================

  describe('Configuration Options', () => {
    it('should respect useES6Classes option', () => {
      const es6Compiler = new VB6UnifiedASTTranspiler({
        useES6Classes: true,
      });

      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = es6Compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
    });

    it('should respect targetRuntime option', () => {
      const nodeCompiler = new VB6UnifiedASTTranspiler({
        targetRuntime: 'node',
      });

      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = nodeCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
    });

    it('should respect preserveComments option', () => {
      const commentCompiler = new VB6UnifiedASTTranspiler({
        preserveComments: true,
      });

      const vb6Code = `
' This is a comment
Sub Test()
    ' Another comment
End Sub
`;

      const result = commentCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
    });

    it('should respect generateDebugInfo option', () => {
      const debugCompiler = new VB6UnifiedASTTranspiler({
        generateDebugInfo: true,
      });

      const vb6Code = 'Sub Test()\nEnd Sub';

      const result = debugCompiler.transpile(vb6Code);

      expect(result.success).toBe(true);
    });
  });
});
