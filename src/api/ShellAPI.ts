import { EventEmitter } from 'events';

// Shell Constants
export enum ShellSpecialFolder {
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
}

export enum ShellExecuteShow {
  SW_HIDE = 0,
  SW_SHOWNORMAL = 1,
  SW_NORMAL = 12,
  SW_SHOWMINIMIZED = 2,
  SW_SHOWMAXIMIZED = 3,
  SW_MAXIMIZE = 13,
  SW_SHOWNOACTIVATE = 4,
  SW_SHOW = 5,
  SW_MINIMIZE = 6,
  SW_SHOWMINNOACTIVE = 7,
  SW_SHOWNA = 8,
  SW_RESTORE = 9,
  SW_SHOWDEFAULT = 10,
  SW_FORCEMINIMIZE = 11,
}

export enum ShellExecuteError {
  SE_ERR_FNF = 2,
  SE_ERR_PNF = 3,
  SE_ERR_ACCESSDENIED = 5,
  SE_ERR_OOM = 8,
  SE_ERR_DLLNOTFOUND = 32,
  SE_ERR_SHARE = 26,
  SE_ERR_ASSOCINCOMPLETE = 27,
  SE_ERR_DDETIMEOUT = 28,
  SE_ERR_DDEFAIL = 29,
  SE_ERR_DDEBUSY = 30,
  SE_ERR_NOASSOC = 31,
}

export enum BrowseInfoFlags {
  BIF_RETURNONLYFSDIRS = 0x0001,
  BIF_DONTGOBELOWDOMAIN = 0x0002,
  BIF_STATUSTEXT = 0x0004,
  BIF_RETURNFSANCESTORS = 0x0008,
  BIF_EDITBOX = 0x0010,
  BIF_VALIDATE = 0x0020,
  BIF_NEWDIALOGSTYLE = 0x0040,
  BIF_USENEWUI = 0x0050,
  BIF_BROWSEINCLUDEURLS = 0x0080,
  BIF_BROWSEFORCOMPUTER = 0x1000,
  BIF_BROWSEFORPRINTER = 0x2000,
  BIF_BROWSEINCLUDEFILES = 0x4000,
  BIF_SHAREABLE = 0x8000,
}

export enum FileOperationFlags {
  FOF_MULTIDESTFILES = 0x0001,
  FOF_CONFIRMMOUSE = 0x0002,
  FOF_SILENT = 0x0004,
  FOF_RENAMEONCOLLISION = 0x0008,
  FOF_NOCONFIRMATION = 0x0010,
  FOF_WANTMAPPINGHANDLE = 0x0020,
  FOF_ALLOWUNDO = 0x0040,
  FOF_FILESONLY = 0x0080,
  FOF_SIMPLEPROGRESS = 0x0100,
  FOF_NOCONFIRMMKDIR = 0x0200,
  FOF_NOERRORUI = 0x0400,
  FOF_NOCOPYSECURITYATTRIBS = 0x0800,
}

export enum FileOperationType {
  FO_MOVE = 0x0001,
  FO_COPY = 0x0002,
  FO_DELETE = 0x0003,
  FO_RENAME = 0x0004,
}

// Shell Structures
export interface SHFILEINFO {
  hIcon: number;
  iIcon: number;
  dwAttributes: number;
  szDisplayName: string;
  szTypeName: string;
}

export interface BROWSEINFO {
  hwndOwner: number;
  pidlRoot: number;
  pszDisplayName: string;
  lpszTitle: string;
  ulFlags: number;
  lpfn: ((hwnd: number, msg: number, pidl: number, lpData: number) => number) | null;
  lParam: number;
  iImage: number;
}

export interface SHFILEOPSTRUCT {
  hwnd: number;
  wFunc: FileOperationType;
  pFrom: string;
  pTo: string;
  fFlags: number;
  fAnyOperationsAborted: boolean;
  hNameMappings: number;
  lpszProgressTitle: string;
}

export interface NOTIFYICONDATA {
  cbSize: number;
  hWnd: number;
  uID: number;
  uFlags: number;
  uCallbackMessage: number;
  hIcon: number;
  szTip: string;
  dwState: number;
  dwStateMask: number;
  szInfo: string;
  uTimeout: number;
  szInfoTitle: string;
  dwInfoFlags: number;
}

// Shell Link Interface
export interface IShellLink {
  GetPath(): string;
  SetPath(path: string): void;
  GetDescription(): string;
  SetDescription(description: string): void;
  GetWorkingDirectory(): string;
  SetWorkingDirectory(directory: string): void;
  GetArguments(): string;
  SetArguments(arguments: string): void;
  GetHotkey(): number;
  SetHotkey(hotkey: number): void;
  GetShowCmd(): number;
  SetShowCmd(showCmd: number): void;
  GetIconLocation(): { path: string; index: number };
  SetIconLocation(path: string, index: number): void;
  Save(filename: string): void;
  Load(filename: string): void;
}

// Shell Application Interface
export interface IShellApplication {
  Windows(): any[];
  Open(directory: string): void;
  Explore(directory: string): void;
  MinimizeAll(): void;
  UndoMinimizeAll(): void;
  FileRun(): void;
  CascadeWindows(): void;
  TileVertically(): void;
  TileHorizontally(): void;
  ShutdownWindows(): void;
  FindFiles(): void;
  FindComputer(): void;
  SetTime(): void;
  ControlPanelItem(item: string): void;
}

class ShellLink implements IShellLink {
  private path = '';
  private description = '';
  private workingDirectory = '';
  private arguments = '';
  private hotkey = 0;
  private showCmd = ShellExecuteShow.SW_SHOWNORMAL;
  private iconPath = '';
  private iconIndex = 0;

  GetPath(): string {
    return this.path;
  }
  SetPath(path: string): void {
    this.path = path;
  }
  GetDescription(): string {
    return this.description;
  }
  SetDescription(description: string): void {
    this.description = description;
  }
  GetWorkingDirectory(): string {
    return this.workingDirectory;
  }
  SetWorkingDirectory(directory: string): void {
    this.workingDirectory = directory;
  }
  GetArguments(): string {
    return this.arguments;
  }
  SetArguments(args: string): void {
    this.arguments = args;
  }
  GetHotkey(): number {
    return this.hotkey;
  }
  SetHotkey(hotkey: number): void {
    this.hotkey = hotkey;
  }
  GetShowCmd(): number {
    return this.showCmd;
  }
  SetShowCmd(showCmd: number): void {
    this.showCmd = showCmd;
  }
  GetIconLocation(): { path: string; index: number } {
    return { path: this.iconPath, index: this.iconIndex };
  }
  SetIconLocation(path: string, index: number): void {
    this.iconPath = path;
    this.iconIndex = index;
  }

  Save(filename: string): void {
    // In browser, we can create a .url file
    const urlContent = [
      '[InternetShortcut]',
      `URL=file:///${this.path.replace(/\\/g, '/')}`,
      `WorkingDirectory=${this.workingDirectory}`,
      `IconFile=${this.iconPath}`,
      `IconIndex=${this.iconIndex}`,
    ].join('\n');

    const blob = new Blob([urlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.url') ? filename : filename + '.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  Load(filename: string): void {
    // Cannot load files in browser
    throw new Error('Loading shortcuts not supported in browser');
  }
}

export class ShellAPI extends EventEmitter {
  private static instance: ShellAPI;
  private trayIcons: Map<number, NOTIFYICONDATA> = new Map();
  private nextIconId = 1;

  private constructor() {
    super();
  }

  public static getInstance(): ShellAPI {
    if (!ShellAPI.instance) {
      ShellAPI.instance = new ShellAPI();
    }
    return ShellAPI.instance;
  }

  // ShellExecute - Execute a file or URL
  public ShellExecute(
    hwnd: number,
    lpOperation: string | null,
    lpFile: string,
    lpParameters: string | null,
    lpDirectory: string | null,
    nShowCmd: ShellExecuteShow
  ): number {
    try {
      const operation = lpOperation?.toLowerCase() || 'open';

      // Handle URLs
      if (lpFile.match(/^https?:\/\//i) || lpFile.match(/^mailto:/i)) {
        window.open(lpFile, '_blank');
        this.emit('shellExecute', { operation, file: lpFile, parameters: lpParameters });
        return 33; // Success
      }

      // Handle file operations
      switch (operation) {
        case 'open':
        case 'explore':
          // Try to open file (limited in browser)
          if (lpFile.match(/\.(txt|html|htm|pdf|jpg|jpeg|png|gif)$/i)) {
            window.open(lpFile, '_blank');
          } else {
            console.warn(`Cannot open file type: ${lpFile}`);
            return ShellExecuteError.SE_ERR_NOASSOC;
          }
          break;

        case 'print':
          if (lpFile.match(/\.(txt|html|htm|pdf)$/i)) {
            const printWindow = window.open(lpFile, '_blank');
            if (printWindow) {
              printWindow.onload = () => printWindow.print();
            }
          }
          break;

        case 'edit':
          console.warn('Edit operation not supported in browser');
          return ShellExecuteError.SE_ERR_NOASSOC;

        default:
          console.warn(`Unknown operation: ${operation}`);
          return ShellExecuteError.SE_ERR_NOASSOC;
      }

      this.emit('shellExecute', { operation, file: lpFile, parameters: lpParameters });
      return 33; // Success
    } catch (error) {
      this.emit('error', error);
      return ShellExecuteError.SE_ERR_ACCESSDENIED;
    }
  }

  // ShellExecuteEx - Extended shell execute
  public ShellExecuteEx(params: {
    lpFile: string;
    lpParameters?: string;
    lpDirectory?: string;
    nShow?: ShellExecuteShow;
    lpVerb?: string;
    fMask?: number;
    hwnd?: number;
    lpClass?: string;
  }): { success: boolean; hInstApp: number; hProcess?: number } {
    const result = this.ShellExecute(
      params.hwnd || 0,
      params.lpVerb || null,
      params.lpFile,
      params.lpParameters || null,
      params.lpDirectory || null,
      params.nShow || ShellExecuteShow.SW_SHOWNORMAL
    );

    return {
      success: result > 32,
      hInstApp: result,
      hProcess: result > 32 ? Date.now() : undefined,
    };
  }

  // SHGetSpecialFolderPath - Get special folder path
  public SHGetSpecialFolderPath(hwnd: number, nFolder: ShellSpecialFolder): string | null {
    try {
      // Map Windows special folders to browser equivalents
      switch (nFolder) {
        case ShellSpecialFolder.CSIDL_DESKTOP:
          return '/Desktop';
        case ShellSpecialFolder.CSIDL_PERSONAL:
        case ShellSpecialFolder.CSIDL_MYDOCUMENTS:
          return '/Documents';
        case ShellSpecialFolder.CSIDL_MYPICTURES:
          return '/Pictures';
        case ShellSpecialFolder.CSIDL_MYMUSIC:
          return '/Music';
        case ShellSpecialFolder.CSIDL_MYVIDEO:
          return '/Videos';
        case ShellSpecialFolder.CSIDL_APPDATA:
          return '/AppData/Roaming';
        case ShellSpecialFolder.CSIDL_LOCAL_APPDATA:
          return '/AppData/Local';
        case ShellSpecialFolder.CSIDL_COMMON_APPDATA:
          return '/ProgramData';
        case ShellSpecialFolder.CSIDL_PROGRAM_FILES:
          return '/Program Files';
        case ShellSpecialFolder.CSIDL_PROGRAM_FILESX86:
          return '/Program Files (x86)';
        case ShellSpecialFolder.CSIDL_WINDOWS:
          return '/Windows';
        case ShellSpecialFolder.CSIDL_SYSTEM:
          return '/Windows/System32';
        case ShellSpecialFolder.CSIDL_FONTS:
          return '/Windows/Fonts';
        case ShellSpecialFolder.CSIDL_STARTUP:
          return '/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup';
        case ShellSpecialFolder.CSIDL_RECENT:
          return '/AppData/Roaming/Microsoft/Windows/Recent';
        case ShellSpecialFolder.CSIDL_FAVORITES:
          return '/Favorites';
        case ShellSpecialFolder.CSIDL_COOKIES:
          return '/AppData/Local/Microsoft/Windows/INetCookies';
        case ShellSpecialFolder.CSIDL_HISTORY:
          return '/AppData/Local/Microsoft/Windows/History';
        case ShellSpecialFolder.CSIDL_INTERNET_CACHE:
          return '/AppData/Local/Microsoft/Windows/INetCache';
        default:
          return null;
      }
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  // SHBrowseForFolder - Browse for folder dialog
  public SHBrowseForFolder(lpbi: BROWSEINFO): string | null {
    try {
      // Use HTML5 directory picker if available
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = false;

      return new Promise<string | null>(resolve => {
        input.onchange = e => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            // Extract directory path from first file
            const path = files[0].webkitRelativePath || files[0].name;
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            resolve(dirPath || '/');
          } else {
            resolve(null);
          }
        };

        input.oncancel = () => resolve(null);
        input.click();
      });
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  // SHFileOperation - File operations
  public async SHFileOperation(lpFileOp: SHFILEOPSTRUCT): Promise<number> {
    try {
      // Limited file operations in browser
      switch (lpFileOp.wFunc) {
        case FileOperationType.FO_DELETE:
          // Simulate delete by showing confirmation
          if (!(lpFileOp.fFlags & FileOperationFlags.FOF_NOCONFIRMATION)) {
            const confirmed = confirm(`Delete ${lpFileOp.pFrom}?`);
            if (!confirmed) {
              lpFileOp.fAnyOperationsAborted = true;
              return 1; // User cancelled
            }
          }

          this.emit('fileOperation', { type: 'delete', files: lpFileOp.pFrom });
          return 0; // Success

        case FileOperationType.FO_COPY:
        case FileOperationType.FO_MOVE:
        case FileOperationType.FO_RENAME:
          // These operations cannot be performed in browser
          console.warn(
            `File operation ${FileOperationType[lpFileOp.wFunc]} not supported in browser`
          );
          return ShellExecuteError.SE_ERR_ACCESSDENIED;

        default:
          return ShellExecuteError.SE_ERR_NOASSOC;
      }
    } catch (error) {
      this.emit('error', error);
      return ShellExecuteError.SE_ERR_ACCESSDENIED;
    }
  }

  // SHGetFileInfo - Get file information
  public SHGetFileInfo(
    pszPath: string,
    dwFileAttributes: number,
    uFlags: number
  ): SHFILEINFO | null {
    try {
      const extension = pszPath.substring(pszPath.lastIndexOf('.') + 1).toLowerCase();
      const filename = pszPath.substring(pszPath.lastIndexOf('/') + 1);

      // Map common file extensions to types
      const typeMap: { [key: string]: string } = {
        txt: 'Text Document',
        doc: 'Microsoft Word Document',
        docx: 'Microsoft Word Document',
        xls: 'Microsoft Excel Spreadsheet',
        xlsx: 'Microsoft Excel Spreadsheet',
        pdf: 'PDF Document',
        jpg: 'JPEG Image',
        jpeg: 'JPEG Image',
        png: 'PNG Image',
        gif: 'GIF Image',
        exe: 'Application',
        dll: 'Dynamic Link Library',
        zip: 'Compressed Folder',
        mp3: 'MP3 Audio File',
        mp4: 'MP4 Video File',
        html: 'HTML Document',
        js: 'JavaScript File',
        ts: 'TypeScript File',
        css: 'Cascading Style Sheet',
      };

      return {
        hIcon: 0, // Icon handle not available in browser
        iIcon: 0,
        dwAttributes: 0,
        szDisplayName: filename,
        szTypeName: typeMap[extension] || `${extension.toUpperCase()} File`,
      };
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  // Shell_NotifyIcon - System tray icon operations
  public Shell_NotifyIcon(dwMessage: number, lpData: NOTIFYICONDATA): boolean {
    try {
      switch (dwMessage) {
        case 0: // NIM_ADD
          this.trayIcons.set(lpData.uID, { ...lpData });
          this.emit('trayIconAdded', lpData);

          // Create notification if info provided
          if (lpData.szInfo && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(lpData.szInfoTitle || 'Notification', {
                  body: lpData.szInfo,
                  icon: '/favicon.ico', // Default icon
                });
              }
            });
          }
          return true;

        case 1: {
          // NIM_MODIFY
          const existing = this.trayIcons.get(lpData.uID);
          if (existing) {
            this.trayIcons.set(lpData.uID, { ...existing, ...lpData });
            this.emit('trayIconModified', lpData);
            return true;
          }
          return false;
        }

        case 2: {
          // NIM_DELETE
          const deleted = this.trayIcons.delete(lpData.uID);
          if (deleted) {
            this.emit('trayIconDeleted', lpData.uID);
          }
          return deleted;
        }

        default:
          return false;
      }
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  // CreateShellLink - Create shell link
  public CreateShellLink(): IShellLink {
    return new ShellLink();
  }

  // GetShellApplication - Get shell application interface
  public GetShellApplication(): IShellApplication {
    return {
      Windows: (): any[] => {
        // Return open windows (limited in browser)
        return [];
      },

      Open: (directory: string): void => {
        this.ShellExecute(0, 'open', directory, null, null, ShellExecuteShow.SW_SHOWNORMAL);
      },

      Explore(directory: string): void {
        self.ShellExecute(0, 'explore', directory, null, null, ShellExecuteShow.SW_SHOWNORMAL);
      },

      MinimizeAll(): void {
        self.emit('minimizeAll');
      },

      UndoMinimizeAll(): void {
        self.emit('undoMinimizeAll');
      },

      FileRun(): void {
        self.emit('fileRun');
      },

      CascadeWindows(): void {
        self.emit('cascadeWindows');
      },

      TileVertically(): void {
        self.emit('tileVertically');
      },

      TileHorizontally(): void {
        self.emit('tileHorizontally');
      },

      ShutdownWindows(): void {
        if (confirm('Simulate Windows shutdown?')) {
          self.emit('shutdownWindows');
        }
      },

      FindFiles(): void {
        self.emit('findFiles');
      },

      FindComputer(): void {
        self.emit('findComputer');
      },

      SetTime(): void {
        self.emit('setTime');
      },

      ControlPanelItem(item: string): void {
        self.emit('controlPanelItem', item);
      },
    };
  }

  // ExtractIcon - Extract icon from file
  public ExtractIcon(hInst: number, lpszFile: string, nIconIndex: number): number {
    // Icons cannot be extracted in browser
    return 0;
  }

  // FindExecutable - Find executable for file
  public FindExecutable(lpFile: string, lpDirectory: string | null): string | null {
    const extension = lpFile.substring(lpFile.lastIndexOf('.') + 1).toLowerCase();

    // Map common file extensions to applications
    const appMap: { [key: string]: string } = {
      txt: 'notepad.exe',
      doc: 'winword.exe',
      docx: 'winword.exe',
      xls: 'excel.exe',
      xlsx: 'excel.exe',
      pdf: 'AcroRd32.exe',
      html: 'iexplore.exe',
      htm: 'iexplore.exe',
      jpg: 'mspaint.exe',
      jpeg: 'mspaint.exe',
      png: 'mspaint.exe',
      gif: 'mspaint.exe',
      bmp: 'mspaint.exe',
    };

    return appMap[extension] || null;
  }

  // GetOpenFileName - File open dialog
  public async GetOpenFileName(filter?: string, defaultExt?: string): Promise<string | null> {
    const input = document.createElement('input');
    input.type = 'file';

    if (filter) {
      // Convert VB6 filter format to HTML accept attribute
      const extensions = filter.match(/\*\.(\w+)/g);
      if (extensions) {
        input.accept = extensions.map(ext => ext.replace('*', '')).join(',');
      }
    }

    return new Promise<string | null>(resolve => {
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        resolve(file ? file.name : null);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  // GetSaveFileName - File save dialog
  public async GetSaveFileName(
    defaultName?: string,
    filter?: string,
    defaultExt?: string
  ): Promise<string | null> {
    // Use prompt as fallback
    const filename = prompt('Save as:', defaultName || 'untitled' + (defaultExt || '.txt'));
    return filename;
  }

  // DragAcceptFiles - Enable drag and drop
  public DragAcceptFiles(hwnd: number, fAccept: boolean): void {
    this.emit('dragAcceptFiles', { hwnd, accept: fAccept });
  }

  // DragQueryFile - Query dropped files
  public DragQueryFile(hDrop: number, iFile: number): string[] {
    // This would be implemented with HTML5 drag and drop
    return [];
  }
}

// VB6-compatible Shell functions
export class Shell {
  private static api = ShellAPI.getInstance();

  // Execute a program or document
  public static Execute(
    path: string,
    parameters?: string,
    directory?: string,
    operation?: string,
    show?: ShellExecuteShow
  ): number {
    return this.api.ShellExecute(
      0,
      operation || null,
      path,
      parameters || null,
      directory || null,
      show || ShellExecuteShow.SW_SHOWNORMAL
    );
  }

  // Open a URL
  public static OpenURL(url: string): void {
    this.Execute(url);
  }

  // Get special folder path
  public static GetSpecialFolder(folder: ShellSpecialFolder): string {
    return this.api.SHGetSpecialFolderPath(0, folder) || '';
  }

  // Browse for folder
  public static async BrowseForFolder(
    title?: string,
    root?: ShellSpecialFolder
  ): Promise<string | null> {
    const browseInfo: BROWSEINFO = {
      hwndOwner: 0,
      pidlRoot: root || 0,
      pszDisplayName: '',
      lpszTitle: title || 'Select a folder',
      ulFlags: BrowseInfoFlags.BIF_RETURNONLYFSDIRS | BrowseInfoFlags.BIF_NEWDIALOGSTYLE,
      lpfn: null,
      lParam: 0,
      iImage: 0,
    };

    return await this.api.SHBrowseForFolder(browseInfo);
  }

  // Create shortcut
  public static CreateShortcut(
    targetPath: string,
    shortcutPath: string,
    description?: string,
    workingDir?: string,
    args?: string
  ): void {
    const link = this.api.CreateShellLink();
    link.SetPath(targetPath);
    if (description) link.SetDescription(description);
    if (workingDir) link.SetWorkingDirectory(workingDir);
    if (args) link.SetArguments(args);
    link.Save(shortcutPath);
  }

  // Show notification
  public static ShowNotification(title: string, message: string, timeout?: number): boolean {
    const iconData: NOTIFYICONDATA = {
      cbSize: 0,
      hWnd: 0,
      uID: Date.now(),
      uFlags: 0,
      uCallbackMessage: 0,
      hIcon: 0,
      szTip: title,
      dwState: 0,
      dwStateMask: 0,
      szInfo: message,
      uTimeout: timeout || 5000,
      szInfoTitle: title,
      dwInfoFlags: 0,
    };

    return this.api.Shell_NotifyIcon(0, iconData);
  }

  // Get file type
  public static GetFileType(filename: string): string {
    const info = this.api.SHGetFileInfo(filename, 0, 0);
    return info?.szTypeName || 'Unknown';
  }

  // Find associated program
  public static FindAssociatedProgram(filename: string): string | null {
    return this.api.FindExecutable(filename, null);
  }
}

export default ShellAPI;
