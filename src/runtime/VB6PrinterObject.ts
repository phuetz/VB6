/**
 * VB6 Printer Object Implementation
 *
 * Web-compatible implementation of VB6 Printer object and printing functions
 * Supports Print, EndDoc, NewPage, and various printer properties
 */

import { errorHandler } from './VB6ErrorHandling';

// Printer Constants
export const VB6PrinterConstants = {
  // Orientation
  vbPRORPortrait: 1,
  vbPRORLandscape: 2,

  // Paper Size
  vbPRPSLetter: 1,
  vbPRPSLetterSmall: 2,
  vbPRPSTabloid: 3,
  vbPRPSLedger: 4,
  vbPRPSLegal: 5,
  vbPRPSStatement: 6,
  vbPRPSExecutive: 7,
  vbPRPSA3: 8,
  vbPRPSA4: 9,
  vbPRPSA4Small: 10,
  vbPRPSA5: 11,
  vbPRPSB4: 12,
  vbPRPSB5: 13,

  // Print Quality
  vbPRPQDraft: -1,
  vbPRPQLow: -2,
  vbPRPQMedium: -3,
  vbPRPQHigh: -4,

  // Color Mode
  vbPRCMMonochrome: 1,
  vbPRCMColor: 2,

  // Duplex
  vbPRDPSimplex: 1,
  vbPRDPHorizontal: 2,
  vbPRDPVertical: 3,
} as const;

// Font Constants
export const VB6FontConstants = {
  vbFSRegular: 400,
  vbFSBold: 700,
  vbFSItalic: 2,
  vbFSUnderline: 4,
  vbFSStrikethrough: 8,
} as const;

// Printer Font Object
export class VB6PrinterFont {
  private _name: string = 'Times New Roman';
  private _size: number = 12;
  private _bold: boolean = false;
  private _italic: boolean = false;
  private _underline: boolean = false;
  private _strikethrough: boolean = false;

  get Name(): string {
    return this._name;
  }
  set Name(value: string) {
    this._name = value;
  }

  get Size(): number {
    return this._size;
  }
  set Size(value: number) {
    this._size = Math.max(1, value);
  }

  get Bold(): boolean {
    return this._bold;
  }
  set Bold(value: boolean) {
    this._bold = value;
  }

  get Italic(): boolean {
    return this._italic;
  }
  set Italic(value: boolean) {
    this._italic = value;
  }

  get Underline(): boolean {
    return this._underline;
  }
  set Underline(value: boolean) {
    this._underline = value;
  }

  get Strikethrough(): boolean {
    return this._strikethrough;
  }
  set Strikethrough(value: boolean) {
    this._strikethrough = value;
  }

  toString(): string {
    let style = '';
    if (this._bold) style += 'bold ';
    if (this._italic) style += 'italic ';
    return `${style}${this._size}px ${this._name}`;
  }
}

// Main VB6 Printer Object
export class VB6Printer {
  // Printer Properties
  public DeviceName: string = 'Default Printer';
  public DriverName: string = 'Web Printer Driver';
  public Port: string = 'PDF:';
  public Orientation: number = VB6PrinterConstants.vbPRORPortrait;
  public PaperSize: number = VB6PrinterConstants.vbPRPSLetter;
  public PrintQuality: number = VB6PrinterConstants.vbPRPQHigh;
  public ColorMode: number = VB6PrinterConstants.vbPRCMColor;
  public Duplex: number = VB6PrinterConstants.vbPRDPSimplex;
  public Copies: number = 1;

  // Coordinate Properties (in twips, 1440 twips = 1 inch)
  public CurrentX: number = 0;
  public CurrentY: number = 0;
  public ScaleLeft: number = 0;
  public ScaleTop: number = 0;
  public ScaleWidth: number = 12240; // 8.5 inches * 1440 twips
  public ScaleHeight: number = 15840; // 11 inches * 1440 twips
  public ScaleMode: number = 1; // vbTwips

  // Page Properties
  public Page: number = 0;
  public Zoom: number = 100;

  // Font Object
  public Font: VB6PrinterFont = new VB6PrinterFont();

  // Color Properties
  public ForeColor: number = 0x000000; // Black
  public BackColor: number = 0xffffff; // White

  // Private state
  private _printContent: string[] = [];
  private _isDocumentStarted: boolean = false;
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _printWindow: Window | null = null;

  constructor() {
    // Create virtual canvas for measurements
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d')!;
    this._setupCanvas();
  }

  private _setupCanvas(): void {
    // Set canvas size based on paper size and orientation
    if (this.Orientation === VB6PrinterConstants.vbPRORPortrait) {
      this._canvas.width = 816; // 8.5 inches at 96 DPI
      this._canvas.height = 1056; // 11 inches at 96 DPI
    } else {
      this._canvas.width = 1056; // 11 inches at 96 DPI
      this._canvas.height = 816; // 8.5 inches at 96 DPI
    }

    // Set white background
    this._context.fillStyle = 'white';
    this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Set default text properties
    this._updateCanvasFont();
  }

  private _updateCanvasFont(): void {
    this._context.fillStyle = this._colorToCSS(this.ForeColor);
    this._context.font = this.Font.toString();
    this._context.textBaseline = 'top';
  }

  private _colorToCSS(vb6Color: number): string {
    const r = vb6Color & 0xff;
    const g = (vb6Color >> 8) & 0xff;
    const b = (vb6Color >> 16) & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
  }

  private _twipsToPixels(twips: number, isX: boolean = true): number {
    // 1440 twips = 1 inch, 96 pixels = 1 inch (typical screen DPI)
    const pixelsPerTwip = 96 / 1440;
    return twips * pixelsPerTwip;
  }

  private _pixelsToTwips(pixels: number): number {
    const twipsPerPixel = 1440 / 96;
    return pixels * twipsPerPixel;
  }

  /**
   * VB6 Print Method
   * Prints text to the current document
   */
  Print(text: string = '', includeNewLine: boolean = true): void {
    try {
      if (!this._isDocumentStarted) {
        this._startNewDocument();
      }

      const printText = String(text);

      // Convert current position to pixels
      const pixelX = this._twipsToPixels(this.CurrentX);
      const pixelY = this._twipsToPixels(this.CurrentY);

      // Update canvas font
      this._updateCanvasFont();

      // Draw text on canvas
      this._context.fillText(printText, pixelX, pixelY);

      // Measure text to update current position
      const metrics = this._context.measureText(printText);
      const textHeight = this.Font.Size; // Approximate text height

      if (includeNewLine) {
        // Move to next line
        this.CurrentX = this.ScaleLeft;
        this.CurrentY += this._pixelsToTwips(textHeight * 1.2); // Line spacing
      } else {
        // Move to end of printed text
        this.CurrentX += this._pixelsToTwips(metrics.width);
      }

      // Store text for final output
      this._printContent.push(printText + (includeNewLine ? '\n' : ''));
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.Print');
    }
  }

  /**
   * VB6 NewPage Method
   * Starts a new page
   */
  NewPage(): void {
    try {
      if (!this._isDocumentStarted) {
        this._startNewDocument();
      }

      this.Page++;
      this.CurrentX = this.ScaleLeft;
      this.CurrentY = this.ScaleTop;

      // Clear canvas for new page
      this._setupCanvas();
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.NewPage');
    }
  }

  /**
   * VB6 EndDoc Method
   * Ends the current document and sends it to the printer
   */
  EndDoc(): void {
    try {
      if (!this._isDocumentStarted) {
        return; // Nothing to print
      }

      // Generate final print output
      this._generatePrintOutput();

      // Reset state
      this._isDocumentStarted = false;
      this.Page = 0;
      this.CurrentX = this.ScaleLeft;
      this.CurrentY = this.ScaleTop;
      this._printContent = [];
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.EndDoc');
    }
  }

  /**
   * VB6 KillDoc Method
   * Cancels the current print job
   */
  KillDoc(): void {
    try {
      if (this._isDocumentStarted) {
        this._isDocumentStarted = false;
        this.Page = 0;
        this.CurrentX = this.ScaleLeft;
        this.CurrentY = this.ScaleTop;
        this._printContent = [];
      }
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.KillDoc');
    }
  }

  /**
   * VB6 Line Method for Printer
   * Draws a line on the current page
   */
  Line(x1?: number, y1?: number, x2?: number, y2?: number, color?: number): void {
    try {
      if (!this._isDocumentStarted) {
        this._startNewDocument();
      }

      const startX = x1 !== undefined ? x1 : this.CurrentX;
      const startY = y1 !== undefined ? y1 : this.CurrentY;
      const endX = x2 !== undefined ? x2 : this.CurrentX;
      const endY = y2 !== undefined ? y2 : this.CurrentY;

      // Convert to pixels
      const pixelStartX = this._twipsToPixels(startX);
      const pixelStartY = this._twipsToPixels(startY);
      const pixelEndX = this._twipsToPixels(endX);
      const pixelEndY = this._twipsToPixels(endY);

      // Set line color
      this._context.strokeStyle = this._colorToCSS(color || this.ForeColor);
      this._context.lineWidth = 1;

      // Draw line
      this._context.beginPath();
      this._context.moveTo(pixelStartX, pixelStartY);
      this._context.lineTo(pixelEndX, pixelEndY);
      this._context.stroke();

      // Update current position
      this.CurrentX = endX;
      this.CurrentY = endY;
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.Line');
    }
  }

  /**
   * VB6 Circle Method for Printer
   * Draws a circle on the current page
   */
  Circle(x: number, y: number, radius: number, color?: number): void {
    try {
      if (!this._isDocumentStarted) {
        this._startNewDocument();
      }

      const pixelX = this._twipsToPixels(x);
      const pixelY = this._twipsToPixels(y);
      const pixelRadius = this._twipsToPixels(radius);

      // Set line color
      this._context.strokeStyle = this._colorToCSS(color || this.ForeColor);
      this._context.lineWidth = 1;

      // Draw circle
      this._context.beginPath();
      this._context.arc(pixelX, pixelY, pixelRadius, 0, Math.PI * 2);
      this._context.stroke();
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.Circle');
    }
  }

  /**
   * VB6 PSet Method for Printer
   * Sets a pixel on the current page
   */
  PSet(x: number, y: number, color?: number): void {
    try {
      if (!this._isDocumentStarted) {
        this._startNewDocument();
      }

      const pixelX = this._twipsToPixels(x);
      const pixelY = this._twipsToPixels(y);

      // Set pixel color
      this._context.fillStyle = this._colorToCSS(color || this.ForeColor);
      this._context.fillRect(Math.floor(pixelX), Math.floor(pixelY), 1, 1);
    } catch (error) {
      errorHandler.raiseError(482, 'Printer error', 'Printer.PSet');
    }
  }

  /**
   * Scale Method for Printer
   * Sets the coordinate system for the printer
   */
  Scale(x1?: number, y1?: number, x2?: number, y2?: number): void {
    if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
      this.ScaleLeft = x1;
      this.ScaleTop = y1;
      this.ScaleWidth = x2 - x1;
      this.ScaleHeight = y2 - y1;
      this.ScaleMode = 0; // vbUser
    } else {
      // Reset to default scale (twips)
      this.ScaleLeft = 0;
      this.ScaleTop = 0;
      this.ScaleWidth = 12240; // 8.5 inches in twips
      this.ScaleHeight = 15840; // 11 inches in twips
      this.ScaleMode = 1; // vbTwips
    }
  }

  /**
   * TextWidth Method
   * Returns the width of text in current scale units
   */
  TextWidth(text: string): number {
    this._updateCanvasFont();
    const metrics = this._context.measureText(text);
    return this._pixelsToTwips(metrics.width);
  }

  /**
   * TextHeight Method
   * Returns the height of text in current scale units
   */
  TextHeight(text: string): number {
    return this._pixelsToTwips(this.Font.Size * 1.2); // Approximate line height
  }

  private _startNewDocument(): void {
    this._isDocumentStarted = true;
    this.Page = 1;
    this.CurrentX = this.ScaleLeft;
    this.CurrentY = this.ScaleTop;
    this._printContent = [];
    this._setupCanvas();
  }

  private _generatePrintOutput(): void {
    try {
      // Create HTML content for printing
      const htmlContent = this._generateHTML();

      // Open print preview/dialog
      this._showPrintPreview(htmlContent);
    } catch (error) {
      console.error('[VB6 Printer] Error generating print output:', error);
    }
  }

  private _generateHTML(): string {
    const content = this._printContent.join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VB6 Print Job</title>
        <style>
          @page {
            size: ${this.Orientation === VB6PrinterConstants.vbPRORLandscape ? 'landscape' : 'portrait'};
            margin: 0.5in;
          }
          body {
            font-family: ${this.Font.Name};
            font-size: ${this.Font.Size}px;
            font-weight: ${this.Font.Bold ? 'bold' : 'normal'};
            font-style: ${this.Font.Italic ? 'italic' : 'normal'};
            text-decoration: ${this.Font.Underline ? 'underline' : 'none'};
            color: ${this._colorToCSS(this.ForeColor)};
            background-color: ${this._colorToCSS(this.BackColor)};
            white-space: pre-wrap;
            margin: 0;
            padding: 20px;
          }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        ${content.replace(/\n\n/g, '<div class="page-break"></div>')}
      </body>
      </html>
    `;
  }

  private _showPrintPreview(htmlContent: string): void {
    // Create blob with HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in new window for printing
    this._printWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes');

    if (this._printWindow) {
      this._printWindow.onload = () => {
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          if (this._printWindow && !this._printWindow.closed) {
            this._printWindow.print();
          }
        }, 500);
      };
    }

    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  }

  /**
   * Get available printer names (simulated)
   */
  static get Printers(): string[] {
    return ['Default Printer', 'PDF Printer', 'Microsoft Print to PDF', 'Web Browser Printer'];
  }
}

// Global VB6 Printer instance
export const Printer = new VB6Printer();

// VB6 PrintForm function
export function PrintForm(formElement?: HTMLElement): void {
  try {
    if (!formElement) {
      // Try to find the active form
      formElement = document.querySelector('.vb6-form') as HTMLElement;
    }

    if (!formElement) {
      errorHandler.raiseError(482, 'No form to print', 'PrintForm');
      return;
    }

    // Create a new print document
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      errorHandler.raiseError(482, 'Could not open print window', 'PrintForm');
      return;
    }

    // Clone the form for printing
    const formClone = formElement.cloneNode(true) as HTMLElement;

    // Create HTML document for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form Print</title>
        <style>
          @page { margin: 0.5in; }
          body { margin: 0; padding: 20px; }
          .vb6-form { 
            border: 1px solid #000; 
            background: white; 
            position: relative;
          }
        </style>
      </head>
      <body>
        ${formClone.outerHTML}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  } catch (error) {
    errorHandler.raiseError(482, 'Error printing form', 'PrintForm');
  }
}

// Export all printer-related objects and functions
export const VB6PrinterAPI = {
  // Classes
  VB6Printer,
  VB6PrinterFont,

  // Constants
  VB6PrinterConstants,
  VB6FontConstants,

  // Global objects
  Printer,

  // Functions
  PrintForm,
};
