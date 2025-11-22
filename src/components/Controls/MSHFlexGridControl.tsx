/**
 * VB6 MSHFlexGrid Control Implementation
 * 
 * Hierarchical FlexGrid with full VB6 compatibility
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface MSHFlexGridCell {
  text: string;
  alignment: number; // 0=Left, 1=Center, 2=Right
  backColor: string;
  foreColor: string;
  fontBold: boolean;
  fontItalic: boolean;
  picture: string;
  cellType: number; // 0=Text, 1=Picture, 2=CheckBox
  tag: string;
}

export interface MSHFlexGridRow {
  index: number;
  height: number;
  visible: boolean;
  selected: boolean;
  indent: number; // For hierarchical display
  isNode: boolean; // Has children
  expanded: boolean; // Node expanded state
  level: number; // Hierarchy level
  cells: MSHFlexGridCell[];
  data: any; // Associated data object
  tag: string;
}

export interface MSHFlexGridColumn {
  index: number;
  width: number;
  caption: string;
  alignment: number;
  visible: boolean;
  sort: number; // 0=None, 1=Ascending, 2=Descending
  dataField: string;
  format: string;
  tag: string;
}

export interface MSHFlexGridControl {
  type: 'MSHFlexGrid';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Grid Structure
  rows: number;
  cols: number;
  fixedRows: number;
  fixedCols: number;
  
  // Data
  gridRows: MSHFlexGridRow[];
  gridCols: MSHFlexGridColumn[];
  
  // Current Selection
  row: number;
  col: number;
  rowSel: number;
  colSel: number;
  
  // Hierarchy
  outlineBar: number; // 0=None, 1=Simple, 2=PlusMinus
  outlineCol: number; // Column with hierarchy
  treeLines: boolean;
  
  // Appearance
  gridLines: number; // 0=None, 1=Horizontal, 2=Vertical, 3=Both
  gridColor: string;
  backColor: string;
  foreColor: string;
  backColorFixed: string;
  foreColorFixed: string;
  backColorSel: string;
  foreColorSel: string;
  
  // Behavior
  allowUserResizing: number; // 0=None, 1=Columns, 2=Rows, 3=Both
  allowBigSelection: boolean;
  editable: boolean;
  focusRect: number; // 0=None, 1=Light, 2=Heavy
  highlightRow: number; // 0=Never, 1=Always, 2=With Focus
  
  // Scrolling
  scrollBars: number; // 0=None, 1=Horizontal, 2=Vertical, 3=Both
  scrollTrack: boolean;
  
  // Sorting
  sort: number; // 0=None, 1=Generic, 2=Numeric, 3=String, 4=Date
  
  // Data Binding
  dataSource: string;
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  mousePointer: number;
  tag: string;
  
  // Events
  onClick?: string;
  onDblClick?: string;
  onSelChange?: string;
  onRowColChange?: string;
  onKeyPress?: string;
  onEnterCell?: string;
  onLeaveCell?: string;
  onAfterEdit?: string;
  onBeforeEdit?: string;
  onAfterSort?: string;
  onBeforeSort?: string;
  onExpand?: string;
  onCollapse?: string;
}

interface MSHFlexGridControlProps {
  control: MSHFlexGridControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const MSHFlexGridControl: React.FC<MSHFlexGridControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 400,
    height = 300,
    rows = 10,
    cols = 5,
    fixedRows = 1,
    fixedCols = 0,
    gridRows = [],
    gridCols = [],
    row = 0,
    col = 0,
    rowSel = 0,
    colSel = 0,
    outlineBar = 1,
    outlineCol = 0,
    treeLines = true,
    gridLines = 3,
    gridColor = '#c0c0c0',
    backColor = '#ffffff',
    foreColor = '#000000',
    backColorFixed = '#c0c0c0',
    foreColorFixed = '#000000',
    backColorSel = '#0078d4',
    foreColorSel = '#ffffff',
    allowUserResizing = 3,
    allowBigSelection = false,
    editable = false,
    focusRect = 1,
    highlightRow = 1,
    scrollBars = 3,
    scrollTrack = true,
    sort = 0,
    dataSource = '',
    enabled = true,
    visible = true,
    mousePointer = 0,
    tag = ''
  } = control;

  const [currentRow, setCurrentRow] = useState(row);
  const [currentCol, setCurrentCol] = useState(col);
  const [selectedRows, setSelectedRows] = useState<number[]>([rowSel]);
  const [selectedCols, setSelectedCols] = useState<number[]>([colSel]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [resizing, setResizing] = useState<{ type: 'row' | 'col'; index: number; start: number } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Initialize grid data if empty
  const [actualRows, setActualRows] = useState<MSHFlexGridRow[]>(() => {
    if (gridRows.length > 0) return gridRows;
    
    return Array.from({ length: rows }, (_, i) => ({
      index: i,
      height: 20,
      visible: true,
      selected: false,
      indent: 0,
      isNode: false,
      expanded: true,
      level: 0,
      cells: Array.from({ length: cols }, (_, j) => ({
        text: i === 0 ? `Col ${j}` : `R${i}C${j}`,
        alignment: 0,
        backColor: i < fixedRows ? backColorFixed : backColor,
        foreColor: i < fixedRows ? foreColorFixed : foreColor,
        fontBold: i < fixedRows,
        fontItalic: false,
        picture: '',
        cellType: 0,
        tag: ''
      })),
      data: null,
      tag: ''
    }));
  });

  const [actualCols, setActualCols] = useState<MSHFlexGridColumn[]>(() => {
    if (gridCols.length > 0) return gridCols;
    
    return Array.from({ length: cols }, (_, i) => ({
      index: i,
      width: 80,
      caption: `Column ${i}`,
      alignment: 0,
      visible: true,
      sort: 0,
      dataField: `field${i}`,
      format: '',
      tag: ''
    }));
  });

  const handleCellClick = useCallback((rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    if (!enabled) return;
    
    event.preventDefault();
    
    const oldRow = currentRow;
    const oldCol = currentCol;
    
    setCurrentRow(rowIndex);
    setCurrentCol(colIndex);
    
    if (!allowBigSelection) {
      setSelectedRows([rowIndex]);
      setSelectedCols([colIndex]);
    }
    
    onPropertyChange?.('row', rowIndex);
    onPropertyChange?.('col', colIndex);
    
    if (oldRow !== rowIndex || oldCol !== colIndex) {
      onEvent?.('RowColChange');
    }
    
    onEvent?.('Click', { row: rowIndex, col: colIndex });
    onEvent?.('EnterCell');
  }, [enabled, currentRow, currentCol, allowBigSelection, onPropertyChange, onEvent]);

  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    if (!enabled) return;
    
    event.preventDefault();
    onEvent?.('DblClick', { row: rowIndex, col: colIndex });
    
    // Start editing if editable
    if (editable && rowIndex >= fixedRows && colIndex >= fixedCols) {
      startEditing(rowIndex, colIndex);
    }
  }, [enabled, editable, fixedRows, fixedCols, onEvent]);

  const startEditing = useCallback((rowIndex: number, colIndex: number) => {
    const cell = actualRows[rowIndex]?.cells[colIndex];
    if (!cell) return;
    
    onEvent?.('BeforeEdit', { row: rowIndex, col: colIndex });
    
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(cell.text);
    
    // Focus input after state update
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  }, [actualRows, onEvent]);

  const finishEditing = useCallback((save: boolean = true) => {
    if (!editingCell) return;
    
    if (save && editValue !== actualRows[editingCell.row]?.cells[editingCell.col]?.text) {
      const newRows = [...actualRows];
      newRows[editingCell.row].cells[editingCell.col].text = editValue;
      setActualRows(newRows);
      
      onEvent?.('AfterEdit', { 
        row: editingCell.row, 
        col: editingCell.col, 
        value: editValue 
      });
    }
    
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, actualRows, onEvent]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;
    
    onEvent?.('KeyPress', { keyCode: event.keyCode, key: event.key });
    
    switch (event.key) {
      case 'Enter':
        if (editingCell) {
          event.preventDefault();
          finishEditing(true);
        } else if (editable && currentRow >= fixedRows && currentCol >= fixedCols) {
          startEditing(currentRow, currentCol);
        }
        break;
      case 'Escape':
        if (editingCell) {
          event.preventDefault();
          finishEditing(false);
        }
        break;
      case 'F2':
        if (editable && currentRow >= fixedRows && currentCol >= fixedCols) {
          event.preventDefault();
          startEditing(currentRow, currentCol);
        }
        break;
      case 'ArrowUp':
        if (!editingCell && currentRow > 0) {
          event.preventDefault();
          handleCellClick(currentRow - 1, currentCol, event as any);
        }
        break;
      case 'ArrowDown':
        if (!editingCell && currentRow < actualRows.length - 1) {
          event.preventDefault();
          handleCellClick(currentRow + 1, currentCol, event as any);
        }
        break;
      case 'ArrowLeft':
        if (!editingCell && currentCol > 0) {
          event.preventDefault();
          handleCellClick(currentRow, currentCol - 1, event as any);
        }
        break;
      case 'ArrowRight':
        if (!editingCell && currentCol < actualCols.length - 1) {
          event.preventDefault();
          handleCellClick(currentRow, currentCol + 1, event as any);
        }
        break;
    }
  }, [enabled, editingCell, currentRow, currentCol, fixedRows, fixedCols, editable, actualRows.length, actualCols.length, finishEditing, startEditing, handleCellClick, onEvent]);

  const handleNodeToggle = useCallback((rowIndex: number) => {
    if (rowIndex >= actualRows.length || !actualRows[rowIndex].isNode) return;
    
    const newRows = [...actualRows];
    const row = newRows[rowIndex];
    row.expanded = !row.expanded;
    
    setActualRows(newRows);
    
    if (row.expanded) {
      onEvent?.('Expand', { row: rowIndex });
    } else {
      onEvent?.('Collapse', { row: rowIndex });
    }
  }, [actualRows, onEvent]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  if (!visible) {
    return null;
  }

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
    
    if (scrollBars === 1 || scrollBars === 3) overflowX = 'auto';
    if (scrollBars === 2 || scrollBars === 3) overflowY = 'auto';
    
    return { overflowX, overflowY };
  };

  const getCellStyle = (rowIndex: number, colIndex: number, cell: MSHFlexGridCell) => {
    const isFixed = rowIndex < fixedRows || colIndex < fixedCols;
    const isSelected = selectedRows.includes(rowIndex) && selectedCols.includes(colIndex);
    const isCurrent = rowIndex === currentRow && colIndex === currentCol;
    
    let background = cell.backColor;
    let color = cell.foreColor;
    let border = 'none';
    
    if (isSelected) {
      background = backColorSel;
      color = foreColorSel;
    }
    
    if (isCurrent && focusRect > 0) {
      border = focusRect === 1 ? '1px dotted #000' : '2px solid #000';
    }
    
    // Grid lines
    let borderRight = 'none';
    let borderBottom = 'none';
    
    if (gridLines === 2 || gridLines === 3) {
      borderRight = colIndex < actualCols.length - 1 ? `1px solid ${gridColor}` : 'none';
    }
    if (gridLines === 1 || gridLines === 3) {
      borderBottom = rowIndex < actualRows.length - 1 ? `1px solid ${gridColor}` : 'none';
    }
    
    return {
      background,
      color,
      border,
      borderRight,
      borderBottom,
      fontWeight: cell.fontBold ? 'bold' : 'normal',
      fontStyle: cell.fontItalic ? 'italic' : 'normal',
      textAlign: ['left', 'center', 'right'][cell.alignment] as 'left' | 'center' | 'right',
      padding: '2px 4px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: enabled ? 'cell' : 'not-allowed'
    };
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px inset #d0d0d0',
    background: backColor,
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    ...getScrollStyle()
  };

  return (
    <div
      ref={gridRef}
      className={`vb6-mshflexgrid ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onScroll={handleScroll}
      onKeyDown={handleKeyPress}
      tabIndex={enabled ? 0 : -1}
      data-name={name}
      data-type="MSHFlexGrid"
    >
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {actualRows.map((gridRow, rowIndex) => (
            <tr key={rowIndex} style={{ height: `${gridRow.height}px` }}>
              {actualCols.map((gridCol, colIndex) => {
                const cell = gridRow.cells[colIndex];
                if (!cell || !gridCol.visible) return null;
                
                const isOutlineCol = colIndex === outlineCol && outlineBar > 0;
                
                return (
                  <td
                    key={colIndex}
                    style={{
                      ...getCellStyle(rowIndex, colIndex, cell),
                      width: `${gridCol.width}px`,
                      minWidth: `${gridCol.width}px`,
                      maxWidth: `${gridCol.width}px`,
                      position: 'relative'
                    }}
                    onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                    onDoubleClick={(e) => handleCellDoubleClick(rowIndex, colIndex, e)}
                  >
                    {/* Hierarchy indicators */}
                    {isOutlineCol && gridRow.level > 0 && (
                      <span style={{ 
                        marginRight: `${gridRow.level * 16}px`,
                        color: 'transparent'
                      }}>
                        •
                      </span>
                    )}
                    
                    {/* Node expand/collapse button */}
                    {isOutlineCol && gridRow.isNode && outlineBar === 2 && (
                      <button
                        style={{
                          width: '12px',
                          height: '12px',
                          background: '#f0f0f0',
                          border: '1px solid #808080',
                          fontSize: '8px',
                          cursor: 'pointer',
                          marginRight: '4px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeToggle(rowIndex);
                        }}
                      >
                        {gridRow.expanded ? '−' : '+'}
                      </button>
                    )}
                    
                    {/* Cell content */}
                    {editingCell && editingCell.row === rowIndex && editingCell.col === colIndex ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            finishEditing(true);
                          } else if (e.key === 'Escape') {
                            finishEditing(false);
                          }
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          font: 'inherit',
                          color: 'inherit'
                        }}
                      />
                    ) : (
                      <span>{cell.text}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

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
          {name} - MSHFlexGrid ({actualRows.length}×{actualCols.length})
          {editable && <span> - Editable</span>}
        </div>
      )}
    </div>
  );
};

// Helper functions for MSHFlexGrid
export const MSHFlexGridHelpers = {
  /**
   * Create default cell
   */
  createCell: (text: string = '', isFixed: boolean = false): MSHFlexGridCell => ({
    text,
    alignment: 0,
    backColor: isFixed ? '#c0c0c0' : '#ffffff',
    foreColor: '#000000',
    fontBold: isFixed,
    fontItalic: false,
    picture: '',
    cellType: 0,
    tag: ''
  }),

  /**
   * Create hierarchical data structure
   */
  createHierarchicalData: (data: any[], childrenField: string = 'children'): MSHFlexGridRow[] => {
    const rows: MSHFlexGridRow[] = [];
    
    const processNode = (item: any, level: number, index: number) => {
      const children = item[childrenField] || [];
      const hasChildren = children.length > 0;
      
      rows.push({
        index,
        height: 20,
        visible: true,
        selected: false,
        indent: level * 16,
        isNode: hasChildren,
        expanded: true,
        level,
        cells: Object.keys(item).filter(key => key !== childrenField).map(key => 
          MSHFlexGridHelpers.createCell(String(item[key]))
        ),
        data: item,
        tag: ''
      });
      
      if (hasChildren) {
        children.forEach((child: any, childIndex: number) => {
          processNode(child, level + 1, rows.length);
        });
      }
    };
    
    data.forEach((item, index) => processNode(item, 0, index));
    return rows;
  },

  /**
   * Sort grid by column
   */
  sortByColumn: (rows: MSHFlexGridRow[], colIndex: number, ascending: boolean = true): MSHFlexGridRow[] => {
    return [...rows].sort((a, b) => {
      const aText = a.cells[colIndex]?.text || '';
      const bText = b.cells[colIndex]?.text || '';
      
      // Try numeric comparison first
      const aNum = parseFloat(aText);
      const bNum = parseFloat(bText);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return ascending ? aNum - bNum : bNum - aNum;
      }
      
      // Fall back to string comparison
      return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });
  },

  /**
   * Filter rows based on criteria
   */
  filterRows: (rows: MSHFlexGridRow[], colIndex: number, filterText: string): MSHFlexGridRow[] => {
    if (!filterText) return rows;
    
    return rows.filter(row => 
      row.cells[colIndex]?.text.toLowerCase().includes(filterText.toLowerCase())
    );
  },

  /**
   * Get selected range
   */
  getSelectedRange: (startRow: number, startCol: number, endRow: number, endCol: number) => {
    return {
      rowStart: Math.min(startRow, endRow),
      rowEnd: Math.max(startRow, endRow),
      colStart: Math.min(startCol, endCol),
      colEnd: Math.max(startCol, endCol)
    };
  }
};

export default MSHFlexGridControl;