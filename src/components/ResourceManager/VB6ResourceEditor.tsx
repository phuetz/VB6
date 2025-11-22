/**
 * VB6 Resource Editor - Complete Resource Management Interface
 * Provides full editing capabilities for VB6 resource files (.res)
 * Supports strings, icons, cursors, menus, dialogs, and version information
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  VB6ResourceManagerInstance, 
  VB6ResourceType, 
  VB6LanguageID, 
  VB6ResourceEntry,
  VB6StringResource,
  VB6IconResource,
  VB6MenuResource,
  VB6DialogResource,
  VB6VersionResource,
  VB6MenuItem
} from '../../services/VB6ResourceManager';

interface VB6ResourceEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: ArrayBuffer) => void;
  onLoad?: (file: File) => void;
}

type ResourceFilter = 'all' | 'strings' | 'icons' | 'cursors' | 'menus' | 'dialogs' | 'version' | 'custom';

export const VB6ResourceEditor: React.FC<VB6ResourceEditorProps> = ({
  visible,
  onClose,
  onSave,
  onLoad
}) => {
  const [resources, setResources] = useState<VB6ResourceEntry[]>([]);
  const [selectedResource, setSelectedResource] = useState<VB6ResourceEntry | null>(null);
  const [filter, setFilter] = useState<ResourceFilter>('all');
  const [editMode, setEditMode] = useState<'view' | 'edit' | 'add'>('view');
  const [isDirty, setIsDirty] = useState(false);
  
  // String editor state
  const [stringResources, setStringResources] = useState<VB6StringResource[]>([]);
  const [editingString, setEditingString] = useState<VB6StringResource | null>(null);
  const [newStringId, setNewStringId] = useState<number>(1000);
  const [newStringValue, setNewStringValue] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<VB6LanguageID>(VB6LanguageID.LANG_NEUTRAL);
  
  // Icon/Cursor editor state
  const [iconResources, setIconResources] = useState<VB6IconResource[]>([]);
  
  // Menu editor state
  const [menuResources, setMenuResources] = useState<VB6MenuResource[]>([]);
  const [editingMenu, setEditingMenu] = useState<VB6MenuResource | null>(null);
  
  // Dialog editor state
  const [dialogResources, setDialogResources] = useState<VB6DialogResource[]>([]);
  
  // Version editor state
  const [versionResource, setVersionResource] = useState<VB6VersionResource | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize resources
  useEffect(() => {
    if (visible) {
      refreshResources();
    }
  }, [visible]);

  const refreshResources = useCallback(() => {
    const allResources = VB6ResourceManagerInstance.getAllResources();
    setResources(allResources);
    setStringResources(VB6ResourceManagerInstance.getAllStringResources());
    setIconResources(VB6ResourceManagerInstance.getAllIconResources());
    setVersionResource(VB6ResourceManagerInstance.getVersionResource());
    setIsDirty(VB6ResourceManagerInstance.isDirtyFlag());
  }, []);

  // Filter resources
  const filteredResources = resources.filter(resource => {
    switch (filter) {
      case 'strings': return resource.type === VB6ResourceType.RT_STRING;
      case 'icons': return resource.type === VB6ResourceType.RT_ICON;
      case 'cursors': return resource.type === VB6ResourceType.RT_CURSOR;
      case 'menus': return resource.type === VB6ResourceType.RT_MENU;
      case 'dialogs': return resource.type === VB6ResourceType.RT_DIALOG;
      case 'version': return resource.type === VB6ResourceType.RT_VERSION;
      case 'custom': return resource.type >= VB6ResourceType.RT_CUSTOM;
      default: return true;
    }
  });

  // File operations
  const handleLoadFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const success = await VB6ResourceManagerInstance.loadResourceFile(arrayBuffer);
      
      if (success) {
        refreshResources();
        if (onLoad) onLoad(file);
      } else {
        alert('Failed to load resource file');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading resource file');
    }
  }, [refreshResources, onLoad]);

  const handleSaveFile = useCallback(async () => {
    try {
      const data = await VB6ResourceManagerInstance.saveResourceFile();
      if (onSave) {
        onSave(data);
      } else {
        // Download file
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resources.res';
        a.click();
        URL.revokeObjectURL(url);
      }
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Error saving resource file');
    }
  }, [onSave]);

  // String resource operations
  const handleAddString = useCallback(() => {
    if (newStringValue.trim()) {
      VB6ResourceManagerInstance.addStringResource(
        newStringId,
        newStringValue,
        selectedLanguage,
        `String resource ${newStringId}`
      );
      setNewStringId(newStringId + 1);
      setNewStringValue('');
      refreshResources();
    }
  }, [newStringId, newStringValue, selectedLanguage, refreshResources]);

  const handleEditString = useCallback((resource: VB6StringResource) => {
    setEditingString(resource);
    setEditMode('edit');
  }, []);

  const handleSaveString = useCallback(() => {
    if (editingString) {
      VB6ResourceManagerInstance.addStringResource(
        editingString.id,
        editingString.value,
        editingString.languageId,
        editingString.description
      );
      setEditingString(null);
      setEditMode('view');
      refreshResources();
    }
  }, [editingString, refreshResources]);

  const handleDeleteString = useCallback((id: number, languageId?: VB6LanguageID) => {
    if (confirm('Are you sure you want to delete this string resource?')) {
      VB6ResourceManagerInstance.removeStringResource(id, languageId);
      refreshResources();
    }
  }, [refreshResources]);

  // Icon resource operations
  const handleAddIcon = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.ico,.cur';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const id = Math.max(...iconResources.map(i => i.id), 0) + 1;
        const isCursor = file.name.toLowerCase().endsWith('.cur');
        
        VB6ResourceManagerInstance.addIconResource(
          id,
          arrayBuffer,
          32, // Default width
          32, // Default height
          32, // Default color depth
          isCursor
        );
        
        refreshResources();
      } catch (error) {
        console.error('Error adding icon:', error);
      }
    };
    input.click();
  }, [iconResources, refreshResources]);

  // Menu resource operations
  const handleAddMenu = useCallback(() => {
    const newMenu: VB6MenuResource = {
      id: Math.max(...menuResources.map(m => m.id), 0) + 1,
      items: [
        {
          id: 1001,
          text: '&File',
          enabled: true,
          checked: false,
          separator: false,
          popup: true,
          children: [
            { id: 1002, text: '&New', enabled: true, checked: false, separator: false, popup: false },
            { id: 1003, text: '&Open', enabled: true, checked: false, separator: false, popup: false },
            { id: 0, text: '', enabled: false, checked: false, separator: true, popup: false },
            { id: 1004, text: 'E&xit', enabled: true, checked: false, separator: false, popup: false }
          ]
        }
      ],
      languageId: selectedLanguage
    };
    
    VB6ResourceManagerInstance.addMenuResource(newMenu.id, newMenu.items, newMenu.languageId);
    refreshResources();
  }, [menuResources, selectedLanguage, refreshResources]);

  // Version resource operations
  const handleAddVersion = useCallback(() => {
    const newVersion: VB6VersionResource = {
      fileVersion: { major: 1, minor: 0, build: 0, revision: 0 },
      productVersion: { major: 1, minor: 0, build: 0, revision: 0 },
      fileFlagsMask: 0,
      fileFlags: 0,
      fileOS: 0x40004, // VOS_NT_WINDOWS32
      fileType: 0x1, // VFT_APP
      fileSubtype: 0,
      stringInfo: {
        'CompanyName': 'Your Company',
        'FileDescription': 'Your Application',
        'FileVersion': '1.0.0.0',
        'InternalName': 'YourApp',
        'LegalCopyright': 'Copyright © Your Company',
        'OriginalFilename': 'YourApp.exe',
        'ProductName': 'Your Product',
        'ProductVersion': '1.0.0.0'
      }
    };
    
    VB6ResourceManagerInstance.setVersionResource(newVersion);
    refreshResources();
  }, [refreshResources]);

  // Resource type helpers
  const getResourceTypeName = (type: VB6ResourceType): string => {
    switch (type) {
      case VB6ResourceType.RT_CURSOR: return 'Cursor';
      case VB6ResourceType.RT_BITMAP: return 'Bitmap';
      case VB6ResourceType.RT_ICON: return 'Icon';
      case VB6ResourceType.RT_MENU: return 'Menu';
      case VB6ResourceType.RT_DIALOG: return 'Dialog';
      case VB6ResourceType.RT_STRING: return 'String';
      case VB6ResourceType.RT_ACCELERATOR: return 'Accelerator';
      case VB6ResourceType.RT_RCDATA: return 'Raw Data';
      case VB6ResourceType.RT_VERSION: return 'Version Info';
      default: return 'Custom';
    }
  };

  const getResourceIcon = (type: VB6ResourceType): string => {
    switch (type) {
      case VB6ResourceType.RT_CURSOR: return '🖱️';
      case VB6ResourceType.RT_BITMAP: return '🖼️';
      case VB6ResourceType.RT_ICON: return '🎨';
      case VB6ResourceType.RT_MENU: return '📋';
      case VB6ResourceType.RT_DIALOG: return '🪟';
      case VB6ResourceType.RT_STRING: return '📝';
      case VB6ResourceType.RT_VERSION: return 'ℹ️';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getLanguageName = (langId: VB6LanguageID): string => {
    switch (langId) {
      case VB6LanguageID.LANG_ENGLISH: return 'English';
      case VB6LanguageID.LANG_FRENCH: return 'French';
      case VB6LanguageID.LANG_GERMAN: return 'German';
      case VB6LanguageID.LANG_SPANISH: return 'Spanish';
      case VB6LanguageID.LANG_ITALIAN: return 'Italian';
      case VB6LanguageID.LANG_JAPANESE: return 'Japanese';
      case VB6LanguageID.LANG_CHINESE: return 'Chinese';
      default: return 'Neutral';
    }
  };

  // Render components
  const renderStringEditor = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-bold text-sm mb-2">String Resources</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={newStringId}
            onChange={(e) => setNewStringId(parseInt(e.target.value) || 1000)}
            className="w-20 px-2 py-1 border text-xs"
            placeholder="ID"
          />
          <input
            type="text"
            value={newStringValue}
            onChange={(e) => setNewStringValue(e.target.value)}
            className="flex-1 px-2 py-1 border text-xs"
            placeholder="String value"
          />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(parseInt(e.target.value))}
            className="px-2 py-1 border text-xs"
          >
            <option value={VB6LanguageID.LANG_NEUTRAL}>Neutral</option>
            <option value={VB6LanguageID.LANG_ENGLISH}>English</option>
            <option value={VB6LanguageID.LANG_FRENCH}>French</option>
            <option value={VB6LanguageID.LANG_GERMAN}>German</option>
            <option value={VB6LanguageID.LANG_SPANISH}>Spanish</option>
          </select>
          <button
            onClick={handleAddString}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            disabled={!newStringValue.trim()}
          >
            Add
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-2 border-b">ID</th>
              <th className="text-left p-2 border-b">Value</th>
              <th className="text-left p-2 border-b">Language</th>
              <th className="text-left p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stringResources.map((resource, index) => (
              <tr key={`${resource.id}_${resource.languageId}`} className="hover:bg-gray-50">
                <td className="p-2 border-b font-mono">{resource.id}</td>
                <td className="p-2 border-b">
                  {editingString?.id === resource.id && editingString?.languageId === resource.languageId ? (
                    <input
                      type="text"
                      value={editingString.value}
                      onChange={(e) => setEditingString({ ...editingString, value: e.target.value })}
                      className="w-full px-1 py-1 border text-xs"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate block max-w-xs" title={resource.value}>
                      {resource.value}
                    </span>
                  )}
                </td>
                <td className="p-2 border-b">{getLanguageName(resource.languageId)}</td>
                <td className="p-2 border-b">
                  <div className="flex gap-1">
                    {editingString?.id === resource.id && editingString?.languageId === resource.languageId ? (
                      <>
                        <button
                          onClick={handleSaveString}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingString(null); setEditMode('view'); }}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditString(resource)}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteString(resource.id, resource.languageId)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIconEditor = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-bold text-sm mb-2">Icon/Cursor Resources</h3>
        <button
          onClick={handleAddIcon}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Add Icon/Cursor
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-4 gap-4">
          {iconResources.map((icon) => (
            <div
              key={icon.id}
              className="border rounded p-3 text-center hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedResource(resources.find(r => r.id === icon.id && (r.type === VB6ResourceType.RT_ICON || r.type === VB6ResourceType.RT_CURSOR)) || null)}
            >
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded flex items-center justify-center">
                {icon.isCursor ? '🖱️' : '🎨'}
              </div>
              <div className="text-xs font-mono">ID: {icon.id}</div>
              <div className="text-xs text-gray-600">
                {icon.width}×{icon.height} {icon.colorDepth}-bit
              </div>
              <div className="text-xs text-gray-600">
                {icon.isCursor ? 'Cursor' : 'Icon'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVersionEditor = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-bold text-sm mb-2">Version Information</h3>
        {!versionResource && (
          <button
            onClick={handleAddVersion}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Add Version Info
          </button>
        )}
      </div>
      
      {versionResource && (
        <div className="flex-1 overflow-auto p-3">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">File Version</label>
                <div className="flex gap-1">
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.fileVersion.major} readOnly />
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.fileVersion.minor} readOnly />
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.fileVersion.build} readOnly />
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.fileVersion.revision} readOnly />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Product Version</label>
                <div className="flex gap-1">
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.productVersion.major} readOnly />
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.productVersion.minor} readOnly />
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.productVersion.build} readOnly />
                  <input type="number" className="w-12 px-1 py-1 border text-xs" value={versionResource.productVersion.revision} readOnly />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold mb-2">String Information</h4>
              <div className="space-y-2">
                {Object.entries(versionResource.stringInfo).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="w-32 text-xs font-medium">{key}:</label>
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 border text-xs"
                      value={value}
                      readOnly
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '1000px',
        height: '700px',
        backgroundColor: '#F0F0F0',
        border: '2px outset #C0C0C0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt'
      }}>
        {/* Title Bar */}
        <div style={{
          backgroundColor: '#0080FF',
          color: 'white',
          padding: '2px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold'
        }}>
          <span>VB6 Resource Editor</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '12px'
            }}
          >
            ×
          </button>
        </div>

        {/* Menu Bar */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderBottom: '1px solid #C0C0C0',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={handleLoadFile}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: '#F0F0F0',
              border: '1px outset #C0C0C0',
              cursor: 'pointer'
            }}
          >
            Load .res
          </button>
          <button
            onClick={handleSaveFile}
            disabled={!isDirty}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: isDirty ? '#F0F0F0' : '#E0E0E0',
              border: '1px outset #C0C0C0',
              cursor: isDirty ? 'pointer' : 'not-allowed'
            }}
          >
            Save .res
          </button>
          <div style={{ borderLeft: '1px solid #C0C0C0', height: '20px', margin: '0 4px' }} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ResourceFilter)}
            style={{
              fontSize: '8pt',
              border: '1px inset #C0C0C0',
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="all">All Resources</option>
            <option value="strings">String Resources</option>
            <option value="icons">Icons</option>
            <option value="cursors">Cursors</option>
            <option value="menus">Menus</option>
            <option value="dialogs">Dialogs</option>
            <option value="version">Version Info</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Resource List */}
          <div style={{
            width: '300px',
            borderRight: '1px solid #C0C0C0',
            backgroundColor: '#FFFFFF',
            overflow: 'auto'
          }}>
            <div style={{
              backgroundColor: '#C0C0C0',
              padding: '2px 4px',
              borderBottom: '1px solid #808080',
              fontSize: '8pt',
              fontWeight: 'bold'
            }}>
              Resources ({filteredResources.length})
            </div>
            
            {filteredResources.map((resource) => (
              <div
                key={`${resource.type}_${resource.id}_${resource.languageId}`}
                style={{
                  padding: '2px 4px',
                  borderBottom: '1px solid #E0E0E0',
                  backgroundColor: selectedResource === resource ? '#E0E0FF' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => setSelectedResource(resource)}
              >
                <span style={{ fontSize: '12px' }}>{getResourceIcon(resource.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '8pt', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {resource.name}
                  </div>
                  <div style={{ fontSize: '8pt', color: '#666666' }}>
                    {getResourceTypeName(resource.type)} #{resource.id} ({formatFileSize(resource.size)})
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resource Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {filter === 'strings' ? renderStringEditor() :
             filter === 'icons' || filter === 'cursors' ? renderIconEditor() :
             filter === 'version' ? renderVersionEditor() :
             (
               <div style={{
                 padding: '20px',
                 textAlign: 'center',
                 color: '#666666'
               }}>
                 <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                 <div>Select a resource type to begin editing</div>
                 <div style={{ fontSize: '8pt', marginTop: '8px' }}>
                   Total: {resources.length} resources, {formatFileSize(resources.reduce((sum, r) => sum + r.size, 0))}
                 </div>
               </div>
             )
            }
          </div>
        </div>

        {/* Status Bar */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderTop: '1px solid #C0C0C0',
          fontSize: '8pt',
          color: '#000080',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            {selectedResource ? 
              `Selected: ${selectedResource.name} (${getResourceTypeName(selectedResource.type)})` : 
              'Ready'
            }
          </div>
          <div>
            {isDirty ? 'Modified' : 'Saved'}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".res"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </div>
  );
};

export default VB6ResourceEditor;