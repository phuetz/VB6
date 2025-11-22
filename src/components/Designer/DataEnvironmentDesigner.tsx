/**
 * VB6 DataEnvironment Designer Implementation
 * 
 * Visual designer for creating and managing data connections, commands, and recordsets
 */

import React, { useState, useCallback, useRef } from 'react';
import { Tree, TreeNode } from 'primereact/tree';
import { ContextMenu } from 'primereact/contextmenu';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';

// DataEnvironment Types
export interface DataConnection {
  id: string;
  name: string;
  connectionString: string;
  provider: string;
  dataSource: string;
  initialCatalog: string;
  userID: string;
  password: string;
  timeout: number;
  commandTimeout: number;
  cursorLocation: number; // 1=Server, 2=Client
  mode: number; // Read, Write, ReadWrite
  commands: DataCommand[];
}

export interface DataCommand {
  id: string;
  name: string;
  connectionId: string;
  commandType: number; // 1=Text, 2=Table, 4=StoredProc
  commandText: string;
  commandTimeout: number;
  prepared: boolean;
  parameters: DataParameter[];
  childCommands: DataCommand[];
  fields: DataField[];
}

export interface DataParameter {
  id: string;
  name: string;
  direction: number; // 1=Input, 2=Output, 3=InputOutput, 4=Return
  dataType: string;
  size: number;
  precision: number;
  scale: number;
  value: any;
}

export interface DataField {
  id: string;
  name: string;
  dataType: string;
  size: number;
  precision: number;
  scale: number;
  allowNull: boolean;
  autoIncrement: boolean;
  primaryKey: boolean;
}

export interface DataEnvironment {
  id: string;
  name: string;
  connections: DataConnection[];
}

// Constants
const DataEnvironmentConstants = {
  // Command Types
  adCmdText: 1,
  adCmdTable: 2,
  adCmdStoredProc: 4,
  adCmdUnknown: 8,
  
  // Parameter Directions
  adParamInput: 1,
  adParamOutput: 2,
  adParamInputOutput: 3,
  adParamReturnValue: 4,
  
  // Cursor Locations
  adUseServer: 1,
  adUseClient: 2,
  
  // Connection Modes
  adModeRead: 1,
  adModeWrite: 2,
  adModeReadWrite: 3,
  
  // Data Types
  adSmallInt: 2,
  adInteger: 3,
  adSingle: 4,
  adDouble: 5,
  adCurrency: 6,
  adDate: 7,
  adBSTR: 8,
  adBoolean: 11,
  adVariant: 12,
  adDecimal: 14,
  adTinyInt: 16,
  adUnsignedTinyInt: 17,
  adUnsignedSmallInt: 18,
  adUnsignedInt: 19,
  adBigInt: 20,
  adUnsignedBigInt: 21,
  adGUID: 72,
  adChar: 129,
  adWChar: 130,
  adVarChar: 200,
  adLongVarChar: 201,
  adVarWChar: 202,
  adLongVarWChar: 203
};

interface DataEnvironmentDesignerProps {
  dataEnvironment: DataEnvironment;
  onUpdate: (dataEnvironment: DataEnvironment) => void;
  onClose: () => void;
}

export const DataEnvironmentDesigner: React.FC<DataEnvironmentDesignerProps> = ({
  dataEnvironment,
  onUpdate,
  onClose
}) => {
  const [environment, setEnvironment] = useState<DataEnvironment>(dataEnvironment);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [showParameterDialog, setShowParameterDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DataConnection | null>(null);
  const [editingCommand, setEditingCommand] = useState<DataCommand | null>(null);
  const [editingParameter, setEditingParameter] = useState<DataParameter | null>(null);
  
  const contextMenuRef = useRef<ContextMenu>(null);

  // Providers list
  const providers = [
    { label: 'Microsoft OLE DB Provider for SQL Server', value: 'SQLOLEDB' },
    { label: 'Microsoft Jet 4.0 OLE DB Provider', value: 'Microsoft.Jet.OLEDB.4.0' },
    { label: 'Oracle Provider for OLE DB', value: 'OraOLEDB.Oracle' },
    { label: 'MySQL OLE DB Provider', value: 'MySQLProv' },
    { label: 'ODBC Driver', value: 'MSDASQL' }
  ];

  // Command types
  const commandTypes = [
    { label: 'SQL Statement', value: DataEnvironmentConstants.adCmdText },
    { label: 'Table', value: DataEnvironmentConstants.adCmdTable },
    { label: 'Stored Procedure', value: DataEnvironmentConstants.adCmdStoredProc }
  ];

  // Parameter directions
  const parameterDirections = [
    { label: 'Input', value: DataEnvironmentConstants.adParamInput },
    { label: 'Output', value: DataEnvironmentConstants.adParamOutput },
    { label: 'Input/Output', value: DataEnvironmentConstants.adParamInputOutput },
    { label: 'Return Value', value: DataEnvironmentConstants.adParamReturnValue }
  ];

  // Data types
  const dataTypes = [
    { label: 'String (VARCHAR)', value: 'adVarChar' },
    { label: 'Integer', value: 'adInteger' },
    { label: 'BigInt', value: 'adBigInt' },
    { label: 'SmallInt', value: 'adSmallInt' },
    { label: 'TinyInt', value: 'adTinyInt' },
    { label: 'Decimal', value: 'adDecimal' },
    { label: 'Double', value: 'adDouble' },
    { label: 'Single', value: 'adSingle' },
    { label: 'Currency', value: 'adCurrency' },
    { label: 'Date/Time', value: 'adDate' },
    { label: 'Boolean', value: 'adBoolean' },
    { label: 'GUID', value: 'adGUID' },
    { label: 'Text (LONGVARCHAR)', value: 'adLongVarChar' },
    { label: 'Binary', value: 'adBinary' }
  ];

  // Build tree structure
  const buildTreeNodes = useCallback((): TreeNode[] => {
    const nodes: TreeNode[] = [{
      key: 'root',
      label: environment.name,
      icon: 'pi pi-database',
      expanded: true,
      children: environment.connections.map(conn => ({
        key: `conn_${conn.id}`,
        label: conn.name,
        icon: 'pi pi-server',
        data: { type: 'connection', item: conn },
        expanded: true,
        children: conn.commands.map(cmd => buildCommandNode(cmd))
      }))
    }];
    
    return nodes;
  }, [environment]);

  // Build command node recursively
  const buildCommandNode = (command: DataCommand): TreeNode => {
    return {
      key: `cmd_${command.id}`,
      label: command.name,
      icon: getCommandIcon(command.commandType),
      data: { type: 'command', item: command },
      expanded: true,
      children: [
        ...(command.parameters.length > 0 ? [{
          key: `params_${command.id}`,
          label: 'Parameters',
          icon: 'pi pi-list',
          data: { type: 'parameters', commandId: command.id },
          children: command.parameters.map(param => ({
            key: `param_${param.id}`,
            label: param.name,
            icon: 'pi pi-tag',
            data: { type: 'parameter', item: param, commandId: command.id }
          }))
        }] : []),
        ...(command.fields.length > 0 ? [{
          key: `fields_${command.id}`,
          label: 'Fields',
          icon: 'pi pi-table',
          data: { type: 'fields', commandId: command.id },
          children: command.fields.map(field => ({
            key: `field_${field.id}`,
            label: `${field.name} (${field.dataType})`,
            icon: field.primaryKey ? 'pi pi-key' : 'pi pi-minus',
            data: { type: 'field', item: field }
          }))
        }] : []),
        ...command.childCommands.map(child => buildCommandNode(child))
      ]
    };
  };

  // Get command icon based on type
  const getCommandIcon = (commandType: number): string => {
    switch (commandType) {
      case DataEnvironmentConstants.adCmdText:
        return 'pi pi-file';
      case DataEnvironmentConstants.adCmdTable:
        return 'pi pi-table';
      case DataEnvironmentConstants.adCmdStoredProc:
        return 'pi pi-cog';
      default:
        return 'pi pi-question';
    }
  };

  // Context menu items
  const getContextMenuItems = () => {
    if (!selectedNode || !selectedNode.data) {
      return [{
        label: 'Add Connection',
        icon: 'pi pi-plus',
        command: () => handleAddConnection()
      }];
    }

    const { type, item } = selectedNode.data;

    switch (type) {
      case 'connection':
        return [
          {
            label: 'Add Command',
            icon: 'pi pi-plus',
            command: () => handleAddCommand(item.id)
          },
          {
            label: 'Edit Connection',
            icon: 'pi pi-pencil',
            command: () => handleEditConnection(item)
          },
          {
            label: 'Delete Connection',
            icon: 'pi pi-trash',
            command: () => handleDeleteConnection(item.id)
          },
          { separator: true },
          {
            label: 'Test Connection',
            icon: 'pi pi-play',
            command: () => handleTestConnection(item)
          }
        ];

      case 'command':
        return [
          {
            label: 'Add Parameter',
            icon: 'pi pi-plus',
            command: () => handleAddParameter(item)
          },
          {
            label: 'Add Child Command',
            icon: 'pi pi-plus',
            command: () => handleAddChildCommand(item)
          },
          {
            label: 'Edit Command',
            icon: 'pi pi-pencil',
            command: () => handleEditCommand(item)
          },
          {
            label: 'Delete Command',
            icon: 'pi pi-trash',
            command: () => handleDeleteCommand(item)
          },
          { separator: true },
          {
            label: 'Refresh Fields',
            icon: 'pi pi-refresh',
            command: () => handleRefreshFields(item)
          },
          {
            label: 'Preview Data',
            icon: 'pi pi-eye',
            command: () => handlePreviewData(item)
          }
        ];

      case 'parameter':
        return [
          {
            label: 'Edit Parameter',
            icon: 'pi pi-pencil',
            command: () => handleEditParameter(item, selectedNode.data.commandId)
          },
          {
            label: 'Delete Parameter',
            icon: 'pi pi-trash',
            command: () => handleDeleteParameter(item, selectedNode.data.commandId)
          }
        ];

      default:
        return [];
    }
  };

  // Handlers
  const handleAddConnection = () => {
    setEditingConnection({
      id: `conn_${Date.now()}`,
      name: 'Connection1',
      connectionString: '',
      provider: 'SQLOLEDB',
      dataSource: '',
      initialCatalog: '',
      userID: '',
      password: '',
      timeout: 30,
      commandTimeout: 30,
      cursorLocation: DataEnvironmentConstants.adUseClient,
      mode: DataEnvironmentConstants.adModeReadWrite,
      commands: []
    });
    setShowConnectionDialog(true);
  };

  const handleEditConnection = (connection: DataConnection) => {
    setEditingConnection({ ...connection });
    setShowConnectionDialog(true);
  };

  const handleDeleteConnection = (connectionId: string) => {
    const newEnvironment = {
      ...environment,
      connections: environment.connections.filter(c => c.id !== connectionId)
    };
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
  };

  const handleTestConnection = (connection: DataConnection) => {
    // Simulate connection test
    alert(`Testing connection "${connection.name}"...\n\nConnection successful!`);
  };

  const handleAddCommand = (connectionId: string) => {
    setEditingCommand({
      id: `cmd_${Date.now()}`,
      name: 'Command1',
      connectionId,
      commandType: DataEnvironmentConstants.adCmdText,
      commandText: '',
      commandTimeout: 30,
      prepared: false,
      parameters: [],
      childCommands: [],
      fields: []
    });
    setShowCommandDialog(true);
  };

  const handleAddChildCommand = (parentCommand: DataCommand) => {
    const childCommand: DataCommand = {
      id: `cmd_${Date.now()}`,
      name: `${parentCommand.name}_Child`,
      connectionId: parentCommand.connectionId,
      commandType: DataEnvironmentConstants.adCmdText,
      commandText: '',
      commandTimeout: 30,
      prepared: false,
      parameters: [],
      childCommands: [],
      fields: []
    };
    
    // Add child command to parent
    parentCommand.childCommands.push(childCommand);
    
    const newEnvironment = { ...environment };
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
  };

  const handleEditCommand = (command: DataCommand) => {
    setEditingCommand({ ...command });
    setShowCommandDialog(true);
  };

  const handleDeleteCommand = (command: DataCommand) => {
    // Remove command from its connection
    const newEnvironment = { ...environment };
    newEnvironment.connections.forEach(conn => {
      conn.commands = conn.commands.filter(cmd => cmd.id !== command.id);
      // Also check child commands recursively
      const removeFromChildren = (commands: DataCommand[]) => {
        commands.forEach(cmd => {
          cmd.childCommands = cmd.childCommands.filter(child => child.id !== command.id);
          removeFromChildren(cmd.childCommands);
        });
      };
      removeFromChildren(conn.commands);
    });
    
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
  };

  const handleRefreshFields = (command: DataCommand) => {
    // Simulate field discovery based on command type
    const mockFields: DataField[] = [];
    
    if (command.commandType === DataEnvironmentConstants.adCmdTable) {
      // Mock table fields
      mockFields.push(
        { id: 'f1', name: 'ID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: false, autoIncrement: true, primaryKey: true },
        { id: 'f2', name: 'Name', dataType: 'adVarChar', size: 50, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false },
        { id: 'f3', name: 'Description', dataType: 'adVarChar', size: 255, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
        { id: 'f4', name: 'CreatedDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false }
      );
    } else if (command.commandText.toLowerCase().includes('select')) {
      // Mock query fields
      mockFields.push(
        { id: 'f1', name: 'Column1', dataType: 'adVarChar', size: 50, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
        { id: 'f2', name: 'Column2', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false }
      );
    }
    
    command.fields = mockFields;
    const newEnvironment = { ...environment };
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
  };

  const handlePreviewData = (command: DataCommand) => {
    // Simulate data preview
    alert(`Preview data for command "${command.name}":\n\n[Mock data would be displayed here]`);
  };

  const handleAddParameter = (command: DataCommand) => {
    setEditingParameter({
      id: `param_${Date.now()}`,
      name: 'Parameter1',
      direction: DataEnvironmentConstants.adParamInput,
      dataType: 'adVarChar',
      size: 50,
      precision: 0,
      scale: 0,
      value: null
    });
    setEditingCommand(command);
    setShowParameterDialog(true);
  };

  const handleEditParameter = (parameter: DataParameter, commandId: string) => {
    setEditingParameter({ ...parameter });
    const command = findCommand(commandId);
    if (command) {
      setEditingCommand(command);
      setShowParameterDialog(true);
    }
  };

  const handleDeleteParameter = (parameter: DataParameter, commandId: string) => {
    const command = findCommand(commandId);
    if (command) {
      command.parameters = command.parameters.filter(p => p.id !== parameter.id);
      const newEnvironment = { ...environment };
      setEnvironment(newEnvironment);
      onUpdate(newEnvironment);
    }
  };

  const findCommand = (commandId: string): DataCommand | null => {
    for (const conn of environment.connections) {
      const findInCommands = (commands: DataCommand[]): DataCommand | null => {
        for (const cmd of commands) {
          if (cmd.id === commandId) return cmd;
          const found = findInCommands(cmd.childCommands);
          if (found) return found;
        }
        return null;
      };
      const found = findInCommands(conn.commands);
      if (found) return found;
    }
    return null;
  };

  // Save connection
  const saveConnection = () => {
    if (!editingConnection) return;
    
    const newEnvironment = { ...environment };
    const existingIndex = newEnvironment.connections.findIndex(c => c.id === editingConnection.id);
    
    if (existingIndex >= 0) {
      newEnvironment.connections[existingIndex] = editingConnection;
    } else {
      newEnvironment.connections.push(editingConnection);
    }
    
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
    setShowConnectionDialog(false);
    setEditingConnection(null);
  };

  // Save command
  const saveCommand = () => {
    if (!editingCommand) return;
    
    const newEnvironment = { ...environment };
    const connection = newEnvironment.connections.find(c => c.id === editingCommand.connectionId);
    
    if (connection) {
      const existingIndex = connection.commands.findIndex(c => c.id === editingCommand.id);
      
      if (existingIndex >= 0) {
        connection.commands[existingIndex] = editingCommand;
      } else {
        connection.commands.push(editingCommand);
      }
    }
    
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
    setShowCommandDialog(false);
    setEditingCommand(null);
  };

  // Save parameter
  const saveParameter = () => {
    if (!editingParameter || !editingCommand) return;
    
    const existingIndex = editingCommand.parameters.findIndex(p => p.id === editingParameter.id);
    
    if (existingIndex >= 0) {
      editingCommand.parameters[existingIndex] = editingParameter;
    } else {
      editingCommand.parameters.push(editingParameter);
    }
    
    const newEnvironment = { ...environment };
    setEnvironment(newEnvironment);
    onUpdate(newEnvironment);
    setShowParameterDialog(false);
    setEditingParameter(null);
  };

  // Generate code
  const generateCode = () => {
    let code = `' DataEnvironment Code Generated\n\n`;
    
    // Generate connection code
    environment.connections.forEach(conn => {
      code += `' Connection: ${conn.name}\n`;
      code += `Dim ${conn.name} As ADODB.Connection\n`;
      code += `Set ${conn.name} = New ADODB.Connection\n`;
      code += `${conn.name}.ConnectionString = "${conn.connectionString}"\n`;
      code += `${conn.name}.Open\n\n`;
      
      // Generate command code
      conn.commands.forEach(cmd => {
        code += `' Command: ${cmd.name}\n`;
        code += `Dim ${cmd.name} As ADODB.Command\n`;
        code += `Set ${cmd.name} = New ADODB.Command\n`;
        code += `Set ${cmd.name}.ActiveConnection = ${conn.name}\n`;
        code += `${cmd.name}.CommandType = ${cmd.commandType}\n`;
        code += `${cmd.name}.CommandText = "${cmd.commandText}"\n`;
        
        // Generate parameter code
        cmd.parameters.forEach(param => {
          code += `${cmd.name}.Parameters.Append ${cmd.name}.CreateParameter("${param.name}", ${param.dataType}, ${param.direction}, ${param.size})\n`;
        });
        
        code += `\n`;
      });
    });
    
    // Copy to clipboard or show in dialog
    navigator.clipboard.writeText(code);
    alert('Code generated and copied to clipboard!');
  };

  const treeNodes = buildTreeNodes();

  return (
    <Dialog
      header="Data Environment Designer"
      visible={true}
      style={{ width: '90vw', height: '80vh' }}
      maximizable
      modal
      onHide={onClose}
    >
      <div className="data-environment-designer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Toolbar
          left={
            <div className="p-toolbar-group-left">
              <Button label="Add Connection" icon="pi pi-plus" onClick={handleAddConnection} className="p-mr-2" />
              <Button label="Generate Code" icon="pi pi-code" onClick={generateCode} className="p-mr-2" />
              <Button label="Save" icon="pi pi-save" onClick={() => onUpdate(environment)} />
            </div>
          }
        />

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <Tree
            value={treeNodes}
            selectionMode="single"
            selection={selectedNode}
            onSelectionChange={(e) => setSelectedNode(e.value)}
            contextMenuSelectionKey={selectedNode?.key}
            onContextMenuSelectionChange={(e) => setSelectedNode(e.value)}
            onContextMenu={(e) => contextMenuRef.current?.show(e.originalEvent)}
            style={{ border: 'none' }}
          />
        </div>

        <ContextMenu
          ref={contextMenuRef}
          model={getContextMenuItems()}
        />

        {/* Connection Dialog */}
        <Dialog
          header={editingConnection?.id.startsWith('conn_') ? 'Add Connection' : 'Edit Connection'}
          visible={showConnectionDialog}
          style={{ width: '600px' }}
          modal
          onHide={() => {
            setShowConnectionDialog(false);
            setEditingConnection(null);
          }}
          footer={
            <div>
              <Button label="Test" icon="pi pi-play" onClick={() => editingConnection && handleTestConnection(editingConnection)} className="p-mr-2" />
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowConnectionDialog(false)} className="p-mr-2" />
              <Button label="Save" icon="pi pi-check" onClick={saveConnection} />
            </div>
          }
        >
          {editingConnection && (
            <div className="p-fluid">
              <div className="p-field">
                <label htmlFor="connName">Connection Name</label>
                <InputText
                  id="connName"
                  value={editingConnection.name}
                  onChange={(e) => setEditingConnection({ ...editingConnection, name: e.target.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="provider">Provider</label>
                <Dropdown
                  id="provider"
                  value={editingConnection.provider}
                  options={providers}
                  onChange={(e) => setEditingConnection({ ...editingConnection, provider: e.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="dataSource">Data Source</label>
                <InputText
                  id="dataSource"
                  value={editingConnection.dataSource}
                  onChange={(e) => setEditingConnection({ ...editingConnection, dataSource: e.target.value })}
                  placeholder="Server name or path"
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="catalog">Initial Catalog</label>
                <InputText
                  id="catalog"
                  value={editingConnection.initialCatalog}
                  onChange={(e) => setEditingConnection({ ...editingConnection, initialCatalog: e.target.value })}
                  placeholder="Database name"
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="userID">User ID</label>
                <InputText
                  id="userID"
                  value={editingConnection.userID}
                  onChange={(e) => setEditingConnection({ ...editingConnection, userID: e.target.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="password">Password</label>
                <InputText
                  id="password"
                  type="password"
                  value={editingConnection.password}
                  onChange={(e) => setEditingConnection({ ...editingConnection, password: e.target.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="timeout">Connection Timeout (seconds)</label>
                <InputText
                  id="timeout"
                  type="number"
                  value={editingConnection.timeout}
                  onChange={(e) => setEditingConnection({ ...editingConnection, timeout: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          )}
        </Dialog>

        {/* Command Dialog */}
        <Dialog
          header={editingCommand?.id.startsWith('cmd_') ? 'Add Command' : 'Edit Command'}
          visible={showCommandDialog}
          style={{ width: '700px' }}
          modal
          onHide={() => {
            setShowCommandDialog(false);
            setEditingCommand(null);
          }}
          footer={
            <div>
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowCommandDialog(false)} className="p-mr-2" />
              <Button label="Save" icon="pi pi-check" onClick={saveCommand} />
            </div>
          }
        >
          {editingCommand && (
            <div className="p-fluid">
              <div className="p-field">
                <label htmlFor="cmdName">Command Name</label>
                <InputText
                  id="cmdName"
                  value={editingCommand.name}
                  onChange={(e) => setEditingCommand({ ...editingCommand, name: e.target.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="cmdType">Command Type</label>
                <Dropdown
                  id="cmdType"
                  value={editingCommand.commandType}
                  options={commandTypes}
                  onChange={(e) => setEditingCommand({ ...editingCommand, commandType: e.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="cmdText">Command Text</label>
                <textarea
                  id="cmdText"
                  className="p-inputtextarea"
                  rows={10}
                  value={editingCommand.commandText}
                  onChange={(e) => setEditingCommand({ ...editingCommand, commandText: e.target.value })}
                  placeholder={
                    editingCommand.commandType === DataEnvironmentConstants.adCmdText ? 'Enter SQL query...' :
                    editingCommand.commandType === DataEnvironmentConstants.adCmdTable ? 'Enter table name...' :
                    'Enter stored procedure name...'
                  }
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="cmdTimeout">Command Timeout (seconds)</label>
                <InputText
                  id="cmdTimeout"
                  type="number"
                  value={editingCommand.commandTimeout}
                  onChange={(e) => setEditingCommand({ ...editingCommand, commandTimeout: parseInt(e.target.value) || 30 })}
                />
              </div>
              
              <div className="p-field-checkbox">
                <input
                  type="checkbox"
                  id="prepared"
                  checked={editingCommand.prepared}
                  onChange={(e) => setEditingCommand({ ...editingCommand, prepared: e.target.checked })}
                />
                <label htmlFor="prepared">Prepared Statement</label>
              </div>
            </div>
          )}
        </Dialog>

        {/* Parameter Dialog */}
        <Dialog
          header={editingParameter?.id.startsWith('param_') ? 'Add Parameter' : 'Edit Parameter'}
          visible={showParameterDialog}
          style={{ width: '500px' }}
          modal
          onHide={() => {
            setShowParameterDialog(false);
            setEditingParameter(null);
          }}
          footer={
            <div>
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowParameterDialog(false)} className="p-mr-2" />
              <Button label="Save" icon="pi pi-check" onClick={saveParameter} />
            </div>
          }
        >
          {editingParameter && (
            <div className="p-fluid">
              <div className="p-field">
                <label htmlFor="paramName">Parameter Name</label>
                <InputText
                  id="paramName"
                  value={editingParameter.name}
                  onChange={(e) => setEditingParameter({ ...editingParameter, name: e.target.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="paramDirection">Direction</label>
                <Dropdown
                  id="paramDirection"
                  value={editingParameter.direction}
                  options={parameterDirections}
                  onChange={(e) => setEditingParameter({ ...editingParameter, direction: e.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="paramType">Data Type</label>
                <Dropdown
                  id="paramType"
                  value={editingParameter.dataType}
                  options={dataTypes}
                  onChange={(e) => setEditingParameter({ ...editingParameter, dataType: e.value })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="paramSize">Size</label>
                <InputText
                  id="paramSize"
                  type="number"
                  value={editingParameter.size}
                  onChange={(e) => setEditingParameter({ ...editingParameter, size: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="paramPrecision">Precision</label>
                <InputText
                  id="paramPrecision"
                  type="number"
                  value={editingParameter.precision}
                  onChange={(e) => setEditingParameter({ ...editingParameter, precision: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="paramScale">Scale</label>
                <InputText
                  id="paramScale"
                  type="number"
                  value={editingParameter.scale}
                  onChange={(e) => setEditingParameter({ ...editingParameter, scale: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="p-field">
                <label htmlFor="paramValue">Default Value</label>
                <InputText
                  id="paramValue"
                  value={editingParameter.value || ''}
                  onChange={(e) => setEditingParameter({ ...editingParameter, value: e.target.value })}
                />
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </Dialog>
  );
};

// Helper to create a new DataEnvironment
export const createDataEnvironment = (name: string = 'DataEnvironment1'): DataEnvironment => {
  return {
    id: `de_${Date.now()}`,
    name,
    connections: []
  };
};

export default DataEnvironmentDesigner;