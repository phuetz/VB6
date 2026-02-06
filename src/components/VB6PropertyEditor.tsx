import React, { useState, useCallback, useEffect } from 'react';
import {
  Settings,
  Eye,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Info,
  Code,
  Type,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  vb6PropertySystem,
  VB6PropertyDescriptor,
  VB6PropertyType,
} from '../services/VB6PropertySystem';

interface VB6PropertyEditorProps {
  className?: string;
  instanceId?: string;
  visible?: boolean;
  onClose?: () => void;
  onPropertyChanged?: (propertyName: string, value: any) => void;
}

interface PropertyGroup {
  name: string;
  get?: VB6PropertyDescriptor;
  let?: VB6PropertyDescriptor;
  set?: VB6PropertyDescriptor;
  expanded: boolean;
}

const VB6PropertyEditor: React.FC<VB6PropertyEditorProps> = ({
  className = 'VB6Module',
  instanceId,
  visible = true,
  onClose,
  onPropertyChanged,
}) => {
  const [properties, setProperties] = useState<PropertyGroup[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filter, setFilter] = useState('');

  // Load properties for the class
  useEffect(() => {
    const loadProperties = () => {
      const classProperties = vb6PropertySystem.getClassProperties(className);
      const propertyGroups: Map<string, PropertyGroup> = new Map();

      // Group properties by name
      for (const prop of classProperties) {
        if (!propertyGroups.has(prop.name)) {
          propertyGroups.set(prop.name, {
            name: prop.name,
            expanded: false,
          });
        }

        const group = propertyGroups.get(prop.name)!;
        switch (prop.propertyType) {
          case VB6PropertyType.Get:
            group.get = prop;
            break;
          case VB6PropertyType.Let:
            group.let = prop;
            break;
          case VB6PropertyType.Set:
            group.set = prop;
            break;
        }
      }

      setProperties(
        Array.from(propertyGroups.values()).sort((a, b) => a.name.localeCompare(b.name))
      );
    };

    loadProperties();
  }, [className]);

  // Get current property value
  const getPropertyValue = useCallback(
    (propertyName: string): any => {
      if (!instanceId) return undefined;

      try {
        return vb6PropertySystem.getProperty(instanceId, propertyName);
      } catch (error) {
        console.warn(`Could not get property ${propertyName}:`, error);
        return undefined;
      }
    },
    [instanceId]
  );

  // Set property value
  const setPropertyValue = useCallback(
    (propertyName: string, value: any, isObjectAssignment: boolean = false) => {
      if (!instanceId) return;

      try {
        if (isObjectAssignment) {
          vb6PropertySystem.setProperty(instanceId, propertyName, value);
        } else {
          vb6PropertySystem.letProperty(instanceId, propertyName, value);
        }

        if (onPropertyChanged) {
          onPropertyChanged(propertyName, value);
        }
      } catch (error) {
        console.error(`Could not set property ${propertyName}:`, error);
      }
    },
    [instanceId, onPropertyChanged]
  );

  // Toggle property group expansion
  const toggleExpanded = useCallback((propertyName: string) => {
    setProperties(prev =>
      prev.map(prop => (prop.name === propertyName ? { ...prop, expanded: !prop.expanded } : prop))
    );
  }, []);

  // Start editing a property
  const startEdit = useCallback(
    (propertyName: string) => {
      const currentValue = getPropertyValue(propertyName);
      setEditingProperty(propertyName);
      setEditValue(formatValueForEdit(currentValue));
    },
    [getPropertyValue]
  );

  // Save edited property
  const saveEdit = useCallback(() => {
    if (!editingProperty) return;

    try {
      const parsedValue = parseEditValue(editValue);
      const isObject = typeof parsedValue === 'object' && parsedValue !== null;
      setPropertyValue(editingProperty, parsedValue, isObject);
      setEditingProperty(null);
      setEditValue('');
    } catch (error) {
      console.error('Error parsing property value:', error);
    }
  }, [editingProperty, editValue, setPropertyValue]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingProperty(null);
    setEditValue('');
  }, []);

  // Format value for display
  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'Nothing';
    if (typeof value === 'string') return `"${value}"`;
    if (value instanceof Date) return value.toLocaleString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return Object.prototype.toString.call(value);
    return String(value);
  }, []);

  // Format value for editing
  const formatValueForEdit = useCallback((value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }, []);

  // Parse edited value
  const parseEditValue = useCallback((editValue: string): any => {
    if (editValue === '') return null;

    // Try to parse as JSON first
    try {
      return JSON.parse(editValue);
    } catch {
      // If not JSON, try other formats
      const trimmed = editValue.trim();

      // Boolean
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;

      // Number
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue)) return numValue;

      // Date
      const dateValue = new Date(trimmed);
      if (!isNaN(dateValue.getTime())) return dateValue;

      // Default to string
      return trimmed;
    }
  }, []);

  // Filter properties
  const filteredProperties = properties.filter(
    prop => filter === '' || prop.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Get property type info
  const getPropertyTypeInfo = useCallback((group: PropertyGroup): string => {
    const types = [];
    if (group.get) types.push('Get');
    if (group.let) types.push('Let');
    if (group.set) types.push('Set');
    return types.join('/');
  }, []);

  // Check if property is read-only
  const isReadOnly = useCallback((group: PropertyGroup): boolean => {
    return !!group.get && !group.let && !group.set;
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-white border border-gray-300 flex flex-col h-96">
      {/* Title Bar */}
      <div className="bg-gray-100 border-b px-3 py-1 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-blue-600" />
          <span className="font-medium text-sm">VB6 Property Editor</span>
          <span className="text-xs text-gray-500">({className})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1 rounded text-xs ${showAdvanced ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
            title="Advanced View"
          >
            <Code size={14} />
          </button>

          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded" title="Close">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b bg-gray-50 px-3 py-2">
        <input
          type="text"
          placeholder="Filter properties..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* Properties List */}
      <div className="flex-1 overflow-auto">
        {filteredProperties.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Settings size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No properties found</p>
            {instanceId ? (
              <p className="text-xs text-gray-400 mt-1">Instance: {instanceId}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">No instance selected</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredProperties.map(group => (
              <div key={group.name} className="p-2">
                <div
                  className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded ${
                    selectedProperty === group.name ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedProperty(group.name);
                    toggleExpanded(group.name);
                  }}
                >
                  {/* Expand/Collapse */}
                  {group.expanded ? (
                    <ChevronDown size={14} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}

                  {/* Property Name */}
                  <span className="font-medium text-sm">{group.name}</span>

                  {/* Property Type Badge */}
                  <span className="text-xs bg-gray-100 text-gray-700 px-1 rounded">
                    {getPropertyTypeInfo(group)}
                  </span>

                  {/* Read-only indicator */}
                  {isReadOnly(group) && (
                    <Lock size={12} className="text-gray-400" title="Read-only" />
                  )}

                  {/* Current Value (if instance available) */}
                  {instanceId && (
                    <span className="text-xs text-gray-600 flex-1 text-right truncate">
                      {editingProperty === group.name ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="text-xs border border-blue-300 rounded px-1 py-0.5 w-20"
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={saveEdit}
                            className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Save size={10} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {formatValue(getPropertyValue(group.name))}
                          {!isReadOnly(group) && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                startEdit(group.name);
                              }}
                              className="p-0.5 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Edit3 size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </span>
                  )}
                </div>

                {/* Expanded Details */}
                {group.expanded && showAdvanced && (
                  <div className="ml-6 mt-2 text-xs space-y-1">
                    {group.get && (
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-medium text-green-700">Property Get</div>
                        <div className="text-gray-600">
                          Returns: {group.get.returnType || 'Variant'}
                        </div>
                        {group.get.parameters.length > 0 && (
                          <div className="text-gray-600">
                            Parameters:{' '}
                            {group.get.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {group.let && (
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="font-medium text-blue-700">Property Let</div>
                        <div className="text-gray-600">
                          Accepts value types (String, Integer, etc.)
                        </div>
                        {group.let.parameters.length > 0 && (
                          <div className="text-gray-600">
                            Parameters:{' '}
                            {group.let.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {group.set && (
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="font-medium text-purple-700">Property Set</div>
                        <div className="text-gray-600">Accepts object references</div>
                        {group.set.parameters.length > 0 && (
                          <div className="text-gray-600">
                            Parameters:{' '}
                            {group.set.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t bg-gray-100 px-3 py-1 text-xs text-gray-600 flex justify-between">
        <span>
          {filteredProperties.length} properties
          {instanceId && ` | Instance: ${instanceId.split('_')[0]}`}
        </span>
        <span>{editingProperty ? 'Editing...' : 'Click to expand, double-click to edit'}</span>
      </div>
    </div>
  );
};

export default VB6PropertyEditor;
