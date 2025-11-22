/**
 * ULTRA-INTEGRATION COMMAND CENTER
 * Unified interface for all next-generation IDE capabilities
 * Orchestrates TimeTravelDebugger, VB6CodeOptimizer, VisualTestFramework, and AI Assistant
 * Revolutionary unified development experience with intelligent workflow automation
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '../../stores/ProjectStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import { useUIStore } from '../../stores/UIStore';
import { useDebugStore } from '../../stores/DebugStore';
import { TimeTravelDebugger } from '../Debug/TimeTravelDebugger';
import { VB6CodeOptimizer } from '../Analysis/VB6CodeOptimizer';
import { VisualTestFramework } from '../Testing/VisualTestFramework';
import {
  Command,
  Zap,
  Brain,
  Rocket,
  Target,
  Globe,
  Layers,
  Activity,
  TestTube,
  TrendingUp,
  History,
  Settings,
  X,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Code,
  Database,
  Monitor,
  Cpu,
  Gauge,
  Sparkles,
  Bot,
  Workflow,
  Network,
  Shield
} from 'lucide-react';

// Types pour le centre de commande
interface AdvancedTool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'debug' | 'analyze' | 'test' | 'ai' | 'performance' | 'collaboration';
  status: 'available' | 'running' | 'completed' | 'error';
  lastUsed?: Date;
  metrics?: {
    executionTime?: number;
    itemsProcessed?: number;
    issuesFound?: number;
    successRate?: number;
  };
  quickActions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  execute: () => Promise<void>;
  shortcut?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  estimatedTime: number;
  category: 'development' | 'debugging' | 'optimization' | 'testing';
}

interface WorkflowStep {
  toolId: string;
  action: string;
  parameters?: Record<string, any>;
  waitForCompletion: boolean;
}

interface AIInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'optimization' | 'pattern';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  relatedTools: string[];
  generatedAt: Date;
}

// AI Assistant Engine
class UltraAIAssistant {
  private static instance: UltraAIAssistant;
  private insights: AIInsight[] = [];
  
  static getInstance(): UltraAIAssistant {
    if (!UltraAIAssistant.instance) {
      UltraAIAssistant.instance = new UltraAIAssistant();
    }
    return UltraAIAssistant.instance;
  }
  
  async analyzeProject(projectData: any): Promise<AIInsight[]> {
    console.log('🤖 AI Assistant analyzing project...');
    
    // Simulate advanced AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const insights: AIInsight[] = [
      {
        id: 'insight_performance_1',
        type: 'optimization',
        title: 'String Concatenation Optimization Opportunity',
        description: 'Detected 12 inefficient string concatenations that could be optimized using StringBuilder pattern, potentially improving performance by 40%.',
        confidence: 0.87,
        impact: 'high',
        actionable: true,
        relatedTools: ['code-optimizer'],
        generatedAt: new Date()
      },
      {
        id: 'insight_debug_1',
        type: 'suggestion',
        title: 'State Snapshot Recommendation',
        description: 'Your application has complex state changes. Consider using Time-Travel Debugger to track state evolution during form interactions.',
        confidence: 0.75,
        impact: 'medium',
        actionable: true,
        relatedTools: ['time-travel-debugger'],
        generatedAt: new Date()
      },
      {
        id: 'insight_test_1',
        type: 'warning',
        title: 'Test Coverage Gap Detected',
        description: 'Critical business logic in CalculateTotal function lacks unit tests. Auto-generated tests available.',
        confidence: 0.92,
        impact: 'critical',
        actionable: true,
        relatedTools: ['visual-test-framework'],
        generatedAt: new Date()
      },
      {
        id: 'insight_pattern_1',
        type: 'pattern',
        title: 'Event Handler Pattern Detected',
        description: 'Consistent event handling pattern found across 8 forms. Consider extracting to base class for better maintainability.',
        confidence: 0.68,
        impact: 'medium',
        actionable: false,
        relatedTools: ['code-optimizer'],
        generatedAt: new Date()
      }
    ];
    
    this.insights = insights;
    console.log(`✅ AI Analysis complete: ${insights.length} insights generated`);
    return insights;
  }
  
  async generateCode(prompt: string, context: any): Promise<string> {
    console.log(`🤖 Generating VB6 code for: ${prompt}`);
    
    // Simulate advanced code generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock generated code based on prompt
    if (prompt.toLowerCase().includes('button click')) {
      return `
Private Sub CommandButton1_Click()
    ' Generated event handler
    Dim result As String
    result = ProcessUserInput(TextBox1.Text)
    
    If Len(result) > 0 Then
        Label1.Caption = result
        MsgBox "Operation completed successfully!"
    Else
        MsgBox "Please enter valid input", vbExclamation
    End If
End Sub

Private Function ProcessUserInput(input As String) As String
    ' Input validation and processing
    If Len(Trim(input)) = 0 Then
        ProcessUserInput = ""
        Exit Function
    End If
    
    ' Process the input
    ProcessUserInput = UCase(Trim(input))
End Function
      `.trim();
    }
    
    return `
' AI-generated VB6 code
Private Sub GeneratedFunction()
    ' Implementation based on: ${prompt}
    Dim tempVar As Variant
    tempVar = "Generated content"
    Debug.Print tempVar
End Sub
    `.trim();
  }
  
  getInsights(): AIInsight[] {
    return this.insights;
  }
}

// Workflow Engine
class WorkflowEngine {
  private static instance: WorkflowEngine;
  private isExecuting = false;
  
  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }
  
  async executeWorkflow(
    template: WorkflowTemplate, 
    onProgress?: (step: number, total: number) => void
  ): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Another workflow is already running');
    }
    
    this.isExecuting = true;
    console.log(`🔄 Executing workflow: ${template.name}`);
    
    try {
      for (let i = 0; i < template.steps.length; i++) {
        const step = template.steps[i];
        console.log(`📋 Step ${i + 1}/${template.steps.length}: ${step.action}`);
        
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        onProgress?.(i + 1, template.steps.length);
      }
      
      console.log(`✅ Workflow completed: ${template.name}`);
    } catch (error) {
      console.error('❌ Workflow failed:', error);
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }
  
  stopExecution() {
    this.isExecuting = false;
    console.log('⏹️ Workflow execution stopped');
  }
}

// Composant principal
interface AdvancedCommandCenterProps {
  visible: boolean;
  onClose: () => void;
}

export const AdvancedCommandCenter: React.FC<AdvancedCommandCenterProps> = ({
  visible,
  onClose
}) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'tools' | 'workflows' | 'ai' | 'settings'>('dashboard');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Tool visibility states
  const [showTimeTravelDebugger, setShowTimeTravelDebugger] = useState(false);
  const [showCodeOptimizer, setShowCodeOptimizer] = useState(false);
  const [showTestFramework, setShowTestFramework] = useState(false);
  
  const projectStore = useProjectStore();
  const designerStore = useDesignerStore();
  const uiStore = useUIStore();
  const debugStore = useDebugStore();
  
  const aiAssistant = UltraAIAssistant.getInstance();
  const workflowEngine = WorkflowEngine.getInstance();
  
  // Advanced tools configuration
  const advancedTools: AdvancedTool[] = useMemo(() => [
    {
      id: 'time-travel-debugger',
      name: 'Time-Travel Debugger',
      description: 'Navigate through application state history with visual snapshots',
      icon: History,
      category: 'debug',
      status: 'available',
      metrics: {
        executionTime: 0,
        itemsProcessed: 0,
        successRate: 0.95
      },
      quickActions: [
        {
          id: 'create-snapshot',
          label: 'Create Snapshot',
          icon: Camera,
          description: 'Take a snapshot of current application state',
          execute: async () => {
            console.log('📸 Creating state snapshot...');
            setShowTimeTravelDebugger(true);
          }
        },
        {
          id: 'view-timeline',
          label: 'View Timeline',
          icon: Clock,
          description: 'Open timeline view of state changes',
          execute: async () => {
            setShowTimeTravelDebugger(true);
          },
          shortcut: 'Ctrl+Shift+T'
        }
      ]
    },
    {
      id: 'code-optimizer',
      name: 'VB6 Code Optimizer',
      description: 'AI-powered code analysis with performance suggestions',
      icon: TrendingUp,
      category: 'analyze',
      status: 'available',
      metrics: {
        executionTime: 2340,
        itemsProcessed: 45,
        issuesFound: 12,
        successRate: 0.89
      },
      quickActions: [
        {
          id: 'analyze-performance',
          label: 'Analyze Performance',
          icon: Zap,
          description: 'Scan code for performance optimization opportunities',
          execute: async () => {
            setShowCodeOptimizer(true);
          }
        },
        {
          id: 'security-scan',
          label: 'Security Scan',
          icon: Shield,
          description: 'Check for security vulnerabilities',
          execute: async () => {
            setShowCodeOptimizer(true);
          },
          shortcut: 'Ctrl+Shift+S'
        }
      ]
    },
    {
      id: 'visual-test-framework',
      name: 'Visual Test Framework',
      description: 'Comprehensive testing suite with automated generation',
      icon: TestTube,
      category: 'test',
      status: 'available',
      metrics: {
        executionTime: 15670,
        itemsProcessed: 23,
        successRate: 0.91
      },
      quickActions: [
        {
          id: 'run-tests',
          label: 'Run All Tests',
          icon: Play,
          description: 'Execute complete test suite',
          execute: async () => {
            setShowTestFramework(true);
          }
        },
        {
          id: 'generate-tests',
          label: 'Generate Tests',
          icon: Sparkles,
          description: 'Auto-generate tests for current code',
          execute: async () => {
            setShowTestFramework(true);
          },
          shortcut: 'Ctrl+Shift+G'
        }
      ]
    }
  ], []);
  
  // Workflow templates
  const workflowTemplates: WorkflowTemplate[] = useMemo(() => [
    {
      id: 'complete-analysis',
      name: 'Complete Code Analysis',
      description: 'Run comprehensive analysis including optimization, testing, and debugging',
      estimatedTime: 45000,
      category: 'development',
      steps: [
        { toolId: 'code-optimizer', action: 'analyze-performance', waitForCompletion: true },
        { toolId: 'visual-test-framework', action: 'generate-tests', waitForCompletion: true },
        { toolId: 'time-travel-debugger', action: 'create-snapshot', waitForCompletion: false }
      ]
    },
    {
      id: 'debug-session',
      name: 'Advanced Debug Session',
      description: 'Comprehensive debugging workflow with state tracking',
      estimatedTime: 20000,
      category: 'debugging',
      steps: [
        { toolId: 'time-travel-debugger', action: 'create-snapshot', waitForCompletion: true },
        { toolId: 'code-optimizer', action: 'analyze-errors', waitForCompletion: true }
      ]
    },
    {
      id: 'performance-optimization',
      name: 'Performance Optimization Sprint',
      description: 'Focus on performance improvements and benchmarking',
      estimatedTime: 30000,
      category: 'optimization',
      steps: [
        { toolId: 'code-optimizer', action: 'analyze-performance', waitForCompletion: true },
        { toolId: 'visual-test-framework', action: 'performance-tests', waitForCompletion: true }
      ]
    }
  ], []);
  
  // AI Analysis
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const insights = await aiAssistant.analyzeProject({
        forms: projectStore.forms,
        controls: designerStore.controls,
        modules: projectStore.modules
      });
      setAiInsights(insights);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Execute workflow
  const executeWorkflow = async (template: WorkflowTemplate) => {
    try {
      await workflowEngine.executeWorkflow(template, (current, total) => {
        setWorkflowProgress({ current, total });
      });
      setWorkflowProgress(null);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setWorkflowProgress(null);
    }
  };
  
  // Auto-run AI analysis on mount
  useEffect(() => {
    if (visible && aiInsights.length === 0) {
      setTimeout(runAIAnalysis, 1000);
    }
  }, [visible, aiInsights.length]);
  
  if (!visible) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-5/6 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Command className="text-white" size={24} />
              <h2 className="text-xl font-bold">
                Advanced Command Center
              </h2>
              <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                ULTRA-INTEGRATION
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {workflowProgress && (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded">
                  <Activity className="animate-pulse" size={16} />
                  <span className="text-sm">
                    {workflowProgress.current}/{workflowProgress.total}
                  </span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex border-b dark:border-gray-700">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Monitor },
              { id: 'tools', label: 'Advanced Tools', icon: Rocket },
              { id: 'workflows', label: 'Workflows', icon: Workflow },
              { id: 'ai', label: 'AI Assistant', icon: Bot },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeView === tab.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeView === 'dashboard' && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* System Status */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-green-800">System Status</h3>
                      <CheckCircle className="text-green-600" size={20} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Performance:</span>
                        <span className="font-medium text-green-700">Optimal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory Usage:</span>
                        <span className="font-medium text-green-700">47MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Tools:</span>
                        <span className="font-medium text-green-700">{advancedTools.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Insights Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-purple-800">AI Insights</h3>
                      <Brain className="text-purple-600" size={20} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Insights:</span>
                        <span className="font-medium text-purple-700">{aiInsights.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical Issues:</span>
                        <span className="font-medium text-red-600">
                          {aiInsights.filter(i => i.impact === 'critical').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actionable Items:</span>
                        <span className="font-medium text-purple-700">
                          {aiInsights.filter(i => i.actionable).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-blue-800">Quick Actions</h3>
                      <Zap className="text-blue-600" size={20} />
                    </div>
                    <div className="space-y-2">
                      <button 
                        onClick={() => executeWorkflow(workflowTemplates[0])}
                        className="w-full text-left px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Complete Analysis
                      </button>
                      <button 
                        onClick={runAIAnalysis}
                        className="w-full text-left px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Recent AI Insights */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4">Recent AI Insights</h3>
                  {aiInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">
                        {isAnalyzing ? 'AI is analyzing your project...' : 'No insights available yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiInsights.slice(0, 3).map(insight => (
                        <div key={insight.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                          <div className={`p-1 rounded ${
                            insight.impact === 'critical' ? 'bg-red-100 text-red-600' :
                            insight.impact === 'high' ? 'bg-orange-100 text-orange-600' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Lightbulb size={16} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                            <div className="flex items-center mt-2 text-xs">
                              <span className="text-gray-500">Confidence: {Math.round(insight.confidence * 100)}%</span>
                              {insight.actionable && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded">
                                  Actionable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeView === 'tools' && (
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-4">Advanced Development Tools</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {advancedTools.map(tool => (
                    <div key={tool.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded">
                            <tool.icon className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <h4 className="font-medium">{tool.name}</h4>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          tool.status === 'available' ? 'bg-green-100 text-green-800' :
                          tool.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          tool.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tool.status}
                        </div>
                      </div>
                      
                      {tool.metrics && (
                        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                          {tool.metrics.issuesFound !== undefined && (
                            <div className="flex justify-between">
                              <span>Issues Found:</span>
                              <span className="font-medium">{tool.metrics.issuesFound}</span>
                            </div>
                          )}
                          {tool.metrics.successRate !== undefined && (
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span className="font-medium">{Math.round(tool.metrics.successRate * 100)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {tool.quickActions.map(action => (
                          <button
                            key={action.id}
                            onClick={action.execute}
                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <action.icon size={14} />
                              <span>{action.label}</span>
                            </div>
                            {action.shortcut && (
                              <span className="text-xs text-gray-500">{action.shortcut}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeView === 'workflows' && (
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-4">Automated Workflows</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {workflowTemplates.map(template => (
                    <div key={template.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            <span>~{Math.round(template.estimatedTime / 1000)}s</span>
                            <span className="mx-2">•</span>
                            <span>{template.steps.length} steps</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          template.category === 'development' ? 'bg-blue-100 text-blue-800' :
                          template.category === 'debugging' ? 'bg-red-100 text-red-800' :
                          template.category === 'optimization' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {template.category}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {template.steps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <span className="text-gray-600">{step.action}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => executeWorkflow(template)}
                        disabled={workflowProgress !== null}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        <Play size={16} className="mr-2" />
                        Execute Workflow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeView === 'ai' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">AI Assistant</h3>
                  <button
                    onClick={runAIAnalysis}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
                  >
                    <Brain size={16} className="mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                  </button>
                </div>
                
                {aiInsights.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot size={64} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">AI Assistant Ready</h4>
                    <p className="text-gray-500 mb-4">
                      Click "Run Analysis" to get intelligent insights about your VB6 project
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiInsights.map(insight => (
                      <div key={insight.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded ${
                              insight.type === 'suggestion' ? 'bg-blue-100 text-blue-600' :
                              insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              insight.type === 'optimization' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              <Lightbulb size={16} />
                            </div>
                            <div>
                              <h4 className="font-medium">{insight.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              insight.impact === 'critical' ? 'bg-red-100 text-red-800' :
                              insight.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {insight.impact}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        
                        {insight.actionable && (
                          <div className="flex space-x-2">
                            {insight.relatedTools.map(toolId => (
                              <button
                                key={toolId}
                                onClick={() => {
                                  if (toolId === 'code-optimizer') setShowCodeOptimizer(true);
                                  else if (toolId === 'time-travel-debugger') setShowTimeTravelDebugger(true);
                                  else if (toolId === 'visual-test-framework') setShowTestFramework(true);
                                }}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                              >
                                Open {toolId.replace('-', ' ')}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeView === 'settings' && (
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-6">Command Center Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">AI Assistant</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Auto-run analysis on project changes</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Show confidence scores for insights</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Enable experimental AI features</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Workflows</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Show workflow progress notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Auto-save workflow results</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Integration</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Sync with Time-Travel Debugger</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Auto-trigger Code Optimizer on errors</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Generate tests after optimization</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tool Modals */}
      {showTimeTravelDebugger && (
        <TimeTravelDebugger
          visible={showTimeTravelDebugger}
          onClose={() => setShowTimeTravelDebugger(false)}
        />
      )}
      
      {showCodeOptimizer && (
        <VB6CodeOptimizer
          visible={showCodeOptimizer}
          onClose={() => setShowCodeOptimizer(false)}
        />
      )}
      
      {showTestFramework && (
        <VisualTestFramework
          visible={showTestFramework}
          onClose={() => setShowTestFramework(false)}
        />
      )}
    </>
  );
};

export default AdvancedCommandCenter;