/**
 * VB6 Persistent File System with IndexedDB
 *
 * Provides persistent storage for virtual files using IndexedDB with fallback to localStorage.
 * Implements full VB6 file I/O compatibility with:
 * - Persistent storage across sessions
 * - File attributes (Read-only, Hidden, System, Archive)
 * - Binary file operations (Get/Put)
 * - File locking simulation
 * - Directory navigation and listing
 * - Path normalization and security
 */

export interface PersistentVFSEntry {
  id: string; // Unique identifier
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string | ArrayBuffer;
  attributes: number; // VB6FileAttribute bitmask
  size: number;
  created: number; // Timestamp
  modified: number; // Timestamp
  accessed: number; // Timestamp
}

export interface FileHandle {
  fileNumber: number;
  path: string;
  mode: number; // VB6FileMode
  position: number;
  recordLength?: number;
  isOpen: boolean;
}

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

/**
 * Persistent Virtual File System Manager
 */
class PersistentVirtualFileSystem {
  private static instance: PersistentVirtualFileSystem;
  private db: IDBDatabase | null = null;
  private useIndexedDB: boolean = false;
  private currentDirectory: string = '/';
  private openFiles: Map<number, FileHandle> = new Map();
  private nextFileNumber: number = 1;
  private readonly DB_NAME = 'VB6FileSystem';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'files';
  private directoryCache: Map<string, PersistentVFSEntry[]> = new Map();

  private constructor() {}

  static getInstance(): PersistentVirtualFileSystem {
    if (!PersistentVirtualFileSystem.instance) {
      PersistentVirtualFileSystem.instance = new PersistentVirtualFileSystem();
    }
    return PersistentVirtualFileSystem.instance;
  }

  /**
   * Initialize the file system with IndexedDB support
   */
  async initialize(): Promise<void> {
    try {
      // Check if IndexedDB is available
      if ('indexedDB' in window) {
        this.db = await this.openIndexedDB();
        this.useIndexedDB = true;
        console.log('[VB6 VFS] IndexedDB initialized successfully');
      } else {
        console.warn('[VB6 VFS] IndexedDB not available, using localStorage fallback');
        this.useIndexedDB = false;
      }

      // Ensure system directories exist
      await this.ensureSystemDirectories();
    } catch (error) {
      console.error('[VB6 VFS] Initialization error:', error);
      this.useIndexedDB = false;
    }
  }

  /**
   * Open or create IndexedDB database
   */
  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create file store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          // Create indices for efficient queries
          store.createIndex('path', 'path', { unique: true });
          store.createIndex('directory', 'directory', { unique: false });
          store.createIndex('modified', 'modified', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure system directories exist
   */
  private async ensureSystemDirectories(): Promise<void> {
    const systemDirs = ['/', '/temp', '/documents', '/programs'];

    for (const dir of systemDirs) {
      const existing = await this.getEntry(dir);
      if (!existing) {
        await this.createDirectory(dir);
      }
    }
  }

  /**
   * Normalize and validate file paths
   */
  private normalizePath(path: string): string {
    // Convert Windows-style paths to Unix-style
    let normalized = path.replace(/\\/g, '/');

    // Convert drive letters to /drives/C etc for VB6 compatibility
    if (/^[a-zA-Z]:/.test(normalized)) {
      const driveLetter = normalized[0].toUpperCase();
      normalized = `/drives/${driveLetter}` + normalized.substring(2);
    }

    // Handle relative paths
    if (!normalized.startsWith('/')) {
      normalized = this.currentDirectory + '/' + normalized;
    }

    // Resolve . and ..
    const parts = normalized.split('/').filter(p => p !== '' && p !== '.');
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        if (resolved.length > 0) {
          resolved.pop();
        }
      } else if (this.isValidPathComponent(part)) {
        resolved.push(part);
      }
    }

    // Ensure we stay within VFS root
    const result = '/' + resolved.join('/');
    if (!result.startsWith('/') || result.includes('..')) {
      throw new Error('Invalid path: path traversal detected');
    }

    return result;
  }

  /**
   * Validate individual path components
   */
  private isValidPathComponent(component: string): boolean {
    if (!component || component.length === 0) return false;

    // Reject dangerous characters
    const dangerousPatterns = [
      /[<>:"|?*\0]/,
      /^\.+$/,
      /^\s*$/,
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

  /**
   * Create a new file
   */
  async createFile(path: string, content: string = ''): Promise<PersistentVFSEntry> {
    const normalizedPath = this.normalizePath(path);
    const now = Date.now();

    const entry: PersistentVFSEntry = {
      id: `${normalizedPath}_${now}`,
      name: normalizedPath.split('/').pop() || '',
      path: normalizedPath,
      type: 'file',
      content,
      attributes: VB6FileAttribute.vbNormal | VB6FileAttribute.vbArchive,
      size: content.length,
      created: now,
      modified: now,
      accessed: now
    };

    if (this.useIndexedDB && this.db) {
      await this.storeInIndexedDB(entry);
    } else {
      this.storeInLocalStorage(entry);
    }

    this.directoryCache.clear();
    return entry;
  }

  /**
   * Create a new directory
   */
  async createDirectory(path: string): Promise<PersistentVFSEntry> {
    const normalizedPath = this.normalizePath(path);
    const now = Date.now();

    const entry: PersistentVFSEntry = {
      id: `${normalizedPath}_dir_${now}`,
      name: normalizedPath.split('/').pop() || '',
      path: normalizedPath,
      type: 'directory',
      attributes: VB6FileAttribute.vbDirectory,
      size: 0,
      created: now,
      modified: now,
      accessed: now
    };

    if (this.useIndexedDB && this.db) {
      await this.storeInIndexedDB(entry);
    } else {
      this.storeInLocalStorage(entry);
    }

    this.directoryCache.clear();
    return entry;
  }

  /**
   * Get file or directory entry
   */
  async getEntry(path: string): Promise<PersistentVFSEntry | null> {
    const normalizedPath = this.normalizePath(path);

    if (this.useIndexedDB && this.db) {
      return await this.getFromIndexedDB(normalizedPath);
    } else {
      return this.getFromLocalStorage(normalizedPath);
    }
  }

  /**
   * Delete file or directory
   */
  async deleteEntry(path: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(path);

    if (this.useIndexedDB && this.db) {
      return await this.deleteFromIndexedDB(normalizedPath);
    } else {
      return this.deleteFromLocalStorage(normalizedPath);
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<PersistentVFSEntry[]> {
    const normalizedPath = this.normalizePath(path);

    // Check cache first
    if (this.directoryCache.has(normalizedPath)) {
      return this.directoryCache.get(normalizedPath) || [];
    }

    let entries: PersistentVFSEntry[] = [];

    if (this.useIndexedDB && this.db) {
      entries = await this.listFromIndexedDB(normalizedPath);
    } else {
      entries = this.listFromLocalStorage(normalizedPath);
    }

    this.directoryCache.set(normalizedPath, entries);
    return entries;
  }

  /**
   * Open a file
   */
  async openFile(
    path: string,
    mode: number,
    recordLength?: number
  ): Promise<number> {
    const normalizedPath = this.normalizePath(path);

    // Check if file exists
    let entry = await this.getEntry(normalizedPath);

    // Handle different file modes
    if ((mode === 1 || mode === 32) && !entry) { // Input or Binary mode
      throw new Error(`File not found: ${path}`);
    } else if (mode === 2) { // Output mode - create/truncate
      await this.createFile(normalizedPath, '');
      entry = await this.getEntry(normalizedPath);
    } else if (mode === 8) { // Append mode
      if (!entry) {
        await this.createFile(normalizedPath, '');
        entry = await this.getEntry(normalizedPath);
      }
    }

    const fileNumber = this.getNextFileNumber();

    const handle: FileHandle = {
      fileNumber,
      path: normalizedPath,
      mode,
      position: mode === 8 ? (entry?.size || 0) : 0,
      recordLength,
      isOpen: true
    };

    this.openFiles.set(fileNumber, handle);
    return fileNumber;
  }

  /**
   * Close a file
   */
  async closeFile(fileNumber: number): Promise<void> {
    const handle = this.openFiles.get(fileNumber);
    if (!handle) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    handle.isOpen = false;
    this.openFiles.delete(fileNumber);
  }

  /**
   * Read from file
   */
  async readFromFile(fileNumber: number, length?: number): Promise<string> {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    const entry = await this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }

    const content = (entry.content as string) || '';

    if (handle.mode === 32) { // Binary mode
      const bytesToRead = length || (content.length - handle.position);
      const result = content.substring(handle.position, handle.position + bytesToRead);
      handle.position += result.length;
      return result;
    } else if (handle.mode === 1) { // Input mode
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
          return line.replace(/\r$/, '');
        }
      }
    } else if (handle.mode === 4) { // Random mode
      const recordLen = handle.recordLength || 128;
      const result = content.substring(handle.position, handle.position + recordLen);
      handle.position += recordLen;
      return result.padEnd(recordLen, ' ');
    }

    return '';
  }

  /**
   * Write to file
   */
  async writeToFile(fileNumber: number, data: string): Promise<void> {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    const entry = await this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      throw new Error('File not found');
    }

    let content = (entry.content as string) || '';

    // Check for read-only attribute
    if (entry.attributes & VB6FileAttribute.vbReadOnly) {
      throw new Error('File is read-only');
    }

    if (handle.mode === 2 || handle.mode === 8) { // Output or Append
      content = content.substring(0, handle.position) + data;
      handle.position += data.length;
    } else if (handle.mode === 32) { // Binary
      const before = content.substring(0, handle.position);
      const after = content.substring(handle.position + data.length);
      content = before + data + after;
      handle.position += data.length;
    } else if (handle.mode === 4) { // Random
      const recordLen = handle.recordLength || 128;
      const paddedData = data.padEnd(recordLen, ' ').substring(0, recordLen);
      const before = content.substring(0, handle.position);
      const after = content.substring(handle.position + recordLen);
      content = before + paddedData + after;
      handle.position += recordLen;
    }

    entry.content = content;
    entry.size = content.length;
    entry.modified = Date.now();
    entry.attributes |= VB6FileAttribute.vbArchive; // Mark as archive

    if (this.useIndexedDB && this.db) {
      await this.storeInIndexedDB(entry);
    } else {
      this.storeInLocalStorage(entry);
    }

    this.directoryCache.clear();
  }

  /**
   * Seek to position in file
   */
  seekFile(fileNumber: number, position: number): void {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    handle.position = Math.max(0, position);
  }

  /**
   * Get current position in file
   */
  getFilePosition(fileNumber: number): number {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    return handle.position;
  }

  /**
   * Check end of file
   */
  async isEOF(fileNumber: number): Promise<boolean> {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    const entry = await this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      return true;
    }

    return handle.position >= (entry.size || 0);
  }

  /**
   * Get file size
   */
  async getFileLength(fileNumber: number): Promise<number> {
    const handle = this.openFiles.get(fileNumber);
    if (!handle || !handle.isOpen) {
      throw new Error(`Bad file number: ${fileNumber}`);
    }

    const entry = await this.getEntry(handle.path);
    if (!entry || entry.type !== 'file') {
      return 0;
    }

    return entry.size || 0;
  }

  /**
   * Get file attributes
   */
  async getAttributes(path: string): Promise<number> {
    const entry = await this.getEntry(path);
    if (!entry) {
      throw new Error('Path not found');
    }
    return entry.attributes;
  }

  /**
   * Set file attributes
   */
  async setAttributes(path: string, attributes: number): Promise<void> {
    const entry = await this.getEntry(path);
    if (!entry) {
      throw new Error('Path not found');
    }

    entry.attributes = attributes;

    if (this.useIndexedDB && this.db) {
      await this.storeInIndexedDB(entry);
    } else {
      this.storeInLocalStorage(entry);
    }

    this.directoryCache.clear();
  }

  /**
   * Change current directory
   */
  async changeDirectory(path: string): Promise<void> {
    const entry = await this.getEntry(path);
    if (!entry || entry.type !== 'directory') {
      throw new Error('Directory not found');
    }

    this.currentDirectory = this.normalizePath(path);
  }

  /**
   * Get current directory
   */
  getCurrentDirectory(): string {
    return this.currentDirectory;
  }

  /**
   * Get next available file number
   */
  private getNextFileNumber(): number {
    while (this.openFiles.has(this.nextFileNumber)) {
      this.nextFileNumber++;
    }
    return this.nextFileNumber++;
  }

  // ====== IndexedDB Operations ======

  private async storeInIndexedDB(entry: PersistentVFSEntry): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onerror = () => reject(new Error('Failed to store file'));
      request.onsuccess = () => resolve();
    });
  }

  private async getFromIndexedDB(path: string): Promise<PersistentVFSEntry | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('path');
      const request = index.get(path);

      request.onerror = () => reject(new Error('Failed to get file'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async listFromIndexedDB(path: string): Promise<PersistentVFSEntry[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to list directory'));
      request.onsuccess = () => {
        const entries = request.result as PersistentVFSEntry[];
        const filtered = entries.filter(entry => {
          const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
          return parentPath === path || (path === '/' && parentPath === '');
        });
        resolve(filtered);
      };
    });
  }

  private async deleteFromIndexedDB(path: string): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('path');
      const request = index.getKey(path);

      request.onerror = () => reject(new Error('Failed to delete file'));
      request.onsuccess = () => {
        if (request.result !== undefined) {
          store.delete(request.result);
          resolve(true);
        } else {
          resolve(false);
        }
      };
    });
  }

  // ====== localStorage Fallback ======

  private storeInLocalStorage(entry: PersistentVFSEntry): void {
    try {
      const key = `vb6_vfs_${entry.path}`;
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('[VB6 VFS] localStorage write failed:', error);
    }
  }

  private getFromLocalStorage(path: string): PersistentVFSEntry | null {
    try {
      const key = `vb6_vfs_${path}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[VB6 VFS] localStorage read failed:', error);
      return null;
    }
  }

  private listFromLocalStorage(path: string): PersistentVFSEntry[] {
    try {
      const entries: PersistentVFSEntry[] = [];
      const prefix = 'vb6_vfs_';

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            const entry = JSON.parse(data) as PersistentVFSEntry;
            const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
            if (parentPath === path || (path === '/' && parentPath === '')) {
              entries.push(entry);
            }
          }
        }
      }

      return entries;
    } catch (error) {
      console.error('[VB6 VFS] localStorage list failed:', error);
      return [];
    }
  }

  private deleteFromLocalStorage(path: string): boolean {
    try {
      const key = `vb6_vfs_${path}`;
      const exists = localStorage.getItem(key) !== null;
      localStorage.removeItem(key);

      // Delete all children if directory
      const prefix = `vb6_vfs_${path}/`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      }

      return exists;
    } catch (error) {
      console.error('[VB6 VFS] localStorage delete failed:', error);
      return false;
    }
  }

  /**
   * Clear all files from the file system
   */
  async clear(): Promise<void> {
    if (this.useIndexedDB && this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();
    } else {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vb6_vfs_')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    }

    this.directoryCache.clear();
    this.openFiles.clear();
    this.nextFileNumber = 1;
  }

  /**
   * Get file system statistics
   */
  async getStats(): Promise<{
    filesCount: number;
    directoriesCount: number;
    totalSize: number;
  }> {
    let entries: PersistentVFSEntry[] = [];

    if (this.useIndexedDB && this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(new Error('Failed to get stats'));
        request.onsuccess = () => {
          entries = request.result;
          resolve(this.calculateStats(entries));
        };
      });
    } else {
      try {
        const prefix = 'vb6_vfs_';
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            const data = localStorage.getItem(key);
            if (data) {
              entries.push(JSON.parse(data));
            }
          }
        }
        return this.calculateStats(entries);
      } catch (error) {
        console.error('[VB6 VFS] Failed to get stats:', error);
        return { filesCount: 0, directoriesCount: 0, totalSize: 0 };
      }
    }
  }

  private calculateStats(entries: PersistentVFSEntry[]): {
    filesCount: number;
    directoriesCount: number;
    totalSize: number;
  } {
    return {
      filesCount: entries.filter(e => e.type === 'file').length,
      directoriesCount: entries.filter(e => e.type === 'directory').length,
      totalSize: entries.reduce((sum, e) => sum + (e.size || 0), 0)
    };
  }
}

// Export the singleton instance
export const persistentVFS = PersistentVirtualFileSystem.getInstance();
