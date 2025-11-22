import React, { useState, useEffect } from 'react';
import { X, Database, Play, TestTube, CheckCircle, AlertCircle, Info, Settings } from 'lucide-react';
import { vb6DatabaseService, ADOConnection, ConnectionState } from '../../services/VB6DatabaseService';

interface DatabaseConnectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onConnectionCreated?: (connection: ADOConnection, connectionString: string) => void;
  initialConnectionString?: string;
}

interface ConnectionProvider {
  name: string;
  displayName: string;
  template: string;
  description: string;
  parameters: Array<{
    name: string;
    label: string;
    type: 'text' | 'file' | 'number' | 'boolean';
    required: boolean;
    placeholder?: string;
    description?: string;
  }>;
}

const connectionProviders: ConnectionProvider[] = [
  {
    name: 'microsoft.jet.oledb.4.0',
    displayName: 'Microsoft Access (Jet)',
    template: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source={dataSource};User Id={userId};Password={password};',
    description: 'Connect to Microsoft Access databases (.mdb files)',
    parameters: [
      { name: 'dataSource', label: 'Database File', type: 'file', required: true, placeholder: 'C:\\path\\to\\database.mdb', description: 'Path to the Access database file' },
      { name: 'userId', label: 'User ID', type: 'text', required: false, placeholder: 'admin', description: 'Database user name (optional)' },
      { name: 'password', label: 'Password', type: 'text', required: false, placeholder: '', description: 'Database password (optional)' }
    ]
  },
  {
    name: 'sqloledb',
    displayName: 'SQL Server (OLEDB)',
    template: 'Provider=SQLOLEDB;Server={server};Database={database};Uid={userId};Pwd={password};',
    description: 'Connect to Microsoft SQL Server databases',
    parameters: [
      { name: 'server', label: 'Server', type: 'text', required: true, placeholder: 'localhost\\SQLEXPRESS', description: 'SQL Server instance name' },
      { name: 'database', label: 'Database', type: 'text', required: true, placeholder: 'Northwind', description: 'Database name' },
      { name: 'userId', label: 'User ID', type: 'text', required: true, placeholder: 'sa', description: 'SQL Server user name' },
      { name: 'password', label: 'Password', type: 'text', required: true, placeholder: '', description: 'SQL Server password' }
    ]
  },
  {
    name: 'microsoft.ace.oledb.12.0',
    displayName: 'Microsoft Access (ACE)',
    template: 'Provider=Microsoft.ACE.OLEDB.12.0;Data Source={dataSource};User Id={userId};Password={password};',
    description: 'Connect to newer Access databases (.accdb files)',
    parameters: [
      { name: 'dataSource', label: 'Database File', type: 'file', required: true, placeholder: 'C:\\path\\to\\database.accdb', description: 'Path to the Access database file' },
      { name: 'userId', label: 'User ID', type: 'text', required: false, placeholder: 'admin', description: 'Database user name (optional)' },
      { name: 'password', label: 'Password', type: 'text', required: false, placeholder: '', description: 'Database password (optional)' }
    ]
  },
  {
    name: 'msdasql',
    displayName: 'ODBC Driver',
    template: 'Provider=MSDASQL;Driver={driver};Server={server};Database={database};Uid={userId};Pwd={password};',
    description: 'Connect through ODBC drivers',
    parameters: [
      { name: 'driver', label: 'ODBC Driver', type: 'text', required: true, placeholder: '{SQL Server}', description: 'ODBC driver name' },
      { name: 'server', label: 'Server', type: 'text', required: true, placeholder: 'localhost', description: 'Database server' },
      { name: 'database', label: 'Database', type: 'text', required: true, placeholder: 'database_name', description: 'Database name' },
      { name: 'userId', label: 'User ID', type: 'text', required: true, placeholder: 'username', description: 'Database user name' },
      { name: 'password', label: 'Password', type: 'text', required: true, placeholder: '', description: 'Database password' }
    ]
  },
  {
    name: 'custom',
    displayName: 'Custom Connection String',
    template: '',
    description: 'Enter a custom connection string',
    parameters: []
  }
];

export const DatabaseConnectionDialog: React.FC<DatabaseConnectionDialogProps> = ({
  visible,
  onClose,
  onConnectionCreated,
  initialConnectionString = ''
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider>(connectionProviders[0]);
  const [parameters, setParameters] = useState<{ [key: string]: string }>({});
  const [customConnectionString, setCustomConnectionString] = useState(initialConnectionString);
  const [connectionString, setConnectionString] = useState(initialConnectionString);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (visible) {
      if (initialConnectionString) {
        setCustomConnectionString(initialConnectionString);
        setConnectionString(initialConnectionString);
        setSelectedProvider(connectionProviders.find(p => p.name === 'custom') || connectionProviders[0]);
      } else {
        // Reset to defaults
        setSelectedProvider(connectionProviders[0]);
        setParameters({});
        setCustomConnectionString('');
        setConnectionString('');
      }
      setTestResult(null);
      setAvailableTables([]);
      setShowAdvanced(false);
    }
  }, [visible, initialConnectionString]);

  // Update connection string when provider or parameters change
  useEffect(() => {
    if (selectedProvider.name === 'custom') {
      setConnectionString(customConnectionString);
    } else {
      let connStr = selectedProvider.template;
      Object.entries(parameters).forEach(([key, value]) => {
        connStr = connStr.replace(`{${key}}`, value || '');
      });
      setConnectionString(connStr);
    }
  }, [selectedProvider, parameters, customConnectionString]);

  const handleProviderChange = (provider: ConnectionProvider) => {
    setSelectedProvider(provider);
    setParameters({});
    setTestResult(null);
    setAvailableTables([]);
  };

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const testConnection = async () => {
    if (!connectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection string' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);
    setAvailableTables([]);

    try {
      const connection = vb6DatabaseService.createConnection(`test_${Date.now()}`);
      await connection.Open(connectionString);
      
      // Get available tables if connection succeeds
      const tables = vb6DatabaseService.getAvailableTables();
      setAvailableTables(tables);
      
      await connection.Close();
      setTestResult({ 
        success: true, 
        message: `Connection successful! Found ${tables.length} tables.` 
      });
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.message || 'Connection failed' 
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCreateConnection = async () => {
    if (!connectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection string' });
      return;
    }

    try {
      const connection = vb6DatabaseService.createConnection(`connection_${Date.now()}`);
      await connection.Open(connectionString);
      
      onConnectionCreated?.(connection, connectionString);
      onClose();
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.message || 'Failed to create connection' 
      });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Database Connection</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Provider
            </label>
            <div className="space-y-2">
              {connectionProviders.map(provider => (
                <label key={provider.name} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    value={provider.name}
                    checked={selectedProvider.name === provider.name}
                    onChange={() => handleProviderChange(provider)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{provider.displayName}</div>
                    <div className="text-sm text-gray-600">{provider.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Parameters */}
          {selectedProvider.name !== 'custom' && selectedProvider.parameters.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Connection Parameters</h3>
              <div className="space-y-4">
                {selectedProvider.parameters.map(param => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.label}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={param.type === 'file' ? 'text' : param.type}
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={param.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={param.required}
                    />
                    {param.description && (
                      <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Connection String */}
          {selectedProvider.name === 'custom' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection String
              </label>
              <textarea
                value={customConnectionString}
                onChange={(e) => setCustomConnectionString(e.target.value)}
                placeholder="Enter your custom connection string..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={3}
              />
            </div>
          )}

          {/* Generated Connection String */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Generated Connection String
              </label>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Settings size={12} />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <code className="text-xs text-gray-700 break-all">{connectionString || 'No connection string generated'}</code>
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Info size={16} />
                Advanced Options
              </h3>
              <div className="space-y-3 text-xs text-blue-700">
                <div>
                  <strong>Connection Timeout:</strong> Time to wait while trying to establish a connection (default: 15 seconds)
                </div>
                <div>
                  <strong>Command Timeout:</strong> Time to wait for a command to execute (default: 30 seconds)
                </div>
                <div>
                  <strong>Provider:</strong> The OLE DB provider to use for the connection
                </div>
              </div>
            </div>
          )}

          {/* Test Connection */}
          <div className="mb-6">
            <button
              onClick={testConnection}
              disabled={isTestingConnection || !connectionString.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingConnection ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube size={16} />
                  Test Connection
                </>
              )}
            </button>

            {/* Test Result */}
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {testResult.success ? (
                  <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{testResult.message}</p>
                  
                  {/* Available Tables */}
                  {testResult.success && availableTables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Available Tables:</p>
                      <div className="flex flex-wrap gap-1">
                        {availableTables.map(table => (
                          <span key={table} className="text-xs bg-green-100 px-2 py-0.5 rounded">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {testResult?.success ? 'Connection verified successfully' : 'Test the connection before proceeding'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateConnection}
              disabled={!connectionString.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={16} />
              Create Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionDialog;