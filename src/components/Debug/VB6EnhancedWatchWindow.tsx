/**
 * VB6 Enhanced Watch Window
 * Advanced debugging watch window with VB6-style features
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WatchExpression {
  id: string;
  expression: string;
  value: any;
  type: string;
  error?: string;
  context: WatchContext;
  enabled: boolean;
  pinned: boolean;
  lastChanged?: Date;
  changeCount: number;
  breakOnChange: boolean;
  breakCondition?: string;
  group?: string;
  expandedPaths: Set<string>;
  children?: WatchChild[];
}

export interface WatchChild {
  name: string;
  path: string;
  value: any;
  type: string;
  isExpandable: boolean;
  children?: WatchChild[];
}

export type WatchContext = 'global' | 'local' | 'module' | 'form' | 'class';

export interface WatchGroup {
  name: string;
  color: string;
  collapsed: boolean;
}

export interface QuickWatchResult {
  expression: string;
  value: any;
  type: string;
  error?: string;
  children?: WatchChild[];
}

export interface WatchWindowState {
  watches: WatchExpression[];
  groups: WatchGroup[];
  expressionHistory: string[];
}

interface VB6EnhancedWatchWindowProps {
  visible: boolean;
  onClose?: () => void;
  onEvaluateExpression?: (expression: string, context: WatchContext) => any;
  onBreakpointTriggered?: (watch: WatchExpression) => void;
  debugContext?: {
    localVariables: Map<string, any>;
    moduleVariables: Map<string, any>;
    globalVariables: Map<string, any>;
    callStack: string[];
  };
  initialState?: Partial<WatchWindowState>;
  onStateChange?: (state: WatchWindowState) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_GROUPS: WatchGroup[] = [
  { name: 'Watch 1', color: '#4A90D9', collapsed: false },
  { name: 'Watch 2', color: '#50C878', collapsed: false },
  { name: 'Watch 3', color: '#FFB347', collapsed: false },
  { name: 'Watch 4', color: '#FF6B6B', collapsed: false }
];

const VB6_TYPE_COLORS: Record<string, string> = {
  String: '#A31515',
  Integer: '#098658',
  Long: '#098658',
  Single: '#098658',
  Double: '#098658',
  Currency: '#098658',
  Date: '#800080',
  Boolean: '#0000FF',
  Object: '#2B91AF',
  Array: '#2B91AF',
  Nothing: '#808080',
  Variant: '#000000',
  Error: '#FF0000'
};

// ============================================================================
// VB6 Enhanced Watch Window Component
// ============================================================================

export const VB6EnhancedWatchWindow: React.FC<VB6EnhancedWatchWindowProps> = ({
  visible,
  onClose,
  onEvaluateExpression,
  onBreakpointTriggered,
  debugContext,
  initialState,
  onStateChange
}) => {
  // State
  const [watches, setWatches] = useState<WatchExpression[]>(initialState?.watches || []);
  const [groups, setGroups] = useState<WatchGroup[]>(initialState?.groups || DEFAULT_GROUPS);
  const [expressionHistory, setExpressionHistory] = useState<string[]>(initialState?.expressionHistory || []);
  const [newExpression, setNewExpression] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Watch 1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickWatch, setShowQuickWatch] = useState(false);
  const [quickWatchExpression, setQuickWatchExpression] = useState('');
  const [quickWatchResult, setQuickWatchResult] = useState<QuickWatchResult | null>(null);
  const [contextFilter, setContextFilter] = useState<WatchContext | 'all'>('all');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draggedWatchId, setDraggedWatchId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const quickWatchInputRef = useRef<HTMLInputElement>(null);

  // Sample variables for demonstration when no debug context is provided
  const sampleVariables = useMemo(() => new Map<string, any>([
    ['x', 42],
    ['userName', 'John Doe'],
    ['isActive', true],
    ['startDate', new Date()],
    ['items', ['apple', 'banana', 'cherry']],
    ['userInfo', { name: 'John', age: 30, email: 'john@example.com', address: { city: 'NYC', zip: '10001' } }],
    ['pi', 3.14159],
    ['counter', 0],
    ['records', [
      { id: 1, name: 'Item 1', price: 19.99 },
      { id: 2, name: 'Item 2', price: 29.99 },
      { id: 3, name: 'Item 3', price: 39.99 }
    ]],
    ['matrix', [[1, 2, 3], [4, 5, 6], [7, 8, 9]]]
  ]), []);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

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
        if (Array.isArray(value)) return `Variant(${value.length})`;
        return 'Object';
      default: return 'Variant';
    }
  }, []);

  // Check if value is expandable
  const isExpandable = useCallback((value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value !== 'object') return false;
    if (value instanceof Date) return false;
    return true;
  }, []);

  // Get children of a value
  const getChildren = useCallback((value: any, parentPath: string): WatchChild[] => {
    if (!isExpandable(value)) return [];

    if (Array.isArray(value)) {
      return value.map((item, index) => ({
        name: `(${index})`,
        path: `${parentPath}[${index}]`,
        value: item,
        type: getVB6Type(item),
        isExpandable: isExpandable(item)
      }));
    }

    return Object.entries(value).map(([key, val]) => ({
      name: key,
      path: `${parentPath}.${key}`,
      value: val,
      type: getVB6Type(val),
      isExpandable: isExpandable(val)
    }));
  }, [getVB6Type, isExpandable]);

  // Evaluate expression
  const evaluateExpression = useCallback((expression: string, context: WatchContext = 'global'): any => {
    try {
      if (onEvaluateExpression) {
        return onEvaluateExpression(expression, context);
      }

      const variables = debugContext?.globalVariables || sampleVariables;
      const trimmed = expression.trim();

      // Direct variable access
      if (variables.has(trimmed)) {
        return variables.get(trimmed);
      }

      // Property path access (e.g., userInfo.name.length)
      const pathParts = trimmed.split(/[.\[\]]+/).filter(Boolean);
      if (pathParts.length > 1) {
        let current = variables.get(pathParts[0]);
        for (let i = 1; i < pathParts.length && current !== undefined; i++) {
          const key = pathParts[i];
          if (typeof current === 'object' && current !== null) {
            current = Array.isArray(current) ? current[parseInt(key)] : current[key];
          } else {
            throw new Error(`Cannot access property '${key}'`);
          }
        }
        return current;
      }

      // Function calls
      const funcMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
      if (funcMatch) {
        const [, funcName, argsStr] = funcMatch;
        const args = argsStr ? argsStr.split(',').map(arg => evaluateExpression(arg.trim(), context)) : [];

        switch (funcName.toLowerCase()) {
          case 'len': return args[0] ? String(args[0]).length : 0;
          case 'ucase': return args[0] ? String(args[0]).toUpperCase() : '';
          case 'lcase': return args[0] ? String(args[0]).toLowerCase() : '';
          case 'left': return String(args[0] || '').substring(0, Number(args[1]) || 0);
          case 'right': return String(args[0] || '').slice(-(Number(args[1]) || 0));
          case 'mid': return String(args[0] || '').substring((Number(args[1]) || 1) - 1, (Number(args[1]) || 1) - 1 + (Number(args[2]) || String(args[0]).length));
          case 'now': return new Date();
          case 'date': return new Date().toLocaleDateString();
          case 'time': return new Date().toLocaleTimeString();
          case 'rnd': return Math.random();
          case 'int': return Math.floor(Number(args[0]) || 0);
          case 'fix': return Math.trunc(Number(args[0]) || 0);
          case 'abs': return Math.abs(Number(args[0]) || 0);
          case 'sgn': return Math.sign(Number(args[0]) || 0);
          case 'sqr': return Math.sqrt(Number(args[0]) || 0);
          case 'typename': return getVB6Type(args[0]);
          case 'isarray': return Array.isArray(args[0]);
          case 'isnumeric': return !isNaN(Number(args[0]));
          case 'isdate': return args[0] instanceof Date || !isNaN(Date.parse(String(args[0])));
          case 'isnull': return args[0] === null;
          case 'isempty': return args[0] === undefined || args[0] === '';
          case 'isobject': return typeof args[0] === 'object' && args[0] !== null;
          case 'ubound': return Array.isArray(args[0]) ? args[0].length - 1 : -1;
          case 'lbound': return 0;
          case 'array': return args;
          case 'asc': return String(args[0]).charCodeAt(0);
          case 'chr': return String.fromCharCode(Number(args[0]));
          case 'hex': return Number(args[0]).toString(16).toUpperCase();
          case 'oct': return Number(args[0]).toString(8);
          case 'str': return String(args[0]);
          case 'val': return parseFloat(String(args[0])) || 0;
          case 'cint': return Math.round(Number(args[0]) || 0);
          case 'clng': return Math.round(Number(args[0]) || 0);
          case 'cdbl': return Number(args[0]) || 0;
          case 'cstr': return String(args[0]);
          case 'cbool': return Boolean(args[0]);
          default: throw new Error(`Function '${funcName}' not found`);
        }
      }

      // Comparison expressions
      const comparisonMatch = trimmed.match(/^(.+?)\s*(=|<>|<|>|<=|>=)\s*(.+)$/);
      if (comparisonMatch) {
        const [, left, op, right] = comparisonMatch;
        const leftVal = evaluateExpression(left.trim(), context);
        const rightVal = evaluateExpression(right.trim(), context);
        switch (op) {
          case '=': return leftVal === rightVal;
          case '<>': return leftVal !== rightVal;
          case '<': return leftVal < rightVal;
          case '>': return leftVal > rightVal;
          case '<=': return leftVal <= rightVal;
          case '>=': return leftVal >= rightVal;
        }
      }

      // Arithmetic expressions
      if (/^[\d\s+*/().-]+$/.test(trimmed)) {
        return Function(`"use strict"; return (${trimmed})`)();
      }

      // String literals
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }

      // Numeric literals
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue)) return numValue;

      // Boolean literals
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;
      if (trimmed.toLowerCase() === 'nothing') return null;

      throw new Error(`Cannot evaluate '${expression}'`);
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }, [onEvaluateExpression, debugContext, sampleVariables, getVB6Type]);

  // Format value for display
  const formatValue = useCallback((value: any, depth: number = 0): string => {
    if (value === null || value === undefined) return 'Nothing';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (value instanceof Date) return `#${value.toLocaleDateString()} ${value.toLocaleTimeString()}#`;
    if (Array.isArray(value)) {
      if (depth > 0) return `Array(${value.length})`;
      return `(${value.slice(0, 3).map(v => formatValue(v, depth + 1)).join(', ')}${value.length > 3 ? ', ...' : ''})`;
    }
    if (typeof value === 'object') {
      if (depth > 0) return '{Object}';
      const keys = Object.keys(value);
      return `{${keys.slice(0, 2).map(k => `${k}=${formatValue(value[k], depth + 1)}`).join(', ')}${keys.length > 2 ? ', ...' : ''}}`;
    }
    return String(value);
  }, []);

  // Add watch
  const addWatch = useCallback((expression: string, group?: string) => {
    if (!expression.trim()) return;

    const id = generateId();
    const newWatch: WatchExpression = {
      id,
      expression: expression.trim(),
      value: undefined,
      type: '',
      context: 'global',
      enabled: true,
      pinned: false,
      changeCount: 0,
      breakOnChange: false,
      group: group || selectedGroup,
      expandedPaths: new Set()
    };

    try {
      newWatch.value = evaluateExpression(expression.trim(), 'global');
      newWatch.type = getVB6Type(newWatch.value);
      if (isExpandable(newWatch.value)) {
        newWatch.children = getChildren(newWatch.value, expression.trim());
      }
    } catch (error) {
      newWatch.error = error instanceof Error ? error.message : String(error);
      newWatch.type = 'Error';
    }

    setWatches(prev => [...prev, newWatch]);

    // Add to history
    setExpressionHistory(prev => {
      const filtered = prev.filter(e => e !== expression.trim());
      return [expression.trim(), ...filtered].slice(0, 50);
    });

    // Notify state change
    if (onStateChange) {
      onStateChange({ watches: [...watches, newWatch], groups, expressionHistory });
    }
  }, [generateId, selectedGroup, evaluateExpression, getVB6Type, isExpandable, getChildren, watches, groups, expressionHistory, onStateChange]);

  // Remove watch
  const removeWatch = useCallback((id: string) => {
    setWatches(prev => prev.filter(w => w.id !== id));
  }, []);

  // Refresh watches
  const refreshWatches = useCallback(() => {
    setWatches(prev => prev.map(watch => {
      if (!watch.enabled) return watch;

      try {
        const newValue = evaluateExpression(watch.expression, watch.context);
        const valueChanged = JSON.stringify(watch.value) !== JSON.stringify(newValue);

        const updated: WatchExpression = {
          ...watch,
          value: newValue,
          type: getVB6Type(newValue),
          error: undefined
        };

        if (isExpandable(newValue)) {
          updated.children = getChildren(newValue, watch.expression);
        }

        if (valueChanged) {
          updated.lastChanged = new Date();
          updated.changeCount++;

          // Check break condition
          if (watch.breakOnChange) {
            if (!watch.breakCondition || evaluateExpression(watch.breakCondition, watch.context)) {
              onBreakpointTriggered?.(updated);
            }
          }
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
  }, [evaluateExpression, getVB6Type, isExpandable, getChildren, onBreakpointTriggered]);

  // Toggle expansion
  const toggleExpansion = useCallback((watchId: string, path: string) => {
    setWatches(prev => prev.map(watch => {
      if (watch.id !== watchId) return watch;

      const newExpanded = new Set(watch.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }

      return { ...watch, expandedPaths: newExpanded };
    }));
  }, []);

  // Quick watch
  const performQuickWatch = useCallback(() => {
    if (!quickWatchExpression.trim()) {
      setQuickWatchResult(null);
      return;
    }

    try {
      const value = evaluateExpression(quickWatchExpression.trim(), 'global');
      setQuickWatchResult({
        expression: quickWatchExpression.trim(),
        value,
        type: getVB6Type(value),
        children: isExpandable(value) ? getChildren(value, quickWatchExpression.trim()) : undefined
      });
    } catch (error) {
      setQuickWatchResult({
        expression: quickWatchExpression.trim(),
        value: undefined,
        type: 'Error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [quickWatchExpression, evaluateExpression, getVB6Type, isExpandable, getChildren]);

  // Handle keyboard in expression input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' && expressionHistory.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, expressionHistory.length - 1);
      setHistoryIndex(newIndex);
      setNewExpression(expressionHistory[newIndex]);
    } else if (e.key === 'ArrowDown' && historyIndex > -1) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNewExpression(newIndex >= 0 ? expressionHistory[newIndex] : '');
    }
  }, [expressionHistory, historyIndex]);

  // Auto refresh
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(refreshWatches, 1000);
    return () => clearInterval(interval);
  }, [visible, refreshWatches]);

  // Focus quick watch input
  useEffect(() => {
    if (showQuickWatch && quickWatchInputRef.current) {
      quickWatchInputRef.current.focus();
    }
  }, [showQuickWatch]);

  // Filtered watches
  const filteredWatches = useMemo(() => {
    let result = watches;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(w =>
        w.expression.toLowerCase().includes(term) ||
        formatValue(w.value).toLowerCase().includes(term)
      );
    }

    if (contextFilter !== 'all') {
      result = result.filter(w => w.context === contextFilter);
    }

    return result;
  }, [watches, searchTerm, contextFilter, formatValue]);

  // Render watch tree node
  const renderWatchNode = useCallback((
    watch: WatchExpression,
    child: WatchChild | null,
    depth: number
  ): React.ReactNode => {
    const item = child || { name: watch.expression, path: watch.expression, value: watch.value, type: watch.type, isExpandable: isExpandable(watch.value) };
    const isExpanded = watch.expandedPaths.has(item.path);
    const children = item.isExpandable ? getChildren(item.value, item.path) : [];
    const indent = depth * 16;

    return (
      <React.Fragment key={item.path}>
        <div
          style={{ paddingLeft: `${indent + 4}px` }}
          className={`flex items-center py-1 hover:bg-gray-100 cursor-pointer ${
            selectedWatchId === watch.id && !child ? 'bg-blue-100' : ''
          }`}
          onClick={() => !child && setSelectedWatchId(watch.id)}
        >
          {/* Expand/Collapse */}
          <div className="w-4 flex-shrink-0">
            {item.isExpandable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(watch.id, item.path);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>

          {/* Name */}
          <span className="font-mono text-sm min-w-[120px]">
            {item.name}
          </span>

          {/* Value */}
          <span
            className="font-mono text-sm flex-1 truncate"
            style={{ color: VB6_TYPE_COLORS[item.type] || '#000000' }}
          >
            {child ? formatValue(item.value) : (watch.error ? watch.error : formatValue(watch.value))}
          </span>

          {/* Type */}
          <span className="text-xs text-gray-500 min-w-[80px] text-right">
            {item.type}
          </span>

          {/* Actions (only for root) */}
          {!child && (
            <div className="flex items-center gap-1 ml-2">
              {watch.pinned && <span className="text-blue-500 text-xs">📌</span>}
              {watch.breakOnChange && <span className="text-red-500 text-xs">🔴</span>}
              {watch.changeCount > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                  {watch.changeCount}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeWatch(watch.id);
                }}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && children.map(c => renderWatchNode(watch, c, depth + 1))}
      </React.Fragment>
    );
  }, [selectedWatchId, toggleExpansion, formatValue, removeWatch, getChildren, isExpandable]);

  // Styles
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: visible ? 'flex' : 'none',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#F0F0F0',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontSize: '12px',
      border: '1px solid #808080'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 8px',
      backgroundColor: '#E0E0E0',
      borderBottom: '1px solid #808080'
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      borderBottom: '1px solid #CCCCCC',
      backgroundColor: '#F8F8F8'
    },
    input: {
      flex: 1,
      padding: '2px 6px',
      border: '1px solid #808080',
      fontSize: '12px',
      fontFamily: 'Consolas, monospace'
    },
    button: {
      padding: '2px 8px',
      border: '1px solid #808080',
      backgroundColor: '#E0E0E0',
      cursor: 'pointer',
      fontSize: '11px'
    },
    groupTabs: {
      display: 'flex',
      borderBottom: '1px solid #808080'
    },
    groupTab: {
      padding: '4px 12px',
      cursor: 'pointer',
      borderRight: '1px solid #808080',
      fontSize: '11px'
    },
    watchList: {
      flex: 1,
      overflow: 'auto',
      backgroundColor: '#FFFFFF'
    },
    watchHeader: {
      display: 'flex',
      padding: '4px 8px',
      backgroundColor: '#E8E8E8',
      borderBottom: '1px solid #CCCCCC',
      fontWeight: 'bold',
      fontSize: '11px'
    },
    statusBar: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '2px 8px',
      backgroundColor: '#E0E0E0',
      borderTop: '1px solid #808080',
      fontSize: '11px',
      color: '#333333'
    },
    quickWatchOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    },
    quickWatchDialog: {
      width: '500px',
      backgroundColor: '#F0F0F0',
      border: '2px solid #333333'
    },
    quickWatchTitle: {
      padding: '4px 8px',
      backgroundColor: '#000080',
      color: '#FFFFFF',
      fontWeight: 'bold'
    },
    quickWatchContent: {
      padding: '12px'
    },
    quickWatchResult: {
      marginTop: '8px',
      padding: '8px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #808080',
      minHeight: '60px',
      fontFamily: 'Consolas, monospace'
    }
  };

  if (!visible) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ fontWeight: 'bold' }}>Watch Window</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            style={styles.button}
            onClick={() => setShowQuickWatch(true)}
            title="Quick Watch (Shift+F9)"
          >
            Quick Watch
          </button>
          <button style={styles.button} onClick={refreshWatches}>
            Refresh
          </button>
          {onClose && (
            <button style={styles.button} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter expression..."
          value={newExpression}
          onChange={(e) => setNewExpression(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addWatch(newExpression);
              setNewExpression('');
              setHistoryIndex(-1);
            } else {
              handleKeyDown(e);
            }
          }}
          style={styles.input}
        />
        <button
          style={styles.button}
          onClick={() => {
            addWatch(newExpression);
            setNewExpression('');
          }}
          disabled={!newExpression.trim()}
        >
          Add Watch
        </button>
        <select
          style={{ ...styles.input, flex: 'none', width: '100px' }}
          value={contextFilter}
          onChange={(e) => setContextFilter(e.target.value as WatchContext | 'all')}
        >
          <option value="all">All Contexts</option>
          <option value="global">Global</option>
          <option value="local">Local</option>
          <option value="module">Module</option>
          <option value="form">Form</option>
        </select>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.input, width: '120px', flex: 'none' }}
        />
      </div>

      {/* Group Tabs */}
      <div style={styles.groupTabs}>
        {groups.map(group => (
          <div
            key={group.name}
            style={{
              ...styles.groupTab,
              backgroundColor: selectedGroup === group.name ? '#FFFFFF' : '#E0E0E0',
              borderBottom: selectedGroup === group.name ? '2px solid ' + group.color : 'none',
              fontWeight: selectedGroup === group.name ? 'bold' : 'normal'
            }}
            onClick={() => setSelectedGroup(group.name)}
          >
            {group.name}
          </div>
        ))}
      </div>

      {/* Column Headers */}
      <div style={styles.watchHeader}>
        <span style={{ width: '20px' }}></span>
        <span style={{ flex: '0 0 120px' }}>Expression</span>
        <span style={{ flex: 1 }}>Value</span>
        <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Type</span>
        <span style={{ flex: '0 0 60px' }}></span>
      </div>

      {/* Watch List */}
      <div style={styles.watchList}>
        {filteredWatches.filter(w => w.group === selectedGroup).length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#808080' }}>
            No watches in this group. Add an expression above.
          </div>
        ) : (
          filteredWatches
            .filter(w => w.group === selectedGroup)
            .map(watch => renderWatchNode(watch, null, 0))
        )}
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <span>
          {filteredWatches.length} watch(es) | {watches.filter(w => w.error).length} error(s)
        </span>
        <span>
          Context: {contextFilter === 'all' ? 'All' : contextFilter}
        </span>
      </div>

      {/* Quick Watch Dialog */}
      {showQuickWatch && (
        <div style={styles.quickWatchOverlay} onClick={() => setShowQuickWatch(false)}>
          <div style={styles.quickWatchDialog} onClick={e => e.stopPropagation()}>
            <div style={styles.quickWatchTitle}>
              Quick Watch
            </div>
            <div style={styles.quickWatchContent}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  ref={quickWatchInputRef}
                  type="text"
                  placeholder="Expression:"
                  value={quickWatchExpression}
                  onChange={(e) => setQuickWatchExpression(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') performQuickWatch();
                  }}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button style={styles.button} onClick={performQuickWatch}>
                  = Recalculate
                </button>
              </div>

              <div style={styles.quickWatchResult}>
                {quickWatchResult ? (
                  quickWatchResult.error ? (
                    <span style={{ color: 'red' }}>{quickWatchResult.error}</span>
                  ) : (
                    <>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Value:</strong>{' '}
                        <span style={{ color: VB6_TYPE_COLORS[quickWatchResult.type] }}>
                          {formatValue(quickWatchResult.value)}
                        </span>
                      </div>
                      <div>
                        <strong>Type:</strong> {quickWatchResult.type}
                      </div>
                    </>
                  )
                ) : (
                  <span style={{ color: '#808080' }}>Enter an expression and press Enter</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  style={styles.button}
                  onClick={() => {
                    if (quickWatchExpression.trim()) {
                      addWatch(quickWatchExpression);
                      setShowQuickWatch(false);
                      setQuickWatchExpression('');
                      setQuickWatchResult(null);
                    }
                  }}
                  disabled={!quickWatchExpression.trim()}
                >
                  Add Watch
                </button>
                <button
                  style={styles.button}
                  onClick={() => {
                    setShowQuickWatch(false);
                    setQuickWatchExpression('');
                    setQuickWatchResult(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default VB6EnhancedWatchWindow;
