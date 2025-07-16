import React, { useState, useCallback } from 'react';
import { TestSuite, TestCase } from '../../types/extended';
import { Play, Square, CheckCircle, XCircle, Clock, Plus, Trash2 } from 'lucide-react';

interface TestRunnerProps {
  visible: boolean;
  onClose: () => void;
  testSuites: TestSuite[];
  onAddTestSuite: (suite: TestSuite) => void;
  onRemoveTestSuite: (id: string) => void;
  onUpdateTestSuite: (id: string, suite: Partial<TestSuite>) => void;
  onRunTests: (suiteId?: string) => Promise<void>;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  visible,
  onClose,
  testSuites,
  onAddTestSuite,
  onRemoveTestSuite,
  onUpdateTestSuite,
  onRunTests,
}) => {
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestCode, setNewTestCode] = useState('');
  const [showNewTestDialog, setShowNewTestDialog] = useState(false);

  const getTotalTests = () => {
    return testSuites.reduce((total, suite) => total + suite.tests.length, 0);
  };

  const getPassedTests = () => {
    return testSuites.reduce(
      (total, suite) => total + suite.tests.filter(test => test.status === 'passed').length,
      0
    );
  };

  const getFailedTests = () => {
    return testSuites.reduce(
      (total, suite) => total + suite.tests.filter(test => test.status === 'failed').length,
      0
    );
  };

  const getPendingTests = () => {
    return testSuites.reduce(
      (total, suite) => total + suite.tests.filter(test => test.status === 'pending').length,
      0
    );
  };

  const handleRunAllTests = async () => {
    setIsRunning(true);
    try {
      await onRunTests();
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSuite = async (suiteId: string) => {
    setIsRunning(true);
    try {
      await onRunTests(suiteId);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTest = () => {
    if (!selectedSuite || !newTestName.trim()) return;

    const newTest: TestCase = {
      id: Date.now().toString(),
      name: newTestName,
      description: '',
      code: newTestCode,
      expected: null,
      status: 'pending',
    };

    const updatedSuite = {
      ...selectedSuite,
      tests: [...selectedSuite.tests, newTest],
    };

    onUpdateTestSuite(selectedSuite.id, updatedSuite);
    setSelectedSuite(updatedSuite);
    setNewTestName('');
    setNewTestCode('');
    setShowNewTestDialog(false);
  };

  const handleRemoveTest = (testId: string) => {
    if (!selectedSuite) return;

    const updatedSuite = {
      ...selectedSuite,
      tests: selectedSuite.tests.filter(test => test.id !== testId),
    };

    onUpdateTestSuite(selectedSuite.id, updatedSuite);
    setSelectedSuite(updatedSuite);

    if (selectedTest?.id === testId) {
      setSelectedTest(null);
    }
  };

  const handleAddTestSuite = () => {
    const name = prompt('Test suite name:');
    if (!name) return;

    const newSuite: TestSuite = {
      id: Date.now().toString(),
      name,
      description: '',
      tests: [],
    };

    onAddTestSuite(newSuite);
  };

  const getTestIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-gray-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getSuiteStatus = (suite: TestSuite) => {
    const tests = suite.tests;
    if (tests.length === 0) return 'empty';

    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const pending = tests.filter(t => t.status === 'pending').length;

    if (failed > 0) return 'failed';
    if (pending > 0) return 'pending';
    if (passed === tests.length) return 'passed';
    return 'pending';
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '900px', height: '700px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Test Runner</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Summary */}
          <div className="mb-4 p-3 bg-white border border-gray-400 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>{getPassedTests()} Passed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>{getFailedTests()} Failed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>{getPendingTests()} Pending</span>
                </div>
                <div className="text-gray-600">Total: {getTotalTests()} tests</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRunAllTests}
                  disabled={isRunning}
                  className="px-3 py-1 bg-green-500 text-white border border-green-600 text-xs hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {isRunning ? <Square size={12} /> : <Play size={12} />}
                  {isRunning ? 'Stop' : 'Run All'}
                </button>
                <button
                  onClick={handleAddTestSuite}
                  className="px-3 py-1 bg-blue-500 text-white border border-blue-600 text-xs hover:bg-blue-600 flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Suite
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex gap-4">
            {/* Test suites */}
            <div className="w-1/3 bg-white border border-gray-400 flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold">
                Test Suites
              </div>
              <div className="flex-1 overflow-auto">
                {testSuites.map(suite => (
                  <div
                    key={suite.id}
                    className={`p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedSuite?.id === suite.id ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => setSelectedSuite(suite)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTestIcon(getSuiteStatus(suite) as any)}
                        <span className="text-sm font-medium">{suite.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRunSuite(suite.id);
                          }}
                          disabled={isRunning}
                          className="p-1 hover:bg-gray-200 rounded text-green-600"
                          title="Run Suite"
                        >
                          <Play size={12} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onRemoveTestSuite(suite.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Delete Suite"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {suite.tests.length} test{suite.tests.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test cases */}
            <div className="w-1/3 bg-white border border-gray-400 flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold flex items-center justify-between">
                <span>Test Cases</span>
                {selectedSuite && (
                  <button
                    onClick={() => setShowNewTestDialog(true)}
                    className="p-1 hover:bg-gray-200 rounded text-blue-600"
                    title="Add Test"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {selectedSuite ? (
                  selectedSuite.tests.map(test => (
                    <div
                      key={test.id}
                      className={`p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedTest?.id === test.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedTest(test)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTestIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {test.duration && (
                            <span className="text-xs text-gray-500">
                              {formatDuration(test.duration)}
                            </span>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveTest(test.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete Test"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {test.description && (
                        <div className="text-xs text-gray-600 mt-1">{test.description}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-sm">Select a test suite to view tests</div>
                  </div>
                )}
              </div>
            </div>

            {/* Test details */}
            <div className="w-1/3 bg-white border border-gray-400 flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold">
                Test Details
              </div>
              <div className="flex-1 overflow-auto p-2">
                {selectedTest ? (
                  <div>
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getTestIcon(selectedTest.status)}
                        <span className="font-medium">{selectedTest.name}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Status: <span className="capitalize">{selectedTest.status}</span>
                      </div>
                      {selectedTest.duration && (
                        <div className="text-xs text-gray-600">
                          Duration: {formatDuration(selectedTest.duration)}
                        </div>
                      )}
                    </div>

                    {selectedTest.description && (
                      <div className="mb-3">
                        <div className="text-xs font-bold mb-1">Description:</div>
                        <div className="text-xs text-gray-700">{selectedTest.description}</div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="text-xs font-bold mb-1">Test Code:</div>
                      <div className="bg-gray-100 border border-gray-300 p-2 text-xs font-mono overflow-auto max-h-32">
                        {selectedTest.code || '// No test code'}
                      </div>
                    </div>

                    {selectedTest.expected !== null && (
                      <div className="mb-3">
                        <div className="text-xs font-bold mb-1">Expected:</div>
                        <div className="bg-gray-100 border border-gray-300 p-2 text-xs font-mono">
                          {JSON.stringify(selectedTest.expected, null, 2)}
                        </div>
                      </div>
                    )}

                    {selectedTest.actual !== undefined && (
                      <div className="mb-3">
                        <div className="text-xs font-bold mb-1">Actual:</div>
                        <div className="bg-gray-100 border border-gray-300 p-2 text-xs font-mono">
                          {JSON.stringify(selectedTest.actual, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <div className="text-sm">Select a test to view details</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New test dialog */}
      {showNewTestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div
            className="bg-gray-200 border-2 border-gray-400 shadow-lg"
            style={{ width: '500px' }}
          >
            <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
              <span>Add New Test</span>
              <button
                onClick={() => setShowNewTestDialog(false)}
                className="text-white hover:bg-blue-700 px-2"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-xs font-bold mb-1">Test Name:</label>
                <input
                  type="text"
                  value={newTestName}
                  onChange={e => setNewTestName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-400 text-sm"
                  placeholder="Enter test name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1">Test Code:</label>
                <textarea
                  value={newTestCode}
                  onChange={e => setNewTestCode(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-400 text-sm font-mono"
                  rows={8}
                  placeholder="// Write your test code here"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewTestDialog(false)}
                  className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTest}
                  disabled={!newTestName.trim()}
                  className="px-4 py-1 bg-blue-500 text-white border border-blue-600 text-xs hover:bg-blue-600 disabled:opacity-50"
                >
                  Add Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
