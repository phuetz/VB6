/**
 * VB6 Shell and Process Functions
 * Browser-compatible implementation of VB6 shell and process functions
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProcessInfo {
  id: number;
  name: string;
  startTime: number;
  status: 'running' | 'completed' | 'error';
  exitCode?: number;
  output?: string;
  error?: string;
}

export enum WindowStyle {
  vbHide = 0,
  vbNormalFocus = 1,
  vbMinimizedFocus = 2,
  vbMaximizedFocus = 3,
  vbNormalNoFocus = 4,
  vbMinimizedNoFocus = 6,
}

export enum AppActivateMode {
  Activate = 1,
  MinimizeActivate = 2,
  MaximizeActivate = 3,
}

// ============================================================================
// Process Manager
// ============================================================================

class VB6ProcessManager {
  private processes: Map<number, ProcessInfo> = new Map();
  private nextProcessId: number = 1000;
  private openWindows: Map<number, Window | null> = new Map();

  /**
   * Execute a command (simulated in browser)
   */
  shell(command: string, windowStyle: WindowStyle = WindowStyle.vbNormalFocus): number {
    const processId = this.nextProcessId++;

    const processInfo: ProcessInfo = {
      id: processId,
      name: command,
      startTime: Date.now(),
      status: 'running',
    };

    this.processes.set(processId, processInfo);

    // Try to handle different command types
    if (command.startsWith('http://') || command.startsWith('https://')) {
      // Open URL in new window
      this.openUrl(command, windowStyle, processId);
    } else if (command.endsWith('.html') || command.endsWith('.htm') || command.includes('/')) {
      // Assume it's a relative URL
      this.openUrl(command, windowStyle, processId);
    } else {
      // Log the command (can't actually execute in browser)

      // Mark as completed since we can't actually run it
      processInfo.status = 'completed';
      processInfo.exitCode = 0;
      processInfo.output = `Simulated execution of: ${command}`;
    }

    return processId;
  }

  /**
   * Open URL in new window
   */
  private openUrl(url: string, windowStyle: WindowStyle, processId: number): void {
    const features = this.getWindowFeatures(windowStyle);
    const newWindow = window.open(url, '_blank', features);

    if (newWindow) {
      this.openWindows.set(processId, newWindow);
      const processInfo = this.processes.get(processId);
      if (processInfo) {
        processInfo.status = 'completed';
        processInfo.exitCode = 0;
      }
    } else {
      const processInfo = this.processes.get(processId);
      if (processInfo) {
        processInfo.status = 'error';
        processInfo.error = 'Popup blocked or window.open not supported';
      }
    }
  }

  /**
   * Get window features for window.open
   */
  private getWindowFeatures(style: WindowStyle): string {
    switch (style) {
      case WindowStyle.vbHide:
        return 'width=1,height=1,left=-1000,top=-1000';
      case WindowStyle.vbMinimizedFocus:
      case WindowStyle.vbMinimizedNoFocus:
        return 'width=400,height=300';
      case WindowStyle.vbMaximizedFocus:
        return `width=${screen.width},height=${screen.height}`;
      case WindowStyle.vbNormalFocus:
      case WindowStyle.vbNormalNoFocus:
      default:
        return 'width=800,height=600';
    }
  }

  /**
   * Get process info
   */
  getProcess(processId: number): ProcessInfo | undefined {
    return this.processes.get(processId);
  }

  /**
   * Check if process is running
   */
  isRunning(processId: number): boolean {
    const process = this.processes.get(processId);
    return process?.status === 'running';
  }

  /**
   * Close a spawned window
   */
  closeWindow(processId: number): boolean {
    const win = this.openWindows.get(processId);
    if (win && !win.closed) {
      win.close();
      this.openWindows.delete(processId);
      return true;
    }
    return false;
  }

  /**
   * Get all processes
   */
  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  /**
   * Clear completed processes
   */
  clearCompleted(): void {
    for (const [id, process] of this.processes) {
      if (process.status !== 'running') {
        this.processes.delete(id);
      }
    }
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const processManager = new VB6ProcessManager();

// ============================================================================
// VB6 Shell Function
// ============================================================================

/**
 * VB6 Shell function
 * Runs an executable program and returns a Variant (Double) representing
 * the program's task ID if successful, otherwise it returns zero.
 *
 * @param pathname - The name of the program to execute
 * @param windowStyle - Optional. Window style constant
 */
export function Shell(
  pathname: string,
  windowStyle: WindowStyle = WindowStyle.vbNormalFocus
): number {
  return processManager.shell(pathname, windowStyle);
}

/**
 * ShellExecute - More advanced shell execution (simulated)
 */
export function ShellExecute(
  operation: string,
  file: string,
  parameters?: string,
  directory?: string,
  showCmd: WindowStyle = WindowStyle.vbNormalFocus
): number {
  let command = file;

  if (parameters) {
    command += ` ${parameters}`;
  }

  // Handle common operations
  if (operation.toLowerCase() === 'open') {
    if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('mailto:')) {
      window.open(file, '_blank');
      return 1;
    }
  }

  return Shell(command, showCmd);
}

// ============================================================================
// AppActivate Function
// ============================================================================

/**
 * AppActivate - Activates an application window
 * In browser, this is simulated and has limited functionality
 */
export function AppActivate(title: string, wait?: boolean): boolean {
  // Try to focus our own window
  if (
    title.toLowerCase().includes(document.title.toLowerCase()) ||
    document.title.toLowerCase().includes(title.toLowerCase())
  ) {
    window.focus();
    return true;
  }

  return false;
}

// ============================================================================
// SendKeys Function (Simulated)
// ============================================================================

interface SendKeysOptions {
  targetElement?: HTMLElement;
  delay?: number;
}

/**
 * SendKeys - Sends keystrokes to the active window
 * In browser, this only works with focused input elements
 */
export function SendKeys(keys: string, wait?: boolean, options?: SendKeysOptions): void {
  const target = options?.targetElement || (document.activeElement as HTMLElement) || document.body;

  // Parse VB6 SendKeys format
  const parsedKeys = parseSendKeys(keys);

  // Dispatch keyboard events
  for (const keyInfo of parsedKeys) {
    const keydownEvent = new KeyboardEvent('keydown', {
      key: keyInfo.key,
      code: keyInfo.code,
      keyCode: keyInfo.keyCode,
      charCode: keyInfo.charCode,
      shiftKey: keyInfo.shift,
      ctrlKey: keyInfo.ctrl,
      altKey: keyInfo.alt,
      bubbles: true,
      cancelable: true,
    });

    const keypressEvent = new KeyboardEvent('keypress', {
      key: keyInfo.key,
      code: keyInfo.code,
      keyCode: keyInfo.charCode,
      charCode: keyInfo.charCode,
      shiftKey: keyInfo.shift,
      ctrlKey: keyInfo.ctrl,
      altKey: keyInfo.alt,
      bubbles: true,
      cancelable: true,
    });

    const keyupEvent = new KeyboardEvent('keyup', {
      key: keyInfo.key,
      code: keyInfo.code,
      keyCode: keyInfo.keyCode,
      charCode: keyInfo.charCode,
      shiftKey: keyInfo.shift,
      ctrlKey: keyInfo.ctrl,
      altKey: keyInfo.alt,
      bubbles: true,
      cancelable: true,
    });

    target.dispatchEvent(keydownEvent);
    target.dispatchEvent(keypressEvent);
    target.dispatchEvent(keyupEvent);

    // If it's an input element, update the value
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      if (keyInfo.key.length === 1 && !keyInfo.ctrl && !keyInfo.alt) {
        target.value += keyInfo.key;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (keyInfo.key === 'Backspace') {
        target.value = target.value.slice(0, -1);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  charCode: number;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
}

/**
 * Parse VB6 SendKeys format
 */
function parseSendKeys(keys: string): KeyInfo[] {
  const result: KeyInfo[] = [];
  let i = 0;
  let shift = false;
  let ctrl = false;
  let alt = false;

  while (i < keys.length) {
    const char = keys[i];

    // Modifier keys
    if (char === '+') {
      shift = true;
      i++;
      continue;
    }
    if (char === '^') {
      ctrl = true;
      i++;
      continue;
    }
    if (char === '%') {
      alt = true;
      i++;
      continue;
    }

    // Special keys in braces
    if (char === '{') {
      const endBrace = keys.indexOf('}', i);
      if (endBrace !== -1) {
        const specialKey = keys.substring(i + 1, endBrace);
        const keyInfo = getSpecialKeyInfo(specialKey, shift, ctrl, alt);
        if (keyInfo) {
          result.push(keyInfo);
        }
        i = endBrace + 1;
        shift = ctrl = alt = false;
        continue;
      }
    }

    // Regular character
    const keyInfo = getCharKeyInfo(char, shift, ctrl, alt);
    result.push(keyInfo);
    shift = ctrl = alt = false;
    i++;
  }

  return result;
}

/**
 * Get key info for special key
 */
function getSpecialKeyInfo(
  keyName: string,
  shift: boolean,
  ctrl: boolean,
  alt: boolean
): KeyInfo | null {
  const specialKeys: Record<string, { key: string; code: string; keyCode: number }> = {
    ENTER: { key: 'Enter', code: 'Enter', keyCode: 13 },
    TAB: { key: 'Tab', code: 'Tab', keyCode: 9 },
    ESC: { key: 'Escape', code: 'Escape', keyCode: 27 },
    ESCAPE: { key: 'Escape', code: 'Escape', keyCode: 27 },
    BACKSPACE: { key: 'Backspace', code: 'Backspace', keyCode: 8 },
    BS: { key: 'Backspace', code: 'Backspace', keyCode: 8 },
    DELETE: { key: 'Delete', code: 'Delete', keyCode: 46 },
    DEL: { key: 'Delete', code: 'Delete', keyCode: 46 },
    INSERT: { key: 'Insert', code: 'Insert', keyCode: 45 },
    INS: { key: 'Insert', code: 'Insert', keyCode: 45 },
    UP: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    DOWN: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    LEFT: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    RIGHT: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    HOME: { key: 'Home', code: 'Home', keyCode: 36 },
    END: { key: 'End', code: 'End', keyCode: 35 },
    PGUP: { key: 'PageUp', code: 'PageUp', keyCode: 33 },
    PGDN: { key: 'PageDown', code: 'PageDown', keyCode: 34 },
    F1: { key: 'F1', code: 'F1', keyCode: 112 },
    F2: { key: 'F2', code: 'F2', keyCode: 113 },
    F3: { key: 'F3', code: 'F3', keyCode: 114 },
    F4: { key: 'F4', code: 'F4', keyCode: 115 },
    F5: { key: 'F5', code: 'F5', keyCode: 116 },
    F6: { key: 'F6', code: 'F6', keyCode: 117 },
    F7: { key: 'F7', code: 'F7', keyCode: 118 },
    F8: { key: 'F8', code: 'F8', keyCode: 119 },
    F9: { key: 'F9', code: 'F9', keyCode: 120 },
    F10: { key: 'F10', code: 'F10', keyCode: 121 },
    F11: { key: 'F11', code: 'F11', keyCode: 122 },
    F12: { key: 'F12', code: 'F12', keyCode: 123 },
    SPACE: { key: ' ', code: 'Space', keyCode: 32 },
  };

  const upper = keyName.toUpperCase();

  // Check for repetition like {a 10}
  const parts = keyName.split(' ');
  if (parts.length === 2) {
    const count = parseInt(parts[1], 10);
    if (!isNaN(count)) {
      // Return null here, handling repetition would require returning multiple keys
    }
  }

  const special = specialKeys[upper];
  if (special) {
    return {
      key: special.key,
      code: special.code,
      keyCode: special.keyCode,
      charCode: special.key.length === 1 ? special.key.charCodeAt(0) : 0,
      shift,
      ctrl,
      alt,
    };
  }

  // If not a special key, treat as literal
  if (keyName.length === 1) {
    return getCharKeyInfo(keyName, shift, ctrl, alt);
  }

  return null;
}

/**
 * Get key info for character
 */
function getCharKeyInfo(char: string, shift: boolean, ctrl: boolean, alt: boolean): KeyInfo {
  const code = `Key${char.toUpperCase()}`;
  return {
    key: char,
    code,
    keyCode: char.toUpperCase().charCodeAt(0),
    charCode: char.charCodeAt(0),
    shift,
    ctrl,
    alt,
  };
}

// ============================================================================
// Timer Functions
// ============================================================================

const timers: Map<number, ReturnType<typeof setInterval>> = new Map();
let timerIdCounter = 1;

/**
 * SetTimer - Create a timer (Windows API simulation)
 */
export function SetTimer(callback: () => void, interval: number, _hwnd?: number): number {
  const timerId = timerIdCounter++;
  const handle = setInterval(callback, interval);
  timers.set(timerId, handle);
  return timerId;
}

/**
 * KillTimer - Stop a timer
 */
export function KillTimer(timerId: number, _hwnd?: number): boolean {
  const handle = timers.get(timerId);
  if (handle) {
    clearInterval(handle);
    timers.delete(timerId);
    return true;
  }
  return false;
}

// ============================================================================
// Environment and System Info
// ============================================================================

/**
 * GetEnvironmentVariable - Get environment variable
 */
export function GetEnvironmentVariable(name: string): string {
  // In browser, we can only access certain info
  const browserEnv: Record<string, string> = {
    USERNAME: 'WebUser',
    COMPUTERNAME: 'WebBrowser',
    OS: navigator.platform,
    USERDOMAIN: window.location.hostname,
    TEMP: '/tmp',
    TMP: '/tmp',
    PATH: '/',
    USERPROFILE: '/',
    HOMEDRIVE: '/',
    HOMEPATH: '/',
    APPDATA: '/appdata',
    PROGRAMFILES: '/programs',
  };

  return browserEnv[name.toUpperCase()] || '';
}

/**
 * GetComputerName - Get computer name
 */
export function GetComputerName(): string {
  return window.location.hostname || 'WebBrowser';
}

/**
 * GetUserName - Get user name
 */
export function GetUserName(): string {
  return 'WebUser';
}

/**
 * GetSystemDirectory - Get system directory
 */
export function GetSystemDirectory(): string {
  return '/system';
}

/**
 * GetWindowsDirectory - Get Windows directory
 */
export function GetWindowsDirectory(): string {
  return '/windows';
}

/**
 * GetTempPath - Get temp path
 */
export function GetTempPath(): string {
  return '/tmp';
}

// ============================================================================
// Clipboard Functions (Browser Compatible)
// ============================================================================

/**
 * ClipboardClear - Clear clipboard
 */
export async function ClipboardClear(): Promise<void> {
  try {
    await navigator.clipboard.writeText('');
  } catch (e) {
    console.warn('[VB6 Clipboard] Clear failed:', e);
  }
}

/**
 * ClipboardSetText - Set text on clipboard
 */
export async function ClipboardSetText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.warn('[VB6 Clipboard] SetText failed:', e);
    return false;
  }
}

/**
 * ClipboardGetText - Get text from clipboard
 */
export async function ClipboardGetText(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch (e) {
    console.warn('[VB6 Clipboard] GetText failed:', e);
    return '';
  }
}

// ============================================================================
// Sound Functions
// ============================================================================

/**
 * Beep - Make a beep sound
 */
export function Beep(): void {
  // Try to play a beep using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Beep frequency
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Audio API may not be available in all environments
  }
}

/**
 * PlaySound - Play a sound file (simulated)
 */
export function PlaySound(soundFile: string, flags?: number): boolean {
  try {
    const audio = new Audio(soundFile);
    audio.play().catch(() => {
      console.warn(`[VB6 PlaySound] Could not play: ${soundFile}`);
    });
    return true;
  } catch (e) {
    console.warn(`[VB6 PlaySound] Failed: ${e}`);
    return false;
  }
}

// ============================================================================
// Export All
// ============================================================================

export const VB6ShellProcess = {
  // Process management
  processManager,
  Shell,
  ShellExecute,
  AppActivate,
  SendKeys,

  // Timers
  SetTimer,
  KillTimer,

  // Environment
  GetEnvironmentVariable,
  GetComputerName,
  GetUserName,
  GetSystemDirectory,
  GetWindowsDirectory,
  GetTempPath,

  // Clipboard
  ClipboardClear,
  ClipboardSetText,
  ClipboardGetText,

  // Sound
  Beep,
  PlaySound,

  // Enums
  WindowStyle,
  AppActivateMode,
};

export default VB6ShellProcess;
