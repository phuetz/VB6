/**
 * VB6 DataEnvironment Service
 * 
 * Service for managing data environments, connections, and commands
 */

import { 
  DataEnvironment, 
  DataConnection, 
  DataCommand, 
  DataParameter, 
  DataField 
} from '../components/Designer/DataEnvironmentDesigner';

// Mock data storage (in real app, this would connect to actual databases)
interface MockDatabase {
  name: string;
  tables: MockTable[];
  storedProcedures: MockStoredProcedure[];
}

interface MockTable {
  name: string;
  fields: DataField[];
  data: any[];
}

interface MockStoredProcedure {
  name: string;
  parameters: DataParameter[];
  resultSet: DataField[];
}

export class DataEnvironmentService {
  private static instance: DataEnvironmentService;
  private dataEnvironments: Map<string, DataEnvironment> = new Map();
  private mockDatabases: Map<string, MockDatabase> = new Map();
  
  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): DataEnvironmentService {
    if (!DataEnvironmentService.instance) {
      DataEnvironmentService.instance = new DataEnvironmentService();
    }
    return DataEnvironmentService.instance;
  }

  // Initialize mock databases for testing
  private initializeMockData() {
    // Northwind-like database
    const northwind: MockDatabase = {
      name: 'Northwind',
      tables: [
        {
          name: 'Customers',
          fields: [
            { id: '1', name: 'CustomerID', dataType: 'adChar', size: 5, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: true },
            { id: '2', name: 'CompanyName', dataType: 'adVarChar', size: 40, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false },
            { id: '3', name: 'ContactName', dataType: 'adVarChar', size: 30, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '4', name: 'ContactTitle', dataType: 'adVarChar', size: 30, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '5', name: 'Address', dataType: 'adVarChar', size: 60, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '6', name: 'City', dataType: 'adVarChar', size: 15, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '7', name: 'Region', dataType: 'adVarChar', size: 15, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '8', name: 'PostalCode', dataType: 'adVarChar', size: 10, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '9', name: 'Country', dataType: 'adVarChar', size: 15, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '10', name: 'Phone', dataType: 'adVarChar', size: 24, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '11', name: 'Fax', dataType: 'adVarChar', size: 24, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false }
          ],
          data: [
            { CustomerID: 'ALFKI', CompanyName: 'Alfreds Futterkiste', ContactName: 'Maria Anders', ContactTitle: 'Sales Representative', Address: 'Obere Str. 57', City: 'Berlin', Region: null, PostalCode: '12209', Country: 'Germany', Phone: '030-0074321', Fax: '030-0076545' },
            { CustomerID: 'ANATR', CompanyName: 'Ana Trujillo Emparedados y helados', ContactName: 'Ana Trujillo', ContactTitle: 'Owner', Address: 'Avda. de la Constitución 2222', City: 'México D.F.', Region: null, PostalCode: '05021', Country: 'Mexico', Phone: '(5) 555-4729', Fax: '(5) 555-3745' },
            { CustomerID: 'ANTON', CompanyName: 'Antonio Moreno Taquería', ContactName: 'Antonio Moreno', ContactTitle: 'Owner', Address: 'Mataderos 2312', City: 'México D.F.', Region: null, PostalCode: '05023', Country: 'Mexico', Phone: '(5) 555-3932', Fax: null }
          ]
        },
        {
          name: 'Products',
          fields: [
            { id: '1', name: 'ProductID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: false, autoIncrement: true, primaryKey: true },
            { id: '2', name: 'ProductName', dataType: 'adVarChar', size: 40, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false },
            { id: '3', name: 'SupplierID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '4', name: 'CategoryID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '5', name: 'QuantityPerUnit', dataType: 'adVarChar', size: 20, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '6', name: 'UnitPrice', dataType: 'adCurrency', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '7', name: 'UnitsInStock', dataType: 'adSmallInt', size: 2, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '8', name: 'UnitsOnOrder', dataType: 'adSmallInt', size: 2, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '9', name: 'ReorderLevel', dataType: 'adSmallInt', size: 2, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '10', name: 'Discontinued', dataType: 'adBoolean', size: 1, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false }
          ],
          data: [
            { ProductID: 1, ProductName: 'Chai', SupplierID: 1, CategoryID: 1, QuantityPerUnit: '10 boxes x 20 bags', UnitPrice: 18.00, UnitsInStock: 39, UnitsOnOrder: 0, ReorderLevel: 10, Discontinued: false },
            { ProductID: 2, ProductName: 'Chang', SupplierID: 1, CategoryID: 1, QuantityPerUnit: '24 - 12 oz bottles', UnitPrice: 19.00, UnitsInStock: 17, UnitsOnOrder: 40, ReorderLevel: 25, Discontinued: false },
            { ProductID: 3, ProductName: 'Aniseed Syrup', SupplierID: 1, CategoryID: 2, QuantityPerUnit: '12 - 550 ml bottles', UnitPrice: 10.00, UnitsInStock: 13, UnitsOnOrder: 70, ReorderLevel: 25, Discontinued: false }
          ]
        },
        {
          name: 'Orders',
          fields: [
            { id: '1', name: 'OrderID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: false, autoIncrement: true, primaryKey: true },
            { id: '2', name: 'CustomerID', dataType: 'adChar', size: 5, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '3', name: 'EmployeeID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '4', name: 'OrderDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '5', name: 'RequiredDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '6', name: 'ShippedDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '7', name: 'ShipVia', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '8', name: 'Freight', dataType: 'adCurrency', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false }
          ],
          data: [
            { OrderID: 10248, CustomerID: 'VINET', EmployeeID: 5, OrderDate: new Date('1996-07-04'), RequiredDate: new Date('1996-08-01'), ShippedDate: new Date('1996-07-16'), ShipVia: 3, Freight: 32.38 },
            { OrderID: 10249, CustomerID: 'TOMSP', EmployeeID: 6, OrderDate: new Date('1996-07-05'), RequiredDate: new Date('1996-08-16'), ShippedDate: new Date('1996-07-10'), ShipVia: 1, Freight: 11.61 }
          ]
        }
      ],
      storedProcedures: [
        {
          name: 'CustOrdersOrders',
          parameters: [
            { id: '1', name: '@CustomerID', direction: 1, dataType: 'adChar', size: 5, precision: 0, scale: 0, value: null }
          ],
          resultSet: [
            { id: '1', name: 'OrderID', dataType: 'adInteger', size: 4, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false },
            { id: '2', name: 'OrderDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '3', name: 'RequiredDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false },
            { id: '4', name: 'ShippedDate', dataType: 'adDate', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false }
          ]
        },
        {
          name: 'SalesByCategory',
          parameters: [
            { id: '1', name: '@CategoryName', direction: 1, dataType: 'adVarChar', size: 15, precision: 0, scale: 0, value: null },
            { id: '2', name: '@OrdYear', direction: 1, dataType: 'adVarChar', size: 4, precision: 0, scale: 0, value: null }
          ],
          resultSet: [
            { id: '1', name: 'ProductName', dataType: 'adVarChar', size: 40, precision: 0, scale: 0, allowNull: false, autoIncrement: false, primaryKey: false },
            { id: '2', name: 'TotalPurchase', dataType: 'adCurrency', size: 8, precision: 0, scale: 0, allowNull: true, autoIncrement: false, primaryKey: false }
          ]
        }
      ]
    };

    this.mockDatabases.set('Northwind', northwind);
  }

  // Save DataEnvironment
  saveDataEnvironment(dataEnvironment: DataEnvironment): void {
    this.dataEnvironments.set(dataEnvironment.id, dataEnvironment);
  }

  // Load DataEnvironment
  loadDataEnvironment(id: string): DataEnvironment | undefined {
    return this.dataEnvironments.get(id);
  }

  // Get all DataEnvironments
  getAllDataEnvironments(): DataEnvironment[] {
    return Array.from(this.dataEnvironments.values());
  }

  // Delete DataEnvironment
  deleteDataEnvironment(id: string): boolean {
    return this.dataEnvironments.delete(id);
  }

  // Test connection
  async testConnection(connection: DataConnection): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if mock database exists
      if (connection.initialCatalog && this.mockDatabases.has(connection.initialCatalog)) {
        return { success: true, message: 'Connection successful!' };
      } else {
        return { success: false, message: `Database "${connection.initialCatalog}" not found` };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  // Get database schema
  async getDatabaseSchema(connection: DataConnection): Promise<{
    tables: string[];
    storedProcedures: string[];
  }> {
    const db = this.mockDatabases.get(connection.initialCatalog);
    if (!db) {
      throw new Error(`Database "${connection.initialCatalog}" not found`);
    }

    return {
      tables: db.tables.map(t => t.name),
      storedProcedures: db.storedProcedures.map(sp => sp.name)
    };
  }

  // Get table fields
  async getTableFields(connection: DataConnection, tableName: string): Promise<DataField[]> {
    const db = this.mockDatabases.get(connection.initialCatalog);
    if (!db) {
      throw new Error(`Database "${connection.initialCatalog}" not found`);
    }

    const table = db.tables.find(t => t.name === tableName);
    if (!table) {
      throw new Error(`Table "${tableName}" not found`);
    }

    return table.fields;
  }

  // Get stored procedure parameters
  async getStoredProcedureInfo(connection: DataConnection, procName: string): Promise<{
    parameters: DataParameter[];
    resultSet: DataField[];
  }> {
    const db = this.mockDatabases.get(connection.initialCatalog);
    if (!db) {
      throw new Error(`Database "${connection.initialCatalog}" not found`);
    }

    const proc = db.storedProcedures.find(sp => sp.name === procName);
    if (!proc) {
      throw new Error(`Stored procedure "${procName}" not found`);
    }

    return {
      parameters: proc.parameters,
      resultSet: proc.resultSet
    };
  }

  // Execute command (returns mock data)
  async executeCommand(connection: DataConnection, command: DataCommand): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const db = this.mockDatabases.get(connection.initialCatalog);
      if (!db) {
        return { success: false, error: `Database "${connection.initialCatalog}" not found` };
      }

      // Handle different command types
      if (command.commandType === 2) { // Table
        const table = db.tables.find(t => t.name === command.commandText);
        if (!table) {
          return { success: false, error: `Table "${command.commandText}" not found` };
        }
        return { success: true, data: table.data };
      } else if (command.commandType === 4) { // Stored Procedure
        const proc = db.storedProcedures.find(sp => sp.name === command.commandText);
        if (!proc) {
          return { success: false, error: `Stored procedure "${command.commandText}" not found` };
        }
        // Return mock data based on procedure
        return { success: true, data: [] };
      } else { // SQL Text
        // Parse simple SELECT statements
        const selectMatch = command.commandText.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
        if (selectMatch) {
          const tableName = selectMatch[2];
          const table = db.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
          if (!table) {
            return { success: false, error: `Table "${tableName}" not found` };
          }
          return { success: true, data: table.data };
        }
      }

      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate VB6 code for DataEnvironment
  generateVB6Code(dataEnvironment: DataEnvironment): string {
    let code = `' Generated DataEnvironment Code\n`;
    code += `' Name: ${dataEnvironment.name}\n`;
    code += `' Generated: ${new Date().toLocaleString()}\n\n`;
    
    code += `Option Explicit\n\n`;
    
    // Class header
    code += `Private mConnections As Collection\n`;
    code += `Private mCommands As Collection\n\n`;
    
    // Initialize method
    code += `Private Sub Class_Initialize()\n`;
    code += `    Set mConnections = New Collection\n`;
    code += `    Set mCommands = New Collection\n`;
    code += `    InitializeConnections\n`;
    code += `    InitializeCommands\n`;
    code += `End Sub\n\n`;
    
    // Generate connection initialization
    code += `Private Sub InitializeConnections()\n`;
    code += `    Dim conn As ADODB.Connection\n\n`;
    
    dataEnvironment.connections.forEach(conn => {
      code += `    ' Connection: ${conn.name}\n`;
      code += `    Set conn = New ADODB.Connection\n`;
      code += `    conn.ConnectionString = "${this.buildConnectionString(conn)}"\n`;
      code += `    conn.CommandTimeout = ${conn.commandTimeout}\n`;
      code += `    conn.CursorLocation = ${conn.cursorLocation}\n`;
      code += `    mConnections.Add conn, "${conn.name}"\n\n`;
    });
    
    code += `End Sub\n\n`;
    
    // Generate command initialization
    code += `Private Sub InitializeCommands()\n`;
    code += `    Dim cmd As ADODB.Command\n`;
    code += `    Dim param As ADODB.Parameter\n\n`;
    
    dataEnvironment.connections.forEach(conn => {
      conn.commands.forEach(cmd => {
        code += this.generateCommandCode(cmd, conn.name);
      });
    });
    
    code += `End Sub\n\n`;
    
    // Generate connection properties
    dataEnvironment.connections.forEach(conn => {
      code += `Public Property Get ${conn.name}() As ADODB.Connection\n`;
      code += `    Set ${conn.name} = mConnections("${conn.name}")\n`;
      code += `End Property\n\n`;
    });
    
    // Generate command properties and methods
    dataEnvironment.connections.forEach(conn => {
      conn.commands.forEach(cmd => {
        code += `Public Property Get ${cmd.name}() As ADODB.Command\n`;
        code += `    Set ${cmd.name} = mCommands("${cmd.name}")\n`;
        code += `End Property\n\n`;
        
        // Generate recordset method
        code += `Public Function rs${cmd.name}(`
        const params = cmd.parameters.filter(p => p.direction === 1 || p.direction === 3);
        code += params.map(p => `${p.name} As Variant`).join(', ');
        code += `) As ADODB.Recordset\n`;
        code += `    Dim rs As ADODB.Recordset\n`;
        
        // Set parameter values
        params.forEach((p, i) => {
          code += `    ${cmd.name}.Parameters(${i}).Value = ${p.name}\n`;
        });
        
        code += `    Set rs = ${cmd.name}.Execute\n`;
        code += `    Set rs${cmd.name} = rs\n`;
        code += `End Function\n\n`;
      });
    });
    
    // Cleanup method
    code += `Private Sub Class_Terminate()\n`;
    code += `    Dim conn As ADODB.Connection\n`;
    code += `    Dim cmd As ADODB.Command\n\n`;
    code += `    ' Close connections\n`;
    code += `    For Each conn In mConnections\n`;
    code += `        If conn.State = adStateOpen Then conn.Close\n`;
    code += `    Next\n\n`;
    code += `    ' Clean up\n`;
    code += `    Set mConnections = Nothing\n`;
    code += `    Set mCommands = Nothing\n`;
    code += `End Sub\n`;
    
    return code;
  }

  // Build connection string from connection properties
  private buildConnectionString(connection: DataConnection): string {
    let connStr = `Provider=${connection.provider};`;
    
    if (connection.dataSource) {
      connStr += `Data Source=${connection.dataSource};`;
    }
    
    if (connection.initialCatalog) {
      connStr += `Initial Catalog=${connection.initialCatalog};`;
    }
    
    if (connection.userID) {
      connStr += `User ID=${connection.userID};`;
      if (connection.password) {
        connStr += `Password=${connection.password};`;
      }
    } else {
      connStr += `Integrated Security=SSPI;`;
    }
    
    return connStr;
  }

  // Generate command code
  private generateCommandCode(command: DataCommand, connectionName: string): string {
    let code = `    ' Command: ${command.name}\n`;
    code += `    Set cmd = New ADODB.Command\n`;
    code += `    Set cmd.ActiveConnection = mConnections("${connectionName}")\n`;
    code += `    cmd.CommandType = ${command.commandType}\n`;
    code += `    cmd.CommandText = "${command.commandText}"\n`;
    code += `    cmd.CommandTimeout = ${command.commandTimeout}\n`;
    
    if (command.prepared) {
      code += `    cmd.Prepared = True\n`;
    }
    
    // Add parameters
    command.parameters.forEach(param => {
      code += `    Set param = cmd.CreateParameter("${param.name}", ${this.getADODataType(param.dataType)}, ${param.direction}, ${param.size})\n`;
      if (param.value !== null) {
        code += `    param.Value = ${this.formatParameterValue(param.value, param.dataType)}\n`;
      }
      code += `    cmd.Parameters.Append param\n`;
    });
    
    code += `    mCommands.Add cmd, "${command.name}"\n\n`;
    
    return code;
  }

  // Get ADO data type constant
  private getADODataType(dataType: string): number {
    const typeMap: { [key: string]: number } = {
      'adSmallInt': 2,
      'adInteger': 3,
      'adSingle': 4,
      'adDouble': 5,
      'adCurrency': 6,
      'adDate': 7,
      'adBSTR': 8,
      'adBoolean': 11,
      'adVariant': 12,
      'adDecimal': 14,
      'adTinyInt': 16,
      'adBigInt': 20,
      'adGUID': 72,
      'adChar': 129,
      'adVarChar': 200,
      'adLongVarChar': 201
    };
    
    return typeMap[dataType] || 200; // Default to adVarChar
  }

  // Format parameter value for VB6 code
  private formatParameterValue(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return 'Null';
    }
    
    if (dataType.includes('Char') || dataType === 'adBSTR') {
      return `"${value}"`;
    }
    
    if (dataType === 'adDate') {
      return `#${value}#`;
    }
    
    if (dataType === 'adBoolean') {
      return value ? 'True' : 'False';
    }
    
    return String(value);
  }
}

// Export singleton instance
export const dataEnvironmentService = DataEnvironmentService.getInstance();