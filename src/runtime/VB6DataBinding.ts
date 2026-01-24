/**
 * VB6 Data Binding Support
 * Implements VB6-style data binding with DataSource and DataField properties
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DataField {
  name: string;
  type: 'String' | 'Integer' | 'Long' | 'Single' | 'Double' | 'Currency' | 'Date' | 'Boolean' | 'Variant';
  value: any;
  originalValue?: any;
  isNull: boolean;
  size?: number;
  precision?: number;
  scale?: number;
  required?: boolean;
  readOnly?: boolean;
}

export interface DataRecord {
  [fieldName: string]: any;
}

export interface DataSourceOptions {
  name: string;
  connectionString?: string;
  recordSource?: string;
  recordsetType?: 'Table' | 'Dynaset' | 'Snapshot';
  lockType?: 'ReadOnly' | 'Pessimistic' | 'Optimistic' | 'BatchOptimistic';
  cursorLocation?: 'Server' | 'Client';
}

export type DataBindingEvent =
  | 'Reposition'
  | 'Validate'
  | 'Error'
  | 'WillChangeField'
  | 'FieldChangeComplete'
  | 'WillChangeRecord'
  | 'RecordChangeComplete'
  | 'WillMove'
  | 'MoveComplete';

export type DataBindingEventHandler = (event: DataBindingEventArgs) => void;

export interface DataBindingEventArgs {
  eventType: DataBindingEvent;
  cancel?: boolean;
  field?: string;
  oldValue?: any;
  newValue?: any;
  recordIndex?: number;
  error?: Error;
}

export interface BoundControl {
  name: string;
  dataField: string;
  updateMode: 'Immediate' | 'OnValidate' | 'Manual';
  getValue: () => any;
  setValue: (value: any) => void;
  setEnabled: (enabled: boolean) => void;
}

// ============================================================================
// VB6 Recordset Class
// ============================================================================

export class VB6Recordset {
  private _fields: Map<string, DataField> = new Map();
  private _records: DataRecord[] = [];
  private _currentIndex: number = -1;
  private _bookmarks: Map<string, number> = new Map();
  private _filter: string = '';
  private _sort: string = '';
  private _filteredIndices: number[] = [];
  private _isDirty: boolean = false;
  private _eventHandlers: Map<DataBindingEvent, DataBindingEventHandler[]> = new Map();
  private _editMode: 'None' | 'Edit' | 'AddNew' = 'None';
  private _pendingRecord: DataRecord | null = null;

  constructor() {
    this._filteredIndices = [];
  }

  // ============================================================================
  // Properties
  // ============================================================================

  get BOF(): boolean {
    return this._currentIndex < 0 || this._records.length === 0;
  }

  get EOF(): boolean {
    return this._currentIndex >= this.getFilteredRecords().length || this._records.length === 0;
  }

  get RecordCount(): number {
    return this.getFilteredRecords().length;
  }

  get AbsolutePosition(): number {
    return this._currentIndex + 1;
  }

  set AbsolutePosition(value: number) {
    const idx = value - 1;
    if (idx >= 0 && idx < this.getFilteredRecords().length) {
      this.moveTo(idx);
    }
  }

  get Bookmark(): string {
    const bookmarkId = `BM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._bookmarks.set(bookmarkId, this._currentIndex);
    return bookmarkId;
  }

  set Bookmark(value: string) {
    const index = this._bookmarks.get(value);
    if (index !== undefined) {
      this.moveTo(index);
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

  get EditMode(): 'None' | 'Edit' | 'AddNew' {
    return this._editMode;
  }

  // ============================================================================
  // Field Access
  // ============================================================================

  Fields(nameOrIndex: string | number): DataField | undefined {
    if (typeof nameOrIndex === 'number') {
      const names = Array.from(this._fields.keys());
      return this._fields.get(names[nameOrIndex]);
    }
    return this._fields.get(nameOrIndex);
  }

  get FieldCount(): number {
    return this._fields.size;
  }

  /**
   * Get field value (VB6: rs!FieldName or rs.Fields("FieldName").Value)
   */
  GetValue(fieldName: string): any {
    const records = this.getFilteredRecords();
    if (this._currentIndex < 0 || this._currentIndex >= records.length) {
      return null;
    }

    if (this._editMode !== 'None' && this._pendingRecord) {
      return this._pendingRecord[fieldName];
    }

    return records[this._currentIndex][fieldName];
  }

  /**
   * Set field value (VB6: rs!FieldName = value)
   */
  SetValue(fieldName: string, value: any): void {
    if (this._editMode === 'None') {
      throw new Error('Cannot modify record - call Edit or AddNew first');
    }

    const field = this._fields.get(fieldName);
    if (!field) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    if (field.readOnly) {
      throw new Error(`Field '${fieldName}' is read-only`);
    }

    const oldValue = this._pendingRecord ? this._pendingRecord[fieldName] : null;

    // Fire WillChangeField event
    const args: DataBindingEventArgs = {
      eventType: 'WillChangeField',
      field: fieldName,
      oldValue,
      newValue: value
    };
    this.raiseEvent('WillChangeField', args);

    if (args.cancel) return;

    if (!this._pendingRecord) {
      this._pendingRecord = { ...this.getFilteredRecords()[this._currentIndex] };
    }

    this._pendingRecord[fieldName] = this.convertValue(value, field.type);
    this._isDirty = true;

    // Fire FieldChangeComplete event
    this.raiseEvent('FieldChangeComplete', {
      eventType: 'FieldChangeComplete',
      field: fieldName,
      oldValue,
      newValue: value
    });
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  MoveFirst(): void {
    this.moveTo(0);
  }

  MoveLast(): void {
    const records = this.getFilteredRecords();
    this.moveTo(records.length - 1);
  }

  MoveNext(): void {
    this.moveTo(this._currentIndex + 1);
  }

  MovePrevious(): void {
    this.moveTo(this._currentIndex - 1);
  }

  Move(numRecords: number, start?: string): void {
    let startIndex = this._currentIndex;

    if (start !== undefined) {
      const bookmarkIndex = this._bookmarks.get(start);
      if (bookmarkIndex !== undefined) {
        startIndex = bookmarkIndex;
      }
    }

    this.moveTo(startIndex + numRecords);
  }

  private moveTo(index: number): void {
    const records = this.getFilteredRecords();

    // Fire WillMove event
    const args: DataBindingEventArgs = {
      eventType: 'WillMove',
      recordIndex: index
    };
    this.raiseEvent('WillMove', args);

    if (args.cancel) return;

    // Validate pending changes
    if (this._isDirty) {
      this.Update();
    }

    const oldIndex = this._currentIndex;
    this._currentIndex = Math.max(-1, Math.min(index, records.length));

    // Fire MoveComplete/Reposition events
    this.raiseEvent('MoveComplete', {
      eventType: 'MoveComplete',
      recordIndex: this._currentIndex
    });

    if (oldIndex !== this._currentIndex) {
      this.raiseEvent('Reposition', {
        eventType: 'Reposition',
        recordIndex: this._currentIndex
      });
    }
  }

  // ============================================================================
  // Editing
  // ============================================================================

  /**
   * Enter edit mode for current record
   */
  Edit(): void {
    if (this.BOF || this.EOF) {
      throw new Error('No current record');
    }

    this._editMode = 'Edit';
    this._pendingRecord = { ...this.getFilteredRecords()[this._currentIndex] };
  }

  /**
   * Add a new record
   */
  AddNew(): void {
    this._editMode = 'AddNew';
    this._pendingRecord = this.createEmptyRecord();

    this.raiseEvent('WillChangeRecord', {
      eventType: 'WillChangeRecord',
      recordIndex: -1
    });
  }

  /**
   * Save pending changes
   */
  Update(): void {
    if (this._editMode === 'None' || !this._pendingRecord) {
      return;
    }

    // Fire Validate event
    const validateArgs: DataBindingEventArgs = {
      eventType: 'Validate'
    };
    this.raiseEvent('Validate', validateArgs);

    if (validateArgs.cancel) {
      throw new Error('Update cancelled by validation');
    }

    if (this._editMode === 'AddNew') {
      this._records.push(this._pendingRecord);
      this.applyFilter();
      this._currentIndex = this.getFilteredRecords().length - 1;
    } else {
      const actualIndex = this._filteredIndices.length > 0
        ? this._filteredIndices[this._currentIndex]
        : this._currentIndex;
      this._records[actualIndex] = this._pendingRecord;
    }

    this._editMode = 'None';
    this._pendingRecord = null;
    this._isDirty = false;

    this.raiseEvent('RecordChangeComplete', {
      eventType: 'RecordChangeComplete',
      recordIndex: this._currentIndex
    });
  }

  /**
   * Cancel pending changes
   */
  CancelUpdate(): void {
    this._editMode = 'None';
    this._pendingRecord = null;
    this._isDirty = false;
  }

  /**
   * Delete current record
   */
  Delete(): void {
    if (this.BOF || this.EOF) {
      throw new Error('No current record');
    }

    const args: DataBindingEventArgs = {
      eventType: 'WillChangeRecord',
      recordIndex: this._currentIndex
    };
    this.raiseEvent('WillChangeRecord', args);

    if (args.cancel) return;

    const actualIndex = this._filteredIndices.length > 0
      ? this._filteredIndices[this._currentIndex]
      : this._currentIndex;

    this._records.splice(actualIndex, 1);
    this.applyFilter();

    if (this._currentIndex >= this.getFilteredRecords().length) {
      this._currentIndex = this.getFilteredRecords().length - 1;
    }

    this.raiseEvent('RecordChangeComplete', {
      eventType: 'RecordChangeComplete',
      recordIndex: this._currentIndex
    });
  }

  // ============================================================================
  // Data Population
  // ============================================================================

  /**
   * Define fields for the recordset
   */
  DefineField(name: string, type: DataField['type'], options?: Partial<DataField>): void {
    const field: DataField = {
      name,
      type,
      value: null,
      isNull: true,
      ...options
    };
    this._fields.set(name, field);
  }

  /**
   * Add a record to the recordset
   */
  AddRecord(record: DataRecord): void {
    this._records.push(record);
    this.applyFilter();

    if (this._currentIndex === -1 && this._records.length === 1) {
      this._currentIndex = 0;
    }
  }

  /**
   * Load data from array
   */
  LoadFromArray(data: DataRecord[], autoDefineFields: boolean = true): void {
    if (data.length === 0) return;

    if (autoDefineFields) {
      this._fields.clear();
      const firstRecord = data[0];
      for (const [key, value] of Object.entries(firstRecord)) {
        this.DefineField(key, this.inferType(value));
      }
    }

    this._records = [...data];
    this.applyFilter();
    this._currentIndex = this._records.length > 0 ? 0 : -1;
  }

  /**
   * Get all records as array
   */
  GetRows(numRows?: number): DataRecord[] {
    const records = this.getFilteredRecords();
    const startIndex = this._currentIndex;
    const count = numRows ?? records.length - startIndex;

    return records.slice(startIndex, startIndex + count);
  }

  /**
   * Clone the recordset
   */
  Clone(): VB6Recordset {
    const clone = new VB6Recordset();

    for (const [name, field] of this._fields) {
      clone._fields.set(name, { ...field });
    }

    clone._records = this._records.map(r => ({ ...r }));
    clone._filter = this._filter;
    clone._sort = this._sort;
    clone.applyFilter();
    clone._currentIndex = 0;

    return clone;
  }

  // ============================================================================
  // Find and Seek
  // ============================================================================

  /**
   * Find record matching criteria
   */
  Find(criteria: string, skipRecords: number = 0, searchDirection: 'Forward' | 'Backward' = 'Forward'): boolean {
    const records = this.getFilteredRecords();
    const startIndex = this._currentIndex + (searchDirection === 'Forward' ? skipRecords + 1 : -skipRecords - 1);

    // Simple criteria parser (field = value)
    const match = criteria.match(/^(\w+)\s*(=|<>|<|>|<=|>=|LIKE)\s*(.+)$/i);
    if (!match) return false;

    const [, fieldName, operator, valueStr] = match;
    const targetValue = this.parseValue(valueStr.trim());

    if (searchDirection === 'Forward') {
      for (let i = startIndex; i < records.length; i++) {
        if (this.matchesCriteria(records[i][fieldName], operator, targetValue)) {
          this._currentIndex = i;
          return true;
        }
      }
    } else {
      for (let i = startIndex; i >= 0; i--) {
        if (this.matchesCriteria(records[i][fieldName], operator, targetValue)) {
          this._currentIndex = i;
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Find first record matching criteria
   */
  FindFirst(criteria: string): boolean {
    this._currentIndex = -1;
    return this.Find(criteria, 0, 'Forward');
  }

  /**
   * Find last record matching criteria
   */
  FindLast(criteria: string): boolean {
    this._currentIndex = this.getFilteredRecords().length;
    return this.Find(criteria, 0, 'Backward');
  }

  /**
   * Find next record matching criteria
   */
  FindNext(criteria: string): boolean {
    return this.Find(criteria, 0, 'Forward');
  }

  /**
   * Find previous record matching criteria
   */
  FindPrevious(criteria: string): boolean {
    return this.Find(criteria, 0, 'Backward');
  }

  // ============================================================================
  // Events
  // ============================================================================

  On(event: DataBindingEvent, handler: DataBindingEventHandler): void {
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, []);
    }
    this._eventHandlers.get(event)!.push(handler);
  }

  Off(event: DataBindingEvent, handler: DataBindingEventHandler): void {
    const handlers = this._eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private raiseEvent(event: DataBindingEvent, args: DataBindingEventArgs): void {
    const handlers = this._eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(args);
        if (args.cancel) break;
      }
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private getFilteredRecords(): DataRecord[] {
    if (this._filteredIndices.length > 0) {
      return this._filteredIndices.map(i => this._records[i]);
    }
    return this._records;
  }

  private applyFilter(): void {
    if (!this._filter) {
      this._filteredIndices = [];
      this.applySort();
      return;
    }

    // Simple filter parser
    const match = this._filter.match(/^(\w+)\s*(=|<>|<|>|<=|>=|LIKE)\s*(.+)$/i);
    if (!match) {
      this._filteredIndices = [];
      return;
    }

    const [, fieldName, operator, valueStr] = match;
    const targetValue = this.parseValue(valueStr.trim());

    this._filteredIndices = this._records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => this.matchesCriteria(record[fieldName], operator, targetValue))
      .map(({ index }) => index);

    this.applySort();
  }

  private applySort(): void {
    if (!this._sort) return;

    const sortParts = this._sort.split(',').map(s => s.trim());
    const sortFields: { field: string; descending: boolean }[] = [];

    for (const part of sortParts) {
      const match = part.match(/^(\w+)(?:\s+(ASC|DESC))?$/i);
      if (match) {
        sortFields.push({
          field: match[1],
          descending: match[2]?.toUpperCase() === 'DESC'
        });
      }
    }

    if (sortFields.length === 0) return;

    const indicesToSort = this._filteredIndices.length > 0
      ? [...this._filteredIndices]
      : this._records.map((_, i) => i);

    indicesToSort.sort((a, b) => {
      for (const { field, descending } of sortFields) {
        const valA = this._records[a][field];
        const valB = this._records[b][field];

        let comparison = 0;
        if (valA < valB) comparison = -1;
        else if (valA > valB) comparison = 1;

        if (comparison !== 0) {
          return descending ? -comparison : comparison;
        }
      }
      return 0;
    });

    this._filteredIndices = indicesToSort;
  }

  private matchesCriteria(value: any, operator: string, target: any): boolean {
    switch (operator.toUpperCase()) {
      case '=': return value === target;
      case '<>': return value !== target;
      case '<': return value < target;
      case '>': return value > target;
      case '<=': return value <= target;
      case '>=': return value >= target;
      case 'LIKE':
        const pattern = String(target)
          .replace(/%/g, '.*')
          .replace(/_/g, '.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        return new RegExp(`^${pattern}$`, 'i').test(String(value));
      default:
        return false;
    }
  }

  private parseValue(valueStr: string): any {
    // String literal
    if ((valueStr.startsWith("'") && valueStr.endsWith("'")) ||
        (valueStr.startsWith('"') && valueStr.endsWith('"'))) {
      return valueStr.slice(1, -1);
    }

    // Boolean
    if (valueStr.toUpperCase() === 'TRUE') return true;
    if (valueStr.toUpperCase() === 'FALSE') return false;

    // Null
    if (valueStr.toUpperCase() === 'NULL') return null;

    // Number
    const num = Number(valueStr);
    if (!isNaN(num)) return num;

    // Date (VB6 format: #MM/DD/YYYY#)
    if (valueStr.startsWith('#') && valueStr.endsWith('#')) {
      return new Date(valueStr.slice(1, -1));
    }

    return valueStr;
  }

  private inferType(value: any): DataField['type'] {
    if (value === null || value === undefined) return 'Variant';
    if (typeof value === 'string') return 'String';
    if (typeof value === 'boolean') return 'Boolean';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value >= -32768 && value <= 32767 ? 'Integer' : 'Long';
      }
      return 'Double';
    }
    if (value instanceof Date) return 'Date';
    return 'Variant';
  }

  private convertValue(value: any, type: DataField['type']): any {
    if (value === null || value === undefined) return null;

    switch (type) {
      case 'String': return String(value);
      case 'Integer': return Math.round(Math.max(-32768, Math.min(32767, Number(value))));
      case 'Long': return Math.round(Number(value));
      case 'Single':
      case 'Double': return Number(value);
      case 'Currency': return Math.round(Number(value) * 10000) / 10000;
      case 'Boolean': return Boolean(value);
      case 'Date': return value instanceof Date ? value : new Date(value);
      default: return value;
    }
  }

  private createEmptyRecord(): DataRecord {
    const record: DataRecord = {};
    for (const [name, field] of this._fields) {
      record[name] = this.getDefaultValue(field.type);
    }
    return record;
  }

  private getDefaultValue(type: DataField['type']): any {
    switch (type) {
      case 'String': return '';
      case 'Integer':
      case 'Long':
      case 'Single':
      case 'Double':
      case 'Currency': return 0;
      case 'Boolean': return false;
      case 'Date': return new Date();
      default: return null;
    }
  }
}

// ============================================================================
// VB6 Data Source Class
// ============================================================================

export class VB6DataSource {
  private _name: string;
  private _recordset: VB6Recordset;
  private _boundControls: Map<string, BoundControl> = new Map();
  private _options: DataSourceOptions;

  constructor(options: DataSourceOptions) {
    this._options = options;
    this._name = options.name;
    this._recordset = new VB6Recordset();

    // Set up recordset event handlers
    this._recordset.On('Reposition', () => this.updateBoundControls());
    this._recordset.On('FieldChangeComplete', (args) => {
      if (args.field) {
        this.updateBoundControl(args.field);
      }
    });
  }

  get Name(): string {
    return this._name;
  }

  get Recordset(): VB6Recordset {
    return this._recordset;
  }

  get RecordSource(): string {
    return this._options.recordSource || '';
  }

  set RecordSource(value: string) {
    this._options.recordSource = value;
  }

  get ConnectionString(): string {
    return this._options.connectionString || '';
  }

  set ConnectionString(value: string) {
    this._options.connectionString = value;
  }

  // ============================================================================
  // Control Binding
  // ============================================================================

  /**
   * Bind a control to a data field
   */
  BindControl(control: BoundControl): void {
    this._boundControls.set(control.name, control);

    // Initial update
    const value = this._recordset.GetValue(control.dataField);
    control.setValue(value);
  }

  /**
   * Unbind a control
   */
  UnbindControl(controlName: string): void {
    this._boundControls.delete(controlName);
  }

  /**
   * Update control from recordset
   */
  private updateBoundControl(fieldName: string): void {
    for (const control of this._boundControls.values()) {
      if (control.dataField === fieldName) {
        const value = this._recordset.GetValue(fieldName);
        control.setValue(value);
      }
    }
  }

  /**
   * Update all bound controls
   */
  private updateBoundControls(): void {
    for (const control of this._boundControls.values()) {
      const value = this._recordset.GetValue(control.dataField);
      control.setValue(value);
      control.setEnabled(!this._recordset.BOF && !this._recordset.EOF);
    }
  }

  /**
   * Update recordset from control
   */
  UpdateFromControl(controlName: string): void {
    const control = this._boundControls.get(controlName);
    if (!control) return;

    if (this._recordset.EditMode === 'None') {
      this._recordset.Edit();
    }

    const value = control.getValue();
    this._recordset.SetValue(control.dataField, value);
  }

  // ============================================================================
  // Data Operations
  // ============================================================================

  /**
   * Refresh data from source
   */
  Refresh(): void {
    this.updateBoundControls();
  }

  /**
   * Update modified records
   */
  UpdateRecord(): void {
    // Update recordset from all bound controls
    for (const control of this._boundControls.values()) {
      if (control.updateMode === 'Immediate' || control.updateMode === 'OnValidate') {
        this.UpdateFromControl(control.name);
      }
    }

    this._recordset.Update();
  }

  /**
   * Cancel changes
   */
  CancelUpdate(): void {
    this._recordset.CancelUpdate();
    this.updateBoundControls();
  }
}

// ============================================================================
// VB6 Data Binding Manager
// ============================================================================

export class VB6DataBindingManager {
  private dataSources: Map<string, VB6DataSource> = new Map();
  private controlBindings: Map<string, { dataSource: string; dataField: string }> = new Map();

  /**
   * Create a new data source
   */
  CreateDataSource(options: DataSourceOptions): VB6DataSource {
    const dataSource = new VB6DataSource(options);
    this.dataSources.set(options.name, dataSource);
    return dataSource;
  }

  /**
   * Get existing data source
   */
  GetDataSource(name: string): VB6DataSource | undefined {
    return this.dataSources.get(name);
  }

  /**
   * Remove data source
   */
  RemoveDataSource(name: string): void {
    this.dataSources.delete(name);
  }

  /**
   * Bind control to data source
   */
  BindControl(
    controlName: string,
    dataSourceName: string,
    dataField: string,
    getValue: () => any,
    setValue: (value: any) => void,
    setEnabled: (enabled: boolean) => void,
    updateMode: BoundControl['updateMode'] = 'Immediate'
  ): void {
    const dataSource = this.dataSources.get(dataSourceName);
    if (!dataSource) {
      throw new Error(`Data source '${dataSourceName}' not found`);
    }

    const boundControl: BoundControl = {
      name: controlName,
      dataField,
      updateMode,
      getValue,
      setValue,
      setEnabled
    };

    dataSource.BindControl(boundControl);
    this.controlBindings.set(controlName, { dataSource: dataSourceName, dataField });
  }

  /**
   * Unbind control
   */
  UnbindControl(controlName: string): void {
    const binding = this.controlBindings.get(controlName);
    if (binding) {
      const dataSource = this.dataSources.get(binding.dataSource);
      dataSource?.UnbindControl(controlName);
      this.controlBindings.delete(controlName);
    }
  }

  /**
   * Get binding info for control
   */
  GetBinding(controlName: string): { dataSource: string; dataField: string } | undefined {
    return this.controlBindings.get(controlName);
  }

  /**
   * Update control value in data source
   */
  UpdateControlValue(controlName: string): void {
    const binding = this.controlBindings.get(controlName);
    if (binding) {
      const dataSource = this.dataSources.get(binding.dataSource);
      dataSource?.UpdateFromControl(controlName);
    }
  }

  /**
   * Get all data source names
   */
  GetDataSourceNames(): string[] {
    return Array.from(this.dataSources.keys());
  }

  /**
   * Clear all bindings
   */
  Clear(): void {
    this.dataSources.clear();
    this.controlBindings.clear();
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const dataBindingManager = new VB6DataBindingManager();

// ============================================================================
// React Hook for Data Binding
// ============================================================================

export interface UseDataBindingOptions {
  dataSource: string;
  dataField: string;
  updateMode?: BoundControl['updateMode'];
}

/**
 * Create bound control configuration for use with VB6DataBindingManager
 */
export function createBoundControlConfig(
  controlName: string,
  options: UseDataBindingOptions,
  getValue: () => any,
  setValue: (value: any) => void,
  setEnabled: (enabled: boolean) => void
): void {
  dataBindingManager.BindControl(
    controlName,
    options.dataSource,
    options.dataField,
    getValue,
    setValue,
    setEnabled,
    options.updateMode
  );
}

// ============================================================================
// VB6-Compatible Data Control Helpers
// ============================================================================

/**
 * Navigate to first record
 */
export function DataFirst(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Recordset.MoveFirst();
}

/**
 * Navigate to previous record
 */
export function DataPrevious(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Recordset.MovePrevious();
}

/**
 * Navigate to next record
 */
export function DataNext(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Recordset.MoveNext();
}

/**
 * Navigate to last record
 */
export function DataLast(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Recordset.MoveLast();
}

/**
 * Add new record
 */
export function DataAddNew(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Recordset.AddNew();
}

/**
 * Delete current record
 */
export function DataDelete(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Recordset.Delete();
}

/**
 * Update/save current record
 */
export function DataUpdate(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.UpdateRecord();
}

/**
 * Refresh data
 */
export function DataRefresh(dataSourceName: string): void {
  const ds = dataBindingManager.GetDataSource(dataSourceName);
  ds?.Refresh();
}

// ============================================================================
// Export
// ============================================================================

export default {
  VB6Recordset,
  VB6DataSource,
  VB6DataBindingManager,
  dataBindingManager,
  createBoundControlConfig,
  DataFirst,
  DataPrevious,
  DataNext,
  DataLast,
  DataAddNew,
  DataDelete,
  DataUpdate,
  DataRefresh
};
