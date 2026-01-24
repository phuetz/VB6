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

// TYPE SAFETY FIX: Define interfaces for VB6 runtime objects
export interface VB6ControlBase {
  Name: string;
  Index?: number;
  Visible?: boolean;
  Enabled?: boolean;
  Left?: number;
  Top?: number;
  Width?: number;
  Height?: number;
  SetFocus?: () => void;
}

export interface VB6FormBase {
  Name: string;
  Caption?: string;
  Visible?: boolean;
  WindowState?: number;
  Show?: (modal?: number) => void;
  Hide?: () => void;
  Unload?: () => void;
  Controls?: VB6ControlBase[];
}

export type VB6Variant = string | number | boolean | null | undefined | Date | object | unknown[];

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
  private _activeControl: VB6ControlBase | null = null;
  private _activeForm: VB6FormBase | null = null;
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

  get ActiveControl(): VB6ControlBase | null {
    return this._activeControl;
  }

  set ActiveControl(value: VB6ControlBase | null) {
    const oldControl = this._activeControl;
    this._activeControl = value;
    this.emit('ActiveControlChanged', { oldControl, newControl: value });
  }

  get ActiveForm(): VB6FormBase | null {
    return this._activeForm;
  }

  set ActiveForm(value: VB6FormBase | null) {
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

  public VarType(varname: VB6Variant): VbVarType {
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

  /**
   * VB6 Like operator for pattern matching
   * Supports: * (any chars), ? (single char), # (digit), [charlist], [!charlist]
   */
  public like(inputString: string, pattern: string): boolean {
    if (inputString === null || inputString === undefined) inputString = '';
    if (pattern === null || pattern === undefined) pattern = '';

    const str = String(inputString);
    const pat = String(pattern);

    // Convert VB6 Like pattern to RegExp
    let regexPattern = pat
      .replace(/\\/g, '\\\\')
      .replace(/\./g, '\\.')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\+/g, '\\+')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\*/g, '.*')      // * matches any number of characters
      .replace(/\?/g, '.')        // ? matches any single character
      .replace(/#/g, '[0-9]');    // # matches any single digit

    // Handle [!charlist] - matches any character NOT in the list
    regexPattern = regexPattern.replace(/\[!/g, '[^');

    try {
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(str);
    } catch (e) {
      // Invalid pattern - return false
      return false;
    }
  }

  /**
   * Print to file for Print # statement
   */
  public printToFile(fileNumber: number, ...items: any[]): void {
    // Format items and log to console (or write to virtual file system)
    const output = items.map(item => String(item)).join('');
    console.log(`[File #${fileNumber}] ${output}`);
  }

  /**
   * LSet - left-aligns string in fixed-length field
   */
  public lset(target: string, value: string): string {
    const targetLen = target?.length || 0;
    if (targetLen === 0) return value;
    const val = String(value);
    if (val.length >= targetLen) {
      return val.substring(0, targetLen);
    }
    return val + ' '.repeat(targetLen - val.length);
  }

  /**
   * RSet - right-aligns string in fixed-length field
   */
  public rset(target: string, value: string): string {
    const targetLen = target?.length || 0;
    if (targetLen === 0) return value;
    const val = String(value);
    if (val.length >= targetLen) {
      return val.substring(0, targetLen);
    }
    return ' '.repeat(targetLen - val.length) + val;
  }

  // Simple in-memory file system for VB6 file operations
  private files: Map<number, { content: string; position: number; mode: string }> = new Map();

  /**
   * Open file
   */
  public open(fileName: string, fileNumber: number, mode: string = 'Input', access?: string, lock?: string): void {
    this.files.set(fileNumber, {
      content: '',
      position: 0,
      mode: mode
    });
    console.log(`[VB6] Opened file "${fileName}" as #${fileNumber} (${mode})`);
  }

  /**
   * Close specific files
   */
  public close(...fileNumbers: number[]): void {
    for (const num of fileNumbers) {
      if (this.files.has(num)) {
        this.files.delete(num);
        console.log(`[VB6] Closed file #${num}`);
      }
    }
  }

  /**
   * Close all files
   */
  public closeAll(): void {
    this.files.clear();
    console.log('[VB6] Closed all files');
  }

  /**
   * Line Input - reads a line from file
   */
  public lineInput(fileNumber: number): string {
    const file = this.files.get(fileNumber);
    if (!file) return '';

    const remaining = file.content.substring(file.position);
    const newlineIndex = remaining.indexOf('\n');
    if (newlineIndex === -1) {
      file.position = file.content.length;
      return remaining;
    }

    const line = remaining.substring(0, newlineIndex);
    file.position += newlineIndex + 1;
    return line.replace(/\r$/, '');
  }

  /**
   * Input - reads comma-separated values from file
   */
  public input(fileNumber: number, count: number = 1): any[] {
    const file = this.files.get(fileNumber);
    if (!file) return [];

    const remaining = file.content.substring(file.position);
    const results: any[] = [];

    let pos = 0;
    for (let i = 0; i < count; i++) {
      // Skip whitespace
      while (pos < remaining.length && /\s/.test(remaining[pos])) pos++;

      if (pos >= remaining.length) {
        results.push('');
        continue;
      }

      // Read quoted string or value until comma/newline
      if (remaining[pos] === '"') {
        pos++;
        let value = '';
        while (pos < remaining.length && remaining[pos] !== '"') {
          value += remaining[pos++];
        }
        pos++; // Skip closing quote
        results.push(value);
      } else {
        let value = '';
        while (pos < remaining.length && remaining[pos] !== ',' && remaining[pos] !== '\n') {
          value += remaining[pos++];
        }
        results.push(value.trim());
      }

      // Skip comma
      if (pos < remaining.length && remaining[pos] === ',') pos++;
    }

    file.position += pos;
    return results;
  }

  /**
   * Write - writes data to file with quotes around strings
   */
  public write(fileNumber: number, ...items: any[]): void {
    const file = this.files.get(fileNumber);
    if (!file) return;

    const formatted = items.map(item => {
      if (typeof item === 'string') return `"${item}"`;
      return String(item);
    }).join(',');

    file.content += formatted + '\n';
  }

  /**
   * Seek - sets file position
   */
  public seek(fileNumber: number, position: number): void {
    const file = this.files.get(fileNumber);
    if (file) {
      file.position = position - 1; // VB6 positions are 1-based
    }
  }

  /**
   * Get - reads record from random-access file
   */
  public get(fileNumber: number, recordNumber?: number): any {
    const file = this.files.get(fileNumber);
    if (!file) return null;

    // Simplified - just return remaining content
    const remaining = file.content.substring(file.position);
    return remaining;
  }

  /**
   * Put - writes record to random-access file
   */
  public put(fileNumber: number, recordNumber: number | undefined, data: any): void {
    const file = this.files.get(fileNumber);
    if (!file) return;

    file.content += String(data);
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

  // ============================================================
  // VB6 Array Functions - Multi-dimensional array support
  // ============================================================

  /**
   * Create 1D array with custom bounds (supports VB6 "Dim arr(1 To 10)")
   * Returns an array with __lbound and __ubound metadata
   */
  public createArray(lowerBound: number, upperBound: number, defaultFactory: () => any): any[] {
    const size = upperBound - lowerBound + 1;
    const arr: any[] = new Array(size).fill(null).map(() => defaultFactory());
    // Store bounds metadata on array
    (arr as any).__lbound = lowerBound;
    (arr as any).__ubound = upperBound;
    return arr;
  }

  /**
   * Create multi-dimensional array with bounds
   * VB6: Dim arr(1 To 5, 1 To 10, 0 To 3)
   * bounds = [[1, 5], [1, 10], [0, 3]]
   */
  public createMultiArray(bounds: [number, number][], defaultFactory: () => any): any {
    if (bounds.length === 0) return [];

    const createDimension = (dimIndex: number): any => {
      const [lower, upper] = bounds[dimIndex];
      const size = upper - lower + 1;

      if (dimIndex === bounds.length - 1) {
        // Innermost dimension
        const arr = new Array(size).fill(null).map(() => defaultFactory());
        (arr as any).__lbound = lower;
        (arr as any).__ubound = upper;
        return arr;
      }

      // Create nested arrays
      const arr: any[] = new Array(size).fill(null).map(() => createDimension(dimIndex + 1));
      (arr as any).__lbound = lower;
      (arr as any).__ubound = upper;
      return arr;
    };

    const result = createDimension(0);
    (result as any).__bounds = bounds;
    (result as any).__dimensions = bounds.length;
    return result;
  }

  /**
   * ReDim Preserve for multi-dimensional arrays
   * In VB6, only the last dimension can be resized with Preserve
   */
  public reDimPreserve(oldArray: any[], newSizes: number[], defaultFactory: () => any): any[] {
    if (!oldArray || newSizes.length === 0) {
      return this.createNestedArray(newSizes, 0, defaultFactory);
    }

    if (newSizes.length === 1) {
      // Simple 1D case
      const newSize = newSizes[0] + 1;
      const newArr = new Array(newSize).fill(null).map((_, i) =>
        i < oldArray.length ? oldArray[i] : defaultFactory()
      );
      // Preserve bounds if they exist
      if ((oldArray as any).__lbound !== undefined) {
        (newArr as any).__lbound = (oldArray as any).__lbound;
      }
      (newArr as any).__ubound = newSizes[0];
      return newArr;
    }

    // Multi-dimensional: Only resize last dimension (VB6 rule)
    const copyDimension = (oldArr: any[], sizes: number[], dimIndex: number): any[] => {
      const newSize = sizes[dimIndex] + 1;

      if (dimIndex === sizes.length - 1) {
        // Last dimension - resize it
        return new Array(newSize).fill(null).map((_, i) =>
          oldArr && i < oldArr.length ? oldArr[i] : defaultFactory()
        );
      }

      // Not last dimension - copy structure
      return new Array(newSize).fill(null).map((_, i) => {
        if (oldArr && i < oldArr.length) {
          return copyDimension(oldArr[i], sizes, dimIndex + 1);
        }
        return this.createNestedArray(sizes.slice(dimIndex + 1), 0, defaultFactory);
      });
    };

    return copyDimension(oldArray, newSizes, 0);
  }

  /**
   * Create nested array without bounds (simple multi-dimensional)
   */
  private createNestedArray(sizes: number[], dimIndex: number, defaultFactory: () => any): any[] {
    const size = sizes[dimIndex] + 1;
    if (dimIndex === sizes.length - 1) {
      return new Array(size).fill(null).map(() => defaultFactory());
    }
    return new Array(size).fill(null).map(() =>
      this.createNestedArray(sizes, dimIndex + 1, defaultFactory)
    );
  }

  /**
   * LBound - Get lower bound of array dimension
   * VB6: LBound(arr) or LBound(arr, 2) for multi-dimensional
   */
  public lbound(arr: any, dimension: number = 1): number {
    if (!arr || !Array.isArray(arr)) return 0;

    if (dimension === 1) {
      return (arr as any).__lbound ?? 0;
    }

    // Navigate to the specified dimension
    let current: any = arr;
    for (let i = 1; i < dimension; i++) {
      if (Array.isArray(current) && current.length > 0) {
        current = current[0];
      } else {
        return 0;
      }
    }

    return (current as any)?.__lbound ?? 0;
  }

  /**
   * UBound - Get upper bound of array dimension
   * VB6: UBound(arr) or UBound(arr, 2) for multi-dimensional
   */
  public ubound(arr: any, dimension: number = 1): number {
    if (!arr || !Array.isArray(arr)) return -1;

    if (dimension === 1) {
      if ((arr as any).__ubound !== undefined) {
        return (arr as any).__ubound;
      }
      return arr.length - 1;
    }

    // Navigate to the specified dimension
    let current: any = arr;
    for (let i = 1; i < dimension; i++) {
      if (Array.isArray(current) && current.length > 0) {
        current = current[0];
      } else {
        return -1;
      }
    }

    if ((current as any)?.__ubound !== undefined) {
      return (current as any).__ubound;
    }
    return Array.isArray(current) ? current.length - 1 : -1;
  }

  /**
   * Array function - Create array from arguments
   * VB6: arr = Array(1, 2, 3, 4, 5)
   */
  public array(...items: any[]): any[] {
    const arr = [...items];
    (arr as any).__lbound = 0;
    (arr as any).__ubound = items.length - 1;
    return arr;
  }

  /**
   * IsArray - Check if variable is an array
   */
  public isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Split - Split string into array
   * VB6: arr = Split(str, ",")
   */
  public split(expression: string, delimiter: string = ' ', limit: number = -1): string[] {
    if (expression === null || expression === undefined) return [];
    const str = String(expression);
    const arr = limit === -1 ? str.split(delimiter) : str.split(delimiter, limit);
    (arr as any).__lbound = 0;
    (arr as any).__ubound = arr.length - 1;
    return arr;
  }

  /**
   * Join - Join array into string
   * VB6: str = Join(arr, ",")
   */
  public join(sourceArray: any[], delimiter: string = ' '): string {
    if (!Array.isArray(sourceArray)) return '';
    return sourceArray.join(delimiter);
  }

  /**
   * Filter - Filter array elements
   * VB6: arr = Filter(sourceArray, match, include)
   */
  public filter(sourceArray: string[], match: string, include: boolean = true, compare: number = 0): string[] {
    if (!Array.isArray(sourceArray)) return [];

    const result = sourceArray.filter(item => {
      const itemStr = String(item);
      const matchStr = String(match);
      const found = compare === 0
        ? itemStr.includes(matchStr)  // Binary (case-sensitive)
        : itemStr.toLowerCase().includes(matchStr.toLowerCase());  // Text (case-insensitive)
      return include ? found : !found;
    });

    (result as any).__lbound = 0;
    (result as any).__ubound = result.length - 1;
    return result;
  }

  // ============================================================
  // VB6 Type Checking Functions
  // ============================================================

  /**
   * TypeOf...Is - Check if object is of a specific type
   * VB6: If TypeOf obj Is Form Then
   */
  public isTypeOf(obj: any, typeName: string): boolean {
    if (obj === null || obj === undefined) return false;

    const typeNameLower = typeName.toLowerCase();

    // Check common VB6 types
    switch (typeNameLower) {
      case 'object':
        return typeof obj === 'object' && obj !== null;
      case 'nothing':
        return obj === null || obj === undefined;
      case 'string':
        return typeof obj === 'string';
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'number':
        return typeof obj === 'number';
      case 'boolean':
        return typeof obj === 'boolean';
      case 'date':
        return obj instanceof Date;
      case 'array':
        return Array.isArray(obj);
      case 'collection':
        return obj && typeof obj.Add === 'function' && typeof obj.Item === 'function';
      case 'dictionary':
        return obj && typeof obj.Add === 'function' && typeof obj.Exists === 'function';
    }

    // Check constructor name
    if (obj.constructor?.name === typeName) return true;

    // Check prototype chain
    if (typeof obj === 'object' && obj !== null) {
      // Check __implements array for interface checking
      if (obj.__implements && Array.isArray(obj.__implements)) {
        if (obj.__implements.includes(typeName)) return true;
      }

      // Check if object has implements method
      if (typeof obj.implements === 'function') {
        return obj.implements(typeName);
      }

      // Check instanceof for class types
      try {
        const constructor = (globalThis as any)[typeName];
        if (constructor && obj instanceof constructor) return true;
      } catch {
        // Constructor not found
      }
    }

    return false;
  }

  // ============================================================
  // VB6 Debug Functions
  // ============================================================

  /**
   * Debug.Print - Output to debug window (console)
   */
  public debugPrint(...args: any[]): void {
    const output = args.map(arg => {
      if (arg === null) return 'Null';
      if (arg === undefined) return 'Empty';
      if (typeof arg === 'boolean') return arg ? 'True' : 'False';
      if (arg instanceof Date) return this.formatDateForDebug(arg);
      return String(arg);
    }).join(' ');

    console.log(`[Debug] ${output}`);
  }

  /**
   * Debug.Assert - Assert condition (throws if false in debug mode)
   */
  public debugAssert(condition: boolean, message?: string): void {
    if (!condition) {
      const assertMsg = message || 'Debug.Assert failed';
      console.error(`[Debug.Assert] ${assertMsg}`);

      // In debug mode, we could break or throw
      // For now, log to console and optionally throw
      if (this.debugMode) {
        throw new Error(`Assertion failed: ${assertMsg}`);
      }
    }
  }

  /**
   * Format date for debug output
   */
  private formatDateForDebug(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return `${month}/${day}/${year} ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Debug mode flag
  private debugMode: boolean = false;

  /**
   * Enable/disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get debug mode status
   */
  public getDebugMode(): boolean {
    return this.debugMode;
  }

  // ============================================================
  // VB6 Windows API Call Support
  // ============================================================

  /**
   * Generic API call wrapper for unmapped Declare statements
   */
  public apiCall(lib: string, func: string, args: any[]): any {
    console.warn(`[VB6 API] Unmapped API call: ${lib}.${func}(${args.join(', ')})`);
    return 0;
  }

  /**
   * Get system metric (SM_* constants)
   */
  public getSystemMetric(index: number): number {
    switch (index) {
      case 0:  // SM_CXSCREEN
        return window.screen.width;
      case 1:  // SM_CYSCREEN
        return window.screen.height;
      case 2:  // SM_CXVSCROLL
        return 17;
      case 3:  // SM_CYHSCROLL
        return 17;
      case 4:  // SM_CYCAPTION
        return 23;
      case 5:  // SM_CXBORDER
        return 1;
      case 6:  // SM_CYBORDER
        return 1;
      case 16: // SM_CXFULLSCREEN
        return window.innerWidth;
      case 17: // SM_CYFULLSCREEN
        return window.innerHeight;
      case 28: // SM_CXMIN
        return 112;
      case 29: // SM_CYMIN
        return 27;
      case 32: // SM_CXMINTRACK
        return 136;
      case 33: // SM_CYMINTRACK
        return 27;
      default:
        return 0;
    }
  }

  /**
   * Play a beep sound
   */
  public beep(frequency: number = 440, duration: number = 200): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, duration);
    } catch (e) {
      console.log('[VB6] Beep');
    }
  }

  /**
   * Play a sound file
   */
  public playSound(soundFile: string): void {
    try {
      const audio = new Audio(soundFile);
      audio.play();
    } catch (e) {
      console.log(`[VB6] PlaySound: ${soundFile}`);
    }
  }

  /**
   * MCI send string (multimedia control)
   */
  public mciSendString(command: string): number {
    console.log(`[VB6 MCI] ${command}`);
    return 0;
  }

  // ============================================================
  // VB6 Advanced Date Functions
  // ============================================================

  /**
   * DateAdd - Add interval to date
   * VB6: DateAdd("m", 3, #1/1/2024#)
   */
  public dateAdd(interval: string, number: number, date: Date): Date {
    const result = new Date(date);
    const intervalLower = interval.toLowerCase();

    switch (intervalLower) {
      case 'yyyy': // Year
        result.setFullYear(result.getFullYear() + number);
        break;
      case 'q':    // Quarter
        result.setMonth(result.getMonth() + (number * 3));
        break;
      case 'm':    // Month
        result.setMonth(result.getMonth() + number);
        break;
      case 'y':    // Day of year
      case 'd':    // Day
      case 'w':    // Weekday
        result.setDate(result.getDate() + number);
        break;
      case 'ww':   // Week
        result.setDate(result.getDate() + (number * 7));
        break;
      case 'h':    // Hour
        result.setHours(result.getHours() + number);
        break;
      case 'n':    // Minute
        result.setMinutes(result.getMinutes() + number);
        break;
      case 's':    // Second
        result.setSeconds(result.getSeconds() + number);
        break;
    }

    return result;
  }

  /**
   * DateDiff - Get difference between dates
   * VB6: DateDiff("d", date1, date2)
   */
  public dateDiff(interval: string, date1: Date, date2: Date, firstDayOfWeek: number = 1, firstWeekOfYear: number = 1): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    const diff = d2 - d1;
    const intervalLower = interval.toLowerCase();

    switch (intervalLower) {
      case 'yyyy': // Year
        return new Date(date2).getFullYear() - new Date(date1).getFullYear();
      case 'q':    // Quarter
        const q1 = Math.floor(new Date(date1).getMonth() / 3);
        const q2 = Math.floor(new Date(date2).getMonth() / 3);
        const yearDiff = new Date(date2).getFullYear() - new Date(date1).getFullYear();
        return (yearDiff * 4) + (q2 - q1);
      case 'm':    // Month
        const months1 = new Date(date1).getFullYear() * 12 + new Date(date1).getMonth();
        const months2 = new Date(date2).getFullYear() * 12 + new Date(date2).getMonth();
        return months2 - months1;
      case 'y':    // Day of year
      case 'd':    // Day
      case 'w':    // Weekday
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      case 'ww':   // Week
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      case 'h':    // Hour
        return Math.floor(diff / (1000 * 60 * 60));
      case 'n':    // Minute
        return Math.floor(diff / (1000 * 60));
      case 's':    // Second
        return Math.floor(diff / 1000);
      default:
        return 0;
    }
  }

  /**
   * DatePart - Get part of date
   * VB6: DatePart("m", date)
   */
  public datePart(interval: string, date: Date, firstDayOfWeek: number = 1, firstWeekOfYear: number = 1): number {
    const d = new Date(date);
    const intervalLower = interval.toLowerCase();

    switch (intervalLower) {
      case 'yyyy': // Year
        return d.getFullYear();
      case 'q':    // Quarter
        return Math.floor(d.getMonth() / 3) + 1;
      case 'm':    // Month
        return d.getMonth() + 1;
      case 'y':    // Day of year
        const start = new Date(d.getFullYear(), 0, 0);
        const diff = d.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      case 'd':    // Day
        return d.getDate();
      case 'w':    // Weekday (1 = Sunday in VB6 default)
        return d.getDay() + 1;
      case 'ww':   // Week of year
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
      case 'h':    // Hour
        return d.getHours();
      case 'n':    // Minute
        return d.getMinutes();
      case 's':    // Second
        return d.getSeconds();
      default:
        return 0;
    }
  }

  /**
   * DateSerial - Create date from year, month, day
   */
  public dateSerial(year: number, month: number, day: number): Date {
    // VB6 months are 1-based, JavaScript months are 0-based
    return new Date(year, month - 1, day);
  }

  /**
   * TimeSerial - Create time from hour, minute, second
   */
  public timeSerial(hour: number, minute: number, second: number): Date {
    const d = new Date();
    d.setHours(hour, minute, second, 0);
    return d;
  }

  /**
   * DateValue - Extract date from date/time
   */
  public dateValue(date: Date | string): Date {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /**
   * TimeValue - Extract time from date/time (returns Date with time only)
   */
  public timeValue(date: Date | string): Date {
    const d = new Date(date);
    const result = new Date(1899, 11, 30); // VB6 base date
    result.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    return result;
  }

  /**
   * IsDate - Check if value can be converted to date
   */
  public isDate(expression: any): boolean {
    if (expression instanceof Date) return !isNaN(expression.getTime());
    if (typeof expression === 'string') {
      const d = new Date(expression);
      return !isNaN(d.getTime());
    }
    return false;
  }

  /**
   * MonthName - Get name of month
   */
  public monthName(month: number, abbreviate: boolean = false): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const abbrev = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (month < 1 || month > 12) return '';
    return abbreviate ? abbrev[month - 1] : months[month - 1];
  }

  /**
   * WeekdayName - Get name of weekday
   */
  public weekdayName(weekday: number, abbreviate: boolean = false, firstDayOfWeek: number = 1): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const abbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Adjust for firstDayOfWeek (1 = Sunday, 2 = Monday, etc.)
    const adjustedIndex = (weekday - 1 + (firstDayOfWeek - 1)) % 7;
    if (adjustedIndex < 0 || adjustedIndex > 6) return '';
    return abbreviate ? abbrev[adjustedIndex] : days[adjustedIndex];
  }

  /**
   * Timer - Seconds since midnight
   */
  public timer(): number {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
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