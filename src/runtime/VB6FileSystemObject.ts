/**
 * VB6 FileSystemObject - Complete Scripting.FileSystemObject Implementation
 * Provides comprehensive file system access with web-compatible alternatives
 */

// FileSystemObject Constants
export const FSO_CONSTANTS = {
  // File attributes
  Normal: 0,
  ReadOnly: 1,
  Hidden: 2,
  System: 4,
  Volume: 8,
  Directory: 16,
  Archive: 32,
  Alias: 64,
  Compressed: 128,

  // Drive types
  Unknown: 0,
  Removable: 1,
  Fixed: 2,
  Network: 3,
  CDRom: 4,
  RamDisk: 5,

  // IO modes
  ForReading: 1,
  ForWriting: 2,
  ForAppending: 8,

  // Tristate values
  TristateUseDefault: -2,
  TristateTrue: -1,
  TristateFalse: 0,
};

// Virtual file system for browser environment
class VirtualFileSystem {
  private static instance: VirtualFileSystem;
  private files: Map<string, VirtualFile> = new Map();
  private folders: Map<string, VirtualFolder> = new Map();

  static getInstance(): VirtualFileSystem {
    if (!VirtualFileSystem.instance) {
      VirtualFileSystem.instance = new VirtualFileSystem();
      VirtualFileSystem.instance.initializeDefaults();
    }
    return VirtualFileSystem.instance;
  }

  private initializeDefaults() {
    // Create default system folders
    this.createFolder('/');
    this.createFolder('/Windows');
    this.createFolder('/Windows/System32');
    this.createFolder('/Program Files');
    this.createFolder('/temp');
    this.createFolder('/Documents and Settings');
    this.createFolder('/Documents and Settings/User');
    this.createFolder('/Documents and Settings/User/My Documents');

    // Create some default files
    this.createFile('/Windows/System32/kernel32.dll', 'System Library', true);
    this.createFile('/Windows/System32/user32.dll', 'System Library', true);
    this.createFile('/autoexec.bat', '@echo off\nREM Autoexec batch file', false);
    this.createFile('/config.sys', 'REM Config file', false);
  }

  normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  createFile(path: string, content: string = '', isSystem: boolean = false): VirtualFile {
    const normalizedPath = this.normalizePath(path);
    const file: VirtualFile = {
      path: normalizedPath,
      name: this.getFileName(normalizedPath),
      content,
      size: content.length,
      dateCreated: new Date(),
      dateLastModified: new Date(),
      dateLastAccessed: new Date(),
      attributes: isSystem ? FSO_CONSTANTS.System : FSO_CONSTANTS.Normal,
      isReadOnly: isSystem,
      isHidden: false,
      isSystem,
    };

    this.files.set(normalizedPath, file);
    return file;
  }

  createFolder(path: string): VirtualFolder {
    const normalizedPath = this.normalizePath(path);
    const folder: VirtualFolder = {
      path: normalizedPath,
      name: this.getFileName(normalizedPath) || '/',
      dateCreated: new Date(),
      dateLastModified: new Date(),
      dateLastAccessed: new Date(),
      attributes: FSO_CONSTANTS.Directory,
      isRootFolder: normalizedPath === '/',
      files: [],
      subFolders: [],
    };

    this.folders.set(normalizedPath, folder);
    return folder;
  }

  getFile(path: string): VirtualFile | null {
    return this.files.get(this.normalizePath(path)) || null;
  }

  getFolder(path: string): VirtualFolder | null {
    return this.folders.get(this.normalizePath(path)) || null;
  }

  fileExists(path: string): boolean {
    return this.files.has(this.normalizePath(path));
  }

  folderExists(path: string): boolean {
    return this.folders.has(this.normalizePath(path));
  }

  deleteFile(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.delete(normalizedPath);
  }

  deleteFolder(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.folders.delete(normalizedPath);
  }

  copyFile(source: string, destination: string): boolean {
    const sourceFile = this.getFile(source);
    if (!sourceFile) return false;

    const destPath = this.normalizePath(destination);
    const copiedFile = { ...sourceFile };
    copiedFile.path = destPath;
    copiedFile.name = this.getFileName(destPath);
    copiedFile.dateCreated = new Date();
    copiedFile.dateLastModified = new Date();

    this.files.set(destPath, copiedFile);
    return true;
  }

  moveFile(source: string, destination: string): boolean {
    if (this.copyFile(source, destination)) {
      return this.deleteFile(source);
    }
    return false;
  }

  getFileName(path: string): string {
    const normalized = this.normalizePath(path);
    const parts = normalized.split('/');
    return parts[parts.length - 1];
  }

  getParentFolderName(path: string): string {
    const normalized = this.normalizePath(path);
    const parts = normalized.split('/');
    if (parts.length <= 1) return '';
    parts.pop();
    return parts.join('/') || '/';
  }

  getExtensionName(path: string): string {
    const fileName = this.getFileName(path);
    const lastDot = fileName.lastIndexOf('.');
    return lastDot >= 0 ? fileName.substring(lastDot + 1) : '';
  }

  getBaseName(path: string): string {
    const fileName = this.getFileName(path);
    const lastDot = fileName.lastIndexOf('.');
    return lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
  }

  buildPath(...parts: string[]): string {
    return this.normalizePath(parts.join('/'));
  }

  getAbsolutePathName(path: string): string {
    const normalized = this.normalizePath(path);
    if (normalized.startsWith('/')) return normalized;
    return '/' + normalized;
  }

  getTempName(): string {
    const randomId = Math.random().toString(36).substring(2, 15);
    return `tmp${randomId}.tmp`;
  }

  getSpecialFolder(folderSpec: number): string {
    switch (folderSpec) {
      case 0:
        return '/Windows'; // WindowsFolder
      case 1:
        return '/Windows/System32'; // SystemFolder
      case 2:
        return '/temp'; // TemporaryFolder
      default:
        return '/';
    }
  }

  getDrives(): VirtualDrive[] {
    return [
      {
        driveLetter: 'C:',
        driveType: FSO_CONSTANTS.Fixed,
        availableSpace: 1024 * 1024 * 1024 * 10, // 10GB
        freeSpace: 1024 * 1024 * 1024 * 5, // 5GB
        totalSize: 1024 * 1024 * 1024 * 20, // 20GB
        isReady: true,
        fileSystem: 'NTFS',
        volumeName: 'Virtual Drive',
        serialNumber: 123456789,
        path: 'C:\\',
      },
    ];
  }
}

// VB6 File and Folder interfaces
interface VirtualFile {
  path: string;
  name: string;
  content: string;
  size: number;
  dateCreated: Date;
  dateLastModified: Date;
  dateLastAccessed: Date;
  attributes: number;
  isReadOnly: boolean;
  isHidden: boolean;
  isSystem: boolean;
}

interface VirtualFolder {
  path: string;
  name: string;
  dateCreated: Date;
  dateLastModified: Date;
  dateLastAccessed: Date;
  attributes: number;
  isRootFolder: boolean;
  files: VirtualFile[];
  subFolders: VirtualFolder[];
}

interface VirtualDrive {
  driveLetter: string;
  driveType: number;
  availableSpace: number;
  freeSpace: number;
  totalSize: number;
  isReady: boolean;
  fileSystem: string;
  volumeName: string;
  serialNumber: number;
  path: string;
}

// TextStream for file reading/writing
class VirtualTextStream {
  private content: string;
  private position: number = 0;
  private mode: number;
  private file: VirtualFile;
  private vfs: VirtualFileSystem;

  constructor(file: VirtualFile, mode: number, vfs: VirtualFileSystem) {
    this.file = file;
    this.mode = mode;
    this.vfs = vfs;
    this.content = file.content;

    if (mode === FSO_CONSTANTS.ForAppending) {
      this.position = this.content.length;
    }
  }

  get AtEndOfLine(): boolean {
    if (this.position >= this.content.length) return true;
    return this.content[this.position] === '\n';
  }

  get AtEndOfStream(): boolean {
    return this.position >= this.content.length;
  }

  get Column(): number {
    const lastNewline = this.content.lastIndexOf('\n', this.position - 1);
    return this.position - lastNewline;
  }

  get Line(): number {
    return this.content.substring(0, this.position).split('\n').length;
  }

  Close(): void {
    if (this.mode !== FSO_CONSTANTS.ForReading) {
      // Update file with new content
      this.file.content = this.content;
      this.file.size = this.content.length;
      this.file.dateLastModified = new Date();
    }
  }

  Read(characters: number): string {
    const result = this.content.substring(this.position, this.position + characters);
    this.position += characters;
    return result;
  }

  ReadAll(): string {
    const result = this.content.substring(this.position);
    this.position = this.content.length;
    return result;
  }

  ReadLine(): string {
    const startPos = this.position;
    let endPos = this.content.indexOf('\n', startPos);

    if (endPos === -1) {
      endPos = this.content.length;
    }

    const result = this.content.substring(startPos, endPos);
    this.position = endPos + 1;
    return result;
  }

  Skip(characters: number): void {
    this.position = Math.min(this.content.length, this.position + characters);
  }

  SkipLine(): void {
    this.ReadLine();
  }

  Write(text: string): void {
    if (this.mode === FSO_CONSTANTS.ForReading) {
      throw new Error('Cannot write to file opened for reading');
    }

    if (this.mode === FSO_CONSTANTS.ForWriting) {
      this.content =
        this.content.substring(0, this.position) + text + this.content.substring(this.position);
    } else if (this.mode === FSO_CONSTANTS.ForAppending) {
      this.content += text;
    }

    this.position += text.length;
  }

  WriteLine(text: string = ''): void {
    this.Write(text + '\n');
  }

  WriteBlankLines(lines: number): void {
    this.Write('\n'.repeat(lines));
  }
}

// File object for VB6 compatibility
class VB6File {
  private file: VirtualFile;
  private vfs: VirtualFileSystem;

  constructor(file: VirtualFile, vfs: VirtualFileSystem) {
    this.file = file;
    this.vfs = vfs;
  }

  get Attributes(): number {
    return this.file.attributes;
  }
  set Attributes(value: number) {
    this.file.attributes = value;
  }

  get DateCreated(): Date {
    return this.file.dateCreated;
  }
  get DateLastAccessed(): Date {
    return this.file.dateLastAccessed;
  }
  get DateLastModified(): Date {
    return this.file.dateLastModified;
  }

  get Drive(): string {
    return this.file.path.startsWith('/') ? 'C:' : this.file.path.substring(0, 2);
  }

  get Name(): string {
    return this.file.name;
  }
  set Name(value: string) {
    const oldPath = this.file.path;
    const newPath = this.vfs.getParentFolderName(oldPath) + '/' + value;
    this.vfs.moveFile(oldPath, newPath);
    this.file.name = value;
    this.file.path = newPath;
  }

  get ParentFolder(): VB6Folder {
    const parentPath = this.vfs.getParentFolderName(this.file.path);
    const parentFolder = this.vfs.getFolder(parentPath);
    return new VB6Folder(parentFolder!, this.vfs);
  }

  get Path(): string {
    return this.file.path;
  }
  get ShortName(): string {
    return this.file.name;
  }
  get ShortPath(): string {
    return this.file.path;
  }
  get Size(): number {
    return this.file.size;
  }
  get Type(): string {
    const ext = this.vfs.getExtensionName(this.file.path);
    return ext ? `${ext.toUpperCase()} File` : 'File';
  }

  Copy(destination: string, overwrite: boolean = true): void {
    if (!overwrite && this.vfs.fileExists(destination)) {
      throw new Error('File already exists');
    }
    this.vfs.copyFile(this.file.path, destination);
  }

  Delete(force: boolean = false): void {
    if (this.file.isReadOnly && !force) {
      throw new Error('Cannot delete read-only file');
    }
    this.vfs.deleteFile(this.file.path);
  }

  Move(destination: string): void {
    this.vfs.moveFile(this.file.path, destination);
    this.file.path = destination;
    this.file.name = this.vfs.getFileName(destination);
  }

  OpenAsTextStream(
    iomode: number = FSO_CONSTANTS.ForReading,
    format: number = 0
  ): VirtualTextStream {
    return new VirtualTextStream(this.file, iomode, this.vfs);
  }
}

// Folder object for VB6 compatibility
class VB6Folder {
  private folder: VirtualFolder;
  private vfs: VirtualFileSystem;

  constructor(folder: VirtualFolder, vfs: VirtualFileSystem) {
    this.folder = folder;
    this.vfs = vfs;
  }

  get Attributes(): number {
    return this.folder.attributes;
  }
  set Attributes(value: number) {
    this.folder.attributes = value;
  }

  get DateCreated(): Date {
    return this.folder.dateCreated;
  }
  get DateLastAccessed(): Date {
    return this.folder.dateLastAccessed;
  }
  get DateLastModified(): Date {
    return this.folder.dateLastModified;
  }

  get Drive(): string {
    return this.folder.path.startsWith('/') ? 'C:' : this.folder.path.substring(0, 2);
  }

  get Files(): VB6File[] {
    // Get all files in this folder
    const files: VB6File[] = [];
    for (const [path, file] of this.vfs['files']) {
      if (this.vfs.getParentFolderName(path) === this.folder.path) {
        files.push(new VB6File(file, this.vfs));
      }
    }
    return files;
  }

  get IsRootFolder(): boolean {
    return this.folder.isRootFolder;
  }

  get Name(): string {
    return this.folder.name;
  }
  set Name(value: string) {
    const oldPath = this.folder.path;
    const newPath = this.vfs.getParentFolderName(oldPath) + '/' + value;
    this.vfs.moveFile(oldPath, newPath); // This would need to be adapted for folders
    this.folder.name = value;
    this.folder.path = newPath;
  }

  get ParentFolder(): VB6Folder | null {
    if (this.folder.isRootFolder) return null;
    const parentPath = this.vfs.getParentFolderName(this.folder.path);
    const parentFolder = this.vfs.getFolder(parentPath);
    return parentFolder ? new VB6Folder(parentFolder, this.vfs) : null;
  }

  get Path(): string {
    return this.folder.path;
  }
  get ShortName(): string {
    return this.folder.name;
  }
  get ShortPath(): string {
    return this.folder.path;
  }

  get Size(): number {
    let totalSize = 0;
    this.Files.forEach(file => (totalSize += file.Size));
    return totalSize;
  }

  get SubFolders(): VB6Folder[] {
    const subFolders: VB6Folder[] = [];
    for (const [path, folder] of this.vfs['folders']) {
      if (this.vfs.getParentFolderName(path) === this.folder.path && path !== this.folder.path) {
        subFolders.push(new VB6Folder(folder, this.vfs));
      }
    }
    return subFolders;
  }

  get Type(): string {
    return 'File Folder';
  }

  Copy(destination: string, overwrite: boolean = true): void {
    // Implementation would recursively copy folder and contents
    this.vfs.createFolder(destination);
  }

  Delete(force: boolean = false): void {
    this.vfs.deleteFolder(this.folder.path);
  }

  Move(destination: string): void {
    this.Copy(destination);
    this.Delete();
  }

  CreateTextFile(
    fileName: string,
    overwrite: boolean = true,
    unicode: boolean = false
  ): VirtualTextStream {
    const filePath = this.vfs.buildPath(this.folder.path, fileName);
    if (!overwrite && this.vfs.fileExists(filePath)) {
      throw new Error('File already exists');
    }

    const file = this.vfs.createFile(filePath, '');
    return new VirtualTextStream(file, FSO_CONSTANTS.ForWriting, this.vfs);
  }
}

// Drive object for VB6 compatibility
class VB6Drive {
  private drive: VirtualDrive;

  constructor(drive: VirtualDrive) {
    this.drive = drive;
  }

  get AvailableSpace(): number {
    return this.drive.availableSpace;
  }
  get DriveLetter(): string {
    return this.drive.driveLetter;
  }
  get DriveType(): number {
    return this.drive.driveType;
  }
  get FileSystem(): string {
    return this.drive.fileSystem;
  }
  get FreeSpace(): number {
    return this.drive.freeSpace;
  }
  get IsReady(): boolean {
    return this.drive.isReady;
  }
  get Path(): string {
    return this.drive.path;
  }
  get RootFolder(): VB6Folder {
    const vfs = VirtualFileSystem.getInstance();
    const rootFolder = vfs.getFolder('/');
    return new VB6Folder(rootFolder!, vfs);
  }
  get SerialNumber(): number {
    return this.drive.serialNumber;
  }
  get ShareName(): string {
    return '';
  }
  get TotalSize(): number {
    return this.drive.totalSize;
  }
  get VolumeName(): string {
    return this.drive.volumeName;
  }
  set VolumeName(value: string) {
    this.drive.volumeName = value;
  }
}

// Main FileSystemObject class
export class VB6FileSystemObject {
  private vfs: VirtualFileSystem;

  constructor() {
    this.vfs = VirtualFileSystem.getInstance();
  }

  // File methods
  BuildPath(path: string, name: string): string {
    return this.vfs.buildPath(path, name);
  }

  CopyFile(source: string, destination: string, overwrite: boolean = true): void {
    if (!overwrite && this.vfs.fileExists(destination)) {
      throw new Error('File already exists');
    }
    this.vfs.copyFile(source, destination);
  }

  CreateTextFile(
    fileName: string,
    overwrite: boolean = true,
    unicode: boolean = false
  ): VirtualTextStream {
    if (!overwrite && this.vfs.fileExists(fileName)) {
      throw new Error('File already exists');
    }

    const file = this.vfs.createFile(fileName, '');
    return new VirtualTextStream(file, FSO_CONSTANTS.ForWriting, this.vfs);
  }

  DeleteFile(fileSpec: string, force: boolean = false): void {
    // Handle wildcards (simplified)
    if (fileSpec.includes('*') || fileSpec.includes('?')) {
      // For simplicity, just delete exact matches
      this.vfs.deleteFile(fileSpec);
    } else {
      const file = this.vfs.getFile(fileSpec);
      if (file && file.isReadOnly && !force) {
        throw new Error('Cannot delete read-only file');
      }
      this.vfs.deleteFile(fileSpec);
    }
  }

  FileExists(fileSpec: string): boolean {
    return this.vfs.fileExists(fileSpec);
  }

  GetFile(filePath: string): VB6File {
    const file = this.vfs.getFile(filePath);
    if (!file) throw new Error('File not found');
    return new VB6File(file, this.vfs);
  }

  GetFileName(path: string): string {
    return this.vfs.getFileName(path);
  }

  GetBaseName(path: string): string {
    return this.vfs.getBaseName(path);
  }

  GetExtensionName(path: string): string {
    return this.vfs.getExtensionName(path);
  }

  GetParentFolderName(path: string): string {
    return this.vfs.getParentFolderName(path);
  }

  GetAbsolutePathName(path: string): string {
    return this.vfs.getAbsolutePathName(path);
  }

  GetTempName(): string {
    return this.vfs.getTempName();
  }

  MoveFile(source: string, destination: string): void {
    this.vfs.moveFile(source, destination);
  }

  OpenTextFile(
    fileName: string,
    iomode: number = FSO_CONSTANTS.ForReading,
    create: boolean = false,
    format: number = 0
  ): VirtualTextStream {
    let file = this.vfs.getFile(fileName);

    if (!file) {
      if (create) {
        file = this.vfs.createFile(fileName, '');
      } else {
        throw new Error('File not found');
      }
    }

    return new VirtualTextStream(file, iomode, this.vfs);
  }

  // Folder methods
  CopyFolder(source: string, destination: string, overwrite: boolean = true): void {
    if (!overwrite && this.vfs.folderExists(destination)) {
      throw new Error('Folder already exists');
    }

    const sourceFolder = this.vfs.getFolder(source);
    if (!sourceFolder) throw new Error('Source folder not found');

    this.vfs.createFolder(destination);
    // Recursive copy would be implemented here
  }

  CreateFolder(path: string): VB6Folder {
    const folder = this.vfs.createFolder(path);
    return new VB6Folder(folder, this.vfs);
  }

  DeleteFolder(folderSpec: string, force: boolean = false): void {
    this.vfs.deleteFolder(folderSpec);
  }

  FolderExists(folderSpec: string): boolean {
    return this.vfs.folderExists(folderSpec);
  }

  GetFolder(folderPath: string): VB6Folder {
    const folder = this.vfs.getFolder(folderPath);
    if (!folder) throw new Error('Folder not found');
    return new VB6Folder(folder, this.vfs);
  }

  GetSpecialFolder(folderSpec: number): VB6Folder {
    const specialPath = this.vfs.getSpecialFolder(folderSpec);
    return this.GetFolder(specialPath);
  }

  MoveFolder(source: string, destination: string): void {
    this.CopyFolder(source, destination);
    this.DeleteFolder(source);
  }

  // Drive methods
  DriveExists(driveSpec: string): boolean {
    const drives = this.vfs.getDrives();
    return drives.some(drive => drive.driveLetter === driveSpec);
  }

  GetDrive(driveSpec: string): VB6Drive {
    const drives = this.vfs.getDrives();
    const drive = drives.find(d => d.driveLetter === driveSpec);
    if (!drive) throw new Error('Drive not found');
    return new VB6Drive(drive);
  }

  GetDriveName(path: string): string {
    return path.startsWith('/') ? 'C:' : path.substring(0, 2);
  }

  get Drives(): VB6Drive[] {
    return this.vfs.getDrives().map(drive => new VB6Drive(drive));
  }
}

// Create global FileSystemObject instance
export const FileSystemObject = new VB6FileSystemObject();

// Export all classes and constants for VB6 compatibility
export const VB6FileSystemAPI = {
  FileSystemObject,
  VB6FileSystemObject,
  VB6File,
  VB6Folder,
  VB6Drive,
  VirtualTextStream,
  FSO_CONSTANTS,

  // Utility functions
  CreateObject(progId: string) {
    if (progId === 'Scripting.FileSystemObject') {
      return new VB6FileSystemObject();
    }
    throw new Error(`Unknown ProgID: ${progId}`);
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.VB6FileSystemAPI = VB6FileSystemAPI;
  globalAny.FileSystemObject = FileSystemObject;
  globalAny.FSO = FileSystemObject; // Common VB6 abbreviation

  // Expose constants globally
  Object.assign(globalAny, FSO_CONSTANTS);

  // Make CreateObject available for FileSystemObject
  globalAny.CreateObject = VB6FileSystemAPI.CreateObject;
}

export default VB6FileSystemAPI;
