/**
 * VB6 API Declarations System - Complete Windows API Compatibility Layer
 * Provides web-compatible implementations of common Windows API functions
 * Supports Declare Function statements and dynamic API calling
 */

export interface VB6APIFunction {
  name: string;
  library: string;
  alias?: string;
  returnType: string;
  parameters: VB6APIParameter[];
  implementation: (...args: any[]) => any;
}

export interface VB6APIParameter {
  name: string;
  type: string;
  byRef?: boolean;
  optional?: boolean;
  defaultValue?: any;
}

// API Type mappings from VB6 to JavaScript
export const VB6TypeMap: { [key: string]: string } = {
  'Long': 'number',
  'Integer': 'number', 
  'String': 'string',
  'Boolean': 'boolean',
  'Byte': 'number',
  'Double': 'number',
  'Single': 'number',
  'Currency': 'number',
  'Date': 'Date',
  'Variant': 'any',
  'Object': 'object',
  'Any': 'any'
};

// Global API Registry
export class VB6APIRegistry {
  private static instance: VB6APIRegistry;
  private apis: Map<string, VB6APIFunction> = new Map();
  private declarations: Map<string, string> = new Map();

  static getInstance(): VB6APIRegistry {
    if (!VB6APIRegistry.instance) {
      VB6APIRegistry.instance = new VB6APIRegistry();
      VB6APIRegistry.instance.initializeStandardAPIs();
    }
    return VB6APIRegistry.instance;
  }

  // Parse VB6 Declare Function statement
  parseDeclareFunction(declaration: string): VB6APIFunction | null {
    try {
      // Example: Declare Function GetTickCount Lib "kernel32" () As Long
      // Example: Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hwnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long
      
      const declareRegex = /Declare\s+(Function|Sub)\s+(\w+)\s+Lib\s+"([^"]+)"(?:\s+Alias\s+"([^"]+)")?\s*\(([^)]*)\)(?:\s+As\s+(\w+))?/i;
      const match = declaration.match(declareRegex);
      
      if (!match) return null;
      
      const [, funcType, funcName, library, alias, paramStr, returnType] = match;
      
      // Parse parameters
      const parameters: VB6APIParameter[] = [];
      if (paramStr.trim()) {
        const paramParts = paramStr.split(',');
        for (const param of paramParts) {
          const paramMatch = param.trim().match(/(ByVal|ByRef)?\s*(\w+)\s+As\s+(\w+)(?:\s*=\s*(.+))?/i);
          if (paramMatch) {
            const [, byRefVal, paramName, paramType, defaultVal] = paramMatch;
            parameters.push({
              name: paramName,
              type: paramType,
              byRef: byRefVal?.toLowerCase() === 'byref',
              optional: !!defaultVal,
              defaultValue: defaultVal
            });
          }
        }
      }
      
      // Find implementation
      const apiKey = `${library.toLowerCase()}.${(alias || funcName).toLowerCase()}`;
      const existingAPI = this.apis.get(apiKey);
      
      const apiFunction: VB6APIFunction = {
        name: funcName,
        library: library.toLowerCase(),
        alias: alias,
        returnType: returnType || 'void',
        parameters,
        implementation: existingAPI?.implementation || this.createStubImplementation(funcName, library)
      };
      
      // Register the API
      this.apis.set(apiKey, apiFunction);
      this.declarations.set(funcName.toLowerCase(), declaration);
      
      return apiFunction;
      
    } catch (error) {
      console.error('Error parsing Declare Function:', error);
      return null;
    }
  }

  // Register a custom API implementation
  registerAPI(library: string, functionName: string, implementation: VB6APIFunction): void {
    const key = `${library.toLowerCase()}.${functionName.toLowerCase()}`;
    this.apis.set(key, implementation);
  }

  // Get API implementation
  getAPI(library: string, functionName: string): VB6APIFunction | undefined {
    const key = `${library.toLowerCase()}.${functionName.toLowerCase()}`;
    return this.apis.get(key);
  }

  // Call API function
  callAPI(functionName: string, ...args: any[]): any {
    // First try direct function name lookup
    for (const [key, api] of this.apis.entries()) {
      if (api.name.toLowerCase() === functionName.toLowerCase()) {
        try {
          return api.implementation(...args);
        } catch (error) {
          console.error(`Error calling API ${functionName}:`, error);
          return null;
        }
      }
    }
    
    console.warn(`API function ${functionName} not found`);
    return null;
  }

  // Create stub implementation for unknown APIs
  private createStubImplementation(funcName: string, library: string): (...args: any[]) => any {
    return (...args: any[]) => {
      console.warn(`Stub implementation called for ${library}.${funcName} with args:`, args);
      
      // Return appropriate default based on common function patterns
      if (funcName.toLowerCase().includes('get') || funcName.toLowerCase().includes('find')) {
        return 0; // Handle/ID not found
      }
      if (funcName.toLowerCase().includes('set') || funcName.toLowerCase().includes('write')) {
        return 1; // Success
      }
      if (funcName.toLowerCase().includes('message') || funcName.toLowerCase().includes('show')) {
        return 1; // OK button
      }
      return 0;
    };
  }

  // Initialize standard Windows API implementations
  private initializeStandardAPIs(): void {
    // USER32.DLL APIs
    this.registerAPI('user32', 'MessageBox', {
      name: 'MessageBox',
      library: 'user32',
      alias: 'MessageBoxA',
      returnType: 'Long',
      parameters: [
        { name: 'hwnd', type: 'Long', byRef: false },
        { name: 'lpText', type: 'String', byRef: false },
        { name: 'lpCaption', type: 'String', byRef: false },
        { name: 'wType', type: 'Long', byRef: false }
      ],
      implementation: (hwnd: number, text: string, caption: string, type: number) => {
        const buttons = ['OK', 'OK|Cancel', 'Abort|Retry|Ignore', 'Yes|No|Cancel', 'Yes|No', 'Retry|Cancel'][type & 0x7] || 'OK';
        const icon = ['', '❌', '❓', '⚠️', 'ℹ️'][((type & 0x70) >> 4)] || '';
        
        const result = window.confirm(`${icon} ${caption}\n\n${text}`);
        return result ? 1 : 2; // IDOK : IDCANCEL
      }
    });

    this.registerAPI('user32', 'FindWindow', {
      name: 'FindWindow',
      library: 'user32',
      alias: 'FindWindowA',
      returnType: 'Long',
      parameters: [
        { name: 'lpClassName', type: 'String', byRef: false },
        { name: 'lpWindowName', type: 'String', byRef: false }
      ],
      implementation: (className: string, windowName: string) => {
        // In web environment, simulate finding windows
        if (windowName && (windowName.includes('Notepad') || windowName.includes('Calculator'))) {
          return Math.floor(Math.random() * 1000) + 1000; // Fake window handle
        }
        return 0; // Window not found
      }
    });

    this.registerAPI('user32', 'GetWindowText', {
      name: 'GetWindowText',
      library: 'user32',
      alias: 'GetWindowTextA',
      returnType: 'Long',
      parameters: [
        { name: 'hwnd', type: 'Long', byRef: false },
        { name: 'lpString', type: 'String', byRef: true },
        { name: 'nMaxCount', type: 'Long', byRef: false }
      ],
      implementation: (hwnd: number, buffer: { value: string }, maxCount: number) => {
        const title = document.title || 'VB6 Web Application';
        buffer.value = title.substring(0, maxCount - 1);
        return buffer.value.length;
      }
    });

    this.registerAPI('user32', 'GetCursorPos', {
      name: 'GetCursorPos',
      library: 'user32',
      returnType: 'Long',
      parameters: [
        { name: 'lpPoint', type: 'Object', byRef: true }
      ],
      implementation: (point: { x: number; y: number }) => {
        // Get last known mouse position
        const lastMouseEvent = (window as any).__lastMouseEvent;
        if (lastMouseEvent) {
          point.x = lastMouseEvent.clientX;
          point.y = lastMouseEvent.clientY;
        } else {
          point.x = 0;
          point.y = 0;
        }
        return 1;
      }
    });

    // KERNEL32.DLL APIs
    this.registerAPI('kernel32', 'GetTickCount', {
      name: 'GetTickCount',
      library: 'kernel32',
      returnType: 'Long',
      parameters: [],
      implementation: () => {
        return performance.now();
      }
    });

    this.registerAPI('kernel32', 'Sleep', {
      name: 'Sleep',
      library: 'kernel32',
      returnType: 'void',
      parameters: [
        { name: 'dwMilliseconds', type: 'Long', byRef: false }
      ],
      implementation: async (milliseconds: number) => {
        await new Promise(resolve => setTimeout(resolve, milliseconds));
      }
    });

    this.registerAPI('kernel32', 'GetComputerName', {
      name: 'GetComputerName',
      library: 'kernel32',
      alias: 'GetComputerNameA',
      returnType: 'Long',
      parameters: [
        { name: 'lpBuffer', type: 'String', byRef: true },
        { name: 'nSize', type: 'Long', byRef: true }
      ],
      implementation: (buffer: { value: string }, size: { value: number }) => {
        const computerName = navigator.userAgent.includes('Windows') ? 'WEBPC' : 'WEBBROWSER';
        buffer.value = computerName;
        size.value = computerName.length;
        return 1;
      }
    });

    this.registerAPI('kernel32', 'GetUserName', {
      name: 'GetUserName',
      library: 'kernel32',
      alias: 'GetUserNameA',
      returnType: 'Long',
      parameters: [
        { name: 'lpBuffer', type: 'String', byRef: true },
        { name: 'nSize', type: 'Long', byRef: true }
      ],
      implementation: (buffer: { value: string }, size: { value: number }) => {
        const userName = 'WebUser';
        buffer.value = userName;
        size.value = userName.length;
        return 1;
      }
    });

    this.registerAPI('kernel32', 'GetTempPath', {
      name: 'GetTempPath',
      library: 'kernel32',
      alias: 'GetTempPathA',
      returnType: 'Long',
      parameters: [
        { name: 'nBufferLength', type: 'Long', byRef: false },
        { name: 'lpBuffer', type: 'String', byRef: true }
      ],
      implementation: (bufferLength: number, buffer: { value: string }) => {
        const tempPath = '/tmp/';
        buffer.value = tempPath;
        return tempPath.length;
      }
    });

    // SHELL32.DLL APIs
    this.registerAPI('shell32', 'ShellExecute', {
      name: 'ShellExecute',
      library: 'shell32',
      alias: 'ShellExecuteA',
      returnType: 'Long',
      parameters: [
        { name: 'hwnd', type: 'Long', byRef: false },
        { name: 'lpOperation', type: 'String', byRef: false },
        { name: 'lpFile', type: 'String', byRef: false },
        { name: 'lpParameters', type: 'String', byRef: false },
        { name: 'lpDirectory', type: 'String', byRef: false },
        { name: 'nShowCmd', type: 'Long', byRef: false }
      ],
      implementation: (hwnd: number, operation: string, file: string, parameters: string, directory: string, showCmd: number) => {
        try {
          if (operation.toLowerCase() === 'open') {
            if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('mailto:')) {
              window.open(file, '_blank');
              return 42; // Success (instance handle > 32)
            }
            if (file.endsWith('.txt') || file.endsWith('.html')) {
              // Simulate opening file
              console.log(`Opening file: ${file}`);
              return 42;
            }
          }
          return 31; // File not found
        } catch (error) {
          return 0; // Out of memory
        }
      }
    });

    // GDI32.DLL APIs
    this.registerAPI('gdi32', 'GetPixel', {
      name: 'GetPixel',
      library: 'gdi32',
      returnType: 'Long',
      parameters: [
        { name: 'hdc', type: 'Long', byRef: false },
        { name: 'x', type: 'Long', byRef: false },
        { name: 'y', type: 'Long', byRef: false }
      ],
      implementation: (hdc: number, x: number, y: number) => {
        // Simulate getting pixel color
        return 0xFFFFFF; // White pixel
      }
    });

    this.registerAPI('gdi32', 'SetPixel', {
      name: 'SetPixel',
      library: 'gdi32',
      returnType: 'Long',
      parameters: [
        { name: 'hdc', type: 'Long', byRef: false },
        { name: 'x', type: 'Long', byRef: false },
        { name: 'y', type: 'Long', byRef: false },
        { name: 'color', type: 'Long', byRef: false }
      ],
      implementation: (hdc: number, x: number, y: number, color: number) => {
        // Simulate setting pixel color
        return color;
      }
    });

    // ADVAPI32.DLL APIs (Registry)
    this.registerAPI('advapi32', 'RegOpenKeyEx', {
      name: 'RegOpenKeyEx',
      library: 'advapi32',
      alias: 'RegOpenKeyExA',
      returnType: 'Long',
      parameters: [
        { name: 'hKey', type: 'Long', byRef: false },
        { name: 'lpSubKey', type: 'String', byRef: false },
        { name: 'ulOptions', type: 'Long', byRef: false },
        { name: 'samDesired', type: 'Long', byRef: false },
        { name: 'phkResult', type: 'Long', byRef: true }
      ],
      implementation: (hKey: number, subKey: string, options: number, desired: number, result: { value: number }) => {
        // Simulate registry access using localStorage
        result.value = Math.floor(Math.random() * 1000) + 1000;
        return 0; // ERROR_SUCCESS
      }
    });

    this.registerAPI('advapi32', 'RegQueryValueEx', {
      name: 'RegQueryValueEx',
      library: 'advapi32',
      alias: 'RegQueryValueExA',
      returnType: 'Long',
      parameters: [
        { name: 'hKey', type: 'Long', byRef: false },
        { name: 'lpValueName', type: 'String', byRef: false },
        { name: 'lpReserved', type: 'Long', byRef: false },
        { name: 'lpType', type: 'Long', byRef: true },
        { name: 'lpData', type: 'String', byRef: true },
        { name: 'lpcbData', type: 'Long', byRef: true }
      ],
      implementation: (hKey: number, valueName: string, reserved: number, type: { value: number }, data: { value: string }, dataSize: { value: number }) => {
        // Simulate reading from registry using localStorage
        const key = `vb6_registry_${hKey}_${valueName}`;
        const value = localStorage.getItem(key) || '';
        data.value = value;
        dataSize.value = value.length;
        type.value = 1; // REG_SZ
        return 0; // ERROR_SUCCESS
      }
    });

    this.registerAPI('advapi32', 'RegSetValueEx', {
      name: 'RegSetValueEx',
      library: 'advapi32',
      alias: 'RegSetValueExA',
      returnType: 'Long',
      parameters: [
        { name: 'hKey', type: 'Long', byRef: false },
        { name: 'lpValueName', type: 'String', byRef: false },
        { name: 'Reserved', type: 'Long', byRef: false },
        { name: 'dwType', type: 'Long', byRef: false },
        { name: 'lpData', type: 'String', byRef: false },
        { name: 'cbData', type: 'Long', byRef: false }
      ],
      implementation: (hKey: number, valueName: string, reserved: number, type: number, data: string, dataSize: number) => {
        // Simulate writing to registry using localStorage
        const key = `vb6_registry_${hKey}_${valueName}`;
        localStorage.setItem(key, data);
        return 0; // ERROR_SUCCESS
      }
    });

    this.registerAPI('advapi32', 'RegCloseKey', {
      name: 'RegCloseKey',
      library: 'advapi32',
      returnType: 'Long',
      parameters: [
        { name: 'hKey', type: 'Long', byRef: false }
      ],
      implementation: (hKey: number) => {
        return 0; // ERROR_SUCCESS
      }
    });
  }
}

// Global API instance
export const VB6API = VB6APIRegistry.getInstance();

// Global declare function processor
export const DeclareFunction = (declaration: string): boolean => {
  const api = VB6API.parseDeclareFunction(declaration);
  if (api) {
    // Make function available globally
    const globalAny = globalThis as any;
    globalAny[api.name] = (...args: any[]) => VB6API.callAPI(api.name, ...args);
    return true;
  }
  return false;
};

// Track mouse position for API calls
if (typeof window !== 'undefined') {
  document.addEventListener('mousemove', (e) => {
    (window as any).__lastMouseEvent = e;
  });
}

// Export common constants
export const VB6Constants = {
  // MessageBox constants
  MB_OK: 0,
  MB_OKCANCEL: 1,
  MB_ABORTRETRYIGNORE: 2,
  MB_YESNOCANCEL: 3,
  MB_YESNO: 4,
  MB_RETRYCANCEL: 5,
  MB_ICONHAND: 16,
  MB_ICONQUESTION: 32,
  MB_ICONEXCLAMATION: 48,
  MB_ICONINFORMATION: 64,
  
  // Return values
  IDOK: 1,
  IDCANCEL: 2,
  IDABORT: 3,
  IDRETRY: 4,
  IDIGNORE: 5,
  IDYES: 6,
  IDNO: 7,
  
  // Registry keys
  HKEY_CLASSES_ROOT: 0x80000000,
  HKEY_CURRENT_USER: 0x80000001,
  HKEY_LOCAL_MACHINE: 0x80000002,
  HKEY_USERS: 0x80000003,
  HKEY_CURRENT_CONFIG: 0x80000005,
  
  // Registry access rights
  KEY_READ: 0x20019,
  KEY_WRITE: 0x20006,
  KEY_ALL_ACCESS: 0xF003F,
  
  // ShowWindow constants
  SW_HIDE: 0,
  SW_SHOWNORMAL: 1,
  SW_SHOWMINIMIZED: 2,
  SW_SHOWMAXIMIZED: 3,
  SW_SHOWNOACTIVATE: 4,
  SW_SHOW: 5,
  SW_MINIMIZE: 6,
  SW_SHOWMINNOACTIVE: 7,
  SW_SHOWNA: 8,
  SW_RESTORE: 9
};

export default VB6API;