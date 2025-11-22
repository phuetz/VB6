/**
 * VB6 Database Objects Implementation
 * 
 * Web-compatible implementation of ADO, DAO, RDO objects
 * Provides database connectivity simulation for VB6 applications
 */

import { errorHandler } from './VB6ErrorHandling';
import crypto from 'crypto';

// Connection States
export enum ConnectionState {
  adStateClosed = 0,
  adStateOpen = 1,
  adStateConnecting = 2,
  adStateExecuting = 4,
  adStateFetching = 8
}

// Cursor Types
export enum CursorType {
  adOpenForwardOnly = 0,
  adOpenKeyset = 1,
  adOpenDynamic = 2,
  adOpenStatic = 3
}

// Lock Types
export enum LockType {
  adLockReadOnly = 1,
  adLockPessimistic = 2,
  adLockOptimistic = 3,
  adLockBatchOptimistic = 4
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
  adLongVarBinary = 205
}

// Simulated Database Storage
class VB6DatabaseEngine {
  private static instance: VB6DatabaseEngine;
  private databases: Map<string, VB6Database> = new Map();
  private connections: Map<string, VB6Connection> = new Map();

  static getInstance(): VB6DatabaseEngine {
    if (!VB6DatabaseEngine.instance) {
      VB6DatabaseEngine.instance = new VB6DatabaseEngine();
    }
    return VB6DatabaseEngine.instance;
  }

  constructor() {
    // Initialize with sample databases
    this.initializeSampleDatabases();
  }

  private initializeSampleDatabises() {
    // Create sample Northwind-style database
    const northwind = new VB6Database('Northwind');
    
    // Sample Customers table
    const customers = new VB6Table('Customers');
    customers.addField('CustomerID', DataType.adVarChar, 5);
    customers.addField('CompanyName', DataType.adVarChar, 40);
    customers.addField('ContactName', DataType.adVarChar, 30);
    customers.addField('Country', DataType.adVarChar, 15);
    
    // Sample data
    customers.addRecord(['ALFKI', 'Alfreds Futterkiste', 'Maria Anders', 'Germany']);
    customers.addRecord(['ANATR', 'Ana Trujillo Emparedados', 'Ana Trujillo', 'Mexico']);
    customers.addRecord(['ANTON', 'Antonio Moreno Taquería', 'Antonio Moreno', 'Mexico']);
    
    northwind.addTable(customers);
    
    // Sample Products table
    const products = new VB6Table('Products');
    products.addField('ProductID', DataType.adInteger, 0);
    products.addField('ProductName', DataType.adVarChar, 40);
    products.addField('UnitPrice', DataType.adCurrency, 0);
    products.addField('UnitsInStock', DataType.adSmallInt, 0);
    
    products.addRecord([1, 'Chai', 18, 39]);
    products.addRecord([2, 'Chang', 19, 17]);
    products.addRecord([3, 'Aniseed Syrup', 10, 13]);
    
    northwind.addTable(products);
    
    this.databases.set('Northwind', northwind);
  }

  createConnection(connectionString: string): VB6Connection {
    // CRYPTOGRAPHIC BUG FIX: Use cryptographically secure ID generation
    const connectionId = crypto.randomBytes(16).toString('hex');
    const connection = new VB6Connection(connectionId, connectionString);
    this.connections.set(connectionId, connection);
    return connection;
  }

  openDatabase(path: string): VB6Database {
    // Extract database name from path
    const dbName = path.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
    
    // Return existing or create new database
    if (this.databases.has(dbName)) {
      return this.databases.get(dbName)!;
    }
    
    const newDb = new VB6Database(dbName);
    this.databases.set(dbName, newDb);
    return newDb;
  }
}

// VB6 Connection Object (ADO)
export class VB6Connection {
  public ConnectionString: string = '';
  public State: ConnectionState = ConnectionState.adStateClosed;
  public CommandTimeout: number = 30;
  public ConnectionTimeout: number = 15;
  public Version: string = '6.0';

  private id: string;
  private isOpen: boolean = false;

  constructor(id: string, connectionString: string = '') {
    this.id = id;
    this.ConnectionString = connectionString;
  }

  Open(connectionString?: string, userId?: string, password?: string, options?: number): void {
    try {
      if (connectionString) {
        this.ConnectionString = connectionString;
      }
      
      if (!this.ConnectionString) {
        errorHandler.raiseError(3709, 'Connection string not specified', 'Connection.Open');
        return;
      }

      // INTEGRATION BUG FIX: Remove async setTimeout that creates race conditions
      // Set connection state immediately to match VB6 synchronous behavior
      this.State = ConnectionState.adStateOpen;
      this.isOpen = true;

      console.log(`[VB6 Database] Connected to: ${this.ConnectionString}`);
    } catch (error) {
      errorHandler.raiseError(3709, 'Connection failed', 'Connection.Open');
    }
  }

  Close(): void {
    this.State = ConnectionState.adStateClosed;
    this.isOpen = false;
    console.log(`[VB6 Database] Connection closed`);
  }

  Execute(commandText: string, recordsAffected?: any, options?: number): VB6Recordset {
    if (!this.isOpen) {
      errorHandler.raiseError(3709, 'Connection is not open', 'Connection.Execute');
      return new VB6Recordset();
    }

    // INTEGRATION BUG FIX: Validate SQL command before execution
    if (!commandText || typeof commandText !== 'string') {
      errorHandler.raiseError(3709, 'Invalid SQL command: command must be a non-empty string', 'Connection.Execute');
      return new VB6Recordset();
    }

    console.log(`[VB6 Database] Executing: ${commandText}`);
    
    // Parse simple SQL commands
    const sql = commandText.toUpperCase().trim();
    
    if (sql.startsWith('SELECT')) {
      return this.executeSelect(commandText);
    } else if (sql.startsWith('INSERT')) {
      return this.executeInsert(commandText);
    } else if (sql.startsWith('UPDATE')) {
      return this.executeUpdate(commandText);
    } else if (sql.startsWith('DELETE')) {
      return this.executeDelete(commandText);
    } else {
      // INTEGRATION BUG FIX: Don't silently fail on unsupported SQL commands
      errorHandler.raiseError(3709, `Unsupported SQL command: ${sql.substring(0, 50)}`, 'Connection.Execute');
      return new VB6Recordset();
    }
  }

  private executeSelect(sql: string): VB6Recordset {
    // Simplified SQL parsing for demo
    const recordset = new VB6Recordset();
    
    // Mock data based on common table names
    if (sql.includes('CUSTOMERS')) {
      recordset.addField('CustomerID', DataType.adVarChar);
      recordset.addField('CompanyName', DataType.adVarChar);
      recordset.addRecord(['ALFKI', 'Alfreds Futterkiste']);
      recordset.addRecord(['ANATR', 'Ana Trujillo Emparedados']);
    } else if (sql.includes('PRODUCTS')) {
      recordset.addField('ProductID', DataType.adInteger);
      recordset.addField('ProductName', DataType.adVarChar);
      recordset.addField('UnitPrice', DataType.adCurrency);
      recordset.addRecord([1, 'Chai', 18]);
      recordset.addRecord([2, 'Chang', 19]);
    }
    
    return recordset;
  }

  private executeInsert(sql: string): VB6Recordset {
    console.log(`[VB6 Database] Insert executed: ${sql}`);
    return new VB6Recordset();
  }

  private executeUpdate(sql: string): VB6Recordset {
    console.log(`[VB6 Database] Update executed: ${sql}`);
    return new VB6Recordset();
  }

  private executeDelete(sql: string): VB6Recordset {
    console.log(`[VB6 Database] Delete executed: ${sql}`);
    return new VB6Recordset();
  }

  BeginTrans(): void {
    console.log(`[VB6 Database] Transaction started`);
  }

  CommitTrans(): void {
    console.log(`[VB6 Database] Transaction committed`);
  }

  RollbackTrans(): void {
    console.log(`[VB6 Database] Transaction rolled back`);
  }
}

// VB6 Recordset Object (ADO)
export class VB6Recordset {
  public BOF: boolean = true;
  public EOF: boolean = true;
  public RecordCount: number = 0;
  public AbsolutePosition: number = 0;
  public CursorType: CursorType = CursorType.adOpenForwardOnly;
  public LockType: LockType = LockType.adLockReadOnly;
  public State: number = 0;

  private fields: Map<string, VB6Field> = new Map();
  private records: any[][] = [];
  private currentRecord: number = -1;

  constructor() {}

  addField(name: string, type: DataType, size: number = 0): void {
    const field = new VB6Field(name, type, size);
    this.fields.set(name.toUpperCase(), field);
  }

  addRecord(values: any[]): void {
    this.records.push(values);
    this.RecordCount = this.records.length;
    
    if (this.records.length === 1) {
      this.BOF = false;
      this.EOF = false;
      this.currentRecord = 0;
      this.AbsolutePosition = 1;
    } else {
      this.EOF = false;
    }
  }

  Open(source?: string, activeConnection?: VB6Connection, cursorType?: CursorType, lockType?: LockType, options?: number): void {
    if (typeof source === 'string' && source.toUpperCase().includes('SELECT')) {
      // Execute SQL query
      if (activeConnection) {
        const result = activeConnection.Execute(source);
        this.fields = result.fields;
        this.records = result.records;
        this.RecordCount = result.RecordCount;
        this.BOF = result.BOF;
        this.EOF = result.EOF;
        this.currentRecord = result.currentRecord;
      }
    }
    
    this.State = 1; // adStateOpen
    console.log(`[VB6 Database] Recordset opened with ${this.RecordCount} records`);
  }

  Close(): void {
    this.State = 0; // adStateClosed
    console.log(`[VB6 Database] Recordset closed`);
  }

  MoveFirst(): void {
    if (this.RecordCount > 0) {
      this.currentRecord = 0;
      this.BOF = false;
      this.EOF = false;
      this.AbsolutePosition = 1;
    }
  }

  MoveLast(): void {
    if (this.RecordCount > 0) {
      this.currentRecord = this.RecordCount - 1;
      this.BOF = false;
      this.EOF = false;
      this.AbsolutePosition = this.RecordCount;
    }
  }

  MoveNext(): void {
    if (this.currentRecord < this.RecordCount - 1) {
      this.currentRecord++;
      this.AbsolutePosition++;
      this.BOF = false;
      this.EOF = false;
    } else {
      this.EOF = true;
    }
  }

  MovePrevious(): void {
    if (this.currentRecord > 0) {
      this.currentRecord--;
      this.AbsolutePosition--;
      this.BOF = false;
      this.EOF = false;
    } else {
      this.BOF = true;
    }
  }

  Fields(nameOrIndex: string | number): VB6Field {
    if (typeof nameOrIndex === 'string') {
      const field = this.fields.get(nameOrIndex.toUpperCase());
      if (field && this.currentRecord >= 0 && this.currentRecord < this.records.length) {
        const fieldNames = Array.from(this.fields.keys());
        const fieldIndex = fieldNames.indexOf(nameOrIndex.toUpperCase());
        if (fieldIndex >= 0) {
          field.Value = this.records[this.currentRecord][fieldIndex];
        }
      }
      return field || new VB6Field(nameOrIndex, DataType.adEmpty);
    } else {
      const fieldNames = Array.from(this.fields.keys());
      if (nameOrIndex >= 0 && nameOrIndex < fieldNames.length) {
        const fieldName = fieldNames[nameOrIndex];
        const field = this.fields.get(fieldName)!;
        if (this.currentRecord >= 0 && this.currentRecord < this.records.length) {
          field.Value = this.records[this.currentRecord][nameOrIndex];
        }
        return field;
      }
      return new VB6Field('', DataType.adEmpty);
    }
  }

  AddNew(): void {
    // Add empty record
    const newRecord = new Array(this.fields.size).fill(null);
    this.records.push(newRecord);
    this.currentRecord = this.records.length - 1;
    this.RecordCount = this.records.length;
    this.AbsolutePosition = this.RecordCount;
    this.EOF = false;
    this.BOF = false;
  }

  Update(): void {
    console.log(`[VB6 Database] Record updated`);
  }

  Delete(): void {
    if (this.currentRecord >= 0 && this.currentRecord < this.records.length) {
      this.records.splice(this.currentRecord, 1);
      this.RecordCount = this.records.length;
      
      if (this.currentRecord >= this.RecordCount) {
        this.currentRecord = this.RecordCount - 1;
        this.EOF = true;
      }
      
      if (this.RecordCount === 0) {
        this.BOF = true;
        this.EOF = true;
        this.currentRecord = -1;
      }
    }
  }

  Clone(): VB6Recordset {
    const clone = new VB6Recordset();
    clone.fields = new Map(this.fields);
    clone.records = this.records.map(record => [...record]);
    clone.RecordCount = this.RecordCount;
    clone.BOF = this.BOF;
    clone.EOF = this.EOF;
    clone.currentRecord = this.currentRecord;
    return clone;
  }
}

// VB6 Field Object
export class VB6Field {
  public Name: string;
  public Type: DataType;
  public Size: number;
  public Value: any = null;
  public OriginalValue: any = null;
  public Precision: number = 0;
  public NumericScale: number = 0;

  constructor(name: string, type: DataType, size: number = 0) {
    this.Name = name;
    this.Type = type;
    this.Size = size;
  }

  GetChunk(length: number): any {
    if (this.Type === DataType.adLongVarBinary || this.Type === DataType.adLongVarChar) {
      return this.Value ? this.Value.substring(0, length) : '';
    }
    return this.Value;
  }

  AppendChunk(data: any): void {
    if (this.Type === DataType.adLongVarBinary || this.Type === DataType.adLongVarChar) {
      this.Value = (this.Value || '') + data;
    }
  }
}

// VB6 Database Object (DAO)
export class VB6Database {
  public Name: string;
  public Version: string = '6.0';
  public Connect: string = '';
  public QueryTimeout: number = 60;

  private tables: Map<string, VB6Table> = new Map();
  private isOpen: boolean = false;

  constructor(name: string) {
    this.Name = name;
  }

  addTable(table: VB6Table): void {
    this.tables.set(table.Name.toUpperCase(), table);
  }

  OpenRecordset(source: string, type?: number, options?: number, lockEdit?: number): VB6Recordset {
    const recordset = new VB6Recordset();
    
    // Simple table lookup
    const tableName = source.toUpperCase().replace(/['"]/g, '');
    if (this.tables.has(tableName)) {
      const table = this.tables.get(tableName)!;
      return table.getRecordset();
    }
    
    // SQL query simulation
    if (source.toUpperCase().includes('SELECT')) {
      return this.executeQuery(source);
    }
    
    return recordset;
  }

  private executeQuery(sql: string): VB6Recordset {
    try {
      // ERROR HANDLING BUG FIX: Validate SQL and handle execution errors
      if (!sql || typeof sql !== 'string') {
        throw new Error('Invalid SQL query: query must be a non-empty string');
      }

      const trimmedSql = sql.trim();
      if (trimmedSql.length === 0) {
        throw new Error('Invalid SQL query: query cannot be empty');
      }

      // Basic SQL validation to prevent obviously malformed queries
      const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
      const firstWord = trimmedSql.split(/\s+/)[0].toUpperCase();
      if (!sqlKeywords.includes(firstWord)) {
        throw new Error(`Invalid SQL query: '${firstWord}' is not a recognized SQL keyword`);
      }

      // Very simplified SQL parsing
      const recordset = new VB6Recordset();
      console.log(`[VB6 DAO] Executing query: ${sql}`);
      return recordset;
    } catch (error) {
      console.error(`[VB6 DAO] Query execution failed: ${error.message}`);
      const errorRecordset = new VB6Recordset();
      errorRecordset.State = 0; // adStateClosed
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  Execute(query: string): void {
    try {
      // ERROR HANDLING BUG FIX: Validate query and handle execution errors
      if (!query || typeof query !== 'string') {
        throw new Error('Invalid query: query must be a non-empty string');
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        throw new Error('Invalid query: query cannot be empty');
      }

      // Basic validation for potentially dangerous operations
      const dangerousPatterns = [
        /DROP\s+DATABASE/i,
        /DROP\s+TABLE.*\*/i,
        /DELETE\s+FROM.*WHERE.*1\s*=\s*1/i,
        /;\s*DROP/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(trimmedQuery)) {
          throw new Error('Potentially dangerous SQL operation blocked for safety');
        }
      }

      console.log(`[VB6 DAO] Executing statement: ${query}`);
    } catch (error) {
      console.error(`[VB6 DAO] Statement execution failed: ${error.message}`);
      throw new Error(`Database execution failed: ${error.message}`);
    }
  }

  Close(): void {
    this.isOpen = false;
    console.log(`[VB6 DAO] Database closed: ${this.Name}`);
  }
}

// VB6 Table Object (DAO)
export class VB6Table {
  public Name: string;
  private fields: VB6Field[] = [];
  private records: any[][] = [];

  constructor(name: string) {
    this.Name = name;
  }

  addField(name: string, type: DataType, size: number = 0): void {
    this.fields.push(new VB6Field(name, type, size));
  }

  addRecord(values: any[]): void {
    this.records.push(values);
  }

  getRecordset(): VB6Recordset {
    const recordset = new VB6Recordset();
    
    // Add fields
    this.fields.forEach(field => {
      recordset.addField(field.Name, field.Type, field.Size);
    });
    
    // Add records
    this.records.forEach(record => {
      recordset.addRecord(record);
    });
    
    return recordset;
  }
}

// Global Database Functions
export function OpenDatabase(name: string, options?: boolean, readOnly?: boolean, connect?: string): VB6Database {
  const engine = VB6DatabaseEngine.getInstance();
  return engine.openDatabase(name);
}

export function CreateObject(progId: string): any {
  const engine = VB6DatabaseEngine.getInstance();
  
  switch (progId.toUpperCase()) {
    case 'ADODB.CONNECTION':
      return engine.createConnection('');
    case 'ADODB.RECORDSET':
      return new VB6Recordset();
    case 'DAO.DBENGINE':
      return {
        OpenDatabase: OpenDatabase,
        Version: '6.0'
      };
    default:
      console.warn(`[VB6 Database] Unknown COM object: ${progId}`);
      return {};
  }
}

// Export all database objects and functions
export const VB6DatabaseObjects = {
  // ADO Objects
  Connection: VB6Connection,
  Recordset: VB6Recordset,
  Field: VB6Field,
  
  // DAO Objects  
  Database: VB6Database,
  Table: VB6Table,
  
  // Enums
  ConnectionState,
  CursorType,
  LockType,
  DataType,
  
  // Functions
  OpenDatabase,
  CreateObject
};