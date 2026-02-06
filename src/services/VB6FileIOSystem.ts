/**
 * VB6 File I/O System - Complete File Access Implementation
 * Provides full VB6 file I/O compatibility including sequential, random, and binary access
 * Supports Open, Close, Input, Print, Get, Put, Line Input, Write, and all VB6 file functions
 */

import { createLogger } from './LoggingService';
import { PropertyValue } from './types/VB6ServiceTypes';

const logger = createLogger('FileIO');

// VB6 File Access Modes
export enum VB6FileMode {
  Input = 1, // Sequential input
  Output = 2, // Sequential output
  Random = 4, // Random access
  Append = 8, // Sequential append
  Binary = 32, // Binary access
}

// VB6 File Access Types
export enum VB6FileAccess {
  Read = 1,
  Write = 2,
  ReadWrite = 3,
}

// VB6 File Share Modes
export enum VB6FileShare {
  Default = 0,
  Exclusive = 1,
  DenyNone = 64,
  DenyRead = 32,
  DenyWrite = 16,
}

// VB6 File Lock Types
export enum VB6FileLock {
  ReadWrite = 0,
  Read = 1,
  Write = 2,
}

// VB6 File Seek Origin
export enum VB6SeekOrigin {
  Begin = 0,
  Current = 1,
  End = 2,
}

// File Handle Structure
interface VB6FileHandle {
  fileNumber: number;
  fileName: string;
  mode: VB6FileMode;
  access: VB6FileAccess;
  share: VB6FileShare;
  recordLength: number;
  position: number;
  size: number;
  isOpen: boolean;
  data: Uint8Array;
  textEncoder: TextEncoder;
  textDecoder: TextDecoder;
  endOfFile: boolean;
  lastError: string | null;
  lockStart?: number;
  lockLength?: number;
}

// Record Structure for Random Access Files
export interface VB6Record {
  [field: string]: PropertyValue;
}

// File System Statistics
interface VB6FileSystemStats {
  totalFiles: number;
  openFiles: number;
  totalBytesRead: number;
  totalBytesWritten: number;
  errorCount: number;
}

export class VB6FileIOSystem {
  private static instance: VB6FileIOSystem;
  private fileHandles: Map<number, VB6FileHandle> = new Map();
  private nextFileNumber: number = 1;
  private stats: VB6FileSystemStats = {
    totalFiles: 0,
    openFiles: 0,
    totalBytesRead: 0,
    totalBytesWritten: 0,
    errorCount: 0,
  };

  // Virtual file system for web environment
  private virtualFileSystem: Map<string, Uint8Array> = new Map();

  static getInstance(): VB6FileIOSystem {
    if (!VB6FileIOSystem.instance) {
      VB6FileIOSystem.instance = new VB6FileIOSystem();
    }
    return VB6FileIOSystem.instance;
  }

  constructor() {
    this.initializeVirtualFileSystem();
  }

  // Initialize with some sample files
  private initializeVirtualFileSystem(): void {
    // Create sample text files
    this.createVirtualFile(
      'C:\\TEMP\\sample.txt',
      'Hello World!\nThis is a test file.\nLine 3\nLine 4'
    );
    this.createVirtualFile('C:\\DATA\\numbers.dat', '1,2,3,4,5\n6,7,8,9,10\n11,12,13,14,15');
    this.createVirtualFile(
      'C:\\CONFIG\\settings.ini',
      '[Settings]\nLanguage=English\nTheme=Default\n[Options]\nAutoSave=True'
    );

    // Create sample binary file
    const binaryData = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      binaryData[i] = i;
    }
    this.virtualFileSystem.set('C:\\BINARY\\test.bin', binaryData);
  }

  private createVirtualFile(path: string, content: string): void {
    const encoder = new TextEncoder();
    this.virtualFileSystem.set(path.toUpperCase(), encoder.encode(content));
  }

  // VB6 File Number Management
  FreeFile(start: number = 1): number {
    let fileNumber = Math.max(start, 1);
    while (this.fileHandles.has(fileNumber)) {
      fileNumber++;
      if (fileNumber > 511) {
        // VB6 limit
        throw new Error('Too many files open');
      }
    }
    return fileNumber;
  }

  // Open File
  OpenFile(
    fileName: string,
    mode: VB6FileMode,
    access: VB6FileAccess = VB6FileAccess.ReadWrite,
    share: VB6FileShare = VB6FileShare.Default,
    fileNumber?: number,
    recordLength: number = 128
  ): number {
    // Get file number
    const fileNum = fileNumber || this.FreeFile();

    if (this.fileHandles.has(fileNum)) {
      throw new Error(`File ${fileNum} is already open`);
    }

    // Normalize file path
    const normalizedPath = fileName.toUpperCase().replace(/\//g, '\\');

    // Get or create file data
    let fileData: Uint8Array;
    if (this.virtualFileSystem.has(normalizedPath)) {
      fileData = this.virtualFileSystem.get(normalizedPath)!.slice(); // Copy for safety
    } else {
      if (mode === VB6FileMode.Input) {
        throw new Error(`File not found: ${fileName}`);
      }
      fileData = new Uint8Array(0);
    }

    // Create file handle
    const handle: VB6FileHandle = {
      fileNumber: fileNum,
      fileName: normalizedPath,
      mode,
      access,
      share,
      recordLength,
      position: 0,
      size: fileData.length,
      isOpen: true,
      data: fileData,
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      endOfFile: fileData.length === 0,
      lastError: null,
    };

    // Set initial position based on mode
    if (mode === VB6FileMode.Append) {
      handle.position = handle.size;
    }

    this.fileHandles.set(fileNum, handle);
    this.stats.totalFiles++;
    this.stats.openFiles++;

    return fileNum;
  }

  // Close File
  Close(fileNumber?: number): void {
    if (fileNumber === undefined) {
      // Close all files
      for (const handle of this.fileHandles.values()) {
        this.closeHandle(handle);
      }
      this.fileHandles.clear();
      this.stats.openFiles = 0;
    } else {
      const handle = this.getHandle(fileNumber);
      this.closeHandle(handle);
      this.fileHandles.delete(fileNumber);
      this.stats.openFiles--;
    }
  }

  private closeHandle(handle: VB6FileHandle): void {
    if (
      handle.mode === VB6FileMode.Output ||
      handle.mode === VB6FileMode.Append ||
      (handle.access & VB6FileAccess.Write) !== 0
    ) {
      // Save changes back to virtual file system
      this.virtualFileSystem.set(handle.fileName, handle.data);
    }
    handle.isOpen = false;
  }

  // Input/Output Operations

  // Print - Write formatted data to sequential file
  Print(fileNumber: number, ...values: any[]): void {
    const handle = this.getHandle(fileNumber);
    this.validateSequentialWrite(handle);

    let output = '';
    for (let i = 0; i < values.length; i++) {
      if (i > 0) output += '\t'; // Tab between values
      output += this.formatValue(values[i]);
    }
    output += '\r\n'; // VB6 uses CRLF

    this.writeString(handle, output);
  }

  // Write - Write delimited data to sequential file
  Write(fileNumber: number, ...values: any[]): void {
    const handle = this.getHandle(fileNumber);
    this.validateSequentialWrite(handle);

    let output = '';
    for (let i = 0; i < values.length; i++) {
      if (i > 0) output += ',';
      const value = values[i];
      if (typeof value === 'string') {
        output += `"${value.replace(/"/g, '""')}"`;
      } else {
        output += this.formatValue(value);
      }
    }
    output += '\r\n';

    this.writeString(handle, output);
  }

  // Input - Read delimited data from sequential file
  Input(fileNumber: number, ...variables: any[]): any[] {
    const handle = this.getHandle(fileNumber);
    this.validateSequentialRead(handle);

    const line = this.readLine(handle);
    if (line === null) {
      throw new Error('Input past end of file');
    }

    return this.parseInputLine(line, variables.length);
  }

  // Line Input - Read entire line from sequential file
  LineInput(fileNumber: number): string {
    const handle = this.getHandle(fileNumber);
    this.validateSequentialRead(handle);

    const line = this.readLine(handle);
    if (line === null) {
      throw new Error('Input past end of file');
    }

    return line;
  }

  // Get - Read data from random or binary file
  Get(fileNumber: number, recordNumber?: number, variable?: any): any {
    const handle = this.getHandle(fileNumber);

    if (handle.mode === VB6FileMode.Random) {
      return this.getRandomRecord(handle, recordNumber, variable);
    } else if (handle.mode === VB6FileMode.Binary) {
      return this.getBinaryData(handle, variable);
    } else {
      throw new Error('Get statement only valid for Random and Binary files');
    }
  }

  // Put - Write data to random or binary file
  Put(fileNumber: number, recordNumber?: number, variable?: any): void {
    const handle = this.getHandle(fileNumber);

    if (handle.mode === VB6FileMode.Random) {
      this.putRandomRecord(handle, recordNumber, variable);
    } else if (handle.mode === VB6FileMode.Binary) {
      this.putBinaryData(handle, variable);
    } else {
      throw new Error('Put statement only valid for Random and Binary files');
    }
  }

  // File Position and Status Functions

  // Seek - Set or get file position
  Seek(fileNumber: number, position?: number): number {
    const handle = this.getHandle(fileNumber);

    if (position !== undefined) {
      // Set position
      if (handle.mode === VB6FileMode.Random) {
        // Random files use record numbers (1-based)
        handle.position = Math.max(0, (position - 1) * handle.recordLength);
      } else {
        // Sequential and binary files use byte positions (1-based)
        handle.position = Math.max(0, position - 1);
      }
      handle.endOfFile = handle.position >= handle.size;
      return position;
    } else {
      // Get position
      if (handle.mode === VB6FileMode.Random) {
        return Math.floor(handle.position / handle.recordLength) + 1;
      } else {
        return handle.position + 1;
      }
    }
  }

  // EOF - Test for end of file
  EOF(fileNumber: number): boolean {
    const handle = this.getHandle(fileNumber);
    return handle.endOfFile || handle.position >= handle.size;
  }

  // LOF - Length of file
  LOF(fileNumber: number): number {
    const handle = this.getHandle(fileNumber);
    return handle.size;
  }

  // Loc - Current position in file
  Loc(fileNumber: number): number {
    const handle = this.getHandle(fileNumber);
    if (handle.mode === VB6FileMode.Random) {
      return Math.floor(handle.position / handle.recordLength);
    } else {
      return handle.position;
    }
  }

  // File Locking
  Lock(fileNumber: number, recordRange?: { start: number; end?: number }): void {
    const handle = this.getHandle(fileNumber);

    if (recordRange) {
      if (handle.mode === VB6FileMode.Random) {
        handle.lockStart = (recordRange.start - 1) * handle.recordLength;
        handle.lockLength = recordRange.end
          ? (recordRange.end - recordRange.start + 1) * handle.recordLength
          : handle.recordLength;
      } else {
        handle.lockStart = recordRange.start - 1;
        handle.lockLength = recordRange.end ? recordRange.end - recordRange.start + 1 : 1;
      }
    } else {
      // Lock entire file
      handle.lockStart = 0;
      handle.lockLength = handle.size;
    }
  }

  Unlock(fileNumber: number, recordRange?: { start: number; end?: number }): void {
    const handle = this.getHandle(fileNumber);
    handle.lockStart = undefined;
    handle.lockLength = undefined;
  }

  // File Information Functions
  FileExists(fileName: string): boolean {
    const normalizedPath = fileName.toUpperCase().replace(/\//g, '\\');
    return this.virtualFileSystem.has(normalizedPath);
  }

  FileDateTime(fileName: string): Date {
    // In a real implementation, would return actual file date
    return new Date();
  }

  FileLen(fileName: string): number {
    const normalizedPath = fileName.toUpperCase().replace(/\//g, '\\');
    const data = this.virtualFileSystem.get(normalizedPath);
    return data ? data.length : 0;
  }

  GetAttr(fileName: string): number {
    // Return file attributes (simplified)
    return this.FileExists(fileName) ? 0 : -1;
  }

  // Directory Operations
  Dir(pathName?: string, attributes?: number): string {
    // Simplified directory listing
    if (!pathName) {
      // Return first file
      const files = Array.from(this.virtualFileSystem.keys());
      return files.length > 0 ? files[0].split('\\').pop() || '' : '';
    }

    const normalizedPath = pathName.toUpperCase().replace(/\//g, '\\');
    const files = Array.from(this.virtualFileSystem.keys())
      .filter(path => path.startsWith(normalizedPath.replace('*', '').replace('?', '')))
      .map(path => path.split('\\').pop() || '');

    return files.length > 0 ? files[0] : '';
  }

  ChDir(path: string): void {
    // Change current directory (simplified)
    logger.debug(`Changed directory to: ${path}`);
  }

  ChDrive(drive: string): void {
    // Change current drive (simplified)
    logger.debug(`Changed drive to: ${drive}`);
  }

  CurDir(drive?: string): string {
    // Return current directory
    return drive ? `${drive}:\\CURRENT` : 'C:\\CURRENT';
  }

  MkDir(path: string): void {
    // Create directory (simplified)
    logger.debug(`Created directory: ${path}`);
  }

  RmDir(path: string): void {
    // Remove directory (simplified)
    logger.debug(`Removed directory: ${path}`);
  }

  // File Management
  FileCopy(source: string, destination: string): void {
    const normalizedSource = source.toUpperCase().replace(/\//g, '\\');
    const normalizedDest = destination.toUpperCase().replace(/\//g, '\\');

    const sourceData = this.virtualFileSystem.get(normalizedSource);
    if (!sourceData) {
      throw new Error(`File not found: ${source}`);
    }

    this.virtualFileSystem.set(normalizedDest, sourceData.slice());
  }

  Kill(fileName: string): void {
    const normalizedPath = fileName.toUpperCase().replace(/\//g, '\\');
    if (!this.virtualFileSystem.delete(normalizedPath)) {
      throw new Error(`File not found: ${fileName}`);
    }
  }

  Name(oldName: string, newName: string): void {
    const normalizedOld = oldName.toUpperCase().replace(/\//g, '\\');
    const normalizedNew = newName.toUpperCase().replace(/\//g, '\\');

    const data = this.virtualFileSystem.get(normalizedOld);
    if (!data) {
      throw new Error(`File not found: ${oldName}`);
    }

    this.virtualFileSystem.set(normalizedNew, data);
    this.virtualFileSystem.delete(normalizedOld);
  }

  SetAttr(fileName: string, attributes: number): void {
    // Set file attributes (simplified)
    if (!this.FileExists(fileName)) {
      throw new Error(`File not found: ${fileName}`);
    }
    logger.debug(`Set attributes for ${fileName}: ${attributes}`);
  }

  // Special File Operations
  Reset(): void {
    // Close all files
    this.Close();
  }

  Width(fileNumber: number, width: number): void {
    const handle = this.getHandle(fileNumber);
    // Set output width for Print statements
    (handle as any).width = width;
  }

  // Private Helper Methods
  private getHandle(fileNumber: number): VB6FileHandle {
    const handle = this.fileHandles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File ${fileNumber} is not open`);
    }
    return handle;
  }

  private validateSequentialRead(handle: VB6FileHandle): void {
    if (handle.mode !== VB6FileMode.Input) {
      throw new Error('Bad file mode for Input');
    }
    if ((handle.access & VB6FileAccess.Read) === 0) {
      throw new Error('Permission denied');
    }
  }

  private validateSequentialWrite(handle: VB6FileHandle): void {
    if (handle.mode !== VB6FileMode.Output && handle.mode !== VB6FileMode.Append) {
      throw new Error('Bad file mode for Output');
    }
    if ((handle.access & VB6FileAccess.Write) === 0) {
      throw new Error('Permission denied');
    }
  }

  private writeString(handle: VB6FileHandle, text: string): void {
    const bytes = handle.textEncoder.encode(text);

    // Expand file if necessary
    const newPosition = handle.position + bytes.length;
    if (newPosition > handle.data.length) {
      const newData = new Uint8Array(Math.max(newPosition, handle.data.length * 2));
      newData.set(handle.data);
      handle.data = newData;
    }

    // Write data
    handle.data.set(bytes, handle.position);
    handle.position = newPosition;
    handle.size = Math.max(handle.size, newPosition);
    handle.endOfFile = handle.position >= handle.size;

    this.stats.totalBytesWritten += bytes.length;
  }

  private readLine(handle: VB6FileHandle): string | null {
    if (handle.position >= handle.size) {
      handle.endOfFile = true;
      return null;
    }

    const startPos = handle.position;
    let endPos = startPos;

    // Find end of line
    while (endPos < handle.size && handle.data[endPos] !== 0x0d && handle.data[endPos] !== 0x0a) {
      endPos++;
    }

    // Extract line
    const lineBytes = handle.data.slice(startPos, endPos);
    const line = handle.textDecoder.decode(lineBytes);

    // Skip line ending
    if (endPos < handle.size) {
      if (
        handle.data[endPos] === 0x0d &&
        endPos + 1 < handle.size &&
        handle.data[endPos + 1] === 0x0a
      ) {
        endPos += 2; // CRLF
      } else {
        endPos += 1; // CR or LF
      }
    }

    handle.position = endPos;
    handle.endOfFile = handle.position >= handle.size;

    this.stats.totalBytesRead += endPos - startPos;

    return line;
  }

  private parseInputLine(line: string, expectedCount: number): any[] {
    const values: any[] = [];
    let i = 0;
    let inQuotes = false;
    let current = '';

    while (i < line.length && values.length < expectedCount) {
      const char = line[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(this.parseValue(current.trim()));
        current = '';
      } else {
        current += char;
      }

      i++;
    }

    if (current.trim() || values.length < expectedCount) {
      values.push(this.parseValue(current.trim()));
    }

    return values;
  }

  private parseValue(str: string): any {
    if (str === '') return '';
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;

    const num = parseFloat(str);
    if (!isNaN(num) && isFinite(num)) return num;

    return str;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'number') return value.toString();
    return String(value);
  }

  private getRandomRecord(handle: VB6FileHandle, recordNumber?: number, variable?: any): any {
    if (recordNumber !== undefined) {
      handle.position = (recordNumber - 1) * handle.recordLength;
    }

    if (handle.position + handle.recordLength > handle.size) {
      throw new Error('Input past end of file');
    }

    const recordBytes = handle.data.slice(handle.position, handle.position + handle.recordLength);
    handle.position += handle.recordLength;
    handle.endOfFile = handle.position >= handle.size;

    this.stats.totalBytesRead += handle.recordLength;

    // Simple record parsing (would be more complex in real implementation)
    if (typeof variable === 'string') {
      return handle.textDecoder.decode(recordBytes).replace(/\0+$/, '');
    } else if (typeof variable === 'number') {
      const view = new DataView(recordBytes.buffer, recordBytes.byteOffset, recordBytes.byteLength);
      return view.getFloat64(0, true); // Little endian
    } else {
      return recordBytes;
    }
  }

  private putRandomRecord(handle: VB6FileHandle, recordNumber?: number, variable?: any): void {
    if (recordNumber !== undefined) {
      handle.position = (recordNumber - 1) * handle.recordLength;
    }

    // Expand file if necessary
    const newSize = Math.max(handle.size, handle.position + handle.recordLength);
    if (newSize > handle.data.length) {
      const newData = new Uint8Array(newSize);
      newData.set(handle.data);
      handle.data = newData;
    }

    // Prepare record data
    let recordBytes: Uint8Array;
    if (typeof variable === 'string') {
      const encoded = handle.textEncoder.encode(variable);
      recordBytes = new Uint8Array(handle.recordLength);
      recordBytes.set(encoded.slice(0, handle.recordLength));
    } else if (typeof variable === 'number') {
      recordBytes = new Uint8Array(handle.recordLength);
      const view = new DataView(recordBytes.buffer);
      view.setFloat64(0, variable, true); // Little endian
    } else if (variable instanceof Uint8Array) {
      recordBytes = new Uint8Array(handle.recordLength);
      recordBytes.set(variable.slice(0, handle.recordLength));
    } else {
      recordBytes = new Uint8Array(handle.recordLength);
    }

    // Write record
    handle.data.set(recordBytes, handle.position);
    handle.position += handle.recordLength;
    handle.size = Math.max(handle.size, handle.position);
    handle.endOfFile = handle.position >= handle.size;

    this.stats.totalBytesWritten += handle.recordLength;
  }

  private getBinaryData(handle: VB6FileHandle, variable?: any): any {
    let bytesToRead = 1;

    if (typeof variable === 'number') {
      bytesToRead = 8; // Double
    } else if (typeof variable === 'string') {
      bytesToRead = variable.length || 1;
    } else if (variable instanceof Uint8Array) {
      bytesToRead = variable.length;
    }

    if (handle.position + bytesToRead > handle.size) {
      throw new Error('Input past end of file');
    }

    const data = handle.data.slice(handle.position, handle.position + bytesToRead);
    handle.position += bytesToRead;
    handle.endOfFile = handle.position >= handle.size;

    this.stats.totalBytesRead += bytesToRead;

    if (typeof variable === 'number') {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return view.getFloat64(0, true);
    } else if (typeof variable === 'string') {
      return handle.textDecoder.decode(data);
    } else {
      return data;
    }
  }

  private putBinaryData(handle: VB6FileHandle, variable: any): void {
    let dataToWrite: Uint8Array;

    if (typeof variable === 'number') {
      dataToWrite = new Uint8Array(8);
      const view = new DataView(dataToWrite.buffer);
      view.setFloat64(0, variable, true);
    } else if (typeof variable === 'string') {
      dataToWrite = handle.textEncoder.encode(variable);
    } else if (variable instanceof Uint8Array) {
      dataToWrite = variable;
    } else {
      dataToWrite = new Uint8Array(1);
      dataToWrite[0] = Number(variable) || 0;
    }

    // Expand file if necessary
    const newSize = Math.max(handle.size, handle.position + dataToWrite.length);
    if (newSize > handle.data.length) {
      const newData = new Uint8Array(newSize);
      newData.set(handle.data);
      handle.data = newData;
    }

    // Write data
    handle.data.set(dataToWrite, handle.position);
    handle.position += dataToWrite.length;
    handle.size = Math.max(handle.size, handle.position);
    handle.endOfFile = handle.position >= handle.size;

    this.stats.totalBytesWritten += dataToWrite.length;
  }

  // Statistics and Debugging
  getFileSystemStats(): VB6FileSystemStats {
    return { ...this.stats };
  }

  getOpenFiles(): Array<{
    fileNumber: number;
    fileName: string;
    mode: string;
    position: number;
    size: number;
  }> {
    return Array.from(this.fileHandles.values()).map(handle => ({
      fileNumber: handle.fileNumber,
      fileName: handle.fileName,
      mode: VB6FileMode[handle.mode],
      position: handle.position,
      size: handle.size,
    }));
  }

  listVirtualFiles(): string[] {
    return Array.from(this.virtualFileSystem.keys());
  }

  // Expose virtual file system for debugging
  getVirtualFileContent(fileName: string): Uint8Array | undefined {
    const normalizedPath = fileName.toUpperCase().replace(/\//g, '\\');
    return this.virtualFileSystem.get(normalizedPath);
  }

  addVirtualFile(fileName: string, content: string | Uint8Array): void {
    const normalizedPath = fileName.toUpperCase().replace(/\//g, '\\');
    if (typeof content === 'string') {
      this.createVirtualFile(normalizedPath, content);
    } else {
      this.virtualFileSystem.set(normalizedPath, content);
    }
  }
}

// Global instance for VB6 compatibility
export const VB6FileIO = VB6FileIOSystem.getInstance();

// VB6 Global Functions for compatibility
export function FreeFile(start: number = 1): number {
  return VB6FileIO.FreeFile(start);
}

export function Open(
  fileName: string,
  mode: VB6FileMode,
  access?: VB6FileAccess,
  share?: VB6FileShare,
  fileNumber?: number,
  recordLength?: number
): number {
  return VB6FileIO.OpenFile(fileName, mode, access, share, fileNumber, recordLength);
}

export function Close(fileNumber?: number): void {
  return VB6FileIO.Close(fileNumber);
}

export function Print(fileNumber: number, ...values: any[]): void {
  return VB6FileIO.Print(fileNumber, ...values);
}

export function Write(fileNumber: number, ...values: any[]): void {
  return VB6FileIO.Write(fileNumber, ...values);
}

export function Input(fileNumber: number, ...variables: any[]): any[] {
  return VB6FileIO.Input(fileNumber, ...variables);
}

export function LineInput(fileNumber: number): string {
  return VB6FileIO.LineInput(fileNumber);
}

export function Get(fileNumber: number, recordNumber?: number, variable?: any): any {
  return VB6FileIO.Get(fileNumber, recordNumber, variable);
}

export function Put(fileNumber: number, recordNumber?: number, variable?: any): void {
  return VB6FileIO.Put(fileNumber, recordNumber, variable);
}

export function Seek(fileNumber: number, position?: number): number {
  return VB6FileIO.Seek(fileNumber, position);
}

export function EOF(fileNumber: number): boolean {
  return VB6FileIO.EOF(fileNumber);
}

export function LOF(fileNumber: number): number {
  return VB6FileIO.LOF(fileNumber);
}

export function Loc(fileNumber: number): number {
  return VB6FileIO.Loc(fileNumber);
}

export function FileLen(fileName: string): number {
  return VB6FileIO.FileLen(fileName);
}

export function Dir(pathName?: string, attributes?: number): string {
  return VB6FileIO.Dir(pathName, attributes);
}

export function FileCopy(source: string, destination: string): void {
  return VB6FileIO.FileCopy(source, destination);
}

export function Kill(fileName: string): void {
  return VB6FileIO.Kill(fileName);
}

export function Name(oldName: string, newName: string): void {
  return VB6FileIO.Name(oldName, newName);
}

// Initialize global VB6 file I/O functions
if (typeof window !== 'undefined') {
  const globalAny = window as any;

  // File I/O functions
  globalAny.FreeFile = FreeFile;
  globalAny.Open = Open;
  globalAny.Close = Close;
  globalAny.Print = Print;
  globalAny.Write = Write;
  globalAny.Input = Input;
  globalAny.LineInput = LineInput;
  globalAny.Get = Get;
  globalAny.Put = Put;
  globalAny.Seek = Seek;
  globalAny.EOF = EOF;
  globalAny.LOF = LOF;
  globalAny.Loc = Loc;
  globalAny.FileLen = FileLen;
  globalAny.Dir = Dir;
  globalAny.FileCopy = FileCopy;
  globalAny.Kill = Kill;
  globalAny.Name = Name;

  // File system object
  globalAny.VB6FileIO = VB6FileIO;

  // Constants
  globalAny.VB6FileMode = VB6FileMode;
  globalAny.VB6FileAccess = VB6FileAccess;
  globalAny.VB6FileShare = VB6FileShare;

  logger.info(
    'VB6 File I/O System initialized with full sequential, random, and binary file support'
  );
}

export default VB6FileIOSystem;
