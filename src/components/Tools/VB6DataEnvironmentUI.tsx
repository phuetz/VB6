/**
 * VB6 Data Environment Designer UI - Complete Visual Database Design Interface
 * Provides comprehensive UI for the VB6 Data Environment system with visual connection management,
 * query design, relation builder, and complete database development tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  VB6DataEnvironmentInstance,
  DataEnvironment,
  DataConnection,
  DataCommand,
  DataRelation,
  DataConnectionType,
  DataCommandType,
  DataRelationType,
  ParameterDirection,
  DataFieldType,
  DataParameter,
  DataField
} from '../../services/VB6DataEnvironment';

interface DataEnvironmentUIProps {
  onClose?: () => void;
}

export const VB6DataEnvironmentUI: React.FC<DataEnvironmentUIProps> = ({ onClose }) => {
  // State management
  const [activeTab, setActiveTab] = useState<'environments' | 'connections' | 'commands' | 'relations' | 'query-designer' | 'data-view'>('environments');
  const [environments, setEnvironments] = useState<DataEnvironment[]>([]);
  const [currentEnvironment, setCurrentEnvironment] = useState<DataEnvironment | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<DataConnection | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<DataCommand | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<DataRelation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Form states for creating/editing
  const [showNewEnvironmentForm, setShowNewEnvironmentForm] = useState(false);
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  const [showNewCommandForm, setShowNewCommandForm] = useState(false);
  const [showNewRelationForm, setShowNewRelationForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DataConnection | null>(null);
  const [editingCommand, setEditingCommand] = useState<DataCommand | null>(null);

  // Form data
  const [newEnvironmentData, setNewEnvironmentData] = useState({
    name: '', 
    description: '', 
    author: ''
  });
  const [newConnectionData, setNewConnectionData] = useState({
    name: '',
    displayName: '',
    type: DataConnectionType.OLEDB,
    provider: 'Microsoft.Jet.OLEDB.4.0',
    dataSource: '',
    integratedSecurity: false,
    userId: '',
    password: '',
    connectionTimeout: 15,
    commandTimeout: 30
  });
  const [newCommandData, setNewCommandData] = useState({
    name: '',
    displayName: '',
    type: DataCommandType.SQL_STATEMENT,
    commandText: 'SELECT * FROM ',
    prepared: false
  });
  const [newRelationData, setNewRelationData] = useState({
    name: '',
    type: DataRelationType.ONE_TO_MANY,
    parentCommandId: '',
    childCommandId: '',
    parentFields: [''],
    childFields: [''],
    cascadeUpdate: true,
    cascadeDelete: false
  });

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setEnvironments(VB6DataEnvironmentInstance.getAllEnvironments());
    setCurrentEnvironment(VB6DataEnvironmentInstance.getCurrentEnvironment());
    setConnections(VB6DataEnvironmentInstance.getAllConnections());
  }, []);

  // Environment Management
  const handleCreateEnvironment = async () => {
    try {
      setLoading(true);
      const environment = VB6DataEnvironmentInstance.createEnvironment(
        newEnvironmentData.name,
        newEnvironmentData.description,
        newEnvironmentData.author
      );
      
      setShowNewEnvironmentForm(false);
      setNewEnvironmentData({ name: '', description: '', author: '' });
      refreshData();
    } catch (err) {
      setError(`Failed to create environment: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnvironment = (environmentId: string) => {
    VB6DataEnvironmentInstance.openEnvironment(environmentId);
    refreshData();
  };

  const handleSaveEnvironment = () => {
    VB6DataEnvironmentInstance.saveEnvironment();
    refreshData();
  };

  // Connection Management
  const handleCreateConnection = async () => {
    try {
      setLoading(true);
      const connectionString = VB6DataEnvironmentInstance.generateConnectionString(newConnectionData);
      
      const connection = VB6DataEnvironmentInstance.addConnection({
        ...newConnectionData,
        persistSecurityInfo: false,
        cursorLocation: 'client',
        lockType: 'optimistic',
        state: 'closed',
        connectionString
      });
      
      setShowNewConnectionForm(false);
      setNewConnectionData({
        name: '',
        displayName: '',
        type: DataConnectionType.OLEDB,
        provider: 'Microsoft.Jet.OLEDB.4.0',
        dataSource: '',
        integratedSecurity: false,
        userId: '',
        password: '',
        connectionTimeout: 15,
        commandTimeout: 30
      });
      refreshData();
    } catch (err) {
      setError(`Failed to create connection: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      setLoading(true);
      const success = await VB6DataEnvironmentInstance.testConnection(connectionId);
      alert(success ? 'Connection test successful!' : 'Connection test failed!');
    } catch (err) {
      setError(`Connection test failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConnection = async (connectionId: string) => {
    try {
      setLoading(true);
      await VB6DataEnvironmentInstance.openConnection(connectionId);
      refreshData();
    } catch (err) {
      setError(`Failed to open connection: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Command Management
  const handleCreateCommand = async () => {
    try {
      if (!selectedConnection) {
        setError('Please select a connection first');
        return;
      }

      setLoading(true);
      const command = VB6DataEnvironmentInstance.addCommand(selectedConnection.id, {
        ...newCommandData,
        parameters: [],
        cursorType: 'forward_only',
        lockType: 'readonly',
        fields: []
      });
      
      setShowNewCommandForm(false);
      setNewCommandData({
        name: '',
        displayName: '',
        type: DataCommandType.SQL_STATEMENT,
        commandText: 'SELECT * FROM ',
        prepared: false
      });
      refreshData();
    } catch (err) {
      setError(`Failed to create command: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = async (connectionId: string, commandId: string) => {
    try {
      setIsExecuting(true);
      const result = await VB6DataEnvironmentInstance.executeCommand(connectionId, commandId);
      setQueryResult(result);
      setActiveTab('data-view');
    } catch (err) {
      setError(`Failed to execute command: ${err}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleValidateSQL = (sql: string) => {
    const validation = VB6DataEnvironmentInstance.validateSQL(sql);
    if (!validation.valid) {
      alert(`SQL Validation Errors:\n${validation.errors.join('\n')}`);
    } else {
      alert('SQL is valid!');
    }
  };

  // Relation Management
  const handleCreateRelation = async () => {
    try {
      setLoading(true);
      VB6DataEnvironmentInstance.addRelation({
        ...newRelationData,
        enforceConstraints: true
      });
      
      setShowNewRelationForm(false);
      setNewRelationData({
        name: '',
        type: DataRelationType.ONE_TO_MANY,
        parentCommandId: '',
        childCommandId: '',
        parentFields: [''],
        childFields: [''],
        cascadeUpdate: true,
        cascadeDelete: false
      });
      refreshData();
    } catch (err) {
      setError(`Failed to create relation: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Get all commands for relation dropdowns
  const getAllCommands = (): DataCommand[] => {
    const allCommands: DataCommand[] = [];
    for (const connection of connections) {
      allCommands.push(...connection.commands);
    }
    return allCommands;
  };

  // Render functions
  const renderEnvironmentsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data Environments</h3>
        <button
          onClick={() => setShowNewEnvironmentForm(true)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          New Environment
        </button>
      </div>

      {/* Environment List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Connections</th>
              <th className="px-4 py-2 text-left">Modified</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {environments.map((env) => (
              <tr key={env.id} className={env.id === currentEnvironment?.id ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 font-medium">{env.name}</td>
                <td className="px-4 py-2">{env.description}</td>
                <td className="px-4 py-2">{env.connections.size}</td>
                <td className="px-4 py-2">{env.modified.toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEnvironment(env.id)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      disabled={env.id === currentEnvironment?.id}
                    >
                      {env.id === currentEnvironment?.id ? 'Current' : 'Open'}
                    </button>
                    <button
                      onClick={handleSaveEnvironment}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Environment Form */}
      {showNewEnvironmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Environment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  value={newEnvironmentData.name}
                  onChange={(e) => setNewEnvironmentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Environment name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description:</label>
                <textarea
                  value={newEnvironmentData.description}
                  onChange={(e) => setNewEnvironmentData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Environment description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author:</label>
                <input
                  type="text"
                  value={newEnvironmentData.author}
                  onChange={(e) => setNewEnvironmentData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Author name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewEnvironmentForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEnvironment}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newEnvironmentData.name || loading}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConnectionsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Database Connections</h3>
        <button
          onClick={() => setShowNewConnectionForm(true)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!currentEnvironment || loading}
        >
          New Connection
        </button>
      </div>

      {/* Connection List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Data Source</th>
              <th className="px-4 py-2 text-left">State</th>
              <th className="px-4 py-2 text-left">Commands</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((conn) => (
              <tr key={conn.id} className={selectedConnection?.id === conn.id ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 font-medium">{conn.name}</td>
                <td className="px-4 py-2">{conn.type.toUpperCase()}</td>
                <td className="px-4 py-2 truncate" title={conn.dataSource}>{conn.dataSource}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    conn.state === 'open' ? 'bg-green-100 text-green-800' :
                    conn.state === 'closed' ? 'bg-gray-100 text-gray-800' :
                    conn.state === 'broken' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {conn.state}
                  </span>
                </td>
                <td className="px-4 py-2">{conn.commands.length}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedConnection(conn)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => handleTestConnection(conn.id)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                      disabled={loading}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleOpenConnection(conn.id)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      disabled={conn.state === 'open' || loading}
                    >
                      Open
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Connection Details */}
      {selectedConnection && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Connection: {selectedConnection.displayName}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Provider:</strong> {selectedConnection.provider}</div>
            <div><strong>Connection Timeout:</strong> {selectedConnection.connectionTimeout}s</div>
            <div><strong>Command Timeout:</strong> {selectedConnection.commandTimeout}s</div>
            <div><strong>Cursor Location:</strong> {selectedConnection.cursorLocation}</div>
            <div><strong>Last Used:</strong> {selectedConnection.lastUsed?.toLocaleString() || 'Never'}</div>
            <div><strong>Created:</strong> {selectedConnection.created.toLocaleString()}</div>
          </div>
          {selectedConnection.lastError && (
            <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-sm">
              <strong>Last Error:</strong> {selectedConnection.lastError}
            </div>
          )}
        </div>
      )}

      {/* New Connection Form */}
      {showNewConnectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Connection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  value={newConnectionData.name}
                  onChange={(e) => setNewConnectionData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Connection name (e.g., cnNorthwind)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name:</label>
                <input
                  type="text"
                  value={newConnectionData.displayName}
                  onChange={(e) => setNewConnectionData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Connection Type:</label>
                <select
                  value={newConnectionData.type}
                  onChange={(e) => setNewConnectionData(prev => ({ ...prev, type: e.target.value as DataConnectionType }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {Object.values(DataConnectionType).map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provider:</label>
                <select
                  value={newConnectionData.provider}
                  onChange={(e) => setNewConnectionData(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Microsoft.Jet.OLEDB.4.0">Microsoft Jet OLEDB 4.0</option>
                  <option value="SQLOLEDB">SQL Server OLEDB</option>
                  <option value="Microsoft.ACE.OLEDB.12.0">Microsoft ACE OLEDB 12.0</option>
                  <option value="MSDASQL">Microsoft ODBC for OLEDB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Source:</label>
                <input
                  type="text"
                  value={newConnectionData.dataSource}
                  onChange={(e) => setNewConnectionData(prev => ({ ...prev, dataSource: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Server name or file path"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="integratedSecurity"
                  checked={newConnectionData.integratedSecurity}
                  onChange={(e) => setNewConnectionData(prev => ({ ...prev, integratedSecurity: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="integratedSecurity" className="text-sm">Use Integrated Security</label>
              </div>
              {!newConnectionData.integratedSecurity && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">User ID:</label>
                    <input
                      type="text"
                      value={newConnectionData.userId}
                      onChange={(e) => setNewConnectionData(prev => ({ ...prev, userId: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password:</label>
                    <input
                      type="password"
                      value={newConnectionData.password}
                      onChange={(e) => setNewConnectionData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Connection Timeout:</label>
                  <input
                    type="number"
                    value={newConnectionData.connectionTimeout}
                    onChange={(e) => setNewConnectionData(prev => ({ ...prev, connectionTimeout: parseInt(e.target.value) || 15 }))}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Command Timeout:</label>
                  <input
                    type="number"
                    value={newConnectionData.commandTimeout}
                    onChange={(e) => setNewConnectionData(prev => ({ ...prev, commandTimeout: parseInt(e.target.value) || 30 }))}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewConnectionForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newConnectionData.name || !newConnectionData.dataSource || loading}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCommandsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data Commands</h3>
        <button
          onClick={() => setShowNewCommandForm(true)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!selectedConnection || loading}
        >
          New Command
        </button>
      </div>

      {!selectedConnection && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
          Please select a connection first to view and manage commands.
        </div>
      )}

      {selectedConnection && (
        <>
          <div className="text-sm text-gray-600 mb-4">
            Connection: <strong>{selectedConnection.name}</strong> ({selectedConnection.commands.length} commands)
          </div>

          {/* Commands List */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Command Text</th>
                  <th className="px-4 py-2 text-left">Parameters</th>
                  <th className="px-4 py-2 text-left">Records</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedConnection.commands.map((cmd) => (
                  <tr key={cmd.id} className={selectedCommand?.id === cmd.id ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 font-medium">{cmd.name}</td>
                    <td className="px-4 py-2">{cmd.type.replace('_', ' ').toUpperCase()}</td>
                    <td className="px-4 py-2 truncate max-w-xs" title={cmd.commandText}>
                      {cmd.commandText}
                    </td>
                    <td className="px-4 py-2">{cmd.parameters.length}</td>
                    <td className="px-4 py-2">{cmd.recordCount || 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedCommand(cmd)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleExecuteCommand(selectedConnection.id, cmd.id)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          disabled={isExecuting}
                        >
                          {isExecuting ? 'Running...' : 'Execute'}
                        </button>
                        <button
                          onClick={() => handleValidateSQL(cmd.commandText)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                        >
                          Validate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Command Details */}
          {selectedCommand && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Command: {selectedCommand.displayName}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><strong>Type:</strong> {selectedCommand.type.replace('_', ' ').toUpperCase()}</div>
                <div><strong>Cursor Type:</strong> {selectedCommand.cursorType.replace('_', ' ')}</div>
                <div><strong>Lock Type:</strong> {selectedCommand.lockType.replace('_', ' ')}</div>
                <div><strong>Prepared:</strong> {selectedCommand.prepared ? 'Yes' : 'No'}</div>
                <div><strong>Last Executed:</strong> {selectedCommand.lastExecuted?.toLocaleString() || 'Never'}</div>
                <div><strong>Record Count:</strong> {selectedCommand.recordCount || 0}</div>
              </div>
              
              <div className="mb-4">
                <strong>Command Text:</strong>
                <pre className="mt-1 p-2 bg-white border rounded text-sm font-mono whitespace-pre-wrap">
                  {selectedCommand.commandText}
                </pre>
              </div>

              {selectedCommand.parameters.length > 0 && (
                <div>
                  <strong>Parameters:</strong>
                  <div className="mt-1 border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">Type</th>
                          <th className="px-2 py-1 text-left">Direction</th>
                          <th className="px-2 py-1 text-left">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCommand.parameters.map((param, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-1">{param.name}</td>
                            <td className="px-2 py-1">{param.type}</td>
                            <td className="px-2 py-1">{param.direction}</td>
                            <td className="px-2 py-1">{param.value || param.defaultValue || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Command Form */}
      {showNewCommandForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Command</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  value={newCommandData.name}
                  onChange={(e) => setNewCommandData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Command name (e.g., cmCustomers)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name:</label>
                <input
                  type="text"
                  value={newCommandData.displayName}
                  onChange={(e) => setNewCommandData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Command Type:</label>
                <select
                  value={newCommandData.type}
                  onChange={(e) => setNewCommandData(prev => ({ ...prev, type: e.target.value as DataCommandType }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {Object.values(DataCommandType).map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Command Text:</label>
                <textarea
                  value={newCommandData.commandText}
                  onChange={(e) => setNewCommandData(prev => ({ ...prev, commandText: e.target.value }))}
                  className="w-full border rounded px-3 py-2 font-mono"
                  rows={6}
                  placeholder="SQL statement or table name"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="prepared"
                  checked={newCommandData.prepared}
                  onChange={(e) => setNewCommandData(prev => ({ ...prev, prepared: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="prepared" className="text-sm">Prepared Statement</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewCommandForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleValidateSQL(newCommandData.commandText)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Validate SQL
              </button>
              <button
                onClick={handleCreateCommand}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newCommandData.name || !newCommandData.commandText || loading}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRelationsTab = () => {
    const allCommands = getAllCommands();
    const allRelations: DataRelation[] = [];
    connections.forEach(conn => allRelations.push(...conn.relations));

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Data Relations</h3>
          <button
            onClick={() => setShowNewRelationForm(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={allCommands.length < 2 || loading}
          >
            New Relation
          </button>
        </div>

        {allCommands.length < 2 && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            You need at least 2 commands to create relations between data.
          </div>
        )}

        {/* Relations List */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Parent</th>
                <th className="px-4 py-2 text-left">Child</th>
                <th className="px-4 py-2 text-left">Fields</th>
                <th className="px-4 py-2 text-left">Options</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRelations.map((rel) => {
                const parentCmd = allCommands.find(cmd => cmd.id === rel.parentCommandId);
                const childCmd = allCommands.find(cmd => cmd.id === rel.childCommandId);
                
                return (
                  <tr key={rel.id} className={selectedRelation?.id === rel.id ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 font-medium">{rel.name}</td>
                    <td className="px-4 py-2">{rel.type.replace('_', '-').toUpperCase()}</td>
                    <td className="px-4 py-2">{parentCmd?.name || 'Unknown'}</td>
                    <td className="px-4 py-2">{childCmd?.name || 'Unknown'}</td>
                    <td className="px-4 py-2">{rel.parentFields.join(', ')} → {rel.childFields.join(', ')}</td>
                    <td className="px-4 py-2">
                      <div className="text-xs">
                        {rel.cascadeUpdate && <span className="bg-blue-100 text-blue-800 px-1 rounded mr-1">Update</span>}
                        {rel.cascadeDelete && <span className="bg-red-100 text-red-800 px-1 rounded mr-1">Delete</span>}
                        {rel.enforceConstraints && <span className="bg-green-100 text-green-800 px-1 rounded">Enforce</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setSelectedRelation(rel)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Relation Details */}
        {selectedRelation && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">Relation: {selectedRelation.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Type:</strong> {selectedRelation.type.replace('_', '-').toUpperCase()}</div>
              <div><strong>Cascade Update:</strong> {selectedRelation.cascadeUpdate ? 'Yes' : 'No'}</div>
              <div><strong>Cascade Delete:</strong> {selectedRelation.cascadeDelete ? 'Yes' : 'No'}</div>
              <div><strong>Enforce Constraints:</strong> {selectedRelation.enforceConstraints ? 'Yes' : 'No'}</div>
              <div><strong>Created:</strong> {selectedRelation.created.toLocaleString()}</div>
              <div><strong>Modified:</strong> {selectedRelation.modified.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* New Relation Form */}
        {showNewRelationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Relation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Relation Name:</label>
                  <input
                    type="text"
                    value={newRelationData.name}
                    onChange={(e) => setNewRelationData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Relation name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Relation Type:</label>
                  <select
                    value={newRelationData.type}
                    onChange={(e) => setNewRelationData(prev => ({ ...prev, type: e.target.value as DataRelationType }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.values(DataRelationType).map(type => (
                      <option key={type} value={type}>{type.replace('_', '-').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Command:</label>
                  <select
                    value={newRelationData.parentCommandId}
                    onChange={(e) => setNewRelationData(prev => ({ ...prev, parentCommandId: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select parent command</option>
                    {allCommands.map(cmd => (
                      <option key={cmd.id} value={cmd.id}>{cmd.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Child Command:</label>
                  <select
                    value={newRelationData.childCommandId}
                    onChange={(e) => setNewRelationData(prev => ({ ...prev, childCommandId: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select child command</option>
                    {allCommands.map(cmd => (
                      <option key={cmd.id} value={cmd.id}>{cmd.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Field:</label>
                  <input
                    type="text"
                    value={newRelationData.parentFields[0]}
                    onChange={(e) => setNewRelationData(prev => ({ 
                      ...prev, 
                      parentFields: [e.target.value] 
                    }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Parent field name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Child Field:</label>
                  <input
                    type="text"
                    value={newRelationData.childFields[0]}
                    onChange={(e) => setNewRelationData(prev => ({ 
                      ...prev, 
                      childFields: [e.target.value] 
                    }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Child field name"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cascadeUpdate"
                      checked={newRelationData.cascadeUpdate}
                      onChange={(e) => setNewRelationData(prev => ({ ...prev, cascadeUpdate: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="cascadeUpdate" className="text-sm">Cascade Update</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cascadeDelete"
                      checked={newRelationData.cascadeDelete}
                      onChange={(e) => setNewRelationData(prev => ({ ...prev, cascadeDelete: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="cascadeDelete" className="text-sm">Cascade Delete</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowNewRelationForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRelation}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!newRelationData.name || !newRelationData.parentCommandId || !newRelationData.childCommandId || loading}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQueryDesignerTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Visual Query Designer</h3>
      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        <div className="text-4xl mb-4">🔧</div>
        <h4 className="text-lg font-medium mb-2">Visual Query Designer</h4>
        <p>Drag and drop table designer, visual joins, and query builder</p>
        <p className="text-sm mt-2">This feature would provide a complete visual interface for designing SQL queries</p>
      </div>
    </div>
  );

  const renderDataViewTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data View</h3>
        <div className="text-sm text-gray-600">
          {queryResult.length} records returned
        </div>
      </div>

      {queryResult.length === 0 ? (
        <div className="p-8 border rounded-lg text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>No data to display. Execute a command to see results here.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {Object.keys(queryResult[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResult.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((value, colIdx) => (
                      <td key={colIdx} className="px-4 py-2 text-sm">
                        {value instanceof Date ? value.toLocaleDateString() : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => {
    const stats = VB6DataEnvironmentInstance.getEnvironmentStats();
    
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Statistics</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Environments</div>
            <div className="text-lg text-blue-600">{stats.totalEnvironments}</div>
          </div>
          <div>
            <div className="font-medium">Connections</div>
            <div className="text-lg text-green-600">{stats.totalConnections}</div>
          </div>
          <div>
            <div className="font-medium">Commands</div>
            <div className="text-lg text-purple-600">{stats.totalCommands}</div>
          </div>
          <div>
            <div className="font-medium">Relations</div>
            <div className="text-lg text-orange-600">{stats.totalRelations}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white border rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-xl font-bold">VB6 Data Environment Designer</h2>
          <p className="text-sm text-gray-600">Visual database connection and query design tool</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Close
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b bg-gray-50">
        {[
          { id: 'environments', label: 'Environments', icon: '🗄️' },
          { id: 'connections', label: 'Connections', icon: '🔗' },
          { id: 'commands', label: 'Commands', icon: '⚡' },
          { id: 'relations', label: 'Relations', icon: '🔄' },
          { id: 'query-designer', label: 'Query Designer', icon: '🎨' },
          { id: 'data-view', label: 'Data View', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'environments' && renderEnvironmentsTab()}
        {activeTab === 'connections' && renderConnectionsTab()}
        {activeTab === 'commands' && renderCommandsTab()}
        {activeTab === 'relations' && renderRelationsTab()}
        {activeTab === 'query-designer' && renderQueryDesignerTab()}
        {activeTab === 'data-view' && renderDataViewTab()}

        {/* Statistics */}
        {renderStatistics()}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              Processing...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VB6DataEnvironmentUI;