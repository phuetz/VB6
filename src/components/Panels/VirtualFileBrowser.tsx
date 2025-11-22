/**
 * Virtual File Browser
 *
 * UI component for browsing and managing the virtual file system.
 * Provides directory navigation, file viewing, editing, and attribute management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { persistentVFS, VB6FileAttribute, PersistentVFSEntry } from '../../runtime/VB6PersistentFileSystem';
import './VirtualFileBrowser.css';

interface FileBrowserState {
  currentPath: string;
  entries: PersistentVFSEntry[];
  selectedFile: PersistentVFSEntry | null;
  loading: boolean;
  searchFilter: string;
  viewMode: 'list' | 'details';
  error: string | null;
}

const VirtualFileBrowser: React.FC = () => {
  const [state, setState] = useState<FileBrowserState>({
    currentPath: '/',
    entries: [],
    selectedFile: null,
    loading: false,
    searchFilter: '',
    viewMode: 'details',
    error: null
  });

  const [stats, setStats] = useState({
    filesCount: 0,
    directoriesCount: 0,
    totalSize: 0
  });

  const [editingFile, setEditingFile] = useState<{
    entry: PersistentVFSEntry;
    content: string;
  } | null>(null);

  /**
   * Load directory contents
   */
  const loadDirectory = useCallback(async (path: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const entries = await persistentVFS.listDirectory(path);
      const stats = await persistentVFS.getStats();

      setState(prev => ({
        ...prev,
        currentPath: path,
        entries: entries.sort((a, b) => {
          // Directories first
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          // Then by name
          return a.name.localeCompare(b.name);
        }),
        loading: false,
        selectedFile: null
      }));

      setStats(stats);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load directory',
        loading: false
      }));
    }
  }, []);

  /**
   * Navigate to directory
   */
  const navigateTo = useCallback(async (entry: PersistentVFSEntry) => {
    if (entry.type === 'directory') {
      await loadDirectory(entry.path);
    }
  }, [loadDirectory]);

  /**
   * Go back to parent directory
   */
  const goToParent = useCallback(async () => {
    const currentPath = state.currentPath;
    if (currentPath !== '/') {
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
      await loadDirectory(parentPath);
    }
  }, [state.currentPath, loadDirectory]);

  /**
   * Handle path navigation from breadcrumb
   */
  const navigatePath = useCallback(async (path: string) => {
    await loadDirectory(path);
  }, [loadDirectory]);

  /**
   * Delete file or directory
   */
  const deleteEntry = useCallback(async (entry: PersistentVFSEntry) => {
    if (!confirm(`Delete ${entry.type === 'file' ? 'file' : 'directory'} "${entry.name}"?`)) {
      return;
    }

    try {
      const result = await persistentVFS.deleteEntry(entry.path);
      if (result) {
        await loadDirectory(state.currentPath);
        setState(prev => ({ ...prev, selectedFile: null }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete'
      }));
    }
  }, [state.currentPath, loadDirectory]);

  /**
   * Create new directory
   */
  const createDirectory = useCallback(async () => {
    const dirName = prompt('Enter directory name:');
    if (!dirName) return;

    try {
      const newPath = state.currentPath === '/'
        ? `/${dirName}`
        : `${state.currentPath}/${dirName}`;
      await persistentVFS.createDirectory(newPath);
      await loadDirectory(state.currentPath);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create directory'
      }));
    }
  }, [state.currentPath, loadDirectory]);

  /**
   * Create new file
   */
  const createFile = useCallback(async () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      const newPath = state.currentPath === '/'
        ? `/${fileName}`
        : `${state.currentPath}/${fileName}`;
      await persistentVFS.createFile(newPath, '');
      await loadDirectory(state.currentPath);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create file'
      }));
    }
  }, [state.currentPath, loadDirectory]);

  /**
   * Rename file or directory
   */
  const renameEntry = useCallback(async (entry: PersistentVFSEntry) => {
    const newName = prompt('Enter new name:', entry.name);
    if (!newName || newName === entry.name) return;

    try {
      const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/')) || '/';
      const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

      if (entry.type === 'file') {
        const content = (entry.content as string) || '';
        await persistentVFS.createFile(newPath, content);
      } else {
        await persistentVFS.createDirectory(newPath);
      }

      await persistentVFS.deleteEntry(entry.path);
      await loadDirectory(state.currentPath);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to rename'
      }));
    }
  }, [state.currentPath, loadDirectory]);

  /**
   * Edit file content
   */
  const editFileContent = useCallback(async () => {
    if (!editingFile) return;

    try {
      const entry = editingFile.entry;
      const newPath = entry.path;

      // Delete old file
      await persistentVFS.deleteEntry(entry.path);

      // Create new file with updated content
      await persistentVFS.createFile(newPath, editingFile.content);

      setEditingFile(null);
      await loadDirectory(state.currentPath);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save file'
      }));
    }
  }, [editingFile, state.currentPath, loadDirectory]);

  /**
   * Toggle file attribute
   */
  const toggleAttribute = useCallback(async (entry: PersistentVFSEntry, attribute: number) => {
    try {
      const newAttributes = entry.attributes ^ attribute;
      await persistentVFS.setAttributes(entry.path, newAttributes);

      // Update local state
      entry.attributes = newAttributes;
      setState(prev => ({ ...prev, selectedFile: { ...entry } }));

      await loadDirectory(state.currentPath);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update attributes'
      }));
    }
  }, [state.currentPath, loadDirectory]);

  /**
   * Format file size for display
   */
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  /**
   * Format date for display
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Get attribute display string
   */
  const getAttributeString = (attributes: number): string => {
    const attrs = [];
    if (attributes & VB6FileAttribute.vbReadOnly) attrs.push('R');
    if (attributes & VB6FileAttribute.vbHidden) attrs.push('H');
    if (attributes & VB6FileAttribute.vbSystem) attrs.push('S');
    if (attributes & VB6FileAttribute.vbArchive) attrs.push('A');
    return attrs.length > 0 ? attrs.join('') : '-';
  };

  /**
   * Filter entries by search
   */
  const filteredEntries = state.entries.filter(entry =>
    entry.name.toLowerCase().includes(state.searchFilter.toLowerCase())
  );

  // Load root directory on mount
  useEffect(() => {
    loadDirectory('/');
  }, [loadDirectory]);

  return (
    <div className="virtual-file-browser">
      <div className="vfb-toolbar">
        <button
          className="vfb-btn vfb-btn-primary"
          onClick={goToParent}
          disabled={state.currentPath === '/'}
          title="Go to parent directory"
        >
          Up
        </button>

        <button
          className="vfb-btn vfb-btn-success"
          onClick={createDirectory}
          title="Create new directory"
        >
          New Folder
        </button>

        <button
          className="vfb-btn vfb-btn-success"
          onClick={createFile}
          title="Create new file"
        >
          New File
        </button>

        <div className="vfb-search">
          <input
            type="text"
            placeholder="Search..."
            value={state.searchFilter}
            onChange={(e) => setState(prev => ({ ...prev, searchFilter: e.target.value }))}
          />
        </div>

        <select
          value={state.viewMode}
          onChange={(e) => setState(prev => ({ ...prev, viewMode: e.target.value as 'list' | 'details' }))}
          className="vfb-view-select"
        >
          <option value="list">List View</option>
          <option value="details">Details</option>
        </select>
      </div>

      <div className="vfb-path-bar">
        <span className="vfb-path-label">Path:</span>
        <div className="vfb-breadcrumb">
          <span
            className="vfb-breadcrumb-item"
            onClick={() => navigatePath('/')}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            /
          </span>

          {state.currentPath !== '/' && (
            <>
              {state.currentPath.split('/').filter(p => p).map((part, index, arr) => {
                const path = '/' + arr.slice(0, index + 1).join('/');
                return (
                  <span key={path}>
                    <span className="vfb-breadcrumb-separator">/</span>
                    <span
                      className="vfb-breadcrumb-item"
                      onClick={() => navigatePath(path)}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {part}
                    </span>
                  </span>
                );
              })}
            </>
          )}
        </div>
      </div>

      {state.error && (
        <div className="vfb-error">
          <button
            className="vfb-error-close"
            onClick={() => setState(prev => ({ ...prev, error: null }))}
          >
            ×
          </button>
          {state.error}
        </div>
      )}

      {state.loading ? (
        <div className="vfb-loading">Loading...</div>
      ) : (
        <>
          <div className="vfb-file-list">
            {state.viewMode === 'details' ? (
              <table className="vfb-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Attributes</th>
                    <th>Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => (
                    <tr
                      key={entry.id}
                      className={`vfb-row ${state.selectedFile?.id === entry.id ? 'selected' : ''}`}
                      onClick={() => setState(prev => ({ ...prev, selectedFile: entry }))}
                      onDoubleClick={() => navigateTo(entry)}
                    >
                      <td className="vfb-name">
                        <span className={`vfb-icon ${entry.type === 'file' ? 'file' : 'folder'}`}>
                          {entry.type === 'directory' ? '📁' : '📄'}
                        </span>
                        {entry.name}
                      </td>
                      <td>{entry.type === 'file' ? 'File' : 'Folder'}</td>
                      <td className="vfb-size">{formatSize(entry.size)}</td>
                      <td className="vfb-attrs">{getAttributeString(entry.attributes)}</td>
                      <td className="vfb-date">{formatDate(entry.modified)}</td>
                      <td className="vfb-actions">
                        <button
                          className="vfb-btn vfb-btn-sm vfb-btn-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            renameEntry(entry);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="vfb-btn vfb-btn-sm vfb-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEntry(entry);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="vfb-list-view">
                {filteredEntries.map(entry => (
                  <div
                    key={entry.id}
                    className={`vfb-list-item ${state.selectedFile?.id === entry.id ? 'selected' : ''}`}
                    onClick={() => setState(prev => ({ ...prev, selectedFile: entry }))}
                    onDoubleClick={() => navigateTo(entry)}
                  >
                    <span className={`vfb-icon ${entry.type === 'file' ? 'file' : 'folder'}`}>
                      {entry.type === 'directory' ? '📁' : '📄'}
                    </span>
                    <span className="vfb-list-name">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {state.selectedFile && (
            <div className="vfb-details-panel">
              <h3>File Properties</h3>
              <div className="vfb-details">
                <label>
                  <strong>Name:</strong>
                  <span>{state.selectedFile.name}</span>
                </label>

                <label>
                  <strong>Type:</strong>
                  <span>{state.selectedFile.type === 'file' ? 'File' : 'Directory'}</span>
                </label>

                <label>
                  <strong>Size:</strong>
                  <span>{formatSize(state.selectedFile.size)}</span>
                </label>

                <label>
                  <strong>Created:</strong>
                  <span>{formatDate(state.selectedFile.created)}</span>
                </label>

                <label>
                  <strong>Modified:</strong>
                  <span>{formatDate(state.selectedFile.modified)}</span>
                </label>

                <div className="vfb-attributes">
                  <strong>Attributes:</strong>
                  <div className="vfb-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={(state.selectedFile.attributes & VB6FileAttribute.vbReadOnly) !== 0}
                        onChange={() => toggleAttribute(state.selectedFile!, VB6FileAttribute.vbReadOnly)}
                      />
                      Read-Only
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={(state.selectedFile.attributes & VB6FileAttribute.vbHidden) !== 0}
                        onChange={() => toggleAttribute(state.selectedFile!, VB6FileAttribute.vbHidden)}
                      />
                      Hidden
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={(state.selectedFile.attributes & VB6FileAttribute.vbSystem) !== 0}
                        onChange={() => toggleAttribute(state.selectedFile!, VB6FileAttribute.vbSystem)}
                      />
                      System
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={(state.selectedFile.attributes & VB6FileAttribute.vbArchive) !== 0}
                        onChange={() => toggleAttribute(state.selectedFile!, VB6FileAttribute.vbArchive)}
                      />
                      Archive
                    </label>
                  </div>
                </div>

                {state.selectedFile.type === 'file' && (
                  <button
                    className="vfb-btn vfb-btn-primary"
                    onClick={() => setEditingFile({ entry: state.selectedFile!, content: (state.selectedFile!.content as string) || '' })}
                  >
                    Edit Content
                  </button>
                )}
              </div>
            </div>
          )}

          {editingFile && (
            <div className="vfb-editor-modal">
              <div className="vfb-editor-content">
                <h3>Edit: {editingFile.entry.name}</h3>
                <textarea
                  value={editingFile.content}
                  onChange={(e) => setEditingFile(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="vfb-editor-textarea"
                />
                <div className="vfb-editor-actions">
                  <button
                    className="vfb-btn vfb-btn-success"
                    onClick={editFileContent}
                  >
                    Save
                  </button>
                  <button
                    className="vfb-btn vfb-btn-secondary"
                    onClick={() => setEditingFile(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="vfb-status-bar">
            <span>{filteredEntries.length} items</span>
            <span>{stats.filesCount} files, {stats.directoriesCount} folders</span>
            <span>Total: {formatSize(stats.totalSize)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default VirtualFileBrowser;
