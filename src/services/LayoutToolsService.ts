// Service pour les outils de distribution et d'espacement
// Fournit des fonctions professionnelles pour aligner et distribuer les contrôles

import { VB6Control } from '../types/VB6Types';

export interface DistributionOptions {
  direction: 'horizontal' | 'vertical';
  type: 'space' | 'centers' | 'edges';
  spacing?: number; // Pour l'espacement uniforme
}

export interface AlignmentOptions {
  direction: 'horizontal' | 'vertical';
  type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  reference?: 'selection' | 'form' | 'grid';
}

export interface SpacingOptions {
  horizontal?: number;
  vertical?: number;
  applyToAll?: boolean;
}

export class LayoutToolsService {
  private static instance: LayoutToolsService;

  static getInstance(): LayoutToolsService {
    if (!LayoutToolsService.instance) {
      LayoutToolsService.instance = new LayoutToolsService();
    }
    return LayoutToolsService.instance;
  }

  // Aligner les contrôles sélectionnés
  alignControls(controls: VB6Control[], options: AlignmentOptions): VB6Control[] {
    if (controls.length < 2) return controls;

    const updatedControls = [...controls];
    const bounds = this.getSelectionBounds(controls);

    let referenceValue: number;

    switch (options.type) {
      case 'left':
        referenceValue = options.reference === 'form' ? 0 : bounds.left;
        updatedControls.forEach(control => {
          control.Left = referenceValue;
        });
        break;

      case 'center':
        referenceValue =
          options.reference === 'form'
            ? 400 // Assuming form width ~800
            : bounds.left + bounds.width / 2;
        updatedControls.forEach(control => {
          control.Left = referenceValue - (control.Width || 0) / 2;
        });
        break;

      case 'right':
        referenceValue =
          options.reference === 'form'
            ? 800 // Assuming form width
            : bounds.right;
        updatedControls.forEach(control => {
          control.Left = referenceValue - (control.Width || 0);
        });
        break;

      case 'top':
        referenceValue = options.reference === 'form' ? 0 : bounds.top;
        updatedControls.forEach(control => {
          control.Top = referenceValue;
        });
        break;

      case 'middle':
        referenceValue =
          options.reference === 'form'
            ? 300 // Assuming form height ~600
            : bounds.top + bounds.height / 2;
        updatedControls.forEach(control => {
          control.Top = referenceValue - (control.Height || 0) / 2;
        });
        break;

      case 'bottom':
        referenceValue =
          options.reference === 'form'
            ? 600 // Assuming form height
            : bounds.bottom;
        updatedControls.forEach(control => {
          control.Top = referenceValue - (control.Height || 0);
        });
        break;
    }

    return updatedControls;
  }

  // Distribuer les contrôles uniformément
  distributeControls(controls: VB6Control[], options: DistributionOptions): VB6Control[] {
    if (controls.length < 3) return controls;

    const updatedControls = [...controls];
    const bounds = this.getSelectionBounds(controls);

    if (options.direction === 'horizontal') {
      // Trier par position horizontale
      updatedControls.sort((a, b) => (a.Left || 0) - (b.Left || 0));

      if (options.type === 'space') {
        // Distribution par espacement uniforme
        const totalWidth = updatedControls.reduce((sum, control) => sum + (control.Width || 0), 0);
        const availableSpace = bounds.width - totalWidth;
        const spacing =
          options.spacing !== undefined ? options.spacing : availableSpace / (controls.length - 1);

        let currentX = bounds.left;
        updatedControls.forEach(control => {
          control.Left = currentX;
          currentX += (control.Width || 0) + spacing;
        });
      } else if (options.type === 'centers') {
        // Distribution par centres
        const spacing = bounds.width / (controls.length - 1);
        updatedControls.forEach((control, index) => {
          const centerX = bounds.left + index * spacing;
          control.Left = centerX - (control.Width || 0) / 2;
        });
      } else if (options.type === 'edges') {
        // Distribution par bords
        const spacing = bounds.width / (controls.length - 1);
        updatedControls.forEach((control, index) => {
          control.Left = bounds.left + index * spacing;
        });
      }
    } else {
      // vertical
      // Trier par position verticale
      updatedControls.sort((a, b) => (a.Top || 0) - (b.Top || 0));

      if (options.type === 'space') {
        // Distribution par espacement uniforme
        const totalHeight = updatedControls.reduce(
          (sum, control) => sum + (control.Height || 0),
          0
        );
        const availableSpace = bounds.height - totalHeight;
        const spacing =
          options.spacing !== undefined ? options.spacing : availableSpace / (controls.length - 1);

        let currentY = bounds.top;
        updatedControls.forEach(control => {
          control.Top = currentY;
          currentY += (control.Height || 0) + spacing;
        });
      } else if (options.type === 'centers') {
        // Distribution par centres
        const spacing = bounds.height / (controls.length - 1);
        updatedControls.forEach((control, index) => {
          const centerY = bounds.top + index * spacing;
          control.Top = centerY - (control.Height || 0) / 2;
        });
      } else if (options.type === 'edges') {
        // Distribution par bords
        const spacing = bounds.height / (controls.length - 1);
        updatedControls.forEach((control, index) => {
          control.Top = bounds.top + index * spacing;
        });
      }
    }

    return updatedControls;
  }

  // Appliquer un espacement uniforme
  applySpacing(controls: VB6Control[], options: SpacingOptions): VB6Control[] {
    if (controls.length < 2) return controls;

    const updatedControls = [...controls];

    if (options.horizontal !== undefined) {
      // Trier par position horizontale
      updatedControls.sort((a, b) => (a.Left || 0) - (b.Left || 0));

      let currentX = updatedControls[0].Left || 0;
      for (let i = 1; i < updatedControls.length; i++) {
        currentX += (updatedControls[i - 1].Width || 0) + options.horizontal;
        updatedControls[i].Left = currentX;
      }
    }

    if (options.vertical !== undefined) {
      // Trier par position verticale
      updatedControls.sort((a, b) => (a.Top || 0) - (b.Top || 0));

      let currentY = updatedControls[0].Top || 0;
      for (let i = 1; i < updatedControls.length; i++) {
        currentY += (updatedControls[i - 1].Height || 0) + options.vertical;
        updatedControls[i].Top = currentY;
      }
    }

    return updatedControls;
  }

  // Créer une grille de contrôles
  arrangeInGrid(
    controls: VB6Control[],
    columns: number,
    spacing: { x: number; y: number }
  ): VB6Control[] {
    if (controls.length === 0) return controls;

    const updatedControls = [...controls];
    const bounds = this.getSelectionBounds(controls);

    let row = 0;
    let col = 0;

    updatedControls.forEach((control, index) => {
      const x = bounds.left + col * spacing.x;
      const y = bounds.top + row * spacing.y;

      control.Left = x;
      control.Top = y;

      col++;
      if (col >= columns) {
        col = 0;
        row++;
      }
    });

    return updatedControls;
  }

  // Adapter la taille des contrôles
  resizeControls(
    controls: VB6Control[],
    options: {
      width?: number | 'max' | 'min' | 'average';
      height?: number | 'max' | 'min' | 'average';
    }
  ): VB6Control[] {
    if (controls.length === 0) return controls;

    const updatedControls = [...controls];

    if (options.width !== undefined) {
      let targetWidth: number;

      if (typeof options.width === 'number') {
        targetWidth = options.width;
      } else {
        const widths = controls.map(c => c.Width || 0);
        switch (options.width) {
          case 'max':
            targetWidth = Math.max(...widths);
            break;
          case 'min':
            targetWidth = Math.min(...widths);
            break;
          case 'average':
            targetWidth = widths.reduce((sum, w) => sum + w, 0) / widths.length;
            break;
          default:
            targetWidth = 100;
        }
      }

      updatedControls.forEach(control => {
        control.Width = targetWidth;
      });
    }

    if (options.height !== undefined) {
      let targetHeight: number;

      if (typeof options.height === 'number') {
        targetHeight = options.height;
      } else {
        const heights = controls.map(c => c.Height || 0);
        switch (options.height) {
          case 'max':
            targetHeight = Math.max(...heights);
            break;
          case 'min':
            targetHeight = Math.min(...heights);
            break;
          case 'average':
            targetHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
            break;
          default:
            targetHeight = 25;
        }
      }

      updatedControls.forEach(control => {
        control.Height = targetHeight;
      });
    }

    return updatedControls;
  }

  // Calculer les limites de la sélection
  private getSelectionBounds(controls: VB6Control[]): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } {
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
  }

  // Obtenir des suggestions d'espacement intelligent
  getSuggestedSpacing(controls: VB6Control[]): {
    horizontal: number;
    vertical: number;
    gridSpacing: { x: number; y: number };
  } {
    if (controls.length < 2) {
      return { horizontal: 8, vertical: 8, gridSpacing: { x: 120, y: 40 } };
    }

    // Analyser les espacements existants
    const horizontalSpacings: number[] = [];
    const verticalSpacings: number[] = [];

    for (let i = 0; i < controls.length - 1; i++) {
      for (let j = i + 1; j < controls.length; j++) {
        const control1 = controls[i];
        const control2 = controls[j];

        const hSpacing = Math.abs((control1.Left || 0) - (control2.Left || 0));
        const vSpacing = Math.abs((control1.Top || 0) - (control2.Top || 0));

        if (hSpacing > 0) horizontalSpacings.push(hSpacing);
        if (vSpacing > 0) verticalSpacings.push(vSpacing);
      }
    }

    // Calculer les espacements moyens ou utiliser des valeurs par défaut
    const avgHorizontal =
      horizontalSpacings.length > 0
        ? horizontalSpacings.reduce((sum, s) => sum + s, 0) / horizontalSpacings.length
        : 8;

    const avgVertical =
      verticalSpacings.length > 0
        ? verticalSpacings.reduce((sum, s) => sum + s, 0) / verticalSpacings.length
        : 8;

    // Calculer l'espacement de grille suggéré
    const maxWidth = Math.max(...controls.map(c => c.Width || 0));
    const maxHeight = Math.max(...controls.map(c => c.Height || 0));

    return {
      horizontal: Math.max(8, Math.round(avgHorizontal)),
      vertical: Math.max(8, Math.round(avgVertical)),
      gridSpacing: {
        x: Math.max(maxWidth + 16, 120),
        y: Math.max(maxHeight + 16, 40),
      },
    };
  }
}

// Export de l'instance singleton
export const layoutToolsService = LayoutToolsService.getInstance();
