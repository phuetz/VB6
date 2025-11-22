/**
 * VB6 Windows API Simulation
 * Provides simulated implementations of common Windows APIs used in VB6
 */

// Windows API Constants
export const WindowsAPI = {
  // GetWindowsDirectory
  MAX_PATH: 260,
  
  // MessageBox constants
  MB_OK: 0x00000000,
  MB_OKCANCEL: 0x00000001,
  MB_ABORTRETRYIGNORE: 0x00000002,
  MB_YESNOCANCEL: 0x00000003,
  MB_YESNO: 0x00000004,
  MB_RETRYCANCEL: 0x00000005,
  MB_ICONHAND: 0x00000010,
  MB_ICONQUESTION: 0x00000020,
  MB_ICONEXCLAMATION: 0x00000030,
  MB_ICONASTERISK: 0x00000040,
  MB_USERICON: 0x00000080,
  MB_ICONWARNING: 0x00000030,
  MB_ICONERROR: 0x00000010,
  MB_ICONINFORMATION: 0x00000040,
  MB_ICONSTOP: 0x00000010,
  
  // Registry constants
  HKEY_CLASSES_ROOT: 0x80000000,
  HKEY_CURRENT_USER: 0x80000001,
  HKEY_LOCAL_MACHINE: 0x80000002,
  HKEY_USERS: 0x80000003,
  HKEY_PERFORMANCE_DATA: 0x80000004,
  HKEY_CURRENT_CONFIG: 0x80000005,
  
  REG_SZ: 1,
  REG_EXPAND_SZ: 2,
  REG_BINARY: 3,
  REG_DWORD: 4,
  
  KEY_READ: 0x20019,
  KEY_WRITE: 0x20006,
  KEY_ALL_ACCESS: 0xF003F,
  
  // File attributes
  FILE_ATTRIBUTE_NORMAL: 0x80,
  FILE_ATTRIBUTE_DIRECTORY: 0x10,
  FILE_ATTRIBUTE_HIDDEN: 0x02,
  FILE_ATTRIBUTE_READONLY: 0x01,
  FILE_ATTRIBUTE_SYSTEM: 0x04,
  
  // System metrics
  SM_CXSCREEN: 0,
  SM_CYSCREEN: 1,
  SM_CXVSCROLL: 2,
  SM_CYHSCROLL: 3,
  SM_CYCAPTION: 4,
  SM_CXBORDER: 5,
  SM_CYBORDER: 6,
  SM_CXFIXEDFRAME: 7,
  SM_CYFIXEDFRAME: 8,
  SM_CYVTHUMB: 9,
  SM_CXHTHUMB: 10,
  
  // GetPrivateProfileString
  ERROR_SUCCESS: 0,
  ERROR_FILE_NOT_FOUND: 2,
  ERROR_ACCESS_DENIED: 5,
  
  // FindWindow constants
  HWND_DESKTOP: 0,
  HWND_TOP: 0,
  HWND_BOTTOM: 1,
  HWND_TOPMOST: -1,
  HWND_NOTOPMOST: -2,
  
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
  SW_RESTORE: 9,
  SW_SHOWDEFAULT: 10
};

/**
 * Simulated Windows API functions
 */
export class VB6WindowsAPISimulator {
  private registryData: Map<string, Map<string, any>> = new Map();
  private iniData: Map<string, Map<string, Map<string, string>>> = new Map();
  private windowHandles: Map<number, any> = new Map();
  private nextHwnd: number = 100;

  constructor() {
    this.initializeSimulatedData();
  }

  /**
   * Initialize some default registry and system data
   */
  private initializeSimulatedData(): void {
    // Simulate some registry entries
    const hklm = new Map<string, any>();
    hklm.set('SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\ProgramFilesDir', 'C:\\Program Files');
    hklm.set('SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CommonFilesDir', 'C:\\Program Files\\Common Files');
    hklm.set('SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRoot', 'C:\\Windows');
    this.registryData.set('HKEY_LOCAL_MACHINE', hklm);

    const hkcu = new Map<string, any>();
    hkcu.set('SOFTWARE\\VB and VBA Program Settings\\MyApp\\Settings\\WindowLeft', '100');
    hkcu.set('SOFTWARE\\VB and VBA Program Settings\\MyApp\\Settings\\WindowTop', '100');
    this.registryData.set('HKEY_CURRENT_USER', hkcu);

    // Simulate some INI files
    const systemIni = new Map<string, Map<string, string>>();
    const bootSection = new Map<string, string>();
    bootSection.set('shell', 'explorer.exe');
    systemIni.set('boot', bootSection);
    this.iniData.set('C:\\WINDOWS\\SYSTEM.INI', systemIni);
    
    const winIni = new Map<string, Map<string, string>>();
    const windowsSection = new Map<string, string>();
    windowsSection.set('device', 'PRN');
    winIni.set('windows', windowsSection);
    this.iniData.set('C:\\WINDOWS\\WIN.INI', winIni);
  }

  /**
   * GetWindowsDirectory API
   */
  GetWindowsDirectory(lpBuffer: string, uSize: number): number {
    const windowsDir = 'C:\\Windows';
    if (uSize >= windowsDir.length + 1) {
      console.log(`📂 GetWindowsDirectory: ${windowsDir}`);
      return windowsDir.length;
    }
    return 0;
  }

  /**
   * GetSystemDirectory API
   */
  GetSystemDirectory(lpBuffer: string, uSize: number): number {
    const systemDir = 'C:\\Windows\\System32';
    if (uSize >= systemDir.length + 1) {
      console.log(`🔧 GetSystemDirectory: ${systemDir}`);
      return systemDir.length;
    }
    return 0;
  }

  /**
   * GetTempPath API
   */
  GetTempPath(nBufferLength: number, lpBuffer: string): number {
    const tempPath = 'C:\\Windows\\Temp\\';
    if (nBufferLength >= tempPath.length + 1) {
      console.log(`📁 GetTempPath: ${tempPath}`);
      return tempPath.length;
    }
    return tempPath.length + 1; // Required buffer size
  }

  /**
   * GetCurrentDirectory API - Enhanced with persistence
   */
  GetCurrentDirectory(nBufferLength: number, lpBuffer: string): number {
    const storedDir = typeof localStorage !== 'undefined'
      ? localStorage.getItem('vb6_current_dir')
      : null;
    const currentDir = storedDir || 'C:\\';

    if (nBufferLength >= currentDir.length + 1) {
      console.log(`📁 GetCurrentDirectory: ${currentDir}`);
      return currentDir.length;
    }
    return currentDir.length + 1;
  }

  /**
   * SetCurrentDirectory API - Enhanced with persistence
   */
  SetCurrentDirectory(lpPathName: string): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vb6_current_dir', lpPathName);
      }
      console.log(`📁 SetCurrentDirectory: ${lpPathName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * GetComputerName API - Enhanced
   */
  GetComputerName(lpBuffer: string, nSize: number): boolean {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('vb6_computer_name')
      : null;
    const computerName = stored || this.getDefaultComputerName();

    if (nSize >= computerName.length + 1) {
      console.log(`💻 GetComputerName: ${computerName}`);
      return true;
    }
    return false;
  }

  /**
   * SetComputerName - Enhanced simulation
   */
  SetComputerName(lpComputerName: string): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vb6_computer_name', lpComputerName);
      }
      console.log(`💻 SetComputerName: ${lpComputerName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * GetUserName API - Enhanced
   */
  GetUserName(lpBuffer: string, nSize: number): boolean {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('vb6_user_name')
      : null;
    const userName = stored || 'VB6User';

    if (nSize >= userName.length + 1) {
      console.log(`👤 GetUserName: ${userName}`);
      return true;
    }
    return false;
  }

  /**
   * SetUserName - Enhanced simulation
   */
  SetUserName(lpUserName: string): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vb6_user_name', lpUserName);
      }
      console.log(`👤 SetUserName: ${lpUserName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get default computer name
   */
  private getDefaultComputerName(): string {
    if (typeof window !== 'undefined' && window.location) {
      try {
        const hostname = window.location.hostname;
        if (hostname && hostname !== 'localhost' && hostname !== '') {
          return hostname.split('.')[0].toUpperCase();
        }
      } catch {
        // Ignored
      }
    }
    return 'VB6-COMPUTER';
  }

  /**
   * MessageBox API - Enhanced with icon support
   */
  MessageBox(hWnd: number, lpText: string, lpCaption: string, uType: number): number {
    const icon = (uType >> 4) & 0x0F;
    const buttons = uType & 0x0F;

    const fullCaption = lpCaption || 'VB6 Application';
    let iconEmoji = '';

    // Parse icon type
    switch (icon) {
      case 0x0: // MB_ICONASTERISK / MB_ICONINFORMATION
        iconEmoji = 'ℹ️ ';
        break;
      case 0x1: // MB_ICONQUESTION
        iconEmoji = '❓ ';
        break;
      case 0x2: // MB_ICONEXCLAMATION / MB_ICONWARNING
        iconEmoji = '⚠️ ';
        break;
      case 0x3: // MB_ICONHAND / MB_ICONERROR / MB_ICONSTOP
        iconEmoji = '❌ ';
        break;
    }

    const fullMessage = fullCaption + '\n\n' + iconEmoji + lpText;

    switch (buttons) {
      case WindowsAPI.MB_OK:
        alert(fullMessage);
        console.log(`📢 MessageBox OK: ${fullCaption}`);
        return 1; // IDOK

      case WindowsAPI.MB_OKCANCEL: {
        const okCancel = confirm(fullMessage);
        console.log(`📢 MessageBox OKCANCEL: ${fullCaption} - ${okCancel ? 'OK' : 'CANCEL'}`);
        return okCancel ? 1 : 2; // IDOK : IDCANCEL
      }
      case WindowsAPI.MB_YESNO: {
        const yesno = confirm(fullMessage);
        console.log(`📢 MessageBox YESNO: ${fullCaption} - ${yesno ? 'YES' : 'NO'}`);
        return yesno ? 6 : 7; // IDYES : IDNO
      }

      case WindowsAPI.MB_YESNOCANCEL: {
        const result = prompt(`${fullMessage}\n\nEnter: Y=Yes, N=No, C=Cancel`, 'Y');
        if (result === null) return 2; // IDCANCEL
        const response = result.toUpperCase().charAt(0);
        console.log(`📢 MessageBox YNC: ${fullCaption} - ${response}`);
        if (response === 'Y') return 6; // IDYES
        if (response === 'N') return 7; // IDNO
        return 2; // IDCANCEL
      }

      case WindowsAPI.MB_RETRYCANCEL: {
        const result = confirm(fullMessage + '\n\nOK=Retry, Cancel=Cancel');
        console.log(`📢 MessageBox RETRYCANCEL: ${fullCaption} - ${result ? 'RETRY' : 'CANCEL'}`);
        return result ? 4 : 2; // IDRETRY : IDCANCEL
      }

      case WindowsAPI.MB_ABORTRETRYIGNORE: {
        const result = prompt(`${fullMessage}\n\nEnter: A=Abort, R=Retry, I=Ignore`, 'R');
        if (result === null) return 3; // IDABORT
        const response = result.toUpperCase().charAt(0);
        console.log(`📢 MessageBox ARI: ${fullCaption} - ${response}`);
        if (response === 'A') return 3; // IDABORT
        if (response === 'R') return 4; // IDRETRY
        return 5; // IDIGNORE
      }

      default:
        alert(fullMessage);
        console.log(`📢 MessageBox (default): ${fullCaption}`);
        return 1; // IDOK
    }
  }

  /**
   * GetSystemMetrics API
   */
  GetSystemMetrics(nIndex: number): number {
    switch (nIndex) {
      case WindowsAPI.SM_CXSCREEN:
        return window.screen.width;
      case WindowsAPI.SM_CYSCREEN:
        return window.screen.height;
      case WindowsAPI.SM_CXVSCROLL:
        return 17;
      case WindowsAPI.SM_CYHSCROLL:
        return 17;
      case WindowsAPI.SM_CYCAPTION:
        return 19;
      case WindowsAPI.SM_CXBORDER:
      case WindowsAPI.SM_CYBORDER:
        return 1;
      case WindowsAPI.SM_CXFIXEDFRAME:
      case WindowsAPI.SM_CYFIXEDFRAME:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * RegOpenKeyEx API
   */
  RegOpenKeyEx(hKey: number, lpSubKey: string, ulOptions: number, samDesired: number, phkResult: any): number {
    const keyName = this.getRegistryKeyName(hKey);
    const fullPath = `${keyName}\\${lpSubKey}`;
    
    console.log(`RegOpenKeyEx: ${fullPath}`);
    
    // Simulate success
    return WindowsAPI.ERROR_SUCCESS;
  }

  /**
   * RegQueryValueEx API
   */
  RegQueryValueEx(hKey: number, lpValueName: string, lpReserved: any, lpType: any, 
                  lpData: string, lpcbData: number): number {
    // Simulate registry lookup
    const registryKey = this.registryData.get('HKEY_LOCAL_MACHINE') || 
                       this.registryData.get('HKEY_CURRENT_USER');
    
    if (registryKey && registryKey.has(lpValueName)) {
      const value = registryKey.get(lpValueName);
      console.log(`RegQueryValueEx: ${lpValueName} = ${value}`);
      return WindowsAPI.ERROR_SUCCESS;
    }
    
    return WindowsAPI.ERROR_FILE_NOT_FOUND;
  }

  /**
   * RegSetValueEx API
   */
  RegSetValueEx(hKey: number, lpValueName: string, reserved: number, dwType: number, 
                lpData: any, cbData: number): number {
    console.log(`RegSetValueEx: ${lpValueName} = ${lpData} (type: ${dwType})`);
    
    // Store in simulated registry
    const keyName = this.getRegistryKeyName(hKey);
    let registryKey = this.registryData.get(keyName);
    if (!registryKey) {
      registryKey = new Map<string, any>();
      this.registryData.set(keyName, registryKey);
    }
    
    registryKey.set(lpValueName, lpData);
    return WindowsAPI.ERROR_SUCCESS;
  }

  /**
   * RegCloseKey API
   */
  RegCloseKey(hKey: number): number {
    return WindowsAPI.ERROR_SUCCESS;
  }

  /**
   * GetPrivateProfileString API
   */
  GetPrivateProfileString(lpAppName: string, lpKeyName: string, lpDefault: string, 
                         lpReturnedString: string, nSize: number, lpFileName: string): number {
    const fileName = lpFileName.toUpperCase();
    const iniFile = this.iniData.get(fileName);
    
    if (iniFile && iniFile.has(lpAppName) && iniFile.get(lpAppName)!.has(lpKeyName)) {
      const value = iniFile.get(lpAppName)!.get(lpKeyName)!;
      console.log(`GetPrivateProfileString: [${lpAppName}] ${lpKeyName} = ${value}`);
      return Math.min(value.length, nSize - 1);
    }
    
    console.log(`GetPrivateProfileString: [${lpAppName}] ${lpKeyName} = ${lpDefault} (default)`);
    return Math.min(lpDefault.length, nSize - 1);
  }

  /**
   * WritePrivateProfileString API
   */
  WritePrivateProfileString(lpAppName: string, lpKeyName: string, lpString: string, 
                           lpFileName: string): boolean {
    const fileName = lpFileName.toUpperCase();
    let iniFile = this.iniData.get(fileName);
    
    if (!iniFile) {
      iniFile = new Map<string, Map<string, string>>();
      this.iniData.set(fileName, iniFile);
    }
    
    let section = iniFile.get(lpAppName);
    if (!section) {
      section = new Map<string, string>();
      iniFile.set(lpAppName, section);
    }
    
    section.set(lpKeyName, lpString);
    console.log(`WritePrivateProfileString: [${lpAppName}] ${lpKeyName} = ${lpString}`);
    
    return true;
  }

  /**
   * FindWindow API
   */
  FindWindow(lpClassName: string | null, lpWindowName: string | null): number {
    // Simulate finding a window
    console.log(`FindWindow: className=${lpClassName}, windowName=${lpWindowName}`);
    
    if (lpWindowName === 'Calculator' || lpWindowName === 'Notepad') {
      return this.nextHwnd++;
    }
    
    return 0; // Window not found
  }

  /**
   * GetWindowText API
   */
  GetWindowText(hWnd: number, lpString: string, nMaxCount: number): number {
    console.log(`GetWindowText: hWnd=${hWnd}`);
    
    // Simulate window title
    const title = 'Simulated Window';
    return Math.min(title.length, nMaxCount - 1);
  }

  /**
   * SetWindowText API
   */
  SetWindowText(hWnd: number, lpString: string): boolean {
    console.log(`SetWindowText: hWnd=${hWnd}, text=${lpString}`);
    return true;
  }

  /**
   * ShowWindow API
   */
  ShowWindow(hWnd: number, nCmdShow: number): boolean {
    console.log(`ShowWindow: hWnd=${hWnd}, nCmdShow=${nCmdShow}`);
    return true;
  }

  /**
   * GetTickCount API - Returns milliseconds since system start
   */
  GetTickCount(): number {
    // Use performance.now() for better accuracy, fallback to Date.now()
    let tickCount: number;
    if (typeof performance !== 'undefined' && performance.now) {
      tickCount = Math.floor(performance.now());
    } else {
      tickCount = Date.now();
    }

    console.log(`⏱️ GetTickCount: ${tickCount}ms`);
    return tickCount & 0xFFFFFFFF; // 32-bit value like Windows
  }

  /**
   * Sleep API - Async sleep function
   */
  async Sleep(dwMilliseconds: number): Promise<void> {
    console.log(`😴 Sleep: ${dwMilliseconds}ms`);
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`😴 Sleep completed: ${dwMilliseconds}ms`);
        resolve();
      }, dwMilliseconds);
    });
  }

  /**
   * Sleep API - Synchronous version (blocks execution)
   */
  SleepSync(dwMilliseconds: number): void {
    console.log(`😴 SleepSync: ${dwMilliseconds}ms`);
    const start = Date.now();
    while (Date.now() - start < dwMilliseconds) {
      // Busy wait
    }
    console.log(`😴 SleepSync completed: ${dwMilliseconds}ms`);
  }

  /**
   * ShellExecute API
   */
  ShellExecute(hWnd: number, lpOperation: string, lpFile: string, lpParameters: string,
               lpDirectory: string, nShowCmd: number): number {
    console.log(`ShellExecute: ${lpOperation} ${lpFile} ${lpParameters}`);
    
    // Simulate opening files/URLs
    if (lpFile.startsWith('http://') || lpFile.startsWith('https://')) {
      window.open(lpFile, '_blank');
      return 42; // Success (> 32)
    }
    
    // Simulate opening files
    if (lpFile.endsWith('.txt') || lpFile.endsWith('.html')) {
      console.log(`Opening file: ${lpFile}`);
      return 42; // Success
    }
    
    return 2; // File not found
  }

  /**
   * GetVersionEx API (simplified)
   */
  GetVersionEx(lpVersionInfo: any): boolean {
    console.log('GetVersionEx called');
    // Simulate Windows version info
    return true;
  }

  /**
   * Helper method to get registry key name
   */
  private getRegistryKeyName(hKey: number): string {
    switch (hKey) {
      case WindowsAPI.HKEY_CLASSES_ROOT:
        return 'HKEY_CLASSES_ROOT';
      case WindowsAPI.HKEY_CURRENT_USER:
        return 'HKEY_CURRENT_USER';
      case WindowsAPI.HKEY_LOCAL_MACHINE:
        return 'HKEY_LOCAL_MACHINE';
      case WindowsAPI.HKEY_USERS:
        return 'HKEY_USERS';
      default:
        return 'HKEY_UNKNOWN';
    }
  }

  /**
   * VB6 SaveSetting function
   */
  SaveSetting(appname: string, section: string, key: string, setting: string): void {
    const regPath = `SOFTWARE\\VB and VBA Program Settings\\${appname}\\${section}\\${key}`;
    console.log(`SaveSetting: ${regPath} = ${setting}`);
    
    let hkcu = this.registryData.get('HKEY_CURRENT_USER');
    if (!hkcu) {
      hkcu = new Map<string, any>();
      this.registryData.set('HKEY_CURRENT_USER', hkcu);
    }
    
    hkcu.set(regPath, setting);
  }

  /**
   * VB6 GetSetting function
   */
  GetSetting(appname: string, section: string, key: string, defaultValue?: string): string {
    const regPath = `SOFTWARE\\VB and VBA Program Settings\\${appname}\\${section}\\${key}`;
    console.log(`GetSetting: ${regPath}`);
    
    const hkcu = this.registryData.get('HKEY_CURRENT_USER');
    if (hkcu && hkcu.has(regPath)) {
      return hkcu.get(regPath);
    }
    
    return defaultValue || '';
  }

  /**
   * VB6 DeleteSetting function
   */
  DeleteSetting(appname: string, section?: string, key?: string): void {
    if (key) {
      const regPath = `SOFTWARE\\VB and VBA Program Settings\\${appname}\\${section}\\${key}`;
      console.log(`DeleteSetting: ${regPath}`);
      
      const hkcu = this.registryData.get('HKEY_CURRENT_USER');
      if (hkcu) {
        hkcu.delete(regPath);
      }
    } else {
      // Delete entire section or app
      console.log(`DeleteSetting: ${appname}${section ? '\\' + section : ''}`);
    }
  }

  /**
   * VB6 GetAllSettings function
   */
  GetAllSettings(appname: string, section: string): any[] {
    console.log(`GetAllSettings: ${appname}\\${section}`);
    
    const hkcu = this.registryData.get('HKEY_CURRENT_USER');
    const settings: any[] = [];
    
    if (hkcu) {
      const prefix = `SOFTWARE\\VB and VBA Program Settings\\${appname}\\${section}\\`;
      
      for (const [key, value] of hkcu.entries()) {
        if (key.startsWith(prefix)) {
          const settingKey = key.substring(prefix.length);
          settings.push([settingKey, value]);
        }
      }
    }
    
    return settings;
  }
}

// Create singleton instance
export const vb6WindowsAPI = new VB6WindowsAPISimulator();

// Export individual API functions for easier VB6 compatibility
export function GetWindowsDirectory(lpBuffer: string, uSize: number): number {
  return vb6WindowsAPI.GetWindowsDirectory(lpBuffer, uSize);
}

export function MessageBox(hWnd: number, lpText: string, lpCaption: string, uType: number): number {
  return vb6WindowsAPI.MessageBox(hWnd, lpText, lpCaption, uType);
}

export function GetSystemMetrics(nIndex: number): number {
  return vb6WindowsAPI.GetSystemMetrics(nIndex);
}

export function GetTickCount(): number {
  return vb6WindowsAPI.GetTickCount();
}

export function SaveSetting(appname: string, section: string, key: string, setting: string): void {
  return vb6WindowsAPI.SaveSetting(appname, section, key, setting);
}

export function GetSetting(appname: string, section: string, key: string, defaultValue?: string): string {
  return vb6WindowsAPI.GetSetting(appname, section, key, defaultValue);
}

export function DeleteSetting(appname: string, section?: string, key?: string): void {
  return vb6WindowsAPI.DeleteSetting(appname, section, key);
}

export function GetAllSettings(appname: string, section: string): any[] {
  return vb6WindowsAPI.GetAllSettings(appname, section);
}

export default vb6WindowsAPI;