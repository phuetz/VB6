/**
 * Tests unitaires pour le store Zustand principal
 * Teste toutes les fonctionnalités critiques du store VB6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVB6Store } from '../../stores/vb6Store';

// Mock du store initial
const getInitialStore = () => ({
  currentCode: '',
  controls: [],
  isDesignMode: true,
  selectedControlId: null,
  clipboardData: null,
  showToolbox: true,
  showProperties: true,
  showProjectExplorer: true,
  showImmediateWindow: false,
  projectName: 'VB6 Project',
  isDirty: false,
  lastSaved: null,
  canvasSize: { width: 800, height: 600 },
  gridSize: 8,
  showGrid: true,
  snapToGrid: true,
  zoomLevel: 1,
});

describe('VB6 Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const state = useVB6Store.getState();
    if (state.resetStore) {
      state.resetStore();
    }
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useVB6Store.getState();

      // Basic state
      expect(state.currentCode).toBe('');
      expect(state.controls).toEqual([]);
      expect(state.isDesignMode).toBe(true);
      expect(state.selectedControlId).toBeNull();
      expect(state.clipboardData).toBeNull();

      // UI state
      expect(state.showToolbox).toBe(true);
      expect(state.showProperties).toBe(true);
      expect(state.showProjectExplorer).toBe(true);
      expect(state.showImmediateWindow).toBe(false);

      // Project state
      expect(state.projectName).toBe('VB6 Project');
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();

      // Canvas state
      expect(state.canvasSize).toEqual({ width: 800, height: 600 });
      expect(state.gridSize).toBe(8);
      expect(state.showGrid).toBe(true);
      expect(state.snapToGrid).toBe(true);
      expect(state.zoomLevel).toBe(1);
    });

    it('should provide all required actions', () => {
      const state = useVB6Store.getState();

      // Code actions
      expect(typeof state.updateCode).toBe('function');
      expect(typeof state.insertCode).toBe('function');

      // Control actions
      expect(typeof state.addControl).toBe('function');
      expect(typeof state.updateControl).toBe('function');
      expect(typeof state.deleteControl).toBe('function');
      expect(typeof state.selectControl).toBe('function');
      expect(typeof state.duplicateControl).toBe('function');

      // UI actions
      expect(typeof state.toggleDesignMode).toBe('function');
      expect(typeof state.togglePanel).toBe('function');
      expect(typeof state.setZoomLevel).toBe('function');

      // Project actions
      expect(typeof state.newProject).toBe('function');
      expect(typeof state.saveProject).toBe('function');
      expect(typeof state.loadProject).toBe('function');
    });
  });

  describe('Code Management', () => {
    it('should update code correctly', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updateCode('Private Sub Form_Load()\n  Debug.Print "Hello World"\nEnd Sub');
      });

      expect(result.current.currentCode).toBe(
        'Private Sub Form_Load()\n  Debug.Print "Hello World"\nEnd Sub'
      );
      expect(result.current.isDirty).toBe(true);
    });

    it('should insert code at specific position', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updateCode('Private Sub Form_Load()\nEnd Sub');
      });

      act(() => {
        result.current.insertCode('  Debug.Print "Inserted"\n', 25);
      });

      expect(result.current.currentCode).toContain('Debug.Print "Inserted"');
    });

    it('should track dirty state on code changes', () => {
      const { result } = renderHook(() => useVB6Store());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.updateCode('test code');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Control Management', () => {
    it('should add control correctly', () => {
      const { result } = renderHook(() => useVB6Store());

      const newControl = {
        id: 'TextBox1',
        type: 'TextBox',
        name: 'TextBox1',
        left: 10,
        top: 10,
        width: 100,
        height: 24,
        properties: {},
      };

      act(() => {
        result.current.addControl(newControl);
      });

      expect(result.current.controls).toHaveLength(1);
      expect(result.current.controls[0]).toEqual(newControl);
      expect(result.current.isDirty).toBe(true);
    });

    it('should update control properties', () => {
      const { result } = renderHook(() => useVB6Store());

      const control = {
        id: 'TextBox1',
        type: 'TextBox',
        name: 'TextBox1',
        left: 10,
        top: 10,
        width: 100,
        height: 24,
        properties: { Text: 'Initial' },
      };

      act(() => {
        result.current.addControl(control);
      });

      act(() => {
        result.current.updateControl('TextBox1', { properties: { Text: 'Updated' } });
      });

      expect(result.current.controls[0].properties.Text).toBe('Updated');
    });

    it('should delete control correctly', () => {
      const { result } = renderHook(() => useVB6Store());

      const control = {
        id: 'TextBox1',
        type: 'TextBox',
        name: 'TextBox1',
        left: 10,
        top: 10,
        width: 100,
        height: 24,
        properties: {},
      };

      act(() => {
        result.current.addControl(control);
      });

      expect(result.current.controls).toHaveLength(1);

      act(() => {
        result.current.deleteControl('TextBox1');
      });

      expect(result.current.controls).toHaveLength(0);
    });

    it('should select control correctly', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.selectControl('TextBox1');
      });

      expect(result.current.selectedControlId).toBe('TextBox1');
    });

    it('should duplicate control with unique ID', () => {
      const { result } = renderHook(() => useVB6Store());

      const control = {
        id: 'TextBox1',
        type: 'TextBox',
        name: 'TextBox1',
        left: 10,
        top: 10,
        width: 100,
        height: 24,
        properties: {},
      };

      act(() => {
        result.current.addControl(control);
      });

      act(() => {
        result.current.duplicateControl('TextBox1');
      });

      expect(result.current.controls).toHaveLength(2);
      expect(result.current.controls[1].id).not.toBe('TextBox1');
      expect(result.current.controls[1].name).not.toBe('TextBox1');
    });
  });

  describe('Panel Management', () => {
    it('should toggle panels correctly', () => {
      const { result } = renderHook(() => useVB6Store());

      expect(result.current.showToolbox).toBe(true);

      act(() => {
        result.current.togglePanel('toolbox');
      });

      expect(result.current.showToolbox).toBe(false);

      act(() => {
        result.current.togglePanel('toolbox');
      });

      expect(result.current.showToolbox).toBe(true);
    });
  });

  describe('Canvas Settings', () => {
    it('should update zoom level', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.setZoomLevel(1.5);
      });

      expect(result.current.zoomLevel).toBe(1.5);
    });

    it('should clamp zoom level to valid range', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.setZoomLevel(5);
      });

      expect(result.current.zoomLevel).toBeLessThanOrEqual(4);

      act(() => {
        result.current.setZoomLevel(0.1);
      });

      expect(result.current.zoomLevel).toBeGreaterThanOrEqual(0.25);
    });
  });

  describe('Project Management', () => {
    it('should create new project', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updateCode('some code');
        result.current.addControl({
          id: 'TextBox1',
          type: 'TextBox',
          name: 'TextBox1',
          left: 10,
          top: 10,
          width: 100,
          height: 24,
          properties: {},
        });
      });

      act(() => {
        result.current.newProject();
      });

      expect(result.current.currentCode).toBe('');
      expect(result.current.controls).toHaveLength(0);
      expect(result.current.isDirty).toBe(false);
    });

    it('should save project', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updateCode('test code');
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.lastSaved).toBeNull();

      act(() => {
        result.current.saveProject();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.lastSaved).not.toBeNull();
    });

    it('should load project data', () => {
      const { result } = renderHook(() => useVB6Store());

      const projectData = {
        projectName: 'Test Project',
        currentCode: 'loaded code',
        controls: [
          {
            id: 'Button1',
            type: 'CommandButton',
            name: 'Button1',
            left: 20,
            top: 20,
            width: 75,
            height: 25,
            properties: { Caption: 'Click Me' },
          },
        ],
      };

      act(() => {
        result.current.loadProject(projectData);
      });

      expect(result.current.projectName).toBe('Test Project');
      expect(result.current.currentCode).toBe('loaded code');
      expect(result.current.controls).toHaveLength(1);
      expect(result.current.controls[0].name).toBe('Button1');
    });
  });

  describe('Clipboard Operations', () => {
    it('should copy control to clipboard', () => {
      const { result } = renderHook(() => useVB6Store());

      const control = {
        id: 'TextBox1',
        type: 'TextBox',
        name: 'TextBox1',
        left: 10,
        top: 10,
        width: 100,
        height: 24,
        properties: {},
      };

      act(() => {
        result.current.addControl(control);
        result.current.copyControl('TextBox1');
      });

      expect(result.current.clipboardData).not.toBeNull();
      expect(result.current.clipboardData?.type).toBe('control');
      expect(result.current.clipboardData?.data.type).toBe('TextBox');
    });

    it('should paste control from clipboard', () => {
      const { result } = renderHook(() => useVB6Store());

      const control = {
        id: 'TextBox1',
        type: 'TextBox',
        name: 'TextBox1',
        left: 10,
        top: 10,
        width: 100,
        height: 24,
        properties: {},
      };

      act(() => {
        result.current.addControl(control);
        result.current.copyControl('TextBox1');
      });

      act(() => {
        result.current.pasteControl();
      });

      expect(result.current.controls).toHaveLength(2);
      expect(result.current.controls[1].type).toBe('TextBox');
      expect(result.current.controls[1].id).not.toBe('TextBox1');
    });
  });

  describe('Undo/Redo System', () => {
    it('should track history for undoable actions', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updateCode('first change');
      });

      act(() => {
        result.current.updateCode('second change');
      });

      expect(result.current.history).toBeDefined();
      expect(result.current.historyIndex).toBeGreaterThan(-1);
    });

    it('should undo and redo code changes', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updateCode('first');
      });

      act(() => {
        result.current.updateCode('second');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.currentCode).toBe('first');

      act(() => {
        result.current.redo();
      });

      expect(result.current.currentCode).toBe('second');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const state = useVB6Store.getState();

      expect(state.performanceMetrics).toBeDefined();
      expect(state.performanceMetrics.renderTime).toBe(0);
      expect(state.performanceMetrics.memoryUsage).toBe(0);
    });

    it('should update performance metrics', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.updatePerformanceMetrics({
          renderTime: 16.5,
          memoryUsage: 1024000,
        });
      });

      expect(result.current.performanceMetrics.renderTime).toBe(16.5);
      expect(result.current.performanceMetrics.memoryUsage).toBe(1024000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid control updates gracefully', () => {
      const { result } = renderHook(() => useVB6Store());

      expect(() => {
        act(() => {
          result.current.updateControl('non-existent', { left: 100 });
        });
      }).not.toThrow();
    });

    it('should handle invalid control deletion gracefully', () => {
      const { result } = renderHook(() => useVB6Store());

      expect(() => {
        act(() => {
          result.current.deleteControl('non-existent');
        });
      }).not.toThrow();
    });

    it('should handle invalid control selection gracefully', () => {
      const { result } = renderHook(() => useVB6Store());

      act(() => {
        result.current.selectControl('non-existent');
      });

      expect(result.current.selectedControlId).toBe('non-existent');
    });
  });
});
