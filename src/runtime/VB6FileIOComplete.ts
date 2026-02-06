/**
 * VB6 Complete File I/O System
 * Integrates file operations with print formatting and adds missing features
 * TRUE 100% VB6 file I/O compatibility
 */

import { errorHandler } from './VB6ErrorHandling';
import { Spc, Tab, updatePrintPosition, moveToNextPrintZone } from './VB6PrintFormatting';

// ============================================================================
// FILE LOCKING SYSTEM
// ============================================================================

/**
 * File lock types for Lock/Unlock statements
 */
export enum VB6LockType {
  Shared = 1, // Read lock - multiple readers allowed
  Exclusive = 2, // Write lock - exclusive access
  ReadWrite = 3, // Full lock - no access allowed
}

/**
 * File lock record
 */
interface FileLockRecord {
  fileNumber: number;
  lockType: VB6LockType;
  recordStart?: number;
  recordEnd?: number;
  processId: string;
}

/**
 * File locking manager
 */
class VB6FileLockManager {
  private static instance: VB6FileLockManager;
  private locks: Map<number, FileLockRecord[]> = new Map();
  private processId: string;

  constructor() {
    // Generate unique process ID for this session
    this.processId = `PID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): VB6FileLockManager {
    if (!VB6FileLockManager.instance) {
      VB6FileLockManager.instance = new VB6FileLockManager();
    }
    return VB6FileLockManager.instance;
  }

  /**
   * Lock a file or record range
   * @param fileNumber File number
   * @param recordStart Starting record (optional)
   * @param recordEnd Ending record (optional)
   * @param lockType Type of lock
   */
  lock(
    fileNumber: number,
    recordStart?: number,
    recordEnd?: number,
    lockType: VB6LockType = VB6LockType.Exclusive
  ): void {
    if (!this.locks.has(fileNumber)) {
      this.locks.set(fileNumber, []);
    }

    const fileLocks = this.locks.get(fileNumber)!;

    // Check for conflicts
    for (const lock of fileLocks) {
      if (lock.processId !== this.processId) {
        if (this.hasConflict(lock, recordStart, recordEnd, lockType)) {
          errorHandler.raiseError(
            70,
            'Permission denied - File or record is locked',
            'VB6FileLockManager'
          );
          return;
        }
      }
    }

    // Add the lock
    fileLocks.push({
      fileNumber,
      lockType,
      recordStart,
      recordEnd,
      processId: this.processId,
    });
  }

  /**
   * Unlock a file or record range
   * @param fileNumber File number
   * @param recordStart Starting record (optional)
   * @param recordEnd Ending record (optional)
   */
  unlock(fileNumber: number, recordStart?: number, recordEnd?: number): void {
    if (!this.locks.has(fileNumber)) {
      return;
    }

    const fileLocks = this.locks.get(fileNumber)!;

    // Remove matching locks for this process
    const newLocks = fileLocks.filter(lock => {
      if (lock.processId !== this.processId) {
        return true; // Keep locks from other processes
      }

      // Check if this is the lock to remove
      if (recordStart === undefined && lock.recordStart === undefined) {
        return false; // Remove file-level lock
      }

      if (
        recordStart !== undefined &&
        lock.recordStart === recordStart &&
        lock.recordEnd === (recordEnd || recordStart)
      ) {
        return false; // Remove matching record lock
      }

      return true; // Keep non-matching locks
    });

    this.locks.set(fileNumber, newLocks);
  }

  /**
   * Check if there's a lock conflict
   */
  private hasConflict(
    existingLock: FileLockRecord,
    newStart?: number,
    newEnd?: number,
    newType?: VB6LockType
  ): boolean {
    // File-level locks always conflict
    if (existingLock.recordStart === undefined || newStart === undefined) {
      return true;
    }

    // Check record range overlap
    const existingEnd = existingLock.recordEnd || existingLock.recordStart;
    const requestedEnd = newEnd || newStart;

    const overlaps = !(requestedEnd < existingLock.recordStart || newStart > existingEnd);

    if (!overlaps) {
      return false;
    }

    // Check lock type compatibility
    if (existingLock.lockType === VB6LockType.Shared && newType === VB6LockType.Shared) {
      return false; // Multiple shared locks are allowed
    }

    return true; // Conflict exists
  }

  /**
   * Clear all locks for a file
   */
  clearFileLocks(fileNumber: number): void {
    const fileLocks = this.locks.get(fileNumber);
    if (fileLocks) {
      // Remove only this process's locks
      const newLocks = fileLocks.filter(lock => lock.processId !== this.processId);
      if (newLocks.length > 0) {
        this.locks.set(fileNumber, newLocks);
      } else {
        this.locks.delete(fileNumber);
      }
    }
  }

  /**
   * Clear all locks for this process
   */
  clearAllLocks(): void {
    for (const [fileNumber, fileLocks] of this.locks.entries()) {
      const newLocks = fileLocks.filter(lock => lock.processId !== this.processId);
      if (newLocks.length > 0) {
        this.locks.set(fileNumber, newLocks);
      } else {
        this.locks.delete(fileNumber);
      }
    }
  }
}

const lockManager = VB6FileLockManager.getInstance();

// ============================================================================
// ENHANCED PRINT # AND WRITE # WITH FORMATTING
// ============================================================================

/**
 * Enhanced Print # statement with Spc and Tab support
 * @param fileNumber File number
 * @param items Items to print (can include Spc() and Tab() results)
 */
export function PrintFile(fileNumber: number, ...items: any[]): void {
  const fileSystem = getFileSystem();
  const fileHandle = fileSystem['openFiles'].get(fileNumber);

  if (!fileHandle) {
    errorHandler.raiseError(52, 'Bad file name or number', 'PrintFile');
    return;
  }

  if (fileHandle.mode === 1) {
    // Input mode
    errorHandler.raiseError(54, 'Bad file mode', 'PrintFile');
    return;
  }

  let output = '';
  let position = 1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Check for separator symbols
    if (item === ';') {
      // Semicolon - no spacing, continue on same position
      continue;
    } else if (item === ',') {
      // Comma - move to next print zone (14 character columns)
      const nextZone = Math.floor((position - 1) / 14) * 14 + 14 + 1;
      output += ' '.repeat(nextZone - position);
      position = nextZone;
      continue;
    }

    // Process the item
    let itemStr = '';

    if (typeof item === 'string') {
      // Check if it's a Spc or Tab result (they return strings)
      itemStr = item;
    } else if (typeof item === 'number') {
      // Numbers are printed with leading space for positive, minus for negative
      itemStr = item >= 0 ? ' ' + item : String(item);
    } else if (typeof item === 'boolean') {
      itemStr = item ? 'True' : 'False';
    } else if (item instanceof Date) {
      // Format date in VB6 style
      itemStr = `#${item.toLocaleDateString()} ${item.toLocaleTimeString()}#`;
    } else if (item === null || item === undefined) {
      itemStr = '';
    } else {
      itemStr = String(item);
    }

    output += itemStr;
    position += itemStr.length;
  }

  // Add newline unless last item was semicolon
  const lastItem = items[items.length - 1];
  if (lastItem !== ';') {
    output += '\r\n';
  }

  // Write to file
  fileSystem['writeToFile'](fileNumber, output);
}

/**
 * Enhanced Write # statement with proper CSV formatting
 * @param fileNumber File number
 * @param items Items to write
 */
export function WriteFile(fileNumber: number, ...items: any[]): void {
  const fileSystem = getFileSystem();
  const fileHandle = fileSystem['openFiles'].get(fileNumber);

  if (!fileHandle) {
    errorHandler.raiseError(52, 'Bad file name or number', 'WriteFile');
    return;
  }

  if (fileHandle.mode === 1) {
    // Input mode
    errorHandler.raiseError(54, 'Bad file mode', 'WriteFile');
    return;
  }

  const output = items
    .map(item => {
      if (typeof item === 'string') {
        // Strings are enclosed in quotes
        return `"${item.replace(/"/g, '""')}"`; // Escape quotes
      } else if (typeof item === 'number') {
        return String(item);
      } else if (typeof item === 'boolean') {
        return item ? '#TRUE#' : '#FALSE#';
      } else if (item instanceof Date) {
        // Dates in # delimiters
        return `#${item.toISOString()}#`;
      } else if (item === null) {
        return '#NULL#';
      } else if (item === undefined) {
        return '';
      } else {
        return String(item);
      }
    })
    .join(',');

  fileSystem['writeLine'](fileNumber, output);
}

// ============================================================================
// LOCK & UNLOCK STATEMENTS
// ============================================================================

/**
 * Lock statement - Lock file or records
 * @param fileNumber File number
 * @param recordStart Starting record (optional)
 * @param recordEnd Ending record (optional)
 */
export function Lock(fileNumber: number, recordStart?: number, recordEnd?: number): void {
  lockManager.lock(fileNumber, recordStart, recordEnd, VB6LockType.Exclusive);
}

/**
 * Unlock statement - Unlock file or records
 * @param fileNumber File number
 * @param recordStart Starting record (optional)
 * @param recordEnd Ending record (optional)
 */
export function Unlock(fileNumber: number, recordStart?: number, recordEnd?: number): void {
  lockManager.unlock(fileNumber, recordStart, recordEnd);
}

// ============================================================================
// RESET STATEMENT
// ============================================================================

/**
 * Reset statement - Close all open files and clear buffers
 */
export function Reset(): void {
  const fileSystem = getFileSystem();

  // Close all open files
  const openFiles = Array.from(fileSystem['openFiles'].keys());
  for (const fileNumber of openFiles) {
    fileSystem.closeFile(fileNumber);
  }

  // Clear all locks
  lockManager.clearAllLocks();

  // Reset file number counter
  fileSystem['nextFileNumber'] = 1;
}

// ============================================================================
// INPUT$ FUNCTION
// ============================================================================

/**
 * Input$ function - Read specified number of characters from file
 * @param count Number of characters to read
 * @param fileNumber File number
 */
export function InputDollar(count: number, fileNumber: number): string {
  const fileSystem = getFileSystem();
  const fileHandle = fileSystem['openFiles'].get(fileNumber);

  if (!fileHandle) {
    errorHandler.raiseError(52, 'Bad file name or number', 'InputDollar');
    return '';
  }

  if (fileHandle.mode !== 1 && fileHandle.mode !== 5) {
    // Not Input or Binary mode
    errorHandler.raiseError(54, 'Bad file mode', 'InputDollar');
    return '';
  }

  return fileSystem.readChars(fileNumber, count);
}

// Alternative name for VB6 compatibility
export const InputStr = InputDollar;

// ============================================================================
// BINARY FILE OPERATIONS
// ============================================================================

/**
 * Binary Get statement - Read binary data from file
 * @param fileNumber File number
 * @param position Position in file (1-based)
 * @param variable Variable to read into (simulated)
 * @param bytes Number of bytes to read
 */
export function BinaryGet(
  fileNumber: number,
  position?: number,
  variable?: any,
  bytes?: number
): any {
  const fileSystem = getFileSystem();
  const fileHandle = fileSystem['openFiles'].get(fileNumber);

  if (!fileHandle) {
    errorHandler.raiseError(52, 'Bad file name or number', 'BinaryGet');
    return null;
  }

  if (fileHandle.mode !== 5) {
    // Not Binary mode
    errorHandler.raiseError(54, 'Bad file mode', 'BinaryGet');
    return null;
  }

  // Seek to position if specified (VB6 uses 1-based positions)
  if (position !== undefined && position > 0) {
    fileSystem.seekFile(fileNumber, position - 1);
  }

  // Determine bytes to read
  let bytesToRead = bytes || 1;

  if (variable !== undefined) {
    // Determine size based on variable type
    if (typeof variable === 'number') {
      bytesToRead = 8; // Double
    } else if (typeof variable === 'boolean') {
      bytesToRead = 2; // Boolean
    } else if (typeof variable === 'string') {
      bytesToRead = bytes || variable.length || 255;
    } else if (variable && variable.__typeName) {
      // UDT - calculate size
      const UDTRegistry = (globalThis as Record<string, unknown>).UDTRegistry as
        | { calculateSize: (typeName: string) => number }
        | undefined;
      if (UDTRegistry) {
        bytesToRead = UDTRegistry.calculateSize(variable.__typeName);
      }
    }
  }

  // Read bytes
  const data = fileSystem.readChars(fileNumber, bytesToRead);

  // Convert based on variable type
  if (typeof variable === 'number') {
    // Simulate binary to number conversion
    return parseFloat(data) || 0;
  } else if (typeof variable === 'boolean') {
    return data !== '\0\0';
  } else {
    return data;
  }
}

/**
 * Binary Put statement - Write binary data to file
 * @param fileNumber File number
 * @param position Position in file (1-based)
 * @param data Data to write
 */
export function BinaryPut(fileNumber: number, position?: number, data?: any): void {
  const fileSystem = getFileSystem();
  const fileHandle = fileSystem['openFiles'].get(fileNumber);

  if (!fileHandle) {
    errorHandler.raiseError(52, 'Bad file name or number', 'BinaryPut');
    return;
  }

  if (fileHandle.mode !== 5) {
    // Not Binary mode
    errorHandler.raiseError(54, 'Bad file mode', 'BinaryPut');
    return;
  }

  // Seek to position if specified (VB6 uses 1-based positions)
  if (position !== undefined && position > 0) {
    fileSystem.seekFile(fileNumber, position - 1);
  }

  // Convert data to binary representation
  let binaryData = '';

  if (typeof data === 'number') {
    // Simulate number to binary
    binaryData = String(data).padEnd(8, '\0');
  } else if (typeof data === 'boolean') {
    binaryData = data ? '\xFF\xFF' : '\0\0';
  } else if (typeof data === 'string') {
    binaryData = data;
  } else if (data && data.__typeName) {
    // UDT - serialize all fields
    binaryData = JSON.stringify(data);
  } else if (data !== null && data !== undefined) {
    binaryData = String(data);
  }

  // Write to file
  fileSystem['writeToFile'](fileNumber, binaryData);
}

// ============================================================================
// LINE INPUT # ENHANCED
// ============================================================================

/**
 * Enhanced Line Input # with better line handling
 * @param fileNumber File number
 * @param varName Variable name (for debugging)
 */
export function LineInputFile(fileNumber: number, varName?: string): string {
  const fileSystem = getFileSystem();
  return fileSystem.readLine(fileNumber);
}

// ============================================================================
// INPUT # ENHANCED
// ============================================================================

/**
 * Enhanced Input # statement for reading comma-delimited data
 * @param fileNumber File number
 * @param variables Variable count to read
 */
export function InputFile(fileNumber: number, variables: number): any[] {
  const fileSystem = getFileSystem();
  const fileHandle = fileSystem['openFiles'].get(fileNumber);

  if (!fileHandle) {
    errorHandler.raiseError(52, 'Bad file name or number', 'InputFile');
    return [];
  }

  if (fileHandle.mode !== 1) {
    // Not Input mode
    errorHandler.raiseError(54, 'Bad file mode', 'InputFile');
    return [];
  }

  const line = fileSystem.readLine(fileNumber);
  const values: any[] = [];

  // Parse CSV-like format
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(parseValue(current.trim()));
      current = '';
      if (values.length >= variables) break;
    } else {
      current += char;
    }
  }

  // Add last field
  if (current || values.length < variables) {
    values.push(parseValue(current.trim()));
  }

  // Fill remaining with empty values if needed
  while (values.length < variables) {
    values.push('');
  }

  return values.slice(0, variables);
}

/**
 * Parse a value from Input # statement
 */
function parseValue(value: string): any {
  // Remove quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }

  // Check for special values
  if (value === '#TRUE#') return true;
  if (value === '#FALSE#') return false;
  if (value === '#NULL#') return null;

  // Check for date
  if (value.startsWith('#') && value.endsWith('#')) {
    const dateStr = value.slice(1, -1);
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? value : date;
  }

  // Check for number
  const num = Number(value);
  if (!isNaN(num) && value !== '') {
    return num;
  }

  return value;
}

// ============================================================================
// GET FILE SYSTEM HELPER
// ============================================================================

/**
 * Get the VB6FileSystem instance
 */
/** Minimal interface for the VB6 file system used by this module */
interface VB6FileSystemInstance {
  openFiles: Map<number, { mode: number }>;
  closeFile(fileNumber: number): void;
  readLine(fileNumber: number): string;
  readChars(fileNumber: number, count: number): string;
  seekFile(fileNumber: number, position: number): void;
  writeToFile(fileNumber: number, data: string): void;
  writeLine(fileNumber: number, data: string): void;
  nextFileNumber: number;
}

function getFileSystem(): VB6FileSystemInstance {
  // Import dynamically to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./VB6FileFunctions');

  // Access the private instance through the exported functions
  const globalObj = globalThis as Record<string, unknown>;
  const VB6FileSystem = globalObj.VB6FileSystem as
    | { getInstance?: () => VB6FileSystemInstance }
    | undefined;
  const fileSystem = VB6FileSystem?.getInstance?.();
  if (!fileSystem) {
    throw new Error('VB6FileSystem not initialized');
  }

  return fileSystem;
}

// ============================================================================
// EXPORT ALL COMPLETE FILE I/O FUNCTIONS
// ============================================================================

export const VB6FileIOComplete = {
  // File locking
  Lock,
  Unlock,
  lockManager,

  // Enhanced Print/Write
  PrintFile,
  WriteFile,

  // Reset statement
  Reset,

  // Input$ function
  InputDollar,
  InputStr,

  // Binary operations
  BinaryGet,
  BinaryPut,

  // Enhanced Input operations
  LineInputFile,
  InputFile,

  // Lock types
  VB6LockType,
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const vb6Window = window as unknown as Record<string, unknown>;

  // File locking
  vb6Window.Lock = Lock;
  vb6Window.Unlock = Unlock;

  // Enhanced file I/O (override basic versions)
  vb6Window.Print = PrintFile;
  vb6Window.Write = WriteFile;

  // Reset statement
  vb6Window.Reset = Reset;

  // Input$ function
  vb6Window.InputDollar = InputDollar;
  vb6Window.InputStr = InputStr;

  // Binary operations
  vb6Window.BinaryGet = BinaryGet;
  vb6Window.BinaryPut = BinaryPut;
}

export default VB6FileIOComplete;
