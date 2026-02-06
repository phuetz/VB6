import { createLogger } from './LoggingService';
import { EventListener, FieldValue } from './types/VB6ServiceTypes';

const logger = createLogger('Database');

// Browser-compatible EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: EventListener[] } = {};

  on(event: string, listener: EventListener): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        logger.error('Event listener error:', error);
      }
    });
    return true;
  }

  off(event: string, listener?: EventListener): this {
    if (!this.events[event]) {
      return this;
    }
    if (listener) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    } else {
      delete this.events[event];
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

// ADO Connection States
export enum ConnectionState {
  Closed = 0,
  Open = 1,
  Connecting = 2,
  Executing = 4,
  Fetching = 8,
}

// ADO Cursor Types
export enum CursorType {
  adOpenUnspecified = -1,
  adOpenForwardOnly = 0,
  adOpenKeyset = 1,
  adOpenDynamic = 2,
  adOpenStatic = 3,
}

// ADO Lock Types
export enum LockType {
  adLockUnspecified = -1,
  adLockReadOnly = 1,
  adLockPessimistic = 2,
  adLockOptimistic = 3,
  adLockBatchOptimistic = 4,
}

// Field Types
export enum DataType {
  adEmpty = 0,
  adTinyInt = 16,
  adSmallInt = 2,
  adInteger = 3,
  adBigInt = 20,
  adUnsignedTinyInt = 17,
  adUnsignedSmallInt = 18,
  adUnsignedInt = 19,
  adUnsignedBigInt = 21,
  adSingle = 4,
  adDouble = 5,
  adCurrency = 6,
  adDecimal = 14,
  adNumeric = 131,
  adBoolean = 11,
  adError = 10,
  adUserDefined = 132,
  adVariant = 12,
  adIDispatch = 9,
  adIUnknown = 13,
  adGUID = 72,
  adDate = 7,
  adDBDate = 133,
  adDBTime = 134,
  adDBTimeStamp = 135,
  adBSTR = 8,
  adChar = 129,
  adVarChar = 200,
  adLongVarChar = 201,
  adWChar = 130,
  adVarWChar = 202,
  adLongVarWChar = 203,
  adBinary = 128,
  adVarBinary = 204,
  adLongVarBinary = 205,
}

// Database field interface
export interface VB6Field {
  Name: string;
  Type: DataType;
  Value: any;
  DefinedSize: number;
  ActualSize: number;
  Attributes: number;
  Precision: number;
  NumericScale: number;
}

// Database record interface
export interface VB6Record {
  fields: { [key: string]: VB6Field };
  recordNumber: number;
}

// Connection interface
export interface VB6Connection {
  ConnectionString: string;
  State: ConnectionState;
  Provider: string;
  DefaultDatabase: string;
  IsolationLevel: number;
  Mode: number;
  CursorLocation: number;
  CommandTimeout: number;
  ConnectionTimeout: number;
  Version: string;
  Errors: any[];

  Open(connectionString?: string): Promise<void>;
  Close(): Promise<void>;
  Execute(commandText: string, recordsAffected?: number[]): Promise<VB6Recordset>;
  BeginTrans(): number;
  CommitTrans(): void;
  RollbackTrans(): void;
}

// Recordset interface
export interface VB6Recordset {
  Fields: { [key: string]: VB6Field };
  RecordCount: number;
  AbsolutePosition: number;
  BOF: boolean;
  EOF: boolean;
  State: number;
  CursorType: CursorType;
  LockType: LockType;
  Source: string;

  Open(
    source: string,
    connection: VB6Connection,
    cursorType?: CursorType,
    lockType?: LockType
  ): Promise<void>;
  Close(): void;
  MoveFirst(): void;
  MoveLast(): void;
  MoveNext(): void;
  MovePrevious(): void;
  Move(numRecords: number): void;
  AddNew(): void;
  Update(): void;
  Delete(): void;
  Find(criteria: string): boolean;
  Filter: string;
  Sort: string;
  Clone(): VB6Recordset;
  GetRows(rows?: number): any[][];
}

// Mock database for demonstration purposes
class MockDatabase {
  private static instance: MockDatabase;
  private tables: Map<string, any[]> = new Map();

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
      MockDatabase.instance.initializeSampleData();
    }
    return MockDatabase.instance;
  }

  private initializeSampleData() {
    // Sample Customers table
    this.tables.set('Customers', [
      {
        CustomerID: 1,
        CompanyName: 'Alfreds Futterkiste',
        ContactName: 'Maria Anders',
        Country: 'Germany',
      },
      {
        CustomerID: 2,
        CompanyName: 'Ana Trujillo Emparedados',
        ContactName: 'Ana Trujillo',
        Country: 'Mexico',
      },
      {
        CustomerID: 3,
        CompanyName: 'Antonio Moreno Taquería',
        ContactName: 'Antonio Moreno',
        Country: 'Mexico',
      },
      { CustomerID: 4, CompanyName: 'Around the Horn', ContactName: 'Thomas Hardy', Country: 'UK' },
      {
        CustomerID: 5,
        CompanyName: 'Berglunds snabbköp',
        ContactName: 'Christina Berglund',
        Country: 'Sweden',
      },
    ]);

    // Sample Products table
    this.tables.set('Products', [
      { ProductID: 1, ProductName: 'Chai', CategoryID: 1, UnitPrice: 18.0, UnitsInStock: 39 },
      { ProductID: 2, ProductName: 'Chang', CategoryID: 1, UnitPrice: 19.0, UnitsInStock: 17 },
      {
        ProductID: 3,
        ProductName: 'Aniseed Syrup',
        CategoryID: 2,
        UnitPrice: 10.0,
        UnitsInStock: 13,
      },
      {
        ProductID: 4,
        ProductName: "Chef Anton's Cajun Seasoning",
        CategoryID: 2,
        UnitPrice: 22.0,
        UnitsInStock: 53,
      },
      {
        ProductID: 5,
        ProductName: "Chef Anton's Gumbo Mix",
        CategoryID: 2,
        UnitPrice: 21.35,
        UnitsInStock: 0,
      },
    ]);

    // Sample Orders table
    this.tables.set('Orders', [
      { OrderID: 10248, CustomerID: 1, OrderDate: '1996-07-04', ShipCountry: 'France' },
      { OrderID: 10249, CustomerID: 2, OrderDate: '1996-07-05', ShipCountry: 'Germany' },
      { OrderID: 10250, CustomerID: 3, OrderDate: '1996-07-08', ShipCountry: 'Brazil' },
      { OrderID: 10251, CustomerID: 4, OrderDate: '1996-07-08', ShipCountry: 'France' },
      { OrderID: 10252, CustomerID: 5, OrderDate: '1996-07-09', ShipCountry: 'Belgium' },
    ]);
  }

  executeQuery(sql: string): any[] {
    // Simple SQL parser for demo purposes
    const upperSQL = sql.toUpperCase().trim();

    if (upperSQL.startsWith('SELECT')) {
      return this.handleSelect(sql);
    } else if (upperSQL.startsWith('INSERT')) {
      return this.handleInsert(sql);
    } else if (upperSQL.startsWith('UPDATE')) {
      return this.handleUpdate(sql);
    } else if (upperSQL.startsWith('DELETE')) {
      return this.handleDelete(sql);
    }

    throw new Error(`Unsupported SQL command: ${sql}`);
  }

  private handleSelect(sql: string): any[] {
    // Extract table name (very basic parsing)
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (!fromMatch) {
      throw new Error('Invalid SELECT statement');
    }

    const tableName = fromMatch[1];
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }

    // Handle WHERE clause (basic implementation)
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|$)/i);
    let results = [...table];

    if (whereMatch) {
      const whereClause = whereMatch[1];
      results = results.filter(row => this.evaluateWhere(row, whereClause));
    }

    // Handle ORDER BY (basic implementation)
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const column = orderMatch[1];
      const direction = orderMatch[2]?.toUpperCase() || 'ASC';

      results.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'DESC' ? -comparison : comparison;
      });
    }

    return results;
  }

  private handleInsert(sql: string): any[] {
    // Basic INSERT implementation
    const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!match) {
      throw new Error('Invalid INSERT statement');
    }

    const [, tableName, columns, values] = match;
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }

    const columnNames = columns.split(',').map(c => c.trim());
    const valueStrings = values.split(',').map(v => v.trim().replace(/^'|'$/g, ''));

    const newRecord: any = {};
    columnNames.forEach((col, index) => {
      newRecord[col] = valueStrings[index];
    });

    table.push(newRecord);
    return [newRecord];
  }

  private handleUpdate(sql: string): any[] {
    // Basic UPDATE implementation
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) {
      throw new Error('Invalid UPDATE statement');
    }

    const [, tableName, setClause, whereClause] = match;
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }

    const updates: any[] = [];
    table.forEach(row => {
      if (!whereClause || this.evaluateWhere(row, whereClause)) {
        // Apply SET clause
        const setPairs = setClause.split(',');
        setPairs.forEach(pair => {
          const [column, value] = pair.split('=').map(s => s.trim());
          row[column] = value.replace(/^'|'$/g, '');
        });
        updates.push(row);
      }
    });

    return updates;
  }

  private handleDelete(sql: string): any[] {
    // Basic DELETE implementation
    const match = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) {
      throw new Error('Invalid DELETE statement');
    }

    const [, tableName, whereClause] = match;
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }

    const deleted: any[] = [];
    for (let i = table.length - 1; i >= 0; i--) {
      if (!whereClause || this.evaluateWhere(table[i], whereClause)) {
        deleted.push(table.splice(i, 1)[0]);
      }
    }

    return deleted.reverse();
  }

  private evaluateWhere(row: any, whereClause: string): boolean {
    // Very basic WHERE clause evaluation
    const conditions = whereClause.split(/\s+AND\s+/i);

    return conditions.every(condition => {
      const match = condition.match(/(\w+)\s*(=|<>|!=|<|>|<=|>=)\s*'?([^']*)'?/);
      if (!match) return true;

      const [, column, operator, value] = match;
      const rowValue = row[column];

      switch (operator) {
        case '=':
          return rowValue == value;
        case '<>':
        case '!=':
          return rowValue != value;
        case '<':
          return rowValue < value;
        case '>':
          return rowValue > value;
        case '<=':
          return rowValue <= value;
        case '>=':
          return rowValue >= value;
        default:
          return true;
      }
    });
  }

  getTables(): string[] {
    return Array.from(this.tables.keys());
  }

  getTableSchema(tableName: string): { [key: string]: string } {
    const table = this.tables.get(tableName);
    if (!table || table.length === 0) {
      return {};
    }

    const schema: { [key: string]: string } = {};
    const firstRow = table[0];

    Object.keys(firstRow).forEach(key => {
      const value = firstRow[key];
      if (typeof value === 'number') {
        schema[key] = Number.isInteger(value) ? 'Integer' : 'Double';
      } else if (typeof value === 'boolean') {
        schema[key] = 'Boolean';
      } else if (value instanceof Date) {
        schema[key] = 'Date';
      } else {
        schema[key] = 'String';
      }
    });

    return schema;
  }
}

// ADO Connection implementation
export class ADOConnection extends EventEmitter implements VB6Connection {
  ConnectionString: string = '';
  State: ConnectionState = ConnectionState.Closed;
  Provider: string = 'Microsoft.Jet.OLEDB.4.0';
  DefaultDatabase: string = '';
  IsolationLevel: number = 0;
  Mode: number = 0;
  CursorLocation: number = 3;
  CommandTimeout: number = 30;
  ConnectionTimeout: number = 15;
  Version: string = '6.0';
  Errors: any[] = [];

  private mockDb = MockDatabase.getInstance();

  async Open(connectionString?: string): Promise<void> {
    if (connectionString) {
      this.ConnectionString = connectionString;
    }

    this.State = ConnectionState.Connecting;
    this.emit('WillConnect', this.ConnectionString);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));

    this.State = ConnectionState.Open;
    this.emit('ConnectComplete', null, this);
  }

  async Close(): Promise<void> {
    this.emit('WillDisconnect');
    this.State = ConnectionState.Closed;
    this.emit('Disconnect');
  }

  async Execute(commandText: string, recordsAffected?: number[]): Promise<VB6Recordset> {
    if (this.State !== ConnectionState.Open) {
      throw new Error('Connection is not open');
    }

    this.State = ConnectionState.Executing;
    this.emit('WillExecute', commandText);

    try {
      const results = this.mockDb.executeQuery(commandText);
      const recordset = new ADORecordset();
      await recordset.loadData(results);

      if (recordsAffected) {
        recordsAffected[0] = results.length;
      }

      this.emit('ExecuteComplete', results.length, null, this);
      this.State = ConnectionState.Open;

      return recordset;
    } catch (error) {
      this.State = ConnectionState.Open;
      this.emit('ExecuteComplete', 0, error, this);
      throw error;
    }
  }

  BeginTrans(): number {
    this.emit('BeginTransComplete', 1);
    return 1;
  }

  CommitTrans(): void {
    this.emit('CommitTransComplete');
  }

  RollbackTrans(): void {
    this.emit('RollbackTransComplete');
  }
}

// ADO Recordset implementation
export class ADORecordset extends EventEmitter implements VB6Recordset {
  Fields: { [key: string]: VB6Field } = {};
  RecordCount: number = 0;
  AbsolutePosition: number = 0;
  BOF: boolean = true;
  EOF: boolean = true;
  State: number = 0;
  CursorType: CursorType = CursorType.adOpenForwardOnly;
  LockType: LockType = LockType.adLockReadOnly;
  Source: string = '';
  Filter: string = '';
  Sort: string = '';

  private records: VB6Record[] = [];
  private currentPosition: number = -1;
  private mockDb = MockDatabase.getInstance();

  async Open(
    source: string,
    connection: VB6Connection,
    cursorType: CursorType = CursorType.adOpenStatic,
    lockType: LockType = LockType.adLockReadOnly
  ): Promise<void> {
    this.Source = source;
    this.CursorType = cursorType;
    this.LockType = lockType;

    this.emit('WillOpen', source, cursorType, lockType, connection);

    try {
      const results = this.mockDb.executeQuery(source);
      await this.loadData(results);
      this.emit('OpenComplete', null, this);
    } catch (error) {
      this.emit('OpenComplete', error, this);
      throw error;
    }
  }

  async loadData(data: any[]): Promise<void> {
    this.records = [];
    this.Fields = {};

    if (data.length > 0) {
      // Create field definitions
      const firstRecord = data[0];
      Object.keys(firstRecord).forEach((key, index) => {
        const value = firstRecord[key];
        let dataType = DataType.adVarChar;

        if (typeof value === 'number') {
          dataType = Number.isInteger(value) ? DataType.adInteger : DataType.adDouble;
        } else if (typeof value === 'boolean') {
          dataType = DataType.adBoolean;
        } else if (value instanceof Date) {
          dataType = DataType.adDate;
        }

        this.Fields[key] = {
          Name: key,
          Type: dataType,
          Value: value,
          DefinedSize: 255,
          ActualSize: String(value).length,
          Attributes: 0,
          Precision: 0,
          NumericScale: 0,
        };
      });

      // Convert data to records
      this.records = data.map((item, index) => ({
        fields: Object.keys(item).reduce(
          (fields, key) => {
            fields[key] = {
              ...this.Fields[key],
              Value: item[key],
            };
            return fields;
          },
          {} as { [key: string]: VB6Field }
        ),
        recordNumber: index,
      }));

      this.RecordCount = this.records.length;
      this.currentPosition = 0;
      this.BOF = false;
      this.EOF = this.records.length === 0;
      this.AbsolutePosition = 1;

      // Update current field values
      if (this.records.length > 0) {
        this.updateCurrentFields();
      }
    } else {
      this.RecordCount = 0;
      this.BOF = true;
      this.EOF = true;
      this.AbsolutePosition = 0;
    }

    this.State = 1; // Open
  }

  Close(): void {
    this.emit('WillClose');
    this.State = 0; // Closed
    this.records = [];
    this.Fields = {};
    this.currentPosition = -1;
    this.BOF = true;
    this.EOF = true;
    this.RecordCount = 0;
  }

  MoveFirst(): void {
    if (this.records.length > 0) {
      this.currentPosition = 0;
      this.AbsolutePosition = 1;
      this.BOF = false;
      this.EOF = false;
      this.updateCurrentFields();
      this.emit('MoveComplete', null, this);
    }
  }

  MoveLast(): void {
    if (this.records.length > 0) {
      this.currentPosition = this.records.length - 1;
      this.AbsolutePosition = this.records.length;
      this.BOF = false;
      this.EOF = false;
      this.updateCurrentFields();
      this.emit('MoveComplete', null, this);
    }
  }

  MoveNext(): void {
    if (this.currentPosition < this.records.length - 1) {
      this.currentPosition++;
      this.AbsolutePosition++;
      this.BOF = false;
      this.EOF = false;
      this.updateCurrentFields();
    } else {
      this.EOF = true;
      this.AbsolutePosition = this.records.length + 1;
    }
    this.emit('MoveComplete', null, this);
  }

  MovePrevious(): void {
    if (this.currentPosition > 0) {
      this.currentPosition--;
      this.AbsolutePosition--;
      this.BOF = false;
      this.EOF = false;
      this.updateCurrentFields();
    } else {
      this.BOF = true;
      this.AbsolutePosition = 0;
    }
    this.emit('MoveComplete', null, this);
  }

  Move(numRecords: number): void {
    const newPosition = this.currentPosition + numRecords;

    if (newPosition < 0) {
      this.currentPosition = -1;
      this.BOF = true;
      this.EOF = false;
      this.AbsolutePosition = 0;
    } else if (newPosition >= this.records.length) {
      this.currentPosition = this.records.length;
      this.BOF = false;
      this.EOF = true;
      this.AbsolutePosition = this.records.length + 1;
    } else {
      this.currentPosition = newPosition;
      this.AbsolutePosition = newPosition + 1;
      this.BOF = false;
      this.EOF = false;
      this.updateCurrentFields();
    }

    this.emit('MoveComplete', null, this);
  }

  AddNew(): void {
    if (this.LockType === LockType.adLockReadOnly) {
      throw new Error('Cannot add new record to read-only recordset');
    }

    // Create new empty record
    const newRecord: VB6Record = {
      fields: {},
      recordNumber: this.records.length,
    };

    Object.keys(this.Fields).forEach(key => {
      newRecord.fields[key] = {
        ...this.Fields[key],
        Value: null,
      };
    });

    this.records.push(newRecord);
    this.currentPosition = this.records.length - 1;
    this.RecordCount = this.records.length;
    this.AbsolutePosition = this.records.length;
    this.BOF = false;
    this.EOF = false;
    this.updateCurrentFields();

    this.emit('RecordChangeComplete', 1, null, this); // adRsnAddNew
  }

  Update(): void {
    if (this.LockType === LockType.adLockReadOnly) {
      throw new Error('Cannot update read-only recordset');
    }

    this.emit('WillChangeRecord', 2, this); // adRsnUpdate
    // In a real implementation, this would save changes to the database
    this.emit('RecordChangeComplete', 2, null, this);
  }

  Delete(): void {
    if (this.LockType === LockType.adLockReadOnly) {
      throw new Error('Cannot delete from read-only recordset');
    }

    if (this.currentPosition >= 0 && this.currentPosition < this.records.length) {
      this.emit('WillChangeRecord', 4, this); // adRsnDelete
      this.records.splice(this.currentPosition, 1);
      this.RecordCount = this.records.length;

      if (this.currentPosition >= this.records.length) {
        this.currentPosition = this.records.length - 1;
      }

      if (this.records.length === 0) {
        this.BOF = true;
        this.EOF = true;
        this.AbsolutePosition = 0;
      } else {
        this.updateCurrentFields();
      }

      this.emit('RecordChangeComplete', 4, null, this);
    }
  }

  Find(criteria: string): boolean {
    // Simple find implementation
    for (let i = this.currentPosition + 1; i < this.records.length; i++) {
      const record = this.records[i];
      if (this.evaluateCriteria(record, criteria)) {
        this.currentPosition = i;
        this.AbsolutePosition = i + 1;
        this.BOF = false;
        this.EOF = false;
        this.updateCurrentFields();
        return true;
      }
    }

    this.EOF = true;
    return false;
  }

  Clone(): VB6Recordset {
    const clone = new ADORecordset();
    clone.loadData(
      this.records.map(r => {
        const data: any = {};
        Object.keys(r.fields).forEach(key => {
          data[key] = r.fields[key].Value;
        });
        return data;
      })
    );
    return clone;
  }

  GetRows(rows: number = -1): any[][] {
    const startPos = this.currentPosition;
    const endPos =
      rows === -1 ? this.records.length : Math.min(startPos + rows, this.records.length);

    const result: any[][] = [];
    const fieldNames = Object.keys(this.Fields);

    for (let i = startPos; i < endPos; i++) {
      const row: any[] = [];
      fieldNames.forEach(fieldName => {
        row.push(this.records[i].fields[fieldName].Value);
      });
      result.push(row);
    }

    return result;
  }

  private updateCurrentFields(): void {
    if (this.currentPosition >= 0 && this.currentPosition < this.records.length) {
      const currentRecord = this.records[this.currentPosition];
      Object.keys(this.Fields).forEach(key => {
        this.Fields[key].Value = currentRecord.fields[key].Value;
      });
    }
  }

  private evaluateCriteria(record: VB6Record, criteria: string): boolean {
    // Simple criteria evaluation (e.g., "Name = 'John'")
    const match = criteria.match(/(\w+)\s*(=|<>|<|>)\s*'?([^']*)'?/);
    if (!match) return false;

    const [, fieldName, operator, value] = match;
    const fieldValue = record.fields[fieldName]?.Value;

    switch (operator) {
      case '=':
        return fieldValue == value;
      case '<>':
        return fieldValue != value;
      case '<':
        return fieldValue < value;
      case '>':
        return fieldValue > value;
      default:
        return false;
    }
  }
}

// Database Service Manager
export class VB6DatabaseService {
  private static instance: VB6DatabaseService;
  private connections: Map<string, ADOConnection> = new Map();

  static getInstance(): VB6DatabaseService {
    if (!VB6DatabaseService.instance) {
      VB6DatabaseService.instance = new VB6DatabaseService();
    }
    return VB6DatabaseService.instance;
  }

  createConnection(name?: string): ADOConnection {
    const connection = new ADOConnection();
    const connectionName = name || `conn_${Date.now()}`;
    this.connections.set(connectionName, connection);
    return connection;
  }

  getConnection(name: string): ADOConnection | undefined {
    return this.connections.get(name);
  }

  removeConnection(name: string): boolean {
    const connection = this.connections.get(name);
    if (connection && connection.State === ConnectionState.Open) {
      connection.Close();
    }
    return this.connections.delete(name);
  }

  getAllConnections(): Map<string, ADOConnection> {
    return new Map(this.connections);
  }

  createRecordset(): ADORecordset {
    return new ADORecordset();
  }

  // Convenience methods for common database operations
  async executeSQL(connectionString: string, sql: string): Promise<any[]> {
    const conn = this.createConnection();
    try {
      await conn.Open(connectionString);
      const rs = await conn.Execute(sql);
      const data = rs.GetRows();
      await conn.Close();
      return data;
    } catch (error) {
      if (conn.State === ConnectionState.Open) {
        await conn.Close();
      }
      throw error;
    }
  }

  getAvailableTables(): string[] {
    return MockDatabase.getInstance().getTables();
  }

  getTableSchema(tableName: string): { [key: string]: string } {
    return MockDatabase.getInstance().getTableSchema(tableName);
  }
}

// Global ADO constants for VB6 compatibility
export const adConstants = {
  // Connection states
  adStateClosed: ConnectionState.Closed,
  adStateOpen: ConnectionState.Open,
  adStateConnecting: ConnectionState.Connecting,
  adStateExecuting: ConnectionState.Executing,
  adStateFetching: ConnectionState.Fetching,

  // Cursor types
  adOpenUnspecified: CursorType.adOpenUnspecified,
  adOpenForwardOnly: CursorType.adOpenForwardOnly,
  adOpenKeyset: CursorType.adOpenKeyset,
  adOpenDynamic: CursorType.adOpenDynamic,
  adOpenStatic: CursorType.adOpenStatic,

  // Lock types
  adLockUnspecified: LockType.adLockUnspecified,
  adLockReadOnly: LockType.adLockReadOnly,
  adLockPessimistic: LockType.adLockPessimistic,
  adLockOptimistic: LockType.adLockOptimistic,
  adLockBatchOptimistic: LockType.adLockBatchOptimistic,

  // Data types
  adEmpty: DataType.adEmpty,
  adTinyInt: DataType.adTinyInt,
  adSmallInt: DataType.adSmallInt,
  adInteger: DataType.adInteger,
  adBigInt: DataType.adBigInt,
  adSingle: DataType.adSingle,
  adDouble: DataType.adDouble,
  adCurrency: DataType.adCurrency,
  adDecimal: DataType.adDecimal,
  adNumeric: DataType.adNumeric,
  adBoolean: DataType.adBoolean,
  adDate: DataType.adDate,
  adBSTR: DataType.adBSTR,
  adChar: DataType.adChar,
  adVarChar: DataType.adVarChar,
  adLongVarChar: DataType.adLongVarChar,
};

export const vb6DatabaseService = VB6DatabaseService.getInstance();
