/**
 * Types et interfaces pour l'accès aux données VB6
 */

export type DatabaseProvider =
  | 'oledb'
  | 'odbc'
  | 'mysql'
  | 'postgresql'
  | 'mssql'
  | 'oracle'
  | 'sqlite'
  | 'mongodb'
  | 'access'
  | 'dbase'
  | 'paradox'
  | 'foxpro';

export type ConnectionState = 'closed' | 'connecting' | 'open' | 'executing' | 'fetching';

export type CursorType = 'forward-only' | 'keyset' | 'dynamic' | 'static';

export type LockType = 'read-only' | 'pessimistic' | 'optimistic' | 'batch-optimistic';

export type CursorLocation = 'client' | 'server';

export type IsolationLevel =
  | 'read-uncommitted'
  | 'read-committed'
  | 'repeatable-read'
  | 'serializable';

export type ConnectMode =
  | 'read-only'
  | 'read-write'
  | 'share-deny-read'
  | 'share-deny-write'
  | 'share-exclusive';

export interface ConnectionOptions {
  provider: DatabaseProvider;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  timeout?: number;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  extra?: Record<string, any>;
}

export interface VB6Connection {
  id: string;
  connectionString: string;
  provider: DatabaseProvider;
  isOpen: boolean;
  state: ConnectionState;
  timeout: number;
  cursorLocation: CursorLocation;
  mode: ConnectMode;
  isolationLevel: IsolationLevel;
  connection: any; // Connexion native
  pool: any; // Pool de connexions
  createdAt: Date;
  lastUsed: Date;
  attributes?: Record<string, any>;
}

export interface VB6Field {
  name: string;
  type: string;
  size: number;
  precision?: number;
  scale?: number;
  allowNull: boolean;
  isKey: boolean;
  isAutoIncrement: boolean;
  defaultValue?: any;
  attributes?: Record<string, any>;
}

export interface VB6Recordset {
  id: string;
  connectionId: string;
  source: string;
  state: 'closed' | 'open' | 'connecting' | 'executing' | 'fetching';
  cursorType: CursorType;
  lockType: LockType;
  maxRecords: number;
  recordCount: number;
  fields: VB6Field[];
  data: any[];
  position: number;
  bof: boolean;
  eof: boolean;
  isOpen: boolean;
  createdAt: Date;
  lastUsed: Date;
  filter?: string;
  sort?: string;
  index?: string;
  bookmark?: any;
  absolutePosition?: number;
  percentPosition?: number;
  pageCount?: number;
  pageSize?: number;
  cacheSize?: number;
  marshalOptions?: number;
  attributes?: Record<string, any>;
}

export interface QueryResult {
  data: any[];
  recordsAffected: number;
  executionTime: number;
  fromCache?: boolean;
  fields?: VB6Field[];
  hasMorePages?: boolean;
  nextPageToken?: string;
}

export interface ADOConnectionConfig {
  connectionString: string;
  provider: string;
  timeout: number;
  mode: ConnectMode;
  cursorLocation: CursorLocation;
  isolationLevel: IsolationLevel;
  attributes?: Record<string, any>;
}

export interface ADORecordsetConfig {
  source: string;
  activeConnection: string; // Connection ID
  cursorType: CursorType;
  lockType: LockType;
  options?: number;
  maxRecords?: number;
  cacheSize?: number;
  pageSize?: number;
  attributes?: Record<string, any>;
}

export interface ODBCConnectionConfig {
  dsn: string;
  driver: string;
  server: string;
  database: string;
  uid: string;
  pwd: string;
  timeout: number;
  autoCommit: boolean;
  readOnly: boolean;
  attributes?: Record<string, any>;
}

export interface DataEnvironmentConfig {
  name: string;
  connections: ADOConnectionConfig[];
  commands: DataCommandConfig[];
  relationships: DataRelationConfig[];
  attributes?: Record<string, any>;
}

export interface DataCommandConfig {
  name: string;
  connectionId: string;
  commandType: 'text' | 'table' | 'stored-procedure';
  commandText: string;
  parameters: DataParameterConfig[];
  prepared: boolean;
  timeout: number;
  attributes?: Record<string, any>;
}

export interface DataParameterConfig {
  name: string;
  type: string;
  direction: 'input' | 'output' | 'input-output' | 'return-value';
  size: number;
  precision?: number;
  scale?: number;
  value?: any;
  attributes?: Record<string, any>;
}

export interface DataRelationConfig {
  name: string;
  parentCommand: string;
  childCommand: string;
  parentFields: string[];
  childFields: string[];
  attributes?: Record<string, any>;
}

export interface CrystalReportConfig {
  reportPath: string;
  dataSource: string | VB6Connection;
  parameters: Record<string, any>;
  selectionFormula?: string;
  groupSortFields?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  outputFormat: 'pdf' | 'excel' | 'word' | 'rtf' | 'html' | 'xml' | 'csv';
  exportOptions?: Record<string, any>;
}

export interface DatabaseMetadata {
  provider: DatabaseProvider;
  version: string;
  capabilities: {
    transactions: boolean;
    nestedTransactions: boolean;
    savepoints: boolean;
    cursors: boolean;
    procedures: boolean;
    functions: boolean;
    triggers: boolean;
    views: boolean;
    indexes: boolean;
    foreignKeys: boolean;
    checkConstraints: boolean;
    schemas: boolean;
  };
  limits: {
    maxConnections: number;
    maxTableNameLength: number;
    maxColumnNameLength: number;
    maxRowSize: number;
    maxSqlLength: number;
    maxColumnsPerTable: number;
    maxIndexesPerTable: number;
  };
  dataTypes: Array<{
    name: string;
    sqlType: number;
    precision?: number;
    scale?: number;
    autoIncrement?: boolean;
    caseSensitive?: boolean;
    searchable?: boolean;
  }>;
}

export interface TableSchema {
  name: string;
  schema: string;
  type: 'table' | 'view' | 'system-table' | 'temporary';
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  foreignKeys: ForeignKeySchema[];
  checkConstraints: CheckConstraintSchema[];
  triggers: TriggerSchema[];
  rowCount?: number;
  created?: Date;
  modified?: Date;
  attributes?: Record<string, any>;
}

export interface ColumnSchema {
  name: string;
  position: number;
  dataType: string;
  sqlType: number;
  size: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  defaultValue?: any;
  autoIncrement: boolean;
  primaryKey: boolean;
  unique: boolean;
  comment?: string;
  attributes?: Record<string, any>;
}

export interface IndexSchema {
  name: string;
  unique: boolean;
  primary: boolean;
  clustered: boolean;
  columns: Array<{
    name: string;
    position: number;
    direction: 'asc' | 'desc';
  }>;
  attributes?: Record<string, any>;
}

export interface ForeignKeySchema {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onUpdate: 'cascade' | 'restrict' | 'set-null' | 'set-default' | 'no-action';
  onDelete: 'cascade' | 'restrict' | 'set-null' | 'set-default' | 'no-action';
  attributes?: Record<string, any>;
}

export interface CheckConstraintSchema {
  name: string;
  definition: string;
  attributes?: Record<string, any>;
}

export interface TriggerSchema {
  name: string;
  event: 'insert' | 'update' | 'delete';
  timing: 'before' | 'after' | 'instead-of';
  definition: string;
  attributes?: Record<string, any>;
}

export interface ProcedureSchema {
  name: string;
  schema: string;
  type: 'procedure' | 'function';
  parameters: Array<{
    name: string;
    direction: 'in' | 'out' | 'inout';
    dataType: string;
    defaultValue?: any;
  }>;
  returnType?: string;
  definition?: string;
  created?: Date;
  modified?: Date;
  attributes?: Record<string, any>;
}

export interface ExecutionPlan {
  query: string;
  estimatedCost: number;
  estimatedRows: number;
  operations: Array<{
    type: string;
    table?: string;
    index?: string;
    cost: number;
    rows: number;
    details?: Record<string, any>;
  }>;
  recommendations?: string[];
}

export interface QueryStatistics {
  query: string;
  executionCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  lastExecuted: Date;
  planHash?: string;
  attributes?: Record<string, any>;
}

export interface ConnectionPoolStatus {
  provider: DatabaseProvider;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalRequests: number;
  totalAcquires: number;
  totalReleases: number;
  totalDestroys: number;
  totalTimeouts: number;
  averageAcquireTime: number;
  averageCreateTime: number;
  attributes?: Record<string, any>;
}

export interface DatabaseHealth {
  provider: DatabaseProvider;
  connected: boolean;
  responseTime: number;
  version: string;
  uptime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  activeConnections?: number;
  maxConnections?: number;
  locksHeld?: number;
  transactionsPerSecond?: number;
  queriesPerSecond?: number;
  cacheHitRatio?: number;
  lastBackup?: Date;
  replicationLag?: number;
  errors?: Array<{
    timestamp: Date;
    level: 'warning' | 'error' | 'critical';
    message: string;
    details?: any;
  }>;
  attributes?: Record<string, any>;
}

// Events
export interface DatabaseEvent {
  type: 'connection' | 'query' | 'transaction' | 'error' | 'warning' | 'info';
  timestamp: Date;
  connectionId?: string;
  sessionId?: string;
  userId?: string;
  database?: string;
  message: string;
  details?: any;
  duration?: number;
  attributes?: Record<string, any>;
}

// Notifications WebSocket
export interface DataNotification {
  type:
    | 'record-changed'
    | 'table-changed'
    | 'schema-changed'
    | 'connection-lost'
    | 'performance-alert';
  timestamp: Date;
  source: string;
  target?: string;
  data?: any;
  attributes?: Record<string, any>;
}
