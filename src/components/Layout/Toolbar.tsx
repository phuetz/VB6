import React from 'react';
import { 
  FileText, Folder, Save, Play, Square, AlignLeft, 
  AlignCenter, AlignRight, Undo, Redo, Copy, Clipboard 
} from 'lucide-react';
import { useVB6 } from '../../context/VB6Context';

const Toolbar: React.FC = () => {
  const { state, dispatch, saveProject, loadProject, copyControls, pasteControls, undo, redo } = useVB6();

  const handleExecutionToggle = () => {
    const newMode = state.executionMode === 'run' ? 'design' : 'run';
    dispatch({ type: 'SET_EXECUTION_MODE', payload: { mode: newMode } });
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vb6,.vb6z,.vbp,.json,.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        loadProject(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-8 bg-gray-200 border-b border-gray-400 flex items-center px-2 gap-1">
      <button 
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300" 
        title="New Project"
        onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showNewProjectDialog', show: true } })}
      >
        <FileText size={16} />
      </button>
      
      <button 
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300" 
        title="Open Project"
        onClick={handleLoadProject}
      >
        <Folder size={16} />
      </button>
      
      <button 
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300" 
        title="Save Project"
        onClick={saveProject}
      >
        <Save size={16} />
      </button>
      
      <div className="w-px h-6 bg-gray-400 mx-1" />
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        onClick={undo}
        disabled={state.historyIndex <= 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
      </button>
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        onClick={redo}
        disabled={state.historyIndex >= state.history.length - 1}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
      </button>
      
      <div className="w-px h-6 bg-gray-400 mx-1" />
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300"
        onClick={copyControls}
        disabled={state.selectedControls.length === 0}
        title="Copy (Ctrl+C)"
      >
        <Copy size={16} />
      </button>
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300"
        onClick={pasteControls}
        disabled={state.clipboard.length === 0}
        title="Paste (Ctrl+V)"
      >
        <Clipboard size={16} />
      </button>
      
      <div className="w-px h-6 bg-gray-400 mx-1" />
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        disabled={state.selectedControls.length < 2}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </button>
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        disabled={state.selectedControls.length < 2}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </button>
      
      <button
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        disabled={state.selectedControls.length < 2}
        title="Align Right"
      >
        <AlignRight size={16} />
      </button>
      
      <div className="w-px h-6 bg-gray-400 mx-1" />
      
      <button
        className={`p-1 border border-gray-400 ${state.executionMode === 'run' ? 'bg-green-200' : 'bg-gray-100'} hover:bg-gray-300`}
        onClick={handleExecutionToggle}
        title={state.executionMode === 'run' ? 'Stop (Esc)' : 'Run (F5)'}
      >
        {state.executionMode === 'run' ? <Square size={16} /> : <Play size={16} />}
      </button>
      
      <div className="w-px h-6 bg-gray-400 mx-1" />
      
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={state.snapToGrid}
          onChange={(e) => dispatch({ 
            type: 'SET_DRAG_STATE', 
            payload: { 
              isDragging: state.isDragging,
              controlType: state.draggedControlType,
              position: state.dragPosition
            }
          })}
        />
        <span className="text-xs">Snap</span>
      </label>
      
      <label className="flex items-center gap-1 ml-2">
        <input
          type="checkbox"
          checked={state.showAlignmentGuides}
          onChange={(e) => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showAlignmentGuides' } })}
        />
        <span className="text-xs">Guides</span>
      </label>
      
      <span className="ml-auto text-xs text-gray-600">
        {state.executionMode === 'run' ? '▶ Running' : 
         state.selectedControls.length > 0 ? `${state.selectedControls.length} selected` : 'Ready'}
      </span>
    </div>
  );
};

export default Toolbar;