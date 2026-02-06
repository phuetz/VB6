/**
 * VB6 Graphics API Implementation
 *
 * Complete implementation of VB6 graphics methods: Line, Circle, PSet, Cls
 * DrawMode, FillStyle, ScaleMode and other graphics properties
 */

import { errorHandler } from './VB6ErrorHandling';

// VB6 Drawing Constants
export const VB6DrawingConstants = {
  // DrawMode constants
  vbBlackness: 1,
  vbNotMergePen: 2,
  vbMaskNotPen: 3,
  vbNotCopyPen: 4,
  vbMaskPenNot: 5,
  vbInvert: 6,
  vbXorPen: 7,
  vbNotMaskPen: 8,
  vbMaskPen: 9,
  vbNotXorPen: 10,
  vbNop: 11,
  vbMergeNotPen: 12,
  vbCopyPen: 13,
  vbMergePenNot: 14,
  vbMergePen: 15,
  vbWhiteness: 16,

  // FillStyle constants
  vbFSSolid: 0,
  vbFSTransparent: 1,
  vbHorizontalLine: 2,
  vbVerticalLine: 3,
  vbUpwardDiagonal: 4,
  vbDownwardDiagonal: 5,
  vbCross: 6,
  vbDiagonalCross: 7,

  // ScaleMode constants
  vbUser: 0,
  vbTwips: 1,
  vbPoints: 2,
  vbPixels: 3,
  vbCharacters: 4,
  vbInches: 5,
  vbMillimeters: 6,
  vbCentimeters: 7,

  // Colors (VB6 uses BGR format: 0x00BBGGRR)
  vbBlack: 0x000000, // Black (R:0, G:0, B:0)
  vbRed: 0x0000ff, // Red (R:255, G:0, B:0)
  vbGreen: 0x00ff00, // Green (R:0, G:255, B:0)
  vbYellow: 0x00ffff, // Yellow (R:255, G:255, B:0)
  vbBlue: 0xff0000, // Blue (R:0, G:0, B:255)
  vbMagenta: 0xff00ff, // Magenta (R:255, G:0, B:255)
  vbCyan: 0xffff00, // Cyan (R:0, G:255, B:255)
  vbWhite: 0xffffff, // White (R:255, G:255, B:255)

  // System colors
  vbButtonFace: 0x8000000f,
  vbButtonShadow: 0x80000010,
  vbButtonText: 0x80000012,
  vbTitleBarText: 0x80000009,
  vbHighlight: 0x8000000d,
  vbHighlightText: 0x8000000e,
  vbActiveTitleBar: 0x80000002,
  vbInactiveTitleBar: 0x80000003,
  vbMenuBar: 0x80000004,
  vbWindowBackground: 0x80000005,
  vbWindowFrame: 0x80000006,
  vbMenuText: 0x80000007,
  vbWindowText: 0x80000008,
  vbActiveBorder: 0x8000000a,
  vbInactiveBorder: 0x8000000b,
  vbApplicationWorkspace: 0x8000000c,
  vbScrollBars: 0x80000001,
} as const;

// Line style constants
export const VB6LineConstants = {
  vbDrawModeCopy: 13,
  vbDrawModeXor: 7,
  vbDrawModeInvert: 6,
} as const;

// Graphics Context Interface
export interface VB6GraphicsContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  // VB6 Properties
  CurrentX: number;
  CurrentY: number;
  DrawMode: number;
  DrawStyle: number;
  DrawWidth: number;
  FillColor: number;
  FillStyle: number;
  ForeColor: number;
  ScaleMode: number;
  ScaleLeft: number;
  ScaleTop: number;
  ScaleWidth: number;
  ScaleHeight: number;
  AutoRedraw: boolean;
  // Font properties (set by SetFont)
  FontName?: string;
  FontSize?: number;
  FontBold?: boolean;
  FontItalic?: boolean;
  FontUnderline?: boolean;
}

// VB6 Graphics Engine
export class VB6GraphicsEngine {
  private contexts: Map<string, VB6GraphicsContext> = new Map();
  private activeContext: VB6GraphicsContext | null = null;

  /**
   * Create or get graphics context for a form or control
   */
  getContext(elementId: string): VB6GraphicsContext {
    if (this.contexts.has(elementId)) {
      return this.contexts.get(elementId)!;
    }

    // Create canvas for graphics operations
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not create 2D rendering context');
    }

    // Find target element and setup canvas
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      canvas.width = rect.width || 640;
      canvas.height = rect.height || 480;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      targetElement.style.position = 'relative';
      targetElement.appendChild(canvas);
    } else {
      // Default size if element not found
      canvas.width = 640;
      canvas.height = 480;
    }

    const graphicsContext: VB6GraphicsContext = {
      canvas,
      context,
      CurrentX: 0,
      CurrentY: 0,
      DrawMode: VB6DrawingConstants.vbCopyPen,
      DrawStyle: 0, // Solid line
      DrawWidth: 1,
      FillColor: VB6DrawingConstants.vbWhite,
      FillStyle: VB6DrawingConstants.vbFSTransparent,
      ForeColor: VB6DrawingConstants.vbBlack,
      ScaleMode: VB6DrawingConstants.vbTwips,
      ScaleLeft: 0,
      ScaleTop: 0,
      ScaleWidth: canvas.width * 15, // Convert pixels to twips (15 twips per pixel)
      ScaleHeight: canvas.height * 15,
      AutoRedraw: true,
    };

    this.contexts.set(elementId, graphicsContext);
    this.activeContext = graphicsContext;
    this.applyContextSettings(graphicsContext);

    return graphicsContext;
  }

  /**
   * Set active graphics context
   */
  setActiveContext(elementId: string): void {
    this.activeContext = this.getContext(elementId);
  }

  /**
   * Apply VB6 graphics settings to canvas context
   */
  private applyContextSettings(ctx: VB6GraphicsContext): void {
    // Set line properties
    ctx.context.lineWidth = ctx.DrawWidth;
    ctx.context.strokeStyle = this.colorToCSS(ctx.ForeColor);
    ctx.context.fillStyle = this.colorToCSS(ctx.FillColor);

    // Set line style
    if (ctx.context.setLineDash) {
      if (ctx.DrawStyle === 0) {
        ctx.context.setLineDash([]); // Solid
      } else if (ctx.DrawStyle === 1) {
        ctx.context.setLineDash([5, 5]); // Dash
      } else if (ctx.DrawStyle === 2) {
        ctx.context.setLineDash([2, 2]); // Dot
      } else if (ctx.DrawStyle === 3) {
        ctx.context.setLineDash([5, 2, 2, 2]); // Dash-Dot
      } else if (ctx.DrawStyle === 4) {
        ctx.context.setLineDash([5, 2, 2, 2, 2, 2]); // Dash-Dot-Dot
      }
    }

    // Set composite operation based on DrawMode
    try {
      switch (ctx.DrawMode) {
        case VB6DrawingConstants.vbCopyPen:
          ctx.context.globalCompositeOperation = 'source-over';
          break;
        case VB6DrawingConstants.vbXorPen:
          ctx.context.globalCompositeOperation = 'xor';
          break;
        case VB6DrawingConstants.vbInvert:
          ctx.context.globalCompositeOperation = 'difference';
          break;
        default:
          ctx.context.globalCompositeOperation = 'source-over';
      }
    } catch (e) {
      // Fallback if composite operation not supported
      ctx.context.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Convert VB6 color to CSS color string
   */
  private colorToCSS(vb6Color: number): string {
    if (vb6Color & 0x80000000) {
      // System color
      return this.getSystemColor(vb6Color);
    }

    // Regular RGB color (VB6 uses BGR format)
    const r = vb6Color & 0xff;
    const g = (vb6Color >> 8) & 0xff;
    const b = (vb6Color >> 16) & 0xff;

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get system color value
   */
  private getSystemColor(systemColor: number): string {
    // Simplified system color mapping
    const systemColors: { [key: number]: string } = {
      [VB6DrawingConstants.vbButtonFace]: '#f0f0f0',
      [VB6DrawingConstants.vbButtonShadow]: '#808080',
      [VB6DrawingConstants.vbButtonText]: '#000000',
      [VB6DrawingConstants.vbWindowBackground]: '#ffffff',
      [VB6DrawingConstants.vbWindowText]: '#000000',
      [VB6DrawingConstants.vbHighlight]: '#0078d4',
      [VB6DrawingConstants.vbHighlightText]: '#ffffff',
    };

    return systemColors[systemColor] || '#000000';
  }

  /**
   * Convert coordinates from VB6 scale to pixels
   */
  private scaleToPixels(value: number, isX: boolean, ctx: VB6GraphicsContext): number {
    if (ctx.ScaleMode === VB6DrawingConstants.vbPixels) {
      return value;
    }

    // Convert from current scale mode to pixels
    const scaleRange = isX ? ctx.ScaleWidth : ctx.ScaleHeight;
    const canvasSize = isX ? ctx.canvas.width : ctx.canvas.height;
    const scaleOffset = isX ? ctx.ScaleLeft : ctx.ScaleTop;

    return ((value - scaleOffset) / scaleRange) * canvasSize;
  }

  /**
   * VB6 Line Method
   * Draws a line from (x1, y1) to (x2, y2)
   */
  Line(
    elementId: string,
    x1?: number,
    y1?: number,
    x2?: number,
    y2?: number,
    color?: number,
    drawFlag?: string
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      let startX: number, startY: number, endX: number, endY: number;

      if (x1 === undefined || y1 === undefined) {
        // Line from current position
        startX = ctx.CurrentX;
        startY = ctx.CurrentY;
        endX = x2 !== undefined ? x2 : ctx.CurrentX;
        endY = y2 !== undefined ? y2 : ctx.CurrentY;
      } else if (x2 === undefined || y2 === undefined) {
        // Line to specified point from current position
        startX = ctx.CurrentX;
        startY = ctx.CurrentY;
        endX = x1;
        endY = y1;
      } else {
        // Line between two points
        startX = x1;
        startY = y1;
        endX = x2;
        endY = y2;
      }

      // Convert to pixel coordinates
      const pixelStartX = this.scaleToPixels(startX, true, ctx);
      const pixelStartY = this.scaleToPixels(startY, false, ctx);
      const pixelEndX = this.scaleToPixels(endX, true, ctx);
      const pixelEndY = this.scaleToPixels(endY, false, ctx);

      // Set color if specified
      if (color !== undefined) {
        ctx.context.strokeStyle = this.colorToCSS(color);
      }

      // Draw line or box based on drawFlag
      if (drawFlag === 'B' || drawFlag === 'BF') {
        // Draw box (rectangle)
        const width = pixelEndX - pixelStartX;
        const height = pixelEndY - pixelStartY;

        if (drawFlag === 'BF') {
          // Filled box
          ctx.context.fillRect(pixelStartX, pixelStartY, width, height);
        } else {
          // Outlined box
          ctx.context.strokeRect(pixelStartX, pixelStartY, width, height);
        }
      } else {
        // Draw line
        ctx.context.beginPath();
        ctx.context.moveTo(pixelStartX, pixelStartY);
        ctx.context.lineTo(pixelEndX, pixelEndY);
        ctx.context.stroke();
      }

      // Update current position
      ctx.CurrentX = endX;
      ctx.CurrentY = endY;
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Line');
    }
  }

  /**
   * VB6 Circle Method
   * Draws a circle or arc
   */
  Circle(
    elementId: string,
    x: number,
    y: number,
    radius: number,
    color?: number,
    start?: number,
    end?: number,
    aspect?: number
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      // Convert coordinates
      const pixelX = this.scaleToPixels(x, true, ctx);
      const pixelY = this.scaleToPixels(y, false, ctx);
      const pixelRadius = this.scaleToPixels(radius, true, ctx);

      // Set color if specified
      const drawColor = color !== undefined ? color : ctx.ForeColor;

      ctx.context.save();

      // Handle aspect ratio (ellipse)
      if (aspect !== undefined && aspect !== 1) {
        ctx.context.translate(pixelX, pixelY);
        ctx.context.scale(1, aspect);
        ctx.context.translate(-pixelX, -pixelY);
      }

      ctx.context.beginPath();

      if (start !== undefined || end !== undefined) {
        // Draw arc
        const startAngle = start || 0;
        const endAngle = end || Math.PI * 2;
        ctx.context.arc(pixelX, pixelY, pixelRadius, startAngle, endAngle);
      } else {
        // Draw full circle
        ctx.context.arc(pixelX, pixelY, pixelRadius, 0, Math.PI * 2);
      }

      // Fill if FillStyle is solid
      if (ctx.FillStyle === VB6DrawingConstants.vbFSSolid) {
        ctx.context.fillStyle = this.colorToCSS(ctx.FillColor);
        ctx.context.fill();
      } else if (ctx.FillStyle !== VB6DrawingConstants.vbFSTransparent) {
        // Apply fill pattern
        this.applyFillPattern(ctx.context, ctx.FillColor, ctx.FillStyle, pixelRadius * 2);
        ctx.context.fill();
      }

      // Draw outline
      ctx.context.strokeStyle = this.colorToCSS(drawColor);
      ctx.context.lineWidth = ctx.DrawWidth;
      ctx.context.stroke();

      ctx.context.restore();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Circle');
    }
  }

  /**
   * VB6 PSet Method
   * Sets a pixel to the specified color
   */
  PSet(elementId: string, x: number, y: number, color?: number): void {
    try {
      const ctx = this.getContext(elementId);

      // Convert coordinates
      const pixelX = this.scaleToPixels(x, true, ctx);
      const pixelY = this.scaleToPixels(y, false, ctx);

      // Set color
      const pixelColor =
        color !== undefined ? this.colorToCSS(color) : this.colorToCSS(ctx.ForeColor);
      ctx.context.fillStyle = pixelColor;

      // Draw a 1x1 pixel rectangle
      ctx.context.fillRect(Math.floor(pixelX), Math.floor(pixelY), 1, 1);

      // Update current position
      ctx.CurrentX = x;
      ctx.CurrentY = y;
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'PSet');
    }
  }

  /**
   * VB6 Point Method
   * Returns the color of the pixel at the specified coordinates
   */
  Point(elementId: string, x: number, y: number): number {
    try {
      const ctx = this.getContext(elementId);

      // Convert coordinates
      const pixelX = Math.floor(this.scaleToPixels(x, true, ctx));
      const pixelY = Math.floor(this.scaleToPixels(y, false, ctx));

      // Get pixel data
      const imageData = ctx.context.getImageData(pixelX, pixelY, 1, 1);
      const data = imageData.data;

      // Convert RGB to VB6 BGR format
      const r = data[0];
      const g = data[1];
      const b = data[2];

      return r | (g << 8) | (b << 16);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Point');
      return 0;
    }
  }

  /**
   * VB6 Cls Method
   * Clears the graphics context
   */
  Cls(elementId: string): void {
    try {
      const ctx = this.getContext(elementId);

      // Clear the entire canvas
      ctx.context.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Reset current position
      ctx.CurrentX = 0;
      ctx.CurrentY = 0;
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Cls');
    }
  }

  /**
   * Set graphics property
   */
  setProperty(elementId: string, property: string, value: number | boolean): void {
    const ctx = this.getContext(elementId);

    switch (property.toLowerCase()) {
      case 'drawmode':
        ctx.DrawMode = value;
        break;
      case 'drawstyle':
        ctx.DrawStyle = value;
        break;
      case 'drawwidth':
        ctx.DrawWidth = value;
        break;
      case 'fillcolor':
        ctx.FillColor = value;
        break;
      case 'fillstyle':
        ctx.FillStyle = value;
        break;
      case 'forecolor':
        ctx.ForeColor = value;
        break;
      case 'scalemode':
        ctx.ScaleMode = value;
        break;
      case 'scaleleft':
        ctx.ScaleLeft = value;
        break;
      case 'scaletop':
        ctx.ScaleTop = value;
        break;
      case 'scalewidth':
        ctx.ScaleWidth = value;
        break;
      case 'scaleheight':
        ctx.ScaleHeight = value;
        break;
      case 'currentx':
        ctx.CurrentX = value;
        break;
      case 'currenty':
        ctx.CurrentY = value;
        break;
      case 'autoredraw':
        ctx.AutoRedraw = value;
        break;
    }

    this.applyContextSettings(ctx);
  }

  /**
   * Get graphics property
   */
  getProperty(elementId: string, property: string): number | boolean | null {
    const ctx = this.getContext(elementId);

    switch (property.toLowerCase()) {
      case 'drawmode':
        return ctx.DrawMode;
      case 'drawstyle':
        return ctx.DrawStyle;
      case 'drawwidth':
        return ctx.DrawWidth;
      case 'fillcolor':
        return ctx.FillColor;
      case 'fillstyle':
        return ctx.FillStyle;
      case 'forecolor':
        return ctx.ForeColor;
      case 'scalemode':
        return ctx.ScaleMode;
      case 'scaleleft':
        return ctx.ScaleLeft;
      case 'scaletop':
        return ctx.ScaleTop;
      case 'scalewidth':
        return ctx.ScaleWidth;
      case 'scaleheight':
        return ctx.ScaleHeight;
      case 'currentx':
        return ctx.CurrentX;
      case 'currenty':
        return ctx.CurrentY;
      case 'autoredraw':
        return ctx.AutoRedraw;
      default:
        return null;
    }
  }

  /**
   * Scale coordinates
   */
  Scale(elementId: string, x1?: number, y1?: number, x2?: number, y2?: number): void {
    const ctx = this.getContext(elementId);

    if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
      ctx.ScaleLeft = x1;
      ctx.ScaleTop = y1;
      ctx.ScaleWidth = x2 - x1;
      ctx.ScaleHeight = y2 - y1;
      ctx.ScaleMode = VB6DrawingConstants.vbUser;
    } else {
      // Reset to default scale
      ctx.ScaleLeft = 0;
      ctx.ScaleTop = 0;
      ctx.ScaleWidth = ctx.canvas.width * 15; // Twips
      ctx.ScaleHeight = ctx.canvas.height * 15;
      ctx.ScaleMode = VB6DrawingConstants.vbTwips;
    }
  }

  /**
   * Paint picture at specified location
   */
  PaintPicture(
    elementId: string,
    picture: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    try {
      const ctx = this.getContext(elementId);

      if (picture instanceof HTMLImageElement) {
        const pixelX = this.scaleToPixels(x, true, ctx);
        const pixelY = this.scaleToPixels(y, false, ctx);

        if (width !== undefined && height !== undefined) {
          const pixelWidth = this.scaleToPixels(width, true, ctx);
          const pixelHeight = this.scaleToPixels(height, false, ctx);
          ctx.context.drawImage(picture, pixelX, pixelY, pixelWidth, pixelHeight);
        } else {
          ctx.context.drawImage(picture, pixelX, pixelY);
        }
      }
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'PaintPicture');
    }
  }

  /**
   * Apply fill pattern for hatched fills
   */
  private applyFillPattern(
    ctx: CanvasRenderingContext2D,
    fillColor: number,
    fillStyle: number,
    size: number
  ): void {
    switch (fillStyle) {
      case VB6DrawingConstants.vbHorizontalLine:
        this.drawHorizontalLinePattern(ctx, fillColor);
        break;
      case VB6DrawingConstants.vbVerticalLine:
        this.drawVerticalLinePattern(ctx, fillColor);
        break;
      case VB6DrawingConstants.vbUpwardDiagonal:
        this.drawUpwardDiagonalPattern(ctx, fillColor);
        break;
      case VB6DrawingConstants.vbDownwardDiagonal:
        this.drawDownwardDiagonalPattern(ctx, fillColor);
        break;
      case VB6DrawingConstants.vbCross:
        this.drawCrossPattern(ctx, fillColor);
        break;
      case VB6DrawingConstants.vbDiagonalCross:
        this.drawDiagonalCrossPattern(ctx, fillColor);
        break;
      default:
        ctx.fillStyle = this.colorToCSS(fillColor);
    }
  }

  private drawHorizontalLinePattern(ctx: CanvasRenderingContext2D, fillColor: number): void {
    const pattern = this.createPatternCanvas(4, 4, patternCtx => {
      patternCtx.fillStyle = '#ffffff';
      patternCtx.fillRect(0, 0, 4, 4);
      patternCtx.strokeStyle = this.colorToCSS(fillColor);
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(0, 2);
      patternCtx.lineTo(4, 2);
      patternCtx.stroke();
    });
    ctx.fillStyle = ctx.createPattern(pattern, 'repeat') || this.colorToCSS(fillColor);
  }

  private drawVerticalLinePattern(ctx: CanvasRenderingContext2D, fillColor: number): void {
    const pattern = this.createPatternCanvas(4, 4, patternCtx => {
      patternCtx.fillStyle = '#ffffff';
      patternCtx.fillRect(0, 0, 4, 4);
      patternCtx.strokeStyle = this.colorToCSS(fillColor);
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(2, 0);
      patternCtx.lineTo(2, 4);
      patternCtx.stroke();
    });
    ctx.fillStyle = ctx.createPattern(pattern, 'repeat') || this.colorToCSS(fillColor);
  }

  private drawUpwardDiagonalPattern(ctx: CanvasRenderingContext2D, fillColor: number): void {
    const pattern = this.createPatternCanvas(4, 4, patternCtx => {
      patternCtx.fillStyle = '#ffffff';
      patternCtx.fillRect(0, 0, 4, 4);
      patternCtx.strokeStyle = this.colorToCSS(fillColor);
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(4, 0);
      patternCtx.lineTo(0, 4);
      patternCtx.stroke();
    });
    ctx.fillStyle = ctx.createPattern(pattern, 'repeat') || this.colorToCSS(fillColor);
  }

  private drawDownwardDiagonalPattern(ctx: CanvasRenderingContext2D, fillColor: number): void {
    const pattern = this.createPatternCanvas(4, 4, patternCtx => {
      patternCtx.fillStyle = '#ffffff';
      patternCtx.fillRect(0, 0, 4, 4);
      patternCtx.strokeStyle = this.colorToCSS(fillColor);
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(0, 0);
      patternCtx.lineTo(4, 4);
      patternCtx.stroke();
    });
    ctx.fillStyle = ctx.createPattern(pattern, 'repeat') || this.colorToCSS(fillColor);
  }

  private drawCrossPattern(ctx: CanvasRenderingContext2D, fillColor: number): void {
    const pattern = this.createPatternCanvas(4, 4, patternCtx => {
      patternCtx.fillStyle = '#ffffff';
      patternCtx.fillRect(0, 0, 4, 4);
      patternCtx.strokeStyle = this.colorToCSS(fillColor);
      patternCtx.lineWidth = 1;
      // Horizontal line
      patternCtx.beginPath();
      patternCtx.moveTo(0, 2);
      patternCtx.lineTo(4, 2);
      patternCtx.stroke();
      // Vertical line
      patternCtx.beginPath();
      patternCtx.moveTo(2, 0);
      patternCtx.lineTo(2, 4);
      patternCtx.stroke();
    });
    ctx.fillStyle = ctx.createPattern(pattern, 'repeat') || this.colorToCSS(fillColor);
  }

  private drawDiagonalCrossPattern(ctx: CanvasRenderingContext2D, fillColor: number): void {
    const pattern = this.createPatternCanvas(4, 4, patternCtx => {
      patternCtx.fillStyle = '#ffffff';
      patternCtx.fillRect(0, 0, 4, 4);
      patternCtx.strokeStyle = this.colorToCSS(fillColor);
      patternCtx.lineWidth = 1;
      // Upward diagonal
      patternCtx.beginPath();
      patternCtx.moveTo(4, 0);
      patternCtx.lineTo(0, 4);
      patternCtx.stroke();
      // Downward diagonal
      patternCtx.beginPath();
      patternCtx.moveTo(0, 0);
      patternCtx.lineTo(4, 4);
      patternCtx.stroke();
    });
    ctx.fillStyle = ctx.createPattern(pattern, 'repeat') || this.colorToCSS(fillColor);
  }

  private createPatternCanvas(
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx);
    }
    return canvas;
  }

  /**
   * VB6 Print Method
   * Prints text at the current position
   */
  Print(elementId: string, ...args: any[]): void {
    try {
      const ctx = this.getContext(elementId);

      // Format output
      const output = args
        .map(arg => {
          if (arg === null) return 'Null';
          if (arg === undefined) return '';
          if (typeof arg === 'boolean') return arg ? 'True' : 'False';
          return String(arg);
        })
        .join('');

      // Convert coordinates
      const pixelX = this.scaleToPixels(ctx.CurrentX, true, ctx);
      const pixelY = this.scaleToPixels(ctx.CurrentY, false, ctx);

      // Set text properties
      ctx.context.fillStyle = this.colorToCSS(ctx.ForeColor);
      ctx.context.font = `${ctx.DrawWidth * 10 || 12}px Arial`;
      ctx.context.textBaseline = 'top';

      // Draw text
      ctx.context.fillText(output, pixelX, pixelY);

      // Update CurrentY for next line (move down by font height)
      const metrics = ctx.context.measureText(output);
      ctx.CurrentY += this.pixelsToScale(
        (metrics.actualBoundingBoxAscent || 12) + (metrics.actualBoundingBoxDescent || 4) + 2,
        false,
        ctx
      );
      ctx.CurrentX = 0; // Reset X to start of line
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Print');
    }
  }

  /**
   * Convert pixels back to scale units
   */
  private pixelsToScale(value: number, isX: boolean, ctx: VB6GraphicsContext): number {
    if (ctx.ScaleMode === VB6DrawingConstants.vbPixels) {
      return value;
    }

    const scaleRange = isX ? ctx.ScaleWidth : ctx.ScaleHeight;
    const canvasSize = isX ? ctx.canvas.width : ctx.canvas.height;
    const scaleOffset = isX ? ctx.ScaleLeft : ctx.ScaleTop;

    return (value / canvasSize) * scaleRange + scaleOffset;
  }

  /**
   * VB6 TextWidth Method
   * Returns the width of a string in scale units
   */
  TextWidth(elementId: string, text: string): number {
    const ctx = this.getContext(elementId);
    ctx.context.font = `${ctx.DrawWidth * 10 || 12}px Arial`;
    const metrics = ctx.context.measureText(text);
    return this.pixelsToScale(metrics.width, true, ctx);
  }

  /**
   * VB6 TextHeight Method
   * Returns the height of a string in scale units
   */
  TextHeight(elementId: string, text: string): number {
    const ctx = this.getContext(elementId);
    ctx.context.font = `${ctx.DrawWidth * 10 || 12}px Arial`;
    const metrics = ctx.context.measureText(text);
    const height =
      (metrics.actualBoundingBoxAscent || 12) + (metrics.actualBoundingBoxDescent || 4);
    return this.pixelsToScale(height, false, ctx);
  }

  /**
   * VB6 RGB Function
   * Returns a VB6 color value from RGB components
   */
  static RGB(red: number, green: number, blue: number): number {
    const r = Math.max(0, Math.min(255, Math.floor(red)));
    const g = Math.max(0, Math.min(255, Math.floor(green)));
    const b = Math.max(0, Math.min(255, Math.floor(blue)));
    return r | (g << 8) | (b << 16);
  }

  /**
   * VB6 QBColor Function
   * Returns a VB6 color value from QBasic color index (0-15)
   */
  static QBColor(color: number): number {
    const qbColors = [
      0x000000, // 0 - Black
      0x800000, // 1 - Blue
      0x008000, // 2 - Green
      0x808000, // 3 - Cyan
      0x000080, // 4 - Red
      0x800080, // 5 - Magenta
      0x008080, // 6 - Brown/Yellow
      0xc0c0c0, // 7 - White/Light Gray
      0x808080, // 8 - Gray
      0xff0000, // 9 - Light Blue
      0x00ff00, // 10 - Light Green
      0xffff00, // 11 - Light Cyan
      0x0000ff, // 12 - Light Red
      0xff00ff, // 13 - Light Magenta
      0x00ffff, // 14 - Yellow
      0xffffff, // 15 - Bright White
    ];
    return qbColors[Math.max(0, Math.min(15, Math.floor(color)))] || 0;
  }

  /**
   * VB6 Move Method (for positioning)
   * Moves the current drawing position
   */
  Move(elementId: string, x: number, y: number): void {
    const ctx = this.getContext(elementId);
    ctx.CurrentX = x;
    ctx.CurrentY = y;
  }

  /**
   * Draw arc (part of circle)
   */
  Arc(
    elementId: string,
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color?: number
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      const pixelX = this.scaleToPixels(x, true, ctx);
      const pixelY = this.scaleToPixels(y, false, ctx);
      const pixelRadius = this.scaleToPixels(radius, true, ctx);

      const drawColor = color !== undefined ? color : ctx.ForeColor;

      ctx.context.beginPath();
      ctx.context.arc(pixelX, pixelY, pixelRadius, startAngle, endAngle);
      ctx.context.strokeStyle = this.colorToCSS(drawColor);
      ctx.context.lineWidth = ctx.DrawWidth;
      ctx.context.stroke();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Arc');
    }
  }

  /**
   * Draw pie slice (filled arc)
   */
  Pie(
    elementId: string,
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color?: number,
    fillColor?: number
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      const pixelX = this.scaleToPixels(x, true, ctx);
      const pixelY = this.scaleToPixels(y, false, ctx);
      const pixelRadius = this.scaleToPixels(radius, true, ctx);

      const drawColor = color !== undefined ? color : ctx.ForeColor;
      const fill = fillColor !== undefined ? fillColor : ctx.FillColor;

      ctx.context.beginPath();
      ctx.context.moveTo(pixelX, pixelY);
      ctx.context.arc(pixelX, pixelY, pixelRadius, startAngle, endAngle);
      ctx.context.closePath();

      // Fill
      ctx.context.fillStyle = this.colorToCSS(fill);
      ctx.context.fill();

      // Stroke
      ctx.context.strokeStyle = this.colorToCSS(drawColor);
      ctx.context.lineWidth = ctx.DrawWidth;
      ctx.context.stroke();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Pie');
    }
  }

  /**
   * Draw polygon
   */
  Polygon(
    elementId: string,
    points: Array<{ x: number; y: number }>,
    color?: number,
    fillColor?: number,
    filled: boolean = false
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      if (points.length < 3) {
        throw new Error('Polygon requires at least 3 points');
      }

      const drawColor = color !== undefined ? color : ctx.ForeColor;
      const fill = fillColor !== undefined ? fillColor : ctx.FillColor;

      ctx.context.beginPath();

      const firstPoint = points[0];
      ctx.context.moveTo(
        this.scaleToPixels(firstPoint.x, true, ctx),
        this.scaleToPixels(firstPoint.y, false, ctx)
      );

      for (let i = 1; i < points.length; i++) {
        ctx.context.lineTo(
          this.scaleToPixels(points[i].x, true, ctx),
          this.scaleToPixels(points[i].y, false, ctx)
        );
      }

      ctx.context.closePath();

      // Fill if requested
      if (filled || ctx.FillStyle === VB6DrawingConstants.vbFSSolid) {
        ctx.context.fillStyle = this.colorToCSS(fill);
        ctx.context.fill();
      }

      // Stroke
      ctx.context.strokeStyle = this.colorToCSS(drawColor);
      ctx.context.lineWidth = ctx.DrawWidth;
      ctx.context.stroke();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Polygon');
    }
  }

  /**
   * Draw rounded rectangle
   */
  RoundRect(
    elementId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cornerRadius: number,
    color?: number,
    fillColor?: number,
    filled: boolean = false
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      const pixelX1 = this.scaleToPixels(x1, true, ctx);
      const pixelY1 = this.scaleToPixels(y1, false, ctx);
      const pixelX2 = this.scaleToPixels(x2, true, ctx);
      const pixelY2 = this.scaleToPixels(y2, false, ctx);
      const pixelRadius = this.scaleToPixels(cornerRadius, true, ctx);

      const drawColor = color !== undefined ? color : ctx.ForeColor;
      const fill = fillColor !== undefined ? fillColor : ctx.FillColor;

      const width = pixelX2 - pixelX1;
      const height = pixelY2 - pixelY1;
      const r = Math.min(pixelRadius, Math.min(width / 2, height / 2));

      ctx.context.beginPath();
      ctx.context.moveTo(pixelX1 + r, pixelY1);
      ctx.context.arcTo(pixelX2, pixelY1, pixelX2, pixelY2, r);
      ctx.context.arcTo(pixelX2, pixelY2, pixelX1, pixelY2, r);
      ctx.context.arcTo(pixelX1, pixelY2, pixelX1, pixelY1, r);
      ctx.context.arcTo(pixelX1, pixelY1, pixelX2, pixelY1, r);
      ctx.context.closePath();

      // Fill if requested
      if (filled || ctx.FillStyle === VB6DrawingConstants.vbFSSolid) {
        ctx.context.fillStyle = this.colorToCSS(fill);
        ctx.context.fill();
      }

      // Stroke
      ctx.context.strokeStyle = this.colorToCSS(drawColor);
      ctx.context.lineWidth = ctx.DrawWidth;
      ctx.context.stroke();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'RoundRect');
    }
  }

  /**
   * Draw ellipse
   */
  Ellipse(
    elementId: string,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color?: number,
    fillColor?: number,
    filled: boolean = false
  ): void {
    try {
      const ctx = this.getContext(elementId);
      this.applyContextSettings(ctx);

      const pixelX = this.scaleToPixels(x, true, ctx);
      const pixelY = this.scaleToPixels(y, false, ctx);
      const pixelRadiusX = this.scaleToPixels(radiusX, true, ctx);
      const pixelRadiusY = this.scaleToPixels(radiusY, false, ctx);

      const drawColor = color !== undefined ? color : ctx.ForeColor;
      const fill = fillColor !== undefined ? fillColor : ctx.FillColor;

      ctx.context.beginPath();
      ctx.context.ellipse(pixelX, pixelY, pixelRadiusX, pixelRadiusY, 0, 0, Math.PI * 2);

      // Fill if requested
      if (filled || ctx.FillStyle === VB6DrawingConstants.vbFSSolid) {
        ctx.context.fillStyle = this.colorToCSS(fill);
        ctx.context.fill();
      }

      // Stroke
      ctx.context.strokeStyle = this.colorToCSS(drawColor);
      ctx.context.lineWidth = ctx.DrawWidth;
      ctx.context.stroke();
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Ellipse');
    }
  }

  /**
   * Draw gradient fill (extended feature)
   */
  GradientFill(
    elementId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color1: number,
    color2: number,
    direction: 'horizontal' | 'vertical' | 'diagonal' = 'vertical'
  ): void {
    try {
      const ctx = this.getContext(elementId);

      const pixelX1 = this.scaleToPixels(x1, true, ctx);
      const pixelY1 = this.scaleToPixels(y1, false, ctx);
      const pixelX2 = this.scaleToPixels(x2, true, ctx);
      const pixelY2 = this.scaleToPixels(y2, false, ctx);

      let gradient: CanvasGradient;

      switch (direction) {
        case 'horizontal':
          gradient = ctx.context.createLinearGradient(pixelX1, pixelY1, pixelX2, pixelY1);
          break;
        case 'diagonal':
          gradient = ctx.context.createLinearGradient(pixelX1, pixelY1, pixelX2, pixelY2);
          break;
        case 'vertical':
        default:
          gradient = ctx.context.createLinearGradient(pixelX1, pixelY1, pixelX1, pixelY2);
          break;
      }

      gradient.addColorStop(0, this.colorToCSS(color1));
      gradient.addColorStop(1, this.colorToCSS(color2));

      ctx.context.fillStyle = gradient;
      ctx.context.fillRect(pixelX1, pixelY1, pixelX2 - pixelX1, pixelY2 - pixelY1);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'GradientFill');
    }
  }

  /**
   * Save canvas to image
   */
  SavePicture(
    elementId: string,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.92
  ): string {
    try {
      const ctx = this.getContext(elementId);
      return ctx.canvas.toDataURL(`image/${format}`, quality);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'SavePicture');
      return '';
    }
  }

  /**
   * Set font properties
   */
  SetFont(
    elementId: string,
    fontName: string,
    fontSize: number,
    bold: boolean = false,
    italic: boolean = false,
    underline: boolean = false
  ): void {
    const ctx = this.getContext(elementId);

    let fontStyle = '';
    if (italic) fontStyle += 'italic ';
    if (bold) fontStyle += 'bold ';

    ctx.context.font = `${fontStyle}${fontSize}px ${fontName}`;

    // Store for later use
    ctx.FontName = fontName;
    ctx.FontSize = fontSize;
    ctx.FontBold = bold;
    ctx.FontItalic = italic;
    ctx.FontUnderline = underline;
  }

  /**
   * Refresh/redraw the graphics
   */
  Refresh(elementId: string): void {
    // In HTML5 Canvas, this is a no-op as rendering is immediate
    // But we can trigger a repaint if needed
    const ctx = this.getContext(elementId);
    ctx.canvas.style.display = 'none';
    ctx.canvas.offsetHeight; // Force reflow
    ctx.canvas.style.display = '';
  }

  /**
   * Copy image from one location to another
   */
  BitBlt(
    destElementId: string,
    destX: number,
    destY: number,
    width: number,
    height: number,
    srcElementId: string,
    srcX: number,
    srcY: number,
    operation: number = VB6DrawingConstants.vbCopyPen
  ): void {
    try {
      const destCtx = this.getContext(destElementId);
      const srcCtx = this.getContext(srcElementId);

      const srcPixelX = this.scaleToPixels(srcX, true, srcCtx);
      const srcPixelY = this.scaleToPixels(srcY, false, srcCtx);
      const destPixelX = this.scaleToPixels(destX, true, destCtx);
      const destPixelY = this.scaleToPixels(destY, false, destCtx);
      const pixelWidth = this.scaleToPixels(width, true, srcCtx);
      const pixelHeight = this.scaleToPixels(height, false, srcCtx);

      // Get source image data
      const imageData = srcCtx.context.getImageData(srcPixelX, srcPixelY, pixelWidth, pixelHeight);

      // Apply operation
      switch (operation) {
        case VB6DrawingConstants.vbNotCopyPen:
          // Invert colors
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255 - imageData.data[i];
            imageData.data[i + 1] = 255 - imageData.data[i + 1];
            imageData.data[i + 2] = 255 - imageData.data[i + 2];
          }
          break;
        case VB6DrawingConstants.vbBlackness:
          // Fill with black
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 0;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 0;
          }
          break;
        case VB6DrawingConstants.vbWhiteness:
          // Fill with white
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;
            imageData.data[i + 1] = 255;
            imageData.data[i + 2] = 255;
          }
          break;
        // Default is copy (vbCopyPen) - no modification needed
      }

      // Put to destination
      destCtx.context.putImageData(imageData, destPixelX, destPixelY);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'BitBlt');
    }
  }

  /**
   * Flood fill from a point
   */
  FloodFill(
    elementId: string,
    x: number,
    y: number,
    color: number,
    fillType: 'border' | 'surface' = 'surface'
  ): void {
    try {
      const ctx = this.getContext(elementId);

      const pixelX = Math.floor(this.scaleToPixels(x, true, ctx));
      const pixelY = Math.floor(this.scaleToPixels(y, false, ctx));

      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      const imageData = ctx.context.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Get target color at the start point
      const startIdx = (pixelY * width + pixelX) * 4;
      const targetR = data[startIdx];
      const targetG = data[startIdx + 1];
      const targetB = data[startIdx + 2];
      const targetA = data[startIdx + 3];

      // Get fill color
      const fillR = color & 0xff;
      const fillG = (color >> 8) & 0xff;
      const fillB = (color >> 16) & 0xff;

      // Don't fill if already the same color
      if (targetR === fillR && targetG === fillG && targetB === fillB) {
        return;
      }

      // Stack-based flood fill
      const stack: Array<[number, number]> = [[pixelX, pixelY]];
      const visited = new Set<string>();

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        const key = `${cx},${cy}`;

        if (visited.has(key) || cx < 0 || cx >= width || cy < 0 || cy >= height) {
          continue;
        }

        const idx = (cy * width + cx) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Check if this pixel should be filled
        const shouldFill =
          fillType === 'surface'
            ? r === targetR && g === targetG && b === targetB
            : !(r === fillR && g === fillG && b === fillB);

        if (!shouldFill) {
          continue;
        }

        visited.add(key);

        // Fill the pixel
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = 255;

        // Add neighbors to stack
        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
      }

      ctx.context.putImageData(imageData, 0, 0);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'FloodFill');
    }
  }
}

// Global graphics engine instance
const graphicsEngine = new VB6GraphicsEngine();

// Global VB6 Graphics Functions
export function Line(
  elementId: string,
  x1?: number,
  y1?: number,
  x2?: number,
  y2?: number,
  color?: number,
  drawFlag?: string
): void {
  graphicsEngine.Line(elementId, x1, y1, x2, y2, color, drawFlag);
}

// RGB and QBColor functions
export function RGB(red: number, green: number, blue: number): number {
  return VB6GraphicsEngine.RGB(red, green, blue);
}

export function QBColor(color: number): number {
  return VB6GraphicsEngine.QBColor(color);
}

export function Circle(
  elementId: string,
  x: number,
  y: number,
  radius: number,
  color?: number,
  start?: number,
  end?: number,
  aspect?: number
): void {
  graphicsEngine.Circle(elementId, x, y, radius, color, start, end, aspect);
}

export function PSet(elementId: string, x: number, y: number, color?: number): void {
  graphicsEngine.PSet(elementId, x, y, color);
}

export function Point(elementId: string, x: number, y: number): number {
  return graphicsEngine.Point(elementId, x, y);
}

export function Cls(elementId: string): void {
  graphicsEngine.Cls(elementId);
}

export function Scale(elementId: string, x1?: number, y1?: number, x2?: number, y2?: number): void {
  graphicsEngine.Scale(elementId, x1, y1, x2, y2);
}

export function PaintPicture(
  elementId: string,
  picture: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  width?: number,
  height?: number
): void {
  graphicsEngine.PaintPicture(elementId, picture, x, y, width, height);
}

// Property accessor functions
export function SetGraphicsProperty(
  elementId: string,
  property: string,
  value: number | boolean
): void {
  graphicsEngine.setProperty(elementId, property, value);
}

export function GetGraphicsProperty(elementId: string, property: string): number | boolean | null {
  return graphicsEngine.getProperty(elementId, property);
}

// Text output functions
export function Print(elementId: string, ...args: any[]): void {
  graphicsEngine.Print(elementId, ...args);
}

export function TextWidth(elementId: string, text: string): number {
  return graphicsEngine.TextWidth(elementId, text);
}

export function TextHeight(elementId: string, text: string): number {
  return graphicsEngine.TextHeight(elementId, text);
}

// Position function
export function Move(elementId: string, x: number, y: number): void {
  graphicsEngine.Move(elementId, x, y);
}

// Shape drawing functions
export function Arc(
  elementId: string,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color?: number
): void {
  graphicsEngine.Arc(elementId, x, y, radius, startAngle, endAngle, color);
}

export function Pie(
  elementId: string,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color?: number,
  fillColor?: number
): void {
  graphicsEngine.Pie(elementId, x, y, radius, startAngle, endAngle, color, fillColor);
}

export function Polygon(
  elementId: string,
  points: Array<{ x: number; y: number }>,
  color?: number,
  fillColor?: number,
  filled?: boolean
): void {
  graphicsEngine.Polygon(elementId, points, color, fillColor, filled);
}

export function RoundRect(
  elementId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cornerRadius: number,
  color?: number,
  fillColor?: number,
  filled?: boolean
): void {
  graphicsEngine.RoundRect(elementId, x1, y1, x2, y2, cornerRadius, color, fillColor, filled);
}

export function Ellipse(
  elementId: string,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color?: number,
  fillColor?: number,
  filled?: boolean
): void {
  graphicsEngine.Ellipse(elementId, x, y, radiusX, radiusY, color, fillColor, filled);
}

export function GradientFill(
  elementId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color1: number,
  color2: number,
  direction?: 'horizontal' | 'vertical' | 'diagonal'
): void {
  graphicsEngine.GradientFill(elementId, x1, y1, x2, y2, color1, color2, direction);
}

// Image functions
export function SavePicture(
  elementId: string,
  format?: 'png' | 'jpeg' | 'webp',
  quality?: number
): string {
  return graphicsEngine.SavePicture(elementId, format, quality);
}

export function BitBlt(
  destElementId: string,
  destX: number,
  destY: number,
  width: number,
  height: number,
  srcElementId: string,
  srcX: number,
  srcY: number,
  operation?: number
): void {
  graphicsEngine.BitBlt(
    destElementId,
    destX,
    destY,
    width,
    height,
    srcElementId,
    srcX,
    srcY,
    operation
  );
}

export function FloodFill(
  elementId: string,
  x: number,
  y: number,
  color: number,
  fillType?: 'border' | 'surface'
): void {
  graphicsEngine.FloodFill(elementId, x, y, color, fillType);
}

// Font and display functions
export function SetFont(
  elementId: string,
  fontName: string,
  fontSize: number,
  bold?: boolean,
  italic?: boolean,
  underline?: boolean
): void {
  graphicsEngine.SetFont(elementId, fontName, fontSize, bold, italic, underline);
}

export function Refresh(elementId: string): void {
  graphicsEngine.Refresh(elementId);
}

// Export the complete graphics API
export const VB6GraphicsAPI = {
  // Engine
  VB6GraphicsEngine,

  // Constants
  VB6DrawingConstants,
  VB6LineConstants,

  // Core drawing functions
  Line,
  Circle,
  PSet,
  Point,
  Cls,
  Scale,
  PaintPicture,

  // Color functions
  RGB,
  QBColor,

  // Text functions
  Print,
  TextWidth,
  TextHeight,

  // Position function
  Move,

  // Shape functions
  Arc,
  Pie,
  Polygon,
  RoundRect,
  Ellipse,
  GradientFill,

  // Image functions
  SavePicture,
  BitBlt,
  FloodFill,

  // Font and display functions
  SetFont,
  Refresh,

  // Property accessor functions
  SetGraphicsProperty,
  GetGraphicsProperty,

  // Global engine instance
  engine: graphicsEngine,
};
