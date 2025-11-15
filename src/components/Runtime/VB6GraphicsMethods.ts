/**
 * VB6 Graphics Methods
 * Comprehensive implementation of Form and PictureBox graphics methods
 */

export interface VB6Point {
  x: number;
  y: number;
}

export interface VB6GraphicsContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentX: number;
  currentY: number;
  drawColor: string;
  fillColor: string;
  drawWidth: number;
  drawStyle: number;
  fillStyle: number;
  drawMode: number;
  scaleMode: number;
  scaleLeft: number;
  scaleTop: number;
  scaleWidth: number;
  scaleHeight: number;
}

/**
 * VB6 Draw Modes
 */
export enum VB6DrawMode {
  dmBlackness = 1, // Black
  dmNotMergePen = 2,
  dmMaskNotPen = 3,
  dmNotCopyPen = 4,
  dmMaskPenNot = 5,
  dmInvert = 6, // Invert
  dmXorPen = 7, // XOR
  dmNotMaskPen = 8,
  dmMaskPen = 9,
  dmNotXorPen = 10,
  dmNop = 11, // No operation
  dmMergeNotPen = 12,
  dmCopyPen = 13, // Copy (default)
  dmMergePenNot = 14,
  dmMergePen = 15,
  dmWhiteness = 16, // White
}

/**
 * VB6 Draw Styles
 */
export enum VB6DrawStyle {
  vbSolid = 0, // Solid line
  vbDash = 1, // Dashed line
  vbDot = 2, // Dotted line
  vbDashDot = 3, // Dash-dot line
  vbDashDotDot = 4, // Dash-dot-dot line
  vbInvisible = 5, // Invisible
  vbInsideSolid = 6, // Inside solid
}

/**
 * VB6 Fill Styles
 */
export enum VB6FillStyle {
  vbFSSolid = 0, // Solid
  vbFSTransparent = 1, // Transparent
  vbHorizontalLine = 2, // Horizontal lines
  vbVerticalLine = 3, // Vertical lines
  vbUpwardDiagonal = 4, // Upward diagonal
  vbDownwardDiagonal = 5, // Downward diagonal
  vbCross = 6, // Cross
  vbDiagonalCross = 7, // Diagonal cross
}

/**
 * VB6 Scale Modes
 */
export enum VB6ScaleMode {
  vbUser = 0, // User-defined
  vbTwips = 1, // Twips (default)
  vbPoints = 2, // Points
  vbPixels = 3, // Pixels
  vbCharacters = 4, // Characters
  vbInches = 5, // Inches
  vbMillimeters = 6, // Millimeters
  vbCentimeters = 7, // Centimeters
}

/**
 * Create a graphics context from a canvas element
 */
export function createGraphicsContext(canvas: HTMLCanvasElement): VB6GraphicsContext {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  return {
    canvas,
    ctx,
    currentX: 0,
    currentY: 0,
    drawColor: '#000000',
    fillColor: '#FFFFFF',
    drawWidth: 1,
    drawStyle: VB6DrawStyle.vbSolid,
    fillStyle: VB6FillStyle.vbFSTransparent,
    drawMode: VB6DrawMode.dmCopyPen,
    scaleMode: VB6ScaleMode.vbTwips,
    scaleLeft: 0,
    scaleTop: 0,
    scaleWidth: canvas.width,
    scaleHeight: canvas.height,
  };
}

/**
 * Convert twips to pixels (1 twip = 1/1440 inch, assume 96 DPI)
 */
export function twipsToPixels(twips: number): number {
  return (twips / 1440) * 96;
}

/**
 * Apply draw style to context
 */
function applyDrawStyle(ctx: CanvasRenderingContext2D, style: number): void {
  switch (style) {
    case VB6DrawStyle.vbSolid:
      ctx.setLineDash([]);
      break;
    case VB6DrawStyle.vbDash:
      ctx.setLineDash([10, 5]);
      break;
    case VB6DrawStyle.vbDot:
      ctx.setLineDash([2, 2]);
      break;
    case VB6DrawStyle.vbDashDot:
      ctx.setLineDash([10, 5, 2, 5]);
      break;
    case VB6DrawStyle.vbDashDotDot:
      ctx.setLineDash([10, 5, 2, 5, 2, 5]);
      break;
    case VB6DrawStyle.vbInvisible:
      ctx.globalAlpha = 0;
      break;
    case VB6DrawStyle.vbInsideSolid:
      ctx.setLineDash([]);
      break;
  }
}

/**
 * VB6 Graphics Methods
 */
export const VB6GraphicsMethods = {
  /**
   * Cls - Clear the surface
   */
  Cls(gfx: VB6GraphicsContext): void {
    gfx.ctx.clearRect(0, 0, gfx.canvas.width, gfx.canvas.height);
    gfx.currentX = 0;
    gfx.currentY = 0;
  },

  /**
   * Line - Draw a line
   * Syntax: Line [(x1, y1)]-(x2, y2)[, color][, B[F]]
   */
  Line(
    gfx: VB6GraphicsContext,
    x1: number | null,
    y1: number | null,
    x2: number,
    y2: number,
    color?: string,
    flags?: string
  ): void {
    const startX = x1 !== null ? x1 : gfx.currentX;
    const startY = y1 !== null ? y1 : gfx.currentY;

    gfx.ctx.strokeStyle = color || gfx.drawColor;
    gfx.ctx.lineWidth = gfx.drawWidth;
    applyDrawStyle(gfx.ctx, gfx.drawStyle);

    if (flags === 'B' || flags === 'BF') {
      // Draw rectangle
      if (flags === 'BF') {
        // Filled rectangle
        gfx.ctx.fillStyle = color || gfx.fillColor;
        gfx.ctx.fillRect(startX, startY, x2 - startX, y2 - startY);
      }
      if (flags === 'B' || flags === 'BF') {
        // Rectangle outline
        gfx.ctx.strokeRect(startX, startY, x2 - startX, y2 - startY);
      }
    } else {
      // Draw line
      gfx.ctx.beginPath();
      gfx.ctx.moveTo(startX, startY);
      gfx.ctx.lineTo(x2, y2);
      gfx.ctx.stroke();
    }

    gfx.currentX = x2;
    gfx.currentY = y2;
  },

  /**
   * Circle - Draw a circle or ellipse
   * Syntax: Circle (x, y), radius[, color[, start, end[, aspect]]]
   */
  Circle(
    gfx: VB6GraphicsContext,
    x: number,
    y: number,
    radius: number,
    color?: string,
    start?: number,
    end?: number,
    aspect?: number
  ): void {
    gfx.ctx.strokeStyle = color || gfx.drawColor;
    gfx.ctx.lineWidth = gfx.drawWidth;
    applyDrawStyle(gfx.ctx, gfx.drawStyle);

    const radiusX = radius;
    const radiusY = aspect ? radius * aspect : radius;

    gfx.ctx.beginPath();

    if (start !== undefined && end !== undefined) {
      // Arc
      gfx.ctx.ellipse(x, y, radiusX, radiusY, 0, start, end);
    } else {
      // Full circle/ellipse
      gfx.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    }

    gfx.ctx.stroke();

    if (gfx.fillStyle !== VB6FillStyle.vbFSTransparent) {
      gfx.ctx.fillStyle = gfx.fillColor;
      gfx.ctx.fill();
    }

    gfx.currentX = x;
    gfx.currentY = y;
  },

  /**
   * PSet - Set a pixel
   * Syntax: PSet (x, y)[, color]
   */
  PSet(gfx: VB6GraphicsContext, x: number, y: number, color?: string): void {
    gfx.ctx.fillStyle = color || gfx.drawColor;
    gfx.ctx.fillRect(x, y, 1, 1);
    gfx.currentX = x;
    gfx.currentY = y;
  },

  /**
   * Point - Get the color of a pixel
   * Returns RGB color value
   */
  Point(gfx: VB6GraphicsContext, x: number, y: number): number {
    const imageData = gfx.ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    // Convert to VB6 RGB format (0x00BBGGRR)
    return data[2] | (data[1] << 8) | (data[0] << 16);
  },

  /**
   * Print - Print text on the surface
   */
  Print(gfx: VB6GraphicsContext, text: string): void {
    gfx.ctx.fillStyle = gfx.drawColor;
    gfx.ctx.font = '12px MS Sans Serif';
    gfx.ctx.fillText(text, gfx.currentX, gfx.currentY);

    // Move to next line
    gfx.currentY += 12;
  },

  /**
   * CurrentX - Get/Set current X position
   */
  getCurrentX(gfx: VB6GraphicsContext): number {
    return gfx.currentX;
  },

  setCurrentX(gfx: VB6GraphicsContext, x: number): void {
    gfx.currentX = x;
  },

  /**
   * CurrentY - Get/Set current Y position
   */
  getCurrentY(gfx: VB6GraphicsContext): number {
    return gfx.currentY;
  },

  setCurrentY(gfx: VB6GraphicsContext, y: number): void {
    gfx.currentY = y;
  },

  /**
   * Scale - Set custom coordinate system
   */
  Scale(gfx: VB6GraphicsContext, left: number, top: number, width: number, height: number): void {
    gfx.scaleMode = VB6ScaleMode.vbUser;
    gfx.scaleLeft = left;
    gfx.scaleTop = top;
    gfx.scaleWidth = width;
    gfx.scaleHeight = height;

    // Apply transformation
    const scaleX = gfx.canvas.width / width;
    const scaleY = gfx.canvas.height / height;
    gfx.ctx.setTransform(scaleX, 0, 0, scaleY, -left * scaleX, -top * scaleY);
  },

  /**
   * PaintPicture - Draw an image
   */
  PaintPicture(
    gfx: VB6GraphicsContext,
    picture: HTMLImageElement,
    x: number,
    y: number,
    width?: number,
    height?: number,
    srcX?: number,
    srcY?: number,
    srcWidth?: number,
    srcHeight?: number
  ): void {
    if (
      srcX !== undefined &&
      srcY !== undefined &&
      srcWidth !== undefined &&
      srcHeight !== undefined
    ) {
      // Draw portion of image
      gfx.ctx.drawImage(
        picture,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        x,
        y,
        width || srcWidth,
        height || srcHeight
      );
    } else if (width !== undefined && height !== undefined) {
      // Draw with scaling
      gfx.ctx.drawImage(picture, x, y, width, height);
    } else {
      // Draw at original size
      gfx.ctx.drawImage(picture, x, y);
    }
  },

  /**
   * TextHeight - Get the height of text in current font
   */
  TextHeight(gfx: VB6GraphicsContext, text: string): number {
    const metrics = gfx.ctx.measureText(text);
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  },

  /**
   * TextWidth - Get the width of text in current font
   */
  TextWidth(gfx: VB6GraphicsContext, text: string): number {
    return gfx.ctx.measureText(text).width;
  },

  /**
   * ForeColor - Get/Set foreground color
   */
  getForeColor(gfx: VB6GraphicsContext): string {
    return gfx.drawColor;
  },

  setForeColor(gfx: VB6GraphicsContext, color: string): void {
    gfx.drawColor = color;
  },

  /**
   * FillColor - Get/Set fill color
   */
  getFillColor(gfx: VB6GraphicsContext): string {
    return gfx.fillColor;
  },

  setFillColor(gfx: VB6GraphicsContext, color: string): void {
    gfx.fillColor = color;
  },

  /**
   * DrawWidth - Get/Set line width
   */
  getDrawWidth(gfx: VB6GraphicsContext): number {
    return gfx.drawWidth;
  },

  setDrawWidth(gfx: VB6GraphicsContext, width: number): void {
    gfx.drawWidth = width;
  },

  /**
   * DrawStyle - Get/Set line style
   */
  getDrawStyle(gfx: VB6GraphicsContext): number {
    return gfx.drawStyle;
  },

  setDrawStyle(gfx: VB6GraphicsContext, style: number): void {
    gfx.drawStyle = style;
  },

  /**
   * FillStyle - Get/Set fill style
   */
  getFillStyle(gfx: VB6GraphicsContext): number {
    return gfx.fillStyle;
  },

  setFillStyle(gfx: VB6GraphicsContext, style: number): void {
    gfx.fillStyle = style;
  },

  /**
   * DrawMode - Get/Set drawing mode
   */
  getDrawMode(gfx: VB6GraphicsContext): number {
    return gfx.drawMode;
  },

  setDrawMode(gfx: VB6GraphicsContext, mode: number): void {
    gfx.drawMode = mode;

    // Apply composite operation based on draw mode
    switch (mode) {
      case VB6DrawMode.dmCopyPen:
        gfx.ctx.globalCompositeOperation = 'source-over';
        break;
      case VB6DrawMode.dmXorPen:
        gfx.ctx.globalCompositeOperation = 'xor';
        break;
      case VB6DrawMode.dmInvert:
        gfx.ctx.globalCompositeOperation = 'difference';
        break;
      case VB6DrawMode.dmBlackness:
        gfx.ctx.fillStyle = '#000000';
        break;
      case VB6DrawMode.dmWhiteness:
        gfx.ctx.fillStyle = '#FFFFFF';
        break;
      default:
        gfx.ctx.globalCompositeOperation = 'source-over';
    }
  },
};

/**
 * Export graphics constants for VB6 compatibility
 */
export default {
  ...VB6GraphicsMethods,
  // Draw modes
  vbBlackness: VB6DrawMode.dmBlackness,
  vbNotMergePen: VB6DrawMode.dmNotMergePen,
  vbMaskNotPen: VB6DrawMode.dmMaskNotPen,
  vbNotCopyPen: VB6DrawMode.dmNotCopyPen,
  vbMaskPenNot: VB6DrawMode.dmMaskPenNot,
  vbInvert: VB6DrawMode.dmInvert,
  vbXorPen: VB6DrawMode.dmXorPen,
  vbNotMaskPen: VB6DrawMode.dmNotMaskPen,
  vbMaskPen: VB6DrawMode.dmMaskPen,
  vbNotXorPen: VB6DrawMode.dmNotXorPen,
  vbNop: VB6DrawMode.dmNop,
  vbMergeNotPen: VB6DrawMode.dmMergeNotPen,
  vbCopyPen: VB6DrawMode.dmCopyPen,
  vbMergePenNot: VB6DrawMode.dmMergePenNot,
  vbMergePen: VB6DrawMode.dmMergePen,
  vbWhiteness: VB6DrawMode.dmWhiteness,

  // Draw styles
  vbSolid: VB6DrawStyle.vbSolid,
  vbDash: VB6DrawStyle.vbDash,
  vbDot: VB6DrawStyle.vbDot,
  vbDashDot: VB6DrawStyle.vbDashDot,
  vbDashDotDot: VB6DrawStyle.vbDashDotDot,
  vbInvisible: VB6DrawStyle.vbInvisible,
  vbInsideSolid: VB6DrawStyle.vbInsideSolid,

  // Fill styles
  vbFSSolid: VB6FillStyle.vbFSSolid,
  vbFSTransparent: VB6FillStyle.vbFSTransparent,
  vbHorizontalLine: VB6FillStyle.vbHorizontalLine,
  vbVerticalLine: VB6FillStyle.vbVerticalLine,
  vbUpwardDiagonal: VB6FillStyle.vbUpwardDiagonal,
  vbDownwardDiagonal: VB6FillStyle.vbDownwardDiagonal,
  vbCross: VB6FillStyle.vbCross,
  vbDiagonalCross: VB6FillStyle.vbDiagonalCross,

  // Scale modes
  vbUser: VB6ScaleMode.vbUser,
  vbTwips: VB6ScaleMode.vbTwips,
  vbPoints: VB6ScaleMode.vbPoints,
  vbPixels: VB6ScaleMode.vbPixels,
  vbCharacters: VB6ScaleMode.vbCharacters,
  vbInches: VB6ScaleMode.vbInches,
  vbMillimeters: VB6ScaleMode.vbMillimeters,
  vbCentimeters: VB6ScaleMode.vbCentimeters,

  // Helper functions
  createGraphicsContext,
  twipsToPixels,
};
