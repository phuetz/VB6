/**
 * API Text Viewer - Complete VB6 API Browser Tool
 * Provides comprehensive Windows API declarations and constants
 */

import React, { useState, useEffect, useRef } from 'react';
import { useVB6Store } from '../stores/vb6Store';

// API Categories and Declarations
export interface APIDeclaration {
  name: string;
  category: string;
  type: 'Declare' | 'Type' | 'Const';
  library: string;
  declaration: string;
  description: string;
  parameters?: APIParameter[];
  returnType?: string;
}

export interface APIParameter {
  name: string;
  type: string;
  direction: 'In' | 'Out' | 'InOut';
  optional: boolean;
  description: string;
}

export interface APITextViewerProps {
  visible: boolean;
  onClose: () => void;
  onInsertAPI: (declaration: string) => void;
}

export const APITextViewer: React.FC<APITextViewerProps> = ({
  visible,
  onClose,
  onInsertAPI
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAPI, setSelectedAPI] = useState<APIDeclaration | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredAPIs, setFilteredAPIs] = useState<APIDeclaration[]>([]);
  const [apiDatabase, setApiDatabase] = useState<APIDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const categories = [
    'All Categories',
    'File Operations',
    'Memory Management',
    'String Functions',
    'Registry Functions',
    'System Information',
    'Window Management',
    'Drawing Functions',
    'Keyboard and Mouse',
    'Time and Date',
    'Process and Thread',
    'Network Functions',
    'Common Dialogs',
    'Multimedia',
    'Shell Functions',
    'Security',
    'Hardware',
    'Internet',
    'Database'
  ];

  // Initialize API database
  useEffect(() => {
    if (visible) {
      loadAPIDatabase();
    }
  }, [visible]);

  // Filter APIs based on search and category
  useEffect(() => {
    filterAPIs();
  }, [searchText, selectedCategory, apiDatabase]);

  const loadAPIDatabase = async () => {
    setLoading(true);
    
    // Simulate loading API database
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const apis: APIDeclaration[] = [
      // File Operations
      {
        name: 'CreateFile',
        category: 'File Operations',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function CreateFile Lib "kernel32" Alias "CreateFileA" (ByVal lpFileName As String, ByVal dwDesiredAccess As Long, ByVal dwShareMode As Long, lpSecurityAttributes As Any, ByVal dwCreationDisposition As Long, ByVal dwFlagsAndAttributes As Long, ByVal hTemplateFile As Long) As Long',
        description: 'Creates or opens a file or I/O device.',
        returnType: 'Long',
        parameters: [
          { name: 'lpFileName', type: 'String', direction: 'In', optional: false, description: 'Name of the file or device to be created or opened' },
          { name: 'dwDesiredAccess', type: 'Long', direction: 'In', optional: false, description: 'Requested access to the file or device' },
          { name: 'dwShareMode', type: 'Long', direction: 'In', optional: false, description: 'Requested sharing mode of the file or device' },
          { name: 'lpSecurityAttributes', type: 'Any', direction: 'In', optional: true, description: 'Pointer to security attributes' },
          { name: 'dwCreationDisposition', type: 'Long', direction: 'In', optional: false, description: 'Action to take on a file or device that exists or does not exist' },
          { name: 'dwFlagsAndAttributes', type: 'Long', direction: 'In', optional: false, description: 'File or device attributes and flags' },
          { name: 'hTemplateFile', type: 'Long', direction: 'In', optional: true, description: 'Handle to a template file' }
        ]
      },
      {
        name: 'ReadFile',
        category: 'File Operations',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function ReadFile Lib "kernel32" (ByVal hFile As Long, lpBuffer As Any, ByVal nNumberOfBytesToRead As Long, lpNumberOfBytesRead As Long, lpOverlapped As Any) As Long',
        description: 'Reads data from the specified file or input/output (I/O) device.',
        returnType: 'Long',
        parameters: [
          { name: 'hFile', type: 'Long', direction: 'In', optional: false, description: 'Handle to the device' },
          { name: 'lpBuffer', type: 'Any', direction: 'Out', optional: false, description: 'Pointer to the buffer that receives the data read from a file or device' },
          { name: 'nNumberOfBytesToRead', type: 'Long', direction: 'In', optional: false, description: 'Maximum number of bytes to be read' },
          { name: 'lpNumberOfBytesRead', type: 'Long', direction: 'Out', optional: false, description: 'Pointer to the variable that receives the number of bytes read' },
          { name: 'lpOverlapped', type: 'Any', direction: 'InOut', optional: true, description: 'Pointer to an OVERLAPPED structure' }
        ]
      },
      {
        name: 'WriteFile',
        category: 'File Operations',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function WriteFile Lib "kernel32" (ByVal hFile As Long, lpBuffer As Any, ByVal nNumberOfBytesToWrite As Long, lpNumberOfBytesWritten As Long, lpOverlapped As Any) As Long',
        description: 'Writes data to the specified file or input/output (I/O) device.',
        returnType: 'Long'
      },
      {
        name: 'CloseHandle',
        category: 'File Operations',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function CloseHandle Lib "kernel32" (ByVal hObject As Long) As Long',
        description: 'Closes an open object handle.',
        returnType: 'Long'
      },

      // Memory Management
      {
        name: 'GlobalAlloc',
        category: 'Memory Management',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function GlobalAlloc Lib "kernel32" (ByVal wFlags As Long, ByVal dwBytes As Long) As Long',
        description: 'Allocates the specified number of bytes from the heap.',
        returnType: 'Long'
      },
      {
        name: 'GlobalFree',
        category: 'Memory Management',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function GlobalFree Lib "kernel32" (ByVal hMem As Long) As Long',
        description: 'Frees the specified global memory object and invalidates its handle.',
        returnType: 'Long'
      },
      {
        name: 'GlobalLock',
        category: 'Memory Management',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function GlobalLock Lib "kernel32" (ByVal hMem As Long) As Long',
        description: 'Locks a global memory object and returns a pointer to the first byte of the object\'s memory block.',
        returnType: 'Long'
      },
      {
        name: 'GlobalUnlock',
        category: 'Memory Management',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function GlobalUnlock Lib "kernel32" (ByVal hMem As Long) As Long',
        description: 'Decrements the lock count associated with a memory object.',
        returnType: 'Long'
      },

      // String Functions
      {
        name: 'lstrlen',
        category: 'String Functions',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function lstrlen Lib "kernel32" Alias "lstrlenA" (ByVal lpString As String) As Long',
        description: 'Determines the length of the specified string.',
        returnType: 'Long'
      },
      {
        name: 'lstrcpy',
        category: 'String Functions',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function lstrcpy Lib "kernel32" Alias "lstrcpyA" (ByVal lpString1 As String, ByVal lpString2 As String) As Long',
        description: 'Copies a string to a buffer.',
        returnType: 'Long'
      },
      {
        name: 'lstrcmp',
        category: 'String Functions',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function lstrcmp Lib "kernel32" Alias "lstrcmpA" (ByVal lpString1 As String, ByVal lpString2 As String) As Long',
        description: 'Compares two character strings.',
        returnType: 'Long'
      },

      // Registry Functions
      {
        name: 'RegOpenKeyEx',
        category: 'Registry Functions',
        type: 'Declare',
        library: 'advapi32',
        declaration: 'Private Declare Function RegOpenKeyEx Lib "advapi32.dll" Alias "RegOpenKeyExA" (ByVal hKey As Long, ByVal lpSubKey As String, ByVal ulOptions As Long, ByVal samDesired As Long, phkResult As Long) As Long',
        description: 'Opens the specified registry key.',
        returnType: 'Long'
      },
      {
        name: 'RegQueryValueEx',
        category: 'Registry Functions',
        type: 'Declare',
        library: 'advapi32',
        declaration: 'Private Declare Function RegQueryValueEx Lib "advapi32.dll" Alias "RegQueryValueExA" (ByVal hKey As Long, ByVal lpValueName As String, ByVal lpReserved As Long, lpType As Long, lpData As Any, lpcbData As Long) As Long',
        description: 'Retrieves the type and data for the specified value name associated with an open registry key.',
        returnType: 'Long'
      },
      {
        name: 'RegCloseKey',
        category: 'Registry Functions',
        type: 'Declare',
        library: 'advapi32',
        declaration: 'Private Declare Function RegCloseKey Lib "advapi32.dll" (ByVal hKey As Long) As Long',
        description: 'Closes a handle to the specified registry key.',
        returnType: 'Long'
      },

      // System Information
      {
        name: 'GetSystemInfo',
        category: 'System Information',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Sub GetSystemInfo Lib "kernel32" (lpSystemInfo As SYSTEM_INFO)',
        description: 'Retrieves information about the current system.',
        returnType: 'None'
      },
      {
        name: 'GetVersionEx',
        category: 'System Information',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function GetVersionEx Lib "kernel32" Alias "GetVersionExA" (lpVersionInformation As OSVERSIONINFO) As Long',
        description: 'Obtains extended information about the version of the operating system that is currently running.',
        returnType: 'Long'
      },
      {
        name: 'GetComputerName',
        category: 'System Information',
        type: 'Declare',
        library: 'kernel32',
        declaration: 'Private Declare Function GetComputerName Lib "kernel32" Alias "GetComputerNameA" (ByVal lpBuffer As String, nSize As Long) As Long',
        description: 'Retrieves the NetBIOS name of the local computer.',
        returnType: 'Long'
      },

      // Window Management
      {
        name: 'FindWindow',
        category: 'Window Management',
        type: 'Declare',
        library: 'user32',
        declaration: 'Private Declare Function FindWindow Lib "user32" Alias "FindWindowA" (ByVal lpClassName As String, ByVal lpWindowName As String) As Long',
        description: 'Retrieves a handle to the top-level window whose class name and window name match the specified strings.',
        returnType: 'Long'
      },
      {
        name: 'GetWindowText',
        category: 'Window Management',
        type: 'Declare',
        library: 'user32',
        declaration: 'Private Declare Function GetWindowText Lib "user32" Alias "GetWindowTextA" (ByVal hwnd As Long, ByVal lpString As String, ByVal cch As Long) As Long',
        description: 'Copies the text of the specified window\'s title bar into a buffer.',
        returnType: 'Long'
      },
      {
        name: 'SetWindowText',
        category: 'Window Management',
        type: 'Declare',
        library: 'user32',
        declaration: 'Private Declare Function SetWindowText Lib "user32" Alias "SetWindowTextA" (ByVal hwnd As Long, ByVal lpString As String) As Long',
        description: 'Changes the text of the specified window\'s title bar.',
        returnType: 'Long'
      },
      {
        name: 'ShowWindow',
        category: 'Window Management',
        type: 'Declare',
        library: 'user32',
        declaration: 'Private Declare Function ShowWindow Lib "user32" (ByVal hwnd As Long, ByVal nCmdShow As Long) As Long',
        description: 'Sets the specified window\'s show state.',
        returnType: 'Long'
      },

      // Drawing Functions
      {
        name: 'GetDC',
        category: 'Drawing Functions',
        type: 'Declare',
        library: 'user32',
        declaration: 'Private Declare Function GetDC Lib "user32" (ByVal hwnd As Long) As Long',
        description: 'Retrieves a handle to a device context (DC) for the client area of a specified window.',
        returnType: 'Long'
      },
      {
        name: 'ReleaseDC',
        category: 'Drawing Functions',
        type: 'Declare',
        library: 'user32',
        declaration: 'Private Declare Function ReleaseDC Lib "user32" (ByVal hwnd As Long, ByVal hdc As Long) As Long',
        description: 'Releases a device context (DC), freeing it for use by other applications.',
        returnType: 'Long'
      },

      // Constants
      {
        name: 'File Access Constants',
        category: 'File Operations',
        type: 'Const',
        library: '',
        declaration: `Public Const GENERIC_READ = &H80000000
Public Const GENERIC_WRITE = &H40000000
Public Const GENERIC_EXECUTE = &H20000000
Public Const GENERIC_ALL = &H10000000`,
        description: 'Constants for file access rights.'
      },
      {
        name: 'File Share Constants',
        category: 'File Operations',
        type: 'Const',
        library: '',
        declaration: `Public Const FILE_SHARE_READ = &H1
Public Const FILE_SHARE_WRITE = &H2
Public Const FILE_SHARE_DELETE = &H4`,
        description: 'Constants for file sharing modes.'
      },
      {
        name: 'Registry Keys',
        category: 'Registry Functions',
        type: 'Const',
        library: '',
        declaration: `Public Const HKEY_CLASSES_ROOT = &H80000000
Public Const HKEY_CURRENT_USER = &H80000001
Public Const HKEY_LOCAL_MACHINE = &H80000002
Public Const HKEY_USERS = &H80000003`,
        description: 'Registry root key constants.'
      },

      // Types
      {
        name: 'SYSTEM_INFO',
        category: 'System Information',
        type: 'Type',
        library: '',
        declaration: `Public Type SYSTEM_INFO
    dwOemID As Long
    dwPageSize As Long
    lpMinimumApplicationAddress As Long
    lpMaximumApplicationAddress As Long
    dwActiveProcessorMask As Long
    dwNumberOfProcessors As Long
    dwProcessorType As Long
    dwAllocationGranularity As Long
    wProcessorLevel As Integer
    wProcessorRevision As Integer
End Type`,
        description: 'Contains information about a computer system.'
      },
      {
        name: 'OSVERSIONINFO',
        category: 'System Information',
        type: 'Type',
        library: '',
        declaration: `Public Type OSVERSIONINFO
    dwOSVersionInfoSize As Long
    dwMajorVersion As Long
    dwMinorVersion As Long
    dwBuildNumber As Long
    dwPlatformId As Long
    szCSDVersion As String * 128
End Type`,
        description: 'Contains operating system version information.'
      }
    ];

    setApiDatabase(apis);
    setLoading(false);
  };

  const filterAPIs = () => {
    let filtered = apiDatabase;

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filtered = filtered.filter(api => api.category === selectedCategory);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(api => 
        api.name.toLowerCase().includes(search) ||
        api.description.toLowerCase().includes(search) ||
        api.declaration.toLowerCase().includes(search)
      );
    }

    setFilteredAPIs(filtered);
  };

  const handleAPISelect = (api: APIDeclaration) => {
    setSelectedAPI(api);
  };

  const handleInsertAPI = () => {
    if (selectedAPI) {
      onInsertAPI(selectedAPI.declaration);
    }
  };

  const handleCopyToClipboard = () => {
    if (selectedAPI) {
      navigator.clipboard.writeText(selectedAPI.declaration);
    }
  };

  const formatParameterList = (params: APIParameter[] | undefined) => {
    if (!params) return '';
    
    return params.map(param => {
      const direction = param.direction === 'Out' ? 'ByRef ' : 
                      param.direction === 'InOut' ? 'ByRef ' : 'ByVal ';
      const optional = param.optional ? 'Optional ' : '';
      return `${optional}${direction}${param.name} As ${param.type}`;
    }).join(', ');
  };

  if (!visible) return null;

  return (
    <div className="api-text-viewer">
      <div className="viewer-overlay" onClick={onClose} />
      <div className="viewer-dialog">
        <div className="viewer-header">
          <h2>API Text Viewer</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="viewer-content">
          {/* Left Panel - Categories and API List */}
          <div className="left-panel">
            <div className="category-section">
              <label>Available Items:</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-section">
              <label>Find:</label>
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Type API name or keyword..."
                className="search-input"
              />
            </div>

            <div className="api-list-section">
              <div className="api-list">
                {loading ? (
                  <div className="loading">Loading API database...</div>
                ) : (
                  filteredAPIs.map((api, index) => (
                    <div
                      key={index}
                      className={`api-item ${selectedAPI === api ? 'selected' : ''}`}
                      onClick={() => handleAPISelect(api)}
                    >
                      <div className="api-name">{api.name}</div>
                      <div className="api-type">{api.type}</div>
                      {api.library && <div className="api-library">{api.library}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - API Details */}
          <div className="right-panel">
            {selectedAPI ? (
              <div className="api-details">
                <div className="api-header">
                  <h3>{selectedAPI.name}</h3>
                  <div className="api-meta">
                    <span className="api-type-badge">{selectedAPI.type}</span>
                    {selectedAPI.library && (
                      <span className="api-library-badge">{selectedAPI.library}</span>
                    )}
                  </div>
                </div>

                <div className="api-description">
                  <strong>Description:</strong>
                  <p>{selectedAPI.description}</p>
                </div>

                {selectedAPI.parameters && selectedAPI.parameters.length > 0 && (
                  <div className="api-parameters">
                    <strong>Parameters:</strong>
                    <table className="parameters-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Direction</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAPI.parameters.map((param, index) => (
                          <tr key={index}>
                            <td>{param.name}</td>
                            <td>{param.type}</td>
                            <td>{param.direction}</td>
                            <td>{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedAPI.returnType && (
                  <div className="api-return">
                    <strong>Return Value:</strong>
                    <p>{selectedAPI.returnType}</p>
                  </div>
                )}

                <div className="api-declaration">
                  <strong>Declaration:</strong>
                  <pre className="declaration-text">{selectedAPI.declaration}</pre>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>Select an API from the list to view details</p>
              </div>
            )}
          </div>
        </div>

        <div className="viewer-footer">
          <div className="status-bar">
            {selectedAPI && (
              <span>
                {selectedAPI.name} - {selectedAPI.type}
                {selectedAPI.library && ` from ${selectedAPI.library}`}
              </span>
            )}
          </div>
          
          <div className="button-group">
            <button 
              onClick={handleInsertAPI}
              disabled={!selectedAPI}
              className="insert-button"
            >
              Insert
            </button>
            
            <button 
              onClick={handleCopyToClipboard}
              disabled={!selectedAPI}
              className="copy-button"
            >
              Copy
            </button>
            
            <button onClick={onClose} className="close-button-footer">
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .api-text-viewer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .viewer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .viewer-dialog {
          position: relative;
          width: 900px;
          height: 700px;
          background: #f0f0f0;
          border: 2px outset #c0c0c0;
          display: flex;
          flex-direction: column;
        }

        .viewer-header {
          background: #008080;
          color: white;
          padding: 6px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #c0c0c0;
        }

        .viewer-header h2 {
          margin: 0;
          font-size: 13px;
          font-weight: normal;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 2px 6px;
        }

        .viewer-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .left-panel {
          width: 300px;
          border-right: 1px solid #c0c0c0;
          display: flex;
          flex-direction: column;
          background: #f0f0f0;
        }

        .category-section, .search-section {
          padding: 8px;
          border-bottom: 1px solid #c0c0c0;
        }

        .category-section label, .search-section label {
          display: block;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .category-select, .search-input {
          width: 100%;
          padding: 2px;
          border: 1px inset #c0c0c0;
          font-size: 11px;
        }

        .api-list-section {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .api-list {
          flex: 1;
          overflow-y: auto;
          background: white;
          border: 1px inset #c0c0c0;
          margin: 8px;
        }

        .loading {
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 11px;
        }

        .api-item {
          padding: 4px 8px;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .api-item:hover {
          background: #e0e0ff;
        }

        .api-item.selected {
          background: #0000ff;
          color: white;
        }

        .api-name {
          font-weight: bold;
          flex: 1;
        }

        .api-type {
          font-size: 9px;
          color: #666;
          margin-left: 8px;
        }

        .api-item.selected .api-type {
          color: #ccc;
        }

        .api-library {
          font-size: 9px;
          color: #999;
          margin-left: 4px;
        }

        .api-item.selected .api-library {
          color: #ddd;
        }

        .right-panel {
          flex: 1;
          background: white;
          overflow-y: auto;
          padding: 12px;
        }

        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          font-size: 12px;
        }

        .api-details {
          font-size: 11px;
        }

        .api-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e0e0;
        }

        .api-header h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #0000ff;
        }

        .api-meta {
          display: flex;
          gap: 8px;
        }

        .api-type-badge, .api-library-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: bold;
        }

        .api-type-badge {
          background: #008080;
          color: white;
        }

        .api-library-badge {
          background: #800080;
          color: white;
        }

        .api-description, .api-parameters, .api-return, .api-declaration {
          margin-bottom: 16px;
        }

        .api-description strong, .api-parameters strong, .api-return strong, .api-declaration strong {
          display: block;
          margin-bottom: 4px;
          color: #000080;
        }

        .parameters-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        .parameters-table th, .parameters-table td {
          border: 1px solid #c0c0c0;
          padding: 4px;
          text-align: left;
        }

        .parameters-table th {
          background: #f0f0f0;
          font-weight: bold;
        }

        .declaration-text {
          background: #f8f8f8;
          border: 1px solid #c0c0c0;
          padding: 8px;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          white-space: pre-wrap;
          overflow-x: auto;
          color: #000080;
        }

        .viewer-footer {
          border-top: 1px solid #c0c0c0;
          background: #f0f0f0;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-bar {
          font-size: 10px;
          color: #666;
          flex: 1;
        }

        .button-group {
          display: flex;
          gap: 6px;
        }

        .insert-button, .copy-button, .close-button-footer {
          padding: 4px 12px;
          border: 1px outset #c0c0c0;
          background: #f0f0f0;
          cursor: pointer;
          font-size: 11px;
        }

        .insert-button:disabled, .copy-button:disabled {
          color: #999;
          cursor: not-allowed;
        }

        .insert-button:not(:disabled):hover, .copy-button:not(:disabled):hover, .close-button-footer:hover {
          background: #e0e0e0;
        }

        .insert-button {
          background: #0000ff;
          color: white;
          border: 1px outset #0000ff;
        }

        .insert-button:not(:disabled):hover {
          background: #0000cc;
        }
      `}</style>
    </div>
  );
};

export default APITextViewer;