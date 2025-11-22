/**
 * VB6 Package & Deployment Wizard - Complete Application Packaging System
 * Provides comprehensive application packaging, dependency analysis, and deployment functionality
 * Compatible with VB6 Package & Deployment Wizard for creating installation packages
 */

export enum PackageType {
  STANDARD_SETUP = 'standard_setup',
  INTERNET_PACKAGE = 'internet_package',
  DEPENDENCY_FILE = 'dependency_file',
  CAB_FILE = 'cab_file',
  MSI_INSTALLER = 'msi_installer',
  XCOPY_DEPLOYMENT = 'xcopy_deployment'
}

export enum DistributionMedia {
  FLOPPY_DISK = 'floppy_disk',
  CD_ROM = 'cd_rom',
  DVD = 'dvd',
  NETWORK_SHARE = 'network_share',
  WEB_DOWNLOAD = 'web_download',
  SINGLE_FILE = 'single_file'
}

export enum ComponentType {
  EXECUTABLE = 'executable',
  LIBRARY = 'library',
  OCX_CONTROL = 'ocx_control',
  DLL_FILE = 'dll_file',
  TYPE_LIBRARY = 'type_library',
  DATA_FILE = 'data_file',
  REGISTRY_ENTRY = 'registry_entry',
  SHORTCUT = 'shortcut',
  FONT = 'font',
  HELP_FILE = 'help_file'
}

export enum InstallLocation {
  WINDOWS_SYSTEM = 'windows_system',
  WINDOWS_SYSTEM32 = 'windows_system32',
  PROGRAM_FILES = 'program_files',
  APPLICATION_FOLDER = 'application_folder',
  COMMON_FILES = 'common_files',
  FONTS_FOLDER = 'fonts_folder',
  TEMP_FOLDER = 'temp_folder',
  CUSTOM_PATH = 'custom_path'
}

export enum RegistryRoot {
  HKEY_CLASSES_ROOT = 'HKEY_CLASSES_ROOT',
  HKEY_CURRENT_USER = 'HKEY_CURRENT_USER',
  HKEY_LOCAL_MACHINE = 'HKEY_LOCAL_MACHINE',
  HKEY_USERS = 'HKEY_USERS',
  HKEY_CURRENT_CONFIG = 'HKEY_CURRENT_CONFIG'
}

export interface PackageProject {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  
  // Project info
  sourceProject: string;
  outputFolder: string;
  packageType: PackageType;
  distributionMedia: DistributionMedia;
  
  // Application info
  applicationName: string;
  applicationVersion: string;
  companyName: string;
  copyrightInfo: string;
  productName: string;
  
  // Files and dependencies
  files: PackageFile[];
  dependencies: PackageDependency[];
  registryEntries: RegistryEntry[];
  shortcuts: ShortcutEntry[];
  
  // Installation options
  installLocation: InstallLocation;
  customInstallPath?: string;
  createUninstaller: boolean;
  requireRestart: boolean;
  runAfterInstall: boolean;
  
  // Distribution options
  compressionLevel: number;
  passwordProtected: boolean;
  digitalSignature: boolean;
  
  // Metadata
  created: Date;
  modified: Date;
  lastBuilt?: Date;
  buildCount: number;
  
  // Advanced options
  supportedPlatforms: string[];
  minimumWindowsVersion: string;
  requiredSpace: number; // in KB
  settings: Map<string, any>;
}

export interface PackageFile {
  id: string;
  sourcePath: string;
  targetPath: string;
  fileName: string;
  fileSize: number;
  fileVersion?: string;
  description?: string;
  type: ComponentType;
  location: InstallLocation;
  customPath?: string;
  
  // Properties
  shared: boolean;
  system: boolean;
  readonly: boolean;
  hidden: boolean;
  compress: boolean;
  register: boolean;
  
  // Version info
  checkVersion: boolean;
  versionConflict: 'newer' | 'older' | 'same' | 'ignore';
  
  // Dependencies
  dependencies: string[];
  
  created: Date;
  modified: Date;
}

export interface PackageDependency {
  id: string;
  name: string;
  fileName: string;
  version?: string;
  type: ComponentType;
  source: string;
  
  // Requirements
  required: boolean;
  downloadUrl?: string;
  redistributable: boolean;
  
  // Installation
  installLocation: InstallLocation;
  registerComponent: boolean;
  
  // Detection
  detectionMethod: 'file' | 'registry' | 'version';
  detectionPath: string;
  detectionValue?: string;
  
  status: 'missing' | 'found' | 'outdated' | 'unknown';
  installedVersion?: string;
  recommendedVersion?: string;
}

export interface RegistryEntry {
  id: string;
  root: RegistryRoot;
  keyPath: string;
  valueName: string;
  valueData: string;
  valueType: 'string' | 'dword' | 'binary' | 'multi_string';
  
  // Options
  createKey: boolean;
  overwriteValue: boolean;
  removeOnUninstall: boolean;
  
  description?: string;
  created: Date;
}

export interface ShortcutEntry {
  id: string;
  name: string;
  targetPath: string;
  arguments?: string;
  workingDirectory?: string;
  iconPath?: string;
  iconIndex?: number;
  description?: string;
  
  // Location
  location: 'desktop' | 'start_menu' | 'programs' | 'startup' | 'custom';
  customPath?: string;
  
  // Options
  runMinimized: boolean;
  runMaximized: boolean;
  
  created: Date;
}

export interface BuildResult {
  success: boolean;
  packagePath?: string;
  setupSize: number;
  errors: string[];
  warnings: string[];
  buildTime: number;
  filesIncluded: number;
  dependenciesResolved: number;
  compressionRatio: number;
}

export interface DeploymentTarget {
  id: string;
  name: string;
  type: 'ftp' | 'web' | 'network' | 'cd' | 'custom';
  
  // Connection info
  serverUrl?: string;
  username?: string;
  password?: string;
  remotePath?: string;
  
  // Options
  testConnection: boolean;
  overwriteExisting: boolean;
  createBackup: boolean;
  
  created: Date;
  lastDeployed?: Date;
  deployCount: number;
}

export class VB6PackageWizard {
  private static instance: VB6PackageWizard;
  private projects: Map<string, PackageProject> = new Map();
  private templates: Map<string, Partial<PackageProject>> = new Map();
  private deploymentTargets: Map<string, DeploymentTarget> = new Map();
  private currentProject: PackageProject | null = null;
  private isInitialized: boolean = false;

  static getInstance(): VB6PackageWizard {
    if (!VB6PackageWizard.instance) {
      VB6PackageWizard.instance = new VB6PackageWizard();
    }
    return VB6PackageWizard.instance;
  }

  constructor() {
    this.initializePackageWizard();
  }

  private initializePackageWizard(): void {
    this.createBuiltInTemplates();
    this.createSampleProject();
    this.isInitialized = true;
  }

  private createBuiltInTemplates(): void {
    // Standard Setup Template
    this.templates.set('standard-setup', {
      name: 'Standard Setup Package',
      packageType: PackageType.STANDARD_SETUP,
      distributionMedia: DistributionMedia.CD_ROM,
      createUninstaller: true,
      compressionLevel: 6,
      installLocation: InstallLocation.PROGRAM_FILES,
      supportedPlatforms: ['Windows 95', 'Windows 98', 'Windows NT', 'Windows 2000', 'Windows XP'],
      minimumWindowsVersion: '4.0',
      settings: new Map([
        ['CreateStartMenuEntry', true],
        ['CreateDesktopShortcut', true],
        ['CheckDiskSpace', true],
        ['ShowProgress', true]
      ])
    });

    // Internet Package Template
    this.templates.set('internet-package', {
      name: 'Internet Download Package',
      packageType: PackageType.INTERNET_PACKAGE,
      distributionMedia: DistributionMedia.WEB_DOWNLOAD,
      createUninstaller: false,
      compressionLevel: 9,
      installLocation: InstallLocation.APPLICATION_FOLDER,
      settings: new Map([
        ['CreateCABFiles', true],
        ['SignCABFiles', false],
        ['CompressFiles', true],
        ['DownloadSupport', true]
      ])
    });

    // XCOPY Deployment Template
    this.templates.set('xcopy-deployment', {
      name: 'XCOPY Deployment',
      packageType: PackageType.XCOPY_DEPLOYMENT,
      distributionMedia: DistributionMedia.NETWORK_SHARE,
      createUninstaller: false,
      compressionLevel: 0,
      installLocation: InstallLocation.APPLICATION_FOLDER,
      settings: new Map([
        ['CopyOnly', true],
        ['NoRegistration', true],
        ['PortableApp', true]
      ])
    });
  }

  private createSampleProject(): void {
    const sampleProject: PackageProject = {
      id: 'sample-project',
      name: 'SampleApp',
      displayName: 'Sample Application Package',
      description: 'Sample VB6 application deployment package',
      version: '1.0.0',
      sourceProject: 'C:\\VB6Projects\\SampleApp\\SampleApp.vbp',
      outputFolder: 'C:\\VB6Projects\\SampleApp\\Package',
      packageType: PackageType.STANDARD_SETUP,
      distributionMedia: DistributionMedia.CD_ROM,
      applicationName: 'Sample Application',
      applicationVersion: '1.0.0',
      companyName: 'Sample Company',
      copyrightInfo: 'Copyright © 2002 Sample Company',
      productName: 'Sample Product Suite',
      files: [
        {
          id: 'main-exe',
          sourcePath: 'C:\\VB6Projects\\SampleApp\\SampleApp.exe',
          targetPath: '[APPDIR]\\SampleApp.exe',
          fileName: 'SampleApp.exe',
          fileSize: 245760,
          fileVersion: '1.0.0.0',
          description: 'Sample Application Executable',
          type: ComponentType.EXECUTABLE,
          location: InstallLocation.APPLICATION_FOLDER,
          shared: false,
          system: false,
          readonly: false,
          hidden: false,
          compress: true,
          register: false,
          checkVersion: true,
          versionConflict: 'newer',
          dependencies: ['vb6runtime', 'msvbvm60.dll'],
          created: new Date('2002-01-01'),
          modified: new Date()
        },
        {
          id: 'config-file',
          sourcePath: 'C:\\VB6Projects\\SampleApp\\config.ini',
          targetPath: '[APPDIR]\\config.ini',
          fileName: 'config.ini',
          fileSize: 1024,
          description: 'Application Configuration File',
          type: ComponentType.DATA_FILE,
          location: InstallLocation.APPLICATION_FOLDER,
          shared: false,
          system: false,
          readonly: false,
          hidden: false,
          compress: true,
          register: false,
          checkVersion: false,
          versionConflict: 'ignore',
          dependencies: [],
          created: new Date('2002-01-01'),
          modified: new Date()
        }
      ],
      dependencies: [
        {
          id: 'vb6-runtime',
          name: 'Visual Basic 6.0 Runtime',
          fileName: 'msvbvm60.dll',
          version: '6.0.81.69',
          type: ComponentType.LIBRARY,
          source: 'System\\VB6Runtime',
          required: true,
          redistributable: true,
          installLocation: InstallLocation.WINDOWS_SYSTEM32,
          registerComponent: true,
          detectionMethod: 'file',
          detectionPath: 'System32\\msvbvm60.dll',
          status: 'found',
          installedVersion: '6.0.81.69',
          recommendedVersion: '6.0.81.69'
        },
        {
          id: 'oleaut32',
          name: 'OLE Automation',
          fileName: 'oleaut32.dll',
          version: '2.40.4277.1',
          type: ComponentType.LIBRARY,
          source: 'System\\OLEAutomation',
          required: true,
          redistributable: true,
          installLocation: InstallLocation.WINDOWS_SYSTEM32,
          registerComponent: true,
          detectionMethod: 'file',
          detectionPath: 'System32\\oleaut32.dll',
          status: 'found',
          installedVersion: '2.40.4277.1',
          recommendedVersion: '2.40.4277.1'
        }
      ],
      registryEntries: [
        {
          id: 'app-install-path',
          root: RegistryRoot.HKEY_LOCAL_MACHINE,
          keyPath: 'SOFTWARE\\Sample Company\\Sample Application',
          valueName: 'InstallPath',
          valueData: '[APPDIR]',
          valueType: 'string',
          createKey: true,
          overwriteValue: true,
          removeOnUninstall: true,
          description: 'Application installation path',
          created: new Date()
        },
        {
          id: 'app-version',
          root: RegistryRoot.HKEY_LOCAL_MACHINE,
          keyPath: 'SOFTWARE\\Sample Company\\Sample Application',
          valueName: 'Version',
          valueData: '1.0.0',
          valueType: 'string',
          createKey: false,
          overwriteValue: true,
          removeOnUninstall: true,
          description: 'Application version',
          created: new Date()
        }
      ],
      shortcuts: [
        {
          id: 'desktop-shortcut',
          name: 'Sample Application',
          targetPath: '[APPDIR]\\SampleApp.exe',
          description: 'Launch Sample Application',
          location: 'desktop',
          runMinimized: false,
          runMaximized: false,
          created: new Date()
        },
        {
          id: 'start-menu-shortcut',
          name: 'Sample Application',
          targetPath: '[APPDIR]\\SampleApp.exe',
          description: 'Sample Application',
          location: 'start_menu',
          customPath: 'Sample Company\\Sample Application',
          runMinimized: false,
          runMaximized: false,
          created: new Date()
        }
      ],
      installLocation: InstallLocation.PROGRAM_FILES,
      customInstallPath: 'Sample Company\\Sample Application',
      createUninstaller: true,
      requireRestart: false,
      runAfterInstall: true,
      compressionLevel: 6,
      passwordProtected: false,
      digitalSignature: false,
      created: new Date('2002-01-01'),
      modified: new Date(),
      buildCount: 0,
      supportedPlatforms: ['Windows 95', 'Windows 98', 'Windows NT 4.0', 'Windows 2000', 'Windows XP'],
      minimumWindowsVersion: '4.0',
      requiredSpace: 2048,
      settings: new Map([
        ['CreateStartMenuEntry', true],
        ['CreateDesktopShortcut', true],
        ['ShowSplashScreen', false],
        ['AllowCustomInstallPath', true],
        ['CheckForUpdates', false]
      ])
    };

    this.projects.set(sampleProject.id, sampleProject);
    this.currentProject = sampleProject;
  }

  // Project Management
  createProject(name: string, templateId?: string): PackageProject {
    const template = templateId ? this.templates.get(templateId) : null;
    
    const project: PackageProject = {
      id: `project-${Date.now()}`,
      name,
      displayName: name,
      description: '',
      version: '1.0.0',
      sourceProject: '',
      outputFolder: '',
      packageType: PackageType.STANDARD_SETUP,
      distributionMedia: DistributionMedia.CD_ROM,
      applicationName: name,
      applicationVersion: '1.0.0',
      companyName: '',
      copyrightInfo: '',
      productName: '',
      files: [],
      dependencies: [],
      registryEntries: [],
      shortcuts: [],
      installLocation: InstallLocation.PROGRAM_FILES,
      createUninstaller: true,
      requireRestart: false,
      runAfterInstall: false,
      compressionLevel: 6,
      passwordProtected: false,
      digitalSignature: false,
      created: new Date(),
      modified: new Date(),
      buildCount: 0,
      supportedPlatforms: ['Windows 95', 'Windows 98', 'Windows NT', 'Windows 2000', 'Windows XP'],
      minimumWindowsVersion: '4.0',
      requiredSpace: 1024,
      settings: new Map(),
      ...template
    };

    this.projects.set(project.id, project);
    this.currentProject = project;
    return project;
  }

  openProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (project) {
      this.currentProject = project;
      return true;
    }
    return false;
  }

  saveProject(projectId?: string): boolean {
    const project = projectId ? this.projects.get(projectId) : this.currentProject;
    if (project) {
      project.modified = new Date();
      if (process.env.NODE_ENV === 'development') { console.log(`Saved packaging project: ${project.name}`); }
      return true;
    }
    return false;
  }

  deleteProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (project) {
      this.projects.delete(projectId);
      if (this.currentProject?.id === projectId) {
        this.currentProject = null;
      }
      return true;
    }
    return false;
  }

  getCurrentProject(): PackageProject | null {
    return this.currentProject;
  }

  getAllProjects(): PackageProject[] {
    return Array.from(this.projects.values());
  }

  // File Management
  addFile(file: Omit<PackageFile, 'id' | 'created' | 'modified'>): PackageFile {
    if (!this.currentProject) {
      throw new Error('No project is currently open');
    }

    const newFile: PackageFile = {
      ...file,
      id: `file-${Date.now()}`,
      created: new Date(),
      modified: new Date()
    };

    this.currentProject.files.push(newFile);
    this.currentProject.modified = new Date();
    return newFile;
  }

  removeFile(fileId: string): boolean {
    if (!this.currentProject) return false;

    const fileIndex = this.currentProject.files.findIndex(f => f.id === fileId);
    if (fileIndex >= 0) {
      this.currentProject.files.splice(fileIndex, 1);
      this.currentProject.modified = new Date();
      return true;
    }
    return false;
  }

  updateFile(fileId: string, updates: Partial<PackageFile>): boolean {
    if (!this.currentProject) return false;

    const file = this.currentProject.files.find(f => f.id === fileId);
    if (file) {
      Object.assign(file, updates);
      file.modified = new Date();
      this.currentProject.modified = new Date();
      return true;
    }
    return false;
  }

  // Dependency Analysis
  async analyzeDependencies(projectPath: string): Promise<PackageDependency[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') { console.log(`Analyzing dependencies for: ${projectPath}`); }
        
        // Simulate dependency analysis
        const dependencies: PackageDependency[] = [
          {
            id: 'vb6-runtime-detected',
            name: 'Visual Basic 6.0 Runtime',
            fileName: 'msvbvm60.dll',
            version: '6.0.81.69',
            type: ComponentType.LIBRARY,
            source: 'System\\VB6Runtime',
            required: true,
            redistributable: true,
            installLocation: InstallLocation.WINDOWS_SYSTEM32,
            registerComponent: true,
            detectionMethod: 'file',
            detectionPath: 'System32\\msvbvm60.dll',
            status: 'found',
            installedVersion: '6.0.81.69',
            recommendedVersion: '6.0.81.69'
          },
          {
            id: 'mscomctl-detected',
            name: 'Microsoft Common Controls',
            fileName: 'mscomctl.ocx',
            version: '6.0.81.69',
            type: ComponentType.OCX_CONTROL,
            source: 'Controls\\CommonControls',
            required: false,
            redistributable: true,
            installLocation: InstallLocation.WINDOWS_SYSTEM32,
            registerComponent: true,
            detectionMethod: 'registry',
            detectionPath: 'HKEY_CLASSES_ROOT\\CLSID\\{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}',
            status: 'missing',
            recommendedVersion: '6.0.81.69'
          }
        ];

        if (this.currentProject) {
          this.currentProject.dependencies = dependencies;
          this.currentProject.modified = new Date();
        }

        resolve(dependencies);
      }, 1500);
    });
  }

  addDependency(dependency: Omit<PackageDependency, 'id'>): PackageDependency {
    if (!this.currentProject) {
      throw new Error('No project is currently open');
    }

    const newDependency: PackageDependency = {
      ...dependency,
      id: `dep-${Date.now()}`
    };

    this.currentProject.dependencies.push(newDependency);
    this.currentProject.modified = new Date();
    return newDependency;
  }

  removeDependency(dependencyId: string): boolean {
    if (!this.currentProject) return false;

    const depIndex = this.currentProject.dependencies.findIndex(d => d.id === dependencyId);
    if (depIndex >= 0) {
      this.currentProject.dependencies.splice(depIndex, 1);
      this.currentProject.modified = new Date();
      return true;
    }
    return false;
  }

  // Registry and Shortcuts
  addRegistryEntry(entry: Omit<RegistryEntry, 'id' | 'created'>): RegistryEntry {
    if (!this.currentProject) {
      throw new Error('No project is currently open');
    }

    const newEntry: RegistryEntry = {
      ...entry,
      id: `reg-${Date.now()}`,
      created: new Date()
    };

    this.currentProject.registryEntries.push(newEntry);
    this.currentProject.modified = new Date();
    return newEntry;
  }

  addShortcut(shortcut: Omit<ShortcutEntry, 'id' | 'created'>): ShortcutEntry {
    if (!this.currentProject) {
      throw new Error('No project is currently open');
    }

    const newShortcut: ShortcutEntry = {
      ...shortcut,
      id: `shortcut-${Date.now()}`,
      created: new Date()
    };

    this.currentProject.shortcuts.push(newShortcut);
    this.currentProject.modified = new Date();
    return newShortcut;
  }

  // Build Process
  async buildPackage(projectId?: string): Promise<BuildResult> {
    const project = projectId ? this.projects.get(projectId) : this.currentProject;
    if (!project) {
      throw new Error('No project specified for building');
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') { console.log(`Building package: ${project.name}`); }
        if (process.env.NODE_ENV === 'development') { console.log(`Package type: ${project.packageType}`); }
        if (process.env.NODE_ENV === 'development') { console.log(`Output folder: ${project.outputFolder}`); }
        
        // Simulate build process
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Check for missing dependencies
        const missingDeps = project.dependencies.filter(dep => dep.status === 'missing' && dep.required);
        if (missingDeps.length > 0) {
          errors.push(`Missing required dependencies: ${missingDeps.map(d => d.name).join(', ')}`);
        }
        
        // Check for files
        if (project.files.length === 0) {
          errors.push('No files specified for packaging');
        }
        
        // Warnings for outdated dependencies
        const outdatedDeps = project.dependencies.filter(dep => dep.status === 'outdated');
        if (outdatedDeps.length > 0) {
          warnings.push(`Outdated dependencies found: ${outdatedDeps.map(d => d.name).join(', ')}`);
        }

        const buildTime = Date.now() - startTime;
        const success = errors.length === 0;
        
        if (success) {
          project.buildCount++;
          project.lastBuilt = new Date();
        }

        // Calculate package size and compression
        const totalSize = project.files.reduce((sum, file) => sum + file.fileSize, 0);
        const compressionRatio = project.compressionLevel > 0 ? 0.3 + (project.compressionLevel / 10 * 0.4) : 1.0;
        const setupSize = Math.floor(totalSize * compressionRatio);

        const result: BuildResult = {
          success,
          packagePath: success ? `${project.outputFolder}\\${project.name}Setup.exe` : undefined,
          setupSize,
          errors,
          warnings,
          buildTime,
          filesIncluded: project.files.length,
          dependenciesResolved: project.dependencies.filter(d => d.status === 'found').length,
          compressionRatio: 1 - compressionRatio
        };

        if (process.env.NODE_ENV === 'development') { console.log(`Build ${success ? 'completed' : 'failed'} in ${buildTime}ms`); }
        if (success && process.env.NODE_ENV === 'development') {
          console.log(`Package created: ${result.packagePath} (${(setupSize / 1024).toFixed(1)} KB)`);
        }

        resolve(result);
      }, 2000);
    });
  }

  // Deployment
  addDeploymentTarget(target: Omit<DeploymentTarget, 'id' | 'created' | 'deployCount'>): DeploymentTarget {
    const newTarget: DeploymentTarget = {
      ...target,
      id: `target-${Date.now()}`,
      created: new Date(),
      deployCount: 0
    };

    this.deploymentTargets.set(newTarget.id, newTarget);
    return newTarget;
  }

  async deployPackage(packagePath: string, targetId: string): Promise<boolean> {
    const target = this.deploymentTargets.get(targetId);
    if (!target) {
      throw new Error(`Deployment target ${targetId} not found`);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') { console.log(`Deploying package to: ${target.name}`); }
        if (process.env.NODE_ENV === 'development') { console.log(`Package: ${packagePath}`); }
        if (process.env.NODE_ENV === 'development') { console.log(`Target type: ${target.type}`); }
        
        // Simulate deployment
        target.lastDeployed = new Date();
        target.deployCount++;
        
        const success = Math.random() > 0.1; // 90% success rate
        if (process.env.NODE_ENV === 'development') { console.log(`Deployment ${success ? 'successful' : 'failed'}`); }
        
        resolve(success);
      }, 1500);
    });
  }

  getDeploymentTargets(): DeploymentTarget[] {
    return Array.from(this.deploymentTargets.values());
  }

  // Templates
  createTemplate(name: string, project: PackageProject): void {
    const template: Partial<PackageProject> = {
      packageType: project.packageType,
      distributionMedia: project.distributionMedia,
      installLocation: project.installLocation,
      createUninstaller: project.createUninstaller,
      compressionLevel: project.compressionLevel,
      supportedPlatforms: [...project.supportedPlatforms],
      minimumWindowsVersion: project.minimumWindowsVersion,
      settings: new Map(project.settings)
    };

    this.templates.set(name, template);
  }

  getTemplates(): Array<{ id: string; name: string; template: Partial<PackageProject> }> {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      name: template.name || id,
      template
    }));
  }

  // Statistics
  getPackageStats(): {
    totalProjects: number;
    totalBuilds: number;
    averagePackageSize: number;
    projectsByType: Map<PackageType, number>;
    dependencyStats: {
      totalDependencies: number;
      missingDependencies: number;
      outdatedDependencies: number;
    };
  } {
    const projects = this.getAllProjects();
    const stats = {
      totalProjects: projects.length,
      totalBuilds: projects.reduce((sum, p) => sum + p.buildCount, 0),
      averagePackageSize: 0,
      projectsByType: new Map<PackageType, number>(),
      dependencyStats: {
        totalDependencies: 0,
        missingDependencies: 0,
        outdatedDependencies: 0
      }
    };

    if (projects.length > 0) {
      let totalSize = 0;
      let totalDeps = 0;
      let missingDeps = 0;
      let outdatedDeps = 0;

      for (const project of projects) {
        // Count by type
        const typeCount = stats.projectsByType.get(project.packageType) || 0;
        stats.projectsByType.set(project.packageType, typeCount + 1);

        // Calculate sizes
        const projectSize = project.files.reduce((sum, file) => sum + file.fileSize, 0);
        totalSize += projectSize;

        // Count dependencies
        totalDeps += project.dependencies.length;
        missingDeps += project.dependencies.filter(d => d.status === 'missing').length;
        outdatedDeps += project.dependencies.filter(d => d.status === 'outdated').length;
      }

      stats.averagePackageSize = totalSize / projects.length;
      stats.dependencyStats.totalDependencies = totalDeps;
      stats.dependencyStats.missingDependencies = missingDeps;
      stats.dependencyStats.outdatedDependencies = outdatedDeps;
    }

    return stats;
  }

  // Utility Methods
  calculateRequiredSpace(projectId?: string): number {
    const project = projectId ? this.projects.get(projectId) : this.currentProject;
    if (!project) return 0;

    const fileSpace = project.files.reduce((sum, file) => sum + file.fileSize, 0);
    const dependencySpace = project.dependencies
      .filter(dep => dep.status === 'missing')
      .reduce((sum, dep) => sum + 1024, 0); // Estimate 1KB per dependency

    // Add 50% overhead for temporary files, registry, shortcuts, etc.
    return Math.floor((fileSpace + dependencySpace) * 1.5);
  }

  validateProject(projectId?: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const project = projectId ? this.projects.get(projectId) : this.currentProject;
    if (!project) {
      return { valid: false, errors: ['No project specified'], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!project.applicationName.trim()) {
      errors.push('Application name is required');
    }
    if (!project.applicationVersion.trim()) {
      errors.push('Application version is required');
    }
    if (project.files.length === 0) {
      errors.push('At least one file must be included in the package');
    }

    // Check dependencies
    const missingRequired = project.dependencies.filter(d => d.required && d.status === 'missing');
    if (missingRequired.length > 0) {
      errors.push(`Missing required dependencies: ${missingRequired.map(d => d.name).join(', ')}`);
    }

    const outdated = project.dependencies.filter(d => d.status === 'outdated');
    if (outdated.length > 0) {
      warnings.push(`Outdated dependencies detected: ${outdated.map(d => d.name).join(', ')}`);
    }

    // Check file conflicts
    const duplicateTargets = new Set<string>();
    const conflicts: string[] = [];
    for (const file of project.files) {
      if (duplicateTargets.has(file.targetPath)) {
        conflicts.push(file.targetPath);
      } else {
        duplicateTargets.add(file.targetPath);
      }
    }
    if (conflicts.length > 0) {
      errors.push(`Duplicate target paths: ${conflicts.join(', ')}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

// Global instance
export const VB6PackageWizardInstance = VB6PackageWizard.getInstance();

if (process.env.NODE_ENV === 'development') {
  console.log('VB6 Package & Deployment Wizard initialized with project templates and dependency analysis');
}