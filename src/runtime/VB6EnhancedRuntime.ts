/**
 * VB6 Enhanced Runtime Functions
 * Additional runtime functions for improved VB6 compatibility
 */

import { errorHandler } from './VB6ErrorHandling';

// ============================================================================
// Sleep and Timer Functions
// ============================================================================

/**
 * Sleep - Pauses execution for specified milliseconds
 * Note: This is an async function in browser environment
 */
export async function Sleep(milliseconds: number): Promise<void> {
  if (milliseconds < 0) {
    throw new Error('Invalid procedure call or argument');
  }
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Wait - Alias for Sleep
 */
export async function Wait(seconds: number): Promise<void> {
  return Sleep(seconds * 1000);
}

/**
 * Pause - Pauses execution until condition is met or timeout
 */
export async function Pause(
  condition: () => boolean,
  timeoutMs: number = 30000,
  checkIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      return false; // Timeout
    }
    await Sleep(checkIntervalMs);
  }

  return true;
}

/**
 * SetInterval wrapper - VB6 style timer
 */
export class VB6Timer {
  private intervalId: number | null = null;
  private _enabled: boolean = false;
  private _interval: number = 1000;
  private _callback: (() => void) | null = null;

  get Enabled(): boolean {
    return this._enabled;
  }
  set Enabled(value: boolean) {
    this._enabled = value;
    if (value) {
      this.start();
    } else {
      this.stop();
    }
  }

  get Interval(): number {
    return this._interval;
  }
  set Interval(value: number) {
    this._interval = Math.max(1, value);
    if (this._enabled) {
      this.stop();
      this.start();
    }
  }

  set OnTimer(callback: () => void) {
    this._callback = callback;
  }

  private start(): void {
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      if (this._callback) {
        try {
          this._callback();
        } catch (error) {
          console.error('Timer error:', error);
        }
      }
    }, this._interval);
  }

  private stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/**
 * Create a new VB6-style timer
 */
export function CreateTimer(interval: number = 1000): VB6Timer {
  const timer = new VB6Timer();
  timer.Interval = interval;
  return timer;
}

/**
 * GetTickCount - Returns milliseconds since system start
 */
export function GetTickCount(): number {
  if (typeof performance !== 'undefined') {
    return Math.floor(performance.now());
  }
  return Date.now();
}

/**
 * TimeGetTime - High-resolution timer (alias for GetTickCount)
 */
export function TimeGetTime(): number {
  return GetTickCount();
}

// ============================================================================
// String Buffer Functions
// ============================================================================

/**
 * VB6 String Buffer for building strings efficiently
 */
export class VB6StringBuilder {
  private buffer: string[] = [];

  Append(value: any): VB6StringBuilder {
    this.buffer.push(String(value));
    return this;
  }

  AppendLine(value?: any): VB6StringBuilder {
    if (value !== undefined) {
      this.buffer.push(String(value));
    }
    this.buffer.push('\r\n');
    return this;
  }

  Insert(index: number, value: any): VB6StringBuilder {
    this.buffer.splice(index, 0, String(value));
    return this;
  }

  Remove(startIndex: number, length: number): VB6StringBuilder {
    const str = this.ToString();
    const newStr = str.substring(0, startIndex) + str.substring(startIndex + length);
    this.buffer = [newStr];
    return this;
  }

  Replace(oldValue: string, newValue: string): VB6StringBuilder {
    const str = this.ToString();
    this.buffer = [str.split(oldValue).join(newValue)];
    return this;
  }

  Clear(): VB6StringBuilder {
    this.buffer = [];
    return this;
  }

  ToString(): string {
    return this.buffer.join('');
  }

  get Length(): number {
    return this.ToString().length;
  }

  get Capacity(): number {
    return this.Length; // No pre-allocation in JS
  }

  set Capacity(value: number) {
    // No-op in JS
  }
}

/**
 * Create a new StringBuilder
 */
export function CreateStringBuilder(initialValue?: string): VB6StringBuilder {
  const sb = new VB6StringBuilder();
  if (initialValue) {
    sb.Append(initialValue);
  }
  return sb;
}

// ============================================================================
// Memory and Buffer Functions
// ============================================================================

/**
 * VB6 Byte Array for binary data handling
 */
export class VB6ByteArray {
  private data: Uint8Array;

  constructor(size: number = 0) {
    this.data = new Uint8Array(size);
  }

  static FromString(str: string): VB6ByteArray {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const arr = new VB6ByteArray(bytes.length);
    arr.data.set(bytes);
    return arr;
  }

  static FromBase64(base64: string): VB6ByteArray {
    const binaryString = atob(base64);
    const arr = new VB6ByteArray(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      arr.data[i] = binaryString.charCodeAt(i);
    }
    return arr;
  }

  get Length(): number {
    return this.data.length;
  }

  GetByte(index: number): number {
    if (index < 0 || index >= this.data.length) {
      throw new Error('Subscript out of range');
    }
    return this.data[index];
  }

  SetByte(index: number, value: number): void {
    if (index < 0 || index >= this.data.length) {
      throw new Error('Subscript out of range');
    }
    this.data[index] = value & 0xff;
  }

  ToString(): string {
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  ToBase64(): string {
    let binaryString = '';
    for (let i = 0; i < this.data.length; i++) {
      binaryString += String.fromCharCode(this.data[i]);
    }
    return btoa(binaryString);
  }

  ToArray(): number[] {
    return Array.from(this.data);
  }

  Resize(newSize: number): void {
    const newData = new Uint8Array(newSize);
    newData.set(this.data.slice(0, Math.min(this.data.length, newSize)));
    this.data = newData;
  }

  Copy(
    destination: VB6ByteArray,
    srcOffset: number = 0,
    destOffset: number = 0,
    length?: number
  ): void {
    const copyLength = length || this.data.length - srcOffset;
    for (let i = 0; i < copyLength; i++) {
      destination.SetByte(destOffset + i, this.GetByte(srcOffset + i));
    }
  }
}

/**
 * CopyMemory - Copies memory between byte arrays
 */
export function CopyMemory(destination: VB6ByteArray, source: VB6ByteArray, length: number): void {
  source.Copy(destination, 0, 0, length);
}

/**
 * FillMemory - Fills byte array with a value
 */
export function FillMemory(destination: VB6ByteArray, value: number, length: number): void {
  for (let i = 0; i < length; i++) {
    destination.SetByte(i, value);
  }
}

/**
 * ZeroMemory - Fills byte array with zeros
 */
export function ZeroMemory(destination: VB6ByteArray, length: number): void {
  FillMemory(destination, 0, length);
}

// ============================================================================
// Pointer Simulation Functions
// ============================================================================

// Simulated memory map for pointer operations
const memoryMap = new Map<number, any>();
let nextAddress = 0x10000;

/**
 * StrPtr - Returns "address" of string
 */
export function StrPtr(str: string): number {
  const address = nextAddress++;
  memoryMap.set(address, str);
  return address;
}

/**
 * VarPtr - Returns "address" of variable
 */
export function VarPtr(variable: any): number {
  const address = nextAddress++;
  memoryMap.set(address, { value: variable });
  return address;
}

/**
 * ObjPtr - Returns "address" of object
 */
export function ObjPtr(obj: any): number {
  const address = nextAddress++;
  memoryMap.set(address, obj);
  return address;
}

/**
 * DerefPtr - Dereference a pointer
 */
export function DerefPtr(address: number): any {
  if (!memoryMap.has(address)) {
    throw new Error('Invalid pointer');
  }
  const value = memoryMap.get(address);
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value;
}

// ============================================================================
// Input/Output Enhancement
// ============================================================================

/**
 * VB6 Print stream for console-like output
 */
export class VB6PrintStream {
  private buffer: string[] = [];
  private currentX: number = 0;
  private zoneWidth: number = 14;
  private outputElement: HTMLElement | null = null;

  constructor(elementId?: string) {
    if (elementId && typeof document !== 'undefined') {
      this.outputElement = document.getElementById(elementId);
    }
  }

  Print(...args: any[]): void {
    let output = '';

    for (const arg of args) {
      if (arg === undefined || arg === null) {
        output += '';
      } else if (typeof arg === 'boolean') {
        output += arg ? 'True' : 'False';
      } else {
        output += String(arg);
      }
    }

    this.buffer.push(output);
    this.currentX += output.length;
    this.flush();
  }

  PrintLine(...args: any[]): void {
    this.Print(...args);
    this.buffer.push('\r\n');
    this.currentX = 0;
    this.flush();
  }

  Tab(column?: number): string {
    if (column === undefined) {
      // Move to next print zone
      const spaces = this.zoneWidth - (this.currentX % this.zoneWidth);
      this.currentX += spaces;
      return ' '.repeat(spaces);
    } else {
      // Move to specific column
      const spaces = Math.max(0, column - this.currentX);
      this.currentX = column;
      return ' '.repeat(spaces);
    }
  }

  Spc(count: number): string {
    this.currentX += count;
    return ' '.repeat(count);
  }

  Cls(): void {
    this.buffer = [];
    this.currentX = 0;
    if (this.outputElement) {
      this.outputElement.textContent = '';
    }
  }

  GetOutput(): string {
    return this.buffer.join('');
  }

  private flush(): void {
    if (this.outputElement) {
      this.outputElement.textContent = this.GetOutput();
    }
  }
}

/**
 * Debug output stream
 */
export const DebugStream = new VB6PrintStream();

/**
 * Debug.Print equivalent
 */
export function DebugPrint(...args: any[]): void {
  DebugStream.PrintLine(...args);
}

/**
 * Debug.Assert equivalent
 */
export function DebugAssert(condition: boolean, message?: string): void {
  if (!condition) {
    const errorMessage = message || 'Assertion failed';
    console.error('[Debug.Assert]', errorMessage);
    // In development mode, throw an error to halt execution
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      throw new Error(`[Debug.Assert] ${errorMessage}`);
    }
  }
}

// ============================================================================
// Locale and Internationalization
// ============================================================================

/**
 * Get system locale ID
 */
export function GetSystemDefaultLCID(): number {
  // Common LCID values
  const localeMap: { [key: string]: number } = {
    'en-US': 0x0409,
    'en-GB': 0x0809,
    'fr-FR': 0x040c,
    'de-DE': 0x0407,
    'es-ES': 0x0c0a,
    'it-IT': 0x0410,
    'pt-BR': 0x0416,
    'ja-JP': 0x0411,
    'zh-CN': 0x0804,
    'ko-KR': 0x0412,
  };

  if (typeof navigator !== 'undefined') {
    const locale = navigator.language || 'en-US';
    return localeMap[locale] || 0x0409;
  }

  return 0x0409; // Default to US English
}

/**
 * Get user locale ID
 */
export function GetUserDefaultLCID(): number {
  return GetSystemDefaultLCID();
}

/**
 * Get locale info
 */
export function GetLocaleInfo(lcid: number, lcType: number): string {
  // Simplified implementation
  const locale = 'en-US'; // Would map from LCID

  const localeData: { [key: number]: string } = {
    0x01: 'en-US', // LOCALE_ILANGUAGE
    0x02: 'English', // LOCALE_SLANGUAGE
    0x03: 'United States', // LOCALE_SCOUNTRY
    0x04: 'ENU', // LOCALE_SABBREVLANGNAME
    0x05: 'English', // LOCALE_SNATIVELANGNAME
    0x06: 'US', // LOCALE_SABBREVCTRYNAME
    0x07: 'United States', // LOCALE_SNATIVECTRYNAME
    0x14: '$', // LOCALE_SCURRENCY
    0x15: '.', // LOCALE_STHOUSAND
    0x16: '.', // LOCALE_SDECIMAL
    0x1d: 'M/d/yyyy', // LOCALE_SSHORTDATE
    0x1e: 'dddd, MMMM dd, yyyy', // LOCALE_SLONGDATE
  };

  return localeData[lcType] || '';
}

// ============================================================================
// Miscellaneous Utility Functions
// ============================================================================

/**
 * Approximately equal comparison for floating point
 */
export function ApproxEqual(a: number, b: number, epsilon: number = 0.00001): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Clamp value between min and max
 */
export function Clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function Lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Clamp(t, 0, 1);
}

/**
 * Map value from one range to another
 */
export function MapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Generate GUID/UUID
 */
export function CreateGUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate short unique ID
 */
export function CreateShortID(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if running in development mode
 */
export function IsDevMode(): boolean {
  if (typeof process !== 'undefined') {
    return process.env?.NODE_ENV === 'development';
  }
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  return false;
}

/**
 * Get platform information
 */
export function GetPlatformInfo(): {
  os: string;
  browser: string;
  isMobile: boolean;
  isTouch: boolean;
} {
  if (typeof navigator === 'undefined') {
    return {
      os: 'Unknown',
      browser: 'Unknown',
      isMobile: false,
      isTouch: false,
    };
  }

  const ua = navigator.userAgent;

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'IE';

  // Detect mobile
  const isMobile = /Mobi|Android/i.test(ua);

  // Detect touch
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return { os, browser, isMobile, isTouch };
}

// ============================================================================
// Event Queue for DoEvents simulation
// ============================================================================

/**
 * VB6 Event Queue for managing async events
 */
export class VB6EventQueue {
  private queue: Array<() => void | Promise<void>> = [];
  private processing: boolean = false;

  /**
   * Add event to queue
   */
  Enqueue(handler: () => void | Promise<void>): void {
    this.queue.push(handler);
  }

  /**
   * Process all queued events
   */
  async ProcessEvents(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const handler = this.queue.shift();
        if (handler) {
          await handler();
        }
        // Yield to browser event loop
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Clear all queued events
   */
  Clear(): void {
    this.queue = [];
  }

  /**
   * Get number of queued events
   */
  get Count(): number {
    return this.queue.length;
  }
}

// Global event queue instance
export const EventQueue = new VB6EventQueue();

/**
 * Enhanced DoEvents - Yields execution and processes pending events
 */
export async function DoEvents(): Promise<void> {
  await EventQueue.ProcessEvents();
  // Additional yield to browser
  await new Promise(resolve => setTimeout(resolve, 0));
}

// ============================================================================
// Environment and Shell Functions
// ============================================================================

/**
 * Get environment variable
 */
export function Environ(envString: string | number): string {
  if (typeof process !== 'undefined' && process.env) {
    if (typeof envString === 'number') {
      const keys = Object.keys(process.env);
      if (envString > 0 && envString <= keys.length) {
        const key = keys[envString - 1];
        return `${key}=${process.env[key] || ''}`;
      }
      return '';
    }
    return process.env[envString] || '';
  }
  // Browser fallback - check common browser-accessible info
  if (typeof envString === 'string') {
    const browserEnv: Record<string, string> = {
      COMPUTERNAME: typeof location !== 'undefined' ? location.hostname : 'browser',
      USERNAME: 'WebUser',
      USERPROFILE: '/home/webuser',
      OS: typeof navigator !== 'undefined' ? navigator.platform : 'browser',
      PATH: '/',
      TEMP: '/tmp',
      TMP: '/tmp',
    };
    return browserEnv[envString.toUpperCase()] || '';
  }
  return '';
}

/**
 * Execute a shell command (simulated in browser)
 */
export async function Shell(command: string, windowStyle?: number): Promise<number> {
  // In browser, we can only simulate certain commands
  if (typeof window !== 'undefined') {
    // Handle URLs
    if (command.match(/^(http|https|mailto):/i)) {
      window.open(command, '_blank');
      return 1;
    }
    // Log other commands
    console.warn('[Shell] Cannot execute system commands in browser environment');
    return 0;
  }

  // In Node.js, could use child_process
  return 0;
}

/**
 * Activate an application window (simulated)
 */
export function AppActivate(title: string, wait?: boolean): boolean {
  // In browser, we can only focus our own window
  if (typeof window !== 'undefined') {
    window.focus();
    return true;
  }
  return false;
}

/**
 * Get command line arguments
 */
export function Command(): string {
  if (typeof process !== 'undefined' && process.argv) {
    return process.argv.slice(2).join(' ');
  }
  // Browser - check URL parameters
  if (typeof location !== 'undefined') {
    return location.search.substring(1);
  }
  return '';
}

/**
 * Play system beep
 */
export function Beep(): void {
  if (typeof window !== 'undefined' && window.AudioContext) {
    try {
      const audioCtx = new window.AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Audio API may not be available in all environments
    }
  }
}

// ============================================================================
// Clipboard Functions
// ============================================================================

/**
 * VB6 Clipboard object simulation
 */
export const Clipboard = {
  /**
   * Get text from clipboard
   */
  async GetText(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        console.warn('[Clipboard] Cannot read clipboard:', e);
        return '';
      }
    }
    return '';
  },

  /**
   * Set text to clipboard
   */
  async SetText(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.warn('[Clipboard] Cannot write to clipboard:', e);
      }
    }
  },

  /**
   * Clear clipboard
   */
  async Clear(): Promise<void> {
    await this.SetText('');
  },

  /**
   * Get clipboard format (simplified)
   */
  GetFormat(format: number): boolean {
    // In web, we mainly support text
    return format === 1; // vbCFText = 1
  },
};

// ============================================================================
// Color Functions
// ============================================================================

/**
 * QBColor - Returns VB6 QBasic color value
 */
export function QBColor(color: number): number {
  const colors = [
    0x000000, // 0: Black
    0x800000, // 1: Blue
    0x008000, // 2: Green
    0x808000, // 3: Cyan
    0x000080, // 4: Red
    0x800080, // 5: Magenta
    0x008080, // 6: Brown/Yellow
    0xc0c0c0, // 7: Light Gray
    0x808080, // 8: Dark Gray
    0xff0000, // 9: Light Blue
    0x00ff00, // 10: Light Green
    0xffff00, // 11: Light Cyan
    0x0000ff, // 12: Light Red
    0xff00ff, // 13: Light Magenta
    0x00ffff, // 14: Yellow
    0xffffff, // 15: White
  ];
  return colors[color % 16] || 0;
}

/**
 * RGB - Create color value from components
 */
export function RGB(red: number, green: number, blue: number): number {
  const r = Math.max(0, Math.min(255, Math.round(red)));
  const g = Math.max(0, Math.min(255, Math.round(green)));
  const b = Math.max(0, Math.min(255, Math.round(blue)));
  return (b << 16) | (g << 8) | r;
}

/**
 * Extract Red component from color
 */
export function ExtractRed(color: number): number {
  return color & 0xff;
}

/**
 * Extract Green component from color
 */
export function ExtractGreen(color: number): number {
  return (color >> 8) & 0xff;
}

/**
 * Extract Blue component from color
 */
export function ExtractBlue(color: number): number {
  return (color >> 16) & 0xff;
}

// ============================================================================
// Dialog Functions
// ============================================================================

/**
 * InputBox - Display input dialog
 */
export function InputBox(
  prompt: string,
  title?: string,
  defaultValue?: string,
  xpos?: number,
  ypos?: number
): string | null {
  if (typeof window !== 'undefined' && window.prompt) {
    const result = window.prompt(prompt, defaultValue || '');
    return result;
  }
  return defaultValue || '';
}

/**
 * MsgBox - Display message dialog
 * Returns button clicked
 */
export function MsgBox(prompt: string, buttons?: number, title?: string): number {
  const buttonsValue = buttons || 0;
  const titleValue = title || 'Message';

  if (typeof window !== 'undefined') {
    // Determine dialog type based on buttons parameter
    const btnType = buttonsValue & 0x7; // Lower 3 bits

    switch (btnType) {
      case 0: // vbOKOnly
        window.alert(`${titleValue}\n\n${prompt}`);
        return 1; // vbOK
      case 1: // vbOKCancel
        return window.confirm(`${titleValue}\n\n${prompt}`) ? 1 : 2;
      case 4: // vbYesNo
        return window.confirm(`${titleValue}\n\n${prompt}`) ? 6 : 7;
      default:
        window.alert(`${titleValue}\n\n${prompt}`);
        return 1;
    }
  }

  return 1;
}

// ============================================================================
// Type Checking Functions
// ============================================================================

/**
 * IsArray - Check if variable is an array
 */
export function IsArray(variable: any): boolean {
  return Array.isArray(variable);
}

/**
 * IsDate - Check if variable is a valid date
 */
export function IsDate(expression: any): boolean {
  if (expression instanceof Date) {
    return !isNaN(expression.getTime());
  }
  if (typeof expression === 'string') {
    const parsed = Date.parse(expression);
    return !isNaN(parsed);
  }
  return false;
}

/**
 * IsEmpty - Check if variable is empty/uninitialized
 */
export function IsEmpty(expression: any): boolean {
  return expression === undefined || expression === null || expression === '';
}

/**
 * IsNull - Check if variable is null
 */
export function IsNull(expression: any): boolean {
  return expression === null;
}

/**
 * IsNumeric - Check if expression can be evaluated as a number
 */
export function IsNumeric(expression: any): boolean {
  if (typeof expression === 'number') return !isNaN(expression);
  if (typeof expression === 'string') {
    const trimmed = expression.trim();
    if (trimmed === '') return false;
    return !isNaN(Number(trimmed));
  }
  return false;
}

/**
 * IsObject - Check if expression is an object
 */
export function IsObject(expression: any): boolean {
  return expression !== null && typeof expression === 'object' && !Array.isArray(expression);
}

/**
 * TypeName - Get the type name of a variable
 */
export function TypeName(variable: any): string {
  if (variable === null) return 'Null';
  if (variable === undefined) return 'Empty';
  if (Array.isArray(variable)) return 'Variant()';
  if (variable instanceof Date) return 'Date';
  const type = typeof variable;
  switch (type) {
    case 'boolean':
      return 'Boolean';
    case 'number':
      return Number.isInteger(variable) ? 'Long' : 'Double';
    case 'string':
      return 'String';
    case 'object':
      return variable.constructor?.name || 'Object';
    case 'function':
      return 'Function';
    default:
      return 'Variant';
  }
}

/**
 * VarType - Get the variant type number
 */
export function VarType(variable: any): number {
  if (variable === null) return 1; // vbNull
  if (variable === undefined) return 0; // vbEmpty
  if (typeof variable === 'number') {
    return Number.isInteger(variable) ? 3 : 5; // vbLong or vbDouble
  }
  if (typeof variable === 'string') return 8; // vbString
  if (typeof variable === 'boolean') return 11; // vbBoolean
  if (variable instanceof Date) return 7; // vbDate
  if (Array.isArray(variable)) return 8204; // vbArray + vbVariant
  if (typeof variable === 'object') return 9; // vbObject
  return 12; // vbVariant
}

// ============================================================================
// Export all enhanced runtime functions
// ============================================================================

export const VB6EnhancedRuntime = {
  // Timer and Sleep
  Sleep,
  Wait,
  Pause,
  VB6Timer,
  CreateTimer,
  GetTickCount,
  TimeGetTime,

  // String Buffer
  VB6StringBuilder,
  CreateStringBuilder,

  // Memory and Buffer
  VB6ByteArray,
  CopyMemory,
  FillMemory,
  ZeroMemory,

  // Pointers
  StrPtr,
  VarPtr,
  ObjPtr,
  DerefPtr,

  // I/O
  VB6PrintStream,
  DebugStream,
  DebugPrint,
  DebugAssert,

  // Locale
  GetSystemDefaultLCID,
  GetUserDefaultLCID,
  GetLocaleInfo,

  // Utilities
  ApproxEqual,
  Clamp,
  Lerp,
  MapRange,
  CreateGUID,
  CreateShortID,
  IsDevMode,
  GetPlatformInfo,

  // Event Queue
  VB6EventQueue,
  EventQueue,
  DoEvents,

  // Environment and Shell
  Environ,
  Shell,
  AppActivate,
  Command,
  Beep,

  // Clipboard
  Clipboard,

  // Colors
  QBColor,
  RGB,
  ExtractRed,
  ExtractGreen,
  ExtractBlue,

  // Dialogs
  InputBox,
  MsgBox,

  // Type Checking
  IsArray,
  IsDate,
  IsEmpty,
  IsNull,
  IsNumeric,
  IsObject,
  TypeName,
  VarType,
};
