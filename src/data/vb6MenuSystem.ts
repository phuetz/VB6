/**
 * VB6 Menu System
 * Complete menu definition and handling for VB6 forms
 */

export interface VB6MenuItem {
  name: string;
  caption: string;
  index?: number; // For menu control arrays
  checked: boolean;
  enabled: boolean;
  visible: boolean;
  shortcut: string;
  windowList: boolean;
  negotiatePosition: number;
  submenu?: VB6MenuItem[];
  separator?: boolean;
}

export interface VB6Menu {
  items: VB6MenuItem[];
}

/**
 * Menu negotiate positions
 */
export enum VB6NegotiatePosition {
  vbNone = 0, // Not displayed in MDI parent
  vbLeft = 1, // Left position
  vbMiddle = 2, // Middle position
  vbRight = 3, // Right position
}

/**
 * Keyboard shortcuts
 */
export const VB6Shortcuts = {
  // Function keys
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',

  // Ctrl combinations
  CtrlA: 'Ctrl+A',
  CtrlB: 'Ctrl+B',
  CtrlC: 'Ctrl+C',
  CtrlD: 'Ctrl+D',
  CtrlE: 'Ctrl+E',
  CtrlF: 'Ctrl+F',
  CtrlG: 'Ctrl+G',
  CtrlH: 'Ctrl+H',
  CtrlI: 'Ctrl+I',
  CtrlJ: 'Ctrl+J',
  CtrlK: 'Ctrl+K',
  CtrlL: 'Ctrl+L',
  CtrlM: 'Ctrl+M',
  CtrlN: 'Ctrl+N',
  CtrlO: 'Ctrl+O',
  CtrlP: 'Ctrl+P',
  CtrlQ: 'Ctrl+Q',
  CtrlR: 'Ctrl+R',
  CtrlS: 'Ctrl+S',
  CtrlT: 'Ctrl+T',
  CtrlU: 'Ctrl+U',
  CtrlV: 'Ctrl+V',
  CtrlW: 'Ctrl+W',
  CtrlX: 'Ctrl+X',
  CtrlY: 'Ctrl+Y',
  CtrlZ: 'Ctrl+Z',

  // Ctrl+Shift combinations
  CtrlShiftA: 'Ctrl+Shift+A',
  CtrlShiftB: 'Ctrl+Shift+B',
  CtrlShiftC: 'Ctrl+Shift+C',
  CtrlShiftD: 'Ctrl+Shift+D',
  CtrlShiftE: 'Ctrl+Shift+E',
  CtrlShiftF: 'Ctrl+Shift+F',
  CtrlShiftG: 'Ctrl+Shift+G',
  CtrlShiftH: 'Ctrl+Shift+H',
  CtrlShiftI: 'Ctrl+Shift+I',
  CtrlShiftJ: 'Ctrl+Shift+J',
  CtrlShiftK: 'Ctrl+Shift+K',
  CtrlShiftL: 'Ctrl+Shift+L',
  CtrlShiftM: 'Ctrl+Shift+M',
  CtrlShiftN: 'Ctrl+Shift+N',
  CtrlShiftO: 'Ctrl+Shift+O',
  CtrlShiftP: 'Ctrl+Shift+P',
  CtrlShiftS: 'Ctrl+Shift+S',
  CtrlShiftT: 'Ctrl+Shift+T',

  // Alt combinations
  AltF4: 'Alt+F4',
  AltBksp: 'Alt+Backspace',

  // Other combinations
  Delete: 'Delete',
  Insert: 'Insert',
  ShiftDelete: 'Shift+Delete',
  ShiftInsert: 'Shift+Insert',
  CtrlInsert: 'Ctrl+Insert',
};

/**
 * Menu Manager Class
 */
export class VB6MenuManager {
  private menus: Map<string, VB6Menu> = new Map();
  private menuHandlers: Map<string, () => void> = new Map();

  /**
   * Create a menu structure
   */
  createMenu(formName: string, items: VB6MenuItem[]): VB6Menu {
    const menu: VB6Menu = { items };
    this.menus.set(formName, menu);
    return menu;
  }

  /**
   * Get menu for a form
   */
  getMenu(formName: string): VB6Menu | undefined {
    return this.menus.get(formName);
  }

  /**
   * Add menu item
   */
  addMenuItem(formName: string, item: VB6MenuItem, parentPath?: string): void {
    const menu = this.menus.get(formName);
    if (!menu) return;

    if (parentPath) {
      const parent = this.findMenuItem(menu.items, parentPath);
      if (parent && !parent.submenu) {
        parent.submenu = [];
      }
      parent?.submenu?.push(item);
    } else {
      menu.items.push(item);
    }
  }

  /**
   * Remove menu item
   */
  removeMenuItem(formName: string, path: string): void {
    const menu = this.menus.get(formName);
    if (!menu) return;

    const parts = path.split('.');
    if (parts.length === 1) {
      menu.items = menu.items.filter(item => item.name !== path);
    } else {
      const parentPath = parts.slice(0, -1).join('.');
      const parent = this.findMenuItem(menu.items, parentPath);
      if (parent?.submenu) {
        parent.submenu = parent.submenu.filter(item => item.name !== parts[parts.length - 1]);
      }
    }
  }

  /**
   * Find menu item by path (e.g., "File.New")
   */
  findMenuItem(items: VB6MenuItem[], path: string): VB6MenuItem | null {
    const parts = path.split('.');
    let current: VB6MenuItem | undefined;

    for (const part of parts) {
      const searchIn = current?.submenu || items;
      current = searchIn.find(item => item.name === part);
      if (!current) return null;
    }

    return current || null;
  }

  /**
   * Set menu item property
   */
  setMenuProperty(formName: string, path: string, property: keyof VB6MenuItem, value: any): void {
    const menu = this.menus.get(formName);
    if (!menu) return;

    const item = this.findMenuItem(menu.items, path);
    if (item) {
      (item as any)[property] = value;
    }
  }

  /**
   * Get menu item property
   */
  getMenuProperty(formName: string, path: string, property: keyof VB6MenuItem): any {
    const menu = this.menus.get(formName);
    if (!menu) return undefined;

    const item = this.findMenuItem(menu.items, path);
    return item ? (item as any)[property] : undefined;
  }

  /**
   * Register menu click handler
   */
  onMenuClick(menuPath: string, handler: () => void): void {
    this.menuHandlers.set(menuPath, handler);
  }

  /**
   * Trigger menu click
   */
  triggerMenuClick(menuPath: string): void {
    const handler = this.menuHandlers.get(menuPath);
    if (handler) {
      handler();
    }
  }

  /**
   * Parse shortcut string to keyboard event
   */
  parseShortcut(shortcut: string): {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  } | null {
    if (!shortcut) return null;

    const parts = shortcut.split('+');
    return {
      key: parts[parts.length - 1],
      ctrl: parts.includes('Ctrl'),
      shift: parts.includes('Shift'),
      alt: parts.includes('Alt'),
    };
  }

  /**
   * Check if keyboard event matches shortcut
   */
  matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
    const parsed = this.parseShortcut(shortcut);
    if (!parsed) return false;

    return (
      event.key === parsed.key &&
      event.ctrlKey === parsed.ctrl &&
      event.shiftKey === parsed.shift &&
      event.altKey === parsed.alt
    );
  }

  /**
   * Generate menu HTML
   */
  renderMenu(formName: string): string {
    const menu = this.menus.get(formName);
    if (!menu) return '';

    const renderItems = (items: VB6MenuItem[], level: number = 0): string => {
      return items
        .map(item => {
          if (!item.visible) return '';
          if (item.separator) return '<li class="menu-separator"></li>';

          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const checkedMark = item.checked ? '✓ ' : '';
          const disabledClass = !item.enabled ? 'disabled' : '';

          let html = `<li class="menu-item ${disabledClass}" data-name="${item.name}">`;
          html += `<span>${checkedMark}${item.caption}</span>`;

          if (item.shortcut) {
            html += `<span class="menu-shortcut">${item.shortcut}</span>`;
          }

          if (hasSubmenu) {
            html += '<ul class="submenu">';
            html += renderItems(item.submenu!, level + 1);
            html += '</ul>';
          }

          html += '</li>';
          return html;
        })
        .join('');
    };

    return '<ul class="menu">' + renderItems(menu.items) + '</ul>';
  }
}

/**
 * Global menu manager instance
 */
export const globalMenuManager = new VB6MenuManager();

/**
 * Helper functions for VB6 compatibility
 */

/**
 * Create a standard File menu
 */
export function createFileMenu(): VB6MenuItem {
  return {
    name: 'mnuFile',
    caption: '&File',
    checked: false,
    enabled: true,
    visible: true,
    shortcut: '',
    windowList: false,
    negotiatePosition: VB6NegotiatePosition.vbLeft,
    submenu: [
      {
        name: 'mnuFileNew',
        caption: '&New',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlN,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuFileOpen',
        caption: '&Open...',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlO,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuFileSep1',
        caption: '-',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
        separator: true,
      },
      {
        name: 'mnuFileSave',
        caption: '&Save',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlS,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuFileSaveAs',
        caption: 'Save &As...',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuFileSep2',
        caption: '-',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
        separator: true,
      },
      {
        name: 'mnuFilePrint',
        caption: '&Print...',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlP,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuFileSep3',
        caption: '-',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
        separator: true,
      },
      {
        name: 'mnuFileExit',
        caption: 'E&xit',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.AltF4,
        windowList: false,
        negotiatePosition: 0,
      },
    ],
  };
}

/**
 * Create a standard Edit menu
 */
export function createEditMenu(): VB6MenuItem {
  return {
    name: 'mnuEdit',
    caption: '&Edit',
    checked: false,
    enabled: true,
    visible: true,
    shortcut: '',
    windowList: false,
    negotiatePosition: VB6NegotiatePosition.vbLeft,
    submenu: [
      {
        name: 'mnuEditUndo',
        caption: '&Undo',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlZ,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuEditSep1',
        caption: '-',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
        separator: true,
      },
      {
        name: 'mnuEditCut',
        caption: 'Cu&t',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlX,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuEditCopy',
        caption: '&Copy',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlC,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuEditPaste',
        caption: '&Paste',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlV,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuEditDelete',
        caption: '&Delete',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.Delete,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuEditSep2',
        caption: '-',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
        separator: true,
      },
      {
        name: 'mnuEditSelectAll',
        caption: 'Select &All',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.CtrlA,
        windowList: false,
        negotiatePosition: 0,
      },
    ],
  };
}

/**
 * Create a standard Help menu
 */
export function createHelpMenu(): VB6MenuItem {
  return {
    name: 'mnuHelp',
    caption: '&Help',
    checked: false,
    enabled: true,
    visible: true,
    shortcut: '',
    windowList: false,
    negotiatePosition: VB6NegotiatePosition.vbRight,
    submenu: [
      {
        name: 'mnuHelpContents',
        caption: '&Contents',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: VB6Shortcuts.F1,
        windowList: false,
        negotiatePosition: 0,
      },
      {
        name: 'mnuHelpSep1',
        caption: '-',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
        separator: true,
      },
      {
        name: 'mnuHelpAbout',
        caption: '&About...',
        checked: false,
        enabled: true,
        visible: true,
        shortcut: '',
        windowList: false,
        negotiatePosition: 0,
      },
    ],
  };
}

export default {
  VB6MenuManager,
  globalMenuManager,
  VB6Shortcuts,
  VB6NegotiatePosition,
  createFileMenu,
  createEditMenu,
  createHelpMenu,
};
