import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { 
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  ChartPresentationIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ClockIcon,
  CodeBracketIcon,
  BugAntIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  EyeIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  FireIcon,
  BoltIcon,
  CloudIcon,
  StarIcon,
  HeartIcon,
  LightBulbIcon,
  BeakerIcon,
  RocketLaunchIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

// ================================
// ULTRA-ANALYTICS TYPES
// ================================

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number; // Percentage change
  changeType: 'increase' | 'decrease' | 'neutral';
  trend: number[]; // Historical values for sparkline
  target?: number;
  benchmark?: number;
  category: 'quality' | 'performance' | 'productivity' | 'security' | 'collaboration' | 'business';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  lastUpdated: Date;
}

interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: AnalyticsWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  timeRange: TimeRange;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  shared: boolean;
  owner: string;
  created: Date;
  updated: Date;
}

interface AnalyticsWidget {
  id: string;
  type: 'metric_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'table' | 'gauge' | 'heatmap' | 'treemap' | 'scatter' | 'funnel';
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  dataSource: string;
  configuration: WidgetConfiguration;
  filters?: WidgetFilter[];
  customSql?: string;
  visible: boolean;
  refreshRate?: number; // seconds
}

interface WidgetConfiguration {
  metrics: string[];
  dimensions?: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'percentile';
  groupBy?: string[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  colors?: string[];
  showLegend?: boolean;
  showTooltips?: boolean;
  animation?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

interface WidgetFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  active: boolean;
}

interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
  responsive: boolean;
  breakpoints: Record<string, { cols: number; width: number }>;
}

interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multi_select' | 'range' | 'text' | 'boolean';
  field: string;
  value: any;
  options?: Array<{ label: string; value: any }>;
  required: boolean;
  global: boolean; // Applies to all widgets
}

interface TimeRange {
  type: 'relative' | 'absolute';
  relative?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  };
  absolute?: {
    start: Date;
    end: Date;
  };
}

interface CodeQualityMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    halstead: number;
  };
  maintainability: {
    index: number;
    score: number;
    rank: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  technicalDebt: {
    total: number; // hours
    new: number;
    ratio: number; // percentage
  };
  codeSmells: {
    total: number;
    blocker: number;
    critical: number;
    major: number;
    minor: number;
  };
  duplication: {
    percentage: number;
    lines: number;
    blocks: number;
  };
  coverage: {
    line: number;
    branch: number;
    function: number;
    statement: number;
  };
  reliability: {
    rating: 'A' | 'B' | 'C' | 'D' | 'E';
    bugs: number;
    vulnerabilities: number;
  };
}

interface PerformanceMetrics {
  build: {
    totalTime: number; // seconds
    avgTime: number;
    successRate: number; // percentage
    failureCount: number;
  };
  test: {
    executionTime: number;
    coverage: number;
    passRate: number;
    flakyTests: number;
  };
  deployment: {
    frequency: number; // per day
    leadTime: number; // hours
    mttr: number; // mean time to recovery
    changeFailureRate: number; // percentage
  };
  runtime: {
    responseTime: number; // ms
    throughput: number; // requests/sec
    errorRate: number; // percentage
    uptime: number; // percentage
  };
  resource: {
    cpuUsage: number; // percentage
    memoryUsage: number; // MB
    diskUsage: number; // GB
    networkIO: number; // MB/s
  };
}

interface ProductivityMetrics {
  development: {
    commits: number;
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
    prsCreated: number;
    prsReviewed: number;
  };
  velocity: {
    storyPoints: number;
    features: number;
    bugs: number;
    tasks: number;
  };
  collaboration: {
    codeReviews: number;
    pairProgramming: number; // hours
    knowledgeSharing: number;
    mentoring: number; // hours
  };
  efficiency: {
    focusTime: number; // hours
    interruptions: number;
    contextSwitches: number;
    flowState: number; // percentage
  };
}

interface SecurityMetrics {
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance: {
    score: number; // percentage
    violations: number;
    standards: Array<{
      name: string;
      compliant: boolean;
      score: number;
    }>;
  };
  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
    licenses: Record<string, number>;
  };
  scanning: {
    lastRun: Date;
    frequency: string;
    tools: Array<{
      name: string;
      status: 'active' | 'inactive' | 'error';
      lastRun: Date;
    }>;
  };
}

interface TeamMetrics {
  members: {
    total: number;
    active: number;
    contributors: number;
    reviewers: number;
  };
  activity: {
    commits: Record<string, number>; // user -> count
    reviews: Record<string, number>;
    issues: Record<string, number>;
    discussions: Record<string, number>;
  };
  collaboration: {
    crossTeam: number; // percentage
    knowledge: number; // shared knowledge score
    communication: number; // communication score
    satisfaction: number; // team satisfaction score
  };
  growth: {
    newMembers: number;
    retention: number; // percentage
    skill: number; // average skill level
    mentorship: number; // mentorship hours
  };
}

interface BusinessMetrics {
  features: {
    delivered: number;
    planned: number;
    cancelled: number;
    delayed: number;
  };
  users: {
    active: number;
    new: number;
    retained: number;
    churn: number; // percentage
  };
  usage: {
    sessions: number;
    duration: number; // average minutes
    pageViews: number;
    errors: number;
  };
  value: {
    roi: number; // percentage
    cost: number; // dollars
    revenue: number; // dollars
    efficiency: number; // features per dollar
  };
}

interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number; // percentage
  impact: 'low' | 'medium' | 'high';
  actions: InsightAction[];
  data: any;
  created: Date;
  dismissed?: Date;
}

interface InsightAction {
  id: string;
  title: string;
  description: string;
  type: 'investigate' | 'optimize' | 'refactor' | 'upgrade' | 'monitor';
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

interface AnalyticsReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'comparison' | 'trend' | 'custom';
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  recipients: string[];
  format: 'pdf' | 'excel' | 'json' | 'html';
  sections: ReportSection[];
  filters: DashboardFilter[];
  timeRange: TimeRange;
  lastGenerated?: Date;
  nextGeneration?: Date;
  enabled: boolean;
}

interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'charts' | 'table' | 'text' | 'insights';
  content: any;
  order: number;
}

// ================================
// ULTRA-ANALYTICS ENGINE
// ================================

class UltraAnalyticsEngine {
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private insights: Map<string, AnalyticsInsight> = new Map();
  private reports: Map<string, AnalyticsReport> = new Map();
  private dataSources: Map<string, any> = new Map();
  private eventListeners: Map<string, ((...args: any[]) => any)[]> = new Map();
  
  // Data collectors
  private qualityMetrics: CodeQualityMetrics | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;
  private productivityMetrics: ProductivityMetrics | null = null;
  private securityMetrics: SecurityMetrics | null = null;
  private teamMetrics: TeamMetrics | null = null;
  private businessMetrics: BusinessMetrics | null = null;

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    this.setupDataSources();
    this.startDataCollection();
    this.generateSampleData();
    this.createDefaultDashboard();
    this.setupEventHandlers();
    this.startInsightGeneration();
  }

  private setupDataSources(): void {
    // Setup various data sources
    this.dataSources.set('vb6_project', {
      name: 'VB6 Project Data',
      type: 'project',
      tables: ['files', 'functions', 'classes', 'forms', 'modules'],
      lastUpdated: new Date()
    });

    this.dataSources.set('git_repository', {
      name: 'Git Repository',
      type: 'scm',
      tables: ['commits', 'branches', 'tags', 'pulls', 'issues'],
      lastUpdated: new Date()
    });

    this.dataSources.set('build_system', {
      name: 'Build System',
      type: 'ci_cd',
      tables: ['builds', 'tests', 'deployments', 'artifacts'],
      lastUpdated: new Date()
    });

    this.dataSources.set('runtime_metrics', {
      name: 'Runtime Metrics',
      type: 'monitoring',
      tables: ['performance', 'errors', 'usage', 'resources'],
      lastUpdated: new Date()
    });
  }

  private startDataCollection(): void {
    // Start collecting metrics from various sources
    setInterval(() => {
      this.collectCodeQualityMetrics();
      this.collectPerformanceMetrics();
      this.collectProductivityMetrics();
      this.collectSecurityMetrics();
      this.collectTeamMetrics();
      this.collectBusinessMetrics();
      this.updateMetrics();
    }, 60000); // Collect every minute
  }

  private collectCodeQualityMetrics(): void {
    // Simulate code quality data collection
    this.qualityMetrics = {
      complexity: {
        cyclomatic: 15.6,
        cognitive: 12.3,
        halstead: 8.9
      },
      maintainability: {
        index: 78.5,
        score: 85.2,
        rank: 'A'
      },
      technicalDebt: {
        total: 24.5,
        new: 2.3,
        ratio: 3.2
      },
      codeSmells: {
        total: 23,
        blocker: 1,
        critical: 3,
        major: 8,
        minor: 11
      },
      duplication: {
        percentage: 4.2,
        lines: 156,
        blocks: 8
      },
      coverage: {
        line: 87.3,
        branch: 82.1,
        function: 91.7,
        statement: 86.9
      },
      reliability: {
        rating: 'A',
        bugs: 5,
        vulnerabilities: 2
      }
    };
  }

  private collectPerformanceMetrics(): void {
    // Simulate performance data collection
    this.performanceMetrics = {
      build: {
        totalTime: 125.4,
        avgTime: 78.9,
        successRate: 94.2,
        failureCount: 3
      },
      test: {
        executionTime: 45.7,
        coverage: 87.3,
        passRate: 96.8,
        flakyTests: 2
      },
      deployment: {
        frequency: 2.3,
        leadTime: 4.2,
        mttr: 1.8,
        changeFailureRate: 5.1
      },
      runtime: {
        responseTime: 245,
        throughput: 1250,
        errorRate: 0.3,
        uptime: 99.7
      },
      resource: {
        cpuUsage: 35.8,
        memoryUsage: 512.3,
        diskUsage: 23.7,
        networkIO: 15.6
      }
    };
  }

  private collectProductivityMetrics(): void {
    // Simulate productivity data collection
    this.productivityMetrics = {
      development: {
        commits: 47,
        linesAdded: 2345,
        linesDeleted: 567,
        filesChanged: 89,
        prsCreated: 12,
        prsReviewed: 18
      },
      velocity: {
        storyPoints: 32,
        features: 8,
        bugs: 15,
        tasks: 23
      },
      collaboration: {
        codeReviews: 18,
        pairProgramming: 12.5,
        knowledgeSharing: 8,
        mentoring: 6.5
      },
      efficiency: {
        focusTime: 6.8,
        interruptions: 12,
        contextSwitches: 8,
        flowState: 72.3
      }
    };
  }

  private collectSecurityMetrics(): void {
    // Simulate security data collection
    this.securityMetrics = {
      vulnerabilities: {
        total: 8,
        critical: 0,
        high: 2,
        medium: 4,
        low: 2
      },
      compliance: {
        score: 92.5,
        violations: 3,
        standards: [
          { name: 'OWASP Top 10', compliant: true, score: 95.2 },
          { name: 'ISO 27001', compliant: true, score: 89.8 },
          { name: 'GDPR', compliant: false, score: 87.3 }
        ]
      },
      dependencies: {
        total: 127,
        outdated: 8,
        vulnerable: 3,
        licenses: {
          'MIT': 45,
          'Apache': 32,
          'GPL': 12,
          'BSD': 23,
          'Other': 15
        }
      },
      scanning: {
        lastRun: new Date(),
        frequency: 'daily',
        tools: [
          { name: 'SonarQube', status: 'active', lastRun: new Date() },
          { name: 'Snyk', status: 'active', lastRun: new Date() },
          { name: 'OWASP ZAP', status: 'inactive', lastRun: new Date(Date.now() - 86400000) }
        ]
      }
    };
  }

  private collectTeamMetrics(): void {
    // Simulate team data collection
    this.teamMetrics = {
      members: {
        total: 8,
        active: 7,
        contributors: 6,
        reviewers: 4
      },
      activity: {
        commits: {
          'john': 23,
          'sarah': 18,
          'mike': 15,
          'emma': 12,
          'david': 9,
          'lisa': 7
        },
        reviews: {
          'sarah': 15,
          'mike': 12,
          'john': 8,
          'emma': 6
        },
        issues: {
          'emma': 8,
          'john': 6,
          'sarah': 5,
          'mike': 4
        },
        discussions: {
          'mike': 12,
          'sarah': 10,
          'emma': 8,
          'john': 6
        }
      },
      collaboration: {
        crossTeam: 23.5,
        knowledge: 78.9,
        communication: 85.2,
        satisfaction: 82.7
      },
      growth: {
        newMembers: 1,
        retention: 87.5,
        skill: 7.8,
        mentorship: 15.5
      }
    };
  }

  private collectBusinessMetrics(): void {
    // Simulate business data collection
    this.businessMetrics = {
      features: {
        delivered: 23,
        planned: 28,
        cancelled: 2,
        delayed: 3
      },
      users: {
        active: 1247,
        new: 89,
        retained: 1158,
        churn: 7.1
      },
      usage: {
        sessions: 3456,
        duration: 23.5,
        pageViews: 15678,
        errors: 45
      },
      value: {
        roi: 145.7,
        cost: 125000,
        revenue: 182000,
        efficiency: 0.18
      }
    };
  }

  private updateMetrics(): void {
    const now = new Date();
    
    // Update all metric objects with current data
    const updatedMetrics: AnalyticsMetric[] = [
      // Code Quality Metrics
      {
        id: 'code_complexity',
        name: 'Code Complexity',
        value: this.qualityMetrics?.complexity.cyclomatic || 0,
        unit: 'avg',
        change: -5.2,
        changeType: 'decrease',
        trend: [16.2, 15.8, 15.9, 15.6],
        target: 15,
        benchmark: 12,
        category: 'quality',
        priority: 'high',
        description: 'Average cyclomatic complexity across codebase',
        lastUpdated: now
      },
      {
        id: 'maintainability_index',
        name: 'Maintainability Index',
        value: this.qualityMetrics?.maintainability.index || 0,
        unit: 'score',
        change: 3.1,
        changeType: 'increase',
        trend: [75.2, 76.8, 77.9, 78.5],
        target: 80,
        benchmark: 85,
        category: 'quality',
        priority: 'medium',
        description: 'Overall maintainability score of the codebase',
        lastUpdated: now
      },
      {
        id: 'technical_debt',
        name: 'Technical Debt',
        value: this.qualityMetrics?.technicalDebt.total || 0,
        unit: 'hours',
        change: -8.7,
        changeType: 'decrease',
        trend: [28.5, 26.8, 25.3, 24.5],
        target: 20,
        category: 'quality',
        priority: 'high',
        description: 'Estimated hours to fix all technical debt',
        lastUpdated: now
      },
      {
        id: 'code_coverage',
        name: 'Code Coverage',
        value: this.qualityMetrics?.coverage.line || 0,
        unit: '%',
        change: 2.3,
        changeType: 'increase',
        trend: [84.5, 85.8, 86.9, 87.3],
        target: 90,
        benchmark: 95,
        category: 'quality',
        priority: 'medium',
        description: 'Line coverage percentage from tests',
        lastUpdated: now
      },

      // Performance Metrics
      {
        id: 'build_time',
        name: 'Build Time',
        value: this.performanceMetrics?.build.avgTime || 0,
        unit: 'seconds',
        change: -12.5,
        changeType: 'decrease',
        trend: [89.5, 85.2, 81.7, 78.9],
        target: 60,
        benchmark: 45,
        category: 'performance',
        priority: 'medium',
        description: 'Average build time for successful builds',
        lastUpdated: now
      },
      {
        id: 'test_execution_time',
        name: 'Test Execution Time',
        value: this.performanceMetrics?.test.executionTime || 0,
        unit: 'seconds',
        change: 5.8,
        changeType: 'increase',
        trend: [42.1, 43.5, 44.8, 45.7],
        target: 40,
        benchmark: 30,
        category: 'performance',
        priority: 'medium',
        description: 'Total time to execute all tests',
        lastUpdated: now
      },
      {
        id: 'deployment_frequency',
        name: 'Deployment Frequency',
        value: this.performanceMetrics?.deployment.frequency || 0,
        unit: 'per day',
        change: 15.2,
        changeType: 'increase',
        trend: [1.8, 2.0, 2.1, 2.3],
        target: 3,
        benchmark: 5,
        category: 'performance',
        priority: 'high',
        description: 'Average deployments per day',
        lastUpdated: now
      },
      {
        id: 'response_time',
        name: 'Response Time',
        value: this.performanceMetrics?.runtime.responseTime || 0,
        unit: 'ms',
        change: -8.3,
        changeType: 'decrease',
        trend: [268, 259, 252, 245],
        target: 200,
        benchmark: 150,
        category: 'performance',
        priority: 'high',
        description: 'Average API response time',
        lastUpdated: now
      },

      // Productivity Metrics
      {
        id: 'commits_per_day',
        name: 'Commits per Day',
        value: this.productivityMetrics?.development.commits || 0,
        unit: 'commits',
        change: 12.8,
        changeType: 'increase',
        trend: [38, 42, 45, 47],
        target: 50,
        benchmark: 60,
        category: 'productivity',
        priority: 'medium',
        description: 'Average commits per day by the team',
        lastUpdated: now
      },
      {
        id: 'story_points',
        name: 'Story Points',
        value: this.productivityMetrics?.velocity.storyPoints || 0,
        unit: 'points',
        change: 23.5,
        changeType: 'increase',
        trend: [24, 27, 30, 32],
        target: 35,
        benchmark: 40,
        category: 'productivity',
        priority: 'high',
        description: 'Story points completed this sprint',
        lastUpdated: now
      },
      {
        id: 'code_reviews',
        name: 'Code Reviews',
        value: this.productivityMetrics?.collaboration.codeReviews || 0,
        unit: 'reviews',
        change: -5.2,
        changeType: 'decrease',
        trend: [22, 20, 19, 18],
        target: 25,
        benchmark: 30,
        category: 'productivity',
        priority: 'medium',
        description: 'Code reviews completed this week',
        lastUpdated: now
      },

      // Security Metrics
      {
        id: 'vulnerabilities',
        name: 'Security Vulnerabilities',
        value: this.securityMetrics?.vulnerabilities.total || 0,
        unit: 'issues',
        change: -20.0,
        changeType: 'decrease',
        trend: [12, 10, 9, 8],
        target: 5,
        benchmark: 0,
        category: 'security',
        priority: 'critical',
        description: 'Total security vulnerabilities found',
        lastUpdated: now
      },
      {
        id: 'compliance_score',
        name: 'Compliance Score',
        value: this.securityMetrics?.compliance.score || 0,
        unit: '%',
        change: 1.8,
        changeType: 'increase',
        trend: [89.2, 90.5, 91.8, 92.5],
        target: 95,
        benchmark: 98,
        category: 'security',
        priority: 'high',
        description: 'Overall compliance score across standards',
        lastUpdated: now
      }
    ];

    // Update metrics map
    updatedMetrics.forEach(metric => {
      this.metrics.set(metric.id, metric);
    });

    // Emit metrics updated event
    this.emit('metrics:updated', { metrics: updatedMetrics });
  }

  private generateSampleData(): void {
    // Generate sample insights
    const sampleInsights: AnalyticsInsight[] = [
      {
        id: 'insight_1',
        type: 'trend',
        title: 'Build Times Trending Down',
        description: 'Build times have decreased by 12.5% over the past week due to optimization efforts.',
        category: 'performance',
        severity: 'info',
        confidence: 89,
        impact: 'medium',
        actions: [
          {
            id: 'action_1',
            title: 'Document Optimizations',
            description: 'Document the build optimizations for future reference',
            type: 'monitor',
            effort: 'low',
            priority: 'low',
            status: 'pending'
          }
        ],
        data: { improvement: 12.5, timeframe: '7 days' },
        created: new Date()
      },
      {
        id: 'insight_2',
        type: 'anomaly',
        title: 'High Technical Debt in Authentication Module',
        description: 'The authentication module has accumulated significant technical debt that should be addressed.',
        category: 'quality',
        severity: 'warning',
        confidence: 95,
        impact: 'high',
        actions: [
          {
            id: 'action_2',
            title: 'Refactor Authentication Module',
            description: 'Plan and execute refactoring of the authentication module',
            type: 'refactor',
            effort: 'high',
            priority: 'high',
            status: 'pending'
          }
        ],
        data: { module: 'authentication', debt: 8.5 },
        created: new Date(Date.now() - 86400000)
      },
      {
        id: 'insight_3',
        type: 'recommendation',
        title: 'Consider Increasing Test Coverage',
        description: 'Current test coverage is below the recommended threshold for critical modules.',
        category: 'quality',
        severity: 'warning',
        confidence: 78,
        impact: 'medium',
        actions: [
          {
            id: 'action_3',
            title: 'Add Unit Tests',
            description: 'Add unit tests for uncovered critical paths',
            type: 'optimize',
            effort: 'medium',
            priority: 'medium',
            status: 'pending'
          }
        ],
        data: { currentCoverage: 87.3, target: 90 },
        created: new Date(Date.now() - 172800000)
      }
    ];

    sampleInsights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });
  }

  private createDefaultDashboard(): void {
    const defaultDashboard: AnalyticsDashboard = {
      id: 'default_dashboard',
      name: 'Project Overview',
      description: 'Main dashboard showing key project metrics',
      widgets: [
        {
          id: 'quality_overview',
          type: 'metric_card',
          title: 'Code Quality Overview',
          position: { x: 0, y: 0, width: 4, height: 2 },
          dataSource: 'vb6_project',
          configuration: {
            metrics: ['code_complexity', 'maintainability_index', 'technical_debt', 'code_coverage']
          },
          visible: true
        },
        {
          id: 'performance_trends',
          type: 'line_chart',
          title: 'Performance Trends',
          position: { x: 4, y: 0, width: 8, height: 4 },
          dataSource: 'build_system',
          configuration: {
            metrics: ['build_time', 'test_execution_time', 'deployment_frequency']
          },
          visible: true
        },
        {
          id: 'security_status',
          type: 'gauge',
          title: 'Security Status',
          position: { x: 0, y: 2, width: 4, height: 2 },
          dataSource: 'runtime_metrics',
          configuration: {
            metrics: ['vulnerabilities', 'compliance_score']
          },
          visible: true
        },
        {
          id: 'team_productivity',
          type: 'bar_chart',
          title: 'Team Productivity',
          position: { x: 0, y: 4, width: 6, height: 3 },
          dataSource: 'git_repository',
          configuration: {
            metrics: ['commits_per_day', 'story_points', 'code_reviews']
          },
          visible: true
        },
        {
          id: 'recent_insights',
          type: 'table',
          title: 'Recent Insights',
          position: { x: 6, y: 4, width: 6, height: 3 },
          dataSource: 'insights',
          configuration: {
            metrics: ['title', 'category', 'severity', 'created'],
            sortBy: { field: 'created', direction: 'desc' },
            limit: 10
          },
          visible: true
        }
      ],
      layout: {
        columns: 12,
        rowHeight: 60,
        margin: [10, 10],
        padding: [10, 10],
        responsive: true,
        breakpoints: {
          lg: { cols: 12, width: 1200 },
          md: { cols: 10, width: 996 },
          sm: { cols: 6, width: 768 },
          xs: { cols: 4, width: 480 }
        }
      },
      filters: [
        {
          id: 'time_range',
          name: 'Time Range',
          type: 'date',
          field: 'date',
          value: { type: 'relative', relative: { value: 30, unit: 'days' } },
          required: true,
          global: true
        }
      ],
      timeRange: {
        type: 'relative',
        relative: { value: 30, unit: 'days' }
      },
      autoRefresh: true,
      refreshInterval: 5,
      shared: false,
      owner: 'current_user',
      created: new Date(),
      updated: new Date()
    };

    this.dashboards.set(defaultDashboard.id, defaultDashboard);
  }

  private setupEventHandlers(): void {
    // Setup event handlers for analytics operations
  }

  private startInsightGeneration(): void {
    setInterval(() => {
      this.generateInsights();
    }, 300000); // Generate insights every 5 minutes
  }

  private generateInsights(): void {
    // Analyze metrics and generate insights
    const metrics = Array.from(this.metrics.values());
    
    // Look for trends, anomalies, and patterns
    metrics.forEach(metric => {
      // Check for significant changes
      if (Math.abs(metric.change) > 20) {
        const insight: AnalyticsInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'trend',
          title: `Significant ${metric.changeType} in ${metric.name}`,
          description: `${metric.name} has ${metric.changeType === 'increase' ? 'increased' : 'decreased'} by ${Math.abs(metric.change).toFixed(1)}%`,
          category: metric.category,
          severity: metric.priority === 'critical' ? 'critical' : 'warning',
          confidence: 85,
          impact: metric.priority === 'critical' ? 'high' : 'medium',
          actions: [],
          data: { metric: metric.id, change: metric.change },
          created: new Date()
        };

        this.insights.set(insight.id, insight);
        this.emit('insight:generated', insight);
      }

      // Check against targets
      if (metric.target && (
        (metric.changeType === 'increase' && metric.value > metric.target) ||
        (metric.changeType === 'decrease' && metric.value < metric.target)
      )) {
        const insight: AnalyticsInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'recommendation',
          title: `${metric.name} Exceeds Target`,
          description: `${metric.name} (${metric.value}) has exceeded the target (${metric.target})`,
          category: metric.category,
          severity: 'info',
          confidence: 90,
          impact: 'low',
          actions: [],
          data: { metric: metric.id, value: metric.value, target: metric.target },
          created: new Date()
        };

        this.insights.set(insight.id, insight);
        this.emit('insight:generated', insight);
      }
    });
  }

  // Public API methods
  public getDashboards(): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values());
  }

  public getDashboard(id: string): AnalyticsDashboard | undefined {
    return this.dashboards.get(id);
  }

  public getMetrics(): AnalyticsMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMetric(id: string): AnalyticsMetric | undefined {
    return this.metrics.get(id);
  }

  public getInsights(): AnalyticsInsight[] {
    return Array.from(this.insights.values())
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  public getInsight(id: string): AnalyticsInsight | undefined {
    return this.insights.get(id);
  }

  public async createDashboard(dashboard: Omit<AnalyticsDashboard, 'id' | 'created' | 'updated'>): Promise<string> {
    const id = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newDashboard: AnalyticsDashboard = {
      ...dashboard,
      id,
      created: new Date(),
      updated: new Date()
    };

    this.dashboards.set(id, newDashboard);
    this.emit('dashboard:created', newDashboard);
    return id;
  }

  public async updateDashboard(id: string, updates: Partial<AnalyticsDashboard>): Promise<void> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    Object.assign(dashboard, { ...updates, updated: new Date() });
    this.emit('dashboard:updated', dashboard);
  }

  public async deleteDashboard(id: string): Promise<void> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    this.dashboards.delete(id);
    this.emit('dashboard:deleted', { id, dashboard });
  }

  public async dismissInsight(id: string): Promise<void> {
    const insight = this.insights.get(id);
    if (!insight) {
      throw new Error(`Insight ${id} not found`);
    }

    insight.dismissed = new Date();
    this.emit('insight:dismissed', insight);
  }

  public getCurrentMetrics(): {
    quality: CodeQualityMetrics | null;
    performance: PerformanceMetrics | null;
    productivity: ProductivityMetrics | null;
    security: SecurityMetrics | null;
    team: TeamMetrics | null;
    business: BusinessMetrics | null;
  } {
    return {
      quality: this.qualityMetrics,
      performance: this.performanceMetrics,
      productivity: this.productivityMetrics,
      security: this.securityMetrics,
      team: this.teamMetrics,
      business: this.businessMetrics
    };
  }

  // Event system methods
  private addEventListener(event: string, listener: (...args: any[]) => any): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  public onEvent(event: string, listener: (...args: any[]) => any): void {
    this.addEventListener(event, listener);
  }

  public offEvent(event: string, listener: (...args: any[]) => any): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

// ================================
// ULTRA-ANALYTICS COMPONENT
// ================================

export const UltraAnalyticsDashboard: React.FC = () => {
  const { selectedControl, updateControl } = useVB6Store();
  
  // State management
  const [analyticsEngine] = useState(() => new UltraAnalyticsEngine());
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboards' | 'insights' | 'reports' | 'settings'>('overview');
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<AnalyticsDashboard | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    type: 'relative',
    relative: { value: 30, unit: 'days' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    loadInitialData();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [dashboardData, metricsData, insightsData, currentData] = await Promise.all([
        Promise.resolve(analyticsEngine.getDashboards()),
        Promise.resolve(analyticsEngine.getMetrics()),
        Promise.resolve(analyticsEngine.getInsights()),
        Promise.resolve(analyticsEngine.getCurrentMetrics())
      ]);
      
      setDashboards(dashboardData);
      setCurrentDashboard(dashboardData[0] || null);
      setMetrics(metricsData);
      setInsights(insightsData);
      setCurrentMetrics(currentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [analyticsEngine]);

  const setupEventListeners = useCallback(() => {
    analyticsEngine.onEvent('metrics:updated', (data: any) => {
      setMetrics(data.metrics);
    });

    analyticsEngine.onEvent('insight:generated', (insight: AnalyticsInsight) => {
      setInsights(prev => [insight, ...prev]);
    });

    analyticsEngine.onEvent('dashboard:created', (dashboard: AnalyticsDashboard) => {
      setDashboards(prev => [...prev, dashboard]);
    });

    analyticsEngine.onEvent('dashboard:updated', (dashboard: AnalyticsDashboard) => {
      setDashboards(prev => prev.map(d => d.id === dashboard.id ? dashboard : d));
      if (currentDashboard?.id === dashboard.id) {
        setCurrentDashboard(dashboard);
      }
    });
  }, [analyticsEngine, currentDashboard]);

  const cleanupEventListeners = useCallback(() => {
    // Cleanup would go here
  }, []);

  const renderMetricCard = (metric: AnalyticsMetric, size: 'sm' | 'md' | 'lg' = 'md') => {
    const isPositiveChange = metric.changeType === 'increase';
    const changeColor = metric.changeType === 'increase' ? 'text-green-600' : 
                       metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
    const ChangeIcon = metric.changeType === 'increase' ? ArrowUpIcon : 
                       metric.changeType === 'decrease' ? ArrowDownIcon : MinusIcon;

    const cardClass = size === 'sm' ? 'p-3' : size === 'md' ? 'p-4' : 'p-6';
    const titleClass = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
    const valueClass = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl';
    
    return (
      <div key={metric.id} className={`bg-white rounded-lg border border-gray-200 ${cardClass} hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`font-medium text-gray-900 ${titleClass}`}>{metric.name}</h3>
            <div className="flex items-baseline space-x-2">
              <span className={`font-bold text-gray-900 ${valueClass}`}>
                {metric.value.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">{metric.unit}</span>
            </div>
            <div className={`flex items-center space-x-1 text-sm ${changeColor}`}>
              <ChangeIcon className="w-3 h-3" />
              <span>{Math.abs(metric.change).toFixed(1)}%</span>
              {metric.target && (
                <span className="text-xs text-gray-500">
                  (target: {metric.target.toLocaleString()})
                </span>
              )}
            </div>
          </div>
          
          {/* Priority Indicator */}
          <div className={`w-3 h-3 rounded-full ${
            metric.priority === 'critical' ? 'bg-red-500' :
            metric.priority === 'high' ? 'bg-orange-500' :
            metric.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
          }`} title={`${metric.priority} priority`} />
        </div>
        
        {/* Trend Sparkline */}
        {metric.trend.length > 0 && (
          <div className="mt-3">
            <div className="flex items-end space-x-1 h-8">
              {metric.trend.map((value, index) => {
                const height = ((value - Math.min(...metric.trend)) / 
                              (Math.max(...metric.trend) - Math.min(...metric.trend))) * 100;
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t ${
                      metric.changeType === 'increase' ? 'bg-green-200' : 
                      metric.changeType === 'decrease' ? 'bg-red-200' : 'bg-gray-200'
                    }`}
                    style={{ height: `${height || 10}%` }}
                    title={`${value} ${metric.unit}`}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
      </div>
    );
  };

  const renderInsightCard = (insight: AnalyticsInsight) => {
    const severityColor = insight.severity === 'critical' ? 'border-red-500 bg-red-50' :
                          insight.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
                          'border-blue-500 bg-blue-50';
    
    const SeverityIcon = insight.severity === 'critical' ? ExclamationTriangleIcon :
                        insight.severity === 'warning' ? ExclamationTriangleIcon :
                        InformationCircleIcon;

    return (
      <div key={insight.id} className={`rounded-lg border-l-4 p-4 ${severityColor}`}>
        <div className="flex items-start space-x-3">
          <SeverityIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            insight.severity === 'critical' ? 'text-red-600' :
            insight.severity === 'warning' ? 'text-orange-600' :
            'text-blue-600'
          }`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">{insight.title}</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{insight.confidence}% confident</span>
                <span>{insight.impact} impact</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                {insight.category}
              </span>
              
              <div className="flex items-center space-x-2">
                {insight.actions.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {insight.actions.length} action{insight.actions.length > 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {insight.created.toLocaleDateString()}
                </span>
                {!insight.dismissed && (
                  <button
                    onClick={() => analyticsEngine.dismissInsight(insight.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
          <select
            value={`${selectedTimeRange.type}-${selectedTimeRange.relative?.value}-${selectedTimeRange.relative?.unit}`}
            onChange={(e) => {
              const [type, value, unit] = e.target.value.split('-');
              setSelectedTimeRange({
                type: type as any,
                relative: { value: parseInt(value), unit: unit as any }
              });
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="relative-24-hours">Last 24 Hours</option>
            <option value="relative-7-days">Last 7 Days</option>
            <option value="relative-30-days">Last 30 Days</option>
            <option value="relative-90-days">Last 90 Days</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.slice(0, 8).map(metric => renderMetricCard(metric, 'sm'))}
        </div>
      </div>

      {/* Category Breakdown */}
      {currentMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Quality */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CodeBracketIcon className="w-5 h-5 mr-2 text-blue-600" />
              Code Quality
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Maintainability Index</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${currentMetrics.quality?.maintainability.index || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{currentMetrics.quality?.maintainability.index || 0}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Test Coverage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${currentMetrics.quality?.coverage.line || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{currentMetrics.quality?.coverage.line || 0}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Technical Debt</span>
                <span className="text-sm font-medium">{currentMetrics.quality?.technicalDebt.total || 0}h</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Code Smells</span>
                <span className="text-sm font-medium">{currentMetrics.quality?.codeSmells.total || 0}</span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CpuChipIcon className="w-5 h-5 mr-2 text-green-600" />
              Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Build Success Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${currentMetrics.performance?.build.successRate || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{currentMetrics.performance?.build.successRate || 0}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Test Pass Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${currentMetrics.performance?.test.passRate || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{currentMetrics.performance?.test.passRate || 0}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Build Time</span>
                <span className="text-sm font-medium">{currentMetrics.performance?.build.avgTime || 0}s</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deployment Frequency</span>
                <span className="text-sm font-medium">{currentMetrics.performance?.deployment.frequency || 0}/day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Insights */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Insights</h2>
          <button
            onClick={() => setActiveTab('insights')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All →
          </button>
        </div>
        
        <div className="space-y-3">
          {insights.slice(0, 3).map(renderInsightCard)}
        </div>
        
        {insights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <LightBulbIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No insights available yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analytics Insights</h2>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <FunnelIcon className="w-4 h-4 inline mr-1" />
            Filter
          </button>
          <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
            <option>All Categories</option>
            <option>Quality</option>
            <option>Performance</option>
            <option>Security</option>
            <option>Productivity</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-3">
        {insights.map(renderInsightCard)}
      </div>
      
      {insights.length === 0 && (
        <div className="text-center py-12">
          <LightBulbIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-600">Insights will appear as we analyze your project data</p>
        </div>
      )}
    </div>
  );

  if (isLoading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ultra Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Deep project insights and performance analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Key Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{metrics.length}</div>
                <div>Metrics</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{insights.length}</div>
                <div>Insights</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{dashboards.length}</div>
                <div>Dashboards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartPresentationIcon },
              { key: 'dashboards', label: 'Dashboards', icon: Squares2X2Icon },
              { key: 'insights', label: 'Insights', icon: LightBulbIcon },
              { key: 'reports', label: 'Reports', icon: DocumentTextIcon },
              { key: 'settings', label: 'Settings', icon: Cog6ToothIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 mx-6 mt-4 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'dashboards' && (
          <div className="text-center py-12">
            <Squares2X2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Dashboards</h3>
            <p className="text-gray-600">Create and manage custom analytics dashboards</p>
          </div>
        )}
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'reports' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Reports</h3>
            <p className="text-gray-600">Generate and schedule automated reports</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Cog6ToothIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Settings</h3>
            <p className="text-gray-600">Configure data collection and analysis preferences</p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-gray-700">Loading analytics...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraAnalyticsDashboard;