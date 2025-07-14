import React, { useState } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { FileText, FolderOpen, Save, Nut as Cut, Copy, Clipboard, Undo, Redo, Search, Play, Square, Settings, HelpCircle, Eye, Code, Package, Database, AlertOctagon, Sparkles as WandSparkles, ActivitySquare, BarChart, AlertCircle, Command, Download, Scissors, FileCode, ArrowLeftRight, Bug } from 'lucide-react';

const EnhancedMenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { 
    executionMode, 
    showCodeEditor,
    showProjectExplorer,
    showPropertiesWindow,
    showControlTree,
    showToolbox,
    toggleWindow,
    setExecutionMode,
    showDialog
  } = useVB6Store();
  
  const setShowErrorList = () => console.log('Show error list');
  const setShowCommandPalette = () => console.log('Show command palette');
  const setShowExportDialog = () => console.log('Show export dialog');
  const setShowSnippetManager = () => console.log('Show snippet manager');
  const setShowCodeFormatter = () => console.log('Show code formatter');
  const setShowCodeConverter = () => console.log('Show code converter');

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
        action: () => showDialog('showNewProjectDialog', true)
      },
      { 
        label: 'Open Project...', 
        icon: <FolderOpen size={14} />, 
        shortcut: 'Ctrl+O',
        action: () => console.log('Open project')
      },
      { 
        label: 'Import...', 
        icon: <FileText size={14} />, 
        action: () => console.log('Import')
      },
      { separator: true },
      { 
        label: 'Save Project', 
        icon: <Save size={14} />, 
        shortcut: 'Ctrl+S',
        action: () => console.log('Save project')
      },
      { 
        label: 'Save Project As...', 
        action: () => console.log('Save as')
      },
      { 
        label: 'Export...', 
        icon: <Download size={14} />, 
        action: () => setShowExportDialog(true)
      },
      { separator: true },
      {
        label: 'Print...', 
        shortcut: 'Ctrl+P',
        action: () => console.log('Print')
      },
      { separator: true },
      { 
        label: 'Make Project1.exe...', 
        action: () => console.log('Make exe')
      },
      { separator: true },
      { 
        label: 'Recent Projects',
        submenu: [
          { label: 'Calculator.vbp', action: () => {} },
          { label: 'TextEditor.vbp', action: () => {} },
          { label: 'GameEngine.vbp', action: () => {} }
        ]
      },
      { separator: true },
      { label: 'Exit', action: () => window.close() },
      { separator: true },
      { 
        label: 'Command Palette...', 
        icon: <Command size={14} />, 
        shortcut: 'Ctrl+Shift+P',
        action: () => setShowCommandPalette(true)
      }
    ],
    Edit: [
      { 
        label: 'Undo', 
        icon: <Undo size={14} />, 
        shortcut: 'Ctrl+Z',
        action: () => console.log('Undo')
      },
      { 
        label: 'Redo', 
        icon: <Redo size={14} />, 
        shortcut: 'Ctrl+Y',
        action: () => console.log('Redo')
      },
      { separator: true },
      { 
        label: 'Cut', 
        icon: <Cut size={14} />, 
        shortcut: 'Ctrl+X',
        action: () => console.log('Cut')
      },
      { 
        label: 'Copy', 
        icon: <Copy size={14} />, 
        shortcut: 'Ctrl+C',
        action: () => console.log('Copy')
      },
      { 
        label: 'Paste', 
        icon: <Clipboard size={14} />, 
        shortcut: 'Ctrl+V',
        action: () => console.log('Paste')
      },
      { separator: true },
      { 
        label: 'Find...', 
        icon: <Search size={14} />, 
        shortcut: 'Ctrl+F',
        action: () => console.log('Find')
      },
      { 
        label: 'Replace...', 
        shortcut: 'Ctrl+H',
        action: () => console.log('Replace')
      }
    ],
    View: [
      { 
        label: showCodeEditor ? 'Object' : 'Code', 
        icon: <Code size={14} />, 
        shortcut: 'F7',
        action: () => toggleWindow('showCodeEditor')
      },
      { separator: true },
      { 
        label: 'Project Explorer', 
        checked: showProjectExplorer,
        action: () => toggleWindow('showProjectExplorer')
      },
      {
        label: 'Properties Window',
        checked: showPropertiesWindow,
        shortcut: 'F4',
        action: () => toggleWindow('showPropertiesWindow')
      },
      {
        label: 'Controls Tree',
        checked: showControlTree,
        action: () => toggleWindow('showControlTree')
      },
      {
        label: 'Toolbox',
        checked: showToolbox,
        action: () => toggleWindow('showToolbox')
      },
      { separator: true },
      { 
        label: 'Immediate Window', 
        shortcut: 'Ctrl+G',
        action: () => toggleWindow('showImmediateWindow')
      },
      { 
        label: 'Watch Window', 
        action: () => toggleWindow('showWatchWindow')
      },
      { 
        label: 'Call Stack', 
        action: () => toggleWindow('showCallStack')
      },
      { separator: true },
      { 
        label: 'Object Browser', 
        shortcut: 'F2',
        action: () => showDialog('showObjectBrowser', true)
      }
    ],
    Project: [
      { 
        label: 'Add Form', 
        action: () => console.log('Add form')
      },
      { 
        label: 'Add Module', 
        action: () => console.log('Add module')
      },
      { 
        label: 'Add Class Module', 
        action: () => console.log('Add class')
      },
      { separator: true },
      { 
        label: 'Components...', 
        icon: <Package size={14} />,
        action: () => showDialog('showComponents', true)
      },
      { 
        label: 'References...', 
        icon: <Database size={14} />,
        action: () => showDialog('showReferences', true)
      },
      { separator: true },
      { 
        label: 'Project Properties...', 
        action: () => console.log('Project properties')
      }
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
          { label: 'Bottoms', action: () => {} }
        ]
      },
      { 
        label: 'Make Same Size',
        submenu: [
          { label: 'Width', action: () => {} },
          { label: 'Height', action: () => {} },
          { label: 'Both', action: () => {} }
        ]
      },
      { 
        label: 'Horizontal Spacing',
        submenu: [
          { label: 'Make Equal', action: () => {} },
          { label: 'Increase', action: () => {} },
          { label: 'Decrease', action: () => {} }
        ]
      },
      { 
        label: 'Center in Form',
        submenu: [
          { label: 'Horizontally', action: () => {} },
          { label: 'Vertically', action: () => {} }
        ]
      },
      { separator: true },
      { 
        label: 'Order',
        submenu: [
          { label: 'Bring to Front', action: () => {} },
          { label: 'Send to Back', action: () => {} }
        ]
      }
    ],
    Analyze: [
      { 
        label: 'Code Analyzer...', 
        icon: <BarChart size={14} />, 
        action: () => console.log('Open code analyzer')
      },
      { 
        label: 'Refactor...', 
        icon: <WandSparkles size={14} />, 
        action: () => console.log('Open refactoring tools')
      },
      { separator: true },
      { 
        label: 'Performance Monitor', 
        icon: <ActivitySquare size={14} />, 
        action: () => console.log('Open performance monitor')
      },
      { 
        label: 'Breakpoint Manager...', 
        icon: <AlertOctagon size={14} />, 
        shortcut: 'Alt+F9',
        action: () => console.log('Open breakpoint manager')
      },
    ],
    Debug: [
      { 
        label: 'Step Into', 
        shortcut: 'F8',
        action: () => console.log('Step into')
      },
      { 
        label: 'Step Over', 
        shortcut: 'Shift+F8',
        action: () => console.log('Step over')
      },
      { 
        label: 'Step Out', 
        shortcut: 'Ctrl+Shift+F8',
        action: () => console.log('Step out')
      },
      { separator: true },
      { 
        label: 'Toggle Breakpoint', 
        shortcut: 'F9',
        action: () => console.log('Toggle breakpoint')
      },
      { 
        label: 'Clear All Breakpoints', 
        action: () => console.log('Clear breakpoints')
      },
      { separator: true },
      { 
        label: 'Add Watch...', 
        action: () => console.log('Add watch')
      },
      { 
        label: 'Quick Watch...', 
        shortcut: 'Shift+F9',
        action: () => console.log('Quick watch')
      },
      { separator: true },
      {
        label: 'Error List',
        icon: <AlertCircle size={14} />,
        action: () => setShowErrorList(true)
      },
      {
        label: 'Debug Logs',
        icon: <Bug size={14} />,
        action: () => toggleWindow('showLogPanel')
      },
    ],
    Run: [
      { 
        label: executionMode === 'run' ? 'End' : 'Start', 
        icon: executionMode === 'run' ? <Square size={14} /> : <Play size={14} />, 
        shortcut: 'F5',
        action: () => setExecutionMode(executionMode === 'run' ? 'design' : 'run')
      },
      { 
        label: 'Break', 
        shortcut: 'Ctrl+Break',
        disabled: executionMode !== 'run',
        action: () => setExecutionMode('break')
      },
      { 
        label: 'Restart', 
        action: () => {
          setExecutionMode('design');
          setTimeout(() => setExecutionMode('run'), 100);
        }
      },
      { separator: true },
      { 
        label: 'Compile Project1', 
        action: () => console.log('Compile')
      }
    ],
    Tools: [
      { 
        label: 'Add Procedure...', 
        action: () => console.log('Add procedure')
      },
      {
        label: 'Snippets...',
        icon: <Scissors size={14} />,
        action: () => showDialog('showSnippetManager', true),
        shortcut: 'Ctrl+K Ctrl+S'
      },
      { 
        label: 'Menu Editor...', 
        action: () => showDialog('showMenuEditor', true)
      },
      { 
        label: 'Snippets Manager...', 
        icon: <Scissors size={14} />, 
        action: () => setShowSnippetManager(true) 
      },
      { 
        label: 'Format Code...', 
        icon: <FileCode size={14} />, 
        action: () => setShowCodeFormatter(true),
        shortcut: 'Alt+Shift+F'
      },
      { 
        label: 'Convert Code...', 
        icon: <ArrowLeftRight size={14} />, 
        action: () => setShowCodeConverter(true)
      },
      { separator: true },
      {
        label: 'Options...',
        icon: <Settings size={14} />,
        action: () => showDialog('showOptionsDialog', true)
      }
    ],
    Help: [
      { 
        label: 'Microsoft Visual Basic Help', 
        icon: <HelpCircle size={14} />,
        shortcut: 'F1',
        action: () => console.log('Help')
      },
      { 
        label: 'About Microsoft Visual Basic', 
        action: () => console.log('About')
      }
    ]
  };

  const renderSubmenu = (items: any[], parentLabel: string) => (
    <div className="absolute left-full top-0 ml-1 bg-gray-200 border border-gray-400 shadow-lg min-w-48 z-50">
      {items.map((item, index) => (
        <div key={index}>
          {item.separator ? (
            <div className="border-t border-gray-400 my-1" />
          ) : (
            <div
              className="px-4 py-1 hover:bg-blue-600 hover:text-white cursor-pointer text-xs flex items-center justify-between"
              onClick={() => {
                item.action();
                handleMenuClose();
              }}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-gray-500 ml-4">{item.shortcut}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMenu = (menuName: string, items: any[]) => (
    <div className="absolute left-0 top-full bg-gray-200 border border-gray-400 shadow-lg min-w-48 z-40">
      {items.map((item, index) => (
        <div key={index} className="relative group">
          {item.separator ? (
            <div className="border-t border-gray-400 my-1" />
          ) : (
            <div
              className="px-4 py-1 hover:bg-blue-600 hover:text-white cursor-pointer text-xs flex items-center justify-between"
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
                {item.shortcut && (
                  <span className="text-gray-500 ml-4">{item.shortcut}</span>
                )}
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
      <div className="h-6 bg-gray-200 border-b border-gray-400 flex items-center px-2 text-xs relative">
        {Object.keys(menuItems).map((menuName) => (
          <div key={menuName} className="relative">
            <span
              className={`px-2 py-1 hover:bg-gray-300 cursor-pointer ${
                activeMenu === menuName ? 'bg-gray-300' : ''
              }`}
              onClick={() => handleMenuClick(menuName)}
              onMouseEnter={() => handleMenuHover(menuName)}
            >
              {menuName}
            </span>
            {activeMenu === menuName && renderMenu(menuName, menuItems[menuName as keyof typeof menuItems])}
          </div>
        ))}
      </div>
      
      {/* Overlay to close menu when clicking outside */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={handleMenuClose}
        />
      )}
    </>
  );
};

export default EnhancedMenuBar;