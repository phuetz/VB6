/**
 * VB6 Monaco Language Configuration
 * Comprehensive VB6 language support for Monaco Editor
 * Includes syntax highlighting, auto-completion, snippets, and more
 */

import type * as Monaco from 'monaco-editor';

// ============================================================================
// VB6 Keywords
// ============================================================================

export const VB6Keywords = [
  // Control flow
  'If',
  'Then',
  'Else',
  'ElseIf',
  'End',
  'Select',
  'Case',
  'For',
  'To',
  'Step',
  'Next',
  'While',
  'Wend',
  'Do',
  'Loop',
  'Until',
  'Exit',
  'GoTo',
  'GoSub',
  'Return',
  'On',
  'Error',
  'Resume',
  'With',

  // Declarations
  'Dim',
  'Private',
  'Public',
  'Static',
  'Const',
  'ReDim',
  'Preserve',
  'Declare',
  'Lib',
  'Alias',
  'ByVal',
  'ByRef',
  'Optional',
  'ParamArray',

  // Procedures
  'Sub',
  'Function',
  'Property',
  'Get',
  'Let',
  'Set',
  'Event',
  'RaiseEvent',
  'Implements',
  'Enum',
  'Type',

  // Operators
  'And',
  'Or',
  'Not',
  'Xor',
  'Eqv',
  'Imp',
  'Mod',
  'Is',
  'Like',
  'TypeOf',
  'New',
  'Nothing',
  'Me',
  'MyBase',
  'MyClass',

  // Data types
  'As',
  'Boolean',
  'Byte',
  'Currency',
  'Date',
  'Decimal',
  'Double',
  'Integer',
  'Long',
  'Object',
  'Single',
  'String',
  'Variant',
  'Any',

  // Boolean values
  'True',
  'False',
  'Null',
  'Empty',

  // Other keywords
  'Call',
  'Let',
  'Option',
  'Explicit',
  'Compare',
  'Binary',
  'Text',
  'Base',
  'Attribute',
  'Friend',
  'DefBool',
  'DefByte',
  'DefCur',
  'DefDate',
  'DefDbl',
  'DefInt',
  'DefLng',
  'DefObj',
  'DefSng',
  'DefStr',
  'DefVar',
];

// ============================================================================
// VB6 Built-in Functions
// ============================================================================

export const VB6Functions = [
  // String functions
  {
    name: 'Asc',
    snippet: 'Asc(${1:string})',
    doc: 'Returns the ANSI character code for the first character of a string',
  },
  {
    name: 'AscB',
    snippet: 'AscB(${1:string})',
    doc: 'Returns the byte value of the first byte of a string',
  },
  {
    name: 'AscW',
    snippet: 'AscW(${1:string})',
    doc: 'Returns the Unicode character code for the first character of a string',
  },
  {
    name: 'Chr',
    snippet: 'Chr(${1:charcode})',
    doc: 'Returns a string containing the character associated with the specified character code',
  },
  { name: 'ChrB', snippet: 'ChrB(${1:bytevalue})', doc: 'Returns a single byte character' },
  { name: 'ChrW', snippet: 'ChrW(${1:charcode})', doc: 'Returns a Unicode character' },
  {
    name: 'InStr',
    snippet: 'InStr(${1:start}, ${2:string1}, ${3:string2})',
    doc: 'Returns the position of the first occurrence of one string within another',
  },
  {
    name: 'InStrB',
    snippet: 'InStrB(${1:start}, ${2:string1}, ${3:string2})',
    doc: 'Returns the byte position of one string within another',
  },
  {
    name: 'InStrRev',
    snippet: 'InStrRev(${1:stringcheck}, ${2:stringmatch})',
    doc: 'Returns the position of the last occurrence of one string within another',
  },
  {
    name: 'LCase',
    snippet: 'LCase(${1:string})',
    doc: 'Returns a string that has been converted to lowercase',
  },
  {
    name: 'UCase',
    snippet: 'UCase(${1:string})',
    doc: 'Returns a string that has been converted to uppercase',
  },
  {
    name: 'Left',
    snippet: 'Left(${1:string}, ${2:length})',
    doc: 'Returns a specified number of characters from the left side of a string',
  },
  {
    name: 'LeftB',
    snippet: 'LeftB(${1:string}, ${2:length})',
    doc: 'Returns a specified number of bytes from the left side of a string',
  },
  {
    name: 'Right',
    snippet: 'Right(${1:string}, ${2:length})',
    doc: 'Returns a specified number of characters from the right side of a string',
  },
  {
    name: 'RightB',
    snippet: 'RightB(${1:string}, ${2:length})',
    doc: 'Returns a specified number of bytes from the right side of a string',
  },
  {
    name: 'Mid',
    snippet: 'Mid(${1:string}, ${2:start}, ${3:length})',
    doc: 'Returns a specified number of characters from a string',
  },
  {
    name: 'MidB',
    snippet: 'MidB(${1:string}, ${2:start}, ${3:length})',
    doc: 'Returns a specified number of bytes from a string',
  },
  { name: 'Len', snippet: 'Len(${1:string})', doc: 'Returns the number of characters in a string' },
  { name: 'LenB', snippet: 'LenB(${1:string})', doc: 'Returns the number of bytes in a string' },
  { name: 'LTrim', snippet: 'LTrim(${1:string})', doc: 'Removes leading spaces from a string' },
  { name: 'RTrim', snippet: 'RTrim(${1:string})', doc: 'Removes trailing spaces from a string' },
  {
    name: 'Trim',
    snippet: 'Trim(${1:string})',
    doc: 'Removes leading and trailing spaces from a string',
  },
  {
    name: 'Space',
    snippet: 'Space(${1:number})',
    doc: 'Returns a string consisting of a specified number of spaces',
  },
  {
    name: 'String',
    snippet: 'String(${1:number}, ${2:character})',
    doc: 'Returns a string of repeating character',
  },
  { name: 'StrComp', snippet: 'StrComp(${1:string1}, ${2:string2})', doc: 'Compares two strings' },
  {
    name: 'StrConv',
    snippet: 'StrConv(${1:string}, ${2:conversion})',
    doc: 'Converts a string as specified',
  },
  { name: 'StrReverse', snippet: 'StrReverse(${1:string})', doc: 'Reverses a string' },
  {
    name: 'Replace',
    snippet: 'Replace(${1:expression}, ${2:find}, ${3:replace})',
    doc: 'Returns a string with occurrences of a substring replaced',
  },
  {
    name: 'Split',
    snippet: 'Split(${1:expression}, ${2:delimiter})',
    doc: 'Splits a string into an array of substrings',
  },
  {
    name: 'Join',
    snippet: 'Join(${1:sourcearray}, ${2:delimiter})',
    doc: 'Joins elements of an array into a string',
  },
  {
    name: 'Filter',
    snippet: 'Filter(${1:sourcearray}, ${2:match})',
    doc: 'Returns an array containing elements that match a filter',
  },
  {
    name: 'Format',
    snippet: 'Format(${1:expression}, ${2:format})',
    doc: 'Formats an expression as specified',
  },

  // Math functions
  { name: 'Abs', snippet: 'Abs(${1:number})', doc: 'Returns the absolute value of a number' },
  {
    name: 'Sgn',
    snippet: 'Sgn(${1:number})',
    doc: 'Returns an integer indicating the sign of a number',
  },
  { name: 'Int', snippet: 'Int(${1:number})', doc: 'Returns the integer portion of a number' },
  {
    name: 'Fix',
    snippet: 'Fix(${1:number})',
    doc: 'Returns the integer portion of a number (truncated toward zero)',
  },
  {
    name: 'Round',
    snippet: 'Round(${1:number}, ${2:numdecimalplaces})',
    doc: 'Rounds a number to a specified number of decimal places',
  },
  { name: 'Sqr', snippet: 'Sqr(${1:number})', doc: 'Returns the square root of a number' },
  { name: 'Exp', snippet: 'Exp(${1:number})', doc: 'Returns e raised to a power' },
  { name: 'Log', snippet: 'Log(${1:number})', doc: 'Returns the natural logarithm of a number' },
  { name: 'Sin', snippet: 'Sin(${1:number})', doc: 'Returns the sine of an angle' },
  { name: 'Cos', snippet: 'Cos(${1:number})', doc: 'Returns the cosine of an angle' },
  { name: 'Tan', snippet: 'Tan(${1:number})', doc: 'Returns the tangent of an angle' },
  { name: 'Atn', snippet: 'Atn(${1:number})', doc: 'Returns the arctangent of a number' },
  { name: 'Rnd', snippet: 'Rnd(${1:number})', doc: 'Returns a random number' },
  {
    name: 'Randomize',
    snippet: 'Randomize ${1:number}',
    doc: 'Initializes the random-number generator',
  },

  // Date/Time functions
  { name: 'Date', snippet: 'Date', doc: 'Returns the current system date' },
  { name: 'Time', snippet: 'Time', doc: 'Returns the current system time' },
  { name: 'Now', snippet: 'Now', doc: 'Returns the current date and time' },
  { name: 'Timer', snippet: 'Timer', doc: 'Returns the number of seconds elapsed since midnight' },
  { name: 'Year', snippet: 'Year(${1:date})', doc: 'Returns the year of a date' },
  { name: 'Month', snippet: 'Month(${1:date})', doc: 'Returns the month of a date' },
  { name: 'Day', snippet: 'Day(${1:date})', doc: 'Returns the day of a date' },
  { name: 'Hour', snippet: 'Hour(${1:time})', doc: 'Returns the hour of a time' },
  { name: 'Minute', snippet: 'Minute(${1:time})', doc: 'Returns the minute of a time' },
  { name: 'Second', snippet: 'Second(${1:time})', doc: 'Returns the second of a time' },
  { name: 'Weekday', snippet: 'Weekday(${1:date})', doc: 'Returns the day of the week' },
  {
    name: 'DateSerial',
    snippet: 'DateSerial(${1:year}, ${2:month}, ${3:day})',
    doc: 'Returns a Date value for a specified year, month, and day',
  },
  {
    name: 'TimeSerial',
    snippet: 'TimeSerial(${1:hour}, ${2:minute}, ${3:second})',
    doc: 'Returns a Date value for a specified hour, minute, and second',
  },
  {
    name: 'DateValue',
    snippet: 'DateValue(${1:string})',
    doc: 'Returns a Date value from a string',
  },
  {
    name: 'TimeValue',
    snippet: 'TimeValue(${1:string})',
    doc: 'Returns a Date value from a string',
  },
  {
    name: 'DateAdd',
    snippet: 'DateAdd("${1:interval}", ${2:number}, ${3:date})',
    doc: 'Returns a date with a specified time interval added',
  },
  {
    name: 'DateDiff',
    snippet: 'DateDiff("${1:interval}", ${2:date1}, ${3:date2})',
    doc: 'Returns the number of intervals between two dates',
  },
  {
    name: 'DatePart',
    snippet: 'DatePart("${1:interval}", ${2:date})',
    doc: 'Returns a specified part of a date',
  },
  { name: 'MonthName', snippet: 'MonthName(${1:month})', doc: 'Returns the name of a month' },
  {
    name: 'WeekdayName',
    snippet: 'WeekdayName(${1:weekday})',
    doc: 'Returns the name of a day of the week',
  },

  // Conversion functions
  { name: 'CBool', snippet: 'CBool(${1:expression})', doc: 'Converts an expression to Boolean' },
  { name: 'CByte', snippet: 'CByte(${1:expression})', doc: 'Converts an expression to Byte' },
  { name: 'CCur', snippet: 'CCur(${1:expression})', doc: 'Converts an expression to Currency' },
  { name: 'CDate', snippet: 'CDate(${1:expression})', doc: 'Converts an expression to Date' },
  { name: 'CDbl', snippet: 'CDbl(${1:expression})', doc: 'Converts an expression to Double' },
  { name: 'CDec', snippet: 'CDec(${1:expression})', doc: 'Converts an expression to Decimal' },
  { name: 'CInt', snippet: 'CInt(${1:expression})', doc: 'Converts an expression to Integer' },
  { name: 'CLng', snippet: 'CLng(${1:expression})', doc: 'Converts an expression to Long' },
  { name: 'CSng', snippet: 'CSng(${1:expression})', doc: 'Converts an expression to Single' },
  { name: 'CStr', snippet: 'CStr(${1:expression})', doc: 'Converts an expression to String' },
  { name: 'CVar', snippet: 'CVar(${1:expression})', doc: 'Converts an expression to Variant' },
  { name: 'Val', snippet: 'Val(${1:string})', doc: 'Returns the numbers contained in a string' },
  { name: 'Str', snippet: 'Str(${1:number})', doc: 'Returns a string representation of a number' },
  {
    name: 'Hex',
    snippet: 'Hex(${1:number})',
    doc: 'Returns a string representing the hexadecimal value',
  },
  {
    name: 'Oct',
    snippet: 'Oct(${1:number})',
    doc: 'Returns a string representing the octal value',
  },

  // Type checking functions
  {
    name: 'IsArray',
    snippet: 'IsArray(${1:varname})',
    doc: 'Returns True if a variable is an array',
  },
  {
    name: 'IsDate',
    snippet: 'IsDate(${1:expression})',
    doc: 'Returns True if an expression can be converted to a date',
  },
  {
    name: 'IsEmpty',
    snippet: 'IsEmpty(${1:expression})',
    doc: 'Returns True if a variable is uninitialized',
  },
  {
    name: 'IsError',
    snippet: 'IsError(${1:expression})',
    doc: 'Returns True if an expression is an error value',
  },
  {
    name: 'IsMissing',
    snippet: 'IsMissing(${1:argname})',
    doc: 'Returns True if an optional argument was not passed',
  },
  {
    name: 'IsNull',
    snippet: 'IsNull(${1:expression})',
    doc: 'Returns True if an expression contains Null',
  },
  {
    name: 'IsNumeric',
    snippet: 'IsNumeric(${1:expression})',
    doc: 'Returns True if an expression can be evaluated as a number',
  },
  {
    name: 'IsObject',
    snippet: 'IsObject(${1:expression})',
    doc: 'Returns True if an identifier represents an object variable',
  },
  {
    name: 'TypeName',
    snippet: 'TypeName(${1:varname})',
    doc: 'Returns a string describing the data type of a variable',
  },
  {
    name: 'VarType',
    snippet: 'VarType(${1:varname})',
    doc: 'Returns an integer indicating the subtype of a variable',
  },

  // Array functions
  { name: 'Array', snippet: 'Array(${1:arglist})', doc: 'Returns a Variant containing an array' },
  {
    name: 'LBound',
    snippet: 'LBound(${1:arrayname})',
    doc: 'Returns the smallest subscript for the indicated dimension of an array',
  },
  {
    name: 'UBound',
    snippet: 'UBound(${1:arrayname})',
    doc: 'Returns the largest subscript for the indicated dimension of an array',
  },

  // File functions
  {
    name: 'Dir',
    snippet: 'Dir(${1:pathname})',
    doc: 'Returns a string representing the name of a file, directory, or folder',
  },
  {
    name: 'EOF',
    snippet: 'EOF(${1:filenumber})',
    doc: 'Returns True when the end of a file has been reached',
  },
  { name: 'LOF', snippet: 'LOF(${1:filenumber})', doc: 'Returns the size of an open file' },
  {
    name: 'Loc',
    snippet: 'Loc(${1:filenumber})',
    doc: 'Returns the current read/write position within an open file',
  },
  {
    name: 'Seek',
    snippet: 'Seek(${1:filenumber})',
    doc: 'Returns the current read/write position within a file',
  },
  {
    name: 'FreeFile',
    snippet: 'FreeFile',
    doc: 'Returns the next file number available for use by the Open statement',
  },
  {
    name: 'FileLen',
    snippet: 'FileLen(${1:pathname})',
    doc: 'Returns the length of a file in bytes',
  },
  {
    name: 'FileDateTime',
    snippet: 'FileDateTime(${1:pathname})',
    doc: 'Returns the date and time when a file was created or last modified',
  },
  {
    name: 'GetAttr',
    snippet: 'GetAttr(${1:pathname})',
    doc: 'Returns an integer representing the attributes of a file, directory, or folder',
  },
  { name: 'CurDir', snippet: 'CurDir', doc: 'Returns the current path' },

  // Object functions
  {
    name: 'CreateObject',
    snippet: 'CreateObject("${1:class}")',
    doc: 'Creates and returns a reference to an ActiveX object',
  },
  {
    name: 'GetObject',
    snippet: 'GetObject("${1:pathname}")',
    doc: 'Returns a reference to an object provided by an ActiveX component',
  },

  // Miscellaneous functions
  {
    name: 'MsgBox',
    snippet: 'MsgBox("${1:prompt}", ${2:vbOKOnly}, "${3:title}")',
    doc: 'Displays a message in a dialog box',
  },
  {
    name: 'InputBox',
    snippet: 'InputBox("${1:prompt}", "${2:title}", "${3:default}")',
    doc: 'Displays a prompt in a dialog box and returns the user input',
  },
  {
    name: 'IIf',
    snippet: 'IIf(${1:expression}, ${2:truepart}, ${3:falsepart})',
    doc: 'Returns one of two parts depending on the evaluation of an expression',
  },
  {
    name: 'Choose',
    snippet: 'Choose(${1:index}, ${2:choice1})',
    doc: 'Returns a value from a list of arguments',
  },
  {
    name: 'Switch',
    snippet: 'Switch(${1:expr1}, ${2:value1})',
    doc: 'Evaluates a list of expressions and returns a value',
  },
  {
    name: 'Environ',
    snippet: 'Environ("${1:envstring}")',
    doc: 'Returns the string associated with an operating system environment variable',
  },
  {
    name: 'DoEvents',
    snippet: 'DoEvents',
    doc: 'Yields execution to allow the operating system to process other events',
  },
  {
    name: 'Shell',
    snippet: 'Shell("${1:pathname}", ${2:vbNormalFocus})',
    doc: 'Runs an executable program',
  },
  { name: 'Beep', snippet: 'Beep', doc: 'Sounds a tone through the computer speaker' },
  {
    name: 'RGB',
    snippet: 'RGB(${1:red}, ${2:green}, ${3:blue})',
    doc: 'Returns a whole number representing an RGB color value',
  },
  {
    name: 'QBColor',
    snippet: 'QBColor(${1:color})',
    doc: 'Returns the RGB color code corresponding to a color number',
  },
];

// ============================================================================
// VB6 Statements
// ============================================================================

export const VB6Statements = [
  // File statements
  {
    name: 'Open',
    snippet: 'Open "${1:filename}" For ${2:Input} As #${3:1}',
    doc: 'Opens a file for input or output',
  },
  {
    name: 'Close',
    snippet: 'Close #${1:1}',
    doc: 'Closes one or all files opened with the Open statement',
  },
  {
    name: 'Print',
    snippet: 'Print #${1:1}, ${2:expression}',
    doc: 'Writes data to a sequential file',
  },
  {
    name: 'Write',
    snippet: 'Write #${1:1}, ${2:expression}',
    doc: 'Writes data to a sequential file in a delimited format',
  },
  {
    name: 'Input',
    snippet: 'Input #${1:1}, ${2:varname}',
    doc: 'Reads data from an open sequential file',
  },
  {
    name: 'Line Input',
    snippet: 'Line Input #${1:1}, ${2:varname}',
    doc: 'Reads a line from a sequential file',
  },
  {
    name: 'Get',
    snippet: 'Get #${1:1}, ${2:recnumber}, ${3:varname}',
    doc: 'Reads data from an open disk file into a variable',
  },
  {
    name: 'Put',
    snippet: 'Put #${1:1}, ${2:recnumber}, ${3:varname}',
    doc: 'Writes data from a variable to a disk file',
  },
  { name: 'Kill', snippet: 'Kill "${1:pathname}"', doc: 'Deletes files from a disk' },
  {
    name: 'Name',
    snippet: 'Name "${1:oldpathname}" As "${2:newpathname}"',
    doc: 'Renames a disk file',
  },
  { name: 'FileCopy', snippet: 'FileCopy "${1:source}", "${2:destination}"', doc: 'Copies a file' },
  { name: 'MkDir', snippet: 'MkDir "${1:path}"', doc: 'Creates a new directory' },
  { name: 'RmDir', snippet: 'RmDir "${1:path}"', doc: 'Removes an empty directory' },
  { name: 'ChDir', snippet: 'ChDir "${1:path}"', doc: 'Changes the current directory' },
  { name: 'ChDrive', snippet: 'ChDrive "${1:drive}"', doc: 'Changes the current drive' },
  {
    name: 'SetAttr',
    snippet: 'SetAttr "${1:pathname}", ${2:attributes}',
    doc: 'Sets attribute information for a file',
  },
];

// ============================================================================
// VB6 Code Snippets
// ============================================================================

export const VB6Snippets = [
  // Control flow snippets
  {
    label: 'If...Then...End If',
    snippet: 'If ${1:condition} Then\n\t${2:statements}\nEnd If',
    doc: 'If...Then...End If block',
  },
  {
    label: 'If...Then...Else...End If',
    snippet: 'If ${1:condition} Then\n\t${2:truestatements}\nElse\n\t${3:falsestatements}\nEnd If',
    doc: 'If...Then...Else...End If block',
  },
  {
    label: 'Select Case',
    snippet:
      'Select Case ${1:expression}\n\tCase ${2:value1}\n\t\t${3:statements}\n\tCase Else\n\t\t${4:defaultstatements}\nEnd Select',
    doc: 'Select Case block',
  },
  {
    label: 'For...Next',
    snippet: 'For ${1:counter} = ${2:start} To ${3:end}\n\t${4:statements}\nNext ${1:counter}',
    doc: 'For...Next loop',
  },
  {
    label: 'For Each...Next',
    snippet: 'For Each ${1:element} In ${2:collection}\n\t${3:statements}\nNext ${1:element}',
    doc: 'For Each...Next loop',
  },
  {
    label: 'Do While...Loop',
    snippet: 'Do While ${1:condition}\n\t${2:statements}\nLoop',
    doc: 'Do While...Loop block',
  },
  {
    label: 'Do...Loop Until',
    snippet: 'Do\n\t${1:statements}\nLoop Until ${2:condition}',
    doc: 'Do...Loop Until block',
  },
  {
    label: 'While...Wend',
    snippet: 'While ${1:condition}\n\t${2:statements}\nWend',
    doc: 'While...Wend block',
  },
  {
    label: 'With...End With',
    snippet: 'With ${1:object}\n\t${2:statements}\nEnd With',
    doc: 'With...End With block',
  },

  // Procedure snippets
  {
    label: 'Sub',
    snippet: 'Private Sub ${1:SubName}(${2:parameters})\n\t${3:statements}\nEnd Sub',
    doc: 'Private Sub procedure',
  },
  {
    label: 'Function',
    snippet:
      'Private Function ${1:FunctionName}(${2:parameters}) As ${3:ReturnType}\n\t${4:statements}\n\t${1:FunctionName} = ${5:returnvalue}\nEnd Function',
    doc: 'Private Function procedure',
  },
  {
    label: 'Property Get',
    snippet:
      'Public Property Get ${1:PropertyName}() As ${2:DataType}\n\t${1:PropertyName} = m_${1:PropertyName}\nEnd Property',
    doc: 'Property Get procedure',
  },
  {
    label: 'Property Let',
    snippet:
      'Public Property Let ${1:PropertyName}(ByVal ${2:Value} As ${3:DataType})\n\tm_${1:PropertyName} = ${2:Value}\nEnd Property',
    doc: 'Property Let procedure',
  },
  {
    label: 'Property Set',
    snippet:
      'Public Property Set ${1:PropertyName}(ByVal ${2:Value} As ${3:Object})\n\tSet m_${1:PropertyName} = ${2:Value}\nEnd Property',
    doc: 'Property Set procedure',
  },

  // Error handling snippets
  {
    label: 'On Error GoTo',
    snippet:
      'On Error GoTo ${1:ErrorHandler}\n\t${2:statements}\nExit Sub\n\n${1:ErrorHandler}:\n\tMsgBox Err.Description\n\tResume Next',
    doc: 'Error handling with GoTo',
  },
  {
    label: 'On Error Resume Next',
    snippet:
      'On Error Resume Next\n${1:statements}\nIf Err.Number <> 0 Then\n\t${2:errorhandling}\n\tErr.Clear\nEnd If',
    doc: 'Error handling with Resume Next',
  },

  // Event handler snippets
  {
    label: 'Form_Load',
    snippet: 'Private Sub Form_Load()\n\t${1:statements}\nEnd Sub',
    doc: 'Form Load event handler',
  },
  {
    label: 'Form_Unload',
    snippet: 'Private Sub Form_Unload(Cancel As Integer)\n\t${1:statements}\nEnd Sub',
    doc: 'Form Unload event handler',
  },
  {
    label: 'Control_Click',
    snippet: 'Private Sub ${1:ControlName}_Click()\n\t${2:statements}\nEnd Sub',
    doc: 'Control Click event handler',
  },
  {
    label: 'Control_Change',
    snippet: 'Private Sub ${1:ControlName}_Change()\n\t${2:statements}\nEnd Sub',
    doc: 'Control Change event handler',
  },
  {
    label: 'Timer_Timer',
    snippet: 'Private Sub ${1:Timer1}_Timer()\n\t${2:statements}\nEnd Sub',
    doc: 'Timer event handler',
  },
];

// ============================================================================
// VB6 Common Properties
// ============================================================================

export const VB6Properties = [
  'Caption',
  'Text',
  'Value',
  'Enabled',
  'Visible',
  'Name',
  'Tag',
  'Left',
  'Top',
  'Width',
  'Height',
  'TabIndex',
  'TabStop',
  'BackColor',
  'ForeColor',
  'Font',
  'FontName',
  'FontSize',
  'FontBold',
  'FontItalic',
  'FontUnderline',
  'BorderStyle',
  'Appearance',
  'MousePointer',
  'ToolTipText',
  'WhatsThisHelpID',
  'HelpContextID',
  'Index',
  'Parent',
  'Container',
  'hWnd',
  'hDC',
  'Picture',
  'Image',
  'Icon',
  'AutoSize',
  'Stretch',
  'Alignment',
  'MultiLine',
  'ScrollBars',
  'WordWrap',
  'Locked',
  'MaxLength',
  'PasswordChar',
  'SelStart',
  'SelLength',
  'SelText',
  'ListCount',
  'ListIndex',
  'List',
  'ItemData',
  'NewIndex',
  'TopIndex',
  'Sorted',
  'Style',
  'Columns',
  'RowHeight',
  'Min',
  'Max',
  'SmallChange',
  'LargeChange',
  'Interval',
  'Drive',
  'Path',
  'FileName',
  'Pattern',
  'Archive',
  'Hidden',
  'ReadOnly',
  'System',
  'Normal',
];

// ============================================================================
// VB6 Common Events
// ============================================================================

export const VB6Events = [
  'Click',
  'DblClick',
  'Change',
  'GotFocus',
  'LostFocus',
  'KeyPress',
  'KeyDown',
  'KeyUp',
  'MouseDown',
  'MouseUp',
  'MouseMove',
  'Load',
  'Unload',
  'Initialize',
  'Terminate',
  'Activate',
  'Deactivate',
  'Resize',
  'Paint',
  'QueryUnload',
  'Timer',
  'Scroll',
  'Validate',
  'ItemCheck',
  'OLEDragDrop',
  'OLEDragOver',
  'OLEStartDrag',
  'DropDown',
  'CloseUp',
  'PathChange',
  'PatternChange',
  'DriveChange',
  'Error',
  'LinkOpen',
  'LinkClose',
  'LinkError',
  'LinkExecute',
  'LinkNotify',
];

// ============================================================================
// Register VB6 Language with Monaco
// ============================================================================

export function registerVB6Language(monaco: typeof Monaco): void {
  // Register language if not already registered
  const existingLang = monaco.languages.getLanguages().find(l => l.id === 'vb6');
  if (existingLang) return;

  monaco.languages.register({ id: 'vb6', aliases: ['VB6', 'Visual Basic 6', 'vb'] });

  // Define token provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider('vb6', {
    defaultToken: '',
    ignoreCase: true,

    keywords: VB6Keywords.map(k => k.toLowerCase()),

    builtinFunctions: VB6Functions.map(f => f.name.toLowerCase()),

    operators: ['=', '>', '<', '<=', '>=', '<>', '+', '-', '*', '/', '\\', '^', '&', 'Mod'],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    tokenizer: {
      root: [
        // Comments
        [/'.*$/, 'comment'],
        [/Rem\s.*$/, 'comment'],

        // Strings
        [/"[^"]*"/, 'string'],

        // Numbers
        [/\b\d+\.?\d*\b/, 'number'],
        [/&H[0-9A-Fa-f]+/, 'number.hex'],
        [/&O[0-7]+/, 'number.octal'],

        // Keywords
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@builtinFunctions': 'predefined',
              '@default': 'identifier',
            },
          },
        ],

        // Operators
        [/@symbols/, 'operator'],

        // Delimiters
        [/[{}()\[\]]/, '@brackets'],
        [/[,;:]/, 'delimiter'],
      ],
    },
  });

  // Language configuration
  monaco.languages.setLanguageConfiguration('vb6', {
    comments: {
      lineComment: "'",
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    folding: {
      markers: {
        start: /^\s*(Sub|Function|Property|If|For|While|Do|With|Select|Type|Enum)\b/i,
        end: /^\s*(End\s+(Sub|Function|Property|If|For|While|Select|Type|Enum)|Loop|Wend|Next)\b/i,
      },
    },
    indentationRules: {
      increaseIndentPattern:
        /^\s*(Sub|Function|Property|If|For|While|Do|With|Select|Case|Type|Enum)\b/i,
      decreaseIndentPattern: /^\s*(End|Loop|Wend|Next|Else|ElseIf|Case)\b/i,
    },
  });

  // Register completion provider
  monaco.languages.registerCompletionItemProvider('vb6', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const suggestions: Monaco.languages.CompletionItem[] = [];
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      // Add keywords
      VB6Keywords.forEach(keyword => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
        });
      });

      // Add functions with snippets
      VB6Functions.forEach(func => {
        suggestions.push({
          label: func.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: func.snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: func.doc,
          range,
        });
      });

      // Add statements
      VB6Statements.forEach(stmt => {
        suggestions.push({
          label: stmt.name,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: stmt.snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: stmt.doc,
          range,
        });
      });

      // Add snippets
      VB6Snippets.forEach(snippet => {
        suggestions.push({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.doc,
          range,
        });
      });

      // Add properties
      VB6Properties.forEach(prop => {
        suggestions.push({
          label: prop,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: prop,
          range,
        });
      });

      // Add events
      VB6Events.forEach(event => {
        suggestions.push({
          label: event,
          kind: monaco.languages.CompletionItemKind.Event,
          insertText: event,
          range,
        });
      });

      return { suggestions };
    },
  });

  // Register hover provider
  monaco.languages.registerHoverProvider('vb6', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const wordLower = word.word.toLowerCase();

      // Check if it's a function
      const func = VB6Functions.find(f => f.name.toLowerCase() === wordLower);
      if (func) {
        return {
          contents: [{ value: `**${func.name}**` }, { value: func.doc }],
        };
      }

      // Check if it's a statement
      const stmt = VB6Statements.find(s => s.name.toLowerCase() === wordLower);
      if (stmt) {
        return {
          contents: [{ value: `**${stmt.name}**` }, { value: stmt.doc }],
        };
      }

      // Check if it's a keyword
      if (VB6Keywords.map(k => k.toLowerCase()).includes(wordLower)) {
        return {
          contents: [{ value: `**${word.word}** (VB6 Keyword)` }],
        };
      }

      return null;
    },
  });
}

export default {
  VB6Keywords,
  VB6Functions,
  VB6Statements,
  VB6Snippets,
  VB6Properties,
  VB6Events,
  registerVB6Language,
};
