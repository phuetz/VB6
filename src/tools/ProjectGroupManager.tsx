import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Project Types
export enum ProjectType {
  StandardEXE = 'Standard EXE',
  ActiveXEXE = 'ActiveX EXE',
  ActiveXDLL = 'ActiveX DLL',
  ActiveXControl = 'ActiveX Control',
  ActiveXDocument = 'ActiveX Document DLL',
  ActiveXDocumentEXE = 'ActiveX Document EXE'
}

// Build Configuration
export enum BuildConfiguration {
  Debug = 'Debug',
  Release = 'Release',
  Custom = 'Custom'
}

// Project Status
export enum ProjectStatus {
  Loaded = 'Loaded',
  Modified = 'Modified',
  Building = 'Building',
  Error = 'Error',
  Unloaded = 'Unloaded'
}

// Project Dependencies
export interface ProjectDependency {
  projectId: string;
  projectName: string;
  type: 'project' | 'library' | 'com';
  version?: string;
  guid?: string;
}

// Build Order
export interface BuildOrder {
  projectId: string;
  order: number;
  dependencies: string[];
  canParallel: boolean;
}

// Project in Group
export interface GroupProject {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  status: ProjectStatus;
  isStartup: boolean;
  isActive: boolean;
  configuration: BuildConfiguration;
  lastBuildTime?: Date;
  lastBuildSuccess?: boolean;
  outputPath: string;
  dependencies: ProjectDependency[];
  references: Array<{
    name: string;
    guid: string;
    version: string;
    path: string;
  }>;
  components: Array<{
    name: string;
    type: 'form' | 'module' | 'class' | 'usercontrol' | 'resource';
    path: string;
  }>;
}

// Project Group
export interface ProjectGroup {
  id: string;
  name: string;
  path: string;
  projects: GroupProject[];
  buildOrder: BuildOrder[];
  configuration: BuildConfiguration;
  startupProject?: string;
  createdDate: Date;
  modifiedDate: Date;
  settings: {
    parallelBuild: boolean;
    stopOnFirstError: boolean;
    preBuildCommand?: string;
    postBuildCommand?: string;
    deployPath?: string;
  };
}

// Build Result
export interface BuildResult {
  projectId: string;
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  outputFile?: string;
}

// Group Operation
export enum GroupOperation {
  BuildAll = 'Build All',
  RebuildAll = 'Rebuild All',
  CleanAll = 'Clean All',
  DeployAll = 'Deploy All',
  RunStartup = 'Run Startup',
  DebugStartup = 'Debug Startup'
}

interface ProjectGroupManagerProps {
  onProjectOpen?: (project: GroupProject) => void;
  onGroupOperation?: (operation: GroupOperation, group: ProjectGroup) => void;
  onBuildComplete?: (results: BuildResult[]) => void;
}

export const ProjectGroupManager: React.FC<ProjectGroupManagerProps> = ({
  onProjectOpen,
  onGroupOperation,
  onBuildComplete
}) => {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(null);
  const [selectedProject, setSelectedProject] = useState<GroupProject | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResults, setBuildResults] = useState<BuildResult[]>([]);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [showBuildOrderDialog, setShowBuildOrderDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'projects' | 'dependencies' | 'build' | 'settings'>('projects');
  const [groupForm, setGroupForm] = useState({
    name: '',
    path: ''
  });
  const [projectForm, setProjectForm] = useState({
    name: '',
    path: '',
    type: ProjectType.StandardEXE
  });
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `item_${nextId.current++}`, []);

  // Sample project group
  const sampleGroup: ProjectGroup = {
    id: generateId(),
    name: 'Enterprise Application',
    path: 'C:\\Projects\\EnterpriseApp\\EnterpriseApp.vbg',
    projects: [
      {
        id: generateId(),
        name: 'MainApplication',
        path: 'C:\\Projects\\EnterpriseApp\\MainApp\\MainApp.vbp',
        type: ProjectType.StandardEXE,
        status: ProjectStatus.Loaded,
        isStartup: true,
        isActive: true,
        configuration: BuildConfiguration.Debug,
        outputPath: 'bin\\Debug\\MainApp.exe',
        dependencies: [
          {
            projectId: '2',
            projectName: 'BusinessLogic',
            type: 'project'
          },
          {
            projectId: '3',
            projectName: 'DataAccess',
            type: 'project'
          }
        ],
        references: [
          {
            name: 'Visual Basic For Applications',
            guid: '{000204EF-0000-0000-C000-000000000046}',
            version: '4.0',
            path: 'C:\\Windows\\System32\\vbe7.dll'
          }
        ],
        components: [
          { name: 'frmMain', type: 'form', path: 'Forms\\frmMain.frm' },
          { name: 'frmLogin', type: 'form', path: 'Forms\\frmLogin.frm' },
          { name: 'modGlobal', type: 'module', path: 'Modules\\modGlobal.bas' }
        ]
      },
      {
        id: generateId(),
        name: 'BusinessLogic',
        path: 'C:\\Projects\\EnterpriseApp\\BusinessLogic\\BusinessLogic.vbp',
        type: ProjectType.ActiveXDLL,
        status: ProjectStatus.Modified,
        isStartup: false,
        isActive: false,
        configuration: BuildConfiguration.Debug,
        outputPath: 'bin\\Debug\\BusinessLogic.dll',
        dependencies: [
          {
            projectId: '3',
            projectName: 'DataAccess',
            type: 'project'
          }
        ],
        references: [],
        components: [
          { name: 'clsCustomer', type: 'class', path: 'Classes\\clsCustomer.cls' },
          { name: 'clsOrder', type: 'class', path: 'Classes\\clsOrder.cls' },
          { name: 'clsProduct', type: 'class', path: 'Classes\\clsProduct.cls' }
        ]
      },
      {
        id: generateId(),
        name: 'DataAccess',
        path: 'C:\\Projects\\EnterpriseApp\\DataAccess\\DataAccess.vbp',
        type: ProjectType.ActiveXDLL,
        status: ProjectStatus.Loaded,
        isStartup: false,
        isActive: false,
        configuration: BuildConfiguration.Debug,
        outputPath: 'bin\\Debug\\DataAccess.dll',
        dependencies: [],
        references: [
          {
            name: 'Microsoft ActiveX Data Objects 2.8 Library',
            guid: '{2A75196C-D9EB-4129-B803-931327F72D5C}',
            version: '2.8',
            path: 'C:\\Program Files\\Common Files\\System\\ado\\msado15.dll'
          }
        ],
        components: [
          { name: 'clsDatabase', type: 'class', path: 'Classes\\clsDatabase.cls' },
          { name: 'clsDataAccess', type: 'class', path: 'Classes\\clsDataAccess.cls' }
        ]
      },
      {
        id: generateId(),
        name: 'ReportingModule',
        path: 'C:\\Projects\\EnterpriseApp\\Reporting\\ReportingModule.vbp',
        type: ProjectType.ActiveXDLL,
        status: ProjectStatus.Loaded,
        isStartup: false,
        isActive: false,
        configuration: BuildConfiguration.Debug,
        outputPath: 'bin\\Debug\\ReportingModule.dll',
        dependencies: [
          {
            projectId: '2',
            projectName: 'BusinessLogic',
            type: 'project'
          }
        ],
        references: [],
        components: [
          { name: 'clsReportGenerator', type: 'class', path: 'Classes\\clsReportGenerator.cls' },
          { name: 'clsExcelExport', type: 'class', path: 'Classes\\clsExcelExport.cls' }
        ]
      }
    ],
    buildOrder: [
      { projectId: '3', order: 1, dependencies: [], canParallel: true },
      { projectId: '2', order: 2, dependencies: ['3'], canParallel: false },
      { projectId: '4', order: 3, dependencies: ['2'], canParallel: true },
      { projectId: '1', order: 3, dependencies: ['2', '3'], canParallel: true }
    ],
    configuration: BuildConfiguration.Debug,
    startupProject: '1',
    createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    modifiedDate: new Date(),
    settings: {
      parallelBuild: true,
      stopOnFirstError: false,
      preBuildCommand: 'echo Starting build...',
      postBuildCommand: 'echo Build complete!',
      deployPath: 'C:\\Deploy\\EnterpriseApp'
    }
  };

  // Initialize with sample group
  useEffect(() => {
    setGroups([sampleGroup]);
    setSelectedGroup(sampleGroup);
  }, []);

  // Create new group
  const createGroup = useCallback(() => {
    if (!groupForm.name) return;

    const newGroup: ProjectGroup = {
      id: generateId(),
      name: groupForm.name,
      path: groupForm.path || `${groupForm.name}.vbg`,
      projects: [],
      buildOrder: [],
      configuration: BuildConfiguration.Debug,
      createdDate: new Date(),
      modifiedDate: new Date(),
      settings: {
        parallelBuild: false,
        stopOnFirstError: true
      }
    };

    setGroups(prev => [...prev, newGroup]);
    setSelectedGroup(newGroup);
    setShowNewGroupDialog(false);
    setGroupForm({ name: '', path: '' });

    eventEmitter.current.emit('groupCreated', newGroup);
  }, [groupForm, generateId]);

  // Add project to group
  const addProject = useCallback(() => {
    if (!selectedGroup || !projectForm.name) return;

    const newProject: GroupProject = {
      id: generateId(),
      name: projectForm.name,
      path: projectForm.path || `${projectForm.name}.vbp`,
      type: projectForm.type,
      status: ProjectStatus.Loaded,
      isStartup: selectedGroup.projects.length === 0,
      isActive: false,
      configuration: BuildConfiguration.Debug,
      outputPath: `bin\\Debug\\${projectForm.name}${projectForm.type === ProjectType.StandardEXE ? '.exe' : '.dll'}`,
      dependencies: [],
      references: [],
      components: []
    };

    const updatedGroup = {
      ...selectedGroup,
      projects: [...selectedGroup.projects, newProject],
      modifiedDate: new Date()
    };

    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updatedGroup : g));
    setSelectedGroup(updatedGroup);
    setShowAddProjectDialog(false);
    setProjectForm({ name: '', path: '', type: ProjectType.StandardEXE });

    eventEmitter.current.emit('projectAdded', newProject, updatedGroup);
  }, [selectedGroup, projectForm, generateId]);

  // Remove project from group
  const removeProject = useCallback((project: GroupProject) => {
    if (!selectedGroup || !window.confirm(`Remove project "${project.name}" from group?`)) return;

    const updatedGroup = {
      ...selectedGroup,
      projects: selectedGroup.projects.filter(p => p.id !== project.id),
      buildOrder: selectedGroup.buildOrder.filter(b => b.projectId !== project.id),
      modifiedDate: new Date()
    };

    // Update dependencies
    updatedGroup.projects.forEach(p => {
      p.dependencies = p.dependencies.filter(d => d.projectId !== project.id);
    });

    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updatedGroup : g));
    setSelectedGroup(updatedGroup);
    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
    }

    eventEmitter.current.emit('projectRemoved', project, updatedGroup);
  }, [selectedGroup, selectedProject]);

  // Set startup project
  const setStartupProject = useCallback((project: GroupProject) => {
    if (!selectedGroup) return;

    const updatedGroup = {
      ...selectedGroup,
      startupProject: project.id,
      projects: selectedGroup.projects.map(p => ({
        ...p,
        isStartup: p.id === project.id
      })),
      modifiedDate: new Date()
    };

    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updatedGroup : g));
    setSelectedGroup(updatedGroup);

    eventEmitter.current.emit('startupProjectChanged', project, updatedGroup);
  }, [selectedGroup]);

  // Build all projects
  const buildAll = useCallback(async () => {
    if (!selectedGroup) return;

    setIsBuilding(true);
    setBuildResults([]);
    setBuildLog([`Starting build for group: ${selectedGroup.name}`]);

    onGroupOperation?.(GroupOperation.BuildAll, selectedGroup);

    // Simulate building projects in order
    const results: BuildResult[] = [];
    
    for (const buildItem of selectedGroup.buildOrder) {
      const project = selectedGroup.projects.find(p => p.id === buildItem.projectId);
      if (!project) continue;

      setBuildLog(prev => [...prev, `Building ${project.name}...`]);
      
      // Update project status
      project.status = ProjectStatus.Building;
      setSelectedGroup({ ...selectedGroup });

      // Simulate build time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate build result
      const success = Math.random() > 0.2; // 80% success rate
      const result: BuildResult = {
        projectId: project.id,
        success,
        duration: 1000 + Math.random() * 4000,
        errors: success ? [] : [`Error in ${project.name}: Compilation failed`],
        warnings: success ? [`Warning: Implicit conversion in line 42`] : [],
        outputFile: success ? project.outputPath : undefined
      };

      results.push(result);
      setBuildResults(prev => [...prev, result]);

      // Update project status
      project.status = success ? ProjectStatus.Loaded : ProjectStatus.Error;
      project.lastBuildTime = new Date();
      project.lastBuildSuccess = success;
      setSelectedGroup({ ...selectedGroup });

      setBuildLog(prev => [...prev, 
        `${project.name}: ${success ? 'Build succeeded' : 'Build failed'}`,
        ...result.errors,
        ...result.warnings
      ]);

      // Stop on error if configured
      if (!success && selectedGroup.settings.stopOnFirstError) {
        setBuildLog(prev => [...prev, 'Build stopped due to error']);
        break;
      }
    }

    setIsBuilding(false);
    setBuildLog(prev => [...prev, `Build complete. ${results.filter(r => r.success).length}/${results.length} succeeded`]);
    
    onBuildComplete?.(results);
    eventEmitter.current.emit('buildComplete', results);
  }, [selectedGroup, onGroupOperation, onBuildComplete]);

  // Calculate build order
  const calculateBuildOrder = useCallback(() => {
    if (!selectedGroup) return;

    const order: BuildOrder[] = [];
    const processed = new Set<string>();
    const processing = new Set<string>();

    const processDependencies = (projectId: string, depth: number = 0): void => {
      if (processed.has(projectId) || processing.has(projectId)) return;
      
      processing.add(projectId);
      const project = selectedGroup.projects.find(p => p.id === projectId);
      if (!project) return;

      // Process dependencies first
      project.dependencies.forEach(dep => {
        if (dep.type === 'project') {
          processDependencies(dep.projectId, depth + 1);
        }
      });

      // Add to build order
      if (!processed.has(projectId)) {
        const dependencies = project.dependencies
          .filter(d => d.type === 'project')
          .map(d => d.projectId);

        order.push({
          projectId,
          order: depth,
          dependencies,
          canParallel: true // Simplified - would need more complex analysis
        });
        processed.add(projectId);
      }
      processing.delete(projectId);
    };

    // Process all projects
    selectedGroup.projects.forEach(p => processDependencies(p.id));

    // Update group with new build order
    const updatedGroup = {
      ...selectedGroup,
      buildOrder: order.sort((a, b) => b.order - a.order), // Reverse order for dependencies
      modifiedDate: new Date()
    };

    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updatedGroup : g));
    setSelectedGroup(updatedGroup);

    eventEmitter.current.emit('buildOrderCalculated', order);
  }, [selectedGroup]);

  // Open project
  const openProject = useCallback((project: GroupProject) => {
    setSelectedProject(project);
    onProjectOpen?.(project);
    eventEmitter.current.emit('projectOpened', project);
  }, [onProjectOpen]);

  // Toggle project expansion
  const toggleProjectExpansion = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  // Get project icon
  const getProjectIcon = (type: ProjectType): string => {
    switch (type) {
      case ProjectType.StandardEXE:
        return '🖥️';
      case ProjectType.ActiveXDLL:
        return '📚';
      case ProjectType.ActiveXEXE:
        return '⚙️';
      case ProjectType.ActiveXControl:
        return '🎛️';
      case ProjectType.ActiveXDocument:
      case ProjectType.ActiveXDocumentEXE:
        return '📄';
      default:
        return '📦';
    }
  };

  // Get status color
  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case ProjectStatus.Loaded:
        return 'text-green-600';
      case ProjectStatus.Modified:
        return 'text-yellow-600';
      case ProjectStatus.Building:
        return 'text-blue-600';
      case ProjectStatus.Error:
        return 'text-red-600';
      case ProjectStatus.Unloaded:
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Project Groups</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewGroupDialog(true)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              New Group
            </button>
            {selectedGroup && (
              <>
                <button
                  onClick={() => setShowAddProjectDialog(true)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Project
                </button>
                <button
                  onClick={buildAll}
                  disabled={isBuilding || selectedGroup.projects.length === 0}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
                >
                  {isBuilding ? 'Building...' : 'Build All'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Group Selection */}
      {groups.length > 1 && (
        <div className="p-2 border-b border-gray-200">
          <select
            value={selectedGroup?.id || ''}
            onChange={(e) => {
              const group = groups.find(g => g.id === e.target.value);
              setSelectedGroup(group || null);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Select a group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.projects.length} projects)
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedGroup ? (
        <div className="flex-1 flex">
          {/* Project Tree */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <div className="text-sm font-medium">{selectedGroup.name}</div>
              <div className="text-xs text-gray-600">{selectedGroup.path}</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {selectedGroup.projects.map(project => (
                <div key={project.id} className="mb-2">
                  <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                      selectedProject?.id === project.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => openProject(project)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectExpansion(project.id);
                      }}
                      className="text-xs"
                    >
                      {expandedProjects.has(project.id) ? '▼' : '▶'}
                    </button>
                    <span className="text-lg">{getProjectIcon(project.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{project.name}</span>
                        {project.isStartup && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                            Startup
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${getStatusColor(project.status)}`}>
                        {project.status}
                      </div>
                    </div>
                    {project.lastBuildSuccess !== undefined && (
                      <span className={`text-sm ${project.lastBuildSuccess ? '✅' : '❌'}`} />
                    )}
                  </div>

                  {expandedProjects.has(project.id) && (
                    <div className="ml-8 mt-1">
                      {project.components.map((comp, index) => (
                        <div key={index} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                          <span>
                            {comp.type === 'form' ? '📋' :
                             comp.type === 'module' ? '📄' :
                             comp.type === 'class' ? '🎯' :
                             comp.type === 'usercontrol' ? '🎨' : '📦'}
                          </span>
                          <span>{comp.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setSelectedTab('projects')}
                  className={`px-4 py-2 border-b-2 ${
                    selectedTab === 'projects'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setSelectedTab('dependencies')}
                  className={`px-4 py-2 border-b-2 ${
                    selectedTab === 'dependencies'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Dependencies
                </button>
                <button
                  onClick={() => setSelectedTab('build')}
                  className={`px-4 py-2 border-b-2 ${
                    selectedTab === 'build'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Build
                </button>
                <button
                  onClick={() => setSelectedTab('settings')}
                  className={`px-4 py-2 border-b-2 ${
                    selectedTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedTab === 'projects' && selectedProject && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <span className="text-2xl">{getProjectIcon(selectedProject.type)}</span>
                      {selectedProject.name}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Path</label>
                        <div className="text-sm text-gray-600">{selectedProject.path}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <div className="text-sm text-gray-600">{selectedProject.type}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Output</label>
                        <div className="text-sm text-gray-600">{selectedProject.outputPath}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Configuration</label>
                        <div className="text-sm text-gray-600">{selectedProject.configuration}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setStartupProject(selectedProject)}
                        disabled={selectedProject.isStartup}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                      >
                        Set as Startup
                      </button>
                      <button
                        onClick={() => removeProject(selectedProject)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove from Group
                      </button>
                    </div>
                  </div>

                  {/* References */}
                  {selectedProject.references.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">References</h3>
                      <div className="space-y-1">
                        {selectedProject.references.map((ref, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span>📚</span>
                            <span>{ref.name}</span>
                            <span className="text-gray-500">v{ref.version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Components */}
                  <div>
                    <h3 className="font-medium mb-2">Components ({selectedProject.components.length})</h3>
                    <div className="space-y-1">
                      {selectedProject.components.map((comp, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>
                            {comp.type === 'form' ? '📋' :
                             comp.type === 'module' ? '📄' :
                             comp.type === 'class' ? '🎯' :
                             comp.type === 'usercontrol' ? '🎨' : '📦'}
                          </span>
                          <span>{comp.name}</span>
                          <span className="text-gray-500">{comp.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'dependencies' && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="font-medium">Project Dependencies</h3>
                    <button
                      onClick={calculateBuildOrder}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Recalculate Build Order
                    </button>
                  </div>

                  {/* Dependency Graph */}
                  <div className="bg-gray-50 rounded p-4 mb-6">
                    <h4 className="font-medium mb-3">Dependency Graph</h4>
                    {selectedGroup.projects.map(project => (
                      <div key={project.id} className="mb-3">
                        <div className="font-medium text-sm">{project.name}</div>
                        {project.dependencies.length > 0 ? (
                          <div className="ml-4 mt-1">
                            {project.dependencies.map((dep, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                → {dep.projectName} ({dep.type})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-4 mt-1 text-sm text-gray-500">No dependencies</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Build Order */}
                  <div>
                    <h4 className="font-medium mb-3">Build Order</h4>
                    <div className="space-y-2">
                      {selectedGroup.buildOrder.map((item, index) => {
                        const project = selectedGroup.projects.find(p => p.id === item.projectId);
                        if (!project) return null;
                        return (
                          <div key={item.projectId} className="flex items-center gap-3 p-2 border border-gray-200 rounded">
                            <span className="text-lg font-mono">{index + 1}</span>
                            <span className="flex-1">{project.name}</span>
                            {item.canParallel && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Can parallel
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'build' && (
                <div>
                  {/* Build Results */}
                  {buildResults.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Build Results</h3>
                      <div className="space-y-2">
                        {buildResults.map((result, index) => {
                          const project = selectedGroup.projects.find(p => p.id === result.projectId);
                          if (!project) return null;
                          return (
                            <div key={index} className={`p-3 border rounded ${
                              result.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={result.success ? '✅' : '❌'} />
                                  <span className="font-medium">{project.name}</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {(result.duration / 1000).toFixed(1)}s
                                </span>
                              </div>
                              {result.errors.length > 0 && (
                                <div className="mt-2 text-sm text-red-600">
                                  {result.errors.map((error, i) => (
                                    <div key={i}>{error}</div>
                                  ))}
                                </div>
                              )}
                              {result.warnings.length > 0 && (
                                <div className="mt-2 text-sm text-yellow-600">
                                  {result.warnings.map((warning, i) => (
                                    <div key={i}>{warning}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Build Log */}
                  <div>
                    <h3 className="font-medium mb-3">Build Output</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                      {buildLog.map((line, index) => (
                        <div key={index} className={
                          line.includes('Error') ? 'text-red-400' :
                          line.includes('Warning') ? 'text-yellow-400' :
                          line.includes('succeeded') ? 'text-green-400' : ''
                        }>
                          {line}
                        </div>
                      ))}
                      {buildLog.length === 0 && (
                        <div className="text-gray-500">No build output</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'settings' && (
                <div>
                  <h3 className="font-medium mb-4">Group Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroup.settings.parallelBuild}
                          onChange={(e) => {
                            const updated = {
                              ...selectedGroup,
                              settings: {
                                ...selectedGroup.settings,
                                parallelBuild: e.target.checked
                              }
                            };
                            setSelectedGroup(updated);
                            setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
                          }}
                        />
                        <span>Enable parallel build</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroup.settings.stopOnFirstError}
                          onChange={(e) => {
                            const updated = {
                              ...selectedGroup,
                              settings: {
                                ...selectedGroup.settings,
                                stopOnFirstError: e.target.checked
                              }
                            };
                            setSelectedGroup(updated);
                            setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
                          }}
                        />
                        <span>Stop on first error</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pre-build command
                      </label>
                      <input
                        type="text"
                        value={selectedGroup.settings.preBuildCommand || ''}
                        onChange={(e) => {
                          const updated = {
                            ...selectedGroup,
                            settings: {
                              ...selectedGroup.settings,
                              preBuildCommand: e.target.value
                            }
                          };
                          setSelectedGroup(updated);
                          setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Post-build command
                      </label>
                      <input
                        type="text"
                        value={selectedGroup.settings.postBuildCommand || ''}
                        onChange={(e) => {
                          const updated = {
                            ...selectedGroup,
                            settings: {
                              ...selectedGroup.settings,
                              postBuildCommand: e.target.value
                            }
                          };
                          setSelectedGroup(updated);
                          setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deploy path
                      </label>
                      <input
                        type="text"
                        value={selectedGroup.settings.deployPath || ''}
                        onChange={(e) => {
                          const updated = {
                            ...selectedGroup,
                            settings: {
                              ...selectedGroup.settings,
                              deployPath: e.target.value
                            }
                          };
                          setSelectedGroup(updated);
                          setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="C:\Deploy"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg">No project group selected</p>
            <p className="text-sm mt-2">Create a new group or open an existing .vbg file</p>
          </div>
        </div>
      )}

      {/* New Group Dialog */}
      {showNewGroupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">New Project Group</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="My Project Group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Path (optional)
                </label>
                <input
                  type="text"
                  value={groupForm.path}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, path: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="C:\Projects\MyGroup.vbg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewGroupDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Dialog */}
      {showAddProjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">Add Project to Group</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="MyProject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  value={projectForm.type}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, type: e.target.value as ProjectType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(ProjectType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Path (optional)
                </label>
                <input
                  type="text"
                  value={projectForm.path}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, path: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="C:\Projects\MyProject\MyProject.vbp"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddProjectDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addProject}
                disabled={!projectForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectGroupManager;