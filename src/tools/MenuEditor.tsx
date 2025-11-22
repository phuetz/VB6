import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Menu Item Types
export enum MenuItemType {
  MenuItem = 'MENUITEM',
  Popup = 'POPUP',
  Separator = 'SEPARATOR'
}

export enum MenuFlags {
  Checked = 'CHECKED',
  Disabled = 'GRAYED',
  Default = 'DEFAULT',
  MenuBreak = 'MENUBREAK',
  MenuBarBreak = 'MENUBARBREAK',
  Help = 'HELP'
}

export enum AcceleratorKey {
  None = '',
  F1 = 'F1', F2 = 'F2', F3 = 'F3', F4 = 'F4', F5 = 'F5', F6 = 'F6',
  F7 = 'F7', F8 = 'F8', F9 = 'F9', F10 = 'F10', F11 = 'F11', F12 = 'F12',
  Ins = 'INS', Del = 'DEL', Home = 'HOME', End = 'END',
  PgUp = 'PGUP', PgDn = 'PGDN', Up = 'UP', Down = 'DOWN',
  Left = 'LEFT', Right = 'RIGHT', Tab = 'TAB', Space = 'SPACE',
  Enter = 'RETURN', Esc = 'ESCAPE', Back = 'BACK'
}

export enum AcceleratorModifier {
  None = 0,
  Shift = 1,
  Ctrl = 2,
  Alt = 4,
  ShiftCtrl = 3,
  ShiftAlt = 5,
  CtrlAlt = 6,
  ShiftCtrlAlt = 7
}

// Menu Item Definition
export interface MenuItem {
  id: string;
  name: string;
  text: string;
  type: MenuItemType;
  flags: MenuFlags[];
  accelerator?: {
    key: AcceleratorKey | string;
    modifiers: AcceleratorModifier;
  };
  icon?: string;
  helpId?: number;
  shortcut?: string;
  enabled: boolean;
  visible: boolean;
  checked: boolean;
  children: MenuItem[];
  parent?: MenuItem;
  level: number;
  expanded: boolean;
}

// Menu Resource
export interface MenuResource {
  id: string;
  name: string;
  items: MenuItem[];
  description: string;
  created: Date;
  modified: Date;
}

// Menu Editor Props
interface MenuEditorProps {
  menus?: MenuResource[];
  onMenuChange?: (menus: MenuResource[]) => void;
  onSave?: (menu: MenuResource) => void;
  onExport?: (menu: MenuResource, format: 'RC' | 'VB6') => void;
}

export const MenuEditor: React.FC<MenuEditorProps> = ({
  menus: initialMenus = [],
  onMenuChange,
  onSave,
  onExport
}) => {
  const [menus, setMenus] = useState<MenuResource[]>(initialMenus);
  const [selectedMenu, setSelectedMenu] = useState<MenuResource | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  
  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `menu_item_${nextId.current++}`, []);

  // Create new menu item
  const createMenuItem = useCallback((
    text: string = 'New Item',
    type: MenuItemType = MenuItemType.MenuItem,
    parent?: MenuItem
  ): MenuItem => ({
    id: generateId(),
    name: text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'menuitem',
    text,
    type,
    flags: [],
    enabled: true,
    visible: true,
    checked: false,
    children: [],
    parent,
    level: parent ? parent.level + 1 : 0,
    expanded: false
  }), [generateId]);

  // Create new menu resource
  const createMenuResource = useCallback((name: string): MenuResource => ({
    id: generateId(),
    name,
    items: [],
    description: `Menu resource: ${name}`,
    created: new Date(),
    modified: new Date()
  }), [generateId]);

  // Add new menu
  const addMenu = useCallback(() => {
    if (!newMenuName.trim()) return;
    
    const newMenu = createMenuResource(newMenuName.trim());
    setMenus(prev => [...prev, newMenu]);
    setSelectedMenu(newMenu);
    setNewMenuName('');
    setShowMenuDialog(false);
    setIsDirty(true);
    onMenuChange?.([...menus, newMenu]);
  }, [newMenuName, menus, createMenuResource, onMenuChange]);

  // Delete menu
  const deleteMenu = useCallback((menuId: string) => {
    setMenus(prev => prev.filter(m => m.id !== menuId));
    if (selectedMenu?.id === menuId) {
      setSelectedMenu(null);
      setSelectedItem(null);
    }
    setIsDirty(true);
  }, [selectedMenu]);

  // Add menu item
  const addMenuItem = useCallback((
    parent?: MenuItem,
    type: MenuItemType = MenuItemType.MenuItem
  ) => {
    if (!selectedMenu) return;

    const text = type === MenuItemType.Separator ? '-' : 'New Item';
    const newItem = createMenuItem(text, type, parent);

    if (parent) {
      parent.children.push(newItem);
      setExpandedItems(prev => new Set([...prev, parent.id]));
    } else {
      selectedMenu.items.push(newItem);
    }

    setSelectedItem(newItem);
    setSelectedMenu({ ...selectedMenu, modified: new Date() });
    setIsDirty(true);
    setShowAddDialog(false);
  }, [selectedMenu, createMenuItem]);

  // Delete menu item
  const deleteMenuItem = useCallback((item: MenuItem) => {
    if (!selectedMenu) return;

    const removeFromParent = (items: MenuItem[]): MenuItem[] => {
      return items.filter(i => {
        if (i.id === item.id) return false;
        i.children = removeFromParent(i.children);
        return true;
      });
    };

    selectedMenu.items = removeFromParent(selectedMenu.items);
    
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
    
    setSelectedMenu({ ...selectedMenu, modified: new Date() });
    setIsDirty(true);
  }, [selectedMenu, selectedItem]);

  // Update menu item
  const updateMenuItem = useCallback((item: MenuItem, updates: Partial<MenuItem>) => {
    if (!selectedMenu) return;

    const updateInTree = (items: MenuItem[]): MenuItem[] => {
      return items.map(i => {
        if (i.id === item.id) {
          const updated = { ...i, ...updates };
          if (selectedItem?.id === item.id) {
            setSelectedItem(updated);
          }
          return updated;
        }
        return { ...i, children: updateInTree(i.children) };
      });
    };

    selectedMenu.items = updateInTree(selectedMenu.items);
    setSelectedMenu({ ...selectedMenu, modified: new Date() });
    setIsDirty(true);
  }, [selectedMenu, selectedItem]);

  // Move menu item
  const moveMenuItem = useCallback((
    sourceItem: MenuItem,
    targetItem: MenuItem,
    position: 'before' | 'after' | 'child'
  ) => {
    if (!selectedMenu || sourceItem.id === targetItem.id) return;

    // Remove source item from its current location
    const removeItem = (items: MenuItem[], itemId: string): MenuItem[] => {
      return items.filter(item => {
        if (item.id === itemId) return false;
        item.children = removeItem(item.children, itemId);
        return true;
      });
    };

    // Insert item at target location
    const insertItem = (items: MenuItem[], targetId: string, newItem: MenuItem, pos: 'before' | 'after' | 'child'): MenuItem[] => {
      return items.reduce((acc: MenuItem[], item) => {
        if (item.id === targetId) {
          if (pos === 'before') {
            acc.push(newItem, item);
          } else if (pos === 'after') {
            acc.push(item, newItem);
          } else { // child
            item.children.push(newItem);
            newItem.parent = item;
            newItem.level = item.level + 1;
            acc.push(item);
            setExpandedItems(prev => new Set([...prev, item.id]));
          }
        } else {
          item.children = insertItem(item.children, targetId, newItem, pos);
          acc.push(item);
        }
        return acc;
      }, []);
    };

    selectedMenu.items = removeItem(selectedMenu.items, sourceItem.id);
    selectedMenu.items = insertItem(selectedMenu.items, targetItem.id, sourceItem, position);
    
    setSelectedMenu({ ...selectedMenu, modified: new Date() });
    setIsDirty(true);
  }, [selectedMenu]);

  // Toggle item expansion
  const toggleExpansion = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Generate accelerator display text
  const getAcceleratorText = (accelerator?: MenuItem['accelerator']): string => {
    if (!accelerator || !accelerator.key) return '';
    
    const modifiers = [];
    if (accelerator.modifiers & AcceleratorModifier.Ctrl) modifiers.push('Ctrl');
    if (accelerator.modifiers & AcceleratorModifier.Alt) modifiers.push('Alt');
    if (accelerator.modifiers & AcceleratorModifier.Shift) modifiers.push('Shift');
    
    return [...modifiers, accelerator.key].join('+');
  };

  // Export menu to RC format
  const exportMenuToRC = useCallback((menu: MenuResource): string => {
    let content = `// Menu: ${menu.name}\n${menu.name} MENU\nBEGIN\n`;
    
    const writeMenuItems = (items: MenuItem[], indent: string = '    ') => {
      items.forEach(item => {
        if (item.type === MenuItemType.Separator) {
          content += `${indent}MENUITEM SEPARATOR\n`;
        } else if (item.type === MenuItemType.Popup) {
          content += `${indent}POPUP "${item.text}"\n${indent}BEGIN\n`;
          writeMenuItems(item.children, indent + '    ');
          content += `${indent}END\n`;
        } else {
          const flags = item.flags.length > 0 ? `, ${item.flags.join(' | ')}` : '';
          const accelerator = item.accelerator ? `, ${getAcceleratorText(item.accelerator)}` : '';
          content += `${indent}MENUITEM "${item.text}", ${item.name.toUpperCase()}${flags}${accelerator}\n`;
        }
      });
    };
    
    writeMenuItems(menu.items);
    content += 'END\n\n';
    
    return content;
  }, []);

  // Export menu to VB6 format
  const exportMenuToVB6 = useCallback((menu: MenuResource): string => {
    let content = `' Menu: ${menu.name}\n' Generated by VB6 Menu Editor\n\n`;
    
    const writeMenuCode = (items: MenuItem[], parentName: string = '') => {
      items.forEach((item, index) => {
        const menuName = parentName ? `${parentName}_${item.name}` : item.name;
        
        content += `' Menu item: ${item.text}\n`;
        content += `Private Sub ${menuName}_Click()\n`;
        content += `    ' TODO: Add menu item click handler\n`;
        content += `End Sub\n\n`;
        
        if (item.children.length > 0) {
          writeMenuCode(item.children, menuName);
        }
      });
    };
    
    writeMenuCode(menu.items);
    
    return content;
  }, []);

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, item: MenuItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetItem: MenuItem, position: 'before' | 'after' | 'child') => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== targetItem.id) {
      moveMenuItem(draggedItem, targetItem, position);
    }
    setDraggedItem(null);
  }, [draggedItem, moveMenuItem]);

  // Render menu tree
  const renderMenuTree = useCallback((items: MenuItem[]): React.ReactNode => {
    return items.map(item => (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
            selectedItem?.id === item.id ? 'bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${12 + item.level * 20}px` }}
          onClick={() => setSelectedItem(item)}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item, 'child')}
        >
          {item.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(item.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-xs"
            >
              {expandedItems.has(item.id) ? '▼' : '▶'}
            </button>
          )}
          
          <span className="text-sm">
            {item.type === MenuItemType.Popup ? '📁' : 
             item.type === MenuItemType.Separator ? '━' : '📄'}
          </span>
          
          <span className="flex-1 text-sm">
            {item.type === MenuItemType.Separator ? '(Separator)' : item.text}
          </span>
          
          {item.accelerator && (
            <span className="text-xs text-gray-500">
              {getAcceleratorText(item.accelerator)}
            </span>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteMenuItem(item);
            }}
            className="w-5 h-5 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </div>
        
        {expandedItems.has(item.id) && item.children.length > 0 && (
          <div>{renderMenuTree(item.children)}</div>
        )}
      </div>
    ));
  }, [selectedItem, expandedItems, handleDragStart, handleDragOver, handleDrop, toggleExpansion, deleteMenuItem]);

  // Render property editor
  const renderPropertyEditor = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg">Select a menu item</p>
            <p className="text-sm mt-2">Choose a menu item to edit its properties</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">Menu Item Properties</h3>
        
        <div className="space-y-4">
          {/* Basic Properties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <input
              type="text"
              value={selectedItem.text}
              onChange={(e) => updateMenuItem(selectedItem, { text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={selectedItem.type === MenuItemType.Separator}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={selectedItem.name}
              onChange={(e) => updateMenuItem(selectedItem, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={selectedItem.type === MenuItemType.Separator}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedItem.type}
              onChange={(e) => updateMenuItem(selectedItem, { type: e.target.value as MenuItemType })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value={MenuItemType.MenuItem}>Menu Item</option>
              <option value={MenuItemType.Popup}>Popup Menu</option>
              <option value={MenuItemType.Separator}>Separator</option>
            </select>
          </div>
          
          {/* State Properties */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItem.enabled}
                onChange={(e) => updateMenuItem(selectedItem, { enabled: e.target.checked })}
              />
              <span className="text-sm">Enabled</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItem.visible}
                onChange={(e) => updateMenuItem(selectedItem, { visible: e.target.checked })}
              />
              <span className="text-sm">Visible</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItem.checked}
                onChange={(e) => updateMenuItem(selectedItem, { checked: e.target.checked })}
              />
              <span className="text-sm">Checked</span>
            </label>
          </div>
          
          {/* Accelerator */}
          {selectedItem.type === MenuItemType.MenuItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accelerator Key</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedItem.accelerator?.modifiers || AcceleratorModifier.None}
                  onChange={(e) => updateMenuItem(selectedItem, {
                    accelerator: {
                      key: selectedItem.accelerator?.key || AcceleratorKey.None,
                      modifiers: Number(e.target.value) as AcceleratorModifier
                    }
                  })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={AcceleratorModifier.None}>None</option>
                  <option value={AcceleratorModifier.Ctrl}>Ctrl</option>
                  <option value={AcceleratorModifier.Alt}>Alt</option>
                  <option value={AcceleratorModifier.Shift}>Shift</option>
                  <option value={AcceleratorModifier.ShiftCtrl}>Shift+Ctrl</option>
                  <option value={AcceleratorModifier.ShiftAlt}>Shift+Alt</option>
                  <option value={AcceleratorModifier.CtrlAlt}>Ctrl+Alt</option>
                  <option value={AcceleratorModifier.ShiftCtrlAlt}>Shift+Ctrl+Alt</option>
                </select>
                
                <select
                  value={selectedItem.accelerator?.key || AcceleratorKey.None}
                  onChange={(e) => updateMenuItem(selectedItem, {
                    accelerator: {
                      key: e.target.value as AcceleratorKey,
                      modifiers: selectedItem.accelerator?.modifiers || AcceleratorModifier.None
                    }
                  })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={AcceleratorKey.None}>None</option>
                  {Object.values(AcceleratorKey).filter(k => k !== AcceleratorKey.None).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                  {/* A-Z keys */}
                  {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                  {/* 0-9 keys */}
                  {Array.from({ length: 10 }, (_, i) => i.toString()).map(digit => (
                    <option key={digit} value={digit}>{digit}</option>
                  ))}
                </select>
              </div>
              
              {selectedItem.accelerator && selectedItem.accelerator.key && (
                <div className="mt-2 text-sm text-gray-600">
                  Preview: {getAcceleratorText(selectedItem.accelerator)}
                </div>
              )}
            </div>
          )}
          
          {/* Help ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Help ID</label>
            <input
              type="number"
              value={selectedItem.helpId || ''}
              onChange={(e) => updateMenuItem(selectedItem, { helpId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Menu Editor</h1>
            {isDirty && <span className="text-sm text-orange-600">* Unsaved changes</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMenuDialog(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Menu
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              disabled={!selectedMenu}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Add Item
            </button>
            <button
              onClick={() => selectedMenu && onExport?.(selectedMenu, 'RC')}
              disabled={!selectedMenu}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              Export RC
            </button>
            <button
              onClick={() => selectedMenu && onSave?.(selectedMenu)}
              disabled={!selectedMenu || !isDirty}
              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Menu List */}
        <div className="w-60 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Menus</h3>
          </div>
          <div className="overflow-y-auto">
            {menus.map(menu => (
              <div
                key={menu.id}
                className={`flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer ${
                  selectedMenu?.id === menu.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => {
                  setSelectedMenu(menu);
                  setSelectedItem(null);
                }}
              >
                <div>
                  <div className="font-medium text-sm">{menu.name}</div>
                  <div className="text-xs text-gray-500">{menu.items.length} items</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMenu(menu.id);
                  }}
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
            
            {menus.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No menus created</p>
                <p className="text-xs mt-1">Click "New Menu" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Tree */}
        <div className="flex-1 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">
              {selectedMenu ? `${selectedMenu.name} Structure` : 'Menu Structure'}
            </h3>
          </div>
          <div className="overflow-y-auto">
            {selectedMenu ? (
              <div className="p-2">
                {renderMenuTree(selectedMenu.items)}
                
                {selectedMenu.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No menu items</p>
                    <p className="text-xs mt-1">Click "Add Item" to add menu items</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg">Select a menu</p>
                  <p className="text-sm mt-2">Choose a menu from the list to edit its structure</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Properties</h3>
          </div>
          {renderPropertyEditor()}
        </div>
      </div>

      {/* Add Menu Dialog */}
      {showMenuDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Menu</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name</label>
              <input
                type="text"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., MainMenu, ContextMenu"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMenuDialog(false);
                  setNewMenuName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addMenu}
                disabled={!newMenuName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add Menu Item</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => addMenuItem(selectedItem?.type === MenuItemType.Popup ? selectedItem : undefined, MenuItemType.MenuItem)}
                className="w-full p-3 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                <div className="font-medium">Menu Item</div>
                <div className="text-sm text-gray-600">Regular menu item with text and action</div>
              </button>
              
              <button
                onClick={() => addMenuItem(selectedItem?.type === MenuItemType.Popup ? selectedItem : undefined, MenuItemType.Popup)}
                className="w-full p-3 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                <div className="font-medium">Popup Menu</div>
                <div className="text-sm text-gray-600">Menu item that contains sub-items</div>
              </button>
              
              <button
                onClick={() => addMenuItem(selectedItem?.type === MenuItemType.Popup ? selectedItem : undefined, MenuItemType.Separator)}
                className="w-full p-3 text-left border border-gray-300 rounded hover:bg-gray-50"
              >
                <div className="font-medium">Separator</div>
                <div className="text-sm text-gray-600">Horizontal line to separate menu sections</div>
              </button>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuEditor;