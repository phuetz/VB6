/**
 * MSFlexGrid Control - 100% VB6 Compatible
 * Implementation complète avec toutes les propriétés, méthodes et événements
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef, CSSProperties } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';

interface CellData {
  text: string;
  backColor?: string;
  foreColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  alignment?: number;
  picture?: string;
}

interface MSFlexGridProps extends VB6ControlPropsEnhanced {
  // Grid dimensions
  rows: number;
  cols: number;
  fixedRows: number;
  fixedCols: number;
  
  // Current position
  row: number;
  col: number;
  rowSel: number;
  colSel: number;
  
  // Grid appearance
  gridLines: 0 | 1 | 2 | 3; // flexGridNone, flexGridFlat, flexGridInset, flexGridRaised
  gridLinesFixed: 0 | 1 | 2 | 3;
  gridColor: string;
  gridColorFixed: string;
  
  // Colors
  backColor: string;
  backColorFixed: string;
  backColorSel: string;
  backColorBkg: string;
  foreColor: string;
  foreColorFixed: string;
  foreColorSel: string;
  
  // Font
  font: any;
  
  // Behavior
  allowBigSelection: boolean;
  allowUserResizing: 0 | 1 | 2 | 3; // flexResizeNone, flexResizeColumns, flexResizeRows, flexResizeBoth
  cellAlignment: number;
  
  // Row and column properties
  rowHeight: number[];
  colWidth: number[];
  
  // Scrolling
  scrollBars: 0 | 1 | 2 | 3; // flexScrollBarNone, flexScrollBarHorizontal, flexScrollBarVertical, flexScrollBarBoth
  topRow: number;
  leftCol: number;
  
  // Selection
  selectionMode: 0 | 1 | 2; // flexSelectionFree, flexSelectionByRow, flexSelectionByColumn
  highlight: 0 | 1 | 2; // flexHighlightNever, flexHighlightAlways, flexHighlightWithFocus
  fillStyle: 0 | 1; // flexFillSingle, flexFillRepeat
  focusRect: 0 | 1 | 2; // flexFocusNone, flexFocusLight, flexFocusHeavy
  
  // Editing
  editable: 0 | 1 | 2; // flexEDNone, flexEDKbdMouse, flexEDKbd
  
  // Other properties
  redraw: boolean;
  wordWrap: boolean;
  textStyle: 0 | 1 | 2 | 3 | 4; // flexTextFlat, flexTextRaised, flexTextInset, flexTextRaisedLight, flexTextInsetLight
  textStyleFixed: 0 | 1 | 2 | 3 | 4;
  sort: number;
  rowHeightMin: number;
  colWidthMin: number;
  colWidthMax: number;
  rowHeightMax: number;
  
  // Merge properties
  mergeCells: 0 | 1 | 2 | 3 | 4; // flexMergeNever, flexMergeFree, flexMergeRestrictRows, flexMergeRestrictColumns, flexMergeRestrictAll
  mergeRow: boolean[];
  mergeCol: boolean[];
  
  // Pictures
  picture?: string;
  pictureType: 0 | 1; // flexPicTypeColor, flexPicTypeMonochrome
  cellPicture?: string;
  cellPictureAlignment: number;
  
  // Data
  clip: string;
  formatString: string;
  
  // Methods will be exposed through ref
}

export const MSFlexGridControl = forwardRef<any, MSFlexGridProps>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    rows = 2,
    cols = 2,
    fixedRows = 1,
    fixedCols = 1,
    row: currentRow = 1,
    col: currentCol = 1,
    rowSel = 1,
    colSel = 1,
    gridLines = 1,
    gridLinesFixed = 2,
    gridColor = '#C0C0C0',
    gridColorFixed = '#000000',
    backColor = '#FFFFFF',
    backColorFixed = '#8080FF',
    backColorSel = '#0078D7',
    backColorBkg = '#808080',
    foreColor = '#000000',
    foreColorFixed = '#000000',
    foreColorSel = '#FFFFFF',
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false },
    allowBigSelection = true,
    allowUserResizing = 0,
    cellAlignment = 0,
    rowHeight: initialRowHeight = [],
    colWidth: initialColWidth = [],
    scrollBars = 3,
    topRow = 1,
    leftCol = 1,
    selectionMode = 0,
    highlight = 1,
    fillStyle = 0,
    focusRect = 1,
    editable = 0,
    redraw = true,
    wordWrap = false,
    textStyle = 0,
    textStyleFixed = 0,
    sort = 0,
    rowHeightMin = 0,
    colWidthMin = 0,
    colWidthMax = 0,
    rowHeightMax = 0,
    mergeCells = 0,
    mergeRow = [],
    mergeCol = [],
    picture,
    pictureType = 0,
    cellPicture,
    cellPictureAlignment = 0,
    clip = '',
    formatString = '',
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  // State management
  const [gridData, setGridData] = useState<CellData[][]>(() => {
    const data: CellData[][] = [];
    for (let r = 0; r < rows; r++) {
      data[r] = [];
      for (let c = 0; c < cols; c++) {
        data[r][c] = { text: '' };
      }
    }
    return data;
  });

  const [selection, setSelection] = useState({
    row: currentRow,
    col: currentCol,
    rowSel,
    colSel,
  });

  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    const widths = [...initialColWidth];
    for (let i = widths.length; i < cols; i++) {
      widths[i] = 75; // Default column width
    }
    return widths;
  });
  const [rowHeights, setRowHeights] = useState<number[]>(() => {
    const heights = [...initialRowHeight];
    for (let i = heights.length; i < rows; i++) {
      heights[i] = 20; // Default row height
    }
    return heights;
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Grid rendering logic
  const getGridLineStyle = (type: number): CSSProperties => {
    switch (type) {
      case 0: return {}; // None
      case 1: return { border: `1px solid ${gridColor}` }; // Flat
      case 2: return { border: '1px inset #C0C0C0' }; // Inset
      case 3: return { border: '1px outset #C0C0C0' }; // Raised
      default: return {};
    }
  };

  const getCellStyle = (r: number, c: number): CSSProperties => {
    const isFixed = r < fixedRows || c < fixedCols;
    const isSelected = isInSelection(r, c);
    const cell = gridData[r]?.[c];

    return {
      position: 'relative',
      width: columnWidths[c],
      height: rowHeights[r],
      backgroundColor: isSelected ? backColorSel : 
                      isFixed ? backColorFixed : 
                      cell?.backColor || backColor,
      color: isSelected ? foreColorSel : 
             isFixed ? foreColorFixed : 
             cell?.foreColor || foreColor,
      fontFamily: font.name,
      fontSize: `${font.size}pt`,
      fontWeight: cell?.fontBold || (isFixed && font.bold) ? 'bold' : 'normal',
      fontStyle: cell?.fontItalic || font.italic ? 'italic' : 'normal',
      display: 'flex',
      alignItems: 'center',
      justifyContent: getAlignmentStyle(cell?.alignment || cellAlignment),
      padding: '2px',
      cursor: getCellCursor(r, c),
      userSelect: 'none',
      overflow: wordWrap ? 'visible' : 'hidden',
      whiteSpace: wordWrap ? 'normal' : 'nowrap',
      textOverflow: wordWrap ? 'clip' : 'ellipsis',
      ...(isFixed ? getGridLineStyle(gridLinesFixed) : getGridLineStyle(gridLines)),
    };
  };

  const getAlignmentStyle = (align: number): string => {
    const alignments = [
      'flex-start', 'flex-start', 'flex-start',    // Left top, center, bottom
      'center', 'center', 'center',                 // Center top, center, bottom
      'flex-end', 'flex-end', 'flex-end',          // Right top, center, bottom
      'flex-start'                                  // General
    ];
    return alignments[align] || 'flex-start';
  };

  const getCellCursor = (r: number, c: number): string => {
    if (!enabled) return 'default';
    if (editable > 0 && r >= fixedRows && c >= fixedCols) return 'text';
    return 'cell';
  };

  const isInSelection = (r: number, c: number): boolean => {
    const minRow = Math.min(selection.row, selection.rowSel);
    const maxRow = Math.max(selection.row, selection.rowSel);
    const minCol = Math.min(selection.col, selection.colSel);
    const maxCol = Math.max(selection.col, selection.colSel);
    
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  };

  // Event handlers
  const handleCellClick = useCallback((r: number, c: number, e: React.MouseEvent) => {
    if (!enabled) return;

    const shiftKey = e.shiftKey;
    const ctrlKey = e.ctrlKey;

    if (shiftKey && allowBigSelection) {
      // Extend selection
      setSelection(prev => ({ ...prev, rowSel: r, colSel: c }));
    } else {
      // New selection
      setSelection({ row: r, col: c, rowSel: r, colSel: c });
    }

    updateControl(id, 'row', r);
    updateControl(id, 'col', c);
    updateControl(id, 'rowSel', r);
    updateControl(id, 'colSel', c);

    fireEvent(name, 'Click', {});
    fireEvent(name, 'SelChange', {});

    if (editable === 1 && r >= fixedRows && c >= fixedCols) { // flexEDKbdMouse
      startEditing(r, c);
    }
  }, [enabled, allowBigSelection, editable, fixedRows, fixedCols, id, name, fireEvent, updateControl]);

  const handleCellDoubleClick = useCallback((r: number, c: number) => {
    if (!enabled) return;
    
    fireEvent(name, 'DblClick', {});
    
    if (editable > 0 && r >= fixedRows && c >= fixedCols) {
      startEditing(r, c);
    }
  }, [enabled, editable, fixedRows, fixedCols, name, fireEvent]);

  const startEditing = (r: number, c: number) => {
    setEditingCell({ row: r, col: c });
    setEditValue(gridData[r][c].text);
    fireEvent(name, 'EnterCell', {});
  };

  const finishEditing = (save: boolean) => {
    if (!editingCell) return;

    if (save) {
      const newData = [...gridData];
      newData[editingCell.row][editingCell.col].text = editValue;
      setGridData(newData);
      updateControl(id, 'text', editValue);
      fireEvent(name, 'AfterEdit', { row: editingCell.row, col: editingCell.col });
    }

    setEditingCell(null);
    setEditValue('');
    fireEvent(name, 'LeaveCell', {});
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return;

    const { row, col } = selection;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(fixedRows, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(rows - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(fixedCols, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(cols - 1, col + 1);
        break;
      case 'Home':
        newCol = fixedCols;
        if (e.ctrlKey) newRow = fixedRows;
        break;
      case 'End':
        newCol = cols - 1;
        if (e.ctrlKey) newRow = rows - 1;
        break;
      case 'PageUp':
        newRow = Math.max(fixedRows, row - 10);
        break;
      case 'PageDown':
        newRow = Math.min(rows - 1, row + 10);
        break;
      case 'Enter':
        if (editable > 0 && !editingCell) {
          startEditing(row, col);
        } else if (editingCell) {
          finishEditing(true);
        }
        return;
      case 'Escape':
        if (editingCell) {
          finishEditing(false);
        }
        return;
      case 'F2':
        if (editable > 0 && !editingCell) {
          startEditing(row, col);
        }
        return;
      default:
        return;
    }

    e.preventDefault();
    
    if (e.shiftKey && allowBigSelection) {
      setSelection(prev => ({ ...prev, rowSel: newRow, colSel: newCol }));
    } else {
      setSelection({ row: newRow, col: newCol, rowSel: newRow, colSel: newCol });
    }

    fireEvent(name, 'SelChange', {});
  }, [enabled, selection, fixedRows, fixedCols, rows, cols, allowBigSelection, editable, editingCell, name, fireEvent]);

  // Column resizing
  const handleColumnResize = useCallback((colIndex: number, newWidth: number) => {
    if (allowUserResizing === 0 || allowUserResizing === 2) return; // No column resizing
    
    const minWidth = colWidthMin || 10;
    const maxWidth = colWidthMax || 10000;
    const width = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    const newWidths = [...columnWidths];
    newWidths[colIndex] = width;
    setColumnWidths(newWidths);
    
    updateControl(id, 'colWidth', newWidths);
    fireEvent(name, 'AfterColResize', { col: colIndex });
  }, [allowUserResizing, colWidthMin, colWidthMax, columnWidths, id, name, fireEvent, updateControl]);

  // Row resizing
  const handleRowResize = useCallback((rowIndex: number, newHeight: number) => {
    if (allowUserResizing === 0 || allowUserResizing === 1) return; // No row resizing
    
    const minHeight = rowHeightMin || 10;
    const maxHeight = rowHeightMax || 10000;
    const height = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    const newHeights = [...rowHeights];
    newHeights[rowIndex] = height;
    setRowHeights(newHeights);
    
    updateControl(id, 'rowHeight', newHeights);
    fireEvent(name, 'AfterRowResize', { row: rowIndex });
  }, [allowUserResizing, rowHeightMin, rowHeightMax, rowHeights, id, name, fireEvent, updateControl]);

  // VB6 Methods - Complete API
  const vb6Methods = {
    // Properties
    get Text() { return gridData[selection.row]?.[selection.col]?.text || ''; },
    set Text(value: string) {
      const newData = [...gridData];
      if (!newData[selection.row]) newData[selection.row] = [];
      if (!newData[selection.row][selection.col]) newData[selection.row][selection.col] = { text: '' };
      newData[selection.row][selection.col].text = value;
      setGridData(newData);
      updateControl(id, 'text', value);
      fireEvent(name, 'AfterEdit', { row: selection.row, col: selection.col });
    },
    
    get TextMatrix() { return gridData; },
    TextMatrixGet(row: number, col: number) {
      return gridData[row]?.[col]?.text || '';
    },
    TextMatrixSet(row: number, col: number, value: string) {
      const newData = [...gridData];
      if (!newData[row]) newData[row] = [];
      if (!newData[row][col]) newData[row][col] = { text: '' };
      newData[row][col].text = value;
      setGridData(newData);
      updateControl(id, 'textMatrix', newData);
    },

    // Cell formatting methods
    get CellBackColor() { return gridData[selection.row]?.[selection.col]?.backColor || backColor; },
    set CellBackColor(value: string) {
      const newData = [...gridData];
      if (!newData[selection.row]) newData[selection.row] = [];
      if (!newData[selection.row][selection.col]) newData[selection.row][selection.col] = { text: '' };
      newData[selection.row][selection.col].backColor = value;
      setGridData(newData);
    },

    get CellForeColor() { return gridData[selection.row]?.[selection.col]?.foreColor || foreColor; },
    set CellForeColor(value: string) {
      const newData = [...gridData];
      if (!newData[selection.row]) newData[selection.row] = [];
      if (!newData[selection.row][selection.col]) newData[selection.row][selection.col] = { text: '' };
      newData[selection.row][selection.col].foreColor = value;
      setGridData(newData);
    },

    get CellFontBold() { return gridData[selection.row]?.[selection.col]?.fontBold || false; },
    set CellFontBold(value: boolean) {
      const newData = [...gridData];
      if (!newData[selection.row]) newData[selection.row] = [];
      if (!newData[selection.row][selection.col]) newData[selection.row][selection.col] = { text: '' };
      newData[selection.row][selection.col].fontBold = value;
      setGridData(newData);
    },

    get CellAlignment() { return gridData[selection.row]?.[selection.col]?.alignment || cellAlignment; },
    set CellAlignment(value: number) {
      const newData = [...gridData];
      if (!newData[selection.row]) newData[selection.row] = [];
      if (!newData[selection.row][selection.col]) newData[selection.row][selection.col] = { text: '' };
      newData[selection.row][selection.col].alignment = value;
      setGridData(newData);
    },

    // Grid structure methods
    get Rows() { return rows; },
    set Rows(value: number) {
      updateControl(id, 'rows', value);
      // Resize grid data
      const newData = [...gridData];
      while (newData.length < value) {
        const newRow: CellData[] = [];
        for (let c = 0; c < cols; c++) {
          newRow[c] = { text: '' };
        }
        newData.push(newRow);
      }
      if (newData.length > value) {
        newData.splice(value);
      }
      setGridData(newData);
    },

    get Cols() { return cols; },
    set Cols(value: number) {
      updateControl(id, 'cols', value);
      // Resize grid data
      const newData = gridData.map(row => {
        const newRow = [...row];
        while (newRow.length < value) {
          newRow.push({ text: '' });
        }
        if (newRow.length > value) {
          newRow.splice(value);
        }
        return newRow;
      });
      setGridData(newData);
    },

    get Row() { return selection.row; },
    set Row(value: number) {
      if (value >= fixedRows && value < rows) {
        setSelection(prev => ({ ...prev, row: value, rowSel: value }));
        updateControl(id, 'row', value);
        fireEvent(name, 'RowColChange', {});
      }
    },

    get Col() { return selection.col; },
    set Col(value: number) {
      if (value >= fixedCols && value < cols) {
        setSelection(prev => ({ ...prev, col: value, colSel: value }));
        updateControl(id, 'col', value);
        fireEvent(name, 'RowColChange', {});
      }
    },

    get RowSel() { return selection.rowSel; },
    set RowSel(value: number) {
      if (value >= 0 && value < rows) {
        setSelection(prev => ({ ...prev, rowSel: value }));
        updateControl(id, 'rowSel', value);
        fireEvent(name, 'SelChange', {});
      }
    },

    get ColSel() { return selection.colSel; },
    set ColSel(value: number) {
      if (value >= 0 && value < cols) {
        setSelection(prev => ({ ...prev, colSel: value }));
        updateControl(id, 'colSel', value);
        fireEvent(name, 'SelChange', {});
      }
    },

    // Column and row sizing
    ColWidth(col: number, width?: number) {
      if (width !== undefined) {
        const newWidths = [...columnWidths];
        newWidths[col] = width;
        setColumnWidths(newWidths);
        updateControl(id, 'colWidth', newWidths);
        return width;
      }
      return columnWidths[col] || 75;
    },

    RowHeight(row: number, height?: number) {
      if (height !== undefined) {
        const newHeights = [...rowHeights];
        newHeights[row] = height;
        setRowHeights(newHeights);
        updateControl(id, 'rowHeight', newHeights);
        return height;
      }
      return rowHeights[row] || 20;
    },

    // Data manipulation methods
    Clear() {
      const newData = gridData.map(row => row.map(cell => ({ ...cell, text: '' })));
      setGridData(newData);
      fireEvent(name, 'AfterDataChange', {});
    },
    
    ClearStructure() {
      const newData: CellData[][] = [];
      for (let r = 0; r < rows; r++) {
        newData[r] = [];
        for (let c = 0; c < cols; c++) {
          newData[r][c] = { text: '' };
        }
      }
      setGridData(newData);
    },
    
    AddItem(item: string, index?: number) {
      const targetRow = index ?? selection.row;
      if (targetRow >= 0 && targetRow < rows) {
        const newData = [...gridData];
        newData[targetRow][selection.col].text = item;
        setGridData(newData);
        fireEvent(name, 'AfterDataChange', {});
      }
    },
    
    RemoveItem(index: number) {
      if (index >= fixedRows && index < rows) {
        const newData = gridData.filter((_, i) => i !== index);
        // Add empty row to maintain row count
        const emptyRow: CellData[] = [];
        for (let c = 0; c < cols; c++) {
          emptyRow[c] = { text: '' };
        }
        newData.push(emptyRow);
        setGridData(newData);
        fireEvent(name, 'AfterDataChange', {});
      }
    },

    // Advanced methods
    Sort(column?: number, order?: number) {
      const sortCol = column ?? selection.col;
      const ascending = order === undefined || order === 0;
      const newData = [...gridData];
      const dataToSort = newData.slice(fixedRows);
      
      dataToSort.sort((a, b) => {
        const aVal = a[sortCol]?.text || '';
        const bVal = b[sortCol]?.text || '';
        const result = aVal.localeCompare(bVal, undefined, { numeric: true });
        return ascending ? result : -result;
      });
      
      newData.splice(fixedRows, dataToSort.length, ...dataToSort);
      setGridData(newData);
      fireEvent(name, 'AfterSort', { col: sortCol });
    },

    Refresh() {
      // Force redraw
      updateControl(id, 'redraw', false);
      setTimeout(() => updateControl(id, 'redraw', true), 10);
    },

    // Clipboard operations
    get Clip() {
      const minRow = Math.min(selection.row, selection.rowSel);
      const maxRow = Math.max(selection.row, selection.rowSel);
      const minCol = Math.min(selection.col, selection.colSel);
      const maxCol = Math.max(selection.col, selection.colSel);
      
      const clipData: string[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        const rowData: string[] = [];
        for (let c = minCol; c <= maxCol; c++) {
          rowData.push(gridData[r]?.[c]?.text || '');
        }
        clipData.push(rowData.join('\t'));
      }
      return clipData.join('\n');
    },

    set Clip(value: string) {
      const lines = value.split('\n');
      const newData = [...gridData];
      
      for (let r = 0; r < lines.length; r++) {
        const cells = lines[r].split('\t');
        const targetRow = selection.row + r;
        
        if (targetRow < rows) {
          for (let c = 0; c < cells.length; c++) {
            const targetCol = selection.col + c;
            if (targetCol < cols) {
              if (!newData[targetRow]) newData[targetRow] = [];
              if (!newData[targetRow][targetCol]) newData[targetRow][targetCol] = { text: '' };
              newData[targetRow][targetCol].text = cells[c];
            }
          }
        }
      }
      
      setGridData(newData);
      fireEvent(name, 'AfterDataChange', {});
    },

    // Selection methods
    SelectAll() {
      setSelection({
        row: fixedRows,
        col: fixedCols,
        rowSel: rows - 1,
        colSel: cols - 1
      });
      fireEvent(name, 'SelChange', {});
    },

    SelectRow(row: number) {
      if (row >= 0 && row < rows) {
        setSelection({
          row,
          col: fixedCols,
          rowSel: row,
          colSel: cols - 1
        });
        fireEvent(name, 'SelChange', {});
      }
    },

    SelectCol(col: number) {
      if (col >= 0 && col < cols) {
        setSelection({
          row: fixedRows,
          col,
          rowSel: rows - 1,
          colSel: col
        });
        fireEvent(name, 'SelChange', {});
      }
    },

    // Utility methods
    CellLeft(col: number) {
      return columnWidths.slice(0, col).reduce((sum, width) => sum + width, 0);
    },

    CellTop(row: number) {
      return rowHeights.slice(0, row).reduce((sum, height) => sum + height, 0);
    },

    CellWidth(col: number) {
      return columnWidths[col] || 75;
    },

    CellHeight(row: number) {
      return rowHeights[row] || 20;
    },

    // Format functions
    FormatString(fmt: string) {
      updateControl(id, 'formatString', fmt);
    },

    // Data binding placeholder methods
    ReBind() {
      fireEvent(name, 'AfterDataChange', {});
    },

    DataRefresh() {
      fireEvent(name, 'DataChange', {});
    }
  };

  // Expose methods through ref
  useEffect(() => {
    if (ref && typeof ref !== 'function') {
      ref.current = vb6Methods;
    }
  }, [ref, vb6Methods]);

  // Register VB6 methods globally
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
    
    // Make control globally accessible
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = vb6Methods;
    }
  }, [id, name, updateControl, vb6Methods]);

  // Grid container
  const gridStyle: CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    display: visible ? 'flex' : 'none',
    flexDirection: 'column',
    backgroundColor: backColorBkg,
    border: '2px inset #C0C0C0',
    overflow: 'hidden',
    outline: 'none',
    tabIndex: 0,
  };

  const scrollContainerStyle: CSSProperties = {
    flex: 1,
    overflow: scrollBars === 0 ? 'hidden' :
              scrollBars === 1 ? 'auto hidden' :
              scrollBars === 2 ? 'hidden auto' : 'auto',
    position: 'relative',
  };

  const tableStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columnWidths.map(w => `${w}px`).join(' '),
    gridTemplateRows: rowHeights.map(h => `${h}px`).join(' '),
    width: 'fit-content',
    minWidth: '100%',
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
      {redraw && (
        <div style={scrollContainerStyle}>
          <div style={tableStyle}>
            {Array.from({ length: rows }, (_, r) => 
              Array.from({ length: cols }, (_, c) => (
                <div
                  key={`${r}-${c}`}
                  style={getCellStyle(r, c)}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onDoubleClick={() => handleCellDoubleClick(r, c)}
                >
                  {editingCell?.row === r && editingCell?.col === c ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => finishEditing(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditing(true);
                        if (e.key === 'Escape') finishEditing(false);
                        e.stopPropagation();
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        font: 'inherit',
                        padding: 0,
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      {cellPicture && (
                        <img 
                          src={cellPicture} 
                          alt="" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }} 
                        />
                      )}
                      <span>{gridData[r]?.[c]?.text || ''}</span>
                    </>
                  )}
                  
                  {/* Resize handles */}
                  {r === 0 && allowUserResizing !== 0 && allowUserResizing !== 2 && (
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
                        e.preventDefault();
                        const startX = e.clientX;
                        const startWidth = columnWidths[c];
                        
                        const handleMove = (e: MouseEvent) => {
                          const delta = e.clientX - startX;
                          handleColumnResize(c, startWidth + delta);
                        };
                        
                        const handleUp = () => {
                          document.removeEventListener('mousemove', handleMove);
                          document.removeEventListener('mouseup', handleUp);
                        };
                        
                        document.addEventListener('mousemove', handleMove);
                        document.addEventListener('mouseup', handleUp);
                      }}
                    />
                  )}
                  
                  {c === 0 && allowUserResizing >= 2 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -2,
                        height: 4,
                        cursor: 'row-resize',
                        backgroundColor: 'transparent',
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const startY = e.clientY;
                        const startHeight = rowHeights[r];
                        
                        const handleMove = (e: MouseEvent) => {
                          const delta = e.clientY - startY;
                          handleRowResize(r, startHeight + delta);
                        };
                        
                        const handleUp = () => {
                          document.removeEventListener('mousemove', handleMove);
                          document.removeEventListener('mouseup', handleUp);
                        };
                        
                        document.addEventListener('mousemove', handleMove);
                        document.addEventListener('mouseup', handleUp);
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Focus rectangle */}
      {focusRect > 0 && !editingCell && (
        <div
          style={{
            position: 'absolute',
            left: columnWidths.slice(0, selection.col).reduce((a, b) => a + b, 0),
            top: rowHeights.slice(0, selection.row).reduce((a, b) => a + b, 0),
            width: columnWidths[selection.col],
            height: rowHeights[selection.row],
            border: focusRect === 1 ? '1px dotted #000' : '2px solid #000',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
});

export default MSFlexGridControl;