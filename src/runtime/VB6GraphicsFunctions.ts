/**
 * VB6 Graphics Functions
 *
 * Graphics drawing functions for VB6 runtime
 */

export interface GraphicsContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentX: number;
  currentY: number;
  drawWidth: number;
  drawStyle: number;
  fillColor: number;
  fillStyle: number;
  foreColor: number;
  scaleMode: number;
  autoRedraw: boolean;
}

export class VB6GraphicsFunctions {
  private static defaultContext: GraphicsContext | null = null;

  /**
   * Initialize graphics context for a form or picture box
   * @param canvas HTML canvas element
   */
  static initializeGraphics(canvas: HTMLCanvasElement): GraphicsContext {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D context');
    }

    const context: GraphicsContext = {
      canvas,
      ctx,
      currentX: 0,
      currentY: 0,
      drawWidth: 1,
      drawStyle: 0, // vbSolid
      fillColor: 0xffffff, // White
      fillStyle: 0, // vbFSSolid
      foreColor: 0x000000, // Black
      scaleMode: 1, // vbTwips
      autoRedraw: false,
    };

    if (!this.defaultContext) {
      this.defaultContext = context;
    }

    return context;
  }

  /**
   * Set current graphics context
   * @param context Graphics context to use
   */
  static setContext(context: GraphicsContext): void {
    this.defaultContext = context;
  }

  /**
   * Get current graphics context
   */
  static getContext(): GraphicsContext {
    if (!this.defaultContext) {
      throw new Error('No graphics context initialized');
    }
    return this.defaultContext;
  }

  /**
   * Line - Draws a line or rectangle
   * @param x1 Starting X coordinate
   * @param y1 Starting Y coordinate
   * @param x2 Ending X coordinate
   * @param y2 Ending Y coordinate
   * @param color Line color
   * @param bf B for box, F for filled, BF for filled box
   */
  static Line(x1: number, y1: number, x2: number, y2: number, color?: number, bf?: string): void {
    const context = this.getContext();
    const { ctx } = context;

    // Convert coordinates based on scale mode
    const coords = this.convertCoordinates(context, x1, y1, x2, y2);
    x1 = coords.x1;
    y1 = coords.y1;
    x2 = coords.x2;
    y2 = coords.y2;

    // Set color
    const drawColor = color !== undefined ? color : context.foreColor;
    ctx.strokeStyle = this.colorToRGB(drawColor);
    ctx.fillStyle = this.colorToRGB(context.fillColor);
    ctx.lineWidth = context.drawWidth;

    // Apply draw style
    this.applyDrawStyle(ctx, context.drawStyle);

    if (bf) {
      // Draw rectangle
      const width = x2 - x1;
      const height = y2 - y1;

      if (bf.toUpperCase().includes('F')) {
        // Filled rectangle
        ctx.fillRect(x1, y1, width, height);
      }

      if (bf.toUpperCase().includes('B')) {
        // Rectangle outline
        ctx.strokeRect(x1, y1, width, height);
      }
    } else {
      // Draw line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Update current position
    context.currentX = x2;
    context.currentY = y2;
  }

  /**
   * Circle - Draws a circle, ellipse, or arc
   * @param x Center X coordinate
   * @param y Center Y coordinate
   * @param radius Radius
   * @param color Color
   * @param start Start angle in radians
   * @param end End angle in radians
   * @param aspect Aspect ratio for ellipse
   */
  static Circle(
    x: number,
    y: number,
    radius: number,
    color?: number,
    start?: number,
    end?: number,
    aspect?: number
  ): void {
    const context = this.getContext();
    const { ctx } = context;

    // Convert coordinates
    const coords = this.convertCoordinates(context, x, y);
    x = coords.x1;
    y = coords.y1;
    radius = this.convertUnits(context, radius);

    // Set color
    const drawColor = color !== undefined ? color : context.foreColor;
    ctx.strokeStyle = this.colorToRGB(drawColor);
    ctx.lineWidth = context.drawWidth;

    // Apply draw style
    this.applyDrawStyle(ctx, context.drawStyle);

    ctx.beginPath();

    if (aspect && aspect !== 1) {
      // Draw ellipse
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, aspect);

      if (start !== undefined && end !== undefined) {
        // Arc
        ctx.arc(0, 0, radius, -start, -end, true);
      } else {
        // Full ellipse
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      }

      ctx.restore();
    } else {
      // Draw circle
      if (start !== undefined && end !== undefined) {
        // Arc - VB6 uses counter-clockwise and different angle system
        ctx.arc(x, y, radius, -start, -end, true);
      } else {
        // Full circle
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
      }
    }

    ctx.stroke();
  }

  /**
   * PSet - Sets a pixel
   * @param x X coordinate
   * @param y Y coordinate
   * @param color Color
   */
  static PSet(x: number, y: number, color?: number): void {
    const context = this.getContext();
    const { ctx } = context;

    // Convert coordinates
    const coords = this.convertCoordinates(context, x, y);
    x = coords.x1;
    y = coords.y1;

    // Set color
    const drawColor = color !== undefined ? color : context.foreColor;
    ctx.fillStyle = this.colorToRGB(drawColor);

    // Draw pixel
    ctx.fillRect(x, y, 1, 1);

    // Update current position
    context.currentX = x;
    context.currentY = y;
  }

  /**
   * Point - Gets pixel color
   * @param x X coordinate
   * @param y Y coordinate
   */
  static Point(x: number, y: number): number {
    const context = this.getContext();
    const { ctx } = context;

    // Convert coordinates
    const coords = this.convertCoordinates(context, x, y);
    x = coords.x1;
    y = coords.y1;

    // Get pixel data
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;

    // Convert to VB6 color format (BGR)
    return data[0] | (data[1] << 8) | (data[2] << 16);
  }

  /**
   * Cls - Clears the drawing surface
   * @param color Background color
   */
  static Cls(color?: number): void {
    const context = this.getContext();
    const { ctx, canvas } = context;

    if (color !== undefined) {
      ctx.fillStyle = this.colorToRGB(color);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Reset current position
    context.currentX = 0;
    context.currentY = 0;
  }

  /**
   * PaintPicture - Draws a picture on the form
   * @param picture Picture/Image to draw
   * @param x1 Destination X
   * @param y1 Destination Y
   * @param width1 Destination width
   * @param height1 Destination height
   * @param x2 Source X
   * @param y2 Source Y
   * @param width2 Source width
   * @param height2 Source height
   * @param opcode Raster operation
   */
  static PaintPicture(
    picture: HTMLImageElement | HTMLCanvasElement,
    x1: number,
    y1: number,
    width1?: number,
    height1?: number,
    x2?: number,
    y2?: number,
    width2?: number,
    height2?: number,
    opcode?: number
  ): void {
    const context = this.getContext();
    const { ctx } = context;

    // Convert coordinates
    const coords = this.convertCoordinates(context, x1, y1);
    x1 = coords.x1;
    y1 = coords.y1;

    // Default values
    width1 = width1 !== undefined ? this.convertUnits(context, width1) : picture.width;
    height1 = height1 !== undefined ? this.convertUnits(context, height1) : picture.height;
    x2 = x2 || 0;
    y2 = y2 || 0;
    width2 = width2 || picture.width;
    height2 = height2 || picture.height;

    // Apply raster operation
    if (opcode) {
      this.applyRasterOp(ctx, opcode);
    }

    // Draw image
    ctx.drawImage(picture, x2, y2, width2, height2, x1, y1, width1, height1);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * TextWidth - Returns width of text string
   * @param text Text to measure
   * @param font Optional font settings
   */
  static TextWidth(text: string, font?: any): number {
    const context = this.getContext();
    const { ctx } = context;

    // Apply font if provided
    if (font) {
      ctx.save();
      this.applyFont(ctx, font);
    }

    const metrics = ctx.measureText(text);

    if (font) {
      ctx.restore();
    }

    return this.convertFromPixels(context, metrics.width);
  }

  /**
   * TextHeight - Returns height of text string
   * @param text Text to measure
   * @param font Optional font settings
   */
  static TextHeight(text: string, font?: any): number {
    const context = this.getContext();
    const { ctx } = context;

    // Apply font if provided
    if (font) {
      ctx.save();
      this.applyFont(ctx, font);
    }

    // Approximate text height from font size
    const fontSize = parseInt(ctx.font) || 12;

    if (font) {
      ctx.restore();
    }

    return this.convertFromPixels(context, fontSize * 1.2);
  }

  /**
   * Print - Prints text at current position
   * @param text Text to print
   */
  static Print(text: string): void {
    const context = this.getContext();
    const { ctx } = context;

    ctx.fillStyle = this.colorToRGB(context.foreColor);
    ctx.fillText(text, context.currentX, context.currentY);

    // Update current position
    const metrics = ctx.measureText(text);
    context.currentX += metrics.width;
  }

  /**
   * CurrentX - Get/Set current X position
   */
  static get CurrentX(): number {
    const context = this.getContext();
    return this.convertFromPixels(context, context.currentX);
  }

  static set CurrentX(value: number) {
    const context = this.getContext();
    context.currentX = this.convertUnits(context, value);
  }

  /**
   * CurrentY - Get/Set current Y position
   */
  static get CurrentY(): number {
    const context = this.getContext();
    return this.convertFromPixels(context, context.currentY);
  }

  static set CurrentY(value: number) {
    const context = this.getContext();
    context.currentY = this.convertUnits(context, value);
  }

  /**
   * DrawWidth - Get/Set line width
   */
  static get DrawWidth(): number {
    return this.getContext().drawWidth;
  }

  static set DrawWidth(value: number) {
    this.getContext().drawWidth = value;
  }

  /**
   * DrawStyle - Get/Set line style
   */
  static get DrawStyle(): number {
    return this.getContext().drawStyle;
  }

  static set DrawStyle(value: number) {
    this.getContext().drawStyle = value;
  }

  /**
   * FillColor - Get/Set fill color
   */
  static get FillColor(): number {
    return this.getContext().fillColor;
  }

  static set FillColor(value: number) {
    this.getContext().fillColor = value;
  }

  /**
   * FillStyle - Get/Set fill style
   */
  static get FillStyle(): number {
    return this.getContext().fillStyle;
  }

  static set FillStyle(value: number) {
    this.getContext().fillStyle = value;
  }

  /**
   * ForeColor - Get/Set foreground color
   */
  static get ForeColor(): number {
    return this.getContext().foreColor;
  }

  static set ForeColor(value: number) {
    this.getContext().foreColor = value;
  }

  // Helper methods

  private static convertCoordinates(
    context: GraphicsContext,
    x1: number,
    y1: number,
    x2?: number,
    y2?: number
  ): { x1: number; y1: number; x2: number; y2: number } {
    return {
      x1: this.convertUnits(context, x1),
      y1: this.convertUnits(context, y1),
      x2: x2 !== undefined ? this.convertUnits(context, x2) : 0,
      y2: y2 !== undefined ? this.convertUnits(context, y2) : 0,
    };
  }

  private static convertUnits(context: GraphicsContext, value: number): number {
    // Convert from VB6 units to pixels based on ScaleMode
    switch (context.scaleMode) {
      case 1: // vbTwips (1440 twips per inch, ~15 twips per pixel at 96 DPI)
        return value / 15;
      case 2: // vbPoints (72 points per inch)
        return value * 1.333;
      case 3: // vbPixels
        return value;
      case 4: // vbCharacters (120 twips wide x 240 twips high)
        return value * 8; // Approximate
      case 5: // vbInches
        return value * 96; // 96 DPI
      case 6: // vbMillimeters
        return value * 3.78; // 96 DPI
      case 7: // vbCentimeters
        return value * 37.8; // 96 DPI
      default:
        return value;
    }
  }

  private static convertFromPixels(context: GraphicsContext, pixels: number): number {
    // Convert from pixels to VB6 units based on ScaleMode
    switch (context.scaleMode) {
      case 1: // vbTwips
        return pixels * 15;
      case 2: // vbPoints
        return pixels / 1.333;
      case 3: // vbPixels
        return pixels;
      case 4: // vbCharacters
        return pixels / 8;
      case 5: // vbInches
        return pixels / 96;
      case 6: // vbMillimeters
        return pixels / 3.78;
      case 7: // vbCentimeters
        return pixels / 37.8;
      default:
        return pixels;
    }
  }

  private static colorToRGB(color: number): string {
    // Convert VB6 color (0x00BBGGRR) to CSS RGB
    const r = color & 0xff;
    const g = (color >> 8) & 0xff;
    const b = (color >> 16) & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
  }

  private static applyDrawStyle(ctx: CanvasRenderingContext2D, style: number): void {
    switch (style) {
      case 0: // vbSolid
        ctx.setLineDash([]);
        break;
      case 1: // vbDash
        ctx.setLineDash([10, 5]);
        break;
      case 2: // vbDot
        ctx.setLineDash([2, 2]);
        break;
      case 3: // vbDashDot
        ctx.setLineDash([10, 5, 2, 5]);
        break;
      case 4: // vbDashDotDot
        ctx.setLineDash([10, 5, 2, 5, 2, 5]);
        break;
      case 5: // vbInvisible
        ctx.globalAlpha = 0;
        break;
      case 6: // vbInsideSolid
        ctx.setLineDash([]);
        break;
    }
  }

  private static applyRasterOp(ctx: CanvasRenderingContext2D, opcode: number): void {
    // Map VB6 raster operations to Canvas composite operations
    const rasterOps: { [key: number]: string } = {
      0x00cc0020: 'source-over', // vbSrcCopy
      0x00ee0086: 'source-in', // vbSrcPaint
      0x008800c6: 'source-atop', // vbSrcAnd
      0x00660046: 'xor', // vbSrcInvert
      0x00440328: 'destination-out', // vbSrcErase
      0x00330008: 'copy', // vbNotSrcCopy
      0x001100a6: 'destination-over', // vbNotSrcErase
      0x00c000ca: 'source-over', // vbMergeCopy
      0x00bb0226: 'multiply', // vbMergePaint
      0x00f00021: 'screen', // vbPatCopy
      0x00fb0a09: 'overlay', // vbPatPaint
      0x005a0049: 'difference', // vbPatInvert
      0x00550009: 'destination-in', // vbDstInvert
      0x00000042: 'clear', // vbBlackness
      0x00ff0062: 'source-over', // vbWhiteness
    };

    ctx.globalCompositeOperation = rasterOps[opcode] || 'source-over';
  }

  private static applyFont(ctx: CanvasRenderingContext2D, font: any): void {
    // Apply font properties
    const size = font.Size || 12;
    const family = font.Name || 'Arial';
    const bold = font.Bold ? 'bold' : 'normal';
    const italic = font.Italic ? 'italic' : 'normal';

    ctx.font = `${italic} ${bold} ${size}px ${family}`;
  }
}

// Export individual functions for easier use
export const { Line, Circle, PSet, Point, Cls, PaintPicture, TextWidth, TextHeight, Print } =
  VB6GraphicsFunctions;

// VB6 Graphics Constants
export const VB6GraphicsConstants = {
  // Scale modes
  vbUser: 0,
  vbTwips: 1,
  vbPoints: 2,
  vbPixels: 3,
  vbCharacters: 4,
  vbInches: 5,
  vbMillimeters: 6,
  vbCentimeters: 7,

  // Draw styles
  vbSolid: 0,
  vbDash: 1,
  vbDot: 2,
  vbDashDot: 3,
  vbDashDotDot: 4,
  vbInvisible: 5,
  vbInsideSolid: 6,

  // Fill styles
  vbFSSolid: 0,
  vbFSTransparent: 1,
  vbHorizontalLine: 2,
  vbVerticalLine: 3,
  vbUpwardDiagonal: 4,
  vbDownwardDiagonal: 5,
  vbCross: 6,
  vbDiagonalCross: 7,

  // Raster operations
  vbSrcCopy: 0x00cc0020,
  vbSrcPaint: 0x00ee0086,
  vbSrcAnd: 0x008800c6,
  vbSrcInvert: 0x00660046,
  vbSrcErase: 0x00440328,
  vbNotSrcCopy: 0x00330008,
  vbNotSrcErase: 0x001100a6,
  vbMergeCopy: 0x00c000ca,
  vbMergePaint: 0x00bb0226,
  vbPatCopy: 0x00f00021,
  vbPatPaint: 0x00fb0a09,
  vbPatInvert: 0x005a0049,
  vbDstInvert: 0x00550009,
  vbBlackness: 0x00000042,
  vbWhiteness: 0x00ff0062,
};
