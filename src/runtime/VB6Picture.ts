/**
 * VB6 LoadPicture/SavePicture Implementation
 * Complete support for image loading, saving, and manipulation
 */

// Picture types
export enum PictureTypeConstants {
  vbPicTypeNone = 0,
  vbPicTypeBitmap = 1,
  vbPicTypeMetafile = 2,
  vbPicTypeIcon = 3,
  vbPicTypeEMetafile = 4,
}

// Clipboard formats
export enum ClipboardConstants {
  vbCFText = 1,
  vbCFBitmap = 2,
  vbCFMetafile = 3,
  vbCFDIB = 8,
  vbCFPalette = 9,
  vbCFEMetafile = 14,
  vbCFFiles = 15,
  vbCFRTF = -16639,
}

// Color constants
export enum ColorConstants {
  vbBlack = 0x000000,
  vbRed = 0x0000ff,
  vbGreen = 0x00ff00,
  vbYellow = 0x00ffff,
  vbBlue = 0xff0000,
  vbMagenta = 0xff00ff,
  vbCyan = 0xffff00,
  vbWhite = 0xffffff,
}

// Picture scale mode
export enum ScaleModeConstants {
  vbUser = 0,
  vbTwips = 1,
  vbPoints = 2,
  vbPixels = 3,
  vbCharacters = 4,
  vbInches = 5,
  vbMillimeters = 6,
  vbCentimeters = 7,
}

/**
 * VB6 StdPicture Object
 */
export class StdPicture {
  private _handle: number = 0;
  private _type: PictureTypeConstants = PictureTypeConstants.vbPicTypeNone;
  private _width: number = 0;
  private _height: number = 0;
  private _imageData: string | ArrayBuffer | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _context: CanvasRenderingContext2D | null = null;
  private _image: HTMLImageElement | null = null;

  constructor() {}

  // Properties
  get Handle(): number {
    return this._handle;
  }
  get Type(): PictureTypeConstants {
    return this._type;
  }
  get Width(): number {
    return this._width;
  }
  get Height(): number {
    return this._height;
  }

  get hPal(): number {
    return 0;
  } // Palette handle (legacy)

  // Get canvas for drawing operations
  get Canvas(): HTMLCanvasElement {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._canvas.width = this._width;
      this._canvas.height = this._height;
      this._context = this._canvas.getContext('2d')!;

      if (this._image) {
        this._context.drawImage(this._image, 0, 0);
      }
    }
    return this._canvas;
  }

  // Get drawing context
  get Context(): CanvasRenderingContext2D {
    if (!this._context) {
      const canvas = this.Canvas;
      this._context = canvas.getContext('2d')!;
    }
    return this._context;
  }

  /**
   * Load image from URL or data
   */
  async loadFromUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this._image = img;
        this._width = img.width;
        this._height = img.height;
        this._type = this.detectImageType(url);
        this._handle = (Math.random() * 1000000) | 0;

        // Reset canvas to force redraw
        this._canvas = null;
        this._context = null;

        resolve();
      };

      img.onerror = error => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Handle data URLs and regular URLs
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        img.src = url;
      } else {
        // For cross-origin images
        img.crossOrigin = 'anonymous';
        img.src = url;
      }
    });
  }

  /**
   * Load from file input
   */
  async loadFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async e => {
        const dataUrl = e.target?.result as string;
        await this.loadFromUrl(dataUrl);
        resolve();
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Load from base64 data
   */
  async loadFromBase64(base64: string, mimeType: string = 'image/png'): Promise<void> {
    const dataUrl = `data:${mimeType};base64,${base64}`;
    await this.loadFromUrl(dataUrl);
  }

  /**
   * Save to data URL
   */
  toDataURL(type: string = 'image/png', quality: number = 0.92): string {
    const canvas = this.Canvas;
    return canvas.toDataURL(type, quality);
  }

  /**
   * Save to blob
   */
  async toBlob(type: string = 'image/png', quality: number = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = this.Canvas;
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        type,
        quality
      );
    });
  }

  /**
   * Render to another canvas or context
   */
  render(
    targetContext: CanvasRenderingContext2D,
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number
  ): void {
    const w = width || this._width;
    const h = height || this._height;

    if (this._image) {
      targetContext.drawImage(this._image, x, y, w, h);
    } else if (this._canvas) {
      targetContext.drawImage(this._canvas, x, y, w, h);
    }
  }

  /**
   * Clone the picture
   */
  clone(): StdPicture {
    const cloned = new StdPicture();
    cloned._handle = this._handle;
    cloned._type = this._type;
    cloned._width = this._width;
    cloned._height = this._height;

    if (this._image) {
      cloned._image = new Image();
      cloned._image.src = this._image.src;
    }

    if (this._canvas) {
      cloned._canvas = document.createElement('canvas');
      cloned._canvas.width = this._width;
      cloned._canvas.height = this._height;
      const ctx = cloned._canvas.getContext('2d')!;
      ctx.drawImage(this._canvas, 0, 0);
      cloned._context = ctx;
    }

    return cloned;
  }

  /**
   * Resize the picture
   */
  resize(newWidth: number, newHeight: number): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempContext = tempCanvas.getContext('2d')!;

    // Draw resized image
    if (this._image) {
      tempContext.drawImage(this._image, 0, 0, newWidth, newHeight);
    } else if (this._canvas) {
      tempContext.drawImage(this._canvas, 0, 0, newWidth, newHeight);
    }

    // Update properties
    this._width = newWidth;
    this._height = newHeight;
    this._canvas = tempCanvas;
    this._context = tempContext;

    // Convert to image for consistency
    this._image = new Image();
    this._image.src = tempCanvas.toDataURL();
  }

  /**
   * Crop the picture
   */
  crop(x: number, y: number, width: number, height: number): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempContext = tempCanvas.getContext('2d')!;

    // Draw cropped region
    if (this._image) {
      tempContext.drawImage(this._image, x, y, width, height, 0, 0, width, height);
    } else if (this._canvas) {
      tempContext.drawImage(this._canvas, x, y, width, height, 0, 0, width, height);
    }

    // Update properties
    this._width = width;
    this._height = height;
    this._canvas = tempCanvas;
    this._context = tempContext;

    // Convert to image
    this._image = new Image();
    this._image.src = tempCanvas.toDataURL();
  }

  /**
   * Rotate the picture
   */
  rotate(degrees: number): void {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Calculate new dimensions
    const newWidth = Math.abs(this._width * cos) + Math.abs(this._height * sin);
    const newHeight = Math.abs(this._width * sin) + Math.abs(this._height * cos);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempContext = tempCanvas.getContext('2d')!;

    // Rotate around center
    tempContext.translate(newWidth / 2, newHeight / 2);
    tempContext.rotate(radians);

    // Draw rotated image
    if (this._image) {
      tempContext.drawImage(this._image, -this._width / 2, -this._height / 2);
    } else if (this._canvas) {
      tempContext.drawImage(this._canvas, -this._width / 2, -this._height / 2);
    }

    // Update properties
    this._width = newWidth;
    this._height = newHeight;
    this._canvas = tempCanvas;
    this._context = tempContext;
  }

  /**
   * Flip the picture
   */
  flip(horizontal: boolean = true): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this._width;
    tempCanvas.height = this._height;
    const tempContext = tempCanvas.getContext('2d')!;

    // Apply flip transformation
    if (horizontal) {
      tempContext.scale(-1, 1);
      tempContext.translate(-this._width, 0);
    } else {
      tempContext.scale(1, -1);
      tempContext.translate(0, -this._height);
    }

    // Draw flipped image
    if (this._image) {
      tempContext.drawImage(this._image, 0, 0);
    } else if (this._canvas) {
      tempContext.drawImage(this._canvas, 0, 0);
    }

    // Update canvas
    this._canvas = tempCanvas;
    this._context = tempContext;
  }

  private detectImageType(url: string): PictureTypeConstants {
    const lower = url.toLowerCase();

    if (lower.includes('.bmp')) {
      return PictureTypeConstants.vbPicTypeBitmap;
    } else if (lower.includes('.ico')) {
      return PictureTypeConstants.vbPicTypeIcon;
    } else if (lower.includes('.wmf') || lower.includes('.emf')) {
      return PictureTypeConstants.vbPicTypeMetafile;
    } else {
      return PictureTypeConstants.vbPicTypeBitmap;
    }
  }
}

/**
 * VB6 Picture Manager
 */
export class VB6PictureManager {
  private static instance: VB6PictureManager;
  private pictures = new Map<string, StdPicture>();
  private clipboard: StdPicture | null = null;

  private constructor() {}

  static getInstance(): VB6PictureManager {
    if (!VB6PictureManager.instance) {
      VB6PictureManager.instance = new VB6PictureManager();
    }
    return VB6PictureManager.instance;
  }

  /**
   * Store picture with key
   */
  storePicture(key: string, picture: StdPicture): void {
    this.pictures.set(key, picture);
  }

  /**
   * Get picture by key
   */
  getPicture(key: string): StdPicture | undefined {
    return this.pictures.get(key);
  }

  /**
   * Remove picture
   */
  removePicture(key: string): void {
    this.pictures.delete(key);
  }

  /**
   * Copy to clipboard
   */
  copyToClipboard(picture: StdPicture): void {
    this.clipboard = picture.clone();
  }

  /**
   * Get from clipboard
   */
  getFromClipboard(): StdPicture | null {
    return this.clipboard ? this.clipboard.clone() : null;
  }

  /**
   * Clear clipboard
   */
  clearClipboard(): void {
    this.clipboard = null;
  }
}

// Global instance
export const PictureManager = VB6PictureManager.getInstance();

/**
 * LoadPicture function - VB6 compatible
 */
export async function LoadPicture(
  filename?: string,
  widthDesired?: number,
  heightDesired?: number,
  flags?: number
): Promise<StdPicture | null> {
  if (!filename) {
    // Return empty picture
    return null;
  }

  try {
    const picture = new StdPicture();

    // Handle different input types
    if (filename.startsWith('data:') || filename.startsWith('blob:')) {
      // Data URL or blob URL
      await picture.loadFromUrl(filename);
    } else if (filename.startsWith('http://') || filename.startsWith('https://')) {
      // Remote URL
      await picture.loadFromUrl(filename);
    } else if (filename.startsWith('base64:')) {
      // Base64 data
      const base64 = filename.substring(7);
      await picture.loadFromBase64(base64);
    } else {
      // Assume local file path or relative URL
      await picture.loadFromUrl(filename);
    }

    // Resize if dimensions specified
    if (widthDesired && heightDesired) {
      picture.resize(widthDesired, heightDesired);
    }

    return picture;
  } catch (error) {
    console.error('LoadPicture error:', error);
    throw new Error(`Cannot load picture from '${filename}'`);
  }
}

/**
 * SavePicture function - VB6 compatible
 */
export async function SavePicture(picture: StdPicture, filename: string): Promise<void> {
  if (!picture) {
    throw new Error('No picture to save');
  }

  try {
    // Determine format from filename
    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
    let mimeType = 'image/png';

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'bmp':
        mimeType = 'image/bmp';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
    }

    // Get blob
    const blob = await picture.toBlob(mimeType);

    // In browser environment, trigger download
    if (typeof window !== 'undefined' && window.document) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // In Node.js environment, would write to file system
    }
  } catch (error) {
    console.error('SavePicture error:', error);
    throw new Error(`Cannot save picture to '${filename}'`);
  }
}

/**
 * LoadResPicture - Load picture from resources
 */
export async function LoadResPicture(
  id: number | string,
  resType: number
): Promise<StdPicture | null> {
  // In web environment, resources would be in a specific location
  const resourcePath = `/resources/images/${id}`;

  try {
    return await LoadPicture(resourcePath);
  } catch (error) {
    console.error('LoadResPicture error:', error);
    return null;
  }
}

/**
 * LoadResData - Load binary data from resources
 */
export async function LoadResData(id: number | string, resType: number): Promise<ArrayBuffer> {
  const resourcePath = `/resources/data/${id}`;

  try {
    const response = await fetch(resourcePath);
    return await response.arrayBuffer();
  } catch (error) {
    console.error('LoadResData error:', error);
    throw new Error(`Cannot load resource data: ${id}`);
  }
}

/**
 * LoadResString - Load string from resources
 */
export async function LoadResString(id: number): Promise<string> {
  const resourcePath = `/resources/strings/${id}`;

  try {
    const response = await fetch(resourcePath);
    return await response.text();
  } catch (error) {
    console.error('LoadResString error:', error);
    return '';
  }
}

/**
 * Clipboard operations
 */
export const Clipboard = {
  Clear(): void {
    PictureManager.clearClipboard();
  },

  GetData(format: ClipboardConstants): any {
    if (format === ClipboardConstants.vbCFBitmap) {
      return PictureManager.getFromClipboard();
    }
    return null;
  },

  SetData(data: any, format?: ClipboardConstants): void {
    if (data instanceof StdPicture) {
      PictureManager.copyToClipboard(data);
    }
  },

  GetFormat(format: ClipboardConstants): boolean {
    if (format === ClipboardConstants.vbCFBitmap) {
      return PictureManager.getFromClipboard() !== null;
    }
    return false;
  },

  GetText(): string {
    // Would integrate with browser clipboard API
    return '';
  },

  SetText(text: string): void {
    // Would integrate with browser clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  },
};

/**
 * Picture box control simulation
 */
export class PictureBox {
  private _picture: StdPicture | null = null;
  private _autoSize: boolean = false;
  private _stretch: boolean = false;
  private _scaleMode: ScaleModeConstants = ScaleModeConstants.vbTwips;
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;

  constructor(width: number = 100, height: number = 100) {
    this._canvas = document.createElement('canvas');
    this._canvas.width = width;
    this._canvas.height = height;
    this._context = this._canvas.getContext('2d')!;
  }

  get Picture(): StdPicture | null {
    return this._picture;
  }
  set Picture(value: StdPicture | null) {
    this._picture = value;
    this.refresh();
  }

  get AutoSize(): boolean {
    return this._autoSize;
  }
  set AutoSize(value: boolean) {
    this._autoSize = value;
    if (value && this._picture) {
      this._canvas.width = this._picture.Width;
      this._canvas.height = this._picture.Height;
    }
    this.refresh();
  }

  get Stretch(): boolean {
    return this._stretch;
  }
  set Stretch(value: boolean) {
    this._stretch = value;
    this.refresh();
  }

  get ScaleMode(): ScaleModeConstants {
    return this._scaleMode;
  }
  set ScaleMode(value: ScaleModeConstants) {
    this._scaleMode = value;
  }

  get Canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  get hDC(): CanvasRenderingContext2D {
    return this._context;
  }

  // Drawing methods
  Cls(): void {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  Circle(x: number, y: number, radius: number, color?: number): void {
    this._context.beginPath();
    this._context.arc(x, y, radius, 0, 2 * Math.PI);
    if (color !== undefined) {
      this._context.fillStyle = this.colorToHex(color);
      this._context.fill();
    }
    this._context.stroke();
  }

  Line(x1: number, y1: number, x2: number, y2: number, color?: number): void {
    this._context.beginPath();
    this._context.moveTo(x1, y1);
    this._context.lineTo(x2, y2);
    if (color !== undefined) {
      this._context.strokeStyle = this.colorToHex(color);
    }
    this._context.stroke();
  }

  PSet(x: number, y: number, color: number): void {
    this._context.fillStyle = this.colorToHex(color);
    this._context.fillRect(x, y, 1, 1);
  }

  Point(x: number, y: number): number {
    const imageData = this._context.getImageData(x, y, 1, 1);
    const data = imageData.data;
    return (data[0] << 16) | (data[1] << 8) | data[2];
  }

  Print(text: string, x?: number, y?: number): void {
    const currentX = x || 0;
    const currentY = y || 20;
    this._context.fillText(text, currentX, currentY);
  }

  PaintPicture(picture: StdPicture, x: number, y: number, width?: number, height?: number): void {
    if (picture) {
      picture.render(this._context, x, y, width, height);
    }
  }

  private refresh(): void {
    this.Cls();

    if (this._picture) {
      if (this._stretch) {
        this._picture.render(this._context, 0, 0, this._canvas.width, this._canvas.height);
      } else {
        this._picture.render(this._context, 0, 0);
      }
    }
  }

  private colorToHex(color: number): string {
    return '#' + ('000000' + color.toString(16)).slice(-6);
  }
}

/**
 * Example usage
 */
export class VB6PictureExample {
  async demonstratePictures(): Promise<void> {
    // Load a picture
    const pic = await LoadPicture('/images/sample.png');

    if (pic) {
      // Resize picture
      pic.resize(100, 100);

      // Rotate picture
      pic.rotate(45);

      // Save picture
      await SavePicture(pic, 'output.png');

      // Store in manager
      PictureManager.storePicture('sample', pic);

      // Copy to clipboard
      Clipboard.SetData(pic);
    }

    // Create picture box
    const picBox = new PictureBox(200, 200);
    picBox.Picture = pic;
    picBox.Stretch = true;

    // Draw on picture box
    picBox.Line(0, 0, 200, 200, ColorConstants.vbRed);
    picBox.Circle(100, 100, 50, ColorConstants.vbBlue);
    picBox.Print('Hello VB6!', 10, 20);
  }
}

// Export all picture functionality
export const VB6Pictures = {
  PictureTypeConstants,
  ClipboardConstants,
  ColorConstants,
  ScaleModeConstants,
  StdPicture,
  VB6PictureManager,
  PictureManager,
  LoadPicture,
  SavePicture,
  LoadResPicture,
  LoadResData,
  LoadResString,
  Clipboard,
  PictureBox,
  VB6PictureExample,
};
