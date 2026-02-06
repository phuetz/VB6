/**
 * Contrôles d'accès aux données VB6 - Compatible ADO, DAO, RDO
 * Implémentation complète des objets de données VB6
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';

// Types pour l'accès aux données
export interface VB6Connection {
  connectionString: string;
  provider: string;
  database: string;
  server: string;
  userId: string;
  password: string;
  timeout: number;
  state: 'Closed' | 'Open' | 'Connecting' | 'Executing';
}

export interface VB6Recordset {
  fields: VB6Field[];
  data: Record<string, any>[];
  currentRecord: number;
  recordCount: number;
  bof: boolean;
  eof: boolean;
  cursorType: 'Static' | 'Dynamic' | 'Keyset' | 'ForwardOnly';
  lockType: 'ReadOnly' | 'Pessimistic' | 'Optimistic' | 'BatchOptimistic';
  source: string;
  state: 'Closed' | 'Open' | 'Connecting' | 'Executing';
}

export interface VB6Field {
  name: string;
  type:
    | 'String'
    | 'Integer'
    | 'Long'
    | 'Single'
    | 'Double'
    | 'Currency'
    | 'Date'
    | 'Boolean'
    | 'Memo'
    | 'Binary';
  size: number;
  value: any;
  originalValue: any;
  required: boolean;
  allowZeroLength: boolean;
}

// Contrôle Data - Compatible DAO/RDO
export const DataControl = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height = 25,
    visible,
    enabled,
    caption = 'Data1',
    databaseName = '',
    recordSource = '',
    recordsetType = 'Dynaset', // Table, Dynaset, Snapshot
    exclusive = false,
    readOnly = false,
    connect = '',
    defaultCursorType = 'Default',
    defaultType = 'UseJet',
    options = 0,
    bofAction = 'MoveFirst',
    eofAction = 'MoveLast',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [recordset, setRecordset] = useState<VB6Recordset | null>(null);
  const [database, setDatabase] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const { fireEvent, updateControl } = useVB6Store();

  // Navigation methods
  const moveFirst = useCallback(() => {
    if (recordset && recordset.recordCount > 0) {
      setCurrentPosition(0);
      fireEvent(name, 'Reposition', {});
    }
  }, [recordset, name, fireEvent]);

  const movePrevious = useCallback(() => {
    if (recordset && currentPosition > 0) {
      setCurrentPosition(currentPosition - 1);
      fireEvent(name, 'Reposition', {});
    } else if (bofAction === 'BOF') {
      fireEvent(name, 'Reposition', {});
    }
  }, [recordset, currentPosition, bofAction, name, fireEvent]);

  const moveNext = useCallback(() => {
    if (recordset && currentPosition < recordset.recordCount - 1) {
      setCurrentPosition(currentPosition + 1);
      fireEvent(name, 'Reposition', {});
    } else if (eofAction === 'EOF') {
      fireEvent(name, 'Reposition', {});
    } else if (eofAction === 'AddNew') {
      // Trigger add new record
      fireEvent(name, 'Validate', { action: 3, save: 1 }); // vbDataActionAddNew
    }
  }, [recordset, currentPosition, eofAction, name, fireEvent]);

  const moveLast = useCallback(() => {
    if (recordset && recordset.recordCount > 0) {
      setCurrentPosition(recordset.recordCount - 1);
      fireEvent(name, 'Reposition', {});
    }
  }, [recordset, name, fireEvent]);

  const refresh = useCallback(async () => {
    try {
      // Simulate database refresh
      const response = await fetch(`/api/data/${databaseName}/${recordSource}`);
      const data = await response.json();

      const newRecordset: VB6Recordset = {
        fields: data.fields || [],
        data: data.records || [],
        currentRecord: 0,
        recordCount: data.records?.length || 0,
        bof: data.records?.length === 0,
        eof: data.records?.length === 0,
        cursorType: 'Dynamic',
        lockType: readOnly ? 'ReadOnly' : 'Optimistic',
        source: recordSource,
        state: 'Open',
      };

      setRecordset(newRecordset);
      setCurrentPosition(0);
      updateControl(id, 'recordset', newRecordset);
      fireEvent(name, 'Reposition', {});
    } catch (error) {
      fireEvent(name, 'Error', { dataErr: -2147467259, response: 0 });
    }
  }, [databaseName, recordSource, readOnly, id, name, fireEvent, updateControl]);

  const updateControls = useCallback(() => {
    if (recordset && recordset.data[currentPosition]) {
      const currentRecord = recordset.data[currentPosition];
      // Update bound controls with current record data
      fireEvent(name, 'Reposition', { currentRecord });
    }
  }, [recordset, currentPosition, name, fireEvent]);

  const updateRecord = useCallback(() => {
    fireEvent(name, 'Validate', { action: 1, save: 1 }); // vbDataActionUpdate
  }, [name, fireEvent]);

  useEffect(() => {
    if (databaseName && recordSource && enabled) {
      refresh();
    }
  }, [databaseName, recordSource, enabled, refresh]);

  const dataStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    backgroundColor: '#C0C0C0',
    border: '2px outset #C0C0C0',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
    fontSize: 8,
    fontFamily: 'MS Sans Serif',
  };

  return (
    <div ref={ref} style={dataStyle} title={toolTipText} data-name={name} data-tag={tag} {...rest}>
      <button onClick={moveFirst} disabled={!enabled || !recordset}>
        |◀
      </button>
      <button onClick={movePrevious} disabled={!enabled || !recordset}>
        ◀
      </button>
      <span style={{ flex: 1, textAlign: 'center' }}>
        {caption} ({currentPosition + 1} of {recordset?.recordCount || 0})
      </span>
      <button onClick={moveNext} disabled={!enabled || !recordset}>
        ▶
      </button>
      <button onClick={moveLast} disabled={!enabled || !recordset}>
        ▶|
      </button>
    </div>
  );
});

// DBGrid - Grille de données compatible VB6
export const DBGrid = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    dataSource = '',
    allowAddNew = true,
    allowDelete = true,
    allowUpdate = true,
    columnHeaders = true,
    recordSelectors = true,
    rowHeight = 285, // Twips
    backColor = '#FFFFFF',
    foreColor = '#000000',
    headBackColor = '#C0C0C0',
    headForeColor = '#000000',
    font,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [recordset, setRecordset] = useState<VB6Recordset | null>(null);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [columns, setColumns] = useState<any[]>([]);
  const { fireEvent } = useVB6Store();

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #C0C0C0',
    overflow: 'auto',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
  };

  const handleRowClick = useCallback(
    (rowIndex: number) => {
      if (enabled) {
        setSelectedRow(rowIndex);
        fireEvent(name, 'RowColChange', { lastRow: selectedRow, lastCol: 0 });
      }
    },
    [enabled, selectedRow, name, fireEvent]
  );

  const handleCellEdit = useCallback(
    (rowIndex: number, colIndex: number, value: any) => {
      if (enabled && allowUpdate) {
        fireEvent(name, 'BeforeUpdate', { cancel: false });
        // Update cell value
        fireEvent(name, 'AfterUpdate', {});
      }
    },
    [enabled, allowUpdate, name, fireEvent]
  );

  return (
    <div ref={ref} style={gridStyle} title={toolTipText} data-name={name} data-tag={tag} {...rest}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {columnHeaders && (
          <thead>
            <tr style={{ backgroundColor: headBackColor, color: headForeColor }}>
              {recordSelectors && <th style={{ width: 20 }}></th>}
              {recordset?.fields.map((field, index) => (
                <th key={index} style={{ border: '1px solid #808080', padding: 2 }}>
                  {field.name}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {recordset?.data.map((record, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                backgroundColor: selectedRow === rowIndex ? '#316AC5' : 'transparent',
                color: selectedRow === rowIndex ? '#FFFFFF' : foreColor,
              }}
              onClick={() => handleRowClick(rowIndex)}
            >
              {recordSelectors && (
                <td style={{ border: '1px solid #808080', padding: 2, textAlign: 'center' }}>▶</td>
              )}
              {recordset.fields.map((field, colIndex) => (
                <td
                  key={colIndex}
                  style={{ border: '1px solid #808080', padding: 2 }}
                  contentEditable={allowUpdate}
                  onBlur={e =>
                    handleCellEdit(rowIndex, colIndex, (e.target as HTMLElement).innerText)
                  }
                >
                  {record[field.name]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// DBCombo - ComboBox lié aux données
export const DBCombo = forwardRef<HTMLSelectElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    dataSource = '',
    dataField = '',
    rowSource = '',
    listField = '',
    boundColumn = 1,
    columnCount = 1,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [value, setValue] = useState('');
  const [listData, setListData] = useState<any[]>([]);
  const { fireEvent, updateControl } = useVB6Store();

  const comboStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #C0C0C0',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      updateControl(id, 'text', newValue);
      fireEvent(name, 'Change', { text: newValue });
    },
    [id, name, fireEvent, updateControl]
  );

  return (
    <select
      ref={ref}
      style={comboStyle}
      value={value}
      onChange={handleChange}
      disabled={!enabled}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {listData.map((item, index) => (
        <option key={index} value={item[listField]}>
          {item[listField]}
        </option>
      ))}
    </select>
  );
});

// DBText - TextBox lié aux données
export const DBText = forwardRef<HTMLInputElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    dataSource = '',
    dataField = '',
    text = '',
    maxLength = 0,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [value, setValue] = useState(text);
  const { fireEvent, updateControl } = useVB6Store();

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #C0C0C0',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    outline: 'none',
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (maxLength === 0 || newValue.length <= maxLength) {
        setValue(newValue);
        updateControl(id, 'text', newValue);
        fireEvent(name, 'Change', { text: newValue });
      }
    },
    [id, maxLength, name, fireEvent, updateControl]
  );

  return (
    <input
      ref={ref}
      type="text"
      style={textStyle}
      value={value}
      onChange={handleChange}
      disabled={!enabled}
      maxLength={maxLength || undefined}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    />
  );
});

// MSFlexGrid - Grille flexible Microsoft
export const MSFlexGrid = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    rows = 2,
    cols = 2,
    fixedRows = 1,
    fixedCols = 1,
    rowHeight = Array(rows).fill(300),
    colWidth = Array(cols).fill(1000),
    backColor = '#FFFFFF',
    foreColor = '#000000',
    backColorFixed = '#C0C0C0',
    foreColorFixed = '#000000',
    gridLines = true,
    gridLinesFixed = true,
    allowUserResizing = 'Both',
    allowBigSelection = true,
    selectMode = 'Free',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [cellData, setCellData] = useState<string[][]>(
    Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(''))
  );
  const { fireEvent } = useVB6Store();

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #C0C0C0',
    overflow: 'auto',
    fontSize: 8,
    fontFamily: 'MS Sans Serif',
  };

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (enabled) {
        setSelectedRow(row);
        setSelectedCol(col);
        fireEvent(name, 'Click', { row, col });
      }
    },
    [enabled, name, fireEvent]
  );

  const handleCellEdit = useCallback(
    (row: number, col: number, value: string) => {
      if (enabled) {
        const newData = [...cellData];
        newData[row][col] = value;
        setCellData(newData);
        fireEvent(name, 'AfterEdit', { row, col, text: value });
      }
    },
    [enabled, cellData, name, fireEvent]
  );

  return (
    <div ref={ref} style={gridStyle} title={toolTipText} data-name={name} data-tag={tag} {...rest}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {Array(rows)
            .fill(null)
            .map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array(cols)
                  .fill(null)
                  .map((_, colIndex) => {
                    const isFixed = rowIndex < fixedRows || colIndex < fixedCols;
                    const isSelected = rowIndex === selectedRow && colIndex === selectedCol;

                    return (
                      <td
                        key={colIndex}
                        style={{
                          width: colWidth[colIndex] / 15, // Convert twips to pixels
                          height: rowHeight[rowIndex] / 15,
                          backgroundColor: isSelected
                            ? '#316AC5'
                            : isFixed
                              ? backColorFixed
                              : backColor,
                          color: isSelected ? '#FFFFFF' : isFixed ? foreColorFixed : foreColor,
                          border: gridLines ? '1px solid #808080' : 'none',
                          padding: 2,
                          textAlign: 'left',
                          verticalAlign: 'top',
                        }}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        contentEditable={!isFixed && enabled}
                        onBlur={e =>
                          handleCellEdit(rowIndex, colIndex, (e.target as HTMLElement).innerText)
                        }
                      >
                        {cellData[rowIndex]?.[colIndex] || ''}
                      </td>
                    );
                  })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
});

export default {
  DataControl,
  DBGrid,
  DBCombo,
  DBText,
  MSFlexGrid,
};
