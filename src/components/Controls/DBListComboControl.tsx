/**
 * VB6 DBList and DBCombo Controls Implementation
 * 
 * Data-bound list and combo box controls with full VB6 compatibility
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface DBListControl {
  type: 'DBList';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Data Binding Properties
  dataSource: string; // Data source name
  dataField: string; // Field to display
  rowSource: string; // Source for list items
  listField: string; // Field to display in list
  boundColumn: number; // Column to use for value (0-based)
  
  // List Properties
  list: string[]; // Array of list items
  listCount: number; // Number of items in list
  listIndex: number; // Currently selected index (-1 if none)
  text: string; // Currently selected text
  
  // Data Properties
  boundText: string; // Text from bound column
  selectedValue: any; // Selected value
  
  // Behavior Properties
  matchEntry: number; // 0=None, 1=Standard, 2=Extended matching
  sorted: boolean; // Sort list alphabetically
  integralHeight: boolean; // Adjust height to show complete items
  
  // Appearance Properties
  backColor: string;
  foreColor: string;
  font: string;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  
  // State
  enabled: boolean;
  visible: boolean;
  locked: boolean;
  tag: string;
  
  // Events
  onClick?: string;
  onDblClick?: string;
  onChange?: string;
  onReposition?: string;
  onValidate?: string;
}

export interface DBComboControl extends DBListControl {
  type: 'DBCombo';
  
  // Combo-specific Properties
  style: number; // 0=Dropdown Combo, 1=Simple Combo, 2=Dropdown List
  maxLength: number; // Maximum text length
  selLength: number; // Length of selected text
  selStart: number; // Start of selected text
  selText: string; // Selected text
  
  // Additional Events
  onDropDown?: string;
  onCloseUp?: string;
  onKeyDown?: string;
  onKeyPress?: string;
  onKeyUp?: string;
}

// Data binding simulation
interface DataRecord {
  [key: string]: any;
}

interface DataSource {
  name: string;
  records: DataRecord[];
  currentRecord: number;
  fields: string[];
}

// DBList/DBCombo Constants
export const DBControlConstants = {
  // Match Entry Constants
  MATCH_NONE: 0,
  MATCH_STANDARD: 1,
  MATCH_EXTENDED: 2,
  
  // Combo Style Constants
  COMBO_DROPDOWN: 0,
  COMBO_SIMPLE: 1,
  COMBO_DROPDOWNLIST: 2,
  
  // List Index Constants
  NO_SELECTION: -1,
  
  // Bound Column Constants
  FIRST_COLUMN: 0,
  SECOND_COLUMN: 1
};

interface DBListControlProps {
  control: DBListControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const DBListControl: React.FC<DBListControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 120,
    height = 100,
    dataSource = '',
    dataField = '',
    rowSource = '',
    listField = '',
    boundColumn = 0,
    list = [],
    listCount = 0,
    listIndex = -1,
    text = '',
    boundText = '',
    selectedValue = null,
    matchEntry = DBControlConstants.MATCH_STANDARD,
    sorted = false,
    integralHeight = true,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = 'MS Sans Serif',
    fontSize = 8,
    fontBold = false,
    fontItalic = false,
    enabled = true,
    visible = true,
    locked = false,
    tag = ''
  } = control;

  const [currentList, setCurrentList] = useState<string[]>(list);
  const [currentIndex, setCurrentIndex] = useState(listIndex);
  const [currentText, setCurrentText] = useState(text);
  const [dataRecords, setDataRecords] = useState<DataRecord[]>([]);
  const [boundValue, setBoundValue] = useState(selectedValue);
  
  const listRef = useRef<HTMLSelectElement>(null);

  // Mock data sources for demonstration
  const mockDataSources: { [key: string]: DataSource } = {
    'Customers': {
      name: 'Customers',
      records: [
        { CustomerID: 'ALFKI', CompanyName: 'Alfreds Futterkiste', Country: 'Germany' },
        { CustomerID: 'ANATR', CompanyName: 'Ana Trujillo Emparedados', Country: 'Mexico' },
        { CustomerID: 'ANTON', CompanyName: 'Antonio Moreno Taquería', Country: 'Mexico' },
        { CustomerID: 'BERGS', CompanyName: 'Berglunds snabbköp', Country: 'Sweden' },
        { CustomerID: 'BLAUS', CompanyName: 'Blauer See Delikatessen', Country: 'Germany' }
      ],
      currentRecord: 0,
      fields: ['CustomerID', 'CompanyName', 'Country']
    },
    'Products': {
      name: 'Products',
      records: [
        { ProductID: 1, ProductName: 'Chai', CategoryID: 1, Price: 18.00 },
        { ProductID: 2, ProductName: 'Chang', CategoryID: 1, Price: 19.00 },
        { ProductID: 3, ProductName: 'Aniseed Syrup', CategoryID: 2, Price: 10.00 },
        { ProductID: 4, ProductName: 'Chef Anton\'s Cajun Seasoning', CategoryID: 2, Price: 22.00 }
      ],
      currentRecord: 0,
      fields: ['ProductID', 'ProductName', 'CategoryID', 'Price']
    }
  };

  // Load data from row source
  const loadRowSource = useCallback(() => {
    if (!rowSource) return;
    
    const source = mockDataSources[rowSource];
    if (source) {
      setDataRecords(source.records);
      
      // Build list from specified field
      const field = listField || source.fields[0];
      const items = source.records.map(record => 
        record[field] ? String(record[field]) : ''
      );
      
      const sortedItems = sorted ? [...items].sort() : items;
      setCurrentList(sortedItems);
      onPropertyChange?.('list', sortedItems);
      onPropertyChange?.('listCount', sortedItems.length);
    }
  }, [rowSource, listField, sorted, onPropertyChange]);

  // Handle selection change
  const handleSelectionChange = useCallback((index: number) => {
    if (index < 0 || index >= currentList.length) {
      setCurrentIndex(-1);
      setCurrentText('');
      setBoundValue(null);
      onPropertyChange?.('listIndex', -1);
      onPropertyChange?.('text', '');
      onPropertyChange?.('selectedValue', null);
      onPropertyChange?.('boundText', '');
      return;
    }

    setCurrentIndex(index);
    const selectedText = currentList[index];
    setCurrentText(selectedText);
    
    // Get bound value from corresponding record
    if (dataRecords.length > index) {
      const record = dataRecords[index];
      const fields = Object.keys(record);
      const boundField = fields[boundColumn] || fields[0];
      const value = record[boundField];
      
      setBoundValue(value);
      onPropertyChange?.('boundText', String(value));
      onPropertyChange?.('selectedValue', value);
    }
    
    onPropertyChange?.('listIndex', index);
    onPropertyChange?.('text', selectedText);
    
    // Fire events
    onEvent?.('Click');
    onEvent?.('Change');
  }, [currentList, dataRecords, boundColumn, onPropertyChange, onEvent]);

  // Handle match entry (incremental search)
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (matchEntry === DBControlConstants.MATCH_NONE || !enabled) return;
    
    const key = event.key.toLowerCase();
    if (key.length !== 1) return; // Only handle single characters
    
    // Find first item that starts with the typed character
    const startIndex = matchEntry === DBControlConstants.MATCH_EXTENDED && currentIndex >= 0 
      ? currentIndex + 1 : 0;
    
    for (let i = 0; i < currentList.length; i++) {
      const checkIndex = (startIndex + i) % currentList.length;
      const item = currentList[checkIndex];
      
      if (item.toLowerCase().startsWith(key)) {
        handleSelectionChange(checkIndex);
        
        // Scroll to selected item
        if (listRef.current) {
          listRef.current.selectedIndex = checkIndex;
        }
        break;
      }
    }
  }, [matchEntry, enabled, currentIndex, currentList, handleSelectionChange]);

  // Find item by text
  const findItem = useCallback((searchText: string, startIndex: number = 0) => {
    const search = searchText.toLowerCase();
    
    for (let i = startIndex; i < currentList.length; i++) {
      if (currentList[i].toLowerCase().includes(search)) {
        return i;
      }
    }
    
    // Search from beginning if not found
    if (startIndex > 0) {
      for (let i = 0; i < startIndex; i++) {
        if (currentList[i].toLowerCase().includes(search)) {
          return i;
        }
      }
    }
    
    return -1;
  }, [currentList]);

  // Add item to list
  const addItem = useCallback((item: string, index?: number) => {
    const newList = [...currentList];
    
    if (index !== undefined && index >= 0 && index <= newList.length) {
      newList.splice(index, 0, item);
    } else {
      newList.push(item);
    }
    
    const finalList = sorted ? newList.sort() : newList;
    setCurrentList(finalList);
    onPropertyChange?.('list', finalList);
    onPropertyChange?.('listCount', finalList.length);
  }, [currentList, sorted, onPropertyChange]);

  // Remove item from list
  const removeItem = useCallback((index: number) => {
    if (index < 0 || index >= currentList.length) return;
    
    const newList = [...currentList];
    newList.splice(index, 1);
    
    setCurrentList(newList);
    onPropertyChange?.('list', newList);
    onPropertyChange?.('listCount', newList.length);
    
    // Adjust current selection
    if (currentIndex === index) {
      setCurrentIndex(-1);
      setCurrentText('');
      onPropertyChange?.('listIndex', -1);
      onPropertyChange?.('text', '');
    } else if (currentIndex > index) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onPropertyChange?.('listIndex', newIndex);
    }
  }, [currentList, currentIndex, onPropertyChange]);

  // Clear all items
  const clear = useCallback(() => {
    setCurrentList([]);
    setCurrentIndex(-1);
    setCurrentText('');
    setBoundValue(null);
    
    onPropertyChange?.('list', []);
    onPropertyChange?.('listCount', 0);
    onPropertyChange?.('listIndex', -1);
    onPropertyChange?.('text', '');
    onPropertyChange?.('selectedValue', null);
  }, [onPropertyChange]);

  // Load data on mount and when row source changes
  useEffect(() => {
    if (rowSource && !isDesignMode) {
      loadRowSource();
    }
  }, [rowSource, isDesignMode, loadRowSource]);

  // Handle double click
  const handleDoubleClick = useCallback(() => {
    if (!enabled || currentIndex < 0) return;
    onEvent?.('DblClick');
  }, [enabled, currentIndex, onEvent]);

  if (!visible) {
    return null;
  }

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    fontSize: `${fontSize}px`,
    fontFamily: font,
    fontWeight: fontBold ? 'bold' : 'normal',
    fontStyle: fontItalic ? 'italic' : 'normal',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #d0d0d0',
    outline: isDesignMode ? '1px dotted #333' : 'none'
  };

  const listStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    backgroundColor: 'inherit',
    color: 'inherit',
    cursor: enabled ? 'default' : 'not-allowed',
    opacity: enabled ? 1 : 0.5
  };

  return (
    <div
      className={`vb6-dblist ${!enabled ? 'disabled' : ''} ${locked ? 'locked' : ''}`}
      style={containerStyle}
      data-name={name}
      data-type="DBList"
    >
      <select
        ref={listRef}
        multiple
        size={Math.max(1, Math.floor(height / (fontSize + 4)))}
        style={listStyle}
        value={currentIndex >= 0 ? [currentIndex.toString()] : []}
        onChange={(e) => {
          const selectedIndex = parseInt(e.target.value);
          if (!isNaN(selectedIndex)) {
            handleSelectionChange(selectedIndex);
          }
        }}
        onKeyDown={handleKeyPress}
        onDoubleClick={handleDoubleClick}
        disabled={!enabled || locked}
      >
        {currentList.map((item, index) => (
          <option key={index} value={index}>
            {item}
          </option>
        ))}
      </select>

      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {name} - DBList ({currentList.length} items)
        </div>
      )}
    </div>
  );
};

interface DBComboControlProps {
  control: DBComboControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const DBComboControl: React.FC<DBComboControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 120,
    height = 21,
    style = DBControlConstants.COMBO_DROPDOWN,
    maxLength = 0,
    selLength = 0,
    selStart = 0,
    selText = '',
    dataSource = '',
    dataField = '',
    rowSource = '',
    listField = '',
    boundColumn = 0,
    list = [],
    listCount = 0,
    listIndex = -1,
    text = '',
    boundText = '',
    selectedValue = null,
    matchEntry = DBControlConstants.MATCH_STANDARD,
    sorted = false,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = 'MS Sans Serif',
    fontSize = 8,
    fontBold = false,
    fontItalic = false,
    enabled = true,
    visible = true,
    locked = false,
    tag = ''
  } = control;

  const [currentList, setCurrentList] = useState<string[]>(list);
  const [currentIndex, setCurrentIndex] = useState(listIndex);
  const [currentText, setCurrentText] = useState(text);
  const [isDroppedDown, setIsDroppedDown] = useState(false);
  const [dataRecords, setDataRecords] = useState<DataRecord[]>([]);
  const [boundValue, setBoundValue] = useState(selectedValue);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Mock data sources (same as DBList)
  const mockDataSources: { [key: string]: DataSource } = {
    'Customers': {
      name: 'Customers',
      records: [
        { CustomerID: 'ALFKI', CompanyName: 'Alfreds Futterkiste', Country: 'Germany' },
        { CustomerID: 'ANATR', CompanyName: 'Ana Trujillo Emparedados', Country: 'Mexico' },
        { CustomerID: 'ANTON', CompanyName: 'Antonio Moreno Taquería', Country: 'Mexico' },
        { CustomerID: 'BERGS', CompanyName: 'Berglunds snabbköp', Country: 'Sweden' },
        { CustomerID: 'BLAUS', CompanyName: 'Blauer See Delikatessen', Country: 'Germany' }
      ],
      currentRecord: 0,
      fields: ['CustomerID', 'CompanyName', 'Country']
    },
    'Products': {
      name: 'Products',
      records: [
        { ProductID: 1, ProductName: 'Chai', CategoryID: 1, Price: 18.00 },
        { ProductID: 2, ProductName: 'Chang', CategoryID: 1, Price: 19.00 },
        { ProductID: 3, ProductName: 'Aniseed Syrup', CategoryID: 2, Price: 10.00 },
        { ProductID: 4, ProductName: 'Chef Anton\'s Cajun Seasoning', CategoryID: 2, Price: 22.00 }
      ],
      currentRecord: 0,
      fields: ['ProductID', 'ProductName', 'CategoryID', 'Price']
    }
  };

  // Load data from row source
  const loadRowSource = useCallback(() => {
    if (!rowSource) return;
    
    const source = mockDataSources[rowSource];
    if (source) {
      setDataRecords(source.records);
      
      // Build list from specified field
      const field = listField || source.fields[0];
      const items = source.records.map(record => 
        record[field] ? String(record[field]) : ''
      );
      
      const sortedItems = sorted ? [...items].sort() : items;
      setCurrentList(sortedItems);
      onPropertyChange?.('list', sortedItems);
      onPropertyChange?.('listCount', sortedItems.length);
    }
  }, [rowSource, listField, sorted, onPropertyChange]);

  // Handle selection change
  const handleSelectionChange = useCallback((index: number, newText?: string) => {
    const selectedText = newText || (index >= 0 && index < currentList.length ? currentList[index] : '');
    
    setCurrentIndex(index);
    setCurrentText(selectedText);
    
    // Get bound value from corresponding record
    if (dataRecords.length > index && index >= 0) {
      const record = dataRecords[index];
      const fields = Object.keys(record);
      const boundField = fields[boundColumn] || fields[0];
      const value = record[boundField];
      
      setBoundValue(value);
      onPropertyChange?.('boundText', String(value));
      onPropertyChange?.('selectedValue', value);
    } else {
      setBoundValue(null);
      onPropertyChange?.('boundText', '');
      onPropertyChange?.('selectedValue', null);
    }
    
    onPropertyChange?.('listIndex', index);
    onPropertyChange?.('text', selectedText);
    
    // Update input field
    if (inputRef.current && style !== DBControlConstants.COMBO_DROPDOWNLIST) {
      inputRef.current.value = selectedText;
    }
    
    // Fire events
    onEvent?.('Change');
  }, [currentList, dataRecords, boundColumn, style, onPropertyChange, onEvent]);

  // Handle text input change (for editable combos)
  const handleTextChange = useCallback((newText: string) => {
    if (style === DBControlConstants.COMBO_DROPDOWNLIST) return; // Not editable
    
    setCurrentText(newText);
    onPropertyChange?.('text', newText);
    
    // Try to find matching item
    if (matchEntry !== DBControlConstants.MATCH_NONE) {
      const matchIndex = currentList.findIndex(item => 
        item.toLowerCase().startsWith(newText.toLowerCase())
      );
      
      if (matchIndex >= 0) {
        setCurrentIndex(matchIndex);
        onPropertyChange?.('listIndex', matchIndex);
        
        if (selectRef.current) {
          selectRef.current.selectedIndex = matchIndex;
        }
      } else {
        setCurrentIndex(-1);
        onPropertyChange?.('listIndex', -1);
      }
    }
  }, [style, matchEntry, currentList, onPropertyChange]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (!enabled || locked) return;
    
    const newState = !isDroppedDown;
    setIsDroppedDown(newState);
    
    if (newState) {
      onEvent?.('DropDown');
    } else {
      onEvent?.('CloseUp');
    }
  }, [enabled, locked, isDroppedDown, onEvent]);

  // Load data on mount and when row source changes
  useEffect(() => {
    if (rowSource && !isDesignMode) {
      loadRowSource();
    }
  }, [rowSource, isDesignMode, loadRowSource]);

  if (!visible) {
    return null;
  }

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: style === DBControlConstants.COMBO_SIMPLE ? `${height}px` : '21px',
    fontSize: `${fontSize}px`,
    fontFamily: font,
    fontWeight: fontBold ? 'bold' : 'normal',
    fontStyle: fontItalic ? 'italic' : 'normal',
    outline: isDesignMode ? '1px dotted #333' : 'none'
  };

  if (style === DBControlConstants.COMBO_DROPDOWNLIST) {
    // Dropdown List style - acts like a select element
    return (
      <div
        className={`vb6-dbcombo dropdown-list ${!enabled ? 'disabled' : ''}`}
        style={containerStyle}
        data-name={name}
        data-type="DBCombo"
      >
        <select
          ref={selectRef}
          style={{
            width: '100%',
            height: '100%',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            backgroundColor: backColor,
            color: foreColor,
            border: '2px inset #d0d0d0',
            cursor: enabled ? 'default' : 'not-allowed'
          }}
          value={currentIndex >= 0 ? currentIndex : ''}
          onChange={(e) => {
            const selectedIndex = parseInt(e.target.value);
            if (!isNaN(selectedIndex)) {
              handleSelectionChange(selectedIndex);
            }
          }}
          disabled={!enabled || locked}
        >
          <option value="">(None)</option>
          {currentList.map((item, index) => (
            <option key={index} value={index}>
              {item}
            </option>
          ))}
        </select>

        {isDesignMode && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              fontSize: '10px',
              color: '#666',
              background: 'rgba(255,255,255,0.9)',
              padding: '2px',
              border: '1px solid #ccc',
              whiteSpace: 'nowrap',
              zIndex: 1000
            }}
          >
            {name} - DBCombo List ({currentList.length} items)
          </div>
        )}
      </div>
    );
  }

  // Dropdown Combo or Simple Combo styles
  return (
    <div
      className={`vb6-dbcombo ${style === DBControlConstants.COMBO_DROPDOWN ? 'dropdown' : 'simple'} ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      data-name={name}
      data-type="DBCombo"
    >
      <div style={{ position: 'relative', height: '21px' }}>
        <input
          ref={inputRef}
          type="text"
          value={currentText}
          maxLength={maxLength || undefined}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            onEvent?.('KeyDown', { keyCode: e.keyCode, key: e.key });
          }}
          onKeyPress={(e) => {
            onEvent?.('KeyPress', { charCode: e.charCode, key: e.key });
          }}
          onKeyUp={(e) => {
            onEvent?.('KeyUp', { keyCode: e.keyCode, key: e.key });
          }}
          style={{
            width: style === DBControlConstants.COMBO_DROPDOWN ? 'calc(100% - 17px)' : '100%',
            height: '17px',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            backgroundColor: backColor,
            color: foreColor,
            border: '2px inset #d0d0d0',
            paddingLeft: '2px',
            paddingRight: '2px'
          }}
          disabled={!enabled || locked}
          readOnly={locked}
        />
        
        {style === DBControlConstants.COMBO_DROPDOWN && (
          <button
            onClick={toggleDropdown}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '17px',
              height: '21px',
              border: '1px outset #d0d0d0',
              backgroundColor: '#d0d0d0',
              cursor: enabled ? 'pointer' : 'not-allowed',
              fontSize: '10px'
            }}
            disabled={!enabled || locked}
          >
            ▼
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {(style === DBControlConstants.COMBO_SIMPLE || (style === DBControlConstants.COMBO_DROPDOWN && isDroppedDown)) && (
        <div
          style={{
            position: style === DBControlConstants.COMBO_DROPDOWN ? 'absolute' : 'relative',
            top: style === DBControlConstants.COMBO_DROPDOWN ? '21px' : '0',
            left: 0,
            width: '100%',
            height: style === DBControlConstants.COMBO_SIMPLE ? 'calc(100% - 21px)' : '120px',
            backgroundColor: backColor,
            border: '2px inset #d0d0d0',
            zIndex: style === DBControlConstants.COMBO_DROPDOWN ? 1000 : 'auto',
            overflow: 'auto'
          }}
        >
          <select
            ref={selectRef}
            multiple
            size={Math.max(1, style === DBControlConstants.COMBO_SIMPLE ? Math.floor((height - 21) / 16) : 8)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              fontStyle: 'inherit',
              backgroundColor: 'inherit',
              color: 'inherit'
            }}
            value={currentIndex >= 0 ? [currentIndex.toString()] : []}
            onChange={(e) => {
              const selectedIndex = parseInt(e.target.value);
              if (!isNaN(selectedIndex)) {
                handleSelectionChange(selectedIndex);
                if (style === DBControlConstants.COMBO_DROPDOWN) {
                  setIsDroppedDown(false);
                  onEvent?.('CloseUp');
                }
              }
            }}
            disabled={!enabled || locked}
          >
            {currentList.map((item, index) => (
              <option key={index} value={index}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {name} - DBCombo ({currentList.length} items)
        </div>
      )}
    </div>
  );
};

// Helper Functions
export const DBControlHelpers = {
  /**
   * Create default DBList control
   */
  createDBList: (): DBListControl => {
    return {
      type: 'DBList',
      name: 'DBList1',
      left: 0,
      top: 0,
      width: 120,
      height: 100,
      dataSource: '',
      dataField: '',
      rowSource: '',
      listField: '',
      boundColumn: 0,
      list: [],
      listCount: 0,
      listIndex: -1,
      text: '',
      boundText: '',
      selectedValue: null,
      matchEntry: DBControlConstants.MATCH_STANDARD,
      sorted: false,
      integralHeight: true,
      backColor: '#FFFFFF',
      foreColor: '#000000',
      font: 'MS Sans Serif',
      fontSize: 8,
      fontBold: false,
      fontItalic: false,
      enabled: true,
      visible: true,
      locked: false,
      tag: ''
    };
  },

  /**
   * Create default DBCombo control
   */
  createDBCombo: (): DBComboControl => {
    return {
      ...DBControlHelpers.createDBList(),
      type: 'DBCombo',
      name: 'DBCombo1',
      height: 21,
      style: DBControlConstants.COMBO_DROPDOWN,
      maxLength: 0,
      selLength: 0,
      selStart: 0,
      selText: ''
    };
  },

  /**
   * Get style description
   */
  getStyleDescription: (style: number): string => {
    const descriptions: { [key: number]: string } = {
      [DBControlConstants.COMBO_DROPDOWN]: 'Dropdown Combo',
      [DBControlConstants.COMBO_SIMPLE]: 'Simple Combo',
      [DBControlConstants.COMBO_DROPDOWNLIST]: 'Dropdown List'
    };
    return descriptions[style] || 'Unknown';
  },

  /**
   * Get match entry description
   */
  getMatchEntryDescription: (matchEntry: number): string => {
    const descriptions: { [key: number]: string } = {
      [DBControlConstants.MATCH_NONE]: 'None',
      [DBControlConstants.MATCH_STANDARD]: 'Standard',
      [DBControlConstants.MATCH_EXTENDED]: 'Extended'
    };
    return descriptions[matchEntry] || 'Unknown';
  }
};

export default { DBListControl, DBComboControl, DBControlHelpers, DBControlConstants };