/**
 * VB6 Compiler Integration Tests - Phase 3.1
 *
 * Tests end-to-end du pipeline complet de compilation:
 * VB6 Code → Tokenization → Parsing → Semantic Analysis → Optimization → Code Generation → JavaScript
 *
 * Author: Claude Code
 * Date: 2025-10-05
 * Phase: 3.1 - Suite de tests complète
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';
import { VB6Transpiler } from '../../utils/vb6Transpiler';

describe('VB6 Compiler Integration Tests', () => {
  let compiler: VB6UnifiedASTTranspiler;

  beforeEach(() => {
    compiler = new VB6UnifiedASTTranspiler({
      enableOptimizations: true,
      generateSourceMaps: true,
      useStrictMode: true,
      targetRuntime: 'browser',
    });
  });

  // ========================================================================
  // End-to-End Compilation Tests
  // ========================================================================

  describe('End-to-End Compilation', () => {
    it('should compile HelloWorld program successfully', () => {
      const vb6Code = `
Sub Main()
    MsgBox "Hello, World!"
End Sub
`;

      const result = compiler.transpile(vb6Code, 'HelloWorld');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toBeDefined();
      expect(result.javascript).toContain('"use strict"');
      expect(result.javascript).toContain('VB6Runtime');
    });

    it('should compile simple calculator successfully', () => {
      const vb6Code = `
Function Add(a As Double, b As Double) As Double
    Add = a + b
End Function

Function Subtract(a As Double, b As Double) As Double
    Subtract = a - b
End Function

Function Multiply(a As Double, b As Double) As Double
    Multiply = a * b
End Function

Function Divide(a As Double, b As Double) As Double
    If b <> 0 Then
        Divide = a / b
    Else
        Divide = 0
    End If
End Function
`;

      const result = compiler.transpile(vb6Code, 'Calculator');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.metrics.procedures).toBe(4);
    });

    it('should compile form with controls successfully', () => {
      const vb6Code = `
Private Sub Form_Load()
    Me.Caption = "My Application"
    Text1.Text = "Hello"
    Command1.Caption = "Click Me"
End Sub

Private Sub Command1_Click()
    MsgBox Text1.Text
End Sub
`;

      const result = compiler.transpile(vb6Code, 'Form1');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile module with multiple procedures', () => {
      const vb6Code = `
Option Explicit

Private m_counter As Long

Public Sub Initialize()
    m_counter = 0
End Sub

Public Function GetNextID() As Long
    m_counter = m_counter + 1
    GetNextID = m_counter
End Function

Public Sub Reset()
    m_counter = 0
End Sub

Public Function GetCount() As Long
    GetCount = m_counter
End Function
`;

      const result = compiler.transpile(vb6Code, 'IDGenerator');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.metrics.procedures).toBeGreaterThan(0);
    });

    it('should compile class module successfully', () => {
      const vb6Code = `
Option Explicit

Private m_name As String
Private m_age As Integer

Public Property Get Name() As String
    Name = m_name
End Property

Public Property Let Name(value As String)
    m_name = value
End Property

Public Property Get Age() As Integer
    Age = m_age
End Property

Public Property Let Age(value As Integer)
    If value >= 0 And value <= 150 Then
        m_age = value
    End If
End Property

Public Function GetInfo() As String
    GetInfo = m_name & " (" & m_age & " years old)"
End Function
`;

      const result = compiler.transpile(vb6Code, 'Person');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // VB6 Language Constructs Tests
  // ========================================================================

  describe('VB6 Language Constructs', () => {
    it('should compile For Next loop', () => {
      const vb6Code = `
Sub TestLoop()
    Dim i As Integer
    Dim sum As Long

    sum = 0
    For i = 1 To 10
        sum = sum + i
    Next i

    MsgBox "Sum = " & sum
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile For Next with Step', () => {
      const vb6Code = `
Sub TestLoopStep()
    Dim i As Integer

    For i = 0 To 100 Step 10
        Debug.Print i
    Next i
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile For Each loop', () => {
      const vb6Code = `
Sub TestForEach()
    Dim item As Variant
    Dim items As Collection

    For Each item In items
        Debug.Print item
    Next item
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Select Case statement', () => {
      const vb6Code = `
Function GetDayName(dayNumber As Integer) As String
    Select Case dayNumber
        Case 1
            GetDayName = "Monday"
        Case 2
            GetDayName = "Tuesday"
        Case 3
            GetDayName = "Wednesday"
        Case 4
            GetDayName = "Thursday"
        Case 5
            GetDayName = "Friday"
        Case 6
            GetDayName = "Saturday"
        Case 7
            GetDayName = "Sunday"
        Case Else
            GetDayName = "Invalid"
    End Select
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile If ElseIf Else statement', () => {
      const vb6Code = `
Function GetGrade(score As Integer) As String
    If score >= 90 Then
        GetGrade = "A"
    ElseIf score >= 80 Then
        GetGrade = "B"
    ElseIf score >= 70 Then
        GetGrade = "C"
    ElseIf score >= 60 Then
        GetGrade = "D"
    Else
        GetGrade = "F"
    End If
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile With statement', () => {
      const vb6Code = `
Sub TestWith()
    Dim person As Object

    Set person = CreateObject("Person")

    With person
        .Name = "John Doe"
        .Age = 30
        .Email = "john@example.com"
    End With
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Do While loop', () => {
      const vb6Code = `
Sub TestDoWhile()
    Dim counter As Integer

    counter = 1
    Do While counter <= 10
        Debug.Print counter
        counter = counter + 1
    Loop
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Do Until loop', () => {
      const vb6Code = `
Sub TestDoUntil()
    Dim counter As Integer

    counter = 1
    Do Until counter > 10
        Debug.Print counter
        counter = counter + 1
    Loop
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('Error Handling', () => {
    it('should compile On Error Resume Next', () => {
      const vb6Code = `
Sub TestErrorHandling()
    Dim x As Double

    On Error Resume Next
    x = 1 / 0

    If Err.Number <> 0 Then
        MsgBox "Error: " & Err.Description
    End If
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile On Error GoTo with label', () => {
      const vb6Code = `
Sub TestErrorHandlingGoTo()
    On Error GoTo ErrorHandler

    Dim x As Double
    x = 1 / 0

    Exit Sub

ErrorHandler:
    MsgBox "Error occurred: " & Err.Description
    Resume Next
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile nested error handlers', () => {
      const vb6Code = `
Sub TestNestedErrors()
    On Error GoTo OuterError

    Call InnerProc

    Exit Sub

OuterError:
    MsgBox "Outer error: " & Err.Description
End Sub

Sub InnerProc()
    On Error GoTo InnerError

    Dim x As Double
    x = 1 / 0

    Exit Sub

InnerError:
    MsgBox "Inner error: " & Err.Description
    Resume Next
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Data Type Tests
  // ========================================================================

  describe('Data Types', () => {
    it('should compile Integer variables', () => {
      const vb6Code = `
Sub TestIntegers()
    Dim x As Integer
    Dim y As Integer

    x = 100
    y = 200

    MsgBox x + y
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Long variables', () => {
      const vb6Code = `
Sub TestLongs()
    Dim bigNumber As Long

    bigNumber = 2147483647
    MsgBox bigNumber
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile String variables', () => {
      const vb6Code = `
Sub TestStrings()
    Dim firstName As String
    Dim lastName As String
    Dim fullName As String

    firstName = "John"
    lastName = "Doe"
    fullName = firstName & " " & lastName

    MsgBox fullName
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Boolean variables', () => {
      const vb6Code = `
Sub TestBooleans()
    Dim isValid As Boolean
    Dim isActive As Boolean

    isValid = True
    isActive = False

    If isValid And Not isActive Then
        MsgBox "Valid but not active"
    End If
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Variant variables', () => {
      const vb6Code = `
Sub TestVariants()
    Dim value As Variant

    value = 100
    MsgBox value

    value = "Hello"
    MsgBox value

    value = True
    MsgBox value
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Date variables', () => {
      const vb6Code = `
Sub TestDates()
    Dim today As Date
    Dim tomorrow As Date

    today = Now
    tomorrow = DateAdd("d", 1, today)

    MsgBox "Today: " & today
    MsgBox "Tomorrow: " & tomorrow
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Array Tests
  // ========================================================================

  describe('Arrays', () => {
    it('should compile static arrays', () => {
      const vb6Code = `
Sub TestStaticArray()
    Dim numbers(10) As Integer
    Dim i As Integer

    For i = 0 To 10
        numbers(i) = i * 10
    Next i

    MsgBox numbers(5)
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile dynamic arrays', () => {
      const vb6Code = `
Sub TestDynamicArray()
    Dim numbers() As Integer
    Dim size As Integer
    Dim i As Integer

    size = 10
    ReDim numbers(size)

    For i = 0 To size
        numbers(i) = i
    Next i

    MsgBox numbers(5)
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile multi-dimensional arrays', () => {
      const vb6Code = `
Sub TestMultiDimensionalArray()
    Dim matrix(3, 3) As Integer
    Dim i As Integer
    Dim j As Integer

    For i = 0 To 3
        For j = 0 To 3
            matrix(i, j) = i * 10 + j
        Next j
    Next i

    MsgBox matrix(2, 2)
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Function and Sub Tests
  // ========================================================================

  describe('Functions and Subs', () => {
    it('should compile function with return value', () => {
      const vb6Code = `
Function Square(x As Double) As Double
    Square = x * x
End Function

Sub TestSquare()
    Dim result As Double

    result = Square(5)
    MsgBox result
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile sub without return value', () => {
      const vb6Code = `
Sub PrintMessage(message As String)
    MsgBox message
End Sub

Sub TestPrint()
    PrintMessage "Hello, World!"
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile recursive function', () => {
      const vb6Code = `
Function Factorial(n As Long) As Long
    If n <= 1 Then
        Factorial = 1
    Else
        Factorial = n * Factorial(n - 1)
    End If
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile ByVal and ByRef parameters', () => {
      const vb6Code = `
Sub SwapByRef(ByRef a As Integer, ByRef b As Integer)
    Dim temp As Integer
    temp = a
    a = b
    b = temp
End Sub

Sub TestByVal(ByVal x As Integer)
    x = x + 10
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile optional parameters', () => {
      const vb6Code = `
Function Greet(name As String, Optional greeting As String = "Hello") As String
    Greet = greeting & ", " & name & "!"
End Function
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Performance Tests
  // ========================================================================

  describe('Performance', () => {
    it('should compile small program quickly', () => {
      const vb6Code = `Sub Test()\nEnd Sub`;

      const start = performance.now();
      const result = compiler.transpile(vb6Code);
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // < 100ms
    });

    it('should compile medium program efficiently', () => {
      const vb6Code = `
Function Factorial(n As Long) As Long
    If n <= 1 Then
        Factorial = 1
    Else
        Factorial = n * Factorial(n - 1)
    End If
End Function

Function Fibonacci(n As Long) As Long
    If n <= 1 Then
        Fibonacci = n
    Else
        Fibonacci = Fibonacci(n - 1) + Fibonacci(n - 2)
    End If
End Function

Sub TestMath()
    Dim i As Long
    For i = 1 To 10
        Debug.Print "Factorial(" & i & ") = " & Factorial(i)
        Debug.Print "Fibonacci(" & i & ") = " & Fibonacci(i)
    Next i
End Sub
`;

      const start = performance.now();
      const result = compiler.transpile(vb6Code);
      const duration = performance.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // < 500ms
    });

    it('should report accurate compilation metrics', () => {
      const vb6Code = `
Sub Proc1()
End Sub

Function Proc2()
End Function

Sub Proc3()
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.metrics.lexingTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.parsingTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.generationTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.totalTime).toBeGreaterThanOrEqual(0); // >= 0 since timing can be 0 in fast tests
    });
  });

  // ========================================================================
  // Edge Cases Tests
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle empty code', () => {
      const result = compiler.transpile('');

      expect(result.success).toBe(true);
    });

    it('should handle whitespace-only code', () => {
      const result = compiler.transpile('   \n   \n   ');

      expect(result.success).toBe(true);
    });

    it('should handle comments-only code', () => {
      const vb6Code = `
' This is a comment
' Another comment
  ' Indented comment
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
    });

    it('should handle single-line code', () => {
      const result = compiler.transpile('Sub Test(): End Sub');

      expect(result.success).toBe(true);
    });

    it('should handle very long identifiers', () => {
      const vb6Code = `
Sub VeryLongIdentifierNameThatIsStillValid()
    Dim anotherVeryLongVariableNameThatIsValid As Integer
    anotherVeryLongVariableNameThatIsValid = 42
End Sub
`;

      const result = compiler.transpile(vb6Code);

      expect(result.success).toBe(true);
    });
  });
});
