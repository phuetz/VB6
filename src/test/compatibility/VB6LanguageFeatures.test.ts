import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';

/**
 * VB6 Language Features Compatibility Tests
 *
 * Tests all 50+ VB6 language constructs for complete compatibility
 *
 * Categories:
 * - Control Flow (If, Select, For, While, Do, etc.)
 * - Variable Declarations (Dim, Public, Private, Static, ReDim)
 * - Procedures (Sub, Function, Property)
 * - Classes and Objects
 * - Error Handling
 * - File I/O
 * - User-Defined Types and Enums
 * - Operators
 * - Special Statements
 */

describe('VB6 Language Features Compatibility', () => {
  let transpiler: VB6UnifiedASTTranspiler;

  beforeEach(() => {
    transpiler = new VB6UnifiedASTTranspiler({
      strict: true,
      generateTypeScript: false,
      generateSourceMaps: false,
      optimize: false,
      runtimeTarget: 'es2015'
    });
  });

  describe('Control Flow - If Statements', () => {
    it('should compile simple If statement', () => {
      const vb6Code = `
Sub TestIf()
    Dim x As Integer
    x = 10
    If x > 5 Then
        MsgBox "Greater"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'IfTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('if');
    });

    it('should compile If-Else statement', () => {
      const vb6Code = `
Sub TestIfElse()
    Dim x As Integer
    x = 3
    If x > 5 Then
        MsgBox "Greater"
    Else
        MsgBox "Less or Equal"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'IfElseTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('if');
      expect(result.javascript).toContain('else');
    });

    it('should compile If-ElseIf-Else statement', () => {
      const vb6Code = `
Sub TestIfElseIf()
    Dim x As Integer
    x = 5
    If x > 10 Then
        MsgBox "Greater than 10"
    ElseIf x > 5 Then
        MsgBox "Greater than 5"
    ElseIf x = 5 Then
        MsgBox "Equal to 5"
    Else
        MsgBox "Less than 5"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'IfElseIfTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('if');
      expect(result.javascript).toContain('else if');
    });

    it('should compile single-line If statement', () => {
      const vb6Code = `
Sub TestSingleLineIf()
    Dim x As Integer
    x = 10
    If x > 5 Then MsgBox "Greater"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SingleLineIfTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('if');
    });

    it('should compile single-line If-Else statement', () => {
      const vb6Code = `
Sub TestSingleLineIfElse()
    Dim x As Integer
    x = 10
    If x > 5 Then MsgBox "Greater" Else MsgBox "Less or Equal"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SingleLineIfElseTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('if');
    });

    it('should compile nested If statements', () => {
      const vb6Code = `
Sub TestNestedIf()
    Dim x As Integer, y As Integer
    x = 10
    y = 20
    If x > 5 Then
        If y > 15 Then
            MsgBox "Both conditions true"
        End If
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NestedIfTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Control Flow - Select Case', () => {
    it('should compile basic Select Case', () => {
      const vb6Code = `
Sub TestSelectCase()
    Dim x As Integer
    x = 2
    Select Case x
        Case 1
            MsgBox "One"
        Case 2
            MsgBox "Two"
        Case 3
            MsgBox "Three"
        Case Else
            MsgBox "Other"
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SelectCaseTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('switch');
    });

    it('should compile Select Case with ranges', () => {
      const vb6Code = `
Sub TestSelectCaseRange()
    Dim x As Integer
    x = 15
    Select Case x
        Case 1 To 10
            MsgBox "1-10"
        Case 11 To 20
            MsgBox "11-20"
        Case Is > 20
            MsgBox "Over 20"
        Case Else
            MsgBox "Other"
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SelectCaseRangeTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Select Case with multiple values', () => {
      const vb6Code = `
Sub TestSelectCaseMultiple()
    Dim x As Integer
    x = 3
    Select Case x
        Case 1, 3, 5, 7, 9
            MsgBox "Odd"
        Case 2, 4, 6, 8, 10
            MsgBox "Even"
        Case Else
            MsgBox "Other"
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SelectCaseMultipleTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Select Case with string', () => {
      const vb6Code = `
Sub TestSelectCaseString()
    Dim s As String
    s = "Hello"
    Select Case s
        Case "Hello"
            MsgBox "Greeting"
        Case "Goodbye"
            MsgBox "Farewell"
        Case Else
            MsgBox "Unknown"
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SelectCaseStringTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Control Flow - For Loops', () => {
    it('should compile For Next loop', () => {
      const vb6Code = `
Sub TestForNext()
    Dim i As Integer
    For i = 1 To 10
        Debug.Print i
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ForNextTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('for');
    });

    it('should compile For Next with Step', () => {
      const vb6Code = `
Sub TestForNextStep()
    Dim i As Integer
    For i = 1 To 10 Step 2
        Debug.Print i
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ForNextStepTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile For Next with negative Step', () => {
      const vb6Code = `
Sub TestForNextNegativeStep()
    Dim i As Integer
    For i = 10 To 1 Step -1
        Debug.Print i
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ForNextNegativeStepTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile For Each loop', () => {
      const vb6Code = `
Sub TestForEach()
    Dim col As Collection
    Dim item As Variant
    Set col = New Collection
    col.Add "Item1"
    col.Add "Item2"
    For Each item In col
        Debug.Print item
    Next item
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ForEachTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile nested For loops', () => {
      const vb6Code = `
Sub TestNestedFor()
    Dim i As Integer, j As Integer
    For i = 1 To 3
        For j = 1 To 3
            Debug.Print i & "," & j
        Next j
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NestedForTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Control Flow - While and Do Loops', () => {
    it('should compile While Wend loop', () => {
      const vb6Code = `
Sub TestWhile()
    Dim i As Integer
    i = 1
    While i <= 10
        Debug.Print i
        i = i + 1
    Wend
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'WhileTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('while');
    });

    it('should compile Do While loop', () => {
      const vb6Code = `
Sub TestDoWhile()
    Dim i As Integer
    i = 1
    Do While i <= 10
        Debug.Print i
        i = i + 1
    Loop
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DoWhileTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Do Until loop', () => {
      const vb6Code = `
Sub TestDoUntil()
    Dim i As Integer
    i = 1
    Do Until i > 10
        Debug.Print i
        i = i + 1
    Loop
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DoUntilTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Do Loop While', () => {
      const vb6Code = `
Sub TestDoLoopWhile()
    Dim i As Integer
    i = 1
    Do
        Debug.Print i
        i = i + 1
    Loop While i <= 10
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DoLoopWhileTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Do Loop Until', () => {
      const vb6Code = `
Sub TestDoLoopUntil()
    Dim i As Integer
    i = 1
    Do
        Debug.Print i
        i = i + 1
    Loop Until i > 10
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DoLoopUntilTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Control Flow - Exit and End Statements', () => {
    it('should compile Exit For', () => {
      const vb6Code = `
Sub TestExitFor()
    Dim i As Integer
    For i = 1 To 10
        If i = 5 Then Exit For
        Debug.Print i
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ExitForTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('break');
    });

    it('should compile Exit Do', () => {
      const vb6Code = `
Sub TestExitDo()
    Dim i As Integer
    i = 1
    Do While i <= 10
        If i = 5 Then Exit Do
        Debug.Print i
        i = i + 1
    Loop
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ExitDoTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Exit Sub', () => {
      const vb6Code = `
Sub TestExitSub()
    Dim i As Integer
    i = 10
    If i = 10 Then Exit Sub
    MsgBox "This won't execute"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ExitSubTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('return');
    });

    it('should compile Exit Function', () => {
      const vb6Code = `
Function TestExitFunction() As Integer
    Dim i As Integer
    i = 10
    If i = 10 Then
        TestExitFunction = 42
        Exit Function
    End If
    TestExitFunction = 0
End Function
`;
      const result = transpiler.transpile(vb6Code, 'ExitFunctionTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Variable Declarations', () => {
    it('should compile Dim declaration', () => {
      const vb6Code = `
Sub TestDim()
    Dim x As Integer
    Dim s As String
    Dim d As Double
    x = 42
    s = "Hello"
    d = 3.14
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DimTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(
        result.javascript.includes('let') || result.javascript.includes('var')
      ).toBe(true);
    });

    it('should compile multiple declarations on one line', () => {
      const vb6Code = `
Sub TestMultipleDim()
    Dim x As Integer, y As Integer, z As Integer
    x = 1
    y = 2
    z = 3
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MultipleDimTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Public declaration', () => {
      const vb6Code = `
Public x As Integer
Public s As String

Sub TestPublic()
    x = 42
    s = "Hello"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'PublicTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Private declaration', () => {
      const vb6Code = `
Private x As Integer
Private s As String

Sub TestPrivate()
    x = 42
    s = "Hello"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'PrivateTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Static declaration', () => {
      const vb6Code = `
Sub TestStatic()
    Static counter As Integer
    counter = counter + 1
    Debug.Print counter
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'StaticTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Const declaration', () => {
      const vb6Code = `
Sub TestConst()
    Const PI As Double = 3.14159
    Const MAX_SIZE As Integer = 100
    Debug.Print PI
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ConstTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('const');
    });
  });

  describe('Array Declarations', () => {
    it('should compile fixed array declaration', () => {
      const vb6Code = `
Sub TestFixedArray()
    Dim arr(10) As Integer
    arr(0) = 42
    arr(5) = 100
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'FixedArrayTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile dynamic array declaration', () => {
      const vb6Code = `
Sub TestDynamicArray()
    Dim arr() As Integer
    ReDim arr(10)
    arr(0) = 42
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DynamicArrayTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile ReDim Preserve', () => {
      const vb6Code = `
Sub TestReDimPreserve()
    Dim arr() As Integer
    ReDim arr(5)
    arr(0) = 42
    ReDim Preserve arr(10)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ReDimPreserveTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile multi-dimensional array', () => {
      const vb6Code = `
Sub TestMultiDimArray()
    Dim matrix(3, 3) As Integer
    matrix(0, 0) = 1
    matrix(1, 1) = 2
    matrix(2, 2) = 3
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MultiDimArrayTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Procedures - Sub and Function', () => {
    it('should compile Sub declaration', () => {
      const vb6Code = `
Sub MySub()
    MsgBox "Hello"
End Sub

Sub TestSub()
    MySub
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SubTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Sub with parameters', () => {
      const vb6Code = `
Sub MySub(x As Integer, s As String)
    MsgBox s & " " & x
End Sub

Sub TestSubParams()
    MySub 42, "Answer"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SubParamsTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Function declaration', () => {
      const vb6Code = `
Function Add(a As Integer, b As Integer) As Integer
    Add = a + b
End Function

Sub TestFunction()
    Dim result As Integer
    result = Add(5, 3)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'FunctionTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile ByVal and ByRef parameters', () => {
      const vb6Code = `
Sub TestByValByRef(ByVal x As Integer, ByRef y As Integer)
    x = x + 1
    y = y + 1
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ByValByRefTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Optional parameters', () => {
      const vb6Code = `
Function Greet(name As String, Optional title As String = "Mr.") As String
    Greet = title & " " & name
End Function
`;
      const result = transpiler.transpile(vb6Code, 'OptionalParamsTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile ParamArray', () => {
      const vb6Code = `
Function Sum(ParamArray values() As Variant) As Double
    Dim i As Integer
    Dim total As Double
    total = 0
    For i = LBound(values) To UBound(values)
        total = total + values(i)
    Next i
    Sum = total
End Function
`;
      const result = transpiler.transpile(vb6Code, 'ParamArrayTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Public/Private Sub/Function', () => {
      const vb6Code = `
Public Sub PublicSub()
    MsgBox "Public"
End Sub

Private Sub PrivateSub()
    MsgBox "Private"
End Sub

Public Function PublicFunc() As Integer
    PublicFunc = 42
End Function

Private Function PrivateFunc() As Integer
    PrivateFunc = 42
End Function
`;
      const result = transpiler.transpile(vb6Code, 'PublicPrivateTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('User-Defined Types', () => {
    it('should compile Type declaration', () => {
      const vb6Code = `
Type Person
    FirstName As String
    LastName As String
    Age As Integer
End Type

Sub TestType()
    Dim p As Person
    p.FirstName = "John"
    p.LastName = "Doe"
    p.Age = 30
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'TypeTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile nested Type', () => {
      const vb6Code = `
Type Address
    Street As String
    City As String
    ZipCode As String
End Type

Type Person
    Name As String
    HomeAddress As Address
End Type

Sub TestNestedType()
    Dim p As Person
    p.Name = "John"
    p.HomeAddress.Street = "123 Main St"
    p.HomeAddress.City = "Springfield"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NestedTypeTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Type with arrays', () => {
      const vb6Code = `
Type Student
    Name As String
    Grades(10) As Integer
End Type

Sub TestTypeArray()
    Dim s As Student
    s.Name = "Alice"
    s.Grades(0) = 95
    s.Grades(1) = 87
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'TypeArrayTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Enumerations', () => {
    it('should compile Enum declaration', () => {
      const vb6Code = `
Enum Color
    Red
    Green
    Blue
End Enum

Sub TestEnum()
    Dim c As Color
    c = Red
    If c = Red Then
        MsgBox "Red"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'EnumTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Enum with explicit values', () => {
      const vb6Code = `
Enum ErrorCode
    Success = 0
    NotFound = 404
    ServerError = 500
End Enum

Sub TestEnumValues()
    Dim err As ErrorCode
    err = NotFound
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'EnumValuesTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should compile On Error Resume Next', () => {
      const vb6Code = `
Sub TestErrorResumeNext()
    On Error Resume Next
    Dim x As Integer
    x = 1 / 0
    MsgBox "Error handled"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ErrorResumeNextTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile On Error GoTo label', () => {
      const vb6Code = `
Sub TestErrorGoTo()
    On Error GoTo ErrorHandler
    Dim x As Integer
    x = 1 / 0
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ErrorGoToTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Err object', () => {
      const vb6Code = `
Sub TestErrObject()
    On Error Resume Next
    Dim x As Integer
    x = 1 / 0
    If Err.Number <> 0 Then
        MsgBox Err.Description
        Err.Clear
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ErrObjectTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Resume statement', () => {
      const vb6Code = `
Sub TestResume()
    On Error GoTo ErrorHandler
    Dim x As Integer
    x = 1 / 0
    Exit Sub

ErrorHandler:
    MsgBox "Error occurred"
    Resume Next
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ResumeTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('GoTo and Labels', () => {
    it('should compile GoTo statement', () => {
      const vb6Code = `
Sub TestGoTo()
    Dim x As Integer
    x = 10
    GoTo MyLabel
    x = 20
MyLabel:
    MsgBox x
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'GoToTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile GoSub and Return', () => {
      const vb6Code = `
Sub TestGoSub()
    Dim x As Integer
    x = 10
    GoSub MySubroutine
    Exit Sub

MySubroutine:
    MsgBox x
    Return
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'GoSubTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('With Statement', () => {
    it('should compile With block', () => {
      const vb6Code = `
Type Person
    FirstName As String
    LastName As String
    Age As Integer
End Type

Sub TestWith()
    Dim p As Person
    With p
        .FirstName = "John"
        .LastName = "Doe"
        .Age = 30
    End With
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'WithTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile nested With blocks', () => {
      const vb6Code = `
Type Address
    Street As String
    City As String
End Type

Type Person
    Name As String
    HomeAddress As Address
End Type

Sub TestNestedWith()
    Dim p As Person
    With p
        .Name = "John"
        With .HomeAddress
            .Street = "123 Main St"
            .City = "Springfield"
        End With
    End With
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NestedWithTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Operators', () => {
    it('should compile arithmetic operators', () => {
      const vb6Code = `
Sub TestArithmetic()
    Dim a As Integer, b As Integer
    Dim result As Integer
    a = 10
    b = 3
    result = a + b
    result = a - b
    result = a * b
    result = a / b
    result = a \\ b
    result = a Mod b
    result = a ^ b
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ArithmeticTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile comparison operators', () => {
      const vb6Code = `
Sub TestComparison()
    Dim a As Integer, b As Integer
    Dim result As Boolean
    a = 10
    b = 5
    result = a = b
    result = a <> b
    result = a > b
    result = a < b
    result = a >= b
    result = a <= b
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ComparisonTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile logical operators', () => {
      const vb6Code = `
Sub TestLogical()
    Dim a As Boolean, b As Boolean
    Dim result As Boolean
    a = True
    b = False
    result = a And b
    result = a Or b
    result = Not a
    result = a Xor b
    result = a Eqv b
    result = a Imp b
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LogicalTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile string concatenation', () => {
      const vb6Code = `
Sub TestConcat()
    Dim s1 As String, s2 As String
    Dim result As String
    s1 = "Hello"
    s2 = "World"
    result = s1 & " " & s2
    result = s1 + " " + s2
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ConcatTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Like operator', () => {
      const vb6Code = `
Sub TestLike()
    Dim s As String
    Dim result As Boolean
    s = "Hello World"
    result = s Like "Hello*"
    result = s Like "*World"
    result = s Like "Hello?"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LikeTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Is operator', () => {
      const vb6Code = `
Sub TestIs()
    Dim obj1 As Object
    Dim obj2 As Object
    Dim result As Boolean
    Set obj1 = New Collection
    Set obj2 = obj1
    result = obj1 Is obj2
    result = obj1 Is Nothing
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'IsTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Classes and Objects', () => {
    it('should compile Class declaration', () => {
      const vb6Code = `
' In a separate class module
Private m_Name As String

Public Property Get Name() As String
    Name = m_Name
End Property

Public Property Let Name(value As String)
    m_Name = value
End Property

Public Sub SayHello()
    MsgBox "Hello, " & m_Name
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ClassTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile New operator', () => {
      const vb6Code = `
Sub TestNew()
    Dim col As Collection
    Set col = New Collection
    col.Add "Item1"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NewTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Set statement', () => {
      const vb6Code = `
Sub TestSet()
    Dim col1 As Collection
    Dim col2 As Collection
    Set col1 = New Collection
    Set col2 = col1
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SetTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Nothing keyword', () => {
      const vb6Code = `
Sub TestNothing()
    Dim obj As Object
    Set obj = New Collection
    Set obj = Nothing
    If obj Is Nothing Then
        MsgBox "Object is Nothing"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NothingTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Property Get/Let/Set', () => {
      const vb6Code = `
Private m_Value As Integer
Private m_Object As Object

Public Property Get Value() As Integer
    Value = m_Value
End Property

Public Property Let Value(newValue As Integer)
    m_Value = newValue
End Property

Public Property Set ObjectValue(newObj As Object)
    Set m_Object = newObj
End Property

Public Property Get ObjectValue() As Object
    Set ObjectValue = m_Object
End Property
`;
      const result = transpiler.transpile(vb6Code, 'PropertyTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Collections and Dictionaries', () => {
    it('should compile Collection usage', () => {
      const vb6Code = `
Sub TestCollection()
    Dim col As Collection
    Set col = New Collection
    col.Add "Item1"
    col.Add "Item2", "Key2"
    col.Remove 1
    col.Remove "Key2"
    Dim count As Integer
    count = col.Count
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'CollectionTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('File I/O', () => {
    it('should compile Open statement', () => {
      const vb6Code = `
Sub TestOpen()
    Dim fileNum As Integer
    fileNum = FreeFile
    Open "C:\\test.txt" For Input As #fileNum
    Close #fileNum
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'OpenTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Print statement', () => {
      const vb6Code = `
Sub TestPrint()
    Dim fileNum As Integer
    fileNum = FreeFile
    Open "C:\\test.txt" For Output As #fileNum
    Print #fileNum, "Hello World"
    Close #fileNum
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'PrintTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Input statement', () => {
      const vb6Code = `
Sub TestInput()
    Dim fileNum As Integer
    Dim s As String
    fileNum = FreeFile
    Open "C:\\test.txt" For Input As #fileNum
    Input #fileNum, s
    Close #fileNum
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'InputTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Line Input statement', () => {
      const vb6Code = `
Sub TestLineInput()
    Dim fileNum As Integer
    Dim s As String
    fileNum = FreeFile
    Open "C:\\test.txt" For Input As #fileNum
    Line Input #fileNum, s
    Close #fileNum
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LineInputTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Get and Put statements', () => {
      const vb6Code = `
Type Record
    ID As Integer
    Name As String * 20
End Type

Sub TestGetPut()
    Dim fileNum As Integer
    Dim r As Record
    fileNum = FreeFile
    Open "C:\\data.dat" For Binary As #fileNum
    Get #fileNum, 1, r
    r.ID = 42
    Put #fileNum, 1, r
    Close #fileNum
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'GetPutTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Debug and Stop', () => {
    it('should compile Debug.Print', () => {
      const vb6Code = `
Sub TestDebugPrint()
    Debug.Print "Hello"
    Debug.Print "Value: " & 42
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DebugPrintTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Debug.Assert', () => {
      const vb6Code = `
Sub TestDebugAssert()
    Dim x As Integer
    x = 10
    Debug.Assert x > 0
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DebugAssertTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Stop statement', () => {
      const vb6Code = `
Sub TestStop()
    Dim x As Integer
    x = 10
    If x = 10 Then Stop
    MsgBox "After Stop"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'StopTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Special Statements', () => {
    it('should compile End statement', () => {
      const vb6Code = `
Sub TestEnd()
    If True Then
        End
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'EndTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile DoEvents', () => {
      const vb6Code = `
Sub TestDoEvents()
    Dim i As Long
    For i = 1 To 1000000
        DoEvents
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DoEventsTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile SendKeys', () => {
      const vb6Code = `
Sub TestSendKeys()
    SendKeys "Hello", True
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SendKeysTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Conditional Compilation', () => {
    it('should compile #If...#End If', () => {
      const vb6Code = `
#If Win32 Then
    Declare Function GetUserName Lib "advapi32.dll" Alias "GetUserNameA" (ByVal lpBuffer As String, nSize As Long) As Long
#Else
    ' Alternative implementation
#End If

Sub TestConditionalCompilation()
    MsgBox "Compiled"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ConditionalCompileTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile #Const directive', () => {
      const vb6Code = `
#Const DEBUG_MODE = True

Sub TestConstDirective()
    #If DEBUG_MODE Then
        Debug.Print "Debug mode enabled"
    #End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ConstDirectiveTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
