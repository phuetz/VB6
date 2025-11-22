import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Eye, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Settings,
  Copy,
  Pin,
  PinOff,
  Square,
  Circle
} from 'lucide-react';

interface WatchExpression {
  id: string;
  expression: string;
  value: any;
  type: string;
  error?: string;
  context: string;
  enabled: boolean;
  pinned: boolean;
  lastChanged?: Date;
  changeCount: number;
  breakOnChange: boolean;
  expandedPath: string[];
}

interface WatchContext {
  name: string;
  scope: 'global' | 'local' | 'module';
  variables: Map<string, any>;
}

interface WatchWindowProps {
  visible: boolean;
  onClose?: () => void;
  onAddWatch?: (expression: string) => void;
  onRemoveWatch?: (id: string) => void;
  onEvaluateExpression?: (expression: string, context: string) => any;
  contexts?: WatchContext[];
  currentContext?: string;
}

const WatchWindow: React.FC<WatchWindowProps> = ({
  visible,
  onClose,
  onAddWatch,
  onRemoveWatch,
  onEvaluateExpression,
  contexts = [],
  currentContext = 'global'
}) => {
  const [watches, setWatches] = useState<WatchExpression[]>([]);
  const [newExpression, setNewExpression] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExpression, setEditingExpression] = useState('');
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'value' | 'changed'>('name');

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sample variables for demonstration
  const [sampleVariables] = useState<Map<string, any>>(new Map([
    ['x', 42],
    ['userName', 'John Doe'],
    ['isActive', true],
    ['startDate', new Date()],
    ['items', ['apple', 'banana', 'cherry']],
    ['userInfo', { name: 'John', age: 30, email: 'john@example.com' }],
    ['pi', 3.14159],
    ['counter', 0]
  ]));

  // Generate unique ID for new watch
  const generateId = useCallback(() => {
    return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Evaluate expression
  const evaluateExpression = useCallback((expression: string, context: string = currentContext): any => {
    try {
      // Use external evaluator if provided
      if (onEvaluateExpression) {
        return onEvaluateExpression(expression, context);
      }

      // Simple built-in evaluator using sample variables
      const trimmed = expression.trim();
      
      // Direct variable access
      if (sampleVariables.has(trimmed)) {
        return sampleVariables.get(trimmed);
      }

      // Object property access
      const propertyMatch = trimmed.match(/^(\w+)\.(\w+)$/);
      if (propertyMatch) {
        const [, objName, propName] = propertyMatch;
        const obj = sampleVariables.get(objName);
        if (obj && typeof obj === 'object' && propName in obj) {
          return obj[propName];
        }
      }

      // Array access
      const arrayMatch = trimmed.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        const array = sampleVariables.get(arrayName);
        const index = parseInt(indexStr, 10);
        if (Array.isArray(array) && index >= 0 && index < array.length) {
          return array[index];
        }
      }

      // Function calls
      if (trimmed.includes('(')) {
        const funcMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
        if (funcMatch) {
          const [, funcName, argsStr] = funcMatch;
          const args = argsStr ? argsStr.split(',').map(arg => evaluateExpression(arg.trim(), context)) : [];
          
          // Built-in functions
          switch (funcName.toLowerCase()) {
            case 'len':
              return args[0] ? String(args[0]).length : 0;
            case 'ucase':
              return args[0] ? String(args[0]).toUpperCase() : '';
            case 'lcase':
              return args[0] ? String(args[0]).toLowerCase() : '';
            case 'now':
              return new Date();
            case 'rnd':
              return Math.random();
            case 'int':
              return Math.floor(Number(args[0]) || 0);
            case 'abs':
              return Math.abs(Number(args[0]) || 0);
            default:
              throw new Error(`Function '${funcName}' not found`);
          }
        }
      }

      // Arithmetic expressions (very basic)
      if (/^[\d\s+*/().-]+$/.test(trimmed)) {
        try {
          return Function(`"use strict"; return (${trimmed})`)();
        } catch {
          throw new Error('Invalid arithmetic expression');
        }
      }

      // String literals
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }

      // Numeric literals
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue)) {
        return numValue;
      }

      // Boolean literals
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;

      throw new Error(`Expression '${expression}' could not be evaluated`);
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }, [onEvaluateExpression, currentContext, sampleVariables]);

  // Get VB6 type name
  const getVB6Type = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'Nothing';
    
    switch (typeof value) {
      case 'string': return 'String';
      case 'number': 
        if (Number.isInteger(value)) {
          if (value >= -32768 && value <= 32767) return 'Integer';
          return 'Long';
        }
        return 'Double';
      case 'boolean': return 'Boolean';
      case 'object':
        if (value instanceof Date) return 'Date';
        if (Array.isArray(value)) return `Array(${value.length})`;
        return 'Object';
      default: return 'Variant';
    }
  }, []);

  // Format value for display
  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'Nothing';
    if (typeof value === 'string') return `"${value}"`;
    if (value instanceof Date) return value.toLocaleString();
    if (Array.isArray(value)) return `Array(${value.length}) [${value.slice(0, 3).map(v => formatValue(v)).join(', ')}${value.length > 3 ? '...' : ''}]`;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      return `{${keys.slice(0, 2).map(k => `${k}: ${formatValue(value[k])}`).join(', ')}${keys.length > 2 ? '...' : ''}}`;
    }
    return String(value);
  }, []);

  // Add new watch
  const addWatch = useCallback((expression: string) => {
    if (!expression.trim()) return;

    const id = generateId();
    const newWatch: WatchExpression = {
      id,
      expression: expression.trim(),
      value: undefined,
      type: '',
      context: currentContext,
      enabled: true,
      pinned: false,
      changeCount: 0,
      breakOnChange: false,
      expandedPath: []
    };

    // Evaluate initial value
    try {
      newWatch.value = evaluateExpression(expression.trim(), currentContext);
      newWatch.type = getVB6Type(newWatch.value);
    } catch (error) {
      newWatch.error = error instanceof Error ? error.message : String(error);
      newWatch.type = 'Error';
    }

    setWatches(prev => [...prev, newWatch]);
    
    if (onAddWatch) {
      onAddWatch(expression.trim());
    }
  }, [generateId, currentContext, evaluateExpression, getVB6Type, onAddWatch]);

  // Remove watch
  const removeWatch = useCallback((id: string) => {
    setWatches(prev => prev.filter(w => w.id !== id));
    
    if (onRemoveWatch) {
      onRemoveWatch(id);
    }
  }, [onRemoveWatch]);

  // Update watch expression
  const updateWatch = useCallback((id: string, newExpression: string) => {
    setWatches(prev => prev.map(watch => {
      if (watch.id === id) {
        const updated = { ...watch, expression: newExpression };
        
        try {
          const newValue = evaluateExpression(newExpression, watch.context);
          const valueChanged = JSON.stringify(updated.value) !== JSON.stringify(newValue);
          
          updated.value = newValue;
          updated.type = getVB6Type(newValue);
          updated.error = undefined;
          
          if (valueChanged) {
            updated.lastChanged = new Date();
            updated.changeCount++;
          }
        } catch (error) {
          updated.error = error instanceof Error ? error.message : String(error);
          updated.type = 'Error';
        }
        
        return updated;
      }
      return watch;
    }));
  }, [evaluateExpression, getVB6Type]);

  // Refresh all watches
  const refreshWatches = useCallback(() => {
    setWatches(prev => prev.map(watch => {
      if (!watch.enabled) return watch;

      try {
        const newValue = evaluateExpression(watch.expression, watch.context);
        const valueChanged = JSON.stringify(watch.value) !== JSON.stringify(newValue);
        
        const updated = {
          ...watch,
          value: newValue,
          type: getVB6Type(newValue),
          error: undefined
        };
        
        if (valueChanged) {
          updated.lastChanged = new Date();
          updated.changeCount++;
        }
        
        return updated;
      } catch (error) {
        return {
          ...watch,
          error: error instanceof Error ? error.message : String(error),
          type: 'Error'
        };
      }
    }));
  }, [evaluateExpression, getVB6Type]);

  // Toggle watch enabled state
  const toggleWatch = useCallback((id: string) => {
    setWatches(prev => prev.map(watch => 
      watch.id === id ? { ...watch, enabled: !watch.enabled } : watch
    ));
  }, []);

  // Toggle watch pinned state
  const togglePin = useCallback((id: string) => {
    setWatches(prev => prev.map(watch => 
      watch.id === id ? { ...watch, pinned: !watch.pinned } : watch
    ));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newExpression.trim()) {
      addWatch(newExpression);
      setNewExpression('');
    }
  }, [newExpression, addWatch]);

  // Handle edit submission
  const handleEditSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editingExpression.trim()) {
      updateWatch(editingId, editingExpression);
      setEditingId(null);
      setEditingExpression('');
    }
  }, [editingId, editingExpression, updateWatch]);

  // Start editing
  const startEdit = useCallback((watch: WatchExpression) => {
    setEditingId(watch.id);
    setEditingExpression(watch.expression);
  }, []);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingExpression('');
  }, []);

  // Filter watches
  const filteredWatches = useMemo(() => {
    let filtered = watches;

    if (searchTerm) {
      filtered = filtered.filter(watch => 
        watch.expression.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatValue(watch.value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showOnlyErrors) {
      filtered = filtered.filter(watch => !!watch.error);
    }

    if (showOnlyChanged) {
      filtered = filtered.filter(watch => watch.changeCount > 0);
    }

    // Sort watches
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.expression.localeCompare(b.expression);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'value':
          return formatValue(a.value).localeCompare(formatValue(b.value));
        case 'changed':
          return (b.changeCount || 0) - (a.changeCount || 0);
        default:
          return 0;
      }
    });

    // Pinned items first
    return [...filtered.filter(w => w.pinned), ...filtered.filter(w => !w.pinned)];
  }, [watches, searchTerm, showOnlyErrors, showOnlyChanged, sortBy, formatValue]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && visible) {
      refreshTimerRef.current = setInterval(refreshWatches, refreshInterval);
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [autoRefresh, visible, refreshWatches, refreshInterval]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Copy watch to clipboard
  const copyWatch = useCallback((watch: WatchExpression) => {
    const text = `${watch.expression} = ${formatValue(watch.value)} (${watch.type})`;
    navigator.clipboard.writeText(text);
  }, [formatValue]);

  if (!visible) return null;

  return (
    <div className="bg-white border border-gray-300 flex flex-col h-80">
      {/* Title Bar */}
      <div className="bg-gray-100 border-b px-3 py-1 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-green-600" />
          <span className="font-medium text-sm">Watch Window</span>
          <span className="text-xs text-gray-500">({filteredWatches.length} items)</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded ${autoRefresh ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200'}`}
            title={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={refreshWatches}
            className="p-1 hover:bg-gray-200 rounded"
            title="Refresh Now"
          >
            <RefreshCw size={14} />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-gray-50 px-3 py-2 flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search watches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`text-xs px-2 py-1 rounded ${showOnlyErrors ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}
          >
            Errors Only
          </button>
          
          <button
            onClick={() => setShowOnlyChanged(!showOnlyChanged)}
            className={`text-xs px-2 py-1 rounded ${showOnlyChanged ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
          >
            Changed Only
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-1 py-1"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="value">Sort by Value</option>
            <option value="changed">Sort by Changed</option>
          </select>
        </div>
      </div>

      {/* Add Watch Form */}
      <form onSubmit={handleSubmit} className="border-b bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-blue-600" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter expression to watch (e.g., x, userName, items[0], userInfo.name)"
            value={newExpression}
            onChange={(e) => setNewExpression(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
          />
          <button
            type="submit"
            disabled={!newExpression.trim()}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      {/* Watch List */}
      <div className="flex-1 overflow-auto">
        {filteredWatches.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Eye size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No watch expressions</p>
            <p className="text-xs text-gray-400 mt-1">Add expressions above to monitor their values</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredWatches.map((watch) => (
              <div 
                key={watch.id} 
                className={`p-2 hover:bg-gray-50 ${selectedWatchId === watch.id ? 'bg-blue-50' : ''} ${!watch.enabled ? 'opacity-50' : ''}`}
                onClick={() => setSelectedWatchId(watch.id)}
              >
                <div className="flex items-start gap-2">
                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatch(watch.id);
                    }}
                    className="mt-0.5"
                  >
                    {watch.enabled ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <Circle size={14} className="text-gray-400" />
                    )}
                  </button>

                  {/* Expression and Value */}
                  <div className="flex-1 min-w-0">
                    {editingId === watch.id ? (
                      <form onSubmit={handleEditSubmit} className="flex gap-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingExpression}
                          onChange={(e) => setEditingExpression(e.target.value)}
                          className="flex-1 text-sm border border-blue-300 rounded px-2 py-1"
                        />
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-xs px-2 py-1 bg-gray-300 rounded"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{watch.expression}</span>
                          {watch.pinned && <Pin size={12} className="text-blue-500" />}
                          {watch.changeCount > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                              {watch.changeCount}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-1 rounded">
                            {watch.type}
                          </span>
                          
                          {watch.error ? (
                            <span className="text-red-600 text-sm flex items-center gap-1">
                              <AlertTriangle size={14} />
                              {watch.error}
                            </span>
                          ) : (
                            <span className="text-gray-700 text-sm font-mono">
                              {formatValue(watch.value)}
                            </span>
                          )}
                        </div>
                        
                        {watch.lastChanged && (
                          <div className="text-xs text-gray-500 mt-1">
                            Changed: {watch.lastChanged.toLocaleTimeString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== watch.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(watch.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={watch.pinned ? 'Unpin' : 'Pin'}
                      >
                        {watch.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyWatch(watch);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(watch);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit"
                      >
                        <Edit3 size={12} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWatch(watch.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-red-600"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t bg-gray-100 px-3 py-1 text-xs text-gray-600 flex justify-between">
        <span>
          {watches.filter(w => w.enabled).length} active, {watches.filter(w => w.error).length} errors, {watches.filter(w => w.changeCount > 0).length} changed
        </span>
        <span>
          {autoRefresh ? `Auto-refresh: ${refreshInterval}ms` : 'Manual refresh'}
        </span>
      </div>
    </div>
  );
};

export default WatchWindow;