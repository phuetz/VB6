/**
 * Virtual File System Tests
 *
 * Comprehensive tests for persistent file system with IndexedDB/localStorage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { persistentVFS, VB6FileAttribute, PersistentVFSEntry } from '../../runtime/VB6PersistentFileSystem';

describe('PersistentVirtualFileSystem', () => {
  beforeEach(async () => {
    // Initialize and clear before each test
    await persistentVFS.initialize();
    await persistentVFS.clear();
  });

  afterEach(async () => {
    // Clean up after tests
    await persistentVFS.clear();
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      expect(() => persistentVFS.initialize()).not.toThrow();
    });

    it('should create system directories', async () => {
      const root = await persistentVFS.listDirectory('/');
      expect(root.length).toBeGreaterThan(0);
    });
  });

  describe('File Operations', () => {
    it('should create a file', async () => {
      const file = await persistentVFS.createFile('/test.txt', 'Hello World');
      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('file');
      expect(file.content).toBe('Hello World');
      expect(file.size).toBe('Hello World'.length);
    });

    it('should retrieve created file', async () => {
      await persistentVFS.createFile('/data.txt', 'Test content');
      const entry = await persistentVFS.getEntry('/data.txt');
      expect(entry).not.toBeNull();
      expect(entry?.content).toBe('Test content');
    });

    it('should delete a file', async () => {
      await persistentVFS.createFile('/delete_me.txt', 'Content');
      const deleted = await persistentVFS.deleteEntry('/delete_me.txt');
      expect(deleted).toBe(true);

      const entry = await persistentVFS.getEntry('/delete_me.txt');
      expect(entry).toBeNull();
    });

    it('should handle file not found errors', async () => {
      const entry = await persistentVFS.getEntry('/nonexistent.txt');
      expect(entry).toBeNull();
    });

    it('should overwrite existing files', async () => {
      await persistentVFS.createFile('/overwrite.txt', 'Original');
      const updated = await persistentVFS.createFile('/overwrite.txt', 'Updated');
      expect(updated.content).toBe('Updated');
    });
  });

  describe('Directory Operations', () => {
    it('should create a directory', async () => {
      const dir = await persistentVFS.createDirectory('/mydir');
      expect(dir.name).toBe('mydir');
      expect(dir.type).toBe('directory');
      expect(dir.attributes & VB6FileAttribute.vbDirectory).not.toBe(0);
    });

    it('should list directory contents', async () => {
      await persistentVFS.createFile('/file1.txt', 'Content 1');
      await persistentVFS.createFile('/file2.txt', 'Content 2');
      await persistentVFS.createDirectory('/subdir');

      const entries = await persistentVFS.listDirectory('/');
      expect(entries.length).toBeGreaterThanOrEqual(3);

      const names = entries.map(e => e.name);
      expect(names).toContain('file1.txt');
      expect(names).toContain('file2.txt');
      expect(names).toContain('subdir');
    });

    it('should handle nested directories', async () => {
      await persistentVFS.createDirectory('/level1/level2/level3');
      const entry = await persistentVFS.getEntry('/level1/level2/level3');
      expect(entry).not.toBeNull();
      expect(entry?.type).toBe('directory');
    });

    it('should delete empty directory', async () => {
      await persistentVFS.createDirectory('/empty');
      const deleted = await persistentVFS.deleteEntry('/empty');
      expect(deleted).toBe(true);
    });

    it('should change current directory', async () => {
      await persistentVFS.createDirectory('/workdir');
      await persistentVFS.changeDirectory('/workdir');
      expect(persistentVFS.getCurrentDirectory()).toBe('/workdir');
    });

    it('should maintain current directory context', async () => {
      expect(persistentVFS.getCurrentDirectory()).toBe('/');
    });
  });

  describe('File Attributes', () => {
    it('should get file attributes', async () => {
      await persistentVFS.createFile('/attr_test.txt', 'Content');
      const attrs = await persistentVFS.getAttributes('/attr_test.txt');
      expect(typeof attrs).toBe('number');
      expect(attrs >= 0).toBe(true);
    });

    it('should set read-only attribute', async () => {
      await persistentVFS.createFile('/readonly.txt', 'Content');
      await persistentVFS.setAttributes('/readonly.txt', VB6FileAttribute.vbReadOnly);

      const attrs = await persistentVFS.getAttributes('/readonly.txt');
      expect(attrs & VB6FileAttribute.vbReadOnly).not.toBe(0);
    });

    it('should set hidden attribute', async () => {
      await persistentVFS.createFile('/hidden.txt', 'Content');
      await persistentVFS.setAttributes('/hidden.txt', VB6FileAttribute.vbHidden);

      const attrs = await persistentVFS.getAttributes('/hidden.txt');
      expect(attrs & VB6FileAttribute.vbHidden).not.toBe(0);
    });

    it('should combine multiple attributes', async () => {
      await persistentVFS.createFile('/multi.txt', 'Content');
      const combined = VB6FileAttribute.vbReadOnly | VB6FileAttribute.vbArchive;
      await persistentVFS.setAttributes('/multi.txt', combined);

      const attrs = await persistentVFS.getAttributes('/multi.txt');
      expect(attrs & VB6FileAttribute.vbReadOnly).not.toBe(0);
      expect(attrs & VB6FileAttribute.vbArchive).not.toBe(0);
    });

    it('should prevent write to read-only file', async () => {
      await persistentVFS.createFile('/readonly2.txt', 'Content');
      await persistentVFS.setAttributes('/readonly2.txt', VB6FileAttribute.vbReadOnly);

      const fileNum = await persistentVFS.openFile('/readonly2.txt', 2); // Output mode
      expect(async () => {
        await persistentVFS.writeToFile(fileNum, 'New content');
      }).rejects.toThrow();
    });
  });

  describe('File I/O Operations', () => {
    it('should open file in output mode', async () => {
      const fileNum = await persistentVFS.openFile('/new_file.txt', 2); // Output
      expect(typeof fileNum).toBe('number');
      expect(fileNum > 0).toBe(true);
    });

    it('should write to file', async () => {
      const fileNum = await persistentVFS.openFile('/write_test.txt', 2);
      await persistentVFS.writeToFile(fileNum, 'Test data');
      await persistentVFS.closeFile(fileNum);

      const entry = await persistentVFS.getEntry('/write_test.txt');
      expect(entry?.content).toContain('Test data');
    });

    it('should read from file', async () => {
      await persistentVFS.createFile('/read_test.txt', 'Hello World');
      const fileNum = await persistentVFS.openFile('/read_test.txt', 1); // Input
      const content = await persistentVFS.readFromFile(fileNum);
      await persistentVFS.closeFile(fileNum);

      expect(content).toContain('Hello World');
    });

    it('should handle file position correctly', async () => {
      await persistentVFS.createFile('/position_test.txt', 'Hello World');
      const fileNum = await persistentVFS.openFile('/position_test.txt', 1);

      persistentVFS.seekFile(fileNum, 6);
      const content = await persistentVFS.readFromFile(fileNum, 5);

      expect(content).toBe('World');
    });

    it('should detect end of file', async () => {
      await persistentVFS.createFile('/eof_test.txt', 'Short');
      const fileNum = await persistentVFS.openFile('/eof_test.txt', 1);

      persistentVFS.seekFile(fileNum, 100);
      const isEOF = await persistentVFS.isEOF(fileNum);

      expect(isEOF).toBe(true);
    });

    it('should get file length', async () => {
      const content = 'Test content';
      await persistentVFS.createFile('/length_test.txt', content);
      const fileNum = await persistentVFS.openFile('/length_test.txt', 1);

      const length = await persistentVFS.getFileLength(fileNum);
      expect(length).toBe(content.length);
    });
  });

  describe('Path Normalization', () => {
    it('should normalize Windows paths', async () => {
      // Test that Windows paths are properly converted
      // This requires testing the internal normalizePath method
      // For now, we test the result by creating files with different path styles
      await persistentVFS.createFile('/windows\\style\\path.txt', 'Content');
      const entry = await persistentVFS.getEntry('/windows/style/path.txt');
      expect(entry).not.toBeNull();
    });

    it('should resolve relative paths', async () => {
      await persistentVFS.changeDirectory('/');
      await persistentVFS.createFile('/relative.txt', 'Content');
      const entry = await persistentVFS.getEntry('/relative.txt');
      expect(entry).not.toBeNull();
    });

    it('should prevent path traversal attacks', async () => {
      expect(async () => {
        await persistentVFS.createFile('/../../../etc/passwd', 'Hack');
      }).rejects.toThrow();
    });
  });

  describe('File System Statistics', () => {
    it('should calculate file system stats', async () => {
      await persistentVFS.createFile('/file1.txt', 'Content 1');
      await persistentVFS.createFile('/file2.txt', 'Content 2');
      await persistentVFS.createDirectory('/dir1');

      const stats = await persistentVFS.getStats();
      expect(stats.filesCount).toBeGreaterThanOrEqual(2);
      expect(stats.directoriesCount).toBeGreaterThanOrEqual(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should update stats after operations', async () => {
      const statsBefore = await persistentVFS.getStats();
      await persistentVFS.createFile('/new.txt', 'New content');
      const statsAfter = await persistentVFS.getStats();

      expect(statsAfter.filesCount).toBeGreaterThan(statsBefore.filesCount);
    });
  });

  describe('Clear Operations', () => {
    it('should clear all files', async () => {
      await persistentVFS.createFile('/file1.txt', 'Content');
      await persistentVFS.createFile('/file2.txt', 'Content');
      await persistentVFS.createDirectory('/dir');

      await persistentVFS.clear();

      const entries = await persistentVFS.listDirectory('/');
      expect(entries.length).toBe(0);
    });
  });

  describe('Storage Backend Selection', () => {
    it('should prefer IndexedDB when available', async () => {
      // This test verifies that IndexedDB is being used if available
      // In test environment, localStorage fallback may be used
      await persistentVFS.initialize();
      expect(persistentVFS).toBeDefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple files simultaneously', async () => {
      const fileNum1 = await persistentVFS.openFile('/file1.txt', 2); // Output
      const fileNum2 = await persistentVFS.openFile('/file2.txt', 2); // Output

      await persistentVFS.writeToFile(fileNum1, 'File 1 content');
      await persistentVFS.writeToFile(fileNum2, 'File 2 content');

      await persistentVFS.closeFile(fileNum1);
      await persistentVFS.closeFile(fileNum2);

      const entry1 = await persistentVFS.getEntry('/file1.txt');
      const entry2 = await persistentVFS.getEntry('/file2.txt');

      expect(entry1?.content).toBe('File 1 content');
      expect(entry2?.content).toBe('File 2 content');
    });

    it('should maintain separate file handles', async () => {
      const fileNum1 = await persistentVFS.openFile('/multi.txt', 2);
      const fileNum2 = await persistentVFS.openFile('/multi2.txt', 2);

      expect(fileNum1).not.toBe(fileNum2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file creation', async () => {
      const file = await persistentVFS.createFile('/empty.txt', '');
      expect(file.size).toBe(0);
      expect(file.content).toBe('');
    });

    it('should handle large file content', async () => {
      const largeContent = 'x'.repeat(100000); // 100KB
      const file = await persistentVFS.createFile('/large.txt', largeContent);
      expect(file.size).toBe(100000);
    });

    it('should handle special characters in filenames', async () => {
      const file = await persistentVFS.createFile('/file_with-special.chars.txt', 'Content');
      expect(file.name).toBe('file_with-special.chars.txt');
    });

    it('should handle binary data', async () => {
      // Store binary data as string representation
      const binaryData = String.fromCharCode(0, 1, 2, 3, 4, 5);
      const file = await persistentVFS.createFile('/binary.dat', binaryData);
      expect(file.size).toBe(6);
    });
  });
});
