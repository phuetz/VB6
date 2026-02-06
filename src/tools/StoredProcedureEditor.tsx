import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Play,
  Pause,
  Square,
  FileCode,
  Database,
  Settings,
  Users,
  Clock,
  BookOpen,
  Eye,
  Code,
  AlertTriangle,
  TrendingUp,
  FileText,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Bug,
  Zap,
} from 'lucide-react';

// Types
export enum ParameterDirection {
  IN = 'IN',
  OUT = 'OUT',
  INOUT = 'INOUT',
  RETURN = 'RETURN',
}

export enum DataType {
  // Numeric types
  BIT = 'bit',
  TINYINT = 'tinyint',
  SMALLINT = 'smallint',
  INT = 'int',
  BIGINT = 'bigint',
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  MONEY = 'money',
  SMALLMONEY = 'smallmoney',
  FLOAT = 'float',
  REAL = 'real',

  // Character types
  CHAR = 'char',
  VARCHAR = 'varchar',
  TEXT = 'text',
  NCHAR = 'nchar',
  NVARCHAR = 'nvarchar',
  NTEXT = 'ntext',

  // Date/Time types
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DATETIME2 = 'datetime2',
  SMALLDATETIME = 'smalldatetime',
  DATETIMEOFFSET = 'datetimeoffset',
  TIMESTAMP = 'timestamp',

  // Binary types
  BINARY = 'binary',
  VARBINARY = 'varbinary',
  IMAGE = 'image',

  // Other types
  UNIQUEIDENTIFIER = 'uniqueidentifier',
  XML = 'xml',
  JSON = 'json',
  TABLE = 'table',
  CURSOR = 'cursor',
  SQL_VARIANT = 'sql_variant',
}

export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface StoredProcParameter {
  id: string;
  name: string;
  direction: ParameterDirection;
  dataType: DataType;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: string;
  description?: string;
  testValue?: string;
}

export interface ExecutionResult {
  id: string;
  timestamp: Date;
  duration: number;
  status: ExecutionStatus;
  resultSets: Array<{
    columnNames: string[];
    rows: any[][];
    rowCount: number;
  }>;
  outputParameters?: Record<string, any>;
  errorMessage?: string;
  executionPlan?: string;
  statistics?: {
    cpuTime: number;
    logicalReads: number;
    physicalReads: number;
    duration: number;
  };
}

export interface ProcedureVersion {
  id: string;
  version: number;
  createdDate: Date;
  createdBy: string;
  comment: string;
  body: string;
  parameters: StoredProcParameter[];
}

export interface StoredProcedure {
  id: string;
  name: string;
  schema: string;
  body: string;
  parameters: StoredProcParameter[];
  description?: string;
  createdDate: Date;
  modifiedDate: Date;
  createdBy: string;
  modifiedBy: string;
  versions: ProcedureVersion[];
  permissions: Array<{
    principal: string;
    permission: string;
    grantOption: boolean;
  }>;
  dependencies: Array<{
    name: string;
    type: 'table' | 'view' | 'procedure' | 'function';
    schema: string;
  }>;
}

export interface ProcedureTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  parameters: StoredProcParameter[];
}

interface StoredProcedureEditorProps {
  isOpen: boolean;
  onClose: () => void;
  procedure?: StoredProcedure;
  onSave?: (procedure: StoredProcedure) => void;
}

export const StoredProcedureEditor: React.FC<StoredProcedureEditorProps> = ({
  isOpen,
  onClose,
  procedure,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'editor'
    | 'parameters'
    | 'execute'
    | 'results'
    | 'plan'
    | 'versions'
    | 'permissions'
    | 'dependencies'
  >('editor');
  const [editedProcedure, setEditedProcedure] = useState<StoredProcedure>(
    () =>
      procedure || {
        id: `proc-${Date.now()}`,
        name: 'NewProcedure',
        schema: 'dbo',
        body: `-- Stored Procedure Template\nCREATE PROCEDURE [dbo].[NewProcedure]\n    @Parameter1 INT = NULL,\n    @Parameter2 NVARCHAR(50) = NULL\nAS\nBEGIN\n    SET NOCOUNT ON;\n    \n    -- Your procedure logic here\n    SELECT 'Hello World' AS Message;\n    \nEND`,
        parameters: [],
        createdDate: new Date(),
        modifiedDate: new Date(),
        createdBy: 'current_user',
        modifiedBy: 'current_user',
        versions: [],
        permissions: [],
        dependencies: [],
      }
  );

  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcedureTemplate | null>(null);

  const templates: ProcedureTemplate[] = [
    {
      id: 'basic-crud-select',
      name: 'Basic SELECT',
      description: 'Simple SELECT procedure with parameters',
      category: 'CRUD',
      template: `CREATE PROCEDURE [dbo].[GetRecords]
    @ID INT = NULL,
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM YourTable
    WHERE (@ID IS NULL OR ID = @ID)
      AND (@Status IS NULL OR Status = @Status);
END`,
      parameters: [
        { id: '1', name: '@ID', direction: ParameterDirection.IN, dataType: DataType.INT },
        {
          id: '2',
          name: '@Status',
          direction: ParameterDirection.IN,
          dataType: DataType.NVARCHAR,
          length: 20,
        },
      ],
    },
    {
      id: 'crud-insert',
      name: 'INSERT with OUTPUT',
      description: 'Insert record and return generated ID',
      category: 'CRUD',
      template: `CREATE PROCEDURE [dbo].[InsertRecord]
    @Name NVARCHAR(100),
    @Email NVARCHAR(255),
    @NewID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO YourTable (Name, Email, CreatedDate)
    VALUES (@Name, @Email, GETDATE());
    
    SET @NewID = SCOPE_IDENTITY();
END`,
      parameters: [
        {
          id: '1',
          name: '@Name',
          direction: ParameterDirection.IN,
          dataType: DataType.NVARCHAR,
          length: 100,
        },
        {
          id: '2',
          name: '@Email',
          direction: ParameterDirection.IN,
          dataType: DataType.NVARCHAR,
          length: 255,
        },
        { id: '3', name: '@NewID', direction: ParameterDirection.OUT, dataType: DataType.INT },
      ],
    },
    {
      id: 'error-handling',
      name: 'Error Handling Template',
      description: 'Procedure with comprehensive error handling',
      category: 'Utility',
      template: `CREATE PROCEDURE [dbo].[ProcedureWithErrorHandling]
    @Parameter1 INT,
    @Parameter2 NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Your procedure logic here
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT @ErrorMessage = ERROR_MESSAGE(),
               @ErrorSeverity = ERROR_SEVERITY(),
               @ErrorState = ERROR_STATE();
               
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END`,
      parameters: [
        { id: '1', name: '@Parameter1', direction: ParameterDirection.IN, dataType: DataType.INT },
        {
          id: '2',
          name: '@Parameter2',
          direction: ParameterDirection.IN,
          dataType: DataType.NVARCHAR,
          length: 50,
        },
      ],
    },
    {
      id: 'dynamic-sql',
      name: 'Dynamic SQL Template',
      description: 'Safe dynamic SQL with parameters',
      category: 'Advanced',
      template: `CREATE PROCEDURE [dbo].[DynamicQuery]
    @TableName NVARCHAR(128),
    @WhereClause NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SQL NVARCHAR(MAX);
    
    -- Validate table name (security)
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TableName)
    BEGIN
        RAISERROR('Invalid table name', 16, 1);
        RETURN;
    END
    
    SET @SQL = N'SELECT * FROM ' + QUOTENAME(@TableName);
    
    IF @WhereClause IS NOT NULL
        SET @SQL = @SQL + N' WHERE ' + @WhereClause;
    
    EXEC sp_executesql @SQL;
END`,
      parameters: [
        {
          id: '1',
          name: '@TableName',
          direction: ParameterDirection.IN,
          dataType: DataType.NVARCHAR,
          length: 128,
        },
        {
          id: '2',
          name: '@WhereClause',
          direction: ParameterDirection.IN,
          dataType: DataType.NVARCHAR,
        },
      ],
    },
  ];

  useEffect(() => {
    if (procedure) {
      setEditedProcedure(procedure);
    }
  }, [procedure]);

  const addParameter = () => {
    const newParameter: StoredProcParameter = {
      id: `param-${Date.now()}`,
      name: `@Parameter${editedProcedure.parameters.length + 1}`,
      direction: ParameterDirection.IN,
      dataType: DataType.VARCHAR,
      length: 50,
    };

    setEditedProcedure({
      ...editedProcedure,
      parameters: [...editedProcedure.parameters, newParameter],
    });
  };

  const updateParameter = (parameterId: string, updates: Partial<StoredProcParameter>) => {
    setEditedProcedure({
      ...editedProcedure,
      parameters: editedProcedure.parameters.map(param =>
        param.id === parameterId ? { ...param, ...updates } : param
      ),
    });
  };

  const deleteParameter = (parameterId: string) => {
    setEditedProcedure({
      ...editedProcedure,
      parameters: editedProcedure.parameters.filter(p => p.id !== parameterId),
    });
  };

  const executeProcedure = async () => {
    setExecutionStatus(ExecutionStatus.RUNNING);

    // Simulate execution
    setTimeout(() => {
      const result: ExecutionResult = {
        id: `exec-${Date.now()}`,
        timestamp: new Date(),
        duration: Math.random() * 1000 + 100,
        status: Math.random() > 0.1 ? ExecutionStatus.COMPLETED : ExecutionStatus.ERROR,
        resultSets: [
          {
            columnNames: ['ID', 'Name', 'Email', 'CreatedDate'],
            rows: [
              [1, 'John Doe', 'john@example.com', '2024-01-15'],
              [2, 'Jane Smith', 'jane@example.com', '2024-01-16'],
              [3, 'Bob Johnson', 'bob@example.com', '2024-01-17'],
            ],
            rowCount: 3,
          },
        ],
        outputParameters: editedProcedure.parameters
          .filter(p => p.direction === ParameterDirection.OUT)
          .reduce((acc, param) => ({ ...acc, [param.name]: 'Output Value' }), {}),
        errorMessage: Math.random() > 0.1 ? undefined : 'Simulated error: Invalid column name',
        executionPlan: `<?xml version="1.0" encoding="utf-16"?>
<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan">
  <BatchSequence>
    <Batch>
      <Statements>
        <StmtSimple StatementCompId="1" StatementEstRows="3" StatementId="1" StatementOptmLevel="TRIVIAL">
          <StatementSetOptions ANSI_NULLS="true" ANSI_PADDING="true" ANSI_WARNINGS="true" />
          <QueryPlan DegreeOfParallelism="1">
            <RelOp AvgRowSize="51" EstimateCPU="0.0001581" NodeId="0">
              <OutputList>
                <ColumnReference Database="[TestDB]" Schema="[dbo]" Table="[Users]" Column="ID" />
                <ColumnReference Database="[TestDB]" Schema="[dbo]" Table="[Users]" Column="Name" />
              </OutputList>
              <TableScan Ordered="false">
                <DefinedValues>
                  <DefinedValue>
                    <ColumnReference Database="[TestDB]" Schema="[dbo]" Table="[Users]" Column="ID" />
                  </DefinedValue>
                </DefinedValues>
                <Object Database="[TestDB]" Schema="[dbo]" Table="[Users]" IndexKind="Heap" />
              </TableScan>
            </RelOp>
          </QueryPlan>
        </StmtSimple>
      </Statements>
    </Batch>
  </BatchSequence>
</ShowPlanXML>`,
        statistics: {
          cpuTime: Math.floor(Math.random() * 100),
          logicalReads: Math.floor(Math.random() * 1000),
          physicalReads: Math.floor(Math.random() * 100),
          duration: Math.floor(Math.random() * 1000 + 100),
        },
      };

      setExecutionResults(prev => [result, ...prev]);
      setExecutionStatus(ExecutionStatus.IDLE);
    }, 2000);
  };

  const stopExecution = () => {
    setExecutionStatus(ExecutionStatus.CANCELLED);
  };

  const applyTemplate = (template: ProcedureTemplate) => {
    const updatedProcedure = {
      ...editedProcedure,
      body: template.template,
      parameters: template.parameters.map(p => ({ ...p, id: `param-${Date.now()}-${p.id}` })),
    };
    setEditedProcedure(updatedProcedure);
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const handleSave = () => {
    const savedProcedure = {
      ...editedProcedure,
      modifiedDate: new Date(),
      modifiedBy: 'current_user',
    };

    if (onSave) {
      onSave(savedProcedure);
    }
    onClose();
  };

  const renderEditorTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => {
              // Format/beautify SQL
              const formatted = editedProcedure.body
                .replace(/\s+/g, ' ')
                .replace(/,/g, ',\n    ')
                .replace(/FROM/gi, '\nFROM')
                .replace(/WHERE/gi, '\nWHERE')
                .replace(/AND/gi, '\n  AND')
                .replace(/OR/gi, '\n   OR')
                .replace(/ORDER BY/gi, '\nORDER BY')
                .replace(/GROUP BY/gi, '\nGROUP BY');

              setEditedProcedure({ ...editedProcedure, body: formatted });
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center gap-1"
          >
            <Code className="w-4 h-4" />
            Format
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Lines: {editedProcedure.body.split('\n').length}</span>
          <span>Characters: {editedProcedure.body.length}</span>
        </div>
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={editedProcedure.body}
          onChange={e => setEditedProcedure({ ...editedProcedure, body: e.target.value })}
          className="w-full h-full font-mono text-sm border rounded p-3 resize-none bg-gray-900 text-gray-100"
          style={{ tabSize: 4 }}
          placeholder="-- Enter your stored procedure code here..."
        />
      </div>

      <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Schema: {editedProcedure.schema}</span>
          <span>Modified: {editedProcedure.modifiedDate.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const renderParametersTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={addParameter}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          Add Parameter
        </button>
        <span className="text-sm text-gray-600">
          {editedProcedure.parameters.length} parameters
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-sm">Name</th>
              <th className="border px-2 py-1 text-left text-sm">Direction</th>
              <th className="border px-2 py-1 text-left text-sm">Data Type</th>
              <th className="border px-2 py-1 text-left text-sm">Length</th>
              <th className="border px-2 py-1 text-left text-sm">Default</th>
              <th className="border px-2 py-1 text-left text-sm">Test Value</th>
              <th className="border px-2 py-1 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editedProcedure.parameters.map(param => (
              <tr key={param.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={param.name}
                    onChange={e => updateParameter(param.id, { name: e.target.value })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent font-mono"
                    placeholder="@ParameterName"
                  />
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={param.direction}
                    onChange={e =>
                      updateParameter(param.id, { direction: e.target.value as ParameterDirection })
                    }
                    className="w-full px-1 py-0.5 border-0 bg-transparent text-sm"
                  >
                    <option value={ParameterDirection.IN}>IN</option>
                    <option value={ParameterDirection.OUT}>OUT</option>
                    <option value={ParameterDirection.INOUT}>INOUT</option>
                    <option value={ParameterDirection.RETURN}>RETURN</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={param.dataType}
                    onChange={e =>
                      updateParameter(param.id, { dataType: e.target.value as DataType })
                    }
                    className="w-full px-1 py-0.5 border-0 bg-transparent text-sm"
                  >
                    <optgroup label="Numeric">
                      <option value={DataType.BIT}>bit</option>
                      <option value={DataType.TINYINT}>tinyint</option>
                      <option value={DataType.SMALLINT}>smallint</option>
                      <option value={DataType.INT}>int</option>
                      <option value={DataType.BIGINT}>bigint</option>
                      <option value={DataType.DECIMAL}>decimal</option>
                      <option value={DataType.MONEY}>money</option>
                      <option value={DataType.FLOAT}>float</option>
                    </optgroup>
                    <optgroup label="Character">
                      <option value={DataType.CHAR}>char</option>
                      <option value={DataType.VARCHAR}>varchar</option>
                      <option value={DataType.TEXT}>text</option>
                      <option value={DataType.NVARCHAR}>nvarchar</option>
                    </optgroup>
                    <optgroup label="Date/Time">
                      <option value={DataType.DATE}>date</option>
                      <option value={DataType.TIME}>time</option>
                      <option value={DataType.DATETIME}>datetime</option>
                      <option value={DataType.DATETIME2}>datetime2</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value={DataType.UNIQUEIDENTIFIER}>uniqueidentifier</option>
                      <option value={DataType.XML}>xml</option>
                      <option value={DataType.TABLE}>table</option>
                      <option value={DataType.CURSOR}>cursor</option>
                    </optgroup>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  {(param.dataType === DataType.VARCHAR ||
                    param.dataType === DataType.CHAR ||
                    param.dataType === DataType.NVARCHAR ||
                    param.dataType === DataType.NCHAR) && (
                    <input
                      type="number"
                      value={param.length || ''}
                      onChange={e =>
                        updateParameter(param.id, { length: parseInt(e.target.value) || undefined })
                      }
                      className="w-full px-1 py-0.5 border-0 bg-transparent"
                    />
                  )}
                  {(param.dataType === DataType.DECIMAL || param.dataType === DataType.NUMERIC) && (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={param.precision || ''}
                        onChange={e =>
                          updateParameter(param.id, {
                            precision: parseInt(e.target.value) || undefined,
                          })
                        }
                        className="w-12 px-1 py-0.5 border-0 bg-transparent"
                        placeholder="p"
                      />
                      <span>,</span>
                      <input
                        type="number"
                        value={param.scale || ''}
                        onChange={e =>
                          updateParameter(param.id, {
                            scale: parseInt(e.target.value) || undefined,
                          })
                        }
                        className="w-12 px-1 py-0.5 border-0 bg-transparent"
                        placeholder="s"
                      />
                    </div>
                  )}
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={param.defaultValue || ''}
                    onChange={e =>
                      updateParameter(param.id, { defaultValue: e.target.value || undefined })
                    }
                    className="w-full px-1 py-0.5 border-0 bg-transparent text-sm"
                    placeholder="NULL"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={param.testValue || ''}
                    onChange={e =>
                      updateParameter(param.id, { testValue: e.target.value || undefined })
                    }
                    className="w-full px-1 py-0.5 border-0 bg-transparent text-sm"
                    placeholder="Test value..."
                  />
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => deleteParameter(param.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editedProcedure.parameters.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No parameters defined</p>
          <p className="text-sm">Click "Add Parameter" to get started</p>
        </div>
      )}
    </div>
  );

  const renderExecuteTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={executeProcedure}
            disabled={executionStatus === ExecutionStatus.RUNNING}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {executionStatus === ExecutionStatus.RUNNING ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Execute
              </>
            )}
          </button>

          {executionStatus === ExecutionStatus.RUNNING && (
            <button
              onClick={stopExecution}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
            <Bug className="w-4 h-4" />
            Debug
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Status:{' '}
          <span
            className={`font-semibold ${
              executionStatus === ExecutionStatus.RUNNING
                ? 'text-blue-600'
                : executionStatus === ExecutionStatus.COMPLETED
                  ? 'text-green-600'
                  : executionStatus === ExecutionStatus.ERROR
                    ? 'text-red-600'
                    : 'text-gray-600'
            }`}
          >
            {executionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {editedProcedure.parameters.filter(
        p => p.direction === ParameterDirection.IN || p.direction === ParameterDirection.INOUT
      ).length > 0 && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Input Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editedProcedure.parameters
              .filter(
                p =>
                  p.direction === ParameterDirection.IN || p.direction === ParameterDirection.INOUT
              )
              .map(param => (
                <div key={param.id} className="flex items-center gap-2">
                  <label className="w-24 text-sm font-mono">{param.name}:</label>
                  <input
                    type="text"
                    value={param.testValue || ''}
                    onChange={e => updateParameter(param.id, { testValue: e.target.value })}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    placeholder={`Enter ${param.dataType} value...`}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h4 className="font-semibold mb-2">Execution Options</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            Show execution plan
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            Include statistics
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Profile execution
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Transaction mode
          </label>
        </div>
      </div>

      <div className="border rounded bg-white">
        <div className="p-3 border-b bg-gray-100">
          <h4 className="font-semibold flex items-center gap-2">
            <Database className="w-4 h-4" />
            Generated SQL
          </h4>
        </div>
        <div className="p-3">
          <pre className="text-sm font-mono bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
            {`EXEC [${editedProcedure.schema}].[${editedProcedure.name}]${
              editedProcedure.parameters.length > 0
                ? '\n' +
                  editedProcedure.parameters
                    .filter(
                      p =>
                        p.direction === ParameterDirection.IN ||
                        p.direction === ParameterDirection.INOUT
                    )
                    .map(p => `    ${p.name} = ${p.testValue || 'NULL'}`)
                    .join(',\n')
                : ''
            }${
              editedProcedure.parameters.filter(
                p =>
                  p.direction === ParameterDirection.OUT || p.direction === ParameterDirection.INOUT
              ).length > 0
                ? ',\n' +
                  editedProcedure.parameters
                    .filter(
                      p =>
                        p.direction === ParameterDirection.OUT ||
                        p.direction === ParameterDirection.INOUT
                    )
                    .map(p => `    ${p.name} = ${p.name} OUTPUT`)
                    .join(',\n')
                : ''
            };`}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold">Execution Results</h3>
        <span className="text-sm text-gray-600">{executionResults.length} executions</span>
      </div>

      <div className="space-y-4">
        {executionResults.map((result, index) => (
          <div key={result.id} className="border rounded">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  Execution #{executionResults.length - index}
                </span>
                <span className="text-xs text-gray-600">{result.timestamp.toLocaleString()}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    result.status === ExecutionStatus.COMPLETED
                      ? 'bg-green-100 text-green-800'
                      : result.status === ExecutionStatus.ERROR
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {result.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-600">
                  Duration: {result.duration.toFixed(2)}ms
                </span>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(JSON.stringify(result.resultSets, null, 2))
                }
                className="text-gray-600 hover:text-gray-800"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {result.errorMessage ? (
              <div className="p-3 bg-red-50 border-l-4 border-red-400">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-800">Error</span>
                </div>
                <pre className="text-sm text-red-700 font-mono">{result.errorMessage}</pre>
              </div>
            ) : (
              <div className="p-3">
                {result.resultSets.map((resultSet, rsIndex) => (
                  <div key={rsIndex} className="mb-4">
                    <div className="mb-2 text-sm font-semibold">
                      Result Set {rsIndex + 1} ({resultSet.rowCount} rows)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            {resultSet.columnNames.map((col, colIndex) => (
                              <th key={colIndex} className="border px-2 py-1 text-left">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultSet.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border px-2 py-1">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {result.outputParameters && Object.keys(result.outputParameters).length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border rounded">
                    <h5 className="font-semibold mb-2">Output Parameters</h5>
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(result.outputParameters).map(([name, value]) => (
                          <tr key={name}>
                            <td className="font-mono pr-4">{name}:</td>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {result.statistics && (
                  <div className="mt-4 p-3 bg-gray-50 border rounded">
                    <h5 className="font-semibold mb-2">Execution Statistics</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">CPU Time:</span>
                        <span className="ml-2 font-mono">{result.statistics.cpuTime}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Logical Reads:</span>
                        <span className="ml-2 font-mono">{result.statistics.logicalReads}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Physical Reads:</span>
                        <span className="ml-2 font-mono">{result.statistics.physicalReads}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-mono">{result.statistics.duration}ms</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {executionResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No execution results</p>
          <p className="text-sm">Execute the procedure to see results here</p>
        </div>
      )}
    </div>
  );

  const renderExecutionPlanTab = () => {
    const latestResult = executionResults.find(r => r.executionPlan);

    return (
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Execution Plan
          </h3>
          {latestResult && (
            <button
              onClick={() => navigator.clipboard.writeText(latestResult.executionPlan || '')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              Copy XML
            </button>
          )}
        </div>

        {latestResult?.executionPlan ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold mb-2">Plan Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="ml-2 font-mono">0.0032831</span>
                </div>
                <div>
                  <span className="text-gray-600">Estimated Rows:</span>
                  <span className="ml-2 font-mono">3</span>
                </div>
                <div>
                  <span className="text-gray-600">Cached Plan Size:</span>
                  <span className="ml-2 font-mono">16 KB</span>
                </div>
                <div>
                  <span className="text-gray-600">Compile Time:</span>
                  <span className="ml-2 font-mono">2ms</span>
                </div>
              </div>
            </div>

            <div className="border rounded">
              <div className="p-3 border-b bg-gray-100">
                <h4 className="font-semibold">Visual Plan</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center space-x-4 py-8">
                  <div className="text-center">
                    <div className="w-20 h-12 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center mb-2">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs">Table Scan</span>
                    <br />
                    <span className="text-xs text-gray-600">Cost: 100%</span>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-20 h-12 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center mb-2">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs">SELECT</span>
                    <br />
                    <span className="text-xs text-gray-600">3 rows</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded">
              <div className="p-3 border-b bg-gray-100">
                <h4 className="font-semibold">XML Plan</h4>
              </div>
              <div className="p-3">
                <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto h-64">
                  {latestResult.executionPlan}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No execution plan available</p>
            <p className="text-sm">Execute the procedure with "Show execution plan" enabled</p>
          </div>
        )}
      </div>
    );
  };

  const renderVersionsTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Version History
        </h3>
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Create Version
        </button>
      </div>

      <div className="space-y-3">
        {editedProcedure.versions.length === 0 && (
          <div className="p-4 border border-dashed border-gray-300 rounded text-center">
            <div className="text-sm text-gray-600 mb-2">Current Version (Unsaved)</div>
            <div className="text-xs text-gray-500">
              Modified: {editedProcedure.modifiedDate.toLocaleString()}
            </div>
          </div>
        )}

        {editedProcedure.versions.map((version, index) => (
          <div key={version.id} className="border rounded p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold">Version {version.version}</span>
                <span className="ml-2 text-sm text-gray-600">
                  by {version.createdBy} on {version.createdDate.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">Compare</button>
                <button className="text-green-600 hover:text-green-800 text-sm">Restore</button>
              </div>
            </div>
            {version.comment && <div className="text-sm text-gray-700 mb-2">{version.comment}</div>}
            <div className="text-xs text-gray-500">
              {version.parameters.length} parameters • {version.body.split('\n').length} lines
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Permissions
        </h3>
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Grant Permission
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left text-sm">Principal</th>
              <th className="border px-3 py-2 text-left text-sm">Permission</th>
              <th className="border px-3 py-2 text-left text-sm">Grant Option</th>
              <th className="border px-3 py-2 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editedProcedure.permissions.map((perm, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{perm.principal}</td>
                <td className="border px-3 py-2">{perm.permission}</td>
                <td className="border px-3 py-2">{perm.grantOption ? '✓' : '✗'}</td>
                <td className="border px-3 py-2">
                  <button className="text-red-600 hover:text-red-800 text-sm">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editedProcedure.permissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No permissions granted</p>
          <p className="text-sm">Click "Grant Permission" to manage access</p>
        </div>
      )}
    </div>
  );

  const renderDependenciesTab = () => (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Link className="w-4 h-4" />
          Dependencies
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3">Objects Used By This Procedure</h4>
          <div className="space-y-2">
            {editedProcedure.dependencies.map((dep, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm">
                  {dep.schema}.{dep.name}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{dep.type}</span>
              </div>
            ))}
          </div>
          {editedProcedure.dependencies.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">No dependencies found</div>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-3">Objects That Use This Procedure</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 border rounded">
              <FileCode className="w-4 h-4 text-green-600" />
              <span className="font-mono text-sm">dbo.ReportGenerator</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">procedure</span>
            </div>
            <div className="flex items-center gap-2 p-2 border rounded">
              <Database className="w-4 h-4 text-purple-600" />
              <span className="font-mono text-sm">dbo.UserDashboard</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">view</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-[95%] h-[90%] max-w-7xl flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Stored Procedure Editor</h2>
              <input
                type="text"
                value={editedProcedure.name}
                onChange={e => setEditedProcedure({ ...editedProcedure, name: e.target.value })}
                className="px-2 py-1 border rounded font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex">
            <div className="w-full">
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'editor'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FileCode className="w-4 h-4 inline mr-1" />
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab('parameters')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'parameters'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  Parameters ({editedProcedure.parameters.length})
                </button>
                <button
                  onClick={() => setActiveTab('execute')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'execute'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Play className="w-4 h-4 inline mr-1" />
                  Execute
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'results'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Database className="w-4 h-4 inline mr-1" />
                  Results ({executionResults.length})
                </button>
                <button
                  onClick={() => setActiveTab('plan')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'plan'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Execution Plan
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'versions'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Versions
                </button>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'permissions'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Permissions
                </button>
                <button
                  onClick={() => setActiveTab('dependencies')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'dependencies'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Link className="w-4 h-4 inline mr-1" />
                  Dependencies
                </button>
              </div>

              <div className="flex-1 overflow-auto h-full">
                {activeTab === 'editor' && renderEditorTab()}
                {activeTab === 'parameters' && renderParametersTab()}
                {activeTab === 'execute' && renderExecuteTab()}
                {activeTab === 'results' && renderResultsTab()}
                {activeTab === 'plan' && renderExecutionPlanTab()}
                {activeTab === 'versions' && renderVersionsTab()}
                {activeTab === 'permissions' && renderPermissionsTab()}
                {activeTab === 'dependencies' && renderDependenciesTab()}
              </div>
            </div>
          </div>

          <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>Schema: {editedProcedure.schema}</span>
              <span>Created: {editedProcedure.createdDate.toLocaleDateString()}</span>
              <span>Modified: {editedProcedure.modifiedDate.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{editedProcedure.parameters.length} parameters</span>
              <span>{editedProcedure.body.split('\n').length} lines</span>
              <span>{executionResults.length} executions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-[90%] h-[80%] max-w-4xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Procedure Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex">
              <div className="w-1/3 border-r">
                <div className="p-4">
                  <h4 className="font-semibold mb-3">Categories</h4>
                  <div className="space-y-2">
                    {['CRUD', 'Utility', 'Advanced', 'Reports'].map(category => (
                      <button
                        key={category}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t">
                  <h4 className="font-semibold mb-3">Templates</h4>
                  <div className="space-y-2">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`w-full text-left p-3 rounded border hover:bg-gray-50 ${
                          selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4">
                {selectedTemplate ? (
                  <div className="h-full flex flex-col">
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg">{selectedTemplate.name}</h4>
                      <p className="text-gray-600">{selectedTemplate.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-sm">
                        {selectedTemplate.category}
                      </span>
                    </div>

                    <div className="flex-1 border rounded">
                      <pre className="h-full p-4 text-sm font-mono overflow-auto bg-gray-900 text-gray-100 rounded">
                        {selectedTemplate.template}
                      </pre>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setShowTemplates(false)}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => applyTemplate(selectedTemplate)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a template to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
