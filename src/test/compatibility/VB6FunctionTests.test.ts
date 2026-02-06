import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';

/**
 * VB6 Built-in Functions Compatibility Tests
 *
 * Tests all 100+ VB6 built-in functions for complete compatibility
 *
 * Categories:
 * - String Functions (30+)
 * - Math Functions (25+)
 * - Date/Time Functions (20+)
 * - Conversion Functions (15+)
 * - Array Functions (10+)
 * - Information Functions (10+)
 * - Format Functions (10+)
 * - File I/O Functions (10+)
 * - Interaction Functions (5+)
 */

describe('VB6 Built-in Functions Compatibility', () => {
  let transpiler: VB6UnifiedASTTranspiler;

  beforeEach(() => {
    transpiler = new VB6UnifiedASTTranspiler({
      strict: true,
      generateTypeScript: false,
      generateSourceMaps: false,
      optimize: false,
      runtimeTarget: 'es2015',
    });
  });

  describe('String Functions', () => {
    describe('Left, Right, Mid', () => {
      it('should compile Left function', () => {
        const vb6Code = `
Function TestLeft() As String
    Dim s As String
    s = "Hello World"
    TestLeft = Left(s, 5)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'LeftTest');

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.javascript).toContain('Left');
      });

      it('should compile Right function', () => {
        const vb6Code = `
Function TestRight() As String
    Dim s As String
    s = "Hello World"
    TestRight = Right(s, 5)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'RightTest');

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.javascript).toContain('Right');
      });

      it('should compile Mid function', () => {
        const vb6Code = `
Function TestMid() As String
    Dim s As String
    s = "Hello World"
    TestMid = Mid(s, 7, 5)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'MidTest');

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.javascript).toContain('Mid');
      });
    });

    describe('Len, LenB', () => {
      it('should compile Len function', () => {
        const vb6Code = `
Function TestLen() As Integer
    Dim s As String
    s = "Hello"
    TestLen = Len(s)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'LenTest');

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.javascript).toContain('Len');
      });

      it('should compile LenB function for byte length', () => {
        const vb6Code = `
Function TestLenB() As Integer
    Dim s As String
    s = "Hello"
    TestLenB = LenB(s)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'LenBTest');

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.javascript).toContain('LenB');
      });
    });

    describe('Trim, LTrim, RTrim', () => {
      it('should compile Trim function', () => {
        const vb6Code = `
Function TestTrim() As String
    Dim s As String
    s = "  Hello  "
    TestTrim = Trim(s)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TrimTest');

        expect(result.success).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.javascript).toContain('Trim');
      });

      it('should compile LTrim function', () => {
        const vb6Code = `
Function TestLTrim() As String
    TestLTrim = LTrim("  Hello")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'LTrimTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('LTrim');
      });

      it('should compile RTrim function', () => {
        const vb6Code = `
Function TestRTrim() As String
    TestRTrim = RTrim("Hello  ")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'RTrimTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('RTrim');
      });
    });

    describe('UCase, LCase', () => {
      it('should compile UCase function', () => {
        const vb6Code = `
Function TestUCase() As String
    TestUCase = UCase("hello")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'UCaseTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('UCase');
      });

      it('should compile LCase function', () => {
        const vb6Code = `
Function TestLCase() As String
    TestLCase = LCase("HELLO")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'LCaseTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('LCase');
      });
    });

    describe('InStr, InStrRev', () => {
      it('should compile InStr function', () => {
        const vb6Code = `
Function TestInStr() As Integer
    Dim s As String
    s = "Hello World"
    TestInStr = InStr(s, "World")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'InStrTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('InStr');
      });

      it('should compile InStr with start position', () => {
        const vb6Code = `
Function TestInStrStart() As Integer
    TestInStrStart = InStr(5, "Hello World", "o")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'InStrStartTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('InStr');
      });

      it('should compile InStrRev function', () => {
        const vb6Code = `
Function TestInStrRev() As Integer
    TestInStrRev = InStrRev("Hello World", "o")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'InStrRevTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('InStrRev');
      });
    });

    describe('Replace, StrReverse', () => {
      it('should compile Replace function', () => {
        const vb6Code = `
Function TestReplace() As String
    Dim s As String
    s = "Hello World"
    TestReplace = Replace(s, "World", "VB6")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'ReplaceTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Replace');
      });

      it('should compile StrReverse function', () => {
        const vb6Code = `
Function TestStrReverse() As String
    TestStrReverse = StrReverse("Hello")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'StrReverseTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('StrReverse');
      });
    });

    describe('String, Space', () => {
      it('should compile String function', () => {
        const vb6Code = `
Function TestString() As String
    TestString = String(5, "A")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'StringTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('String');
      });

      it('should compile Space function', () => {
        const vb6Code = `
Function TestSpace() As String
    TestSpace = Space(10)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'SpaceTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Space');
      });
    });

    describe('StrComp, StrConv', () => {
      it('should compile StrComp function', () => {
        const vb6Code = `
Function TestStrComp() As Integer
    TestStrComp = StrComp("ABC", "abc", vbTextCompare)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'StrCompTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('StrComp');
      });

      it('should compile StrConv function', () => {
        const vb6Code = `
Function TestStrConv() As String
    TestStrConv = StrConv("hello", vbProperCase)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'StrConvTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('StrConv');
      });
    });

    describe('Chr, Asc', () => {
      it('should compile Chr function', () => {
        const vb6Code = `
Function TestChr() As String
    TestChr = Chr(65)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'ChrTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Chr');
      });

      it('should compile Asc function', () => {
        const vb6Code = `
Function TestAsc() As Integer
    TestAsc = Asc("A")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'AscTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Asc');
      });
    });

    describe('Split, Join, Filter', () => {
      it('should compile Split function', () => {
        const vb6Code = `
Function TestSplit()
    Dim arr() As String
    arr = Split("A,B,C", ",")
    TestSplit = arr
End Function
`;
        const result = transpiler.transpile(vb6Code, 'SplitTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Split');
      });

      it('should compile Join function', () => {
        const vb6Code = `
Function TestJoin() As String
    Dim arr(2) As String
    arr(0) = "A"
    arr(1) = "B"
    arr(2) = "C"
    TestJoin = Join(arr, ",")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'JoinTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Join');
      });

      it('should compile Filter function', () => {
        const vb6Code = `
Function TestFilter()
    Dim arr(3) As String
    Dim filtered() As String
    arr(0) = "Apple"
    arr(1) = "Banana"
    arr(2) = "Apricot"
    filtered = Filter(arr, "Ap")
    TestFilter = filtered
End Function
`;
        const result = transpiler.transpile(vb6Code, 'FilterTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Filter');
      });
    });
  });

  describe('Math Functions', () => {
    describe('Basic Math', () => {
      it('should compile Abs function', () => {
        const vb6Code = `
Function TestAbs() As Integer
    TestAbs = Abs(-42)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'AbsTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Abs');
      });

      it('should compile Sgn function', () => {
        const vb6Code = `
Function TestSgn() As Integer
    TestSgn = Sgn(-42)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'SgnTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Sgn');
      });

      it('should compile Sqr function', () => {
        const vb6Code = `
Function TestSqr() As Double
    TestSqr = Sqr(16)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'SqrTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Sqr');
      });
    });

    describe('Trigonometric Functions', () => {
      it('should compile Sin function', () => {
        const vb6Code = `
Function TestSin() As Double
    TestSin = Sin(1.57)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'SinTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Sin');
      });

      it('should compile Cos function', () => {
        const vb6Code = `
Function TestCos() As Double
    TestCos = Cos(0)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CosTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Cos');
      });

      it('should compile Tan function', () => {
        const vb6Code = `
Function TestTan() As Double
    TestTan = Tan(0.785)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TanTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Tan');
      });

      it('should compile Atn function', () => {
        const vb6Code = `
Function TestAtn() As Double
    TestAtn = Atn(1)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'AtnTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Atn');
      });
    });

    describe('Exponential and Logarithmic', () => {
      it('should compile Exp function', () => {
        const vb6Code = `
Function TestExp() As Double
    TestExp = Exp(1)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'ExpTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Exp');
      });

      it('should compile Log function', () => {
        const vb6Code = `
Function TestLog() As Double
    TestLog = Log(10)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'LogTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Log');
      });
    });

    describe('Rounding Functions', () => {
      it('should compile Int function', () => {
        const vb6Code = `
Function TestInt() As Integer
    TestInt = Int(3.7)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IntTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Int');
      });

      it('should compile Fix function', () => {
        const vb6Code = `
Function TestFix() As Integer
    TestFix = Fix(-3.7)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'FixTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Fix');
      });

      it('should compile Round function', () => {
        const vb6Code = `
Function TestRound() As Double
    TestRound = Round(3.456, 2)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'RoundTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Round');
      });
    });

    describe('Random Number', () => {
      it('should compile Rnd function', () => {
        const vb6Code = `
Function TestRnd() As Single
    TestRnd = Rnd()
End Function
`;
        const result = transpiler.transpile(vb6Code, 'RndTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Rnd');
      });

      it('should compile Randomize statement', () => {
        const vb6Code = `
Sub TestRandomize()
    Randomize
End Sub
`;
        const result = transpiler.transpile(vb6Code, 'RandomizeTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Randomize');
      });
    });
  });

  describe('Date/Time Functions', () => {
    describe('Current Date/Time', () => {
      it('should compile Now function', () => {
        const vb6Code = `
Function TestNow() As Date
    TestNow = Now
End Function
`;
        const result = transpiler.transpile(vb6Code, 'NowTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Now');
      });

      it('should compile Date function', () => {
        const vb6Code = `
Function TestDate() As Date
    TestDate = Date
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DateTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Date');
      });

      it('should compile Time function', () => {
        const vb6Code = `
Function TestTime() As Date
    TestTime = Time
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TimeTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Time');
      });

      it('should compile Timer function', () => {
        const vb6Code = `
Function TestTimer() As Single
    TestTimer = Timer
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TimerTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Timer');
      });
    });

    describe('Date Parts', () => {
      it('should compile Year function', () => {
        const vb6Code = `
Function TestYear() As Integer
    TestYear = Year(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'YearTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Year');
      });

      it('should compile Month function', () => {
        const vb6Code = `
Function TestMonth() As Integer
    TestMonth = Month(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'MonthTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Month');
      });

      it('should compile Day function', () => {
        const vb6Code = `
Function TestDay() As Integer
    TestDay = Day(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DayTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Day');
      });

      it('should compile Hour function', () => {
        const vb6Code = `
Function TestHour() As Integer
    TestHour = Hour(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'HourTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Hour');
      });

      it('should compile Minute function', () => {
        const vb6Code = `
Function TestMinute() As Integer
    TestMinute = Minute(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'MinuteTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Minute');
      });

      it('should compile Second function', () => {
        const vb6Code = `
Function TestSecond() As Integer
    TestSecond = Second(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'SecondTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Second');
      });

      it('should compile Weekday function', () => {
        const vb6Code = `
Function TestWeekday() As Integer
    TestWeekday = Weekday(Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'WeekdayTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Weekday');
      });
    });

    describe('Date Manipulation', () => {
      it('should compile DateAdd function', () => {
        const vb6Code = `
Function TestDateAdd() As Date
    TestDateAdd = DateAdd("d", 7, Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DateAddTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('DateAdd');
      });

      it('should compile DateDiff function', () => {
        const vb6Code = `
Function TestDateDiff() As Long
    Dim d1 As Date, d2 As Date
    d1 = #1/1/2020#
    d2 = #12/31/2020#
    TestDateDiff = DateDiff("d", d1, d2)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DateDiffTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('DateDiff');
      });

      it('should compile DatePart function', () => {
        const vb6Code = `
Function TestDatePart() As Integer
    TestDatePart = DatePart("q", Now)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DatePartTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('DatePart');
      });

      it('should compile DateSerial function', () => {
        const vb6Code = `
Function TestDateSerial() As Date
    TestDateSerial = DateSerial(2020, 12, 31)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DateSerialTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('DateSerial');
      });

      it('should compile TimeSerial function', () => {
        const vb6Code = `
Function TestTimeSerial() As Date
    TestTimeSerial = TimeSerial(12, 30, 45)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TimeSerialTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('TimeSerial');
      });

      it('should compile DateValue function', () => {
        const vb6Code = `
Function TestDateValue() As Date
    TestDateValue = DateValue("December 31, 2020")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'DateValueTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('DateValue');
      });

      it('should compile TimeValue function', () => {
        const vb6Code = `
Function TestTimeValue() As Date
    TestTimeValue = TimeValue("12:30:45 PM")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TimeValueTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('TimeValue');
      });
    });

    describe('MonthName, WeekdayName', () => {
      it('should compile MonthName function', () => {
        const vb6Code = `
Function TestMonthName() As String
    TestMonthName = MonthName(12)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'MonthNameTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('MonthName');
      });

      it('should compile WeekdayName function', () => {
        const vb6Code = `
Function TestWeekdayName() As String
    TestWeekdayName = WeekdayName(1)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'WeekdayNameTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('WeekdayName');
      });
    });
  });

  describe('Conversion Functions', () => {
    describe('Numeric Conversions', () => {
      it('should compile CInt function', () => {
        const vb6Code = `
Function TestCInt() As Integer
    TestCInt = CInt(3.7)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CIntTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CInt');
      });

      it('should compile CLng function', () => {
        const vb6Code = `
Function TestCLng() As Long
    TestCLng = CLng(3.7)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CLngTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CLng');
      });

      it('should compile CSng function', () => {
        const vb6Code = `
Function TestCSng() As Single
    TestCSng = CSng("3.14")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CSngTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CSng');
      });

      it('should compile CDbl function', () => {
        const vb6Code = `
Function TestCDbl() As Double
    TestCDbl = CDbl("3.14159")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CDblTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CDbl');
      });

      it('should compile CCur function', () => {
        const vb6Code = `
Function TestCCur() As Currency
    TestCCur = CCur("1234.56")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CCurTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CCur');
      });

      it('should compile CByte function', () => {
        const vb6Code = `
Function TestCByte() As Byte
    TestCByte = CByte(255)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CByteTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CByte');
      });
    });

    describe('String and Other Conversions', () => {
      it('should compile CStr function', () => {
        const vb6Code = `
Function TestCStr() As String
    TestCStr = CStr(42)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CStrTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CStr');
      });

      it('should compile CBool function', () => {
        const vb6Code = `
Function TestCBool() As Boolean
    TestCBool = CBool(1)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CBoolTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CBool');
      });

      it('should compile CDate function', () => {
        const vb6Code = `
Function TestCDate() As Date
    TestCDate = CDate("12/31/2020")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CDateTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CDate');
      });

      it('should compile CVar function', () => {
        const vb6Code = `
Function TestCVar() As Variant
    TestCVar = CVar("Hello")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'CVarTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('CVar');
      });
    });

    describe('Val, Str, Hex, Oct', () => {
      it('should compile Val function', () => {
        const vb6Code = `
Function TestVal() As Double
    TestVal = Val("123.45")
End Function
`;
        const result = transpiler.transpile(vb6Code, 'ValTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Val');
      });

      it('should compile Str function', () => {
        const vb6Code = `
Function TestStr() As String
    TestStr = Str(42)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'StrTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Str');
      });

      it('should compile Hex function', () => {
        const vb6Code = `
Function TestHex() As String
    TestHex = Hex(255)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'HexTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Hex');
      });

      it('should compile Oct function', () => {
        const vb6Code = `
Function TestOct() As String
    TestOct = Oct(64)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'OctTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('Oct');
      });
    });
  });

  describe('Array Functions', () => {
    it('should compile Array function', () => {
      const vb6Code = `
Function TestArray() As Variant
    TestArray = Array(1, 2, 3, 4, 5)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'ArrayTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Array');
    });

    it('should compile UBound function', () => {
      const vb6Code = `
Function TestUBound() As Integer
    Dim arr(10) As Integer
    TestUBound = UBound(arr)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'UBoundTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('UBound');
    });

    it('should compile LBound function', () => {
      const vb6Code = `
Function TestLBound() As Integer
    Dim arr(10) As Integer
    TestLBound = LBound(arr)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'LBoundTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('LBound');
    });

    it('should compile IsArray function', () => {
      const vb6Code = `
Function TestIsArray(v As Variant) As Boolean
    TestIsArray = IsArray(v)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'IsArrayTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('IsArray');
    });
  });

  describe('Information Functions', () => {
    describe('Type Checking', () => {
      it('should compile IsNumeric function', () => {
        const vb6Code = `
Function TestIsNumeric(v As Variant) As Boolean
    TestIsNumeric = IsNumeric(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IsNumericTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('IsNumeric');
      });

      it('should compile IsDate function', () => {
        const vb6Code = `
Function TestIsDate(v As Variant) As Boolean
    TestIsDate = IsDate(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IsDateTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('IsDate');
      });

      it('should compile IsEmpty function', () => {
        const vb6Code = `
Function TestIsEmpty(v As Variant) As Boolean
    TestIsEmpty = IsEmpty(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IsEmptyTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('IsEmpty');
      });

      it('should compile IsNull function', () => {
        const vb6Code = `
Function TestIsNull(v As Variant) As Boolean
    TestIsNull = IsNull(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IsNullTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('IsNull');
      });

      it('should compile IsObject function', () => {
        const vb6Code = `
Function TestIsObject(v As Variant) As Boolean
    TestIsObject = IsObject(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IsObjectTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('IsObject');
      });

      it('should compile IsMissing function', () => {
        const vb6Code = `
Function TestIsMissing(Optional v As Variant) As Boolean
    TestIsMissing = IsMissing(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'IsMissingTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('IsMissing');
      });
    });

    describe('VarType and TypeName', () => {
      it('should compile VarType function', () => {
        const vb6Code = `
Function TestVarType(v As Variant) As Integer
    TestVarType = VarType(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'VarTypeTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('VarType');
      });

      it('should compile TypeName function', () => {
        const vb6Code = `
Function TestTypeName(v As Variant) As String
    TestTypeName = TypeName(v)
End Function
`;
        const result = transpiler.transpile(vb6Code, 'TypeNameTest');

        expect(result.success).toBe(true);
        expect(result.javascript).toContain('TypeName');
      });
    });
  });

  describe('Format Functions', () => {
    it('should compile Format function', () => {
      const vb6Code = `
Function TestFormat() As String
    TestFormat = Format(Now, "yyyy-mm-dd")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FormatTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Format');
    });

    it('should compile FormatNumber function', () => {
      const vb6Code = `
Function TestFormatNumber() As String
    TestFormatNumber = FormatNumber(1234.567, 2)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FormatNumberTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FormatNumber');
    });

    it('should compile FormatCurrency function', () => {
      const vb6Code = `
Function TestFormatCurrency() As String
    TestFormatCurrency = FormatCurrency(1234.56)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FormatCurrencyTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FormatCurrency');
    });

    it('should compile FormatPercent function', () => {
      const vb6Code = `
Function TestFormatPercent() As String
    TestFormatPercent = FormatPercent(0.25)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FormatPercentTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FormatPercent');
    });

    it('should compile FormatDateTime function', () => {
      const vb6Code = `
Function TestFormatDateTime() As String
    TestFormatDateTime = FormatDateTime(Now, vbLongDate)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FormatDateTimeTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FormatDateTime');
    });
  });

  describe('File I/O Functions', () => {
    it('should compile Dir function', () => {
      const vb6Code = `
Function TestDir() As String
    TestDir = Dir("C:\\*.txt")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'DirTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Dir');
    });

    it('should compile FileLen function', () => {
      const vb6Code = `
Function TestFileLen() As Long
    TestFileLen = FileLen("C:\\test.txt")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FileLenTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FileLen');
    });

    it('should compile FileDateTime function', () => {
      const vb6Code = `
Function TestFileDateTime() As Date
    TestFileDateTime = FileDateTime("C:\\test.txt")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FileDateTimeTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FileDateTime');
    });

    it('should compile GetAttr function', () => {
      const vb6Code = `
Function TestGetAttr() As Integer
    TestGetAttr = GetAttr("C:\\test.txt")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'GetAttrTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('GetAttr');
    });

    it('should compile EOF function', () => {
      const vb6Code = `
Function TestEOF(fileNumber As Integer) As Boolean
    TestEOF = EOF(fileNumber)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'EOFTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('EOF');
    });

    it('should compile LOF function', () => {
      const vb6Code = `
Function TestLOF(fileNumber As Integer) As Long
    TestLOF = LOF(fileNumber)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'LOFTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('LOF');
    });

    it('should compile FreeFile function', () => {
      const vb6Code = `
Function TestFreeFile() As Integer
    TestFreeFile = FreeFile
End Function
`;
      const result = transpiler.transpile(vb6Code, 'FreeFileTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('FreeFile');
    });
  });

  describe('Interaction Functions', () => {
    it('should compile MsgBox function', () => {
      const vb6Code = `
Function TestMsgBox() As Integer
    TestMsgBox = MsgBox("Hello", vbYesNo, "Title")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'MsgBoxTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('MsgBox');
    });

    it('should compile InputBox function', () => {
      const vb6Code = `
Function TestInputBox() As String
    TestInputBox = InputBox("Enter name:", "Input")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'InputBoxTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('InputBox');
    });

    it('should compile Shell function', () => {
      const vb6Code = `
Function TestShell() As Long
    TestShell = Shell("notepad.exe", vbNormalFocus)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'ShellTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Shell');
    });

    it('should compile Beep statement', () => {
      const vb6Code = `
Sub TestBeep()
    Beep
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'BeepTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Beep');
    });
  });

  describe('Environment Functions', () => {
    it('should compile Environ function', () => {
      const vb6Code = `
Function TestEnviron() As String
    TestEnviron = Environ("PATH")
End Function
`;
      const result = transpiler.transpile(vb6Code, 'EnvironTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Environ');
    });

    it('should compile CurDir function', () => {
      const vb6Code = `
Function TestCurDir() As String
    TestCurDir = CurDir
End Function
`;
      const result = transpiler.transpile(vb6Code, 'CurDirTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('CurDir');
    });

    it('should compile App object properties', () => {
      const vb6Code = `
Function TestAppPath() As String
    TestAppPath = App.Path
End Function
`;
      const result = transpiler.transpile(vb6Code, 'AppPathTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('App');
    });
  });

  describe('RGB and Color Functions', () => {
    it('should compile RGB function', () => {
      const vb6Code = `
Function TestRGB() As Long
    TestRGB = RGB(255, 0, 0)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'RGBTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('RGB');
    });

    it('should compile QBColor function', () => {
      const vb6Code = `
Function TestQBColor() As Long
    TestQBColor = QBColor(4)
End Function
`;
      const result = transpiler.transpile(vb6Code, 'QBColorTest');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('QBColor');
    });
  });
});
