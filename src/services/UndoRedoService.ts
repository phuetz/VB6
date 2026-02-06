// Enhanced Undo/Redo Service for VB6 IDE
// Provides granular operation tracking and intelligent history management

import { Control } from '../context/types';

export interface UndoRedoAction {
  id: string;
  type:
    | 'create'
    | 'delete'
    | 'move'
    | 'resize'
    | 'property_change'
    | 'copy'
    | 'paste'
    | 'duplicate'
    | 'align'
    | 'group';
  timestamp: number;
  description: string;
  controls: number[]; // Control IDs affected
  data: {
    before?: any;
    after?: any;
    properties?: Record<string, any>;
    positions?: Array<{ id: number; x: number; y: number; width?: number; height?: number }>;
    created?: Control[];
    deleted?: Control[];
  };
  canMerge?: boolean; // Whether this action can be merged with similar actions
  mergeWindow?: number; // Time window in ms for merging similar actions
}

export interface UndoRedoState {
  actions: UndoRedoAction[];
  currentIndex: number;
  maxHistorySize: number;
  isPerformingUndo: boolean;
  isPerformingRedo: boolean;
}

export class UndoRedoService {
  private static instance: UndoRedoService;
  private state: UndoRedoState = {
    actions: [],
    currentIndex: -1,
    maxHistorySize: 100,
    isPerformingUndo: false,
    isPerformingRedo: false,
  };

  private listeners: Array<(state: UndoRedoState) => void> = [];
  private mergeTimer: NodeJS.Timeout | null = null;

  static getInstance(): UndoRedoService {
    if (!UndoRedoService.instance) {
      UndoRedoService.instance = new UndoRedoService();
    }
    return UndoRedoService.instance;
  }

  // Subscribe to state changes
  subscribe(listener: (state: UndoRedoState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Add a new action to the history
  recordAction(action: Omit<UndoRedoAction, 'id' | 'timestamp'>): void {
    if (this.state.isPerformingUndo || this.state.isPerformingRedo) {
      return; // Don't record actions during undo/redo operations
    }

    const newAction: UndoRedoAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Check if we can merge with the last action
    if (this.canMergeWithLastAction(newAction)) {
      this.mergeWithLastAction(newAction);
      return;
    }

    // Remove any actions after current index (when branching history)
    if (this.state.currentIndex < this.state.actions.length - 1) {
      this.state.actions = this.state.actions.slice(0, this.state.currentIndex + 1);
    }

    // Add the new action
    this.state.actions.push(newAction);
    this.state.currentIndex = this.state.actions.length - 1;

    // Limit history size
    if (this.state.actions.length > this.state.maxHistorySize) {
      const excess = this.state.actions.length - this.state.maxHistorySize;
      this.state.actions = this.state.actions.slice(excess);
      this.state.currentIndex -= excess;
    }

    this.notifyListeners();
  }

  // Check if an action can be merged with the last action
  private canMergeWithLastAction(newAction: UndoRedoAction): boolean {
    const lastAction = this.state.actions[this.state.currentIndex];
    if (!lastAction || !lastAction.canMerge || !newAction.canMerge) {
      return false;
    }

    // Must be same type and affect same controls
    if (lastAction.type !== newAction.type) {
      return false;
    }

    // Check if controls match
    if (
      lastAction.controls.length !== newAction.controls.length ||
      !lastAction.controls.every(id => newAction.controls.includes(id))
    ) {
      return false;
    }

    // Check merge time window (default 1 second)
    const mergeWindow = lastAction.mergeWindow || 1000;
    const timeDiff = newAction.timestamp - lastAction.timestamp;
    if (timeDiff > mergeWindow) {
      return false;
    }

    return true;
  }

  // Merge new action with the last action
  private mergeWithLastAction(newAction: UndoRedoAction): void {
    const lastAction = this.state.actions[this.state.currentIndex];
    if (!lastAction) return;

    // Update the last action's data
    switch (newAction.type) {
      case 'move':
      case 'resize':
        // Keep the original 'before' state, update 'after' state
        lastAction.data.after = newAction.data.after;
        lastAction.data.positions = newAction.data.positions;
        break;

      case 'property_change':
        // Merge property changes
        if (lastAction.data.properties && newAction.data.properties) {
          Object.assign(lastAction.data.properties, newAction.data.properties);
        }
        lastAction.data.after = newAction.data.after;
        break;
    }

    // Update timestamp and description
    lastAction.timestamp = newAction.timestamp;
    lastAction.description = this.generateMergedDescription(lastAction, newAction);

    this.notifyListeners();
  }

  // Generate description for merged actions
  private generateMergedDescription(lastAction: UndoRedoAction, newAction: UndoRedoAction): string {
    const controlCount = lastAction.controls.length;
    const controlText = controlCount === 1 ? 'control' : `${controlCount} controls`;

    switch (lastAction.type) {
      case 'move':
        return `Move ${controlText}`;
      case 'resize':
        return `Resize ${controlText}`;
      case 'property_change':
        return `Change properties of ${controlText}`;
      default:
        return lastAction.description;
    }
  }

  // Convenient methods for recording specific actions

  recordCreate(controls: Control[]): void {
    const controlNames = controls.map(c => c.name).join(', ');
    this.recordAction({
      type: 'create',
      description: `Create ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: { created: controls },
    });
  }

  recordDelete(controls: Control[]): void {
    const controlNames = controls.map(c => c.name).join(', ');
    this.recordAction({
      type: 'delete',
      description: `Delete ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: { deleted: controls },
    });
  }

  recordMove(
    controls: Control[],
    beforePositions: Array<{ id: number; x: number; y: number }>
  ): void {
    const afterPositions = controls.map(c => ({ id: c.id, x: c.x, y: c.y }));
    const controlNames = controls.map(c => c.name).join(', ');

    this.recordAction({
      type: 'move',
      description: `Move ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: {
        before: beforePositions,
        after: afterPositions,
        positions: afterPositions,
      },
      canMerge: true,
      mergeWindow: 500, // 500ms merge window for move operations
    });
  }

  recordResize(
    controls: Control[],
    beforeSizes: Array<{ id: number; x: number; y: number; width: number; height: number }>
  ): void {
    const afterSizes = controls.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
    }));
    const controlNames = controls.map(c => c.name).join(', ');

    this.recordAction({
      type: 'resize',
      description: `Resize ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: {
        before: beforeSizes,
        after: afterSizes,
        positions: afterSizes,
      },
      canMerge: true,
      mergeWindow: 500, // 500ms merge window for resize operations
    });
  }

  recordPropertyChange(
    controls: Control[],
    property: string,
    beforeValues: any[],
    afterValues: any[]
  ): void {
    const controlNames = controls.map(c => c.name).join(', ');

    this.recordAction({
      type: 'property_change',
      description: `Change ${property} of ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: {
        properties: { [property]: afterValues },
        before: beforeValues,
        after: afterValues,
      },
      canMerge: property !== 'name', // Don't merge name changes
      mergeWindow: 2000, // 2s merge window for property changes
    });
  }

  recordCopy(controls: Control[]): void {
    const controlNames = controls.map(c => c.name).join(', ');
    this.recordAction({
      type: 'copy',
      description: `Copy ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: { copied: controls },
    });
  }

  recordPaste(controls: Control[]): void {
    const controlNames = controls.map(c => c.name).join(', ');
    this.recordAction({
      type: 'paste',
      description: `Paste ${controls.length === 1 ? controlNames : `${controls.length} controls`}`,
      controls: controls.map(c => c.id),
      data: { created: controls },
    });
  }

  recordDuplicate(originalControls: Control[], duplicatedControls: Control[]): void {
    this.recordAction({
      type: 'duplicate',
      description: `Duplicate ${originalControls.length === 1 ? originalControls[0].name : `${originalControls.length} controls`}`,
      controls: duplicatedControls.map(c => c.id),
      data: {
        original: originalControls,
        created: duplicatedControls,
      },
    });
  }

  recordAlign(
    controls: Control[],
    alignType: string,
    beforePositions: Array<{ id: number; x: number; y: number }>
  ): void {
    const afterPositions = controls.map(c => ({ id: c.id, x: c.x, y: c.y }));

    this.recordAction({
      type: 'align',
      description: `Align ${controls.length} controls (${alignType})`,
      controls: controls.map(c => c.id),
      data: {
        before: beforePositions,
        after: afterPositions,
        alignType,
      },
    });
  }

  // Undo/Redo operations
  canUndo(): boolean {
    return this.state.currentIndex >= 0 && !this.state.isPerformingUndo;
  }

  canRedo(): boolean {
    return this.state.currentIndex < this.state.actions.length - 1 && !this.state.isPerformingRedo;
  }

  getCurrentAction(): UndoRedoAction | null {
    if (this.state.currentIndex >= 0 && this.state.currentIndex < this.state.actions.length) {
      return this.state.actions[this.state.currentIndex];
    }
    return null;
  }

  getNextAction(): UndoRedoAction | null {
    const nextIndex = this.state.currentIndex + 1;
    if (nextIndex < this.state.actions.length) {
      return this.state.actions[nextIndex];
    }
    return null;
  }

  async undo(): Promise<UndoRedoAction | null> {
    if (!this.canUndo()) return null;

    const action = this.state.actions[this.state.currentIndex];
    this.state.isPerformingUndo = true;
    this.state.currentIndex--;

    this.notifyListeners();

    // The actual undo logic will be handled by the store/context
    // This service just manages the history state

    this.state.isPerformingUndo = false;
    return action;
  }

  async redo(): Promise<UndoRedoAction | null> {
    if (!this.canRedo()) return null;

    this.state.currentIndex++;
    const action = this.state.actions[this.state.currentIndex];
    this.state.isPerformingRedo = true;

    this.notifyListeners();

    // The actual redo logic will be handled by the store/context
    // This service just manages the history state

    this.state.isPerformingRedo = false;
    return action;
  }

  // History management
  clear(): void {
    this.state.actions = [];
    this.state.currentIndex = -1;
    this.notifyListeners();
  }

  getHistory(): UndoRedoAction[] {
    return [...this.state.actions];
  }

  getHistorySize(): number {
    return this.state.actions.length;
  }

  setMaxHistorySize(size: number): void {
    this.state.maxHistorySize = Math.max(10, size); // Minimum 10 actions

    // Trim history if needed
    if (this.state.actions.length > this.state.maxHistorySize) {
      const excess = this.state.actions.length - this.state.maxHistorySize;
      this.state.actions = this.state.actions.slice(excess);
      this.state.currentIndex = Math.max(-1, this.state.currentIndex - excess);
    }

    this.notifyListeners();
  }

  // Get memory usage statistics
  getMemoryUsage(): { actionsCount: number; estimatedSize: string } {
    const actionsCount = this.state.actions.length;
    const estimatedBytes = JSON.stringify(this.state.actions).length * 2; // Rough estimate
    const estimatedSize =
      estimatedBytes > 1024 * 1024
        ? `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${(estimatedBytes / 1024).toFixed(1)} KB`;

    return { actionsCount, estimatedSize };
  }
}

// Export singleton instance
export const undoRedoService = UndoRedoService.getInstance();
