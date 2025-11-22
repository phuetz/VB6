import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Terminal, 
  Play, 
  Square, 
  RotateCcw, 
  Copy, 
  Trash2, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { vb6TypeSystem } from '../../services/VB6TypeSystem';
import { vb6FileSystem } from '../../services/VB6FileSystem';
import { vb6WindowsAPI } from '../../services/VB6WindowsAPI';

interface ImmediateWindowProps {
  visible: boolean;
  onClose?: () => void;
  onExecuteStatement?: (statement: string) => any;
  onPrint?: (text: string) => void;
}

interface CommandHistory {
  command: string;
  result?: any;
  error?: string;
  timestamp: Date;
  type: 'input' | 'output' | 'error' | 'info';
}

const ImmediateWindow: React.FC<ImmediateWindowProps> = ({
  visible,
  onClose,
  onExecuteStatement,
  onPrint
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [variables, setVariables] = useState<Map<string, any>>(new Map());

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          command: '',
          result: 'VB6 Immediate Window - Ready',
          timestamp: new Date(),
          type: 'info'
        }
      ]);
    }
  }, [history.length]);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when window becomes visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Built-in VB6 immediate window functions
  const builtInFunctions = {
    // Debug functions
    print: (...args: any[]) => {
      const output = args.map(arg => String(arg)).join(' ');
      addToHistory('', output, 'output');
      if (onPrint) onPrint(output);
      return output;
    },
    
    // Variable inspection
    '?': (expression: string) => {
      try {
        const result = evaluateExpression(expression);
        return result;
      } catch (error) {
        throw new Error(`Cannot evaluate expression: ${expression}`);
      }
    },
    
    // Clear screen
    cls: () => {
      setHistory([]);
      return '';
    },
    
    // List variables
    vars: () => {
      if (variables.size === 0) {
        return 'No variables defined';
      }
      
      const varList = Array.from(variables.entries())
        .map(([name, value]) => `${name} = ${formatValue(value)}`)
        .join('\n');
      
      return varList;
    },
    
    // Type system functions
    typeof: (varName: string) => {
      if (variables.has(varName)) {
        const value = variables.get(varName);
        return getVB6Type(value);
      }
      return 'Undefined';
    },
    
    // File system functions
    dir: (pathname?: string) => {
      return vb6FileSystem.dir(pathname);
    },
    
    // Math functions
    sqr: (n: number) => Math.sqrt(n),
    abs: (n: number) => Math.abs(n),
    int: (n: number) => Math.floor(n),
    rnd: () => Math.random(),
    
    // String functions
    len: (s: string) => String(s).length,
    left: (s: string, n: number) => String(s).substring(0, n),
    right: (s: string, n: number) => String(s).substring(String(s).length - n),
    mid: (s: string, start: number, length?: number) => String(s).substring(start - 1, length ? start - 1 + length : undefined),
    ucase: (s: string) => String(s).toUpperCase(),
    lcase: (s: string) => String(s).toLowerCase(),
    trim: (s: string) => String(s).trim(),
    
    // Date functions
    now: () => new Date(),
    date: () => new Date().toDateString(),
    time: () => new Date().toTimeString(),
    
    // Type conversion
    cstr: (value: any) => String(value),
    cint: (value: any) => parseInt(String(value), 10),
    clng: (value: any) => parseInt(String(value), 10),
    cdbl: (value: any) => parseFloat(String(value)),
    cbool: (value: any) => Boolean(value),
    
    // Object inspection
    typename: (obj: any) => {
      if (obj === null) return 'Nothing';
      if (obj === undefined) return 'Empty';
      return obj.constructor.name || typeof obj;
    },
    
    // Help
    help: () => {
      return `VB6 Immediate Window Commands:
? expression     - Evaluate and print expression
Print expression - Print expression result  
Cls             - Clear screen
Vars            - List all variables
TypeOf varname  - Show variable type
Help            - Show this help

Built-in Functions:
Math: Sqr, Abs, Int, Rnd
String: Len, Left, Right, Mid, UCase, LCase, Trim
Date: Now, Date, Time
Conversion: CStr, CInt, CLng, CDbl, CBool
File: Dir

Examples:
? 2 + 3
Print "Hello World"
x = 10
? x * 2
Print Len("VB6")`;
    }
  };

  // Add entry to history
  const addToHistory = useCallback((command: string, result?: any, type: CommandHistory['type'] = 'output', error?: string) => {
    setHistory(prev => [...prev, {
      command,
      result,
      error,
      timestamp: new Date(),
      type
    }]);
  }, []);

  // Evaluate VB6 expression
  const evaluateExpression = useCallback((expression: string): any => {
    // Handle variable assignment
    const assignmentMatch = expression.match(/^\s*(\w+)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const [, varName, valueExpr] = assignmentMatch;
      const value = evaluateExpression(valueExpr);
      variables.set(varName, value);
      setVariables(new Map(variables));
      return value;
    }

    // Handle variable reference
    if (/^\w+$/.test(expression.trim())) {
      const varName = expression.trim();
      if (variables.has(varName)) {
        return variables.get(varName);
      }
      
      // Check constants
      try {
        return vb6TypeSystem.getConstantValue(varName);
      } catch {
        // Variable not found
        throw new Error(`Variable '${varName}' is not defined`);
      }
    }

    // Handle string literals
    if (expression.startsWith('"') && expression.endsWith('"')) {
      return expression.slice(1, -1);
    }

    // Handle numeric literals
    const numValue = parseFloat(expression);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Handle boolean literals
    if (expression.toLowerCase() === 'true') return true;
    if (expression.toLowerCase() === 'false') return false;

    // Handle simple arithmetic expressions
    try {
      // Very basic expression evaluator (in production, would use a proper parser)
      const sanitized = expression
        .replace(/\b(\w+)/g, (match) => {
          if (variables.has(match)) {
            const value = variables.get(match);
            return typeof value === 'string' ? `"${value}"` : String(value);
          }
          return match;
        });

      // Use Function constructor for safe evaluation (limited scope)
      const func = new Function('return ' + sanitized);
      return func();
    } catch {
      throw new Error(`Cannot evaluate expression: ${expression}`);
    }
  }, [variables]);

  // Get VB6 type name for a value
  const getVB6Type = useCallback((value: any): string => {
    if (value === null) return 'Nothing';
    if (value === undefined) return 'Empty';
    
    switch (typeof value) {
      case 'string': return 'String';
      case 'number': 
        if (Number.isInteger(value)) {
          if (value >= -32768 && value <= 32767) return 'Integer';
          return 'Long';
        }
        return 'Double';
      case 'boolean': return 'Boolean';
      case 'object':
        if (value instanceof Date) return 'Date';
        if (Array.isArray(value)) return 'Array';
        return 'Object';
      default: return 'Variant';
    }
  }, []);

  // Format value for display
  const formatValue = useCallback((value: any): string => {
    if (value === null) return 'Nothing';
    if (value === undefined) return 'Empty';
    if (typeof value === 'string') return `"${value}"`;
    if (value instanceof Date) return value.toLocaleString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return Object.prototype.toString.call(value);
    return String(value);
  }, []);

  // Execute command
  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    setIsExecuting(true);
    addToHistory(command, undefined, 'input');

    try {
      let result: any;

      // Handle Print statement
      if (command.toLowerCase().startsWith('print ')) {
        const expression = command.substring(6);
        result = evaluateExpression(expression);
        builtInFunctions.print(result);
      }
      // Handle ? (immediate evaluation)
      else if (command.startsWith('?')) {
        const expression = command.substring(1).trim();
        result = evaluateExpression(expression);
        addToHistory('', formatValue(result), 'output');
      }
      // Handle Debug.Print
      else if (command.toLowerCase().startsWith('debug.print ')) {
        const expression = command.substring(12);
        result = evaluateExpression(expression);
        builtInFunctions.print(result);
      }
      // Handle built-in functions
      else if (command.toLowerCase() in builtInFunctions) {
        const funcName = command.toLowerCase() as keyof typeof builtInFunctions;
        result = builtInFunctions[funcName]();
        if (result !== '') {
          addToHistory('', result, 'output');
        }
      }
      // Handle function calls
      else if (command.includes('(') && command.includes(')')) {
        const funcMatch = command.match(/^(\w+)\s*\(([^)]*)\)$/);
        if (funcMatch) {
          const [, funcName, argsStr] = funcMatch;
          const args = argsStr ? argsStr.split(',').map(arg => evaluateExpression(arg.trim())) : [];
          
          if (funcName.toLowerCase() in builtInFunctions) {
            const func = (builtInFunctions as any)[funcName.toLowerCase()];
            result = func(...args);
            if (result !== undefined && result !== '') {
              addToHistory('', formatValue(result), 'output');
            }
          } else {
            throw new Error(`Function '${funcName}' is not defined`);
          }
        }
      }
      // Handle variable assignment or expression evaluation
      else {
        result = evaluateExpression(command);
        if (result !== undefined) {
          addToHistory('', formatValue(result), 'output');
        }
      }

      // Call external handler if provided
      if (onExecuteStatement) {
        try {
          const externalResult = await onExecuteStatement(command);
          if (externalResult !== undefined) {
            addToHistory('', formatValue(externalResult), 'output');
          }
        } catch (error) {
          // External handler error is non-fatal
          console.warn('External statement handler error:', error);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addToHistory('', errorMessage, 'error');
    } finally {
      setIsExecuting(false);
    }
  }, [addToHistory, evaluateExpression, builtInFunctions, onExecuteStatement]);

  // Handle input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;

    // Add to command history
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    executeCommand(input);
    setInput('');
  }, [input, isExecuting, executeCommand]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setInput('');
          } else {
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
          }
        }
        break;
        
      case 'Escape':
        setInput('');
        setHistoryIndex(-1);
        break;
    }
  }, [commandHistory, historyIndex]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([{
      command: '',
      result: 'VB6 Immediate Window - Ready',
      timestamp: new Date(),
      type: 'info'
    }]);
  }, []);

  // Copy history to clipboard
  const copyHistory = useCallback(() => {
    const text = history
      .filter(entry => entry.type !== 'info' || entry.result !== 'VB6 Immediate Window - Ready')
      .map(entry => {
        if (entry.type === 'input') {
          return `> ${entry.command}`;
        } else if (entry.type === 'error') {
          return `Error: ${entry.error || entry.result}`;
        } else {
          return entry.result || '';
        }
      })
      .join('\n');
    
    navigator.clipboard.writeText(text);
  }, [history]);

  if (!visible) return null;

  return (
    <div className="bg-white border border-gray-300 flex flex-col h-64">
      {/* Title Bar */}
      <div className="bg-gray-100 border-b px-3 py-1 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-blue-600" />
          <span className="font-medium text-sm">Immediate Window</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="p-1 hover:bg-gray-200 rounded"
            title="Clear Window"
          >
            <Trash2 size={14} />
          </button>
          
          <button
            onClick={copyHistory}
            className="p-1 hover:bg-gray-200 rounded"
            title="Copy History"
          >
            <Copy size={14} />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-auto p-2 font-mono text-sm bg-white"
      >
        {history.map((entry, index) => (
          <div 
            key={index}
            className={`mb-1 ${
              entry.type === 'input' ? 'text-blue-600' : 
              entry.type === 'error' ? 'text-red-600' : 
              entry.type === 'info' ? 'text-gray-500 italic' :
              'text-black'
            }`}
          >
            {entry.type === 'input' && (
              <div className="flex items-start gap-1">
                <ChevronRight size={14} className="mt-0.5 flex-shrink-0" />
                <span>{entry.command}</span>
              </div>
            )}
            
            {entry.type === 'output' && (
              <div className="ml-4">{entry.result}</div>
            )}
            
            {entry.type === 'error' && (
              <div className="flex items-start gap-1 ml-4">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{entry.error || entry.result}</span>
              </div>
            )}
            
            {entry.type === 'info' && (
              <div className="flex items-start gap-1">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>{entry.result}</span>
              </div>
            )}
          </div>
        ))}
        
        {isExecuting && (
          <div className="text-gray-500 italic flex items-center gap-2">
            <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
            Executing...
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t bg-gray-50">
        <div className="flex items-center p-2">
          <ChevronRight size={16} className="text-blue-600 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter VB6 expression or statement..."
            className="flex-1 bg-transparent outline-none font-mono text-sm"
            disabled={isExecuting}
          />
          
          {isExecuting ? (
            <Square size={16} className="text-red-600 ml-2 cursor-not-allowed" />
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="ml-2 p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Execute (Enter)"
            >
              <Play size={16} className="text-green-600" />
            </button>
          )}
        </div>
      </form>

      {/* Status Bar */}
      <div className="border-t bg-gray-100 px-3 py-1 text-xs text-gray-600 flex justify-between">
        <span>
          {variables.size} variables | {history.filter(h => h.type === 'input').length} commands
        </span>
        <span>
          Press ↑/↓ for history, Esc to clear, ? to evaluate
        </span>
      </div>
    </div>
  );
};

export default ImmediateWindow;