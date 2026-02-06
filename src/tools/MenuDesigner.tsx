import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Menu Designer Types
export interface MenuItem {
  id: string;
  name: string;
  caption: string;
  enabled: boolean;
  visible: boolean;
  checked: boolean;
  shortcutKey?: string;
  accessKey?: string;
  tag?: string;
  helpContextId?: number;
  icon?: string;
  isSeparator: boolean;
  level: number;
  parentId?: string;
  children: MenuItem[];
  index: number;
  windowList: boolean;
  negotiatePosition: 'None' | 'Left' | 'Middle' | 'Right';
}

export interface MenuStructure {
  id: string;
  name: string;
  formName: string;
  items: MenuItem[];
  version: string;
  lastModified: Date;
  description?: string;
}

export interface MenuTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: MenuItem[];
  isBuiltIn: boolean;
}

export interface MenuSettings {
  showIcons: boolean;
  showShortcuts: boolean;
  showAccessKeys: boolean;
  enableDragDrop: boolean;
  autoGenerateNames: boolean;
  validateNames: boolean;
  showPreview: boolean;
  gridSize: number;
  fontSize: number;
}

interface MenuDesignerProps {
  formName?: string;
  initialMenu?: MenuStructure;
  onMenuChange?: (menu: MenuStructure) => void;
  onGenerateCode?: (menu: MenuStructure) => string;
  onPreviewMenu?: (menu: MenuStructure) => void;
  onSaveTemplate?: (template: MenuTemplate) => void;
}

export const MenuDesigner: React.FC<MenuDesignerProps> = ({
  formName = 'Form1',
  initialMenu,
  onMenuChange,
  onGenerateCode,
  onPreviewMenu,
  onSaveTemplate,
}) => {
  const [menuStructure, setMenuStructure] = useState<MenuStructure>({
    id: 'menu1',
    name: 'MainMenu',
    formName,
    items: [],
    version: '1.0',
    lastModified: new Date(),
  });
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showProperties, setShowProperties] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState<MenuSettings>({
    showIcons: true,
    showShortcuts: true,
    showAccessKeys: true,
    enableDragDrop: true,
    autoGenerateNames: true,
    validateNames: true,
    showPreview: true,
    gridSize: 8,
    fontSize: 12,
  });
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [newItemType, setNewItemType] = useState<'item' | 'separator'>('item');
  const [newItemProperties, setNewItemProperties] = useState({
    name: '',
    caption: '',
    shortcutKey: '',
    accessKey: '',
  });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item?: MenuItem;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const eventEmitter = useRef(new EventEmitter());
  const treeRef = useRef<HTMLDivElement>(null);

  // Initialize with sample menu or provided menu
  useEffect(() => {
    if (initialMenu) {
      setMenuStructure(initialMenu);
    } else {
      // Create default menu structure
      const defaultMenu: MenuStructure = {
        id: 'menu1',
        name: 'MainMenu',
        formName,
        version: '1.0',
        lastModified: new Date(),
        items: [
          {
            id: 'file',
            name: 'mnuFile',
            caption: '&File',
            enabled: true,
            visible: true,
            checked: false,
            accessKey: 'F',
            isSeparator: false,
            level: 0,
            children: [
              {
                id: 'file_new',
                name: 'mnuFileNew',
                caption: '&New',
                enabled: true,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+N',
                accessKey: 'N',
                isSeparator: false,
                level: 1,
                parentId: 'file',
                children: [],
                index: 0,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'file_open',
                name: 'mnuFileOpen',
                caption: '&Open...',
                enabled: true,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+O',
                accessKey: 'O',
                isSeparator: false,
                level: 1,
                parentId: 'file',
                children: [],
                index: 1,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'file_sep1',
                name: 'mnuFileSep1',
                caption: '-',
                enabled: true,
                visible: true,
                checked: false,
                isSeparator: true,
                level: 1,
                parentId: 'file',
                children: [],
                index: 2,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'file_save',
                name: 'mnuFileSave',
                caption: '&Save',
                enabled: true,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+S',
                accessKey: 'S',
                isSeparator: false,
                level: 1,
                parentId: 'file',
                children: [],
                index: 3,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'file_saveas',
                name: 'mnuFileSaveAs',
                caption: 'Save &As...',
                enabled: true,
                visible: true,
                checked: false,
                accessKey: 'A',
                isSeparator: false,
                level: 1,
                parentId: 'file',
                children: [],
                index: 4,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'file_sep2',
                name: 'mnuFileSep2',
                caption: '-',
                enabled: true,
                visible: true,
                checked: false,
                isSeparator: true,
                level: 1,
                parentId: 'file',
                children: [],
                index: 5,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'file_exit',
                name: 'mnuFileExit',
                caption: 'E&xit',
                enabled: true,
                visible: true,
                checked: false,
                accessKey: 'x',
                icon: '🚪',
                isSeparator: false,
                level: 1,
                parentId: 'file',
                children: [],
                index: 6,
                windowList: false,
                negotiatePosition: 'None',
              },
            ],
            index: 0,
            windowList: false,
            negotiatePosition: 'Left',
          },
          {
            id: 'edit',
            name: 'mnuEdit',
            caption: '&Edit',
            enabled: true,
            visible: true,
            checked: false,
            accessKey: 'E',
            isSeparator: false,
            level: 0,
            children: [
              {
                id: 'edit_undo',
                name: 'mnuEditUndo',
                caption: '&Undo',
                enabled: false,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+Z',
                accessKey: 'U',
                isSeparator: false,
                level: 1,
                parentId: 'edit',
                children: [],
                index: 0,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'edit_redo',
                name: 'mnuEditRedo',
                caption: '&Redo',
                enabled: false,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+Y',
                accessKey: 'R',
                isSeparator: false,
                level: 1,
                parentId: 'edit',
                children: [],
                index: 1,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'edit_sep1',
                name: 'mnuEditSep1',
                caption: '-',
                enabled: true,
                visible: true,
                checked: false,
                isSeparator: true,
                level: 1,
                parentId: 'edit',
                children: [],
                index: 2,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'edit_cut',
                name: 'mnuEditCut',
                caption: 'Cu&t',
                enabled: true,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+X',
                accessKey: 't',
                isSeparator: false,
                level: 1,
                parentId: 'edit',
                children: [],
                index: 3,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'edit_copy',
                name: 'mnuEditCopy',
                caption: '&Copy',
                enabled: true,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+C',
                accessKey: 'C',
                isSeparator: false,
                level: 1,
                parentId: 'edit',
                children: [],
                index: 4,
                windowList: false,
                negotiatePosition: 'None',
              },
              {
                id: 'edit_paste',
                name: 'mnuEditPaste',
                caption: '&Paste',
                enabled: true,
                visible: true,
                checked: false,
                shortcutKey: 'Ctrl+V',
                accessKey: 'P',
                isSeparator: false,
                level: 1,
                parentId: 'edit',
                children: [],
                index: 5,
                windowList: false,
                negotiatePosition: 'None',
              },
            ],
            index: 1,
            windowList: false,
            negotiatePosition: 'Left',
          },
          {
            id: 'help',
            name: 'mnuHelp',
            caption: '&Help',
            enabled: true,
            visible: true,
            checked: false,
            accessKey: 'H',
            isSeparator: false,
            level: 0,
            children: [
              {
                id: 'help_about',
                name: 'mnuHelpAbout',
                caption: '&About...',
                enabled: true,
                visible: true,
                checked: false,
                accessKey: 'A',
                icon: 'ℹ️',
                isSeparator: false,
                level: 1,
                parentId: 'help',
                children: [],
                index: 0,
                windowList: false,
                negotiatePosition: 'None',
              },
            ],
            index: 2,
            windowList: false,
            negotiatePosition: 'Right',
          },
        ],
      };
      setMenuStructure(defaultMenu);
    }

    // Initialize templates
    const builtInTemplates: MenuTemplate[] = [
      {
        id: 'standard',
        name: 'Standard Application',
        description: 'File, Edit, View, Help menu structure',
        category: 'Application',
        isBuiltIn: true,
        structure: [], // Would contain template structure
      },
      {
        id: 'mdi',
        name: 'MDI Application',
        description: 'MDI application with Window menu',
        category: 'Application',
        isBuiltIn: true,
        structure: [],
      },
      {
        id: 'simple',
        name: 'Simple Menu',
        description: 'Basic File and Help menus',
        category: 'Basic',
        isBuiltIn: true,
        structure: [],
      },
    ];
    setTemplates(builtInTemplates);
  }, [initialMenu, formName]);

  // Notify parent of changes
  useEffect(() => {
    onMenuChange?.(menuStructure);
  }, [menuStructure, onMenuChange]);

  // Generate unique name for menu item
  const generateItemName = useCallback(
    (caption: string, parentName?: string): string => {
      if (!settings.autoGenerateNames) return '';

      // Remove special characters and convert to camel case
      const cleanCaption = caption
        .replace(/[&\-\s.]/g, '')
        .replace(/\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

      const prefix = parentName ? parentName.replace('mnu', '') : 'mnu';
      return `mnu${prefix}${cleanCaption}`;
    },
    [settings.autoGenerateNames]
  );

  // Add new menu item
  const addMenuItem = useCallback(
    (parentId?: string, insertIndex?: number) => {
      const newItem: MenuItem = {
        id: `item_${Date.now()}`,
        name: settings.autoGenerateNames
          ? generateItemName(newItemProperties.caption || 'New Item')
          : newItemProperties.name,
        caption: newItemProperties.caption || 'New Item',
        enabled: true,
        visible: true,
        checked: false,
        shortcutKey: newItemProperties.shortcutKey,
        accessKey: newItemProperties.accessKey,
        isSeparator: newItemType === 'separator',
        level: parentId ? 1 : 0,
        parentId,
        children: [],
        index: insertIndex ?? 0,
        windowList: false,
        negotiatePosition: 'None',
      };

      setMenuStructure(prev => {
        const updated = { ...prev };

        if (parentId) {
          // Add to parent's children
          const addToParent = (items: MenuItem[]): MenuItem[] => {
            return items.map(item => {
              if (item.id === parentId) {
                const newChildren = [...item.children];
                if (insertIndex !== undefined) {
                  newChildren.splice(insertIndex, 0, newItem);
                } else {
                  newChildren.push(newItem);
                }
                return { ...item, children: newChildren };
              } else if (item.children.length > 0) {
                return { ...item, children: addToParent(item.children) };
              }
              return item;
            });
          };
          updated.items = addToParent(updated.items);
        } else {
          // Add to root level
          if (insertIndex !== undefined) {
            updated.items.splice(insertIndex, 0, newItem);
          } else {
            updated.items.push(newItem);
          }
        }

        updated.lastModified = new Date();
        return updated;
      });

      setSelectedItem(newItem);
      setNewItemDialog(false);
      setNewItemProperties({ name: '', caption: '', shortcutKey: '', accessKey: '' });
    },
    [newItemType, newItemProperties, generateItemName, settings.autoGenerateNames]
  );

  // Update menu item
  const updateMenuItem = useCallback(
    (itemId: string, updates: Partial<MenuItem>) => {
      setMenuStructure(prev => {
        const updateInItems = (items: MenuItem[]): MenuItem[] => {
          return items.map(item => {
            if (item.id === itemId) {
              const updatedItem = { ...item, ...updates };
              // Auto-generate name if enabled
              if (settings.autoGenerateNames && updates.caption) {
                updatedItem.name = generateItemName(updates.caption, item.parentId);
              }
              return updatedItem;
            } else if (item.children.length > 0) {
              return { ...item, children: updateInItems(item.children) };
            }
            return item;
          });
        };

        return {
          ...prev,
          items: updateInItems(prev.items),
          lastModified: new Date(),
        };
      });
    },
    [settings.autoGenerateNames, generateItemName]
  );

  // Delete menu item
  const deleteMenuItem = useCallback(
    (itemId: string) => {
      setMenuStructure(prev => {
        const deleteFromItems = (items: MenuItem[]): MenuItem[] => {
          return items
            .filter(item => item.id !== itemId)
            .map(item => ({
              ...item,
              children: deleteFromItems(item.children),
            }));
        };

        return {
          ...prev,
          items: deleteFromItems(prev.items),
          lastModified: new Date(),
        };
      });

      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    },
    [selectedItem]
  );

  // Move menu item
  const moveMenuItem = useCallback(
    (itemId: string, targetParentId?: string, targetIndex?: number) => {
      // Implementation for drag & drop reordering
      // This would involve removing the item from its current location and inserting it at the new location
    },
    []
  );

  // Toggle item expansion
  const toggleExpanded = useCallback((itemId: string) => {
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

  // Render menu tree
  const renderMenuTree = useCallback(
    (items: MenuItem[], level: number = 0): React.ReactNode => {
      return items.map((item, index) => {
        const isSelected = selectedItem?.id === item.id;
        const isExpanded = expandedItems.has(item.id);
        const hasChildren = item.children.length > 0;

        return (
          <div key={item.id}>
            <div
              className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer ${
                isSelected ? 'bg-blue-100' : ''
              }`}
              style={{
                paddingLeft: `${8 + level * 20}px`,
                fontSize: `${settings.fontSize}px`,
              }}
              onClick={() => setSelectedItem(item)}
              onContextMenu={e => {
                e.preventDefault();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  item,
                });
              }}
              draggable={settings.enableDragDrop}
              onDragStart={e => {
                setDraggedItem(item);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={e => {
                if (draggedItem && draggedItem.id !== item.id) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={e => {
                e.preventDefault();
                if (draggedItem && draggedItem.id !== item.id) {
                  moveMenuItem(draggedItem.id, item.parentId, index);
                  setDraggedItem(null);
                }
              }}
            >
              {/* Expand/Collapse Button */}
              <div className="w-4">
                {hasChildren && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleExpanded(item.id);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
              </div>

              {/* Icon */}
              <div className="w-6 text-center">
                {item.isSeparator ? (
                  <span className="text-gray-400">━</span>
                ) : settings.showIcons && item.icon ? (
                  <span>{item.icon}</span>
                ) : (
                  <span className="text-gray-400">□</span>
                )}
              </div>

              {/* Caption */}
              <div className="flex-1">
                <span className={`${!item.enabled ? 'text-gray-400' : 'text-gray-800'}`}>
                  {item.caption}
                </span>
                {settings.showShortcuts && item.shortcutKey && (
                  <span className="text-xs text-gray-500 ml-2">({item.shortcutKey})</span>
                )}
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-1">
                {item.checked && <span className="text-green-600">✓</span>}
                {!item.visible && <span className="text-red-600">👁️</span>}
                {!item.enabled && <span className="text-gray-400">🚫</span>}
              </div>
            </div>

            {/* Children */}
            {isExpanded && hasChildren && renderMenuTree(item.children, level + 1)}
          </div>
        );
      });
    },
    [selectedItem, expandedItems, settings, draggedItem, toggleExpanded, moveMenuItem]
  );

  // Render menu preview
  const renderMenuPreview = useCallback(() => {
    const renderPreviewItems = (items: MenuItem[]): React.ReactNode => {
      return (
        <div className="bg-white border border-gray-300 shadow-lg">
          {items.map(item => (
            <div
              key={item.id}
              className={`px-3 py-1 hover:bg-blue-100 cursor-pointer flex items-center justify-between ${
                !item.enabled ? 'text-gray-400' : 'text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {settings.showIcons && item.icon && <span>{item.icon}</span>}
                <span>{item.caption}</span>
                {item.checked && <span className="text-green-600">✓</span>}
              </div>
              {settings.showShortcuts && item.shortcutKey && (
                <span className="text-xs text-gray-500">{item.shortcutKey}</span>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="p-4">
        <div className="bg-gray-100 p-2 border-b border-gray-300">
          <div className="flex gap-4">
            {menuStructure.items.map(item => (
              <div key={item.id} className="relative group">
                <button className="px-2 py-1 hover:bg-gray-200 rounded">{item.caption}</button>
                <div className="absolute top-full left-0 hidden group-hover:block z-10">
                  {renderPreviewItems(item.children)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, [menuStructure, settings]);

  // Generate VB6 code
  const generateCode = useCallback(() => {
    if (!onGenerateCode) return '';

    return onGenerateCode(menuStructure);
  }, [menuStructure, onGenerateCode]);

  // Context menu items
  const contextMenuItems = [
    {
      label: 'Add Item Above',
      action: () => {
        if (contextMenu.item) {
          // Implementation for adding item above
        }
      },
    },
    {
      label: 'Add Item Below',
      action: () => {
        if (contextMenu.item) {
          // Implementation for adding item below
        }
      },
    },
    {
      label: 'Add Submenu',
      action: () => {
        if (contextMenu.item) {
          // Implementation for adding submenu
        }
      },
    },
    {
      label: 'Add Separator',
      action: () => {
        if (contextMenu.item) {
          // Implementation for adding separator
        }
      },
    },
    {
      label: 'Delete',
      action: () => {
        if (contextMenu.item) {
          deleteMenuItem(contextMenu.item.id);
        }
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Menu Designer</h3>
          <span className="text-xs text-gray-500">({menuStructure.formName})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewItemDialog(true)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Add Item"
          >
            ➕
          </button>

          <button
            onClick={() => setShowTemplateDialog(true)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Templates"
          >
            📋
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-2 py-1 text-xs rounded ${
              showPreview ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="Preview"
          >
            👁️
          </button>

          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`px-2 py-1 text-xs rounded ${
              showProperties ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="Properties"
          >
            🔧
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu Tree */}
        <div className="w-80 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium text-gray-700">Menu Structure</h4>
          </div>

          <div ref={treeRef} className="flex-1 overflow-y-auto">
            {renderMenuTree(menuStructure.items)}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600">
              Items: {menuStructure.items.length} | Selected: {selectedItem?.name || 'None'}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {showProperties && selectedItem && (
          <div className="w-64 border-r border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">Properties</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    onChange={e => updateMenuItem(selectedItem.id, { name: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Caption</label>
                  <input
                    type="text"
                    value={selectedItem.caption}
                    onChange={e => updateMenuItem(selectedItem.id, { caption: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Shortcut Key
                  </label>
                  <input
                    type="text"
                    value={selectedItem.shortcutKey || ''}
                    onChange={e => updateMenuItem(selectedItem.id, { shortcutKey: e.target.value })}
                    placeholder="e.g., Ctrl+S"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Access Key</label>
                  <input
                    type="text"
                    value={selectedItem.accessKey || ''}
                    onChange={e => updateMenuItem(selectedItem.id, { accessKey: e.target.value })}
                    maxLength={1}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                  <input
                    type="text"
                    value={selectedItem.icon || ''}
                    onChange={e => updateMenuItem(selectedItem.id, { icon: e.target.value })}
                    placeholder="🔍"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedItem.enabled}
                      onChange={e => updateMenuItem(selectedItem.id, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>

                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedItem.visible}
                      onChange={e => updateMenuItem(selectedItem.id, { visible: e.target.checked })}
                    />
                    Visible
                  </label>

                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedItem.checked}
                      onChange={e => updateMenuItem(selectedItem.id, { checked: e.target.checked })}
                    />
                    Checked
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Negotiate Position
                  </label>
                  <select
                    value={selectedItem.negotiatePosition}
                    onChange={e =>
                      updateMenuItem(selectedItem.id, { negotiatePosition: e.target.value as any })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="None">None</option>
                    <option value="Left">Left</option>
                    <option value="Middle">Middle</option>
                    <option value="Right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Panel */}
        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <div className="h-full">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-700">Menu Preview</h4>
              </div>
              {renderMenuPreview()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg">Menu Designer</p>
                <p className="text-sm mt-2">Select items from the tree to edit properties</p>
                <p className="text-sm">Enable preview to see menu appearance</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Item Dialog */}
      {newItemDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add Menu Item</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newItemType}
                  onChange={e => setNewItemType(e.target.value as 'item' | 'separator')}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="item">Menu Item</option>
                  <option value="separator">Separator</option>
                </select>
              </div>

              {newItemType === 'item' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                    <input
                      type="text"
                      value={newItemProperties.caption}
                      onChange={e =>
                        setNewItemProperties(prev => ({ ...prev, caption: e.target.value }))
                      }
                      placeholder="&File"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newItemProperties.name}
                      onChange={e =>
                        setNewItemProperties(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="mnuFile"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shortcut Key
                    </label>
                    <input
                      type="text"
                      value={newItemProperties.shortcutKey}
                      onChange={e =>
                        setNewItemProperties(prev => ({ ...prev, shortcutKey: e.target.value }))
                      }
                      placeholder="Ctrl+N"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setNewItemDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => addMenuItem(selectedItem?.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg z-50 py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        >
          {contextMenuItems.map((item, index) => (
            <button
              key={index}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => {
                item.action();
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuDesigner;
