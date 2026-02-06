/**
 * ActiveX Control Wrapper for WebAssembly
 *
 * Provides JavaScript implementations of common ActiveX controls
 * that can be accessed through the WebAssembly bridge
 */

import { createActiveXBridge, ActiveXWebAssemblyBridge } from './ActiveXWebAssemblyBridge';

/**
 * DOM CLOBBERING BUG FIX: Property pollution protection for ActiveX objects
 */
class PropertyPollutionProtection {
  private static readonly DANGEROUS_PROPERTIES = [
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'eval',
    'Function',
    'Object',
    'Array',
    'String',
    'Number',
    'document',
    'window',
    'global',
    'process',
    'require',
  ];

  private static readonly SAFE_PROPERTY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  /**
   * DOM CLOBBERING BUG FIX: Validate property names to prevent pollution
   */
  static validatePropertyName(name: string): boolean {
    if (typeof name !== 'string') return false;
    if (this.DANGEROUS_PROPERTIES.includes(name)) return false;
    if (!this.SAFE_PROPERTY_PATTERN.test(name)) return false;
    return true;
  }

  /**
   * DOM CLOBBERING BUG FIX: Safely set object property
   */
  static safeSetProperty(obj: any, key: string, value: any): boolean {
    if (!this.validatePropertyName(key)) {
      console.warn(`Unsafe property access blocked: ${key}`);
      return false;
    }

    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn(`Prototype pollution attempt blocked: ${key}`);
      return false;
    }

    try {
      // Use Object.defineProperty for safer assignment
      Object.defineProperty(obj, key, {
        value: value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return true;
    } catch (error) {
      console.warn(`Property assignment failed: ${key}`, error);
      return false;
    }
  }

  /**
   * DOM CLOBBERING BUG FIX: Create safe object without prototype pollution
   */
  static createSafeObject(): Record<string, any> {
    return Object.create(null); // No prototype
  }

  /**
   * DOM CLOBBERING BUG FIX: Validate and sanitize property values
   */
  static sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Remove dangerous patterns
      return value
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on[a-z]+\s*=/gi, '');
    }

    if (typeof value === 'function') {
      console.warn('Function values blocked for security');
      return null;
    }

    if (value && typeof value === 'object') {
      // Recursively sanitize objects
      const sanitized = this.createSafeObject();
      for (const [k, v] of Object.entries(value)) {
        if (this.validatePropertyName(k)) {
          sanitized[k] = this.sanitizeValue(v);
        }
      }
      return sanitized;
    }

    return value;
  }
}

// Base class for all ActiveX control wrappers
export abstract class ActiveXControl {
  protected _visible: boolean = true;
  protected _enabled: boolean = true;
  protected _left: number = 0;
  protected _top: number = 0;
  protected _width: number = 100;
  protected _height: number = 100;
  protected _name: string = '';
  protected _tag: any = null;
  protected _tabIndex: number = 0;
  protected _tabStop: boolean = true;
  protected _toolTipText: string = '';
  protected _hwnd: number = 0;
  protected _container: any = null;

  // Events
  protected eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();

  private static nextHwnd = 1;

  constructor(name: string) {
    this._name = name;
    // Use sequential IDs to avoid collisions
    this._hwnd = ActiveXControl.nextHwnd++;
    if (ActiveXControl.nextHwnd > 0xffffffff) {
      ActiveXControl.nextHwnd = 1; // Wrap around
    }
  }

  // IUnknown methods
  QueryInterface(riid: string): any {
    return this;
  }

  AddRef(): number {
    return 1;
  }

  Release(): number {
    return 1;
  }

  // Common properties
  get Visible(): boolean {
    return this._visible;
  }
  set Visible(value: boolean) {
    this._visible = value;
    this.fireEvent('VisibleChanged');
  }

  get Enabled(): boolean {
    return this._enabled;
  }
  set Enabled(value: boolean) {
    this._enabled = value;
    this.fireEvent('EnabledChanged');
  }

  get Left(): number {
    return this._left;
  }
  set Left(value: number) {
    this._left = value;
    this.fireEvent('Move');
  }

  get Top(): number {
    return this._top;
  }
  set Top(value: number) {
    this._top = value;
    this.fireEvent('Move');
  }

  get Width(): number {
    return this._width;
  }
  set Width(value: number) {
    this._width = value;
    this.fireEvent('Resize');
  }

  get Height(): number {
    return this._height;
  }
  set Height(value: number) {
    this._height = value;
    this.fireEvent('Resize');
  }

  get Name(): string {
    return this._name;
  }
  set Name(value: string) {
    // DOM CLOBBERING BUG FIX: Sanitize name to prevent pollution
    const sanitizedValue = PropertyPollutionProtection.sanitizeValue(value);
    if (
      typeof sanitizedValue === 'string' &&
      PropertyPollutionProtection.validatePropertyName(sanitizedValue)
    ) {
      this._name = sanitizedValue;
    } else {
      console.warn('Invalid name blocked:', value);
    }
  }

  get hWnd(): number {
    return this._hwnd;
  }

  get Container(): any {
    return this._container;
  }
  set Container(value: any) {
    // DOM CLOBBERING BUG FIX: Sanitize container object
    this._container = PropertyPollutionProtection.sanitizeValue(value);
  }

  // Common methods
  Move(left?: number, top?: number, width?: number, height?: number): void {
    if (left !== undefined) this._left = left;
    if (top !== undefined) this._top = top;
    if (width !== undefined) this._width = width;
    if (height !== undefined) this._height = height;
    this.fireEvent('Move');
    if (width !== undefined || height !== undefined) {
      this.fireEvent('Resize');
    }
  }

  Refresh(): void {
    this.fireEvent('Paint');
  }

  SetFocus(): void {
    this.fireEvent('GotFocus');
  }

  // Event handling
  addEventListener(eventName: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  removeEventListener(eventName: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  protected fireEvent(eventName: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  // Cleanup method to prevent memory leaks
  destroy(): void {
    // Clear all event handlers
    this.eventHandlers.clear();

    // Clear references
    this._container = null;
    this._tag = null;
  }
}

/**
 * Microsoft FlexGrid Control (MSFlexGrid)
 */
export class MSFlexGrid extends ActiveXControl {
  private _rows: number = 2;
  private _cols: number = 2;
  private _fixedRows: number = 1;
  private _fixedCols: number = 1;
  private _row: number = 1;
  private _col: number = 1;
  private _rowSel: number = 1;
  private _colSel: number = 1;
  private _cellData: string[][] = [];
  private _colWidths: number[] = [];
  private _rowHeights: number[] = [];
  private _backColor: string = '#FFFFFF';
  private _foreColor: string = '#000000';
  private _backColorFixed: string = '#C0C0C0';
  private _foreColorFixed: string = '#000000';
  private _gridColor: string = '#C0C0C0';
  private _gridColorFixed: string = '#000000';
  private _cellBackColor: string = '#FFFFFF';
  private _cellForeColor: string = '#000000';
  private _allowBigSelection: boolean = true;
  private _allowUserResizing: number = 0;
  private _fillStyle: number = 0;
  private _gridLines: number = 1;
  private _gridLinesFixed: number = 2;
  private _scrollBars: number = 3;
  private _selectionMode: number = 0;
  private _text: string = '';
  private _textMatrix: Map<string, string> = new Map();

  constructor(name: string = 'MSFlexGrid1') {
    super(name);
    this.initializeGrid();
  }

  private initializeGrid(): void {
    // Initialize cell data
    for (let r = 0; r < this._rows; r++) {
      this._cellData[r] = [];
      for (let c = 0; c < this._cols; c++) {
        this._cellData[r][c] = '';
      }
    }

    // Initialize column widths
    for (let c = 0; c < this._cols; c++) {
      this._colWidths[c] = 1440; // Default width in twips
    }

    // Initialize row heights
    for (let r = 0; r < this._rows; r++) {
      this._rowHeights[r] = 240; // Default height in twips
    }
  }

  // Properties
  get Rows(): number {
    return this._rows;
  }
  set Rows(value: number) {
    if (value < 0) value = 0;
    this._rows = value;
    this.initializeGrid();
    this.fireEvent('RowColChange');
  }

  get Cols(): number {
    return this._cols;
  }
  set Cols(value: number) {
    if (value < 0) value = 0;
    this._cols = value;
    this.initializeGrid();
    this.fireEvent('RowColChange');
  }

  get FixedRows(): number {
    return this._fixedRows;
  }
  set FixedRows(value: number) {
    if (value < 0) value = 0;
    if (value > this._rows) value = this._rows;
    this._fixedRows = value;
  }

  get FixedCols(): number {
    return this._fixedCols;
  }
  set FixedCols(value: number) {
    if (value < 0) value = 0;
    if (value > this._cols) value = this._cols;
    this._fixedCols = value;
  }

  get Row(): number {
    return this._row;
  }
  set Row(value: number) {
    if (value >= 0 && value < this._rows) {
      this._row = value;
      this.updateText();
      this.fireEvent('RowColChange');
    }
  }

  get Col(): number {
    return this._col;
  }
  set Col(value: number) {
    if (value >= 0 && value < this._cols) {
      this._col = value;
      this.updateText();
      this.fireEvent('RowColChange');
    }
  }

  get RowSel(): number {
    return this._rowSel;
  }
  set RowSel(value: number) {
    if (value >= 0 && value < this._rows) {
      this._rowSel = value;
      this.fireEvent('SelChange');
    }
  }

  get ColSel(): number {
    return this._colSel;
  }
  set ColSel(value: number) {
    if (value >= 0 && value < this._cols) {
      this._colSel = value;
      this.fireEvent('SelChange');
    }
  }

  get Text(): string {
    return this._text;
  }
  set Text(value: string) {
    // DOM CLOBBERING BUG FIX: Sanitize text content
    const sanitizedValue = PropertyPollutionProtection.sanitizeValue(value);
    this._text = typeof sanitizedValue === 'string' ? sanitizedValue : '';

    if (this._row >= 0 && this._row < this._rows && this._col >= 0 && this._col < this._cols) {
      this._cellData[this._row][this._col] = this._text;
      this._textMatrix.set(`${this._row},${this._col}`, this._text);
    }
  }

  get BackColor(): string {
    return this._backColor;
  }
  set BackColor(value: string) {
    this._backColor = value;
  }

  get ForeColor(): string {
    return this._foreColor;
  }
  set ForeColor(value: string) {
    this._foreColor = value;
  }

  get GridColor(): string {
    return this._gridColor;
  }
  set GridColor(value: string) {
    this._gridColor = value;
  }

  get AllowBigSelection(): boolean {
    return this._allowBigSelection;
  }
  set AllowBigSelection(value: boolean) {
    this._allowBigSelection = value;
  }

  get AllowUserResizing(): number {
    return this._allowUserResizing;
  }
  set AllowUserResizing(value: number) {
    this._allowUserResizing = value;
  }

  get FillStyle(): number {
    return this._fillStyle;
  }
  set FillStyle(value: number) {
    this._fillStyle = value;
  }

  get GridLines(): number {
    return this._gridLines;
  }
  set GridLines(value: number) {
    this._gridLines = value;
  }

  get ScrollBars(): number {
    return this._scrollBars;
  }
  set ScrollBars(value: number) {
    this._scrollBars = value;
  }

  get SelectionMode(): number {
    return this._selectionMode;
  }
  set SelectionMode(value: number) {
    this._selectionMode = value;
  }

  // Methods
  get TextMatrix(row: number, col: number): string {
    return this._textMatrix.get(`${row},${col}`) || '';
  }

  set TextMatrix(row: number, col: number, value: string) {
    if (row >= 0 && row < this._rows && col >= 0 && col < this._cols) {
      // DOM CLOBBERING BUG FIX: Sanitize cell content
      const sanitizedValue = PropertyPollutionProtection.sanitizeValue(value);
      const safeValue = typeof sanitizedValue === 'string' ? sanitizedValue : '';

      this._cellData[row][col] = safeValue;
      this._textMatrix.set(`${row},${col}`, safeValue);
    }
  }

  get ColWidth(col: number): number {
    return col >= 0 && col < this._cols ? this._colWidths[col] : 0;
  }

  set ColWidth(col: number, value: number) {
    if (col >= 0 && col < this._cols) {
      this._colWidths[col] = value;
    }
  }

  get RowHeight(row: number): number {
    return row >= 0 && row < this._rows ? this._rowHeights[row] : 0;
  }

  set RowHeight(row: number, value: number) {
    if (row >= 0 && row < this._rows) {
      this._rowHeights[row] = value;
    }
  }

  Clear(): void {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        this._cellData[r][c] = '';
      }
    }
    this._textMatrix.clear();
    this.fireEvent('Change');
  }

  RemoveItem(index: number): void {
    if (index >= this._fixedRows && index < this._rows) {
      this._cellData.splice(index, 1);
      this._rowHeights.splice(index, 1);
      this._rows--;
      // Update textMatrix to remove entries for this row
      for (let c = 0; c < this._cols; c++) {
        this._textMatrix.delete(`${index},${c}`);
        // Shift subsequent row indices in textMatrix
        for (let r = index + 1; r <= this._rows; r++) {
          const value = this._textMatrix.get(`${r},${c}`);
          if (value !== undefined) {
            this._textMatrix.delete(`${r},${c}`);
            this._textMatrix.set(`${r - 1},${c}`, value);
          }
        }
      }
      this.fireEvent('Change');
    }
  }

  AddItem(item: string, index?: number): void {
    if (index === undefined) {
      index = this._rows;
      this._rows++;
    } else {
      // Validate index
      if (index < 0 || index > this._rows) {
        return;
      }
      this._rows++;
    }

    const newRow = item.split('\t');

    // Initialize new row with empty cells
    const newRowData: string[] = new Array(this._cols).fill('');
    this._cellData.splice(index, 0, newRowData);

    // Add new row height
    this._rowHeights.splice(index, 0, 240); // Default height

    // Shift subsequent row indices in textMatrix
    for (let r = this._rows - 1; r > index; r--) {
      for (let c = 0; c < this._cols; c++) {
        const value = this._textMatrix.get(`${r - 1},${c}`);
        if (value !== undefined) {
          this._textMatrix.delete(`${r - 1},${c}`);
          this._textMatrix.set(`${r},${c}`, value);
        }
      }
    }

    for (let c = 0; c < this._cols && c < newRow.length; c++) {
      this._cellData[index][c] = newRow[c];
      this._textMatrix.set(`${index},${c}`, newRow[c]);
    }

    this.fireEvent('Change');
  }

  private updateText(): void {
    if (this._row >= 0 && this._row < this._rows && this._col >= 0 && this._col < this._cols) {
      this._text = this._cellData[this._row][this._col];
    }
  }
}

/**
 * Microsoft Chart Control (MSChart)
 */
export class MSChart extends ActiveXControl {
  private _chartType: number = 1; // vtChChartType2dBar
  private _rowCount: number = 5;
  private _columnCount: number = 5;
  private _titleText: string = '';
  private _showLegend: boolean = true;
  private _dataGrid: any = null;
  private _plot: any = null;
  private _backdrop: any = null;
  private _legend: any = null;
  private _title: any = null;
  private _footnote: any = null;
  private _series: any[] = [];
  private _chartData: number[][] = [];

  constructor(name: string = 'MSChart1') {
    super(name);
    this.initializeChart();
  }

  private initializeChart(): void {
    // Initialize chart data
    for (let r = 0; r < this._rowCount; r++) {
      this._chartData[r] = [];
      for (let c = 0; c < this._columnCount; c++) {
        this._chartData[r][c] = Math.random() * 100;
      }
    }

    // Initialize chart objects
    this._dataGrid = {
      SetData: (row: number, column: number, value: number) => {
        if (row > 0 && row <= this._rowCount && column > 0 && column <= this._columnCount) {
          this._chartData[row - 1][column - 1] = value;
        }
      },
      GetData: (row: number, column: number): number => {
        if (row > 0 && row <= this._rowCount && column > 0 && column <= this._columnCount) {
          return this._chartData[row - 1][column - 1];
        }
        return 0;
      },
    };

    this._plot = {
      SeriesCollection: {
        Count: this._columnCount,
        Item: (index: number) => this._series[index - 1],
      },
    };

    this._title = {
      Text: this._titleText,
      VtFont: {
        Name: 'Arial',
        Size: 14,
        Bold: true,
      },
    };

    this._legend = {
      Location: {
        Visible: this._showLegend,
        LocationType: 4, // VtChLocationTypeRight
      },
    };
  }

  // Properties
  get ChartType(): number {
    return this._chartType;
  }
  set ChartType(value: number) {
    this._chartType = value;
    this.fireEvent('ChartUpdated');
  }

  get RowCount(): number {
    return this._rowCount;
  }
  set RowCount(value: number) {
    this._rowCount = value;
    this.initializeChart();
    this.fireEvent('DataUpdated');
  }

  get ColumnCount(): number {
    return this._columnCount;
  }
  set ColumnCount(value: number) {
    this._columnCount = value;
    this.initializeChart();
    this.fireEvent('DataUpdated');
  }

  get TitleText(): string {
    return this._titleText;
  }
  set TitleText(value: string) {
    // DOM CLOBBERING BUG FIX: Sanitize title text
    const sanitizedValue = PropertyPollutionProtection.sanitizeValue(value);
    this._titleText = typeof sanitizedValue === 'string' ? sanitizedValue : '';

    if (this._title) this._title.Text = this._titleText;
    this.fireEvent('TitleChanged');
  }

  get ShowLegend(): boolean {
    return this._showLegend;
  }
  set ShowLegend(value: boolean) {
    this._showLegend = value;
    if (this._legend && this._legend.Location) {
      this._legend.Location.Visible = value;
    }
    this.fireEvent('LegendChanged');
  }

  get DataGrid(): any {
    return this._dataGrid;
  }
  get Plot(): any {
    return this._plot;
  }
  get Title(): any {
    return this._title;
  }
  get Legend(): any {
    return this._legend;
  }
  get Backdrop(): any {
    return this._backdrop;
  }
  get Footnote(): any {
    return this._footnote;
  }

  // Methods
  Refresh(): void {
    super.Refresh();
    this.fireEvent('ChartActivated');
  }

  ToDefaults(): void {
    this._chartType = 1;
    this._rowCount = 5;
    this._columnCount = 5;
    this._titleText = '';
    this._showLegend = true;
    this.initializeChart();
    this.fireEvent('ChartUpdated');
  }
}

/**
 * Microsoft Web Browser Control
 */
export class WebBrowser extends ActiveXControl {
  private _busy: boolean = false;
  private _document: any = null;
  private _locationName: string = '';
  private _locationURL: string = '';
  private _offline: boolean = false;
  private _readyState: number = 0;
  private _silent: boolean = false;
  private _type: string = '';
  private _registerAsBrowser: boolean = false;
  private _registerAsDropTarget: boolean = true;
  private _theaterMode: boolean = false;
  private _addressBar: boolean = true;
  private _menuBar: boolean = true;
  private _statusBar: boolean = true;
  private _toolBar: boolean = true;
  private _fullScreen: boolean = false;
  private _resizable: boolean = true;
  private _navigationTimeout: NodeJS.Timeout | null = null;

  constructor(name: string = 'WebBrowser1') {
    super(name);
    this.initializeBrowser();
  }

  private initializeBrowser(): void {
    // Create mock document object
    this._document = {
      URL: '',
      title: '',
      body: {
        innerHTML: '',
        innerText: '',
      },
      getElementById: (id: string) => null,
      getElementsByTagName: (tag: string) => [],
      createElement: (tag: string) => ({}),
    };
  }

  // Properties
  get Busy(): boolean {
    return this._busy;
  }
  get Document(): any {
    return this._document;
  }
  get LocationName(): string {
    return this._locationName;
  }
  get LocationURL(): string {
    return this._locationURL;
  }
  get Offline(): boolean {
    return this._offline;
  }
  set Offline(value: boolean) {
    this._offline = value;
  }
  get ReadyState(): number {
    return this._readyState;
  }
  get Silent(): boolean {
    return this._silent;
  }
  set Silent(value: boolean) {
    this._silent = value;
  }
  get Type(): string {
    return this._type;
  }
  get RegisterAsBrowser(): boolean {
    return this._registerAsBrowser;
  }
  set RegisterAsBrowser(value: boolean) {
    this._registerAsBrowser = value;
  }
  get RegisterAsDropTarget(): boolean {
    return this._registerAsDropTarget;
  }
  set RegisterAsDropTarget(value: boolean) {
    this._registerAsDropTarget = value;
  }
  get TheaterMode(): boolean {
    return this._theaterMode;
  }
  set TheaterMode(value: boolean) {
    this._theaterMode = value;
    this.fireEvent('OnTheaterMode', value);
  }
  get AddressBar(): boolean {
    return this._addressBar;
  }
  set AddressBar(value: boolean) {
    this._addressBar = value;
    this.fireEvent('OnAddressBar', value);
  }
  get MenuBar(): boolean {
    return this._menuBar;
  }
  set MenuBar(value: boolean) {
    this._menuBar = value;
    this.fireEvent('OnMenuBar', value);
  }
  get StatusBar(): boolean {
    return this._statusBar;
  }
  set StatusBar(value: boolean) {
    this._statusBar = value;
    this.fireEvent('OnStatusBar', value);
  }
  get ToolBar(): boolean {
    return this._toolBar;
  }
  set ToolBar(value: boolean) {
    this._toolBar = value;
    this.fireEvent('OnToolBar', value);
  }
  get FullScreen(): boolean {
    return this._fullScreen;
  }
  set FullScreen(value: boolean) {
    this._fullScreen = value;
    this.fireEvent('OnFullScreen', value);
  }
  get Resizable(): boolean {
    return this._resizable;
  }
  set Resizable(value: boolean) {
    this._resizable = value;
  }

  // Methods
  Navigate(
    URL: string,
    Flags?: number,
    TargetFrameName?: string,
    PostData?: any,
    Headers?: string
  ): void {
    // Clear any pending navigation
    if (this._navigationTimeout) {
      clearTimeout(this._navigationTimeout);
      this._navigationTimeout = null;
    }

    this._busy = true;
    this._readyState = 1; // Loading
    this.fireEvent('BeforeNavigate2', { URL, Flags, TargetFrameName, PostData, Headers });

    // Simulate navigation
    this._navigationTimeout = setTimeout(() => {
      this._locationURL = URL;
      this._locationName = URL;
      this._readyState = 4; // Complete
      this._busy = false;
      this._document.URL = URL;
      this._document.title = `Page: ${URL}`;

      this.fireEvent('NavigateComplete2', URL);
      this.fireEvent('DocumentComplete', { URL });
      this._navigationTimeout = null;
    }, 100);
  }

  Navigate2(URL: any, Flags?: any, TargetFrameName?: any, PostData?: any, Headers?: any): void {
    this.Navigate(String(URL), Flags, TargetFrameName, PostData, Headers);
  }

  GoBack(): void {
    this.fireEvent('CommandStateChange', { Command: 2, Enable: false });
  }

  GoForward(): void {
    this.fireEvent('CommandStateChange', { Command: 1, Enable: false });
  }

  GoHome(): void {
    this.Navigate('about:home');
  }

  GoSearch(): void {
    this.Navigate('about:search');
  }

  Refresh(): void {
    this.fireEvent('Refresh');
    if (this._locationURL) {
      this.Navigate(this._locationURL);
    }
  }

  Refresh2(Level?: number): void {
    this.Refresh();
  }

  Stop(): void {
    if (this._busy) {
      this._busy = false;
      this._readyState = 4; // Complete
      this.fireEvent('NavigateError', { URL: this._locationURL, StatusCode: -2147023673 });
    }
  }

  Quit(): void {
    this.fireEvent('OnQuit');
  }

  ExecWB(cmdID: number, cmdexecopt: number, pvaIn?: any, pvaOut?: any): void {
    // Execute browser commands
    switch (cmdID) {
      case 4: // OLECMDID_PRINT
        this.fireEvent('PrintRequested');
        break;
      case 5: // OLECMDID_PRINTPREVIEW
        this.fireEvent('PrintPreviewRequested');
        break;
      case 6: // OLECMDID_PAGESETUP
        this.fireEvent('PageSetupRequested');
        break;
    }
  }

  // Override destroy to cleanup WebBrowser specific resources
  destroy(): void {
    // Clear navigation timeout
    if (this._navigationTimeout) {
      clearTimeout(this._navigationTimeout);
      this._navigationTimeout = null;
    }

    // Clear document reference
    this._document = null;

    // Call parent destroy
    super.destroy();
  }
}

/**
 * Factory for creating ActiveX controls
 */
export class ActiveXControlFactory {
  private static controls: Map<string, () => ActiveXControl> = new Map([
    // Microsoft Controls
    ['{5F4DF280-531B-11CF-91F6-C2863C385E30}', () => new MSFlexGrid()], // MSFlexGrid.MSFlexGrid
    ['{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}', () => new MSFlexGrid()], // MSFlexGrid.MSFlexGrid.1
    ['{3A2B370C-BA0A-11D1-B137-0000F8753F5D}', () => new MSChart()], // MSChart20Lib.MSChart
    ['{8856F961-340A-11D0-A96B-00C04FD705A2}', () => new WebBrowser()], // Shell.Explorer.2
    ['{D27CDB6E-AE6D-11CF-96B8-444553540000}', () => new WebBrowser()], // ShockwaveFlash.ShockwaveFlash
  ]);

  static registerControl(clsid: string, factory: () => ActiveXControl): void {
    this.controls.set(clsid.toUpperCase(), factory);
  }

  static createControl(clsid: string): ActiveXControl | null {
    const factory = this.controls.get(clsid.toUpperCase());
    return factory ? factory() : null;
  }

  static getRegisteredControls(): string[] {
    return Array.from(this.controls.keys());
  }
}

/**
 * Initialize ActiveX bridge with common controls
 */
export function initializeActiveXControls(bridge: ActiveXWebAssemblyBridge): void {
  // Register all controls with the bridge
  for (const clsid of ActiveXControlFactory.getRegisteredControls()) {
    bridge.registerCOMObject(clsid, () => {
      return ActiveXControlFactory.createControl(clsid);
    });
  }

  // Register additional CLSIDs that map to the same controls
  const aliases = [
    // MSFlexGrid aliases
    ['{6262D3A0-531B-11CF-91F6-C2863C385E30}', '{5F4DF280-531B-11CF-91F6-C2863C385E30}'],
    // WebBrowser aliases
    ['{EAB22AC0-30C1-11CF-A7EB-0000C05BAE0B}', '{8856F961-340A-11D0-A96B-00C04FD705A2}'],
  ];

  for (const [alias, target] of aliases) {
    bridge.registerCOMObject(alias, () => {
      return ActiveXControlFactory.createControl(target);
    });
  }
}
