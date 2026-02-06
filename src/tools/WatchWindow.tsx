import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Watch Window Types
export enum WatchType {
  Expression = 'Expression',
  Variable = 'Variable',
  Property = 'Property',
  Method = 'Method',
  Custom = 'Custom',
}

export enum WatchStatus {
  Valid = 'Valid',
  Error = 'Error',
  OutOfScope = 'OutOfScope',
  NotEvaluated = 'NotEvaluated',
  Evaluating = 'Evaluating',
}

export interface WatchExpression {
  id: string;
  expression: string;
  name?: string;
  type: WatchType;
  value: any;
  displayValue: string;
  status: WatchStatus;
  errorMessage?: string;
  dataType?: string;
  lastUpdated: Date;
  updateCount: number;
  valueHistory: Array<{
    value: any;
    timestamp: Date;
  }>;
  isExpanded: boolean;
  hasChildren: boolean;
  children: WatchExpression[];
  category: string;
  enabled: boolean;
  breakOnChange: boolean;
  condition?: string;
  hitCount: number;
  lastHitTime?: Date;
  description?: string;
  color?: string;
}

export interface WatchCategory {
  id: string;
  name: string;
  color: string;
  isExpanded: boolean;
  watches: string[];
}

export interface WatchSettings {
  autoUpdate: boolean;
  updateInterval: number;
  showHistory: boolean;
  maxHistoryItems: number;
  showDataTypes: boolean;
  showHitCounts: boolean;
  groupByCategory: boolean;
  fontSize: number;
  highlightChanges: boolean;
  sortBy: 'name' | 'type' | 'lastUpdated' | 'hitCount';
  sortOrder: 'asc' | 'desc';
}

interface WatchWindowProps {
  isDebugMode?: boolean;
  debugContext?: any;
  onEvaluateExpression?: (expression: string) => Promise<any>;
  onBreakOnChange?: (watch: WatchExpression) => void;
  onExportWatches?: (watches: WatchExpression[]) => void;
  onImportWatches?: (watches: WatchExpression[]) => void;
}

export const WatchWindow: React.FC<WatchWindowProps> = ({
  isDebugMode = false,
  debugContext,
  onEvaluateExpression,
  onBreakOnChange,
  onExportWatches,
  onImportWatches,
}) => {
  const [watches, setWatches] = useState<WatchExpression[]>([]);
  const [categories, setCategories] = useState<WatchCategory[]>([
    { id: 'default', name: 'General', color: '#007acc', isExpanded: true, watches: [] },
    { id: 'variables', name: 'Variables', color: '#28a745', isExpanded: true, watches: [] },
    { id: 'properties', name: 'Properties', color: '#ffc107', isExpanded: true, watches: [] },
    { id: 'custom', name: 'Custom', color: '#6f42c1', isExpanded: true, watches: [] },
  ]);
  const [selectedWatch, setSelectedWatch] = useState<WatchExpression | null>(null);
  const [newExpression, setNewExpression] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('default');
  const [searchText, setSearchText] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [settings, setSettings] = useState<WatchSettings>({
    autoUpdate: true,
    updateInterval: 1000,
    showHistory: false,
    maxHistoryItems: 20,
    showDataTypes: true,
    showHitCounts: false,
    groupByCategory: true,
    fontSize: 11,
    highlightChanges: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuWatch, setContextMenuWatch] = useState<WatchExpression | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const updateTimer = useRef<NodeJS.Timeout>();
  const addExpressionRef = useRef<HTMLInputElement>(null);

  // Initialize with sample watches
  useEffect(() => {
    const sampleWatches: WatchExpression[] = [
      {
        id: 'watch1',
        expression: 'strUserName',
        type: WatchType.Variable,
        value: 'John Doe',
        displayValue: '"John Doe"',
        status: WatchStatus.Valid,
        dataType: 'String',
        lastUpdated: new Date(),
        updateCount: 5,
        valueHistory: [
          { value: 'Jane Smith', timestamp: new Date(Date.now() - 60000) },
          { value: 'John Doe', timestamp: new Date() },
        ],
        isExpanded: false,
        hasChildren: false,
        children: [],
        category: 'variables',
        enabled: true,
        breakOnChange: false,
        hitCount: 0,
        color: '#28a745',
      },
      {
        id: 'watch2',
        expression: 'intCount * 2',
        name: 'Double Count',
        type: WatchType.Expression,
        value: 84,
        displayValue: '84',
        status: WatchStatus.Valid,
        dataType: 'Integer',
        lastUpdated: new Date(),
        updateCount: 12,
        valueHistory: [
          { value: 80, timestamp: new Date(Date.now() - 120000) },
          { value: 82, timestamp: new Date(Date.now() - 60000) },
          { value: 84, timestamp: new Date() },
        ],
        isExpanded: false,
        hasChildren: false,
        children: [],
        category: 'custom',
        enabled: true,
        breakOnChange: true,
        hitCount: 3,
        lastHitTime: new Date(Date.now() - 30000),
        color: '#6f42c1',
      },
      {
        id: 'watch3',
        expression: 'objUser.FirstName',
        type: WatchType.Property,
        value: 'John',
        displayValue: '"John"',
        status: WatchStatus.Valid,
        dataType: 'String',
        lastUpdated: new Date(),
        updateCount: 8,
        valueHistory: [{ value: 'John', timestamp: new Date() }],
        isExpanded: false,
        hasChildren: false,
        children: [],
        category: 'properties',
        enabled: true,
        breakOnChange: false,
        hitCount: 0,
        color: '#ffc107',
      },
      {
        id: 'watch4',
        expression: 'invalidVar',
        type: WatchType.Variable,
        value: null,
        displayValue: '<Error>',
        status: WatchStatus.Error,
        errorMessage: 'Variable not defined',
        lastUpdated: new Date(),
        updateCount: 1,
        valueHistory: [],
        isExpanded: false,
        hasChildren: false,
        children: [],
        category: 'variables',
        enabled: true,
        breakOnChange: false,
        hitCount: 0,
        color: '#dc3545',
      },
      {
        id: 'watch5',
        expression: 'arrNumbers',
        type: WatchType.Variable,
        value: [1, 2, 3, 4, 5],
        displayValue: 'Array(0 To 4)',
        status: WatchStatus.Valid,
        dataType: 'Integer()',
        lastUpdated: new Date(),
        updateCount: 3,
        valueHistory: [{ value: [1, 2, 3, 4, 5], timestamp: new Date() }],
        isExpanded: false,
        hasChildren: true,
        children: [],
        category: 'variables',
        enabled: true,
        breakOnChange: false,
        hitCount: 0,
      },
    ];

    setWatches(sampleWatches);
  }, []);

  // Auto update timer
  useEffect(() => {
    if (settings.autoUpdate && isDebugMode) {
      updateTimer.current = setInterval(() => {
        updateAllWatches();
      }, settings.updateInterval);
    }

    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
      }
    };
  }, [settings.autoUpdate, settings.updateInterval, isDebugMode]);

  // Update all enabled watches
  const updateAllWatches = useCallback(async () => {
    if (!isDebugMode) return;

    setIsEvaluating(true);
    try {
      const enabledWatches = watches.filter(w => w.enabled);
      const updatePromises = enabledWatches.map(watch => updateWatch(watch));
      await Promise.allSettled(updatePromises);
    } finally {
      setIsEvaluating(false);
    }
  }, [watches, isDebugMode]);

  // Update a single watch
  const updateWatch = useCallback(
    async (watch: WatchExpression): Promise<void> => {
      try {
        let newValue: any;
        let newStatus = WatchStatus.Valid;
        let errorMessage: string | undefined;

        if (onEvaluateExpression) {
          try {
            newValue = await onEvaluateExpression(watch.expression);
          } catch (error) {
            newValue = null;
            newStatus = WatchStatus.Error;
            errorMessage = String(error);
          }
        } else {
          // Simulate evaluation for demo
          newValue = simulateEvaluateExpression(watch.expression);
          if (newValue === undefined) {
            newStatus = WatchStatus.Error;
            errorMessage = 'Cannot evaluate expression';
          }
        }

        const hasChanged = JSON.stringify(newValue) !== JSON.stringify(watch.value);

        setWatches(prev =>
          prev.map(w => {
            if (w.id !== watch.id) return w;

            const updatedWatch: WatchExpression = {
              ...w,
              value: newValue,
              displayValue: formatWatchValue(newValue, w.type),
              status: newStatus,
              errorMessage,
              lastUpdated: new Date(),
              updateCount: w.updateCount + 1,
              valueHistory: hasChanged
                ? [
                    ...w.valueHistory.slice(-(settings.maxHistoryItems - 1)),
                    { value: newValue, timestamp: new Date() },
                  ]
                : w.valueHistory,
            };

            // Trigger break on change if enabled
            if (hasChanged && w.breakOnChange) {
              updatedWatch.hitCount++;
              updatedWatch.lastHitTime = new Date();
              onBreakOnChange?.(updatedWatch);
            }

            return updatedWatch;
          })
        );
      } catch (error) {
        console.error('Failed to update watch:', error);
      }
    },
    [onEvaluateExpression, settings.maxHistoryItems, onBreakOnChange]
  );

  // Simulate expression evaluation for demo
  const simulateEvaluateExpression = (expression: string): any => {
    const expr = expression.toLowerCase().trim();

    if (expr === 'strusername') return 'John Doe';
    if (expr === 'intcount * 2') return Math.floor(Math.random() * 100);
    if (expr === 'objuser.firstname') return 'John';
    if (expr === 'arrnumbers') return [1, 2, 3, 4, 5];
    if (expr === 'now') return new Date();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr.includes('invalidvar')) return undefined;

    // Try to parse as number
    const num = parseFloat(expr);
    if (!isNaN(num)) return num;

    // Default string value
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    return undefined;
  };

  // Format watch value for display
  const formatWatchValue = (value: any, type: WatchType): string => {
    if (value === null || value === undefined) {
      return '<Nothing>';
    }

    if (Array.isArray(value)) {
      return `Array(0 To ${value.length - 1})`;
    }

    if (typeof value === 'object') {
      return `{${value.constructor?.name || 'Object'}}`;
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    if (typeof value === 'boolean') {
      return value ? 'True' : 'False';
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    return String(value);
  };

  // Add new watch
  const addWatch = useCallback(
    (expression: string, category: string = 'default', name?: string) => {
      if (!expression.trim()) return;

      const newWatch: WatchExpression = {
        id: `watch_${Date.now()}_${Math.random()}`,
        expression: expression.trim(),
        name,
        type: detectWatchType(expression),
        value: null,
        displayValue: '<Not evaluated>',
        status: WatchStatus.NotEvaluated,
        lastUpdated: new Date(),
        updateCount: 0,
        valueHistory: [],
        isExpanded: false,
        hasChildren: false,
        children: [],
        category,
        enabled: true,
        breakOnChange: false,
        hitCount: 0,
        color: categories.find(c => c.id === category)?.color,
      };

      setWatches(prev => [...prev, newWatch]);

      // Update immediately if in debug mode
      if (isDebugMode) {
        updateWatch(newWatch);
      }

      setNewExpression('');
      setShowAddDialog(false);
    },
    [categories, isDebugMode, updateWatch]
  );

  // Detect watch type from expression
  const detectWatchType = (expression: string): WatchType => {
    if (expression.includes('(') && expression.includes(')')) {
      return WatchType.Method;
    }
    if (expression.includes('.')) {
      return WatchType.Property;
    }
    if (
      expression.includes('+') ||
      expression.includes('-') ||
      expression.includes('*') ||
      expression.includes('/')
    ) {
      return WatchType.Expression;
    }
    return WatchType.Variable;
  };

  // Remove watch
  const removeWatch = useCallback(
    (watchId: string) => {
      setWatches(prev => prev.filter(w => w.id !== watchId));
      if (selectedWatch?.id === watchId) {
        setSelectedWatch(null);
      }
    },
    [selectedWatch]
  );

  // Toggle watch enabled state
  const toggleWatchEnabled = useCallback((watchId: string) => {
    setWatches(prev => prev.map(w => (w.id === watchId ? { ...w, enabled: !w.enabled } : w)));
  }, []);

  // Toggle break on change
  const toggleBreakOnChange = useCallback((watchId: string) => {
    setWatches(prev =>
      prev.map(w => (w.id === watchId ? { ...w, breakOnChange: !w.breakOnChange } : w))
    );
  }, []);

  // Edit watch expression
  const editWatch = useCallback((watchId: string, newExpression: string) => {
    setWatches(prev =>
      prev.map(w =>
        w.id === watchId
          ? {
              ...w,
              expression: newExpression,
              type: detectWatchType(newExpression),
              status: WatchStatus.NotEvaluated,
              displayValue: '<Not evaluated>',
              updateCount: 0,
            }
          : w
      )
    );
  }, []);

  // Filter and sort watches
  const processedWatches = useMemo(() => {
    let filtered = watches;

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        w =>
          w.expression.toLowerCase().includes(searchLower) ||
          (w.name && w.name.toLowerCase().includes(searchLower)) ||
          w.displayValue.toLowerCase().includes(searchLower)
      );
    }

    // Sort watches
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (settings.sortBy) {
        case 'name':
          comparison = (a.name || a.expression).localeCompare(b.name || b.expression);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'lastUpdated':
          comparison = b.lastUpdated.getTime() - a.lastUpdated.getTime();
          break;
        case 'hitCount':
          comparison = b.hitCount - a.hitCount;
          break;
      }

      return settings.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [watches, searchText, settings.sortBy, settings.sortOrder]);

  // Group watches by category
  const groupedWatches = useMemo(() => {
    if (!settings.groupByCategory) {
      return { default: processedWatches };
    }

    return processedWatches.reduce(
      (groups, watch) => {
        const category = watch.category || 'default';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(watch);
        return groups;
      },
      {} as Record<string, WatchExpression[]>
    );
  }, [processedWatches, settings.groupByCategory]);

  // Get watch status icon
  const getStatusIcon = (status: WatchStatus): string => {
    switch (status) {
      case WatchStatus.Valid:
        return '✅';
      case WatchStatus.Error:
        return '❌';
      case WatchStatus.OutOfScope:
        return '⚠️';
      case WatchStatus.Evaluating:
        return '⏳';
      case WatchStatus.NotEvaluated:
      default:
        return '⭕';
    }
  };

  // Context menu items
  const contextMenuItems = [
    {
      label: 'Edit Expression',
      action: () => {
        if (!contextMenuWatch) return;
        const newExpr = prompt('Edit expression:', contextMenuWatch.expression);
        if (newExpr && newExpr !== contextMenuWatch.expression) {
          editWatch(contextMenuWatch.id, newExpr);
        }
      },
    },
    {
      label: 'Toggle Enabled',
      action: () => contextMenuWatch && toggleWatchEnabled(contextMenuWatch.id),
    },
    {
      label: 'Break on Change',
      action: () => contextMenuWatch && toggleBreakOnChange(contextMenuWatch.id),
    },
    {
      label: 'Copy Value',
      action: () =>
        contextMenuWatch && navigator.clipboard.writeText(contextMenuWatch.displayValue),
    },
    {
      label: 'Remove Watch',
      action: () => contextMenuWatch && removeWatch(contextMenuWatch.id),
    },
  ];

  // Render watch row
  const renderWatch = (watch: WatchExpression): React.ReactNode => {
    const isSelected = selectedWatch?.id === watch.id;
    const hasChanged =
      watch.valueHistory.length > 1 &&
      watch.valueHistory[watch.valueHistory.length - 1]?.value !==
        watch.valueHistory[watch.valueHistory.length - 2]?.value;

    return (
      <div
        key={watch.id}
        className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
          isSelected ? 'bg-blue-100' : ''
        } ${watch.status === WatchStatus.Error ? 'bg-red-50' : ''} ${
          hasChanged && settings.highlightChanges ? 'bg-yellow-50' : ''
        }`}
        style={{ fontSize: `${settings.fontSize}px` }}
        onClick={() => setSelectedWatch(watch)}
        onContextMenu={e => {
          e.preventDefault();
          setContextMenuWatch(watch);
          setContextMenuPosition({ x: e.clientX, y: e.clientY });
          setShowContextMenu(true);
        }}
      >
        {/* Enabled checkbox */}
        <input
          type="checkbox"
          checked={watch.enabled}
          onChange={() => toggleWatchEnabled(watch.id)}
          className="mr-2"
          onClick={e => e.stopPropagation()}
        />

        {/* Status icon */}
        <span className="w-6 text-center">{getStatusIcon(watch.status)}</span>

        {/* Expression/Name */}
        <div className="w-40 font-mono text-sm truncate">
          <div className="font-medium text-gray-800">{watch.name || watch.expression}</div>
          {watch.name && <div className="text-xs text-gray-500 truncate">{watch.expression}</div>}
        </div>

        {/* Value */}
        <div className="flex-1 font-mono text-sm text-gray-700 truncate">
          {watch.status === WatchStatus.Error ? (
            <span className="text-red-600" title={watch.errorMessage}>
              {watch.displayValue}
            </span>
          ) : (
            <span>{watch.displayValue}</span>
          )}
        </div>

        {/* Type */}
        {settings.showDataTypes && (
          <div className="w-16 text-xs text-gray-500 truncate">{watch.dataType || watch.type}</div>
        )}

        {/* Hit count */}
        {settings.showHitCounts && (
          <div className="w-12 text-xs text-gray-500 text-center">{watch.hitCount}</div>
        )}

        {/* Break on change indicator */}
        {watch.breakOnChange && (
          <span className="w-4 text-center text-red-600" title="Break on change">
            🔴
          </span>
        )}

        {/* Update count */}
        <div className="w-8 text-xs text-gray-400 text-center">{watch.updateCount}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Watch</h3>
          {isDebugMode && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              Debug Mode
            </span>
          )}
          {isEvaluating && <div className="text-xs text-blue-600 animate-pulse">Evaluating...</div>}
        </div>

        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded w-20"
          />

          <button
            onClick={() => setShowAddDialog(true)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Add Watch"
          >
            ➕
          </button>

          <button
            onClick={updateAllWatches}
            disabled={!isDebugMode || isEvaluating}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            title="Update All"
          >
            🔄
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.autoUpdate}
                onChange={e => setSettings(prev => ({ ...prev, autoUpdate: e.target.checked }))}
              />
              Auto Update
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showDataTypes}
                onChange={e => setSettings(prev => ({ ...prev, showDataTypes: e.target.checked }))}
              />
              Show Types
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showHitCounts}
                onChange={e => setSettings(prev => ({ ...prev, showHitCounts: e.target.checked }))}
              />
              Hit Counts
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.groupByCategory}
                onChange={e =>
                  setSettings(prev => ({ ...prev, groupByCategory: e.target.checked }))
                }
              />
              Group by Category
            </label>
          </div>
        </div>
      )}

      {/* Column Headers */}
      <div
        className="flex items-center py-2 px-2 bg-gray-200 border-b border-gray-300 text-xs font-medium text-gray-700"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <div className="w-6"></div>
        <div className="w-6"></div>
        <div className="w-40">Expression</div>
        <div className="flex-1">Value</div>
        {settings.showDataTypes && <div className="w-16">Type</div>}
        {settings.showHitCounts && <div className="w-12">Hits</div>}
        <div className="w-4"></div>
        <div className="w-8">Count</div>
      </div>

      {/* Watches List */}
      <div className="flex-1 overflow-y-auto">
        {settings.groupByCategory
          ? Object.entries(groupedWatches).map(([categoryId, categoryWatches]) => {
              const category = categories.find(c => c.id === categoryId);
              return (
                <div key={categoryId}>
                  <div className="flex items-center gap-2 py-1 px-2 bg-gray-100 border-b border-gray-200 text-sm font-medium">
                    <button
                      onClick={() =>
                        setCategories(prev =>
                          prev.map(c =>
                            c.id === categoryId ? { ...c, isExpanded: !c.isExpanded } : c
                          )
                        )
                      }
                      className="text-gray-600"
                    >
                      {category?.isExpanded ? '▼' : '▶'}
                    </button>
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: category?.color || '#ccc' }}
                    />
                    <span>{category?.name || categoryId}</span>
                    <span className="text-xs text-gray-500">({categoryWatches.length})</span>
                  </div>
                  {category?.isExpanded && categoryWatches.map(watch => renderWatch(watch))}
                </div>
              );
            })
          : processedWatches.map(watch => renderWatch(watch))}

        {processedWatches.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">👁️</div>
              <p className="text-lg">No watch expressions</p>
              <p className="text-sm mt-2">Add expressions to monitor during debugging</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-t border-gray-200">
        <input
          ref={addExpressionRef}
          type="text"
          placeholder="Enter expression to watch..."
          value={newExpression}
          onChange={e => setNewExpression(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              addWatch(newExpression, selectedCategory);
            }
          }}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
        />

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => addWatch(newExpression, selectedCategory)}
          disabled={!newExpression.trim()}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Add
        </button>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg z-50 py-1"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          {contextMenuItems.map((item, index) => (
            <button
              key={index}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => {
                item.action();
                setShowContextMenu(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Watches: {processedWatches.length}</span>
          <span>Enabled: {processedWatches.filter(w => w.enabled).length}</span>
          <span>Errors: {processedWatches.filter(w => w.status === WatchStatus.Error).length}</span>
          <span>Break on Change: {processedWatches.filter(w => w.breakOnChange).length}</span>
        </div>

        <div className="flex items-center gap-2">
          {settings.autoUpdate && isDebugMode && (
            <span className="text-green-600">Auto-update: {settings.updateInterval}ms</span>
          )}
          {!isDebugMode && <span className="text-orange-600">Debug mode required</span>}
        </div>
      </div>
    </div>
  );
};

export default WatchWindow;
