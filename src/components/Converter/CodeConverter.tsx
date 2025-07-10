import React, { useState } from 'react';
import { ArrowLeftRight, FileCode, Download, CopyCheck, Copy, Code, Info, Check } from 'lucide-react';

interface LanguageOption {
  id: string;
  name: string;
  description: string;
}

interface ConversionOption {
  id: string;
  label: string;
  description: string;
  type: 'checkbox' | 'select' | 'number';
  defaultValue: any;
  options?: string[];
}

interface CodeConverterProps {
  visible: boolean;
  onClose: () => void;
  onConvertCode: (code: string, targetLanguage: string, options: Record<string, any>) => void;
}

export const CodeConverter: React.FC<CodeConverterProps> = ({
  visible,
  onClose,
  onConvertCode
}) => {
  const [sourceCode, setSourceCode] = useState('');
  const [convertedCode, setConvertedCode] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('vbnet');
  const [convertOptions, setConvertOptions] = useState<Record<string, any>>({
    includeComments: true,
    modernizeApi: true,
    strictTypeChecking: true,
    removeGoto: true,
    convertForms: true,
    keepOriginalNames: true,
    targetFramework: 'net6',
    convertionLevel: 'full'
  });
  const [conversionResult, setConversionResult] = useState<{
    success: boolean;
    issues: Array<{ line: number; message: string; severity: 'warning' | 'error' | 'info' }>;
  } | null>(null);

  const targetLanguages: LanguageOption[] = [
    {
      id: 'vbnet',
      name: 'VB.NET',
      description: 'Modern Visual Basic for .NET platform'
    },
    {
      id: 'csharp',
      name: 'C#',
      description: 'C# language for .NET platform'
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      description: 'JavaScript with type checking'
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      description: 'Modern JavaScript (ES6+)'
    },
    {
      id: 'python',
      name: 'Python',
      description: 'Python 3 implementation'
    }
  ];

  const conversionOptions: Record<string, ConversionOption[]> = {
    vbnet: [
      {
        id: 'includeComments',
        label: 'Include Comments',
        description: 'Add conversion comments to explain code changes',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'modernizeApi',
        label: 'Modernize API Calls',
        description: 'Replace legacy API calls with .NET equivalents',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'strictTypeChecking',
        label: 'Strict Type Checking',
        description: 'Enforce strict type checking',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'removeGoto',
        label: 'Remove GoTo Statements',
        description: 'Convert GoTo statements to structured code',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'convertForms',
        label: 'Convert Forms',
        description: 'Convert VB6 forms to Windows Forms',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'targetFramework',
        label: 'Target Framework',
        description: 'Target .NET framework version',
        type: 'select',
        defaultValue: 'net6',
        options: ['net472', 'net5', 'net6', 'netstandard2.0']
      }
    ],
    csharp: [
      {
        id: 'includeComments',
        label: 'Include Comments',
        description: 'Add conversion comments to explain code changes',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'modernizeApi',
        label: 'Modernize API Calls',
        description: 'Replace legacy API calls with .NET equivalents',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'useCSharpNaming',
        label: 'Use C# Naming Conventions',
        description: 'Convert naming to C# conventions (camelCase, PascalCase)',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'generateAsyncMethods',
        label: 'Generate Async Methods',
        description: 'Convert to async/await pattern where appropriate',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'targetFramework',
        label: 'Target Framework',
        description: 'Target .NET framework version',
        type: 'select',
        defaultValue: 'net6',
        options: ['net472', 'net5', 'net6', 'netstandard2.0']
      }
    ],
    typescript: [
      {
        id: 'strictTypeChecking',
        label: 'Strict Type Checking',
        description: 'Enforce TypeScript strict mode',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'generateInterfaces',
        label: 'Generate Interfaces',
        description: 'Create TypeScript interfaces for VB6 types',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'useModernJavaScript',
        label: 'Use Modern JavaScript',
        description: 'Use modern JS features (arrow functions, destructuring, etc.)',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'convertUiToReact',
        label: 'Convert UI to React',
        description: 'Convert forms to React components',
        type: 'checkbox',
        defaultValue: true
      }
    ],
    javascript: [
      {
        id: 'useModernJavaScript',
        label: 'Use Modern JavaScript',
        description: 'Use modern JS features (arrow functions, destructuring, etc.)',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'generateJsDoc',
        label: 'Generate JSDoc Comments',
        description: 'Add JSDoc comments for types and functions',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'convertUiToHtml',
        label: 'Convert UI to HTML/CSS',
        description: 'Convert forms to HTML/CSS',
        type: 'checkbox',
        defaultValue: true
      }
    ],
    python: [
      {
        id: 'includeTypeHints',
        label: 'Include Type Hints',
        description: 'Add Python type hints (PEP 484)',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'convertUiToTkinter',
        label: 'Convert UI to Tkinter',
        description: 'Convert forms to Tkinter UI',
        type: 'checkbox',
        defaultValue: true
      },
      {
        id: 'pythonVersion',
        label: 'Python Version',
        description: 'Target Python version',
        type: 'select',
        defaultValue: '3.10',
        options: ['3.7', '3.8', '3.9', '3.10', '3.11']
      }
    ]
  };

  const handleOptionChange = (id: string, value: any) => {
    setConvertOptions({
      ...convertOptions,
      [id]: value
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(convertedCode)
      .then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 1500);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const handleConvert = () => {
    setIsConverting(true);
    
    // This would be replaced with actual conversion logic
    setTimeout(() => {
      let result = '';
      const issues = [];
      
      // Very simple VB6 to target language demonstration converter
      // In reality, this would use a more sophisticated parser and conversion engine
      switch (targetLanguage) {
        case 'vbnet':
          result = convertToVBNET(sourceCode);
          issues.push({ line: 3, message: 'Variant type converted to Object', severity: 'info' as const });
          break;
        case 'csharp':
          result = convertToCSharp(sourceCode);
          issues.push({ line: 2, message: 'VB event handling converted to C# event pattern', severity: 'warning' as const });
          break;
        case 'typescript':
          result = convertToTypeScript(sourceCode);
          issues.push({ line: 5, message: 'API call not fully supported in web context', severity: 'error' as const });
          break;
        case 'javascript':
          result = convertToJavaScript(sourceCode);
          break;
        case 'python':
          result = convertToPython(sourceCode);
          break;
      }
      
      setConvertedCode(result);
      setConversionResult({
        success: true,
        issues
      });
      setIsConverting(false);
    }, 1000);
  };

  // Simple mock converters
  const convertToVBNET = (code: string): string => {
    let result = code;
    // Replace common VB6 constructs with VB.NET
    result = result.replace(/Sub\s+/g, 'Public Sub ');
    result = result.replace(/Function\s+/g, 'Public Function ');
    result = result.replace(/\bDim\b/g, 'Dim');
    result = result.replace(/Set\s+(\w+)\s*=\s*/g, '$1 = ');
    result = result.replace(/\.Show\b/g, '.Show()');
    
    // Add VB.NET imports
    result = 'Imports System\nImports System.Windows.Forms\n\n' + result;
    
    // Modernize type names
    result = result.replace(/\bInteger\b/g, 'Integer');
    result = result.replace(/\bLong\b/g, 'Long');
    result = result.replace(/\bSingle\b/g, 'Single');
    result = result.replace(/\bDouble\b/g, 'Double');
    result = result.replace(/\bVariant\b/g, 'Object');
    
    return result;
  };
  
  const convertToCSharp = (code: string): string => {
    let result = code;
    
    // Convert VB6 Sub/Function to C# method
    result = result.replace(/Sub\s+(\w+)\s*\((.*)\)/g, 'public void $1($2)');
    result = result.replace(/Function\s+(\w+)\s*\((.*)\)\s+As\s+(\w+)/g, 'public $3 $1($2)');
    
    // Convert variable declarations
    result = result.replace(/Dim\s+(\w+)\s+As\s+(\w+)/g, '$2 $1;');
    
    // Convert If statements
    result = result.replace(/If\s+(.*)\s+Then/g, 'if ($1) {');
    result = result.replace(/End\s+If/g, '}');
    result = result.replace(/ElseIf\s+(.*)\s+Then/g, '} else if ($1) {');
    result = result.replace(/Else/g, '} else {');
    
    // Convert loops
    result = result.replace(/For\s+(\w+)\s*=\s*(\w+)\s+To\s+(\w+)/g, 'for (int $1 = $2; $1 <= $3; $1++)');
    result = result.replace(/Next\s+\w+/g, '}');
    result = result.replace(/Next/g, '}');
    
    // Add C# using statements
    result = 'using System;\nusing System.Windows.Forms;\n\n' + result;
    
    return result;
  };
  
  const convertToTypeScript = (code: string): string => {
    let result = code;
    
    // Convert VB6 Sub/Function to TypeScript
    result = result.replace(/Sub\s+(\w+)\s*\((.*)\)/g, 'function $1($2): void');
    result = result.replace(/Function\s+(\w+)\s*\((.*)\)\s+As\s+(\w+)/g, 'function $1($2): $3');
    
    // Convert variable declarations
    result = result.replace(/Dim\s+(\w+)\s+As\s+(\w+)/g, 'let $1: $2;');
    
    // Convert If statements
    result = result.replace(/If\s+(.*)\s+Then/g, 'if ($1) {');
    result = result.replace(/End\s+If/g, '}');
    result = result.replace(/ElseIf\s+(.*)\s+Then/g, '} else if ($1) {');
    result = result.replace(/Else/g, '} else {');
    
    // Convert loops
    result = result.replace(/For\s+(\w+)\s*=\s*(\w+)\s+To\s+(\w+)/g, 'for (let $1 = $2; $1 <= $3; $1++)');
    result = result.replace(/Next\s+\w+/g, '}');
    result = result.replace(/Next/g, '}');
    
    // Add TypeScript type mappings
    result = result.replace(/\bInteger\b/g, 'number');
    result = result.replace(/\bLong\b/g, 'number');
    result = result.replace(/\bSingle\b/g, 'number');
    result = result.replace(/\bDouble\b/g, 'number');
    result = result.replace(/\bString\b/g, 'string');
    result = result.replace(/\bBoolean\b/g, 'boolean');
    result = result.replace(/\bVariant\b/g, 'any');
    result = result.replace(/\bObject\b/g, 'object');
    
    return result;
  };
  
  const convertToJavaScript = (code: string): string => {
    let result = code;
    
    // Convert VB6 Sub/Function to JavaScript
    result = result.replace(/Sub\s+(\w+)\s*\((.*)\)/g, 'function $1($2)');
    result = result.replace(/Function\s+(\w+)\s*\((.*)\)\s+As\s+\w+/g, 'function $1($2)');
    
    // Convert variable declarations (no types in JS)
    result = result.replace(/Dim\s+(\w+)\s+As\s+\w+/g, 'let $1;');
    
    // Convert If statements
    result = result.replace(/If\s+(.*)\s+Then/g, 'if ($1) {');
    result = result.replace(/End\s+If/g, '}');
    result = result.replace(/ElseIf\s+(.*)\s+Then/g, '} else if ($1) {');
    result = result.replace(/Else/g, '} else {');
    
    // Convert loops
    result = result.replace(/For\s+(\w+)\s*=\s*(\w+)\s+To\s+(\w+)/g, 'for (let $1 = $2; $1 <= $3; $1++)');
    result = result.replace(/Next\s+\w+/g, '}');
    result = result.replace(/Next/g, '}');
    
    // Remove type conversions
    result = result.replace(/CInt\s*\((.*?)\)/g, 'parseInt($1)');
    result = result.replace(/CStr\s*\((.*?)\)/g, 'String($1)');
    result = result.replace(/CBool\s*\((.*?)\)/g, 'Boolean($1)');
    
    return result;
  };
  
  const convertToPython = (code: string): string => {
    let result = code;
    let indentLevel = 0;
    
    // Convert VB6 Sub/Function to Python
    result = result.replace(/Sub\s+(\w+)\s*\((.*)\)/g, 'def $1($2):');
    result = result.replace(/Function\s+(\w+)\s*\((.*)\)\s+As\s+\w+/g, 'def $1($2):');
    
    // Remove variable type declarations
    result = result.replace(/Dim\s+(\w+)\s+As\s+\w+/g, '$1 = None');
    
    // Convert If statements
    result = result.replace(/If\s+(.*)\s+Then/g, 'if $1:');
    result = result.replace(/End\s+If/g, '');
    result = result.replace(/ElseIf\s+(.*)\s+Then/g, 'elif $1:');
    result = result.replace(/Else/g, 'else:');
    
    // Convert loops
    result = result.replace(/For\s+(\w+)\s*=\s*(\w+)\s+To\s+(\w+)/g, 'for $1 in range($2, $3 + 1):');
    result = result.replace(/Next\s+\w+/g, '');
    result = result.replace(/Next/g, '');
    
    // Convert message boxes
    result = result.replace(/MsgBox\s+"(.*?)"/g, 'print("$1")');
    
    // Add Python imports
    result = 'import tkinter as tk\nfrom tkinter import messagebox\n\n' + result;
    
    return result;
  };

  const handleApply = () => {
    onConvertCode(convertedCode, targetLanguage, convertOptions);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '900px', height: '650px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} />
            <span>Code Converter</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Header with language selection */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Source Language</label>
                <div className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm">
                  Visual Basic 6.0
                </div>
              </div>
              
              <ArrowLeftRight size={20} className="text-gray-500" />
              
              <div>
                <label className="block text-xs font-semibold mb-1">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm min-w-40"
                >
                  {targetLanguages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={handleConvert}
              disabled={isConverting || !sourceCode.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isConverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </>
              ) : (
                <>
                  <ArrowLeftRight size={16} />
                  Convert Code
                </>
              )}
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex gap-4">
            {/* Editor panes */}
            <div className="w-2/3 flex flex-col">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="flex flex-col">
                  <div className="text-sm font-semibold mb-1">VB6 Source Code</div>
                  <textarea
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    className="flex-1 p-3 font-mono text-sm border border-gray-300 rounded resize-none"
                    placeholder="Paste your VB6 code here..."
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold mb-1">Converted Code ({targetLanguages.find(l => l.id === targetLanguage)?.name})</div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        disabled={!convertedCode}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Copy to clipboard"
                      >
                        {showCopied ? <CopyCheck size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={handleApply}
                        disabled={!convertedCode}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Apply converted code"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <textarea
                      value={convertedCode}
                      readOnly
                      className="w-full h-full p-3 font-mono text-sm border border-gray-300 rounded resize-none"
                      placeholder="Converted code will appear here..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Conversion results */}
              {conversionResult && (
                <div className="mt-3 p-3 bg-white border border-gray-300 rounded">
                  <div className="text-sm font-semibold mb-2">Conversion Results</div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-full ${conversionResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {conversionResult.success ? <Check size={14} /> : <Info size={14} />}
                      </span>
                      <span className="text-sm">
                        {conversionResult.success ? 'Conversion completed successfully' : 'Conversion completed with issues'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {conversionResult.issues.length} issue{conversionResult.issues.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                  
                  {conversionResult.issues.length > 0 && (
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Line</th>
                            <th className="text-left p-2">Message</th>
                            <th className="text-left p-2">Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversionResult.issues.map((issue, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="p-2">{issue.line}</td>
                              <td className="p-2">{issue.message}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  issue.severity === 'error' ? 'bg-red-100 text-red-600' :
                                  issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {issue.severity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Options panel */}
            <div className="w-1/3 flex flex-col">
              <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Code size={14} />
                <span>Conversion Options</span>
              </div>
              <div className="bg-white border border-gray-300 rounded p-3 flex-1 overflow-y-auto">
                {conversionOptions[targetLanguage]?.map(option => (
                  <div key={option.id} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium">{option.label}</label>
                      {option.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={convertOptions[option.id] ?? option.defaultValue}
                          onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                        />
                      ) : option.type === 'select' ? (
                        <select
                          value={convertOptions[option.id] ?? option.defaultValue}
                          onChange={(e) => handleOptionChange(option.id, e.target.value)}
                          className="text-xs p-1 border border-gray-300 rounded"
                        >
                          {option.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={convertOptions[option.id] ?? option.defaultValue}
                          onChange={(e) => handleOptionChange(option.id, parseInt(e.target.value))}
                          className="text-xs p-1 w-16 border border-gray-300 rounded"
                          min={0}
                          max={100}
                        />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                ))}
                
                {/* Target language info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold mb-2">About {targetLanguages.find(l => l.id === targetLanguage)?.name}</div>
                  <p className="text-xs text-gray-600 mb-2">
                    {targetLanguages.find(l => l.id === targetLanguage)?.description}
                  </p>
                  
                  {/* Information about conversion quality */}
                  {targetLanguage === 'vbnet' && (
                    <div className="text-xs text-gray-700 p-2 bg-blue-50 rounded">
                      <div className="font-semibold mb-1">Conversion Quality: Excellent</div>
                      <p>VB.NET is the most direct migration path from VB6. Most code structures and syntax can be directly mapped.</p>
                    </div>
                  )}
                  {targetLanguage === 'csharp' && (
                    <div className="text-xs text-gray-700 p-2 bg-blue-50 rounded">
                      <div className="font-semibold mb-1">Conversion Quality: Very Good</div>
                      <p>C# syntax differs from VB6, but most functionality and concepts map well with appropriate transformations.</p>
                    </div>
                  )}
                  {targetLanguage === 'typescript' && (
                    <div className="text-xs text-gray-700 p-2 bg-yellow-50 rounded">
                      <div className="font-semibold mb-1">Conversion Quality: Good</div>
                      <p>TypeScript offers strong typing similar to VB6, but UI and platform-specific code may require more manual attention.</p>
                    </div>
                  )}
                  {targetLanguage === 'javascript' && (
                    <div className="text-xs text-gray-700 p-2 bg-yellow-50 rounded">
                      <div className="font-semibold mb-1">Conversion Quality: Fair</div>
                      <p>JavaScript lacks static typing and some VB6 constructs may require significant rewrites.</p>
                    </div>
                  )}
                  {targetLanguage === 'python' && (
                    <div className="text-xs text-gray-700 p-2 bg-orange-50 rounded">
                      <div className="font-semibold mb-1">Conversion Quality: Moderate</div>
                      <p>Python's syntax and paradigms are quite different from VB6. Expect to make manual adjustments after conversion.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold mb-2">Tips for Best Results</div>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    <li>Ensure your VB6 code compiles without errors before conversion</li>
                    <li>Comment your code well to improve conversion accuracy</li>
                    <li>Use explicit variable declarations and types</li>
                    <li>Review converted code carefully, especially complex logic</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center text-xs text-gray-600">
            <div>
              Converting from Visual Basic 6.0 to {targetLanguages.find(l => l.id === targetLanguage)?.name}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!convertedCode}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download size={16} />
                Save Converted Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};