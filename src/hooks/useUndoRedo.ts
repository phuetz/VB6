// Enhanced React Hook for Granular Undo/Redo System
// Provides sophisticated operation tracking and intelligent history management

import { useState, useEffect, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { undoRedoService, UndoRedoAction, UndoRedoState } from '../services/UndoRedoService';
import { useVB6Store } from '../stores/vb6Store';
import { Control } from '../context/types';

// Snapshot types for undo/redo operations
export interface PositionSnapshot {
  id: number;
  x: number;
  y: number;
}

export interface SizeSnapshot extends PositionSnapshot {
  width: number;
  height: number;
}

// Property value type - can be any VB6 compatible value
export type PropertyValue = string | number | boolean | null | undefined | Date | object;

export interface UseUndoRedoReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  currentAction: UndoRedoAction | null;
  nextAction: UndoRedoAction | null;
  historySize: number;

  // Actions
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;

  // Recording functions
  recordCreate: (controls: Control[]) => void;
  recordDelete: (controls: Control[]) => void;
  recordMove: (
    controls: Control[],
    beforePositions: Array<{ id: number; x: number; y: number }>
  ) => void;
  recordResize: (
    controls: Control[],
    beforeSizes: Array<{ id: number; x: number; y: number; width: number; height: number }>
  ) => void;
  recordPropertyChange: (
    controls: Control[],
    property: string,
    beforeValues: PropertyValue[],
    afterValues: PropertyValue[]
  ) => void;
  recordCopy: (controls: Control[]) => void;
  recordPaste: (controls: Control[]) => void;
  recordDuplicate: (originalControls: Control[], duplicatedControls: Control[]) => void;
  recordAlign: (
    controls: Control[],
    alignType: string,
    beforePositions: Array<{ id: number; x: number; y: number }>
  ) => void;

  // History
  getHistory: () => UndoRedoAction[];
  getMemoryUsage: () => { actionsCount: number; estimatedSize: string };

  // Legacy compatibility
  saveState: (action: string) => void;
  getLastAction: () => string;
  clearHistory: () => void;
  historyLength: number;
}

export const useUndoRedo = (): UseUndoRedoReturn => {
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>(() => ({
    actions: [],
    currentIndex: -1,
    maxHistorySize: 100,
    isPerformingUndo: false,
    isPerformingRedo: false,
  }));

  const { controls, setControls, nextId, setNextId, selectedControls, selectControls } =
    useVB6Store(
      state => ({
        controls: state.controls,
        setControls: state.setControls,
        nextId: state.nextId,
        setNextId: state.setNextId,
        selectedControls: state.selectedControls,
        selectControls: state.selectControls,
      }),
      shallow
    );

  // Subscribe to undo/redo service changes
  useEffect(() => {
    const unsubscribe = undoRedoService.subscribe(setUndoRedoState);
    return unsubscribe;
  }, []);

  // Undo operation
  const undo = useCallback(async () => {
    const action = await undoRedoService.undo();
    if (!action) return;

    if (process.env.NODE_ENV === 'development') {
      // noop
    }

    switch (action.type) {
      case 'create': {
        // Remove created controls
        const idsToRemove = action.controls;
        const updatedControls = controls.filter(c => !idsToRemove.includes(c.id));
        setControls(updatedControls);
        selectControls([]);
        break;
      }

      case 'delete': {
        // Restore deleted controls
        if (action.data.deleted) {
          const restoredControls = [...controls, ...action.data.deleted];
          setControls(restoredControls);
          selectControls(action.controls);
        }
        break;
      }

      case 'move': {
        // Restore previous positions
        if (action.data.before) {
          const updatedControls = controls.map(control => {
            const beforePos = action.data.before?.find(
              (pos: PositionSnapshot) => pos.id === control.id
            );
            if (beforePos) {
              return { ...control, x: beforePos.x, y: beforePos.y };
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }

      case 'resize': {
        // Restore previous sizes
        if (action.data.before) {
          const updatedControls = controls.map(control => {
            const beforeSize = action.data.before?.find(
              (size: SizeSnapshot) => size.id === control.id
            );
            if (beforeSize) {
              return {
                ...control,
                x: beforeSize.x,
                y: beforeSize.y,
                width: beforeSize.width,
                height: beforeSize.height,
              };
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }

      case 'property_change': {
        // Restore previous property values
        if (action.data.before && action.data.properties) {
          const propertyNames = Object.keys(action.data.properties);
          const updatedControls = controls.map(control => {
            if (action.controls.includes(control.id)) {
              const controlIndex = action.controls.indexOf(control.id);
              const updatedControl = { ...control };

              propertyNames.forEach(propName => {
                if (Array.isArray(action.data.before) && controlIndex < action.data.before.length) {
                  (updatedControl as Record<string, unknown>)[propName] =
                    action.data.before[controlIndex];
                }
              });

              return updatedControl;
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }

      case 'paste':
      case 'duplicate': {
        // Remove pasted/duplicated controls
        const idsToRemove = action.controls;
        const updatedControls = controls.filter(c => !idsToRemove.includes(c.id));
        setControls(updatedControls);
        selectControls([]);
        break;
      }

      case 'align': {
        // Restore previous positions for alignment
        if (action.data.before) {
          const updatedControls = controls.map(control => {
            const beforePos = action.data.before?.find(
              (pos: PositionSnapshot) => pos.id === control.id
            );
            if (beforePos) {
              return { ...control, x: beforePos.x, y: beforePos.y };
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }
    }
  }, [controls, setControls, selectControls]);

  // Redo operation
  const redo = useCallback(async () => {
    const action = await undoRedoService.redo();
    if (!action) return;

    if (process.env.NODE_ENV === 'development') {
      // noop
    }

    switch (action.type) {
      case 'create': {
        // Re-add created controls
        if (action.data.created) {
          const restoredControls = [...controls, ...action.data.created];
          setControls(restoredControls);
          selectControls(action.controls);

          // Update nextId if needed
          const maxId = Math.max(...action.data.created.map(c => c.id));
          if (maxId >= nextId) {
            setNextId(maxId + 1);
          }
        }
        break;
      }

      case 'delete': {
        // Re-remove deleted controls
        const idsToRemove = action.controls;
        const updatedControls = controls.filter(c => !idsToRemove.includes(c.id));
        setControls(updatedControls);
        selectControls([]);
        break;
      }

      case 'move': {
        // Restore forward positions
        if (action.data.after) {
          const updatedControls = controls.map(control => {
            const afterPos = action.data.after?.find(
              (pos: PositionSnapshot) => pos.id === control.id
            );
            if (afterPos) {
              return { ...control, x: afterPos.x, y: afterPos.y };
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }

      case 'resize': {
        // Restore forward sizes
        if (action.data.after) {
          const updatedControls = controls.map(control => {
            const afterSize = action.data.after?.find(
              (size: SizeSnapshot) => size.id === control.id
            );
            if (afterSize) {
              return {
                ...control,
                x: afterSize.x,
                y: afterSize.y,
                width: afterSize.width,
                height: afterSize.height,
              };
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }

      case 'property_change': {
        // Restore forward property values
        if (action.data.after && action.data.properties) {
          const propertyNames = Object.keys(action.data.properties);
          const updatedControls = controls.map(control => {
            if (action.controls.includes(control.id)) {
              const controlIndex = action.controls.indexOf(control.id);
              const updatedControl = { ...control };

              propertyNames.forEach(propName => {
                if (Array.isArray(action.data.after) && controlIndex < action.data.after.length) {
                  (updatedControl as Record<string, unknown>)[propName] =
                    action.data.after[controlIndex];
                }
              });

              return updatedControl;
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }

      case 'paste':
      case 'duplicate': {
        // Re-add pasted/duplicated controls
        if (action.data.created) {
          const restoredControls = [...controls, ...action.data.created];
          setControls(restoredControls);
          selectControls(action.controls);
        }
        break;
      }

      case 'align': {
        // Restore forward positions for alignment
        if (action.data.after) {
          const updatedControls = controls.map(control => {
            const afterPos = action.data.after?.find(
              (pos: PositionSnapshot) => pos.id === control.id
            );
            if (afterPos) {
              return { ...control, x: afterPos.x, y: afterPos.y };
            }
            return control;
          });
          setControls(updatedControls);
        }
        break;
      }
    }
  }, [controls, setControls, selectControls, nextId, setNextId]);

  // Recording functions (delegate to the service)
  const recordCreate = useCallback((controls: Control[]) => {
    undoRedoService.recordCreate(controls);
  }, []);

  const recordDelete = useCallback((controls: Control[]) => {
    undoRedoService.recordDelete(controls);
  }, []);

  const recordMove = useCallback(
    (controls: Control[], beforePositions: Array<{ id: number; x: number; y: number }>) => {
      undoRedoService.recordMove(controls, beforePositions);
    },
    []
  );

  const recordResize = useCallback(
    (
      controls: Control[],
      beforeSizes: Array<{ id: number; x: number; y: number; width: number; height: number }>
    ) => {
      undoRedoService.recordResize(controls, beforeSizes);
    },
    []
  );

  const recordPropertyChange = useCallback(
    (
      controls: Control[],
      property: string,
      beforeValues: PropertyValue[],
      afterValues: PropertyValue[]
    ) => {
      undoRedoService.recordPropertyChange(controls, property, beforeValues, afterValues);
    },
    []
  );

  const recordCopy = useCallback((controls: Control[]) => {
    undoRedoService.recordCopy(controls);
  }, []);

  const recordPaste = useCallback((controls: Control[]) => {
    undoRedoService.recordPaste(controls);
  }, []);

  const recordDuplicate = useCallback(
    (originalControls: Control[], duplicatedControls: Control[]) => {
      undoRedoService.recordDuplicate(originalControls, duplicatedControls);
    },
    []
  );

  const recordAlign = useCallback(
    (
      controls: Control[],
      alignType: string,
      beforePositions: Array<{ id: number; x: number; y: number }>
    ) => {
      undoRedoService.recordAlign(controls, alignType, beforePositions);
    },
    []
  );

  const clear = useCallback(() => {
    undoRedoService.clear();
  }, []);

  const getHistory = useCallback(() => {
    return undoRedoService.getHistory();
  }, []);

  const getMemoryUsage = useCallback(() => {
    return undoRedoService.getMemoryUsage();
  }, []);

  // Legacy compatibility functions
  const saveState = useCallback(
    (action: string) => {
      // Convert legacy action to new granular system
      const affectedControls = selectedControls.length > 0 ? selectedControls : controls;
      if (affectedControls.length === 0) return;

      undoRedoService.recordAction({
        type: 'property_change', // Default type for legacy actions
        description: action,
        controls: affectedControls.map(c => c.id),
        data: { legacy: true },
      });
    },
    [controls, selectedControls]
  );

  const getLastAction = useCallback(() => {
    const currentAction = undoRedoService.getCurrentAction();
    return currentAction?.description || '';
  }, []);

  const clearHistory = useCallback(() => {
    undoRedoService.clear();
  }, []);

  return {
    // State
    canUndo: undoRedoService.canUndo(),
    canRedo: undoRedoService.canRedo(),
    currentAction: undoRedoService.getCurrentAction(),
    nextAction: undoRedoService.getNextAction(),
    historySize: undoRedoState.actions.length,

    // Actions
    undo,
    redo,
    clear,

    // Recording functions
    recordCreate,
    recordDelete,
    recordMove,
    recordResize,
    recordPropertyChange,
    recordCopy,
    recordPaste,
    recordDuplicate,
    recordAlign,

    // History
    getHistory,
    getMemoryUsage,

    // Legacy compatibility
    saveState,
    getLastAction,
    clearHistory,
    historyLength: undoRedoState.actions.length,
  };
};
