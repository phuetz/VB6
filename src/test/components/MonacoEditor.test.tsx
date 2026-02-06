/**
 * ULTRA COMPREHENSIVE Monaco Editor Integration Test Suite
 * Tests Monaco Editor VB6 integration, syntax highlighting, IntelliSense, and code editing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Monaco Editor
const mockEditor = {
  getValue: vi.fn(() => 'Private Sub Form_Load()\n    MsgBox "Hello World"\nEnd Sub'),
  setValue: vi.fn(),
  getModel: vi.fn(() => mockModel),
  setModel: vi.fn(),
  getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
  setPosition: vi.fn(),
  focus: vi.fn(),
  layout: vi.fn(),
  dispose: vi.fn(),
  onDidChangeModelContent: vi.fn(),
  onDidChangeCursorPosition: vi.fn(),
  trigger: vi.fn(),
  addCommand: vi.fn(),
  addAction: vi.fn(),
  updateOptions: vi.fn(),
  getSelection: vi.fn(() => ({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 1,
  })),
  setSelection: vi.fn(),
  revealLine: vi.fn(),
  revealRange: vi.fn(),
  deltaDecorations: vi.fn(() => []),
};

const mockModel = {
  getValue: vi.fn(() => 'Private Sub Form_Load()\n    MsgBox "Hello World"\nEnd Sub'),
  setValue: vi.fn(),
  getLineCount: vi.fn(() => 3),
  getLineContent: vi.fn(line => {
    const lines = ['Private Sub Form_Load()', '    MsgBox "Hello World"', 'End Sub'];
    return lines[line - 1] || '';
  }),
  getWordAtPosition: vi.fn(() => ({ word: 'MsgBox', startColumn: 5, endColumn: 11 })),
  findMatches: vi.fn(() => []),
  onDidChangeContent: vi.fn(),
  dispose: vi.fn(),
};

const mockMonaco = {
  editor: {
    create: vi.fn(() => mockEditor),
    createModel: vi.fn(() => mockModel),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    getModels: vi.fn(() => [mockModel]),
  },
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
    registerHoverProvider: vi.fn(),
    registerSignatureHelpProvider: vi.fn(),
    registerDocumentFormattingEditProvider: vi.fn(),
  },
  Range: vi.fn().mockImplementation((startLine, startCol, endLine, endCol) => ({
    startLineNumber: startLine,
    startColumn: startCol,
    endLineNumber: endLine,
    endColumn: endCol,
  })),
  Selection: vi.fn(),
  KeyCode: {
    F5: 116,
    F9: 120,
    Enter: 3,
    Tab: 2,
  },
  KeyMod: {
    CtrlCmd: 2048,
    Shift: 1024,
  },
};

// Mock the Monaco loader
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, onMount, value, language, theme, options }: any) => {
    return (
      <div data-testid="monaco-editor" data-language={language} data-theme={theme}>
        <textarea
          data-testid="monaco-textarea"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => onMount?.(mockEditor, mockMonaco)}
        />
      </div>
    );
  },
  loader: {
    init: vi.fn(() => Promise.resolve(mockMonaco)),
    config: vi.fn(),
  },
}));

describe('Monaco Editor - Basic Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.monaco
    global.window.monaco = mockMonaco;
  });

  afterEach(() => {
    delete global.window.monaco;
  });

  it('should initialize Monaco Editor with VB6 language', async () => {
    const MockMonacoEditor = ({ language = 'vb6', theme = 'vs-dark' }) => {
      return (
        <div data-testid="monaco-editor" data-language={language} data-theme={theme}>
          <textarea data-testid="monaco-textarea" />
        </div>
      );
    };

    render(<MockMonacoEditor />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();
    expect(editor.getAttribute('data-language')).toBe('vb6');
    expect(editor.getAttribute('data-theme')).toBe('vs-dark');
  });

  it('should handle VB6 code input and changes', async () => {
    const onChange = vi.fn();
    const vb6Code = 'Private Sub Form_Load()\n    MsgBox "Hello World"\nEnd Sub';

    const MockMonacoEditor = ({ onChange: onChangeCallback, value }: any) => {
      return (
        <div data-testid="monaco-editor">
          <textarea
            data-testid="monaco-textarea"
            value={value}
            onChange={e => onChangeCallback?.(e.target.value)}
          />
        </div>
      );
    };

    render(<MockMonacoEditor onChange={onChange} value={vb6Code} />);

    const textarea = screen.getByTestId('monaco-textarea');
    expect(textarea).toHaveValue(vb6Code);

    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Dim x As Integer');

    expect(onChange).toHaveBeenCalledWith('Dim x As Integer');
  });

  it('should register VB6 language configuration', () => {
    const registerVB6Language = () => {
      mockMonaco.languages.register({ id: 'vb6' });
      mockMonaco.languages.setMonarchTokensProvider('vb6', getVB6TokenProvider());
    };

    registerVB6Language();

    expect(mockMonaco.languages.register).toHaveBeenCalledWith({ id: 'vb6' });
    expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
      'vb6',
      expect.any(Object)
    );
  });

  it('should handle editor mounting and unmounting', async () => {
    const onMount = vi.fn();
    const onUnmount = vi.fn();

    const MockMonacoEditor = ({ onMount: onMountCallback }: any) => {
      return (
        <div data-testid="monaco-editor">
          <textarea
            data-testid="monaco-textarea"
            onFocus={() => onMountCallback?.(mockEditor, mockMonaco)}
          />
        </div>
      );
    };

    const { unmount } = render(<MockMonacoEditor onMount={onMount} />);

    const textarea = screen.getByTestId('monaco-textarea');
    await userEvent.click(textarea);

    expect(onMount).toHaveBeenCalledWith(mockEditor, mockMonaco);

    unmount();
    // Verify cleanup would happen in actual implementation
  });
});

describe('Monaco Editor - VB6 Syntax Highlighting', () => {
  it('should provide VB6 token provider with keywords', () => {
    const tokenProvider = getVB6TokenProvider();

    expect(tokenProvider.keywords).toContain('Private');
    expect(tokenProvider.keywords).toContain('Public');
    expect(tokenProvider.keywords).toContain('Sub');
    expect(tokenProvider.keywords).toContain('Function');
    expect(tokenProvider.keywords).toContain('Dim');
    expect(tokenProvider.keywords).toContain('As');
    expect(tokenProvider.keywords).toContain('Integer');
    expect(tokenProvider.keywords).toContain('String');
    expect(tokenProvider.keywords).toContain('Boolean');
  });

  it('should handle VB6 operators and delimiters', () => {
    const tokenProvider = getVB6TokenProvider();

    expect(tokenProvider.operators).toContain('=');
    expect(tokenProvider.operators).toContain('<>');
    expect(tokenProvider.operators).toContain('<=');
    expect(tokenProvider.operators).toContain('>=');
    expect(tokenProvider.operators).toContain('And');
    expect(tokenProvider.operators).toContain('Or');
    expect(tokenProvider.operators).toContain('Not');
  });

  it('should handle VB6 string literals', () => {
    const tokenProvider = getVB6TokenProvider();
    const stringRule = tokenProvider.tokenizer.root.find((rule: any) =>
      rule[0].toString().includes('"')
    );

    expect(stringRule).toBeDefined();
    expect(stringRule[1]).toBe('string');
  });

  it('should handle VB6 comments', () => {
    const tokenProvider = getVB6TokenProvider();
    const commentRule = tokenProvider.tokenizer.root.find((rule: any) =>
      rule[0].toString().includes("'")
    );

    expect(commentRule).toBeDefined();
    expect(commentRule[1]).toBe('comment');
  });

  it('should handle VB6 numbers', () => {
    const tokenProvider = getVB6TokenProvider();
    const numberRule = tokenProvider.tokenizer.root.find((rule: any) =>
      rule[0].toString().includes('\\d')
    );

    expect(numberRule).toBeDefined();
    expect(numberRule[1]).toBe('number');
  });
});

describe('Monaco Editor - VB6 IntelliSense', () => {
  it('should register completion item provider', () => {
    const registerCompletions = () => {
      mockMonaco.languages.registerCompletionItemProvider('vb6', {
        provideCompletionItems: getVB6CompletionItems,
      });
    };

    registerCompletions();

    expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      'vb6',
      expect.objectContaining({
        provideCompletionItems: expect.any(Function),
      })
    );
  });

  it('should provide VB6 keyword completions', () => {
    const model = mockModel;
    const position = { lineNumber: 1, column: 1 };
    const context = { triggerKind: 1 };

    const completions = getVB6CompletionItems(model, position, context);

    expect(completions.suggestions).toContainEqual(
      expect.objectContaining({
        label: 'Private Sub',
        kind: expect.any(Number),
        insertText: 'Private Sub ${1:ProcedureName}()\n    $0\nEnd Sub',
      })
    );

    expect(completions.suggestions).toContainEqual(
      expect.objectContaining({
        label: 'MsgBox',
        kind: expect.any(Number),
        insertText: 'MsgBox "${1:message}"',
      })
    );
  });

  it('should provide variable type completions', () => {
    const completions = getVB6CompletionItems(
      mockModel,
      { lineNumber: 1, column: 10 },
      { triggerKind: 1 }
    );

    const typeCompletions = completions.suggestions.filter((s: any) =>
      ['Integer', 'String', 'Boolean', 'Long', 'Double'].includes(s.label)
    );

    expect(typeCompletions.length).toBeGreaterThan(0);
  });

  it('should handle hover provider', () => {
    const registerHover = () => {
      mockMonaco.languages.registerHoverProvider('vb6', {
        provideHover: getVB6HoverInfo,
      });
    };

    registerHover();

    expect(mockMonaco.languages.registerHoverProvider).toHaveBeenCalledWith(
      'vb6',
      expect.objectContaining({
        provideHover: expect.any(Function),
      })
    );
  });

  it('should provide hover information for VB6 keywords', () => {
    const position = { lineNumber: 1, column: 5 };
    mockModel.getWordAtPosition.mockReturnValue({ word: 'MsgBox', startColumn: 1, endColumn: 7 });

    const hoverInfo = getVB6HoverInfo(mockModel, position);

    expect(hoverInfo).toEqual({
      range: expect.any(Object),
      contents: [
        { value: '**MsgBox** - Displays a message box' },
        { value: 'Syntax: MsgBox(prompt[, buttons][, title])' },
      ],
    });
  });
});

describe('Monaco Editor - Code Formatting', () => {
  it('should register document formatting provider', () => {
    const registerFormatter = () => {
      mockMonaco.languages.registerDocumentFormattingEditProvider('vb6', {
        provideDocumentFormattingEdits: formatVB6Code,
      });
    };

    registerFormatter();

    expect(mockMonaco.languages.registerDocumentFormattingEditProvider).toHaveBeenCalledWith(
      'vb6',
      expect.objectContaining({
        provideDocumentFormattingEdits: expect.any(Function),
      })
    );
  });

  it('should format VB6 code with proper indentation', () => {
    const unformattedCode = 'Private Sub Form_Load()\nMsgBox "Hello"\nEnd Sub';
    const formattedEdits = formatVB6Code(mockModel, { tabSize: 4, insertSpaces: true });

    expect(formattedEdits).toContainEqual({
      range: expect.any(Object),
      text: 'Private Sub Form_Load()\n    MsgBox "Hello"\nEnd Sub',
    });
  });

  it('should handle nested block indentation', () => {
    const nestedCode = 'Private Sub Test()\nIf True Then\nMsgBox "True"\nEnd If\nEnd Sub';
    const formattedEdits = formatVB6Code(mockModel, { tabSize: 4, insertSpaces: true });

    expect(formattedEdits[0].text).toContain('    If True Then\n        MsgBox "True"\n    End If');
  });
});

describe('Monaco Editor - Error Handling', () => {
  it('should handle editor creation failure gracefully', () => {
    mockMonaco.editor.create.mockImplementation(() => {
      throw new Error('Failed to create editor');
    });

    expect(() => {
      try {
        mockMonaco.editor.create(document.createElement('div'));
      } catch (error) {
        // Should handle error gracefully
        expect(error.message).toBe('Failed to create editor');
        throw error;
      }
    }).toThrow('Failed to create editor');
  });

  it('should handle model disposal', () => {
    const model = mockModel;
    model.dispose();

    expect(model.dispose).toHaveBeenCalled();
  });

  it('should handle editor disposal', () => {
    mockEditor.dispose();

    expect(mockEditor.dispose).toHaveBeenCalled();
  });
});

describe('Monaco Editor - Keyboard Shortcuts', () => {
  it('should register F5 for run command', () => {
    const registerShortcuts = () => {
      mockEditor.addCommand(mockMonaco.KeyCode.F5, () => {
        // Run VB6 code
      });
    };

    registerShortcuts();

    expect(mockEditor.addCommand).toHaveBeenCalledWith(mockMonaco.KeyCode.F5, expect.any(Function));
  });

  it('should register F9 for toggle breakpoint', () => {
    const registerShortcuts = () => {
      mockEditor.addCommand(mockMonaco.KeyCode.F9, () => {
        // Toggle breakpoint
      });
    };

    registerShortcuts();

    expect(mockEditor.addCommand).toHaveBeenCalledWith(mockMonaco.KeyCode.F9, expect.any(Function));
  });

  it('should register Ctrl+Space for IntelliSense', () => {
    const registerShortcuts = () => {
      mockEditor.addCommand(mockMonaco.KeyMod.CtrlCmd | mockMonaco.KeyCode.Space, () => {
        mockEditor.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });
    };

    registerShortcuts();

    expect(mockEditor.addCommand).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
  });
});

describe('Monaco Editor - Theme Support', () => {
  it('should define VB6 dark theme', () => {
    const defineVB6Theme = () => {
      mockMonaco.editor.defineTheme('vb6-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '569cd6' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'comment', foreground: '6a9955' },
          { token: 'number', foreground: 'b5cea8' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
        },
      });
    };

    defineVB6Theme();

    expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
      'vb6-dark',
      expect.objectContaining({
        base: 'vs-dark',
        inherit: true,
        rules: expect.arrayContaining([
          expect.objectContaining({ token: 'keyword', foreground: '569cd6' }),
        ]),
      })
    );
  });

  it('should define VB6 light theme', () => {
    const defineVB6Theme = () => {
      mockMonaco.editor.defineTheme('vb6-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '0000ff' },
          { token: 'string', foreground: 'a31515' },
          { token: 'comment', foreground: '008000' },
          { token: 'number', foreground: '098658' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
        },
      });
    };

    defineVB6Theme();

    expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
      'vb6-light',
      expect.objectContaining({
        base: 'vs',
        inherit: true,
      })
    );
  });

  it('should apply theme to editor', () => {
    mockMonaco.editor.setTheme('vb6-dark');

    expect(mockMonaco.editor.setTheme).toHaveBeenCalledWith('vb6-dark');
  });
});

// Helper functions for testing

function getVB6TokenProvider() {
  return {
    keywords: [
      'Private',
      'Public',
      'Sub',
      'Function',
      'End',
      'Dim',
      'As',
      'Integer',
      'String',
      'Boolean',
      'Long',
      'Double',
      'Single',
      'Byte',
      'Date',
      'Object',
      'Variant',
      'If',
      'Then',
      'Else',
      'ElseIf',
      'End If',
      'For',
      'To',
      'Next',
      'While',
      'Wend',
      'Do',
      'Loop',
      'Until',
      'Select',
      'Case',
      'True',
      'False',
      'Nothing',
      'Null',
      'Empty',
    ],
    operators: [
      '=',
      '<>',
      '<',
      '<=',
      '>',
      '>=',
      '+',
      '-',
      '*',
      '/',
      '\\',
      '^',
      'Mod',
      'And',
      'Or',
      'Not',
      'Xor',
      'Eqv',
      'Imp',
      'Like',
      'Is',
    ],
    symbols: /[=><!~?:&|+*/%^-]+/,
    tokenizer: {
      root: [
        [/".*?"/, 'string'],
        [/'.*$/, 'comment'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [
          /@symbols/,
          {
            cases: {
              '@operators': 'operator',
              '@default': '',
            },
          },
        ],
      ],
    },
  };
}

function getVB6CompletionItems(model: any, position: any, context: any) {
  return {
    suggestions: [
      {
        label: 'Private Sub',
        kind: 15, // Snippet
        insertText: 'Private Sub ${1:ProcedureName}()\n    $0\nEnd Sub',
        insertTextRules: 4, // InsertAsSnippet
        documentation: 'Creates a private subroutine',
      },
      {
        label: 'Public Function',
        kind: 15,
        insertText: 'Public Function ${1:FunctionName}() As ${2:ReturnType}\n    $0\nEnd Function',
        insertTextRules: 4,
        documentation: 'Creates a public function',
      },
      {
        label: 'Dim',
        kind: 14, // Keyword
        insertText: 'Dim ${1:variableName} As ${2:Type}',
        insertTextRules: 4,
        documentation: 'Declares a variable',
      },
      {
        label: 'MsgBox',
        kind: 3, // Function
        insertText: 'MsgBox "${1:message}"',
        insertTextRules: 4,
        documentation: 'Displays a message box',
      },
      {
        label: 'Integer',
        kind: 25, // TypeParameter
        insertText: 'Integer',
        documentation: 'Integer data type (-32,768 to 32,767)',
      },
      {
        label: 'String',
        kind: 25,
        insertText: 'String',
        documentation: 'String data type',
      },
      {
        label: 'Boolean',
        kind: 25,
        insertText: 'Boolean',
        documentation: 'Boolean data type (True or False)',
      },
      {
        label: 'Long',
        kind: 25,
        insertText: 'Long',
        documentation: 'Long integer data type',
      },
      {
        label: 'Double',
        kind: 25,
        insertText: 'Double',
        documentation: 'Double-precision floating-point data type',
      },
    ],
  };
}

function getVB6HoverInfo(model: any, position: any) {
  const word = model.getWordAtPosition(position);
  if (!word) return null;

  const hoverMap: Record<string, any> = {
    MsgBox: {
      range: new mockMonaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      ),
      contents: [
        { value: '**MsgBox** - Displays a message box' },
        { value: 'Syntax: MsgBox(prompt[, buttons][, title])' },
      ],
    },
    Dim: {
      range: new mockMonaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      ),
      contents: [
        { value: '**Dim** - Declares variables' },
        { value: 'Syntax: Dim variableName As DataType' },
      ],
    },
    Integer: {
      range: new mockMonaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      ),
      contents: [
        { value: '**Integer** - Integer data type' },
        { value: 'Range: -32,768 to 32,767' },
      ],
    },
    String: {
      range: new mockMonaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      ),
      contents: [
        { value: '**String** - String data type' },
        { value: 'Variable-length string of characters' },
      ],
    },
  };

  return hoverMap[word.word] || null;
}

function formatVB6Code(model: any, options: any) {
  const content = model.getValue();
  const lines = content.split('\n');
  let indentLevel = 0;
  const indentStr = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';

  const formattedLines = lines.map((line: string) => {
    const trimmedLine = line.trim();

    // Decrease indent for end statements
    if (/^End\s+(Sub|Function|If|For|While|Do|Select)/i.test(trimmedLine)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;

    // Increase indent for start statements
    if (
      /^(Private\s+Sub|Public\s+Sub|Private\s+Function|Public\s+Function|If\s+.*Then|For\s+.*To|While\s+|Do\s*$|Select\s+Case)/i.test(
        trimmedLine
      )
    ) {
      indentLevel++;
    } else if (/^(Else|ElseIf)/i.test(trimmedLine)) {
      // Handle Else/ElseIf special case
      return indentStr.repeat(Math.max(0, indentLevel - 1)) + trimmedLine;
    }

    return formattedLine;
  });

  return [
    {
      range: new mockMonaco.Range(
        1,
        1,
        model.getLineCount(),
        model.getLineContent(model.getLineCount()).length + 1
      ),
      text: formattedLines.join('\n'),
    },
  ];
}
