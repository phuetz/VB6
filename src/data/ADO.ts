/**
 * ADO (ActiveX Data Objects) - Complete VB6 Database Access Implementation
 * Provides comprehensive database connectivity with Connection, Recordset, Command objects
 */

import { COMObject, COM } from './COMActiveXBridge';
import { EventEmitter } from 'events';

// ADO Constants
export enum ConnectModeEnum {
  adModeUnknown = 0,
  adModeRead = 1,
  adModeWrite = 2,
  adModeReadWrite = 3,
  adModeShareDenyRead = 4,
  adModeShareDenyWrite = 8,
  adModeShareExclusive = 12,
  adModeShareDenyNone = 16,
  adModeRecursive = 0x400000
}

export enum CursorTypeEnum {
  adOpenUnspecified = -1,
  adOpenForwardOnly = 0,
  adOpenKeyset = 1,
  adOpenDynamic = 2,
  adOpenStatic = 3
}

export enum LockTypeEnum {
  adLockUnspecified = -1,
  adLockReadOnly = 1,
  adLockPessimistic = 2,
  adLockOptimistic = 3,
  adLockBatchOptimistic = 4
}

export enum CommandTypeEnum {
  adCmdUnspecified = -1,
  adCmdUnknown = 8,
  adCmdText = 1,
  adCmdTable = 2,
  adCmdStoredProc = 4,
  adCmdFile = 256,
  adCmdTableDirect = 512
}

export enum ParameterDirectionEnum {
  adParamUnknown = 0,
  adParamInput = 1,
  adParamOutput = 2,
  adParamInputOutput = 3,
  adParamReturnValue = 4
}

export enum DataTypeEnum {
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
  adChapter = 136,
  adFileTime = 64,
  adPropVariant = 138,
  adVarNumeric = 139,
  adArray = 0x2000
}

export enum ObjectStateEnum {
  adStateClosed = 0,
  adStateOpen = 1,
  adStateConnecting = 2,
  adStateExecuting = 4,
  adStateFetching = 8
}

export enum EditModeEnum {
  adEditNone = 0,
  adEditInProgress = 1,
  adEditAdd = 2,
  adEditDelete = 4
}

export enum RecordStatusEnum {
  adRecOK = 0,
  adRecNew = 1,
  adRecModified = 2,
  adRecDeleted = 4,
  adRecUnmodified = 8,
  adRecInvalid = 16,
  adRecMultipleChanges = 64,
  adRecPendingChanges = 128,
  adRecCanceled = 256,
  adRecCantRelease = 1024,
  adRecConcurrencyViolation = 2048,
  adRecIntegrityViolation = 4096,
  adRecMaxChangesExceeded = 8192,
  adRecObjectOpen = 16384,
  adRecOutOfMemory = 32768,
  adRecPermissionDenied = 65536,
  adRecSchemaViolation = 131072,
  adRecDBDeleted = 262144
}

export interface ADOError {
  description: string;
  helpContext: number;
  helpFile: string;
  nativeError: number;
  number: number;
  source: string;
  sqlState: string;
}

export class ADOField extends COMObject {
  private _name: string;
  private _type: DataTypeEnum;
  private _value: any;
  private _definedSize: number;
  private _actualSize: number;
  private _attributes: number;
  private _precision: number;
  private _numericScale: number;
  private _originalValue: any;
  private _underlyingValue: any;

  constructor(name: string, type: DataTypeEnum, value: any = null) {
    super('{ADODB.Field}', 'ADODB.Field');
    this._name = name;
    this._type = type;
    this._value = value;
    this._originalValue = value;
    this._underlyingValue = value;
    this._definedSize = 0;
    this._actualSize = 0;
    this._attributes = 0;
    this._precision = 0;
    this._numericScale = 0;
    this.setupFieldProperties();
  }

  private setupFieldProperties(): void {
    this.setProperty('Name', this._name);
    this.setProperty('Type', this._type);
    this.setProperty('Value', this._value);
    this.setProperty('DefinedSize', this._definedSize);
    this.setProperty('ActualSize', this._actualSize);
    this.setProperty('Attributes', this._attributes);
    this.setProperty('Precision', this._precision);
    this.setProperty('NumericScale', this._numericScale);
    this.setProperty('OriginalValue', this._originalValue);
    this.setProperty('UnderlyingValue', this._underlyingValue);

    this.addMethod('AppendChunk', (data: any) => {
      if (typeof this._value === 'string') {
        this._value += String(data);
      } else {
        this._value = data;
      }
      this.setProperty('Value', this._value);
    });

    this.addMethod('GetChunk', (length: number) => {
      if (typeof this._value === 'string') {
        const chunk = this._value.substring(0, length);
        this._value = this._value.substring(length);
        this.setProperty('Value', this._value);
        return chunk;
      }
      return this._value;
    });
  }

  get Name(): string {
    return this._name;
  }

  get Type(): DataTypeEnum {
    return this._type;
  }

  get Value(): any {
    return this._value;
  }

  set Value(value: any) {
    this._value = value;
    this.setProperty('Value', value);
  }
}

export class ADOFields extends COMObject {
  private _fields: ADOField[] = [];
  private _items: Map<string, ADOField> = new Map();

  constructor() {
    super('{ADODB.Fields}', 'ADODB.Fields');
    this.setupFieldsCollection();
  }

  private setupFieldsCollection(): void {
    this.setProperty('Count', 0);

    this.addMethod('Item', (index: number | string): ADOField | null => {
      if (typeof index === 'number') {
        return this._fields[index] || null;
      } else {
        return this._items.get(index) || null;
      }
    });

    this.addMethod('Append', (name: string, type: DataTypeEnum, definedSize?: number, attrib?: number) => {
      const field = new ADOField(name, type);
      this._fields.push(field);
      this._items.set(name, field);
      this.setProperty('Count', this._fields.length);
    });

    this.addMethod('Delete', (index: number | string) => {
      if (typeof index === 'number') {
        const field = this._fields[index];
        if (field) {
          this._fields.splice(index, 1);
          this._items.delete(field.Name);
        }
      } else {
        const field = this._items.get(index);
        if (field) {
          const idx = this._fields.indexOf(field);
          if (idx >= 0) {
            this._fields.splice(idx, 1);
          }
          this._items.delete(index);
        }
      }
      this.setProperty('Count', this._fields.length);
    });

    this.addMethod('Refresh', () => {
      // Refresh field definitions from data source
      this.fireEvent('Refresh');
    });
  }

  addField(field: ADOField): void {
    this._fields.push(field);
    this._items.set(field.Name, field);
    this.setProperty('Count', this._fields.length);
  }

  get Count(): number {
    return this._fields.length;
  }

  get Fields(): ADOField[] {
    return [...this._fields];
  }
}

export class ADOParameter extends COMObject {
  private _name: string;
  private _type: DataTypeEnum;
  private _direction: ParameterDirectionEnum;
  private _size: number;
  private _value: any;
  private _precision: number;
  private _numericScale: number;

  constructor(name: string = '', type: DataTypeEnum = DataTypeEnum.adVarChar, direction: ParameterDirectionEnum = ParameterDirectionEnum.adParamInput) {
    super('{ADODB.Parameter}', 'ADODB.Parameter');
    this._name = name;
    this._type = type;
    this._direction = direction;
    this._size = 0;
    this._value = null;
    this._precision = 0;
    this._numericScale = 0;
    this.setupParameterProperties();
  }

  private setupParameterProperties(): void {
    this.setProperty('Name', this._name);
    this.setProperty('Type', this._type);
    this.setProperty('Direction', this._direction);
    this.setProperty('Size', this._size);
    this.setProperty('Value', this._value);
    this.setProperty('Precision', this._precision);
    this.setProperty('NumericScale', this._numericScale);
  }

  get Name(): string {
    return this._name;
  }

  set Name(value: string) {
    this._name = value;
    this.setProperty('Name', value);
  }

  get Type(): DataTypeEnum {
    return this._type;
  }

  set Type(value: DataTypeEnum) {
    this._type = value;
    this.setProperty('Type', value);
  }

  get Value(): any {
    return this._value;
  }

  set Value(value: any) {
    this._value = value;
    this.setProperty('Value', value);
  }
}

export class ADOParameters extends COMObject {
  private _parameters: ADOParameter[] = [];
  private _items: Map<string, ADOParameter> = new Map();

  constructor() {
    super('{ADODB.Parameters}', 'ADODB.Parameters');
    this.setupParametersCollection();
  }

  private setupParametersCollection(): void {
    this.setProperty('Count', 0);

    this.addMethod('Item', (index: number | string): ADOParameter | null => {
      if (typeof index === 'number') {
        return this._parameters[index] || null;
      } else {
        return this._items.get(index) || null;
      }
    });

    this.addMethod('Append', (parameter: ADOParameter) => {
      this._parameters.push(parameter);
      if (parameter.Name) {
        this._items.set(parameter.Name, parameter);
      }
      this.setProperty('Count', this._parameters.length);
    });

    this.addMethod('Delete', (index: number | string) => {
      if (typeof index === 'number') {
        const param = this._parameters[index];
        if (param) {
          this._parameters.splice(index, 1);
          if (param.Name) {
            this._items.delete(param.Name);
          }
        }
      } else {
        const param = this._items.get(index);
        if (param) {
          const idx = this._parameters.indexOf(param);
          if (idx >= 0) {
            this._parameters.splice(idx, 1);
          }
          this._items.delete(index);
        }
      }
      this.setProperty('Count', this._parameters.length);
    });

    this.addMethod('Refresh', () => {
      // Refresh parameters from command
      this.fireEvent('Refresh');
    });
  }

  get Count(): number {
    return this._parameters.length;
  }

  get Parameters(): ADOParameter[] {
    return [...this._parameters];
  }
}

export class ADOConnection extends COMObject {
  private _connectionString: string = '';
  private _state: ObjectStateEnum = ObjectStateEnum.adStateClosed;
  private _connectionTimeout: number = 15;
  private _commandTimeout: number = 30;
  private _mode: ConnectModeEnum = ConnectModeEnum.adModeUnknown;
  private _provider: string = 'MSDASQL';
  private _version: string = '2.8';
  private _errors: ADOError[] = [];
  private _database: any = null; // Simulated database connection

  constructor() {
    super('{ADODB.Connection}', 'ADODB.Connection');
    this.setupConnectionMethods();
  }

  private setupConnectionMethods(): void {
    this.setProperty('ConnectionString', this._connectionString);
    this.setProperty('State', this._state);
    this.setProperty('ConnectionTimeout', this._connectionTimeout);
    this.setProperty('CommandTimeout', this._commandTimeout);
    this.setProperty('Mode', this._mode);
    this.setProperty('Provider', this._provider);
    this.setProperty('Version', this._version);

    this.addMethod('Open', (connectionString?: string, userID?: string, password?: string, options?: number) => {
      if (connectionString) {
        this._connectionString = connectionString;
        this.setProperty('ConnectionString', connectionString);
      }

      try {
        this._state = ObjectStateEnum.adStateConnecting;
        this.setProperty('State', this._state);
        this.fireEvent('WillConnect', { connectionString, userID, password, options });

        // Simulate connection process
        setTimeout(() => {
          this._state = ObjectStateEnum.adStateOpen;
          this.setProperty('State', this._state);
          this._database = this.createSimulatedDatabase();
          this.fireEvent('ConnectComplete', { error: null, status: 0, connection: this });
        }, 100);

      } catch (error) {
        this._state = ObjectStateEnum.adStateClosed;
        this.setProperty('State', this._state);
        this.addError('Connection failed', error);
        this.fireEvent('ConnectComplete', { error, status: -1, connection: this });
        throw error;
      }
    });

    this.addMethod('Close', () => {
      if (this._state !== ObjectStateEnum.adStateClosed) {
        this.fireEvent('WillDisconnect', { connection: this });
        this._state = ObjectStateEnum.adStateClosed;
        this.setProperty('State', this._state);
        this._database = null;
        this.fireEvent('Disconnect', { connection: this });
      }
    });

    this.addMethod('Execute', (commandText: string, recordsAffected?: any, options?: number) => {
      if (this._state !== ObjectStateEnum.adStateOpen) {
        throw new Error('Connection is not open');
      }

      this.fireEvent('WillExecute', { source: commandText, cursorType: 0, lockType: 0, options, connection: this });

      try {
        // Simulate SQL execution
        const result = this.executeSQL(commandText);
        
        if (recordsAffected && recordsAffected.value !== undefined) {
          recordsAffected.value = result.recordsAffected || 0;
        }

        this.fireEvent('ExecuteComplete', { recordsAffected: result.recordsAffected, error: null, status: 0, command: null, recordset: result.recordset, connection: this });
        
        return result.recordset;
      } catch (error) {
        this.addError('Execute failed', error);
        this.fireEvent('ExecuteComplete', { recordsAffected: 0, error, status: -1, command: null, recordset: null, connection: this });
        throw error;
      }
    });

    this.addMethod('BeginTrans', () => {
      // Begin transaction
      this.fireEvent('BeginTransComplete', { transactionLevel: 1, error: null, status: 0, connection: this });
      return 1;
    });

    this.addMethod('CommitTrans', () => {
      // Commit transaction
      this.fireEvent('CommitTransComplete', { error: null, status: 0, connection: this });
    });

    this.addMethod('RollbackTrans', () => {
      // Rollback transaction
      this.fireEvent('RollbackTransComplete', { error: null, status: 0, connection: this });
    });

    this.addMethod('OpenSchema', (schema: number, restrictions?: any[], schemaID?: string) => {
      // Return schema information
      const schemaRecordset = new ADORecordset();
      // Populate with schema data based on schema type
      return schemaRecordset;
    });
  }

  private createSimulatedDatabase(): any {
    // Create a simple in-memory database simulation
    return {
      tables: new Map([
        ['Users', [
          { ID: 1, Name: 'John Doe', Email: 'john@example.com', Age: 30 },
          { ID: 2, Name: 'Jane Smith', Email: 'jane@example.com', Age: 25 },
          { ID: 3, Name: 'Bob Johnson', Email: 'bob@example.com', Age: 35 }
        ]],
        ['Products', [
          { ID: 1, Name: 'Widget A', Price: 19.99, Category: 'Widgets' },
          { ID: 2, Name: 'Gadget B', Price: 29.99, Category: 'Gadgets' },
          { ID: 3, Name: 'Tool C', Price: 39.99, Category: 'Tools' }
        ]]
      ])
    };
  }

  private executeSQL(sql: string): { recordset?: ADORecordset, recordsAffected?: number } {
    if (!this._database) {
      throw new Error('Database not connected');
    }

    const sqlUpper = sql.trim().toUpperCase();
    
    if (sqlUpper.startsWith('SELECT')) {
      return this.executeSelect(sql);
    } else if (sqlUpper.startsWith('INSERT')) {
      return this.executeInsert(sql);
    } else if (sqlUpper.startsWith('UPDATE')) {
      return this.executeUpdate(sql);
    } else if (sqlUpper.startsWith('DELETE')) {
      return this.executeDelete(sql);
    } else {
      // DDL or other commands
      return { recordsAffected: 0 };
    }
  }

  private executeSelect(sql: string): { recordset: ADORecordset } {
    const recordset = new ADORecordset();
    
    // Simple SQL parsing (very basic)
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (fromMatch) {
      const tableName = fromMatch[1];
      const tableData = this._database.tables.get(tableName);
      
      if (tableData) {
        // Create fields based on first record
        if (tableData.length > 0) {
          const firstRecord = tableData[0];
          for (const [key, value] of Object.entries(firstRecord)) {
            const dataType = typeof value === 'number' ? DataTypeEnum.adInteger : DataTypeEnum.adVarChar;
            const field = new ADOField(key, dataType, value);
            recordset.Fields.addField(field);
          }
        }
        
        // Add records
        recordset.loadData(tableData);
      }
    }
    
    return { recordset };
  }

  private executeInsert(sql: string): { recordsAffected: number } {
    // Simplified INSERT parsing
    return { recordsAffected: 1 };
  }

  private executeUpdate(sql: string): { recordsAffected: number } {
    // Simplified UPDATE parsing
    return { recordsAffected: 1 };
  }

  private executeDelete(sql: string): { recordsAffected: number } {
    // Simplified DELETE parsing
    return { recordsAffected: 1 };
  }

  private addError(description: string, error: any): void {
    const adoError: ADOError = {
      description,
      helpContext: 0,
      helpFile: '',
      nativeError: 0,
      number: error?.code || -1,
      source: 'ADODB.Connection',
      sqlState: ''
    };
    this._errors.push(adoError);
  }

  get ConnectionString(): string {
    return this._connectionString;
  }

  set ConnectionString(value: string) {
    this._connectionString = value;
    this.setProperty('ConnectionString', value);
  }

  get State(): ObjectStateEnum {
    return this._state;
  }

  get Errors(): ADOError[] {
    return [...this._errors];
  }
}

export class ADOCommand extends COMObject {
  private _commandText: string = '';
  private _commandType: CommandTypeEnum = CommandTypeEnum.adCmdText;
  private _commandTimeout: number = 30;
  private _prepared: boolean = false;
  private _activeConnection: ADOConnection | null = null;
  private _parameters: ADOParameters;
  private _state: ObjectStateEnum = ObjectStateEnum.adStateClosed;

  constructor() {
    super('{ADODB.Command}', 'ADODB.Command');
    this._parameters = new ADOParameters();
    this.setupCommandMethods();
  }

  private setupCommandMethods(): void {
    this.setProperty('CommandText', this._commandText);
    this.setProperty('CommandType', this._commandType);
    this.setProperty('CommandTimeout', this._commandTimeout);
    this.setProperty('Prepared', this._prepared);
    this.setProperty('ActiveConnection', this._activeConnection);
    this.setProperty('Parameters', this._parameters);
    this.setProperty('State', this._state);

    this.addMethod('Execute', (recordsAffected?: any, parameters?: any[], options?: number) => {
      if (!this._activeConnection) {
        throw new Error('No active connection');
      }

      if (this._activeConnection.State !== ObjectStateEnum.adStateOpen) {
        throw new Error('Connection is not open');
      }

      // Apply parameters to command text
      let sql = this._commandText;
      if (parameters) {
        parameters.forEach((param, index) => {
          sql = sql.replace('?', this.formatParameter(param));
        });
      }

      return this._activeConnection.Execute(sql, recordsAffected, options);
    });

    this.addMethod('CreateParameter', (name?: string, type?: DataTypeEnum, direction?: ParameterDirectionEnum, size?: number, value?: any) => {
      const param = new ADOParameter(name, type, direction);
      if (size !== undefined) {
        param.setProperty('Size', size);
      }
      if (value !== undefined) {
        param.Value = value;
      }
      return param;
    });

    this.addMethod('Prepare', () => {
      this._prepared = true;
      this.setProperty('Prepared', true);
    });

    this.addMethod('Cancel', () => {
      // Cancel command execution
      this._state = ObjectStateEnum.adStateClosed;
      this.setProperty('State', this._state);
    });
  }

  private formatParameter(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    } else if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    } else if (typeof value === 'number') {
      return String(value);
    } else if (typeof value === 'boolean') {
      return value ? '1' : '0';
    } else if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    } else {
      return `'${String(value)}'`;
    }
  }

  get CommandText(): string {
    return this._commandText;
  }

  set CommandText(value: string) {
    this._commandText = value;
    this.setProperty('CommandText', value);
  }

  get ActiveConnection(): ADOConnection | null {
    return this._activeConnection;
  }

  set ActiveConnection(value: ADOConnection | null) {
    this._activeConnection = value;
    this.setProperty('ActiveConnection', value);
  }

  get Parameters(): ADOParameters {
    return this._parameters;
  }
}

export class ADORecordset extends COMObject {
  private _fields: ADOFields;
  private _state: ObjectStateEnum = ObjectStateEnum.adStateClosed;
  private _cursorType: CursorTypeEnum = CursorTypeEnum.adOpenForwardOnly;
  private _lockType: LockTypeEnum = LockTypeEnum.adLockReadOnly;
  private _activeConnection: ADOConnection | null = null;
  private _source: string | ADOCommand | null = null;
  private _records: any[] = [];
  private _currentRecord: number = -1;
  private _bof: boolean = true;
  private _eof: boolean = true;
  private _editMode: EditModeEnum = EditModeEnum.adEditNone;
  private _recordCount: number = 0;
  private _maxRecords: number = 0;
  private _pageSize: number = 10;
  private _absolutePage: number = 1;
  private _absolutePosition: number = 0;

  constructor() {
    super('{ADODB.Recordset}', 'ADODB.Recordset');
    this._fields = new ADOFields();
    this.setupRecordsetMethods();
  }

  private setupRecordsetMethods(): void {
    this.setProperty('Fields', this._fields);
    this.setProperty('State', this._state);
    this.setProperty('CursorType', this._cursorType);
    this.setProperty('LockType', this._lockType);
    this.setProperty('ActiveConnection', this._activeConnection);
    this.setProperty('Source', this._source);
    this.setProperty('BOF', this._bof);
    this.setProperty('EOF', this._eof);
    this.setProperty('EditMode', this._editMode);
    this.setProperty('RecordCount', this._recordCount);
    this.setProperty('MaxRecords', this._maxRecords);
    this.setProperty('PageSize', this._pageSize);
    this.setProperty('AbsolutePage', this._absolutePage);
    this.setProperty('AbsolutePosition', this._absolutePosition);

    this.addMethod('Open', (source?: string | ADOCommand, activeConnection?: ADOConnection, cursorType?: CursorTypeEnum, lockType?: LockTypeEnum, options?: number) => {
      this._source = source || null;
      this._activeConnection = activeConnection || null;
      this._cursorType = cursorType || CursorTypeEnum.adOpenForwardOnly;
      this._lockType = lockType || LockTypeEnum.adLockReadOnly;
      
      this.setProperty('Source', this._source);
      this.setProperty('ActiveConnection', this._activeConnection);
      this.setProperty('CursorType', this._cursorType);
      this.setProperty('LockType', this._lockType);

      if (typeof source === 'string' && this._activeConnection) {
        // Execute SQL and populate recordset
        const result = this._activeConnection.Execute(source);
        if (result) {
          this.copyFrom(result);
        }
      }

      this._state = ObjectStateEnum.adStateOpen;
      this.setProperty('State', this._state);
      this.fireEvent('RecordsetChangeComplete', { adReason: 0, error: null, status: 0, recordset: this });
    });

    this.addMethod('Close', () => {
      this._state = ObjectStateEnum.adStateClosed;
      this.setProperty('State', this._state);
      this.fireEvent('WillClose', { recordset: this });
    });

    this.addMethod('MoveNext', () => {
      if (this._currentRecord < this._records.length - 1) {
        this._currentRecord++;
        this._bof = false;
        this._eof = this._currentRecord >= this._records.length - 1;
        this.updateCurrentRecord();
        this.fireEvent('WillMove', { adReason: 0, status: 0, recordset: this });
        this.fireEvent('MoveComplete', { adReason: 0, error: null, status: 0, recordset: this });
      } else {
        this._eof = true;
      }
      this.setProperty('BOF', this._bof);
      this.setProperty('EOF', this._eof);
    });

    this.addMethod('MovePrevious', () => {
      if (this._currentRecord > 0) {
        this._currentRecord--;
        this._eof = false;
        this._bof = this._currentRecord <= 0;
        this.updateCurrentRecord();
        this.fireEvent('WillMove', { adReason: 0, status: 0, recordset: this });
        this.fireEvent('MoveComplete', { adReason: 0, error: null, status: 0, recordset: this });
      } else {
        this._bof = true;
      }
      this.setProperty('BOF', this._bof);
      this.setProperty('EOF', this._eof);
    });

    this.addMethod('MoveFirst', () => {
      if (this._records.length > 0) {
        this._currentRecord = 0;
        this._bof = false;
        this._eof = false;
        this.updateCurrentRecord();
        this.fireEvent('WillMove', { adReason: 0, status: 0, recordset: this });
        this.fireEvent('MoveComplete', { adReason: 0, error: null, status: 0, recordset: this });
      }
      this.setProperty('BOF', this._bof);
      this.setProperty('EOF', this._eof);
    });

    this.addMethod('MoveLast', () => {
      if (this._records.length > 0) {
        this._currentRecord = this._records.length - 1;
        this._bof = false;
        this._eof = false;
        this.updateCurrentRecord();
        this.fireEvent('WillMove', { adReason: 0, status: 0, recordset: this });
        this.fireEvent('MoveComplete', { adReason: 0, error: null, status: 0, recordset: this });
      }
      this.setProperty('BOF', this._bof);
      this.setProperty('EOF', this._eof);
    });

    this.addMethod('AddNew', (fieldList?: any[], values?: any[]) => {
      this._editMode = EditModeEnum.adEditAdd;
      this.setProperty('EditMode', this._editMode);
      
      if (fieldList && values) {
        for (let i = 0; i < fieldList.length && i < values.length; i++) {
          const field = this._fields.Item(fieldList[i]);
          if (field) {
            field.Value = values[i];
          }
        }
      }
      
      this.fireEvent('WillChangeRecord', { adReason: 0, cRecords: 1, status: 0, recordset: this });
    });

    this.addMethod('Update', (fields?: any[], values?: any[]) => {
      if (fields && values) {
        for (let i = 0; i < fields.length && i < values.length; i++) {
          const field = this._fields.Item(fields[i]);
          if (field) {
            field.Value = values[i];
          }
        }
      }

      if (this._editMode === EditModeEnum.adEditAdd) {
        // Add new record
        const newRecord: any = {};
        this._fields.Fields.forEach(field => {
          newRecord[field.Name] = field.Value;
        });
        this._records.push(newRecord);
        this._currentRecord = this._records.length - 1;
        this._recordCount = this._records.length;
        this.setProperty('RecordCount', this._recordCount);
      } else if (this._editMode === EditModeEnum.adEditInProgress) {
        // Update current record
        if (this._currentRecord >= 0 && this._currentRecord < this._records.length) {
          const record = this._records[this._currentRecord];
          this._fields.Fields.forEach(field => {
            record[field.Name] = field.Value;
          });
        }
      }

      this._editMode = EditModeEnum.adEditNone;
      this.setProperty('EditMode', this._editMode);
      this.fireEvent('RecordChangeComplete', { adReason: 0, cRecords: 1, error: null, status: 0, recordset: this });
    });

    this.addMethod('Delete', (affectRecords?: number) => {
      if (this._currentRecord >= 0 && this._currentRecord < this._records.length) {
        this.fireEvent('WillChangeRecord', { adReason: 0, cRecords: 1, status: 0, recordset: this });
        this._records.splice(this._currentRecord, 1);
        this._recordCount = this._records.length;
        
        if (this._currentRecord >= this._records.length) {
          this._currentRecord = this._records.length - 1;
        }
        
        this.updateCurrentRecord();
        this.setProperty('RecordCount', this._recordCount);
        this.fireEvent('RecordChangeComplete', { adReason: 0, cRecords: 1, error: null, status: 0, recordset: this });
      }
    });

    this.addMethod('Find', (criteria: string, skipRecords?: number, searchDirection?: number, start?: any) => {
      // Simple find implementation
      const startPos = skipRecords || 0;
      for (let i = startPos; i < this._records.length; i++) {
        // Very basic criteria matching (would need proper SQL WHERE parsing)
        if (this.matchesCriteria(this._records[i], criteria)) {
          this._currentRecord = i;
          this.updateCurrentRecord();
          return;
        }
      }
      this._eof = true;
      this.setProperty('EOF', true);
    });

    this.addMethod('Requery', (options?: number) => {
      if (this._source && this._activeConnection) {
        this.Open(this._source, this._activeConnection, this._cursorType, this._lockType, options);
      }
    });

    this.addMethod('Clone', (lockType?: LockTypeEnum) => {
      const clone = new ADORecordset();
      clone.copyFrom(this);
      return clone;
    });
  }

  private updateCurrentRecord(): void {
    if (this._currentRecord >= 0 && this._currentRecord < this._records.length) {
      const record = this._records[this._currentRecord];
      this._fields.Fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(record, field.Name)) {
          field.Value = record[field.Name];
        }
      });
      this._absolutePosition = this._currentRecord + 1;
      this.setProperty('AbsolutePosition', this._absolutePosition);
    }
  }

  private matchesCriteria(record: any, criteria: string): boolean {
    // Safe criteria matching without eval()
    // Simple WHERE clause parser for basic conditions
    try {
      return this.parseCriteria(record, criteria.trim());
    } catch {
      return false;
    }
  }

  private parseCriteria(record: any, criteria: string): boolean {
    // Handle basic comparison operators
    const operators = ['>=', '<=', '<>', '=', '>', '<'];
    
    for (const op of operators) {
      if (criteria.includes(op)) {
        const parts = criteria.split(op).map(p => p.trim());
        if (parts.length === 2) {
          const [left, right] = parts;
          const leftValue = this.getValue(record, left);
          const rightValue = this.getValue(record, right);
          
          switch (op) {
            case '=':
              return leftValue == rightValue;
            case '<>':
              return leftValue != rightValue;
            case '>':
              return leftValue > rightValue;
            case '<':
              return leftValue < rightValue;
            case '>=':
              return leftValue >= rightValue;
            case '<=':
              return leftValue <= rightValue;
          }
        }
      }
    }
    
    // Handle AND/OR operators
    if (criteria.includes(' AND ')) {
      const parts = criteria.split(' AND ');
      return parts.every(part => this.parseCriteria(record, part.trim()));
    }
    
    if (criteria.includes(' OR ')) {
      const parts = criteria.split(' OR ');
      return parts.some(part => this.parseCriteria(record, part.trim()));
    }
    
    // Handle LIKE operator
    if (criteria.includes(' LIKE ')) {
      const parts = criteria.split(' LIKE ').map(p => p.trim());
      if (parts.length === 2) {
        const fieldValue = String(this.getValue(record, parts[0])).toLowerCase();
        const pattern = parts[1].replace(/'/g, '').replace(/"/g, '').toLowerCase();
        const regexPattern = pattern.replace(/%/g, '.*').replace(/_/g, '.');
        return new RegExp('^' + regexPattern + '$').test(fieldValue);
      }
    }
    
    return false;
  }

  private getValue(record: any, expression: string): any {
    // Safe value extraction
    if (expression.startsWith('"') && expression.endsWith('"')) {
      return expression.slice(1, -1); // String literal
    }
    if (expression.startsWith("'") && expression.endsWith("'")) {
      return expression.slice(1, -1); // String literal
    }
    if (/^\d+(\.\d+)?$/.test(expression)) {
      return parseFloat(expression); // Number literal
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expression)) {
      return record[expression]; // Field name
    }
    return expression;
  }

  loadData(data: any[]): void {
    this._records = [...data];
    this._recordCount = this._records.length;
    this._currentRecord = this._records.length > 0 ? 0 : -1;
    this._bof = this._records.length === 0;
    this._eof = this._records.length === 0;
    
    this.setProperty('RecordCount', this._recordCount);
    this.setProperty('BOF', this._bof);
    this.setProperty('EOF', this._eof);
    
    if (this._records.length > 0) {
      this.updateCurrentRecord();
    }
  }

  copyFrom(other: ADORecordset): void {
    this._fields = other._fields;
    this._records = [...other._records];
    this._recordCount = other._recordCount;
    this._currentRecord = other._currentRecord;
    this._bof = other._bof;
    this._eof = other._eof;
    
    this.setProperty('Fields', this._fields);
    this.setProperty('RecordCount', this._recordCount);
    this.setProperty('BOF', this._bof);
    this.setProperty('EOF', this._eof);
  }

  get Fields(): ADOFields {
    return this._fields;
  }

  get RecordCount(): number {
    return this._recordCount;
  }

  get BOF(): boolean {
    return this._bof;
  }

  get EOF(): boolean {
    return this._eof;
  }
}

// Register ADO objects with COM
COM.RegisterClass('{ADODB.Connection}', 'ADODB.Connection', ADOConnection);
COM.RegisterClass('{ADODB.Recordset}', 'ADODB.Recordset', ADORecordset);
COM.RegisterClass('{ADODB.Command}', 'ADODB.Command', ADOCommand);
COM.RegisterClass('{ADODB.Parameter}', 'ADODB.Parameter', ADOParameter);
COM.RegisterClass('{ADODB.Field}', 'ADODB.Field', ADOField);

export default {
  Connection: ADOConnection,
  Recordset: ADORecordset,
  Command: ADOCommand,
  Parameter: ADOParameter,
  Field: ADOField,
  Fields: ADOFields,
  Parameters: ADOParameters
};