/**
 * VB6 File System Functions
 * Browser-compatible implementation using virtual file system (localStorage)
 *
 * Note: This is a simulation of VB6 file operations for browser environment.
 * Real file system access would require File System Access API or Node.js.
 */

/**
 * File Access Mode
 */
export enum FileAccessMode {
  Input = 1, // Read only
  Output = 2, // Write (create/overwrite)
  Random = 4, // Random access
  Append = 8, // Append to file
  Binary = 32, // Binary access
}

/**
 * File Lock Type
 */
export enum FileLockType {
  LockReadWrite = 0,
  LockRead = 1,
  LockWrite = 2,
  Shared = 3,
}

/**
 * Virtual File Handle
 */
interface FileHandle {
  fileNumber: number;
  path: string;
  mode: FileAccessMode;
  content: string;
  position: number;
  isOpen: boolean;
}

/**
 * Virtual File System (using localStorage)
 */
class VirtualFileSystem {
  private static readonly PREFIX = 'VB6_VFS_';
  private openFiles: Map<number, FileHandle> = new Map();
  private nextFileNumber: number = 1;

  /**
   * Get full storage key for file path
   */
  private getStorageKey(path: string): string {
    return VirtualFileSystem.PREFIX + path;
  }

  /**
   * Check if file exists
   */
  fileExists(path: string): boolean {
    const key = this.getStorageKey(path);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Read file content
   */
  readFile(path: string): string | null {
    const key = this.getStorageKey(path);
    return localStorage.getItem(key);
  }

  /**
   * Write file content
   */
  writeFile(path: string, content: string): void {
    const key = this.getStorageKey(path);
    localStorage.setItem(key, content);
  }

  /**
   * Delete file
   */
  deleteFile(path: string): void {
    const key = this.getStorageKey(path);
    localStorage.removeItem(key);
  }

  /**
   * List all files
   */
  listFiles(): string[] {
    const files: string[] = [];
    const prefixLen = VirtualFileSystem.PREFIX.length;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VirtualFileSystem.PREFIX)) {
        files.push(key.substring(prefixLen));
      }
    }

    return files;
  }

  /**
   * Get free file number
   */
  getFreeFile(): number {
    while (this.openFiles.has(this.nextFileNumber)) {
      this.nextFileNumber++;
    }
    return this.nextFileNumber;
  }

  /**
   * Open a file
   */
  openFile(fileNumber: number, path: string, mode: FileAccessMode): void {
    if (this.openFiles.has(fileNumber)) {
      throw new Error(`File number ${fileNumber} already in use`);
    }

    let content = '';

    if (
      mode === FileAccessMode.Input ||
      mode === FileAccessMode.Append ||
      mode === FileAccessMode.Random
    ) {
      const existingContent = this.readFile(path);
      if (existingContent === null && mode === FileAccessMode.Input) {
        throw new Error(`File not found: ${path}`);
      }
      content = existingContent || '';
    }

    const handle: FileHandle = {
      fileNumber,
      path,
      mode,
      content,
      position: mode === FileAccessMode.Append ? content.length : 0,
      isOpen: true,
    };

    this.openFiles.set(fileNumber, handle);
  }

  /**
   * Close a file
   */
  closeFile(fileNumber: number): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    // Write content back to storage if not input mode
    if (handle.mode !== FileAccessMode.Input) {
      this.writeFile(handle.path, handle.content);
    }

    handle.isOpen = false;
    this.openFiles.delete(fileNumber);
  }

  /**
   * Close all open files
   */
  closeAllFiles(): void {
    const fileNumbers = Array.from(this.openFiles.keys());
    fileNumbers.forEach(fn => this.closeFile(fn));
  }

  /**
   * Get file handle
   */
  getHandle(fileNumber: number): FileHandle {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }
    return handle;
  }

  /**
   * Read line from file
   */
  readLine(fileNumber: number): string {
    const handle = this.getHandle(fileNumber);
    if (handle.mode !== FileAccessMode.Input) {
      throw new Error('File not opened for input');
    }

    const remaining = handle.content.substring(handle.position);
    const newlineIndex = remaining.indexOf('\n');

    let line: string;
    if (newlineIndex === -1) {
      line = remaining;
      handle.position = handle.content.length;
    } else {
      line = remaining.substring(0, newlineIndex);
      handle.position += newlineIndex + 1;
    }

    return line.replace(/\r$/, ''); // Remove trailing CR
  }

  /**
   * Read all remaining content
   */
  readAll(fileNumber: number): string {
    const handle = this.getHandle(fileNumber);
    if (handle.mode !== FileAccessMode.Input) {
      throw new Error('File not opened for input');
    }

    const content = handle.content.substring(handle.position);
    handle.position = handle.content.length;
    return content;
  }

  /**
   * Write to file
   */
  write(fileNumber: number, data: string): void {
    const handle = this.getHandle(fileNumber);
    if (handle.mode === FileAccessMode.Input) {
      throw new Error('File not opened for output');
    }

    if (handle.mode === FileAccessMode.Append || handle.position >= handle.content.length) {
      handle.content += data;
      handle.position = handle.content.length;
    } else {
      // Overwrite at current position
      handle.content =
        handle.content.substring(0, handle.position) +
        data +
        handle.content.substring(handle.position + data.length);
      handle.position += data.length;
    }
  }

  /**
   * Check if at end of file
   */
  isEOF(fileNumber: number): boolean {
    const handle = this.getHandle(fileNumber);
    return handle.position >= handle.content.length;
  }

  /**
   * Get file length
   */
  getLength(fileNumber: number): number {
    const handle = this.getHandle(fileNumber);
    return handle.content.length;
  }

  /**
   * Seek to position
   */
  seek(fileNumber: number, position: number): void {
    const handle = this.getHandle(fileNumber);
    handle.position = Math.max(0, Math.min(position, handle.content.length));
  }

  /**
   * Get current position
   */
  getPosition(fileNumber: number): number {
    const handle = this.getHandle(fileNumber);
    return handle.position;
  }
}

/**
 * Global virtual file system instance
 */
const vfs = new VirtualFileSystem();

/**
 * VB6 File System Functions
 */
export const FileSystemFunctions = {
  /**
   * Open - Open a file
   * Open pathname For mode [Access access] [lock] As [#]filenumber
   */
  Open: (pathname: string, mode: FileAccessMode, fileNumber: number): void => {
    vfs.openFile(fileNumber, pathname, mode);
  },

  /**
   * Close - Close file(s)
   */
  Close: (...fileNumbers: number[]): void => {
    if (fileNumbers.length === 0) {
      vfs.closeAllFiles();
    } else {
      fileNumbers.forEach(fn => vfs.closeFile(fn));
    }
  },

  /**
   * FreeFile - Get next available file number
   */
  FreeFile: (): number => {
    return vfs.getFreeFile();
  },

  /**
   * Input # - Read data from file
   */
  Input: (fileNumber: number, numChars?: number): string => {
    if (numChars !== undefined) {
      const handle = vfs.getHandle(fileNumber);
      const data = handle.content.substring(handle.position, handle.position + numChars);
      handle.position += data.length;
      return data;
    }
    return vfs.readLine(fileNumber);
  },

  /**
   * Line Input # - Read a line from file
   */
  LineInput: (fileNumber: number): string => {
    return vfs.readLine(fileNumber);
  },

  /**
   * Print # - Write formatted data to file
   */
  Print: (fileNumber: number, ...args: any[]): void => {
    const data = args.join('\t') + '\n';
    vfs.write(fileNumber, data);
  },

  /**
   * Write # - Write data to file
   */
  Write: (fileNumber: number, ...args: any[]): void => {
    const data =
      args
        .map(arg => {
          if (typeof arg === 'string') {
            return `"${arg}"`;
          }
          return String(arg);
        })
        .join(',') + '\n';
    vfs.write(fileNumber, data);
  },

  /**
   * EOF - Check if at end of file
   */
  EOF: (fileNumber: number): boolean => {
    return vfs.isEOF(fileNumber);
  },

  /**
   * LOF - Get length of file
   */
  LOF: (fileNumber: number): number => {
    return vfs.getLength(fileNumber);
  },

  /**
   * Seek - Set/Get file position
   */
  Seek: (fileNumber: number, position?: number): number | void => {
    if (position !== undefined) {
      vfs.seek(fileNumber, position - 1); // VB6 is 1-based
    } else {
      return vfs.getPosition(fileNumber) + 1; // VB6 is 1-based
    }
  },

  /**
   * FileLen - Get length of file on disk
   */
  FileLen: (pathname: string): number => {
    const content = vfs.readFile(pathname);
    return content ? content.length : 0;
  },

  /**
   * Dir - List files (simplified)
   */
  Dir: (pathname?: string, attributes?: number): string => {
    const files = vfs.listFiles();
    if (pathname) {
      // Simple pattern matching (not full regex)
      const pattern = pathname.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(pattern, 'i');
      const matches = files.filter(f => regex.test(f));
      return matches[0] || '';
    }
    return files[0] || '';
  },

  /**
   * Kill - Delete a file
   */
  Kill: (pathname: string): void => {
    vfs.deleteFile(pathname);
  },

  /**
   * FileCopy - Copy a file
   */
  FileCopy: (source: string, destination: string): void => {
    const content = vfs.readFile(source);
    if (content === null) {
      throw new Error(`File not found: ${source}`);
    }
    vfs.writeFile(destination, content);
  },

  /**
   * Name (rename) - Rename a file
   */
  Name: (oldPath: string, newPath: string): void => {
    const content = vfs.readFile(oldPath);
    if (content === null) {
      throw new Error(`File not found: ${oldPath}`);
    }
    vfs.writeFile(newPath, content);
    vfs.deleteFile(oldPath);
  },

  /**
   * FileExists - Check if file exists
   */
  FileExists: (pathname: string): boolean => {
    return vfs.fileExists(pathname);
  },

  /**
   * GetAttr - Get file attributes (simplified)
   */
  GetAttr: (pathname: string): number => {
    return vfs.fileExists(pathname) ? 0 : -1;
  },

  /**
   * FileDateTime - Get file date/time (current date for virtual files)
   */
  FileDateTime: (pathname: string): Date => {
    if (!vfs.fileExists(pathname)) {
      throw new Error(`File not found: ${pathname}`);
    }
    return new Date();
  },

  /**
   * Input function - Read entire file
   */
  InputFunction: (number: number, fileNumber: number): string => {
    const handle = vfs.getHandle(fileNumber);
    const data = handle.content.substring(handle.position, handle.position + number);
    handle.position += data.length;
    return data;
  },
};

/**
 * File Access Mode constants for VB6 compatibility
 */
export const FileConstants = {
  // Access modes
  ForInput: FileAccessMode.Input,
  ForOutput: FileAccessMode.Output,
  ForRandom: FileAccessMode.Random,
  ForAppend: FileAccessMode.Append,
  ForBinary: FileAccessMode.Binary,
};

export default {
  FileSystemFunctions,
  FileConstants,
  FileAccessMode,
  FileLockType,
};
