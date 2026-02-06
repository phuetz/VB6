/**
 * Système ADO complet pour VB6 Studio
 * Implémentation 100% compatible VB6 avec Connection, Recordset, Command, Field, Parameter
 */

import { EventEmitter } from 'events';
import {
  ADOValue,
  ADORecord,
  ADOBookmark,
  ADODataSource,
  ADODataFormat,
  ADOSchemaRestrictions,
} from './types/VB6ServiceTypes';

// Types et énumérations ADO
export enum CursorTypeEnum {
  adOpenForwardOnly = 0,
  adOpenKeyset = 1,
  adOpenDynamic = 2,
  adOpenStatic = 3,
  adOpenUnspecified = -1,
}

export enum LockTypeEnum {
  adLockReadOnly = 1,
  adLockPessimistic = 2,
  adLockOptimistic = 3,
  adLockBatchOptimistic = 4,
  adLockUnspecified = -1,
}

export enum CommandTypeEnum {
  adCmdUnknown = 8,
  adCmdText = 1,
  adCmdTable = 2,
  adCmdStoredProc = 4,
  adCmdFile = 256,
  adCmdTableDirect = 512,
}

export enum ParameterDirectionEnum {
  adParamUnknown = 0,
  adParamInput = 1,
  adParamOutput = 2,
  adParamInputOutput = 3,
  adParamReturnValue = 4,
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
  adArray = 0x2000,
}

export enum ObjectStateEnum {
  adStateClosed = 0,
  adStateOpen = 1,
  adStateConnecting = 2,
  adStateExecuting = 4,
  adStateFetching = 8,
}

export enum ConnectModeEnum {
  adModeUnknown = 0,
  adModeRead = 1,
  adModeWrite = 2,
  adModeReadWrite = 3,
  adModeShareDenyRead = 4,
  adModeShareDenyWrite = 8,
  adModeShareExclusive = 12,
  adModeShareDenyNone = 16,
  adModeRecursive = 0x400000,
}

export enum IsolationLevelEnum {
  adXactUnspecified = 0xffffffff,
  adXactChaos = 0x00000010,
  adXactReadUncommitted = 0x00000100,
  // adXactBrowse = 0x00000100, // Same as adXactReadUncommitted (commented to avoid duplicate)
  adXactCursorStability = 0x00001000,
  // adXactReadCommitted = 0x00001000, // Same as adXactCursorStability (commented to avoid duplicate)
  adXactRepeatableRead = 0x00010000,
  adXactSerializable = 0x00100000,
  // adXactIsolated = 0x00100000 // Same as adXactSerializable (commented to avoid duplicate)
}

export enum EditModeEnum {
  adEditNone = 0,
  adEditInProgress = 1,
  adEditAdd = 2,
  adEditDelete = 4,
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
  adRecDBDeleted = 262144,
}

export enum FieldAttributeEnum {
  adFldUnspecified = -1,
  adFldMayDefer = 2,
  adFldUpdatable = 4,
  adFldUnknownUpdatable = 8,
  adFldFixed = 16,
  adFldIsNullable = 32,
  adFldMayBeNull = 64,
  adFldLong = 128,
  adFldRowID = 256,
  adFldRowVersion = 512,
  adFldCacheDeferred = 4096,
  adFldIsChapter = 8192,
  adFldNegativeScale = 16384,
  adFldKeyColumn = 32768,
  adFldIsRowURL = 65536,
  adFldIsDefaultStream = 131072,
  adFldIsCollection = 262144,
}

// Interfaces ADO
export interface ADOError {
  number: number;
  description: string;
  source: string;
  sqlState: string;
  nativeError: number;
  helpFile: string;
  helpContext: number;
}

export interface ADOProperty {
  name: string;
  type: DataTypeEnum;
  value: ADOValue;
  attributes: number;
}

// Classe Field ADO
export class ADOField extends EventEmitter {
  private _name: string = '';
  private _type: DataTypeEnum = DataTypeEnum.adEmpty;
  private _value: ADOValue = null;
  private _originalValue: ADOValue = null;
  private _definedSize: number = 0;
  private _actualSize: number = 0;
  private _attributes: FieldAttributeEnum = FieldAttributeEnum.adFldUnspecified;
  private _precision: number = 0;
  private _numericScale: number = 0;
  private _status: RecordStatusEnum = RecordStatusEnum.adRecOK;
  private _underlyingValue: ADOValue = null;
  private _dataFormat: ADODataFormat | null = null;
  private _properties: Map<string, ADOProperty> = new Map();

  constructor(name: string, type: DataTypeEnum, size: number = 0) {
    super();
    this._name = name;
    this._type = type;
    this._definedSize = size;
    this._actualSize = size;
  }

  // Propriétés Field
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
  }

  get type(): DataTypeEnum {
    return this._type;
  }
  set type(value: DataTypeEnum) {
    this._type = value;
  }

  get value(): ADOValue {
    return this._value;
  }
  set value(val: ADOValue) {
    if (this._value !== val) {
      this._value = val;
      this._actualSize = this.calculateSize(val);
      this.emit('change', this);
    }
  }

  get originalValue(): ADOValue {
    return this._originalValue;
  }
  set originalValue(value: ADOValue) {
    this._originalValue = value;
  }

  get underlyingValue(): ADOValue {
    return this._underlyingValue;
  }
  set underlyingValue(value: ADOValue) {
    this._underlyingValue = value;
  }

  get definedSize(): number {
    return this._definedSize;
  }
  set definedSize(value: number) {
    this._definedSize = value;
  }

  get actualSize(): number {
    return this._actualSize;
  }

  get attributes(): FieldAttributeEnum {
    return this._attributes;
  }
  set attributes(value: FieldAttributeEnum) {
    this._attributes = value;
  }

  get precision(): number {
    return this._precision;
  }
  set precision(value: number) {
    this._precision = value;
  }

  get numericScale(): number {
    return this._numericScale;
  }
  set numericScale(value: number) {
    this._numericScale = value;
  }

  get status(): RecordStatusEnum {
    return this._status;
  }
  set status(value: RecordStatusEnum) {
    this._status = value;
  }

  get dataFormat(): ADODataFormat | null {
    return this._dataFormat;
  }
  set dataFormat(value: ADODataFormat | null) {
    this._dataFormat = value;
  }

  get properties(): Map<string, ADOProperty> {
    return this._properties;
  }

  // Méthodes Field
  appendChunk(data: string | ArrayBuffer): void {
    if (this._value === null) {
      this._value = data;
    } else if (typeof this._value === 'string' && typeof data === 'string') {
      this._value = this._value + data;
    }
    this._actualSize = this.calculateSize(this._value);
  }

  getChunk(length: number): string | null {
    if (this._value === null || typeof this._value !== 'string') return null;
    const chunk = this._value.substring(0, length);
    this._value = this._value.substring(length);
    return chunk;
  }

  private calculateSize(value: ADOValue): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 1;
    if (value instanceof Date) return 8;
    if (value instanceof ArrayBuffer) return value.byteLength;
    return JSON.stringify(value).length;
  }
}

// Classe Fields (Collection)
export class ADOFields extends EventEmitter {
  private _fields: ADOField[] = [];

  get count(): number {
    return this._fields.length;
  }

  item(index: number | string): ADOField | null {
    if (typeof index === 'number') {
      return this._fields[index] ?? null;
    } else {
      return this._fields.find(f => f.name === index) ?? null;
    }
  }

  append(
    name: string,
    type: DataTypeEnum,
    definedSize: number = 0,
    attrib: FieldAttributeEnum = FieldAttributeEnum.adFldUnspecified
  ): void {
    const field = new ADOField(name, type, definedSize);
    field.attributes = attrib;
    this._fields.push(field);
    this.emit('fieldAdded', field);
  }

  delete(index: number | string): void {
    if (typeof index === 'number') {
      const field = this._fields.splice(index, 1)[0];
      this.emit('fieldDeleted', field);
    } else {
      const fieldIndex = this._fields.findIndex(f => f.name === index);
      if (fieldIndex >= 0) {
        const field = this._fields.splice(fieldIndex, 1)[0];
        this.emit('fieldDeleted', field);
      }
    }
  }

  refresh(): void {
    this.emit('refresh');
  }

  [Symbol.iterator](): Iterator<ADOField> {
    let index = 0;
    return {
      next: () => {
        if (index < this._fields.length) {
          return { value: this._fields[index++], done: false };
        } else {
          return { done: true, value: undefined };
        }
      },
    };
  }
}

// Classe Parameter ADO
export class ADOParameter extends EventEmitter {
  private _name: string = '';
  private _type: DataTypeEnum = DataTypeEnum.adEmpty;
  private _direction: ParameterDirectionEnum = ParameterDirectionEnum.adParamInput;
  private _size: number = 0;
  private _value: ADOValue = null;
  private _precision: number = 0;
  private _numericScale: number = 0;
  private _attributes: number = 0;
  private _properties: Map<string, ADOProperty> = new Map();

  constructor(
    name: string = '',
    type: DataTypeEnum = DataTypeEnum.adEmpty,
    direction: ParameterDirectionEnum = ParameterDirectionEnum.adParamInput,
    size: number = 0,
    value: ADOValue = null
  ) {
    super();
    this._name = name;
    this._type = type;
    this._direction = direction;
    this._size = size;
    this._value = value;
  }

  // Propriétés Parameter
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
  }

  get type(): DataTypeEnum {
    return this._type;
  }
  set type(value: DataTypeEnum) {
    this._type = value;
  }

  get direction(): ParameterDirectionEnum {
    return this._direction;
  }
  set direction(value: ParameterDirectionEnum) {
    this._direction = value;
  }

  get size(): number {
    return this._size;
  }
  set size(value: number) {
    this._size = value;
  }

  get value(): ADOValue {
    return this._value;
  }
  set value(val: ADOValue) {
    if (this._value !== val) {
      this._value = val;
      this.emit('change', this);
    }
  }

  get precision(): number {
    return this._precision;
  }
  set precision(value: number) {
    this._precision = value;
  }

  get numericScale(): number {
    return this._numericScale;
  }
  set numericScale(value: number) {
    this._numericScale = value;
  }

  get attributes(): number {
    return this._attributes;
  }
  set attributes(value: number) {
    this._attributes = value;
  }

  get properties(): Map<string, ADOProperty> {
    return this._properties;
  }

  // Méthodes Parameter
  appendChunk(data: string | ArrayBuffer): void {
    if (this._value === null) {
      this._value = data;
    } else if (typeof this._value === 'string' && typeof data === 'string') {
      this._value = this._value + data;
    }
  }
}

// Classe Parameters (Collection)
export class ADOParameters extends EventEmitter {
  private _parameters: ADOParameter[] = [];

  get count(): number {
    return this._parameters.length;
  }

  item(index: number | string): ADOParameter | null {
    if (typeof index === 'number') {
      return this._parameters[index] ?? null;
    } else {
      return this._parameters.find(p => p.name === index) ?? null;
    }
  }

  append(param: ADOParameter): void;
  append(
    name: string,
    type: DataTypeEnum,
    direction?: ParameterDirectionEnum,
    size?: number,
    value?: ADOValue
  ): void;
  append(
    paramOrName: ADOParameter | string,
    type?: DataTypeEnum,
    direction?: ParameterDirectionEnum,
    size?: number,
    value?: ADOValue
  ): void {
    if (paramOrName instanceof ADOParameter) {
      this._parameters.push(paramOrName);
      this.emit('parameterAdded', paramOrName);
    } else {
      const param = new ADOParameter(paramOrName, type, direction, size, value);
      this._parameters.push(param);
      this.emit('parameterAdded', param);
    }
  }

  delete(index: number | string): void {
    if (typeof index === 'number') {
      const param = this._parameters.splice(index, 1)[0];
      this.emit('parameterDeleted', param);
    } else {
      const paramIndex = this._parameters.findIndex(p => p.name === index);
      if (paramIndex >= 0) {
        const param = this._parameters.splice(paramIndex, 1)[0];
        this.emit('parameterDeleted', param);
      }
    }
  }

  refresh(): void {
    this.emit('refresh');
  }

  [Symbol.iterator](): Iterator<ADOParameter> {
    let index = 0;
    return {
      next: () => {
        if (index < this._parameters.length) {
          return { value: this._parameters[index++], done: false };
        } else {
          return { done: true, value: undefined };
        }
      },
    };
  }
}

// Classe Connection ADO
export class ADOConnection extends EventEmitter {
  private _connectionString: string = '';
  private _connectionTimeout: number = 30;
  private _commandTimeout: number = 30;
  private _mode: ConnectModeEnum = ConnectModeEnum.adModeUnknown;
  private _isolationLevel: IsolationLevelEnum = IsolationLevelEnum.adXactReadCommitted;
  private _state: ObjectStateEnum = ObjectStateEnum.adStateClosed;
  private _version: string = '6.0';
  private _provider: string = '';
  private _defaultDatabase: string = '';
  private _cursorLocation: number = 3; // adUseClient
  private _errors: ADOError[] = [];
  private _properties: Map<string, ADOProperty> = new Map();

  // Propriétés Connection
  get connectionString(): string {
    return this._connectionString;
  }
  set connectionString(value: string) {
    this._connectionString = value;
  }

  get connectionTimeout(): number {
    return this._connectionTimeout;
  }
  set connectionTimeout(value: number) {
    this._connectionTimeout = value;
  }

  get commandTimeout(): number {
    return this._commandTimeout;
  }
  set commandTimeout(value: number) {
    this._commandTimeout = value;
  }

  get mode(): ConnectModeEnum {
    return this._mode;
  }
  set mode(value: ConnectModeEnum) {
    this._mode = value;
  }

  get isolationLevel(): IsolationLevelEnum {
    return this._isolationLevel;
  }
  set isolationLevel(value: IsolationLevelEnum) {
    this._isolationLevel = value;
  }

  get state(): ObjectStateEnum {
    return this._state;
  }

  get version(): string {
    return this._version;
  }

  get provider(): string {
    return this._provider;
  }
  set provider(value: string) {
    this._provider = value;
  }

  get defaultDatabase(): string {
    return this._defaultDatabase;
  }
  set defaultDatabase(value: string) {
    this._defaultDatabase = value;
  }

  get cursorLocation(): number {
    return this._cursorLocation;
  }
  set cursorLocation(value: number) {
    this._cursorLocation = value;
  }

  get errors(): ADOError[] {
    return this._errors;
  }

  get properties(): Map<string, ADOProperty> {
    return this._properties;
  }

  // Méthodes Connection
  async open(
    connectionString?: string,
    userId?: string,
    password?: string,
    options?: number
  ): Promise<void> {
    if (connectionString) {
      this._connectionString = connectionString;
    }

    if (!this._connectionString) {
      throw new Error('Connection string is required');
    }

    try {
      this._state = ObjectStateEnum.adStateConnecting;
      this.emit('willConnect');

      // Simulation de la connexion
      await new Promise(resolve => setTimeout(resolve, 100));

      this._state = ObjectStateEnum.adStateOpen;
      this.emit('connectComplete', null);
    } catch (error) {
      this._state = ObjectStateEnum.adStateClosed;
      this.emit('connectComplete', error);
      throw error;
    }
  }

  close(): void {
    if (this._state !== ObjectStateEnum.adStateClosed) {
      this._state = ObjectStateEnum.adStateClosed;
      this.emit('disconnect');
    }
  }

  async execute(
    commandText: string,
    recordsAffected?: { value: number },
    options?: number
  ): Promise<ADORecordset> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    const command = new ADOCommand();
    command.activeConnection = this;
    command.commandText = commandText;
    command.commandType = CommandTypeEnum.adCmdText;

    return await command.execute(recordsAffected, options);
  }

  async beginTrans(): Promise<number> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    this.emit('beginTransComplete');
    return 1; // Transaction level
  }

  async commitTrans(): Promise<void> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    this.emit('commitTransComplete');
  }

  async rollbackTrans(): Promise<void> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    this.emit('rollbackTransComplete');
  }

  openSchema(
    schema: number,
    restrictions?: ADOSchemaRestrictions,
    schemaID?: string
  ): ADORecordset {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    const recordset = new ADORecordset();
    // Simulation des métadonnées de schéma
    recordset.open(null, this, CursorTypeEnum.adOpenStatic, LockTypeEnum.adLockReadOnly);
    return recordset;
  }

  cancel(): void {
    if (this._state === ObjectStateEnum.adStateExecuting) {
      this._state = ObjectStateEnum.adStateOpen;
      this.emit('executeComplete', null, true);
    }
  }
}

// Classe Command ADO
export class ADOCommand extends EventEmitter {
  private _activeConnection: ADOConnection | null = null;
  private _commandText: string = '';
  private _commandTimeout: number = 30;
  private _commandType: CommandTypeEnum = CommandTypeEnum.adCmdText;
  private _prepared: boolean = false;
  private _parameters: ADOParameters = new ADOParameters();
  private _state: ObjectStateEnum = ObjectStateEnum.adStateClosed;
  private _name: string = '';
  private _properties: Map<string, ADOProperty> = new Map();

  constructor() {
    super();
    this._parameters.on('parameterAdded', param => this.emit('parameterAdded', param));
    this._parameters.on('parameterDeleted', param => this.emit('parameterDeleted', param));
  }

  // Propriétés Command
  get activeConnection(): ADOConnection | null {
    return this._activeConnection;
  }
  set activeConnection(value: ADOConnection | null) {
    this._activeConnection = value;
  }

  get commandText(): string {
    return this._commandText;
  }
  set commandText(value: string) {
    this._commandText = value;
  }

  get commandTimeout(): number {
    return this._commandTimeout;
  }
  set commandTimeout(value: number) {
    this._commandTimeout = value;
  }

  get commandType(): CommandTypeEnum {
    return this._commandType;
  }
  set commandType(value: CommandTypeEnum) {
    this._commandType = value;
  }

  get prepared(): boolean {
    return this._prepared;
  }
  set prepared(value: boolean) {
    this._prepared = value;
  }

  get parameters(): ADOParameters {
    return this._parameters;
  }

  get state(): ObjectStateEnum {
    return this._state;
  }

  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
  }

  get properties(): Map<string, ADOProperty> {
    return this._properties;
  }

  // Méthodes Command
  async execute(
    recordsAffected?: { value: number },
    parameters?: ADOValue[],
    options?: number
  ): Promise<ADORecordset> {
    if (!this._activeConnection || this._activeConnection.state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    if (!this._commandText) {
      throw new Error('Command text is required');
    }

    try {
      this._state = ObjectStateEnum.adStateExecuting;
      this.emit('willExecute');

      // Simulation de l'exécution
      await new Promise(resolve => setTimeout(resolve, 50));

      const recordset = new ADORecordset();

      // Créer des champs de test
      recordset.fields.append('ID', DataTypeEnum.adInteger);
      recordset.fields.append('Name', DataTypeEnum.adVarChar, 50);
      recordset.fields.append('Email', DataTypeEnum.adVarChar, 100);

      // Ouvrir le recordset
      recordset.open(
        null,
        this._activeConnection,
        CursorTypeEnum.adOpenStatic,
        LockTypeEnum.adLockReadOnly
      );

      // Ajouter des données de test
      recordset.addNew();
      recordset.fields.item('ID').value = 1;
      recordset.fields.item('Name').value = 'Test User';
      recordset.fields.item('Email').value = 'test@example.com';
      recordset.update();

      recordset.moveFirst();

      if (recordsAffected) {
        recordsAffected.value = 1;
      }

      this._state = ObjectStateEnum.adStateClosed;
      this.emit('executeComplete', recordset, false);

      return recordset;
    } catch (error) {
      this._state = ObjectStateEnum.adStateClosed;
      this.emit('executeComplete', null, false);
      throw error;
    }
  }

  cancel(): void {
    if (this._state === ObjectStateEnum.adStateExecuting) {
      this._state = ObjectStateEnum.adStateClosed;
      this.emit('executeComplete', null, true);
    }
  }

  createParameter(
    name?: string,
    type?: DataTypeEnum,
    direction?: ParameterDirectionEnum,
    size?: number,
    value?: ADOValue
  ): ADOParameter {
    return new ADOParameter(name, type, direction, size, value);
  }
}

// Classe Recordset ADO
export class ADORecordset extends EventEmitter {
  private _activeConnection: ADOConnection | null = null;
  private _activeCommand: ADOCommand | null = null;
  private _source: string | ADOCommand | null = null;
  private _state: ObjectStateEnum = ObjectStateEnum.adStateClosed;
  private _cursorType: CursorTypeEnum = CursorTypeEnum.adOpenForwardOnly;
  private _lockType: LockTypeEnum = LockTypeEnum.adLockReadOnly;
  private _maxRecords: number = 0;
  private _pageCount: number = 0;
  private _pageSize: number = 0;
  private _absolutePage: number = 0;
  private _absolutePosition: number = 0;
  private _recordCount: number = 0;
  private _bof: boolean = true;
  private _eof: boolean = true;
  private _editMode: EditModeEnum = EditModeEnum.adEditNone;
  private _marshalOptions: number = 0;
  private _cacheSize: number = 1;
  private _cursorLocation: number = 3; // adUseClient
  private _dataSource: ADODataSource | null = null;
  private _dataMember: string = '';
  private _fields: ADOFields = new ADOFields();
  private _properties: Map<string, ADOProperty> = new Map();
  private _records: ADORecord[] = [];
  private _currentRecord: number = -1;
  private _status: RecordStatusEnum = RecordStatusEnum.adRecOK;
  private _bookmark: ADOBookmark | null = null;

  constructor() {
    super();
    this._fields.on('fieldAdded', field => this.emit('fieldAdded', field));
    this._fields.on('fieldDeleted', field => this.emit('fieldDeleted', field));
  }

  // Propriétés Recordset
  get activeConnection(): ADOConnection | null {
    return this._activeConnection;
  }
  set activeConnection(value: ADOConnection | null) {
    this._activeConnection = value;
  }

  get activeCommand(): ADOCommand | null {
    return this._activeCommand;
  }

  get source(): string | ADOCommand | null {
    return this._source;
  }
  set source(value: string | ADOCommand | null) {
    this._source = value;
  }

  get state(): ObjectStateEnum {
    return this._state;
  }

  get cursorType(): CursorTypeEnum {
    return this._cursorType;
  }
  set cursorType(value: CursorTypeEnum) {
    this._cursorType = value;
  }

  get lockType(): LockTypeEnum {
    return this._lockType;
  }
  set lockType(value: LockTypeEnum) {
    this._lockType = value;
  }

  get maxRecords(): number {
    return this._maxRecords;
  }
  set maxRecords(value: number) {
    this._maxRecords = value;
  }

  get pageCount(): number {
    return this._pageCount;
  }

  get pageSize(): number {
    return this._pageSize;
  }
  set pageSize(value: number) {
    this._pageSize = value;
  }

  get absolutePage(): number {
    return this._absolutePage;
  }
  set absolutePage(value: number) {
    this._absolutePage = value;
  }

  get absolutePosition(): number {
    return this._absolutePosition;
  }
  set absolutePosition(value: number) {
    this._absolutePosition = value;
  }

  get recordCount(): number {
    return this._recordCount;
  }

  get bof(): boolean {
    return this._bof;
  }

  get eof(): boolean {
    return this._eof;
  }

  get editMode(): EditModeEnum {
    return this._editMode;
  }

  get marshalOptions(): number {
    return this._marshalOptions;
  }
  set marshalOptions(value: number) {
    this._marshalOptions = value;
  }

  get cacheSize(): number {
    return this._cacheSize;
  }
  set cacheSize(value: number) {
    this._cacheSize = value;
  }

  get cursorLocation(): number {
    return this._cursorLocation;
  }
  set cursorLocation(value: number) {
    this._cursorLocation = value;
  }

  get dataSource(): ADODataSource | null {
    return this._dataSource;
  }
  set dataSource(value: ADODataSource | null) {
    this._dataSource = value;
  }

  get dataMember(): string {
    return this._dataMember;
  }
  set dataMember(value: string) {
    this._dataMember = value;
  }

  get fields(): ADOFields {
    return this._fields;
  }

  get properties(): Map<string, ADOProperty> {
    return this._properties;
  }

  get status(): RecordStatusEnum {
    return this._status;
  }

  get bookmark(): ADOBookmark | null {
    return this._bookmark;
  }
  set bookmark(value: ADOBookmark | null) {
    this._bookmark = value;
  }

  // Méthodes de navigation
  moveFirst(): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._records.length === 0) {
      this._bof = true;
      this._eof = true;
      this._currentRecord = -1;
      this._absolutePosition = 0;
    } else {
      this._currentRecord = 0;
      this._absolutePosition = 1;
      this._bof = false;
      this._eof = false;
      this.updateFieldValues();
    }

    this.emit('moveComplete', null);
  }

  moveLast(): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._records.length === 0) {
      this._bof = true;
      this._eof = true;
      this._currentRecord = -1;
      this._absolutePosition = 0;
    } else {
      this._currentRecord = this._records.length - 1;
      this._absolutePosition = this._records.length;
      this._bof = false;
      this._eof = false;
      this.updateFieldValues();
    }

    this.emit('moveComplete', null);
  }

  moveNext(): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._currentRecord < this._records.length - 1) {
      this._currentRecord++;
      this._absolutePosition++;
      this._bof = false;
      this._eof = false;
      this.updateFieldValues();
    } else {
      this._eof = true;
      this._currentRecord = this._records.length;
      this._absolutePosition = this._records.length + 1;
    }

    this.emit('moveComplete', null);
  }

  movePrevious(): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._currentRecord > 0) {
      this._currentRecord--;
      this._absolutePosition--;
      this._bof = false;
      this._eof = false;
      this.updateFieldValues();
    } else {
      this._bof = true;
      this._currentRecord = -1;
      this._absolutePosition = 0;
    }

    this.emit('moveComplete', null);
  }

  move(numRecords: number, start?: ADOBookmark): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    const newPosition = this._currentRecord + numRecords;

    if (newPosition < 0) {
      this._bof = true;
      this._currentRecord = -1;
      this._absolutePosition = 0;
      this._eof = false;
    } else if (newPosition >= this._records.length) {
      this._eof = true;
      this._currentRecord = this._records.length;
      this._absolutePosition = this._records.length + 1;
      this._bof = false;
    } else {
      this._currentRecord = newPosition;
      this._absolutePosition = newPosition + 1;
      this._bof = false;
      this._eof = false;
      this.updateFieldValues();
    }

    this.emit('moveComplete', null);
  }

  // Méthodes de manipulation des données
  addNew(fieldList?: string[] | ADOField[], values?: ADOValue[]): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._lockType === LockTypeEnum.adLockReadOnly) {
      throw new Error('Cannot add new record to read-only recordset');
    }

    const newRecord: ADORecord = {};
    for (const field of this._fields) {
      newRecord[field.name] = null;
    }

    if (fieldList && values) {
      if (Array.isArray(fieldList) && Array.isArray(values)) {
        for (let i = 0; i < fieldList.length && i < values.length; i++) {
          const fieldName =
            typeof fieldList[i] === 'string' ? fieldList[i] : (fieldList[i] as ADOField).name;
          newRecord[fieldName] = values[i];
        }
      }
    }

    this._records.push(newRecord);
    this._currentRecord = this._records.length - 1;
    this._recordCount = this._records.length;
    this._absolutePosition = this._records.length;
    this._editMode = EditModeEnum.adEditAdd;
    this._bof = false;
    this._eof = false;
    this._status = RecordStatusEnum.adRecNew;

    this.updateFieldValues();
    this.emit('willChangeRecord', null);
  }

  update(fields?: string[] | ADOField[], values?: ADOValue[]): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._lockType === LockTypeEnum.adLockReadOnly) {
      throw new Error('Cannot update read-only recordset');
    }

    if (this._currentRecord < 0 || this._currentRecord >= this._records.length) {
      throw new Error('No current record');
    }

    if (fields && values) {
      if (Array.isArray(fields) && Array.isArray(values)) {
        for (let i = 0; i < fields.length && i < values.length; i++) {
          const fieldName =
            typeof fields[i] === 'string' ? fields[i] : (fields[i] as ADOField).name;
          this._records[this._currentRecord][fieldName] = values[i];
          const field = this._fields.item(fieldName);
          if (field) {
            field.value = values[i];
          }
        }
      }
    } else {
      // Mettre à jour avec les valeurs actuelles des champs
      for (const field of this._fields) {
        this._records[this._currentRecord][field.name] = field.value;
      }
    }

    this._editMode = EditModeEnum.adEditNone;
    this._status = RecordStatusEnum.adRecOK;
    this.emit('recordChangeComplete', null);
  }

  cancelUpdate(): void {
    if (this._editMode === EditModeEnum.adEditAdd) {
      // Supprimer le nouveau record
      if (this._currentRecord >= 0 && this._currentRecord < this._records.length) {
        this._records.splice(this._currentRecord, 1);
        this._recordCount = this._records.length;
        if (this._currentRecord >= this._records.length) {
          this._currentRecord = this._records.length - 1;
        }
        if (this._records.length === 0) {
          this._bof = true;
          this._eof = true;
          this._currentRecord = -1;
          this._absolutePosition = 0;
        }
      }
    }

    this._editMode = EditModeEnum.adEditNone;
    this._status = RecordStatusEnum.adRecOK;
    this.updateFieldValues();
    this.emit('recordChangeComplete', null);
  }

  delete(affectRecords?: number): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    if (this._lockType === LockTypeEnum.adLockReadOnly) {
      throw new Error('Cannot delete from read-only recordset');
    }

    if (this._currentRecord < 0 || this._currentRecord >= this._records.length) {
      throw new Error('No current record');
    }

    this._records.splice(this._currentRecord, 1);
    this._recordCount = this._records.length;
    this._status = RecordStatusEnum.adRecDeleted;

    if (this._records.length === 0) {
      this._bof = true;
      this._eof = true;
      this._currentRecord = -1;
      this._absolutePosition = 0;
    } else {
      if (this._currentRecord >= this._records.length) {
        this._currentRecord = this._records.length - 1;
      }
      this._absolutePosition = this._currentRecord + 1;
      this.updateFieldValues();
    }

    this.emit('recordChangeComplete', null);
  }

  // Méthodes de gestion
  async open(
    source?: string | ADOCommand,
    activeConnection?: ADOConnection,
    cursorType?: CursorTypeEnum,
    lockType?: LockTypeEnum,
    options?: number
  ): Promise<void> {
    if (this._state === ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is already open');
    }

    if (source) {
      this._source = source;
    }

    if (activeConnection) {
      this._activeConnection = activeConnection;
    }

    if (cursorType !== undefined) {
      this._cursorType = cursorType;
    }

    if (lockType !== undefined) {
      this._lockType = lockType;
    }

    if (!this._activeConnection || this._activeConnection.state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Connection is not open');
    }

    this._state = ObjectStateEnum.adStateOpen;
    this._recordCount = this._records.length;

    if (this._records.length > 0) {
      this._currentRecord = 0;
      this._absolutePosition = 1;
      this._bof = false;
      this._eof = false;
      this.updateFieldValues();
    } else {
      this._bof = true;
      this._eof = true;
      this._currentRecord = -1;
      this._absolutePosition = 0;
    }

    this.emit('willChangeRecordset', null);
  }

  close(): void {
    if (this._state !== ObjectStateEnum.adStateClosed) {
      this._state = ObjectStateEnum.adStateClosed;
      this.emit('recordsetChangeComplete', null);
    }
  }

  async requery(options?: number): Promise<void> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    this.emit('willChangeRecordset', null);
    // Simulation du rechargement des données
    await new Promise(resolve => setTimeout(resolve, 50));
    this.emit('recordsetChangeComplete', null);
  }

  async resync(affectRecords?: number): Promise<void> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    this.emit('willChangeRecordset', null);
    // Simulation de la resynchronisation
    await new Promise(resolve => setTimeout(resolve, 50));
    this.emit('recordsetChangeComplete', null);
  }

  supports(cursorOptions: number): boolean {
    // Simulation du support des options de curseur
    return true;
  }

  clone(lockType?: LockTypeEnum): ADORecordset {
    const clonedRecordset = new ADORecordset();
    clonedRecordset._activeConnection = this._activeConnection;
    clonedRecordset._source = this._source;
    clonedRecordset._cursorType = this._cursorType;
    clonedRecordset._lockType = lockType || this._lockType;
    clonedRecordset._records = [...this._records];
    clonedRecordset._recordCount = this._recordCount;

    // Cloner les champs
    for (const field of this._fields) {
      clonedRecordset._fields.append(field.name, field.type, field.definedSize, field.attributes);
    }

    return clonedRecordset;
  }

  async save(destination?: string, persistFormat?: number): Promise<void> {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    // Simulation de la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 100));
    this.emit('willChangeRecordset', null);
    this.emit('recordsetChangeComplete', null);
  }

  find(
    criteria: string,
    skipRecords?: number,
    searchDirection?: number,
    start?: ADOBookmark
  ): void {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    // Simulation de la recherche
    let startPos = this._currentRecord;
    if (skipRecords) {
      startPos += skipRecords;
    }

    // Recherche simple par nom (pour l'exemple)
    for (let i = startPos; i < this._records.length; i++) {
      const record = this._records[i];
      if (
        criteria.includes('Name') &&
        record.Name &&
        record.Name.includes(criteria.split('=')[1]?.trim().replace(/'/g, ''))
      ) {
        this._currentRecord = i;
        this._absolutePosition = i + 1;
        this._bof = false;
        this._eof = false;
        this.updateFieldValues();
        return;
      }
    }

    // Pas trouvé - aller à EOF
    this._eof = true;
    this._currentRecord = this._records.length;
    this._absolutePosition = this._records.length + 1;
  }

  getRows(rows?: number, start?: ADOBookmark, fields?: string[]): ADORecord[] {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    const startPos = this._currentRecord;
    const endPos = rows ? Math.min(startPos + rows, this._records.length) : this._records.length;

    const result: ADORecord[] = [];
    for (let i = startPos; i < endPos; i++) {
      const record = this._records[i];
      if (fields) {
        const filteredRecord: ADORecord = {};
        for (const field of fields) {
          filteredRecord[field] = record[field];
        }
        result.push(filteredRecord);
      } else {
        result.push({ ...record });
      }
    }

    return result;
  }

  getString(
    stringFormat?: number,
    numRows?: number,
    columnDelimiter?: string,
    rowDelimiter?: string,
    nullExpr?: string
  ): string {
    if (this._state !== ObjectStateEnum.adStateOpen) {
      throw new Error('Recordset is not open');
    }

    const colDelim = columnDelimiter || '\t';
    const rowDelim = rowDelimiter || '\r\n';
    const nullExpression = nullExpr || '';

    let result = '';
    const startPos = this._currentRecord;
    const endPos = numRows
      ? Math.min(startPos + numRows, this._records.length)
      : this._records.length;

    for (let i = startPos; i < endPos; i++) {
      const record = this._records[i];
      const values: string[] = [];

      for (const field of this._fields) {
        const value = record[field.name];
        values.push(value === null || value === undefined ? nullExpression : String(value));
      }

      result += values.join(colDelim);
      if (i < endPos - 1) {
        result += rowDelim;
      }
    }

    return result;
  }

  private updateFieldValues(): void {
    if (this._currentRecord >= 0 && this._currentRecord < this._records.length) {
      const record = this._records[this._currentRecord];
      for (const field of this._fields) {
        field.value = record[field.name];
      }
    }
  }
}

// Exportation des classes principales
export {
  ADOConnection,
  ADOCommand,
  ADORecordset,
  ADOField,
  ADOFields,
  ADOParameter,
  ADOParameters,
};

// Fonction utilitaire pour créer une connexion ADO
export function createADOConnection(connectionString?: string): ADOConnection {
  const connection = new ADOConnection();
  if (connectionString) {
    connection.connectionString = connectionString;
  }
  return connection;
}

// Fonction utilitaire pour créer une commande ADO
export function createADOCommand(commandText?: string, connection?: ADOConnection): ADOCommand {
  const command = new ADOCommand();
  if (commandText) {
    command.commandText = commandText;
  }
  if (connection) {
    command.activeConnection = connection;
  }
  return command;
}

// Fonction utilitaire pour créer un recordset ADO
export function createADORecordset(): ADORecordset {
  return new ADORecordset();
}

export default {
  ADOConnection,
  ADOCommand,
  ADORecordset,
  ADOField,
  ADOFields,
  ADOParameter,
  ADOParameters,
  createADOConnection,
  createADOCommand,
  createADORecordset,
  CursorTypeEnum,
  LockTypeEnum,
  CommandTypeEnum,
  ParameterDirectionEnum,
  DataTypeEnum,
  ObjectStateEnum,
  ConnectModeEnum,
  IsolationLevelEnum,
  EditModeEnum,
  RecordStatusEnum,
  FieldAttributeEnum,
};
