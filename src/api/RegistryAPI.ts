import { EventEmitter } from 'events';

// Registry Constants
export enum RegistryHive {
  HKEY_CLASSES_ROOT = 0x80000000,
  HKEY_CURRENT_USER = 0x80000001,
  HKEY_LOCAL_MACHINE = 0x80000002,
  HKEY_USERS = 0x80000003,
  HKEY_PERFORMANCE_DATA = 0x80000004,
  HKEY_CURRENT_CONFIG = 0x80000005,
  HKEY_DYN_DATA = 0x80000006,
}

export enum RegistryValueType {
  REG_NONE = 0,
  REG_SZ = 1,
  REG_EXPAND_SZ = 2,
  REG_BINARY = 3,
  REG_DWORD = 4,
  REG_DWORD_BIG_ENDIAN = 5,
  REG_LINK = 6,
  REG_MULTI_SZ = 7,
  REG_RESOURCE_LIST = 8,
  REG_FULL_RESOURCE_DESCRIPTOR = 9,
  REG_RESOURCE_REQUIREMENTS_LIST = 10,
  REG_QWORD = 11,
}

export enum RegistryAccess {
  KEY_QUERY_VALUE = 0x0001,
  KEY_SET_VALUE = 0x0002,
  KEY_CREATE_SUB_KEY = 0x0004,
  KEY_ENUMERATE_SUB_KEYS = 0x0008,
  KEY_NOTIFY = 0x0010,
  KEY_CREATE_LINK = 0x0020,
  KEY_WOW64_32KEY = 0x0200,
  KEY_WOW64_64KEY = 0x0100,
  KEY_WOW64_RES = 0x0300,
  KEY_READ = 0x20019,
  KEY_WRITE = 0x20006,
  KEY_EXECUTE = 0x20020,
  KEY_ALL_ACCESS = 0xf003f,
}

export enum RegistryOptions {
  REG_OPTION_NON_VOLATILE = 0x00000000,
  REG_OPTION_VOLATILE = 0x00000001,
  REG_OPTION_CREATE_LINK = 0x00000002,
  REG_OPTION_BACKUP_RESTORE = 0x00000004,
  REG_OPTION_OPEN_LINK = 0x00000008,
}

export enum RegistryDisposition {
  REG_CREATED_NEW_KEY = 0x00000001,
  REG_OPENED_EXISTING_KEY = 0x00000002,
}

export enum RegistryErrorCode {
  ERROR_SUCCESS = 0,
  ERROR_FILE_NOT_FOUND = 2,
  ERROR_ACCESS_DENIED = 5,
  ERROR_INVALID_HANDLE = 6,
  ERROR_INVALID_PARAMETER = 87,
  ERROR_MORE_DATA = 234,
  ERROR_NO_MORE_ITEMS = 259,
  ERROR_KEY_DELETED = 1018,
}

// Registry Value
export interface RegistryValue {
  name: string;
  type: RegistryValueType;
  data: any;
}

// Registry Key Info
export interface RegistryKeyInfo {
  subKeyCount: number;
  maxSubKeyLength: number;
  valueCount: number;
  maxValueNameLength: number;
  maxValueDataLength: number;
  lastWriteTime: Date;
}

// Registry Key Handle
interface RegistryKeyHandle {
  hive: RegistryHive;
  path: string;
  access: RegistryAccess;
  handle: number;
}

export class RegistryAPI extends EventEmitter {
  private static instance: RegistryAPI;
  private localStorage: Storage | null = null;
  private sessionStorage: Storage | null = null;
  private handles: Map<number, RegistryKeyHandle> = new Map();
  private nextHandle = 1;

  // Simulated registry structure
  private registry: Map<string, Map<string, RegistryValue>> = new Map();

  private constructor() {
    super();

    // Use browser storage as registry backend
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
      this.sessionStorage = window.sessionStorage;
    }

    // Initialize with some default registry entries
    this.initializeDefaultRegistry();
  }

  public static getInstance(): RegistryAPI {
    if (!RegistryAPI.instance) {
      RegistryAPI.instance = new RegistryAPI();
    }
    return RegistryAPI.instance;
  }

  private initializeDefaultRegistry(): void {
    // HKEY_CURRENT_USER\Software
    this.setRegistryValue(
      `${RegistryHive.HKEY_CURRENT_USER}\\Software\\VB6IDE`,
      'Version',
      RegistryValueType.REG_SZ,
      '6.0.0.0'
    );

    // HKEY_LOCAL_MACHINE\Software
    this.setRegistryValue(
      `${RegistryHive.HKEY_LOCAL_MACHINE}\\Software\\Microsoft\\Windows\\CurrentVersion`,
      'ProgramFilesDir',
      RegistryValueType.REG_SZ,
      'C:\\Program Files'
    );

    this.setRegistryValue(
      `${RegistryHive.HKEY_LOCAL_MACHINE}\\Software\\Microsoft\\Windows\\CurrentVersion`,
      'Version',
      RegistryValueType.REG_SZ,
      '10.0'
    );

    // HKEY_CLASSES_ROOT file associations
    this.setRegistryValue(
      `${RegistryHive.HKEY_CLASSES_ROOT}\\.txt`,
      '',
      RegistryValueType.REG_SZ,
      'txtfile'
    );

    this.setRegistryValue(
      `${RegistryHive.HKEY_CLASSES_ROOT}\\txtfile`,
      '',
      RegistryValueType.REG_SZ,
      'Text Document'
    );
  }

  private getFullKeyPath(hKey: number | RegistryHive, subKey: string): string {
    if (this.handles.has(hKey as number)) {
      const handle = this.handles.get(hKey as number)!;
      return subKey ? `${handle.path}\\${subKey}` : handle.path;
    }

    // It's a predefined hive
    return subKey ? `${hKey}\\${subKey}` : `${hKey}`;
  }

  private getStorageKey(path: string): string {
    return `VB6_REG_${path.replace(/\\/g, '_')}`;
  }

  private setRegistryValue(
    keyPath: string,
    valueName: string,
    type: RegistryValueType,
    data: any
  ): void {
    if (!this.registry.has(keyPath)) {
      this.registry.set(keyPath, new Map());
    }

    const key = this.registry.get(keyPath)!;
    key.set(valueName, { name: valueName, type, data });

    // Also persist to localStorage
    if (this.localStorage) {
      const storageKey = this.getStorageKey(`${keyPath}\\${valueName}`);
      this.localStorage.setItem(storageKey, JSON.stringify({ type, data }));
    }
  }

  private getRegistryValue(keyPath: string, valueName: string): RegistryValue | null {
    // First check in-memory registry
    const key = this.registry.get(keyPath);
    if (key) {
      const value = key.get(valueName);
      if (value) return value;
    }

    // Check localStorage
    if (this.localStorage) {
      const storageKey = this.getStorageKey(`${keyPath}\\${valueName}`);
      const stored = this.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const { type, data } = JSON.parse(stored);
          return { name: valueName, type, data };
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }

    return null;
  }

  // RegOpenKeyEx - Open registry key
  public RegOpenKeyEx(
    hKey: number | RegistryHive,
    lpSubKey: string,
    ulOptions: number,
    samDesired: RegistryAccess
  ): { phkResult: number; errorCode: RegistryErrorCode } {
    try {
      const fullPath = this.getFullKeyPath(hKey, lpSubKey);
      const handle = this.nextHandle++;

      this.handles.set(handle, {
        hive:
          typeof hKey === 'number' && hKey > 1000
            ? this.handles.get(hKey)!.hive
            : (hKey as RegistryHive),
        path: fullPath,
        access: samDesired,
        handle,
      });

      this.emit('keyOpened', { handle, path: fullPath });
      return { phkResult: handle, errorCode: RegistryErrorCode.ERROR_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { phkResult: 0, errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED };
    }
  }

  // RegCreateKeyEx - Create registry key
  public RegCreateKeyEx(
    hKey: number | RegistryHive,
    lpSubKey: string,
    Reserved: number,
    lpClass: string | null,
    dwOptions: RegistryOptions,
    samDesired: RegistryAccess
  ): { phkResult: number; lpdwDisposition: RegistryDisposition; errorCode: RegistryErrorCode } {
    try {
      const fullPath = this.getFullKeyPath(hKey, lpSubKey);

      // Check if key already exists
      const exists = this.registry.has(fullPath);

      if (!exists) {
        this.registry.set(fullPath, new Map());

        // Store key existence in localStorage
        if (this.localStorage) {
          const storageKey = this.getStorageKey(fullPath);
          this.localStorage.setItem(storageKey, 'KEY');
        }
      }

      const handle = this.nextHandle++;
      this.handles.set(handle, {
        hive:
          typeof hKey === 'number' && hKey > 1000
            ? this.handles.get(hKey)!.hive
            : (hKey as RegistryHive),
        path: fullPath,
        access: samDesired,
        handle,
      });

      this.emit('keyCreated', { handle, path: fullPath, created: !exists });

      return {
        phkResult: handle,
        lpdwDisposition: exists
          ? RegistryDisposition.REG_OPENED_EXISTING_KEY
          : RegistryDisposition.REG_CREATED_NEW_KEY,
        errorCode: RegistryErrorCode.ERROR_SUCCESS,
      };
    } catch (error) {
      this.emit('error', error);
      return {
        phkResult: 0,
        lpdwDisposition: RegistryDisposition.REG_OPENED_EXISTING_KEY,
        errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED,
      };
    }
  }

  // RegCloseKey - Close registry key
  public RegCloseKey(hKey: number): RegistryErrorCode {
    try {
      if (this.handles.delete(hKey)) {
        this.emit('keyClosed', { handle: hKey });
        return RegistryErrorCode.ERROR_SUCCESS;
      }
      return RegistryErrorCode.ERROR_INVALID_HANDLE;
    } catch (error) {
      this.emit('error', error);
      return RegistryErrorCode.ERROR_INVALID_HANDLE;
    }
  }

  // RegSetValueEx - Set registry value
  public RegSetValueEx(
    hKey: number,
    lpValueName: string | null,
    Reserved: number,
    dwType: RegistryValueType,
    lpData: any
  ): RegistryErrorCode {
    try {
      const handle = this.handles.get(hKey);
      if (!handle) return RegistryErrorCode.ERROR_INVALID_HANDLE;

      if (!(handle.access & RegistryAccess.KEY_SET_VALUE)) {
        return RegistryErrorCode.ERROR_ACCESS_DENIED;
      }

      const valueName = lpValueName || '';
      this.setRegistryValue(handle.path, valueName, dwType, lpData);

      this.emit('valueSet', { key: handle.path, name: valueName, type: dwType, data: lpData });
      return RegistryErrorCode.ERROR_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return RegistryErrorCode.ERROR_ACCESS_DENIED;
    }
  }

  // RegQueryValueEx - Query registry value
  public RegQueryValueEx(
    hKey: number,
    lpValueName: string | null,
    lpReserved: number
  ): { lpType: RegistryValueType; lpData: any; errorCode: RegistryErrorCode } {
    try {
      const handle = this.handles.get(hKey);
      if (!handle) {
        return {
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_INVALID_HANDLE,
        };
      }

      if (!(handle.access & RegistryAccess.KEY_QUERY_VALUE)) {
        return {
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED,
        };
      }

      const valueName = lpValueName || '';
      const value = this.getRegistryValue(handle.path, valueName);

      if (!value) {
        return {
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_FILE_NOT_FOUND,
        };
      }

      this.emit('valueQueried', { key: handle.path, name: valueName });
      return { lpType: value.type, lpData: value.data, errorCode: RegistryErrorCode.ERROR_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return {
        lpType: RegistryValueType.REG_NONE,
        lpData: null,
        errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED,
      };
    }
  }

  // RegDeleteValue - Delete registry value
  public RegDeleteValue(hKey: number, lpValueName: string): RegistryErrorCode {
    try {
      const handle = this.handles.get(hKey);
      if (!handle) return RegistryErrorCode.ERROR_INVALID_HANDLE;

      if (!(handle.access & RegistryAccess.KEY_SET_VALUE)) {
        return RegistryErrorCode.ERROR_ACCESS_DENIED;
      }

      const key = this.registry.get(handle.path);
      if (!key) return RegistryErrorCode.ERROR_FILE_NOT_FOUND;

      if (!key.delete(lpValueName)) {
        return RegistryErrorCode.ERROR_FILE_NOT_FOUND;
      }

      // Remove from localStorage
      if (this.localStorage) {
        const storageKey = this.getStorageKey(`${handle.path}\\${lpValueName}`);
        this.localStorage.removeItem(storageKey);
      }

      this.emit('valueDeleted', { key: handle.path, name: lpValueName });
      return RegistryErrorCode.ERROR_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return RegistryErrorCode.ERROR_ACCESS_DENIED;
    }
  }

  // RegDeleteKey - Delete registry key
  public RegDeleteKey(hKey: number | RegistryHive, lpSubKey: string): RegistryErrorCode {
    try {
      const fullPath = this.getFullKeyPath(hKey, lpSubKey);

      if (!this.registry.delete(fullPath)) {
        return RegistryErrorCode.ERROR_FILE_NOT_FOUND;
      }

      // Remove from localStorage
      if (this.localStorage) {
        // Remove all values under this key
        const prefix = this.getStorageKey(fullPath);
        const keysToRemove: string[] = [];

        for (let i = 0; i < this.localStorage.length; i++) {
          const key = this.localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => this.localStorage!.removeItem(key));
      }

      this.emit('keyDeleted', { path: fullPath });
      return RegistryErrorCode.ERROR_SUCCESS;
    } catch (error) {
      this.emit('error', error);
      return RegistryErrorCode.ERROR_ACCESS_DENIED;
    }
  }

  // RegEnumKeyEx - Enumerate subkeys
  public RegEnumKeyEx(
    hKey: number,
    dwIndex: number
  ): { lpName: string | null; errorCode: RegistryErrorCode } {
    try {
      const handle = this.handles.get(hKey);
      if (!handle) {
        return { lpName: null, errorCode: RegistryErrorCode.ERROR_INVALID_HANDLE };
      }

      if (!(handle.access & RegistryAccess.KEY_ENUMERATE_SUB_KEYS)) {
        return { lpName: null, errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED };
      }

      // Find all subkeys
      const subkeys: string[] = [];
      const prefix = handle.path + '\\';

      this.registry.forEach((_, keyPath) => {
        if (keyPath.startsWith(prefix)) {
          const relative = keyPath.substring(prefix.length);
          const firstBackslash = relative.indexOf('\\');
          const subkey = firstBackslash >= 0 ? relative.substring(0, firstBackslash) : relative;

          if (subkey && !subkeys.includes(subkey)) {
            subkeys.push(subkey);
          }
        }
      });

      if (dwIndex >= subkeys.length) {
        return { lpName: null, errorCode: RegistryErrorCode.ERROR_NO_MORE_ITEMS };
      }

      return { lpName: subkeys[dwIndex], errorCode: RegistryErrorCode.ERROR_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { lpName: null, errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED };
    }
  }

  // RegEnumValue - Enumerate values
  public RegEnumValue(
    hKey: number,
    dwIndex: number
  ): {
    lpValueName: string | null;
    lpType: RegistryValueType;
    lpData: any;
    errorCode: RegistryErrorCode;
  } {
    try {
      const handle = this.handles.get(hKey);
      if (!handle) {
        return {
          lpValueName: null,
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_INVALID_HANDLE,
        };
      }

      if (!(handle.access & RegistryAccess.KEY_QUERY_VALUE)) {
        return {
          lpValueName: null,
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED,
        };
      }

      const key = this.registry.get(handle.path);
      if (!key) {
        return {
          lpValueName: null,
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_FILE_NOT_FOUND,
        };
      }

      const values = Array.from(key.values());
      if (dwIndex >= values.length) {
        return {
          lpValueName: null,
          lpType: RegistryValueType.REG_NONE,
          lpData: null,
          errorCode: RegistryErrorCode.ERROR_NO_MORE_ITEMS,
        };
      }

      const value = values[dwIndex];
      return {
        lpValueName: value.name,
        lpType: value.type,
        lpData: value.data,
        errorCode: RegistryErrorCode.ERROR_SUCCESS,
      };
    } catch (error) {
      this.emit('error', error);
      return {
        lpValueName: null,
        lpType: RegistryValueType.REG_NONE,
        lpData: null,
        errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED,
      };
    }
  }

  // RegQueryInfoKey - Get key information
  public RegQueryInfoKey(hKey: number): {
    info: RegistryKeyInfo | null;
    errorCode: RegistryErrorCode;
  } {
    try {
      const handle = this.handles.get(hKey);
      if (!handle) {
        return { info: null, errorCode: RegistryErrorCode.ERROR_INVALID_HANDLE };
      }

      const key = this.registry.get(handle.path);
      const values = key ? Array.from(key.values()) : [];

      // Count subkeys
      let subKeyCount = 0;
      let maxSubKeyLength = 0;
      const prefix = handle.path + '\\';

      this.registry.forEach((_, keyPath) => {
        if (keyPath.startsWith(prefix)) {
          const relative = keyPath.substring(prefix.length);
          const firstBackslash = relative.indexOf('\\');

          if (firstBackslash === -1) {
            subKeyCount++;
            maxSubKeyLength = Math.max(maxSubKeyLength, relative.length);
          }
        }
      });

      const info: RegistryKeyInfo = {
        subKeyCount,
        maxSubKeyLength,
        valueCount: values.length,
        maxValueNameLength: Math.max(0, ...values.map(v => v.name.length)),
        maxValueDataLength: Math.max(
          0,
          ...values.map(v => {
            if (typeof v.data === 'string') return v.data.length;
            if (v.data instanceof Uint8Array) return v.data.length;
            return 4; // DWORD size
          })
        ),
        lastWriteTime: new Date(),
      };

      return { info, errorCode: RegistryErrorCode.ERROR_SUCCESS };
    } catch (error) {
      this.emit('error', error);
      return { info: null, errorCode: RegistryErrorCode.ERROR_ACCESS_DENIED };
    }
  }
}

// VB6-compatible Registry functions
export class Registry {
  private static api = RegistryAPI.getInstance();

  // Read string value
  public static GetSetting(
    appName: string,
    section: string,
    key: string,
    defaultValue: string = ''
  ): string {
    const keyPath = `${RegistryHive.HKEY_CURRENT_USER}\\Software\\VB and VBA Program Settings\\${appName}\\${section}`;

    const openResult = this.api.RegOpenKeyEx(
      RegistryHive.HKEY_CURRENT_USER,
      `Software\\VB and VBA Program Settings\\${appName}\\${section}`,
      0,
      RegistryAccess.KEY_READ
    );

    if (openResult.errorCode !== RegistryErrorCode.ERROR_SUCCESS) {
      return defaultValue;
    }

    try {
      const result = this.api.RegQueryValueEx(openResult.phkResult, key, 0);
      return result.errorCode === RegistryErrorCode.ERROR_SUCCESS
        ? String(result.lpData)
        : defaultValue;
    } finally {
      this.api.RegCloseKey(openResult.phkResult);
    }
  }

  // Write string value
  public static SaveSetting(appName: string, section: string, key: string, value: string): void {
    const createResult = this.api.RegCreateKeyEx(
      RegistryHive.HKEY_CURRENT_USER,
      `Software\\VB and VBA Program Settings\\${appName}\\${section}`,
      0,
      null,
      RegistryOptions.REG_OPTION_NON_VOLATILE,
      RegistryAccess.KEY_WRITE
    );

    if (createResult.errorCode !== RegistryErrorCode.ERROR_SUCCESS) {
      throw new Error(`Failed to create registry key: ${createResult.errorCode}`);
    }

    try {
      const result = this.api.RegSetValueEx(
        createResult.phkResult,
        key,
        0,
        RegistryValueType.REG_SZ,
        value
      );

      if (result !== RegistryErrorCode.ERROR_SUCCESS) {
        throw new Error(`Failed to set registry value: ${result}`);
      }
    } finally {
      this.api.RegCloseKey(createResult.phkResult);
    }
  }

  // Delete setting
  public static DeleteSetting(appName: string, section?: string, key?: string): void {
    if (!section) {
      // Delete entire app
      this.api.RegDeleteKey(
        RegistryHive.HKEY_CURRENT_USER,
        `Software\\VB and VBA Program Settings\\${appName}`
      );
    } else if (!key) {
      // Delete section
      this.api.RegDeleteKey(
        RegistryHive.HKEY_CURRENT_USER,
        `Software\\VB and VBA Program Settings\\${appName}\\${section}`
      );
    } else {
      // Delete specific key
      const openResult = this.api.RegOpenKeyEx(
        RegistryHive.HKEY_CURRENT_USER,
        `Software\\VB and VBA Program Settings\\${appName}\\${section}`,
        0,
        RegistryAccess.KEY_WRITE
      );

      if (openResult.errorCode === RegistryErrorCode.ERROR_SUCCESS) {
        try {
          this.api.RegDeleteValue(openResult.phkResult, key);
        } finally {
          this.api.RegCloseKey(openResult.phkResult);
        }
      }
    }
  }

  // Get all settings
  public static GetAllSettings(appName: string, section: string): Array<[string, string]> {
    const settings: Array<[string, string]> = [];

    const openResult = this.api.RegOpenKeyEx(
      RegistryHive.HKEY_CURRENT_USER,
      `Software\\VB and VBA Program Settings\\${appName}\\${section}`,
      0,
      RegistryAccess.KEY_READ
    );

    if (openResult.errorCode !== RegistryErrorCode.ERROR_SUCCESS) {
      return settings;
    }

    try {
      let index = 0;
      while (true) {
        const result = this.api.RegEnumValue(openResult.phkResult, index++);
        if (result.errorCode !== RegistryErrorCode.ERROR_SUCCESS) break;

        if (result.lpValueName !== null && result.lpType === RegistryValueType.REG_SZ) {
          settings.push([result.lpValueName, String(result.lpData)]);
        }
      }
    } finally {
      this.api.RegCloseKey(openResult.phkResult);
    }

    return settings;
  }

  // Read registry value (any hive)
  public static ReadValue(
    hive: RegistryHive,
    keyPath: string,
    valueName: string,
    defaultValue: any = null
  ): any {
    const openResult = this.api.RegOpenKeyEx(hive, keyPath, 0, RegistryAccess.KEY_READ);

    if (openResult.errorCode !== RegistryErrorCode.ERROR_SUCCESS) {
      return defaultValue;
    }

    try {
      const result = this.api.RegQueryValueEx(openResult.phkResult, valueName, 0);
      return result.errorCode === RegistryErrorCode.ERROR_SUCCESS ? result.lpData : defaultValue;
    } finally {
      this.api.RegCloseKey(openResult.phkResult);
    }
  }

  // Write registry value (any hive)
  public static WriteValue(
    hive: RegistryHive,
    keyPath: string,
    valueName: string,
    value: any,
    valueType: RegistryValueType = RegistryValueType.REG_SZ
  ): void {
    const createResult = this.api.RegCreateKeyEx(
      hive,
      keyPath,
      0,
      null,
      RegistryOptions.REG_OPTION_NON_VOLATILE,
      RegistryAccess.KEY_WRITE
    );

    if (createResult.errorCode !== RegistryErrorCode.ERROR_SUCCESS) {
      throw new Error(`Failed to create registry key: ${createResult.errorCode}`);
    }

    try {
      const result = this.api.RegSetValueEx(createResult.phkResult, valueName, 0, valueType, value);

      if (result !== RegistryErrorCode.ERROR_SUCCESS) {
        throw new Error(`Failed to set registry value: ${result}`);
      }
    } finally {
      this.api.RegCloseKey(createResult.phkResult);
    }
  }

  // Check if key exists
  public static KeyExists(hive: RegistryHive, keyPath: string): boolean {
    const openResult = this.api.RegOpenKeyEx(hive, keyPath, 0, RegistryAccess.KEY_READ);

    if (openResult.errorCode === RegistryErrorCode.ERROR_SUCCESS) {
      this.api.RegCloseKey(openResult.phkResult);
      return true;
    }

    return false;
  }

  // Enumerate subkeys
  public static EnumKeys(hive: RegistryHive, keyPath: string): string[] {
    const keys: string[] = [];

    const openResult = this.api.RegOpenKeyEx(hive, keyPath, 0, RegistryAccess.KEY_READ);

    if (openResult.errorCode !== RegistryErrorCode.ERROR_SUCCESS) {
      return keys;
    }

    try {
      let index = 0;
      while (true) {
        const result = this.api.RegEnumKeyEx(openResult.phkResult, index++);
        if (result.errorCode !== RegistryErrorCode.ERROR_SUCCESS) break;

        if (result.lpName) {
          keys.push(result.lpName);
        }
      }
    } finally {
      this.api.RegCloseKey(openResult.phkResult);
    }

    return keys;
  }
}

export default RegistryAPI;
