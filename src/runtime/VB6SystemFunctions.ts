/**
 * VB6 System Functions
 * 
 * System-level functions for VB6 runtime
 */

/**
 * BROWSER FINGERPRINTING BUG FIX: System information fingerprinting protection
 */
class SystemFingerprintingProtection {
  private static instance: SystemFingerprintingProtection;
  private sessionNoise: Map<string, number> = new Map();
  
  static getInstance(): SystemFingerprintingProtection {
    if (!this.instance) {
      this.instance = new SystemFingerprintingProtection();
    }
    return this.instance;
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Anonymize platform information
   */
  anonymizePlatform(): string {
    // Return generic platform instead of real navigator.platform
    const genericPlatforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    const sessionIndex = this.getSessionNoise('platform') * genericPlatforms.length;
    return genericPlatforms[Math.floor(sessionIndex)];
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Obfuscate audio timing
   */
  obfuscateAudioTiming(duration: number): number {
    // Quantize audio timing to prevent timing-based fingerprinting
    const quantized = Math.round(duration / 10) * 10; // 10ms quantization
    const jitter = (this.getSessionNoise('audio_timing') - 0.5) * 20; // ±10ms
    return Math.max(50, quantized + jitter); // Minimum 50ms
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Anonymize system information
   */
  anonymizeSystemInfo(key: string): string {
    // Return consistent but anonymized system information
    const anonymizedInfo: { [key: string]: string[] } = {
      'USERNAME': ['User1', 'User2', 'DefaultUser'],
      'COMPUTERNAME': ['Computer1', 'Computer2', 'Workstation'],
      'OS': ['Windows_NT', 'Windows_NT', 'Windows_NT'],
      'TEMP': ['C:\\Temp', 'C:\\Windows\\Temp', 'C:\\Tmp'],
      'TMP': ['C:\\Temp', 'C:\\Windows\\Temp', 'C:\\Tmp'],
      'USERPROFILE': ['C:\\Users\\User', 'C:\\Users\\Default', 'C:\\Users\\Public'],
      'HOMEDRIVE': ['C:', 'C:', 'C:'],
      'HOMEPATH': ['\\Users\\User', '\\Users\\Default', '\\Users\\Public']
    };
    
    if (anonymizedInfo[key]) {
      const sessionIndex = this.getSessionNoise(key) * anonymizedInfo[key].length;
      return anonymizedInfo[key][Math.floor(sessionIndex)];
    }
    
    return 'Unknown';
  }
  
  /**
   * BROWSER FINGERPRINTING BUG FIX: Get session-consistent noise
   */
  private getSessionNoise(key: string): number {
    if (!this.sessionNoise.has(key)) {
      // Generate session-consistent pseudo-random noise
      let hash = 0;
      const sessionKey = key + (sessionStorage.getItem('vb6_system_session') || 'system_default');
      for (let i = 0; i < sessionKey.length; i++) {
        const char = sessionKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      this.sessionNoise.set(key, Math.abs(hash % 1000) / 1000);
    }
    return this.sessionNoise.get(key)!;
  }
}

export class VB6SystemFunctions {
  private static messageBoxQueue: Array<{
    message: string;
    title: string;
    buttons: number;
    icon: number;
    resolve: (result: number) => void;
  }> = [];

  /**
   * Beep - Sounds a beep through the computer speaker
   */
  static Beep(): void {
    // Create a short beep sound using Web Audio API
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // BROWSER FINGERPRINTING BUG FIX: Use standardized frequency to prevent audio fingerprinting
      oscillator.frequency.value = 800; // 800 Hz (standardized)
      gainNode.gain.value = 0.3; // Fixed gain
      
      // BROWSER FINGERPRINTING BUG FIX: Obfuscate timing
      const protection = SystemFingerprintingProtection.getInstance();
      const duration = protection.obfuscateAudioTiming(100) / 1000; // Convert to seconds
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } else {
      // Fallback for non-browser environments
      console.log('\u0007'); // ASCII bell character
    }
  }

  /**
   * Command - Returns command line arguments
   */
  static Command(): string {
    if (typeof process !== 'undefined' && process.argv) {
      // Node.js environment
      return process.argv.slice(2).join(' ');
    } else if (typeof window !== 'undefined' && window.location) {
      // Browser environment - return query string
      return window.location.search.substring(1);
    }
    return '';
  }

  /**
   * CurDir - Returns current directory
   * @param drive Optional drive letter
   */
  static CurDir(drive?: string): string {
    if (typeof process !== 'undefined' && process.cwd) {
      const cwd = process.cwd();
      if (drive) {
        // In Windows, filter by drive
        const driveLetter = drive.charAt(0).toUpperCase();
        if (cwd.charAt(0).toUpperCase() === driveLetter) {
          return cwd;
        }
        return driveLetter + ':\\';
      }
      return cwd;
    }
    
    // Browser environment - return a virtual path
    return 'C:\\VB6\\Projects';
  }

  /**
   * Dir - Returns file name matching pattern
   * @param pathname File pattern to search
   * @param attributes File attributes
   */
  static Dir(pathname?: string, attributes?: number): string {
    // This would need file system access
    // For now, return empty string (no match)
    console.warn('Dir function requires file system access');
    return '';
  }

  /**
   * Environ - Returns environment variable value
   * CONFIGURATION VULNERABILITY BUG FIX: Secure access to environment variables
   * @param expression Variable name or index
   */
  static Environ(expression: string | number): string {
    // CONFIGURATION VULNERABILITY BUG FIX: Whitelist of safe environment variables only
    const SAFE_ENV_VARS = [
      'NODE_ENV',
      'PUBLIC_URL', 
      'REACT_APP_VERSION',
      'REACT_APP_BUILD_DATE',
      'TZ', // Timezone
      'LANG', // Language
      'USER', // Current user (not sensitive)
      'HOME', // Home directory (not sensitive in server context)
      'PATH' // PATH variable (not sensitive)
    ];

    if (typeof process !== 'undefined' && process.env) {
      if (typeof expression === 'string') {
        // CONFIGURATION VULNERABILITY BUG FIX: Only return whitelisted environment variables
        if (SAFE_ENV_VARS.includes(expression)) {
          return process.env[expression] || '';
        } else {
          console.warn(`Access to environment variable '${expression}' blocked for security reasons`);
          // Return empty string for blocked variables
          return '';
        }
      } else {
        // Return nth environment variable - only from safe list
        const safeKeys = SAFE_ENV_VARS.filter(key => key in (process.env || {}));
        if (expression >= 1 && expression <= safeKeys.length) {
          const key = safeKeys[expression - 1];
          return `${key}=${process.env[key]}`;
        }
      }
    }
    
    // Browser environment - return anonymized simulated variables
    const protection = SystemFingerprintingProtection.getInstance();
    const browserEnv: { [key: string]: string } = {
      // BROWSER FINGERPRINTING BUG FIX: Use anonymized system information
      'USERNAME': protection.anonymizeSystemInfo('USERNAME'),
      'COMPUTERNAME': protection.anonymizeSystemInfo('COMPUTERNAME'),
      'OS': protection.anonymizeSystemInfo('OS'),
      'TEMP': protection.anonymizeSystemInfo('TEMP'),
      'TMP': protection.anonymizeSystemInfo('TMP'),
      'USERPROFILE': protection.anonymizeSystemInfo('USERPROFILE'),
      'HOMEDRIVE': protection.anonymizeSystemInfo('HOMEDRIVE'),
      'HOMEPATH': protection.anonymizeSystemInfo('HOMEPATH')
    };
    
    if (typeof expression === 'string') {
      return browserEnv[expression] || '';
    }
    
    return '';
  }

  /**
   * EOF - Returns True if at end of file
   * @param fileNumber File number
   */
  static EOF(fileNumber: number): boolean {
    // Would need file system implementation
    console.warn('EOF function requires file system access');
    return true;
  }

  /**
   * FileAttr - Returns file mode for open file
   * @param fileNumber File number
   * @param returnType 1 for mode, 2 for handle
   */
  static FileAttr(fileNumber: number, returnType: number = 1): number {
    // Would need file system implementation
    console.warn('FileAttr function requires file system access');
    return 0;
  }

  /**
   * FileDateTime - Returns date/time file was last modified
   * @param pathname File path
   */
  static FileDateTime(pathname: string): Date {
    // Would need file system access
    console.warn('FileDateTime function requires file system access');
    return new Date();
  }

  /**
   * FileLen - Returns length of file in bytes
   * @param pathname File path
   */
  static FileLen(pathname: string): number {
    // Would need file system access
    console.warn('FileLen function requires file system access');
    return 0;
  }

  /**
   * FreeFile - Returns next available file number
   * @param rangeNumber 0 for 1-255, 1 for 256-511
   */
  static FreeFile(rangeNumber: number = 0): number {
    // Simple implementation - would need tracking of open files
    return rangeNumber === 0 ? 1 : 256;
  }

  /**
   * GetAttr - Returns file attributes
   * @param pathname File path
   */
  static GetAttr(pathname: string): number {
    // Would need file system access
    console.warn('GetAttr function requires file system access');
    return 0; // vbNormal
  }

  /**
   * GetSetting - Reads from registry/storage
   * @param appName Application name
   * @param section Section name
   * @param key Key name
   * @param defaultValue Default value if not found
   */
  static GetSetting(
    appName: string,
    section: string,
    key: string,
    defaultValue: string = ''
  ): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `VB6_${appName}_${section}_${key}`;
      return localStorage.getItem(storageKey) || defaultValue;
    }
    
    // Node.js could use a config file
    return defaultValue;
  }

  /**
   * GetAllSettings - Returns all settings for section
   * @param appName Application name
   * @param section Section name
   */
  static GetAllSettings(appName: string, section: string): Array<[string, string]> {
    const settings: Array<[string, string]> = [];
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefix = `VB6_${appName}_${section}_`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const settingKey = key.substring(prefix.length);
          const value = localStorage.getItem(key) || '';
          settings.push([settingKey, value]);
        }
      }
    }
    
    return settings;
  }

  /**
   * SaveSetting - Saves to registry/storage
   * @param appName Application name
   * @param section Section name
   * @param key Key name
   * @param setting Value to save
   */
  static SaveSetting(
    appName: string,
    section: string,
    key: string,
    setting: string
  ): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `VB6_${appName}_${section}_${key}`;
      localStorage.setItem(storageKey, setting);
    }
  }

  /**
   * DeleteSetting - Deletes from registry/storage
   * @param appName Application name
   * @param section Section name
   * @param key Optional key name (deletes all if not specified)
   */
  static DeleteSetting(appName: string, section: string, key?: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (key) {
        const storageKey = `VB6_${appName}_${section}_${key}`;
        localStorage.removeItem(storageKey);
      } else {
        // Delete all keys in section
        const prefix = `VB6_${appName}_${section}_`;
        const keysToDelete: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey.startsWith(prefix)) {
            keysToDelete.push(storageKey);
          }
        }
        
        keysToDelete.forEach(k => localStorage.removeItem(k));
      }
    }
  }

  /**
   * InputBox - Displays prompt and returns user input
   * @param prompt Message to display
   * @param title Dialog title
   * @param defaultResponse Default value
   * @param xPos X position (ignored in web)
   * @param yPos Y position (ignored in web)
   */
  static InputBox(
    prompt: string,
    title: string = 'Microsoft Visual Basic',
    defaultResponse: string = '',
    xPos?: number,
    yPos?: number
  ): string {
    if (typeof window !== 'undefined') {
      const result = window.prompt(prompt, defaultResponse);
      return result !== null ? result : '';
    }
    
    // Non-browser environment
    console.log(`InputBox: ${prompt}`);
    return defaultResponse;
  }

  /**
   * MsgBox - Displays message box
   * @param prompt Message to display
   * @param buttons Button and icon flags
   * @param title Dialog title
   */
  static async MsgBox(
    prompt: string,
    buttons: number = 0,
    title: string = 'Microsoft Visual Basic'
  ): Promise<number> {
    // Extract button type
    const buttonType = buttons & 0x7;
    const iconType = buttons & 0x70;
    const defaultButton = buttons & 0x300;
    const modality = buttons & 0x1000;
    
    if (typeof window !== 'undefined') {
      // Browser implementation
      return new Promise((resolve) => {
        // Queue the message box
        this.messageBoxQueue.push({
          message: prompt,
          title,
          buttons: buttonType,
          icon: iconType,
          resolve
        });
        
        // Process queue if not already processing
        if (this.messageBoxQueue.length === 1) {
          this.processMessageBoxQueue();
        }
      });
    } else {
      // Console implementation
      console.log(`[${title}] ${prompt}`);
      
      // Return appropriate value based on button type
      switch (buttonType) {
        case 0: // vbOKOnly
        case 1: // vbOKCancel
          return 1; // vbOK
        case 2: // vbAbortRetryIgnore
          return 3; // vbAbort
        case 3: // vbYesNoCancel
        case 4: // vbYesNo
          return 6; // vbYes
        case 5: // vbRetryCancel
          return 4; // vbRetry
        default:
          return 1; // vbOK
      }
    }
  }

  /**
   * Now - Returns current date and time
   */
  static Now(): Date {
    return new Date();
  }

  /**
   * RGB - Returns RGB color value
   * @param red Red component (0-255)
   * @param green Green component (0-255)
   * @param blue Blue component (0-255)
   */
  static RGB(red: number, green: number, blue: number): number {
    // VB6 RGB format: 0x00BBGGRR
    red = Math.max(0, Math.min(255, Math.floor(red)));
    green = Math.max(0, Math.min(255, Math.floor(green)));
    blue = Math.max(0, Math.min(255, Math.floor(blue)));
    
    return red | (green << 8) | (blue << 16);
  }

  /**
   * QBColor - Returns RGB value for QB color code
   * @param colorCode QB color code (0-15)
   */
  static QBColor(colorCode: number): number {
    const qbColors = [
      0x000000, // 0 - Black
      0x800000, // 1 - Blue
      0x008000, // 2 - Green
      0x808000, // 3 - Cyan
      0x000080, // 4 - Red
      0x800080, // 5 - Magenta
      0x008080, // 6 - Brown
      0xC0C0C0, // 7 - Light Gray
      0x808080, // 8 - Gray
      0xFF0000, // 9 - Light Blue
      0x00FF00, // 10 - Light Green
      0xFFFF00, // 11 - Light Cyan
      0x0000FF, // 12 - Light Red
      0xFF00FF, // 13 - Light Magenta
      0x00FFFF, // 14 - Yellow
      0xFFFFFF  // 15 - White
    ];
    
    if (colorCode >= 0 && colorCode <= 15) {
      return qbColors[colorCode];
    }
    
    throw new Error('Invalid procedure call or argument');
  }

  /**
   * Shell - Runs executable program
   * @param pathname Program to run
   * @param windowStyle Window style
   */
  static Shell(pathname: string, windowStyle: number = 1): number {
    if (typeof window !== 'undefined') {
      // Browser - open in new window/tab
      const styles = [
        '', // vbHide
        '', // vbNormalFocus
        'width=640,height=480', // vbMinimizedFocus
        'fullscreen=yes', // vbMaximizedFocus
        'width=640,height=480', // vbNormalNoFocus
        'width=100,height=100' // vbMinimizedNoFocus
      ];
      
      window.open(pathname, '_blank', styles[windowStyle] || '');
      return Math.floor(Math.random() * 10000); // Fake process ID
    } else if (typeof process !== 'undefined') {
      // Node.js environment - would need dynamic import
      console.log('Shell command in Node.js:', pathname);
      return Math.floor(Math.random() * 10000); // Fake process ID
    }
    
    return 0;
  }

  /**
   * Timer - Returns seconds since midnight
   */
  static Timer(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    
    return (now.getTime() - midnight.getTime()) / 1000;
  }

  /**
   * DoEvents - Yields execution to process events
   */
  static async DoEvents(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser - yield to event loop
      return new Promise(resolve => setTimeout(resolve, 0));
    } else if (typeof process !== 'undefined') {
      // Node.js - yield to event loop
      return new Promise(resolve => setImmediate(resolve));
    } else {
      // ASYNC EDGE CASE BUG FIX: Always return a resolved Promise for consistency
      return Promise.resolve();
    }
  }

  /**
   * AppActivate - Activates application window
   * @param title Window title or process ID
   */
  static AppActivate(title: string | number): void {
    if (typeof window !== 'undefined') {
      // Browser - try to focus window
      window.focus();
    }
    // In a real implementation, this would activate the specified window
    console.log(`AppActivate: ${title}`);
  }

  /**
   * SendKeys - Sends keystrokes to active window
   * @param keys Keys to send
   * @param wait Wait for keys to be processed
   */
  static SendKeys(keys: string, wait: boolean = false): void {
    if (typeof window !== 'undefined' && document.activeElement) {
      // Simple implementation for input elements
      const element = document.activeElement as HTMLInputElement;
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // Parse SendKeys string and simulate keystrokes
        const parsedKeys = this.parseSendKeysString(keys);
        
        parsedKeys.forEach(key => {
          if (typeof key === 'string') {
            // Regular character
            element.value += key;
          } else {
            // Special key
            const event = new KeyboardEvent('keydown', {
              key: key.key,
              code: key.code,
              ctrlKey: key.ctrl,
              shiftKey: key.shift,
              altKey: key.alt
            });
            element.dispatchEvent(event);
          }
        });
        
        // Trigger input event
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  /**
   * CreateObject - Creates COM object (simulated)
   * @param className Class name
   * @param serverName Server name (ignored)
   */
  static CreateObject(className: string, serverName?: string): any {
    // Simulate common COM objects
    const mockObjects: { [key: string]: any } = {
      'Scripting.FileSystemObject': {
        CreateTextFile: () => ({
          WriteLine: (text: string) => console.log(text),
          Close: () => {}
        }),
        FileExists: (path: string) => false,
        FolderExists: (path: string) => false
      },
      'Scripting.Dictionary': {
        items: new Map(),
        Add: function(key: any, value: any) { this.items.set(key, value); },
        Remove: function(key: any) { this.items.delete(key); },
        RemoveAll: function() { this.items.clear(); },
        Exists: function(key: any) { return this.items.has(key); },
        Item: function(key: any) { return this.items.get(key); },
        Count: function() { return this.items.size; }
      },
      'ADODB.Connection': {
        ConnectionString: '',
        State: 0,
        Open: function() { this.State = 1; },
        Close: function() { this.State = 0; },
        Execute: () => ({ EOF: true, MoveNext: () => {} })
      },
      'Excel.Application': {
        Visible: true,
        Workbooks: {
          Add: () => ({ SaveAs: () => {}, Close: () => {} })
        },
        Quit: () => {}
      }
    };
    
    const obj = mockObjects[className];
    if (obj) {
      return obj;
    }
    
    throw new Error(`Cannot create object: ${className}`);
  }

  /**
   * GetObject - Gets reference to COM object (simulated)
   * @param pathname File path
   * @param className Class name
   */
  static GetObject(pathname?: string, className?: string): any {
    // Simulated implementation
    if (className) {
      return this.CreateObject(className);
    }
    
    throw new Error('Cannot get object');
  }

  // Helper methods

  private static processMessageBoxQueue(): void {
    if (this.messageBoxQueue.length === 0) return;
    
    const { message, title, buttons, icon, resolve } = this.messageBoxQueue[0];
    
    // DOM CLOBBERING BUG FIX: Create safe DOM elements
    const overlay = this.createSafeElement('div');
    this.setSafeStyle(overlay, 'position', 'fixed');
    this.setSafeStyle(overlay, 'top', '0');
    this.setSafeStyle(overlay, 'left', '0');
    this.setSafeStyle(overlay, 'width', '100%');
    this.setSafeStyle(overlay, 'height', '100%');
    this.setSafeStyle(overlay, 'background', 'rgba(0, 0, 0, 0.5)');
    this.setSafeStyle(overlay, 'display', 'flex');
    this.setSafeStyle(overlay, 'zIndex', '999999');
    
    const dialog = this.createSafeElement('div');
    this.setSafeStyle(dialog, 'background', '#f0f0f0');
    this.setSafeStyle(dialog, 'border', '2px solid #000');
    this.setSafeStyle(dialog, 'boxShadow', '2px 2px 5px rgba(0, 0, 0, 0.3)');
    this.setSafeStyle(dialog, 'minWidth', '300px');
    this.setSafeStyle(dialog, 'maxWidth', '500px');
    
    const titleBar = this.createSafeElement('div');
    this.setSafeStyle(titleBar, 'background', '#000080');
    this.setSafeStyle(titleBar, 'color', 'white');
    this.setSafeStyle(titleBar, 'padding', '2px 5px');
    this.setSafeStyle(titleBar, 'fontFamily', 'MS Sans Serif, sans-serif');
    this.setSafeStyle(titleBar, 'fontSize', '11px');
    
    // DOM CLOBBERING BUG FIX: Sanitize title content
    titleBar.textContent = this.sanitizeMessageContent(title);
    
    const content = this.createSafeElement('div');
    this.setSafeStyle(content, 'padding', '20px');
    this.setSafeStyle(content, 'fontFamily', 'MS Sans Serif, sans-serif');
    this.setSafeStyle(content, 'fontSize', '11px');
    
    // Add icon if specified
    const iconMap: { [key: number]: string } = {
      16: '❌', // vbCritical
      32: '❓', // vbQuestion
      48: '⚠️', // vbExclamation
      64: 'ℹ️'  // vbInformation
    };
    
    // DOM CLOBBERING BUG FIX: Secure DOM element creation and content insertion
    if (iconMap[icon]) {
      const iconSpan = document.createElement('span');
      iconSpan.style.fontSize = '24px';
      iconSpan.style.marginRight = '10px';
      iconSpan.textContent = iconMap[icon];
      
      // DOM CLOBBERING BUG FIX: Use textContent instead of innerHTML to prevent injection
      const messageText = document.createTextNode(this.sanitizeMessageContent(message));
      
      content.appendChild(iconSpan);
      content.appendChild(messageText);
    } else {
      // DOM CLOBBERING BUG FIX: Sanitize message content
      content.textContent = this.sanitizeMessageContent(message);
    }
    
    const buttonContainer = this.createSafeElement('div');
    this.setSafeStyle(buttonContainer, 'padding', '10px');
    this.setSafeStyle(buttonContainer, 'textAlign', 'center');
    
    // Create buttons based on type - DOM CLOBBERING BUG FIX: Safe button creation
    const createButton = (text: string, value: number) => {
      const btn = this.createSafeElement('button') as HTMLButtonElement;
      this.setSafeStyle(btn, 'padding', '5px 15px');
      this.setSafeStyle(btn, 'margin', '0 5px');
      this.setSafeStyle(btn, 'fontFamily', 'MS Sans Serif, sans-serif');
      this.setSafeStyle(btn, 'fontSize', '11px');
      
      // DOM CLOBBERING BUG FIX: Sanitize button text
      btn.textContent = this.sanitizeMessageContent(text);
      // DOM CLOBBERING BUG FIX: Use addEventListener instead of onclick property
      btn.addEventListener('click', () => {
        try {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          this.messageBoxQueue.shift();
          resolve(value);
          this.processMessageBoxQueue();
        } catch (error) {
          console.error('Error in message box cleanup:', error);
          resolve(value); // Always resolve to prevent deadlock
        }
      });
      return btn;
    };
    
    switch (buttons) {
      case 0: // vbOKOnly
        buttonContainer.appendChild(createButton('OK', 1));
        break;
      case 1: // vbOKCancel
        buttonContainer.appendChild(createButton('OK', 1));
        buttonContainer.appendChild(createButton('Cancel', 2));
        break;
      case 2: // vbAbortRetryIgnore
        buttonContainer.appendChild(createButton('Abort', 3));
        buttonContainer.appendChild(createButton('Retry', 4));
        buttonContainer.appendChild(createButton('Ignore', 5));
        break;
      case 3: // vbYesNoCancel
        buttonContainer.appendChild(createButton('Yes', 6));
        buttonContainer.appendChild(createButton('No', 7));
        buttonContainer.appendChild(createButton('Cancel', 2));
        break;
      case 4: // vbYesNo
        buttonContainer.appendChild(createButton('Yes', 6));
        buttonContainer.appendChild(createButton('No', 7));
        break;
      case 5: // vbRetryCancel
        buttonContainer.appendChild(createButton('Retry', 4));
        buttonContainer.appendChild(createButton('Cancel', 2));
        break;
      default:
        buttonContainer.appendChild(createButton('OK', 1));
    }
    
    dialog.appendChild(titleBar);
    dialog.appendChild(content);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Focus first button
    const firstButton = buttonContainer.querySelector('button');
    if (firstButton) {
      firstButton.focus();
    }
  }

  private static parseSendKeysString(keys: string): Array<string | { key: string; code: string; ctrl?: boolean; shift?: boolean; alt?: boolean }> {
    const result: Array<any> = [];
    let i = 0;
    
    while (i < keys.length) {
      const char = keys[i];
      
      if (char === '{') {
        // Special key
        const end = keys.indexOf('}', i);
        if (end > -1) {
          const special = keys.substring(i + 1, end).toUpperCase();
          const keyMap: { [key: string]: any } = {
            'ENTER': { key: 'Enter', code: 'Enter' },
            'TAB': { key: 'Tab', code: 'Tab' },
            'BS': { key: 'Backspace', code: 'Backspace' },
            'BACKSPACE': { key: 'Backspace', code: 'Backspace' },
            'DEL': { key: 'Delete', code: 'Delete' },
            'DELETE': { key: 'Delete', code: 'Delete' },
            'INS': { key: 'Insert', code: 'Insert' },
            'INSERT': { key: 'Insert', code: 'Insert' },
            'HOME': { key: 'Home', code: 'Home' },
            'END': { key: 'End', code: 'End' },
            'PGUP': { key: 'PageUp', code: 'PageUp' },
            'PGDN': { key: 'PageDown', code: 'PageDown' },
            'UP': { key: 'ArrowUp', code: 'ArrowUp' },
            'DOWN': { key: 'ArrowDown', code: 'ArrowDown' },
            'LEFT': { key: 'ArrowLeft', code: 'ArrowLeft' },
            'RIGHT': { key: 'ArrowRight', code: 'ArrowRight' },
            'ESC': { key: 'Escape', code: 'Escape' },
            'ESCAPE': { key: 'Escape', code: 'Escape' }
          };
          
          if (keyMap[special]) {
            result.push(keyMap[special]);
          }
          
          i = end + 1;
          continue;
        }
      } else if (char === '+' || char === '^' || char === '%') {
        // Modifier keys
        const modifiers = { ctrl: false, shift: false, alt: false };
        
        while (i < keys.length && (keys[i] === '+' || keys[i] === '^' || keys[i] === '%')) {
          if (keys[i] === '+') modifiers.shift = true;
          if (keys[i] === '^') modifiers.ctrl = true;
          if (keys[i] === '%') modifiers.alt = true;
          i++;
        }
        
        if (i < keys.length) {
          result.push({
            key: keys[i],
            code: `Key${keys[i].toUpperCase()}`,
            ...modifiers
          });
          i++;
        }
        continue;
      }
      
      // Regular character
      result.push(char);
      i++;
    }
    
    return result;
  }
  
  /**
   * DOM CLOBBERING BUG FIX: Sanitize message content to prevent DOM pollution
   */
  private static sanitizeMessageContent(content: string): string {
    if (typeof content !== 'string') {
      return String(content);
    }
    
    // Remove dangerous patterns that could cause DOM clobbering
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags
      .replace(/<embed[^>]*>/gi, '') // Remove embed tags
      .replace(/on[a-z]+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:text\/html/gi, '') // Remove data URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/<!--.*?-->/gs, '') // Remove HTML comments
      .substring(0, 1000); // Limit length to prevent DoS
  }
  
  /**
   * DOM CLOBBERING BUG FIX: Create safe DOM element with validation
   */
  private static createSafeElement(tagName: string): HTMLElement {
    // Whitelist of safe element types
    const safeElements = ['div', 'span', 'button', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    
    if (!safeElements.includes(tagName.toLowerCase())) {
      console.warn(`Unsafe element type blocked: ${tagName}`);
      return document.createElement('div'); // Fallback to safe element
    }
    
    return document.createElement(tagName);
  }
  
  /**
   * DOM CLOBBERING BUG FIX: Set style properties safely
   */
  private static setSafeStyle(element: HTMLElement, property: string, value: string): void {
    // Whitelist of safe CSS properties
    const safeCSSProps = [
      'position', 'top', 'left', 'width', 'height', 'background', 'color',
      'border', 'padding', 'margin', 'display', 'fontSize', 'fontFamily',
      'textAlign', 'zIndex', 'boxShadow', 'borderRadius', 'minWidth', 'maxWidth'
    ];
    
    if (!safeCSSProps.includes(property)) {
      console.warn(`Unsafe CSS property blocked: ${property}`);
      return;
    }
    
    // Validate CSS value
    if (typeof value === 'string' && this.isValidCSSValue(value)) {
      element.style.setProperty(property, value);
    } else {
      console.warn(`Unsafe CSS value blocked: ${property}: ${value}`);
    }
  }
  
  /**
   * DOM CLOBBERING BUG FIX: Validate CSS values
   */
  private static isValidCSSValue(value: string): boolean {
    // Block dangerous CSS patterns
    const dangerousPatterns = [
      /javascript:/i,
      /expression\s*\(/i,
      /url\s*\(/i,
      /import/i,
      /@/i,
      /behavior\s*:/i,
      /binding\s*:/i,
      /\\[0-9a-f]{1,6}/i // Unicode escapes
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(value));
  }
}

// Export individual functions for easier use
export const {
  Beep,
  Command,
  CurDir,
  Dir,
  Environ,
  EOF,
  FileAttr,
  FileDateTime,
  FileLen,
  FreeFile,
  GetAttr,
  GetSetting,
  GetAllSettings,
  SaveSetting,
  DeleteSetting,
  InputBox,
  MsgBox,
  Now,
  RGB,
  QBColor,
  Shell,
  Timer,
  DoEvents,
  AppActivate,
  SendKeys,
  CreateObject,
  GetObject
} = VB6SystemFunctions;

// VB6 Constants
export const VB6SystemConstants = {
  // MsgBox buttons
  vbOKOnly: 0,
  vbOKCancel: 1,
  vbAbortRetryIgnore: 2,
  vbYesNoCancel: 3,
  vbYesNo: 4,
  vbRetryCancel: 5,
  
  // MsgBox icons
  vbCritical: 16,
  vbQuestion: 32,
  vbExclamation: 48,
  vbInformation: 64,
  
  // MsgBox default button
  vbDefaultButton1: 0,
  vbDefaultButton2: 256,
  vbDefaultButton3: 512,
  vbDefaultButton4: 768,
  
  // MsgBox modality
  vbApplicationModal: 0,
  vbSystemModal: 4096,
  
  // MsgBox return values
  vbOK: 1,
  vbCancel: 2,
  vbAbort: 3,
  vbRetry: 4,
  vbIgnore: 5,
  vbYes: 6,
  vbNo: 7,
  
  // File attributes
  vbNormal: 0,
  vbReadOnly: 1,
  vbHidden: 2,
  vbSystem: 4,
  vbVolume: 8,
  vbDirectory: 16,
  vbArchive: 32,
  vbAlias: 64,
  
  // Shell window styles
  vbHide: 0,
  vbNormalFocus: 1,
  vbMinimizedFocus: 2,
  vbMaximizedFocus: 3,
  vbNormalNoFocus: 4,
  vbMinimizedNoFocus: 6
};