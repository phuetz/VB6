import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

interface WindowStore {
  // Core panel visibility
  showToolbox: boolean;
  showProperties: boolean;
  showProjectExplorer: boolean;
  showImmediateWindow: boolean;
  showCodeEditor: boolean;

  // Secondary panel visibility
  showPropertiesWindow: boolean;
  showControlTree: boolean;
  showFormLayout: boolean;
  showObjectBrowser: boolean;

  // Debug windows
  showDebugWindow: boolean;
  showWatchWindow: boolean;
  showLocalsWindow: boolean;
  showCallStack: boolean;

  // Tool windows
  showErrorList: boolean;
  showCommandPalette: boolean;
  showExportDialog: boolean;
  showTemplateManager: boolean;
  showSnippetManager: boolean;
  showCodeFormatter: boolean;
  showCodeConverter: boolean;
  showCodeAnalyzer: boolean;
  showRefactorTools: boolean;
  showBreakpointManager: boolean;
  showPerformanceMonitor: boolean;

  // Dialogs
  showMenuEditor: boolean;
  showNewProjectDialog: boolean;
  showReferences: boolean;
  showComponents: boolean;
  showTabOrder: boolean;
  showUserControlDesigner: boolean;
  showOptionsDialog: boolean;

  // Additional panels
  showLogPanel: boolean;
  showTodoList: boolean;
  showControlArrayDialog: boolean;
  showGitPanel: boolean;
  showMemoryProfiler: boolean;
  showTestRunner: boolean;

  // Actions
  toggleWindow: (windowName: string) => void;
  togglePanel: (panelName: string) => void;
  showDialog: (dialogName: string, show: boolean) => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  // Core panels
  showToolbox: true,
  showProperties: true,
  showProjectExplorer: true,
  showImmediateWindow: false,
  showCodeEditor: false,

  // Secondary panels
  showPropertiesWindow: false,
  showControlTree: false,
  showFormLayout: false,
  showObjectBrowser: false,

  // Debug windows
  showDebugWindow: false,
  showWatchWindow: false,
  showLocalsWindow: false,
  showCallStack: false,

  // Tool windows
  showErrorList: false,
  showCommandPalette: false,
  showExportDialog: false,
  showTemplateManager: false,
  showSnippetManager: false,
  showCodeFormatter: false,
  showCodeConverter: false,
  showCodeAnalyzer: false,
  showRefactorTools: false,
  showBreakpointManager: false,
  showPerformanceMonitor: false,

  // Dialogs
  showMenuEditor: false,
  showNewProjectDialog: false,
  showReferences: false,
  showComponents: false,
  showTabOrder: false,
  showUserControlDesigner: false,
  showOptionsDialog: false,

  // Additional panels
  showLogPanel: false,
  showTodoList: false,
  showControlArrayDialog: false,
  showGitPanel: false,
  showMemoryProfiler: false,
  showTestRunner: false,

  toggleWindow: (windowName: string) => {
    const state = get();
    set({ [windowName]: !(state as any)[windowName] });
  },

  togglePanel: (panelName: string) => {
    const state = get();
    switch (panelName) {
      case 'toolbox':
        set({ showToolbox: !state.showToolbox });
        break;
      case 'properties':
        set({ showProperties: !state.showProperties });
        break;
      case 'projectExplorer':
        set({ showProjectExplorer: !state.showProjectExplorer });
        break;
      case 'immediateWindow':
        set({ showImmediateWindow: !state.showImmediateWindow });
        break;
      default:
        break;
    }
  },

  showDialog: (dialogName: string, show: boolean) => {
    set({ [dialogName]: show });
  },
}));
