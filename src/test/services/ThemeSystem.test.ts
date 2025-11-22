import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ThemeManager from '../../services/ThemeManager';
import { useVB6Store } from '../../stores/vb6Store';

// Mocks
vi.mock('../../stores/vb6Store');

describe('Theme System Tests', () => {
  let themeManager: ThemeManager;
  
  beforeEach(() => {
    themeManager = new ThemeManager();
    localStorage.clear();
    document.documentElement.className = '';
    vi.clearAllMocks();
    
    // Reset CSS custom properties
    const style = document.documentElement.style;
    style.removeProperty('--primary-color');
    style.removeProperty('--background-color');
    style.removeProperty('--text-color');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Manager Core', () => {
    it('should initialize with default theme', () => {
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme).toBe('light');
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });

    it('should load saved theme from localStorage', () => {
      localStorage.setItem('vb6-theme', 'dark');
      const newManager = new ThemeManager();
      
      expect(newManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('should switch between themes', () => {
      themeManager.setTheme('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
      
      themeManager.setTheme('light');
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });

    it('should persist theme to localStorage', () => {
      themeManager.setTheme('dark');
      expect(localStorage.getItem('vb6-theme')).toBe('dark');
      
      themeManager.setTheme('light');
      expect(localStorage.getItem('vb6-theme')).toBe('light');
    });

    it('should apply CSS variables for theme', () => {
      themeManager.setTheme('dark');
      
      const style = getComputedStyle(document.documentElement);
      expect(style.getPropertyValue('--background-color')).toBeTruthy();
      expect(style.getPropertyValue('--text-color')).toBeTruthy();
      expect(style.getPropertyValue('--primary-color')).toBeTruthy();
    });
  });

  describe('Custom Themes', () => {
    it('should register custom theme', () => {
      const customTheme = {
        name: 'ocean',
        colors: {
          primary: '#006994',
          secondary: '#0099cc',
          background: '#f0f8ff',
          text: '#333',
          border: '#cce5ff'
        }
      };
      
      themeManager.registerTheme(customTheme);
      expect(themeManager.getAvailableThemes()).toContain('ocean');
    });

    it('should apply custom theme', () => {
      const customTheme = {
        name: 'ocean',
        colors: {
          primary: '#006994',
          secondary: '#0099cc',
          background: '#f0f8ff',
          text: '#333',
          border: '#cce5ff'
        }
      };
      
      themeManager.registerTheme(customTheme);
      themeManager.setTheme('ocean');
      
      expect(document.documentElement.classList.contains('theme-ocean')).toBe(true);
      expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#006994');
    });

    it('should validate theme structure', () => {
      const invalidTheme = {
        name: 'invalid',
        colors: {
          primary: '#fff' // Missing required colors
        }
      };
      
      expect(() => themeManager.registerTheme(invalidTheme)).toThrow('Invalid theme structure');
    });

    it('should export theme configuration', () => {
      const customTheme = {
        name: 'ocean',
        colors: {
          primary: '#006994',
          secondary: '#0099cc',
          background: '#f0f8ff',
          text: '#333',
          border: '#cce5ff'
        }
      };
      
      themeManager.registerTheme(customTheme);
      const exported = themeManager.exportTheme('ocean');
      
      expect(exported).toEqual(customTheme);
    });

    it('should import theme configuration', () => {
      const themeConfig = {
        name: 'imported',
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          background: '#fafafa',
          text: '#2d3436',
          border: '#dfe6e9'
        }
      };
      
      themeManager.importTheme(JSON.stringify(themeConfig));
      expect(themeManager.getAvailableThemes()).toContain('imported');
    });
  });

  describe('VB6 Classic Theme', () => {
    it('should provide VB6 classic theme', () => {
      themeManager.setTheme('vb6-classic');
      
      expect(document.documentElement.classList.contains('theme-vb6-classic')).toBe(true);
      
      const style = getComputedStyle(document.documentElement);
      expect(style.getPropertyValue('--background-color')).toBe('#c0c0c0'); // Classic VB6 gray
    });

    it('should apply VB6 control styles', () => {
      themeManager.setTheme('vb6-classic');
      
      const buttonStyles = themeManager.getControlStyles('CommandButton');
      expect(buttonStyles.backgroundColor).toBe('#d4d0c8');
      expect(buttonStyles.border).toBe('2px outset #ffffff');
    });

    it('should provide Windows 95 style gradients', () => {
      themeManager.setTheme('vb6-classic');
      
      const titleBarGradient = themeManager.getTitleBarGradient();
      expect(titleBarGradient).toContain('linear-gradient');
      expect(titleBarGradient).toContain('#000080'); // Classic blue
    });
  });

  describe('Theme Variants', () => {
    it('should support light and dark variants', () => {
      themeManager.setTheme('light');
      expect(themeManager.isDarkMode()).toBe(false);
      
      themeManager.setTheme('dark');
      expect(themeManager.isDarkMode()).toBe(true);
    });

    it('should support high contrast mode', () => {
      themeManager.enableHighContrast();
      
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      
      const style = getComputedStyle(document.documentElement);
      expect(style.getPropertyValue('--text-contrast')).toBe('maximum');
    });

    it('should detect system theme preference', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));
      
      global.matchMedia = mockMatchMedia;
      
      themeManager.useSystemTheme();
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should respond to system theme changes', () => {
      const listeners: any[] = [];
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: (event: string, handler: any) => listeners.push(handler),
        removeEventListener: vi.fn()
      }));
      
      global.matchMedia = mockMatchMedia;
      
      themeManager.useSystemTheme();
      expect(themeManager.getCurrentTheme()).toBe('light');
      
      // Simulate system theme change
      listeners.forEach(handler => handler({ matches: true }));
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('Theme Colors and Palettes', () => {
    it('should generate color palette from primary color', () => {
      const palette = themeManager.generatePalette('#007bff');
      
      expect(palette).toHaveProperty('50');
      expect(palette).toHaveProperty('100');
      expect(palette).toHaveProperty('200');
      expect(palette).toHaveProperty('300');
      expect(palette).toHaveProperty('400');
      expect(palette).toHaveProperty('500');
      expect(palette).toHaveProperty('600');
      expect(palette).toHaveProperty('700');
      expect(palette).toHaveProperty('800');
      expect(palette).toHaveProperty('900');
    });

    it('should calculate contrast ratios', () => {
      const ratio = themeManager.getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBe(21); // Maximum contrast
      
      const lowRatio = themeManager.getContrastRatio('#ffffff', '#f0f0f0');
      expect(lowRatio).toBeLessThan(2);
    });

    it('should suggest accessible color combinations', () => {
      const suggestions = themeManager.getAccessibleColors('#007bff');
      
      expect(suggestions.text).toBeDefined();
      expect(suggestions.background).toBeDefined();
      
      const ratio = themeManager.getContrastRatio(suggestions.text, suggestions.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
    });

    it('should adjust color brightness', () => {
      const lighter = themeManager.adjustBrightness('#007bff', 20);
      const darker = themeManager.adjustBrightness('#007bff', -20);
      
      expect(lighter).not.toBe('#007bff');
      expect(darker).not.toBe('#007bff');
      
      // Lighter should have higher luminance
      const originalLum = themeManager.getLuminance('#007bff');
      const lighterLum = themeManager.getLuminance(lighter);
      const darkerLum = themeManager.getLuminance(darker);
      
      expect(lighterLum).toBeGreaterThan(originalLum);
      expect(darkerLum).toBeLessThan(originalLum);
    });
  });

  describe('Theme Animations and Transitions', () => {
    it('should support theme transition animations', async () => {
      themeManager.enableTransitions();
      
      const transitionStyle = getComputedStyle(document.documentElement).transition;
      expect(transitionStyle).toContain('background-color');
      expect(transitionStyle).toContain('color');
    });

    it('should disable transitions during rapid changes', () => {
      themeManager.setTheme('light');
      themeManager.setTheme('dark');
      themeManager.setTheme('light');
      themeManager.setTheme('dark');
      
      // Should temporarily disable transitions
      const transitionStyle = getComputedStyle(document.documentElement).transition;
      expect(transitionStyle).toBe('none');
    });

    it('should provide fade transition between themes', async () => {
      await themeManager.setThemeWithFade('dark');
      
      // Check for fade overlay
      const overlay = document.querySelector('.theme-transition-overlay');
      expect(overlay).toBeTruthy();
      
      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(document.querySelector('.theme-transition-overlay')).toBeFalsy();
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('Theme Storage and Sync', () => {
    it('should save theme preferences per project', () => {
      themeManager.setProjectTheme('Project1', 'dark');
      themeManager.setProjectTheme('Project2', 'light');
      
      expect(themeManager.getProjectTheme('Project1')).toBe('dark');
      expect(themeManager.getProjectTheme('Project2')).toBe('light');
    });

    it('should sync theme across tabs', () => {
      const storageEvent = new StorageEvent('storage', {
        key: 'vb6-theme',
        newValue: 'dark',
        oldValue: 'light'
      });
      
      window.dispatchEvent(storageEvent);
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('should export all theme settings', () => {
      themeManager.setTheme('dark');
      themeManager.enableHighContrast();
      themeManager.setProjectTheme('Project1', 'ocean');
      
      const settings = themeManager.exportSettings();
      
      expect(settings.currentTheme).toBe('dark');
      expect(settings.highContrast).toBe(true);
      expect(settings.projectThemes).toHaveProperty('Project1', 'ocean');
    });

    it('should import theme settings', () => {
      const settings = {
        currentTheme: 'dark',
        highContrast: true,
        projectThemes: {
          'Project1': 'ocean',
          'Project2': 'light'
        },
        customThemes: [{
          name: 'custom',
          colors: {
            primary: '#ff0000',
            secondary: '#00ff00',
            background: '#ffffff',
            text: '#000000',
            border: '#cccccc'
          }
        }]
      };
      
      themeManager.importSettings(settings);
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      expect(themeManager.getProjectTheme('Project1')).toBe('ocean');
      expect(themeManager.getAvailableThemes()).toContain('custom');
    });
  });

  describe('Component-Specific Theming', () => {
    it('should provide component-specific styles', () => {
      themeManager.setTheme('dark');
      
      const editorTheme = themeManager.getComponentTheme('MonacoEditor');
      expect(editorTheme.base).toBe('vs-dark');
      expect(editorTheme.rules).toBeDefined();
      expect(editorTheme.colors).toBeDefined();
    });

    it('should override component colors', () => {
      themeManager.setComponentOverride('Toolbar', {
        background: '#2c3e50',
        text: '#ecf0f1'
      });
      
      const toolbarTheme = themeManager.getComponentTheme('Toolbar');
      expect(toolbarTheme.background).toBe('#2c3e50');
      expect(toolbarTheme.text).toBe('#ecf0f1');
    });

    it('should reset component overrides', () => {
      themeManager.setComponentOverride('Toolbar', {
        background: '#2c3e50'
      });
      
      themeManager.resetComponentOverride('Toolbar');
      
      const toolbarTheme = themeManager.getComponentTheme('Toolbar');
      expect(toolbarTheme.background).not.toBe('#2c3e50');
    });
  });

  describe('Theme Preview', () => {
    it('should preview theme without applying', () => {
      const currentTheme = themeManager.getCurrentTheme();
      
      themeManager.previewTheme('dark');
      
      expect(document.documentElement.classList.contains('theme-preview')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(themeManager.getCurrentTheme()).toBe(currentTheme); // Not changed
    });

    it('should cancel theme preview', () => {
      themeManager.previewTheme('dark');
      themeManager.cancelPreview();
      
      expect(document.documentElement.classList.contains('theme-preview')).toBe(false);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });

    it('should apply previewed theme', () => {
      themeManager.previewTheme('dark');
      themeManager.applyPreview();
      
      expect(document.documentElement.classList.contains('theme-preview')).toBe(false);
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('Accessibility Features', () => {
    it('should adjust font size for readability', () => {
      themeManager.setFontScale(1.2);
      
      const fontSize = getComputedStyle(document.documentElement).getPropertyValue('--base-font-size');
      expect(fontSize).toBe('19.2px'); // 16px * 1.2
    });

    it('should enable reduced motion', () => {
      themeManager.setReducedMotion(true);
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
      
      const animationDuration = getComputedStyle(document.documentElement).getPropertyValue('--animation-duration');
      expect(animationDuration).toBe('0.01ms');
    });

    it('should provide color blind friendly themes', () => {
      const themes = themeManager.getColorBlindFriendlyThemes();
      
      expect(themes).toContain('protanopia');
      expect(themes).toContain('deuteranopia');
      expect(themes).toContain('tritanopia');
    });

    it('should validate color accessibility', () => {
      const isAccessible = themeManager.checkAccessibility({
        text: '#767676',
        background: '#ffffff'
      });
      
      expect(isAccessible.aa).toBe(true); // Passes AA
      expect(isAccessible.aaa).toBe(false); // Fails AAA
      expect(isAccessible.ratio).toBeCloseTo(4.54, 2);
    });
  });

  describe('Theme Events and Callbacks', () => {
    it('should emit theme change events', () => {
      const callback = vi.fn();
      themeManager.on('themeChange', callback);
      
      themeManager.setTheme('dark');
      
      expect(callback).toHaveBeenCalledWith({
        oldTheme: 'light',
        newTheme: 'dark'
      });
    });

    it('should allow unsubscribing from events', () => {
      const callback = vi.fn();
      const unsubscribe = themeManager.on('themeChange', callback);
      
      themeManager.setTheme('dark');
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      themeManager.setTheme('light');
      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should provide theme ready callback', async () => {
      const callback = vi.fn();
      
      await themeManager.whenReady(callback);
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should debounce rapid theme changes', () => {
      const spy = vi.spyOn(document.documentElement.classList, 'add');
      
      themeManager.setTheme('dark');
      themeManager.setTheme('light');
      themeManager.setTheme('dark');
      themeManager.setTheme('light');
      
      // Should only apply the last theme
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should cache computed styles', () => {
      const styles1 = themeManager.getComputedStyles('Button');
      const styles2 = themeManager.getComputedStyles('Button');
      
      expect(styles1).toBe(styles2); // Same reference, cached
    });

    it('should lazy load theme resources', async () => {
      const theme = await themeManager.loadTheme('custom-heavy');
      
      expect(theme).toBeDefined();
      expect(theme.loaded).toBe(true);
    });

    it('should cleanup unused theme resources', () => {
      themeManager.setTheme('custom1');
      themeManager.setTheme('custom2');
      themeManager.setTheme('custom3');
      
      // Should keep only recent themes in memory
      const cachedThemes = themeManager.getCachedThemes();
      expect(cachedThemes.length).toBeLessThanOrEqual(3);
    });
  });
});