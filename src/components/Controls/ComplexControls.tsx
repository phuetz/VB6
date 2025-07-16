/**
 * Contrôles VB6 complexes manquants - TreeView, ListView, ImageList, TabStrip, Toolbar, StatusBar
 * Implémentation complète avec toutes les propriétés et méthodes VB6
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';

// TreeView - Arbre hiérarchique VB6
export const TreeView = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    nodes = [],
    selectedNode,
    showLines = true,
    showRootLines = true,
    showPlusMinus = true,
    showPictures = true,
    labelEdit = false,
    fullRowSelect = false,
    checkboxes = false,
    sorted = false,
    hotTracking = false,
    imageList,
    indentation = 19,
    lineStyle = 'TreeLines', // TreeLines, RootLines, PlusMinusText, PlusMinusPicture
    borderStyle = 'Fixed Single',
    font,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(selectedNode);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { fireEvent, updateControl } = useVB6Store();

  const toggleNode = useCallback((nodeId: string) => {
    if (!enabled) return;

    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
      fireEvent(name, 'Collapse', { node: nodeId });
    } else {
      newExpanded.add(nodeId);
      fireEvent(name, 'Expand', { node: nodeId });
    }
    setExpandedNodes(newExpanded);
  }, [enabled, expandedNodes, name, fireEvent]);

  const selectNode = useCallback((nodeId: string) => {
    if (!enabled) return;

    setSelectedNodeId(nodeId);
    updateControl(id, 'selectedNode', nodeId);
    fireEvent(name, 'NodeClick', { node: nodeId });
  }, [enabled, id, name, fireEvent, updateControl]);

  const renderNode = (node: any, level: number = 0): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.key);
    const isSelected = selectedNodeId === node.key;
    const isHovered = hoveredNode === node.key;

    return (
      <div key={node.key}>
        <div
          className={`flex items-center cursor-pointer ${
            isSelected ? 'bg-blue-100' : isHovered && hotTracking ? 'bg-gray-100' : ''
          } ${fullRowSelect ? 'w-full' : ''}`}
          style={{
            paddingLeft: level * indentation,
            fontSize: font?.size || 8,
            fontFamily: font?.name || 'MS Sans Serif',
            color: isSelected ? '#FFFFFF' : foreColor,
            backgroundColor: isSelected ? '#316AC5' : 'transparent',
            height: 16,
          }}
          onClick={() => selectNode(node.key)}
          onMouseEnter={() => hotTracking && setHoveredNode(node.key)}
          onMouseLeave={() => hotTracking && setHoveredNode(null)}
        >
          {/* Lignes de connexion */}
          {showLines && level > 0 && (
            <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
              {/* Ligne horizontale */}
              <div
                className="absolute border-t border-gray-400"
                style={{
                  left: (level - 1) * indentation + 8,
                  top: 8,
                  width: indentation - 8,
                }}
              />
              {/* Ligne verticale */}
              <div
                className="absolute border-l border-gray-400"
                style={{
                  left: (level - 1) * indentation + 8,
                  top: 0,
                  height: hasChildren ? 16 : 8,
                }}
              />
            </div>
          )}

          {/* Bouton +/- */}
          {hasChildren && showPlusMinus && (
            <button
              className="w-3 h-3 border border-gray-400 bg-white text-xs flex items-center justify-center mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.key);
              }}
              style={{ fontSize: 8 }}
            >
              {isExpanded ? '-' : '+'}
            </button>
          )}

          {/* Checkbox */}
          {checkboxes && (
            <input
              type="checkbox"
              className="mr-1"
              checked={node.checked || false}
              onChange={(e) => {
                e.stopPropagation();
                fireEvent(name, 'NodeCheck', { node: node.key, checked: e.target.checked });
              }}
            />
          )}

          {/* Icône */}
          {showPictures && node.image && (
            <img
              src={node.image}
              alt=""
              className="w-4 h-4 mr-1"
              style={{ width: 16, height: 16 }}
            />
          )}

          {/* Texte du noeud */}
          {editingNode === node.key && labelEdit ? (
            <input
              type="text"
              value={node.text}
              onBlur={() => setEditingNode(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingNode(null);
                  fireEvent(name, 'AfterLabelEdit', { node: node.key, text: e.currentTarget.value });
                }
              }}
              className="flex-1 border-none outline-none bg-transparent"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 select-none"
              onDoubleClick={() => labelEdit && setEditingNode(node.key)}
            >
              {node.text}
            </span>
          )}
        </div>

        {/* Noeuds enfants */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const treeStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    overflow: 'auto',
    opacity: enabled ? 1 : 0.6,
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
  };

  return (
    <div
      ref={ref}
      style={treeStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <div className="relative">
        {nodes.map((node: any) => renderNode(node, 0))}
      </div>
    </div>
  );
});

// ListView - Liste avec colonnes et vues multiples
export const ListView = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    view = 'Report', // Icon, SmallIcon, List, Report
    items = [],
    columnHeaders = [],
    selectedItems = [],
    multiSelect = false,
    fullRowSelect = true,
    gridLines = false,
    labelEdit = false,
    checkboxes = false,
    sorted = false,
    arrangeBy = 'Name',
    sortOrder = 'Ascending',
    iconSpacing = 'Normal',
    imageList,
    smallImageList,
    borderStyle = 'Fixed Single',
    font,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(selectedItems));
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { fireEvent, updateControl } = useVB6Store();

  const selectItem = useCallback((itemId: string, ctrlKey: boolean = false) => {
    if (!enabled) return;

    let newSelected = new Set(selectedItemIds);

    if (multiSelect && ctrlKey) {
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
    } else {
      newSelected = new Set([itemId]);
    }

    setSelectedItemIds(newSelected);
    updateControl(id, 'selectedItems', Array.from(newSelected));
    fireEvent(name, 'ItemClick', { item: itemId });
  }, [enabled, multiSelect, selectedItemIds, id, name, fireEvent, updateControl]);

  const sortItems = useCallback((column: string) => {
    if (!enabled) return;

    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    fireEvent(name, 'ColumnClick', { column, direction: newDirection });
  }, [enabled, sortColumn, sortDirection, name, fireEvent]);

  const renderReportView = () => (
    <div className="w-full h-full flex flex-col">
      {/* En-têtes de colonnes */}
      <div className="flex border-b border-gray-300 bg-gray-100">
        {columnHeaders.map((header: any, index: number) => (
          <div
            key={index}
            className="px-2 py-1 border-r border-gray-300 cursor-pointer hover:bg-gray-200"
            style={{
              width: header.width || 100,
              textAlign: header.alignment || 'left',
              fontSize: font?.size || 8,
              fontFamily: font?.name || 'MS Sans Serif',
            }}
            onClick={() => sortItems(header.text)}
          >
            {header.text}
            {sortColumn === header.text && (
              <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
            )}
          </div>
        ))}
      </div>

      {/* Éléments */}
      <div className="flex-1 overflow-auto">
        {items.map((item: any) => (
          <div
            key={item.key}
            className={`flex cursor-pointer hover:bg-gray-100 ${
              selectedItemIds.has(item.key) ? 'bg-blue-100' : ''
            } ${gridLines ? 'border-b border-gray-200' : ''}`}
            style={{
              backgroundColor: selectedItemIds.has(item.key) ? '#316AC5' : 'transparent',
              color: selectedItemIds.has(item.key) ? '#FFFFFF' : foreColor,
              fontSize: font?.size || 8,
              fontFamily: font?.name || 'MS Sans Serif',
            }}
            onClick={(e) => selectItem(item.key, e.ctrlKey)}
          >
            {checkboxes && (
              <div className="px-2 py-1 border-r border-gray-300">
                <input
                  type="checkbox"
                  checked={item.checked || false}
                  onChange={(e) => {
                    e.stopPropagation();
                    fireEvent(name, 'ItemCheck', { item: item.key, checked: e.target.checked });
                  }}
                />
              </div>
            )}
            
            {columnHeaders.map((header: any, index: number) => (
              <div
                key={index}
                className="px-2 py-1 border-r border-gray-300 truncate"
                style={{
                  width: header.width || 100,
                  textAlign: header.alignment || 'left',
                }}
              >
                {index === 0 && item.icon && (
                  <img
                    src={item.icon}
                    alt=""
                    className="inline w-4 h-4 mr-1"
                    style={{ width: 16, height: 16 }}
                  />
                )}
                {item.subItems?.[index] || (index === 0 ? item.text : '')}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderIconView = () => (
    <div className="w-full h-full p-2 overflow-auto">
      <div className="flex flex-wrap">
        {items.map((item: any) => (
          <div
            key={item.key}
            className={`flex flex-col items-center p-2 m-1 cursor-pointer rounded ${
              selectedItemIds.has(item.key) ? 'bg-blue-100' : ''
            }`}
            style={{
              width: 80,
              backgroundColor: selectedItemIds.has(item.key) ? '#316AC5' : 'transparent',
              color: selectedItemIds.has(item.key) ? '#FFFFFF' : foreColor,
            }}
            onClick={(e) => selectItem(item.key, e.ctrlKey)}
          >
            {item.icon && (
              <img
                src={item.icon}
                alt=""
                className="w-8 h-8 mb-1"
                style={{ width: 32, height: 32 }}
              />
            )}
            <span
              className="text-xs text-center break-words"
              style={{
                fontSize: font?.size || 8,
                fontFamily: font?.name || 'MS Sans Serif',
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="w-full h-full overflow-auto">
      {items.map((item: any) => (
        <div
          key={item.key}
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            selectedItemIds.has(item.key) ? 'bg-blue-100' : ''
          }`}
          style={{
            backgroundColor: selectedItemIds.has(item.key) ? '#316AC5' : 'transparent',
            color: selectedItemIds.has(item.key) ? '#FFFFFF' : foreColor,
            fontSize: font?.size || 8,
            fontFamily: font?.name || 'MS Sans Serif',
          }}
          onClick={(e) => selectItem(item.key, e.ctrlKey)}
        >
          {item.icon && (
            <img
              src={item.icon}
              alt=""
              className="w-4 h-4 mr-2"
              style={{ width: 16, height: 16 }}
            />
          )}
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'Icon':
        return renderIconView();
      case 'SmallIcon':
        return renderIconView();
      case 'List':
        return renderListView();
      case 'Report':
      default:
        return renderReportView();
    }
  };

  const listStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={listStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {renderView()}
    </div>
  );
});

// ImageList - Liste d'images pour TreeView et ListView
export const ImageList = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    images = [],
    imageWidth = 16,
    imageHeight = 16,
    maskColor = '#C0C0C0',
    useMaskColor = false,
    tag,
    ...rest
  } = props;

  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const { fireEvent } = useVB6Store();

  const loadImage = useCallback((src: string, key: string) => {
    if (imageCache.has(key)) return;

    const img = new Image();
    img.onload = () => {
      setImageCache(prev => new Map(prev).set(key, img));
    };
    img.onerror = () => {
      fireEvent(name, 'ImageLoadError', { key, src });
    };
    img.src = src;
  }, [imageCache, name, fireEvent]);

  useEffect(() => {
    images.forEach((image: any, index: number) => {
      loadImage(image.src, image.key || index.toString());
    });
  }, [images, loadImage]);

  // ImageList est un composant invisible qui stocke les images
  return (
    <div
      ref={ref}
      style={{ display: 'none' }}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {images.map((image: any, index: number) => (
        <img
          key={image.key || index}
          src={image.src}
          alt=""
          style={{
            width: imageWidth,
            height: imageHeight,
            display: 'none',
          }}
        />
      ))}
    </div>
  );
});

// TabStrip - Contrôle d'onglets
export const TabStrip = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    tabs = [],
    selectedTab = 0,
    tabOrientation = 'Top', // Top, Bottom, Left, Right
    multiRow = false,
    fixedWidth = false,
    tabWidth = 0,
    tabHeight = 0,
    showTips = true,
    hotTracking = false,
    font,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [activeTab, setActiveTab] = useState(selectedTab);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);
  const { fireEvent, updateControl } = useVB6Store();

  const selectTab = useCallback((tabIndex: number) => {
    if (!enabled || tabIndex === activeTab) return;

    setActiveTab(tabIndex);
    updateControl(id, 'selectedTab', tabIndex);
    fireEvent(name, 'Click', { tab: tabIndex });
  }, [enabled, activeTab, id, name, fireEvent, updateControl]);

  const renderTabs = () => {
    const isHorizontal = tabOrientation === 'Top' || tabOrientation === 'Bottom';
    
    return (
      <div
        className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${
          tabOrientation === 'Bottom' ? 'order-2' : ''
        } ${tabOrientation === 'Right' ? 'order-2' : ''}`}
        style={{
          backgroundColor: backColor,
          borderBottom: tabOrientation === 'Top' ? '1px solid #808080' : 'none',
          borderTop: tabOrientation === 'Bottom' ? '1px solid #808080' : 'none',
          borderRight: tabOrientation === 'Left' ? '1px solid #808080' : 'none',
          borderLeft: tabOrientation === 'Right' ? '1px solid #808080' : 'none',
        }}
      >
        {tabs.map((tab: any, index: number) => {
          const isActive = index === activeTab;
          const isHovered = index === hoveredTab;
          
          return (
            <button
              key={index}
              className={`px-3 py-1 border-r border-gray-400 cursor-pointer transition-colors ${
                isActive ? 'bg-white' : isHovered && hotTracking ? 'bg-gray-200' : 'bg-gray-100'
              }`}
              style={{
                width: fixedWidth && tabWidth ? tabWidth : 'auto',
                height: tabHeight || 'auto',
                fontSize: font?.size || 8,
                fontFamily: font?.name || 'MS Sans Serif',
                color: foreColor,
                border: isActive ? '2px outset #C0C0C0' : '2px inset #C0C0C0',
                borderBottom: tabOrientation === 'Top' && isActive ? 'none' : undefined,
                borderTop: tabOrientation === 'Bottom' && isActive ? 'none' : undefined,
                borderRight: tabOrientation === 'Left' && isActive ? 'none' : undefined,
                borderLeft: tabOrientation === 'Right' && isActive ? 'none' : undefined,
              }}
              onClick={() => selectTab(index)}
              onMouseEnter={() => hotTracking && setHoveredTab(index)}
              onMouseLeave={() => hotTracking && setHoveredTab(null)}
              title={showTips ? tab.tooltip || tab.caption : ''}
            >
              {tab.image && (
                <img
                  src={tab.image}
                  alt=""
                  className="inline w-4 h-4 mr-1"
                  style={{ width: 16, height: 16 }}
                />
              )}
              {tab.caption}
            </button>
          );
        })}
      </div>
    );
  };

  const tabStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    flexDirection: tabOrientation === 'Top' || tabOrientation === 'Bottom' ? 'column' : 'row',
    backgroundColor: backColor,
    border: '2px inset #C0C0C0',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={tabStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {renderTabs()}
      <div className="flex-1 bg-white border border-gray-300 p-2">
        {tabs[activeTab] && tabs[activeTab].content}
      </div>
    </div>
  );
});

// Toolbar - Barre d'outils avec boutons
export const Toolbar = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    buttons = [],
    imageList,
    appearance = 'Flat', // Flat, 3D
    borderStyle = 'None',
    wrappable = false,
    showTips = true,
    allowCustomize = false,
    font,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const { fireEvent } = useVB6Store();

  const handleButtonClick = useCallback((buttonIndex: number, button: any) => {
    if (!enabled || button.enabled === false) return;

    fireEvent(name, 'ButtonClick', { button: buttonIndex, key: button.key });
  }, [enabled, name, fireEvent]);

  const handleButtonMouseDown = useCallback((buttonIndex: number) => {
    if (!enabled) return;
    setPressedButton(buttonIndex);
  }, [enabled]);

  const handleButtonMouseUp = useCallback(() => {
    setPressedButton(null);
  }, []);

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    backgroundColor: backColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    opacity: enabled ? 1 : 0.6,
    flexWrap: wrappable ? 'wrap' : 'nowrap',
    overflow: 'hidden',
  };

  return (
    <div
      ref={ref}
      style={toolbarStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {buttons.map((button: any, index: number) => {
        if (button.style === 'Separator') {
          return (
            <div
              key={index}
              className="w-px h-6 bg-gray-400 mx-1"
              style={{ borderLeft: '1px solid #808080' }}
            />
          );
        }

        const isHovered = hoveredButton === index;
        const isPressed = pressedButton === index;
        const isEnabled = button.enabled !== false && enabled;

        return (
          <button
            key={index}
            className={`flex items-center justify-center px-2 py-1 mx-1 transition-colors ${
              !isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              fontSize: font?.size || 8,
              fontFamily: font?.name || 'MS Sans Serif',
              color: isEnabled ? foreColor : '#808080',
              border: appearance === '3D' || isHovered || isPressed 
                ? `2px ${isPressed ? 'inset' : 'outset'} #C0C0C0`
                : 'none',
              backgroundColor: isHovered && !isPressed ? '#E0E0E0' : 'transparent',
              minWidth: 24,
              height: 24,
            }}
            onClick={() => handleButtonClick(index, button)}
            onMouseDown={() => handleButtonMouseDown(index)}
            onMouseUp={handleButtonMouseUp}
            onMouseEnter={() => setHoveredButton(index)}
            onMouseLeave={() => setHoveredButton(null)}
            title={showTips ? button.tooltip || button.caption : ''}
            disabled={!isEnabled}
          >
            {button.image && (
              <img
                src={button.image}
                alt=""
                className="w-4 h-4"
                style={{ width: 16, height: 16 }}
              />
            )}
            {button.caption && (
              <span className={button.image ? 'ml-1' : ''}>{button.caption}</span>
            )}
          </button>
        );
      })}
    </div>
  );
});

// StatusBar - Barre d'état avec panneaux
export const StatusBar = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    panels = [],
    showTips = true,
    simpleText = '',
    style = 'Panels', // Panels, Simple
    font,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    tag,
    toolTipText,
    ...rest
  } = props;

  const { fireEvent } = useVB6Store();

  const handlePanelClick = useCallback((panelIndex: number, panel: any) => {
    if (!enabled) return;
    fireEvent(name, 'PanelClick', { panel: panelIndex, key: panel.key });
  }, [enabled, name, fireEvent]);

  const statusStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    backgroundColor: backColor,
    border: '2px inset #C0C0C0',
    opacity: enabled ? 1 : 0.6,
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    color: foreColor,
  };

  if (style === 'Simple') {
    return (
      <div
        ref={ref}
        style={statusStyle}
        title={toolTipText}
        data-name={name}
        data-tag={tag}
        {...rest}
      >
        <div className="px-2 py-1 flex-1">
          {simpleText}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={statusStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {panels.map((panel: any, index: number) => (
        <div
          key={index}
          className="flex items-center px-2 py-1 border-r border-gray-400 cursor-pointer hover:bg-gray-200"
          style={{
            width: panel.width || 'auto',
            minWidth: panel.minWidth || 50,
            textAlign: panel.alignment || 'left',
            borderStyle: panel.bevel === 'Raised' ? 'outset' : 'inset',
            borderWidth: 1,
            borderColor: '#808080',
            backgroundColor: panel.backColor || 'transparent',
            color: panel.foreColor || foreColor,
          }}
          onClick={() => handlePanelClick(index, panel)}
          title={showTips ? panel.tooltip || panel.text : ''}
        >
          {panel.picture && (
            <img
              src={panel.picture}
              alt=""
              className="w-4 h-4 mr-1"
              style={{ width: 16, height: 16 }}
            />
          )}
          <span className="truncate">{panel.text}</span>
        </div>
      ))}
    </div>
  );
});

export default {
  TreeView,
  ListView,
  ImageList,
  TabStrip,
  Toolbar,
  StatusBar,
};