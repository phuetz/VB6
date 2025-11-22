import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// API Categories
export enum APICategory {
  WindowsAPI = 'Windows API',
  COM = 'COM Objects',
  TypeLibrary = 'Type Libraries',
  Constants = 'Constants',
  Structures = 'Structures',
  Callbacks = 'Callbacks'
}

// Parameter Types
export enum ParameterType {
  String = 'String',
  Long = 'Long',
  Integer = 'Integer',
  Boolean = 'Boolean',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  Date = 'Date',
  Variant = 'Variant',
  Object = 'Object',
  Any = 'Any',
  Byte = 'Byte',
  LongPtr = 'LongPtr',
  Handle = 'Handle',
  Pointer = 'Pointer'
}

// API Parameter
export interface APIParameter {
  name: string;
  type: ParameterType | string;
  isOptional: boolean;
  isArray: boolean;
  isByRef: boolean;
  defaultValue?: string;
  description?: string;
}

// API Function
export interface APIFunction {
  id: string;
  name: string;
  library: string;
  category: APICategory;
  description: string;
  parameters: APIParameter[];
  returnType: ParameterType | string;
  alias?: string;
  charset?: 'Ansi' | 'Unicode' | 'Auto';
  callingConvention?: 'StdCall' | 'CDecl';
  ordinal?: number;
  deprecated: boolean;
  minimumOS?: string;
  example?: string;
  remarks?: string;
  seeAlso?: string[];
}

// API Constant
export interface APIConstant {
  id: string;
  name: string;
  value: string | number;
  type: ParameterType;
  category: string;
  description: string;
  library: string;
}

// API Structure
export interface APIStructure {
  id: string;
  name: string;
  category: string;
  description: string;
  library: string;
  size: number;
  alignment: number;
  fields: Array<{
    name: string;
    type: ParameterType | string;
    offset: number;
    size: number;
    description?: string;
  }>;
}

// Type Library
export interface TypeLibrary {
  id: string;
  name: string;
  version: string;
  guid: string;
  description: string;
  filename: string;
  interfaces: Array<{
    name: string;
    guid: string;
    methods: APIFunction[];
    properties: Array<{
      name: string;
      type: ParameterType | string;
      readonly: boolean;
    }>;
  }>;
  enums: Array<{
    name: string;
    values: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

interface APIViewerProps {
  onDeclarationCopy?: (declaration: string) => void;
  onCodeGenerate?: (code: string, language: 'VB6' | 'C++') => void;
}

export const APIViewer: React.FC<APIViewerProps> = ({
  onDeclarationCopy,
  onCodeGenerate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<APICategory>(APICategory.WindowsAPI);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<APIFunction | APIConstant | APIStructure | null>(null);
  const [filteredItems, setFilteredItems] = useState<(APIFunction | APIConstant | APIStructure)[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<string>('All');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentItems, setRecentItems] = useState<string[]>([]);
  
  const eventEmitter = useRef(new EventEmitter());

  // Sample API data (in a real implementation, this would come from external sources)
  const sampleAPIs: APIFunction[] = [
    {
      id: 'user32_MessageBox',
      name: 'MessageBox',
      library: 'user32.dll',
      category: APICategory.WindowsAPI,
      description: 'Displays a modal dialog box that contains a system icon, a set of buttons, and a brief application-specific message.',
      parameters: [
        { name: 'hWnd', type: 'LongPtr', isOptional: false, isArray: false, isByRef: false, description: 'Handle to the owner window' },
        { name: 'lpText', type: 'String', isOptional: false, isArray: false, isByRef: false, description: 'Text to display' },
        { name: 'lpCaption', type: 'String', isOptional: true, isArray: false, isByRef: false, description: 'Dialog box title' },
        { name: 'uType', type: 'Long', isOptional: true, isArray: false, isByRef: false, defaultValue: '0', description: 'Message box type' }
      ],
      returnType: 'Long',
      charset: 'Auto',
      callingConvention: 'StdCall',
      deprecated: false,
      minimumOS: 'Windows 95',
      example: 'Dim result As Long\nresult = MessageBox(0, "Hello World", "Test", 0)',
      remarks: 'The message box is displayed in the foreground and blocks user interaction with other windows.',
      seeAlso: ['MessageBoxEx', 'MessageBoxIndirect']
    },
    {
      id: 'kernel32_GetCurrentProcessId',
      name: 'GetCurrentProcessId',
      library: 'kernel32.dll',
      category: APICategory.WindowsAPI,
      description: 'Retrieves the process identifier of the calling process.',
      parameters: [],
      returnType: 'Long',
      callingConvention: 'StdCall',
      deprecated: false,
      minimumOS: 'Windows NT 3.1',
      example: 'Dim processId As Long\nprocessId = GetCurrentProcessId()',
      remarks: 'The process identifier is unique system-wide until the process terminates.'
    },
    {
      id: 'gdi32_CreateSolidBrush',
      name: 'CreateSolidBrush',
      library: 'gdi32.dll',
      category: APICategory.WindowsAPI,
      description: 'Creates a logical brush that has the specified solid color.',
      parameters: [
        { name: 'crColor', type: 'Long', isOptional: false, isArray: false, isByRef: false, description: 'RGB color value' }
      ],
      returnType: 'LongPtr',
      callingConvention: 'StdCall',
      deprecated: false,
      minimumOS: 'Windows 95',
      example: 'Dim hBrush As LongPtr\nhBrush = CreateSolidBrush(RGB(255, 0, 0))',
      remarks: 'Remember to call DeleteObject to free the brush when no longer needed.'
    }
  ];

  const sampleConstants: APIConstant[] = [
    {
      id: 'MB_OK',
      name: 'MB_OK',
      value: 0,
      type: ParameterType.Long,
      category: 'MessageBox',
      description: 'The message box contains one push button: OK.',
      library: 'user32.dll'
    },
    {
      id: 'MB_YESNO',
      name: 'MB_YESNO',
      value: 4,
      type: ParameterType.Long,
      category: 'MessageBox',
      description: 'The message box contains two push buttons: Yes and No.',
      library: 'user32.dll'
    },
    {
      id: 'GENERIC_READ',
      name: 'GENERIC_READ',
      value: '0x80000000',
      type: ParameterType.Long,
      category: 'File Access',
      description: 'Generic read access to an object.',
      library: 'kernel32.dll'
    }
  ];

  const sampleStructures: APIStructure[] = [
    {
      id: 'POINT',
      name: 'POINT',
      category: 'Graphics',
      description: 'Defines the x- and y-coordinates of a point.',
      library: 'gdi32.dll',
      size: 8,
      alignment: 4,
      fields: [
        { name: 'x', type: 'Long', offset: 0, size: 4, description: 'Horizontal coordinate' },
        { name: 'y', type: 'Long', offset: 4, size: 4, description: 'Vertical coordinate' }
      ]
    },
    {
      id: 'RECT',
      name: 'RECT',
      category: 'Graphics',
      description: 'Defines the coordinates of the upper-left and lower-right corners of a rectangle.',
      library: 'gdi32.dll',
      size: 16,
      alignment: 4,
      fields: [
        { name: 'left', type: 'Long', offset: 0, size: 4, description: 'Left edge' },
        { name: 'top', type: 'Long', offset: 4, size: 4, description: 'Top edge' },
        { name: 'right', type: 'Long', offset: 8, size: 4, description: 'Right edge' },
        { name: 'bottom', type: 'Long', offset: 12, size: 4, description: 'Bottom edge' }
      ]
    }
  ];

  // Get all items based on category
  const getAllItems = useCallback(() => {
    switch (selectedCategory) {
      case APICategory.WindowsAPI:
        return sampleAPIs;
      case APICategory.Constants:
        return sampleConstants;
      case APICategory.Structures:
        return sampleStructures;
      default:
        return [];
    }
  }, [selectedCategory]);

  // Filter items based on search and library
  useEffect(() => {
    let items = getAllItems();
    
    // Apply search filter
    if (searchFilter) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        ('library' in item && item.library.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    }
    
    // Apply library filter
    if (libraryFilter !== 'All') {
      items = items.filter(item => 
        'library' in item && item.library === libraryFilter
      );
    }
    
    setFilteredItems(items);
  }, [selectedCategory, searchFilter, libraryFilter, getAllItems]);

  // Get unique libraries
  const getLibraries = useCallback(() => {
    const items = getAllItems();
    const libraries = new Set<string>();
    items.forEach(item => {
      if ('library' in item) {
        libraries.add(item.library);
      }
    });
    return Array.from(libraries).sort();
  }, [getAllItems]);

  // Generate VB6 declaration
  const generateVB6Declaration = useCallback((item: APIFunction | APIConstant | APIStructure): string => {
    if ('parameters' in item) {
      // API Function
      const params = item.parameters.map(p => {
        let paramStr = '';
        if (p.isOptional) paramStr += 'Optional ';
        if (p.isByRef) paramStr += 'ByRef ';
        else paramStr += 'ByVal ';
        paramStr += `${p.name} As ${p.type}`;
        if (p.defaultValue) paramStr += ` = ${p.defaultValue}`;
        return paramStr;
      }).join(', ');
      
      const returnPart = item.returnType !== 'void' ? ` As ${item.returnType}` : '';
      const aliasPart = item.alias ? ` Alias "${item.alias}"` : '';
      const libPart = ` Lib "${item.library}"`;
      
      return `Declare Function ${item.name}${libPart}${aliasPart} (${params})${returnPart}`;
    } else if ('value' in item) {
      // Constant
      const value = typeof item.value === 'string' ? `"${item.value}"` : item.value.toString();
      return `Public Const ${item.name} As ${item.type} = ${value}`;
    } else if ('fields' in item) {
      // Structure
      let declaration = `Public Type ${item.name}\n`;
      item.fields.forEach(field => {
        declaration += `    ${field.name} As ${field.type}\n`;
      });
      declaration += 'End Type';
      return declaration;
    }
    
    return '';
  }, []);

  // Generate C++ declaration
  const generateCppDeclaration = useCallback((item: APIFunction | APIConstant | APIStructure): string => {
    if ('parameters' in item) {
      // API Function
      const params = item.parameters.map(p => {
        const typeMap: Record<string, string> = {
          'String': 'LPCTSTR',
          'Long': 'LONG',
          'LongPtr': 'LONG_PTR',
          'Integer': 'INT',
          'Boolean': 'BOOL',
          'Handle': 'HANDLE',
          'Pointer': 'LPVOID'
        };
        
        const cppType = typeMap[p.type] || p.type;
        return `${cppType} ${p.name}`;
      }).join(', ');
      
      const returnTypeMap: Record<string, string> = {
        'String': 'LPCTSTR',
        'Long': 'LONG',
        'LongPtr': 'LONG_PTR',
        'Integer': 'INT',
        'Boolean': 'BOOL',
        'Handle': 'HANDLE',
        'Pointer': 'LPVOID',
        'void': 'void'
      };
      
      const cppReturnType = returnTypeMap[item.returnType] || item.returnType;
      
      return `${cppReturnType} WINAPI ${item.name}(${params});`;
    } else if ('value' in item) {
      // Constant
      const value = typeof item.value === 'string' ? `"${item.value}"` : item.value.toString();
      return `#define ${item.name} ${value}`;
    } else if ('fields' in item) {
      // Structure
      let declaration = `typedef struct _${item.name} {\n`;
      item.fields.forEach(field => {
        const typeMap: Record<string, string> = {
          'String': 'LPCTSTR',
          'Long': 'LONG',
          'Integer': 'INT',
          'Boolean': 'BOOL'
        };
        const cppType = typeMap[field.type] || field.type;
        declaration += `    ${cppType} ${field.name};\n`;
      });
      declaration += `} ${item.name.toUpperCase()}, *P${item.name.toUpperCase()};`;
      return declaration;
    }
    
    return '';
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      onDeclarationCopy?.(text);
    });
  }, [onDeclarationCopy]);

  // Add to favorites
  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Add to recent items
  const addToRecent = useCallback((itemId: string) => {
    setRecentItems(prev => {
      const newRecent = [itemId, ...prev.filter(id => id !== itemId)];
      return newRecent.slice(0, 10); // Keep only 10 recent items
    });
  }, []);

  // Select item
  const selectItem = useCallback((item: APIFunction | APIConstant | APIStructure) => {
    setSelectedItem(item);
    addToRecent(item.id);
  }, [addToRecent]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">API Viewer</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search APIs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded w-64"
              />
              <select
                value={libraryFilter}
                onChange={(e) => setLibraryFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="All">All Libraries</option>
                {getLibraries().map(lib => (
                  <option key={lib} value={lib}>{lib}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
              Advanced View
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <div className="w-48 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Categories</h3>
          </div>
          <div className="overflow-y-auto">
            {Object.values(APICategory).map(category => (
              <div
                key={category}
                className={`p-3 cursor-pointer hover:bg-gray-100 ${
                  selectedCategory === category ? 'bg-blue-100 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <div className="text-sm font-medium">{category}</div>
                <div className="text-xs text-gray-500">
                  {category === APICategory.WindowsAPI && `${sampleAPIs.length} functions`}
                  {category === APICategory.Constants && `${sampleConstants.length} constants`}
                  {category === APICategory.Structures && `${sampleStructures.length} structures`}
                  {![APICategory.WindowsAPI, APICategory.Constants, APICategory.Structures].includes(category) && 'Coming soon'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="w-80 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">
              {selectedCategory} ({filteredItems.length})
            </h3>
          </div>
          <div className="overflow-y-auto">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 ${
                  selectedItem?.id === item.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => selectItem(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="flex items-center gap-1">
                    {recentItems.includes(item.id) && (
                      <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Recent</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className={`text-sm ${favorites.has(item.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                      ★
                    </button>
                  </div>
                </div>
                {'library' in item && (
                  <div className="text-xs text-gray-500 mt-1">{item.library}</div>
                )}
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No items found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="flex-1 overflow-hidden">
          {selectedItem ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedItem.name}</h2>
                  {'library' in selectedItem && (
                    <p className="text-sm text-gray-600 mt-1">Library: {selectedItem.library}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generateVB6Declaration(selectedItem))}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Copy VB6
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateCppDeclaration(selectedItem))}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Copy C++
                  </button>
                  <button
                    onClick={() => onCodeGenerate?.(generateVB6Declaration(selectedItem), 'VB6')}
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>

              {/* VB6 Declaration */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">VB6 Declaration</h3>
                <div className="bg-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{generateVB6Declaration(selectedItem)}</pre>
                </div>
              </div>

              {/* Parameters (for functions) */}
              {'parameters' in selectedItem && selectedItem.parameters.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Parameters</h3>
                  <div className="border border-gray-300 rounded">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 font-medium text-sm">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">Name</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Flags</div>
                        <div className="col-span-5">Description</div>
                      </div>
                    </div>
                    {selectedItem.parameters.map((param, index) => (
                      <div key={index} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
                        <div className="grid grid-cols-12 gap-2 text-sm">
                          <div className="col-span-3 font-mono">{param.name}</div>
                          <div className="col-span-2 font-mono text-blue-600">{param.type}</div>
                          <div className="col-span-2">
                            <div className="flex flex-wrap gap-1">
                              {param.isOptional && <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">Optional</span>}
                              {param.isArray && <span className="bg-green-100 text-green-800 px-1 rounded text-xs">Array</span>}
                              {param.isByRef && <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">ByRef</span>}
                            </div>
                          </div>
                          <div className="col-span-5 text-gray-600">{param.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields (for structures) */}
              {'fields' in selectedItem && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Fields</h3>
                  <div className="border border-gray-300 rounded">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 font-medium text-sm">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">Name</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Offset</div>
                        <div className="col-span-5">Description</div>
                      </div>
                    </div>
                    {selectedItem.fields.map((field, index) => (
                      <div key={index} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
                        <div className="grid grid-cols-12 gap-2 text-sm">
                          <div className="col-span-3 font-mono">{field.name}</div>
                          <div className="col-span-2 font-mono text-blue-600">{field.type}</div>
                          <div className="col-span-2 text-gray-600">{field.offset}</div>
                          <div className="col-span-5 text-gray-600">{field.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Return Value (for functions) */}
              {'returnType' in selectedItem && selectedItem.returnType !== 'void' && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Return Value</h3>
                  <p className="text-gray-700">
                    Returns a value of type <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{selectedItem.returnType}</code>
                  </p>
                </div>
              )}

              {/* Example (for functions) */}
              {'example' in selectedItem && selectedItem.example && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Example</h3>
                  <div className="bg-gray-100 p-4 rounded">
                    <pre className="text-sm font-mono">{selectedItem.example}</pre>
                  </div>
                </div>
              )}

              {/* Advanced Information */}
              {showAdvanced && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Advanced Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {'callingConvention' in selectedItem && selectedItem.callingConvention && (
                      <div>
                        <strong>Calling Convention:</strong> {selectedItem.callingConvention}
                      </div>
                    )}
                    {'charset' in selectedItem && selectedItem.charset && (
                      <div>
                        <strong>Character Set:</strong> {selectedItem.charset}
                      </div>
                    )}
                    {'minimumOS' in selectedItem && selectedItem.minimumOS && (
                      <div>
                        <strong>Minimum OS:</strong> {selectedItem.minimumOS}
                      </div>
                    )}
                    {'deprecated' in selectedItem && (
                      <div>
                        <strong>Status:</strong> {selectedItem.deprecated ? 'Deprecated' : 'Active'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {'remarks' in selectedItem && selectedItem.remarks && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Remarks</h3>
                  <p className="text-gray-700">{selectedItem.remarks}</p>
                </div>
              )}

              {/* See Also */}
              {'seeAlso' in selectedItem && selectedItem.seeAlso && selectedItem.seeAlso.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">See Also</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.seeAlso.map((related, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {related}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg">Select an API item</p>
                <p className="text-sm mt-2">Choose an item from the list to view its details and documentation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIViewer;