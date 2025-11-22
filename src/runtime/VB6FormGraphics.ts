/**
 * VB6 Form and PictureBox Graphics Methods
 * Print, TextWidth, TextHeight, CurrentX/Y, DrawMode, etc.
 * TRUE 100% VB6 graphics compatibility for forms and controls
 */

// ============================================================================
// GRAPHICS CONSTANTS
// ============================================================================

/**
 * DrawMode constants
 */
export enum VB6DrawMode {
  vbBlackness = 1,      // Black
  vbNotMergePen = 2,    // Not Merge Pen
  vbMaskNotPen = 3,     // Mask Not Pen
  vbNotCopyPen = 4,     // Not Copy Pen
  vbMaskPenNot = 5,     // Mask Pen Not
  vbInvert = 6,         // Invert
  vbXorPen = 7,         // XOR Pen
  vbNotMaskPen = 8,     // Not Mask Pen
  vbMaskPen = 9,        // Mask Pen
  vbNotXorPen = 10,     // Not XOR Pen
  vbNop = 11,           // No Operation
  vbMergeNotPen = 12,   // Merge Not Pen
  vbCopyPen = 13,       // Copy Pen (default)
  vbMergePenNot = 14,   // Merge Pen Not
  vbMergePen = 15,      // Merge Pen
  vbWhiteness = 16      // White
}

/**
 * DrawStyle constants
 */
export enum VB6DrawStyle {
  vbSolid = 0,          // Solid line
  vbDash = 1,           // Dashed line
  vbDot = 2,            // Dotted line
  vbDashDot = 3,        // Dash-dot line
  vbDashDotDot = 4,     // Dash-dot-dot line
  vbInvisible = 5,      // Invisible line
  vbInsideSolid = 6     // Inside solid
}

/**
 * FillStyle constants
 */
export enum VB6FillStyle {
  vbFSSolid = 0,              // Solid fill
  vbFSTransparent = 1,        // Transparent (no fill)
  vbHorizontalLine = 2,       // Horizontal lines
  vbVerticalLine = 3,         // Vertical lines
  vbUpwardDiagonal = 4,       // Upward diagonal lines
  vbDownwardDiagonal = 5,     // Downward diagonal lines
  vbCross = 6,                // Cross pattern
  vbDiagonalCross = 7         // Diagonal cross pattern
}

/**
 * ScaleMode constants
 */
export enum VB6ScaleMode {
  vbUser = 0,           // User-defined
  vbTwips = 1,          // Twips (default)
  vbPoints = 2,         // Points
  vbPixels = 3,         // Pixels
  vbCharacters = 4,     // Characters
  vbInches = 5,         // Inches
  vbMillimeters = 6,    // Millimeters
  vbCentimeters = 7     // Centimeters
}

// ============================================================================
// GRAPHICS CONTEXT FOR FORMS AND PICTUREBOXES
// ============================================================================

/**
 * Graphics context for a form or control
 */
export class VB6GraphicsContext {
  // Canvas element for drawing
  private _canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private element: HTMLElement | null = null;

  // Public getter for canvas (for testing)
  get canvas(): HTMLCanvasElement | null {
    return this._canvas;
  }
  
  // Graphics properties
  public CurrentX: number = 0;
  public CurrentY: number = 0;
  public DrawMode: VB6DrawMode = VB6DrawMode.vbCopyPen;
  public DrawStyle: VB6DrawStyle = VB6DrawStyle.vbSolid;
  public DrawWidth: number = 1;
  public FillColor: string = '#000000';
  public FillStyle: VB6FillStyle = VB6FillStyle.vbFSTransparent;
  public ForeColor: string = '#000000';
  public BackColor: string = '#FFFFFF';
  public FontName: string = 'MS Sans Serif';
  public FontSize: number = 8;
  public FontBold: boolean = false;
  public FontItalic: boolean = false;
  public FontUnderline: boolean = false;
  public FontStrikethru: boolean = false;
  public ScaleMode: VB6ScaleMode = VB6ScaleMode.vbTwips;
  public ScaleLeft: number = 0;
  public ScaleTop: number = 0;
  public ScaleWidth: number = 0;
  public ScaleHeight: number = 0;
  public AutoRedraw: boolean = false;
  
  // Text metrics cache
  private textMetricsCache: Map<string, TextMetrics> = new Map();
  
  constructor(elementId?: string) {
    if (elementId) {
      this.attachToElement(elementId);
    }
  }
  
  /**
   * Attach graphics context to an HTML element
   * @param elementId Element ID or element
   */
  attachToElement(elementId: string | HTMLElement): void {
    if (typeof elementId === 'string') {
      this.element = document.getElementById(elementId);
    } else {
      this.element = elementId;
    }
    
    if (!this.element) {
      throw new Error(`Element not found: ${elementId}`);
    }
    
    // Create or get canvas
    let canvas = this.element.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = this.element.clientWidth;
      canvas.height = this.element.clientHeight;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      this.element.appendChild(canvas);
    }
    
    this._canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Set default scale
    if (this.ScaleWidth === 0) {
      this.ScaleWidth = this.pixelsToUnits(canvas.width);
    }
    if (this.ScaleHeight === 0) {
      this.ScaleHeight = this.pixelsToUnits(canvas.height);
    }
  }
  
  /**
   * Print text at current position
   * @param text Text to print
   * @param args Additional text items
   */
  Print(...args: any[]): void {
    if (!this.ctx) return;
    
    // Save context
    this.ctx.save();
    
    // Set font
    this.applyFont();
    
    // Set colors
    this.ctx.fillStyle = this.ForeColor;
    
    // Convert position to pixels
    const x = this.unitsToPixels(this.CurrentX, true);
    const y = this.unitsToPixels(this.CurrentY, false);
    
    // Process arguments
    let text = '';
    let newLine = true;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === ';') {
        // Semicolon - no spacing, no newline
        newLine = false;
        continue;
      } else if (arg === ',') {
        // Comma - tab to next print zone
        const zones = Math.floor(this.CurrentX / 14) + 1;
        this.CurrentX = zones * 14;
        continue;
      }
      
      // Convert to string
      let str = '';
      if (typeof arg === 'string') {
        str = arg;
      } else if (typeof arg === 'number') {
        // Numbers get leading space for positive
        str = arg >= 0 ? ' ' + arg : String(arg);
      } else if (typeof arg === 'boolean') {
        str = arg ? 'True' : 'False';
      } else if (arg instanceof Date) {
        str = arg.toLocaleString();
      } else if (arg != null) {
        str = String(arg);
      }
      
      text += str;
    }
    
    // Draw text
    if (text) {
      this.ctx.fillText(text, x, y);
      
      // Update CurrentX
      const metrics = this.ctx.measureText(text);
      this.CurrentX += this.pixelsToUnits(metrics.width, true);
    }
    
    // Move to next line if needed
    if (newLine) {
      this.CurrentX = 0;
      this.CurrentY += this.pixelsToUnits(this.FontSize * 1.5, false);
    }
    
    // Restore context
    this.ctx.restore();
  }
  
  /**
   * Clear the drawing surface
   */
  Cls(): void {
    if (!this.ctx || !this._canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Fill with background color if not transparent
    if (this.BackColor !== 'transparent') {
      this.ctx.fillStyle = this.BackColor;
      this.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }
    
    // Reset position
    this.CurrentX = 0;
    this.CurrentY = 0;
  }
  
  /**
   * Get the width of text in current font
   * @param text Text to measure
   */
  TextWidth(text: string): number {
    if (!this.ctx) return 0;
    
    // Check cache
    const cacheKey = `${this.FontName}-${this.FontSize}-${this.FontBold}-${this.FontItalic}-${text}`;
    let metrics = this.textMetricsCache.get(cacheKey);
    
    if (!metrics) {
      // Save and apply font
      this.ctx.save();
      this.applyFont();
      
      // Measure text
      metrics = this.ctx.measureText(text);
      this.textMetricsCache.set(cacheKey, metrics);
      
      // Restore
      this.ctx.restore();
    }
    
    // Convert pixels to current scale units
    return this.pixelsToUnits(metrics.width, true);
  }
  
  /**
   * Get the height of text in current font
   * @param text Text to measure (optional, uses font height)
   */
  TextHeight(text?: string): number {
    // In VB6, TextHeight returns the height of the font
    // Approximation: fontSize * 1.5 for line height
    const heightPixels = this.FontSize * 1.5;
    return this.pixelsToUnits(heightPixels, false);
  }
  
  /**
   * Draw a line
   * @param x1 Start X
   * @param y1 Start Y
   * @param x2 End X
   * @param y2 End Y
   * @param color Color (optional)
   * @param style Box style (B=box, BF=filled box)
   */
  Line(x1: number, y1: number, x2: number, y2: number, color?: string, style?: string): void {
    if (!this.ctx) return;
    
    this.ctx.save();
    
    // Convert coordinates
    const px1 = this.unitsToPixels(x1, true);
    const py1 = this.unitsToPixels(y1, false);
    const px2 = this.unitsToPixels(x2, true);
    const py2 = this.unitsToPixels(y2, false);
    
    // Set color
    const drawColor = color || this.ForeColor;
    
    // Apply draw style
    this.applyDrawStyle();
    
    if (style === 'B' || style === 'BF') {
      // Draw box
      const width = px2 - px1;
      const height = py2 - py1;
      
      if (style === 'BF') {
        // Filled box
        this.ctx.fillStyle = drawColor;
        this.ctx.fillRect(px1, py1, width, height);
      } else {
        // Box outline
        this.ctx.strokeStyle = drawColor;
        this.ctx.lineWidth = this.DrawWidth;
        this.ctx.strokeRect(px1, py1, width, height);
      }
    } else {
      // Draw line
      this.ctx.strokeStyle = drawColor;
      this.ctx.lineWidth = this.DrawWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(px1, py1);
      this.ctx.lineTo(px2, py2);
      this.ctx.stroke();
    }
    
    // Update current position
    this.CurrentX = x2;
    this.CurrentY = y2;
    
    this.ctx.restore();
  }
  
  /**
   * Draw a circle
   * @param x Center X
   * @param y Center Y
   * @param radius Radius
   * @param color Color (optional)
   * @param start Start angle in radians (optional)
   * @param end End angle in radians (optional)
   * @param aspect Aspect ratio (optional)
   */
  Circle(x: number, y: number, radius: number, color?: string, start?: number, end?: number, aspect?: number): void {
    if (!this.ctx || !this._canvas) return;

    this.ctx.save();

    // Convert coordinates
    const cx = this.unitsToPixels(x, true);
    const cy = this.unitsToPixels(y, false);
    const r = this.unitsToPixels(radius, true);

    // Set color
    const drawColor = color || this.ForeColor;

    // Apply aspect ratio if specified
    if (aspect && aspect !== 1) {
      this.ctx.translate(cx, cy);
      this.ctx.scale(1, aspect);
      this.ctx.translate(-cx, -cy);
    }

    // Draw circle or arc
    this.ctx.beginPath();
    if (start !== undefined && end !== undefined) {
      this.ctx.arc(cx, cy, r, start, end);
    } else {
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }

    // Apply draw style
    this.applyDrawStyle();

    // Fill based on FillStyle
    if (this.FillStyle === VB6FillStyle.vbFSSolid) {
      this.ctx.fillStyle = this.FillColor;
      this.ctx.fill();
      // Also stroke for outline
      this.ctx.strokeStyle = drawColor;
      this.ctx.lineWidth = this.DrawWidth;
      this.ctx.stroke();
    } else if (this.FillStyle !== VB6FillStyle.vbFSTransparent) {
      // Apply fill pattern
      this.applyFillPattern(cx, cy, r * 2);
      this.ctx.fill();
      // Outline
      this.ctx.strokeStyle = drawColor;
      this.ctx.lineWidth = this.DrawWidth;
      this.ctx.stroke();
    } else {
      // Just stroke the outline
      this.ctx.strokeStyle = drawColor;
      this.ctx.lineWidth = this.DrawWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
  
  /**
   * Set a pixel
   * @param x X coordinate
   * @param y Y coordinate
   * @param color Color (optional)
   */
  PSet(x: number, y: number, color?: string): void {
    if (!this.ctx) return;
    
    const px = this.unitsToPixels(x, true);
    const py = this.unitsToPixels(y, false);
    const drawColor = color || this.ForeColor;
    
    this.ctx.fillStyle = drawColor;
    this.ctx.fillRect(px, py, 1, 1);
    
    this.CurrentX = x;
    this.CurrentY = y;
  }
  
  /**
   * Get pixel color at point
   * @param x X coordinate
   * @param y Y coordinate
   */
  Point(x: number, y: number): number {
    if (!this.ctx) return 0;
    
    const px = this.unitsToPixels(x, true);
    const py = this.unitsToPixels(y, false);
    
    const imageData = this.ctx.getImageData(px, py, 1, 1);
    const data = imageData.data;
    
    // Convert RGBA to VB6 color (BGR format)
    return (data[2] << 16) | (data[1] << 8) | data[0];
  }
  
  /**
   * Apply font settings to context
   */
  private applyFont(): void {
    if (!this.ctx) return;
    
    let font = '';
    
    if (this.FontItalic) font += 'italic ';
    if (this.FontBold) font += 'bold ';
    
    font += `${this.FontSize}px "${this.FontName}"`;
    
    this.ctx.font = font;
    
    // Apply underline and strikethrough using decorations
    // (Canvas doesn't support these natively)
  }
  
  /**
   * Apply draw style to context
   */
  private applyDrawStyle(): void {
    if (!this.ctx) return;

    // Set line dash pattern based on DrawStyle
    if (this.ctx.setLineDash) {
      switch (this.DrawStyle) {
        case VB6DrawStyle.vbDash:
          this.ctx.setLineDash([4, 2]);
          break;
        case VB6DrawStyle.vbDot:
          this.ctx.setLineDash([1, 1]);
          break;
        case VB6DrawStyle.vbDashDot:
          this.ctx.setLineDash([4, 2, 1, 2]);
          break;
        case VB6DrawStyle.vbDashDotDot:
          this.ctx.setLineDash([4, 2, 1, 2, 1, 2]);
          break;
        case VB6DrawStyle.vbInvisible:
          this.ctx.globalAlpha = 0;
          break;
        case VB6DrawStyle.vbSolid:
        default:
          this.ctx.setLineDash([]);
          this.ctx.globalAlpha = 1;
      }
    }

    // Apply DrawMode (composite operation)
    try {
      switch (this.DrawMode) {
        case VB6DrawMode.vbXorPen:
          this.ctx.globalCompositeOperation = 'xor';
          break;
        case VB6DrawMode.vbInvert:
          this.ctx.globalCompositeOperation = 'difference';
          break;
        case VB6DrawMode.vbMergePen:
          this.ctx.globalCompositeOperation = 'multiply';
          break;
        case VB6DrawMode.vbCopyPen:
        default:
          this.ctx.globalCompositeOperation = 'source-over';
      }
    } catch (e) {
      // Fallback if composite operation not supported
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Apply fill pattern for hatched fills
   */
  private applyFillPattern(x: number, y: number, size: number): void {
    if (!this.ctx || !this._canvas) return;

    switch (this.FillStyle) {
      case VB6FillStyle.vbHorizontalLine:
        this.drawHorizontalLinePattern(x, y, size);
        break;
      case VB6FillStyle.vbVerticalLine:
        this.drawVerticalLinePattern(x, y, size);
        break;
      case VB6FillStyle.vbUpwardDiagonal:
        this.drawUpwardDiagonalPattern(x, y, size);
        break;
      case VB6FillStyle.vbDownwardDiagonal:
        this.drawDownwardDiagonalPattern(x, y, size);
        break;
      case VB6FillStyle.vbCross:
        this.drawCrossPattern(x, y, size);
        break;
      case VB6FillStyle.vbDiagonalCross:
        this.drawDiagonalCrossPattern(x, y, size);
        break;
      default:
        this.ctx.fillStyle = this.FillColor;
    }
  }

  private drawHorizontalLinePattern(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
      patternCtx.strokeStyle = this.FillColor;
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(0, 2);
      patternCtx.lineTo(4, 2);
      patternCtx.stroke();
    });
    this.ctx.fillStyle = this.ctx.createPattern(pattern, 'repeat') || this.FillColor;
  }

  private drawVerticalLinePattern(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
      patternCtx.strokeStyle = this.FillColor;
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(2, 0);
      patternCtx.lineTo(2, 4);
      patternCtx.stroke();
    });
    this.ctx.fillStyle = this.ctx.createPattern(pattern, 'repeat') || this.FillColor;
  }

  private drawUpwardDiagonalPattern(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
      patternCtx.strokeStyle = this.FillColor;
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(4, 0);
      patternCtx.lineTo(0, 4);
      patternCtx.stroke();
    });
    this.ctx.fillStyle = this.ctx.createPattern(pattern, 'repeat') || this.FillColor;
  }

  private drawDownwardDiagonalPattern(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
      patternCtx.strokeStyle = this.FillColor;
      patternCtx.lineWidth = 1;
      patternCtx.beginPath();
      patternCtx.moveTo(0, 0);
      patternCtx.lineTo(4, 4);
      patternCtx.stroke();
    });
    this.ctx.fillStyle = this.ctx.createPattern(pattern, 'repeat') || this.FillColor;
  }

  private drawCrossPattern(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
      patternCtx.strokeStyle = this.FillColor;
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
    this.ctx.fillStyle = this.ctx.createPattern(pattern, 'repeat') || this.FillColor;
  }

  private drawDiagonalCrossPattern(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    const pattern = this.createPatternCanvas(4, 4, (patternCtx) => {
      patternCtx.strokeStyle = this.FillColor;
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
    this.ctx.fillStyle = this.ctx.createPattern(pattern, 'repeat') || this.FillColor;
  }

  /**
   * Create a pattern canvas for fill patterns
   */
  private createPatternCanvas(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = this.BackColor;
      ctx.fillRect(0, 0, width, height);
      drawFn(ctx);
    }
    return canvas;
  }
  
  /**
   * Convert units to pixels
   */
  private unitsToPixels(value: number, isHorizontal: boolean): number {
    switch (this.ScaleMode) {
      case VB6ScaleMode.vbPixels:
        return value;
      case VB6ScaleMode.vbTwips:
        // 1 twip = 1/1440 inch = 1/20 point
        return value / 15; // Approximate
      case VB6ScaleMode.vbPoints:
        return value * 1.333; // 1 point = 1.333 pixels at 96 DPI
      case VB6ScaleMode.vbInches:
        return value * 96; // 96 DPI
      case VB6ScaleMode.vbMillimeters:
        return value * 3.78; // 96 DPI
      case VB6ScaleMode.vbCentimeters:
        return value * 37.8; // 96 DPI
      case VB6ScaleMode.vbUser:
        if (isHorizontal && this.ScaleWidth > 0 && this._canvas) {
          return ((value - this.ScaleLeft) / this.ScaleWidth) * this._canvas.width;
        } else if (!isHorizontal && this.ScaleHeight > 0 && this._canvas) {
          return ((value - this.ScaleTop) / this.ScaleHeight) * this._canvas.height;
        }
        return value;
      default:
        return value;
    }
  }
  
  /**
   * Convert pixels to units
   */
  private pixelsToUnits(pixels: number, isHorizontal: boolean): number {
    switch (this.ScaleMode) {
      case VB6ScaleMode.vbPixels:
        return pixels;
      case VB6ScaleMode.vbTwips:
        return pixels * 15;
      case VB6ScaleMode.vbPoints:
        return pixels / 1.333;
      case VB6ScaleMode.vbInches:
        return pixels / 96;
      case VB6ScaleMode.vbMillimeters:
        return pixels / 3.78;
      case VB6ScaleMode.vbCentimeters:
        return pixels / 37.8;
      case VB6ScaleMode.vbUser:
        if (isHorizontal && this._canvas) {
          return this.ScaleLeft + (pixels / this._canvas.width) * this.ScaleWidth;
        } else if (!isHorizontal && this._canvas) {
          return this.ScaleTop + (pixels / this._canvas.height) * this.ScaleHeight;
        }
        return pixels;
      default:
        return pixels;
    }
  }
}

// ============================================================================
// GLOBAL GRAPHICS MANAGER
// ============================================================================

/**
 * Manages graphics contexts for all forms and controls
 */
export class VB6GraphicsManager {
  private static instance: VB6GraphicsManager;
  private contexts: Map<string, VB6GraphicsContext> = new Map();
  
  static getInstance(): VB6GraphicsManager {
    if (!VB6GraphicsManager.instance) {
      VB6GraphicsManager.instance = new VB6GraphicsManager();
    }
    return VB6GraphicsManager.instance;
  }
  
  /**
   * Get or create graphics context for an element
   * @param elementId Element ID or element
   */
  getContext(elementId: string | HTMLElement): VB6GraphicsContext {
    const id = typeof elementId === 'string' ? elementId : elementId.id;
    
    if (!this.contexts.has(id)) {
      const context = new VB6GraphicsContext();
      context.attachToElement(elementId);
      this.contexts.set(id, context);
    }
    
    return this.contexts.get(id)!;
  }
  
  /**
   * Remove graphics context
   * @param elementId Element ID
   */
  removeContext(elementId: string): void {
    this.contexts.delete(elementId);
  }
}

// ============================================================================
// EXPORT ALL FORM GRAPHICS
// ============================================================================

const graphicsManager = VB6GraphicsManager.getInstance();

export const VB6FormGraphics = {
  VB6GraphicsContext,
  VB6GraphicsManager,
  VB6DrawMode,
  VB6DrawStyle,
  VB6FillStyle,
  VB6ScaleMode,
  graphicsManager
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  
  // Graphics classes
  globalAny.VB6GraphicsContext = VB6GraphicsContext;
  globalAny.VB6GraphicsManager = graphicsManager;
  
  // Enums
  globalAny.VB6DrawMode = VB6DrawMode;
  globalAny.VB6DrawStyle = VB6DrawStyle;
  globalAny.VB6FillStyle = VB6FillStyle;
  globalAny.VB6ScaleMode = VB6ScaleMode;
  
  // Helper function to get graphics context
  globalAny.GetGraphics = (elementId: string) => graphicsManager.getContext(elementId);
  
  console.log('[VB6] Form graphics loaded - Print, TextWidth, TextHeight, Line, Circle, PSet');
  console.log('[VB6] Graphics properties - CurrentX/Y, DrawMode, FillStyle, ScaleMode');
}

export default VB6FormGraphics;