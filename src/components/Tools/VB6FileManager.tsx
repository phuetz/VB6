import React, { useState, useRef, useCallback } from 'react';
import {
  VB6FileFormats,
  VB6FileType,
  VB6BinaryProperty,
  VB6ProjectGroup,
  VB6CacheEntry,
  VB6PropertyType,
} from '../../services/VB6FileFormats';

interface FileEntry {
  name: string;
  type: VB6FileType;
  size: number;
  modified: Date;
  data?: ArrayBuffer | string;
  parsed?: any;
}

interface VB6FileManagerProps {
  onFileLoad?: (filename: string, data: any) => void;
  onFileError?: (error: string) => void;
}

export const VB6FileManager: React.FC<VB6FileManagerProps> = ({ onFileLoad, onFileError }) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'browser' | 'frx' | 'vbg' | 'oca'>('browser');
  const [frxProperties, setFrxProperties] = useState<Map<number, VB6BinaryProperty>>(new Map());
  const [vbgProjects, setVbgProjects] = useState<VB6ProjectGroup[]>([]);
  const [ocaEntries, setOcaEntries] = useState<VB6CacheEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileFormats = VB6FileFormats.getInstance();

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);

      try {
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.')) as VB6FileType;
        let data: ArrayBuffer | string;
        let parsed: any;

        // Read file based on type
        if (ext === VB6FileType.VBG) {
          data = await file.text();
          parsed = fileFormats.parseVBGFile(data);
          setVbgProjects(parsed);
        } else {
          data = await file.arrayBuffer();

          switch (ext) {
            case VB6FileType.FRX:
              parsed = fileFormats.parseFRXFile(data);
              setFrxProperties(parsed);
              break;
            case VB6FileType.CTX:
              parsed = fileFormats.parseCTXFile(data);
              setFrxProperties(parsed);
              break;
            case VB6FileType.OCA:
              parsed = fileFormats.parseOCAFile(data);
              setOcaEntries(parsed);
              break;
          }
        }

        // Add to file list
        const fileEntry: FileEntry = {
          name: file.name,
          type: ext,
          size: file.size,
          modified: new Date(file.lastModified),
          data,
          parsed,
        };

        setFiles(prev => [...prev.filter(f => f.name !== file.name), fileEntry]);
        setSelectedFile(fileEntry);

        // Switch to appropriate tab
        switch (ext) {
          case VB6FileType.FRX:
          case VB6FileType.CTX:
            setActiveTab('frx');
            break;
          case VB6FileType.VBG:
            setActiveTab('vbg');
            break;
          case VB6FileType.OCA:
            setActiveTab('oca');
            break;
        }

        onFileLoad?.(file.name, parsed);
      } catch (error) {
        const errorMsg = `Error loading file: ${error}`;
        onFileError?.(errorMsg);
        console.error(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [fileFormats, onFileLoad, onFileError]
  );

  const handleFileRemove = useCallback(
    (filename: string) => {
      setFiles(prev => prev.filter(f => f.name !== filename));
      if (selectedFile?.name === filename) {
        setSelectedFile(null);
      }
    },
    [selectedFile]
  );

  const handleCreateNew = useCallback(
    (type: VB6FileType) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `New${type.toUpperCase().slice(1)}_${timestamp}${type}`;

      let data: ArrayBuffer | string;
      let parsed: any;

      switch (type) {
        case VB6FileType.FRX:
        case VB6FileType.CTX: {
          const props = new Map<number, VB6BinaryProperty>();
          data = fileFormats.generateFRXFile(props);
          parsed = props;
          setFrxProperties(props);
          setActiveTab('frx');
          break;
        }

        case VB6FileType.VBG: {
          const projects: VB6ProjectGroup[] = [];
          data = fileFormats.generateVBGFile(projects);
          parsed = projects;
          setVbgProjects(projects);
          setActiveTab('vbg');
          break;
        }

        case VB6FileType.OCA: {
          const entries: VB6CacheEntry[] = [];
          data = fileFormats.generateOCAFile(entries);
          parsed = entries;
          setOcaEntries(entries);
          setActiveTab('oca');
          break;
        }

        default:
          return;
      }

      const fileEntry: FileEntry = {
        name: filename,
        type,
        size: typeof data === 'string' ? data.length : data.byteLength,
        modified: new Date(),
        data,
        parsed,
      };

      setFiles(prev => [...prev, fileEntry]);
      setSelectedFile(fileEntry);
    },
    [fileFormats]
  );

  const handleSaveFile = useCallback(
    (fileEntry: FileEntry) => {
      try {
        const blob = fileFormats.saveFile(fileEntry.name, fileEntry.data!);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileEntry.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      } catch (error) {
        onFileError?.(` Error saving file: ${error}`);
      }
    },
    [fileFormats, onFileError]
  );

  const renderPropertyValue = (prop: VB6BinaryProperty): string => {
    switch (prop.type) {
      case VB6PropertyType.String:
        return new TextDecoder().decode(prop.data);
      case VB6PropertyType.Picture:
        return `[Image: ${prop.size} bytes]`;
      case VB6PropertyType.Font:
        return `[Font: ${prop.size} bytes]`;
      case VB6PropertyType.Color:
        return `[Color: ${prop.size} bytes]`;
      case VB6PropertyType.Binary:
        return `[Binary: ${prop.size} bytes]`;
      default:
        return `[Unknown: ${prop.size} bytes]`;
    }
  };

  const addFrxProperty = () => {
    const index = Math.max(0, ...Array.from(frxProperties.keys())) + 1;
    const newProp = fileFormats.createStringProperty('New Property');
    const newProps = new Map(frxProperties);
    newProps.set(index, newProp);
    setFrxProperties(newProps);

    // Update selected file
    if (selectedFile) {
      const updatedData = fileFormats.generateFRXFile(newProps);
      setSelectedFile({
        ...selectedFile,
        data: updatedData,
        parsed: newProps,
        size: updatedData.byteLength,
      });
    }
  };

  const addVbgProject = () => {
    const newProject: VB6ProjectGroup = {
      type: 'Project',
      reference: '',
      project: 'NewProject.vbp',
      package: 'NewProject.exe',
      startMode: 0,
    };

    const newProjects = [...vbgProjects, newProject];
    setVbgProjects(newProjects);

    // Update selected file
    if (selectedFile) {
      const updatedData = fileFormats.generateVBGFile(newProjects);
      setSelectedFile({
        ...selectedFile,
        data: updatedData,
        parsed: newProjects,
        size: updatedData.length,
      });
    }
  };

  const addOcaEntry = () => {
    const newEntry: VB6CacheEntry = {
      typeLibGuid: '00000000000000000000000000000000',
      version: '1.0',
      lcid: 1033,
      description: 'New Type Library',
      helpFile: '',
      helpContext: 0,
      flags: 0,
    };

    const newEntries = [...ocaEntries, newEntry];
    setOcaEntries(newEntries);

    // Update selected file
    if (selectedFile) {
      const updatedData = fileFormats.generateOCAFile(newEntries);
      setSelectedFile({
        ...selectedFile,
        data: updatedData,
        parsed: newEntries,
        size: updatedData.byteLength,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">VB6 File Manager</h2>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".frx,.ctx,.oca,.vbg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isProcessing ? 'Loading...' : 'Open File'}
            </button>
            <div className="relative">
              <select
                onChange={e => handleCreateNew(e.target.value as VB6FileType)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 appearance-none pr-8"
                value=""
              >
                <option value="" disabled>
                  New File
                </option>
                <option value={VB6FileType.FRX}>FRX (Form Binary)</option>
                <option value={VB6FileType.CTX}>CTX (Control Binary)</option>
                <option value={VB6FileType.VBG}>VBG (Project Group)</option>
                <option value={VB6FileType.OCA}>OCA (Object Cache)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Browser */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Files ({files.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {files.map(file => (
              <div
                key={file.name}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedFile?.name === file.name ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {file.type} • {(file.size / 1024).toFixed(1)} KB
                    </div>
                    <div className="text-xs text-gray-400">{file.modified.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleSaveFile(file);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Save"
                    >
                      💾
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleFileRemove(file.name);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No files loaded. Open or create a new file to get started.
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white flex flex-col">
          {selectedFile ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('browser')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'browser'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  File Info
                </button>
                {(selectedFile.type === VB6FileType.FRX ||
                  selectedFile.type === VB6FileType.CTX) && (
                  <button
                    onClick={() => setActiveTab('frx')}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'frx'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Properties
                  </button>
                )}
                {selectedFile.type === VB6FileType.VBG && (
                  <button
                    onClick={() => setActiveTab('vbg')}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'vbg'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Projects
                  </button>
                )}
                {selectedFile.type === VB6FileType.OCA && (
                  <button
                    onClick={() => setActiveTab('oca')}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'oca'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cache Entries
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'browser' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Filename</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedFile.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedFile.type}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Size</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {(selectedFile.size / 1024).toFixed(1)} KB ({selectedFile.size} bytes)
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Modified</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedFile.modified.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'frx' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Binary Properties</h3>
                      <button
                        onClick={addFrxProperty}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add Property
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Array.from(frxProperties.entries()).map(([index, prop]) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Property #{index}</div>
                            <div className="text-sm text-gray-500">
                              Type: {VB6PropertyType[prop.type]} | Size: {prop.size} bytes
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            {renderPropertyValue(prop)}
                          </div>
                        </div>
                      ))}
                      {frxProperties.size === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          No properties found. Add a new property to get started.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'vbg' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Project Group</h3>
                      <button
                        onClick={addVbgProject}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add Project
                      </button>
                    </div>
                    <div className="space-y-2">
                      {vbgProjects.map((project, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Project
                              </label>
                              <div className="mt-1 text-sm text-gray-900">{project.project}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Package
                              </label>
                              <div className="mt-1 text-sm text-gray-900">{project.package}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Start Mode
                              </label>
                              <div className="mt-1 text-sm text-gray-900">{project.startMode}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Reference
                              </label>
                              <div className="mt-1 text-sm text-gray-900">
                                {project.reference || 'None'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {vbgProjects.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          No projects found. Add a new project to get started.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'oca' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Object Cache Entries</h3>
                      <button
                        onClick={addOcaEntry}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add Entry
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ocaEntries.map((entry, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Type Library GUID
                              </label>
                              <div className="mt-1 text-sm text-gray-900 font-mono">
                                {entry.typeLibGuid}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Version
                              </label>
                              <div className="mt-1 text-sm text-gray-900">{entry.version}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Description
                              </label>
                              <div className="mt-1 text-sm text-gray-900">{entry.description}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                LCID
                              </label>
                              <div className="mt-1 text-sm text-gray-900">{entry.lcid}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {ocaEntries.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          No cache entries found. Add a new entry to get started.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VB6FileManager;
