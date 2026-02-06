import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VB6Lexer } from '../../utils/vb6Lexer';
import { VB6Parser } from '../../utils/vb6Parser';
import { VB6SemanticAnalyzer } from '../../utils/vb6SemanticAnalyzer';

describe('VB6 Parser and Lexer Tests', () => {
  let lexer: VB6Lexer;
  let parser: VB6Parser;
  let analyzer: VB6SemanticAnalyzer;

  beforeEach(() => {
    lexer = new VB6Lexer();
    parser = new VB6Parser();
    analyzer = new VB6SemanticAnalyzer();
  });

  describe('VB6 Lexer Tests', () => {
    describe('Token Recognition', () => {
      it('should tokenize keywords', () => {
        const code = 'Public Sub Private Function End If Then Else';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Public' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Sub' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Private' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Function' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'End' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'If' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Then' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Else' });
      });

      it('should tokenize identifiers', () => {
        const code = 'myVariable userName123 _privateVar';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'myVariable' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'userName123' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: '_privateVar' });
      });

      it('should tokenize numbers', () => {
        const code = '42 3.14 -10 1.5E10 &HFF &O77';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'NUMBER', value: '42' });
        expect(tokens).toContainEqual({ type: 'NUMBER', value: '3.14' });
        expect(tokens).toContainEqual({ type: 'NUMBER', value: '-10' });
        expect(tokens).toContainEqual({ type: 'NUMBER', value: '1.5E10' });
        expect(tokens).toContainEqual({ type: 'HEX', value: '&HFF' });
        expect(tokens).toContainEqual({ type: 'OCTAL', value: '&O77' });
      });

      it('should tokenize strings', () => {
        const code = '"Hello World" "With ""quotes""" ""';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'STRING', value: '"Hello World"' });
        expect(tokens).toContainEqual({ type: 'STRING', value: '"With ""quotes"""' });
        expect(tokens).toContainEqual({ type: 'STRING', value: '""' });
      });

      it('should tokenize operators', () => {
        const code = '+ - * / \\ Mod ^ = <> < > <= >= And Or Not Xor';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '+' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '-' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '*' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '/' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '\\' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: 'Mod' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '^' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '=' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '<>' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '<' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '>' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '<=' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: '>=' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: 'And' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: 'Or' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: 'Not' });
        expect(tokens).toContainEqual({ type: 'OPERATOR', value: 'Xor' });
      });

      it('should tokenize delimiters', () => {
        const code = '( ) [ ] { } , . : ;';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'LPAREN', value: '(' });
        expect(tokens).toContainEqual({ type: 'RPAREN', value: ')' });
        expect(tokens).toContainEqual({ type: 'LBRACKET', value: '[' });
        expect(tokens).toContainEqual({ type: 'RBRACKET', value: ']' });
        expect(tokens).toContainEqual({ type: 'LBRACE', value: '{' });
        expect(tokens).toContainEqual({ type: 'RBRACE', value: '}' });
        expect(tokens).toContainEqual({ type: 'COMMA', value: ',' });
        expect(tokens).toContainEqual({ type: 'DOT', value: '.' });
        expect(tokens).toContainEqual({ type: 'COLON', value: ':' });
        expect(tokens).toContainEqual({ type: 'SEMICOLON', value: ';' });
      });

      it('should handle comments', () => {
        const code = `
          ' This is a comment
          Dim x As Integer ' Inline comment
          REM This is also a comment
          x = 10
        `;
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'COMMENT', value: "' This is a comment" });
        expect(tokens).toContainEqual({ type: 'COMMENT', value: "' Inline comment" });
        expect(tokens).toContainEqual({ type: 'COMMENT', value: 'REM This is also a comment' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'x' });
      });

      it('should handle line continuations', () => {
        const code = `
          Dim longVariable As String = _
            "This is a long string " & _
            "that continues on multiple lines"
        `;
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'LINE_CONTINUATION', value: '_' });
        expect(tokens.filter(t => t.type === 'LINE_CONTINUATION')).toHaveLength(2);
      });

      it('should handle dates', () => {
        const code = '#1/1/2024# #12/31/2023 11:59:59 PM#';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'DATE', value: '#1/1/2024#' });
        expect(tokens).toContainEqual({ type: 'DATE', value: '#12/31/2023 11:59:59 PM#' });
      });

      it('should handle type suffixes', () => {
        const code = 'myInt% myLong& mySingle! myDouble# myString$ myCurrency@';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'myInt', suffix: '%' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'myLong', suffix: '&' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'mySingle', suffix: '!' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'myDouble', suffix: '#' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'myString', suffix: '$' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'myCurrency', suffix: '@' });
      });
    });

    describe('Error Handling', () => {
      it('should report unterminated strings', () => {
        const code = '"unterminated string';

        expect(() => lexer.tokenize(code)).toThrow('Unterminated string');
      });

      it('should report invalid characters', () => {
        const code = 'valid £invalid';

        expect(() => lexer.tokenize(code)).toThrow('Invalid character: £');
      });

      it('should track line and column numbers', () => {
        const code = `Line1
Line2
  Error Here §`;

        try {
          lexer.tokenize(code);
        } catch (error: any) {
          expect(error.line).toBe(3);
          expect(error.column).toBeGreaterThan(0);
        }
      });
    });

    describe('Special Cases', () => {
      it('should handle array declarations', () => {
        const code = 'Dim arr(10) As Integer';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Dim' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'arr' });
        expect(tokens).toContainEqual({ type: 'LPAREN', value: '(' });
        expect(tokens).toContainEqual({ type: 'NUMBER', value: '10' });
        expect(tokens).toContainEqual({ type: 'RPAREN', value: ')' });
      });

      it('should handle property procedures', () => {
        const code = 'Property Get Value() As Integer';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Property' });
        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'Get' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'Value' });
      });

      it('should handle with blocks', () => {
        const code = 'With obj\n  .Property = value\nEnd With';
        const tokens = lexer.tokenize(code);

        expect(tokens).toContainEqual({ type: 'KEYWORD', value: 'With' });
        expect(tokens).toContainEqual({ type: 'DOT', value: '.' });
        expect(tokens).toContainEqual({ type: 'IDENTIFIER', value: 'Property' });
      });
    });
  });

  describe('VB6 Parser Tests', () => {
    describe('Declaration Parsing', () => {
      it('should parse variable declarations', () => {
        const tokens = lexer.tokenize('Dim x As Integer');
        const ast = parser.parse(tokens);

        expect(ast.type).toBe('Program');
        expect(ast.body[0].type).toBe('VariableDeclaration');
        expect(ast.body[0].name).toBe('x');
        expect(ast.body[0].dataType).toBe('Integer');
      });

      it('should parse multiple variable declarations', () => {
        const tokens = lexer.tokenize('Dim x As Integer, y As String, z');
        const ast = parser.parse(tokens);

        expect(ast.body[0].declarations).toHaveLength(3);
        expect(ast.body[0].declarations[0].name).toBe('x');
        expect(ast.body[0].declarations[1].name).toBe('y');
        expect(ast.body[0].declarations[2].name).toBe('z');
        expect(ast.body[0].declarations[2].dataType).toBe('Variant');
      });

      it('should parse array declarations', () => {
        const tokens = lexer.tokenize('Dim arr(10) As Integer');
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('ArrayDeclaration');
        expect(ast.body[0].dimensions[0]).toBe(10);
      });

      it('should parse constant declarations', () => {
        const tokens = lexer.tokenize('Const PI As Double = 3.14159');
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('ConstantDeclaration');
        expect(ast.body[0].name).toBe('PI');
        expect(ast.body[0].value).toBe(3.14159);
      });

      it('should parse type declarations', () => {
        const code = `
          Type Person
            Name As String
            Age As Integer
          End Type
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('TypeDeclaration');
        expect(ast.body[0].name).toBe('Person');
        expect(ast.body[0].fields).toHaveLength(2);
      });

      it('should parse enum declarations', () => {
        const code = `
          Enum Colors
            Red = 1
            Green = 2
            Blue = 3
          End Enum
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('EnumDeclaration');
        expect(ast.body[0].name).toBe('Colors');
        expect(ast.body[0].members).toHaveLength(3);
      });
    });

    describe('Function and Subroutine Parsing', () => {
      it('should parse subroutines', () => {
        const code = `
          Public Sub MySub(x As Integer, y As String)
            Debug.Print x
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('SubroutineDeclaration');
        expect(ast.body[0].name).toBe('MySub');
        expect(ast.body[0].visibility).toBe('Public');
        expect(ast.body[0].parameters).toHaveLength(2);
      });

      it('should parse functions', () => {
        const code = `
          Private Function Add(a As Integer, b As Integer) As Integer
            Add = a + b
          End Function
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('FunctionDeclaration');
        expect(ast.body[0].name).toBe('Add');
        expect(ast.body[0].returnType).toBe('Integer');
        expect(ast.body[0].body[0].type).toBe('Assignment');
      });

      it('should parse optional parameters', () => {
        const code = 'Sub Test(Optional x As Integer = 10)';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].parameters[0].optional).toBe(true);
        expect(ast.body[0].parameters[0].defaultValue).toBe(10);
      });

      it('should parse ByVal and ByRef parameters', () => {
        const code = 'Sub Test(ByVal x As Integer, ByRef y As String)';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].parameters[0].passingMode).toBe('ByVal');
        expect(ast.body[0].parameters[1].passingMode).toBe('ByRef');
      });

      it('should parse ParamArray parameters', () => {
        const code = 'Sub Test(ParamArray args() As Variant)';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].parameters[0].isParamArray).toBe(true);
      });
    });

    describe('Control Flow Parsing', () => {
      it('should parse if-then-else statements', () => {
        const code = `
          If x > 10 Then
            y = 1
          ElseIf x > 5 Then
            y = 2
          Else
            y = 3
          End If
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('IfStatement');
        expect(ast.body[0].condition.type).toBe('BinaryExpression');
        expect(ast.body[0].elseIf).toHaveLength(1);
        expect(ast.body[0].else).toBeDefined();
      });

      it('should parse single-line if statements', () => {
        const code = 'If x > 10 Then y = 1 Else y = 2';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('IfStatement');
        expect(ast.body[0].singleLine).toBe(true);
      });

      it('should parse select case statements', () => {
        const code = `
          Select Case x
            Case 1, 2, 3
              y = "Low"
            Case 4 To 6
              y = "Medium"
            Case Is > 6
              y = "High"
            Case Else
              y = "Unknown"
          End Select
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('SelectStatement');
        expect(ast.body[0].cases).toHaveLength(4);
        expect(ast.body[0].cases[0].values).toEqual([1, 2, 3]);
        expect(ast.body[0].cases[1].range).toEqual({ from: 4, to: 6 });
        expect(ast.body[0].cases[2].comparison).toBe('>');
      });

      it('should parse for loops', () => {
        const code = `
          For i = 1 To 10 Step 2
            Debug.Print i
          Next i
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('ForLoop');
        expect(ast.body[0].variable).toBe('i');
        expect(ast.body[0].start).toBe(1);
        expect(ast.body[0].end).toBe(10);
        expect(ast.body[0].step).toBe(2);
      });

      it('should parse for each loops', () => {
        const code = `
          For Each item In collection
            Debug.Print item
          Next
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('ForEachLoop');
        expect(ast.body[0].variable).toBe('item');
        expect(ast.body[0].collection).toBe('collection');
      });

      it('should parse while loops', () => {
        const code = `
          While x < 10
            x = x + 1
          Wend
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('WhileLoop');
        expect(ast.body[0].condition.type).toBe('BinaryExpression');
      });

      it('should parse do loops', () => {
        const code1 = `
          Do While x < 10
            x = x + 1
          Loop
        `;
        const code2 = `
          Do
            x = x + 1
          Loop Until x >= 10
        `;

        const ast1 = parser.parse(lexer.tokenize(code1));
        const ast2 = parser.parse(lexer.tokenize(code2));

        expect(ast1.body[0].type).toBe('DoLoop');
        expect(ast1.body[0].testPosition).toBe('beginning');
        expect(ast1.body[0].testType).toBe('While');

        expect(ast2.body[0].type).toBe('DoLoop');
        expect(ast2.body[0].testPosition).toBe('end');
        expect(ast2.body[0].testType).toBe('Until');
      });
    });

    describe('Expression Parsing', () => {
      it('should parse binary expressions', () => {
        const code = 'x = 10 + 20 * 30';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('Assignment');
        expect(ast.body[0].value.type).toBe('BinaryExpression');
        expect(ast.body[0].value.operator).toBe('+');
        expect(ast.body[0].value.right.operator).toBe('*');
      });

      it('should respect operator precedence', () => {
        const code = 'x = 1 + 2 * 3 ^ 4';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        // Should parse as: 1 + (2 * (3 ^ 4))
        const expr = ast.body[0].value;
        expect(expr.operator).toBe('+');
        expect(expr.right.operator).toBe('*');
        expect(expr.right.right.operator).toBe('^');
      });

      it('should parse unary expressions', () => {
        const code = 'x = -10 + Not flag';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        const expr = ast.body[0].value;
        expect(expr.left.type).toBe('UnaryExpression');
        expect(expr.left.operator).toBe('-');
        expect(expr.right.type).toBe('UnaryExpression');
        expect(expr.right.operator).toBe('Not');
      });

      it('should parse function calls', () => {
        const code = 'result = Calculate(10, 20, "test")';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        const call = ast.body[0].value;
        expect(call.type).toBe('CallExpression');
        expect(call.name).toBe('Calculate');
        expect(call.arguments).toHaveLength(3);
      });

      it('should parse member access', () => {
        const code = 'value = obj.Property.SubProperty';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        const access = ast.body[0].value;
        expect(access.type).toBe('MemberExpression');
        expect(access.property).toBe('SubProperty');
        expect(access.object.property).toBe('Property');
        expect(access.object.object).toBe('obj');
      });

      it('should parse array access', () => {
        const code = 'value = arr(10, 20)';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        const access = ast.body[0].value;
        expect(access.type).toBe('ArrayAccess');
        expect(access.array).toBe('arr');
        expect(access.indices).toEqual([10, 20]);
      });

      it('should parse string concatenation', () => {
        const code = 'text = "Hello" & " " & "World"';
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        const expr = ast.body[0].value;
        expect(expr.type).toBe('BinaryExpression');
        expect(expr.operator).toBe('&');
      });
    });

    describe('Class and Module Parsing', () => {
      it('should parse class declarations', () => {
        const code = `
          Public Class MyClass
            Private m_Value As Integer
            
            Public Property Get Value() As Integer
              Value = m_Value
            End Property
            
            Public Sub Method()
              ' Implementation
            End Sub
          End Class
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].type).toBe('ClassDeclaration');
        expect(ast.body[0].name).toBe('MyClass');
        expect(ast.body[0].members).toHaveLength(3);
      });

      it('should parse module declarations', () => {
        const code = `
          Attribute VB_Name = "Module1"
          Option Explicit
          
          Public Const VERSION = "1.0"
          
          Public Sub Main()
            ' Entry point
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.attributes).toContainEqual({
          name: 'VB_Name',
          value: 'Module1',
        });
        expect(ast.options).toContain('Explicit');
      });

      it('should parse implements statements', () => {
        const code = `
          Class MyClass
            Implements IInterface
            
            Private Sub IInterface_Method()
              ' Implementation
            End Sub
          End Class
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);

        expect(ast.body[0].implements).toContain('IInterface');
      });
    });

    describe('Error Recovery', () => {
      it('should recover from missing End statements', () => {
        const code = `
          Sub Test()
            x = 10
          ' Missing End Sub
          
          Sub Another()
            y = 20
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parseWithRecovery(tokens);

        expect(ast.errors).toHaveLength(1);
        expect(ast.errors[0].message).toContain('Missing End Sub');
        expect(ast.body).toHaveLength(2); // Still parsed both subs
      });

      it('should recover from syntax errors', () => {
        const code = `
          Dim x As Integer
          x = = 10  ' Double equals
          y = 20
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parseWithRecovery(tokens);

        expect(ast.errors).toHaveLength(1);
        expect(ast.body).toHaveLength(3); // All statements parsed
      });

      it('should provide helpful error messages', () => {
        const code = 'If x > 10';
        const tokens = lexer.tokenize(code);

        try {
          parser.parse(tokens);
        } catch (error: any) {
          expect(error.message).toContain('Expected Then');
          expect(error.line).toBeDefined();
          expect(error.column).toBeDefined();
        }
      });
    });
  });

  describe('VB6 Semantic Analyzer Tests', () => {
    describe('Type Checking', () => {
      it('should check type compatibility', () => {
        const code = `
          Dim x As Integer
          Dim y As String
          x = y  ' Type mismatch
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toContainEqual(
          expect.objectContaining({
            type: 'TypeMismatch',
            message: expect.stringContaining('Cannot assign String to Integer'),
          })
        );
      });

      it('should handle implicit conversions', () => {
        const code = `
          Dim x As Double
          Dim y As Integer
          x = y  ' Valid: Integer to Double
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toHaveLength(0);
      });

      it('should check function return types', () => {
        const code = `
          Function GetNumber() As Integer
            GetNumber = "text"  ' Type mismatch
          End Function
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toContainEqual(
          expect.objectContaining({
            type: 'TypeMismatch',
            message: expect.stringContaining('Function must return Integer'),
          })
        );
      });

      it('should validate array dimensions', () => {
        const code = `
          Dim arr(10) As Integer
          arr(10, 20) = 5  ' Too many dimensions
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toContainEqual(
          expect.objectContaining({
            type: 'DimensionMismatch',
            message: expect.stringContaining('Expected 1 dimension'),
          })
        );
      });
    });

    describe('Scope Analysis', () => {
      it('should detect undefined variables', () => {
        const code = `
          Option Explicit
          Sub Test()
            x = 10  ' Undefined
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toContainEqual(
          expect.objectContaining({
            type: 'UndefinedVariable',
            message: expect.stringContaining('Variable x is not defined'),
          })
        );
      });

      it('should track variable scope', () => {
        const code = `
          Sub Test()
            Dim x As Integer
          End Sub
          
          Sub Another()
            x = 10  ' Out of scope
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toContainEqual(
          expect.objectContaining({
            type: 'UndefinedVariable',
          })
        );
      });

      it('should handle module-level variables', () => {
        const code = `
          Private m_Value As Integer
          
          Sub SetValue(v As Integer)
            m_Value = v  ' Valid
          End Sub
          
          Function GetValue() As Integer
            GetValue = m_Value  ' Valid
          End Function
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toHaveLength(0);
      });

      it('should detect duplicate declarations', () => {
        const code = `
          Dim x As Integer
          Dim x As String  ' Duplicate
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const errors = analyzer.analyze(ast);

        expect(errors).toContainEqual(
          expect.objectContaining({
            type: 'DuplicateDeclaration',
            message: expect.stringContaining('x is already declared'),
          })
        );
      });
    });

    describe('Control Flow Analysis', () => {
      it('should detect unreachable code', () => {
        const code = `
          Sub Test()
            Exit Sub
            x = 10  ' Unreachable
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const warnings = analyzer.analyze(ast, { includeWarnings: true });

        expect(warnings).toContainEqual(
          expect.objectContaining({
            type: 'UnreachableCode',
            severity: 'warning',
          })
        );
      });

      it('should validate loop variables', () => {
        const code = `
          For i = 1 To 10
            i = 5  ' Modifying loop variable
          Next i
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const warnings = analyzer.analyze(ast, { includeWarnings: true });

        expect(warnings).toContainEqual(
          expect.objectContaining({
            type: 'LoopVariableModified',
            severity: 'warning',
          })
        );
      });

      it('should check function paths return values', () => {
        const code = `
          Function Test(x As Integer) As Integer
            If x > 0 Then
              Test = x
            End If
            ' Missing return for else case
          End Function
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const warnings = analyzer.analyze(ast, { includeWarnings: true });

        expect(warnings).toContainEqual(
          expect.objectContaining({
            type: 'MissingReturn',
            message: expect.stringContaining('Not all paths return a value'),
          })
        );
      });
    });

    describe('Best Practices', () => {
      it('should warn about implicit variants', () => {
        const code = `
          Dim x  ' No type specified
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const warnings = analyzer.analyze(ast, { includeWarnings: true });

        expect(warnings).toContainEqual(
          expect.objectContaining({
            type: 'ImplicitVariant',
            severity: 'warning',
            message: expect.stringContaining('Consider specifying a type'),
          })
        );
      });

      it('should suggest Option Explicit', () => {
        const code = `
          Sub Test()
            x = 10  ' Implicit declaration
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const warnings = analyzer.analyze(ast, { includeWarnings: true });

        expect(warnings).toContainEqual(
          expect.objectContaining({
            type: 'MissingOptionExplicit',
            severity: 'warning',
          })
        );
      });

      it('should detect unused variables', () => {
        const code = `
          Sub Test()
            Dim unused As Integer
            Dim used As Integer
            used = 10
            Debug.Print used
          End Sub
        `;
        const tokens = lexer.tokenize(code);
        const ast = parser.parse(tokens);
        const warnings = analyzer.analyze(ast, { includeWarnings: true });

        expect(warnings).toContainEqual(
          expect.objectContaining({
            type: 'UnusedVariable',
            message: expect.stringContaining('unused'),
          })
        );
      });
    });
  });
});
