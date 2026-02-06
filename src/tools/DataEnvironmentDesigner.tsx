import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Connection Types
export enum ConnectionType {
  OLEDB = 'OLE DB',
  ODBC = 'ODBC',
  ADO = 'ADO',
  JET = 'Microsoft Jet',
  SQLSERVER = 'SQL Server',
  ORACLE = 'Oracle',
  ACCESS = 'Microsoft Access',
  EXCEL = 'Microsoft Excel',
}

export enum CommandType {
  Table = 'adCmdTable',
  Text = 'adCmdText',
  StoredProcedure = 'adCmdStoredProc',
  Unknown = 'adCmdUnknown',
}

export enum CursorType {
  OpenForwardOnly = 'adOpenForwardOnly',
  OpenKeyset = 'adOpenKeyset',
  OpenDynamic = 'adOpenDynamic',
  OpenStatic = 'adOpenStatic',
}

export enum LockType {
  ReadOnly = 'adLockReadOnly',
  PessimisticLock = 'adLockPessimistic',
  OptimisticLock = 'adLockOptimistic',
  BatchOptimistic = 'adLockBatchOptimistic',
}

// Database Connection
export interface DatabaseConnection {
  id: string;
  name: string;
  type: ConnectionType;
  connectionString: string;
  provider: string;
  dataSource: string;
  initialCatalog?: string;
  userId?: string;
  password?: string;
  integratedSecurity: boolean;
  timeout: number;
  isConnected: boolean;
  lastError?: string;
  properties: Record<string, any>;
}

// Command Parameter
export interface CommandParameter {
  id: string;
  name: string;
  type: string;
  direction: 'Input' | 'Output' | 'InputOutput' | 'ReturnValue';
  size: number;
  precision: number;
  scale: number;
  value?: any;
  isNullable: boolean;
}

// Database Command
export interface DatabaseCommand {
  id: string;
  name: string;
  connectionId: string;
  commandType: CommandType;
  commandText: string;
  parameters: CommandParameter[];
  timeout: number;
  prepared: boolean;
  activeConnection?: string;
  cursorType: CursorType;
  lockType: LockType;
  cacheSize: number;
  maxRecords: number;
  source?: string;
  grouping?: {
    parentField: string;
    childCommand: string;
    relationField: string;
  };
}

// Recordset Field
export interface RecordsetField {
  name: string;
  type: string;
  size: number;
  precision: number;
  scale: number;
  isNullable: boolean;
  isKey: boolean;
  isAutoIncrement: boolean;
  defaultValue?: any;
  description?: string;
}

// Database Schema
export interface DatabaseSchema {
  tables: Array<{
    name: string;
    type: 'TABLE' | 'VIEW' | 'SYSTEM_TABLE';
    fields: RecordsetField[];
    indexes: Array<{
      name: string;
      fields: string[];
      isUnique: boolean;
      isPrimary: boolean;
    }>;
  }>;
  procedures: Array<{
    name: string;
    parameters: CommandParameter[];
    returnType?: string;
  }>;
  functions: Array<{
    name: string;
    parameters: CommandParameter[];
    returnType: string;
  }>;
}

// Data Environment
export interface DataEnvironment {
  id: string;
  name: string;
  description: string;
  connections: DatabaseConnection[];
  commands: DatabaseCommand[];
  reports: Array<{
    id: string;
    name: string;
    commandId: string;
    template: string;
  }>;
  created: Date;
  modified: Date;
}

interface DataEnvironmentDesignerProps {
  environment?: DataEnvironment;
  onEnvironmentChange?: (environment: DataEnvironment) => void;
  onGenerateCode?: (code: string) => void;
  onTestConnection?: (connection: DatabaseConnection) => Promise<boolean>;
}

export const DataEnvironmentDesigner: React.FC<DataEnvironmentDesignerProps> = ({
  environment: initialEnvironment,
  onEnvironmentChange,
  onGenerateCode,
  onTestConnection,
}) => {
  const [environment, setEnvironment] = useState<DataEnvironment>(
    initialEnvironment || {
      id: 'de1',
      name: 'DataEnvironment1',
      description: 'Default Data Environment',
      connections: [],
      commands: [],
      reports: [],
      created: new Date(),
      modified: new Date(),
    }
  );

  const [selectedTab, setSelectedTab] = useState<'connections' | 'commands' | 'schema' | 'reports'>(
    'connections'
  );
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<DatabaseCommand | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [connectionDialog, setConnectionDialog] = useState<Partial<DatabaseConnection>>({
    type: ConnectionType.SQLSERVER,
    integratedSecurity: true,
    timeout: 30,
    properties: {},
  });
  const [commandDialog, setCommandDialog] = useState<Partial<DatabaseCommand>>({
    commandType: CommandType.Text,
    cursorType: CursorType.OpenForwardOnly,
    lockType: LockType.ReadOnly,
    timeout: 30,
    cacheSize: 1,
    maxRecords: 0,
    parameters: [],
  });
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [queryBuilder, setQueryBuilder] = useState<{
    show: boolean;
    tables: string[];
    fields: string[];
    conditions: string[];
    orderBy: string[];
  }>({
    show: false,
    tables: [],
    fields: [],
    conditions: [],
    orderBy: [],
  });
  const [isDirty, setIsDirty] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `id_${nextId.current++}`, []);

  // Add connection
  const addConnection = useCallback(() => {
    if (!connectionDialog.name || !connectionDialog.connectionString) return;

    const newConnection: DatabaseConnection = {
      id: generateId(),
      name: connectionDialog.name,
      type: connectionDialog.type || ConnectionType.SQLSERVER,
      connectionString: connectionDialog.connectionString,
      provider: connectionDialog.provider || '',
      dataSource: connectionDialog.dataSource || '',
      initialCatalog: connectionDialog.initialCatalog,
      userId: connectionDialog.userId,
      password: connectionDialog.password,
      integratedSecurity: connectionDialog.integratedSecurity || false,
      timeout: connectionDialog.timeout || 30,
      isConnected: false,
      properties: connectionDialog.properties || {},
    };

    setEnvironment(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      modified: new Date(),
    }));

    setConnectionDialog({
      type: ConnectionType.SQLSERVER,
      integratedSecurity: true,
      timeout: 30,
      properties: {},
    });
    setShowConnectionDialog(false);
    setIsDirty(true);
  }, [connectionDialog, generateId]);

  // Add command
  const addCommand = useCallback(() => {
    if (!commandDialog.name || !commandDialog.connectionId) return;

    const newCommand: DatabaseCommand = {
      id: generateId(),
      name: commandDialog.name,
      connectionId: commandDialog.connectionId,
      commandType: commandDialog.commandType || CommandType.Text,
      commandText: commandDialog.commandText || '',
      parameters: commandDialog.parameters || [],
      timeout: commandDialog.timeout || 30,
      prepared: false,
      cursorType: commandDialog.cursorType || CursorType.OpenForwardOnly,
      lockType: commandDialog.lockType || LockType.ReadOnly,
      cacheSize: commandDialog.cacheSize || 1,
      maxRecords: commandDialog.maxRecords || 0,
    };

    setEnvironment(prev => ({
      ...prev,
      commands: [...prev.commands, newCommand],
      modified: new Date(),
    }));

    setCommandDialog({
      commandType: CommandType.Text,
      cursorType: CursorType.OpenForwardOnly,
      lockType: LockType.ReadOnly,
      timeout: 30,
      cacheSize: 1,
      maxRecords: 0,
      parameters: [],
    });
    setShowCommandDialog(false);
    setIsDirty(true);
  }, [commandDialog, generateId]);

  // Test connection
  const testConnection = useCallback(
    async (connection: DatabaseConnection) => {
      try {
        const result = await onTestConnection?.(connection);
        if (result) {
          setEnvironment(prev => ({
            ...prev,
            connections: prev.connections.map(c =>
              c.id === connection.id ? { ...c, isConnected: true, lastError: undefined } : c
            ),
          }));
          return true;
        } else {
          setEnvironment(prev => ({
            ...prev,
            connections: prev.connections.map(c =>
              c.id === connection.id
                ? { ...c, isConnected: false, lastError: 'Connection failed' }
                : c
            ),
          }));
          return false;
        }
      } catch (error) {
        setEnvironment(prev => ({
          ...prev,
          connections: prev.connections.map(c =>
            c.id === connection.id
              ? {
                  ...c,
                  isConnected: false,
                  lastError: error instanceof Error ? error.message : 'Connection failed',
                }
              : c
          ),
        }));
        return false;
      }
    },
    [onTestConnection]
  );

  // Generate connection string
  const generateConnectionString = useCallback((conn: Partial<DatabaseConnection>): string => {
    switch (conn.type) {
      case ConnectionType.SQLSERVER: {
        let sqlConn = `Provider=SQLOLEDB;Data Source=${conn.dataSource || 'localhost'}`;
        if (conn.initialCatalog) sqlConn += `;Initial Catalog=${conn.initialCatalog}`;
        if (conn.integratedSecurity) {
          sqlConn += ';Integrated Security=SSPI';
        } else {
          sqlConn += `;User ID=${conn.userId || ''};Password=${conn.password || ''}`;
        }
        return sqlConn;
      }

      case ConnectionType.ACCESS:
        return `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${conn.dataSource || ''};User Admin;Password=;`;

      case ConnectionType.EXCEL:
        return `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${conn.dataSource || ''};Extended Properties="Excel 8.0;HDR=Yes;IMEX=1;";`;

      case ConnectionType.ORACLE:
        return `Provider=OraOLEDB.Oracle;Data Source=${conn.dataSource || ''};User Id=${conn.userId || ''};Password=${conn.password || ''};`;

      default:
        return conn.connectionString || '';
    }
  }, []);

  // Load schema
  const loadSchema = useCallback(async (connectionId: string) => {
    // Simulate loading schema
    const mockSchema: DatabaseSchema = {
      tables: [
        {
          name: 'Customers',
          type: 'TABLE',
          fields: [
            {
              name: 'CustomerID',
              type: 'int',
              size: 4,
              precision: 10,
              scale: 0,
              isNullable: false,
              isKey: true,
              isAutoIncrement: true,
            },
            {
              name: 'CompanyName',
              type: 'nvarchar',
              size: 40,
              precision: 0,
              scale: 0,
              isNullable: false,
              isKey: false,
              isAutoIncrement: false,
            },
            {
              name: 'ContactName',
              type: 'nvarchar',
              size: 30,
              precision: 0,
              scale: 0,
              isNullable: true,
              isKey: false,
              isAutoIncrement: false,
            },
            {
              name: 'Country',
              type: 'nvarchar',
              size: 15,
              precision: 0,
              scale: 0,
              isNullable: true,
              isKey: false,
              isAutoIncrement: false,
            },
          ],
          indexes: [
            { name: 'PK_Customers', fields: ['CustomerID'], isUnique: true, isPrimary: true },
            { name: 'IX_CompanyName', fields: ['CompanyName'], isUnique: false, isPrimary: false },
          ],
        },
        {
          name: 'Orders',
          type: 'TABLE',
          fields: [
            {
              name: 'OrderID',
              type: 'int',
              size: 4,
              precision: 10,
              scale: 0,
              isNullable: false,
              isKey: true,
              isAutoIncrement: true,
            },
            {
              name: 'CustomerID',
              type: 'int',
              size: 4,
              precision: 10,
              scale: 0,
              isNullable: true,
              isKey: false,
              isAutoIncrement: false,
            },
            {
              name: 'OrderDate',
              type: 'datetime',
              size: 8,
              precision: 23,
              scale: 3,
              isNullable: true,
              isKey: false,
              isAutoIncrement: false,
            },
            {
              name: 'TotalAmount',
              type: 'money',
              size: 8,
              precision: 19,
              scale: 4,
              isNullable: true,
              isKey: false,
              isAutoIncrement: false,
            },
          ],
          indexes: [
            { name: 'PK_Orders', fields: ['OrderID'], isUnique: true, isPrimary: true },
            {
              name: 'FK_Orders_Customers',
              fields: ['CustomerID'],
              isUnique: false,
              isPrimary: false,
            },
          ],
        },
      ],
      procedures: [
        {
          name: 'GetCustomerOrders',
          parameters: [
            {
              id: 'p1',
              name: '@CustomerID',
              type: 'int',
              direction: 'Input',
              size: 4,
              precision: 10,
              scale: 0,
              isNullable: false,
            },
          ],
          returnType: 'recordset',
        },
      ],
      functions: [
        {
          name: 'GetCustomerCount',
          parameters: [],
          returnType: 'int',
        },
      ],
    };

    setSchema(mockSchema);
  }, []);

  // Generate VB6 code
  const generateVB6Code = useCallback(() => {
    let code = `' Data Environment: ${environment.name}\n`;
    code += `' Generated by VB6 Data Environment Designer\n\n`;

    // Generate connection code
    environment.connections.forEach(conn => {
      code += `' Connection: ${conn.name}\n`;
      code += `Private ${conn.name} As ADODB.Connection\n\n`;

      code += `Private Sub Initialize${conn.name}()\n`;
      code += `    Set ${conn.name} = New ADODB.Connection\n`;
      code += `    ${conn.name}.ConnectionString = "${conn.connectionString}"\n`;
      code += `    ${conn.name}.ConnectionTimeout = ${conn.timeout}\n`;
      code += `    ${conn.name}.Open\n`;
      code += `End Sub\n\n`;
    });

    // Generate command code
    environment.commands.forEach(cmd => {
      const conn = environment.connections.find(c => c.id === cmd.connectionId);
      if (!conn) return;

      code += `' Command: ${cmd.name}\n`;
      code += `Private ${cmd.name} As ADODB.Recordset\n\n`;

      code += `Private Sub Initialize${cmd.name}()\n`;
      code += `    Set ${cmd.name} = New ADODB.Recordset\n`;
      code += `    ${cmd.name}.CursorType = ${cmd.cursorType}\n`;
      code += `    ${cmd.name}.LockType = ${cmd.lockType}\n`;
      if (cmd.cacheSize > 1) code += `    ${cmd.name}.CacheSize = ${cmd.cacheSize}\n`;
      if (cmd.maxRecords > 0) code += `    ${cmd.name}.MaxRecords = ${cmd.maxRecords}\n`;

      if (cmd.commandType === CommandType.Text) {
        code += `    ${cmd.name}.Open "${cmd.commandText}", ${conn.name}\n`;
      } else if (cmd.commandType === CommandType.Table) {
        code += `    ${cmd.name}.Open "${cmd.source}", ${conn.name}, ${cmd.cursorType}, ${cmd.lockType}\n`;
      }

      code += `End Sub\n\n`;
    });

    // Generate cleanup code
    code += `Private Sub Class_Terminate()\n`;
    environment.connections.forEach(conn => {
      code += `    If Not ${conn.name} Is Nothing Then\n`;
      code += `        If ${conn.name}.State = adStateOpen Then ${conn.name}.Close\n`;
      code += `        Set ${conn.name} = Nothing\n`;
      code += `    End If\n`;
    });
    environment.commands.forEach(cmd => {
      code += `    If Not ${cmd.name} Is Nothing Then\n`;
      code += `        If ${cmd.name}.State = adStateOpen Then ${cmd.name}.Close\n`;
      code += `        Set ${cmd.name} = Nothing\n`;
      code += `    End If\n`;
    });
    code += `End Sub\n`;

    onGenerateCode?.(code);
    return code;
  }, [environment, onGenerateCode]);

  // Update connection string when dialog changes
  useEffect(() => {
    if (connectionDialog.type || connectionDialog.dataSource || connectionDialog.initialCatalog) {
      setConnectionDialog(prev => ({
        ...prev,
        connectionString: generateConnectionString(prev),
      }));
    }
  }, [
    connectionDialog.type,
    connectionDialog.dataSource,
    connectionDialog.initialCatalog,
    connectionDialog.integratedSecurity,
    connectionDialog.userId,
    connectionDialog.password,
    generateConnectionString,
  ]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Data Environment Designer</h1>
            <span className="text-sm text-gray-600">{environment.name}</span>
            {isDirty && <span className="text-sm text-orange-600">* Unsaved changes</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConnectionDialog(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Connection
            </button>
            <button
              onClick={() => setShowCommandDialog(true)}
              disabled={environment.connections.length === 0}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Add Command
            </button>
            <button
              onClick={() => generateVB6Code()}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Generate Code
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'connections', label: 'Connections', count: environment.connections.length },
            { key: 'commands', label: 'Commands', count: environment.commands.length },
            { key: 'schema', label: 'Schema', count: schema?.tables.length || 0 },
            { key: 'reports', label: 'Reports', count: environment.reports.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'connections' && (
          <div className="p-6">
            <div className="grid gap-4">
              {environment.connections.map(conn => (
                <div key={conn.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{conn.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          conn.isConnected
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {conn.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {conn.type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testConnection(conn)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => loadSchema(conn.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Load Schema
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Data Source:</strong> {conn.dataSource}
                  </div>

                  {conn.initialCatalog && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Database:</strong> {conn.initialCatalog}
                    </div>
                  )}

                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Connection String:</strong>
                    <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                      {conn.connectionString}
                    </div>
                  </div>

                  {conn.lastError && (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {conn.lastError}
                    </div>
                  )}
                </div>
              ))}

              {environment.connections.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🔌</div>
                  <p className="text-lg">No connections defined</p>
                  <p className="text-sm mt-2">
                    Click "Add Connection" to create your first database connection
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'commands' && (
          <div className="p-6">
            <div className="grid gap-4">
              {environment.commands.map(cmd => {
                const conn = environment.connections.find(c => c.id === cmd.connectionId);
                return (
                  <div key={cmd.id} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium">{cmd.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {cmd.commandType}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCommand(cmd)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Connection:</strong> {conn?.name || 'Unknown'}
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Command Text:</strong>
                      <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                        {cmd.commandText || '(empty)'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Cursor Type:</strong> {cmd.cursorType}
                      </div>
                      <div>
                        <strong>Lock Type:</strong> {cmd.lockType}
                      </div>
                      <div>
                        <strong>Cache Size:</strong> {cmd.cacheSize}
                      </div>
                      <div>
                        <strong>Max Records:</strong> {cmd.maxRecords || 'All'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {environment.commands.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg">No commands defined</p>
                  <p className="text-sm mt-2">
                    Click "Add Command" to create your first database command
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'schema' && (
          <div className="p-6">
            {schema ? (
              <div className="space-y-6">
                {/* Tables */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Tables ({schema.tables.length})</h3>
                  <div className="grid gap-4">
                    {schema.tables.map(table => (
                      <div key={table.name} className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-medium">{table.name}</h4>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {table.type}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2">Field</th>
                                <th className="text-left py-2">Type</th>
                                <th className="text-left py-2">Size</th>
                                <th className="text-left py-2">Flags</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.fields.map(field => (
                                <tr key={field.name} className="border-b border-gray-100">
                                  <td className="py-2 font-mono">{field.name}</td>
                                  <td className="py-2">{field.type}</td>
                                  <td className="py-2">{field.size}</td>
                                  <td className="py-2">
                                    <div className="flex gap-1">
                                      {field.isKey && (
                                        <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">
                                          PK
                                        </span>
                                      )}
                                      {field.isAutoIncrement && (
                                        <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">
                                          AI
                                        </span>
                                      )}
                                      {!field.isNullable && (
                                        <span className="bg-red-100 text-red-800 px-1 rounded text-xs">
                                          NN
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stored Procedures */}
                {schema.procedures.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Stored Procedures ({schema.procedures.length})
                    </h3>
                    <div className="grid gap-4">
                      {schema.procedures.map(proc => (
                        <div key={proc.name} className="border border-gray-300 rounded-lg p-4">
                          <h4 className="font-medium mb-2">{proc.name}</h4>
                          {proc.parameters.length > 0 && (
                            <div className="text-sm">
                              <strong>Parameters:</strong>
                              <ul className="mt-1 list-disc list-inside text-gray-600">
                                {proc.parameters.map(param => (
                                  <li key={param.name}>
                                    {param.name} ({param.type}, {param.direction})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🗂️</div>
                <p className="text-lg">No schema loaded</p>
                <p className="text-sm mt-2">
                  Connect to a database and click "Load Schema" to view the database structure
                </p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'reports' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg">Reports</p>
              <p className="text-sm mt-2">Report designer coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Connection Dialog */}
      {showConnectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add Database Connection</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={connectionDialog.name || ''}
                  onChange={e => setConnectionDialog(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="e.g., NorthwindConnection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Type
                </label>
                <select
                  value={connectionDialog.type}
                  onChange={e =>
                    setConnectionDialog(prev => ({
                      ...prev,
                      type: e.target.value as ConnectionType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(ConnectionType).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                <input
                  type="text"
                  value={connectionDialog.dataSource || ''}
                  onChange={e =>
                    setConnectionDialog(prev => ({ ...prev, dataSource: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Server name or file path"
                />
              </div>

              {connectionDialog.type === ConnectionType.SQLSERVER && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                    <input
                      type="text"
                      value={connectionDialog.initialCatalog || ''}
                      onChange={e =>
                        setConnectionDialog(prev => ({ ...prev, initialCatalog: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Database name"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={connectionDialog.integratedSecurity || false}
                        onChange={e =>
                          setConnectionDialog(prev => ({
                            ...prev,
                            integratedSecurity: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm">Use Windows Authentication</span>
                    </label>
                  </div>

                  {!connectionDialog.integratedSecurity && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User ID
                        </label>
                        <input
                          type="text"
                          value={connectionDialog.userId || ''}
                          onChange={e =>
                            setConnectionDialog(prev => ({ ...prev, userId: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={connectionDialog.password || ''}
                          onChange={e =>
                            setConnectionDialog(prev => ({ ...prev, password: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection String
                </label>
                <textarea
                  value={connectionDialog.connectionString || ''}
                  onChange={e =>
                    setConnectionDialog(prev => ({ ...prev, connectionString: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowConnectionDialog(false);
                  setConnectionDialog({
                    type: ConnectionType.SQLSERVER,
                    integratedSecurity: true,
                    timeout: 30,
                    properties: {},
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addConnection}
                disabled={!connectionDialog.name || !connectionDialog.connectionString}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Command Dialog */}
      {showCommandDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add Database Command</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Command Name</label>
                <input
                  type="text"
                  value={commandDialog.name || ''}
                  onChange={e => setCommandDialog(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="e.g., CustomersCommand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection</label>
                <select
                  value={commandDialog.connectionId || ''}
                  onChange={e =>
                    setCommandDialog(prev => ({ ...prev, connectionId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Select connection...</option>
                  {environment.connections.map(conn => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Command Type</label>
                <select
                  value={commandDialog.commandType}
                  onChange={e =>
                    setCommandDialog(prev => ({
                      ...prev,
                      commandType: e.target.value as CommandType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(CommandType).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Command Text / Source
                </label>
                <textarea
                  value={commandDialog.commandText || ''}
                  onChange={e =>
                    setCommandDialog(prev => ({ ...prev, commandText: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows={4}
                  placeholder="SQL query, table name, or stored procedure name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cursor Type
                  </label>
                  <select
                    value={commandDialog.cursorType}
                    onChange={e =>
                      setCommandDialog(prev => ({
                        ...prev,
                        cursorType: e.target.value as CursorType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(CursorType).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lock Type</label>
                  <select
                    value={commandDialog.lockType}
                    onChange={e =>
                      setCommandDialog(prev => ({ ...prev, lockType: e.target.value as LockType }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(LockType).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCommandDialog(false);
                  setCommandDialog({
                    commandType: CommandType.Text,
                    cursorType: CursorType.OpenForwardOnly,
                    lockType: LockType.ReadOnly,
                    timeout: 30,
                    cacheSize: 1,
                    maxRecords: 0,
                    parameters: [],
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addCommand}
                disabled={!commandDialog.name || !commandDialog.connectionId}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEnvironmentDesigner;
