/**
 * VB6 File System Implementation
 * Provides compatibility with VB6 file operations: Open, Get, Put, Close, etc.
 */

export enum VB6FileMode {
  Input = 1,      // For Input
  Output = 2,     // For Output  
  Random = 4,     // For Random
  Append = 8,     // For Append
  Binary = 32     // For Binary
}

export enum VB6FileAccess {
  Read = 1,       // Read
  Write = 2,      // Write
  ReadWrite = 3   // Read Write
}

export enum VB6LockType {
  Shared = 0,     // Shared
  LockRead = 1,   // Lock Read
  LockWrite = 2,  // Lock Write
  LockReadWrite = 3 // Lock Read Write
}

export interface VB6FileHandle {
  fileNumber: number;
  filename: string;
  mode: VB6FileMode;
  access: VB6FileAccess;
  lock: VB6LockType;
  recordLength: number;
  position: number;
  isOpen: boolean;
  buffer: ArrayBuffer;
  textContent?: string;
  encoding: string;
}

export interface VB6FileInfo {
  name: string;
  size: number;
  dateCreated: Date;
  dateModified: Date;
  attributes: number;
}

/**
 * VB6 File System Manager
 * Simulates VB6 file operations using browser APIs and virtual file system
 */
export class VB6FileSystem {
  private openFiles: Map<number, VB6FileHandle> = new Map();
  private virtualFiles: Map<string, ArrayBuffer> = new Map();
  private nextFileNumber: number = 1;
  
  // VB6 File attribute constants
  static readonly vbNormal = 0;
  static readonly vbReadOnly = 1;
  static readonly vbHidden = 2;
  static readonly vbSystem = 4;
  static readonly vbVolume = 8;
  static readonly vbDirectory = 16;
  static readonly vbArchive = 32;

  constructor() {
    this.initializeVirtualFiles();
  }

  /**
   * Initialize some virtual files for testing
   */
  private initializeVirtualFiles(): void {
    // Create some sample files
    const sampleText = new TextEncoder().encode("Hello VB6 World!\r\nThis is a test file.\r\n");
    this.virtualFiles.set("C:\\TEST.TXT", sampleText.buffer);
    
    const sampleData = new ArrayBuffer(100);
    new Uint8Array(sampleData).fill(65); // Fill with 'A'
    this.virtualFiles.set("C:\\DATA.DAT", sampleData);
  }

  /**
   * VB6 Open statement
   * Open pathname For mode [Access access] [lock] As [#]filenumber [Len=reclength]
   */
  open(pathname: string, mode: VB6FileMode, access: VB6FileAccess = VB6FileAccess.ReadWrite, 
       lock: VB6LockType = VB6LockType.Shared, fileNumber?: number, recordLength: number = 128): number {
    
    const fileNum = fileNumber || this.getFreeFileNumber();
    
    if (this.openFiles.has(fileNum)) {
      throw new Error(`File number ${fileNum} already in use`);
    }

    // Normalize path
    const normalizedPath = this.normalizePath(pathname);
    
    // Create or get file buffer
    let buffer: ArrayBuffer;
    let textContent: string | undefined;
    
    if (mode === VB6FileMode.Output || mode === VB6FileMode.Append) {
      // Create new file or truncate existing
      if (mode === VB6FileMode.Output || !this.virtualFiles.has(normalizedPath)) {
        buffer = new ArrayBuffer(0);
      } else {
        buffer = this.virtualFiles.get(normalizedPath)!.slice(0);
      }
    } else {
      // Read existing file
      if (!this.virtualFiles.has(normalizedPath)) {
        throw new Error(`File not found: ${pathname}`);
      }
      buffer = this.virtualFiles.get(normalizedPath)!.slice(0);
    }

    // For text modes, convert to string
    if (mode !== VB6FileMode.Binary && mode !== VB6FileMode.Random) {
      textContent = new TextDecoder('windows-1252').decode(buffer);
    }

    const handle: VB6FileHandle = {
      fileNumber: fileNum,
      filename: normalizedPath,
      mode,
      access,
      lock,
      recordLength,
      position: mode === VB6FileMode.Append ? buffer.byteLength : 0,
      isOpen: true,
      buffer,
      textContent,
      encoding: 'windows-1252'
    };

    this.openFiles.set(fileNum, handle);
    return fileNum;
  }

  /**
   * VB6 Close statement
   */
  close(fileNumber?: number): void {
    if (fileNumber === undefined) {
      // Close all files
      for (const handle of this.openFiles.values()) {
        this.closeFile(handle);
      }
      this.openFiles.clear();
    } else {
      const handle = this.openFiles.get(fileNumber);
      if (!handle) {
        throw new Error(`File number ${fileNumber} not open`);
      }
      this.closeFile(handle);
      this.openFiles.delete(fileNumber);
    }
  }

  /**
   * Close individual file and save changes
   */
  private closeFile(handle: VB6FileHandle): void {
    if (handle.mode === VB6FileMode.Output || handle.mode === VB6FileMode.Append || 
        handle.mode === VB6FileMode.Random || handle.mode === VB6FileMode.Binary) {
      // Save changes back to virtual file system
      this.virtualFiles.set(handle.filename, handle.buffer.slice(0));
    }
    handle.isOpen = false;
  }

  /**
   * VB6 Get statement for binary/random files
   */
  get(fileNumber: number, recordNumber?: number, variable?: any): any {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode === VB6FileMode.Binary) {
      return this.getBinary(handle, variable);
    } else if (handle.mode === VB6FileMode.Random) {
      return this.getRandom(handle, recordNumber, variable);
    } else {
      throw new Error('Get statement only valid for Binary and Random files');
    }
  }

  /**
   * VB6 Put statement for binary/random files
   */
  put(fileNumber: number, recordNumber?: number, variable?: any): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode === VB6FileMode.Binary) {
      this.putBinary(handle, variable);
    } else if (handle.mode === VB6FileMode.Random) {
      this.putRandom(handle, recordNumber, variable);
    } else {
      throw new Error('Put statement only valid for Binary and Random files');
    }
  }

  /**
   * VB6 Input# function for sequential files
   */
  input(fileNumber: number, numChars?: number): string {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode !== VB6FileMode.Input) {
      throw new Error('Input only valid for Input files');
    }

    if (!handle.textContent) {
      return '';
    }

    if (numChars === undefined) {
      // Read until delimiter or EOF
      const remaining = handle.textContent.substring(handle.position);
      const delimiterIndex = remaining.search(/[,\r\n]/);
      
      if (delimiterIndex === -1) {
        handle.position = handle.textContent.length;
        return remaining.trim();
      } else {
        const result = remaining.substring(0, delimiterIndex).trim();
        handle.position += delimiterIndex + 1;
        // Skip additional whitespace
        while (handle.position < handle.textContent.length && 
               /[\s,]/.test(handle.textContent[handle.position])) {
          handle.position++;
        }
        return result;
      }
    } else {
      // Read specific number of characters
      const result = handle.textContent.substring(handle.position, handle.position + numChars);
      handle.position += numChars;
      return result;
    }
  }

  /**
   * VB6 Line Input# statement
   */
  lineInput(fileNumber: number): string {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode !== VB6FileMode.Input) {
      throw new Error('Line Input only valid for Input files');
    }

    if (!handle.textContent) {
      return '';
    }

    const remaining = handle.textContent.substring(handle.position);
    const lineEndIndex = remaining.search(/\r?\n/);
    
    if (lineEndIndex === -1) {
      handle.position = handle.textContent.length;
      return remaining;
    } else {
      const result = remaining.substring(0, lineEndIndex);
      handle.position += lineEndIndex + (remaining[lineEndIndex] === '\r' ? 2 : 1);
      return result;
    }
  }

  /**
   * VB6 Print# statement
   */
  print(fileNumber: number, ...values: any[]): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode !== VB6FileMode.Output && handle.mode !== VB6FileMode.Append) {
      throw new Error('Print only valid for Output and Append files');
    }

    const text = values.map(v => v?.toString() ?? '').join('\t') + '\r\n';
    this.writeText(handle, text);
  }

  /**
   * VB6 Write# statement
   */
  write(fileNumber: number, ...values: any[]): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode !== VB6FileMode.Output && handle.mode !== VB6FileMode.Append) {
      throw new Error('Write only valid for Output and Append files');
    }

    const formattedValues = values.map(v => {
      if (typeof v === 'string') {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v?.toString() ?? '';
    });
    
    const text = formattedValues.join(',') + '\r\n';
    this.writeText(handle, text);
  }

  /**
   * VB6 EOF function
   */
  eof(fileNumber: number): boolean {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode === VB6FileMode.Binary || handle.mode === VB6FileMode.Random) {
      return handle.position >= handle.buffer.byteLength;
    } else {
      return handle.position >= (handle.textContent?.length ?? 0);
    }
  }

  /**
   * VB6 LOF function (Length of File)
   */
  lof(fileNumber: number): number {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    return handle.buffer.byteLength;
  }

  /**
   * VB6 Loc function (current position)
   */
  loc(fileNumber: number): number {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode === VB6FileMode.Random) {
      return Math.floor(handle.position / handle.recordLength) + 1;
    } else {
      return handle.position;
    }
  }

  /**
   * VB6 Seek statement
   */
  seek(fileNumber: number, position: number): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`File number ${fileNumber} not open`);
    }

    if (handle.mode === VB6FileMode.Random) {
      handle.position = (position - 1) * handle.recordLength;
    } else {
      handle.position = position - 1; // VB6 uses 1-based positions
    }

    handle.position = Math.max(0, Math.min(handle.position, handle.buffer.byteLength));
  }

  /**
   * VB6 FreeFile function
   */
  getFreeFileNumber(): number {
    while (this.openFiles.has(this.nextFileNumber)) {
      this.nextFileNumber++;
      if (this.nextFileNumber > 511) { // VB6 limit
        this.nextFileNumber = 1;
      }
    }
    return this.nextFileNumber;
  }

  /**
   * VB6 Dir function
   */
  dir(pathname?: string, attributes?: number): string {
    // Simplified implementation - would need full directory scanning in real implementation
    if (!pathname) {
      // Continue previous Dir operation
      return '';
    }

    // For now, just check if the file exists
    const normalizedPath = this.normalizePath(pathname);
    if (this.virtualFiles.has(normalizedPath)) {
      return this.getFilenameFromPath(normalizedPath);
    }

    return '';
  }

  /**
   * VB6 FileLen function
   */
  fileLen(pathname: string): number {
    const normalizedPath = this.normalizePath(pathname);
    const buffer = this.virtualFiles.get(normalizedPath);
    if (!buffer) {
      throw new Error(`File not found: ${pathname}`);
    }
    return buffer.byteLength;
  }

  /**
   * VB6 FileDateTime function
   */
  fileDateTime(pathname: string): Date {
    const normalizedPath = this.normalizePath(pathname);
    if (!this.virtualFiles.has(normalizedPath)) {
      throw new Error(`File not found: ${pathname}`);
    }
    // Return current date for virtual files
    return new Date();
  }

  /**
   * VB6 GetAttr function
   */
  getAttr(pathname: string): number {
    const normalizedPath = this.normalizePath(pathname);
    if (!this.virtualFiles.has(normalizedPath)) {
      throw new Error(`File not found: ${pathname}`);
    }
    return VB6FileSystem.vbNormal; // Default to normal file
  }

  /**
   * VB6 SetAttr statement
   */
  setAttr(pathname: string, attributes: number): void {
    const normalizedPath = this.normalizePath(pathname);
    if (!this.virtualFiles.has(normalizedPath)) {
      throw new Error(`File not found: ${pathname}`);
    }
    // In a real implementation, would store attributes
    console.log(`SetAttr: ${pathname} = ${attributes}`);
  }

  /**
   * VB6 FileCopy statement
   */
  fileCopy(source: string, destination: string): void {
    const srcPath = this.normalizePath(source);
    const destPath = this.normalizePath(destination);
    
    const buffer = this.virtualFiles.get(srcPath);
    if (!buffer) {
      throw new Error(`File not found: ${source}`);
    }
    
    this.virtualFiles.set(destPath, buffer.slice(0));
  }

  /**
   * VB6 Kill statement
   */
  kill(pathname: string): void {
    const normalizedPath = this.normalizePath(pathname);
    if (!this.virtualFiles.has(normalizedPath)) {
      throw new Error(`File not found: ${pathname}`);
    }
    this.virtualFiles.delete(normalizedPath);
  }

  /**
   * VB6 Name statement (rename/move file)
   */
  name(oldPathname: string, newPathname: string): void {
    const oldPath = this.normalizePath(oldPathname);
    const newPath = this.normalizePath(newPathname);
    
    const buffer = this.virtualFiles.get(oldPath);
    if (!buffer) {
      throw new Error(`File not found: ${oldPathname}`);
    }
    
    this.virtualFiles.set(newPath, buffer);
    this.virtualFiles.delete(oldPath);
  }

  // Private helper methods

  private getBinary(handle: VB6FileHandle, variable?: any): any {
    if (handle.position >= handle.buffer.byteLength) {
      return null;
    }

    // Simplified - in real implementation would handle different variable types
    const view = new DataView(handle.buffer, handle.position);
    const value = view.getUint8(0);
    handle.position += 1;
    return value;
  }

  private putBinary(handle: VB6FileHandle, variable: any): void {
    // Expand buffer if necessary
    if (handle.position >= handle.buffer.byteLength) {
      const newBuffer = new ArrayBuffer(handle.position + 1);
      new Uint8Array(newBuffer).set(new Uint8Array(handle.buffer));
      handle.buffer = newBuffer;
    }

    const view = new DataView(handle.buffer, handle.position);
    view.setUint8(0, variable & 0xFF);
    handle.position += 1;
  }

  private getRandom(handle: VB6FileHandle, recordNumber?: number, variable?: any): any {
    if (recordNumber !== undefined) {
      handle.position = (recordNumber - 1) * handle.recordLength;
    }

    if (handle.position >= handle.buffer.byteLength) {
      return null;
    }

    // Simplified - read one record
    const recordData = new Uint8Array(handle.buffer, handle.position, 
                                     Math.min(handle.recordLength, handle.buffer.byteLength - handle.position));
    handle.position += handle.recordLength;
    
    return recordData;
  }

  private putRandom(handle: VB6FileHandle, recordNumber?: number, variable?: any): void {
    if (recordNumber !== undefined) {
      handle.position = (recordNumber - 1) * handle.recordLength;
    }

    // Expand buffer if necessary
    const requiredSize = handle.position + handle.recordLength;
    if (requiredSize > handle.buffer.byteLength) {
      const newBuffer = new ArrayBuffer(requiredSize);
      new Uint8Array(newBuffer).set(new Uint8Array(handle.buffer));
      handle.buffer = newBuffer;
    }

    // Simplified - write variable as bytes
    const recordData = new Uint8Array(handle.buffer, handle.position, handle.recordLength);
    recordData.fill(0); // Clear record
    
    if (variable !== undefined) {
      const bytes = new TextEncoder().encode(variable.toString());
      recordData.set(bytes.slice(0, Math.min(bytes.length, handle.recordLength)));
    }
    
    handle.position += handle.recordLength;
  }

  private writeText(handle: VB6FileHandle, text: string): void {
    if (!handle.textContent) {
      handle.textContent = '';
    }

    if (handle.mode === VB6FileMode.Append) {
      handle.textContent += text;
    } else {
      // Insert at current position
      handle.textContent = handle.textContent.substring(0, handle.position) + 
                           text + 
                           handle.textContent.substring(handle.position);
    }

    handle.position += text.length;
    
    // Update buffer
    const encoder = new TextEncoder();
    const encoded = encoder.encode(handle.textContent);
    handle.buffer = encoded.buffer.slice(0);
  }

  private normalizePath(pathname: string): string {
    // Convert to uppercase and ensure proper format
    let normalized = pathname.toUpperCase();
    
    // Add C:\ if no drive specified
    if (!normalized.match(/^[A-Z]:/)) {
      normalized = 'C:\\' + normalized;
    }
    
    // Convert forward slashes to backslashes
    normalized = normalized.replace(/\//g, '\\');
    
    return normalized;
  }

  private getFilenameFromPath(pathname: string): string {
    const lastSlash = Math.max(pathname.lastIndexOf('\\'), pathname.lastIndexOf('/'));
    return lastSlash >= 0 ? pathname.substring(lastSlash + 1) : pathname;
  }

  /**
   * Get list of virtual files (for debugging)
   */
  getVirtualFiles(): string[] {
    return Array.from(this.virtualFiles.keys());
  }

  /**
   * Add a virtual file (for testing)
   */
  addVirtualFile(pathname: string, content: string | ArrayBuffer): void {
    const normalizedPath = this.normalizePath(pathname);
    if (typeof content === 'string') {
      const encoded = new TextEncoder().encode(content);
      this.virtualFiles.set(normalizedPath, encoded.buffer);
    } else {
      this.virtualFiles.set(normalizedPath, content);
    }
  }
}

// Singleton instance
export const vb6FileSystem = new VB6FileSystem();

export default vb6FileSystem;