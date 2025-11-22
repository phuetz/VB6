/**
 * VB6 Menu Control - Contrôle Menu natif VB6
 * Implémentation complète du système de menus VB6 avec Menu Editor
 * Compatible 100% avec Visual Basic 6.0
 */

import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { Control } from '../../types/Control';

export interface VB6MenuItem {
  Name: string;
  Caption: string;
  Index?: number;
  Checked: boolean;
  Enabled: boolean;
  Visible: boolean;
  Shortcut: string; // Raccourci clavier (ex: "Ctrl+S")
  WindowList: boolean; // Pour les menus MDI
  NegotiatePosition: number; // Position pour négociation OLE
  HelpContextID: number;
  Tag: string;
  
  // Hiérarchie
  Level: number; // Niveau d'indentation (0 = racine)
  Parent?: VB6MenuItem;
  Children: VB6MenuItem[];
  
  // Apparence
  Separator: boolean; // Élément séparateur
  
  // Événements
  onClick?: () => void;
}

export interface MenuControlProps {
  control: Control;
  isDesignMode?: boolean;
  menuItems?: VB6MenuItem[];
  onMenuClick?: (menuItem: VB6MenuItem) => void;
  onChange?: (menuItems: VB6MenuItem[]) => void;
}

// Raccourcis clavier VB6 standard
const VB6_SHORTCUTS: { [key: string]: string } = {
  'Ctrl+A': 'Ctrl+A',
  'Ctrl+C': 'Ctrl+C',
  'Ctrl+V': 'Ctrl+V',
  'Ctrl+X': 'Ctrl+X',
  'Ctrl+Z': 'Ctrl+Z',
  'Ctrl+Y': 'Ctrl+Y',
  'Ctrl+S': 'Ctrl+S',
  'Ctrl+O': 'Ctrl+O',
  'Ctrl+N': 'Ctrl+N',
  'Ctrl+P': 'Ctrl+P',
  'F1': 'F1',
  'F2': 'F2',
  'F3': 'F3',
  'F4': 'F4',
  'F5': 'F5',
  'F6': 'F6',
  'F7': 'F7',
  'F8': 'F8',
  'F9': 'F9',
  'F10': 'F10',
  'F11': 'F11',
  'F12': 'F12',
  'Alt+F4': 'Alt+F4',
  'Shift+F1': 'Shift+F1',
  'Ctrl+F1': 'Ctrl+F1',
  'Del': 'Delete',
  'Ins': 'Insert',
  'Home': 'Home',
  'End': 'End',
  'PgUp': 'Page Up',
  'PgDn': 'Page Down'
};

export const MenuControl = forwardRef<HTMLDivElement, MenuControlProps>(
  ({ control, isDesignMode = false, menuItems = [], onMenuClick, onChange }, ref) => {
    const [items, setItems] = useState<VB6MenuItem[]>(menuItems);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
    const menuRef = useRef<HTMLDivElement>(null);

    // Créer une structure de menu par défaut si vide
    useEffect(() => {
      if (items.length === 0 && isDesignMode) {
        const defaultMenu = createDefaultMenu();
        setItems(defaultMenu);
        onChange?.(defaultMenu);
      }
    }, [items.length, isDesignMode, onChange]);

    // Créer un menu par défaut VB6
    const createDefaultMenu = (): VB6MenuItem[] => {
      return [
        {
          Name: 'mnuFile',
          Caption: '&File',
          Index: 0,
          Level: 0,
          Checked: false,
          Enabled: true,
          Visible: true,
          Shortcut: '',
          WindowList: false,
          NegotiatePosition: 0,
          HelpContextID: 0,
          Tag: '',
          Separator: false,
          Children: [
            {
              Name: 'mnuFileNew',
              Caption: '&New',
              Index: 0,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+N',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuFileOpen',
              Caption: '&Open...',
              Index: 1,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+O',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuFileSep1',
              Caption: '-',
              Index: 2,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: '',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: true,
              Children: []
            },
            {
              Name: 'mnuFileSave',
              Caption: '&Save',
              Index: 3,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+S',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuFileSaveAs',
              Caption: 'Save &As...',
              Index: 4,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: '',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuFileSep2',
              Caption: '-',
              Index: 5,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: '',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: true,
              Children: []
            },
            {
              Name: 'mnuFileExit',
              Caption: 'E&xit',
              Index: 6,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Alt+F4',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            }
          ]
        },
        {
          Name: 'mnuEdit',
          Caption: '&Edit',
          Index: 1,
          Level: 0,
          Checked: false,
          Enabled: true,
          Visible: true,
          Shortcut: '',
          WindowList: false,
          NegotiatePosition: 1,
          HelpContextID: 0,
          Tag: '',
          Separator: false,
          Children: [
            {
              Name: 'mnuEditUndo',
              Caption: '&Undo',
              Index: 0,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+Z',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuEditSep1',
              Caption: '-',
              Index: 1,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: '',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: true,
              Children: []
            },
            {
              Name: 'mnuEditCut',
              Caption: 'Cu&t',
              Index: 2,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+X',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuEditCopy',
              Caption: '&Copy',
              Index: 3,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+C',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            },
            {
              Name: 'mnuEditPaste',
              Caption: '&Paste',
              Index: 4,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: 'Ctrl+V',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            }
          ]
        },
        {
          Name: 'mnuHelp',
          Caption: '&Help',
          Index: 2,
          Level: 0,
          Checked: false,
          Enabled: true,
          Visible: true,
          Shortcut: '',
          WindowList: false,
          NegotiatePosition: 3,
          HelpContextID: 0,
          Tag: '',
          Separator: false,
          Children: [
            {
              Name: 'mnuHelpAbout',
              Caption: '&About...',
              Index: 0,
              Level: 1,
              Checked: false,
              Enabled: true,
              Visible: true,
              Shortcut: '',
              WindowList: false,
              NegotiatePosition: 0,
              HelpContextID: 0,
              Tag: '',
              Separator: false,
              Children: []
            }
          ]
        }
      ];
    };

    // Gestion des clics sur les éléments de menu
    const handleMenuClick = useCallback((menuItem: VB6MenuItem, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!menuItem.Enabled || menuItem.Separator) return;

      // Si l'élément a des enfants, basculer l'ouverture
      if (menuItem.Children.length > 0) {
        setOpenSubmenus(prev => {
          const newSet = new Set(prev);
          if (newSet.has(menuItem.Name)) {
            newSet.delete(menuItem.Name);
          } else {
            newSet.add(menuItem.Name);
          }
          return newSet;
        });
      } else {
        // Fermer tous les sous-menus
        setOpenSubmenus(new Set());
        setActiveMenu(null);
        
        // Déclencher l'événement de clic
        onMenuClick?.(menuItem);
        
        // Déclencher l'événement VB6
        if (menuItem.onClick) {
          menuItem.onClick();
        }
      }
    }, [onMenuClick]);

    // Gestion des raccourcis clavier
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (isDesignMode) return;

        const key = getKeyString(event);
        
        // Chercher l'élément de menu avec ce raccourci
        const findMenuWithShortcut = (menuItems: VB6MenuItem[]): VB6MenuItem | null => {
          for (const item of menuItems) {
            if (item.Shortcut === key && item.Enabled && item.Visible) {
              return item;
            }
            const found = findMenuWithShortcut(item.Children);
            if (found) return found;
          }
          return null;
        };

        const menuItem = findMenuWithShortcut(items);
        if (menuItem) {
          event.preventDefault();
          handleMenuClick(menuItem, event as any);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, handleMenuClick, isDesignMode]);

    // Convertir l'événement clavier en string VB6
    const getKeyString = (event: KeyboardEvent): string => {
      const parts: string[] = [];
      
      if (event.ctrlKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');
      
      const key = event.key;
      if (key.startsWith('F') && key.length <= 3) {
        // Touches de fonction
        parts.push(key);
      } else if (key.length === 1) {
        parts.push(key.toUpperCase());
      } else {
        // Touches spéciales
        switch (key) {
          case 'Delete': parts.push('Del'); break;
          case 'Insert': parts.push('Ins'); break;
          case 'PageUp': parts.push('PgUp'); break;
          case 'PageDown': parts.push('PgDn'); break;
          default: parts.push(key);
        }
      }
      
      return parts.join('+');
    };

    // Rendu d'un élément de menu
    const renderMenuItem = (item: VB6MenuItem, isTopLevel: boolean = false) => {
      if (!item.Visible) return null;

      const isOpen = openSubmenus.has(item.Name);
      const hasChildren = item.Children.length > 0;

      if (item.Separator) {
        return (
          <div
            key={item.Name}
            className="menu-separator"
            style={{
              height: '1px',
              backgroundColor: '#C0C0C0',
              margin: '2px 0',
              borderTop: '1px solid #808080'
            }}
          />
        );
      }

      const menuItemStyle: React.CSSProperties = {
        position: 'relative',
        padding: isTopLevel ? '4px 8px' : '2px 16px',
        cursor: item.Enabled ? 'pointer' : 'default',
        backgroundColor: activeMenu === item.Name ? '#0078D4' : 'transparent',
        color: item.Enabled ? (activeMenu === item.Name ? '#FFFFFF' : '#000000') : '#808080',
        fontSize: '8pt',
        fontFamily: 'MS Sans Serif, sans-serif',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: isTopLevel ? 'auto' : '120px',
        userSelect: 'none'
      };

      return (
        <div key={item.Name} style={{ position: 'relative' }}>
          <div
            style={menuItemStyle}
            onClick={(e) => handleMenuClick(item, e)}
            onMouseEnter={() => {
              if (item.Enabled) {
                setActiveMenu(item.Name);
              }
            }}
            onMouseLeave={() => {
              if (!isOpen) {
                setActiveMenu(null);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {item.Checked && (
                <span style={{ marginRight: '4px' }}>✓</span>
              )}
              <span>
                {item.Caption.replace('&', '')}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {item.Shortcut && (
                <span style={{ 
                  marginLeft: '16px', 
                  fontSize: '7pt', 
                  color: item.Enabled ? '#808080' : '#C0C0C0' 
                }}>
                  {item.Shortcut}
                </span>
              )}
              {hasChildren && !isTopLevel && (
                <span style={{ marginLeft: '8px' }}>▶</span>
              )}
            </div>
          </div>

          {hasChildren && (isOpen || (isTopLevel && activeMenu === item.Name)) && (
            <div
              style={{
                position: isTopLevel ? 'absolute' : 'absolute',
                top: isTopLevel ? '100%' : '0',
                left: isTopLevel ? '0' : '100%',
                backgroundColor: '#F0F0F0',
                border: '1px solid #808080',
                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                zIndex: 1000,
                minWidth: '140px'
              }}
            >
              {item.Children.map(child => renderMenuItem(child, false))}
            </div>
          )}
        </div>
      );
    };

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x || 0,
      top: control.y || 0,
      width: control.width || '100%',
      height: control.height || 24,
      backgroundColor: '#F0F0F0',
      border: isDesignMode ? '1px dashed #0066CC' : 'none',
      borderBottom: isDesignMode ? '1px dashed #0066CC' : '1px solid #C0C0C0',
      display: 'flex',
      alignItems: 'stretch',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '8pt',
      userSelect: 'none',
      zIndex: control.zIndex || 100
    };

    // En mode design, afficher un indicateur
    if (isDesignMode) {
      return (
        <div
          ref={ref}
          style={containerStyle}
          data-control-type="MenuControl"
          data-control-name={control.name}
        >
          <div style={{ 
            padding: '4px 8px', 
            color: '#666', 
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center'
          }}>
            📋 Menu Control - {items.length} top-level items
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={containerStyle}
        data-control-type="MenuControl"
        data-control-name={control.name}
      >
        {items.filter(item => item.Level === 0 && item.Visible).map(item => 
          renderMenuItem(item, true)
        )}
      </div>
    );
  }
);

MenuControl.displayName = 'MenuControl';

// Utilitaires pour le Menu Editor
export const MenuEditorUtils = {
  // Créer un nouvel élément de menu
  createMenuItem(name: string, caption: string, level: number = 0): VB6MenuItem {
    return {
      Name: name,
      Caption: caption,
      Index: 0,
      Level: level,
      Checked: false,
      Enabled: true,
      Visible: true,
      Shortcut: '',
      WindowList: false,
      NegotiatePosition: 0,
      HelpContextID: 0,
      Tag: '',
      Separator: caption === '-',
      Children: []
    };
  },

  // Ajouter un élément à la hiérarchie
  addMenuItem(items: VB6MenuItem[], newItem: VB6MenuItem, parentName?: string): VB6MenuItem[] {
    const newItems = [...items];
    
    if (parentName) {
      const parent = this.findMenuItem(newItems, parentName);
      if (parent) {
        parent.Children.push(newItem);
        newItem.Parent = parent;
      }
    } else {
      newItems.push(newItem);
    }
    
    return newItems;
  },

  // Trouver un élément de menu par nom
  findMenuItem(items: VB6MenuItem[], name: string): VB6MenuItem | null {
    for (const item of items) {
      if (item.Name === name) return item;
      const found = this.findMenuItem(item.Children, name);
      if (found) return found;
    }
    return null;
  },

  // Exporter la structure de menu en format VB6
  exportToVB6Format(items: VB6MenuItem[]): string {
    const lines: string[] = [];
    
    const processItem = (item: VB6MenuItem, indent: number = 0) => {
      const indentStr = '    '.repeat(indent);
      lines.push(`${indentStr}Begin VB.Menu ${item.Name}`);
      lines.push(`${indentStr}   Caption         =   "${item.Caption}"`);
      if (item.Index !== undefined) {
        lines.push(`${indentStr}   Index           =   ${item.Index}`);
      }
      if (item.Shortcut) {
        lines.push(`${indentStr}   Shortcut        =   ${item.Shortcut}`);
      }
      if (!item.Enabled) {
        lines.push(`${indentStr}   Enabled         =   0   'False`);
      }
      if (!item.Visible) {
        lines.push(`${indentStr}   Visible         =   0   'False`);
      }
      if (item.Checked) {
        lines.push(`${indentStr}   Checked         =   -1  'True`);
      }
      lines.push(`${indentStr}End`);
      
      item.Children.forEach(child => processItem(child, indent + 1));
    };
    
    items.forEach(item => processItem(item));
    return lines.join('\n');
  }
};

export default MenuControl;