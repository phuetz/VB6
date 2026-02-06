import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Add-in Types
export enum AddInType {
  IDEExtension = 'IDE Extension',
  CodeGenerator = 'Code Generator',
  Debugger = 'Debugger Extension',
  SourceControl = 'Source Control',
  Designer = 'Designer',
  Wizard = 'Wizard',
  Utility = 'Utility',
  ImportExport = 'Import/Export',
  Documentation = 'Documentation',
  Testing = 'Testing',
  Deployment = 'Deployment',
}

export enum AddInStatus {
  Loaded = 'Loaded',
  Unloaded = 'Unloaded',
  Error = 'Error',
  Disabled = 'Disabled',
  Loading = 'Loading',
  Unloading = 'Unloading',
}

export enum AddInTrustLevel {
  Trusted = 'Trusted',
  Untrusted = 'Untrusted',
  Sandboxed = 'Sandboxed',
  Restricted = 'Restricted',
}

export enum AddInConnectMode {
  Startup = 'Startup',
  Manual = 'Manual',
  OnDemand = 'OnDemand',
  External = 'External',
}

// Add-in Interface
export interface AddInInterface {
  name: string;
  description: string;
  methods: Array<{
    name: string;
    parameters: Array<{
      name: string;
      type: string;
      optional: boolean;
    }>;
    returnType?: string;
    description: string;
  }>;
  events: Array<{
    name: string;
    parameters: Array<{
      name: string;
      type: string;
    }>;
    description: string;
  }>;
  properties: Array<{
    name: string;
    type: string;
    readonly: boolean;
    description: string;
  }>;
}

// Add-in Information
export interface AddInInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  company: string;
  website?: string;
  email?: string;
  type: AddInType;
  status: AddInStatus;
  trustLevel: AddInTrustLevel;
  connectMode: AddInConnectMode;
  filename: string;
  path: string;
  progId?: string;
  clsId?: string;
  created: Date;
  modified: Date;
  size: number;
  dependencies: string[];
  requiredVersion: string;
  maxVersion?: string;
  interfaces: AddInInterface[];
  menuItems: Array<{
    caption: string;
    command: string;
    shortcut?: string;
    icon?: string;
    enabled: boolean;
    visible: boolean;
  }>;
  toolbarButtons: Array<{
    caption: string;
    command: string;
    icon: string;
    tooltip: string;
    enabled: boolean;
    visible: boolean;
  }>;
  settings: Record<string, any>;
  permissions: Array<{
    name: string;
    granted: boolean;
    description: string;
  }>;
  lastError?: string;
  loadTime?: number;
  performance: {
    startupTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// Add-in Event
export interface AddInEvent {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  cancellable: boolean;
  source: string;
}

// Add-in Manager Settings
export interface AddInManagerSettings {
  autoLoadOnStartup: boolean;
  enableSecurityChecks: boolean;
  allowUntrustedAddIns: boolean;
  maxLoadTime: number;
  enablePerformanceMonitoring: boolean;
  sandboxUntrustedAddIns: boolean;
  trustedPublishers: string[];
  blockedAddIns: string[];
}

interface AddInSystemProps {
  onAddInLoaded?: (addIn: AddInInfo) => void;
  onAddInUnloaded?: (addIn: AddInInfo) => void;
  onAddInError?: (addIn: AddInInfo, error: string) => void;
  onCommand?: (command: string, addIn: AddInInfo) => void;
}

export const AddInSystem: React.FC<AddInSystemProps> = ({
  onAddInLoaded,
  onAddInUnloaded,
  onAddInError,
  onCommand,
}) => {
  const [selectedTab, setSelectedTab] = useState<
    'installed' | 'available' | 'develop' | 'settings'
  >('installed');
  const [addIns, setAddIns] = useState<AddInInfo[]>([]);
  const [selectedAddIn, setSelectedAddIn] = useState<AddInInfo | null>(null);
  const [availableAddIns, setAvailableAddIns] = useState<AddInInfo[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AddInStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<AddInType | 'All'>('All');
  const [showDetails, setShowDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeveloperDialog, setShowDeveloperDialog] = useState(false);
  const [settings, setSettings] = useState<AddInManagerSettings>({
    autoLoadOnStartup: true,
    enableSecurityChecks: true,
    allowUntrustedAddIns: false,
    maxLoadTime: 10000,
    enablePerformanceMonitoring: true,
    sandboxUntrustedAddIns: true,
    trustedPublishers: [],
    blockedAddIns: [],
  });
  const [developerForm, setDeveloperForm] = useState<Partial<AddInInfo>>({
    type: AddInType.IDEExtension,
    connectMode: AddInConnectMode.Manual,
    trustLevel: AddInTrustLevel.Untrusted,
    interfaces: [],
    menuItems: [],
    toolbarButtons: [],
    settings: {},
    permissions: [],
    dependencies: [],
  });
  const [events, setEvents] = useState<AddInEvent[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `addon_${nextId.current++}`, []);

  // Sample add-ins data
  const sampleAddIns: AddInInfo[] = [
    {
      id: 'addon_1',
      name: 'CodeFormatter',
      displayName: 'VB6 Code Formatter',
      description: 'Automatically formats and beautifies VB6 code according to coding standards.',
      version: '2.1.0',
      author: 'DevTools Team',
      company: 'Microsoft',
      website: 'https://example.com/codeformatter',
      email: 'support@devtools.com',
      type: AddInType.CodeGenerator,
      status: AddInStatus.Loaded,
      trustLevel: AddInTrustLevel.Trusted,
      connectMode: AddInConnectMode.Startup,
      filename: 'CodeFormatter.dll',
      path: 'C:\\AddIns\\CodeFormatter.dll',
      progId: 'VB6AddIns.CodeFormatter',
      clsId: '{12345678-1234-1234-1234-123456789ABC}',
      created: new Date('2023-01-15'),
      modified: new Date('2023-06-20'),
      size: 128000,
      dependencies: ['vb6ext.tlb', 'msxml6.dll'],
      requiredVersion: '6.0',
      interfaces: [
        {
          name: 'ICodeFormatter',
          description: 'Main code formatting interface',
          methods: [
            {
              name: 'FormatCode',
              parameters: [
                { name: 'code', type: 'String', optional: false },
                { name: 'options', type: 'FormatOptions', optional: true },
              ],
              returnType: 'String',
              description: 'Formats the provided VB6 code',
            },
          ],
          events: [
            {
              name: 'FormatComplete',
              parameters: [{ name: 'result', type: 'String' }],
              description: 'Fired when formatting is complete',
            },
          ],
          properties: [
            {
              name: 'IndentSize',
              type: 'Long',
              readonly: false,
              description: 'Number of spaces for indentation',
            },
          ],
        },
      ],
      menuItems: [
        {
          caption: '&Format Code',
          command: 'FormatCurrentFile',
          shortcut: 'Ctrl+Shift+F',
          enabled: true,
          visible: true,
        },
      ],
      toolbarButtons: [
        {
          caption: 'Format',
          command: 'FormatCurrentFile',
          icon: 'format_icon.bmp',
          tooltip: 'Format current code file',
          enabled: true,
          visible: true,
        },
      ],
      settings: {
        indentSize: 4,
        preserveComments: true,
        alignAssignments: false,
      },
      permissions: [
        {
          name: 'FileSystem.Read',
          granted: true,
          description: 'Read source code files',
        },
        {
          name: 'FileSystem.Write',
          granted: true,
          description: 'Write formatted code back to files',
        },
      ],
      performance: {
        startupTime: 250,
        memoryUsage: 2048,
        cpuUsage: 1.2,
      },
    },
    {
      id: 'addon_2',
      name: 'SourceSafe',
      displayName: 'Visual SourceSafe Integration',
      description: 'Integrates Visual SourceSafe source control directly into the VB6 IDE.',
      version: '6.0.1',
      author: 'Microsoft Corporation',
      company: 'Microsoft',
      type: AddInType.SourceControl,
      status: AddInStatus.Loaded,
      trustLevel: AddInTrustLevel.Trusted,
      connectMode: AddInConnectMode.Startup,
      filename: 'VSSAddIn.dll',
      path: 'C:\\Program Files\\Microsoft Visual Studio\\VB98\\AddIns\\VSSAddIn.dll',
      progId: 'SourceSafeTypeLib.VSSAddIn',
      created: new Date('2023-02-10'),
      modified: new Date('2023-05-15'),
      size: 256000,
      dependencies: ['vss.tlb', 'ssapi.dll'],
      requiredVersion: '6.0',
      interfaces: [
        {
          name: 'ISourceControl',
          description: 'Source control operations interface',
          methods: [
            {
              name: 'CheckOut',
              parameters: [{ name: 'filename', type: 'String', optional: false }],
              returnType: 'Boolean',
              description: 'Checks out a file from source control',
            },
            {
              name: 'CheckIn',
              parameters: [
                { name: 'filename', type: 'String', optional: false },
                { name: 'comment', type: 'String', optional: true },
              ],
              returnType: 'Boolean',
              description: 'Checks in a file to source control',
            },
          ],
          events: [
            {
              name: 'FileCheckedOut',
              parameters: [{ name: 'filename', type: 'String' }],
              description: 'Fired when a file is checked out',
            },
          ],
          properties: [
            {
              name: 'Database',
              type: 'String',
              readonly: false,
              description: 'Path to SourceSafe database',
            },
          ],
        },
      ],
      menuItems: [
        {
          caption: 'Check &Out',
          command: 'CheckOutFile',
          enabled: true,
          visible: true,
        },
        {
          caption: 'Check &In',
          command: 'CheckInFile',
          enabled: true,
          visible: true,
        },
      ],
      toolbarButtons: [
        {
          caption: 'VSS',
          command: 'ShowVSSExplorer',
          icon: 'vss_icon.bmp',
          tooltip: 'Show Visual SourceSafe Explorer',
          enabled: true,
          visible: true,
        },
      ],
      settings: {
        database: 'C:\\VSS\\srcsafe.ini',
        autoCheckOut: false,
        promptForComments: true,
      },
      permissions: [
        {
          name: 'FileSystem.Read',
          granted: true,
          description: 'Read project files',
        },
        {
          name: 'FileSystem.Write',
          granted: true,
          description: 'Update file status',
        },
        {
          name: 'Network.Access',
          granted: true,
          description: 'Access SourceSafe database',
        },
      ],
      performance: {
        startupTime: 500,
        memoryUsage: 4096,
        cpuUsage: 0.8,
      },
    },
    {
      id: 'addon_3',
      name: 'APIHelper',
      displayName: 'Windows API Helper',
      description: 'Provides quick access to Windows API declarations and constants.',
      version: '1.3.0',
      author: 'Community Developer',
      company: 'Open Source',
      type: AddInType.Utility,
      status: AddInStatus.Unloaded,
      trustLevel: AddInTrustLevel.Untrusted,
      connectMode: AddInConnectMode.Manual,
      filename: 'APIHelper.dll',
      path: 'C:\\AddIns\\APIHelper.dll',
      created: new Date('2023-04-05'),
      modified: new Date('2023-07-10'),
      size: 96000,
      dependencies: ['vb6ext.tlb'],
      requiredVersion: '6.0',
      interfaces: [],
      menuItems: [
        {
          caption: '&API Helper',
          command: 'ShowAPIHelper',
          shortcut: 'Ctrl+F1',
          enabled: true,
          visible: true,
        },
      ],
      toolbarButtons: [],
      settings: {
        showOnStartup: false,
        cacheDeclarations: true,
      },
      permissions: [
        {
          name: 'IDE.Access',
          granted: false,
          description: 'Access to IDE object model',
        },
      ],
      performance: {
        startupTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
    },
  ];

  // Initialize add-ins
  useEffect(() => {
    setAddIns(sampleAddIns);
    setAvailableAddIns([]);

    // Load startup add-ins
    if (settings.autoLoadOnStartup) {
      sampleAddIns
        .filter(a => a.connectMode === AddInConnectMode.Startup)
        .forEach(addIn => {
          if (addIn.status === AddInStatus.Unloaded) {
            loadAddIn(addIn.id);
          }
        });
    }
  }, []);

  // Filter add-ins
  const filteredAddIns = addIns.filter(addIn => {
    const matchesSearch =
      !searchFilter ||
      addIn.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      addIn.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      addIn.author.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus = statusFilter === 'All' || addIn.status === statusFilter;
    const matchesType = typeFilter === 'All' || addIn.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Load add-in
  const loadAddIn = useCallback(
    async (addInId: string) => {
      const addIn = addIns.find(a => a.id === addInId);
      if (!addIn || addIn.status === AddInStatus.Loaded) return;

      // Update status to loading
      setAddIns(prev =>
        prev.map(a => (a.id === addInId ? { ...a, status: AddInStatus.Loading } : a))
      );

      try {
        // Simulate loading delay
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1000));
        const loadTime = Date.now() - startTime;

        // Security check
        if (
          settings.enableSecurityChecks &&
          addIn.trustLevel === AddInTrustLevel.Untrusted &&
          !settings.allowUntrustedAddIns
        ) {
          throw new Error('Untrusted add-in not allowed by security policy');
        }

        // Check dependencies
        const missingDeps = addIn.dependencies.filter(dep => {
          // Simulate dependency check
          return Math.random() > 0.9; // 10% chance of missing dependency
        });

        if (missingDeps.length > 0) {
          throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
        }

        // Update status to loaded
        setAddIns(prev =>
          prev.map(a =>
            a.id === addInId
              ? {
                  ...a,
                  status: AddInStatus.Loaded,
                  loadTime,
                  performance: {
                    ...a.performance,
                    startupTime: loadTime,
                    memoryUsage: Math.floor(Math.random() * 5000) + 1000,
                    cpuUsage: Math.random() * 2,
                  },
                }
              : a
          )
        );

        onAddInLoaded?.(addIn);
        eventEmitter.current.emit('addInLoaded', addIn);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setAddIns(prev =>
          prev.map(a =>
            a.id === addInId ? { ...a, status: AddInStatus.Error, lastError: errorMessage } : a
          )
        );

        onAddInError?.(addIn, errorMessage);
        eventEmitter.current.emit('addInError', addIn, errorMessage);
      }
    },
    [addIns, settings, onAddInLoaded, onAddInError]
  );

  // Unload add-in
  const unloadAddIn = useCallback(
    async (addInId: string) => {
      const addIn = addIns.find(a => a.id === addInId);
      if (!addIn || addIn.status !== AddInStatus.Loaded) return;

      setAddIns(prev =>
        prev.map(a => (a.id === addInId ? { ...a, status: AddInStatus.Unloading } : a))
      );

      try {
        // Simulate unloading delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setAddIns(prev =>
          prev.map(a =>
            a.id === addInId
              ? {
                  ...a,
                  status: AddInStatus.Unloaded,
                  performance: {
                    ...a.performance,
                    memoryUsage: 0,
                    cpuUsage: 0,
                  },
                }
              : a
          )
        );

        onAddInUnloaded?.(addIn);
        eventEmitter.current.emit('addInUnloaded', addIn);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unload failed';

        setAddIns(prev =>
          prev.map(a =>
            a.id === addInId ? { ...a, status: AddInStatus.Error, lastError: errorMessage } : a
          )
        );

        onAddInError?.(addIn, errorMessage);
      }
    },
    [addIns, onAddInUnloaded, onAddInError]
  );

  // Execute add-in command
  const executeCommand = useCallback(
    (command: string, addInId: string) => {
      const addIn = addIns.find(a => a.id === addInId);
      if (!addIn || addIn.status !== AddInStatus.Loaded) return;

      onCommand?.(command, addIn);
      eventEmitter.current.emit('command', command, addIn);
    },
    [addIns, onCommand]
  );

  // Create new add-in
  const createAddIn = useCallback(() => {
    if (!developerForm.name || !developerForm.displayName) return;

    const newAddIn: AddInInfo = {
      id: generateId(),
      name: developerForm.name,
      displayName: developerForm.displayName,
      description: developerForm.description || '',
      version: developerForm.version || '1.0.0',
      author: developerForm.author || 'Developer',
      company: developerForm.company || '',
      website: developerForm.website,
      email: developerForm.email,
      type: developerForm.type || AddInType.IDEExtension,
      status: AddInStatus.Unloaded,
      trustLevel: developerForm.trustLevel || AddInTrustLevel.Untrusted,
      connectMode: developerForm.connectMode || AddInConnectMode.Manual,
      filename: developerForm.filename || `${developerForm.name}.dll`,
      path: developerForm.path || `C:\\AddIns\\${developerForm.name}.dll`,
      progId: developerForm.progId,
      clsId: developerForm.clsId,
      created: new Date(),
      modified: new Date(),
      size: developerForm.size || 0,
      dependencies: developerForm.dependencies || [],
      requiredVersion: developerForm.requiredVersion || '6.0',
      maxVersion: developerForm.maxVersion,
      interfaces: developerForm.interfaces || [],
      menuItems: developerForm.menuItems || [],
      toolbarButtons: developerForm.toolbarButtons || [],
      settings: developerForm.settings || {},
      permissions: developerForm.permissions || [],
      performance: {
        startupTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
    };

    setAddIns(prev => [...prev, newAddIn]);
    setShowDeveloperDialog(false);
    setDeveloperForm({
      type: AddInType.IDEExtension,
      connectMode: AddInConnectMode.Manual,
      trustLevel: AddInTrustLevel.Untrusted,
      interfaces: [],
      menuItems: [],
      toolbarButtons: [],
      settings: {},
      permissions: [],
      dependencies: [],
    });
  }, [developerForm, generateId]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Add-in Manager</h1>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search add-ins..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded w-64"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as AddInStatus | 'All')}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="All">All Status</option>
                {Object.values(AddInStatus).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as AddInType | 'All')}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="All">All Types</option>
                {Object.values(AddInType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeveloperDialog(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create Add-in
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'installed', label: 'Installed Add-ins', count: addIns.length },
            { key: 'available', label: 'Available', count: availableAddIns.length },
            { key: 'develop', label: 'Developer', count: 0 },
            { key: 'settings', label: 'Settings', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'installed' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              {filteredAddIns.map(addIn => (
                <div key={addIn.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAddInIcon(addIn.type)}</span>
                        <div>
                          <h3 className="font-medium text-lg">{addIn.displayName}</h3>
                          <p className="text-sm text-gray-600">{addIn.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>v{addIn.version}</span>
                            <span>by {addIn.author}</span>
                            <span>{addIn.type}</span>
                            {addIn.loadTime && <span>Load: {addIn.loadTime}ms</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(addIn.status)}`}
                        >
                          {addIn.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getTrustColor(addIn.trustLevel)}`}
                        >
                          {addIn.trustLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedAddIn(addIn);
                          setShowDetails(true);
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Details
                      </button>
                      {addIn.status === AddInStatus.Loaded ? (
                        <button
                          onClick={() => unloadAddIn(addIn.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Unload
                        </button>
                      ) : (
                        <button
                          onClick={() => loadAddIn(addIn.id)}
                          disabled={
                            addIn.status === AddInStatus.Loading ||
                            addIn.status === AddInStatus.Error
                          }
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                          {addIn.status === AddInStatus.Loading ? 'Loading...' : 'Load'}
                        </button>
                      )}
                    </div>
                  </div>

                  {addIn.lastError && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <span className="text-sm text-red-700">{addIn.lastError}</span>
                    </div>
                  )}

                  {addIn.status === AddInStatus.Loaded && addIn.menuItems.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Menu Items:</h4>
                      <div className="flex flex-wrap gap-2">
                        {addIn.menuItems
                          .filter(m => m.enabled)
                          .map((item, index) => (
                            <button
                              key={index}
                              onClick={() => executeCommand(item.command, addIn.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                            >
                              {item.caption} {item.shortcut && `(${item.shortcut})`}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredAddIns.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🔌</div>
                  <p className="text-lg">No add-ins found</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'available' && (
          <div className="flex-1 p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🌐</div>
              <p className="text-lg">Available Add-ins</p>
              <p className="text-sm mt-2">Browse and install add-ins from online repositories</p>
            </div>
          </div>
        )}

        {selectedTab === 'develop' && (
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Add-in Development</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">🛠️ Create New Add-in</h3>
                  <p className="text-gray-600 mb-4">
                    Start developing a new VB6 add-in with our wizard and templates.
                  </p>
                  <button
                    onClick={() => setShowDeveloperDialog(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    New Add-in Project
                  </button>
                </div>

                <div className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">📚 Documentation</h3>
                  <p className="text-gray-600 mb-4">
                    Learn how to create powerful add-ins for the VB6 IDE.
                  </p>
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    View Docs
                  </button>
                </div>

                <div className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">🧪 Test Environment</h3>
                  <p className="text-gray-600 mb-4">
                    Debug and test your add-ins in a sandboxed environment.
                  </p>
                  <button
                    onClick={() => setIsDebugging(!isDebugging)}
                    className={`px-4 py-2 rounded ${
                      isDebugging
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    {isDebugging ? 'Stop Debugging' : 'Start Debug Mode'}
                  </button>
                </div>

                <div className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">📦 Package & Deploy</h3>
                  <p className="text-gray-600 mb-4">
                    Package your add-in for distribution and deployment.
                  </p>
                  <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                    Package Add-in
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Add-in Manager Settings</h2>

              <div className="space-y-6">
                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">General Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.autoLoadOnStartup}
                        onChange={e =>
                          setSettings(prev => ({ ...prev, autoLoadOnStartup: e.target.checked }))
                        }
                      />
                      <span>Auto-load add-ins on startup</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.enablePerformanceMonitoring}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            enablePerformanceMonitoring: e.target.checked,
                          }))
                        }
                      />
                      <span>Enable performance monitoring</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum load time (ms)
                      </label>
                      <input
                        type="number"
                        value={settings.maxLoadTime}
                        onChange={e =>
                          setSettings(prev => ({ ...prev, maxLoadTime: Number(e.target.value) }))
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.enableSecurityChecks}
                        onChange={e =>
                          setSettings(prev => ({ ...prev, enableSecurityChecks: e.target.checked }))
                        }
                      />
                      <span>Enable security checks</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.allowUntrustedAddIns}
                        onChange={e =>
                          setSettings(prev => ({ ...prev, allowUntrustedAddIns: e.target.checked }))
                        }
                      />
                      <span>Allow untrusted add-ins</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.sandboxUntrustedAddIns}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            sandboxUntrustedAddIns: e.target.checked,
                          }))
                        }
                      />
                      <span>Sandbox untrusted add-ins</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Developer Dialog */}
      {showDeveloperDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Create New Add-in</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Name
                  </label>
                  <input
                    type="text"
                    value={developerForm.name || ''}
                    onChange={e => setDeveloperForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="MyAddIn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={developerForm.displayName || ''}
                    onChange={e =>
                      setDeveloperForm(prev => ({ ...prev, displayName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="My VB6 Add-in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={developerForm.description || ''}
                  onChange={e =>
                    setDeveloperForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={developerForm.type}
                    onChange={e =>
                      setDeveloperForm(prev => ({ ...prev, type: e.target.value as AddInType }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(AddInType).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connect Mode
                  </label>
                  <select
                    value={developerForm.connectMode}
                    onChange={e =>
                      setDeveloperForm(prev => ({
                        ...prev,
                        connectMode: e.target.value as AddInConnectMode,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(AddInConnectMode).map(mode => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={developerForm.author || ''}
                    onChange={e => setDeveloperForm(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={developerForm.version || ''}
                    onChange={e => setDeveloperForm(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="1.0.0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeveloperDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createAddIn}
                disabled={!developerForm.name || !developerForm.displayName}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Create Add-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getAddInIcon(type: AddInType): string {
    switch (type) {
      case AddInType.IDEExtension:
        return '🔧';
      case AddInType.CodeGenerator:
        return '⚡';
      case AddInType.Debugger:
        return '🐛';
      case AddInType.SourceControl:
        return '📚';
      case AddInType.Designer:
        return '🎨';
      case AddInType.Wizard:
        return '🪄';
      case AddInType.Utility:
        return '🛠️';
      case AddInType.ImportExport:
        return '📁';
      case AddInType.Documentation:
        return '📖';
      case AddInType.Testing:
        return '🧪';
      case AddInType.Deployment:
        return '🚀';
      default:
        return '🔌';
    }
  }

  function getStatusColor(status: AddInStatus): string {
    switch (status) {
      case AddInStatus.Loaded:
        return 'bg-green-100 text-green-800';
      case AddInStatus.Unloaded:
        return 'bg-gray-100 text-gray-800';
      case AddInStatus.Error:
        return 'bg-red-100 text-red-800';
      case AddInStatus.Disabled:
        return 'bg-yellow-100 text-yellow-800';
      case AddInStatus.Loading:
        return 'bg-blue-100 text-blue-800';
      case AddInStatus.Unloading:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getTrustColor(trustLevel: AddInTrustLevel): string {
    switch (trustLevel) {
      case AddInTrustLevel.Trusted:
        return 'bg-green-100 text-green-800';
      case AddInTrustLevel.Untrusted:
        return 'bg-red-100 text-red-800';
      case AddInTrustLevel.Sandboxed:
        return 'bg-yellow-100 text-yellow-800';
      case AddInTrustLevel.Restricted:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
};

export default AddInSystem;
