/**
 * VB6 Menu Editor Component
 * Visual editor for creating VB6-style menus
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface VB6MenuItem {
  id: string;
  caption: string;
  name: string;
  index?: number;
  shortcut?: string;
  checked?: boolean;
  enabled?: boolean;
  visible?: boolean;
  windowList?: boolean;
  helpContextId?: number;
  negotiatePosition?: number;
  children?: VB6MenuItem[];
  level: number;
}

export interface VB6MenuEditorProps {
  menus: VB6MenuItem[];
  onChange: (menus: VB6MenuItem[]) => void;
  onClose: () => void;
}

// ============================================================================
// Shortcut Options
// ============================================================================

const SHORTCUT_OPTIONS = [
  '(None)',
  'Ctrl+A',
  'Ctrl+B',
  'Ctrl+C',
  'Ctrl+D',
  'Ctrl+E',
  'Ctrl+F',
  'Ctrl+G',
  'Ctrl+H',
  'Ctrl+I',
  'Ctrl+J',
  'Ctrl+K',
  'Ctrl+L',
  'Ctrl+M',
  'Ctrl+N',
  'Ctrl+O',
  'Ctrl+P',
  'Ctrl+Q',
  'Ctrl+R',
  'Ctrl+S',
  'Ctrl+T',
  'Ctrl+U',
  'Ctrl+V',
  'Ctrl+W',
  'Ctrl+X',
  'Ctrl+Y',
  'Ctrl+Z',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'Ctrl+F1',
  'Ctrl+F2',
  'Ctrl+F3',
  'Ctrl+F4',
  'Ctrl+F5',
  'Ctrl+F6',
  'Ctrl+F7',
  'Ctrl+F8',
  'Ctrl+F9',
  'Ctrl+F10',
  'Ctrl+F11',
  'Ctrl+F12',
  'Shift+F1',
  'Shift+F2',
  'Shift+F3',
  'Shift+F4',
  'Shift+F5',
  'Shift+F6',
  'Shift+F7',
  'Shift+F8',
  'Shift+F9',
  'Shift+F10',
  'Shift+F11',
  'Shift+F12',
  'Ctrl+Shift+F1',
  'Ctrl+Shift+F2',
  'Ctrl+Shift+F3',
  'Ctrl+Shift+F4',
  'Ctrl+Shift+F5',
  'Ctrl+Shift+F6',
  'Ctrl+Shift+F7',
  'Ctrl+Shift+F8',
  'Ctrl+Shift+F9',
  'Ctrl+Shift+F10',
  'Ctrl+Shift+F11',
  'Ctrl+Shift+F12',
  'Ctrl+Ins',
  'Shift+Ins',
  'Del',
  'Shift+Del',
  'Alt+Bksp'
];

// ============================================================================
// VB6 Menu Editor Component
// ============================================================================

export const VB6MenuEditor: React.FC<VB6MenuEditorProps> = ({
  menus,
  onChange,
  onClose
}) => {
  const [menuItems, setMenuItems] = useState<VB6MenuItem[]>(menus);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<VB6MenuItem | null>(null);
  const nextIdRef = useRef(1);

  // Flatten menus for list display
  const flattenMenus = useCallback((items: VB6MenuItem[]): VB6MenuItem[] => {
    const result: VB6MenuItem[] = [];
    const flatten = (list: VB6MenuItem[], level: number) => {
      for (const item of list) {
        result.push({ ...item, level });
        if (item.children) {
          flatten(item.children, level + 1);
        }
      }
    };
    flatten(items, 0);
    return result;
  }, []);

  const flatMenus = flattenMenus(menuItems);

  // Find and update item in tree
  const updateItemInTree = useCallback(
    (
      items: VB6MenuItem[],
      id: string,
      updater: (item: VB6MenuItem) => VB6MenuItem | null
    ): VB6MenuItem[] => {
      const result: VB6MenuItem[] = [];
      for (const item of items) {
        if (item.id === id) {
          const updated = updater(item);
          if (updated) result.push(updated);
        } else {
          const newItem = { ...item };
          if (item.children) {
            newItem.children = updateItemInTree(item.children, id, updater);
          }
          result.push(newItem);
        }
      }
      return result;
    },
    []
  );

  // Create new menu item
  const createMenuItem = useCallback((): VB6MenuItem => {
    const id = `menu-${nextIdRef.current++}`;
    return {
      id,
      caption: '',
      name: '',
      enabled: true,
      visible: true,
      checked: false,
      level: 0
    };
  }, []);

  // Insert new item
  const handleInsert = useCallback(() => {
    const newItem = createMenuItem();
    if (selectedId) {
      // Insert after selected
      const index = flatMenus.findIndex(m => m.id === selectedId);
      if (index !== -1) {
        const selectedItem = flatMenus[index];
        newItem.level = selectedItem.level;

        // Find parent and insert
        if (selectedItem.level === 0) {
          const parentIndex = menuItems.findIndex(m => m.id === selectedId);
          const newMenus = [...menuItems];
          newMenus.splice(parentIndex + 1, 0, newItem);
          setMenuItems(newMenus);
        } else {
          // Handle nested insertion - for simplicity, add at end
          setMenuItems([...menuItems, { ...newItem, level: 0 }]);
        }
      }
    } else {
      setMenuItems([...menuItems, newItem]);
    }
    setSelectedId(newItem.id);
    setEditingItem(newItem);
  }, [selectedId, flatMenus, menuItems, createMenuItem]);

  // Delete item
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const newMenus = updateItemInTree(menuItems, selectedId, () => null);
    setMenuItems(newMenus);
    setSelectedId(null);
    setEditingItem(null);
  }, [selectedId, menuItems, updateItemInTree]);

  // Move item up
  const handleMoveUp = useCallback(() => {
    if (!selectedId) return;
    const index = flatMenus.findIndex(m => m.id === selectedId);
    if (index <= 0) return;

    // Simple swap for top-level items
    const topLevelIndex = menuItems.findIndex(m => m.id === selectedId);
    if (topLevelIndex > 0) {
      const newMenus = [...menuItems];
      [newMenus[topLevelIndex - 1], newMenus[topLevelIndex]] = [
        newMenus[topLevelIndex],
        newMenus[topLevelIndex - 1]
      ];
      setMenuItems(newMenus);
    }
  }, [selectedId, flatMenus, menuItems]);

  // Move item down
  const handleMoveDown = useCallback(() => {
    if (!selectedId) return;
    const topLevelIndex = menuItems.findIndex(m => m.id === selectedId);
    if (topLevelIndex >= 0 && topLevelIndex < menuItems.length - 1) {
      const newMenus = [...menuItems];
      [newMenus[topLevelIndex], newMenus[topLevelIndex + 1]] = [
        newMenus[topLevelIndex + 1],
        newMenus[topLevelIndex]
      ];
      setMenuItems(newMenus);
    }
  }, [selectedId, menuItems]);

  // Indent item (make it child of previous)
  const handleIndent = useCallback(() => {
    if (!selectedId) return;
    const index = menuItems.findIndex(m => m.id === selectedId);
    if (index <= 0) return;

    const item = menuItems[index];
    const parent = menuItems[index - 1];

    const newMenus = menuItems.filter(m => m.id !== selectedId);
    const parentIndex = newMenus.findIndex(m => m.id === parent.id);

    if (!newMenus[parentIndex].children) {
      newMenus[parentIndex].children = [];
    }
    newMenus[parentIndex].children!.push({ ...item, level: item.level + 1 });

    setMenuItems(newMenus);
  }, [selectedId, menuItems]);

  // Outdent item (move to parent level)
  const handleOutdent = useCallback(() => {
    // Find item in children and move up
    if (!selectedId) return;

    const findAndOutdent = (
      items: VB6MenuItem[],
      parentList: VB6MenuItem[] | null = null
    ): VB6MenuItem[] => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.children) {
          const childIndex = item.children.findIndex(c => c.id === selectedId);
          if (childIndex !== -1) {
            const child = item.children[childIndex];
            const newChildren = item.children.filter(c => c.id !== selectedId);
            items[i] = { ...item, children: newChildren.length > 0 ? newChildren : undefined };

            // Add child after parent
            const parentIndex = items.findIndex(m => m.id === item.id);
            items.splice(parentIndex + 1, 0, { ...child, level: child.level - 1 });
            return items;
          }
          items[i] = { ...item, children: findAndOutdent(item.children, items) };
        }
      }
      return items;
    };

    setMenuItems(findAndOutdent([...menuItems]));
  }, [selectedId, menuItems]);

  // Handle property change
  const handlePropertyChange = useCallback(
    (property: keyof VB6MenuItem, value: any) => {
      if (!editingItem) return;

      const updated = { ...editingItem, [property]: value };
      setEditingItem(updated);

      setMenuItems(prev => updateItemInTree(prev, editingItem.id, () => updated));
    },
    [editingItem, updateItemInTree]
  );

  // Select item
  const handleSelectItem = useCallback((item: VB6MenuItem) => {
    setSelectedId(item.id);
    setEditingItem(item);
  }, []);

  // Handle OK
  const handleOK = useCallback(() => {
    onChange(menuItems);
    onClose();
  }, [menuItems, onChange, onClose]);

  // Handle Cancel
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Styles
  const buttonStyle: React.CSSProperties = {
    padding: '4px 12px',
    backgroundColor: '#c0c0c0',
    border: '2px outset #ffffff',
    cursor: 'pointer',
    fontFamily: 'MS Sans Serif',
    fontSize: '11px',
    minWidth: '75px'
  };

  const inputStyle: React.CSSProperties = {
    padding: '2px 4px',
    border: '2px inset #808080',
    fontFamily: 'MS Sans Serif',
    fontSize: '11px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'MS Sans Serif',
    fontSize: '11px',
    marginBottom: '2px'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        backgroundColor: '#c0c0c0',
        border: '2px outset #ffffff',
        fontFamily: 'MS Sans Serif',
        fontSize: '11px',
        zIndex: 10000
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          backgroundColor: '#000080',
          color: 'white',
          padding: '2px 4px',
          fontWeight: 'bold'
        }}
      >
        Menu Editor
      </div>

      {/* Content */}
      <div style={{ padding: '8px' }}>
        {/* Caption & Name Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>&Caption:</div>
            <input
              type="text"
              style={inputStyle}
              value={editingItem?.caption || ''}
              onChange={e => handlePropertyChange('caption', e.target.value)}
              placeholder="&File"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>&Name:</div>
            <input
              type="text"
              style={inputStyle}
              value={editingItem?.name || ''}
              onChange={e => handlePropertyChange('name', e.target.value)}
              placeholder="mnuFile"
            />
          </div>
        </div>

        {/* Index & Shortcut Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '80px' }}>
            <div style={labelStyle}>&Index:</div>
            <input
              type="text"
              style={inputStyle}
              value={editingItem?.index ?? ''}
              onChange={e =>
                handlePropertyChange(
                  'index',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>&Shortcut:</div>
            <select
              style={{ ...inputStyle, height: '22px' }}
              value={editingItem?.shortcut || '(None)'}
              onChange={e =>
                handlePropertyChange(
                  'shortcut',
                  e.target.value === '(None)' ? undefined : e.target.value
                )
              }
            >
              {SHORTCUT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: '100px' }}>
            <div style={labelStyle}>HelpContextID:</div>
            <input
              type="text"
              style={inputStyle}
              value={editingItem?.helpContextId ?? '0'}
              onChange={e =>
                handlePropertyChange('helpContextId', parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* Checkboxes Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={editingItem?.checked || false}
              onChange={e => handlePropertyChange('checked', e.target.checked)}
            />
            C&hecked
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={editingItem?.enabled !== false}
              onChange={e => handlePropertyChange('enabled', e.target.checked)}
            />
            &Enabled
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={editingItem?.visible !== false}
              onChange={e => handlePropertyChange('visible', e.target.checked)}
            />
            &Visible
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={editingItem?.windowList || false}
              onChange={e => handlePropertyChange('windowList', e.target.checked)}
            />
            &WindowList
          </label>
        </div>

        {/* Arrow Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
          <button style={buttonStyle} onClick={handleMoveUp}>
            ↑
          </button>
          <button style={buttonStyle} onClick={handleMoveDown}>
            ↓
          </button>
          <button style={buttonStyle} onClick={handleIndent}>
            →
          </button>
          <button style={buttonStyle} onClick={handleOutdent}>
            ←
          </button>
        </div>

        {/* Menu List */}
        <div
          style={{
            border: '2px inset #808080',
            height: '150px',
            overflow: 'auto',
            backgroundColor: 'white',
            marginBottom: '8px'
          }}
        >
          {flatMenus.map(item => (
            <div
              key={item.id}
              style={{
                padding: '2px 4px',
                paddingLeft: `${8 + item.level * 20}px`,
                backgroundColor: selectedId === item.id ? '#000080' : 'transparent',
                color: selectedId === item.id ? 'white' : 'black',
                cursor: 'pointer'
              }}
              onClick={() => handleSelectItem(item)}
            >
              {item.level > 0 && '...'}
              {item.caption || '(untitled)'}
              {item.shortcut && ` (${item.shortcut})`}
            </div>
          ))}
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button style={buttonStyle} onClick={handleInsert}>
            &Next
          </button>
          <button style={buttonStyle} onClick={handleInsert}>
            &Insert
          </button>
          <button style={buttonStyle} onClick={handleDelete}>
            &Delete
          </button>
        </div>

        {/* OK/Cancel Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
          <button style={buttonStyle} onClick={handleOK}>
            OK
          </button>
          <button style={buttonStyle} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Menu Bar Renderer
// ============================================================================

interface VB6MenuBarProps {
  menus: VB6MenuItem[];
  onMenuClick?: (item: VB6MenuItem) => void;
}

export const VB6MenuBar: React.FC<VB6MenuBarProps> = ({ menus, onMenuClick }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleMenuClick = useCallback((item: VB6MenuItem) => {
    if (item.children && item.children.length > 0) {
      setOpenMenu(prev => (prev === item.id ? null : item.id));
    } else {
      onMenuClick?.(item);
      setOpenMenu(null);
    }
  }, [onMenuClick]);

  const handleItemClick = useCallback(
    (item: VB6MenuItem) => {
      if (item.children && item.children.length > 0) {
        setOpenSubmenu(prev => (prev === item.id ? null : item.id));
      } else {
        onMenuClick?.(item);
        setOpenMenu(null);
        setOpenSubmenu(null);
      }
    },
    [onMenuClick]
  );

  const renderCaption = (caption: string) => {
    const ampIndex = caption.indexOf('&');
    if (ampIndex === -1) return caption;
    return (
      <>
        {caption.slice(0, ampIndex)}
        <u>{caption.charAt(ampIndex + 1)}</u>
        {caption.slice(ampIndex + 2)}
      </>
    );
  };

  const renderMenuItem = (item: VB6MenuItem) => {
    if (!item.visible) return null;
    if (item.caption === '-') {
      return <div key={item.id} style={{ borderTop: '1px solid #808080', margin: '2px 0' }} />;
    }

    return (
      <div
        key={item.id}
        style={{
          padding: '4px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: openSubmenu === item.id ? '#000080' : 'transparent',
          color: openSubmenu === item.id ? 'white' : item.enabled === false ? '#808080' : 'black',
          cursor: item.enabled === false ? 'default' : 'pointer',
          position: 'relative'
        }}
        onClick={() => item.enabled !== false && handleItemClick(item)}
      >
        <span>
          {item.checked && '✓ '}
          {renderCaption(item.caption)}
        </span>
        <span style={{ marginLeft: '20px', fontSize: '10px' }}>
          {item.shortcut || ''}
          {item.children && item.children.length > 0 && ' ►'}
        </span>
        {openSubmenu === item.id && item.children && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              backgroundColor: '#c0c0c0',
              border: '2px outset #ffffff',
              minWidth: '150px',
              zIndex: 1001
            }}
          >
            {item.children.map(child => renderMenuItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: '#c0c0c0',
        fontFamily: 'MS Sans Serif',
        fontSize: '11px'
      }}
    >
      {menus
        .filter(m => m.visible !== false)
        .map(menu => (
          <div key={menu.id} style={{ position: 'relative' }}>
            <div
              style={{
                padding: '2px 8px',
                backgroundColor: openMenu === menu.id ? '#000080' : 'transparent',
                color: openMenu === menu.id ? 'white' : 'black',
                cursor: 'pointer'
              }}
              onClick={() => handleMenuClick(menu)}
            >
              {renderCaption(menu.caption)}
            </div>
            {openMenu === menu.id && menu.children && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: '#c0c0c0',
                  border: '2px outset #ffffff',
                  minWidth: '150px',
                  zIndex: 1000
                }}
              >
                {menu.children.map(item => renderMenuItem(item))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default {
  VB6MenuEditor,
  VB6MenuBar
};
