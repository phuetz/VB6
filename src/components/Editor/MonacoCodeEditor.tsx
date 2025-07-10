import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useVB6Store } from '../../stores/vb6Store';

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

// VB6 Syntax Highlighting
const VB6_LANGUAGE_TOKENS: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.vb',
  ignoreCase: true,

  keywords: [
    'And', 'As', 'Boolean', 'ByRef', 'Byte', 'ByVal', 'Call', 'Case', 'Const',
    'Currency', 'Dim', 'Do', 'Double', 'Each', 'Else', 'ElseIf', 'End', 'Enum',
    'Exit', 'False', 'For', 'Function', 'Get', 'GoTo', 'If', 'In', 'Integer',
    'Is', 'Let', 'Long', 'Loop', 'Mod', 'New', 'Next', 'Not', 'Nothing', 'Object',
    'On', 'Option', 'Optional', 'Or', 'Private', 'Property', 'Public', 'Resume',
    'Select', 'Set', 'Single', 'Static', 'String', 'Sub', 'Then', 'To', 'True',
    'Type', 'Until', 'Variant', 'Wend', 'While', 'With', 'Xor',
  ],

  operators: [
    '=', '>', '<', '<=', '>=', '<>', '+', '-', '*', '/', '\\', '^', '&',
  ],

  // eslint-disable-next-line no-useless-escape
  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  tokenizer: {
    root: [
      [/[a-zA-Z_$][\w$]*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
      [/'.*$/, 'comment'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],
      [/\s+/, 'white'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/"/, 'string', '@pop']
    ],
  },
};

// VB6 Completion Provider
const VB6_COMPLETION_PROVIDER: monaco.languages.CompletionItemProvider = {
  provideCompletionItems: (model, position) => {
    const suggestions: monaco.languages.CompletionItem[] = [
      // Keywords
      ...VB6_LANGUAGE_TOKENS.keywords!.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        detail: `VB6 keyword: ${keyword}`,
      })),
      
      // Functions
      {
        label: 'MsgBox',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'MsgBox "${1:message}"',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Displays a message box',
        documentation: 'MsgBox(Prompt [, Buttons] [, Title])',
      },
      {
        label: 'InputBox',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'InputBox("${1:prompt}")',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Displays an input dialog box',
        documentation: 'InputBox(Prompt [, Title] [, Default])',
      },
      {
        label: 'Len',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Len(${1:string})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Returns the length of a string',
      },
      
      // Control structures
      {
        label: 'If Then',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'If ${1:condition} Then',
          '    ${2:// code}',
          'End If'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'If-Then statement',
      },
      {
        label: 'For Loop',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'For ${1:i} = ${2:1} To ${3:10}',
          '    ${4:// code}',
          'Next ${1:i}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'For-Next loop',
      },
      {
        label: 'Sub Procedure',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'Private Sub ${1:SubName}()',
          '    ${2:// code}',
          'End Sub'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Sub procedure',
      },
    ];

    return { suggestions };
  },
};

const MonacoCodeEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const {
    selectedControls,
    selectedEvent,
    eventCode,
    controls,
    updateEventCode,
    setSelectedEvent,
    selectControls
  } = useVB6Store();

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Register VB6 language
    monaco.languages.register({ id: 'vb6' });
    monaco.languages.setLanguageConfiguration('vb6', VB6_LANGUAGE_CONFIG);
    monaco.languages.setMonarchTokensProvider('vb6', VB6_LANGUAGE_TOKENS);
    monaco.languages.registerCompletionItemProvider('vb6', VB6_COMPLETION_PROVIDER);

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value: '',
      language: 'vb6',
      theme: 'vs',
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
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    editorRef.current = editor;
    setIsReady(true);

    // Add content change listener
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      if (selectedControls.length === 1 && selectedEvent) {
        const control = selectedControls[0];
        const eventKey = `${control.name}_${selectedEvent}`;
        updateEventCode(eventKey, value);
      }
    });

    return () => {
      editor.dispose();
    };
  }, []);

  // Update editor content when selection changes
  useEffect(() => {
    if (!isReady || !editorRef.current) return;

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
          editorRef.current.setPosition({ lineNumber: 2, column: 1 });
        }
      }
    } else {
      // General declarations
      content = eventCode['(General)_(Declarations)'] || '';
      const generalContent = `' General Declarations\n' Add global variables and constants here\n\n${content}`;
      editorRef.current.setValue(generalContent);
    }
  }, [selectedControls, selectedEvent, eventCode, isReady]);

  const getAvailableEvents = (controlType: string) => {
    const commonEvents = ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove', 'KeyDown', 'KeyUp', 'KeyPress'];
    const formEvents = ['Load', 'Unload', 'Activate', 'Deactivate', 'Initialize', 'Paint', 'QueryUnload', 'Resize'];
    
    const specificEvents: { [key: string]: string[] } = {
      'Form': [...formEvents, ...commonEvents],
      'CommandButton': [...commonEvents, 'GotFocus', 'LostFocus'],
      'TextBox': [...commonEvents, 'Change', 'GotFocus', 'LostFocus', 'Validate'],
      'Label': ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      'CheckBox': [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      'Timer': ['Timer']
    };
    
    return specificEvents[controlType] || commonEvents;
  };

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-200 px-2 py-1 border-b border-gray-400 flex items-center gap-2 text-xs">
        <select
          className="border border-gray-300 px-2 py-1"
          value={selectedControls.length === 1 ? selectedControls[0].name : '(General)'}
          onChange={(e) => {
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
            <option key={control.id} value={control.name}>{control.name}</option>
          ))}
        </select>
        
        <select
          className="border border-gray-300 px-2 py-1"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          disabled={selectedControls.length !== 1}
        >
          {selectedControls.length === 1 ? 
            getAvailableEvents(selectedControls[0].type).map(event => (
              <option key={event} value={event}>{event}</option>
            )) : (
              <option value="(Declarations)">(Declarations)</option>
            )
          }
        </select>

        <div className="ml-auto text-gray-600">
          Monaco Editor • VB6 Syntax
        </div>
      </div>
      
      {/* Editor */}
      <div 
        ref={containerRef} 
        className="flex-1"
        style={{ minHeight: 0 }}
      />
    </div>
  );
};

export default MonacoCodeEditor;