import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';

interface IntelliSenseItem {
  label: string;
  type: 'keyword' | 'function' | 'property' | 'method' | 'variable' | 'constant';
  description: string;
  snippet?: string;
}

const VB6_KEYWORDS = [
  'If', 'Then', 'Else', 'ElseIf', 'End', 'Sub', 'Function', 'Dim', 'As', 'For', 'To', 'Next',
  'While', 'Wend', 'Do', 'Loop', 'Select', 'Case', 'Exit', 'Private', 'Public', 'Static',
  'Const', 'Type', 'Enum', 'With', 'Set', 'New', 'Nothing', 'True', 'False', 'And', 'Or',
  'Not', 'Mod', 'Like', 'Is', 'ByVal', 'ByRef', 'Optional', 'ParamArray', 'Preserve',
  'ReDim', 'Erase', 'On', 'Error', 'Resume', 'GoTo', 'GoSub', 'Return', 'Call', 'Let'
];

const VB6_FUNCTIONS = [
  { name: 'MsgBox', description: 'Displays a message box', snippet: 'MsgBox "${1:message}"' },
  { name: 'InputBox', description: 'Displays an input dialog', snippet: 'InputBox("${1:prompt}")' },
  { name: 'Len', description: 'Returns the length of a string', snippet: 'Len(${1:string})' },
  { name: 'Left', description: 'Returns leftmost characters', snippet: 'Left(${1:string}, ${2:length})' },
  { name: 'Right', description: 'Returns rightmost characters', snippet: 'Right(${1:string}, ${2:length})' },
  { name: 'Mid', description: 'Returns middle characters', snippet: 'Mid(${1:string}, ${2:start}, ${3:length})' },
  { name: 'UCase', description: 'Converts to uppercase', snippet: 'UCase(${1:string})' },
  { name: 'LCase', description: 'Converts to lowercase', snippet: 'LCase(${1:string})' },
  { name: 'Trim', description: 'Removes leading/trailing spaces', snippet: 'Trim(${1:string})' },
  { name: 'Val', description: 'Converts string to number', snippet: 'Val(${1:string})' },
  { name: 'Str', description: 'Converts number to string', snippet: 'Str(${1:number})' },
  { name: 'Chr', description: 'Returns character for ASCII code', snippet: 'Chr(${1:code})' },
  { name: 'Asc', description: 'Returns ASCII code for character', snippet: 'Asc(${1:character})' },
  { name: 'Now', description: 'Returns current date and time', snippet: 'Now' },
  { name: 'Date', description: 'Returns current date', snippet: 'Date' },
  { name: 'Time', description: 'Returns current time', snippet: 'Time' },
  { name: 'Timer', description: 'Returns seconds since midnight', snippet: 'Timer' }
];

const AdvancedCodeEditor: React.FC = () => {
  const { state, dispatch } = useVB6();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [lineNumber, setLineNumber] = useState(1);
  const [columnNumber, setColumnNumber] = useState(1);
  const [intelliSenseVisible, setIntelliSenseVisible] = useState(false);
  const [intelliSenseItems, setIntelliSenseItems] = useState<IntelliSenseItem[]>([]);
  const [intelliSensePosition, setIntelliSensePosition] = useState({ x: 0, y: 0 });
  const [selectedIntelliSense, setSelectedIntelliSense] = useState(0);
  const [errorMarkers, setErrorMarkers] = useState<Array<{ line: number; message: string }>>([]);

  const getAvailableEvents = (controlType: string) => {
    const commonEvents = ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove', 'KeyDown', 'KeyUp', 'KeyPress'];
    const formEvents = ['Load', 'Unload', 'Activate', 'Deactivate', 'Initialize', 'Paint', 'QueryUnload', 'Resize'];
    
    const specificEvents: { [key: string]: string[] } = {
      'Form': [...formEvents, ...commonEvents],
      'CommandButton': [...commonEvents, 'GotFocus', 'LostFocus'],
      'TextBox': [...commonEvents, 'Change', 'GotFocus', 'LostFocus', 'Validate'],
      'Label': ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      'CheckBox': [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      'OptionButton': [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      'Timer': ['Timer']
    };
    
    return specificEvents[controlType] || commonEvents;
  };

  const saveEventCode = useCallback(() => {
    if (state.selectedControls.length !== 1 || !state.selectedEvent) return;
    
    const control = state.selectedControls[0];
    const eventKey = `${control.name}_${state.selectedEvent}`;
    
    dispatch({
      type: 'UPDATE_EVENT_CODE',
      payload: { eventKey, code }
    });
  }, [state.selectedControls, state.selectedEvent, dispatch, code]);

  const loadEventCode = useCallback(() => {
    if (state.selectedControls.length !== 1 || !state.selectedEvent) return;
    
    const control = state.selectedControls[0];
    const eventKey = `${control.name}_${state.selectedEvent}`;
    const eventCode = state.eventCode[eventKey] || '';
    setCode(eventCode);
  }, [state.selectedControls, state.selectedEvent, state.eventCode]);

  const highlightSyntax = useCallback((text: string) => {
    let highlighted = text;
    
    // Keywords
    VB6_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="text-blue-600 font-semibold">${keyword}</span>`);
    });
    
    // Comments
    highlighted = highlighted.replace(/'.*$/gm, '<span class="text-green-600 italic">$&</span>');
    
    // Strings
    highlighted = highlighted.replace(/"[^"]*"/g, '<span class="text-orange-600">$&</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="text-purple-600">$&</span>');
    
    return highlighted;
  }, []);

  const getIntelliSenseItems = useCallback((currentWord: string) => {
    const items: IntelliSenseItem[] = [];
    
    // Keywords
    VB6_KEYWORDS.filter(keyword => 
      keyword.toLowerCase().startsWith(currentWord.toLowerCase())
    ).forEach(keyword => {
      items.push({
        label: keyword,
        type: 'keyword',
        description: `VB6 keyword: ${keyword}`
      });
    });
    
    // Functions
    VB6_FUNCTIONS.filter(func => 
      func.name.toLowerCase().startsWith(currentWord.toLowerCase())
    ).forEach(func => {
      items.push({
        label: func.name,
        type: 'function',
        description: func.description,
        snippet: func.snippet
      });
    });
    
    // Control properties and methods
    if (state.selectedControls.length === 1) {
      const control = state.selectedControls[0];
      const controlProps = ['Name', 'Caption', 'Text', 'Value', 'Enabled', 'Visible', 'Left', 'Top', 'Width', 'Height'];
      controlProps.filter(prop => 
        prop.toLowerCase().startsWith(currentWord.toLowerCase())
      ).forEach(prop => {
        items.push({
          label: prop,
          type: 'property',
          description: `${control.type} property: ${prop}`
        });
      });
    }
    
    return items.slice(0, 10); // Limit to 10 items
  }, [state.selectedControls]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (intelliSenseVisible) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIntelliSense(prev => 
            prev < intelliSenseItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIntelliSense(prev => 
            prev > 0 ? prev - 1 : intelliSenseItems.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertIntelliSenseItem(intelliSenseItems[selectedIntelliSense]);
          break;
        case 'Escape':
          setIntelliSenseVisible(false);
          break;
      }
    } else {
      // Code editing shortcuts
      if (e.ctrlKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveEventCode();
            break;
          case ' ':
            e.preventDefault();
            showIntelliSense();
            break;
          case '/':
            e.preventDefault();
            toggleComment();
            break;
        }
      }
      
      // Auto-indent
      if (e.key === 'Enter') {
        handleAutoIndent(e);
      }
    }
  }, [intelliSenseVisible, intelliSenseItems, selectedIntelliSense, saveEventCode]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    const textarea = e.target;
    const position = textarea.selectionStart;
    setCursorPosition(position);
    
    // Calculate line and column
    const lines = newCode.substring(0, position).split('\n');
    setLineNumber(lines.length);
    setColumnNumber(lines[lines.length - 1].length + 1);
    
    // Check for IntelliSense trigger
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    if (currentWord.length > 0 && /^[a-zA-Z]/.test(currentWord)) {
      const items = getIntelliSenseItems(currentWord);
      if (items.length > 0) {
        setIntelliSenseItems(items);
        setSelectedIntelliSense(0);
        setIntelliSenseVisible(true);
        
        // Position IntelliSense popup
        const rect = textarea.getBoundingClientRect();
        setIntelliSensePosition({
          x: rect.left + (columnNumber - currentWord.length) * 8,
          y: rect.top + lineNumber * 20
        });
      } else {
        setIntelliSenseVisible(false);
      }
    } else {
      setIntelliSenseVisible(false);
    }
    
    // Syntax checking
    validateSyntax(newCode);
  }, [getIntelliSenseItems, lineNumber, columnNumber]);

  const showIntelliSense = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const position = textarea.selectionStart;
    const textBeforeCursor = code.substring(0, position);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    const items = getIntelliSenseItems(currentWord);
    setIntelliSenseItems(items);
    setSelectedIntelliSense(0);
    setIntelliSenseVisible(true);
    
    const rect = textarea.getBoundingClientRect();
    setIntelliSensePosition({
      x: rect.left + (columnNumber - currentWord.length) * 8,
      y: rect.top + lineNumber * 20
    });
  }, [code, getIntelliSenseItems, lineNumber, columnNumber]);

  const insertIntelliSenseItem = useCallback((item: IntelliSenseItem) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const position = textarea.selectionStart;
    const textBeforeCursor = code.substring(0, position);
    const textAfterCursor = code.substring(position);
    
    // Find the word being completed
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    // Replace the partial word with the selected item
    const beforeWord = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length);
    const insertion = item.snippet || item.label;
    const newCode = beforeWord + insertion + textAfterCursor;
    
    setCode(newCode);
    setIntelliSenseVisible(false);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newPosition = beforeWord.length + insertion.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [code]);

  const toggleComment = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const lines = code.split('\n');
    const startLine = code.substring(0, start).split('\n').length - 1;
    const endLine = code.substring(0, end).split('\n').length - 1;
    
    const modifiedLines = lines.map((line, index) => {
      if (index >= startLine && index <= endLine) {
        if (line.trim().startsWith("'")) {
          return line.replace(/^\s*'/, '');
        } else {
          return "'" + line;
        }
      }
      return line;
    });
    
    setCode(modifiedLines.join('\n'));
  }, [code]);

  const handleAutoIndent = useCallback((e: React.KeyboardEvent) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const position = textarea.selectionStart;
    const textBeforeCursor = code.substring(0, position);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Get indentation of current line
    const indentMatch = currentLine.match(/^(\s*)/);
    let indent = indentMatch ? indentMatch[1] : '';
    
    // Increase indent for certain keywords
    const trimmedLine = currentLine.trim().toLowerCase();
    if (trimmedLine.endsWith(' then') || 
        trimmedLine.startsWith('if ') ||
        trimmedLine.startsWith('for ') ||
        trimmedLine.startsWith('while ') ||
        trimmedLine.startsWith('do ') ||
        trimmedLine.startsWith('sub ') ||
        trimmedLine.startsWith('function ') ||
        trimmedLine.startsWith('private sub ') ||
        trimmedLine.startsWith('public sub ') ||
        trimmedLine.startsWith('private function ') ||
        trimmedLine.startsWith('public function ')) {
      indent += '    '; // Add 4 spaces
    }
    
    // Insert newline with proper indentation
    e.preventDefault();
    const newCode = code.substring(0, position) + '\n' + indent + code.substring(position);
    setCode(newCode);
    
    setTimeout(() => {
      const newPosition = position + 1 + indent.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [code]);

  const validateSyntax = useCallback((codeToValidate: string) => {
    const errors: Array<{ line: number; message: string }> = [];
    const lines = codeToValidate.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("'")) {
        // Check for common syntax errors
        
        // If without Then
        if (/\bif\b/i.test(trimmed) && !/\bthen\b/i.test(trimmed) && !trimmed.endsWith(' _')) {
          errors.push({
            line: index + 1,
            message: 'Expected "Then" after "If"'
          });
        }
        
        // For without To
        if (/\bfor\b/i.test(trimmed) && !/\bto\b/i.test(trimmed) && !/\beach\b/i.test(trimmed)) {
          errors.push({
            line: index + 1,
            message: 'Expected "To" in For statement'
          });
        }
        
        // Unmatched parentheses
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push({
            line: index + 1,
            message: 'Mismatched parentheses'
          });
        }
      }
    });
    
    setErrorMarkers(errors);
  }, []);

  useEffect(() => {
    loadEventCode();
  }, [state.selectedEvent, state.selectedControls, loadEventCode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (intelliSenseVisible && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setIntelliSenseVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [intelliSenseVisible]);

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col font-mono text-sm">
      {/* Header */}
      <div className="bg-gray-200 px-2 py-1 border-b border-gray-400 flex items-center gap-2 text-xs">
        <select
          className="border border-gray-300 px-2 py-1"
          value={state.selectedControls.length === 1 ? state.selectedControls[0].name : '(General)'}
          onChange={(e) => {
            if (e.target.value === '(General)') {
              dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [] } });
            } else {
              const control = state.controls.find(c => c.name === e.target.value);
              if (control) {
                dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [control.id] } });
              }
            }
          }}
        >
          <option value="(General)">(General)</option>
          <option value="Form">Form</option>
          {state.controls.map(control => (
            <option key={control.id} value={control.name}>{control.name}</option>
          ))}
        </select>
        
        <select
          className="border border-gray-300 px-2 py-1"
          value={state.selectedEvent}
          onChange={(e) => dispatch({ type: 'SET_SELECTED_EVENT', payload: { eventName: e.target.value } })}
          disabled={state.selectedControls.length !== 1}
        >
          {state.selectedControls.length === 1 ? 
            getAvailableEvents(state.selectedControls[0].type).map(event => (
              <option key={event} value={event}>{event}</option>
            )) : (
              <option value="">(Declarations)</option>
            )
          }
        </select>
        
        <div className="ml-auto flex items-center gap-4 text-gray-600">
          <span>Ln {lineNumber}, Col {columnNumber}</span>
          {errorMarkers.length > 0 && (
            <span className="text-red-600">{errorMarkers.length} error(s)</span>
          )}
        </div>
      </div>
      
      {/* Code Editor */}
      <div className="flex-1 relative">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 border-r border-gray-300 select-none">
          {code.split('\n').map((_, index) => (
            <div 
              key={index} 
              className="h-5 px-2 text-xs text-gray-600 text-right leading-5"
              style={{ 
                backgroundColor: errorMarkers.some(e => e.line === index + 1) ? '#ffebee' : 'transparent',
                color: errorMarkers.some(e => e.line === index + 1) ? '#d32f2f' : '#666'
              }}
            >
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code area */}
        <div className="ml-12 h-full relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-2 font-mono text-sm bg-white resize-none outline-none leading-5"
            style={{ 
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              lineHeight: '20px',
              tabSize: 4
            }}
            placeholder={
              state.selectedControls.length === 1
                ? `' Write your VB6 code here for ${state.selectedControls[0].name}_${state.selectedEvent}\n' Press Ctrl+Space for IntelliSense`
                : '` General declarations\n` Add global variables and constants here'
            }
            spellCheck={false}
          />
        </div>
      </div>
      
      {/* IntelliSense popup */}
      {intelliSenseVisible && (
        <div
          className="fixed bg-white border border-gray-400 shadow-lg z-50 max-h-48 overflow-y-auto"
          style={{
            left: intelliSensePosition.x,
            top: intelliSensePosition.y,
            minWidth: '200px'
          }}
        >
          {intelliSenseItems.map((item, index) => (
            <div
              key={index}
              className={`px-3 py-1 text-xs cursor-pointer flex items-center gap-2 ${
                index === selectedIntelliSense ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
              onClick={() => insertIntelliSenseItem(item)}
            >
              <span className={`w-4 h-4 text-xs flex items-center justify-center rounded ${
                item.type === 'keyword' ? 'bg-blue-200 text-blue-800' :
                item.type === 'function' ? 'bg-green-200 text-green-800' :
                item.type === 'property' ? 'bg-orange-200 text-orange-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {item.type === 'keyword' ? 'K' :
                 item.type === 'function' ? 'F' :
                 item.type === 'property' ? 'P' : 'V'}
              </span>
              <div className="flex-1">
                <div className="font-semibold">{item.label}</div>
                <div className="text-gray-500 text-xs truncate">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Error indicators */}
      {errorMarkers.length > 0 && (
        <div className="absolute bottom-0 right-0 mb-2 mr-2">
          <div className="bg-red-100 border border-red-400 rounded p-2 max-w-sm">
            <div className="text-xs font-semibold text-red-800 mb-1">Syntax Errors:</div>
            {errorMarkers.slice(0, 3).map((error, index) => (
              <div key={index} className="text-xs text-red-700">
                Line {error.line}: {error.message}
              </div>
            ))}
            {errorMarkers.length > 3 && (
              <div className="text-xs text-red-600">
                +{errorMarkers.length - 3} more errors...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCodeEditor;