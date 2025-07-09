import React, { useState, useCallback } from 'react';
import { Resource } from '../../types/extended';
import { Image, Music, File, Trash2, Plus, Eye, Download } from 'lucide-react';

interface ResourceManagerProps {
  visible: boolean;
  onClose: () => void;
  resources: Resource[];
  onAddResource: (resource: Resource) => void;
  onRemoveResource: (id: string) => void;
  onUpdateResource: (id: string, resource: Partial<Resource>) => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({
  visible,
  onClose,
  resources,
  onAddResource,
  onRemoveResource,
  onUpdateResource
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'icon' | 'cursor' | 'sound' | 'binary'>('all');
  const [previewVisible, setPreviewVisible] = useState(false);

  const filteredResources = resources.filter(resource => 
    filter === 'all' || resource.type === filter
  );

  const handleAddResource = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,audio/*,*/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      
      for (const file of files) {
        try {
          const resource: Resource = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: getResourceType(file.type),
            data: await fileToDataURL(file),
            size: file.size,
            format: file.type
          };
          
          onAddResource(resource);
        } catch (error) {
          console.error('Error adding resource:', error);
        }
      }
    };
    
    input.click();
  }, [onAddResource]);

  const getResourceType = (mimeType: string): Resource['type'] => {
    if (mimeType.startsWith('image/')) {
      if (mimeType.includes('icon')) return 'icon';
      if (mimeType.includes('cursor')) return 'cursor';
      return 'image';
    }
    if (mimeType.startsWith('audio/')) return 'sound';
    return 'binary';
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getResourceIcon = (resource: Resource) => {
    switch (resource.type) {
      case 'image':
      case 'icon':
      case 'cursor':
        return <Image size={16} className="text-blue-500" />;
      case 'sound':
        return <Music size={16} className="text-green-500" />;
      default:
        return <File size={16} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePreview = (resource: Resource) => {
    setSelectedResource(resource);
    setPreviewVisible(true);
  };

  const handleExport = (resource: Resource) => {
    const link = document.createElement('a');
    link.href = resource.data as string;
    link.download = resource.name;
    link.click();
  };

  const renderPreview = () => {
    if (!selectedResource) return null;

    switch (selectedResource.type) {
      case 'image':
      case 'icon':
      case 'cursor':
        return (
          <img 
            src={selectedResource.data as string} 
            alt={selectedResource.name}
            className="max-w-full max-h-64 object-contain"
          />
        );
      case 'sound':
        return (
          <audio controls className="w-full">
            <source src={selectedResource.data as string} type={selectedResource.format} />
            Your browser does not support the audio element.
          </audio>
        );
      default:
        return (
          <div className="text-center text-gray-500 p-8">
            <File size={48} className="mx-auto mb-2" />
            <div>Binary file - no preview available</div>
          </div>
        );
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '800px', height: '600px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Resource Manager</span>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 px-2"
          >
            ×
          </button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={handleAddResource}
              className="px-3 py-1 bg-green-500 text-white border border-green-600 text-xs hover:bg-green-600 flex items-center gap-1"
            >
              <Plus size={12} />
              Add Resource
            </button>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-2 py-1 border border-gray-400 text-xs"
            >
              <option value="all">All Resources</option>
              <option value="image">Images</option>
              <option value="icon">Icons</option>
              <option value="cursor">Cursors</option>
              <option value="sound">Sounds</option>
              <option value="binary">Binary Files</option>
            </select>

            <div className="ml-auto text-xs text-gray-600">
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex gap-4">
            {/* Resource list */}
            <div className="flex-1 bg-white border border-gray-400 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Format</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource) => (
                    <tr
                      key={resource.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                        selectedResource?.id === resource.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedResource(resource)}
                    >
                      <td className="p-2 flex items-center gap-2">
                        {getResourceIcon(resource)}
                        <span className="truncate">{resource.name}</span>
                      </td>
                      <td className="p-2 capitalize">{resource.type}</td>
                      <td className="p-2">{formatFileSize(resource.size)}</td>
                      <td className="p-2">{resource.format}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(resource);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Preview"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(resource);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Export"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveResource(resource.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preview panel */}
            <div className="w-64 bg-white border border-gray-400 flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold">
                Preview
              </div>
              <div className="flex-1 p-2 overflow-auto">
                {selectedResource ? (
                  <div>
                    <div className="mb-2">
                      <div className="font-bold text-xs mb-1">Name:</div>
                      <div className="text-xs break-all">{selectedResource.name}</div>
                    </div>
                    <div className="mb-2">
                      <div className="font-bold text-xs mb-1">Type:</div>
                      <div className="text-xs capitalize">{selectedResource.type}</div>
                    </div>
                    <div className="mb-2">
                      <div className="font-bold text-xs mb-1">Size:</div>
                      <div className="text-xs">{formatFileSize(selectedResource.size)}</div>
                    </div>
                    <div className="mb-4">
                      <div className="font-bold text-xs mb-1">Format:</div>
                      <div className="text-xs">{selectedResource.format}</div>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      {renderPreview()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <File size={32} className="mx-auto mb-2" />
                    <div className="text-xs">Select a resource to preview</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-4 pt-2 border-t border-gray-300 text-xs text-gray-600">
            {selectedResource ? (
              <span>Selected: {selectedResource.name} ({formatFileSize(selectedResource.size)})</span>
            ) : (
              <span>Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewVisible && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white border border-gray-400 max-w-4xl max-h-4xl overflow-auto">
            <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center justify-between">
              <span className="text-sm font-bold">{selectedResource.name}</span>
              <button
                onClick={() => setPreviewVisible(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};