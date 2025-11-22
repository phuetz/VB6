import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FileManager from '../../services/FileManager';

// Mocks
const mockFileSystem = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readDir: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
  exists: vi.fn(),
  stat: vi.fn()
};

// Mock File API
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string;

  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options?.type || 'text/plain';
    this.lastModified = options?.lastModified || Date.now();
    this.content = bits.join('');
  }

  async text() {
    return this.content;
  }

  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

global.FileReader = class MockFileReader {
  result: any = null;
  error: any = null;
  onload: any = null;
  onerror: any = null;

  readAsText(file: any) {
    setTimeout(() => {
      this.result = file.content;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsDataURL(file: any) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,${btoa(file.content)}`;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsArrayBuffer(file: any) {
    setTimeout(() => {
      this.result = new TextEncoder().encode(file.content).buffer;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
} as any;

describe('File Management Tests', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('VB6 File Format Parsing', () => {
    it('should parse VB6 form file (.frm)', async () => {
      const frmContent = `VERSION 5.00
Begin VB.Form Form1 
   Caption         =   "Test Form"
   ClientHeight    =   3015
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   4560
   LinkTopic       =   "Form1"
   ScaleHeight     =   3015
   ScaleWidth      =   4560
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton Command1 
      Caption         =   "Click Me"
      Height          =   495
      Left            =   1680
      TabIndex        =   0
      Top             =   1200
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   375
      Left            =   1200
      TabIndex        =   1
      Text            =   "Hello"
      Top             =   480
      Width           =   2055
   End
End`;

      const parsed = await fileManager.parseVB6Form(frmContent);
      
      expect(parsed.name).toBe('Form1');
      expect(parsed.properties.Caption).toBe('Test Form');
      expect(parsed.properties.ClientWidth).toBe(4560);
      expect(parsed.controls).toHaveLength(2);
      expect(parsed.controls[0].type).toBe('CommandButton');
      expect(parsed.controls[0].name).toBe('Command1');
      expect(parsed.controls[1].type).toBe('TextBox');
      expect(parsed.controls[1].properties.Text).toBe('Hello');
    });

    it('should parse VB6 project file (.vbp)', async () => {
      const vbpContent = `Type=Exe
Reference=*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\System32\\stdole2.tlb#OLE Automation
Form=Form1.frm
Module=Module1; Module1.bas
Class=Class1; Class1.cls
IconForm="Form1"
Startup="Form1"
Title="Test Project"
ExeName32="TestProject.exe"
Path32=""
Command32=""
Name="TestProject"
HelpContextID="0"
CompatibleMode="0"
MajorVer=1
MinorVer=0
RevisionVer=0
AutoIncrementVer=0
ServerSupportFiles=0
VersionCompanyName="Test Company"
CompilationType=0
OptimizationType=0
FavorPentiumPro(tm)=0
CodeViewDebugInfo=0
NoAliasing=0
BoundsCheck=0
OverflowCheck=0
FlPointCheck=0
FDIVCheck=0
UnroundedFP=0
StartMode=0
Unattended=0
Retained=0
ThreadPerObject=0
MaxNumberOfThreads=1`;

      const parsed = await fileManager.parseVB6Project(vbpContent);
      
      expect(parsed.type).toBe('Exe');
      expect(parsed.name).toBe('TestProject');
      expect(parsed.title).toBe('Test Project');
      expect(parsed.startup).toBe('Form1');
      expect(parsed.forms).toContain('Form1.frm');
      expect(parsed.modules).toContain('Module1.bas');
      expect(parsed.classes).toContain('Class1.cls');
      expect(parsed.version.major).toBe(1);
      expect(parsed.version.minor).toBe(0);
    });

    it('should parse VB6 module file (.bas)', async () => {
      const basContent = `Attribute VB_Name = "Module1"
Option Explicit

Public Const MAX_VALUE As Integer = 100
Private m_Counter As Long

Public Function Add(ByVal a As Integer, ByVal b As Integer) As Integer
    Add = a + b
End Function

Public Sub Main()
    Dim result As Integer
    result = Add(5, 10)
    MsgBox "Result: " & result
End Sub`;

      const parsed = await fileManager.parseVB6Module(basContent);
      
      expect(parsed.name).toBe('Module1');
      expect(parsed.hasOptionExplicit).toBe(true);
      expect(parsed.constants).toHaveLength(1);
      expect(parsed.constants[0].name).toBe('MAX_VALUE');
      expect(parsed.variables).toHaveLength(1);
      expect(parsed.functions).toHaveLength(1);
      expect(parsed.functions[0].name).toBe('Add');
      expect(parsed.subroutines).toHaveLength(1);
      expect(parsed.subroutines[0].name).toBe('Main');
    });

    it('should parse VB6 class file (.cls)', async () => {
      const clsContent = `VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
  Persistable = 0  'NotPersistable
  DataBindingBehavior = 0  'vbNone
  DataSourceBehavior  = 0  'vbNone
  MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "Class1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit

Private m_Name As String
Private m_Value As Integer

Public Property Get Name() As String
    Name = m_Name
End Property

Public Property Let Name(ByVal vNewValue As String)
    m_Name = vNewValue
End Property

Public Function Calculate(ByVal x As Integer) As Integer
    Calculate = x * m_Value
End Function`;

      const parsed = await fileManager.parseVB6Class(clsContent);
      
      expect(parsed.name).toBe('Class1');
      expect(parsed.multiUse).toBe(true);
      expect(parsed.creatable).toBe(true);
      expect(parsed.exposed).toBe(false);
      expect(parsed.properties).toHaveLength(1);
      expect(parsed.properties[0].name).toBe('Name');
      expect(parsed.methods).toHaveLength(1);
      expect(parsed.methods[0].name).toBe('Calculate');
    });
  });

  describe('File Import/Export', () => {
    it('should import VB6 project structure', async () => {
      const projectFiles = [
        new File([`Type=Exe\nName="TestProject"`], 'TestProject.vbp'),
        new File([`VERSION 5.00\nBegin VB.Form Form1\nEnd`], 'Form1.frm'),
        new File([`Attribute VB_Name = "Module1"`], 'Module1.bas')
      ];

      const imported = await fileManager.importVB6Project(projectFiles);
      
      expect(imported.name).toBe('TestProject');
      expect(imported.forms).toHaveLength(1);
      expect(imported.modules).toHaveLength(1);
    });

    it('should export project to VB6 format', async () => {
      const project = {
        name: 'TestProject',
        type: 'Exe',
        forms: [{
          name: 'Form1',
          caption: 'Main Form',
          controls: []
        }],
        modules: [{
          name: 'Module1',
          code: 'Public Sub Main()\nEnd Sub'
        }]
      };

      const exported = await fileManager.exportVB6Project(project);
      
      expect(exported).toHaveProperty('TestProject.vbp');
      expect(exported).toHaveProperty('Form1.frm');
      expect(exported).toHaveProperty('Module1.bas');
    });

    it('should handle binary resource files', async () => {
      const resourceFile = new File(
        [new Uint8Array([0x00, 0x01, 0x02, 0x03])],
        'resource.res',
        { type: 'application/octet-stream' }
      );

      const imported = await fileManager.importBinaryResource(resourceFile);
      
      expect(imported.name).toBe('resource.res');
      expect(imported.data).toBeInstanceOf(ArrayBuffer);
      expect(imported.size).toBe(4);
    });

    it('should validate file formats on import', async () => {
      const invalidFile = new File(['invalid content'], 'test.xyz');
      
      await expect(fileManager.importFile(invalidFile))
        .rejects.toThrow('Unsupported file format');
    });
  });

  describe('Project Management', () => {
    it('should save project to localStorage', async () => {
      const project = {
        name: 'TestProject',
        forms: [],
        modules: [],
        lastModified: Date.now()
      };

      await fileManager.saveProject(project);
      
      const saved = localStorage.getItem('vb6_project_TestProject');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('TestProject');
    });

    it('should load project from localStorage', async () => {
      const project = {
        name: 'TestProject',
        forms: [],
        modules: []
      };

      localStorage.setItem('vb6_project_TestProject', JSON.stringify(project));
      
      const loaded = await fileManager.loadProject('TestProject');
      expect(loaded.name).toBe('TestProject');
    });

    it('should list all saved projects', async () => {
      localStorage.setItem('vb6_project_Project1', JSON.stringify({ name: 'Project1' }));
      localStorage.setItem('vb6_project_Project2', JSON.stringify({ name: 'Project2' }));
      localStorage.setItem('other_key', 'other_value');

      const projects = await fileManager.listProjects();
      
      expect(projects).toHaveLength(2);
      expect(projects).toContain('Project1');
      expect(projects).toContain('Project2');
    });

    it('should delete project', async () => {
      localStorage.setItem('vb6_project_TestProject', JSON.stringify({ name: 'TestProject' }));
      
      await fileManager.deleteProject('TestProject');
      
      expect(localStorage.getItem('vb6_project_TestProject')).toBeNull();
    });

    it('should handle project versioning', async () => {
      const project = {
        name: 'TestProject',
        version: '1.0.0',
        forms: []
      };

      await fileManager.saveProject(project);
      
      // Modifier et sauvegarder une nouvelle version
      project.version = '1.1.0';
      await fileManager.saveProjectVersion(project);
      
      const versions = await fileManager.getProjectVersions('TestProject');
      expect(versions).toContain('1.0.0');
      expect(versions).toContain('1.1.0');
    });
  });

  describe('File System Operations', () => {
    it('should create directory structure', async () => {
      await fileManager.createProjectStructure('NewProject');
      
      const structure = await fileManager.getProjectStructure('NewProject');
      
      expect(structure.directories).toContain('Forms');
      expect(structure.directories).toContain('Modules');
      expect(structure.directories).toContain('Classes');
      expect(structure.directories).toContain('Resources');
    });

    it('should handle file uploads', async () => {
      const uploadedFile = new File(['content'], 'upload.txt');
      
      const result = await fileManager.uploadFile(uploadedFile, '/uploads');
      
      expect(result.path).toBe('/uploads/upload.txt');
      expect(result.size).toBe(7);
      expect(result.success).toBe(true);
    });

    it('should support batch file operations', async () => {
      const files = [
        new File(['content1'], 'file1.txt'),
        new File(['content2'], 'file2.txt'),
        new File(['content3'], 'file3.txt')
      ];

      const results = await fileManager.uploadBatch(files);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should calculate file checksums', async () => {
      const file = new File(['test content'], 'test.txt');
      
      const checksum = await fileManager.calculateChecksum(file);
      
      expect(checksum).toBeDefined();
      expect(checksum).toHaveLength(64); // SHA-256 hex string
    });

    it('should detect file changes', async () => {
      const file1 = new File(['content1'], 'test.txt');
      const file2 = new File(['content2'], 'test.txt');
      
      const checksum1 = await fileManager.calculateChecksum(file1);
      const checksum2 = await fileManager.calculateChecksum(file2);
      
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('Auto-save and Recovery', () => {
    it('should auto-save projects periodically', async () => {
      const project = {
        name: 'TestProject',
        autoSave: true,
        forms: []
      };

      fileManager.enableAutoSave(project, 1000); // 1 second interval
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const saved = localStorage.getItem('vb6_autosave_TestProject');
      expect(saved).toBeTruthy();
      
      fileManager.disableAutoSave();
    });

    it('should create backup before saving', async () => {
      const project = {
        name: 'TestProject',
        forms: []
      };

      await fileManager.saveProject(project);
      
      // Modifier et sauvegarder à nouveau
      project.forms.push({ name: 'Form1' } as any);
      await fileManager.saveProject(project);
      
      const backup = await fileManager.getBackup('TestProject');
      expect(backup.forms).toHaveLength(0); // Version précédente
    });

    it('should recover from auto-save', async () => {
      const autoSaveData = {
        name: 'TestProject',
        forms: [{ name: 'Form1' }],
        timestamp: Date.now()
      };

      localStorage.setItem('vb6_autosave_TestProject', JSON.stringify(autoSaveData));
      
      const recovered = await fileManager.recoverAutoSave('TestProject');
      
      expect(recovered).toBeDefined();
      expect(recovered.forms).toHaveLength(1);
    });

    it('should clean old auto-saves', async () => {
      // Créer des auto-saves anciennes
      const oldDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 jours
      
      localStorage.setItem('vb6_autosave_OldProject', JSON.stringify({
        timestamp: oldDate
      }));
      
      localStorage.setItem('vb6_autosave_NewProject', JSON.stringify({
        timestamp: Date.now()
      }));

      await fileManager.cleanOldAutoSaves();
      
      expect(localStorage.getItem('vb6_autosave_OldProject')).toBeNull();
      expect(localStorage.getItem('vb6_autosave_NewProject')).toBeTruthy();
    });
  });

  describe('File Compression', () => {
    it('should compress project for export', async () => {
      const project = {
        name: 'TestProject',
        forms: Array(10).fill({ name: 'Form', data: 'x'.repeat(1000) })
      };

      const compressed = await fileManager.compressProject(project);
      const original = JSON.stringify(project);
      
      expect(compressed.length).toBeLessThan(original.length);
    });

    it('should decompress imported projects', async () => {
      const project = {
        name: 'TestProject',
        data: 'test'
      };

      const compressed = await fileManager.compressProject(project);
      const decompressed = await fileManager.decompressProject(compressed);
      
      expect(decompressed.name).toBe('TestProject');
      expect(decompressed.data).toBe('test');
    });
  });

  describe('File Validation', () => {
    it('should validate VB6 syntax in files', async () => {
      const validCode = `
        Public Sub Main()
          Dim x As Integer
          x = 10
        End Sub
      `;

      const invalidCode = `
        Public Sub Main()
          Dim x As
          x = 
        End Sub
      `;

      expect(await fileManager.validateVB6Code(validCode)).toBe(true);
      expect(await fileManager.validateVB6Code(invalidCode)).toBe(false);
    });

    it('should check for file corruption', async () => {
      const file = new File(['content'], 'test.txt');
      const checksum = await fileManager.calculateChecksum(file);
      
      // Simuler une corruption
      const corruptedFile = new File(['corrupted'], 'test.txt');
      
      const isValid = await fileManager.verifyFileIntegrity(corruptedFile, checksum);
      expect(isValid).toBe(false);
    });

    it('should validate project structure', async () => {
      const validProject = {
        name: 'TestProject',
        type: 'Exe',
        forms: [],
        modules: []
      };

      const invalidProject = {
        name: '', // Nom manquant
        forms: []
      };

      expect(fileManager.validateProjectStructure(validProject)).toBe(true);
      expect(fileManager.validateProjectStructure(invalidProject)).toBe(false);
    });
  });

  describe('Recent Files', () => {
    it('should track recently opened files', async () => {
      await fileManager.addToRecent('Project1.vbp');
      await fileManager.addToRecent('Project2.vbp');
      
      const recent = await fileManager.getRecentFiles();
      
      expect(recent).toHaveLength(2);
      expect(recent[0]).toBe('Project2.vbp'); // Plus récent en premier
      expect(recent[1]).toBe('Project1.vbp');
    });

    it('should limit recent files list', async () => {
      for (let i = 0; i < 15; i++) {
        await fileManager.addToRecent(`Project${i}.vbp`);
      }

      const recent = await fileManager.getRecentFiles();
      expect(recent).toHaveLength(10); // Limite par défaut
    });

    it('should remove deleted files from recent', async () => {
      await fileManager.addToRecent('Project1.vbp');
      await fileManager.addToRecent('Project2.vbp');
      
      await fileManager.removeFromRecent('Project1.vbp');
      
      const recent = await fileManager.getRecentFiles();
      expect(recent).not.toContain('Project1.vbp');
    });

    it('should clear recent files', async () => {
      await fileManager.addToRecent('Project1.vbp');
      await fileManager.addToRecent('Project2.vbp');
      
      await fileManager.clearRecentFiles();
      
      const recent = await fileManager.getRecentFiles();
      expect(recent).toHaveLength(0);
    });
  });

  describe('File Watching', () => {
    it('should watch for file changes', async () => {
      const callback = vi.fn();
      
      fileManager.watchFile('test.txt', callback);
      
      // Simuler un changement de fichier
      await fileManager.triggerFileChange('test.txt', { type: 'modified' });
      
      expect(callback).toHaveBeenCalledWith({
        file: 'test.txt',
        type: 'modified'
      });
    });

    it('should stop watching files', async () => {
      const callback = vi.fn();
      
      const unwatch = fileManager.watchFile('test.txt', callback);
      unwatch();
      
      await fileManager.triggerFileChange('test.txt', { type: 'modified' });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should watch directory for changes', async () => {
      const callback = vi.fn();
      
      fileManager.watchDirectory('/project', callback);
      
      await fileManager.triggerFileChange('/project/new.txt', { type: 'created' });
      
      expect(callback).toHaveBeenCalledWith({
        file: '/project/new.txt',
        type: 'created'
      });
    });
  });

  describe('File Templates', () => {
    it('should provide file templates', async () => {
      const templates = await fileManager.getTemplates();
      
      expect(templates).toHaveProperty('form');
      expect(templates).toHaveProperty('module');
      expect(templates).toHaveProperty('class');
      expect(templates).toHaveProperty('userControl');
    });

    it('should create file from template', async () => {
      const file = await fileManager.createFromTemplate('module', {
        name: 'MyModule',
        author: 'Test User'
      });

      expect(file.name).toBe('MyModule.bas');
      expect(file.content).toContain('Attribute VB_Name = "MyModule"');
      expect(file.content).toContain('Author: Test User');
    });

    it('should support custom templates', async () => {
      const customTemplate = {
        name: 'CustomForm',
        extension: '.frm',
        content: 'VERSION 5.00\nBegin VB.Form {{name}}\nEnd'
      };

      fileManager.registerTemplate('customForm', customTemplate);
      
      const file = await fileManager.createFromTemplate('customForm', {
        name: 'MyForm'
      });

      expect(file.content).toContain('Begin VB.Form MyForm');
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      const errorFile = new File([''], 'error.txt');
      
      // Simuler une erreur de lecture
      vi.spyOn(errorFile, 'text').mockRejectedValue(new Error('Read error'));
      
      const result = await fileManager.readFile(errorFile).catch(err => err);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Read error');
    });

    it('should handle quota exceeded errors', async () => {
      // Simuler le dépassement du quota localStorage
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      const result = await fileManager.saveToStorage('large', largeData)
        .catch(err => err);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('quota');
    });

    it('should provide fallback for unsupported operations', async () => {
      // Simuler un navigateur sans File API
      const originalFile = global.File;
      global.File = undefined as any;
      
      const manager = new FileManager();
      const canUseFileAPI = manager.isFileAPISupported();
      
      expect(canUseFileAPI).toBe(false);
      
      global.File = originalFile;
    });
  });
});