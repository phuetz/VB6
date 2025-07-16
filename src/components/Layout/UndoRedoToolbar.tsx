import React from 'react';
import { Undo, Redo, History } from 'lucide-react';
import { useUndoRedo } from '../../hooks/useUndoRedo';

export const UndoRedoToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, getLastAction, historyLength, clearHistory } =
    useUndoRedo();

  const handleUndo = () => {
    if (undo()) {
      // Visual feedback
      const button = document.querySelector('[data-undo-button]');
      button?.classList.add('animate-pulse');
      setTimeout(() => button?.classList.remove('animate-pulse'), 200);
    }
  };

  const handleRedo = () => {
    if (redo()) {
      // Visual feedback
      const button = document.querySelector('[data-redo-button]');
      button?.classList.add('animate-pulse');
      setTimeout(() => button?.classList.remove('animate-pulse'), 200);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all undo history? This action cannot be undone.')) {
      clearHistory();
    }
  };

  return (
    <div className="flex items-center gap-1 border-r border-gray-400 pr-2 mr-2">
      <button
        data-undo-button
        onClick={handleUndo}
        disabled={!canUndo}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title={`Undo${canUndo ? ` (${getLastAction()})` : ''} - Ctrl+Z`}
      >
        <Undo size={16} />
      </button>

      <button
        data-redo-button
        onClick={handleRedo}
        disabled={!canRedo}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title="Redo - Ctrl+Y"
      >
        <Redo size={16} />
      </button>

      <div className="relative group">
        <button
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 text-xs"
          title="History"
        >
          <History size={16} />
        </button>

        {/* History dropdown */}
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-400 shadow-lg hidden group-hover:block z-50 min-w-48">
          <div className="p-2 border-b border-gray-300 text-xs font-bold">
            History ({historyLength} actions)
          </div>
          <div className="max-h-48 overflow-y-auto">
            {historyLength > 0 ? (
              <div className="p-2">
                <div className="text-xs text-gray-600 mb-2">
                  Last action: {getLastAction() || 'None'}
                </div>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded w-full text-left"
                >
                  Clear History
                </button>
              </div>
            ) : (
              <div className="p-2 text-xs text-gray-500">No history</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
