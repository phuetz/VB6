/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * VB6 Declare Statements Support - External DLL Function Declarations
 * Provides support for Windows API and external DLL calls
 */

import { VB6Runtime } from './VB6Runtime';

// Type definitions for VB6 Declare statements
export interface VB6DeclareFunction {
  name: string;
  library: string;
  alias?: string;
  parameters: VB6Parameter[];
  returnType: VB6DataType;
  isFunction: boolean; // Function vs Sub
  callingConvention?: 'stdcall' | 'cdecl';
}

export interface VB6Parameter {
  name: string;
  type: VB6DataType;
  byRef: boolean;
  optional?: boolean;
  defaultValue?: any;
  isArray?: boolean;
}

export type VB6DataType =
  | 'Long'
  | 'Integer'
  | 'Byte'
  | 'Boolean'
  | 'String'
  | 'Single'
  | 'Double'
  | 'Currency'
  | 'Date'
  | 'Variant'
  | 'Object'
  | 'Any';

/**
 * VB6 Windows API Declarations Registry
 */
export class VB6DeclareRegistry {
  private static declarations = new Map<string, VB6DeclareFunction>();
  private static apiImplementations = new Map<string, Function>();

  /**
   * Register a Declare statement
   */
  static registerDeclare(declare: VB6DeclareFunction): void {
    const key = `${declare.library}.${declare.alias || declare.name}`;
    this.declarations.set(key, declare);

    // Register implementation based on known APIs
    this.registerAPIImplementation(declare);
  }

  /**
   * Call an external function
   */
  static callDeclaredFunction(name: string, library: string, ...args: any[]): any {
    const key = `${library}.${name}`;
    const declaration = this.declarations.get(key);

    if (!declaration) {
      throw new Error(`Undeclared external function: ${name} in ${library}`);
    }

    const implementation = this.apiImplementations.get(key);
    if (implementation) {
      return implementation(...args);
    }

    // Fallback for unimplemented APIs
    console.warn(`External API not implemented: ${key}`);
    return this.getDefaultReturnValue(declaration.returnType);
  }

  /**
   * Register known Windows API implementations
   */
  private static registerAPIImplementation(declare: VB6DeclareFunction): void {
    const key = `${declare.library}.${declare.alias || declare.name}`;

    // Common Windows APIs implementation
    switch (key) {
      // User32.dll APIs
      case 'user32.GetWindowText':
      case 'user32.GetWindowTextA':
        this.apiImplementations.set(key, (hwnd: number, lpString: string, cch: number) => {
          // Simulated window text retrieval
          const windowTexts = new Map([
            [1, 'Main Window'],
            [2, 'Dialog Box'],
            [3, 'Message Box'],
          ]);
          const text = windowTexts.get(hwnd) || '';
          return text.length;
        });
        break;

      case 'user32.MessageBox':
      case 'user32.MessageBoxA':
        this.apiImplementations.set(
          key,
          (hwnd: number, text: string, caption: string, type: number) => {
            // Browser-based message box
            if (type & 0x01) {
              // MB_OKCANCEL
              return confirm(`${caption}\n\n${text}`) ? 1 : 2;
            } else {
              alert(`${caption}\n\n${text}`);
              return 1; // IDOK
            }
          }
        );
        break;

      case 'user32.FindWindow':
      case 'user32.FindWindowA':
        this.apiImplementations.set(key, (className: string, windowName: string) => {
          // Simulated window finding
          if (windowName === 'Calculator') return 100;
          if (windowName === 'Notepad') return 101;
          return 0; // NULL
        });
        break;

      case 'user32.SetWindowText':
      case 'user32.SetWindowTextA':
        this.apiImplementations.set(key, (hwnd: number, text: string) => {
          return 1; // TRUE
        });
        break;

      case 'user32.GetSystemMetrics':
        this.apiImplementations.set(key, (index: number) => {
          const metrics: Record<number, number> = {
            0: window.screen.width, // SM_CXSCREEN
            1: window.screen.height, // SM_CYSCREEN
            2: 18, // SM_CXVSCROLL
            3: 18, // SM_CYHSCROLL
            4: 32, // SM_CYCAPTION
            5: 1, // SM_CXBORDER
            6: 1, // SM_CYBORDER
          };
          return metrics[index] || 0;
        });
        break;

      // Kernel32.dll APIs
      case 'kernel32.GetTickCount':
        this.apiImplementations.set(key, () => {
          return Date.now() & 0xffffffff; // Return as 32-bit value
        });
        break;

      case 'kernel32.Sleep':
        this.apiImplementations.set(key, async (milliseconds: number) => {
          await new Promise(resolve => setTimeout(resolve, milliseconds));
        });
        break;

      case 'kernel32.GetCurrentDirectory':
      case 'kernel32.GetCurrentDirectoryA':
        this.apiImplementations.set(key, (bufferLength: number, buffer: string) => {
          const currentDir = '/';
          return currentDir.length;
        });
        break;

      case 'kernel32.GetTempPath':
      case 'kernel32.GetTempPathA':
        this.apiImplementations.set(key, (bufferLength: number, buffer: string) => {
          const tempPath = '/tmp/';
          return tempPath.length;
        });
        break;

      case 'kernel32.GetComputerName':
      case 'kernel32.GetComputerNameA':
        this.apiImplementations.set(key, (buffer: string, size: number) => {
          const computerName = 'WEB-VB6-IDE';
          return 1; // TRUE
        });
        break;

      // Shell32.dll APIs
      case 'shell32.ShellExecute':
      case 'shell32.ShellExecuteA':
        this.apiImplementations.set(
          key,
          (
            hwnd: number,
            operation: string,
            file: string,
            parameters: string,
            directory: string,
            showCmd: number
          ) => {
            if (operation === 'open' && file.startsWith('http')) {
              window.open(file, '_blank');
              return 42; // Success (> 32)
            }
            return 42;
          }
        );
        break;

      // GDI32.dll APIs
      case 'gdi32.CreatePen':
        this.apiImplementations.set(key, (style: number, width: number, color: number) => {
          return { style, width, color, handle: (Math.random() * 1000) | 0 };
        });
        break;

      case 'gdi32.CreateSolidBrush':
        this.apiImplementations.set(key, (color: number) => {
          return { color, handle: (Math.random() * 1000) | 0 };
        });
        break;

      // WinMM.dll APIs (Multimedia)
      case 'winmm.PlaySound':
      case 'winmm.PlaySoundA':
        this.apiImplementations.set(key, (soundName: string, hmod: number, flags: number) => {
          // Could use Web Audio API here
          return 1; // TRUE
        });
        break;

      case 'winmm.mciSendString':
      case 'winmm.mciSendStringA':
        this.apiImplementations.set(
          key,
          (command: string, returnString: string, returnSize: number, hwndCallback: number) => {
            return 0; // Success
          }
        );
        break;
    }
  }

  /**
   * Get default return value for a VB6 data type
   */
  private static getDefaultReturnValue(type: VB6DataType): any {
    switch (type) {
      case 'Long':
      case 'Integer':
      case 'Byte':
        return 0;
      case 'Boolean':
        return false;
      case 'String':
        return '';
      case 'Single':
      case 'Double':
      case 'Currency':
        return 0.0;
      case 'Date':
        return new Date(0);
      case 'Object':
        return null;
      case 'Variant':
      case 'Any':
        return undefined;
      default:
        return 0;
    }
  }

  /**
   * Parse a Declare statement from VB6 code
   */
  static parseDeclareStatement(statement: string): VB6DeclareFunction | null {
    // Regex for parsing Declare statements
    const declareRegex =
      /Declare\s+(Function|Sub)\s+(\w+)\s+Lib\s+"([^"]+)"(?:\s+Alias\s+"([^"]+)")?\s*\(([^)]*)\)(?:\s+As\s+(\w+))?/i;

    const match = statement.match(declareRegex);
    if (!match) return null;

    const [, type, name, library, alias, params, returnType] = match;

    // Parse parameters
    const parameters = this.parseParameters(params);

    return {
      name,
      library: library.toLowerCase().replace('.dll', ''),
      alias,
      parameters,
      returnType: (returnType as VB6DataType) || 'Variant',
      isFunction: type.toLowerCase() === 'function',
    };
  }

  /**
   * Parse function parameters
   */
  private static parseParameters(paramString: string): VB6Parameter[] {
    if (!paramString.trim()) return [];

    const params: VB6Parameter[] = [];
    const paramParts = paramString.split(',');

    for (const part of paramParts) {
      const paramRegex =
        /(?:(ByVal|ByRef)\s+)?(?:(Optional)\s+)?(\w+)(?:\(\))?(?:\s+As\s+(\w+))?(?:\s*=\s*(.+))?/i;
      const match = part.trim().match(paramRegex);

      if (match) {
        const [, passingMode, optional, name, type, defaultValue] = match;
        params.push({
          name,
          type: (type as VB6DataType) || 'Variant',
          byRef: passingMode?.toLowerCase() !== 'byval',
          optional: optional?.toLowerCase() === 'optional',
          defaultValue: defaultValue
            ? this.parseDefaultValue(defaultValue, type as VB6DataType)
            : undefined,
          isArray: part.includes('()'),
        });
      }
    }

    return params;
  }

  /**
   * Parse default parameter value
   */
  private static parseDefaultValue(value: string, type: VB6DataType): any {
    value = value.trim();

    switch (type) {
      case 'String':
        return value.replace(/^"|"$/g, '');
      case 'Boolean':
        return value.toLowerCase() === 'true';
      case 'Long':
      case 'Integer':
      case 'Byte':
        return parseInt(value, 10);
      case 'Single':
      case 'Double':
      case 'Currency':
        return parseFloat(value);
      default:
        return value;
    }
  }
}

/**
 * Common Windows API Constants
 */
export const VB6APIConstants = {
  // MessageBox constants
  MB_OK: 0x00000000,
  MB_OKCANCEL: 0x00000001,
  MB_ABORTRETRYIGNORE: 0x00000002,
  MB_YESNOCANCEL: 0x00000003,
  MB_YESNO: 0x00000004,
  MB_RETRYCANCEL: 0x00000005,
  MB_ICONHAND: 0x00000010,
  MB_ICONQUESTION: 0x00000020,
  MB_ICONEXCLAMATION: 0x00000030,
  MB_ICONASTERISK: 0x00000040,

  // ShowWindow constants
  SW_HIDE: 0,
  SW_SHOWNORMAL: 1,
  SW_SHOWMINIMIZED: 2,
  SW_SHOWMAXIMIZED: 3,
  SW_SHOWNOACTIVATE: 4,
  SW_SHOW: 5,
  SW_MINIMIZE: 6,
  SW_SHOWMINNOACTIVE: 7,
  SW_SHOWNA: 8,
  SW_RESTORE: 9,
  SW_SHOWDEFAULT: 10,

  // GetSystemMetrics constants
  SM_CXSCREEN: 0,
  SM_CYSCREEN: 1,
  SM_CXVSCROLL: 2,
  SM_CYHSCROLL: 3,
  SM_CYCAPTION: 4,
  SM_CXBORDER: 5,
  SM_CYBORDER: 6,

  // Virtual Key Codes
  VK_BACK: 0x08,
  VK_TAB: 0x09,
  VK_RETURN: 0x0d,
  VK_SHIFT: 0x10,
  VK_CONTROL: 0x11,
  VK_MENU: 0x12,
  VK_PAUSE: 0x13,
  VK_CAPITAL: 0x14,
  VK_ESCAPE: 0x1b,
  VK_SPACE: 0x20,
  VK_END: 0x23,
  VK_HOME: 0x24,
  VK_LEFT: 0x25,
  VK_UP: 0x26,
  VK_RIGHT: 0x27,
  VK_DOWN: 0x28,
  VK_INSERT: 0x2d,
  VK_DELETE: 0x2e,

  // File attributes
  FILE_ATTRIBUTE_NORMAL: 0x80,
  FILE_ATTRIBUTE_HIDDEN: 0x02,
  FILE_ATTRIBUTE_READONLY: 0x01,
  FILE_ATTRIBUTE_SYSTEM: 0x04,
  FILE_ATTRIBUTE_DIRECTORY: 0x10,
  FILE_ATTRIBUTE_ARCHIVE: 0x20,
};

// Export for global access
export default VB6DeclareRegistry;
