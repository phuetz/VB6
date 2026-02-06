// Hook React pour les outils de layout
// Intègre les outils de distribution et d'alignement avec le système d'undo/redo

import { useCallback } from 'react';
import { VB6Control } from '../types/VB6Types';
import { Control } from '../context/types';
import {
  layoutToolsService,
  AlignmentOptions,
  DistributionOptions,
  SpacingOptions,
} from '../services/LayoutToolsService';
import { useUndoRedo } from './useUndoRedo';

export interface UseLayoutToolsReturn {
  // Alignement
  alignControls: (controls: Control[], options: AlignmentOptions) => Control[];
  alignLeft: (controls: Control[]) => Control[];
  alignCenter: (controls: Control[]) => Control[];
  alignRight: (controls: Control[]) => Control[];
  alignTop: (controls: Control[]) => Control[];
  alignMiddle: (controls: Control[]) => Control[];
  alignBottom: (controls: Control[]) => Control[];

  // Distribution
  distributeControls: (controls: Control[], options: DistributionOptions) => Control[];
  distributeHorizontally: (controls: Control[], type?: DistributionOptions['type']) => Control[];
  distributeVertically: (controls: Control[], type?: DistributionOptions['type']) => Control[];

  // Espacement
  applySpacing: (controls: Control[], options: SpacingOptions) => Control[];
  arrangeInGrid: (
    controls: Control[],
    columns: number,
    spacing?: { x: number; y: number }
  ) => Control[];

  // Redimensionnement
  resizeControls: (
    controls: Control[],
    options: {
      width?: number | 'max' | 'min' | 'average';
      height?: number | 'max' | 'min' | 'average';
    }
  ) => Control[];
  makeSameWidth: (controls: Control[]) => Control[];
  makeSameHeight: (controls: Control[]) => Control[];
  makeSameSize: (controls: Control[]) => Control[];

  // Utilitaires
  getSuggestedSpacing: (controls: Control[]) => {
    horizontal: number;
    vertical: number;
    gridSpacing: { x: number; y: number };
  };
  getSelectionBounds: (controls: Control[]) => {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
}

// Helper functions to convert between Control and VB6Control formats
const controlToVB6Control = (control: Control): VB6Control => ({
  Name: control.name,
  Left: control.x,
  Top: control.y,
  Width: control.width,
  Height: control.height,
  Visible: control.visible,
  Enabled: control.enabled,
  Caption: control.caption,
  Text: control.text,
  BackColor: control.backColor,
  ForeColor: control.foreColor,
  TabIndex: control.tabIndex,
  TabStop: control.tabStop,
  Tag: control.tag,
  ToolTipText: control.toolTipText,
});

const vb6ControlToControl = (vb6Control: VB6Control, originalControl: Control): Control => ({
  ...originalControl,
  x: vb6Control.Left || originalControl.x,
  y: vb6Control.Top || originalControl.y,
  width: vb6Control.Width || originalControl.width,
  height: vb6Control.Height || originalControl.height,
  visible: vb6Control.Visible !== undefined ? vb6Control.Visible : originalControl.visible,
  enabled: vb6Control.Enabled !== undefined ? vb6Control.Enabled : originalControl.enabled,
  caption: vb6Control.Caption !== undefined ? vb6Control.Caption : originalControl.caption,
  text: vb6Control.Text !== undefined ? vb6Control.Text : originalControl.text,
  backColor: vb6Control.BackColor || originalControl.backColor,
  foreColor: vb6Control.ForeColor || originalControl.foreColor,
  tabIndex: vb6Control.TabIndex || originalControl.tabIndex,
  tabStop: vb6Control.TabStop !== undefined ? vb6Control.TabStop : originalControl.tabStop,
  tag: vb6Control.Tag || originalControl.tag,
  toolTipText: vb6Control.ToolTipText || originalControl.toolTipText,
});

export const useLayoutTools = (): UseLayoutToolsReturn => {
  const { recordLayoutOperation } = useUndoRedo();

  // Wrapper pour enregistrer les opérations dans l'historique
  const withUndoRedo = useCallback(
    <T extends Control[]>(operation: () => T, operationType: string, controlIds: string[]): T => {
      const result = operation();
      recordLayoutOperation(operationType, controlIds, result);
      return result;
    },
    [recordLayoutOperation]
  );

  // Alignement
  const alignControls = useCallback(
    (controls: Control[], options: AlignmentOptions): Control[] => {
      return withUndoRedo(
        () => {
          const vb6Controls = controls.map(controlToVB6Control);
          const updatedVB6Controls = layoutToolsService.alignControls(vb6Controls, options);
          return updatedVB6Controls.map((vb6Control, index) =>
            vb6ControlToControl(vb6Control, controls[index])
          );
        },
        `Align ${options.type}`,
        controls.map(c => c.name)
      );
    },
    [withUndoRedo]
  );

  const alignLeft = useCallback(
    (controls: Control[]): Control[] => {
      return alignControls(controls, {
        direction: 'horizontal',
        type: 'left',
        reference: 'selection',
      });
    },
    [alignControls]
  );

  const alignCenter = useCallback(
    (controls: Control[]): Control[] => {
      return alignControls(controls, {
        direction: 'horizontal',
        type: 'center',
        reference: 'selection',
      });
    },
    [alignControls]
  );

  const alignRight = useCallback(
    (controls: Control[]): Control[] => {
      return alignControls(controls, {
        direction: 'horizontal',
        type: 'right',
        reference: 'selection',
      });
    },
    [alignControls]
  );

  const alignTop = useCallback(
    (controls: Control[]): Control[] => {
      return alignControls(controls, {
        direction: 'vertical',
        type: 'top',
        reference: 'selection',
      });
    },
    [alignControls]
  );

  const alignMiddle = useCallback(
    (controls: Control[]): Control[] => {
      return alignControls(controls, {
        direction: 'vertical',
        type: 'middle',
        reference: 'selection',
      });
    },
    [alignControls]
  );

  const alignBottom = useCallback(
    (controls: Control[]): Control[] => {
      return alignControls(controls, {
        direction: 'vertical',
        type: 'bottom',
        reference: 'selection',
      });
    },
    [alignControls]
  );

  // Distribution
  const distributeControls = useCallback(
    (controls: Control[], options: DistributionOptions): Control[] => {
      return withUndoRedo(
        () => {
          const vb6Controls = controls.map(controlToVB6Control);
          const updatedVB6Controls = layoutToolsService.distributeControls(vb6Controls, options);
          return updatedVB6Controls.map((vb6Control, index) =>
            vb6ControlToControl(vb6Control, controls[index])
          );
        },
        `Distribute ${options.direction} by ${options.type}`,
        controls.map(c => c.name)
      );
    },
    [withUndoRedo]
  );

  const distributeHorizontally = useCallback(
    (controls: Control[], type: DistributionOptions['type'] = 'centers'): Control[] => {
      return distributeControls(controls, { direction: 'horizontal', type });
    },
    [distributeControls]
  );

  const distributeVertically = useCallback(
    (controls: Control[], type: DistributionOptions['type'] = 'centers'): Control[] => {
      return distributeControls(controls, { direction: 'vertical', type });
    },
    [distributeControls]
  );

  // Espacement
  const applySpacing = useCallback(
    (controls: VB6Control[], options: SpacingOptions): VB6Control[] => {
      return withUndoRedo(
        () => layoutToolsService.applySpacing(controls, options),
        'Apply spacing',
        controls.map(c => c.Name)
      );
    },
    [withUndoRedo]
  );

  const arrangeInGrid = useCallback(
    (controls: VB6Control[], columns: number, spacing?: { x: number; y: number }): VB6Control[] => {
      const suggestedSpacing = layoutToolsService.getSuggestedSpacing(controls);
      const finalSpacing = spacing || suggestedSpacing.gridSpacing;

      return withUndoRedo(
        () => layoutToolsService.arrangeInGrid(controls, columns, finalSpacing),
        `Arrange in ${columns}-column grid`,
        controls.map(c => c.Name)
      );
    },
    [withUndoRedo]
  );

  // Redimensionnement
  const resizeControls = useCallback(
    (
      controls: VB6Control[],
      options: {
        width?: number | 'max' | 'min' | 'average';
        height?: number | 'max' | 'min' | 'average';
      }
    ): VB6Control[] => {
      const operationName = [];
      if (options.width !== undefined) operationName.push(`width to ${options.width}`);
      if (options.height !== undefined) operationName.push(`height to ${options.height}`);

      return withUndoRedo(
        () => layoutToolsService.resizeControls(controls, options),
        `Resize ${operationName.join(' and ')}`,
        controls.map(c => c.Name)
      );
    },
    [withUndoRedo]
  );

  const makeSameWidth = useCallback(
    (controls: VB6Control[]): VB6Control[] => {
      return resizeControls(controls, { width: 'max' });
    },
    [resizeControls]
  );

  const makeSameHeight = useCallback(
    (controls: VB6Control[]): VB6Control[] => {
      return resizeControls(controls, { height: 'max' });
    },
    [resizeControls]
  );

  const makeSameSize = useCallback(
    (controls: VB6Control[]): VB6Control[] => {
      return resizeControls(controls, { width: 'max', height: 'max' });
    },
    [resizeControls]
  );

  // Utilitaires
  const getSuggestedSpacing = useCallback((controls: VB6Control[]) => {
    return layoutToolsService.getSuggestedSpacing(controls);
  }, []);

  const getSelectionBounds = useCallback((controls: VB6Control[]) => {
    if (controls.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }

    const left = Math.min(...controls.map(c => c.Left || 0));
    const top = Math.min(...controls.map(c => c.Top || 0));
    const right = Math.max(...controls.map(c => (c.Left || 0) + (c.Width || 0)));
    const bottom = Math.max(...controls.map(c => (c.Top || 0) + (c.Height || 0)));

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }, []);

  return {
    // Alignement
    alignControls,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,

    // Distribution
    distributeControls,
    distributeHorizontally,
    distributeVertically,

    // Espacement
    applySpacing,
    arrangeInGrid,

    // Redimensionnement
    resizeControls,
    makeSameWidth,
    makeSameHeight,
    makeSameSize,

    // Utilitaires
    getSuggestedSpacing,
    getSelectionBounds,
  };
};
