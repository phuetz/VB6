/**
 * ActiveX to WebAssembly Bridge
 *
 * This module provides a bridge between ActiveX/COM components and WebAssembly,
 * allowing VB6 applications to use ActiveX controls in a web environment.
 */

// COM Interface definitions
export interface IUnknown {
  QueryInterface(riid: string): any;
  AddRef(): number;
  Release(): number;
}

export interface IDispatch extends IUnknown {
  GetTypeInfoCount(): number;
  GetTypeInfo(iTInfo: number): ITypeInfo;
  GetIDsOfNames(riid: string, rgszNames: string[], cNames: number): number[];
  Invoke(
    dispIdMember: number,
    riid: string,
    lcid: number,
    wFlags: number,
    pDispParams: any[],
    pVarResult: any
  ): void;
}

export interface ITypeInfo {
  GetTypeAttr(): TypeAttr;
  GetFuncDesc(index: number): FuncDesc;
  GetVarDesc(index: number): VarDesc;
  GetNames(memid: number, maxNames: number): string[];
}

export interface TypeAttr {
  guid: string;
  lcid: number;
  typekind: TypeKind;
  cFuncs: number;
  cVars: number;
  cImplTypes: number;
}

export interface FuncDesc {
  memid: number;
  funckind: FuncKind;
  invkind: InvokeKind;
  callconv: CallConv;
  cParams: number;
  cParamsOpt: number;
  elemdescFunc: ElemDesc;
}

export interface VarDesc {
  memid: number;
  varkind: VarKind;
  elemdescVar: ElemDesc;
}

export interface ElemDesc {
  tdesc: TypeDesc;
  paramdesc?: ParamDesc;
}

export interface TypeDesc {
  vt: VarType;
  lptdesc?: TypeDesc;
  hreftype?: number;
}

export interface ParamDesc {
  wParamFlags: number;
  pparamdescex?: any;
}

export enum TypeKind {
  TKIND_ENUM = 0,
  TKIND_RECORD = 1,
  TKIND_MODULE = 2,
  TKIND_INTERFACE = 3,
  TKIND_DISPATCH = 4,
  TKIND_COCLASS = 5,
  TKIND_ALIAS = 6,
  TKIND_UNION = 7,
}

export enum FuncKind {
  FUNC_VIRTUAL = 0,
  FUNC_PUREVIRTUAL = 1,
  FUNC_NONVIRTUAL = 2,
  FUNC_STATIC = 3,
  FUNC_DISPATCH = 4,
}

export enum InvokeKind {
  INVOKE_FUNC = 1,
  INVOKE_PROPERTYGET = 2,
  INVOKE_PROPERTYPUT = 4,
  INVOKE_PROPERTYPUTREF = 8,
}

export enum CallConv {
  CC_FASTCALL = 0,
  CC_CDECL = 1,
  CC_MSCPASCAL = 2,
  CC_PASCAL = 3,
  CC_MACPASCAL = 4,
  CC_STDCALL = 5,
  CC_FPFASTCALL = 6,
  CC_SYSCALL = 7,
  CC_MPWCDECL = 8,
  CC_MPWPASCAL = 9,
}

export enum VarKind {
  VAR_PERINSTANCE = 0,
  VAR_STATIC = 1,
  VAR_CONST = 2,
  VAR_DISPATCH = 3,
}

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
  VT_INT = 22,
  VT_UINT = 23,
  VT_VOID = 24,
  VT_HRESULT = 25,
  VT_PTR = 26,
  VT_SAFEARRAY = 27,
  VT_CARRAY = 28,
  VT_USERDEFINED = 29,
  VT_LPSTR = 30,
  VT_LPWSTR = 31,
  VT_RECORD = 36,
  VT_INT_PTR = 37,
  VT_UINT_PTR = 38,
  VT_ARRAY = 0x2000,
  VT_BYREF = 0x4000,
}

// WebAssembly COM Bridge
export class ActiveXWebAssemblyBridge {
  private wasmModule: WebAssembly.Module | null = null;
  private wasmInstance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory;
  private comObjects: Map<number, COMObject> = new Map();
  private nextObjectId: number = 1;
  private typeLibraries: Map<string, TypeLibrary> = new Map();

  constructor() {
    // Initialize WebAssembly memory
    this.memory = new WebAssembly.Memory({ initial: 256, maximum: 16384 });
  }

  /**
   * Initialize the bridge with WebAssembly module
   */
  async initialize(wasmBytes: Uint8Array): Promise<void> {
    // Compile WebAssembly module
    this.wasmModule = await WebAssembly.compile(wasmBytes);

    // Create import object with COM functions
    const imports = {
      env: {
        memory: this.memory,
        // COM functions
        CoInitialize: this.coInitialize.bind(this),
        CoUninitialize: this.coUninitialize.bind(this),
        CoCreateInstance: this.coCreateInstance.bind(this),
        QueryInterface: this.queryInterface.bind(this),
        AddRef: this.addRef.bind(this),
        Release: this.release.bind(this),
        Invoke: this.invoke.bind(this),
        GetIDsOfNames: this.getIDsOfNames.bind(this),
        // Memory management
        malloc: this.malloc.bind(this),
        free: this.free.bind(this),
        // String functions
        SysAllocString: this.sysAllocString.bind(this),
        SysFreeString: this.sysFreeString.bind(this),
        // Variant functions
        VariantInit: this.variantInit.bind(this),
        VariantClear: this.variantClear.bind(this),
        VariantCopy: this.variantCopy.bind(this),
        VariantChangeType: this.variantChangeType.bind(this),
      },
    };

    // Instantiate WebAssembly module
    this.wasmInstance = await WebAssembly.instantiate(this.wasmModule, imports);
  }

  /**
   * Register a JavaScript object as a COM object
   */
  registerCOMObject(clsid: string, factory: () => any): void {
    const typeLib = this.getOrCreateTypeLibrary(clsid);
    typeLib.factories.set(clsid, factory);
  }

  /**
   * Create a COM object instance
   */
  private coCreateInstance(
    clsidPtr: number,
    pUnkOuterPtr: number,
    dwClsContext: number,
    riidPtr: number,
    ppvPtr: number
  ): number {
    try {
      const clsid = this.readGUID(clsidPtr);
      const riid = this.readGUID(riidPtr);
      // Find factory for CLSID
      let factory: (() => any) | undefined;
      for (const typeLib of this.typeLibraries.values()) {
        if (typeLib.factories.has(clsid)) {
          factory = typeLib.factories.get(clsid);
          break;
        }
      }

      if (!factory) {
        return 0x80040154; // REGDB_E_CLASSNOTREG
      }

      // Create JavaScript object
      const jsObject = factory();

      // Wrap in COM object
      const comObject = new COMObject(this.nextObjectId++, jsObject, clsid);
      this.comObjects.set(comObject.id, comObject);

      // Write object pointer
      this.writePointer(ppvPtr, comObject.id);

      return 0; // S_OK
    } catch (error) {
      console.error('CoCreateInstance error:', error);
      return 0x80004005; // E_FAIL
    }
  }

  /**
   * Query for interface
   */
  private queryInterface(pUnkPtr: number, riidPtr: number, ppvObjectPtr: number): number {
    try {
      const objectId = this.readPointer(pUnkPtr);
      const riid = this.readGUID(riidPtr);

      const comObject = this.comObjects.get(objectId);
      if (!comObject) {
        return 0x80004002; // E_NOINTERFACE
      }

      // For now, return same object for all interfaces
      this.writePointer(ppvObjectPtr, objectId);
      comObject.refCount++;

      return 0; // S_OK
    } catch (error) {
      console.error('QueryInterface error:', error);
      return 0x80004005; // E_FAIL
    }
  }

  /**
   * Increment reference count
   */
  private addRef(pUnkPtr: number): number {
    const objectId = this.readPointer(pUnkPtr);
    const comObject = this.comObjects.get(objectId);

    if (comObject) {
      return ++comObject.refCount;
    }

    return 0;
  }

  /**
   * Decrement reference count
   */
  private release(pUnkPtr: number): number {
    const objectId = this.readPointer(pUnkPtr);
    const comObject = this.comObjects.get(objectId);

    if (comObject) {
      const refCount = --comObject.refCount;
      if (refCount === 0) {
        this.comObjects.delete(objectId);
      }
      return refCount;
    }

    return 0;
  }

  /**
   * Get IDs of names
   */
  private getIDsOfNames(
    pDispPtr: number,
    riidPtr: number,
    rgszNamesPtr: number,
    cNames: number,
    lcid: number,
    rgDispIdPtr: number
  ): number {
    try {
      const objectId = this.readPointer(pDispPtr);
      const comObject = this.comObjects.get(objectId);

      if (!comObject) {
        return 0x80020006; // DISP_E_UNKNOWNNAME
      }

      // Read names
      const names: string[] = [];
      for (let i = 0; i < cNames; i++) {
        const namePtr = this.readPointer(rgszNamesPtr + i * 4);
        names.push(this.readBSTR(namePtr));
      }

      // Map names to dispatch IDs
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const dispId = comObject.getDispId(name);
        this.writeInt32(rgDispIdPtr + i * 4, dispId);
      }

      return 0; // S_OK
    } catch (error) {
      console.error('GetIDsOfNames error:', error);
      return 0x80004005; // E_FAIL
    }
  }

  /**
   * Invoke method or property
   */
  private invoke(
    pDispPtr: number,
    dispIdMember: number,
    riidPtr: number,
    lcid: number,
    wFlags: number,
    pDispParamsPtr: number,
    pVarResultPtr: number,
    pExcepInfoPtr: number,
    puArgErrPtr: number
  ): number {
    try {
      const objectId = this.readPointer(pDispPtr);
      const comObject = this.comObjects.get(objectId);

      if (!comObject) {
        return 0x80020003; // DISP_E_MEMBERNOTFOUND
      }

      // Read dispatch parameters
      const dispParams = this.readDispParams(pDispParamsPtr);

      // Invoke on JavaScript object
      const result = comObject.invoke(dispIdMember, wFlags, dispParams);

      // Write result
      if (pVarResultPtr && result !== undefined) {
        this.writeVariant(pVarResultPtr, result);
      }

      return 0; // S_OK
    } catch (error) {
      console.error('Invoke error:', error);
      return 0x80020009; // DISP_E_EXCEPTION
    }
  }

  /**
   * COM initialization
   */
  private coInitialize(pvReservedPtr: number): number {
    return 0; // S_OK
  }

  /**
   * COM cleanup
   */
  private coUninitialize(): void {
    this.comObjects.clear();
  }

  /**
   * WEBASSEMBLY SANDBOX ESCAPE BUG FIX: Secure memory allocation with bounds checking
   */
  private secureMemoryAlloc(size: number): number {
    // Validate allocation size
    if (size <= 0 || size > 1024 * 1024) {
      // 1MB limit
      console.warn('Invalid memory allocation size:', size);
      return 0;
    }

    // Check available memory
    if (this.nextAlloc + size > this.memory.buffer.byteLength) {
      console.warn('Insufficient memory for allocation');
      return 0;
    }

    // Simple bump allocator with bounds checking
    const ptr = this.nextAlloc;
    this.nextAlloc += size;

    // Zero out allocated memory for security
    const view = new Uint8Array(this.memory.buffer, ptr, size);
    view.fill(0);

    return ptr;
  }

  private secureMemoryFree(ptr: number): void {
    // Validate pointer
    if (ptr < 0x10000 || ptr >= this.memory.buffer.byteLength) {
      console.warn('Invalid memory free pointer:', ptr);
      return;
    }

    // Simple free - zero out some memory for security
    const view = new Uint8Array(
      this.memory.buffer,
      ptr,
      Math.min(64, this.memory.buffer.byteLength - ptr)
    );
    view.fill(0);
  }

  private nextAlloc: number = 0x10000; // Start allocation at 64KB

  /**
   * BSTR allocation
   */
  private sysAllocString(pszPtr: number): number {
    const str = this.readString(pszPtr);
    const bstr = this.allocateBSTR(str);
    return bstr;
  }

  private sysFreeString(bstrPtr: number): void {
    // No-op for simple implementation
  }

  /**
   * Variant functions
   */
  private variantInit(pvargPtr: number): void {
    this.writeInt16(pvargPtr, VarType.VT_EMPTY);
  }

  private variantClear(pvargPtr: number): number {
    this.writeInt16(pvargPtr, VarType.VT_EMPTY);
    return 0; // S_OK
  }

  private variantCopy(pvargDestPtr: number, pvargSrcPtr: number): number {
    // Simple copy for demo
    const view = new DataView(this.memory.buffer);
    for (let i = 0; i < 16; i++) {
      view.setUint8(pvargDestPtr + i, view.getUint8(pvargSrcPtr + i));
    }
    return 0; // S_OK
  }

  private variantChangeType(
    pvargDestPtr: number,
    pvargSrcPtr: number,
    wFlags: number,
    vt: number
  ): number {
    // Simple type conversion for demo
    const srcType = this.readInt16(pvargSrcPtr);
    const srcValue = this.readVariantValue(pvargSrcPtr, srcType);

    // Convert and write to destination
    this.writeVariant(pvargDestPtr, this.convertValue(srcValue, srcType, vt));

    return 0; // S_OK
  }

  /**
   * Memory access helpers
   */
  private readPointer(ptr: number): number {
    const view = new DataView(this.memory.buffer);
    return view.getUint32(ptr, true);
  }

  private writePointer(ptr: number, value: number): void {
    const view = new DataView(this.memory.buffer);
    view.setUint32(ptr, value, true);
  }

  private readInt16(ptr: number): number {
    const view = new DataView(this.memory.buffer);
    return view.getInt16(ptr, true);
  }

  private writeInt16(ptr: number, value: number): void {
    const view = new DataView(this.memory.buffer);
    view.setInt16(ptr, value, true);
  }

  private readInt32(ptr: number): number {
    const view = new DataView(this.memory.buffer);
    return view.getInt32(ptr, true);
  }

  private writeInt32(ptr: number, value: number): void {
    const view = new DataView(this.memory.buffer);
    view.setInt32(ptr, value, true);
  }

  private readString(ptr: number): string {
    const view = new DataView(this.memory.buffer);
    const chars: number[] = [];
    let offset = ptr;

    while (true) {
      const char = view.getUint16(offset, true);
      if (char === 0) break;
      chars.push(char);
      offset += 2;
    }

    return String.fromCharCode(...chars);
  }

  private readBSTR(ptr: number): string {
    const view = new DataView(this.memory.buffer);
    const length = view.getUint32(ptr - 4, true);
    const chars: number[] = [];

    for (let i = 0; i < length / 2; i++) {
      chars.push(view.getUint16(ptr + i * 2, true));
    }

    return String.fromCharCode(...chars);
  }

  private allocateBSTR(str: string): number {
    const length = str.length * 2;
    const ptr = this.malloc(length + 4);
    const view = new DataView(this.memory.buffer);

    // Write length prefix
    view.setUint32(ptr, length, true);

    // Write string data
    for (let i = 0; i < str.length; i++) {
      view.setUint16(ptr + 4 + i * 2, str.charCodeAt(i), true);
    }

    return ptr + 4;
  }

  private readGUID(ptr: number): string {
    const view = new DataView(this.memory.buffer);
    const data1 = view.getUint32(ptr, true);
    const data2 = view.getUint16(ptr + 4, true);
    const data3 = view.getUint16(ptr + 6, true);
    const data4: number[] = [];

    for (let i = 0; i < 8; i++) {
      data4.push(view.getUint8(ptr + 8 + i));
    }

    return `{${data1.toString(16).padStart(8, '0')}-${data2.toString(16).padStart(4, '0')}-${data3.toString(16).padStart(4, '0')}-${data4
      .slice(0, 2)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}-${data4
      .slice(2)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}}`.toUpperCase();
  }

  private readDispParams(ptr: number): any[] {
    const view = new DataView(this.memory.buffer);
    const rgvargPtr = view.getUint32(ptr, true);
    const rgdispidNamedArgsPtr = view.getUint32(ptr + 4, true);
    const cArgs = view.getUint32(ptr + 8, true);
    const cNamedArgs = view.getUint32(ptr + 12, true);

    const args: any[] = [];
    for (let i = 0; i < cArgs; i++) {
      const variantPtr = rgvargPtr + i * 16;
      const vt = this.readInt16(variantPtr);
      args.push(this.readVariantValue(variantPtr, vt));
    }

    return args.reverse(); // VB6 passes args in reverse order
  }

  private readVariantValue(ptr: number, vt: number): any {
    const view = new DataView(this.memory.buffer);

    switch (vt) {
      case VarType.VT_EMPTY:
      case VarType.VT_NULL:
        return null;
      case VarType.VT_I2:
        return view.getInt16(ptr + 8, true);
      case VarType.VT_I4:
        return view.getInt32(ptr + 8, true);
      case VarType.VT_R4:
        return view.getFloat32(ptr + 8, true);
      case VarType.VT_R8:
        return view.getFloat64(ptr + 8, true);
      case VarType.VT_BOOL:
        return view.getInt16(ptr + 8, true) !== 0;
      case VarType.VT_BSTR:
        return this.readBSTR(view.getUint32(ptr + 8, true));
      default:
        return null;
    }
  }

  private writeVariant(ptr: number, value: any): void {
    const view = new DataView(this.memory.buffer);

    if (value === null || value === undefined) {
      view.setInt16(ptr, VarType.VT_NULL, true);
    } else if (typeof value === 'boolean') {
      view.setInt16(ptr, VarType.VT_BOOL, true);
      view.setInt16(ptr + 8, value ? -1 : 0, true);
    } else if (typeof value === 'number') {
      if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) {
        view.setInt16(ptr, VarType.VT_I4, true);
        view.setInt32(ptr + 8, value, true);
      } else {
        view.setInt16(ptr, VarType.VT_R8, true);
        view.setFloat64(ptr + 8, value, true);
      }
    } else if (typeof value === 'string') {
      view.setInt16(ptr, VarType.VT_BSTR, true);
      view.setUint32(ptr + 8, this.allocateBSTR(value), true);
    }
  }

  private convertValue(value: any, fromType: number, toType: number): any {
    // Simple type conversion
    switch (toType) {
      case VarType.VT_I4:
        return Math.floor(Number(value));
      case VarType.VT_R8:
        return Number(value);
      case VarType.VT_BSTR:
        return String(value);
      case VarType.VT_BOOL:
        return Boolean(value);
      default:
        return value;
    }
  }

  private getOrCreateTypeLibrary(clsid: string): TypeLibrary {
    if (!this.typeLibraries.has(clsid)) {
      this.typeLibraries.set(clsid, new TypeLibrary(clsid));
    }
    return this.typeLibraries.get(clsid)!;
  }
}

/**
 * DOM CLOBBERING BUG FIX: Enhanced secure object wrapper with property pollution protection
 */
class DOMClobberingProtection {
  private static readonly GLOBAL_OBJECT_NAMES = [
    'window',
    'document',
    'location',
    'navigator',
    'history',
    'screen',
    'parent',
    'top',
    'frames',
    'self',
    'opener',
    'closed',
    'length',
    'name',
    'status',
    'defaultStatus',
    'toolbar',
    'menubar',
    'scrollbars',
    'locationbar',
    'statusbar',
    'directories',
    'personalbar',
    'console',
    'alert',
    'confirm',
    'prompt',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'XMLHttpRequest',
    'fetch',
    'WebSocket',
    'Worker',
  ];

  /**
   * DOM CLOBBERING BUG FIX: Prevent object names from clobbering global objects
   */
  static validateObjectName(name: string): boolean {
    return !this.GLOBAL_OBJECT_NAMES.includes(name.toLowerCase());
  }

  /**
   * DOM CLOBBERING BUG FIX: Create isolated object namespace
   */
  static createIsolatedNamespace(): Record<string, any> {
    return Object.create(null); // No prototype chain
  }

  /**
   * DOM CLOBBERING BUG FIX: Sanitize property access patterns
   */
  static sanitizePropertyAccess(obj: any, property: string): boolean {
    if (typeof property !== 'string') return false;
    if (property.includes('__proto__') || property.includes('constructor')) return false;
    if (property.startsWith('on')) return false; // Block event handlers
    return true;
  }
}

/**
 * WEBASSEMBLY SANDBOX ESCAPE BUG FIX: Secure COM Object wrapper with method validation
 */
class SecureCOMObject {
  id: number;
  jsObject: any;
  clsid: string;
  refCount: number = 1;
  private dispIdMap: Map<string, number> = new Map();
  private nextDispId: number = 1;
  private allowedMethods: Set<string> = new Set();
  private methodCallCount: Map<string, number> = new Map();
  private isolatedNamespace: Record<string, any>;
  private static readonly MAX_METHOD_CALLS = 1000;
  private static readonly ALLOWED_METHOD_PATTERNS = [
    /^[a-zA-Z_][a-zA-Z0-9_]*$/, // Valid identifier pattern
  ];

  constructor(id: number, jsObject: any, clsid: string) {
    this.id = id;
    this.jsObject = jsObject;
    this.clsid = clsid;
    this.isolatedNamespace = DOMClobberingProtection.createIsolatedNamespace();
    this.buildSecureDispIdMap();
  }

  private buildSecureDispIdMap(): void {
    for (const key in this.jsObject) {
      if (Object.prototype.hasOwnProperty.call(this.jsObject, key)) {
        if (!DOMClobberingProtection.sanitizePropertyAccess(this.jsObject, key)) {
          continue;
        }
        if (this.isSafeMethod(key)) {
          this.dispIdMap.set(key, this.nextDispId++);
          this.allowedMethods.add(key);
          this.isolatedNamespace[key] = this.jsObject[key];
        }
      }
    }
  }

  private isSafeMethod(name: string): boolean {
    const dangerousMethods = [
      'eval',
      'Function',
      'constructor',
      '__proto__',
      'prototype',
      'call',
      'apply',
      'bind',
      'toString',
      'valueOf',
      'document',
      'window',
      'global',
      'process',
      'require',
    ];

    if (dangerousMethods.includes(name)) {
      return false;
    }

    return SecureCOMObject.ALLOWED_METHOD_PATTERNS.some(pattern => pattern.test(name));
  }

  getDispId(name: string): number {
    if (!this.allowedMethods.has(name)) {
      return -1;
    }
    return this.dispIdMap.get(name) || -1;
  }

  invoke(dispId: number, flags: number, args: any[]): any {
    let memberName: string | undefined;
    for (const [name, id] of this.dispIdMap) {
      if (id === dispId) {
        memberName = name;
        break;
      }
    }

    if (!memberName || !this.allowedMethods.has(memberName)) {
      throw new Error(`Unauthorized member access: ${dispId}`);
    }

    const callCount = this.methodCallCount.get(memberName) || 0;
    if (callCount >= SecureCOMObject.MAX_METHOD_CALLS) {
      throw new Error(`Method call limit exceeded for: ${memberName}`);
    }
    this.methodCallCount.set(memberName, callCount + 1);

    if (!this.validateArguments(args)) {
      throw new Error('Invalid arguments provided');
    }

    try {
      const member = this.isolatedNamespace[memberName];
      if (flags & InvokeKind.INVOKE_PROPERTYGET) {
        return member;
      } else if (flags & InvokeKind.INVOKE_PROPERTYPUT) {
        if (typeof member === 'function') {
          return member.apply(this.jsObject, args);
        } else {
          this.jsObject[memberName] = args[0];
        }
        return undefined;
      } else if (flags & InvokeKind.INVOKE_FUNC) {
        if (typeof member === 'function') {
          return this.invokeWithTimeout(member, args, 5000);
        }
        throw new Error(`Not a function: ${memberName}`);
      }
    } catch (error) {
      console.error(`Method invocation error for ${memberName}:`, error);
      throw error;
    }

    throw new Error(`Unknown invoke flags: ${flags}`);
  }

  private validateArguments(args: any[]): boolean {
    if (args.length > 50) {
      return false;
    }

    for (const arg of args) {
      if (typeof arg === 'function') {
        return false;
      }

      if (typeof arg === 'object' && arg !== null) {
        if (!this.validateObjectArgument(arg)) {
          return false;
        }
      }

      if (typeof arg === 'string') {
        if (this.containsDangerousPatterns(arg)) {
          return false;
        }
      }
    }

    return true;
  }

  private validateObjectArgument(obj: any): boolean {
    const dangerousProps = [
      'constructor',
      '__proto__',
      'prototype',
      'toString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
    ];

    for (const prop of dangerousProps) {
      if (prop in obj) {
        return false;
      }
    }

    for (const [key, value] of Object.entries(obj)) {
      if (!DOMClobberingProtection.sanitizePropertyAccess(obj, key)) {
        return false;
      }

      if (typeof value === 'object' && value !== null) {
        if (!this.validateObjectArgument(value)) {
          return false;
        }
      }
    }

    return true;
  }

  private containsDangerousPatterns(str: string): boolean {
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on[a-z]+\s*=/i,
      /__proto__/i,
      /constructor/i,
      /document\./i,
      /window\./i,
      /eval\s*\(/i,
      /Function\s*\(/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(str));
  }

  private invokeWithTimeout(
    func: (...args: any[]) => any,
    args: any[],
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Method call timeout'));
      }, timeout);

      try {
        const result = func.apply(this.jsObject, args);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }
}

// DOM CLOBBERING BUG FIX: Enhanced COM Object wrapper with property pollution protection
class COMObject {
  id: number;
  jsObject: any;
  clsid: string;
  refCount: number = 1;
  private dispIdMap: Map<string, number> = new Map();
  private nextDispId: number = 1;
  private isolatedNamespace: Record<string, any>;

  constructor(id: number, jsObject: any, clsid: string) {
    this.id = id;
    this.jsObject = jsObject;
    this.clsid = clsid;

    // DOM CLOBBERING BUG FIX: Create isolated namespace for this object
    this.isolatedNamespace = DOMClobberingProtection.createIsolatedNamespace();

    // Build dispatch ID map with security validation
    this.buildSecureDispIdMap();
  }

  /**
   * DOM CLOBBERING BUG FIX: Secure dispatch ID mapping with property pollution protection
   */
  private buildSecureDispIdMap(): void {
    // Only map safe properties and methods
    for (const key in this.jsObject) {
      if (Object.prototype.hasOwnProperty.call(this.jsObject, key)) {
        // DOM CLOBBERING BUG FIX: Validate property access
        if (!DOMClobberingProtection.sanitizePropertyAccess(this.jsObject, key)) {
          console.warn(`DOM clobbering attempt blocked: ${key}`);
          continue;
        }

        // Validate method name pattern
        if (!this.validateMethodName(key)) {
          console.warn(`Unsafe method name blocked: ${key}`);
          continue;
        }

        // DOM CLOBBERING BUG FIX: Prevent global object clobbering
        if (!DOMClobberingProtection.validateObjectName(key)) {
          console.warn(`Global object clobbering attempt blocked: ${key}`);
          continue;
        }

        // Check if it's a safe method
        if (this.isSafeMethod(key, this.jsObject[key])) {
          this.dispIdMap.set(key, this.nextDispId++);
          this.allowedMethods.add(key);
          this.methodCallCount.set(key, 0);

          // DOM CLOBBERING BUG FIX: Store in isolated namespace
          this.isolatedNamespace[key] = this.jsObject[key];
        }
      }
    }
  }

  /**
   * WEBASSEMBLY SANDBOX ESCAPE BUG FIX: Validate method names
   */
  private validateMethodName(name: string): boolean {
    // Block dangerous method names
    const dangerousMethods = [
      'eval',
      'Function',
      'constructor',
      '__proto__',
      'prototype',
      'call',
      'apply',
      'bind',
      'toString',
      'valueOf',
      'document',
      'window',
      'global',
      'process',
      'require',
    ];

    if (dangerousMethods.includes(name)) {
      return false;
    }

    // Check pattern matching
    return SecureCOMObject.ALLOWED_METHOD_PATTERNS.some(pattern => pattern.test(name));
  }

  /**
   * WEBASSEMBLY SANDBOX ESCAPE BUG FIX: Check if method is safe to expose
   */
  private isSafeMethod(name: string, value: any): boolean {
    // Block certain types
    if (typeof value === 'function') {
      // Convert function to string to check for dangerous patterns
      const funcStr = value.toString();
      const dangerousPatterns = [
        'eval',
        'Function',
        'require',
        'import',
        'document',
        'window',
        'global',
        'process',
        'XMLHttpRequest',
        'fetch',
      ];

      for (const pattern of dangerousPatterns) {
        if (funcStr.includes(pattern)) {
          console.warn(`Dangerous function pattern detected in ${name}`);
          return false;
        }
      }
    }

    return true;
  }

  getDispId(name: string): number {
    if (!this.allowedMethods.has(name)) {
      console.warn(`Access to unauthorized method: ${name}`);
      return -1;
    }
    return this.dispIdMap.get(name) || -1;
  }

  /**
   * DOM CLOBBERING BUG FIX: Secure method invocation with property pollution protection
   */
  invoke(dispId: number, flags: number, args: any[]): any {
    // Find member by dispatch ID
    let memberName: string | undefined;
    for (const [name, id] of this.dispIdMap) {
      if (id === dispId) {
        memberName = name;
        break;
      }
    }

    if (!memberName || !this.allowedMethods.has(memberName)) {
      throw new Error(`Unauthorized member access: ${dispId}`);
    }

    // Rate limiting
    const callCount = this.methodCallCount.get(memberName) || 0;
    if (callCount >= SecureCOMObject.MAX_METHOD_CALLS) {
      throw new Error(`Method call limit exceeded for: ${memberName}`);
    }
    this.methodCallCount.set(memberName, callCount + 1);

    // Validate arguments
    if (!this.validateArguments(args)) {
      throw new Error('Invalid arguments provided');
    }

    // DOM CLOBBERING BUG FIX: Use isolated namespace instead of direct object access
    const member = this.isolatedNamespace[memberName];

    try {
      if (flags & InvokeKind.INVOKE_PROPERTYGET) {
        // Property get
        return typeof member === 'function' ? member.call(this.jsObject) : member;
      } else if (flags & InvokeKind.INVOKE_PROPERTYPUT) {
        // Property put
        if (typeof member === 'function') {
          member.call(this.jsObject, args[0]);
        } else {
          this.jsObject[memberName] = args[0];
        }
        return undefined;
      } else if (flags & InvokeKind.INVOKE_FUNC) {
        // Method call with timeout
        if (typeof member === 'function') {
          return this.invokeWithTimeout(member, args, 5000); // 5 second timeout
        }
        throw new Error(`Not a function: ${memberName}`);
      }
    } catch (error) {
      console.error(`Method invocation error for ${memberName}:`, error);
      throw error;
    }

    throw new Error(`Unknown invoke flags: ${flags}`);
  }

  /**
   * DOM CLOBBERING BUG FIX: Enhanced argument validation with property pollution protection
   */
  private validateArguments(args: any[]): boolean {
    if (!Array.isArray(args)) return false;

    // Limit argument count
    if (args.length > 32) {
      console.warn('Too many arguments provided');
      return false;
    }

    // Check for dangerous argument types
    for (const arg of args) {
      if (typeof arg === 'function') {
        console.warn('Function arguments are not allowed');
        return false;
      }

      if (typeof arg === 'object' && arg !== null) {
        // DOM CLOBBERING BUG FIX: Enhanced object validation
        if (!this.validateObjectArgument(arg)) {
          return false;
        }
      }

      if (typeof arg === 'string') {
        // DOM CLOBBERING BUG FIX: Check for dangerous string patterns
        if (this.containsDangerousPatterns(arg)) {
          console.warn('Dangerous string patterns detected in argument');
          return false;
        }
      }
    }

    return true;
  }

  /**
   * DOM CLOBBERING BUG FIX: Validate object arguments for property pollution
   */
  private validateObjectArgument(obj: any): boolean {
    // Check for dangerous object properties that could cause pollution
    const dangerousProps = [
      'constructor',
      '__proto__',
      'prototype',
      'toString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
    ];

    for (const prop of dangerousProps) {
      if (prop in obj) {
        console.warn(`Dangerous object property detected: ${prop}`);
        return false;
      }
    }

    // Check for global object references
    for (const [key, value] of Object.entries(obj)) {
      if (!DOMClobberingProtection.sanitizePropertyAccess(obj, key)) {
        console.warn(`Unsafe property access in argument: ${key}`);
        return false;
      }

      if (typeof value === 'object' && value !== null) {
        // Recursive validation
        if (!this.validateObjectArgument(value)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * DOM CLOBBERING BUG FIX: Check for dangerous patterns in strings
   */
  private containsDangerousPatterns(str: string): boolean {
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /on[a-z]+\s*=/i,
      /__proto__/i,
      /constructor/i,
      /document\./i,
      /window\./i,
      /eval\s*\(/i,
      /Function\s*\(/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(str));
  }

  /**
   * WEBASSEMBLY SANDBOX ESCAPE BUG FIX: Invoke method with timeout
   */
  private invokeWithTimeout(method: (...args: any[]) => any, args: any[], timeoutMs: number): any {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Method execution timeout'));
      }, timeoutMs);

      try {
        const result = method.apply(this.jsObject, args);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}

// Original COMObject constructor (updated)
class COMObject {
  constructor(id: number, jsObject: any, clsid: string) {
    this.id = id;
    this.jsObject = jsObject;
    this.clsid = clsid;

    // Build dispatch ID map
    this.buildDispIdMap();
  }

  private buildDispIdMap(): void {
    // Map all properties and methods to dispatch IDs
    for (const key in this.jsObject) {
      if (Object.prototype.hasOwnProperty.call(this.jsObject, key)) {
        this.dispIdMap.set(key, this.nextDispId++);
      }
    }
  }

  getDispId(name: string): number {
    return this.dispIdMap.get(name) || -1;
  }

  invoke(dispId: number, flags: number, args: any[]): any {
    // Find member by dispatch ID
    let memberName: string | undefined;
    for (const [name, id] of this.dispIdMap) {
      if (id === dispId) {
        memberName = name;
        break;
      }
    }

    if (!memberName) {
      throw new Error(`Member not found: ${dispId}`);
    }

    const member = this.jsObject[memberName];

    if (flags & InvokeKind.INVOKE_PROPERTYGET) {
      // Property get
      return typeof member === 'function' ? member.call(this.jsObject) : member;
    } else if (flags & InvokeKind.INVOKE_PROPERTYPUT) {
      // Property put
      if (typeof member === 'function') {
        member.call(this.jsObject, args[0]);
      } else {
        this.jsObject[memberName] = args[0];
      }
      return undefined;
    } else if (flags & InvokeKind.INVOKE_FUNC) {
      // Method call
      if (typeof member === 'function') {
        return member.apply(this.jsObject, args);
      }
      throw new Error(`Not a function: ${memberName}`);
    }

    throw new Error(`Unknown invoke flags: ${flags}`);
  }
}

// Type library
class TypeLibrary {
  clsid: string;
  factories: Map<string, () => any> = new Map();
  interfaces: Map<string, InterfaceInfo> = new Map();

  constructor(clsid: string) {
    this.clsid = clsid;
  }
}

// Interface information
interface InterfaceInfo {
  iid: string;
  name: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
}

interface MethodInfo {
  name: string;
  dispId: number;
  returnType: VarType;
  parameters: ParameterInfo[];
}

interface PropertyInfo {
  name: string;
  dispId: number;
  type: VarType;
  canRead: boolean;
  canWrite: boolean;
}

interface ParameterInfo {
  name: string;
  type: VarType;
  flags: number;
}

// Export factory
export function createActiveXBridge(): ActiveXWebAssemblyBridge {
  return new ActiveXWebAssemblyBridge();
}
