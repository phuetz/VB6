/**
 * VB6 File System Implementation
 * 
 * Complete implementation of VB6 file I/O operations using browser storage
 * Emulates file operations with virtual file system in localStorage/IndexedDB
 */

import { errorHandler } from './VB6ErrorHandling';

// File mode constants
export enum VB6FileMode {
  Input = 1,
  Output = 2,
  Random = 4,
  Append = 8,
  Binary = 32
}

// File access constants
export enum VB6FileAccess {
  Read = 1,
  Write = 2,
  ReadWrite = 3
}

// File lock constants
export enum VB6FileLock {
  Shared = 1,
  LockRead = 2,
  LockWrite = 3,
  LockReadWrite = 4
}

// File attributes
export enum VB6FileAttribute {
  vbNormal = 0,
  vbReadOnly = 1,
  vbHidden = 2,
  vbSystem = 4,
  vbVolume = 8,
  vbDirectory = 16,
  vbArchive = 32,
  vbAlias = 64
}

// Virtual File System Entry
interface VFSEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string | ArrayBuffer;
  attributes: number;
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
}

// Open File Handle
interface FileHandle {
  fileNumber: number;
  path: string;
  mode: VB6FileMode;
  access: VB6FileAccess;
  lock: VB6FileLock;
  position: number;
  recordLength?: number;
  buffer?: string;
  isOpen: boolean;
}

/**
 * Virtual File System Manager
 */
class VirtualFileSystem {
  private static instance: VirtualFileSystem;
  private files: Map<string, VFSEntry> = new Map();
  private openFiles: Map<number, FileHandle> = new Map();
  private nextFileNumber: number = 1;
  private currentDirectory: string = '/';

  private constructor() {
    this.loadFromStorage();
    this.ensureSystemDirectories();
  }

  static getInstance(): VirtualFileSystem {
    if (!VirtualFileSystem.instance) {
      VirtualFileSystem.instance = new VirtualFileSystem();
    }
    return VirtualFileSystem.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('vb6_vfs');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((entry: VFSEntry) => {
          entry.created = new Date(entry.created);
          entry.modified = new Date(entry.modified);
          entry.accessed = new Date(entry.accessed);
          this.files.set(entry.path, entry);
        });
      }
    } catch (error) {
      console.error('[VB6 VFS] Error loading file system:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.files.values());
      localStorage.setItem('vb6_vfs', JSON.stringify(data));
    } catch (error) {
      console.error('[VB6 VFS] Error saving file system:', error);
    }
  }

  private ensureSystemDirectories(): void {
    const systemDirs = ['/', '/temp', '/documents', '/programs'];
    systemDirs.forEach(dir => {
      if (!this.files.has(dir)) {
        this.createDirectory(dir);
      }
    });
  }

  // PATH TRAVERSAL BUG FIX: Secure path normalization with boundary checks
  private normalizePath(path: string): string {
    // Convert Windows-style paths to Unix-style
    let normalized = path.replace(/\\/g, '/');
    
    // PATH TRAVERSAL BUG FIX: Reject absolute paths and drive letters
    if (/^([a-zA-Z]:|\/)/.test(path) && !normalized.startsWith('/')) {
      throw new Error('Absolute paths not allowed in virtual file system');
    }
    
    // Handle relative paths
    if (!normalized.startsWith('/')) {
      normalized = this.currentDirectory + '/' + normalized;
    }
    
    // Remove double slashes and resolve . and ..
    const parts = normalized.split('/').filter(p => p !== '' && p !== '.');
    const resolved: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        // PATH TRAVERSAL BUG FIX: Prevent escaping VFS root
        if (resolved.length > 0) {
          resolved.pop();
        }
        // Silently ignore attempts to go above root
      } else {
        // PATH TRAVERSAL BUG FIX: Validate path components
        if (this.isValidPathComponent(part)) {
          resolved.push(part);
        } else {
          throw new Error(`Invalid path component: ${part}`);
        }
      }
    }
    
    // PATH TRAVERSAL BUG FIX: Always ensure we stay within VFS root
    const result = '/' + resolved.join('/');
    if (!result.startsWith('/') || result.includes('..')) {
      throw new Error('Path traversal attempt detected');
    }
    
    return result;
  }

  /**
   * PATH TRAVERSAL BUG FIX: Validate individual path components
   */
  private isValidPathComponent(component: string): boolean {
    if (!component || component.length === 0) return false;
    
    // Reject dangerous characters and patterns
    const dangerousPatterns = [
      /[<>:"|?*\0]/,       // Invalid filename characters
      /^\.+$/,             // Only dots
      /^\s*$/,             // Only whitespace
      /\\$/,               // Ends with backslash
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(component))) {
      return false;
    }
    
    // Limit component length
    if (component.length > 255) {
      return false;
    }
    
    return true;
  }

  createFile(path: string, content: string = ''): VFSEntry {
    const normalizedPath = this.normalizePath(path);
    const now = new Date();
    
    const entry: VFSEntry = {
      name: normalizedPath.split('/').pop() || '',
      path: normalizedPath,
      type: 'file',
      content: content,
      attributes: VB6FileAttribute.vbNormal,
      size: content.length,
      created: now,
      modified: now,
      accessed: now
    };
    
    this.files.set(normalizedPath, entry);
    this.saveToStorage();
    
    return entry;
  }

  createDirectory(path: string): VFSEntry {
    const normalizedPath = this.normalizePath(path);
    const now = new Date();
    
    const entry: VFSEntry = {
      name: normalizedPath.split('/').pop() || '',
      path: normalizedPath,
      type: 'directory',
      attributes: VB6FileAttribute.vbDirectory,
      size: 0,
      created: now,
      modified: now,
      accessed: now
    };
    
    this.files.set(normalizedPath, entry);
    this.saveToStorage();
    
    return entry;
  }

  getEntry(path: string): VFSEntry | null {
    const normalizedPath = this.normalizePath(path);
    const entry = this.files.get(normalizedPath);
    
    if (entry) {
      entry.accessed = new Date();
      this.saveToStorage();
    }
    
    return entry || null;
  }

  deleteEntry(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    const result = this.files.delete(normalizedPath);
    
    if (result) {
      // Delete all children if directory
      const prefix = normalizedPath + '/';
      Array.from(this.files.keys()).forEach(key => {
        if (key.startsWith(prefix)) {
          this.files.delete(key);
        }
      });
      
      this.saveToStorage();
    }
    
    return result;
  }

  listDirectory(path: string): VFSEntry[] {
    const normalizedPath = this.normalizePath(path);
    const entries: VFSEntry[] = [];
    
    this.files.forEach((entry, entryPath) => {
      const parentPath = entryPath.substring(0, entryPath.lastIndexOf('/'));
      if (parentPath === normalizedPath || (normalizedPath === '/' && parentPath === '')) {
        entries.push(entry);
      }
    });
    
    return entries;
  }

  openFile(path: string, mode: VB6FileMode, access: VB6FileAccess, lock: VB6FileLock, recordLength?: number): number {
    const normalizedPath = this.normalizePath(path);
    
    // Check if file exists
    let entry = this.getEntry(normalizedPath);
    
    if (mode === VB6FileMode.Input || mode === VB6FileMode.Binary || mode === VB6FileMode.Random) {
      if (!entry) {
        throw new Error(`File not found: ${path}`);
      }
    } else if (mode === VB6FileMode.Output) {
      // Create or truncate file
      entry = this.createFile(normalizedPath, '');
    } else if (mode === VB6FileMode.Append) {
      // Create if doesn't exist
      if (!entry) {
        entry = this.createFile(normalizedPath, '');
      }
    }
    
    // Get next available file number
    const fileNumber = this.getNextFileNumber();
    
    // Create file handle
    const handle: FileHandle = {
      fileNumber,
      path: normalizedPath,
      mode,
      access,
      lock,
      position: mode === VB6FileMode.Append ? (entry!.size || 0) : 0,
      recordLength,
      buffer: '',
      isOpen: true
    };
    
    this.openFiles.set(fileNumber, handle);
    
    return fileNumber;
  }

  closeFile(fileNumber: number): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }
    
    // Flush any remaining buffer
    if (handle.buffer) {
      this.writeToFile(handle, handle.buffer);
      handle.buffer = '';
    }
    
    handle.isOpen = false;
    this.openFiles.delete(fileNumber);
  }

  private getNextFileNumber(): number {
    while (this.openFiles.has(this.nextFileNumber)) {
      this.nextFileNumber++;
    }
    return this.nextFileNumber++;
  }

  readFromFile(fileNumber: number, length?: number): string {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }
    
    const entry = this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }
    
    const content = entry.content as string || '';
    
    if (handle.mode === VB6FileMode.Binary) {
      // Binary mode - read exact bytes
      const bytesToRead = length || (content.length - handle.position);
      const result = content.substring(handle.position, handle.position + bytesToRead);
      handle.position += result.length;
      return result;
    } else if (handle.mode === VB6FileMode.Input) {
      // Input mode - read until delimiter or EOF
      if (length) {
        const result = content.substring(handle.position, handle.position + length);
        handle.position += result.length;
        return result;
      } else {
        // Read line
        const remainingContent = content.substring(handle.position);
        const lineEnd = remainingContent.indexOf('\n');
        
        if (lineEnd === -1) {
          handle.position = content.length;
          return remainingContent;
        } else {
          const line = remainingContent.substring(0, lineEnd);
          handle.position += lineEnd + 1;
          return line.replace(/\r$/, ''); // Remove CR if CRLF
        }
      }
    } else if (handle.mode === VB6FileMode.Random) {
      // Random mode - read record
      const recordLen = handle.recordLength || 128;
      const result = content.substring(handle.position, handle.position + recordLen);
      handle.position += recordLen;
      return result.padEnd(recordLen, ' ');
    }
    
    return '';
  }

  writeToFile(handle: FileHandle, data: string): void {
    const entry = this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }
    
    let content = entry.content as string || '';
    
    if (handle.mode === VB6FileMode.Output || handle.mode === VB6FileMode.Append) {
      // Sequential write
      content = content.substring(0, handle.position) + data;
      handle.position += data.length;
    } else if (handle.mode === VB6FileMode.Binary) {
      // Binary write at position
      const before = content.substring(0, handle.position);
      const after = content.substring(handle.position + data.length);
      content = before + data + after;
      handle.position += data.length;
    } else if (handle.mode === VB6FileMode.Random) {
      // Random access write
      const recordLen = handle.recordLength || 128;
      const paddedData = data.padEnd(recordLen, ' ').substring(0, recordLen);
      const before = content.substring(0, handle.position);
      const after = content.substring(handle.position + recordLen);
      content = before + paddedData + after;
      handle.position += recordLen;
    }
    
    entry.content = content;
    entry.size = content.length;
    entry.modified = new Date();
    
    this.saveToStorage();
  }

  seekFile(fileNumber: number, position: number): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }
    
    handle.position = Math.max(0, position);
  }

  getFilePosition(fileNumber: number): number {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }
    
    return handle.position;
  }

  isEOF(fileNumber: number): boolean {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }
    
    const entry = this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      return true;
    }
    
    return handle.position >= (entry.size || 0);
  }

  getFileLength(fileNumber: number): number {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }
    
    const entry = this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      return 0;
    }
    
    return entry.size || 0;
  }
}

// Global VFS instance
const vfs = VirtualFileSystem.getInstance();

/**
 * FreeFile - Get next available file number
 */
export function FreeFile(rangeNumber?: number): number {
  // VB6 supports range 0 (1-255) and 1 (256-511)
  // For simplicity, we'll ignore the range
  let fileNumber = 1;
  while (fileNumber <= 511) {
    // Check if file number is in use
    let inUse = false;
    try {
      vfs['getFilePosition'](fileNumber);
      inUse = true;
    } catch {
      // Not in use
    }
    
    if (!inUse) {
      return fileNumber;
    }
    
    fileNumber++;
  }
  
  throw new Error('Too many files open');
}

/**
 * Open - Open a file
 */
export function Open(
  pathname: string,
  mode: VB6FileMode,
  access: VB6FileAccess = VB6FileAccess.ReadWrite,
  lock: VB6FileLock = VB6FileLock.Shared,
  fileNumber: number = 0,
  recordLength?: number
): number {
  try {
    const actualFileNumber = fileNumber || FreeFile();
    vfs['openFile'](pathname, mode, access, lock, recordLength);
    
    console.log(`[VB6 FileSystem] Opened file "${pathname}" as #${actualFileNumber}`);
    return actualFileNumber;
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'Open');
    return 0;
  }
}

/**
 * Close - Close one or more files
 */
export function Close(...fileNumbers: number[]): void {
  try {
    if (fileNumbers.length === 0) {
      // Close all open files
      const openHandles = Array.from(vfs['openFiles'].keys());
      openHandles.forEach(num => vfs['closeFile'](num));
    } else {
      // Close specific files
      fileNumbers.forEach(num => vfs['closeFile'](num));
    }
    
    console.log(`[VB6 FileSystem] Closed files: ${fileNumbers.join(', ') || 'all'}`);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Close');
  }
}

/**
 * Reset - Close all files
 */
export function Reset(): void {
  Close();
}

/**
 * Input - Read data from file
 */
export function Input(length: number, fileNumber: number): string {
  try {
    return vfs['readFromFile'](fileNumber, length);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Input');
    return '';
  }
}

/**
 * Line Input - Read line from file
 */
export function LineInput(fileNumber: number): string {
  try {
    return vfs['readFromFile'](fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Line Input');
    return '';
  }
}

/**
 * Print - Write to file
 */
export function Print(fileNumber: number, ...expressions: any[]): void {
  try {
    const handle = vfs['openFiles'].get(fileNumber);
    if (!handle) {
      throw new Error('Bad file number');
    }
    
    const output = expressions.map(expr => String(expr)).join('\t') + '\n';
    vfs['writeToFile'](handle, output);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Print');
  }
}

/**
 * Write - Write to file with formatting
 */
export function Write(fileNumber: number, ...expressions: any[]): void {
  try {
    const handle = vfs['openFiles'].get(fileNumber);
    if (!handle) {
      throw new Error('Bad file number');
    }
    
    const output = expressions.map(expr => {
      if (typeof expr === 'string') {
        return `"${expr}"`;
      } else if (expr === null) {
        return '#NULL#';
      } else if (expr instanceof Date) {
        return `#${expr.toISOString()}#`;
      } else {
        return String(expr);
      }
    }).join(',') + '\n';
    
    vfs['writeToFile'](handle, output);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Write');
  }
}

/**
 * Get - Read record from random/binary file
 */
export function Get(fileNumber: number, recordNumber?: number): any {
  try {
    const handle = vfs['openFiles'].get(fileNumber);
    if (!handle) {
      throw new Error('Bad file number');
    }
    
    if (recordNumber !== undefined && handle.mode === VB6FileMode.Random) {
      // Seek to record position
      const recordLen = handle.recordLength || 128;
      vfs['seekFile'](fileNumber, (recordNumber - 1) * recordLen);
    }
    
    return vfs['readFromFile'](fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Get');
    return null;
  }
}

/**
 * Put - Write record to random/binary file
 */
export function Put(fileNumber: number, recordNumber: number | undefined, data: any): void {
  try {
    const handle = vfs['openFiles'].get(fileNumber);
    if (!handle) {
      throw new Error('Bad file number');
    }
    
    if (recordNumber !== undefined && handle.mode === VB6FileMode.Random) {
      // Seek to record position
      const recordLen = handle.recordLength || 128;
      vfs['seekFile'](fileNumber, (recordNumber - 1) * recordLen);
    }
    
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    vfs['writeToFile'](handle, dataStr);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Put');
  }
}

/**
 * Seek - Set file position
 */
export function Seek(fileNumber: number, position?: number): number {
  try {
    if (position !== undefined) {
      vfs['seekFile'](fileNumber, position - 1); // VB6 uses 1-based positioning
    }
    return vfs['getFilePosition'](fileNumber) + 1;
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Seek');
    return 0;
  }
}

/**
 * EOF - Check end of file
 */
export function EOF(fileNumber: number): boolean {
  try {
    return vfs['isEOF'](fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'EOF');
    return true;
  }
}

/**
 * LOF - Get length of file
 */
export function LOF(fileNumber: number): number {
  try {
    return vfs['getFileLength'](fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'LOF');
    return 0;
  }
}

/**
 * Loc - Get current position
 */
export function Loc(fileNumber: number): number {
  try {
    return vfs['getFilePosition'](fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Loc');
    return 0;
  }
}

/**
 * FileLen - Get file length by path
 */
export function FileLen(pathname: string): number {
  try {
    const entry = vfs.getEntry(pathname);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }
    return entry.size || 0;
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'FileLen');
    return 0;
  }
}

/**
 * FileDateTime - Get file modification date
 */
export function FileDateTime(pathname: string): Date {
  try {
    const entry = vfs.getEntry(pathname);
    if (!entry) {
      throw new Error('File not found');
    }
    return entry.modified;
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'FileDateTime');
    return new Date(0);
  }
}

/**
 * GetAttr - Get file attributes
 */
export function GetAttr(pathname: string): number {
  try {
    const entry = vfs.getEntry(pathname);
    if (!entry) {
      throw new Error('Path not found');
    }
    return entry.attributes;
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'GetAttr');
    return 0;
  }
}

/**
 * SetAttr - Set file attributes
 */
export function SetAttr(pathname: string, attributes: number): void {
  try {
    const entry = vfs.getEntry(pathname);
    if (!entry) {
      throw new Error('Path not found');
    }
    entry.attributes = attributes;
    vfs['saveToStorage']();
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'SetAttr');
  }
}

/**
 * Kill - Delete file
 */
export function Kill(pathname: string): void {
  try {
    const entry = vfs.getEntry(pathname);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }
    
    if (entry.attributes & VB6FileAttribute.vbReadOnly) {
      throw new Error('Access denied');
    }
    
    vfs.deleteEntry(pathname);
    console.log(`[VB6 FileSystem] Deleted file: ${pathname}`);
  } catch (error) {
    errorHandler.raiseError(53, error.message || 'File not found', 'Kill');
  }
}

/**
 * FileCopy - Copy file
 */
export function FileCopy(source: string, destination: string): void {
  try {
    const sourceEntry = vfs.getEntry(source);
    if (!sourceEntry || sourceEntry.type !== 'file') {
      throw new Error('Source file not found');
    }
    
    const content = sourceEntry.content as string || '';
    vfs.createFile(destination, content);
    
    console.log(`[VB6 FileSystem] Copied ${source} to ${destination}`);
  } catch (error) {
    errorHandler.raiseError(53, error.message || 'File not found', 'FileCopy');
  }
}

/**
 * Name - Rename file or directory
 */
export function Name(oldPath: string, newPath: string): void {
  try {
    const entry = vfs.getEntry(oldPath);
    if (!entry) {
      throw new Error('Path not found');
    }
    
    // Create new entry
    if (entry.type === 'file') {
      vfs.createFile(newPath, entry.content as string);
    } else {
      vfs.createDirectory(newPath);
    }
    
    // Delete old entry
    vfs.deleteEntry(oldPath);
    
    console.log(`[VB6 FileSystem] Renamed ${oldPath} to ${newPath}`);
  } catch (error) {
    errorHandler.raiseError(53, error.message || 'Path not found', 'Name');
  }
}

/**
 * MkDir - Create directory
 */
export function MkDir(path: string): void {
  try {
    const existing = vfs.getEntry(path);
    if (existing) {
      throw new Error('Path already exists');
    }
    
    vfs.createDirectory(path);
    console.log(`[VB6 FileSystem] Created directory: ${path}`);
  } catch (error) {
    errorHandler.raiseError(75, error.message || 'Path/File access error', 'MkDir');
  }
}

/**
 * RmDir - Remove directory
 */
export function RmDir(path: string): void {
  try {
    const entry = vfs.getEntry(path);
    if (!entry || entry.type !== 'directory') {
      throw new Error('Path not found');
    }
    
    // Check if directory is empty
    const contents = vfs.listDirectory(path);
    if (contents.length > 0) {
      throw new Error('Directory not empty');
    }
    
    vfs.deleteEntry(path);
    console.log(`[VB6 FileSystem] Removed directory: ${path}`);
  } catch (error) {
    errorHandler.raiseError(75, error.message || 'Path/File access error', 'RmDir');
  }
}

/**
 * ChDir - Change current directory
 */
export function ChDir(path: string): void {
  try {
    const entry = vfs.getEntry(path);
    if (!entry || entry.type !== 'directory') {
      throw new Error('Path not found');
    }
    
    vfs['currentDirectory'] = vfs['normalizePath'](path);
    console.log(`[VB6 FileSystem] Changed directory to: ${path}`);
  } catch (error) {
    errorHandler.raiseError(76, 'Path not found', 'ChDir');
  }
}

/**
 * CurDir - Get current directory
 */
export function CurDir(drive?: string): string {
  // In browser environment, ignore drive parameter
  return vfs['currentDirectory'];
}

/**
 * ChDrive - Change current drive (no-op in browser)
 */
export function ChDrive(drive: string): void {
  // No-op in browser environment
  console.log(`[VB6 FileSystem] ChDrive ignored in browser: ${drive}`);
}

/**
 * Dir - List files matching pattern
 */
const dirState = {
  pattern: '',
  entries: [] as VFSEntry[],
  index: 0
};

export function Dir(
  pathname?: string,
  attributes: number = VB6FileAttribute.vbNormal
): string {
  if (pathname !== undefined) {
    // Initialize new search
    dirState.pattern = pathname;
    dirState.index = 0;
    
    // Parse pattern
    const lastSlash = pathname.lastIndexOf('/');
    const directory = lastSlash >= 0 ? pathname.substring(0, lastSlash) : vfs['currentDirectory'];
    const pattern = lastSlash >= 0 ? pathname.substring(lastSlash + 1) : pathname;
    
    // Convert DOS wildcards to regex
    const regex = new RegExp(
      '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$',
      'i'
    );
    
    // Get all entries in directory
    const allEntries = vfs.listDirectory(directory);
    
    // Filter by pattern and attributes
    dirState.entries = allEntries.filter(entry => {
      // Check pattern match
      if (!regex.test(entry.name)) return false;
      
      // Check attributes
      if (attributes === VB6FileAttribute.vbNormal) {
        return entry.type === 'file';
      } else {
        return (entry.attributes & attributes) !== 0;
      }
    });
  }
  
  // Return next entry
  if (dirState.index < dirState.entries.length) {
    return dirState.entries[dirState.index++].name;
  }
  
  return '';
}

// Export file system API
export const VB6FileSystemAPI = {
  // File operations
  FreeFile,
  Open,
  Close,
  Reset,
  Input,
  LineInput,
  Print,
  Write,
  Get,
  Put,
  Seek,
  EOF,
  LOF,
  Loc,
  
  // File management
  FileLen,
  FileDateTime,
  GetAttr,
  SetAttr,
  Kill,
  FileCopy,
  Name,
  
  // Directory operations
  MkDir,
  RmDir,
  ChDir,
  CurDir,
  ChDrive,
  Dir,
  
  // Constants
  VB6FileMode,
  VB6FileAccess,
  VB6FileLock,
  VB6FileAttribute,
  
  // Virtual file system
  vfs
};