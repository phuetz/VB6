/**
 * ULTRA-ADVANCED VB6 CODE OPTIMIZER
 * IA-powered analysis of VB6 code with performance suggestions
 * Real-time optimization recommendations, refactoring suggestions, best practices
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../stores/ProjectStore';
import { useDesignerStore } from '../../stores/DesignerStore';
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Code,
  Cpu,
  MemoryStick,
  Clock,
  Target,
  Lightbulb,
  ArrowRight,
  Copy,
  Download,
  Settings,
  X,
  RefreshCw,
  BarChart3,
  FileText
} from 'lucide-react';

// Types pour l'analyse du code
interface CodeIssue {
  id: string;
  type: 'performance' | 'memory' | 'maintainability' | 'style' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file: string;
  line: number;
  column: number;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  impact: {
    performance?: number; // 1-10 scale
    memory?: number;
    maintainability?: number;
  };
  autoFixable: boolean;
}

interface OptimizationResult {
  totalIssues: number;
  criticalIssues: number;
  performanceScore: number; // 0-100
  maintainabilityScore: number;
  issues: CodeIssue[];
  suggestions: string[];
  metrics: {
    linesOfCode: number;
    complexity: number;
    duplicatedBlocks: number;
    unusedVariables: number;
    inefficientLoops: number;
  };
}

// Moteur d'analyse VB6
class VB6CodeAnalyzer {
  private static instance: VB6CodeAnalyzer;
  
  static getInstance(): VB6CodeAnalyzer {
    if (!VB6CodeAnalyzer.instance) {
      VB6CodeAnalyzer.instance = new VB6CodeAnalyzer();
    }
    return VB6CodeAnalyzer.instance;
  }
  
  // Analyse complète du code VB6
  analyzeCode(code: string, fileName: string = 'Unknown'): OptimizationResult {
    
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');
    
    // 1. Analyse des performances
    issues.push(...this.analyzePerformance(lines, fileName));
    
    // 2. Analyse mémoire
    issues.push(...this.analyzeMemoryUsage(lines, fileName));
    
    // 3. Analyse de maintenabilité
    issues.push(...this.analyzeMaintainability(lines, fileName));
    
    // 4. Analyse de style
    issues.push(...this.analyzeStyle(lines, fileName));
    
    // 5. Analyse de sécurité
    issues.push(...this.analyzeSecurity(lines, fileName));
    
    // Calculer les métriques
    const metrics = this.calculateMetrics(lines);
    const performanceScore = this.calculatePerformanceScore(issues, metrics);
    const maintainabilityScore = this.calculateMaintainabilityScore(issues, metrics);
    
    const result: OptimizationResult = {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      performanceScore,
      maintainabilityScore,
      issues,
      suggestions: this.generateSuggestions(issues, metrics),
      metrics
    };
    
    return result;
  }
  
  private analyzePerformance(lines: string[], fileName: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Détection des boucles inefficaces
      if (trimmedLine.includes('for i = 1 to ubound(')) {
        issues.push({
          id: `perf-loop-${index}`,
          type: 'performance',
          severity: 'medium',
          title: 'Inefficient Loop with UBound',
          description: 'Using UBound() in For loop condition is inefficient',
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: line.replace(/for i = 1 to ubound\(([^)]+)\)/gi, 'Dim upperBound As Long: upperBound = UBound($1): For i = 1 To upperBound'),
          explanation: 'Store UBound result in variable to avoid repeated function calls',
          impact: { performance: 6, maintainability: 4 },
          autoFixable: true
        });
      }
      
      // Détection des concaténations de strings inefficaces
      if (trimmedLine.includes(' & ') && trimmedLine.split(' & ').length > 3) {
        issues.push({
          id: `perf-concat-${index}`,
          type: 'performance',
          severity: 'high',
          title: 'Inefficient String Concatenation',
          description: 'Multiple string concatenations should use StringBuilder pattern',
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: 'Use StringBuilder or Join() for multiple concatenations',
          explanation: 'String concatenation creates new string objects, use efficient methods',
          impact: { performance: 8, memory: 7 },
          autoFixable: false
        });
      }
      
      // Détection d'accès répétés aux propriétés
      if (trimmedLine.includes('.') && (trimmedLine.match(/\./g) || []).length > 2) {
        issues.push({
          id: `perf-property-${index}`,
          type: 'performance',
          severity: 'medium',
          title: 'Repeated Property Access',
          description: 'Store frequently accessed properties in local variables',
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: 'Dim localVar As Type: Set localVar = object.property',
          explanation: 'Property access is slower than local variable access',
          impact: { performance: 5 },
          autoFixable: false
        });
      }
    });
    
    return issues;
  }
  
  private analyzeMemoryUsage(lines: string[], fileName: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Détection des variables non libérées
      if (trimmedLine.includes('set ') && trimmedLine.includes('= new ')) {
        const nextLines = lines.slice(index + 1, Math.min(index + 20, lines.length));
        const hasSetNothing = nextLines.some(l => l.toLowerCase().includes('set ') && l.toLowerCase().includes('= nothing'));
        
        if (!hasSetNothing) {
          issues.push({
            id: `memory-leak-${index}`,
            type: 'memory',
            severity: 'high',
            title: 'Potential Memory Leak',
            description: 'Object created but never set to Nothing',
            file: fileName,
            line: index + 1,
            column: 1,
            originalCode: line,
            suggestedCode: line + '\n' + '\'... use object ...\n' + 'Set objectName = Nothing',
            explanation: 'Always set object variables to Nothing to release memory',
            impact: { memory: 9 },
            autoFixable: false
          });
        }
      }
      
      // Détection des arrays non optimisés
      if (trimmedLine.includes('redim ') && !trimmedLine.includes('preserve')) {
        issues.push({
          id: `memory-array-${index}`,
          type: 'memory',
          severity: 'low',
          title: 'Array Reallocation',
          description: 'Consider pre-sizing arrays to avoid reallocations',
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: 'ReDim arrayName(0 To expectedSize) \'Pre-size if possible',
          explanation: 'Frequent ReDim operations can fragment memory',
          impact: { memory: 4, performance: 3 },
          autoFixable: false
        });
      }
    });
    
    return issues;
  }
  
  private analyzeMaintainability(lines: string[], fileName: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Détection des fonctions trop longues
      if (trimmedLine.toLowerCase().startsWith('sub ') || trimmedLine.toLowerCase().startsWith('function ')) {
        let endIndex = index + 1;
        while (endIndex < lines.length && 
               !lines[endIndex].trim().toLowerCase().startsWith('end sub') && 
               !lines[endIndex].trim().toLowerCase().startsWith('end function')) {
          endIndex++;
        }
        
        const functionLength = endIndex - index;
        if (functionLength > 50) {
          issues.push({
            id: `maintain-long-func-${index}`,
            type: 'maintainability',
            severity: 'medium',
            title: 'Function Too Long',
            description: `Function has ${functionLength} lines, consider breaking it down`,
            file: fileName,
            line: index + 1,
            column: 1,
            originalCode: line,
            suggestedCode: 'Break into smaller, focused functions',
            explanation: 'Long functions are harder to maintain and test',
            impact: { maintainability: 7 },
            autoFixable: false
          });
        }
      }
      
      // Détection des noms de variables non descriptifs
      if (trimmedLine.toLowerCase().includes('dim ')) {
        const varNames = trimmedLine.match(/dim\s+([a-z]\w*)/gi);
        if (varNames) {
          varNames.forEach(varDecl => {
            const varName = varDecl.split(/\s+/)[1];
            if (varName && varName.length < 3 && !/^[ijk]$/i.test(varName)) {
              issues.push({
                id: `maintain-var-name-${index}`,
                type: 'maintainability',
                severity: 'low',
                title: 'Non-Descriptive Variable Name',
                description: `Variable '${varName}' should have a more descriptive name`,
                file: fileName,
                line: index + 1,
                column: 1,
                originalCode: line,
                suggestedCode: line.replace(varName, 'descriptiveName'),
                explanation: 'Descriptive variable names improve code readability',
                impact: { maintainability: 5 },
                autoFixable: false
              });
            }
          });
        }
      }
    });
    
    return issues;
  }
  
  private analyzeStyle(lines: string[], fileName: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    lines.forEach((line, index) => {
      // Détection des problèmes d'indentation
      if (line.length > 0 && line[0] !== ' ' && line[0] !== '\t' && 
          !line.trim().toLowerCase().startsWith('sub ') && 
          !line.trim().toLowerCase().startsWith('function ') &&
          !line.trim().toLowerCase().startsWith('end ')) {
        
        const prevLine = index > 0 ? lines[index - 1].trim().toLowerCase() : '';
        if (prevLine.includes('if ') || prevLine.includes('for ') || prevLine.includes('while ')) {
          issues.push({
            id: `style-indent-${index}`,
            type: 'style',
            severity: 'low',
            title: 'Inconsistent Indentation',
            description: 'Code should be properly indented',
            file: fileName,
            line: index + 1,
            column: 1,
            originalCode: line,
            suggestedCode: '    ' + line.trim(),
            explanation: 'Consistent indentation improves code readability',
            impact: { maintainability: 3 },
            autoFixable: true
          });
        }
      }
      
      // Détection des lignes trop longues
      if (line.length > 120) {
        issues.push({
          id: `style-long-line-${index}`,
          type: 'style',
          severity: 'low',
          title: 'Line Too Long',
          description: `Line has ${line.length} characters, consider breaking it`,
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: 'Break line using underscore continuation',
          explanation: 'Long lines are harder to read and maintain',
          impact: { maintainability: 2 },
          autoFixable: false
        });
      }
    });
    
    return issues;
  }
  
  private analyzeSecurity(lines: string[], fileName: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.toLowerCase();
      
      // Détection d'utilisation de Eval
      if (trimmedLine.includes('eval(')) {
        issues.push({
          id: `security-eval-${index}`,
          type: 'security',
          severity: 'critical',
          title: 'Dangerous Eval Usage',
          description: 'Eval() can execute arbitrary code and is a security risk',
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: 'Use safer alternatives like CallByName or Select Case',
          explanation: 'Eval() can be exploited for code injection attacks',
          impact: { maintainability: 2 },
          autoFixable: false
        });
      }
      
      // Détection de mots de passe en dur
      if (trimmedLine.includes('password') && (trimmedLine.includes('=') || trimmedLine.includes('"'))) {
        issues.push({
          id: `security-hardcoded-pwd-${index}`,
          type: 'security',
          severity: 'high',
          title: 'Hardcoded Password',
          description: 'Passwords should not be hardcoded in source code',
          file: fileName,
          line: index + 1,
          column: 1,
          originalCode: line,
          suggestedCode: 'Load password from secure configuration or prompt user',
          explanation: 'Hardcoded passwords are security vulnerabilities',
          impact: { maintainability: 8 },
          autoFixable: false
        });
      }
    });
    
    return issues;
  }
  
  private calculateMetrics(lines: string[]) {
    const metrics = {
      linesOfCode: lines.filter(line => line.trim().length > 0).length,
      complexity: this.calculateComplexity(lines),
      duplicatedBlocks: this.findDuplicatedBlocks(lines),
      unusedVariables: this.findUnusedVariables(lines),
      inefficientLoops: this.findInefficientLoops(lines)
    };
    
    return metrics;
  }
  
  private calculateComplexity(lines: string[]): number {
    let complexity = 1; // Base complexity
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('if ') || lower.includes('elseif ')) complexity++;
      if (lower.includes('for ') || lower.includes('while ') || lower.includes('do ')) complexity++;
      if (lower.includes('case ')) complexity++;
      if (lower.includes('catch ') || lower.includes('on error ')) complexity++;
    });
    
    return complexity;
  }
  
  private findDuplicatedBlocks(lines: string[]): number {
    // Algorithme simple pour détecter les blocs dupliqués
    const blockSize = 3;
    const blocks = new Map<string, number>();
    
    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).join('\n').trim();
      if (block.length > 20) { // Ignorer les blocs très courts
        blocks.set(block, (blocks.get(block) || 0) + 1);
      }
    }
    
    return Array.from(blocks.values()).filter(count => count > 1).length;
  }
  
  private findUnusedVariables(lines: string[]): number {
    const variables = new Set<string>();
    const usedVariables = new Set<string>();
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      
      // Trouver les déclarations de variables
      const dimMatch = lower.match(/dim\s+([a-z_]\w*)/gi);
      if (dimMatch) {
        dimMatch.forEach(match => {
          const varName = match.split(/\s+/)[1];
          if (varName) variables.add(varName);
        });
      }
      
      // Trouver les utilisations de variables
      variables.forEach(varName => {
        if (lower.includes(varName.toLowerCase()) && !lower.startsWith('dim ')) {
          usedVariables.add(varName);
        }
      });
    });
    
    return variables.size - usedVariables.size;
  }
  
  private findInefficientLoops(lines: string[]): number {
    let count = 0;
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('for ') && lower.includes('ubound(')) count++;
      if (lower.includes('while ') && lower.includes('len(')) count++;
    });
    
    return count;
  }
  
  private calculatePerformanceScore(issues: CodeIssue[], metrics: any): number {
    let score = 100;
    
    issues.forEach(issue => {
      if (issue.type === 'performance') {
        const impact = issue.impact.performance || 5;
        const severityMultiplier = {
          low: 0.5,
          medium: 1,
          high: 2,
          critical: 4
        }[issue.severity];
        
        score -= impact * severityMultiplier;
      }
    });
    
    // Pénalités basées sur les métriques
    if (metrics.complexity > 10) score -= (metrics.complexity - 10) * 2;
    if (metrics.inefficientLoops > 0) score -= metrics.inefficientLoops * 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  private calculateMaintainabilityScore(issues: CodeIssue[], metrics: any): number {
    let score = 100;
    
    issues.forEach(issue => {
      if (issue.type === 'maintainability' || issue.type === 'style') {
        const impact = issue.impact.maintainability || 3;
        score -= impact;
      }
    });
    
    // Pénalités basées sur les métriques
    if (metrics.duplicatedBlocks > 0) score -= metrics.duplicatedBlocks * 10;
    if (metrics.unusedVariables > 0) score -= metrics.unusedVariables * 3;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  private generateSuggestions(issues: CodeIssue[], metrics: any): string[] {
    const suggestions: string[] = [];
    
    if (issues.filter(i => i.type === 'performance').length > 0) {
      suggestions.push('🚀 Focus on performance optimizations to improve application speed');
    }
    
    if (issues.filter(i => i.type === 'memory').length > 0) {
      suggestions.push('💾 Address memory management issues to prevent leaks');
    }
    
    if (metrics.complexity > 15) {
      suggestions.push('🧩 Consider refactoring complex functions into smaller ones');
    }
    
    if (metrics.duplicatedBlocks > 2) {
      suggestions.push('♻️ Extract duplicated code into reusable functions');
    }
    
    if (issues.filter(i => i.severity === 'critical').length > 0) {
      suggestions.push('🚨 Address critical security issues immediately');
    }
    
    return suggestions;
  }
}

// Composant principal
interface VB6CodeOptimizerProps {
  visible: boolean;
  onClose: () => void;
}

export const VB6CodeOptimizer: React.FC<VB6CodeOptimizerProps> = ({
  visible,
  onClose
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  const projectStore = useProjectStore();
  const analyzer = VB6CodeAnalyzer.getInstance();
  
  // Code d'exemple pour la démo
  const sampleCode = `
Sub ProcessData()
    Dim i As Integer
    Dim data As String
    For i = 1 To UBound(myArray)
        data = data & myArray(i) & " "
        If myObject.Property.SubProperty.Value > 0 Then
            myObject.Property.SubProperty.Value = myObject.Property.SubProperty.Value + 1
        End If
    Next i
    
    Dim obj As New MyClass
    ' Object never set to Nothing - potential memory leak
End Sub

Function Calculate() As Double
    Dim password As String
    password = "hardcoded123"  ' Security issue
    ' Very long function with 60+ lines of code would be flagged here
End Function
  `.trim();
  
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simuler une analyse avec délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysisResult = analyzer.analyzeCode(sampleCode, 'Form1.frm');
      setResult(analysisResult);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const filteredIssues = useMemo(() => {
    if (!result) return [];
    
    return result.issues.filter(issue => {
      const typeMatch = filterType === 'all' || issue.type === filterType;
      const severityMatch = filterSeverity === 'all' || issue.severity === filterSeverity;
      return typeMatch && severityMatch;
    });
  }, [result, filterType, filterSeverity]);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap size={16} />;
      case 'memory': return <MemoryStick size={16} />;
      case 'maintainability': return <Code size={16} />;
      case 'style': return <FileText size={16} />;
      case 'security': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              VB6 Code Optimizer
            </h2>
            {result && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm">
                  <span className="font-medium">Performance:</span>
                  <div className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                    result.performanceScore >= 80 ? 'bg-green-100 text-green-800' :
                    result.performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.performanceScore}/100
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-medium">Maintainability:</span>
                  <div className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                    result.maintainabilityScore >= 80 ? 'bg-green-100 text-green-800' :
                    result.maintainabilityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.maintainabilityScore}/100
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2" size={16} />
                  Analyze Code
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Issues List */}
          <div className="w-1/2 border-r dark:border-gray-700 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="performance">Performance</option>
                    <option value="memory">Memory</option>
                    <option value="maintainability">Maintainability</option>
                    <option value="style">Style</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Issues List */}
            <div className="flex-1 overflow-auto p-4">
              {!result ? (
                <div className="text-center py-8">
                  <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Click "Analyze Code" to start optimization analysis</p>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                  <p className="text-green-600 font-medium">No issues found!</p>
                  <p className="text-gray-500 text-sm">Your code looks good for the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedIssue?.id === issue.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <div className={`p-1 rounded ${getSeverityColor(issue.severity)}`}>
                            {getTypeIcon(issue.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{issue.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span>{issue.file}:{issue.line}</span>
                              {issue.autoFixable && (
                                <span className="ml-2 px-1 bg-green-100 text-green-700 rounded">
                                  auto-fixable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Issue Details */}
          <div className="w-1/2 flex flex-col">
            {selectedIssue ? (
              <>
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedIssue.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedIssue.description}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        {getTypeIcon(selectedIssue.type)}
                        <span className="ml-1 capitalize">{selectedIssue.type}</span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedIssue.severity)}`}>
                          {selectedIssue.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {/* Location */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Location</h4>
                      <p className="text-sm text-gray-600">
                        {selectedIssue.file} line {selectedIssue.line}, column {selectedIssue.column}
                      </p>
                    </div>
                    
                    {/* Original Code */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Current Code</h4>
                      <pre className="bg-red-50 p-3 rounded text-sm border-l-4 border-red-500 overflow-x-auto">
                        <code>{selectedIssue.originalCode}</code>
                      </pre>
                    </div>
                    
                    {/* Suggested Code */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Suggested Fix</h4>
                      <pre className="bg-green-50 p-3 rounded text-sm border-l-4 border-green-500 overflow-x-auto">
                        <code>{selectedIssue.suggestedCode}</code>
                      </pre>
                    </div>
                    
                    {/* Explanation */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Explanation</h4>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                        <Lightbulb className="inline mr-2" size={16} />
                        {selectedIssue.explanation}
                      </p>
                    </div>
                    
                    {/* Impact */}
                    {selectedIssue.impact && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Impact</h4>
                        <div className="space-y-2">
                          {selectedIssue.impact.performance && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <Zap size={14} className="mr-2" />
                                Performance
                              </span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{ width: `${selectedIssue.impact.performance * 10}%` }}
                                  />
                                </div>
                                <span>{selectedIssue.impact.performance}/10</span>
                              </div>
                            </div>
                          )}
                          {selectedIssue.impact.memory && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <MemoryStick size={14} className="mr-2" />
                                Memory
                              </span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${selectedIssue.impact.memory * 10}%` }}
                                  />
                                </div>
                                <span>{selectedIssue.impact.memory}/10</span>
                              </div>
                            </div>
                          )}
                          {selectedIssue.impact.maintainability && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <Code size={14} className="mr-2" />
                                Maintainability
                              </span>
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${selectedIssue.impact.maintainability * 10}%` }}
                                  />
                                </div>
                                <span>{selectedIssue.impact.maintainability}/10</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex space-x-2 pt-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center">
                        <Copy size={14} className="mr-2" />
                        Copy Fix
                      </button>
                      {selectedIssue.autoFixable && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center">
                          <Zap size={14} className="mr-2" />
                          Apply Fix
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : result ? (
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-4">Analysis Summary</h3>
                
                {/* Metrics Overview */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-sm mb-2">Code Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Lines of Code:</span>
                        <span className="font-medium">{result.metrics.linesOfCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complexity:</span>
                        <span className="font-medium">{result.metrics.complexity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duplicated Blocks:</span>
                        <span className="font-medium">{result.metrics.duplicatedBlocks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-sm mb-2">Issues Found</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Issues:</span>
                        <span className="font-medium">{result.totalIssues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical:</span>
                        <span className="font-medium text-red-600">{result.criticalIssues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-fixable:</span>
                        <span className="font-medium text-green-600">
                          {result.issues.filter(i => i.autoFixable).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Suggestions */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {result.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <Target size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Select an issue to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VB6CodeOptimizer;