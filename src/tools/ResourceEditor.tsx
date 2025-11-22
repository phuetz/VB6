import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Resource Types
export enum ResourceType {
  Icon = 'Icon',
  Bitmap = 'Bitmap',
  Cursor = 'Cursor',
  Dialog = 'Dialog',
  StringTable = 'String Table',
  Accelerator = 'Accelerator',
  Menu = 'Menu',
  Toolbar = 'Toolbar',
  Version = 'Version',
  Manifest = 'Manifest',
  RCData = 'RCData',
  HTML = 'HTML',
  Custom = 'Custom'
}

export enum ResourceFormat {
  RC = 'RC',
  RES = 'RES',
  ICO = 'ICO',
  BMP = 'BMP',
  CUR = 'CUR'
}

// Resource Item
export interface ResourceItem {
  id: string | number;
  name: string;
  type: ResourceType;
  language: string;
  size: number;
  data: ArrayBuffer | string;
  properties: Record<string, any>;
  modified: boolean;
  created: Date;
  lastModified: Date;
}

// String Table Entry
export interface StringTableEntry {
  id: number;
  value: string;
  comment?: string;
}

// Dialog Control
export interface DialogControl {
  id: number;
  type: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: number;
  exStyle: number;
  helpId?: number;
}

// Dialog Resource
export interface DialogResource {
  id: string | number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: number;
  exStyle: number;
  helpId?: number;
  font: {
    name: string;
    size: number;
    weight: number;
    italic: boolean;
    charset: number;
  };
  controls: DialogControl[];
}

// Menu Item
export interface MenuItem {
  id: number;
  text: string;
  type: 'POPUP' | 'MENUITEM' | 'SEPARATOR';
  flags: string[];
  children?: MenuItem[];
}

// Accelerator Entry
export interface AcceleratorEntry {
  id: number;
  key: string;
  flags: string[];
  command: number;
}

// Version Information
export interface VersionInfo {
  fileVersion: string;
  productVersion: string;
  fileFlagsMask: number;
  fileFlags: number;
  fileOS: number;
  fileType: number;
  fileSubtype: number;
  stringFileInfo: {
    companyName: string;
    fileDescription: string;
    fileVersion: string;
    internalName: string;
    legalCopyright: string;
    legalTrademarks: string;
    originalFilename: string;
    productName: string;
    productVersion: string;
    comments: string;
    privateBuild?: string;
    specialBuild?: string;
  };
  varFileInfo: {
    translation: { language: number; codePage: number }[];
  };
}

interface ResourceEditorProps {
  resourceFile?: string;
  onResourceChange?: (resources: ResourceItem[]) => void;
  onSave?: (filename: string, format: ResourceFormat) => void;
}

export const ResourceEditor: React.FC<ResourceEditorProps> = ({
  resourceFile,
  onResourceChange,
  onSave
}) => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>(ResourceType.Icon);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(new Set(['root']));
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  
  const eventEmitter = useRef(new EventEmitter());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group resources by type
  const groupedResources = resources.reduce((groups, resource) => {
    if (!groups[resource.type]) {
      groups[resource.type] = [];
    }
    groups[resource.type].push(resource);
    return groups;
  }, {} as Record<ResourceType, ResourceItem[]>);

  // Filter resources based on search
  const filteredResources = searchFilter
    ? resources.filter(r => 
        r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.id.toString().includes(searchFilter)
      )
    : resources;

  // Load resource file
  const loadResourceFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Parse resource file (simplified - actual implementation would parse PE/COFF format)
    const loadedResources: ResourceItem[] = [];
    
    // For demonstration, create some sample resources
    if (file.name.endsWith('.ico')) {
      loadedResources.push({
        id: 1,
        name: file.name.replace('.ico', ''),
        type: ResourceType.Icon,
        language: 'en-US',
        size: arrayBuffer.byteLength,
        data: arrayBuffer,
        properties: { width: 32, height: 32, colors: 256 },
        modified: false,
        created: new Date(),
        lastModified: new Date()
      });
    } else if (file.name.endsWith('.bmp')) {
      loadedResources.push({
        id: 1,
        name: file.name.replace('.bmp', ''),
        type: ResourceType.Bitmap,
        language: 'en-US',
        size: arrayBuffer.byteLength,
        data: arrayBuffer,
        properties: { width: 0, height: 0, colors: 0 },
        modified: false,
        created: new Date(),
        lastModified: new Date()
      });
    }
    
    setResources(loadedResources);
    onResourceChange?.(loadedResources);
  }, [onResourceChange]);

  // Add new resource
  const addResource = useCallback((type: ResourceType, file?: File) => {
    const newId = Math.max(0, ...resources.map(r => typeof r.id === 'number' ? r.id : 0)) + 1;
    
    const newResource: ResourceItem = {
      id: newId,
      name: `${type}_${newId}`,
      type,
      language: 'en-US',
      size: 0,
      data: file ? new ArrayBuffer(0) : '',
      properties: getDefaultProperties(type),
      modified: true,
      created: new Date(),
      lastModified: new Date()
    };

    if (file) {
      file.arrayBuffer().then(buffer => {
        newResource.data = buffer;
        newResource.size = buffer.byteLength;
        
        setResources(prev => [...prev, newResource]);
        setSelectedResource(newResource);
        setIsDirty(true);
        onResourceChange?.([...resources, newResource]);
      });
    } else {
      setResources(prev => [...prev, newResource]);
      setSelectedResource(newResource);
      setIsDirty(true);
      onResourceChange?.([...resources, newResource]);
    }
    
    setShowAddDialog(false);
  }, [resources, onResourceChange]);

  // Get default properties for resource type
  const getDefaultProperties = (type: ResourceType): Record<string, any> => {
    switch (type) {
      case ResourceType.Icon:
        return { width: 32, height: 32, colors: 256 };
      case ResourceType.Bitmap:
        return { width: 0, height: 0, colors: 0 };
      case ResourceType.Dialog:
        return { x: 0, y: 0, width: 200, height: 100, controls: [] };
      case ResourceType.StringTable:
        return { entries: [] };
      case ResourceType.Menu:
        return { items: [] };
      case ResourceType.Accelerator:
        return { entries: [] };
      case ResourceType.Version:
        return getDefaultVersionInfo();
      default:
        return {};
    }
  };

  const getDefaultVersionInfo = (): VersionInfo => ({
    fileVersion: '1.0.0.0',
    productVersion: '1.0.0.0',
    fileFlagsMask: 0,
    fileFlags: 0,
    fileOS: 4, // VOS_NT_WINDOWS32
    fileType: 1, // VFT_APP
    fileSubtype: 0,
    stringFileInfo: {
      companyName: '',
      fileDescription: '',
      fileVersion: '1.0.0.0',
      internalName: '',
      legalCopyright: '',
      legalTrademarks: '',
      originalFilename: '',
      productName: '',
      productVersion: '1.0.0.0',
      comments: ''
    },
    varFileInfo: {
      translation: [{ language: 0x0409, codePage: 1252 }] // English US, Windows-1252
    }
  });

  // Delete resource
  const deleteResource = useCallback((resourceId: string | number) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
    if (selectedResource?.id === resourceId) {
      setSelectedResource(null);
    }
    setIsDirty(true);
  }, [selectedResource]);

  // Update resource
  const updateResource = useCallback((resourceId: string | number, updates: Partial<ResourceItem>) => {
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, ...updates, modified: true, lastModified: new Date() }
        : r
    ));
    
    if (selectedResource?.id === resourceId) {
      setSelectedResource(prev => prev ? { ...prev, ...updates } : null);
    }
    
    setIsDirty(true);
  }, [selectedResource]);

  // Generate preview for resource
  const generatePreview = useCallback((resource: ResourceItem) => {
    if (resource.type === ResourceType.Icon || resource.type === ResourceType.Bitmap) {
      if (resource.data instanceof ArrayBuffer) {
        const blob = new Blob([resource.data]);
        const url = URL.createObjectURL(blob);
        setPreviewData(url);
      }
    } else if (resource.type === ResourceType.StringTable) {
      const entries = resource.properties.entries as StringTableEntry[];
      const preview = entries.map(e => `${e.id}: "${e.value}"`).join('\n');
      setPreviewData(preview);
    } else {
      setPreviewData(null);
    }
  }, []);

  // Export resource
  const exportResource = useCallback((resource: ResourceItem, format: ResourceFormat) => {
    // Create download link
    let blob: Blob;
    let filename: string;
    
    if (format === ResourceFormat.ICO && resource.type === ResourceType.Icon) {
      blob = new Blob([resource.data as ArrayBuffer]);
      filename = `${resource.name}.ico`;
    } else if (format === ResourceFormat.BMP && resource.type === ResourceType.Bitmap) {
      blob = new Blob([resource.data as ArrayBuffer]);
      filename = `${resource.name}.bmp`;
    } else if (format === ResourceFormat.RC) {
      // Generate RC file content
      const rcContent = generateRCContent([resource]);
      blob = new Blob([rcContent], { type: 'text/plain' });
      filename = `${resource.name}.rc`;
    } else {
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Generate RC file content
  const generateRCContent = (resourceList: ResourceItem[]): string => {
    let content = '// Generated by VB6 Resource Editor\n\n';
    
    resourceList.forEach(resource => {
      switch (resource.type) {
        case ResourceType.StringTable: {
          content += 'STRINGTABLE\nBEGIN\n';
          const entries = resource.properties.entries as StringTableEntry[];
          entries.forEach(entry => {
            content += `    ${entry.id}, "${entry.value}"\n`;
          });
          content += 'END\n\n';
          break;
        }
          
        case ResourceType.Icon:
          content += `${resource.id} ICON "${resource.name}.ico"\n\n`;
          break;
          
        case ResourceType.Bitmap:
          content += `${resource.id} BITMAP "${resource.name}.bmp"\n\n`;
          break;
          
        case ResourceType.Dialog: {
          const dialog = resource.properties as DialogResource;
          content += `${resource.id} DIALOG ${dialog.x}, ${dialog.y}, ${dialog.width}, ${dialog.height}\n`;
          content += `STYLE DS_MODALFRAME | WS_POPUP | WS_CAPTION | WS_SYSMENU\n`;
          content += `CAPTION "${dialog.title}"\n`;
          content += `FONT ${dialog.font.size}, "${dialog.font.name}"\n`;
          content += 'BEGIN\n';
          dialog.controls.forEach(control => {
            content += `    ${control.type} "${control.text}", ${control.id}, ${control.x}, ${control.y}, ${control.width}, ${control.height}\n`;
          });
          content += 'END\n\n';
          break;
        }
      }
    });
    
    return content;
  };

  // Handle file drop
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.name.endsWith('.ico')) {
        addResource(ResourceType.Icon, file);
      } else if (file.name.endsWith('.bmp')) {
        addResource(ResourceType.Bitmap, file);
      } else if (file.name.endsWith('.cur')) {
        addResource(ResourceType.Cursor, file);
      }
    });
  }, [addResource]);

  // Toggle tree node expansion
  const toggleTreeNode = (nodeId: string) => {
    setTreeExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (selectedResource) {
      generatePreview(selectedResource);
    }
  }, [selectedResource, generatePreview]);

  const renderResourceTree = () => (
    <div className="h-full overflow-y-auto">
      <div className="p-2">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        />
      </div>
      
      <div className="px-2">
        {Object.entries(groupedResources).map(([type, items]) => (
          <div key={type} className="mb-2">
            <div
              className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded"
              onClick={() => toggleTreeNode(type)}
            >
              <span className="text-xs">
                {treeExpanded.has(type) ? '▼' : '▶'}
              </span>
              <span className="text-sm font-medium">{type}</span>
              <span className="text-xs text-gray-500">({items.length})</span>
            </div>
            
            {treeExpanded.has(type) && (
              <div className="ml-4">
                {items
                  .filter(item => !searchFilter || 
                    item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    item.id.toString().includes(searchFilter)
                  )
                  .map(item => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`flex items-center justify-between py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
                        selectedResource?.id === item.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedResource(item)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{getResourceIcon(item.type)}</span>
                        <span className="text-sm">{item.name}</span>
                        {item.modified && <span className="text-xs text-orange-500">*</span>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResource(item.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
        
        {Object.keys(groupedResources).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No resources loaded</p>
            <p className="text-xs mt-1">Import resources or create new ones</p>
          </div>
        )}
      </div>
    </div>
  );

  const getResourceIcon = (type: ResourceType): string => {
    switch (type) {
      case ResourceType.Icon: return '🎯';
      case ResourceType.Bitmap: return '🖼️';
      case ResourceType.Cursor: return '👆';
      case ResourceType.Dialog: return '🪟';
      case ResourceType.StringTable: return '📃';
      case ResourceType.Menu: return '📋';
      case ResourceType.Accelerator: return '⌨️';
      case ResourceType.Version: return 'ℹ️';
      case ResourceType.Manifest: return '📄';
      default: return '📦';
    }
  };

  const renderResourceEditor = () => {
    if (!selectedResource) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-lg">Select a resource to edit</p>
            <p className="text-sm mt-2">Choose a resource from the tree to view and edit its properties</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              {getResourceIcon(selectedResource.type)} {selectedResource.name}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportResource(selectedResource, ResourceFormat.RC)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Export RC
              </button>
              {(selectedResource.type === ResourceType.Icon || selectedResource.type === ResourceType.Bitmap) && (
                <button
                  onClick={() => exportResource(
                    selectedResource, 
                    selectedResource.type === ResourceType.Icon ? ResourceFormat.ICO : ResourceFormat.BMP
                  )}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Export {selectedResource.type === ResourceType.Icon ? 'ICO' : 'BMP'}
                </button>
              )}
            </div>
          </div>
          
          {/* Resource Properties */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
              <input
                type="text"
                value={selectedResource.id}
                onChange={(e) => updateResource(selectedResource.id, { id: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={selectedResource.name}
                onChange={(e) => updateResource(selectedResource.id, { name: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={selectedResource.language}
                onChange={(e) => updateResource(selectedResource.id, { language: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="es-ES">Spanish</option>
                <option value="it-IT">Italian</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                value={`${selectedResource.size} bytes`}
                readOnly
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Type-specific Editor */}
        {selectedResource.type === ResourceType.StringTable && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">String Entries</h4>
            <div className="border border-gray-300 rounded">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 text-sm font-medium">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-2">ID</div>
                  <div className="col-span-8">Value</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {(selectedResource.properties.entries as StringTableEntry[]).map((entry, index) => (
                  <div key={index} className="px-3 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={entry.id}
                          onChange={(e) => {
                            const entries = [...(selectedResource.properties.entries as StringTableEntry[])];
                            entries[index].id = Number(e.target.value);
                            updateResource(selectedResource.id, { 
                              properties: { ...selectedResource.properties, entries }
                            });
                          }}
                          className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                        />
                      </div>
                      <div className="col-span-8">
                        <input
                          type="text"
                          value={entry.value}
                          onChange={(e) => {
                            const entries = [...(selectedResource.properties.entries as StringTableEntry[])];
                            entries[index].value = e.target.value;
                            updateResource(selectedResource.id, { 
                              properties: { ...selectedResource.properties, entries }
                            });
                          }}
                          className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            const entries = (selectedResource.properties.entries as StringTableEntry[])
                              .filter((_, i) => i !== index);
                            updateResource(selectedResource.id, { 
                              properties: { ...selectedResource.properties, entries }
                            });
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-300">
                <button
                  onClick={() => {
                    const entries = [...(selectedResource.properties.entries as StringTableEntry[])];
                    const newId = Math.max(0, ...entries.map(e => e.id)) + 1;
                    entries.push({ id: newId, value: '' });
                    updateResource(selectedResource.id, { 
                      properties: { ...selectedResource.properties, entries }
                    });
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Add String
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedResource.type === ResourceType.Version && (
          <div>
            <h4 className="font-medium text-gray-700 mb-4">Version Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Version</label>
                  <input
                    type="text"
                    value={(selectedResource.properties as VersionInfo).fileVersion}
                    onChange={(e) => updateResource(selectedResource.id, {
                      properties: { 
                        ...selectedResource.properties, 
                        fileVersion: e.target.value,
                        stringFileInfo: {
                          ...(selectedResource.properties as VersionInfo).stringFileInfo,
                          fileVersion: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Version</label>
                  <input
                    type="text"
                    value={(selectedResource.properties as VersionInfo).productVersion}
                    onChange={(e) => updateResource(selectedResource.id, {
                      properties: { 
                        ...selectedResource.properties, 
                        productVersion: e.target.value,
                        stringFileInfo: {
                          ...(selectedResource.properties as VersionInfo).stringFileInfo,
                          productVersion: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              
              {/* String File Info */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">String Information</h5>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries((selectedResource.properties as VersionInfo).stringFileInfo).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateResource(selectedResource.id, {
                          properties: {
                            ...selectedResource.properties,
                            stringFileInfo: {
                              ...(selectedResource.properties as VersionInfo).stringFileInfo,
                              [key]: e.target.value
                            }
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {previewData && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-2">Preview</h4>
            <div className="border border-gray-300 rounded p-4 bg-gray-50">
              {selectedResource.type === ResourceType.Icon || selectedResource.type === ResourceType.Bitmap ? (
                <img 
                  src={previewData} 
                  alt={selectedResource.name}
                  className="max-w-full max-h-64 object-contain"
                />
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{previewData}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Resource Editor</h1>
            {isDirty && <span className="text-sm text-orange-600">* Unsaved changes</span>}
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ico,.bmp,.cur,.rc,.res"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadResourceFile(file);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Import
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Resource
            </button>
            <button
              onClick={() => {
                const rcContent = generateRCContent(resources);
                const blob = new Blob([rcContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'resources.rc';
                link.click();
                URL.revokeObjectURL(url);
              }}
              disabled={resources.length === 0}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              Export All
            </button>
            <button
              onClick={() => onSave?.('resources.res', ResourceFormat.RES)}
              disabled={!isDirty}
              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Resource Tree */}
        <div className="w-80 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Resources</h3>
          </div>
          <div className="flex-1">
            {renderResourceTree()}
          </div>
        </div>

        {/* Resource Editor */}
        <div 
          className="flex-1 overflow-hidden"
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {renderResourceEditor()}
        </div>
      </div>

      {/* Add Resource Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add New Resource</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <select
                value={selectedResourceType}
                onChange={(e) => setSelectedResourceType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                {Object.values(ResourceType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => addResource(selectedResourceType)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceEditor;