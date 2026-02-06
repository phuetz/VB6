/**
 * Modern UI Theme System for VB6 IDE
 * Provides a sleek, professional interface with multiple theme options
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  borderDark: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  shadow: string;
  shadowLight: string;
  shadowDark: string;
  menubar: string;
  toolbar: string;
  statusbar: string;
  tooltip: string;
  selection: string;
  focus: string;
  code: {
    background: string;
    text: string;
    keyword: string;
    string: string;
    comment: string;
    number: string;
    operator: string;
    function: string;
    variable: string;
    type: string;
  };
}

export interface ThemeConfig {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  animation: {
    duration: number;
    easing: string;
  };
  effects: {
    blur: boolean;
    glassmorphism: boolean;
    shadows: boolean;
    animations: boolean;
  };
}

// Professional Light Theme
const lightTheme: ThemeConfig = {
  name: 'Professional Light',
  isDark: false,
  colors: {
    primary: '#0078D4',
    primaryHover: '#106EBE',
    primaryActive: '#005A9E',
    secondary: '#40E0D0',
    accent: '#FF6B6B',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F0F2F5',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',
    border: '#E1E4E8',
    borderLight: '#F0F2F5',
    borderDark: '#D1D5DB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowDark: 'rgba(0, 0, 0, 0.15)',
    menubar: '#F8F9FA',
    toolbar: '#FFFFFF',
    statusbar: '#F0F2F5',
    tooltip: '#1F2937',
    selection: '#0078D4',
    focus: '#0078D4',
    code: {
      background: '#F8F9FA',
      text: '#1F2937',
      keyword: '#0078D4',
      string: '#10B981',
      comment: '#6B7280',
      number: '#DC2626',
      operator: '#7C3AED',
      function: '#F59E0B',
      variable: '#3B82F6',
      type: '#EC4899',
    },
  },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: 14,
  borderRadius: 6,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  animation: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  effects: {
    blur: true,
    glassmorphism: false,
    shadows: true,
    animations: true,
  },
};

// Professional Dark Theme
const darkTheme: ThemeConfig = {
  name: 'Professional Dark',
  isDark: true,
  colors: {
    primary: '#60A5FA',
    primaryHover: '#3B82F6',
    primaryActive: '#2563EB',
    secondary: '#34D399',
    accent: '#F87171',
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    surface: '#1E293B',
    surfaceHover: '#334155',
    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textDisabled: '#64748B',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
    menubar: '#1E293B',
    toolbar: '#0F172A',
    statusbar: '#1E293B',
    tooltip: '#334155',
    selection: '#3B82F6',
    focus: '#60A5FA',
    code: {
      background: '#1E293B',
      text: '#F1F5F9',
      keyword: '#60A5FA',
      string: '#34D399',
      comment: '#64748B',
      number: '#F87171',
      operator: '#A78BFA',
      function: '#FBBF24',
      variable: '#60A5FA',
      type: '#F472B6',
    },
  },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: 14,
  borderRadius: 6,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  animation: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  effects: {
    blur: true,
    glassmorphism: true,
    shadows: true,
    animations: true,
  },
};

// Modern Vibrant Theme
const vibrantTheme: ThemeConfig = {
  name: 'Modern Vibrant',
  isDark: false,
  colors: {
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryActive: '#6D28D9',
    secondary: '#06B6D4',
    accent: '#EC4899',
    background: '#FAFAFA',
    backgroundSecondary: '#F3F4F6',
    backgroundTertiary: '#E5E7EB',
    surface: '#FFFFFF',
    surfaceHover: '#F9FAFB',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    text: '#111827',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    shadow: 'rgba(139, 92, 246, 0.1)',
    shadowLight: 'rgba(139, 92, 246, 0.05)',
    shadowDark: 'rgba(139, 92, 246, 0.2)',
    menubar: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    toolbar: '#FFFFFF',
    statusbar: '#F3F4F6',
    tooltip: '#4C1D95',
    selection: '#8B5CF6',
    focus: '#8B5CF6',
    code: {
      background: '#F9FAFB',
      text: '#111827',
      keyword: '#8B5CF6',
      string: '#10B981',
      comment: '#9CA3AF',
      number: '#EF4444',
      operator: '#EC4899',
      function: '#F59E0B',
      variable: '#06B6D4',
      type: '#8B5CF6',
    },
  },
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 14,
  borderRadius: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  animation: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  effects: {
    blur: true,
    glassmorphism: true,
    shadows: true,
    animations: true,
  },
};

// High Contrast Theme
const highContrastTheme: ThemeConfig = {
  name: 'High Contrast',
  isDark: true,
  colors: {
    primary: '#FFFFFF',
    primaryHover: '#F0F0F0',
    primaryActive: '#E0E0E0',
    secondary: '#00FF00',
    accent: '#FFFF00',
    background: '#000000',
    backgroundSecondary: '#0A0A0A',
    backgroundTertiary: '#1A1A1A',
    surface: '#0A0A0A',
    surfaceHover: '#1A1A1A',
    border: '#FFFFFF',
    borderLight: '#808080',
    borderDark: '#404040',
    text: '#FFFFFF',
    textSecondary: '#C0C0C0',
    textDisabled: '#808080',
    success: '#00FF00',
    warning: '#FFFF00',
    error: '#FF0000',
    info: '#00FFFF',
    shadow: 'rgba(255, 255, 255, 0.2)',
    shadowLight: 'rgba(255, 255, 255, 0.1)',
    shadowDark: 'rgba(255, 255, 255, 0.3)',
    menubar: '#0A0A0A',
    toolbar: '#000000',
    statusbar: '#0A0A0A',
    tooltip: '#FFFF00',
    selection: '#FFFF00',
    focus: '#FFFFFF',
    code: {
      background: '#0A0A0A',
      text: '#FFFFFF',
      keyword: '#00FFFF',
      string: '#00FF00',
      comment: '#808080',
      number: '#FF00FF',
      operator: '#FFFF00',
      function: '#FFA500',
      variable: '#00FFFF',
      type: '#FF00FF',
    },
  },
  fontFamily: 'Consolas, "Courier New", monospace',
  fontSize: 15,
  borderRadius: 0,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  animation: {
    duration: 0,
    easing: 'linear',
  },
  effects: {
    blur: false,
    glassmorphism: false,
    shadows: false,
    animations: false,
  },
};

const themes = {
  light: lightTheme,
  dark: darkTheme,
  vibrant: vibrantTheme,
  highContrast: highContrastTheme,
};

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (themeName: keyof typeof themes) => void;
  customizeTheme: (customization: Partial<ThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: keyof typeof themes;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(themes[defaultTheme]);

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    const theme = currentTheme;

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      } else if (typeof value === 'object') {
        // Handle nested color objects (like code colors)
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue as string);
        });
      }
    });

    // Typography
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--font-size', `${theme.fontSize}px`);

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, `${value}px`);
    });

    // Border radius
    root.style.setProperty('--border-radius', `${theme.borderRadius}px`);

    // Animation
    root.style.setProperty('--animation-duration', `${theme.animation.duration}ms`);
    root.style.setProperty('--animation-easing', theme.animation.easing);

    // Dark mode class
    if (theme.isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    // Effects
    if (theme.effects.blur) {
      document.body.classList.add('enable-blur');
    } else {
      document.body.classList.remove('enable-blur');
    }

    if (theme.effects.animations) {
      document.body.classList.add('enable-animations');
    } else {
      document.body.classList.remove('enable-animations');
    }
  }, [currentTheme]);

  const setTheme = (themeName: keyof typeof themes) => {
    setCurrentTheme(themes[themeName]);
    localStorage.setItem('vb6-theme', themeName);
  };

  const customizeTheme = (customization: Partial<ThemeConfig>) => {
    setCurrentTheme(prev => ({
      ...prev,
      ...customization,
      colors: {
        ...prev.colors,
        ...(customization.colors || {}),
      },
      spacing: {
        ...prev.spacing,
        ...(customization.spacing || {}),
      },
      effects: {
        ...prev.effects,
        ...(customization.effects || {}),
      },
    }));
  };

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('vb6-theme') as keyof typeof themes;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(themes[savedTheme]);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme, customizeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Styled components helpers
export const createStyledComponent = (Component: React.ComponentType<any>) => {
  return React.forwardRef((props: any, ref: any) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} ref={ref} />;
  });
};

// CSS-in-JS utilities
export const getThemeValue = (path: string, theme: ThemeConfig): any => {
  const keys = path.split('.');
  let value: any = theme;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
};

export default ThemeProvider;
