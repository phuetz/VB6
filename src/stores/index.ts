/**
 * ULTRA-OPTIMIZED STORE ARCHITECTURE
 * Export centralisé de tous les stores de domaine
 * Remplace le store monolithique pour des performances optimales
 */

// Export des stores
export { useProjectStore, projectSelectors } from './ProjectStore';
export { useDesignerStore, designerSelectors } from './DesignerStore';
export { useUIStore, uiSelectors } from './UIStore';
export { useDebugStore, debugSelectors } from './DebugStore';

// Export du store legacy pour compatibilité temporaire
export { useVB6Store } from './vb6Store';

// Types communs réexportés
export type {
  VB6Form,
  VB6Module,
  VB6Reference,
  VB6Component,
  ProjectMetadata,
} from './ProjectStore';
export type {
  DragState,
  SelectionBox,
  AlignmentGuide,
  CanvasState,
  ZoomLevel,
} from './DesignerStore';
export type {
  Breakpoint,
  WatchExpression,
  CallStackFrame,
  LocalVariable,
  ConsoleEntry,
  PerformanceMetric,
} from './DebugStore';

// Hook personnalisé pour migrer facilement du store monolithique
export const useStores = () => {
  const project = useProjectStore();
  const designer = useDesignerStore();
  const ui = useUIStore();
  const debug = useDebugStore();

  return {
    project,
    designer,
    ui,
    debug,
    // Helpers pour la migration
    controls: designer.controls,
    selectedControls: designer.selectedControls,
    executionMode: ui.executionMode,
    showCodeEditor: ui.showCodeEditor,
  };
};

// Fonction utilitaire pour vérifier la santé des stores
export const checkStoresHealth = () => {
  const stores = {
    project: useProjectStore.getState(),
    designer: useDesignerStore.getState(),
    ui: useUIStore.getState(),
    debug: useDebugStore.getState(),
  };

  console.group('🏥 Store Health Check');

  // Vérifier la mémoire utilisée
  if (performance.memory) {
    // Memory monitoring available - could add memory checks here if needed
  }

  // Statistiques des stores

  console.groupEnd();

  return stores;
};

// Fonction pour nettoyer les stores (utile pour les tests)
export const resetAllStores = () => {
  // Reset chaque store à son état initial
  useProjectStore.setState(useProjectStore.getInitialState());
  useDesignerStore.setState(useDesignerStore.getInitialState());
  useUIStore.getState().resetUILayout();
  useDebugStore.getState().clearConsole();
  useDebugStore.getState().clearAllBreakpoints();
};

// CRITICAL: Observer les changements critiques pour le debug - DISABLED to prevent loops
// TODO: Move this to a proper hook that can be used in components
// if (process.env.NODE_ENV === 'development') {
//   // Observer les changements de performance
//   let renderCount = 0;
//
//   useDesignerStore.subscribe(
//     (state) => state.controls,
//     () => {
//       renderCount++;
//       if (renderCount % 10 === 0) {
//       }
//     }
//   );
//
//   // Observer les fuites mémoire potentielles
//   setInterval(() => {
//     const debugState = useDebugStore.getState();
//     if (debugState.consoleOutput.length > 500) {
//       console.warn('⚠️ Console output is getting large, consider clearing');
//     }
//
//     const designerState = useDesignerStore.getState();
//     if (designerState.history.past.length > 30) {
//       console.warn('⚠️ History is getting large, consider limiting');
//     }
//   }, 30000); // Check every 30 seconds
// }
