/**
 * VB6 File Functions Implementation
 * 
 * Web-compatible implementation of VB6 file I/O functions
 * Note: Many functions are simulated due to browser security restrictions
 */

import { errorHandler } from './VB6ErrorHandling';

// File modes
export enum VB6FileMode {
  Input = 1,
  Output = 2,
  Random = 3,
  Append = 4,
  Binary = 5
}

// File access types
export enum VB6FileAccess {
  Read = 1,
  Write = 2,
  ReadWrite = 3
}

// File share modes
export enum VB6FileShare {
  Default = 0,
  LockReadWrite = 1,
  LockWrite = 2,
  LockRead = 3,
  Shared = 4
}

interface VB6FileHandle {
  fileNumber: number;
  mode: VB6FileMode;
  fileName: string;
  content: string;
  position: number;
  recordLength: number;
  isOpen: boolean;
  access: VB6FileAccess;
  share: VB6FileShare;
}

class VB6FileSystem {
  private static instance: VB6FileSystem;
  private openFiles: Map<number, VB6FileHandle> = new Map();
  private nextFileNumber = 1;
  private virtualFileSystem: Map<string, string> = new Map();

  static getInstance(): VB6FileSystem {
    if (!VB6FileSystem.instance) {
      VB6FileSystem.instance = new VB6FileSystem();
    }
    return VB6FileSystem.instance;
  }

  constructor() {
    // Initialize with some virtual files for demonstration
    this.virtualFileSystem.set('C:\\AUTOEXEC.BAT', '@echo off\npath=C:\\WINDOWS;C:\\WINDOWS\\SYSTEM');
    this.virtualFileSystem.set('C:\\CONFIG.SYS', 'FILES=30\nBUFFERS=15');
    this.virtualFileSystem.set('C:\\WINDOWS\\WIN.INI', '[Desktop]\nWallpaper=C:\\WINDOWS\\SETUP.BMP');
  }

  /**
   * Open file for I/O
   */
  openFile(
    fileName: string,
    mode: VB6FileMode,
    access: VB6FileAccess = VB6FileAccess.ReadWrite,
    share: VB6FileShare = VB6FileShare.Default,
    recordLength: number = 128
  ): number {
    const fileNumber = this.nextFileNumber++;
    
    // Check if file exists for input mode
    if (mode === VB6FileMode.Input && !this.virtualFileSystem.has(fileName)) {
      errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
      return 0;
    }

    // Get existing content or create new
    let content = '';
    if (mode === VB6FileMode.Input || mode === VB6FileMode.Append) {
      content = this.virtualFileSystem.get(fileName) || '';
    }

    const fileHandle: VB6FileHandle = {
      fileNumber,
      mode,
      fileName,
      content,
      position: mode === VB6FileMode.Append ? content.length : 0,
      recordLength,
      isOpen: true,
      access,
      share
    };

    this.openFiles.set(fileNumber, fileHandle);
    return fileNumber;
  }

  /**
   * Close file
   */
  closeFile(fileNumber: number): void {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return;
    }

    // Save content to virtual file system if it was modified
    if (fileHandle.mode === VB6FileMode.Output || 
        fileHandle.mode === VB6FileMode.Append || 
        fileHandle.mode === VB6FileMode.Random) {
      this.virtualFileSystem.set(fileHandle.fileName, fileHandle.content);
    }

    fileHandle.isOpen = false;
    this.openFiles.delete(fileNumber);
  }

  /**
   * Get next available file number
   */
  getFreeFileNumber(): number {
    return this.nextFileNumber;
  }

  /**
   * Check if end of file
   */
  isEOF(fileNumber: number): boolean {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return true;
    }

    return fileHandle.position >= fileHandle.content.length;
  }

  /**
   * Get file length
   */
  getFileLength(fileNumber: number): number {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return 0;
    }

    return fileHandle.content.length;
  }

  /**
   * Get current file position
   */
  getFilePosition(fileNumber: number): number {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return 0;
    }

    return fileHandle.position;
  }

  /**
   * Seek to position in file
   */
  seekFile(fileNumber: number, position: number): void {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return;
    }

    fileHandle.position = Math.max(0, Math.min(position, fileHandle.content.length));
  }

  /**
   * Read line from file
   */
  readLine(fileNumber: number): string {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return '';
    }

    if (fileHandle.mode !== VB6FileMode.Input) {
      errorHandler.raiseError(54, 'Bad file mode', 'VB6FileSystem');
      return '';
    }

    const startPos = fileHandle.position;
    const content = fileHandle.content;
    let endPos = content.indexOf('\n', startPos);
    
    if (endPos === -1) {
      endPos = content.length;
    }

    const line = content.substring(startPos, endPos);
    fileHandle.position = endPos + 1; // Move past the newline

    return line.replace(/\r$/, ''); // Remove carriage return if present
  }

  /**
   * Read characters from file
   */
  readChars(fileNumber: number, length: number): string {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return '';
    }

    const startPos = fileHandle.position;
    const endPos = Math.min(startPos + length, fileHandle.content.length);
    const data = fileHandle.content.substring(startPos, endPos);
    
    fileHandle.position = endPos;
    return data;
  }

  /**
   * Write to file
   */
  writeToFile(fileNumber: number, data: string): void {
    const fileHandle = this.openFiles.get(fileNumber);
    if (!fileHandle) {
      errorHandler.raiseError(52, 'Bad file name or number', 'VB6FileSystem');
      return;
    }

    if (fileHandle.mode === VB6FileMode.Input) {
      errorHandler.raiseError(54, 'Bad file mode', 'VB6FileSystem');
      return;
    }

    if (fileHandle.mode === VB6FileMode.Append) {
      fileHandle.content += data;
      fileHandle.position = fileHandle.content.length;
    } else {
      // Insert at current position
      const before = fileHandle.content.substring(0, fileHandle.position);
      const after = fileHandle.content.substring(fileHandle.position + data.length);
      fileHandle.content = before + data + after;
      fileHandle.position += data.length;
    }
  }

  /**
   * Write line to file
   */
  writeLine(fileNumber: number, data: string): void {
    this.writeToFile(fileNumber, data + '\r\n');
  }

  /**
   * Check if file exists in virtual file system
   */
  fileExists(fileName: string): boolean {
    return this.virtualFileSystem.has(fileName);
  }

  /**
   * Get directory listing (simulated)
   */
  getDirectoryListing(path: string, pattern: string = '*.*'): string[] {
    const files: string[] = [];
    
    // Simulate some common files
    if (path.toUpperCase().includes('C:\\WINDOWS')) {
      files.push('WIN.INI', 'SYSTEM.INI', 'NOTEPAD.EXE', 'CALC.EXE');
    } else if (path.toUpperCase().includes('C:\\')) {
      files.push('AUTOEXEC.BAT', 'CONFIG.SYS', 'WINDOWS', 'TEMP');
    }
    
    // Filter by pattern (simplified)
    if (pattern !== '*.*') {
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
      return files.filter(file => regex.test(file));
    }
    
    return files;
  }

  /**
   * Create directory (simulated)
   */
  createDirectory(path: string): void {
    // Simulate directory creation
    console.log(`Virtual directory created: ${path}`);
  }

  /**
   * Remove directory (simulated)
   */
  removeDirectory(path: string): void {
    // Simulate directory removal
    console.log(`Virtual directory removed: ${path}`);
  }

  /**
   * Delete file
   */
  deleteFile(fileName: string): void {
    if (this.virtualFileSystem.has(fileName)) {
      this.virtualFileSystem.delete(fileName);
    } else {
      errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
    }
  }

  /**
   * Copy file
   */
  copyFile(source: string, destination: string): void {
    const content = this.virtualFileSystem.get(source);
    if (content === undefined) {
      errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
      return;
    }
    
    this.virtualFileSystem.set(destination, content);
  }

  /**
   * Get file attributes (simulated)
   */
  getFileAttributes(fileName: string): number {
    if (this.virtualFileSystem.has(fileName)) {
      return 0; // Normal file
    }
    
    errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
    return 0;
  }

  /**
   * Set file attributes (simulated)
   */
  setFileAttributes(fileName: string, attributes: number): void {
    if (!this.virtualFileSystem.has(fileName)) {
      errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
    }
    // Simulate setting attributes
  }
}

// Global file system instance
const fileSystem = VB6FileSystem.getInstance();

// VB6 File I/O Functions

/**
 * Open file for I/O
 */
export function Open(
  fileName: string,
  mode: VB6FileMode,
  fileNumber: number,
  access?: VB6FileAccess,
  share?: VB6FileShare,
  recordLength?: number
): void {
  const actualFileNum = fileSystem.openFile(
    fileName,
    mode,
    access || VB6FileAccess.ReadWrite,
    share || VB6FileShare.Default,
    recordLength || 128
  );
  
  if (actualFileNum !== fileNumber) {
    // In real VB6, you specify the file number
    // Here we just ensure it's opened
  }
}

/**
 * Close file
 */
export function Close(fileNumber?: number): void {
  if (fileNumber === undefined) {
    // Close all files
    fileSystem['openFiles'].forEach((_, num) => {
      fileSystem.closeFile(num);
    });
  } else {
    fileSystem.closeFile(fileNumber);
  }
}

/**
 * Get free file number
 */
export function FreeFile(): number {
  return fileSystem.getFreeFileNumber();
}

/**
 * Check end of file
 */
export function EOF(fileNumber: number): boolean {
  return fileSystem.isEOF(fileNumber);
}

/**
 * Get file length
 */
export function LOF(fileNumber: number): number {
  return fileSystem.getFileLength(fileNumber);
}

/**
 * Get/Set file position (Seek)
 */
export function Seek(fileNumber: number, position?: number): number {
  if (position === undefined) {
    return fileSystem.getFilePosition(fileNumber);
  } else {
    fileSystem.seekFile(fileNumber, position);
    return position;
  }
}

/**
 * Read line from file (Line Input #)
 */
export function LineInput(fileNumber: number): string {
  return fileSystem.readLine(fileNumber);
}

/**
 * Read data from file (Input #)
 */
export function Input(fileNumber: number, length: number): string {
  return fileSystem.readChars(fileNumber, length);
}

/**
 * Write to file (Print #)
 */
export function Print(fileNumber: number, ...data: any[]): void {
  const output = data.map(item => String(item)).join('\t');
  fileSystem.writeLine(fileNumber, output);
}

/**
 * Write to file (Write #)
 */
export function Write(fileNumber: number, ...data: any[]): void {
  const output = data.map(item => {
    if (typeof item === 'string') {
      return `"${item}"`;
    }
    return String(item);
  }).join(',');
  fileSystem.writeLine(fileNumber, output);
}

/**
 * Get binary data (Get #)
 */
export function Get(fileNumber: number, recordNumber?: number, variable?: any): any {
  // Simplified implementation for binary/random access
  const position = recordNumber ? (recordNumber - 1) * 128 : undefined;
  if (position !== undefined) {
    fileSystem.seekFile(fileNumber, position);
  }
  
  return fileSystem.readChars(fileNumber, 128);
}

/**
 * Put binary data (Put #)
 */
export function Put(fileNumber: number, recordNumber?: number, data?: any): void {
  // Simplified implementation for binary/random access
  const position = recordNumber ? (recordNumber - 1) * 128 : undefined;
  if (position !== undefined) {
    fileSystem.seekFile(fileNumber, position);
  }
  
  fileSystem.writeToFile(fileNumber, String(data));
}

/**
 * Directory listing (Dir)
 */
export function Dir(path?: string, attributes?: number): string {
  const files = fileSystem.getDirectoryListing(path || 'C:\\', '*.*');
  return files.length > 0 ? files[0] : '';
}

/**
 * Create directory (MkDir)
 */
export function MkDir(path: string): void {
  fileSystem.createDirectory(path);
}

/**
 * Remove directory (RmDir)
 */
export function RmDir(path: string): void {
  fileSystem.removeDirectory(path);
}

/**
 * Change directory (ChDir)
 */
export function ChDir(path: string): void {
  // Simulate directory change
  console.log(`Changed directory to: ${path}`);
}

/**
 * Change drive (ChDrive)
 */
export function ChDrive(drive: string): void {
  // Simulate drive change
  console.log(`Changed drive to: ${drive}`);
}

/**
 * Get current directory (CurDir)
 */
export function CurDir(drive?: string): string {
  return drive ? `${drive}:\\CURRENT\\PATH` : 'C:\\CURRENT\\PATH';
}

/**
 * Delete file (Kill)
 */
export function Kill(fileName: string): void {
  fileSystem.deleteFile(fileName);
}

/**
 * Rename file (Name)
 */
export function Name(oldName: string, newName: string): void {
  const content = fileSystem['virtualFileSystem'].get(oldName);
  if (content === undefined) {
    errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
    return;
  }
  
  fileSystem['virtualFileSystem'].set(newName, content);
  fileSystem['virtualFileSystem'].delete(oldName);
}

/**
 * Copy file (FileCopy)
 */
export function FileCopy(source: string, destination: string): void {
  fileSystem.copyFile(source, destination);
}

/**
 * Get file attributes (GetAttr)
 */
export function GetAttr(fileName: string): number {
  return fileSystem.getFileAttributes(fileName);
}

/**
 * Set file attributes (SetAttr)
 */
export function SetAttr(fileName: string, attributes: number): void {
  fileSystem.setFileAttributes(fileName, attributes);
}

/**
 * Get file date/time (FileDateTime)
 */
export function FileDateTime(fileName: string): Date {
  if (!fileSystem.fileExists(fileName)) {
    errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
    return new Date();
  }
  
  return new Date(); // Return current date as simulation
}

/**
 * Get file length (FileLen)
 */
export function FileLen(fileName: string): number {
  const content = fileSystem['virtualFileSystem'].get(fileName);
  if (content === undefined) {
    errorHandler.raiseError(53, 'File not found', 'VB6FileSystem');
    return 0;
  }
  
  return content.length;
}

// File attribute constants
export const VB6FileAttributes = {
  vbNormal: 0,
  vbReadOnly: 1,
  vbHidden: 2,
  vbSystem: 4,
  vbVolume: 8,
  vbDirectory: 16,
  vbArchive: 32,
  vbAlias: 64
};

export const VB6FileFunctions = {
  VB6FileMode,
  VB6FileAccess,
  VB6FileShare,
  VB6FileAttributes,
  Open,
  Close,
  FreeFile,
  EOF,
  LOF,
  Seek,
  LineInput,
  Input,
  Print,
  Write,
  Get,
  Put,
  Dir,
  MkDir,
  RmDir,
  ChDir,
  ChDrive,
  CurDir,
  Kill,
  Name,
  FileCopy,
  GetAttr,
  SetAttr,
  FileDateTime,
  FileLen
};