import React, { useState } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Play,
  Square,
  Pause,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  Grid3X3,
  Eye,
  EyeOff,
  Settings,
  Download,
  Upload,
  Code,
  Bug,
  Zap,
  Package,
  Home,
  ChevronDown,
  Search,
  Moon,
  Sun,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  RotateCw,
  Move,
  MousePointer,
} from 'lucide-react';
import { useVB6 } from '../../context/VB6Context';
import { useVB6Store } from '../../stores/vb6Store';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  tooltip,
  onClick,
  disabled = false,
  active = false,
  variant = 'default',
  size = 'md',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getVariantClasses = () => {
    const base = 'relative group transition-all duration-200 rounded-lg border';
    const sizeClasses = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
    };

    const variants = {
      default: `${active ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}`,
      primary: 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:shadow-lg',
      success: 'bg-green-500 border-green-600 text-white hover:bg-green-600 hover:shadow-lg',
      danger: 'bg-red-500 border-red-600 text-white hover:bg-red-600 hover:shadow-lg',
    };

    return `${base} ${sizeClasses[size]} ${variants[variant]}`;
  };

  return (
    <div className="relative">
      <button
        className={getVariantClasses()}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
        {active && (
          <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-blue-600 rounded-full" />
        )}
      </button>

      {/* Modern Tooltip */}
      {showTooltip && !disabled && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 animate-fadeIn">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolbarDivider: React.FC = () => (
  <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-1" />
);

const ModernToolbar: React.FC = () => {
  const { state, dispatch, saveProject, loadProject, copyControls, pasteControls, undo, redo } =
    useVB6();
  const {
    executionMode,
    showGrid,
    snapToGrid,
    selectedControls,
    setExecutionMode,
    toggleGrid,
    toggleSnapToGrid,
    deleteControls,
    duplicateControls,
    alignControls,
    distributeControls,
    bringToFront,
    sendToBack,
    lockControls,
    unlockControls,
    groupControls,
    ungroupControls,
  } = useVB6Store();

  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleExecutionToggle = () => {
    setExecutionMode(executionMode === 'run' ? 'design' : 'run');
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vb6,.vb6z,.vbp,.json,.zip';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        loadProject(file);
      }
    };
    input.click();
  };

  const hasSelection = selectedControls.length > 0;
  const hasMultipleSelection = selectedControls.length > 1;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Main Toolbar */}
      <div className="flex items-center px-4 py-2 gap-2">
        {/* Logo/Home */}
        <button className="flex items-center gap-2 pr-4 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Code size={18} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800">VB6 Studio</span>
        </button>

        <ToolbarDivider />

        {/* File Operations */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<FileText size={18} />}
            tooltip="New Project (Ctrl+N)"
            onClick={() =>
              dispatch({
                type: 'SHOW_DIALOG',
                payload: { dialogName: 'showNewProjectDialog', show: true },
              })
            }
          />
          <ToolbarButton
            icon={<FolderOpen size={18} />}
            tooltip="Open Project (Ctrl+O)"
            onClick={handleLoadProject}
          />
          <ToolbarButton
            icon={<Save size={18} />}
            tooltip="Save Project (Ctrl+S)"
            onClick={saveProject}
          />
          <ToolbarButton
            icon={<Download size={18} />}
            tooltip="Export Project"
            onClick={() =>
              dispatch({
                type: 'SHOW_DIALOG',
                payload: { dialogName: 'showExportDialog', show: true },
              })
            }
          />
        </div>

        <ToolbarDivider />

        {/* Edit Operations */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Undo size={18} />}
            tooltip="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={state.historyIndex <= 0}
          />
          <ToolbarButton
            icon={<Redo size={18} />}
            tooltip="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={state.historyIndex >= state.history.length - 1}
          />
          <ToolbarButton
            icon={<Scissors size={18} />}
            tooltip="Cut (Ctrl+X)"
            onClick={() => {
              copyControls();
              deleteControls();
            }}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<Copy size={18} />}
            tooltip="Copy (Ctrl+C)"
            onClick={copyControls}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<Clipboard size={18} />}
            tooltip="Paste (Ctrl+V)"
            onClick={pasteControls}
            disabled={state.clipboard.length === 0}
          />
          <ToolbarButton
            icon={<Trash2 size={18} />}
            tooltip="Delete (Del)"
            onClick={deleteControls}
            disabled={!hasSelection}
            variant="danger"
          />
        </div>

        <ToolbarDivider />

        {/* Alignment Tools */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<AlignLeft size={18} />}
            tooltip="Align Left"
            onClick={() => alignControls('left')}
            disabled={!hasMultipleSelection}
          />
          <ToolbarButton
            icon={<AlignCenter size={18} />}
            tooltip="Align Center"
            onClick={() => alignControls('center')}
            disabled={!hasMultipleSelection}
          />
          <ToolbarButton
            icon={<AlignRight size={18} />}
            tooltip="Align Right"
            onClick={() => alignControls('right')}
            disabled={!hasMultipleSelection}
          />
          <ToolbarButton
            icon={<AlignJustify size={18} />}
            tooltip="Distribute Evenly"
            onClick={() => distributeControls('horizontal')}
            disabled={!hasMultipleSelection}
          />
        </div>

        <ToolbarDivider />

        {/* View Options */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Grid3X3 size={18} />}
            tooltip="Toggle Grid"
            onClick={toggleGrid}
            active={showGrid}
          />
          <ToolbarButton
            icon={<Move size={18} />}
            tooltip="Snap to Grid"
            onClick={toggleSnapToGrid}
            active={snapToGrid}
          />
          <ToolbarButton
            icon={<Layers size={18} />}
            tooltip="Layer Management"
            onClick={() => {
              if (hasSelection) {
                const dropdown = document.createElement('div');
                dropdown.className = 'absolute bg-white border rounded-lg shadow-lg p-2 z-50';
                dropdown.innerHTML = `
                  <button class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">Bring to Front</button>
                  <button class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">Send to Back</button>
                `;
                document.body.appendChild(dropdown);
              }
            }}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={selectedControls.some(c => c.locked) ? <Unlock size={18} /> : <Lock size={18} />}
            tooltip={selectedControls.some(c => c.locked) ? 'Unlock Controls' : 'Lock Controls'}
            onClick={() => {
              if (selectedControls.some(c => c.locked)) {
                unlockControls();
              } else {
                lockControls();
              }
            }}
            disabled={!hasSelection}
          />
        </div>

        <ToolbarDivider />

        {/* Execution Controls */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={executionMode === 'run' ? <Square size={18} /> : <Play size={18} />}
            tooltip={executionMode === 'run' ? 'Stop (Esc)' : 'Run (F5)'}
            onClick={handleExecutionToggle}
            variant={executionMode === 'run' ? 'danger' : 'success'}
          />
          <ToolbarButton
            icon={<Pause size={18} />}
            tooltip="Pause"
            onClick={() => {}}
            disabled={executionMode !== 'run'}
          />
          <ToolbarButton
            icon={<Bug size={18} />}
            tooltip="Debug Mode"
            onClick={() =>
              dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showDebugWindow' } })
            }
            active={state.showDebugWindow}
          />
        </div>

        <ToolbarDivider />

        {/* Right Side Tools */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-auto'}`}>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={18} />
            </button>
            {searchOpen && (
              <input
                className="absolute right-0 top-0 w-64 h-full pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 animate-slideIn"
                placeholder="Search controls, properties..."
                autoFocus
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              />
            )}
          </div>

          {/* Theme Toggle */}
          <ToolbarButton
            icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
            tooltip={darkMode ? 'Light Mode' : 'Dark Mode'}
            onClick={() => setDarkMode(!darkMode)}
          />

          {/* Settings */}
          <ToolbarButton
            icon={<Settings size={18} />}
            tooltip="Settings"
            onClick={() =>
              dispatch({
                type: 'SHOW_DIALOG',
                payload: { dialogName: 'showSettingsDialog', show: true },
              })
            }
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-1 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            {executionMode === 'run' ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 font-medium">Running</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>Design Mode</span>
              </>
            )}
          </span>
          {hasSelection && (
            <span className="text-blue-600">
              {selectedControls.length} {selectedControls.length === 1 ? 'control' : 'controls'}{' '}
              selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Ready</span>
          <span>Ln 1, Col 1</span>
          <span>INS</span>
        </div>
      </div>
    </div>
  );
};

export default ModernToolbar;
