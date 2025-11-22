/**
 * TabStrip Control - Complete VB6 Tab Container Implementation
 * Provides tabbed interface with full VB6 compatibility
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// TabStrip Constants
export enum TabStripStyle {
  tabTabs = 0,
  tabButtons = 1
}

export enum TabStripTabWidthStyle {
  tabJustified = 0,
  tabNonJustified = 1,
  tabFixed = 2
}

export interface Tab {
  index: number;
  key: string;
  caption: string;
  tag: string;
  image: number;
  toolTipText: string;
  visible: boolean;
  selected: boolean;
}

export interface TabStripProps extends VB6ControlPropsEnhanced {
  // Tabs collection
  tabs?: Tab[];
  
  // Appearance
  style?: TabStripStyle;
  tabWidthStyle?: TabStripTabWidthStyle;
  tabFixedWidth?: number;
  tabFixedHeight?: number;
  tabMinWidth?: number;
  separators?: boolean;
  hotTracking?: boolean;
  
  // Images
  imageList?: string; // ImageList control name
  
  // Current selection
  selectedItem?: number;
  
  // Behavior
  multiRow?: boolean;
  showTips?: boolean;
  
  // Events
  onClick?: (tab: Tab) => void;
  onBeforeClick?: (tab: Tab, cancel: boolean) => void;
}

export const TabStripControl = forwardRef<HTMLDivElement, TabStripProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 300,
    height = 200,
    visible = true,
    enabled = true,
    tabs: initialTabs = [],
    style = TabStripStyle.tabTabs,
    tabWidthStyle = TabStripTabWidthStyle.tabJustified,
    tabFixedWidth = 0,
    tabFixedHeight = 0,
    tabMinWidth = 0,
    separators = false,
    hotTracking = true,
    imageList = '',
    selectedItem = 0,
    multiRow = false,
    showTips = true,
    onClick,
    onBeforeClick,
    ...rest
  } = props;

  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
  const [selectedIndex, setSelectedIndex] = useState(selectedItem);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [draggedTab, setDraggedTab] = useState<number | null>(null);
  
  const tabStripRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    // Tab management
    Add: (index?: number, key?: string, caption?: string, image?: number) => {
      const newIndex = index ?? tabs.length + 1;
      const newTab: Tab = {
        index: newIndex,
        key: key || `Tab${newIndex}`,
        caption: caption || `Tab ${newIndex}`,
        tag: '',
        image: image || -1,
        toolTipText: '',
        visible: true,
        selected: false
      };
      
      const newTabs = [...tabs];
      if (index !== undefined && index <= tabs.length) {
        newTabs.splice(index - 1, 0, newTab);
        // Reindex subsequent tabs
        for (let i = index; i < newTabs.length; i++) {
          newTabs[i].index = i + 1;
        }
      } else {
        newTabs.push(newTab);
      }
      
      setTabs(newTabs);
      fireEvent(name, 'TabAdded', { tab: newTab });
      return newTab;
    },

    Remove: (index: number) => {
      if (index < 1 || index > tabs.length) return false;
      
      const removedTab = tabs[index - 1];
      const newTabs = tabs.filter((_, i) => i !== index - 1);
      
      // Reindex remaining tabs
      newTabs.forEach((tab, i) => {
        tab.index = i + 1;
      });
      
      setTabs(newTabs);
      
      // Adjust selected index if necessary
      if (selectedIndex >= index) {
        setSelectedIndex(Math.max(1, selectedIndex - 1));
      }
      
      fireEvent(name, 'TabRemoved', { tab: removedTab });
      return true;
    },

    Clear: () => {
      setTabs([]);
      setSelectedIndex(0);
      fireEvent(name, 'TabsCleared', {});
    },

    // Selection methods
    SelectTab: (index: number) => {
      if (index < 1 || index > tabs.length) return false;
      
      const tab = tabs[index - 1];
      if (!tab.visible) return false;
      
      const cancel = false;
      onBeforeClick?.(tab, cancel);
      fireEvent(name, 'BeforeClick', { tab, cancel });
      
      if (cancel) return false;
      
      setSelectedIndex(index);
      
      // Update selected state
      const newTabs = tabs.map((t, i) => ({
        ...t,
        selected: i === index - 1
      }));
      setTabs(newTabs);
      
      onClick?.(tab);
      fireEvent(name, 'Click', { tab });
      return true;
    },

    // Properties
    get Count() { return tabs.length; },
    get SelectedItem() { return selectedIndex > 0 ? tabs[selectedIndex - 1] : null; },
    
    // Item access
    Item: (index: number) => {
      if (index < 1 || index > tabs.length) return null;
      return tabs[index - 1];
    }
  };

  const handleTabClick = useCallback((tabIndex: number, e: React.MouseEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    vb6Methods.SelectTab(tabIndex + 1);
  }, [enabled, vb6Methods]);

  const handleTabMouseEnter = useCallback((tabIndex: number) => {
    if (hotTracking) {
      setHoveredIndex(tabIndex);
    }
  }, [hotTracking]);

  const handleTabMouseLeave = useCallback(() => {
    setHoveredIndex(-1);
  }, []);

  const handleTabDragStart = useCallback((tabIndex: number, e: React.DragEvent) => {
    if (!enabled) return;
    
    setDraggedTab(tabIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabIndex.toString());
  }, [enabled]);

  const handleTabDragOver = useCallback((e: React.DragEvent) => {
    if (draggedTab !== null) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }, [draggedTab]);

  const handleTabDrop = useCallback((targetIndex: number, e: React.DragEvent) => {
    if (draggedTab === null || !enabled) return;
    
    e.preventDefault();
    
    if (draggedTab !== targetIndex) {
      const newTabs = [...tabs];
      const draggedTabObj = newTabs[draggedTab];
      
      // Remove dragged tab
      newTabs.splice(draggedTab, 1);
      
      // Insert at new position
      const insertIndex = targetIndex > draggedTab ? targetIndex - 1 : targetIndex;
      newTabs.splice(insertIndex, 0, draggedTabObj);
      
      // Reindex all tabs
      newTabs.forEach((tab, i) => {
        tab.index = i + 1;
      });
      
      setTabs(newTabs);
      fireEvent(name, 'TabMoved', { from: draggedTab + 1, to: targetIndex + 1 });
    }
    
    setDraggedTab(null);
  }, [draggedTab, enabled, tabs, name, fireEvent]);

  // Calculate tab dimensions
  const getTabWidth = useCallback((tab: Tab, index: number) => {
    if (tabWidthStyle === TabStripTabWidthStyle.tabFixed && tabFixedWidth > 0) {
      return tabFixedWidth;
    }
    
    if (tabWidthStyle === TabStripTabWidthStyle.tabJustified) {
      return Math.floor(width / Math.max(1, tabs.length));
    }
    
    // Auto-size based on content
    const minWidth = tabMinWidth || 50;
    const textWidth = tab.caption.length * 8 + 20; // Approximate
    const imageWidth = tab.image >= 0 ? 20 : 0;
    return Math.max(minWidth, textWidth + imageWidth);
  }, [tabWidthStyle, tabFixedWidth, width, tabs.length, tabMinWidth]);

  const getTabHeight = () => {
    return tabFixedHeight > 0 ? tabFixedHeight : 24;
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Tabs', tabs);
    updateControl(id, 'SelectedItem', selectedIndex);
    updateControl(id, 'Count', tabs.length);
  }, [id, tabs, selectedIndex, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = {
        Add: vb6Methods.Add,
        Remove: vb6Methods.Remove,
        Clear: vb6Methods.Clear,
        SelectTab: vb6Methods.SelectTab,
        Item: vb6Methods.Item,
        get Count() { return vb6Methods.Count; },
        get SelectedItem() { return vb6Methods.SelectedItem; }
      };
    }
  }, [name, vb6Methods]);

  if (!visible) return null;

  const tabHeight = getTabHeight();
  const isButtonStyle = style === TabStripStyle.tabButtons;
  
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '2px inset #c0c0c0',
        backgroundColor: '#f0f0f0',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5,
        overflow: 'hidden'
      }}
      {...rest}
    >
      {/* Tab headers */}
      <div
        ref={tabStripRef}
        style={{
          display: 'flex',
          flexDirection: multiRow ? 'column' : 'row',
          flexWrap: multiRow ? 'wrap' : 'nowrap',
          height: isButtonStyle ? tabHeight : tabHeight + 2,
          backgroundColor: '#f0f0f0',
          borderBottom: isButtonStyle ? 'none' : '1px solid #808080',
          overflow: 'hidden'
        }}
      >
        {tabs.map((tab, index) => {
          if (!tab.visible) return null;
          
          const isSelected = selectedIndex === index + 1;
          const isHovered = hoveredIndex === index;
          const tabWidth = getTabWidth(tab, index);
          
          let tabStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: tabWidth,
            height: tabHeight,
            padding: '2px 8px',
            cursor: enabled ? 'pointer' : 'not-allowed',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          };
          
          if (isButtonStyle) {
            // Button style tabs
            tabStyle = {
              ...tabStyle,
              border: '1px outset #c0c0c0',
              backgroundColor: isSelected ? '#e0e0e0' : isHovered ? '#f8f8f8' : '#f0f0f0',
              marginRight: '1px'
            };
            
            if (isSelected) {
              tabStyle.border = '1px inset #c0c0c0';
            }
          } else {
            // Traditional tab style
            tabStyle = {
              ...tabStyle,
              backgroundColor: isSelected ? '#f0f0f0' : '#d0d0d0',
              border: '1px solid #808080',
              borderBottom: isSelected ? '1px solid #f0f0f0' : '1px solid #808080',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
              marginBottom: isSelected ? '0' : '2px',
              zIndex: isSelected ? 10 : 1
            };
            
            if (isHovered && !isSelected) {
              tabStyle.backgroundColor = '#e8e8e8';
            }
          }
          
          return (
            <div
              key={tab.key}
              style={tabStyle}
              onClick={(e) => handleTabClick(index, e)}
              onMouseEnter={() => handleTabMouseEnter(index)}
              onMouseLeave={handleTabMouseLeave}
              onDragStart={(e) => handleTabDragStart(index, e)}
              onDragOver={handleTabDragOver}
              onDrop={(e) => handleTabDrop(index, e)}
              draggable={enabled}
              title={showTips ? tab.toolTipText || tab.caption : undefined}
            >
              {/* Tab image */}
              {tab.image >= 0 && imageList && (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundImage: `url(images/${imageList})`,
                    backgroundPosition: `-${tab.image * 16}px 0`,
                    backgroundRepeat: 'no-repeat',
                    marginRight: '4px'
                  }}
                />
              )}
              
              {/* Tab caption */}
              <span style={{ 
                fontSize: '8pt',
                fontWeight: isSelected ? 'bold' : 'normal',
                color: enabled ? '#000000' : '#808080'
              }}>
                {tab.caption}
              </span>
              
              {/* Separator */}
              {separators && index < tabs.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '1px',
                    backgroundColor: '#808080'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Tab content area */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#f0f0f0',
          border: isButtonStyle ? '1px inset #c0c0c0' : 'none',
          margin: isButtonStyle ? '2px' : '0',
          height: height - tabHeight - (isButtonStyle ? 6 : 2),
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Content placeholder - actual content would be rendered by parent */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666666',
            fontSize: '10pt',
            fontStyle: 'italic'
          }}
        >
          {tabs.length > 0 && selectedIndex > 0 ? 
            `Tab Content: ${tabs[selectedIndex - 1]?.caption}` : 
            'No tabs available'
          }
        </div>
      </div>
    </div>
  );
});

TabStripControl.displayName = 'TabStripControl';

export default TabStripControl;