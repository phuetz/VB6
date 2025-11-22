import React, { useRef, useEffect, useState, useCallback, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

interface VisibleRange {
  start: number;
  end: number;
}

const VirtualList = <T,>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
}: VirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback((scrollTop: number): VisibleRange => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + height) / itemHeight);
    
    // Add overscan
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);
    
    return { start, end };
  }, [itemHeight, height, overscan, items.length]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    const newRange = calculateVisibleRange(newScrollTop);
    setVisibleRange(newRange);
    
    onScroll?.(newScrollTop);
  }, [calculateVisibleRange, onScroll]);

  // Initialize visible range
  useEffect(() => {
    const initialRange = calculateVisibleRange(0);
    setVisibleRange(initialRange);
  }, [calculateVisibleRange]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  // Get visible items
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* Virtual spacer to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(VirtualList) as typeof VirtualList;

// Optimized Virtual List with dynamic item heights
export interface DynamicVirtualListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

interface ItemMeasurement {
  height: number;
  offset: number;
}

export const DynamicVirtualList = <T,>({
  items,
  estimatedItemHeight,
  height,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  getItemKey,
}: DynamicVirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measurementsRef = useRef<Map<number, ItemMeasurement>>(new Map());
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [totalHeight, setTotalHeight] = useState(items.length * estimatedItemHeight);

  // Get item measurement or estimate
  const getItemMeasurement = useCallback((index: number): ItemMeasurement => {
    const cached = measurementsRef.current.get(index);
    if (cached) return cached;

    // Estimate based on previous measurements or default
    const previousMeasurement = index > 0 ? getItemMeasurement(index - 1) : null;
    const height = estimatedItemHeight;
    const offset = previousMeasurement ? previousMeasurement.offset + previousMeasurement.height : 0;

    return { height, offset };
  }, [estimatedItemHeight]);

  // Calculate visible range for dynamic heights
  const calculateVisibleRange = useCallback((scrollTop: number): VisibleRange => {
    let start = 0;
    let end = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const measurement = getItemMeasurement(i);
      if (measurement.offset + measurement.height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    for (let i = start; i < items.length; i++) {
      const measurement = getItemMeasurement(i);
      if (measurement.offset > scrollTop + height) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { start, end };
  }, [items.length, height, overscan, getItemMeasurement]);

  // Measure rendered items
  const measureItem = useCallback((index: number, element: HTMLElement | null) => {
    if (!element) return;

    const height = element.getBoundingClientRect().height;
    const prevMeasurement = measurementsRef.current.get(index);
    
    if (!prevMeasurement || prevMeasurement.height !== height) {
      const offset = index === 0 ? 0 : getItemMeasurement(index - 1).offset + getItemMeasurement(index - 1).height;
      measurementsRef.current.set(index, { height, offset });

      // Update total height
      let newTotalHeight = 0;
      for (let i = 0; i < items.length; i++) {
        const measurement = measurementsRef.current.get(i);
        newTotalHeight += measurement?.height || estimatedItemHeight;
      }
      setTotalHeight(newTotalHeight);
    }
  }, [items.length, estimatedItemHeight, getItemMeasurement]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    const newRange = calculateVisibleRange(newScrollTop);
    setVisibleRange(newRange);
    
    onScroll?.(newScrollTop);
  }, [calculateVisibleRange, onScroll]);

  // Initialize
  useEffect(() => {
    const initialRange = calculateVisibleRange(0);
    setVisibleRange(initialRange);
  }, [calculateVisibleRange]);

  // Get visible items
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.start + index;
          const measurement = getItemMeasurement(actualIndex);
          const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;

          return (
            <div
              key={key}
              ref={(el) => measureItem(actualIndex, el)}
              style={{
                position: 'absolute',
                top: measurement.offset,
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Virtualized Table Component
export interface VirtualTableColumn<T> {
  key: string;
  title: string;
  width?: number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

export interface VirtualTableProps<T> {
  columns: VirtualTableColumn<T>[];
  data: T[];
  rowHeight: number;
  height: number;
  headerHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  selectedIndex?: number;
}

export const VirtualTable = <T extends Record<string, any>>({
  columns,
  data,
  rowHeight,
  height,
  headerHeight = 30,
  className = '',
  onRowClick,
  selectedIndex,
}: VirtualTableProps<T>) => {
  const renderRow = useCallback((item: T, index: number) => (
    <div
      className={`flex items-center border-b hover:bg-gray-50 cursor-pointer ${
        selectedIndex === index ? 'bg-blue-50' : ''
      }`}
      style={{ height: rowHeight }}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-2 truncate"
          style={{ width: column.width || `${100 / columns.length}%` }}
        >
          {column.render 
            ? column.render(item[column.key], item, index)
            : item[column.key]
          }
        </div>
      ))}
    </div>
  ), [columns, rowHeight, onRowClick, selectedIndex]);

  return (
    <div className={`border rounded ${className}`}>
      {/* Header */}
      <div
        className="flex items-center bg-gray-100 border-b font-semibold text-sm"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-2 truncate"
            style={{ width: column.width || `${100 / columns.length}%` }}
          >
            {column.title}
          </div>
        ))}
      </div>

      {/* Virtual list body */}
      <VirtualList
        items={data}
        itemHeight={rowHeight}
        height={height - headerHeight}
        renderItem={renderRow}
      />
    </div>
  );
};

// Export optimized components
export { VirtualList };