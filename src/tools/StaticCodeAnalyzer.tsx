import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Static Code Analyzer Types
export enum IssueType {
  Error = 'Error',
  Warning = 'Warning',
  Information = 'Information',
  Suggestion = 'Suggestion',
  CodeSmell = 'CodeSmell',
  Performance = 'Performance',
  Security = 'Security',
  Style = 'Style',
  Maintainability = 'Maintainability',
}

export enum IssueSeverity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Info = 'Info',
}

export enum RuleCategory {
  CodeQuality = 'CodeQuality',
  Performance = 'Performance',
  Security = 'Security',
  Style = 'Style',
  Naming = 'Naming',
  Structure = 'Structure',
  Logic = 'Logic',
  Memory = 'Memory',
  ErrorHandling = 'ErrorHandling',
  Documentation = 'Documentation',
}

export interface CodeIssue {
  id: string;
  ruleId: string;
  type: IssueType;
  severity: IssueSeverity;
  category: RuleCategory;
  title: string;
  description: string;
  message: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  endLineNumber?: number;
  endColumnNumber?: number;
  sourceCode: string;
  suggestion?: string;
  fixable: boolean;
  suppressed: boolean;
  suppressionReason?: string;
  relatedIssues: string[];
  metrics?: Record<string, number>;
  detectedAt: Date;
}

export interface AnalysisRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: IssueSeverity;
  enabled: boolean;
  configurable: boolean;
  parameters: Record<string, any>;
  examples: Array<{
    title: string;
    badCode: string;
    goodCode: string;
    explanation: string;
  }>;
}

export interface CodeMetrics {
  fileName: string;
  linesOfCode: number;
  executableLines: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  depthOfInheritance: number;
  couplingBetweenObjects: number;
  lackOfCohesion: number;
  functionCount: number;
  classCount: number;
  duplicatedLines: number;
  duplicatedBlocks: number;
  techDebtMinutes: number;
}

export interface AnalysisSession {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  filesAnalyzed: string[];
  totalIssues: number;
  issuesByType: Record<IssueType, number>;
  issuesBySeverity: Record<IssueSeverity, number>;
  rules: AnalysisRule[];
  issues: CodeIssue[];
  metrics: CodeMetrics[];
  settings: AnalysisSettings;
}

export interface AnalysisSettings {
  enabledRules: string[];
  disabledRules: string[];
  severityThreshold: IssueSeverity;
  includePatterns: string[];
  excludePatterns: string[];
  analyzeGeneratedCode: boolean;
  analyzeTestCode: boolean;
  suppressWarningsInComments: boolean;
  maxIssuesPerFile: number;
  reportFormat: 'HTML' | 'XML' | 'JSON' | 'CSV' | 'SARIF';
  realTimeAnalysis: boolean;
  parallelAnalysis: boolean;
  maxComplexityThreshold: number;
  minMaintainabilityThreshold: number;
  duplicateThreshold: number;
}

interface StaticCodeAnalyzerProps {
  projectFiles?: string[];
  onAnalyzeFiles?: (files: string[], settings: AnalysisSettings) => Promise<AnalysisSession>;
  onGetRules?: () => Promise<AnalysisRule[]>;
  onUpdateRule?: (ruleId: string, updates: Partial<AnalysisRule>) => Promise<void>;
  onSuppressIssue?: (issueId: string, reason: string) => Promise<void>;
  onFixIssue?: (issueId: string) => Promise<boolean>;
  onNavigateToCode?: (fileName: string, lineNumber: number, columnNumber?: number) => void;
  onGenerateReport?: (session: AnalysisSession) => Promise<void>;
}

export const StaticCodeAnalyzer: React.FC<StaticCodeAnalyzerProps> = ({
  projectFiles = [],
  onAnalyzeFiles,
  onGetRules,
  onUpdateRule,
  onSuppressIssue,
  onFixIssue,
  onNavigateToCode,
  onGenerateReport,
}) => {
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AnalysisSession | null>(null);
  const [availableRules, setAvailableRules] = useState<AnalysisRule[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [selectedRule, setSelectedRule] = useState<AnalysisRule | null>(null);
  const [settings, setSettings] = useState<AnalysisSettings>({
    enabledRules: [],
    disabledRules: [],
    severityThreshold: IssueSeverity.Info,
    includePatterns: ['*.frm', '*.bas', '*.cls'],
    excludePatterns: ['*.Designer.*', 'AssemblyInfo.*'],
    analyzeGeneratedCode: false,
    analyzeTestCode: true,
    suppressWarningsInComments: true,
    maxIssuesPerFile: 1000,
    reportFormat: 'HTML',
    realTimeAnalysis: true,
    parallelAnalysis: true,
    maxComplexityThreshold: 10,
    minMaintainabilityThreshold: 60,
    duplicateThreshold: 5,
  });
  const [activeTab, setActiveTab] = useState<
    'issues' | 'metrics' | 'rules' | 'settings' | 'reports'
  >('issues');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<IssueType | 'All'>('All');
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'severity' | 'type' | 'file' | 'line'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const eventEmitter = useRef(new EventEmitter());

  // Initialize with sample rules and analysis data
  useEffect(() => {
    const sampleRules: AnalysisRule[] = [
      {
        id: 'VB001',
        name: 'Unused Variable',
        description: 'Variable is declared but never used',
        category: RuleCategory.CodeQuality,
        severity: IssueSeverity.Medium,
        enabled: true,
        configurable: false,
        parameters: {},
        examples: [
          {
            title: 'Unused Variable',
            badCode: 'Dim intUnused As Integer\nDim intUsed As Integer\nintUsed = 42',
            goodCode: 'Dim intUsed As Integer\nintUsed = 42',
            explanation: 'Remove unused variable declarations to improve code clarity',
          },
        ],
      },
      {
        id: 'VB002',
        name: 'High Cyclomatic Complexity',
        description: 'Function has high cyclomatic complexity',
        category: RuleCategory.Maintainability,
        severity: IssueSeverity.High,
        enabled: true,
        configurable: true,
        parameters: { threshold: 10 },
        examples: [
          {
            title: 'Complex Function',
            badCode:
              'Function ComplexFunction() As Integer\n  If condition1 Then\n    If condition2 Then\n      If condition3 Then\n        Return 1\n      End If\n    End If\n  End If\nEnd Function',
            goodCode:
              'Function SimpleFunction() As Integer\n  Return CalculateResult()\nEnd Function',
            explanation: 'Break down complex functions into smaller, more manageable pieces',
          },
        ],
      },
      {
        id: 'VB003',
        name: 'Missing Error Handling',
        description: 'Function lacks proper error handling',
        category: RuleCategory.ErrorHandling,
        severity: IssueSeverity.High,
        enabled: true,
        configurable: false,
        parameters: {},
        examples: [
          {
            title: 'Missing Error Handling',
            badCode:
              "Sub ProcessFile(fileName As String)\n  Open fileName For Input As #1\n  '... processing\n  Close #1\nEnd Sub",
            goodCode:
              "Sub ProcessFile(fileName As String)\n  On Error GoTo ErrorHandler\n  Open fileName For Input As #1\n  '... processing\n  Close #1\n  Exit Sub\nErrorHandler:\n  'Handle error\nEnd Sub",
            explanation: 'Add proper error handling to prevent application crashes',
          },
        ],
      },
      {
        id: 'VB004',
        name: 'Inefficient String Concatenation',
        description: 'Using inefficient string concatenation in loops',
        category: RuleCategory.Performance,
        severity: IssueSeverity.Medium,
        enabled: true,
        configurable: false,
        parameters: {},
        examples: [
          {
            title: 'String Concatenation in Loop',
            badCode: 'For i = 1 To 1000\n  strResult = strResult & "item" & i\nNext',
            goodCode:
              'Dim items() As String\nReDim items(1000)\nFor i = 1 To 1000\n  items(i) = "item" & i\nNext\nstrResult = Join(items, "")',
            explanation: 'Use arrays and Join function for efficient string concatenation',
          },
        ],
      },
      {
        id: 'VB005',
        name: 'Hard-coded Connection String',
        description: 'Database connection string is hard-coded',
        category: RuleCategory.Security,
        severity: IssueSeverity.Critical,
        enabled: true,
        configurable: false,
        parameters: {},
        examples: [
          {
            title: 'Hard-coded Connection String',
            badCode:
              'strConnection = "Provider=SQLOLEDB;Server=localhost;Database=MyDB;UID=sa;PWD=password123;"',
            goodCode: 'strConnection = GetConnectionString()',
            explanation: 'Store connection strings in configuration files, not in source code',
          },
        ],
      },
      {
        id: 'VB006',
        name: 'Magic Number',
        description: 'Numeric literal should be defined as a named constant',
        category: RuleCategory.Style,
        severity: IssueSeverity.Low,
        enabled: true,
        configurable: true,
        parameters: { excludeValues: [0, 1, -1] },
        examples: [
          {
            title: 'Magic Number',
            badCode: 'If intStatus = 42 Then',
            goodCode: 'Const STATUS_SUCCESS = 42\nIf intStatus = STATUS_SUCCESS Then',
            explanation: 'Use named constants instead of magic numbers for better readability',
          },
        ],
      },
    ];

    const sampleIssues: CodeIssue[] = [
      {
        id: 'issue1',
        ruleId: 'VB001',
        type: IssueType.Warning,
        severity: IssueSeverity.Medium,
        category: RuleCategory.CodeQuality,
        title: 'Unused Variable',
        description: 'Variable "intUnused" is declared but never used',
        message: 'Consider removing unused variable "intUnused" to improve code clarity',
        fileName: 'Form1.frm',
        lineNumber: 15,
        columnNumber: 8,
        sourceCode: '    Dim intUnused As Integer',
        suggestion: 'Remove the unused variable declaration',
        fixable: true,
        suppressed: false,
        relatedIssues: [],
        metrics: { complexity: 1 },
        detectedAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'issue2',
        ruleId: 'VB002',
        type: IssueType.CodeSmell,
        severity: IssueSeverity.High,
        category: RuleCategory.Maintainability,
        title: 'High Cyclomatic Complexity',
        description: 'Function "ProcessData" has cyclomatic complexity of 15',
        message: 'Function complexity (15) exceeds the threshold (10). Consider refactoring.',
        fileName: 'Module1.bas',
        lineNumber: 25,
        columnNumber: 1,
        endLineNumber: 65,
        sourceCode: 'Function ProcessData(strInput As String) As Integer',
        suggestion: 'Break this function into smaller, more focused functions',
        fixable: false,
        suppressed: false,
        relatedIssues: [],
        metrics: { complexity: 15, linesOfCode: 40 },
        detectedAt: new Date(Date.now() - 1800000),
      },
      {
        id: 'issue3',
        ruleId: 'VB003',
        type: IssueType.Error,
        severity: IssueSeverity.High,
        category: RuleCategory.ErrorHandling,
        title: 'Missing Error Handling',
        description: 'Function lacks proper error handling for file operations',
        message: 'Add error handling to prevent potential runtime errors',
        fileName: 'FileUtils.bas',
        lineNumber: 42,
        columnNumber: 1,
        sourceCode: 'Sub SaveDataToFile(fileName As String, data As String)',
        suggestion: 'Add "On Error GoTo ErrorHandler" and proper error handling',
        fixable: false,
        suppressed: false,
        relatedIssues: [],
        detectedAt: new Date(Date.now() - 900000),
      },
      {
        id: 'issue4',
        ruleId: 'VB005',
        type: IssueType.Security,
        severity: IssueSeverity.Critical,
        category: RuleCategory.Security,
        title: 'Hard-coded Credentials',
        description: 'Database password is hard-coded in source code',
        message: 'Never store passwords or connection strings in source code',
        fileName: 'DatabaseModule.bas',
        lineNumber: 8,
        columnNumber: 25,
        sourceCode: 'strConnection = "...;PWD=mypassword123;"',
        suggestion: 'Store connection strings in encrypted configuration files',
        fixable: false,
        suppressed: false,
        relatedIssues: [],
        detectedAt: new Date(Date.now() - 600000),
      },
      {
        id: 'issue5',
        ruleId: 'VB004',
        type: IssueType.Performance,
        severity: IssueSeverity.Medium,
        category: RuleCategory.Performance,
        title: 'Inefficient String Concatenation',
        description: 'String concatenation in loop may cause performance issues',
        message: 'Use StringBuilder or array-based concatenation for better performance',
        fileName: 'ReportGenerator.bas',
        lineNumber: 128,
        columnNumber: 12,
        sourceCode: '        strReport = strReport & strLine & vbCrLf',
        suggestion: 'Use an array to collect strings and Join() function',
        fixable: true,
        suppressed: false,
        relatedIssues: [],
        metrics: { loopIterations: 500 },
        detectedAt: new Date(Date.now() - 300000),
      },
    ];

    const sampleMetrics: CodeMetrics[] = [
      {
        fileName: 'Form1.frm',
        linesOfCode: 285,
        executableLines: 180,
        commentLines: 45,
        blankLines: 60,
        cyclomaticComplexity: 25,
        maintainabilityIndex: 72,
        depthOfInheritance: 1,
        couplingBetweenObjects: 8,
        lackOfCohesion: 0.3,
        functionCount: 12,
        classCount: 1,
        duplicatedLines: 15,
        duplicatedBlocks: 2,
        techDebtMinutes: 45,
      },
      {
        fileName: 'Module1.bas',
        linesOfCode: 420,
        executableLines: 320,
        commentLines: 60,
        blankLines: 40,
        cyclomaticComplexity: 45,
        maintainabilityIndex: 58,
        depthOfInheritance: 0,
        couplingBetweenObjects: 12,
        lackOfCohesion: 0,
        functionCount: 18,
        classCount: 0,
        duplicatedLines: 8,
        duplicatedBlocks: 1,
        techDebtMinutes: 120,
      },
      {
        fileName: 'DataClass.cls',
        linesOfCode: 150,
        executableLines: 120,
        commentLines: 20,
        blankLines: 10,
        cyclomaticComplexity: 8,
        maintainabilityIndex: 85,
        depthOfInheritance: 1,
        couplingBetweenObjects: 5,
        lackOfCohesion: 0.1,
        functionCount: 8,
        classCount: 1,
        duplicatedLines: 0,
        duplicatedBlocks: 0,
        techDebtMinutes: 15,
      },
    ];

    const sampleSession: AnalysisSession = {
      id: 'session1',
      name: 'Full Project Analysis',
      description: 'Complete static analysis of the VB6 project',
      startTime: new Date(Date.now() - 1800000),
      endTime: new Date(Date.now() - 1200000),
      duration: 600,
      status: 'Completed',
      filesAnalyzed: [
        'Form1.frm',
        'Module1.bas',
        'DataClass.cls',
        'FileUtils.bas',
        'DatabaseModule.bas',
        'ReportGenerator.bas',
      ],
      totalIssues: sampleIssues.length,
      issuesByType: {
        [IssueType.Error]: 1,
        [IssueType.Warning]: 1,
        [IssueType.Information]: 0,
        [IssueType.Suggestion]: 0,
        [IssueType.CodeSmell]: 1,
        [IssueType.Performance]: 1,
        [IssueType.Security]: 1,
        [IssueType.Style]: 0,
        [IssueType.Maintainability]: 0,
      },
      issuesBySeverity: {
        [IssueSeverity.Critical]: 1,
        [IssueSeverity.High]: 2,
        [IssueSeverity.Medium]: 2,
        [IssueSeverity.Low]: 0,
        [IssueSeverity.Info]: 0,
      },
      rules: sampleRules,
      issues: sampleIssues,
      metrics: sampleMetrics,
      settings,
    };

    setAvailableRules(sampleRules);
    setAnalysisSessions([sampleSession]);
    setCurrentSession(sampleSession);
    setSettings(prev => ({
      ...prev,
      enabledRules: sampleRules.filter(r => r.enabled).map(r => r.id),
    }));
  }, []);

  // Filter and sort issues
  const processedIssues = useMemo(() => {
    if (!currentSession) return [];

    const filtered = currentSession.issues.filter(issue => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        if (
          !(
            issue.title.toLowerCase().includes(searchLower) ||
            issue.description.toLowerCase().includes(searchLower) ||
            issue.fileName.toLowerCase().includes(searchLower) ||
            issue.message.toLowerCase().includes(searchLower)
          )
        ) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'All' && issue.type !== filterType) return false;

      // Severity filter
      if (filterSeverity !== 'All' && issue.severity !== filterSeverity) return false;

      // Category filter
      if (filterCategory !== 'All' && issue.category !== filterCategory) return false;

      // Suppressed filter
      if (issue.suppressed) return false;

      return true;
    });

    // Sort issues
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'severity': {
          const severityOrder = { Critical: 5, High: 4, Medium: 3, Low: 2, Info: 1 };
          comparison = severityOrder[b.severity] - severityOrder[a.severity];
          break;
        }
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'file':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'line':
          comparison = a.lineNumber - b.lineNumber;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [currentSession, searchText, filterType, filterSeverity, filterCategory, sortBy, sortOrder]);

  // Start analysis
  const startAnalysis = useCallback(
    async (files: string[]) => {
      if (!onAnalyzeFiles) return;

      setIsAnalyzing(true);
      try {
        const session = await onAnalyzeFiles(files, settings);
        setAnalysisSessions(prev => [session, ...prev]);
        setCurrentSession(session);
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [settings, onAnalyzeFiles]
  );

  // Get severity color
  const getSeverityColor = (severity: IssueSeverity): string => {
    switch (severity) {
      case IssueSeverity.Critical:
        return 'text-red-700 bg-red-100';
      case IssueSeverity.High:
        return 'text-red-600 bg-red-50';
      case IssueSeverity.Medium:
        return 'text-yellow-600 bg-yellow-50';
      case IssueSeverity.Low:
        return 'text-blue-600 bg-blue-50';
      case IssueSeverity.Info:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get type icon
  const getTypeIcon = (type: IssueType): string => {
    switch (type) {
      case IssueType.Error:
        return '❌';
      case IssueType.Warning:
        return '⚠️';
      case IssueType.Information:
        return 'ℹ️';
      case IssueType.Suggestion:
        return '💡';
      case IssueType.CodeSmell:
        return '👃';
      case IssueType.Performance:
        return '⚡';
      case IssueType.Security:
        return '🔒';
      case IssueType.Style:
        return '🎨';
      case IssueType.Maintainability:
        return '🔧';
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Static Code Analyzer</h3>
          {currentSession && (
            <span
              className={`px-2 py-1 text-xs rounded ${
                currentSession.status === 'Running'
                  ? 'bg-blue-100 text-blue-800'
                  : currentSession.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : currentSession.status === 'Failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {currentSession.status}
            </span>
          )}
          {isAnalyzing && <div className="text-xs text-blue-600 animate-pulse">Analyzing...</div>}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => startAnalysis(projectFiles)}
            disabled={isAnalyzing || projectFiles.length === 0}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            title="Analyze Project"
          >
            🔍
          </button>

          <button
            onClick={() => onGenerateReport?.(currentSession!)}
            disabled={!currentSession || currentSession.status !== 'Completed'}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            title="Generate Report"
          >
            📊
          </button>

          <button
            onClick={() => setShowRuleDialog(true)}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Manage Rules"
          >
            📋
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
          value={currentSession?.id || ''}
          onChange={e => {
            const session = analysisSessions.find(s => s.id === e.target.value);
            setCurrentSession(session || null);
            setSelectedIssue(null);
          }}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="">Select Analysis Session...</option>
          {analysisSessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.name} - {session.totalIssues} issues
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search issues..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded w-32"
        />

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as IssueType | 'All')}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="All">All Types</option>
          {Object.values(IssueType).map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value as IssueSeverity | 'All')}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="All">All Severities</option>
          {Object.values(IssueSeverity).map(severity => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="severity">Severity</option>
          <option value="type">Type</option>
          <option value="file">File</option>
          <option value="line">Line</option>
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
                checked={settings.realTimeAnalysis}
                onChange={e =>
                  setSettings(prev => ({ ...prev, realTimeAnalysis: e.target.checked }))
                }
              />
              Real-time Analysis
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.analyzeGeneratedCode}
                onChange={e =>
                  setSettings(prev => ({ ...prev, analyzeGeneratedCode: e.target.checked }))
                }
              />
              Include Generated Code
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.analyzeTestCode}
                onChange={e =>
                  setSettings(prev => ({ ...prev, analyzeTestCode: e.target.checked }))
                }
              />
              Include Test Code
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.parallelAnalysis}
                onChange={e =>
                  setSettings(prev => ({ ...prev, parallelAnalysis: e.target.checked }))
                }
              />
              Parallel Analysis
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-300">
        {[
          { key: 'issues', label: 'Issues', icon: '⚠️' },
          { key: 'metrics', label: 'Metrics', icon: '📊' },
          { key: 'rules', label: 'Rules', icon: '📋' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
          { key: 'reports', label: 'Reports', icon: '📄' },
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
            {tab.key === 'issues' && currentSession && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                {currentSession.totalIssues}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="h-full overflow-y-auto">
            {processedIssues.length > 0 ? (
              <div className="space-y-1">
                {processedIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={`flex items-start py-3 px-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                      selectedIssue?.id === issue.id ? 'bg-blue-50' : ''
                    } ${
                      issue.severity === IssueSeverity.Critical
                        ? 'border-red-600'
                        : issue.severity === IssueSeverity.High
                          ? 'border-red-400'
                          : issue.severity === IssueSeverity.Medium
                            ? 'border-yellow-400'
                            : issue.severity === IssueSeverity.Low
                              ? 'border-blue-400'
                              : 'border-gray-400'
                    }`}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <span className="w-6 text-center">{getTypeIcon(issue.type)}</span>

                    <div className="flex-1 min-w-0 mx-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-800">{issue.title}</div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${getSeverityColor(issue.severity)}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-xs text-gray-500">{issue.ruleId}</span>
                      </div>

                      <div className="text-sm text-gray-600 mb-1">{issue.message}</div>

                      <div className="text-xs text-gray-500">
                        {issue.fileName}:{issue.lineNumber}:{issue.columnNumber}
                      </div>

                      {issue.sourceCode && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                          {issue.sourceCode}
                        </div>
                      )}

                      {issue.suggestion && (
                        <div className="mt-2 text-xs text-blue-600">💡 {issue.suggestion}</div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {issue.fixable && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onFixIssue?.(issue.id);
                          }}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          title="Auto-fix"
                        >
                          🔧
                        </button>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onNavigateToCode?.(issue.fileName, issue.lineNumber, issue.columnNumber);
                        }}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Go to Code"
                      >
                        📝
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          const reason = prompt('Suppression reason:');
                          if (reason) onSuppressIssue?.(issue.id, reason);
                        }}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        title="Suppress"
                      >
                        🔕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-lg">No Issues Found</p>
                  <p className="text-sm mt-2">
                    {currentSession
                      ? 'All filters applied or no issues detected'
                      : 'Run analysis to detect code issues'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="h-full overflow-y-auto p-4">
            {currentSession ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentSession.metrics.map(metrics => (
                    <div key={metrics.fileName} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium mb-3">{metrics.fileName}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Lines of Code:</span>
                          <span>{metrics.linesOfCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Executable Lines:</span>
                          <span>{metrics.executableLines}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Complexity:</span>
                          <span
                            className={
                              metrics.cyclomaticComplexity > settings.maxComplexityThreshold
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {metrics.cyclomaticComplexity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maintainability:</span>
                          <span
                            className={
                              metrics.maintainabilityIndex < settings.minMaintainabilityThreshold
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {metrics.maintainabilityIndex}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Functions:</span>
                          <span>{metrics.functionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tech Debt:</span>
                          <span>{metrics.techDebtMinutes}min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg">No Metrics Available</p>
                  <p className="text-sm mt-2">Run analysis to collect code metrics</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="h-full overflow-y-auto">
            <div className="space-y-1">
              {availableRules.map(rule => (
                <div
                  key={rule.id}
                  className={`flex items-center py-3 px-4 cursor-pointer hover:bg-gray-50 ${
                    selectedRule?.id === rule.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedRule(rule)}
                >
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={e => {
                      e.stopPropagation();
                      onUpdateRule?.(rule.id, { enabled: e.target.checked });
                    }}
                    className="mr-3"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">{rule.name}</div>
                      <span className="text-xs text-gray-500">{rule.id}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${getSeverityColor(rule.severity)}`}
                      >
                        {rule.severity}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {rule.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{rule.description}</div>
                  </div>

                  {rule.configurable && (
                    <span className="text-xs text-blue-600">⚙️ Configurable</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Analysis Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.realTimeAnalysis}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, realTimeAnalysis: e.target.checked }))
                      }
                    />
                    Real-time Analysis
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.parallelAnalysis}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, parallelAnalysis: e.target.checked }))
                      }
                    />
                    Parallel Analysis
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.analyzeGeneratedCode}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, analyzeGeneratedCode: e.target.checked }))
                      }
                    />
                    Analyze Generated Code
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.analyzeTestCode}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, analyzeTestCode: e.target.checked }))
                      }
                    />
                    Analyze Test Code
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Thresholds</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Maximum Complexity: {settings.maxComplexityThreshold}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={settings.maxComplexityThreshold}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          maxComplexityThreshold: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Minimum Maintainability: {settings.minMaintainabilityThreshold}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.minMaintainabilityThreshold}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          minMaintainabilityThreshold: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Report Format</h3>
                <select
                  value={settings.reportFormat}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, reportFormat: e.target.value as any }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded w-48"
                >
                  <option value="HTML">HTML</option>
                  <option value="XML">XML</option>
                  <option value="JSON">JSON</option>
                  <option value="CSV">CSV</option>
                  <option value="SARIF">SARIF</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-lg">Analysis Reports</p>
              <p className="text-sm mt-2">Generate comprehensive analysis reports</p>
              <button
                onClick={() => onGenerateReport?.(currentSession!)}
                disabled={!currentSession}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Sessions: {analysisSessions.length}</span>
          {currentSession && (
            <>
              <span>
                Issues: {processedIssues.length}/{currentSession.totalIssues}
              </span>
              <span>Files: {currentSession.filesAnalyzed.length}</span>
              <span>
                Rules: {availableRules.filter(r => r.enabled).length}/{availableRules.length}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentSession && (
            <>
              <span>Duration: {formatDuration(currentSession.duration)}</span>
              <span>Last Analysis: {currentSession.startTime.toLocaleTimeString()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaticCodeAnalyzer;
