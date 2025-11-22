/**
 * VB6 File I/O Manager - Visual Interface for VB6 File Operations
 * Provides complete testing and demonstration interface for VB6FileIOSystem
 * Supports Open, Close, Input, Print, Get, Put, and all VB6 file operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  VB6FileIO, 
  VB6FileMode, 
  VB6FileAccess, 
  VB6FileShare,
  FreeFile,
  Open,
  Close,
  Print,
  Write,
  Input,
  LineInput,
  Get,
  Put,
  Seek,
  EOF,
  LOF,
  Loc,
  FileLen,
  Dir,
  FileCopy,
  Kill,
  Name
} from '../../services/VB6FileIOSystem';

interface FileHandle {
  fileNumber: number;
  fileName: string;
  mode: string;
  access: string;
  position: number;
  size: number;
  isOpen: boolean;
}

interface VB6FileIOManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const VB6FileIOManager: React.FC<VB6FileIOManagerProps> = ({
  visible,
  onClose
}) => {
  const [openFiles, setOpenFiles] = useState<FileHandle[]>([]);
  const [virtualFiles, setVirtualFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedHandle, setSelectedHandle] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'operations' | 'output' | 'stats'>('files');
  
  // Operation states
  const [operation, setOperation] = useState<string>('');
  const [operationFile, setOperationFile] = useState<string>('');
  const [operationMode, setOperationMode] = useState<VB6FileMode>(VB6FileMode.Input);
  const [operationAccess, setOperationAccess] = useState<VB6FileAccess>(VB6FileAcces.ReadWrite);
  const [operationData, setOperationData] = useState<string>('');
  const [operationPosition, setOperationPosition] = useState<number>(1);
  const [operationRecord, setOperationRecord] = useState<number>(1);
  
  // Output and results
  const [output, setOutput] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // File creation
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileContent, setNewFileContent] = useState<string>('');

  useEffect(() => {
    if (visible) {
      refreshFileInfo();
    }
  }, [visible]);

  const refreshFileInfo = () => {
    try {
      const files = VB6FileIO.listVirtualFiles();
      setVirtualFiles(files);
      
      const handles = VB6FileIO.getOpenFiles();
      setOpenFiles(handles);
      
      const stats = VB6FileIO.getFileSystemStats();
      addOutput(`File system stats: ${stats.totalFiles} files, ${stats.openFiles} open, ${stats.totalBytesRead} bytes read, ${stats.totalBytesWritten} bytes written`);
    } catch (err) {
      setError(`Error refreshing file info: ${err}`);
    }
  };

  const addOutput = (message: string) => {
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearOutput = () => {
    setOutput([]);
  };

  // File Operations
  const handleOpenFile = () => {
    try {
      if (!operationFile) {
        setError('Please enter a filename');
        return;
      }

      const fileNum = Open(operationFile, operationMode, operationAccess);
      addOutput(`Opened file "${operationFile}" with handle ${fileNum} (Mode: ${VB6FileMode[operationMode]}, Access: ${VB6FileAccess[operationAccess]})`);
      setLastResult(fileNum);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error opening file: ${err}`);
    }
  };

  const handleCloseFile = () => {
    try {
      if (selectedHandle === null) {
        Close(); // Close all files
        addOutput(`Closed all files`);
      } else {
        Close(selectedHandle);
        addOutput(`Closed file handle ${selectedHandle}`);
      }
      refreshFileInfo();
      setSelectedHandle(null);
      setError('');
    } catch (err) {
      setError(`Error closing file: ${err}`);
    }
  };

  const handlePrintToFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const values = operationData.split(',').map(v => v.trim());
      Print(selectedHandle, ...values);
      addOutput(`Printed to file handle ${selectedHandle}: ${values.join(', ')}`);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error printing to file: ${err}`);
    }
  };

  const handleWriteToFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const values = operationData.split(',').map(v => v.trim());
      Write(selectedHandle, ...values);
      addOutput(`Wrote to file handle ${selectedHandle}: ${values.join(', ')}`);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error writing to file: ${err}`);
    }
  };

  const handleInputFromFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const count = parseInt(operationData) || 1;
      const variables = new Array(count).fill('');
      const result = Input(selectedHandle, ...variables);
      addOutput(`Input from file handle ${selectedHandle}: ${JSON.stringify(result)}`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error reading input from file: ${err}`);
    }
  };

  const handleLineInputFromFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const result = LineInput(selectedHandle);
      addOutput(`Line input from file handle ${selectedHandle}: "${result}"`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error reading line from file: ${err}`);
    }
  };

  const handleGetFromFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const result = Get(selectedHandle, operationRecord > 0 ? operationRecord : undefined, operationData || undefined);
      addOutput(`Get from file handle ${selectedHandle} (record ${operationRecord}): ${typeof result === 'string' ? `"${result}"` : JSON.stringify(result)}`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error getting from file: ${err}`);
    }
  };

  const handlePutToFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      Put(selectedHandle, operationRecord > 0 ? operationRecord : undefined, operationData);
      addOutput(`Put to file handle ${selectedHandle} (record ${operationRecord}): "${operationData}"`);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error putting to file: ${err}`);
    }
  };

  const handleSeekFile = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      if (operationPosition > 0) {
        const result = Seek(selectedHandle, operationPosition);
        addOutput(`Seek file handle ${selectedHandle} to position ${operationPosition}, result: ${result}`);
        setLastResult(result);
      } else {
        const result = Seek(selectedHandle);
        addOutput(`Current position of file handle ${selectedHandle}: ${result}`);
        setLastResult(result);
      }
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error seeking file: ${err}`);
    }
  };

  const handleEOFCheck = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const result = EOF(selectedHandle);
      addOutput(`EOF check for file handle ${selectedHandle}: ${result}`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error checking EOF: ${err}`);
    }
  };

  const handleLOFCheck = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const result = LOF(selectedHandle);
      addOutput(`Length of file handle ${selectedHandle}: ${result} bytes`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error getting file length: ${err}`);
    }
  };

  const handleLocCheck = () => {
    try {
      if (selectedHandle === null) {
        setError('Please select an open file handle');
        return;
      }

      const result = Loc(selectedHandle);
      addOutput(`Current location in file handle ${selectedHandle}: ${result}`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error getting file location: ${err}`);
    }
  };

  // File Management Operations
  const handleCreateFile = () => {
    try {
      if (!newFileName || !newFileContent) {
        setError('Please enter filename and content');
        return;
      }

      VB6FileIO.addVirtualFile(newFileName, newFileContent);
      addOutput(`Created virtual file: ${newFileName}`);
      setNewFileName('');
      setNewFileContent('');
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error creating file: ${err}`);
    }
  };

  const handleFileCopy = () => {
    try {
      const [source, dest] = operationData.split(',').map(s => s.trim());
      if (!source || !dest) {
        setError('Please enter source,destination');
        return;
      }

      FileCopy(source, dest);
      addOutput(`Copied file from ${source} to ${dest}`);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error copying file: ${err}`);
    }
  };

  const handleDeleteFile = () => {
    try {
      if (!operationFile) {
        setError('Please enter filename to delete');
        return;
      }

      Kill(operationFile);
      addOutput(`Deleted file: ${operationFile}`);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error deleting file: ${err}`);
    }
  };

  const handleRenameFile = () => {
    try {
      const [oldName, newName] = operationData.split(',').map(s => s.trim());
      if (!oldName || !newName) {
        setError('Please enter oldname,newname');
        return;
      }

      Name(oldName, newName);
      addOutput(`Renamed file from ${oldName} to ${newName}`);
      refreshFileInfo();
      setError('');
    } catch (err) {
      setError(`Error renaming file: ${err}`);
    }
  };

  const handleDirListing = () => {
    try {
      const result = Dir(operationFile || undefined);
      addOutput(`Directory listing: ${result || 'No files found'}`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error listing directory: ${err}`);
    }
  };

  const handleFreeFile = () => {
    try {
      const result = FreeFile();
      addOutput(`Next free file number: ${result}`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error getting free file number: ${err}`);
    }
  };

  const handleFileLenCheck = () => {
    try {
      if (!operationFile) {
        setError('Please enter filename');
        return;
      }

      const result = FileLen(operationFile);
      addOutput(`Length of file ${operationFile}: ${result} bytes`);
      setLastResult(result);
      setError('');
    } catch (err) {
      setError(`Error getting file length: ${err}`);
    }
  };

  const handleViewFileContent = (fileName: string) => {
    try {
      const content = VB6FileIO.getVirtualFileContent(fileName);
      if (content) {
        const text = new TextDecoder().decode(content);
        addOutput(`Content of ${fileName}:\n${text}`);
        setLastResult(text);
      } else {
        addOutput(`File ${fileName} not found or empty`);
      }
      setError('');
    } catch (err) {
      setError(`Error viewing file content: ${err}`);
    }
  };

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
        width: '1200px',
        height: '800px',
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
          <span>VB6 File I/O Manager - Complete File Operations Testing</span>
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

        {/* Tab Navigation */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderBottom: '1px solid #C0C0C0',
          display: 'flex',
          gap: '0px'
        }}>
          {['files', 'operations', 'output', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '4px 12px',
                fontSize: '8pt',
                backgroundColor: activeTab === tab ? '#FFFFFF' : '#E0E0E0',
                border: '1px outset #C0C0C0',
                borderBottom: activeTab === tab ? '1px solid #FFFFFF' : '1px solid #C0C0C0',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'files' ? 'Virtual Files' : 
               tab === 'operations' ? 'File Operations' :
               tab === 'output' ? 'Output Log' : 'Statistics'}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          
          {/* Files Tab */}
          {activeTab === 'files' && (
            <div style={{ flex: 1, padding: '8px', display: 'flex', gap: '8px' }}>
              {/* Virtual Files List */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  Virtual Files ({virtualFiles.length})
                </div>
                <div style={{ height: '200px', overflow: 'auto', border: '1px inset #C0C0C0', backgroundColor: '#FFFFFF' }}>
                  {virtualFiles.map(file => (
                    <div
                      key={file}
                      style={{
                        padding: '2px 4px',
                        cursor: 'pointer',
                        backgroundColor: selectedFile === file ? '#0080FF' : 'transparent',
                        color: selectedFile === file ? 'white' : 'black'
                      }}
                      onClick={() => setSelectedFile(file)}
                      onDoubleClick={() => handleViewFileContent(file)}
                    >
                      {file}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="New filename"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    style={{ width: '100%', marginBottom: '4px', padding: '2px', border: '1px inset #C0C0C0' }}
                  />
                  <textarea
                    placeholder="File content"
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    style={{ width: '100%', height: '60px', padding: '2px', border: '1px inset #C0C0C0', resize: 'none' }}
                  />
                  <button
                    onClick={handleCreateFile}
                    style={{ marginTop: '4px', padding: '4px 8px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}
                  >
                    Create File
                  </button>
                </div>
              </div>

              {/* Open Files List */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  Open Files ({openFiles.length})
                </div>
                <div style={{ height: '300px', overflow: 'auto', border: '1px inset #C0C0C0', backgroundColor: '#FFFFFF' }}>
                  {openFiles.map(handle => (
                    <div
                      key={handle.fileNumber}
                      style={{
                        padding: '4px',
                        borderBottom: '1px solid #E0E0E0',
                        cursor: 'pointer',
                        backgroundColor: selectedHandle === handle.fileNumber ? '#E0E0FF' : 'transparent'
                      }}
                      onClick={() => setSelectedHandle(handle.fileNumber)}
                    >
                      <div style={{ fontWeight: 'bold' }}>Handle #{handle.fileNumber}</div>
                      <div style={{ fontSize: '7pt', color: '#666' }}>
                        File: {handle.fileName}<br/>
                        Mode: {handle.mode} | Size: {handle.size} bytes<br/>
                        Position: {handle.position} | Open: {handle.isOpen ? 'Yes' : 'No'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Operations Tab */}
          {activeTab === 'operations' && (
            <div style={{ flex: 1, padding: '8px', display: 'flex', gap: '8px' }}>
              {/* File Operations */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  File Operations
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label>Filename:</label>
                  <input
                    type="text"
                    value={operationFile}
                    onChange={(e) => setOperationFile(e.target.value)}
                    style={{ width: '100%', padding: '2px', border: '1px inset #C0C0C0' }}
                    placeholder="C:\TEMP\sample.txt"
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <div>
                    <label>Mode:</label>
                    <select
                      value={operationMode}
                      onChange={(e) => setOperationMode(parseInt(e.target.value))}
                      style={{ width: '100%', border: '1px inset #C0C0C0' }}
                    >
                      <option value={VB6FileMode.Input}>Input</option>
                      <option value={VB6FileMode.Output}>Output</option>
                      <option value={VB6FileMode.Append}>Append</option>
                      <option value={VB6FileMode.Random}>Random</option>
                      <option value={VB6FileMode.Binary}>Binary</option>
                    </select>
                  </div>
                  <div>
                    <label>Access:</label>
                    <select
                      value={operationAccess}
                      onChange={(e) => setOperationAccess(parseInt(e.target.value))}
                      style={{ width: '100%', border: '1px inset #C0C0C0' }}
                    >
                      <option value={VB6FileAccess.Read}>Read</option>
                      <option value={VB6FileAccess.Write}>Write</option>
                      <option value={VB6FileAccess.ReadWrite}>Read/Write</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                  <button onClick={handleOpenFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Open File
                  </button>
                  <button onClick={handleCloseFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Close File
                  </button>
                  <button onClick={handleFreeFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Free File #
                  </button>
                  <button onClick={handleFileLenCheck} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    File Length
                  </button>
                </div>
              </div>

              {/* I/O Operations */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  I/O Operations (Handle #{selectedHandle || 'None'})
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label>Data/Values:</label>
                  <textarea
                    value={operationData}
                    onChange={(e) => setOperationData(e.target.value)}
                    style={{ width: '100%', height: '60px', padding: '2px', border: '1px inset #C0C0C0', resize: 'none' }}
                    placeholder="Enter data, comma-separated values, or record content"
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <div>
                    <label>Position:</label>
                    <input
                      type="number"
                      value={operationPosition}
                      onChange={(e) => setOperationPosition(parseInt(e.target.value) || 1)}
                      style={{ width: '60px', padding: '2px', border: '1px inset #C0C0C0' }}
                    />
                  </div>
                  <div>
                    <label>Record:</label>
                    <input
                      type="number"
                      value={operationRecord}
                      onChange={(e) => setOperationRecord(parseInt(e.target.value) || 1)}
                      style={{ width: '60px', padding: '2px', border: '1px inset #C0C0C0' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                  <button onClick={handlePrintToFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Print
                  </button>
                  <button onClick={handleWriteToFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Write
                  </button>
                  <button onClick={handleInputFromFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Input
                  </button>
                  <button onClick={handleLineInputFromFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Line Input
                  </button>
                  <button onClick={handleGetFromFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Get
                  </button>
                  <button onClick={handlePutToFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Put
                  </button>
                  <button onClick={handleSeekFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Seek
                  </button>
                  <button onClick={handleEOFCheck} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    EOF
                  </button>
                  <button onClick={handleLOFCheck} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    LOF
                  </button>
                  <button onClick={handleLocCheck} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Loc
                  </button>
                </div>
              </div>

              {/* File Management */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '4px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  File Management
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                  <button onClick={handleFileCopy} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Copy File
                  </button>
                  <button onClick={handleDeleteFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Kill File
                  </button>
                  <button onClick={handleRenameFile} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Rename File
                  </button>
                  <button onClick={handleDirListing} style={{ padding: '4px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0' }}>
                    Dir Listing
                  </button>
                </div>

                {lastResult !== null && (
                  <div style={{ marginTop: '8px', padding: '4px', backgroundColor: '#FFFFCC', border: '1px inset #C0C0C0' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '7pt' }}>Last Result:</div>
                    <div style={{ fontSize: '7pt', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Output Tab */}
          {activeTab === 'output' && (
            <div style={{ flex: 1, padding: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold' }}>Operation Log ({output.length} entries)</div>
                <button 
                  onClick={clearOutput}
                  style={{ padding: '4px 8px', backgroundColor: '#E0E0E0', border: '1px outset #C0C0C0', fontSize: '7pt' }}
                >
                  Clear Log
                </button>
              </div>
              <div style={{
                backgroundColor: '#000000',
                color: '#00FF00',
                padding: '8px',
                height: 'calc(100% - 50px)',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '8pt',
                border: '1px inset #C0C0C0'
              }}>
                {output.map((line, index) => (
                  <div key={index} style={{ marginBottom: '2px' }}>
                    {line}
                  </div>
                ))}
                {output.length === 0 && (
                  <div style={{ color: '#808080' }}>
                    Operation log is empty. Perform file operations to see results here.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div style={{ flex: 1, padding: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>VB6 File I/O System Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                    System Info
                  </div>
                  <div>Virtual Files: {virtualFiles.length}</div>
                  <div>Open Files: {openFiles.length}</div>
                  <div>Max File Handles: 511</div>
                  <div>Available Handles: {511 - openFiles.length}</div>
                </div>
                
                <div style={{ backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                    I/O Statistics
                  </div>
                  <div>Bytes Read: {VB6FileIO.getFileSystemStats().totalBytesRead}</div>
                  <div>Bytes Written: {VB6FileIO.getFileSystemStats().totalBytesWritten}</div>
                  <div>Total Files: {VB6FileIO.getFileSystemStats().totalFiles}</div>
                  <div>Error Count: {VB6FileIO.getFileSystemStats().errorCount}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '8px', gridColumn: 'span 2' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                    Supported Operations
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7pt' }}>
                    <div>
                      <strong>File Management:</strong><br/>
                      • Open, Close<br/>
                      • FreeFile<br/>
                      • Kill, Name<br/>
                      • FileCopy<br/>
                      • Dir, FileLen
                    </div>
                    <div>
                      <strong>Sequential I/O:</strong><br/>
                      • Print, Write<br/>
                      • Input, Line Input<br/>
                      • EOF detection<br/>
                      • Append mode<br/>
                      • Text processing
                    </div>
                    <div>
                      <strong>Random/Binary I/O:</strong><br/>
                      • Get, Put<br/>
                      • Seek, Loc, LOF<br/>
                      • Record-based access<br/>
                      • Binary data handling<br/>
                      • Position control
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderTop: '1px solid #C0C0C0',
          fontSize: '8pt',
          color: error ? '#FF0000' : '#000080',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            {error || (selectedHandle ? `Selected Handle: ${selectedHandle}` : 'Ready - Select a file handle to perform I/O operations')}
          </div>
          <div>
            VB6 File I/O System - Complete Implementation
          </div>
        </div>
      </div>
    </div>
  );
};

export default VB6FileIOManager;