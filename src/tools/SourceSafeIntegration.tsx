import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Source Safe Operation Types
export enum SourceSafeOperation {
  GetLatest = 'Get Latest Version',
  CheckOut = 'Check Out',
  CheckIn = 'Check In',
  UndoCheckOut = 'Undo Check Out',
  ShowHistory = 'Show History',
  ShowDifferences = 'Show Differences',
  Add = 'Add to Source Safe',
  Remove = 'Remove from Source Safe',
  Share = 'Share',
  Branch = 'Branch',
  Merge = 'Merge',
  Label = 'Label',
  Pin = 'Pin',
  Properties = 'Properties'
}

// File Status
export enum FileStatus {
  NotControlled = 'Not Controlled',
  Controlled = 'Controlled',
  CheckedOut = 'Checked Out',
  CheckedOutByOther = 'Checked Out By Other',
  Outdated = 'Outdated',
  Merged = 'Merged',
  Conflict = 'Conflict',
  Deleted = 'Deleted',
  Added = 'Added'
}

// Version Info
export interface VersionInfo {
  version: number;
  date: Date;
  user: string;
  comment: string;
  label?: string;
  action: string;
  size: number;
}

// Source Safe File
export interface SourceSafeFile {
  id: string;
  path: string;
  name: string;
  status: FileStatus;
  localVersion: number;
  serverVersion: number;
  checkedOutBy?: string;
  checkedOutDate?: Date;
  comment?: string;
  isDirectory: boolean;
  children?: SourceSafeFile[];
}

// Source Safe Project
export interface SourceSafeProject {
  id: string;
  name: string;
  database: string;
  workingFolder: string;
  user: string;
  password?: string;
  autoCheckout: boolean;
  autoCheckIn: boolean;
  getLatestOnOpen: boolean;
  removeLocalOnDelete: boolean;
  showCheckOutDialog: boolean;
  showCheckInDialog: boolean;
  files: SourceSafeFile[];
}

// Check In/Out Dialog State
interface CheckInOutState {
  files: Array<{
    file: SourceSafeFile;
    selected: boolean;
    comment: string;
    keepCheckedOut: boolean;
  }>;
  globalComment: string;
  applyToAll: boolean;
  operation: 'checkin' | 'checkout';
}

// History Entry
export interface HistoryEntry {
  version: number;
  date: Date;
  user: string;
  action: string;
  comment: string;
  label?: string;
  files: Array<{
    path: string;
    change: 'added' | 'modified' | 'deleted';
  }>;
}

// Merge Conflict
export interface MergeConflict {
  file: string;
  localContent: string;
  serverContent: string;
  baseContent: string;
  resolution?: 'local' | 'server' | 'manual' | 'merged';
  mergedContent?: string;
}

interface SourceSafeIntegrationProps {
  onProjectOpen?: (project: SourceSafeProject) => void;
  onFileOperation?: (operation: SourceSafeOperation, files: SourceSafeFile[]) => void;
  onError?: (error: string) => void;
}

export const SourceSafeIntegration: React.FC<SourceSafeIntegrationProps> = ({
  onProjectOpen,
  onFileOperation,
  onError
}) => {
  const [connected, setConnected] = useState(false);
  const [currentProject, setCurrentProject] = useState<SourceSafeProject | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SourceSafeFile[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [checkInOutState, setCheckInOutState] = useState<CheckInOutState>({
    files: [],
    globalComment: '',
    applyToAll: false,
    operation: 'checkin'
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mergeConflicts, setMergeConflicts] = useState<MergeConflict[]>([]);
  const [connectionForm, setConnectionForm] = useState({
    database: '',
    user: '',
    password: '',
    workingFolder: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `ss_${nextId.current++}`, []);

  // Sample project structure
  const sampleProject: SourceSafeProject = {
    id: generateId(),
    name: 'VB6 Application',
    database: '\\\\server\\VSS\\VSSDatabase',
    workingFolder: 'C:\\Projects\\VB6App',
    user: 'developer',
    autoCheckout: true,
    autoCheckIn: false,
    getLatestOnOpen: true,
    removeLocalOnDelete: false,
    showCheckOutDialog: true,
    showCheckInDialog: true,
    files: [
      {
        id: generateId(),
        path: '$/VB6App',
        name: 'VB6App',
        status: FileStatus.Controlled,
        localVersion: 1,
        serverVersion: 1,
        isDirectory: true,
        children: [
          {
            id: generateId(),
            path: '$/VB6App/Forms',
            name: 'Forms',
            status: FileStatus.Controlled,
            localVersion: 1,
            serverVersion: 1,
            isDirectory: true,
            children: [
              {
                id: generateId(),
                path: '$/VB6App/Forms/Form1.frm',
                name: 'Form1.frm',
                status: FileStatus.CheckedOut,
                localVersion: 5,
                serverVersion: 5,
                checkedOutBy: 'developer',
                checkedOutDate: new Date(),
                isDirectory: false
              },
              {
                id: generateId(),
                path: '$/VB6App/Forms/Form2.frm',
                name: 'Form2.frm',
                status: FileStatus.Outdated,
                localVersion: 3,
                serverVersion: 4,
                isDirectory: false
              }
            ]
          },
          {
            id: generateId(),
            path: '$/VB6App/Modules',
            name: 'Modules',
            status: FileStatus.Controlled,
            localVersion: 1,
            serverVersion: 1,
            isDirectory: true,
            children: [
              {
                id: generateId(),
                path: '$/VB6App/Modules/Module1.bas',
                name: 'Module1.bas',
                status: FileStatus.CheckedOutByOther,
                localVersion: 2,
                serverVersion: 2,
                checkedOutBy: 'other_dev',
                checkedOutDate: new Date(Date.now() - 86400000),
                isDirectory: false
              }
            ]
          },
          {
            id: generateId(),
            path: '$/VB6App/Project1.vbp',
            name: 'Project1.vbp',
            status: FileStatus.Controlled,
            localVersion: 10,
            serverVersion: 10,
            isDirectory: false
          }
        ]
      }
    ]
  };

  // Connect to Source Safe
  const connect = useCallback(() => {
    if (!connectionForm.database || !connectionForm.user) {
      onError?.('Database and user are required');
      return;
    }

    setStatusMessage('Connecting to Visual SourceSafe...');
    
    // Simulate connection
    setTimeout(() => {
      setConnected(true);
      setCurrentProject(sampleProject);
      setExpandedFolders(new Set(['$/VB6App']));
      setStatusMessage('Connected to Visual SourceSafe');
      onProjectOpen?.(sampleProject);
      eventEmitter.current.emit('connected', sampleProject);
    }, 1000);
  }, [connectionForm, sampleProject, onProjectOpen, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    setConnected(false);
    setCurrentProject(null);
    setSelectedFiles([]);
    setExpandedFolders(new Set());
    setStatusMessage('Disconnected from Visual SourceSafe');
    eventEmitter.current.emit('disconnected');
  }, []);

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Get latest version
  const getLatest = useCallback((files: SourceSafeFile[]) => {
    setStatusMessage(`Getting latest version of ${files.length} file(s)...`);
    
    files.forEach(file => {
      if (!file.isDirectory) {
        file.localVersion = file.serverVersion;
        file.status = FileStatus.Controlled;
      }
    });

    setStatusMessage(`Got latest version of ${files.length} file(s)`);
    onFileOperation?.(SourceSafeOperation.GetLatest, files);
    eventEmitter.current.emit('getLatest', files);
  }, [onFileOperation]);

  // Check out files
  const checkOut = useCallback((files: SourceSafeFile[], comment: string = '') => {
    const checkOutFiles = files.filter(f => 
      !f.isDirectory && 
      f.status !== FileStatus.CheckedOut && 
      f.status !== FileStatus.CheckedOutByOther
    );

    if (checkOutFiles.length === 0) {
      onError?.('No files available for check out');
      return;
    }

    setStatusMessage(`Checking out ${checkOutFiles.length} file(s)...`);

    checkOutFiles.forEach(file => {
      file.status = FileStatus.CheckedOut;
      file.checkedOutBy = currentProject?.user || 'developer';
      file.checkedOutDate = new Date();
      file.comment = comment;
    });

    setStatusMessage(`Checked out ${checkOutFiles.length} file(s)`);
    onFileOperation?.(SourceSafeOperation.CheckOut, checkOutFiles);
    eventEmitter.current.emit('checkOut', checkOutFiles);
    setShowCheckOutDialog(false);
  }, [currentProject, onFileOperation, onError]);

  // Check in files
  const checkIn = useCallback((files: SourceSafeFile[], comment: string = '', keepCheckedOut: boolean = false) => {
    const checkInFiles = files.filter(f => 
      !f.isDirectory && 
      f.status === FileStatus.CheckedOut
    );

    if (checkInFiles.length === 0) {
      onError?.('No files to check in');
      return;
    }

    setStatusMessage(`Checking in ${checkInFiles.length} file(s)...`);

    checkInFiles.forEach(file => {
      file.serverVersion++;
      file.localVersion = file.serverVersion;
      file.status = keepCheckedOut ? FileStatus.CheckedOut : FileStatus.Controlled;
      if (!keepCheckedOut) {
        file.checkedOutBy = undefined;
        file.checkedOutDate = undefined;
        file.comment = undefined;
      }
    });

    // Add to history
    const historyEntry: HistoryEntry = {
      version: checkInFiles[0].serverVersion,
      date: new Date(),
      user: currentProject?.user || 'developer',
      action: 'Check In',
      comment: comment,
      files: checkInFiles.map(f => ({
        path: f.path,
        change: 'modified' as const
      }))
    };
    setHistory(prev => [historyEntry, ...prev]);

    setStatusMessage(`Checked in ${checkInFiles.length} file(s)`);
    onFileOperation?.(SourceSafeOperation.CheckIn, checkInFiles);
    eventEmitter.current.emit('checkIn', checkInFiles);
    setShowCheckInDialog(false);
  }, [currentProject, onFileOperation, onError]);

  // Undo check out
  const undoCheckOut = useCallback((files: SourceSafeFile[]) => {
    const undoFiles = files.filter(f => 
      !f.isDirectory && 
      f.status === FileStatus.CheckedOut
    );

    if (undoFiles.length === 0) {
      onError?.('No files to undo check out');
      return;
    }

    if (!window.confirm(`Undo check out for ${undoFiles.length} file(s)? Local changes will be lost.`)) {
      return;
    }

    setStatusMessage(`Undoing check out for ${undoFiles.length} file(s)...`);

    undoFiles.forEach(file => {
      file.status = FileStatus.Controlled;
      file.checkedOutBy = undefined;
      file.checkedOutDate = undefined;
      file.comment = undefined;
      file.localVersion = file.serverVersion;
    });

    setStatusMessage(`Undid check out for ${undoFiles.length} file(s)`);
    onFileOperation?.(SourceSafeOperation.UndoCheckOut, undoFiles);
    eventEmitter.current.emit('undoCheckOut', undoFiles);
  }, [onFileOperation, onError]);

  // Show history
  const showHistory = useCallback((file: SourceSafeFile) => {
    if (file.isDirectory) {
      onError?.('Cannot show history for directories');
      return;
    }

    // Generate sample history
    const sampleHistory: HistoryEntry[] = [
      {
        version: file.serverVersion,
        date: new Date(),
        user: 'developer',
        action: 'Check In',
        comment: 'Fixed form layout issues',
        files: [{ path: file.path, change: 'modified' }]
      },
      {
        version: file.serverVersion - 1,
        date: new Date(Date.now() - 86400000),
        user: 'other_dev',
        action: 'Check In',
        comment: 'Added new controls',
        label: 'Version 1.2',
        files: [{ path: file.path, change: 'modified' }]
      },
      {
        version: file.serverVersion - 2,
        date: new Date(Date.now() - 172800000),
        user: 'developer',
        action: 'Add',
        comment: 'Initial version',
        files: [{ path: file.path, change: 'added' }]
      }
    ];

    setHistory(sampleHistory);
    setShowHistoryDialog(true);
  }, [onError]);

  // Refresh status
  const refreshStatus = useCallback(() => {
    if (!connected || !currentProject) return;

    setRefreshing(true);
    setStatusMessage('Refreshing file status...');

    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      setStatusMessage('File status refreshed');
      eventEmitter.current.emit('refreshed');
    }, 1000);
  }, [connected, currentProject]);

  // Get file icon based on status
  const getFileIcon = useCallback((file: SourceSafeFile): string => {
    if (file.isDirectory) return '📁';
    
    switch (file.status) {
      case FileStatus.CheckedOut:
        return '✏️';
      case FileStatus.CheckedOutByOther:
        return '🔒';
      case FileStatus.Outdated:
        return '⚠️';
      case FileStatus.Conflict:
        return '⚡';
      case FileStatus.Added:
        return '➕';
      case FileStatus.Deleted:
        return '❌';
      default:
        return '📄';
    }
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: FileStatus): string => {
    switch (status) {
      case FileStatus.CheckedOut:
        return 'text-green-600';
      case FileStatus.CheckedOutByOther:
        return 'text-red-600';
      case FileStatus.Outdated:
        return 'text-yellow-600';
      case FileStatus.Conflict:
        return 'text-red-700';
      case FileStatus.Added:
        return 'text-blue-600';
      case FileStatus.Deleted:
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  }, []);

  // Render file tree
  const renderFileTree = useCallback((files: SourceSafeFile[], level: number = 0): React.ReactNode => {
    return files.map(file => {
      const isExpanded = expandedFolders.has(file.path);
      const isSelected = selectedFiles.some(f => f.id === file.id);

      return (
        <div key={file.id}>
          <div
            className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer ${
              isSelected ? 'bg-blue-100' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => {
              if (file.isDirectory) {
                toggleFolder(file.path);
              } else {
                setSelectedFiles(prev => {
                  const exists = prev.some(f => f.id === file.id);
                  if (exists) {
                    return prev.filter(f => f.id !== file.id);
                  } else {
                    return [...prev, file];
                  }
                });
              }
            }}
          >
            {file.isDirectory && (
              <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
            )}
            <span className="text-lg">{getFileIcon(file)}</span>
            <span className="flex-1 text-sm">{file.name}</span>
            {!file.isDirectory && (
              <span className={`text-xs ${getStatusColor(file.status)}`}>
                {file.status}
              </span>
            )}
            {file.checkedOutBy && file.checkedOutBy !== currentProject?.user && (
              <span className="text-xs text-gray-500">({file.checkedOutBy})</span>
            )}
          </div>
          {file.isDirectory && isExpanded && file.children && (
            <div>{renderFileTree(file.children, level + 1)}</div>
          )}
        </div>
      );
    });
  }, [expandedFolders, selectedFiles, currentProject, getFileIcon, getStatusColor, toggleFolder]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Visual SourceSafe</h1>
          {connected && (
            <button
              onClick={disconnect}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Disconnect
            </button>
          )}
        </div>
        {connected && currentProject && (
          <div className="mt-2 text-sm text-gray-600">
            <div>Database: {currentProject.database}</div>
            <div>User: {currentProject.user}</div>
          </div>
        )}
      </div>

      {!connected ? (
        // Connection Dialog
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <h2 className="text-lg font-medium mb-4">Connect to Visual SourceSafe</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Path
                </label>
                <input
                  type="text"
                  value={connectionForm.database}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, database: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="\\server\VSS\Database"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  value={connectionForm.user}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, user: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={connectionForm.password}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Folder
                </label>
                <input
                  type="text"
                  value={connectionForm.workingFolder}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, workingFolder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\Projects\MyApp"
                />
              </div>
              <button
                onClick={connect}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="p-2 border-b border-gray-200 flex items-center gap-2">
            <button
              onClick={() => getLatest(selectedFiles)}
              disabled={selectedFiles.length === 0}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Get Latest
            </button>
            <button
              onClick={() => setShowCheckOutDialog(true)}
              disabled={selectedFiles.length === 0}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Check Out
            </button>
            <button
              onClick={() => setShowCheckInDialog(true)}
              disabled={selectedFiles.length === 0}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Check In
            </button>
            <button
              onClick={() => undoCheckOut(selectedFiles)}
              disabled={selectedFiles.length === 0}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Undo Check Out
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              onClick={() => selectedFiles.length === 1 && showHistory(selectedFiles[0])}
              disabled={selectedFiles.length !== 1}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              History
            </button>
            <button
              onClick={() => setShowDiffDialog(true)}
              disabled={selectedFiles.length !== 1}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Differences
            </button>
            <div className="ml-auto">
              <button
                onClick={refreshStatus}
                disabled={refreshing}
                className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* File Tree */}
          <div className="flex-1 overflow-y-auto">
            {currentProject && renderFileTree(currentProject.files)}
          </div>

          {/* Status Bar */}
          <div className="p-2 border-t border-gray-200 text-sm text-gray-600">
            {statusMessage || `${selectedFiles.length} file(s) selected`}
          </div>
        </>
      )}

      {/* Check In Dialog */}
      {showCheckInDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">Check In Files</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={checkInOutState.globalComment}
                onChange={(e) => setCheckInOutState(prev => ({ ...prev, globalComment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Enter check-in comment..."
              />
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Files to check in:</h3>
              <div className="space-y-2">
                {selectedFiles.filter(f => !f.isDirectory && f.status === FileStatus.CheckedOut).map(file => (
                  <div key={file.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                    <input type="checkbox" defaultChecked />
                    <span className="flex-1 text-sm">{file.path}</span>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" />
                      Keep checked out
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCheckInDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => checkIn(selectedFiles, checkInOutState.globalComment)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Out Dialog */}
      {showCheckOutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-lg font-medium mb-4">Check Out Files</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={checkInOutState.globalComment}
                onChange={(e) => setCheckInOutState(prev => ({ ...prev, globalComment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Enter check-out comment..."
              />
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Files to check out:</h3>
              <div className="space-y-2">
                {selectedFiles.filter(f => !f.isDirectory && f.status !== FileStatus.CheckedOut).map(file => (
                  <div key={file.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">{file.path}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCheckOutDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => checkOut(selectedFiles, checkInOutState.globalComment)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Dialog */}
      {showHistoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">File History</h2>
            
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Version {entry.version}</span>
                      <span className="text-sm text-gray-600">{entry.date.toLocaleString()}</span>
                      <span className="text-sm text-gray-600">by {entry.user}</span>
                    </div>
                    {entry.label && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {entry.label}
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    <strong>{entry.action}:</strong> {entry.comment || 'No comment'}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="text-xs text-blue-600 hover:underline">Get This Version</button>
                    <button className="text-xs text-blue-600 hover:underline">View</button>
                    <button className="text-xs text-blue-600 hover:underline">Diff</button>
                    <button className="text-xs text-blue-600 hover:underline">Report</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowHistoryDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceSafeIntegration;