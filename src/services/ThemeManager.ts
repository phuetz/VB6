import { Theme } from '../types/extended';

export class ThemeManager {
  private static currentTheme: Theme;
  private static listeners: Array<(theme: Theme) => void> = [];

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
        success: '#00CC00'
      },
      fonts: {
        primary: 'MS Sans Serif',
        code: 'Consolas, Monaco, monospace',
        size: {
          small: '8pt',
          medium: '9pt',
          large: '12pt'
        }
      }
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
        success: '#4EC9B0'
      },
      fonts: {
        primary: 'Segoe UI',
        code: 'Fira Code, Consolas, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '16px'
        }
      }
    },
    light: {
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
        success: '#107C10'
      },
      fonts: {
        primary: 'Segoe UI',
        code: 'Consolas, Monaco, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '16px'
        }
      }
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
        success: '#00FF00'
      },
      fonts: {
        primary: 'MS Sans Serif',
        code: 'Consolas, monospace',
        size: {
          small: '12px',
          medium: '14px',
          large: '18px'
        }
      }
    }
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
    this.saveTheme(theme);
    this.notifyListeners(theme);
  }

  static setThemeByName(themeName: string): void {
    const theme = this.defaultThemes[themeName];
    if (theme) {
      this.setTheme(theme);
    } else {
      console.warn(`Theme "${themeName}" not found`);
    }
  }

  static createCustomTheme(name: string, baseTheme: Theme, overrides: Partial<Theme>): Theme {
    const customTheme: Theme = {
      ...baseTheme,
      ...overrides,
      name,
      colors: {
        ...baseTheme.colors,
        ...overrides.colors
      },
      fonts: {
        ...baseTheme.fonts,
        ...overrides.fonts,
        size: {
          ...baseTheme.fonts.size,
          ...overrides.fonts?.size
        }
      }
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
      console.error('Error importing theme:', error);
    }
    return null;
  }

  private static applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--font-primary', theme.fonts.primary);
    root.style.setProperty('--font-code', theme.fonts.code);
    root.style.setProperty('--font-size-small', theme.fonts.size.small);
    root.style.setProperty('--font-size-medium', theme.fonts.size.medium);
    root.style.setProperty('--font-size-large', theme.fonts.size.large);
  }

  private static saveTheme(theme: Theme): void {
    try {
      localStorage.setItem('vb6-theme', JSON.stringify(theme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  private static notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        console.error('Error in theme listener:', error);
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

  // Initialize theme system
  static initialize(): void {
    // Apply current theme on startup
    this.applyTheme(this.getCurrentTheme());

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Auto-switch theme based on system preference
        const autoTheme = localStorage.getItem('vb6-auto-theme');
        if (autoTheme === 'true') {
          this.setThemeByName(e.matches ? 'modern' : 'light');
        }
      });
    }
  }
}

// Initialize theme system
ThemeManager.initialize();