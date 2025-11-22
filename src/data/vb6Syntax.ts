// VB6 Keywords
export const vb6Keywords = [
  'As', 'And', 'ByRef', 'ByVal', 'Call', 'Case', 'Const', 'Dim', 'Do',
  'Each', 'Else', 'ElseIf', 'End', 'Exit', 'False', 'For', 'Function',
  'Get', 'GoTo', 'If', 'In', 'Is', 'Let', 'Loop', 'Me', 'Mod', 'New',
  'Next', 'Not', 'Nothing', 'Null', 'On', 'Option', 'Or', 'Private',
  'Property', 'Public', 'ReDim', 'Resume', 'Return', 'Select', 'Set',
  'Static', 'Step', 'Sub', 'Then', 'To', 'True', 'Type', 'Until',
  'Variant', 'Wend', 'While', 'With', 'Xor', 'Enum', 'Error', 'GoSub',
  'Implements', 'Interface', 'Optional', 'ParamArray', 'Preserve',
  'RaiseEvent', 'WithEvents', 'AddressOf', 'Alias', 'Any', 'Friend',
  'Global', 'Lib', 'Like', 'LSet', 'RSet', 'Stop', 'TypeOf'
];

// VB6 Data Types
export const vb6DataTypes = [
  'Boolean', 'Byte', 'Currency', 'Date', 'Double', 'Integer', 'Long',
  'Object', 'Single', 'String', 'Variant', 'Collection', 'Dictionary'
];

// VB6 Built-in Functions
export const vb6Functions = [
  // String Functions
  { name: 'Left', syntax: 'Left(string, length)', description: 'Returns a specified number of characters from the left side of a string' },
  { name: 'Right', syntax: 'Right(string, length)', description: 'Returns a specified number of characters from the right side of a string' },
  { name: 'Mid', syntax: 'Mid(string, start[, length])', description: 'Returns a specified number of characters from a string' },
  { name: 'Len', syntax: 'Len(string)', description: 'Returns the number of characters in a string' },
  { name: 'Trim', syntax: 'Trim(string)', description: 'Removes leading and trailing spaces from a string' },
  { name: 'LTrim', syntax: 'LTrim(string)', description: 'Removes leading spaces from a string' },
  { name: 'RTrim', syntax: 'RTrim(string)', description: 'Removes trailing spaces from a string' },
  { name: 'UCase', syntax: 'UCase(string)', description: 'Converts a string to uppercase' },
  { name: 'LCase', syntax: 'LCase(string)', description: 'Converts a string to lowercase' },
  { name: 'InStr', syntax: 'InStr([start, ]string1, string2[, compare])', description: 'Returns the position of the first occurrence of one string within another' },
  { name: 'Replace', syntax: 'Replace(expression, find, replace[, start[, count[, compare]]])', description: 'Replaces text in a string' },
  { name: 'Split', syntax: 'Split(expression[, delimiter[, limit[, compare]]])', description: 'Splits a string into an array' },
  { name: 'Join', syntax: 'Join(array[, delimiter])', description: 'Joins array elements into a string' },
  { name: 'StrComp', syntax: 'StrComp(string1, string2[, compare])', description: 'Compares two strings' },
  { name: 'StrReverse', syntax: 'StrReverse(string)', description: 'Reverses a string' },
  { name: 'Space', syntax: 'Space(number)', description: 'Returns a string of spaces' },
  { name: 'String', syntax: 'String(number, character)', description: 'Returns a repeating character string' },
  
  // Numeric Functions
  { name: 'Abs', syntax: 'Abs(number)', description: 'Returns the absolute value of a number' },
  { name: 'Int', syntax: 'Int(number)', description: 'Returns the integer portion of a number' },
  { name: 'Fix', syntax: 'Fix(number)', description: 'Returns the integer portion of a number' },
  { name: 'Round', syntax: 'Round(expression[, numdecimalplaces])', description: 'Rounds a number to a specified number of decimal places' },
  { name: 'Sgn', syntax: 'Sgn(number)', description: 'Returns the sign of a number' },
  { name: 'Sqr', syntax: 'Sqr(number)', description: 'Returns the square root of a number' },
  { name: 'Exp', syntax: 'Exp(number)', description: 'Returns e raised to a power' },
  { name: 'Log', syntax: 'Log(number)', description: 'Returns the natural logarithm of a number' },
  { name: 'Sin', syntax: 'Sin(number)', description: 'Returns the sine of an angle' },
  { name: 'Cos', syntax: 'Cos(number)', description: 'Returns the cosine of an angle' },
  { name: 'Tan', syntax: 'Tan(number)', description: 'Returns the tangent of an angle' },
  { name: 'Atn', syntax: 'Atn(number)', description: 'Returns the arctangent of a number' },
  { name: 'Rnd', syntax: 'Rnd[(number)]', description: 'Returns a random number' },
  
  // Date/Time Functions
  { name: 'Now', syntax: 'Now', description: 'Returns the current date and time' },
  { name: 'Date', syntax: 'Date', description: 'Returns the current date' },
  { name: 'Time', syntax: 'Time', description: 'Returns the current time' },
  { name: 'DateAdd', syntax: 'DateAdd(interval, number, date)', description: 'Adds a time interval to a date' },
  { name: 'DateDiff', syntax: 'DateDiff(interval, date1, date2[, firstdayofweek[, firstweekofyear]])', description: 'Returns the difference between two dates' },
  { name: 'DatePart', syntax: 'DatePart(interval, date[, firstdayofweek[, firstweekofyear]])', description: 'Returns a part of a date' },
  { name: 'Day', syntax: 'Day(date)', description: 'Returns the day of the month' },
  { name: 'Month', syntax: 'Month(date)', description: 'Returns the month' },
  { name: 'Year', syntax: 'Year(date)', description: 'Returns the year' },
  { name: 'Hour', syntax: 'Hour(time)', description: 'Returns the hour' },
  { name: 'Minute', syntax: 'Minute(time)', description: 'Returns the minute' },
  { name: 'Second', syntax: 'Second(time)', description: 'Returns the second' },
  { name: 'Timer', syntax: 'Timer', description: 'Returns the number of seconds since midnight' },
  
  // Conversion Functions
  { name: 'CStr', syntax: 'CStr(expression)', description: 'Converts an expression to String' },
  { name: 'CInt', syntax: 'CInt(expression)', description: 'Converts an expression to Integer' },
  { name: 'CLng', syntax: 'CLng(expression)', description: 'Converts an expression to Long' },
  { name: 'CDbl', syntax: 'CDbl(expression)', description: 'Converts an expression to Double' },
  { name: 'CSng', syntax: 'CSng(expression)', description: 'Converts an expression to Single' },
  { name: 'CCur', syntax: 'CCur(expression)', description: 'Converts an expression to Currency' },
  { name: 'CDate', syntax: 'CDate(expression)', description: 'Converts an expression to Date' },
  { name: 'CBool', syntax: 'CBool(expression)', description: 'Converts an expression to Boolean' },
  { name: 'CByte', syntax: 'CByte(expression)', description: 'Converts an expression to Byte' },
  { name: 'CVar', syntax: 'CVar(expression)', description: 'Converts an expression to Variant' },
  { name: 'Val', syntax: 'Val(string)', description: 'Returns the numeric value of a string' },
  { name: 'Str', syntax: 'Str(number)', description: 'Returns a string representation of a number' },
  
  // Array Functions
  { name: 'Array', syntax: 'Array(arglist)', description: 'Returns a Variant containing an array' },
  { name: 'UBound', syntax: 'UBound(array[, dimension])', description: 'Returns the upper bound of an array' },
  { name: 'LBound', syntax: 'LBound(array[, dimension])', description: 'Returns the lower bound of an array' },
  { name: 'Filter', syntax: 'Filter(array, match[, include[, compare]])', description: 'Returns an array containing subset of a string array' },
  
  // File Functions
  { name: 'Dir', syntax: 'Dir[(pathname[, attributes])]', description: 'Returns the name of a file or directory' },
  { name: 'FileCopy', syntax: 'FileCopy source, destination', description: 'Copies a file' },
  { name: 'Kill', syntax: 'Kill pathname', description: 'Deletes files' },
  { name: 'FileLen', syntax: 'FileLen(pathname)', description: 'Returns the length of a file' },
  { name: 'FileDateTime', syntax: 'FileDateTime(pathname)', description: 'Returns the date and time a file was last modified' },
  { name: 'FreeFile', syntax: 'FreeFile[(rangenumber)]', description: 'Returns the next available file number' },
  { name: 'EOF', syntax: 'EOF(filenumber)', description: 'Returns True if end of file reached' },
  { name: 'LOF', syntax: 'LOF(filenumber)', description: 'Returns the size of an open file' },
  
  // Interaction Functions
  { name: 'MsgBox', syntax: 'MsgBox(prompt[, buttons][, title][, helpfile, context])', description: 'Displays a message box' },
  { name: 'InputBox', syntax: 'InputBox(prompt[, title][, default][, xpos][, ypos][, helpfile, context])', description: 'Displays an input box' },
  { name: 'Shell', syntax: 'Shell(pathname[, windowstyle])', description: 'Runs an executable program' },
  
  // Information Functions
  { name: 'IsArray', syntax: 'IsArray(varname)', description: 'Returns True if variable is an array' },
  { name: 'IsDate', syntax: 'IsDate(expression)', description: 'Returns True if expression is a date' },
  { name: 'IsEmpty', syntax: 'IsEmpty(expression)', description: 'Returns True if variable is uninitialized' },
  { name: 'IsError', syntax: 'IsError(expression)', description: 'Returns True if expression is an error' },
  { name: 'IsNull', syntax: 'IsNull(expression)', description: 'Returns True if expression is Null' },
  { name: 'IsNumeric', syntax: 'IsNumeric(expression)', description: 'Returns True if expression is a number' },
  { name: 'IsObject', syntax: 'IsObject(expression)', description: 'Returns True if expression is an object' },
  { name: 'TypeName', syntax: 'TypeName(varname)', description: 'Returns the data type name of a variable' },
  { name: 'VarType', syntax: 'VarType(varname)', description: 'Returns the data type of a variable' }
];

// VB6 Properties by Control Type
export const vb6Properties: Record<string, string[]> = {
  common: [
    'Name', 'Left', 'Top', 'Width', 'Height', 'Visible', 'Enabled',
    'TabIndex', 'TabStop', 'ToolTipText', 'Tag', 'Index', 'Container',
    'Parent', 'hWnd', 'Font', 'ForeColor', 'BackColor', 'MousePointer',
    'MouseIcon', 'HelpContextID'
  ],
  Form: [
    'Caption', 'Icon', 'Picture', 'WindowState', 'BorderStyle', 'MaxButton',
    'MinButton', 'ControlBox', 'StartUpPosition', 'Moveable', 'AutoRedraw',
    'BackColor', 'ForeColor', 'FillColor', 'FillStyle', 'DrawMode',
    'DrawStyle', 'DrawWidth', 'ScaleMode', 'ScaleWidth', 'ScaleHeight',
    'KeyPreview', 'MDIChild', 'ShowInTaskbar', 'ScrollBars'
  ],
  CommandButton: [
    'Caption', 'Default', 'Cancel', 'Style', 'Picture', 'DownPicture',
    'DisabledPicture', 'MaskColor', 'UseMaskColor', 'Value'
  ],
  Label: [
    'Caption', 'Alignment', 'AutoSize', 'BackStyle', 'BorderStyle',
    'WordWrap', 'UseMnemonic'
  ],
  TextBox: [
    'Text', 'MultiLine', 'ScrollBars', 'PasswordChar', 'MaxLength',
    'Locked', 'Alignment', 'BorderStyle', 'SelStart', 'SelLength',
    'SelText', 'HideSelection'
  ],
  ListBox: [
    'List', 'ListIndex', 'ListCount', 'Selected', 'SelCount', 'Sorted',
    'Style', 'MultiSelect', 'ItemData', 'NewIndex', 'TopIndex',
    'IntegralHeight', 'Columns'
  ],
  ComboBox: [
    'Text', 'List', 'ListIndex', 'ListCount', 'Style', 'Sorted',
    'ItemData', 'NewIndex', 'TopIndex', 'SelStart', 'SelLength',
    'SelText', 'Locked', 'IntegralHeight'
  ],
  CheckBox: [
    'Caption', 'Value', 'Alignment', 'Style', 'Picture', 'DownPicture',
    'DisabledPicture', 'MaskColor', 'UseMaskColor'
  ],
  OptionButton: [
    'Caption', 'Value', 'Alignment', 'Style', 'Picture', 'DownPicture',
    'DisabledPicture', 'MaskColor', 'UseMaskColor'
  ],
  Frame: [
    'Caption', 'BorderStyle'
  ],
  PictureBox: [
    'Picture', 'AutoSize', 'BorderStyle', 'AutoRedraw', 'DrawMode',
    'DrawStyle', 'DrawWidth', 'FillColor', 'FillStyle', 'ScaleMode',
    'ScaleWidth', 'ScaleHeight', 'CurrentX', 'CurrentY'
  ],
  Image: [
    'Picture', 'Stretch', 'BorderStyle'
  ],
  Timer: [
    'Interval', 'Enabled'
  ],
  HScrollBar: [
    'Value', 'Min', 'Max', 'LargeChange', 'SmallChange'
  ],
  VScrollBar: [
    'Value', 'Min', 'Max', 'LargeChange', 'SmallChange'
  ],
  TreeView: [
    'Nodes', 'SelectedItem', 'Style', 'LineStyle', 'LabelEdit',
    'Indentation', 'PathSeparator', 'Sorted', 'SingleSel',
    'ImageList', 'BorderStyle', 'Appearance', 'HideSelection',
    'HotTracking', 'FullRowSelect', 'Checkboxes', 'Scroll'
  ],
  ListView: [
    'ListItems', 'ColumnHeaders', 'View', 'Arrange', 'GridLines',
    'LabelEdit', 'LabelWrap', 'HideSelection', 'HideColumnHeaders',
    'Icons', 'SmallIcons', 'Sorted', 'SortKey', 'SortOrder',
    'SelectedItem', 'MultiSelect', 'BorderStyle', 'Appearance',
    'HotTracking', 'HoverSelection', 'FullRowSelect', 'Checkboxes'
  ]
};

// VB6 Events
export const vb6Events = [
  'Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove',
  'KeyDown', 'KeyUp', 'KeyPress', 'Change', 'GotFocus',
  'LostFocus', 'Load', 'Unload', 'Resize', 'Paint',
  'Activate', 'Deactivate', 'Initialize', 'Terminate',
  'QueryUnload', 'Scroll', 'Timer', 'DragDrop', 'DragOver',
  'ItemCheck', 'ItemClick', 'NodeClick', 'BeforeLabelEdit',
  'AfterLabelEdit', 'Collapse', 'Expand', 'PathChange',
  'PatternChange', 'ColumnClick', 'Compare', 'Validate'
];

// VB6 Constants
export const vb6Constants = [
  // Message Box Constants
  'vbOKOnly', 'vbOKCancel', 'vbAbortRetryIgnore', 'vbYesNoCancel',
  'vbYesNo', 'vbRetryCancel', 'vbCritical', 'vbQuestion',
  'vbExclamation', 'vbInformation', 'vbDefaultButton1',
  'vbDefaultButton2', 'vbDefaultButton3', 'vbDefaultButton4',
  'vbApplicationModal', 'vbSystemModal', 'vbOK', 'vbCancel',
  'vbAbort', 'vbRetry', 'vbIgnore', 'vbYes', 'vbNo',
  
  // Color Constants
  'vbBlack', 'vbRed', 'vbGreen', 'vbYellow', 'vbBlue',
  'vbMagenta', 'vbCyan', 'vbWhite',
  
  // System Color Constants
  'vbScrollBars', 'vbDesktop', 'vbActiveTitleBar',
  'vbInactiveTitleBar', 'vbMenuBar', 'vbWindowBackground',
  'vbWindowFrame', 'vbMenuText', 'vbWindowText',
  'vbTitleBarText', 'vbActiveBorder', 'vbInactiveBorder',
  'vbApplicationWorkspace', 'vbHighlight', 'vbHighlightText',
  'vbButtonFace', 'vbButtonShadow', 'vbGrayText',
  'vbButtonText', 'vbInactiveCaptionText', 'vb3DHighlight',
  'vb3DDKShadow', 'vb3DLight', 'vbInfoText', 'vbInfoBackground',
  
  // Key Code Constants
  'vbKeyBack', 'vbKeyTab', 'vbKeyClear', 'vbKeyReturn',
  'vbKeyShift', 'vbKeyControl', 'vbKeyMenu', 'vbKeyPause',
  'vbKeyCapital', 'vbKeyEscape', 'vbKeySpace', 'vbKeyPageUp',
  'vbKeyPageDown', 'vbKeyEnd', 'vbKeyHome', 'vbKeyLeft',
  'vbKeyUp', 'vbKeyRight', 'vbKeyDown', 'vbKeySelect',
  'vbKeyPrint', 'vbKeyExecute', 'vbKeySnapshot', 'vbKeyInsert',
  'vbKeyDelete', 'vbKeyHelp',
  
  // File Attribute Constants
  'vbNormal', 'vbReadOnly', 'vbHidden', 'vbSystem',
  'vbVolume', 'vbDirectory', 'vbArchive',
  
  // Window State Constants
  'vbNormal', 'vbMinimized', 'vbMaximized',
  
  // Form Border Style Constants
  'vbBSNone', 'vbFixedSingle', 'vbSizable', 'vbFixedDialog',
  'vbFixedToolWindow', 'vbSizableToolWindow',
  
  // Mouse Pointer Constants
  'vbDefault', 'vbArrow', 'vbCrosshair', 'vbIbeam',
  'vbIconPointer', 'vbSizePointer', 'vbSizeNESW', 'vbSizeNS',
  'vbSizeNWSE', 'vbSizeWE', 'vbUpArrow', 'vbHourglass',
  'vbNoDrop', 'vbArrowHourglass', 'vbArrowQuestion',
  'vbSizeAll', 'vbCustom',
  
  // Date Format Constants
  'vbGeneralDate', 'vbLongDate', 'vbShortDate', 'vbLongTime',
  'vbShortTime',
  
  // Comparison Constants
  'vbBinaryCompare', 'vbTextCompare', 'vbDatabaseCompare',
  
  // Variant Type Constants
  'vbEmpty', 'vbNull', 'vbInteger', 'vbLong', 'vbSingle',
  'vbDouble', 'vbCurrency', 'vbDate', 'vbString', 'vbObject',
  'vbError', 'vbBoolean', 'vbVariant', 'vbDataObject',
  'vbDecimal', 'vbByte', 'vbArray'
];