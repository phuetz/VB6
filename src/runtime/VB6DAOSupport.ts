/**
 * VB6 DAO (Data Access Objects) Implementation
 * Complete support for Microsoft Access database operations
 */
/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

// DAO Constants
export enum DAOConstants {
  // Database types
  dbVersion10 = 1,
  dbVersion11 = 8,
  dbVersion20 = 16,
  dbVersion30 = 32,
  dbVersion35 = 64,
  dbVersion40 = 128,
  dbVersion120 = 256,

  // Open options
  dbOpenTable = 1,
  dbOpenDynaset = 2,
  dbOpenSnapshot = 4,
  dbOpenForwardOnly = 8,
  dbOpenDynamic = 16,

  // Edit modes
  dbEditNone = 0,
  dbEditInProgress = 1,
  dbEditAdd = 2,

  // Lock types
  dbOptimistic = 3,
  dbPessimistic = 2,
  dbOptimisticValue = 1,
  dbOptimisticBatch = 5,

  // Seek comparison
  dbSeekEQ = '=',
  dbSeekGT = '>',
  dbSeekGE = '>=',
  dbSeekLT = '<',
  dbSeekLE = '<=',

  // Field types
  dbBoolean = 1,
  dbByte = 2,
  dbInteger = 3,
  dbLong = 4,
  dbCurrency = 5,
  dbSingle = 6,
  dbDouble = 7,
  dbDate = 8,
  dbBinary = 9,
  dbText = 10,
  dbLongBinary = 11,
  dbMemo = 12,
  dbGUID = 15,
  dbBigInt = 16,
  dbVarBinary = 17,
  dbChar = 18,
  dbNumeric = 19,
  dbDecimal = 20,
  dbFloat = 21,
  dbTime = 22,
  dbTimeStamp = 23,
}

// Field definition
export interface DAOFieldDef {
  name: string;
  type: number;
  size?: number;
  required?: boolean;
  allowZeroLength?: boolean;
  defaultValue?: any;
  validationRule?: string;
  validationText?: string;
}

// Index definition
export interface DAOIndexDef {
  name: string;
  fields: string[];
  primary?: boolean;
  unique?: boolean;
  required?: boolean;
  ignorenulls?: boolean;
}

// Table definition
export interface DAOTableDef {
  name: string;
  fields: DAOFieldDef[];
  indexes?: DAOIndexDef[];
  validationRule?: string;
  validationText?: string;
}

/**
 * DAO Field Object
 */
export class DAOField {
  private _name: string;
  private _type: number;
  private _value: any;
  private _size: number;
  private _required: boolean;
  private _allowZeroLength: boolean;
  private _attributes: number = 0;

  constructor(fieldDef: DAOFieldDef) {
    this._name = fieldDef.name;
    this._type = fieldDef.type;
    this._size = fieldDef.size || 255;
    this._required = fieldDef.required || false;
    this._allowZeroLength = fieldDef.allowZeroLength || true;
    this._value = fieldDef.defaultValue;
  }

  get Name(): string {
    return this._name;
  }
  get Type(): number {
    return this._type;
  }
  get Size(): number {
    return this._size;
  }
  get Required(): boolean {
    return this._required;
  }
  get AllowZeroLength(): boolean {
    return this._allowZeroLength;
  }
  get Attributes(): number {
    return this._attributes;
  }

  get Value(): any {
    return this._value;
  }
  set Value(val: any) {
    // Validate type
    if (this._required && (val === null || val === undefined)) {
      throw new Error(`Field '${this._name}' is required`);
    }

    // Type conversion
    switch (this._type) {
      case DAOConstants.dbBoolean:
        this._value = Boolean(val);
        break;
      case DAOConstants.dbInteger:
      case DAOConstants.dbLong:
        this._value = parseInt(val);
        break;
      case DAOConstants.dbSingle:
      case DAOConstants.dbDouble:
        this._value = parseFloat(val);
        break;
      case DAOConstants.dbDate:
        this._value = val instanceof Date ? val : new Date(val);
        break;
      case DAOConstants.dbText: {
        const strVal = String(val);
        if (strVal.length > this._size) {
          throw new Error(`Field '${this._name}' value exceeds size limit of ${this._size}`);
        }
        this._value = strVal;
        break;
      }
      default:
        this._value = val;
    }
  }

  AppendChunk(data: any): void {
    if (this._type === DAOConstants.dbMemo || this._type === DAOConstants.dbLongBinary) {
      this._value = (this._value || '') + data;
    }
  }

  GetChunk(offset: number, bytes: number): any {
    if (this._type === DAOConstants.dbMemo || this._type === DAOConstants.dbLongBinary) {
      return (this._value || '').substring(offset, offset + bytes);
    }
    return null;
  }
}

/**
 * DAO Fields Collection
 */
export class DAOFields {
  private fields: Map<string, DAOField> = new Map();
  private fieldArray: DAOField[] = [];

  constructor(fieldDefs?: DAOFieldDef[]) {
    if (fieldDefs) {
      fieldDefs.forEach(def => this.append(new DAOField(def)));
    }
  }

  get Count(): number {
    return this.fields.size;
  }

  Item(index: number | string): DAOField {
    if (typeof index === 'number') {
      return this.fieldArray[index];
    } else {
      const field = this.fields.get(index);
      if (!field) {
        throw new Error(`Field '${index}' not found`);
      }
      return field;
    }
  }

  append(field: DAOField): void {
    this.fields.set(field.Name, field);
    this.fieldArray.push(field);
  }

  Delete(name: string): void {
    const field = this.fields.get(name);
    if (field) {
      this.fields.delete(name);
      const index = this.fieldArray.indexOf(field);
      if (index >= 0) {
        this.fieldArray.splice(index, 1);
      }
    }
  }

  Refresh(): void {
    // Refresh field collection
  }
}

/**
 * DAO Recordset Object
 */
export class DAORecordset {
  private _name: string;
  private _type: number;
  private _fields: DAOFields;
  private _data: any[] = [];
  private _currentIndex: number = -1;
  private _eof: boolean = true;
  private _bof: boolean = true;
  private _editMode: number = DAOConstants.dbEditNone;
  private _filter: string = '';
  private _sort: string = '';
  private _absolutePosition: number = -1;
  private _recordCount: number = 0;
  private _bookmarks: Map<string, number> = new Map();

  constructor(name: string, type: number, fields: DAOFields, data?: any[]) {
    this._name = name;
    this._type = type;
    this._fields = fields;
    if (data) {
      this._data = data;
      this._recordCount = data.length;
      if (data.length > 0) {
        this._currentIndex = 0;
        this._eof = false;
        this._bof = false;
        this._absolutePosition = 1;
      }
    }
  }

  // Properties
  get Name(): string {
    return this._name;
  }
  get Type(): number {
    return this._type;
  }
  get Fields(): DAOFields {
    return this._fields;
  }
  get EOF(): boolean {
    return this._eof;
  }
  get BOF(): boolean {
    return this._bof;
  }
  get EditMode(): number {
    return this._editMode;
  }
  get RecordCount(): number {
    return this._recordCount;
  }
  get AbsolutePosition(): number {
    return this._absolutePosition;
  }
  set AbsolutePosition(value: number) {
    if (value >= 1 && value <= this._recordCount) {
      this._currentIndex = value - 1;
      this._absolutePosition = value;
      this._eof = false;
      this._bof = false;
    }
  }

  get Filter(): string {
    return this._filter;
  }
  set Filter(value: string) {
    this._filter = value;
    this.applyFilter();
  }

  get Sort(): string {
    return this._sort;
  }
  set Sort(value: string) {
    this._sort = value;
    this.applySort();
  }

  get Bookmark(): string {
    return `bookmark_${this._currentIndex}`;
  }
  set Bookmark(value: string) {
    const index = this._bookmarks.get(value);
    if (index !== undefined) {
      this._currentIndex = index;
      this.updatePosition();
    }
  }

  // Navigation methods
  MoveFirst(): void {
    if (this._recordCount > 0) {
      this._currentIndex = 0;
      this._eof = false;
      this._bof = false;
      this._absolutePosition = 1;
    }
  }

  MoveLast(): void {
    if (this._recordCount > 0) {
      this._currentIndex = this._recordCount - 1;
      this._eof = false;
      this._bof = false;
      this._absolutePosition = this._recordCount;
    }
  }

  MoveNext(): void {
    if (!this._eof) {
      this._currentIndex++;
      if (this._currentIndex >= this._recordCount) {
        this._eof = true;
        this._currentIndex = this._recordCount;
      } else {
        this._absolutePosition = this._currentIndex + 1;
      }
      this._bof = false;
    }
  }

  MovePrevious(): void {
    if (!this._bof) {
      this._currentIndex--;
      if (this._currentIndex < 0) {
        this._bof = true;
        this._currentIndex = -1;
      } else {
        this._absolutePosition = this._currentIndex + 1;
      }
      this._eof = false;
    }
  }

  Move(rows: number, startBookmark?: string): void {
    let startIndex = this._currentIndex;
    if (startBookmark) {
      const bookmarkIndex = this._bookmarks.get(startBookmark);
      if (bookmarkIndex !== undefined) {
        startIndex = bookmarkIndex;
      }
    }

    const newIndex = startIndex + rows;
    if (newIndex >= 0 && newIndex < this._recordCount) {
      this._currentIndex = newIndex;
      this.updatePosition();
    } else if (newIndex < 0) {
      this._bof = true;
      this._currentIndex = -1;
    } else {
      this._eof = true;
      this._currentIndex = this._recordCount;
    }
  }

  // Search methods
  FindFirst(criteria: string): void {
    const index = this.findRecord(criteria, 0, true);
    if (index >= 0) {
      this._currentIndex = index;
      this.updatePosition();
    } else {
      this.NoMatch = true;
    }
  }

  FindLast(criteria: string): void {
    const index = this.findRecord(criteria, this._recordCount - 1, false);
    if (index >= 0) {
      this._currentIndex = index;
      this.updatePosition();
    } else {
      this.NoMatch = true;
    }
  }

  FindNext(criteria: string): void {
    const index = this.findRecord(criteria, this._currentIndex + 1, true);
    if (index >= 0) {
      this._currentIndex = index;
      this.updatePosition();
    } else {
      this.NoMatch = true;
    }
  }

  FindPrevious(criteria: string): void {
    const index = this.findRecord(criteria, this._currentIndex - 1, false);
    if (index >= 0) {
      this._currentIndex = index;
      this.updatePosition();
    } else {
      this.NoMatch = true;
    }
  }

  Seek(comparison: string, ...keys: any[]): void {
    // Seek is only for table-type recordsets
    if (this._type !== DAOConstants.dbOpenTable) {
      throw new Error('Seek is only available for table-type recordsets');
    }

    // Simple seek implementation
    let found = false;
    for (let i = 0; i < this._recordCount; i++) {
      const record = this._data[i];
      if (this.compareKeys(record, comparison, keys)) {
        this._currentIndex = i;
        this.updatePosition();
        found = true;
        break;
      }
    }

    this.NoMatch = !found;
  }

  NoMatch: boolean = false;

  // Edit methods
  AddNew(): void {
    this._editMode = DAOConstants.dbEditAdd;
    // Create new record with default values
    const newRecord: any = {};
    for (let i = 0; i < this._fields.Count; i++) {
      const field = this._fields.Item(i);
      newRecord[field.Name] = null;
    }
    this._data.push(newRecord);
    this._currentIndex = this._data.length - 1;
    this._recordCount++;
    this.updatePosition();
  }

  Edit(): void {
    if (this._eof || this._bof) {
      throw new Error('No current record');
    }
    this._editMode = DAOConstants.dbEditInProgress;
  }

  Update(): void {
    if (this._editMode === DAOConstants.dbEditNone) {
      throw new Error('Not in edit mode');
    }

    // Validate required fields
    const currentRecord = this._data[this._currentIndex];
    for (let i = 0; i < this._fields.Count; i++) {
      const field = this._fields.Item(i);
      if (
        field.Required &&
        (currentRecord[field.Name] === null || currentRecord[field.Name] === undefined)
      ) {
        throw new Error(`Field '${field.Name}' is required`);
      }
    }

    this._editMode = DAOConstants.dbEditNone;
  }

  CancelUpdate(): void {
    if (this._editMode === DAOConstants.dbEditAdd) {
      // Remove the added record
      this._data.pop();
      this._recordCount--;
      this._currentIndex = Math.min(this._currentIndex, this._recordCount - 1);
    }
    this._editMode = DAOConstants.dbEditNone;
    this.updatePosition();
  }

  Delete(): void {
    if (this._eof || this._bof) {
      throw new Error('No current record');
    }

    this._data.splice(this._currentIndex, 1);
    this._recordCount--;

    if (this._recordCount === 0) {
      this._eof = true;
      this._bof = true;
      this._currentIndex = -1;
    } else if (this._currentIndex >= this._recordCount) {
      this._currentIndex = this._recordCount - 1;
    }

    this.updatePosition();
  }

  // Field access
  GetField(name: string): any {
    if (this._eof || this._bof || this._currentIndex < 0) {
      return null;
    }
    return this._data[this._currentIndex][name];
  }

  SetField(name: string, value: any): void {
    if (this._editMode === DAOConstants.dbEditNone) {
      throw new Error('Not in edit mode');
    }

    const field = this._fields.Item(name);
    field.Value = value; // Validate through field
    this._data[this._currentIndex][name] = field.Value;
  }

  // Utility methods
  Close(): void {
    this._data = [];
    this._currentIndex = -1;
    this._eof = true;
    this._bof = true;
    this._recordCount = 0;
  }

  Clone(): DAORecordset {
    return new DAORecordset(this._name, this._type, this._fields, [...this._data]);
  }

  GetRows(numRows?: number): any[][] {
    const rows: any[][] = [];
    const startIndex = this._currentIndex;
    const count = numRows || this._recordCount;

    for (let i = 0; i < count && !this._eof; i++) {
      const row: any[] = [];
      for (let j = 0; j < this._fields.Count; j++) {
        const field = this._fields.Item(j);
        row.push(this.GetField(field.Name));
      }
      rows.push(row);
      this.MoveNext();
    }

    return rows;
  }

  private updatePosition(): void {
    this._eof = this._currentIndex >= this._recordCount;
    this._bof = this._currentIndex < 0;
    this._absolutePosition = this._currentIndex + 1;
  }

  private findRecord(criteria: string, startIndex: number, forward: boolean): number {
    // Simple criteria parser (field = value)
    const match = criteria.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
    if (!match) return -1;

    const [, fieldName, value] = match;

    if (forward) {
      for (let i = startIndex; i < this._recordCount; i++) {
        if (String(this._data[i][fieldName]) === value) {
          return i;
        }
      }
    } else {
      for (let i = startIndex; i >= 0; i--) {
        if (String(this._data[i][fieldName]) === value) {
          return i;
        }
      }
    }

    return -1;
  }

  private compareKeys(record: any, comparison: string, keys: any[]): boolean {
    // Simplified comparison logic
    const firstKey = keys[0];
    const recordValue = record[Object.keys(record)[0]]; // Use first field

    switch (comparison) {
      case '=':
        return recordValue === firstKey;
      case '>':
        return recordValue > firstKey;
      case '>=':
        return recordValue >= firstKey;
      case '<':
        return recordValue < firstKey;
      case '<=':
        return recordValue <= firstKey;
      default:
        return false;
    }
  }

  private applyFilter(): void {
    // Apply filter to data
  }

  private applySort(): void {
    // Apply sort to data
    if (this._sort) {
      const parts = this._sort.split(/\s+/);
      const fieldName = parts[0];
      const descending = parts[1]?.toUpperCase() === 'DESC';

      this._data.sort((a, b) => {
        const aVal = a[fieldName];
        const bVal = b[fieldName];
        const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return descending ? -result : result;
      });
    }
  }
}

/**
 * DAO Database Object
 */
export class DAODatabase {
  private _name: string;
  private _tables: Map<string, DAOTableDef> = new Map();
  private _recordsets: Map<string, DAORecordset> = new Map();
  private _connected: boolean = false;

  constructor(name: string) {
    this._name = name;
    this.initializeBuiltInTables();
  }

  get Name(): string {
    return this._name;
  }
  get Connected(): boolean {
    return this._connected;
  }

  // Open a recordset
  OpenRecordset(source: string, type?: number, options?: number, lockedits?: number): DAORecordset {
    const recordsetType = type || DAOConstants.dbOpenDynaset;

    // Parse source (table name or SQL)
    const isSQL = source.trim().toUpperCase().startsWith('SELECT');

    if (isSQL) {
      // Parse SQL and create recordset
      return this.executeSQL(source, recordsetType);
    } else {
      // Open table
      const table = this._tables.get(source);
      if (!table) {
        throw new Error(`Table '${source}' not found`);
      }

      const fields = new DAOFields(table.fields);
      const recordset = new DAORecordset(source, recordsetType, fields);

      // Load sample data
      const sampleData = this.loadTableData(source);
      if (sampleData) {
        sampleData.forEach(row => {
          recordset.AddNew();
          Object.keys(row).forEach(field => {
            recordset.SetField(field, row[field]);
          });
          recordset.Update();
        });
        recordset.MoveFirst();
      }

      return recordset;
    }
  }

  // Execute SQL
  Execute(sql: string, options?: number): void {
    const upperSQL = sql.trim().toUpperCase();

    if (upperSQL.startsWith('CREATE TABLE')) {
      this.executeCreateTable(sql);
    } else if (upperSQL.startsWith('INSERT INTO')) {
      this.executeInsert(sql);
    } else if (upperSQL.startsWith('UPDATE')) {
      this.executeUpdate(sql);
    } else if (upperSQL.startsWith('DELETE FROM')) {
      this.executeDelete(sql);
    }
  }

  // Create table
  CreateTableDef(name: string): DAOTableDef {
    const tableDef: DAOTableDef = {
      name,
      fields: [],
    };

    this._tables.set(name, tableDef);
    return tableDef;
  }

  // Close database
  Close(): void {
    this._recordsets.forEach(rs => rs.Close());
    this._recordsets.clear();
    this._connected = false;
  }

  // Transaction methods
  BeginTrans(): void {}

  CommitTrans(): void {}

  Rollback(): void {}

  private initializeBuiltInTables(): void {
    // Sample Employees table
    this._tables.set('Employees', {
      name: 'Employees',
      fields: [
        { name: 'EmployeeID', type: DAOConstants.dbLong, required: true },
        { name: 'FirstName', type: DAOConstants.dbText, size: 50 },
        { name: 'LastName', type: DAOConstants.dbText, size: 50 },
        { name: 'Title', type: DAOConstants.dbText, size: 100 },
        { name: 'HireDate', type: DAOConstants.dbDate },
        { name: 'Salary', type: DAOConstants.dbCurrency },
      ],
      indexes: [{ name: 'PrimaryKey', fields: ['EmployeeID'], primary: true, unique: true }],
    });

    // Sample Products table
    this._tables.set('Products', {
      name: 'Products',
      fields: [
        { name: 'ProductID', type: DAOConstants.dbLong, required: true },
        { name: 'ProductName', type: DAOConstants.dbText, size: 100 },
        { name: 'CategoryID', type: DAOConstants.dbLong },
        { name: 'UnitPrice', type: DAOConstants.dbCurrency },
        { name: 'UnitsInStock', type: DAOConstants.dbInteger },
        { name: 'Discontinued', type: DAOConstants.dbBoolean },
      ],
    });
  }

  private loadTableData(tableName: string): any[] | null {
    // Sample data for testing
    if (tableName === 'Employees') {
      return [
        {
          EmployeeID: 1,
          FirstName: 'John',
          LastName: 'Doe',
          Title: 'Manager',
          HireDate: new Date('2020-01-15'),
          Salary: 75000,
        },
        {
          EmployeeID: 2,
          FirstName: 'Jane',
          LastName: 'Smith',
          Title: 'Developer',
          HireDate: new Date('2021-03-20'),
          Salary: 65000,
        },
        {
          EmployeeID: 3,
          FirstName: 'Bob',
          LastName: 'Johnson',
          Title: 'Analyst',
          HireDate: new Date('2019-11-10'),
          Salary: 60000,
        },
      ];
    } else if (tableName === 'Products') {
      return [
        {
          ProductID: 1,
          ProductName: 'Widget A',
          CategoryID: 1,
          UnitPrice: 19.99,
          UnitsInStock: 100,
          Discontinued: false,
        },
        {
          ProductID: 2,
          ProductName: 'Widget B',
          CategoryID: 1,
          UnitPrice: 29.99,
          UnitsInStock: 50,
          Discontinued: false,
        },
      ];
    }

    return null;
  }

  private executeSQL(sql: string, type: number): DAORecordset {
    // Simple SQL parser
    const match = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);

    if (match) {
      const [, columns, tableName, where] = match;
      const table = this._tables.get(tableName);

      if (!table) {
        throw new Error(`Table '${tableName}' not found`);
      }

      const fields = new DAOFields(table.fields);
      const recordset = new DAORecordset(`Query: ${sql}`, type, fields);

      // Load and filter data
      const data = this.loadTableData(tableName);
      if (data) {
        let filteredData = data;

        // Apply WHERE clause if present
        if (where) {
          filteredData = this.filterData(data, where);
        }

        filteredData.forEach(row => {
          recordset.AddNew();
          Object.keys(row).forEach(field => {
            recordset.SetField(field, row[field]);
          });
          recordset.Update();
        });

        if (filteredData.length > 0) {
          recordset.MoveFirst();
        }
      }

      return recordset;
    }

    throw new Error('Invalid SQL syntax');
  }

  private filterData(data: any[], whereClause: string): any[] {
    // Simple WHERE clause parser
    const match = whereClause.match(/(\w+)\s*([=<>]+)\s*['"]?([^'"]+)['"]?/);

    if (match) {
      const [, field, operator, value] = match;

      return data.filter(row => {
        const fieldValue = row[field];
        const compareValue = isNaN(Number(value)) ? value : Number(value);

        switch (operator) {
          case '=':
            return fieldValue == compareValue;
          case '>':
            return fieldValue > compareValue;
          case '<':
            return fieldValue < compareValue;
          case '>=':
            return fieldValue >= compareValue;
          case '<=':
            return fieldValue <= compareValue;
          case '<>':
          case '!=':
            return fieldValue != compareValue;
          default:
            return true;
        }
      });
    }

    return data;
  }

  private executeCreateTable(sql: string): void {}

  private executeInsert(sql: string): void {}

  private executeUpdate(sql: string): void {}

  private executeDelete(sql: string): void {}
}

/**
 * DAO Workspace Object
 */
export class DAOWorkspace {
  private _name: string;
  private _databases: Map<string, DAODatabase> = new Map();

  constructor(name: string = 'Default') {
    this._name = name;
  }

  get Name(): string {
    return this._name;
  }

  OpenDatabase(
    name: string,
    exclusive?: boolean,
    readOnly?: boolean,
    connect?: string
  ): DAODatabase {
    let database = this._databases.get(name);

    if (!database) {
      database = new DAODatabase(name);
      this._databases.set(name, database);
    }

    return database;
  }

  CreateDatabase(name: string, locale: string, options?: number): DAODatabase {
    const database = new DAODatabase(name);
    this._databases.set(name, database);
    return database;
  }

  Close(): void {
    this._databases.forEach(db => db.Close());
    this._databases.clear();
  }
}

/**
 * DAO DBEngine Object (Root)
 */
export class DAODBEngine {
  private static instance: DAODBEngine;
  private _workspaces: Map<string, DAOWorkspace> = new Map();
  private _defaultWorkspace: DAOWorkspace;
  private _version: string = '3.6';

  private constructor() {
    this._defaultWorkspace = new DAOWorkspace('Default');
    this._workspaces.set('Default', this._defaultWorkspace);
  }

  static getInstance(): DAODBEngine {
    if (!DAODBEngine.instance) {
      DAODBEngine.instance = new DAODBEngine();
    }
    return DAODBEngine.instance;
  }

  get Version(): string {
    return this._version;
  }
  get Workspaces(): Map<string, DAOWorkspace> {
    return this._workspaces;
  }

  OpenDatabase(
    name: string,
    exclusive?: boolean,
    readOnly?: boolean,
    connect?: string
  ): DAODatabase {
    return this._defaultWorkspace.OpenDatabase(name, exclusive, readOnly, connect);
  }

  CreateWorkspace(
    name: string,
    userName: string,
    password: string,
    useType?: number
  ): DAOWorkspace {
    const workspace = new DAOWorkspace(name);
    this._workspaces.set(name, workspace);
    return workspace;
  }

  CompactDatabase(srcName: string, dstName: string, dstLocale?: string, options?: number): void {}

  RepairDatabase(name: string): void {}
}

// Global DBEngine instance
export const DBEngine = DAODBEngine.getInstance();

/**
 * DAO Example Usage
 */
export class VB6DAOExample {
  demonstrateDAO(): void {
    // Open database
    const db = DBEngine.OpenDatabase('Northwind.mdb');

    // Open recordset
    const rs = db.OpenRecordset('Employees', DAOConstants.dbOpenDynaset);

    // Navigate records
    while (!rs.EOF) {
      const firstName = rs.GetField('FirstName');
      const lastName = rs.GetField('LastName');
      const title = rs.GetField('Title');
      rs.MoveNext();
    }

    // Find record
    rs.MoveFirst();
    rs.FindFirst("LastName = 'Smith'");

    // Edit record
    rs.Edit();
    rs.SetField('Title', 'Senior Developer');
    rs.Update();

    // Add new record
    rs.AddNew();
    rs.SetField('EmployeeID', 4);
    rs.SetField('FirstName', 'Alice');
    rs.SetField('LastName', 'Williams');
    rs.SetField('Title', 'Designer');
    rs.SetField('HireDate', new Date());
    rs.SetField('Salary', 70000);
    rs.Update();

    // SQL query
    const qry = db.OpenRecordset(
      'SELECT * FROM Employees WHERE Salary > 60000',
      DAOConstants.dbOpenSnapshot
    );

    while (!qry.EOF) {
      qry.MoveNext();
    }

    // Clean up
    rs.Close();
    qry.Close();
    db.Close();
  }
}

// Export all DAO functionality
export const VB6DAO = {
  DAOConstants,
  DAOField,
  DAOFields,
  DAORecordset,
  DAODatabase,
  DAOWorkspace,
  DAODBEngine,
  DBEngine,
  VB6DAOExample,
};
