import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { vb6Reducer, initialState } from './vb6Reducer';
import { VB6State, VB6Action } from './types';
import { FileManager } from '../services/FileManager';
import JSZip from 'jszip';

interface VB6ContextType {
  state: VB6State;
  dispatch: React.Dispatch<VB6Action>;
  // Actions
  createControl: (type: string, x?: number, y?: number) => void;
  updateControl: (controlId: number, property: string, value: any) => void;
  deleteControls: (controlIds: number[]) => void;
  selectControls: (controlIds: number[]) => void;
  copyControls: () => void;
  pasteControls: () => void;
  undo: () => void;
  redo: () => void;
  executeEvent: (control: any, eventName: string, eventData?: any) => void;
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
  const [state, dispatch] = useReducer(vb6Reducer, initialState);

  const createControl = useCallback((type: string, x?: number, y?: number) => {
    console.log('Creating control in context:', type, x, y);
    dispatch({
      type: 'CREATE_CONTROL',
      payload: { type, x: x || 50, y: y || 50 },
    });
  }, []);

  const updateControl = useCallback((controlId: number, property: string, value: any) => {
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
    (control: any, eventName: string, eventData?: any) => {
      const eventKey = `${control.name}_${eventName}`;
      const code = state.eventCode[eventKey];

      if (code) {
        try {
          const func = new Function('control', 'eventData', code);
          func(control, eventData);
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

  const saveProject = useCallback(async () => {
    const project = {
      name: state.projectName,
      forms: state.forms,
      modules: state.modules,
      classModules: state.classModules,
    };
    await FileManager.exportProjectArchive(project as any);
  }, [state]);

  const loadProject = useCallback(async (file: File) => {
    try {
      let projectText: string;
      if (file.name.endsWith('.vb6z') || file.name.endsWith('.zip')) {
        const project = await FileManager.importProjectArchive(file);
        if (project) {
          dispatch({ type: 'SET_PROJECT', payload: { project } });
        }
      } else {
        const projectText = await file.text();
        const project = JSON.parse(projectText);
        dispatch({ type: 'SET_PROJECT', payload: { project } });
      }
    } catch (err) {
      console.error('Failed to load project', err);
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
