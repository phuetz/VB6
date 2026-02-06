/**
 * VB6 Microsoft Remote Data Control (MSRDC)
 * Provides remote data access capabilities for distributed applications
 * Compatible with Microsoft Remote Data Control 2.0
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Control } from '../../types/Control';

interface MSRDCControlProps {
  control: Control;
  isDesignMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onChange?: (value: any) => void;
}

// RDO Environment modes
export enum RDOEnvironmentMode {
  rdModeReadWrite = 0,
  rdModeReadOnly = 1,
  rdModeShareDenyNone = 2,
  rdModeShareDenyWrite = 3,
  rdModeShareExclusive = 4,
}

// Cursor types
export enum RDOCursorType {
  rdOpenForwardOnly = 0,
  rdOpenKeyset = 1,
  rdOpenDynamic = 2,
  rdOpenStatic = 3,
}

// Lock types
export enum RDOLockType {
  rdConcurReadOnly = 1,
  rdConcurLock = 2,
  rdConcurRowVer = 3,
  rdConcurValues = 4,
  rdConcurBatch = 5,
}

// Result set types
export enum RDOResultsetType {
  rdOpenForwardOnly = 0,
  rdOpenKeyset = 1,
  rdOpenDynamic = 2,
  rdOpenStatic = 3,
}

// Connection states
export enum RDOConnectionState {
  rdStateClosed = 0,
  rdStateOpen = 1,
}

// Transaction states
export enum RDOTransactionState {
  rdTxnNone = 0,
  rdTxnInProgress = 1,
  rdTxnCommitted = 2,
  rdTxnAborted = 3,
}

// Query types
export enum RDOQueryType {
  rdQuerySelect = 0,
  rdQueryAction = 1,
  rdQueryProcedures = 2,
}

export interface RDOConnection {
  connect: string;
  cursorDriver: number;
  loginTimeout: number;
  queryTimeout: number;
  transactions: boolean;
  updatable: boolean;
  version: string;
  stillConnecting: boolean;
  stillExecuting: boolean;
  rowsAffected: number;
  lastQueryResults: any[];
}

export interface RDOResultset {
  BOF: boolean;
  EOF: boolean;
  bookmark: any;
  bookmarkable: boolean;
  editMode: number;
  lockEdits: boolean;
  name: string;
  perCentPosition: number;
  restartable: boolean;
  rowCount: number;
  status: number;
  stillExecuting: boolean;
  transactions: boolean;
  type: RDOResultsetType;
  updatable: boolean;
  fields: RDOField[];
  absolutePosition: number;
  batchCollisionCount: number;
  batchCollisions: any[];
  batchSize: number;
}

export interface RDOField {
  name: string;
  value: any;
  type: number;
  size: number;
  sourceColumn: string;
  sourceTable: string;
  required: boolean;
  allowZeroLength: boolean;
  attributes: number;
  ordinalPosition: number;
  originalValue: any;
  status: number;
}

export const MSRDCControl = forwardRef<HTMLDivElement, MSRDCControlProps>(
  ({ control, isDesignMode = false, onClick, onDoubleClick, onChange }, ref) => {
    const [connection, setConnection] = useState<RDOConnection>({
      connect: control.connect || '',
      cursorDriver: control.cursorDriver || 0,
      loginTimeout: control.loginTimeout || 15,
      queryTimeout: control.queryTimeout || 30,
      transactions: control.transactions !== false,
      updatable: control.updatable !== false,
      version: '2.0',
      stillConnecting: false,
      stillExecuting: false,
      rowsAffected: 0,
      lastQueryResults: [],
    });

    const [resultset, setResultset] = useState<RDOResultset | null>(null);
    const [currentRow, setCurrentRow] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sql, setSql] = useState(control.sql || '');
    const [caption, setCaption] = useState(control.caption || 'Remote Data');

    // Sample data for demonstration
    const sampleDataRef = useRef<any[]>([]);

    // Initialize connection
    useEffect(() => {
      if (control.connect && control.autoConnect !== false && !isDesignMode) {
        establishConnection();
      }
    }, [control.connect, control.autoConnect, isDesignMode]);

    const establishConnection = async () => {
      try {
        setConnection(prev => ({ ...prev, stillConnecting: true }));

        // Simulate connection establishment
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsConnected(true);
        setConnection(prev => ({ ...prev, stillConnecting: false }));

        // Auto-execute SQL if provided
        if (sql) {
          await executeQuery(sql);
        }
      } catch (err) {
        handleError(`Connection failed: ${err}`);
        setConnection(prev => ({ ...prev, stillConnecting: false }));
      }
    };

    const executeQuery = async (query: string) => {
      if (!isConnected) {
        handleError('Not connected to data source');
        return;
      }

      try {
        setConnection(prev => ({ ...prev, stillExecuting: true }));

        // Simulate query execution
        await new Promise(resolve => setTimeout(resolve, 300));

        // Generate sample data based on query
        const data = generateSampleData(query);
        sampleDataRef.current = data;

        // Create resultset
        const fields: RDOField[] =
          data.length > 0
            ? Object.keys(data[0]).map((key, index) => ({
                name: key,
                value: data[0][key],
                type: typeof data[0][key] === 'number' ? 3 : 200, // adInteger : adVarChar
                size: 255,
                sourceColumn: key,
                sourceTable: 'RemoteTable',
                required: false,
                allowZeroLength: true,
                attributes: 0,
                ordinalPosition: index,
                originalValue: data[0][key],
                status: 0,
              }))
            : [];

        const newResultset: RDOResultset = {
          BOF: data.length === 0,
          EOF: data.length === 0,
          bookmark: 0,
          bookmarkable: true,
          editMode: 0,
          lockEdits: control.lockType === RDOLockType.rdConcurLock,
          name: 'RemoteResultset',
          perCentPosition: 0,
          restartable: true,
          rowCount: data.length,
          status: 0,
          stillExecuting: false,
          transactions: connection.transactions,
          type: control.resultsetType || RDOResultsetType.rdOpenKeyset,
          updatable: connection.updatable,
          fields,
          absolutePosition: data.length > 0 ? 1 : 0,
          batchCollisionCount: 0,
          batchCollisions: [],
          batchSize: control.batchSize || 1,
        };

        setResultset(newResultset);
        setCurrentRow(data.length > 0 ? 0 : -1);
        setConnection(prev => ({
          ...prev,
          stillExecuting: false,
          rowsAffected: data.length,
          lastQueryResults: data,
        }));

        onChange?.({ resultset: newResultset, data });
      } catch (err) {
        handleError(`Query execution failed: ${err}`);
        setConnection(prev => ({ ...prev, stillExecuting: false }));
      }
    };

    const generateSampleData = (query: string): any[] => {
      // Generate sample data based on query pattern
      const upperQuery = query.toUpperCase();

      if (upperQuery.includes('CUSTOMER')) {
        return [
          {
            CustomerID: 1,
            CustomerName: 'Acme Corp',
            City: 'New York',
            Country: 'USA',
            Balance: 15000,
          },
          {
            CustomerID: 2,
            CustomerName: 'Global Tech',
            City: 'London',
            Country: 'UK',
            Balance: 22000,
          },
          {
            CustomerID: 3,
            CustomerName: 'Smart Systems',
            City: 'Tokyo',
            Country: 'Japan',
            Balance: 18500,
          },
          {
            CustomerID: 4,
            CustomerName: 'Euro Logistics',
            City: 'Paris',
            Country: 'France',
            Balance: 31000,
          },
          {
            CustomerID: 5,
            CustomerName: 'Pacific Trade',
            City: 'Sydney',
            Country: 'Australia',
            Balance: 27500,
          },
        ];
      } else if (upperQuery.includes('ORDER')) {
        return [
          {
            OrderID: 1001,
            CustomerID: 1,
            OrderDate: '2024-01-15',
            Amount: 5000,
            Status: 'Shipped',
          },
          {
            OrderID: 1002,
            CustomerID: 2,
            OrderDate: '2024-01-18',
            Amount: 7500,
            Status: 'Processing',
          },
          {
            OrderID: 1003,
            CustomerID: 1,
            OrderDate: '2024-01-20',
            Amount: 3200,
            Status: 'Delivered',
          },
          {
            OrderID: 1004,
            CustomerID: 3,
            OrderDate: '2024-01-22',
            Amount: 9800,
            Status: 'Shipped',
          },
          {
            OrderID: 1005,
            CustomerID: 4,
            OrderDate: '2024-01-25',
            Amount: 12000,
            Status: 'Pending',
          },
        ];
      } else if (upperQuery.includes('PRODUCT')) {
        return [
          {
            ProductID: 1,
            ProductName: 'Widget Pro',
            Category: 'Hardware',
            Price: 99.99,
            Stock: 150,
          },
          {
            ProductID: 2,
            ProductName: 'Super Gadget',
            Category: 'Electronics',
            Price: 249.99,
            Stock: 75,
          },
          { ProductID: 3, ProductName: 'Mega Tool', Category: 'Tools', Price: 149.99, Stock: 200 },
          {
            ProductID: 4,
            ProductName: 'Ultra Device',
            Category: 'Electronics',
            Price: 399.99,
            Stock: 50,
          },
          {
            ProductID: 5,
            ProductName: 'Power Kit',
            Category: 'Hardware',
            Price: 179.99,
            Stock: 100,
          },
        ];
      } else {
        // Generic sample data
        return [
          { ID: 1, Name: 'Remote Item 1', Value: 100, Status: 'Active' },
          { ID: 2, Name: 'Remote Item 2', Value: 200, Status: 'Active' },
          { ID: 3, Name: 'Remote Item 3', Value: 300, Status: 'Inactive' },
        ];
      }
    };

    const handleError = (message: string) => {
      setError(message);
      console.error('MSRDC Error:', message);
    };

    // VB6 Methods implementation
    const vb6Methods = {
      // Connection properties
      get Connect() {
        return connection.connect;
      },
      set Connect(value: string) {
        setConnection(prev => ({ ...prev, connect: value }));
        control.connect = value;
      },

      get CursorDriver() {
        return connection.cursorDriver;
      },
      set CursorDriver(value: number) {
        setConnection(prev => ({ ...prev, cursorDriver: value }));
      },

      get LoginTimeout() {
        return connection.loginTimeout;
      },
      set LoginTimeout(value: number) {
        setConnection(prev => ({ ...prev, loginTimeout: value }));
      },

      get QueryTimeout() {
        return connection.queryTimeout;
      },
      set QueryTimeout(value: number) {
        setConnection(prev => ({ ...prev, queryTimeout: value }));
      },

      get StillConnecting() {
        return connection.stillConnecting;
      },
      get StillExecuting() {
        return connection.stillExecuting;
      },
      get RowsAffected() {
        return connection.rowsAffected;
      },

      // Resultset properties
      get Resultset() {
        return resultset;
      },
      get BOF() {
        return resultset?.BOF || true;
      },
      get EOF() {
        return resultset?.EOF || true;
      },
      get RecordCount() {
        return resultset?.rowCount || 0;
      },

      // SQL property
      get SQL() {
        return sql;
      },
      set SQL(value: string) {
        setSql(value);
        control.sql = value;
      },

      // Caption property
      get Caption() {
        return caption;
      },
      set Caption(value: string) {
        setCaption(value);
        control.caption = value;
      },

      // Methods
      OpenConnection: async (connectString?: string) => {
        if (connectString) {
          setConnection(prev => ({ ...prev, connect: connectString }));
        }
        await establishConnection();
      },

      CloseConnection: () => {
        setIsConnected(false);
        setResultset(null);
        setCurrentRow(-1);
        sampleDataRef.current = [];
      },

      Execute: async (query?: string) => {
        const sqlToExecute = query || sql;
        if (sqlToExecute) {
          await executeQuery(sqlToExecute);
        }
      },

      Refresh: async () => {
        if (sql) {
          await executeQuery(sql);
        }
      },

      UpdateRow: () => {
        if (!resultset || currentRow < 0) return;

        // Update current row data
        onChange?.({ action: 'update', row: currentRow });
      },

      UpdateControls: () => {
        // Update bound controls
        onChange?.({ action: 'updateControls' });
      },

      CancelUpdate: () => {
        // Cancel pending updates
      },

      // Navigation methods
      MoveFirst: () => {
        if (!resultset || resultset.rowCount === 0) return;
        setCurrentRow(0);
        updateResultsetPosition(0);
      },

      MoveLast: () => {
        if (!resultset || resultset.rowCount === 0) return;
        const lastRow = resultset.rowCount - 1;
        setCurrentRow(lastRow);
        updateResultsetPosition(lastRow);
      },

      MoveNext: () => {
        if (!resultset || currentRow >= resultset.rowCount - 1) return;
        const newRow = currentRow + 1;
        setCurrentRow(newRow);
        updateResultsetPosition(newRow);
      },

      MovePrevious: () => {
        if (!resultset || currentRow <= 0) return;
        const newRow = currentRow - 1;
        setCurrentRow(newRow);
        updateResultsetPosition(newRow);
      },

      Move: (rows: number) => {
        if (!resultset) return;
        const newRow = Math.max(0, Math.min(resultset.rowCount - 1, currentRow + rows));
        setCurrentRow(newRow);
        updateResultsetPosition(newRow);
      },

      // Batch operations
      BatchUpdate: () => {
        onChange?.({ action: 'batchUpdate' });
      },

      CancelBatch: () => {},

      // Transaction methods
      BeginTrans: () => {},

      CommitTrans: () => {},

      RollbackTrans: () => {},
    };

    const updateResultsetPosition = (row: number) => {
      if (!resultset) return;

      setResultset(prev =>
        prev
          ? {
              ...prev,
              BOF: row < 0,
              EOF: row >= prev.rowCount,
              absolutePosition: row + 1,
              perCentPosition: prev.rowCount > 0 ? (row / prev.rowCount) * 100 : 0,
            }
          : null
      );

      // Update field values
      if (sampleDataRef.current[row]) {
        const rowData = sampleDataRef.current[row];
        setResultset(prev =>
          prev
            ? {
                ...prev,
                fields: prev.fields.map(field => ({
                  ...field,
                  value: rowData[field.name],
                  originalValue: rowData[field.name],
                })),
              }
            : null
        );
      }
    };

    // Expose methods to parent
    useEffect(() => {
      if (control.ref && typeof control.ref === 'object' && 'current' in control.ref) {
        control.ref.current = vb6Methods;
      }
    }, [control.ref, vb6Methods]);

    // Navigation button click handlers
    const handleFirst = () => vb6Methods.MoveFirst();
    const handlePrevious = () => vb6Methods.MovePrevious();
    const handleNext = () => vb6Methods.MoveNext();
    const handleLast = () => vb6Methods.MoveLast();

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x || 0,
      top: control.y || 0,
      width: control.width || 300,
      height: control.height || 40,
      backgroundColor: control.backColor || '#C0C0C0',
      border: '2px solid #000000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '8pt',
      cursor: isDesignMode ? 'default' : 'auto',
      opacity: control.visible !== false ? 1 : 0,
      zIndex: control.zIndex || 'auto',
    };

    const buttonStyle: React.CSSProperties = {
      width: '24px',
      height: '24px',
      border: '1px solid #000000',
      backgroundColor: '#C0C0C0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      boxShadow: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080',
    };

    return (
      <div
        ref={ref}
        style={containerStyle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        data-control-type="MSRDCControl"
        data-control-name={control.name}
      >
        {/* Status/Caption area */}
        <div
          style={{
            flex: 1,
            padding: '2px 4px',
            backgroundColor: control.captionBackColor || '#000080',
            color: control.captionForeColor || '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            fontSize: '8pt',
          }}
        >
          {connection.stillConnecting
            ? 'Connecting...'
            : connection.stillExecuting
              ? 'Executing...'
              : error
                ? `Error: ${error}`
                : caption}
        </div>

        {/* Navigation buttons */}
        <div
          style={{
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#C0C0C0',
            borderTop: '1px solid #808080',
          }}
        >
          {/* First button */}
          <button
            style={buttonStyle}
            onClick={handleFirst}
            disabled={isDesignMode || !isConnected || !resultset || resultset.BOF}
            title="Move First"
          >
            |&lt;
          </button>

          {/* Previous button */}
          <button
            style={buttonStyle}
            onClick={handlePrevious}
            disabled={isDesignMode || !isConnected || !resultset || resultset.BOF}
            title="Move Previous"
          >
            &lt;
          </button>

          {/* Position indicator */}
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '8pt',
              padding: '0 4px',
            }}
          >
            {isConnected && resultset
              ? `Record ${currentRow + 1} of ${resultset.rowCount}`
              : 'No Records'}
          </div>

          {/* Next button */}
          <button
            style={buttonStyle}
            onClick={handleNext}
            disabled={isDesignMode || !isConnected || !resultset || resultset.EOF}
            title="Move Next"
          >
            &gt;
          </button>

          {/* Last button */}
          <button
            style={buttonStyle}
            onClick={handleLast}
            disabled={isDesignMode || !isConnected || !resultset || resultset.EOF}
            title="Move Last"
          >
            &gt;|
          </button>
        </div>
      </div>
    );
  }
);

MSRDCControl.displayName = 'MSRDCControl';

export default MSRDCControl;
