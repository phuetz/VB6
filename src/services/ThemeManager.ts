import { Theme } from '../types/extended';
import { createLogger } from './LoggingService';

const logger = createLogger('ThemeManager');

// Monaco theme names that correspond to our themes
export type MonacoThemeName = 'vs' | 'vs-dark' | 'hc-black' | 'vb6-classic' | 'vb6-dark';

// VB6-specific IDE color scheme
export interface VB6IDEColors {
  // Code editor
  codeBackground: string;
  codeText: string;
  codeKeyword: string;
  codeComment: string;
  codeString: string;
  codeNumber: string;
  codeFunction: string;
  codeOperator: string;
  codeLine: string;
  codeSelection: string;
  codeCursor: string;

  // Form designer
  designerGrid: string;
  designerSelection: string;
  designerHandle: string;
  designerGuide: string;

  // Properties panel
  propertyCategory: string;
  propertyName: string;
  propertyValue: string;
  propertyBorder: string;

  // Toolbox
  toolboxCategory: string;
  toolboxItem: string;
  toolboxHover: string;
  toolboxSelected: string;
}

export class ThemeManager {
  private static currentTheme: Theme;
  private static listeners: Array<(theme: Theme) => void> = [];
  private static mediaQueryList: MediaQueryList | null = null;
  private static mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
  private static monacoEditorCallback: ((themeName: MonacoThemeName) => void) | null = null;

  // VB6 IDE-specific color schemes
  static readonly vb6IDEColors: { [key: string]: VB6IDEColors } = {
    classic: {
      codeBackground: '#FFFFFF',
      codeText: '#000000',
      codeKeyword: '#0000FF',
      codeComment: '#008000',
      codeString: '#800000',
      codeNumber: '#000000',
      codeFunction: '#000000',
      codeOperator: '#000000',
      codeLine: '#FFFFC0',
      codeSelection: '#0078D7',
      codeCursor: '#000000',
      designerGrid: '#E0E0E0',
      designerSelection: '#000080',
      designerHandle: '#000000',
      designerGuide: '#FF0000',
      propertyCategory: '#C0C0C0',
      propertyName: '#000000',
      propertyValue: '#000000',
      propertyBorder: '#808080',
      toolboxCategory: '#C0C0C0',
      toolboxItem: '#000000',
      toolboxHover: '#000080',
      toolboxSelected: '#0000FF',
    },
    dark: {
      codeBackground: '#1E1E1E',
      codeText: '#D4D4D4',
      codeKeyword: '#569CD6',
      codeComment: '#6A9955',
      codeString: '#CE9178',
      codeNumber: '#B5CEA8',
      codeFunction: '#DCDCAA',
      codeOperator: '#D4D4D4',
      codeLine: '#2D2D30',
      codeSelection: '#264F78',
      codeCursor: '#AEAFAD',
      designerGrid: '#3C3C3C',
      designerSelection: '#007ACC',
      designerHandle: '#FFFFFF',
      designerGuide: '#FF6B6B',
      propertyCategory: '#2D2D30',
      propertyName: '#D4D4D4',
      propertyValue: '#9CDCFE',
      propertyBorder: '#3C3C3C',
      toolboxCategory: '#2D2D30',
      toolboxItem: '#D4D4D4',
      toolboxHover: '#094771',
      toolboxSelected: '#007ACC',
    },
    highContrast: {
      codeBackground: '#000000',
      codeText: '#FFFFFF',
      codeKeyword: '#FFFF00',
      codeComment: '#00FF00',
      codeString: '#FF69B4',
      codeNumber: '#00FFFF',
      codeFunction: '#FFFF00',
      codeOperator: '#FFFFFF',
      codeLine: '#1A1A1A',
      codeSelection: '#FFFF00',
      codeCursor: '#FFFFFF',
      designerGrid: '#333333',
      designerSelection: '#FFFF00',
      designerHandle: '#FFFFFF',
      designerGuide: '#FF0000',
      propertyCategory: '#1A1A1A',
      propertyName: '#FFFFFF',
      propertyValue: '#00FFFF',
      propertyBorder: '#FFFFFF',
      toolboxCategory: '#1A1A1A',
      toolboxItem: '#FFFFFF',
      toolboxHover: '#FFFF00',
      toolboxSelected: '#00FFFF',
    },
  };

  static readonly defaultThemes: { [key: string]: Theme } = {
    classic: {
      name: 'Classic VB6',
      colors: {
        primary: '#0066CC',
        secondary: '#4080FF',
        background: '#C0C0C0',
        surface: '#FFFFFF',
        text: '#000000',
        accent: '#FF6600',
        error: '#FF0000',
        warning: '#FFB300',
        success: '#00CC00',
      },
      fonts: {
        primary: 'MS Sans Serif',
        code: 'Consolas, Monaco, monospace',
        size: {
          small: '8pt',
          medium: '9pt',
          large: '12pt',
        },
      },
    },
    light: {
      name: 'Light Theme',
      colors: {
        primary: '#0078D4',
        secondary: '#106EBE',
        background: '#FFFFFF',
        surface: '#F3F2F1',
        text: '#323130',
        accent: '#0078D4',
        error: '#D13438',
        warning: '#FFB900',
        success: '#107C10',
      },
      fonts: {
        primary: 'Segoe UI',
        code: 'Consolas, Monaco, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '16px',
        },
      },
    },
    dark: {
      name: 'Dark Theme',
      colors: {
        primary: '#0078D4',
        secondary: '#106EBE',
        background: '#1F1F1F',
        surface: '#2D2D30',
        text: '#FFFFFF',
        accent: '#0078D4',
        error: '#F85149',
        warning: '#FFA348',
        success: '#3FB950',
      },
      fonts: {
        primary: 'Segoe UI',
        code: 'Consolas, Monaco, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '16px',
        },
      },
    },
    modern: {
      name: 'Modern Dark',
      colors: {
        primary: '#007ACC',
        secondary: '#1E1E1E',
        background: '#252526',
        surface: '#2D2D30',
        text: '#CCCCCC',
        accent: '#FF6600',
        error: '#F44747',
        warning: '#FFB300',
        success: '#4EC9B0',
      },
      fonts: {
        primary: 'Segoe UI',
        code: 'Fira Code, Consolas, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '16px',
        },
      },
    },
    lightModern: {
      name: 'Light Modern',
      colors: {
        primary: '#0078D4',
        secondary: '#F3F2F1',
        background: '#FFFFFF',
        surface: '#FAFAFA',
        text: '#323130',
        accent: '#FF6600',
        error: '#D13438',
        warning: '#FFB900',
        success: '#107C10',
      },
      fonts: {
        primary: 'Segoe UI',
        code: 'Consolas, Monaco, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '16px',
        },
      },
    },
    highContrast: {
      name: 'High Contrast',
      colors: {
        primary: '#FFFF00',
        secondary: '#000000',
        background: '#000000',
        surface: '#000000',
        text: '#FFFFFF',
        accent: '#00FFFF',
        error: '#FF0000',
        warning: '#FFFF00',
        success: '#00FF00',
      },
      fonts: {
        primary: 'MS Sans Serif',
        code: 'Consolas, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '18px',
        },
      },
    },
  };

  static getCurrentTheme(): Theme {
    if (!this.currentTheme) {
      // Load from localStorage or use default
      const saved = localStorage.getItem('vb6-theme');
      if (saved) {
        try {
          this.currentTheme = JSON.parse(saved);
        } catch {
          this.currentTheme = this.defaultThemes.classic;
        }
      } else {
        this.currentTheme = this.defaultThemes.classic;
      }
    }
    return this.currentTheme;
  }

  static setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.applyVB6IDEColors();
    this.saveTheme(theme);
    this.notifyListeners(theme);

    // Notify Monaco editor about theme change
    if (this.monacoEditorCallback) {
      this.monacoEditorCallback(this.getMonacoTheme());
    }
  }

  static setThemeByName(themeName: string): void {
    const theme = this.defaultThemes[themeName];
    if (theme) {
      this.setTheme(theme);
    } else {
      logger.warn(`Theme "${themeName}" not found`);
    }
  }

  static createCustomTheme(name: string, baseTheme: Theme, overrides: Partial<Theme>): Theme {
    const customTheme: Theme = {
      ...baseTheme,
      ...overrides,
      name,
      colors: {
        ...baseTheme.colors,
        ...overrides.colors,
      },
      fonts: {
        ...baseTheme.fonts,
        ...overrides.fonts,
        size: {
          ...baseTheme.fonts.size,
          ...overrides.fonts?.size,
        },
      },
    };

    return customTheme;
  }

  static addListener(listener: (theme: Theme) => void): void {
    this.listeners.push(listener);
  }

  static removeListener(listener: (theme: Theme) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  static exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }

  static importTheme(themeJson: string): Theme | null {
    try {
      const theme = JSON.parse(themeJson);
      if (this.validateTheme(theme)) {
        return theme;
      }
    } catch (error) {
      logger.error('Error importing theme:', error);
    }
    return null;
  }

  private static applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Remove existing theme classes from body
    if (document.body) {
      // Handle cases where className might be undefined
      const currentClassName = document.body.className || '';
      document.body.className = currentClassName.replace(/theme-[\w-]+/g, '');

      // Add new theme class based on theme name
      const themeClass = this.getThemeClassName(theme.name);
      if (document.body.classList && document.body.classList.add) {
        document.body.classList.add(themeClass);
      }
    }

    // CSS INJECTION BUG FIX: Validate CSS values before applying
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (this.isValidCSSColor(value)) {
        root.style.setProperty(`--color-${key}`, value);
      } else {
        logger.warn(`Invalid color value rejected: ${key}=${value}`);
      }
    });

    // CSS INJECTION BUG FIX: Validate font values
    if (this.isValidCSSValue(theme.fonts.primary)) {
      root.style.setProperty('--font-primary', theme.fonts.primary);
    }
    if (this.isValidCSSValue(theme.fonts.code)) {
      root.style.setProperty('--font-code', theme.fonts.code);
    }
    if (this.isValidCSSValue(theme.fonts.size.small)) {
      root.style.setProperty('--font-size-small', theme.fonts.size.small);
    }
    if (this.isValidCSSValue(theme.fonts.size.medium)) {
      root.style.setProperty('--font-size-medium', theme.fonts.size.medium);
    }
    if (this.isValidCSSValue(theme.fonts.size.large)) {
      root.style.setProperty('--font-size-large', theme.fonts.size.large);
    }
  }

  private static getThemeClassName(themeName: string): string {
    // Map theme names to CSS class names expected by tests
    const classMap: Record<string, string> = {
      'Classic VB6': 'theme-vb6-classic',
      'Dark Theme': 'theme-dark',
      'Light Theme': 'theme-light',
      'Light Modern': 'theme-light-modern',
      'Modern Theme': 'theme-modern',
      'High Contrast': 'theme-high-contrast',
    };

    return classMap[themeName] || `theme-${themeName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * CSS INJECTION BUG FIX: Validate CSS color values
   */
  private static isValidCSSColor(value: string): boolean {
    if (typeof value !== 'string') return false;

    // CSS color patterns: hex, rgb, rgba, hsl, hsla, named colors
    const colorPatterns = [
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, // hex colors
      /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/, // rgb
      /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.?\d*)\s*\)$/, // rgba
      /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/, // hsl
      /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([01]?\.?\d*)\s*\)$/, // hsla
    ];

    // Named CSS colors (basic set)
    const namedColors = [
      'black',
      'white',
      'red',
      'green',
      'blue',
      'yellow',
      'orange',
      'purple',
      'pink',
      'brown',
      'gray',
      'grey',
      'transparent',
      'currentColor',
    ];

    return (
      colorPatterns.some(pattern => pattern.test(value)) ||
      namedColors.includes(value.toLowerCase())
    );
  }

  /**
   * CSS INJECTION BUG FIX: Validate general CSS values
   */
  static isValidCSSValue(value: string): boolean {
    if (typeof value !== 'string') return false;

    // Reject dangerous CSS expressions and functions
    const dangerousPatterns = [
      /expression\s*\(/i, // IE CSS expressions
      /javascript\s*:/i, // JavaScript URLs
      /vbscript\s*:/i, // VBScript URLs
      /data\s*:/i, // Data URLs
      /import\s*['"@]/i, // CSS imports
      /<.*>/, // HTML tags
      /&\w+;/, // HTML entities
      /\/\*.*\*\//, // CSS comments
      /url\s*\(\s*['"]*javascript:/i, // JavaScript in URLs
    ];

    // Check for dangerous patterns
    if (dangerousPatterns.some(pattern => pattern.test(value))) {
      return false;
    }

    // Basic length limit to prevent CSS bombs
    if (value.length > 200) {
      return false;
    }

    return true;
  }

  private static saveTheme(theme: Theme): void {
    try {
      localStorage.setItem('vb6-theme', JSON.stringify(theme));
    } catch (error) {
      logger.error('Error saving theme:', error);
    }
  }

  private static notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        logger.error('Error in theme listener:', error);
      }
    });
  }

  private static validateTheme(theme: any): boolean {
    return (
      theme &&
      typeof theme.name === 'string' &&
      theme.colors &&
      typeof theme.colors.primary === 'string' &&
      typeof theme.colors.secondary === 'string' &&
      typeof theme.colors.background === 'string' &&
      typeof theme.colors.surface === 'string' &&
      typeof theme.colors.text === 'string' &&
      theme.fonts &&
      typeof theme.fonts.primary === 'string' &&
      typeof theme.fonts.code === 'string' &&
      theme.fonts.size &&
      typeof theme.fonts.size.small === 'string' &&
      typeof theme.fonts.size.medium === 'string' &&
      typeof theme.fonts.size.large === 'string'
    );
  }

  // Utility methods for theme-aware styling
  static getColorWithOpacity(colorName: keyof Theme['colors'], opacity: number): string {
    const color = this.getCurrentTheme().colors[colorName];

    // Convert hex to rgba
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    return color;
  }

  static isDarkTheme(): boolean {
    const theme = this.getCurrentTheme();
    // Simple check based on background color
    const bg = theme.colors.background;
    if (bg.startsWith('#')) {
      const hex = bg.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
    return false;
  }

  static getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation
    if (backgroundColor.startsWith('#')) {
      const hex = backgroundColor.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
    return '#000000';
  }

  /**
   * Get VB6 IDE colors for current theme
   */
  static getVB6IDEColors(): VB6IDEColors {
    const theme = this.getCurrentTheme();
    if (theme.name.includes('Dark') || theme.name === 'Modern Dark') {
      return this.vb6IDEColors.dark;
    } else if (theme.name === 'High Contrast') {
      return this.vb6IDEColors.highContrast;
    }
    return this.vb6IDEColors.classic;
  }

  /**
   * Get the corresponding Monaco theme name
   */
  static getMonacoTheme(): MonacoThemeName {
    const theme = this.getCurrentTheme();
    if (theme.name === 'High Contrast') {
      return 'hc-black';
    } else if (theme.name.includes('Dark') || theme.name === 'Modern Dark') {
      return 'vb6-dark';
    }
    return 'vb6-classic';
  }

  /**
   * Register callback for Monaco editor theme changes
   */
  static onMonacoThemeChange(callback: (themeName: MonacoThemeName) => void): void {
    this.monacoEditorCallback = callback;
  }

  /**
   * Apply VB6 IDE colors as CSS variables
   */
  private static applyVB6IDEColors(): void {
    const root = document.documentElement;
    const colors = this.getVB6IDEColors();

    Object.entries(colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--vb6-${cssKey}`, value);
    });
  }

  // Initialize theme system
  static initialize(): void {
    // Apply current theme on startup
    this.applyTheme(this.getCurrentTheme());
    this.applyVB6IDEColors();

    // Listen for system theme changes
    if (window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryHandler = (e: MediaQueryListEvent) => {
        // Auto-switch theme based on system preference
        const autoTheme = localStorage.getItem('vb6-auto-theme');
        if (autoTheme === 'true') {
          this.setThemeByName(e.matches ? 'modern' : 'light');
        }
      };
      this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
    }
  }

  /**
   * Clean up resources and event listeners to prevent memory leaks
   */
  static destroy(): void {
    // Remove media query listener
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
      this.mediaQueryList = null;
      this.mediaQueryHandler = null;
    }

    // Clear listeners
    this.listeners = [];

    logger.debug('ThemeManager destroyed and cleaned up');
  }

  // Constructor for instance-based usage in tests
  constructor() {
    // Initialize the theme system when an instance is created
    ThemeManager.initialize();
  }

  // Instance methods for backward compatibility with tests
  setTheme(themeNameOrTheme: string | Theme): boolean {
    try {
      if (typeof themeNameOrTheme === 'string') {
        // Validate theme name exists
        if (!ThemeManager.defaultThemes[themeNameOrTheme]) {
          logger.warn(`Theme "${themeNameOrTheme}" not found`);
          return false;
        }
        ThemeManager.setThemeByName(themeNameOrTheme);
      } else {
        // Validate theme object structure
        if (!ThemeManager.validateTheme(themeNameOrTheme)) {
          logger.warn('Invalid theme structure');
          return false;
        }
        ThemeManager.setTheme(themeNameOrTheme);
      }
      return true;
    } catch (error) {
      logger.warn('Failed to set theme:', error);
      return false;
    }
  }

  setCustomVariables(variables: Record<string, string>): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const root = document.documentElement;
      let hasValidVariables = false;

      Object.entries(variables).forEach(([key, value]) => {
        // Validate CSS variable name format
        if (!key.startsWith('--')) {
          logger.warn(`Invalid CSS variable name: ${key}. Must start with '--'`);
          return;
        }

        // Validate CSS variable value
        if (!ThemeManager.isValidCSSValue(value)) {
          logger.warn(`Invalid CSS variable value for ${key}: ${value}`);
          return;
        }

        root.style.setProperty(key, value);
        hasValidVariables = true;
      });

      return hasValidVariables;
    } catch (error) {
      logger.warn('DOM error during CSS variable setting:', error);
      return false;
    }
  }

  importTheme(themeJson: string): Theme | null {
    return ThemeManager.importTheme(themeJson);
  }

  exportTheme(): string {
    return ThemeManager.exportTheme(ThemeManager.getCurrentTheme());
  }

  setHighContrast(enabled: boolean): void {
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.body.classList.add('high-contrast');
        localStorage.setItem('vb6-high-contrast', 'true');
      } else {
        document.body.classList.remove('high-contrast');
        localStorage.removeItem('vb6-high-contrast');
      }
    }
  }

  setFontScale(scale: number): boolean {
    // Strictly reject invalid values
    if (typeof scale !== 'number' || isNaN(scale) || scale < 0.5 || scale > 3) {
      return false;
    }

    // Only accept values within the exact range, don't clamp
    if (scale < 0.5 || scale > 3) {
      return false;
    }

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', scale.toString());
      localStorage.setItem('vb6-font-scale', scale.toString());
    }

    return true;
  }

  getCurrentTheme(): Theme {
    return ThemeManager.getCurrentTheme();
  }

  addListener(listener: (theme: Theme) => void): void {
    ThemeManager.addListener(listener);
  }

  removeListener(listener: (theme: Theme) => void): void {
    ThemeManager.removeListener(listener);
  }
}

// Initialize theme system
ThemeManager.initialize();
