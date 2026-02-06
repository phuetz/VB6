import React, { useState, useCallback, useEffect } from 'react';
import { vb6TestFramework, TestSuite, TestCase, TestResult } from '../../services/VB6TestFramework';
import {
  Play,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Activity,
  BarChart,
  Download,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';

interface TestRunnerProps {
  className?: string;
}

const TestRunner: React.FC<TestRunnerProps> = ({ className = '' }) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Map<string, TestResult[]>>(new Map());
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCoverage, setShowCoverage] = useState(false);
  const [coverageData, setCoverageData] = useState<any>(null);

  // Load test suites
  useEffect(() => {
    loadTestSuites();
  }, []);

  const loadTestSuites = () => {
    // Create sample test suites for demonstration
    const suite1 = vb6TestFramework.createTestSuite(
      'Form Controls',
      'Tests for form control functionality'
    );

    vb6TestFramework.addTest(suite1.id, {
      name: 'TextBox Value Property',
      category: 'Controls',
      type: 'unit',
      code: `
        Dim txt As TextBox
        Set txt = CreateObject("VB.TextBox")
        
        txt.Text = "Hello World"
        Assert.AreEqual "Hello World", txt.Text, "Text property should be set correctly"
        
        txt.MaxLength = 10
        txt.Text = "This is a very long string"
        Assert.AreEqual 10, Len(txt.Text), "Text should be truncated to MaxLength"
      `,
    });

    vb6TestFramework.addTest(suite1.id, {
      name: 'CommandButton Click Event',
      category: 'Events',
      type: 'unit',
      code: `
        Dim btn As CommandButton
        Dim clicked As Boolean
        
        Set btn = CreateObject("VB.CommandButton")
        clicked = False
        
        ' Simulate click event
        btn.Click
        Assert.IsTrue clicked, "Click event should fire"
      `,
      setup: `
        Sub CommandButton1_Click()
          clicked = True
        End Sub
      `,
    });

    vb6TestFramework.addTest(suite1.id, {
      name: 'ListBox Item Management',
      category: 'Controls',
      type: 'unit',
      code: `
        Dim lst As ListBox
        Set lst = CreateObject("VB.ListBox")
        
        lst.AddItem "Item 1"
        lst.AddItem "Item 2"
        lst.AddItem "Item 3"
        
        Assert.AreEqual 3, lst.ListCount, "Should have 3 items"
        Assert.AreEqual "Item 2", lst.List(1), "Second item should be 'Item 2'"
        
        lst.RemoveItem 1
        Assert.AreEqual 2, lst.ListCount, "Should have 2 items after removal"
      `,
    });

    const suite2 = vb6TestFramework.createTestSuite(
      'String Functions',
      'Tests for VB6 string functions'
    );

    vb6TestFramework.addTest(suite2.id, {
      name: 'String Manipulation',
      category: 'Functions',
      type: 'unit',
      code: `
        Assert.AreEqual "HELLO", UCase("hello"), "UCase should convert to uppercase"
        Assert.AreEqual "world", LCase("WORLD"), "LCase should convert to lowercase"
        Assert.AreEqual "Hello", Left("Hello World", 5), "Left should return first 5 characters"
        Assert.AreEqual "World", Right("Hello World", 5), "Right should return last 5 characters"
        Assert.AreEqual "lo Wo", Mid("Hello World", 4, 5), "Mid should return substring"
      `,
    });

    vb6TestFramework.addTest(suite2.id, {
      name: 'String Trimming',
      category: 'Functions',
      type: 'unit',
      code: `
        Assert.AreEqual "Hello", Trim("  Hello  "), "Trim should remove spaces"
        Assert.AreEqual "Hello  ", LTrim("  Hello  "), "LTrim should remove left spaces"
        Assert.AreEqual "  Hello", RTrim("  Hello  "), "RTrim should remove right spaces"
      `,
    });

    const suite3 = vb6TestFramework.createTestSuite(
      'Math Functions',
      'Tests for mathematical operations'
    );

    vb6TestFramework.addTest(suite3.id, {
      name: 'Basic Math Operations',
      category: 'Math',
      type: 'unit',
      code: `
        Assert.AreEqual 10, Abs(-10), "Abs should return absolute value"
        Assert.AreEqual 25, Sqr(625), "Sqr should return square root"
        Assert.AreEqual 8, 2 ^ 3, "Power operator should work"
        Assert.IsTrue Sin(0) = 0, "Sin(0) should be 0"
        Assert.IsTrue Cos(0) = 1, "Cos(0) should be 1"
      `,
    });

    // Update state with all suites
    const allSuites = [suite1, suite2, suite3];
    setTestSuites(allSuites);
    if (allSuites.length > 0) {
      setSelectedSuite(allSuites[0].id);
    }
  };

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults(new Map());

    try {
      const results = await vb6TestFramework.runAllTests();
      setTestResults(results);

      // Get coverage data
      const coverage = vb6TestFramework.getCoverageReport();
      setCoverageData(coverage);
    } catch (error) {
      console.error('Test run failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const runSuite = useCallback(async (suiteId: string) => {
    setIsRunning(true);

    try {
      const results = await vb6TestFramework.runTestSuite(suiteId);
      setTestResults(prev => {
        const newResults = new Map(prev);
        newResults.set(suiteId, results);
        return newResults;
      });
    } catch (error) {
      console.error('Suite run failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const exportReport = useCallback(() => {
    const report = vb6TestFramework.generateReport('html');
    const blob = new Blob([report], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vb6-test-report.html';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const getTestIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      case 'running':
        return <RefreshCw size={16} className="text-blue-600 animate-spin" />;
      default:
        return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const filteredTests = (suite: TestSuite) => {
    let tests = suite.tests;

    // Apply status filter
    if (filter !== 'all') {
      tests = tests.filter(test => test.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      tests = tests.filter(
        test =>
          test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return tests;
  };

  const selectedSuiteData = testSuites.find(s => s.id === selectedSuite);

  return (
    <div className={`bg-white border border-gray-400 flex ${className}`}>
      {/* Left Panel - Test Suites */}
      <div className="w-64 border-r border-gray-400">
        <div className="bg-blue-600 text-white p-2">
          <span className="text-sm font-bold">Test Explorer</span>
        </div>
        <div className="p-2">
          <div className="mb-2 flex gap-1">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
            >
              <Play size={12} className="inline mr-1" />
              Run All
            </button>
            <button
              onClick={() => setShowCoverage(!showCoverage)}
              className={`px-2 py-1 rounded text-xs ${
                showCoverage ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <BarChart size={12} />
            </button>
            <button
              onClick={exportReport}
              className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
            >
              <Download size={12} />
            </button>
          </div>

          <div className="space-y-1">
            {testSuites.map(suite => {
              const suiteResults = testResults.get(suite.id);
              const passedCount = suiteResults?.filter(r => r.passed).length || 0;
              const totalCount = suite.tests.length;

              return (
                <div
                  key={suite.id}
                  onClick={() => setSelectedSuite(suite.id)}
                  className={`p-2 rounded cursor-pointer text-xs ${
                    selectedSuite === suite.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{suite.name}</span>
                    {suite.status === 'running' ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : suite.status !== 'pending' ? (
                      <span
                        className={`text-xs ${
                          suite.status === 'passed'
                            ? 'text-green-600'
                            : suite.status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {passedCount}/{totalCount}
                      </span>
                    ) : null}
                  </div>
                  {suite.description && (
                    <div className="text-gray-600 mt-1">{suite.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Test Details */}
      <div className="flex-1 flex flex-col">
        {selectedSuiteData ? (
          <>
            {/* Suite Header */}
            <div className="bg-gray-100 border-b border-gray-400 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedSuiteData.name}</h3>
                  {selectedSuiteData.description && (
                    <p className="text-xs text-gray-600">{selectedSuiteData.description}</p>
                  )}
                </div>
                <button
                  onClick={() => runSuite(selectedSuiteData.id)}
                  disabled={isRunning}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                >
                  <Play size={12} className="inline mr-1" />
                  Run Suite
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-2 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border rounded"
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as any)}
                  className="px-2 py-1 text-xs border rounded"
                >
                  <option value="all">All Tests</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Test List */}
            <div className="flex-1 overflow-y-auto">
              {showCoverage && coverageData ? (
                <div className="p-4">
                  <h4 className="font-semibold mb-3">Code Coverage</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Lines</span>
                        <span>{coverageData.overall.lines.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${coverageData.overall.lines.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Functions</span>
                        <span>{coverageData.overall.functions.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${coverageData.overall.functions.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Branches</span>
                        <span>{coverageData.overall.branches.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${coverageData.overall.branches.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTests(selectedSuiteData).map(test => {
                    const result = testResults
                      .get(selectedSuiteData.id)
                      ?.find(r => r.testId === test.id);

                    return (
                      <div key={test.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-start gap-2">
                          {getTestIcon(test.status)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{test.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="inline-block bg-gray-200 px-2 py-0.5 rounded mr-2">
                                {test.category}
                              </span>
                              <span className="inline-block bg-gray-200 px-2 py-0.5 rounded">
                                {test.type}
                              </span>
                              {test.duration && (
                                <span className="ml-2 text-gray-500">{test.duration}ms</span>
                              )}
                            </div>
                            {test.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                {test.error}
                              </div>
                            )}
                            {result && result.assertions.length > 0 && (
                              <div className="mt-2 text-xs">
                                <div className="font-semibold mb-1">Assertions:</div>
                                {result.assertions.map((assertion, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-2 ${assertion.passed ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    {assertion.passed ? '✓' : '✗'}
                                    <span>
                                      {assertion.type}:{' '}
                                      {assertion.message ||
                                        `Expected ${assertion.expected}, got ${assertion.actual}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-2 opacity-50" />
              <p>Select a test suite to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRunner;
