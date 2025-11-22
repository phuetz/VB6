import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Compilation Types
export enum CompilationType {
  StandardEXE = 'Standard EXE',
  ActiveXEXE = 'ActiveX EXE',
  ActiveXDLL = 'ActiveX DLL',
  ActiveXControl = 'ActiveX Control',
  ActiveXDocument = 'ActiveX Document',
  DHtmlApplication = 'DHTML Application',
  IISApplication = 'IIS Application',
  AddIn = 'Add-In',
  DataSource = 'Data Source'
}

export enum BuildConfiguration {
  Debug = 'Debug',
  Release = 'Release',
  Custom = 'Custom'
}

export enum OptimizationLevel {
  None = 'None',
  Minimize = 'Minimize Size',
  Maximize = 'Maximize Speed',
  Balanced = 'Balanced'
}

export enum TargetPlatform {
  Win32 = 'Win32',
  Win64 = 'Win64',
  Any = 'Any CPU'
}

// Compilation Constants
export interface CompilationConstant {
  name: string;
  value: string | number | boolean;
  description: string;
}

// Build Settings
export interface BuildSettings {
  outputPath: string;
  outputName: string;
  compilationType: CompilationType;
  configuration: BuildConfiguration;
  optimization: OptimizationLevel;
  targetPlatform: TargetPlatform;
  generateDebugInfo: boolean;
  createSymbolicDebugInfo: boolean;
  removeUnusedCode: boolean;
  compileOnDemand: boolean;
  retainInMemory: boolean;
  makeCompatible: boolean;
  unattendedExecution: boolean;
  threadPerObject: boolean;
  threadingModel: 'Apartment' | 'Free' | 'Both';
  compilationConstants: CompilationConstant[];
  versionInfo: {
    major: number;
    minor: number;
    revision: number;
    autoIncrement: boolean;
    comments: string;
    companyName: string;
    fileDescription: string;
    legalCopyright: string;
    legalTrademarks: string;
    productName: string;
  };
  iconFile?: string;
  resourceFile?: string;
  helpFile?: string;
  typeLibrary?: string;
}

// Compilation Error
export interface CompilationError {
  file: string;
  line: number;
  column: number;
  severity: 'Error' | 'Warning' | 'Info';
  code: string;
  message: string;
  description: string;
}

// Compilation Result
export interface CompilationResult {
  success: boolean;
  outputFile?: string;
  errors: CompilationError[];
  warnings: CompilationError[];
  buildTime: number;
  outputSize?: number;
  dependencies: string[];
}

// Build Progress
export interface BuildProgress {
  stage: string;
  progress: number;
  currentFile?: string;
  totalFiles: number;
  processedFiles: number;
}

// Conditional Compilation Directive
export interface ConditionalDirective {
  type: 'If' | 'ElseIf' | 'Else' | 'End If';
  condition?: string;
  line: number;
  active: boolean;
}

interface VB6CompilationManagerProps {
  projectFiles: Array<{ name: string; content: string; type: string }>;
  onBuildComplete?: (result: CompilationResult) => void;
  onProgressUpdate?: (progress: BuildProgress) => void;
}

export const VB6CompilationManager: React.FC<VB6CompilationManagerProps> = ({
  projectFiles,
  onBuildComplete,
  onProgressUpdate
}) => {
  const [buildSettings, setBuildSettings] = useState<BuildSettings>({
    outputPath: './bin/',
    outputName: 'Project1',
    compilationType: CompilationType.StandardEXE,
    configuration: BuildConfiguration.Debug,
    optimization: OptimizationLevel.None,
    targetPlatform: TargetPlatform.Win32,
    generateDebugInfo: true,
    createSymbolicDebugInfo: true,
    removeUnusedCode: false,
    compileOnDemand: false,
    retainInMemory: false,
    makeCompatible: true,
    unattendedExecution: false,
    threadPerObject: false,
    threadingModel: 'Apartment',
    compilationConstants: [
      { name: 'DEBUG', value: true, description: 'Debug mode flag' },
      { name: 'WIN32', value: true, description: 'Windows 32-bit platform' },
      { name: 'VB6', value: true, description: 'VB6 compiler flag' }
    ],
    versionInfo: {
      major: 1,
      minor: 0,
      revision: 0,
      autoIncrement: true,
      comments: '',
      companyName: '',
      fileDescription: '',
      legalCopyright: '',
      legalTrademarks: '',
      productName: ''
    }
  });

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState<BuildProgress | null>(null);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [conditionalPreview, setConditionalPreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  
  const eventEmitter = useRef(new EventEmitter());

  // Conditional Compilation Processor
  const processConditionalCompilation = useCallback((code: string, constants: CompilationConstant[]): string => {
    const lines = code.split('\n');
    const processedLines: string[] = [];
    const directiveStack: ConditionalDirective[] = [];
    let currentActive = true;

    const evaluateCondition = (condition: string): boolean => {
      try {
        // Replace constants in condition
        let evaluatedCondition = condition;
        constants.forEach(constant => {
          const regex = new RegExp(`\\b${constant.name}\\b`, 'g');
          const value = typeof constant.value === 'string' ? `"${constant.value}"` : constant.value.toString();
          evaluatedCondition = evaluatedCondition.replace(regex, value);
        });

        // Simple evaluation (in real implementation, would use proper expression parser)
        // Handle basic comparisons and boolean operations
        evaluatedCondition = evaluatedCondition
          .replace(/\bTrue\b/gi, 'true')
          .replace(/\bFalse\b/gi, 'false')
          .replace(/\bAnd\b/gi, '&&')
          .replace(/\bOr\b/gi, '||')
          .replace(/\bNot\b/gi, '!')
          .replace(/=/g, '===');

        return Function(`return ${evaluatedCondition}`)();
      } catch {
        return false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('#If ')) {
        const condition = trimmedLine.substring(4).trim();
        const active = currentActive && evaluateCondition(condition);
        directiveStack.push({
          type: 'If',
          condition,
          line: index + 1,
          active
        });
        currentActive = active;
      } else if (trimmedLine.startsWith('#ElseIf ')) {
        if (directiveStack.length > 0) {
          const condition = trimmedLine.substring(8).trim();
          const parentActive = directiveStack.length > 1 ? directiveStack[directiveStack.length - 2].active : true;
          const active = parentActive && !directiveStack[directiveStack.length - 1].active && evaluateCondition(condition);
          directiveStack[directiveStack.length - 1] = {
            type: 'ElseIf',
            condition,
            line: index + 1,
            active
          };
          currentActive = active;
        }
      } else if (trimmedLine === '#Else') {
        if (directiveStack.length > 0) {
          const parentActive = directiveStack.length > 1 ? directiveStack[directiveStack.length - 2].active : true;
          const active = parentActive && !directiveStack[directiveStack.length - 1].active;
          directiveStack[directiveStack.length - 1] = {
            type: 'Else',
            line: index + 1,
            active
          };
          currentActive = active;
        }
      } else if (trimmedLine === '#End If') {
        if (directiveStack.length > 0) {
          directiveStack.pop();
          currentActive = directiveStack.length > 0 ? directiveStack[directiveStack.length - 1].active : true;
        }
      } else if (currentActive && !trimmedLine.startsWith('#')) {
        processedLines.push(line);
      }
    });

    return processedLines.join('\n');
  }, []);

  // Build Process
  const startBuild = useCallback(async () => {
    setIsBuilding(true);
    setBuildProgress({ stage: 'Initializing', progress: 0, totalFiles: projectFiles.length, processedFiles: 0 });
    
    const startTime = Date.now();
    const errors: CompilationError[] = [];
    const warnings: CompilationError[] = [];
    const dependencies: string[] = [];

    try {
      // Stage 1: Preprocessing
      setBuildProgress({ stage: 'Preprocessing files', progress: 10, totalFiles: projectFiles.length, processedFiles: 0 });
      
      const processedFiles = projectFiles.map((file, index) => {
        onProgressUpdate?.({ 
          stage: 'Preprocessing', 
          progress: 10 + (index / projectFiles.length) * 20, 
          currentFile: file.name,
          totalFiles: projectFiles.length, 
          processedFiles: index 
        });

        let processedContent = file.content;
        
        if (file.type === 'vb' || file.type === 'bas' || file.type === 'cls') {
          processedContent = processConditionalCompilation(file.content, buildSettings.compilationConstants);
        }

        return { ...file, content: processedContent };
      });

      // Stage 2: Syntax Analysis
      setBuildProgress({ stage: 'Analyzing syntax', progress: 30, totalFiles: projectFiles.length, processedFiles: 0 });
      
      processedFiles.forEach((file, index) => {
        onProgressUpdate?.({ 
          stage: 'Analyzing syntax', 
          progress: 30 + (index / projectFiles.length) * 20, 
          currentFile: file.name,
          totalFiles: projectFiles.length, 
          processedFiles: index 
        });

        // Basic syntax checking (simplified)
        const lines = file.content.split('\n');
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          // Check for common syntax errors
          if (trimmedLine.includes('End If') && !trimmedLine.startsWith('End If')) {
            warnings.push({
              file: file.name,
              line: lineIndex + 1,
              column: line.indexOf('End If') + 1,
              severity: 'Warning',
              code: 'W001',
              message: 'Possible malformed End If statement',
              description: 'End If should be on its own line or properly formatted'
            });
          }

          // Check for undefined variables (basic)
          const varMatch = trimmedLine.match(/Dim\s+(\w+)/i);
          if (varMatch) {
            dependencies.push(`Variable: ${varMatch[1]}`);
          }

          // Check for API declarations
          const apiMatch = trimmedLine.match(/Declare\s+(Function|Sub)\s+(\w+)/i);
          if (apiMatch) {
            dependencies.push(`API: ${apiMatch[2]}`);
          }
        });
      });

      // Stage 3: Dependency Resolution
      setBuildProgress({ stage: 'Resolving dependencies', progress: 50, totalFiles: projectFiles.length, processedFiles: projectFiles.length });
      
      // Check for missing references (simplified)
      const requiredReferences = ['VBA', 'stdole', 'MSComctlLib'];
      requiredReferences.forEach(ref => {
        dependencies.push(`Reference: ${ref}`);
      });

      // Stage 4: Code Generation
      setBuildProgress({ stage: 'Generating code', progress: 70, totalFiles: projectFiles.length, processedFiles: projectFiles.length });
      
      // Simulate code generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 5: Binary Generation
      setBuildProgress({ stage: 'Creating output file', progress: 90, totalFiles: projectFiles.length, processedFiles: projectFiles.length });
      
      // Simulate binary creation
      const outputExtension = buildSettings.compilationType === CompilationType.ActiveXDLL ? '.dll' : '.exe';
      const outputFile = `${buildSettings.outputPath}${buildSettings.outputName}${outputExtension}`;
      const outputSize = Math.floor(Math.random() * 1000000) + 100000; // Simulate file size

      // Stage 6: Finalization
      setBuildProgress({ stage: 'Finalizing', progress: 100, totalFiles: projectFiles.length, processedFiles: projectFiles.length });

      const buildTime = Date.now() - startTime;
      
      const result: CompilationResult = {
        success: errors.length === 0,
        outputFile,
        errors,
        warnings,
        buildTime,
        outputSize,
        dependencies
      };

      setCompilationResult(result);
      onBuildComplete?.(result);

      // Auto-increment version if enabled
      if (buildSettings.versionInfo.autoIncrement && result.success) {
        setBuildSettings(prev => ({
          ...prev,
          versionInfo: {
            ...prev.versionInfo,
            revision: prev.versionInfo.revision + 1
          }
        }));
      }

      eventEmitter.current.emit('buildComplete', result);

    } catch (error) {
      const result: CompilationResult = {
        success: false,
        errors: [{
          file: '',
          line: 0,
          column: 0,
          severity: 'Error',
          code: 'E999',
          message: 'Compilation failed',
          description: error instanceof Error ? error.message : 'Unknown error'
        }],
        warnings: [],
        buildTime: Date.now() - startTime,
        dependencies: []
      };

      setCompilationResult(result);
      onBuildComplete?.(result);
    } finally {
      setIsBuilding(false);
      setBuildProgress(null);
    }
  }, [projectFiles, buildSettings, processConditionalCompilation, onBuildComplete, onProgressUpdate]);

  // Preview conditional compilation
  const previewConditionalCompilation = useCallback(() => {
    if (selectedFile && projectFiles.length > 0) {
      const file = projectFiles.find(f => f.name === selectedFile);
      if (file) {
        const processed = processConditionalCompilation(file.content, buildSettings.compilationConstants);
        setConditionalPreview(processed);
      }
    }
  }, [selectedFile, projectFiles, buildSettings.compilationConstants, processConditionalCompilation]);

  useEffect(() => {
    previewConditionalCompilation();
  }, [selectedFile, previewConditionalCompilation]);

  const addCompilationConstant = useCallback(() => {
    const newConstant: CompilationConstant = {
      name: `CONSTANT${buildSettings.compilationConstants.length + 1}`,
      value: true,
      description: 'Custom compilation constant'
    };
    
    setBuildSettings(prev => ({
      ...prev,
      compilationConstants: [...prev.compilationConstants, newConstant]
    }));
  }, [buildSettings.compilationConstants.length]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">VB6 Compilation Manager</h2>
            <select
              value={buildSettings.configuration}
              onChange={(e) => setBuildSettings(prev => ({ ...prev, configuration: e.target.value as BuildConfiguration }))}
              className="px-3 py-1 border border-gray-300 rounded"
            >
              {Object.values(BuildConfiguration).map(config => (
                <option key={config} value={config}>{config}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={previewConditionalCompilation}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!selectedFile}
            >
              Preview
            </button>
            <button
              onClick={startBuild}
              disabled={isBuilding || projectFiles.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isBuilding ? 'Building...' : `Make ${buildSettings.compilationType}`}
            </button>
          </div>
        </div>
      </div>

      {/* Build Progress */}
      {buildProgress && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">{buildProgress.stage}</span>
            <span className="text-sm text-blue-600">{buildProgress.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${buildProgress.progress}%` }}
            />
          </div>
          {buildProgress.currentFile && (
            <div className="text-xs text-blue-600 mt-1">
              Processing: {buildProgress.currentFile} ({buildProgress.processedFiles + 1}/{buildProgress.totalFiles})
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Panel */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-700 mb-4">Build Settings</h3>
            
            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Output Name</label>
                <input
                  type="text"
                  value={buildSettings.outputName}
                  onChange={(e) => setBuildSettings(prev => ({ ...prev, outputName: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Compilation Type</label>
                <select
                  value={buildSettings.compilationType}
                  onChange={(e) => setBuildSettings(prev => ({ ...prev, compilationType: e.target.value as CompilationType }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Object.values(CompilationType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Optimization</label>
                <select
                  value={buildSettings.optimization}
                  onChange={(e) => setBuildSettings(prev => ({ ...prev, optimization: e.target.value as OptimizationLevel }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Object.values(OptimizationLevel).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Target Platform</label>
                <select
                  value={buildSettings.targetPlatform}
                  onChange={(e) => setBuildSettings(prev => ({ ...prev, targetPlatform: e.target.value as TargetPlatform }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Object.values(TargetPlatform).map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={buildSettings.generateDebugInfo}
                    onChange={(e) => setBuildSettings(prev => ({ ...prev, generateDebugInfo: e.target.checked }))}
                  />
                  Generate Debug Info
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={buildSettings.removeUnusedCode}
                    onChange={(e) => setBuildSettings(prev => ({ ...prev, removeUnusedCode: e.target.checked }))}
                  />
                  Remove Unused Code
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={buildSettings.compileOnDemand}
                    onChange={(e) => setBuildSettings(prev => ({ ...prev, compileOnDemand: e.target.checked }))}
                  />
                  Compile On Demand
                </label>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mt-6">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {showAdvancedSettings ? '▼' : '▶'} Advanced Settings
              </button>
              
              {showAdvancedSettings && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Threading Model</label>
                    <select
                      value={buildSettings.threadingModel}
                      onChange={(e) => setBuildSettings(prev => ({ ...prev, threadingModel: e.target.value as 'Apartment' | 'Free' | 'Both' }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Free">Free</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={buildSettings.makeCompatible}
                        onChange={(e) => setBuildSettings(prev => ({ ...prev, makeCompatible: e.target.checked }))}
                      />
                      Binary Compatibility
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={buildSettings.unattendedExecution}
                        onChange={(e) => setBuildSettings(prev => ({ ...prev, unattendedExecution: e.target.checked }))}
                      />
                      Unattended Execution
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={buildSettings.threadPerObject}
                        onChange={(e) => setBuildSettings(prev => ({ ...prev, threadPerObject: e.target.checked }))}
                      />
                      Thread Per Object
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Compilation Constants */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700">Compilation Constants</h4>
                <button
                  onClick={addCompilationConstant}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {buildSettings.compilationConstants.map((constant, index) => (
                  <div key={index} className="p-2 border border-gray-300 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={constant.name}
                        onChange={(e) => {
                          const updated = [...buildSettings.compilationConstants];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setBuildSettings(prev => ({ ...prev, compilationConstants: updated }));
                        }}
                        className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded"
                        placeholder="Name"
                      />
                      <button
                        onClick={() => {
                          const updated = buildSettings.compilationConstants.filter((_, i) => i !== index);
                          setBuildSettings(prev => ({ ...prev, compilationConstants: updated }));
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      value={constant.value.toString()}
                      onChange={(e) => {
                        const updated = [...buildSettings.compilationConstants];
                        let value: string | number | boolean = e.target.value;
                        
                        // Try to parse as number or boolean
                        if (value.toLowerCase() === 'true') value = true;
                        else if (value.toLowerCase() === 'false') value = false;
                        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
                        
                        updated[index] = { ...updated[index], value };
                        setBuildSettings(prev => ({ ...prev, compilationConstants: updated }));
                      }}
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Value"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Version Info */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-2">Version Information</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={buildSettings.versionInfo.major}
                    onChange={(e) => setBuildSettings(prev => ({
                      ...prev,
                      versionInfo: { ...prev.versionInfo, major: Number(e.target.value) }
                    }))}
                    className="px-1 py-1 text-xs border border-gray-300 rounded"
                    placeholder="Major"
                  />
                  <input
                    type="number"
                    value={buildSettings.versionInfo.minor}
                    onChange={(e) => setBuildSettings(prev => ({
                      ...prev,
                      versionInfo: { ...prev.versionInfo, minor: Number(e.target.value) }
                    }))}
                    className="px-1 py-1 text-xs border border-gray-300 rounded"
                    placeholder="Minor"
                  />
                  <input
                    type="number"
                    value={buildSettings.versionInfo.revision}
                    onChange={(e) => setBuildSettings(prev => ({
                      ...prev,
                      versionInfo: { ...prev.versionInfo, revision: Number(e.target.value) }
                    }))}
                    className="px-1 py-1 text-xs border border-gray-300 rounded"
                    placeholder="Rev"
                  />
                </div>
                
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={buildSettings.versionInfo.autoIncrement}
                    onChange={(e) => setBuildSettings(prev => ({
                      ...prev,
                      versionInfo: { ...prev.versionInfo, autoIncrement: e.target.checked }
                    }))}
                  />
                  Auto Increment
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Selector for Preview */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Preview File:</label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Select a file...</option>
                {projectFiles.map(file => (
                  <option key={file.name} value={file.name}>{file.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="flex-1 overflow-hidden">
            {conditionalPreview && (
              <div className="h-full p-4">
                <h3 className="text-lg font-medium mb-4">Conditional Compilation Preview</h3>
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div>
                    <h4 className="font-medium mb-2">Original Code</h4>
                    <textarea
                      value={projectFiles.find(f => f.name === selectedFile)?.content || ''}
                      readOnly
                      className="w-full h-full font-mono text-sm p-2 border border-gray-300 rounded resize-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Processed Code</h4>
                    <textarea
                      value={conditionalPreview}
                      readOnly
                      className="w-full h-full font-mono text-sm p-2 border border-gray-300 rounded resize-none bg-green-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        {compilationResult && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className={`font-medium mb-4 ${compilationResult.success ? 'text-green-700' : 'text-red-700'}`}>
                Build {compilationResult.success ? 'Succeeded' : 'Failed'}
              </h3>
              
              <div className="space-y-3 text-sm">
                {compilationResult.success && (
                  <>
                    <div>
                      <strong>Output File:</strong>
                      <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-xs">
                        {compilationResult.outputFile}
                      </div>
                    </div>
                    
                    <div>
                      <strong>File Size:</strong> {(compilationResult.outputSize! / 1024).toFixed(1)} KB
                    </div>
                  </>
                )}
                
                <div>
                  <strong>Build Time:</strong> {(compilationResult.buildTime / 1000).toFixed(1)}s
                </div>
                
                <div>
                  <strong>Errors:</strong> {compilationResult.errors.length}
                </div>
                
                <div>
                  <strong>Warnings:</strong> {compilationResult.warnings.length}
                </div>
              </div>

              {/* Error List */}
              {compilationResult.errors.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-red-700 mb-2">Errors</h4>
                  <div className="space-y-2">
                    {compilationResult.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium text-red-800">{error.code}: {error.message}</div>
                        <div className="text-xs text-red-600 mt-1">
                          {error.file}:{error.line}:{error.column}
                        </div>
                        <div className="text-xs text-red-600 mt-1">{error.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning List */}
              {compilationResult.warnings.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-yellow-700 mb-2">Warnings</h4>
                  <div className="space-y-2">
                    {compilationResult.warnings.map((warning, index) => (
                      <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="font-medium text-yellow-800">{warning.code}: {warning.message}</div>
                        <div className="text-xs text-yellow-600 mt-1">
                          {warning.file}:{warning.line}:{warning.column}
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">{warning.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {compilationResult.dependencies.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-2">Dependencies</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {compilationResult.dependencies.map((dep, index) => (
                      <div key={index} className="text-xs text-gray-600 py-1">
                        {dep}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VB6CompilationManager;