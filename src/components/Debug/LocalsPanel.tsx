import React, { useState, useEffect, useCallback } from 'react';
import { VB6DebugEngine, VB6Variable, VariableScope, VariableType } from '../../services/VB6DebugEngine';

interface LocalsPanelProps {
  debugEngine: VB6DebugEngine;
  isDebugging: boolean;
}

interface ExpandedState {
  [variableName: string]: boolean;
}

export const LocalsPanel: React.FC<LocalsPanelProps> = ({ debugEngine, isDebugging }) => {
  const [variables, setVariables] = useState<VB6Variable[]>([]);
  const [expandedState, setExpandedState] = useState<ExpandedState>({});
  const [filterScope, setFilterScope] = useState<VariableScope | 'all'>('all');
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const updateVariables = () => {
      if (isDebugging) {
        const allVars = debugEngine.getVariables();
        const filteredVars = filterScope === 'all' 
          ? allVars 
          : allVars.filter(v => v.scope === filterScope);
        setVariables(filteredVars);
      } else {
        setVariables([]);
      }
    };

    const handleVariableChanged = () => {
      updateVariables();
    };

    const handleCallStackChanged = () => {
      updateVariables();
    };

    // Initial load
    updateVariables();

    // Event listeners
    debugEngine.on('variableChanged', handleVariableChanged);
    debugEngine.on('callStackChanged', handleCallStackChanged);
    debugEngine.on('debugPaused', updateVariables);
    debugEngine.on('stepOver', updateVariables);
    debugEngine.on('stepInto', updateVariables);
    debugEngine.on('stepOut', updateVariables);
    debugEngine.on('debugStopped', () => setVariables([]));

    return () => {
      debugEngine.off('variableChanged', handleVariableChanged);
      debugEngine.off('callStackChanged', handleCallStackChanged);
      debugEngine.off('debugPaused', updateVariables);
      debugEngine.off('stepOver', updateVariables);
      debugEngine.off('stepInto', updateVariables);
      debugEngine.off('stepOut', updateVariables);
      debugEngine.off('debugStopped', () => setVariables([]));
    };
  }, [debugEngine, isDebugging, filterScope]);

  const toggleExpanded = useCallback((variableName: string) => {
    setExpandedState(prev => ({
      ...prev,
      [variableName]: !prev[variableName]
    }));
  }, []);

  const handleEditVariable = useCallback((variable: VB6Variable) => {
    setEditingVariable(variable.name);
    setEditValue(formatValueForEditing(variable.value, variable.type));
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingVariable && editValue !== undefined) {
      try {
        const parsedValue = parseValueFromString(editValue, getVariableType(editingVariable));
        debugEngine.setVariable(editingVariable, parsedValue);
        setEditingVariable(null);
        setEditValue('');
      } catch (error) {
        console.error('Error setting variable:', error);
        // Could show error message here
      }
    }
  }, [debugEngine, editingVariable, editValue]);

  const handleCancelEdit = useCallback(() => {
    setEditingVariable(null);
    setEditValue('');
  }, []);

  const getVariableType = (variableName: string): VariableType => {
    const variable = variables.find(v => v.name === variableName);
    return variable?.type || VariableType.Variant;
  };

  const formatValueForEditing = (value: any, type: VariableType): string => {
    if (value === null || value === undefined) return 'Nothing';
    
    switch (type) {
      case VariableType.String:
        return String(value);
      case VariableType.Boolean:
        return value ? 'True' : 'False';
      case VariableType.Date:
        return value instanceof Date ? value.toISOString() : String(value);
      default:
        return String(value);
    }
  };

  const parseValueFromString = (str: string, type: VariableType): any => {
    const trimmed = str.trim();
    
    if (trimmed.toLowerCase() === 'nothing') return null;
    
    switch (type) {
      case VariableType.Boolean:
        return trimmed.toLowerCase() === 'true';
      case VariableType.Integer:
      case VariableType.Long:
        return parseInt(trimmed, 10);
      case VariableType.Single:
      case VariableType.Double:
        return parseFloat(trimmed);
      case VariableType.Date:
        return new Date(trimmed);
      case VariableType.String:
        return trimmed;
      default:
        return trimmed;
    }
  };

  const formatValue = (value: any, type: VariableType): string => {
    if (value === null || value === undefined) {
      return 'Nothing';
    }
    
    switch (type) {
      case VariableType.String:
        return `"${value}"`;
      case VariableType.Boolean:
        return value ? 'True' : 'False';
      case VariableType.Date:
        return value instanceof Date ? value.toLocaleString() : String(value);
      case VariableType.Array:
        return Array.isArray(value) ? `Array(${value.length})` : String(value);
      case VariableType.Object:
        return typeof value === 'object' ? '{Object}' : String(value);
      default:
        return String(value);
    }
  };

  const getScopeColor = (scope: VariableScope): string => {
    switch (scope) {
      case VariableScope.Local:
        return 'bg-blue-100 text-blue-700';
      case VariableScope.Module:
        return 'bg-green-100 text-green-700';
      case VariableScope.Global:
        return 'bg-purple-100 text-purple-700';
      case VariableScope.Static:
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderArrayElements = (variable: VB6Variable): React.ReactNode => {
    if (!variable.isArray || !Array.isArray(variable.value)) return null;
    
    const array = variable.value as any[];
    const bounds = variable.arrayBounds || [{ lower: 0, upper: array.length - 1 }];
    
    return (
      <div className="ml-4 mt-1 space-y-1">
        {array.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-mono">
                ({bounds[0].lower + index})
              </span>
              <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded font-mono text-xs">
                {typeof item === 'object' ? 'Object' : typeof item}
              </span>
            </div>
            <div className="font-mono text-gray-900">
              {formatValue(item, typeof item === 'string' ? VariableType.String : VariableType.Variant)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderObjectMembers = (variable: VB6Variable): React.ReactNode => {
    if (variable.type !== VariableType.Object || !variable.members) return null;
    
    return (
      <div className="ml-4 mt-1 space-y-1">
        {variable.members.map((member, index) => (
          <div key={index} className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-mono">{member.name}</span>
              <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded font-mono text-xs">
                {member.type}
              </span>
            </div>
            <div className="font-mono text-gray-900">
              {formatValue(member.value, member.type)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const scopeOptions = [
    { value: 'all', label: 'All Scopes' },
    { value: VariableScope.Local, label: 'Local' },
    { value: VariableScope.Module, label: 'Module' },
    { value: VariableScope.Global, label: 'Global' },
    { value: VariableScope.Static, label: 'Static' }
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200">
      {/* Header */}
      <div className="p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Locals</h3>
          <div className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded ${
              isDebugging ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {isDebugging ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        {/* Scope Filter */}
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value as VariableScope | 'all')}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          disabled={!isDebugging}
        >
          {scopeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Variables */}
      <div className="flex-1 overflow-y-auto">
        {!isDebugging ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            Start debugging to view local variables.
          </div>
        ) : variables.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            No variables in current scope.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {variables.map((variable) => (
              <div key={variable.name} className="p-2 hover:bg-gray-50 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Expand/Collapse Button */}
                    {(variable.isArray || variable.type === VariableType.Object) && (
                      <button
                        onClick={() => toggleExpanded(variable.name)}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        {expandedState[variable.name] ? '▼' : '▶'}
                      </button>
                    )}
                    
                    {/* Variable Name */}
                    <span className="font-mono text-sm text-blue-600 font-medium">
                      {variable.name}
                    </span>
                    
                    {/* Variable Type */}
                    <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded font-mono text-xs">
                      {variable.type}
                    </span>
                    
                    {/* Scope Badge */}
                    <span className={`px-1 py-0.5 rounded text-xs ${getScopeColor(variable.scope)}`}>
                      {variable.scope}
                    </span>
                    
                    {/* Array Bounds */}
                    {variable.isArray && variable.arrayBounds && (
                      <span className="text-xs text-gray-500">
                        [{variable.arrayBounds.map(b => `${b.lower}..${b.upper}`).join(', ')}]
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleEditVariable(variable)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Edit value"
                      disabled={variable.type === VariableType.Object || variable.isArray}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                
                {/* Variable Value */}
                <div className="mt-1">
                  {editingVariable === variable.name ? (
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
                        className="flex-1 px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none font-mono"
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
                    <div className="font-mono text-xs text-gray-900">
                      {formatValue(variable.value, variable.type)}
                    </div>
                  )}
                </div>
                
                {/* Expanded Content */}
                {expandedState[variable.name] && (
                  <>
                    {variable.isArray && renderArrayElements(variable)}
                    {variable.type === VariableType.Object && renderObjectMembers(variable)}
                  </>
                )}
                
                {/* Additional Info */}
                {variable.address && (
                  <div className="mt-1 text-xs text-gray-500">
                    Address: {variable.address}
                    {variable.size && ` | Size: ${variable.size} bytes`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        {variables.length} variable{variables.length !== 1 ? 's' : ''}
        {filterScope !== 'all' && ` (${filterScope} scope)`}
        {isDebugging && (
          <span className="ml-2">• Values auto-refresh</span>
        )}
      </div>
    </div>
  );
};

export default LocalsPanel;