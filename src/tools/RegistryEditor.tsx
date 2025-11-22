import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Registry Hives
export enum RegistryHive {
  HKEY_CLASSES_ROOT = 'HKEY_CLASSES_ROOT',
  HKEY_CURRENT_USER = 'HKEY_CURRENT_USER',
  HKEY_LOCAL_MACHINE = 'HKEY_LOCAL_MACHINE',
  HKEY_USERS = 'HKEY_USERS',
  HKEY_CURRENT_CONFIG = 'HKEY_CURRENT_CONFIG'
}

// Registry Value Types
export enum RegistryValueType {
  REG_SZ = 'String',
  REG_EXPAND_SZ = 'Expandable String',
  REG_MULTI_SZ = 'Multi-String',
  REG_DWORD = 'DWORD',
  REG_QWORD = 'QWORD',
  REG_BINARY = 'Binary',
  REG_NONE = 'None'
}

// Registry Key
export interface RegistryKey {
  id: string;
  path: string;
  name: string;
  hive: RegistryHive;
  hasSubkeys: boolean;
  subkeys?: RegistryKey[];
  values?: RegistryValue[];
  lastModified?: Date;
  permissions?: string[];
}

// Registry Value
export interface RegistryValue {
  id: string;
  name: string;
  type: RegistryValueType;
  data: any;
  size: number;
}

// Search Options
export interface SearchOptions {
  searchKeys: boolean;
  searchValueNames: boolean;
  searchValueData: boolean;
  matchWholeString: boolean;
  caseSensitive: boolean;
}

// Export Format
export enum ExportFormat {
  REG = 'Registration Files (*.reg)',
  REG4 = 'Registration Files Version 4 (*.reg)',
  TXT = 'Text Files (*.txt)',
  HIVE = 'Registry Hive Files (*.hiv)'
}

// Permission
export interface Permission {
  user: string;
  allow: string[];
  deny: string[];
}

interface RegistryEditorProps {
  onKeySelect?: (key: RegistryKey) => void;
  onValueChange?: (key: RegistryKey, value: RegistryValue) => void;
  onError?: (error: string) => void;
}

export const RegistryEditor: React.FC<RegistryEditorProps> = ({
  onKeySelect,
  onValueChange,
  onError
}) => {
  const [selectedKey, setSelectedKey] = useState<RegistryKey | null>(null);
  const [selectedValue, setSelectedValue] = useState<RegistryValue | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    searchKeys: true,
    searchValueNames: true,
    searchValueData: true,
    matchWholeString: false,
    caseSensitive: false
  });
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showValueDialog, setShowValueDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [valueForm, setValueForm] = useState({
    name: '',
    type: RegistryValueType.REG_SZ,
    data: ''
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `reg_${nextId.current++}`, []);

  // Sample registry structure
  const sampleRegistry: RegistryKey[] = [
    {
      id: generateId(),
      path: 'HKEY_CLASSES_ROOT',
      name: 'HKEY_CLASSES_ROOT',
      hive: RegistryHive.HKEY_CLASSES_ROOT,
      hasSubkeys: true,
      subkeys: [
        {
          id: generateId(),
          path: 'HKEY_CLASSES_ROOT\\.vbp',
          name: '.vbp',
          hive: RegistryHive.HKEY_CLASSES_ROOT,
          hasSubkeys: true,
          values: [
            {
              id: generateId(),
              name: '(Default)',
              type: RegistryValueType.REG_SZ,
              data: 'VisualBasic.Project',
              size: 20
            }
          ]
        },
        {
          id: generateId(),
          path: 'HKEY_CLASSES_ROOT\\CLSID',
          name: 'CLSID',
          hive: RegistryHive.HKEY_CLASSES_ROOT,
          hasSubkeys: true,
          subkeys: [
            {
              id: generateId(),
              path: 'HKEY_CLASSES_ROOT\\CLSID\\{00000000-0000-0000-0000-000000000000}',
              name: '{00000000-0000-0000-0000-000000000000}',
              hive: RegistryHive.HKEY_CLASSES_ROOT,
              hasSubkeys: true,
              values: [
                {
                  id: generateId(),
                  name: '(Default)',
                  type: RegistryValueType.REG_SZ,
                  data: 'My COM Component',
                  size: 16
                },
                {
                  id: generateId(),
                  name: 'InprocServer32',
                  type: RegistryValueType.REG_SZ,
                  data: 'C:\\Windows\\System32\\mycomponent.dll',
                  size: 35
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: generateId(),
      path: 'HKEY_CURRENT_USER',
      name: 'HKEY_CURRENT_USER',
      hive: RegistryHive.HKEY_CURRENT_USER,
      hasSubkeys: true,
      subkeys: [
        {
          id: generateId(),
          path: 'HKEY_CURRENT_USER\\Software',
          name: 'Software',
          hive: RegistryHive.HKEY_CURRENT_USER,
          hasSubkeys: true,
          subkeys: [
            {
              id: generateId(),
              path: 'HKEY_CURRENT_USER\\Software\\Microsoft',
              name: 'Microsoft',
              hive: RegistryHive.HKEY_CURRENT_USER,
              hasSubkeys: true,
              subkeys: [
                {
                  id: generateId(),
                  path: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Visual Basic',
                  name: 'Visual Basic',
                  hive: RegistryHive.HKEY_CURRENT_USER,
                  hasSubkeys: true,
                  subkeys: [
                    {
                      id: generateId(),
                      path: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Visual Basic\\6.0',
                      name: '6.0',
                      hive: RegistryHive.HKEY_CURRENT_USER,
                      hasSubkeys: true,
                      values: [
                        {
                          id: generateId(),
                          name: 'GridSize',
                          type: RegistryValueType.REG_DWORD,
                          data: 8,
                          size: 4
                        },
                        {
                          id: generateId(),
                          name: 'ShowGrid',
                          type: RegistryValueType.REG_DWORD,
                          data: 1,
                          size: 4
                        },
                        {
                          id: generateId(),
                          name: 'LastProject',
                          type: RegistryValueType.REG_SZ,
                          data: 'C:\\Projects\\MyApp\\Project1.vbp',
                          size: 31
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: generateId(),
      path: 'HKEY_LOCAL_MACHINE',
      name: 'HKEY_LOCAL_MACHINE',
      hive: RegistryHive.HKEY_LOCAL_MACHINE,
      hasSubkeys: true,
      subkeys: [
        {
          id: generateId(),
          path: 'HKEY_LOCAL_MACHINE\\SOFTWARE',
          name: 'SOFTWARE',
          hive: RegistryHive.HKEY_LOCAL_MACHINE,
          hasSubkeys: true
        },
        {
          id: generateId(),
          path: 'HKEY_LOCAL_MACHINE\\SYSTEM',
          name: 'SYSTEM',
          hive: RegistryHive.HKEY_LOCAL_MACHINE,
          hasSubkeys: true
        }
      ]
    }
  ];

  const [registryKeys, setRegistryKeys] = useState<RegistryKey[]>(sampleRegistry);

  // Load subkeys dynamically
  const loadSubkeys = useCallback((key: RegistryKey) => {
    if (!key.subkeys || key.subkeys.length === 0) {
      // Simulate loading subkeys
      const newSubkeys: RegistryKey[] = [];
      for (let i = 0; i < 3; i++) {
        newSubkeys.push({
          id: generateId(),
          path: `${key.path}\\Subkey${i + 1}`,
          name: `Subkey${i + 1}`,
          hive: key.hive,
          hasSubkeys: Math.random() > 0.5,
          values: [
            {
              id: generateId(),
              name: '(Default)',
              type: RegistryValueType.REG_SZ,
              data: '',
              size: 0
            }
          ]
        });
      }
      key.subkeys = newSubkeys;
    }
  }, [generateId]);

  // Toggle key expansion
  const toggleKey = useCallback((key: RegistryKey) => {
    setExpandedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key.path)) {
        newSet.delete(key.path);
      } else {
        loadSubkeys(key);
        newSet.add(key.path);
      }
      return newSet;
    });
  }, [loadSubkeys]);

  // Select key
  const selectKey = useCallback((key: RegistryKey) => {
    setSelectedKey(key);
    setSelectedValue(null);
    setCurrentPath(key.path);
    
    // Add to history
    setHistory(prev => {
      const newHistory = [key.path, ...prev.filter(p => p !== key.path)].slice(0, 20);
      return newHistory;
    });

    onKeySelect?.(key);
    eventEmitter.current.emit('keySelected', key);
  }, [onKeySelect]);

  // Create new key
  const createKey = useCallback(() => {
    if (!selectedKey) {
      onError?.('Please select a parent key');
      return;
    }

    const name = prompt('Enter key name:');
    if (!name) return;

    const newKey: RegistryKey = {
      id: generateId(),
      path: `${selectedKey.path}\\${name}`,
      name: name,
      hive: selectedKey.hive,
      hasSubkeys: false,
      values: [
        {
          id: generateId(),
          name: '(Default)',
          type: RegistryValueType.REG_SZ,
          data: '',
          size: 0
        }
      ]
    };

    if (!selectedKey.subkeys) {
      selectedKey.subkeys = [];
    }
    selectedKey.subkeys.push(newKey);
    selectedKey.hasSubkeys = true;

    // Expand parent and select new key
    setExpandedKeys(prev => new Set([...prev, selectedKey.path]));
    selectKey(newKey);

    eventEmitter.current.emit('keyCreated', newKey);
  }, [selectedKey, generateId, selectKey, onError]);

  // Delete key
  const deleteKey = useCallback(() => {
    if (!selectedKey) return;

    if (!window.confirm(`Delete key "${selectedKey.name}" and all its subkeys?`)) {
      return;
    }

    // Find parent and remove key
    const parentPath = selectedKey.path.substring(0, selectedKey.path.lastIndexOf('\\'));
    
    const removeFromTree = (keys: RegistryKey[]): boolean => {
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].path === selectedKey.path) {
          keys.splice(i, 1);
          return true;
        }
        if (keys[i].subkeys && removeFromTree(keys[i].subkeys!)) {
          if (keys[i].subkeys!.length === 0) {
            keys[i].hasSubkeys = false;
          }
          return true;
        }
      }
      return false;
    };

    const newKeys = [...registryKeys];
    removeFromTree(newKeys);
    setRegistryKeys(newKeys);
    setSelectedKey(null);

    eventEmitter.current.emit('keyDeleted', selectedKey);
  }, [selectedKey, registryKeys]);

  // Create new value
  const createValue = useCallback(() => {
    if (!selectedKey) {
      onError?.('Please select a key');
      return;
    }

    setValueForm({
      name: '',
      type: RegistryValueType.REG_SZ,
      data: ''
    });
    setShowValueDialog(true);
  }, [selectedKey, onError]);

  // Save value
  const saveValue = useCallback(() => {
    if (!selectedKey || !valueForm.name) return;

    const newValue: RegistryValue = {
      id: generateId(),
      name: valueForm.name,
      type: valueForm.type,
      data: valueForm.data,
      size: String(valueForm.data).length
    };

    if (!selectedKey.values) {
      selectedKey.values = [];
    }

    if (selectedValue) {
      // Update existing value
      const index = selectedKey.values.findIndex(v => v.id === selectedValue.id);
      if (index >= 0) {
        selectedKey.values[index] = { ...newValue, id: selectedValue.id };
      }
    } else {
      // Add new value
      selectedKey.values.push(newValue);
    }

    setSelectedKey({ ...selectedKey });
    setShowValueDialog(false);
    onValueChange?.(selectedKey, newValue);
    eventEmitter.current.emit('valueChanged', selectedKey, newValue);
  }, [selectedKey, selectedValue, valueForm, generateId, onValueChange]);

  // Delete value
  const deleteValue = useCallback((value: RegistryValue) => {
    if (!selectedKey) return;

    if (!window.confirm(`Delete value "${value.name}"?`)) {
      return;
    }

    selectedKey.values = selectedKey.values?.filter(v => v.id !== value.id) || [];
    setSelectedKey({ ...selectedKey });
    
    if (selectedValue?.id === value.id) {
      setSelectedValue(null);
    }

    eventEmitter.current.emit('valueDeleted', selectedKey, value);
  }, [selectedKey, selectedValue]);

  // Export registry
  const exportRegistry = useCallback((format: ExportFormat, path: string) => {
    if (!selectedKey) return;

    let content = '';

    if (format === ExportFormat.REG) {
      content = 'Windows Registry Editor Version 5.00\n\n';
      
      const exportKey = (key: RegistryKey, indent: string = '') => {
        content += `[${key.path}]\n`;
        
        if (key.values) {
          key.values.forEach(value => {
            if (value.name === '(Default)') {
              content += `@="${value.data}"\n`;
            } else {
              switch (value.type) {
                case RegistryValueType.REG_SZ:
                  content += `"${value.name}"="${value.data}"\n`;
                  break;
                case RegistryValueType.REG_DWORD:
                  content += `"${value.name}"=dword:${value.data.toString(16).padStart(8, '0')}\n`;
                  break;
                case RegistryValueType.REG_BINARY:
                  content += `"${value.name}"=hex:${value.data}\n`;
                  break;
              }
            }
          });
        }
        content += '\n';

        if (key.subkeys) {
          key.subkeys.forEach(subkey => exportKey(subkey));
        }
      };

      exportKey(selectedKey);
    }

    // Simulate file save
    console.log(`Exporting to ${path} in ${format} format:\n${content}`);
    eventEmitter.current.emit('exported', path, format);
  }, [selectedKey]);

  // Search registry
  const searchRegistry = useCallback(() => {
    if (!searchText) return;

    console.log('Searching for:', searchText, 'with options:', searchOptions);
    // Implementation would search through registry tree
    eventEmitter.current.emit('search', searchText, searchOptions);
  }, [searchText, searchOptions]);

  // Refresh
  const refresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      eventEmitter.current.emit('refreshed');
    }, 500);
  }, []);

  // Get icon for value type
  const getValueTypeIcon = useCallback((type: RegistryValueType): string => {
    switch (type) {
      case RegistryValueType.REG_SZ:
      case RegistryValueType.REG_EXPAND_SZ:
      case RegistryValueType.REG_MULTI_SZ:
        return '📝';
      case RegistryValueType.REG_DWORD:
      case RegistryValueType.REG_QWORD:
        return '🔢';
      case RegistryValueType.REG_BINARY:
        return '📊';
      default:
        return '📄';
    }
  }, []);

  // Format value data
  const formatValueData = useCallback((value: RegistryValue): string => {
    switch (value.type) {
      case RegistryValueType.REG_DWORD:
        return `0x${value.data.toString(16).padStart(8, '0')} (${value.data})`;
      case RegistryValueType.REG_BINARY:
        return value.data || '(zero-length binary value)';
      case RegistryValueType.REG_MULTI_SZ:
        return Array.isArray(value.data) ? value.data.join(', ') : value.data;
      default:
        return value.data || '(value not set)';
    }
  }, []);

  // Render registry tree
  const renderTree = useCallback((keys: RegistryKey[], level: number = 0): React.ReactNode => {
    return keys.map(key => {
      const isExpanded = expandedKeys.has(key.path);
      const isSelected = selectedKey?.path === key.path;

      return (
        <div key={key.id}>
          <div
            className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-100 cursor-pointer ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => selectKey(key)}
          >
            <span
              className="text-xs cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleKey(key);
              }}
            >
              {key.hasSubkeys ? (isExpanded ? '▼' : '▶') : '  '}
            </span>
            <span className="text-sm">📁</span>
            <span className="text-sm flex-1">{key.name}</span>
          </div>
          {isExpanded && key.subkeys && (
            <div>{renderTree(key.subkeys, level + 1)}</div>
          )}
        </div>
      );
    });
  }, [expandedKeys, selectedKey, selectKey, toggleKey]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Registry Editor</h1>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          title="Back"
        >
          ←
        </button>
        <button
          onClick={() => window.history.forward()}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          title="Forward"
        >
          →
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={createKey}
          disabled={!selectedKey}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          New Key
        </button>
        <button
          onClick={createValue}
          disabled={!selectedKey}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          New Value
        </button>
        <button
          onClick={deleteKey}
          disabled={!selectedKey}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Delete
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={() => setShowSearchDialog(true)}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          Find
        </button>
        <button
          onClick={() => selectedKey && setFavorites(prev => [...prev, selectedKey.path])}
          disabled={!selectedKey}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Add to Favorites
        </button>
        <div className="ml-auto">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Address Bar */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Address:</span>
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // Navigate to path
                console.log('Navigate to:', currentPath);
              }
            }}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Tree View */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {renderTree(registryKeys)}
        </div>

        {/* Value List */}
        <div className="flex-1 overflow-y-auto">
          {selectedKey && (
            <div>
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedKey.values?.length || 0} value(s)
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-sm font-medium">Name</th>
                    <th className="text-left p-2 text-sm font-medium">Type</th>
                    <th className="text-left p-2 text-sm font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedKey.values?.map(value => (
                    <tr
                      key={value.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                        selectedValue?.id === value.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedValue(value)}
                      onDoubleClick={() => {
                        setSelectedValue(value);
                        setValueForm({
                          name: value.name,
                          type: value.type,
                          data: value.data
                        });
                        setShowValueDialog(true);
                      }}
                    >
                      <td className="p-2 text-sm">
                        <span className="mr-2">{getValueTypeIcon(value.type)}</span>
                        {value.name}
                      </td>
                      <td className="p-2 text-sm text-gray-600">{value.type}</td>
                      <td className="p-2 text-sm font-mono">{formatValueData(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-200 text-sm text-gray-600">
        {selectedKey ? `Selected: ${selectedKey.path}` : 'Ready'}
      </div>

      {/* Value Dialog */}
      {showValueDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">
              {selectedValue ? 'Edit Value' : 'New Value'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value Name
                </label>
                <input
                  type="text"
                  value={valueForm.name}
                  onChange={(e) => setValueForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Enter value name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value Type
                </label>
                <select
                  value={valueForm.type}
                  onChange={(e) => setValueForm(prev => ({ ...prev, type: e.target.value as RegistryValueType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(RegistryValueType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value Data
                </label>
                {valueForm.type === RegistryValueType.REG_MULTI_SZ ? (
                  <textarea
                    value={valueForm.data}
                    onChange={(e) => setValueForm(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={4}
                    placeholder="Enter one value per line"
                  />
                ) : (
                  <input
                    type={valueForm.type === RegistryValueType.REG_DWORD ? 'number' : 'text'}
                    value={valueForm.data}
                    onChange={(e) => setValueForm(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter value data"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowValueDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveValue}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Dialog */}
      {showSearchDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">Find</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Find what:
                </label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Enter search text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Look at:
                </label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={searchOptions.searchKeys}
                      onChange={(e) => setSearchOptions(prev => ({ ...prev, searchKeys: e.target.checked }))}
                    />
                    <span className="text-sm">Keys</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={searchOptions.searchValueNames}
                      onChange={(e) => setSearchOptions(prev => ({ ...prev, searchValueNames: e.target.checked }))}
                    />
                    <span className="text-sm">Value names</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={searchOptions.searchValueData}
                      onChange={(e) => setSearchOptions(prev => ({ ...prev, searchValueData: e.target.checked }))}
                    />
                    <span className="text-sm">Value data</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.matchWholeString}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, matchWholeString: e.target.checked }))}
                  />
                  <span className="text-sm">Match whole string only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.caseSensitive}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                  />
                  <span className="text-sm">Match case</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSearchDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  searchRegistry();
                  setShowSearchDialog(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Find Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistryEditor;