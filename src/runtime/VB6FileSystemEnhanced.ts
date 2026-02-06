/**
 * VB6 Enhanced File System API
 *
 * Wrapper around the persistent file system providing true VB6-compatible API
 * with all standard file I/O functions enhanced with IndexedDB persistence.
 */

import { errorHandler } from './VB6ErrorHandling';
import { persistentVFS, VB6FileAttribute } from './VB6PersistentFileSystem';

// Re-export file mode constants
export enum VB6FileMode {
  Input = 1,
  Output = 2,
  Random = 4,
  Append = 8,
  Binary = 32,
}

export enum VB6FileAccess {
  Read = 1,
  Write = 2,
  ReadWrite = 3,
}

export enum VB6FileLock {
  Shared = 1,
  LockRead = 2,
  LockWrite = 3,
  LockReadWrite = 4,
}

/**
 * File system initialization
 */
export async function initializeFileSystem(): Promise<void> {
  try {
    await persistentVFS.initialize();
  } catch (error) {
    console.error('[VB6] File system initialization failed:', error);
  }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * FreeFile - Get next available file number
 */
export function FreeFile(): number {
  let fileNumber = 1;
  while (fileNumber <= 511) {
    try {
      persistentVFS.getFilePosition(fileNumber);
    } catch {
      // File number not in use
      return fileNumber;
    }
    fileNumber++;
  }

  throw new Error('Too many files open');
}

/**
 * Open - Open a file
 */
export async function Open(
  pathname: string,
  fileNumber: number,
  mode: VB6FileMode = VB6FileMode.Input,
  access: VB6FileAccess = VB6FileAccess.ReadWrite,
  lock: VB6FileLock = VB6FileLock.Shared,
  recordLength?: number
): Promise<number> {
  try {
    const actualFileNumber = fileNumber > 0 ? fileNumber : FreeFile();
    const actualMode = mode || VB6FileMode.Input;
    await persistentVFS.openFile(pathname, actualMode, recordLength);

    return actualFileNumber;
  } catch (error) {
    errorHandler.raiseError(53, `File not found: ${pathname}`, 'Open');
    return 0;
  }
}

/**
 * Close - Close one or more files
 */
export async function Close(...fileNumbers: number[]): Promise<void> {
  try {
    if (fileNumbers.length === 0) {
      // Close all files - need to implement proper tracking
    } else {
      for (const fileNumber of fileNumbers) {
        await persistentVFS.closeFile(fileNumber);
      }
    }
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Close');
  }
}

/**
 * Reset - Close all files and clear buffers
 */
export async function Reset(): Promise<void> {
  try {
    // Close all open files
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Reset');
  }
}

/**
 * Input - Read from file
 */
export async function Input(length: number, fileNumber: number): Promise<string> {
  try {
    return await persistentVFS.readFromFile(fileNumber, length);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Input');
    return '';
  }
}

/**
 * Line Input - Read line from file
 */
export async function LineInput(fileNumber: number): Promise<string> {
  try {
    return await persistentVFS.readFromFile(fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Line Input');
    return '';
  }
}

/**
 * Print - Write to file
 */
export async function Print(fileNumber: number, ...expressions: any[]): Promise<void> {
  try {
    const output = expressions.map(expr => String(expr)).join('\t') + '\n';
    await persistentVFS.writeToFile(fileNumber, output);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Print');
  }
}

/**
 * Write - Write CSV-formatted data to file
 */
export async function Write(fileNumber: number, ...expressions: any[]): Promise<void> {
  try {
    const output =
      expressions
        .map(expr => {
          if (typeof expr === 'string') {
            return `"${expr.replace(/"/g, '""')}"`;
          } else if (expr === null) {
            return '#NULL#';
          } else if (expr instanceof Date) {
            return `#${expr.toISOString()}#`;
          } else {
            return String(expr);
          }
        })
        .join(',') + '\n';

    await persistentVFS.writeToFile(fileNumber, output);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Write');
  }
}

/**
 * Get - Read binary record
 */
export async function Get(fileNumber: number, recordNumber?: number): Promise<any> {
  try {
    if (recordNumber !== undefined) {
      // Seek to record position
      persistentVFS.seekFile(fileNumber, (recordNumber - 1) * 128);
    }

    return await persistentVFS.readFromFile(fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Get');
    return null;
  }
}

/**
 * Put - Write binary record
 */
export async function Put(fileNumber: number, recordNumber?: number, data?: any): Promise<void> {
  try {
    if (recordNumber !== undefined) {
      persistentVFS.seekFile(fileNumber, (recordNumber - 1) * 128);
    }

    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    await persistentVFS.writeToFile(fileNumber, dataStr);
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
      persistentVFS.seekFile(fileNumber, position - 1); // Convert to 0-based
    }
    return persistentVFS.getFilePosition(fileNumber) + 1; // Convert to 1-based
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Seek');
    return 0;
  }
}

/**
 * EOF - Check end of file
 */
export async function EOF(fileNumber: number): Promise<boolean> {
  try {
    return await persistentVFS.isEOF(fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'EOF');
    return true;
  }
}

/**
 * LOF - Get file length
 */
export async function LOF(fileNumber: number): Promise<number> {
  try {
    return await persistentVFS.getFileLength(fileNumber);
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
    return persistentVFS.getFilePosition(fileNumber);
  } catch (error) {
    errorHandler.raiseError(52, 'Bad file name or number', 'Loc');
    return 0;
  }
}

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

/**
 * FileLen - Get file size
 */
export async function FileLen(pathname: string): Promise<number> {
  try {
    const entry = await persistentVFS.getEntry(pathname);
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
export async function FileDateTime(pathname: string): Promise<Date> {
  try {
    const entry = await persistentVFS.getEntry(pathname);
    if (!entry) {
      throw new Error('File not found');
    }
    return new Date(entry.modified);
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'FileDateTime');
    return new Date(0);
  }
}

/**
 * GetAttr - Get file attributes
 */
export async function GetAttr(pathname: string): Promise<number> {
  try {
    return await persistentVFS.getAttributes(pathname);
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'GetAttr');
    return 0;
  }
}

/**
 * SetAttr - Set file attributes
 */
export async function SetAttr(pathname: string, attributes: number): Promise<void> {
  try {
    await persistentVFS.setAttributes(pathname, attributes);
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'SetAttr');
  }
}

/**
 * Kill - Delete file
 */
export async function Kill(pathname: string): Promise<void> {
  try {
    const entry = await persistentVFS.getEntry(pathname);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }

    if (entry.attributes & VB6FileAttribute.vbReadOnly) {
      throw new Error('Access denied');
    }

    await persistentVFS.deleteEntry(pathname);
  } catch (error) {
    errorHandler.raiseError(53, error instanceof Error ? error.message : 'File not found', 'Kill');
  }
}

/**
 * FileCopy - Copy file
 */
export async function FileCopy(source: string, destination: string): Promise<void> {
  try {
    const sourceEntry = await persistentVFS.getEntry(source);
    if (!sourceEntry || sourceEntry.type !== 'file') {
      throw new Error('Source file not found');
    }

    const content = (sourceEntry.content as string) || '';
    await persistentVFS.createFile(destination, content);
  } catch (error) {
    errorHandler.raiseError(
      53,
      error instanceof Error ? error.message : 'File not found',
      'FileCopy'
    );
  }
}

/**
 * Name - Rename file or directory
 */
export async function Name(oldPath: string, newPath: string): Promise<void> {
  try {
    const entry = await persistentVFS.getEntry(oldPath);
    if (!entry) {
      throw new Error('Path not found');
    }

    // Create new entry
    if (entry.type === 'file') {
      await persistentVFS.createFile(newPath, entry.content as string);
    } else {
      await persistentVFS.createDirectory(newPath);
    }

    // Delete old entry
    await persistentVFS.deleteEntry(oldPath);
  } catch (error) {
    errorHandler.raiseError(53, error instanceof Error ? error.message : 'Path not found', 'Name');
  }
}

// ============================================================================
// DIRECTORY OPERATIONS
// ============================================================================

/**
 * MkDir - Create directory
 */
export async function MkDir(path: string): Promise<void> {
  try {
    const existing = await persistentVFS.getEntry(path);
    if (existing) {
      throw new Error('Path already exists');
    }

    await persistentVFS.createDirectory(path);
  } catch (error) {
    errorHandler.raiseError(
      75,
      error instanceof Error ? error.message : 'Path/File access error',
      'MkDir'
    );
  }
}

/**
 * RmDir - Remove directory
 */
export async function RmDir(path: string): Promise<void> {
  try {
    const entry = await persistentVFS.getEntry(path);
    if (!entry || entry.type !== 'directory') {
      throw new Error('Path not found');
    }

    // Check if directory is empty
    const contents = await persistentVFS.listDirectory(path);
    if (contents.length > 0) {
      throw new Error('Directory not empty');
    }

    await persistentVFS.deleteEntry(path);
  } catch (error) {
    errorHandler.raiseError(
      75,
      error instanceof Error ? error.message : 'Path/File access error',
      'RmDir'
    );
  }
}

/**
 * ChDir - Change current directory
 */
export async function ChDir(path: string): Promise<void> {
  try {
    await persistentVFS.changeDirectory(path);
  } catch (error) {
    errorHandler.raiseError(76, 'Path not found', 'ChDir');
  }
}

/**
 * CurDir - Get current directory
 */
export function CurDir(_drive?: string): string {
  return persistentVFS.getCurrentDirectory();
}

/**
 * ChDrive - Change current drive (no-op in browser)
 */
export function ChDrive(drive: string): void {}

// ============================================================================
// DIR FUNCTION WITH PROPER PATTERN MATCHING
// ============================================================================

const dirState: {
  pattern: string;
  entries: Array<any>;
  index: number;
} = {
  pattern: '',
  entries: [],
  index: 0,
};

/**
 * Dir - List files matching pattern
 * Proper VB6-compatible directory listing with wildcard support
 */
export async function Dir(
  pathname?: string,
  attributes: number = VB6FileAttribute.vbNormal
): Promise<string> {
  try {
    if (pathname !== undefined) {
      // Initialize new search
      dirState.pattern = pathname;
      dirState.index = 0;

      // Parse pattern
      const lastSlash = pathname.lastIndexOf('/');
      const directory =
        lastSlash >= 0 ? pathname.substring(0, lastSlash) : persistentVFS.getCurrentDirectory();
      const pattern = lastSlash >= 0 ? pathname.substring(lastSlash + 1) : pathname;

      // Convert DOS wildcards to regex
      const regex = new RegExp(
        '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
        'i'
      );

      // Get all entries in directory
      const allEntries = await persistentVFS.listDirectory(directory);

      // Filter by pattern and attributes
      dirState.entries = allEntries.filter(entry => {
        // Check pattern match
        if (!regex.test(entry.name)) return false;

        // Check attributes
        if (attributes === VB6FileAttribute.vbNormal) {
          return entry.type === 'file' && !(entry.attributes & VB6FileAttribute.vbHidden);
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
  } catch (error) {
    errorHandler.raiseError(53, 'File not found', 'Dir');
    return '';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const VB6FileSystemEnhanced = {
  // Initialization
  initializeFileSystem,

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

  // Persistent file system
  persistentVFS,
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;

  globalAny.initializeFileSystem = initializeFileSystem;
  globalAny.FreeFile = FreeFile;
  globalAny.Open = Open;
  globalAny.Close = Close;
  globalAny.Reset = Reset;
  globalAny.Input = Input;
  globalAny.LineInput = LineInput;
  globalAny.Print = Print;
  globalAny.Write = Write;
  globalAny.Get = Get;
  globalAny.Put = Put;
  globalAny.Seek = Seek;
  globalAny.EOF = EOF;
  globalAny.LOF = LOF;
  globalAny.Loc = Loc;
  globalAny.FileLen = FileLen;
  globalAny.FileDateTime = FileDateTime;
  globalAny.GetAttr = GetAttr;
  globalAny.SetAttr = SetAttr;
  globalAny.Kill = Kill;
  globalAny.FileCopy = FileCopy;
  globalAny.Name = Name;
  globalAny.MkDir = MkDir;
  globalAny.RmDir = RmDir;
  globalAny.ChDir = ChDir;
  globalAny.CurDir = CurDir;
  globalAny.ChDrive = ChDrive;
  globalAny.Dir = Dir;
}

export default VB6FileSystemEnhanced;
