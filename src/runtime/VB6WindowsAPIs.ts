/**
 * VB6 Critical Windows APIs Implementation
 * Provides web-compatible alternatives for essential Windows API functions
 */

// Windows Constants
export const WIN32_CONSTANTS = {
  // GetWindowsDirectory constants
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

  // MessageBox return values
  IDOK: 1,
  IDCANCEL: 2,
  IDABORT: 3,
  IDRETRY: 4,
  IDIGNORE: 5,
  IDYES: 6,
  IDNO: 7,

  // GetSystemMetrics constants
  SM_CXSCREEN: 0,
  SM_CYSCREEN: 1,
  SM_CXFULLSCREEN: 16,
  SM_CYFULLSCREEN: 17,
  SM_CXMAXIMIZED: 61,
  SM_CYMAXIMIZED: 62,

  // Registry keys
  HKEY_CLASSES_ROOT: 0x80000000,
  HKEY_CURRENT_USER: 0x80000001,
  HKEY_LOCAL_MACHINE: 0x80000002,
  HKEY_USERS: 0x80000003,
  HKEY_CURRENT_CONFIG: 0x80000005,

  // File attributes
  FILE_ATTRIBUTE_READONLY: 0x00000001,
  FILE_ATTRIBUTE_HIDDEN: 0x00000002,
  FILE_ATTRIBUTE_SYSTEM: 0x00000004,
  FILE_ATTRIBUTE_DIRECTORY: 0x00000010,
  FILE_ATTRIBUTE_ARCHIVE: 0x00000020,
  FILE_ATTRIBUTE_NORMAL: 0x00000080,

  // Special folder IDs
  CSIDL_DESKTOP: 0x0000,
  CSIDL_PROGRAMS: 0x0002,
  CSIDL_PERSONAL: 0x0005,
  CSIDL_FAVORITES: 0x0006,
  CSIDL_STARTUP: 0x0007,
  CSIDL_RECENT: 0x0008,
  CSIDL_SENDTO: 0x0009,
  CSIDL_STARTMENU: 0x000b,
  CSIDL_DESKTOPDIRECTORY: 0x0010,
  CSIDL_DRIVES: 0x0011,
  CSIDL_NETWORK: 0x0012,
  CSIDL_NETHOOD: 0x0013,
  CSIDL_FONTS: 0x0014,
  CSIDL_TEMPLATES: 0x0015,
  CSIDL_COMMON_STARTMENU: 0x0016,
  CSIDL_COMMON_PROGRAMS: 0x0017,
  CSIDL_COMMON_STARTUP: 0x0018,
  CSIDL_COMMON_DESKTOPDIRECTORY: 0x0019,
  CSIDL_APPDATA: 0x001a,
  CSIDL_PRINTHOOD: 0x001b,
  CSIDL_LOCAL_APPDATA: 0x001c,
  CSIDL_COMMON_FAVORITES: 0x001f,
  CSIDL_INTERNET_CACHE: 0x0020,
  CSIDL_COOKIES: 0x0021,
  CSIDL_HISTORY: 0x0022,
  CSIDL_COMMON_APPDATA: 0x0023,
  CSIDL_WINDOWS: 0x0024,
  CSIDL_SYSTEM: 0x0025,
  CSIDL_PROGRAM_FILES: 0x0026,
  CSIDL_MYPICTURES: 0x0027,
  CSIDL_PROFILE: 0x0028,
  CSIDL_PROGRAM_FILES_COMMON: 0x002b,
  CSIDL_COMMON_TEMPLATES: 0x002d,
  CSIDL_COMMON_DOCUMENTS: 0x002e,
};

// Virtual Windows File System
class VirtualWindowsFS {
  private paths: Map<string, string> = new Map();

  constructor() {
    // Initialize common Windows paths
    this.paths.set('WINDOWS', '/virtual/Windows');
    this.paths.set('SYSTEM', '/virtual/Windows/System32');
    this.paths.set('SYSTEM32', '/virtual/Windows/System32');
    this.paths.set('TEMP', '/virtual/temp');
    this.paths.set('PROGRAM_FILES', '/virtual/Program Files');
    this.paths.set('PROGRAM_FILES_COMMON', '/virtual/Program Files/Common Files');
    this.paths.set('APPDATA', '/virtual/Users/user/AppData/Roaming');
    this.paths.set('LOCAL_APPDATA', '/virtual/Users/user/AppData/Local');
    this.paths.set('COMMON_APPDATA', '/virtual/ProgramData');
    this.paths.set('DESKTOP', '/virtual/Users/user/Desktop');
    this.paths.set('PERSONAL', '/virtual/Users/user/Documents');
    this.paths.set('FAVORITES', '/virtual/Users/user/Favorites');
    this.paths.set(
      'STARTUP',
      '/virtual/Users/user/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup'
    );
    this.paths.set('STARTMENU', '/virtual/Users/user/AppData/Roaming/Microsoft/Windows/Start Menu');
    this.paths.set(
      'PROGRAMS',
      '/virtual/Users/user/AppData/Roaming/Microsoft/Windows/Start Menu/Programs'
    );
    this.paths.set('FONTS', '/virtual/Windows/Fonts');
  }

  getPath(key: string): string {
    return this.paths.get(key) || '/virtual';
  }

  setPath(key: string, path: string): void {
    this.paths.set(key, path);
  }
}

const virtualFS = new VirtualWindowsFS();

// Windows API Functions

/**
 * Gets the Windows directory path
 */
export function GetWindowsDirectory(): string {
  return virtualFS.getPath('WINDOWS');
}

/**
 * Gets the System directory path
 */
export function GetSystemDirectory(): string {
  return virtualFS.getPath('SYSTEM32');
}

/**
 * Gets the temporary directory path
 */
export function GetTempPath(): string {
  return virtualFS.getPath('TEMP');
}

/**
 * Gets a special folder path
 */
export function SHGetSpecialFolderPath(csidl: number): string {
  const folderMap: { [key: number]: string } = {
    [WIN32_CONSTANTS.CSIDL_DESKTOP]: 'DESKTOP',
    [WIN32_CONSTANTS.CSIDL_PROGRAMS]: 'PROGRAMS',
    [WIN32_CONSTANTS.CSIDL_PERSONAL]: 'PERSONAL',
    [WIN32_CONSTANTS.CSIDL_FAVORITES]: 'FAVORITES',
    [WIN32_CONSTANTS.CSIDL_STARTUP]: 'STARTUP',
    [WIN32_CONSTANTS.CSIDL_STARTMENU]: 'STARTMENU',
    [WIN32_CONSTANTS.CSIDL_APPDATA]: 'APPDATA',
    [WIN32_CONSTANTS.CSIDL_LOCAL_APPDATA]: 'LOCAL_APPDATA',
    [WIN32_CONSTANTS.CSIDL_COMMON_APPDATA]: 'COMMON_APPDATA',
    [WIN32_CONSTANTS.CSIDL_WINDOWS]: 'WINDOWS',
    [WIN32_CONSTANTS.CSIDL_SYSTEM]: 'SYSTEM32',
    [WIN32_CONSTANTS.CSIDL_PROGRAM_FILES]: 'PROGRAM_FILES',
    [WIN32_CONSTANTS.CSIDL_PROGRAM_FILES_COMMON]: 'PROGRAM_FILES_COMMON',
    [WIN32_CONSTANTS.CSIDL_FONTS]: 'FONTS',
  };

  const folderKey = folderMap[csidl];
  return folderKey ? virtualFS.getPath(folderKey) : '/virtual';
}

/**
 * Gets system metrics
 */
export function GetSystemMetrics(index: number): number {
  switch (index) {
    case WIN32_CONSTANTS.SM_CXSCREEN:
      return window.screen.width;
    case WIN32_CONSTANTS.SM_CYSCREEN:
      return window.screen.height;
    case WIN32_CONSTANTS.SM_CXFULLSCREEN:
      return window.screen.availWidth;
    case WIN32_CONSTANTS.SM_CYFULLSCREEN:
      return window.screen.availHeight;
    case WIN32_CONSTANTS.SM_CXMAXIMIZED:
      return window.screen.availWidth;
    case WIN32_CONSTANTS.SM_CYMAXIMIZED:
      return window.screen.availHeight;
    default:
      return 0;
  }
}

/**
 * Gets computer name
 */
export function GetComputerName(): string {
  // Try to get hostname from various sources
  if (typeof window !== 'undefined') {
    try {
      return window.location.hostname || 'VB6-BROWSER';
    } catch {
      return 'VB6-BROWSER';
    }
  }
  return 'VB6-COMPUTER';
}

/**
 * Gets current user name
 */
export function GetUserName(): string {
  // In browser environment, try localStorage first
  const storedUser = localStorage.getItem('vb6_username');
  if (storedUser) {
    return storedUser;
  }

  // Try to infer from navigator or other sources
  if (typeof navigator !== 'undefined') {
    // Some browsers expose limited user info
    if ((navigator as any).userAgentData?.brands) {
      return 'User';
    }
  }

  return 'User';
}

/**
 * Sets current user name (VB6 compatible)
 */
export function SetUserName(userName: string): boolean {
  try {
    localStorage.setItem('vb6_username', userName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Displays a message box
 */
export function MessageBox(
  text: string,
  caption: string = '',
  type: number = WIN32_CONSTANTS.MB_OK
): number {
  const buttons = type & 0x0f;
  const icon = type & 0xf0;

  let iconText = '';
  switch (icon) {
    case WIN32_CONSTANTS.MB_ICONHAND:
      iconText = '❌ ';
      break;
    case WIN32_CONSTANTS.MB_ICONQUESTION:
      iconText = '❓ ';
      break;
    case WIN32_CONSTANTS.MB_ICONEXCLAMATION:
      iconText = '⚠️ ';
      break;
    case WIN32_CONSTANTS.MB_ICONASTERISK:
      iconText = 'ℹ️ ';
      break;
  }

  const fullText = iconText + text;
  const fullCaption = caption || 'VB6 Application';

  switch (buttons) {
    case WIN32_CONSTANTS.MB_OK:
      alert(fullText);
      return WIN32_CONSTANTS.IDOK;

    case WIN32_CONSTANTS.MB_OKCANCEL:
      return confirm(fullText) ? WIN32_CONSTANTS.IDOK : WIN32_CONSTANTS.IDCANCEL;

    case WIN32_CONSTANTS.MB_YESNO:
      return confirm(fullText) ? WIN32_CONSTANTS.IDYES : WIN32_CONSTANTS.IDNO;

    case WIN32_CONSTANTS.MB_YESNOCANCEL: {
      // Custom implementation for three buttons
      const result = prompt(fullText + '\n\nEnter: Y for Yes, N for No, C for Cancel', 'Y');
      if (result === null) return WIN32_CONSTANTS.IDCANCEL;
      const response = result.toUpperCase();
      if (response === 'Y') return WIN32_CONSTANTS.IDYES;
      if (response === 'N') return WIN32_CONSTANTS.IDNO;
      return WIN32_CONSTANTS.IDCANCEL;
    }

    case WIN32_CONSTANTS.MB_RETRYCANCEL:
      return confirm(fullText + '\n\nClick OK to Retry, Cancel to Cancel')
        ? WIN32_CONSTANTS.IDRETRY
        : WIN32_CONSTANTS.IDCANCEL;

    case WIN32_CONSTANTS.MB_ABORTRETRYIGNORE: {
      // Custom implementation for three buttons
      const ariResult = prompt(fullText + '\n\nEnter: A for Abort, R for Retry, I for Ignore', 'R');
      if (ariResult === null) return WIN32_CONSTANTS.IDABORT;
      const ariResponse = ariResult.toUpperCase();
      if (ariResponse === 'A') return WIN32_CONSTANTS.IDABORT;
      if (ariResponse === 'R') return WIN32_CONSTANTS.IDRETRY;
      return WIN32_CONSTANTS.IDIGNORE;
    }

    default:
      alert(fullText);
      return WIN32_CONSTANTS.IDOK;
  }
}

/**
 * Gets file attributes (simulated)
 */
export function GetFileAttributes(filename: string): number {
  // In browser environment, we can only simulate this
  // Check if it's a known directory path
  const lowerPath = filename.toLowerCase();

  if (
    lowerPath.includes('system') ||
    lowerPath.includes('windows') ||
    lowerPath.includes('program files')
  ) {
    return WIN32_CONSTANTS.FILE_ATTRIBUTE_DIRECTORY | WIN32_CONSTANTS.FILE_ATTRIBUTE_SYSTEM;
  }

  if (lowerPath.endsWith('.sys') || lowerPath.endsWith('.dll') || lowerPath.endsWith('.exe')) {
    return WIN32_CONSTANTS.FILE_ATTRIBUTE_SYSTEM;
  }

  // Default to normal file
  return WIN32_CONSTANTS.FILE_ATTRIBUTE_NORMAL;
}

/**
 * Sets file attributes (simulated)
 */
export function SetFileAttributes(filename: string, attributes: number): boolean {
  // In browser environment, this is simulated
  return true;
}

/**
 * Gets current directory
 */
export function GetCurrentDirectory(): string {
  // Return a simulated current directory
  return '/virtual/current';
}

/**
 * Sets current directory
 */
export function SetCurrentDirectory(pathName: string): boolean {
  // In browser environment, this is simulated
  return true;
}

/**
 * Creates a directory
 */
export function CreateDirectory(pathName: string): boolean {
  // In browser environment, this is simulated
  // Could potentially use localStorage to track created directories
  const createdDirs = JSON.parse(localStorage.getItem('vb6_created_dirs') || '[]');
  if (!createdDirs.includes(pathName)) {
    createdDirs.push(pathName);
    localStorage.setItem('vb6_created_dirs', JSON.stringify(createdDirs));
  }
  return true;
}

/**
 * Removes a directory
 */
export function RemoveDirectory(pathName: string): boolean {
  // In browser environment, this is simulated
  const createdDirs = JSON.parse(localStorage.getItem('vb6_created_dirs') || '[]');
  const index = createdDirs.indexOf(pathName);
  if (index > -1) {
    createdDirs.splice(index, 1);
    localStorage.setItem('vb6_created_dirs', JSON.stringify(createdDirs));
  }
  return true;
}

/**
 * Gets disk free space
 */
export function GetDiskFreeSpace(): number {
  // Estimate based on navigator storage if available
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      return quota - usage;
    });
  }

  // Return a reasonable default (1GB)
  return 1024 * 1024 * 1024;
}

/**
 * Gets version info
 */
export function GetVersionEx(): {
  dwMajorVersion: number;
  dwMinorVersion: number;
  dwBuildNumber: number;
  dwPlatformId: number;
  szCSDVersion: string;
} {
  const userAgent = navigator.userAgent;
  let majorVersion = 10;
  let minorVersion = 0;
  const buildNumber = 19045;

  // Try to parse version from user agent
  if (userAgent.includes('Windows NT')) {
    const match = userAgent.match(/Windows NT (\d+)\.(\d+)/);
    if (match) {
      majorVersion = parseInt(match[1]);
      minorVersion = parseInt(match[2]);
    }
  }

  return {
    dwMajorVersion: majorVersion,
    dwMinorVersion: minorVersion,
    dwBuildNumber: buildNumber,
    dwPlatformId: 2, // VER_PLATFORM_WIN32_NT
    szCSDVersion: '',
  };
}

/**
 * Registry simulation using localStorage with full path support
 */
export class VB6Registry {
  private static getRegistryKey(hKey: number, subKey: string): string {
    const hKeyNames: { [key: number]: string } = {
      [WIN32_CONSTANTS.HKEY_CLASSES_ROOT]: 'HKCR',
      [WIN32_CONSTANTS.HKEY_CURRENT_USER]: 'HKCU',
      [WIN32_CONSTANTS.HKEY_LOCAL_MACHINE]: 'HKLM',
      [WIN32_CONSTANTS.HKEY_USERS]: 'HKU',
      [WIN32_CONSTANTS.HKEY_CURRENT_CONFIG]: 'HKCC',
    };

    const hKeyName = hKeyNames[hKey] || 'HKEY';
    const fullPath = subKey ? `${hKeyName}\\${subKey}` : hKeyName;
    return `vb6_registry_${fullPath}`;
  }

  /**
   * Initialize default registry values
   */
  private static initializeDefaults(): void {
    const defaults = {
      'vb6_registry_HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion': {
        ProgramFilesDir: 'C:\\Program Files',
        CommonFilesDir: 'C:\\Program Files\\Common Files',
        ProductId: '00000-00000-00000-00000',
        RegisteredOwner: 'User',
        RegisteredOrganization: 'Organization',
        CurrentVersion: '10.0',
        CurrentBuild: '19045',
      },
    };

    if (typeof localStorage !== 'undefined') {
      for (const [key, value] of Object.entries(defaults)) {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    }
  }

  static RegOpenKeyEx(hKey: number, subKey: string): number {
    const registryKey = this.getRegistryKey(hKey, subKey);
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(registryKey);
      if (data) {
        return hKey;
      }
    }
    return hKey; // Return handle anyway for compatibility
  }

  static RegQueryValueEx(hKey: number, subKey: string, valueName: string): string | null {
    const registryKey = this.getRegistryKey(hKey, subKey);
    if (typeof localStorage === 'undefined') return null;

    try {
      const registryData = JSON.parse(localStorage.getItem(registryKey) || '{}');
      const value = registryData[valueName];
      if (value !== undefined) {
        return String(value);
      }
      return null;
    } catch {
      return null;
    }
  }

  static RegSetValueEx(
    hKey: number,
    subKey: string,
    valueName: string,
    value: string | number | boolean
  ): boolean {
    const registryKey = this.getRegistryKey(hKey, subKey);
    if (typeof localStorage === 'undefined') return false;

    try {
      const registryData = JSON.parse(localStorage.getItem(registryKey) || '{}');
      registryData[valueName] = value;
      localStorage.setItem(registryKey, JSON.stringify(registryData));
      return true;
    } catch {
      return false;
    }
  }

  static RegDeleteValue(hKey: number, subKey: string, valueName: string): boolean {
    const registryKey = this.getRegistryKey(hKey, subKey);
    if (typeof localStorage === 'undefined') return false;

    try {
      const registryData = JSON.parse(localStorage.getItem(registryKey) || '{}');
      delete registryData[valueName];
      localStorage.setItem(registryKey, JSON.stringify(registryData));
      return true;
    } catch {
      return false;
    }
  }

  static RegCreateKeyEx(hKey: number, subKey: string): boolean {
    const registryKey = this.getRegistryKey(hKey, subKey);
    if (typeof localStorage === 'undefined') return false;

    try {
      if (!localStorage.getItem(registryKey)) {
        localStorage.setItem(registryKey, JSON.stringify({}));
      }
      return true;
    } catch {
      return false;
    }
  }

  static RegCloseKey(hKey: number): boolean {
    return true;
  }

  static RegDeleteKey(hKey: number, subKey: string): boolean {
    const registryKey = this.getRegistryKey(hKey, subKey);
    if (typeof localStorage === 'undefined') return false;

    try {
      localStorage.removeItem(registryKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize registry with default values
   */
  static Initialize(): void {
    this.initializeDefaults();
  }
}

/**
 * Sleep function - Async sleep with logging
 */
export async function Sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

/**
 * Sleep function - Synchronous sleep (note: blocks execution)
 * Only use for compatibility - modern code should use async Sleep
 */
export function SleepSync(milliseconds: number): void {
  const start = Date.now();
  while (Date.now() - start < milliseconds) {
    // Busy wait - not ideal but matches VB6 behavior
  }
}

/**
 * Get tick count (milliseconds since system start)
 */
export function GetTickCount(): number {
  // Use performance.now() if available, otherwise Date.now()
  let tickCount: number;
  if (typeof performance !== 'undefined' && performance.now) {
    tickCount = Math.floor(performance.now());
  } else {
    tickCount = Date.now();
  }

  return tickCount & 0xffffffff; // Wrap to 32-bit like Windows
}

/**
 * Beep function
 */
export function Beep(frequency: number = 800, duration: number = 200): void {
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // Audio API may not be available in all environments
    }
  }
}

// Export all API functions for global access
export const VB6_WINDOWS_APIS = {
  // Directory functions
  GetWindowsDirectory,
  GetSystemDirectory,
  GetTempPath,
  SHGetSpecialFolderPath,
  GetCurrentDirectory,
  SetCurrentDirectory,
  CreateDirectory,
  RemoveDirectory,

  // System functions
  GetSystemMetrics,
  GetComputerName,
  GetUserName,
  SetUserName,
  GetVersionEx,
  GetTickCount,
  Sleep,
  SleepSync,
  Beep,

  // File functions
  GetFileAttributes,
  SetFileAttributes,
  GetDiskFreeSpace,

  // UI functions
  MessageBox,

  // Registry functions (with VB6Registry class methods)
  RegOpenKeyEx: VB6Registry.RegOpenKeyEx.bind(VB6Registry),
  RegQueryValueEx: VB6Registry.RegQueryValueEx.bind(VB6Registry),
  RegSetValueEx: VB6Registry.RegSetValueEx.bind(VB6Registry),
  RegDeleteValue: VB6Registry.RegDeleteValue.bind(VB6Registry),
  RegCreateKeyEx: VB6Registry.RegCreateKeyEx.bind(VB6Registry),
  RegCloseKey: VB6Registry.RegCloseKey.bind(VB6Registry),
  RegDeleteKey: VB6Registry.RegDeleteKey.bind(VB6Registry),

  // Registry class for advanced usage
  VB6Registry,

  // Constants
  WIN32_CONSTANTS,
};

// Make APIs globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.VB6WindowsAPIs = VB6_WINDOWS_APIS;

  // Also expose individual functions globally for direct VB6 compatibility
  Object.assign(globalAny, VB6_WINDOWS_APIS);
}

export default VB6_WINDOWS_APIS;
