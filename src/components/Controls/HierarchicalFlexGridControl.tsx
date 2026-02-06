/**
 * Hierarchical FlexGrid Control - Complete VB6 MSHFlexGrid Implementation
 * Advanced grid with hierarchical data display capabilities
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// VB6 FlexGrid Constants
export enum FlexAlignmentConstants {
  flexAlignLeftTop = 0,
  flexAlignLeftCenter = 1,
  flexAlignLeftBottom = 2,
  flexAlignCenterTop = 3,
  flexAlignCenterCenter = 4,
  flexAlignCenterBottom = 5,
  flexAlignRightTop = 6,
  flexAlignRightCenter = 7,
  flexAlignRightBottom = 8,
  flexAlignGeneral = 9,
}

export enum FlexFillStyleConstants {
  flexFillSingle = 0,
  flexFillRepeat = 1,
}

export enum FlexFocusRectConstants {
  flexFocusNone = 0,
  flexFocusLight = 1,
  flexFocusHeavy = 2,
}

export enum FlexSelectionModeConstants {
  flexSelectionFree = 0,
  flexSelectionByRow = 1,
  flexSelectionByColumn = 2,
}

export enum FlexSortConstants {
  flexSortNone = 0,
  flexSortGeneric = 1,
  flexSortNumeric = 2,
  flexSortString = 3,
  flexSortStringNoDiacritics = 4,
  flexSortCustom = 9,
}

export enum FlexDataTypeConstants {
  flexDTString = 0,
  flexDTNumber = 1,
  flexDTBoolean = 2,
  flexDTDate = 3,
  flexDTCurrency = 4,
  flexDTTime = 5,
}

export interface FlexGridCell {
  text: string;
  value: any;
  alignment?: FlexAlignmentConstants;
  backgroundColor?: string;
  foregroundColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  picture?: string;
  cellType?: FlexDataTypeConstants;
}

export interface FlexGridRow {
  cells: FlexGridCell[];
  height: number;
  hidden: boolean;
  indent: number;
  isNode: boolean;
  isCollapsed: boolean;
  level: number;
  data?: any;
  children?: FlexGridRow[];
}

export interface FlexGridColumn {
  width: number;
  alignment: FlexAlignmentConstants;
  caption: string;
  dataType: FlexDataTypeConstants;
  format: string;
  hidden: boolean;
  sort: FlexSortConstants;
}

export interface DataSource {
  recordset?: any;
  hierarchicalRecordset?: any;
  fields?: string[];
  parentField?: string;
  childField?: string;
}

export interface HierarchicalFlexGridProps extends VB6ControlPropsEnhanced {
  // Grid structure
  rows?: number;
  cols?: number;
  fixedRows?: number;
  fixedCols?: number;

  // Data properties
  dataSource?: DataSource;
  dataField?: string;

  // Appearance
  gridLines?: boolean;
  gridLinesFixed?: boolean;
  gridLineWidth?: number;
  cellBackColor?: string;
  cellForeColor?: string;
  backColorFixed?: string;
  foreColorFixed?: string;
  backColorSel?: string;
  foreColorSel?: string;
  backColorBkg?: string;

  // Behavior
  allowBigSelection?: boolean;
  allowUserResizing?: boolean;
  editable?: boolean;
  focusRect?: FlexFocusRectConstants;
  highlightRow?: boolean;
  selectionMode?: FlexSelectionModeConstants;
  scrollBars?: number; // 0=none, 1=horizontal, 2=vertical, 3=both
  wordWrap?: boolean;

  // Hierarchy
  indentWidth?: number;
  outlining?: boolean;
  subtotal?: boolean;

  // Events
  onCellChanged?: (row: number, col: number) => void;
  onRowColChange?: (lastRow: number, lastCol: number) => void;
  onSelChange?: () => void;
  onScroll?: () => void;
  onBeforeEdit?: (row: number, col: number, cancel: boolean) => void;
  onAfterEdit?: (row: number, col: number) => void;
  onBeforeSort?: (col: number, order: number) => void;
  onAfterSort?: (col: number, order: number) => void;
  onBeforeCollapse?: (row: number, cancel: boolean) => void;
  onAfterCollapse?: (row: number) => void;
  onBeforeExpand?: (row: number, cancel: boolean) => void;
  onAfterExpand?: (row: number) => void;
}

export const HierarchicalFlexGridControl = forwardRef<HTMLDivElement, HierarchicalFlexGridProps>(
  (props, ref) => {
    const {
      id,
      name,
      left = 0,
      top = 0,
      width = 300,
      height = 200,
      visible = true,
      enabled = true,
      rows = 10,
      cols = 5,
      fixedRows = 1,
      fixedCols = 1,
      dataSource,
      dataField = '',
      gridLines = true,
      gridLinesFixed = true,
      gridLineWidth = 1,
      cellBackColor = '#FFFFFF',
      cellForeColor = '#000000',
      backColorFixed = '#C0C0C0',
      foreColorFixed = '#000000',
      backColorSel = '#0000FF',
      foreColorSel = '#FFFFFF',
      backColorBkg = '#E0E0E0',
      allowBigSelection = true,
      allowUserResizing = true,
      editable = false,
      focusRect = FlexFocusRectConstants.flexFocusLight,
      highlightRow = false,
      selectionMode = FlexSelectionModeConstants.flexSelectionFree,
      scrollBars = 3,
      wordWrap = false,
      indentWidth = 12,
      outlining = true,
      subtotal = false,
      onCellChanged,
      onRowColChange,
      onSelChange,
      onScroll,
      onBeforeEdit,
      onAfterEdit,
      onBeforeSort,
      onAfterSort,
      onBeforeCollapse,
      onAfterCollapse,
      onBeforeExpand,
      onAfterExpand,
      ...rest
    } = props;

    const [gridData, setGridData] = useState<FlexGridRow[]>([]);
    const [columns, setColumns] = useState<FlexGridColumn[]>([]);
    const [currentRow, setCurrentRow] = useState(0);
    const [currentCol, setCurrentCol] = useState(0);
    const [selectedRange, setSelectedRange] = useState({
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 0,
    });
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [columnWidths, setColumnWidths] = useState<number[]>([]);
    const [rowHeights, setRowHeights] = useState<number[]>([]);

    const gridRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const { fireEvent, updateControl } = useVB6Store();

    // VB6 Methods
    const vb6Methods = {
      AddItem: (text: string, index?: number) => {
        const newRow: FlexGridRow = {
          cells: [],
          height: 20,
          hidden: false,
          indent: 0,
          isNode: false,
          isCollapsed: false,
          level: 0,
        };

        const cellTexts = text.split('\t');
        for (let i = 0; i < cols; i++) {
          newRow.cells.push({
            text: cellTexts[i] || '',
            value: cellTexts[i] || '',
          });
        }

        const newData = [...gridData];
        if (index !== undefined && index >= 0 && index < newData.length) {
          newData.splice(index, 0, newRow);
        } else {
          newData.push(newRow);
        }
        setGridData(newData);
      },

      RemoveItem: (index: number) => {
        if (index >= 0 && index < gridData.length) {
          const newData = gridData.filter((_, i) => i !== index);
          setGridData(newData);
          if (currentRow === index) {
            setCurrentRow(Math.max(0, index - 1));
          }
        }
      },

      Clear: () => {
        setGridData([]);
        setCurrentRow(0);
        setCurrentCol(0);
        setSelectedRange({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
      },

      Sort: (col: number, order: number = 1) => {
        const cancel = false;
        onBeforeSort?.(col, order);
        if (cancel) return;

        const newData = [...gridData];
        const startIndex = fixedRows;
        const sortableData = newData.slice(startIndex);

        sortableData.sort((a, b) => {
          const aValue = a.cells[col]?.text || '';
          const bValue = b.cells[col]?.text || '';

          const column = columns[col];
          let result = 0;

          if (column?.dataType === FlexDataTypeConstants.flexDTNumber) {
            result = parseFloat(aValue) - parseFloat(bValue);
          } else if (column?.dataType === FlexDataTypeConstants.flexDTDate) {
            result = new Date(aValue).getTime() - new Date(bValue).getTime();
          } else {
            result = aValue.localeCompare(bValue);
          }

          return order > 0 ? result : -result;
        });

        // Replace sorted portion
        for (let i = 0; i < sortableData.length; i++) {
          newData[startIndex + i] = sortableData[i];
        }

        setGridData(newData);
        onAfterSort?.(col, order);
        fireEvent(name, 'AfterSort', { col, order });
      },

      CollapseRow: (row: number) => {
        if (row < 0 || row >= gridData.length) return;

        const cancel = false;
        onBeforeCollapse?.(row, cancel);
        if (cancel) return;

        const newData = [...gridData];
        const targetRow = newData[row];

        if (targetRow.isNode && !targetRow.isCollapsed) {
          targetRow.isCollapsed = true;

          // Hide children
          for (let i = row + 1; i < newData.length; i++) {
            if (newData[i].level <= targetRow.level) break;
            newData[i].hidden = true;
          }

          setGridData(newData);
          onAfterCollapse?.(row);
          fireEvent(name, 'AfterCollapse', { row });
        }
      },

      ExpandRow: (row: number) => {
        if (row < 0 || row >= gridData.length) return;

        const cancel = false;
        onBeforeExpand?.(row, cancel);
        if (cancel) return;

        const newData = [...gridData];
        const targetRow = newData[row];

        if (targetRow.isNode && targetRow.isCollapsed) {
          targetRow.isCollapsed = false;

          // Show direct children
          for (let i = row + 1; i < newData.length; i++) {
            const childRow = newData[i];
            if (childRow.level <= targetRow.level) break;
            if (childRow.level === targetRow.level + 1) {
              childRow.hidden = false;
            }
          }

          setGridData(newData);
          onAfterExpand?.(row);
          fireEvent(name, 'AfterExpand', { row });
        }
      },

      SetFocus: () => {
        gridRef.current?.focus();
      },

      Refresh: () => {
        if (dataSource) {
          loadDataFromSource();
        }
      },

      SaveToFile: (filename: string) => {
        // Export grid data to CSV
        const csvData = gridData
          .map(row => row.cells.map(cell => `"${cell.text}"`).join(','))
          .join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      },

      LoadFromFile: (filename: string) => {
        // Would need file input for actual implementation
      },

      AboutBox: () => {
        alert('Microsoft Hierarchical FlexGrid Control\\nVersion 6.0\\n© Microsoft Corporation');
      },
    };

    const loadDataFromSource = useCallback(() => {
      if (!dataSource) return;

      const newRows: FlexGridRow[] = [];
      const newCols: FlexGridColumn[] = [];

      // Initialize columns
      if (dataSource.fields) {
        dataSource.fields.forEach((field, index) => {
          newCols.push({
            width: 80,
            alignment: FlexAlignmentConstants.flexAlignLeftCenter,
            caption: field,
            dataType: FlexDataTypeConstants.flexDTString,
            format: '',
            hidden: false,
            sort: FlexSortConstants.flexSortGeneric,
          });
        });
      }

      // Process hierarchical recordset
      if (dataSource.hierarchicalRecordset) {
        processHierarchicalData(dataSource.hierarchicalRecordset, newRows, 0);
      } else if (dataSource.recordset?.records) {
        // Flat data
        dataSource.recordset.records.forEach((record: any) => {
          const row: FlexGridRow = {
            cells: [],
            height: 20,
            hidden: false,
            indent: 0,
            isNode: false,
            isCollapsed: false,
            level: 0,
            data: record,
          };

          dataSource.fields?.forEach(field => {
            row.cells.push({
              text: record[field]?.toString() || '',
              value: record[field],
            });
          });

          newRows.push(row);
        });
      }

      setColumns(newCols);
      setGridData(newRows);
    }, [dataSource]);

    const processHierarchicalData = (data: any[], rows: FlexGridRow[], level: number) => {
      data.forEach(item => {
        const row: FlexGridRow = {
          cells: [],
          height: 20,
          hidden: false,
          indent: level * indentWidth,
          isNode: !!(item.children && item.children.length > 0),
          isCollapsed: false,
          level,
          data: item,
          children: item.children,
        };

        // Populate cells based on available fields
        if (dataSource?.fields) {
          dataSource.fields.forEach(field => {
            row.cells.push({
              text: item[field]?.toString() || '',
              value: item[field],
            });
          });
        }

        rows.push(row);

        // Process children recursively
        if (item.children && item.children.length > 0) {
          processHierarchicalData(item.children, rows, level + 1);
        }
      });
    };

    const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
      if (!enabled) return;

      // Handle node expansion/collapse
      if (col === 0 && outlining && gridData[row]?.isNode) {
        const clickX = e.nativeEvent.offsetX;
        const nodeIconX = gridData[row].indent + 5;

        if (clickX >= nodeIconX && clickX <= nodeIconX + 10) {
          if (gridData[row].isCollapsed) {
            vb6Methods.ExpandRow(row);
          } else {
            vb6Methods.CollapseRow(row);
          }
          return;
        }
      }

      const lastRow = currentRow;
      const lastCol = currentCol;

      setCurrentRow(row);
      setCurrentCol(col);

      if (selectionMode === FlexSelectionModeConstants.flexSelectionByRow) {
        setSelectedRange({ startRow: row, startCol: 0, endRow: row, endCol: cols - 1 });
      } else if (selectionMode === FlexSelectionModeConstants.flexSelectionByColumn) {
        setSelectedRange({ startRow: 0, startCol: col, endRow: rows - 1, endCol: col });
      } else {
        setSelectedRange({ startRow: row, startCol: col, endRow: row, endCol: col });
      }

      onRowColChange?.(lastRow, lastCol);
      fireEvent(name, 'RowColChange', { lastRow, lastCol });

      onSelChange?.();
      fireEvent(name, 'SelChange', {});
    };

    const handleCellDoubleClick = (row: number, col: number) => {
      if (!enabled || !editable || row < fixedRows || col < fixedCols) return;

      const cancel = false;
      onBeforeEdit?.(row, col, cancel);
      if (cancel) return;

      setIsEditing(true);
      setEditValue(gridData[row]?.cells[col]?.text || '');

      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 0);
    };

    const handleEditComplete = () => {
      if (!isEditing) return;

      const newData = [...gridData];
      if (newData[currentRow] && newData[currentRow].cells[currentCol]) {
        newData[currentRow].cells[currentCol].text = editValue;
        newData[currentRow].cells[currentCol].value = editValue;
        setGridData(newData);
      }

      setIsEditing(false);
      setEditValue('');

      onAfterEdit?.(currentRow, currentCol);
      onCellChanged?.(currentRow, currentCol);
      fireEvent(name, 'AfterEdit', { row: currentRow, col: currentCol });
      fireEvent(name, 'CellChanged', { row: currentRow, col: currentCol });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!enabled) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentRow > 0) {
            setCurrentRow(currentRow - 1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentRow < gridData.length - 1) {
            setCurrentRow(currentRow + 1);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentCol > 0) {
            setCurrentCol(currentCol - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentCol < cols - 1) {
            setCurrentCol(currentCol + 1);
          }
          break;
        case 'Enter':
          if (isEditing) {
            handleEditComplete();
          } else if (editable) {
            handleCellDoubleClick(currentRow, currentCol);
          }
          break;
        case 'Escape':
          if (isEditing) {
            setIsEditing(false);
            setEditValue('');
          }
          break;
        case 'F2':
          if (!isEditing && editable) {
            handleCellDoubleClick(currentRow, currentCol);
          }
          break;
      }
    };

    const renderCell = (row: number, col: number, rowData: FlexGridRow) => {
      const cell = rowData.cells[col];
      const isFixed = row < fixedRows || col < fixedCols;
      const isSelected =
        row >= selectedRange.startRow &&
        row <= selectedRange.endRow &&
        col >= selectedRange.startCol &&
        col <= selectedRange.endCol;
      const isCurrent = row === currentRow && col === currentCol;

      let backgroundColor = cellBackColor;
      let foregroundColor = cellForeColor;

      if (isFixed) {
        backgroundColor = backColorFixed;
        foregroundColor = foreColorFixed;
      } else if (isSelected) {
        backgroundColor = backColorSel;
        foregroundColor = foreColorSel;
      }

      const cellWidth = columnWidths[col] || 80;
      const cellHeight = rowData.height;

      return (
        <div
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: columnWidths.slice(0, col).reduce((sum, w) => sum + w, 0),
            top: rowHeights.slice(0, row).reduce((sum, h) => sum + h, 0),
            width: cellWidth,
            height: cellHeight,
            backgroundColor,
            color: foregroundColor,
            border: gridLines ? `${gridLineWidth}px solid #C0C0C0` : 'none',
            borderRight: col === cols - 1 ? 'none' : undefined,
            borderBottom: row === gridData.length - 1 ? 'none' : undefined,
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '8pt',
            fontFamily: 'MS Sans Serif',
            cursor: enabled ? 'cell' : 'default',
            outline:
              isCurrent && focusRect !== FlexFocusRectConstants.flexFocusNone
                ? `${focusRect === FlexFocusRectConstants.flexFocusHeavy ? 2 : 1}px solid #000000`
                : 'none',
            overflow: 'hidden',
            whiteSpace: wordWrap ? 'normal' : 'nowrap',
          }}
          onClick={e => handleCellClick(row, col, e)}
          onDoubleClick={() => handleCellDoubleClick(row, col)}
        >
          {/* Hierarchy indicators */}
          {col === 0 && outlining && (
            <div style={{ marginLeft: rowData.indent, marginRight: '4px' }}>
              {rowData.isNode && (
                <span style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {rowData.isCollapsed ? '►' : '▼'}
                </span>
              )}
            </div>
          )}

          {/* Cell content */}
          {isEditing && row === currentRow && col === currentCol ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={e => {
                if (e.key === 'Enter') handleEditComplete();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditValue('');
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'inherit',
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cell?.text || ''}
            </span>
          )}
        </div>
      );
    };

    // Initialize default data
    useEffect(() => {
      if (gridData.length === 0 && !dataSource) {
        const initialData: FlexGridRow[] = [];
        const initialCols: FlexGridColumn[] = [];

        // Create default columns
        for (let c = 0; c < cols; c++) {
          initialCols.push({
            width: 80,
            alignment: FlexAlignmentConstants.flexAlignLeftCenter,
            caption: c < fixedRows ? `Col ${c}` : '',
            dataType: FlexDataTypeConstants.flexDTString,
            format: '',
            hidden: false,
            sort: FlexSortConstants.flexSortGeneric,
          });
        }

        // Create default rows
        for (let r = 0; r < rows; r++) {
          const row: FlexGridRow = {
            cells: [],
            height: 20,
            hidden: false,
            indent: 0,
            isNode: false,
            isCollapsed: false,
            level: 0,
          };

          for (let c = 0; c < cols; c++) {
            row.cells.push({
              text: r < fixedRows ? (c < fixedCols ? '' : initialCols[c].caption) : '',
              value: '',
            });
          }

          initialData.push(row);
        }

        setColumns(initialCols);
        setGridData(initialData);
      }
    }, [rows, cols, fixedRows, fixedCols, gridData.length, dataSource]);

    // Initialize column widths and row heights
    useEffect(() => {
      setColumnWidths(Array(cols).fill(80));
      setRowHeights(Array(rows).fill(20));
    }, [cols, rows]);

    // Load data from source
    useEffect(() => {
      if (dataSource) {
        loadDataFromSource();
      }
    }, [dataSource, loadDataFromSource]);

    // Update control properties
    useEffect(() => {
      updateControl(id, 'Row', currentRow);
      updateControl(id, 'Col', currentCol);
      updateControl(id, 'Rows', gridData.length);
      updateControl(id, 'Cols', cols);
      updateControl(id, 'Text', gridData[currentRow]?.cells[currentCol]?.text || '');
    }, [id, currentRow, currentCol, gridData, cols, updateControl]);

    // Register VB6 methods
    useEffect(() => {
      updateControl(id, 'vb6Methods', vb6Methods);
    }, [id, updateControl, vb6Methods]);

    if (!visible) return null;

    const visibleRows = gridData.filter(row => !row.hidden);
    const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);

    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          border: '2px inset #C0C0C0',
          backgroundColor: backColorBkg,
          overflow: 'hidden',
          opacity: enabled ? 1 : 0.5,
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div
          ref={gridRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: scrollBars ? 'auto' : 'hidden',
          }}
          onScroll={e => {
            setScrollTop(e.currentTarget.scrollTop);
            setScrollLeft(e.currentTarget.scrollLeft);
            onScroll?.();
            fireEvent(name, 'Scroll', {});
          }}
        >
          <div
            style={{
              position: 'relative',
              width: Math.max(totalWidth, width as number),
              height: Math.max(totalHeight, height as number),
            }}
          >
            {visibleRows.map((rowData, rowIndex) =>
              Array.from({ length: cols }, (_, colIndex) => renderCell(rowIndex, colIndex, rowData))
            )}
          </div>
        </div>
      </div>
    );
  }
);

HierarchicalFlexGridControl.displayName = 'HierarchicalFlexGridControl';

export default HierarchicalFlexGridControl;
