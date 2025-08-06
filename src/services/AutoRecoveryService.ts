import { useVB6Store } from '../stores/vb6Store';

interface RecoveryPoint {
  timestamp: number;
  state: any;
  description: string;
}

class AutoRecoveryService {
  private static instance: AutoRecoveryService;
  private recoveryPoints: RecoveryPoint[] = [];
  private maxRecoveryPoints = 10;
  private autoSaveInterval: number | null = null;
  private lastSaveTime: number = 0;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  static getInstance(): AutoRecoveryService {
    if (!AutoRecoveryService.instance) {
      AutoRecoveryService.instance = new AutoRecoveryService();
    }
    return AutoRecoveryService.instance;
  }

  constructor() {
    this.loadRecoveryPoints();
    this.setupErrorRecovery();
  }

  private setupErrorRecovery() {
    // Store handlers for cleanup
    this.errorHandler = (event: ErrorEvent) => {
      console.log('🚨 Error detected, creating recovery point...');
      this.createRecoveryPoint('Error recovery point: ' + event.message);
    };
    
    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      console.log('🚨 Unhandled rejection, creating recovery point...');
      this.createRecoveryPoint('Promise rejection recovery point');
    };

    // Listen for errors and create recovery points
    window.addEventListener('error', this.errorHandler);
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  startAutoSave(intervalMs: number = 60000) {
    console.log('🔄 Starting auto-save with interval:', intervalMs + 'ms');
    
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(() => {
      this.createRecoveryPoint('Auto-save');
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('🛑 Auto-save stopped');
    }
  }

  createRecoveryPoint(description: string = 'Manual save') {
    const now = Date.now();
    
    // Avoid creating too many recovery points too quickly
    if (now - this.lastSaveTime < 5000) {
      console.log('⏳ Skipping recovery point (too soon)');
      return;
    }

    try {
      const state = useVB6Store.getState();
      const recoveryPoint: RecoveryPoint = {
        timestamp: now,
        state: {
          controls: state.controls,
          selectedControls: state.selectedControls,
          currentCode: state.currentCode,
          executionMode: state.executionMode,
          snapToGrid: state.snapToGrid,
          gridSize: state.gridSize,
          designerZoom: state.designerZoom,
        },
        description,
      };

      this.recoveryPoints.push(recoveryPoint);
      
      // Keep only the latest recovery points
      if (this.recoveryPoints.length > this.maxRecoveryPoints) {
        this.recoveryPoints.shift();
      }

      this.saveRecoveryPoints();
      this.lastSaveTime = now;
      
      console.log('✅ Recovery point created:', description);
      console.log(`📊 Total recovery points: ${this.recoveryPoints.length}`);
    } catch (error) {
      console.error('❌ Failed to create recovery point:', error);
    }
  }

  getRecoveryPoints(): RecoveryPoint[] {
    return this.recoveryPoints;
  }

  restoreRecoveryPoint(timestamp: number): boolean {
    const recoveryPoint = this.recoveryPoints.find(rp => rp.timestamp === timestamp);
    
    if (!recoveryPoint) {
      console.error('❌ Recovery point not found');
      return false;
    }

    try {
      const store = useVB6Store.getState();
      
      // Restore state
      if (recoveryPoint.state.controls) {
        store.controls = recoveryPoint.state.controls;
      }
      if (recoveryPoint.state.selectedControls) {
        store.selectedControls = recoveryPoint.state.selectedControls;
      }
      if (recoveryPoint.state.currentCode !== undefined) {
        store.updateCode(recoveryPoint.state.currentCode);
      }
      if (recoveryPoint.state.executionMode) {
        store.setExecutionMode(recoveryPoint.state.executionMode);
      }
      if (recoveryPoint.state.snapToGrid !== undefined) {
        store.toggleSnapToGrid();
      }
      if (recoveryPoint.state.gridSize) {
        store.setGridSize(recoveryPoint.state.gridSize);
      }
      if (recoveryPoint.state.designerZoom) {
        store.setDesignerZoom(recoveryPoint.state.designerZoom);
      }

      console.log('✅ Recovery point restored:', recoveryPoint.description);
      return true;
    } catch (error) {
      console.error('❌ Failed to restore recovery point:', error);
      return false;
    }
  }

  getLatestRecoveryPoint(): RecoveryPoint | null {
    return this.recoveryPoints[this.recoveryPoints.length - 1] || null;
  }

  clearRecoveryPoints() {
    this.recoveryPoints = [];
    this.saveRecoveryPoints();
    console.log('🗑️ All recovery points cleared');
  }

  private saveRecoveryPoints() {
    try {
      const data = JSON.stringify(this.recoveryPoints);
      localStorage.setItem('vb6-recovery-points', data);
    } catch (error) {
      console.error('❌ Failed to save recovery points:', error);
    }
  }

  private loadRecoveryPoints() {
    try {
      const data = localStorage.getItem('vb6-recovery-points');
      if (data) {
        this.recoveryPoints = JSON.parse(data);
        console.log(`📂 Loaded ${this.recoveryPoints.length} recovery points`);
      }
    } catch (error) {
      console.error('❌ Failed to load recovery points:', error);
      this.recoveryPoints = [];
    }
  }

  exportRecoveryPoint(timestamp: number): string | null {
    const recoveryPoint = this.recoveryPoints.find(rp => rp.timestamp === timestamp);
    
    if (!recoveryPoint) {
      return null;
    }

    return JSON.stringify(recoveryPoint, null, 2);
  }

  importRecoveryPoint(data: string): boolean {
    try {
      const recoveryPoint = JSON.parse(data) as RecoveryPoint;
      
      // Validate recovery point
      if (!recoveryPoint.timestamp || !recoveryPoint.state || !recoveryPoint.description) {
        throw new Error('Invalid recovery point format');
      }

      this.recoveryPoints.push(recoveryPoint);
      this.saveRecoveryPoints();
      
      console.log('✅ Recovery point imported:', recoveryPoint.description);
      return true;
    } catch (error) {
      console.error('❌ Failed to import recovery point:', error);
      return false;
    }
  }

  /**
   * Clean up resources and event listeners to prevent memory leaks
   */
  destroy(): void {
    // Stop auto-save interval
    this.stopAutoSave();
    
    // Remove error event listeners
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
      this.errorHandler = null;
    }
    
    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
      this.rejectionHandler = null;
    }
    
    // Clear recovery points from memory
    this.recoveryPoints = [];
    
    console.log('✅ AutoRecoveryService destroyed and cleaned up');
  }
}

export const autoRecoveryService = AutoRecoveryService.getInstance();