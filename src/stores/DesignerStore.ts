/**
 * ULTRA-OPTIMIZED DESIGNER STORE
 * Gère exclusivement l'état du designer : canvas, contrôles, sélection, manipulation
 * Architecture haute performance avec memoization et calculs optimisés
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { Control } from '../context/types';
import { getDefaultProperties } from '../utils/controlDefaults';

// Types pour les valeurs de propriétés de contrôle
export type ControlPropertyValue = string | number | boolean | null | undefined;

// Types pour les données de drag
export interface DragDataCreate {
  controlType: string;
}

export interface DragDataMove {
  controlIds: number[];
  originalPositions: Array<{ id: number; left: number; top: number }>;
}

export interface DragDataResize {
  controlId: number;
  handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  originalBounds: { left: number; top: number; width: number; height: number };
}

export type DragData = DragDataCreate | DragDataMove | DragDataResize | null;

// Types optimisés pour le designer
export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showAlignmentGuides: boolean;
  backgroundColor: string;
}

export interface SelectionState {
  selectedControlIds: number[];
  primarySelectionId: number | null;
  selectionBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  } | null;
  isMultiSelect: boolean;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'create' | 'move' | 'resize' | 'select' | null;
  dragStartPos: { x: number; y: number } | null;
  dragCurrentPos: { x: number; y: number } | null;
  dragData: DragData;
  previewControl: Control | null;
}

export interface ClipboardState {
  controls: Control[];
  operation: 'copy' | 'cut' | null;
  pasteOffset: number;
}

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
  temporary: boolean;
  controls: number[];
}

// État principal du designer
interface DesignerState {
  // Contrôles
  controls: Control[];
  nextControlId: number;
  
  // Canvas
  canvas: CanvasState;
  
  // Sélection
  selection: SelectionState;
  
  // Opérations de drag & drop
  drag: DragState;
  
  // Presse-papiers
  clipboard: ClipboardState;
  
  // Guides d'alignement
  alignmentGuides: AlignmentGuide[];
  staticGuides: AlignmentGuide[];
  
  // Mode d'édition
  editMode: 'select' | 'draw';
  activeToolType: string | null;
  
  // Historique pour undo/redo
  history: {
    undoStack: Array<{
      action: string;
      timestamp: Date;
      controls: Control[];
      nextId: number;
    }>;
    redoStack: Array<{
      action: string;
      timestamp: Date;
      controls: Control[];
      nextId: number;
    }>;
    maxHistorySize: number;
  };
  
  // Performance tracking
  lastRenderTime: number;
  renderCount: number;
  
  // État de verrouillage pour éviter les opérations simultanées
  isLocked: boolean;
}

// Actions du designer
interface DesignerActions {
  // Gestion des contrôles
  createControl: (type: string, x?: number, y?: number, properties?: Record<string, ControlPropertyValue>) => Control;
  deleteControls: (controlIds: number[]) => void;
  updateControl: (controlId: number, property: string, value: ControlPropertyValue) => void;
  updateControlBounds: (controlId: number, bounds: { left: number; top: number; width: number; height: number }) => void;
  duplicateControls: (controlIds: number[]) => Control[];
  getControl: (controlId: number) => Control | null;
  getAllControls: () => Control[];
  
  // Gestion de la sélection
  selectControl: (controlId: number, addToSelection?: boolean) => void;
  selectMultipleControls: (controlIds: number[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  selectInBounds: (bounds: { left: number; top: number; right: number; bottom: number }) => void;
  isControlSelected: (controlId: number) => boolean;
  getSelectedControls: () => Control[];
  getPrimarySelection: () => Control | null;
  
  // Opérations de canvas
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToWindow: () => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleRulers: () => void;
  toggleAlignmentGuides: () => void;
  panCanvas: (deltaX: number, deltaY: number) => void;
  resetPan: () => void;
  
  // Opérations de drag & drop
  startDrag: (type: 'create' | 'move' | 'resize' | 'select', pos: { x: number; y: number }, data?: DragData) => void;
  updateDrag: (pos: { x: number; y: number }) => void;
  endDrag: () => void;
  cancelDrag: () => void;
  
  // Opérations de presse-papiers
  copyControls: () => void;
  cutControls: () => void;
  pasteControls: () => void;
  canPaste: () => boolean;
  
  // Alignement et distribution
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  distributeHorizontally: () => void;
  distributeVertically: () => void;
  makeSameWidth: () => void;
  makeSameHeight: () => void;
  makeSameSize: () => void;
  
  // Ordre des contrôles (Z-order)
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  
  // Guides d'alignement
  updateAlignmentGuides: (mousePos: { x: number; y: number }) => void;
  clearAlignmentGuides: () => void;
  addStaticGuide: (type: 'vertical' | 'horizontal', position: number) => void;
  removeStaticGuide: (guideId: string) => void;
  
  // Historique
  pushToHistory: (action: string) => void;
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;
  
  // Outils
  setEditMode: (mode: 'select' | 'draw') => void;
  setActiveTool: (toolType: string | null) => void;
  
  // Performance et debugging
  markRender: () => void;
  getPerformanceStats: () => { renderCount: number; lastRenderTime: number; avgRenderTime: number };
  
  // Utilitaires
  lock: () => void;
  unlock: () => void;
  isLocked: () => boolean;
  getCanvasCoordinates: (screenX: number, screenY: number) => { x: number; y: number };
  getScreenCoordinates: (canvasX: number, canvasY: number) => { x: number; y: number };
  snapToGrid: (x: number, y: number) => { x: number; y: number };
}

type DesignerStore = DesignerState & DesignerActions;

// Configuration par défaut du canvas
const DEFAULT_CANVAS: CanvasState = {
  width: 4680,
  height: 3195,
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0,
  gridSize: 120, // 120 twips = 8 pixels at 96 DPI
  showGrid: true,
  snapToGrid: true,
  showRulers: true,
  showAlignmentGuides: true,
  backgroundColor: '#f0f0f0'
};

// ULTRA-OPTIMIZED DESIGNER STORE
export const useDesignerStore = create<DesignerStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // État initial
        controls: [],
        nextControlId: 1,
        canvas: DEFAULT_CANVAS,
        selection: {
          selectedControlIds: [],
          primarySelectionId: null,
          selectionBounds: null,
          isMultiSelect: false
        },
        drag: {
          isDragging: false,
          dragType: null,
          dragStartPos: null,
          dragCurrentPos: null,
          dragData: null,
          previewControl: null
        },
        clipboard: {
          controls: [],
          operation: null,
          pasteOffset: 0
        },
        alignmentGuides: [],
        staticGuides: [],
        editMode: 'select',
        activeToolType: null,
        history: {
          undoStack: [],
          redoStack: [],
          maxHistorySize: 50
        },
        lastRenderTime: 0,
        renderCount: 0,
        isLocked: false,

        // Gestion des contrôles
        createControl: (type: string, x = 120, y = 120, properties: Record<string, ControlPropertyValue> = {}) => {
          const state = get();
          if (state.isLocked) return null as unknown as Control;
          
          const controlId = state.nextControlId;
          const defaultProps = getDefaultProperties(type);
          
          // Snap to grid if enabled
          const position = state.canvas.snapToGrid ? 
            get().snapToGrid(x, y) : { x, y };
          
          const newControl: Control = {
            id: controlId,
            type,
            name: `${type}${controlId}`,
            left: position.x,
            top: position.y,
            width: defaultProps.Width || 120,
            height: defaultProps.Height || 30,
            zIndex: state.controls.length,
            properties: {
              ...defaultProps,
              Left: position.x,
              Top: position.y,
              ...properties
            }
          };
          
          set((draft) => {
            draft.controls.push(newControl);
            draft.nextControlId++;
            draft.selection.selectedControlIds = [controlId];
            draft.selection.primarySelectionId = controlId;
            draft.selection.isMultiSelect = false;
            draft.pushToHistory('createControl');
          });
          
          return newControl;
        },

        deleteControls: (controlIds: number[]) =>
          set((state) => {
            if (state.isLocked || controlIds.length === 0) return;
            
            
            // Supprimer les contrôles
            state.controls = state.controls.filter(ctrl => !controlIds.includes(ctrl.id));
            
            // Nettoyer la sélection
            state.selection.selectedControlIds = state.selection.selectedControlIds
              .filter(id => !controlIds.includes(id));
            
            if (controlIds.includes(state.selection.primarySelectionId!)) {
              state.selection.primarySelectionId = state.selection.selectedControlIds[0] || null;
            }
            
            state.selection.isMultiSelect = state.selection.selectedControlIds.length > 1;
            state.pushToHistory.call(state, 'deleteControls');
          }),

        updateControl: (controlId: number, property: string, value: ControlPropertyValue) =>
          set((state) => {
            if (state.isLocked) return;

            const control = state.controls.find(c => c.id === controlId);
            if (!control) return;

            // Mettre à jour la propriété
            if (property === 'left' || property === 'top' || property === 'width' || property === 'height') {
              (control as Record<string, ControlPropertyValue>)[property] = value;
              control.properties[property.charAt(0).toUpperCase() + property.slice(1)] = value;
            } else {
              control.properties[property] = value;
              
              // Synchroniser certaines propriétés critiques
              if (property === 'Name') {
                control.name = value;
              }
            }
            
          }),

        updateControlBounds: (controlId: number, bounds: { left: number; top: number; width: number; height: number }) =>
          set((state) => {
            if (state.isLocked) return;
            
            const control = state.controls.find(c => c.id === controlId);
            if (!control) return;
            
            // Snap to grid if enabled
            const snappedBounds = state.canvas.snapToGrid ? {
              left: Math.round(bounds.left / state.canvas.gridSize) * state.canvas.gridSize,
              top: Math.round(bounds.top / state.canvas.gridSize) * state.canvas.gridSize,
              width: Math.max(15, bounds.width), // Minimum width
              height: Math.max(15, bounds.height) // Minimum height
            } : bounds;
            
            control.left = snappedBounds.left;
            control.top = snappedBounds.top;
            control.width = snappedBounds.width;
            control.height = snappedBounds.height;
            
            // Synchroniser les propriétés
            control.properties.Left = snappedBounds.left;
            control.properties.Top = snappedBounds.top;
            control.properties.Width = snappedBounds.width;
            control.properties.Height = snappedBounds.height;
          }),

        duplicateControls: (controlIds: number[]) => {
          const state = get();
          if (state.isLocked || controlIds.length === 0) return [];
          
          const controlsToDuplicate = state.controls.filter(c => controlIds.includes(c.id));
          const newControls: Control[] = [];
          
          set((draft) => {
            controlsToDuplicate.forEach(control => {
              const newControl: Control = {
                ...control,
                id: draft.nextControlId++,
                name: `${control.name}_Copy`,
                left: control.left + 240, // Offset by 240 twips (16 pixels)
                top: control.top + 240,
                zIndex: draft.controls.length,
                properties: {
                  ...control.properties,
                  Name: `${control.name}_Copy`,
                  Left: control.left + 240,
                  Top: control.top + 240
                }
              };
              
              draft.controls.push(newControl);
              newControls.push(newControl);
            });
            
            // Sélectionner les nouveaux contrôles
            const newIds = newControls.map(c => c.id);
            draft.selection.selectedControlIds = newIds;
            draft.selection.primarySelectionId = newIds[0];
            draft.selection.isMultiSelect = newIds.length > 1;
            
            draft.pushToHistory('duplicateControls');
          });
          
          return newControls;
        },

        getControl: (controlId: number) => {
          return get().controls.find(c => c.id === controlId) || null;
        },

        getAllControls: () => get().controls,

        // Gestion de la sélection
        selectControl: (controlId: number, addToSelection = false) =>
          set((state) => {
            const control = state.controls.find(c => c.id === controlId);
            if (!control) return;
            
            if (addToSelection && state.selection.selectedControlIds.length > 0) {
              // Ajouter à la sélection existante
              if (!state.selection.selectedControlIds.includes(controlId)) {
                state.selection.selectedControlIds.push(controlId);
                state.selection.isMultiSelect = true;
              }
            } else {
              // Nouvelle sélection
              state.selection.selectedControlIds = [controlId];
              state.selection.primarySelectionId = controlId;
              state.selection.isMultiSelect = false;
            }
            
            // Calculer les bounds de sélection
            const selectedControls = state.controls.filter(c => 
              state.selection.selectedControlIds.includes(c.id)
            );
            
            if (selectedControls.length > 0) {
              const left = Math.min(...selectedControls.map(c => c.left));
              const top = Math.min(...selectedControls.map(c => c.top));
              const right = Math.max(...selectedControls.map(c => c.left + c.width));
              const bottom = Math.max(...selectedControls.map(c => c.top + c.height));
              
              state.selection.selectionBounds = { left, top, right, bottom };
            }
            
          }),

        selectMultipleControls: (controlIds: number[]) =>
          set((state) => {
            const validIds = controlIds.filter(id => 
              state.controls.some(c => c.id === id)
            );
            
            state.selection.selectedControlIds = validIds;
            state.selection.primarySelectionId = validIds[0] || null;
            state.selection.isMultiSelect = validIds.length > 1;
            
            // Calculer les bounds
            if (validIds.length > 0) {
              const selectedControls = state.controls.filter(c => validIds.includes(c.id));
              const left = Math.min(...selectedControls.map(c => c.left));
              const top = Math.min(...selectedControls.map(c => c.top));
              const right = Math.max(...selectedControls.map(c => c.left + c.width));
              const bottom = Math.max(...selectedControls.map(c => c.top + c.height));
              
              state.selection.selectionBounds = { left, top, right, bottom };
            } else {
              state.selection.selectionBounds = null;
            }
            
          }),

        clearSelection: () =>
          set((state) => {
            state.selection.selectedControlIds = [];
            state.selection.primarySelectionId = null;
            state.selection.selectionBounds = null;
            state.selection.isMultiSelect = false;
            
          }),

        selectAll: () =>
          set((state) => {
            const allIds = state.controls.map(c => c.id);
            get().selectMultipleControls(allIds);
            
          }),

        selectInBounds: (bounds: { left: number; top: number; right: number; bottom: number }) =>
          set((state) => {
            const controlsInBounds = state.controls.filter(control => {
              return control.left >= bounds.left &&
                     control.top >= bounds.top &&
                     control.left + control.width <= bounds.right &&
                     control.top + control.height <= bounds.bottom;
            });
            
            const ids = controlsInBounds.map(c => c.id);
            get().selectMultipleControls(ids);
            
          }),

        isControlSelected: (controlId: number) => {
          return get().selection.selectedControlIds.includes(controlId);
        },

        getSelectedControls: () => {
          const { controls, selection } = get();
          return controls.filter(c => selection.selectedControlIds.includes(c.id));
        },

        getPrimarySelection: () => {
          const { controls, selection } = get();
          if (!selection.primarySelectionId) return null;
          return controls.find(c => c.id === selection.primarySelectionId) || null;
        },

        // Gestion du canvas
        setCanvasSize: (width: number, height: number) =>
          set((state) => {
            state.canvas.width = Math.max(1200, width);
            state.canvas.height = Math.max(900, height);
            
          }),

        setZoom: (zoom: number) =>
          set((state) => {
            state.canvas.zoom = Math.max(0.1, Math.min(5.0, zoom));
            
          }),

        zoomIn: () => {
          const currentZoom = get().canvas.zoom;
          const newZoom = Math.min(5.0, currentZoom * 1.2);
          get().setZoom(newZoom);
        },

        zoomOut: () => {
          const currentZoom = get().canvas.zoom;
          const newZoom = Math.max(0.1, currentZoom / 1.2);
          get().setZoom(newZoom);
        },

        resetZoom: () => get().setZoom(1.0),

        fitToWindow: () => {
          // Implémenter la logique pour ajuster le zoom à la fenêtre
          const { controls } = get();
          if (controls.length === 0) {
            get().resetZoom();
            return;
          }
          
          // Calculer les bounds de tous les contrôles
          const left = Math.min(...controls.map(c => c.left));
          const top = Math.min(...controls.map(c => c.top));
          const right = Math.max(...controls.map(c => c.left + c.width));
          const bottom = Math.max(...controls.map(c => c.top + c.height));
          
          // Calculer le zoom nécessaire (logique simplifiée)
          const contentWidth = right - left + 240; // Padding
          const contentHeight = bottom - top + 240;
          const zoomX = 800 / contentWidth; // Largeur de vue approximative
          const zoomY = 600 / contentHeight; // Hauteur de vue approximative
          
          const optimalZoom = Math.min(zoomX, zoomY, 2.0);
          get().setZoom(optimalZoom);
          
        },

        setGridSize: (size: number) =>
          set((state) => {
            state.canvas.gridSize = Math.max(15, Math.min(240, size));
            
          }),

        toggleGrid: () =>
          set((state) => {
            state.canvas.showGrid = !state.canvas.showGrid;
            
          }),

        toggleSnapToGrid: () =>
          set((state) => {
            state.canvas.snapToGrid = !state.canvas.snapToGrid;
            
          }),

        toggleRulers: () =>
          set((state) => {
            state.canvas.showRulers = !state.canvas.showRulers;
            
          }),

        toggleAlignmentGuides: () =>
          set((state) => {
            state.canvas.showAlignmentGuides = !state.canvas.showAlignmentGuides;
            
          }),

        panCanvas: (deltaX: number, deltaY: number) =>
          set((state) => {
            state.canvas.offsetX += deltaX;
            state.canvas.offsetY += deltaY;
          }),

        resetPan: () =>
          set((state) => {
            state.canvas.offsetX = 0;
            state.canvas.offsetY = 0;
            
          }),

        // Opérations de drag & drop
        startDrag: (type: 'create' | 'move' | 'resize' | 'select', pos: { x: number; y: number }, data?: DragData) =>
          set((state) => {
            state.drag.isDragging = true;
            state.drag.dragType = type;
            state.drag.dragStartPos = pos;
            state.drag.dragCurrentPos = pos;
            state.drag.dragData = data;
            
            if (type === 'create' && data?.controlType) {
              // Créer un contrôle de prévisualisation
              const defaultProps = getDefaultProperties(data.controlType);
              state.drag.previewControl = {
                id: -1,
                type: data.controlType,
                name: `Preview_${data.controlType}`,
                left: pos.x,
                top: pos.y,
                width: defaultProps.Width || 120,
                height: defaultProps.Height || 30,
                zIndex: 9999,
                properties: defaultProps
              };
            }
            
          }),

        updateDrag: (pos: { x: number; y: number }) =>
          set((state) => {
            if (!state.drag.isDragging) return;
            
            state.drag.dragCurrentPos = pos;
            
            if (state.drag.previewControl) {
              state.drag.previewControl.left = pos.x;
              state.drag.previewControl.top = pos.y;
            }
          }),

        endDrag: () =>
          set((state) => {
            if (!state.drag.isDragging) return;
            
            const dragType = state.drag.dragType;
            const startPos = state.drag.dragStartPos!;
            const endPos = state.drag.dragCurrentPos!;
            
            // Traiter la fin du drag selon le type
            if (dragType === 'create' && state.drag.previewControl) {
              // Créer le contrôle final
              const finalPos = state.canvas.snapToGrid ? 
                get().snapToGrid(endPos.x, endPos.y) : endPos;
              
              get().createControl(
                state.drag.previewControl.type,
                finalPos.x,
                finalPos.y
              );
            }
            
            // Reset drag state
            state.drag.isDragging = false;
            state.drag.dragType = null;
            state.drag.dragStartPos = null;
            state.drag.dragCurrentPos = null;
            state.drag.dragData = null;
            state.drag.previewControl = null;
            
          }),

        cancelDrag: () =>
          set((state) => {
            state.drag.isDragging = false;
            state.drag.dragType = null;
            state.drag.dragStartPos = null;
            state.drag.dragCurrentPos = null;
            state.drag.dragData = null;
            state.drag.previewControl = null;
            
          }),

        // Presse-papiers
        copyControls: () =>
          set((state) => {
            const selectedControls = state.controls.filter(c => 
              state.selection.selectedControlIds.includes(c.id)
            );
            
            state.clipboard.controls = selectedControls.map(control => ({
              ...control,
              id: -1 // Marquer pour regeneration d'ID
            }));
            state.clipboard.operation = 'copy';
            state.clipboard.pasteOffset = 0;
            
          }),

        cutControls: () => {
          get().copyControls();
          
          set((state) => {
            state.clipboard.operation = 'cut';
            // Les contrôles seront supprimés lors du paste
          });
          
        },

        pasteControls: () => {
          const state = get();
          if (state.clipboard.controls.length === 0) return;
          
          set((draft) => {
            const newControls: Control[] = [];
            draft.clipboard.pasteOffset += 240; // Increment offset
            
            draft.clipboard.controls.forEach(clipControl => {
              const newControl: Control = {
                ...clipControl,
                id: draft.nextControlId++,
                name: `${clipControl.name}_Paste${draft.clipboard.pasteOffset / 240}`,
                left: clipControl.left + draft.clipboard.pasteOffset,
                top: clipControl.top + draft.clipboard.pasteOffset,
                zIndex: draft.controls.length,
                properties: {
                  ...clipControl.properties,
                  Name: `${clipControl.name}_Paste${draft.clipboard.pasteOffset / 240}`,
                  Left: clipControl.left + draft.clipboard.pasteOffset,
                  Top: clipControl.top + draft.clipboard.pasteOffset
                }
              };
              
              draft.controls.push(newControl);
              newControls.push(newControl);
            });
            
            // Si c'était une opération de cut, supprimer les originaux
            if (draft.clipboard.operation === 'cut') {
              const originalIds = draft.clipboard.controls
                .filter(c => c.id !== -1)
                .map(c => c.id);
              
              draft.controls = draft.controls.filter(c => !originalIds.includes(c.id));
              draft.clipboard.operation = 'copy'; // Convertir en copy après cut
            }
            
            // Sélectionner les nouveaux contrôles
            const newIds = newControls.map(c => c.id);
            draft.selection.selectedControlIds = newIds;
            draft.selection.primarySelectionId = newIds[0];
            draft.selection.isMultiSelect = newIds.length > 1;
            
            draft.pushToHistory('pasteControls');
          });
          
        },

        canPaste: () => {
          return get().clipboard.controls.length > 0;
        },

        // Alignement (implémentation basique - à compléter)
        alignLeft: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length < 2) return;
          
          const selectedControls = controls.filter(c => selection.selectedControlIds.includes(c.id));
          const leftMost = Math.min(...selectedControls.map(c => c.left));
          
          set((state) => {
            selectedControls.forEach(control => {
              const stateControl = state.controls.find(c => c.id === control.id);
              if (stateControl) {
                stateControl.left = leftMost;
                stateControl.properties.Left = leftMost;
              }
            });
            
            state.pushToHistory.call(state, 'alignLeft');
          });
          
        },

        alignCenter: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length < 2) return;
          
          const selectedControls = controls.filter(c => selection.selectedControlIds.includes(c.id));
          const left = Math.min(...selectedControls.map(c => c.left));
          const right = Math.max(...selectedControls.map(c => c.left + c.width));
          const centerX = (left + right) / 2;
          
          set((state) => {
            selectedControls.forEach(control => {
              const stateControl = state.controls.find(c => c.id === control.id);
              if (stateControl) {
                const newLeft = centerX - stateControl.width / 2;
                stateControl.left = newLeft;
                stateControl.properties.Left = newLeft;
              }
            });
            
            state.pushToHistory.call(state, 'alignCenter');
          });
          
        },

        alignRight: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length < 2) return;
          
          const selectedControls = controls.filter(c => selection.selectedControlIds.includes(c.id));
          const rightMost = Math.max(...selectedControls.map(c => c.left + c.width));
          
          set((state) => {
            selectedControls.forEach(control => {
              const stateControl = state.controls.find(c => c.id === control.id);
              if (stateControl) {
                const newLeft = rightMost - stateControl.width;
                stateControl.left = newLeft;
                stateControl.properties.Left = newLeft;
              }
            });
            
            state.pushToHistory.call(state, 'alignRight');
          });
          
        },

        alignTop: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length < 2) return;
          
          const selectedControls = controls.filter(c => selection.selectedControlIds.includes(c.id));
          const topMost = Math.min(...selectedControls.map(c => c.top));
          
          set((state) => {
            selectedControls.forEach(control => {
              const stateControl = state.controls.find(c => c.id === control.id);
              if (stateControl) {
                stateControl.top = topMost;
                stateControl.properties.Top = topMost;
              }
            });
            
            state.pushToHistory.call(state, 'alignTop');
          });
          
        },

        alignMiddle: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length < 2) return;
          
          const selectedControls = controls.filter(c => selection.selectedControlIds.includes(c.id));
          const top = Math.min(...selectedControls.map(c => c.top));
          const bottom = Math.max(...selectedControls.map(c => c.top + c.height));
          const centerY = (top + bottom) / 2;
          
          set((state) => {
            selectedControls.forEach(control => {
              const stateControl = state.controls.find(c => c.id === control.id);
              if (stateControl) {
                const newTop = centerY - stateControl.height / 2;
                stateControl.top = newTop;
                stateControl.properties.Top = newTop;
              }
            });
            
            state.pushToHistory.call(state, 'alignMiddle');
          });
          
        },

        alignBottom: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length < 2) return;
          
          const selectedControls = controls.filter(c => selection.selectedControlIds.includes(c.id));
          const bottomMost = Math.max(...selectedControls.map(c => c.top + c.height));
          
          set((state) => {
            selectedControls.forEach(control => {
              const stateControl = state.controls.find(c => c.id === control.id);
              if (stateControl) {
                const newTop = bottomMost - stateControl.height;
                stateControl.top = newTop;
                stateControl.properties.Top = newTop;
              }
            });
            
            state.pushToHistory.call(state, 'alignBottom');
          });
          
        },

        // Méthodes stub pour les autres fonctions d'alignement

        // Z-order
        bringToFront: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length === 0) return;
          
          set((state) => {
            const maxZIndex = Math.max(...state.controls.map(c => c.zIndex));
            let nextZIndex = maxZIndex + 1;
            
            selection.selectedControlIds.forEach(id => {
              const control = state.controls.find(c => c.id === id);
              if (control) {
                control.zIndex = nextZIndex++;
              }
            });
            
            state.pushToHistory.call(state, 'bringToFront');
          });
          
        },

        sendToBack: () => {
          const { controls, selection } = get();
          if (selection.selectedControlIds.length === 0) return;
          
          set((state) => {
            const minZIndex = Math.min(...state.controls.map(c => c.zIndex));
            let nextZIndex = minZIndex - selection.selectedControlIds.length;
            
            selection.selectedControlIds.forEach(id => {
              const control = state.controls.find(c => c.id === id);
              if (control) {
                control.zIndex = nextZIndex++;
              }
            });
            
            state.pushToHistory.call(state, 'sendToBack');
          });
          
        },

        bringForward: () => {
        },

        sendBackward: () => {
        },

        // Guides d'alignement
        updateAlignmentGuides: (mousePos: { x: number; y: number }) => {
          const { controls, selection, canvas } = get();
          if (!canvas.showAlignmentGuides || selection.selectedControlIds.length === 0) return;
          
          const threshold = 5; // Pixels de tolérance
          const newGuides: AlignmentGuide[] = [];
          
          // Guides basés sur les autres contrôles
          const otherControls = controls.filter(c => !selection.selectedControlIds.includes(c.id));
          
          otherControls.forEach(control => {
            // Guide vertical (alignement sur left, center, right)
            if (Math.abs(mousePos.x - control.left) < threshold) {
              newGuides.push({
                id: `v-left-${control.id}`,
                type: 'vertical',
                position: control.left,
                color: '#ff0000',
                temporary: true,
                controls: [control.id]
              });
            }
            
            if (Math.abs(mousePos.x - (control.left + control.width / 2)) < threshold) {
              newGuides.push({
                id: `v-center-${control.id}`,
                type: 'vertical',
                position: control.left + control.width / 2,
                color: '#ff0000',
                temporary: true,
                controls: [control.id]
              });
            }
            
            if (Math.abs(mousePos.x - (control.left + control.width)) < threshold) {
              newGuides.push({
                id: `v-right-${control.id}`,
                type: 'vertical',
                position: control.left + control.width,
                color: '#ff0000',
                temporary: true,
                controls: [control.id]
              });
            }
            
            // Guide horizontal (alignement sur top, middle, bottom)
            if (Math.abs(mousePos.y - control.top) < threshold) {
              newGuides.push({
                id: `h-top-${control.id}`,
                type: 'horizontal',
                position: control.top,
                color: '#ff0000',
                temporary: true,
                controls: [control.id]
              });
            }
            
            if (Math.abs(mousePos.y - (control.top + control.height / 2)) < threshold) {
              newGuides.push({
                id: `h-middle-${control.id}`,
                type: 'horizontal',
                position: control.top + control.height / 2,
                color: '#ff0000',
                temporary: true,
                controls: [control.id]
              });
            }
            
            if (Math.abs(mousePos.y - (control.top + control.height)) < threshold) {
              newGuides.push({
                id: `h-bottom-${control.id}`,
                type: 'horizontal',
                position: control.top + control.height,
                color: '#ff0000',
                temporary: true,
                controls: [control.id]
              });
            }
          });
          
          set((state) => {
            // Supprimer les anciens guides temporaires
            state.alignmentGuides = state.alignmentGuides.filter(g => !g.temporary);
            // Ajouter les nouveaux guides
            state.alignmentGuides.push(...newGuides);
          });
        },

        clearAlignmentGuides: () =>
          set((state) => {
            state.alignmentGuides = state.alignmentGuides.filter(g => !g.temporary);
          }),

        addStaticGuide: (type: 'vertical' | 'horizontal', position: number) =>
          set((state) => {
            const guideId = `${type}-${position}-${Date.now()}`;
            
            state.staticGuides.push({
              id: guideId,
              type,
              position,
              color: '#0000ff',
              temporary: false,
              controls: []
            });
            
          }),

        removeStaticGuide: (guideId: string) =>
          set((state) => {
            state.staticGuides = state.staticGuides.filter(g => g.id !== guideId);
            
          }),

        // Historique
        pushToHistory: (action: string) =>
          set((state) => {
            if (state.isLocked) return;
            
            const snapshot = {
              action,
              timestamp: new Date(),
              controls: JSON.parse(JSON.stringify(state.controls)),
              nextId: state.nextControlId
            };
            
            state.history.undoStack.push(snapshot);
            
            // Limiter la taille de l'historique
            if (state.history.undoStack.length > state.history.maxHistorySize) {
              state.history.undoStack.shift();
            }
            
            // Vider le redo stack
            state.history.redoStack = [];
            
          }),

        undo: () => {
          const state = get();
          const lastSnapshot = state.history.undoStack.pop();
          
          if (lastSnapshot) {
            set((draft) => {
              // Sauvegarder l'état actuel dans redo
              draft.history.redoStack.push({
                action: 'current',
                timestamp: new Date(),
                controls: JSON.parse(JSON.stringify(draft.controls)),
                nextId: draft.nextControlId
              });
              
              // Restaurer l'état précédent
              draft.controls = lastSnapshot.controls;
              draft.nextControlId = lastSnapshot.nextId;
              
              // Vider la sélection
              draft.selection.selectedControlIds = [];
              draft.selection.primarySelectionId = null;
              draft.selection.selectionBounds = null;
              draft.selection.isMultiSelect = false;
            });
            
            return true;
          }
          
          return false;
        },

        redo: () => {
          const state = get();
          const nextSnapshot = state.history.redoStack.pop();
          
          if (nextSnapshot) {
            set((draft) => {
              // Sauvegarder l'état actuel dans undo
              draft.history.undoStack.push({
                action: 'current',
                timestamp: new Date(),
                controls: JSON.parse(JSON.stringify(draft.controls)),
                nextId: draft.nextControlId
              });
              
              // Restaurer l'état suivant
              draft.controls = nextSnapshot.controls;
              draft.nextControlId = nextSnapshot.nextId;
              
              // Vider la sélection
              draft.selection.selectedControlIds = [];
              draft.selection.primarySelectionId = null;
              draft.selection.selectionBounds = null;
              draft.selection.isMultiSelect = false;
            });
            
            return true;
          }
          
          return false;
        },

        clearHistory: () =>
          set((state) => {
            state.history.undoStack = [];
            state.history.redoStack = [];
            
          }),

        // Outils
        setEditMode: (mode: 'select' | 'draw') =>
          set((state) => {
            state.editMode = mode;
            
          }),

        setActiveTool: (toolType: string | null) =>
          set((state) => {
            state.activeToolType = toolType;
            
            if (toolType) {
              state.editMode = 'draw';
            } else {
              state.editMode = 'select';
            }
            
          }),

        // Performance
        markRender: () =>
          set((state) => {
            state.renderCount++;
            state.lastRenderTime = performance.now();
          }),

        getPerformanceStats: () => {
          const { renderCount, lastRenderTime } = get();
          const avgRenderTime = lastRenderTime / Math.max(1, renderCount);
          
          return {
            renderCount,
            lastRenderTime,
            avgRenderTime
          };
        },

        // Utilitaires
        lock: () =>
          set((state) => {
            state.isLocked = true;
          }),

        unlock: () =>
          set((state) => {
            state.isLocked = false;
          }),

        getCanvasCoordinates: (screenX: number, screenY: number) => {
          const { canvas } = get();
          return {
            x: (screenX - canvas.offsetX) / canvas.zoom,
            y: (screenY - canvas.offsetY) / canvas.zoom
          };
        },

        getScreenCoordinates: (canvasX: number, canvasY: number) => {
          const { canvas } = get();
          return {
            x: canvasX * canvas.zoom + canvas.offsetX,
            y: canvasY * canvas.zoom + canvas.offsetY
          };
        },

        snapToGrid: (x: number, y: number) => {
          const { canvas } = get();
          if (!canvas.snapToGrid) return { x, y };
          
          return {
            x: Math.round(x / canvas.gridSize) * canvas.gridSize,
            y: Math.round(y / canvas.gridSize) * canvas.gridSize
          };
        }
      })),
      {
        name: 'designer-store',
        version: 1
      }
    )
  )
);

// Sélecteurs optimisés pour éviter les re-renders
export const designerSelectors = {
  // Sélection
  getSelectedControls: () => {
    const { controls, selection } = useDesignerStore.getState();
    return controls.filter(c => selection.selectedControlIds.includes(c.id));
  },
  
  getPrimarySelection: () => {
    const { controls, selection } = useDesignerStore.getState();
    if (!selection.primarySelectionId) return null;
    return controls.find(c => c.id === selection.primarySelectionId) || null;
  },
  
  // Canvas
  getCanvasState: () => {
    const { canvas } = useDesignerStore.getState();
    return canvas;
  },
  
  // Performance
  getVisibleControls: (viewBounds: { left: number; top: number; right: number; bottom: number }) => {
    const { controls } = useDesignerStore.getState();
    return controls.filter(control => {
      const right = control.left + control.width;
      const bottom = control.top + control.height;
      
      return !(right < viewBounds.left || 
               control.left > viewBounds.right ||
               bottom < viewBounds.top ||
               control.top > viewBounds.bottom);
    });
  },
  
  // Drag state
  getDragState: () => useDesignerStore.getState().drag,
  
  // Guides
  getActiveGuides: () => {
    const { alignmentGuides, staticGuides } = useDesignerStore.getState();
    return [...alignmentGuides, ...staticGuides];
  }
};

