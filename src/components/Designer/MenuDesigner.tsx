/**
 * VB6 Menu Designer Component
 * Visual menu creation and editing interface
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  Plus, 
  Minus, 
  MoveUp, 
  MoveDown, 
  Settings,
  Check,
  X,
  MoreHorizontal,
  Keyboard
} from 'lucide-react';

// Menu item structure matching VB6
export interface VB6MenuItem {
  name: string;           // Internal name (e.g., mnuFile)
  caption: string;        // Display text (e.g., "&File")
  index?: number;         // For control arrays
  shortcut?: string;      // Keyboard shortcut (e.g., "Ctrl+S")
  checked?: boolean;      // Checkmark state
  enabled?: boolean;      // Enabled/disabled state
  visible?: boolean;      // Visibility
  windowList?: boolean;   // MDI window list
  negotiatePosition?: number; // OLE menu negotiation
  helpContextID?: number; // Help context
  tag?: string;          // User data
  children?: VB6MenuItem[]; // Submenu items
  level?: number;        // Indentation level (0-4)
  isSeparator?: boolean; // Separator line
}

interface MenuDesignerProps {
  menuItems: VB6MenuItem[];
  onMenuItemsChange: (items: VB6MenuItem[]) => void;
  onClose?: () => void;
  selectedForm?: string;
}

const MenuDesigner: React.FC<MenuDesignerProps> = ({
  menuItems,
  onMenuItemsChange,
  onClose,
  selectedForm = 'Form1'
}) => {
  const [items, setItems] = useState<VB6MenuItem[]>(menuItems);
  const [selectedItem, setSelectedItem] = useState<VB6MenuItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Flatten menu items for list display
  const flattenMenuItems = useCallback((items: VB6MenuItem[], level = 0): VB6MenuItem[] => {
    const flattened: VB6MenuItem[] = [];
    items.forEach(item => {
      flattened.push({ ...item, level });
      if (item.children && item.children.length > 0) {
        flattened.push(...flattenMenuItems(item.children, level + 1));
      }
    });
    return flattened;
  }, []);

  const flatItems = flattenMenuItems(items);

  // Add new menu item
  const addMenuItem = useCallback(() => {
    const newItem: VB6MenuItem = {
      name: `mnuItem${Date.now()}`,
      caption: 'New Item',
      enabled: true,
      visible: true,
      level: selectedItem?.level ?? 0
    };

    if (selectedIndex >= 0) {
      const newFlat = [...flatItems];
      newFlat.splice(selectedIndex + 1, 0, newItem);
      setItems(unflattenMenuItems(newFlat));
    } else {
      setItems([...items, newItem]);
    }
  }, [items, selectedIndex, selectedItem, flatItems]);

  // Delete selected menu item
  const deleteMenuItem = useCallback(() => {
    if (selectedIndex >= 0) {
      const newFlat = flatItems.filter((_, index) => index !== selectedIndex);
      setItems(unflattenMenuItems(newFlat));
      setSelectedItem(null);
      setSelectedIndex(-1);
    }
  }, [selectedIndex, flatItems]);

  // Unflatten menu items back to hierarchical structure
  const unflattenMenuItems = useCallback((flatItems: VB6MenuItem[]): VB6MenuItem[] => {
    const result: VB6MenuItem[] = [];
    const stack: { item: VB6MenuItem; level: number }[] = [];

    flatItems.forEach(item => {
      const level = item.level || 0;
      const newItem = { ...item, children: [] };
      delete newItem.level;

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(newItem);
      } else {
        const parent = stack[stack.length - 1].item;
        if (!parent.children) parent.children = [];
        parent.children.push(newItem);
      }

      if (level < 4) { // Max indentation level in VB6
        stack.push({ item: newItem, level });
      }
    });

    return result;
  }, []);

  // Move item up/down
  const moveItem = useCallback((direction: 'up' | 'down') => {
    if (selectedIndex < 0) return;
    
    const newIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex < 0 || newIndex >= flatItems.length) return;

    const newFlat = [...flatItems];
    [newFlat[selectedIndex], newFlat[newIndex]] = [newFlat[newIndex], newFlat[selectedIndex]];
    
    setItems(unflattenMenuItems(newFlat));
    setSelectedIndex(newIndex);
  }, [selectedIndex, flatItems]);

  // Indent/Outdent item
  const indentItem = useCallback((direction: 'indent' | 'outdent') => {
    if (selectedIndex < 0 || !selectedItem) return;
    
    const currentLevel = selectedItem.level || 0;
    const newLevel = direction === 'indent' 
      ? Math.min(currentLevel + 1, 4)  // Max level 4 in VB6
      : Math.max(currentLevel - 1, 0);
    
    if (newLevel === currentLevel) return;

    const newFlat = [...flatItems];
    newFlat[selectedIndex] = { ...newFlat[selectedIndex], level: newLevel };
    
    setItems(unflattenMenuItems(newFlat));
  }, [selectedIndex, selectedItem, flatItems]);

  // Insert separator
  const insertSeparator = useCallback(() => {
    const separator: VB6MenuItem = {
      name: `mnuSep${Date.now()}`,
      caption: '-',
      isSeparator: true,
      enabled: false,
      visible: true,
      level: selectedItem?.level ?? 0
    };

    if (selectedIndex >= 0) {
      const newFlat = [...flatItems];
      newFlat.splice(selectedIndex + 1, 0, separator);
      setItems(unflattenMenuItems(newFlat));
    } else {
      setItems([...items, separator]);
    }
  }, [items, selectedIndex, selectedItem, flatItems]);

  // Handle drag and drop
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && 
        dragItem.current !== dragOverItem.current) {
      const newFlat = [...flatItems];
      const draggedItem = newFlat.splice(dragItem.current, 1)[0];
      newFlat.splice(dragOverItem.current, 0, draggedItem);
      setItems(unflattenMenuItems(newFlat));
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Update parent component
  useEffect(() => {
    onMenuItemsChange(items);
  }, [items, onMenuItemsChange]);

  // Keyboard shortcuts
  const shortcuts = [
    'None', 'Ctrl+A', 'Ctrl+B', 'Ctrl+C', 'Ctrl+D', 'Ctrl+E', 'Ctrl+F', 
    'Ctrl+G', 'Ctrl+H', 'Ctrl+I', 'Ctrl+J', 'Ctrl+K', 'Ctrl+L', 'Ctrl+M',
    'Ctrl+N', 'Ctrl+O', 'Ctrl+P', 'Ctrl+Q', 'Ctrl+R', 'Ctrl+S', 'Ctrl+T',
    'Ctrl+U', 'Ctrl+V', 'Ctrl+W', 'Ctrl+X', 'Ctrl+Y', 'Ctrl+Z',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'Ctrl+F1', 'Ctrl+F2', 'Ctrl+F3', 'Ctrl+F4', 'Ctrl+F5', 'Ctrl+F6',
    'Shift+F1', 'Shift+F2', 'Shift+F3', 'Shift+F4', 'Shift+F5', 'Shift+F6',
    'Ctrl+Ins', 'Shift+Ins', 'Del', 'Shift+Del', 'Alt+Backspace'
  ];

  return (
    <div className="menu-designer bg-gray-50 border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white">
        <h2 className="font-semibold">Menu Editor - {selectedForm}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm"
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            onClick={onClose}
            className="hover:bg-blue-500 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Menu Items List */}
        <div className="flex-1 p-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <button
              onClick={addMenuItem}
              className="p-1 hover:bg-gray-200 rounded"
              title="Add Item"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={deleteMenuItem}
              disabled={selectedIndex < 0}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Delete Item"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => indentItem('indent')}
              disabled={selectedIndex < 0 || (selectedItem?.level ?? 0) >= 4}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Indent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => indentItem('outdent')}
              disabled={selectedIndex < 0 || (selectedItem?.level ?? 0) <= 0}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Outdent"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => moveItem('up')}
              disabled={selectedIndex <= 0}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Move Up"
            >
              <MoveUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveItem('down')}
              disabled={selectedIndex < 0 || selectedIndex >= flatItems.length - 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Move Down"
            >
              <MoveDown className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={insertSeparator}
              className="p-1 hover:bg-gray-200 rounded"
              title="Insert Separator"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="border rounded bg-white" style={{ minHeight: '300px' }}>
            {flatItems.map((item, index) => (
              <div
                key={index}
                className={`
                  flex items-center px-2 py-1 cursor-pointer hover:bg-blue-50
                  ${selectedIndex === index ? 'bg-blue-100 border-l-2 border-blue-500' : ''}
                  ${item.isSeparator ? 'opacity-50' : ''}
                `}
                style={{ paddingLeft: `${(item.level || 0) * 24 + 8}px` }}
                onClick={() => {
                  setSelectedItem(item);
                  setSelectedIndex(index);
                }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
              >
                {item.children && item.children.length > 0 && (
                  <ChevronRight className="w-3 h-3 mr-1" />
                )}
                {item.checked && <Check className="w-3 h-3 mr-1 text-green-600" />}
                <span className={`flex-1 ${!item.enabled ? 'text-gray-400' : ''}`}>
                  {item.isSeparator ? '──────────' : item.caption}
                </span>
                {item.shortcut && (
                  <span className="text-xs text-gray-500 ml-4">{item.shortcut}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedItem && (
          <div className="w-80 p-4 bg-white border-l">
            <h3 className="font-semibold mb-4">Properties</h3>
            
            <div className="space-y-3">
              {/* Caption */}
              <div>
                <label className="block text-sm font-medium mb-1">Caption:</label>
                <input
                  type="text"
                  value={selectedItem.caption}
                  onChange={(e) => {
                    const newFlat = [...flatItems];
                    newFlat[selectedIndex] = { ...newFlat[selectedIndex], caption: e.target.value };
                    setItems(unflattenMenuItems(newFlat));
                    setSelectedItem({ ...selectedItem, caption: e.target.value });
                  }}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={selectedItem.isSeparator}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  value={selectedItem.name}
                  onChange={(e) => {
                    const newFlat = [...flatItems];
                    newFlat[selectedIndex] = { ...newFlat[selectedIndex], name: e.target.value };
                    setItems(unflattenMenuItems(newFlat));
                    setSelectedItem({ ...selectedItem, name: e.target.value });
                  }}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Index (for control arrays) */}
              <div>
                <label className="block text-sm font-medium mb-1">Index:</label>
                <input
                  type="number"
                  value={selectedItem.index ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    const newFlat = [...flatItems];
                    newFlat[selectedIndex] = { ...newFlat[selectedIndex], index: value };
                    setItems(unflattenMenuItems(newFlat));
                    setSelectedItem({ ...selectedItem, index: value });
                  }}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="(none)"
                />
              </div>

              {/* Shortcut */}
              <div>
                <label className="block text-sm font-medium mb-1">Shortcut:</label>
                <select
                  value={selectedItem.shortcut || 'None'}
                  onChange={(e) => {
                    const value = e.target.value === 'None' ? undefined : e.target.value;
                    const newFlat = [...flatItems];
                    newFlat[selectedIndex] = { ...newFlat[selectedIndex], shortcut: value };
                    setItems(unflattenMenuItems(newFlat));
                    setSelectedItem({ ...selectedItem, shortcut: value });
                  }}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={selectedItem.isSeparator}
                >
                  {shortcuts.map(shortcut => (
                    <option key={shortcut} value={shortcut}>{shortcut}</option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItem.checked || false}
                    onChange={(e) => {
                      const newFlat = [...flatItems];
                      newFlat[selectedIndex] = { ...newFlat[selectedIndex], checked: e.target.checked };
                      setItems(unflattenMenuItems(newFlat));
                      setSelectedItem({ ...selectedItem, checked: e.target.checked });
                    }}
                    className="mr-2"
                    disabled={selectedItem.isSeparator}
                  />
                  <span className="text-sm">Checked</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItem.enabled !== false}
                    onChange={(e) => {
                      const newFlat = [...flatItems];
                      newFlat[selectedIndex] = { ...newFlat[selectedIndex], enabled: e.target.checked };
                      setItems(unflattenMenuItems(newFlat));
                      setSelectedItem({ ...selectedItem, enabled: e.target.checked });
                    }}
                    className="mr-2"
                    disabled={selectedItem.isSeparator}
                  />
                  <span className="text-sm">Enabled</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItem.visible !== false}
                    onChange={(e) => {
                      const newFlat = [...flatItems];
                      newFlat[selectedIndex] = { ...newFlat[selectedIndex], visible: e.target.checked };
                      setItems(unflattenMenuItems(newFlat));
                      setSelectedItem({ ...selectedItem, visible: e.target.checked });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Visible</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItem.windowList || false}
                    onChange={(e) => {
                      const newFlat = [...flatItems];
                      newFlat[selectedIndex] = { ...newFlat[selectedIndex], windowList: e.target.checked };
                      setItems(unflattenMenuItems(newFlat));
                      setSelectedItem({ ...selectedItem, windowList: e.target.checked });
                    }}
                    className="mr-2"
                    disabled={selectedItem.isSeparator}
                  />
                  <span className="text-sm">WindowList (MDI)</span>
                </label>
              </div>

              {/* Help Context ID */}
              <div>
                <label className="block text-sm font-medium mb-1">HelpContextID:</label>
                <input
                  type="number"
                  value={selectedItem.helpContextID ?? 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const newFlat = [...flatItems];
                    newFlat[selectedIndex] = { ...newFlat[selectedIndex], helpContextID: value };
                    setItems(unflattenMenuItems(newFlat));
                    setSelectedItem({ ...selectedItem, helpContextID: value });
                  }}
                  className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="border-t p-4 bg-white">
          <h3 className="font-semibold mb-2">Menu Preview</h3>
          <MenuPreview items={items} />
        </div>
      )}
    </div>
  );
};

// Menu Preview Component
const MenuPreview: React.FC<{ items: VB6MenuItem[] }> = ({ items }) => {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (name: string) => {
    const newOpenMenus = new Set(openMenus);
    if (newOpenMenus.has(name)) {
      newOpenMenus.delete(name);
    } else {
      newOpenMenus.add(name);
    }
    setOpenMenus(newOpenMenus);
  };

  const renderMenuItem = (item: VB6MenuItem, depth = 0) => {
    if (item.isSeparator) {
      return <div key={item.name} className="border-t my-1" />;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.has(item.name);

    return (
      <div key={item.name} className={depth === 0 ? 'inline-block' : 'block'}>
        <div
          className={`
            px-4 py-1 cursor-pointer select-none
            ${depth === 0 ? 'hover:bg-gray-100' : 'hover:bg-blue-500 hover:text-white'}
            ${!item.enabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${!item.visible ? 'hidden' : ''}
            flex items-center justify-between
            ${depth > 0 ? 'min-w-[200px]' : ''}
          `}
          onClick={() => hasChildren && toggleMenu(item.name)}
        >
          <div className="flex items-center">
            {item.checked && <Check className="w-3 h-3 mr-2" />}
            <span>{item.caption.replace('&', '')}</span>
          </div>
          {hasChildren && depth > 0 && <ChevronRight className="w-3 h-3 ml-4" />}
          {item.shortcut && depth > 0 && (
            <span className="text-xs ml-4 opacity-75">{item.shortcut}</span>
          )}
        </div>
        
        {hasChildren && (depth === 0 ? isOpen : true) && (
          <div className={`
            ${depth === 0 ? 'absolute bg-white border shadow-lg mt-1' : 'relative'}
            ${depth > 0 ? 'ml-4' : ''}
          `}>
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded inline-flex bg-gray-50">
      {items.map(item => renderMenuItem(item))}
    </div>
  );
};

export default MenuDesigner;