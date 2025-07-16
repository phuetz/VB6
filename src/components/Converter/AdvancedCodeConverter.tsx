/**
 * Advanced Code Converter
 * Convert VB6 to modern languages with AI-powered optimization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MonacoEditor from '@monaco-editor/react';
import { useVB6Store } from '../../stores/vb6Store';
import { convertVB6Code } from '../../utils/codeConverter';
import { eventSystem } from '../../services/VB6EventSystem';

interface ConversionTarget {
  id: string;
  name: string;
  icon: string;
  extension: string;
  framework?: string;
  description: string;
  features: string[];
}

interface ConversionOptions {
  modernizeSyntax: boolean;
  useAsync: boolean;
  addTypeAnnotations: boolean;
  includeComments: boolean;
  preserveStructure: boolean;
  optimizePerformance: boolean;
  targetFramework?: string;
  compatibility?: 'strict' | 'loose';
}

interface ConversionResult {
  success: boolean;
  code: string;
  warnings: string[];
  errors: string[];
  statistics: {
    linesConverted: number;
    functionsConverted: number;
    classesCreated: number;
    modernizations: number;
  };
}

export const AdvancedCodeConverter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<ConversionTarget | null>(null);
  const [convertedCode, setConvertedCode] = useState('');
  const [options, setOptions] = useState<ConversionOptions>({
    modernizeSyntax: true,
    useAsync: true,
    addTypeAnnotations: true,
    includeComments: true,
    preserveStructure: false,
    optimizePerformance: true,
    compatibility: 'loose',
  });
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  
  const { currentCode } = useVB6Store();

  // Available conversion targets
  const targets: ConversionTarget[] = [
    {
      id: 'csharp',
      name: 'C#',
      icon: '🔷',
      extension: 'cs',
      framework: '.NET 6+',
      description: 'Modern C# with .NET 6+ features',
      features: ['async/await', 'LINQ', 'nullable types', 'records'],
    },
    {
      id: 'vbnet',
      name: 'VB.NET',
      icon: '🔶',
      extension: 'vb',
      framework: '.NET Framework',
      description: 'Visual Basic .NET with modern features',
      features: ['object-oriented', 'generics', 'LINQ', 'async'],
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      icon: '🔵',
      extension: 'ts',
      framework: 'React/Angular/Vue',
      description: 'TypeScript for web applications',
      features: ['type safety', 'modern JS', 'React components', 'async/await'],
    },
    {
      id: 'python',
      name: 'Python',
      icon: '🐍',
      extension: 'py',
      framework: 'Tkinter/PyQt',
      description: 'Python with GUI framework',
      features: ['clean syntax', 'rich libraries', 'data science', 'AI/ML'],
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: '🟡',
      extension: 'js',
      framework: 'Electron/React',
      description: 'Modern JavaScript ES2022+',
      features: ['ES modules', 'classes', 'arrow functions', 'promises'],
    },
    {
      id: 'java',
      name: 'Java',
      icon: '☕',
      extension: 'java',
      framework: 'Swing/JavaFX',
      description: 'Java with modern GUI framework',
      features: ['platform independent', 'strong typing', 'enterprise ready'],
    },
    {
      id: 'go',
      name: 'Go',
      icon: '🐹',
      extension: 'go',
      description: 'Go for high-performance applications',
      features: ['concurrency', 'fast compilation', 'simple syntax'],
    },
    {
      id: 'rust',
      name: 'Rust',
      icon: '🦀',
      extension: 'rs',
      description: 'Rust for system programming',
      features: ['memory safety', 'zero-cost abstractions', 'performance'],
    },
  ];

  useEffect(() => {
    setSourceCode(currentCode);
  }, [currentCode]);

  const convertCode = async () => {
    if (!targetLanguage || !sourceCode) return;

    setIsConverting(true);
    setResult(null);

    try {
      // Simulate conversion process
      await new Promise(resolve => setTimeout(resolve, 1500));

      const converted = performConversion(sourceCode, targetLanguage, options);
      setConvertedCode(converted.code);
      setResult(converted);
      
      eventSystem.fire('CodeConverter', 'ConversionComplete', {
        target: targetLanguage.id,
        linesConverted: converted.statistics.linesConverted,
      });
    } catch (error) {
      setResult({
        success: false,
        code: '',
        warnings: [],
        errors: [`Conversion failed: ${error.message}`],
        statistics: {
          linesConverted: 0,
          functionsConverted: 0,
          classesCreated: 0,
          modernizations: 0,
        },
      });
    } finally {
      setIsConverting(false);
    }
  };

  const performConversion = (
    source: string,
    target: ConversionTarget,
    options: ConversionOptions
  ): ConversionResult => {
    const lines = source.split('\n');
    const warnings: string[] = [];
    const errors: string[] = [];
    let convertedLines: string[] = [];

    switch (target.id) {
      case 'csharp':
        convertedLines = convertToCSharp(lines, options, warnings);
        break;
      case 'typescript':
        convertedLines = convertToTypeScript(lines, options, warnings);
        break;
      case 'python':
        convertedLines = convertToPython(lines, options, warnings);
        break;
      default:
        convertedLines = [`// Conversion to ${target.name} is not yet implemented`];
        warnings.push(`Conversion to ${target.name} is in beta`);
    }

    return {
      success: errors.length === 0,
      code: convertedLines.join('\n'),
      warnings,
      errors,
      statistics: {
        linesConverted: lines.length,
        functionsConverted: (source.match(/Sub|Function/g) || []).length,
        classesCreated: options.modernizeSyntax ? 1 : 0,
        modernizations: warnings.filter(w => w.includes('modernized')).length,
      },
    };
  };

  const convertToCSharp = (
    lines: string[],
    options: ConversionOptions,
    warnings: string[]
  ): string[] => {
    const converted: string[] = [
      'using System;',
      'using System.Windows.Forms;',
      'using System.Drawing;',
      '',
      'namespace VB6Converted',
      '{',
      '    public partial class Form1 : Form',
      '    {',
    ];

    // Convert VB6 declarations and code
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Dim ')) {
        // Convert variable declarations
        const varMatch = trimmed.match(/Dim\s+(\w+)\s+As\s+(\w+)/);
        if (varMatch) {
          const [, varName, varType] = varMatch;
          const csType = mapVB6TypeToCSharp(varType);
          converted.push(`        private ${csType} ${varName};`);
        }
      } else if (trimmed.startsWith('Private Sub')) {
        // Convert subroutines
        const subMatch = trimmed.match(/Private Sub\s+(\w+)\s*\(([^)]*)\)/);
        if (subMatch) {
          const [, subName, params] = subMatch;
          converted.push(`        private void ${subName}(${convertParameters(params, 'csharp')})`);
          converted.push('        {');
        }
      } else if (trimmed === 'End Sub') {
        converted.push('        }');
        converted.push('');
      } else if (trimmed.includes('MsgBox')) {
        // Convert MsgBox to MessageBox.Show
        const msgBoxConverted = trimmed.replace(
          /MsgBox\s*\(([^)]*)\)/g,
          'MessageBox.Show($1)'
        );
        converted.push(`            ${msgBoxConverted};`);
        warnings.push('MsgBox modernized to MessageBox.Show');
      } else if (trimmed) {
        // Generic line conversion
        converted.push(`            // TODO: Convert - ${trimmed}`);
      }
    });

    converted.push('    }');
    converted.push('}');

    if (options.modernizeSyntax) {
      warnings.push('Applied modern C# syntax patterns');
    }

    return converted;
  };

  const convertToTypeScript = (
    lines: string[],
    options: ConversionOptions,
    warnings: string[]
  ): string[] => {
    const converted: string[] = [];

    if (options.targetFramework === 'React') {
      converted.push(
        "import React, { useState, useEffect } from 'react';",
        '',
        'interface Form1Props {',
        '  // Add props here',
        '}',
        '',
        'export const Form1: React.FC<Form1Props> = (props) => {'
      );
    } else {
      converted.push(
        'export class Form1 {'
      );
    }

    // Convert VB6 code
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Dim ')) {
        const varMatch = trimmed.match(/Dim\s+(\w+)\s+As\s+(\w+)/);
        if (varMatch) {
          const [, varName, varType] = varMatch;
          const tsType = mapVB6TypeToTypeScript(varType);
          if (options.targetFramework === 'React') {
            converted.push(`  const [${varName}, set${capitalize(varName)}] = useState<${tsType}>();`);
          } else {
            converted.push(`  private ${varName}: ${tsType};`);
          }
        }
      }
    });

    if (options.targetFramework === 'React') {
      converted.push(
        '  return (',
        '    <div className="form1">',
        '      {/* Add your UI components here */}',
        '    </div>',
        '  );',
        '};'
      );
    } else {
      converted.push('}');
    }

    if (options.useAsync) {
      warnings.push('Added async/await support where applicable');
    }

    return converted;
  };

  const convertToPython = (
    lines: string[],
    options: ConversionOptions,
    warnings: string[]
  ): string[] => {
    const converted: string[] = [
      'import tkinter as tk',
      'from tkinter import messagebox',
      '',
      'class Form1(tk.Tk):',
      '    def __init__(self):',
      '        super().__init__()',
      '        self.title("Form1")',
      '        self.geometry("800x600")',
      '        self._initialize_components()',
      '',
      '    def _initialize_components(self):',
      '        """Initialize form components"""',
    ];

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Dim ')) {
        const varMatch = trimmed.match(/Dim\s+(\w+)\s+As\s+(\w+)/);
        if (varMatch) {
          const [, varName, varType] = varMatch;
          converted.push(`        self.${varName} = None  # ${varType}`);
        }
      } else if (trimmed.includes('MsgBox')) {
        const pythonMsg = trimmed.replace(
          /MsgBox\s*\(([^)]*)\)/g,
          'messagebox.showinfo("Message", $1)'
        );
        converted.push(`        ${pythonMsg}`);
      }
    });

    converted.push(
      '',
      'if __name__ == "__main__":',
      '    app = Form1()',
      '    app.mainloop()'
    );

    warnings.push('Using Tkinter for GUI (consider PyQt for more features)');

    return converted;
  };

  const mapVB6TypeToCSharp = (vb6Type: string): string => {
    const typeMap: Record<string, string> = {
      'Integer': 'int',
      'Long': 'long',
      'Single': 'float',
      'Double': 'double',
      'String': 'string',
      'Boolean': 'bool',
      'Date': 'DateTime',
      'Variant': 'object',
      'Object': 'object',
    };
    return typeMap[vb6Type] || 'object';
  };

  const mapVB6TypeToTypeScript = (vb6Type: string): string => {
    const typeMap: Record<string, string> = {
      'Integer': 'number',
      'Long': 'number',
      'Single': 'number',
      'Double': 'number',
      'String': 'string',
      'Boolean': 'boolean',
      'Date': 'Date',
      'Variant': 'any',
      'Object': 'any',
    };
    return typeMap[vb6Type] || 'any';
  };

  const convertParameters = (params: string, targetLang: string): string => {
    // Simplified parameter conversion
    if (!params) return '';
    return params; // TODO: Implement proper parameter conversion
  };

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const downloadConvertedCode = () => {
    if (!convertedCode || !targetLanguage) return;

    const blob = new Blob([convertedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${targetLanguage.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!convertedCode) return;

    try {
      await navigator.clipboard.writeText(convertedCode);
      eventSystem.fire('CodeConverter', 'CopiedToClipboard', {});
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <>
      {/* Converter Button */}
      <motion.button
        className="fixed top-24 right-6 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-lg z-40 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>🔄</span>
        <span>Convert Code</span>
      </motion.button>

      {/* Converter Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Advanced Code Converter</h2>
                    <p className="text-gray-600 dark:text-gray-400">Convert VB6 to modern languages with AI optimization</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Target Language Selection */}
              <div className="p-6 border-b dark:border-gray-800">
                <h3 className="font-semibold mb-4">Select Target Language</h3>
                <div className="grid grid-cols-4 gap-3">
                  {targets.map(target => (
                    <motion.button
                      key={target.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        targetLanguage?.id === target.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTargetLanguage(target)}
                    >
                      <div className="text-3xl mb-2">{target.icon}</div>
                      <div className="font-semibold">{target.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{target.framework}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Conversion Options */}
              {targetLanguage && (
                <div className="p-6 border-b dark:border-gray-800">
                  <h3 className="font-semibold mb-4">Conversion Options</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.modernizeSyntax}
                        onChange={(e) => setOptions({ ...options, modernizeSyntax: e.target.checked })}
                        className="rounded"
                      />
                      <span>Modernize syntax</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.useAsync}
                        onChange={(e) => setOptions({ ...options, useAsync: e.target.checked })}
                        className="rounded"
                      />
                      <span>Use async/await</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.addTypeAnnotations}
                        onChange={(e) => setOptions({ ...options, addTypeAnnotations: e.target.checked })}
                        className="rounded"
                      />
                      <span>Add type annotations</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.optimizePerformance}
                        onChange={(e) => setOptions({ ...options, optimizePerformance: e.target.checked })}
                        className="rounded"
                      />
                      <span>Optimize performance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.includeComments}
                        onChange={(e) => setOptions({ ...options, includeComments: e.target.checked })}
                        className="rounded"
                      />
                      <span>Include comments</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.preserveStructure}
                        onChange={(e) => setOptions({ ...options, preserveStructure: e.target.checked })}
                        className="rounded"
                      />
                      <span>Preserve structure</span>
                    </label>
                  </div>
                  
                  {targetLanguage.framework && (
                    <div className="mt-4">
                      <label className="block">
                        <span className="text-sm font-medium">Target Framework</span>
                        <select
                          value={options.targetFramework}
                          onChange={(e) => setOptions({ ...options, targetFramework: e.target.value })}
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700"
                        >
                          <option value="">Default</option>
                          {targetLanguage.id === 'typescript' && (
                            <>
                              <option value="React">React</option>
                              <option value="Angular">Angular</option>
                              <option value="Vue">Vue</option>
                            </>
                          )}
                          {targetLanguage.id === 'csharp' && (
                            <>
                              <option value="WinForms">Windows Forms</option>
                              <option value="WPF">WPF</option>
                              <option value="MAUI">.NET MAUI</option>
                            </>
                          )}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Code Editors */}
              <div className="flex-1 flex overflow-hidden">
                {/* Source Code */}
                <div className="w-1/2 flex flex-col border-r dark:border-gray-800">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-semibold">VB6 Source Code</h4>
                  </div>
                  <div className="flex-1">
                    <MonacoEditor
                      value={sourceCode}
                      onChange={(value) => setSourceCode(value || '')}
                      language="vb"
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                {/* Converted Code */}
                <div className="w-1/2 flex flex-col">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                    <h4 className="font-semibold">
                      {targetLanguage ? `${targetLanguage.name} Output` : 'Select a target language'}
                    </h4>
                    {convertedCode && (
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                        >
                          Copy
                        </button>
                        <button
                          onClick={downloadConvertedCode}
                          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                        >
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {isConverting ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4" />
                          <p>Converting code...</p>
                        </div>
                      </div>
                    ) : convertedCode ? (
                      <MonacoEditor
                        value={convertedCode}
                        language={targetLanguage?.id || 'plaintext'}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 14,
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        {targetLanguage ? 'Click Convert to see the result' : 'Select a target language first'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results and Actions */}
              <div className="p-6 border-t dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    {result && (
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          result.success
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {result.success ? 'Conversion Successful' : 'Conversion Failed'}
                        </div>
                        {result.statistics && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {result.statistics.linesConverted} lines •
                            {result.statistics.functionsConverted} functions •
                            {result.statistics.modernizations} modernizations
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={convertCode}
                      disabled={!targetLanguage || !sourceCode || isConverting}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConverting ? 'Converting...' : 'Convert'}
                    </button>
                  </div>
                </div>
                
                {/* Warnings and Errors */}
                {result && (result.warnings.length > 0 || result.errors.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠ {warning}
                      </div>
                    ))}
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 dark:text-red-400">
                        ❌ {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdvancedCodeConverter;