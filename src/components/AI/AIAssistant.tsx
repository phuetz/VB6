/**
 * AI Assistant for VB6 Studio
 * Intelligent code generation, error fixing, and optimization suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVB6Store } from '../../stores/vb6Store';
import { analyzeVB6Code } from '../../utils/codeAnalyzer';
import { eventSystem } from '../../services/VB6EventSystem';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeSnippet?: string;
  suggestions?: AISuggestion[];
}

interface AISuggestion {
  type: 'fix' | 'optimization' | 'refactor' | 'completion';
  title: string;
  description: string;
  code: string;
  confidence: number;
}

interface AIContext {
  currentFile: string;
  currentFunction?: string;
  selectedText?: string;
  errors: any[];
  controls: any[];
  formProperties: any;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [context, setContext] = useState<AIContext | null>(null);
  const [activeMode, setActiveMode] = useState<'chat' | 'inline' | 'auto'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { currentCode, selectedControl, formProperties, controls } = useVB6Store();

  // AI capabilities
  const capabilities = [
    { id: 'generate', label: 'Generate Code', icon: '✨' },
    { id: 'fix', label: 'Fix Errors', icon: '🔧' },
    { id: 'optimize', label: 'Optimize', icon: '⚡' },
    { id: 'explain', label: 'Explain', icon: '💡' },
    { id: 'convert', label: 'Convert', icon: '🔄' },
    { id: 'test', label: 'Generate Tests', icon: '🧪' },
  ];

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: 'Hello! I\'m your VB6 AI Assistant. I can help you generate code, fix errors, optimize performance, and more. How can I assist you today?',
      });
    }
  }, [messages.length]);

  // Update context when code changes
  useEffect(() => {
    if (!currentCode) {
      setContext({
        currentFile: 'Form1.frm',
        errors: [],
        controls,
        formProperties,
      });
      return;
    }
    
    const codeAnalysis = analyzeVB6Code(currentCode);
    setContext({
      currentFile: 'Form1.frm',
      errors: codeAnalysis.issues.filter(i => i.severity === 'error'),
      controls,
      formProperties,
    });
  }, [currentCode, controls, formProperties]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setIsThinking(true);

    try {
      const response = await processAIRequest(userMessage, context);
      addMessage(response);
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
      });
    } finally {
      setIsThinking(false);
    }
  };

  const processAIRequest = async (request: string, context: AIContext | null): Promise<Omit<AIMessage, 'id' | 'timestamp'>> => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Pattern matching for different request types
    const lowerRequest = request.toLowerCase();

    if (lowerRequest.includes('create') || lowerRequest.includes('generate')) {
      return generateCode(request, context);
    } else if (lowerRequest.includes('fix') || lowerRequest.includes('error')) {
      return fixErrors(request, context);
    } else if (lowerRequest.includes('optimize')) {
      return optimizeCode(request, context);
    } else if (lowerRequest.includes('explain')) {
      return explainCode(request, context);
    } else if (lowerRequest.includes('convert')) {
      return convertCode(request, context);
    } else {
      return generalResponse(request, context);
    }
  };

  const generateCode = (request: string, context: AIContext | null): Omit<AIMessage, 'id' | 'timestamp'> => {
    const suggestions: AISuggestion[] = [];

    // Generate based on request patterns
    if (request.includes('button')) {
      suggestions.push({
        type: 'completion',
        title: 'Create Command Button with Click Handler',
        description: 'Add a command button with a click event handler',
        code: `Private Sub Command1_Click()
    ' Handle button click
    MsgBox "Button clicked!", vbInformation, "Click Event"
End Sub`,
        confidence: 0.95,
      });
    }

    if (request.includes('database') || request.includes('ado')) {
      suggestions.push({
        type: 'completion',
        title: 'ADO Database Connection',
        description: 'Create ADO connection and recordset',
        code: `Dim conn As ADODB.Connection
Dim rs As ADODB.Recordset

Set conn = New ADODB.Connection
Set rs = New ADODB.Recordset

' Connection string
conn.ConnectionString = "Provider=SQLOLEDB;Data Source=localhost;Initial Catalog=MyDB;Integrated Security=SSPI;"
conn.Open

' Query data
rs.Open "SELECT * FROM Users", conn, adOpenStatic, adLockReadOnly

' Process results
Do While Not rs.EOF
    Debug.Print rs("UserName")
    rs.MoveNext
Loop

' Cleanup
rs.Close
conn.Close
Set rs = Nothing
Set conn = Nothing`,
        confidence: 0.92,
      });
    }

    if (request.includes('form') || request.includes('dialog')) {
      suggestions.push({
        type: 'completion',
        title: 'Create Modal Dialog Form',
        description: 'Generate a modal dialog with OK/Cancel buttons',
        code: `' In Form_Load
Private Sub Form_Load()
    ' Center the form
    Me.Move (Screen.Width - Me.Width) / 2, (Screen.Height - Me.Height) / 2
    
    ' Set form properties
    Me.BorderStyle = 3 ' Fixed Dialog
    Me.MaxButton = False
    Me.MinButton = False
End Sub

Private Sub cmdOK_Click()
    ' Validate input
    If ValidateInput() Then
        Me.Tag = "OK"
        Me.Hide
    End If
End Sub

Private Sub cmdCancel_Click()
    Me.Tag = "Cancel"
    Me.Hide
End Sub

Private Function ValidateInput() As Boolean
    ' Add validation logic here
    ValidateInput = True
End Function`,
        confidence: 0.88,
      });
    }

    return {
      role: 'assistant',
      content: `I've generated code suggestions based on your request. Here are the options:`,
      suggestions,
    };
  };

  const fixErrors = (request: string, context: AIContext | null): Omit<AIMessage, 'id' | 'timestamp'> => {
    const suggestions: AISuggestion[] = [];

    if (context?.errors && context.errors.length > 0) {
      context.errors.forEach(error => {
        if (error.type === 'undeclaredVariable') {
          suggestions.push({
            type: 'fix',
            title: `Declare variable '${error.variable}'`,
            description: 'Add variable declaration',
            code: `Dim ${error.variable} As ${guessVariableType(error.variable)}`,
            confidence: 0.85,
          });
        } else if (error.type === 'syntaxError') {
          suggestions.push({
            type: 'fix',
            title: 'Fix syntax error',
            description: error.message,
            code: error.suggestion || '',
            confidence: 0.75,
          });
        }
      });
    }

    return {
      role: 'assistant',
      content: context?.errors?.length 
        ? `I found ${context.errors.length} error(s) in your code. Here are my suggested fixes:`
        : 'No errors detected in the current code.',
      suggestions,
    };
  };

  const optimizeCode = (request: string, context: AIContext | null): Omit<AIMessage, 'id' | 'timestamp'> => {
    const suggestions: AISuggestion[] = [
      {
        type: 'optimization',
        title: 'Use StringBuilder for string concatenation',
        description: 'Replace multiple string concatenations with StringBuilder for better performance',
        code: `' Instead of:
Dim result As String
For i = 1 To 1000
    result = result & "Item " & i & vbCrLf
Next

' Use:
Dim sb As StringBuilder
Set sb = New StringBuilder
For i = 1 To 1000
    sb.Append "Item "
    sb.Append i
    sb.AppendLine
Next
result = sb.ToString()`,
        confidence: 0.90,
      },
      {
        type: 'optimization',
        title: 'Cache object references',
        description: 'Store frequently accessed objects in variables',
        code: `' Instead of:
For i = 1 To ListView1.ListItems.Count
    ListView1.ListItems(i).Selected = True
Next

' Use:
Dim items As ListItems
Set items = ListView1.ListItems
For i = 1 To items.Count
    items(i).Selected = True
Next`,
        confidence: 0.88,
      },
    ];

    return {
      role: 'assistant',
      content: 'Here are some optimization suggestions for your code:',
      suggestions,
    };
  };

  const explainCode = (request: string, context: AIContext | null): Omit<AIMessage, 'id' | 'timestamp'> => {
    return {
      role: 'assistant',
      content: `This code performs the following operations:

1. **Initialization**: Sets up necessary variables and objects
2. **Processing**: Executes the main logic
3. **Cleanup**: Releases resources and resets state

Key concepts used:
- Object-oriented programming with classes
- Event-driven architecture
- Error handling with On Error statements
- Resource management with Set...Nothing pattern`,
    };
  };

  const convertCode = (request: string, context: AIContext | null): Omit<AIMessage, 'id' | 'timestamp'> => {
    const suggestions: AISuggestion[] = [
      {
        type: 'refactor',
        title: 'Convert to C#',
        description: 'Translate VB6 code to modern C#',
        code: `// C# equivalent
using System;
using System.Windows.Forms;

public partial class Form1 : Form
{
    private void button1_Click(object sender, EventArgs e)
    {
        MessageBox.Show("Button clicked!", "Click Event", 
            MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
}`,
        confidence: 0.93,
      },
      {
        type: 'refactor',
        title: 'Convert to TypeScript',
        description: 'Translate VB6 code to TypeScript',
        code: `// TypeScript equivalent
class Form1 {
    private button1_Click(): void {
        alert('Button clicked!');
    }
}`,
        confidence: 0.91,
      },
    ];

    return {
      role: 'assistant',
      content: 'I can convert your VB6 code to the following modern languages:',
      suggestions,
    };
  };

  const generalResponse = (request: string, context: AIContext | null): Omit<AIMessage, 'id' | 'timestamp'> => {
    return {
      role: 'assistant',
      content: `I understand you're asking about "${request}". I can help with:

• **Code Generation**: Create VB6 code for forms, controls, and business logic
• **Error Fixing**: Identify and fix syntax errors, runtime errors, and logic issues
• **Optimization**: Improve performance and code quality
• **Explanation**: Explain how code works and VB6 concepts
• **Conversion**: Convert VB6 to modern languages like C#, VB.NET, or TypeScript

Please be more specific about what you'd like me to help with.`,
    };
  };

  const guessVariableType = (varName: string): string => {
    const name = varName.toLowerCase();
    if (name.startsWith('str') || name.includes('name') || name.includes('text')) return 'String';
    if (name.startsWith('int') || name.startsWith('i') || name.includes('count')) return 'Integer';
    if (name.startsWith('lng') || name.startsWith('l')) return 'Long';
    if (name.startsWith('dbl') || name.includes('amount') || name.includes('price')) return 'Double';
    if (name.startsWith('bool') || name.startsWith('b') || name.startsWith('is')) return 'Boolean';
    if (name.startsWith('dt') || name.includes('date')) return 'Date';
    if (name.startsWith('obj') || name.startsWith('o')) return 'Object';
    return 'Variant';
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    // Insert code into editor
    eventSystem.fire('AIAssistant', 'ApplySuggestion', {
      code: suggestion.code,
      type: suggestion.type,
    });

    // Update the store with new code
    const { updateCode } = useVB6Store.getState();
    updateCode(currentCode + '\n\n' + suggestion.code);

    addMessage({
      role: 'system',
      content: `Applied: ${suggestion.title}`,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-2xl">🤖</span>
      </motion.button>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">VB6 AI Assistant</h3>
                  <p className="text-sm opacity-90">Your intelligent coding companion</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Mode selector */}
              <div className="flex gap-2 mt-3">
                {(['chat', 'inline', 'auto'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      activeMode === mode
                        ? 'bg-white text-purple-600'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-3 border-b dark:border-gray-800">
              <div className="grid grid-cols-3 gap-2">
                {capabilities.slice(0, 6).map(cap => (
                  <button
                    key={cap.id}
                    onClick={() => setInput(`Please ${cap.label.toLowerCase()} `)}
                    className="p-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>{cap.icon}</span>
                    <span className="truncate">{cap.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : message.role === 'assistant'
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Code snippet */}
                    {message.codeSnippet && (
                      <pre className="mt-2 p-2 bg-black/10 dark:bg-black/30 rounded-lg overflow-x-auto">
                        <code className="text-xs">{message.codeSnippet}</code>
                      </pre>
                    )}
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-900 rounded-lg p-3 border dark:border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {suggestion.description}
                                </p>
                              </div>
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                            
                            {suggestion.code && (
                              <div className="relative">
                                <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  <code>{suggestion.code}</code>
                                </pre>
                                <button
                                  onClick={() => applySuggestion(suggestion)}
                                  className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t dark:border-gray-800">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about VB6..."
                  className="flex-1 p-2 border dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-800"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className="px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;