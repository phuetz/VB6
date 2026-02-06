/**
 * VB6 Add-in Manager - Complete Add-in Architecture System
 * Manages VB6 IDE add-ins for extending development environment functionality
 * Provides add-in loading, unloading, event handling, and menu integration
 */

import {
  AddInSettingValue,
  AddInEventPayload,
  IDEObjectReference,
  IDEControlReference,
} from './types/VB6ServiceTypes';

export enum VB6AddInType {
  TOOLBAR = 'toolbar',
  MENU_ITEM = 'menu_item',
  WINDOW = 'window',
  WIZARD = 'wizard',
  CODE_GENERATOR = 'code_generator',
  DEBUGGER_EXTENSION = 'debugger_extension',
  PROJECT_TEMPLATE = 'project_template',
  CODE_ANALYZER = 'code_analyzer',
  DESIGNER_EXTENSION = 'designer_extension',
  CUSTOM = 'custom',
}

export enum VB6AddInState {
  LOADED = 'loaded',
  UNLOADED = 'unloaded',
  DISABLED = 'disabled',
  ERROR = 'error',
  LOADING = 'loading',
  UNLOADING = 'unloading',
}

export enum VB6AddInEvent {
  IDE_STARTUP = 'ide_startup',
  IDE_SHUTDOWN = 'ide_shutdown',
  PROJECT_OPEN = 'project_open',
  PROJECT_CLOSE = 'project_close',
  PROJECT_SAVE = 'project_save',
  FILE_OPEN = 'file_open',
  FILE_SAVE = 'file_save',
  FILE_CLOSE = 'file_close',
  FORM_LOAD = 'form_load',
  FORM_UNLOAD = 'form_unload',
  CONTROL_ADD = 'control_add',
  CONTROL_DELETE = 'control_delete',
  COMPILE_START = 'compile_start',
  COMPILE_END = 'compile_end',
  DEBUG_START = 'debug_start',
  DEBUG_STOP = 'debug_stop',
  BREAKPOINT_HIT = 'breakpoint_hit',
  MENU_CLICK = 'menu_click',
  TOOLBAR_CLICK = 'toolbar_click',
}

export interface VB6AddInInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  type: VB6AddInType;
  state: VB6AddInState;

  // Add-in files
  dllPath?: string;
  configPath?: string;
  helpPath?: string;
  iconPath?: string;

  // Registration info
  clsid?: string;
  progId?: string;
  connectClass?: string;

  // Capabilities
  supportsEvents: VB6AddInEvent[];
  providesCommands: VB6AddInCommand[];
  providesMenus: VB6AddInMenu[];
  providesToolbars: VB6AddInToolbar[];
  providesWindows: VB6AddInWindow[];

  // Configuration
  settings: Map<string, AddInSettingValue>;
  enabled: boolean;
  autoLoad: boolean;
  loadOnStartup: boolean;

  // Metadata
  created: Date;
  modified: Date;
  lastLoaded?: Date;
  loadCount: number;

  // Dependencies
  requiredVBVersion: string;
  requiredAddIns: string[];
  conflictingAddIns: string[];

  // Security
  trusted: boolean;
  signed: boolean;
  certificate?: string;

  // Error handling
  lastError?: string;
  errorCount: number;
}

export interface VB6AddInCommand {
  id: string;
  name: string;
  caption: string;
  description: string;
  shortcut?: string;
  toolbar?: string;
  menu?: string;
  enabled: boolean;
  visible: boolean;
  callback: string;
}

export interface VB6AddInMenu {
  id: string;
  parent: string;
  caption: string;
  position: number;
  separator: boolean;
  commands: VB6AddInCommand[];
  submenus: VB6AddInMenu[];
}

export interface VB6AddInToolbar {
  id: string;
  name: string;
  caption: string;
  visible: boolean;
  dockable: boolean;
  position: { x: number; y: number };
  buttons: VB6AddInToolbarButton[];
}

export interface VB6AddInToolbarButton {
  id: string;
  caption: string;
  tooltip: string;
  iconPath?: string;
  command: string;
  enabled: boolean;
  visible: boolean;
  style: 'button' | 'separator' | 'dropdown' | 'textbox' | 'combobox';
}

export interface VB6AddInWindow {
  id: string;
  title: string;
  type: 'dockable' | 'modal' | 'modeless';
  visible: boolean;
  position: { x: number; y: number; width: number; height: number };
  content: string; // HTML or component reference
}

export interface VB6AddInEventData {
  eventType: VB6AddInEvent;
  source: string;
  data: AddInEventPayload;
  timestamp: Date;
  handled: boolean;
}

export interface VB6IDEContext {
  // Current state
  currentProject?: IDEObjectReference;
  currentForm?: IDEObjectReference;
  currentModule?: IDEObjectReference;
  selectedControls: IDEControlReference[];

  // Methods available to add-ins
  showMessage(message: string, title?: string): void;
  showInputBox(prompt: string, title?: string, defaultValue?: string): string | null;
  createForm(name: string): IDEObjectReference;
  addControl(type: string, container: IDEObjectReference): IDEControlReference;
  generateCode(template: string, parameters: Record<string, unknown>): string;
  openFile(path: string): boolean;
  saveFile(path: string, content: string): boolean;
  compileProject(): boolean;
  runProject(): boolean;
  addReference(path: string): boolean;
  addComponent(path: string): boolean;
}

export class VB6AddInManager {
  private static instance: VB6AddInManager;
  private addIns: Map<string, VB6AddInInfo> = new Map();
  private loadedAddIns: Map<string, VB6AddInInfo> = new Map();
  private eventHandlers: Map<VB6AddInEvent, VB6AddInInfo[]> = new Map();
  private ideContext: VB6IDEContext;
  private isInitialized: boolean = false;

  static getInstance(): VB6AddInManager {
    if (!VB6AddInManager.instance) {
      VB6AddInManager.instance = new VB6AddInManager();
    }
    return VB6AddInManager.instance;
  }

  constructor() {
    this.ideContext = this.createIDEContext();
    this.initializeBuiltInAddIns();
  }

  private createIDEContext(): VB6IDEContext {
    return {
      selectedControls: [],

      showMessage: (message: string, title?: string) => {
        alert(`${title || 'VB6 IDE'}: ${message}`);
      },

      showInputBox: (prompt: string, title?: string, defaultValue?: string): string | null => {
        return window.prompt(`${title || 'VB6 IDE'}: ${prompt}`, defaultValue || '');
      },

      createForm: (name: string): IDEObjectReference => {
        return { name, type: 'Form' };
      },

      addControl: (type: string, container: IDEObjectReference): IDEControlReference => {
        return { type, name: `${type}1`, container: container.name };
      },

      generateCode: (template: string, parameters: Record<string, unknown>): string => {
        let code = template;
        for (const [key, value] of Object.entries(parameters)) {
          code = code.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        }
        return code;
      },

      openFile: (_path: string): boolean => {
        return true;
      },

      saveFile: (_path: string, _content: string): boolean => {
        return true;
      },

      compileProject: (): boolean => {
        return true;
      },

      runProject: (): boolean => {
        return true;
      },

      addReference: (_path: string): boolean => {
        return true;
      },

      addComponent: (_path: string): boolean => {
        return true;
      },
    };
  }

  private initializeBuiltInAddIns(): void {
    // API Text Viewer Add-in
    this.registerAddIn({
      id: 'api-text-viewer',
      name: 'APITextViewer',
      displayName: 'API Text Viewer',
      description: 'Browse and insert Windows API declarations',
      version: '1.0',
      author: 'Microsoft Corporation',
      type: VB6AddInType.WINDOW,
      state: VB6AddInState.UNLOADED,
      supportsEvents: [VB6AddInEvent.IDE_STARTUP, VB6AddInEvent.MENU_CLICK],
      providesCommands: [
        {
          id: 'show-api-viewer',
          name: 'ShowAPIViewer',
          caption: 'API Text Viewer...',
          description: 'Show the API Text Viewer window',
          enabled: true,
          visible: true,
          callback: 'ShowAPITextViewer',
        },
      ],
      providesMenus: [
        {
          id: 'api-menu',
          parent: 'Add-Ins',
          caption: 'API Text Viewer...',
          position: 1,
          separator: false,
          commands: [],
          submenus: [],
        },
      ],
      providesToolbars: [],
      providesWindows: [
        {
          id: 'api-viewer-window',
          title: 'API Text Viewer',
          type: 'modeless',
          visible: false,
          position: { x: 100, y: 100, width: 600, height: 400 },
          content: 'api-text-viewer-component',
        },
      ],
      settings: new Map(),
      enabled: true,
      autoLoad: false,
      loadOnStartup: false,
      created: new Date('1998-01-01'),
      modified: new Date('1998-01-01'),
      loadCount: 0,
      requiredVBVersion: '6.0',
      requiredAddIns: [],
      conflictingAddIns: [],
      trusted: true,
      signed: true,
      errorCount: 0,
    });

    // Application Wizard
    this.registerAddIn({
      id: 'application-wizard',
      name: 'ApplicationWizard',
      displayName: 'VB Application Wizard',
      description: 'Create new applications from templates',
      version: '1.0',
      author: 'Microsoft Corporation',
      type: VB6AddInType.WIZARD,
      state: VB6AddInState.UNLOADED,
      supportsEvents: [VB6AddInEvent.IDE_STARTUP, VB6AddInEvent.MENU_CLICK],
      providesCommands: [
        {
          id: 'run-app-wizard',
          name: 'RunApplicationWizard',
          caption: 'VB Application Wizard...',
          description: 'Create a new application using the wizard',
          enabled: true,
          visible: true,
          callback: 'RunApplicationWizard',
        },
      ],
      providesMenus: [
        {
          id: 'wizard-menu',
          parent: 'Add-Ins',
          caption: 'VB Application Wizard...',
          position: 2,
          separator: false,
          commands: [],
          submenus: [],
        },
      ],
      providesToolbars: [],
      providesWindows: [],
      settings: new Map([
        ['DefaultProjectPath', 'C:\\VB6Projects'],
        ['ShowWelcome', true],
        ['CreateBackup', true],
      ]),
      enabled: true,
      autoLoad: false,
      loadOnStartup: false,
      created: new Date('1998-01-01'),
      modified: new Date('1998-01-01'),
      loadCount: 0,
      requiredVBVersion: '6.0',
      requiredAddIns: [],
      conflictingAddIns: [],
      trusted: true,
      signed: true,
      errorCount: 0,
    });

    // Class Builder Utility
    this.registerAddIn({
      id: 'class-builder',
      name: 'ClassBuilder',
      displayName: 'VB Class Builder Utility',
      description: 'Build class modules with properties, methods, and events',
      version: '1.0',
      author: 'Microsoft Corporation',
      type: VB6AddInType.CODE_GENERATOR,
      state: VB6AddInState.UNLOADED,
      supportsEvents: [VB6AddInEvent.IDE_STARTUP, VB6AddInEvent.MENU_CLICK],
      providesCommands: [
        {
          id: 'run-class-builder',
          name: 'RunClassBuilder',
          caption: 'VB Class Builder Utility...',
          description: 'Create class modules with the Class Builder',
          enabled: true,
          visible: true,
          callback: 'RunClassBuilder',
        },
      ],
      providesMenus: [
        {
          id: 'class-builder-menu',
          parent: 'Add-Ins',
          caption: 'VB Class Builder Utility...',
          position: 3,
          separator: false,
          commands: [],
          submenus: [],
        },
      ],
      providesToolbars: [],
      providesWindows: [
        {
          id: 'class-builder-window',
          title: 'Class Builder Utility',
          type: 'modal',
          visible: false,
          position: { x: 50, y: 50, width: 800, height: 600 },
          content: 'class-builder-component',
        },
      ],
      settings: new Map([
        ['GenerateComments', true],
        ['UseErrorHandling', true],
        ['CreateGetSet', true],
      ]),
      enabled: true,
      autoLoad: false,
      loadOnStartup: false,
      created: new Date('1998-01-01'),
      modified: new Date('1998-01-01'),
      loadCount: 0,
      requiredVBVersion: '6.0',
      requiredAddIns: [],
      conflictingAddIns: [],
      trusted: true,
      signed: true,
      errorCount: 0,
    });

    // Data Form Wizard
    this.registerAddIn({
      id: 'data-form-wizard',
      name: 'DataFormWizard',
      displayName: 'VB Data Form Wizard',
      description: 'Create data-bound forms automatically',
      version: '1.0',
      author: 'Microsoft Corporation',
      type: VB6AddInType.WIZARD,
      state: VB6AddInState.UNLOADED,
      supportsEvents: [VB6AddInEvent.IDE_STARTUP, VB6AddInEvent.MENU_CLICK],
      providesCommands: [
        {
          id: 'run-data-form-wizard',
          name: 'RunDataFormWizard',
          caption: 'VB Data Form Wizard...',
          description: 'Create data-bound forms with the wizard',
          enabled: true,
          visible: true,
          callback: 'RunDataFormWizard',
        },
      ],
      providesMenus: [
        {
          id: 'data-form-wizard-menu',
          parent: 'Add-Ins',
          caption: 'VB Data Form Wizard...',
          position: 4,
          separator: true,
          commands: [],
          submenus: [],
        },
      ],
      providesToolbars: [],
      providesWindows: [],
      settings: new Map([
        ['DefaultDataSource', 'ADO'],
        ['CreateNavigation', true],
        ['AddValidation', true],
      ]),
      enabled: true,
      autoLoad: false,
      loadOnStartup: false,
      created: new Date('1998-01-01'),
      modified: new Date('1998-01-01'),
      loadCount: 0,
      requiredVBVersion: '6.0',
      requiredAddIns: [],
      conflictingAddIns: [],
      trusted: true,
      signed: true,
      errorCount: 0,
    });

    // Resource Editor
    this.registerAddIn({
      id: 'resource-editor',
      name: 'ResourceEditor',
      displayName: 'Resource Editor',
      description: 'Edit resource files and manage resources',
      version: '1.0',
      author: 'Microsoft Corporation',
      type: VB6AddInType.DESIGNER_EXTENSION,
      state: VB6AddInState.UNLOADED,
      supportsEvents: [
        VB6AddInEvent.IDE_STARTUP,
        VB6AddInEvent.FILE_OPEN,
        VB6AddInEvent.MENU_CLICK,
      ],
      providesCommands: [
        {
          id: 'open-resource-editor',
          name: 'OpenResourceEditor',
          caption: 'Resource Editor...',
          description: 'Open the Resource Editor',
          enabled: true,
          visible: true,
          callback: 'OpenResourceEditor',
        },
      ],
      providesMenus: [
        {
          id: 'resource-editor-menu',
          parent: 'Tools',
          caption: 'Resource Editor...',
          position: 5,
          separator: false,
          commands: [],
          submenus: [],
        },
      ],
      providesToolbars: [
        {
          id: 'resource-toolbar',
          name: 'ResourceToolbar',
          caption: 'Resources',
          visible: false,
          dockable: true,
          position: { x: 200, y: 50 },
          buttons: [
            {
              id: 'new-resource',
              caption: 'New',
              tooltip: 'Create new resource',
              command: 'NewResource',
              enabled: true,
              visible: true,
              style: 'button',
            },
            {
              id: 'sep1',
              caption: '',
              tooltip: '',
              command: '',
              enabled: false,
              visible: true,
              style: 'separator',
            },
            {
              id: 'edit-resource',
              caption: 'Edit',
              tooltip: 'Edit selected resource',
              command: 'EditResource',
              enabled: true,
              visible: true,
              style: 'button',
            },
          ],
        },
      ],
      providesWindows: [
        {
          id: 'resource-editor-window',
          title: 'Resource Editor',
          type: 'dockable',
          visible: false,
          position: { x: 300, y: 100, width: 500, height: 400 },
          content: 'resource-editor-component',
        },
      ],
      settings: new Map([
        ['ShowBinary', false],
        ['AutoSave', true],
        ['BackupResources', true],
      ]),
      enabled: true,
      autoLoad: false,
      loadOnStartup: false,
      created: new Date('1998-01-01'),
      modified: new Date('1998-01-01'),
      loadCount: 0,
      requiredVBVersion: '6.0',
      requiredAddIns: [],
      conflictingAddIns: [],
      trusted: true,
      signed: true,
      errorCount: 0,
    });

    this.isInitialized = true;
  }

  // Add-in Registration
  registerAddIn(addIn: VB6AddInInfo): void {
    this.addIns.set(addIn.id, addIn);

    // Register event handlers
    for (const eventType of addIn.supportsEvents) {
      if (!this.eventHandlers.has(eventType)) {
        this.eventHandlers.set(eventType, []);
      }
      this.eventHandlers.get(eventType)!.push(addIn);
    }
  }

  unregisterAddIn(addInId: string): boolean {
    const addIn = this.addIns.get(addInId);
    if (!addIn) return false;

    // Unload if loaded
    if (this.loadedAddIns.has(addInId)) {
      this.unloadAddIn(addInId);
    }

    // Remove from event handlers
    for (const eventType of addIn.supportsEvents) {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.findIndex(h => h.id === addInId);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      }
    }

    this.addIns.delete(addInId);
    return true;
  }

  // Add-in Loading/Unloading
  async loadAddIn(addInId: string): Promise<boolean> {
    const addIn = this.addIns.get(addInId);
    if (!addIn) {
      throw new Error(`Add-in ${addInId} not found`);
    }

    if (addIn.state === VB6AddInState.LOADED) {
      return true; // Already loaded
    }

    try {
      addIn.state = VB6AddInState.LOADING;

      // Check dependencies
      for (const requiredAddIn of addIn.requiredAddIns) {
        if (!this.loadedAddIns.has(requiredAddIn)) {
          throw new Error(`Required add-in ${requiredAddIn} is not loaded`);
        }
      }

      // Check conflicts
      for (const conflictingAddIn of addIn.conflictingAddIns) {
        if (this.loadedAddIns.has(conflictingAddIn)) {
          throw new Error(`Conflicting add-in ${conflictingAddIn} is already loaded`);
        }
      }

      // Simulate loading
      await this.simulateAddInLoad(addIn);

      addIn.state = VB6AddInState.LOADED;
      addIn.lastLoaded = new Date();
      addIn.loadCount++;
      this.loadedAddIns.set(addInId, addIn);

      // Fire startup event
      this.fireEvent(VB6AddInEvent.IDE_STARTUP, {
        eventType: VB6AddInEvent.IDE_STARTUP,
        source: addInId,
        data: { addIn },
        timestamp: new Date(),
        handled: false,
      });

      return true;
    } catch (error) {
      addIn.state = VB6AddInState.ERROR;
      addIn.lastError = String(error);
      addIn.errorCount++;
      throw error;
    }
  }

  async unloadAddIn(addInId: string): Promise<boolean> {
    const addIn = this.loadedAddIns.get(addInId);
    if (!addIn) {
      return false; // Not loaded
    }

    try {
      addIn.state = VB6AddInState.UNLOADING;

      // Check if other add-ins depend on this one
      const dependentAddIns: string[] = [];
      for (const [id, otherAddIn] of this.loadedAddIns) {
        if (otherAddIn.requiredAddIns.includes(addInId)) {
          dependentAddIns.push(id);
        }
      }

      if (dependentAddIns.length > 0) {
        throw new Error(
          `Cannot unload ${addIn.name} because it is required by: ${dependentAddIns.join(', ')}`
        );
      }

      // Simulate unloading
      await this.simulateAddInUnload(addIn);

      addIn.state = VB6AddInState.UNLOADED;
      this.loadedAddIns.delete(addInId);

      return true;
    } catch (error) {
      addIn.state = VB6AddInState.ERROR;
      addIn.lastError = String(error);
      addIn.errorCount++;
      throw error;
    }
  }

  // Event System
  fireEvent(eventType: VB6AddInEvent, eventData: VB6AddInEventData): void {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;

    for (const addIn of handlers) {
      if (addIn.state === VB6AddInState.LOADED && addIn.enabled) {
        try {
          this.handleAddInEvent(addIn, eventData);
        } catch (error) {
          console.error(`Error in add-in ${addIn.name} handling event ${eventType}:`, error);
          addIn.errorCount++;
          addIn.lastError = String(error);
        }
      }
    }
  }

  private handleAddInEvent(addIn: VB6AddInInfo, eventData: VB6AddInEventData): void {
    switch (eventData.eventType) {
      case VB6AddInEvent.MENU_CLICK:
        this.handleMenuClick(addIn, eventData);
        break;
      case VB6AddInEvent.TOOLBAR_CLICK:
        this.handleToolbarClick(addIn, eventData);
        break;
      default:
    }
  }

  private handleMenuClick(addIn: VB6AddInInfo, eventData: VB6AddInEventData): void {
    const commandId = eventData.data?.commandId;
    if (!commandId) return;

    const command = addIn.providesCommands.find(cmd => cmd.id === commandId);
    if (command && command.enabled) {
      this.executeAddInCommand(addIn, command);
    }
  }

  private handleToolbarClick(addIn: VB6AddInInfo, eventData: VB6AddInEventData): void {
    const buttonId = eventData.data?.buttonId;
    if (!buttonId) return;

    for (const toolbar of addIn.providesToolbars) {
      const button = toolbar.buttons.find(btn => btn.id === buttonId);
      if (button && button.enabled) {
        const command = addIn.providesCommands.find(cmd => cmd.id === button.command);
        if (command) {
          this.executeAddInCommand(addIn, command);
        }
        break;
      }
    }
  }

  private executeAddInCommand(addIn: VB6AddInInfo, command: VB6AddInCommand): void {
    // Simulate command execution
    switch (command.callback) {
      case 'ShowAPITextViewer':
        this.ideContext.showMessage(
          'API Text Viewer functionality would be shown here',
          'API Text Viewer'
        );
        break;
      case 'RunApplicationWizard':
        this.ideContext.showMessage('Application Wizard would start here', 'Application Wizard');
        break;
      case 'RunClassBuilder':
        this.ideContext.showMessage('Class Builder Utility would open here', 'Class Builder');
        break;
      case 'RunDataFormWizard':
        this.ideContext.showMessage('Data Form Wizard would start here', 'Data Form Wizard');
        break;
      case 'OpenResourceEditor':
        this.ideContext.showMessage('Resource Editor would open here', 'Resource Editor');
        break;
      default:
        this.ideContext.showMessage(`Command ${command.name} executed`, addIn.displayName);
    }
  }

  // Add-in Information
  getAddIn(addInId: string): VB6AddInInfo | null {
    return this.addIns.get(addInId) || null;
  }

  getAllAddIns(): VB6AddInInfo[] {
    return Array.from(this.addIns.values());
  }

  getLoadedAddIns(): VB6AddInInfo[] {
    return Array.from(this.loadedAddIns.values());
  }

  getAddInsByType(type: VB6AddInType): VB6AddInInfo[] {
    return Array.from(this.addIns.values()).filter(addIn => addIn.type === type);
  }

  // Add-in Settings
  getAddInSetting(addInId: string, key: string): AddInSettingValue | undefined {
    const addIn = this.getAddIn(addInId);
    return addIn ? addIn.settings.get(key) : undefined;
  }

  setAddInSetting(addInId: string, key: string, value: AddInSettingValue): boolean {
    const addIn = this.getAddIn(addInId);
    if (addIn) {
      addIn.settings.set(key, value);
      addIn.modified = new Date();
      return true;
    }
    return false;
  }

  // Add-in Statistics
  getAddInStats(): {
    total: number;
    loaded: number;
    enabled: number;
    byType: Map<VB6AddInType, number>;
    byState: Map<VB6AddInState, number>;
  } {
    const stats = {
      total: this.addIns.size,
      loaded: this.loadedAddIns.size,
      enabled: 0,
      byType: new Map<VB6AddInType, number>(),
      byState: new Map<VB6AddInState, number>(),
    };

    for (const addIn of this.addIns.values()) {
      if (addIn.enabled) stats.enabled++;

      // Count by type
      const typeCount = stats.byType.get(addIn.type) || 0;
      stats.byType.set(addIn.type, typeCount + 1);

      // Count by state
      const stateCount = stats.byState.get(addIn.state) || 0;
      stats.byState.set(addIn.state, stateCount + 1);
    }

    return stats;
  }

  // Utility Methods
  private async simulateAddInLoad(addIn: VB6AddInInfo): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }

  private async simulateAddInUnload(addIn: VB6AddInInfo): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 200);
    });
  }

  // IDE Integration
  getIDEContext(): VB6IDEContext {
    return this.ideContext;
  }

  updateIDEContext(updates: Partial<VB6IDEContext>): void {
    Object.assign(this.ideContext, updates);
  }

  // Menu and Toolbar Management
  getAllMenus(): VB6AddInMenu[] {
    const menus: VB6AddInMenu[] = [];
    for (const addIn of this.loadedAddIns.values()) {
      if (addIn.enabled) {
        menus.push(...addIn.providesMenus);
      }
    }
    return menus;
  }

  getAllToolbars(): VB6AddInToolbar[] {
    const toolbars: VB6AddInToolbar[] = [];
    for (const addIn of this.loadedAddIns.values()) {
      if (addIn.enabled) {
        toolbars.push(...addIn.providesToolbars);
      }
    }
    return toolbars;
  }

  getAllWindows(): VB6AddInWindow[] {
    const windows: VB6AddInWindow[] = [];
    for (const addIn of this.loadedAddIns.values()) {
      if (addIn.enabled) {
        windows.push(...addIn.providesWindows);
      }
    }
    return windows;
  }

  // Auto-loading
  async loadAutoStartAddIns(): Promise<void> {
    const autoStartAddIns = Array.from(this.addIns.values()).filter(
      addIn => addIn.loadOnStartup && addIn.enabled
    );

    for (const addIn of autoStartAddIns) {
      try {
        await this.loadAddIn(addIn.id);
      } catch (error) {
        console.error(`Failed to auto-load add-in ${addIn.name}:`, error);
      }
    }
  }
}

// Global instance
export const VB6AddInManagerInstance = VB6AddInManager.getInstance();
