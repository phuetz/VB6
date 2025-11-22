/**
 * VB6 Registry Functions Implementation
 * 
 * Web-compatible implementation of VB6 registry functions
 * SaveSetting, GetSetting, DeleteSetting, GetAllSettings
 * Note: Uses localStorage for persistence since web browsers can't access Windows registry
 */

import { errorHandler } from './VB6ErrorHandling';

// VB6 Registry root keys (for compatibility, but all stored in localStorage)
export const VB6RegistryConstants = {
  HKEY_CURRENT_USER: 'HKEY_CURRENT_USER',
  HKEY_LOCAL_MACHINE: 'HKEY_LOCAL_MACHINE',
  HKEY_CLASSES_ROOT: 'HKEY_CLASSES_ROOT',
  HKEY_USERS: 'HKEY_USERS',
  HKEY_CURRENT_CONFIG: 'HKEY_CURRENT_CONFIG'
} as const;

// Registry simulation using localStorage
class VB6Registry {
  private static readonly VB6_REGISTRY_PREFIX = 'VB6_Registry_';
  private static readonly VB6_SETTINGS_PATH = 'Software\\VB and VBA Program Settings\\';

  /**
   * Get the full registry key path for VB6 settings
   */
  private static getSettingsKey(appName: string, section: string, key?: string): string {
    let path = this.VB6_REGISTRY_PREFIX + this.VB6_SETTINGS_PATH + appName + '\\' + section;
    if (key) {
      path += '\\' + key;
    }
    return path;
  }

  /**
   * Save a setting to the simulated registry (localStorage)
   */
  static saveSetting(appName: string, section: string, key: string, setting: string): void {
    try {
      if (!appName || !section || !key) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'SaveSetting');
        return;
      }

      const registryKey = this.getSettingsKey(appName, section, key);
      
      // Store in localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(registryKey, String(setting));
      } else {
        // Fallback for environments without localStorage
        (globalThis as any).__vb6Registry = (globalThis as any).__vb6Registry || {};
        (globalThis as any).__vb6Registry[registryKey] = String(setting);
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'SaveSetting');
    }
  }

  /**
   * Get a setting from the simulated registry (localStorage)
   */
  static getSetting(appName: string, section: string, key: string, defaultValue: string = ''): string {
    try {
      if (!appName || !section || !key) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetSetting');
        return defaultValue;
      }

      const registryKey = this.getSettingsKey(appName, section, key);
      
      // Get from localStorage
      if (typeof localStorage !== 'undefined') {
        const value = localStorage.getItem(registryKey);
        return value !== null ? value : defaultValue;
      } else {
        // Fallback for environments without localStorage
        const registry = (globalThis as any).__vb6Registry || {};
        return registry[registryKey] || defaultValue;
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetSetting');
      return defaultValue;
    }
  }

  /**
   * Delete a setting from the simulated registry
   */
  static deleteSetting(appName: string, section: string, key?: string): void {
    try {
      if (!appName || !section) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'DeleteSetting');
        return;
      }

      if (key) {
        // Delete specific key
        const registryKey = this.getSettingsKey(appName, section, key);
        
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(registryKey);
        } else {
          const registry = (globalThis as any).__vb6Registry || {};
          delete registry[registryKey];
        }
      } else {
        // Delete entire section
        const sectionPrefix = this.getSettingsKey(appName, section);
        
        if (typeof localStorage !== 'undefined') {
          // Find and remove all keys that start with the section prefix
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(sectionPrefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } else {
          const registry = (globalThis as any).__vb6Registry || {};
          Object.keys(registry).forEach(key => {
            if (key.startsWith(sectionPrefix)) {
              delete registry[key];
            }
          });
        }
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'DeleteSetting');
    }
  }

  /**
   * Get all settings for a section
   */
  static getAllSettings(appName: string, section: string): string[][] {
    try {
      if (!appName || !section) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetAllSettings');
        return [];
      }

      const sectionPrefix = this.getSettingsKey(appName, section) + '\\';
      const settings: string[][] = [];
      
      if (typeof localStorage !== 'undefined') {
        // Search localStorage for matching keys
        for (let i = 0; i < localStorage.length; i++) {
          const fullKey = localStorage.key(i);
          if (fullKey && fullKey.startsWith(sectionPrefix)) {
            const keyName = fullKey.substring(sectionPrefix.length);
            const value = localStorage.getItem(fullKey);
            if (value !== null) {
              settings.push([keyName, value]);
            }
          }
        }
      } else {
        const registry = (globalThis as any).__vb6Registry || {};
        Object.keys(registry).forEach(fullKey => {
          if (fullKey.startsWith(sectionPrefix)) {
            const keyName = fullKey.substring(sectionPrefix.length);
            const value = registry[fullKey];
            settings.push([keyName, value]);
          }
        });
      }
      
      return settings;
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetAllSettings');
      return [];
    }
  }

  /**
   * Get all section names for an application
   */
  static getAllSections(appName: string): string[] {
    try {
      if (!appName) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetAllSections');
        return [];
      }

      const appPrefix = this.VB6_REGISTRY_PREFIX + this.VB6_SETTINGS_PATH + appName + '\\';
      const sections = new Set<string>();
      
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const fullKey = localStorage.key(i);
          if (fullKey && fullKey.startsWith(appPrefix)) {
            const remainder = fullKey.substring(appPrefix.length);
            const sectionEnd = remainder.indexOf('\\');
            if (sectionEnd > 0) {
              const sectionName = remainder.substring(0, sectionEnd);
              sections.add(sectionName);
            }
          }
        }
      } else {
        const registry = (globalThis as any).__vb6Registry || {};
        Object.keys(registry).forEach(fullKey => {
          if (fullKey.startsWith(appPrefix)) {
            const remainder = fullKey.substring(appPrefix.length);
            const sectionEnd = remainder.indexOf('\\');
            if (sectionEnd > 0) {
              const sectionName = remainder.substring(0, sectionEnd);
              sections.add(sectionName);
            }
          }
        });
      }
      
      return Array.from(sections);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetAllSections');
      return [];
    }
  }

  /**
   * Check if a setting exists
   */
  static settingExists(appName: string, section: string, key: string): boolean {
    try {
      if (!appName || !section || !key) {
        return false;
      }

      const registryKey = this.getSettingsKey(appName, section, key);
      
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(registryKey) !== null;
      } else {
        const registry = (globalThis as any).__vb6Registry || {};
        return registryKey in registry;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all settings for an application
   */
  static clearAllSettings(appName: string): void {
    try {
      if (!appName) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'ClearAllSettings');
        return;
      }

      const appPrefix = this.VB6_REGISTRY_PREFIX + this.VB6_SETTINGS_PATH + appName + '\\';
      
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(appPrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        const registry = (globalThis as any).__vb6Registry || {};
        Object.keys(registry).forEach(key => {
          if (key.startsWith(appPrefix)) {
            delete registry[key];
          }
        });
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'ClearAllSettings');
    }
  }

  /**
   * Export all settings for an application as JSON
   */
  static exportSettings(appName: string): string {
    try {
      if (!appName) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'ExportSettings');
        return '{}';
      }

      const appPrefix = this.VB6_REGISTRY_PREFIX + this.VB6_SETTINGS_PATH + appName + '\\';
      const settings: { [key: string]: any } = {};
      
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const fullKey = localStorage.key(i);
          if (fullKey && fullKey.startsWith(appPrefix)) {
            const keyPath = fullKey.substring(appPrefix.length);
            const value = localStorage.getItem(fullKey);
            if (value !== null) {
              // Convert path to nested object structure
              const parts = keyPath.split('\\');
              let current = settings;
              for (let j = 0; j < parts.length - 1; j++) {
                if (!current[parts[j]]) {
                  current[parts[j]] = {};
                }
                current = current[parts[j]];
              }
              current[parts[parts.length - 1]] = value;
            }
          }
        }
      } else {
        const registry = (globalThis as any).__vb6Registry || {};
        Object.keys(registry).forEach(fullKey => {
          if (fullKey.startsWith(appPrefix)) {
            const keyPath = fullKey.substring(appPrefix.length);
            const value = registry[fullKey];
            // Convert path to nested object structure
            const parts = keyPath.split('\\');
            let current = settings;
            for (let j = 0; j < parts.length - 1; j++) {
              if (!current[parts[j]]) {
                current[parts[j]] = {};
              }
              current = current[parts[j]];
            }
            current[parts[parts.length - 1]] = value;
          }
        });
      }
      
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'ExportSettings');
      return '{}';
    }
  }

  /**
   * Import settings from JSON
   */
  static importSettings(appName: string, jsonData: string): void {
    try {
      if (!appName || !jsonData) {
        errorHandler.raiseError(5, 'Invalid procedure call or argument', 'ImportSettings');
        return;
      }

      const settings = JSON.parse(jsonData);
      
      // Clear existing settings first
      this.clearAllSettings(appName);
      
      // Import new settings
      this.importSettingsRecursive(appName, '', settings);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'ImportSettings');
    }
  }

  /**
   * Helper method for recursive settings import
   */
  private static importSettingsRecursive(appName: string, sectionPath: string, obj: any): void {
    Object.keys(obj).forEach(key => {
      const currentSection = sectionPath ? `${sectionPath}\\${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively import nested objects
        this.importSettingsRecursive(appName, currentSection, obj[key]);
      } else {
        // This is a leaf value, save it
        const parentSection = sectionPath || 'General';
        this.saveSetting(appName, parentSection, key, String(obj[key]));
      }
    });
  }
}

/**
 * VB6 SaveSetting Function
 * Saves or creates an entry in the application's entry in the Windows registry
 */
export function SaveSetting(appName: string, section: string, key: string, setting: string): void {
  VB6Registry.saveSetting(appName, section, key, setting);
}

/**
 * VB6 GetSetting Function  
 * Returns a key setting value from an application's entry in the Windows registry
 */
export function GetSetting(appName: string, section: string, key: string, defaultValue: string = ''): string {
  return VB6Registry.getSetting(appName, section, key, defaultValue);
}

/**
 * VB6 DeleteSetting Function
 * Removes a section or key setting from an application's entry in the Windows registry
 */
export function DeleteSetting(appName: string, section: string, key?: string): void {
  VB6Registry.deleteSetting(appName, section, key);
}

/**
 * VB6 GetAllSettings Function
 * Returns a list of key settings and their respective values from an application's entry in the registry
 */
export function GetAllSettings(appName: string, section: string): string[][] {
  return VB6Registry.getAllSettings(appName, section);
}

/**
 * Additional helper functions not in standard VB6 but useful for registry management
 */

/**
 * Get all section names for an application
 */
export function GetAllSections(appName: string): string[] {
  return VB6Registry.getAllSections(appName);
}

/**
 * Check if a setting exists
 */
export function SettingExists(appName: string, section: string, key: string): boolean {
  return VB6Registry.settingExists(appName, section, key);
}

/**
 * Clear all settings for an application
 */
export function ClearAllSettings(appName: string): void {
  VB6Registry.clearAllSettings(appName);
}

/**
 * Export application settings as JSON
 */
export function ExportSettings(appName: string): string {
  return VB6Registry.exportSettings(appName);
}

/**
 * Import application settings from JSON
 */
export function ImportSettings(appName: string, jsonData: string): void {
  VB6Registry.importSettings(appName, jsonData);
}

/**
 * Get registry information and stats
 */
export function GetRegistryInfo(): { [key: string]: any } {
  try {
    const info: { [key: string]: any } = {
      storageType: typeof localStorage !== 'undefined' ? 'localStorage' : 'memory',
      totalKeys: 0,
      applications: [],
      totalSize: 0
    };

    const applications = new Set<string>();
    const VB6_PREFIX = 'VB6_Registry_Software\\VB and VBA Program Settings\\';
    
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('VB6_Registry_')) {
          info.totalKeys++;
          const value = localStorage.getItem(key);
          if (value) {
            info.totalSize += key.length + value.length;
          }
          
          // Extract application name
          if (key.startsWith(VB6_PREFIX)) {
            const remainder = key.substring(VB6_PREFIX.length);
            const appEnd = remainder.indexOf('\\');
            if (appEnd > 0) {
              applications.add(remainder.substring(0, appEnd));
            }
          }
        }
      }
    } else {
      const registry = (globalThis as any).__vb6Registry || {};
      Object.keys(registry).forEach(key => {
        if (key.startsWith('VB6_Registry_')) {
          info.totalKeys++;
          const value = registry[key];
          info.totalSize += key.length + String(value).length;
          
          // Extract application name
          if (key.startsWith(VB6_PREFIX)) {
            const remainder = key.substring(VB6_PREFIX.length);
            const appEnd = remainder.indexOf('\\');
            if (appEnd > 0) {
              applications.add(remainder.substring(0, appEnd));
            }
          }
        }
      });
    }
    
    info.applications = Array.from(applications);
    info.totalSizeKB = Math.round(info.totalSize / 1024 * 100) / 100;
    
    return info;
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GetRegistryInfo');
    return {};
  }
}

// Export all registry functions
export const VB6RegistryFunctions = {
  // Constants
  VB6RegistryConstants,
  
  // Core VB6 functions
  SaveSetting,
  GetSetting,
  DeleteSetting,
  GetAllSettings,
  
  // Extended functions
  GetAllSections,
  SettingExists,
  ClearAllSettings,
  ExportSettings,
  ImportSettings,
  GetRegistryInfo
};