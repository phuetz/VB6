/**
 * RemoteData Control - Complete VB6 MSRDC Implementation
 * Provides data connectivity and binding for remote data sources
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// VB6 RemoteData Constants
export enum rdCursorDriverConstants {
  rdUseIfNeeded = 0,
  rdUseOdbc = 1,
  rdUseServer = 2,
  rdUseClientBatch = 3,
  rdUseNone = 4,
}

export enum rdCursorTypeConstants {
  rdOpenForwardOnly = 0,
  rdOpenKeyset = 1,
  rdOpenDynamic = 2,
  rdOpenStatic = 3,
}

export enum rdLockTypeConstants {
  rdConcurReadOnly = 1,
  rdConcurLock = 2,
  rdConcurRowVer = 3,
  rdConcurValues = 4,
  rdConcurBatch = 5,
}

export enum rdOptionConstants {
  rdAsyncEnable = 32,
  rdExecuteNoRecords = 128,
  rdExecDirect = 2048,
  rdRunAsync = 1024,
  rdCancelUpdate = 4,
}

export enum rdResultsetTypeConstants {
  rdOpenKeyset = 0,
  rdOpenDynamic = 1,
  rdOpenStatic = 2,
  rdOpenForwardOnly = 3,
}

export enum rdBookmarkTypeConstants {
  rdBookmarkNotAvailable = 0,
  rdBookmarkLong = 1,
  rdBookmarkVariant = 2,
}

export interface RDConnection {
  connectionString: string;
  dsName: string;
  userId: string;
  password: string;
  timeout: number;
  version: string;
  connect: () => Promise<void>;
  close: () => void;
  execute: (sql: string) => Promise<RDResultset>;
  beginTrans: () => void;
  commitTrans: () => void;
  rollbackTrans: () => void;
}

export interface RDResultset {
  source: string;
  sql: string;
  records: any[];
  fields: RDField[];
  currentRecord: number;
  bof: boolean;
  eof: boolean;
  recordCount: number;
  absolutePosition: number;
  bookmark: any;
  bookmarkType: rdBookmarkTypeConstants;
  editMode: number;
  lastModified: any;
  updatable: boolean;

  // Navigation methods
  moveFirst: () => void;
  moveLast: () => void;
  moveNext: () => void;
  movePrevious: () => void;
  move: (records: number, start?: any) => void;

  // Data methods
  addNew: () => void;
  update: () => void;
  delete: () => void;
  cancelUpdate: () => void;
  getRows: (numRows?: number, start?: any, fields?: string[]) => any[][];
  clone: () => RDResultset;
  requery: () => void;
  close: () => void;
}

export interface RDField {
  name: string;
  type: number;
  definedSize: number;
  actualSize: number;
  value: any;
  originalValue: any;
  underlyingValue: any;
  attributes: number;
  numericScale: number;
  precision: number;
  status: number;
}

export interface RemoteDataProps extends VB6ControlPropsEnhanced {
  // Connection properties
  connect?: string;
  dataSourceName?: string;
  environment?: any;
  loginTimeout?: number;
  password?: string;
  userName?: string;
  version?: string;

  // Cursor properties
  cursorDriver?: rdCursorDriverConstants;
  cursorType?: rdCursorTypeConstants;
  lockType?: rdLockTypeConstants;
  maxRows?: number;
  options?: number;
  queryTimeout?: number;
  resultsetType?: rdResultsetTypeConstants;

  // SQL properties
  sql?: string;
  source?: string;

  // Behavior properties
  batchCollisionCount?: number;
  batchCollisions?: any[];
  batchSize?: number;
  editMode?: number;
  keysetSize?: number;
  prepared?: boolean;
  readOnly?: boolean;
  updatable?: boolean;

  // Visual properties
  align?: number;
  appearance?: number;
  backColor?: string;
  borderStyle?: number;
  caption?: string;
  foreColor?: string;

  // Events
  onValidate?: (action: number, save: boolean) => void;
  onWillUpdateRows?: (cancel: boolean) => void;
  onRowCurrencyChange?: (cancel: boolean) => void;
  onRowStatusChange?: (rowIndex: number, status: number) => void;
  onResultsetChange?: () => void;
  onConnect?: (cancel: boolean) => void;
  onDisconnect?: () => void;
  onError?: (
    number: number,
    description: string,
    source: string,
    helpFile: string,
    helpContext: number,
    cancel: boolean
  ) => void;
  onQueryComplete?: (resultset: RDResultset) => void;
  onQueryTimeout?: (cancel: boolean) => void;
  onWillExecute?: (sql: string, cancel: boolean) => void;
  onWillAssociate?: (cancel: boolean) => void;
  onWillDissociate?: (cancel: boolean) => void;
}

export const RemoteDataControl = forwardRef<HTMLDivElement, RemoteDataProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 200,
    height = 25,
    visible = true,
    enabled = true,
    connect = '',
    dataSourceName = '',
    environment = null,
    loginTimeout = 15,
    password = '',
    userName = '',
    version = '3.0',
    cursorDriver = rdCursorDriverConstants.rdUseIfNeeded,
    cursorType = rdCursorTypeConstants.rdOpenKeyset,
    lockType = rdLockTypeConstants.rdConcurLock,
    maxRows = 100,
    options = 0,
    queryTimeout = 30,
    resultsetType = rdResultsetTypeConstants.rdOpenKeyset,
    sql = '',
    source = '',
    batchCollisionCount = 0,
    batchCollisions = [],
    batchSize = 15,
    editMode = 0,
    keysetSize = 100,
    prepared = false,
    readOnly = false,
    updatable = true,
    align = 0,
    appearance = 1,
    backColor = '#C0C0C0',
    borderStyle = 1,
    caption = 'RemoteData',
    foreColor = '#000000',
    onValidate,
    onWillUpdateRows,
    onRowCurrencyChange,
    onRowStatusChange,
    onResultsetChange,
    onConnect,
    onDisconnect,
    onError,
    onQueryComplete,
    onQueryTimeout,
    onWillExecute,
    onWillAssociate,
    onWillDissociate,
    ...rest
  } = props;

  const [connection, setConnection] = useState<RDConnection | null>(null);
  const [resultset, setResultset] = useState<RDResultset | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [recordPosition, setRecordPosition] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  const controlRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    Refresh: async () => {
      if (!connection || !sql) return;

      try {
        setIsExecuting(true);
        const newResultset = await connection.execute(sql);
        setResultset(newResultset);
        setRecordCount(newResultset.recordCount);
        setRecordPosition(0);

        onResultsetChange?.();
        onQueryComplete?.(newResultset);
        fireEvent(name, 'QueryComplete', { resultset: newResultset });
      } catch (error: any) {
        setLastError(error.message);
        onError?.(error.number || -1, error.message, name, '', 0, false);
        fireEvent(name, 'Error', { error: error.message });
      } finally {
        setIsExecuting(false);
      }
    },

    UpdateControls: () => {
      // Update all bound controls with current record data
      if (resultset && resultset.records[recordPosition]) {
        const currentRecord = resultset.records[recordPosition];
        updateControl(id, 'CurrentRecord', currentRecord);
        fireEvent(name, 'UpdateControls', { record: currentRecord });
      }
    },

    UpdateRow: () => {
      if (!resultset || !updatable || readOnly) return;

      const cancel = false;
      onWillUpdateRows?.(cancel);
      if (cancel) return;

      try {
        resultset.update();
        fireEvent(name, 'RowUpdated', { position: recordPosition });
      } catch (error: any) {
        setLastError(error.message);
        onError?.(error.number || -1, error.message, name, '', 0, false);
      }
    },

    Cancel: () => {
      if (resultset) {
        resultset.cancelUpdate();
        fireEvent(name, 'UpdateCancelled', {});
      }
    },

    Close: () => {
      if (resultset) {
        resultset.close();
        setResultset(null);
        setRecordCount(0);
        setRecordPosition(0);
      }

      if (connection) {
        connection.close();
        setConnection(null);
        setIsConnected(false);
        onDisconnect?.();
        fireEvent(name, 'Disconnect', {});
      }
    },

    OpenConnection: async (connectString?: string) => {
      const connectionString =
        connectString || connect || `DSN=${dataSourceName};UID=${userName};PWD=${password}`;

      const cancel = false;
      onConnect?.(cancel);
      if (cancel) return;

      try {
        const newConnection = createConnection(connectionString);
        await newConnection.connect();
        setConnection(newConnection);
        setIsConnected(true);

        fireEvent(name, 'Connect', { connectionString });
      } catch (error: any) {
        setLastError(error.message);
        onError?.(error.number || -1, error.message, name, '', 0, false);
        throw error;
      }
    },

    BeginTrans: () => {
      if (connection) {
        connection.beginTrans();
        fireEvent(name, 'BeginTrans', {});
      }
    },

    CommitTrans: () => {
      if (connection) {
        connection.commitTrans();
        fireEvent(name, 'CommitTrans', {});
      }
    },

    RollbackTrans: () => {
      if (connection) {
        connection.rollbackTrans();
        fireEvent(name, 'RollbackTrans', {});
      }
    },

    Execute: async (sqlStatement: string, options?: number) => {
      if (!connection) throw new Error('Not connected to data source');

      const cancel = false;
      onWillExecute?.(sqlStatement, cancel);
      if (cancel) return;

      try {
        setIsExecuting(true);
        const result = await connection.execute(sqlStatement);
        onQueryComplete?.(result);
        fireEvent(name, 'QueryComplete', { sql: sqlStatement, resultset: result });
        return result;
      } catch (error: any) {
        setLastError(error.message);
        onError?.(error.number || -1, error.message, name, '', 0, false);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },

    CreateQuery: (name: string, sql: string) => {
      // Create a prepared query
      const query = {
        name,
        sql,
        prepared: true,
        parameters: [],
      };

      updateControl(id, 'Queries', { [name]: query });
      return query;
    },

    AboutBox: () => {
      alert('Microsoft RemoteData Control\\nVersion 6.0\\n© Microsoft Corporation');
    },
  };

  const createConnection = (connectionString: string): RDConnection => {
    return {
      connectionString,
      dsName: dataSourceName,
      userId: userName,
      password: password,
      timeout: loginTimeout,
      version: version,

      connect: async () => {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 100));
      },

      close: () => {},

      execute: async (sqlStatement: string): Promise<RDResultset> => {
        // Simulate SQL execution
        await new Promise(resolve => setTimeout(resolve, 200));

        // Mock resultset for demonstration
        const mockRecords = Array.from({ length: Math.min(maxRows, 50) }, (_, i) => ({
          id: i + 1,
          name: `Record ${i + 1}`,
          value: Math.random() * 1000,
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        }));

        const mockFields: RDField[] = [
          {
            name: 'id',
            type: 3,
            definedSize: 4,
            actualSize: 4,
            value: null,
            originalValue: null,
            underlyingValue: null,
            attributes: 0,
            numericScale: 0,
            precision: 10,
            status: 0,
          },
          {
            name: 'name',
            type: 8,
            definedSize: 50,
            actualSize: 0,
            value: null,
            originalValue: null,
            underlyingValue: null,
            attributes: 0,
            numericScale: 0,
            precision: 0,
            status: 0,
          },
          {
            name: 'value',
            type: 5,
            definedSize: 8,
            actualSize: 8,
            value: null,
            originalValue: null,
            underlyingValue: null,
            attributes: 0,
            numericScale: 2,
            precision: 15,
            status: 0,
          },
          {
            name: 'date',
            type: 7,
            definedSize: 8,
            actualSize: 8,
            value: null,
            originalValue: null,
            underlyingValue: null,
            attributes: 0,
            numericScale: 0,
            precision: 0,
            status: 0,
          },
        ];

        const resultset: RDResultset = {
          source: sqlStatement,
          sql: sqlStatement,
          records: mockRecords,
          fields: mockFields,
          currentRecord: 0,
          bof: mockRecords.length === 0,
          eof: mockRecords.length === 0,
          recordCount: mockRecords.length,
          absolutePosition: 0,
          bookmark: null,
          bookmarkType: rdBookmarkTypeConstants.rdBookmarkLong,
          editMode: 0,
          lastModified: null,
          updatable: updatable && !readOnly,

          moveFirst: () => {
            resultset.currentRecord = 0;
            resultset.absolutePosition = 1;
            resultset.bof = false;
            resultset.eof = resultset.records.length === 0;
          },

          moveLast: () => {
            resultset.currentRecord = Math.max(0, resultset.records.length - 1);
            resultset.absolutePosition = resultset.records.length;
            resultset.bof = false;
            resultset.eof = resultset.records.length === 0;
          },

          moveNext: () => {
            if (resultset.currentRecord < resultset.records.length - 1) {
              resultset.currentRecord++;
              resultset.absolutePosition++;
              resultset.bof = false;
            } else {
              resultset.eof = true;
            }
          },

          movePrevious: () => {
            if (resultset.currentRecord > 0) {
              resultset.currentRecord--;
              resultset.absolutePosition--;
              resultset.eof = false;
            } else {
              resultset.bof = true;
            }
          },

          move: (records: number, start?: any) => {
            const newPosition = (start || resultset.currentRecord) + records;
            resultset.currentRecord = Math.max(
              0,
              Math.min(newPosition, resultset.records.length - 1)
            );
            resultset.absolutePosition = resultset.currentRecord + 1;
            resultset.bof = resultset.currentRecord === 0 && records < 0;
            resultset.eof = resultset.currentRecord === resultset.records.length - 1 && records > 0;
          },

          addNew: () => {
            if (!resultset.updatable) throw new Error('Resultset is not updatable');
            resultset.editMode = 1; // adEditAdd
          },

          update: () => {
            if (!resultset.updatable) throw new Error('Resultset is not updatable');
            resultset.editMode = 0; // adEditNone
          },

          delete: () => {
            if (!resultset.updatable) throw new Error('Resultset is not updatable');
            if (
              resultset.currentRecord >= 0 &&
              resultset.currentRecord < resultset.records.length
            ) {
              resultset.records.splice(resultset.currentRecord, 1);
              resultset.recordCount--;
            }
          },

          cancelUpdate: () => {
            resultset.editMode = 0; // adEditNone
          },

          getRows: (numRows = -1, start = 0, fields = []) => {
            const startIdx = start || resultset.currentRecord;
            const endIdx =
              numRows > 0
                ? Math.min(startIdx + numRows, resultset.records.length)
                : resultset.records.length;
            const selectedFields = fields.length > 0 ? fields : resultset.fields.map(f => f.name);

            return resultset.records
              .slice(startIdx, endIdx)
              .map(record => selectedFields.map(field => record[field]));
          },

          clone: () => {
            return { ...resultset };
          },

          requery: async () => {
            // Re-execute the original query
            const newResultset = await connection!.execute(resultset.sql);
            Object.assign(resultset, newResultset);
          },

          close: () => {
            resultset.records = [];
            resultset.recordCount = 0;
            resultset.currentRecord = 0;
          },
        };

        return resultset;
      },

      beginTrans: () => {},

      commitTrans: () => {},

      rollbackTrans: () => {},
    };
  };

  const handleNavigationClick = (action: string) => {
    if (!resultset || !enabled) return;

    const cancel = false;
    onRowCurrencyChange?.(cancel);
    if (cancel) return;

    const oldPosition = recordPosition;

    switch (action) {
      case 'first':
        resultset.moveFirst();
        setRecordPosition(0);
        break;
      case 'previous':
        resultset.movePrevious();
        setRecordPosition(Math.max(0, recordPosition - 1));
        break;
      case 'next':
        resultset.moveNext();
        setRecordPosition(Math.min(recordCount - 1, recordPosition + 1));
        break;
      case 'last':
        resultset.moveLast();
        setRecordPosition(recordCount - 1);
        break;
      case 'add':
        if (updatable && !readOnly) {
          resultset.addNew();
          fireEvent(name, 'WillChangeRecord', { action: 'add' });
        }
        break;
      case 'delete':
        if (updatable && !readOnly) {
          resultset.delete();
          setRecordCount(recordCount - 1);
          fireEvent(name, 'WillChangeRecord', { action: 'delete' });
        }
        break;
      case 'update':
        vb6Methods.UpdateRow();
        break;
      case 'cancel':
        vb6Methods.Cancel();
        break;
    }

    if (oldPosition !== recordPosition) {
      vb6Methods.UpdateControls();
      fireEvent(name, 'PositionChanged', { oldPosition, newPosition: recordPosition });
    }
  };

  // Initialize connection if connect string is provided
  useEffect(() => {
    if (connect && !connection) {
      // ERROR HANDLING BUG FIX: Proper error handling instead of just logging
      vb6Methods.OpenConnection(connect).catch(error => {
        console.error('Failed to open connection:', error);
        // Update state to reflect connection failure
        setConnectionState(ADODB.adStateClosed);
        setLastError(`Connection failed: ${error.message || 'Unknown error'}`);
        // Fire error event for VB6 compatibility
        onError?.({
          source: 'RemoteDataControl',
          description: `Connection failed: ${error.message || 'Unknown error'}`,
          number: -2147467259, // Generic VB6 error code
          helpFile: '',
          helpContext: 0,
        });
      });
    }
  }, [connect, connection, onError]);

  // Auto-refresh if SQL is provided and connection exists
  useEffect(() => {
    if (connection && sql && isConnected) {
      vb6Methods.Refresh();
    }
  }, [connection, sql, isConnected]);

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Resultset', resultset);
    updateControl(id, 'Connection', connection);
    updateControl(id, 'RecordCount', recordCount);
    updateControl(id, 'AbsolutePosition', recordPosition + 1);
    updateControl(id, 'BOF', resultset?.bof || false);
    updateControl(id, 'EOF', resultset?.eof || false);
  }, [id, resultset, connection, recordCount, recordPosition, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: backColor,
        color: foreColor,
        border: borderStyle ? '2px inset #C0C0C0' : 'none',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5,
      }}
      {...rest}
    >
      {/* Navigation buttons */}
      <button
        onClick={() => handleNavigationClick('first')}
        disabled={!enabled || !resultset || recordPosition === 0}
        style={{
          width: '20px',
          height: '18px',
          fontSize: '10px',
          margin: '1px',
          border: '1px outset #C0C0C0',
          backgroundColor: '#C0C0C0',
          cursor: enabled ? 'pointer' : 'default',
        }}
        title="First"
      >
        |◀
      </button>

      <button
        onClick={() => handleNavigationClick('previous')}
        disabled={!enabled || !resultset || recordPosition === 0}
        style={{
          width: '20px',
          height: '18px',
          fontSize: '10px',
          margin: '1px',
          border: '1px outset #C0C0C0',
          backgroundColor: '#C0C0C0',
          cursor: enabled ? 'pointer' : 'default',
        }}
        title="Previous"
      >
        ◀
      </button>

      {/* Status display */}
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '2px 4px',
          backgroundColor: '#FFFFFF',
          border: '1px inset #C0C0C0',
          fontSize: '8pt',
          minWidth: '60px',
        }}
      >
        {isExecuting
          ? 'Loading...'
          : isConnected
            ? resultset
              ? `${recordPosition + 1}/${recordCount}`
              : 'Ready'
            : 'Disconnected'}
      </div>

      <button
        onClick={() => handleNavigationClick('next')}
        disabled={!enabled || !resultset || recordPosition >= recordCount - 1}
        style={{
          width: '20px',
          height: '18px',
          fontSize: '10px',
          margin: '1px',
          border: '1px outset #C0C0C0',
          backgroundColor: '#C0C0C0',
          cursor: enabled ? 'pointer' : 'default',
        }}
        title="Next"
      >
        ▶
      </button>

      <button
        onClick={() => handleNavigationClick('last')}
        disabled={!enabled || !resultset || recordPosition >= recordCount - 1}
        style={{
          width: '20px',
          height: '18px',
          fontSize: '10px',
          margin: '1px',
          border: '1px outset #C0C0C0',
          backgroundColor: '#C0C0C0',
          cursor: enabled ? 'pointer' : 'default',
        }}
        title="Last"
      >
        ▶|
      </button>

      {/* Edit buttons */}
      {updatable && !readOnly && (
        <>
          <button
            onClick={() => handleNavigationClick('add')}
            disabled={!enabled || !resultset}
            style={{
              width: '20px',
              height: '18px',
              fontSize: '10px',
              margin: '1px',
              border: '1px outset #C0C0C0',
              backgroundColor: '#C0C0C0',
              cursor: enabled ? 'pointer' : 'default',
            }}
            title="Add New"
          >
            +
          </button>

          <button
            onClick={() => handleNavigationClick('delete')}
            disabled={!enabled || !resultset}
            style={{
              width: '20px',
              height: '18px',
              fontSize: '10px',
              margin: '1px',
              border: '1px outset #C0C0C0',
              backgroundColor: '#C0C0C0',
              cursor: enabled ? 'pointer' : 'default',
            }}
            title="Delete"
          >
            ×
          </button>

          <button
            onClick={() => handleNavigationClick('update')}
            disabled={!enabled || !resultset}
            style={{
              width: '20px',
              height: '18px',
              fontSize: '10px',
              margin: '1px',
              border: '1px outset #C0C0C0',
              backgroundColor: '#C0C0C0',
              cursor: enabled ? 'pointer' : 'default',
            }}
            title="Update"
          >
            ✓
          </button>
        </>
      )}

      {/* Caption/Label */}
      {caption && (
        <div
          style={{
            marginLeft: '4px',
            fontSize: '8pt',
            color: foreColor,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
});

RemoteDataControl.displayName = 'RemoteDataControl';

export default RemoteDataControl;
