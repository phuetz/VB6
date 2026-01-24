import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { vb6Reducer, initialState } from './vb6Reducer';
import { VB6State, VB6Action, Control, ControlPropertyValue, VB6Value } from './types';
import { FileManager } from '../services/FileManager';
import JSZip from 'jszip';

interface VB6ContextType {
  state: VB6State;
  dispatch: React.Dispatch<VB6Action>;
  // Actions
  createControl: (type: string, x?: number, y?: number) => void;
  updateControl: (controlId: number, property: string, value: ControlPropertyValue) => void;
  deleteControls: (controlIds: number[]) => void;
  selectControls: (controlIds: number[]) => void;
  copyControls: () => void;
  pasteControls: () => void;
  undo: () => void;
  redo: () => void;
  executeEvent: (control: Control, eventName: string, eventData?: Record<string, VB6Value>) => void;
  saveProject: () => void;
  loadProject: (file: File) => void;
}

const VB6Context = createContext<VB6ContextType | null>(null);

export const useVB6 = () => {
  const context = useContext(VB6Context);
  if (!context) {
    throw new Error('useVB6 must be used within a VB6Provider');
  }
  return context;
};

export const VB6Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔄 VB6Provider initializing...');
  const [state, dispatch] = useReducer(vb6Reducer, initialState);
  console.log('✅ VB6Provider initialized with state:', state);

  const createControl = useCallback((type: string, x?: number, y?: number) => {
    console.log('Creating control in context:', type, x, y);
    dispatch({
      type: 'CREATE_CONTROL',
      payload: { type, x: x || 50, y: y || 50 },
    });
  }, []);

  const updateControl = useCallback((controlId: number, property: string, value: ControlPropertyValue) => {
    dispatch({
      type: 'UPDATE_CONTROL',
      payload: { controlId, property, value },
    });
  }, []);

  const deleteControls = useCallback((controlIds: number[]) => {
    dispatch({
      type: 'DELETE_CONTROLS',
      payload: { controlIds },
    });
  }, []);

  const selectControls = useCallback((controlIds: number[]) => {
    dispatch({
      type: 'SELECT_CONTROLS',
      payload: { controlIds },
    });
  }, []);

  const copyControls = useCallback(() => {
    dispatch({ type: 'COPY_CONTROLS' });
  }, []);

  const pasteControls = useCallback(() => {
    dispatch({ type: 'PASTE_CONTROLS' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const executeEvent = useCallback(
    async (control: Control, eventName: string, eventData?: Record<string, VB6Value>) => {
      const eventKey = `${control.name}_${eventName}`;
      const code = state.eventCode[eventKey];

      if (code) {
        try {
          // ASYNC/AWAIT LOGIC BUG FIX: Function must be async to use await
          const safeEvaluator = await import('../utils/safeExpressionEvaluator');
          const context = { control, eventData };
          await safeEvaluator.evaluateVB6Code(code, context);
        } catch (err) {
          console.error(`Error executing ${eventKey}:`, err);
        }
      }

      dispatch({
        type: 'EXECUTE_EVENT',
        payload: { control, eventName, eventData },
      });
    },
    [state.eventCode, dispatch]
  );

  // ASYNC/AWAIT FIX: Add proper error handling for async saveProject
  const saveProject = useCallback(async () => {
    try {
      const project = {
        name: state.projectName,
        forms: state.forms,
        modules: state.modules,
        classModules: state.classModules,
      };
      await FileManager.exportProjectArchive(project as any);
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error; // Re-throw to let caller handle UI feedback
    }
  }, [state]);

  // ASYNC/AWAIT FIX: Fix variable shadowing and improve error handling
  const loadProject = useCallback(async (file: File) => {
    try {
      if (file.name.endsWith('.vb6z') || file.name.endsWith('.zip')) {
        const project = await FileManager.importProjectArchive(file);
        if (project) {
          dispatch({ type: 'SET_PROJECT', payload: { project } });
          console.log('Archive project loaded successfully');
        } else {
          throw new Error('Failed to extract project from archive');
        }
      } else {
        const projectText = await file.text();
        if (!projectText.trim()) {
          throw new Error('Project file is empty');
        }
        
        let project;
        try {
          project = JSON.parse(projectText);
        } catch (parseError) {
          throw new Error(`Invalid JSON in project file: ${parseError.message}`);
        }
        
        dispatch({ type: 'SET_PROJECT', payload: { project } });
        console.log('Text project loaded successfully');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      // Re-throw with more context for UI error handling
      throw new Error(`Project loading failed: ${err.message}`);
    }
  }, []);

  const contextValue: VB6ContextType = {
    state,
    dispatch,
    createControl,
    updateControl,
    deleteControls,
    selectControls,
    copyControls,
    pasteControls,
    undo,
    redo,
    executeEvent,
    saveProject,
    loadProject,
  };

  return <VB6Context.Provider value={contextValue}>{children}</VB6Context.Provider>;
};
