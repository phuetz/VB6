import React from 'react';
import {
  FileText,
  Folder,
  Save,
  Play,
  Square,
  Copy,
  CopyPlus,
  Clipboard,
  Grid,
  Crosshair,
  Activity,
  Zap,
  Scissors,
  FileCode as FileCodeIcon,
  ArrowLeftRight,
  Bug,
  ListTodo,
} from 'lucide-react';
import { useVB6Store } from '../../stores/vb6Store';
import { UndoRedoToolbar } from './UndoRedoToolbar';
import { useUndoRedo } from '../../hooks/useUndoRedo';

export const EnhancedToolbar: React.FC = () => {
  const {
    executionMode,
    showGrid,
    showSnippetManager,
    snapToGrid,
    showLogPanel,
    showTodoList,
    selectedControls,
    clipboard,
    showCodeFormatter,
    showCodeConverter,
    designerZoom,
    setDesignerZoom,
    setExecutionMode,
    toggleWindow,
    copyControls,
    pasteControls,
    duplicateControls,
    setDragState,
    showDialog,
  } = useVB6Store();

  const { saveState } = useUndoRedo();

  const handleExecutionToggle = () => {
    const newMode = executionMode === 'run' ? 'design' : 'run';
    saveState(`Switch to ${newMode} mode`);
    setExecutionMode(newMode);
  };

  const handleCopy = () => {
    if (selectedControls.length > 0) {
      copyControls();
      saveState(`Copy ${selectedControls.length} control(s)`);
    }
  };

  const handlePaste = () => {
    if (clipboard.length > 0) {
      pasteControls();
      saveState(`Paste ${clipboard.length} control(s)`);
    }
  };

  const handleDuplicate = () => {
    if (selectedControls.length > 0) {
      duplicateControls();
      saveState(`Duplicate ${selectedControls.length} control(s)`);
    }
  };

  const handleGridToggle = () => {
    toggleWindow('showGrid');
  };

  const handleSnapToggle = () => {
    setDragState({
      isDragging: false,
      snapToGrid: !snapToGrid,
    });
  };

  return (
    <div className="h-10 bg-gray-200 border-b border-gray-400 flex items-center px-2 gap-1">
      {/* File operations */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2 mr-2">
        <button
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="New Project"
        >
          <FileText size={16} />
        </button>

        <button
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="Open Project"
        >
          <Folder size={16} />
        </button>

        <button
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="Save Project"
        >
          <Save size={16} />
        </button>
      </div>

      {/* Undo/Redo */}
      <UndoRedoToolbar />

      {/* Edit operations */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2 mr-2">
        <button
          onClick={handleCopy}
          disabled={selectedControls.length === 0}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Copy (Ctrl+C)"
        >
          <Copy size={16} />
        </button>

        <button
          onClick={handleDuplicate}
          disabled={selectedControls.length === 0}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Duplicate (Ctrl+D)"
        >
          <CopyPlus size={16} />
        </button>

        <button
          onClick={handlePaste}
          disabled={clipboard.length === 0}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Paste (Ctrl+V)"
        >
          <Clipboard size={16} />
        </button>
      </div>

      {/* Execution */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2 mr-2">
        <button
          onClick={handleExecutionToggle}
          className={`p-1 border border-gray-400 transition-all ${
            executionMode === 'run'
              ? 'bg-green-200 text-green-800 hover:bg-green-300'
              : 'bg-gray-100 hover:bg-gray-300'
          }`}
          title={executionMode === 'run' ? 'Stop (Esc)' : 'Run (F5)'}
        >
          {executionMode === 'run' ? <Square size={16} /> : <Play size={16} />}
        </button>
      </div>

      {/* Grid and snap options */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2 mr-2">
        <button
          onClick={handleGridToggle}
          className={`p-1 border border-gray-400 transition-all ${
            showGrid
              ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
              : 'bg-gray-100 hover:bg-gray-300'
          }`}
          title="Toggle Grid"
        >
          <Grid size={16} />
        </button>

        <button
          onClick={handleSnapToggle}
          className={`p-1 border border-gray-400 transition-all ${
            snapToGrid
              ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
              : 'bg-gray-100 hover:bg-gray-300'
          }`}
          title="Snap to Grid"
        >
          <Crosshair size={16} />
        </button>
        <select
          value={designerZoom}
          onChange={e => setDesignerZoom(parseInt(e.target.value))}
          className="border border-gray-400 text-xs px-1 py-0.5"
          title="Zoom"
        >
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
        </select>
      </div>

      {/* Status and tips */}
      <div className="ml-auto flex items-center gap-4 text-xs text-gray-600">
        {selectedControls.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            {selectedControls.length} selected
          </span>
        )}

        <span className="text-gray-500">
          {executionMode === 'run'
            ? '▶ Running'
            : executionMode === 'break'
              ? '⏸ Break'
              : '■ Design'}
        </span>

        <span className="text-gray-400 hidden lg:block">💡 Hold Ctrl while dragging to copy</span>

        <div className="w-px h-6 bg-gray-400 mx-1" />

        <button
          onClick={() => showDialog('showTemplateManager', true)}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="Project Templates"
        >
          <Zap size={16} />
        </button>

        <button
          onClick={() => toggleWindow('showPerformanceMonitor')}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="Performance Monitor"
        >
          <Activity size={16} />
        </button>

        <div className="flex items-center ml-2 gap-2">
          <button
            onClick={() => showDialog('showCodeFormatter', true)}
            className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors relative group"
            title="Format Code"
          >
            <FileCodeIcon size={16} className="text-blue-600" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity mb-1">
              Format Code
            </div>
          </button>
          <button
            onClick={() => showDialog('showCodeConverter', true)}
            className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors relative group"
            title="Code Converter"
          >
            <ArrowLeftRight size={16} className="text-blue-600" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity mb-1">
              Convert Code
            </div>
          </button>
          <button
            onClick={() => showDialog('showSnippetManager', true)}
            className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors relative group"
            title="Snippets"
          >
            <Scissors size={16} className="text-blue-600" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity mb-1">
              Code Snippets
            </div>
          </button>
          <button
            onClick={() => toggleWindow('showTodoList')}
            className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors relative group"
            title="Todo List"
          >
            <ListTodo size={16} className={showTodoList ? 'text-green-600' : 'text-gray-600'} />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity mb-1">
              Todo List
            </div>
          </button>
        </div>
        <button
          onClick={() => toggleWindow('showLogPanel')}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors relative group"
          title="Debug Logs"
        >
          <Bug size={16} className={showLogPanel ? 'text-green-600' : 'text-gray-600'} />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity mb-1">
            Debug Logs
          </div>
        </button>
      </div>
    </div>
  );
};
