import { useCallback, useRef } from 'react';
import { useVB6Store } from '../stores/vb6Store';
import { shallow } from 'zustand/shallow';

interface HistoryState {
  controls: any[];
  selectedControls: any[];
  timestamp: number;
  action: string;
}

export const useUndoRedo = () => {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  
  const { controls, selectedControls, setExecutionMode } = useVB6Store(
    state => ({
      controls: state.controls,
      selectedControls: state.selectedControls,
      setExecutionMode: state.setExecutionMode,
    }),
    shallow
  );

  const saveState = useCallback((action: string) => {
    if (isUndoRedoRef.current) return;

    const newState: HistoryState = {
      controls: JSON.parse(JSON.stringify(controls)),
      selectedControls: JSON.parse(JSON.stringify(selectedControls)),
      timestamp: Date.now(),
      action
    };

    // Remove any states after current index (when new action after undo)
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(newState);
    currentIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
      currentIndexRef.current = historyRef.current.length - 1;
    }
  }, [controls, selectedControls]);

  const undo = useCallback(() => {
    if (currentIndexRef.current <= 0) return false;

    isUndoRedoRef.current = true;
    currentIndexRef.current--;
    
    const previousState = historyRef.current[currentIndexRef.current];
    if (previousState) {
      // Restore state using Zustand actions
      useVB6Store.setState({
        controls: previousState.controls,
        selectedControls: previousState.selectedControls
      });
    }

    isUndoRedoRef.current = false;
    return true;
  }, []);

  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return false;

    isUndoRedoRef.current = true;
    currentIndexRef.current++;
    
    const nextState = historyRef.current[currentIndexRef.current];
    if (nextState) {
      useVB6Store.setState({
        controls: nextState.controls,
        selectedControls: nextState.selectedControls
      });
    }

    isUndoRedoRef.current = false;
    return true;
  }, []);

  const canUndo = currentIndexRef.current > 0;
  const canRedo = currentIndexRef.current < historyRef.current.length - 1;

  const getLastAction = () => {
    const currentState = historyRef.current[currentIndexRef.current];
    return currentState?.action || '';
  };

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    getLastAction,
    clearHistory,
    historyLength: historyRef.current.length
  };
};