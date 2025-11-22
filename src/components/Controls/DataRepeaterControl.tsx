/**
 * VB6 DataRepeater Control Implementation
 * 
 * Data-bound repeater control with full VB6 compatibility
 */

import React, { useState, useCallback, useEffect } from 'react';

export interface DataRepeaterItem {
  index: number;
  data: { [key: string]: any };
  controls: { [controlName: string]: any };
  selected: boolean;
  visible: boolean;
}

export interface DataRepeaterControl {
  type: 'DataRepeater';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Data Properties
  dataSource: string; // Data source name
  dataMember: string; // Table/recordset name
  recordSource: string; // SQL or table name
  
  // Repeater Properties
  readerHeight: number; // Height of each item
  currentRecord: number;
  recordCount: number;
  
  // Template
  repeaterItems: DataRepeaterItem[];
  
  // Scrolling
  scrollBars: number; // 0=None, 1=Horizontal, 2=Vertical, 3=Both
  
  // Selection
  allowAddNew: boolean;
  allowDelete: boolean;
  allowUpdate: boolean;
  
  // Appearance
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  backColor: string;
  foreColor: string;
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  mousePointer: number;
  tag: string;
  
  // Events
  onCurrentRecordChanged?: string;
  onReposition?: string;
  onGetData?: string;
  onUnload?: string;
}

interface DataRepeaterControlProps {
  control: DataRepeaterControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const DataRepeaterControl: React.FC<DataRepeaterControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 300,
    height = 200,
    dataSource = '',
    dataMember = '',
    recordSource = '',
    readerHeight = 50,
    currentRecord = 0,
    recordCount = 0,
    repeaterItems = [],
    scrollBars = 2, // Vertical by default
    allowAddNew = true,
    allowDelete = true,
    allowUpdate = true,
    appearance = 1,
    borderStyle = 1,
    backColor = '#ffffff',
    foreColor = '#000000',
    enabled = true,
    visible = true,
    mousePointer = 0,
    tag = ''
  } = control;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(currentRecord);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    if (isDesignMode) {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0]
      }));
      setData(mockData);
    }
  }, [isDesignMode]);

  const handleRecordSelect = useCallback((recordIndex: number) => {
    if (!enabled || recordIndex < 0 || recordIndex >= recordCount) return;
    
    setSelectedRecord(recordIndex);
    onPropertyChange?.('currentRecord', recordIndex);
    onEvent?.('CurrentRecordChanged', { oldRecord: currentRecord, newRecord: recordIndex });
    onEvent?.('Reposition');
  }, [enabled, recordCount, currentRecord, onPropertyChange, onEvent]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  const handleAddNew = useCallback(() => {
    if (!allowAddNew || !enabled) return;
    
    const newRecord = {
      id: data.length + 1,
      name: 'New Item',
      description: 'New item description',
      value: 0,
      date: new Date().toISOString().split('T')[0]
    };
    
    const newData = [...data, newRecord];
    setData(newData);
    onPropertyChange?.('recordCount', newData.length);
    onEvent?.('GetData', { action: 'addnew' });
  }, [allowAddNew, enabled, data, onPropertyChange, onEvent]);

  const handleDelete = useCallback((recordIndex: number) => {
    if (!allowDelete || !enabled || recordIndex < 0 || recordIndex >= data.length) return;
    
    const newData = data.filter((_, index) => index !== recordIndex);
    setData(newData);
    
    // Adjust current record if necessary
    const newCurrentRecord = recordIndex >= newData.length ? Math.max(0, newData.length - 1) : recordIndex;
    setSelectedRecord(newCurrentRecord);
    
    onPropertyChange?.('recordCount', newData.length);
    onPropertyChange?.('currentRecord', newCurrentRecord);
    onEvent?.('GetData', { action: 'delete', record: recordIndex });
  }, [allowDelete, enabled, data, onPropertyChange, onEvent]);

  const handleUpdate = useCallback((recordIndex: number, field: string, value: any) => {
    if (!allowUpdate || !enabled || recordIndex < 0 || recordIndex >= data.length) return;
    
    const newData = [...data];
    newData[recordIndex] = { ...newData[recordIndex], [field]: value };
    setData(newData);
    
    onEvent?.('GetData', { action: 'update', record: recordIndex, field, value });
  }, [allowUpdate, enabled, data, onEvent]);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px inset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'default';
  };

  const getScrollStyle = () => {
    let overflowX = 'hidden';
    let overflowY = 'hidden';
    
    if (scrollBars === 1 || scrollBars === 3) overflowX = 'auto'; // Horizontal
    if (scrollBars === 2 || scrollBars === 3) overflowY = 'auto'; // Vertical
    
    return { overflowX, overflowY };
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: getBorderStyle(),
    background: backColor,
    color: foreColor,
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    ...getScrollStyle()
  };

  const contentStyle = {
    width: '100%',
    minHeight: `${data.length * readerHeight}px`
  };

  const visibleStartIndex = Math.floor(scrollTop / readerHeight);
  const visibleEndIndex = Math.min(data.length, visibleStartIndex + Math.ceil(height / readerHeight) + 1);

  return (
    <div
      className={`vb6-data-repeater ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onScroll={handleScroll}
      data-name={name}
      data-type="DataRepeater"
    >
      <div style={contentStyle}>
        {data.slice(visibleStartIndex, visibleEndIndex).map((record, virtualIndex) => {
          const actualIndex = visibleStartIndex + virtualIndex;
          const isSelected = actualIndex === selectedRecord;
          
          return (
            <div
              key={record.id || actualIndex}
              style={{
                position: 'absolute',
                top: `${actualIndex * readerHeight}px`,
                left: 0,
                width: '100%',
                height: `${readerHeight}px`,
                background: isSelected ? '#0078d4' : actualIndex % 2 === 0 ? '#ffffff' : '#f8f8f8',
                color: isSelected ? '#ffffff' : foreColor,
                border: isSelected ? '1px solid #005a9e' : '1px solid #e0e0e0',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => handleRecordSelect(actualIndex)}
            >
              {/* Record Index */}
              <div
                style={{
                  width: '30px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginRight: '8px'
                }}
              >
                {actualIndex + 1}
              </div>

              {/* Record Data */}
              <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                {Object.entries(record).map(([key, value]) => (
                  <div key={key} style={{ minWidth: '80px' }}>
                    <div style={{ fontSize: '9px', color: isSelected ? '#cccccc' : '#666666' }}>
                      {key.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: key === 'name' ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={String(value)}
                    >
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {allowDelete && (
                <button
                  style={{
                    width: '20px',
                    height: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: isSelected ? '#ffffff' : '#cc0000',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(actualIndex);
                  }}
                  title="Delete record"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            display: 'flex',
            gap: '4px',
            background: 'rgba(0,0,0,0.7)',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          <button
            style={{
              width: '20px',
              height: '20px',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              cursor: 'pointer',
              fontSize: '10px'
            }}
            onClick={() => handleRecordSelect(Math.max(0, selectedRecord - 1))}
            disabled={selectedRecord <= 0}
          >
            ◄
          </button>
          
          <span
            style={{
              color: 'white',
              fontSize: '10px',
              lineHeight: '20px',
              minWidth: '40px',
              textAlign: 'center'
            }}
          >
            {selectedRecord + 1} / {data.length}
          </span>
          
          <button
            style={{
              width: '20px',
              height: '20px',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              cursor: 'pointer',
              fontSize: '10px'
            }}
            onClick={() => handleRecordSelect(Math.min(data.length - 1, selectedRecord + 1))}
            disabled={selectedRecord >= data.length - 1}
          >
            ►
          </button>
          
          {allowAddNew && (
            <button
              style={{
                width: '20px',
                height: '20px',
                background: '#00aa00',
                border: '1px solid #008800',
                color: 'white',
                cursor: 'pointer',
                fontSize: '10px'
              }}
              onClick={handleAddNew}
              title="Add new record"
            >
              +
            </button>
          )}
        </div>
      )}

      {/* Status Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: scrollBars === 1 || scrollBars === 3 ? '17px' : 0,
          height: '20px',
          background: '#f0f0f0',
          border: '1px inset #d0d0d0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          fontSize: '10px',
          color: '#666'
        }}
      >
        <span>Records: {data.length}</span>
        {dataSource && (
          <span style={{ marginLeft: '12px' }}>Source: {dataSource}</span>
        )}
        {isLoading && (
          <span style={{ marginLeft: '12px' }}>Loading...</span>
        )}
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
          {name} - DataRepeater ({data.length} records)
        </div>
      )}
    </div>
  );
};

// Helper functions for DataRepeater
export const DataRepeaterHelpers = {
  /**
   * Create mock data for testing
   */
  createMockData: (count: number): any[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      category: ['A', 'B', 'C'][i % 3],
      active: Math.random() > 0.3
    }));
  },

  /**
   * Filter data based on criteria
   */
  filterData: (data: any[], field: string, value: any): any[] => {
    return data.filter(record => record[field] === value);
  },

  /**
   * Sort data by field
   */
  sortData: (data: any[], field: string, ascending: boolean = true): any[] => {
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });
  },

  /**
   * Calculate visible records for virtual scrolling
   */
  getVisibleRange: (scrollTop: number, containerHeight: number, itemHeight: number, totalItems: number) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(totalItems, startIndex + visibleCount + 1);
    
    return { startIndex, endIndex, visibleCount };
  },

  /**
   * Navigate to specific record
   */
  navigateToRecord: (recordIndex: number, totalRecords: number): number => {
    return Math.max(0, Math.min(totalRecords - 1, recordIndex));
  },

  /**
   * Get record at current position
   */
  getCurrentRecord: (data: any[], currentIndex: number): any | null => {
    return currentIndex >= 0 && currentIndex < data.length ? data[currentIndex] : null;
  }
};

// VB6 DataRepeater methods simulation
export const DataRepeaterMethods = {
  /**
   * Move to first record
   */
  moveFirst: (control: DataRepeaterControl) => {
    return { ...control, currentRecord: 0 };
  },

  /**
   * Move to last record
   */
  moveLast: (control: DataRepeaterControl) => {
    return { ...control, currentRecord: Math.max(0, control.recordCount - 1) };
  },

  /**
   * Move to next record
   */
  moveNext: (control: DataRepeaterControl) => {
    return { 
      ...control, 
      currentRecord: Math.min(control.recordCount - 1, control.currentRecord + 1) 
    };
  },

  /**
   * Move to previous record
   */
  movePrevious: (control: DataRepeaterControl) => {
    return { 
      ...control, 
      currentRecord: Math.max(0, control.currentRecord - 1) 
    };
  },

  /**
   * Refresh data
   */
  refresh: (control: DataRepeaterControl) => {
    // This would trigger a data refresh in the component
    return control;
  }
};

export default DataRepeaterControl;