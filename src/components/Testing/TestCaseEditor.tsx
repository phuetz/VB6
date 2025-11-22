import React, { useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { vb6TestFramework, TestCase } from '../../services/VB6TestFramework';
import { 
  Save, 
  X, 
  FileText, 
  Code, 
  Settings,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

interface TestCaseEditorProps {
  testCase?: TestCase;
  suiteId: string;
  onSave: (testCase: TestCase) => void;
  onCancel: () => void;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  suiteId,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(testCase?.name || '');
  const [description, setDescription] = useState(testCase?.description || '');
  const [category, setCategory] = useState(testCase?.category || 'General');
  const [type, setType] = useState<TestCase['type']>(testCase?.type || 'unit');
  const [code, setCode] = useState(testCase?.code || '');
  const [setup, setSetup] = useState(testCase?.setup || '');
  const [teardown, setTeardown] = useState(testCase?.teardown || '');
  const [expectedResult, setExpectedResult] = useState(testCase?.expectedResult || '');
  const [activeTab, setActiveTab] = useState<'code' | 'setup' | 'teardown'>('code');
  const [errors, setErrors] = useState<string[]>([]);

  const validateTest = useCallback((): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Test name is required');
    }

    if (!category.trim()) {
      newErrors.push('Category is required');
    }

    if (!code.trim()) {
      newErrors.push('Test code is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [name, category, code]);

  const handleSave = useCallback(() => {
    if (!validateTest()) {
      return;
    }

    const newTestCase: TestCase = {
      id: testCase?.id || '',
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      type,
      code: code.trim(),
      setup: setup.trim() || undefined,
      teardown: teardown.trim() || undefined,
      expectedResult: expectedResult.trim() || undefined,
      status: testCase?.status || 'pending'
    };

    if (!testCase) {
      // Creating new test
      const createdTest = vb6TestFramework.addTest(suiteId, newTestCase);
      onSave(createdTest);
    } else {
      // Updating existing test
      onSave(newTestCase);
    }
  }, [testCase, suiteId, name, description, category, type, code, setup, teardown, expectedResult, validateTest, onSave]);

  const getCodeTemplate = () => {
    return `' Test: ${name || 'New Test'}
' Description: ${description || 'Test description'}
' Category: ${category}

' Test implementation
Dim result As Boolean

' Your test code here
Assert.IsTrue result, "Test should pass"
`;
  };

  const getSetupTemplate = () => {
    return `' Setup code runs before the test
' Initialize test data and objects here

Dim testData As Collection
Set testData = New Collection

' Add test data
testData.Add "Item1"
testData.Add "Item2"
`;
  };

  const getTeardownTemplate = () => {
    return `' Teardown code runs after the test
' Clean up resources and reset state

Set testData = Nothing
' Reset any global variables
`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-4/5 h-4/5 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            {testCase ? 'Edit Test Case' : 'New Test Case'}
          </h2>
          <button
            onClick={onCancel}
            className="hover:bg-blue-700 p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Left Panel - Properties */}
          <div className="w-80 border-r border-gray-300 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings size={16} />
              Test Properties
            </h3>

            {errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    {errors.map((error, i) => (
                      <div key={i}>{error}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Test name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  rows={3}
                  placeholder="Test description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="e.g., Controls, Functions, Events"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Test Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TestCase['type'])}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="unit">Unit Test</option>
                  <option value="integration">Integration Test</option>
                  <option value="visual">Visual Test</option>
                  <option value="performance">Performance Test</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expected Result</label>
                <textarea
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  rows={2}
                  placeholder="Expected test outcome (optional)"
                />
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-sm mb-2">Assertion Examples:</h4>
              <div className="space-y-1 text-xs text-gray-600 font-mono">
                <div>Assert.AreEqual expected, actual</div>
                <div>Assert.IsTrue condition</div>
                <div>Assert.IsFalse condition</div>
                <div>Assert.IsNull value</div>
                <div>Assert.Contains substring, string</div>
                <div>Assert.Throws Function</div>
              </div>
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-300 px-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`py-2 px-1 border-b-2 transition-colors text-sm font-medium ${
                    activeTab === 'code'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Code size={16} className="inline mr-1" />
                  Test Code *
                </button>
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`py-2 px-1 border-b-2 transition-colors text-sm font-medium ${
                    activeTab === 'setup'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Setup
                </button>
                <button
                  onClick={() => setActiveTab('teardown')}
                  className={`py-2 px-1 border-b-2 transition-colors text-sm font-medium ${
                    activeTab === 'teardown'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Teardown
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
              {activeTab === 'code' && (
                <MonacoEditor
                  language="vb"
                  value={code || getCodeTemplate()}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                  }}
                />
              )}
              {activeTab === 'setup' && (
                <MonacoEditor
                  language="vb"
                  value={setup || getSetupTemplate()}
                  onChange={(value) => setSetup(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                  }}
                />
              )}
              {activeTab === 'teardown' && (
                <MonacoEditor
                  language="vb"
                  value={teardown || getTeardownTemplate()}
                  onChange={(value) => setTeardown(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-4 py-3 flex justify-between">
          <div className="text-sm text-gray-600">
            {type === 'unit' && "Unit tests should test individual functions or methods in isolation"}
            {type === 'integration' && "Integration tests verify that components work together correctly"}
            {type === 'visual' && "Visual tests capture and compare UI screenshots"}
            {type === 'performance' && "Performance tests measure execution time and resource usage"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-2"
            >
              <Save size={16} />
              {testCase ? 'Update Test' : 'Create Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseEditor;