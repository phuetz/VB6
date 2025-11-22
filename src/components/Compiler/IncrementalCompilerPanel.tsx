import React, { useState, useEffect, useCallback } from 'react';
import { 
  incrementalCompiler, 
  CompilationResult 
} from '../../services/IncrementalCompiler';
import { useVB6Store } from '../../stores/vb6Store';
import { 
  Zap, 
  Play, 
  Pause, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Activity,
  Trash2
} from 'lucide-react';

interface IncrementalCompilerPanelProps {
  className?: string;
}

const IncrementalCompilerPanel: React.FC<IncrementalCompilerPanelProps> = ({ 
  className = '' 
}) => {
  const [isWatching, setIsWatching] = useState(false);
  const [lastResult, setLastResult] = useState<CompilationResult | null>(null);
  const [stats, setStats] = useState(incrementalCompiler.getStats());
  const [isCompiling, setIsCompiling] = useState(false);
  const { controls, eventCode, forms } = useVB6Store();

  // Generate form code
  const generateFormCode = useCallback((form: any, formControls: any[]): string => {
    const lines: string[] = [];
    
    lines.push(`VERSION 5.00`);
    lines.push(`Begin VB.Form ${form.name}`);
    lines.push(`   Caption = "${form.caption}"`);
    lines.push(`   ClientHeight = 3195`);
    lines.push(`   ClientWidth = 4680`);
    lines.push(`   ScaleHeight = 3195`);
    lines.push(`   ScaleWidth = 4680`);
    
    // Add controls
    formControls.forEach(control => {
      lines.push(`   Begin VB.${control.type} ${control.name}`);
      Object.entries(control.properties).forEach(([prop, value]) => {
        if (prop !== 'Name' && prop !== 'Type') {
          lines.push(`      ${prop} = ${JSON.stringify(value)}`);
        }
      });
      lines.push(`   End`);
    });
    
    lines.push(`End`);
    
    // Add form code
    const formCode = eventCode[`${form.name}_(General)_(Declarations)`] || '';
    if (formCode) {
      lines.push('');
      lines.push(formCode);
    }
    
    // Add event handlers
    Object.entries(eventCode).forEach(([key, code]) => {
      if (key.startsWith(form.name) && key !== `${form.name}_(General)_(Declarations)`) {
        lines.push('');
        const [, eventName] = key.split('_');
        lines.push(`Private Sub ${key.replace('_', '_')}()`);
        lines.push(code as string);
        lines.push('End Sub');
      }
    });
    
    return lines.join('\n');
  }, [eventCode]);

  // Generate module code
  const generateModuleCode = useCallback((eventCode: Record<string, string>): string => {
    const generalCode = eventCode['(General)_(Declarations)'];
    if (!generalCode) return '';
    
    const lines: string[] = [];
    lines.push(`Attribute VB_Name = "Module1"`);
    lines.push(generalCode);
    
    return lines.join('\n');
  }, []);

  // Update files in compiler when code changes
  useEffect(() => {
    // Add form files
    forms.forEach(form => {
      const formContent = generateFormCode(form, controls.filter(c => c.formId === form.id));
      incrementalCompiler.addFile(`${form.name}.frm`, formContent);
    });

    // Add event code as a module
    const moduleContent = generateModuleCode(eventCode);
    if (moduleContent) {
      incrementalCompiler.addFile('Module1.bas', moduleContent);
    }
  }, [forms, controls, eventCode, generateFormCode, generateModuleCode]);

  // Handle compilation
  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    
    try {
      const result = await incrementalCompiler.compile();
      setLastResult(result);
      setStats(incrementalCompiler.getStats());
    } catch (error) {
      console.error('Compilation failed:', error);
    } finally {
      setIsCompiling(false);
    }
  }, []);

  // Toggle watch mode
  const toggleWatch = useCallback(() => {
    if (isWatching) {
      incrementalCompiler.stopWatch();
      setIsWatching(false);
    } else {
      incrementalCompiler.watch((result) => {
        setLastResult(result);
        setStats(incrementalCompiler.getStats());
      });
      setIsWatching(true);
    }
  }, [isWatching]);

  // Clear cache
  const handleClearCache = useCallback(() => {
    incrementalCompiler.clearCache();
    setStats(incrementalCompiler.getStats());
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(incrementalCompiler.getStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`bg-white border border-gray-400 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-2 flex items-center justify-between">
        <span className="text-sm font-bold flex items-center gap-2">
          <Zap size={16} />
          Incremental Compiler
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="p-1 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Compile"
          >
            {isCompiling ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
          </button>
          <button
            onClick={toggleWatch}
            className={`p-1 hover:bg-blue-700 rounded ${isWatching ? 'bg-blue-700' : ''}`}
            title={isWatching ? 'Stop Watching' : 'Start Watching'}
          >
            {isWatching ? <Pause size={14} /> : <Activity size={14} />}
          </button>
          <button
            onClick={handleClearCache}
            className="p-1 hover:bg-blue-700 rounded"
            title="Clear Cache"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Statistics */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Compilation Statistics</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-100 p-2 rounded">
              <div className="text-gray-600">Total Files</div>
              <div className="font-semibold">{stats.totalFiles}</div>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <div className="text-gray-600">Cached Files</div>
              <div className="font-semibold">{stats.cachedFiles}</div>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <div className="text-gray-600">Pending Files</div>
              <div className="font-semibold">{stats.pendingFiles}</div>
            </div>
            <div className="bg-gray-100 p-2 rounded">
              <div className="text-gray-600">Cache Hit Rate</div>
              <div className="font-semibold">
                {(stats.cacheHitRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          {stats.lastCompilation > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Last compilation: {new Date(stats.lastCompilation).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Watch Status */}
        {isWatching && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-green-600" />
              <span className="text-green-700">
                Watching for changes...
              </span>
            </div>
          </div>
        )}

        {/* Last Compilation Result */}
        {lastResult && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Last Compilation</h3>
            
            {/* Status */}
            <div className={`p-2 rounded mb-2 text-xs ${
              lastResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : (
                  <AlertCircle size={14} className="text-red-600" />
                )}
                <span className={lastResult.success ? 'text-green-700' : 'text-red-700'}>
                  {lastResult.success ? 'Compilation Successful' : 'Compilation Failed'}
                </span>
                <span className="ml-auto text-gray-600">
                  {lastResult.duration}ms
                </span>
              </div>
            </div>

            {/* Errors */}
            {lastResult.errors.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-semibold mb-1 text-red-600">
                  Errors ({lastResult.errors.length})
                </h4>
                <div className="space-y-1">
                  {lastResult.errors.map((error, index) => (
                    <div 
                      key={index} 
                      className="bg-red-50 border border-red-200 p-2 rounded text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <FileText size={12} className="text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold">
                            {error.file}:{error.line}:{error.column}
                          </div>
                          <div className="text-red-700">{error.message}</div>
                          {error.code && (
                            <div className="text-red-600 text-xs">
                              Code: {error.code}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {lastResult.warnings.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-semibold mb-1 text-yellow-600">
                  Warnings ({lastResult.warnings.length})
                </h4>
                <div className="space-y-1">
                  {lastResult.warnings.map((warning, index) => (
                    <div 
                      key={index} 
                      className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle size={12} className="text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold">
                            {warning.file}:{warning.line}:{warning.column}
                          </div>
                          <div className="text-yellow-700">{warning.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output Preview */}
            {lastResult.success && lastResult.output && (
              <div>
                <h4 className="text-xs font-semibold mb-1">Output Preview</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-40">
                  {lastResult.output.substring(0, 500)}
                  {lastResult.output.length > 500 && '...'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncrementalCompilerPanel;