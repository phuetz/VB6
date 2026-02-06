import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Code Coverage Types
export enum CoverageType {
  Line = 'Line',
  Function = 'Function',
  Branch = 'Branch',
  Condition = 'Condition',
}

export enum CoverageStatus {
  NotExecuted = 'NotExecuted',
  Executed = 'Executed',
  PartiallyExecuted = 'PartiallyExecuted',
  Excluded = 'Excluded',
}

export enum FileType {
  Form = 'Form',
  Module = 'Module',
  Class = 'Class',
  UserControl = 'UserControl',
  PropertyPage = 'PropertyPage',
}

export interface CoveragePoint {
  id: string;
  type: CoverageType;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  endLineNumber?: number;
  endColumnNumber?: number;
  functionName?: string;
  branchId?: string;
  conditionId?: string;
  hitCount: number;
  status: CoverageStatus;
  executionTime: number;
  lastHit?: Date;
  sourceCode: string;
}

export interface FunctionCoverage {
  name: string;
  fileName: string;
  startLine: number;
  endLine: number;
  hitCount: number;
  status: CoverageStatus;
  linesCovered: number;
  totalLines: number;
  branchesCovered: number;
  totalBranches: number;
  cyclomaticComplexity: number;
  executionTime: number;
  parameters: string[];
  returnType?: string;
}

export interface FileCoverage {
  fileName: string;
  fileType: FileType;
  totalLines: number;
  executableLines: number;
  coveredLines: number;
  excludedLines: number;
  linesCoverage: number;
  totalFunctions: number;
  coveredFunctions: number;
  functionsCoverage: number;
  totalBranches: number;
  coveredBranches: number;
  branchesCoverage: number;
  functions: FunctionCoverage[];
  coveragePoints: CoveragePoint[];
  lastAnalyzed: Date;
}

export interface CoverageRun {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  testSuiteName?: string;
  totalLines: number;
  coveredLines: number;
  overallCoverage: number;
  files: FileCoverage[];
  settings: CoverageSettings;
}

export interface CoverageSettings {
  enableLineCoverage: boolean;
  enableFunctionCoverage: boolean;
  enableBranchCoverage: boolean;
  enableConditionCoverage: boolean;
  includeSystemCode: boolean;
  excludeGeneratedCode: boolean;
  excludeTestCode: boolean;
  excludePatterns: string[];
  includePatterns: string[];
  minCoverageThreshold: number;
  reportFormat: 'HTML' | 'XML' | 'JSON' | 'CSV';
  highlightUncoveredCode: boolean;
  showHitCounts: boolean;
  trackExecutionTime: boolean;
  aggregateData: boolean;
}

export interface CoverageReport {
  id: string;
  name: string;
  runId: string;
  generatedDate: Date;
  format: 'HTML' | 'XML' | 'JSON' | 'CSV';
  summary: {
    totalFiles: number;
    totalLines: number;
    coveredLines: number;
    linesCoverage: number;
    totalFunctions: number;
    coveredFunctions: number;
    functionsCoverage: number;
    totalBranches: number;
    coveredBranches: number;
    branchesCoverage: number;
  };
  content: string;
}

interface CodeCoverageToolProps {
  projectFiles?: string[];
  onStartCoverage?: (settings: CoverageSettings) => Promise<string>;
  onStopCoverage?: (runId: string) => Promise<void>;
  onAnalyzeCoverage?: (runId: string) => Promise<CoverageRun>;
  onGenerateReport?: (run: CoverageRun, format: string) => Promise<CoverageReport>;
  onExportData?: (run: CoverageRun, format: string) => Promise<void>;
  onNavigateToCode?: (fileName: string, lineNumber: number) => void;
}

export const CodeCoverageTool: React.FC<CodeCoverageToolProps> = ({
  projectFiles = [],
  onStartCoverage,
  onStopCoverage,
  onAnalyzeCoverage,
  onGenerateReport,
  onExportData,
  onNavigateToCode,
}) => {
  const [coverageRuns, setCoverageRuns] = useState<CoverageRun[]>([]);
  const [currentRun, setCurrentRun] = useState<CoverageRun | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileCoverage | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<FunctionCoverage | null>(null);
  const [settings, setSettings] = useState<CoverageSettings>({
    enableLineCoverage: true,
    enableFunctionCoverage: true,
    enableBranchCoverage: true,
    enableConditionCoverage: false,
    includeSystemCode: false,
    excludeGeneratedCode: true,
    excludeTestCode: false,
    excludePatterns: ['*.Designer.*', 'AssemblyInfo.*'],
    includePatterns: ['*.frm', '*.bas', '*.cls'],
    minCoverageThreshold: 80,
    reportFormat: 'HTML',
    highlightUncoveredCode: true,
    showHitCounts: true,
    trackExecutionTime: true,
    aggregateData: true,
  });
  const [activeTab, setActiveTab] = useState<
    'summary' | 'files' | 'functions' | 'reports' | 'settings'
  >('summary');
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'coverage' | 'lines' | 'functions'>('coverage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCoverage, setFilterCoverage] = useState<'all' | 'covered' | 'uncovered' | 'partial'>(
    'all'
  );

  const eventEmitter = useRef(new EventEmitter());

  // Initialize with sample coverage data
  useEffect(() => {
    const sampleCoveragePoints: CoveragePoint[] = [
      {
        id: 'cp1',
        type: CoverageType.Line,
        fileName: 'Form1.frm',
        lineNumber: 15,
        columnNumber: 4,
        hitCount: 5,
        status: CoverageStatus.Executed,
        executionTime: 0.5,
        lastHit: new Date(Date.now() - 3600000),
        sourceCode: 'Dim intResult As Integer',
      },
      {
        id: 'cp2',
        type: CoverageType.Line,
        fileName: 'Form1.frm',
        lineNumber: 16,
        columnNumber: 4,
        hitCount: 0,
        status: CoverageStatus.NotExecuted,
        executionTime: 0,
        sourceCode: 'intResult = ProcessData(strInput)',
      },
      {
        id: 'cp3',
        type: CoverageType.Function,
        fileName: 'Module1.bas',
        lineNumber: 10,
        columnNumber: 1,
        endLineNumber: 25,
        functionName: 'ProcessData',
        hitCount: 3,
        status: CoverageStatus.Executed,
        executionTime: 12.5,
        lastHit: new Date(Date.now() - 1800000),
        sourceCode: 'Function ProcessData(strData As String) As Integer',
      },
      {
        id: 'cp4',
        type: CoverageType.Branch,
        fileName: 'Module1.bas',
        lineNumber: 18,
        columnNumber: 4,
        branchId: 'if_branch_1',
        hitCount: 1,
        status: CoverageStatus.PartiallyExecuted,
        executionTime: 2.1,
        sourceCode: 'If Len(strData) > 0 Then',
      },
    ];

    const sampleFunctions: FunctionCoverage[] = [
      {
        name: 'Form_Load',
        fileName: 'Form1.frm',
        startLine: 8,
        endLine: 20,
        hitCount: 1,
        status: CoverageStatus.Executed,
        linesCovered: 10,
        totalLines: 12,
        branchesCovered: 2,
        totalBranches: 3,
        cyclomaticComplexity: 4,
        executionTime: 8.5,
        parameters: [],
      },
      {
        name: 'ProcessData',
        fileName: 'Module1.bas',
        startLine: 10,
        endLine: 25,
        hitCount: 3,
        status: CoverageStatus.Executed,
        linesCovered: 12,
        totalLines: 15,
        branchesCovered: 3,
        totalBranches: 4,
        cyclomaticComplexity: 5,
        executionTime: 12.5,
        parameters: ['strData As String'],
        returnType: 'Integer',
      },
      {
        name: 'ValidateInput',
        fileName: 'Module1.bas',
        startLine: 30,
        endLine: 45,
        hitCount: 0,
        status: CoverageStatus.NotExecuted,
        linesCovered: 0,
        totalLines: 15,
        branchesCovered: 0,
        totalBranches: 2,
        cyclomaticComplexity: 3,
        executionTime: 0,
        parameters: ['strInput As String'],
        returnType: 'Boolean',
      },
    ];

    const sampleFiles: FileCoverage[] = [
      {
        fileName: 'Form1.frm',
        fileType: FileType.Form,
        totalLines: 85,
        executableLines: 45,
        coveredLines: 35,
        excludedLines: 5,
        linesCoverage: 77.8,
        totalFunctions: 8,
        coveredFunctions: 6,
        functionsCoverage: 75,
        totalBranches: 15,
        coveredBranches: 12,
        branchesCoverage: 80,
        functions: [sampleFunctions[0]],
        coveragePoints: sampleCoveragePoints.filter(cp => cp.fileName === 'Form1.frm'),
        lastAnalyzed: new Date(Date.now() - 1800000),
      },
      {
        fileName: 'Module1.bas',
        fileType: FileType.Module,
        totalLines: 120,
        executableLines: 80,
        coveredLines: 50,
        excludedLines: 10,
        linesCoverage: 62.5,
        totalFunctions: 5,
        coveredFunctions: 3,
        functionsCoverage: 60,
        totalBranches: 20,
        coveredBranches: 12,
        branchesCoverage: 60,
        functions: [sampleFunctions[1], sampleFunctions[2]],
        coveragePoints: sampleCoveragePoints.filter(cp => cp.fileName === 'Module1.bas'),
        lastAnalyzed: new Date(Date.now() - 1800000),
      },
      {
        fileName: 'DataClass.cls',
        fileType: FileType.Class,
        totalLines: 200,
        executableLines: 150,
        coveredLines: 45,
        excludedLines: 15,
        linesCoverage: 30,
        totalFunctions: 12,
        coveredFunctions: 4,
        functionsCoverage: 33.3,
        totalBranches: 35,
        coveredBranches: 8,
        branchesCoverage: 22.9,
        functions: [],
        coveragePoints: [],
        lastAnalyzed: new Date(Date.now() - 1800000),
      },
    ];

    const sampleRun: CoverageRun = {
      id: 'run1',
      name: 'Integration Test Coverage',
      description: 'Coverage analysis for integration test suite',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1800000),
      duration: 1800,
      status: 'Completed',
      testSuiteName: 'IntegrationTests',
      totalLines: 405,
      coveredLines: 130,
      overallCoverage: 32.1,
      files: sampleFiles,
      settings,
    };

    setCoverageRuns([sampleRun]);
    setCurrentRun(sampleRun);
  }, [settings]);

  // Filter and sort files
  const processedFiles = useMemo(() => {
    if (!currentRun) return [];

    const filtered = currentRun.files.filter(file => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        if (!file.fileName.toLowerCase().includes(searchLower)) return false;
      }

      // Coverage filter
      switch (filterCoverage) {
        case 'covered':
          return file.linesCoverage >= settings.minCoverageThreshold;
        case 'uncovered':
          return file.linesCoverage < settings.minCoverageThreshold;
        case 'partial':
          return file.linesCoverage > 0 && file.linesCoverage < 100;
        default:
          return true;
      }
    });

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'coverage':
          comparison = a.linesCoverage - b.linesCoverage;
          break;
        case 'lines':
          comparison = a.totalLines - b.totalLines;
          break;
        case 'functions':
          comparison = a.totalFunctions - b.totalFunctions;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [currentRun, searchText, filterCoverage, sortBy, sortOrder, settings.minCoverageThreshold]);

  // Start coverage analysis
  const startCoverage = useCallback(async () => {
    if (!onStartCoverage) return;

    setIsRunning(true);
    try {
      const runId = await onStartCoverage(settings);

      const newRun: CoverageRun = {
        id: runId,
        name: `Coverage Run ${new Date().toLocaleString()}`,
        description: 'Code coverage analysis',
        startTime: new Date(),
        duration: 0,
        status: 'Running',
        totalLines: 0,
        coveredLines: 0,
        overallCoverage: 0,
        files: [],
        settings,
      };

      setCoverageRuns(prev => [newRun, ...prev]);
      setCurrentRun(newRun);
    } catch (error) {
      console.error('Failed to start coverage:', error);
    } finally {
      setIsRunning(false);
    }
  }, [settings, onStartCoverage]);

  // Stop coverage analysis
  const stopCoverage = useCallback(async () => {
    if (!currentRun || !onStopCoverage) return;

    try {
      await onStopCoverage(currentRun.id);

      if (onAnalyzeCoverage) {
        const analyzedRun = await onAnalyzeCoverage(currentRun.id);
        setCoverageRuns(prev => prev.map(run => (run.id === currentRun.id ? analyzedRun : run)));
        setCurrentRun(analyzedRun);
      }
    } catch (error) {
      console.error('Failed to stop coverage:', error);
    }
  }, [currentRun, onStopCoverage, onAnalyzeCoverage]);

  // Generate coverage report
  const generateReport = useCallback(
    async (format: 'HTML' | 'XML' | 'JSON' | 'CSV') => {
      if (!currentRun || !onGenerateReport) return;

      try {
        const report = await onGenerateReport(currentRun, format);
        // Handle report display or download
      } catch (error) {
        console.error('Failed to generate report:', error);
      }
    },
    [currentRun, onGenerateReport]
  );

  // Get coverage color
  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 80) return 'text-green-600';
    if (coverage >= 60) return 'text-yellow-600';
    if (coverage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get coverage background color
  const getCoverageBackgroundColor = (coverage: number): string => {
    if (coverage >= 80) return 'bg-green-100';
    if (coverage >= 60) return 'bg-yellow-100';
    if (coverage >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: FileType): string => {
    switch (fileType) {
      case FileType.Form:
        return '🖼️';
      case FileType.Module:
        return '📄';
      case FileType.Class:
        return '🏛️';
      case FileType.UserControl:
        return '🎛️';
      case FileType.PropertyPage:
        return '📋';
      default:
        return '📄';
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Code Coverage</h3>
          {currentRun && (
            <span
              className={`px-2 py-1 text-xs rounded ${
                currentRun.status === 'Running'
                  ? 'bg-blue-100 text-blue-800'
                  : currentRun.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : currentRun.status === 'Failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {currentRun.status}
            </span>
          )}
          {isRunning && <div className="text-xs text-blue-600 animate-pulse">Analyzing...</div>}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRunDialog(true)}
            disabled={isRunning}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            title="Start Coverage"
          >
            ▶️
          </button>

          <button
            onClick={stopCoverage}
            disabled={!currentRun || currentRun.status !== 'Running'}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
            title="Stop Coverage"
          >
            ⏹️
          </button>

          <button
            onClick={() => generateReport('HTML')}
            disabled={!currentRun || currentRun.status === 'Running'}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            title="Generate Report"
          >
            📊
          </button>

          <button
            onClick={() => onExportData?.(currentRun!, 'CSV')}
            disabled={!currentRun}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            title="Export Data"
          >
            💾
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <select
          value={currentRun?.id || ''}
          onChange={e => {
            const run = coverageRuns.find(r => r.id === e.target.value);
            setCurrentRun(run || null);
            setSelectedFile(null);
            setSelectedFunction(null);
          }}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="">Select Coverage Run...</option>
          {coverageRuns.map(run => (
            <option key={run.id} value={run.id}>
              {run.name} - {run.overallCoverage.toFixed(1)}%
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search files..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded w-32"
        />

        <select
          value={filterCoverage}
          onChange={e => setFilterCoverage(e.target.value as any)}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="all">All Files</option>
          <option value="covered">Well Covered</option>
          <option value="uncovered">Poorly Covered</option>
          <option value="partial">Partially Covered</option>
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="coverage">Coverage</option>
          <option value="name">Name</option>
          <option value="lines">Lines</option>
          <option value="functions">Functions</option>
        </select>

        <button
          onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
          title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {sortOrder === 'asc' ? '⬆️' : '⬇️'}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.enableLineCoverage}
                onChange={e =>
                  setSettings(prev => ({ ...prev, enableLineCoverage: e.target.checked }))
                }
              />
              Line Coverage
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.enableFunctionCoverage}
                onChange={e =>
                  setSettings(prev => ({ ...prev, enableFunctionCoverage: e.target.checked }))
                }
              />
              Function Coverage
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.enableBranchCoverage}
                onChange={e =>
                  setSettings(prev => ({ ...prev, enableBranchCoverage: e.target.checked }))
                }
              />
              Branch Coverage
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.highlightUncoveredCode}
                onChange={e =>
                  setSettings(prev => ({ ...prev, highlightUncoveredCode: e.target.checked }))
                }
              />
              Highlight Uncovered
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-300">
        {[
          { key: 'summary', label: 'Summary', icon: '📊' },
          { key: 'files', label: 'Files', icon: '📁' },
          { key: 'functions', label: 'Functions', icon: '🔧' },
          { key: 'reports', label: 'Reports', icon: '📋' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              activeTab === tab.key
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="h-full overflow-y-auto p-4">
            {currentRun ? (
              <div className="space-y-6">
                {/* Overall Coverage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-center mb-2">
                      <span className={getCoverageColor(currentRun.overallCoverage)}>
                        {currentRun.overallCoverage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 text-center">Overall Coverage</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          currentRun.overallCoverage >= 80
                            ? 'bg-green-500'
                            : currentRun.overallCoverage >= 60
                              ? 'bg-yellow-500'
                              : currentRun.overallCoverage >= 40
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${currentRun.overallCoverage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-center mb-2">
                      {currentRun.coveredLines}/{currentRun.totalLines}
                    </div>
                    <div className="text-sm text-gray-600 text-center">Lines Covered</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-center mb-2">
                      {currentRun.files.length}
                    </div>
                    <div className="text-sm text-gray-600 text-center">Files Analyzed</div>
                  </div>
                </div>

                {/* Coverage Breakdown */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Coverage Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentRun.files.slice(0, 6).map(file => (
                      <div
                        key={file.fileName}
                        className={`p-3 rounded-lg border ${getCoverageBackgroundColor(file.linesCoverage)}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span>{getFileTypeIcon(file.fileType)}</span>
                          <span className="font-medium truncate">{file.fileName}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Lines:</span>
                            <span className={getCoverageColor(file.linesCoverage)}>
                              {file.linesCoverage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Functions:</span>
                            <span className={getCoverageColor(file.functionsCoverage)}>
                              {file.functionsCoverage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Branches:</span>
                            <span className={getCoverageColor(file.branchesCoverage)}>
                              {file.branchesCoverage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Run Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Name:</label>
                        <div>{currentRun.name}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Status:</label>
                        <div>{currentRun.status}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Start Time:</label>
                        <div>{currentRun.startTime.toLocaleString()}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Duration:</label>
                        <div>{formatDuration(currentRun.duration)}</div>
                      </div>
                      {currentRun.testSuiteName && (
                        <div>
                          <label className="font-medium text-gray-700">Test Suite:</label>
                          <div>{currentRun.testSuiteName}</div>
                        </div>
                      )}
                      {currentRun.description && (
                        <div className="col-span-2">
                          <label className="font-medium text-gray-700">Description:</label>
                          <div>{currentRun.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg">No Coverage Data</p>
                  <p className="text-sm mt-2">Start a coverage analysis to view results</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="h-full overflow-y-auto">
            {processedFiles.length > 0 ? (
              <div className="space-y-1">
                {processedFiles.map(file => (
                  <div
                    key={file.fileName}
                    className={`flex items-center py-2 px-4 cursor-pointer hover:bg-gray-50 ${
                      selectedFile?.fileName === file.fileName ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <span className="w-6">{getFileTypeIcon(file.fileType)}</span>

                    <div className="flex-1 min-w-0 mx-4">
                      <div className="font-medium truncate">{file.fileName}</div>
                      <div className="text-xs text-gray-500">
                        {file.executableLines} executable lines, {file.totalFunctions} functions
                      </div>
                    </div>

                    <div className="w-20 text-center">
                      <div className={`font-medium ${getCoverageColor(file.linesCoverage)}`}>
                        {file.linesCoverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Lines</div>
                    </div>

                    <div className="w-20 text-center">
                      <div className={`font-medium ${getCoverageColor(file.functionsCoverage)}`}>
                        {file.functionsCoverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Functions</div>
                    </div>

                    <div className="w-20 text-center">
                      <div className={`font-medium ${getCoverageColor(file.branchesCoverage)}`}>
                        {file.branchesCoverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Branches</div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onNavigateToCode?.(file.fileName, 1);
                      }}
                      className="w-8 text-center text-blue-600 hover:text-blue-800"
                      title="Open in Editor"
                    >
                      📝
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-lg">No Files Found</p>
                  <p className="text-sm mt-2">No files match the current filter criteria</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Functions Tab */}
        {activeTab === 'functions' && (
          <div className="h-full overflow-y-auto">
            {selectedFile ? (
              <div className="space-y-1">
                {selectedFile.functions.map(func => (
                  <div
                    key={func.name}
                    className={`flex items-center py-3 px-4 cursor-pointer hover:bg-gray-50 ${
                      selectedFunction?.name === func.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedFunction(func)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{func.name}</div>
                      <div className="text-xs text-gray-500">
                        Lines {func.startLine}-{func.endLine} • Complexity:{' '}
                        {func.cyclomaticComplexity} • Hit {func.hitCount} times
                      </div>
                      {func.parameters.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          ({func.parameters.join(', ')})
                          {func.returnType && ` As ${func.returnType}`}
                        </div>
                      )}
                    </div>

                    <div className="w-20 text-center">
                      <div
                        className={`font-medium ${getCoverageColor((func.linesCovered / func.totalLines) * 100)}`}
                      >
                        {func.linesCovered}/{func.totalLines}
                      </div>
                      <div className="text-xs text-gray-500">Lines</div>
                    </div>

                    <div className="w-20 text-center">
                      <div
                        className={`font-medium ${getCoverageColor((func.branchesCovered / func.totalBranches) * 100)}`}
                      >
                        {func.branchesCovered}/{func.totalBranches}
                      </div>
                      <div className="text-xs text-gray-500">Branches</div>
                    </div>

                    <div className="w-16 text-center">
                      <div
                        className={`px-2 py-1 text-xs rounded ${
                          func.status === CoverageStatus.Executed
                            ? 'bg-green-100 text-green-800'
                            : func.status === CoverageStatus.PartiallyExecuted
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {func.status === CoverageStatus.Executed
                          ? 'Full'
                          : func.status === CoverageStatus.PartiallyExecuted
                            ? 'Partial'
                            : 'None'}
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onNavigateToCode?.(func.fileName, func.startLine);
                      }}
                      className="w-8 text-center text-blue-600 hover:text-blue-800"
                      title="Go to Function"
                    >
                      📝
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔧</div>
                  <p className="text-lg">No File Selected</p>
                  <p className="text-sm mt-2">Select a file to view its functions</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Coverage Reports</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateReport('HTML')}
                    disabled={!currentRun}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Generate HTML
                  </button>
                  <button
                    onClick={() => generateReport('XML')}
                    disabled={!currentRun}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                  >
                    Generate XML
                  </button>
                </div>
              </div>

              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg">Report Generation</p>
                <p className="text-sm mt-2">
                  Generate detailed coverage reports in various formats
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Coverage Types</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.enableLineCoverage}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, enableLineCoverage: e.target.checked }))
                      }
                    />
                    Line Coverage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.enableFunctionCoverage}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, enableFunctionCoverage: e.target.checked }))
                      }
                    />
                    Function Coverage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.enableBranchCoverage}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, enableBranchCoverage: e.target.checked }))
                      }
                    />
                    Branch Coverage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.enableConditionCoverage}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          enableConditionCoverage: e.target.checked,
                        }))
                      }
                    />
                    Condition Coverage
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Analysis Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.includeSystemCode}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, includeSystemCode: e.target.checked }))
                      }
                    />
                    Include System Code
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.excludeGeneratedCode}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, excludeGeneratedCode: e.target.checked }))
                      }
                    />
                    Exclude Generated Code
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.excludeTestCode}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, excludeTestCode: e.target.checked }))
                      }
                    />
                    Exclude Test Code
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Display Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.highlightUncoveredCode}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, highlightUncoveredCode: e.target.checked }))
                      }
                    />
                    Highlight Uncovered Code
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showHitCounts}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, showHitCounts: e.target.checked }))
                      }
                    />
                    Show Hit Counts
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.trackExecutionTime}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, trackExecutionTime: e.target.checked }))
                      }
                    />
                    Track Execution Time
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Thresholds</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Coverage Threshold: {settings.minCoverageThreshold}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.minCoverageThreshold}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          minCoverageThreshold: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Runs: {coverageRuns.length}</span>
          {currentRun && (
            <>
              <span>
                Files: {processedFiles.length}/{currentRun.files.length}
              </span>
              <span>Coverage: {currentRun.overallCoverage.toFixed(1)}%</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentRun && (
            <>
              <span>Last Run: {currentRun.startTime.toLocaleTimeString()}</span>
              <span>Duration: {formatDuration(currentRun.duration)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeCoverageTool;
