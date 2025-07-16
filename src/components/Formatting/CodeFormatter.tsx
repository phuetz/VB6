import React, { useState, useEffect } from 'react';
import { Code, Settings, Copy, CopyCheck, ArrowLeftRight, Save, FileCode } from 'lucide-react';

interface FormatOption {
  id: string;
  label: string;
  type: 'checkbox' | 'select' | 'number';
  defaultValue: any;
  options?: string[];
}

interface CodeFormatterProps {
  visible: boolean;
  onClose: () => void;
  onApplyFormatting: (formattedCode: string) => void;
}

export const CodeFormatter: React.FC<CodeFormatterProps> = ({
  visible,
  onClose,
  onApplyFormatting,
}) => {
  const [originalCode, setOriginalCode] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [formatOptions, setFormatOptions] = useState<Record<string, any>>({
    indentSize: 4,
    useTabs: false,
    alignComments: true,
    alignDeclarations: true,
    insertSpaceAfterKeyword: true,
    capitalizeKeywords: true,
    alignContinuations: true,
    preserveEmptyLines: true,
    maxEmptyLines: 2,
    removeTrailingSpaces: true,
    sortImports: false,
  });

  const options: FormatOption[] = [
    {
      id: 'indentSize',
      label: 'Indent Size',
      type: 'number',
      defaultValue: 4,
    },
    {
      id: 'useTabs',
      label: 'Use Tabs Instead of Spaces',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      id: 'alignComments',
      label: 'Align Comments',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'alignDeclarations',
      label: 'Align Declarations',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'insertSpaceAfterKeyword',
      label: 'Space After Keywords',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'capitalizeKeywords',
      label: 'Capitalize Keywords',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'alignContinuations',
      label: 'Align Line Continuations',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'preserveEmptyLines',
      label: 'Preserve Empty Lines',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'maxEmptyLines',
      label: 'Max Empty Lines',
      type: 'number',
      defaultValue: 2,
    },
    {
      id: 'removeTrailingSpaces',
      label: 'Remove Trailing Spaces',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      id: 'sortImports',
      label: 'Sort Imports',
      type: 'checkbox',
      defaultValue: false,
    },
  ];

  const handleOptionChange = (id: string, value: any) => {
    setFormatOptions({
      ...formatOptions,
      [id]: value,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(formattedCode)
      .then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 1500);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const formatCode = () => {
    setIsFormatting(true);

    // This would be replaced with actual formatting logic
    setTimeout(() => {
      let result = originalCode;

      // Simple formatting for demonstration
      if (formatOptions.removeTrailingSpaces) {
        result = result
          .split('\n')
          .map(line => line.trimRight())
          .join('\n');
      }

      if (formatOptions.capitalizeKeywords) {
        const keywords = [
          'Sub',
          'Function',
          'Dim',
          'As',
          'If',
          'Then',
          'Else',
          'ElseIf',
          'End',
          'For',
          'To',
          'Next',
          'While',
          'Wend',
          'Do',
          'Loop',
        ];

        for (const keyword of keywords) {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          result = result.replace(regex, keyword);
        }
      }

      // Apply indentation
      const lines = result.split('\n');
      let indentLevel = 0;
      const indent = formatOptions.useTabs ? '\t' : ' '.repeat(formatOptions.indentSize);

      result = lines
        .map(line => {
          const trimmedLine = line.trim();

          // Decrease indent for End statements before applying
          if (
            /^End\s+(Sub|Function|If|Select|With)/.test(trimmedLine) ||
            /^Next\b/.test(trimmedLine) ||
            /^Loop\b/.test(trimmedLine) ||
            /^Wend\b/.test(trimmedLine)
          ) {
            indentLevel = Math.max(0, indentLevel - 1);
          }

          // Apply indent
          const indentedLine = indent.repeat(indentLevel) + trimmedLine;

          // Increase indent after starting blocks
          if (
            /^(Sub|Function|If|For|Do|While)\b/.test(trimmedLine) &&
            !/(End\s+(Sub|Function|If)|Next|Loop|Wend)\b/.test(trimmedLine) &&
            /\bThen\b/.test(trimmedLine) === /\bIf\b/.test(trimmedLine)
          ) {
            indentLevel++;
          }

          return indentedLine;
        })
        .join('\n');

      // Limit empty lines
      if (formatOptions.preserveEmptyLines) {
        const maxEmptyLines = formatOptions.maxEmptyLines || 2;
        let emptyLineCount = 0;
        result = result
          .split('\n')
          .filter(line => {
            if (line.trim() === '') {
              emptyLineCount++;
              return emptyLineCount <= maxEmptyLines;
            } else {
              emptyLineCount = 0;
              return true;
            }
          })
          .join('\n');
      }

      setFormattedCode(result);
      setIsFormatting(false);
    }, 500);
  };

  const handleApply = () => {
    onApplyFormatting(formattedCode);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      // In a real implementation, this would get the current selection from the editor
      setOriginalCode(`' Sample VB6 code to format
sub  calculateTotal(price as currency, quantity as integer)
dim total as currency
dim discountRate as double
' calculate discount based on quantity
if quantity > 10 then
discountRate = 0.1
elseif quantity > 5 then
discountRate = 0.05
else
discountRate = 0
end if

' calculate total with discount
total = price * quantity * (1 - discountRate)

msgbox "Total: " & formatCurrency(total)
end sub`);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '900px', height: '600px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={16} />
            <span>Code Formatter</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 h-full flex flex-col">
          <div className="flex-1 flex gap-4">
            <div className="w-2/3 flex flex-col">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-sm font-semibold mb-1">Original Code</div>
                  <textarea
                    value={originalCode}
                    onChange={e => setOriginalCode(e.target.value)}
                    className="w-full h-[220px] p-3 font-mono text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">Formatted Code</div>
                  <div className="relative">
                    <textarea
                      value={formattedCode}
                      readOnly
                      className="w-full h-[220px] p-3 font-mono text-sm border border-gray-300 rounded"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                      title="Copy formatted code"
                    >
                      {showCopied ? (
                        <CopyCheck size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold mb-1">Format Preview</div>
                  <div className="bg-white p-3 border border-gray-300 rounded h-[220px] overflow-auto">
                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                      {formattedCode || 'Click "Format" to preview the formatted code.'}
                    </pre>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold">Format Actions</div>
                    <div className="text-xs text-gray-500">
                      Format changes will be previewed in real-time
                    </div>
                  </div>
                  <div className="bg-white p-3 border border-gray-300 rounded h-[220px] overflow-auto">
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={formatCode}
                        disabled={isFormatting || !originalCode}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isFormatting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Formatting...
                          </>
                        ) : (
                          <>
                            <Code size={16} />
                            Format Code
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleApply}
                        disabled={!formattedCode}
                        className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Apply Changes
                      </button>

                      <div className="text-xs text-gray-600 mt-2">
                        Format your code according to the selected formatting rules.
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">
                          Select a preset formatting style:
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs hover:bg-gray-200 rounded">
                            VB6 Standard
                          </button>
                          <button className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs hover:bg-gray-200 rounded">
                            Compact
                          </button>
                          <button className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs hover:bg-gray-200 rounded">
                            Extended
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1/3 flex flex-col">
              <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Settings size={14} />
                <span>Formatting Options</span>
              </div>
              <div className="bg-white border border-gray-300 rounded p-3 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {options.map(option => (
                    <div key={option.id}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs">{option.label}</label>
                        {option.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={formatOptions[option.id]}
                            onChange={e => handleOptionChange(option.id, e.target.checked)}
                          />
                        ) : option.type === 'select' ? (
                          <select
                            value={formatOptions[option.id]}
                            onChange={e => handleOptionChange(option.id, e.target.value)}
                            className="text-xs p-1 border border-gray-300 rounded"
                          >
                            {option.options?.map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            value={formatOptions[option.id]}
                            onChange={e => handleOptionChange(option.id, parseInt(e.target.value))}
                            className="text-xs p-1 w-16 border border-gray-300 rounded"
                            min={0}
                            max={100}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="px-3 py-1 w-full bg-gray-100 border border-gray-300 text-xs hover:bg-gray-200 rounded mb-2">
                    Reset to Defaults
                  </button>
                  <button className="px-3 py-1 w-full bg-gray-100 border border-gray-300 text-xs hover:bg-gray-200 rounded">
                    Save as Preset...
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
