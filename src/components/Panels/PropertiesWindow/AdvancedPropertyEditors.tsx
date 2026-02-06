import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Database,
  FileText,
  Image,
  Code,
  Palette,
  Grid3X3,
  Settings,
  Layers,
  MousePointer,
  Eye,
  Lock,
  Unlock,
  ChevronDown,
  MoreHorizontal,
  X,
  Check,
  Plus,
  Minus,
  Edit3,
} from 'lucide-react';

// Menu Editor for VB6 forms
export const MenuEditor: React.FC<{
  value: any;
  onChange: (value: any) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [menuItems, setMenuItems] = useState(value?.items || []);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const addMenuItem = () => {
    const newItem = {
      caption: 'New Item',
      name: `mnuItem${menuItems.length + 1}`,
      enabled: true,
      visible: true,
      checked: false,
      shortcut: '',
      level: 0,
    };
    setMenuItems([...menuItems, newItem]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_: any, i: number) => i !== index));
  };

  const moveItemUp = (index: number) => {
    if (index > 0) {
      const newItems = [...menuItems];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setMenuItems(newItems);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < menuItems.length - 1) {
      const newItems = [...menuItems];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setMenuItems(newItems);
    }
  };

  const handleSave = () => {
    onChange({ items: menuItems });
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {menuItems.length > 0 ? `${menuItems.length} menu items` : '(None)'}
      </div>
      <button
        onClick={() => setShowDialog(true)}
        className="ml-1 px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
      >
        ...
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-[600px] h-[400px]">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Menu Editor</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3 h-full flex gap-3">
              {/* Menu Tree */}
              <div className="flex-1">
                <div className="text-xs font-bold mb-2">Menu Items:</div>
                <div className="border border-gray-400 bg-white h-64 overflow-y-auto">
                  {menuItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`p-1 cursor-pointer text-xs ${
                        selectedItem === index ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedItem(index)}
                      style={{ paddingLeft: `${item.level * 16 + 4}px` }}
                    >
                      {item.caption === '-' ? '─────────' : item.caption}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1 mt-2">
                  <button onClick={addMenuItem} className="vb6-button text-xs">
                    <Plus size={12} /> Add
                  </button>
                  <button
                    onClick={() => selectedItem !== null && removeMenuItem(selectedItem)}
                    className="vb6-button text-xs"
                    disabled={selectedItem === null}
                  >
                    <Minus size={12} /> Remove
                  </button>
                  <button
                    onClick={() => selectedItem !== null && moveItemUp(selectedItem)}
                    className="vb6-button text-xs"
                    disabled={selectedItem === null || selectedItem === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => selectedItem !== null && moveItemDown(selectedItem)}
                    className="vb6-button text-xs"
                    disabled={selectedItem === null || selectedItem === menuItems.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>

              {/* Properties */}
              <div className="w-48">
                <div className="text-xs font-bold mb-2">Properties:</div>
                {selectedItem !== null && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs">Caption:</label>
                      <input
                        type="text"
                        value={menuItems[selectedItem]?.caption || ''}
                        onChange={e => {
                          const newItems = [...menuItems];
                          newItems[selectedItem].caption = e.target.value;
                          setMenuItems(newItems);
                        }}
                        className="w-full text-xs border border-gray-400 p-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs">Name:</label>
                      <input
                        type="text"
                        value={menuItems[selectedItem]?.name || ''}
                        onChange={e => {
                          const newItems = [...menuItems];
                          newItems[selectedItem].name = e.target.value;
                          setMenuItems(newItems);
                        }}
                        className="w-full text-xs border border-gray-400 p-1"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={menuItems[selectedItem]?.enabled || false}
                          onChange={e => {
                            const newItems = [...menuItems];
                            newItems[selectedItem].enabled = e.target.checked;
                            setMenuItems(newItems);
                          }}
                          className="mr-1"
                        />
                        Enabled
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={menuItems[selectedItem]?.visible || false}
                          onChange={e => {
                            const newItems = [...menuItems];
                            newItems[selectedItem].visible = e.target.checked;
                            setMenuItems(newItems);
                          }}
                          className="mr-1"
                        />
                        Visible
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={menuItems[selectedItem]?.checked || false}
                          onChange={e => {
                            const newItems = [...menuItems];
                            newItems[selectedItem].checked = e.target.checked;
                            setMenuItems(newItems);
                          }}
                          className="mr-1"
                        />
                        Checked
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-2 flex justify-end gap-2">
              <button onClick={handleSave} className="vb6-button">
                OK
              </button>
              <button onClick={() => setShowDialog(false)} className="vb6-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tab Order Editor
export const TabOrderEditor: React.FC<{
  controls: any[];
  onChange: (controls: any[]) => void;
  onFinish: () => void;
}> = ({ controls, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [tabOrder, setTabOrder] = useState(
    controls
      .filter(c => c.properties.TabStop)
      .sort((a, b) => (a.properties.TabIndex || 0) - (b.properties.TabIndex || 0))
  );

  const moveUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...tabOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setTabOrder(newOrder);
    }
  };

  const moveDown = (index: number) => {
    if (index < tabOrder.length - 1) {
      const newOrder = [...tabOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setTabOrder(newOrder);
    }
  };

  const handleSave = () => {
    const updatedControls = [...controls];
    tabOrder.forEach((control, index) => {
      const controlIndex = updatedControls.findIndex(c => c.id === control.id);
      if (controlIndex !== -1) {
        updatedControls[controlIndex] = {
          ...updatedControls[controlIndex],
          properties: {
            ...updatedControls[controlIndex].properties,
            TabIndex: index,
          },
        };
      }
    });
    onChange(updatedControls);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        Tab Order
      </div>
      <button
        onClick={() => setShowDialog(true)}
        className="ml-1 px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
      >
        ...
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-80">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Tab Order</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="text-xs font-bold mb-2">Tab Order:</div>
              <div className="border border-gray-400 bg-white h-48 overflow-y-auto">
                {tabOrder.map((control, index) => (
                  <div key={control.id} className="flex items-center p-1 hover:bg-gray-100">
                    <span className="w-8 text-xs text-center">{index + 1}</span>
                    <span className="flex-1 text-xs">{control.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === tabOrder.length - 1}
                        className="px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300 disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t p-2 flex justify-end gap-2">
              <button onClick={handleSave} className="vb6-button">
                OK
              </button>
              <button onClick={() => setShowDialog(false)} className="vb6-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// DataSource Editor for database connections
export const DataSourceEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [connectionString, setConnectionString] = useState(value);
  const [selectedProvider, setSelectedProvider] = useState('Microsoft.Jet.OLEDB.4.0');

  const providers = [
    'Microsoft.Jet.OLEDB.4.0',
    'SQLOLEDB.1',
    'Microsoft.ACE.OLEDB.12.0',
    'MSDASQL.1',
    'MySQLProv',
    'OraOLEDB.Oracle',
  ];

  const handleSave = () => {
    onChange(connectionString);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value || '(None)'}
      </div>
      <button
        onClick={() => setShowDialog(true)}
        className="ml-1 px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
      >
        ...
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-96">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Data Link Properties</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="mb-3">
                <label className="text-xs font-bold">Provider:</label>
                <select
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                  className="w-full mt-1 text-xs border border-gray-400 p-1"
                >
                  {providers.map(provider => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs font-bold">Connection String:</label>
                <textarea
                  value={connectionString}
                  onChange={e => setConnectionString(e.target.value)}
                  className="w-full mt-1 text-xs border border-gray-400 p-1 h-20"
                  placeholder="Provider=Microsoft.Jet.OLEDB.4.0;Data Source=..."
                />
              </div>

              <button
                onClick={() => {
                  // Test connection (simulated)
                  alert('Connection test successful!');
                }}
                className="vb6-button mb-2"
              >
                Test Connection
              </button>
            </div>

            <div className="border-t p-2 flex justify-end gap-2">
              <button onClick={handleSave} className="vb6-button">
                OK
              </button>
              <button onClick={() => setShowDialog(false)} className="vb6-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icon/Cursor Editor
export const IconEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
  type: 'icon' | 'cursor';
}> = ({ value, onChange, onFinish, type }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const systemIcons =
    type === 'icon'
      ? [
          { name: 'Application', value: 'app.ico' },
          { name: 'Question', value: 'question.ico' },
          { name: 'Exclamation', value: 'exclamation.ico' },
          { name: 'Information', value: 'information.ico' },
          { name: 'Stop', value: 'stop.ico' },
        ]
      : [
          { name: 'Default', value: 'default.cur' },
          { name: 'Arrow', value: 'arrow.cur' },
          { name: 'Cross', value: 'cross.cur' },
          { name: 'I-Beam', value: 'ibeam.cur' },
          { name: 'Hand', value: 'hand.cur' },
          { name: 'SizeAll', value: 'sizeall.cur' },
          { name: 'Wait', value: 'wait.cur' },
        ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setSelectedIcon(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onChange(selectedIcon);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value ? `(${type})` : '(None)'}
      </div>
      <button
        onClick={() => setShowDialog(true)}
        className="ml-1 px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
      >
        ...
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={type === 'icon' ? '.ico' : '.cur'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-80">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Load {type === 'icon' ? 'Icon' : 'Cursor'}</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="mb-3">
                <div className="text-xs font-bold mb-2">
                  System {type === 'icon' ? 'Icons' : 'Cursors'}:
                </div>
                <div className="border border-gray-400 bg-white h-32 overflow-y-auto">
                  {systemIcons.map(item => (
                    <div
                      key={item.value}
                      className={`p-2 cursor-pointer text-xs hover:bg-blue-100 ${
                        selectedIcon === item.value ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedIcon(item.value)}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <button onClick={() => fileInputRef.current?.click()} className="vb6-button w-full">
                  Browse for Custom {type === 'icon' ? 'Icon' : 'Cursor'}...
                </button>
              </div>

              <div className="mb-3">
                <button onClick={() => setSelectedIcon('')} className="vb6-button w-full">
                  Clear
                </button>
              </div>
            </div>

            <div className="border-t p-2 flex justify-end gap-2">
              <button onClick={handleSave} className="vb6-button">
                OK
              </button>
              <button onClick={() => setShowDialog(false)} className="vb6-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Code Editor for properties that contain code
export const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
  language?: string;
}> = ({ value, onChange, onFinish, language = 'vb' }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState(value);

  const handleSave = () => {
    onChange(code);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value ? '(Code)' : '(None)'}
      </div>
      <button
        onClick={() => setShowDialog(true)}
        className="ml-1 px-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
      >
        ...
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-[600px] h-[400px]">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Code Editor</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3 h-full flex flex-col">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="flex-1 w-full text-xs font-mono border border-gray-400 p-2 resize-none"
                placeholder="Enter your code here..."
              />
            </div>

            <div className="border-t p-2 flex justify-end gap-2">
              <button onClick={handleSave} className="vb6-button">
                OK
              </button>
              <button onClick={() => setShowDialog(false)} className="vb6-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
