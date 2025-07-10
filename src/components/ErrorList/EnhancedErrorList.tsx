import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle, ArrowRight, Eye, CheckCircle, Filter, ArrowDownUp } from 'lucide-react';

interface ErrorItem {
  id: string;
  message: string;
  code: string;
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'info';
  source: 'compiler' | 'linter' | 'runtime';
  timestamp: Date;
  resolved?: boolean;
}

interface EnhancedErrorListProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToError: (file: string, line: number, column: number) => void;
  onFixError?: (errorId: string) => void;
  onClearErrors?: () => void;
}

export const EnhancedErrorList: React.FC<EnhancedErrorListProps> = ({
  visible,
  onClose,
  onNavigateToError,
  onFixError,
  onClearErrors
}) => {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'severity' | 'file'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedError, setSelectedError] = useState<string | null>(null);

  // Sample data for demonstration
  useEffect(() => {
    const sampleErrors: ErrorItem[] = [
      {
        id: '1',
        message: 'Variable "intCounter" is used before being assigned a value',
        code: 'VB001',
        file: 'Form1.frm',
        line: 45,
        column: 12,
        type: 'error',
        source: 'compiler',
        timestamp: new Date()
      },
      {
        id: '2',
        message: 'Option Explicit is not specified at module level',
        code: 'VB002',
        file: 'Module1.bas',
        line: 1,
        column: 1,
        type: 'warning',
        source: 'linter',
        timestamp: new Date(Date.now() - 5 * 60000) // 5 minutes ago
      },
      {
        id: '3',
        message: 'Use of obsolete method "LoadPicture"',
        code: 'VB003',
        file: 'Form2.frm',
        line: 102,
        column: 8,
        type: 'info',
        source: 'linter',
        timestamp: new Date(Date.now() - 10 * 60000) // 10 minutes ago
      },
      {
        id: '4',
        message: 'Division by zero',
        code: 'VB004',
        file: 'Module2.bas',
        line: 87,
        column: 22,
        type: 'error',
        source: 'runtime',
        timestamp: new Date(Date.now() - 2 * 60000) // 2 minutes ago
      },
      {
        id: '5',
        message: 'Implicit type conversion from String to Integer',
        code: 'VB005',
        file: 'Form1.frm',
        line: 156,
        column: 18,
        type: 'warning',
        source: 'compiler',
        timestamp: new Date(Date.now() - 8 * 60000) // 8 minutes ago
      }
    ];

    setErrors(sampleErrors);
  }, []);

  const getFilteredErrors = () => {
    let result = [...errors];
    
    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(error => error.type === filter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'time':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'severity': {
          const severityRank = { error: 0, warning: 1, info: 2 };
          comparison = severityRank[a.type] - severityRank[b.type];
          break;
        }
        case 'file':
          comparison = a.file.localeCompare(b.file);
          if (comparison === 0) {
            comparison = a.line - b.line;
          }
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'info':
        return <Info size={16} className="text-blue-600" />;
      default:
        return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'compiler':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">Compiler</span>;
      case 'linter':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Linter</span>;
      case 'runtime':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">Runtime</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">{source}</span>;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleSort = (field: 'time' | 'severity' | 'file') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handleMarkResolved = (id: string) => {
    setErrors(errors.map(error => 
      error.id === id ? { ...error, resolved: true } : error
    ));
  };

  const getErrorCount = (type: 'error' | 'warning' | 'info') => {
    return errors.filter(error => error.type === type).length;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '900px', height: '600px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Error List</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <div className="relative">
                <button className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-400 text-sm hover:bg-gray-100">
                  <Filter size={14} />
                  {filter === 'all' ? 'All' : filter === 'errors' ? 'Errors' : filter === 'warnings' ? 'Warnings' : 'Info'}
                </button>
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg rounded hidden group-hover:block z-10">
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                    onClick={() => setFilter('errors')}
                  >
                    <AlertCircle size={14} className="text-red-600" />
                    Errors
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                    onClick={() => setFilter('warnings')}
                  >
                    <AlertTriangle size={14} className="text-yellow-600" />
                    Warnings
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                    onClick={() => setFilter('info')}
                  >
                    <Info size={14} className="text-blue-600" />
                    Info
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <button className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-400 text-sm hover:bg-gray-100">
                  <ArrowDownUp size={14} />
                  Sort: {sortBy === 'time' ? 'Time' : sortBy === 'severity' ? 'Severity' : 'Location'}
                </button>
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg rounded hidden group-hover:block z-10">
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => toggleSort('time')}
                  >
                    Time
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => toggleSort('severity')}
                  >
                    Severity
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => toggleSort('file')}
                  >
                    Location
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 bg-white border border-gray-400 text-sm hover:bg-gray-100"
                onClick={onClearErrors}
                title="Clear all errors"
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>

          {/* Error Summary */}
          <div className="flex bg-white border border-gray-300 mb-4 rounded p-2 text-sm">
            <div className="flex-1 flex items-center justify-center gap-2">
              <AlertCircle size={14} className="text-red-600" />
              <span><strong>{getErrorCount('error')}</strong> Errors</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <AlertTriangle size={14} className="text-yellow-600" />
              <span><strong>{getErrorCount('warning')}</strong> Warnings</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <Info size={14} className="text-blue-600" />
              <span><strong>{getErrorCount('info')}</strong> Information</span>
            </div>
          </div>

          {/* Error List */}
          <div className="flex-1 overflow-hidden bg-white border border-gray-400 flex">
            {/* Main list */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="border-b border-gray-300">
                    <th className="text-left p-2 w-6"></th>
                    <th className="text-left p-2">Message</th>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">File</th>
                    <th className="text-left p-2">Line</th>
                    <th className="text-left p-2">Source</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredErrors().length > 0 ? (
                    getFilteredErrors().map((error) => (
                      <tr 
                        key={error.id} 
                        className={`border-b border-gray-200 hover:bg-gray-50 ${
                          selectedError === error.id ? 'bg-blue-50' : ''
                        } ${error.resolved ? 'opacity-50 bg-gray-50' : ''}`}
                        onClick={() => setSelectedError(error.id)}
                      >
                        <td className="p-2">
                          {getErrorTypeIcon(error.type)}
                        </td>
                        <td className="p-2 max-w-xs truncate" title={error.message}>
                          {error.message}
                        </td>
                        <td className="p-2 font-mono">{error.code}</td>
                        <td className="p-2 font-mono">{error.file}</td>
                        <td className="p-2">{error.line}:{error.column}</td>
                        <td className="p-2">{getSourceBadge(error.source)}</td>
                        <td className="p-2 text-gray-500 whitespace-nowrap">
                          {formatTime(error.timestamp)}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <button
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToError(error.file, error.line, error.column);
                              }}
                              title="Navigate to error"
                            >
                              <ArrowRight size={14} />
                            </button>
                            {onFixError && (
                              <button
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFixError(error.id);
                                }}
                                title="Quick fix"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkResolved(error.id);
                              }}
                              title="Mark as resolved"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        {errors.length === 0 
                          ? "No errors or warnings found." 
                          : "No items match the current filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Error Details */}
          {selectedError && (
            <div className="mt-4 p-3 border border-gray-300 bg-gray-50">
              <div className="text-sm font-bold mb-2">Error Details</div>
              {errors.find(e => e.id === selectedError) && (
                <div className="text-xs">
                  <div className="mb-1">
                    <span className="font-semibold">Message:</span> {errors.find(e => e.id === selectedError)?.message}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Location:</span> {errors.find(e => e.id === selectedError)?.file} at line {errors.find(e => e.id === selectedError)?.line}, column {errors.find(e => e.id === selectedError)?.column}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Code:</span> {errors.find(e => e.id === selectedError)?.code}
                  </div>
                  <div>
                    <span className="font-semibold">Time:</span> {errors.find(e => e.id === selectedError)?.timestamp.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};