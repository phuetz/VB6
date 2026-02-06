/**
 * VB6 Advanced Clipboard Operations
 * Provides comprehensive clipboard functionality for text, images, and custom formats
 */

// Clipboard format constants
export enum ClipboardFormat {
  vbCFText = 1,
  vbCFBitmap = 2,
  vbCFMetafile = 3,
  vbCFDIB = 8,
  vbCFPalette = 9,
  vbCFEMetafile = 14,
  vbCFFiles = 15,
  vbCFRTF = -16639,
}

// Custom clipboard data structure
interface ClipboardData {
  format: ClipboardFormat | string;
  data: any;
  timestamp: number;
}

// Clipboard history for undo/redo operations
class ClipboardHistory {
  private static instance: ClipboardHistory;
  private history: ClipboardData[] = [];
  private maxHistory: number = 50;

  static getInstance(): ClipboardHistory {
    if (!ClipboardHistory.instance) {
      ClipboardHistory.instance = new ClipboardHistory();
    }
    return ClipboardHistory.instance;
  }

  addEntry(data: ClipboardData): void {
    this.history.unshift(data);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
  }

  getHistory(): ClipboardData[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}

// Virtual clipboard storage for custom formats
class VirtualClipboard {
  private static instance: VirtualClipboard;
  private data: Map<ClipboardFormat | string, any> = new Map();
  private listeners: Set<(format: ClipboardFormat | string, data: any) => void> = new Set();

  static getInstance(): VirtualClipboard {
    if (!VirtualClipboard.instance) {
      VirtualClipboard.instance = new VirtualClipboard();
    }
    return VirtualClipboard.instance;
  }

  setData(format: ClipboardFormat | string, data: any): void {
    this.data.set(format, data);

    // Add to history
    const clipboardHistory = ClipboardHistory.getInstance();
    clipboardHistory.addEntry({
      format,
      data,
      timestamp: Date.now(),
    });

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(format, data);
      } catch (error) {
        console.error('Clipboard listener error:', error);
      }
    });
  }

  getData(format: ClipboardFormat | string): any {
    return this.data.get(format);
  }

  hasData(format: ClipboardFormat | string): boolean {
    return this.data.has(format);
  }

  getFormats(): (ClipboardFormat | string)[] {
    return Array.from(this.data.keys());
  }

  clear(): void {
    this.data.clear();
  }

  addListener(listener: (format: ClipboardFormat | string, data: any) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (format: ClipboardFormat | string, data: any) => void): void {
    this.listeners.delete(listener);
  }
}

const virtualClipboard = VirtualClipboard.getInstance();
const clipboardHistory = ClipboardHistory.getInstance();

/**
 * Set clipboard text content
 */
export async function SetText(text: string): Promise<void> {
  try {
    // BROWSER COMPATIBILITY FIX: Check for Clipboard API with proper feature detection
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        // Clipboard API might be blocked by permissions - fall through to legacy method
        console.warn('Clipboard API failed, using fallback:', err);
        await setTextLegacy(text);
      }
    } else {
      // Use legacy fallback for older browsers
      await setTextLegacy(text);
    }

    // Store in virtual clipboard
    virtualClipboard.setData(ClipboardFormat.vbCFText, text);
  } catch (error) {
    console.error('Failed to set clipboard text:', error);
    throw new Error('Failed to set clipboard text');
  }
}

/**
 * Get clipboard text content
 */
export async function GetText(): Promise<string> {
  try {
    // BROWSER COMPATIBILITY FIX: Check for Clipboard API with proper feature detection
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const text = await navigator.clipboard.readText();

        // Update virtual clipboard
        virtualClipboard.setData(ClipboardFormat.vbCFText, text);

        return text;
      } catch (err) {
        // Clipboard API might be blocked by permissions
        console.warn('Clipboard read failed, using virtual clipboard:', err);
        return virtualClipboard.getData(ClipboardFormat.vbCFText) || '';
      }
    } else {
      // Legacy browsers: try paste event or return from virtual clipboard
      return await getTextLegacy();
    }
  } catch (error) {
    console.error('Failed to get clipboard text:', error);
    // Return from virtual clipboard as fallback
    return virtualClipboard.getData(ClipboardFormat.vbCFText) || '';
  }
}

/**
 * Set clipboard data with specific format
 */
export async function SetData(
  data: any,
  format: ClipboardFormat = ClipboardFormat.vbCFText
): Promise<void> {
  try {
    switch (format) {
      case ClipboardFormat.vbCFText:
        await SetText(String(data));
        break;

      case ClipboardFormat.vbCFRTF:
        // RTF format - store as custom format
        virtualClipboard.setData(format, data);

        // Also try to set as HTML if possible
        // BROWSER COMPATIBILITY FIX: Check for ClipboardItem support
        if (
          navigator.clipboard &&
          typeof navigator.clipboard.write === 'function' &&
          typeof ClipboardItem !== 'undefined'
        ) {
          try {
            const htmlData = convertRTFToHTML(String(data));
            const clipboardItem = new ClipboardItem({
              'text/html': new Blob([htmlData], { type: 'text/html' }),
              'text/plain': new Blob([extractTextFromRTF(String(data))], { type: 'text/plain' }),
            });
            await navigator.clipboard.write([clipboardItem]);
          } catch (err) {
            console.warn('Clipboard write failed for RTF:', err);
          }
        }
        break;

      case ClipboardFormat.vbCFBitmap:
      case ClipboardFormat.vbCFDIB:
        // Image formats
        if (data instanceof Blob || data instanceof File) {
          // BROWSER COMPATIBILITY FIX: Check for ClipboardItem support
          if (
            navigator.clipboard &&
            typeof navigator.clipboard.write === 'function' &&
            typeof ClipboardItem !== 'undefined'
          ) {
            try {
              const clipboardItem = new ClipboardItem({
                [data.type]: data,
              });
              await navigator.clipboard.write([clipboardItem]);
            } catch (err) {
              console.warn('Clipboard write failed for blob:', err);
            }
          }
        } else if (typeof data === 'string') {
          // Data URL or base64
          const blob = dataURLToBlob(data);
          // BROWSER COMPATIBILITY FIX: Check for ClipboardItem support
          if (
            blob &&
            navigator.clipboard &&
            typeof navigator.clipboard.write === 'function' &&
            typeof ClipboardItem !== 'undefined'
          ) {
            try {
              const clipboardItem = new ClipboardItem({
                [blob.type]: blob,
              });
              await navigator.clipboard.write([clipboardItem]);
            } catch (err) {
              console.warn('Clipboard write failed for data URL:', err);
            }
          }
        }

        virtualClipboard.setData(format, data);
        break;

      case ClipboardFormat.vbCFFiles:
        // File list format
        virtualClipboard.setData(format, data);
        break;

      default:
        // Custom format
        virtualClipboard.setData(format, data);
        break;
    }
  } catch (error) {
    console.error('Failed to set clipboard data:', error);
    // Always store in virtual clipboard as fallback
    virtualClipboard.setData(format, data);
  }
}

/**
 * Get clipboard data with specific format
 */
export async function GetData(format: ClipboardFormat = ClipboardFormat.vbCFText): Promise<any> {
  try {
    switch (format) {
      case ClipboardFormat.vbCFText:
        return await GetText();

      case ClipboardFormat.vbCFRTF: {
        // Try to get RTF from virtual clipboard first
        const rtfData = virtualClipboard.getData(format);
        if (rtfData) return rtfData;

        // Try to get HTML from system clipboard and convert
        // BROWSER COMPATIBILITY FIX: Check for clipboard.read support
        if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
          try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
              if (item.types.includes('text/html')) {
                const blob = await item.getType('text/html');
                const html = await blob.text();
                return convertHTMLToRTF(html);
              }
            }
          } catch (err) {
            console.warn('Clipboard read failed for RTF:', err);
          }
        }
        return '';
      }

      case ClipboardFormat.vbCFBitmap:
      case ClipboardFormat.vbCFDIB:
        // Try to get image from system clipboard
        // BROWSER COMPATIBILITY FIX: Check for clipboard.read support
        if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
          try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
              const imageTypes = item.types.filter(type => type.startsWith('image/'));
              if (imageTypes.length > 0) {
                const blob = await item.getType(imageTypes[0]);
                return blob;
              }
            }
          } catch (err) {
            console.warn('Clipboard read failed for image:', err);
          }
        }

        // Fallback to virtual clipboard
        return virtualClipboard.getData(format);

      default:
        // Custom format - get from virtual clipboard
        return virtualClipboard.getData(format);
    }
  } catch (error) {
    console.error('Failed to get clipboard data:', error);
    // Fallback to virtual clipboard
    return virtualClipboard.getData(format);
  }
}

/**
 * Check if clipboard contains data in specific format
 */
export async function GetFormat(format: ClipboardFormat): Promise<boolean> {
  try {
    switch (format) {
      case ClipboardFormat.vbCFText:
        // BROWSER COMPATIBILITY FIX: Check for readText support
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
          try {
            await navigator.clipboard.readText();
            return true;
          } catch {
            // Permission denied or not supported
            return virtualClipboard.hasData(format);
          }
        }
        return virtualClipboard.hasData(format);

      case ClipboardFormat.vbCFBitmap:
      case ClipboardFormat.vbCFDIB:
        if (navigator.clipboard && navigator.clipboard.read) {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            if (item.types.some(type => type.startsWith('image/'))) {
              return true;
            }
          }
        }
        return virtualClipboard.hasData(format);

      default:
        return virtualClipboard.hasData(format);
    }
  } catch (error) {
    console.error('Failed to check clipboard format:', error);
    return virtualClipboard.hasData(format);
  }
}

/**
 * Get all available clipboard formats
 */
export async function GetFormats(): Promise<(ClipboardFormat | string)[]> {
  const formats: Set<ClipboardFormat | string> = new Set();

  // Add formats from virtual clipboard
  virtualClipboard.getFormats().forEach(format => formats.add(format));

  // Check system clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type === 'text/plain') {
            formats.add(ClipboardFormat.vbCFText);
          } else if (type === 'text/html') {
            formats.add(ClipboardFormat.vbCFRTF);
          } else if (type.startsWith('image/')) {
            formats.add(ClipboardFormat.vbCFBitmap);
          } else {
            formats.add(type);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get clipboard formats:', error);
  }

  return Array.from(formats);
}

/**
 * Clear clipboard
 */
export async function Clear(): Promise<void> {
  try {
    // Clear system clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText('');
    }

    // Clear virtual clipboard
    virtualClipboard.clear();
  } catch (error) {
    console.error('Failed to clear clipboard:', error);
    // At least clear virtual clipboard
    virtualClipboard.clear();
  }
}

/**
 * Get clipboard history
 */
export function GetHistory(): ClipboardData[] {
  return clipboardHistory.getHistory();
}

/**
 * Clear clipboard history
 */
export function ClearHistory(): void {
  clipboardHistory.clear();
}

/**
 * Add clipboard change listener
 */
export function AddClipboardListener(
  listener: (format: ClipboardFormat | string, data: any) => void
): void {
  virtualClipboard.addListener(listener);
}

/**
 * Remove clipboard change listener
 */
export function RemoveClipboardListener(
  listener: (format: ClipboardFormat | string, data: any) => void
): void {
  virtualClipboard.removeListener(listener);
}

// Helper functions

/**
 * Convert RTF to HTML (simplified)
 */
function convertRTFToHTML(rtf: string): string {
  // Basic RTF to HTML conversion
  const html = rtf
    .replace(/\\b\s*/g, '<b>')
    .replace(/\\b0\s*/g, '</b>')
    .replace(/\\i\s*/g, '<i>')
    .replace(/\\i0\s*/g, '</i>')
    .replace(/\\u\s*/g, '<u>')
    .replace(/\\u0\s*/g, '</u>')
    .replace(/\\line\s*/g, '<br>')
    .replace(/\\par\s*/g, '<p>')
    .replace(/\\tab\s*/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/\\\\/g, '\\')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}');

  return `<html><body>${html}</body></html>`;
}

/**
 * Convert HTML to RTF (simplified)
 */
function convertHTMLToRTF(html: string): string {
  // Basic HTML to RTF conversion
  const rtf = html
    .replace(/<b>/g, '\\b ')
    .replace(/<\/b>/g, '\\b0 ')
    .replace(/<i>/g, '\\i ')
    .replace(/<\/i>/g, '\\i0 ')
    .replace(/<u>/g, '\\u ')
    .replace(/<\/u>/g, '\\u0 ')
    .replace(/<br\s*\/?>/g, '\\line ')
    .replace(/<p>/g, '\\par ')
    .replace(/<\/p>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}');

  return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${rtf}}`;
}

/**
 * Extract plain text from RTF
 */
function extractTextFromRTF(rtf: string): string {
  return rtf
    .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF commands
    .replace(/[{}]/g, '') // Remove braces
    .replace(/\\\\/g, '\\') // Unescape backslashes
    .trim();
}

/**
 * Convert data URL to Blob
 */
function dataURLToBlob(dataURL: string): Blob | null {
  try {
    const parts = dataURL.split(',');
    if (parts.length !== 2) return null;

    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeType });
  } catch (error) {
    console.error('Failed to convert data URL to blob:', error);
    return null;
  }
}

// VB6 Clipboard Object (for compatibility)
export class VB6Clipboard {
  // Properties
  static get Text(): string {
    return virtualClipboard.getData(ClipboardFormat.vbCFText) || '';
  }

  static set Text(value: string) {
    SetText(value);
  }

  // Methods
  static Clear(): void {
    Clear();
  }

  static GetData(format: ClipboardFormat = ClipboardFormat.vbCFText): any {
    return GetData(format);
  }

  static SetData(data: any, format: ClipboardFormat = ClipboardFormat.vbCFText): void {
    SetData(data, format);
  }

  static GetFormat(format: ClipboardFormat): boolean {
    return virtualClipboard.hasData(format);
  }

  static GetText(): string {
    return virtualClipboard.getData(ClipboardFormat.vbCFText) || '';
  }

  static SetText(text: string): void {
    SetText(text);
  }
}

// Export the clipboard system
export const VB6ClipboardOperations = {
  // Core functions
  SetText,
  GetText,
  SetData,
  GetData,
  GetFormat,
  GetFormats,
  Clear,

  // History functions
  GetHistory,
  ClearHistory,

  // Event functions
  AddClipboardListener,
  RemoveClipboardListener,

  // VB6 Clipboard object
  Clipboard: VB6Clipboard,

  // Constants
  ClipboardFormat,

  // Advanced features
  VirtualClipboard: virtualClipboard,
  ClipboardHistory: clipboardHistory,
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.VB6ClipboardOperations = VB6ClipboardOperations;
  globalAny.Clipboard = VB6Clipboard;

  // Expose individual functions globally for VB6 compatibility
  Object.assign(globalAny, {
    SetClipboardText: SetText,
    GetClipboardText: GetText,
    SetClipboardData: SetData,
    GetClipboardData: GetData,
    GetClipboardFormat: GetFormat,
    GetClipboardFormats: GetFormats,
    ClearClipboard: Clear,
  });

  // Expose clipboard format constants
  Object.assign(globalAny, {
    vbCFText: ClipboardFormat.vbCFText,
    vbCFBitmap: ClipboardFormat.vbCFBitmap,
    vbCFMetafile: ClipboardFormat.vbCFMetafile,
    vbCFDIB: ClipboardFormat.vbCFDIB,
    vbCFPalette: ClipboardFormat.vbCFPalette,
    vbCFEMetafile: ClipboardFormat.vbCFEMetafile,
    vbCFFiles: ClipboardFormat.vbCFFiles,
    vbCFRTF: ClipboardFormat.vbCFRTF,
  });
}

// Legacy clipboard helper functions
async function setTextLegacy(text: string): Promise<void> {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.setAttribute('readonly', '');
  document.body.appendChild(textArea);

  // iOS compatibility
  if (navigator.userAgent.match(/ipad|iphone/i)) {
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    textArea.setSelectionRange(0, 999999);
  } else {
    textArea.select();
  }

  try {
    document.execCommand('copy');
  } catch (err) {
    console.warn('Legacy copy command failed:', err);
  }

  document.body.removeChild(textArea);
}

async function getTextLegacy(): Promise<string> {
  // Try to use paste event (requires user interaction)
  return new Promise<string>(resolve => {
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.removeEventListener('paste', handlePaste);
      resolve(text);
    };

    document.addEventListener('paste', handlePaste);

    // Timeout fallback to virtual clipboard
    setTimeout(() => {
      document.removeEventListener('paste', handlePaste);
      resolve(virtualClipboard.getData(ClipboardFormat.vbCFText) || '');
    }, 100);
  });
}

export default VB6ClipboardOperations;
