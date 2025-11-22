import React, { useState, useEffect, useCallback } from 'react';
import { VB6DebugEngine, VB6CallStackFrame } from '../../services/VB6DebugEngine';

interface CallStackPanelProps {
  debugEngine: VB6DebugEngine;
  isDebugging: boolean;
  onFrameSelect?: (frame: VB6CallStackFrame) => void;
}

export const CallStackPanel: React.FC<CallStackPanelProps> = ({ 
  debugEngine, 
  isDebugging, 
  onFrameSelect 
}) => {
  const [callStack, setCallStack] = useState<VB6CallStackFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<VB6CallStackFrame | null>(null);
  const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set());

  useEffect(() => {
    const updateCallStack = () => {
      if (isDebugging) {
        const stack = debugEngine.getCallStack();
        setCallStack(stack);
        
        // Auto-select the top frame if none is selected
        if (stack.length > 0 && !selectedFrame) {
          setSelectedFrame(stack[0]);
          onFrameSelect?.(stack[0]);
        }
      } else {
        setCallStack([]);
        setSelectedFrame(null);
      }
    };

    const handleCallStackChanged = (frames: VB6CallStackFrame[]) => {
      setCallStack(frames);
      
      // Update selected frame to top of stack
      if (frames.length > 0) {
        setSelectedFrame(frames[0]);
        onFrameSelect?.(frames[0]);
      }
    };

    // Initial load
    updateCallStack();

    // Event listeners
    debugEngine.on('callStackChanged', handleCallStackChanged);
    debugEngine.on('debugPaused', updateCallStack);
    debugEngine.on('stepOver', updateCallStack);
    debugEngine.on('stepInto', updateCallStack);
    debugEngine.on('stepOut', updateCallStack);
    debugEngine.on('debugStopped', () => {
      setCallStack([]);
      setSelectedFrame(null);
    });

    return () => {
      debugEngine.off('callStackChanged', handleCallStackChanged);
      debugEngine.off('debugPaused', updateCallStack);
      debugEngine.off('stepOver', updateCallStack);
      debugEngine.off('stepInto', updateCallStack);
      debugEngine.off('stepOut', updateCallStack);
      debugEngine.off('debugStopped', () => {
        setCallStack([]);
        setSelectedFrame(null);
      });
    };
  }, [debugEngine, isDebugging, selectedFrame, onFrameSelect]);

  const handleFrameSelect = useCallback((frame: VB6CallStackFrame) => {
    setSelectedFrame(frame);
    onFrameSelect?.(frame);
  }, [onFrameSelect]);

  const toggleFrameExpanded = useCallback((level: number) => {
    setExpandedFrames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  }, []);

  const formatParameterValue = (value: any): string => {
    if (value === null || value === undefined) return 'Nothing';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return '{Object}';
    return String(value);
  };

  const getFrameIcon = (frame: VB6CallStackFrame): string => {
    if (frame.functionName.includes('Form_') || frame.functionName.includes('_Click') || frame.functionName.includes('_Change')) {
      return '🎯'; // Event handler
    }
    if (frame.functionName === 'Main') {
      return '🚀'; // Main entry point
    }
    if (frame.functionName.includes('Sub') || frame.functionName.includes('Function')) {
      return '📦'; // Function/Sub
    }
    return '⚙️'; // Generic function
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200">
      {/* Header */}
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Call Stack</h3>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-1 rounded ${
            isDebugging ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {isDebugging ? 'Active' : 'Inactive'}
          </span>
          {callStack.length > 0 && (
            <span className="text-xs text-gray-500">
              {callStack.length} frame{callStack.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Call Stack */}
      <div className="flex-1 overflow-y-auto">
        {!isDebugging ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            Start debugging to view the call stack.
          </div>
        ) : callStack.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            No call stack available.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {callStack.map((frame, index) => (
              <div
                key={frame.level}
                className={`p-2 cursor-pointer hover:bg-gray-50 ${
                  selectedFrame?.level === frame.level ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleFrameSelect(frame)}
              >
                <div className="flex items-center gap-2">
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFrameExpanded(frame.level);
                    }}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    {expandedFrames.has(frame.level) ? '▼' : '▶'}
                  </button>
                  
                  {/* Frame Icon */}
                  <span className="text-sm">{getFrameIcon(frame)}</span>
                  
                  {/* Frame Level */}
                  <span className="text-xs text-gray-500 font-mono w-6">
                    #{frame.level}
                  </span>
                  
                  {/* Function Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-blue-600 font-medium truncate">
                      {frame.functionName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {frame.module} • {frame.filename}:{frame.line}:{frame.column}
                    </div>
                  </div>
                  
                  {/* Current Frame Indicator */}
                  {index === 0 && (
                    <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Current
                    </span>
                  )}
                </div>
                
                {/* Expanded Content */}
                {expandedFrames.has(frame.level) && (
                  <div className="mt-2 ml-8 space-y-2">
                    {/* Parameters */}
                    {frame.parameters.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Parameters:</div>
                        <div className="space-y-1">
                          {frame.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-blue-600">{param.name}</span>
                                <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                                  {param.type}
                                </span>
                                <span className={`px-1 py-0.5 rounded text-xs ${
                                  param.scope === 'Local' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {param.scope}
                                </span>
                              </div>
                              <div className="font-mono text-gray-900">
                                {formatParameterValue(param.value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Local Variables */}
                    {frame.locals.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Locals ({frame.locals.length}):
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {frame.locals.slice(0, 5).map((local, localIndex) => (
                            <div key={localIndex} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-purple-600">{local.name}</span>
                                <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                                  {local.type}
                                </span>
                              </div>
                              <div className="font-mono text-gray-900 truncate max-w-32">
                                {formatParameterValue(local.value)}
                              </div>
                            </div>
                          ))}
                          {frame.locals.length > 5 && (
                            <div className="text-xs text-gray-500 italic">
                              ... and {frame.locals.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Location Information */}
                    <div className="pt-1 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Location:</span> {frame.filename}:{frame.line}:{frame.column}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Module:</span> {frame.module}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            {selectedFrame ? (
              <>Current: {selectedFrame.functionName}</>
            ) : (
              <>No frame selected</>
            )}
          </div>
          {isDebugging && callStack.length > 0 && (
            <div>
              Stack depth: {callStack.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallStackPanel;