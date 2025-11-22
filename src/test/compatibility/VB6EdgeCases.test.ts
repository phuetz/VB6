import { describe, it, expect } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';

describe('VB6 Edge Cases and Corner Cases', () => {
  describe('Empty and Minimal Code', () => {
    it('should compile empty module', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = ``;
      const result = transpiler.transpile(vb6Code, 'EmptyModule');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile module with only whitespace', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `



`;
      const result = transpiler.transpile(vb6Code, 'WhitespaceModule');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile module with only comments', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
' This is a comment
' Another comment
Rem Yet another comment
`;
      const result = transpiler.transpile(vb6Code, 'CommentsModule');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile empty Sub', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub EmptySub()
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'EmptySubTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile empty Function', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Function EmptyFunction() As Integer
End Function
`;
      const result = transpiler.transpile(vb6Code, 'EmptyFunctionTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Sub with only comments', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub CommentOnlySub()
    ' This is a comment
    ' Another comment
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'CommentOnlySubTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Comments and Whitespace', () => {
    it('should compile inline comments', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestInlineComments()
    Dim x As Integer ' Variable declaration
    x = 42 ' Assignment
    MsgBox x ' Display value
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'InlineCommentsTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Rem comments', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestRemComments()
    Rem This is a Rem comment
    Dim x As Integer
    Rem Another Rem comment
    x = 42
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'RemCommentsTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile mixed indentation', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestMixedIndentation()
Dim x As Integer
	Dim y As Integer
        Dim z As Integer
x = 1
	y = 2
        z = 3
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MixedIndentationTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile excessive whitespace', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub    TestWhitespace   ()
    Dim    x     As     Integer
    x    =    42
    MsgBox      x
End    Sub
`;
      const result = transpiler.transpile(vb6Code, 'WhitespaceTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Line Continuations', () => {
    it('should compile line continuation with underscore', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestLineContinuation()
    Dim result As String
    result = "This is a " & _
             "long string " & _
             "split across " & _
             "multiple lines"
    MsgBox result
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LineContinuationTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile continued function call', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Function TestLongCall() As Integer
    TestLongCall = MyFunction( _
        param1, _
        param2, _
        param3, _
        param4 _
    )
End Function

Function MyFunction(a, b, c, d) As Integer
    MyFunction = a + b + c + d
End Function
`;
      const result = transpiler.transpile(vb6Code, 'ContinuedCallTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile continued If statement', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestContinuedIf()
    Dim x As Integer, y As Integer
    x = 10
    y = 20
    If x > 5 And _
       y > 15 And _
       x < y Then
        MsgBox "All conditions true"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ContinuedIfTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Special Characters and Strings', () => {
    it('should compile strings with quotes', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestQuotesInString()
    Dim s As String
    s = "He said ""Hello"" to me"
    MsgBox s
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'QuotesInStringTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile empty strings', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestEmptyString()
    Dim s As String
    s = ""
    If s = "" Then
        MsgBox "Empty"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'EmptyStringTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile strings with special characters', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestSpecialChars()
    Dim s As String
    s = "Tab:" & vbTab & "NewLine:" & vbCrLf & "Quote:" & Chr(34)
    MsgBox s
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SpecialCharsTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile null strings and vbNullString', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestNullString()
    Dim s As String
    s = vbNullString
    If s = vbNullString Then
        MsgBox "Null string"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NullStringTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile very long strings', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestLongString()
    Dim s As String
    s = "This is a very long string that contains a lot of text and keeps going on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on"
    MsgBox Len(s)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LongStringTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Unicode and special characters', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestUnicode()
    Dim s As String
    s = "Héllo Wörld © ™ ® € £ ¥"
    MsgBox s
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'UnicodeTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Number Edge Cases', () => {
    it('should compile zero values', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestZero()
    Dim i As Integer
    Dim d As Double
    i = 0
    d = 0.0
    If i = 0 Then MsgBox "Zero integer"
    If d = 0 Then MsgBox "Zero double"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ZeroTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile negative numbers', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestNegative()
    Dim i As Integer
    Dim d As Double
    i = -42
    d = -3.14
    MsgBox i & ", " & d
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NegativeTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile large numbers', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestLargeNumbers()
    Dim lng As Long
    Dim dbl As Double
    lng = 2147483647
    dbl = 1.79769313486231E+308
    MsgBox lng & ", " & dbl
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LargeNumbersTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile scientific notation', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestScientificNotation()
    Dim d As Double
    d = 1.5E+10
    MsgBox d
    d = 2.5E-5
    MsgBox d
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ScientificNotationTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile hexadecimal numbers', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestHex()
    Dim i As Long
    i = &HFF
    MsgBox i
    i = &H1234ABCD
    MsgBox i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'HexTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile octal numbers', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestOctal()
    Dim i As Integer
    i = &O77
    MsgBox i
    i = &O377
    MsgBox i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'OctalTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile currency literals', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestCurrency()
    Dim c As Currency
    c = 1234.56@
    MsgBox c
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'CurrencyTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Date Literals', () => {
    it('should compile date literals', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestDateLiterals()
    Dim d As Date
    d = #1/1/2020#
    MsgBox d
    d = #12/31/2020 11:59:59 PM#
    MsgBox d
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DateLiteralsTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile various date formats', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestDateFormats()
    Dim d As Date
    d = #January 1, 2020#
    MsgBox d
    d = #1-Jan-2020#
    MsgBox d
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DateFormatsTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Implicit Conversions', () => {
    it('should compile string to number conversion', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestStringToNumber()
    Dim i As Integer
    Dim s As String
    s = "42"
    i = s
    MsgBox i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'StringToNumberTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile number to string conversion', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestNumberToString()
    Dim s As String
    Dim i As Integer
    i = 42
    s = i
    MsgBox s
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NumberToStringTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile integer to boolean conversion', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestIntegerToBoolean()
    Dim b As Boolean
    b = 1
    If b Then MsgBox "True"
    b = 0
    If Not b Then MsgBox "False"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'IntToBoolTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile null and empty conversions', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestNullEmpty()
    Dim v As Variant
    v = Null
    If IsNull(v) Then MsgBox "Is Null"
    v = Empty
    If IsEmpty(v) Then MsgBox "Is Empty"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'NullEmptyTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Variant Edge Cases', () => {
    it('should compile uninitialized Variant', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestUninitializedVariant()
    Dim v As Variant
    If IsEmpty(v) Then
        MsgBox "Variant is Empty"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'UninitializedVariantTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Variant with different types', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestVariantTypes()
    Dim v As Variant
    v = 42
    MsgBox TypeName(v)
    v = "Hello"
    MsgBox TypeName(v)
    v = 3.14
    MsgBox TypeName(v)
    v = True
    MsgBox TypeName(v)
    v = #1/1/2020#
    MsgBox TypeName(v)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'VariantTypesTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile Variant arrays', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestVariantArray()
    Dim v As Variant
    v = Array(1, "two", 3.0, True, #1/1/2020#)
    Dim i As Integer
    For i = LBound(v) To UBound(v)
        MsgBox TypeName(v(i)) & ": " & v(i)
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'VariantArrayTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Control Arrays', () => {
    it('should compile control array access', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub Form_Load()
    Dim i As Integer
    For i = 0 To 5
        Text1(i).Text = "Item " & i
    Next i
End Sub

Private Sub Text1_Change(Index As Integer)
    MsgBox "Text1(" & Index & ") changed"
End Sub

Private Sub Text1_GotFocus(Index As Integer)
    Text1(Index).SelStart = 0
    Text1(Index).SelLength = Len(Text1(Index).Text)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ControlArrayTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile dynamic control array', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub AddControl()
    Static index As Integer
    index = index + 1
    Load Text1(index)
    Text1(index).Top = Text1(index - 1).Top + Text1(index - 1).Height + 100
    Text1(index).Visible = True
End Sub

Sub RemoveControl(index As Integer)
    If index > 0 Then
        Unload Text1(index)
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DynamicControlArrayTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Default Properties', () => {
    it('should compile implicit Text property', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestImplicitText()
    Text1 = "Hello"
    MsgBox Text1
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ImplicitTextTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile implicit Value property', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestImplicitValue()
    Check1 = vbChecked
    If Check1 = vbChecked Then
        MsgBox "Checked"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ImplicitValueTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile implicit Caption property', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestImplicitCaption()
    Label1 = "Hello World"
    MsgBox Label1
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ImplicitCaptionTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Ambiguous Syntax', () => {
    it('should compile statement with multiple meanings', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestAmbiguous()
    Dim x As Integer
    Dim Print As Integer
    Print = 42
    Debug.Print Print
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'AmbiguousTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile identifier same as keyword', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Type TypeType
    Name As String
End Type

Sub TestType()
    Dim t As TypeType
    t.Name = "Test"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'KeywordAsNameTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Legacy Syntax', () => {
    it('should compile Let statement', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestLet()
    Dim x As Integer
    Let x = 42
    MsgBox x
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LetTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile DefInt statement', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
DefInt A-Z

Sub TestDefInt()
    Dim x
    x = 42
    MsgBox TypeName(x)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DefIntTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile GoSub without line numbers', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestGoSub()
    GoSub MyLabel
    Exit Sub

MyLabel:
    MsgBox "In subroutine"
    Return
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'GoSubLabelTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile line numbers', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestLineNumbers()
10  Dim x As Integer
20  x = 42
30  If x > 40 Then GoTo 50
40  MsgBox "Small"
50  MsgBox "Large"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LineNumbersTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Multiple Statements Per Line', () => {
    it('should compile multiple statements with colon', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestMultipleStatements()
    Dim x As Integer: Dim y As Integer: Dim z As Integer
    x = 1: y = 2: z = 3
    MsgBox x: MsgBox y: MsgBox z
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MultipleStatementsTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile If Then Else on one line with colons', () => {
      const transpiler = new VB6UnifiedASTTranspiler();
      const vb6Code = `
Sub TestOneLiner()
    Dim x As Integer
    x = 10
    If x > 5 Then MsgBox "Greater": x = 0 Else MsgBox "Less": x = 100
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'OneLinerTest');
      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
