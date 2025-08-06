import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { 
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  AdjustmentsVerticalIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  DocumentTextIcon,
  CogIcon,
  PlayIcon,
  FolderIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  WrenchScrewdriverIcon,
  BugAntIcon,
  CloudIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  HandRaisedIcon,
  CursorArrowRaysIcon,
  FaceSmileIcon,
  BoltIcon,
  RocketLaunchIcon,
  StarIcon,
  HeartIcon,
  CommandLineIcon,
  WindowIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// ================================
// ULTRA-MOBILE TYPES
// ================================

interface MobileViewport {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  device: 'mobile' | 'tablet' | 'desktop';
  pixelRatio: number;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface TouchGesture {
  type: 'tap' | 'double_tap' | 'long_press' | 'swipe' | 'pinch' | 'rotate' | 'pan';
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number };
  duration: number;
  velocity?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  fingers: number;
  target?: Element;
}

interface MobileLayout {
  id: string;
  name: string;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  panels: MobilePanel[];
  activePanel?: string;
  collapsedPanels: string[];
  orientation: 'portrait' | 'landscape';
  density: 'compact' | 'comfortable' | 'spacious';
}

interface MobilePanel {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'overlay';
  size: 'small' | 'medium' | 'large' | 'auto';
  collapsible: boolean;
  draggable: boolean;
  resizable: boolean;
  zIndex: number;
  visible: boolean;
  content: React.ComponentType<any>;
  mobileOnly?: boolean;
  tabletOnly?: boolean;
  desktopOnly?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface MobileTheme {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'auto';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    fast: string;
    normal: string;
    slow: string;
  };
}

interface MobileSettings {
  viewport: MobileViewport;
  layout: MobileLayout;
  theme: MobileTheme;
  gestures: {
    enabled: boolean;
    sensitivity: number;
    hapticFeedback: boolean;
    soundFeedback: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    voiceOver: boolean;
  };
  performance: {
    virtualScrolling: boolean;
    lazyLoading: boolean;
    imageOptimization: boolean;
    caching: boolean;
    preloading: boolean;
  };
  offline: {
    enabled: boolean;
    syncStrategy: 'immediate' | 'periodic' | 'manual';
    storageLimit: number; // MB
    conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'prompt';
  };
  notifications: {
    enabled: boolean;
    showBadges: boolean;
    vibration: boolean;
    sound: boolean;
    priority: 'low' | 'normal' | 'high';
  };
}

interface MobileCodeEditor {
  content: string;
  language: string;
  readOnly: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  fontSize: number;
  tabSize: number;
  insertSpaces: boolean;
  cursorPosition: { line: number; column: number };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  touchOptimized: boolean;
  gestureEnabled: boolean;
  autocomplete: boolean;
  syntaxHighlighting: boolean;
  errorChecking: boolean;
  formatOnSave: boolean;
}

interface MobileFormDesigner {
  form: any; // VB6 form data
  selectedControl?: string;
  dragMode: 'none' | 'move' | 'resize' | 'select';
  touchMode: 'precise' | 'gesture' | 'voice';
  snapToGrid: boolean;
  gridSize: number;
  zoom: number;
  showGuides: boolean;
  touchTargetSize: number; // minimum touch target size in pixels
  gestureTimeout: number; // milliseconds
  multiSelectEnabled: boolean;
  contextMenuEnabled: boolean;
  undoRedoEnabled: boolean;
  previewMode: boolean;
}

interface MobileToolbar {
  id: string;
  position: 'top' | 'bottom' | 'floating';
  items: MobileToolbarItem[];
  customizable: boolean;
  collapsible: boolean;
  contextual: boolean;
  autoHide: boolean;
  density: 'compact' | 'comfortable';
}

interface MobileToolbarItem {
  id: string;
  type: 'button' | 'dropdown' | 'input' | 'separator' | 'group';
  icon?: React.ComponentType<any>;
  label?: string;
  tooltip?: string;
  action?: string | (() => void);
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: MobileToolbarItem[];
  quickAction?: boolean;
  voice?: string; // voice command
  gesture?: TouchGesture;
}

interface MobileSidebar {
  id: string;
  position: 'left' | 'right';
  width: number;
  collapsed: boolean;
  collapsedWidth: number;
  resizable: boolean;
  overlay: boolean;
  swipeToOpen: boolean;
  swipeToClose: boolean;
  persistent: boolean;
  tabs: MobileSidebarTab[];
  activeTab?: string;
}

interface MobileSidebarTab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  badge?: string | number;
  disabled?: boolean;
  order: number;
}

interface MobileDialog {
  id: string;
  type: 'modal' | 'drawer' | 'popover' | 'fullscreen' | 'bottom_sheet';
  title: string;
  content: React.ComponentType<any>;
  actions?: MobileDialogAction[];
  dismissible: boolean;
  backdrop: boolean;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  animation: 'slide' | 'fade' | 'scale' | 'none';
  swipeToDismiss: boolean;
  persistent: boolean;
}

interface MobileDialogAction {
  id: string;
  label: string;
  action: () => void;
  style: 'primary' | 'secondary' | 'destructive' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

interface MobileNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  persistent: boolean;
  showProgress?: boolean;
  vibration?: boolean;
  sound?: boolean;
  priority: 'low' | 'normal' | 'high';
}

// ================================
// ULTRA-MOBILE ENGINE
// ================================

class UltraMobileEngine {
  private viewport: MobileViewport;
  private settings: MobileSettings;
  private gestures: Map<string, TouchGesture> = new Map();
  private dialogs: Map<string, MobileDialog> = new Map();
  private notifications: Map<string, MobileNotification> = new Map();
  private eventListeners: Map<string, ((...args: any[]) => any)[]> = new Map();
  private touchStartTime: number = 0;
  private lastTouchEnd: number = 0;
  private touchCount: number = 0;
  private gestureRecognizer: GestureRecognizer;

  constructor() {
    this.viewport = this.detectViewport();
    this.settings = this.getDefaultSettings();
    this.gestureRecognizer = new GestureRecognizer();
    this.initializeEngine();
  }

  private detectViewport(): MobileViewport {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (width <= 768) device = 'mobile';
    else if (width <= 1024) device = 'tablet';

    const orientation = width > height ? 'landscape' : 'portrait';

    // Detect safe areas for notched devices
    const safeArea = {
      top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'),
      right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0'),
      bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0'),
      left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0')
    };

    return {
      width,
      height,
      orientation,
      device,
      pixelRatio,
      safeArea
    };
  }

  private getDefaultSettings(): MobileSettings {
    return {
      viewport: this.viewport,
      layout: this.getDefaultLayout(),
      theme: this.getDefaultTheme(),
      gestures: {
        enabled: true,
        sensitivity: 1.0,
        hapticFeedback: true,
        soundFeedback: false
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reduceMotion: false,
        screenReader: false,
        voiceOver: false
      },
      performance: {
        virtualScrolling: true,
        lazyLoading: true,
        imageOptimization: true,
        caching: true,
        preloading: true
      },
      offline: {
        enabled: true,
        syncStrategy: 'periodic',
        storageLimit: 100,
        conflictResolution: 'prompt'
      },
      notifications: {
        enabled: true,
        showBadges: true,
        vibration: true,
        sound: false,
        priority: 'normal'
      }
    };
  }

  private getDefaultLayout(): MobileLayout {
    return {
      id: 'default_mobile',
      name: 'Default Mobile Layout',
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      },
      panels: this.getDefaultPanels(),
      collapsedPanels: [],
      orientation: this.viewport.orientation,
      density: this.viewport.device === 'mobile' ? 'compact' : 'comfortable'
    };
  }

  private getDefaultPanels(): MobilePanel[] {
    return [
      {
        id: 'editor',
        name: 'Code Editor',
        icon: CodeBracketIcon,
        position: 'center',
        size: 'auto',
        collapsible: false,
        draggable: false,
        resizable: false,
        zIndex: 1,
        visible: true,
        content: () => null // Would be actual editor component
      },
      {
        id: 'toolbar',
        name: 'Main Toolbar',
        icon: WrenchScrewdriverIcon,
        position: 'top',
        size: 'small',
        collapsible: true,
        draggable: false,
        resizable: false,
        zIndex: 10,
        visible: true,
        content: () => null
      },
      {
        id: 'file_explorer',
        name: 'File Explorer',
        icon: FolderIcon,
        position: 'left',
        size: 'medium',
        collapsible: true,
        draggable: false,
        resizable: true,
        zIndex: 5,
        visible: this.viewport.device !== 'mobile',
        content: () => null,
        mobileOnly: false
      },
      {
        id: 'properties',
        name: 'Properties',
        icon: AdjustmentsVerticalIcon,
        position: 'right',
        size: 'medium',
        collapsible: true,
        draggable: false,
        resizable: true,
        zIndex: 5,
        visible: this.viewport.device === 'desktop',
        content: () => null,
        desktopOnly: true
      },
      {
        id: 'output',
        name: 'Output',
        icon: DocumentTextIcon,
        position: 'bottom',
        size: 'small',
        collapsible: true,
        draggable: false,
        resizable: true,
        zIndex: 5,
        visible: false,
        content: () => null
      },
      {
        id: 'quick_actions',
        name: 'Quick Actions',
        icon: BoltIcon,
        position: 'overlay',
        size: 'auto',
        collapsible: false,
        draggable: true,
        resizable: false,
        zIndex: 20,
        visible: this.viewport.device === 'mobile',
        content: () => null,
        mobileOnly: true
      }
    ];
  }

  private getDefaultTheme(): MobileTheme {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return {
      id: 'default',
      name: 'Default Theme',
      mode: 'auto',
      colors: isDark ? {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#cbd5e1',
        border: '#334155',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4'
      } : {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.625
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        fast: '150ms ease',
        normal: '200ms ease',
        slow: '300ms ease'
      }
    };
  }

  private initializeEngine(): void {
    this.setupEventListeners();
    this.initializeGestures();
    this.initializeServiceWorker();
    this.detectCapabilities();
  }

  private windowEventHandlers = new Map<string, EventListener>();
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;

  private setupEventListeners(): void {
    // Viewport change detection
    const resizeHandler = () => {
      this.updateViewport();
    };
    const orientationHandler = () => {
      setTimeout(() => this.updateViewport(), 100);
    };
    const visibilityHandler = () => {
      if (document.hidden) {
        this.pauseNonEssentialTasks();
      } else {
        this.resumeNonEssentialTasks();
      }
    };

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', orientationHandler);
    document.addEventListener('visibilitychange', visibilityHandler);

    // Store handlers for cleanup
    this.windowEventHandlers.set('resize', resizeHandler);
    this.windowEventHandlers.set('orientationchange', orientationHandler);
    this.windowEventHandlers.set('visibilitychange', visibilityHandler);

    // Theme detection
    if (window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryHandler = (e: MediaQueryListEvent) => {
        if (this.settings.theme.mode === 'auto') {
          this.updateThemeMode(e.matches ? 'dark' : 'light');
        }
      };
      this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
    }

    // Memory pressure detection
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8) {
        this.enableMemoryOptimizations();
      }
    }
  }

  private initializeGestures(): void {
    if (!this.settings.gestures.enabled) return;

    // Touch event listeners
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

    // Mouse event listeners for desktop testing
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Pointer events for hybrid devices
    if ('PointerEvent' in window) {
      document.addEventListener('pointerdown', this.handlePointerDown.bind(this));
      document.addEventListener('pointermove', this.handlePointerMove.bind(this));
      document.addEventListener('pointerup', this.handlePointerUp.bind(this));
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    if (!this.settings.offline.enabled) return;
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.emit('serviceworker:registered', registration);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  private detectCapabilities(): void {
    const capabilities = {
      touch: 'ontouchstart' in window,
      hover: window.matchMedia('(hover: hover)').matches,
      pointer: window.matchMedia('(pointer: coarse)').matches,
      vibration: 'vibrate' in navigator,
      wakeLock: 'wakeLock' in navigator,
      share: 'share' in navigator,
      clipboard: 'clipboard' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator,
      microphone: 'mediaDevices' in navigator,
      battery: 'getBattery' in navigator,
      connection: 'connection' in navigator,
      memory: 'memory' in performance,
      orientation: 'DeviceOrientationEvent' in window,
      motion: 'DeviceMotionEvent' in window
    };

    this.emit('capabilities:detected', capabilities);
  }

  private handleTouchStart(event: TouchEvent): void {
    const now = Date.now();
    this.touchStartTime = now;
    this.touchCount = event.touches.length;

    const touch = event.touches[0];
    const gesture: Partial<TouchGesture> = {
      type: 'tap',
      startPoint: { x: touch.clientX, y: touch.clientY },
      duration: 0,
      fingers: this.touchCount,
      target: event.target as Element
    };

    this.gestures.set('current', gesture as TouchGesture);

    // Haptic feedback for supported devices
    if (this.settings.gestures.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    this.emit('gesture:start', gesture);
  }

  private handleTouchMove(event: TouchEvent): void {
    const currentGesture = this.gestures.get('current');
    if (!currentGesture) return;

    const touch = event.touches[0];
    currentGesture.endPoint = { x: touch.clientX, y: touch.clientY };
    
    // Calculate velocity and distance
    const deltaX = currentGesture.endPoint.x - currentGesture.startPoint.x;
    const deltaY = currentGesture.endPoint.y - currentGesture.startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Update gesture type based on movement
    if (distance > 10) {
      if (this.touchCount === 1) {
        currentGesture.type = Math.abs(deltaX) > Math.abs(deltaY) ? 'swipe' : 'pan';
      } else if (this.touchCount === 2) {
        // Handle pinch/zoom gestures
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch.clientX - touch2.clientX, 2) + 
          Math.pow(touch.clientY - touch2.clientY, 2)
        );
        // Would calculate scale based on initial distance
        currentGesture.type = 'pinch';
      }
    }

    currentGesture.velocity = {
      x: deltaX / (Date.now() - this.touchStartTime),
      y: deltaY / (Date.now() - this.touchStartTime)
    };

    this.emit('gesture:move', currentGesture);
  }

  private handleTouchEnd(event: TouchEvent): void {
    const currentGesture = this.gestures.get('current');
    if (!currentGesture) return;

    const now = Date.now();
    currentGesture.duration = now - this.touchStartTime;

    // Detect double tap
    if (currentGesture.type === 'tap' && now - this.lastTouchEnd < 300) {
      currentGesture.type = 'double_tap';
    }

    // Detect long press
    if (currentGesture.duration > 500 && !currentGesture.endPoint) {
      currentGesture.type = 'long_press';
    }

    this.lastTouchEnd = now;
    this.processGesture(currentGesture);
    this.gestures.delete('current');
  }

  private handleTouchCancel(event: TouchEvent): void {
    this.gestures.delete('current');
  }

  private handleMouseDown(event: MouseEvent): void {
    // Simulate touch events for desktop testing
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{
        clientX: event.clientX,
        clientY: event.clientY,
        target: event.target
      } as any]
    } as any);
    this.handleTouchStart(touchEvent);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.gestures.has('current')) {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{
          clientX: event.clientX,
          clientY: event.clientY
        } as any]
      } as any);
      this.handleTouchMove(touchEvent);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.gestures.has('current')) {
      this.handleTouchEnd({} as TouchEvent);
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    // Enhanced pointer event handling
  }

  private handlePointerMove(event: PointerEvent): void {
    // Enhanced pointer event handling
  }

  private handlePointerUp(event: PointerEvent): void {
    // Enhanced pointer event handling
  }

  private processGesture(gesture: TouchGesture): void {
    this.emit('gesture:end', gesture);

    // Process specific gestures
    switch (gesture.type) {
      case 'tap':
        this.handleTap(gesture);
        break;
      case 'double_tap':
        this.handleDoubleTap(gesture);
        break;
      case 'long_press':
        this.handleLongPress(gesture);
        break;
      case 'swipe':
        this.handleSwipe(gesture);
        break;
      case 'pinch':
        this.handlePinch(gesture);
        break;
      case 'pan':
        this.handlePan(gesture);
        break;
    }
  }

  private handleTap(gesture: TouchGesture): void {
    // Handle tap gestures
    this.emit('gesture:tap', gesture);
  }

  private handleDoubleTap(gesture: TouchGesture): void {
    // Handle double tap - typically zoom or select
    this.emit('gesture:double_tap', gesture);
  }

  private handleLongPress(gesture: TouchGesture): void {
    // Handle long press - context menu or selection
    this.emit('gesture:long_press', gesture);
    
    if (this.settings.gestures.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([50, 10, 50]);
    }
  }

  private handleSwipe(gesture: TouchGesture): void {
    if (!gesture.endPoint || !gesture.velocity) return;

    const deltaX = gesture.endPoint.x - gesture.startPoint.x;
    const deltaY = gesture.endPoint.y - gesture.startPoint.y;
    
    const direction = Math.abs(deltaX) > Math.abs(deltaY) 
      ? (deltaX > 0 ? 'right' : 'left')
      : (deltaY > 0 ? 'down' : 'up');

    this.emit('gesture:swipe', { ...gesture, direction });
  }

  private handlePinch(gesture: TouchGesture): void {
    // Handle pinch for zoom
    this.emit('gesture:pinch', gesture);
  }

  private handlePan(gesture: TouchGesture): void {
    // Handle pan for scrolling/dragging
    this.emit('gesture:pan', gesture);
  }

  private updateViewport(): void {
    const newViewport = this.detectViewport();
    const oldDevice = this.viewport.device;
    
    this.viewport = newViewport;
    this.settings.viewport = newViewport;

    // Update layout if device type changed
    if (oldDevice !== newViewport.device) {
      this.updateLayoutForDevice(newViewport.device);
    }

    this.emit('viewport:changed', newViewport);
  }

  private updateLayoutForDevice(device: 'mobile' | 'tablet' | 'desktop'): void {
    const layout = this.settings.layout;
    
    // Update panel visibility based on device
    layout.panels.forEach(panel => {
      if (panel.mobileOnly && device !== 'mobile') {
        panel.visible = false;
      } else if (panel.tabletOnly && device !== 'tablet') {
        panel.visible = false;
      } else if (panel.desktopOnly && device !== 'desktop') {
        panel.visible = false;
      } else if (!panel.mobileOnly && !panel.tabletOnly && !panel.desktopOnly) {
        panel.visible = true;
      }
    });

    // Update density
    layout.density = device === 'mobile' ? 'compact' : 
                     device === 'tablet' ? 'comfortable' : 'spacious';

    this.emit('layout:updated', layout);
  }

  private updateThemeMode(mode: 'light' | 'dark'): void {
    this.settings.theme.mode = mode;
    this.settings.theme.colors = mode === 'dark' ? this.getDarkColors() : this.getLightColors();
    this.emit('theme:updated', this.settings.theme);
  }

  private getDarkColors() {
    return {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    };
  }

  private getLightColors() {
    return {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    };
  }

  private pauseNonEssentialTasks(): void {
    // Pause animations, reduce refresh rates, etc.
    this.emit('performance:pause');
  }

  private resumeNonEssentialTasks(): void {
    // Resume normal operation
    this.emit('performance:resume');
  }

  private enableMemoryOptimizations(): void {
    // Enable aggressive memory management
    this.settings.performance.virtualScrolling = true;
    this.settings.performance.lazyLoading = true;
    this.emit('memory:optimize');
  }

  // Public API
  public getViewport(): MobileViewport {
    return this.viewport;
  }

  public getSettings(): MobileSettings {
    return this.settings;
  }

  public updateSettings(updates: Partial<MobileSettings>): void {
    Object.assign(this.settings, updates);
    this.emit('settings:updated', this.settings);
  }

  public showNotification(notification: Omit<MobileNotification, 'id'>): string {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification: MobileNotification = { ...notification, id };
    
    this.notifications.set(id, fullNotification);
    this.emit('notification:show', fullNotification);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismissNotification(id);
      }, notification.duration);
    }

    // Vibration feedback
    if (notification.vibration && 'vibrate' in navigator) {
      const pattern = notification.type === 'error' ? [200, 100, 200] : [100];
      navigator.vibrate(pattern);
    }

    return id;
  }

  public dismissNotification(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.delete(id);
      this.emit('notification:dismiss', { id, notification });
    }
  }

  public showDialog(dialog: Omit<MobileDialog, 'id'>): string {
    const id = `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullDialog: MobileDialog = { ...dialog, id };
    
    this.dialogs.set(id, fullDialog);
    this.emit('dialog:show', fullDialog);

    return id;
  }

  public dismissDialog(id: string): void {
    const dialog = this.dialogs.get(id);
    if (dialog) {
      this.dialogs.delete(id);
      this.emit('dialog:dismiss', { id, dialog });
    }
  }

  public requestWakeLock(): Promise<any> {
    if ('wakeLock' in navigator) {
      return (navigator as any).wakeLock.request('screen');
    }
    return Promise.reject('Wake Lock API not supported');
  }

  public shareContent(data: { title?: string; text?: string; url?: string; files?: File[] }): Promise<void> {
    if ('share' in navigator) {
      return (navigator as any).share(data);
    }
    return Promise.reject('Web Share API not supported');
  }

  // Event system
  private addEventListener(event: string, listener: (...args: any[]) => any): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  public onEvent(event: string, listener: (...args: any[]) => any): void {
    this.addEventListener(event, listener);
  }

  public offEvent(event: string, listener: (...args: any[]) => any): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  public destroy(): void {
    // Clean up window event listeners
    this.windowEventHandlers.forEach((handler, event) => {
      if (event === 'visibilitychange') {
        document.removeEventListener(event, handler);
      } else {
        window.removeEventListener(event, handler);
      }
    });
    this.windowEventHandlers.clear();

    // Clean up media query listener
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
      this.mediaQueryList = undefined;
      this.mediaQueryHandler = undefined;
    }

    // Clean up touch/gesture event listeners
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));

    // Clean up pointer events
    if ('PointerEvent' in window) {
      document.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
      document.removeEventListener('pointermove', this.handlePointerMove.bind(this));
      document.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    }

    // Clear all internal maps and references
    this.gestures.clear();
    this.dialogs.clear();
    this.notifications.clear();
    this.eventListeners.clear();
  }
}

// ================================
// GESTURE RECOGNIZER
// ================================

class GestureRecognizer {
  private recognizers: Map<string, (...args: any[]) => any> = new Map();

  constructor() {
    this.setupRecognizers();
  }

  private setupRecognizers(): void {
    // Setup various gesture recognizers
    this.recognizers.set('tap', this.recognizeTap.bind(this));
    this.recognizers.set('swipe', this.recognizeSwipe.bind(this));
    this.recognizers.set('pinch', this.recognizePinch.bind(this));
    this.recognizers.set('rotate', this.recognizeRotate.bind(this));
  }

  private recognizeTap(gesture: TouchGesture): boolean {
    return gesture.duration < 200 && !gesture.endPoint;
  }

  private recognizeSwipe(gesture: TouchGesture): boolean {
    if (!gesture.endPoint || !gesture.velocity) return false;
    const distance = Math.sqrt(
      Math.pow(gesture.endPoint.x - gesture.startPoint.x, 2) + 
      Math.pow(gesture.endPoint.y - gesture.startPoint.y, 2)
    );
    return distance > 50 && Math.abs(gesture.velocity.x) > 0.5;
  }

  private recognizePinch(gesture: TouchGesture): boolean {
    return gesture.fingers === 2 && gesture.scale !== undefined;
  }

  private recognizeRotate(gesture: TouchGesture): boolean {
    return gesture.fingers === 2 && gesture.rotation !== undefined;
  }

  public recognize(gesture: TouchGesture): string | null {
    for (const [type, recognizer] of this.recognizers) {
      if (recognizer(gesture)) {
        return type;
      }
    }
    return null;
  }
}

// ================================
// ULTRA-MOBILE COMPONENT
// ================================

export const UltraMobileIDE: React.FC = () => {
  const { selectedControl, updateControl } = useVB6Store();
  
  // State management
  const [mobileEngine] = useState(() => new UltraMobileEngine());
  const [viewport, setViewport] = useState<MobileViewport>(mobileEngine.getViewport());
  const [settings, setSettings] = useState<MobileSettings>(mobileEngine.getSettings());
  const [activePanel, setActivePanel] = useState<string>('editor');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [dialogs, setDialogs] = useState<MobileDialog[]>([]);
  const [currentTheme, setCurrentTheme] = useState(settings.theme.mode);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Effects
  useEffect(() => {
    setupEventListeners();
    setupNetworkDetection();
    
    return () => {
      cleanupEventListeners();
    };
  }, [setupEventListeners, setupNetworkDetection, cleanupEventListeners]);

  // Store event listeners for cleanup
  const eventListenersRef = useRef<Array<{event: string, handler: (...args: any[]) => any}>>([]);

  const setupEventListeners = useCallback(() => {
    const handlers = [
      {
        event: 'viewport:changed',
        handler: (newViewport: MobileViewport) => {
          setViewport(newViewport);
        }
      },
      {
        event: 'settings:updated',
        handler: (newSettings: MobileSettings) => {
          setSettings(newSettings);
        }
      },
      {
        event: 'notification:show',
        handler: (notification: MobileNotification) => {
          setNotifications(prev => [...prev, notification]);
        }
      },
      {
        event: 'notification:dismiss',
        handler: (data: any) => {
          setNotifications(prev => prev.filter(n => n.id !== data.id));
        }
      },
      {
        event: 'dialog:show',
        handler: (dialog: MobileDialog) => {
          setDialogs(prev => [...prev, dialog]);
        }
      },
      {
        event: 'dialog:dismiss',
        handler: (data: any) => {
          setDialogs(prev => prev.filter(d => d.id !== data.id));
        }
      },
      {
        event: 'gesture:tap',
        handler: (gesture: TouchGesture) => {
          // Handle tap gestures
        }
      },
      {
        event: 'gesture:swipe',
        handler: (gesture: any) => {
          handleSwipeGesture(gesture);
        }
      },
      {
        event: 'theme:updated',
        handler: (theme: MobileTheme) => {
          setCurrentTheme(theme.mode);
        }
      }
    ];

    // Register all event listeners
    handlers.forEach(({ event, handler }) => {
      mobileEngine.onEvent(event, handler);
    });

    // Store handlers for cleanup
    eventListenersRef.current = handlers;
  }, [mobileEngine, handleSwipeGesture]);

  // Store network event listeners for cleanup
  const networkListenersRef = useRef<{online: () => void, offline: () => void} | null>(null);

  const setupNetworkDetection = useCallback(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store handlers for cleanup
    networkListenersRef.current = { online: handleOnline, offline: handleOffline };
  }, []);

  const cleanupEventListeners = useCallback(() => {
    // Clean up mobile engine event listeners
    if (eventListenersRef.current) {
      eventListenersRef.current.forEach(({ event, handler }) => {
        mobileEngine.offEvent(event, handler);
      });
      eventListenersRef.current = [];
    }

    // Clean up network event listeners
    if (networkListenersRef.current) {
      window.removeEventListener('online', networkListenersRef.current.online);
      window.removeEventListener('offline', networkListenersRef.current.offline);
      networkListenersRef.current = null;
    }

    // Destroy the mobile engine to clean up all its internal listeners
    mobileEngine.destroy();
  }, [mobileEngine]);

  const handleSwipeGesture = useCallback((gesture: any) => {
    const { direction } = gesture;
    
    switch (direction) {
      case 'right':
        if (viewport.device === 'mobile' && !sidebarOpen) {
          setSidebarOpen(true);
        }
        break;
      case 'left':
        if (sidebarOpen) {
          setSidebarOpen(false);
        }
        break;
      case 'up':
        // Could show bottom sheet or panel
        break;
      case 'down':
        // Could hide panels or refresh
        break;
    }
  }, [viewport.device, sidebarOpen]);

  const toggleTheme = useCallback(() => {
    const newMode = currentTheme === 'dark' ? 'light' : 'dark';
    mobileEngine.updateSettings({
      ...settings,
      theme: { ...settings.theme, mode: newMode }
    });
  }, [currentTheme, settings, mobileEngine]);

  const showNotification = useCallback((type: MobileNotification['type'], message: string) => {
    mobileEngine.showNotification({
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      duration: 3000,
      persistent: false,
      vibration: true,
      priority: 'normal'
    });
  }, [mobileEngine]);

  const renderMobileToolbar = () => (
    <div className={`flex items-center justify-between p-2 ${
      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    } border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Left section */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        
        {viewport.device === 'mobile' && (
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium">VB6 Ultra</span>
            {isOffline && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" title="Offline" />
            )}
          </div>
        )}
      </div>

      {/* Center section - Quick actions for mobile */}
      {viewport.device === 'mobile' && (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => showNotification('info', 'Running project...')}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
            title="Run"
          >
            <PlayIcon className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
            title="Debug"
          >
            <BugAntIcon className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
            title="Share"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
          title="Toggle Theme"
        >
          {currentTheme === 'dark' ? (
            <SunIcon className="w-4 h-4" />
          ) : (
            <MoonIcon className="w-4 h-4" />
          )}
        </button>
        
        <button
          className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
          title="Settings"
        >
          <CogIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderMobileSidebar = () => (
    <>
      {/* Overlay */}
      {sidebarOpen && viewport.device === 'mobile' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 ${
        currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } border-r ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} z-50 transform transition-transform duration-200 ${
        sidebarOpen || viewport.device !== 'mobile' ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <RocketLaunchIcon className="w-6 h-6 text-blue-600" />
            <span className="font-bold">VB6 Ultra</span>
          </div>
          {viewport.device === 'mobile' && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-2">
          <div className="space-y-1">
            {[
              { id: 'explorer', name: 'File Explorer', icon: FolderIcon },
              { id: 'editor', name: 'Code Editor', icon: CodeBracketIcon },
              { id: 'designer', name: 'Form Designer', icon: PaintBrushIcon },
              { id: 'debug', name: 'Debug', icon: BugAntIcon },
              { id: 'output', name: 'Output', icon: DocumentTextIcon },
              { id: 'settings', name: 'Settings', icon: CogIcon }
            ].map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActivePanel(id);
                  if (viewport.device === 'mobile') {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activePanel === id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Device info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className={`p-2 rounded-lg text-xs ${
            currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <span>Device:</span>
              <div className="flex items-center space-x-1">
                {viewport.device === 'mobile' && <DevicePhoneMobileIcon className="w-3 h-3" />}
                {viewport.device === 'tablet' && <DeviceTabletIcon className="w-3 h-3" />}
                {viewport.device === 'desktop' && <ComputerDesktopIcon className="w-3 h-3" />}
                <span className="capitalize">{viewport.device}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Orientation:</span>
              <span className="capitalize">{viewport.orientation}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Network:</span>
              <span className={isOffline ? 'text-orange-500' : 'text-green-500'}>
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderMainContent = () => (
    <div className={`flex-1 flex flex-col ${
      currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    } ${sidebarOpen && viewport.device !== 'mobile' ? 'ml-64' : ''} transition-all duration-200`}>
      {/* Content Area */}
      <div className="flex-1 p-4">
        {activePanel === 'editor' && (
          <div className={`h-full rounded-lg border ${
            currentTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Mobile Code Editor</h2>
              <div className={`p-4 rounded border ${
                currentTheme === 'dark' ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'
              }`}>
                <pre className="text-sm font-mono">
{`Private Sub Form_Load()
    ' VB6 Ultra Mobile IDE
    Dim message As String
    message = "Welcome to mobile VB6 development!"
    
    ' Touch-optimized controls
    Text1.Text = message
    Text1.FontSize = IIf(Screen.Width < 768, 14, 12)
    
    ' Responsive layout
    If Screen.Width < 480 Then
        Command1.Height = 48 ' Larger touch targets
        Command1.Width = Form1.Width - 32
    End If
    
    MsgBox message, vbInformation, "VB6 Ultra"
End Sub`}
                </pre>
              </div>
              
              {/* Mobile-specific editor controls */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
                  Run Code
                </button>
                <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">
                  Format
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded text-sm">
                  Save
                </button>
                {viewport.device === 'mobile' && (
                  <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm">
                    Voice Input
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'designer' && (
          <div className={`h-full rounded-lg border ${
            currentTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Touch-Optimized Form Designer</h2>
              
              {/* Touch controls */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm flex items-center space-x-1">
                  <HandRaisedIcon className="w-4 h-4" />
                  <span>Touch Mode</span>
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded text-sm flex items-center space-x-1">
                  <CursorArrowRaysIcon className="w-4 h-4" />
                  <span>Precise Mode</span>
                </button>
                <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm flex items-center space-x-1">
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                  <span>Zoom</span>
                </button>
              </div>

              {/* Design surface */}
              <div className={`min-h-96 rounded border-2 border-dashed ${
                currentTheme === 'dark' ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'
              } relative`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <PaintBrushIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Touch-optimized form designer</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Tap to add controls, pinch to zoom, long press for context menu
                    </p>
                  </div>
                </div>

                {/* Sample controls with touch targets */}
                <div className="absolute top-4 left-4">
                  <div className="w-32 h-8 bg-blue-200 border border-blue-300 rounded flex items-center justify-center text-sm">
                    TextBox
                  </div>
                </div>
                
                <div className="absolute top-16 left-4">
                  <div className="w-24 h-8 bg-green-200 border border-green-300 rounded flex items-center justify-center text-sm">
                    Button
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'settings' && (
          <div className={`h-full rounded-lg border ${
            currentTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Mobile Settings</h2>
              
              <div className="space-y-4">
                {/* Theme Settings */}
                <div>
                  <h3 className="text-md font-medium mb-2">Appearance</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Dark Mode</span>
                      <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          currentTheme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            currentTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Font Size</span>
                      <select className={`px-2 py-1 rounded border ${
                        currentTheme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <option>Small</option>
                        <option>Medium</option>
                        <option>Large</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Touch Settings */}
                <div>
                  <h3 className="text-md font-medium mb-2">Touch & Gestures</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Haptic Feedback</span>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sound Feedback</span>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gesture Sensitivity</span>
                      <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="w-20" />
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div>
                  <h3 className="text-md font-medium mb-2">Performance</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Virtual Scrolling</span>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lazy Loading</span>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reduce Motion</span>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Default panel content */}
        {!['editor', 'designer', 'settings'].includes(activePanel) && (
          <div className={`h-full rounded-lg border ${
            currentTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } flex items-center justify-center`}>
            <div className="text-center">
              <RocketLaunchIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">VB6 Ultra Mobile IDE</h2>
              <p className="text-gray-500 mb-4">Touch-optimized development environment</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Responsive</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Touch-Optimized</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Gesture-Enabled</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">PWA Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for mobile */}
      {viewport.device === 'mobile' && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => showNotification('info', 'Quick action triggered!')}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${
            notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            notification.type === 'warning' ? 'bg-orange-50 border-orange-500 text-orange-800' :
            'bg-blue-50 border-blue-500 text-blue-800'
          } ${currentTheme === 'dark' ? 'dark' : ''}`}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => mobileEngine.dismissNotification(notification.id)}
              className="ml-2 text-current opacity-50 hover:opacity-100"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`h-screen flex flex-col ${
      currentTheme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Mobile Toolbar */}
      {renderMobileToolbar()}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar */}
        {renderMobileSidebar()}
        
        {/* Main Content */}
        {renderMainContent()}
      </div>

      {/* Notifications */}
      {renderNotifications()}

      {/* Touch gesture hint for first-time users */}
      {viewport.device === 'mobile' && (
        <div className="fixed bottom-20 left-4 right-4 z-20">
          <div className={`p-3 rounded-lg ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-lg text-center`}>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <HandRaisedIcon className="w-4 h-4 text-blue-500" />
              <span>Swipe right to open sidebar, long press for context menu</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraMobileIDE;