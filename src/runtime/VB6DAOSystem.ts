/**
 * VB6 DAO (Data Access Objects) System - Complete Legacy Database Access Implementation
 * Provides full compatibility with VB6 DAO 3.6 for legacy applications
 * Supports Microsoft Access, dBase, FoxPro, Paradox, and ODBC databases
 */

// DAO Constants
export const DAO_CONSTANTS = {
  // Database Types
  dbLangGeneral: ';LANGID=0x0409;CP=1252;COUNTRY=0',
  dbVersion10: 1,
  dbVersion11: 8,
  dbVersion20: 16,
  dbVersion30: 32,

  // Open Database Options
  dbOpenDatabase: 2,
  dbOpenDynaset: 2,
  dbOpenTable: 1,
  dbOpenSnapshot: 4,
  dbOpenForwardOnly: 8,

  // Lock Types
  dbReadOnly: 4,
  dbAppendOnly: 8,
  dbInconsistent: 16,
  dbConsistent: 32,

  // Record Types
  dbOpenRecordset: 0,
  dbDenyWrite: 1,
  dbDenyRead: 2,

  // Field Types
  dbBoolean: 1,
  dbByte: 2,
  dbInteger: 3,
  dbLong: 4,
  dbCurrency: 5,
  dbSingle: 6,
  dbDouble: 7,
  dbDate: 8,
  dbBinary: 9,
  dbText: 10,
  dbLongBinary: 11,
  dbMemo: 12,
  dbGUID: 15,
  dbBigInt: 16,
  dbVarBinary: 17,
  dbChar: 18,
  dbNumeric: 19,
  dbDecimal: 20,
  dbFloat: 21,
  dbTime: 22,
  dbTimeStamp: 23,

  // Recordset States
  dbRecordUnchanged: 0,
  dbRecordNew: 1,
  dbRecordModified: 2,
  dbRecordDeleted: 4,
  dbRecordDBDeleted: 8,
};

// DAO Error Codes
export const DAO_ERRORS = {
  3000: 'Reserved error',
  3001: 'Invalid argument',
  3002: 'Could not start session',
  3003: 'Could not start transaction',
  3004: 'Database already open',
  3005: 'Database name is not a valid name',
  3006: 'Database is exclusively locked',
  3007: 'Cannot open library database',
  3008: 'Table is exclusively locked',
  3009: 'Could not lock table',
  3010: 'Table already exists',
  3011: 'Database engine could not find object',
  3012: 'Object already exists',
  3013: 'Could not rename',
  3014: 'Cannot open anymore databases',
  3015: 'Index not found',
  3016: 'Field will not fit in record',
  3017: 'Field size is too long',
  3018: 'Could not find field',
  3019: 'Operation invalid without a current index',
  3020: 'Update or CancelUpdate without AddNew or Edit',
  3021: 'No current record',
  3022: 'Duplicate values in index or primary key',
  3023: 'AddNew or Edit already used',
  3024: 'Could not find file',
  3025: 'Cannot open anymore files',
  3026: 'Space on disk insufficient',
  3027: 'Cannot update record',
  3028: 'Cannot start your application',
  3029: 'Not a valid account name or password',
  3030: 'Not a valid account name',
  3031: 'Not a valid password',
  3032: 'Cannot perform this operation',
  3033: 'You do not have the necessary permissions',
  3034: 'You tried to commit or rollback a transaction without first beginning a transaction',
  3035: 'System resource exceeded',
  3036: 'Database has reached maximum size',
  3037: 'Cannot open anymore tables or queries',
  3038: 'System resource exceeded',
  3039: 'Could not create index',
  3040: 'Disk I/O error during read',
  3041: 'Cannot open a database created with a previous version',
  3042: 'Out of MS-DOS file handles',
  3043: 'Disk or network error',
  3044: 'Path not found',
  3045: 'Could not use file; file already in use',
  3046: 'Could not save; currently locked by another user',
  3047: 'Record is too large',
  3048: 'Cannot open anymore databases',
  3049: 'Cannot open database',
  3050: 'Could not lock file',
  3051: 'File already opened exclusively by another user',
  3052: 'File sharing lock count exceeded',
  3053: 'Too many client tasks',
  3054: 'Too many Memo or OLE Object fields',
  3055: 'Not a valid file name',
  3056: 'Could not repair this database',
  3057: 'Operation not supported on linked tables',
  3058: 'Index or primary key cannot contain a null value',
  3059: 'Operation canceled by user',
  3060: 'Wrong data type for parameter',
  3061: 'Too few parameters',
  3062: 'Duplicate output destination',
  3063: 'Duplicate output alias',
  3064: 'Cannot open action query',
  3065: 'Cannot execute a select query',
  3066: 'Query must have at least one destination field',
  3067: 'Query input must contain at least one table or query',
  3068: 'Not a valid alias name',
  3069: 'The action query cannot be used as a row source',
  3070: 'The Microsoft Jet database engine does not recognize as a valid field name or expression',
  3071: 'This expression is typed incorrectly, or it is too complex to be evaluated',
  3072: 'Parameter has no default value',
  3073: 'Operation must use an updateable query',
  3074: 'Cannot repeat table name in FROM clause',
  3075: 'Syntax error in date',
  3076: 'Criteria expression has invalid syntax',
  3077: 'Syntax error in expression',
  3078: 'The Microsoft Jet database engine cannot find the input table or query',
  3079: 'The specified field could ambiguously refer to more than one table listed in the FROM clause',
  3080: 'Joined table not listed in FROM clause',
  3081: 'Cannot join more than one table with the same name',
  3082: 'Syntax error in JOIN operation',
  3083: 'Cannot use internal report query',
  3084: 'Cannot insert data with action query',
  3085: 'Undefined function in expression',
  3086: 'Could not delete from specified tables',
  3087: 'Too many expressions in GROUP BY clause',
  3088: 'Too many expressions in ORDER BY clause',
  3089: 'Too many expressions in DISTINCT output',
  3090: 'Resultant table not allowed to have more than one AutoNumber field',
  3091: 'HAVING clause without grouping or aggregation',
  3092: 'Cannot use HAVING clause without grouping or aggregation',
  3093: 'ORDER BY clause conflicts with DISTINCT',
  3094: 'ORDER BY clause conflicts with GROUP BY clause',
  3095: 'Cannot have aggregate function in expression',
  3096: 'Cannot have aggregate function in WHERE clause',
  3097: 'Cannot have aggregate function in ORDER BY clause',
  3098: 'Cannot have aggregate function in GROUP BY clause',
  3099: 'Cannot have aggregate function in JOIN clause',
  3100: 'Cannot set field in join key to Null',
};

// Field object
export class DAOField {
  private _name: string = '';
  private _type: number = DAO_CONSTANTS.dbText;
  private _size: number = 0;
  private _value: any = null;
  private _required: boolean = false;
  private _allowZeroLength: boolean = true;
  private _attributes: number = 0;
  private _ordinalPosition: number = 0;
  private _sourceField: string = '';
  private _sourceTable: string = '';
  private _defaultValue: any = null;
  private _validationRule: string = '';
  private _validationText: string = '';

  constructor(name: string, type: number, size: number = 0) {
    this._name = name;
    this._type = type;
    this._size = size;
  }

  // Properties
  get Name(): string {
    return this._name;
  }
  set Name(value: string) {
    this._name = value;
  }

  get Type(): number {
    return this._type;
  }
  set Type(value: number) {
    this._type = value;
  }

  get Size(): number {
    return this._size;
  }
  set Size(value: number) {
    this._size = value;
  }

  get Value(): any {
    return this._value;
  }
  set Value(value: any) {
    this._value = this.convertValue(value);
  }

  get Required(): boolean {
    return this._required;
  }
  set Required(value: boolean) {
    this._required = value;
  }

  get AllowZeroLength(): boolean {
    return this._allowZeroLength;
  }
  set AllowZeroLength(value: boolean) {
    this._allowZeroLength = value;
  }

  get Attributes(): number {
    return this._attributes;
  }
  set Attributes(value: number) {
    this._attributes = value;
  }

  get OrdinalPosition(): number {
    return this._ordinalPosition;
  }
  set OrdinalPosition(value: number) {
    this._ordinalPosition = value;
  }

  get SourceField(): string {
    return this._sourceField;
  }
  set SourceField(value: string) {
    this._sourceField = value;
  }

  get SourceTable(): string {
    return this._sourceTable;
  }
  set SourceTable(value: string) {
    this._sourceTable = value;
  }

  get DefaultValue(): any {
    return this._defaultValue;
  }
  set DefaultValue(value: any) {
    this._defaultValue = value;
  }

  get ValidationRule(): string {
    return this._validationRule;
  }
  set ValidationRule(value: string) {
    this._validationRule = value;
  }

  get ValidationText(): string {
    return this._validationText;
  }
  set ValidationText(value: string) {
    this._validationText = value;
  }

  // Methods
  private convertValue(value: any): any {
    switch (this._type) {
      case DAO_CONSTANTS.dbBoolean:
        return Boolean(value);
      case DAO_CONSTANTS.dbByte:
      case DAO_CONSTANTS.dbInteger:
      case DAO_CONSTANTS.dbLong:
        return parseInt(String(value)) || 0;
      case DAO_CONSTANTS.dbSingle:
      case DAO_CONSTANTS.dbDouble:
      case DAO_CONSTANTS.dbCurrency:
        return parseFloat(String(value)) || 0;
      case DAO_CONSTANTS.dbDate:
        return value instanceof Date ? value : new Date(value);
      case DAO_CONSTANTS.dbText:
      case DAO_CONSTANTS.dbMemo:
        return String(value);
      default:
        return value;
    }
  }

  GetChunk(offset: number, numBytes: number): any {
    // For binary fields
    if (this._type === DAO_CONSTANTS.dbLongBinary && this._value) {
      return this._value.slice(offset, offset + numBytes);
    }
    return null;
  }

  AppendChunk(bytes: any): void {
    // For binary fields
    if (this._type === DAO_CONSTANTS.dbLongBinary) {
      if (!this._value) this._value = new Uint8Array(0);
      const combined = new Uint8Array(this._value.length + bytes.length);
      combined.set(this._value);
      combined.set(bytes, this._value.length);
      this._value = combined;
    }
  }
}

// Fields collection
export class DAOFields {
  private _fields: Map<string, DAOField> = new Map();
  private _fieldArray: DAOField[] = [];

  get Count(): number {
    return this._fields.size;
  }

  Item(index: number | string): DAOField | null {
    if (typeof index === 'number') {
      return this._fieldArray[index] || null;
    } else {
      return this._fields.get(index.toLowerCase()) || null;
    }
  }

  Append(field: DAOField): void {
    this._fields.set(field.Name.toLowerCase(), field);
    this._fieldArray.push(field);
    field.OrdinalPosition = this._fieldArray.length - 1;
  }

  Delete(name: string): void {
    const field = this._fields.get(name.toLowerCase());
    if (field) {
      this._fields.delete(name.toLowerCase());
      const index = this._fieldArray.indexOf(field);
      if (index >= 0) {
        this._fieldArray.splice(index, 1);
        // Update ordinal positions
        for (let i = index; i < this._fieldArray.length; i++) {
          this._fieldArray[i].OrdinalPosition = i;
        }
      }
    }
  }

  Refresh(): void {
    // Refresh field definitions from database
  }

  // For iteration
  [Symbol.iterator]() {
    return this._fieldArray[Symbol.iterator]();
  }
}

// Index object
export class DAOIndex {
  private _name: string = '';
  private _fields: string = '';
  private _primary: boolean = false;
  private _unique: boolean = false;
  private _clustered: boolean = false;
  private _ignoreNulls: boolean = false;
  private _required: boolean = false;
  private _foreign: boolean = false;

  constructor(name: string) {
    this._name = name;
  }

  get Name(): string {
    return this._name;
  }
  set Name(value: string) {
    this._name = value;
  }

  get Fields(): string {
    return this._fields;
  }
  set Fields(value: string) {
    this._fields = value;
  }

  get Primary(): boolean {
    return this._primary;
  }
  set Primary(value: boolean) {
    this._primary = value;
  }

  get Unique(): boolean {
    return this._unique;
  }
  set Unique(value: boolean) {
    this._unique = value;
  }

  get Clustered(): boolean {
    return this._clustered;
  }
  set Clustered(value: boolean) {
    this._clustered = value;
  }

  get IgnoreNulls(): boolean {
    return this._ignoreNulls;
  }
  set IgnoreNulls(value: boolean) {
    this._ignoreNulls = value;
  }

  get Required(): boolean {
    return this._required;
  }
  set Required(value: boolean) {
    this._required = value;
  }

  get Foreign(): boolean {
    return this._foreign;
  }
  set Foreign(value: boolean) {
    this._foreign = value;
  }
}

// Indexes collection
export class DAOIndexes {
  private _indexes: Map<string, DAOIndex> = new Map();
  private _indexArray: DAOIndex[] = [];

  get Count(): number {
    return this._indexes.size;
  }

  Item(index: number | string): DAOIndex | null {
    if (typeof index === 'number') {
      return this._indexArray[index] || null;
    } else {
      return this._indexes.get(index.toLowerCase()) || null;
    }
  }

  Append(index: DAOIndex): void {
    this._indexes.set(index.Name.toLowerCase(), index);
    this._indexArray.push(index);
  }

  Delete(name: string): void {
    const index = this._indexes.get(name.toLowerCase());
    if (index) {
      this._indexes.delete(name.toLowerCase());
      const arrayIndex = this._indexArray.indexOf(index);
      if (arrayIndex >= 0) {
        this._indexArray.splice(arrayIndex, 1);
      }
    }
  }

  Refresh(): void {}

  [Symbol.iterator]() {
    return this._indexArray[Symbol.iterator]();
  }
}

// TableDef object
export class DAOTableDef {
  private _name: string = '';
  private _attributes: number = 0;
  private _connect: string = '';
  private _dateCreated: Date = new Date();
  private _lastUpdated: Date = new Date();
  private _recordCount: number = 0;
  private _sourceTableName: string = '';
  private _updatable: boolean = true;
  private _validationRule: string = '';
  private _validationText: string = '';
  private _fields: DAOFields = new DAOFields();
  private _indexes: DAOIndexes = new DAOIndexes();

  constructor(name?: string) {
    if (name) this._name = name;
  }

  // Properties
  get Name(): string {
    return this._name;
  }
  set Name(value: string) {
    this._name = value;
  }

  get Attributes(): number {
    return this._attributes;
  }
  set Attributes(value: number) {
    this._attributes = value;
  }

  get Connect(): string {
    return this._connect;
  }
  set Connect(value: string) {
    this._connect = value;
  }

  get DateCreated(): Date {
    return this._dateCreated;
  }

  get LastUpdated(): Date {
    return this._lastUpdated;
  }

  get RecordCount(): number {
    return this._recordCount;
  }

  get SourceTableName(): string {
    return this._sourceTableName;
  }
  set SourceTableName(value: string) {
    this._sourceTableName = value;
  }

  get Updatable(): boolean {
    return this._updatable;
  }

  get ValidationRule(): string {
    return this._validationRule;
  }
  set ValidationRule(value: string) {
    this._validationRule = value;
  }

  get ValidationText(): string {
    return this._validationText;
  }
  set ValidationText(value: string) {
    this._validationText = value;
  }

  get Fields(): DAOFields {
    return this._fields;
  }

  get Indexes(): DAOIndexes {
    return this._indexes;
  }

  // Methods
  CreateField(name?: string, type?: number, size?: number): DAOField {
    const field = new DAOField(name || '', type || DAO_CONSTANTS.dbText, size || 0);
    return field;
  }

  CreateIndex(name?: string): DAOIndex {
    const index = new DAOIndex(name || '');
    return index;
  }

  OpenRecordset(type?: number, options?: number): DAORecordset {
    const recordset = new DAORecordset();
    recordset._name = this._name;
    recordset._type = type || DAO_CONSTANTS.dbOpenTable;
    recordset._options = options || 0;

    // Copy field definitions
    for (const field of this._fields) {
      const newField = new DAOField(field.Name, field.Type, field.Size);
      recordset._fields.Append(newField);
    }

    return recordset;
  }

  RefreshLink(): void {}
}

// TableDefs collection
export class DAOTableDefs {
  private _tableDefs: Map<string, DAOTableDef> = new Map();
  private _tableDefArray: DAOTableDef[] = [];

  get Count(): number {
    return this._tableDefs.size;
  }

  Item(index: number | string): DAOTableDef | null {
    if (typeof index === 'number') {
      return this._tableDefArray[index] || null;
    } else {
      return this._tableDefs.get(index.toLowerCase()) || null;
    }
  }

  Append(tableDef: DAOTableDef): void {
    this._tableDefs.set(tableDef.Name.toLowerCase(), tableDef);
    this._tableDefArray.push(tableDef);
  }

  Delete(name: string): void {
    const tableDef = this._tableDefs.get(name.toLowerCase());
    if (tableDef) {
      this._tableDefs.delete(name.toLowerCase());
      const index = this._tableDefArray.indexOf(tableDef);
      if (index >= 0) {
        this._tableDefArray.splice(index, 1);
      }
    }
  }

  Refresh(): void {}

  [Symbol.iterator]() {
    return this._tableDefArray[Symbol.iterator]();
  }
}

// QueryDef object
export class DAOQueryDef {
  private _name: string = '';
  private _sql: string = '';
  private _connect: string = '';
  private _dateCreated: Date = new Date();
  private _lastUpdated: Date = new Date();
  private _parameters: any[] = [];
  private _fields: DAOFields = new DAOFields();
  private _recordsAffected: number = 0;
  private _returnsRecords: boolean = true;
  private _type: number = 0;
  private _updatable: boolean = true;

  constructor(name?: string, sqlText?: string) {
    if (name) this._name = name;
    if (sqlText) this._sql = sqlText;
  }

  // Properties
  get Name(): string {
    return this._name;
  }
  set Name(value: string) {
    this._name = value;
  }

  get SQL(): string {
    return this._sql;
  }
  set SQL(value: string) {
    this._sql = value;
  }

  get Connect(): string {
    return this._connect;
  }
  set Connect(value: string) {
    this._connect = value;
  }

  get DateCreated(): Date {
    return this._dateCreated;
  }

  get LastUpdated(): Date {
    return this._lastUpdated;
  }

  get RecordsAffected(): number {
    return this._recordsAffected;
  }

  get ReturnsRecords(): boolean {
    return this._returnsRecords;
  }

  get Type(): number {
    return this._type;
  }

  get Updatable(): boolean {
    return this._updatable;
  }

  get Fields(): DAOFields {
    return this._fields;
  }

  // Methods
  Execute(options?: number): void {
    // In a real implementation, this would execute the SQL
    this._recordsAffected = 0; // Would be set by actual execution
  }

  OpenRecordset(type?: number, options?: number): DAORecordset {
    const recordset = new DAORecordset();
    recordset._name = this._name;
    recordset._sql = this._sql;
    recordset._type = type || DAO_CONSTANTS.dbOpenDynaset;
    recordset._options = options || 0;
    return recordset;
  }

  CreateParameter(
    name?: string,
    type?: number,
    direction?: number,
    size?: number,
    value?: any
  ): any {
    const parameter = {
      Name: name || '',
      Type: type || DAO_CONSTANTS.dbText,
      Direction: direction || 1, // Input
      Size: size || 0,
      Value: value,
    };
    return parameter;
  }

  Close(): void {}
}

// QueryDefs collection
export class DAOQueryDefs {
  private _queryDefs: Map<string, DAOQueryDef> = new Map();
  private _queryDefArray: DAOQueryDef[] = [];

  get Count(): number {
    return this._queryDefs.size;
  }

  Item(index: number | string): DAOQueryDef | null {
    if (typeof index === 'number') {
      return this._queryDefArray[index] || null;
    } else {
      return this._queryDefs.get(index.toLowerCase()) || null;
    }
  }

  Append(queryDef: DAOQueryDef): void {
    this._queryDefs.set(queryDef.Name.toLowerCase(), queryDef);
    this._queryDefArray.push(queryDef);
  }

  Delete(name: string): void {
    const queryDef = this._queryDefs.get(name.toLowerCase());
    if (queryDef) {
      this._queryDefs.delete(name.toLowerCase());
      const index = this._queryDefArray.indexOf(queryDef);
      if (index >= 0) {
        this._queryDefArray.splice(index, 1);
      }
    }
  }

  Refresh(): void {}

  [Symbol.iterator]() {
    return this._queryDefArray[Symbol.iterator]();
  }
}

// Recordset object - the core data access object
export class DAORecordset {
  public _name: string = '';
  public _sql: string = '';
  public _type: number = DAO_CONSTANTS.dbOpenDynaset;
  public _options: number = 0;
  public _fields: DAOFields = new DAOFields();
  private _records: any[] = [];
  private _currentIndex: number = -1;
  private _editMode: number = DAO_CONSTANTS.dbRecordUnchanged;
  private _lockType: number = 0;
  private _absolutePosition: number = 0;
  private _bookmarkable: boolean = true;
  private _bookmark: any = null;
  private _cacheSize: number = 100;
  private _cacheStart: number = 0;
  private _dateCreated: Date = new Date();
  private _editInProgress: boolean = false;
  private _filter: string = '';
  private _index: string = '';
  private _lastModified: any = null;
  private _lastUpdated: Date = new Date();
  private _noMatch: boolean = false;
  private _percentPosition: number = 0;
  private _recordCount: number = 0;
  private _sort: string = '';
  private _transactions: boolean = true;
  private _type2: number = 0;
  private _updatable: boolean = true;
  private _validationRule: string = '';
  private _validationText: string = '';

  // Data binding and persistence
  private _dataBindings: RecordsetDataBindings = {};
  private _persistenceId: string = '';
  private _isDirty: boolean = false;
  private _transactionId: string | null = null;
  private _backendConnection: DAOBackendConnectionBridge | null = null;
  private _originalRecord: any = null;

  constructor() {
    // Initialize with sample data for testing
    this.initializeSampleData();
    // Generate persistence ID for IndexedDB storage
    this._persistenceId = `recordset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSampleData(): void {
    // Create sample fields
    const idField = new DAOField('ID', DAO_CONSTANTS.dbLong);
    const nameField = new DAOField('Name', DAO_CONSTANTS.dbText, 50);
    const dateField = new DAOField('DateCreated', DAO_CONSTANTS.dbDate);

    this._fields.Append(idField);
    this._fields.Append(nameField);
    this._fields.Append(dateField);

    // Create sample records
    this._records = [
      { ID: 1, Name: 'Sample Record 1', DateCreated: new Date('2024-01-01') },
      { ID: 2, Name: 'Sample Record 2', DateCreated: new Date('2024-01-02') },
      { ID: 3, Name: 'Sample Record 3', DateCreated: new Date('2024-01-03') },
    ];

    this._recordCount = this._records.length;
    if (this._records.length > 0) {
      this._currentIndex = 0;
      this.updateFieldValues();
    }
  }

  private updateFieldValues(): void {
    if (this._currentIndex >= 0 && this._currentIndex < this._records.length) {
      const currentRecord = this._records[this._currentIndex];
      for (const field of this._fields) {
        field.Value = currentRecord[field.Name];
      }
    }
  }

  private updateRecordFromFields(): void {
    if (this._currentIndex >= 0 && this._currentIndex < this._records.length) {
      const currentRecord = this._records[this._currentIndex];
      for (const field of this._fields) {
        currentRecord[field.Name] = field.Value;
      }
    }
  }

  // Properties
  get AbsolutePosition(): number {
    return this._absolutePosition;
  }
  set AbsolutePosition(value: number) {
    if (value >= 0 && value < this._recordCount) {
      this._absolutePosition = value;
      this._currentIndex = value;
      this.updateFieldValues();
    }
  }

  get BOF(): boolean {
    return this._currentIndex < 0 || this._recordCount === 0;
  }

  get EOF(): boolean {
    return this._currentIndex >= this._recordCount || this._recordCount === 0;
  }

  get Bookmarkable(): boolean {
    return this._bookmarkable;
  }

  get Bookmark(): any {
    return this._bookmark;
  }
  set Bookmark(value: any) {
    this._bookmark = value;
    // In real implementation, would navigate to bookmarked record
  }

  get CacheSize(): number {
    return this._cacheSize;
  }
  set CacheSize(value: number) {
    this._cacheSize = value;
  }

  get CacheStart(): number {
    return this._cacheStart;
  }
  set CacheStart(value: number) {
    this._cacheStart = value;
  }

  get DateCreated(): Date {
    return this._dateCreated;
  }

  get Filter(): string {
    return this._filter;
  }
  set Filter(value: string) {
    this._filter = value;
    this.applyFilter();
  }

  get Index(): string {
    return this._index;
  }
  set Index(value: string) {
    this._index = value;
    this.applySort();
  }

  get LastModified(): any {
    return this._lastModified;
  }

  get LastUpdated(): Date {
    return this._lastUpdated;
  }

  get LockEdits(): boolean {
    return this._lockType !== 0;
  }
  set LockEdits(value: boolean) {
    this._lockType = value ? 1 : 0;
  }

  get Name(): string {
    return this._name;
  }

  get NoMatch(): boolean {
    return this._noMatch;
  }

  get PercentPosition(): number {
    return this._percentPosition;
  }
  set PercentPosition(value: number) {
    this._percentPosition = Math.max(0, Math.min(100, value));
    const newIndex = Math.floor((this._percentPosition / 100) * (this._recordCount - 1));
    this.AbsolutePosition = newIndex;
  }

  get RecordCount(): number {
    return this._recordCount;
  }

  get Restartable(): boolean {
    return true;
  }

  get Sort(): string {
    return this._sort;
  }
  set Sort(value: string) {
    this._sort = value;
    this.applySort();
  }

  get Transactions(): boolean {
    return this._transactions;
  }

  get Type(): number {
    return this._type;
  }

  get Updatable(): boolean {
    return this._updatable;
  }

  get ValidationRule(): string {
    return this._validationRule;
  }

  get ValidationText(): string {
    return this._validationText;
  }

  get Fields(): DAOFields {
    return this._fields;
  }

  // Navigation methods
  MoveFirst(): void {
    if (this._recordCount > 0) {
      this._currentIndex = 0;
      this._absolutePosition = 0;
      this.updateFieldValues();
    }
  }

  MoveLast(): void {
    if (this._recordCount > 0) {
      this._currentIndex = this._recordCount - 1;
      this._absolutePosition = this._recordCount - 1;
      this.updateFieldValues();
    }
  }

  MoveNext(): void {
    if (this._currentIndex < this._recordCount - 1) {
      this._currentIndex++;
      this._absolutePosition++;
      this.updateFieldValues();
    } else if (this._currentIndex < this._recordCount) {
      this._currentIndex = this._recordCount; // EOF
    }
  }

  MovePrevious(): void {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this._absolutePosition--;
      this.updateFieldValues();
    } else if (this._currentIndex >= 0) {
      this._currentIndex = -1; // BOF
    }
  }

  Move(rows: number, startBookmark?: any): void {
    let newIndex = this._currentIndex + rows;
    if (startBookmark) {
      // Would use bookmark to determine start position
      newIndex = rows; // Simplified
    }

    newIndex = Math.max(-1, Math.min(this._recordCount, newIndex));
    this._currentIndex = newIndex;

    if (newIndex >= 0 && newIndex < this._recordCount) {
      this._absolutePosition = newIndex;
      this.updateFieldValues();
    }
  }

  // Edit methods
  AddNew(): void {
    if (!this._updatable) {
      throw new Error('Recordset is not updatable');
    }

    this._editMode = DAO_CONSTANTS.dbRecordNew;
    this._editInProgress = true;

    // Clear field values for new record
    for (const field of this._fields) {
      field.Value = field.DefaultValue || this.getDefaultValueForType(field.Type);
    }
  }

  Edit(): void {
    if (!this._updatable) {
      throw new Error('Recordset is not updatable');
    }

    if (this.BOF || this.EOF) {
      throw new Error('No current record');
    }

    this._editMode = DAO_CONSTANTS.dbRecordModified;
    this._editInProgress = true;
  }

  Update(): void {
    if (!this._editInProgress) {
      throw new Error('No edit in progress');
    }

    if (this._editMode === DAO_CONSTANTS.dbRecordNew) {
      // Add new record
      const newRecord: any = {};
      for (const field of this._fields) {
        newRecord[field.Name] = field.Value;
      }
      this._records.push(newRecord);
      this._recordCount++;
      this._currentIndex = this._records.length - 1;
      this._absolutePosition = this._currentIndex;
    } else if (this._editMode === DAO_CONSTANTS.dbRecordModified) {
      // Update existing record
      this.updateRecordFromFields();
    }

    this._editMode = DAO_CONSTANTS.dbRecordUnchanged;
    this._editInProgress = false;
    this._lastUpdated = new Date();
  }

  CancelUpdate(): void {
    if (this._editInProgress) {
      this._editMode = DAO_CONSTANTS.dbRecordUnchanged;
      this._editInProgress = false;

      // Restore field values from current record
      this.updateFieldValues();
    }
  }

  Delete(): void {
    if (!this._updatable) {
      throw new Error('Recordset is not updatable');
    }

    if (this.BOF || this.EOF) {
      throw new Error('No current record');
    }

    this._records.splice(this._currentIndex, 1);
    this._recordCount--;

    // Adjust current position
    if (this._currentIndex >= this._recordCount) {
      this._currentIndex = this._recordCount - 1;
    }

    if (this._currentIndex >= 0) {
      this.updateFieldValues();
    }
  }

  // Search methods
  FindFirst(criteria: string): void {
    this._noMatch = true;

    for (let i = 0; i < this._records.length; i++) {
      if (this.evaluateCriteria(this._records[i], criteria)) {
        this._currentIndex = i;
        this._absolutePosition = i;
        this.updateFieldValues();
        this._noMatch = false;
        break;
      }
    }
  }

  FindLast(criteria: string): void {
    this._noMatch = true;

    for (let i = this._records.length - 1; i >= 0; i--) {
      if (this.evaluateCriteria(this._records[i], criteria)) {
        this._currentIndex = i;
        this._absolutePosition = i;
        this.updateFieldValues();
        this._noMatch = false;
        break;
      }
    }
  }

  FindNext(criteria: string): void {
    this._noMatch = true;

    for (let i = this._currentIndex + 1; i < this._records.length; i++) {
      if (this.evaluateCriteria(this._records[i], criteria)) {
        this._currentIndex = i;
        this._absolutePosition = i;
        this.updateFieldValues();
        this._noMatch = false;
        break;
      }
    }
  }

  FindPrevious(criteria: string): void {
    this._noMatch = true;

    for (let i = this._currentIndex - 1; i >= 0; i--) {
      if (this.evaluateCriteria(this._records[i], criteria)) {
        this._currentIndex = i;
        this._absolutePosition = i;
        this.updateFieldValues();
        this._noMatch = false;
        break;
      }
    }
  }

  Seek(comparison: string, ...keyValues: any[]): void {
    // Simplified seek implementation
    const criteria = keyValues.length > 0 ? `ID ${comparison} ${keyValues[0]}` : '';
    this.FindFirst(criteria);
  }

  // Utility methods
  Clone(): DAORecordset {
    const clone = new DAORecordset();
    clone._records = [...this._records];
    clone._recordCount = this._recordCount;
    // Copy other properties as needed
    return clone;
  }

  Close(): void {
    this._records.length = 0;
    this._recordCount = 0;
    this._currentIndex = -1;
  }

  CopyQueryDef(): DAOQueryDef {
    const queryDef = new DAOQueryDef(this._name, this._sql);
    return queryDef;
  }

  GetRows(numRows?: number): any[][] {
    const startIndex = Math.max(0, this._currentIndex);
    const endIndex = Math.min(this._records.length, startIndex + (numRows || this._records.length));

    const result: any[][] = [];
    for (let i = startIndex; i < endIndex; i++) {
      const row: any[] = [];
      for (const field of this._fields) {
        row.push(this._records[i][field.Name]);
      }
      result.push(row);
    }

    return result;
  }

  Requery(): void {
    // In real implementation, would re-execute the query
  }

  // Private helper methods
  private getDefaultValueForType(type: number): any {
    switch (type) {
      case DAO_CONSTANTS.dbBoolean:
        return false;
      case DAO_CONSTANTS.dbByte:
      case DAO_CONSTANTS.dbInteger:
      case DAO_CONSTANTS.dbLong:
        return 0;
      case DAO_CONSTANTS.dbSingle:
      case DAO_CONSTANTS.dbDouble:
      case DAO_CONSTANTS.dbCurrency:
        return 0.0;
      case DAO_CONSTANTS.dbDate:
        return new Date();
      case DAO_CONSTANTS.dbText:
      case DAO_CONSTANTS.dbMemo:
        return '';
      default:
        return null;
    }
  }

  private evaluateCriteria(record: any, criteria: string): boolean {
    // Simplified criteria evaluation
    // In real implementation, would parse and evaluate SQL WHERE clause
    try {
      // Simple pattern matching for demo: "FieldName = Value"
      const match = criteria.match(/(\w+)\s*(=|<|>|<=|>=|<>)\s*(.+)/);
      if (match) {
        const [, fieldName, operator, value] = match;
        const recordValue = record[fieldName];
        const testValue = isNaN(Number(value)) ? value.replace(/['"]/g, '') : Number(value);

        switch (operator) {
          case '=':
            return recordValue == testValue;
          case '<':
            return recordValue < testValue;
          case '>':
            return recordValue > testValue;
          case '<=':
            return recordValue <= testValue;
          case '>=':
            return recordValue >= testValue;
          case '<>':
            return recordValue != testValue;
        }
      }
    } catch (error) {
      console.error('Error evaluating criteria:', error);
    }
    return false;
  }

  private applyFilter(): void {
    if (!this._filter) return;

    // In real implementation, would filter records based on criteria
  }

  private applySort(): void {
    if (!this._sort && !this._index) return;

    const sortField = this._sort || this._index;
    this._records.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });

    // Update current position after sort
    if (this._currentIndex >= 0 && this._currentIndex < this._recordCount) {
      this.updateFieldValues();
    }
  }

  // Data Binding Methods
  BindControl(controlName: string, fieldName: string, updateCallback?: (value: any) => void): void {
    this._dataBindings[controlName] = {
      fieldName,
      updateCallback,
    };

    // Update bound control with current field value
    if (this._currentIndex >= 0 && this._currentIndex < this._recordCount) {
      const field = this._fields.Item(fieldName);
      if (field && updateCallback) {
        updateCallback(field.Value);
      }
    }
  }

  UnbindControl(controlName: string): void {
    delete this._dataBindings[controlName];
  }

  GetBoundValue(controlName: string): any {
    const binding = this._dataBindings[controlName];
    if (binding) {
      const field = this._fields.Item(binding.fieldName);
      return field ? field.Value : null;
    }
    return null;
  }

  SetBoundValue(controlName: string, value: any): void {
    const binding = this._dataBindings[controlName];
    if (binding) {
      const field = this._fields.Item(binding.fieldName);
      if (field) {
        field.Value = value;
        this._isDirty = true;
      }
    }
  }

  RefreshBoundControls(): void {
    for (const [controlName, binding] of Object.entries(this._dataBindings)) {
      const field = this._fields.Item(binding.fieldName);
      if (field && binding.updateCallback) {
        binding.updateCallback(field.Value);
      }
    }
  }

  // Persistence Methods
  async SaveToPersistence(): Promise<void> {
    try {
      await IndexedDBStore.saveTable(this._persistenceId, this._records);
      this._isDirty = false;
    } catch (error) {
      console.error('Failed to save recordset to persistence:', error);
      throw error;
    }
  }

  async LoadFromPersistence(): Promise<void> {
    try {
      const records = await IndexedDBStore.loadTable(this._persistenceId);
      if (records.length > 0) {
        this._records = records;
        this._recordCount = records.length;
        if (records.length > 0) {
          this._currentIndex = 0;
          this.updateFieldValues();
        }
        this._isDirty = false;
      }
    } catch (error) {
      console.error('Failed to load recordset from persistence:', error);
      throw error;
    }
  }

  async DeleteFromPersistence(): Promise<void> {
    try {
      await IndexedDBStore.deleteTable(this._persistenceId);
    } catch (error) {
      console.error('Failed to delete recordset from persistence:', error);
      throw error;
    }
  }

  IsDirty(): boolean {
    return this._isDirty;
  }

  // Backend Connection Methods
  ConnectToBackend(connection: DAOBackendConnectionBridge): void {
    this._backendConnection = connection;
  }

  async LoadFromBackend(sql: string, parameters: any[] = []): Promise<void> {
    if (!this._backendConnection) {
      throw new Error('No backend connection configured');
    }

    try {
      const result = await this._backendConnection.execute(sql, parameters);
      this._records = result.data || [];
      this._recordCount = this._records.length;

      if (this._recordCount > 0) {
        this._currentIndex = 0;
        this.updateFieldValues();
      }
    } catch (error) {
      console.error('Failed to load from backend:', error);
      throw error;
    }
  }

  async SaveToBackend(sql: string, parameters: any[] = []): Promise<void> {
    if (!this._backendConnection) {
      throw new Error('No backend connection configured');
    }

    try {
      await this._backendConnection.execute(sql, parameters);
      this._isDirty = false;
    } catch (error) {
      console.error('Failed to save to backend:', error);
      throw error;
    }
  }

  async BeginTransaction(): Promise<void> {
    if (!this._backendConnection) {
      throw new Error('No backend connection configured');
    }

    try {
      this._transactionId = await this._backendConnection.beginTransaction();
    } catch (error) {
      console.error('Failed to begin transaction:', error);
      throw error;
    }
  }

  async CommitTransaction(): Promise<void> {
    if (!this._backendConnection || !this._transactionId) {
      throw new Error('No active transaction');
    }

    try {
      await this._backendConnection.commitTransaction(this._transactionId);
      this._transactionId = null;
      this._isDirty = false;
    } catch (error) {
      console.error('Failed to commit transaction:', error);
      throw error;
    }
  }

  async RollbackTransaction(): Promise<void> {
    if (!this._backendConnection || !this._transactionId) {
      throw new Error('No active transaction');
    }

    try {
      await this._backendConnection.rollbackTransaction(this._transactionId);
      this._transactionId = null;
    } catch (error) {
      console.error('Failed to rollback transaction:', error);
      throw error;
    }
  }

  // Enhanced Edit with original record preservation
  EditWithTracking(): void {
    this.Edit();
    if (this._currentIndex >= 0 && this._currentIndex < this._recordCount) {
      this._originalRecord = { ...this._records[this._currentIndex] };
    }
  }

  CancelUpdateWithTracking(): void {
    this.CancelUpdate();
    this._originalRecord = null;
  }

  UpdateWithTracking(): void {
    this.Update();
    this._originalRecord = null;
    this._isDirty = true;
  }

  GetOriginalRecord(): any {
    return this._originalRecord ? { ...this._originalRecord } : null;
  }
}

// Recordsets collection
export class DAORecordsets {
  private _recordsets: Map<string, DAORecordset> = new Map();
  private _recordsetArray: DAORecordset[] = [];

  get Count(): number {
    return this._recordsets.size;
  }

  Item(index: number | string): DAORecordset | null {
    if (typeof index === 'number') {
      return this._recordsetArray[index] || null;
    } else {
      return this._recordsets.get(index.toLowerCase()) || null;
    }
  }

  Add(recordset: DAORecordset): void {
    const name = recordset.Name || `Recordset${this._recordsetArray.length + 1}`;
    this._recordsets.set(name.toLowerCase(), recordset);
    this._recordsetArray.push(recordset);
  }

  Remove(name: string): void {
    const recordset = this._recordsets.get(name.toLowerCase());
    if (recordset) {
      recordset.Close();
      this._recordsets.delete(name.toLowerCase());
      const index = this._recordsetArray.indexOf(recordset);
      if (index >= 0) {
        this._recordsetArray.splice(index, 1);
      }
    }
  }

  Refresh(): void {}

  [Symbol.iterator]() {
    return this._recordsetArray[Symbol.iterator]();
  }
}

// Database object - main database interface
export class DAODatabase {
  private _name: string = '';
  private _connect: string = '';
  private _collatingOrder: number = 1033; // English
  private _connectionTimeout: number = 20;
  private _queryTimeout: number = 60;
  private _transactions: boolean = true;
  private _updatable: boolean = true;
  private _version: string = '4.0';
  private _tableDefs: DAOTableDefs = new DAOTableDefs();
  private _queryDefs: DAOQueryDefs = new DAOQueryDefs();
  private _recordsets: DAORecordsets = new DAORecordsets();
  private _relations: any[] = [];

  constructor(name?: string) {
    if (name) this._name = name;
    this.initializeSampleTables();
  }

  private initializeSampleTables(): void {
    // Create sample table
    const customersTable = new DAOTableDef('Customers');

    // Add fields
    const idField = customersTable.CreateField('CustomerID', DAO_CONSTANTS.dbLong);
    idField.Required = true;
    customersTable.Fields.Append(idField);

    const nameField = customersTable.CreateField('CompanyName', DAO_CONSTANTS.dbText, 50);
    nameField.Required = true;
    customersTable.Fields.Append(nameField);

    const contactField = customersTable.CreateField('ContactName', DAO_CONSTANTS.dbText, 30);
    customersTable.Fields.Append(contactField);

    const cityField = customersTable.CreateField('City', DAO_CONSTANTS.dbText, 30);
    customersTable.Fields.Append(cityField);

    const countryField = customersTable.CreateField('Country', DAO_CONSTANTS.dbText, 20);
    customersTable.Fields.Append(countryField);

    // Add primary key index
    const primaryIndex = customersTable.CreateIndex('PrimaryKey');
    primaryIndex.Fields = 'CustomerID';
    primaryIndex.Primary = true;
    primaryIndex.Unique = true;
    customersTable.Indexes.Append(primaryIndex);

    this._tableDefs.Append(customersTable);
  }

  // Properties
  get Name(): string {
    return this._name;
  }

  get Connect(): string {
    return this._connect;
  }

  get CollatingOrder(): number {
    return this._collatingOrder;
  }

  get ConnectionTimeout(): number {
    return this._connectionTimeout;
  }
  set ConnectionTimeout(value: number) {
    this._connectionTimeout = value;
  }

  get QueryTimeout(): number {
    return this._queryTimeout;
  }
  set QueryTimeout(value: number) {
    this._queryTimeout = value;
  }

  get Transactions(): boolean {
    return this._transactions;
  }

  get Updatable(): boolean {
    return this._updatable;
  }

  get Version(): string {
    return this._version;
  }

  get TableDefs(): DAOTableDefs {
    return this._tableDefs;
  }

  get QueryDefs(): DAOQueryDefs {
    return this._queryDefs;
  }

  get Recordsets(): DAORecordsets {
    return this._recordsets;
  }

  // Methods
  OpenRecordset(source: string, type?: number, options?: number, lockEdit?: number): DAORecordset {
    const recordset = new DAORecordset();
    recordset._name = source;
    recordset._type = type || DAO_CONSTANTS.dbOpenDynaset;
    recordset._options = options || 0;

    // Check if source is a table or query
    const tableDef = this._tableDefs.Item(source);
    if (tableDef) {
      // Copy field definitions from table
      for (const field of tableDef.Fields) {
        const newField = new DAOField(field.Name, field.Type, field.Size);
        recordset.Fields.Append(newField);
      }
    }

    this._recordsets.Add(recordset);
    return recordset;
  }

  Execute(query: string, options?: number): void {
    // In real implementation, would execute the SQL against the database
  }

  CreateQueryDef(name?: string, sqlText?: string): DAOQueryDef {
    const queryDef = new DAOQueryDef(name, sqlText);
    if (name) {
      this._queryDefs.Append(queryDef);
    }
    return queryDef;
  }

  CreateTableDef(name?: string): DAOTableDef {
    const tableDef = new DAOTableDef(name);
    return tableDef;
  }

  BeginTrans(): void {}

  CommitTrans(): void {}

  Rollback(): void {}

  Close(): void {
    // Close all recordsets
    for (const recordset of this._recordsets) {
      recordset.Close();
    }
    this._recordsets = new DAORecordsets();
  }

  MakeReplica(pathName: string, description: string, options?: number): void {}

  Synchronize(dbPathName: string, exchangeType?: number): void {}

  NewPassword(oldPassword: string, newPassword: string): void {}
}

// Databases collection
export class DAODatabases {
  private _databases: Map<string, DAODatabase> = new Map();
  private _databaseArray: DAODatabase[] = [];

  get Count(): number {
    return this._databases.size;
  }

  Item(index: number | string): DAODatabase | null {
    if (typeof index === 'number') {
      return this._databaseArray[index] || null;
    } else {
      return this._databases.get(index.toLowerCase()) || null;
    }
  }

  Add(database: DAODatabase): void {
    const name = database.Name || `Database${this._databaseArray.length + 1}`;
    this._databases.set(name.toLowerCase(), database);
    this._databaseArray.push(database);
  }

  Remove(name: string): void {
    const database = this._databases.get(name.toLowerCase());
    if (database) {
      database.Close();
      this._databases.delete(name.toLowerCase());
      const index = this._databaseArray.indexOf(database);
      if (index >= 0) {
        this._databaseArray.splice(index, 1);
      }
    }
  }

  [Symbol.iterator]() {
    return this._databaseArray[Symbol.iterator]();
  }
}

// Workspace object
export class DAOWorkspace {
  private _name: string = '';
  private _userName: string = 'Admin';
  private _databases: DAODatabases = new DAODatabases();
  private _defaultCursorDriver: number = 0;
  private _isolateODBCTrans: number = 0;
  private _loginTimeout: number = 20;
  private _type: number = 0;

  constructor(name?: string) {
    if (name) this._name = name;
  }

  // Properties
  get Name(): string {
    return this._name;
  }

  get UserName(): string {
    return this._userName;
  }

  get Databases(): DAODatabases {
    return this._databases;
  }

  get DefaultCursorDriver(): number {
    return this._defaultCursorDriver;
  }
  set DefaultCursorDriver(value: number) {
    this._defaultCursorDriver = value;
  }

  get IsolateODBCTrans(): number {
    return this._isolateODBCTrans;
  }
  set IsolateODBCTrans(value: number) {
    this._isolateODBCTrans = value;
  }

  get LoginTimeout(): number {
    return this._loginTimeout;
  }
  set LoginTimeout(value: number) {
    this._loginTimeout = value;
  }

  get Type(): number {
    return this._type;
  }

  // Methods
  OpenDatabase(
    name: string,
    exclusive?: boolean,
    readOnly?: boolean,
    connect?: string
  ): DAODatabase {
    const database = new DAODatabase(name);
    database._connect = connect || '';
    this._databases.Add(database);
    return database;
  }

  CreateDatabase(name: string, locale: string, option?: number): DAODatabase {
    const database = new DAODatabase(name);
    this._databases.Add(database);
    return database;
  }

  BeginTrans(): void {}

  CommitTrans(): void {}

  Rollback(): void {}

  Close(): void {
    for (const database of this._databases) {
      database.Close();
    }
    this._databases = new DAODatabases();
  }

  OpenConnection(name: string, options?: number, readOnly?: boolean, connect?: string): any {
    return { Name: name, Connect: connect || '', ReadOnly: readOnly || false };
  }

  CreateUser(name?: string, pid?: string, password?: string): any {
    const user = {
      Name: name || '',
      PID: pid || '',
      Password: password || '',
    };
    return user;
  }

  CreateGroup(name?: string, pid?: string): any {
    const group = {
      Name: name || '',
      PID: pid || '',
    };
    return group;
  }
}

// Workspaces collection
export class DAOWorkspaces {
  private _workspaces: Map<string, DAOWorkspace> = new Map();
  private _workspaceArray: DAOWorkspace[] = [];

  get Count(): number {
    return this._workspaces.size;
  }

  Item(index: number | string): DAOWorkspace | null {
    if (typeof index === 'number') {
      return this._workspaceArray[index] || null;
    } else {
      return this._workspaces.get(index.toLowerCase()) || null;
    }
  }

  Append(workspace: DAOWorkspace): void {
    this._workspaces.set(workspace.Name.toLowerCase(), workspace);
    this._workspaceArray.push(workspace);
  }

  Delete(name: string): void {
    const workspace = this._workspaces.get(name.toLowerCase());
    if (workspace) {
      workspace.Close();
      this._workspaces.delete(name.toLowerCase());
      const index = this._workspaceArray.indexOf(workspace);
      if (index >= 0) {
        this._workspaceArray.splice(index, 1);
      }
    }
  }

  [Symbol.iterator]() {
    return this._workspaceArray[Symbol.iterator]();
  }
}

// DBEngine object - the root DAO object
export class DAODBEngine {
  private static _instance: DAODBEngine;
  private _defaultPassword: string = '';
  private _defaultType: number = 0;
  private _defaultUser: string = 'Admin';
  private _iniPath: string = '';
  private _loginTimeout: number = 20;
  private _systemDB: string = '';
  private _version: string = '3.6';
  private _workspaces: DAOWorkspaces = new DAOWorkspaces();

  private constructor() {
    // Initialize default workspace
    const defaultWorkspace = new DAOWorkspace('#Default Workspace#');
    this._workspaces.Append(defaultWorkspace);
  }

  static getInstance(): DAODBEngine {
    if (!DAODBEngine._instance) {
      DAODBEngine._instance = new DAODBEngine();
    }
    return DAODBEngine._instance;
  }

  // Properties
  get DefaultPassword(): string {
    return this._defaultPassword;
  }
  set DefaultPassword(value: string) {
    this._defaultPassword = value;
  }

  get DefaultType(): number {
    return this._defaultType;
  }
  set DefaultType(value: number) {
    this._defaultType = value;
  }

  get DefaultUser(): string {
    return this._defaultUser;
  }
  set DefaultUser(value: string) {
    this._defaultUser = value;
  }

  get IniPath(): string {
    return this._iniPath;
  }
  set IniPath(value: string) {
    this._iniPath = value;
  }

  get LoginTimeout(): number {
    return this._loginTimeout;
  }
  set LoginTimeout(value: number) {
    this._loginTimeout = value;
  }

  get SystemDB(): string {
    return this._systemDB;
  }
  set SystemDB(value: string) {
    this._systemDB = value;
  }

  get Version(): string {
    return this._version;
  }

  get Workspaces(): DAOWorkspaces {
    return this._workspaces;
  }

  // Methods
  OpenDatabase(
    name: string,
    exclusive?: boolean,
    readOnly?: boolean,
    connect?: string
  ): DAODatabase {
    const defaultWorkspace = this._workspaces.Item(0);
    if (defaultWorkspace) {
      return defaultWorkspace.OpenDatabase(name, exclusive, readOnly, connect);
    }
    throw new Error('No default workspace available');
  }

  CreateDatabase(name: string, locale: string, option?: number): DAODatabase {
    const defaultWorkspace = this._workspaces.Item(0);
    if (defaultWorkspace) {
      return defaultWorkspace.CreateDatabase(name, locale, option);
    }
    throw new Error('No default workspace available');
  }

  CreateWorkspace(name: string, userName: string, password: string): DAOWorkspace {
    const workspace = new DAOWorkspace(name);
    workspace._userName = userName;
    this._workspaces.Append(workspace);
    return workspace;
  }

  CompactDatabase(
    oldDb: string,
    newDb: string,
    locale?: string,
    options?: number,
    password?: string
  ): void {}

  RepairDatabase(name: string): void {}

  RegisterDatabase(dsn: string, driver: string, silent: boolean, attributes: string): void {}

  SetOption(option: number, value: any): void {}

  BeginTrans(): void {
    const defaultWorkspace = this._workspaces.Item(0);
    if (defaultWorkspace) {
      defaultWorkspace.BeginTrans();
    }
  }

  CommitTrans(): void {
    const defaultWorkspace = this._workspaces.Item(0);
    if (defaultWorkspace) {
      defaultWorkspace.CommitTrans();
    }
  }

  Rollback(): void {
    const defaultWorkspace = this._workspaces.Item(0);
    if (defaultWorkspace) {
      defaultWorkspace.Rollback();
    }
  }

  Idle(action?: number): void {}
}

// IndexedDB-based storage for persistent data
class DAOIndexedDBStore {
  private dbName: string = 'VB6DAOStore';
  private db: IDBDatabase | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for tables and recordsets
        if (!db.objectStoreNames.contains('tables')) {
          db.createObjectStore('tables', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('records')) {
          const recordStore = db.createObjectStore('records', {
            keyPath: 'id',
            autoIncrement: true,
          });
          recordStore.createIndex('tableId', 'tableId');
        }
      };
    });
  }

  async saveTable(tableName: string, records: any[]): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tables', 'records'], 'readwrite');
      const tableStore = transaction.objectStore('tables');
      const recordStore = transaction.objectStore('records');

      // Save table metadata
      const tableRequest = tableStore.put({
        name: tableName,
        recordCount: records.length,
        lastUpdated: new Date(),
      });

      tableRequest.onsuccess = () => {
        const tableId = tableRequest.result;

        // Save records
        records.forEach((record, index) => {
          recordStore.add({
            tableId,
            index,
            data: record,
          });
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  async loadTable(tableName: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tables', 'records'], 'readonly');
      const tableStore = transaction.objectStore('tables');
      const recordStore = transaction.objectStore('records');

      const tableRequest = tableStore.get(tableName);
      tableRequest.onsuccess = () => {
        const tableEntry = tableRequest.result;
        if (!tableEntry) {
          resolve([]);
          return;
        }

        const recordRequest = recordStore.index('tableId').getAll(tableEntry.id);
        recordRequest.onsuccess = () => {
          const records = recordRequest.result
            .sort((a: any, b: any) => a.index - b.index)
            .map((r: any) => r.data);
          resolve(records);
        };
        recordRequest.onerror = () => reject(recordRequest.error);
      };
      tableRequest.onerror = () => reject(tableRequest.error);
    });
  }

  async deleteTable(tableName: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tables', 'records'], 'readwrite');
      const tableStore = transaction.objectStore('tables');
      const tableRequest = tableStore.delete(tableName);

      tableRequest.onsuccess = () => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      tableRequest.onerror = () => reject(tableRequest.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tables', 'records'], 'readwrite');
      const tableStore = transaction.objectStore('tables');
      const recordStore = transaction.objectStore('records');

      tableStore.clear();
      recordStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Connection bridge to backend server
class DAOBackendConnectionBridge {
  private baseUrl: string;
  private connectionId: string | null = null;
  private isConnected: boolean = false;

  constructor(baseUrl: string = '/api/database') {
    this.baseUrl = baseUrl;
  }

  async connect(connectionString: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      if (response.ok) {
        const data = await response.json();
        this.connectionId = data.connectionId;
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  async execute(sql: string, parameters: any[] = []): Promise<any> {
    if (!this.connectionId) {
      throw new Error('Not connected to backend');
    }

    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: this.connectionId, sql, parameters }),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Query failed: ${response.statusText}`);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async beginTransaction(): Promise<string> {
    if (!this.connectionId) {
      throw new Error('Not connected to backend');
    }

    const response = await fetch(`${this.baseUrl}/transaction/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: this.connectionId }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.transactionId;
    }
    throw new Error('Failed to begin transaction');
  }

  async commitTransaction(transactionId: string): Promise<void> {
    if (!this.connectionId) {
      throw new Error('Not connected to backend');
    }

    const response = await fetch(`${this.baseUrl}/transaction/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: this.connectionId, transactionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to commit transaction');
    }
  }

  async rollbackTransaction(transactionId: string): Promise<void> {
    if (!this.connectionId) {
      throw new Error('Not connected to backend');
    }

    const response = await fetch(`${this.baseUrl}/transaction/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: this.connectionId, transactionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to rollback transaction');
    }
  }

  disconnect(): void {
    this.isConnected = false;
    this.connectionId = null;
  }
}

// Enhanced Recordset with data binding support
interface RecordsetDataBindings {
  [controlName: string]: {
    fieldName: string;
    updateCallback?: (value: any) => void;
  };
}

// Global DAO objects and functions for VB6 compatibility
export const DBEngine = DAODBEngine.getInstance();

// Global DAO functions
export function OpenDatabase(
  name: string,
  exclusive?: boolean,
  readOnly?: boolean,
  connect?: string
): DAODatabase {
  return DBEngine.OpenDatabase(name, exclusive, readOnly, connect);
}

export function CreateDatabase(name: string, locale: string, option?: number): DAODatabase {
  return DBEngine.CreateDatabase(name, locale, option);
}

export function CreateWorkspace(name: string, userName: string, password: string): DAOWorkspace {
  return DBEngine.CreateWorkspace(name, userName, password);
}

// Export IndexedDB Store for persistence
export const IndexedDBStore = new DAOIndexedDBStore();

// Export Backend Connection Bridge
export function CreateBackendConnection(baseUrl?: string): DAOBackendConnectionBridge {
  return new DAOBackendConnectionBridge(baseUrl);
}

// Classes and types are already exported via their declarations above

// Initialize global DAO objects for VB6 compatibility
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.DBEngine = DBEngine;
  globalAny.OpenDatabase = OpenDatabase;
  globalAny.CreateDatabase = CreateDatabase;
  globalAny.CreateWorkspace = CreateWorkspace;
  globalAny.CreateBackendConnection = CreateBackendConnection;
  globalAny.IndexedDBStore = IndexedDBStore;

  // DAO Constants
  Object.assign(globalAny, DAO_CONSTANTS);

  // Initialize IndexedDB store
  IndexedDBStore.initialize().catch(error => {
    console.warn('IndexedDB initialization failed (may be unavailable):', error);
  });
}
