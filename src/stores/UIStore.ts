/**
 * ULTRA-OPTIMIZED UI STORE
 * Gère exclusivement l'état de l'interface utilisateur
 * Séparé du store monolithique pour des performances optimales
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// État optimisé pour l'UI
interface UIState {
  // Mode d'exécution
  executionMode: 'design' | 'run' | 'break';

  // Fenêtres principales
  showCodeEditor: boolean;
  showGrid: boolean;
  gridSize: number;
  showAlignmentGuides: boolean;
  designerZoom: number;

  // Panneaux
  showProjectExplorer: boolean;
  showPropertiesWindow: boolean;
  showControlTree: boolean;
  showToolbox: boolean;
  showImmediateWindow: boolean;
  showFormLayout: boolean;
  showObjectBrowser: boolean;
  showWatchWindow: boolean;
  showLocalsWindow: boolean;
  showCallStack: boolean;
  showErrorList: boolean;
  showPerformanceMonitor: boolean;
  showLogPanel: boolean;
  showTodoList: boolean;
  showGitPanel: boolean;
  showMemoryProfiler: boolean;
  showTestRunner: boolean;

  // Dialogues
  showMenuEditor: boolean;
  showNewProjectDialog: boolean;
  showReferences: boolean;
  showComponents: boolean;
  showTabOrder: boolean;
  showUserControlDesigner: boolean;
  showOptionsDialog: boolean;
  showTemplateManager: boolean;
  showSnippetManager: boolean;
  showControlArrayDialog: boolean;

  // Palette de commandes et outils
  showCommandPalette: boolean;
  showExportDialog: boolean;
  showCodeFormatter: boolean;
  showCodeConverter: boolean;
  showCodeAnalyzer: boolean;
  showRefactorTools: boolean;
  showBreakpointManager: boolean;

  // État de la toolbox
  selectedToolboxTab: string;

  // Thème et apparence
  theme: 'light' | 'dark' | 'classic-vb6';
  fontSize: number;
  fontFamily: string;
}

// Actions optimisées pour l'UI
interface UIActions {
  // Mode d'exécution
  setExecutionMode: (mode: 'design' | 'run' | 'break') => void;

  // Gestion des fenêtres
  toggleWindow: (windowName: keyof UIState) => void;
  showWindow: (windowName: keyof UIState) => void;
  hideWindow: (windowName: keyof UIState) => void;
  showDialog: (dialogName: keyof UIState, show: boolean) => void;

  // Zoom du designer
  setDesignerZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Grid et guides
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleAlignmentGuides: () => void;

  // Toolbox
  setSelectedToolboxTab: (tab: string) => void;

  // Thème
  setTheme: (theme: 'light' | 'dark' | 'classic-vb6') => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;

  // Utilitaires
  resetUILayout: () => void;
  saveUILayout: () => void;
  loadUILayout: () => void;
}

type UIStore = UIState & UIActions;

// Configuration par défaut optimisée pour performance
const DEFAULT_UI_STATE: UIState = {
  executionMode: 'design',

  // Fenêtres essentielles visibles, autres cachées pour performance
  showCodeEditor: false,
  showGrid: true,
  gridSize: 8,
  showAlignmentGuides: true,
  designerZoom: 100,

  // Panneaux - minimalistes au démarrage
  showProjectExplorer: false,
  showPropertiesWindow: false,
  showControlTree: false,
  showToolbox: true,
  showImmediateWindow: false,
  showFormLayout: false,
  showObjectBrowser: false,
  showWatchWindow: false,
  showLocalsWindow: false,
  showCallStack: false,
  showErrorList: false,
  showPerformanceMonitor: false,
  showLogPanel: false,
  showTodoList: false,
  showGitPanel: false,
  showMemoryProfiler: false,
  showTestRunner: false,

  // Dialogues fermés par défaut
  showMenuEditor: false,
  showNewProjectDialog: false,
  showReferences: false,
  showComponents: false,
  showTabOrder: false,
  showUserControlDesigner: false,
  showOptionsDialog: false,
  showTemplateManager: false,
  showSnippetManager: false,
  showControlArrayDialog: false,
  showCommandPalette: false,
  showExportDialog: false,
  showCodeFormatter: false,
  showCodeConverter: false,
  showCodeAnalyzer: false,
  showRefactorTools: false,
  showBreakpointManager: false,

  selectedToolboxTab: 'General',

  theme: 'classic-vb6',
  fontSize: 12,
  fontFamily: 'Consolas, monospace',
};

// ULTRA-OPTIMIZED UI STORE avec performance monitoring
export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...DEFAULT_UI_STATE,

        // Mode d'exécution
        setExecutionMode: mode =>
          set(state => {
            state.executionMode = mode;

            // Ajuster automatiquement les fenêtres selon le mode
            if (mode === 'run') {
              state.showCodeEditor = false;
              state.showToolbox = false;
              state.showPropertiesWindow = false;
            } else if (mode === 'break') {
              state.showLocalsWindow = true;
              state.showCallStack = true;
            } else {
              // Mode design - restaurer layout par défaut
              state.showToolbox = true;
            }
          }),

        // Gestion optimisée des fenêtres
        toggleWindow: windowName =>
          set(state => {
            const key = windowName as keyof UIState;
            if (typeof state[key] === 'boolean') {
              (state[key] as boolean) = !state[key];
            }
          }),

        showWindow: windowName =>
          set(state => {
            const key = windowName as keyof UIState;
            if (typeof state[key] === 'boolean') {
              (state[key] as boolean) = true;
            }
          }),

        hideWindow: windowName =>
          set(state => {
            const key = windowName as keyof UIState;
            if (typeof state[key] === 'boolean') {
              (state[key] as boolean) = false;
            }
          }),

        showDialog: (dialogName, show) =>
          set(state => {
            const key = dialogName as keyof UIState;
            if (typeof state[key] === 'boolean') {
              (state[key] as boolean) = show;
            }
          }),

        // Zoom optimisé avec limites
        setDesignerZoom: zoom =>
          set(state => {
            const clampedZoom = Math.max(25, Math.min(400, zoom));
            state.designerZoom = clampedZoom;
          }),

        zoomIn: () => {
          const current = get().designerZoom;
          get().setDesignerZoom(current + 25);
        },

        zoomOut: () => {
          const current = get().designerZoom;
          get().setDesignerZoom(current - 25);
        },

        resetZoom: () => get().setDesignerZoom(100),

        // Grid et guides
        toggleGrid: () =>
          set(state => {
            state.showGrid = !state.showGrid;
          }),

        setGridSize: size =>
          set(state => {
            state.gridSize = Math.max(4, Math.min(32, size));
          }),

        toggleAlignmentGuides: () =>
          set(state => {
            state.showAlignmentGuides = !state.showAlignmentGuides;
          }),

        // Toolbox
        setSelectedToolboxTab: tab =>
          set(state => {
            state.selectedToolboxTab = tab;
          }),

        // Thème
        setTheme: theme =>
          set(state => {
            state.theme = theme;
            // Trigger theme update in document
            document.documentElement.setAttribute('data-theme', theme);
          }),

        setFontSize: size =>
          set(state => {
            state.fontSize = Math.max(8, Math.min(24, size));
          }),

        setFontFamily: family =>
          set(state => {
            state.fontFamily = family;
          }),

        // Layout management
        resetUILayout: () =>
          set(() => {
            return { ...DEFAULT_UI_STATE };
          }),

        saveUILayout: () => {
          const state = get();
          const layout = {
            windows: Object.entries(state)
              .filter(([key, value]) => key.startsWith('show') && typeof value === 'boolean')
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
            theme: state.theme,
            fontSize: state.fontSize,
            fontFamily: state.fontFamily,
            gridSize: state.gridSize,
            designerZoom: state.designerZoom,
          };

          localStorage.setItem('vb6-ui-layout', JSON.stringify(layout));
        },

        loadUILayout: () => {
          try {
            const saved = localStorage.getItem('vb6-ui-layout');
            if (saved) {
              const layout = JSON.parse(saved);
              set(state => {
                Object.assign(state, layout.windows || {});
                state.theme = layout.theme || DEFAULT_UI_STATE.theme;
                state.fontSize = layout.fontSize || DEFAULT_UI_STATE.fontSize;
                state.fontFamily = layout.fontFamily || DEFAULT_UI_STATE.fontFamily;
                state.gridSize = layout.gridSize || DEFAULT_UI_STATE.gridSize;
                state.designerZoom = layout.designerZoom || DEFAULT_UI_STATE.designerZoom;
              });
            }
          } catch (error) {
            console.error('❌ Error loading UI layout:', error);
          }
        },
      })),
      {
        name: 'ui-store',
        version: 1,
      }
    )
  )
);

// Sélecteurs optimisés pour éviter les re-renders
export const uiSelectors = {
  // Sélecteurs de fenêtres
  getWindowVisibility: (windowName: keyof UIState) => useUIStore.getState()[windowName] as boolean,

  // Sélecteurs de layout
  getDesignerLayout: () => {
    const state = useUIStore.getState();
    return {
      showGrid: state.showGrid,
      gridSize: state.gridSize,
      showAlignmentGuides: state.showAlignmentGuides,
      designerZoom: state.designerZoom,
    };
  },

  // Sélecteurs de thème
  getThemeSettings: () => {
    const state = useUIStore.getState();
    return {
      theme: state.theme,
      fontSize: state.fontSize,
      fontFamily: state.fontFamily,
    };
  },

  // Vérifier si en mode édition
  isInDesignMode: () => useUIStore.getState().executionMode === 'design',
  isInRunMode: () => useUIStore.getState().executionMode === 'run',
  isInBreakMode: () => useUIStore.getState().executionMode === 'break',
};
