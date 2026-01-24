/**
 * ULTRA-OPTIMIZED DEBUG STORE
 * Gère exclusivement l'état du débogage et de l'exécution
 * Séparé du store monolithique pour des performances optimales
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// Types pour les valeurs de débogage (unknown est plus sûr que any)
export type DebugValue = unknown;

// Types pour les arguments de fonction
export type FunctionArguments = Record<string, DebugValue>;

// Types pour le débogage
export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  condition?: string;
  hitCount: number;
  enabled: boolean;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value: DebugValue;
  error?: string;
}

export interface CallStackFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  arguments: FunctionArguments;
}

export interface LocalVariable {
  name: string;
  value: DebugValue;
  type: string;
  scope: 'local' | 'module' | 'global';
}

export interface ConsoleEntry {
  id: string;
  timestamp: Date;
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  source?: string;
  data?: DebugValue;
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  name: string;
  duration: number;
  memory?: number;
}

// État du débogage
interface DebugState {
  // Points d'arrêt
  breakpoints: Map<string, Breakpoint>;
  activeBreakpoint: string | null;
  
  // Variables et expressions
  watchExpressions: WatchExpression[];
  localVariables: Map<string, LocalVariable>;
  globalVariables: Map<string, LocalVariable>;
  
  // Pile d'appels
  callStack: CallStackFrame[];
  currentFrame: number;
  
  // Console et logs
  consoleOutput: ConsoleEntry[];
  maxConsoleEntries: number;
  consoleFilter: 'all' | 'log' | 'error' | 'warn' | 'info' | 'debug';
  
  // État d'exécution
  isRunning: boolean;
  isPaused: boolean;
  currentFile: string | null;
  currentLine: number | null;
  
  // Commande immédiate
  immediateCommand: string;
  immediateHistory: string[];
  immediateHistoryIndex: number;
  
  // Métriques de performance
  performanceMetrics: PerformanceMetric[];
  isProfilingEnabled: boolean;
  
  // Erreurs et exceptions
  lastError: Error | null;
  errorCount: number;
  unhandledExceptions: Error[];
}

// Actions du débogage
interface DebugActions {
  // Points d'arrêt
  addBreakpoint: (file: string, line: number, condition?: string) => string;
  removeBreakpoint: (id: string) => void;
  toggleBreakpoint: (id: string) => void;
  updateBreakpoint: (id: string, updates: Partial<Breakpoint>) => void;
  clearAllBreakpoints: () => void;
  
  // Contrôle d'exécution
  startDebugging: () => void;
  stopDebugging: () => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  runToCursor: (file: string, line: number) => void;
  
  // Variables et expressions
  addWatchExpression: (expression: string) => void;
  removeWatchExpression: (id: string) => void;
  updateWatchExpression: (id: string, value: DebugValue) => void;
  evaluateExpression: (expression: string) => Promise<DebugValue>;
  updateLocalVariables: (variables: LocalVariable[]) => void;
  
  // Console
  addConsoleOutput: (type: ConsoleEntry['type'], message: string, source?: string, data?: DebugValue) => void;
  clearConsole: () => void;
  setConsoleFilter: (filter: DebugState['consoleFilter']) => void;
  
  // Commande immédiate
  executeImmediate: (command: string) => Promise<any>;
  setImmediateCommand: (command: string) => void;
  navigateImmediateHistory: (direction: 'up' | 'down') => void;
  
  // Performance
  startProfiling: () => void;
  stopProfiling: () => void;
  recordPerformanceMetric: (name: string, duration: number, memory?: number) => void;
  clearPerformanceMetrics: () => void;
  
  // Erreurs
  handleError: (error: Error) => void;
  clearErrors: () => void;
}

type DebugStore = DebugState & DebugActions;

// Configuration par défaut
const DEFAULT_DEBUG_STATE: DebugState = {
  breakpoints: new Map(),
  activeBreakpoint: null,
  watchExpressions: [],
  localVariables: new Map(),
  globalVariables: new Map(),
  callStack: [],
  currentFrame: 0,
  consoleOutput: [
    {
      id: '1',
      timestamp: new Date(),
      type: 'info',
      message: 'Debug console ready'
    }
  ],
  maxConsoleEntries: 1000,
  consoleFilter: 'all',
  isRunning: false,
  isPaused: false,
  currentFile: null,
  currentLine: null,
  immediateCommand: '',
  immediateHistory: [],
  immediateHistoryIndex: -1,
  performanceMetrics: [],
  isProfilingEnabled: false,
  lastError: null,
  errorCount: 0,
  unhandledExceptions: []
};

// ULTRA-OPTIMIZED DEBUG STORE
export const useDebugStore = create<DebugStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...DEFAULT_DEBUG_STATE,
        
        // Points d'arrêt
        addBreakpoint: (file, line, condition) => {
          const id = `${file}:${line}`;
          set((state) => {
            const breakpoint: Breakpoint = {
              id,
              file,
              line,
              condition,
              hitCount: 0,
              enabled: true
            };
            state.breakpoints.set(id, breakpoint);
          });
          return id;
        },
        
        removeBreakpoint: (id) =>
          set((state) => {
            state.breakpoints.delete(id);
          }),
        
        toggleBreakpoint: (id) =>
          set((state) => {
            const bp = state.breakpoints.get(id);
            if (bp) {
              bp.enabled = !bp.enabled;
            }
          }),
        
        updateBreakpoint: (id, updates) =>
          set((state) => {
            const bp = state.breakpoints.get(id);
            if (bp) {
              Object.assign(bp, updates);
            }
          }),
        
        clearAllBreakpoints: () =>
          set((state) => {
            state.breakpoints.clear();
          }),
        
        // Contrôle d'exécution
        startDebugging: () =>
          set((state) => {
            state.isRunning = true;
            state.isPaused = false;
            state.addConsoleOutput('info', 'Debugging started', 'Debugger');
          }),
        
        stopDebugging: () =>
          set((state) => {
            state.isRunning = false;
            state.isPaused = false;
            state.currentFile = null;
            state.currentLine = null;
            state.callStack = [];
            state.localVariables.clear();
            state.addConsoleOutput('info', 'Debugging stopped', 'Debugger');
          }),
        
        pauseExecution: () =>
          set((state) => {
            if (state.isRunning) {
              state.isPaused = true;
              state.addConsoleOutput('info', 'Execution paused', 'Debugger');
            }
          }),
        
        resumeExecution: () =>
          set((state) => {
            if (state.isPaused) {
              state.isPaused = false;
              state.addConsoleOutput('info', 'Execution resumed', 'Debugger');
            }
          }),
        
        stepOver: () => {
          // Implementation would interact with debugger engine
        },
        
        stepInto: () => {
          // Implementation would interact with debugger engine
        },
        
        stepOut: () => {
          // Implementation would interact with debugger engine
        },
        
        runToCursor: (file, line) => {
          // Implementation would interact with debugger engine
        },
        
        // Variables et expressions
        addWatchExpression: (expression) =>
          set((state) => {
            const watch: WatchExpression = {
              id: Date.now().toString(),
              expression,
              value: undefined
            };
            state.watchExpressions.push(watch);
          }),
        
        removeWatchExpression: (id) =>
          set((state) => {
            state.watchExpressions = state.watchExpressions.filter(w => w.id !== id);
          }),
        
        updateWatchExpression: (id, value) =>
          set((state) => {
            const watch = state.watchExpressions.find(w => w.id === id);
            if (watch) {
              watch.value = value;
              watch.error = undefined;
            }
          }),
        
        evaluateExpression: async (expression) => {
          // Implementation would evaluate in current context
          return `Result of ${expression}`;
        },
        
        updateLocalVariables: (variables) =>
          set((state) => {
            state.localVariables.clear();
            variables.forEach(v => {
              state.localVariables.set(v.name, v);
            });
          }),
        
        // Console optimisée avec limite d'entrées
        addConsoleOutput: (type, message, source, data) =>
          set((state) => {
            const entry: ConsoleEntry = {
              id: Date.now().toString(),
              timestamp: new Date(),
              type,
              message,
              source,
              data
            };
            
            state.consoleOutput.push(entry);
            
            // Limiter le nombre d'entrées pour la performance
            if (state.consoleOutput.length > state.maxConsoleEntries) {
              state.consoleOutput = state.consoleOutput.slice(-state.maxConsoleEntries);
            }
          }),
        
        clearConsole: () =>
          set((state) => {
            state.consoleOutput = [];
          }),
        
        setConsoleFilter: (filter) =>
          set((state) => {
            state.consoleFilter = filter;
          }),
        
        // Commande immédiate
        executeImmediate: async (command) => {
          const state = get();
          
          // Ajouter à l'historique
          set((draft) => {
            draft.immediateHistory.push(command);
            draft.immediateHistoryIndex = draft.immediateHistory.length;
          });
          
          // Log la commande
          state.addConsoleOutput('log', `> ${command}`, 'Immediate');
          
          try {
            // Implementation would execute in current context
            const result = await Promise.resolve(`Executed: ${command}`);
            state.addConsoleOutput('log', result, 'Immediate');
            return result;
          } catch (error) {
            state.addConsoleOutput('error', String(error), 'Immediate');
            throw error;
          }
        },
        
        setImmediateCommand: (command) =>
          set((state) => {
            state.immediateCommand = command;
          }),
        
        navigateImmediateHistory: (direction) =>
          set((state) => {
            if (direction === 'up' && state.immediateHistoryIndex > 0) {
              state.immediateHistoryIndex--;
              state.immediateCommand = state.immediateHistory[state.immediateHistoryIndex];
            } else if (direction === 'down' && state.immediateHistoryIndex < state.immediateHistory.length - 1) {
              state.immediateHistoryIndex++;
              state.immediateCommand = state.immediateHistory[state.immediateHistoryIndex];
            }
          }),
        
        // Performance
        startProfiling: () =>
          set((state) => {
            state.isProfilingEnabled = true;
            state.performanceMetrics = [];
          }),
        
        stopProfiling: () =>
          set((state) => {
            state.isProfilingEnabled = false;
          }),
        
        recordPerformanceMetric: (name, duration, memory) =>
          set((state) => {
            if (state.isProfilingEnabled) {
              state.performanceMetrics.push({
                id: Date.now().toString(),
                timestamp: new Date(),
                name,
                duration,
                memory
              });
            }
          }),
        
        clearPerformanceMetrics: () =>
          set((state) => {
            state.performanceMetrics = [];
          }),
        
        // Gestion des erreurs
        handleError: (error) =>
          set((state) => {
            state.lastError = error;
            state.errorCount++;
            state.unhandledExceptions.push(error);
            state.addConsoleOutput('error', error.message, error.stack);
            console.error('❌ Debug error:', error);
          }),
        
        clearErrors: () =>
          set((state) => {
            state.lastError = null;
            state.errorCount = 0;
            state.unhandledExceptions = [];
          })
      })),
      {
        name: 'debug-store',
        version: 1
      }
    )
  )
);

// Sélecteurs optimisés
export const debugSelectors = {
  // Breakpoints
  getBreakpointsForFile: (file: string) => {
    const breakpoints = Array.from(useDebugStore.getState().breakpoints.values());
    return breakpoints.filter(bp => bp.file === file && bp.enabled);
  },
  
  hasBreakpointAt: (file: string, line: number) => {
    const id = `${file}:${line}`;
    return useDebugStore.getState().breakpoints.has(id);
  },
  
  // Console
  getFilteredConsoleOutput: () => {
    const state = useDebugStore.getState();
    if (state.consoleFilter === 'all') {
      return state.consoleOutput;
    }
    return state.consoleOutput.filter(entry => entry.type === state.consoleFilter);
  },
  
  // Execution state
  isDebugging: () => {
    const state = useDebugStore.getState();
    return state.isRunning || state.isPaused;
  },
  
  canStep: () => {
    const state = useDebugStore.getState();
    return state.isPaused && state.callStack.length > 0;
  }
};

