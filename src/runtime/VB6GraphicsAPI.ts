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
  vbBlack: 0x000000,      // Black (R:0, G:0, B:0)
  vbRed: 0x0000FF,        // Red (R:255, G:0, B:0)
  vbGreen: 0x00FF00,      // Green (R:0, G:255, B:0)
  vbYellow: 0x00FFFF,     // Yellow (R:255, G:255, B:0)
  vbBlue: 0xFF0000,       // Blue (R:0, G:0, B:255)
  vbMagenta: 0xFF00FF,    // Magenta (R:255, G:0, B:255)
  vbCyan: 0xFFFF00,       // Cyan (R:0, G:255, B:255)
  vbWhite: 0xFFFFFF,      // White (R:255, G:255, B:255)

  // System colors
  vbButtonFace: 0x8000000F,
  vbButtonShadow: 0x80000010,
  vbButtonText: 0x80000012,
  vbTitleBarText: 0x80000009,
  vbHighlight: 0x8000000D,
  vbHighlightText: 0x8000000E,
  vbActiveTitleBar: 0x80000002,
  vbInactiveTitleBar: 0x80000003,
  vbMenuBar: 0x80000004,
  vbWindowBackground: 0x80000005,
  vbWindowFrame: 0x80000006,
  vbMenuText: 0x80000007,
  vbWindowText: 0x80000008,
  vbActiveBorder: 0x8000000A,
  vbInactiveBorder: 0x8000000B,
  vbApplicationWorkspace: 0x8000000C,
  vbScrollBars: 0x80000001
} as const;

// Line style constants  
export const VB6LineConstants = {
  vbDrawModeCopy: 13,
  vbDrawModeXor: 7,
  vbDrawModeInvert: 6
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
      AutoRedraw: true
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
    const r = vb6Color & 0xFF;
    const g = (vb6Color >> 8) & 0xFF;
    const b = (vb6Color >> 16) & 0xFF;
    
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
      [VB6DrawingConstants.vbHighlightText]: '#ffffff'
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
  Line(elementId: string, x1?: number, y1?: number, x2?: number, y2?: number, color?: number, drawFlag?: string): void {
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

      console.log(`[VB6 Graphics] Line drawn from (${startX}, ${startY}) to (${endX}, ${endY})`);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Line');
    }
  }

  /**
   * VB6 Circle Method
   * Draws a circle or arc
   */
  Circle(elementId: string, x: number, y: number, radius: number, color?: number, start?: number, end?: number, aspect?: number): void {
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

      console.log(`[VB6 Graphics] Circle drawn at (${x}, ${y}) with radius ${radius}`);
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
      const pixelColor = color !== undefined ? this.colorToCSS(color) : this.colorToCSS(ctx.ForeColor);
      ctx.context.fillStyle = pixelColor;

      // Draw a 1x1 pixel rectangle
      ctx.context.fillRect(Math.floor(pixelX), Math.floor(pixelY), 1, 1);

      // Update current position
      ctx.CurrentX = x;
      ctx.CurrentY = y;

      console.log(`[VB6 Graphics] Pixel set at (${x}, ${y})`);
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

      console.log(`[VB6 Graphics] Graphics cleared for ${elementId}`);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Cls');
    }
  }

  /**
   * Set graphics property
   */
  setProperty(elementId: string, property: string, value: any): void {
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
  getProperty(elementId: string, property: string): any {
    const ctx = this.getContext(elementId);
    
    switch (property.toLowerCase()) {
      case 'drawmode': return ctx.DrawMode;
      case 'drawstyle': return ctx.DrawStyle;
      case 'drawwidth': return ctx.DrawWidth;
      case 'fillcolor': return ctx.FillColor;
      case 'fillstyle': return ctx.FillStyle;
      case 'forecolor': return ctx.ForeColor;
      case 'scalemode': return ctx.ScaleMode;
      case 'scaleleft': return ctx.ScaleLeft;
      case 'scaletop': return ctx.ScaleTop;
      case 'scalewidth': return ctx.ScaleWidth;
      case 'scaleheight': return ctx.ScaleHeight;
      case 'currentx': return ctx.CurrentX;
      case 'currenty': return ctx.CurrentY;
      case 'autoredraw': return ctx.AutoRedraw;
      default: return null;
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
  PaintPicture(elementId: string, picture: any, x: number, y: number, width?: number, height?: number): void {
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

      console.log(`[VB6 Graphics] Picture painted at (${x}, ${y})`);
    } catch (error) {
      errorHandler.raiseError(5, 'Invalid procedure call or argument', 'PaintPicture');
    }
  }

  /**
   * Apply fill pattern for hatched fills
   */
  private applyFillPattern(ctx: CanvasRenderingContext2D, fillColor: number, fillStyle: number, size: number): void {
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
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
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
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
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
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
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
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
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
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
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
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
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

  private createPatternCanvas(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx);
    }
    return canvas;
  }
}

// Global graphics engine instance
const graphicsEngine = new VB6GraphicsEngine();

// Global VB6 Graphics Functions
export function Line(elementId: string, x1?: number, y1?: number, x2?: number, y2?: number, color?: number, drawFlag?: string): void {
  graphicsEngine.Line(elementId, x1, y1, x2, y2, color, drawFlag);
}

export function Circle(elementId: string, x: number, y: number, radius: number, color?: number, start?: number, end?: number, aspect?: number): void {
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

export function PaintPicture(elementId: string, picture: any, x: number, y: number, width?: number, height?: number): void {
  graphicsEngine.PaintPicture(elementId, picture, x, y, width, height);
}

// Property accessor functions
export function SetGraphicsProperty(elementId: string, property: string, value: any): void {
  graphicsEngine.setProperty(elementId, property, value);
}

export function GetGraphicsProperty(elementId: string, property: string): any {
  return graphicsEngine.getProperty(elementId, property);
}

// Export the complete graphics API
export const VB6GraphicsAPI = {
  // Engine
  VB6GraphicsEngine,
  
  // Constants
  VB6DrawingConstants,
  VB6LineConstants,
  
  // Functions
  Line,
  Circle,
  PSet,
  Point,
  Cls,
  Scale,
  PaintPicture,
  SetGraphicsProperty,
  GetGraphicsProperty,
  
  // Global engine instance
  engine: graphicsEngine
};