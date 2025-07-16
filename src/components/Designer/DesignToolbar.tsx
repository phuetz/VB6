import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Move,
  Square,
  Circle,
  RotateCw,
  Eclipse as Flip,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Scissors,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  Grid,
  Crosshair,
} from 'lucide-react';
import { Control } from '../../context/types';

interface DesignToolbarProps {
  selectedControls: Control[];
  onAlign: (
    type:
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'center-h'
      | 'center-v'
      | 'distribute-h'
      | 'distribute-v'
  ) => void;
  onMakeSameSize: (type: 'width' | 'height' | 'both') => void;
  onMove: (direction: 'up' | 'down' | 'left' | 'right', amount: number) => void;
  onResize: (direction: 'width' | 'height', amount: number) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onToggleVisibility: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
}

export const DesignToolbar: React.FC<DesignToolbarProps> = ({
  selectedControls,
  onAlign,
  onMakeSameSize,
  onMove,
  onResize,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onBringToFront,
  onSendToBack,
  onLock,
  onUnlock,
  onToggleVisibility,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  gridSize,
  onGridSizeChange,
}) => {
  const hasSelection = selectedControls.length > 0;
  const hasMultiSelection = selectedControls.length > 1;
  const allLocked = selectedControls.every(c => c.locked);
  const allVisible = selectedControls.every(c => c.visible);

  return (
    <div className="bg-gray-200 border-b border-gray-400 p-2 flex items-center gap-2 flex-wrap">
      {/* Alignement */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <span className="text-xs text-gray-600">Align:</span>
        <button
          onClick={() => onAlign('left')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => onAlign('center-h')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => onAlign('right')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
        <button
          onClick={() => onAlign('top')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Align Top"
        >
          <AlignJustify size={14} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <button
          onClick={() => onAlign('center-v')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Align Middle"
        >
          <AlignCenter size={14} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <button
          onClick={() => onAlign('bottom')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Align Bottom"
        >
          <AlignJustify size={14} style={{ transform: 'rotate(90deg) scaleY(-1)' }} />
        </button>
      </div>

      {/* Distribution */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <span className="text-xs text-gray-600">Distribute:</span>
        <button
          onClick={() => onAlign('distribute-h')}
          disabled={selectedControls.length < 3}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Distribute Horizontally"
        >
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-gray-600"></div>
            <div className="w-1 h-3 bg-gray-600"></div>
            <div className="w-1 h-3 bg-gray-600"></div>
          </div>
        </button>
        <button
          onClick={() => onAlign('distribute-v')}
          disabled={selectedControls.length < 3}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Distribute Vertically"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-1 bg-gray-600"></div>
            <div className="w-3 h-1 bg-gray-600"></div>
            <div className="w-3 h-1 bg-gray-600"></div>
          </div>
        </button>
      </div>

      {/* Taille */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <span className="text-xs text-gray-600">Size:</span>
        <button
          onClick={() => onMakeSameSize('width')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Same Width"
        >
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 border border-gray-600"></div>
            <div className="w-3 h-4 border border-gray-600"></div>
          </div>
        </button>
        <button
          onClick={() => onMakeSameSize('height')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Same Height"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 border border-gray-600"></div>
            <div className="w-4 h-2 border border-gray-600"></div>
          </div>
        </button>
        <button
          onClick={() => onMakeSameSize('both')}
          disabled={!hasMultiSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Same Size"
        >
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-600"></div>
            <div className="w-3 h-3 border border-gray-600"></div>
          </div>
        </button>
      </div>

      {/* Déplacement */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <span className="text-xs text-gray-600">Move:</span>
        <button
          onClick={() => onMove('up', 1)}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Move Up"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={() => onMove('down', 1)}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Move Down"
        >
          <ArrowDown size={14} />
        </button>
        <button
          onClick={() => onMove('left', 1)}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Move Left"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => onMove('right', 1)}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Move Right"
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Ordre */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <span className="text-xs text-gray-600">Order:</span>
        <button
          onClick={onBringToFront}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Bring to Front"
        >
          <Square size={14} />
        </button>
        <button
          onClick={onSendToBack}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Send to Back"
        >
          <Circle size={14} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <button
          onClick={onCopy}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Copy (Ctrl+C)"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={onCut}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Cut (Ctrl+X)"
        >
          <Scissors size={14} />
        </button>
        <button
          onClick={onPaste}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300"
          title="Paste (Ctrl+V)"
        >
          📋
        </button>
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title="Delete (Del)"
        >
          🗑️
        </button>
      </div>

      {/* État */}
      <div className="flex items-center gap-1 border-r border-gray-400 pr-2">
        <button
          onClick={allLocked ? onUnlock : onLock}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title={allLocked ? 'Unlock' : 'Lock'}
        >
          {allLocked ? <Unlock size={14} /> : <Lock size={14} />}
        </button>
        <button
          onClick={onToggleVisibility}
          disabled={!hasSelection}
          className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
          title={allVisible ? 'Hide' : 'Show'}
        >
          {allVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Grille */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">Grid:</span>
        <button
          onClick={onToggleGrid}
          className={`p-1 border border-gray-400 ${showGrid ? 'bg-blue-200' : 'bg-gray-100'} hover:bg-gray-300`}
          title="Toggle Grid"
        >
          <Grid size={14} />
        </button>
        <button
          onClick={onToggleSnap}
          className={`p-1 border border-gray-400 ${snapToGrid ? 'bg-blue-200' : 'bg-gray-100'} hover:bg-gray-300`}
          title="Snap to Grid"
        >
          <Crosshair size={14} />
        </button>
        <input
          type="number"
          min="4"
          max="32"
          value={gridSize}
          onChange={e => onGridSizeChange(parseInt(e.target.value) || 8)}
          className="w-12 text-xs border border-gray-400 px-1 py-0.5"
          title="Grid Size"
        />
      </div>

      {/* Informations */}
      <div className="ml-auto text-xs text-gray-600">
        {hasSelection && (
          <span>
            {selectedControls.length} selected
            {selectedControls.length === 1 && (
              <span className="ml-2">
                {selectedControls[0].name}: {selectedControls[0].x}, {selectedControls[0].y}(
                {selectedControls[0].width}×{selectedControls[0].height})
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
