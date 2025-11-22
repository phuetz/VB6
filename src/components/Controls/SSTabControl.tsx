/**
 * VB6 SSTab Control Implementation
 * 
 * Tabbed dialog control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface SSTabControl {
  type: 'SSTab';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Tab Properties
  tabs: number;
  tab: number; // Current tab (0-based)
  tabCaption: string[];
  tabEnabled: boolean[];
  tabVisible: boolean[];
  tabPicture: string[];
  
  // Appearance
  backColor: string;
  foreColor: string;
  font: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  
  // Tab appearance
  tabOrientation: number; // 0=Top, 1=Bottom, 2=Left, 3=Right
  style: number; // 0=Tabs, 1=Buttons, 2=Flat Buttons
  tabsPerRow: number;
  tabMaxWidth: number;
  tabMinWidth: number;
  tabHeight: number;
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  multiRow: boolean;
  showFocusRect: boolean;
  
  // Appearance
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  mousePointer: number;
  tag: string;
  
  // Events
  onClick?: string;
  onBeforeClick?: string;
  onDblClick?: string;
  onKeyPress?: string;
  onKeyDown?: string;
  onKeyUp?: string;
}

interface SSTabControlProps {
  control: SSTabControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
  children?: React.ReactNode;
}

export const SSTabControl: React.FC<SSTabControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent,
  children
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 300,
    height = 200,
    tabs = 3,
    tab = 0,
    tabCaption = ['Tab 0', 'Tab 1', 'Tab 2'],
    tabEnabled = [true, true, true],
    tabVisible = [true, true, true],
    tabPicture = ['', '', ''],
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font = {
      name: 'MS Sans Serif',
      size: 8,
      bold: false,
      italic: false,
      underline: false
    },
    tabOrientation = 0,
    style = 0,
    tabsPerRow = 0,
    tabMaxWidth = 0,
    tabMinWidth = 0,
    tabHeight = 0,
    enabled = true,
    visible = true,
    multiRow = false,
    showFocusRect = true,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = ''
  } = control;

  const [currentTab, setCurrentTab] = useState(tab);
  const [focusedTab, setFocusedTab] = useState(-1);

  // Sync with control tab property
  useEffect(() => {
    setCurrentTab(tab);
  }, [tab]);

  // Handle tab click
  const handleTabClick = useCallback((tabIndex: number, event: React.MouseEvent) => {
    if (!enabled || !tabEnabled[tabIndex] || !tabVisible[tabIndex]) return;

    // Fire BeforeClick event (cancellable)
    let cancel = false;
    if (onEvent) {
      const result = onEvent('BeforeClick', { 
        tab: tabIndex, 
        cancel: false 
      });
      cancel = result?.cancel || false;
    }

    if (cancel) return;

    const oldTab = currentTab;
    setCurrentTab(tabIndex);
    onPropertyChange?.('tab', tabIndex);

    // Fire Click event
    onEvent?.('Click', { 
      previousTab: oldTab,
      tab: tabIndex
    });
  }, [enabled, tabEnabled, tabVisible, currentTab, onPropertyChange, onEvent]);

  // Handle double click
  const handleTabDoubleClick = useCallback((tabIndex: number, event: React.MouseEvent) => {
    if (!enabled || !tabEnabled[tabIndex]) return;
    
    onEvent?.('DblClick', { tab: tabIndex });
  }, [enabled, tabEnabled, onEvent]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;

    let newTab = currentTab;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        do {
          newTab = newTab > 0 ? newTab - 1 : tabs - 1;
        } while (!tabEnabled[newTab] && newTab !== currentTab);
        break;
        
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        do {
          newTab = newTab < tabs - 1 ? newTab + 1 : 0;
        } while (!tabEnabled[newTab] && newTab !== currentTab);
        break;
        
      case 'Home':
        event.preventDefault();
        newTab = 0;
        while (!tabEnabled[newTab] && newTab < tabs - 1) {
          newTab++;
        }
        break;
        
      case 'End':
        event.preventDefault();
        newTab = tabs - 1;
        while (!tabEnabled[newTab] && newTab > 0) {
          newTab--;
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(currentTab, event as any);
        return;
    }

    if (newTab !== currentTab) {
      handleTabClick(newTab, event as any);
    }

    onEvent?.('KeyDown', { 
      keyCode: event.keyCode, 
      shift: event.shiftKey, 
      ctrl: event.ctrlKey 
    });
  }, [enabled, currentTab, tabs, tabEnabled, handleTabClick, onEvent]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;
    onEvent?.('KeyPress', { keyAscii: event.charCode });
  }, [enabled, onEvent]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;
    onEvent?.('KeyUp', { 
      keyCode: event.keyCode, 
      shift: event.shiftKey, 
      ctrl: event.ctrlKey 
    });
  }, [enabled, onEvent]);

  if (!visible) {
    return null;
  }

  const getTabPosition = (): 'top' | 'bottom' | 'left' | 'right' => {
    switch (tabOrientation) {
      case 1: return 'bottom';
      case 2: return 'left';
      case 3: return 'right';
      default: return 'top';
    }
  };

  const getTabStyle = (): string => {
    switch (style) {
      case 1: return 'buttons';
      case 2: return 'flat-buttons';
      default: return 'tabs';
    }
  };

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '2px inset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'default';
  };

  const tabPosition = getTabPosition();
  const tabStyle = getTabStyle();
  const actualTabHeight = tabHeight > 0 ? tabHeight : 24;

  // Calculate content area dimensions
  const contentAreaStyle = {
    position: 'absolute' as const,
    backgroundColor: backColor,
    color: foreColor,
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    textDecoration: font.underline ? 'underline' : 'none',
    border: getBorderStyle(),
    ...(tabPosition === 'top' && {
      top: actualTabHeight,
      left: 0,
      right: 0,
      bottom: 0
    }),
    ...(tabPosition === 'bottom' && {
      top: 0,
      left: 0,
      right: 0,
      bottom: actualTabHeight
    }),
    ...(tabPosition === 'left' && {
      top: 0,
      left: actualTabHeight + 20,
      right: 0,
      bottom: 0
    }),
    ...(tabPosition === 'right' && {
      top: 0,
      left: 0,
      right: actualTabHeight + 20,
      bottom: 0
    })
  };

  return (
    <div
      className={`vb6-sstab ${!enabled ? 'disabled' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: getCursorStyle(),
        opacity: enabled ? 1 : 0.5,
        outline: isDesignMode ? '1px dotted #333' : 'none'
      }}
      tabIndex={enabled ? 0 : -1}
      onKeyDown={handleKeyDown}
      onKeyPress={handleKeyPress}
      onKeyUp={handleKeyUp}
      data-name={name}
      data-type="SSTab"
    >
      {/* Tab Headers */}
      <div
        className={`tab-headers tab-${tabPosition}`}
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: tabPosition === 'left' || tabPosition === 'right' ? 'column' : 'row',
          ...(tabPosition === 'top' && { top: 0, left: 0, right: 0, height: actualTabHeight }),
          ...(tabPosition === 'bottom' && { bottom: 0, left: 0, right: 0, height: actualTabHeight }),
          ...(tabPosition === 'left' && { top: 0, left: 0, bottom: 0, width: actualTabHeight + 20 }),
          ...(tabPosition === 'right' && { top: 0, right: 0, bottom: 0, width: actualTabHeight + 20 })
        }}
      >
        {Array.from({ length: tabs }, (_, index) => {
          if (!tabVisible[index]) return null;

          const isActive = index === currentTab;
          const isEnabled = tabEnabled[index];
          const caption = tabCaption[index] || `Tab ${index}`;

          const tabHeaderStyle = {
            padding: '4px 12px',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            opacity: isEnabled ? 1 : 0.5,
            backgroundColor: isActive ? backColor : '#e0e0e0',
            color: isActive ? foreColor : '#666666',
            border: tabStyle === 'tabs' ? '1px solid #999' : 'none',
            borderBottom: tabStyle === 'tabs' && tabPosition === 'top' && isActive ? 'none' : undefined,
            borderTop: tabStyle === 'tabs' && tabPosition === 'bottom' && isActive ? 'none' : undefined,
            borderRight: tabStyle === 'tabs' && tabPosition === 'left' && isActive ? 'none' : undefined,
            borderLeft: tabStyle === 'tabs' && tabPosition === 'right' && isActive ? 'none' : undefined,
            marginRight: tabStyle === 'buttons' ? '2px' : '0',
            marginBottom: tabStyle === 'buttons' ? '2px' : '0',
            borderRadius: tabStyle === 'buttons' ? '3px' : '0',
            fontFamily: font.name,
            fontSize: `${font.size}pt`,
            fontWeight: font.bold ? 'bold' : 'normal',
            fontStyle: font.italic ? 'italic' : 'normal',
            textDecoration: font.underline ? 'underline' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: tabMinWidth > 0 ? `${tabMinWidth}px` : 'auto',
            maxWidth: tabMaxWidth > 0 ? `${tabMaxWidth}px` : 'auto',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            outline: showFocusRect && focusedTab === index ? '1px dotted #000' : 'none'
          };

          return (
            <div
              key={index}
              className={`tab-header ${isActive ? 'active' : ''} ${isEnabled ? '' : 'disabled'}`}
              style={tabHeaderStyle}
              onClick={(e) => handleTabClick(index, e)}
              onDoubleClick={(e) => handleTabDoubleClick(index, e)}
              onFocus={() => setFocusedTab(index)}
              onBlur={() => setFocusedTab(-1)}
              role="tab"
              aria-selected={isActive}
              aria-disabled={!isEnabled}
            >
              {tabPicture[index] && (
                <img
                  src={tabPicture[index]}
                  alt=""
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '4px'
                  }}
                />
              )}
              {caption}
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div
        className="tab-content"
        style={contentAreaStyle}
      >
        {/* Render children for current tab */}
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            // Show child only if it belongs to the current tab
            const childTab = (child.props as any)?.tab;
            if (childTab === undefined || childTab === currentTab) {
              return React.cloneElement(child, {
                ...child.props,
                style: {
                  ...((child.props as any)?.style || {}),
                  display: childTab === currentTab || childTab === undefined ? 'block' : 'none'
                }
              });
            }
          }
          return null;
        })}
      </div>

      {/* Design Mode Info */}
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
          {name} (Tab {currentTab}, {tabs} tabs)
        </div>
      )}
    </div>
  );
};

export default SSTabControl;