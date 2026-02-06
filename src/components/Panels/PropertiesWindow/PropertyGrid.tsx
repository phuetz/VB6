import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Settings,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
} from 'lucide-react';
import { PropertyDefinition } from './PropertyManager';
import { PropertyValidator, ValidationResult } from './PropertyValidator';
import {
  ColorEditor,
  FontEditor,
  PictureEditor,
  EnumEditor,
  BooleanEditor,
  StringEditor,
  NumberEditor,
} from './PropertyEditors';
import {
  MenuEditor,
  TabOrderEditor,
  DataSourceEditor,
  IconEditor,
  CodeEditor,
} from './AdvancedPropertyEditors';

interface PropertyGridProps {
  properties: PropertyDefinition[];
  values: Record<string, any>;
  onChange: (propertyName: string, value: any) => void;
  onValidationError?: (propertyName: string, error: string) => void;
  className?: string;
  readOnly?: boolean;
  showCategories?: boolean;
  showDescriptions?: boolean;
  showIcons?: boolean;
  showValidation?: boolean;
}

interface PropertyGroup {
  category: string;
  properties: PropertyDefinition[];
  expanded: boolean;
  visible: boolean;
}

interface SortConfig {
  field: 'name' | 'category' | 'type';
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  text: string;
  category: string;
  type: string;
  modified: boolean;
  showReadOnly: boolean;
  showAdvanced: boolean;
}

const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  values,
  onChange,
  onValidationError,
  className = '',
  readOnly = false,
  showCategories = true,
  showDescriptions = true,
  showIcons = true,
  showValidation = true,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Appearance', 'Behavior', 'Layout'])
  );
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [pinnedProperties, setPinnedProperties] = useState<Set<string>>(new Set());
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(
    new Map()
  );
  const [modifiedProperties, setModifiedProperties] = useState<Set<string>>(new Set());

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    text: '',
    category: '',
    type: '',
    modified: false,
    showReadOnly: true,
    showAdvanced: false,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const propertyRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get property icon based on type
  const getPropertyIcon = useCallback((propDef: PropertyDefinition) => {
    const iconProps = { size: 12, className: `vb6-property-icon ${propDef.type}` };

    switch (propDef.type) {
      case 'string':
        return <span className="text-blue-600 font-mono text-xs">Ab</span>;
      case 'number':
        return <span className="text-green-600 font-mono text-xs">123</span>;
      case 'boolean':
        return <span className="text-purple-600 font-mono text-xs">T/F</span>;
      case 'color':
        return (
          <div className="w-3 h-3 border border-gray-400 bg-gradient-to-r from-red-500 to-blue-500 rounded-sm" />
        );
      case 'font':
        return <span className="text-gray-600 font-serif text-xs italic">Aa</span>;
      case 'enum':
        return <span className="text-orange-600 text-xs">▼</span>;
      case 'picture':
        return (
          <div className="w-3 h-3 border border-gray-400 bg-gray-200 flex items-center justify-center text-xs">
            🖼
          </div>
        );
      case 'code':
        return <span className="text-indigo-600 font-mono text-xs">{}</span>;
      case 'datasource':
        return <span className="text-teal-600 font-mono text-xs">DB</span>;
      case 'menu':
        return <span className="text-gray-600 text-xs">☰</span>;
      case 'icon':
        return <span className="text-yellow-600 text-xs">⚡</span>;
      case 'cursor':
        return <span className="text-gray-600 text-xs">↖</span>;
      default:
        return <span className="text-gray-400 text-xs">?</span>;
    }
  }, []);

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    const filtered = properties.filter(prop => {
      // Text filter
      if (
        filterConfig.text &&
        !prop.name.toLowerCase().includes(filterConfig.text.toLowerCase()) &&
        !prop.description.toLowerCase().includes(filterConfig.text.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (filterConfig.category && prop.category !== filterConfig.category) {
        return false;
      }

      // Type filter
      if (filterConfig.type && prop.type !== filterConfig.type) {
        return false;
      }

      // Modified filter
      if (filterConfig.modified && !modifiedProperties.has(prop.name)) {
        return false;
      }

      // Read-only filter
      if (!filterConfig.showReadOnly && prop.readOnly) {
        return false;
      }

      // Advanced filter (design-time vs runtime)
      if (!filterConfig.showAdvanced && prop.designTime) {
        return false;
      }

      return true;
    });

    // Sort properties
    filtered.sort((a, b) => {
      let aValue: string, bValue: string;

      switch (sortConfig.field) {
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      const result = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? result : -result;
    });

    return filtered;
  }, [properties, filterConfig, sortConfig, modifiedProperties]);

  // Group properties by category
  const propertyGroups = useMemo(() => {
    if (!showCategories) {
      return [
        {
          category: 'All Properties',
          properties: filteredAndSortedProperties,
          expanded: true,
          visible: true,
        },
      ];
    }

    const groups = new Map<string, PropertyDefinition[]>();

    filteredAndSortedProperties.forEach(prop => {
      if (!groups.has(prop.category)) {
        groups.set(prop.category, []);
      }
      groups.get(prop.category)!.push(prop);
    });

    return Array.from(groups.entries()).map(([category, props]) => ({
      category,
      properties: props,
      expanded: expandedCategories.has(category),
      visible: true,
    }));
  }, [filteredAndSortedProperties, showCategories, expandedCategories]);

  // Handle property value change with validation
  const handlePropertyChange = useCallback(
    (propertyName: string, newValue: any) => {
      const propDef = properties.find(p => p.name === propertyName);
      if (!propDef || propDef.readOnly) return;

      // Validate the new value
      const validationResult = PropertyValidator.validateProperty(propDef.type, newValue, {
        enumValues: propDef.enumValues,
        min: propDef.validation?.min,
        max: propDef.validation?.max,
        maxLength: propDef.validation?.max,
        pattern: propDef.validation?.pattern,
      });

      // Update validation results
      setValidationResults(prev => {
        const newResults = new Map(prev);
        newResults.set(propertyName, validationResult);
        return newResults;
      });

      // Mark as modified
      setModifiedProperties(prev => new Set(prev).add(propertyName));

      // Use corrected value if provided
      const finalValue =
        validationResult.correctedValue !== undefined ? validationResult.correctedValue : newValue;

      // Call onChange with final value
      onChange(propertyName, finalValue);

      // Report validation error if applicable
      if (!validationResult.isValid && onValidationError) {
        onValidationError(propertyName, validationResult.errorMessage || 'Invalid value');
      }
    },
    [properties, onChange, onValidationError]
  );

  // Toggle category expansion
  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  // Toggle property pinning
  const togglePin = useCallback((propertyName: string) => {
    setPinnedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyName)) {
        newSet.delete(propertyName);
      } else {
        newSet.add(propertyName);
      }
      return newSet;
    });
  }, []);

  // Handle sort change
  const handleSort = useCallback((field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Render property editor
  const renderPropertyEditor = useCallback(
    (propDef: PropertyDefinition, value: any) => {
      const isEditing = editingProperty === propDef.name;
      const validationResult = validationResults.get(propDef.name);
      const hasError = validationResult && !validationResult.isValid;

      const editorProps = {
        value: value ?? propDef.defaultValue ?? '',
        onChange: (newValue: any) => handlePropertyChange(propDef.name, newValue),
        onFinish: () => setEditingProperty(null),
        readOnly: readOnly || propDef.readOnly,
      };

      const editorClassName = `vb6-property-value ${hasError ? 'error' : ''} ${propDef.readOnly ? 'readonly' : ''}`;

      switch (propDef.type) {
        case 'color':
          return (
            <div className={editorClassName}>
              <ColorEditor {...editorProps} />
            </div>
          );

        case 'font':
          return (
            <div className={editorClassName}>
              <FontEditor {...editorProps} />
            </div>
          );

        case 'picture':
          return (
            <div className={editorClassName}>
              <PictureEditor {...editorProps} />
            </div>
          );

        case 'enum':
          return (
            <div className={editorClassName}>
              <EnumEditor {...editorProps} enumValues={propDef.enumValues || []} />
            </div>
          );

        case 'boolean':
          return (
            <div className={editorClassName}>
              <BooleanEditor {...editorProps} />
            </div>
          );

        case 'number':
          return (
            <div className={editorClassName}>
              <NumberEditor
                {...editorProps}
                min={propDef.validation?.min}
                max={propDef.validation?.max}
              />
            </div>
          );

        case 'code':
          return (
            <div className={editorClassName}>
              <CodeEditor {...editorProps} />
            </div>
          );

        case 'datasource':
          return (
            <div className={editorClassName}>
              <DataSourceEditor {...editorProps} />
            </div>
          );

        case 'menu':
          return (
            <div className={editorClassName}>
              <MenuEditor {...editorProps} />
            </div>
          );

        case 'icon':
          return (
            <div className={editorClassName}>
              <IconEditor {...editorProps} type="icon" />
            </div>
          );

        case 'cursor':
          return (
            <div className={editorClassName}>
              <IconEditor {...editorProps} type="cursor" />
            </div>
          );

        case 'string':
        default:
          return (
            <div className={editorClassName}>
              <StringEditor
                {...editorProps}
                multiline={propDef.name === 'ToolTipText' || propDef.name === 'Tag'}
              />
            </div>
          );
      }
    },
    [editingProperty, validationResults, handlePropertyChange, readOnly]
  );

  // Render validation indicator
  const renderValidationIndicator = useCallback(
    (propertyName: string) => {
      if (!showValidation) return null;

      const result = validationResults.get(propertyName);
      if (!result) return null;

      if (!result.isValid) {
        return (
          <AlertTriangle size={12} className="text-red-500 ml-1" title={result.errorMessage} />
        );
      }

      if (result.warnings && result.warnings.length > 0) {
        return (
          <Info size={12} className="text-yellow-500 ml-1" title={result.warnings.join(', ')} />
        );
      }

      if (result.correctedValue !== undefined) {
        return (
          <CheckCircle
            size={12}
            className="text-green-500 ml-1"
            title="Value was automatically corrected"
          />
        );
      }

      return null;
    },
    [validationResults, showValidation]
  );

  return (
    <div className={`vb6-properties-grid ${className}`} ref={gridRef}>
      {/* Toolbar */}
      <div className="vb6-properties-toolbar">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSort('name')}
            className={`vb6-toolbar-button ${sortConfig.field === 'name' ? 'pressed' : ''}`}
            title="Sort by Name"
          >
            {sortConfig.field === 'name' && sortConfig.direction === 'desc' ? (
              <SortDesc size={12} />
            ) : (
              <SortAsc size={12} />
            )}
          </button>

          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`vb6-toolbar-button ${showFilterPanel ? 'pressed' : ''}`}
            title="Filter Properties"
          >
            <Filter size={12} />
          </button>

          <div className="flex-1" />

          <button className="vb6-toolbar-button" title="Settings">
            <Settings size={12} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="border-b border-gray-400 p-2 bg-gray-100">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              placeholder="Search properties..."
              value={filterConfig.text}
              onChange={e => setFilterConfig(prev => ({ ...prev, text: e.target.value }))}
              className="vb6-search-input"
            />

            <select
              value={filterConfig.category}
              onChange={e => setFilterConfig(prev => ({ ...prev, category: e.target.value }))}
              className="vb6-search-input"
            >
              <option value="">All Categories</option>
              {Array.from(new Set(properties.map(p => p.category))).map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterConfig.type}
              onChange={e => setFilterConfig(prev => ({ ...prev, type: e.target.value }))}
              className="vb6-search-input"
            >
              <option value="">All Types</option>
              {Array.from(new Set(properties.map(p => p.type))).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 mt-2 text-xs">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filterConfig.modified}
                onChange={e => setFilterConfig(prev => ({ ...prev, modified: e.target.checked }))}
                className="mr-1"
              />
              Modified Only
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filterConfig.showReadOnly}
                onChange={e =>
                  setFilterConfig(prev => ({ ...prev, showReadOnly: e.target.checked }))
                }
                className="mr-1"
              />
              Show Read-Only
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filterConfig.showAdvanced}
                onChange={e =>
                  setFilterConfig(prev => ({ ...prev, showAdvanced: e.target.checked }))
                }
                className="mr-1"
              />
              Show Advanced
            </label>
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="vb6-properties-list">
        {propertyGroups.map(group => (
          <div key={group.category}>
            {/* Category Header */}
            {showCategories && (
              <div className="vb6-category-header" onClick={() => toggleCategory(group.category)}>
                <span className="vb6-category-icon">
                  {group.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                {group.category} ({group.properties.length})
              </div>
            )}

            {/* Properties */}
            {(!showCategories || group.expanded) &&
              group.properties.map(propDef => {
                const value = values[propDef.name];
                const isSelected = selectedProperty === propDef.name;
                const isModified = modifiedProperties.has(propDef.name);
                const isPinned = pinnedProperties.has(propDef.name);

                return (
                  <div
                    key={propDef.name}
                    ref={el => el && propertyRefs.current.set(propDef.name, el)}
                    className={`vb6-property-row ${isSelected ? 'selected' : ''} ${isModified ? 'modified' : ''} ${isPinned ? 'pinned' : ''}`}
                    onClick={() => setSelectedProperty(propDef.name)}
                  >
                    {/* Property Name */}
                    <div className={`vb6-property-name ${propDef.readOnly ? 'readonly' : ''}`}>
                      <div className="flex items-center gap-1">
                        {showIcons && getPropertyIcon(propDef)}
                        <span className="flex-1">{propDef.name}</span>
                        {isPinned && <Pin size={10} className="text-blue-600" />}
                        {renderValidationIndicator(propDef.name)}
                      </div>

                      {!readOnly && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            togglePin(propDef.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 rounded"
                          title={isPinned ? 'Unpin' : 'Pin'}
                        >
                          {isPinned ? <PinOff size={10} /> : <Pin size={10} />}
                        </button>
                      )}
                    </div>

                    {/* Property Value */}
                    <div className="vb6-property-value">{renderPropertyEditor(propDef, value)}</div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {/* Description Panel */}
      {showDescriptions && selectedProperty && (
        <div className="vb6-description-panel">
          {(() => {
            const propDef = properties.find(p => p.name === selectedProperty);
            if (!propDef) return null;

            return (
              <>
                <div className="vb6-description-title">{propDef.name}</div>
                <div className="vb6-description-text">{propDef.description}</div>
                {propDef.type !== 'string' && (
                  <div className="text-xs text-gray-600 mt-1">Type: {propDef.type}</div>
                )}
                {propDef.enumValues && (
                  <div className="text-xs text-gray-600 mt-1">
                    Values: {propDef.enumValues.join(', ')}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
