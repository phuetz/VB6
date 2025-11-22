/**
 * Optimized VB6 Store
 * 
 * High-performance state management with:
 * - Immutable updates with structural sharing
 * - Selector memoization
 * - Batch updates and deferred mutations
 * - Memory-efficient data structures
 * - Performance monitoring
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Control, Form, Project } from '../context/types';
import { performanceOptimizer } from '../performance/PerformanceOptimizer';

// State interfaces
interface VB6State {
  // Core data
  project: Project | null;
  forms: Form[];
  currentFormId: string | null;
  controls: Control[];
  selectedControlIds: Set<string>;
  
  // UI state
  zoom: number;
  gridSize: number;
  showGrid: boolean;
  showAlignmentGuides: boolean;
  enableSnapping: boolean;
  
  // Editor state
  activeTabId: string | null;
  openTabs: EditorTab[];
  breakpoints: Map<string, Set<number>>;
  
  // Compilation state
  isCompiling: boolean;
  compilationErrors: CompilerError[];
  compilationWarnings: CompilerError[];
  
  // Performance metrics
  renderMetrics: RenderMetrics;
  operationHistory: OperationHistory[];
  
  // Cache for expensive computations
  computationCache: Map<string, any>;
  
  // Undo/redo
  undoStack: StateSnapshot[];
  redoStack: StateSnapshot[];
  maxHistorySize: number;
}

interface EditorTab {
  id: string;
  title: string;
  type: 'form' | 'code' | 'resource';
  filePath: string;
  isDirty: boolean;
  content?: string;
}

interface CompilerError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface RenderMetrics {
  controlsRendered: number;
  renderTime: number;
  lastRenderTimestamp: number;
  averageRenderTime: number;
  peakRenderTime: number;
}

interface OperationHistory {
  type: string;
  timestamp: number;
  duration: number;
  details: any;
}

interface StateSnapshot {
  timestamp: number;
  operation: string;
  state: Partial<VB6State>;
}

// Actions interface
interface VB6Actions {
  // Project management
  loadProject: (project: Project) => void;
  saveProject: () => Promise<void>;
  createNewProject: (name: string) => void;
  
  // Form management
  addForm: (form: Omit<Form, 'id'>) => void;
  removeForm: (formId: string) => void;
  updateForm: (formId: string, updates: Partial<Form>) => void;
  setCurrentForm: (formId: string | null) => void;
  
  // Control management
  addControl: (control: Omit<Control, 'id'>) => void;
  addControls: (controls: Omit<Control, 'id'>[]) => void;
  removeControl: (controlId: string) => void;
  removeControls: (controlIds: string[]) => void;
  updateControl: (controlId: string, updates: Partial<Control>) => void;
  updateControls: (updates: { id: string; updates: Partial<Control> }[]) => void;
  moveControl: (controlId: string, deltaX: number, deltaY: number) => void;
  moveControls: (movements: { id: string; deltaX: number; deltaY: number }[]) => void;
  resizeControl: (controlId: string, width: number, height: number) => void;
  duplicateControls: (controlIds: string[]) => void;
  
  // Selection management
  selectControl: (controlId: string) => void;
  selectControls: (controlIds: string[]) => void;
  toggleControlSelection: (controlId: string) => void;
  selectAllControls: () => void;
  clearSelection: () => void;
  
  // UI actions
  setZoom: (zoom: number) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleAlignmentGuides: () => void;
  toggleSnapping: () => void;
  
  // Editor actions
  openTab: (tab: EditorTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  
  // Compilation actions
  compileProject: () => Promise<void>;
  clearCompilationErrors: () => void;
  
  // Debug actions
  toggleBreakpoint: (file: string, line: number) => void;
  clearAllBreakpoints: () => void;
  
  // Undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Performance actions
  updateRenderMetrics: (metrics: Partial<RenderMetrics>) => void;
  recordOperation: (type: string, duration: number, details?: any) => void;
  clearMetrics: () => void;
  
  // Cache management
  invalidateCache: (key?: string) => void;
  
  // Batch operations
  batch: (operations: (() => void)[]) => void;
}

type VB6Store = VB6State & VB6Actions;

// Optimized selectors with memoization
const createSelectors = (store: any) => ({
  // Form selectors
  currentForm: performanceOptimizer.memoize(
    () => store.getState().forms.find((form: Form) => form.id === store.getState().currentFormId),
    50
  ),
  
  formCount: performanceOptimizer.memoize(
    () => store.getState().forms.length,
    10
  ),
  
  // Control selectors
  currentFormControls: performanceOptimizer.memoize(
    () => {
      const state = store.getState();
      return state.controls.filter((control: Control) => control.formId === state.currentFormId);
    },
    100
  ),
  
  selectedControls: performanceOptimizer.memoize(
    () => {
      const state = store.getState();
      return state.controls.filter((control: Control) => 
        state.selectedControlIds.has(control.id.toString())
      );
    },
    50
  ),
  
  visibleControls: performanceOptimizer.memoize(
    (viewportBounds?: DOMRect) => {
      const state = store.getState();
      const controls = state.controls.filter((control: Control) => 
        control.formId === state.currentFormId
      );
      
      if (!viewportBounds) return controls;
      
      return performanceOptimizer.getVirtualizedControls(controls, viewportBounds);
    },
    20
  ),
  
  controlCount: performanceOptimizer.memoize(
    () => store.getState().controls.length,
    10
  ),
  
  // UI selectors
  hasSelection: performanceOptimizer.memoize(
    () => store.getState().selectedControlIds.size > 0,
    10
  ),
  
  selectionBounds: performanceOptimizer.memoize(
    () => {
      const selectedControls = store.getState().controls.filter((control: Control) =>
        store.getState().selectedControlIds.has(control.id.toString())
      );
      
      if (selectedControls.length === 0) return null;
      
      const bounds = selectedControls.reduce(
        (acc, control) => ({
          left: Math.min(acc.left, control.x),
          top: Math.min(acc.top, control.y),
          right: Math.max(acc.right, control.x + control.width),
          bottom: Math.max(acc.bottom, control.y + control.height)
        }),
        {
          left: Infinity,
          top: Infinity,
          right: -Infinity,
          bottom: -Infinity
        }
      );
      
      return {
        x: bounds.left,
        y: bounds.top,
        width: bounds.right - bounds.left,
        height: bounds.bottom - bounds.top
      };
    },
    25
  ),
  
  // Editor selectors
  activeTab: performanceOptimizer.memoize(
    () => store.getState().openTabs.find((tab: EditorTab) => tab.id === store.getState().activeTabId),
    20
  ),
  
  dirtyTabs: performanceOptimizer.memoize(
    () => store.getState().openTabs.filter((tab: EditorTab) => tab.isDirty),
    20
  ),
  
  // Compilation selectors
  hasErrors: performanceOptimizer.memoize(
    () => store.getState().compilationErrors.length > 0,
    10
  ),
  
  hasWarnings: performanceOptimizer.memoize(
    () => store.getState().compilationWarnings.length > 0,
    10
  ),
  
  // Performance selectors
  averageOperationTime: performanceOptimizer.memoize(
    (operationType: string) => {
      const operations = store.getState().operationHistory.filter(
        (op: OperationHistory) => op.type === operationType
      );
      
      if (operations.length === 0) return 0;
      
      return operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;
    },
    30
  )
});

// Create the optimized store
export const useOptimizedVB6Store = create<VB6Store>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      project: null,
      forms: [],
      currentFormId: null,
      controls: [],
      selectedControlIds: new Set<string>(),
      
      zoom: 1.0,
      gridSize: 8,
      showGrid: true,
      showAlignmentGuides: true,
      enableSnapping: true,
      
      activeTabId: null,
      openTabs: [],
      breakpoints: new Map(),
      
      isCompiling: false,
      compilationErrors: [],
      compilationWarnings: [],
      
      renderMetrics: {
        controlsRendered: 0,
        renderTime: 0,
        lastRenderTimestamp: 0,
        averageRenderTime: 0,
        peakRenderTime: 0
      },
      operationHistory: [],
      
      computationCache: new Map(),
      
      undoStack: [],
      redoStack: [],
      maxHistorySize: 50,
      
      // Project management
      loadProject: (project: Project) => {
        set((state) => {
          state.project = project;
          state.forms = project.forms || [];
          state.controls = project.forms?.flatMap(form => form.controls || []) || [];
          state.currentFormId = state.forms[0]?.id || null;
          state.selectedControlIds.clear();
        });
      },
      
      saveProject: async () => {
        const state = get();
        if (!state.project) return;
        
        await performanceOptimizer.measureAsync('save-project', async () => {
          // Simulate project save
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      },
      
      createNewProject: (name: string) => {
        set((state) => {
          const newProject: Project = {
            id: Date.now().toString(),
            name,
            version: '1.0.0',
            forms: [],
            modules: [],
            references: []
          };
          
          state.project = newProject;
          state.forms = [];
          state.controls = [];
          state.currentFormId = null;
          state.selectedControlIds.clear();
        });
      },
      
      // Form management
      addForm: (form: Omit<Form, 'id'>) => {
        set((state) => {
          const newForm: Form = {
            ...form,
            id: Date.now().toString()
          };
          
          state.forms.push(newForm);
          
          if (!state.currentFormId) {
            state.currentFormId = newForm.id;
          }
        });
      },
      
      removeForm: (formId: string) => {
        set((state) => {
          state.forms = state.forms.filter(form => form.id !== formId);
          state.controls = state.controls.filter(control => control.formId !== formId);
          
          if (state.currentFormId === formId) {
            state.currentFormId = state.forms[0]?.id || null;
          }
          
          state.selectedControlIds.clear();
        });
      },
      
      updateForm: (formId: string, updates: Partial<Form>) => {
        set((state) => {
          const formIndex = state.forms.findIndex(form => form.id === formId);
          if (formIndex >= 0) {
            Object.assign(state.forms[formIndex], updates);
          }
        });
      },
      
      setCurrentForm: (formId: string | null) => {
        set((state) => {
          state.currentFormId = formId;
          state.selectedControlIds.clear();
        });
      },
      
      // Control management (batch optimized)
      addControl: (control: Omit<Control, 'id'>) => {
        get().addControls([control]);
      },
      
      addControls: (controls: Omit<Control, 'id'>[]) => {
        set((state) => {
          const newControls = controls.map(control => ({
            ...control,
            id: Date.now() + Math.random(),
            formId: control.formId || state.currentFormId || ''
          }));
          
          state.controls.push(...newControls);
        });
        
        get().recordOperation('add-controls', 0, { count: controls.length });
      },
      
      removeControl: (controlId: string) => {
        get().removeControls([controlId]);
      },
      
      removeControls: (controlIds: string[]) => {
        set((state) => {
          const idsSet = new Set(controlIds);
          state.controls = state.controls.filter(control => 
            !idsSet.has(control.id.toString())
          );
          
          // Remove from selection
          controlIds.forEach(id => state.selectedControlIds.delete(id));
        });
        
        get().recordOperation('remove-controls', 0, { count: controlIds.length });
      },
      
      updateControl: (controlId: string, updates: Partial<Control>) => {
        get().updateControls([{ id: controlId, updates }]);
      },
      
      updateControls: (updates: { id: string; updates: Partial<Control> }[]) => {
        set((state) => {
          const updateMap = new Map(updates.map(u => [u.id, u.updates]));
          
          for (const control of state.controls) {
            const update = updateMap.get(control.id.toString());
            if (update) {
              Object.assign(control, update);
            }
          }
        });
        
        get().recordOperation('update-controls', 0, { count: updates.length });
      },
      
      moveControl: (controlId: string, deltaX: number, deltaY: number) => {
        get().moveControls([{ id: controlId, deltaX, deltaY }]);
      },
      
      moveControls: (movements: { id: string; deltaX: number; deltaY: number }[]) => {
        get().updateControls(
          movements.map(({ id, deltaX, deltaY }) => ({
            id,
            updates: {
              x: get().controls.find(c => c.id.toString() === id)!.x + deltaX,
              y: get().controls.find(c => c.id.toString() === id)!.y + deltaY
            }
          }))
        );
      },
      
      resizeControl: (controlId: string, width: number, height: number) => {
        get().updateControl(controlId, { width, height });
      },
      
      duplicateControls: (controlIds: string[]) => {
        const state = get();
        const controlsToDuplicate = state.controls.filter(control =>
          controlIds.includes(control.id.toString())
        );
        
        const duplicatedControls = controlsToDuplicate.map(control => ({
          ...control,
          x: control.x + 20,
          y: control.y + 20,
          name: `${control.name}_Copy`
        }));
        
        state.addControls(duplicatedControls);
      },
      
      // Selection management (optimized with Set)
      selectControl: (controlId: string) => {
        set((state) => {
          state.selectedControlIds.clear();
          state.selectedControlIds.add(controlId);
        });
      },
      
      selectControls: (controlIds: string[]) => {
        set((state) => {
          state.selectedControlIds.clear();
          controlIds.forEach(id => state.selectedControlIds.add(id));
        });
      },
      
      toggleControlSelection: (controlId: string) => {
        set((state) => {
          if (state.selectedControlIds.has(controlId)) {
            state.selectedControlIds.delete(controlId);
          } else {
            state.selectedControlIds.add(controlId);
          }
        });
      },
      
      selectAllControls: () => {
        const state = get();
        const currentFormControls = state.controls
          .filter(control => control.formId === state.currentFormId)
          .map(control => control.id.toString());
        
        state.selectControls(currentFormControls);
      },
      
      clearSelection: () => {
        set((state) => {
          state.selectedControlIds.clear();
        });
      },
      
      // UI actions
      setZoom: (zoom: number) => {
        set((state) => {
          state.zoom = Math.max(0.25, Math.min(4.0, zoom));
        });
      },
      
      setGridSize: (size: number) => {
        set((state) => {
          state.gridSize = Math.max(1, Math.min(50, size));
        });
      },
      
      toggleGrid: () => {
        set((state) => {
          state.showGrid = !state.showGrid;
        });
      },
      
      toggleAlignmentGuides: () => {
        set((state) => {
          state.showAlignmentGuides = !state.showAlignmentGuides;
        });
      },
      
      toggleSnapping: () => {
        set((state) => {
          state.enableSnapping = !state.enableSnapping;
        });
      },
      
      // Editor actions
      openTab: (tab: EditorTab) => {
        set((state) => {
          if (!state.openTabs.find(t => t.id === tab.id)) {
            state.openTabs.push(tab);
          }
          state.activeTabId = tab.id;
        });
      },
      
      closeTab: (tabId: string) => {
        set((state) => {
          state.openTabs = state.openTabs.filter(tab => tab.id !== tabId);
          
          if (state.activeTabId === tabId) {
            state.activeTabId = state.openTabs[0]?.id || null;
          }
        });
      },
      
      setActiveTab: (tabId: string) => {
        set((state) => {
          state.activeTabId = tabId;
        });
      },
      
      updateTabContent: (tabId: string, content: string) => {
        set((state) => {
          const tab = state.openTabs.find(t => t.id === tabId);
          if (tab) {
            tab.content = content;
            tab.isDirty = true;
          }
        });
      },
      
      // Compilation actions
      compileProject: async () => {
        set((state) => {
          state.isCompiling = true;
          state.compilationErrors = [];
          state.compilationWarnings = [];
        });
        
        try {
          await performanceOptimizer.measureAsync('compile-project', async () => {
            // Simulate compilation
            await new Promise(resolve => setTimeout(resolve, 1000));
          });
        } finally {
          set((state) => {
            state.isCompiling = false;
          });
        }
      },
      
      clearCompilationErrors: () => {
        set((state) => {
          state.compilationErrors = [];
          state.compilationWarnings = [];
        });
      },
      
      // Debug actions
      toggleBreakpoint: (file: string, line: number) => {
        set((state) => {
          let fileBreakpoints = state.breakpoints.get(file);
          if (!fileBreakpoints) {
            fileBreakpoints = new Set();
            state.breakpoints.set(file, fileBreakpoints);
          }
          
          if (fileBreakpoints.has(line)) {
            fileBreakpoints.delete(line);
          } else {
            fileBreakpoints.add(line);
          }
        });
      },
      
      clearAllBreakpoints: () => {
        set((state) => {
          state.breakpoints.clear();
        });
      },
      
      // Undo/redo
      undo: () => {
        const state = get();
        const snapshot = state.undoStack.pop();
        if (snapshot) {
          // Save current state to redo stack
          state.redoStack.push({
            timestamp: Date.now(),
            operation: 'undo',
            state: {
              forms: [...state.forms],
              controls: [...state.controls],
              selectedControlIds: new Set(state.selectedControlIds)
            }
          });
          
          // Restore snapshot
          set((newState) => {
            Object.assign(newState, snapshot.state);
          });
        }
      },
      
      redo: () => {
        const state = get();
        const snapshot = state.redoStack.pop();
        if (snapshot) {
          // Save current state to undo stack
          state.undoStack.push({
            timestamp: Date.now(),
            operation: 'redo',
            state: {
              forms: [...state.forms],
              controls: [...state.controls],
              selectedControlIds: new Set(state.selectedControlIds)
            }
          });
          
          // Restore snapshot
          set((newState) => {
            Object.assign(newState, snapshot.state);
          });
        }
      },
      
      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,
      
      // Performance actions
      updateRenderMetrics: (metrics: Partial<RenderMetrics>) => {
        set((state) => {
          Object.assign(state.renderMetrics, metrics);
          
          // Update averages
          if (metrics.renderTime) {
            const history = state.operationHistory.filter(op => op.type === 'render');
            const totalTime = history.reduce((sum, op) => sum + op.duration, 0) + metrics.renderTime;
            state.renderMetrics.averageRenderTime = totalTime / (history.length + 1);
            state.renderMetrics.peakRenderTime = Math.max(
              state.renderMetrics.peakRenderTime,
              metrics.renderTime
            );
          }
        });
      },
      
      recordOperation: (type: string, duration: number, details?: any) => {
        set((state) => {
          state.operationHistory.push({
            type,
            timestamp: Date.now(),
            duration,
            details
          });
          
          // Limit history size
          if (state.operationHistory.length > 1000) {
            state.operationHistory = state.operationHistory.slice(-500);
          }
        });
      },
      
      clearMetrics: () => {
        set((state) => {
          state.operationHistory = [];
          state.renderMetrics = {
            controlsRendered: 0,
            renderTime: 0,
            lastRenderTimestamp: 0,
            averageRenderTime: 0,
            peakRenderTime: 0
          };
        });
      },
      
      // Cache management
      invalidateCache: (key?: string) => {
        set((state) => {
          if (key) {
            state.computationCache.delete(key);
          } else {
            state.computationCache.clear();
          }
        });
      },
      
      // Batch operations
      batch: (operations: (() => void)[]) => {
        performanceOptimizer.measure('batch-operations', () => {
          operations.forEach(op => op());
        });
      }
    }))
  )
);

// Create memoized selectors
export const vb6Selectors = createSelectors(useOptimizedVB6Store);

// Performance monitoring hook
export const useVB6Performance = () => {
  const renderMetrics = useOptimizedVB6Store(state => state.renderMetrics);
  const operationHistory = useOptimizedVB6Store(state => state.operationHistory);
  const recordOperation = useOptimizedVB6Store(state => state.recordOperation);
  const updateRenderMetrics = useOptimizedVB6Store(state => state.updateRenderMetrics);
  
  return {
    renderMetrics,
    operationHistory,
    recordOperation,
    updateRenderMetrics,
    averageOperationTime: (type: string) =>
      vb6Selectors.averageOperationTime(type)
  };
};