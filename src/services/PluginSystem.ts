/**
 * Plugin System
 * Extensible architecture for adding custom functionality
 */

import { eventSystem } from './VB6EventSystem';
import { useVB6Store } from '../stores/vb6Store';

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

export interface PluginConfig {
  [key: string]: any;
}

export interface PluginAPI {
  // Core APIs
  eventSystem: typeof eventSystem;
  store: {
    getState: () => any;
    subscribe: (listener: () => void) => () => void;
  };
  
  // UI APIs
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showDialog: (options: any) => Promise<any>;
    registerMenuItem: (menu: string, item: any) => void;
    registerToolbarButton: (button: any) => void;
    registerPanel: (panel: any) => void;
  };
  
  // Editor APIs
  editor: {
    getCurrentCode: () => string;
    setCode: (code: string) => void;
    insertAtCursor: (text: string) => void;
    getSelection: () => string;
    registerLanguage: (language: any) => void;
    registerTheme: (theme: any) => void;
  };
  
  // Control APIs
  controls: {
    registerControl: (control: any) => void;
    getControl: (id: string) => any;
    updateControl: (id: string, updates: any) => void;
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
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
  };
  
  // Utilities
  utils: {
    uuid: () => string;
    debounce: <T extends (...args: any[]) => any>(fn: T, ms: number) => T;
    throttle: <T extends (...args: any[]) => any>(fn: T, ms: number) => T;
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
  contributes?: {
    commands?: any[];
    menus?: any[];
    keybindings?: any[];
    languages?: any[];
    themes?: any[];
    controls?: any[];
  };
}

export class PluginSystem {
  private static instance: PluginSystem;
  private plugins: Map<string, Plugin> = new Map();
  private loadedPlugins: Map<string, any> = new Map();
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
        showDialog: async (options) => {
          return new Promise((resolve) => {
            eventSystem.fire('Plugin', 'ShowDialog', { ...options, resolve });
          });
        },
        registerMenuItem: (menu, item) => {
          eventSystem.fire('Plugin', 'RegisterMenuItem', { menu, item });
        },
        registerToolbarButton: (button) => {
          eventSystem.fire('Plugin', 'RegisterToolbarButton', button);
        },
        registerPanel: (panel) => {
          eventSystem.fire('Plugin', 'RegisterPanel', panel);
        },
      },
      
      editor: {
        getCurrentCode: () => useVB6Store.getState().currentCode,
        setCode: (code) => useVB6Store.getState().updateCode(code),
        insertAtCursor: (text) => {
          eventSystem.fire('Plugin', 'InsertText', { text });
        },
        getSelection: () => {
          // Return selected text
          return '';
        },
        registerLanguage: (language) => {
          eventSystem.fire('Plugin', 'RegisterLanguage', language);
        },
        registerTheme: (theme) => {
          eventSystem.fire('Plugin', 'RegisterTheme', theme);
        },
      },
      
      controls: {
        registerControl: (control) => {
          eventSystem.fire('Plugin', 'RegisterControl', control);
        },
        getControl: (id) => {
          return useVB6Store.getState().controls.find(c => c.id === id);
        },
        updateControl: (id, updates) => {
          useVB6Store.getState().updateControl(id, updates);
        },
      },
      
      file: {
        read: async (path) => {
          // Implement file reading with permission check
          return '';
        },
        write: async (path, content) => {
          // Implement file writing with permission check
        },
        exists: async (path) => {
          // Check if file exists
          return false;
        },
        list: async (path) => {
          // List files in directory
          return [];
        },
      },
      
      network: {
        fetch: async (url, options) => {
          // Implement fetch with permission check
          return fetch(url, options);
        },
      },
      
      storage: {
        get: (key) => {
          return localStorage.getItem(`plugin_${key}`);
        },
        set: (key, value) => {
          localStorage.setItem(`plugin_${key}`, JSON.stringify(value));
        },
        remove: (key) => {
          localStorage.removeItem(`plugin_${key}`);
        },
        clear: () => {
          // Clear plugin storage
        },
      },
      
      utils: {
        uuid: () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        },
        debounce: (fn, ms) => {
          let timeoutId: NodeJS.Timeout;
          return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), ms);
          };
        },
        throttle: (fn, ms) => {
          let lastTime = 0;
          return (...args: any[]) => {
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
    // Load plugins from storage or server
    const installedPlugins = this.getInstalledPlugins();
    
    for (const plugin of installedPlugins) {
      if (plugin.isEnabled) {
        await this.loadPlugin(plugin);
      }
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
    // Download and install plugin
    const manifest = await this.fetchPluginManifest(pluginUrl);
    
    // Validate manifest
    this.validateManifest(manifest);
    
    // Check permissions
    const granted = await this.requestPermissions(manifest.permissions);
    if (!granted) {
      throw new Error('Permission denied');
    }
    
    // Download plugin files
    const pluginCode = await this.downloadPlugin(pluginUrl, manifest.main);
    
    // Create plugin object
    const plugin: Plugin = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      author: manifest.author.name,
      description: manifest.description,
      icon: manifest.icon,
      category: manifest.category as Plugin['category'],
      permissions: manifest.permissions,
      main: manifest.main,
      dependencies: manifest.dependencies ? Object.keys(manifest.dependencies) : undefined,
      isEnabled: false,
      isInstalled: true,
    };
    
    // Store plugin
    this.plugins.set(plugin.id, plugin);
    this.savePluginToStorage(plugin, pluginCode);
    
    eventSystem.fire('Plugin', 'Installed', { plugin });
    
    return plugin;
  }
  
  async loadPlugin(plugin: Plugin): Promise<void> {
    if (this.loadedPlugins.has(plugin.id)) {
      return; // Already loaded
    }
    
    try {
      // Check dependencies
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.loadedPlugins.has(dep)) {
            await this.loadPlugin(this.plugins.get(dep)!);
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
              // Execute plugin code
              const module = {};
              const exports = {};
              
              // Evaluate plugin code
              eval(data.code);
              
              pluginModule = module.exports || exports;
              
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
    const worker = new Worker(URL.createObjectURL(blob));
    
    // Initialize worker with API
    worker.postMessage({ type: 'init', data: { api: this.createSandboxedAPI(plugin) } });
    
    return worker;
  }
  
  private createSandboxedAPI(plugin: Plugin): any {
    // Create a restricted API based on plugin permissions
    const api: any = {};
    
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
      fire: (sender: string, event: string, data: any) => {
        eventSystem.fire(`Plugin:${plugin.id}:${sender}`, event, data);
      },
      on: (sender: string, event: string, handler: (...args: any[]) => any) => {
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
  
  private createPluginProxy(sandbox: Worker, plugin: Plugin): any {
    return new Proxy({}, {
      get: (target, prop) => {
        return (...args: any[]) => {
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
    });
  }
  
  private createPluginContext(plugin: Plugin): any {
    return {
      subscriptions: [],
      extensionPath: `/plugins/${plugin.id}`,
      globalState: {
        get: (key: string) => this.api.storage.get(`${plugin.id}:${key}`),
        update: (key: string, value: any) => this.api.storage.set(`${plugin.id}:${key}`, value),
      },
      workspaceState: {
        get: (key: string) => this.api.storage.get(`workspace:${plugin.id}:${key}`),
        update: (key: string, value: any) => this.api.storage.set(`workspace:${plugin.id}:${key}`, value),
      },
    };
  }
  
  private async fetchPluginManifest(url: string): Promise<PluginManifest> {
    const response = await fetch(`${url}/manifest.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch plugin manifest');
    }
    return response.json();
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
    return new Promise((resolve) => {
      eventSystem.fire('Plugin', 'RequestPermissions', {
        permissions,
        onApprove: () => resolve(true),
        onDeny: () => resolve(false),
      });
    });
  }
  
  private async downloadPlugin(url: string, main: string): Promise<string> {
    const response = await fetch(`${url}/${main}`);
    if (!response.ok) {
      throw new Error('Failed to download plugin');
    }
    return response.text();
  }
  
  private savePluginToStorage(plugin: Plugin, code: string): void {
    localStorage.setItem(`plugin:${plugin.id}:manifest`, JSON.stringify(plugin));
    localStorage.setItem(`plugin:${plugin.id}:code`, code);
  }
  
  private async getPluginCode(pluginId: string): Promise<string> {
    const code = localStorage.getItem(`plugin:${pluginId}:code`);
    if (!code) {
      throw new Error(`Plugin code not found: ${pluginId}`);
    }
    return code;
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
    return Array.from(this.plugins.values()).filter(plugin => 
      plugin.name.toLowerCase().includes(query.toLowerCase()) ||
      plugin.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const pluginSystem = PluginSystem.getInstance();