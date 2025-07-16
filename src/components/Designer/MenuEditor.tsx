import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface MenuItem {
  id: string;
  caption: string;
  name: string;
  enabled: boolean;
  visible: boolean;
  checked: boolean;
  shortcut: string;
  helpContextId: number;
  tag: string;
  separator: boolean;
  submenu: MenuItem[];
  parent?: string;
}

interface MenuEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (menus: MenuItem[]) => void;
  initialMenus?: MenuItem[];
}

export const MenuEditor: React.FC<MenuEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialMenus = [],
}) => {
  const [menus, setMenus] = useState<MenuItem[]>(
    initialMenus.length > 0
      ? initialMenus
      : [
          {
            id: 'file',
            caption: '&File',
            name: 'mnuFile',
            enabled: true,
            visible: true,
            checked: false,
            shortcut: '',
            helpContextId: 0,
            tag: '',
            separator: false,
            submenu: [
              {
                id: 'new',
                caption: '&New',
                name: 'mnuNew',
                enabled: true,
                visible: true,
                checked: false,
                shortcut: 'Ctrl+N',
                helpContextId: 0,
                tag: '',
                separator: false,
                submenu: [],
              },
              {
                id: 'open',
                caption: '&Open...',
                name: 'mnuOpen',
                enabled: true,
                visible: true,
                checked: false,
                shortcut: 'Ctrl+O',
                helpContextId: 0,
                tag: '',
                separator: false,
                submenu: [],
              },
              {
                id: 'sep1',
                caption: '-',
                name: 'mnuSep1',
                enabled: true,
                visible: true,
                checked: false,
                shortcut: '',
                helpContextId: 0,
                tag: '',
                separator: true,
                submenu: [],
              },
              {
                id: 'exit',
                caption: 'E&xit',
                name: 'mnuExit',
                enabled: true,
                visible: true,
                checked: false,
                shortcut: '',
                helpContextId: 0,
                tag: '',
                separator: false,
                submenu: [],
              },
            ],
          },
          {
            id: 'edit',
            caption: '&Edit',
            name: 'mnuEdit',
            enabled: true,
            visible: true,
            checked: false,
            shortcut: '',
            helpContextId: 0,
            tag: '',
            separator: false,
            submenu: [
              {
                id: 'undo',
                caption: '&Undo',
                name: 'mnuUndo',
                enabled: true,
                visible: true,
                checked: false,
                shortcut: 'Ctrl+Z',
                helpContextId: 0,
                tag: '',
                separator: false,
                submenu: [],
              },
              {
                id: 'redo',
                caption: '&Redo',
                name: 'mnuRedo',
                enabled: true,
                visible: true,
                checked: false,
                shortcut: 'Ctrl+Y',
                helpContextId: 0,
                tag: '',
                separator: false,
                submenu: [],
              },
            ],
          },
        ]
  );

  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['file', 'edit']));

  const findMenuItem = useCallback(
    (id: string, items: MenuItem[] = menus): MenuItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        const found = findMenuItem(id, item.submenu);
        if (found) return found;
      }
      return null;
    },
    [menus]
  );

  const updateMenuItem = useCallback(
    (id: string, updates: Partial<MenuItem>) => {
      const updateInArray = (items: MenuItem[]): MenuItem[] => {
        return items.map(item => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.submenu.length > 0) {
            return { ...item, submenu: updateInArray(item.submenu) };
          }
          return item;
        });
      };

      setMenus(updateInArray(menus));
    },
    [menus]
  );

  const addMenuItem = useCallback(
    (parentId?: string) => {
      const newItem: MenuItem = {
        id: `menu_${Date.now()}`,
        caption: 'New Item',
        name: `mnuNew${Date.now()}`,
        enabled: true,
        visible: true,
        checked: false,
        shortcut: '',
        helpContextId: 0,
        tag: '',
        separator: false,
        submenu: [],
        parent: parentId,
      };

      if (parentId) {
        const updateInArray = (items: MenuItem[]): MenuItem[] => {
          return items.map(item => {
            if (item.id === parentId) {
              return { ...item, submenu: [...item.submenu, newItem] };
            }
            if (item.submenu.length > 0) {
              return { ...item, submenu: updateInArray(item.submenu) };
            }
            return item;
          });
        };
        setMenus(updateInArray(menus));
        setExpandedMenus(prev => new Set([...prev, parentId]));
      } else {
        setMenus([...menus, newItem]);
      }

      setSelectedMenu(newItem.id);
    },
    [menus]
  );

  const deleteMenuItem = useCallback(
    (id: string) => {
      const deleteFromArray = (items: MenuItem[]): MenuItem[] => {
        return items.filter(item => {
          if (item.id === id) return false;
          if (item.submenu.length > 0) {
            item.submenu = deleteFromArray(item.submenu);
          }
          return true;
        });
      };

      setMenus(deleteFromArray(menus));
      if (selectedMenu === id) {
        setSelectedMenu(null);
      }
    },
    [menus, selectedMenu]
  );

  const moveMenuItem = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const moveInArray = (items: MenuItem[]): MenuItem[] => {
        const index = items.findIndex(item => item.id === id);
        if (index === -1) {
          // Item not in this array, check subarrays
          return items.map(item => ({
            ...item,
            submenu: moveInArray(item.submenu),
          }));
        }

        const newItems = [...items];
        if (direction === 'up' && index > 0) {
          [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        } else if (direction === 'down' && index < items.length - 1) {
          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        return newItems;
      };

      setMenus(moveInArray(menus));
    },
    [menus]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const renderMenuItem = useCallback(
    (item: MenuItem, level: number = 0) => {
      const isSelected = selectedMenu === item.id;
      const isExpanded = expandedMenus.has(item.id);
      const hasSubmenu = item.submenu.length > 0;

      return (
        <div key={item.id}>
          <div
            className={`flex items-center gap-1 py-1 px-2 cursor-pointer text-xs ${
              isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => setSelectedMenu(item.id)}
          >
            {hasSubmenu ? (
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExpanded(item.id);
                }}
                className="w-4 h-4 flex items-center justify-center"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <div className="w-4" />
            )}

            <span className="flex-1">
              {item.separator ? '────────────' : item.caption.replace(/&/g, '')}
            </span>

            {item.shortcut && <span className="text-gray-500 text-xs">{item.shortcut}</span>}
          </div>

          {hasSubmenu &&
            isExpanded &&
            item.submenu.map(subItem => renderMenuItem(subItem, level + 1))}
        </div>
      );
    },
    [selectedMenu, expandedMenus, toggleExpanded]
  );

  const selectedMenuItem = selectedMenu ? findMenuItem(selectedMenu) : null;

  const handleSave = useCallback(() => {
    onSave(menus);
    onClose();
  }, [menus, onSave, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-200 border-2 border-gray-400 shadow-lg"
        style={{ width: '800px', height: '600px' }}
      >
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>Menu Editor</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">
            ×
          </button>
        </div>

        <div className="p-4 h-full flex gap-4">
          {/* Menu Tree */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-100 border border-gray-400 p-2 text-xs font-bold mb-2">
              Menu Structure
            </div>

            <div className="flex gap-1 mb-2">
              <button
                onClick={() => addMenuItem()}
                className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 flex items-center gap-1"
                title="Add Top Level Menu"
              >
                <Plus size={12} />
                Add
              </button>
              <button
                onClick={() => selectedMenu && addMenuItem(selectedMenu)}
                disabled={!selectedMenu}
                className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 disabled:opacity-50 flex items-center gap-1"
                title="Add Submenu"
              >
                <Plus size={12} />
                Sub
              </button>
              <button
                onClick={() => selectedMenu && deleteMenuItem(selectedMenu)}
                disabled={!selectedMenu}
                className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 disabled:opacity-50 flex items-center gap-1"
                title="Delete Menu Item"
              >
                <Trash2 size={12} />
              </button>
              <button
                onClick={() => selectedMenu && moveMenuItem(selectedMenu, 'up')}
                disabled={!selectedMenu}
                className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 disabled:opacity-50"
                title="Move Up"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => selectedMenu && moveMenuItem(selectedMenu, 'down')}
                disabled={!selectedMenu}
                className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 disabled:opacity-50"
                title="Move Down"
              >
                <ArrowDown size={12} />
              </button>
            </div>

            <div className="flex-1 bg-white border border-gray-400 overflow-y-auto">
              {menus.map(item => renderMenuItem(item))}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-100 border border-gray-400 p-2 text-xs font-bold mb-2">
              Properties
            </div>

            {selectedMenuItem ? (
              <div className="flex-1 bg-white border border-gray-400 p-3 overflow-y-auto">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Caption:</label>
                    <input
                      type="text"
                      value={selectedMenuItem.caption}
                      onChange={e =>
                        updateMenuItem(selectedMenuItem.id, { caption: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-300"
                      placeholder="&Menu Item"
                    />
                    <div className="text-gray-500 mt-1">Use & to create keyboard shortcuts</div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Name:</label>
                    <input
                      type="text"
                      value={selectedMenuItem.name}
                      onChange={e => updateMenuItem(selectedMenuItem.id, { name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300"
                      placeholder="mnuMenuItem"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Shortcut:</label>
                    <select
                      value={selectedMenuItem.shortcut}
                      onChange={e =>
                        updateMenuItem(selectedMenuItem.id, { shortcut: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-300"
                    >
                      <option value="">(None)</option>
                      <option value="Ctrl+A">Ctrl+A</option>
                      <option value="Ctrl+C">Ctrl+C</option>
                      <option value="Ctrl+N">Ctrl+N</option>
                      <option value="Ctrl+O">Ctrl+O</option>
                      <option value="Ctrl+S">Ctrl+S</option>
                      <option value="Ctrl+V">Ctrl+V</option>
                      <option value="Ctrl+X">Ctrl+X</option>
                      <option value="Ctrl+Y">Ctrl+Y</option>
                      <option value="Ctrl+Z">Ctrl+Z</option>
                      <option value="F1">F1</option>
                      <option value="F2">F2</option>
                      <option value="F3">F3</option>
                      <option value="F4">F4</option>
                      <option value="F5">F5</option>
                      <option value="Del">Del</option>
                      <option value="Ins">Ins</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMenuItem.enabled}
                        onChange={e =>
                          updateMenuItem(selectedMenuItem.id, { enabled: e.target.checked })
                        }
                        className="mr-1"
                      />
                      Enabled
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMenuItem.visible}
                        onChange={e =>
                          updateMenuItem(selectedMenuItem.id, { visible: e.target.checked })
                        }
                        className="mr-1"
                      />
                      Visible
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMenuItem.checked}
                        onChange={e =>
                          updateMenuItem(selectedMenuItem.id, { checked: e.target.checked })
                        }
                        className="mr-1"
                      />
                      Checked
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMenuItem.separator}
                        onChange={e =>
                          updateMenuItem(selectedMenuItem.id, {
                            separator: e.target.checked,
                            caption: e.target.checked ? '-' : 'Menu Item',
                          })
                        }
                        className="mr-1"
                      />
                      Separator
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Help Context ID:</label>
                    <input
                      type="number"
                      value={selectedMenuItem.helpContextId}
                      onChange={e =>
                        updateMenuItem(selectedMenuItem.id, {
                          helpContextId: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Tag:</label>
                    <input
                      type="text"
                      value={selectedMenuItem.tag}
                      onChange={e => updateMenuItem(selectedMenuItem.id, { tag: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-white border border-gray-400 p-3 flex items-center justify-center text-gray-500">
                Select a menu item to edit properties
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="border-t border-gray-400 p-3 flex gap-2 justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
          >
            OK
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
