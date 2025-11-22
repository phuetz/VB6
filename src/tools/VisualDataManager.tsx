import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Database Types
export enum DatabaseType {
  Access = 'Microsoft Access',
  SqlServer = 'SQL Server',
  Oracle = 'Oracle',
  MySQL = 'MySQL',
  SQLite = 'SQLite',
  Excel = 'Microsoft Excel',
  Text = 'Text Files',
  dBase = 'dBASE',
  Paradox = 'Paradox',
  FoxPro = 'FoxPro'
}

// Field Data Types
export enum FieldDataType {
  AutoNumber = 'AutoNumber',
  Text = 'Text',
  Memo = 'Memo',
  Number = 'Number',
  DateTime = 'Date/Time',
  Currency = 'Currency',
  Yes_No = 'Yes/No',
  OLE_Object = 'OLE Object',
  Hyperlink = 'Hyperlink',
  Lookup = 'Lookup Wizard',
  Binary = 'Binary',
  GUID = 'Replication ID'
}

// Index Types
export enum IndexType {
  Primary = 'Primary',
  Unique = 'Unique',
  Duplicates_OK = 'Duplicates OK',
  Foreign = 'Foreign Key'
}

// Relationship Types
export enum RelationshipType {
  OneToOne = '1:1',
  OneToMany = '1:M',
  ManyToMany = 'M:M'
}

// Database Field
export interface DatabaseField {
  name: string;
  dataType: FieldDataType;
  size: number;
  precision?: number;
  scale?: number;
  required: boolean;
  allowZeroLength: boolean;
  indexed: boolean;
  defaultValue?: any;
  validationRule?: string;
  validationText?: string;
  description?: string;
  inputMask?: string;
  format?: string;
  caption?: string;
  originalName?: string;
}

// Database Index
export interface DatabaseIndex {
  name: string;
  fields: string[];
  primary: boolean;
  unique: boolean;
  ignoreNulls: boolean;
  clustered: boolean;
  foreign: boolean;
  required: boolean;
  distinctCount?: number;
}

// Database Table
export interface DatabaseTable {
  name: string;
  type: 'Table' | 'View' | 'System Table';
  fields: DatabaseField[];
  indexes: DatabaseIndex[];
  recordCount: number;
  dateCreated?: Date;
  lastUpdated?: Date;
  description?: string;
  validationRule?: string;
  validationText?: string;
  connect?: string;
  sourceTableName?: string;
}

// Database Query
export interface DatabaseQuery {
  name: string;
  type: 'Select' | 'Action' | 'Crosstab' | 'Union' | 'Pass-Through' | 'Data Definition';
  sql: string;
  description?: string;
  parameters: Array<{
    name: string;
    dataType: string;
    value?: any;
  }>;
  connect?: string;
  odbcTimeout?: number;
  returnsRecords: boolean;
  replicable: boolean;
}

// Database Relationship
export interface DatabaseRelationship {
  name: string;
  table: string;
  foreignTable: string;
  fields: Array<{
    name: string;
    foreignName: string;
  }>;
  type: RelationshipType;
  enforceReferentialIntegrity: boolean;
  cascadeUpdates: boolean;
  cascadeDeletes: boolean;
  attributes: string[];
}

// Database Connection
export interface DatabaseConnection {
  name: string;
  type: DatabaseType;
  connectionString: string;
  filePath?: string;
  server?: string;
  database?: string;
  username?: string;
  password?: string;
  connected: boolean;
  version?: string;
  provider?: string;
  lastError?: string;
}

// Database Schema
export interface DatabaseSchema {
  connection: DatabaseConnection;
  tables: DatabaseTable[];
  queries: DatabaseQuery[];
  relationships: DatabaseRelationship[];
  properties: Record<string, any>;
}

// SQL Query Result
export interface QueryResult {
  fields: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  records: Record<string, any>[];
  recordCount: number;
  executionTime: number;
  error?: string;
}

// Visual Data Manager Props
interface VisualDataManagerProps {
  onDatabaseOpen?: (schema: DatabaseSchema) => void;
  onQueryExecute?: (sql: string, result: QueryResult) => void;
  onClose?: () => void;
}

export const VisualDataManager: React.FC<VisualDataManagerProps> = ({
  onDatabaseOpen,
  onQueryExecute,
  onClose
}) => {
  const [currentSchema, setCurrentSchema] = useState<DatabaseSchema | null>(null);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<DatabaseQuery | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'queries' | 'relationships' | 'data' | 'sql'>('tables');
  const [tableData, setTableData] = useState<Record<string, any>[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showTableDesigner, setShowTableDesigner] = useState(false);
  const [showQueryDesigner, setShowQueryDesigner] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [isModified, setIsModified] = useState(false);

  const eventEmitter = useRef(new EventEmitter());

  // Sample database schema for demonstration
  const sampleSchema: DatabaseSchema = {
    connection: {
      name: 'Northwind',
      type: DatabaseType.Access,
      connectionString: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=Northwind.mdb;',
      filePath: 'C:\\Program Files\\Microsoft Office\\Office\\Samples\\Northwind.mdb',
      connected: true,
      version: '4.0',
      provider: 'Microsoft.Jet.OLEDB.4.0'
    },
    tables: [
      {
        name: 'Customers',
        type: 'Table',
        recordCount: 91,
        dateCreated: new Date('2024-01-01'),
        lastUpdated: new Date('2024-01-15'),
        fields: [
          {
            name: 'CustomerID',
            dataType: FieldDataType.Text,
            size: 5,
            required: true,
            allowZeroLength: false,
            indexed: true,
            description: 'Unique customer identifier'
          },
          {
            name: 'CompanyName',
            dataType: FieldDataType.Text,
            size: 40,
            required: true,
            allowZeroLength: false,
            indexed: false,
            description: 'Customer company name'
          },
          {
            name: 'ContactName',
            dataType: FieldDataType.Text,
            size: 30,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Primary contact name'
          },
          {
            name: 'ContactTitle',
            dataType: FieldDataType.Text,
            size: 30,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Contact person title'
          },
          {
            name: 'Address',
            dataType: FieldDataType.Text,
            size: 60,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Street address'
          },
          {
            name: 'City',
            dataType: FieldDataType.Text,
            size: 15,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'City name'
          },
          {
            name: 'Region',
            dataType: FieldDataType.Text,
            size: 15,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'State or region'
          },
          {
            name: 'PostalCode',
            dataType: FieldDataType.Text,
            size: 10,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Postal or ZIP code'
          },
          {
            name: 'Country',
            dataType: FieldDataType.Text,
            size: 15,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Country name'
          },
          {
            name: 'Phone',
            dataType: FieldDataType.Text,
            size: 24,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Phone number'
          },
          {
            name: 'Fax',
            dataType: FieldDataType.Text,
            size: 24,
            required: false,
            allowZeroLength: true,
            indexed: false,
            description: 'Fax number'
          }
        ],
        indexes: [
          {
            name: 'PrimaryKey',
            fields: ['CustomerID'],
            primary: true,
            unique: true,
            ignoreNulls: false,
            clustered: false,
            foreign: false,
            required: true
          },
          {
            name: 'City',
            fields: ['City'],
            primary: false,
            unique: false,
            ignoreNulls: true,
            clustered: false,
            foreign: false,
            required: false
          }
        ]
      },
      {
        name: 'Orders',
        type: 'Table',
        recordCount: 830,
        dateCreated: new Date('2024-01-01'),
        lastUpdated: new Date('2024-01-20'),
        fields: [
          {
            name: 'OrderID',
            dataType: FieldDataType.AutoNumber,
            size: 4,
            required: true,
            allowZeroLength: false,
            indexed: true,
            description: 'Unique order identifier'
          },
          {
            name: 'CustomerID',
            dataType: FieldDataType.Text,
            size: 5,
            required: false,
            allowZeroLength: true,
            indexed: true,
            description: 'Customer identifier'
          },
          {
            name: 'EmployeeID',
            dataType: FieldDataType.Number,
            size: 4,
            required: false,
            allowZeroLength: false,
            indexed: true,
            description: 'Employee identifier'
          },
          {
            name: 'OrderDate',
            dataType: FieldDataType.DateTime,
            size: 8,
            required: false,
            allowZeroLength: false,
            indexed: false,
            description: 'Order date'
          },
          {
            name: 'RequiredDate',
            dataType: FieldDataType.DateTime,
            size: 8,
            required: false,
            allowZeroLength: false,
            indexed: false,
            description: 'Required delivery date'
          },
          {
            name: 'ShippedDate',
            dataType: FieldDataType.DateTime,
            size: 8,
            required: false,
            allowZeroLength: false,
            indexed: false,
            description: 'Actual ship date'
          },
          {
            name: 'Freight',
            dataType: FieldDataType.Currency,
            size: 8,
            required: false,
            allowZeroLength: false,
            indexed: false,
            description: 'Shipping cost'
          }
        ],
        indexes: [
          {
            name: 'PrimaryKey',
            fields: ['OrderID'],
            primary: true,
            unique: true,
            ignoreNulls: false,
            clustered: false,
            foreign: false,
            required: true
          },
          {
            name: 'CustomerID',
            fields: ['CustomerID'],
            primary: false,
            unique: false,
            ignoreNulls: true,
            clustered: false,
            foreign: true,
            required: false
          }
        ]
      }
    ],
    queries: [
      {
        name: 'Customer Orders',
        type: 'Select',
        sql: 'SELECT c.CompanyName, o.OrderID, o.OrderDate, o.Freight FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID ORDER BY c.CompanyName, o.OrderDate',
        description: 'List of orders by customer',
        parameters: [],
        returnsRecords: true,
        replicable: true
      },
      {
        name: 'Orders by Date Range',
        type: 'Select',
        sql: 'SELECT * FROM Orders WHERE OrderDate BETWEEN [@StartDate] AND [@EndDate] ORDER BY OrderDate',
        description: 'Orders within a date range',
        parameters: [
          { name: '@StartDate', dataType: 'Date/Time' },
          { name: '@EndDate', dataType: 'Date/Time' }
        ],
        returnsRecords: true,
        replicable: true
      }
    ],
    relationships: [
      {
        name: 'CustomersOrders',
        table: 'Customers',
        foreignTable: 'Orders',
        fields: [
          { name: 'CustomerID', foreignName: 'CustomerID' }
        ],
        type: RelationshipType.OneToMany,
        enforceReferentialIntegrity: true,
        cascadeUpdates: false,
        cascadeDeletes: false,
        attributes: []
      }
    ],
    properties: {
      version: '4.0',
      collatingOrder: 'General',
      queryTimeout: 60,
      recycleBin: true,
      startupForm: '',
      startupShowDBWindow: true,
      startupShowStatusBar: true,
      allowBuiltinToolbars: true,
      allowFullMenus: true,
      allowBreakIntoCode: true,
      allowSpecialKeys: true,
      useAccessSpecialKeys: true
    }
  };

  // Initialize with sample data
  useEffect(() => {
    setCurrentSchema(sampleSchema);
    onDatabaseOpen?.(sampleSchema);
  }, [onDatabaseOpen]);

  // Generate sample table data
  const generateSampleData = useCallback((table: DatabaseTable, page: number = 1, size: number = 50): Record<string, any>[] => {
    const data: Record<string, any>[] = [];
    const startIndex = (page - 1) * size;
    
    if (table.name === 'Customers') {
      const customers = [
        { CustomerID: 'ALFKI', CompanyName: 'Alfreds Futterkiste', ContactName: 'Maria Anders', ContactTitle: 'Sales Representative', Address: 'Obere Str. 57', City: 'Berlin', Region: null, PostalCode: '12209', Country: 'Germany', Phone: '030-0074321', Fax: '030-0076545' },
        { CustomerID: 'ANATR', CompanyName: 'Ana Trujillo Emparedados y helados', ContactName: 'Ana Trujillo', ContactTitle: 'Owner', Address: 'Avda. de la Constitución 2222', City: 'México D.F.', Region: null, PostalCode: '05021', Country: 'Mexico', Phone: '(5) 555-4729', Fax: '(5) 555-3745' },
        { CustomerID: 'ANTON', CompanyName: 'Antonio Moreno Taquería', ContactName: 'Antonio Moreno', ContactTitle: 'Owner', Address: 'Mataderos 2312', City: 'México D.F.', Region: null, PostalCode: '05023', Country: 'Mexico', Phone: '(5) 555-3932', Fax: null },
        { CustomerID: 'AROUT', CompanyName: 'Around the Horn', ContactName: 'Thomas Hardy', ContactTitle: 'Sales Representative', Address: '120 Hanover Sq.', City: 'London', Region: null, PostalCode: 'WA1 1DP', Country: 'UK', Phone: '(171) 555-7788', Fax: '(171) 555-6750' },
        { CustomerID: 'BERGS', CompanyName: 'Berglunds snabbköp', ContactName: 'Christina Berglund', ContactTitle: 'Order Administrator', Address: 'Berguvsvägen 8', City: 'Luleå', Region: null, PostalCode: 'S-958 22', Country: 'Sweden', Phone: '0921-12 34 65', Fax: '0921-12 34 67' }
      ];
      
      for (let i = startIndex; i < Math.min(startIndex + size, customers.length * 10); i++) {
        const baseCustomer = customers[i % customers.length];
        data.push({
          ...baseCustomer,
          CustomerID: `${baseCustomer.CustomerID}${Math.floor(i / customers.length)}`,
          CompanyName: `${baseCustomer.CompanyName} ${Math.floor(i / customers.length) > 0 ? `(${Math.floor(i / customers.length)})` : ''}`
        });
      }
    } else if (table.name === 'Orders') {
      for (let i = startIndex; i < Math.min(startIndex + size, 830); i++) {
        data.push({
          OrderID: 10248 + i,
          CustomerID: `ALFKI${i % 5}`,
          EmployeeID: (i % 9) + 1,
          OrderDate: new Date(1996, 6, 4 + i),
          RequiredDate: new Date(1996, 7, 1 + i),
          ShippedDate: new Date(1996, 6, 16 + i),
          Freight: Math.round((Math.random() * 500 + 10) * 100) / 100
        });
      }
    }
    
    return data;
  }, []);

  // Load table data
  const loadTableData = useCallback((table: DatabaseTable, page: number = 1) => {
    setTableData(generateSampleData(table, page, pageSize));
  }, [generateSampleData, pageSize]);

  // Execute SQL query
  const executeQuery = useCallback(async (sql: string) => {
    setIsExecuting(true);
    setQueryResult(null);
    
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Mock query result
      const mockResult: QueryResult = {
        fields: [
          { name: 'CompanyName', type: 'Text', size: 40 },
          { name: 'OrderID', type: 'AutoNumber', size: 4 },
          { name: 'OrderDate', type: 'Date/Time', size: 8 },
          { name: 'Freight', type: 'Currency', size: 8 }
        ],
        records: [
          { CompanyName: 'Alfreds Futterkiste', OrderID: 10643, OrderDate: new Date('1997-08-25'), Freight: 29.46 },
          { CompanyName: 'Alfreds Futterkiste', OrderID: 10692, OrderDate: new Date('1997-10-03'), Freight: 61.02 },
          { CompanyName: 'Ana Trujillo Emparedados y helados', OrderID: 10308, OrderDate: new Date('1996-09-18'), Freight: 1.61 }
        ],
        recordCount: 3,
        executionTime: 45,
        error: sql.toLowerCase().includes('error') ? 'Invalid SQL syntax' : undefined
      };
      
      setQueryResult(mockResult);
      onQueryExecute?.(sql, mockResult);
      eventEmitter.current.emit('queryExecuted', { sql, result: mockResult });
    } catch (error) {
      setQueryResult({
        fields: [],
        records: [],
        recordCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [onQueryExecute]);

  // Filter and sort table data
  const processedTableData = useMemo(() => {
    if (!tableData) return [];
    
    let filtered = tableData;
    
    // Apply filter
    if (filter) {
      const filterLower = filter.toLowerCase();
      filtered = tableData.filter(record =>
        Object.values(record).some(value =>
          value && value.toString().toLowerCase().includes(filterLower)
        )
      );
    }
    
    // Apply sort
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = Number(aVal) - Number(bVal);
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }, [tableData, filter, sortField, sortDirection]);

  // Handle table selection
  const handleTableSelect = useCallback((table: DatabaseTable) => {
    setSelectedTable(table);
    setSelectedQuery(null);
    setCurrentPage(1);
    loadTableData(table, 1);
    setActiveTab('data');
  }, [loadTableData]);

  // Handle query selection
  const handleQuerySelect = useCallback((query: DatabaseQuery) => {
    setSelectedQuery(query);
    setSelectedTable(null);
    setSqlQuery(query.sql);
    setActiveTab('sql');
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (selectedTable) {
      loadTableData(selectedTable, page);
    }
  }, [selectedTable, loadTableData]);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Get total pages
  const totalPages = selectedTable ? Math.ceil(selectedTable.recordCount / pageSize) : 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Menu Bar */}
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <button
              onClick={() => setShowConnectionDialog(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Open Database
            </button>
            <button
              onClick={() => currentSchema && setCurrentSchema(null)}
              disabled={!currentSchema}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Close Database
            </button>
          </div>
          
          {currentSchema && (
            <div className="flex gap-1">
              <button
                onClick={() => setShowTableDesigner(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                New Table
              </button>
              <button
                onClick={() => setShowQueryDesigner(true)}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                New Query
              </button>
              <button
                onClick={() => {/* Compact database */}}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Compact
              </button>
              <button
                onClick={() => {/* Repair database */}}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Repair
              </button>
            </div>
          )}
          
          <div className="flex-1"></div>
          
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>

      {currentSchema ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Database Objects */}
          <div className="w-1/4 border-r border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-700">Database: {currentSchema.connection.name}</h3>
              <p className="text-xs text-gray-600">{currentSchema.connection.type}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {/* Tables */}
              <div className="mb-4">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm font-medium text-gray-700">📋 Tables ({currentSchema.tables.length})</span>
                </div>
                <div className="space-y-1">
                  {currentSchema.tables.map(table => (
                    <div
                      key={table.name}
                      onClick={() => handleTableSelect(table)}
                      className={`p-2 text-sm cursor-pointer rounded hover:bg-gray-100 ${
                        selectedTable?.name === table.name ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium">{table.name}</div>
                      <div className="text-xs text-gray-600">{table.recordCount} records</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Queries */}
              <div className="mb-4">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm font-medium text-gray-700">🔍 Queries ({currentSchema.queries.length})</span>
                </div>
                <div className="space-y-1">
                  {currentSchema.queries.map(query => (
                    <div
                      key={query.name}
                      onClick={() => handleQuerySelect(query)}
                      className={`p-2 text-sm cursor-pointer rounded hover:bg-gray-100 ${
                        selectedQuery?.name === query.name ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium">{query.name}</div>
                      <div className="text-xs text-gray-600">{query.type}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Relationships */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm font-medium text-gray-700">🔗 Relationships ({currentSchema.relationships.length})</span>
                </div>
                <div className="space-y-1">
                  {currentSchema.relationships.map(rel => (
                    <div key={rel.name} className="p-2 text-sm rounded hover:bg-gray-100">
                      <div className="font-medium">{rel.name}</div>
                      <div className="text-xs text-gray-600">{rel.table} → {rel.foreignTable}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              {['tables', 'queries', 'relationships', 'data', 'sql'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'tables' && (
                <div className="p-4 overflow-y-auto">
                  {selectedTable ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Table: {selectedTable.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowTableDesigner(true)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Design
                          </button>
                          <button
                            onClick={() => handleTableSelect(selectedTable)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            View Data
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        {/* Fields */}
                        <div>
                          <h4 className="font-medium mb-2">Fields ({selectedTable.fields.length})</h4>
                          <div className="border border-gray-200 rounded">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-sm font-medium">
                              <div className="grid grid-cols-3 gap-2">
                                <span>Name</span>
                                <span>Type</span>
                                <span>Size</span>
                              </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {selectedTable.fields.map((field, index) => (
                                <div key={index} className="px-3 py-2 border-b border-gray-200 text-sm hover:bg-gray-50">
                                  <div className="grid grid-cols-3 gap-2">
                                    <span className="font-medium">{field.name}</span>
                                    <span>{field.dataType}</span>
                                    <span>{field.size}</span>
                                  </div>
                                  {field.description && (
                                    <div className="text-xs text-gray-600 mt-1">{field.description}</div>
                                  )}
                                  <div className="flex gap-1 mt-1">
                                    {field.required && <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Required</span>}
                                    {field.indexed && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Indexed</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Indexes */}
                        <div>
                          <h4 className="font-medium mb-2">Indexes ({selectedTable.indexes.length})</h4>
                          <div className="border border-gray-200 rounded">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-sm font-medium">
                              Index Properties
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {selectedTable.indexes.map((index, i) => (
                                <div key={i} className="p-3 border-b border-gray-200 hover:bg-gray-50">
                                  <div className="font-medium text-sm">{index.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Fields: {index.fields.join(', ')}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {index.primary && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Primary</span>}
                                    {index.unique && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Unique</span>}
                                    {index.foreign && <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Foreign</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Table Properties */}
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Properties</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div><strong>Record Count:</strong> {selectedTable.recordCount}</div>
                            <div><strong>Type:</strong> {selectedTable.type}</div>
                            {selectedTable.dateCreated && (
                              <div><strong>Created:</strong> {selectedTable.dateCreated.toLocaleDateString()}</div>
                            )}
                            {selectedTable.lastUpdated && (
                              <div><strong>Modified:</strong> {selectedTable.lastUpdated.toLocaleDateString()}</div>
                            )}
                          </div>
                          {selectedTable.description && (
                            <div className="mt-2"><strong>Description:</strong> {selectedTable.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📋</div>
                      <p>Select a table to view its structure</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'data' && (
                <div className="flex flex-col h-full">
                  {selectedTable && tableData ? (
                    <>
                      {/* Data Controls */}
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h3 className="font-medium">{selectedTable.name} Data</h3>
                            <input
                              type="text"
                              placeholder="Filter records..."
                              value={filter}
                              onChange={(e) => setFilter(e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, selectedTable.recordCount)} of {selectedTable.recordCount}
                            </span>
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 text-sm"
                            >
                              ←
                            </button>
                            <span className="text-sm">{currentPage} / {totalPages}</span>
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= totalPages}
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 text-sm"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Data Table */}
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {selectedTable.fields.map(field => (
                                <th
                                  key={field.name}
                                  onClick={() => handleSort(field.name)}
                                  className="px-3 py-2 text-left border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                                >
                                  <div className="flex items-center gap-1">
                                    <span>{field.name}</span>
                                    {sortField === field.name && (
                                      <span className="text-blue-600">
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {processedTableData.map((record, index) => (
                              <tr key={index} className="hover:bg-gray-50 border-b border-gray-200">
                                {selectedTable.fields.map(field => (
                                  <td key={field.name} className="px-3 py-2">
                                    {record[field.name] === null ? (
                                      <span className="text-gray-400 italic">null</span>
                                    ) : field.dataType === FieldDataType.DateTime ? (
                                      record[field.name] instanceof Date 
                                        ? record[field.name].toLocaleDateString()
                                        : record[field.name]
                                    ) : field.dataType === FieldDataType.Currency ? (
                                      typeof record[field.name] === 'number'
                                        ? `$${record[field.name].toFixed(2)}`
                                        : record[field.name]
                                    ) : (
                                      record[field.name] ? Object.prototype.toString.call(record[field.name]) : ''
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📊</div>
                      <p>Select a table to view its data</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'sql' && (
                <div className="flex flex-col h-full">
                  {/* SQL Editor */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">SQL Query</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeQuery(sqlQuery)}
                          disabled={isExecuting || !sqlQuery.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isExecuting ? 'Executing...' : 'Execute'}
                        </button>
                        <button
                          onClick={() => setSqlQuery('')}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded font-mono text-sm resize-none"
                      placeholder="Enter your SQL query here..."
                    />
                  </div>
                  
                  {/* Query Results */}
                  <div className="flex-1 overflow-auto p-4">
                    {queryResult ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Query Results</h4>
                          <div className="text-sm text-gray-600">
                            {queryResult.error ? (
                              <span className="text-red-600">Error</span>
                            ) : (
                              <span>{queryResult.recordCount} records in {queryResult.executionTime}ms</span>
                            )}
                          </div>
                        </div>
                        
                        {queryResult.error ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                            {queryResult.error}
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded overflow-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  {queryResult.fields.map(field => (
                                    <th key={field.name} className="px-3 py-2 text-left border-b border-gray-200">
                                      {field.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.records.map((record, index) => (
                                  <tr key={index} className="hover:bg-gray-50 border-b border-gray-200">
                                    {queryResult.fields.map(field => (
                                      <td key={field.name} className="px-3 py-2">
                                        {record[field.name] === null ? (
                                          <span className="text-gray-400 italic">null</span>
                                        ) : (
                                          record[field.name] ? Object.prototype.toString.call(record[field.name]) : ''
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">🔍</div>
                        <p>Enter a SQL query and click Execute to see results</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'relationships' && (
                <div className="p-4 overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">Relationships</h3>
                  <div className="space-y-4">
                    {currentSchema.relationships.map(rel => (
                      <div key={rel.name} className="border border-gray-200 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{rel.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {rel.type}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700">Parent Table</div>
                            <div>{rel.table}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">Child Table</div>
                            <div>{rel.foreignTable}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="font-medium text-gray-700 text-sm mb-1">Field Relationships</div>
                          {rel.fields.map((field, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {field.name} → {field.foreignName}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 flex gap-4 text-xs">
                          {rel.enforceReferentialIntegrity && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              Referential Integrity
                            </span>
                          )}
                          {rel.cascadeUpdates && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Cascade Updates
                            </span>
                          )}
                          {rel.cascadeDeletes && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              Cascade Deletes
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {currentSchema.relationships.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">🔗</div>
                        <p>No relationships defined</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'queries' && (
                <div className="p-4 overflow-y-auto">
                  {selectedQuery ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Query: {selectedQuery.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSqlQuery(selectedQuery.sql)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Edit SQL
                          </button>
                          <button
                            onClick={() => executeQuery(selectedQuery.sql)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Run Query
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Properties</h4>
                          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div><strong>Type:</strong> {selectedQuery.type}</div>
                              <div><strong>Returns Records:</strong> {selectedQuery.returnsRecords ? 'Yes' : 'No'}</div>
                            </div>
                            {selectedQuery.description && (
                              <div className="mt-2"><strong>Description:</strong> {selectedQuery.description}</div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">SQL Statement</h4>
                          <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-sm font-mono overflow-x-auto">
                            {selectedQuery.sql}
                          </pre>
                        </div>
                        
                        {selectedQuery.parameters.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Parameters</h4>
                            <div className="border border-gray-200 rounded">
                              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-sm font-medium">
                                <div className="grid grid-cols-3 gap-2">
                                  <span>Name</span>
                                  <span>Type</span>
                                  <span>Value</span>
                                </div>
                              </div>
                              {selectedQuery.parameters.map((param, index) => (
                                <div key={index} className="px-3 py-2 border-b border-gray-200 text-sm">
                                  <div className="grid grid-cols-3 gap-2">
                                    <span className="font-medium">{param.name}</span>
                                    <span>{param.dataType}</span>
                                    <span>{param.value || '(not set)'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">🔍</div>
                      <p>Select a query to view its details</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
          <div>
            <div className="text-6xl mb-4">🗃️</div>
            <h2 className="text-xl font-medium mb-2">Visual Data Manager</h2>
            <p className="text-sm mb-4">Open a database to get started</p>
            <button
              onClick={() => setShowConnectionDialog(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Open Database
            </button>
          </div>
        </div>
      )}

      {/* Connection Dialog */}
      {showConnectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-bold mb-4">Open Database</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded">
                  {Object.values(DatabaseType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database File</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    placeholder="Select database file..."
                  />
                  <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                    Browse...
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowConnectionDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCurrentSchema(sampleSchema);
                  setShowConnectionDialog(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>
            {currentSchema ? (
              `Database: ${currentSchema.connection.name} | Tables: ${currentSchema.tables.length} | Queries: ${currentSchema.queries.length}`
            ) : (
              'No database open'
            )}
            {isModified && ' • Modified'}
          </span>
          <span>Visual Data Manager v6.0</span>
        </div>
      </div>
    </div>
  );
};

export default VisualDataManager;