import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Database Types
export enum DatabaseType {
  SQLServer = 'SQL Server',
  Access = 'Microsoft Access',
  Oracle = 'Oracle',
  MySQL = 'MySQL',
  PostgreSQL = 'PostgreSQL',
  ODBC = 'ODBC',
}

// Query Types
export enum QueryType {
  Select = 'SELECT',
  Insert = 'INSERT',
  Update = 'UPDATE',
  Delete = 'DELETE',
  CreateTable = 'CREATE TABLE',
  AlterTable = 'ALTER TABLE',
  DropTable = 'DROP TABLE',
  StoredProcedure = 'EXEC',
  Custom = 'Custom',
}

// Connection State
export interface ConnectionInfo {
  id: string;
  name: string;
  type: DatabaseType;
  server: string;
  database: string;
  username: string;
  password?: string;
  port?: number;
  integratedSecurity: boolean;
  connectionString: string;
  isConnected: boolean;
}

// Database Schema Objects
export interface DatabaseObject {
  id: string;
  name: string;
  type: 'table' | 'view' | 'procedure' | 'function' | 'index';
  schema: string;
  columns?: ColumnInfo[];
  parameters?: ParameterInfo[];
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  length?: number;
  precision?: number;
  scale?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isIdentity: boolean;
  defaultValue?: string;
}

export interface ParameterInfo {
  name: string;
  dataType: string;
  direction: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: string;
}

// Query Designer Table
export interface QueryTable {
  id: string;
  tableName: string;
  alias: string;
  x: number;
  y: number;
  columns: Array<{
    name: string;
    selected: boolean;
    sortOrder?: 'ASC' | 'DESC';
    sortIndex?: number;
    groupBy?: boolean;
    criteria?: string;
    or?: string[];
  }>;
}

// Table Join
export interface TableJoin {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

// Query Result
export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  messages: string[];
  error?: string;
}

// Saved Query
export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  sql: string;
  type: QueryType;
  createdDate: Date;
  modifiedDate: Date;
  tags: string[];
  isFavorite: boolean;
}

// Query Execution Plan
export interface ExecutionPlan {
  id: string;
  operation: string;
  cost: number;
  rows: number;
  width: number;
  time: number;
  children: ExecutionPlan[];
}

interface SQLEditorQueryDesignerProps {
  onQueryExecute?: (sql: string, result: QueryResult) => void;
  onQuerySave?: (query: SavedQuery) => void;
  onConnectionChange?: (connection: ConnectionInfo) => void;
}

export const SQLEditorQueryDesigner: React.FC<SQLEditorQueryDesignerProps> = ({
  onQueryExecute,
  onQuerySave,
  onConnectionChange,
}) => {
  const [selectedTab, setSelectedTab] = useState<'editor' | 'designer' | 'results' | 'plan'>(
    'editor'
  );
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionInfo | null>(null);
  const [sqlText, setSqlText] = useState('');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [databaseObjects, setDatabaseObjects] = useState<DatabaseObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<DatabaseObject | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSaveQueryDialog, setShowSaveQueryDialog] = useState(false);
  const [queryForm, setQueryForm] = useState({
    name: '',
    description: '',
    tags: '',
  });

  // Query Designer State
  const [designerTables, setDesignerTables] = useState<QueryTable[]>([]);
  const [tableJoins, setTableJoins] = useState<TableJoin[]>([]);
  const [selectedTable, setSelectedTable] = useState<QueryTable | null>(null);
  const [draggedTable, setDraggedTable] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `item_${nextId.current++}`, []);

  // Sample database objects
  const sampleDatabaseObjects: DatabaseObject[] = [
    {
      id: generateId(),
      name: 'Customers',
      type: 'table',
      schema: 'dbo',
      columns: [
        {
          name: 'CustomerID',
          dataType: 'int',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          isIdentity: true,
        },
        {
          name: 'CompanyName',
          dataType: 'nvarchar',
          length: 50,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'ContactName',
          dataType: 'nvarchar',
          length: 50,
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'Country',
          dataType: 'nvarchar',
          length: 20,
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'Phone',
          dataType: 'nvarchar',
          length: 20,
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
      ],
    },
    {
      id: generateId(),
      name: 'Orders',
      type: 'table',
      schema: 'dbo',
      columns: [
        {
          name: 'OrderID',
          dataType: 'int',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          isIdentity: true,
        },
        {
          name: 'CustomerID',
          dataType: 'int',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          isIdentity: false,
        },
        {
          name: 'OrderDate',
          dataType: 'datetime',
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'ShipCountry',
          dataType: 'nvarchar',
          length: 20,
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'Freight',
          dataType: 'money',
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
          defaultValue: '0',
        },
      ],
    },
    {
      id: generateId(),
      name: 'Products',
      type: 'table',
      schema: 'dbo',
      columns: [
        {
          name: 'ProductID',
          dataType: 'int',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          isIdentity: true,
        },
        {
          name: 'ProductName',
          dataType: 'nvarchar',
          length: 50,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'UnitPrice',
          dataType: 'money',
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'UnitsInStock',
          dataType: 'smallint',
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
        },
        {
          name: 'Discontinued',
          dataType: 'bit',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isIdentity: false,
          defaultValue: '0',
        },
      ],
    },
    {
      id: generateId(),
      name: 'GetCustomerOrders',
      type: 'procedure',
      schema: 'dbo',
      parameters: [
        { name: '@CustomerID', dataType: 'int', direction: 'IN' },
        { name: '@StartDate', dataType: 'datetime', direction: 'IN', defaultValue: 'NULL' },
        { name: '@EndDate', dataType: 'datetime', direction: 'IN', defaultValue: 'NULL' },
      ],
    },
  ];

  // Sample saved queries
  const sampleQueries: SavedQuery[] = [
    {
      id: generateId(),
      name: 'Customer Orders Summary',
      description: 'Get order summary for all customers',
      sql: `SELECT c.CompanyName, COUNT(o.OrderID) as OrderCount, SUM(o.Freight) as TotalFreight
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.CompanyName
ORDER BY OrderCount DESC`,
      type: QueryType.Select,
      createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      modifiedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: ['customers', 'orders', 'summary'],
      isFavorite: true,
    },
    {
      id: generateId(),
      name: 'Top Products',
      description: 'List top 10 products by price',
      sql: `SELECT TOP 10 ProductName, UnitPrice
FROM Products
WHERE Discontinued = 0
ORDER BY UnitPrice DESC`,
      type: QueryType.Select,
      createdDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      modifiedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      tags: ['products', 'pricing'],
      isFavorite: false,
    },
  ];

  // Initialize sample data
  useEffect(() => {
    // CONFIGURATION VULNERABILITY BUG FIX: Sample connection with secure defaults
    const sampleConnection: ConnectionInfo = {
      id: generateId(),
      name: 'Sample SQL Server',
      type: DatabaseType.SQLServer,
      server: 'your-server-name',
      database: 'your-database-name',
      username: '', // CONFIGURATION VULNERABILITY BUG FIX: Never hardcode credentials
      integratedSecurity: true, // CONFIGURATION VULNERABILITY BUG FIX: Use integrated security by default
      connectionString: 'Server=(local);Database=YourDatabase;Integrated Security=true;',
      isConnected: false, // CONFIGURATION VULNERABILITY BUG FIX: Don't assume connected state
    };
    setConnections([sampleConnection]);
    setSelectedConnection(sampleConnection);
    setDatabaseObjects(sampleDatabaseObjects);
    setSavedQueries(sampleQueries);
  }, []);

  // Execute query
  const executeQuery = useCallback(async () => {
    if (!sqlText.trim() || !selectedConnection) return;

    setIsExecuting(true);
    setQueryResults(null);

    // Add to history
    setQueryHistory(prev => [sqlText, ...prev.filter(q => q !== sqlText)].slice(0, 20));

    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    // Simulate results based on query
    const isSelect = sqlText.trim().toUpperCase().startsWith('SELECT');
    const result: QueryResult = {
      columns: isSelect ? ['CustomerID', 'CompanyName', 'Country', 'OrderCount'] : [],
      rows: isSelect
        ? [
            [1, 'Alfreds Futterkiste', 'Germany', 12],
            [2, 'Ana Trujillo Emparedados', 'Mexico', 8],
            [3, 'Antonio Moreno Taquería', 'Mexico', 15],
            [4, 'Around the Horn', 'UK', 23],
            [5, 'Berglunds snabbköp', 'Sweden', 18],
          ]
        : [],
      rowCount: isSelect ? 5 : Math.floor(Math.random() * 100),
      executionTime: 500 + Math.random() * 1500,
      messages: isSelect ? [] : [`(${Math.floor(Math.random() * 100)} row(s) affected)`],
      error: Math.random() > 0.9 ? 'Syntax error near WHERE clause' : undefined,
    };

    setQueryResults(result);
    setIsExecuting(false);

    if (!result.error) {
      setSelectedTab('results');
    }

    onQueryExecute?.(sqlText, result);
    eventEmitter.current.emit('queryExecuted', sqlText, result);
  }, [sqlText, selectedConnection, onQueryExecute]);

  // Generate SQL from designer
  const generateSQLFromDesigner = useCallback(() => {
    if (designerTables.length === 0) return '';

    let sql = 'SELECT ';

    // Selected columns
    const selectedColumns: string[] = [];
    designerTables.forEach(table => {
      table.columns.forEach(col => {
        if (col.selected) {
          selectedColumns.push(`${table.alias}.${col.name}`);
        }
      });
    });

    sql += selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
    sql += '\nFROM ';

    // Tables and joins
    if (designerTables.length === 1) {
      sql += `${designerTables[0].tableName} ${designerTables[0].alias}`;
    } else {
      sql += `${designerTables[0].tableName} ${designerTables[0].alias}`;

      tableJoins.forEach(join => {
        const toTable = designerTables.find(t => t.id === join.toTable);
        if (toTable) {
          sql += `\n${join.joinType} JOIN ${toTable.tableName} ${toTable.alias}`;
          sql += ` ON ${join.fromTable}.${join.fromColumn} = ${join.toTable}.${join.toColumn}`;
        }
      });
    }

    // WHERE clause
    const criteria: string[] = [];
    designerTables.forEach(table => {
      table.columns.forEach(col => {
        if (col.criteria) {
          criteria.push(`${table.alias}.${col.name} ${col.criteria}`);
        }
      });
    });

    if (criteria.length > 0) {
      sql += '\nWHERE ' + criteria.join(' AND ');
    }

    // GROUP BY
    const groupByColumns: string[] = [];
    designerTables.forEach(table => {
      table.columns.forEach(col => {
        if (col.groupBy) {
          groupByColumns.push(`${table.alias}.${col.name}`);
        }
      });
    });

    if (groupByColumns.length > 0) {
      sql += '\nGROUP BY ' + groupByColumns.join(', ');
    }

    // ORDER BY
    const orderByColumns: Array<{ column: string; order: 'ASC' | 'DESC'; index: number }> = [];
    designerTables.forEach(table => {
      table.columns.forEach(col => {
        if (col.sortOrder && col.sortIndex !== undefined) {
          orderByColumns.push({
            column: `${table.alias}.${col.name}`,
            order: col.sortOrder,
            index: col.sortIndex,
          });
        }
      });
    });

    if (orderByColumns.length > 0) {
      orderByColumns.sort((a, b) => a.index - b.index);
      sql += '\nORDER BY ' + orderByColumns.map(o => `${o.column} ${o.order}`).join(', ');
    }

    return sql;
  }, [designerTables, tableJoins]);

  // Add table to designer
  const addTableToDesigner = useCallback(
    (tableName: string) => {
      const tableObj = databaseObjects.find(obj => obj.name === tableName && obj.type === 'table');
      if (!tableObj) return;

      const newTable: QueryTable = {
        id: generateId(),
        tableName: tableObj.name,
        alias: tableObj.name.charAt(0).toLowerCase(),
        x: 50 + designerTables.length * 200,
        y: 50,
        columns:
          tableObj.columns?.map(col => ({
            name: col.name,
            selected: false,
          })) || [],
      };

      setDesignerTables(prev => [...prev, newTable]);
      setShowAddTableDialog(false);
    },
    [databaseObjects, designerTables, generateId]
  );

  // Save query
  const saveQuery = useCallback(() => {
    if (!queryForm.name || !sqlText) return;

    const newQuery: SavedQuery = {
      id: generateId(),
      name: queryForm.name,
      description: queryForm.description,
      sql: sqlText,
      type: QueryType.Select, // Simplified - would parse SQL to determine
      createdDate: new Date(),
      modifiedDate: new Date(),
      tags: queryForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
      isFavorite: false,
    };

    setSavedQueries(prev => [...prev, newQuery]);
    setShowSaveQueryDialog(false);
    setQueryForm({ name: '', description: '', tags: '' });

    onQuerySave?.(newQuery);
    eventEmitter.current.emit('querySaved', newQuery);
  }, [queryForm, sqlText, generateId, onQuerySave]);

  // Format SQL
  const formatSQL = useCallback(() => {
    // Simple SQL formatter
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'INSERT',
      'UPDATE',
      'DELETE',
      'CREATE',
      'ALTER',
      'DROP',
    ];

    let formatted = sqlText;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    // Clean up extra newlines
    formatted = formatted.trim().replace(/\n\s*\n/g, '\n');
    setSqlText(formatted);
  }, [sqlText]);

  // Insert snippet
  const insertSnippet = useCallback(
    (snippet: string) => {
      if (editorRef.current) {
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        const newText = sqlText.substring(0, start) + snippet + sqlText.substring(end);
        setSqlText(newText);

        // Set cursor position after snippet
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = start + snippet.length;
            editorRef.current.selectionEnd = start + snippet.length;
            editorRef.current.focus();
          }
        }, 0);
      }
    },
    [sqlText]
  );

  // Toggle column selection in designer
  const toggleColumnSelection = useCallback((tableId: string, columnName: string) => {
    setDesignerTables(prev =>
      prev.map(table => {
        if (table.id === tableId) {
          return {
            ...table,
            columns: table.columns.map(col => {
              if (col.name === columnName) {
                return { ...col, selected: !col.selected };
              }
              return col;
            }),
          };
        }
        return table;
      })
    );
  }, []);

  // Update designer SQL
  useEffect(() => {
    if (selectedTab === 'designer' && designerTables.length > 0) {
      const generatedSQL = generateSQLFromDesigner();
      if (generatedSQL) {
        setSqlText(generatedSQL);
      }
    }
  }, [designerTables, tableJoins, selectedTab, generateSQLFromDesigner]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">SQL Editor & Query Designer</h1>
          <div className="flex items-center gap-2">
            {selectedConnection ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600">●</span>
                <span>{selectedConnection.name}</span>
                <span className="text-gray-500">({selectedConnection.database})</span>
              </div>
            ) : (
              <button
                onClick={() => setShowConnectionDialog(true)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={executeQuery}
          disabled={isExecuting || !selectedConnection || !sqlText.trim()}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-1"
        >
          {isExecuting ? 'Executing...' : '▶ Execute'}
        </button>
        <button
          onClick={() => setShowSaveQueryDialog(true)}
          disabled={!sqlText.trim()}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Save Query
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={formatSQL}
          disabled={!sqlText.trim()}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Format SQL
        </button>
        <button
          onClick={() => setSqlText('')}
          disabled={!sqlText}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Clear
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <select
          onChange={e => insertSnippet(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
          value=""
        >
          <option value="">Insert Snippet...</option>
          <option value="SELECT * FROM ">SELECT * FROM</option>
          <option value="INSERT INTO table_name (column1, column2) VALUES (value1, value2)">
            INSERT INTO
          </option>
          <option value="UPDATE table_name SET column1 = value1 WHERE condition">UPDATE</option>
          <option value="DELETE FROM table_name WHERE condition">DELETE FROM</option>
          <option value="CREATE TABLE table_name (\n  id INT PRIMARY KEY,\n  column1 VARCHAR(50)\n)">
            CREATE TABLE
          </option>
          <option value="BEGIN TRANSACTION\n\nCOMMIT">Transaction</option>
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setSelectedTab('editor')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            SQL Editor
          </button>
          <button
            onClick={() => setSelectedTab('designer')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'designer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Query Designer
          </button>
          <button
            onClick={() => setSelectedTab('results')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Results {queryResults && `(${queryResults.rowCount})`}
          </button>
          <button
            onClick={() => setSelectedTab('plan')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'plan'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Execution Plan
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Database Objects */}
        <div className="w-64 border-r border-gray-200 flex flex-col">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium">Database Objects</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {/* Tables */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Tables</h4>
              {databaseObjects
                .filter(obj => obj.type === 'table')
                .map(table => (
                  <div
                    key={table.id}
                    className={`p-2 text-sm hover:bg-gray-100 cursor-pointer rounded ${
                      selectedObject?.id === table.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedObject(table)}
                    onDoubleClick={() => {
                      if (selectedTab === 'designer') {
                        addTableToDesigner(table.name);
                      } else {
                        insertSnippet(table.name);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>📊</span>
                      <span>{table.name}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Stored Procedures */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Stored Procedures</h4>
              {databaseObjects
                .filter(obj => obj.type === 'procedure')
                .map(proc => (
                  <div
                    key={proc.id}
                    className={`p-2 text-sm hover:bg-gray-100 cursor-pointer rounded ${
                      selectedObject?.id === proc.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedObject(proc)}
                    onDoubleClick={() => insertSnippet(`EXEC ${proc.name}`)}
                  >
                    <div className="flex items-center gap-1">
                      <span>⚡</span>
                      <span>{proc.name}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Object Details */}
            {selectedObject && (
              <div className="mt-4 p-2 bg-gray-50 rounded">
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  {selectedObject.name} Details
                </h4>
                {selectedObject.columns && (
                  <div className="space-y-1">
                    {selectedObject.columns.map(col => (
                      <div
                        key={col.name}
                        className="text-xs text-gray-600 cursor-pointer hover:text-gray-800"
                        onDoubleClick={() => insertSnippet(col.name)}
                      >
                        {col.isPrimaryKey && '🔑'} {col.name} ({col.dataType}
                        {col.length && `(${col.length})`})
                      </div>
                    ))}
                  </div>
                )}
                {selectedObject.parameters && (
                  <div className="space-y-1">
                    {selectedObject.parameters.map(param => (
                      <div key={param.name} className="text-xs text-gray-600">
                        {param.name} ({param.dataType}) {param.direction}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Queries */}
          <div className="border-t border-gray-200">
            <div className="p-2 bg-gray-50">
              <h3 className="text-sm font-medium">Saved Queries</h3>
            </div>
            <div className="p-2 max-h-48 overflow-y-auto">
              {savedQueries.map(query => (
                <div
                  key={query.id}
                  className="p-2 text-sm hover:bg-gray-100 cursor-pointer rounded"
                  onClick={() => setSqlText(query.sql)}
                >
                  <div className="flex items-center gap-1">
                    {query.isFavorite && <span className="text-yellow-500">★</span>}
                    <span className="truncate">{query.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{query.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedTab === 'editor' && (
            <div className="flex-1 p-4">
              <textarea
                ref={editorRef}
                value={sqlText}
                onChange={e => setSqlText(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SQL query here..."
                spellCheck={false}
              />
            </div>
          )}

          {selectedTab === 'designer' && (
            <div className="flex-1 relative bg-gray-50">
              {/* Designer Toolbar */}
              <div className="absolute top-2 left-2 z-10 flex gap-2">
                <button
                  onClick={() => setShowAddTableDialog(true)}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded shadow hover:bg-gray-100"
                >
                  Add Table
                </button>
                <button
                  onClick={() => {
                    setDesignerTables([]);
                    setTableJoins([]);
                  }}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded shadow hover:bg-gray-100"
                >
                  Clear
                </button>
              </div>

              {/* Designer Canvas */}
              <div className="w-full h-full overflow-auto">
                <div className="relative" style={{ width: '2000px', height: '2000px' }}>
                  {/* Grid Background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Tables */}
                  {designerTables.map(table => (
                    <div
                      key={table.id}
                      className={`absolute bg-white border-2 rounded shadow-lg ${
                        selectedTable?.id === table.id ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ left: table.x, top: table.y, minWidth: '200px' }}
                      onMouseDown={e => {
                        setSelectedTable(table);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDraggedTable({
                          id: table.id,
                          offsetX: e.clientX - rect.left,
                          offsetY: e.clientY - rect.top,
                        });
                      }}
                    >
                      <div className="bg-blue-500 text-white p-2 rounded-t cursor-move">
                        <div className="font-medium text-sm">{table.tableName}</div>
                        <div className="text-xs opacity-75">({table.alias})</div>
                      </div>
                      <div className="p-2">
                        {table.columns.map(col => (
                          <div
                            key={col.name}
                            className="flex items-center gap-2 py-1 hover:bg-gray-100 cursor-pointer"
                            onClick={() => toggleColumnSelection(table.id, col.name)}
                          >
                            <input
                              type="checkbox"
                              checked={col.selected}
                              onChange={() => {}}
                              className="cursor-pointer"
                            />
                            <span className="text-sm">{col.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Join Lines */}
                  <svg className="absolute inset-0 pointer-events-none">
                    {tableJoins.map(join => {
                      const fromTable = designerTables.find(t => t.id === join.fromTable);
                      const toTable = designerTables.find(t => t.id === join.toTable);
                      if (!fromTable || !toTable) return null;

                      const x1 = fromTable.x + 200;
                      const y1 = fromTable.y + 50;
                      const x2 = toTable.x;
                      const y2 = toTable.y + 50;

                      return (
                        <line
                          key={join.id}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#3B82F6"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="10"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                      </marker>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'results' && (
            <div className="flex-1 overflow-auto">
              {queryResults ? (
                queryResults.error ? (
                  <div className="p-4">
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                      <h3 className="font-medium text-red-800 mb-2">Query Error</h3>
                      <p className="text-red-700">{queryResults.error}</p>
                    </div>
                  </div>
                ) : queryResults.columns.length > 0 ? (
                  <div className="h-full">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          {queryResults.columns.map((col, index) => (
                            <th
                              key={index}
                              className="text-left p-2 border-b border-gray-300 font-medium text-sm"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 border-b border-gray-200 text-sm">
                                {cell !== null ? String(cell) : '<NULL>'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <h3 className="font-medium text-green-800 mb-2">
                        Query Executed Successfully
                      </h3>
                      {queryResults.messages.map((msg, index) => (
                        <p key={index} className="text-green-700">
                          {msg}
                        </p>
                      ))}
                      <p className="text-sm text-gray-600 mt-2">
                        Execution time: {queryResults.executionTime.toFixed(0)}ms
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p>Execute a query to see results</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'plan' && (
            <div className="flex-1 p-4">
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📈</div>
                <p className="text-lg">Execution Plan</p>
                <p className="text-sm mt-2">
                  Visual representation of query execution plan will appear here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Query History */}
      {queryHistory.length > 0 && (
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">History:</span>
            <div className="flex-1 flex gap-2 overflow-x-auto">
              {queryHistory.slice(0, 5).map((query, index) => (
                <button
                  key={index}
                  onClick={() => setSqlText(query)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-100 whitespace-nowrap"
                  title={query}
                >
                  {query.substring(0, 30)}...
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Table Dialog */}
      {showAddTableDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-medium mb-4">Add Table to Query</h2>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {databaseObjects
                .filter(obj => obj.type === 'table')
                .map(table => (
                  <button
                    key={table.id}
                    onClick={() => addTableToDesigner(table.name)}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center gap-2"
                  >
                    <span>📊</span>
                    <span>{table.name}</span>
                  </button>
                ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAddTableDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Query Dialog */}
      {showSaveQueryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">Save Query</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Query Name</label>
                <input
                  type="text"
                  value={queryForm.name}
                  onChange={e => setQueryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="My Query"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={queryForm.description}
                  onChange={e => setQueryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={2}
                  placeholder="Query description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={queryForm.tags}
                  onChange={e => setQueryForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="customers, orders, reports"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm font-medium mb-1">SQL Preview</h4>
                <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                  {sqlText.substring(0, 200)}...
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveQueryDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveQuery}
                disabled={!queryForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLEditorQueryDesigner;
