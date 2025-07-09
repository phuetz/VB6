import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  keys: string[];
  action: () => void;
  description: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    for (const shortcut of shortcuts) {
      const matchesKey = shortcut.keys.some(k => k.toLowerCase() === key);
      const matchesCtrl = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
      const matchesShift = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
      const matchesAlt = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
      
      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
};

// Hook pour les raccourcis IDE
export const useIDEShortcuts = (actions: {
  newProject: () => void;
  openProject: () => void;
  saveProject: () => void;
  find: () => void;
  findReplace: () => void;
  run: () => void;
  stop: () => void;
  compile: () => void;
  undo: () => void;
  redo: () => void;
  copy: () => void;
  cut: () => void;
  paste: () => void;
  delete: () => void;
  selectAll: () => void;
  toggleBreakpoint: () => void;
  stepInto: () => void;
  stepOver: () => void;
  stepOut: () => void;
  toggleComment: () => void;
  formatCode: () => void;
  gotoLine: () => void;
  toggleBookmark: () => void;
  nextBookmark: () => void;
  prevBookmark: () => void;
  showImmediateWindow: () => void;
  showWatchWindow: () => void;
  showObjectBrowser: () => void;
  showProjectExplorer: () => void;
  showPropertiesWindow: () => void;
  showToolbox: () => void;
  showFormDesigner: () => void;
  showCodeEditor: () => void;
  closeActiveWindow: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    // File operations
    { keys: ['n'], ctrlKey: true, action: actions.newProject, description: 'New Project' },
    { keys: ['o'], ctrlKey: true, action: actions.openProject, description: 'Open Project' },
    { keys: ['s'], ctrlKey: true, action: actions.saveProject, description: 'Save Project' },
    
    // Edit operations
    { keys: ['z'], ctrlKey: true, action: actions.undo, description: 'Undo' },
    { keys: ['y'], ctrlKey: true, action: actions.redo, description: 'Redo' },
    { keys: ['z'], ctrlKey: true, shiftKey: true, action: actions.redo, description: 'Redo (Alt)' },
    { keys: ['c'], ctrlKey: true, action: actions.copy, description: 'Copy' },
    { keys: ['x'], ctrlKey: true, action: actions.cut, description: 'Cut' },
    { keys: ['v'], ctrlKey: true, action: actions.paste, description: 'Paste' },
    { keys: ['a'], ctrlKey: true, action: actions.selectAll, description: 'Select All' },
    { keys: ['delete'], action: actions.delete, description: 'Delete' },
    
    // Search operations
    { keys: ['f'], ctrlKey: true, action: actions.find, description: 'Find' },
    { keys: ['h'], ctrlKey: true, action: actions.findReplace, description: 'Find & Replace' },
    { keys: ['g'], ctrlKey: true, action: actions.gotoLine, description: 'Go to Line' },
    
    // Run/Debug operations
    { keys: ['f5'], action: actions.run, description: 'Run' },
    { keys: ['f5'], ctrlKey: true, action: actions.compile, description: 'Compile' },
    { keys: ['escape'], action: actions.stop, description: 'Stop' },
    { keys: ['f9'], action: actions.toggleBreakpoint, description: 'Toggle Breakpoint' },
    { keys: ['f8'], action: actions.stepInto, description: 'Step Into' },
    { keys: ['f8'], shiftKey: true, action: actions.stepOver, description: 'Step Over' },
    { keys: ['f8'], ctrlKey: true, shiftKey: true, action: actions.stepOut, description: 'Step Out' },
    
    // Code operations
    { keys: ['/'], ctrlKey: true, action: actions.toggleComment, description: 'Toggle Comment' },
    { keys: ['f'], ctrlKey: true, altKey: true, action: actions.formatCode, description: 'Format Code' },
    
    // Bookmarks
    { keys: ['f2'], ctrlKey: true, action: actions.toggleBookmark, description: 'Toggle Bookmark' },
    { keys: ['f2'], action: actions.nextBookmark, description: 'Next Bookmark' },
    { keys: ['f2'], shiftKey: true, action: actions.prevBookmark, description: 'Previous Bookmark' },
    
    // Window operations
    { keys: ['g'], ctrlKey: true, action: actions.showImmediateWindow, description: 'Immediate Window' },
    { keys: ['w'], ctrlKey: true, altKey: true, action: actions.showWatchWindow, description: 'Watch Window' },
    { keys: ['f2'], ctrlKey: true, action: actions.showObjectBrowser, description: 'Object Browser' },
    { keys: ['r'], ctrlKey: true, altKey: true, action: actions.showProjectExplorer, description: 'Project Explorer' },
    { keys: ['f4'], action: actions.showPropertiesWindow, description: 'Properties Window' },
    { keys: ['t'], ctrlKey: true, altKey: true, action: actions.showToolbox, description: 'Toolbox' },
    { keys: ['f7'], shiftKey: true, action: actions.showFormDesigner, description: 'Form Designer' },
    { keys: ['f7'], action: actions.showCodeEditor, description: 'Code Editor' },
    { keys: ['f4'], ctrlKey: true, action: actions.closeActiveWindow, description: 'Close Active Window' },
    
    // Zoom operations
    { keys: ['='], ctrlKey: true, action: actions.zoomIn, description: 'Zoom In' },
    { keys: ['-'], ctrlKey: true, action: actions.zoomOut, description: 'Zoom Out' },
    { keys: ['0'], ctrlKey: true, action: actions.resetZoom, description: 'Reset Zoom' },
  ];

  return useKeyboardShortcuts(shortcuts);
};

// Hook pour les raccourcis de l'éditeur de code
export const useCodeEditorShortcuts = (actions: {
  duplicateLine: () => void;
  deleteLine: () => void;
  moveLineUp: () => void;
  moveLineDown: () => void;
  selectLine: () => void;
  selectWord: () => void;
  indentLine: () => void;
  outdentLine: () => void;
  insertLineAbove: () => void;
  insertLineBelow: () => void;
  jumpToMatchingBrace: () => void;
  selectToMatchingBrace: () => void;
  foldCode: () => void;
  unfoldCode: () => void;
  gotoDefinition: () => void;
  showIntelliSense: () => void;
  showParameterInfo: () => void;
  quickInfo: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    // Line operations
    { keys: ['d'], ctrlKey: true, action: actions.duplicateLine, description: 'Duplicate Line' },
    { keys: ['l'], ctrlKey: true, action: actions.selectLine, description: 'Select Line' },
    { keys: ['l'], ctrlKey: true, shiftKey: true, action: actions.deleteLine, description: 'Delete Line' },
    { keys: ['arrowup'], altKey: true, action: actions.moveLineUp, description: 'Move Line Up' },
    { keys: ['arrowdown'], altKey: true, action: actions.moveLineDown, description: 'Move Line Down' },
    
    // Selection operations
    { keys: ['d'], ctrlKey: true, action: actions.selectWord, description: 'Select Word' },
    
    // Indentation
    { keys: ['tab'], action: actions.indentLine, description: 'Indent Line' },
    { keys: ['tab'], shiftKey: true, action: actions.outdentLine, description: 'Outdent Line' },
    
    // Line insertion
    { keys: ['enter'], ctrlKey: true, action: actions.insertLineAbove, description: 'Insert Line Above' },
    { keys: ['enter'], ctrlKey: true, shiftKey: true, action: actions.insertLineBelow, description: 'Insert Line Below' },
    
    // Brace matching
    { keys: [']'], ctrlKey: true, action: actions.jumpToMatchingBrace, description: 'Jump to Matching Brace' },
    { keys: [']'], ctrlKey: true, shiftKey: true, action: actions.selectToMatchingBrace, description: 'Select to Matching Brace' },
    
    // Code folding
    { keys: ['['], ctrlKey: true, action: actions.foldCode, description: 'Fold Code' },
    { keys: [']'], ctrlKey: true, action: actions.unfoldCode, description: 'Unfold Code' },
    
    // IntelliSense
    { keys: [' '], ctrlKey: true, action: actions.showIntelliSense, description: 'Show IntelliSense' },
    { keys: [' '], ctrlKey: true, shiftKey: true, action: actions.showParameterInfo, description: 'Parameter Info' },
    { keys: ['k'], ctrlKey: true, action: actions.quickInfo, description: 'Quick Info' },
    
    // Navigation
    { keys: ['f12'], action: actions.gotoDefinition, description: 'Go to Definition' },
  ];

  return useKeyboardShortcuts(shortcuts);
};