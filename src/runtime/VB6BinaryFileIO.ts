/**
 * VB6 Binary File I/O
 * Complete implementation of VB6 binary file operations
 * using browser-compatible APIs
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BinaryFileHandle {
  fileNumber: number;
  mode: 'Binary' | 'Random';
  recordLength: number;
  data: ArrayBuffer;
  dataView: DataView;
  position: number;
  fileName: string;
  isOpen: boolean;
}

export interface UserDefinedType {
  [field: string]: number | string | boolean | Uint8Array;
}

// ============================================================================
// Binary File Manager
// ============================================================================

class VB6BinaryFileManager {
  private openFiles: Map<number, BinaryFileHandle> = new Map();
  private storage: Map<string, ArrayBuffer> = new Map();

  /**
   * Open file for binary access
   */
  openBinary(
    fileName: string,
    fileNumber: number,
    recordLength: number = 1
  ): void {
    if (this.openFiles.has(fileNumber)) {
      throw new Error(`File number ${fileNumber} is already open`);
    }

    // Try to load existing file from storage
    let data = this.storage.get(fileName);
    if (!data) {
      data = new ArrayBuffer(0);
    }

    const handle: BinaryFileHandle = {
      fileNumber,
      mode: 'Binary',
      recordLength,
      data,
      dataView: new DataView(data),
      position: 0,
      fileName,
      isOpen: true
    };

    this.openFiles.set(fileNumber, handle);
  }

  /**
   * Open file for random access
   */
  openRandom(
    fileName: string,
    fileNumber: number,
    recordLength: number
  ): void {
    if (this.openFiles.has(fileNumber)) {
      throw new Error(`File number ${fileNumber} is already open`);
    }

    let data = this.storage.get(fileName);
    if (!data) {
      data = new ArrayBuffer(0);
    }

    const handle: BinaryFileHandle = {
      fileNumber,
      mode: 'Random',
      recordLength,
      data,
      dataView: new DataView(data),
      position: 0,
      fileName,
      isOpen: true
    };

    this.openFiles.set(fileNumber, handle);
  }

  /**
   * Close file
   */
  close(fileNumber: number): void {
    const handle = this.openFiles.get(fileNumber);
    if (handle) {
      // Save data to storage
      this.storage.set(handle.fileName, handle.data);
      handle.isOpen = false;
      this.openFiles.delete(fileNumber);
    }
  }

  /**
   * Close all files
   */
  closeAll(): void {
    for (const [fileNumber] of this.openFiles) {
      this.close(fileNumber);
    }
  }

  /**
   * Get file handle
   */
  getHandle(fileNumber: number): BinaryFileHandle {
    const handle = this.openFiles.get(fileNumber);
    if (!handle) {
      throw new Error(`File number ${fileNumber} is not open`);
    }
    return handle;
  }

  /**
   * Seek to position
   */
  seek(fileNumber: number, position: number): void {
    const handle = this.getHandle(fileNumber);
    handle.position = position - 1; // VB6 uses 1-based positions
  }

  /**
   * Get current position
   */
  loc(fileNumber: number): number {
    const handle = this.getHandle(fileNumber);
    if (handle.mode === 'Random') {
      return Math.floor(handle.position / handle.recordLength) + 1;
    }
    return handle.position + 1;
  }

  /**
   * Get file length
   */
  lof(fileNumber: number): number {
    const handle = this.getHandle(fileNumber);
    return handle.data.byteLength;
  }

  /**
   * Ensure buffer has enough space
   */
  private ensureCapacity(handle: BinaryFileHandle, requiredSize: number): void {
    if (handle.data.byteLength < requiredSize) {
      const newData = new ArrayBuffer(requiredSize);
      const newView = new Uint8Array(newData);
      const oldView = new Uint8Array(handle.data);
      newView.set(oldView);
      handle.data = newData;
      handle.dataView = new DataView(newData);
    }
  }

  /**
   * Put bytes at current position
   */
  putBytes(fileNumber: number, bytes: Uint8Array, recordNumber?: number): void {
    const handle = this.getHandle(fileNumber);

    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + bytes.length);

    const view = new Uint8Array(handle.data);
    view.set(bytes, position);

    handle.position = position + bytes.length;
  }

  /**
   * Get bytes from current position
   */
  getBytes(fileNumber: number, length: number, recordNumber?: number): Uint8Array {
    const handle = this.getHandle(fileNumber);

    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const actualLength = Math.min(length, handle.data.byteLength - position);
    const result = new Uint8Array(actualLength);
    const view = new Uint8Array(handle.data);
    result.set(view.slice(position, position + actualLength));

    handle.position = position + actualLength;
    return result;
  }

  /**
   * Put integer (2 bytes)
   */
  putInteger(fileNumber: number, value: number, recordNumber?: number): void {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + 2);
    handle.dataView.setInt16(position, value, true); // Little-endian
    handle.position = position + 2;
  }

  /**
   * Get integer (2 bytes)
   */
  getInteger(fileNumber: number, recordNumber?: number): number {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const value = handle.dataView.getInt16(position, true);
    handle.position = position + 2;
    return value;
  }

  /**
   * Put long (4 bytes)
   */
  putLong(fileNumber: number, value: number, recordNumber?: number): void {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + 4);
    handle.dataView.setInt32(position, value, true);
    handle.position = position + 4;
  }

  /**
   * Get long (4 bytes)
   */
  getLong(fileNumber: number, recordNumber?: number): number {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const value = handle.dataView.getInt32(position, true);
    handle.position = position + 4;
    return value;
  }

  /**
   * Put single (4 bytes float)
   */
  putSingle(fileNumber: number, value: number, recordNumber?: number): void {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + 4);
    handle.dataView.setFloat32(position, value, true);
    handle.position = position + 4;
  }

  /**
   * Get single (4 bytes float)
   */
  getSingle(fileNumber: number, recordNumber?: number): number {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const value = handle.dataView.getFloat32(position, true);
    handle.position = position + 4;
    return value;
  }

  /**
   * Put double (8 bytes float)
   */
  putDouble(fileNumber: number, value: number, recordNumber?: number): void {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + 8);
    handle.dataView.setFloat64(position, value, true);
    handle.position = position + 8;
  }

  /**
   * Get double (8 bytes float)
   */
  getDouble(fileNumber: number, recordNumber?: number): number {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const value = handle.dataView.getFloat64(position, true);
    handle.position = position + 8;
    return value;
  }

  /**
   * Put byte
   */
  putByte(fileNumber: number, value: number, recordNumber?: number): void {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + 1);
    handle.dataView.setUint8(position, value);
    handle.position = position + 1;
  }

  /**
   * Get byte
   */
  getByte(fileNumber: number, recordNumber?: number): number {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const value = handle.dataView.getUint8(position);
    handle.position = position + 1;
    return value;
  }

  /**
   * Put boolean (2 bytes, VB6 style)
   */
  putBoolean(fileNumber: number, value: boolean, recordNumber?: number): void {
    this.putInteger(fileNumber, value ? -1 : 0, recordNumber);
  }

  /**
   * Get boolean (2 bytes, VB6 style)
   */
  getBoolean(fileNumber: number, recordNumber?: number): boolean {
    return this.getInteger(fileNumber, recordNumber) !== 0;
  }

  /**
   * Put fixed-length string
   */
  putFixedString(
    fileNumber: number,
    value: string,
    length: number,
    recordNumber?: number
  ): void {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + length);

    const view = new Uint8Array(handle.data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);

    // Copy string bytes, pad with spaces if needed
    for (let i = 0; i < length; i++) {
      view[position + i] = i < encoded.length ? encoded[i] : 32; // Space padding
    }

    handle.position = position + length;
  }

  /**
   * Get fixed-length string
   */
  getFixedString(
    fileNumber: number,
    length: number,
    recordNumber?: number
  ): string {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const view = new Uint8Array(handle.data);
    const bytes = view.slice(position, position + length);
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);

    handle.position = position + length;
    return result.replace(/\0+$/, ''); // Remove trailing nulls
  }

  /**
   * Put variable-length string (with length prefix)
   */
  putString(fileNumber: number, value: string, recordNumber?: number): void {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);

    this.putInteger(fileNumber, encoded.length, recordNumber);
    this.putBytes(fileNumber, encoded);
  }

  /**
   * Get variable-length string
   */
  getString(fileNumber: number, recordNumber?: number): string {
    const length = this.getInteger(fileNumber, recordNumber);
    const bytes = this.getBytes(fileNumber, length);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * Put Currency (8 bytes, scaled integer)
   */
  putCurrency(fileNumber: number, value: number, recordNumber?: number): void {
    // VB6 Currency is stored as 8-byte integer scaled by 10000
    const scaled = BigInt(Math.round(value * 10000));
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    this.ensureCapacity(handle, position + 8);
    handle.dataView.setBigInt64(position, scaled, true);
    handle.position = position + 8;
  }

  /**
   * Get Currency (8 bytes, scaled integer)
   */
  getCurrency(fileNumber: number, recordNumber?: number): number {
    const handle = this.getHandle(fileNumber);
    let position = handle.position;
    if (recordNumber !== undefined) {
      position = (recordNumber - 1) * handle.recordLength;
    }

    const scaled = handle.dataView.getBigInt64(position, true);
    handle.position = position + 8;
    return Number(scaled) / 10000;
  }

  /**
   * Put Date (8 bytes double)
   */
  putDate(fileNumber: number, value: Date, recordNumber?: number): void {
    // VB6 dates are stored as OLE Automation dates (double)
    const oleDate = this.dateToOleDate(value);
    this.putDouble(fileNumber, oleDate, recordNumber);
  }

  /**
   * Get Date (8 bytes double)
   */
  getDate(fileNumber: number, recordNumber?: number): Date {
    const oleDate = this.getDouble(fileNumber, recordNumber);
    return this.oleDateToDate(oleDate);
  }

  /**
   * Convert JavaScript Date to OLE Automation date
   */
  private dateToOleDate(date: Date): number {
    // OLE date: days since Dec 30, 1899
    const oleEpoch = new Date(1899, 11, 30).getTime();
    const msPerDay = 86400000;
    return (date.getTime() - oleEpoch) / msPerDay;
  }

  /**
   * Convert OLE Automation date to JavaScript Date
   */
  private oleDateToDate(oleDate: number): Date {
    const oleEpoch = new Date(1899, 11, 30).getTime();
    const msPerDay = 86400000;
    return new Date(oleEpoch + oleDate * msPerDay);
  }

  /**
   * Put user-defined type (record)
   */
  putRecord(
    fileNumber: number,
    record: UserDefinedType,
    schema: RecordSchema,
    recordNumber?: number
  ): void {
    for (const field of schema.fields) {
      const value = record[field.name];

      switch (field.type) {
        case 'Integer':
          this.putInteger(fileNumber, value as number);
          break;
        case 'Long':
          this.putLong(fileNumber, value as number);
          break;
        case 'Single':
          this.putSingle(fileNumber, value as number);
          break;
        case 'Double':
          this.putDouble(fileNumber, value as number);
          break;
        case 'Byte':
          this.putByte(fileNumber, value as number);
          break;
        case 'Boolean':
          this.putBoolean(fileNumber, value as boolean);
          break;
        case 'Currency':
          this.putCurrency(fileNumber, value as number);
          break;
        case 'Date':
          this.putDate(fileNumber, value as Date);
          break;
        case 'String':
          if (field.length) {
            this.putFixedString(fileNumber, value as string, field.length);
          } else {
            this.putString(fileNumber, value as string);
          }
          break;
        case 'Bytes':
          this.putBytes(fileNumber, value as Uint8Array);
          break;
      }
    }
  }

  /**
   * Get user-defined type (record)
   */
  getRecord(
    fileNumber: number,
    schema: RecordSchema,
    recordNumber?: number
  ): UserDefinedType {
    const record: UserDefinedType = {};

    if (recordNumber !== undefined) {
      this.seek(fileNumber, (recordNumber - 1) * schema.totalLength + 1);
    }

    for (const field of schema.fields) {
      switch (field.type) {
        case 'Integer':
          record[field.name] = this.getInteger(fileNumber);
          break;
        case 'Long':
          record[field.name] = this.getLong(fileNumber);
          break;
        case 'Single':
          record[field.name] = this.getSingle(fileNumber);
          break;
        case 'Double':
          record[field.name] = this.getDouble(fileNumber);
          break;
        case 'Byte':
          record[field.name] = this.getByte(fileNumber);
          break;
        case 'Boolean':
          record[field.name] = this.getBoolean(fileNumber);
          break;
        case 'Currency':
          record[field.name] = this.getCurrency(fileNumber);
          break;
        case 'Date':
          record[field.name] = this.getDate(fileNumber);
          break;
        case 'String':
          if (field.length) {
            record[field.name] = this.getFixedString(fileNumber, field.length);
          } else {
            record[field.name] = this.getString(fileNumber);
          }
          break;
        case 'Bytes':
          record[field.name] = this.getBytes(fileNumber, field.length || 0);
          break;
      }
    }

    return record;
  }

  /**
   * Load file from external source
   */
  loadFromArrayBuffer(fileName: string, data: ArrayBuffer): void {
    this.storage.set(fileName, data);
  }

  /**
   * Get file as ArrayBuffer
   */
  getAsArrayBuffer(fileName: string): ArrayBuffer | undefined {
    return this.storage.get(fileName);
  }

  /**
   * Export file to download
   */
  exportToDownload(fileName: string): void {
    const data = this.storage.get(fileName);
    if (data) {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

// ============================================================================
// Record Schema Definition
// ============================================================================

export interface RecordField {
  name: string;
  type:
    | 'Integer'
    | 'Long'
    | 'Single'
    | 'Double'
    | 'Byte'
    | 'Boolean'
    | 'Currency'
    | 'Date'
    | 'String'
    | 'Bytes';
  length?: number; // For fixed-length strings and byte arrays
}

export interface RecordSchema {
  name: string;
  fields: RecordField[];
  totalLength: number;
}

/**
 * Create a record schema from field definitions
 */
export function CreateRecordSchema(
  name: string,
  fields: RecordField[]
): RecordSchema {
  let totalLength = 0;

  for (const field of fields) {
    switch (field.type) {
      case 'Byte':
        totalLength += 1;
        break;
      case 'Integer':
      case 'Boolean':
        totalLength += 2;
        break;
      case 'Long':
      case 'Single':
        totalLength += 4;
        break;
      case 'Double':
      case 'Currency':
      case 'Date':
        totalLength += 8;
        break;
      case 'String':
        totalLength += field.length ? field.length : 2; // Length prefix
        break;
      case 'Bytes':
        totalLength += field.length || 0;
        break;
    }
  }

  return { name, fields, totalLength };
}

// ============================================================================
// Global Instance
// ============================================================================

export const binaryFileManager = new VB6BinaryFileManager();

// ============================================================================
// VB6 Compatible Functions
// ============================================================================

/**
 * Open file for binary access
 */
export function OpenBinary(
  fileName: string,
  fileNumber: number,
  recordLength: number = 1
): void {
  binaryFileManager.openBinary(fileName, fileNumber, recordLength);
}

/**
 * Open file for random access
 */
export function OpenRandom(
  fileName: string,
  fileNumber: number,
  recordLength: number
): void {
  binaryFileManager.openRandom(fileName, fileNumber, recordLength);
}

/**
 * Close binary file
 */
export function CloseBinary(fileNumber: number): void {
  binaryFileManager.close(fileNumber);
}

/**
 * Close all binary files
 */
export function CloseAllBinary(): void {
  binaryFileManager.closeAll();
}

/**
 * Seek to position in file
 */
export function SeekBinary(fileNumber: number, position: number): void {
  binaryFileManager.seek(fileNumber, position);
}

/**
 * Get current position
 */
export function LocBinary(fileNumber: number): number {
  return binaryFileManager.loc(fileNumber);
}

/**
 * Get file length
 */
export function LOFBinary(fileNumber: number): number {
  return binaryFileManager.lof(fileNumber);
}

/**
 * Put integer
 */
export function PutInteger(
  fileNumber: number,
  value: number,
  recordNumber?: number
): void {
  binaryFileManager.putInteger(fileNumber, value, recordNumber);
}

/**
 * Get integer
 */
export function GetInteger(fileNumber: number, recordNumber?: number): number {
  return binaryFileManager.getInteger(fileNumber, recordNumber);
}

/**
 * Put long
 */
export function PutLong(
  fileNumber: number,
  value: number,
  recordNumber?: number
): void {
  binaryFileManager.putLong(fileNumber, value, recordNumber);
}

/**
 * Get long
 */
export function GetLong(fileNumber: number, recordNumber?: number): number {
  return binaryFileManager.getLong(fileNumber, recordNumber);
}

/**
 * Put single
 */
export function PutSingle(
  fileNumber: number,
  value: number,
  recordNumber?: number
): void {
  binaryFileManager.putSingle(fileNumber, value, recordNumber);
}

/**
 * Get single
 */
export function GetSingle(fileNumber: number, recordNumber?: number): number {
  return binaryFileManager.getSingle(fileNumber, recordNumber);
}

/**
 * Put double
 */
export function PutDouble(
  fileNumber: number,
  value: number,
  recordNumber?: number
): void {
  binaryFileManager.putDouble(fileNumber, value, recordNumber);
}

/**
 * Get double
 */
export function GetDouble(fileNumber: number, recordNumber?: number): number {
  return binaryFileManager.getDouble(fileNumber, recordNumber);
}

/**
 * Put string
 */
export function PutStringBinary(
  fileNumber: number,
  value: string,
  length?: number,
  recordNumber?: number
): void {
  if (length !== undefined) {
    binaryFileManager.putFixedString(fileNumber, value, length, recordNumber);
  } else {
    binaryFileManager.putString(fileNumber, value, recordNumber);
  }
}

/**
 * Get string
 */
export function GetStringBinary(
  fileNumber: number,
  length?: number,
  recordNumber?: number
): string {
  if (length !== undefined) {
    return binaryFileManager.getFixedString(fileNumber, length, recordNumber);
  } else {
    return binaryFileManager.getString(fileNumber, recordNumber);
  }
}

/**
 * Put record (user-defined type)
 */
export function PutRecord(
  fileNumber: number,
  record: UserDefinedType,
  schema: RecordSchema,
  recordNumber?: number
): void {
  binaryFileManager.putRecord(fileNumber, record, schema, recordNumber);
}

/**
 * Get record (user-defined type)
 */
export function GetRecord(
  fileNumber: number,
  schema: RecordSchema,
  recordNumber?: number
): UserDefinedType {
  return binaryFileManager.getRecord(fileNumber, schema, recordNumber);
}

/**
 * Load file from ArrayBuffer (for file input)
 */
export function LoadBinaryFile(fileName: string, data: ArrayBuffer): void {
  binaryFileManager.loadFromArrayBuffer(fileName, data);
}

/**
 * Export file to download
 */
export function ExportBinaryFile(fileName: string): void {
  binaryFileManager.exportToDownload(fileName);
}

// ============================================================================
// Export All
// ============================================================================

export const VB6BinaryFileIO = {
  manager: binaryFileManager,
  OpenBinary,
  OpenRandom,
  CloseBinary,
  CloseAllBinary,
  SeekBinary,
  LocBinary,
  LOFBinary,
  PutInteger,
  GetInteger,
  PutLong,
  GetLong,
  PutSingle,
  GetSingle,
  PutDouble,
  GetDouble,
  PutStringBinary,
  GetStringBinary,
  PutRecord,
  GetRecord,
  CreateRecordSchema,
  LoadBinaryFile,
  ExportBinaryFile
};

export default VB6BinaryFileIO;
