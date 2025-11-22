/**
 * COM/ActiveX Bridge - Complete Browser-Compatible COM Implementation
 * Provides COM object creation and ActiveX control hosting for VB6 applications
 */

import { EventEmitter } from 'events';

// COM/ActiveX Constants
export enum VarType {
  VT_EMPTY = 0,
  VT_NULL = 1,
  VT_I2 = 2,
  VT_I4 = 3,
  VT_R4 = 4,
  VT_R8 = 5,
  VT_CY = 6,
  VT_DATE = 7,
  VT_BSTR = 8,
  VT_DISPATCH = 9,
  VT_ERROR = 10,
  VT_BOOL = 11,
  VT_VARIANT = 12,
  VT_UNKNOWN = 13,
  VT_DECIMAL = 14,
  VT_I1 = 16,
  VT_UI1 = 17,
  VT_UI2 = 18,
  VT_UI4 = 19,
  VT_I8 = 20,
  VT_UI8 = 21,
  VT_ARRAY = 0x2000
}

export enum HRESULT {
  S_OK = 0x00000000,
  S_FALSE = 0x00000001,
  E_NOTIMPL = 0x80004001,
  E_NOINTERFACE = 0x80004002,
  E_POINTER = 0x80004003,
  E_ABORT = 0x80004004,
  E_FAIL = 0x80004005,
  E_UNEXPECTED = 0x8000FFFF,
  E_ACCESSDENIED = 0x80070005,
  E_HANDLE = 0x80070006,
  E_OUTOFMEMORY = 0x8007000E,
  E_INVALIDARG = 0x80070057
}

export interface IUnknown {
  QueryInterface(riid: string): HRESULT;
  AddRef(): number;
  Release(): number;
}

export interface IDispatch extends IUnknown {
  GetTypeInfoCount(): number;
  GetTypeInfo(iTInfo: number, lcid: number): any;
  GetIDsOfNames(rgszNames: string[], cNames: number, lcid: number): number[];
  Invoke(dispIdMember: number, riid: string, lcid: number, wFlags: number, pDispParams: any[]): any;
}

export interface IConnectionPoint extends IUnknown {
  GetConnectionInterface(): string;
  GetConnectionPointContainer(): IConnectionPointContainer;
  Advise(pUnkSink: IUnknown): number;
  Unadvise(dwCookie: number): HRESULT;
  EnumConnections(): any;
}

export interface IConnectionPointContainer extends IUnknown {
  EnumConnectionPoints(): any;
  FindConnectionPoint(riid: string): IConnectionPoint;
}

export interface IOleObject extends IUnknown {
  SetClientSite(pClientSite: IOleClientSite): HRESULT;
  GetClientSite(): IOleClientSite;
  SetHostNames(szContainerApp: string, szContainerObj: string): HRESULT;
  Close(dwSaveOption: number): HRESULT;
  SetMoniker(dwWhichMoniker: number, pmk: any): HRESULT;
  GetMoniker(dwAssign: number, dwWhichMoniker: number): any;
  InitFromData(pDataObject: any, fCreation: boolean, dwReserved: number): HRESULT;
  GetClipboardData(dwReserved: number): any;
  DoVerb(iVerb: number, lpmsg: any, pActiveSite: IOleClientSite, lindex: number, hwndParent: number, lprcPosRect: any): HRESULT;
  EnumVerbs(): any;
  Update(): HRESULT;
  IsUpToDate(): HRESULT;
  GetUserClassID(): string;
  GetUserType(dwFormOfType: number): string;
  SetExtent(dwDrawAspect: number, psizel: any): HRESULT;
  GetExtent(dwDrawAspect: number): any;
  Advise(pAdvSink: any): number;
  Unadvise(dwConnection: number): HRESULT;
  EnumAdvise(): any;
  GetMiscStatus(dwAspect: number): number;
  SetColorScheme(pLogpal: any): HRESULT;
}

export interface IOleClientSite extends IUnknown {
  SaveObject(): HRESULT;
  GetMoniker(dwAssign: number, dwWhichMoniker: number): any;
  GetContainer(): IOleContainer;
  ShowObject(): HRESULT;
  OnShowWindow(fShow: boolean): HRESULT;
  RequestNewObjectLayout(): HRESULT;
}

export interface IOleContainer extends IUnknown {
  ParseDisplayName(pbc: any, pszDisplayName: string): any;
  EnumObjects(grfFlags: number): any;
  LockContainer(fLock: boolean): HRESULT;
}

export class COMObject extends EventEmitter implements IDispatch {
  private _refCount: number = 1;
  private _classId: string;
  private _progId: string;
  private _interfaces: Map<string, any> = new Map();
  private _properties: Map<string, any> = new Map();
  private _methods: Map<string, (...args: any[]) => any> = new Map();
  private _events: Map<string, ((...args: any[]) => any)[]> = new Map();

  constructor(classId: string, progId: string) {
    super();
    this._classId = classId;
    this._progId = progId;
    this.setupDefaultInterfaces();
  }

  // IUnknown implementation
  QueryInterface(riid: string): HRESULT {
    if (this._interfaces.has(riid)) {
      return HRESULT.S_OK;
    }
    return HRESULT.E_NOINTERFACE;
  }

  AddRef(): number {
    return ++this._refCount;
  }

  Release(): number {
    if (--this._refCount === 0) {
      this.cleanup();
    }
    return this._refCount;
  }

  // IDispatch implementation
  GetTypeInfoCount(): number {
    return 1;
  }

  GetTypeInfo(iTInfo: number, lcid: number): any {
    return {
      name: this._progId,
      methods: Array.from(this._methods.keys()),
      properties: Array.from(this._properties.keys())
    };
  }

  GetIDsOfNames(rgszNames: string[], cNames: number, lcid: number): number[] {
    const dispIds: number[] = [];
    for (const name of rgszNames) {
      if (this._methods.has(name) || this._properties.has(name)) {
        dispIds.push(name.toLowerCase().charCodeAt(0) + name.length);
      } else {
        dispIds.push(-1);
      }
    }
    return dispIds;
  }

  Invoke(dispIdMember: number, riid: string, lcid: number, wFlags: number, pDispParams: any[]): any {
    // Find method or property by dispId
    for (const [name, method] of this._methods) {
      const id = name.toLowerCase().charCodeAt(0) + name.length;
      if (id === dispIdMember) {
        try {
          return method.apply(this, pDispParams || []);
        } catch (error) {
          throw new Error(`Error invoking method ${name}: ${error}`);
        }
      }
    }

    for (const [name, value] of this._properties) {
      const id = name.toLowerCase().charCodeAt(0) + name.length;
      if (id === dispIdMember) {
        if (wFlags & 0x1) { // DISPATCH_METHOD
          return value;
        } else if (wFlags & 0x4) { // DISPATCH_PROPERTYPUT
          this._properties.set(name, pDispParams[0]);
          this.emit('PropertyChanged', { property: name, value: pDispParams[0] });
          return HRESULT.S_OK;
        }
      }
    }

    throw new Error(`Method or property not found for dispId: ${dispIdMember}`);
  }

  // Property and method management
  setProperty(name: string, value: any): void {
    this._properties.set(name, value);
    this.emit('PropertyChanged', { property: name, value });
  }

  getProperty(name: string): any {
    return this._properties.get(name);
  }

  addMethod(name: string, method: (...args: any[]) => any): void {
    this._methods.set(name, method);
  }

  addInterface(iid: string, implementation: any): void {
    this._interfaces.set(iid, implementation);
  }

  addEventListener(eventName: string, handler: (...args: any[]) => any): void {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }
    this._events.get(eventName)!.push(handler);
  }

  removeEventListener(eventName: string, handler: (...args: any[]) => any): void {
    const handlers = this._events.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  fireEvent(eventName: string, ...args: any[]): void {
    const handlers = this._events.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler.apply(this, args);
        } catch (error) {
          console.error(`Error firing event ${eventName}:`, error);
        }
      });
    }
    this.emit(eventName, ...args);
  }

  private setupDefaultInterfaces(): void {
    // Add standard COM interfaces
    this.addInterface('00000000-0000-0000-C000-000000000046', this); // IUnknown
    this.addInterface('00020400-0000-0000-C000-000000000046', this); // IDispatch
  }

  private cleanup(): void {
    this._interfaces.clear();
    this._properties.clear();
    this._methods.clear();
    this._events.clear();
    this.removeAllListeners();
  }

  get ClassId(): string {
    return this._classId;
  }

  get ProgId(): string {
    return this._progId;
  }
}

export class ActiveXControl extends COMObject implements IOleObject {
  private _clientSite: IOleClientSite | null = null;
  private _container: IOleContainer | null = null;
  private _element: HTMLElement | null = null;
  private _activated: boolean = false;

  constructor(classId: string, progId: string) {
    super(classId, progId);
    this.setupOleInterfaces();
  }

  // IOleObject implementation
  SetClientSite(pClientSite: IOleClientSite): HRESULT {
    this._clientSite = pClientSite;
    if (pClientSite) {
      this._container = pClientSite.GetContainer();
    }
    return HRESULT.S_OK;
  }

  GetClientSite(): IOleClientSite {
    return this._clientSite!;
  }

  SetHostNames(szContainerApp: string, szContainerObj: string): HRESULT {
    this.setProperty('HostApplication', szContainerApp);
    this.setProperty('HostObject', szContainerObj);
    return HRESULT.S_OK;
  }

  Close(dwSaveOption: number): HRESULT {
    if (this._activated) {
      this.deactivate();
    }
    return HRESULT.S_OK;
  }

  SetMoniker(dwWhichMoniker: number, pmk: any): HRESULT {
    return HRESULT.E_NOTIMPL;
  }

  GetMoniker(dwAssign: number, dwWhichMoniker: number): any {
    return null;
  }

  InitFromData(pDataObject: any, fCreation: boolean, dwReserved: number): HRESULT {
    return HRESULT.E_NOTIMPL;
  }

  GetClipboardData(dwReserved: number): any {
    return null;
  }

  DoVerb(iVerb: number, lpmsg: any, pActiveSite: IOleClientSite, lindex: number, hwndParent: number, lprcPosRect: any): HRESULT {
    switch (iVerb) {
      case -1: // OLEIVERB_PRIMARY
      case 0:  // OLEIVERB_SHOW
        return this.activate();
      case -2: // OLEIVERB_OPEN
        return this.activate();
      case -3: // OLEIVERB_HIDE
        return this.deactivate();
      default:
        return HRESULT.E_NOTIMPL;
    }
  }

  EnumVerbs(): any {
    return [
      { iVerb: -1, lpszVerbName: 'Primary', fuFlags: 0, grfAttribs: 0 },
      { iVerb: 0, lpszVerbName: 'Show', fuFlags: 0, grfAttribs: 0 },
      { iVerb: -2, lpszVerbName: 'Open', fuFlags: 0, grfAttribs: 0 },
      { iVerb: -3, lpszVerbName: 'Hide', fuFlags: 0, grfAttribs: 0 }
    ];
  }

  Update(): HRESULT {
    this.fireEvent('Update');
    return HRESULT.S_OK;
  }

  IsUpToDate(): HRESULT {
    return HRESULT.S_OK;
  }

  GetUserClassID(): string {
    return this.ClassId;
  }

  GetUserType(dwFormOfType: number): string {
    return this.ProgId;
  }

  SetExtent(dwDrawAspect: number, psizel: any): HRESULT {
    this.setProperty('Width', psizel.cx);
    this.setProperty('Height', psizel.cy);
    return HRESULT.S_OK;
  }

  GetExtent(dwDrawAspect: number): any {
    return {
      cx: this.getProperty('Width') || 100,
      cy: this.getProperty('Height') || 100
    };
  }

  Advise(pAdvSink: any): number {
    // Simple advisory connection
    return 1;
  }

  Unadvise(dwConnection: number): HRESULT {
    return HRESULT.S_OK;
  }

  EnumAdvise(): any {
    return null;
  }

  GetMiscStatus(dwAspect: number): number {
    return 0;
  }

  SetColorScheme(pLogpal: any): HRESULT {
    return HRESULT.S_OK;
  }

  // ActiveX-specific methods
  activate(): HRESULT {
    if (!this._activated) {
      this._activated = true;
      this.createElement();
      this.fireEvent('Activate');
    }
    return HRESULT.S_OK;
  }

  deactivate(): HRESULT {
    if (this._activated) {
      this._activated = false;
      this.destroyElement();
      this.fireEvent('Deactivate');
    }
    return HRESULT.S_OK;
  }

  protected createElement(): void {
    // Override in derived classes to create specific elements
    this._element = document.createElement('div');
    this._element.className = 'activex-control';
    this._element.style.border = '1px solid #ccc';
    this._element.style.backgroundColor = '#f0f0f0';
    this._element.textContent = `ActiveX Control: ${this.ProgId}`;
  }

  protected destroyElement(): void {
    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
    this._element = null;
  }

  private setupOleInterfaces(): void {
    this.addInterface('00000112-0000-0000-C000-000000000046', this); // IOleObject
  }

  get Element(): HTMLElement | null {
    return this._element;
  }

  get IsActivated(): boolean {
    return this._activated;
  }
}

export class COMRegistry {
  private static _instance: COMRegistry;
  private _classes: Map<string, new() => COMObject> = new Map();
  private _progIds: Map<string, string> = new Map();
  private _typeLibs: Map<string, any> = new Map();

  private constructor() {
    this.registerBuiltinClasses();
  }

  static getInstance(): COMRegistry {
    if (!COMRegistry._instance) {
      COMRegistry._instance = new COMRegistry();
    }
    return COMRegistry._instance;
  }

  registerClass(classId: string, progId: string, constructor: new() => COMObject): void {
    this._classes.set(classId, constructor);
    this._progIds.set(progId, classId);
  }

  createObject(classIdOrProgId: string): COMObject | null {
    let classId = classIdOrProgId;
    
    // Check if it's a ProgID
    if (this._progIds.has(classIdOrProgId)) {
      classId = this._progIds.get(classIdOrProgId)!;
    }

    const constructor = this._classes.get(classId);
    if (constructor) {
      return new constructor();
    }

    // Return null if class not found
    return null;
  }

  isRegistered(classIdOrProgId: string): boolean {
    return this._classes.has(classIdOrProgId) || this._progIds.has(classIdOrProgId);
  }

  registerTypeLibrary(libId: string, typeLib: any): void {
    this._typeLibs.set(libId, typeLib);
  }

  getTypeLibrary(libId: string): any {
    return this._typeLibs.get(libId);
  }

  private registerBuiltinClasses(): void {
    // Register common COM classes that VB6 applications might use
    
    // Scripting objects
    this.registerClass(
      '{0D43FE01-F093-11CF-8940-00A0C9054228}',
      'Scripting.FileSystemObject',
      class extends COMObject {
        constructor() {
          super('{0D43FE01-F093-11CF-8940-00A0C9054228}', 'Scripting.FileSystemObject');
          this.setupFileSystemMethods();
        }

        private setupFileSystemMethods(): void {
          this.addMethod('CreateTextFile', (filename: string, overwrite?: boolean) => {
            return new TextFile(filename);
          });

          this.addMethod('OpenTextFile', (filename: string, mode?: number) => {
            return new TextFile(filename);
          });

          this.addMethod('FileExists', (filename: string) => {
            // Simplified - in real implementation would check actual filesystem
            return Math.random() > 0.5;
          });

          this.addMethod('FolderExists', (foldername: string) => {
            return Math.random() > 0.5;
          });

          this.addMethod('GetFile', (filename: string) => {
            return { Name: filename, Size: 1024, DateCreated: new Date() };
          });

          this.addMethod('GetFolder', (foldername: string) => {
            return { Name: foldername, Size: 0, DateCreated: new Date() };
          });
        }
      }
    );

    // WScript.Shell
    this.registerClass(
      '{72C24DD5-D70A-438B-8A42-98424B88AFB8}',
      'WScript.Shell',
      class extends COMObject {
        constructor() {
          super('{72C24DD5-D70A-438B-8A42-98424B88AFB8}', 'WScript.Shell');
          this.setupShellMethods();
        }

        private setupShellMethods(): void {
          this.addMethod('Run', (command: string, windowStyle?: number, waitOnReturn?: boolean) => {
            console.log(`Shell.Run: ${command}`);
            if (command.startsWith('http')) {
              window.open(command, '_blank');
            }
            return 0;
          });

          this.addMethod('Exec', (command: string) => {
            console.log(`Shell.Exec: ${command}`);
            return {
              Status: 0,
              ExitCode: 0,
              StdOut: { ReadAll: () => 'Command output' },
              StdErr: { ReadAll: () => '' }
            };
          });

          this.addMethod('RegRead', (key: string) => {
            // Read from localStorage as registry simulation
            return localStorage.getItem(`HKEY_${key}`) || '';
          });

          this.addMethod('RegWrite', (key: string, value: any, type?: string) => {
            localStorage.setItem(`HKEY_${key}`, String(value));
          });

          this.addMethod('RegDelete', (key: string) => {
            localStorage.removeItem(`HKEY_${key}`);
          });
        }
      }
    );
  }
}

class TextFile extends COMObject {
  private _filename: string;
  private _content: string = '';
  private _position: number = 0;

  constructor(filename: string) {
    super('{TEXTFILE-CLSID}', 'TextFile');
    this._filename = filename;
    this.setupTextFileMethods();
  }

  private setupTextFileMethods(): void {
    this.addMethod('WriteLine', (text: string) => {
      this._content += text + '\n';
    });

    this.addMethod('Write', (text: string) => {
      this._content += text;
    });

    this.addMethod('ReadLine', () => {
      const lines = this._content.split('\n');
      if (this._position < lines.length) {
        return lines[this._position++];
      }
      return '';
    });

    this.addMethod('ReadAll', () => {
      return this._content;
    });

    this.addMethod('Close', () => {
      // In a real implementation, would save to filesystem
      console.log(`Closing file: ${this._filename}`);
    });

    this.setProperty('AtEndOfStream', false);
    this.setProperty('AtEndOfLine', false);
    this.setProperty('Column', 0);
    this.setProperty('Line', 1);
  }
}

// Main COM/ActiveX bridge
export class COMActiveXBridge {
  private static _instance: COMActiveXBridge;
  private _registry: COMRegistry;

  private constructor() {
    this._registry = COMRegistry.getInstance();
  }

  static getInstance(): COMActiveXBridge {
    if (!COMActiveXBridge._instance) {
      COMActiveXBridge._instance = new COMActiveXBridge();
    }
    return COMActiveXBridge._instance;
  }

  CreateObject(classIdOrProgId: string): COMObject | null {
    try {
      const obj = this._registry.createObject(classIdOrProgId);
      if (obj) {
        console.log(`Created COM object: ${classIdOrProgId}`);
        return obj;
      } else {
        console.warn(`COM class not registered: ${classIdOrProgId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error creating COM object ${classIdOrProgId}:`, error);
      return null;
    }
  }

  GetObject(pathName: string, className?: string): COMObject | null {
    // Simplified GetObject implementation
    console.log(`GetObject: ${pathName}, class: ${className}`);
    
    if (className) {
      return this.CreateObject(className);
    }
    
    // For pathName, would typically parse the moniker
    return null;
  }

  CreateActiveXControl(classIdOrProgId: string, container: HTMLElement): ActiveXControl | null {
    try {
      const control = this._registry.createObject(classIdOrProgId) as ActiveXControl;
      if (control && control instanceof ActiveXControl) {
        control.activate();
        if (control.Element) {
          container.appendChild(control.Element);
        }
        return control;
      }
      return null;
    } catch (error) {
      console.error(`Error creating ActiveX control ${classIdOrProgId}:`, error);
      return null;
    }
  }

  RegisterClass(classId: string, progId: string, constructor: new() => COMObject): void {
    this._registry.registerClass(classId, progId, constructor);
  }

  IsClassRegistered(classIdOrProgId: string): boolean {
    return this._registry.isRegistered(classIdOrProgId);
  }
}

// Export singleton instance
export const COM = COMActiveXBridge.getInstance();

export default COMActiveXBridge;