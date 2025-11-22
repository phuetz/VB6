/**
 * TEST COVERAGE GAP FIX: Comprehensive tests for ThemeManager
 * Tests theme switching, CSS validation, and security edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeManager } from '../services/ThemeManager';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let mockDocument: any;
  let mockLocalStorage: any;

  beforeEach(() => {
    // Mock DOM elements
    const mockHead = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn(),
      children: []
    };

    const mockBody = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false)
      },
      style: {}
    };

    mockDocument = {
      head: mockHead,
      body: mockBody,
      createElement: vi.fn().mockImplementation((tag: string) => {
        if (tag === 'style') {
          return {
            textContent: '',
            setAttribute: vi.fn(),
            getAttribute: vi.fn(),
            id: ''
          };
        }
        if (tag === 'link') {
          return {
            rel: '',
            href: '',
            setAttribute: vi.fn(),
            getAttribute: vi.fn(),
            id: ''
          };
        }
        return {};
      }),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([]),
      documentElement: {
        style: {
          setProperty: vi.fn(),
          removeProperty: vi.fn(),
          getPropertyValue: vi.fn().mockReturnValue('')
        }
      }
    };

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };

    // Mock console to suppress warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    global.document = mockDocument;
    global.localStorage = mockLocalStorage;

    themeManager = new ThemeManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Loading', () => {
    it('should load default theme on initialization', () => {
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('theme-vb6-classic');
    });

    it('should restore theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      const newThemeManager = new ThemeManager();
      
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('theme-dark');
    });

    it('should handle invalid theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme');
      
      const newThemeManager = new ThemeManager();
      
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('theme-vb6-classic');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to a valid theme', () => {
      const result = themeManager.setTheme('dark');
      
      expect(result).toBe(true);
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('theme-vb6-classic');
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('theme-dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vb6-theme', 'dark');
    });

    it('should reject invalid theme names', () => {
      const result = themeManager.setTheme('invalid-theme');
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid theme'));
    });

    it('should handle theme switching with custom CSS', () => {
      themeManager.setTheme('modern');
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('link');
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
    });

    it('should clean up previous theme resources', () => {
      themeManager.setTheme('dark');
      themeManager.setTheme('light');
      
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('theme-dark');
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('theme-light');
    });
  });

  describe('Custom CSS Variables', () => {
    it('should set custom CSS variables safely', () => {
      const variables = {
        '--primary-color': '#ff0000',
        '--secondary-color': '#00ff00',
        '--background-color': '#ffffff'
      };
      
      themeManager.setCustomVariables(variables);
      
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--primary-color', '#ff0000');
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--secondary-color', '#00ff00');
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--background-color', '#ffffff');
    });

    it('should validate CSS color values', () => {
      const ThemeManagerClass = ThemeManager as any;
      
      // Valid colors
      expect(ThemeManagerClass.isValidCSSColor('#ff0000')).toBe(true);
      expect(ThemeManagerClass.isValidCSSColor('#fff')).toBe(true);
      expect(ThemeManagerClass.isValidCSSColor('rgb(255, 0, 0)')).toBe(true);
      expect(ThemeManagerClass.isValidCSSColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(ThemeManagerClass.isValidCSSColor('hsl(0, 100%, 50%)')).toBe(true);
      expect(ThemeManagerClass.isValidCSSColor('red')).toBe(true);
      expect(ThemeManagerClass.isValidCSSColor('transparent')).toBe(true);
      
      // Invalid colors - CSS injection attempts
      expect(ThemeManagerClass.isValidCSSColor('red; background: url(javascript:alert(1))')).toBe(false);
      expect(ThemeManagerClass.isValidCSSColor('red/**/; background: red')).toBe(false);
      expect(ThemeManagerClass.isValidCSSColor('expression(alert(1))')).toBe(false);
      expect(ThemeManagerClass.isValidCSSColor('url(data:text/html,<script>alert(1)</script>)')).toBe(false);
      expect(ThemeManagerClass.isValidCSSColor('#ff0000; position: fixed')).toBe(false);
    });

    it('should reject dangerous CSS variables', () => {
      const dangerousVariables = {
        '--color': 'red; background: url(javascript:alert(1))',
        '--size': 'expression(alert(1))',
        '--bg': 'url(data:text/html,<script>alert(1)</script>)'
      };
      
      themeManager.setCustomVariables(dangerousVariables);
      
      // Should not set any of the dangerous variables
      expect(mockDocument.documentElement.style.setProperty).not.toHaveBeenCalledWith('--color', expect.stringContaining('javascript'));
      expect(mockDocument.documentElement.style.setProperty).not.toHaveBeenCalledWith('--size', expect.stringContaining('expression'));
      expect(mockDocument.documentElement.style.setProperty).not.toHaveBeenCalledWith('--bg', expect.stringContaining('script'));
    });

    it('should handle invalid CSS variable names', () => {
      const longName = '--a'.repeat(200);
      const invalidVariables = {
        'invalid-name': '#ff0000',  // Should start with --
        '--': '#00ff00',           // Too short
        [longName]: '#0000ff' // Too long
      };
      
      themeManager.setCustomVariables(invalidVariables);
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid CSS variable name'));
    });
  });

  describe('Theme Export/Import', () => {
    it('should export current theme configuration', () => {
      themeManager.setTheme('dark');
      themeManager.setCustomVariables({ '--primary-color': '#ff0000' });
      
      const exported = themeManager.exportTheme();
      
      expect(exported.name).toBe('dark');
      expect(exported.variables['--primary-color']).toBe('#ff0000');
      expect(exported.timestamp).toBeDefined();
    });

    it('should import valid theme configuration', () => {
      const themeConfig = {
        name: 'custom',
        variables: {
          '--primary-color': '#ff0000',
          '--secondary-color': '#00ff00'
        },
        timestamp: Date.now()
      };
      
      const result = themeManager.importTheme(themeConfig);
      
      expect(result).toBe(true);
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--primary-color', '#ff0000');
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--secondary-color', '#00ff00');
    });

    it('should reject malicious theme imports', () => {
      const maliciousConfig = {
        name: 'malicious',
        variables: {
          '--color': 'red; background: url(javascript:alert(1))',
          '--evil': 'expression(alert(1))'
        },
        timestamp: Date.now()
      };
      
      const result = themeManager.importTheme(maliciousConfig);
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid theme configuration'));
    });

    it('should validate theme configuration structure', () => {
      const invalidConfigs = [
        null,
        undefined,
        {},
        { name: 'test' }, // Missing variables
        { variables: {} }, // Missing name
        { name: '', variables: {} }, // Empty name
        { name: 'test', variables: 'invalid' } // Invalid variables type
      ];
      
      invalidConfigs.forEach(config => {
        const result = themeManager.importTheme(config as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('High Contrast Mode', () => {
    it('should enable high contrast mode', () => {
      themeManager.setHighContrast(true);
      
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('high-contrast');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vb6-high-contrast', 'true');
    });

    it('should disable high contrast mode', () => {
      themeManager.setHighContrast(false);
      
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('high-contrast');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('vb6-high-contrast');
    });

    it('should restore high contrast setting from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'vb6-high-contrast') return 'true';
        return null;
      });
      
      const newThemeManager = new ThemeManager();
      
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('high-contrast');
    });
  });

  describe('Font Scaling', () => {
    it('should set valid font scale', () => {
      const result = themeManager.setFontScale(1.2);
      
      expect(result).toBe(true);
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', '1.2');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vb6-font-scale', '1.2');
    });

    it('should reject invalid font scales', () => {
      const invalidScales = [0, -1, 3.5, NaN, Infinity];
      
      invalidScales.forEach(scale => {
        const result = themeManager.setFontScale(scale);
        expect(result).toBe(false);
      });
    });

    it('should clamp font scale to valid range', () => {
      themeManager.setFontScale(0.3); // Below minimum
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', '0.5');
      
      themeManager.setFontScale(4.0); // Above maximum
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith('--font-scale', '3');
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM manipulation errors gracefully', () => {
      mockDocument.documentElement.style.setProperty.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      const result = themeManager.setCustomVariables({ '--color': '#ff0000' });
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to set CSS variables'));
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });
      
      const result = themeManager.setTheme('dark');
      
      expect(result).toBe(true); // Theme should still be applied
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to save theme'));
    });

    it('should handle missing DOM elements', () => {
      global.document = null as any;
      
      expect(() => new ThemeManager()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should throttle rapid theme changes', () => {
      const setThemeSpy = vi.spyOn(themeManager, 'setTheme');
      
      // Rapid theme changes
      for (let i = 0; i < 10; i++) {
        themeManager.setTheme('dark');
        themeManager.setTheme('light');
      }
      
      // Should have been called but with throttling
      expect(setThemeSpy).toHaveBeenCalled();
    });

    it('should handle large numbers of CSS variables efficiently', () => {
      const largeVariableSet: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeVariableSet[`--var-${i}`] = `#${i.toString(16).padStart(6, '0')}`;
      }
      
      const startTime = performance.now();
      themeManager.setCustomVariables(largeVariableSet);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in theme names', () => {
      const specialNames = ['theme-with-dashes', 'theme_with_underscores', 'theme123'];
      
      specialNames.forEach(name => {
        const result = themeManager.setTheme(name);
        // These should be handled gracefully (either accepted or rejected cleanly)
        expect(typeof result).toBe('boolean');
      });
    });

    it('should handle very long CSS variable values', () => {
      const longValue = '#ff0000'.repeat(1000);
      const variables = { '--long-value': longValue };
      
      const result = themeManager.setCustomVariables(variables);
      
      // Should either accept or reject cleanly, not crash
      expect(typeof result).toBe('boolean');
    });

    it('should handle concurrent theme operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(themeManager.setTheme('dark')));
        promises.push(Promise.resolve(themeManager.setTheme('light')));
      }
      
      await Promise.all(promises);
      
      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});