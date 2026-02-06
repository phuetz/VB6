/**
 * VB6 App and Screen Objects Implementation
 * Complete implementation of App and Screen global objects
 */

// App constants
export enum AppConstants {
  vbCompileModeCompiled = 0,
  vbCompileModeInterpreted = 1,
  vbCompileModeDebug = 2,
}

// Screen constants
export enum ScreenConstants {
  vbPixels = 3,
  vbTwips = 1,
  vbPoints = 2,
  vbCharacters = 4,
  vbInches = 5,
  vbMillimeters = 6,
  vbCentimeters = 7,
}

/**
 * VB6 App Object
 * Provides information about the application
 */
export class VB6AppObject {
  private static instance: VB6AppObject;
  private _path: string = '';
  private _exeName: string = 'VB6WebApp';
  private _title: string = 'VB6 Web Application';
  private _major: number = 1;
  private _minor: number = 0;
  private _revision: number = 0;
  private _comments: string = '';
  private _companyName: string = '';
  private _fileDescription: string = '';
  private _legalCopyright: string = '';
  private _legalTrademarks: string = '';
  private _productName: string = 'VB6 Web IDE';
  private _helpFile: string = '';
  private _prevInstance: boolean = false;
  private _startMode: number = 0;
  private _threadID: number = 1;
  private _hInstance: number = (Math.random() * 1000000) | 0;
  private _logMode: number = 0;
  private _logPath: string = '';
  private _nonModalAllowed: boolean = true;
  private _compileMode: AppConstants = AppConstants.vbCompileModeInterpreted;
  private _unattendedApp: boolean = false;
  private _retainedProject: boolean = false;
  private _taskVisible: boolean = true;
  private _oLEServerBusyTimeout: number = 10000;
  private _oLEServerBusyMsgText: string = 'Server Busy';
  private _oLEServerBusyMsgTitle: string = 'OLE Server';
  private _oLERequestPendingTimeout: number = 5000;
  private _oLERequestPendingMsgText: string = 'Request Pending';
  private _oLERequestPendingMsgTitle: string = 'OLE Request';

  private constructor() {
    this.initializeFromEnvironment();
  }

  static getInstance(): VB6AppObject {
    if (!VB6AppObject.instance) {
      VB6AppObject.instance = new VB6AppObject();
    }
    return VB6AppObject.instance;
  }

  // Properties
  get Path(): string {
    if (!this._path && typeof window !== 'undefined') {
      this._path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    }
    return this._path;
  }
  set Path(value: string) {
    this._path = value;
  }

  get EXEName(): string {
    return this._exeName;
  }
  set EXEName(value: string) {
    this._exeName = value;
  }

  get Title(): string {
    return this._title;
  }
  set Title(value: string) {
    this._title = value;
    if (typeof document !== 'undefined') {
      document.title = value;
    }
  }

  get Major(): number {
    return this._major;
  }
  set Major(value: number) {
    this._major = value;
  }

  get Minor(): number {
    return this._minor;
  }
  set Minor(value: number) {
    this._minor = value;
  }

  get Revision(): number {
    return this._revision;
  }
  set Revision(value: number) {
    this._revision = value;
  }

  get Comments(): string {
    return this._comments;
  }
  set Comments(value: string) {
    this._comments = value;
  }

  get CompanyName(): string {
    return this._companyName;
  }
  set CompanyName(value: string) {
    this._companyName = value;
  }

  get FileDescription(): string {
    return this._fileDescription;
  }
  set FileDescription(value: string) {
    this._fileDescription = value;
  }

  get LegalCopyright(): string {
    return this._legalCopyright;
  }
  set LegalCopyright(value: string) {
    this._legalCopyright = value;
  }

  get LegalTrademarks(): string {
    return this._legalTrademarks;
  }
  set LegalTrademarks(value: string) {
    this._legalTrademarks = value;
  }

  get ProductName(): string {
    return this._productName;
  }
  set ProductName(value: string) {
    this._productName = value;
  }

  get HelpFile(): string {
    return this._helpFile;
  }
  set HelpFile(value: string) {
    this._helpFile = value;
  }

  get PrevInstance(): boolean {
    return this._prevInstance;
  }

  get StartMode(): number {
    return this._startMode;
  }

  get ThreadID(): number {
    return this._threadID;
  }

  get hInstance(): number {
    return this._hInstance;
  }

  get LogMode(): number {
    return this._logMode;
  }
  set LogMode(value: number) {
    this._logMode = value;
  }

  get LogPath(): string {
    return this._logPath;
  }
  set LogPath(value: string) {
    this._logPath = value;
  }

  get NonModalAllowed(): boolean {
    return this._nonModalAllowed;
  }
  set NonModalAllowed(value: boolean) {
    this._nonModalAllowed = value;
  }

  get CompileMode(): AppConstants {
    return this._compileMode;
  }

  get UnattendedApp(): boolean {
    return this._unattendedApp;
  }
  set UnattendedApp(value: boolean) {
    this._unattendedApp = value;
  }

  get RetainedProject(): boolean {
    return this._retainedProject;
  }
  set RetainedProject(value: boolean) {
    this._retainedProject = value;
  }

  get TaskVisible(): boolean {
    return this._taskVisible;
  }
  set TaskVisible(value: boolean) {
    this._taskVisible = value;
  }

  get OLEServerBusyTimeout(): number {
    return this._oLEServerBusyTimeout;
  }
  set OLEServerBusyTimeout(value: number) {
    this._oLEServerBusyTimeout = value;
  }

  get OLEServerBusyMsgText(): string {
    return this._oLEServerBusyMsgText;
  }
  set OLEServerBusyMsgText(value: string) {
    this._oLEServerBusyMsgText = value;
  }

  get OLEServerBusyMsgTitle(): string {
    return this._oLEServerBusyMsgTitle;
  }
  set OLEServerBusyMsgTitle(value: string) {
    this._oLEServerBusyMsgTitle = value;
  }

  get OLERequestPendingTimeout(): number {
    return this._oLERequestPendingTimeout;
  }
  set OLERequestPendingTimeout(value: number) {
    this._oLERequestPendingTimeout = value;
  }

  get OLERequestPendingMsgText(): string {
    return this._oLERequestPendingMsgText;
  }
  set OLERequestPendingMsgText(value: string) {
    this._oLERequestPendingMsgText = value;
  }

  get OLERequestPendingMsgTitle(): string {
    return this._oLERequestPendingMsgTitle;
  }
  set OLERequestPendingMsgTitle(value: string) {
    this._oLERequestPendingMsgTitle = value;
  }

  // Methods
  LogEvent(message: string, eventType: number = 0): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${eventType}] ${message}`;

    if (this._logMode > 0) {
      // Store in localStorage if available
      if (typeof localStorage !== 'undefined') {
        const logs = localStorage.getItem('vb6_app_logs') || '';
        localStorage.setItem('vb6_app_logs', logs + '\n' + logEntry);
      }
    }
  }

  StartLogging(): void {
    this._logMode = 1;
    this.LogEvent('Logging started', 0);
  }

  EndLogging(): void {
    this.LogEvent('Logging ended', 0);
    this._logMode = 0;
  }

  // OLE methods
  OleRequestPendingMsgBox(): void {
    if (typeof window !== 'undefined') {
      alert(`${this._oLERequestPendingMsgTitle}\n${this._oLERequestPendingMsgText}`);
    }
  }

  OleServerBusyMsgBox(): void {
    if (typeof window !== 'undefined') {
      alert(`${this._oLEServerBusyMsgTitle}\n${this._oLEServerBusyMsgText}`);
    }
  }

  private initializeFromEnvironment(): void {
    if (typeof window !== 'undefined') {
      // Get path from URL
      this._path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));

      // Check for previous instance (using localStorage)
      if (typeof localStorage !== 'undefined') {
        const instanceFlag = localStorage.getItem('vb6_app_instance');
        if (instanceFlag) {
          this._prevInstance = true;
        } else {
          localStorage.setItem('vb6_app_instance', '1');
          window.addEventListener('beforeunload', () => {
            localStorage.removeItem('vb6_app_instance');
          });
        }
      }

      // Set thread ID from timestamp
      this._threadID = Date.now() & 0xffff;
    }
  }
}

/**
 * VB6 Screen Object
 * Provides information about the display
 */
export class VB6ScreenObject {
  private static instance: VB6ScreenObject;
  private _activeControl: any = null;
  private _activeForm: any = null;
  private _mousePointer: number = 0;
  private _mouseIcon: any = null;
  private _fonts: string[] = [];
  private _fontCount: number = 0;
  private _twipsPerPixelX: number = 15;
  private _twipsPerPixelY: number = 15;

  private constructor() {
    this.initializeFonts();
    this.detectScreenCapabilities();
  }

  static getInstance(): VB6ScreenObject {
    if (!VB6ScreenObject.instance) {
      VB6ScreenObject.instance = new VB6ScreenObject();
    }
    return VB6ScreenObject.instance;
  }

  // Properties
  get ActiveControl(): any {
    return this._activeControl;
  }
  set ActiveControl(value: any) {
    this._activeControl = value;
  }

  get ActiveForm(): any {
    return this._activeForm;
  }
  set ActiveForm(value: any) {
    this._activeForm = value;
  }

  get MousePointer(): number {
    return this._mousePointer;
  }
  set MousePointer(value: number) {
    this._mousePointer = value;
    this.updateCursor(value);
  }

  get MouseIcon(): any {
    return this._mouseIcon;
  }
  set MouseIcon(value: any) {
    this._mouseIcon = value;
    if (this._mousePointer === 99) {
      // Custom cursor
      this.updateCursor(99);
    }
  }

  get Fonts(): string[] {
    return this._fonts;
  }

  get FontCount(): number {
    return this._fontCount;
  }

  get Width(): number {
    if (typeof window !== 'undefined') {
      return window.screen.width * this._twipsPerPixelX;
    }
    return 19200; // Default 1280 pixels
  }

  get Height(): number {
    if (typeof window !== 'undefined') {
      return window.screen.height * this._twipsPerPixelY;
    }
    return 14400; // Default 960 pixels
  }

  get TwipsPerPixelX(): number {
    return this._twipsPerPixelX;
  }

  get TwipsPerPixelY(): number {
    return this._twipsPerPixelY;
  }

  // Get available width/height
  get AvailableWidth(): number {
    if (typeof window !== 'undefined') {
      return window.screen.availWidth * this._twipsPerPixelX;
    }
    return this.Width;
  }

  get AvailableHeight(): number {
    if (typeof window !== 'undefined') {
      return window.screen.availHeight * this._twipsPerPixelY;
    }
    return this.Height;
  }

  // Get color depth
  get ColorDepth(): number {
    if (typeof window !== 'undefined' && window.screen) {
      return window.screen.colorDepth;
    }
    return 32;
  }

  // Get pixel depth
  get PixelDepth(): number {
    if (typeof window !== 'undefined' && window.screen) {
      return window.screen.pixelDepth || window.screen.colorDepth;
    }
    return 32;
  }

  // Get work area (excluding taskbar)
  get WorkAreaWidth(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth * this._twipsPerPixelX;
    }
    return this.AvailableWidth;
  }

  get WorkAreaHeight(): number {
    if (typeof window !== 'undefined') {
      return window.innerHeight * this._twipsPerPixelY;
    }
    return this.AvailableHeight;
  }

  get WorkAreaLeft(): number {
    return 0;
  }

  get WorkAreaTop(): number {
    return 0;
  }

  // Monitor information
  get MonitorCount(): number {
    // In browser, we can't detect multiple monitors reliably
    return 1;
  }

  private updateCursor(pointerType: number): void {
    if (typeof document !== 'undefined') {
      const cursorMap: { [key: number]: string } = {
        0: 'default', // vbDefault
        1: 'pointer', // vbArrow
        2: 'crosshair', // vbCrosshair
        3: 'text', // vbIbeam
        4: 'default', // vbIconPointer
        5: 'move', // vbSizePointer
        6: 'nesw-resize', // vbSizeNESW
        7: 'ns-resize', // vbSizeNS
        8: 'nwse-resize', // vbSizeNWSE
        9: 'ew-resize', // vbSizeWE
        10: 'not-allowed', // vbUpArrow
        11: 'wait', // vbHourglass
        12: 'not-allowed', // vbNoDrop
        13: 'help', // vbArrowHourglass
        14: 'help', // vbArrowQuestion
        15: 'move', // vbSizeAll
        99: 'auto', // vbCustom
      };

      document.body.style.cursor = cursorMap[pointerType] || 'default';

      if (pointerType === 99 && this._mouseIcon) {
        // Custom cursor
        if (typeof this._mouseIcon === 'string') {
          document.body.style.cursor = `url(${this._mouseIcon}), auto`;
        }
      }
    }
  }

  private initializeFonts(): void {
    // Common web fonts
    this._fonts = [
      'Arial',
      'Arial Black',
      'Arial Narrow',
      'Book Antiqua',
      'Bookman Old Style',
      'Calibri',
      'Cambria',
      'Cambria Math',
      'Century',
      'Century Gothic',
      'Century Schoolbook',
      'Comic Sans MS',
      'Consolas',
      'Courier',
      'Courier New',
      'Garamond',
      'Georgia',
      'Helvetica',
      'Impact',
      'Lucida Bright',
      'Lucida Calligraphy',
      'Lucida Console',
      'Lucida Fax',
      'Lucida Handwriting',
      'Lucida Sans',
      'Lucida Sans Typewriter',
      'Lucida Sans Unicode',
      'Microsoft Sans Serif',
      'Monotype Corsiva',
      'MS Gothic',
      'MS Outlook',
      'MS PGothic',
      'MS Reference Sans Serif',
      'MS Sans Serif',
      'MS Serif',
      'Palatino Linotype',
      'Segoe Print',
      'Segoe Script',
      'Segoe UI',
      'Segoe UI Light',
      'Segoe UI Semibold',
      'Segoe UI Symbol',
      'Tahoma',
      'Times',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'Wingdings',
      'Wingdings 2',
      'Wingdings 3',
    ];

    this._fontCount = this._fonts.length;

    // Try to detect available fonts
    if (typeof document !== 'undefined') {
      this.detectFonts();
    }
  }

  private detectFonts(): void {
    // Font detection using canvas
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getWidth = (fontFamily: string): number => {
      ctx.font = `${testSize} ${fontFamily}`;
      return ctx.measureText(testString).width;
    };

    const baseWidths = baseFonts.map(getWidth);

    // Test additional fonts
    const testFonts = [
      'Andale Mono',
      'Arial Unicode MS',
      'Batang',
      'Bitstream Vera Sans Mono',
      'Candara',
      'Franklin Gothic Medium',
      'Helvetica Neue',
      'Inconsolata',
      'Liberation Mono',
      'Liberation Sans',
      'Menlo',
      'Monaco',
      'Roboto',
      'Source Code Pro',
      'Ubuntu',
      'Ubuntu Mono',
    ];

    testFonts.forEach(font => {
      const detected = baseFonts.some((baseFont, index) => {
        const width = getWidth(`'${font}', ${baseFont}`);
        return width !== baseWidths[index];
      });

      if (detected && !this._fonts.includes(font)) {
        this._fonts.push(font);
      }
    });

    // Sort alphabetically
    this._fonts.sort();
    this._fontCount = this._fonts.length;
  }

  private detectScreenCapabilities(): void {
    if (typeof window !== 'undefined') {
      // Try to detect DPI
      const testDiv = document.createElement('div');
      testDiv.style.width = '1in';
      testDiv.style.height = '1in';
      testDiv.style.position = 'absolute';
      testDiv.style.left = '-9999px';
      document.body.appendChild(testDiv);

      const dpiX = testDiv.offsetWidth;
      const dpiY = testDiv.offsetHeight;

      document.body.removeChild(testDiv);

      // Calculate twips per pixel (1 inch = 1440 twips)
      if (dpiX > 0) {
        this._twipsPerPixelX = 1440 / dpiX;
      }
      if (dpiY > 0) {
        this._twipsPerPixelY = 1440 / dpiY;
      }
    }
  }
}

// Global instances
export const App = VB6AppObject.getInstance();
export const Screen = VB6ScreenObject.getInstance();

// Add to window object for VB6 compatibility
if (typeof window !== 'undefined') {
  (window as any).App = App;
  (window as any).Screen = Screen;
}

// Export all
export const VB6AppScreen = {
  VB6AppObject,
  VB6ScreenObject,
  App,
  Screen,
  AppConstants,
  ScreenConstants,
};
