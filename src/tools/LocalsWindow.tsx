import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Locals Window Types
export enum VariableType {
  Boolean = 'Boolean',
  Byte = 'Byte',
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  Date = 'Date',
  String = 'String',
  Variant = 'Variant',
  Object = 'Object',
  Array = 'Array',
  UserDefined = 'UserDefined',
  Enum = 'Enum',
  Unknown = 'Unknown',
}

export enum VariableScope {
  Local = 'Local',
  Parameter = 'Parameter',
  Module = 'Module',
  Global = 'Global',
  Static = 'Static',
  WithBlock = 'With Block',
}

export enum VariableAccess {
  ReadWrite = 'ReadWrite',
  ReadOnly = 'ReadOnly',
  WriteOnly = 'WriteOnly',
  Const = 'Const',
}

export interface LocalVariable {
  id: string;
  name: string;
  value: any;
  displayValue: string;
  type: VariableType;
  scope: VariableScope;
  access: VariableAccess;
  isExpanded: boolean;
  hasChildren: boolean;
  children: LocalVariable[];
  parent?: string;
  level: number;
  address?: string;
  size?: number;
  lastModified?: Date;
  isModified: boolean;
  isError: boolean;
  errorMessage?: string;
  objectTypeName?: string;
  arrayBounds?: Array<{ lower: number; upper: number }>;
  description?: string;
}

export interface DebugSession {
  id: string;
  isActive: boolean;
  isPaused: boolean;
  currentProcedure: string;
  currentModule: string;
  currentLine: number;
  callStackDepth: number;
  variables: LocalVariable[];
  lastUpdated: Date;
}

export interface LocalsSettings {
  showModuleVariables: boolean;
  showStaticVariables: boolean;
  showParameters: boolean;
  showConstants: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  showHexValues: boolean;
  showAddresses: boolean;
  sortBy: 'name' | 'type' | 'scope' | 'modified';
  sortOrder: 'asc' | 'desc';
  fontSize: number;
  expandNewVariables: boolean;
}

interface LocalsWindowProps {
  debugSession?: DebugSession;
  onVariableChange?: (variable: LocalVariable, newValue: any) => Promise<boolean>;
  onVariableExpand?: (variable: LocalVariable) => Promise<LocalVariable[]>;
  onShowInMemory?: (variable: LocalVariable) => void;
  onAddToWatch?: (variable: LocalVariable) => void;
  onCopyValue?: (variable: LocalVariable) => void;
}

export const LocalsWindow: React.FC<LocalsWindowProps> = ({
  debugSession,
  onVariableChange,
  onVariableExpand,
  onShowInMemory,
  onAddToWatch,
  onCopyValue,
}) => {
  const [variables, setVariables] = useState<LocalVariable[]>([]);
  const [filteredVariables, setFilteredVariables] = useState<LocalVariable[]>([]);
  const [selectedVariable, setSelectedVariable] = useState<LocalVariable | null>(null);
  const [editingVariable, setEditingVariable] = useState<LocalVariable | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchText, setSearchText] = useState('');
  const [settings, setSettings] = useState<LocalsSettings>({
    showModuleVariables: true,
    showStaticVariables: true,
    showParameters: true,
    showConstants: false,
    autoRefresh: true,
    refreshInterval: 1000,
    showHexValues: false,
    showAddresses: false,
    sortBy: 'name',
    sortOrder: 'asc',
    fontSize: 11,
    expandNewVariables: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuVariable, setContextMenuVariable] = useState<LocalVariable | null>(null);

  const eventEmitter = useRef(new EventEmitter());
  const refreshTimer = useRef<NodeJS.Timeout>();

  // Initialize with sample variables
  useEffect(() => {
    if (!debugSession?.isActive) {
      setVariables([]);
      return;
    }

    // Sample variables for demonstration
    const sampleVariables: LocalVariable[] = [
      {
        id: 'var1',
        name: 'strUserName',
        value: 'John Doe',
        displayValue: '"John Doe"',
        type: VariableType.String,
        scope: VariableScope.Local,
        access: VariableAccess.ReadWrite,
        isExpanded: false,
        hasChildren: false,
        children: [],
        level: 0,
        address: '0x001234F0',
        size: 16,
        isModified: false,
        isError: false,
      },
      {
        id: 'var2',
        name: 'intCount',
        value: 42,
        displayValue: settings.showHexValues ? '42 (0x2A)' : '42',
        type: VariableType.Integer,
        scope: VariableScope.Local,
        access: VariableAccess.ReadWrite,
        isExpanded: false,
        hasChildren: false,
        children: [],
        level: 0,
        address: '0x001234F4',
        size: 2,
        isModified: true,
        isError: false,
        lastModified: new Date(),
      },
      {
        id: 'var3',
        name: 'objUser',
        value: {},
        displayValue: '{User}',
        type: VariableType.Object,
        scope: VariableScope.Local,
        access: VariableAccess.ReadWrite,
        isExpanded: false,
        hasChildren: true,
        children: [],
        level: 0,
        address: '0x001234F8',
        objectTypeName: 'User',
        isModified: false,
        isError: false,
      },
      {
        id: 'var4',
        name: 'arrNumbers',
        value: [1, 2, 3, 4, 5],
        displayValue: 'Array(0 To 4)',
        type: VariableType.Array,
        scope: VariableScope.Local,
        access: VariableAccess.ReadWrite,
        isExpanded: false,
        hasChildren: true,
        children: [],
        level: 0,
        arrayBounds: [{ lower: 0, upper: 4 }],
        isModified: false,
        isError: false,
      },
      {
        id: 'var5',
        name: 'blnIsActive',
        value: true,
        displayValue: 'True',
        type: VariableType.Boolean,
        scope: VariableScope.Parameter,
        access: VariableAccess.ReadOnly,
        isExpanded: false,
        hasChildren: false,
        children: [],
        level: 0,
        isModified: false,
        isError: false,
      },
      {
        id: 'var6',
        name: 'MODULE_CONSTANT',
        value: 'CONST_VALUE',
        displayValue: '"CONST_VALUE"',
        type: VariableType.String,
        scope: VariableScope.Module,
        access: VariableAccess.Const,
        isExpanded: false,
        hasChildren: false,
        children: [],
        level: 0,
        isModified: false,
        isError: false,
      },
      {
        id: 'var7',
        name: 'varError',
        value: null,
        displayValue: '<Error reading value>',
        type: VariableType.Variant,
        scope: VariableScope.Local,
        access: VariableAccess.ReadWrite,
        isExpanded: false,
        hasChildren: false,
        children: [],
        level: 0,
        isModified: false,
        isError: true,
        errorMessage: 'Object variable or With block variable not set',
      },
    ];

    setVariables(sampleVariables);
  }, [debugSession, settings.showHexValues]);

  // Auto refresh timer
  useEffect(() => {
    if (settings.autoRefresh && debugSession?.isActive && debugSession.isPaused) {
      refreshTimer.current = setInterval(() => {
        refreshVariables();
      }, settings.refreshInterval);
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [settings.autoRefresh, settings.refreshInterval, debugSession]);

  // Filter and sort variables
  const processedVariables = useMemo(() => {
    const filtered = variables.filter(variable => {
      // Apply scope filters
      if (!settings.showParameters && variable.scope === VariableScope.Parameter) return false;
      if (!settings.showModuleVariables && variable.scope === VariableScope.Module) return false;
      if (!settings.showStaticVariables && variable.scope === VariableScope.Static) return false;
      if (!settings.showConstants && variable.access === VariableAccess.Const) return false;

      // Apply search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          variable.name.toLowerCase().includes(searchLower) ||
          variable.displayValue.toLowerCase().includes(searchLower) ||
          variable.type.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Sort variables
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (settings.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'scope':
          comparison = a.scope.localeCompare(b.scope);
          break;
        case 'modified': {
          const aModified = a.lastModified || new Date(0);
          const bModified = b.lastModified || new Date(0);
          comparison = bModified.getTime() - aModified.getTime();
          break;
        }
      }

      return settings.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [variables, settings, searchText]);

  // Refresh variables from debug session
  const refreshVariables = useCallback(async () => {
    if (!debugSession?.isActive) return;

    setIsRefreshing(true);
    try {
      // In a real implementation, this would fetch from the debug engine
      setLastRefresh(new Date());

      // Simulate some variable changes
      setVariables(prev =>
        prev.map(variable => {
          if (variable.name === 'intCount' && Math.random() < 0.3) {
            const newValue = Math.floor(Math.random() * 100);
            return {
              ...variable,
              value: newValue,
              displayValue: settings.showHexValues
                ? `${newValue} (0x${newValue.toString(16).toUpperCase()})`
                : String(newValue),
              isModified: true,
              lastModified: new Date(),
            };
          }
          return variable;
        })
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [debugSession, settings.showHexValues]);

  // Toggle variable expansion
  const toggleExpansion = useCallback(
    async (variable: LocalVariable) => {
      if (!variable.hasChildren) return;

      if (!variable.isExpanded && variable.children.length === 0) {
        // Load children for the first time
        if (onVariableExpand) {
          try {
            const children = await onVariableExpand(variable);
            setVariables(prev =>
              prev.map(v => (v.id === variable.id ? { ...v, children, isExpanded: true } : v))
            );
          } catch (error) {
            console.error('Failed to expand variable:', error);
          }
        } else {
          // Generate sample children for demo
          const children = generateSampleChildren(variable);
          setVariables(prev =>
            prev.map(v => (v.id === variable.id ? { ...v, children, isExpanded: true } : v))
          );
        }
      } else {
        // Just toggle expansion
        setVariables(prev =>
          prev.map(v => (v.id === variable.id ? { ...v, isExpanded: !v.isExpanded } : v))
        );
      }
    },
    [onVariableExpand]
  );

  // Generate sample children for objects and arrays
  const generateSampleChildren = (parent: LocalVariable): LocalVariable[] => {
    if (parent.type === VariableType.Object) {
      return [
        {
          id: `${parent.id}_prop1`,
          name: 'FirstName',
          value: 'John',
          displayValue: '"John"',
          type: VariableType.String,
          scope: VariableScope.Local,
          access: VariableAccess.ReadWrite,
          isExpanded: false,
          hasChildren: false,
          children: [],
          parent: parent.id,
          level: parent.level + 1,
          isModified: false,
          isError: false,
        },
        {
          id: `${parent.id}_prop2`,
          name: 'LastName',
          value: 'Doe',
          displayValue: '"Doe"',
          type: VariableType.String,
          scope: VariableScope.Local,
          access: VariableAccess.ReadWrite,
          isExpanded: false,
          hasChildren: false,
          children: [],
          parent: parent.id,
          level: parent.level + 1,
          isModified: false,
          isError: false,
        },
        {
          id: `${parent.id}_prop3`,
          name: 'Age',
          value: 30,
          displayValue: '30',
          type: VariableType.Integer,
          scope: VariableScope.Local,
          access: VariableAccess.ReadWrite,
          isExpanded: false,
          hasChildren: false,
          children: [],
          parent: parent.id,
          level: parent.level + 1,
          isModified: false,
          isError: false,
        },
      ];
    } else if (parent.type === VariableType.Array) {
      const array = parent.value as any[];
      return array.map((item, index) => ({
        id: `${parent.id}_${index}`,
        name: `(${index})`,
        value: item,
        displayValue: String(item),
        type: typeof item === 'number' ? VariableType.Integer : VariableType.Variant,
        scope: VariableScope.Local,
        access: VariableAccess.ReadWrite,
        isExpanded: false,
        hasChildren: false,
        children: [],
        parent: parent.id,
        level: parent.level + 1,
        isModified: false,
        isError: false,
      }));
    }

    return [];
  };

  // Start editing a variable
  const startEditing = useCallback((variable: LocalVariable) => {
    if (variable.access === VariableAccess.ReadOnly || variable.access === VariableAccess.Const) {
      return;
    }

    setEditingVariable(variable);
    setEditValue(String(variable.value));
  }, []);

  // Save edited variable value
  const saveEdit = useCallback(async () => {
    if (!editingVariable) return;

    try {
      const newValue = parseValue(editValue, editingVariable.type);

      if (onVariableChange) {
        const success = await onVariableChange(editingVariable, newValue);
        if (!success) return;
      }

      // Update local state
      setVariables(prev =>
        prev.map(v =>
          v.id === editingVariable.id
            ? {
                ...v,
                value: newValue,
                displayValue: formatValue(newValue, v.type, settings.showHexValues),
                isModified: true,
                lastModified: new Date(),
              }
            : v
        )
      );

      setEditingVariable(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update variable:', error);
    }
  }, [editingVariable, editValue, onVariableChange, settings.showHexValues]);

  // Parse string value to appropriate type
  const parseValue = (stringValue: string, type: VariableType): any => {
    switch (type) {
      case VariableType.Boolean:
        return stringValue.toLowerCase() === 'true' || stringValue === '1';
      case VariableType.Integer:
      case VariableType.Long:
        return parseInt(stringValue, 10);
      case VariableType.Single:
      case VariableType.Double:
        return parseFloat(stringValue);
      case VariableType.String:
        return stringValue;
      case VariableType.Date:
        return new Date(stringValue);
      default:
        return stringValue;
    }
  };

  // Format value for display
  const formatValue = (value: any, type: VariableType, showHex: boolean): string => {
    if (value === null || value === undefined) {
      return '<Nothing>';
    }

    switch (type) {
      case VariableType.String:
        return `"${value}"`;
      case VariableType.Boolean:
        return value ? 'True' : 'False';
      case VariableType.Integer:
      case VariableType.Long:
        return showHex ? `${value} (0x${value.toString(16).toUpperCase()})` : String(value);
      case VariableType.Date:
        return value instanceof Date ? value.toLocaleString() : String(value);
      case VariableType.Object:
        return `{${value.constructor?.name || 'Object'}}`;
      case VariableType.Array: {
        const bounds = Array.isArray(value) ? `0 To ${value.length - 1}` : '(?)';
        return `Array(${bounds})`;
      }
      default:
        return String(value);
    }
  };

  // Get variable icon based on type and scope
  const getVariableIcon = (variable: LocalVariable): string => {
    if (variable.isError) return '❌';
    if (variable.isModified) return '🔄';

    switch (variable.scope) {
      case VariableScope.Parameter:
        return '📥';
      case VariableScope.Module:
        return '📊';
      case VariableScope.Global:
        return '🌐';
      case VariableScope.Static:
        return '📌';
      case VariableScope.WithBlock:
        return '🔗';
      default:
        switch (variable.type) {
          case VariableType.Object:
            return '📦';
          case VariableType.Array:
            return '📋';
          case VariableType.String:
            return '📝';
          case VariableType.Boolean:
            return '☑️';
          case VariableType.Date:
            return '📅';
          default:
            return '🔢';
        }
    }
  };

  // Render variable row with children
  const renderVariable = (variable: LocalVariable, depth: number = 0): React.ReactNode => {
    const isEditing = editingVariable?.id === variable.id;
    const isSelected = selectedVariable?.id === variable.id;

    return (
      <React.Fragment key={variable.id}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
            isSelected ? 'bg-blue-100' : ''
          } ${variable.isError ? 'bg-red-50' : ''} ${variable.isModified ? 'bg-yellow-50' : ''}`}
          style={{
            paddingLeft: `${8 + depth * 16}px`,
            fontSize: `${settings.fontSize}px`,
          }}
          onClick={() => setSelectedVariable(variable)}
          onDoubleClick={() => startEditing(variable)}
          onContextMenu={e => {
            e.preventDefault();
            setContextMenuVariable(variable);
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
          }}
        >
          {/* Expansion Toggle */}
          <div className="w-4 text-center">
            {variable.hasChildren && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpansion(variable);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                {variable.isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>

          {/* Icon */}
          <span className="w-6 text-center">{getVariableIcon(variable)}</span>

          {/* Name */}
          <div className="w-32 font-mono font-medium text-gray-800 truncate">{variable.name}</div>

          {/* Value */}
          <div className="flex-1 font-mono text-gray-700">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    saveEdit();
                  } else if (e.key === 'Escape') {
                    setEditingVariable(null);
                    setEditValue('');
                  }
                }}
                className="w-full px-1 py-0 border border-blue-300 rounded text-sm"
                autoFocus
              />
            ) : (
              <span className={`truncate ${variable.isError ? 'text-red-600' : ''}`}>
                {variable.displayValue}
              </span>
            )}
          </div>

          {/* Type */}
          <div className="w-20 text-xs text-gray-500 truncate">{variable.type}</div>

          {/* Scope */}
          <div className="w-16 text-xs text-gray-500 truncate">{variable.scope}</div>

          {/* Address (if enabled) */}
          {settings.showAddresses && variable.address && (
            <div className="w-20 text-xs text-gray-400 font-mono">{variable.address}</div>
          )}
        </div>

        {/* Render children if expanded */}
        {variable.isExpanded && variable.children.map(child => renderVariable(child, depth + 1))}
      </React.Fragment>
    );
  };

  // Context menu items
  const contextMenuItems = [
    {
      label: 'Edit Value',
      enabled: contextMenuVariable?.access === VariableAccess.ReadWrite,
      action: () => contextMenuVariable && startEditing(contextMenuVariable),
    },
    {
      label: 'Copy Value',
      enabled: true,
      action: () => contextMenuVariable && onCopyValue?.(contextMenuVariable),
    },
    {
      label: 'Add to Watch',
      enabled: true,
      action: () => contextMenuVariable && onAddToWatch?.(contextMenuVariable),
    },
    {
      label: 'Show in Memory',
      enabled: contextMenuVariable?.address !== undefined,
      action: () => contextMenuVariable && onShowInMemory?.(contextMenuVariable),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Locals</h3>
          {debugSession?.isActive && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {debugSession.currentModule}.{debugSession.currentProcedure}
            </span>
          )}
          {isRefreshing && <div className="text-xs text-blue-600 animate-pulse">Refreshing...</div>}
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
            onClick={refreshVariables}
            disabled={!debugSession?.isActive || isRefreshing}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            title="Refresh"
          >
            🔄
          </button>

          <button
            onClick={() => setSettings(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
            className={`px-2 py-1 text-xs rounded ${
              settings.autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="Auto Refresh"
          >
            ⏰
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200 text-xs">
        <select
          value={settings.sortBy}
          onChange={e => setSettings(prev => ({ ...prev, sortBy: e.target.value as any }))}
          className="px-1 py-1 border border-gray-300 rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
          <option value="scope">Sort by Scope</option>
          <option value="modified">Sort by Modified</option>
        </select>

        <button
          onClick={() =>
            setSettings(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))
          }
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          {settings.sortOrder === 'asc' ? '↑' : '↓'}
        </button>

        <div className="flex items-center gap-1 ml-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={settings.showParameters}
              onChange={e => setSettings(prev => ({ ...prev, showParameters: e.target.checked }))}
            />
            Params
          </label>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={settings.showModuleVariables}
              onChange={e =>
                setSettings(prev => ({ ...prev, showModuleVariables: e.target.checked }))
              }
            />
            Module
          </label>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={settings.showHexValues}
              onChange={e => setSettings(prev => ({ ...prev, showHexValues: e.target.checked }))}
            />
            Hex
          </label>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={settings.showAddresses}
              onChange={e => setSettings(prev => ({ ...prev, showAddresses: e.target.checked }))}
            />
            Addr
          </label>
        </div>
      </div>

      {/* Column Headers */}
      <div
        className="flex items-center py-2 px-2 bg-gray-200 border-b border-gray-300 text-xs font-medium text-gray-700"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <div className="w-4"></div>
        <div className="w-6"></div>
        <div className="w-32">Name</div>
        <div className="flex-1">Value</div>
        <div className="w-20">Type</div>
        <div className="w-16">Scope</div>
        {settings.showAddresses && <div className="w-20">Address</div>}
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto">
        {debugSession?.isActive ? (
          processedVariables.length > 0 ? (
            processedVariables.map(variable => renderVariable(variable))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📭</div>
                <p>No variables in current scope</p>
                {searchText && <p className="text-sm mt-1">Try adjusting search or filters</p>}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">⏸️</div>
              <p className="text-lg">Debug session not active</p>
              <p className="text-sm mt-2">Start debugging to view local variables</p>
            </div>
          </div>
        )}
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
              className={`block w-full text-left px-3 py-1 text-sm ${
                item.enabled ? 'hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!item.enabled}
              onClick={() => {
                if (item.enabled) {
                  item.action();
                }
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
          <span>Variables: {processedVariables.length}</span>
          <span>Modified: {processedVariables.filter(v => v.isModified).length}</span>
          <span>Errors: {processedVariables.filter(v => v.isError).length}</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Last Update: {lastRefresh.toLocaleTimeString()}</span>
          {settings.autoRefresh && <span className="text-green-600">Auto-refresh ON</span>}
        </div>
      </div>
    </div>
  );
};

export default LocalsWindow;
