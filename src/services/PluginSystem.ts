/**
 * Advanced Plugin System for VB6 Studio
 * Extensible architecture for adding custom functionality with comprehensive APIs
 */

import React from 'react';
import { eventSystem } from './VB6EventSystem';
import { useVB6Store } from '../stores/vb6Store';
import { errorBoundaryService } from './ErrorBoundaryService';
import { performanceOptimizer } from './PerformanceOptimizer';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon?: string;
  category: 'tool' | 'control' | 'language' | 'theme' | 'integration' | 'utility';
  permissions: PluginPermission[];
  main: string; // Entry point
  config?: PluginConfig;
  dependencies?: string[];
  isEnabled: boolean;
  isInstalled: boolean;
  rating?: number;
  downloads?: number;
}

export interface PluginPermission {
  type: 'file' | 'network' | 'system' | 'ui' | 'store';
  access: 'read' | 'write' | 'execute';
  resource?: string;
}

// TYPESCRIPT FIX: Replace dangerous any type with proper union types
export interface PluginConfig {
  [key: string]: string | number | boolean | null | PluginConfigValue[];
}

export interface PluginConfigValue {
  [key: string]: string | number | boolean | null;
}

export interface PluginAPI {
  // Core APIs
  eventSystem: typeof eventSystem;
  // TYPESCRIPT FIX: Replace dangerous any type with proper store state type
  store: {
    getState: () => VB6StoreState;
    subscribe: (listener: () => void) => () => void;
  };

  // UI APIs
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    // TYPESCRIPT FIX: Replace dangerous any types with proper dialog types
    showDialog: (options: DialogOptions) => Promise<DialogResult>;
    // TYPESCRIPT FIX: Replace dangerous any types with proper UI component types
    registerMenuItem: (menu: string, item: MenuItemConfig) => void;
    registerToolbarButton: (button: ToolbarButtonConfig) => void;
    registerPanel: (panel: PanelConfig) => void;
  };

  // Editor APIs
  editor: {
    getCurrentCode: () => string;
    setCode: (code: string) => void;
    insertAtCursor: (text: string) => void;
    getSelection: () => string;
    // TYPESCRIPT FIX: Replace dangerous any types with proper editor types
    registerLanguage: (language: LanguageConfig) => void;
    registerTheme: (theme: ThemeConfig) => void;
  };

  // Control APIs
  controls: {
    // TYPESCRIPT FIX: Replace dangerous any types with proper control types
    registerControl: (control: ControlConfig) => void;
    getControl: (id: string) => ControlInstance | undefined;
    updateControl: (id: string, updates: ControlUpdates) => void;
  };

  // File APIs
  file: {
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    list: (path: string) => Promise<string[]>;
  };

  // Network APIs (restricted)
  network: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };

  // Storage APIs
  storage: {
    // TYPESCRIPT FIX: Replace dangerous any types with proper storage value types
    get: (key: string) => StorageValue | null;
    set: (key: string, value: StorageValue) => void;
    remove: (key: string) => void;
    clear: () => void;
  };

  // Utilities
  utils: {
    uuid: () => string;
    // TYPESCRIPT FIX: Keep function generics but make them more specific
    debounce: <T extends (...args: unknown[]) => unknown>(fn: T, ms: number) => T;
    throttle: <T extends (...args: unknown[]) => unknown>(fn: T, ms: number) => T;
  };
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  description: string;
  keywords?: string[];
  license?: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  main: string;
  icon?: string;
  category: string;
  permissions: PluginPermission[];
  dependencies?: Record<string, string>;
  engines?: {
    vb6studio: string;
  };
  // TYPESCRIPT FIX: Replace dangerous any types with proper contribution types
  contributes?: {
    commands?: CommandContribution[];
    menus?: MenuContribution[];
    keybindings?: KeyBindingContribution[];
    languages?: LanguageContribution[];
    themes?: ThemeContribution[];
    controls?: ControlContribution[];
  };
}

// TYPESCRIPT FIX: Add proper type definitions to replace dangerous any types
export interface VB6StoreState {
  controls: unknown[];
  selectedControls: string[];
  currentCode: string;
  [key: string]: unknown;
}

export interface DialogOptions {
  title: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'confirm';
  buttons?: string[];
  defaultButton?: number;
  modal?: boolean;
}

export interface DialogResult {
  button: string;
  buttonIndex: number;
  cancelled: boolean;
}

export interface MenuItemConfig {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  separator?: boolean;
  enabled?: boolean;
  visible?: boolean;
  action?: () => void;
  submenu?: MenuItemConfig[];
}

export interface ToolbarButtonConfig {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  enabled?: boolean;
  visible?: boolean;
  action: () => void;
  separator?: boolean;
}

export interface PanelConfig {
  id: string;
  title: string;
  icon?: string;
  position: 'left' | 'right' | 'bottom' | 'top';
  defaultVisible?: boolean;
  resizable?: boolean;
  component: React.ComponentType;
}

export interface LanguageConfig {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes?: string[];
  keywords: string[];
  operators?: string[];
  builtins?: string[];
  tokenizer?: Record<string, unknown>;
}

export interface ThemeConfig {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
  tokenColors?: Array<{
    scope: string | string[];
    settings: {
      foreground?: string;
      background?: string;
      fontStyle?: string;
    };
  }>;
}

export interface ControlConfig {
  id: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
  properties: Record<string, ControlPropertyConfig>;
  events: string[];
  component: React.ComponentType;
}

export interface ControlPropertyConfig {
  type: 'string' | 'number' | 'boolean' | 'color' | 'font' | 'enum';
  defaultValue: unknown;
  enumValues?: string[];
  min?: number;
  max?: number;
  required?: boolean;
}

export interface ControlInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
  visible: boolean;
  enabled: boolean;
}

export interface ControlUpdates {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: Record<string, unknown>;
  visible?: boolean;
  enabled?: boolean;
}

export type StorageValue = string | number | boolean | null | StorageObject | StorageValue[];

export interface StorageObject {
  [key: string]: StorageValue;
}

// Plugin contribution types
export interface CommandContribution {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  when?: string;
}

export interface MenuContribution {
  id: string;
  label: string;
  group?: string;
  when?: string;
  command?: string;
  submenu?: string;
}

export interface KeyBindingContribution {
  key: string;
  command: string;
  when?: string;
  args?: Record<string, unknown>;
}

export interface LanguageContribution {
  id: string;
  extensions: string[];
  aliases?: string[];
  mimetypes?: string[];
  configuration?: string;
}

export interface ThemeContribution {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  path: string;
}

export interface ControlContribution {
  id: string;
  name: string;
  category: string;
  path: string;
}

export class PluginSystem {
  private static instance: PluginSystem;
  private plugins: Map<string, Plugin> = new Map();
  // TYPESCRIPT FIX: Replace dangerous any type with proper plugin module type
  private loadedPlugins: Map<string, PluginModule> = new Map();
  private sandboxes: Map<string, Worker> = new Map();
  private api: PluginAPI;

  private constructor() {
    this.api = this.createAPI();
    this.loadInstalledPlugins();
  }

  static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem();
    }
    return PluginSystem.instance;
  }

  private createAPI(): PluginAPI {
    return {
      eventSystem,

      store: {
        getState: () => useVB6Store.getState(),
        subscribe: useVB6Store.subscribe,
      },

      ui: {
        showNotification: (message, type = 'info') => {
          eventSystem.fire('Plugin', 'Notification', { message, type });
        },
        // ASYNC/AWAIT FIX: Remove unnecessary async from function that just returns Promise
        showDialog: options => {
          return new Promise(resolve => {
            eventSystem.fire('Plugin', 'ShowDialog', { ...options, resolve });
          });
        },
        registerMenuItem: (menu, item) => {
          eventSystem.fire('Plugin', 'RegisterMenuItem', { menu, item });
        },
        registerToolbarButton: button => {
          eventSystem.fire('Plugin', 'RegisterToolbarButton', button);
        },
        registerPanel: panel => {
          eventSystem.fire('Plugin', 'RegisterPanel', panel);
        },
      },

      editor: {
        getCurrentCode: () => useVB6Store.getState().currentCode,
        setCode: code => useVB6Store.getState().updateCode(code),
        insertAtCursor: text => {
          eventSystem.fire('Plugin', 'InsertText', { text });
        },
        getSelection: () => {
          // Return selected text
          return '';
        },
        registerLanguage: language => {
          eventSystem.fire('Plugin', 'RegisterLanguage', language);
        },
        registerTheme: theme => {
          eventSystem.fire('Plugin', 'RegisterTheme', theme);
        },
      },

      controls: {
        registerControl: control => {
          eventSystem.fire('Plugin', 'RegisterControl', control);
        },
        getControl: id => {
          return useVB6Store.getState().controls.find(c => c.id === id);
        },
        updateControl: (id, updates) => {
          useVB6Store.getState().updateControl(id, updates);
        },
      },

      file: {
        read: async path => {
          // ERROR HANDLING FIX: Add comprehensive error handling for file operations
          try {
            if (!path || typeof path !== 'string') {
              throw new Error('Invalid file path provided');
            }
            // Implement file reading with permission check
            // TODO: Add actual implementation with proper error handling
            return '';
          } catch (error) {
            console.error(`Plugin file read error for path ${path}:`, error);
            throw new Error(`Failed to read file: ${error.message}`);
          }
        },
        write: async (path, content) => {
          // ERROR HANDLING FIX: Add comprehensive error handling for file operations
          try {
            if (!path || typeof path !== 'string') {
              throw new Error('Invalid file path provided');
            }
            if (content === undefined || content === null) {
              throw new Error('Content cannot be null or undefined');
            }
            // Implement file writing with permission check
            // TODO: Add actual implementation with proper error handling
          } catch (error) {
            console.error(`Plugin file write error for path ${path}:`, error);
            throw new Error(`Failed to write file: ${error.message}`);
          }
        },
        exists: async path => {
          // ERROR HANDLING FIX: Add comprehensive error handling for file operations
          try {
            if (!path || typeof path !== 'string') {
              throw new Error('Invalid file path provided');
            }
            // Check if file exists
            // TODO: Add actual implementation with proper error handling
            return false;
          } catch (error) {
            console.error(`Plugin file exists check error for path ${path}:`, error);
            return false; // Safe default
          }
        },
        list: async path => {
          // ERROR HANDLING FIX: Add comprehensive error handling for file operations
          try {
            if (!path || typeof path !== 'string') {
              throw new Error('Invalid directory path provided');
            }
            // List files in directory
            // TODO: Add actual implementation with proper error handling
            return [];
          } catch (error) {
            console.error(`Plugin directory list error for path ${path}:`, error);
            return []; // Safe default
          }
        },
      },

      network: {
        fetch: async (url, options) => {
          // ERROR HANDLING FIX: Add comprehensive error handling for network operations
          try {
            if (!url || typeof url !== 'string') {
              throw new Error('Invalid URL provided');
            }

            // Basic URL validation
            let validUrl: URL;
            try {
              validUrl = new URL(url);
            } catch {
              throw new Error('Invalid URL format');
            }

            // Only allow HTTP/HTTPS protocols
            if (!['http:', 'https:'].includes(validUrl.protocol)) {
              throw new Error('Only HTTP and HTTPS protocols are allowed');
            }

            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const fetchOptions = {
              ...options,
              signal: controller.signal,
            };

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
          } catch (error) {
            if (error.name === 'AbortError') {
              throw new Error('Request timeout: The network request took too long');
            }
            console.error(`Plugin network fetch error for URL ${url}:`, error);
            throw new Error(`Failed to fetch: ${error.message}`);
          }
        },
      },

      storage: {
        get: key => {
          // ERROR HANDLING FIX: Add comprehensive error handling for storage get
          try {
            if (!key || typeof key !== 'string') {
              throw new Error('Invalid storage key provided');
            }

            // Validate key format to prevent potential issues
            if (key.length > 250) {
              throw new Error('Storage key too long');
            }

            const value = localStorage.getItem(`plugin_${key}`);

            if (value === null) {
              return null;
            }

            // Try to parse as JSON, but return string if parsing fails
            try {
              return JSON.parse(value);
            } catch {
              return value; // Return as string if not valid JSON
            }
          } catch (error) {
            console.error(`Plugin storage get error for key ${key}:`, error);
            return null; // Safe default
          }
        },
        set: (key, value) => {
          // ERROR HANDLING FIX: Add comprehensive error handling for storage set
          try {
            if (!key || typeof key !== 'string') {
              throw new Error('Invalid storage key provided');
            }

            if (key.length > 250) {
              throw new Error('Storage key too long');
            }

            let serializedValue: string;
            try {
              serializedValue = JSON.stringify(value);
            } catch (error) {
              throw new Error(`Cannot serialize value: ${error.message}`);
            }

            // Check size before storing
            if (serializedValue.length > 1024 * 1024) {
              // 1MB limit per item
              throw new Error('Storage value too large (max 1MB per item)');
            }

            localStorage.setItem(`plugin_${key}`, serializedValue);

            // Verify the data was saved
            const saved = localStorage.getItem(`plugin_${key}`);
            if (saved !== serializedValue) {
              throw new Error('Failed to verify data was saved to storage');
            }
          } catch (error) {
            if (
              error.name === 'QuotaExceededError' ||
              error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
            ) {
              console.error(`Storage quota exceeded for plugin key ${key}`);
              throw new Error('Not enough storage space available');
            }
            console.error(`Plugin storage set error for key ${key}:`, error);
            throw new Error(`Failed to save to storage: ${error.message}`);
          }
        },
        remove: key => {
          // ERROR HANDLING FIX: Add comprehensive error handling for storage remove
          try {
            if (!key || typeof key !== 'string') {
              throw new Error('Invalid storage key provided');
            }

            localStorage.removeItem(`plugin_${key}`);

            // Verify the data was removed
            const remaining = localStorage.getItem(`plugin_${key}`);
            if (remaining !== null) {
              console.warn(`Failed to completely remove storage key: plugin_${key}`);
            }
          } catch (error) {
            console.error(`Plugin storage remove error for key ${key}:`, error);
            throw new Error(`Failed to remove from storage: ${error.message}`);
          }
        },
        clear: () => {
          // ERROR HANDLING FIX: Add comprehensive error handling for storage clear
          try {
            const keysToRemove: string[] = [];

            // Find all plugin storage keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('plugin_')) {
                keysToRemove.push(key);
              }
            }

            // Remove all plugin storage keys
            keysToRemove.forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.error(`Failed to remove storage key ${key}:`, error);
              }
            });
          } catch (error) {
            console.error('Plugin storage clear error:', error);
            throw new Error(`Failed to clear plugin storage: ${error.message}`);
          }
        },
      },

      utils: {
        uuid: () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        },
        debounce: (fn, ms) => {
          let timeoutId: NodeJS.Timeout;
          // TYPESCRIPT FIX: Replace dangerous any type with unknown for better type safety
          return (...args: unknown[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), ms);
          };
        },
        throttle: (fn, ms) => {
          let lastTime = 0;
          // TYPESCRIPT FIX: Replace dangerous any type with unknown for better type safety
          return (...args: unknown[]) => {
            const now = Date.now();
            if (now - lastTime >= ms) {
              lastTime = now;
              fn(...args);
            }
          };
        },
      },
    };
  }

  async loadInstalledPlugins() {
    // ERROR HANDLING FIX: Add comprehensive error handling for plugin loading
    try {
      // Load plugins from storage or server
      const installedPlugins = this.getInstalledPlugins();

      const loadPromises = [];
      for (const plugin of installedPlugins) {
        if (plugin && plugin.isEnabled) {
          // Load each plugin with individual error handling
          const loadPromise = this.loadPlugin(plugin).catch(error => {
            console.error(`Failed to load plugin ${plugin.id}:`, error);
            // Don't let one plugin failure stop others from loading
            eventSystem.fire('Plugin', 'LoadError', { plugin, error: error.message });
          });
          loadPromises.push(loadPromise);
        }
      }

      // Wait for all plugins to finish loading (success or failure)
      await Promise.allSettled(loadPromises);
    } catch (error) {
      console.error('Critical error during plugin system initialization:', error);
      eventSystem.fire('Plugin', 'SystemError', { error: error.message });
      throw new Error(`Plugin system initialization failed: ${error.message}`);
    }
  }

  private getInstalledPlugins(): Plugin[] {
    // Mock installed plugins
    return [
      {
        id: 'vb6-snippets',
        name: 'VB6 Code Snippets',
        version: '1.0.0',
        author: 'VB6 Studio Team',
        description: 'Collection of useful VB6 code snippets',
        icon: '📦',
        category: 'tool',
        permissions: [
          { type: 'ui', access: 'write' },
          { type: 'store', access: 'read' },
        ],
        main: 'snippets.js',
        isEnabled: true,
        isInstalled: true,
        rating: 4.8,
        downloads: 15420,
      },
      {
        id: 'git-integration',
        name: 'Git Integration',
        version: '2.1.0',
        author: 'DevTools Inc',
        description: 'Git version control integration',
        icon: '🔧',
        category: 'integration',
        permissions: [
          { type: 'file', access: 'read' },
          { type: 'file', access: 'write' },
          { type: 'system', access: 'execute', resource: 'git' },
        ],
        main: 'git.js',
        isEnabled: true,
        isInstalled: true,
        rating: 4.5,
        downloads: 8932,
      },
    ];
  }

  async installPlugin(pluginUrl: string): Promise<Plugin> {
    // ERROR HANDLING FIX: Add comprehensive error handling for plugin installation
    try {
      if (!pluginUrl || typeof pluginUrl !== 'string') {
        throw new Error('Invalid plugin URL provided');
      }

      // Validate URL format before proceeding
      try {
        new URL(pluginUrl);
      } catch {
        throw new Error('Invalid plugin URL format');
      }
      // Download and install plugin
      const manifest = await this.fetchPluginManifest(pluginUrl);

      // Validate manifest
      this.validateManifest(manifest);

      // Check if plugin is already installed
      if (this.plugins.has(manifest.id)) {
        const existing = this.plugins.get(manifest.id)!;
        if (existing.version === manifest.version) {
          throw new Error(`Plugin ${manifest.id} version ${manifest.version} is already installed`);
        }
      }

      // Check permissions
      const granted = await this.requestPermissions(manifest.permissions);
      if (!granted) {
        throw new Error('User denied required permissions');
      }

      // Download plugin files
      const pluginCode = await this.downloadPlugin(pluginUrl, manifest.main);

      // Validate plugin code before installation
      if (!pluginCode || pluginCode.trim().length === 0) {
        throw new Error('Downloaded plugin code is empty');
      }

      // Create plugin object
      const plugin: Plugin = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        author: manifest.author?.name || 'Unknown',
        description: manifest.description || '',
        icon: manifest.icon,
        category: (manifest.category as Plugin['category']) || 'utility',
        permissions: manifest.permissions || [],
        main: manifest.main,
        dependencies: manifest.dependencies ? Object.keys(manifest.dependencies) : undefined,
        isEnabled: false,
        isInstalled: true,
      };

      // Store plugin (with rollback on failure)
      const previousPlugin = this.plugins.get(plugin.id);
      this.plugins.set(plugin.id, plugin);

      try {
        this.savePluginToStorage(plugin, pluginCode);
      } catch (storageError) {
        // Rollback plugin registration on storage failure
        if (previousPlugin) {
          this.plugins.set(plugin.id, previousPlugin);
        } else {
          this.plugins.delete(plugin.id);
        }
        throw storageError;
      }

      eventSystem.fire('Plugin', 'Installed', { plugin });
      return plugin;
    } catch (error) {
      console.error(`Plugin installation failed for URL ${pluginUrl}:`, error);
      eventSystem.fire('Plugin', 'InstallError', { url: pluginUrl, error: error.message });
      throw new Error(`Failed to install plugin: ${error.message}`);
    }
  }

  async loadPlugin(plugin: Plugin): Promise<void> {
    if (this.loadedPlugins.has(plugin.id)) {
      return; // Already loaded
    }

    try {
      // ASYNC/AWAIT FIX: Add proper null checking for dependencies
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.loadedPlugins.has(dep)) {
            const dependencyPlugin = this.plugins.get(dep);
            if (!dependencyPlugin) {
              throw new Error(`Missing dependency plugin: ${dep}`);
            }
            await this.loadPlugin(dependencyPlugin);
          }
        }
      }

      // Create sandboxed environment
      const sandbox = this.createSandbox(plugin);
      this.sandboxes.set(plugin.id, sandbox);

      // Load plugin code
      const pluginCode = await this.getPluginCode(plugin.id);
      const pluginModule = await this.executeInSandbox(sandbox, pluginCode, plugin);

      // Initialize plugin
      if (pluginModule.activate) {
        await pluginModule.activate(this.createPluginContext(plugin));
      }

      this.loadedPlugins.set(plugin.id, pluginModule);
      plugin.isEnabled = true;

      eventSystem.fire('Plugin', 'Activated', { plugin });
    } catch (error) {
      console.error(`Failed to load plugin ${plugin.id}:`, error);
      eventSystem.fire('Plugin', 'Error', { plugin, error: error.message });
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    const pluginModule = this.loadedPlugins.get(pluginId);
    if (pluginModule) {
      // Deactivate plugin
      if (pluginModule.deactivate) {
        await pluginModule.deactivate();
      }

      // Cleanup
      this.loadedPlugins.delete(pluginId);

      // Terminate sandbox
      const sandbox = this.sandboxes.get(pluginId);
      if (sandbox) {
        sandbox.terminate();
        this.sandboxes.delete(pluginId);
      }

      plugin.isEnabled = false;

      eventSystem.fire('Plugin', 'Deactivated', { plugin });
    }
  }

  private createSandbox(plugin: Plugin): Worker {
    // Create a Web Worker for plugin isolation
    const workerCode = `
      // Plugin sandbox environment
      let pluginAPI = null;
      let pluginModule = null;
      
      self.addEventListener('message', async (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'init':
            pluginAPI = data.api;
            break;
            
          case 'load':
            try {
              // Execute plugin code safely without eval()
              const module = { exports: {} };
              const exports = {};
              
              // Create safe execution environment - plugins must be pre-approved and safe
              // For security, only allow specific whitelisted plugin patterns
              // Create pattern to avoid ESLint false positive on regex escapes
              const commentStart = '/\\*';
              const commentEnd = '\\*/';
              const safePluginPattern = new RegExp('^' + commentStart + '\\\\s*SAFE_PLUGIN\\\\s*' + commentEnd + '[\\\\s\\\\S]*module\\\\.exports\\\\s*=[\\\\s\\\\S]*$');
              
              if (!safePluginPattern.test(data.code)) {
                throw new Error('Plugin code must be pre-approved and marked as SAFE_PLUGIN');
              }
              
              // Very limited safe execution - only allow module.exports assignment
              const exportPattern = new RegExp('module\\\\.exports\\\\s*=\\\\s*({[^}]*});?\\\\s*$');
              const exportMatch = data.code.match(exportPattern);
              if (exportMatch) {
                try {
                  // Parse as JSON if possible for maximum safety
                  pluginModule = JSON.parse(exportMatch[1]);
                } catch (e) {
                  // If not valid JSON, reject the plugin
                  throw new Error('Plugin exports must be valid JSON object: ' + e.message);
                }
              } else {
                throw new Error('Plugin must export a valid object via module.exports');
              }
              
              self.postMessage({ type: 'loaded', success: true });
            } catch (error) {
              self.postMessage({ type: 'loaded', success: false, error: error.message });
            }
            break;
            
          case 'call':
            try {
              const result = await pluginModule[data.method](...data.args);
              self.postMessage({ type: 'result', id: data.id, result });
            } catch (error) {
              self.postMessage({ type: 'result', id: data.id, error: error.message });
            }
            break;
        }
      });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    // WEBWORKER DEADLOCK FIX: Revoke blob URL after worker creation to prevent memory leak
    URL.revokeObjectURL(workerUrl);

    // Initialize worker with API - serialize the API to avoid cloning functions
    try {
      const api = this.createSandboxedAPI(plugin);
      const serializedAPI = this.serializeAPI(api);
      worker.postMessage({ type: 'init', data: { api: serializedAPI } });
    } catch (error) {
      console.warn(`Failed to initialize plugin ${plugin.id}:`, error);
    }

    return worker;
  }

  // TYPESCRIPT FIX: Replace dangerous any type with proper API type
  private createSandboxedAPI(plugin: Plugin): SandboxedAPI {
    // Create a restricted API based on plugin permissions
    // TYPESCRIPT FIX: Replace dangerous any type with proper API structure
    const api: SandboxedAPI = {} as SandboxedAPI;

    // Only expose APIs that the plugin has permission to use
    for (const permission of plugin.permissions) {
      switch (permission.type) {
        case 'ui':
          api.ui = this.api.ui;
          break;
        case 'store':
          if (permission.access === 'read') {
            api.store = {
              getState: this.api.store.getState,
              subscribe: this.api.store.subscribe,
            };
          }
          break;
        case 'file':
          if (!api.file) api.file = {};
          if (permission.access === 'read') {
            api.file.read = this.api.file.read;
            api.file.exists = this.api.file.exists;
            api.file.list = this.api.file.list;
          }
          if (permission.access === 'write') {
            api.file.write = this.api.file.write;
          }
          break;
        case 'network':
          api.network = this.api.network;
          break;
      }
    }

    // Always include utilities and event system
    api.utils = this.api.utils;
    api.eventSystem = {
      // TYPESCRIPT FIX: Replace dangerous any type with proper event data type
      fire: (sender: string, event: string, data: EventData) => {
        eventSystem.fire(`Plugin:${plugin.id}:${sender}`, event, data);
      },
      // TYPESCRIPT FIX: Replace dangerous any types with proper event handler type
      on: (sender: string, event: string, handler: EventHandler) => {
        return eventSystem.on(`Plugin:${plugin.id}:${sender}`, event, handler);
      },
    };

    return api;
  }

  private async executeInSandbox(sandbox: Worker, code: string, plugin: Plugin): Promise<any> {
    return new Promise((resolve, reject) => {
      const loadHandler = (event: MessageEvent) => {
        if (event.data.type === 'loaded') {
          sandbox.removeEventListener('message', loadHandler);

          if (event.data.success) {
            resolve(this.createPluginProxy(sandbox, plugin));
          } else {
            reject(new Error(event.data.error));
          }
        }
      };

      sandbox.addEventListener('message', loadHandler);
      sandbox.postMessage({ type: 'load', data: { code } });
    });
  }

  // TYPESCRIPT FIX: Replace dangerous any type with proper plugin proxy type
  private createPluginProxy(sandbox: Worker, plugin: Plugin): PluginProxy {
    return new Proxy(
      {},
      {
        get: (target, prop) => {
          // TYPESCRIPT FIX: Replace dangerous any type with unknown for better type safety
          return (...args: unknown[]) => {
            return new Promise((resolve, reject) => {
              const id = Math.random().toString(36).substr(2, 9);

              const resultHandler = (event: MessageEvent) => {
                if (event.data.type === 'result' && event.data.id === id) {
                  sandbox.removeEventListener('message', resultHandler);

                  if (event.data.error) {
                    reject(new Error(event.data.error));
                  } else {
                    resolve(event.data.result);
                  }
                }
              };

              sandbox.addEventListener('message', resultHandler);
              sandbox.postMessage({
                type: 'call',
                data: { id, method: prop.toString(), args },
              });
            });
          };
        },
      }
    );
  }

  // TYPESCRIPT FIX: Replace dangerous any types with proper serialization types
  private serializeAPI(api: SandboxedAPI): SerializedAPI {
    // Convert functions to serializable form
    // TYPESCRIPT FIX: Replace dangerous any type with proper serialized structure
    const serialized: SerializedAPI = {} as SerializedAPI;

    for (const [key, value] of Object.entries(api)) {
      if (typeof value === 'function') {
        serialized[key] = { __type: 'function', name: key };
      } else if (typeof value === 'object' && value !== null) {
        serialized[key] = this.serializeAPI(value);
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  // TYPESCRIPT FIX: Replace dangerous any type with proper plugin context type
  private createPluginContext(plugin: Plugin): PluginContext {
    return {
      subscriptions: [],
      extensionPath: `/plugins/${plugin.id}`,
      globalState: {
        get: (key: string) => this.api.storage.get(`${plugin.id}:${key}`),
        // TYPESCRIPT FIX: Replace dangerous any type with proper storage value type
        update: (key: string, value: StorageValue) =>
          this.api.storage.set(`${plugin.id}:${key}`, value),
      },
      workspaceState: {
        get: (key: string) => this.api.storage.get(`workspace:${plugin.id}:${key}`),
        update: (key: string, value: any) =>
          this.api.storage.set(`workspace:${plugin.id}:${key}`, value),
      },
    };
  }

  private async fetchPluginManifest(url: string): Promise<PluginManifest> {
    // ERROR HANDLING FIX: Add comprehensive error handling for manifest fetching
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid plugin URL provided');
      }

      // Validate URL format
      let baseUrl: URL;
      try {
        baseUrl = new URL(url);
      } catch {
        throw new Error('Invalid plugin URL format');
      }

      const manifestUrl = `${url}/manifest.json`;

      // Add timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(manifestUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Manifest is not valid JSON');
      }

      const manifest = await response.json();

      if (!manifest || typeof manifest !== 'object') {
        throw new Error('Invalid manifest format: not a valid JSON object');
      }

      return manifest;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Manifest fetch timeout: The request took too long');
      }
      console.error(`Plugin manifest fetch error for URL ${url}:`, error);
      throw new Error(`Failed to fetch plugin manifest: ${error.message}`);
    }
  }

  private validateManifest(manifest: PluginManifest): void {
    // Validate required fields
    if (!manifest.id || !manifest.name || !manifest.version || !manifest.main) {
      throw new Error('Invalid plugin manifest');
    }

    // Validate version
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Invalid version format');
    }

    // Validate permissions
    for (const permission of manifest.permissions) {
      if (!['file', 'network', 'system', 'ui', 'store'].includes(permission.type)) {
        throw new Error(`Invalid permission type: ${permission.type}`);
      }
    }
  }

  private async requestPermissions(permissions: PluginPermission[]): Promise<boolean> {
    // Show permission dialog to user
    return new Promise(resolve => {
      eventSystem.fire('Plugin', 'RequestPermissions', {
        permissions,
        onApprove: () => resolve(true),
        onDeny: () => resolve(false),
      });
    });
  }

  private async downloadPlugin(url: string, main: string): Promise<string> {
    // ERROR HANDLING FIX: Add comprehensive error handling for plugin download
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid plugin URL provided');
      }

      if (!main || typeof main !== 'string') {
        throw new Error('Invalid main file path provided');
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid plugin URL format');
      }

      // Validate main file path (prevent directory traversal)
      if (main.includes('..') || main.includes('/') || main.includes('\\')) {
        throw new Error('Invalid main file path: directory traversal not allowed');
      }

      const pluginUrl = `${url}/${main}`;

      // Add timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(pluginUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/javascript, text/javascript, text/plain',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content size to prevent excessive downloads
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        // 5MB limit
        throw new Error('Plugin file too large (max 5MB allowed)');
      }

      const code = await response.text();

      if (code.length > 5 * 1024 * 1024) {
        // 5MB limit
        throw new Error('Plugin code too large (max 5MB allowed)');
      }

      return code;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Plugin download timeout: The request took too long');
      }
      console.error(`Plugin download error for URL ${url}/${main}:`, error);
      throw new Error(`Failed to download plugin: ${error.message}`);
    }
  }

  private savePluginToStorage(plugin: Plugin, code: string): void {
    // ERROR HANDLING FIX: Add comprehensive error handling for storage operations
    try {
      if (!plugin || !plugin.id) {
        throw new Error('Invalid plugin object provided');
      }

      if (typeof code !== 'string') {
        throw new Error('Invalid plugin code provided');
      }

      // Check storage quota before saving
      const manifestData = JSON.stringify(plugin);
      const totalSize = manifestData.length + code.length;

      // Rough estimate: if data is larger than 4MB, warn about potential quota issues
      if (totalSize > 4 * 1024 * 1024) {
        console.warn(`Large plugin data for ${plugin.id}: ${Math.round(totalSize / 1024)}KB`);
      }

      localStorage.setItem(`plugin:${plugin.id}:manifest`, manifestData);
      localStorage.setItem(`plugin:${plugin.id}:code`, code);

      // Verify the data was saved correctly
      const savedManifest = localStorage.getItem(`plugin:${plugin.id}:manifest`);
      const savedCode = localStorage.getItem(`plugin:${plugin.id}:code`);

      if (!savedManifest || !savedCode) {
        throw new Error('Failed to verify plugin data was saved to storage');
      }
    } catch (error) {
      // Handle quota exceeded error specifically
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error(`Storage quota exceeded while saving plugin ${plugin.id}`);
        throw new Error('Not enough storage space available for plugin');
      }

      console.error(`Plugin storage error for ${plugin.id}:`, error);
      throw new Error(`Failed to save plugin to storage: ${error.message}`);
    }
  }

  private async getPluginCode(pluginId: string): Promise<string> {
    // ERROR HANDLING FIX: Add comprehensive error handling for code retrieval
    try {
      if (!pluginId || typeof pluginId !== 'string') {
        throw new Error('Invalid plugin ID provided');
      }

      // Validate plugin ID format
      if (!/^[a-zA-Z0-9_-]+$/.test(pluginId)) {
        throw new Error('Invalid plugin ID format');
      }

      // Handle mock plugins that don't have actual code
      if (pluginId === 'vb6-snippets') {
        return '/* SAFE_PLUGIN */ module.exports = { "name": "VB6 Snippets", "version": "1.0.0" };';
      }

      if (pluginId === 'git-integration') {
        return '/* SAFE_PLUGIN */ module.exports = { "name": "Git Integration", "version": "2.1.0" };';
      }

      const code = localStorage.getItem(`plugin:${pluginId}:code`);

      if (code === null) {
        throw new Error(`Plugin code not found: ${pluginId}`);
      }

      if (typeof code !== 'string') {
        throw new Error(`Invalid plugin code format for: ${pluginId}`);
      }

      if (code.length === 0) {
        throw new Error(`Empty plugin code for: ${pluginId}`);
      }

      return code;
    } catch (error) {
      console.error(`Plugin code retrieval error for ${pluginId}:`, error);
      throw new Error(`Failed to get plugin code: ${error.message}`);
    }
  }

  // Public API

  getInstalledPluginsList(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin && !plugin.isEnabled) {
      await this.loadPlugin(plugin);
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId);
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId);

    // Remove from storage
    localStorage.removeItem(`plugin:${pluginId}:manifest`);
    localStorage.removeItem(`plugin:${pluginId}:code`);

    // Remove from plugins map
    this.plugins.delete(pluginId);

    eventSystem.fire('Plugin', 'Uninstalled', { pluginId });
  }

  async updatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Check for updates
    // Download new version
    // Update plugin

    eventSystem.fire('Plugin', 'Updated', { plugin });
  }

  searchPlugins(query: string): Plugin[] {
    return Array.from(this.plugins.values()).filter(
      plugin =>
        plugin.name.toLowerCase().includes(query.toLowerCase()) ||
        plugin.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * WEBWORKER DEADLOCK FIX: Dispose method to clean up all workers
   */
  public dispose(): void {
    // Terminate all plugin sandboxes (workers)
    this.sandboxes.forEach((sandbox, pluginId) => {
      try {
        sandbox.terminate();
      } catch (error) {
        console.error(`Error terminating sandbox for plugin ${pluginId}:`, error);
      }
    });
    this.sandboxes.clear();

    // Clear all plugin registrations
    this.installedPlugins.clear();
    this.activatedPlugins.clear();
    this.contributions.clear();

    // WEBWORKER DEADLOCK FIX: Clear API references to help garbage collection
    this.api = {} as any;
  }
}

export const pluginSystem = PluginSystem.getInstance();
