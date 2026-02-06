import React, { useState, useCallback, useEffect } from 'react';
import { vb6TestFramework, TestCase, AssertionResult } from '../../services/VB6TestFramework';
import MonacoEditor from '@monaco-editor/react';
import {
  Bug,
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  List,
  Activity,
} from 'lucide-react';

interface TestDebuggerProps {
  testCase: TestCase;
  suiteId: string;
  className?: string;
}

interface DebugState {
  isRunning: boolean;
  isPaused: boolean;
  currentLine: number;
  variables: Record<string, any>;
  callStack: string[];
  assertions: AssertionResult[];
  output: string[];
  error: string | null;
}

const TestDebugger: React.FC<TestDebuggerProps> = ({ testCase, suiteId, className = '' }) => {
  const [debugState, setDebugState] = useState<DebugState>({
    isRunning: false,
    isPaused: false,
    currentLine: 0,
    variables: {},
    callStack: [],
    assertions: [],
    output: [],
    error: null,
  });

  const [activeTab, setActiveTab] = useState<'code' | 'variables' | 'output'>('code');
  const [showAssertions, setShowAssertions] = useState(true);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [watchExpressions, setWatchExpressions] = useState<string[]>([]);
  const [newWatchExpression, setNewWatchExpression] = useState('');

  // Reset debug state when test changes
  useEffect(() => {
    setDebugState({
      isRunning: false,
      isPaused: false,
      currentLine: 0,
      variables: {},
      callStack: [],
      assertions: [],
      output: [],
      error: null,
    });
    setBreakpoints(new Set());
  }, [testCase.id]);

  const startDebugging = useCallback(async () => {
    setDebugState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentLine: 1,
      error: null,
      output: [`[${new Date().toLocaleTimeString()}] Debug session started`],
      assertions: [],
    }));

    try {
      // Simulate test execution with debugging
      await simulateTestExecution();
    } catch (error) {
      setDebugState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isRunning: false,
      }));
    }
  }, [testCase]);

  const simulateTestExecution = async () => {
    // This is a simplified simulation. In a real implementation,
    // this would integrate with the actual VB6 runtime debugger

    const lines = testCase.code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for breakpoint
      if (breakpoints.has(i + 1)) {
        setDebugState(prev => ({ ...prev, isPaused: true, currentLine: i + 1 }));
        // Wait for resume
        await waitForResume();
      }

      // Simulate line execution
      setDebugState(prev => ({ ...prev, currentLine: i + 1 }));

      // Parse and simulate assertions
      if (line.includes('Assert.')) {
        simulateAssertion(line);
      }

      // Simulate variable assignments
      if (line.includes('Dim ') || line.includes('Set ') || line.includes('=')) {
        simulateVariableUpdate(line);
      }

      // Add small delay to visualize execution
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setDebugState(prev => ({
      ...prev,
      isRunning: false,
      output: [...prev.output, `[${new Date().toLocaleTimeString()}] Test execution completed`],
    }));
  };

  const waitForResume = (): Promise<void> => {
    return new Promise(resolve => {
      const checkResume = setInterval(() => {
        setDebugState(prev => {
          if (!prev.isPaused) {
            clearInterval(checkResume);
            resolve();
          }
          return prev;
        });
      }, 100);
    });
  };

  const simulateAssertion = (line: string) => {
    const assertionMatch = line.match(/Assert\.(\w+)\s*(.*)/);
    if (assertionMatch) {
      const [, method, args] = assertionMatch;
      const assertion: AssertionResult = {
        type: method,
        expected: 'expected value',
        actual: 'actual value',
        passed: Math.random() > 0.3, // Simulate 70% pass rate
        message: `Assertion ${method} on line ${debugState.currentLine}`,
        location: { line: debugState.currentLine, column: 0 },
      };

      setDebugState(prev => ({
        ...prev,
        assertions: [...prev.assertions, assertion],
        output: [
          ...prev.output,
          `[${new Date().toLocaleTimeString()}] ${assertion.passed ? 'PASS' : 'FAIL'}: ${assertion.message}`,
        ],
      }));
    }
  };

  const simulateVariableUpdate = (line: string) => {
    // Simple variable parsing simulation
    const varMatch = line.match(/(\w+)\s*=\s*(.*)/);
    if (varMatch) {
      const [, varName, value] = varMatch;
      setDebugState(prev => ({
        ...prev,
        variables: {
          ...prev.variables,
          [varName]: value.replace(/"/g, ''),
        },
      }));
    }
  };

  const pauseExecution = useCallback(() => {
    setDebugState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeExecution = useCallback(() => {
    setDebugState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const stepOver = useCallback(() => {
    // Simulate step over
    setDebugState(prev => ({
      ...prev,
      currentLine: Math.min(prev.currentLine + 1, testCase.code.split('\n').length),
      isPaused: true,
    }));
  }, [testCase]);

  const restart = useCallback(() => {
    setDebugState({
      isRunning: false,
      isPaused: false,
      currentLine: 0,
      variables: {},
      callStack: [],
      assertions: [],
      output: [],
      error: null,
    });
  }, []);

  const toggleBreakpoint = useCallback((lineNumber: number) => {
    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev);
      if (newBreakpoints.has(lineNumber)) {
        newBreakpoints.delete(lineNumber);
      } else {
        newBreakpoints.add(lineNumber);
      }
      return newBreakpoints;
    });
  }, []);

  const addWatchExpression = useCallback(() => {
    if (newWatchExpression.trim()) {
      setWatchExpressions(prev => [...prev, newWatchExpression.trim()]);
      setNewWatchExpression('');
    }
  }, [newWatchExpression]);

  const removeWatchExpression = useCallback((index: number) => {
    setWatchExpressions(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`bg-white border border-gray-400 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-2 flex items-center justify-between">
        <span className="text-sm font-bold flex items-center gap-2">
          <Bug size={16} />
          Test Debugger - {testCase.name}
        </span>
        <div className="flex gap-1">
          <button
            onClick={startDebugging}
            disabled={debugState.isRunning}
            className="p-1 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Start Debugging"
          >
            <Play size={14} />
          </button>
          <button
            onClick={pauseExecution}
            disabled={!debugState.isRunning || debugState.isPaused}
            className="p-1 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Pause"
          >
            <Pause size={14} />
          </button>
          <button
            onClick={resumeExecution}
            disabled={!debugState.isPaused}
            className="p-1 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Resume"
          >
            <Play size={14} />
          </button>
          <button
            onClick={stepOver}
            disabled={!debugState.isPaused}
            className="p-1 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Step Over"
          >
            <StepForward size={14} />
          </button>
          <button onClick={restart} className="p-1 hover:bg-blue-700 rounded" title="Restart">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-300 px-2 py-1">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-1 text-xs rounded ${
                  activeTab === 'code' ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <Code size={12} className="inline mr-1" />
                Code
              </button>
              <button
                onClick={() => setActiveTab('variables')}
                className={`px-2 py-1 text-xs rounded ${
                  activeTab === 'variables' ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <Eye size={12} className="inline mr-1" />
                Variables
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`px-2 py-1 text-xs rounded ${
                  activeTab === 'output' ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <List size={12} className="inline mr-1" />
                Output
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' && (
              <div className="h-full relative">
                <MonacoEditor
                  language="vb"
                  value={testCase.code}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    glyphMargin: true,
                    scrollBeyondLastLine: false,
                  }}
                  onMount={editor => {
                    // Add current line highlighting
                    editor.deltaDecorations(
                      [],
                      [
                        {
                          range: {
                            startLineNumber: debugState.currentLine,
                            startColumn: 1,
                            endLineNumber: debugState.currentLine,
                            endColumn: 1,
                          },
                          options: {
                            isWholeLine: true,
                            className: 'bg-yellow-200',
                          },
                        },
                      ]
                    );

                    // Add breakpoint markers
                    const breakpointDecorations = Array.from(breakpoints).map(line => ({
                      range: {
                        startLineNumber: line,
                        startColumn: 1,
                        endLineNumber: line,
                        endColumn: 1,
                      },
                      options: {
                        isWholeLine: false,
                        glyphMarginClassName: 'bg-red-500 rounded-full w-3 h-3',
                        glyphMarginHoverMessage: { value: 'Breakpoint' },
                      },
                    }));

                    editor.deltaDecorations([], breakpointDecorations);

                    // Handle glyph margin clicks for breakpoints
                    editor.onMouseDown(e => {
                      if (e.target.type === 2) {
                        // Glyph margin
                        const lineNumber = e.target.position?.lineNumber;
                        if (lineNumber) {
                          toggleBreakpoint(lineNumber);
                        }
                      }
                    });
                  }}
                />
              </div>
            )}

            {activeTab === 'variables' && (
              <div className="p-3 overflow-y-auto">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Local Variables</h4>
                  <div className="space-y-1">
                    {Object.entries(debugState.variables).map(([name, value]) => (
                      <div
                        key={name}
                        className="flex justify-between text-xs font-mono bg-gray-50 p-2 rounded"
                      >
                        <span className="text-blue-600">{name}</span>
                        <span className="text-gray-700">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                    {Object.keys(debugState.variables).length === 0 && (
                      <div className="text-xs text-gray-500">No variables in scope</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Watch Expressions</h4>
                  <div className="space-y-1 mb-2">
                    {watchExpressions.map((expr, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs font-mono bg-gray-50 p-2 rounded"
                      >
                        <span className="text-blue-600">{expr}</span>
                        <button
                          onClick={() => removeWatchExpression(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newWatchExpression}
                      onChange={e => setNewWatchExpression(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addWatchExpression()}
                      placeholder="Add watch expression"
                      className="flex-1 px-2 py-1 text-xs border rounded"
                    />
                    <button
                      onClick={addWatchExpression}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="p-3 overflow-y-auto">
                <div className="space-y-1 font-mono text-xs">
                  {debugState.output.map((line, index) => (
                    <div
                      key={index}
                      className={`${
                        line.includes('FAIL')
                          ? 'text-red-600'
                          : line.includes('PASS')
                            ? 'text-green-600'
                            : 'text-gray-700'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Assertions & Status */}
        <div className="w-80 border-l border-gray-400 flex flex-col">
          <div className="border-b border-gray-300 p-2">
            <button
              onClick={() => setShowAssertions(!showAssertions)}
              className="flex items-center justify-between w-full text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} />
                Assertions ({debugState.assertions.length})
              </span>
              {showAssertions ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {showAssertions && (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {debugState.assertions.map((assertion, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      assertion.passed
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {assertion.passed ? (
                        <CheckCircle size={14} className="text-green-600" />
                      ) : (
                        <XCircle size={14} className="text-red-600" />
                      )}
                      <span className="font-semibold">{assertion.type}</span>
                      {assertion.location && (
                        <span className="text-gray-500">Line {assertion.location.line}</span>
                      )}
                    </div>
                    {assertion.message && <div className="mt-1">{assertion.message}</div>}
                    <div className="mt-1 font-mono text-xs">
                      <div>Expected: {JSON.stringify(assertion.expected)}</div>
                      <div>Actual: {JSON.stringify(assertion.actual)}</div>
                    </div>
                  </div>
                ))}
                {debugState.assertions.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No assertions have been executed yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug Status */}
          <div className="border-t border-gray-300 p-3">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Activity size={14} />
              Debug Status
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">State:</span>
                <span
                  className={`font-medium ${
                    debugState.isRunning ? 'text-green-600' : 'text-gray-700'
                  }`}
                >
                  {debugState.isRunning ? (debugState.isPaused ? 'Paused' : 'Running') : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Line:</span>
                <span className="font-medium">{debugState.currentLine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Breakpoints:</span>
                <span className="font-medium">{breakpoints.size}</span>
              </div>
              {debugState.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-700">{debugState.error}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDebugger;
