/**
 * Property History Manager for VB6 Properties Window
 * 
 * Manages undo/redo functionality for property changes
 * with efficient storage and batch operations
 */

export interface PropertyChange {
  objectId: string;
  objectType: string;
  propertyName: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface PropertyBatch {
  id: string;
  changes: PropertyChange[];
  timestamp: number;
  description: string;
}

export class PropertyHistory {
  private history: PropertyBatch[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;
  private currentBatch: PropertyChange[] = [];
  private batchTimeout: number | null = null;
  private batchDelay: number = 500; // ms

  /**
   * Record a property change
   */
  recordChange(
    objectId: string,
    objectType: string,
    propertyName: string,
    oldValue: any,
    newValue: any,
    batchWithPrevious: boolean = true
  ): void {
    const change: PropertyChange = {
      objectId,
      objectType,
      propertyName,
      oldValue,
      newValue,
      timestamp: Date.now()
    };

    if (batchWithPrevious) {
      this.addToBatch(change);
    } else {
      this.commitBatch();
      this.addToBatch(change);
      this.commitBatch();
    }
  }

  /**
   * Add change to current batch
   */
  private addToBatch(change: PropertyChange): void {
    // Check if this change replaces a previous change to the same property
    const existingIndex = this.currentBatch.findIndex(
      c => c.objectId === change.objectId && c.propertyName === change.propertyName
    );

    if (existingIndex >= 0) {
      // Update existing change with new value, keep original old value
      this.currentBatch[existingIndex] = {
        ...this.currentBatch[existingIndex],
        newValue: change.newValue,
        timestamp: change.timestamp
      };
    } else {
      this.currentBatch.push(change);
    }

    // Set batch commit timer
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = window.setTimeout(() => {
      this.commitBatch();
    }, this.batchDelay);
  }

  /**
   * Commit current batch to history
   */
  private commitBatch(): void {
    if (this.currentBatch.length === 0) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Remove any history after current index (for new changes after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Create batch description
    const description = this.generateBatchDescription(this.currentBatch);

    const batch: PropertyBatch = {
      id: this.generateBatchId(),
      changes: [...this.currentBatch],
      timestamp: Date.now(),
      description
    };

    this.history.push(batch);
    this.currentIndex = this.history.length - 1;

    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      const removeCount = this.history.length - this.maxHistorySize;
      this.history.splice(0, removeCount);
      this.currentIndex -= removeCount;
    }

    this.currentBatch = [];
  }

  /**
   * Generate batch description for display
   */
  private generateBatchDescription(changes: PropertyChange[]): string {
    if (changes.length === 1) {
      const change = changes[0];
      return `Change ${change.propertyName}`;
    }

    const propertyNames = [...new Set(changes.map(c => c.propertyName))];
    const objectIds = [...new Set(changes.map(c => c.objectId))];

    if (objectIds.length === 1) {
      if (propertyNames.length === 1) {
        return `Change ${propertyNames[0]}`;
      } else {
        return `Change ${propertyNames.length} properties`;
      }
    } else {
      return `Change properties on ${objectIds.length} objects`;
    }
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Undo last batch
   */
  undo(): PropertyChange[] | null {
    this.commitBatch(); // Commit any pending changes first

    if (this.currentIndex < 0) return null;

    const batch = this.history[this.currentIndex];
    this.currentIndex--;

    // Return changes in reverse order for undo
    return batch.changes.map(change => ({
      ...change,
      oldValue: change.newValue,
      newValue: change.oldValue
    })).reverse();
  }

  /**
   * Redo next batch
   */
  redo(): PropertyChange[] | null {
    if (this.currentIndex >= this.history.length - 1) return null;

    this.currentIndex++;
    const batch = this.history[this.currentIndex];

    return batch.changes;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get undo description
   */
  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].description;
  }

  /**
   * Get redo description
   */
  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].description;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.commitBatch();
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history statistics
   */
  getStats(): {
    totalBatches: number;
    totalChanges: number;
    currentIndex: number;
    memoryUsage: number;
  } {
    const totalChanges = this.history.reduce((sum, batch) => sum + batch.changes.length, 0);
    const memoryUsage = JSON.stringify(this.history).length;

    return {
      totalBatches: this.history.length,
      totalChanges,
      currentIndex: this.currentIndex,
      memoryUsage
    };
  }

  /**
   * Export history for debugging
   */
  exportHistory(): string {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
      stats: this.getStats()
    }, null, 2);
  }

  /**
   * Import history from export
   */
  importHistory(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.history = parsed.history || [];
      this.currentIndex = parsed.currentIndex || -1;
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }

  /**
   * Group related changes for better undo/redo experience
   */
  beginGroup(description?: string): void {
    this.commitBatch();
    // Future changes will be grouped until endGroup is called
  }

  /**
   * End grouping of changes
   */
  endGroup(): void {
    this.commitBatch();
  }

  /**
   * Get recent history for display
   */
  getRecentHistory(count: number = 10): PropertyBatch[] {
    const startIndex = Math.max(0, this.history.length - count);
    return this.history.slice(startIndex);
  }

  /**
   * Find all changes to a specific property
   */
  findPropertyChanges(objectId: string, propertyName: string): PropertyChange[] {
    const changes: PropertyChange[] = [];
    
    for (const batch of this.history) {
      for (const change of batch.changes) {
        if (change.objectId === objectId && change.propertyName === propertyName) {
          changes.push(change);
        }
      }
    }
    
    return changes;
  }

  /**
   * Get property value at specific point in history
   */
  getPropertyValueAt(objectId: string, propertyName: string, batchIndex: number): any {
    let value: any = undefined;
    
    for (let i = 0; i <= batchIndex && i < this.history.length; i++) {
      const batch = this.history[i];
      for (const change of batch.changes) {
        if (change.objectId === objectId && change.propertyName === propertyName) {
          value = change.newValue;
        }
      }
    }
    
    return value;
  }
}

// Export singleton instance
export const propertyHistory = new PropertyHistory();