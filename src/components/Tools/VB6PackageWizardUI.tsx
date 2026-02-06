/**
 * VB6 Package & Deployment Wizard UI - Complete Application Packaging Interface
 * Provides comprehensive visual interface for the VB6 Package & Deployment Wizard
 * with project management, dependency analysis, build process, and deployment tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  VB6PackageWizardInstance,
  PackageProject,
  PackageFile,
  PackageDependency,
  RegistryEntry,
  ShortcutEntry,
  BuildResult,
  DeploymentTarget,
  PackageType,
  DistributionMedia,
  ComponentType,
  InstallLocation,
  RegistryRoot,
} from '../../services/VB6PackageWizard';

interface PackageWizardUIProps {
  onClose?: () => void;
}

export const VB6PackageWizardUI: React.FC<PackageWizardUIProps> = ({ onClose }) => {
  // State management
  const [activeTab, setActiveTab] = useState<
    'projects' | 'files' | 'dependencies' | 'registry' | 'shortcuts' | 'build' | 'deploy'
  >('projects');
  const [projects, setProjects] = useState<PackageProject[]>([]);
  const [currentProject, setCurrentProject] = useState<PackageProject | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; template: any }>>(
    []
  );
  const [deploymentTargets, setDeploymentTargets] = useState<DeploymentTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form states
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [showNewRegistryForm, setShowNewRegistryForm] = useState(false);
  const [showNewShortcutForm, setShowNewShortcutForm] = useState(false);
  const [showNewDeploymentForm, setShowNewDeploymentForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Form data
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    sourceProject: '',
    outputFolder: '',
    applicationName: '',
    applicationVersion: '1.0.0',
    companyName: '',
    copyrightInfo: '',
    productName: '',
  });

  const [newFileData, setNewFileData] = useState({
    sourcePath: '',
    fileName: '',
    type: ComponentType.EXECUTABLE,
    location: InstallLocation.APPLICATION_FOLDER,
    shared: false,
    register: false,
    compress: true,
    customPath: '',
  });

  const [newRegistryData, setNewRegistryData] = useState({
    root: RegistryRoot.HKEY_LOCAL_MACHINE,
    keyPath: '',
    valueName: '',
    valueData: '',
    valueType: 'string' as 'string' | 'dword' | 'binary' | 'multi_string',
    createKey: true,
    overwriteValue: true,
    removeOnUninstall: true,
    description: '',
  });

  const [newShortcutData, setNewShortcutData] = useState({
    name: '',
    targetPath: '',
    arguments: '',
    workingDirectory: '',
    description: '',
    location: 'start_menu' as 'desktop' | 'start_menu' | 'programs' | 'startup' | 'custom',
    customPath: '',
    runMinimized: false,
    runMaximized: false,
  });

  const [newDeploymentData, setNewDeploymentData] = useState({
    name: '',
    type: 'ftp' as 'ftp' | 'web' | 'network' | 'cd' | 'custom',
    serverUrl: '',
    username: '',
    password: '',
    remotePath: '',
    testConnection: true,
    overwriteExisting: true,
    createBackup: false,
  });

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setProjects(VB6PackageWizardInstance.getAllProjects());
    setCurrentProject(VB6PackageWizardInstance.getCurrentProject());
    setTemplates(VB6PackageWizardInstance.getTemplates());
    setDeploymentTargets(VB6PackageWizardInstance.getDeploymentTargets());
  }, []);

  // Project Management
  const handleCreateProject = async () => {
    try {
      setLoading(true);
      const project = VB6PackageWizardInstance.createProject(
        newProjectData.name,
        selectedTemplate || undefined
      );

      // Update project with form data
      Object.assign(project, newProjectData);
      project.modified = new Date();

      setShowNewProjectForm(false);
      setNewProjectData({
        name: '',
        description: '',
        sourceProject: '',
        outputFolder: '',
        applicationName: '',
        applicationVersion: '1.0.0',
        companyName: '',
        copyrightInfo: '',
        productName: '',
      });
      setSelectedTemplate('');
      refreshData();
    } catch (err) {
      setError(`Failed to create project: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    VB6PackageWizardInstance.openProject(projectId);
    refreshData();
  };

  const handleSaveProject = () => {
    VB6PackageWizardInstance.saveProject();
    refreshData();
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      VB6PackageWizardInstance.deleteProject(projectId);
      refreshData();
    }
  };

  // File Management
  const handleAddFile = async () => {
    try {
      if (!currentProject) {
        setError('No project is currently open');
        return;
      }

      setLoading(true);
      VB6PackageWizardInstance.addFile({
        sourcePath: newFileData.sourcePath,
        targetPath:
          newFileData.location === InstallLocation.CUSTOM_PATH
            ? newFileData.customPath
            : `[${newFileData.location.toUpperCase()}]\\${newFileData.fileName}`,
        fileName: newFileData.fileName,
        fileSize: Math.floor(Math.random() * 1000000) + 1024, // Simulate file size
        type: newFileData.type,
        location: newFileData.location,
        customPath: newFileData.customPath,
        shared: newFileData.shared,
        system: false,
        readonly: false,
        hidden: false,
        compress: newFileData.compress,
        register: newFileData.register,
        checkVersion: true,
        versionConflict: 'newer',
        dependencies: [],
      });

      setShowNewFileForm(false);
      setNewFileData({
        sourcePath: '',
        fileName: '',
        type: ComponentType.EXECUTABLE,
        location: InstallLocation.APPLICATION_FOLDER,
        shared: false,
        register: false,
        compress: true,
        customPath: '',
      });
      refreshData();
    } catch (err) {
      setError(`Failed to add file: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    VB6PackageWizardInstance.removeFile(fileId);
    refreshData();
  };

  // Dependency Analysis
  const handleAnalyzeDependencies = async () => {
    try {
      if (!currentProject) {
        setError('No project is currently open');
        return;
      }

      setIsAnalyzing(true);
      await VB6PackageWizardInstance.analyzeDependencies(currentProject.sourceProject);
      refreshData();
    } catch (err) {
      setError(`Failed to analyze dependencies: ${err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveDependency = (dependencyId: string) => {
    VB6PackageWizardInstance.removeDependency(dependencyId);
    refreshData();
  };

  // Registry Management
  const handleAddRegistryEntry = () => {
    try {
      if (!currentProject) {
        setError('No project is currently open');
        return;
      }

      VB6PackageWizardInstance.addRegistryEntry(newRegistryData);
      setShowNewRegistryForm(false);
      setNewRegistryData({
        root: RegistryRoot.HKEY_LOCAL_MACHINE,
        keyPath: '',
        valueName: '',
        valueData: '',
        valueType: 'string',
        createKey: true,
        overwriteValue: true,
        removeOnUninstall: true,
        description: '',
      });
      refreshData();
    } catch (err) {
      setError(`Failed to add registry entry: ${err}`);
    }
  };

  // Shortcut Management
  const handleAddShortcut = () => {
    try {
      if (!currentProject) {
        setError('No project is currently open');
        return;
      }

      VB6PackageWizardInstance.addShortcut(newShortcutData);
      setShowNewShortcutForm(false);
      setNewShortcutData({
        name: '',
        targetPath: '',
        arguments: '',
        workingDirectory: '',
        description: '',
        location: 'start_menu',
        customPath: '',
        runMinimized: false,
        runMaximized: false,
      });
      refreshData();
    } catch (err) {
      setError(`Failed to add shortcut: ${err}`);
    }
  };

  // Build Process
  const handleBuildPackage = async () => {
    try {
      if (!currentProject) {
        setError('No project is currently open');
        return;
      }

      setIsBuilding(true);
      setBuildResult(null);
      const result = await VB6PackageWizardInstance.buildPackage();
      setBuildResult(result);
      refreshData();
    } catch (err) {
      setError(`Build failed: ${err}`);
    } finally {
      setIsBuilding(false);
    }
  };

  // Deployment Management
  const handleAddDeploymentTarget = () => {
    try {
      VB6PackageWizardInstance.addDeploymentTarget(newDeploymentData);
      setShowNewDeploymentForm(false);
      setNewDeploymentData({
        name: '',
        type: 'ftp',
        serverUrl: '',
        username: '',
        password: '',
        remotePath: '',
        testConnection: true,
        overwriteExisting: true,
        createBackup: false,
      });
      refreshData();
    } catch (err) {
      setError(`Failed to add deployment target: ${err}`);
    }
  };

  const handleDeploy = async (packagePath: string, targetId: string) => {
    try {
      setLoading(true);
      const success = await VB6PackageWizardInstance.deployPackage(packagePath, targetId);
      if (success) {
        alert('Deployment completed successfully!');
      } else {
        setError('Deployment failed');
      }
      refreshData();
    } catch (err) {
      setError(`Deployment failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const validateCurrentProject = () => {
    if (!currentProject) return null;
    return VB6PackageWizardInstance.validateProject();
  };

  // Render functions
  const renderProjectsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Package Projects</h3>
        <button
          onClick={() => setShowNewProjectForm(true)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          New Project
        </button>
      </div>

      {/* Project List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Version</th>
              <th className="px-4 py-2 text-left">Files</th>
              <th className="px-4 py-2 text-left">Builds</th>
              <th className="px-4 py-2 text-left">Modified</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr
                key={project.id}
                className={project.id === currentProject?.id ? 'bg-blue-50' : ''}
              >
                <td className="px-4 py-2 font-medium">{project.name}</td>
                <td className="px-4 py-2">{project.packageType.replace('_', ' ').toUpperCase()}</td>
                <td className="px-4 py-2">{project.version}</td>
                <td className="px-4 py-2">{project.files.length}</td>
                <td className="px-4 py-2">{project.buildCount}</td>
                <td className="px-4 py-2">{project.modified.toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenProject(project.id)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      disabled={project.id === currentProject?.id}
                    >
                      {project.id === currentProject?.id ? 'Current' : 'Open'}
                    </button>
                    <button
                      onClick={handleSaveProject}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Current Project Details */}
      {currentProject && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Project: {currentProject.displayName}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Application:</strong> {currentProject.applicationName}
            </div>
            <div>
              <strong>Version:</strong> {currentProject.applicationVersion}
            </div>
            <div>
              <strong>Company:</strong> {currentProject.companyName}
            </div>
            <div>
              <strong>Package Type:</strong>{' '}
              {currentProject.packageType.replace('_', ' ').toUpperCase()}
            </div>
            <div>
              <strong>Install Location:</strong>{' '}
              {currentProject.installLocation.replace('_', ' ').toUpperCase()}
            </div>
            <div>
              <strong>Required Space:</strong> {(currentProject.requiredSpace / 1024).toFixed(1)} MB
            </div>
          </div>
          {currentProject.description && (
            <div className="mt-2">
              <strong>Description:</strong> {currentProject.description}
            </div>
          )}
        </div>
      )}

      {/* New Project Form */}
      {showNewProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Package Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template:</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">No Template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name:</label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={e => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Application Name:</label>
                  <input
                    type="text"
                    value={newProjectData.applicationName}
                    onChange={e =>
                      setNewProjectData(prev => ({ ...prev, applicationName: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Application name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Version:</label>
                  <input
                    type="text"
                    value={newProjectData.applicationVersion}
                    onChange={e =>
                      setNewProjectData(prev => ({ ...prev, applicationVersion: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name:</label>
                  <input
                    type="text"
                    value={newProjectData.companyName}
                    onChange={e =>
                      setNewProjectData(prev => ({ ...prev, companyName: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source Project:</label>
                <input
                  type="text"
                  value={newProjectData.sourceProject}
                  onChange={e =>
                    setNewProjectData(prev => ({ ...prev, sourceProject: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="C:\\VB6Projects\\MyApp\\MyApp.vbp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Output Folder:</label>
                <input
                  type="text"
                  value={newProjectData.outputFolder}
                  onChange={e =>
                    setNewProjectData(prev => ({ ...prev, outputFolder: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="C:\\VB6Projects\\MyApp\\Package"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description:</label>
                <textarea
                  value={newProjectData.description}
                  onChange={e =>
                    setNewProjectData(prev => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Project description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewProjectForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newProjectData.name || loading}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => {
    if (!currentProject) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">📁</div>
          <p>Please select a project first to manage files.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Package Files</h3>
          <button
            onClick={() => setShowNewFileForm(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Add File
          </button>
        </div>

        {/* Files List */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">File Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Options</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProject.files.map(file => (
                <tr key={file.id}>
                  <td className="px-4 py-2 font-medium">{file.fileName}</td>
                  <td className="px-4 py-2">{file.type.replace('_', ' ').toUpperCase()}</td>
                  <td className="px-4 py-2">{file.location.replace('_', ' ').toUpperCase()}</td>
                  <td className="px-4 py-2">{(file.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 text-xs">
                      {file.compress && (
                        <span className="bg-blue-100 text-blue-800 px-1 rounded">Compress</span>
                      )}
                      {file.register && (
                        <span className="bg-green-100 text-green-800 px-1 rounded">Register</span>
                      )}
                      {file.shared && (
                        <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Shared</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add File Form */}
        {showNewFileForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Add File to Package</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Source Path:</label>
                  <input
                    type="text"
                    value={newFileData.sourcePath}
                    onChange={e =>
                      setNewFileData(prev => ({ ...prev, sourcePath: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="C:\\Path\\To\\File.exe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">File Name:</label>
                  <input
                    type="text"
                    value={newFileData.fileName}
                    onChange={e => setNewFileData(prev => ({ ...prev, fileName: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="File.exe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">File Type:</label>
                  <select
                    value={newFileData.type}
                    onChange={e =>
                      setNewFileData(prev => ({ ...prev, type: e.target.value as ComponentType }))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.values(ComponentType).map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Install Location:</label>
                  <select
                    value={newFileData.location}
                    onChange={e =>
                      setNewFileData(prev => ({
                        ...prev,
                        location: e.target.value as InstallLocation,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.values(InstallLocation).map(location => (
                      <option key={location} value={location}>
                        {location.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                {newFileData.location === InstallLocation.CUSTOM_PATH && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Path:</label>
                    <input
                      type="text"
                      value={newFileData.customPath}
                      onChange={e =>
                        setNewFileData(prev => ({ ...prev, customPath: e.target.value }))
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="Custom install path"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="compress"
                      checked={newFileData.compress}
                      onChange={e =>
                        setNewFileData(prev => ({ ...prev, compress: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="compress" className="text-sm">
                      Compress File
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="register"
                      checked={newFileData.register}
                      onChange={e =>
                        setNewFileData(prev => ({ ...prev, register: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="register" className="text-sm">
                      Register Component
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shared"
                      checked={newFileData.shared}
                      onChange={e =>
                        setNewFileData(prev => ({ ...prev, shared: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="shared" className="text-sm">
                      Shared File
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowNewFileForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFile}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!newFileData.sourcePath || !newFileData.fileName || loading}
                >
                  Add File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDependenciesTab = () => {
    if (!currentProject) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">🔗</div>
          <p>Please select a project first to analyze dependencies.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Project Dependencies</h3>
          <button
            onClick={handleAnalyzeDependencies}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isAnalyzing || !currentProject.sourceProject}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Dependencies'}
          </button>
        </div>

        {/* Dependencies List */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Component</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Required</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProject.dependencies.map(dep => (
                <tr key={dep.id}>
                  <td className="px-4 py-2 font-medium">{dep.name}</td>
                  <td className="px-4 py-2">{dep.type.replace('_', ' ').toUpperCase()}</td>
                  <td className="px-4 py-2">{dep.version || 'Unknown'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        dep.status === 'found'
                          ? 'bg-green-100 text-green-800'
                          : dep.status === 'missing'
                            ? 'bg-red-100 text-red-800'
                            : dep.status === 'outdated'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dep.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {dep.required ? (
                      <span className="text-red-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-600">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRemoveDependency(dep.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      disabled={dep.required}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentProject.dependencies.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p>No dependencies found. Click "Analyze Dependencies" to scan your project.</p>
          </div>
        )}
      </div>
    );
  };

  const renderRegistryTab = () => {
    if (!currentProject) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">🗃️</div>
          <p>Please select a project first to manage registry entries.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Registry Entries</h3>
          <button
            onClick={() => setShowNewRegistryForm(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Registry Entry
          </button>
        </div>

        {/* Registry Entries List */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Root</th>
                <th className="px-4 py-2 text-left">Key Path</th>
                <th className="px-4 py-2 text-left">Value Name</th>
                <th className="px-4 py-2 text-left">Value Data</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProject.registryEntries.map(entry => (
                <tr key={entry.id}>
                  <td className="px-4 py-2 font-medium">{entry.root.split('_')[1]}</td>
                  <td className="px-4 py-2 truncate max-w-xs" title={entry.keyPath}>
                    {entry.keyPath}
                  </td>
                  <td className="px-4 py-2">{entry.valueName}</td>
                  <td className="px-4 py-2 truncate max-w-xs" title={entry.valueData}>
                    {entry.valueData}
                  </td>
                  <td className="px-4 py-2">{entry.valueType.toUpperCase()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        const entryIndex = currentProject.registryEntries.findIndex(
                          e => e.id === entry.id
                        );
                        if (entryIndex >= 0) {
                          currentProject.registryEntries.splice(entryIndex, 1);
                          refreshData();
                        }
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Registry Entry Form */}
        {showNewRegistryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Add Registry Entry</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Root Key:</label>
                  <select
                    value={newRegistryData.root}
                    onChange={e =>
                      setNewRegistryData(prev => ({
                        ...prev,
                        root: e.target.value as RegistryRoot,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.values(RegistryRoot).map(root => (
                      <option key={root} value={root}>
                        {root}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Key Path:</label>
                  <input
                    type="text"
                    value={newRegistryData.keyPath}
                    onChange={e =>
                      setNewRegistryData(prev => ({ ...prev, keyPath: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="SOFTWARE\\Company\\Application"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value Name:</label>
                  <input
                    type="text"
                    value={newRegistryData.valueName}
                    onChange={e =>
                      setNewRegistryData(prev => ({ ...prev, valueName: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="InstallPath"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value Data:</label>
                  <input
                    type="text"
                    value={newRegistryData.valueData}
                    onChange={e =>
                      setNewRegistryData(prev => ({ ...prev, valueData: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="C:\\Program Files\\MyApp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value Type:</label>
                  <select
                    value={newRegistryData.valueType}
                    onChange={e =>
                      setNewRegistryData(prev => ({ ...prev, valueType: e.target.value as any }))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="string">String</option>
                    <option value="dword">DWORD</option>
                    <option value="binary">Binary</option>
                    <option value="multi_string">Multi String</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description:</label>
                  <input
                    type="text"
                    value={newRegistryData.description}
                    onChange={e =>
                      setNewRegistryData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Registry entry description"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createKey"
                      checked={newRegistryData.createKey}
                      onChange={e =>
                        setNewRegistryData(prev => ({ ...prev, createKey: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="createKey" className="text-sm">
                      Create Key if Missing
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="overwriteValue"
                      checked={newRegistryData.overwriteValue}
                      onChange={e =>
                        setNewRegistryData(prev => ({ ...prev, overwriteValue: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="overwriteValue" className="text-sm">
                      Overwrite Existing Value
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="removeOnUninstall"
                      checked={newRegistryData.removeOnUninstall}
                      onChange={e =>
                        setNewRegistryData(prev => ({
                          ...prev,
                          removeOnUninstall: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="removeOnUninstall" className="text-sm">
                      Remove on Uninstall
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowNewRegistryForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRegistryEntry}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!newRegistryData.keyPath || !newRegistryData.valueName}
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderShortcutsTab = () => {
    if (!currentProject) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">🔗</div>
          <p>Please select a project first to manage shortcuts.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Application Shortcuts</h3>
          <button
            onClick={() => setShowNewShortcutForm(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Shortcut
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Target</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Arguments</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProject.shortcuts.map(shortcut => (
                <tr key={shortcut.id}>
                  <td className="px-4 py-2 font-medium">{shortcut.name}</td>
                  <td className="px-4 py-2 truncate max-w-xs" title={shortcut.targetPath}>
                    {shortcut.targetPath}
                  </td>
                  <td className="px-4 py-2">{shortcut.location.replace('_', ' ').toUpperCase()}</td>
                  <td className="px-4 py-2">{shortcut.arguments || '-'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        const shortcutIndex = currentProject.shortcuts.findIndex(
                          s => s.id === shortcut.id
                        );
                        if (shortcutIndex >= 0) {
                          currentProject.shortcuts.splice(shortcutIndex, 1);
                          refreshData();
                        }
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Shortcut Form */}
        {showNewShortcutForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Add Application Shortcut</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Shortcut Name:</label>
                  <input
                    type="text"
                    value={newShortcutData.name}
                    onChange={e => setNewShortcutData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    placeholder="My Application"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Path:</label>
                  <input
                    type="text"
                    value={newShortcutData.targetPath}
                    onChange={e =>
                      setNewShortcutData(prev => ({ ...prev, targetPath: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="[APPDIR]\\MyApp.exe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location:</label>
                  <select
                    value={newShortcutData.location}
                    onChange={e =>
                      setNewShortcutData(prev => ({ ...prev, location: e.target.value as any }))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="start_menu">Start Menu</option>
                    <option value="programs">Programs Menu</option>
                    <option value="startup">Startup</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {newShortcutData.location === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Path:</label>
                    <input
                      type="text"
                      value={newShortcutData.customPath}
                      onChange={e =>
                        setNewShortcutData(prev => ({ ...prev, customPath: e.target.value }))
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="Custom shortcut path"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Arguments:</label>
                  <input
                    type="text"
                    value={newShortcutData.arguments}
                    onChange={e =>
                      setNewShortcutData(prev => ({ ...prev, arguments: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Command line arguments (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description:</label>
                  <input
                    type="text"
                    value={newShortcutData.description}
                    onChange={e =>
                      setNewShortcutData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Shortcut description"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="runMinimized"
                      checked={newShortcutData.runMinimized}
                      onChange={e =>
                        setNewShortcutData(prev => ({ ...prev, runMinimized: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="runMinimized" className="text-sm">
                      Run Minimized
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="runMaximized"
                      checked={newShortcutData.runMaximized}
                      onChange={e =>
                        setNewShortcutData(prev => ({ ...prev, runMaximized: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="runMaximized" className="text-sm">
                      Run Maximized
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowNewShortcutForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddShortcut}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!newShortcutData.name || !newShortcutData.targetPath}
                >
                  Add Shortcut
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBuildTab = () => {
    if (!currentProject) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">🔧</div>
          <p>Please select a project first to build packages.</p>
        </div>
      );
    }

    const validation = validateCurrentProject();

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Build Package</h3>
        </div>

        {/* Project Validation */}
        {validation && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Project Validation</h4>
            {validation.errors.length > 0 && (
              <div className="mb-2">
                <div className="text-red-600 font-medium">Errors:</div>
                <ul className="list-disc ml-4 text-sm text-red-600">
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mb-2">
                <div className="text-yellow-600 font-medium">Warnings:</div>
                <ul className="list-disc ml-4 text-sm text-yellow-600">
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.valid &&
              validation.errors.length === 0 &&
              validation.warnings.length === 0 && (
                <div className="text-green-600">✓ Project is ready for building</div>
              )}
          </div>
        )}

        {/* Build Options */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Build Options</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Package Type:</strong>{' '}
              {currentProject.packageType.replace('_', ' ').toUpperCase()}
            </div>
            <div>
              <strong>Distribution:</strong>{' '}
              {currentProject.distributionMedia.replace('_', ' ').toUpperCase()}
            </div>
            <div>
              <strong>Compression:</strong> Level {currentProject.compressionLevel}
            </div>
            <div>
              <strong>Output Folder:</strong> {currentProject.outputFolder}
            </div>
            <div>
              <strong>Create Uninstaller:</strong> {currentProject.createUninstaller ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Required Space:</strong> {(currentProject.requiredSpace / 1024).toFixed(1)} MB
            </div>
          </div>
        </div>

        {/* Build Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBuildPackage}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-lg font-semibold"
            disabled={isBuilding || (validation && !validation.valid)}
          >
            {isBuilding ? 'Building Package...' : 'Build Package'}
          </button>
        </div>

        {/* Build Results */}
        {buildResult && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Build Results</h4>
            <div
              className={`p-3 rounded ${buildResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              <div className="font-medium">
                {buildResult.success ? '✓ Build Successful' : '✗ Build Failed'}
              </div>
              {buildResult.success && buildResult.packagePath && (
                <div className="text-sm mt-1">Package created: {buildResult.packagePath}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <strong>Build Time:</strong> {buildResult.buildTime}ms
              </div>
              <div>
                <strong>Package Size:</strong> {(buildResult.setupSize / 1024).toFixed(1)} KB
              </div>
              <div>
                <strong>Files Included:</strong> {buildResult.filesIncluded}
              </div>
              <div>
                <strong>Dependencies Resolved:</strong> {buildResult.dependenciesResolved}
              </div>
              <div>
                <strong>Compression Ratio:</strong>{' '}
                {(buildResult.compressionRatio * 100).toFixed(1)}%
              </div>
            </div>

            {buildResult.errors.length > 0 && (
              <div className="mt-4">
                <div className="text-red-600 font-medium">Errors:</div>
                <ul className="list-disc ml-4 text-sm text-red-600">
                  {buildResult.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {buildResult.warnings.length > 0 && (
              <div className="mt-4">
                <div className="text-yellow-600 font-medium">Warnings:</div>
                <ul className="list-disc ml-4 text-sm text-yellow-600">
                  {buildResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDeployTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Package Deployment</h3>
        <button
          onClick={() => setShowNewDeploymentForm(true)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Deployment Target
        </button>
      </div>

      {/* Deployment Targets List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Server/Path</th>
              <th className="px-4 py-2 text-left">Last Deployed</th>
              <th className="px-4 py-2 text-left">Count</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deploymentTargets.map(target => (
              <tr key={target.id}>
                <td className="px-4 py-2 font-medium">{target.name}</td>
                <td className="px-4 py-2">{target.type.toUpperCase()}</td>
                <td className="px-4 py-2">{target.serverUrl || target.remotePath || '-'}</td>
                <td className="px-4 py-2">
                  {target.lastDeployed?.toLocaleDateString() || 'Never'}
                </td>
                <td className="px-4 py-2">{target.deployCount}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      buildResult?.packagePath && handleDeploy(buildResult.packagePath, target.id)
                    }
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    disabled={!buildResult?.success || loading}
                  >
                    Deploy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!buildResult?.success && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
          Build a package first before deploying.
        </div>
      )}

      {/* Add Deployment Target Form */}
      {showNewDeploymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Deployment Target</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Name:</label>
                <input
                  type="text"
                  value={newDeploymentData.name}
                  onChange={e => setNewDeploymentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Production Server"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deployment Type:</label>
                <select
                  value={newDeploymentData.type}
                  onChange={e =>
                    setNewDeploymentData(prev => ({ ...prev, type: e.target.value as any }))
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="ftp">FTP Server</option>
                  <option value="web">Web Server</option>
                  <option value="network">Network Share</option>
                  <option value="cd">CD-ROM</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {(newDeploymentData.type === 'ftp' || newDeploymentData.type === 'web') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Server URL:</label>
                    <input
                      type="text"
                      value={newDeploymentData.serverUrl}
                      onChange={e =>
                        setNewDeploymentData(prev => ({ ...prev, serverUrl: e.target.value }))
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="ftp://server.com or http://server.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Username:</label>
                    <input
                      type="text"
                      value={newDeploymentData.username}
                      onChange={e =>
                        setNewDeploymentData(prev => ({ ...prev, username: e.target.value }))
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password:</label>
                    <input
                      type="password"
                      value={newDeploymentData.password}
                      onChange={e =>
                        setNewDeploymentData(prev => ({ ...prev, password: e.target.value }))
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Remote Path:</label>
                <input
                  type="text"
                  value={newDeploymentData.remotePath}
                  onChange={e =>
                    setNewDeploymentData(prev => ({ ...prev, remotePath: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="/public_html/downloads"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="testConnection"
                    checked={newDeploymentData.testConnection}
                    onChange={e =>
                      setNewDeploymentData(prev => ({ ...prev, testConnection: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="testConnection" className="text-sm">
                    Test Connection Before Deploy
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="overwriteExisting"
                    checked={newDeploymentData.overwriteExisting}
                    onChange={e =>
                      setNewDeploymentData(prev => ({
                        ...prev,
                        overwriteExisting: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="overwriteExisting" className="text-sm">
                    Overwrite Existing Files
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="createBackup"
                    checked={newDeploymentData.createBackup}
                    onChange={e =>
                      setNewDeploymentData(prev => ({ ...prev, createBackup: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="createBackup" className="text-sm">
                    Create Backup
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewDeploymentForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeploymentTarget}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newDeploymentData.name}
              >
                Add Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => {
    const stats = VB6PackageWizardInstance.getPackageStats();

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Package & Deployment Statistics</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Total Projects</div>
            <div className="text-lg text-blue-600">{stats.totalProjects}</div>
          </div>
          <div>
            <div className="font-medium">Total Builds</div>
            <div className="text-lg text-green-600">{stats.totalBuilds}</div>
          </div>
          <div>
            <div className="font-medium">Avg Package Size</div>
            <div className="text-lg text-purple-600">
              {(stats.averagePackageSize / 1024).toFixed(1)} KB
            </div>
          </div>
          <div>
            <div className="font-medium">Dependencies</div>
            <div className="text-lg text-orange-600">
              {stats.dependencyStats.totalDependencies}
              {stats.dependencyStats.missingDependencies > 0 && (
                <span className="text-red-500 text-xs ml-1">
                  ({stats.dependencyStats.missingDependencies} missing)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white border rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-xl font-bold">VB6 Package & Deployment Wizard</h2>
          <p className="text-sm text-gray-600">
            Create installation packages and deploy applications
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="px-3 py-1 border rounded hover:bg-gray-100">
            Close
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b bg-gray-50">
        {[
          { id: 'projects', label: 'Projects', icon: '📦' },
          { id: 'files', label: 'Files', icon: '📁' },
          { id: 'dependencies', label: 'Dependencies', icon: '🔗' },
          { id: 'registry', label: 'Registry', icon: '🗃️' },
          { id: 'shortcuts', label: 'Shortcuts', icon: '🔗' },
          { id: 'build', label: 'Build', icon: '🔧' },
          { id: 'deploy', label: 'Deploy', icon: '🚀' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'projects' && renderProjectsTab()}
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'dependencies' && renderDependenciesTab()}
        {activeTab === 'registry' && renderRegistryTab()}
        {activeTab === 'shortcuts' && renderShortcutsTab()}
        {activeTab === 'build' && renderBuildTab()}
        {activeTab === 'deploy' && renderDeployTab()}

        {/* Statistics */}
        {renderStatistics()}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              Processing...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VB6PackageWizardUI;
