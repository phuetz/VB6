/**
 * File System API - Complete VB6 File System Implementation
 * Provides comprehensive file and directory operations
 */

// File System Constants
export enum FILE_ATTRIBUTE {
  FILE_ATTRIBUTE_READONLY = 0x00000001,
  FILE_ATTRIBUTE_HIDDEN = 0x00000002,
  FILE_ATTRIBUTE_SYSTEM = 0x00000004,
  FILE_ATTRIBUTE_DIRECTORY = 0x00000010,
  FILE_ATTRIBUTE_ARCHIVE = 0x00000020,
  FILE_ATTRIBUTE_DEVICE = 0x00000040,
  FILE_ATTRIBUTE_NORMAL = 0x00000080,
  FILE_ATTRIBUTE_TEMPORARY = 0x00000100,
  FILE_ATTRIBUTE_SPARSE_FILE = 0x00000200,
  FILE_ATTRIBUTE_REPARSE_POINT = 0x00000400,
  FILE_ATTRIBUTE_COMPRESSED = 0x00000800,
  FILE_ATTRIBUTE_OFFLINE = 0x00001000,
  FILE_ATTRIBUTE_NOT_CONTENT_INDEXED = 0x00002000,
  FILE_ATTRIBUTE_ENCRYPTED = 0x00004000
}

export enum DRIVE_TYPE {
  DRIVE_UNKNOWN = 0,
  DRIVE_NO_ROOT_DIR = 1,
  DRIVE_REMOVABLE = 2,
  DRIVE_FIXED = 3,
  DRIVE_REMOTE = 4,
  DRIVE_CDROM = 5,
  DRIVE_RAMDISK = 6
}

export interface WIN32_FIND_DATA {
  dwFileAttributes: number;
  ftCreationTime: Date;
  ftLastAccessTime: Date;
  ftLastWriteTime: Date;
  nFileSizeHigh: number;
  nFileSizeLow: number;
  dwReserved0: number;
  dwReserved1: number;
  cFileName: string;
  cAlternateFileName: string;
}

export interface DISK_SPACE_INFO {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  totalKB: number;
  freeKB: number;
  usedKB: number;
}

// Browser-based File System Simulation
class FileSystemAPI {
  private static readonly PREFIX = 'VB6_FILESYSTEM_';
  private static readonly FILE_DATA = 'FILE_DATA_';
  private static readonly DIR_DATA = 'DIR_DATA_';
  
  // Simulated file system using localStorage
  private static simulatedFileSystem: Map<string, any> = new Map();
  private static nextHandle = 1;

  // SECURITY FIX: Safe JSON parser to prevent prototype pollution
  private static safeJSONParse(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check for prototype pollution attempts
      if (parsed && typeof parsed === 'object') {
        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        
        const checkObject = (obj: any, path = ''): void => {
          if (obj && typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
              if (dangerousKeys.includes(key)) {
                throw new Error(`Dangerous key "${key}" found at ${path || 'root'} - potential prototype pollution attack`);
              }
              if (typeof value === 'object' && value !== null) {
                checkObject(value, path ? `${path}.${key}` : key);
              }
            }
          }
        };
        
        checkObject(parsed);
        
        // Create clean object without prototype chain for objects
        if (Array.isArray(parsed)) {
          return parsed.map(item => 
            typeof item === 'object' && item !== null 
              ? Object.create(null, Object.getOwnPropertyDescriptors(item))
              : item
          );
        } else {
          return Object.create(null, Object.getOwnPropertyDescriptors(parsed));
        }
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`Safe JSON parsing failed: ${error.message}`);
    }
  }
  
  static initialize(): void {
    // Load simulated file system from localStorage
    try {
      const data = localStorage.getItem(FileSystemAPI.PREFIX + 'FILESYSTEM');
      if (data) {
        FileSystemAPI.simulatedFileSystem = new Map(FileSystemAPI.safeJSONParse(data));
      }
    } catch {
      FileSystemAPI.simulatedFileSystem = new Map();
    }
    
    // Initialize default directories
    FileSystemAPI.createDefaultDirectories();
  }
  
  private static createDefaultDirectories(): void {
    const defaultDirs = [
      '/Windows',
      '/Windows/System32',
      '/Program Files',
      '/Documents',
      '/Desktop',
      '/Temp',
      '/AppData',
      '/AppData/Local',
      '/AppData/Roaming'
    ];
    
    defaultDirs.forEach(dir => {
      if (!FileSystemAPI.simulatedFileSystem.has(dir)) {
        FileSystemAPI.simulatedFileSystem.set(dir, {
          type: 'directory',
          attributes: FILE_ATTRIBUTE.FILE_ATTRIBUTE_DIRECTORY,
          created: new Date(),
          modified: new Date(),
          accessed: new Date(),
          size: 0
        });
      }
    });
    
    FileSystemAPI.saveFileSystem();
  }
  
  private static saveFileSystem(): void {
    try {
      localStorage.setItem(
        FileSystemAPI.PREFIX + 'FILESYSTEM',
        JSON.stringify(Array.from(FileSystemAPI.simulatedFileSystem.entries()))
      );
    } catch {
      // Handle storage quota exceeded
    }
  }
  
  static GetFileAttributes(fileName: string): number {
    const normalized = FileSystemAPI.normalizePath(fileName);
    const fileInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
    
    if (!fileInfo) {
      return 0xFFFFFFFF; // INVALID_FILE_ATTRIBUTES
    }
    
    return fileInfo.attributes || FILE_ATTRIBUTE.FILE_ATTRIBUTE_NORMAL;
  }
  
  static SetFileAttributes(fileName: string, attributes: number): boolean {
    try {
      const normalized = FileSystemAPI.normalizePath(fileName);
      const fileInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
      
      if (!fileInfo) {
        return false;
      }
      
      fileInfo.attributes = attributes;
      FileSystemAPI.simulatedFileSystem.set(normalized, fileInfo);
      FileSystemAPI.saveFileSystem();
      return true;
    } catch {
      return false;
    }
  }
  
  static FileExists(fileName: string): boolean {
    const normalized = FileSystemAPI.normalizePath(fileName);
    const fileInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
    return fileInfo && fileInfo.type === 'file';
  }
  
  static DirectoryExists(dirName: string): boolean {
    const normalized = FileSystemAPI.normalizePath(dirName);
    const dirInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
    return dirInfo && dirInfo.type === 'directory';
  }
  
  static CreateDirectory(pathName: string): boolean {
    try {
      const normalized = FileSystemAPI.normalizePath(pathName);
      
      if (FileSystemAPI.simulatedFileSystem.has(normalized)) {
        return false; // Already exists
      }
      
      // Create parent directories if they don't exist
      const parts = normalized.split('/').filter(part => part);
      let currentPath = '';
      
      for (const part of parts) {
        currentPath += '/' + part;
        if (!FileSystemAPI.simulatedFileSystem.has(currentPath)) {
          FileSystemAPI.simulatedFileSystem.set(currentPath, {
            type: 'directory',
            attributes: FILE_ATTRIBUTE.FILE_ATTRIBUTE_DIRECTORY,
            created: new Date(),
            modified: new Date(),
            accessed: new Date(),
            size: 0
          });
        }
      }
      
      FileSystemAPI.saveFileSystem();
      return true;
    } catch {
      return false;
    }
  }
  
  static RemoveDirectory(pathName: string): boolean {
    try {
      const normalized = FileSystemAPI.normalizePath(pathName);
      
      if (!FileSystemAPI.DirectoryExists(normalized)) {
        return false;
      }
      
      // Check if directory is empty
      const children = Array.from(FileSystemAPI.simulatedFileSystem.keys())
        .filter(key => key.startsWith(normalized + '/'));
      
      if (children.length > 0) {
        return false; // Directory not empty
      }
      
      FileSystemAPI.simulatedFileSystem.delete(normalized);
      FileSystemAPI.saveFileSystem();
      return true;
    } catch {
      return false;
    }
  }
  
  static DeleteFile(fileName: string): boolean {
    try {
      const normalized = FileSystemAPI.normalizePath(fileName);
      
      if (!FileSystemAPI.FileExists(normalized)) {
        return false;
      }
      
      FileSystemAPI.simulatedFileSystem.delete(normalized);
      FileSystemAPI.saveFileSystem();
      return true;
    } catch {
      return false;
    }
  }
  
  static CopyFile(existingFileName: string, newFileName: string, failIfExists: boolean): boolean {
    try {
      const srcNormalized = FileSystemAPI.normalizePath(existingFileName);
      const destNormalized = FileSystemAPI.normalizePath(newFileName);
      
      const srcInfo = FileSystemAPI.simulatedFileSystem.get(srcNormalized);
      if (!srcInfo || srcInfo.type !== 'file') {
        return false; // Source doesn't exist
      }
      
      if (failIfExists && FileSystemAPI.FileExists(destNormalized)) {
        return false; // Destination exists and failIfExists is true
      }
      
      // Copy file info
      const newInfo = {
        ...srcInfo,
        created: new Date(),
        accessed: new Date()
      };
      
      FileSystemAPI.simulatedFileSystem.set(destNormalized, newInfo);
      FileSystemAPI.saveFileSystem();
      return true;
    } catch {
      return false;
    }
  }
  
  static MoveFile(existingFileName: string, newFileName: string): boolean {
    try {
      if (FileSystemAPI.CopyFile(existingFileName, newFileName, false)) {
        return FileSystemAPI.DeleteFile(existingFileName);
      }
      return false;
    } catch {
      return false;
    }
  }
  
  static GetFileSize(fileName: string): { sizeLow: number; sizeHigh: number } {
    const normalized = FileSystemAPI.normalizePath(fileName);
    const fileInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
    
    if (!fileInfo || fileInfo.type !== 'file') {
      return { sizeLow: 0xFFFFFFFF, sizeHigh: 0xFFFFFFFF }; // INVALID_FILE_SIZE
    }
    
    const size = fileInfo.size || 0;
    return {
      sizeLow: size & 0xFFFFFFFF,
      sizeHigh: Math.floor(size / 0x100000000)
    };
  }
  
  static GetFileTime(fileName: string): { created: Date; accessed: Date; modified: Date } | null {
    const normalized = FileSystemAPI.normalizePath(fileName);
    const fileInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
    
    if (!fileInfo) {
      return null;
    }
    
    return {
      created: new Date(fileInfo.created),
      accessed: new Date(fileInfo.accessed),
      modified: new Date(fileInfo.modified)
    };
  }
  
  static SetFileTime(fileName: string, created?: Date, accessed?: Date, modified?: Date): boolean {
    try {
      const normalized = FileSystemAPI.normalizePath(fileName);
      const fileInfo = FileSystemAPI.simulatedFileSystem.get(normalized);
      
      if (!fileInfo) {
        return false;
      }
      
      if (created) fileInfo.created = created;
      if (accessed) fileInfo.accessed = accessed;
      if (modified) fileInfo.modified = modified;
      
      FileSystemAPI.simulatedFileSystem.set(normalized, fileInfo);
      FileSystemAPI.saveFileSystem();
      return true;
    } catch {
      return false;
    }
  }
  
  static FindFirstFile(fileName: string): { handle: number; findData: WIN32_FIND_DATA | null } {
    try {
      const normalized = FileSystemAPI.normalizePath(fileName);
      const pattern = normalized.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp('^' + pattern + '$');
      
      const basePath = normalized.substring(0, normalized.lastIndexOf('/'));
      const matches = Array.from(FileSystemAPI.simulatedFileSystem.keys())
        .filter(key => {
          const keyBasePath = key.substring(0, key.lastIndexOf('/'));
          return keyBasePath === basePath && regex.test(key);
        });
      
      if (matches.length === 0) {
        return { handle: -1, findData: null }; // INVALID_HANDLE_VALUE
      }
      
      const firstMatch = matches[0];
      const fileInfo = FileSystemAPI.simulatedFileSystem.get(firstMatch);
      const fileName = firstMatch.substring(firstMatch.lastIndexOf('/') + 1);
      
      const findData: WIN32_FIND_DATA = {
        dwFileAttributes: fileInfo.attributes,
        ftCreationTime: new Date(fileInfo.created),
        ftLastAccessTime: new Date(fileInfo.accessed),
        ftLastWriteTime: new Date(fileInfo.modified),
        nFileSizeHigh: 0,
        nFileSizeLow: fileInfo.size || 0,
        dwReserved0: 0,
        dwReserved1: 0,
        cFileName: fileName,
        cAlternateFileName: fileName.length > 8 ? fileName.substring(0, 8) : fileName
      };
      
      // Store search state for FindNextFile
      const handle = FileSystemAPI.nextHandle++;
      if (FileSystemAPI.nextHandle > 1000000) {
        FileSystemAPI.nextHandle = 1; // Wrap around
      }
      localStorage.setItem(`VB6_SEARCH_${handle}`, JSON.stringify({
        matches,
        currentIndex: 0,
        pattern: normalized
      }));
      
      return { handle, findData };
    } catch {
      return { handle: -1, findData: null };
    }
  }
  
  static FindNextFile(handle: number): WIN32_FIND_DATA | null {
    try {
      const searchState = FileSystemAPI.safeJSONParse(localStorage.getItem(`VB6_SEARCH_${handle}`) || '{}');
      
      if (!searchState.matches || searchState.currentIndex >= searchState.matches.length - 1) {
        return null; // No more files
      }
      
      searchState.currentIndex++;
      const nextMatch = searchState.matches[searchState.currentIndex];
      const fileInfo = FileSystemAPI.simulatedFileSystem.get(nextMatch);
      const fileName = nextMatch.substring(nextMatch.lastIndexOf('/') + 1);
      
      localStorage.setItem(`VB6_SEARCH_${handle}`, JSON.stringify(searchState));
      
      return {
        dwFileAttributes: fileInfo.attributes,
        ftCreationTime: new Date(fileInfo.created),
        ftLastAccessTime: new Date(fileInfo.accessed),
        ftLastWriteTime: new Date(fileInfo.modified),
        nFileSizeHigh: 0,
        nFileSizeLow: fileInfo.size || 0,
        dwReserved0: 0,
        dwReserved1: 0,
        cFileName: fileName,
        cAlternateFileName: fileName.length > 8 ? fileName.substring(0, 8) : fileName
      };
    } catch {
      return null;
    }
  }
  
  static FindClose(handle: number): boolean {
    try {
      localStorage.removeItem(`VB6_SEARCH_${handle}`);
      return true;
    } catch {
      return false;
    }
  }
  
  static GetDriveType(rootPathName: string): DRIVE_TYPE {
    // Simulate drive types in browser environment
    const normalized = FileSystemAPI.normalizePath(rootPathName);
    
    if (normalized.startsWith('/C:') || normalized.startsWith('/c:')) {
      return DRIVE_TYPE.DRIVE_FIXED;
    } else if (normalized.startsWith('/A:') || normalized.startsWith('/a:') || 
               normalized.startsWith('/B:') || normalized.startsWith('/b:')) {
      return DRIVE_TYPE.DRIVE_REMOVABLE;
    } else if (normalized.startsWith('/D:') || normalized.startsWith('/d:')) {
      return DRIVE_TYPE.DRIVE_CDROM;
    } else {
      return DRIVE_TYPE.DRIVE_UNKNOWN;
    }
  }
  
  static GetDiskFreeSpace(rootPathName: string): DISK_SPACE_INFO | null {
    try {
      // Simulate disk space information
      const totalBytes = 1024 * 1024 * 1024 * 100; // 100 GB
      const usedBytes = FileSystemAPI.calculateUsedSpace();
      const freeBytes = totalBytes - usedBytes;
      
      return {
        totalBytes,
        freeBytes,
        usedBytes,
        totalKB: Math.floor(totalBytes / 1024),
        freeKB: Math.floor(freeBytes / 1024),
        usedKB: Math.floor(usedBytes / 1024)
      };
    } catch {
      return null;
    }
  }
  
  private static calculateUsedSpace(): number {
    // Calculate approximate used space based on stored data
    let totalSize = 0;
    FileSystemAPI.simulatedFileSystem.forEach(fileInfo => {
      if (fileInfo.type === 'file') {
        totalSize += fileInfo.size || 0;
      }
    });
    return totalSize;
  }
  
  static GetLogicalDrives(): string[] {
    // Return simulated logical drives
    return ['C:', 'D:'];
  }
  
  static GetVolumeInformation(rootPathName: string): {
    volumeName: string;
    serialNumber: number;
    maxComponentLength: number;
    systemFlags: number;
    fileSystemName: string;
  } | null {
    try {
      return {
        volumeName: 'VB6_VIRTUAL_DRIVE',
        serialNumber: 0x12345678,
        maxComponentLength: 255,
        systemFlags: 0x00020000, // FILE_SUPPORTS_LONG_NAMES
        fileSystemName: 'VIRTUAL'
      };
    } catch {
      return null;
    }
  }
  
  static GetCurrentDirectory(): string {
    return localStorage.getItem('VB6_CURRENT_DIR') || '/';
  }
  
  static SetCurrentDirectory(pathName: string): boolean {
    try {
      const normalized = FileSystemAPI.normalizePath(pathName);
      
      if (!FileSystemAPI.DirectoryExists(normalized)) {
        return false;
      }
      
      localStorage.setItem('VB6_CURRENT_DIR', normalized);
      return true;
    } catch {
      return false;
    }
  }
  
  static GetTempPath(): string {
    return '/Temp/';
  }
  
  static GetTempFileName(pathName: string, prefixString: string, unique: number): string {
    const timestamp = Date.now();
    const random = FileSystemAPI.nextHandle++ % 1000;
    const uniqueId = unique || timestamp;
    return `${pathName}${pathName.endsWith('/') ? '' : '/'}${prefixString}${uniqueId}_${random}.tmp`;
  }
  
  private static normalizePath(path: string): string {
    // Normalize path separators and remove duplicate slashes
    return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }
  
  // VB6-compatible helper functions
  static Dir(pathname?: string, attributes?: number): string {
    // VB6 Dir function equivalent
    if (pathname) {
      // Start new search
      const result = FileSystemAPI.FindFirstFile(pathname);
      if (result.handle !== -1 && result.findData) {
        localStorage.setItem('VB6_DIR_HANDLE', result.handle.toString());
        return result.findData.cFileName;
      }
      return '';
    } else {
      // Continue search
      const handle = parseInt(localStorage.getItem('VB6_DIR_HANDLE') || '-1', 10);
      if (handle !== -1) {
        const findData = FileSystemAPI.FindNextFile(handle);
        if (findData) {
          return findData.cFileName;
        } else {
          FileSystemAPI.FindClose(handle);
          localStorage.removeItem('VB6_DIR_HANDLE');
        }
      }
      return '';
    }
  }
  
  static Kill(pathname: string): boolean {
    // VB6 Kill statement equivalent
    return FileSystemAPI.DeleteFile(pathname);
  }
  
  static MkDir(path: string): boolean {
    // VB6 MkDir statement equivalent
    return FileSystemAPI.CreateDirectory(path);
  }
  
  static RmDir(path: string): boolean {
    // VB6 RmDir statement equivalent
    return FileSystemAPI.RemoveDirectory(path);
  }
  
  static ChDir(path: string): boolean {
    // VB6 ChDir statement equivalent
    return FileSystemAPI.SetCurrentDirectory(path);
  }
  
  static CurDir(drive?: string): string {
    // VB6 CurDir function equivalent
    return FileSystemAPI.GetCurrentDirectory();
  }
}

// Initialize the file system on module load
FileSystemAPI.initialize();

export { FileSystemAPI };
export default FileSystemAPI;