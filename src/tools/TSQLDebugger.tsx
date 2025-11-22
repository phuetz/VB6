import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Debug States
export enum DebugState {
  Stopped = 'Stopped',
  Running = 'Running',
  Paused = 'Paused',
  StepInto = 'Step Into',
  StepOver = 'Step Over',
  StepOut = 'Step Out',
  Error = 'Error'
}

// Variable Types
export enum VariableType {
  Parameter = 'Parameter',
  Local = 'Local Variable',
  Global = 'Global Variable',
  UserDefined = 'User-Defined Type',
  Table = 'Table Variable',
  Cursor = 'Cursor'
}

// Breakpoint Types
export enum BreakpointType {
  Line = 'Line',
  Conditional = 'Conditional',
  HitCount = 'Hit Count',
  Changed = 'Data Changed'
}

// Debug Variable
export interface DebugVariable {
  name: string;
  type: VariableType;
  dataType: string;
  value: any;
  scope: 'Local' | 'Global' | 'Parameter';
  modified: boolean;
  expanded?: boolean;
  children?: DebugVariable[];
}

// Breakpoint
export interface Breakpoint {
  id: string;
  line: number;
  type: BreakpointType;
  condition?: string;
  hitCount?: number;
  currentHits: number;
  enabled: boolean;
  description?: string;
}

// Call Stack Frame
export interface CallStackFrame {
  id: string;
  procedureName: string;
  line: number;
  column: number;
  parameters: DebugVariable[];
  locals: DebugVariable[];
  sql?: string;
}

// Debug Session
export interface DebugSession {
  id: string;
  connectionString: string;
  databaseName: string;
  procedureName: string;
  parameters: Array<{
    name: string;
    type: string;
    value: any;
    direction: 'IN' | 'OUT' | 'INOUT';
  }>;
  state: DebugState;
  currentLine: number;
  callStack: CallStackFrame[];
  variables: DebugVariable[];
  breakpoints: Breakpoint[];
  output: Array<{
    timestamp: Date;
    type: 'Message' | 'Error' | 'Warning' | 'Result';
    content: string;
  }>;
  executionTime: number;
  rowsAffected?: number;
}

// SQL Object
export interface SQLObject {
  name: string;
  type: 'Stored Procedure' | 'Function' | 'Trigger' | 'View';
  schema: string;
  definition: string;
  parameters: Array<{
    name: string;
    type: string;
    direction: 'IN' | 'OUT' | 'INOUT';
    defaultValue?: any;
  }>;
  created: Date;
  modified: Date;
}

// T-SQL Debugger Props
interface TSQLDebuggerProps {
  connectionString?: string;
  onSessionStart?: (session: DebugSession) => void;
  onSessionEnd?: (session: DebugSession) => void;
  onBreakpointHit?: (breakpoint: Breakpoint, session: DebugSession) => void;
  onClose?: () => void;
}

export const TSQLDebugger: React.FC<TSQLDebuggerProps> = ({
  connectionString: initialConnectionString,
  onSessionStart,
  onSessionEnd,
  onBreakpointHit,
  onClose
}) => {
  const [currentSession, setCurrentSession] = useState<DebugSession | null>(null);
  const [availableObjects, setAvailableObjects] = useState<SQLObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<SQLObject | null>(null);
  const [sqlCode, setSqlCode] = useState('');
  const [connectionString, setConnectionString] = useState(initialConnectionString || '');
  const [databaseName, setDatabaseName] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'variables' | 'callstack' | 'output' | 'watches'>('code');
  const [watchExpressions, setWatchExpressions] = useState<Array<{
    id: string;
    expression: string;
    value: any;
    error?: string;
  }>>([]);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showParameterDialog, setShowParameterDialog] = useState(false);
  const [executionPlan, setExecutionPlan] = useState<any>(null);
  const [profilerData, setProfilerData] = useState<Array<{
    timestamp: Date;
    event: string;
    duration: number;
    cpu: number;
    reads: number;
    writes: number;
    spid: number;
  }>>([]);
  const [isConnected, setIsConnected] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Sample stored procedures for demonstration
  const sampleObjects: SQLObject[] = [
    {
      name: 'sp_GetCustomerOrders',
      type: 'Stored Procedure',
      schema: 'dbo',
      definition: `CREATE PROCEDURE sp_GetCustomerOrders
    @CustomerID NVARCHAR(5),
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL,
    @OrderCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalAmount MONEY = 0;
    DECLARE @OrderID INT;
    
    -- Debug breakpoint here
    SELECT @OrderCount = COUNT(*)
    FROM Orders 
    WHERE CustomerID = @CustomerID
      AND (@StartDate IS NULL OR OrderDate >= @StartDate)
      AND (@EndDate IS NULL OR OrderDate <= @EndDate);
    
    -- Calculate total amount
    SELECT @TotalAmount = SUM(Freight)
    FROM Orders 
    WHERE CustomerID = @CustomerID;
    
    -- Return order details
    SELECT 
        OrderID,
        OrderDate,
        RequiredDate,
        ShippedDate,
        Freight,
        ShipName,
        ShipAddress
    FROM Orders 
    WHERE CustomerID = @CustomerID
      AND (@StartDate IS NULL OR OrderDate >= @StartDate)
      AND (@EndDate IS NULL OR OrderDate <= @EndDate)
    ORDER BY OrderDate DESC;
    
    PRINT 'Total orders: ' + CAST(@OrderCount AS VARCHAR(10));
    PRINT 'Total freight: $' + CAST(@TotalAmount AS VARCHAR(20));
END`,
      parameters: [
        { name: '@CustomerID', type: 'NVARCHAR(5)', direction: 'IN' },
        { name: '@StartDate', type: 'DATETIME', direction: 'IN', defaultValue: null },
        { name: '@EndDate', type: 'DATETIME', direction: 'IN', defaultValue: null },
        { name: '@OrderCount', type: 'INT', direction: 'OUT' }
      ],
      created: new Date('2024-01-01'),
      modified: new Date('2024-01-15')
    },
    {
      name: 'fn_CalculateDiscount',
      type: 'Function',
      schema: 'dbo',
      definition: `CREATE FUNCTION fn_CalculateDiscount
(
    @UnitPrice MONEY,
    @Quantity INT,
    @DiscountPercent FLOAT
)
RETURNS MONEY
AS
BEGIN
    DECLARE @Total MONEY;
    DECLARE @Discount MONEY;
    
    SET @Total = @UnitPrice * @Quantity;
    SET @Discount = @Total * (@DiscountPercent / 100.0);
    
    RETURN @Total - @Discount;
END`,
      parameters: [
        { name: '@UnitPrice', type: 'MONEY', direction: 'IN' },
        { name: '@Quantity', type: 'INT', direction: 'IN' },
        { name: '@DiscountPercent', type: 'FLOAT', direction: 'IN' }
      ],
      created: new Date('2024-01-05'),
      modified: new Date('2024-01-10')
    },
    {
      name: 'trg_OrderAudit',
      type: 'Trigger',
      schema: 'dbo',
      definition: `CREATE TRIGGER trg_OrderAudit
ON Orders
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Action VARCHAR(10);
    DECLARE @OrderID INT;
    DECLARE @CustomerID NVARCHAR(5);
    
    -- Determine action type
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @Action = 'UPDATE';
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @Action = 'INSERT';
    ELSE
        SET @Action = 'DELETE';
    
    -- Log the change
    INSERT INTO OrderAuditLog (OrderID, CustomerID, Action, ActionDate, UserName)
    SELECT 
        COALESCE(i.OrderID, d.OrderID),
        COALESCE(i.CustomerID, d.CustomerID),
        @Action,
        GETDATE(),
        SYSTEM_USER
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.OrderID = d.OrderID;
END`,
      parameters: [],
      created: new Date('2024-01-08'),
      modified: new Date('2024-01-12')
    }
  ];

  // Initialize with sample data
  useEffect(() => {
    setAvailableObjects(sampleObjects);
    if (sampleObjects.length > 0) {
      setSelectedObject(sampleObjects[0]);
      setSqlCode(sampleObjects[0].definition);
    }
  }, []);

  // Start debug session
  const startDebugSession = useCallback((obj: SQLObject, parameters: Array<{ name: string; value: any }>) => {
    const session: DebugSession = {
      id: `debug_${Date.now()}`,
      connectionString,
      databaseName,
      procedureName: obj.name,
      parameters: obj.parameters.map(p => ({
        name: p.name,
        type: p.type,
        value: parameters.find(param => param.name === p.name)?.value || p.defaultValue,
        direction: p.direction
      })),
      state: DebugState.Stopped,
      currentLine: 1,
      callStack: [{
        id: 'main',
        procedureName: obj.name,
        line: 1,
        column: 1,
        parameters: obj.parameters.map(p => ({
          name: p.name,
          type: VariableType.Parameter,
          dataType: p.type,
          value: parameters.find(param => param.name === p.name)?.value || p.defaultValue,
          scope: 'Parameter',
          modified: false
        })),
        locals: []
      }],
      variables: obj.parameters.map(p => ({
        name: p.name,
        type: VariableType.Parameter,
        dataType: p.type,
        value: parameters.find(param => param.name === p.name)?.value || p.defaultValue,
        scope: 'Parameter',
        modified: false
      })),
      breakpoints: [],
      output: [{
        timestamp: new Date(),
        type: 'Message',
        content: `Debug session started for ${obj.name}`
      }],
      executionTime: 0
    };

    setCurrentSession(session);
    onSessionStart?.(session);
    eventEmitter.current.emit('sessionStarted', session);
  }, [connectionString, databaseName, onSessionStart]);

  // Stop debug session
  const stopDebugSession = useCallback(() => {
    if (currentSession) {
      const stoppedSession = {
        ...currentSession,
        state: DebugState.Stopped,
        output: [...currentSession.output, {
          timestamp: new Date(),
          type: 'Message' as const,
          content: 'Debug session ended'
        }]
      };
      
      setCurrentSession(stoppedSession);
      onSessionEnd?.(stoppedSession);
      setTimeout(() => setCurrentSession(null), 1000);
      eventEmitter.current.emit('sessionEnded', stoppedSession);
    }
  }, [currentSession, onSessionEnd]);

  // Step execution
  const stepExecution = useCallback((type: 'into' | 'over' | 'out') => {
    if (!currentSession) return;

    const newState = type === 'into' ? DebugState.StepInto :
                    type === 'over' ? DebugState.StepOver :
                    DebugState.StepOut;

    // Simulate stepping through code
    const newLine = Math.min(currentSession.currentLine + 1, 30);
    
    // Simulate variable changes
    const updatedVariables = currentSession.variables.map(v => {
      if (v.name === '@OrderCount' && newLine > 10) {
        return { ...v, value: 5, modified: true };
      }
      if (v.name === '@TotalAmount' && newLine > 15) {
        return { ...v, value: 327.56, modified: true };
      }
      return v;
    });

    // Add local variables as we progress
    const locals: DebugVariable[] = [];
    if (newLine > 8) {
      locals.push({
        name: '@TotalAmount',
        type: VariableType.Local,
        dataType: 'MONEY',
        value: newLine > 15 ? 327.56 : 0,
        scope: 'Local',
        modified: newLine > 15
      });
    }
    if (newLine > 9) {
      locals.push({
        name: '@OrderID',
        type: VariableType.Local,
        dataType: 'INT',
        value: null,
        scope: 'Local',
        modified: false
      });
    }

    const updatedSession = {
      ...currentSession,
      state: newState,
      currentLine: newLine,
      variables: [...updatedVariables, ...locals.filter(l => !updatedVariables.some(v => v.name === l.name))],
      callStack: currentSession.callStack.map(frame => ({
        ...frame,
        line: newLine,
        locals
      })),
      output: [...currentSession.output, {
        timestamp: new Date(),
        type: 'Message' as const,
        content: `Stepped ${type} to line ${newLine}`
      }]
    };

    setCurrentSession(updatedSession);
    eventEmitter.current.emit('stepExecuted', { type, session: updatedSession });
  }, [currentSession]);

  // Run/Continue execution
  const runExecution = useCallback(() => {
    if (!currentSession) return;

    const runningSession = {
      ...currentSession,
      state: DebugState.Running,
      output: [...currentSession.output, {
        timestamp: new Date(),
        type: 'Message' as const,
        content: 'Execution continued'
      }]
    };

    setCurrentSession(runningSession);

    // Simulate execution completion
    setTimeout(() => {
      const completedSession = {
        ...runningSession,
        state: DebugState.Stopped,
        currentLine: 999,
        executionTime: 145,
        rowsAffected: 5,
        output: [...runningSession.output, 
          {
            timestamp: new Date(),
            type: 'Result' as const,
            content: 'Command completed successfully. 5 rows affected. Execution time: 145ms'
          },
          {
            timestamp: new Date(),
            type: 'Message' as const,
            content: 'Total orders: 5'
          },
          {
            timestamp: new Date(),
            type: 'Message' as const,
            content: 'Total freight: $327.56'
          }
        ]
      };
      setCurrentSession(completedSession);
    }, 2000);

    eventEmitter.current.emit('executionStarted', runningSession);
  }, [currentSession]);

  // Add/Remove breakpoint
  const toggleBreakpoint = useCallback((line: number) => {
    if (!currentSession) return;

    const existingBreakpoint = currentSession.breakpoints.find(bp => bp.line === line);
    
    let updatedBreakpoints: Breakpoint[];
    if (existingBreakpoint) {
      updatedBreakpoints = currentSession.breakpoints.filter(bp => bp.line !== line);
    } else {
      const newBreakpoint: Breakpoint = {
        id: `bp_${Date.now()}`,
        line,
        type: BreakpointType.Line,
        currentHits: 0,
        enabled: true,
        description: `Line ${line} breakpoint`
      };
      updatedBreakpoints = [...currentSession.breakpoints, newBreakpoint];
    }

    const updatedSession = {
      ...currentSession,
      breakpoints: updatedBreakpoints
    };

    setCurrentSession(updatedSession);
    eventEmitter.current.emit('breakpointToggled', { line, session: updatedSession });
  }, [currentSession]);

  // Add watch expression
  const addWatch = useCallback((expression: string) => {
    const newWatch = {
      id: `watch_${Date.now()}`,
      expression,
      value: null,
      error: undefined
    };

    // Simulate evaluation
    setTimeout(() => {
      let value: any = null;
      let error: string | undefined = undefined;

      if (expression === '@CustomerID') {
        value = 'ALFKI';
      } else if (expression === '@OrderCount') {
        value = 5;
      } else if (expression === '@TotalAmount') {
        value = 327.56;
      } else if (expression.includes('COUNT(*)')) {
        value = 5;
      } else {
        error = 'Unable to evaluate expression';
      }

      setWatchExpressions(prev => prev.map(w => 
        w.id === newWatch.id ? { ...w, value, error } : w
      ));
    }, 500);

    setWatchExpressions(prev => [...prev, newWatch]);
  }, []);

  // Remove watch expression
  const removeWatch = useCallback((id: string) => {
    setWatchExpressions(prev => prev.filter(w => w.id !== id));
  }, []);

  // Get line numbers for code display
  const getLineNumbers = useCallback((code: string): number[] => {
    return code.split('\n').map((_, index) => index + 1);
  }, []);

  // Check if line has breakpoint
  const hasBreakpoint = useCallback((line: number): boolean => {
    return currentSession?.breakpoints.some(bp => bp.line === line && bp.enabled) || false;
  }, [currentSession]);

  // Check if line is current execution line
  const isCurrentLine = useCallback((line: number): boolean => {
    return currentSession?.currentLine === line && currentSession?.state !== DebugState.Stopped;
  }, [currentSession]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setShowConnectDialog(true)}
              disabled={!!currentSession}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Connect
            </button>
            <button
              onClick={() => setShowParameterDialog(true)}
              disabled={!selectedObject || !!currentSession}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Start Debug
            </button>
            <button
              onClick={stopDebugSession}
              disabled={!currentSession}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Stop
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <div className="flex gap-1">
            <button
              onClick={runExecution}
              disabled={!currentSession || currentSession.state === DebugState.Running}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              title="Run/Continue (F5)"
            >
              ▶ Run
            </button>
            <button
              onClick={() => stepExecution('into')}
              disabled={!currentSession || currentSession.state === DebugState.Running}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              title="Step Into (F11)"
            >
              ⬇ Into
            </button>
            <button
              onClick={() => stepExecution('over')}
              disabled={!currentSession || currentSession.state === DebugState.Running}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              title="Step Over (F10)"
            >
              ➡ Over
            </button>
            <button
              onClick={() => stepExecution('out')}
              disabled={!currentSession || currentSession.state === DebugState.Running}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              title="Step Out (Shift+F11)"
            >
              ⬆ Out
            </button>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-2 text-sm">
            {currentSession && (
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  currentSession.state === DebugState.Running ? 'bg-green-100 text-green-800' :
                  currentSession.state === DebugState.Paused ? 'bg-yellow-100 text-yellow-800' :
                  currentSession.state === DebugState.Error ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentSession.state}
                </span>
                <span className="text-gray-600">Line: {currentSession.currentLine}</span>
                <span className="text-gray-600">
                  Connection: {isConnected ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Object Explorer */}
        <div className="w-1/4 border-r border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700">SQL Objects</h3>
            <p className="text-xs text-gray-600">{databaseName || 'No database connected'}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {availableObjects.map(obj => (
                <div
                  key={obj.name}
                  onClick={() => {
                    setSelectedObject(obj);
                    setSqlCode(obj.definition);
                  }}
                  className={`p-2 text-sm cursor-pointer rounded hover:bg-gray-100 ${
                    selectedObject?.name === obj.name ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {obj.type === 'Stored Procedure' ? '📋' :
                       obj.type === 'Function' ? '⚙️' :
                       obj.type === 'Trigger' ? '⚡' : '👁️'}
                    </span>
                    <div>
                      <div className="font-medium">{obj.name}</div>
                      <div className="text-xs text-gray-600">{obj.type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {availableObjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔌</div>
                <p className="text-sm">Connect to a database to view objects</p>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">
                {selectedObject ? `${selectedObject.name} (${selectedObject.type})` : 'No object selected'}
              </h3>
              {selectedObject && (
                <div className="text-xs text-gray-600">
                  Schema: {selectedObject.schema} | Modified: {selectedObject.modified.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers */}
            <div className="w-12 bg-gray-50 border-r border-gray-200 text-right pr-2 py-2 text-xs font-mono text-gray-600 select-none">
              {getLineNumbers(sqlCode).map(lineNum => (
                <div
                  key={lineNum}
                  onClick={() => toggleBreakpoint(lineNum)}
                  className={`h-5 leading-5 cursor-pointer hover:bg-gray-200 ${
                    hasBreakpoint(lineNum) ? 'bg-red-200 text-red-800' : ''
                  } ${
                    isCurrentLine(lineNum) ? 'bg-yellow-200 text-yellow-800' : ''
                  }`}
                >
                  {hasBreakpoint(lineNum) ? '●' : ''} {lineNum}
                </div>
              ))}
            </div>
            
            {/* Code Editor */}
            <div className="flex-1 overflow-auto">
              <textarea
                ref={codeEditorRef}
                value={sqlCode}
                onChange={(e) => setSqlCode(e.target.value)}
                className="w-full h-full p-2 border-none resize-none font-mono text-sm bg-white"
                style={{ minHeight: '400px', outline: 'none' }}
                placeholder="Select a SQL object to view its code..."
                readOnly={!!currentSession}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Debug Info */}
        <div className="w-1/3 border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {['variables', 'callstack', 'watches', 'output'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-2 text-sm font-medium ${
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
            {activeTab === 'variables' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Variables</h4>
                  {currentSession && (
                    <span className="text-xs text-gray-500">
                      {currentSession.variables.length} items
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 overflow-y-auto max-h-64">
                  {currentSession?.variables.map((variable, index) => (
                    <div
                      key={index}
                      className={`p-2 border border-gray-200 rounded text-sm ${
                        variable.modified ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-200 px-1 rounded">
                            {variable.scope}
                          </span>
                          <span className="font-medium">{variable.name}</span>
                          {variable.modified && <span className="text-yellow-600 text-xs">*</span>}
                        </div>
                        <span className="text-xs text-gray-500">{variable.dataType}</span>
                      </div>
                      <div className="mt-1 font-mono text-xs">
                        {variable.value === null ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : (
                          <span>{String(variable.value)}</span>
                        )}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-sm">No debug session active</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'callstack' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Call Stack</h4>
                  {currentSession && (
                    <span className="text-xs text-gray-500">
                      {currentSession.callStack.length} frames
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 overflow-y-auto max-h-64">
                  {currentSession?.callStack.map((frame, index) => (
                    <div key={frame.id} className="p-2 border border-gray-200 rounded bg-gray-50 text-sm">
                      <div className="font-medium">{frame.procedureName}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Line {frame.line}, Column {frame.column}
                      </div>
                      {frame.parameters.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-700 mb-1">Parameters:</div>
                          {frame.parameters.map((param, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              {param.name}: {String(param.value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">📚</div>
                      <p className="text-sm">No debug session active</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'watches' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Watch Expressions</h4>
                  <button
                    onClick={() => {
                      const expression = prompt('Enter expression to watch:');
                      if (expression) addWatch(expression);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Add Watch
                  </button>
                </div>
                
                <div className="space-y-2 overflow-y-auto max-h-64">
                  {watchExpressions.map(watch => (
                    <div key={watch.id} className="p-2 border border-gray-200 rounded bg-gray-50 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium font-mono">{watch.expression}</span>
                        <button
                          onClick={() => removeWatch(watch.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-1 font-mono text-xs">
                        {watch.error ? (
                          <span className="text-red-600">{watch.error}</span>
                        ) : watch.value === null ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : (
                          <span>{String(watch.value)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {watchExpressions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">👁️</div>
                      <p className="text-sm">No watch expressions</p>
                      <p className="text-xs mt-1">Click "Add Watch" to monitor expressions</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'output' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Debug Output</h4>
                  <button
                    onClick={() => {
                      if (currentSession) {
                        setCurrentSession({ ...currentSession, output: [] });
                      }
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-64 font-mono text-xs">
                  {currentSession?.output.map((entry, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        entry.type === 'Error' ? 'bg-red-50 text-red-800' :
                        entry.type === 'Warning' ? 'bg-yellow-50 text-yellow-800' :
                        entry.type === 'Result' ? 'bg-green-50 text-green-800' :
                        'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                      <div>{entry.content}</div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">📝</div>
                      <p className="text-sm">No output messages</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Dialog */}
      {showConnectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-bold mb-4">Connect to SQL Server</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
                <input
                  type="text"
                  defaultValue="localhost"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Server name or IP address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Database name"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Use Windows Authentication</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection String</label>
                <textarea
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows={3}
                  placeholder="Connection string will be generated automatically"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowConnectDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsConnected(true);
                  setShowConnectDialog(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Dialog */}
      {showParameterDialog && selectedObject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-lg font-bold mb-4">Debug Parameters - {selectedObject.name}</h2>
            
            <div className="space-y-4">
              {selectedObject.parameters.map(param => (
                <div key={param.name} className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {param.name}
                    </label>
                    <div className="text-xs text-gray-500">{param.type}</div>
                  </div>
                  <div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {param.direction}
                    </span>
                  </div>
                  <div>
                    <input
                      type="text"
                      defaultValue={param.defaultValue || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter value..."
                    />
                  </div>
                </div>
              ))}
              
              {selectedObject.parameters.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No parameters required
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowParameterDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  startDebugSession(selectedObject, [
                    { name: '@CustomerID', value: 'ALFKI' },
                    { name: '@StartDate', value: null },
                    { name: '@EndDate', value: null }
                  ]);
                  setShowParameterDialog(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start Debug
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>
            {currentSession ? (
              `Debug Session: ${currentSession.procedureName} | Line: ${currentSession.currentLine} | State: ${currentSession.state}`
            ) : selectedObject ? (
              `Object: ${selectedObject.name} (${selectedObject.type}) | Ready to debug`
            ) : (
              'Select a SQL object to debug'
            )}
          </span>
          <span>T-SQL Debugger v6.0</span>
        </div>
      </div>
    </div>
  );
};

export default TSQLDebugger;