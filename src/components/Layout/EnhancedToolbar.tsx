import React from 'react';
import { 
  FileText, Folder, Save, Play, Square, 
  Copy, Clipboard, Grid, Crosshair, Activity, Zap,
  FileCode, ArrowLeftRight
  FileCode, ArrowLeftRight
} from 'lucide-react';
import { useVB6Store } from '../../stores/vb6Store';
import { UndoRedoToolbar } from './UndoRedoToolbar';
import { useUndoRedo } from '../../hooks/useUndoRedo';

export const EnhancedToolbar: React.FC = () => {
  const { 
    executionMode,
    showGrid,
    snapToGrid,
    selectedControls,
    clipboard,
    setExecutionMode,
    toggleWindow,
    copyControls,
    pasteControls,
    setDragState
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

  const handleGridToggle = () => {
    toggleWindow('showGrid');
  };

  const handleSnapToggle = () => {
    setDragState({ 
      isDragging: false,
      snapToGrid: !snapToGrid 
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
          {executionMode === 'run' ? '▶ Running' : 
           executionMode === 'break' ? '⏸ Break' : '■ Design'}
        </span>
        
        <span className="text-gray-400 hidden lg:block">
          💡 Hold Ctrl while dragging to copy
        </span>
        
        <div className="w-px h-6 bg-gray-400 mx-1" />
        
        <button
          onClick={() => {
            // TODO: Open template manager
            console.log('Open template manager');
          }}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="Project Templates"
        >
          <Zap size={16} />
        </button>
        
        <button
          onClick={() => {
            // TODO: Open performance monitor
            console.log('Open performance monitor');
          }}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
          title="Performance Monitor"
        >
          <Activity size={16} />
        </button>
        
        <div className="flex items-center ml-2 gap-2">
          <button
            onClick={() => setShowCodeFormatter(true)}
            className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
            title="Format Code"
          >
            <FileCode size={16} />
          </button>
          <button
            onClick={() => setShowCodeConverter(true)}
            className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 transition-colors"
            title="Code Converter"
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};