import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Compilation Options
export enum CompilationType {
  NativeCode = 'Native Code',
  PCode = 'P-Code',
}

export enum OptimizationType {
  None = 'No Optimization',
  OptimizeForFastCode = 'Optimize for Fast Code',
  OptimizeForSmallCode = 'Optimize for Small Code',
  FavorPentiumPro = 'Favor Pentium Pro(tm)',
}

export enum DLLBaseAddress {
  Default = '&H11000000',
  Custom = 'Custom',
}

// Version Information
export interface VersionInfo {
  major: number;
  minor: number;
  revision: number;
  autoIncrement: boolean;
  companyName: string;
  fileDescription: string;
  legalCopyright: string;
  legalTrademarks: string;
  productName: string;
  comments: string;
}

// Make Options
export interface MakeOptions {
  // General
  outputPath: string;
  outputFileName: string;
  compilationType: CompilationType;

  // Compile
  optimizationType: OptimizationType;
  favorPentiumPro: boolean;
  createSymbolicDebugInfo: boolean;
  compileToDLL: boolean;
  dllBaseAddress: string;
  threadingModel: 'Single Threaded' | 'Apartment Threaded';

  // Advanced Optimizations
  assumeNoAliasing: boolean;
  removeArrayBoundsChecks: boolean;
  removeIntegerOverflowChecks: boolean;
  removeFloatingPointErrorChecks: boolean;
  allowUnroundedFloatingPoint: boolean;
  removeSafeModePentiumFDIVChecks: boolean;

  // Debugging
  symbolicDebugInfo: boolean;
  conditionalCompilationArgs: string;

  // Version
  versionInfo: VersionInfo;

  // Command Line
  preBuildCommand: string;
  postBuildCommand: string;
  useCommandLineArguments: boolean;
  commandLineArguments: string;
}

// Compilation Result
export interface CompilationResult {
  success: boolean;
  outputFile: string;
  errors: string[];
  warnings: string[];
  buildTime: number;
  fileSize: number;
}

// Recent Build
export interface RecentBuild {
  timestamp: Date;
  outputFile: string;
  configuration: string;
  success: boolean;
  buildTime: number;
}

interface MakeProjectDialogProps {
  projectName: string;
  projectType: string;
  defaultOptions?: Partial<MakeOptions>;
  onCompile?: (options: MakeOptions) => void;
  onClose?: () => void;
}

export const MakeProjectDialog: React.FC<MakeProjectDialogProps> = ({
  projectName,
  projectType,
  defaultOptions,
  onCompile,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<
    'general' | 'compile' | 'component' | 'version' | 'cmdline'
  >('general');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [recentBuilds, setRecentBuilds] = useState<RecentBuild[]>([]);
  const [showAdvancedOptimizations, setShowAdvancedOptimizations] = useState(false);
  const [options, setOptions] = useState<MakeOptions>({
    outputPath: defaultOptions?.outputPath || 'bin\\Release\\',
    outputFileName: defaultOptions?.outputFileName || `${projectName}.exe`,
    compilationType: defaultOptions?.compilationType || CompilationType.NativeCode,

    optimizationType: defaultOptions?.optimizationType || OptimizationType.OptimizeForFastCode,
    favorPentiumPro: defaultOptions?.favorPentiumPro || false,
    createSymbolicDebugInfo: defaultOptions?.createSymbolicDebugInfo || false,
    compileToDLL: defaultOptions?.compileToDLL || projectType.includes('DLL'),
    dllBaseAddress: defaultOptions?.dllBaseAddress || DLLBaseAddress.Default,
    threadingModel: defaultOptions?.threadingModel || 'Apartment Threaded',

    assumeNoAliasing: defaultOptions?.assumeNoAliasing || false,
    removeArrayBoundsChecks: defaultOptions?.removeArrayBoundsChecks || false,
    removeIntegerOverflowChecks: defaultOptions?.removeIntegerOverflowChecks || false,
    removeFloatingPointErrorChecks: defaultOptions?.removeFloatingPointErrorChecks || false,
    allowUnroundedFloatingPoint: defaultOptions?.allowUnroundedFloatingPoint || false,
    removeSafeModePentiumFDIVChecks: defaultOptions?.removeSafeModePentiumFDIVChecks || false,

    symbolicDebugInfo: defaultOptions?.symbolicDebugInfo || false,
    conditionalCompilationArgs: defaultOptions?.conditionalCompilationArgs || '',

    versionInfo: defaultOptions?.versionInfo || {
      major: 1,
      minor: 0,
      revision: 0,
      autoIncrement: true,
      companyName: 'My Company',
      fileDescription: projectName,
      legalCopyright: `Copyright © ${new Date().getFullYear()}`,
      legalTrademarks: '',
      productName: projectName,
      comments: '',
    },

    preBuildCommand: defaultOptions?.preBuildCommand || '',
    postBuildCommand: defaultOptions?.postBuildCommand || '',
    useCommandLineArguments: defaultOptions?.useCommandLineArguments || false,
    commandLineArguments: defaultOptions?.commandLineArguments || '',
  });

  const eventEmitter = useRef(new EventEmitter());

  // Load recent builds
  useEffect(() => {
    // Simulate loading recent builds
    const sampleBuilds: RecentBuild[] = [
      {
        timestamp: new Date(Date.now() - 3600000),
        outputFile: 'bin\\Release\\MyApp.exe',
        configuration: 'Release',
        success: true,
        buildTime: 4520,
      },
      {
        timestamp: new Date(Date.now() - 7200000),
        outputFile: 'bin\\Debug\\MyApp.exe',
        configuration: 'Debug',
        success: true,
        buildTime: 3200,
      },
      {
        timestamp: new Date(Date.now() - 86400000),
        outputFile: 'bin\\Release\\MyApp.exe',
        configuration: 'Release',
        success: false,
        buildTime: 1500,
      },
    ];
    setRecentBuilds(sampleBuilds);
  }, []);

  // Update output filename based on compilation type
  useEffect(() => {
    const extension = options.compileToDLL ? '.dll' : '.exe';
    const baseName = options.outputFileName.replace(/\.(exe|dll)$/i, '');
    setOptions(prev => ({
      ...prev,
      outputFileName: baseName + extension,
    }));
  }, [options.compileToDLL]);

  // Start compilation
  const startCompilation = useCallback(async () => {
    setIsCompiling(true);
    setCompilationResult(null);

    // Emit compilation start event
    eventEmitter.current.emit('compilationStarted', options);

    // Simulate compilation process
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate compilation result
    const success = Math.random() > 0.2; // 80% success rate
    const result: CompilationResult = {
      success,
      outputFile: `${options.outputPath}${options.outputFileName}`,
      errors: success
        ? []
        : [
            'Compile error in module MainForm: Variable not defined',
            'Type mismatch in function Calculate()',
          ],
      warnings: success
        ? ["Variable 'unused' is declared but never used", "Function 'OldMethod' is obsolete"]
        : [],
      buildTime: 2000 + Math.random() * 3000,
      fileSize: Math.floor(Math.random() * 1024 * 1024) + 102400, // 100KB to 1.1MB
    };

    setCompilationResult(result);
    setIsCompiling(false);

    // Add to recent builds
    const newBuild: RecentBuild = {
      timestamp: new Date(),
      outputFile: result.outputFile,
      configuration: options.optimizationType === OptimizationType.None ? 'Debug' : 'Release',
      success: result.success,
      buildTime: result.buildTime,
    };
    setRecentBuilds(prev => [newBuild, ...prev.slice(0, 9)]);

    // Call callback if provided
    if (result.success && onCompile) {
      onCompile(options);
    }

    // Emit compilation complete event
    eventEmitter.current.emit('compilationCompleted', result);
  }, [options, onCompile]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Format build time
  const formatBuildTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Make {projectName}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('general')}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setSelectedTab('compile')}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === 'compile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Compile
            </button>
            <button
              onClick={() => setSelectedTab('component')}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === 'component'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Component
            </button>
            <button
              onClick={() => setSelectedTab('version')}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === 'version'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Make Version
            </button>
            <button
              onClick={() => setSelectedTab('cmdline')}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === 'cmdline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Command Line
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'general' && (
            <div className="space-y-6">
              {/* Output Settings */}
              <div>
                <h3 className="font-medium mb-3">Output Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Output Path
                    </label>
                    <input
                      type="text"
                      value={options.outputPath}
                      onChange={e => setOptions(prev => ({ ...prev, outputPath: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Output File Name
                    </label>
                    <input
                      type="text"
                      value={options.outputFileName}
                      onChange={e =>
                        setOptions(prev => ({ ...prev, outputFileName: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Compilation Type */}
              <div>
                <h3 className="font-medium mb-3">Compilation Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="compilationType"
                      value={CompilationType.NativeCode}
                      checked={options.compilationType === CompilationType.NativeCode}
                      onChange={e =>
                        setOptions(prev => ({
                          ...prev,
                          compilationType: e.target.value as CompilationType,
                        }))
                      }
                    />
                    <span>Compile to Native Code</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="compilationType"
                      value={CompilationType.PCode}
                      checked={options.compilationType === CompilationType.PCode}
                      onChange={e =>
                        setOptions(prev => ({
                          ...prev,
                          compilationType: e.target.value as CompilationType,
                        }))
                      }
                    />
                    <span>Compile to P-Code</span>
                  </label>
                </div>
              </div>

              {/* Recent Builds */}
              {recentBuilds.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Recent Builds</h3>
                  <div className="border border-gray-200 rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Time</th>
                          <th className="text-left p-2">Output</th>
                          <th className="text-left p-2">Config</th>
                          <th className="text-left p-2">Build Time</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBuilds.map((build, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="p-2">{build.timestamp.toLocaleTimeString()}</td>
                            <td className="p-2 font-mono text-xs">{build.outputFile}</td>
                            <td className="p-2">{build.configuration}</td>
                            <td className="p-2">{formatBuildTime(build.buildTime)}</td>
                            <td className="p-2">
                              <span className={build.success ? 'text-green-600' : 'text-red-600'}>
                                {build.success ? '✓ Success' : '✗ Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'compile' && (
            <div className="space-y-6">
              {/* Optimization */}
              <div>
                <h3 className="font-medium mb-3">Optimization</h3>
                <div className="space-y-2">
                  {Object.values(OptimizationType).map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="optimization"
                        value={type}
                        checked={options.optimizationType === type}
                        onChange={e =>
                          setOptions(prev => ({
                            ...prev,
                            optimizationType: e.target.value as OptimizationType,
                          }))
                        }
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {options.optimizationType === OptimizationType.FavorPentiumPro && (
                  <div className="mt-2 ml-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.favorPentiumPro}
                        onChange={e =>
                          setOptions(prev => ({ ...prev, favorPentiumPro: e.target.checked }))
                        }
                      />
                      <span className="text-sm">Favor Pentium Pro(tm)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Advanced Optimizations */}
              <div>
                <button
                  onClick={() => setShowAdvancedOptimizations(!showAdvancedOptimizations)}
                  className="font-medium text-blue-600 hover:text-blue-800 mb-3"
                >
                  Advanced Optimizations {showAdvancedOptimizations ? '▼' : '▶'}
                </button>
                {showAdvancedOptimizations && (
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.assumeNoAliasing}
                        onChange={e =>
                          setOptions(prev => ({ ...prev, assumeNoAliasing: e.target.checked }))
                        }
                      />
                      <span className="text-sm">Assume No Aliasing</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.removeArrayBoundsChecks}
                        onChange={e =>
                          setOptions(prev => ({
                            ...prev,
                            removeArrayBoundsChecks: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm">Remove Array Bounds Checks</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.removeIntegerOverflowChecks}
                        onChange={e =>
                          setOptions(prev => ({
                            ...prev,
                            removeIntegerOverflowChecks: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm">Remove Integer Overflow Checks</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.removeFloatingPointErrorChecks}
                        onChange={e =>
                          setOptions(prev => ({
                            ...prev,
                            removeFloatingPointErrorChecks: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm">Remove Floating Point Error Checks</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.allowUnroundedFloatingPoint}
                        onChange={e =>
                          setOptions(prev => ({
                            ...prev,
                            allowUnroundedFloatingPoint: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm">Allow Unrounded Floating Point Operations</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.removeSafeModePentiumFDIVChecks}
                        onChange={e =>
                          setOptions(prev => ({
                            ...prev,
                            removeSafeModePentiumFDIVChecks: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm">Remove Safe Pentium(tm) FDIV Checks</span>
                    </label>
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⚠️ Warning: These optimizations may affect program stability. Use with
                      caution.
                    </div>
                  </div>
                )}
              </div>

              {/* Debugging */}
              <div>
                <h3 className="font-medium mb-3">Debugging</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.createSymbolicDebugInfo}
                    onChange={e =>
                      setOptions(prev => ({ ...prev, createSymbolicDebugInfo: e.target.checked }))
                    }
                  />
                  <span>Create Symbolic Debug Info</span>
                </label>
              </div>

              {/* Conditional Compilation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditional Compilation Arguments
                </label>
                <input
                  type="text"
                  value={options.conditionalCompilationArgs}
                  onChange={e =>
                    setOptions(prev => ({ ...prev, conditionalCompilationArgs: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="DEBUG = 1 : VERSION = 2"
                />
              </div>
            </div>
          )}

          {selectedTab === 'component' && (
            <div className="space-y-6">
              {/* Component Type */}
              <div>
                <h3 className="font-medium mb-3">Component Type</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.compileToDLL}
                    onChange={e =>
                      setOptions(prev => ({ ...prev, compileToDLL: e.target.checked }))
                    }
                  />
                  <span>Compile to ActiveX DLL</span>
                </label>
              </div>

              {/* DLL Settings */}
              {options.compileToDLL && (
                <>
                  <div>
                    <h3 className="font-medium mb-3">DLL Base Address</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="dllBase"
                          checked={options.dllBaseAddress === DLLBaseAddress.Default}
                          onChange={() =>
                            setOptions(prev => ({
                              ...prev,
                              dllBaseAddress: DLLBaseAddress.Default,
                            }))
                          }
                        />
                        <span>Default ({DLLBaseAddress.Default})</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="dllBase"
                          checked={options.dllBaseAddress !== DLLBaseAddress.Default}
                          onChange={() => setOptions(prev => ({ ...prev, dllBaseAddress: '' }))}
                        />
                        <span>Custom:</span>
                        <input
                          type="text"
                          value={
                            options.dllBaseAddress === DLLBaseAddress.Default
                              ? ''
                              : options.dllBaseAddress
                          }
                          onChange={e =>
                            setOptions(prev => ({ ...prev, dllBaseAddress: e.target.value }))
                          }
                          className="px-2 py-1 border border-gray-300 rounded"
                          placeholder="&H11000000"
                          disabled={options.dllBaseAddress === DLLBaseAddress.Default}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Threading Model</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="threading"
                          value="Single Threaded"
                          checked={options.threadingModel === 'Single Threaded'}
                          onChange={e =>
                            setOptions(prev => ({ ...prev, threadingModel: e.target.value as any }))
                          }
                        />
                        <span>Single Threaded</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="threading"
                          value="Apartment Threaded"
                          checked={options.threadingModel === 'Apartment Threaded'}
                          onChange={e =>
                            setOptions(prev => ({ ...prev, threadingModel: e.target.value as any }))
                          }
                        />
                        <span>Apartment Threaded</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Component Information */}
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">Component Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Project: {projectName}</div>
                  <div>Type: {projectType}</div>
                  <div>Output: {options.compileToDLL ? 'ActiveX DLL' : 'Standard EXE'}</div>
                  {options.compileToDLL && (
                    <>
                      <div>Base Address: {options.dllBaseAddress}</div>
                      <div>Threading: {options.threadingModel}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'version' && (
            <div className="space-y-6">
              {/* Version Numbers */}
              <div>
                <h3 className="font-medium mb-3">Version Number</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={options.versionInfo.major}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, major: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    min="0"
                  />
                  <span>.</span>
                  <input
                    type="number"
                    value={options.versionInfo.minor}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, minor: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    min="0"
                  />
                  <span>.</span>
                  <input
                    type="number"
                    value={options.versionInfo.revision}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: {
                          ...prev.versionInfo,
                          revision: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    min="0"
                  />
                  <label className="flex items-center gap-2 ml-4">
                    <input
                      type="checkbox"
                      checked={options.versionInfo.autoIncrement}
                      onChange={e =>
                        setOptions(prev => ({
                          ...prev,
                          versionInfo: { ...prev.versionInfo, autoIncrement: e.target.checked },
                        }))
                      }
                    />
                    <span className="text-sm">Auto Increment</span>
                  </label>
                </div>
              </div>

              {/* Version Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={options.versionInfo.companyName}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, companyName: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Description
                  </label>
                  <input
                    type="text"
                    value={options.versionInfo.fileDescription}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, fileDescription: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Copyright
                  </label>
                  <input
                    type="text"
                    value={options.versionInfo.legalCopyright}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, legalCopyright: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Trademarks
                  </label>
                  <input
                    type="text"
                    value={options.versionInfo.legalTrademarks}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, legalTrademarks: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={options.versionInfo.productName}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, productName: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <textarea
                    value={options.versionInfo.comments}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        versionInfo: { ...prev.versionInfo, comments: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'cmdline' && (
            <div className="space-y-6">
              {/* Pre-Build Command */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pre-Build Command Line
                </label>
                <textarea
                  value={options.preBuildCommand}
                  onChange={e => setOptions(prev => ({ ...prev, preBuildCommand: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows={3}
                  placeholder="Commands to run before build..."
                />
              </div>

              {/* Post-Build Command */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post-Build Command Line
                </label>
                <textarea
                  value={options.postBuildCommand}
                  onChange={e =>
                    setOptions(prev => ({ ...prev, postBuildCommand: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows={3}
                  placeholder="Commands to run after build..."
                />
              </div>

              {/* Command Line Arguments */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={options.useCommandLineArguments}
                    onChange={e =>
                      setOptions(prev => ({ ...prev, useCommandLineArguments: e.target.checked }))
                    }
                  />
                  <span className="font-medium">Use Command Line Arguments</span>
                </label>
                {options.useCommandLineArguments && (
                  <input
                    type="text"
                    value={options.commandLineArguments}
                    onChange={e =>
                      setOptions(prev => ({ ...prev, commandLineArguments: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="/debug /config=release"
                  />
                )}
              </div>

              {/* Generated Command */}
              <div>
                <h3 className="font-medium mb-2">Generated VB6 Compiler Command</h3>
                <div className="p-3 bg-gray-900 text-gray-100 rounded font-mono text-sm">
                  <div className="whitespace-pre-wrap">
                    {`vb6.exe /make "${projectName}.vbp" /out "${options.outputPath}${options.outputFileName}"`}
                    {options.compilationType === CompilationType.NativeCode && ' /compile'}
                    {options.createSymbolicDebugInfo && ' /d'}
                    {options.conditionalCompilationArgs &&
                      ` /cmd "${options.conditionalCompilationArgs}"`}
                    {options.optimizationType !== OptimizationType.None &&
                      ` /O${options.optimizationType.charAt(0)}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compilation Result */}
        {compilationResult && (
          <div
            className={`p-4 border-t ${compilationResult.success ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                {compilationResult.success ? '✅ Build Succeeded' : '❌ Build Failed'}
              </h3>
              <span className="text-sm text-gray-600">
                Build time: {formatBuildTime(compilationResult.buildTime)}
              </span>
            </div>

            {compilationResult.success && (
              <div className="text-sm text-gray-700">
                <div>Output: {compilationResult.outputFile}</div>
                <div>Size: {formatFileSize(compilationResult.fileSize)}</div>
              </div>
            )}

            {compilationResult.errors.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-red-700">Errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {compilationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {compilationResult.warnings.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-yellow-700">Warnings:</h4>
                <ul className="list-disc list-inside text-sm text-yellow-600">
                  {compilationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={() => {
                // Reset to defaults
                setOptions({
                  ...options,
                  optimizationType: OptimizationType.OptimizeForFastCode,
                  assumeNoAliasing: false,
                  removeArrayBoundsChecks: false,
                  removeIntegerOverflowChecks: false,
                  removeFloatingPointErrorChecks: false,
                  allowUnroundedFloatingPoint: false,
                  removeSafeModePentiumFDIVChecks: false,
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Reset to Defaults
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={startCompilation}
                disabled={isCompiling}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isCompiling ? 'Compiling...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakeProjectDialog;
