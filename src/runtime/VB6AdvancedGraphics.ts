/**
 * VB6 Advanced Graphics and GDI Functions
 * Complete implementation of VB6 graphics operations using Canvas API
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export enum DrawMode {
  vbCopyPen = 13, // Default - normal drawing
  vbInvert = 6,   // Invert destination
  vbXorPen = 7,   // XOR with destination
  vbNotXorPen = 8,
  vbMaskPen = 9,
  vbNotMaskPen = 10,
  vbMergePen = 15,
  vbNotMergePen = 16,
  vbMergePenNot = 12,
  vbMaskPenNot = 5,
  vbNop = 11,
  vbBlackness = 1,
  vbWhiteness = 2
}

export enum FillStyle {
  vbFSSolid = 0,
  vbFSTransparent = 1,
  vbHorizontalLine = 2,
  vbVerticalLine = 3,
  vbUpwardDiagonal = 4,
  vbDownwardDiagonal = 5,
  vbCross = 6,
  vbDiagonalCross = 7
}

export enum DrawStyle {
  vbSolid = 0,
  vbDash = 1,
  vbDot = 2,
  vbDashDot = 3,
  vbDashDotDot = 4,
  vbTransparent = 5,
  vbInsideSolid = 6
}

export enum ScaleMode {
  vbUser = 0,
  vbTwips = 1,
  vbPoints = 2,
  vbPixels = 3,
  vbCharacters = 4,
  vbInches = 5,
  vbMillimeters = 6,
  vbCentimeters = 7
}

// ============================================================================
// VB6 Graphics Context
// ============================================================================

export class VB6GraphicsContext {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _currentX: number = 0;
  private _currentY: number = 0;
  private _drawMode: DrawMode = DrawMode.vbCopyPen;
  private _drawStyle: DrawStyle = DrawStyle.vbSolid;
  private _drawWidth: number = 1;
  private _fillColor: number = 0xFFFFFF;
  private _fillStyle: FillStyle = FillStyle.vbFSSolid;
  private _foreColor: number = 0x000000;
  private _backColor: number = 0xFFFFFF;
  private _fontName: string = 'MS Sans Serif';
  private _fontSize: number = 8;
  private _fontBold: boolean = false;
  private _fontItalic: boolean = false;
  private _fontUnderline: boolean = false;
  private _scaleMode: ScaleMode = ScaleMode.vbTwips;
  private _scaleLeft: number = 0;
  private _scaleTop: number = 0;
  private _scaleWidth: number = 0;
  private _scaleHeight: number = 0;
  private _autoRedraw: boolean = false;
  private backBuffer: HTMLCanvasElement | null = null;
  private backCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    // Initialize scale
    this._scaleWidth = canvas.width;
    this._scaleHeight = canvas.height;
  }

  // ============================================================================
  // Properties
  // ============================================================================

  get CurrentX(): number {
    return this._currentX;
  }
  set CurrentX(value: number) {
    this._currentX = value;
  }

  get CurrentY(): number {
    return this._currentY;
  }
  set CurrentY(value: number) {
    this._currentY = value;
  }

  get DrawMode(): DrawMode {
    return this._drawMode;
  }
  set DrawMode(value: DrawMode) {
    this._drawMode = value;
    this.applyDrawMode();
  }

  get DrawStyle(): DrawStyle {
    return this._drawStyle;
  }
  set DrawStyle(value: DrawStyle) {
    this._drawStyle = value;
    this.applyDrawStyle();
  }

  get DrawWidth(): number {
    return this._drawWidth;
  }
  set DrawWidth(value: number) {
    this._drawWidth = Math.max(1, value);
    this.ctx.lineWidth = this._drawWidth;
  }

  get FillColor(): number {
    return this._fillColor;
  }
  set FillColor(value: number) {
    this._fillColor = value;
  }

  get FillStyleProp(): FillStyle {
    return this._fillStyle;
  }
  set FillStyleProp(value: FillStyle) {
    this._fillStyle = value;
  }

  get ForeColor(): number {
    return this._foreColor;
  }
  set ForeColor(value: number) {
    this._foreColor = value;
    this.ctx.strokeStyle = this.colorToCSS(value);
    this.ctx.fillStyle = this.colorToCSS(value);
  }

  get BackColor(): number {
    return this._backColor;
  }
  set BackColor(value: number) {
    this._backColor = value;
  }

  get FontName(): string {
    return this._fontName;
  }
  set FontName(value: string) {
    this._fontName = value;
    this.applyFont();
  }

  get FontSize(): number {
    return this._fontSize;
  }
  set FontSize(value: number) {
    this._fontSize = value;
    this.applyFont();
  }

  get FontBold(): boolean {
    return this._fontBold;
  }
  set FontBold(value: boolean) {
    this._fontBold = value;
    this.applyFont();
  }

  get FontItalic(): boolean {
    return this._fontItalic;
  }
  set FontItalic(value: boolean) {
    this._fontItalic = value;
    this.applyFont();
  }

  get FontUnderline(): boolean {
    return this._fontUnderline;
  }
  set FontUnderline(value: boolean) {
    this._fontUnderline = value;
    this.applyFont();
  }

  get AutoRedraw(): boolean {
    return this._autoRedraw;
  }
  set AutoRedraw(value: boolean) {
    this._autoRedraw = value;
    if (value && !this.backBuffer) {
      this.createBackBuffer();
    }
  }

  get ScaleMode(): ScaleMode {
    return this._scaleMode;
  }
  set ScaleMode(value: ScaleMode) {
    this._scaleMode = value;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private colorToCSS(color: number): string {
    // VB6 color format is BGR (blue in high byte, red in low byte)
    const r = color & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = (color >> 16) & 0xFF;
    return `rgb(${r},${g},${b})`;
  }

  private applyFont(): void {
    const style = this._fontItalic ? 'italic' : 'normal';
    const weight = this._fontBold ? 'bold' : 'normal';
    this.ctx.font = `${style} ${weight} ${this._fontSize}pt ${this._fontName}`;
  }

  private applyDrawMode(): void {
    // Apply composite operation based on draw mode
    switch (this._drawMode) {
      case DrawMode.vbInvert:
        this.ctx.globalCompositeOperation = 'difference';
        break;
      case DrawMode.vbXorPen:
        this.ctx.globalCompositeOperation = 'xor';
        break;
      case DrawMode.vbMergePen:
        this.ctx.globalCompositeOperation = 'lighter';
        break;
      case DrawMode.vbCopyPen:
      default:
        this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  private applyDrawStyle(): void {
    switch (this._drawStyle) {
      case DrawStyle.vbDash:
        this.ctx.setLineDash([8, 4]);
        break;
      case DrawStyle.vbDot:
        this.ctx.setLineDash([2, 2]);
        break;
      case DrawStyle.vbDashDot:
        this.ctx.setLineDash([8, 4, 2, 4]);
        break;
      case DrawStyle.vbDashDotDot:
        this.ctx.setLineDash([8, 4, 2, 4, 2, 4]);
        break;
      case DrawStyle.vbTransparent:
        this.ctx.setLineDash([0, 999999]); // Effectively invisible
        break;
      case DrawStyle.vbSolid:
      case DrawStyle.vbInsideSolid:
      default:
        this.ctx.setLineDash([]);
    }
  }

  private createBackBuffer(): void {
    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = this.canvas.width;
    this.backBuffer.height = this.canvas.height;
    this.backCtx = this.backBuffer.getContext('2d');
  }

  private applyFillPattern(): CanvasPattern | null {
    if (this._fillStyle === FillStyle.vbFSSolid) {
      return null;
    }

    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return null;

    patternCanvas.width = 8;
    patternCanvas.height = 8;

    patternCtx.fillStyle = this.colorToCSS(this._backColor);
    patternCtx.fillRect(0, 0, 8, 8);

    patternCtx.strokeStyle = this.colorToCSS(this._fillColor);
    patternCtx.lineWidth = 1;

    switch (this._fillStyle) {
      case FillStyle.vbHorizontalLine:
        patternCtx.beginPath();
        patternCtx.moveTo(0, 4);
        patternCtx.lineTo(8, 4);
        patternCtx.stroke();
        break;

      case FillStyle.vbVerticalLine:
        patternCtx.beginPath();
        patternCtx.moveTo(4, 0);
        patternCtx.lineTo(4, 8);
        patternCtx.stroke();
        break;

      case FillStyle.vbUpwardDiagonal:
        patternCtx.beginPath();
        patternCtx.moveTo(0, 8);
        patternCtx.lineTo(8, 0);
        patternCtx.stroke();
        break;

      case FillStyle.vbDownwardDiagonal:
        patternCtx.beginPath();
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(8, 8);
        patternCtx.stroke();
        break;

      case FillStyle.vbCross:
        patternCtx.beginPath();
        patternCtx.moveTo(0, 4);
        patternCtx.lineTo(8, 4);
        patternCtx.moveTo(4, 0);
        patternCtx.lineTo(4, 8);
        patternCtx.stroke();
        break;

      case FillStyle.vbDiagonalCross:
        patternCtx.beginPath();
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(8, 8);
        patternCtx.moveTo(8, 0);
        patternCtx.lineTo(0, 8);
        patternCtx.stroke();
        break;
    }

    return this.ctx.createPattern(patternCanvas, 'repeat');
  }

  // ============================================================================
  // Drawing Methods (VB6 Graphics Methods)
  // ============================================================================

  /**
   * Clear the canvas (Cls method)
   */
  Cls(): void {
    this.ctx.fillStyle = this.colorToCSS(this._backColor);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._currentX = 0;
    this._currentY = 0;
  }

  /**
   * Draw a point (PSet method)
   */
  PSet(x: number, y: number, color?: number): void {
    const c = color !== undefined ? color : this._foreColor;
    this.ctx.fillStyle = this.colorToCSS(c);
    this.ctx.fillRect(x, y, this._drawWidth, this._drawWidth);
    this._currentX = x;
    this._currentY = y;
  }

  /**
   * Get point color (Point method)
   */
  Point(x: number, y: number): number {
    const imageData = this.ctx.getImageData(x, y, 1, 1);
    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];
    return r | (g << 8) | (b << 16); // Return VB6 BGR format
  }

  /**
   * Draw a line (Line method)
   */
  Line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color?: number,
    boxMode?: 'B' | 'BF'
  ): void {
    const c = color !== undefined ? color : this._foreColor;
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.fillStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    if (boxMode === 'B') {
      // Draw box outline
      this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (boxMode === 'BF') {
      // Draw filled box
      if (this._fillStyle === FillStyle.vbFSSolid) {
        this.ctx.fillStyle = this.colorToCSS(this._fillColor);
        this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      } else if (this._fillStyle !== FillStyle.vbFSTransparent) {
        const pattern = this.applyFillPattern();
        if (pattern) {
          this.ctx.fillStyle = pattern;
          this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        }
      }
      this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else {
      // Draw line
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    this._currentX = x2;
    this._currentY = y2;
  }

  /**
   * Draw a circle or ellipse (Circle method)
   */
  Circle(
    x: number,
    y: number,
    radius: number,
    color?: number,
    startAngle?: number,
    endAngle?: number,
    aspect?: number
  ): void {
    const c = color !== undefined ? color : this._foreColor;
    const start = startAngle !== undefined ? startAngle : 0;
    const end = endAngle !== undefined ? endAngle : Math.PI * 2;
    const aspectRatio = aspect !== undefined ? aspect : 1;

    this.ctx.save();
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    this.ctx.translate(x, y);
    this.ctx.scale(1, aspectRatio);

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, -start, -end, true);

    // Fill if not transparent
    if (
      this._fillStyle !== FillStyle.vbFSTransparent &&
      this._fillStyle !== FillStyle.vbFSSolid
    ) {
      const pattern = this.applyFillPattern();
      if (pattern) {
        this.ctx.fillStyle = pattern;
        this.ctx.fill();
      }
    } else if (this._fillStyle === FillStyle.vbFSSolid) {
      this.ctx.fillStyle = this.colorToCSS(this._fillColor);
      this.ctx.fill();
    }

    this.ctx.stroke();
    this.ctx.restore();

    this._currentX = x;
    this._currentY = y;
  }

  /**
   * Print text (Print method)
   */
  Print(...args: any[]): void {
    const text = args.map(a => String(a)).join('');
    this.applyFont();

    this.ctx.fillStyle = this.colorToCSS(this._foreColor);
    this.ctx.fillText(text, this._currentX, this._currentY + this._fontSize);

    // Draw underline if needed
    if (this._fontUnderline) {
      const metrics = this.ctx.measureText(text);
      this.ctx.beginPath();
      this.ctx.moveTo(this._currentX, this._currentY + this._fontSize + 2);
      this.ctx.lineTo(
        this._currentX + metrics.width,
        this._currentY + this._fontSize + 2
      );
      this.ctx.strokeStyle = this.colorToCSS(this._foreColor);
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Update current position
    const metrics = this.ctx.measureText(text);
    this._currentX += metrics.width;
  }

  /**
   * Get text width (TextWidth method)
   */
  TextWidth(text: string): number {
    this.applyFont();
    return this.ctx.measureText(text).width;
  }

  /**
   * Get text height (TextHeight method)
   */
  TextHeight(text: string): number {
    // Approximate height based on font size
    return this._fontSize * 1.2;
  }

  /**
   * Paint fill (PaintPicture-like flood fill)
   */
  Paint(x: number, y: number, fillColor: number, borderColor?: number): void {
    // Implement flood fill algorithm
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const data = imageData.data;

    const targetColor = this.getPixelColor(data, x, y);
    const fill = {
      r: fillColor & 0xff,
      g: (fillColor >> 8) & 0xff,
      b: (fillColor >> 16) & 0xff
    };

    if (this.colorsMatch(targetColor, fill)) return;

    const stack: Point[] = [{ x, y }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const point = stack.pop()!;
      const key = `${point.x},${point.y}`;

      if (visited.has(key)) continue;
      if (
        point.x < 0 ||
        point.x >= this.canvas.width ||
        point.y < 0 ||
        point.y >= this.canvas.height
      )
        continue;

      const currentColor = this.getPixelColor(data, point.x, point.y);
      if (!this.colorsMatch(currentColor, targetColor)) continue;

      visited.add(key);
      this.setPixelColor(data, point.x, point.y, fill);

      stack.push({ x: point.x + 1, y: point.y });
      stack.push({ x: point.x - 1, y: point.y });
      stack.push({ x: point.x, y: point.y + 1 });
      stack.push({ x: point.x, y: point.y - 1 });
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private getPixelColor(
    data: Uint8ClampedArray,
    x: number,
    y: number
  ): { r: number; g: number; b: number } {
    const i = (y * this.canvas.width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  }

  private setPixelColor(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    color: { r: number; g: number; b: number }
  ): void {
    const i = (y * this.canvas.width + x) * 4;
    data[i] = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = 255;
  }

  private colorsMatch(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ): boolean {
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
  }

  /**
   * Scale method to set custom coordinate system
   */
  Scale(
    x1?: number,
    y1?: number,
    x2?: number,
    y2?: number
  ): void {
    if (x1 === undefined) {
      // Reset to default
      this._scaleLeft = 0;
      this._scaleTop = 0;
      this._scaleWidth = this.canvas.width;
      this._scaleHeight = this.canvas.height;
      this._scaleMode = ScaleMode.vbPixels;
    } else {
      this._scaleLeft = x1!;
      this._scaleTop = y1!;
      this._scaleWidth = x2! - x1!;
      this._scaleHeight = y2! - y1!;
      this._scaleMode = ScaleMode.vbUser;
    }
  }

  /**
   * ScaleX - Convert horizontal coordinate
   */
  ScaleX(value: number, fromScale: ScaleMode, toScale: ScaleMode): number {
    // Convert to pixels first
    let pixels = this.toPixelsX(value, fromScale);
    // Then convert to target scale
    return this.fromPixelsX(pixels, toScale);
  }

  /**
   * ScaleY - Convert vertical coordinate
   */
  ScaleY(value: number, fromScale: ScaleMode, toScale: ScaleMode): number {
    let pixels = this.toPixelsY(value, fromScale);
    return this.fromPixelsY(pixels, toScale);
  }

  private toPixelsX(value: number, scale: ScaleMode): number {
    switch (scale) {
      case ScaleMode.vbTwips:
        return value / 15;
      case ScaleMode.vbPoints:
        return value * 96 / 72;
      case ScaleMode.vbInches:
        return value * 96;
      case ScaleMode.vbMillimeters:
        return value * 96 / 25.4;
      case ScaleMode.vbCentimeters:
        return value * 96 / 2.54;
      case ScaleMode.vbCharacters:
        return value * 8;
      case ScaleMode.vbPixels:
      default:
        return value;
    }
  }

  private toPixelsY(value: number, scale: ScaleMode): number {
    return this.toPixelsX(value, scale); // Same conversion for Y
  }

  private fromPixelsX(pixels: number, scale: ScaleMode): number {
    switch (scale) {
      case ScaleMode.vbTwips:
        return pixels * 15;
      case ScaleMode.vbPoints:
        return pixels * 72 / 96;
      case ScaleMode.vbInches:
        return pixels / 96;
      case ScaleMode.vbMillimeters:
        return pixels * 25.4 / 96;
      case ScaleMode.vbCentimeters:
        return pixels * 2.54 / 96;
      case ScaleMode.vbCharacters:
        return pixels / 8;
      case ScaleMode.vbPixels:
      default:
        return pixels;
    }
  }

  private fromPixelsY(pixels: number, scale: ScaleMode): number {
    return this.fromPixelsX(pixels, scale);
  }

  /**
   * Refresh - redraw from back buffer if AutoRedraw is enabled
   */
  Refresh(): void {
    if (this._autoRedraw && this.backBuffer && this.backCtx) {
      this.ctx.drawImage(this.backBuffer, 0, 0);
    }
  }

  /**
   * Save canvas to image
   */
  SavePicture(filename: string): void {
    const dataUrl = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  /**
   * Load image onto canvas
   */
  async LoadPicture(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Copy rectangular region
   */
  BitBlt(
    destX: number,
    destY: number,
    width: number,
    height: number,
    sourceCanvas: HTMLCanvasElement,
    sourceX: number,
    sourceY: number,
    rop?: number
  ): void {
    const imageData = sourceCanvas
      .getContext('2d')!
      .getImageData(sourceX, sourceY, width, height);
    this.ctx.putImageData(imageData, destX, destY);
  }

  /**
   * Stretch and copy rectangular region
   */
  StretchBlt(
    destX: number,
    destY: number,
    destWidth: number,
    destHeight: number,
    sourceCanvas: HTMLCanvasElement,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    rop?: number
  ): void {
    this.ctx.drawImage(
      sourceCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
  }

  /**
   * Draw polygon
   */
  Polygon(points: Point[], color?: number): void {
    if (points.length < 3) return;

    const c = color !== undefined ? color : this._foreColor;
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.closePath();

    if (this._fillStyle === FillStyle.vbFSSolid) {
      this.ctx.fillStyle = this.colorToCSS(this._fillColor);
      this.ctx.fill();
    } else if (this._fillStyle !== FillStyle.vbFSTransparent) {
      const pattern = this.applyFillPattern();
      if (pattern) {
        this.ctx.fillStyle = pattern;
        this.ctx.fill();
      }
    }

    this.ctx.stroke();
  }

  /**
   * Draw polyline (connected lines)
   */
  PolyLine(points: Point[], color?: number): void {
    if (points.length < 2) return;

    const c = color !== undefined ? color : this._foreColor;
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.stroke();
  }

  /**
   * Draw arc
   */
  Arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color?: number
  ): void {
    const c = color !== undefined ? color : this._foreColor;
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, -startAngle, -endAngle, true);
    this.ctx.stroke();
  }

  /**
   * Draw pie slice
   */
  Pie(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color?: number
  ): void {
    const c = color !== undefined ? color : this._foreColor;
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.arc(x, y, radius, -startAngle, -endAngle, true);
    this.ctx.closePath();

    if (this._fillStyle === FillStyle.vbFSSolid) {
      this.ctx.fillStyle = this.colorToCSS(this._fillColor);
      this.ctx.fill();
    }

    this.ctx.stroke();
  }

  /**
   * Draw rounded rectangle
   */
  RoundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radiusX: number,
    radiusY: number,
    color?: number
  ): void {
    const c = color !== undefined ? color : this._foreColor;
    this.ctx.strokeStyle = this.colorToCSS(c);
    this.ctx.lineWidth = this._drawWidth;
    this.applyDrawStyle();

    this.ctx.beginPath();
    this.ctx.moveTo(x + radiusX, y);
    this.ctx.lineTo(x + width - radiusX, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radiusY);
    this.ctx.lineTo(x + width, y + height - radiusY);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radiusX,
      y + height
    );
    this.ctx.lineTo(x + radiusX, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radiusY);
    this.ctx.lineTo(x, y + radiusY);
    this.ctx.quadraticCurveTo(x, y, x + radiusX, y);
    this.ctx.closePath();

    if (this._fillStyle === FillStyle.vbFSSolid) {
      this.ctx.fillStyle = this.colorToCSS(this._fillColor);
      this.ctx.fill();
    }

    this.ctx.stroke();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a VB6 graphics context from a canvas element
 */
export function CreateGraphicsContext(
  canvas: HTMLCanvasElement
): VB6GraphicsContext {
  return new VB6GraphicsContext(canvas);
}

/**
 * Create a canvas element with VB6 graphics context
 */
export function CreateCanvas(
  width: number,
  height: number,
  parent?: HTMLElement
): VB6GraphicsContext {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  if (parent) {
    parent.appendChild(canvas);
  }

  return new VB6GraphicsContext(canvas);
}

// ============================================================================
// Export All
// ============================================================================

export const VB6AdvancedGraphics = {
  VB6GraphicsContext,
  CreateGraphicsContext,
  CreateCanvas,
  DrawMode,
  FillStyle,
  DrawStyle,
  ScaleMode
};

export default VB6AdvancedGraphics;
