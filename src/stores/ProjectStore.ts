/**
 * ULTRA-OPTIMIZED PROJECT STORE
 * Gère exclusivement l'état des projets, formulaires et modules
 * Séparé du store monolithique pour des performances optimales
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { Control } from '../context/types';

// Types pour les valeurs de propriétés VB6
export type VB6PropertyValue = string | number | boolean | null;

// Types pour l'historique d'actions
export interface HistoryActionData {
  form?: VB6Form;
  formId?: number;
  module?: VB6Module;
  moduleId?: number;
  oldName?: string;
  newName?: string;
  sourceId?: number;
  newForm?: VB6Form;
}

// Types pour les données de projet chargées
export interface ProjectData {
  metadata?: Partial<ProjectMetadata>;
  forms?: VB6Form[];
  modules?: VB6Module[];
  classModules?: VB6Module[];
  userControls?: VB6Module[];
  references?: VB6Reference[];
  components?: VB6Component[];
  activeFormId?: number | null;
}

// Types spécialisés pour le store projet
export interface VB6Form {
  id: number;
  name: string;
  caption: string;
  controls: Control[];
  properties: Record<string, VB6PropertyValue>;
  code: Record<string, string>;
  dirty: boolean;
  lastModified: Date;
}

export interface VB6Module {
  id: number;
  name: string;
  type: 'standard' | 'class' | 'user-control';
  code: string;
  dirty: boolean;
  lastModified: Date;
}

export interface VB6Reference {
  name: string;
  location: string;
  checked: boolean;
  builtin: boolean;
  version?: string;
  description?: string;
}

export interface VB6Component {
  name: string;
  filename: string;
  selected: boolean;
  version?: string;
  description?: string;
}

export interface ProjectMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  created: Date;
  lastModified: Date;
  buildPath: string;
  startupObject: string;
  projectType: 'exe' | 'dll' | 'ocx' | 'control';
  compatibilityMode: boolean;
  threadingModel: 'apartment' | 'single' | 'free';
}

// État optimisé du store projet
interface ProjectState {
  // Métadonnées du projet
  metadata: ProjectMetadata;

  // Structure du projet
  forms: VB6Form[];
  modules: VB6Module[];
  classModules: VB6Module[];
  userControls: VB6Module[];

  // Références et composants
  references: VB6Reference[];
  components: VB6Component[];

  // État de navigation
  activeFormId: number | null;
  activeModuleId: number | null;

  // État global du projet
  isDirty: boolean;
  isLoading: boolean;
  lastSaved: Date | null;

  // Historique des modifications
  undoStack: Array<{
    action: string;
    timestamp: Date;
    data: HistoryActionData;
  }>;
  redoStack: Array<{
    action: string;
    timestamp: Date;
    data: HistoryActionData;
  }>;
}

// Actions optimisées du store projet
interface ProjectActions {
  // Gestion du projet
  createNewProject: (name: string, type?: string) => void;
  loadProject: (projectData: ProjectData) => void;
  saveProject: () => Promise<boolean>;
  saveProjectAs: (name: string) => Promise<boolean>;
  closeProject: () => void;

  // Gestion des formulaires
  createForm: (name?: string) => VB6Form;
  deleteForm: (formId: number) => void;
  renameForm: (formId: number, newName: string) => void;
  duplicateForm: (formId: number) => VB6Form;
  setActiveForm: (formId: number) => void;
  updateFormMetadata: (formId: number, metadata: Partial<VB6Form>) => void;

  // Gestion des modules
  createModule: (type: 'standard' | 'class' | 'user-control', name?: string) => VB6Module;
  deleteModule: (moduleId: number) => void;
  renameModule: (moduleId: number, newName: string) => void;
  setActiveModule: (moduleId: number) => void;
  updateModuleCode: (moduleId: number, code: string) => void;

  // Gestion des références
  addReference: (reference: VB6Reference) => void;
  removeReference: (name: string) => void;
  toggleReference: (name: string) => void;

  // Gestion des composants
  addComponent: (component: VB6Component) => void;
  removeComponent: (filename: string) => void;
  toggleComponent: (filename: string) => void;

  // Historique et undo/redo
  pushToHistory: (action: string, data: HistoryActionData) => void;
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;

  // Utilitaires
  markDirty: () => void;
  markClean: () => void;
  getProjectSize: () => number;
  exportProject: (format: 'vbp' | 'json' | 'zip') => Promise<Blob>;
  importProject: (file: File) => Promise<boolean>;
}

type ProjectStore = ProjectState & ProjectActions;

// Configuration par défaut optimisée
const DEFAULT_PROJECT_METADATA: ProjectMetadata = {
  name: 'Project1',
  version: '1.0.0',
  description: 'New VB6 Project',
  author: 'Developer',
  created: new Date(),
  lastModified: new Date(),
  buildPath: './bin',
  startupObject: 'Form1',
  projectType: 'exe',
  compatibilityMode: false,
  threadingModel: 'apartment',
};

const DEFAULT_REFERENCES: VB6Reference[] = [
  {
    name: 'Visual Basic For Applications',
    location: 'VBA6.DLL',
    checked: true,
    builtin: true,
    version: '6.0.0.0',
    description: 'Microsoft Visual Basic for Applications Extensibility 5.3',
  },
  {
    name: 'Visual Basic runtime objects and procedures',
    location: 'MSVBVM60.DLL',
    checked: true,
    builtin: true,
    version: '6.0.0.0',
    description: 'Microsoft Visual Basic 6.0 Runtime',
  },
  {
    name: 'Visual Basic objects and procedures',
    location: 'VB6.OLB',
    checked: true,
    builtin: true,
    version: '6.0.0.0',
    description: 'Microsoft Visual Basic 6.0 Object Library',
  },
  {
    name: 'OLE Automation',
    location: 'stdole2.tlb',
    checked: true,
    builtin: true,
    version: '2.0.0.0',
    description: 'Microsoft OLE 2.40 for Windows NT and Windows 95',
  },
];

// ULTRA-OPTIMIZED PROJECT STORE avec middlewares avancés
export const useProjectStore = create<ProjectStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // État initial optimisé
        metadata: DEFAULT_PROJECT_METADATA,
        forms: [
          {
            id: 1,
            name: 'Form1',
            caption: 'Form1',
            controls: [],
            properties: {
              BackColor: '#8000000F',
              BorderStyle: '2',
              ClientHeight: '3195',
              ClientLeft: '60',
              ClientTop: '345',
              ClientWidth: '4680',
              MaxButton: 'True',
              MinButton: 'True',
              Moveable: 'True',
              ScaleHeight: '213',
              ScaleMode: '3',
              ScaleWidth: '312',
              ShowInTaskbar: 'True',
              StartUpPosition: '3',
              WindowState: '0',
            },
            code: {},
            dirty: false,
            lastModified: new Date(),
          },
        ],
        modules: [],
        classModules: [],
        userControls: [],
        references: DEFAULT_REFERENCES,
        components: [],
        activeFormId: 1,
        activeModuleId: null,
        isDirty: false,
        isLoading: false,
        lastSaved: null,
        undoStack: [],
        redoStack: [],

        // Actions optimisées avec Immer pour immutabilité
        createNewProject: (name: string, type = 'exe') =>
          set(state => {
            state.metadata = {
              ...DEFAULT_PROJECT_METADATA,
              name,
              projectType: type as ProjectMetadata['projectType'],
              created: new Date(),
              lastModified: new Date(),
            };

            state.forms = [
              {
                id: 1,
                name: 'Form1',
                caption: 'Form1',
                controls: [],
                properties: { ...(state.forms[0]?.properties || {}) },
                code: {},
                dirty: false,
                lastModified: new Date(),
              },
            ];

            state.modules = [];
            state.classModules = [];
            state.userControls = [];
            state.activeFormId = 1;
            state.activeModuleId = null;
            state.isDirty = false;
            state.lastSaved = null;
            state.undoStack = [];
            state.redoStack = [];
          }),

        loadProject: (projectData: ProjectData) =>
          set(state => {
            try {
              state.metadata = { ...DEFAULT_PROJECT_METADATA, ...projectData.metadata };
              state.forms = projectData.forms || [];
              state.modules = projectData.modules || [];
              state.classModules = projectData.classModules || [];
              state.userControls = projectData.userControls || [];
              state.references = projectData.references || DEFAULT_REFERENCES;
              state.components = projectData.components || [];
              state.activeFormId = projectData.activeFormId || state.forms[0]?.id || null;
              state.isDirty = false;
              state.isLoading = false;
              state.lastSaved = new Date();
            } catch (error) {
              console.error('❌ Error loading project:', error);
              state.isLoading = false;
            }
          }),

        saveProject: async () => {
          const state = get();

          try {
            const projectData = {
              metadata: {
                ...state.metadata,
                lastModified: new Date(),
              },
              forms: state.forms,
              modules: state.modules,
              classModules: state.classModules,
              userControls: state.userControls,
              references: state.references,
              components: state.components,
              activeFormId: state.activeFormId,
            };

            // Simuler la sauvegarde (en réalité, utiliserait File System Access API)
            localStorage.setItem('vb6-project-' + state.metadata.name, JSON.stringify(projectData));

            set(draft => {
              draft.isDirty = false;
              draft.lastSaved = new Date();
              draft.metadata.lastModified = new Date();
            });

            return true;
          } catch (error) {
            console.error('❌ Error saving project:', error);
            return false;
          }
        },

        saveProjectAs: async (name: string) => {
          set(state => {
            state.metadata.name = name;
          });
          return get().saveProject();
        },

        closeProject: () =>
          set(state => {
            // Reset to default state
            state.metadata = DEFAULT_PROJECT_METADATA;
            state.forms = [];
            state.modules = [];
            state.classModules = [];
            state.userControls = [];
            state.activeFormId = null;
            state.activeModuleId = null;
            state.isDirty = false;
            state.lastSaved = null;
            state.undoStack = [];
            state.redoStack = [];
          }),

        createForm: (name?: string) => {
          const state = get();
          const nextId = Math.max(...state.forms.map(f => f.id), 0) + 1;
          const formName = name || `Form${nextId}`;

          const newForm: VB6Form = {
            id: nextId,
            name: formName,
            caption: formName,
            controls: [],
            properties: {
              BackColor: '#8000000F',
              BorderStyle: '2',
              ClientHeight: '3195',
              ClientLeft: '60',
              ClientTop: '345',
              ClientWidth: '4680',
              MaxButton: 'True',
              MinButton: 'True',
              ScaleHeight: '213',
              ScaleMode: '3',
              ScaleWidth: '312',
              StartUpPosition: '3',
            },
            code: {},
            dirty: false,
            lastModified: new Date(),
          };

          set(draft => {
            draft.forms.push(newForm);
            draft.activeFormId = nextId;
            draft.isDirty = true;
            draft.pushToHistory('createForm', { form: newForm });
          });

          return newForm;
        },

        deleteForm: (formId: number) =>
          set(state => {
            const formIndex = state.forms.findIndex(f => f.id === formId);
            if (formIndex === -1) return;

            const deletedForm = state.forms[formIndex];
            state.forms.splice(formIndex, 1);

            // Ajuster l'ID actif si nécessaire
            if (state.activeFormId === formId) {
              state.activeFormId = state.forms[0]?.id || null;
            }

            state.isDirty = true;
            state.pushToHistory.call(state, 'deleteForm', { form: deletedForm });
          }),

        renameForm: (formId: number, newName: string) =>
          set(state => {
            const form = state.forms.find(f => f.id === formId);
            if (!form) return;

            const oldName = form.name;
            form.name = newName;
            form.caption = newName;
            form.dirty = true;
            form.lastModified = new Date();
            state.isDirty = true;

            state.pushToHistory.call(state, 'renameForm', { formId, oldName, newName });
          }),

        duplicateForm: (formId: number) => {
          const state = get();
          const sourceForm = state.forms.find(f => f.id === formId);
          if (!sourceForm) return sourceForm!;

          const nextId = Math.max(...state.forms.map(f => f.id), 0) + 1;
          const newName = `${sourceForm.name}_Copy`;

          const newForm: VB6Form = {
            ...sourceForm,
            id: nextId,
            name: newName,
            caption: newName,
            controls: sourceForm.controls.map(ctrl => ({
              ...ctrl,
              id: ctrl.id + 1000, // Offset IDs to avoid conflicts
            })),
            dirty: false,
            lastModified: new Date(),
          };

          set(draft => {
            draft.forms.push(newForm);
            draft.activeFormId = nextId;
            draft.isDirty = true;
            draft.pushToHistory('duplicateForm', { sourceId: formId, newForm });
          });

          return newForm;
        },

        setActiveForm: (formId: number) =>
          set(state => {
            if (state.forms.some(f => f.id === formId)) {
              state.activeFormId = formId;
            }
          }),

        updateFormMetadata: (formId: number, metadata: Partial<VB6Form>) =>
          set(state => {
            const form = state.forms.find(f => f.id === formId);
            if (!form) return;

            Object.assign(form, metadata);
            form.dirty = true;
            form.lastModified = new Date();
            state.isDirty = true;
          }),

        // Module management
        createModule: (type: 'standard' | 'class' | 'user-control', name?: string) => {
          const state = get();
          const modules =
            type === 'class'
              ? state.classModules
              : type === 'user-control'
                ? state.userControls
                : state.modules;

          const nextId = Math.max(...modules.map(m => m.id), 0) + 1;
          const moduleName = name || `Module${nextId}`;

          const newModule: VB6Module = {
            id: nextId,
            name: moduleName,
            type,
            code:
              type === 'class'
                ? `VERSION 1.0 CLASS\nBEGIN\n  MultiUse = -1  'True\nEND\nAttribute VB_Name = "${moduleName}"\n\n`
                : `Attribute VB_Name = "${moduleName}"\n\n`,
            dirty: false,
            lastModified: new Date(),
          };

          set(draft => {
            if (type === 'class') {
              draft.classModules.push(newModule);
            } else if (type === 'user-control') {
              draft.userControls.push(newModule);
            } else {
              draft.modules.push(newModule);
            }

            draft.activeModuleId = nextId;
            draft.isDirty = true;
            draft.pushToHistory('createModule', { module: newModule });
          });

          return newModule;
        },

        deleteModule: (moduleId: number) =>
          set(state => {
            let deletedModule: VB6Module | undefined;

            // Chercher dans tous les types de modules
            const moduleArrays = [state.modules, state.classModules, state.userControls];

            for (const modules of moduleArrays) {
              const index = modules.findIndex(m => m.id === moduleId);
              if (index !== -1) {
                deletedModule = modules[index];
                modules.splice(index, 1);
                break;
              }
            }

            if (deletedModule) {
              if (state.activeModuleId === moduleId) {
                state.activeModuleId = null;
              }
              state.isDirty = true;
              state.pushToHistory.call(state, 'deleteModule', { module: deletedModule });
            }
          }),

        renameModule: (moduleId: number, newName: string) =>
          set(state => {
            const moduleArrays = [state.modules, state.classModules, state.userControls];
            let foundModule: VB6Module | undefined;

            for (const modules of moduleArrays) {
              foundModule = modules.find(m => m.id === moduleId);
              if (foundModule) break;
            }

            if (foundModule) {
              const oldName = foundModule.name;
              foundModule.name = newName;
              foundModule.dirty = true;
              foundModule.lastModified = new Date();
              state.isDirty = true;

              state.pushToHistory.call(state, 'renameModule', { moduleId, oldName, newName });
            }
          }),

        setActiveModule: (moduleId: number) =>
          set(state => {
            const moduleArrays = [state.modules, state.classModules, state.userControls];
            const moduleExists = moduleArrays.some(modules => modules.some(m => m.id === moduleId));

            if (moduleExists) {
              state.activeModuleId = moduleId;
              state.activeFormId = null; // Désélectionner le formulaire actif
            }
          }),

        updateModuleCode: (moduleId: number, code: string) =>
          set(state => {
            const moduleArrays = [state.modules, state.classModules, state.userControls];
            let foundModule: VB6Module | undefined;

            for (const modules of moduleArrays) {
              foundModule = modules.find(m => m.id === moduleId);
              if (foundModule) break;
            }

            if (foundModule) {
              foundModule.code = code;
              foundModule.dirty = true;
              foundModule.lastModified = new Date();
              state.isDirty = true;
            }
          }),

        // Reference management
        addReference: (reference: VB6Reference) =>
          set(state => {
            if (!state.references.some(ref => ref.name === reference.name)) {
              state.references.push(reference);
              state.isDirty = true;
            }
          }),

        removeReference: (name: string) =>
          set(state => {
            const index = state.references.findIndex(ref => ref.name === name);
            if (index !== -1 && !state.references[index].builtin) {
              state.references.splice(index, 1);
              state.isDirty = true;
            }
          }),

        toggleReference: (name: string) =>
          set(state => {
            const reference = state.references.find(ref => ref.name === name);
            if (reference) {
              reference.checked = !reference.checked;
              state.isDirty = true;
            }
          }),

        // Component management
        addComponent: (component: VB6Component) =>
          set(state => {
            if (!state.components.some(comp => comp.filename === component.filename)) {
              state.components.push(component);
              state.isDirty = true;
            }
          }),

        removeComponent: (filename: string) =>
          set(state => {
            const index = state.components.findIndex(comp => comp.filename === filename);
            if (index !== -1) {
              const component = state.components[index];
              state.components.splice(index, 1);
              state.isDirty = true;
            }
          }),

        toggleComponent: (filename: string) =>
          set(state => {
            const component = state.components.find(comp => comp.filename === filename);
            if (component) {
              component.selected = !component.selected;
              state.isDirty = true;
            }
          }),

        // History management
        pushToHistory: (action: string, data: HistoryActionData) =>
          set(state => {
            state.undoStack.push({
              action,
              timestamp: new Date(),
              data,
            });

            // Limiter la taille de l'historique
            if (state.undoStack.length > 50) {
              state.undoStack.shift();
            }

            // Vider la pile redo
            state.redoStack = [];
          }),

        undo: () => {
          const state = get();
          const lastAction = state.undoStack.pop();

          if (lastAction) {
            set(draft => {
              draft.redoStack.push(lastAction);
              // Implémenter la logique d'undo spécifique selon l'action
            });
            return true;
          }
          return false;
        },

        redo: () => {
          const state = get();
          const nextAction = state.redoStack.pop();

          if (nextAction) {
            set(draft => {
              draft.undoStack.push(nextAction);
              // Implémenter la logique de redo spécifique selon l'action
            });
            return true;
          }
          return false;
        },

        clearHistory: () =>
          set(state => {
            state.undoStack = [];
            state.redoStack = [];
          }),

        // Utility methods
        markDirty: () =>
          set(state => {
            state.isDirty = true;
          }),

        markClean: () =>
          set(state => {
            state.isDirty = false;
            state.lastSaved = new Date();
          }),

        getProjectSize: () => {
          const state = get();
          const size = JSON.stringify({
            metadata: state.metadata,
            forms: state.forms,
            modules: state.modules,
            classModules: state.classModules,
            userControls: state.userControls,
          }).length;

          return size;
        },

        exportProject: async (format: 'vbp' | 'json' | 'zip') => {
          const state = get();

          const projectData = {
            metadata: state.metadata,
            forms: state.forms,
            modules: state.modules,
            classModules: state.classModules,
            userControls: state.userControls,
            references: state.references,
            components: state.components,
          };

          if (format === 'json') {
            const jsonString = JSON.stringify(projectData, null, 2);
            return new Blob([jsonString], { type: 'application/json' });
          }

          // Pour VBP et ZIP, implémenter la logique de conversion
          return new Blob(['Not implemented yet'], { type: 'text/plain' });
        },

        importProject: async (file: File) => {
          try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            get().loadProject(projectData);

            return true;
          } catch (error) {
            console.error('❌ Error importing project:', error);
            return false;
          }
        },
      })),
      {
        name: 'project-store',
        version: 1,
      }
    )
  )
);

// Sélecteurs optimisés pour éviter les re-renders inutiles
export const projectSelectors = {
  // Sélecteurs de base
  getActiveForm: () => {
    const { forms, activeFormId } = useProjectStore.getState();
    return forms.find(f => f.id === activeFormId) || null;
  },

  getActiveModule: () => {
    const { modules, classModules, userControls, activeModuleId } = useProjectStore.getState();
    if (!activeModuleId) return null;

    return (
      [...modules, ...classModules, ...userControls].find(m => m.id === activeModuleId) || null
    );
  },

  // Sélecteurs de métadonnées
  getProjectInfo: () => {
    const { metadata, isDirty, lastSaved } = useProjectStore.getState();
    return { metadata, isDirty, lastSaved };
  },

  // Sélecteurs de listes
  getAllForms: () => useProjectStore.getState().forms,
  getAllModules: () => {
    const { modules, classModules, userControls } = useProjectStore.getState();
    return [...modules, ...classModules, ...userControls];
  },

  getEnabledReferences: () => useProjectStore.getState().references.filter(ref => ref.checked),

  getSelectedComponents: () => useProjectStore.getState().components.filter(comp => comp.selected),
};
