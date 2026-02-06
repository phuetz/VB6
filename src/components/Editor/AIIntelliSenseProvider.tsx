// Ultra-Think AI IntelliSense Provider for Monaco Editor
// 🎯 Intégration seamless avec suggestions contextuelles intelligentes

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as monaco from 'monaco-editor';
import {
  aiIntelliSenseEngine,
  CompletionItem,
  CompletionItemKind,
  CompletionContext,
} from '../../services/AIIntelliSenseEngine';
import { Control } from '../../context/types';
import { Brain, Sparkles, Zap, TrendingUp, Code, History } from 'lucide-react';

interface AIIntelliSenseProviderProps {
  editor: monaco.editor.IStandaloneCodeEditor;
  controls: Control[];
  onCompletionAccepted?: (item: CompletionItem) => void;
}

interface IntelliSenseStats {
  totalSuggestions: number;
  acceptedSuggestions: number;
  aiSuggestions: number;
  averageScore: number;
  learningProgress: number;
}

export const AIIntelliSenseProvider: React.FC<AIIntelliSenseProviderProps> = ({
  editor,
  controls,
  onCompletionAccepted,
}) => {
  const disposablesRef = useRef<monaco.IDisposable[]>([]);
  const recentCompletionsRef = useRef<string[]>([]);
  const userPatternsRef = useRef<Map<string, number>>(new Map());

  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<IntelliSenseStats>({
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    aiSuggestions: 0,
    averageScore: 0,
    learningProgress: 0,
  });

  // Convert our completion items to Monaco format
  const convertToMonacoSuggestion = useCallback(
    (item: CompletionItem, range: monaco.IRange): monaco.languages.CompletionItem => {
      // Map our completion kinds to Monaco kinds
      const kindMap: Record<number, monaco.languages.CompletionItemKind> = {
        [CompletionItemKind.Text]: monaco.languages.CompletionItemKind.Text,
        [CompletionItemKind.Method]: monaco.languages.CompletionItemKind.Method,
        [CompletionItemKind.Function]: monaco.languages.CompletionItemKind.Function,
        [CompletionItemKind.Constructor]: monaco.languages.CompletionItemKind.Constructor,
        [CompletionItemKind.Field]: monaco.languages.CompletionItemKind.Field,
        [CompletionItemKind.Variable]: monaco.languages.CompletionItemKind.Variable,
        [CompletionItemKind.Class]: monaco.languages.CompletionItemKind.Class,
        [CompletionItemKind.Interface]: monaco.languages.CompletionItemKind.Interface,
        [CompletionItemKind.Module]: monaco.languages.CompletionItemKind.Module,
        [CompletionItemKind.Property]: monaco.languages.CompletionItemKind.Property,
        [CompletionItemKind.Unit]: monaco.languages.CompletionItemKind.Unit,
        [CompletionItemKind.Value]: monaco.languages.CompletionItemKind.Value,
        [CompletionItemKind.Enum]: monaco.languages.CompletionItemKind.Enum,
        [CompletionItemKind.Keyword]: monaco.languages.CompletionItemKind.Keyword,
        [CompletionItemKind.Snippet]: monaco.languages.CompletionItemKind.Snippet,
        [CompletionItemKind.Color]: monaco.languages.CompletionItemKind.Color,
        [CompletionItemKind.File]: monaco.languages.CompletionItemKind.File,
        [CompletionItemKind.Reference]: monaco.languages.CompletionItemKind.Reference,
        [CompletionItemKind.Folder]: monaco.languages.CompletionItemKind.Folder,
        [CompletionItemKind.EnumMember]: monaco.languages.CompletionItemKind.EnumMember,
        [CompletionItemKind.Constant]: monaco.languages.CompletionItemKind.Constant,
        [CompletionItemKind.Struct]: monaco.languages.CompletionItemKind.Struct,
        [CompletionItemKind.Event]: monaco.languages.CompletionItemKind.Event,
        [CompletionItemKind.Operator]: monaco.languages.CompletionItemKind.Operator,
        [CompletionItemKind.TypeParameter]: monaco.languages.CompletionItemKind.TypeParameter,
        [CompletionItemKind.AIGenerated]: monaco.languages.CompletionItemKind.Customcolor,
      };

      // Create tags array
      const tags: monaco.languages.CompletionItemTag[] = [];
      if (item.tags?.includes(1)) {
        // Deprecated
        tags.push(monaco.languages.CompletionItemTag.Deprecated);
      }

      // Build label with AI indicator
      let label = item.label;
      if (item.source === 'ai') {
        label = `✨ ${label}`;
      } else if (item.source === 'snippet') {
        label = `📄 ${label}`;
      } else if (item.tags?.includes(3)) {
        // Popular
        label = `⭐ ${label}`;
      }

      // Create the suggestion
      const suggestion: monaco.languages.CompletionItem = {
        label: {
          label: item.label,
          detail: item.detail,
          description: item.source === 'ai' ? '✨ AI' : undefined,
        },
        kind: kindMap[item.kind] || monaco.languages.CompletionItemKind.Text,
        documentation: {
          value: item.documentation || '',
          supportHtml: true,
        },
        insertText: item.insertText,
        range,
        tags,
        sortText: String(1000 - Math.round(item.score * 100)).padStart(4, '0'), // Higher score = earlier in list
        filterText: item.filterText || item.label,
        preselect: item.preselect || false,
        commitCharacters: item.commitCharacters,
        command: item.command
          ? {
              id: item.command.command,
              title: item.command.title,
              arguments: item.command.arguments,
            }
          : undefined,
      };

      // Handle snippets
      if (item.insertTextRules?.some(rule => rule.type === 'snippet')) {
        suggestion.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      }

      // Add additional text edits
      if (item.additionalTextEdits) {
        suggestion.additionalTextEdits = item.additionalTextEdits.map(edit => ({
          range: new monaco.Range(
            edit.range.start.line + 1,
            edit.range.start.character + 1,
            edit.range.end.line + 1,
            edit.range.end.character + 1
          ),
          text: edit.newText,
        }));
      }

      return suggestion;
    },
    []
  );

  // Main completion provider
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      context: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      try {
        // Get the current code
        const code = model.getValue();

        // Create completion context
        const completionContext: CompletionContext = {
          code,
          position: {
            line: position.lineNumber - 1, // Convert to 0-based
            character: position.column - 1,
          },
          triggerCharacter: context.triggerCharacter,
          controls,
          recentCompletions: recentCompletionsRef.current,
          userPatterns: userPatternsRef.current,
          projectType: detectProjectType(code),
        };

        // Get AI-powered completions
        const completions = await aiIntelliSenseEngine.getCompletions(completionContext);

        // Update stats
        setStats(prev => ({
          ...prev,
          totalSuggestions: prev.totalSuggestions + completions.length,
          aiSuggestions: prev.aiSuggestions + completions.filter(c => c.source === 'ai').length,
          averageScore:
            completions.reduce((sum, c) => sum + c.score, 0) / Math.max(completions.length, 1),
        }));

        // Get the word range at the current position
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        };

        // Convert to Monaco suggestions
        const suggestions = completions.map(item => convertToMonacoSuggestion(item, range));

        return {
          suggestions,
          incomplete: completions.length >= 100, // Indicate if there might be more results
        };
      } catch (error) {
        console.error('AI IntelliSense error:', error);
        return { suggestions: [] };
      }
    },
    [controls, convertToMonacoSuggestion]
  );

  // Completion item resolver for additional details
  const resolveCompletionItem = useCallback(
    (
      item: monaco.languages.CompletionItem,
      token: monaco.CancellationToken
    ): monaco.languages.CompletionItem => {
      // Add enhanced documentation on hover
      if (item.label && typeof item.label !== 'string') {
        const label = item.label.label;

        // Add code examples for functions
        if (item.kind === monaco.languages.CompletionItemKind.Function) {
          item.documentation = {
            value: `${item.documentation?.value || ''}\n\n**Example:**\n\`\`\`vb\n${generateExample(label)}\n\`\`\``,
            supportHtml: true,
          };
        }
      }

      return item;
    },
    []
  );

  // Register the completion provider
  useEffect(() => {
    // Register for VB language
    const completionProvider = monaco.languages.registerCompletionItemProvider('vb', {
      provideCompletionItems,
      resolveCompletionItem,
      triggerCharacters: ['.', ' ', '(', '=', ':'],
    });

    disposablesRef.current.push(completionProvider);

    // Custom command for accepting completions
    const acceptCommand = editor.addCommand(0, (ctx, ...args) => {
      const [item] = args;
      if (item && onCompletionAccepted) {
        onCompletionAccepted(item);

        // Record in AI engine for learning
        const position = editor.getPosition();
        if (position) {
          const completionContext: CompletionContext = {
            code: editor.getValue(),
            position: {
              line: position.lineNumber - 1,
              character: position.column - 1,
            },
            controls,
            recentCompletions: recentCompletionsRef.current,
            userPatterns: userPatternsRef.current,
          };

          aiIntelliSenseEngine.recordSelection(item, completionContext);

          // Update local tracking
          recentCompletionsRef.current.unshift(item.label);
          if (recentCompletionsRef.current.length > 20) {
            recentCompletionsRef.current.pop();
          }

          const patternCount = userPatternsRef.current.get(item.label) || 0;
          userPatternsRef.current.set(item.label, patternCount + 1);

          // Update stats
          setStats(prev => ({
            ...prev,
            acceptedSuggestions: prev.acceptedSuggestions + 1,
            learningProgress: Math.min((prev.acceptedSuggestions + 1) / 100, 1),
          }));
        }
      }
    });

    // Listen for suggestion acceptance
    const suggestionListener = editor.onDidChangeCursorSelection(e => {
      // This is a simplified version - in production, we'd need more sophisticated tracking
      const model = editor.getModel();
      if (model && e.source === 'keyboard' && e.reason === 3) {
        // Reason 3 = explicit
        const position = e.selection.getPosition();
        const word = model.getWordAtPosition(position);
        if (word) {
          const recent = recentCompletionsRef.current[0];
          if (recent && word.word.includes(recent)) {
            setStats(prev => ({
              ...prev,
              acceptedSuggestions: prev.acceptedSuggestions + 1,
            }));
          }
        }
      }
    });

    disposablesRef.current.push(suggestionListener);

    // Add custom keybinding for AI assist
    const aiAssistAction = editor.addAction({
      id: 'ai-assist',
      label: 'AI Code Assistant',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space],
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: 'ai',
      contextMenuOrder: 1,
      run: async ed => {
        // Trigger suggestions with AI boost
        aiIntelliSenseEngine.updateConfig({ confidenceThreshold: 0.1 });
        editor.trigger('ai-assist', 'editor.action.triggerSuggest', {});
        setTimeout(() => {
          aiIntelliSenseEngine.updateConfig({ confidenceThreshold: 0.3 });
        }, 1000);
      },
    });

    disposablesRef.current.push(aiAssistAction);

    return () => {
      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = [];
    };
  }, [editor, controls, onCompletionAccepted, provideCompletionItems, resolveCompletionItem]);

  // Keyboard shortcut for stats toggle
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setShowStats(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      {/* AI IntelliSense Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg">
          <Brain size={14} className="animate-pulse" />
          <span>AI IntelliSense Active</span>
          <button
            onClick={() => setShowStats(!showStats)}
            className="ml-2 hover:bg-purple-700 rounded p-1"
            title="Toggle stats (Ctrl+Shift+I)"
          >
            <TrendingUp size={12} />
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 w-80 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={16} />
              AI IntelliSense Stats
            </h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Learning Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Learning Progress</span>
                <span>{Math.round(stats.learningProgress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.learningProgress * 100}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-600">Total Suggestions</div>
                <div className="font-semibold text-lg">{stats.totalSuggestions}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-600">Accepted</div>
                <div className="font-semibold text-lg text-green-600">
                  {stats.acceptedSuggestions}
                </div>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <div className="text-gray-600">AI Generated</div>
                <div className="font-semibold text-lg text-purple-600">{stats.aiSuggestions}</div>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <div className="text-gray-600">Avg Score</div>
                <div className="font-semibold text-lg text-blue-600">
                  {(stats.averageScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Recent Patterns */}
            <div>
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <History size={12} />
                Recent Completions
              </div>
              <div className="flex flex-wrap gap-1">
                {recentCompletionsRef.current.slice(0, 5).map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  aiIntelliSenseEngine.clearCache();
                  setStats({
                    totalSuggestions: 0,
                    acceptedSuggestions: 0,
                    aiSuggestions: 0,
                    averageScore: 0,
                    learningProgress: 0,
                  });
                }}
                className="flex-1 text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Reset Stats
              </button>
              <button
                onClick={() => {
                  editor.trigger('ai-boost', 'editor.action.triggerSuggest', {});
                }}
                className="flex-1 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex items-center justify-center gap-1"
              >
                <Zap size={12} />
                AI Boost
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper functions
function detectProjectType(code: string): 'desktop' | 'web' | 'database' | 'game' {
  if (code.includes('Recordset') || code.includes('Database')) return 'database';
  if (code.includes('Game') || code.includes('Sprite')) return 'game';
  if (code.includes('WebBrowser') || code.includes('HTML')) return 'web';
  return 'desktop';
}

function generateExample(functionName: string): string {
  const examples: Record<string, string> = {
    MsgBox: `result = MsgBox("Hello World!", vbOKCancel + vbInformation, "Example")
If result = vbOK Then
    ' User clicked OK
End If`,
    InputBox: `userName = InputBox("Enter your name:", "User Input", "Default Name")
If userName <> "" Then
    MsgBox "Hello, " & userName
End If`,
    Format: `formattedDate = Format(Now, "dd/mm/yyyy")
formattedCurrency = Format(1234.56, "Currency")`,
    Len: `textLength = Len("Hello World")
If Len(TextBox1.Text) > 50 Then
    MsgBox "Text too long!"
End If`,
  };

  return (
    examples[functionName] ||
    `' Example usage of ${functionName}
result = ${functionName}(parameters)`
  );
}

export default AIIntelliSenseProvider;
