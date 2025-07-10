import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, AlertCircle, ArrowRight, FileText } from 'lucide-react';

interface CodeIssue {
  id: string;
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  quickFix?: {
    title: string;
    edits: Array<{
      range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
      newText: string;
    }>;
  }[];
}

interface CodeAnalyzerProps {
  visible: boolean;
  onClose: () => void;
  onFixIssue: (issue: CodeIssue, fixIndex: number) => void;
  onNavigateToIssue: (file: string, line: number, column: number) => void;
}

export const CodeAnalyzer: React.FC<CodeAnalyzerProps> = ({
  visible,
  onClose,
  onFixIssue,
  onNavigateToIssue
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'metrics'>('issues');
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [metrics, setMetrics] = useState({
    linesOfCode: 0,
    complexity: 0,
    maintainability: 0,
    unusedVariables: 0,
    undeclaredVariables: 0,
    duplicateCode: 0,
    performanceIssues: 0,
    qualityScore: 0
  });

  // Sample code issues for demonstration
  useEffect(() => {
    // In a real implementation, this would analyze actual code
    setIssues([
      {
        id: '1',
        file: 'Form1.frm',
        line: 24,
        column: 5,
        message: 'Variable "intCounter" is never used',
        code: 'VB001',
        severity: 'warning',
        quickFix: [
          {
            title: 'Remove unused variable',
            edits: [
              {
                range: { startLine: 24, startColumn: 5, endLine: 24, endColumn: 35 },
                newText: ''
              }
            ]
          }
        ]
      },
      {
        id: '2',
        file: 'Module1.bas',
        line: 42,
        column: 10,
        message: 'Option Explicit is missing',
        code: 'VB002',
        severity: 'error',
        quickFix: [
          {
            title: 'Add Option Explicit',
            edits: [
              {
                range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
                newText: 'Option Explicit\n\n'
              }
            ]
          }
        ]
      },
      {
        id: '3',
        file: 'Form1.frm',
        line: 105,
        column: 12,
        message: 'Use of "GoTo" statement is discouraged',
        code: 'VB003',
        severity: 'info'
      },
      {
        id: '4',
        file: 'Module1.bas',
        line: 67,
        column: 3,
        message: 'String concatenation in loop is inefficient',
        code: 'VB004',
        severity: 'warning',
        quickFix: [
          {
            title: 'Use StringBuilder pattern',
            edits: [
              {
                range: { startLine: 67, startColumn: 3, endLine: 67, endColumn: 50 },
                newText: '    sb.Append myString & vbCrLf'
              }
            ]
          }
        ]
      },
      {
        id: '5',
        file: 'Form2.frm',
        line: 18,
        column: 15,
        message: 'Memory leak: Set object to Nothing before exiting procedure',
        code: 'VB005',
        severity: 'error',
        quickFix: [
          {
            title: 'Add cleanup code',
            edits: [
              {
                range: { startLine: 25, startColumn: 1, endLine: 25, endColumn: 1 },
                newText: '    Set objDatabase = Nothing\n'
              }
            ]
          }
        ]
      }
    ]);

    setMetrics({
      linesOfCode: 1256,
      complexity: 32,
      maintainability: 76,
      unusedVariables: 8,
      undeclaredVariables: 3,
      duplicateCode: 5,
      performanceIssues: 4,
      qualityScore: 78
    });
  }, []);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1500);
  };

  const getFilteredIssues = () => {
    if (filter === 'all') return issues;
    return issues.filter(issue => issue.severity === filter);
  };

  const getFileIssues = (file: string | null) => {
    if (!file) return getFilteredIssues();
    return getFilteredIssues().filter(issue => issue.file === file);
  };

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle size={16} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'info': return <FileText size={16} className="text-blue-600" />;
      default: return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  const getIssueCountBySeverity = (severity: 'error' | 'warning' | 'info') => {
    return issues.filter(issue => issue.severity === severity).length;
  };

  const getQualityColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUniquePaths = () => {
    return Array.from(new Set(issues.map(issue => issue.file)));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '900px', height: '650px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Code Analyzer</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Header with action buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-3">
              <button
                className={`px-3 py-1 text-sm ${activeTab === 'issues' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => setActiveTab('issues')}
              >
                Issues
              </button>
              <button
                className={`px-3 py-1 text-sm ${activeTab === 'metrics' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => setActiveTab('metrics')}
              >
                Metrics
              </button>
            </div>
            
            <button
              className={`px-3 py-1 flex items-center gap-1 text-sm ${
                isAnalyzing 
                  ? 'bg-gray-400 text-gray-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              onClick={startAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Project'}
              {!isAnalyzing && <Check size={14} />}
            </button>
          </div>

          {/* Summary Bar */}
          <div className="flex bg-white border border-gray-300 mb-4 rounded p-2 text-sm">
            <div className="flex-1 flex items-center justify-center gap-2">
              <AlertCircle size={14} className="text-red-600" />
              <span><strong>{getIssueCountBySeverity('error')}</strong> Errors</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <AlertTriangle size={14} className="text-yellow-600" />
              <span><strong>{getIssueCountBySeverity('warning')}</strong> Warnings</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <FileText size={14} className="text-blue-600" />
              <span><strong>{getIssueCountBySeverity('info')}</strong> Information</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className={`font-bold ${getQualityColorClass(metrics.qualityScore)}`}>
                {metrics.qualityScore}%
              </div>
              <span>Quality Score</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'issues' ? (
              <>
                {/* Files tree */}
                <div className="w-1/4 bg-white border border-gray-400 overflow-auto mr-2">
                  <div className="p-2 border-b border-gray-300 text-xs font-semibold bg-gray-100">
                    Files
                  </div>
                  <div className="overflow-y-auto">
                    <div 
                      className={`p-2 hover:bg-gray-100 cursor-pointer text-xs ${
                        currentFile === null ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setCurrentFile(null)}
                    >
                      All Files
                    </div>
                    {getUniquePaths().map(path => (
                      <div 
                        key={path}
                        className={`p-2 hover:bg-gray-100 cursor-pointer text-xs flex items-center justify-between ${
                          currentFile === path ? 'bg-blue-100' : ''
                        }`}
                        onClick={() => setCurrentFile(path)}
                      >
                        <span>{path}</span>
                        <span className="rounded-full bg-gray-300 px-1 text-xs">
                          {issues.filter(i => i.file === path).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues list */}
                <div className="flex-1 flex flex-col">
                  {/* Filter bar */}
                  <div className="bg-gray-100 border border-gray-400 border-b-0 p-2 flex justify-between">
                    <div className="flex space-x-1">
                      <button
                        className={`px-2 py-0.5 text-xs rounded ${
                          filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-300'
                        }`}
                        onClick={() => setFilter('all')}
                      >
                        All
                      </button>
                      <button
                        className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                          filter === 'errors' ? 'bg-red-600 text-white' : 'bg-gray-300'
                        }`}
                        onClick={() => setFilter('errors')}
                      >
                        <AlertCircle size={10} />
                        Errors
                      </button>
                      <button
                        className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                          filter === 'warnings' ? 'bg-yellow-600 text-white' : 'bg-gray-300'
                        }`}
                        onClick={() => setFilter('warnings')}
                      >
                        <AlertTriangle size={10} />
                        Warnings
                      </button>
                      <button
                        className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                          filter === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-300'
                        }`}
                        onClick={() => setFilter('info')}
                      >
                        <FileText size={10} />
                        Info
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      {getFileIssues(currentFile).length} issue{getFileIssues(currentFile).length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Issues table */}
                  <div className="flex-1 bg-white border border-gray-400 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr className="border-b border-gray-300">
                          <th className="text-left p-2">Severity</th>
                          <th className="text-left p-2">File</th>
                          <th className="text-left p-2">Line</th>
                          <th className="text-left p-2">Message</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFileIssues(currentFile).length > 0 ? (
                          getFileIssues(currentFile).map(issue => (
                            <tr key={issue.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-2">
                                {getIssueIcon(issue.severity)}
                              </td>
                              <td className="p-2 font-mono">{issue.file}</td>
                              <td className="p-2">{issue.line}:{issue.column}</td>
                              <td className="p-2">
                                <div className="flex items-start">
                                  <div>
                                    <div className="font-medium">{issue.message}</div>
                                    <div className="text-gray-500 text-xs">{issue.code}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <button
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs"
                                    onClick={() => onNavigateToIssue(issue.file, issue.line, issue.column)}
                                    title="Go to issue"
                                  >
                                    <ArrowRight size={12} />
                                  </button>
                                  {issue.quickFix && issue.quickFix.length > 0 && (
                                    <button
                                      className="px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-xs"
                                      onClick={() => onFixIssue(issue, 0)}
                                      title={issue.quickFix[0].title}
                                    >
                                      Fix
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-500">
                              No issues found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              // Metrics tab content
              <div className="flex-1 bg-white border border-gray-400 p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold mb-3">Code Metrics</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">Code Quality Score</span>
                          <span className={`text-xs font-bold ${getQualityColorClass(metrics.qualityScore)}`}>
                            {metrics.qualityScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${
                              metrics.qualityScore >= 90 ? 'bg-green-600' : 
                              metrics.qualityScore >= 70 ? 'bg-yellow-600' : 
                              'bg-red-600'
                            } h-2 rounded-full`}
                            style={{ width: `${metrics.qualityScore}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">Maintainability Index</span>
                          <span className={`text-xs font-bold ${
                            metrics.maintainability >= 80 ? 'text-green-600' : 
                            metrics.maintainability >= 60 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {metrics.maintainability}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${
                              metrics.maintainability >= 80 ? 'bg-green-600' : 
                              metrics.maintainability >= 60 ? 'bg-yellow-600' : 
                              'bg-red-600'
                            } h-2 rounded-full`}
                            style={{ width: `${metrics.maintainability}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">Cyclomatic Complexity</span>
                          <span className="text-xs font-bold">
                            {metrics.complexity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          {metrics.complexity < 20 ? 'Good' : metrics.complexity < 50 ? 'Moderate' : 'Complex'}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${
                              metrics.complexity < 20 ? 'bg-green-600' : 
                              metrics.complexity < 50 ? 'bg-yellow-600' : 
                              'bg-red-600'
                            } h-2 rounded-full`}
                            style={{ width: `${Math.min(metrics.complexity, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold mb-3">Code Statistics</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 border border-gray-300 rounded">
                        <span className="text-sm">Lines of Code</span>
                        <span className="font-bold text-sm">{metrics.linesOfCode.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border border-gray-300 rounded">
                        <span className="text-sm">Unused Variables</span>
                        <span className={`font-bold text-sm ${metrics.unusedVariables > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {metrics.unusedVariables}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border border-gray-300 rounded">
                        <span className="text-sm">Undeclared Variables</span>
                        <span className={`font-bold text-sm ${metrics.undeclaredVariables > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {metrics.undeclaredVariables}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border border-gray-300 rounded">
                        <span className="text-sm">Duplicate Code</span>
                        <span className={`font-bold text-sm ${metrics.duplicateCode > 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {metrics.duplicateCode}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border border-gray-300 rounded">
                        <span className="text-sm">Performance Issues</span>
                        <span className={`font-bold text-sm ${metrics.performanceIssues > 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {metrics.performanceIssues}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recommendations */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold mb-2">Recommendations</h3>
                  
                  <div className="space-y-2 text-sm">
                    {metrics.unusedVariables > 0 && (
                      <div className="p-2 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800">
                        Remove {metrics.unusedVariables} unused variables to improve code maintainability.
                      </div>
                    )}
                    
                    {metrics.undeclaredVariables > 0 && (
                      <div className="p-2 bg-red-50 border-l-4 border-red-500 text-red-800">
                        Add 'Option Explicit' and declare {metrics.undeclaredVariables} missing variables to avoid runtime errors.
                      </div>
                    )}
                    
                    {metrics.duplicateCode > 3 && (
                      <div className="p-2 bg-blue-50 border-l-4 border-blue-500 text-blue-800">
                        Refactor duplicate code into reusable functions to improve maintainability.
                      </div>
                    )}
                    
                    {metrics.complexity > 30 && (
                      <div className="p-2 bg-purple-50 border-l-4 border-purple-500 text-purple-800">
                        Consider breaking down complex procedures into smaller, more manageable chunks.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};