/**
 * VB6 Global Objects
 * App, Screen, Printer, Clipboard, Forms, and other global objects
 */

/**
 * App Object - Application information
 */
export class VB6App {
  // Product information
  Title: string = 'VB6 Application';
  EXEName: string = 'Project1';
  Path: string = '/';
  ProductName: string = 'VB6 IDE Clone';
  CompanyName: string = '';
  FileDescription: string = '';
  LegalCopyright: string = '';
  LegalTrademarks: string = '';
  Comments: string = '';

  // Version information
  Major: number = 1;
  Minor: number = 0;
  Revision: number = 0;

  // Runtime information
  PrevInstance: boolean = false;
  TaskVisible: boolean = true;
  ThreadID: number = 0;
  hInstance: number = 0;

  // Paths
  HelpFile: string = '';
  LogPath: string = '/logs';

  // State
  UnattendedApp: boolean = false;
  StartLogging: (logPath: string, mode: number) => void = () => {};
  LogEvent: (message: string, type: number) => void = msg => {
    console.log('[VB6 Log]:', msg);
  };

  /**
   * Start logging
   */
  StartLogging(logPath: string, mode: number = 0): void {
    console.log('Logging started:', logPath);
  }

  /**
   * Log an event
   */
  LogEvent(message: string, type: number = 0): void {
    console.log(`[VB6 Event ${type}]:`, message);
  }
}

/**
 * Screen Object - Screen and mouse information
 */
export class VB6Screen {
  // Screen dimensions (in twips, 1440 twips = 1 inch)
  Width: number = window.screen.width * 15; // Convert pixels to twips
  Height: number = window.screen.height * 15;

  // Available working area (excluding taskbar)
  TwipsPerPixelX: number = 15;
  TwipsPerPixelY: number = 15;

  // Mouse position (in twips)
  private _mouseX: number = 0;
  private _mouseY: number = 0;

  // Active control and form
  ActiveControl: any = null;
  ActiveForm: any = null;

  // Mouse pointer
  MousePointer: number = 0; // 0=Default
  MouseIcon: any = null;

  // Fonts collection
  Fonts: VB6FontsCollection = new VB6FontsCollection();

  constructor() {
    // Track mouse position
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', e => {
        this._mouseX = e.clientX * this.TwipsPerPixelX;
        this._mouseY = e.clientY * this.TwipsPerPixelY;
      });
    }
  }

  get MouseX(): number {
    return this._mouseX;
  }

  get MouseY(): number {
    return this._mouseY;
  }
}

/**
 * Fonts Collection
 */
export class VB6FontsCollection {
  private fonts: string[] = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'MS Sans Serif',
    'MS Serif',
    'Tahoma',
    'Verdana',
    'Georgia',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
  ];

  get Count(): number {
    return this.fonts.length;
  }

  Item(index: number | string): string {
    if (typeof index === 'number') {
      return this.fonts[index] || '';
    }
    return this.fonts.find(f => f.toLowerCase() === index.toLowerCase()) || '';
  }

  /**
   * Check if font exists
   */
  Exists(fontName: string): boolean {
    return this.fonts.some(f => f.toLowerCase() === fontName.toLowerCase());
  }
}

/**
 * Forms Collection
 */
export class VB6FormsCollection {
  private forms: any[] = [];

  get Count(): number {
    return this.forms.length;
  }

  Item(index: number | string): any {
    if (typeof index === 'number') {
      return this.forms[index];
    }
    return this.forms.find(f => f.Name === index);
  }

  /**
   * Add a form to the collection
   */
  Add(form: any): void {
    if (!this.forms.includes(form)) {
      this.forms.push(form);
    }
  }

  /**
   * Remove a form from the collection
   */
  Remove(form: any): void {
    const index = this.forms.indexOf(form);
    if (index >= 0) {
      this.forms.splice(index, 1);
    }
  }

  /**
   * Iterate through forms
   */
  *[Symbol.iterator]() {
    for (const form of this.forms) {
      yield form;
    }
  }
}

/**
 * Printer Object - Printing support
 */
export class VB6Printer {
  // Printer properties
  DeviceName: string = 'Default Printer';
  DriverName: string = 'WINSPOOL';
  Port: string = 'LPT1:';

  // Page settings
  Orientation: number = 1; // 1=Portrait, 2=Landscape
  PaperSize: number = 1; // Letter
  PaperBin: number = 7; // Auto
  Duplex: number = 1; // Simplex

  Copies: number = 1;
  ColorMode: number = 2; // Color
  PrintQuality: number = -4; // High

  // Margins (in twips)
  ScaleMode: number = 1; // Twips
  ScaleLeft: number = 0;
  ScaleTop: number = 0;
  ScaleWidth: number = 12240; // 8.5 inches
  ScaleHeight: number = 15840; // 11 inches

  // Current position
  CurrentX: number = 0;
  CurrentY: number = 0;

  // Font
  Font: any = {
    Name: 'Arial',
    Size: 10,
    Bold: false,
    Italic: false,
    Underline: false,
  };

  // Drawing properties
  ForeColor: number = 0x000000; // Black
  DrawWidth: number = 1;

  // Page tracking
  Page: number = 0;

  // Print buffer
  private printBuffer: string[] = [];

  /**
   * Start a new page
   */
  NewPage(): void {
    this.Page++;
    this.CurrentX = 0;
    this.CurrentY = 0;
    this.printBuffer.push('<!-- New Page -->');
  }

  /**
   * Print text
   */
  Print(text: string): void {
    this.printBuffer.push(text);
    this.CurrentY += 200; // Line height in twips
  }

  /**
   * End document and send to printer
   */
  EndDoc(): void {
    const content = this.printBuffer.join('\n');

    // In browser, open print dialog
    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print</title>
              <style>
                body { font-family: ${this.Font.Name}; font-size: ${this.Font.Size}pt; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <pre>${content}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }

    // Reset
    this.printBuffer = [];
    this.Page = 0;
    this.CurrentX = 0;
    this.CurrentY = 0;
  }

  /**
   * Kill print job
   */
  KillDoc(): void {
    this.printBuffer = [];
    this.Page = 0;
    this.CurrentX = 0;
    this.CurrentY = 0;
  }

  /**
   * Draw line
   */
  Line(x1: number, y1: number, x2: number, y2: number): void {
    this.printBuffer.push(`<!-- Line from (${x1},${y1}) to (${x2},${y2}) -->`);
    this.CurrentX = x2;
    this.CurrentY = y2;
  }

  /**
   * Draw circle
   */
  Circle(x: number, y: number, radius: number): void {
    this.printBuffer.push(`<!-- Circle at (${x},${y}) radius ${radius} -->`);
    this.CurrentX = x;
    this.CurrentY = y;
  }
}

/**
 * Printers Collection
 */
export class VB6PrintersCollection {
  private printers: VB6Printer[] = [new VB6Printer()];

  get Count(): number {
    return this.printers.length;
  }

  Item(index: number): VB6Printer {
    return this.printers[index] || this.printers[0];
  }
}

/**
 * Debug Object - Debug output
 */
export class VB6Debug {
  /**
   * Print to debug output
   */
  static Print(value: any): void {
    console.log('[VB6 Debug]:', value);
  }

  /**
   * Assert a condition
   */
  static Assert(condition: boolean): void {
    if (!condition) {
      console.error('[VB6 Debug] Assertion failed');
      // Break in debugger if developer tools are open
      if (typeof window !== 'undefined' && window.console) {
        console.trace('Assertion failed');
      }
    }
  }
}

/**
 * Err Object - Error handling
 */
export class VB6Err {
  Number: number = 0;
  Description: string = '';
  Source: string = '';
  HelpFile: string = '';
  HelpContext: number = 0;
  LastDllError: number = 0;

  /**
   * Raise an error
   */
  Raise(
    number: number,
    source?: string,
    description?: string,
    helpFile?: string,
    helpContext?: number
  ): void {
    this.Number = number;
    this.Source = source || '';
    this.Description = description || `Error ${number}`;
    this.HelpFile = helpFile || '';
    this.HelpContext = helpContext || 0;

    throw new Error(`[VB6 Error ${number}] ${this.Description}`);
  }

  /**
   * Clear error
   */
  Clear(): void {
    this.Number = 0;
    this.Description = '';
    this.Source = '';
    this.HelpFile = '';
    this.HelpContext = 0;
    this.LastDllError = 0;
  }
}

/**
 * Global instances
 */
export const App = new VB6App();
export const Screen = new VB6Screen();
export const Printer = new VB6Printer();
export const Printers = new VB6PrintersCollection();
export const Forms = new VB6FormsCollection();
export const Debug = VB6Debug;
export const Err = new VB6Err();

/**
 * Export all global objects
 */
export default {
  App,
  Screen,
  Printer,
  Printers,
  Forms,
  Debug,
  Err,
  VB6App,
  VB6Screen,
  VB6Printer,
  VB6PrintersCollection,
  VB6FormsCollection,
  VB6FontsCollection,
  VB6Debug,
  VB6Err,
};
