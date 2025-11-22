/**
 * VB6 Runtime - Complete VB6 Runtime Environment
 * Provides Collection, App, Screen, and other essential VB6 runtime objects
 */

import { EventEmitter } from 'events';
import { VB6Collection, VB6Dictionary, CreateCollection, CreateDictionary, CreateCollectionObject } from './VB6CollectionObjects';
import { VB6AdvancedErrorHandler, Err, OnErrorGoTo, OnErrorResumeNext, OnErrorGoToZero, Resume, ResumeNext } from './VB6AdvancedErrorHandling';
import { VB6AdvancedStringFunctions } from './VB6AdvancedStringFunctions';
import { VB6FileSystemAPI } from './VB6FileSystem';
import { VB6DatabaseObjects } from './VB6DatabaseObjects';
import { VB6GraphicsAPI } from './VB6GraphicsAPI';
import { VB6PrinterAPI } from './VB6PrinterObject';

// VB6 Runtime Constants
export enum VbAppWinStyle {
  vbHide = 0,
  vbNormalFocus = 1,
  vbMinimizedFocus = 2,
  vbMaximizedFocus = 3,
  vbNormalNoFocus = 4,
  vbMinimizedNoFocus = 6
}

export enum VbTriState {
  vbUseDefault = -2,
  vbTrue = -1,
  vbFalse = 0
}

export enum VbVarType {
  vbEmpty = 0,
  vbNull = 1,
  vbInteger = 2,
  vbLong = 3,
  vbSingle = 4,
  vbDouble = 5,
  vbCurrency = 6,
  vbDate = 7,
  vbString = 8,
  vbObject = 9,
  vbError = 10,
  vbBoolean = 11,
  vbVariant = 12,
  vbDataObject = 13,
  vbDecimal = 14,
  vbByte = 17,
  vbUserDefinedType = 36,
  vbArray = 8192
}

export enum VbMsgBoxStyle {
  vbOKOnly = 0,
  vbOKCancel = 1,
  vbAbortRetryIgnore = 2,
  vbYesNoCancel = 3,
  vbYesNo = 4,
  vbRetryCancel = 5,
  vbCritical = 16,
  vbQuestion = 32,
  vbExclamation = 48,
  vbInformation = 64,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  vbDefaultButton1 = 0,
  vbDefaultButton2 = 256,
  vbDefaultButton3 = 512,
  vbDefaultButton4 = 768,
  vbApplicationModal = vbDefaultButton1, // Same value as vbDefaultButton1
  vbSystemModal = 4096,
  vbMsgBoxHelpButton = 16384,
  vbMsgBoxSetForeground = 65536,
  vbMsgBoxRight = 524288,
  vbMsgBoxRtlReading = 1048576
}

export enum VbMsgBoxResult {
  vbOK = 1,
  vbCancel = 2,
  vbAbort = 3,
  vbRetry = 4,
  vbIgnore = 5,
  vbYes = 6,
  vbNo = 7
}

// VB6 Collection is now imported from VB6CollectionObjects.ts

// VB6 App Object
export class VB6App extends EventEmitter {
  private _title: string = 'VB6 Studio Application';
  private _productName: string = 'VB6 Studio';
  private _companyName: string = 'VB6 Studio';
  private _fileDescription: string = 'VB6 Studio Application';
  private _legalCopyright: string = '© 2024 VB6 Studio';
  private _legalTrademarks: string = '';
  private _productVersion: string = '1.0.0';
  private _fileVersion: string = '1.0.0.0';
  private _revision: number = 0;
  private _major: number = 1;
  private _minor: number = 0;
  private _helpFile: string = '';
  private _exeName: string = 'VB6Studio.exe';
  private _path: string = '/';
  private _startMode: number = 0;
  private _taskVisible: boolean = true;
  private _threadID: number = 1;
  private _hInstance: number = 0x400000;
  private _prevInstance: number = 0;
  private _logMode: number = 0;
  private _logPath: string = '';
  private _comments: string = '';

  constructor() {
    super();
    
    // Initialize from browser environment
    if (typeof document !== 'undefined') {
      this._title = document.title || this._title;
      this._path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) || '/';
    }
  }

  // Properties
  get Title(): string { return this._title; }
  set Title(value: string) { 
    this._title = value;
    if (typeof document !== 'undefined') {
      document.title = value;
    }
  }

  get ProductName(): string { return this._productName; }
  get CompanyName(): string { return this._companyName; }
  get FileDescription(): string { return this._fileDescription; }
  get LegalCopyright(): string { return this._legalCopyright; }
  get LegalTrademarks(): string { return this._legalTrademarks; }
  get ProductVersion(): string { return this._productVersion; }
  get FileVersion(): string { return this._fileVersion; }
  get Revision(): number { return this._revision; }
  get Major(): number { return this._major; }
  get Minor(): number { return this._minor; }
  get HelpFile(): string { return this._helpFile; }
  set HelpFile(value: string) { this._helpFile = value; }
  get EXEName(): string { return this._exeName; }
  get Path(): string { return this._path; }
  get StartMode(): number { return this._startMode; }
  get TaskVisible(): boolean { return this._taskVisible; }
  set TaskVisible(value: boolean) { this._taskVisible = value; }
  get ThreadID(): number { return this._threadID; }
  get hInstance(): number { return this._hInstance; }
  get PrevInstance(): number { return this._prevInstance; }
  get LogMode(): number { return this._logMode; }
  set LogMode(value: number) { this._logMode = value; }
  get LogPath(): string { return this._logPath; }
  set LogPath(value: string) { this._logPath = value; }
  get Comments(): string { return this._comments; }

  // Methods
  StartLogging(logTarget: string, logMode: number): void {
    this._logPath = logTarget;
    this._logMode = logMode;
    console.log(`Logging started: ${logTarget}, mode: ${logMode}`);
  }

  StopLogging(): void {
    this._logMode = 0;
    this._logPath = '';
    console.log('Logging stopped');
  }

  LogEvent(logText: string, eventType: number = 0): void {
    if (this._logMode > 0) {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${logText}`;
      console.log(logEntry);
      
      // In a real implementation, this would write to the log file
      // For browser environment, we use console and localStorage
      try {
        const existingLog = localStorage.getItem('VB6_APP_LOG') || '';
        localStorage.setItem('VB6_APP_LOG', existingLog + logEntry + '\n');
      } catch {
        // Handle storage quota exceeded
      }
    }
  }

  GetFormat(formatExpression: any, format: string = ''): string {
    // VB6 Format function equivalent
    if (formatExpression instanceof Date) {
      return this.formatDate(formatExpression, format);
    } else if (typeof formatExpression === 'number') {
      return this.formatNumber(formatExpression, format);
    } else {
      return formatExpression.toString();
    }
  }

  private formatDate(date: Date, format: string): string {
    if (!format) {
      return date.toString();
    }

    // VB6 date format patterns
    const patterns: { [key: string]: string } = {
      'General Date': date.toString(),
      'Long Date': date.toDateString(),
      'Medium Date': date.toLocaleDateString(),
      'Short Date': date.toLocaleDateString(),
      'Long Time': date.toTimeString(),
      'Medium Time': date.toLocaleTimeString(),
      'Short Time': date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    return patterns[format] || date.toString();
  }

  private formatNumber(number: number, format: string): string {
    if (!format) {
      return number.toString();
    }

    // VB6 number format patterns
    const patterns: { [key: string]: string } = {
      'General Number': number.toString(),
      'Currency': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number),
      'Fixed': number.toFixed(2),
      'Standard': number.toLocaleString(),
      'Percent': (number * 100).toFixed(2) + '%',
      'Scientific': number.toExponential(),
      'Yes/No': number !== 0 ? 'Yes' : 'No',
      'True/False': number !== 0 ? 'True' : 'False',
      'On/Off': number !== 0 ? 'On' : 'Off'
    };

    return patterns[format] || number.toString();
  }
}

// VB6 Screen Object
export class VB6Screen extends EventEmitter {
  private _activeControl: any = null;
  private _activeForm: any = null;
  private _mousePointer: number = 0;
  private _mouseIcon: string = '';
  // EVENT HANDLING BUG FIX: Track window listeners for cleanup
  private windowListeners: Map<string, EventListener> = new Map();

  constructor() {
    super();
    
    // EVENT HANDLING BUG FIX: Track window listeners for cleanup
    this.windowListeners = new Map();
    
    // Listen for window focus changes with cleanup tracking
    if (typeof window !== 'undefined') {
      const focusHandler = () => this.emit('GotFocus');
      const blurHandler = () => this.emit('LostFocus');
      
      window.addEventListener('focus', focusHandler);
      window.addEventListener('blur', blurHandler);
      
      // Track for cleanup
      this.windowListeners.set('focus', focusHandler);
      this.windowListeners.set('blur', blurHandler);
    }
  }

  // Properties
  get Width(): number {
    return typeof window !== 'undefined' ? window.screen.width * 15 : 12000; // Convert to twips (1 pixel = 15 twips)
  }

  get Height(): number {
    return typeof window !== 'undefined' ? window.screen.height * 15 : 9000; // Convert to twips
  }

  get TwipsPerPixelX(): number {
    return 15; // VB6 standard
  }

  get TwipsPerPixelY(): number {
    return 15; // VB6 standard
  }

  get ActiveControl(): any {
    return this._activeControl;
  }

  set ActiveControl(value: any) {
    const oldControl = this._activeControl;
    this._activeControl = value;
    this.emit('ActiveControlChanged', { oldControl, newControl: value });
  }

  get ActiveForm(): any {
    return this._activeForm;
  }

  set ActiveForm(value: any) {
    const oldForm = this._activeForm;
    this._activeForm = value;
    this.emit('ActiveFormChanged', { oldForm, newForm: value });
  }

  get MousePointer(): number {
    return this._mousePointer;
  }

  set MousePointer(value: number) {
    this._mousePointer = value;
    this.updateCursor(value);
  }

  get MouseIcon(): string {
    return this._mouseIcon;
  }

  set MouseIcon(value: string) {
    this._mouseIcon = value;
    if (value && typeof document !== 'undefined') {
      // CSS INJECTION BUG FIX: Validate cursor URL
      if (this.isValidCursorURL(value)) {
        document.body.style.cursor = `url(${value}), auto`;
      } else {
        console.warn(`Invalid cursor URL rejected: ${value}`);
        document.body.style.cursor = 'auto';
      }
    }
  }

  /**
   * CSS INJECTION BUG FIX: Validate cursor URLs
   */
  private isValidCursorURL(url: string): boolean {
    if (typeof url !== 'string' || url.length === 0) return false;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Only allow safe protocols
      if (!['http:', 'https:', 'blob:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Check for common cursor file extensions
      const validExtensions = ['.cur', '.ico', '.png', '.gif', '.jpg', '.jpeg', '.svg'];
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        return false;
      }
      
      // Basic length check
      if (url.length > 500) {
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }

  get FontCount(): number {
    // Limited in browser environment
    return 100; // Approximate
  }

  get Fonts(): string[] {
    // Return common web-safe fonts
    return [
      'Arial',
      'Arial Black',
      'Comic Sans MS',
      'Courier New',
      'Georgia',
      'Impact',
      'Lucida Console',
      'Lucida Sans Unicode',
      'Palatino Linotype',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'MS Sans Serif',
      'MS Serif'
    ];
  }

  // Methods
  private updateCursor(pointer: number): void {
    if (typeof document === 'undefined') return;

    const cursors = [
      'default',      // 0 - vbDefault
      'default',      // 1 - vbArrow
      'crosshair',    // 2 - vbCrosshair
      'text',         // 3 - vbIbeam
      'default',      // 4 - vbIcon (no direct equivalent)
      'move',         // 5 - vbSizePointer
      'ns-resize',    // 6 - vbSizeNS
      'ew-resize',    // 7 - vbSizeWE
      'nw-resize',    // 8 - vbSizeNWSE
      'ne-resize',    // 9 - vbSizeNESW
      'move',         // 10 - vbSizeAll
      'not-allowed',  // 11 - vbUpArrow
      'default',      // 12 - vbHourglass (no direct equivalent)
      'not-allowed',  // 13 - vbNoDrop
      'default',      // 14 - vbArrowHourglass (no direct equivalent)
      'default',      // 15 - vbArrowQuestion (no direct equivalent)
      'auto'          // 99 - vbCustom
    ];

    document.body.style.cursor = cursors[pointer] || 'default';
  }

  // Convert between coordinate systems
  TwipsToPixelsX(twips: number): number {
    return Math.round(twips / this.TwipsPerPixelX);
  }

  TwipsToPixelsY(twips: number): number {
    return Math.round(twips / this.TwipsPerPixelY);
  }

  PixelsToTwipsX(pixels: number): number {
    return pixels * this.TwipsPerPixelX;
  }

  PixelsToTwipsY(pixels: number): number {
    return pixels * this.TwipsPerPixelY;
  }
}

// VB6 Printer Object
export class VB6Printer extends EventEmitter {
  private _deviceName: string;
  private _driverName: string;
  private _port: string;
  private _orientation: number = 1; // Portrait
  private _paperBin: number = 1;
  private _paperSize: number = 1;
  private _printQuality: number = -3; // High
  private _copies: number = 1;
  private _colorMode: number = 2; // Color
  private _duplex: number = 1; // Simplex
  private _fontSize: number = 12;
  private _fontName: string = 'Arial';
  private _fontBold: boolean = false;
  private _fontItalic: boolean = false;
  private _fontUnderline: boolean = false;
  private _scaleMode: number = 1; // Twips
  private _width: number = 12240; // 8.5" in twips
  private _height: number = 15840; // 11" in twips
  private _currentX: number = 0;
  private _currentY: number = 0;

  constructor(deviceName: string = 'Default Printer', driverName: string = 'winspool', port: string = 'LPT1:') {
    super();
    this._deviceName = deviceName;
    this._driverName = driverName;
    this._port = port;
  }

  // Properties
  get DeviceName(): string { return this._deviceName; }
  get DriverName(): string { return this._driverName; }
  get Port(): string { return this._port; }
  get Orientation(): number { return this._orientation; }
  set Orientation(value: number) { this._orientation = value; }
  get PaperBin(): number { return this._paperBin; }
  set PaperBin(value: number) { this._paperBin = value; }
  get PaperSize(): number { return this._paperSize; }
  set PaperSize(value: number) { this._paperSize = value; }
  get PrintQuality(): number { return this._printQuality; }
  set PrintQuality(value: number) { this._printQuality = value; }
  get Copies(): number { return this._copies; }
  set Copies(value: number) { this._copies = value; }
  get ColorMode(): number { return this._colorMode; }
  set ColorMode(value: number) { this._colorMode = value; }
  get Duplex(): number { return this._duplex; }
  set Duplex(value: number) { this._duplex = value; }
  get FontSize(): number { return this._fontSize; }
  set FontSize(value: number) { this._fontSize = value; }
  get FontName(): string { return this._fontName; }
  set FontName(value: string) { this._fontName = value; }
  get FontBold(): boolean { return this._fontBold; }
  set FontBold(value: boolean) { this._fontBold = value; }
  get FontItalic(): boolean { return this._fontItalic; }
  set FontItalic(value: boolean) { this._fontItalic = value; }
  get FontUnderline(): boolean { return this._fontUnderline; }
  set FontUnderline(value: boolean) { this._fontUnderline = value; }
  get ScaleMode(): number { return this._scaleMode; }
  set ScaleMode(value: number) { this._scaleMode = value; }
  get Width(): number { return this._width; }
  get Height(): number { return this._height; }
  get CurrentX(): number { return this._currentX; }
  set CurrentX(value: number) { this._currentX = value; }
  get CurrentY(): number { return this._currentY; }
  set CurrentY(value: number) { this._currentY = value; }

  // Methods
  Print(text: string): void {
    // In browser environment, use the browser's print functionality
    const printContent = `
      <html>
        <head><title>Print Output</title></head>
        <body style="font-family: ${this._fontName}; font-size: ${this._fontSize}pt; 
                     font-weight: ${this._fontBold ? 'bold' : 'normal'};
                     font-style: ${this._fontItalic ? 'italic' : 'normal'};
                     text-decoration: ${this._fontUnderline ? 'underline' : 'none'};">
          <pre>${text}</pre>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    // Update current position (simplified)
    this._currentY += this._fontSize * 15; // Approximate line height in twips
    this.emit('Print', { text });
  }

  NewPage(): void {
    this._currentX = 0;
    this._currentY = 0;
    this.emit('NewPage');
  }

  EndDoc(): void {
    this.emit('EndDoc');
  }

  KillDoc(): void {
    this.emit('KillDoc');
  }

  Circle(x: number, y: number, radius: number, color?: number, start?: number, end?: number, aspect?: number): void {
    // Drawing method (would need canvas implementation)
    this.emit('Circle', { x, y, radius, color, start, end, aspect });
  }

  Line(x1: number, y1: number, x2: number, y2: number, color?: number): void {
    // Drawing method (would need canvas implementation)
    this.emit('Line', { x1, y1, x2, y2, color });
  }

  PSet(x: number, y: number, color?: number): void {
    // Drawing method (would need canvas implementation)
    this.emit('PSet', { x, y, color });
  }
}

// VB6 Printers Collection
export class VB6Printers extends VB6Collection {
  constructor() {
    super();
    
    // Add default printer
    this.Add(new VB6Printer('Default Printer', 'winspool', 'LPT1:'), 'Default');
    
    // Add simulated printers
    this.Add(new VB6Printer('Microsoft Print to PDF', 'winspool', 'PORTPROMPT:'), 'PDF');
    this.Add(new VB6Printer('Microsoft XPS Document Writer', 'winspool', 'PORTPROMPT:'), 'XPS');
  }

  get Default(): VB6Printer {
    return this.Item('Default');
  }
}

// VB6 Forms Collection
export class VB6Forms extends VB6Collection {
  constructor() {
    super();
  }

  // Override Add to handle form-specific logic
  Add(form: any, key?: string | number): void {
    super.Add(form, key);
    
    // Auto-show form if visible property is true
    if (form.Visible) {
      form.Show();
    }
  }

  // VB6-specific methods
  Unload(form: any): void {
    // Find and remove the form
    for (let i = 1; i <= this.Count; i++) {
      if (this.Item(i) === form) {
        this.Remove(i);
        break;
      }
    }
    
    // Call form's unload
    if (typeof form.Unload === 'function') {
      form.Unload();
    }
  }
}

// Main VB6 Runtime Environment
export class VB6Runtime {
  private static _instance: VB6Runtime;
  public readonly App: VB6App;
  public readonly Screen: VB6Screen;
  public readonly Printers: VB6Printers;
  public readonly Forms: VB6Forms;
  public readonly Clipboard: any; // Will be implemented separately
  public readonly ErrorHandler: VB6AdvancedErrorHandler;
  public readonly Err: typeof Err;
  // EVENT HANDLING BUG FIX: Track window listeners for cleanup
  private windowListeners: Map<string, EventListener> = new Map();

  private constructor() {
    // ULTRA-THINK FIX: Initialize all critical properties first
    this.windowListeners = new Map();
    
    this.App = new VB6App();
    this.Screen = new VB6Screen();
    this.Printers = new VB6Printers();
    this.Forms = new VB6Forms();
    this.ErrorHandler = VB6AdvancedErrorHandler.getInstance();
    this.Err = Err;
    
    // Initialize runtime environment
    this.initializeRuntime();
  }

  public static getInstance(): VB6Runtime {
    if (!VB6Runtime._instance) {
      VB6Runtime._instance = new VB6Runtime();
    }
    return VB6Runtime._instance;
  }

  private initializeRuntime(): void {
    // Set up global error handling
    if (typeof window !== 'undefined') {
      // EVENT HANDLING BUG FIX: Track error listeners for cleanup
      const errorHandler = (event: ErrorEvent) => {
        this.App.LogEvent(`Runtime Error: ${event.error?.message || event.message}`, 1);
      };
      const rejectionHandler = (event: PromiseRejectionEvent) => {
        this.App.LogEvent(`Unhandled Promise Rejection: ${event.reason}`, 1);
      };

      window.addEventListener('error', errorHandler);
      window.addEventListener('unhandledrejection', rejectionHandler);
      
      // Track for cleanup - ensure windowListeners is initialized
      if (!this.windowListeners) {
        this.windowListeners = new Map();
      }
      this.windowListeners.set('error', errorHandler as EventListener);
      this.windowListeners.set('unhandledrejection', rejectionHandler as EventListener);
    }

    // Initialize performance monitoring
    this.startPerformanceMonitoring();
  }

  private startPerformanceMonitoring(): void {
    // Monitor memory usage (if available)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.App.LogEvent('Warning: High memory usage detected', 2);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // VB6 Global Functions
  public MsgBox(
    prompt: string,
    buttons: VbMsgBoxStyle = VbMsgBoxStyle.vbOKOnly,
    title: string = ''
  ): VbMsgBoxResult {
    const finalTitle = title || this.App.Title;

    if (buttons & VbMsgBoxStyle.vbOKCancel) {
      return confirm(`${finalTitle}\n\n${prompt}`) ? VbMsgBoxResult.vbOK : VbMsgBoxResult.vbCancel;
    } else if (buttons & VbMsgBoxStyle.vbYesNoCancel) {
      const result = prompt(`${finalTitle}\n\n${prompt}\n\nEnter 'yes', 'no', or 'cancel':`);
      switch (result?.toLowerCase()) {
        case 'yes': return VbMsgBoxResult.vbYes;
        case 'no': return VbMsgBoxResult.vbNo;
        default: return VbMsgBoxResult.vbCancel;
      }
    } else if (buttons & VbMsgBoxStyle.vbYesNo) {
      return confirm(`${finalTitle}\n\n${prompt}`) ? VbMsgBoxResult.vbYes : VbMsgBoxResult.vbNo;
    } else {
      alert(`${finalTitle}\n\n${prompt}`);
      return VbMsgBoxResult.vbOK;
    }
  }

  public InputBox(
    prompt: string,
    title: string = '',
    defaultResponse: string = '',
    xPos?: number,
    yPos?: number,
    helpFile?: string,
    context?: number
  ): string {
    const finalTitle = title || this.App.Title;
    const result = window.prompt(`${finalTitle}\n\n${prompt}`, defaultResponse);
    return result || '';
  }

  public Shell(
    pathname: string,
    windowStyle: VbAppWinStyle = VbAppWinStyle.vbNormalFocus
  ): number {
    // Use browser capabilities to open URLs
    if (pathname.startsWith('http') || pathname.startsWith('mailto:')) {
      window.open(pathname, '_blank');
      return Math.floor(Math.random() * 10000) + 1000; // Return simulated process ID
    }
    
    // For other commands, log and return 0
    this.App.LogEvent(`Shell command not supported in browser: ${pathname}`, 2);
    return 0;
  }

  public CreateObject(className: string): any {
    // Check for Collection and Dictionary objects first
    const collectionObject = CreateCollectionObject(className);
    if (collectionObject) {
      console.log(`[VB6 Runtime] Created ${className} object`);
      return collectionObject;
    }

    // Limited object creation in browser environment for other objects
    this.App.LogEvent(`CreateObject not fully supported in browser: ${className}`, 2);
    
    // Return mock object for common VB6 objects
    const mockObjects: { [key: string]: any } = {
      'Excel.Application': { Visible: false, Workbooks: { Add: () => ({}) } },
      'Word.Application': { Visible: false, Documents: { Add: () => ({}) } },
      'Scripting.FileSystemObject': {
        GetFile: () => ({}),
        GetFolder: () => ({}),
        CreateTextFile: () => ({ WriteLine: () => {}, Close: () => {} })
      },
      'WScript.Shell': {
        Run: (cmd: string) => this.Shell(cmd),
        RegRead: () => '',
        RegWrite: () => {}
      }
    };

    return mockObjects[className] || {};
  }

  public GetObject(pathname: string, className?: string): any {
    // Limited GetObject support in browser
    this.App.LogEvent(`GetObject not fully supported in browser: ${pathname}`, 2);
    return {};
  }

  public VarType(varname: any): VbVarType {
    if (varname === null) return VbVarType.vbNull;
    if (varname === undefined) return VbVarType.vbEmpty;
    if (typeof varname === 'boolean') return VbVarType.vbBoolean;
    if (typeof varname === 'number') {
      if (Number.isInteger(varname)) {
        return varname >= -32768 && varname <= 32767 ? VbVarType.vbInteger : VbVarType.vbLong;
      }
      return VbVarType.vbDouble;
    }
    if (typeof varname === 'string') return VbVarType.vbString;
    if (varname instanceof Date) return VbVarType.vbDate;
    if (typeof varname === 'object') return VbVarType.vbObject;
    if (Array.isArray(varname)) return VbVarType.vbArray;
    return VbVarType.vbVariant;
  }

  public IsEmpty(expression: any): boolean {
    return expression === undefined;
  }

  public IsNull(expression: any): boolean {
    return expression === null;
  }

  public IsNumeric(expression: any): boolean {
    return !isNaN(parseFloat(expression)) && isFinite(expression);
  }

  public IsObject(expression: any): boolean {
    return typeof expression === 'object' && expression !== null;
  }

  public TypeName(varname: any): string {
    const typeNames = {
      [VbVarType.vbEmpty]: 'Empty',
      [VbVarType.vbNull]: 'Null',
      [VbVarType.vbInteger]: 'Integer',
      [VbVarType.vbLong]: 'Long',
      [VbVarType.vbSingle]: 'Single',
      [VbVarType.vbDouble]: 'Double',
      [VbVarType.vbCurrency]: 'Currency',
      [VbVarType.vbDate]: 'Date',
      [VbVarType.vbString]: 'String',
      [VbVarType.vbObject]: 'Object',
      [VbVarType.vbBoolean]: 'Boolean',
      [VbVarType.vbVariant]: 'Variant',
      [VbVarType.vbArray]: 'Array'
    };

    return typeNames[this.VarType(varname)] || 'Unknown';
  }

  /**
   * EVENT HANDLING BUG FIX: Cleanup method to remove all window listeners
   * Call this when the VB6Screen instance is no longer needed
   */
  public dispose(): void {
    // Remove all tracked window listeners
    if (typeof window !== 'undefined') {
      this.windowListeners.forEach((handler, eventType) => {
        window.removeEventListener(eventType, handler);
      });
    }
    
    // Clear the listeners map
    this.windowListeners.clear();
    
    // Remove all EventEmitter listeners
    this.removeAllListeners();
  }
}

// Export the singleton instance
export const VB6 = VB6Runtime.getInstance();

// Export individual utility functions and error handler (classes are already exported inline)
export {
  CreateCollection,
  CreateDictionary,
  VB6AdvancedErrorHandler,
  Err,
  OnErrorGoTo,
  OnErrorResumeNext,
  OnErrorGoToZero,
  Resume,
  ResumeNext
};

// Export all advanced APIs
export * from './VB6AdvancedStringFunctions';
export * from './VB6FileSystem';
export * from './VB6DatabaseObjects';
export * from './VB6GraphicsAPI';
export * from './VB6PrinterObject';

// Export constants (commented out to check for conflicts)
// export {
//   VbAppWinStyle,
//   VbTriState,
//   VbVarType,
//   VbMsgBoxStyle,
//   VbMsgBoxResult
// };

// Export singleton instance for compatibility
export const vb6Runtime = VB6Runtime.getInstance();

export default VB6Runtime;