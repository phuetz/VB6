import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VB6Control } from '../../types/vb6';
import { VirtualTable, VirtualTableColumn } from '../VirtualList/VirtualList';

interface ListViewItem {
  key: string;
  text: string;
  subItems: string[];
  icon?: number;
  selected?: boolean;
  checked?: boolean;
}

interface OptimizedListViewProps {
  control: VB6Control;
  isSelected: boolean;
  isRunning: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VB6Control>) => void;
}

const OptimizedListView: React.FC<OptimizedListViewProps> = ({
  control,
  isSelected,
  isRunning,
  onSelect,
  onUpdate,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const performanceRef = useRef({ renderCount: 0, lastRenderTime: 0 });

  // Parse items from control properties
  const items = useMemo<ListViewItem[]>(() => {
    const itemsData = control.properties.ListItems || [];
    return itemsData.map((item: any, index: number) => ({
      key: item.key || `item-${index}`,
      text: item.text || '',
      subItems: item.subItems || [],
      icon: item.icon,
      selected: selectedIndices.has(index),
      checked: item.checked || false,
    }));
  }, [control.properties.ListItems, selectedIndices]);

  // Parse columns from control properties
  const columns = useMemo<VirtualTableColumn<ListViewItem>[]>(() => {
    const cols = control.properties.ColumnHeaders || [];
    if (cols.length === 0) {
      return [{
        key: 'text',
        title: 'Name',
        width: control.properties.Width,
      }];
    }

    return cols.map((col: any, index: number) => ({
      key: index === 0 ? 'text' : `subItem${index - 1}`,
      title: col.text || `Column ${index + 1}`,
      width: col.width || 100,
      render: (value: any, item: ListViewItem) => {
        if (index === 0) {
          return (
            <div className="flex items-center gap-1">
              {control.properties.Checkboxes && (
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => handleCheckChange(item.key, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3 h-3"
                />
              )}
              {control.properties.SmallIcons && item.icon !== undefined && (
                <div className="w-4 h-4 bg-gray-300 rounded" />
              )}
              <span>{item.text}</span>
            </div>
          );
        }
        return item.subItems[index - 1] || '';
      },
    }));
  }, [control.properties.ColumnHeaders, control.properties.Width, control.properties.Checkboxes, control.properties.SmallIcons]);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortColumn) return items;

    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'text') {
        aValue = a.text;
        bValue = b.text;
      } else {
        const subIndex = parseInt(sortColumn.replace('subItem', ''));
        aValue = a.subItems[subIndex] || '';
        bValue = b.subItems[subIndex] || '';
      }

      // Try numeric comparison first
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Fall back to string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortColumn, sortDirection]);

  // Handle item selection
  const handleItemClick = useCallback((item: ListViewItem, index: number, e: React.MouseEvent) => {
    if (!isRunning) {
      onSelect();
      return;
    }

    const multiSelect = control.properties.MultiSelect !== false;
    
    if (e.ctrlKey && multiSelect) {
      // Ctrl+Click: Toggle selection
      const newSelected = new Set(selectedIndices);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      setSelectedIndices(newSelected);
    } else if (e.shiftKey && multiSelect && lastSelectedIndex >= 0) {
      // Shift+Click: Range selection
      const newSelected = new Set(selectedIndices);
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
      setSelectedIndices(newSelected);
    } else {
      // Regular click: Single selection
      setSelectedIndices(new Set([index]));
    }

    setLastSelectedIndex(index);

    // Fire ItemClick event
    if (control.events?.ItemClick) {
      try {
        const fn = new Function('Item', control.events.ItemClick);
        fn(item);
      } catch (error) {
        console.error('Error in ItemClick event:', error);
      }
    }
  }, [isRunning, control.properties.MultiSelect, control.events?.ItemClick, selectedIndices, lastSelectedIndex, onSelect]);

  // Handle column header click for sorting
  const handleColumnClick = useCallback((columnKey: string) => {
    if (columnKey === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }

    // Fire ColumnClick event
    if (control.events?.ColumnClick) {
      try {
        const fn = new Function('ColumnHeader', control.events.ColumnClick);
        fn({ key: columnKey });
      } catch (error) {
        console.error('Error in ColumnClick event:', error);
      }
    }
  }, [sortColumn, control.events?.ColumnClick]);

  // Handle checkbox change
  const handleCheckChange = useCallback((itemKey: string, checked: boolean) => {
    const updatedItems = [...items];
    const itemIndex = updatedItems.findIndex(item => item.key === itemKey);
    
    if (itemIndex >= 0) {
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], checked };
      onUpdate({ ListItems: updatedItems });

      // Fire ItemCheck event
      if (control.events?.ItemCheck) {
        try {
          const fn = new Function('Item', control.events.ItemCheck);
          fn(updatedItems[itemIndex]);
        } catch (error) {
          console.error('Error in ItemCheck event:', error);
        }
      }
    }
  }, [items, onUpdate, control.events?.ItemCheck]);

  // Track performance
  useEffect(() => {
    performanceRef.current.renderCount++;
    performanceRef.current.lastRenderTime = Date.now();
  }, [sortedItems]);

  // Enhanced columns with click handlers
  const enhancedColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      title: (
        <div
          className="flex items-center justify-between cursor-pointer hover:bg-gray-200 -mx-2 px-2"
          onClick={() => handleColumnClick(col.key)}
        >
          <span>{col.title}</span>
          {sortColumn === col.key && (
            <span className="text-xs">
              {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </div>
      ),
    }));
  }, [columns, sortColumn, sortDirection, handleColumnClick]);

  // Calculate dimensions
  const width = control.properties.Width || 300;
  const height = control.properties.Height || 200;
  const rowHeight = control.properties.View === 'Details' ? 20 : 60;

  // Render based on view type
  const renderContent = () => {
    switch (control.properties.View) {
      case 'Details':
      default:
        return (
          <VirtualTable
            columns={enhancedColumns}
            data={sortedItems}
            rowHeight={rowHeight}
            height={height - 2} // Account for border
            headerHeight={24}
            onRowClick={handleItemClick}
            selectedIndex={selectedIndices.size === 1 ? Array.from(selectedIndices)[0] : undefined}
          />
        );

      case 'List':
        return (
          <div className="flex flex-wrap p-1 overflow-auto" style={{ height: height - 2 }}>
            {sortedItems.map((item, index) => (
              <div
                key={item.key}
                className={`p-1 m-1 cursor-pointer rounded ${
                  selectedIndices.has(index) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                }`}
                onClick={(e) => handleItemClick(item, index, e)}
                style={{ width: '100px' }}
              >
                <div className="truncate text-xs">{item.text}</div>
              </div>
            ))}
          </div>
        );

      case 'SmallIcon':
      case 'LargeIcon': {
        const iconSize = control.properties.View === 'LargeIcon' ? 48 : 32;
        return (
          <div className="flex flex-wrap p-2 overflow-auto" style={{ height: height - 2 }}>
            {sortedItems.map((item, index) => (
              <div
                key={item.key}
                className={`flex flex-col items-center p-2 m-1 cursor-pointer rounded ${
                  selectedIndices.has(index) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                }`}
                onClick={(e) => handleItemClick(item, index, e)}
                style={{ width: iconSize + 32 }}
              >
                <div 
                  className="bg-gray-300 rounded mb-1" 
                  style={{ width: iconSize, height: iconSize }}
                />
                <div className="text-xs text-center truncate w-full">{item.text}</div>
              </div>
            ))}
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`absolute bg-white ${isSelected && !isRunning ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: control.properties.Left,
        top: control.properties.Top,
        width,
        height,
      }}
    >
      {renderContent()}
      
      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 right-0 text-xs bg-black bg-opacity-50 text-white p-1">
          Renders: {performanceRef.current.renderCount}
        </div>
      )}
    </div>
  );
};

export default OptimizedListView;