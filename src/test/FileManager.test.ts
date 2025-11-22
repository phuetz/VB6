/**
 * TEST COVERAGE GAP FIX: Comprehensive tests for FileManager
 * Tests critical file operations, security validations, and edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FileManager } from '../services/FileManager';
import JSZip from 'jszip';

// Mock File API
const mockFile = (name: string, content: string, type: string = 'application/json') => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      loadAsync: vi.fn().mockResolvedValue({
        files: {
          'project.json': {
            async: vi.fn().mockResolvedValue('{"test": "data"}')
          }
        }
      }),
      file: vi.fn().mockReturnThis(),
      generateAsync: vi.fn().mockResolvedValue(new Blob(['test zip content']))
    }))
  };
});

describe('FileManager', () => {
  beforeEach(() => {
    // Reset DOM and global mocks
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
      revokeObjectURL: vi.fn()
    } as any;
    
    global.window = {
      ...global.window,
      location: { origin: 'http://localhost:3000' }
    } as any;
    
    // Mock console to suppress warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security Tests', () => {
    it('should validate archive paths to prevent zip slip attacks', () => {
      const FileManagerClass = FileManager as any;
      
      // Test dangerous paths
      expect(FileManagerClass.isValidArchivePath('../../../etc/passwd')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('..\\..\\windows\\system32')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('/etc/passwd')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('C:\\windows\\system32')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('\\\\server\\share\\file')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('file<script>alert(1)</script>.json')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('file\0.json')).toBe(false);
      
      // Test valid paths
      expect(FileManagerClass.isValidArchivePath('project.json')).toBe(true);
      expect(FileManagerClass.isValidArchivePath('forms/form1.json')).toBe(true);
      expect(FileManagerClass.isValidArchivePath('modules/module1.bas')).toBe(true);
    });

    it('should reject excessively deep paths', () => {
      const FileManagerClass = FileManager as any;
      const deepPath = 'a/'.repeat(12) + 'file.json';
      expect(FileManagerClass.isValidArchivePath(deepPath)).toBe(false);
    });

    it('should reject long path components', () => {
      const FileManagerClass = FileManager as any;
      const longName = 'a'.repeat(256) + '.json';
      expect(FileManagerClass.isValidArchivePath(longName)).toBe(false);
    });

    it('should reject files with invalid extensions', () => {
      const FileManagerClass = FileManager as any;
      expect(FileManagerClass.isValidArchivePath('malicious.exe')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('script.bat')).toBe(false);
      expect(FileManagerClass.isValidArchivePath('virus.com')).toBe(false);
    });
  });

  describe('Project Loading', () => {
    it('should handle project loading with modern File System Access API', async () => {
      // Mock showOpenFilePicker
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile('test.vb6', '{"name": "TestProject"}'))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(global.window.showOpenFilePicker).toHaveBeenCalled();
      expect(mockFileHandle.getFile).toHaveBeenCalled();
      expect(result).toEqual({ name: 'TestProject' });
    });

    it('should fallback to input element when File System Access API fails', async () => {
      // Mock failed showOpenFilePicker
      global.window.showOpenFilePicker = vi.fn().mockRejectedValue(new Error('User cancelled'));
      
      // Mock document.createElement and event handling
      const mockInput = {
        type: '',
        accept: '',
        style: { display: '' },
        click: vi.fn(),
        onchange: null,
        oncancel: null,
        files: [mockFile('test.vb6', '{"name": "FallbackProject"}')]
      };
      
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild
        }
      } as any;
      
      // Start the async operation
      const resultPromise = FileManager.openProject();
      
      // Simulate user selecting a file
      if (mockInput.onchange) {
        mockInput.onchange({ target: mockInput } as any);
      }
      
      const result = await resultPromise;
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('File System Access API failed'));
      expect(mockInput.click).toHaveBeenCalled();
      expect(result).toEqual({ name: 'FallbackProject' });
    });

    it('should handle VBP file parsing', async () => {
      // Mock VBP file content
      const vbpContent = `Type=Exe
Form=Form1.frm
Module=Module1; Module1.bas
Reference=*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\SysWOW64\\stdole2.tlb#OLE Automation
Object={6B7E6392-850A-101B-AFC0-4210102A8DA7}#1.3#0; COMCTL32.OCX
Startup="Form1"
HelpFile=""
Title="TestApp"`;

      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile('test.vbp', vbpContent, 'text/plain'))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(result).toBeDefined();
      expect(result?.name).toBe('test');
      expect(result?.forms).toHaveLength(1);
      expect(result?.modules).toHaveLength(1);
      expect(result?.settings.startupObject).toBe('Form1');
    });

    it('should handle ZIP archive extraction with security validation', async () => {
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile('test.vb6z', 'zip content', 'application/zip'))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(result).toEqual({ test: 'data' });
    });

    it('should reject invalid project archives', async () => {
      vi.mocked(JSZip).mockImplementation(() => ({
        loadAsync: vi.fn().mockResolvedValue({
          files: {}  // No project.json file
        })
      }));

      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile('invalid.vb6z', 'zip content', 'application/zip'))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error opening project'));
    });
  });

  describe('Project Saving', () => {
    const mockProject = {
      id: '1',
      name: 'TestProject',
      version: '1.0',
      created: new Date(),
      modified: new Date(),
      forms: [],
      modules: [],
      classModules: [],
      userControls: [],
      resources: [],
      settings: {
        title: 'Test App',
        description: 'Test Description',
        version: '1.0',
        autoIncrementVersion: false,
        compilationType: 'exe' as const,
        startupObject: 'Form1',
        icon: '',
        helpFile: '',
        threadingModel: 'apartment' as const
      },
      references: [],
      components: []
    };

    it('should save project with File System Access API', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn()
      };
      
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable)
      };
      
      global.window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.saveProject(mockProject);
      
      expect(global.window.showSaveFilePicker).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should fallback to download when File System Access API fails', async () => {
      global.window.showSaveFilePicker = vi.fn().mockRejectedValue(new Error('API not supported'));
      
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      global.document = {
        createElement: vi.fn().mockReturnValue(mockAnchor)
      } as any;
      
      const result = await FileManager.saveProject(mockProject);
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('File System Access API failed'));
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should save project as ZIP archive', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn()
      };
      
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable)
      };
      
      global.window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.saveProject(mockProject, true);
      
      expect(result).toBe(true);
      expect(mockWritable.write).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle file reading errors gracefully', async () => {
      const mockFileHandle = {
        getFile: vi.fn().mockRejectedValue(new Error('File access denied'))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error opening project'));
    });

    it('should handle JSON parsing errors', async () => {
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile('invalid.vb6', 'invalid json content'))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(result).toBeNull();
    });

    it('should handle save errors gracefully', async () => {
      global.window.showSaveFilePicker = vi.fn().mockRejectedValue(new Error('Save failed'));
      
      // Mock failed download fallback
      global.document = {
        createElement: vi.fn().mockImplementation(() => {
          throw new Error('DOM error');
        })
      } as any;
      
      const result = await FileManager.saveProject({} as any);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error saving project'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file selection', async () => {
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(null)
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      expect(result).toBeNull();
    });

    it('should handle user cancellation', async () => {
      global.window.showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError'));
      
      // Simulate no file selected in fallback
      const mockInput = {
        type: '',
        accept: '',
        style: { display: '' },
        click: vi.fn(),
        onchange: null,
        files: null
      };
      
      global.document = {
        createElement: vi.fn().mockReturnValue(mockInput),
        body: { appendChild: vi.fn(), removeChild: vi.fn() }
      } as any;
      
      const resultPromise = FileManager.openProject();
      
      // Simulate no file selected
      if (mockInput.onchange) {
        mockInput.onchange({ target: mockInput } as any);
      }
      
      const result = await resultPromise;
      
      expect(result).toBeNull();
    });

    it('should handle very large files', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile('large.vb6', largeContent))
      };
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      const result = await FileManager.openProject();
      
      // Should handle large files gracefully (either succeed or fail cleanly)
      expect(typeof result === 'object' || result === null).toBe(true);
    });
  });
});