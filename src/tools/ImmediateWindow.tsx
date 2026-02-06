import React, { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { EventEmitter } from 'events';

// Immediate Window Types
export enum CommandType {
  Expression = 'Expression',
  Assignment = 'Assignment',
  Print = 'Print',
  Call = 'Call',
  Debug = 'Debug',
}

export enum OutputType {
  Result = 'Result',
  Error = 'Error',
  Debug = 'Debug',
  Warning = 'Warning',
  Info = 'Info',
}

export interface ImmediateCommand {
  id: string;
  command: string;
  type: CommandType;
  timestamp: Date;
  executed: boolean;
  result?: any;
  error?: string;
  executionTime?: number;
}

export interface ImmediateOutput {
  id: string;
  content: string;
  type: OutputType;
  timestamp: Date;
  command?: string;
  lineNumber?: number;
  sourceFile?: string;
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  scope: 'Local' | 'Module' | 'Global';
  readOnly: boolean;
  objectType?: string;
}

export interface DebugContext {
  currentProcedure: string;
  currentModule: string;
  currentLine: number;
  callStack: Array<{
    procedure: string;
    module: string;
    line: number;
    arguments: any[];
  }>;
  variables: Variable[];
  breakpoints: Array<{
    file: string;
    line: number;
    enabled: boolean;
    condition?: string;
  }>;
  isDebugging: boolean;
  isPaused: boolean;
}

interface ImmediateWindowProps {
  debugContext?: DebugContext;
  onExecuteCommand?: (command: string) => Promise<any>;
  onVariableChange?: (name: string, value: any) => void;
  onShowHelp?: (topic: string) => void;
  onOpenFile?: (file: string, line: number) => void;
}

export const ImmediateWindow: React.FC<ImmediateWindowProps> = ({
  debugContext,
  onExecuteCommand,
  onVariableChange,
  onShowHelp,
  onOpenFile,
}) => {
  const [output, setOutput] = useState<ImmediateOutput[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoComplete, setAutoComplete] = useState<string[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [fontSize, setFontSize] = useState(12);
  const [wordWrap, setWordWrap] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [filterOutput, setFilterOutput] = useState<OutputType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const eventEmitter = useRef(new EventEmitter());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const cursorPosition = useRef(0);

  // Built-in VB6 functions and objects for autocomplete
  const builtInItems = [
    // Common functions
    'Abs',
    'Asc',
    'Atn',
    'CBool',
    'CByte',
    'CCur',
    'CDate',
    'CDbl',
    'Chr',
    'CInt',
    'CLng',
    'CSng',
    'CStr',
    'CVar',
    'Date',
    'DateAdd',
    'DateDiff',
    'DatePart',
    'DateSerial',
    'DateValue',
    'Day',
    'Dir',
    'Eof',
    'Exp',
    'FileDateTime',
    'FileLen',
    'Fix',
    'Format',
    'FreeFile',
    'GetAttr',
    'Hex',
    'Hour',
    'IIf',
    'InStr',
    'Int',
    'IsArray',
    'IsDate',
    'IsEmpty',
    'IsError',
    'IsMissing',
    'IsNull',
    'IsNumeric',
    'IsObject',
    'LBound',
    'LCase',
    'Left',
    'Len',
    'LoadPicture',
    'Loc',
    'LOF',
    'Log',
    'LTrim',
    'Mid',
    'Minute',
    'Month',
    'MsgBox',
    'Now',
    'Oct',
    'QBColor',
    'RGB',
    'Right',
    'Rnd',
    'Round',
    'RTrim',
    'Second',
    'Sgn',
    'Sin',
    'Space',
    'Sqr',
    'Str',
    'StrComp',
    'String',
    'Tan',
    'Time',
    'Timer',
    'TimeSerial',
    'TimeValue',
    'Trim',
    'TypeName',
    'UBound',
    'UCase',
    'Val',
    'VarType',
    'WeekDay',
    'Year',

    // Objects and collections
    'App',
    'Clipboard',
    'Debug',
    'Err',
    'Forms',
    'Printer',
    'Screen',

    // Debug object methods
    'Debug.Print',
    'Debug.Assert',

    // Keywords
    'Call',
    'Dim',
    'Set',
    'Let',
    'If',
    'Then',
    'Else',
    'ElseIf',
    'End',
    'For',
    'Next',
    'Do',
    'Loop',
    'While',
    'Wend',
    'Select',
    'Case',
    'Function',
    'Sub',
    'Private',
    'Public',
    'Static',
    'Const',
    'Type',
    'Enum',
    'With',
    'Exit',
    'Return',
    'GoTo',
    'Resume',
    'On',
    'Error',
    'True',
    'False',
    'Nothing',
    'Null',
    'Empty',
  ];

  // Initialize with welcome message
  useEffect(() => {
    addOutput('Visual Basic 6.0 Immediate Window', OutputType.Info);
    addOutput('Type VB expressions, statements, or method calls.', OutputType.Info);
    addOutput('Use ? to print expression values (e.g., ? Now)', OutputType.Info);
    addOutput('', OutputType.Info);
  }, []);

  // Add output to the window
  const addOutput = useCallback((content: string, type: OutputType, command?: string) => {
    const newOutput: ImmediateOutput = {
      id: `output_${Date.now()}_${Math.random()}`,
      content,
      type,
      timestamp: new Date(),
      command,
    };

    setOutput(prev => [...prev, newOutput]);

    // Auto-scroll to bottom
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 10);
  }, []);

  // Execute immediate command
  const executeCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      setIsExecuting(true);
      const startTime = performance.now();

      try {
        // Add command to output
        addOutput(command, OutputType.Info, command);

        // Add to history
        setCommandHistory(prev => {
          const newHistory = [command, ...prev.filter(cmd => cmd !== command)];
          return newHistory.slice(0, 50); // Keep last 50 commands
        });

        // Parse and execute command
        const result = await executeVBCommand(command);

        if (result !== undefined) {
          const output = typeof result === 'string' ? result : JSON.stringify(result);
          addOutput(output, OutputType.Result, command);
        }

        const executionTime = performance.now() - startTime;

        // Call external handler if provided
        if (onExecuteCommand) {
          try {
            const externalResult = await onExecuteCommand(command);
            if (externalResult !== undefined) {
              addOutput(String(externalResult), OutputType.Result, command);
            }
          } catch (error) {
            addOutput(`Error: ${error}`, OutputType.Error, command);
          }
        }
      } catch (error) {
        addOutput(`Error: ${error}`, OutputType.Error, command);
      } finally {
        setIsExecuting(false);
      }
    },
    [addOutput, onExecuteCommand]
  );

  // Execute VB command (simplified parser/interpreter)
  const executeVBCommand = async (command: string): Promise<any> => {
    const trimmedCommand = command.trim();

    // Handle print statements (? expression)
    if (trimmedCommand.startsWith('?')) {
      const expression = trimmedCommand.substring(1).trim();
      return evaluateExpression(expression);
    }

    // Handle Debug.Print statements
    if (trimmedCommand.toLowerCase().startsWith('debug.print')) {
      const expression = trimmedCommand.substring(11).trim();
      return evaluateExpression(expression);
    }

    // Handle variable assignments
    if (trimmedCommand.includes('=') && !trimmedCommand.includes('==')) {
      const [variable, value] = trimmedCommand.split('=').map(s => s.trim());
      const evaluatedValue = evaluateExpression(value);

      // Update variable in debug context
      if (onVariableChange) {
        onVariableChange(variable, evaluatedValue);
      }

      return `${variable} = ${evaluatedValue}`;
    }

    // Handle function calls
    if (trimmedCommand.includes('(') && trimmedCommand.includes(')')) {
      return evaluateFunction(trimmedCommand);
    }

    // Handle simple expressions
    return evaluateExpression(trimmedCommand);
  };

  // Evaluate VB expression (simplified)
  const evaluateExpression = (expression: string): any => {
    const expr = expression.trim();

    // Handle string literals
    if (
      (expr.startsWith('"') && expr.endsWith('"')) ||
      (expr.startsWith("'") && expr.endsWith("'"))
    ) {
      return expr.slice(1, -1);
    }

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }

    // Handle boolean values
    if (expr.toLowerCase() === 'true') return true;
    if (expr.toLowerCase() === 'false') return false;
    if (expr.toLowerCase() === 'null') return null;
    if (expr.toLowerCase() === 'nothing') return null;

    // Handle Now function
    if (expr.toLowerCase() === 'now') {
      return new Date().toLocaleString();
    }

    // Handle Date function
    if (expr.toLowerCase() === 'date') {
      return new Date().toLocaleDateString();
    }

    // Handle Time function
    if (expr.toLowerCase() === 'time') {
      return new Date().toLocaleTimeString();
    }

    // Handle variable references
    if (debugContext?.variables) {
      const variable = debugContext.variables.find(
        v => v.name.toLowerCase() === expr.toLowerCase()
      );
      if (variable) {
        return `${variable.name} = ${variable.value} (${variable.type})`;
      }
    }

    // Handle string concatenation
    if (expr.includes('&') || expr.includes('+')) {
      try {
        // Simple concatenation for demo
        const parts = expr.split(/[&+]/).map(p => p.trim());
        return parts.map(p => evaluateExpression(p)).join('');
      } catch {
        return `Cannot evaluate: ${expr}`;
      }
    }

    // Handle math expressions safely without eval()
    if (/^[\d\s+\-*/().-]+$/.test(expr)) {
      try {
        return safeMathEvaluator(expr);
      } catch {
        return `Invalid expression: ${expr}`;
      }
    }

    return `Unknown identifier: ${expr}`;
  };

  // Evaluate function calls
  const evaluateFunction = (call: string): any => {
    const funcMatch = call.match(/(\w+)\s*\((.*)\)/);
    if (!funcMatch) return `Invalid function call: ${call}`;

    const [, funcName, args] = funcMatch;
    const argList = args ? args.split(',').map(a => a.trim()) : [];

    switch (funcName.toLowerCase()) {
      case 'len':
        if (argList.length === 1) {
          const str = evaluateExpression(argList[0]);
          return typeof str === 'string' ? str.length : String(str).length;
        }
        break;

      case 'ucase':
        if (argList.length === 1) {
          const str = evaluateExpression(argList[0]);
          return String(str).toUpperCase();
        }
        break;

      case 'lcase':
        if (argList.length === 1) {
          const str = evaluateExpression(argList[0]);
          return String(str).toLowerCase();
        }
        break;

      case 'left':
        if (argList.length === 2) {
          const str = String(evaluateExpression(argList[0]));
          const length = Number(evaluateExpression(argList[1]));
          return str.substring(0, length);
        }
        break;

      case 'right':
        if (argList.length === 2) {
          const str = String(evaluateExpression(argList[0]));
          const length = Number(evaluateExpression(argList[1]));
          return str.substring(str.length - length);
        }
        break;

      case 'mid':
        if (argList.length >= 2) {
          const str = String(evaluateExpression(argList[0]));
          const start = Number(evaluateExpression(argList[1])) - 1; // VB is 1-based
          const length = argList.length > 2 ? Number(evaluateExpression(argList[2])) : str.length;
          return str.substring(start, start + length);
        }
        break;

      case 'msgbox':
        if (argList.length >= 1) {
          const message = String(evaluateExpression(argList[0]));
          // In a real implementation, this would show a dialog
          return `MsgBox: "${message}"`;
        }
        break;

      case 'typename':
        if (argList.length === 1) {
          const value = evaluateExpression(argList[0]);
          return typeof value;
        }
        break;

      default:
        return `Unknown function: ${funcName}`;
    }

    return `Invalid arguments for ${funcName}`;
  };

  // Get autocomplete suggestions
  const getAutoCompleteSuggestions = useCallback(
    (text: string, cursorPos: number): string[] => {
      const beforeCursor = text.substring(0, cursorPos);
      const lastWord = beforeCursor.split(/[\s()[\],=&+-*/]/).pop() || '';

      if (lastWord.length < 1) return [];

      const suggestions = [];

      // Add built-in items
      suggestions.push(
        ...builtInItems.filter(item => item.toLowerCase().startsWith(lastWord.toLowerCase()))
      );

      // Add variables from debug context
      if (debugContext?.variables) {
        suggestions.push(
          ...debugContext.variables
            .filter(v => v.name.toLowerCase().startsWith(lastWord.toLowerCase()))
            .map(v => v.name)
        );
      }

      // Add command history items
      suggestions.push(
        ...commandHistory
          .filter(cmd => cmd.toLowerCase().includes(lastWord.toLowerCase()))
          .slice(0, 5)
      );

      return [...new Set(suggestions)].slice(0, 10);
    },
    [builtInItems, debugContext, commandHistory]
  );

  // Handle key press in input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (currentCommand.trim()) {
          executeCommand(currentCommand);
          setCurrentCommand('');
          setHistoryIndex(-1);
        }
        setShowAutoComplete(false);
      } else if (e.key === 'ArrowUp' && !showAutoComplete) {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      } else if (e.key === 'ArrowDown' && !showAutoComplete) {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (showAutoComplete && autoComplete.length > 0) {
          const selected = autoComplete[autoCompleteIndex];
          const beforeCursor = currentCommand.substring(0, cursorPosition.current);
          const afterCursor = currentCommand.substring(cursorPosition.current);
          const lastWordStart = beforeCursor
            .split(/[\s()[\],=&+-*/]/)
            .slice(0, -1)
            .join(' ');
          const newCommand = (lastWordStart ? lastWordStart + ' ' : '') + selected + afterCursor;
          setCurrentCommand(newCommand);
          setShowAutoComplete(false);
        }
      } else if (e.key === 'Escape') {
        setShowAutoComplete(false);
      } else if (showAutoComplete) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setAutoCompleteIndex(prev => (prev > 0 ? prev - 1 : autoComplete.length - 1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setAutoCompleteIndex(prev => (prev < autoComplete.length - 1 ? prev + 1 : 0));
        }
      }
    },
    [
      currentCommand,
      historyIndex,
      commandHistory,
      showAutoComplete,
      autoComplete,
      autoCompleteIndex,
      executeCommand,
    ]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;

      setCurrentCommand(value);
      cursorPosition.current = cursorPos;

      // Update autocomplete
      const suggestions = getAutoCompleteSuggestions(value, cursorPos);
      setAutoComplete(suggestions);
      setShowAutoComplete(suggestions.length > 0);
      setAutoCompleteIndex(0);
    },
    [getAutoCompleteSuggestions]
  );

  // Filter output based on type
  const getFilteredOutput = (): ImmediateOutput[] => {
    if (filterOutput.length === 0 && !searchText) return output;

    return output.filter(item => {
      const typeMatch = filterOutput.length === 0 || filterOutput.includes(item.type);
      const textMatch =
        !searchText || item.content.toLowerCase().includes(searchText.toLowerCase());
      return typeMatch && textMatch;
    });
  };

  // Clear output
  const clearOutput = useCallback(() => {
    setOutput([]);
    addOutput('Immediate window cleared.', OutputType.Info);
  }, [addOutput]);

  // Get output type style
  const getOutputTypeStyle = (type: OutputType): React.CSSProperties => {
    switch (type) {
      case OutputType.Error:
        return { color: '#d32f2f', fontWeight: 'bold' };
      case OutputType.Warning:
        return { color: '#f57c00' };
      case OutputType.Debug:
        return { color: '#1976d2' };
      case OutputType.Result:
        return { color: '#388e3c', fontWeight: 'bold' };
      case OutputType.Info:
      default:
        return { color: '#424242' };
    }
  };

  // Context menu items
  const contextMenuItems = [
    { label: 'Copy', action: () => navigator.clipboard.writeText(currentCommand) },
    {
      label: 'Paste',
      action: async () => {
        const text = await navigator.clipboard.readText();
        setCurrentCommand(prev => prev + text);
      },
    },
    { label: 'Select All', action: () => inputRef.current?.select() },
    { label: 'Clear', action: () => setCurrentCommand('') },
    { label: 'Clear All Output', action: clearOutput },
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Immediate</h3>
          {debugContext?.isDebugging && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
              {debugContext.isPaused ? 'Paused' : 'Running'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded w-24"
          />

          <select
            value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            className="px-1 py-1 text-xs border border-gray-300 rounded"
          >
            <option value={8}>8pt</option>
            <option value={9}>9pt</option>
            <option value={10}>10pt</option>
            <option value={11}>11pt</option>
            <option value={12}>12pt</option>
            <option value={14}>14pt</option>
            <option value={16}>16pt</option>
          </select>

          <button
            onClick={clearOutput}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            title="Clear All"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs text-gray-600">Show:</span>
        {Object.values(OutputType).map(type => (
          <label key={type} className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={filterOutput.length === 0 || filterOutput.includes(type)}
              onChange={e => {
                if (e.target.checked) {
                  setFilterOutput(prev => prev.filter(t => t !== type));
                } else {
                  setFilterOutput(prev => [...prev, type]);
                }
              }}
              className="text-xs"
            />
            <span>{type}</span>
          </label>
        ))}
      </div>

      {/* Output Area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-2 font-mono bg-white"
        style={{ fontSize: `${fontSize}px` }}
      >
        {getFilteredOutput().map(item => (
          <div key={item.id} className="mb-1 leading-tight" style={getOutputTypeStyle(item.type)}>
            {showLineNumbers && (
              <span className="text-gray-400 mr-2 select-none">
                {item.timestamp.toLocaleTimeString()}
              </span>
            )}
            <span
              className={wordWrap ? 'break-words' : 'whitespace-nowrap'}
              style={{ wordBreak: wordWrap ? 'break-all' : 'normal' }}
            >
              {item.content}
            </span>
          </div>
        ))}

        {isExecuting && <div className="text-blue-600 animate-pulse">Executing...</div>}
      </div>

      {/* Input Area */}
      <div className="relative border-t border-gray-300">
        <textarea
          ref={inputRef}
          value={currentCommand}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onContextMenu={e => {
            e.preventDefault();
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setIsContextMenuOpen(true);
          }}
          placeholder="Type VB expression or statement..."
          className="w-full p-2 font-mono border-none resize-none focus:outline-none"
          style={{
            fontSize: `${fontSize}px`,
            minHeight: '60px',
            maxHeight: '150px',
          }}
          disabled={isExecuting}
        />

        {/* Autocomplete Dropdown */}
        {showAutoComplete && autoComplete.length > 0 && (
          <div className="absolute bottom-full left-2 right-2 bg-white border border-gray-300 shadow-lg max-h-32 overflow-y-auto z-10">
            {autoComplete.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-2 py-1 text-sm cursor-pointer ${
                  index === autoCompleteIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  const beforeCursor = currentCommand.substring(0, cursorPosition.current);
                  const afterCursor = currentCommand.substring(cursorPosition.current);
                  const lastWordStart = beforeCursor
                    .split(/[\s()[\],=&+-*/]/)
                    .slice(0, -1)
                    .join(' ');
                  const newCommand =
                    (lastWordStart ? lastWordStart + ' ' : '') + suggestion + afterCursor;
                  setCurrentCommand(newCommand);
                  setShowAutoComplete(false);
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {isContextMenuOpen && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg z-50 py-1"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onBlur={() => setIsContextMenuOpen(false)}
        >
          {contextMenuItems.map((item, index) => (
            <button
              key={index}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => {
                item.action();
                setIsContextMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Commands: {commandHistory.length}</span>
          <span>Output Lines: {output.length}</span>
          {debugContext && (
            <span>
              Context: {debugContext.currentModule}.{debugContext.currentProcedure}:
              {debugContext.currentLine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={wordWrap}
              onChange={e => setWordWrap(e.target.checked)}
            />
            Word Wrap
          </label>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={e => setShowLineNumbers(e.target.checked)}
            />
            Timestamps
          </label>
        </div>
      </div>
    </div>
  );
};

export default ImmediateWindow;
