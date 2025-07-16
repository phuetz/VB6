/**
 * Contrôles d'accès aux données VB6 complets
 * Support ADO, DAO, RDO et contrôles liés aux données
 */

import React, { useState, useEffect, useCallback, forwardRef, useRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';

// Interface pour les connexions de base de données
interface DatabaseConnection {
  type: 'ADO' | 'DAO' | 'RDO';
  connectionString: string;
  database?: any;
  recordset?: any;
  isConnected: boolean;
  error?: string;
}

// ADO Data Control (ADODC) - Compatible 100% VB6
export const ADODCEnhanced = forwardRef<HTMLDivElement, VB6ControlPropsEnhanced>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    caption = 'ADODC1',
    connectionString = '',
    recordSource = '',
    commandType = 8, // 1=adCmdText, 2=adCmdTable, 4=adCmdStoredProc, 8=adCmdUnknown
    cursorLocation = 3, // 2=adUseServer, 3=adUseClient
    cursorType = 1, // 0=adOpenForwardOnly, 1=adOpenKeyset, 2=adOpenDynamic, 3=adOpenStatic
    lockType = 3, // 1=adLockReadOnly, 2=adLockPessimistic, 3=adLockOptimistic, 4=adLockBatchOptimistic
    maxRecords = 0,
    mode = 0, // 0=adModeUnknown, 1=adModeRead, 2=adModeWrite, 3=adModeReadWrite
    orientation = 0, // 0=adHorizontal, 1=adVertical
    password = '',
    userName = '',
    bofAction = 0, // 0=adDoMoveFirst, 1=adStayBOF
    eofAction = 0, // 0=adDoMoveLast, 1=adStayEOF, 2=adDoAddNew
    backColor = '#8080FF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false },
    appearance = 1, // 0=ad2D, 1=ad3D
    recordset = null,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  const [connection, setConnection] = useState<DatabaseConnection>({
    type: 'ADO',
    connectionString,
    isConnected: false,
  });
  
  const [currentRecord, setCurrentRecord] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [isAtBOF, setIsAtBOF] = useState(true);
  const [isAtEOF, setIsAtEOF] = useState(true);
  const [editMode, setEditMode] = useState(0); // 0=None, 1=Edit, 2=AddNew
  
  const { fireEvent, updateControl } = useVB6Store();

  // Define connectToDatabase before useEffect
  const connectToDatabase = useCallback(async () => {
    try {
      // Simuler la connexion ADO
      const response = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADO',
          connectionString,
          recordSource,
          commandType,
          userName,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConnection({
          ...connection,
          isConnected: true,
          recordset: data.recordset,
        });
        setRecordCount(data.recordCount || 0);
        fireEvent(name, 'WillConnect', { connectionString });
        fireEvent(name, 'ConnectComplete', { error: null });
      }
    } catch (error) {
      setConnection({
        ...connection,
        isConnected: false,
        error: error.toString(),
      });
      fireEvent(name, 'ConnectComplete', { error });
    }
  }, [connectionString, recordSource, commandType, userName, password, connection, name, fireEvent]);

  // Connexion à la base de données
  useEffect(() => {
    if (connectionString && recordSource) {
      connectToDatabase();
    }
  }, [connectionString, recordSource, connectToDatabase]);


  // Navigation dans les enregistrements
  const moveFirst = useCallback(() => {
    if (connection.isConnected && recordCount > 0) {
      setCurrentRecord(0);
      setIsAtBOF(true);
      setIsAtEOF(false);
      fireEvent(name, 'MoveComplete', { adReason: 'adRsnMoveFirst' });
    }
  }, [connection.isConnected, recordCount, fireEvent, name]);

  const movePrevious = useCallback(() => {
    if (connection.isConnected && currentRecord > 0) {
      setCurrentRecord(currentRecord - 1);
      setIsAtBOF(currentRecord - 1 === 0);
      setIsAtEOF(false);
      fireEvent(name, 'MoveComplete', { adReason: 'adRsnMovePrevious' });
    } else if (bofAction === 0) {
      moveFirst();
    }
  }, [connection.isConnected, currentRecord, bofAction, fireEvent, name, moveFirst]);

  const moveNext = useCallback(() => {
    if (connection.isConnected && currentRecord < recordCount - 1) {
      setCurrentRecord(currentRecord + 1);
      setIsAtBOF(false);
      setIsAtEOF(currentRecord + 1 === recordCount - 1);
      fireEvent(name, 'MoveComplete', { adReason: 'adRsnMoveNext' });
    } else if (eofAction === 0) {
      moveLast();
    } else if (eofAction === 2) {
      addNew();
    }
  }, [connection.isConnected, currentRecord, recordCount, eofAction, fireEvent, name, moveLast, addNew]);

  const moveLast = useCallback(() => {
    if (connection.isConnected && recordCount > 0) {
      setCurrentRecord(recordCount - 1);
      setIsAtBOF(false);
      setIsAtEOF(true);
      fireEvent(name, 'MoveComplete', { adReason: 'adRsnMoveLast' });
    }
  }, [connection.isConnected, recordCount, fireEvent, name]);

  const addNew = useCallback(() => {
    if (connection.isConnected) {
      setEditMode(2);
      fireEvent(name, 'WillChangeRecord', { adReason: 'adRsnAddNew' });
    }
  }, [connection.isConnected, fireEvent, name]);

  const update = useCallback(() => {
    if (connection.isConnected && editMode > 0) {
      fireEvent(name, 'RecordChangeComplete', { adReason: editMode === 2 ? 'adRsnAddNew' : 'adRsnUpdate' });
      setEditMode(0);
    }
  }, [connection.isConnected, editMode, fireEvent, name]);

  const cancelUpdate = useCallback(() => {
    if (connection.isConnected && editMode > 0) {
      setEditMode(0);
      fireEvent(name, 'RecordChangeComplete', { adReason: 'adRsnUndoUpdate' });
    }
  }, [connection.isConnected, editMode, fireEvent, name]);

  const deleteRecord = useCallback(() => {
    if (connection.isConnected && recordCount > 0) {
      fireEvent(name, 'WillChangeRecord', { adReason: 'adRsnDelete' });
      // Simuler la suppression
      setRecordCount(recordCount - 1);
      if (currentRecord >= recordCount - 1) {
        movePrevious();
      }
      fireEvent(name, 'RecordChangeComplete', { adReason: 'adRsnDelete' });
    }
  }, [connection.isConnected, recordCount, currentRecord, fireEvent, name, movePrevious]);

  const refresh = useCallback(() => {
    if (connectionString && recordSource) {
      connectToDatabase();
      fireEvent(name, 'Requery', {});
    }
  }, [connectionString, recordSource, fireEvent, name, connectToDatabase]);

  const controlStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height: orientation === 0 ? 32 : height,
    display: visible ? 'flex' : 'none',
    flexDirection: orientation === 0 ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: backColor,
    color: foreColor,
    border: appearance === 1 ? '2px inset #C0C0C0' : '1px solid #808080',
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    padding: '2px',
    userSelect: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: orientation === 0 ? 24 : '100%',
    height: orientation === 0 ? '100%' : 24,
    minWidth: 24,
    minHeight: 24,
    border: '1px outset #C0C0C0',
    backgroundColor: '#C0C0C0',
    cursor: enabled ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    userSelect: 'none',
  };

  const captionStyle: React.CSSProperties = {
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 4px',
  };

  return (
    <div
      ref={ref}
      style={controlStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <button
        style={buttonStyle}
        onClick={moveFirst}
        disabled={!enabled || !connection.isConnected || isAtBOF}
        title="First Record"
      >
        |◀
      </button>
      <button
        style={buttonStyle}
        onClick={movePrevious}
        disabled={!enabled || !connection.isConnected || isAtBOF}
        title="Previous Record"
      >
        ◀
      </button>
      <div style={captionStyle}>
        {caption || `Record ${currentRecord + 1} of ${recordCount}`}
      </div>
      <button
        style={buttonStyle}
        onClick={moveNext}
        disabled={!enabled || !connection.isConnected || isAtEOF}
        title="Next Record"
      >
        ▶
      </button>
      <button
        style={buttonStyle}
        onClick={moveLast}
        disabled={!enabled || !connection.isConnected || isAtEOF}
        title="Last Record"
      >
        ▶|
      </button>
    </div>
  );
});

// Data Control (DAO) - Compatible 100% VB6
export const DataControlEnhanced = forwardRef<HTMLDivElement, VB6ControlPropsEnhanced>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    caption = 'Data1',
    databaseName = '',
    recordSource = '',
    recordsetType = 1, // 0=Table, 1=Dynaset, 2=Snapshot
    defaultType = 2, // 1=UseJet, 2=UseODBC
    defaultCursorType = 0, // 0=DefaultCursor, 1=ODBCCursor, 2=ServerCursor
    exclusive = false,
    readOnly = false,
    connect = '',
    options = 0,
    bofAction = 0, // 0=MoveFirst, 1=BOF
    eofAction = 0, // 0=MoveLast, 1=EOF, 2=AddNew
    backColor = '#8080FF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false },
    appearance = 1, // 0=Flat, 1=3D
    recordset: initialRecordset = null,
    database = null,
    editMode = 0, // 0=None, 1=Edit, 2=AddNew
    hWnd = 0,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  const [connection, setConnection] = useState<DatabaseConnection>({
    type: 'DAO',
    connectionString: connect || databaseName,
    database,
    recordset: initialRecordset,
    isConnected: false,
  });

  const [currentPosition, setCurrentPosition] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [isAtBOF, setIsAtBOF] = useState(true);
  const [isAtEOF, setIsAtEOF] = useState(true);
  const [currentEditMode, setCurrentEditMode] = useState(editMode);

  const { fireEvent, updateControl } = useVB6Store();

  // Ouvrir la base de données
  useEffect(() => {
    if (databaseName && recordSource) {
      openDatabase();
    }
  }, [databaseName, recordSource, connect]);

  const openDatabase = async () => {
    try {
      fireEvent(name, 'Validate', { action: 'OpenDatabase' });
      
      const response = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DAO',
          databaseName,
          recordSource,
          recordsetType,
          connect,
          exclusive,
          readOnly,
          options,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConnection({
          ...connection,
          isConnected: true,
          database: data.database,
          recordset: data.recordset,
        });
        setRecordCount(data.recordCount || 0);
        updateControl(id, 'recordset', data.recordset);
        updateControl(id, 'database', data.database);
        fireEvent(name, 'Reposition', {});
      }
    } catch (error) {
      fireEvent(name, 'Error', { error });
    }
  };

  // Navigation
  const moveFirst = useCallback(() => {
    if (connection.isConnected && recordCount > 0) {
      setCurrentPosition(0);
      setIsAtBOF(true);
      setIsAtEOF(false);
      fireEvent(name, 'Reposition', {});
    }
  }, [connection.isConnected, recordCount, fireEvent, name]);

  const movePrevious = useCallback(() => {
    if (connection.isConnected && currentPosition > 0) {
      setCurrentPosition(currentPosition - 1);
      setIsAtBOF(currentPosition - 1 === 0);
      setIsAtEOF(false);
      fireEvent(name, 'Reposition', {});
    } else if (bofAction === 0) {
      moveFirst();
    }
  }, [connection.isConnected, currentPosition, bofAction, fireEvent, name, moveFirst]);

  const moveNext = useCallback(() => {
    if (connection.isConnected && currentPosition < recordCount - 1) {
      setCurrentPosition(currentPosition + 1);
      setIsAtBOF(false);
      setIsAtEOF(currentPosition + 1 === recordCount - 1);
      fireEvent(name, 'Reposition', {});
    } else if (eofAction === 0) {
      moveLast();
    } else if (eofAction === 2) {
      addNew();
    }
  }, [connection.isConnected, currentPosition, recordCount, eofAction, fireEvent, name, moveLast, addNew]);

  const moveLast = useCallback(() => {
    if (connection.isConnected && recordCount > 0) {
      setCurrentPosition(recordCount - 1);
      setIsAtBOF(false);
      setIsAtEOF(true);
      fireEvent(name, 'Reposition', {});
    }
  }, [connection.isConnected, recordCount, fireEvent, name]);

  const addNew = useCallback(() => {
    if (connection.isConnected && !readOnly) {
      setCurrentEditMode(2);
      updateControl(id, 'editMode', 2);
      fireEvent(name, 'Validate', { action: 'AddNew' });
    }
  }, [connection.isConnected, readOnly, id, fireEvent, name, updateControl]);

  const controlStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height: 32,
    display: visible ? 'flex' : 'none',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: backColor,
    color: foreColor,
    border: appearance === 1 ? '2px inset #C0C0C0' : '1px solid #808080',
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    padding: '2px',
    userSelect: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    border: '1px outset #C0C0C0',
    backgroundColor: '#C0C0C0',
    cursor: enabled ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    userSelect: 'none',
  };

  const captionStyle: React.CSSProperties = {
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 4px',
  };

  return (
    <div
      ref={ref}
      style={controlStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <button
        style={buttonStyle}
        onClick={moveFirst}
        disabled={!enabled || !connection.isConnected || isAtBOF}
        title="First Record"
      >
        |◀
      </button>
      <button
        style={buttonStyle}
        onClick={movePrevious}
        disabled={!enabled || !connection.isConnected || isAtBOF}
        title="Previous Record"
      >
        ◀
      </button>
      <div style={captionStyle}>
        {caption}
      </div>
      <button
        style={buttonStyle}
        onClick={moveNext}
        disabled={!enabled || !connection.isConnected || isAtEOF}
        title="Next Record"
      >
        ▶
      </button>
      <button
        style={buttonStyle}
        onClick={moveLast}
        disabled={!enabled || !connection.isConnected || isAtEOF}
        title="Last Record"
      >
        ▶|
      </button>
    </div>
  );
});

// DataCombo - Compatible 100% VB6
export const DataComboEnhanced = forwardRef<HTMLSelectElement, VB6ControlPropsEnhanced>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    boundColumn = '',
    boundText = '',
    dataBindings = null,
    dataField = '',
    dataMember = '',
    dataSource = null,
    integralHeight = false,
    listField = '',
    locked = false,
    matchEntry = 2, // 0=dblBasicMatching, 1=dblExtendedMatching, 2=dblNoMatching
    matchedWithList = false,
    rightToLeft = false,
    rowMember = '',
    rowSource = null,
    selectedItem = null,
    selLength = 0,
    selStart = 0,
    selText = '',
    style = 0, // 0=dbcDropdownCombo, 2=dbcDropdownList
    text = '',
    visibleCount = 8,
    visibleItems = null,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false },
    appearance = 1, // 0=dbc2D, 1=dbc3D
    hWnd = 0,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  const [items, setItems] = useState<any[]>([]);
  const [value, setValue] = useState(text);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDroppedDown, setIsDroppedDown] = useState(false);
  const { fireEvent, updateControl } = useVB6Store();

  // Charger les données depuis la source
  useEffect(() => {
    if (rowSource && listField) {
      loadData();
    }
  }, [rowSource, rowMember, listField]);

  const loadData = async () => {
    try {
      // Simuler le chargement des données
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: rowSource,
          member: rowMember,
          field: listField,
          boundColumn,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        fireEvent(name, 'RowSourceChanged', {});
      }
    } catch (error) {
      fireEvent(name, 'Error', { error });
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const index = items.findIndex(item => item[listField] === newValue);
    
    setValue(newValue);
    setSelectedIndex(index);
    updateControl(id, 'text', newValue);
    updateControl(id, 'boundText', index >= 0 ? items[index][boundColumn] : '');
    updateControl(id, 'selectedItem', index >= 0 ? items[index] : null);
    
    fireEvent(name, 'Change', {});
    fireEvent(name, 'Click', {});
    
    if (dataField && dataSource) {
      updateControl(id, 'dataChanged', true);
    }
  }, [items, listField, boundColumn, id, name, fireEvent, updateControl, dataField, dataSource]);

  const handleDropDown = useCallback(() => {
    setIsDroppedDown(true);
    fireEvent(name, 'DropDown', {});
  }, [fireEvent, name]);

  const comboStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height: integralHeight ? Math.floor(height / 16) * 16 : height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: appearance === 1 ? '2px inset #C0C0C0' : '1px solid #808080',
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    outline: 'none',
    cursor: enabled ? 'pointer' : 'default',
    direction: rightToLeft ? 'rtl' : 'ltr',
  };

  return (
    <select
      ref={ref}
      style={comboStyle}
      value={value}
      onChange={handleChange}
      onMouseDown={handleDropDown}
      disabled={!enabled || locked}
      size={isDroppedDown ? Math.min(visibleCount, items.length) : undefined}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {style === 0 && <option value="">{text}</option>}
      {items.map((item, index) => (
        <option key={index} value={item[listField] || ''}>
          {item[listField] || ''}
        </option>
      ))}
    </select>
  );
});

// DataList - Compatible 100% VB6
export const DataListEnhanced = forwardRef<HTMLSelectElement, VB6ControlPropsEnhanced>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    boundColumn = '',
    boundText = '',
    dataBindings = null,
    dataField = '',
    dataMember = '',
    dataSource = null,
    integralHeight = false,
    listField = '',
    locked = false,
    matchEntry = 2, // 0=dblBasicMatching, 1=dblExtendedMatching, 2=dblNoMatching
    matchedWithList = false,
    rightToLeft = false,
    rowMember = '',
    rowSource = null,
    selectedItem = null,
    text = '',
    visibleCount = 8,
    visibleItems = null,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false, strikethrough: false },
    appearance = 1, // 0=dbl2D, 1=dbl3D
    hWnd = 0,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  const [items, setItems] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [matchText, setMatchText] = useState('');
  const { fireEvent, updateControl } = useVB6Store();

  // Charger les données
  useEffect(() => {
    if (rowSource && listField) {
      loadData();
    }
  }, [rowSource, rowMember, listField]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: rowSource,
          member: rowMember,
          field: listField,
          boundColumn,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        fireEvent(name, 'RowSourceChanged', {});
      }
    } catch (error) {
      fireEvent(name, 'Error', { error });
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value);
    
    if (index >= 0 && index < items.length) {
      setSelectedIndex(index);
      updateControl(id, 'text', items[index][listField] || '');
      updateControl(id, 'boundText', items[index][boundColumn] || '');
      updateControl(id, 'selectedItem', items[index]);
      
      fireEvent(name, 'Click', {});
      
      if (dataField && dataSource) {
        updateControl(id, 'dataChanged', true);
      }
    }
  }, [items, listField, boundColumn, id, name, fireEvent, updateControl, dataField, dataSource]);

  // Gestion du matching
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (matchEntry === 2) return; // No matching
    
    const char = e.key.toLowerCase();
    const newMatchText = matchEntry === 1 ? matchText + char : char;
    setMatchText(newMatchText);
    
    // Rechercher un élément correspondant
    const matchIndex = items.findIndex(item => 
      (item[listField] || '').toLowerCase().startsWith(newMatchText)
    );
    
    if (matchIndex >= 0) {
      setSelectedIndex(matchIndex);
      e.currentTarget.value = matchIndex.toString();
      handleChange({ target: { value: matchIndex.toString() } } as any);
    }
    
    // Réinitialiser le matchText après un délai
    if (matchEntry === 1) {
      setTimeout(() => setMatchText(''), 1000);
    }
  }, [matchEntry, matchText, items, listField, handleChange]);

  const listStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height: integralHeight ? Math.floor(height / 16) * 16 : height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: appearance === 1 ? '2px inset #C0C0C0' : '1px solid #808080',
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    outline: 'none',
    cursor: enabled ? 'pointer' : 'default',
    direction: rightToLeft ? 'rtl' : 'ltr',
  };

  return (
    <select
      ref={ref}
      style={listStyle}
      value={selectedIndex}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      disabled={!enabled || locked}
      size={Math.min(visibleCount, Math.floor(height / 16))}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {items.map((item, index) => (
        <option key={index} value={index}>
          {item[listField] || ''}
        </option>
      ))}
    </select>
  );
});

// Export des contrôles d'accès aux données
export default {
  ADODC: ADODCEnhanced,
  DataControl: DataControlEnhanced,
  DataCombo: DataComboEnhanced,
  DataList: DataListEnhanced,
};