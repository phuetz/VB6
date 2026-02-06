/**
 * VB6 System Interaction Functions
 *
 * Web-compatible implementation of VB6 system interaction functions
 * Shell, AppActivate, SendKeys, Environ, DoEvents, etc.
 * Note: Many functions are simulated due to browser security restrictions
 */

import { errorHandler } from './VB6ErrorHandling';

// Window state constants for Shell function
export const VB6WindowState = {
  vbHide: 0,
  vbNormalFocus: 1,
  vbMinimizedFocus: 2,
  vbMaximizedFocus: 3,
  vbNormalNoFocus: 4,
  vbMinimizedNoFocus: 6,
} as const;

// SendKeys special key constants
export const VB6SendKeysConstants = {
  BACKSPACE: '{BACKSPACE}',
  BS: '{BS}',
  BREAK: '{BREAK}',
  CAPSLOCK: '{CAPSLOCK}',
  DELETE: '{DELETE}',
  DEL: '{DEL}',
  DOWN: '{DOWN}',
  END: '{END}',
  ENTER: '{ENTER}',
  ESC: '{ESC}',
  ESCAPE: '{ESCAPE}',
  F1: '{F1}',
  F2: '{F2}',
  F3: '{F3}',
  F4: '{F4}',
  F5: '{F5}',
  F6: '{F6}',
  F7: '{F7}',
  F8: '{F8}',
  F9: '{F9}',
  F10: '{F10}',
  F11: '{F11}',
  F12: '{F12}',
  HELP: '{HELP}',
  HOME: '{HOME}',
  INSERT: '{INSERT}',
  INS: '{INS}',
  LEFT: '{LEFT}',
  NUMLOCK: '{NUMLOCK}',
  PGDN: '{PGDN}',
  PGUP: '{PGUP}',
  PRTSC: '{PRTSC}',
  RIGHT: '{RIGHT}',
  SCROLLLOCK: '{SCROLLLOCK}',
  TAB: '{TAB}',
  UP: '{UP}',
} as const;

// Process information interface
interface ProcessInfo {
  processId: number;
  processName: string;
  windowTitle: string;
  isActive: boolean;
  created: Date;
}

// Simulated process registry
class ProcessRegistry {
  private static instance: ProcessRegistry;
  private processes: Map<number, ProcessInfo> = new Map();
  private nextProcessId = 1000;
  private activeProcess: number | null = null;

  static getInstance(): ProcessRegistry {
    if (!ProcessRegistry.instance) {
      ProcessRegistry.instance = new ProcessRegistry();
    }
    return ProcessRegistry.instance;
  }

  // Simulate process creation
  createProcess(command: string, windowState: number = VB6WindowState.vbNormalFocus): number {
    const processId = this.nextProcessId++;

    // Extract executable name from command
    const parts = command.split(' ');
    const executablePath = parts[0];
    const executableName =
      executablePath.split('\\').pop() || executablePath.split('/').pop() || executablePath;

    const processInfo: ProcessInfo = {
      processId,
      processName: executableName,
      windowTitle: this.getDefaultWindowTitle(executableName),
      isActive:
        windowState === VB6WindowState.vbNormalFocus ||
        windowState === VB6WindowState.vbMaximizedFocus,
      created: new Date(),
    };

    this.processes.set(processId, processInfo);

    if (processInfo.isActive) {
      this.activeProcess = processId;
    }

    // Simulate process execution in browser environment
    this.simulateProcessExecution(command, windowState);

    return processId;
  }

  // Activate a process by ID or name
  activateProcess(identifier: string | number): boolean {
    let targetProcess: ProcessInfo | undefined;

    if (typeof identifier === 'number') {
      targetProcess = this.processes.get(identifier);
    } else {
      // Search by window title or process name
      for (const process of this.processes.values()) {
        if (
          process.windowTitle.toLowerCase().includes(identifier.toLowerCase()) ||
          process.processName.toLowerCase().includes(identifier.toLowerCase())
        ) {
          targetProcess = process;
          break;
        }
      }
    }

    if (targetProcess) {
      this.activeProcess = targetProcess.processId;
      targetProcess.isActive = true;

      // Deactivate other processes
      for (const [id, process] of this.processes) {
        if (id !== targetProcess.processId) {
          process.isActive = false;
        }
      }

      return true;
    }

    return false;
  }

  // Get process info
  getProcess(processId: number): ProcessInfo | undefined {
    return this.processes.get(processId);
  }

  // Get active process
  getActiveProcess(): ProcessInfo | null {
    if (this.activeProcess) {
      return this.processes.get(this.activeProcess) || null;
    }
    return null;
  }

  private getDefaultWindowTitle(executableName: string): string {
    const lowerName = executableName.toLowerCase().replace('.exe', '');

    const titleMap: { [key: string]: string } = {
      notepad: 'Untitled - Notepad',
      calc: 'Calculator',
      mspaint: 'Paint',
      winword: 'Microsoft Word',
      excel: 'Microsoft Excel',
      powerpnt: 'Microsoft PowerPoint',
      iexplore: 'Internet Explorer',
      firefox: 'Mozilla Firefox',
      chrome: 'Google Chrome',
      explorer: 'Windows Explorer',
    };

    return titleMap[lowerName] || executableName;
  }

  private simulateProcessExecution(command: string, windowState: number): void {
    // In a real implementation, this would launch the actual process
    // In browser environment, we can only simulate or provide alternatives

    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('notepad')) {
      this.openTextEditor();
    } else if (lowerCommand.includes('calc')) {
      this.openCalculator();
    } else if (lowerCommand.includes('http') || lowerCommand.includes('www')) {
      this.openUrl(command);
    }
  }

  private openTextEditor(): void {
    // Create a simple text editor in a new window/tab
    const textEditorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Notepad Simulation</title></head>
      <body style="margin: 0; padding: 10px; font-family: 'Courier New', monospace;">
        <textarea style="width: 100%; height: 100vh; border: none; outline: none; resize: none;"></textarea>
      </body>
      </html>
    `;

    const blob = new Blob([textEditorHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=600,height=400');
  }

  private openCalculator(): void {
    // Simple calculator implementation
    const calcHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Calculator</title>
        <style>
          body { font-family: Arial; padding: 20px; background: #f0f0f0; }
          .calc { width: 200px; margin: 0 auto; }
          .display { width: 100%; height: 40px; font-size: 18px; text-align: right; margin-bottom: 10px; }
          .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
          button { height: 40px; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="calc">
          <input type="text" class="display" id="display" readonly>
          <div class="buttons">
            <button onclick="clearDisplay()">C</button>
            <button onclick="appendToDisplay('/')">/</button>
            <button onclick="appendToDisplay('*')">*</button>
            <button onclick="deleteLast()">←</button>
            <button onclick="appendToDisplay('7')">7</button>
            <button onclick="appendToDisplay('8')">8</button>
            <button onclick="appendToDisplay('9')">9</button>
            <button onclick="appendToDisplay('-')">-</button>
            <button onclick="appendToDisplay('4')">4</button>
            <button onclick="appendToDisplay('5')">5</button>
            <button onclick="appendToDisplay('6')">6</button>
            <button onclick="appendToDisplay('+')">+</button>
            <button onclick="appendToDisplay('1')">1</button>
            <button onclick="appendToDisplay('2')">2</button>
            <button onclick="appendToDisplay('3')">3</button>
            <button onclick="calculate()" style="grid-row: span 2;">=</button>
            <button onclick="appendToDisplay('0')" style="grid-column: span 2;">0</button>
            <button onclick="appendToDisplay('.')">.</button>
          </div>
        </div>
        <script>
          let display = document.getElementById('display');
          function appendToDisplay(value) { display.value += value; }
          function clearDisplay() { display.value = ''; }
          function deleteLast() { display.value = display.value.slice(0, -1); }
          function calculate() { 
            try { 
              display.value = safeMathEvaluator(display.value); 
            } catch(e) { 
              display.value = 'Error'; 
            } 
          }
          
          // Safe math evaluator function
          function safeMathEvaluator(expr) {
            const cleanExpr = expr.replace(/\\s/g, '');
            if (!/^[\\d+\\-*/().]+$/.test(cleanExpr) || cleanExpr === '') {
              throw new Error('Invalid expression');
            }
            
            let index = 0;
            
            function parseNumber() {
              let num = '';
              while (index < cleanExpr.length && /[\\d.]/.test(cleanExpr[index])) {
                num += cleanExpr[index++];
              }
              const parsed = parseFloat(num);
              if (isNaN(parsed)) throw new Error('Invalid number');
              return parsed;
            }
            
            function parseFactor() {
              if (cleanExpr[index] === '(') {
                index++; // skip '('
                const result = parseExpression();
                if (cleanExpr[index] !== ')') throw new Error('Missing )');
                index++; // skip ')'
                return result;
              }
              if (cleanExpr[index] === '-') {
                index++; // skip '-'
                return -parseFactor();
              }
              if (cleanExpr[index] === '+') {
                index++; // skip '+'
                return parseFactor();
              }
              return parseNumber();
            }
            
            function parseTerm() {
              let result = parseFactor();
              while (index < cleanExpr.length && (cleanExpr[index] === '*' || cleanExpr[index] === '/')) {
                const op = cleanExpr[index++];
                const factor = parseFactor();
                if (op === '*') {
                  result *= factor;
                } else {
                  if (factor === 0) throw new Error('Division by zero');
                  result /= factor;
                }
              }
              return result;
            }
            
            function parseExpression() {
              let result = parseTerm();
              while (index < cleanExpr.length && (cleanExpr[index] === '+' || cleanExpr[index] === '-')) {
                const op = cleanExpr[index++];
                const term = parseTerm();
                if (op === '+') {
                  result += term;
                } else {
                  result -= term;
                }
              }
              return result;
            }
            
            const result = parseExpression();
            if (index < cleanExpr.length) {
              throw new Error('Unexpected characters');
            }
            return result;
          }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([calcHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=250,height=350');
  }

  private openUrl(url: string): void {
    window.open(url, '_blank');
  }
}

// Environment variables simulation
class EnvironmentVariables {
  private static variables: Map<string, string> = new Map([
    ['USERNAME', 'WebUser'],
    ['COMPUTERNAME', 'WEB-COMPUTER'],
    ['OS', 'WebOS'],
    ['PATH', '/usr/local/bin:/usr/bin:/bin'],
    ['TEMP', '/tmp'],
    ['TMP', '/tmp'],
    ['USERPROFILE', '/home/webuser'],
    ['HOMEDRIVE', 'C:'],
    ['HOMEPATH', '\\Users\\WebUser'],
    ['WINDIR', 'C:\\Windows'],
    ['SYSTEMROOT', 'C:\\Windows'],
    ['PROGRAMFILES', 'C:\\Program Files'],
    ['COMMONPROGRAMFILES', 'C:\\Program Files\\Common Files'],
  ]);

  static get(variableName: string): string {
    return this.variables.get(variableName.toUpperCase()) || '';
  }

  static set(variableName: string, value: string): void {
    this.variables.set(variableName.toUpperCase(), value);
  }
}

// SendKeys simulation
class SendKeysSimulator {
  private static queue: Array<{ keys: string; wait: boolean }> = [];
  private static isProcessing = false;

  static send(keys: string, wait: boolean = false): void {
    this.queue.push({ keys, wait });
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private static async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { keys, wait } = this.queue.shift()!;
      await this.simulateKeystrokes(keys);

      if (wait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  private static async simulateKeystrokes(keys: string): Promise<void> {
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;

    if (
      !activeElement ||
      (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')
    ) {
      console.warn('SendKeys: No active input element found');
      return;
    }

    // Parse special keys
    let processedKeys = keys;
    const specialKeys = Object.entries(VB6SendKeysConstants);

    for (const [name, code] of specialKeys) {
      processedKeys = processedKeys.replace(
        new RegExp(code.replace(/[{}]/g, '\\$&'), 'g'),
        match => {
          this.simulateSpecialKey(activeElement, name);
          return '';
        }
      );
    }

    // Type remaining characters
    if (processedKeys) {
      for (const char of processedKeys) {
        if (char === '+' || char === '^' || char === '%') {
          // Modifier keys - simulate in combination with next character
          continue;
        }

        this.typeCharacter(activeElement, char);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  private static simulateSpecialKey(
    element: HTMLInputElement | HTMLTextAreaElement,
    keyName: string
  ): void {
    const keyMap: { [key: string]: string } = {
      ENTER: 'Enter',
      TAB: 'Tab',
      ESC: 'Escape',
      ESCAPE: 'Escape',
      BACKSPACE: 'Backspace',
      BS: 'Backspace',
      DELETE: 'Delete',
      DEL: 'Delete',
      HOME: 'Home',
      END: 'End',
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight',
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      PGUP: 'PageUp',
      PGDN: 'PageDown',
      INSERT: 'Insert',
      INS: 'Insert',
    };

    const eventKey = keyMap[keyName] || keyName;

    const keyEvent = new KeyboardEvent('keydown', {
      key: eventKey,
      bubbles: true,
      cancelable: true,
    });

    element.dispatchEvent(keyEvent);
  }

  private static typeCharacter(
    element: HTMLInputElement | HTMLTextAreaElement,
    char: string
  ): void {
    const currentValue = element.value;
    const selectionStart = element.selectionStart || 0;
    const selectionEnd = element.selectionEnd || 0;

    const newValue =
      currentValue.substring(0, selectionStart) + char + currentValue.substring(selectionEnd);
    element.value = newValue;
    element.setSelectionRange(selectionStart + 1, selectionStart + 1);

    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
  }
}

// DoEvents implementation
let doEventsCounter = 0;

/**
 * VB6 Shell Function
 * Executes a program and returns the process ID
 */
export function Shell(
  pathname: string,
  windowState: number = VB6WindowState.vbNormalFocus
): number {
  try {
    const processRegistry = ProcessRegistry.getInstance();
    return processRegistry.createProcess(pathname, windowState);
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Shell');
    return 0;
  }
}

/**
 * VB6 AppActivate Function
 * Activates an application window
 */
export function AppActivate(app: string | number, wait?: boolean): boolean {
  try {
    const processRegistry = ProcessRegistry.getInstance();
    const result = processRegistry.activateProcess(app);

    if (wait) {
      // Simulate wait for activation
      setTimeout(() => {}, 100);
    }

    return result;
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'AppActivate');
    return false;
  }
}

/**
 * VB6 SendKeys Function
 * Sends keystrokes to the active window
 */
export function SendKeys(keys: string, wait: boolean = false): void {
  try {
    SendKeysSimulator.send(keys, wait);
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'SendKeys');
  }
}

/**
 * VB6 Environ Function
 * Returns environment variable value
 */
export function Environ(envstring: string | number): string {
  try {
    if (typeof envstring === 'number') {
      // Return environment variable by index (simplified)
      const vars = ['USERNAME=WebUser', 'COMPUTERNAME=WEB-COMPUTER', 'OS=WebOS'];
      return vars[envstring - 1] || '';
    } else {
      // Return environment variable by name
      return EnvironmentVariables.get(envstring);
    }
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Environ');
    return '';
  }
}

/**
 * VB6 DoEvents Function
 * Yields execution to other processes
 */
export function DoEvents(): number {
  try {
    doEventsCounter++;

    // Yield to browser's event loop using requestIdleCallback or setTimeout
    // Note: VB6 DoEvents is synchronous but in browser we schedule a yield
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        /* yield to event loop */
      });
    } else {
      setTimeout(() => {
        /* yield to event loop */
      }, 0);
    }

    return doEventsCounter;
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'DoEvents');
    return doEventsCounter;
  }
}

/**
 * VB6 Beep Function
 * Plays system beep sound
 */
export function Beep(): void {
  try {
    // Web Audio API beep
    if (typeof window !== 'undefined' && window.AudioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      // Fallback to console beep
    }
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Beep');
  }
}

/**
 * VB6 Command Function
 * Returns command line arguments
 */
export function Command(): string {
  try {
    // In browser environment, return URL parameters
    if (typeof window !== 'undefined' && window.location) {
      return window.location.search.substring(1); // Remove '?'
    }
    return '';
  } catch (error) {
    errorHandler.raiseError(5, 'Invalid procedure call or argument', 'Command');
    return '';
  }
}

/**
 * Get system information
 */
/** Chrome-specific performance.memory API */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface SystemInfo {
  Platform: string;
  UserAgent: string;
  Language: string;
  CookieEnabled: boolean;
  OnLine: boolean;
  Screen: { Width: number; Height: number; ColorDepth: number; PixelDepth: number } | null;
  Memory: { Used: number; Total: number; Limit: number } | null;
}

export function GetSystemInfo(): SystemInfo {
  const perfWithMemory = performance as PerformanceWithMemory;

  const info: SystemInfo = {
    Platform: 'Web',
    UserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    Language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    CookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    OnLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
    Screen:
      typeof screen !== 'undefined'
        ? {
            Width: screen.width,
            Height: screen.height,
            ColorDepth: screen.colorDepth,
            PixelDepth: screen.pixelDepth,
          }
        : null,
    Memory: perfWithMemory.memory
      ? {
          Used: Math.round(perfWithMemory.memory.usedJSHeapSize / 1024 / 1024),
          Total: Math.round(perfWithMemory.memory.totalJSHeapSize / 1024 / 1024),
          Limit: Math.round(perfWithMemory.memory.jsHeapSizeLimit / 1024 / 1024),
        }
      : null,
  };

  return info;
}

// Export all functions and constants
export const VB6SystemInteraction = {
  // Constants
  VB6WindowState,
  VB6SendKeysConstants,

  // Functions
  Shell,
  AppActivate,
  SendKeys,
  Environ,
  DoEvents,
  Beep,
  Command,
  GetSystemInfo,

  // Utility functions
  SetEnvironmentVariable: EnvironmentVariables.set,
  GetProcessInfo: (processId: number) => ProcessRegistry.getInstance().getProcess(processId),
  GetActiveProcess: () => ProcessRegistry.getInstance().getActiveProcess(),
};
