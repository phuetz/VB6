import React, { useRef, useState, useCallback } from 'react';
import { Control } from '../../context/types';

interface TabStripProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

interface VB6Tab {
  index: number;
  caption: string;
  key: string;
  tag: string;
  image: number;
  enabled: boolean;
  visible: boolean;
  tooltipText: string;
}

const TabStrip: React.FC<TabStripProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const properties = control.properties || {};

  // VB6 TabStrip Properties
  const tabs: VB6Tab[] = properties.Tabs || [
    { index: 1, caption: 'Tab 1', key: 'Tab1', tag: '', image: 0, enabled: true, visible: true, tooltipText: '' },
    { index: 2, caption: 'Tab 2', key: 'Tab2', tag: '', image: 0, enabled: true, visible: true, tooltipText: '' },
    { index: 3, caption: 'Tab 3', key: 'Tab3', tag: '', image: 0, enabled: true, visible: true, tooltipText: '' }
  ];
  
  const selectedTab = properties.SelectedItem || 1;
  const style = properties.Style || 0; // 0=tabTabs, 1=tabButtons, 2=tabFlatButtons
  const tabOrientation = properties.TabOrientation || 0; // 0=tabOrientationTop, 1=tabOrientationBottom, 2=tabOrientationLeft, 3=tabOrientationRight
  const multiRow = properties.MultiRow === true;
  const tabFixedWidth = properties.TabFixedWidth || 0; // 0 = auto width
  const tabFixedHeight = properties.TabFixedHeight || 0; // 0 = auto height
  const hotTracking = properties.HotTracking === true;
  const separators = properties.Separators === true;
  const showTips = properties.ShowTips === true;
  const tabWidthStyle = properties.TabWidthStyle || 0; // 0=tabJustified, 1=tabNonJustified, 2=tabFixed
  const imageList = properties.ImageList || null;

  // Handle tab click
  const handleTabClick = useCallback((tabIndex: number) => {
    const tab = tabs.find(t => t.index === tabIndex);
    if (!tab || !tab.enabled) return;

    // Update selected item
    if (control.events?.onChange) {
      control.events.onChange('SelectedItem', tabIndex);
    }

    // Trigger VB6 events
    if (control.events?.Click) {
      control.events.Click();
    }
  }, [tabs, control.events]);

  // Mouse event handlers for control dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();

    if (e.detail === 2) {
      onDoubleClick();
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handles
    const handleSize = 8;
    const isOnRightEdge = x >= control.width - handleSize;
    const isOnBottomEdge = y >= control.height - handleSize;
    const isOnLeftEdge = x <= handleSize;
    const isOnTopEdge = y <= handleSize;

    if (selected && (isOnRightEdge || isOnBottomEdge || isOnLeftEdge || isOnTopEdge)) {
      setIsResizing(true);
      let corner = '';
      if (isOnTopEdge && isOnLeftEdge) corner = 'nw';
      else if (isOnTopEdge && isOnRightEdge) corner = 'ne';
      else if (isOnBottomEdge && isOnLeftEdge) corner = 'sw';
      else if (isOnBottomEdge && isOnRightEdge) corner = 'se';
      else if (isOnTopEdge) corner = 'n';
      else if (isOnBottomEdge) corner = 's';
      else if (isOnLeftEdge) corner = 'w';
      else if (isOnRightEdge) corner = 'e';
      setResizeCorner(corner);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Calculate tab dimensions
  const calculateTabDimensions = useCallback(() => {
    const visibleTabs = tabs.filter(tab => tab.visible);
    const tabCount = visibleTabs.length;
    if (tabCount === 0) return { tabWidth: 0, tabHeight: 0 };

    let tabWidth, tabHeight;

    if (tabOrientation === 0 || tabOrientation === 1) { // Top or Bottom
      tabHeight = tabFixedHeight || 20;
      if (tabFixedWidth > 0) {
        tabWidth = tabFixedWidth;
      } else if (tabWidthStyle === 2) { // Fixed
        tabWidth = 80;
      } else if (tabWidthStyle === 0) { // Justified
        tabWidth = Math.floor((control.width - 4) / tabCount);
      } else { // Non-justified
        tabWidth = 80;
      }
    } else { // Left or Right
      tabWidth = tabFixedWidth || 80;
      if (tabFixedHeight > 0) {
        tabHeight = tabFixedHeight;
      } else {
        tabHeight = Math.floor((control.height - 4) / tabCount);
      }
    }

    return { tabWidth, tabHeight };
  }, [tabs, tabOrientation, tabFixedWidth, tabFixedHeight, tabWidthStyle, control.width, control.height]);

  const { tabWidth, tabHeight } = calculateTabDimensions();

  // Render individual tab
  const renderTab = useCallback((tab: VB6Tab, index: number) => {
    const isSelected = tab.index === selectedTab;
    const isHorizontal = tabOrientation === 0 || tabOrientation === 1;
    
    const tabStyle: React.CSSProperties = {
      position: 'absolute',
      width: isHorizontal ? tabWidth : tabHeight,
      height: isHorizontal ? tabHeight : tabWidth,
      backgroundColor: isSelected ? '#c0c0c0' : '#e0e0e0',
      border: style === 0 ? (isSelected ? '2px inset #c0c0c0' : '1px outset #c0c0c0') : '1px outset #c0c0c0',
      cursor: tab.enabled ? 'pointer' : 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '8pt',
      fontFamily: 'MS Sans Serif',
      color: tab.enabled ? '#000000' : '#808080',
      userSelect: 'none',
      opacity: tab.enabled ? 1 : 0.5,
      zIndex: isSelected ? 10 : 1
    };

    // Position tabs based on orientation
    switch (tabOrientation) {
      case 0: // Top
        tabStyle.left = index * tabWidth + 2;
        tabStyle.top = 0;
        if (isSelected) {
          tabStyle.height = tabHeight + 2;
          tabStyle.borderBottom = 'none';
        }
        break;
      case 1: // Bottom
        tabStyle.left = index * tabWidth + 2;
        tabStyle.bottom = 0;
        if (isSelected) {
          tabStyle.height = tabHeight + 2;
          tabStyle.borderTop = 'none';
        }
        break;
      case 2: // Left
        tabStyle.left = 0;
        tabStyle.top = index * tabHeight + 2;
        if (isSelected) {
          tabStyle.width = tabWidth + 2;
          tabStyle.borderRight = 'none';
        }
        break;
      case 3: // Right
        tabStyle.right = 0;
        tabStyle.top = index * tabHeight + 2;
        if (isSelected) {
          tabStyle.width = tabWidth + 2;
          tabStyle.borderLeft = 'none';
        }
        break;
    }

    // Apply style variations
    if (style === 1) { // Buttons
      tabStyle.border = '1px outset #c0c0c0';
      tabStyle.backgroundColor = isSelected ? '#a0a0a0' : '#c0c0c0';
    } else if (style === 2) { // Flat buttons
      tabStyle.border = isSelected ? '1px inset #c0c0c0' : '1px solid #e0e0e0';
      tabStyle.backgroundColor = isSelected ? '#a0a0a0' : '#f0f0f0';
    }

    return (
      <div
        key={tab.key}
        style={tabStyle}
        onClick={(e) => {
          e.stopPropagation();
          handleTabClick(tab.index);
        }}
        title={showTips ? tab.tooltipText || tab.caption : undefined}
        onMouseEnter={hotTracking ? undefined : undefined} // Hot tracking would highlight on hover
      >
        {/* Tab image if ImageList is set */}
        {imageList && tab.image > 0 && (
          <span style={{ marginRight: 4 }}>🖼</span>
        )}
        
        {/* Tab caption */}
        <span>{tab.caption}</span>
        
        {/* Separator */}
        {separators && index < tabs.length - 1 && (
          <div
            style={{
              position: 'absolute',
              right: -1,
              top: 2,
              bottom: 2,
              width: 1,
              backgroundColor: '#808080'
            }}
          />
        )}
      </div>
    );
  }, [selectedTab, tabOrientation, tabWidth, tabHeight, style, tabs.length, imageList, showTips, separators, hotTracking, handleTabClick]);

  // Calculate client area (content area)
  const getClientArea = useCallback(() => {
    let clientLeft = 2, clientTop = 2, clientWidth = control.width - 4, clientHeight = control.height - 4;

    switch (tabOrientation) {
      case 0: // Top
        clientTop += tabHeight;
        clientHeight -= tabHeight;
        break;
      case 1: // Bottom
        clientHeight -= tabHeight;
        break;
      case 2: // Left
        clientLeft += tabWidth;
        clientWidth -= tabWidth;
        break;
      case 3: // Right
        clientWidth -= tabWidth;
        break;
    }

    return { clientLeft, clientTop, clientWidth, clientHeight };
  }, [control.width, control.height, tabOrientation, tabWidth, tabHeight]);

  const { clientLeft, clientTop, clientWidth, clientHeight } = getClientArea();

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '1px solid #808080',
    backgroundColor: properties.BackColor || '#c0c0c0',
    cursor: isDragging ? 'move' : 'default',
    overflow: 'hidden'
  };

  const clientAreaStyle: React.CSSProperties = {
    position: 'absolute',
    left: clientLeft,
    top: clientTop,
    width: clientWidth,
    height: clientHeight,
    backgroundColor: '#c0c0c0',
    border: '1px inset #c0c0c0'
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      className="vb6-tabstrip"
    >
      {/* Render all tabs */}
      {tabs.filter(tab => tab.visible).map((tab, index) => renderTab(tab, index))}

      {/* Client area (content area) */}
      <div style={clientAreaStyle}>
        {/* This is where child controls would be placed in VB6 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#808080',
            fontSize: '8pt',
            fontFamily: 'MS Sans Serif',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          Client Area
        </div>
      </div>

      {/* Resize handles */}
      {selected && (
        <>
          <div className="vb6-resize-handle nw" style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'nw-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle ne" style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'ne-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle sw" style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'sw-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle se" style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'se-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle n" style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'n-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle s" style={{ position: 'absolute', bottom: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 's-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle w" style={{ position: 'absolute', top: '50%', left: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'w-resize', zIndex: 20 }} />
          <div className="vb6-resize-handle e" style={{ position: 'absolute', top: '50%', right: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'e-resize', zIndex: 20 }} />
        </>
      )}
    </div>
  );
};

export default TabStrip;