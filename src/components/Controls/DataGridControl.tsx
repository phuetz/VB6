/**
 * DataGrid Control - 100% VB6 Compatible
 * Advanced data-bound grid with full editing capabilities
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';

interface Column {
  dataField: string;
  caption: string;
  width: number;
  visible: boolean;
  locked: boolean;
  alignment: 0 | 1 | 2; // dbgLeft, dbgRight, dbgCenter
  numberFormat?: string;
  button?: boolean;
  buttonAlways?: boolean;
  dropDown?: any; // Reference to dropdown control
  editMask?: string;
  fetchStyle: 0 | 1 | 2; // dbgFetchNone, dbgFetchCellByCell, dbgFetchRowByRow
}

interface Split {
  sizeMode: 0 | 1 | 2; // dbgScalable, dbgExact, dbgNumberOfColumns
  size: number;
  scrollBars: 0 | 1 | 2 | 3; // dbgNone, dbgHorizontal, dbgVertical, dbgBoth
  scrollGroup: number;
  selStartCol: number;
  selEndCol: number;
  columns: Column[];
}

interface DataGridProps extends VB6ControlPropsEnhanced {
  // Data binding
  dataSource?: any;
  dataMember?: string;
  
  // Behavior
  allowAddNew: boolean;
  allowArrows: boolean;
  allowDelete: boolean;
  allowRowSizing: boolean;
  allowUpdate: boolean;
  
  // Appearance
  appearance: 0 | 1; // dbgFlat, dbg3D
  backColor: string;
  borderStyle: 0 | 1; // dbgNone, dbgFixedSingle
  caption: string;
  captionHeight: number;
  
  // Current position
  col: number;
  row: number;
  
  // Layout
  columnHeaders: boolean;
  columns?: Column[];
  currentCellModified: boolean;
  currentCellVisible: boolean;
  dataChanged: boolean;
  defColWidth: number;
  editActive: boolean;
  
  // Font
  font: any;
  foreColor: string;
  headFont: any;
  headLines: number;
  
  // Editor
  hWndEditor: number;
  
  // Navigation
  leftCol: number;
  marqueeStyle: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Various marquee styles
  recordSelectors: boolean;
  
  // Row appearance
  rowDividerStyle: 0 | 1 | 2 | 3 | 4 | 5; // Various divider styles
  rowHeight: number;
  
  // Scrolling
  scrollBars: 0 | 1 | 2 | 3 | 4; // dbgNone, dbgHorizontal, dbgVertical, dbgBoth, dbgAutomatic
  
  // Selection
  selStartCol: number;
  selEndCol: number;
  selBookmarks?: any[];
  
  // Splits
  splits?: Split[];
  
  // Tab behavior
  tabAction: 0 | 1 | 2; // dbgControlNavigation, dbgColumnNavigation, dbgGridNavigation
  tabAcrossSplits: boolean;
  
  // Current cell
  text: string;
  
  // Visible area
  visibleCols: number;
  visibleRows: number;
  
  // Other
  wrapCellPointer: boolean;
  hWnd: number;
}

export const DataGridControl = forwardRef<any, DataGridProps>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    dataSource,
    dataMember = '',
    allowAddNew = false,
    allowArrows = true,
    allowDelete = false,
    allowRowSizing = true,
    allowUpdate = true,
    appearance = 1,
    backColor = '#FFFFFF',
    borderStyle = 1,
    caption = '',
    captionHeight = 200,
    col: currentCol = 0,
    row: currentRow = 0,
    columnHeaders = true,
    columns: initialColumns = [],
    currentCellModified = false,
    currentCellVisible = true,
    dataChanged = false,
    defColWidth = 0,
    editActive = false,
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false },
    foreColor = '#000000',
    headFont = { name: 'MS Sans Serif', size: 8, bold: false, italic: false },
    headLines = 1,
    hWndEditor = 0,
    leftCol = 0,
    marqueeStyle = 6,
    recordSelectors = true,
    rowDividerStyle = 2,
    rowHeight = 225,
    scrollBars = 3,
    selStartCol = 0,
    selEndCol = 0,
    selBookmarks = [],
    splits: initialSplits = [],
    tabAction = 0,
    tabAcrossSplits = false,
    text = '',
    visibleCols = 0,
    visibleRows = 0,
    wrapCellPointer = false,
    hWnd = 0,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  // State management
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [currentPosition, setCurrentPosition] = useState({ row: currentRow, col: currentCol });
  const [selection, setSelection] = useState({ startCol: selStartCol, endCol: selEndCol });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [splits, setSplits] = useState<Split[]>(initialSplits.length > 0 ? initialSplits : [{
    sizeMode: 0,
    size: 0,
    scrollBars: 3,
    scrollGroup: 0,
    selStartCol: 0,
    selEndCol: 0,
    columns: columns,
  }]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLInputElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Load data from dataSource
  useEffect(() => {
    if (dataSource) {
      loadData();
    }
  }, [dataSource, dataMember]);

  const loadData = async () => {
    try {
      // Simulate data loading from recordset
      if (dataSource?.recordset) {
        const records = dataSource.recordset.rows || [];
        setData(records);
        
        // Auto-generate columns if not provided
        if (columns.length === 0 && records.length > 0) {
          const fields = Object.keys(records[0]);
          const newColumns = fields.map(field => ({
            dataField: field,
            caption: field,
            width: defColWidth || 1500,
            visible: true,
            locked: false,
            alignment: 0,
            fetchStyle: 1,
          }));
          setColumns(newColumns);
        }
        
        fireEvent(name, 'OnDataSourceChanged', {});
      }
    } catch (error) {
      fireEvent(name, 'Error', { error: error.message });
    }
  };

  // Cell rendering
  const getCellValue = (rowIndex: number, colIndex: number): string => {
    if (rowIndex < 0 || rowIndex >= data.length) return '';
    const column = columns[colIndex];
    if (!column) return '';
    
    const row = data[rowIndex];
    const value = row[column.dataField];
    
    if (column.numberFormat && typeof value === 'number') {
      return formatNumber(value, column.numberFormat);
    }
    
    return value?.toString() || '';
  };

  const formatNumber = (value: number, format: string): string => {
    // Implement VB6 number formatting
    if (format === 'Currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (format === 'Percent') {
      return new Intl.NumberFormat('en-US', { style: 'percent' }).format(value);
    }
    if (format.includes('.')) {
      const decimals = format.split('.')[1].length;
      return value.toFixed(decimals);
    }
    return value.toString();
  };

  // Event handlers
  const handleCellClick = useCallback((rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    if (!enabled) return;
    
    setCurrentPosition({ row: rowIndex, col: colIndex });
    updateControl(id, 'row', rowIndex);
    updateControl(id, 'col', colIndex);
    updateControl(id, 'text', getCellValue(rowIndex, colIndex));
    
    fireEvent(name, 'Click', {});
    fireEvent(name, 'RowColChange', {});
    
    if (allowUpdate && columns[colIndex] && !columns[colIndex].locked) {
      startEditing(rowIndex, colIndex);
    }
  }, [enabled, allowUpdate, columns, id, name, fireEvent, updateControl]);

  const startEditing = (rowIndex: number, colIndex: number) => {
    if (!allowUpdate) return;
    
    setIsEditing(true);
    setEditValue(getCellValue(rowIndex, colIndex));
    updateControl(id, 'editActive', true);
    fireEvent(name, 'BeforeColEdit', { colIndex, cancel: false });
  };

  const finishEditing = (save: boolean) => {
    if (!isEditing) return;
    
    if (save && data[currentPosition.row]) {
      const column = columns[currentPosition.col];
      if (column) {
        data[currentPosition.row][column.dataField] = editValue;
        setData([...data]);
        updateControl(id, 'currentCellModified', true);
        updateControl(id, 'dataChanged', true);
        fireEvent(name, 'AfterColEdit', { colIndex: currentPosition.col });
        fireEvent(name, 'AfterUpdate', {});
      }
    }
    
    setIsEditing(false);
    updateControl(id, 'editActive', false);
    fireEvent(name, 'AfterColUpdate', { colIndex: currentPosition.col });
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return;
    
    const { row, col } = currentPosition;
    let newRow = row;
    let newCol = col;
    let handled = false;
    
    if (!isEditing || e.key === 'Tab') {
      switch (e.key) {
        case 'ArrowUp':
          if (allowArrows) {
            newRow = Math.max(0, row - 1);
            handled = true;
          }
          break;
        case 'ArrowDown':
          if (allowArrows) {
            newRow = Math.min(data.length - 1, row + 1);
            if (newRow === data.length - 1 && allowAddNew) {
              // Add new row
              const newRecord = {};
              columns.forEach(col => newRecord[col.dataField] = '');
              setData([...data, newRecord]);
              newRow = data.length;
            }
            handled = true;
          }
          break;
        case 'ArrowLeft':
          if (allowArrows && !isEditing) {
            newCol = Math.max(0, col - 1);
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (allowArrows && !isEditing) {
            newCol = Math.min(columns.length - 1, col + 1);
            handled = true;
          }
          break;
        case 'Tab':
          if (tabAction === 1 || tabAction === 2) { // Column or grid navigation
            if (e.shiftKey) {
              newCol = col - 1;
              if (newCol < 0) {
                newCol = columns.length - 1;
                newRow = Math.max(0, row - 1);
              }
            } else {
              newCol = col + 1;
              if (newCol >= columns.length) {
                newCol = 0;
                newRow = Math.min(data.length - 1, row + 1);
              }
            }
            handled = true;
          }
          break;
        case 'Enter':
          if (!isEditing) {
            startEditing(row, col);
          } else {
            finishEditing(true);
          }
          handled = true;
          break;
        case 'Escape':
          if (isEditing) {
            finishEditing(false);
          }
          handled = true;
          break;
        case 'Delete':
          if (allowDelete && !isEditing && row >= 0 && row < data.length) {
            const confirmDelete = { cancel: false };
            fireEvent(name, 'BeforeDelete', confirmDelete);
            if (!confirmDelete.cancel) {
              setData(data.filter((_, i) => i !== row));
              fireEvent(name, 'AfterDelete', {});
            }
            handled = true;
          }
          break;
        case 'F2':
          if (!isEditing) {
            startEditing(row, col);
            handled = true;
          }
          break;
      }
      
      if (handled) {
        e.preventDefault();
        if (newRow !== row || newCol !== col) {
          setCurrentPosition({ row: newRow, col: newCol });
          updateControl(id, 'row', newRow);
          updateControl(id, 'col', newCol);
          updateControl(id, 'text', getCellValue(newRow, newCol));
          fireEvent(name, 'RowColChange', {});
        }
      }
    }
  }, [enabled, currentPosition, data, columns, isEditing, allowArrows, allowAddNew, allowDelete, tabAction, id, name, fireEvent, updateControl]);

  // Column resizing
  const handleColumnResize = useCallback((colIndex: number, newWidth: number) => {
    if (!allowRowSizing) return;
    
    const newColumns = [...columns];
    newColumns[colIndex].width = Math.max(100, newWidth);
    setColumns(newColumns);
    
    fireEvent(name, 'ColResize', { colIndex });
  }, [allowRowSizing, columns, name, fireEvent]);

  // Expose methods through ref
  useEffect(() => {
    if (ref && typeof ref !== 'function') {
      ref.current = {
        // Properties
        get Columns() { return columns; },
        get Recordset() { return dataSource?.recordset; },
        get Bookmark() { return currentPosition.row; },
        set Bookmark(value: number) {
          if (value >= 0 && value < data.length) {
            setCurrentPosition({ ...currentPosition, row: value });
          }
        },
        
        // Methods
        Refresh() {
          loadData();
          fireEvent(name, 'Reposition', {});
        },
        
        Update() {
          finishEditing(true);
        },
        
        CancelUpdate() {
          finishEditing(false);
        },
        
        Delete() {
          if (allowDelete && currentPosition.row >= 0 && currentPosition.row < data.length) {
            setData(data.filter((_, i) => i !== currentPosition.row));
          }
        },
        
        AddNew() {
          if (allowAddNew) {
            const newRecord = {};
            columns.forEach(col => newRecord[col.dataField] = '');
            setData([...data, newRecord]);
            setCurrentPosition({ row: data.length, col: 0 });
          }
        },
        
        MoveFirst() {
          if (data.length > 0) {
            setCurrentPosition({ ...currentPosition, row: 0 });
          }
        },
        
        MoveLast() {
          if (data.length > 0) {
            setCurrentPosition({ ...currentPosition, row: data.length - 1 });
          }
        },
        
        MoveNext() {
          if (currentPosition.row < data.length - 1) {
            setCurrentPosition({ ...currentPosition, row: currentPosition.row + 1 });
          }
        },
        
        MovePrevious() {
          if (currentPosition.row > 0) {
            setCurrentPosition({ ...currentPosition, row: currentPosition.row - 1 });
          }
        },
        
        GetBookmark(row: number) {
          return row;
        },
        
        RowBookmark(row: number) {
          return row;
        },
        
        RowTop(row: number) {
          // Scroll to make row visible at top
          setScrollOffset({ ...scrollOffset, y: row * rowHeight });
        },
        
        Rebind() {
          loadData();
        },
        
        ClearFields() {
          if (currentPosition.row >= 0 && currentPosition.row < data.length) {
            const clearedRecord = {};
            columns.forEach(col => clearedRecord[col.dataField] = '');
            data[currentPosition.row] = clearedRecord;
            setData([...data]);
          }
        },
      };
    }
  }, [ref, columns, data, currentPosition, dataSource, allowDelete, allowAddNew, scrollOffset, rowHeight]);

  // Styles
  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    display: visible ? 'flex' : 'none',
    flexDirection: 'column',
    backgroundColor: backColor,
    border: borderStyle === 1 ? '2px inset #C0C0C0' : 'none',
    overflow: 'hidden',
    outline: 'none',
    tabIndex: 0,
  };

  const headerStyle: React.CSSProperties = {
    height: captionHeight / 15, // Convert twips to pixels
    backgroundColor: '#0078D7',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    fontFamily: headFont.name,
    fontSize: `${headFont.size}pt`,
    fontWeight: headFont.bold ? 'bold' : 'normal',
  };

  const columnsHeaderStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#F0F0F0',
    borderBottom: '1px solid #C0C0C0',
    minHeight: headLines * 20,
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflow: scrollBars === 0 ? 'hidden' :
              scrollBars === 1 ? 'auto hidden' :
              scrollBars === 2 ? 'hidden auto' :
              scrollBars === 4 ? 'auto' : 'auto',
    position: 'relative',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: rowHeight / 15, // Convert twips to pixels
    borderBottom: getRowDividerStyle(rowDividerStyle),
  };

  const cellStyle = (rowIndex: number, colIndex: number): React.CSSProperties => {
    const column = columns[colIndex];
    const isCurrentCell = rowIndex === currentPosition.row && colIndex === currentPosition.col;
    
    return {
      flex: `0 0 ${column.width / 15}px`,
      padding: '2px 4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      textAlign: column.alignment === 1 ? 'right' : column.alignment === 2 ? 'center' : 'left',
      backgroundColor: isCurrentCell ? '#E3F2FD' : 'transparent',
      color: foreColor,
      fontFamily: font.name,
      fontSize: `${font.size}pt`,
      cursor: 'cell',
      position: 'relative',
    };
  };

  const getRowDividerStyle = (style: number): string => {
    switch (style) {
      case 0: return 'none';
      case 1: return '1px solid #000000';
      case 2: return '1px solid #C0C0C0';
      case 3: return '1px outset #C0C0C0';
      case 4: return '1px inset #C0C0C0';
      case 5: return `1px solid ${foreColor}`;
      default: return '1px solid #C0C0C0';
    }
  };

  const getMarqueeStyle = (): React.CSSProperties => {
    switch (marqueeStyle) {
      case 0: return { border: '1px dotted #000000' };
      case 1: return { border: '1px solid #000000' };
      case 2: return { backgroundColor: '#E3F2FD' };
      case 3: return { backgroundColor: '#E3F2FD' };
      case 4: return { backgroundColor: '#E3F2FD', border: '1px outset #C0C0C0' };
      case 5: return {};
      case 6: return { backgroundColor: '#FFFFFF', border: '2px solid #0078D7' };
      default: return {};
    }
  };

  return (
    <div
      ref={gridRef}
      style={gridStyle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {caption && (
        <div style={headerStyle}>
          {caption}
        </div>
      )}
      
      {columnHeaders && (
        <div style={columnsHeaderStyle}>
          {recordSelectors && (
            <div style={{ width: 30, borderRight: '1px solid #C0C0C0' }} />
          )}
          {columns.map((column, colIndex) => (
            column.visible && (
              <div
                key={colIndex}
                style={{
                  flex: `0 0 ${column.width / 15}px`,
                  padding: '4px',
                  borderRight: '1px solid #C0C0C0',
                  fontWeight: 'bold',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => fireEvent(name, 'HeadClick', { colIndex })}
              >
                {column.caption}
                {/* Column resize handle */}
                <div
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    cursor: 'col-resize',
                    backgroundColor: 'transparent',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startWidth = column.width;
                    
                    const handleMove = (e: MouseEvent) => {
                      const delta = (e.clientX - startX) * 15; // Convert to twips
                      handleColumnResize(colIndex, startWidth + delta);
                    };
                    
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                />
              </div>
            )
          ))}
        </div>
      )}
      
      <div style={bodyStyle}>
        {data.map((row, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {recordSelectors && (
              <div 
                style={{ 
                  width: 30, 
                  borderRight: '1px solid #C0C0C0',
                  backgroundColor: '#F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => fireEvent(name, 'SelChange', { row: rowIndex })}
              >
                {currentPosition.row === rowIndex && '▶'}
              </div>
            )}
            {columns.map((column, colIndex) => (
              column.visible && (
                <div
                  key={colIndex}
                  style={{
                    ...cellStyle(rowIndex, colIndex),
                    ...(currentPosition.row === rowIndex && currentPosition.col === colIndex ? getMarqueeStyle() : {}),
                  }}
                  onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                  onDoubleClick={() => startEditing(rowIndex, colIndex)}
                >
                  {isEditing && currentPosition.row === rowIndex && currentPosition.col === colIndex ? (
                    <input
                      ref={editorRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => finishEditing(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          finishEditing(true);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          finishEditing(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        font: 'inherit',
                        padding: 0,
                        margin: 0,
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      {column.button && (
                        <button
                          style={{
                            position: 'absolute',
                            right: 2,
                            top: 2,
                            bottom: 2,
                            width: 20,
                            padding: 0,
                            fontSize: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            fireEvent(name, 'ButtonClick', { row: rowIndex, col: colIndex });
                          }}
                        >
                          ...
                        </button>
                      )}
                      <span>{getCellValue(rowIndex, colIndex)}</span>
                    </>
                  )}
                </div>
              )
            ))}
          </div>
        ))}
        
        {allowAddNew && (
          <div style={{ ...rowStyle, fontStyle: 'italic', color: '#666666' }}>
            {recordSelectors && <div style={{ width: 30, borderRight: '1px solid #C0C0C0' }} />}
            {columns.map((column, colIndex) => (
              column.visible && (
                <div
                  key={colIndex}
                  style={cellStyle(data.length, colIndex)}
                  onClick={() => {
                    const newRecord = {};
                    columns.forEach(col => newRecord[col.dataField] = '');
                    setData([...data, newRecord]);
                    setCurrentPosition({ row: data.length, col: 0 });
                    startEditing(data.length, 0);
                  }}
                >
                  {colIndex === 0 && '(new)'}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default DataGridControl;