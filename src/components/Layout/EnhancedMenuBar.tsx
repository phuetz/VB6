import React, { useState } from 'react';
// ULTRA-OPTIMIZED: Import domain-specific stores
import { useUIStore } from '../../stores/UIStore';
import { useWindowStore } from '../../stores/windowStore';
import { shallow } from 'zustand/shallow';
import {
  FileText,
  FolderOpen,
  Save,
  Nut as Cut,
  Copy,
  Clipboard,
  Undo,
  Redo,
  Search,
  Play,
  Square,
  Settings,
  HelpCircle,
  Eye,
  Code,
  Package,
  Database,
  AlertOctagon,
  Sparkles as WandSparkles,
  ActivitySquare,
  BarChart,
  AlertCircle,
  Command,
  Download,
  Upload,
  Scissors,
  FileCode,
  ArrowLeftRight,
  Bug,
  GitFork,
  TestTube,
  FileCheck,
  FileText as FileBarChart,
  Zap,
  Activity,
} from 'lucide-react';

interface EnhancedMenuBarProps {
  onShowProjectTemplates?: () => void;
  onImportForm?: () => void;
  onExportForm?: () => void;
  onShowDatabaseManager?: () => void;
  onShowReportDesigner?: () => void;
  onShowDebugPanel?: () => void;
  onShowHotReloadDashboard?: () => void;
}

const EnhancedMenuBar: React.FC<EnhancedMenuBarProps> = ({
  onShowProjectTemplates,
  onImportForm,
  onExportForm,
  onShowDatabaseManager,
  onShowReportDesigner,
  onShowDebugPanel,
  onShowHotReloadDashboard,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // ULTRA-OPTIMIZED: Use UIStore for execution mode only
  const { executionMode, setExecutionMode } = useUIStore(
    state => ({
      executionMode: state.executionMode,
      setExecutionMode: state.setExecutionMode,
    }),
    shallow
  );

  // Use windowStore for all window/panel visibility state and methods
  const {
    showCodeEditor,
    showProjectExplorer,
    showPropertiesWindow,
    showControlTree,
    showToolbox,
    showGitPanel,
    showMemoryProfiler,
    showTestRunner,
    toggleWindow,
    showDialog,
  } = useWindowStore(
    state => ({
      showCodeEditor: state.showCodeEditor,
      showProjectExplorer: state.showProjectExplorer,
      showPropertiesWindow: state.showPropertiesWindow,
      showControlTree: state.showControlTree,
      showToolbox: state.showToolbox,
      showGitPanel: state.showGitPanel,
      showMemoryProfiler: state.showMemoryProfiler,
      showTestRunner: state.showTestRunner,
      toggleWindow: state.toggleWindow,
      showDialog: state.showDialog,
    }),
    shallow
  );

  const setShowErrorList = () => {};
  const setShowCommandPalette = () => {};
  const setShowExportDialog = () => {};
  const setShowSnippetManager = () => {};
  const setShowCodeFormatter = () => {};
  const setShowCodeConverter = () => {};
  const setShowTestDebugger = () => {};

  const handleMenuHover = (menuName: string) => {
    if (activeMenu) {
      setActiveMenu(menuName);
    }
  };

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuClose = () => {
    setActiveMenu(null);
  };

  const menuItems = {
    File: [
      {
        label: 'New Project...',
        icon: <FileText size={14} />,
        shortcut: 'Ctrl+N',
        action: () => showDialog('showNewProjectDialog', true),
      },
      {
        label: 'New from Template...',
        icon: <Package size={14} />,
        shortcut: 'Ctrl+Shift+N',
        action: () => onShowProjectTemplates?.(),
      },
      {
        label: 'Open Project...',
        icon: <FolderOpen size={14} />,
        shortcut: 'Ctrl+O',
        action: () => {},
      },
      {
        label: 'Import VB6 Form...',
        icon: <Upload size={14} />,
        action: () => onImportForm?.(),
      },
      {
        label: 'Export VB6 Form...',
        icon: <Download size={14} />,
        action: () => onExportForm?.(),
      },
      { separator: true },
      {
        label: 'Save Project',
        icon: <Save size={14} />,
        shortcut: 'Ctrl+S',
        action: () => {},
      },
      {
        label: 'Save Project As...',
        action: () => {},
      },
      {
        label: 'Export...',
        icon: <Download size={14} />,
        action: () => setShowExportDialog(true),
      },
      { separator: true },
      {
        label: 'Print...',
        shortcut: 'Ctrl+P',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Make Project1.exe...',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Recent Projects',
        submenu: [
          { label: 'Calculator.vbp', action: () => {} },
          { label: 'TextEditor.vbp', action: () => {} },
          { label: 'GameEngine.vbp', action: () => {} },
        ],
      },
      { separator: true },
      { label: 'Exit', action: () => window.close() },
      { separator: true },
      {
        label: 'Command Palette...',
        icon: <Command size={14} />,
        shortcut: 'Ctrl+Shift+P',
        action: () => setShowCommandPalette(true),
      },
    ],
    Edit: [
      {
        label: 'Undo',
        icon: <Undo size={14} />,
        shortcut: 'Ctrl+Z',
        action: () => {},
      },
      {
        label: 'Redo',
        icon: <Redo size={14} />,
        shortcut: 'Ctrl+Y',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Cut',
        icon: <Cut size={14} />,
        shortcut: 'Ctrl+X',
        action: () => {},
      },
      {
        label: 'Copy',
        icon: <Copy size={14} />,
        shortcut: 'Ctrl+C',
        action: () => {},
      },
      {
        label: 'Paste',
        icon: <Clipboard size={14} />,
        shortcut: 'Ctrl+V',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Find...',
        icon: <Search size={14} />,
        shortcut: 'Ctrl+F',
        action: () => {},
      },
      {
        label: 'Replace...',
        shortcut: 'Ctrl+H',
        action: () => {},
      },
    ],
    View: [
      {
        label: showCodeEditor ? 'Object' : 'Code',
        icon: <Code size={14} />,
        shortcut: 'F7',
        action: () => toggleWindow('showCodeEditor'),
      },
      { separator: true },
      {
        label: 'Project Explorer',
        checked: showProjectExplorer,
        action: () => toggleWindow('showProjectExplorer'),
      },
      {
        label: 'Properties Window',
        checked: showPropertiesWindow,
        shortcut: 'F4',
        action: () => toggleWindow('showPropertiesWindow'),
      },
      {
        label: 'Controls Tree',
        checked: showControlTree,
        action: () => toggleWindow('showControlTree'),
      },
      {
        label: 'Toolbox',
        checked: showToolbox,
        action: () => toggleWindow('showToolbox'),
      },
      { separator: true },
      {
        label: 'Immediate Window',
        shortcut: 'Ctrl+G',
        action: () => toggleWindow('showImmediateWindow'),
      },
      {
        label: 'Watch Window',
        action: () => toggleWindow('showWatchWindow'),
      },
      {
        label: 'Call Stack',
        action: () => toggleWindow('showCallStack'),
      },
      { separator: true },
      {
        label: 'Object Browser',
        shortcut: 'F2',
        action: () => showDialog('showObjectBrowser', true),
      },
      { separator: true },
      {
        label: 'Git Integration',
        icon: <GitFork size={14} />,
        checked: showGitPanel,
        action: () => toggleWindow('showGitPanel'),
      },
    ],
    Project: [
      {
        label: 'Add Form',
        action: () => {},
      },
      {
        label: 'Add Module',
        action: () => {},
      },
      {
        label: 'Add Class Module',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Components...',
        icon: <Package size={14} />,
        action: () => showDialog('showComponents', true),
      },
      {
        label: 'References...',
        icon: <Database size={14} />,
        action: () => showDialog('showReferences', true),
      },
      { separator: true },
      {
        label: 'Project Properties...',
        action: () => {},
      },
    ],
    Format: [
      {
        label: 'Align',
        submenu: [
          { label: 'Lefts', action: () => {} },
          { label: 'Centers', action: () => {} },
          { label: 'Rights', action: () => {} },
          { label: 'Tops', action: () => {} },
          { label: 'Middles', action: () => {} },
          { label: 'Bottoms', action: () => {} },
        ],
      },
      {
        label: 'Make Same Size',
        submenu: [
          { label: 'Width', action: () => {} },
          { label: 'Height', action: () => {} },
          { label: 'Both', action: () => {} },
        ],
      },
      {
        label: 'Horizontal Spacing',
        submenu: [
          { label: 'Make Equal', action: () => {} },
          { label: 'Increase', action: () => {} },
          { label: 'Decrease', action: () => {} },
        ],
      },
      {
        label: 'Center in Form',
        submenu: [
          { label: 'Horizontally', action: () => {} },
          { label: 'Vertically', action: () => {} },
        ],
      },
      { separator: true },
      {
        label: 'Order',
        submenu: [
          { label: 'Bring to Front', action: () => {} },
          { label: 'Send to Back', action: () => {} },
        ],
      },
    ],
    Analyze: [
      {
        label: 'Code Analyzer...',
        icon: <BarChart size={14} />,
        action: () => {},
      },
      {
        label: 'Refactor...',
        icon: <WandSparkles size={14} />,
        action: () => {},
      },
      { separator: true },
      {
        label: 'Performance Monitor',
        icon: <ActivitySquare size={14} />,
        action: () => {},
      },
      {
        label: 'Breakpoint Manager...',
        icon: <AlertOctagon size={14} />,
        shortcut: 'Alt+F9',
        action: () => {},
      },
    ],
    Debug: [
      {
        label: 'Start Debugging',
        icon: <Play size={14} />,
        shortcut: 'F5',
        action: () => onShowDebugPanel?.(),
      },
      {
        label: 'Debugger',
        icon: <Bug size={14} />,
        shortcut: 'Ctrl+Shift+D',
        action: () => onShowDebugPanel?.(),
      },
      { separator: true },
      {
        label: 'Step Into',
        shortcut: 'F8',
        action: () => onShowDebugPanel?.(),
      },
      {
        label: 'Step Over',
        shortcut: 'Shift+F8',
        action: () => {},
      },
      {
        label: 'Step Out',
        shortcut: 'Ctrl+Shift+F8',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Toggle Breakpoint',
        shortcut: 'F9',
        action: () => onShowDebugPanel?.(),
      },
      {
        label: 'Conditional Breakpoint...',
        shortcut: 'Ctrl+F9',
        action: () => {},
      },
      {
        label: 'Tracepoint...',
        shortcut: 'Ctrl+Shift+F9',
        action: () => {},
      },
      {
        label: 'Data Breakpoint...',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Exception Settings...',
        action: () => {},
      },
      {
        label: 'Take Snapshot',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Start Profiling',
        action: () => {},
      },
      {
        label: 'Stop Profiling',
        action: () => {},
      },
      {
        label: 'Clear All Breakpoints',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Add Watch...',
        action: () => {},
      },
      {
        label: 'Quick Watch...',
        shortcut: 'Shift+F9',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Error List',
        icon: <AlertCircle size={14} />,
        action: () => setShowErrorList(true),
      },
      {
        label: 'Debug Logs',
        icon: <Bug size={14} />,
        action: () => toggleWindow('showLogPanel'),
      },
      { separator: true },
      {
        label: 'Memory Profiler',
        icon: <ActivitySquare size={14} />,
        checked: showMemoryProfiler,
        action: () => toggleWindow('showMemoryProfiler'),
      },
    ],
    Run: [
      {
        label: executionMode === 'run' ? 'End' : 'Start',
        icon: executionMode === 'run' ? <Square size={14} /> : <Play size={14} />,
        shortcut: 'F5',
        action: () => setExecutionMode(executionMode === 'run' ? 'design' : 'run'),
      },
      {
        label: 'Break',
        shortcut: 'Ctrl+Break',
        disabled: executionMode !== 'run',
        action: () => setExecutionMode('break'),
      },
      {
        label: 'Restart',
        action: () => {
          setExecutionMode('design');
          setTimeout(() => setExecutionMode('run'), 100);
        },
      },
      { separator: true },
      {
        label: 'Compile Project1',
        action: () => {},
      },
    ],
    Tools: [
      {
        label: 'Add Procedure...',
        action: () => {},
      },
      {
        label: 'Snippets...',
        icon: <Scissors size={14} />,
        action: () => showDialog('showSnippetManager', true),
        shortcut: 'Ctrl+K Ctrl+S',
      },
      {
        label: 'Menu Editor...',
        action: () => showDialog('showMenuEditor', true),
      },
      { separator: true },
      {
        label: 'Database Manager...',
        icon: <Database size={14} />,
        action: () => onShowDatabaseManager?.(),
        shortcut: 'Ctrl+Shift+D',
      },
      {
        label: 'Report Designer...',
        icon: <FileBarChart size={14} />,
        action: () => onShowReportDesigner?.(),
        shortcut: 'Ctrl+R',
      },
      {
        label: 'Snippets Manager...',
        icon: <Scissors size={14} />,
        action: () => setShowSnippetManager(true),
      },
      {
        label: 'Format Code...',
        icon: <FileCode size={14} />,
        action: () => setShowCodeFormatter(true),
        shortcut: 'Alt+Shift+F',
      },
      {
        label: 'Convert Code...',
        icon: <ArrowLeftRight size={14} />,
        action: () => setShowCodeConverter(true),
      },
      {
        label: 'Hot-Reload Dashboard...',
        icon: <Zap size={14} />,
        action: () => onShowHotReloadDashboard?.(),
        shortcut: 'Ctrl+Shift+H',
      },
      { separator: true },
      {
        label: 'Options...',
        icon: <Settings size={14} />,
        action: () => showDialog('showOptionsDialog', true),
      },
    ],
    Test: [
      {
        label: 'Test Explorer',
        icon: <TestTube size={14} />,
        checked: showTestRunner,
        action: () => toggleWindow('showTestRunner'),
        shortcut: 'Ctrl+Shift+T',
      },
      {
        label: 'Run All Tests',
        icon: <Play size={14} />,
        action: () => {},
        shortcut: 'Ctrl+R, A',
      },
      {
        label: 'Debug Test',
        icon: <Bug size={14} />,
        action: () => setShowTestDebugger(true),
        shortcut: 'Ctrl+R, D',
      },
      { separator: true },
      {
        label: 'Create Unit Test...',
        icon: <FileCheck size={14} />,
        action: () => {},
      },
      {
        label: 'Create Integration Test...',
        action: () => {},
      },
      {
        label: 'Create Visual Test...',
        action: () => {},
      },
      { separator: true },
      {
        label: 'Code Coverage',
        icon: <BarChart size={14} />,
        action: () => {},
        shortcut: 'Ctrl+R, C',
      },
      {
        label: 'Test Settings...',
        action: () => {},
      },
    ],
    Help: [
      {
        label: 'Microsoft Visual Basic Help',
        icon: <HelpCircle size={14} />,
        shortcut: 'F1',
        action: () => {},
      },
      {
        label: 'About Microsoft Visual Basic',
        action: () => {},
      },
    ],
  };

  const renderSubmenu = (items: any[], parentLabel: string) => (
    <div
      className="absolute left-full top-0 ml-1 bg-gray-200 border border-gray-400 shadow-lg min-w-48 z-50"
      role="menu"
      aria-label={parentLabel}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator ? (
            <div className="border-t border-gray-400 my-1" />
          ) : (
            <div
              className="px-4 py-1 hover:bg-blue-600 hover:text-white cursor-pointer text-xs flex items-center justify-between"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                item.action();
                handleMenuClose();
              }}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.shortcut && <span className="text-gray-500 ml-4">{item.shortcut}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMenu = (menuName: string, items: any[]) => (
    <div
      className="absolute left-0 top-full bg-gray-200 border border-gray-400 shadow-lg min-w-48 z-40"
      role="menu"
      aria-label={menuName}
    >
      {items.map((item, index) => (
        <div key={index} className="relative group">
          {item.separator ? (
            <div className="border-t border-gray-400 my-1" />
          ) : (
            <div
              className="px-4 py-1 hover:bg-blue-600 hover:text-white cursor-pointer text-xs flex items-center justify-between"
              role="menuitem"
              aria-haspopup={item.submenu ? 'true' : undefined}
              tabIndex={-1}
              onClick={() => {
                if (!item.submenu) {
                  item.action();
                  handleMenuClose();
                }
              }}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
                {item.checked && <span className="ml-1">✓</span>}
              </div>
              <div className="flex items-center">
                {item.shortcut && <span className="text-gray-500 ml-4">{item.shortcut}</span>}
                {item.submenu && <span className="ml-2">▶</span>}
              </div>
              {item.submenu && (
                <div className="hidden group-hover:block">
                  {renderSubmenu(item.submenu, item.label)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div
        className="h-6 bg-gray-200 border-b border-gray-400 flex items-center px-2 text-xs relative"
        role="menubar"
        aria-label="Main Menu"
      >
        {Object.keys(menuItems).map(menuName => (
          <div key={menuName} className="relative">
            <span
              className={`px-2 py-1 hover:bg-gray-300 cursor-pointer ${
                activeMenu === menuName ? 'bg-gray-300' : ''
              }`}
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={activeMenu === menuName}
              tabIndex={0}
              onClick={() => handleMenuClick(menuName)}
              onMouseEnter={() => handleMenuHover(menuName)}
            >
              {menuName}
            </span>
            {activeMenu === menuName &&
              renderMenu(menuName, menuItems[menuName as keyof typeof menuItems])}
          </div>
        ))}
      </div>

      {/* Overlay to close menu when clicking outside */}
      {activeMenu && (
        <div className="fixed inset-0 z-30" aria-hidden="true" onClick={handleMenuClose} />
      )}
    </>
  );
};

export default EnhancedMenuBar;
