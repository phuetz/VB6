/**
 * Windows API - Complete VB6 Windows API Implementation
 * Provides browser-compatible implementations of essential Windows APIs
 */

// Registry API Constants
export enum HKEY {
  HKEY_CLASSES_ROOT = 0x80000000,
  HKEY_CURRENT_USER = 0x80000001,
  HKEY_LOCAL_MACHINE = 0x80000002,
  HKEY_USERS = 0x80000003,
  HKEY_PERFORMANCE_DATA = 0x80000004,
  HKEY_CURRENT_CONFIG = 0x80000005,
  HKEY_DYN_DATA = 0x80000006,
}

export enum REG_TYPE {
  REG_NONE = 0,
  REG_SZ = 1,
  REG_EXPAND_SZ = 2,
  REG_BINARY = 3,
  REG_DWORD = 4,
  REG_DWORD_LITTLE_ENDIAN = 12,
  REG_DWORD_BIG_ENDIAN = 5,
  REG_LINK = 6,
  REG_MULTI_SZ = 7,
  REG_RESOURCE_LIST = 8,
  REG_FULL_RESOURCE_DESCRIPTOR = 9,
  REG_RESOURCE_REQUIREMENTS_LIST = 10,
  REG_QWORD = 11,
  REG_QWORD_LITTLE_ENDIAN = 13,
}

// Shell API Constants
export enum SW {
  SW_HIDE = 0,
  SW_SHOWNORMAL = 1,
  SW_NORMAL = 14,
  SW_SHOWMINIMIZED = 2,
  SW_SHOWMAXIMIZED = 3,
  SW_MAXIMIZE = 15,
  SW_SHOWNOACTIVATE = 4,
  SW_SHOW = 5,
  SW_MINIMIZE = 6,
  SW_SHOWMINNOACTIVE = 7,
  SW_SHOWNA = 8,
  SW_RESTORE = 9,
  SW_SHOWDEFAULT = 10,
  SW_FORCEMINIMIZE = 11,
}

export enum CSIDL {
  CSIDL_DESKTOP = 0x0000,
  CSIDL_INTERNET = 0x0001,
  CSIDL_PROGRAMS = 0x0002,
  CSIDL_CONTROLS = 0x0003,
  CSIDL_PRINTERS = 0x0004,
  CSIDL_PERSONAL = 0x0005,
  CSIDL_FAVORITES = 0x0006,
  CSIDL_STARTUP = 0x0007,
  CSIDL_RECENT = 0x0008,
  CSIDL_SENDTO = 0x0009,
  CSIDL_BITBUCKET = 0x000a,
  CSIDL_STARTMENU = 0x000b,
  CSIDL_MYDOCUMENTS = 0x000c,
  CSIDL_MYMUSIC = 0x000d,
  CSIDL_MYVIDEO = 0x000e,
  CSIDL_DESKTOPDIRECTORY = 0x0010,
  CSIDL_DRIVES = 0x0011,
  CSIDL_NETWORK = 0x0012,
  CSIDL_NETHOOD = 0x0013,
  CSIDL_FONTS = 0x0014,
  CSIDL_TEMPLATES = 0x0015,
  CSIDL_COMMON_STARTMENU = 0x0016,
  CSIDL_COMMON_PROGRAMS = 0x0017,
  CSIDL_COMMON_STARTUP = 0x0018,
  CSIDL_COMMON_DESKTOPDIRECTORY = 0x0019,
  CSIDL_APPDATA = 0x001a,
  CSIDL_PRINTHOOD = 0x001b,
  CSIDL_LOCAL_APPDATA = 0x001c,
  CSIDL_ALTSTARTUP = 0x001d,
  CSIDL_COMMON_ALTSTARTUP = 0x001e,
  CSIDL_COMMON_FAVORITES = 0x001f,
  CSIDL_INTERNET_CACHE = 0x0020,
  CSIDL_COOKIES = 0x0021,
  CSIDL_HISTORY = 0x0022,
  CSIDL_COMMON_APPDATA = 0x0023,
  CSIDL_WINDOWS = 0x0024,
  CSIDL_SYSTEM = 0x0025,
  CSIDL_PROGRAM_FILES = 0x0026,
  CSIDL_MYPICTURES = 0x0027,
  CSIDL_PROFILE = 0x0028,
  CSIDL_SYSTEMX86 = 0x0029,
  CSIDL_PROGRAM_FILESX86 = 0x002a,
  CSIDL_PROGRAM_FILES_COMMON = 0x002b,
  CSIDL_PROGRAM_FILES_COMMONX86 = 0x002c,
  CSIDL_COMMON_TEMPLATES = 0x002d,
  CSIDL_COMMON_DOCUMENTS = 0x002e,
  CSIDL_COMMON_ADMINTOOLS = 0x002f,
  CSIDL_ADMINTOOLS = 0x0030,
  CSIDL_CONNECTIONS = 0x0031,
  CSIDL_COMMON_MUSIC = 0x0035,
  CSIDL_COMMON_PICTURES = 0x0036,
  CSIDL_COMMON_VIDEO = 0x0037,
  CSIDL_RESOURCES = 0x0038,
  CSIDL_RESOURCES_LOCALIZED = 0x0039,
  CSIDL_COMMON_OEM_LINKS = 0x003a,
  CSIDL_CDBURN_AREA = 0x003b,
  CSIDL_COMPUTERSNEARME = 0x003d,
}

// GDI+ Constants
export enum GdiplusStartupStatus {
  Ok = 0,
  GenericError = 1,
  InvalidParameter = 2,
  OutOfMemory = 3,
  ObjectBusy = 4,
  InsufficientBuffer = 5,
  NotImplemented = 6,
  Win32Error = 7,
  WrongState = 8,
  Aborted = 9,
  FileNotFound = 10,
  ValueOverflow = 11,
  AccessDenied = 12,
  UnknownImageFormat = 13,
  FontFamilyNotFound = 14,
  FontStyleNotFound = 15,
  NotTrueTypeFont = 16,
  UnsupportedGdiplusVersion = 17,
  GdiplusNotInitialized = 18,
  PropertyNotFound = 19,
  PropertyNotSupported = 20,
}

// Multimedia API Constants
export enum SND {
  SND_SYNC = 0x0000,
  SND_ASYNC = 0x0001,
  SND_NODEFAULT = 0x0002,
  SND_LOOP = 0x0008,
  SND_NOSTOP = 0x0010,
  SND_NOWAIT = 0x00002000,
  SND_ALIAS = 0x00010000,
  SND_ALIAS_ID = 0x00110000,
  SND_FILENAME = 0x00020000,
  SND_RESOURCE = 0x00040004,
  SND_PURGE = 0x0040,
  SND_APPLICATION = 0x0080,
}

// Browser-based Registry Simulation using localStorage
class RegistryAPI {
  private static readonly PREFIX = 'VB6_REGISTRY_';

  static RegOpenKeyEx(
    hKey: HKEY,
    lpSubKey: string,
    ulOptions: number,
    samDesired: number
  ): { result: number; phkResult: number } {
    try {
      const fullKey = `${RegistryAPI.PREFIX}${hKey}_${lpSubKey}`;
      // Simulate opening a key by checking if it exists
      const exists = localStorage.getItem(fullKey + '_EXISTS') !== null;
      return { result: 0, phkResult: exists ? 1 : 0 }; // 0 = ERROR_SUCCESS
    } catch {
      return { result: 2, phkResult: 0 }; // 2 = ERROR_FILE_NOT_FOUND
    }
  }

  static RegQueryValueEx(
    hKey: number,
    lpValueName: string,
    lpReserved: number,
    lpType: REG_TYPE
  ): { result: number; data: any; type: REG_TYPE } {
    try {
      const fullKey = `${RegistryAPI.PREFIX}${hKey}_${lpValueName}`;
      const data = localStorage.getItem(fullKey);
      const type = parseInt(localStorage.getItem(fullKey + '_TYPE') || '1', 10) as REG_TYPE;

      if (data === null) {
        return { result: 2, data: null, type: REG_TYPE.REG_NONE }; // ERROR_FILE_NOT_FOUND
      }

      let parsedData: any = data;
      switch (type) {
        case REG_TYPE.REG_DWORD:
          parsedData = parseInt(data, 10);
          break;
        case REG_TYPE.REG_BINARY:
          parsedData = new Uint8Array(JSON.parse(data));
          break;
        case REG_TYPE.REG_MULTI_SZ:
          parsedData = JSON.parse(data);
          break;
      }

      return { result: 0, data: parsedData, type };
    } catch {
      return { result: 1, data: null, type: REG_TYPE.REG_NONE }; // ERROR_INVALID_FUNCTION
    }
  }

  static RegSetValueEx(
    hKey: number,
    lpValueName: string,
    reserved: number,
    dwType: REG_TYPE,
    lpData: any
  ): number {
    try {
      const fullKey = `${RegistryAPI.PREFIX}${hKey}_${lpValueName}`;

      let dataToStore: string;
      switch (dwType) {
        case REG_TYPE.REG_DWORD:
          dataToStore = lpData.toString();
          break;
        case REG_TYPE.REG_BINARY:
          dataToStore = JSON.stringify(Array.from(lpData));
          break;
        case REG_TYPE.REG_MULTI_SZ:
          dataToStore = JSON.stringify(lpData);
          break;
        default:
          dataToStore = lpData.toString();
      }

      localStorage.setItem(fullKey, dataToStore);
      localStorage.setItem(fullKey + '_TYPE', dwType.toString());
      return 0; // ERROR_SUCCESS
    } catch {
      return 1; // ERROR_INVALID_FUNCTION
    }
  }

  static RegDeleteValue(hKey: number, lpValueName: string): number {
    try {
      const fullKey = `${RegistryAPI.PREFIX}${hKey}_${lpValueName}`;
      localStorage.removeItem(fullKey);
      localStorage.removeItem(fullKey + '_TYPE');
      return 0; // ERROR_SUCCESS
    } catch {
      return 1; // ERROR_INVALID_FUNCTION
    }
  }

  static RegCloseKey(hKey: number): number {
    // No-op in browser environment
    return 0; // ERROR_SUCCESS
  }

  static RegCreateKeyEx(
    hKey: HKEY,
    lpSubKey: string
  ): { result: number; phkResult: number; lpdwDisposition: number } {
    try {
      const fullKey = `${RegistryAPI.PREFIX}${hKey}_${lpSubKey}`;
      const existed = localStorage.getItem(fullKey + '_EXISTS') !== null;
      localStorage.setItem(fullKey + '_EXISTS', 'true');

      return {
        result: 0, // ERROR_SUCCESS
        phkResult: 1,
        lpdwDisposition: existed ? 2 : 1, // REG_OPENED_EXISTING_KEY : REG_CREATED_NEW_KEY
      };
    } catch {
      return { result: 1, phkResult: 0, lpdwDisposition: 0 }; // ERROR_INVALID_FUNCTION
    }
  }
}

// Shell API Implementation
class ShellAPI {
  static ShellExecute(
    hwnd: number,
    lpOperation: string,
    lpFile: string,
    lpParameters: string,
    lpDirectory: string,
    nShowCmd: SW
  ): number {
    try {
      if (lpOperation === 'open' || lpOperation === '') {
        if (lpFile.startsWith('http') || lpFile.startsWith('mailto:')) {
          window.open(lpFile, '_blank');
          return 32; // Success (> 32)
        } else if (lpFile.endsWith('.txt') || lpFile.endsWith('.html')) {
          // Simulate opening text/html files
          window.open(
            `data:text/plain,${encodeURIComponent('File content would be displayed here')}`,
            '_blank'
          );
          return 32;
        }
      }
      return 31; // ERROR_NO_ASSOCIATION
    } catch {
      return 0; // SE_ERR_OOM
    }
  }

  static SHGetFolderPath(
    hwndOwner: number,
    nFolder: CSIDL,
    hToken: number,
    dwFlags: number
  ): string {
    // Map CSIDL values to logical paths in browser environment
    const folderMappings: Record<number, string> = {
      [CSIDL.CSIDL_DESKTOP]: '/Desktop',
      [CSIDL.CSIDL_PERSONAL]: '/Documents',
      [CSIDL.CSIDL_MYDOCUMENTS]: '/Documents',
      [CSIDL.CSIDL_MYMUSIC]: '/Music',
      [CSIDL.CSIDL_MYVIDEO]: '/Videos',
      [CSIDL.CSIDL_MYPICTURES]: '/Pictures',
      [CSIDL.CSIDL_APPDATA]: '/AppData/Roaming',
      [CSIDL.CSIDL_LOCAL_APPDATA]: '/AppData/Local',
      [CSIDL.CSIDL_PROGRAM_FILES]: '/Program Files',
      [CSIDL.CSIDL_WINDOWS]: '/Windows',
      [CSIDL.CSIDL_SYSTEM]: '/Windows/System32',
      [CSIDL.CSIDL_TEMP]: '/Temp',
    };

    return folderMappings[nFolder] || '/';
  }

  static GetTempPath(): string {
    return '/Temp/';
  }

  static GetWindowsDirectory(): string {
    return '/Windows/';
  }

  static GetSystemDirectory(): string {
    return '/Windows/System32/';
  }

  static FindWindow(lpClassName: string | null, lpWindowName: string | null): number {
    // Simulate finding a window
    if (lpWindowName === document.title) {
      return 1; // Return a fake handle for the current window
    }
    return 0; // Window not found
  }

  static GetWindowText(hWnd: number): string {
    if (hWnd === 1) {
      return document.title;
    }
    return '';
  }

  static SetWindowText(hWnd: number, lpString: string): boolean {
    if (hWnd === 1) {
      document.title = lpString;
      return true;
    }
    return false;
  }

  static ShowWindow(hWnd: number, nCmdShow: SW): boolean {
    // Limited functionality in browser
    switch (nCmdShow) {
      case SW.SW_MAXIMIZE:
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
        return true;
      case SW.SW_MINIMIZE:
        window.blur();
        return true;
      case SW.SW_RESTORE:
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        return true;
      default:
        return true;
    }
  }
}

// Clipboard API Implementation
class ClipboardAPI {
  static async SetClipboardText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch {
      return false;
    }
  }

  static async GetClipboardText(): Promise<string> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      } else {
        // Fallback - prompt user to paste
        return prompt('Please paste the clipboard content:') || '';
      }
    } catch {
      return '';
    }
  }

  static async SetClipboardData(format: string, data: any): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        let clipboardItem: ClipboardItem;

        if (format === 'text/plain') {
          clipboardItem = new ClipboardItem({
            'text/plain': new Blob([data], { type: 'text/plain' }),
          });
        } else if (format === 'image/png') {
          clipboardItem = new ClipboardItem({
            'image/png': data,
          });
        } else {
          return false;
        }

        await navigator.clipboard.write([clipboardItem]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static IsClipboardFormatAvailable(format: string): boolean {
    // Limited detection in browser environment
    return navigator.clipboard !== undefined;
  }

  static EmptyClipboard(): boolean {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// GDI+ API Implementation
class GdiPlusAPI {
  private static isInitialized = false;
  private static token = 0;

  static GdiplusStartup(): { status: GdiplusStartupStatus; token: number } {
    if (!GdiPlusAPI.isInitialized) {
      GdiPlusAPI.isInitialized = true;
      GdiPlusAPI.token = Math.floor(Math.random() * 1000000);
    }
    return {
      status: GdiplusStartupStatus.Ok,
      token: GdiPlusAPI.token,
    };
  }

  static GdiplusShutdown(token: number): void {
    if (token === GdiPlusAPI.token) {
      GdiPlusAPI.isInitialized = false;
      GdiPlusAPI.token = 0;
    }
  }

  static CreateGraphicsFromCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    return canvas.getContext('2d');
  }

  static DrawString(
    graphics: CanvasRenderingContext2D,
    text: string,
    font: string,
    brush: string,
    x: number,
    y: number
  ): GdiplusStartupStatus {
    try {
      graphics.font = font;
      graphics.fillStyle = brush;
      graphics.fillText(text, x, y);
      return GdiplusStartupStatus.Ok;
    } catch {
      return GdiplusStartupStatus.GenericError;
    }
  }

  static DrawRectangle(
    graphics: CanvasRenderingContext2D,
    pen: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): GdiplusStartupStatus {
    try {
      graphics.strokeStyle = pen;
      graphics.strokeRect(x, y, width, height);
      return GdiplusStartupStatus.Ok;
    } catch {
      return GdiplusStartupStatus.GenericError;
    }
  }

  static FillRectangle(
    graphics: CanvasRenderingContext2D,
    brush: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): GdiplusStartupStatus {
    try {
      graphics.fillStyle = brush;
      graphics.fillRect(x, y, width, height);
      return GdiplusStartupStatus.Ok;
    } catch {
      return GdiplusStartupStatus.GenericError;
    }
  }

  static DrawImage(
    graphics: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): GdiplusStartupStatus {
    try {
      if (width !== undefined && height !== undefined) {
        graphics.drawImage(image, x, y, width, height);
      } else {
        graphics.drawImage(image, x, y);
      }
      return GdiplusStartupStatus.Ok;
    } catch {
      return GdiplusStartupStatus.GenericError;
    }
  }

  static SaveImageToFile(
    canvas: HTMLCanvasElement,
    filename: string,
    format: string = 'png'
  ): boolean {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
      return true;
    } catch {
      return false;
    }
  }
}

// Multimedia API Implementation
class MultimediaAPI {
  private static audioContext: AudioContext | null = null;
  private static audioElements: Map<string, HTMLAudioElement> = new Map();

  static async PlaySound(sound: string, flags: SND): Promise<boolean> {
    try {
      let audio: HTMLAudioElement;

      if (flags & SND.SND_FILENAME) {
        // Load from file
        audio = new Audio(sound);
      } else if (flags & SND.SND_ALIAS) {
        // Use system sound alias
        audio = MultimediaAPI.getSystemSound(sound);
      } else {
        // Default to filename
        audio = new Audio(sound);
      }

      if (flags & SND.SND_LOOP) {
        audio.loop = true;
      }

      if (flags & SND.SND_ASYNC) {
        // Play asynchronously
        audio.play().catch(() => false);
        return true;
      } else {
        // Play synchronously (wait for completion)
        await audio.play();
        return new Promise(resolve => {
          audio.addEventListener('ended', () => resolve(true));
          audio.addEventListener('error', () => resolve(false));
        });
      }
    } catch {
      return false;
    }
  }

  private static getSystemSound(alias: string): HTMLAudioElement {
    // Map system sound aliases to actual sounds or generate tones
    const audio = new Audio();

    switch (alias.toLowerCase()) {
      case 'systemhand':
      case 'systemexclamation':
        // Generate a warning beep
        MultimediaAPI.generateTone(800, 200);
        break;
      case 'systemquestion':
        // Generate a question beep
        MultimediaAPI.generateTone(600, 150);
        break;
      case 'systemasterisk':
        // Generate an info beep
        MultimediaAPI.generateTone(1000, 100);
        break;
      default:
        // Generate a default beep
        MultimediaAPI.generateTone(800, 100);
    }

    return audio;
  }

  private static generateTone(frequency: number, duration: number): void {
    try {
      if (!MultimediaAPI.audioContext) {
        MultimediaAPI.audioContext = new AudioContext();
      }

      const oscillator = MultimediaAPI.audioContext.createOscillator();
      const gainNode = MultimediaAPI.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(MultimediaAPI.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, MultimediaAPI.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        MultimediaAPI.audioContext.currentTime + duration / 1000
      );

      oscillator.start(MultimediaAPI.audioContext.currentTime);
      oscillator.stop(MultimediaAPI.audioContext.currentTime + duration / 1000);
    } catch {
      // Fallback to console beep if audio API fails
    return true;
  }

  static StopSound(): boolean {
    try {
      MultimediaAPI.audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      return true;
    } catch {
      return false;
    }
  }
}

// File API Implementation
class FileAPI {
  static GetFileAttributes(fileName: string): number {
    // Simulate file attributes (limited in browser)
    try {
      // In a real implementation, this would check file system
      // For browser, we simulate based on file extension
      if (fileName.endsWith('/')) {
        return 0x10; // FILE_ATTRIBUTE_DIRECTORY
      }
      return 0x20; // FILE_ATTRIBUTE_ARCHIVE
    } catch {
      return 0xffffffff; // INVALID_FILE_ATTRIBUTES
    }
  }

  static SetFileAttributes(fileName: string, attributes: number): boolean {
    // Limited functionality in browser environment
    return false;
  }

  static GetFileVersion(fileName: string): string {
    // Simulate getting file version
    return '1.0.0.0';
  }

  static CopyFile(existingFileName: string, newFileName: string, failIfExists: boolean): boolean {
    // Cannot actually copy files in browser, return simulated result
    return !failIfExists || !FileAPI.FileExists(newFileName);
  }

  static DeleteFile(fileName: string): boolean {
    // Cannot delete actual files in browser
    return true;
  }

  static FileExists(fileName: string): boolean {
    // Limited file existence checking in browser
    return fileName.length > 0;
  }

  static GetTempFileName(pathName: string, prefixString: string, unique: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${pathName}/${prefixString}${unique || timestamp}_${random}.tmp`;
  }
}

// Main Windows API Export
export const WindowsAPI = {
  // Registry API
  Registry: RegistryAPI,

  // Shell API
  Shell: ShellAPI,

  // Clipboard API
  Clipboard: ClipboardAPI,

  // GDI+ API
  GdiPlus: GdiPlusAPI,

  // Multimedia API
  Multimedia: MultimediaAPI,

  // File API
  File: FileAPI,

  // Constants
  HKEY,
  REG_TYPE,
  SW,
  CSIDL,
  SND,
  GdiplusStartupStatus,

  // Utility functions
  GetTickCount: (): number => Date.now(),

  Sleep: (milliseconds: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, milliseconds)),

  GetSystemMetrics: (nIndex: number): number => {
    // Return system metrics (limited in browser)
    switch (nIndex) {
      case 0:
        return window.screen.width; // SM_CXSCREEN
      case 1:
        return window.screen.height; // SM_CYSCREEN
      case 78:
        return window.screen.width; // SM_CXVIRTUALSCREEN
      case 79:
        return window.screen.height; // SM_CYVIRTUALSCREEN
      default:
        return 0;
    }
  },

  MessageBox: (hwnd: number, text: string, caption: string, type: number): number => {
    // Map VB6 message box types to browser confirm/alert
    if (type & 0x1) {
      // MB_OKCANCEL
      return confirm(`${caption}\n\n${text}`) ? 1 : 2; // IDOK : IDCANCEL
    } else if (type & 0x3) {
      // MB_YESNOCANCEL
      const result = prompt(`${caption}\n\n${text}\n\nEnter 'yes', 'no', or 'cancel':`);
      switch (result?.toLowerCase()) {
        case 'yes':
          return 6; // IDYES
        case 'no':
          return 7; // IDNO
        default:
          return 2; // IDCANCEL
      }
    } else if (type & 0x4) {
      // MB_YESNO
      return confirm(`${caption}\n\n${text}`) ? 6 : 7; // IDYES : IDNO
    } else {
      alert(`${caption}\n\n${text}`);
      return 1; // IDOK
    }
  },

  GetComputerName: (): string => {
    return navigator.userAgent.includes('Windows') ? 'BROWSER-PC' : 'BROWSER-DEVICE';
  },

  GetUserName: (): string => {
    return 'BrowserUser';
  },

  GetVersion: (): number => {
    // Return a simulated Windows version
    return 0x0a000000; // Windows 10
  },
};

export default WindowsAPI;
