import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// API Categories
export enum APICategory {
  Functions = 'Functions',
  Constants = 'Constants',
  Types = 'Types'
}

export enum APILibrary {
  Kernel32 = 'kernel32.dll',
  User32 = 'user32.dll',
  GDI32 = 'gdi32.dll',
  Shell32 = 'shell32.dll',
  Ole32 = 'ole32.dll',
  Advapi32 = 'advapi32.dll',
  Comctl32 = 'comctl32.dll',
  Comdlg32 = 'comdlg32.dll',
  Wininet = 'wininet.dll',
  Winsock = 'ws2_32.dll'
}

// API Function Definition
export interface APIFunction {
  name: string;
  library: APILibrary;
  description: string;
  declaration: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }>;
  returnType: string;
  returnDescription: string;
  example?: string;
  category: string;
  unicode?: boolean;
  deprecated?: boolean;
}

// API Constant Definition
export interface APIConstant {
  name: string;
  value: string;
  description: string;
  category: string;
  type: string;
  library?: APILibrary;
}

// API Type Definition
export interface APIType {
  name: string;
  description: string;
  definition: string;
  category: string;
  members?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  library?: APILibrary;
}

// Search Filters
export interface SearchFilters {
  category: APICategory;
  library: APILibrary | 'All';
  searchTerm: string;
  showDeprecated: boolean;
  showUnicodeOnly: boolean;
}

interface APIViewerToolProps {
  onInsertCode?: (code: string) => void;
  onClose?: () => void;
}

export const APIViewerTool: React.FC<APIViewerToolProps> = ({
  onInsertCode,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<APICategory>(APICategory.Functions);
  const [selectedLibrary, setSelectedLibrary] = useState<APILibrary | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<APIFunction | APIConstant | APIType | null>(null);
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [showUnicodeOnly, setShowUnicodeOnly] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  const eventEmitter = useRef(new EventEmitter());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Sample API Functions
  const apiFunctions: APIFunction[] = [
    {
      name: 'MessageBox',
      library: APILibrary.User32,
      description: 'Displays a modal dialog box that contains a system icon, text, and buttons.',
      declaration: 'Public Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hWnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long',
      parameters: [
        { name: 'hWnd', type: 'Long', description: 'Handle to the owner window' },
        { name: 'lpText', type: 'String', description: 'Message text to display' },
        { name: 'lpCaption', type: 'String', description: 'Dialog box title' },
        { name: 'wType', type: 'Long', description: 'Contents and behavior of the dialog box' }
      ],
      returnType: 'Long',
      returnDescription: 'Value indicating which button the user clicked',
      example: 'Dim result As Long\nresult = MessageBox(0, "Hello World!", "Example", MB_OK)',
      category: 'User Interface',
      unicode: false
    },
    {
      name: 'GetWindowText',
      library: APILibrary.User32,
      description: 'Copies the text of the specified window\'s title bar into a buffer.',
      declaration: 'Public Declare Function GetWindowText Lib "user32" Alias "GetWindowTextA" (ByVal hWnd As Long, ByVal lpString As String, ByVal cch As Long) As Long',
      parameters: [
        { name: 'hWnd', type: 'Long', description: 'Handle to the window' },
        { name: 'lpString', type: 'String', description: 'Buffer to receive the text' },
        { name: 'cch', type: 'Long', description: 'Maximum number of characters to copy' }
      ],
      returnType: 'Long',
      returnDescription: 'Number of characters copied',
      category: 'Window Management'
    },
    {
      name: 'FindWindow',
      library: APILibrary.User32,
      description: 'Retrieves a handle to the top-level window whose class name and window name match the specified strings.',
      declaration: 'Public Declare Function FindWindow Lib "user32" Alias "FindWindowA" (ByVal lpClassName As String, ByVal lpWindowName As String) As Long',
      parameters: [
        { name: 'lpClassName', type: 'String', description: 'Class name or null' },
        { name: 'lpWindowName', type: 'String', description: 'Window name or null' }
      ],
      returnType: 'Long',
      returnDescription: 'Handle to the window, or zero if not found',
      category: 'Window Management'
    },
    {
      name: 'SetWindowPos',
      library: APILibrary.User32,
      description: 'Changes the size, position, and Z order of a child, pop-up, or top-level window.',
      declaration: 'Public Declare Function SetWindowPos Lib "user32" (ByVal hWnd As Long, ByVal hWndInsertAfter As Long, ByVal X As Long, ByVal Y As Long, ByVal cx As Long, ByVal cy As Long, ByVal wFlags As Long) As Long',
      parameters: [
        { name: 'hWnd', type: 'Long', description: 'Handle to the window' },
        { name: 'hWndInsertAfter', type: 'Long', description: 'Placement-order handle' },
        { name: 'X', type: 'Long', description: 'Horizontal position in client coordinates' },
        { name: 'Y', type: 'Long', description: 'Vertical position in client coordinates' },
        { name: 'cx', type: 'Long', description: 'Width of the window' },
        { name: 'cy', type: 'Long', description: 'Height of the window' },
        { name: 'wFlags', type: 'Long', description: 'Window sizing and positioning flags' }
      ],
      returnType: 'Long',
      returnDescription: 'Nonzero if successful',
      category: 'Window Management'
    },
    {
      name: 'GetPrivateProfileString',
      library: APILibrary.Kernel32,
      description: 'Retrieves a string from the specified section in an initialization file.',
      declaration: 'Public Declare Function GetPrivateProfileString Lib "kernel32" Alias "GetPrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As String, ByVal lpDefault As String, ByVal lpReturnedString As String, ByVal nSize As Long, ByVal lpFileName As String) As Long',
      parameters: [
        { name: 'lpApplicationName', type: 'String', description: 'Section name' },
        { name: 'lpKeyName', type: 'String', description: 'Key name' },
        { name: 'lpDefault', type: 'String', description: 'Default value' },
        { name: 'lpReturnedString', type: 'String', description: 'Buffer for returned string' },
        { name: 'nSize', type: 'Long', description: 'Size of the buffer' },
        { name: 'lpFileName', type: 'String', description: 'Initialization file name' }
      ],
      returnType: 'Long',
      returnDescription: 'Number of characters copied',
      category: 'File Operations'
    },
    {
      name: 'WritePrivateProfileString',
      library: APILibrary.Kernel32,
      description: 'Writes a string into the specified section of an initialization file.',
      declaration: 'Public Declare Function WritePrivateProfileString Lib "kernel32" Alias "WritePrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As String, ByVal lpString As String, ByVal lpFileName As String) As Long',
      parameters: [
        { name: 'lpApplicationName', type: 'String', description: 'Section name' },
        { name: 'lpKeyName', type: 'String', description: 'Key name' },
        { name: 'lpString', type: 'String', description: 'String to write' },
        { name: 'lpFileName', type: 'String', description: 'Initialization file name' }
      ],
      returnType: 'Long',
      returnDescription: 'Nonzero if successful',
      category: 'File Operations'
    }
  ];

  // Sample API Constants
  const apiConstants: APIConstant[] = [
    { name: 'MB_OK', value: '&H0', description: 'The message box contains one push button: OK.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_OKCANCEL', value: '&H1', description: 'The message box contains two push buttons: OK and Cancel.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_YESNO', value: '&H4', description: 'The message box contains two push buttons: Yes and No.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_YESNOCANCEL', value: '&H3', description: 'The message box contains three push buttons: Yes, No, and Cancel.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_ICONHAND', value: '&H10', description: 'A hand-shaped icon appears in the message box.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_ICONQUESTION', value: '&H20', description: 'A question-mark icon appears in the message box.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_ICONEXCLAMATION', value: '&H30', description: 'An exclamation-point icon appears in the message box.', category: 'MessageBox', type: 'Long' },
    { name: 'MB_ICONASTERISK', value: '&H40', description: 'An icon consisting of a lowercase letter i in a circle appears in the message box.', category: 'MessageBox', type: 'Long' },
    { name: 'HWND_TOP', value: '0', description: 'Places the window at the top of the Z order.', category: 'Window Position', type: 'Long' },
    { name: 'HWND_BOTTOM', value: '1', description: 'Places the window at the bottom of the Z order.', category: 'Window Position', type: 'Long' },
    { name: 'HWND_TOPMOST', value: '-1', description: 'Places the window above all non-topmost windows.', category: 'Window Position', type: 'Long' },
    { name: 'HWND_NOTOPMOST', value: '-2', description: 'Places the window above all non-topmost windows but below topmost windows.', category: 'Window Position', type: 'Long' },
    { name: 'SWP_NOSIZE', value: '&H1', description: 'Retains the current size.', category: 'Window Position', type: 'Long' },
    { name: 'SWP_NOMOVE', value: '&H2', description: 'Retains the current position.', category: 'Window Position', type: 'Long' },
    { name: 'SWP_SHOWWINDOW', value: '&H40', description: 'Displays the window.', category: 'Window Position', type: 'Long' },
    { name: 'SWP_HIDEWINDOW', value: '&H80', description: 'Hides the window.', category: 'Window Position', type: 'Long' }
  ];

  // Sample API Types
  const apiTypes: APIType[] = [
    {
      name: 'RECT',
      description: 'Defines the coordinates of the upper-left and lower-right corners of a rectangle.',
      definition: 'Public Type RECT\n    Left As Long\n    Top As Long\n    Right As Long\n    Bottom As Long\nEnd Type',
      category: 'Structures',
      members: [
        { name: 'Left', type: 'Long', description: 'x-coordinate of the upper-left corner' },
        { name: 'Top', type: 'Long', description: 'y-coordinate of the upper-left corner' },
        { name: 'Right', type: 'Long', description: 'x-coordinate of the lower-right corner' },
        { name: 'Bottom', type: 'Long', description: 'y-coordinate of the lower-right corner' }
      ]
    },
    {
      name: 'POINT',
      description: 'Defines the x- and y-coordinates of a point.',
      definition: 'Public Type POINT\n    X As Long\n    Y As Long\nEnd Type',
      category: 'Structures',
      members: [
        { name: 'X', type: 'Long', description: 'x-coordinate of the point' },
        { name: 'Y', type: 'Long', description: 'y-coordinate of the point' }
      ]
    },
    {
      name: 'WINDOWPLACEMENT',
      description: 'Contains information about the placement of a window on the screen.',
      definition: 'Public Type WINDOWPLACEMENT\n    Length As Long\n    Flags As Long\n    ShowCmd As Long\n    ptMinPosition As POINT\n    ptMaxPosition As POINT\n    rcNormalPosition As RECT\nEnd Type',
      category: 'Structures',
      members: [
        { name: 'Length', type: 'Long', description: 'Size of the structure' },
        { name: 'Flags', type: 'Long', description: 'Flags that control the position' },
        { name: 'ShowCmd', type: 'Long', description: 'Current show state of the window' },
        { name: 'ptMinPosition', type: 'POINT', description: 'Coordinates of the minimized window' },
        { name: 'ptMaxPosition', type: 'POINT', description: 'Coordinates of the maximized window' },
        { name: 'rcNormalPosition', type: 'RECT', description: 'Coordinates of the window in the restored state' }
      ]
    },
    {
      name: 'WIN32_FIND_DATA',
      description: 'Contains information about a file or directory.',
      definition: 'Public Type WIN32_FIND_DATA\n    dwFileAttributes As Long\n    ftCreationTime As FILETIME\n    ftLastAccessTime As FILETIME\n    ftLastWriteTime As FILETIME\n    nFileSizeHigh As Long\n    nFileSizeLow As Long\n    dwReserved0 As Long\n    dwReserved1 As Long\n    cFileName As String * 260\n    cAlternateFileName As String * 14\nEnd Type',
      category: 'File System',
      members: [
        { name: 'dwFileAttributes', type: 'Long', description: 'File attributes' },
        { name: 'ftCreationTime', type: 'FILETIME', description: 'File creation time' },
        { name: 'ftLastAccessTime', type: 'FILETIME', description: 'Last access time' },
        { name: 'ftLastWriteTime', type: 'FILETIME', description: 'Last write time' },
        { name: 'nFileSizeHigh', type: 'Long', description: 'High-order portion of file size' },
        { name: 'nFileSizeLow', type: 'Long', description: 'Low-order portion of file size' },
        { name: 'cFileName', type: 'String * 260', description: 'Name of the file' },
        { name: 'cAlternateFileName', type: 'String * 14', description: 'Alternative name of the file' }
      ]
    }
  ];

  // Filter data based on search criteria
  const filteredData = useMemo(() => {
    let data: (APIFunction | APIConstant | APIType)[] = [];
    
    switch (selectedCategory) {
      case APICategory.Functions:
        data = apiFunctions;
        break;
      case APICategory.Constants:
        data = apiConstants;
        break;
      case APICategory.Types:
        data = apiTypes;
        break;
    }

    // Filter by library
    if (selectedLibrary !== 'All') {
      data = data.filter(item => 
        'library' in item && item.library === selectedLibrary
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        ('category' in item && item.category.toLowerCase().includes(term))
      );
    }

    // Filter deprecated items
    if (!showDeprecated && selectedCategory === APICategory.Functions) {
      data = (data as APIFunction[]).filter(func => !func.deprecated);
    }

    // Filter Unicode-only items
    if (showUnicodeOnly && selectedCategory === APICategory.Functions) {
      data = (data as APIFunction[]).filter(func => func.unicode);
    }

    return data;
  }, [selectedCategory, selectedLibrary, searchTerm, showDeprecated, showUnicodeOnly]);

  // Generate VB6 code for the selected item
  const generateCode = useCallback((item: APIFunction | APIConstant | APIType) => {
    let code = '';
    
    if ('declaration' in item) {
      // API Function
      code = item.declaration;
    } else if ('value' in item) {
      // API Constant
      code = `Public Const ${item.name} As ${item.type} = ${item.value}`;
    } else if ('definition' in item) {
      // API Type
      code = item.definition;
    }
    
    return code;
  }, []);

  // Copy code to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      copyTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setCopyStatus('idle');
        }
      }, 2000);
      eventEmitter.current.emit('codeCopied', { text });
    } catch (error) {
      setCopyStatus('error');
      copyTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setCopyStatus('idle');
        }
      }, 2000);
      eventEmitter.current.emit('copyError', { error });
    }
  }, []);

  // Insert code into editor
  const insertCode = useCallback((code: string) => {
    onInsertCode?.(code);
    eventEmitter.current.emit('codeInserted', { code });
  }, [onInsertCode]);

  // Handle item selection
  const handleItemSelect = useCallback((item: APIFunction | APIConstant | APIType) => {
    setSelectedItem(item);
    const code = generateCode(item);
    setGeneratedCode(code);
  }, [generateCode]);

  // Get categories for current library
  const getCategories = useCallback((): string[] => {
    const categories = new Set<string>();
    filteredData.forEach(item => {
      if ('category' in item) {
        categories.add(item.category);
      }
    });
    return Array.from(categories).sort();
  }, [filteredData]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">API Viewer</h1>
            <p className="text-sm text-gray-600">Browse Windows API functions, constants, and types</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Browser */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div className="flex gap-2">
                {Object.values(APICategory).map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedItem(null);
                      setGeneratedCode('');
                    }}
                    className={`px-3 py-1 text-sm rounded ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedLibrary}
                  onChange={(e) => setSelectedLibrary(e.target.value as APILibrary | 'All')}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="All">All Libraries</option>
                  {Object.values(APILibrary).map(lib => (
                    <option key={lib} value={lib}>{lib}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              {selectedCategory === APICategory.Functions && (
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={showDeprecated}
                      onChange={(e) => setShowDeprecated(e.target.checked)}
                    />
                    Show deprecated
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={showUnicodeOnly}
                      onChange={(e) => setShowUnicodeOnly(e.target.checked)}
                    />
                    Unicode only
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleItemSelect(item)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedItem === item ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {'library' in item && item.library && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {item.library}
                      </span>
                    )}
                    {'category' in item && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                    {'deprecated' in item && item.deprecated && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        Deprecated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredData.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <p>No items found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="w-1/2 flex flex-col">
          {selectedItem ? (
            <>
              {/* Item Details */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedItem.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToClipboard(generatedCode)}
                      className={`p-2 text-sm rounded ${
                        copyStatus === 'copied'
                          ? 'bg-green-100 text-green-800'
                          : copyStatus === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copyStatus === 'copied' ? '✓' : copyStatus === 'error' ? '✗' : '📋'}
                    </button>
                    <button
                      onClick={() => insertCode(generatedCode)}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      title="Insert into code"
                    >
                      Insert
                    </button>
                  </div>
                </div>
                
                {/* Additional metadata */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {'library' in selectedItem && selectedItem.library && (
                    <span className="bg-gray-200 px-2 py-1 rounded">
                      Library: {selectedItem.library}
                    </span>
                  )}
                  {'category' in selectedItem && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Category: {selectedItem.category}
                    </span>
                  )}
                  {'returnType' in selectedItem && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Returns: {selectedItem.returnType}
                    </span>
                  )}
                </div>
              </div>

              {/* Generated Code */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">VB6 Declaration</h3>
                <pre className="bg-white border border-gray-200 rounded p-3 text-xs font-mono overflow-x-auto">
                  {generatedCode}
                </pre>
              </div>

              {/* Parameters/Members/Details */}
              <div className="flex-1 overflow-y-auto p-4">
                {'parameters' in selectedItem && selectedItem.parameters.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Parameters</h3>
                    <div className="space-y-2">
                      {selectedItem.parameters.map((param, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{param.name}</span>
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{param.type}</span>
                            {param.optional && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{param.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {'members' in selectedItem && selectedItem.members && selectedItem.members.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Members</h3>
                    <div className="space-y-2">
                      {selectedItem.members.map((member, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{member.name}</span>
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{member.type}</span>
                          </div>
                          <p className="text-xs text-gray-600">{member.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {'returnDescription' in selectedItem && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Return Value</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">{selectedItem.returnDescription}</p>
                    </div>
                  </div>
                )}

                {'example' in selectedItem && selectedItem.example && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Example</h3>
                    <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono overflow-x-auto">
                      {selectedItem.example}
                    </pre>
                  </div>
                )}

                {'value' in selectedItem && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Value</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm">{selectedItem.value}</span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{selectedItem.type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500">
              <div>
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-lg font-medium mb-2">Select an API Item</h3>
                <p className="text-sm">Choose a function, constant, or type from the list to view details</p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Total items: {filteredData.length}</p>
                  <p>Current filter: {selectedCategory} • {selectedLibrary}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>{filteredData.length} items found</span>
          <span>API Viewer Tool v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default APIViewerTool;