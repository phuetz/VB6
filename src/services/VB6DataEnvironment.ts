/**
 * VB6 Data Environment Designer - Complete Database Design Environment
 * Provides visual database connection management, query design, and data command creation
 * Compatible with VB6 Data Environment and Data Report Designer
 */

import { createLogger } from './LoggingService';
import { DataParameterValue, DataEnvRecord, DataEnvEventPayload } from './types/VB6ServiceTypes';

const logger = createLogger('DataEnvironment');

export enum DataConnectionType {
  OLEDB = 'oledb',
  ODBC = 'odbc',
  ADO = 'ado',
  DAO = 'dao',
  RDO = 'rdo',
  DIRECT = 'direct',
}

export enum DataCommandType {
  TABLE = 'table',
  VIEW = 'view',
  STORED_PROCEDURE = 'stored_procedure',
  SQL_STATEMENT = 'sql_statement',
  COMMAND_TEXT = 'command_text',
}

export enum DataRelationType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_MANY = 'many_to_many',
}

export enum ParameterDirection {
  INPUT = 'input',
  OUTPUT = 'output',
  INPUT_OUTPUT = 'input_output',
  RETURN_VALUE = 'return_value',
}

export interface DataConnection {
  id: string;
  name: string;
  displayName: string;
  type: DataConnectionType;

  // Connection properties
  provider: string;
  dataSource: string;
  initialCatalog?: string;
  serverName?: string;
  databaseName?: string;
  fileName?: string;

  // Authentication
  userId?: string;
  password?: string;
  integratedSecurity: boolean;
  persistSecurityInfo: boolean;

  // Connection options
  connectionTimeout: number;
  commandTimeout: number;
  cursorLocation: 'client' | 'server';
  lockType: 'optimistic' | 'pessimistic' | 'readonly' | 'batch_optimistic';

  // Status
  state: 'closed' | 'open' | 'connecting' | 'executing' | 'fetching' | 'broken';
  lastError?: string;

  // Connection string
  connectionString: string;

  // Metadata
  created: Date;
  modified: Date;
  lastUsed?: Date;

  // Commands and relations
  commands: DataCommand[];
  relations: DataRelation[];
}

export interface DataCommand {
  id: string;
  name: string;
  displayName: string;
  type: DataCommandType;
  connectionId: string;

  // Command definition
  commandText: string;
  tableName?: string;
  storedProcedureName?: string;

  // Parameters
  parameters: DataParameter[];

  // Recordset properties
  cursorType: 'forward_only' | 'keyset' | 'dynamic' | 'static';
  lockType: 'readonly' | 'pessimistic' | 'optimistic' | 'batch_optimistic';

  // Options
  prepared: boolean;
  activeConnection?: string;

  // Fields information
  fields: DataField[];

  // Metadata
  created: Date;
  modified: Date;
  lastExecuted?: Date;
  recordCount?: number;
}

export interface DataParameter {
  id: string;
  name: string;
  direction: ParameterDirection;
  type: DataFieldType;
  size: number;
  precision?: number;
  scale?: number;
  value?: DataParameterValue;
  defaultValue?: DataParameterValue;
  allowNull: boolean;
}

export interface DataField {
  name: string;
  type: DataFieldType;
  size: number;
  precision?: number;
  scale?: number;
  allowNull: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue?: DataParameterValue;
  originalValue?: DataParameterValue;
}

export enum DataFieldType {
  EMPTY = 'empty',
  TINYINT = 'tinyint',
  SMALLINT = 'smallint',
  INTEGER = 'integer',
  BIGINT = 'bigint',
  UNSIGNEDTINYINT = 'unsignedtinyint',
  UNSIGNEDSMALLINT = 'unsignedsmallint',
  UNSIGNEDINT = 'unsignedint',
  UNSIGNEDBIGINT = 'unsignedbigint',
  SINGLE = 'single',
  DOUBLE = 'double',
  CURRENCY = 'currency',
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  BOOLEAN = 'boolean',
  ERROR = 'error',
  USERDEFINED = 'userdefined',
  VARIANT = 'variant',
  IDISPATCH = 'idispatch',
  IUNKNOWN = 'iunknown',
  GUID = 'guid',
  DATE = 'date',
  DBDATE = 'dbdate',
  DBTIME = 'dbtime',
  DBTIMESTAMP = 'dbtimestamp',
  BSTR = 'bstr',
  CHAR = 'char',
  VARCHAR = 'varchar',
  LONGVARCHAR = 'longvarchar',
  WCHAR = 'wchar',
  VARWCHAR = 'varwchar',
  LONGVARWCHAR = 'longvarwchar',
  BINARY = 'binary',
  VARBINARY = 'varbinary',
  LONGVARBINARY = 'longvarbinary',
}

export interface DataRelation {
  id: string;
  name: string;
  type: DataRelationType;

  // Parent command/table
  parentCommandId: string;
  parentFields: string[];

  // Child command/table
  childCommandId: string;
  childFields: string[];

  // Relation properties
  cascadeUpdate: boolean;
  cascadeDelete: boolean;
  enforceConstraints: boolean;

  // Metadata
  created: Date;
  modified: Date;
}

export interface DataEnvironment {
  id: string;
  name: string;
  description: string;
  version: string;

  // Connections
  connections: Map<string, DataConnection>;
  defaultConnection?: string;

  // Global settings
  settings: {
    autoCommit: boolean;
    cursorLocation: 'client' | 'server';
    isolationLevel: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
    loginTimeout: number;
    queryTimeout: number;
  };

  // Metadata
  created: Date;
  modified: Date;
  author: string;
}

export interface DataEnvironmentEvent {
  type:
    | 'connection_open'
    | 'connection_close'
    | 'command_execute'
    | 'recordset_open'
    | 'recordset_close'
    | 'error';
  source: string;
  data: DataEnvEventPayload;
  timestamp: Date;
}

export class VB6DataEnvironment {
  private static instance: VB6DataEnvironment;
  private environments: Map<string, DataEnvironment> = new Map();
  private currentEnvironment: DataEnvironment | null = null;
  private eventHandlers: Map<string, ((event: DataEnvironmentEvent) => void)[]> = new Map();
  private isInitialized: boolean = false;

  static getInstance(): VB6DataEnvironment {
    if (!VB6DataEnvironment.instance) {
      VB6DataEnvironment.instance = new VB6DataEnvironment();
    }
    return VB6DataEnvironment.instance;
  }

  constructor() {
    this.initializeDataEnvironment();
  }

  private initializeDataEnvironment(): void {
    this.createSampleEnvironment();
    this.isInitialized = true;
  }

  private createSampleEnvironment(): void {
    // Create Northwind sample environment
    const northwindEnv: DataEnvironment = {
      id: 'northwind-env',
      name: 'Northwind Data Environment',
      description: 'Sample data environment for Northwind database',
      version: '1.0',
      connections: new Map(),
      settings: {
        autoCommit: true,
        cursorLocation: 'client',
        isolationLevel: 'read_committed',
        loginTimeout: 15,
        queryTimeout: 30,
      },
      created: new Date('2002-01-01'),
      modified: new Date(),
      author: 'System',
    };

    // Create sample connection
    const northwindConnection: DataConnection = {
      id: 'northwind-conn',
      name: 'cnNorthwind',
      displayName: 'Northwind Database Connection',
      type: DataConnectionType.OLEDB,
      provider: 'Microsoft.Jet.OLEDB.4.0',
      dataSource: 'C:\\Program Files\\Microsoft Visual Studio\\VB98\\Nwind.mdb',
      integratedSecurity: false,
      persistSecurityInfo: false,
      connectionTimeout: 15,
      commandTimeout: 30,
      cursorLocation: 'client',
      lockType: 'optimistic',
      state: 'closed',
      connectionString:
        'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\\Program Files\\Microsoft Visual Studio\\VB98\\Nwind.mdb;Persist Security Info=False',
      created: new Date('2002-01-01'),
      modified: new Date(),
      commands: [],
      relations: [],
    };

    // Create sample commands
    const customersCommand: DataCommand = {
      id: 'customers-cmd',
      name: 'cmCustomers',
      displayName: 'Customers Command',
      type: DataCommandType.TABLE,
      connectionId: 'northwind-conn',
      commandText: 'SELECT * FROM Customers',
      tableName: 'Customers',
      parameters: [],
      cursorType: 'keyset',
      lockType: 'optimistic',
      prepared: false,
      fields: [
        {
          name: 'CustomerID',
          type: DataFieldType.CHAR,
          size: 5,
          allowNull: false,
          primaryKey: true,
          autoIncrement: false,
        },
        {
          name: 'CompanyName',
          type: DataFieldType.VARCHAR,
          size: 40,
          allowNull: false,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ContactName',
          type: DataFieldType.VARCHAR,
          size: 30,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ContactTitle',
          type: DataFieldType.VARCHAR,
          size: 30,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Address',
          type: DataFieldType.VARCHAR,
          size: 60,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'City',
          type: DataFieldType.VARCHAR,
          size: 15,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Region',
          type: DataFieldType.VARCHAR,
          size: 15,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'PostalCode',
          type: DataFieldType.VARCHAR,
          size: 10,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Country',
          type: DataFieldType.VARCHAR,
          size: 15,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Phone',
          type: DataFieldType.VARCHAR,
          size: 24,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Fax',
          type: DataFieldType.VARCHAR,
          size: 24,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
      ],
      created: new Date('2002-01-01'),
      modified: new Date(),
    };

    const ordersCommand: DataCommand = {
      id: 'orders-cmd',
      name: 'cmOrders',
      displayName: 'Orders Command',
      type: DataCommandType.TABLE,
      connectionId: 'northwind-conn',
      commandText: 'SELECT * FROM Orders',
      tableName: 'Orders',
      parameters: [],
      cursorType: 'keyset',
      lockType: 'optimistic',
      prepared: false,
      fields: [
        {
          name: 'OrderID',
          type: DataFieldType.INTEGER,
          size: 4,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        {
          name: 'CustomerID',
          type: DataFieldType.CHAR,
          size: 5,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'EmployeeID',
          type: DataFieldType.INTEGER,
          size: 4,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'OrderDate',
          type: DataFieldType.DBTIMESTAMP,
          size: 8,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'RequiredDate',
          type: DataFieldType.DBTIMESTAMP,
          size: 8,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShippedDate',
          type: DataFieldType.DBTIMESTAMP,
          size: 8,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShipVia',
          type: DataFieldType.INTEGER,
          size: 4,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Freight',
          type: DataFieldType.CURRENCY,
          size: 8,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
          defaultValue: 0,
        },
        {
          name: 'ShipName',
          type: DataFieldType.VARCHAR,
          size: 40,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShipAddress',
          type: DataFieldType.VARCHAR,
          size: 60,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShipCity',
          type: DataFieldType.VARCHAR,
          size: 15,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShipRegion',
          type: DataFieldType.VARCHAR,
          size: 15,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShipPostalCode',
          type: DataFieldType.VARCHAR,
          size: 10,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ShipCountry',
          type: DataFieldType.VARCHAR,
          size: 15,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
      ],
      created: new Date('2002-01-01'),
      modified: new Date(),
    };

    const customerOrdersCommand: DataCommand = {
      id: 'customer-orders-cmd',
      name: 'cmCustomerOrders',
      displayName: 'Customer Orders Query',
      type: DataCommandType.SQL_STATEMENT,
      connectionId: 'northwind-conn',
      commandText: `SELECT c.CompanyName, c.ContactName, o.OrderID, o.OrderDate, o.Freight 
                    FROM Customers c INNER JOIN Orders o ON c.CustomerID = o.CustomerID 
                    WHERE c.CustomerID = ?`,
      parameters: [
        {
          id: 'customer-id-param',
          name: '@CustomerID',
          direction: ParameterDirection.INPUT,
          type: DataFieldType.CHAR,
          size: 5,
          allowNull: false,
          defaultValue: 'ALFKI',
        },
      ],
      cursorType: 'forward_only',
      lockType: 'readonly',
      prepared: true,
      fields: [
        {
          name: 'CompanyName',
          type: DataFieldType.VARCHAR,
          size: 40,
          allowNull: false,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'ContactName',
          type: DataFieldType.VARCHAR,
          size: 30,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'OrderID',
          type: DataFieldType.INTEGER,
          size: 4,
          allowNull: false,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'OrderDate',
          type: DataFieldType.DBTIMESTAMP,
          size: 8,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
        {
          name: 'Freight',
          type: DataFieldType.CURRENCY,
          size: 8,
          allowNull: true,
          primaryKey: false,
          autoIncrement: false,
        },
      ],
      created: new Date('2002-01-01'),
      modified: new Date(),
    };

    // Add commands to connection
    northwindConnection.commands = [customersCommand, ordersCommand, customerOrdersCommand];

    // Create relation
    const customerOrdersRelation: DataRelation = {
      id: 'customer-orders-rel',
      name: 'CustomerOrders',
      type: DataRelationType.ONE_TO_MANY,
      parentCommandId: 'customers-cmd',
      parentFields: ['CustomerID'],
      childCommandId: 'orders-cmd',
      childFields: ['CustomerID'],
      cascadeUpdate: true,
      cascadeDelete: false,
      enforceConstraints: true,
      created: new Date('2002-01-01'),
      modified: new Date(),
    };

    northwindConnection.relations = [customerOrdersRelation];

    // Add connection to environment
    northwindEnv.connections.set(northwindConnection.id, northwindConnection);
    northwindEnv.defaultConnection = northwindConnection.id;

    // Store environment
    this.environments.set(northwindEnv.id, northwindEnv);
    this.currentEnvironment = northwindEnv;
  }

  // Environment Management
  createEnvironment(name: string, description: string = '', author: string = ''): DataEnvironment {
    const environment: DataEnvironment = {
      id: `env-${Date.now()}`,
      name,
      description,
      version: '1.0',
      connections: new Map(),
      settings: {
        autoCommit: true,
        cursorLocation: 'client',
        isolationLevel: 'read_committed',
        loginTimeout: 15,
        queryTimeout: 30,
      },
      created: new Date(),
      modified: new Date(),
      author,
    };

    this.environments.set(environment.id, environment);
    this.currentEnvironment = environment;
    return environment;
  }

  openEnvironment(environmentId: string): boolean {
    const environment = this.environments.get(environmentId);
    if (environment) {
      this.currentEnvironment = environment;
      this.fireEvent('connection_open', environmentId, { environment });
      return true;
    }
    return false;
  }

  saveEnvironment(environmentId?: string): boolean {
    const env = environmentId ? this.environments.get(environmentId) : this.currentEnvironment;
    if (env) {
      env.modified = new Date();
      logger.info(`Saved Data Environment: ${env.name}`);
      return true;
    }
    return false;
  }

  closeEnvironment(): boolean {
    if (this.currentEnvironment) {
      // Close all connections
      for (const connection of this.currentEnvironment.connections.values()) {
        this.closeConnection(connection.id);
      }
      this.currentEnvironment = null;
      return true;
    }
    return false;
  }

  getCurrentEnvironment(): DataEnvironment | null {
    return this.currentEnvironment;
  }

  getAllEnvironments(): DataEnvironment[] {
    return Array.from(this.environments.values());
  }

  // Connection Management
  addConnection(
    connection: Omit<DataConnection, 'id' | 'created' | 'modified' | 'commands' | 'relations'>
  ): DataConnection {
    if (!this.currentEnvironment) {
      throw new Error('No environment is currently open');
    }

    const newConnection: DataConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
      created: new Date(),
      modified: new Date(),
      commands: [],
      relations: [],
    };

    this.currentEnvironment.connections.set(newConnection.id, newConnection);
    this.currentEnvironment.modified = new Date();

    return newConnection;
  }

  removeConnection(connectionId: string): boolean {
    if (!this.currentEnvironment) return false;

    const connection = this.currentEnvironment.connections.get(connectionId);
    if (!connection) return false;

    // Close connection if open
    this.closeConnection(connectionId);

    // Remove connection
    this.currentEnvironment.connections.delete(connectionId);
    this.currentEnvironment.modified = new Date();

    return true;
  }

  getConnection(connectionId: string): DataConnection | null {
    if (!this.currentEnvironment) return null;
    return this.currentEnvironment.connections.get(connectionId) || null;
  }

  getAllConnections(): DataConnection[] {
    if (!this.currentEnvironment) return [];
    return Array.from(this.currentEnvironment.connections.values());
  }

  async openConnection(connectionId: string): Promise<boolean> {
    const connection = this.getConnection(connectionId);
    if (!connection) return false;

    try {
      connection.state = 'connecting';

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 500));

      connection.state = 'open';
      connection.lastUsed = new Date();

      this.fireEvent('connection_open', connectionId, { connection });
      logger.info(`Opened connection: ${connection.name}`);

      return true;
    } catch (error) {
      connection.state = 'broken';
      connection.lastError = String(error);
      this.fireEvent('error', connectionId, { error, connection });
      return false;
    }
  }

  closeConnection(connectionId: string): boolean {
    const connection = this.getConnection(connectionId);
    if (!connection) return false;

    connection.state = 'closed';
    this.fireEvent('connection_close', connectionId, { connection });
    logger.info(`Closed connection: ${connection.name}`);

    return true;
  }

  testConnection(connectionId: string): Promise<boolean> {
    return new Promise(resolve => {
      const connection = this.getConnection(connectionId);
      if (!connection) {
        resolve(false);
        return;
      }

      logger.debug(`Testing connection: ${connection.name}`);

      // Simulate connection test
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          logger.info(`Connection test successful: ${connection.name}`);
        } else {
          connection.lastError = 'Connection timeout';
          logger.warn(`Connection test failed: ${connection.name}`);
        }
        resolve(success);
      }, 1000);
    });
  }

  // Command Management
  addCommand(
    connectionId: string,
    command: Omit<DataCommand, 'id' | 'connectionId' | 'created' | 'modified'>
  ): DataCommand {
    const connection = this.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const newCommand: DataCommand = {
      ...command,
      id: `cmd-${Date.now()}`,
      connectionId,
      created: new Date(),
      modified: new Date(),
    };

    connection.commands.push(newCommand);
    connection.modified = new Date();

    if (this.currentEnvironment) {
      this.currentEnvironment.modified = new Date();
    }

    return newCommand;
  }

  removeCommand(connectionId: string, commandId: string): boolean {
    const connection = this.getConnection(connectionId);
    if (!connection) return false;

    const commandIndex = connection.commands.findIndex(cmd => cmd.id === commandId);
    if (commandIndex === -1) return false;

    connection.commands.splice(commandIndex, 1);
    connection.modified = new Date();

    if (this.currentEnvironment) {
      this.currentEnvironment.modified = new Date();
    }

    return true;
  }

  getCommand(connectionId: string, commandId: string): DataCommand | null {
    const connection = this.getConnection(connectionId);
    if (!connection) return null;

    return connection.commands.find(cmd => cmd.id === commandId) || null;
  }

  async executeCommand(
    connectionId: string,
    commandId: string,
    parameters?: Map<string, DataParameterValue>
  ): Promise<DataEnvRecord[]> {
    const connection = this.getConnection(connectionId);
    const command = this.getCommand(connectionId, commandId);

    if (!connection || !command) {
      throw new Error('Connection or command not found');
    }

    if (connection.state !== 'open') {
      const opened = await this.openConnection(connectionId);
      if (!opened) {
        throw new Error('Failed to open connection');
      }
    }

    try {
      connection.state = 'executing';
      command.lastExecuted = new Date();

      // Set parameters if provided
      if (parameters) {
        for (const [paramName, value] of parameters) {
          const param = command.parameters.find(
            p => p.name === paramName || p.name === `@${paramName}`
          );
          if (param) {
            param.value = value;
          }
        }
      }

      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate sample data based on command type
      const sampleData = this.generateSampleData(command);
      command.recordCount = sampleData.length;

      connection.state = 'open';
      this.fireEvent('command_execute', commandId, {
        command,
        connection,
        recordCount: sampleData.length,
      });

      logger.info(`Executed command: ${command.name} (${sampleData.length} records)`);
      return sampleData;
    } catch (error) {
      connection.state = 'broken';
      connection.lastError = String(error);
      this.fireEvent('error', commandId, { error, command, connection });
      throw error;
    }
  }

  private generateSampleData(command: DataCommand): DataEnvRecord[] {
    const sampleCount = Math.floor(Math.random() * 20) + 5; // 5-25 records
    const data: DataEnvRecord[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const record: DataEnvRecord = {};

      for (const field of command.fields) {
        record[field.name] = this.generateSampleValue(field);
      }

      data.push(record);
    }

    return data;
  }

  private generateSampleValue(field: DataField): DataParameterValue {
    switch (field.type) {
      case DataFieldType.INTEGER:
      case DataFieldType.SMALLINT:
      case DataFieldType.BIGINT:
        return Math.floor(Math.random() * 1000) + 1;

      case DataFieldType.SINGLE:
      case DataFieldType.DOUBLE:
      case DataFieldType.DECIMAL:
      case DataFieldType.NUMERIC:
        return Math.random() * 1000;

      case DataFieldType.CURRENCY:
        return Math.random() * 100;

      case DataFieldType.BOOLEAN:
        return Math.random() > 0.5;

      case DataFieldType.DATE:
      case DataFieldType.DBTIMESTAMP:
        return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

      case DataFieldType.VARCHAR:
      case DataFieldType.CHAR:
      case DataFieldType.BSTR: {
        const strings = ['Sample', 'Test', 'Data', 'Value', 'Example', 'Demo', 'Item'];
        return (
          strings[Math.floor(Math.random() * strings.length)] +
          ' ' +
          (Math.floor(Math.random() * 100) + 1)
        );
      }

      default:
        return `Sample ${field.type}`;
    }
  }

  // Relation Management
  addRelation(relation: Omit<DataRelation, 'id' | 'created' | 'modified'>): DataRelation {
    if (!this.currentEnvironment) {
      throw new Error('No environment is currently open');
    }

    const newRelation: DataRelation = {
      ...relation,
      id: `rel-${Date.now()}`,
      created: new Date(),
      modified: new Date(),
    };

    // Add relation to appropriate connection
    const parentConnection = this.getConnectionByCommand(relation.parentCommandId);
    if (parentConnection) {
      parentConnection.relations.push(newRelation);
      parentConnection.modified = new Date();
    }

    this.currentEnvironment.modified = new Date();
    return newRelation;
  }

  removeRelation(relationId: string): boolean {
    if (!this.currentEnvironment) return false;

    for (const connection of this.currentEnvironment.connections.values()) {
      const relationIndex = connection.relations.findIndex(rel => rel.id === relationId);
      if (relationIndex >= 0) {
        connection.relations.splice(relationIndex, 1);
        connection.modified = new Date();
        this.currentEnvironment.modified = new Date();
        return true;
      }
    }

    return false;
  }

  private getConnectionByCommand(commandId: string): DataConnection | null {
    if (!this.currentEnvironment) return null;

    for (const connection of this.currentEnvironment.connections.values()) {
      if (connection.commands.some(cmd => cmd.id === commandId)) {
        return connection;
      }
    }

    return null;
  }

  // Event Management
  addEventListener(eventType: string, handler: (event: DataEnvironmentEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  removeEventListener(eventType: string, handler: (event: DataEnvironmentEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  private fireEvent(
    type: DataEnvironmentEvent['type'],
    source: string,
    data: DataEnvEventPayload
  ): void {
    const event: DataEnvironmentEvent = {
      type,
      source,
      data,
      timestamp: new Date(),
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          logger.error(`Error in event handler for ${type}:`, error);
        }
      }
    }
  }

  // Utility Methods
  generateConnectionString(connection: Partial<DataConnection>): string {
    const parts: string[] = [];

    if (connection.provider) {
      parts.push(`Provider=${connection.provider}`);
    }

    if (connection.dataSource) {
      parts.push(`Data Source=${connection.dataSource}`);
    }

    if (connection.initialCatalog) {
      parts.push(`Initial Catalog=${connection.initialCatalog}`);
    }

    if (connection.userId && !connection.integratedSecurity) {
      parts.push(`User ID=${connection.userId}`);
    }

    if (connection.password && !connection.integratedSecurity) {
      parts.push(`Password=${connection.password}`);
    }

    if (connection.integratedSecurity) {
      parts.push('Integrated Security=SSPI');
    }

    if (connection.persistSecurityInfo !== undefined) {
      parts.push(`Persist Security Info=${connection.persistSecurityInfo}`);
    }

    if (connection.connectionTimeout && connection.connectionTimeout !== 15) {
      parts.push(`Connection Timeout=${connection.connectionTimeout}`);
    }

    return parts.join(';');
  }

  validateSQL(sql: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const sqlUpper = sql.toUpperCase().trim();

    // Basic SQL validation
    if (!sqlUpper) {
      errors.push('SQL statement cannot be empty');
      return { valid: false, errors };
    }

    // Check for basic SQL keywords
    const validStarters = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXEC', 'EXECUTE', 'CALL'];
    const hasValidStarter = validStarters.some(starter => sqlUpper.startsWith(starter));

    if (!hasValidStarter) {
      errors.push(
        'SQL statement must start with a valid command (SELECT, INSERT, UPDATE, DELETE, EXEC)'
      );
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of sql) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        errors.push('Unmatched closing parenthesis');
        break;
      }
    }
    if (parenCount > 0) {
      errors.push('Unmatched opening parenthesis');
    }

    // Check for basic SQL injection patterns (simple check)
    const suspiciousPatterns = [/;\s*(DROP|DELETE|TRUNCATE)/i, /UNION\s+SELECT/i, /--/, /\/\*/];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sql)) {
        errors.push('SQL statement contains potentially dangerous patterns');
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Statistics
  getEnvironmentStats(): {
    totalEnvironments: number;
    totalConnections: number;
    totalCommands: number;
    totalRelations: number;
    connectionsByType: Map<DataConnectionType, number>;
    commandsByType: Map<DataCommandType, number>;
  } {
    const stats = {
      totalEnvironments: this.environments.size,
      totalConnections: 0,
      totalCommands: 0,
      totalRelations: 0,
      connectionsByType: new Map<DataConnectionType, number>(),
      commandsByType: new Map<DataCommandType, number>(),
    };

    for (const env of this.environments.values()) {
      stats.totalConnections += env.connections.size;

      for (const conn of env.connections.values()) {
        // Count by connection type
        const connTypeCount = stats.connectionsByType.get(conn.type) || 0;
        stats.connectionsByType.set(conn.type, connTypeCount + 1);

        stats.totalCommands += conn.commands.length;
        stats.totalRelations += conn.relations.length;

        // Count by command type
        for (const cmd of conn.commands) {
          const cmdTypeCount = stats.commandsByType.get(cmd.type) || 0;
          stats.commandsByType.set(cmd.type, cmdTypeCount + 1);
        }
      }
    }

    return stats;
  }

  // VB6 Compatibility
  createDataEnvironmentObject(): VB6DataEnvironmentCompatObject {
    return {
      Connections: {
        Add: (name: string, connectionString: string) => {
          if (!this.currentEnvironment) return null;

          const connection = this.addConnection({
            name,
            displayName: name,
            type: DataConnectionType.ADO,
            provider: 'MSDASQL',
            dataSource: '',
            integratedSecurity: false,
            persistSecurityInfo: false,
            connectionTimeout: 15,
            commandTimeout: 30,
            cursorLocation: 'client',
            lockType: 'optimistic',
            state: 'closed',
            connectionString,
          });

          return {
            Name: connection.name,
            ConnectionString: connection.connectionString,
            Open: () => this.openConnection(connection.id),
            Close: () => this.closeConnection(connection.id),
            Execute: (sql: string) => this.executeCommand(connection.id, sql),
          };
        },

        Item: (name: string) => {
          const connection = this.getAllConnections().find(c => c.name === name);
          return connection
            ? {
                Name: connection.name,
                ConnectionString: connection.connectionString,
                State: connection.state,
              }
            : null;
        },
      },

      Commands: {
        Add: (name: string, connectionName: string) => {
          const connection = this.getAllConnections().find(c => c.name === connectionName);
          if (!connection) return null;

          const command = this.addCommand(connection.id, {
            name,
            displayName: name,
            type: DataCommandType.SQL_STATEMENT,
            commandText: '',
            parameters: [],
            cursorType: 'forward_only',
            lockType: 'readonly',
            prepared: false,
            fields: [],
          });

          return {
            Name: command.name,
            CommandText: command.commandText,
            Execute: (_params?: DataParameterValue[]) =>
              this.executeCommand(connection.id, command.id),
          };
        },
      },
    };
  }
}

/** VB6-compatible connection wrapper */
interface VB6ConnectionWrapper {
  Name: string;
  ConnectionString: string;
  Open: () => Promise<boolean>;
  Close: () => boolean;
  Execute: (sql: string) => Promise<DataEnvRecord[]>;
}

/** VB6-compatible connection info */
interface VB6ConnectionInfo {
  Name: string;
  ConnectionString: string;
  State: string;
}

/** VB6-compatible command wrapper */
interface VB6CommandWrapper {
  Name: string;
  CommandText: string;
  Execute: (_params?: DataParameterValue[]) => Promise<DataEnvRecord[]>;
}

/** VB6-compatible data environment object */
interface VB6DataEnvironmentCompatObject {
  Connections: {
    Add: (name: string, connectionString: string) => VB6ConnectionWrapper | null;
    Item: (name: string) => VB6ConnectionInfo | null;
  };
  Commands: {
    Add: (name: string, connectionName: string) => VB6CommandWrapper | null;
  };
}

// Global instance
export const VB6DataEnvironmentInstance = VB6DataEnvironment.getInstance();

logger.info('VB6 Data Environment Designer initialized with complete database design capabilities');
