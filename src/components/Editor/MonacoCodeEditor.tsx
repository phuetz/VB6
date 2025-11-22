import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useVB6Store } from '../../stores/vb6Store';
import RefactoringPanel from '../Dialogs/RefactoringPanel';
import { VB6RefactoringService } from '../../services/VB6RefactoringService';
import { VB6IntelliSenseService } from '../../services/VB6IntelliSense';
import { BreakpointGutter } from '../Debug/BreakpointGutter';
import { AIIntelliSenseProvider } from './AIIntelliSenseProvider';
import { AIIntelliSenseSettings } from '../Settings/AIIntelliSenseSettings';
import { CompletionItem } from '../../services/AIIntelliSenseEngine';

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
    'And',
    'As',
    'Boolean',
    'ByRef',
    'Byte',
    'ByVal',
    'Call',
    'Case',
    'Const',
    'Currency',
    'Dim',
    'Do',
    'Double',
    'Each',
    'Else',
    'ElseIf',
    'End',
    'Enum',
    'Exit',
    'False',
    'For',
    'Function',
    'Get',
    'GoTo',
    'If',
    'In',
    'Integer',
    'Is',
    'Let',
    'Long',
    'Loop',
    'Mod',
    'New',
    'Next',
    'Not',
    'Nothing',
    'Object',
    'On',
    'Option',
    'Optional',
    'Or',
    'Private',
    'Property',
    'Public',
    'Resume',
    'Select',
    'Set',
    'Single',
    'Static',
    'String',
    'Sub',
    'Then',
    'To',
    'True',
    'Type',
    'Until',
    'Variant',
    'Wend',
    'While',
    'With',
    'Xor',
  ],

  operators: ['=', '>', '<', '<=', '>=', '<>', '+', '-', '*', '/', '\\', '^', '&'],

  symbols: /[=><!~?:&|+*/^%-]+/,

  tokenizer: {
    root: [
      [
        /[a-zA-Z_$][\w$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
      [/'.*$/, 'comment'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],
      [/\s+/, 'white'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/"/, 'string', '@pop'],
    ],
  },
};

// VB6 Completion Provider
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
        insertText: ['If ${1:condition} Then', '    ${2:// code}', 'End If'].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'If-Then statement',
      },
      {
        label: 'For Loop',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['For ${1:i} = ${2:1} To ${3:10}', '    ${4:// code}', 'Next ${1:i}'].join(
          '\n'
        ),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'For-Next loop',
      },
      {
        label: 'Sub Procedure',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['Private Sub ${1:SubName}()', '    ${2:// code}', 'End Sub'].join('\n'),
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
  const [showRefactoringPanel, setShowRefactoringPanel] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiEnabled, setAIEnabled] = useState(true);
  const refactoringService = useRef(new VB6RefactoringService());
  const vb6IntelliSense = useRef(new VB6IntelliSenseService());

  const {
    selectedControls,
    selectedEvent,
    eventCode,
    controls,
    updateEventCode,
    setSelectedEvent,
    selectControls,
  } = useVB6Store();

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Register VB6 language
    monaco.languages.register({ id: 'vb6' });
    monaco.languages.setLanguageConfiguration('vb6', VB6_LANGUAGE_CONFIG);
    monaco.languages.setMonarchTokensProvider('vb6', VB6_LANGUAGE_TOKENS);
    
    // Register advanced IntelliSense providers
    // Completion provider
    monaco.languages.registerCompletionItemProvider('vb6', {
      provideCompletionItems: (model, position) => {
        const items = vb6IntelliSense.current.getCompletionItems(model, position);
        return { suggestions: items };
      },
      triggerCharacters: ['.', ' ', '(', ',', '=', 'As']
    });

    // Hover provider
    monaco.languages.registerHoverProvider('vb6', {
      provideHover: (model, position) => {
        return vb6IntelliSense.current.getHoverInfo(model, position);
      }
    });

    // Signature help provider
    monaco.languages.registerSignatureHelpProvider('vb6', {
      signatureHelpTriggerCharacters: ['(', ','],
      signatureHelpRetriggerCharacters: [','],
      provideSignatureHelp: (model, position) => {
        const result = vb6IntelliSense.current.getSignatureHelp(model, position);
        return result ? result.value : null;
      }
    });

    // Note: Parameter hints are provided through signature help

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
    editor.addCommand(
      monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        // Format code using the internal formatter
        useVB6Store.getState().formatCode();
      }
    );
    
    // Refactor shortcut
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR,
      () => {
        setShowRefactoringPanel(true);
      }
    );
    
    // Trigger suggestions manually
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
      () => {
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
      }
    );
    
    // AI IntelliSense settings shortcut
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
      () => {
        setShowAISettings(true);
      }
    );
    
    // Toggle AI IntelliSense
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyA,
      () => {
        setAIEnabled(prev => !prev);
      }
    );
    
    // Go to definition (simulated)
    editor.addCommand(
      monaco.KeyCode.F12,
      () => {
        const position = editor.getPosition();
        if (position) {
          const word = editor.getModel()?.getWordAtPosition(position);
          if (word) {
            // TODO: Implement go to definition
            console.log('Go to definition:', word.word);
          }
        }
      }
    );

    editorRef.current = editor;
    setIsReady(true);

    // Add content change listener
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      
      // Update IntelliSense with current code
      vb6IntelliSense.current.parseCode(value);
      
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
      editor.dispose();
    };
  }, [controls]);

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
    <div className="flex-1 bg-white overflow-hidden flex flex-col">
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
          <div className="text-gray-600 text-xs">Monaco Editor • VB6 IntelliSense • Press Ctrl+Space for suggestions • Ctrl+Shift+R for refactoring</div>
          
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
      <div ref={containerRef} className="flex-1" style={{ minHeight: 0 }} />
      
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
          onCompletionAccepted={(item) => {
            console.log('AI completion accepted:', item.label, 'source:', item.source);
            // Track AI usage for learning
            if (item.source === 'ai') {
              // Could send analytics or update user preferences here
            }
          }}
        />
      )}

      {/* AI Settings Panel */}
      <AIIntelliSenseSettings
        visible={showAISettings}
        onClose={() => setShowAISettings(false)}
      />

      {/* Breakpoint Gutter Integration */}
      {isReady && editorRef.current && (
        <BreakpointGutter
          editor={editorRef.current}
          file="current.vb"
          onBreakpointToggle={(line) => {
            console.log('Breakpoint toggled at line:', line);
          }}
        />
      )}
    </div>
  );
};

export default MonacoCodeEditor;
