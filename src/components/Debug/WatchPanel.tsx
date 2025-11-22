import React, { useState, useEffect, useCallback } from 'react';
import { VB6DebugEngine, VB6WatchExpression, DebugState } from '../../services/VB6DebugEngine';

interface WatchPanelProps {
  debugEngine: VB6DebugEngine;
  isDebugging: boolean;
}

export const WatchPanel: React.FC<WatchPanelProps> = ({ debugEngine, isDebugging }) => {
  const [watchExpressions, setWatchExpressions] = useState<VB6WatchExpression[]>([]);
  const [newExpression, setNewExpression] = useState('');
  const [editingWatch, setEditingWatch] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const updateWatches = () => {
      const session = debugEngine.getActiveSession();
      if (session) {
        setWatchExpressions([...session.watchExpressions]);
      }
    };

    const handleWatchAdded = (watch: VB6WatchExpression) => {
      setWatchExpressions(prev => [...prev, watch]);
    };

    const handleWatchRemoved = (watchId: string) => {
      setWatchExpressions(prev => prev.filter(w => w.id !== watchId));
    };

    const handleWatchUpdated = (watch: VB6WatchExpression) => {
      setWatchExpressions(prev => prev.map(w => w.id === watch.id ? watch : w));
    };

    const handleWatchExpressionsUpdated = (watches: VB6WatchExpression[]) => {
      setWatchExpressions([...watches]);
    };

    // Initial load
    updateWatches();

    // Event listeners
    debugEngine.on('watchAdded', handleWatchAdded);
    debugEngine.on('watchRemoved', handleWatchRemoved);
    debugEngine.on('watchUpdated', handleWatchUpdated);
    debugEngine.on('watchExpressionsUpdated', handleWatchExpressionsUpdated);
    debugEngine.on('debugPaused', updateWatches);
    debugEngine.on('stepOver', updateWatches);
    debugEngine.on('stepInto', updateWatches);
    debugEngine.on('stepOut', updateWatches);

    return () => {
      debugEngine.off('watchAdded', handleWatchAdded);
      debugEngine.off('watchRemoved', handleWatchRemoved);
      debugEngine.off('watchUpdated', handleWatchUpdated);
      debugEngine.off('watchExpressionsUpdated', handleWatchExpressionsUpdated);
      debugEngine.off('debugPaused', updateWatches);
      debugEngine.off('stepOver', updateWatches);
      debugEngine.off('stepInto', updateWatches);
      debugEngine.off('stepOut', updateWatches);
    };
  }, [debugEngine]);

  const handleAddWatch = useCallback(() => {
    if (!newExpression.trim()) return;
    
    try {
      debugEngine.addWatchExpression(newExpression.trim());
      setNewExpression('');
    } catch (error) {
      console.error('Error adding watch expression:', error);
    }
  }, [debugEngine, newExpression]);

  const handleRemoveWatch = useCallback((watchId: string) => {
    debugEngine.removeWatchExpression(watchId);
  }, [debugEngine]);

  const handleEditWatch = useCallback((watch: VB6WatchExpression) => {
    setEditingWatch(watch.id);
    setEditValue(watch.expression);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingWatch && editValue.trim()) {
      debugEngine.updateWatchExpression(editingWatch, editValue.trim());
    }
    setEditingWatch(null);
    setEditValue('');
  }, [debugEngine, editingWatch, editValue]);

  const handleCancelEdit = useCallback(() => {
    setEditingWatch(null);
    setEditValue('');
  }, []);

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) {
      return 'Nothing';
    }
    
    switch (type) {
      case 'String':
        return `"${value}"`;
      case 'Boolean':
        return value ? 'True' : 'False';
      case 'Date':
        return value instanceof Date ? value.toLocaleString() : String(value);
      case 'Array':
        return Array.isArray(value) ? `Array(${value.length})` : String(value);
      case 'Object':
        return typeof value === 'object' ? '{Object}' : String(value);
      default:
        return String(value);
    }
  };

  const getValueClass = (isValid: boolean, hasError: boolean): string => {
    if (hasError) return 'text-red-600';
    if (!isValid) return 'text-gray-400';
    return 'text-gray-900';
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200">
      {/* Header */}
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Watch</h3>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-1 rounded ${
            isDebugging ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {isDebugging ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Add New Watch */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex gap-1">
          <input
            type="text"
            value={newExpression}
            onChange={(e) => setNewExpression(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddWatch();
              }
            }}
            placeholder="Enter expression to watch..."
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            disabled={!isDebugging}
          />
          <button
            onClick={handleAddWatch}
            disabled={!isDebugging || !newExpression.trim()}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Watch Expressions */}
      <div className="flex-1 overflow-y-auto">
        {watchExpressions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            No watch expressions.
            {isDebugging ? ' Add an expression above.' : ' Start debugging to add expressions.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {watchExpressions.map((watch) => (
              <div
                key={watch.id}
                className="p-2 hover:bg-gray-50 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    {editingWatch === watch.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-1 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-1 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="font-mono text-xs text-blue-600 cursor-pointer hover:text-blue-800 truncate"
                        onClick={() => handleEditWatch(watch)}
                        title={watch.expression}
                      >
                        {watch.expression}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleEditWatch(watch)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Edit expression"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleRemoveWatch(watch.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Remove watch"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                      {watch.type}
                    </span>
                    {!watch.isValid && (
                      <span className="px-1 py-0.5 bg-red-100 text-red-600 rounded">
                        Error
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={`mt-1 font-mono text-xs ${getValueClass(watch.isValid, !!watch.error)}`}>
                  {watch.error ? (
                    <span title={watch.error}>❌ {watch.error}</span>
                  ) : (
                    <span title={String(watch.value)}>
                      {formatValue(watch.value, watch.type)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        {watchExpressions.length} expression{watchExpressions.length !== 1 ? 's' : ''}
        {isDebugging && (
          <span className="ml-2">• Live evaluation enabled</span>
        )}
      </div>
    </div>
  );
};

export default WatchPanel;