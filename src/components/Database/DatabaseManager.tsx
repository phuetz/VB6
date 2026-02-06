import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Plus,
  Trash2,
  Edit,
  Play,
  Table,
  Settings,
  Download,
  Upload,
} from 'lucide-react';
import {
  vb6DatabaseService,
  ADOConnection,
  ADORecordset,
  ConnectionState,
} from '../../services/VB6DatabaseService';
import DatabaseConnectionDialog from '../Dialogs/DatabaseConnectionDialog';
import DatabaseQueryBuilder from './DatabaseQueryBuilder';

interface DatabaseConnection {
  id: string;
  name: string;
  connectionString: string;
  connection: ADOConnection;
  isConnected: boolean;
  lastUsed: Date;
}

interface QueryHistory {
  id: string;
  sql: string;
  executedAt: Date;
  results: number;
  duration: number;
}

interface DatabaseManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ visible, onClose }) => {
  const [connections, setConnections] = useState<Map<string, DatabaseConnection>>(new Map());
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'tables' | 'queries' | 'history'>(
    'connections'
  );
  const [editingConnection, setEditingConnection] = useState<string | null>(null);
  const [quickQuery, setQuickQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load connections from the database service when component mounts
  useEffect(() => {
    if (visible) {
      loadConnections();
      loadQueryHistory();
    }
  }, [visible]);

  // Load available tables when selected connection changes
  useEffect(() => {
    if (selectedConnection) {
      loadTablesForConnection(selectedConnection);
    }
  }, [selectedConnection]);

  const loadConnections = () => {
    const serviceConnections = vb6DatabaseService.getAllConnections();
    const connectionMap = new Map<string, DatabaseConnection>();

    serviceConnections.forEach((conn, name) => {
      connectionMap.set(name, {
        id: name,
        name: name,
        connectionString: conn.ConnectionString,
        connection: conn,
        isConnected: conn.State === ConnectionState.Open,
        lastUsed: new Date(),
      });
    });

    setConnections(connectionMap);
  };

  const loadTablesForConnection = (connectionId: string) => {
    try {
      const tables = vb6DatabaseService.getAvailableTables();
      setAvailableTables(tables);
    } catch (err: any) {
      setError(`Failed to load tables: ${err.message}`);
    }
  };

  const loadQueryHistory = () => {
    // In a real implementation, this would load from persistent storage
    const history: QueryHistory[] = [
      {
        id: '1',
        sql: "SELECT * FROM Customers WHERE Country = 'Germany'",
        executedAt: new Date(Date.now() - 86400000),
        results: 11,
        duration: 45,
      },
      {
        id: '2',
        sql: 'SELECT ProductName, UnitPrice FROM Products ORDER BY UnitPrice DESC',
        executedAt: new Date(Date.now() - 3600000),
        results: 77,
        duration: 23,
      },
    ];
    setQueryHistory(history);
  };

  const handleConnectionCreated = (connection: ADOConnection, connectionString: string) => {
    const connectionId = `conn_${Date.now()}`;
    const newConnection: DatabaseConnection = {
      id: connectionId,
      name: `Connection ${connections.size + 1}`,
      connectionString,
      connection,
      isConnected: connection.State === ConnectionState.Open,
      lastUsed: new Date(),
    };

    const updatedConnections = new Map(connections);
    updatedConnections.set(connectionId, newConnection);
    setConnections(updatedConnections);

    if (!selectedConnection) {
      setSelectedConnection(connectionId);
    }

    setShowConnectionDialog(false);
  };

  const deleteConnection = async (connectionId: string) => {
    const connection = connections.get(connectionId);
    if (connection) {
      if (connection.isConnected) {
        await connection.connection.Close();
      }

      const updatedConnections = new Map(connections);
      updatedConnections.delete(connectionId);
      setConnections(updatedConnections);

      if (selectedConnection === connectionId) {
        setSelectedConnection(null);
        setAvailableTables([]);
      }

      vb6DatabaseService.removeConnection(connectionId);
    }
  };

  const toggleConnection = async (connectionId: string) => {
    const connection = connections.get(connectionId);
    if (!connection) return;

    try {
      if (connection.isConnected) {
        await connection.connection.Close();
      } else {
        await connection.connection.Open();
      }

      const updatedConnections = new Map(connections);
      updatedConnections.set(connectionId, {
        ...connection,
        isConnected: connection.connection.State === ConnectionState.Open,
        lastUsed: new Date(),
      });
      setConnections(updatedConnections);
    } catch (err: any) {
      setError(`Connection failed: ${err.message}`);
    }
  };

  const executeQuickQuery = async () => {
    if (!quickQuery.trim() || !selectedConnection) return;

    const connection = connections.get(selectedConnection);
    if (!connection || !connection.isConnected) {
      setError('No active connection selected');
      return;
    }

    setIsExecutingQuery(true);
    setError(null);
    const startTime = Date.now();

    try {
      const recordset = await connection.connection.Execute(quickQuery);
      const results = recordset.GetRows();
      const duration = Date.now() - startTime;

      setQueryResults(results);

      // Add to query history
      const historyEntry: QueryHistory = {
        id: Date.now().toString(),
        sql: quickQuery,
        executedAt: new Date(),
        results: results.length,
        duration,
      };
      setQueryHistory([historyEntry, ...queryHistory]);
    } catch (err: any) {
      setError(`Query execution failed: ${err.message}`);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const exportConnectionString = (connectionId: string) => {
    const connection = connections.get(connectionId);
    if (connection) {
      const blob = new Blob([connection.connectionString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${connection.name}_connection.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const renderConnectionsTab = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Database Connections</h3>
        <button
          onClick={() => setShowConnectionDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={16} />
          New Connection
        </button>
      </div>

      <div className="space-y-3">
        {Array.from(connections.values()).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database size={48} className="mx-auto mb-4 opacity-20" />
            <p>No database connections configured</p>
            <button
              onClick={() => setShowConnectionDialog(true)}
              className="mt-2 text-blue-500 hover:text-blue-700"
            >
              Create your first connection
            </button>
          </div>
        ) : (
          Array.from(connections.values()).map(conn => (
            <div
              key={conn.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                selectedConnection === conn.id ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      conn.isConnected ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{conn.name}</h4>
                    <p className="text-sm text-gray-600 font-mono truncate max-w-md">
                      {conn.connectionString}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last used: {conn.lastUsed.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedConnection(conn.id)}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedConnection === conn.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Select
                  </button>
                  <button
                    onClick={() => toggleConnection(conn.id)}
                    className={`px-3 py-1 text-sm rounded ${
                      conn.isConnected
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {conn.isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                  <button
                    onClick={() => exportConnectionString(conn.id)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Export connection string"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => deleteConnection(conn.id)}
                    className="p-2 text-gray-500 hover:text-red-500"
                    title="Delete connection"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTablesTab = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Database Tables</h3>
        {selectedConnection && (
          <span className="text-sm text-gray-600">
            Connection: {connections.get(selectedConnection)?.name}
          </span>
        )}
      </div>

      {!selectedConnection ? (
        <div className="text-center py-8 text-gray-500">
          <Table size={48} className="mx-auto mb-4 opacity-20" />
          <p>Select a connection to view tables</p>
        </div>
      ) : availableTables.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Table size={48} className="mx-auto mb-4 opacity-20" />
          <p>No tables found in the selected database</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTables.map(table => {
            const schema = vb6DatabaseService.getTableSchema(table);
            const fieldCount = Object.keys(schema).length;

            return (
              <div key={table} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Table size={16} />
                    {table}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {Object.entries(schema)
                    .slice(0, 5)
                    .map(([field, type]) => (
                      <div key={field} className="flex justify-between text-xs">
                        <span className="font-mono text-gray-700">{field}</span>
                        <span className="text-gray-500">{type}</span>
                      </div>
                    ))}
                  {fieldCount > 5 && (
                    <div className="text-xs text-gray-500">
                      ... and {fieldCount - 5} more fields
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setQuickQuery(`SELECT * FROM ${table} LIMIT 10`)}
                  className="mt-3 w-full px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Quick Query
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderQueriesTab = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Query Interface</h3>
        <button
          onClick={() => setShowQueryBuilder(true)}
          disabled={!selectedConnection}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          <Settings size={16} />
          Query Builder
        </button>
      </div>

      {!selectedConnection ? (
        <div className="text-center py-8 text-gray-500">
          <Play size={48} className="mx-auto mb-4 opacity-20" />
          <p>Select a connection to execute queries</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Query</label>
            <div className="flex gap-2">
              <textarea
                value={quickQuery}
                onChange={e => setQuickQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                rows={3}
                placeholder="Enter your SQL query here..."
              />
              <button
                onClick={executeQuickQuery}
                disabled={isExecutingQuery || !quickQuery.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isExecutingQuery ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Play size={16} />
                )}
              </button>
            </div>
          </div>

          {queryResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Query Results ({queryResults.length} rows)
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-60 overflow-auto">
                <pre className="text-xs font-mono text-gray-700">
                  {JSON.stringify(queryResults.slice(0, 10), null, 2)}
                  {queryResults.length > 10 &&
                    '\n... and ' + (queryResults.length - 10) + ' more rows'}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Query History</h3>

      {queryHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Play size={48} className="mx-auto mb-4 opacity-20" />
          <p>No queries executed yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queryHistory.map(query => (
            <div key={query.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <pre className="text-sm font-mono text-gray-800 mb-2 whitespace-pre-wrap">
                    {query.sql}
                  </pre>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Executed: {query.executedAt.toLocaleString()}</span>
                    <span>Results: {query.results} rows</span>
                    <span>Duration: {query.duration}ms</span>
                  </div>
                </div>
                <button
                  onClick={() => setQuickQuery(query.sql)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  title="Load query"
                >
                  Load
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg shadow-2xl w-[1000px] h-[700px] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="text-blue-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Database Manager</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'connections', label: 'Connections', icon: Database },
                { id: 'tables', label: 'Tables', icon: Table },
                { id: 'queries', label: 'Queries', icon: Play },
                { id: 'history', label: 'History', icon: Settings },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'connections' && renderConnectionsTab()}
            {activeTab === 'tables' && renderTablesTab()}
            {activeTab === 'queries' && renderQueriesTab()}
            {activeTab === 'history' && renderHistoryTab()}
          </div>

          {/* Error Display */}
          {error && (
            <div className="border-t border-gray-200 bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Dialog */}
      <DatabaseConnectionDialog
        visible={showConnectionDialog}
        onClose={() => setShowConnectionDialog(false)}
        onConnectionCreated={handleConnectionCreated}
      />

      {/* Query Builder */}
      <DatabaseQueryBuilder
        visible={showQueryBuilder}
        onClose={() => setShowQueryBuilder(false)}
        connection={
          selectedConnection ? connections.get(selectedConnection)?.connection : undefined
        }
        onQueryResult={(sql, results) => {
          setQuickQuery(sql);
          setQueryResults(results);
          setShowQueryBuilder(false);

          // Add to history
          const historyEntry: QueryHistory = {
            id: Date.now().toString(),
            sql,
            executedAt: new Date(),
            results: results.length,
            duration: 0,
          };
          setQueryHistory([historyEntry, ...queryHistory]);
        }}
      />
    </>
  );
};

export default DatabaseManager;
