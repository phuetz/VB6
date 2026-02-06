import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { useVB6Store } from '../../stores/vb6Store';
import { shallow } from 'zustand/shallow';
import RefactoringPanel from '../Dialogs/RefactoringPanel';
import { VB6RefactoringService } from '../../services/VB6RefactoringService';
import { VB6IntelliSenseService } from '../../services/VB6IntelliSense';
import { BreakpointGutter } from '../Debug/BreakpointGutter';
import { AIIntelliSenseProvider } from './AIIntelliSenseProvider';
import { AIIntelliSenseSettings } from '../Settings/AIIntelliSenseSettings';
import { CompletionItem } from '../../services/AIIntelliSenseEngine';
import { VB6Compiler, CompilerDiagnostic } from '../../services/VB6Compiler';

const DIAGNOSTIC_SEVERITY_MAP: Record<string, monaco.MarkerSeverity> = {
  error: monaco.MarkerSeverity.Error,
  warning: monaco.MarkerSeverity.Warning,
  info: monaco.MarkerSeverity.Info,
};

function diagnosticsToMarkers(diagnostics: CompilerDiagnostic[]): monaco.editor.IMarkerData[] {
  return diagnostics.map(d => ({
    severity: DIAGNOSTIC_SEVERITY_MAP[d.severity] ?? monaco.MarkerSeverity.Info,
    message: d.message,
    startLineNumber: d.line,
    startColumn: d.column,
    endLineNumber: d.endLine ?? d.line,
    endColumn: d.endColumn ?? d.column + 1,
    code: d.code,
    source: `vb6-${d.source}`,
  }));
}

// VB6 Language Configuration
const VB6_LANGUAGE_CONFIG: monaco.languages.ILanguageConfiguration = {
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
      start: new RegExp('^\\s*(Sub|Function|If|For|While|Do|With|Select)\\b'),
      end: new RegExp('^\\s*(End\\s+(Sub|Function|If|For|While|Do|With|Select)|Loop|Wend|Next)\\b'),
    },
  },
};

// VB6 Syntax Highlighting - Complete keyword list
const VB6_LANGUAGE_TOKENS: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.vb',
  ignoreCase: true,

  keywords: [
    // Control flow
    'If',
    'Then',
    'Else',
    'ElseIf',
    'End',
    'Select',
    'Case',
    'For',
    'Next',
    'To',
    'Step',
    'While',
    'Wend',
    'Do',
    'Loop',
    'Until',
    'Each',
    'In',
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
    'ReDim',
    'Preserve',
    'As',
    'Private',
    'Public',
    'Friend',
    'Static',
    'Global',
    'Const',
    'Type',
    'Enum',
    'Declare',
    'Lib',
    'Alias',
    'Sub',
    'Function',
    'Property',
    'Get',
    'Let',
    'Set',
    'Class',
    'Module',
    'Event',
    'RaiseEvent',
    'Implements',
    // Parameters
    'ByVal',
    'ByRef',
    'Optional',
    'ParamArray',
    // Types
    'Boolean',
    'Byte',
    'Integer',
    'Long',
    'Single',
    'Double',
    'Currency',
    'Decimal',
    'Date',
    'String',
    'Object',
    'Variant',
    'Any',
    // Operators
    'And',
    'Or',
    'Not',
    'Xor',
    'Eqv',
    'Imp',
    'Mod',
    'Like',
    'Is',
    'TypeOf',
    // Literals
    'True',
    'False',
    'Nothing',
    'Null',
    'Empty',
    'Me',
    // Object
    'New',
    'Call',
    'WithEvents',
    // Misc
    'Option',
    'Explicit',
    'Compare',
    'Base',
    'Binary',
    'Text',
    'Database',
    'Attribute',
    'VB_Name',
    'VB_GlobalNameSpace',
    'VB_Creatable',
    'VB_PredeclaredId',
    'DefBool',
    'DefByte',
    'DefInt',
    'DefLng',
    'DefCur',
    'DefSng',
    'DefDbl',
    'DefDec',
    'DefDate',
    'DefStr',
    'DefObj',
    'DefVar',
    'Debug',
    'Print',
    'Assert',
    'DoEvents',
    'Stop',
    'Beep',
  ],

  builtinFunctions: [
    // String functions
    'Len',
    'Left',
    'Right',
    'Mid',
    'Trim',
    'LTrim',
    'RTrim',
    'UCase',
    'LCase',
    'InStr',
    'InStrRev',
    'Replace',
    'Split',
    'Join',
    'StrComp',
    'String',
    'Space',
    'Asc',
    'Chr',
    'Format',
    'CStr',
    'StrReverse',
    'StrConv',
    // Numeric functions
    'Abs',
    'Int',
    'Fix',
    'Sgn',
    'Sqr',
    'Exp',
    'Log',
    'Sin',
    'Cos',
    'Tan',
    'Atn',
    'Rnd',
    'Randomize',
    'Round',
    'Hex',
    'Oct',
    'Val',
    // Conversion functions
    'CBool',
    'CByte',
    'CCur',
    'CDate',
    'CDbl',
    'CDec',
    'CInt',
    'CLng',
    'CSng',
    'CVar',
    // Date/Time functions
    'Now',
    'Date',
    'Time',
    'Timer',
    'Year',
    'Month',
    'Day',
    'Hour',
    'Minute',
    'Second',
    'Weekday',
    'DateAdd',
    'DateDiff',
    'DatePart',
    'DateSerial',
    'DateValue',
    'TimeSerial',
    'TimeValue',
    'MonthName',
    'WeekdayName',
    'IsDate',
    // Array functions
    'Array',
    'UBound',
    'LBound',
    'Erase',
    // Type functions
    'IsArray',
    'IsDate',
    'IsEmpty',
    'IsError',
    'IsMissing',
    'IsNull',
    'IsNumeric',
    'IsObject',
    'TypeName',
    'VarType',
    // File functions
    'Dir',
    'EOF',
    'FileLen',
    'FreeFile',
    'Loc',
    'LOF',
    'Seek',
    'FileAttr',
    'GetAttr',
    'SetAttr',
    'FileCopy',
    'Kill',
    'Name',
    'MkDir',
    'RmDir',
    'ChDir',
    'ChDrive',
    'CurDir',
    // I/O functions
    'Open',
    'Close',
    'Input',
    'Line',
    'Print',
    'Write',
    'Get',
    'Put',
    'Seek',
    // Dialog functions
    'MsgBox',
    'InputBox',
    'Shell',
    // Misc functions
    'IIf',
    'Choose',
    'Switch',
    'CreateObject',
    'GetObject',
    'Environ',
    'Command',
    'DoEvents',
    'QBColor',
    'RGB',
    'LoadPicture',
    'SavePicture',
    'LoadResString',
    'LoadResPicture',
  ],

  operators: ['=', '>', '<', '<=', '>=', '<>', '+', '-', '*', '/', '\\', '^', '&', ':='],

  symbols: /[=><!~?:&|+*/^%-]+/,

  tokenizer: {
    root: [
      // Comments (VB6 style)
      [/'.*$/, 'comment'],
      [/\bRem\b.*$/i, 'comment'],

      // Compiler directives
      [/#(If|Else|ElseIf|End If|Const)\b/i, 'keyword.control.directive'],

      // Line continuation
      [/_$/, 'keyword.operator.continuation'],

      // Date literals
      [/#[^#]+#/, 'number.date'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],

      // Numbers - hex
      [/&H[0-9A-Fa-f]+&?/, 'number.hex'],
      // Numbers - octal
      [/&O[0-7]+&?/, 'number.octal'],
      // Numbers - float
      [/\d*\.\d+([eE][-+]?\d+)?[!#@]?/, 'number.float'],
      // Numbers - integer
      [/\d+[%&^]?/, 'number'],

      // Keywords and identifiers
      [
        /[a-zA-Z_$][\w$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@builtinFunctions': 'support.function',
            '@default': 'identifier',
          },
        },
      ],

      // Type declaration character suffixes
      [/[%&!#@$]/, 'keyword.operator.type'],

      // Operators
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],

      // Delimiters
      [/[{}()[\]]/, '@brackets'],
      [/[,;]/, 'delimiter'],

      // Whitespace
      [/\s+/, 'white'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/""/, 'string.escape'], // VB6 escaped quote
      [/"/, 'string', '@pop'],
    ],
  },
};

// VB6 Classic Theme (inspired by VB6 IDE colors)
const VB6_CLASSIC_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '008000', fontStyle: 'italic' }, // Green comments
    { token: 'keyword', foreground: '0000FF' }, // Blue keywords
    { token: 'keyword.control.directive', foreground: '800080' }, // Purple directives
    { token: 'string', foreground: '800000' }, // Dark red strings
    { token: 'string.escape', foreground: '800000' },
    { token: 'number', foreground: '000000' }, // Black numbers
    { token: 'number.float', foreground: '000000' },
    { token: 'number.hex', foreground: '000000' },
    { token: 'number.octal', foreground: '000000' },
    { token: 'number.date', foreground: '800080' }, // Purple dates
    { token: 'operator', foreground: '000000' },
    { token: 'support.function', foreground: '000000', fontStyle: 'bold' }, // Bold built-in functions
    { token: 'identifier', foreground: '000000' },
    { token: 'delimiter', foreground: '000000' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#FFFFC0', // Yellow highlight
    'editor.selectionBackground': '#0078D7',
    'editorCursor.foreground': '#000000',
    'editorLineNumber.foreground': '#808080',
    'editorGutter.background': '#F0F0F0',
  },
};

// VB6 Dark Theme (modern dark variant)
const VB6_DARK_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' }, // Green comments
    { token: 'keyword', foreground: '569CD6' }, // Light blue keywords
    { token: 'keyword.control.directive', foreground: 'C586C0' }, // Purple directives
    { token: 'string', foreground: 'CE9178' }, // Orange strings
    { token: 'string.escape', foreground: 'D7BA7D' },
    { token: 'number', foreground: 'B5CEA8' }, // Light green numbers
    { token: 'number.float', foreground: 'B5CEA8' },
    { token: 'number.hex', foreground: 'B5CEA8' },
    { token: 'number.date', foreground: 'DCDCAA' }, // Yellow dates
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'support.function', foreground: 'DCDCAA' }, // Yellow built-in functions
    { token: 'identifier', foreground: '9CDCFE' },
    { token: 'delimiter', foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#2D2D30',
    'editor.selectionBackground': '#264F78',
    'editorCursor.foreground': '#AEAFAD',
    'editorLineNumber.foreground': '#858585',
    'editorGutter.background': '#1E1E1E',
  },
};

// VB6 Completion Provider with comprehensive snippets
const VB6_COMPLETION_PROVIDER: monaco.languages.CompletionItemProvider = {
  provideCompletionItems: (model, position) => {
    const suggestions: monaco.languages.CompletionItem[] = [
      // Keywords
      ...VB6_LANGUAGE_TOKENS.keywords!.map(keyword => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        detail: `VB6 keyword: ${keyword}`,
      })),

      // Built-in Functions
      ...((VB6_LANGUAGE_TOKENS as any).builtinFunctions || []).map((func: string) => ({
        label: func,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${func}(\${1})`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: `VB6 built-in function: ${func}`,
      })),

      // Dialog Functions
      {
        label: 'MsgBox',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'MsgBox "${1:message}", ${2:vbInformation}, "${3:Title}"',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Displays a message box',
        documentation: 'MsgBox(Prompt [, Buttons] [, Title] [, HelpFile] [, Context])',
      },
      {
        label: 'InputBox',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'InputBox("${1:prompt}", "${2:Title}", "${3:Default}")',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Displays an input dialog box',
        documentation: 'InputBox(Prompt [, Title] [, Default] [, XPos] [, YPos])',
      },

      // Control Structures - If
      {
        label: 'If Then End If',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['If ${1:condition} Then', '    ${2}', 'End If'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'If-Then block',
      },
      {
        label: 'If Then Else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['If ${1:condition} Then', '    ${2}', 'Else', '    ${3}', 'End If'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'If-Then-Else block',
      },
      {
        label: 'If Then ElseIf Else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'If ${1:condition1} Then',
          '    ${2}',
          'ElseIf ${3:condition2} Then',
          '    ${4}',
          'Else',
          '    ${5}',
          'End If',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'If-ElseIf-Else block',
      },

      // Control Structures - Loops
      {
        label: 'For Next',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['For ${1:i} = ${2:1} To ${3:10}', '    ${4}', 'Next ${1:i}'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'For-Next loop',
      },
      {
        label: 'For Step Next',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['For ${1:i} = ${2:1} To ${3:10} Step ${4:2}', '    ${5}', 'Next ${1:i}'].join(
          '\n'
        ),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'For-Step-Next loop',
      },
      {
        label: 'For Each Next',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['For Each ${1:item} In ${2:collection}', '    ${3}', 'Next ${1:item}'].join(
          '\n'
        ),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'For Each-Next loop',
      },
      {
        label: 'Do While Loop',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['Do While ${1:condition}', '    ${2}', 'Loop'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Do While-Loop',
      },
      {
        label: 'Do Loop While',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['Do', '    ${1}', 'Loop While ${2:condition}'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Do-Loop While',
      },
      {
        label: 'Do Until Loop',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['Do Until ${1:condition}', '    ${2}', 'Loop'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Do Until-Loop',
      },
      {
        label: 'While Wend',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['While ${1:condition}', '    ${2}', 'Wend'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'While-Wend loop',
      },

      // Control Structures - Select Case
      {
        label: 'Select Case',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Select Case ${1:expression}',
          '    Case ${2:value1}',
          '        ${3}',
          '    Case ${4:value2}',
          '        ${5}',
          '    Case Else',
          '        ${6}',
          'End Select',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Select Case block',
      },

      // Control Structures - With
      {
        label: 'With End With',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['With ${1:object}', '    .${2:Property} = ${3:value}', 'End With'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'With block',
      },

      // Procedures
      {
        label: 'Private Sub',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['Private Sub ${1:SubName}(${2:parameters})', '    ${3}', 'End Sub'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Private Sub procedure',
      },
      {
        label: 'Public Sub',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['Public Sub ${1:SubName}(${2:parameters})', '    ${3}', 'End Sub'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Public Sub procedure',
      },
      {
        label: 'Private Function',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Private Function ${1:FunctionName}(${2:parameters}) As ${3:Variant}',
          '    ${4}',
          '    ${1:FunctionName} = ${5:result}',
          'End Function',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Private Function',
      },
      {
        label: 'Public Function',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Public Function ${1:FunctionName}(${2:parameters}) As ${3:Variant}',
          '    ${4}',
          '    ${1:FunctionName} = ${5:result}',
          'End Function',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Public Function',
      },

      // Properties
      {
        label: 'Property Get',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Public Property Get ${1:PropertyName}() As ${2:Variant}',
          '    ${1:PropertyName} = m${1:PropertyName}',
          'End Property',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Property Get procedure',
      },
      {
        label: 'Property Let',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Public Property Let ${1:PropertyName}(ByVal value As ${2:Variant})',
          '    m${1:PropertyName} = value',
          'End Property',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Property Let procedure',
      },
      {
        label: 'Property Set',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Public Property Set ${1:PropertyName}(ByVal value As ${2:Object})',
          '    Set m${1:PropertyName} = value',
          'End Property',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Property Set procedure',
      },

      // Error Handling
      {
        label: 'On Error GoTo',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'On Error GoTo ${1:ErrorHandler}',
          '    ${2}',
          '    Exit Sub',
          '',
          '${1:ErrorHandler}:',
          '    MsgBox "Error " & Err.Number & ": " & Err.Description',
          '    Resume Next',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Error handling with label',
      },
      {
        label: 'On Error Resume Next',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'On Error Resume Next',
        detail: 'Continue on error',
      },

      // Type/Enum
      {
        label: 'Type End Type',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Private Type ${1:TypeName}',
          '    ${2:Field1} As ${3:String}',
          '    ${4:Field2} As ${5:Long}',
          'End Type',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'User-Defined Type',
      },
      {
        label: 'Enum End Enum',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Public Enum ${1:EnumName}',
          '    ${2:Value1} = ${3:0}',
          '    ${4:Value2} = ${5:1}',
          'End Enum',
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Enumeration',
      },

      // Constants
      {
        label: 'vbCrLf',
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: 'vbCrLf',
        detail: 'Carriage return + Line feed',
      },
      {
        label: 'vbNullString',
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: 'vbNullString',
        detail: 'Zero-length string',
      },
      {
        label: 'vbTab',
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: 'vbTab',
        detail: 'Tab character',
      },
    ];

    return { suggestions };
  },
};

const MonacoCodeEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [showRefactoringPanel, setShowRefactoringPanel] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiEnabled, setAIEnabled] = useState(true);
  const refactoringService = useRef(new VB6RefactoringService());
  const vb6IntelliSense = useRef(new VB6IntelliSenseService());
  const diagnosticCompiler = useRef(new VB6Compiler());
  const diagnosticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDiagnostics = useCallback((code: string) => {
    if (diagnosticTimerRef.current) clearTimeout(diagnosticTimerRef.current);
    diagnosticTimerRef.current = setTimeout(() => {
      const model = editorRef.current?.getModel();
      if (!model) return;
      try {
        const diagnostics = diagnosticCompiler.current.getDiagnostics(code);
        const markers = diagnosticsToMarkers(diagnostics);
        monaco.editor.setModelMarkers(model, 'vb6-compiler', markers);
      } catch {
        monaco.editor.setModelMarkers(model, 'vb6-compiler', []);
      }
    }, 500);
  }, []);

  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { selectedControls, selectedEvent, eventCode, controls } = useVB6Store(
    state => ({
      selectedControls: state.selectedControls,
      selectedEvent: state.selectedEvent,
      eventCode: state.eventCode,
      controls: state.controls,
    }),
    shallow
  );

  // Actions don't need shallow comparison
  const updateEventCode = useVB6Store(state => state.updateEventCode);
  const setSelectedEvent = useVB6Store(state => state.setSelectedEvent);
  const selectControls = useVB6Store(state => state.selectControls);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Register VB6 language
    monaco.languages.register({ id: 'vb6' });
    monaco.languages.setLanguageConfiguration('vb6', VB6_LANGUAGE_CONFIG);
    monaco.languages.setMonarchTokensProvider('vb6', VB6_LANGUAGE_TOKENS);

    // Register VB6 themes
    monaco.editor.defineTheme('vb6-classic', VB6_CLASSIC_THEME);
    monaco.editor.defineTheme('vb6-dark', VB6_DARK_THEME);

    // Register advanced IntelliSense providers
    // Completion provider
    monaco.languages.registerCompletionItemProvider('vb6', {
      provideCompletionItems: (model, position) => {
        const items = vb6IntelliSense.current.getCompletionItems(model, position);
        return { suggestions: items };
      },
      triggerCharacters: ['.', ' ', '(', ',', '=', 'As'],
    });

    // Hover provider
    monaco.languages.registerHoverProvider('vb6', {
      provideHover: (model, position) => {
        return vb6IntelliSense.current.getHoverInfo(model, position);
      },
    });

    // Signature help provider
    monaco.languages.registerSignatureHelpProvider('vb6', {
      signatureHelpTriggerCharacters: ['(', ','],
      signatureHelpRetriggerCharacters: [','],
      provideSignatureHelp: (model, position) => {
        const result = vb6IntelliSense.current.getSignatureHelp(model, position);
        return result ? result.value : null;
      },
    });

    // Note: Parameter hints are provided through signature help

    // Create editor with VB6 classic theme
    const editor = monaco.editor.create(containerRef.current, {
      value: '',
      language: 'vb6',
      theme: 'vb6-classic',
      automaticLayout: true,
      fontSize: 12,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      lineNumbers: 'on',
      rulers: [80],
      wordWrap: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      contextmenu: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      formatOnPaste: true,
      formatOnType: true,
      autoIndent: 'full',
      tabSize: 4,
      insertSpaces: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    // Add keyboard shortcuts
    // Format code
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      // Format code using the internal formatter
      useVB6Store.getState().formatCode();
    });

    // Refactor shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR, () => {
      setShowRefactoringPanel(true);
    });

    // Trigger suggestions manually
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });

    // AI IntelliSense settings shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI, () => {
      setShowAISettings(true);
    });

    // Toggle AI IntelliSense
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyA, () => {
      setAIEnabled(prev => !prev);
    });

    // Go to definition (simulated)
    editor.addCommand(monaco.KeyCode.F12, () => {
      const position = editor.getPosition();
      if (position) {
        const word = editor.getModel()?.getWordAtPosition(position);
        if (word) {
          // TODO: Implement go to definition
        }
      }
    });

    editorRef.current = editor;
    setIsReady(true);

    // Add content change listener
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();

      // Update IntelliSense with current code
      vb6IntelliSense.current.parseCode(value);

      // Run compiler diagnostics (debounced)
      updateDiagnostics(value);

      if (selectedControls.length === 1 && selectedEvent) {
        // Extract the actual code from the editor (which contains procedure wrappers)
        const procedureStart = `Private Sub ${selectedControls[0].name}_${selectedEvent}()\n`;
        const procedureEnd = `\nEnd Sub`;

        let codeContent = value;
        if (codeContent.startsWith(procedureStart) && codeContent.endsWith(procedureEnd)) {
          codeContent = codeContent.substring(
            procedureStart.length,
            codeContent.length - procedureEnd.length
          );
        }

        const eventKey = `${selectedControls[0].name}_${selectedEvent}`;
        updateEventCode(eventKey, codeContent);
      }
    });

    // Update IntelliSense with controls
    vb6IntelliSense.current.updateControls(controls);

    return () => {
      if (diagnosticTimerRef.current) clearTimeout(diagnosticTimerRef.current);
      editor.dispose();
    };
  }, [controls, updateDiagnostics]);

  // Update editor content when selection changes
  useEffect(() => {
    if (!isReady || !editorRef.current) return;

    // Update IntelliSense with latest controls
    vb6IntelliSense.current.updateControls(controls);

    let content = '';
    if (selectedControls.length === 1 && selectedEvent) {
      const control = selectedControls[0];
      const eventKey = `${control.name}_${selectedEvent}`;
      content = eventCode[eventKey] || '';

      // Add procedure wrapper
      const procedureStart = `Private Sub ${control.name}_${selectedEvent}()\n`;
      const procedureEnd = `\nEnd Sub`;
      const fullContent = procedureStart + content + procedureEnd;

      editorRef.current.setValue(fullContent);

      // Position cursor inside the procedure
      const model = editorRef.current.getModel();
      if (model) {
        const lines = model.getLineCount();
        if (lines > 2) {
          // Position cursor just after the procedure declaration
          editorRef.current.setPosition({ lineNumber: 2, column: 5 });
          editorRef.current.focus();
        }
      }
    } else {
      // General declarations
      content = eventCode['(General)_(Declarations)'] || '';
      const generalContent = `' General Declarations\n' Add global variables and constants here\n\n${content}`;
      editorRef.current.setValue(generalContent);
    }
  }, [selectedControls, selectedEvent, eventCode, isReady, updateEventCode]);

  const getAvailableEvents = (controlType: string) => {
    const commonEvents = [
      'Click',
      'DblClick',
      'MouseDown',
      'MouseUp',
      'MouseMove',
      'KeyDown',
      'KeyUp',
      'KeyPress',
    ];
    const formEvents = [
      'Load',
      'Unload',
      'Activate',
      'Deactivate',
      'Initialize',
      'Paint',
      'QueryUnload',
      'Resize',
    ];

    const specificEvents: { [key: string]: string[] } = {
      Form: [...formEvents, ...commonEvents],
      CommandButton: [...commonEvents, 'GotFocus', 'LostFocus'],
      TextBox: [...commonEvents, 'Change', 'GotFocus', 'LostFocus', 'Validate'],
      Label: ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      CheckBox: [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      OptionButton: [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      ComboBox: [...commonEvents, 'Change', 'DropDown', 'GotFocus', 'LostFocus', 'Validate'],
      ImageCombo: [...commonEvents, 'Change', 'DropDown', 'GotFocus', 'LostFocus', 'Validate'],
      RichTextBox: [...commonEvents, 'Change', 'GotFocus', 'LostFocus', 'Validate'],
      Timer: ['Timer'],
      DriveListBox: [...commonEvents, 'Change'],
      DirListBox: [...commonEvents, 'Change'],
      FileListBox: [...commonEvents, 'Change'],
      ImageList: [...commonEvents],
      ListView: [...commonEvents, 'ItemClick', 'ColumnClick', 'ItemCheck'],
      DateTimePicker: [...commonEvents, 'Change'],
      MonthView: [...commonEvents, 'DateClick'],
      ProgressBar: [...commonEvents, 'Change'],
      Slider: [...commonEvents, 'Change'],
      UpDown: [...commonEvents, 'Change'],
      TabStrip: [...commonEvents, 'Change'],
      Toolbar: [...commonEvents, 'ButtonClick'],
      StatusBar: [...commonEvents],
      Shape: ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      Line: ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      Image: [...commonEvents, 'GotFocus', 'LostFocus'],
      TreeView: [...commonEvents, 'NodeClick', 'Expand', 'Collapse'],
    };

    return specificEvents[controlType] || commonEvents;
  };

  return (
    <div
      role="region"
      aria-label="Code Editor"
      className="flex-1 bg-white overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-gray-200 px-2 py-1 border-b border-gray-400 flex items-center gap-2 text-xs">
        <select
          className="border border-gray-300 px-2 py-1"
          value={selectedControls.length === 1 ? selectedControls[0].name : '(General)'}
          onChange={e => {
            if (e.target.value === '(General)') {
              selectControls([]);
            } else {
              const control = controls.find(c => c.name === e.target.value);
              if (control) {
                selectControls([control.id]);
              }
            }
          }}
        >
          <option value="(General)">(General)</option>
          <option value="Form">Form</option>
          {controls.map(control => (
            <option key={control.id} value={control.name}>
              {control.name}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 px-2 py-1"
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          disabled={selectedControls.length !== 1}
        >
          {selectedControls.length === 1 ? (
            getAvailableEvents(selectedControls[0].type).map(event => (
              <option key={event} value={event}>
                {event}
              </option>
            ))
          ) : (
            <option value="(Declarations)">(Declarations)</option>
          )}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <div className="text-gray-600 text-xs">
            Monaco Editor • VB6 IntelliSense • Press Ctrl+Space for suggestions • Ctrl+Shift+R for
            refactoring
          </div>

          {/* AI IntelliSense Toggle */}
          <button
            onClick={() => setAIEnabled(!aiEnabled)}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              aiEnabled
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
            title="Toggle AI IntelliSense"
          >
            <span className="text-xs">🧠</span>
            AI
          </button>

          {/* AI Settings Button */}
          <button
            onClick={() => setShowAISettings(true)}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="AI IntelliSense Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        role="application"
        aria-label="VB6 Code Editor"
        className="flex-1"
        style={{ minHeight: 0 }}
      />

      {/* Refactoring Panel */}
      {showRefactoringPanel && (
        <RefactoringPanel
          editor={editorRef.current || undefined}
          onClose={() => setShowRefactoringPanel(false)}
        />
      )}

      {/* AI IntelliSense Provider */}
      {isReady && editorRef.current && aiEnabled && (
        <AIIntelliSenseProvider
          editor={editorRef.current}
          controls={controls}
          onCompletionAccepted={item => {
            // Track AI usage for learning
            if (item.source === 'ai') {
              // Could send analytics or update user preferences here
            }
          }}
        />
      )}

      {/* AI Settings Panel */}
      <AIIntelliSenseSettings visible={showAISettings} onClose={() => setShowAISettings(false)} />

      {/* Breakpoint Gutter Integration */}
      {isReady && editorRef.current && (
        <BreakpointGutter
          editor={editorRef.current}
          file="current.vb"
          onBreakpointToggle={line => {}}
        />
      )}
    </div>
  );
};

export default MonacoCodeEditor;
