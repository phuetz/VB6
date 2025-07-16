import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Search, Book, Package, FileText } from 'lucide-react';

interface LibraryItem {
  id: string;
  name: string;
  type: 'library' | 'class' | 'module' | 'method' | 'property' | 'constant' | 'enum';
  description: string;
  syntax?: string;
  children?: LibraryItem[];
  expanded?: boolean;
}

const VB6_LIBRARIES: LibraryItem[] = [
  {
    id: 'vb',
    name: 'Visual Basic for Applications',
    type: 'library',
    description: 'Core VB6 runtime library',
    expanded: true,
    children: [
      {
        id: 'vb-globals',
        name: 'Globals',
        type: 'module',
        description: 'Global functions and constants',
        children: [
          {
            id: 'msgbox',
            name: 'MsgBox',
            type: 'method',
            description: 'Displays a message box',
            syntax: 'MsgBox(Prompt [, Buttons] [, Title])',
          },
          {
            id: 'inputbox',
            name: 'InputBox',
            type: 'method',
            description: 'Displays an input dialog box',
            syntax: 'InputBox(Prompt [, Title] [, Default])',
          },
          {
            id: 'len',
            name: 'Len',
            type: 'method',
            description: 'Returns the length of a string',
            syntax: 'Len(String)',
          },
          {
            id: 'left',
            name: 'Left',
            type: 'method',
            description: 'Returns leftmost characters from a string',
            syntax: 'Left(String, Length)',
          },
          {
            id: 'right',
            name: 'Right',
            type: 'method',
            description: 'Returns rightmost characters from a string',
            syntax: 'Right(String, Length)',
          },
          {
            id: 'mid',
            name: 'Mid',
            type: 'method',
            description: 'Returns a substring',
            syntax: 'Mid(String, Start [, Length])',
          },
        ],
      },
      {
        id: 'vb-constants',
        name: 'Constants',
        type: 'module',
        description: 'VB6 predefined constants',
        children: [
          {
            id: 'vbok',
            name: 'vbOK',
            type: 'constant',
            description: 'OK button return value (1)',
            syntax: 'vbOK = 1',
          },
          {
            id: 'vbcancel',
            name: 'vbCancel',
            type: 'constant',
            description: 'Cancel button return value (2)',
            syntax: 'vbCancel = 2',
          },
          {
            id: 'vbcrlf',
            name: 'vbCrLf',
            type: 'constant',
            description: 'Carriage return and line feed',
            syntax: 'vbCrLf = Chr(13) + Chr(10)',
          },
        ],
      },
    ],
  },
  {
    id: 'msforms',
    name: 'Microsoft Forms 2.0 Object Library',
    type: 'library',
    description: 'User interface controls',
    children: [
      {
        id: 'control',
        name: 'Control',
        type: 'class',
        description: 'Base control class',
        children: [
          {
            id: 'control-name',
            name: 'Name',
            type: 'property',
            description: 'Returns or sets the name of the control',
            syntax: 'String Name',
          },
          {
            id: 'control-visible',
            name: 'Visible',
            type: 'property',
            description: 'Returns or sets whether the control is visible',
            syntax: 'Boolean Visible',
          },
        ],
      },
      {
        id: 'textbox',
        name: 'TextBox',
        type: 'class',
        description: 'Text input control',
        children: [
          {
            id: 'textbox-text',
            name: 'Text',
            type: 'property',
            description: 'Returns or sets the text in the control',
            syntax: 'String Text',
          },
          {
            id: 'textbox-maxlength',
            name: 'MaxLength',
            type: 'property',
            description: 'Maximum number of characters allowed',
            syntax: 'Integer MaxLength',
          },
        ],
      },
    ],
  },
  {
    id: 'scripting',
    name: 'Microsoft Scripting Runtime',
    type: 'library',
    description: 'File system and dictionary objects',
    children: [
      {
        id: 'filesystemobject',
        name: 'FileSystemObject',
        type: 'class',
        description: 'Provides access to file system',
        children: [
          {
            id: 'fso-fileexists',
            name: 'FileExists',
            type: 'method',
            description: 'Returns True if a file exists',
            syntax: 'FileExists(FileSpec)',
          },
          {
            id: 'fso-createtextfile',
            name: 'CreateTextFile',
            type: 'method',
            description: 'Creates a text file',
            syntax: 'CreateTextFile(FileName [, Overwrite] [, Unicode])',
          },
        ],
      },
    ],
  },
];

interface ObjectBrowserProps {
  visible: boolean;
  onClose: () => void;
}

export const ObjectBrowser: React.FC<ObjectBrowserProps> = ({ visible, onClose }) => {
  const [libraries, setLibraries] = useState<LibraryItem[]>(VB6_LIBRARIES);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllLibraries, setShowAllLibraries] = useState(false);

  const toggleExpanded = useCallback(
    (id: string) => {
      const updateItems = (items: LibraryItem[]): LibraryItem[] => {
        return items.map(item => {
          if (item.id === id) {
            return { ...item, expanded: !item.expanded };
          }
          if (item.children) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };

      setLibraries(updateItems(libraries));
    },
    [libraries]
  );

  const renderTreeItem = useCallback(
    (item: LibraryItem, level: number = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = item.expanded;
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch && level > 0) return null;

      const getIcon = (type: string) => {
        switch (type) {
          case 'library':
            return <Book size={14} className="text-blue-600" />;
          case 'class':
            return <Package size={14} className="text-green-600" />;
          case 'module':
            return <FileText size={14} className="text-orange-600" />;
          case 'method':
            return <span className="text-purple-600 font-bold text-xs">M</span>;
          case 'property':
            return <span className="text-blue-600 font-bold text-xs">P</span>;
          case 'constant':
            return <span className="text-red-600 font-bold text-xs">C</span>;
          case 'enum':
            return <span className="text-green-600 font-bold text-xs">E</span>;
          default:
            return null;
        }
      };

      return (
        <div key={item.id}>
          <div
            className={`flex items-center gap-1 py-1 px-2 cursor-pointer text-xs hover:bg-gray-100 ${
              selectedItem?.id === item.id ? 'bg-blue-200' : ''
            }`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => setSelectedItem(item)}
          >
            {hasChildren ? (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded(item.id);
                }}
                className="w-4 h-4 flex items-center justify-center"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <div className="w-4" />
            )}

            <span className="w-4 h-4 flex items-center justify-center">{getIcon(item.type)}</span>

            <span className="flex-1 font-mono">{item.name}</span>
          </div>

          {hasChildren &&
            isExpanded &&
            item.children?.map(child => renderTreeItem(child, level + 1))}
        </div>
      );
    },
    [selectedItem, searchTerm, toggleExpanded]
  );

  const filteredLibraries = showAllLibraries ? libraries : libraries.slice(0, 2);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '900px', height: '700px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Object Browser</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 h-full flex flex-col">
          {/* Search and filters */}
          <div className="mb-4 flex gap-2 items-center">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search for classes, methods, properties..."
                className="w-full pl-8 pr-2 py-1 border border-gray-400 text-sm"
              />
            </div>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={showAllLibraries}
                onChange={e => setShowAllLibraries(e.target.checked)}
                className="mr-1"
              />
              Show all libraries
            </label>
          </div>

          {/* Main content */}
          <div className="flex-1 flex gap-4">
            {/* Library tree */}
            <div className="w-1/2 bg-white border border-gray-400 overflow-auto">
              <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold">
                Libraries
              </div>
              <div className="p-1">{filteredLibraries.map(library => renderTreeItem(library))}</div>
            </div>

            {/* Details panel */}
            <div className="w-1/2 bg-white border border-gray-400 flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs font-bold">
                Details
              </div>

              {selectedItem ? (
                <div className="flex-1 p-3 overflow-auto">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {selectedItem.type === 'library' ? (
                          <Book size={20} className="text-blue-600" />
                        ) : selectedItem.type === 'class' ? (
                          <Package size={20} className="text-green-600" />
                        ) : selectedItem.type === 'module' ? (
                          <FileText size={20} className="text-orange-600" />
                        ) : (
                          <span className="w-5 h-5 bg-gray-300 rounded text-xs flex items-center justify-center">
                            {selectedItem.type.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div>
                        <div className="font-mono font-bold">{selectedItem.name}</div>
                        <div className="text-xs text-gray-600 capitalize">{selectedItem.type}</div>
                      </div>
                    </div>

                    <div className="text-sm mb-3">{selectedItem.description}</div>

                    {selectedItem.syntax && (
                      <div>
                        <div className="text-xs font-bold mb-1">Syntax:</div>
                        <div className="bg-gray-100 p-2 font-mono text-xs border border-gray-300 rounded">
                          {selectedItem.syntax}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedItem.children && selectedItem.children.length > 0 && (
                    <div>
                      <div className="text-xs font-bold mb-2">Members:</div>
                      <div className="space-y-1">
                        {selectedItem.children.map(child => (
                          <div
                            key={child.id}
                            className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => setSelectedItem(child)}
                          >
                            <span className="w-4 h-4 flex items-center justify-center">
                              {child.type === 'method' ? (
                                <span className="text-purple-600 font-bold">M</span>
                              ) : child.type === 'property' ? (
                                <span className="text-blue-600 font-bold">P</span>
                              ) : child.type === 'constant' ? (
                                <span className="text-red-600 font-bold">C</span>
                              ) : (
                                <span className="text-gray-600">•</span>
                              )}
                            </span>
                            <span className="font-mono">{child.name}</span>
                            <span className="text-gray-500 flex-1">{child.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Book size={48} className="mx-auto mb-2 opacity-50" />
                    <div>Select an item to view details</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-4 pt-2 border-t border-gray-300 text-xs text-gray-600">
            {selectedItem ? (
              <span>
                Selected: {selectedItem.name} ({selectedItem.type})
              </span>
            ) : (
              <span>Ready - {filteredLibraries.length} libraries loaded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
