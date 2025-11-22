// VB6 ActiveX Control Wrapper Service
// Provides web-based implementations of popular VB6 ActiveX controls

import { EventEmitter } from 'events';

// Browser-compatible EventEmitter
class BrowserEventEmitter {
  private events: { [key: string]: ((...args: any[]) => any)[] } = {};

  on(event: string, listener: (...args: any[]) => any): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
    return true;
  }

  off(event: string, listener?: (...args: any[]) => any): this {
    if (!this.events[event]) {
      return this;
    }
    if (listener) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    } else {
      delete this.events[event];
    }
    return this;
  }
}

// ActiveX Control Types
export enum ActiveXControlType {
  MSComm = 'MSComm',
  MSChart = 'MSChart',
  MSFlexGrid = 'MSFlexGrid',
  MSHFlexGrid = 'MSHFlexGrid',
  WebBrowser = 'WebBrowser',
  ShockwaveFlash = 'ShockwaveFlash',
  MediaPlayer = 'MediaPlayer',
  ADODC = 'ADODC',
  DataGrid = 'DataGrid',
  Calendar = 'Calendar',
  RichTextBox = 'RichTextBox',
  TreeView = 'TreeView',
  ListView = 'ListView',
  ProgressBar = 'ProgressBar',
  StatusBar = 'StatusBar',
  CoolBar = 'CoolBar',
  ImageList = 'ImageList',
  CommonDialog = 'CommonDialog'
}

// Base ActiveX Control Interface
export interface IActiveXControl {
  id: string;
  type: ActiveXControlType;
  version: string;
  properties: { [key: string]: any };
  methods: { [key: string]: (...args: any[]) => any };
  events: BrowserEventEmitter;
  
  initialize(): Promise<void>;
  destroy(): void;
  getProperty(name: string): any;
  setProperty(name: string, value: any): void;
  invokeMethod(name: string, ...args: any[]): any;
}

// Base ActiveX Control Implementation
export abstract class ActiveXControlBase implements IActiveXControl {
  id: string;
  type: ActiveXControlType;
  version: string = '1.0';
  properties: { [key: string]: any } = {};
  methods: { [key: string]: (...args: any[]) => any } = {};
  events: BrowserEventEmitter;

  constructor(id: string, type: ActiveXControlType) {
    this.id = id;
    this.type = type;
    this.events = new BrowserEventEmitter();
    this.initializeProperties();
    this.initializeMethods();
  }

  abstract initialize(): Promise<void>;
  abstract destroy(): void;
  protected abstract initializeProperties(): void;
  protected abstract initializeMethods(): void;

  getProperty(name: string): any {
    return this.properties[name];
  }

  setProperty(name: string, value: any): void {
    const oldValue = this.properties[name];
    this.properties[name] = value;
    this.events.emit('PropertyChanged', { name, oldValue, newValue: value });
  }

  invokeMethod(name: string, ...args: any[]): any {
    const method = this.methods[name];
    if (!method) {
      throw new Error(`Method '${name}' not found on ${this.type} control`);
    }
    return method.apply(this, args);
  }
}

// MSComm Control (Serial Communication)
export class MSCommControl extends ActiveXControlBase {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;

  constructor(id: string) {
    super(id, ActiveXControlType.MSComm);
    this.version = '6.0';
  }

  protected initializeProperties(): void {
    this.properties = {
      CommPort: 1,
      Settings: '9600,N,8,1',
      PortOpen: false,
      InputMode: 0, // 0 = Text, 1 = Binary
      InputLen: 0,
      InBufferSize: 1024,
      OutBufferSize: 1024,
      RThreshold: 0,
      SThreshold: 0,
      HandShaking: 0,
      Input: '',
      Output: '',
      CommEvent: 0,
      DTREnable: true,
      RTSEnable: true
    };
  }

  protected initializeMethods(): void {
    this.methods = {
      OpenPort: this.openPort.bind(this),
      ClosePort: this.closePort.bind(this),
      SendData: this.sendData.bind(this),
      ReadData: this.readData.bind(this),
      ClearBuffer: this.clearBuffer.bind(this)
    };
  }

  async initialize(): Promise<void> {
    // Check if Web Serial API is available
    if ('serial' in navigator) {
      console.log('Web Serial API is supported');
    } else {
      console.warn('Web Serial API is not supported in this browser');
    }
  }

  destroy(): void {
    this.closePort();
  }

  private async openPort(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported');
    }

    try {
      // Request port access
      this.port = await (navigator as any).serial.requestPort();
      
      // Parse settings
      const [baudRate] = this.properties.Settings.split(',');
      
      // Open port
      await this.port.open({ baudRate: parseInt(baudRate) });
      
      this.properties.PortOpen = true;
      this.events.emit('OnComm', { CommEvent: 3 }); // Port opened
      
      // Set up reading
      this.startReading();
    } catch (error) {
      console.error('Failed to open port:', error);
      throw error;
    }
  }

  private async closePort(): Promise<void> {
    if (this.port && this.properties.PortOpen) {
      await this.port.close();
      this.port = null;
      this.properties.PortOpen = false;
      this.events.emit('OnComm', { CommEvent: 4 }); // Port closed
    }
  }

  private async sendData(data: string): Promise<void> {
    if (!this.port || !this.properties.PortOpen) {
      throw new Error('Port is not open');
    }

    const writer = this.port.writable.getWriter();
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(data));
    writer.releaseLock();
  }

  private async readData(): Promise<string> {
    return this.properties.Input;
  }

  private clearBuffer(): void {
    this.properties.Input = '';
  }

  private async startReading(): Promise<void> {
    if (!this.port) return;

    const reader = this.port.readable.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        this.properties.Input += text;
        
        if (this.properties.RThreshold > 0 && 
            this.properties.Input.length >= this.properties.RThreshold) {
          this.events.emit('OnComm', { CommEvent: 2 }); // Receive event
        }
      }
    } catch (error) {
      console.error('Read error:', error);
    } finally {
      reader.releaseLock();
    }
  }
}

// MSChart Control
export class MSChartControl extends ActiveXControlBase {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor(id: string) {
    super(id, ActiveXControlType.MSChart);
    this.version = '6.0';
  }

  protected initializeProperties(): void {
    this.properties = {
      ChartType: 1, // 1 = Bar, 2 = Line, 3 = Pie, etc.
      RowCount: 5,
      ColumnCount: 5,
      ShowLegend: true,
      Title: 'Chart Title',
      BackColor: '#FFFFFF',
      ForeColor: '#000000',
      GridLines: true,
      Data: this.createDefaultData(),
      Series: [],
      AutoRedraw: true
    };
  }

  protected initializeMethods(): void {
    this.methods = {
      Refresh: this.refresh.bind(this),
      SetData: this.setData.bind(this),
      GetData: this.getData.bind(this),
      AddSeries: this.addSeries.bind(this),
      RemoveSeries: this.removeSeries.bind(this),
      ExportChart: this.exportChart.bind(this)
    };
  }

  async initialize(): Promise<void> {
    // Create canvas element for chart rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 300;
    this.context = this.canvas.getContext('2d');
    this.refresh();
  }

  destroy(): void {
    this.canvas = null;
    this.context = null;
  }

  private createDefaultData(): number[][] {
    const data: number[][] = [];
    for (let i = 0; i < this.properties.RowCount; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.properties.ColumnCount; j++) {
        row.push(Math.random() * 100);
      }
      data.push(row);
    }
    return data;
  }

  private refresh(): void {
    if (!this.context) return;

    // Clear canvas
    this.context.fillStyle = this.properties.BackColor;
    this.context.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

    // Draw based on chart type
    switch (this.properties.ChartType) {
      case 1: // Bar Chart
        this.drawBarChart();
        break;
      case 2: // Line Chart
        this.drawLineChart();
        break;
      case 3: // Pie Chart
        this.drawPieChart();
        break;
      default:
        this.drawBarChart();
    }

    this.events.emit('OnDraw');
  }

  private drawBarChart(): void {
    if (!this.context || !this.canvas) return;

    const data = this.properties.Data;
    const barWidth = this.canvas.width / (data[0].length * data.length);
    const maxValue = Math.max(...data.flat());

    // Draw bars
    data.forEach((series, seriesIndex) => {
      series.forEach((value, index) => {
        const barHeight = (value / maxValue) * (this.canvas!.height - 50);
        const x = (seriesIndex * data[0].length + index) * barWidth;
        const y = this.canvas!.height - barHeight - 30;

        this.context!.fillStyle = this.getSeriesColor(seriesIndex);
        this.context!.fillRect(x, y, barWidth * 0.8, barHeight);
      });
    });

    // Draw title
    this.context.fillStyle = this.properties.ForeColor;
    this.context.font = '16px Arial';
    this.context.textAlign = 'center';
    this.context.fillText(this.properties.Title, this.canvas.width / 2, 20);
  }

  private drawLineChart(): void {
    // Implementation for line chart
    // Similar structure to bar chart but with lines
  }

  private drawPieChart(): void {
    // Implementation for pie chart
    // Draw circular chart with slices
  }

  private getSeriesColor(index: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[index % colors.length];
  }

  private setData(row: number, col: number, value: number): void {
    if (row >= 0 && row < this.properties.RowCount &&
        col >= 0 && col < this.properties.ColumnCount) {
      this.properties.Data[row][col] = value;
      if (this.properties.AutoRedraw) {
        this.refresh();
      }
    }
  }

  private getData(row: number, col: number): number {
    if (row >= 0 && row < this.properties.RowCount &&
        col >= 0 && col < this.properties.ColumnCount) {
      return this.properties.Data[row][col];
    }
    return 0;
  }

  private addSeries(name: string, data: number[]): void {
    this.properties.Series.push({ name, data });
    this.properties.RowCount = this.properties.Series.length;
    this.refresh();
  }

  private removeSeries(index: number): void {
    if (index >= 0 && index < this.properties.Series.length) {
      this.properties.Series.splice(index, 1);
      this.properties.RowCount = this.properties.Series.length;
      this.refresh();
    }
  }

  private exportChart(): string {
    if (this.canvas) {
      return this.canvas.toDataURL('image/png');
    }
    return '';
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
}

// WebBrowser Control
export class WebBrowserControl extends ActiveXControlBase {
  private iframe: HTMLIFrameElement | null = null;
  private navigationHistory: string[] = [];
  private currentIndex: number = -1;

  constructor(id: string) {
    super(id, ActiveXControlType.WebBrowser);
    this.version = '11.0'; // IE11 equivalent
  }

  protected initializeProperties(): void {
    this.properties = {
      LocationURL: 'about:blank',
      LocationName: '',
      Busy: false,
      ReadyState: 0, // 0=Uninitialized, 1=Loading, 2=Loaded, 3=Interactive, 4=Complete
      Offline: false,
      Silent: false,
      RegisterAsBrowser: false,
      RegisterAsDropTarget: true,
      TheaterMode: false,
      AddressBar: true,
      StatusBar: true,
      MenuBar: true,
      ToolBar: true,
      Width: 800,
      Height: 600,
      Top: 0,
      Left: 0,
      StatusText: '',
      Document: null
    };
  }

  protected initializeMethods(): void {
    this.methods = {
      Navigate: this.navigate.bind(this),
      Navigate2: this.navigate.bind(this),
      GoBack: this.goBack.bind(this),
      GoForward: this.goForward.bind(this),
      GoHome: this.goHome.bind(this),
      GoSearch: this.goSearch.bind(this),
      Refresh: this.refresh.bind(this),
      Refresh2: this.refresh.bind(this),
      Stop: this.stop.bind(this),
      Quit: this.quit.bind(this),
      ExecWB: this.execWB.bind(this),
      GetProperty: this.getBrowserProperty.bind(this),
      PutProperty: this.putBrowserProperty.bind(this)
    };
  }

  async initialize(): Promise<void> {
    // Create iframe element
    this.iframe = document.createElement('iframe');
    this.iframe.width = String(this.properties.Width);
    this.iframe.height = String(this.properties.Height);
    this.iframe.style.border = '1px solid #ccc';
    
    // Set up event listeners
    this.iframe.addEventListener('load', this.handleLoad.bind(this));
    this.iframe.addEventListener('error', this.handleError.bind(this));
    
    // Set initial URL
    this.iframe.src = this.properties.LocationURL;
  }

  destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }

  private navigate(url: string, flags?: number, targetFrameName?: string, 
                   postData?: any, headers?: string): void {
    if (!this.iframe) return;
    
    this.properties.Busy = true;
    this.properties.ReadyState = 1;
    this.events.emit('BeforeNavigate2', { URL: url, Cancel: false });
    
    this.iframe.src = url;
    this.properties.LocationURL = url;
    
    // Add to history
    if (this.currentIndex < this.navigationHistory.length - 1) {
      this.navigationHistory = this.navigationHistory.slice(0, this.currentIndex + 1);
    }
    this.navigationHistory.push(url);
    this.currentIndex++;
  }

  private goBack(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const url = this.navigationHistory[this.currentIndex];
      this.navigate(url);
    }
  }

  private goForward(): void {
    if (this.currentIndex < this.navigationHistory.length - 1) {
      this.currentIndex++;
      const url = this.navigationHistory[this.currentIndex];
      this.navigate(url);
    }
  }

  private goHome(): void {
    this.navigate('about:blank');
  }

  private goSearch(): void {
    this.navigate('https://www.google.com');
  }

  private refresh(): void {
    if (this.iframe) {
      this.iframe.contentWindow?.location.reload();
    }
  }

  private stop(): void {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.stop();
      this.properties.Busy = false;
      this.events.emit('NavigateComplete2', { URL: this.properties.LocationURL });
    }
  }

  private quit(): void {
    this.destroy();
  }

  private execWB(cmdID: number, cmdExecOpt: number): void {
    // Execute browser commands
    // This would implement print, save, etc.
    switch (cmdID) {
      case 6: // Print
        if (this.iframe?.contentWindow) {
          this.iframe.contentWindow.print();
        }
        break;
      case 7: // Print Preview
        console.log('Print preview not supported in iframe');
        break;
    }
  }

  private getBrowserProperty(property: string): any {
    return this.properties[property];
  }

  private putBrowserProperty(property: string, value: any): void {
    this.properties[property] = value;
  }

  private handleLoad(): void {
    this.properties.Busy = false;
    this.properties.ReadyState = 4;
    if (this.iframe?.contentDocument) {
      this.properties.Document = this.iframe.contentDocument;
      this.properties.LocationName = this.iframe.contentDocument.title;
    }
    this.events.emit('NavigateComplete2', { URL: this.properties.LocationURL });
    this.events.emit('DocumentComplete', { URL: this.properties.LocationURL });
  }

  private handleError(error: any): void {
    this.properties.Busy = false;
    this.events.emit('NavigateError', { 
      URL: this.properties.LocationURL, 
      StatusCode: 404,
      Cancel: false 
    });
  }

  getIFrame(): HTMLIFrameElement | null {
    return this.iframe;
  }
}

// CommonDialog Control
export class CommonDialogControl extends ActiveXControlBase {
  constructor(id: string) {
    super(id, ActiveXControlType.CommonDialog);
    this.version = '6.0';
  }

  protected initializeProperties(): void {
    this.properties = {
      CancelError: false,
      Color: 0,
      Copies: 1,
      DefaultExt: '',
      DialogTitle: '',
      FileName: '',
      FileTitle: '',
      Filter: 'All Files (*.*)|*.*',
      FilterIndex: 1,
      Flags: 0,
      FontBold: false,
      FontItalic: false,
      FontName: 'Arial',
      FontSize: 10,
      FontStrikethru: false,
      FontUnderline: false,
      FromPage: 1,
      HelpCommand: 0,
      HelpContext: 0,
      HelpFile: '',
      HelpKey: '',
      InitDir: '',
      MaxFileSize: 260,
      PrinterDefault: false,
      ToPage: 1
    };
  }

  protected initializeMethods(): void {
    this.methods = {
      ShowOpen: this.showOpen.bind(this),
      ShowSave: this.showSave.bind(this),
      ShowColor: this.showColor.bind(this),
      ShowFont: this.showFont.bind(this),
      ShowPrinter: this.showPrinter.bind(this),
      ShowHelp: this.showHelp.bind(this)
    };
  }

  async initialize(): Promise<void> {
    // No initialization needed for file dialogs
  }

  destroy(): void {
    // No cleanup needed
  }

  private async showOpen(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.parseFilter();
    
    return new Promise((resolve, reject) => {
      input.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          this.properties.FileName = file.name;
          this.properties.FileTitle = file.name;
          this.events.emit('FileOk');
          resolve();
        } else if (this.properties.CancelError) {
          reject(new Error('User cancelled'));
        } else {
          resolve();
        }
      });
      
      input.click();
    });
  }

  private async showSave(): Promise<void> {
    // Create a save dialog simulation
    const fileName = prompt(this.properties.DialogTitle || 'Save As', this.properties.FileName);
    if (fileName) {
      this.properties.FileName = fileName;
      this.properties.FileTitle = fileName;
      this.events.emit('FileOk');
    } else if (this.properties.CancelError) {
      throw new Error('User cancelled');
    }
  }

  private async showColor(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = this.rgbToHex(this.properties.Color);
    
    return new Promise((resolve, reject) => {
      input.addEventListener('change', (event) => {
        const hex = (event.target as HTMLInputElement).value;
        this.properties.Color = this.hexToRgb(hex);
        this.events.emit('ColorOk');
        resolve();
      });
      
      input.click();
    });
  }

  private async showFont(): Promise<void> {
    // Create a font dialog simulation
    // In a real implementation, this would show a proper font picker
    const fontName = prompt('Enter font name:', this.properties.FontName);
    if (fontName) {
      this.properties.FontName = fontName;
      this.events.emit('FontOk');
    } else if (this.properties.CancelError) {
      throw new Error('User cancelled');
    }
  }

  private async showPrinter(): Promise<void> {
    // Trigger browser print dialog
    window.print();
    this.events.emit('PrintOk');
  }

  private showHelp(): void {
    if (this.properties.HelpFile) {
      window.open(this.properties.HelpFile, '_blank');
    }
  }

  private parseFilter(): string {
    // Convert VB6 filter format to HTML accept attribute
    const filters = this.properties.Filter.split('|');
    const extensions: string[] = [];
    
    for (let i = 1; i < filters.length; i += 2) {
      const ext = filters[i].replace('*', '');
      if (ext !== '.*') {
        extensions.push(ext);
      }
    }
    
    return extensions.join(',');
  }

  private rgbToHex(rgb: number): string {
    const r = (rgb >> 16) & 0xFF;
    const g = (rgb >> 8) & 0xFF;
    const b = rgb & 0xFF;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): number {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return (r << 16) | (g << 8) | b;
    }
    return 0;
  }
}

// ActiveX Service Manager
export class VB6ActiveXService {
  private static instance: VB6ActiveXService;
  private controls: Map<string, IActiveXControl> = new Map();
  private registeredControls: Map<string, typeof ActiveXControlBase> = new Map();

  static getInstance(): VB6ActiveXService {
    if (!VB6ActiveXService.instance) {
      VB6ActiveXService.instance = new VB6ActiveXService();
      VB6ActiveXService.instance.registerDefaultControls();
    }
    return VB6ActiveXService.instance;
  }

  private registerDefaultControls(): void {
    this.registeredControls.set('MSComm.MSComm', MSCommControl as any);
    this.registeredControls.set('MSChart20Lib.MSChart', MSChartControl as any);
    this.registeredControls.set('SHDocVw.InternetExplorer', WebBrowserControl as any);
    this.registeredControls.set('MSComDlg.CommonDialog', CommonDialogControl as any);
  }

  async createControl(progId: string, controlId: string): Promise<IActiveXControl> {
    const ControlClass = this.registeredControls.get(progId);
    if (!ControlClass) {
      throw new Error(`ActiveX control '${progId}' not registered`);
    }

    const control = new ControlClass(controlId);
    await control.initialize();
    this.controls.set(controlId, control);
    
    return control;
  }

  getControl(controlId: string): IActiveXControl | undefined {
    return this.controls.get(controlId);
  }

  destroyControl(controlId: string): void {
    const control = this.controls.get(controlId);
    if (control) {
      control.destroy();
      this.controls.delete(controlId);
    }
  }

  listRegisteredControls(): string[] {
    return Array.from(this.registeredControls.keys());
  }

  isControlRegistered(progId: string): boolean {
    return this.registeredControls.has(progId);
  }
}

// Export singleton instance
export const vb6ActiveXService = VB6ActiveXService.getInstance();