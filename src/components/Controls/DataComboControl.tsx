/**
 * DataCombo Control - Complete VB6 Data-Bound ComboBox Implementation
 * Provides full data binding capabilities with recordset integration
 * Supports all VB6 DataCombo properties and methods
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// DataCombo Constants
export enum DataComboStyle {
  dbcDropdownCombo = 0,
  dbcSimpleCombo = 1,
  dbcDropdownList = 2
}

export enum DataComboMatchEntry {
  dbcNoMatch = 0,
  dbcBasicMatching = 1,
  dbcExtendedMatching = 2
}

export interface DataRecord {
  [key: string]: any;
}

export interface DataComboProps extends VB6ControlPropsEnhanced {
  // Data binding properties
  dataSource?: any; // Data source object
  dataField?: string; // Field to bind to
  listField?: string; // Field to display in list
  boundColumn?: string; // Column to return as value
  rowSource?: DataRecord[]; // Static data source
  
  // Display properties
  style?: DataComboStyle;
  matchEntry?: DataComboMatchEntry;
  maxLength?: number;
  
  // List properties
  listRows?: number; // Number of visible rows in dropdown
  sorted?: boolean;
  integralHeight?: boolean;
  
  // Visual properties
  backColor?: string;
  foreColor?: string;
  font?: any;
  locked?: boolean;
  
  // Events
  onSelectionChange?: (selectedValue: any, selectedText: string) => void;
  onDataChange?: (value: any) => void;
  onClick?: () => void;
  onDblClick?: () => void;
  onGotFocus?: () => void;
  onLostFocus?: () => void;
}

export const DataComboControl = forwardRef<HTMLDivElement, DataComboProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 120,
    height = 21,
    visible = true,
    enabled = true,
    dataSource,
    dataField = '',
    listField = '',
    boundColumn = '',
    rowSource = [],
    style = DataComboStyle.dbcDropdownCombo,
    matchEntry = DataComboMatchEntry.dbcBasicMatching,
    maxLength = 0,
    listRows = 8,
    sorted = false,
    integralHeight = true,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8 },
    locked = false,
    onSelectionChange,
    onDataChange,
    onClick,
    onDblClick,
    onGotFocus,
    onLostFocus,
    ...rest
  } = props;

  // State management
  const [currentValue, setCurrentValue] = useState<any>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filteredData, setFilteredData] = useState<DataRecord[]>([]);
  const [allData, setAllData] = useState<DataRecord[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    // Data navigation methods
    MoveFirst: () => {
      if (allData.length > 0) {
        setSelectedIndex(0);
        const record = allData[0];
        const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
        const text = listField ? record[listField] : String(value);
        
        setCurrentValue(value);
        setDisplayText(text);
        
        updateControl(id, 'Value', value);
        updateControl(id, 'Text', text);
        onSelectionChange?.(value, text);
        fireEvent(name, 'Change', { value, text });
        
        return true;
      }
      return false;
    },

    MovePrevious: () => {
      if (selectedIndex > 0) {
        const newIndex = selectedIndex - 1;
        setSelectedIndex(newIndex);
        const record = allData[newIndex];
        const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
        const text = listField ? record[listField] : String(value);
        
        setCurrentValue(value);
        setDisplayText(text);
        
        updateControl(id, 'Value', value);
        updateControl(id, 'Text', text);
        onSelectionChange?.(value, text);
        fireEvent(name, 'Change', { value, text });
        
        return true;
      }
      return false;
    },

    MoveNext: () => {
      if (selectedIndex < allData.length - 1) {
        const newIndex = selectedIndex + 1;
        setSelectedIndex(newIndex);
        const record = allData[newIndex];
        const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
        const text = listField ? record[listField] : String(value);
        
        setCurrentValue(value);
        setDisplayText(text);
        
        updateControl(id, 'Value', value);
        updateControl(id, 'Text', text);
        onSelectionChange?.(value, text);
        fireEvent(name, 'Change', { value, text });
        
        return true;
      }
      return false;
    },

    MoveLast: () => {
      if (allData.length > 0) {
        const lastIndex = allData.length - 1;
        setSelectedIndex(lastIndex);
        const record = allData[lastIndex];
        const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
        const text = listField ? record[listField] : String(value);
        
        setCurrentValue(value);
        setDisplayText(text);
        
        updateControl(id, 'Value', value);
        updateControl(id, 'Text', text);
        onSelectionChange?.(value, text);
        fireEvent(name, 'Change', { value, text });
        
        return true;
      }
      return false;
    },

    // Data manipulation methods
    AddItem: (item: string, index?: number) => {
      const newRecord: DataRecord = {};
      const displayField = listField || 'text';
      const valueField = boundColumn || 'value';
      
      newRecord[displayField] = item;
      newRecord[valueField] = item;
      
      const newData = [...allData];
      if (index !== undefined && index >= 0 && index <= newData.length) {
        newData.splice(index, 0, newRecord);
      } else {
        newData.push(newRecord);
      }
      
      setAllData(newData);
      updateFilteredData(newData, searchText);
    },

    RemoveItem: (index: number) => {
      if (index >= 0 && index < allData.length) {
        const newData = [...allData];
        newData.splice(index, 1);
        setAllData(newData);
        updateFilteredData(newData, searchText);
        
        // Adjust selected index if necessary
        if (selectedIndex >= newData.length) {
          setSelectedIndex(newData.length - 1);
        }
      }
    },

    Clear: () => {
      setAllData([]);
      setFilteredData([]);
      setSelectedIndex(-1);
      setCurrentValue('');
      setDisplayText('');
      setSearchText('');
    },

    // Search methods
    FindItem: (searchStr: string, startIndex: number = 0): number => {
      const displayField = listField || Object.keys(allData[0] || {})[0];
      
      for (let i = startIndex; i < allData.length; i++) {
        const itemText = String(allData[i][displayField] || '').toLowerCase();
        if (itemText.includes(searchStr.toLowerCase())) {
          return i;
        }
      }
      return -1;
    },

    // Selection methods
    GetSelected: (index: number): boolean => {
      return selectedIndex === index;
    },

    SetSelected: (index: number, selected: boolean) => {
      if (selected && index >= 0 && index < allData.length) {
        setSelectedIndex(index);
        const record = allData[index];
        const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
        const text = listField ? record[listField] : String(value);
        
        setCurrentValue(value);
        setDisplayText(text);
        
        updateControl(id, 'Value', value);
        updateControl(id, 'Text', text);
        onSelectionChange?.(value, text);
      }
    },

    // Data binding methods
    Refresh: () => {
      // Refresh data from data source
      if (dataSource && typeof dataSource.refresh === 'function') {
        dataSource.refresh();
      }
      loadDataFromSource();
    },

    UpdateRecord: () => {
      // Update the bound record with current value
      if (dataSource && dataField && selectedIndex >= 0) {
        const record = allData[selectedIndex];
        if (record && dataSource.updateField) {
          dataSource.updateField(dataField, currentValue);
        }
      }
    },

    // Properties
    get Value() { return currentValue; },
    set Value(value: any) {
      setCurrentValue(value);
      
      // Find matching record
      const valueField = boundColumn || Object.keys(allData[0] || {})[0];
      const matchIndex = allData.findIndex(record => record[valueField] === value);
      
      if (matchIndex >= 0) {
        setSelectedIndex(matchIndex);
        const record = allData[matchIndex];
        const text = listField ? record[listField] : String(value);
        setDisplayText(text);
      } else {
        setDisplayText(String(value));
      }
      
      updateControl(id, 'Value', value);
      onDataChange?.(value);
    },

    get Text() { return displayText; },
    set Text(text: string) {
      setDisplayText(text);
      
      // In editable combo, update the value as well
      if (style === DataComboStyle.dbcDropdownCombo || style === DataComboStyle.dbcSimpleCombo) {
        setCurrentValue(text);
        updateControl(id, 'Value', text);
        onDataChange?.(text);
      }
    },

    get ListIndex() { return selectedIndex; },
    set ListIndex(index: number) {
      if (index >= -1 && index < allData.length) {
        setSelectedIndex(index);
        if (index >= 0) {
          const record = allData[index];
          const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
          const text = listField ? record[listField] : String(value);
          
          setCurrentValue(value);
          setDisplayText(text);
          
          updateControl(id, 'Value', value);
          updateControl(id, 'Text', text);
        }
      }
    },

    get ListCount() { return allData.length; },
    
    get BoundText() {
      if (selectedIndex >= 0 && boundColumn) {
        return String(allData[selectedIndex][boundColumn] || '');
      }
      return '';
    },

    // List manipulation
    List: (index: number): string => {
      if (index >= 0 && index < allData.length) {
        const record = allData[index];
        const displayField = listField || Object.keys(record)[0];
        return String(record[displayField] || '');
      }
      return '';
    },

    ItemData: (index: number): any => {
      if (index >= 0 && index < allData.length) {
        const record = allData[index];
        const valueField = boundColumn || Object.keys(record)[0];
        return record[valueField];
      }
      return null;
    }
  };

  // Load data from various sources
  const loadDataFromSource = useCallback(() => {
    let data: DataRecord[] = [];
    
    if (rowSource && Array.isArray(rowSource)) {
      data = [...rowSource];
    } else if (dataSource) {
      // Handle different data source types
      if (Array.isArray(dataSource)) {
        data = dataSource;
      } else if (dataSource.recordset && Array.isArray(dataSource.recordset)) {
        data = dataSource.recordset;
      } else if (typeof dataSource.getData === 'function') {
        data = dataSource.getData();
      }
    }
    
    // Sort if required
    if (sorted && data.length > 0) {
      const displayField = listField || Object.keys(data[0])[0];
      data.sort((a, b) => {
        const aVal = String(a[displayField] || '');
        const bVal = String(b[displayField] || '');
        return aVal.localeCompare(bVal);
      });
    }
    
    setAllData(data);
    setFilteredData(data);
    
  }, [dataSource, rowSource, listField, sorted]);

  // Update filtered data based on search
  const updateFilteredData = useCallback((data: DataRecord[], search: string) => {
    if (!search) {
      setFilteredData(data);
      return;
    }
    
    const displayField = listField || Object.keys(data[0] || {})[0];
    const filtered = data.filter(record => {
      const text = String(record[displayField] || '').toLowerCase();
      if (matchEntry === DataComboMatchEntry.dbcExtendedMatching) {
        return text.includes(search.toLowerCase());
      } else {
        return text.startsWith(search.toLowerCase());
      }
    });
    
    setFilteredData(filtered);
  }, [listField, matchEntry]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (maxLength > 0 && value.length > maxLength) {
      return;
    }
    
    setDisplayText(value);
    setSearchText(value);
    setIsEditing(true);
    
    if (style !== DataComboStyle.dbcDropdownList) {
      setCurrentValue(value);
      updateControl(id, 'Value', value);
      onDataChange?.(value);
    }
    
    // Filter data based on input
    updateFilteredData(allData, value);
    
    // Auto-open dropdown if typing and matching enabled
    if (matchEntry !== DataComboMatchEntry.dbcNoMatch && value.length > 0) {
      setIsOpen(true);
    }
    
  }, [maxLength, style, id, updateControl, onDataChange, allData, matchEntry, updateFilteredData]);

  // Handle selection from dropdown
  const handleSelection = useCallback((record: DataRecord, index: number) => {
    const value = boundColumn ? record[boundColumn] : record[Object.keys(record)[0]];
    const text = listField ? record[listField] : String(value);
    
    setCurrentValue(value);
    setDisplayText(text);
    setSelectedIndex(allData.indexOf(record));
    setIsOpen(false);
    setIsEditing(false);
    setSearchText('');
    
    updateControl(id, 'Value', value);
    updateControl(id, 'Text', text);
    updateControl(id, 'ListIndex', allData.indexOf(record));
    
    onSelectionChange?.(value, text);
    fireEvent(name, 'Change', { value, text });
    
  }, [boundColumn, listField, allData, id, updateControl, onSelectionChange, fireEvent, name]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (selectedIndex < filteredData.length - 1) {
          const newIndex = selectedIndex + 1;
          const record = filteredData[newIndex];
          handleSelection(record, newIndex);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen && selectedIndex > 0) {
          const newIndex = selectedIndex - 1;
          const record = filteredData[newIndex];
          handleSelection(record, newIndex);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (isOpen && selectedIndex >= 0) {
          const record = filteredData[selectedIndex];
          handleSelection(record, selectedIndex);
        }
        setIsOpen(false);
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setIsEditing(false);
        // Restore original text
        break;
        
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [enabled, isOpen, selectedIndex, filteredData, handleSelection]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadDataFromSource();
  }, [loadDataFromSource]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Value', currentValue);
    updateControl(id, 'Text', displayText);
    updateControl(id, 'ListIndex', selectedIndex);
    updateControl(id, 'ListCount', allData.length);
  }, [id, currentValue, displayText, selectedIndex, allData.length, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = vb6Methods;
    }
  }, [name, vb6Methods]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height: style === DataComboStyle.dbcSimpleCombo ? Math.max(height, 100) : height,
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    opacity: enabled ? 1 : 0.5
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: '2px 20px 2px 4px',
    border: '2px inset #C0C0C0',
    backgroundColor: locked ? '#F0F0F0' : backColor,
    color: foreColor,
    fontSize: 'inherit',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: enabled ? 'text' : 'default'
  };

  const dropdownButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '2px',
    top: '2px',
    bottom: '2px',
    width: '16px',
    background: '#F0F0F0',
    border: '1px outset #C0C0C0',
    cursor: enabled ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: `${listRows * 16}px`,
    backgroundColor: backColor,
    border: '1px solid #808080',
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    zIndex: 1000,
    overflow: 'auto'
  };

  const listItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '2px 4px',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#316AC5' : 'transparent',
    color: isSelected ? '#FFFFFF' : foreColor,
    fontSize: 'inherit',
    fontFamily: 'inherit'
  });

  return (
    <div
      ref={ref}
      style={containerStyle}
      onFocus={() => {
        onGotFocus?.();
        fireEvent(name, 'GotFocus', {});
      }}
      onBlur={() => {
        onLostFocus?.();
        fireEvent(name, 'LostFocus', {});
      }}
      {...rest}
    >
      <div style={{ position: 'relative', width: '100%', height: style === DataComboStyle.dbcSimpleCombo ? 21 : '100%' }}>
        <input
          ref={inputRef}
          type="text"
          value={displayText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => {
            onClick?.();
            fireEvent(name, 'Click', {});
          }}
          onDoubleClick={() => {
            onDblClick?.();
            fireEvent(name, 'DblClick', {});
          }}
          disabled={!enabled}
          readOnly={locked || style === DataComboStyle.dbcDropdownList}
          style={inputStyle}
          maxLength={maxLength > 0 ? maxLength : undefined}
        />
        
        {style !== DataComboStyle.dbcSimpleCombo && (
          <button
            style={dropdownButtonStyle}
            onClick={() => setIsOpen(!isOpen)}
            disabled={!enabled}
            tabIndex={-1}
          >
            ▼
          </button>
        )}
        
        {isOpen && (
          <div ref={dropdownRef} style={dropdownStyle}>
            {filteredData.map((record, index) => {
              const displayValue = listField ? record[listField] : String(record[Object.keys(record)[0]] || '');
              const isItemSelected = allData.indexOf(record) === selectedIndex;
              
              return (
                <div
                  key={index}
                  style={listItemStyle(isItemSelected)}
                  onClick={() => handleSelection(record, index)}
                  onMouseEnter={(e) => {
                    if (!isItemSelected) {
                      e.currentTarget.style.backgroundColor = '#E0E0E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isItemSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {displayValue}
                </div>
              );
            })}
            
            {filteredData.length === 0 && searchText && (
              <div style={{ padding: '4px', color: '#808080', fontStyle: 'italic' }}>
                No matches found
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Simple combo list area */}
      {style === DataComboStyle.dbcSimpleCombo && (
        <div style={{
          position: 'absolute',
          top: 21,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: backColor,
          border: '2px inset #C0C0C0',
          overflow: 'auto'
        }}>
          {filteredData.map((record, index) => {
            const displayValue = listField ? record[listField] : String(record[Object.keys(record)[0]] || '');
            const isItemSelected = allData.indexOf(record) === selectedIndex;
            
            return (
              <div
                key={index}
                style={listItemStyle(isItemSelected)}
                onClick={() => handleSelection(record, index)}
              >
                {displayValue}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

DataComboControl.displayName = 'DataComboControl';

// VB6 DataCombo control default properties
export const getDataComboControlDefaults = (id: number) => ({
  id,
  type: 'DataComboControl',
  name: `DataCombo${id}`,
  left: 100,
  top: 100,
  width: 120,
  height: 21,
  dataSource: null,
  dataField: '',
  listField: '',
  boundColumn: '',
  rowSource: [],
  style: DataComboStyle.dbcDropdownCombo,
  matchEntry: DataComboMatchEntry.dbcBasicMatching,
  maxLength: 0,
  listRows: 8,
  sorted: false,
  integralHeight: true,
  backColor: '#FFFFFF',
  foreColor: '#000000',
  font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
  locked: false,
  visible: true,
  enabled: true,
  tabIndex: id
});

export default DataComboControl;