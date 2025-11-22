/**
 * VB6 ImageCombo Control Implementation
 * 
 * Complete implementation of ImageCombo control with icons for each item
 * Combines ComboBox functionality with ImageList integration
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface ImageComboItem {
  key: string;
  text: string;
  imageIndex: number;
  tag?: string;
  indentation?: number;
  selected?: boolean;
}

export interface ImageComboControl {
  type: 'ImageCombo';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Data Properties
  items: ImageComboItem[];
  imageList?: string; // Reference to ImageList control
  selectedItem: number; // Index of selected item (-1 = none)
  text: string; // Current text value
  
  // Behavior Properties
  style: number; // 0=Dropdown Combo, 1=Simple Combo, 2=Dropdown List
  sorted: boolean; // Sort items alphabetically
  locked: boolean; // Prevent editing
  maxLength: number; // Maximum text length
  
  // Display Properties
  itemHeight: number; // Height of each item in pixels
  visibleItems: number; // Number of visible items in dropdown
  indent: number; // Indentation for hierarchical items
  
  // Appearance Properties
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  backColor: string;
  foreColor: string;
  font: string;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  
  // State Properties
  enabled: boolean;
  visible: boolean;
  tabStop: boolean;
  tabIndex: number;
  tag: string;
  
  // Events
  onClick?: string;
  onComboClick?: string;
  onChange?: string;
  onDropDown?: string;
  onKeyDown?: string;
  onKeyPress?: string;
  onKeyUp?: string;
}

interface ImageComboControlProps {
  control: ImageComboControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const ImageComboControl: React.FC<ImageComboControlProps> = ({
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
    items = [],
    imageList,
    selectedItem = -1,
    text = '',
    style = 0,
    sorted = false,
    locked = false,
    maxLength = 0,
    itemHeight = 16,
    visibleItems = 8,
    indent = 16,
    appearance = 1,
    borderStyle = 1,
    backColor = '#ffffff',
    foreColor = '#000000',
    font = 'MS Sans Serif',
    fontSize = 8,
    fontBold = false,
    fontItalic = false,
    fontUnderline = false,
    enabled = true,
    visible = true,
    tabStop = true,
    tabIndex = 0,
    tag = ''
  } = control;

  const [isDroppedDown, setIsDroppedDown] = useState(false);
  const [inputText, setInputText] = useState(text);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [imageListImages, setImageListImages] = useState<HTMLImageElement[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sort items if needed
  const processedItems = useMemo(() => {
    const itemsCopy = [...items];
    if (sorted) {
      itemsCopy.sort((a, b) => a.text.localeCompare(b.text));
    }
    return itemsCopy;
  }, [items, sorted]);

  // Load images from ImageList (simulated)
  useEffect(() => {
    if (imageList) {
      // In a real implementation, this would reference an actual ImageList control
      // For now, we'll simulate with placeholder images
      const placeholderImages: HTMLImageElement[] = [];
      for (let i = 0; i < 16; i++) {
        const img = new Image();
        img.src = `data:image/svg+xml,${encodeURIComponent(`
          <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" fill="hsl(${i * 22}, 70%, 60%)"/>
            <text x="8" y="12" text-anchor="middle" font-size="10" fill="white">${i}</text>
          </svg>
        `)}`;
        placeholderImages.push(img);
      }
      setImageListImages(placeholderImages);
    }
  }, [imageList]);

  // Update input text when external text changes
  useEffect(() => {
    setInputText(text);
  }, [text]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDroppedDown(false);
      }
    };

    if (isDroppedDown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDroppedDown]);

  // VB6-compatible methods
  const imageComboMethods = useCallback(() => ({
    // Item management
    addItem: (text: string, imageIndex: number = -1, key?: string, tag?: string, indentation?: number) => {
      const newItem: ImageComboItem = {
        key: key || `item_${Date.now()}`,
        text,
        imageIndex,
        tag,
        indentation
      };
      
      const newItems = [...items, newItem];
      onPropertyChange?.('items', newItems);
      return newItems.length - 1; // Return new item index
    },
    
    removeItem: (index: number) => {
      if (index >= 0 && index < items.length) {
        const newItems = items.filter((_, i) => i !== index);
        onPropertyChange?.('items', newItems);
        
        // Adjust selected item if necessary
        if (selectedItem === index) {
          onPropertyChange?.('selectedItem', -1);
          onPropertyChange?.('text', '');
        } else if (selectedItem > index) {
          onPropertyChange?.('selectedItem', selectedItem - 1);
        }
      }
    },
    
    clear: () => {
      onPropertyChange?.('items', []);
      onPropertyChange?.('selectedItem', -1);
      onPropertyChange?.('text', '');
    },
    
    // Selection methods
    selectItem: (index: number) => {
      if (index >= -1 && index < items.length) {
        onPropertyChange?.('selectedItem', index);
        if (index >= 0) {
          onPropertyChange?.('text', items[index].text);
          setInputText(items[index].text);
        } else {
          onPropertyChange?.('text', '');
          setInputText('');
        }
      }
    },
    
    findItem: (text: string, startIndex: number = 0) => {
      for (let i = startIndex; i < items.length; i++) {
        if (items[i].text.toLowerCase().includes(text.toLowerCase())) {
          return i;
        }
      }
      return -1;
    },
    
    // Dropdown methods
    dropdown: () => {
      if (enabled && !locked) {
        setIsDroppedDown(true);
        onEvent?.('DropDown');
      }
    },
    
    closeup: () => {
      setIsDroppedDown(false);
    },
    
    // Text methods
    setText: (newText: string) => {
      const limitedText = maxLength > 0 ? newText.substring(0, maxLength) : newText;
      setInputText(limitedText);
      onPropertyChange?.('text', limitedText);
    },
    
    getText: () => inputText,
    
    // Utility methods
    refresh: () => {
      // Force re-render by updating a dummy state
      setFocusedIndex(prev => prev);
    }
  }), [items, selectedItem, enabled, locked, maxLength, inputText, onPropertyChange, onEvent]);

  // Expose methods globally for VB6 compatibility
  useEffect(() => {
    const global = window as any;
    if (!global.VB6Controls) global.VB6Controls = {};
    global.VB6Controls[name] = imageComboMethods();
    
    return () => {
      if (global.VB6Controls) {
        delete global.VB6Controls[name];
      }
    };
  }, [name, imageComboMethods]);

  // Event handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked || !enabled) return;
    
    const newValue = e.target.value;
    const limitedValue = maxLength > 0 ? newValue.substring(0, maxLength) : newValue;
    
    setInputText(limitedValue);
    onPropertyChange?.('text', limitedValue);
    onEvent?.('Change', { text: limitedValue });
  }, [locked, enabled, maxLength, onPropertyChange, onEvent]);

  const handleInputClick = useCallback(() => {
    if (!enabled) return;
    
    onEvent?.('Click');
    if (control.onClick) {
      onEvent?.('Execute', { code: control.onClick });
    }
  }, [enabled, control.onClick, onEvent]);

  const handleDropdownToggle = useCallback(() => {
    if (!enabled || style === 1) return; // Simple combo doesn't have dropdown
    
    if (isDroppedDown) {
      setIsDroppedDown(false);
    } else {
      setIsDroppedDown(true);
      onEvent?.('DropDown');
      if (control.onDropDown) {
        onEvent?.('Execute', { code: control.onDropDown });
      }
    }
  }, [enabled, style, isDroppedDown, control.onDropDown, onEvent]);

  const handleItemClick = useCallback((index: number) => {
    if (!enabled) return;
    
    const item = processedItems[index];
    if (item) {
      setInputText(item.text);
      onPropertyChange?.('selectedItem', index);
      onPropertyChange?.('text', item.text);
      setIsDroppedDown(false);
      
      onEvent?.('ComboClick', { index, item });
      if (control.onComboClick) {
        onEvent?.('Execute', { code: control.onComboClick });
      }
      
      onEvent?.('Change', { text: item.text });
      if (control.onChange) {
        onEvent?.('Execute', { code: control.onChange });
      }
    }
  }, [enabled, processedItems, onPropertyChange, onEvent, control.onComboClick, control.onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return;
    
    switch (e.key) {
      case 'ArrowDown':
        if (isDroppedDown) {
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, processedItems.length - 1));
        } else if (style !== 1) {
          setIsDroppedDown(true);
        }
        break;
        
      case 'ArrowUp':
        if (isDroppedDown) {
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
        }
        break;
        
      case 'Enter':
        if (isDroppedDown && focusedIndex >= 0) {
          e.preventDefault();
          handleItemClick(focusedIndex);
        }
        break;
        
      case 'Escape':
        if (isDroppedDown) {
          e.preventDefault();
          setIsDroppedDown(false);
        }
        break;
    }
    
    onEvent?.('KeyDown', { key: e.key, keyCode: e.keyCode });
    if (control.onKeyDown) {
      onEvent?.('Execute', { code: control.onKeyDown });
    }
  }, [enabled, isDroppedDown, focusedIndex, processedItems.length, style, handleItemClick, onEvent, control.onKeyDown]);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px inset #d0d0d0';
  };

  const getFontStyle = (): React.CSSProperties => ({
    fontFamily: font,
    fontSize: `${fontSize}pt`,
    fontWeight: fontBold ? 'bold' : 'normal',
    fontStyle: fontItalic ? 'italic' : 'normal',
    textDecoration: fontUnderline ? 'underline' : 'none'
  });

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    outline: isDesignMode ? '1px dotted #333' : 'none'
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    border: getBorderStyle(),
    backgroundColor: enabled ? backColor : '#f0f0f0',
    opacity: enabled ? 1 : 0.6
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '2px 4px',
    backgroundColor: 'transparent',
    color: foreColor,
    ...getFontStyle(),
    readOnly: style === 2 // Dropdown List is read-only
  };

  const dropdownButtonStyle: React.CSSProperties = {
    width: '17px',
    height: '100%',
    border: 'none',
    backgroundColor: '#e0e0e0',
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: `${visibleItems * itemHeight + 4}px`,
    backgroundColor: backColor,
    border: '1px solid #808080',
    borderTop: 'none',
    zIndex: 1000,
    overflowY: 'auto'
  };

  const renderItem = (item: ImageComboItem, index: number) => {
    const isSelected = index === selectedItem;
    const isFocused = index === focusedIndex;
    const image = imageListImages[item.imageIndex];

    const itemStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      height: `${itemHeight}px`,
      padding: '2px 4px',
      paddingLeft: `${4 + (item.indentation || 0) * indent}px`,
      backgroundColor: isSelected ? '#0078d4' : isFocused ? '#e5f3ff' : 'transparent',
      color: isSelected ? 'white' : foreColor,
      cursor: 'pointer',
      ...getFontStyle()
    };

    return (
      <div
        key={item.key}
        style={itemStyle}
        onClick={() => handleItemClick(index)}
        onMouseEnter={() => setFocusedIndex(index)}
      >
        {image && (
          <img
            src={image.src}
            alt=""
            style={{
              width: '16px',
              height: '16px',
              marginRight: '4px'
            }}
          />
        )}
        <span>{item.text}</span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`vb6-image-combo ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      data-name={name}
      data-type="ImageCombo"
    >
      <div style={inputContainerStyle}>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          disabled={!enabled}
          readOnly={locked || style === 2}
          tabIndex={tabStop ? tabIndex : -1}
        />
        
        {style !== 1 && ( // Hide dropdown button for Simple combo
          <button
            style={dropdownButtonStyle}
            onClick={handleDropdownToggle}
            disabled={!enabled}
            tabIndex={-1}
          >
            ▼
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {isDroppedDown && style !== 1 && (
        <div ref={dropdownRef} style={dropdownStyle}>
          {processedItems.map((item, index) => renderItem(item, index))}
          
          {processedItems.length === 0 && (
            <div style={{
              padding: '8px',
              color: '#666',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              No items
            </div>
          )}
        </div>
      )}

      {/* Design mode info */}
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
            zIndex: 1001
          }}
        >
          {name} ({processedItems.length} items)
        </div>
      )}
    </div>
  );
};

// Default properties for design-time
export const ImageComboDefaults: Partial<ImageComboControl> = {
  type: 'ImageCombo',
  width: 120,
  height: 21,
  items: [],
  selectedItem: -1,
  text: '',
  style: 0,
  sorted: false,
  locked: false,
  maxLength: 0,
  itemHeight: 16,
  visibleItems: 8,
  indent: 16,
  appearance: 1,
  borderStyle: 1,
  backColor: '#ffffff',
  foreColor: '#000000',
  font: 'MS Sans Serif',
  fontSize: 8,
  fontBold: false,
  fontItalic: false,
  fontUnderline: false,
  enabled: true,
  visible: true,
  tabStop: true,
  tabIndex: 0,
  tag: ''
};

// Helper functions for ImageCombo management
export const ImageComboHelpers = {
  createItem: (text: string, imageIndex: number = -1, key?: string, tag?: string): ImageComboItem => ({
    key: key || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    imageIndex,
    tag
  }),

  findItemByText: (items: ImageComboItem[], text: string, exact: boolean = false): number => {
    return items.findIndex(item => 
      exact ? item.text === text : item.text.toLowerCase().includes(text.toLowerCase())
    );
  },

  findItemByKey: (items: ImageComboItem[], key: string): number => {
    return items.findIndex(item => item.key === key);
  },

  sortItems: (items: ImageComboItem[]): ImageComboItem[] => {
    return [...items].sort((a, b) => a.text.localeCompare(b.text));
  }
};

export default ImageComboControl;