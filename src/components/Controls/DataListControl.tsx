/**
 * DataList Control - Complete VB6 DataList Implementation
 * Data-bound combo box with incremental search capabilities
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// VB6 DataList Constants
export enum DataListConstants {
  dbcDataCombo = 0,
  dbcDataList = 1
}

export enum BoundColumnConstants {
  dbcBoundColumnFirst = 0,
  dbcBoundColumnVisible = 1
}

export enum MatchEntryConstants {
  dblExtendedMatching = 0,
  dblStandardMatching = 1,
  dblFirstLetterMatching = 2
}

export interface DataListItem {
  text: string;
  value: any;
  data?: any;
}

export interface DataSource {
  recordset?: any;
  fields?: string[];
  currentRecord?: number;
}

export interface DataListProps extends VB6ControlPropsEnhanced {
  // Data properties
  dataSource?: DataSource;
  dataField?: string;
  dataSourceName?: string;
  listField?: string;
  boundColumn?: number;
  rowSource?: string;
  
  // Behavior properties
  style?: DataListConstants;
  matchEntry?: MatchEntryConstants;
  integralHeight?: boolean;
  sorted?: boolean;
  readOnly?: boolean;
  
  // List properties
  listCount?: number;
  listIndex?: number;
  itemData?: number[];
  list?: string[];
  
  // Appearance
  listWidth?: number;
  visibleRows?: number;
  selectionStart?: number;
  selectionLength?: number;
  
  // Events
  onDataChange?: () => void;
  onMouseDown?: (button: number, shift: number, x: number, y: number) => void;
  onKeyDown?: (keyCode: number, shift: number) => void;
  onDropDown?: () => void;
  onCloseUp?: () => void;
  onScroll?: () => void;
  onValidate?: (cancel: boolean) => void;
  onRowColChange?: (lastRow: number, lastCol: number) => void;
}

export const DataListControl = forwardRef<HTMLDivElement, DataListProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 120,
    height = 20,
    visible = true,
    enabled = true,
    style = DataListConstants.dbcDataCombo,
    dataSource,
    dataField = '',
    listField = '',
    boundColumn = 0,
    rowSource = '',
    matchEntry = MatchEntryConstants.dblStandardMatching,
    integralHeight = true,
    sorted = false,
    readOnly = false,
    listWidth = 0,
    visibleRows = 8,
    text = '',
    onDataChange,
    onMouseDown,
    onKeyDown,
    onDropDown,
    onCloseUp,
    onScroll,
    onValidate,
    onRowColChange,
    ...rest
  } = props;

  const [currentText, setCurrentText] = useState(text);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [items, setItems] = useState<DataListItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DataListItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [currentRecord, setCurrentRecord] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    AddItem: (item: string, index?: number) => {
      const newItem: DataListItem = { text: item, value: item };
      const newItems = [...items];
      if (index !== undefined && index >= 0 && index < newItems.length) {
        newItems.splice(index, 0, newItem);
      } else {
        newItems.push(newItem);
      }
      setItems(sorted ? newItems.sort((a, b) => a.text.localeCompare(b.text)) : newItems);
    },

    RemoveItem: (index: number) => {
      if (index >= 0 && index < items.length) {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        if (selectedIndex === index) {
          setSelectedIndex(-1);
          setCurrentText('');
        } else if (selectedIndex > index) {
          setSelectedIndex(selectedIndex - 1);
        }
      }
    },

    Clear: () => {
      setItems([]);
      setFilteredItems([]);
      setSelectedIndex(-1);
      setCurrentText('');
      setSearchText('');
    },

    FindItem: (searchStr: string, startIndex: number = 0): number => {
      for (let i = startIndex; i < items.length; i++) {
        const item = items[i];
        switch (matchEntry) {
          case MatchEntryConstants.dblExtendedMatching:
            if (item.text.toLowerCase().includes(searchStr.toLowerCase())) {
              return i;
            }
            break;
          case MatchEntryConstants.dblStandardMatching:
            if (item.text.toLowerCase().startsWith(searchStr.toLowerCase())) {
              return i;
            }
            break;
          case MatchEntryConstants.dblFirstLetterMatching:
            if (item.text.charAt(0).toLowerCase() === searchStr.charAt(0).toLowerCase()) {
              return i;
            }
            break;
        }
      }
      return -1;
    },

    Refresh: () => {
      // Refresh data from data source
      if (dataSource && dataSource.recordset) {
        loadDataFromSource();
      }
      updateFilteredItems();
    },

    ReFill: () => {
      // Refill list from row source
      if (rowSource) {
        loadDataFromRowSource();
      }
    },

    AboutBox: () => {
      alert('Microsoft DataList Control\\nVersion 6.0\\n© Microsoft Corporation');
    },

    GetBookmark: (index: number): any => {
      if (index >= 0 && index < items.length) {
        return items[index].data;
      }
      return null;
    },

    SetBookmark: (index: number, bookmark: any) => {
      if (index >= 0 && index < items.length) {
        items[index].data = bookmark;
      }
    }
  };

  const loadDataFromSource = useCallback(() => {
    if (!dataSource || !dataSource.recordset) return;

    const newItems: DataListItem[] = [];
    const recordset = dataSource.recordset;

    // Simulate recordset traversal
    if (recordset.records && Array.isArray(recordset.records)) {
      recordset.records.forEach((record: any, index: number) => {
        const displayText = listField ? record[listField] : Object.prototype.toString.call(record);
        const value = boundColumn > 0 && dataField ? record[dataField] : displayText;
        
        newItems.push({
          text: displayText,
          value: value,
          data: { recordIndex: index, bookmark: record.bookmark }
        });
      });
    }

    setItems(sorted ? newItems.sort((a, b) => a.text.localeCompare(b.text)) : newItems);
  }, [dataSource, listField, dataField, boundColumn, sorted]);

  const loadDataFromRowSource = useCallback(() => {
    if (!rowSource) return;

    // Parse row source (simplified SQL or semicolon-separated values)
    const newItems: DataListItem[] = [];
    if (rowSource.includes(';')) {
      // Semicolon-separated values
      const values = rowSource.split(';');
      values.forEach(value => {
        const trimmed = value.trim();
        if (trimmed) {
          newItems.push({ text: trimmed, value: trimmed });
        }
      });
    } else if (rowSource.toLowerCase().startsWith('select')) {
      // SQL query (would need actual database connection)
      console.log('SQL row source not implemented in demo:', rowSource);
    }

    setItems(sorted ? newItems.sort((a, b) => a.text.localeCompare(b.text)) : newItems);
  }, [rowSource, sorted]);

  const updateFilteredItems = useCallback(() => {
    if (!searchText) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => {
      switch (matchEntry) {
        case MatchEntryConstants.dblExtendedMatching:
          return item.text.toLowerCase().includes(searchText.toLowerCase());
        case MatchEntryConstants.dblStandardMatching:
          return item.text.toLowerCase().startsWith(searchText.toLowerCase());
        case MatchEntryConstants.dblFirstLetterMatching:
          return item.text.charAt(0).toLowerCase() === searchText.charAt(0).toLowerCase();
        default:
          return true;
      }
    });

    setFilteredItems(filtered);
  }, [items, searchText, matchEntry]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setCurrentText(newText);
    setSearchText(newText);

    if (style === DataListConstants.dbcDataCombo) {
      // Auto-complete behavior
      const foundIndex = vb6Methods.FindItem(newText);
      if (foundIndex >= 0) {
        setSelectedIndex(foundIndex);
      }
    }

    fireEvent(name, 'Change', { text: newText });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keyCode = e.keyCode;
    const shift = e.shiftKey ? 1 : 0;

    switch (keyCode) {
      case 40: // Down arrow
        e.preventDefault();
        if (!isDropDownOpen && style === DataListConstants.dbcDataCombo) {
          setIsDropDownOpen(true);
          onDropDown?.();
          fireEvent(name, 'DropDown', {});
        } else {
          const nextIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
          setSelectedIndex(nextIndex);
          if (nextIndex >= 0) {
            setCurrentText(filteredItems[nextIndex].text);
          }
        }
        break;

      case 38: // Up arrow
        {
          e.preventDefault();
          const prevIndex = Math.max(selectedIndex - 1, 0);
          setSelectedIndex(prevIndex);
          if (prevIndex >= 0) {
            setCurrentText(filteredItems[prevIndex].text);
          }
        }
        break;

      case 13: // Enter
        e.preventDefault();
        if (isDropDownOpen) {
          setIsDropDownOpen(false);
          onCloseUp?.();
          fireEvent(name, 'CloseUp', {});
        }
        break;

      case 27: // Escape
        e.preventDefault();
        if (isDropDownOpen) {
          setIsDropDownOpen(false);
          onCloseUp?.();
          fireEvent(name, 'CloseUp', {});
        }
        break;

      case 9: // Tab
        if (isDropDownOpen) {
          setIsDropDownOpen(false);
          onCloseUp?.();
          fireEvent(name, 'CloseUp', {});
        }
        break;
    }

    onKeyDown?.(keyCode, shift);
    fireEvent(name, 'KeyDown', { keyCode, shift });
  };

  const handleDropdownToggle = () => {
    if (!enabled || readOnly) return;

    const newState = !isDropDownOpen;
    setIsDropDownOpen(newState);

    if (newState) {
      onDropDown?.();
      fireEvent(name, 'DropDown', {});
    } else {
      onCloseUp?.();
      fireEvent(name, 'CloseUp', {});
    }
  };

  const handleItemClick = (item: DataListItem, index: number) => {
    setSelectedIndex(index);
    setCurrentText(item.text);
    setIsDropDownOpen(false);
    
    onCloseUp?.();
    fireEvent(name, 'CloseUp', {});
    fireEvent(name, 'Click', { text: item.text, value: item.value });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const button = e.button;
    const shift = e.shiftKey ? 1 : 0;
    const x = e.clientX;
    const y = e.clientY;

    onMouseDown?.(button, shift, x, y);
    fireEvent(name, 'MouseDown', { button, shift, x, y });
  };

  const handleScroll = (e: React.UIEvent) => {
    setScrollTop(e.currentTarget.scrollTop);
    onScroll?.();
    fireEvent(name, 'Scroll', {});
  };

  // Initialize data
  useEffect(() => {
    if (dataSource) {
      loadDataFromSource();
    } else if (rowSource) {
      loadDataFromRowSource();
    }
  }, [dataSource, rowSource, loadDataFromSource, loadDataFromRowSource]);

  // Update filtered items when search changes
  useEffect(() => {
    updateFilteredItems();
  }, [updateFilteredItems]);

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Text', currentText);
    updateControl(id, 'ListIndex', selectedIndex);
    updateControl(id, 'ListCount', items.length);
    updateControl(id, 'BoundText', selectedIndex >= 0 ? items[selectedIndex].value : '');
  }, [id, currentText, selectedIndex, items, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  if (!visible) return null;

  const effectiveListWidth = listWidth > 0 ? listWidth : width;
  const itemHeight = 20;
  const maxDropdownHeight = visibleRows * itemHeight;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height: style === DataListConstants.dbcDataList ? Math.max(height as number, maxDropdownHeight) : height,
        opacity: enabled ? 1 : 0.5
      }}
      onMouseDown={handleMouseDown}
      {...rest}
    >
      {/* Input/Display area */}
      {style === DataListConstants.dbcDataCombo ? (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            border: '2px inset #C0C0C0',
            backgroundColor: enabled && !readOnly ? '#FFFFFF' : '#F0F0F0'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            disabled={!enabled}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '2px 4px',
              fontFamily: 'MS Sans Serif',
              fontSize: '8pt',
              backgroundColor: 'transparent'
            }}
          />
          <button
            onClick={handleDropdownToggle}
            disabled={!enabled}
            style={{
              width: '17px',
              height: '100%',
              border: 'none',
              backgroundColor: '#C0C0C0',
              cursor: enabled ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px'
            }}
          >
            ▼
          </button>
        </div>
      ) : (
        // DataList style - always showing list
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px inset #C0C0C0',
            backgroundColor: '#FFFFFF',
            overflow: 'auto'
          }}
          onScroll={handleScroll}
        >
          {filteredItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '2px 4px',
                backgroundColor: selectedIndex === index ? '#0000FF' : 'transparent',
                color: selectedIndex === index ? '#FFFFFF' : '#000000',
                cursor: 'pointer',
                fontFamily: 'MS Sans Serif',
                fontSize: '8pt',
                height: `${itemHeight}px`,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #E0E0E0'
              }}
              onClick={() => handleItemClick(item, index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown list for combo style */}
      {style === DataListConstants.dbcDataCombo && isDropDownOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: effectiveListWidth,
            maxHeight: maxDropdownHeight,
            backgroundColor: '#FFFFFF',
            border: '2px outset #C0C0C0',
            zIndex: 1000,
            overflow: 'auto',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}
          onScroll={handleScroll}
        >
          {filteredItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '2px 4px',
                backgroundColor: selectedIndex === index ? '#0000FF' : 'transparent',
                color: selectedIndex === index ? '#FFFFFF' : '#000000',
                cursor: 'pointer',
                fontFamily: 'MS Sans Serif',
                fontSize: '8pt',
                height: `${itemHeight}px`,
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={() => handleItemClick(item, index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

DataListControl.displayName = 'DataListControl';

export default DataListControl;