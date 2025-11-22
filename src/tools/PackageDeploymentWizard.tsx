import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Package Types
export enum PackageType {
  StandardSetup = 'Standard Setup Package',
  InternetPackage = 'Internet Package',
  DependencyFile = 'Dependency File'
}

export enum DeploymentType {
  FloppyDisk = 'Floppy Disk',
  SingleDirectory = 'Single Directory',
  CdRom = 'CD-ROM',
  WebPublishing = 'Web Publishing',
  NetworkShare = 'Network Share'
}

export enum InstallationMedia {
  Floppy144 = '1.44 MB Floppy',
  Floppy120 = '1.2 MB Floppy',
  CdRom = 'CD-ROM',
  HardDisk = 'Hard Disk',
  Network = 'Network'
}

// File Information
export interface FileInfo {
  fileName: string;
  path: string;
  size: number;
  version: string;
  date: Date;
  attributes: string;
  selected: boolean;
  required: boolean;
  shared: boolean;
  selfRegistering: boolean;
  destination: string;
  targetDirectory: string;
}

// Dependency Information
export interface DependencyInfo {
  name: string;
  fileName: string;
  version: string;
  location: string;
  required: boolean;
  redistributable: boolean;
  alreadyInstalled: boolean;
}

// Installation Script
export interface InstallationScript {
  preInstall: string[];
  postInstall: string[];
  preUninstall: string[];
  postUninstall: string[];
  registryEntries: Array<{
    hive: string;
    key: string;
    value: string;
    data: string;
    type: string;
  }>;
  shortcuts: Array<{
    name: string;
    target: string;
    location: string;
    workingDir: string;
    arguments: string;
    icon: string;
  }>;
}

// Package Configuration
export interface PackageConfiguration {
  name: string;
  description: string;
  version: string;
  author: string;
  company: string;
  packageType: PackageType;
  deploymentType: DeploymentType;
  installationMedia: InstallationMedia;
  applicationFiles: FileInfo[];
  dependencies: DependencyInfo[];
  installLocation: string;
  createUninstaller: boolean;
  createStartMenuShortcuts: boolean;
  createDesktopShortcut: boolean;
  overwriteExistingFiles: boolean;
  installOnlyNewerFiles: boolean;
  script: InstallationScript;
  compression: boolean;
  password: string;
  digitalSignature: boolean;
  certificatePath: string;
  requiresReboot: boolean;
  silentInstall: boolean;
  customActions: Array<{
    name: string;
    command: string;
    timing: 'Before' | 'After' | 'Both';
  }>;
}

// Wizard Steps
enum WizardStep {
  Welcome = 0,
  PackageType = 1,
  PackageFolder = 2,
  IncludedFiles = 3,
  Dependencies = 4,
  InstallSettings = 5,
  StartMenuItems = 6,
  InstallLocation = 7,
  SharedFiles = 8,
  Finished = 9
}

interface PackageDeploymentWizardProps {
  projectPath: string;
  projectName: string;
  projectFiles: Array<{ name: string; path: string; type: string }>;
  onComplete?: (config: PackageConfiguration) => void;
  onCancel?: () => void;
}

export const PackageDeploymentWizard: React.FC<PackageDeploymentWizardProps> = ({
  projectPath,
  projectName,
  projectFiles,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Welcome);
  const [packageConfig, setPackageConfig] = useState<PackageConfiguration>({
    name: projectName,
    description: `${projectName} Installation Package`,
    version: '1.0.0',
    author: '',
    company: '',
    packageType: PackageType.StandardSetup,
    deploymentType: DeploymentType.SingleDirectory,
    installationMedia: InstallationMedia.HardDisk,
    applicationFiles: [],
    dependencies: [],
    installLocation: `C:\\Program Files\\${projectName}`,
    createUninstaller: true,
    createStartMenuShortcuts: true,
    createDesktopShortcut: false,
    overwriteExistingFiles: true,
    installOnlyNewerFiles: false,
    script: {
      preInstall: [],
      postInstall: [],
      preUninstall: [],
      postUninstall: [],
      registryEntries: [],
      shortcuts: []
    },
    compression: true,
    password: '',
    digitalSignature: false,
    certificatePath: '',
    requiresReboot: false,
    silentInstall: false,
    customActions: []
  });

  const [analysisResults, setAnalysisResults] = useState<{
    applicationFiles: FileInfo[];
    dependencies: DependencyInfo[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [isBuilding, setIsBuilding] = useState(false);
  
  const eventEmitter = useRef(new EventEmitter());

  // Standard VB6 Dependencies
  const standardDependencies: DependencyInfo[] = [
    {
      name: 'Visual Basic 6.0 Runtime',
      fileName: 'msvbvm60.dll',
      version: '6.0.88.4',
      location: 'System32',
      required: true,
      redistributable: true,
      alreadyInstalled: false
    },
    {
      name: 'OLE Automation',
      fileName: 'oleaut32.dll',
      version: '5.0.4522.0',
      location: 'System32',
      required: true,
      redistributable: true,
      alreadyInstalled: true
    },
    {
      name: 'Microsoft DAO 3.60',
      fileName: 'dao360.dll',
      version: '3.6.0.0',
      location: 'Common Files\\Microsoft Shared\\DAO',
      required: false,
      redistributable: true,
      alreadyInstalled: false
    },
    {
      name: 'ADO 2.8',
      fileName: 'msado15.dll',
      version: '2.8.0.0',
      location: 'Common Files\\System\\ADO',
      required: false,
      redistributable: true,
      alreadyInstalled: false
    },
    {
      name: 'Microsoft Common Controls 6.0',
      fileName: 'mscomctl.ocx',
      version: '6.1.95.45',
      location: 'System32',
      required: false,
      redistributable: true,
      alreadyInstalled: false
    }
  ];

  // Analyze project files and dependencies
  const analyzeProject = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create application files list
    const appFiles: FileInfo[] = projectFiles.map(file => ({
      fileName: file.name,
      path: file.path,
      size: Math.floor(Math.random() * 100000) + 1000,
      version: '1.0.0',
      date: new Date(),
      attributes: 'Archive',
      selected: true,
      required: file.type === 'exe' || file.type === 'dll',
      shared: false,
      selfRegistering: file.type === 'dll' || file.type === 'ocx',
      destination: '',
      targetDirectory: file.type === 'exe' ? '' : 'System32'
    }));

    // Add runtime files
    appFiles.push({
      fileName: `${projectName}.exe`,
      path: `${projectPath}\\${projectName}.exe`,
      size: Math.floor(Math.random() * 500000) + 50000,
      version: packageConfig.version,
      date: new Date(),
      attributes: 'Archive',
      selected: true,
      required: true,
      shared: false,
      selfRegistering: false,
      destination: '',
      targetDirectory: ''
    });

    // Determine dependencies based on project content
    const requiredDeps = [...standardDependencies];
    
    // Check for specific controls/components usage
    projectFiles.forEach(file => {
      if (file.name.includes('Data') || file.name.includes('DAO')) {
        const daoIndex = requiredDeps.findIndex(d => d.fileName === 'dao360.dll');
        if (daoIndex >= 0) requiredDeps[daoIndex].required = true;
      }
      
      if (file.name.includes('ADO') || file.name.includes('Recordset')) {
        const adoIndex = requiredDeps.findIndex(d => d.fileName === 'msado15.dll');
        if (adoIndex >= 0) requiredDeps[adoIndex].required = true;
      }
    });

    setAnalysisResults({
      applicationFiles: appFiles,
      dependencies: requiredDeps
    });
    
    setPackageConfig(prev => ({
      ...prev,
      applicationFiles: appFiles,
      dependencies: requiredDeps
    }));
    
    setIsAnalyzing(false);
  }, [projectFiles, projectPath, projectName, packageConfig.version]);

  // Build package
  const buildPackage = useCallback(async () => {
    setIsBuilding(true);
    setBuildProgress(0);
    
    const steps = [
      'Preparing files...',
      'Copying application files...',
      'Processing dependencies...',
      'Creating installation script...',
      'Compressing files...',
      'Generating setup executable...',
      'Finalizing package...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setBuildProgress((i / steps.length) * 100);
      eventEmitter.current.emit('buildProgress', { step: steps[i], progress: (i / steps.length) * 100 });
      
      // Simulate build time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setBuildProgress(100);
    setIsBuilding(false);
    
    // Complete the wizard
    onComplete?.(packageConfig);
    eventEmitter.current.emit('packageComplete', packageConfig);
    
  }, [packageConfig, onComplete]);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (currentStep < WizardStep.Finished) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > WizardStep.Welcome) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case WizardStep.PackageFolder:
        return packageConfig.name.length > 0;
      case WizardStep.IncludedFiles:
        return packageConfig.applicationFiles.some(f => f.selected);
      case WizardStep.Dependencies:
        return true;
      default:
        return true;
    }
  }, [currentStep, packageConfig]);

  // Initialize analysis when component mounts
  useEffect(() => {
    if (currentStep === WizardStep.IncludedFiles && !analysisResults && !isAnalyzing) {
      analyzeProject();
    }
  }, [currentStep, analysisResults, isAnalyzing, analyzeProject]);

  const renderWizardStep = (): React.ReactNode => {
    switch (currentStep) {
      case WizardStep.Welcome:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Package and Deployment Wizard</h2>
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              This wizard will help you create an installation package for your Visual Basic application.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left">
              <h3 className="font-medium text-blue-800 mb-2">What this wizard will do:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Analyze your application and its dependencies</li>
                <li>• Create a distribution package</li>
                <li>• Generate installation scripts</li>
                <li>• Build a setup executable</li>
              </ul>
            </div>
          </div>
        );

      case WizardStep.PackageType:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Package Type</h2>
            <p className="text-gray-600 mb-6">What type of package do you want to create?</p>
            
            <div className="space-y-4">
              {Object.values(PackageType).map(type => (
                <label key={type} className="flex items-start gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="packageType"
                    value={type}
                    checked={packageConfig.packageType === type}
                    onChange={(e) => setPackageConfig(prev => ({ ...prev, packageType: e.target.value as PackageType }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{type}</div>
                    <div className="text-sm text-gray-600">
                      {type === PackageType.StandardSetup && 'Creates a standard Windows installation package'}
                      {type === PackageType.InternetPackage && 'Creates a web-deployable package for internet distribution'}
                      {type === PackageType.DependencyFile && 'Creates a dependency file for component distribution'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case WizardStep.PackageFolder:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Package Information</h2>
            <p className="text-gray-600 mb-6">Enter information about your package:</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                <input
                  type="text"
                  value={packageConfig.name}
                  onChange={(e) => setPackageConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={packageConfig.description}
                  onChange={(e) => setPackageConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={packageConfig.version}
                    onChange={(e) => setPackageConfig(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={packageConfig.company}
                    onChange={(e) => setPackageConfig(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case WizardStep.IncludedFiles:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Included Files</h2>
            <p className="text-gray-600 mb-4">Select the files to include in your package:</p>
            
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Analyzing project files...</p>
                </div>
              </div>
            ) : analysisResults ? (
              <div className="border border-gray-200 rounded">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Application Files</span>
                    <span className="text-sm text-gray-600">
                      {packageConfig.applicationFiles.filter(f => f.selected).length} of {packageConfig.applicationFiles.length} selected
                    </span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {packageConfig.applicationFiles.map((file, index) => (
                    <div key={index} className="px-4 py-2 border-b border-gray-200 hover:bg-gray-50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={file.selected}
                          onChange={(e) => {
                            const updated = [...packageConfig.applicationFiles];
                            updated[index].selected = e.target.checked;
                            setPackageConfig(prev => ({ ...prev, applicationFiles: updated }));
                          }}
                          disabled={file.required}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{file.fileName}</div>
                          <div className="text-xs text-gray-600">
                            {file.path} • {(file.size / 1024).toFixed(1)} KB
                            {file.required && ' • Required'}
                            {file.selfRegistering && ' • Self-registering'}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );

      case WizardStep.Dependencies:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Dependencies</h2>
            <p className="text-gray-600 mb-4">Review and select the runtime dependencies for your application:</p>
            
            <div className="border border-gray-200 rounded">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="font-medium text-sm">Runtime Dependencies</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {packageConfig.dependencies.map((dep, index) => (
                  <div key={index} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dep.required}
                        onChange={(e) => {
                          const updated = [...packageConfig.dependencies];
                          updated[index].required = e.target.checked;
                          setPackageConfig(prev => ({ ...prev, dependencies: updated }));
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{dep.name}</div>
                        <div className="text-xs text-gray-600 mb-1">
                          {dep.fileName} • Version {dep.version}
                        </div>
                        <div className="text-xs text-gray-500">
                          Location: {dep.location}
                          {dep.alreadyInstalled && ' • Already installed'}
                          {dep.redistributable && ' • Redistributable'}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Dependencies marked as "Already installed" will only be included if the target system doesn't have them.
              </p>
            </div>
          </div>
        );

      case WizardStep.InstallSettings:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Installation Settings</h2>
            <p className="text-gray-600 mb-6">Configure installation options:</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Installation Location</label>
                <input
                  type="text"
                  value={packageConfig.installLocation}
                  onChange={(e) => setPackageConfig(prev => ({ ...prev, installLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Installation Media</label>
                <div className="space-y-2">
                  {Object.values(InstallationMedia).map(media => (
                    <label key={media} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="installationMedia"
                        value={media}
                        checked={packageConfig.installationMedia === media}
                        onChange={(e) => setPackageConfig(prev => ({ ...prev, installationMedia: e.target.value as InstallationMedia }))}
                      />
                      <span className="text-sm">{media}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Installation Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageConfig.createUninstaller}
                      onChange={(e) => setPackageConfig(prev => ({ ...prev, createUninstaller: e.target.checked }))}
                    />
                    <span className="text-sm">Create uninstaller</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageConfig.overwriteExistingFiles}
                      onChange={(e) => setPackageConfig(prev => ({ ...prev, overwriteExistingFiles: e.target.checked }))}
                    />
                    <span className="text-sm">Overwrite existing files</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageConfig.installOnlyNewerFiles}
                      onChange={(e) => setPackageConfig(prev => ({ ...prev, installOnlyNewerFiles: e.target.checked }))}
                    />
                    <span className="text-sm">Install only newer files</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageConfig.compression}
                      onChange={(e) => setPackageConfig(prev => ({ ...prev, compression: e.target.checked }))}
                    />
                    <span className="text-sm">Use compression</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageConfig.requiresReboot}
                      onChange={(e) => setPackageConfig(prev => ({ ...prev, requiresReboot: e.target.checked }))}
                    />
                    <span className="text-sm">Requires system reboot</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageConfig.silentInstall}
                      onChange={(e) => setPackageConfig(prev => ({ ...prev, silentInstall: e.target.checked }))}
                    />
                    <span className="text-sm">Support silent installation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case WizardStep.StartMenuItems:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Start Menu Items</h2>
            <p className="text-gray-600 mb-6">Configure Start Menu shortcuts and program groups:</p>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={packageConfig.createStartMenuShortcuts}
                    onChange={(e) => setPackageConfig(prev => ({ ...prev, createStartMenuShortcuts: e.target.checked }))}
                  />
                  <span className="font-medium">Create Start Menu shortcuts</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={packageConfig.createDesktopShortcut}
                    onChange={(e) => setPackageConfig(prev => ({ ...prev, createDesktopShortcut: e.target.checked }))}
                  />
                  <span className="font-medium">Create Desktop shortcut</span>
                </label>
              </div>
              
              {packageConfig.createStartMenuShortcuts && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Shortcuts</h3>
                  <div className="border border-gray-200 rounded">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <span className="text-sm font-medium">Program Shortcuts</span>
                    </div>
                    <div className="p-4">
                      {packageConfig.script.shortcuts.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-4">No shortcuts defined</p>
                          <button
                            onClick={() => {
                              const newShortcut = {
                                name: packageConfig.name,
                                target: `${packageConfig.installLocation}\\${packageConfig.name}.exe`,
                                location: 'Start Menu',
                                workingDir: packageConfig.installLocation,
                                arguments: '',
                                icon: ''
                              };
                              setPackageConfig(prev => ({
                                ...prev,
                                script: {
                                  ...prev.script,
                                  shortcuts: [...prev.script.shortcuts, newShortcut]
                                }
                              }));
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Add Shortcut
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {packageConfig.script.shortcuts.map((shortcut, index) => (
                            <div key={index} className="p-3 border border-gray-200 rounded">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={shortcut.name}
                                    onChange={(e) => {
                                      const updated = [...packageConfig.script.shortcuts];
                                      updated[index].name = e.target.value;
                                      setPackageConfig(prev => ({
                                        ...prev,
                                        script: { ...prev.script, shortcuts: updated }
                                      }));
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                  <select
                                    value={shortcut.location}
                                    onChange={(e) => {
                                      const updated = [...packageConfig.script.shortcuts];
                                      updated[index].location = e.target.value;
                                      setPackageConfig(prev => ({
                                        ...prev,
                                        script: { ...prev.script, shortcuts: updated }
                                      }));
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="Start Menu">Start Menu</option>
                                    <option value="Desktop">Desktop</option>
                                    <option value="Startup">Startup</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => {
                                    const updated = packageConfig.script.shortcuts.filter((_, i) => i !== index);
                                    setPackageConfig(prev => ({
                                      ...prev,
                                      script: { ...prev.script, shortcuts: updated }
                                    }));
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newShortcut = {
                                name: `${packageConfig.name} Shortcut`,
                                target: `${packageConfig.installLocation}\\${packageConfig.name}.exe`,
                                location: 'Start Menu',
                                workingDir: packageConfig.installLocation,
                                arguments: '',
                                icon: ''
                              };
                              setPackageConfig(prev => ({
                                ...prev,
                                script: {
                                  ...prev.script,
                                  shortcuts: [...prev.script.shortcuts, newShortcut]
                                }
                              }));
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          >
                            Add Shortcut
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case WizardStep.InstallLocation:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Installation Location</h2>
            <p className="text-gray-600 mb-6">Specify where files will be installed:</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Installation Directory</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={packageConfig.installLocation}
                    onChange={(e) => setPackageConfig(prev => ({ ...prev, installLocation: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                    Browse...
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">File Destinations</h3>
                <div className="border border-gray-200 rounded">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-700">
                      <span>File</span>
                      <span>Destination</span>
                      <span>Target Directory</span>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {packageConfig.applicationFiles.filter(f => f.selected).map((file, index) => (
                      <div key={index} className="px-4 py-2 border-b border-gray-200 hover:bg-gray-50">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <span className="truncate">{file.fileName}</span>
                          <select
                            value={file.destination}
                            onChange={(e) => {
                              const updated = [...packageConfig.applicationFiles];
                              const fileIndex = updated.findIndex(f => f.fileName === file.fileName);
                              if (fileIndex >= 0) {
                                updated[fileIndex].destination = e.target.value;
                                setPackageConfig(prev => ({ ...prev, applicationFiles: updated }));
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="">Application Directory</option>
                            <option value="System32">System32</option>
                            <option value="Windows">Windows</option>
                            <option value="CommonFiles">Common Files</option>
                            <option value="Fonts">Fonts</option>
                          </select>
                          <input
                            type="text"
                            value={file.targetDirectory}
                            onChange={(e) => {
                              const updated = [...packageConfig.applicationFiles];
                              const fileIndex = updated.findIndex(f => f.fileName === file.fileName);
                              if (fileIndex >= 0) {
                                updated[fileIndex].targetDirectory = e.target.value;
                                setPackageConfig(prev => ({ ...prev, applicationFiles: updated }));
                              }
                            }}
                            placeholder="Custom path..."
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case WizardStep.SharedFiles:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Shared Files</h2>
            <p className="text-gray-600 mb-6">Configure shared file settings and registry entries:</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Shared Files</h3>
                <div className="border border-gray-200 rounded">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <span className="text-sm font-medium">Files marked as shared</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {packageConfig.applicationFiles.filter(f => f.selected && f.shared).length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-600">
                        No shared files detected
                      </div>
                    ) : (
                      packageConfig.applicationFiles.filter(f => f.selected && f.shared).map((file, index) => (
                        <div key={index} className="px-4 py-2 border-b border-gray-200">
                          <div className="text-sm">{file.fileName}</div>
                          <div className="text-xs text-gray-600">{file.path}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Registry Entries</h3>
                <div className="border border-gray-200 rounded">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Custom Registry Entries</span>
                      <button
                        onClick={() => {
                          const newEntry = {
                            hive: 'HKEY_LOCAL_MACHINE',
                            key: `SOFTWARE\\${packageConfig.company || 'Company'}\\${packageConfig.name}`,
                            value: 'Version',
                            data: packageConfig.version,
                            type: 'REG_SZ'
                          };
                          setPackageConfig(prev => ({
                            ...prev,
                            script: {
                              ...prev.script,
                              registryEntries: [...prev.script.registryEntries, newEntry]
                            }
                          }));
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      >
                        Add Entry
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {packageConfig.script.registryEntries.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-600">
                        No custom registry entries
                      </div>
                    ) : (
                      packageConfig.script.registryEntries.map((entry, index) => (
                        <div key={index} className="p-3 border-b border-gray-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block font-medium text-gray-700 mb-1">Hive</label>
                              <select
                                value={entry.hive}
                                onChange={(e) => {
                                  const updated = [...packageConfig.script.registryEntries];
                                  updated[index].hive = e.target.value;
                                  setPackageConfig(prev => ({
                                    ...prev,
                                    script: { ...prev.script, registryEntries: updated }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="HKEY_LOCAL_MACHINE">HKEY_LOCAL_MACHINE</option>
                                <option value="HKEY_CURRENT_USER">HKEY_CURRENT_USER</option>
                                <option value="HKEY_CLASSES_ROOT">HKEY_CLASSES_ROOT</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={entry.type}
                                onChange={(e) => {
                                  const updated = [...packageConfig.script.registryEntries];
                                  updated[index].type = e.target.value;
                                  setPackageConfig(prev => ({
                                    ...prev,
                                    script: { ...prev.script, registryEntries: updated }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="REG_SZ">REG_SZ (String)</option>
                                <option value="REG_DWORD">REG_DWORD (Number)</option>
                                <option value="REG_BINARY">REG_BINARY (Binary)</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block font-medium text-gray-700 mb-1">Key</label>
                              <input
                                type="text"
                                value={entry.key}
                                onChange={(e) => {
                                  const updated = [...packageConfig.script.registryEntries];
                                  updated[index].key = e.target.value;
                                  setPackageConfig(prev => ({
                                    ...prev,
                                    script: { ...prev.script, registryEntries: updated }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block font-medium text-gray-700 mb-1">Value</label>
                              <input
                                type="text"
                                value={entry.value}
                                onChange={(e) => {
                                  const updated = [...packageConfig.script.registryEntries];
                                  updated[index].value = e.target.value;
                                  setPackageConfig(prev => ({
                                    ...prev,
                                    script: { ...prev.script, registryEntries: updated }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block font-medium text-gray-700 mb-1">Data</label>
                              <input
                                type="text"
                                value={entry.data}
                                onChange={(e) => {
                                  const updated = [...packageConfig.script.registryEntries];
                                  updated[index].data = e.target.value;
                                  setPackageConfig(prev => ({
                                    ...prev,
                                    script: { ...prev.script, registryEntries: updated }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => {
                                const updated = packageConfig.script.registryEntries.filter((_, i) => i !== index);
                                setPackageConfig(prev => ({
                                  ...prev,
                                  script: { ...prev.script, registryEntries: updated }
                                }));
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case WizardStep.Finished:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Ready to Build Package</h2>
            <p className="text-gray-600 mb-6">Review your package configuration:</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Package Name:</strong> {packageConfig.name}
                </div>
                <div>
                  <strong>Version:</strong> {packageConfig.version}
                </div>
                <div>
                  <strong>Type:</strong> {packageConfig.packageType}
                </div>
                <div>
                  <strong>Files:</strong> {packageConfig.applicationFiles.filter(f => f.selected).length}
                </div>
                <div>
                  <strong>Dependencies:</strong> {packageConfig.dependencies.filter(d => d.required).length}
                </div>
                <div>
                  <strong>Install Location:</strong> {packageConfig.installLocation}
                </div>
              </div>
            </div>
            
            {isBuilding ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-800 mb-2">Building Package...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${buildProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{buildProgress.toFixed(0)}% complete</p>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={buildPackage}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Build Package
                </button>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Package and Deployment Wizard</h1>
            <p className="text-sm text-gray-600 mt-1">Project: {projectName}</p>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          {Array.from({ length: Object.keys(WizardStep).length / 2 }, (_, i) => (
            <React.Fragment key={i}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
              {i < Object.keys(WizardStep).length / 2 - 1 && (
                <div
                  className={`h-1 w-12 ${
                    i < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderWizardStep()}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === WizardStep.Welcome}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            
            {currentStep < WizardStep.Finished ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDeploymentWizard;