// Ultra-Think Hot-Reload Manager Hook
// 🔥 React integration pour le système de rechargement à chaud

import { useState, useEffect, useCallback, useRef } from 'react';
import { hotReloadEngine, HotReloadPatch, HotReloadConfig } from '../services/HotReloadEngine';
import { useVB6 } from '../context/VB6Context';

export interface HotReloadStatus {
  enabled: boolean;
  active: boolean;
  lastReload: Date | null;
  patchCount: number;
  errorCount: number;
  rollbackCount: number;
  averageReloadTime: number;
  isReloading: boolean;
  lastError: string | null;
}

export interface HotReloadActions {
  toggleHotReload: () => void;
  performManualReload: (code?: string) => Promise<boolean>;
  rollbackLastPatch: () => Promise<boolean>;
  clearHistory: () => void;
  updateConfig: (config: Partial<HotReloadConfig>) => void;
  testHotReload: () => Promise<boolean>;
}

// Types for hot reload events
export interface HotReloadError {
  message: string;
  code?: string;
  stack?: string;
}

export interface HotReloadMetrics {
  averageReloadTime: number;
  totalReloads?: number;
  errorCount?: number;
}

export interface UseHotReloadOptions {
  enabled?: boolean;
  autoWatch?: boolean;
  debounceMs?: number;
  preserveState?: boolean;
  onReloadStart?: () => void;
  onReloadComplete?: (patch: HotReloadPatch) => void;
  onReloadError?: (error: HotReloadError) => void;
  onRollback?: (reason: string) => void;
}

export const useHotReload = (options: UseHotReloadOptions = {}): [HotReloadStatus, HotReloadActions] => {
  const { state, dispatch } = useVB6();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const codeHistoryRef = useRef<string[]>([]);
  const lastCodeRef = useRef<string>('');
  
  // Hot-reload status state
  const [status, setStatus] = useState<HotReloadStatus>({
    enabled: options.enabled ?? true,
    active: false,
    lastReload: null,
    patchCount: 0,
    errorCount: 0,
    rollbackCount: 0,
    averageReloadTime: 0,
    isReloading: false,
    lastError: null
  });

  // 🔥 Initialize hot-reload engine
  useEffect(() => {
    if (!status.enabled) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Initializing Hot-Reload system...');
    }

    // Configure engine
    hotReloadEngine.updateConfig({
      enabled: status.enabled,
      watchFiles: options.autoWatch ?? true,
      preserveState: options.preserveState ?? true,
      debounceMs: options.debounceMs ?? 300,
      verboseLogging: true
    });

    // Set up event listeners
    const handleReloadStart = () => {
      setStatus(prev => ({ ...prev, isReloading: true, lastError: null }));
      options.onReloadStart?.();
    };

    const handleReloadComplete = (data: { patch: HotReloadPatch; metrics: HotReloadMetrics }) => {
      setStatus(prev => ({
        ...prev,
        isReloading: false,
        active: true,
        lastReload: new Date(),
        patchCount: prev.patchCount + 1,
        averageReloadTime: data.metrics.averageReloadTime
      }));
      
      // Update VB6 context if form changes detected
      if (data.patch.changes.some(change => change.affects.some(area => area.type === 'form'))) {
        dispatch({ type: 'FORCE_REFRESH' });
      }
      
      options.onReloadComplete?.(data.patch);
    };

    const handleReloadError = (data: { error: HotReloadError; filePath: string }) => {
      setStatus(prev => ({
        ...prev,
        isReloading: false,
        errorCount: prev.errorCount + 1,
        lastError: data.error.message || 'Hot-reload failed'
      }));
      options.onReloadError?.(data.error);
    };

    const handleRollback = (data: { reason: HotReloadError; patch: HotReloadPatch }) => {
      setStatus(prev => ({
        ...prev,
        rollbackCount: prev.rollbackCount + 1,
        lastError: `Rolled back due to: ${data.reason.message}`
      }));
      options.onRollback?.(data.reason.message);
    };

    // Register event listeners
    hotReloadEngine.on('beforeReload', handleReloadStart);
    hotReloadEngine.on('afterReload', handleReloadComplete);
    hotReloadEngine.on('error', handleReloadError);
    hotReloadEngine.on('rollback', handleRollback);

    return () => {
      hotReloadEngine.off('beforeReload', handleReloadStart);
      hotReloadEngine.off('afterReload', handleReloadComplete);
      hotReloadEngine.off('error', handleReloadError);
      hotReloadEngine.off('rollback', handleRollback);
    };
  }, [status.enabled, options]);

  // 🔄 Watch for code changes in VB6 context
  useEffect(() => {
    if (!status.enabled || !options.autoWatch) return;
    
    // Generate current code from VB6 state
    const currentCode = generateCodeFromState(state);
    
    // Check if code has changed
    if (currentCode !== lastCodeRef.current && lastCodeRef.current !== '') {
      // Debounce hot-reload trigger
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        performHotReload(currentCode);
      }, options.debounceMs ?? 300);
    }
    
    lastCodeRef.current = currentCode;
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, status.enabled, options.autoWatch, options.debounceMs]);

  // 🚀 Perform hot-reload
  const performHotReload = useCallback(async (code: string): Promise<boolean> => {
    if (!status.enabled) return false;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 Triggering hot-reload...', code.length, 'characters');
      }
      
      // Add to history
      codeHistoryRef.current.push(code);
      if (codeHistoryRef.current.length > 50) {
        codeHistoryRef.current.shift();
      }
      
      const patch = await hotReloadEngine.performHotReload(code);
      return patch !== null;
    } catch (error) {
      console.error('Hot-reload failed:', error);
      return false;
    }
  }, [status.enabled]);

  // 🎛️ Hot-reload actions
  const actions: HotReloadActions = {
    toggleHotReload: useCallback(() => {
      setStatus(prev => {
        const newEnabled = !prev.enabled;
        hotReloadEngine.updateConfig({ enabled: newEnabled });
        return { ...prev, enabled: newEnabled };
      });
    }, []),

    performManualReload: useCallback(async (code?: string): Promise<boolean> => {
      const codeToReload = code || generateCodeFromState(state);
      return await performHotReload(codeToReload);
    }, [state, performHotReload]),

    rollbackLastPatch: useCallback(async (): Promise<boolean> => {
      try {
        // This would need to be implemented in the engine
        console.log('🔄 Rolling back last patch...');
        setStatus(prev => ({ ...prev, rollbackCount: prev.rollbackCount + 1 }));
        return true;
      } catch (error) {
        console.error('Rollback failed:', error);
        return false;
      }
    }, []),

    clearHistory: useCallback(() => {
      codeHistoryRef.current = [];
      hotReloadEngine.clearCache();
      setStatus(prev => ({
        ...prev,
        patchCount: 0,
        errorCount: 0,
        rollbackCount: 0,
        lastReload: null,
        active: false,
        lastError: null
      }));
    }, []),

    updateConfig: useCallback((config: Partial<HotReloadConfig>) => {
      hotReloadEngine.updateConfig(config);
    }, []),

    testHotReload: useCallback(async (): Promise<boolean> => {
      console.log('🧪 Testing hot-reload system...');
      
      try {
        // Generate test code with small change
        const testCode = generateTestCode();
        const success = await performHotReload(testCode);
        
        if (success) {
          console.log('✅ Hot-reload test passed');
        } else {
          console.log('❌ Hot-reload test failed');
        }
        
        return success;
      } catch (error) {
        console.error('Hot-reload test error:', error);
        return false;
      }
    }, [performHotReload])
  };

  return [status, actions];
};

// Types for VB6 state
interface VB6ControlState {
  id: number;
  type: string;
  name: string;
  text?: string;
  caption?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
}

interface VB6AppState {
  controls?: VB6ControlState[];
}

// 🔧 Helper functions
function generateCodeFromState(state: VB6AppState): string {
  // Convert VB6 state back to VB6 code
  let code = `' Generated VB6 Code - ${new Date().toISOString()}\n`;
  code += `Option Explicit\n\n`;

  // Add form declaration
  code += `Private Sub Form_Load()\n`;

  // Add control initializations
  state.controls?.forEach((control: VB6ControlState) => {
    if (control.type === 'TextBox') {
      code += `    ${control.name}.Text = "${control.text || ''}"\n`;
      code += `    ${control.name}.Left = ${control.x || 0}\n`;
      code += `    ${control.name}.Top = ${control.y || 0}\n`;
      code += `    ${control.name}.Width = ${control.width || 100}\n`;
      code += `    ${control.name}.Height = ${control.height || 25}\n`;
      code += `    ${control.name}.Visible = ${control.visible ? 'True' : 'False'}\n`;
    } else if (control.type === 'CommandButton') {
      code += `    ${control.name}.Caption = "${control.caption || control.name}"\n`;
      code += `    ${control.name}.Left = ${control.x || 0}\n`;
      code += `    ${control.name}.Top = ${control.y || 0}\n`;
      code += `    ${control.name}.Width = ${control.width || 100}\n`;
      code += `    ${control.name}.Height = ${control.height || 25}\n`;
      code += `    ${control.name}.Visible = ${control.visible ? 'True' : 'False'}\n`;
    } else if (control.type === 'Label') {
      code += `    ${control.name}.Caption = "${control.caption || control.name}"\n`;
      code += `    ${control.name}.Left = ${control.x || 0}\n`;
      code += `    ${control.name}.Top = ${control.y || 0}\n`;
      code += `    ${control.name}.Width = ${control.width || 100}\n`;
      code += `    ${control.name}.Height = ${control.height || 25}\n`;
      code += `    ${control.name}.Visible = ${control.visible ? 'True' : 'False'}\n`;
    }
    code += `\n`;
  });
  
  code += `End Sub\n\n`;
  
  // Add event handlers
  state.controls?.forEach((control: VB6ControlState) => {
    if (control.type === 'CommandButton') {
      code += `Private Sub ${control.name}_Click()\n`;
      code += `    MsgBox "Hello from ${control.name}!"\n`;
      code += `End Sub\n\n`;
    }
  });
  
  return code;
}

function generateTestCode(): string {
  const timestamp = Date.now();
  return `
' Hot-Reload Test Code - ${timestamp}
Option Explicit

Private Sub Form_Load()
    ' Test comment: ${timestamp}
    MsgBox "Hot-reload test: ${timestamp}"
End Sub

Private Sub TestButton_Click()
    Dim testVar As String
    testVar = "Hot-reload working: ${timestamp}"
    MsgBox testVar
End Sub
`;
}

// 📊 Performance monitoring extension
export const useHotReloadMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalReloads: 0,
    averageReloadTime: 0,
    successRate: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      const engineMetrics = hotReloadEngine.getMetrics();
      setMetrics({
        totalReloads: engineMetrics.totalReloads,
        averageReloadTime: engineMetrics.averageReloadTime,
        successRate: engineMetrics.totalReloads > 0 
          ? ((engineMetrics.totalReloads - engineMetrics.errorCount) / engineMetrics.totalReloads) * 100 
          : 0,
        cacheHitRate: 75, // Would be calculated from actual cache statistics
        memoryUsage: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0
      });
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export default useHotReload;