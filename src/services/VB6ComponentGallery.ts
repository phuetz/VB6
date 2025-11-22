/**
 * VB6 Component Gallery - Complete Component Management System
 * Manages VB6 components including OCX controls, DLL libraries, and Add-ins
 * Provides component browsing, installation, registration, and dependency management
 */

export enum VB6ComponentType {
  OCX_CONTROL = 'ocx',
  DLL_LIBRARY = 'dll',
  TYPE_LIBRARY = 'tlb',
  ADDON = 'addon',
  TEMPLATE = 'template',
  SNIPPET = 'snippet',
  REFERENCE = 'reference'
}

export enum VB6ComponentCategory {
  DATA_ACCESS = 'data_access',
  USER_INTERFACE = 'user_interface',
  GRAPHICS = 'graphics',
  NETWORKING = 'networking',
  FILE_SYSTEM = 'file_system',
  MULTIMEDIA = 'multimedia',
  SYSTEM = 'system',
  THIRD_PARTY = 'third_party',
  CUSTOM = 'custom',
  DEVELOPMENT_TOOLS = 'development_tools'
}

export enum VB6ComponentStatus {
  AVAILABLE = 'available',
  INSTALLED = 'installed',
  REGISTERED = 'registered',
  BROKEN = 'broken',
  NEEDS_UPDATE = 'needs_update',
  DOWNLOADING = 'downloading',
  INSTALLING = 'installing'
}

export interface VB6ComponentInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  type: VB6ComponentType;
  category: VB6ComponentCategory;
  status: VB6ComponentStatus;
  
  // File information
  fileName: string;
  filePath?: string;
  fileSize: number;
  checksum: string;
  
  // Registration information
  clsid?: string;
  progId?: string;
  typeLibId?: string;
  interfaces?: string[];
  
  // Dependencies
  dependencies: VB6ComponentDependency[];
  requiredRuntime?: string[];
  
  // Metadata
  created: Date;
  modified: Date;
  installed?: Date;
  
  // Properties and methods
  properties?: VB6ComponentProperty[];
  methods?: VB6ComponentMethod[];
  events?: VB6ComponentEvent[];
  
  // Documentation
  helpFile?: string;
  helpUrl?: string;
  documentation?: string;
  examples?: VB6ComponentExample[];
  
  // Licensing
  license?: string;
  commercial: boolean;
  trialVersion: boolean;
  
  // Compatibility
  vb6Version: string[];
  windowsVersion: string[];
  platformSupport: ('x86' | 'x64' | 'arm')[];
  
  // Gallery metadata
  downloadCount: number;
  rating: number;
  reviews: VB6ComponentReview[];
  tags: string[];
  screenshots?: string[];
  
  // Installation data
  registryEntries?: VB6RegistryEntry[];
  fileReferences?: string[];
  toolboxBitmap?: string;
}

export interface VB6ComponentDependency {
  name: string;
  version: string;
  type: VB6ComponentType;
  required: boolean;
  available: boolean;
}

export interface VB6ComponentProperty {
  name: string;
  type: string;
  description: string;
  defaultValue?: any;
  readOnly: boolean;
}

export interface VB6ComponentMethod {
  name: string;
  description: string;
  parameters: VB6ComponentParameter[];
  returnType?: string;
}

export interface VB6ComponentParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
}

export interface VB6ComponentEvent {
  name: string;
  description: string;
  parameters: VB6ComponentParameter[];
}

export interface VB6ComponentExample {
  title: string;
  description: string;
  code: string;
  language: 'vb6' | 'vbscript' | 'javascript';
}

export interface VB6ComponentReview {
  author: string;
  rating: number;
  comment: string;
  date: Date;
  helpfulVotes: number;
}

export interface VB6RegistryEntry {
  key: string;
  name: string;
  value: string;
  type: 'string' | 'dword' | 'binary';
}

export interface VB6ComponentSearchFilter {
  type?: VB6ComponentType[];
  category?: VB6ComponentCategory[];
  status?: VB6ComponentStatus[];
  author?: string;
  minRating?: number;
  commercial?: boolean;
  tags?: string[];
  searchText?: string;
}

export interface VB6ComponentInstallOptions {
  registerComponent: boolean;
  addToToolbox: boolean;
  createShortcuts: boolean;
  installDependencies: boolean;
  backupExisting: boolean;
  installPath?: string;
}

export class VB6ComponentGallery {
  private static instance: VB6ComponentGallery;
  private components: Map<string, VB6ComponentInfo> = new Map();
  private installedComponents: Map<string, VB6ComponentInfo> = new Map();
  private categories: Map<VB6ComponentCategory, VB6ComponentInfo[]> = new Map();
  private isInitialized: boolean = false;

  static getInstance(): VB6ComponentGallery {
    if (!VB6ComponentGallery.instance) {
      VB6ComponentGallery.instance = new VB6ComponentGallery();
    }
    return VB6ComponentGallery.instance;
  }

  constructor() {
    this.initializeBuiltInComponents();
  }

  // Initialize with built-in VB6 components
  private initializeBuiltInComponents(): void {
    // Standard VB6 Controls
    this.addComponent({
      id: 'vb6-textbox',
      name: 'TextBox',
      description: 'Standard text input control',
      version: '6.0',
      author: 'Microsoft Corporation',
      type: VB6ComponentType.OCX_CONTROL,
      category: VB6ComponentCategory.USER_INTERFACE,
      status: VB6ComponentStatus.INSTALLED,
      fileName: 'MSCOMCTL.OCX',
      fileSize: 1025024,
      checksum: 'ABC123',
      clsid: '{8BD21D10-EC42-11CE-9E0D-00AA006002F3}',
      progId: 'VB.TextBox',
      dependencies: [],
      created: new Date('1998-01-01'),
      modified: new Date('1998-01-01'),
      commercial: false,
      trialVersion: false,
      vb6Version: ['6.0'],
      windowsVersion: ['95', '98', 'NT4', '2000', 'XP', '7', '10', '11'],
      platformSupport: ['x86', 'x64'],
      downloadCount: 1000000,
      rating: 4.8,
      reviews: [],
      tags: ['input', 'text', 'standard', 'microsoft'],
      properties: [
        { name: 'Text', type: 'String', description: 'The text displayed in the control', readOnly: false },
        { name: 'MaxLength', type: 'Integer', description: 'Maximum number of characters', readOnly: false },
        { name: 'MultiLine', type: 'Boolean', description: 'Allow multiple lines', readOnly: false }
      ],
      methods: [
        { name: 'SetFocus', description: 'Sets focus to the control', parameters: [], returnType: 'Void' },
        { name: 'Clear', description: 'Clears the text', parameters: [], returnType: 'Void' }
      ],
      events: [
        { name: 'Change', description: 'Fired when text changes', parameters: [] },
        { name: 'KeyPress', description: 'Fired when key is pressed', parameters: [
          { name: 'KeyAscii', type: 'Integer', optional: false }
        ]}
      ]
    });

    // Microsoft Common Controls
    this.addComponent({
      id: 'mscomctl-ocx',
      name: 'Microsoft Common Controls 6.0',
      description: 'TreeView, ListView, ImageList, ProgressBar and other common controls',
      version: '6.0.88.77',
      author: 'Microsoft Corporation',
      type: VB6ComponentType.OCX_CONTROL,
      category: VB6ComponentCategory.USER_INTERFACE,
      status: VB6ComponentStatus.AVAILABLE,
      fileName: 'MSCOMCTL.OCX',
      fileSize: 1025024,
      checksum: 'DEF456',
      clsid: '{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}',
      progId: 'MSComctlLib.TreeView',
      dependencies: [],
      created: new Date('1998-01-01'),
      modified: new Date('2002-01-01'),
      commercial: false,
      trialVersion: false,
      vb6Version: ['6.0'],
      windowsVersion: ['95', '98', 'NT4', '2000', 'XP', '7', '10', '11'],
      platformSupport: ['x86', 'x64'],
      downloadCount: 950000,
      rating: 4.7,
      reviews: [],
      tags: ['treeview', 'listview', 'imagelist', 'progressbar', 'microsoft'],
      properties: [
        { name: 'Nodes', type: 'Nodes', description: 'Collection of tree nodes', readOnly: true },
        { name: 'ImageList', type: 'Object', description: 'Associated ImageList control', readOnly: false }
      ],
      methods: [
        { name: 'Expand', description: 'Expands a node', parameters: [
          { name: 'Node', type: 'Node', optional: false }
        ], returnType: 'Void' }
      ],
      events: [
        { name: 'NodeClick', description: 'Fired when node is clicked', parameters: [
          { name: 'Node', type: 'Node', optional: false }
        ]}
      ]
    });

    // ADO Data Control
    this.addComponent({
      id: 'adodc-control',
      name: 'Microsoft ADO Data Control 6.0',
      description: 'ActiveX Data Objects data binding control',
      version: '6.0.8169',
      author: 'Microsoft Corporation',
      type: VB6ComponentType.OCX_CONTROL,
      category: VB6ComponentCategory.DATA_ACCESS,
      status: VB6ComponentStatus.AVAILABLE,
      fileName: 'MSADODC.OCX',
      fileSize: 118784,
      checksum: 'GHI789',
      clsid: '{67397AA1-7FB1-11D0-B148-00A0C922E820}',
      progId: 'ADODB.Connection',
      dependencies: [
        { name: 'Microsoft ActiveX Data Objects 2.8 Library', version: '2.8', type: VB6ComponentType.TYPE_LIBRARY, required: true, available: true }
      ],
      created: new Date('1999-01-01'),
      modified: new Date('2002-01-01'),
      commercial: false,
      trialVersion: false,
      vb6Version: ['6.0'],
      windowsVersion: ['98', 'NT4', '2000', 'XP', '7', '10', '11'],
      platformSupport: ['x86', 'x64'],
      downloadCount: 750000,
      rating: 4.5,
      reviews: [],
      tags: ['ado', 'database', 'data', 'binding', 'microsoft'],
      properties: [
        { name: 'ConnectionString', type: 'String', description: 'Database connection string', readOnly: false },
        { name: 'RecordSource', type: 'String', description: 'SQL query or table name', readOnly: false }
      ],
      methods: [
        { name: 'Refresh', description: 'Refreshes the recordset', parameters: [], returnType: 'Void' }
      ],
      events: [
        { name: 'WillChangeRecord', description: 'Before record changes', parameters: [] }
      ]
    });

    // Microsoft FlexGrid Control
    this.addComponent({
      id: 'msflexgrid-control',
      name: 'Microsoft FlexGrid Control 6.0',
      description: 'Flexible grid control for displaying data',
      version: '6.0.88.77',
      author: 'Microsoft Corporation',
      type: VB6ComponentType.OCX_CONTROL,
      category: VB6ComponentCategory.USER_INTERFACE,
      status: VB6ComponentStatus.AVAILABLE,
      fileName: 'MSFLXGRD.OCX',
      fileSize: 244736,
      checksum: 'JKL012',
      clsid: '{6262D3A0-531B-11CF-91F6-C2863C385E30}',
      progId: 'MSFlexGridLib.MSFlexGrid',
      dependencies: [],
      created: new Date('1998-01-01'),
      modified: new Date('2002-01-01'),
      commercial: false,
      trialVersion: false,
      vb6Version: ['6.0'],
      windowsVersion: ['95', '98', 'NT4', '2000', 'XP', '7', '10', '11'],
      platformSupport: ['x86', 'x64'],
      downloadCount: 650000,
      rating: 4.6,
      reviews: [],
      tags: ['grid', 'flexgrid', 'data', 'table', 'microsoft'],
      properties: [
        { name: 'Rows', type: 'Long', description: 'Number of rows', readOnly: false },
        { name: 'Cols', type: 'Long', description: 'Number of columns', readOnly: false },
        { name: 'Text', type: 'String', description: 'Text in current cell', readOnly: false }
      ],
      methods: [
        { name: 'Clear', description: 'Clears all data', parameters: [], returnType: 'Void' }
      ],
      events: [
        { name: 'Click', description: 'Cell clicked', parameters: [] }
      ]
    });

    // Winsock Control
    this.addComponent({
      id: 'winsock-control',
      name: 'Microsoft Winsock Control 6.0',
      description: 'TCP/UDP networking control',
      version: '6.0.88.77',
      author: 'Microsoft Corporation',
      type: VB6ComponentType.OCX_CONTROL,
      category: VB6ComponentCategory.NETWORKING,
      status: VB6ComponentStatus.AVAILABLE,
      fileName: 'MSWINSCK.OCX',
      fileSize: 108544,
      checksum: 'MNO345',
      clsid: '{248DD896-BB45-11CF-9ABC-0080C7E7B78D}',
      progId: 'MSWinsockLib.Winsock',
      dependencies: [],
      created: new Date('1998-01-01'),
      modified: new Date('2002-01-01'),
      commercial: false,
      trialVersion: false,
      vb6Version: ['6.0'],
      windowsVersion: ['95', '98', 'NT4', '2000', 'XP', '7', '10', '11'],
      platformSupport: ['x86', 'x64'],
      downloadCount: 400000,
      rating: 4.2,
      reviews: [],
      tags: ['winsock', 'tcp', 'udp', 'networking', 'socket', 'microsoft'],
      properties: [
        { name: 'RemoteHost', type: 'String', description: 'Remote host address', readOnly: false },
        { name: 'RemotePort', type: 'Long', description: 'Remote port number', readOnly: false },
        { name: 'Protocol', type: 'ProtocolConstants', description: 'TCP or UDP protocol', readOnly: false }
      ],
      methods: [
        { name: 'Connect', description: 'Connect to remote host', parameters: [], returnType: 'Void' },
        { name: 'Listen', description: 'Listen for connections', parameters: [], returnType: 'Void' },
        { name: 'SendData', description: 'Send data', parameters: [
          { name: 'Data', type: 'Variant', optional: false }
        ], returnType: 'Void' }
      ],
      events: [
        { name: 'Connect', description: 'Connection established', parameters: [] },
        { name: 'DataArrival', description: 'Data received', parameters: [
          { name: 'bytesTotal', type: 'Long', optional: false }
        ]}
      ]
    });

    this.isInitialized = true;
  }

  // Component Management
  addComponent(component: VB6ComponentInfo): void {
    this.components.set(component.id, component);
    
    // Add to category
    if (!this.categories.has(component.category)) {
      this.categories.set(component.category, []);
    }
    this.categories.get(component.category)!.push(component);
    
    // Add to installed if status is installed
    if (component.status === VB6ComponentStatus.INSTALLED || 
        component.status === VB6ComponentStatus.REGISTERED) {
      this.installedComponents.set(component.id, component);
    }
  }

  getComponent(id: string): VB6ComponentInfo | null {
    return this.components.get(id) || null;
  }

  getAllComponents(): VB6ComponentInfo[] {
    return Array.from(this.components.values());
  }

  getComponentsByCategory(category: VB6ComponentCategory): VB6ComponentInfo[] {
    return this.categories.get(category) || [];
  }

  getInstalledComponents(): VB6ComponentInfo[] {
    return Array.from(this.installedComponents.values());
  }

  // Search and Filter
  searchComponents(filter: VB6ComponentSearchFilter): VB6ComponentInfo[] {
    let results = Array.from(this.components.values());

    if (filter.type && filter.type.length > 0) {
      results = results.filter(c => filter.type!.includes(c.type));
    }

    if (filter.category && filter.category.length > 0) {
      results = results.filter(c => filter.category!.includes(c.category));
    }

    if (filter.status && filter.status.length > 0) {
      results = results.filter(c => filter.status!.includes(c.status));
    }

    if (filter.author) {
      results = results.filter(c => c.author.toLowerCase().includes(filter.author!.toLowerCase()));
    }

    if (filter.minRating !== undefined) {
      results = results.filter(c => c.rating >= filter.minRating!);
    }

    if (filter.commercial !== undefined) {
      results = results.filter(c => c.commercial === filter.commercial);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(c => 
        filter.tags!.some(tag => c.tags.some(ctag => ctag.toLowerCase().includes(tag.toLowerCase())))
      );
    }

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      results = results.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  // Component Installation
  async installComponent(componentId: string, options: VB6ComponentInstallOptions = {
    registerComponent: true,
    addToToolbox: true,
    createShortcuts: false,
    installDependencies: true,
    backupExisting: true
  }): Promise<boolean> {
    const component = this.getComponent(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    try {
      // Check dependencies
      if (options.installDependencies) {
        for (const dep of component.dependencies) {
          if (dep.required && !dep.available) {
            throw new Error(`Required dependency ${dep.name} is not available`);
          }
        }
      }

      // Update status
      component.status = VB6ComponentStatus.INSTALLING;
      
      // Simulate installation process
      await this.simulateInstallation(component, options);
      
      // Mark as installed
      component.status = VB6ComponentStatus.INSTALLED;
      component.installed = new Date();
      this.installedComponents.set(componentId, component);
      
      return true;
    } catch (error) {
      component.status = VB6ComponentStatus.BROKEN;
      throw error;
    }
  }

  async uninstallComponent(componentId: string): Promise<boolean> {
    const component = this.getComponent(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    try {
      // Check if other components depend on this one
      const dependentComponents = this.findDependentComponents(componentId);
      if (dependentComponents.length > 0) {
        throw new Error(`Cannot uninstall ${component.name} because it is required by: ${dependentComponents.map(c => c.name).join(', ')}`);
      }

      // Simulate uninstallation
      await this.simulateUninstallation(component);
      
      // Update status
      component.status = VB6ComponentStatus.AVAILABLE;
      component.installed = undefined;
      this.installedComponents.delete(componentId);
      
      return true;
    } catch (error) {
      component.status = VB6ComponentStatus.BROKEN;
      throw error;
    }
  }

  async registerComponent(componentId: string): Promise<boolean> {
    const component = this.getComponent(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    if (component.status !== VB6ComponentStatus.INSTALLED) {
      throw new Error(`Component ${component.name} must be installed before registration`);
    }

    try {
      // Simulate registration
      await this.simulateRegistration(component);
      component.status = VB6ComponentStatus.REGISTERED;
      return true;
    } catch (error) {
      component.status = VB6ComponentStatus.BROKEN;
      throw error;
    }
  }

  // Component Information
  getComponentInfo(componentId: string): VB6ComponentInfo | null {
    return this.getComponent(componentId);
  }

  getComponentDependencies(componentId: string): VB6ComponentDependency[] {
    const component = this.getComponent(componentId);
    return component ? component.dependencies : [];
  }

  findDependentComponents(componentId: string): VB6ComponentInfo[] {
    const dependentComponents: VB6ComponentInfo[] = [];
    
    for (const component of this.components.values()) {
      if (component.dependencies.some(dep => dep.name === componentId)) {
        dependentComponents.push(component);
      }
    }
    
    return dependentComponents;
  }

  // Component Statistics
  getComponentStats(): { 
    total: number; 
    installed: number; 
    byCategory: Map<VB6ComponentCategory, number>;
    byType: Map<VB6ComponentType, number>;
  } {
    const stats = {
      total: this.components.size,
      installed: this.installedComponents.size,
      byCategory: new Map<VB6ComponentCategory, number>(),
      byType: new Map<VB6ComponentType, number>()
    };

    for (const component of this.components.values()) {
      // Count by category
      const catCount = stats.byCategory.get(component.category) || 0;
      stats.byCategory.set(component.category, catCount + 1);
      
      // Count by type
      const typeCount = stats.byType.get(component.type) || 0;
      stats.byType.set(component.type, typeCount + 1);
    }

    return stats;
  }

  // Utility Methods
  private async simulateInstallation(component: VB6ComponentInfo, options: VB6ComponentInstallOptions): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Installing component: ${component.name}`);
        console.log(`File: ${component.fileName}`);
        console.log(`Options:`, options);
        resolve();
      }, 1000);
    });
  }

  private async simulateUninstallation(component: VB6ComponentInfo): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Uninstalling component: ${component.name}`);
        resolve();
      }, 500);
    });
  }

  private async simulateRegistration(component: VB6ComponentInfo): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Registering component: ${component.name}`);
        if (component.clsid) {
          console.log(`CLSID: ${component.clsid}`);
        }
        if (component.progId) {
          console.log(`ProgID: ${component.progId}`);
        }
        resolve();
      }, 500);
    });
  }

  // Export/Import
  exportComponentList(): string {
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      components: Array.from(this.components.values())
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  async importComponentList(jsonData: string): Promise<number> {
    try {
      const importData = JSON.parse(jsonData);
      let importCount = 0;
      
      if (importData.components && Array.isArray(importData.components)) {
        for (const componentData of importData.components) {
          this.addComponent(componentData);
          importCount++;
        }
      }
      
      return importCount;
    } catch (error) {
      throw new Error(`Error importing component list: ${error}`);
    }
  }
}

// Global instance
export const VB6ComponentGalleryInstance = VB6ComponentGallery.getInstance();

// Helper functions for VB6 compatibility
export function LoadComponentLibrary(path: string): boolean {
  try {
    console.log(`Loading component library: ${path}`);
    // In a real implementation, would load the actual library
    return true;
  } catch (error) {
    console.error(`Error loading component library: ${error}`);
    return false;
  }
}

export function RegisterComponent(path: string): boolean {
  try {
    console.log(`Registering component: ${path}`);
    // In a real implementation, would register with Windows registry
    return true;
  } catch (error) {
    console.error(`Error registering component: ${error}`);
    return false;
  }
}

export function UnregisterComponent(clsid: string): boolean {
  try {
    console.log(`Unregistering component: ${clsid}`);
    // In a real implementation, would unregister from Windows registry
    return true;
  } catch (error) {
    console.error(`Error unregistering component: ${error}`);
    return false;
  }
}

console.log('VB6 Component Gallery initialized with built-in component library');