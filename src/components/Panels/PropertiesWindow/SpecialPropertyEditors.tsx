import React, { useState, useRef, useCallback } from 'react';
import {
  Monitor,
  Palette,
  Grid3X3,
  Image,
  FileText,
  Database,
  Calendar,
  Clock,
  Layers,
  Move,
  RotateCcw,
  ZoomIn,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Type,
  Hash,
  Percent,
  DollarSign,
  X,
  Check,
  Plus,
  Minus,
  Settings,
  Eye,
  List,
  ChevronDown,
} from 'lucide-react';

// Screen Position Editor for StartUpPosition property
export const ScreenPositionEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(value);

  const positions = [
    { value: '0 - Manual', label: 'Manual', icon: <Move size={16} /> },
    { value: '1 - CenterOwner', label: 'Center Owner', icon: <AlignCenter size={16} /> },
    { value: '2 - CenterScreen', label: 'Center Screen', icon: <Monitor size={16} /> },
    { value: '3 - Windows Default', label: 'Windows Default', icon: <Settings size={16} /> },
  ];

  const handleSave = () => {
    onChange(selectedPosition);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value}
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
              <span>Startup Position</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="space-y-2">
                {positions.map(pos => (
                  <label
                    key={pos.value}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="position"
                      value={pos.value}
                      checked={selectedPosition === pos.value}
                      onChange={e => setSelectedPosition(e.target.value)}
                      className="mr-3"
                    />
                    <span className="mr-2">{pos.icon}</span>
                    <div>
                      <div className="font-semibold text-xs">{pos.label}</div>
                      <div className="text-xs text-gray-600">{pos.value}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 bg-white border border-gray-400">
                <div className="text-xs font-bold mb-2">Preview:</div>
                <div className="relative bg-blue-100 h-24 border border-gray-400">
                  <div className="absolute w-8 h-6 bg-white border border-gray-400 text-xs flex items-center justify-center">
                    Form
                  </div>
                </div>
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

// Scale Mode Editor for graphics operations
export const ScaleModeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMode, setSelectedMode] = useState(value);

  const scaleModes = [
    { value: '0 - User', description: 'User-defined coordinate system' },
    { value: '1 - Twip', description: '1440 twips per inch' },
    { value: '2 - Point', description: '72 points per inch' },
    { value: '3 - Pixel', description: 'Screen pixel' },
    { value: '4 - Character', description: '120 twips horizontally, 240 twips vertically' },
    { value: '5 - Inch', description: 'Inch' },
    { value: '6 - Millimeter', description: 'Millimeter' },
    { value: '7 - Centimeter', description: 'Centimeter' },
  ];

  const handleSave = () => {
    onChange(selectedMode);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value}
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
              <span>Scale Mode</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="border border-gray-400 bg-white h-40 overflow-y-auto">
                {scaleModes.map(mode => (
                  <div
                    key={mode.value}
                    className={`p-2 cursor-pointer text-xs hover:bg-blue-100 ${
                      selectedMode === mode.value ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => setSelectedMode(mode.value)}
                  >
                    <div className="font-semibold">{mode.value}</div>
                    <div className="text-gray-600">{mode.description}</div>
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

// Format String Editor for Format function
export const FormatStringEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
  dataType?: 'number' | 'date' | 'string';
}> = ({ value, onChange, onFinish, dataType = 'number' }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [formatString, setFormatString] = useState(value);
  const [previewValue, setPreviewValue] = useState('');

  const numberFormats = [
    { format: 'General Number', code: '', example: '123.45' },
    { format: 'Currency', code: 'Currency', example: '$123.45' },
    { format: 'Fixed', code: 'Fixed', example: '123.45' },
    { format: 'Standard', code: 'Standard', example: '123.45' },
    { format: 'Percent', code: 'Percent', example: '12.35%' },
    { format: 'Scientific', code: 'Scientific', example: '1.23E+02' },
    { format: 'Yes/No', code: 'Yes/No', example: 'Yes' },
    { format: 'True/False', code: 'True/False', example: 'True' },
    { format: 'On/Off', code: 'On/Off', example: 'On' },
  ];

  const dateFormats = [
    { format: 'General Date', code: 'General Date', example: '12/30/2023 3:45:12 PM' },
    { format: 'Long Date', code: 'Long Date', example: 'Saturday, December 30, 2023' },
    { format: 'Medium Date', code: 'Medium Date', example: '30-Dec-23' },
    { format: 'Short Date', code: 'Short Date', example: '12/30/2023' },
    { format: 'Long Time', code: 'Long Time', example: '3:45:12 PM' },
    { format: 'Medium Time', code: 'Medium Time', example: '03:45 PM' },
    { format: 'Short Time', code: 'Short Time', example: '15:45' },
  ];

  const customPatterns =
    dataType === 'number'
      ? [
          { pattern: '#,##0.00', description: 'Number with thousands separator and 2 decimals' },
          { pattern: '0.00%', description: 'Percentage with 2 decimals' },
          {
            pattern: '$#,##0.00;($#,##0.00)',
            description: 'Currency with negative in parentheses',
          },
          { pattern: '#,##0;-#,##0;"Zero"', description: 'Positive, negative, and zero formats' },
        ]
      : [
          { pattern: 'yyyy-mm-dd', description: 'ISO date format' },
          { pattern: 'dddd, mmmm dd, yyyy', description: 'Full date with day name' },
          { pattern: 'hh:mm:ss AM/PM', description: '12-hour time with seconds' },
          { pattern: 'yyyy-mm-dd hh:mm:ss', description: 'ISO datetime format' },
        ];

  const formatOptions = dataType === 'date' ? dateFormats : numberFormats;

  const updatePreview = (format: string) => {
    // Simulate format preview
    const now = new Date();
    const sampleNumber = 1234.56;

    switch (format) {
      case 'Currency':
        setPreviewValue('$1,234.56');
        break;
      case 'Fixed':
        setPreviewValue('1234.56');
        break;
      case 'Standard':
        setPreviewValue('1,234.56');
        break;
      case 'Percent':
        setPreviewValue('123456.00%');
        break;
      case 'Scientific':
        setPreviewValue('1.23E+03');
        break;
      case 'Long Date':
        setPreviewValue(
          now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );
        break;
      case 'Short Date':
        setPreviewValue(now.toLocaleDateString());
        break;
      case 'Long Time':
        setPreviewValue(now.toLocaleTimeString());
        break;
      default:
        setPreviewValue(format || '1234.56');
    }
  };

  const handleFormatSelect = (format: string) => {
    setFormatString(format);
    updatePreview(format);
  };

  const handleSave = () => {
    onChange(formatString);
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
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-[500px]">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Format</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Format List */}
                <div>
                  <div className="text-xs font-bold mb-2">Format Types:</div>
                  <div className="border border-gray-400 bg-white h-32 overflow-y-auto">
                    {formatOptions.map(fmt => (
                      <div
                        key={fmt.code}
                        className={`p-1 cursor-pointer text-xs hover:bg-blue-100 ${
                          formatString === fmt.code ? 'bg-blue-100' : ''
                        }`}
                        onClick={() => handleFormatSelect(fmt.code)}
                      >
                        {fmt.format}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Patterns */}
                <div>
                  <div className="text-xs font-bold mb-2">Custom Patterns:</div>
                  <div className="border border-gray-400 bg-white h-32 overflow-y-auto">
                    {customPatterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="p-1 cursor-pointer text-xs hover:bg-blue-100"
                        onClick={() => handleFormatSelect(pattern.pattern)}
                        title={pattern.description}
                      >
                        <div className="font-mono">{pattern.pattern}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Format Input */}
              <div className="mt-3">
                <div className="text-xs font-bold mb-1">Custom Format:</div>
                <input
                  type="text"
                  value={formatString}
                  onChange={e => {
                    setFormatString(e.target.value);
                    updatePreview(e.target.value);
                  }}
                  className="w-full text-xs border border-gray-400 p-1"
                  placeholder="Enter custom format string"
                />
              </div>

              {/* Preview */}
              <div className="mt-3">
                <div className="text-xs font-bold mb-1">Preview:</div>
                <div className="border border-gray-400 bg-white p-2 text-xs font-mono">
                  {previewValue || 'Enter a format string'}
                </div>
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

// Array Editor for arrays and collections
export const ArrayEditor: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
  onFinish: () => void;
  itemType?: 'string' | 'number';
}> = ({ value, onChange, onFinish, itemType = 'string' }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [items, setItems] = useState<string[]>(value || []);
  const [newItem, setNewItem] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  const moveItemUp = (index: number) => {
    if (index > 0) {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setItems(newItems);
      setSelectedIndex(index - 1);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < items.length - 1) {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setItems(newItems);
      setSelectedIndex(index + 1);
    }
  };

  const handleSave = () => {
    onChange(items);
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value && value.length > 0 ? `${value.length} items` : '(Empty)'}
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
              <span>String Collection Editor</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              {/* Items List */}
              <div className="mb-3">
                <div className="text-xs font-bold mb-1">Items:</div>
                <div className="border border-gray-400 bg-white h-32 overflow-y-auto">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className={`p-1 cursor-pointer text-xs hover:bg-blue-100 ${
                        selectedIndex === index ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <span className="text-gray-500 mr-2">{index}:</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Item */}
              <div className="mb-3 flex gap-1">
                <input
                  type="text"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addItem()}
                  placeholder="New item"
                  className="flex-1 text-xs border border-gray-400 p-1"
                />
                <button onClick={addItem} className="vb6-button">
                  <Plus size={12} />
                </button>
              </div>

              {/* Item Controls */}
              <div className="flex gap-1">
                <button
                  onClick={() => selectedIndex !== null && removeItem(selectedIndex)}
                  disabled={selectedIndex === null}
                  className="vb6-button"
                >
                  <Minus size={12} />
                </button>
                <button
                  onClick={() => selectedIndex !== null && moveItemUp(selectedIndex)}
                  disabled={selectedIndex === null || selectedIndex === 0}
                  className="vb6-button"
                >
                  ↑
                </button>
                <button
                  onClick={() => selectedIndex !== null && moveItemDown(selectedIndex)}
                  disabled={selectedIndex === null || selectedIndex === items.length - 1}
                  className="vb6-button"
                >
                  ↓
                </button>
                <div className="flex-1" />
                <button onClick={() => setItems([])} className="vb6-button">
                  Clear All
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

// Mask Editor for input masks
export const MaskEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [mask, setMask] = useState(value);
  const [testInput, setTestInput] = useState('');

  const commonMasks = [
    { name: 'Phone Number', mask: '(999) 000-0000', example: '(555) 123-4567' },
    { name: 'Social Security', mask: '000-00-0000', example: '123-45-6789' },
    { name: 'ZIP Code', mask: '00000-9999', example: '12345-6789' },
    { name: 'Date', mask: '00/00/0000', example: '12/31/2023' },
    { name: 'Time', mask: '00:00', example: '15:30' },
    { name: 'Credit Card', mask: '0000-0000-0000-0000', example: '1234-5678-9012-3456' },
    { name: 'License Plate', mask: 'LLL-0000', example: 'ABC-1234' },
  ];

  const maskChars = [
    { char: '0', description: 'Digit (0-9, entry required)' },
    { char: '9', description: 'Digit or space (entry not required)' },
    { char: '#', description: 'Digit or space (entry not required; Plus and minus signs allowed)' },
    { char: 'L', description: 'Letter (A-Z, entry required)' },
    { char: '?', description: 'Letter (A-Z, entry not required)' },
    { char: 'A', description: 'Alphanumeric (0-9 and A-Z, entry required)' },
    { char: 'a', description: 'Alphanumeric (0-9 and A-Z, entry not required)' },
    { char: '&', description: 'Any character or a space (entry required)' },
    { char: 'C', description: 'Any character or a space (entry not required)' },
  ];

  const handleSave = () => {
    onChange(mask);
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
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-[500px]">
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Input Mask</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Common Masks */}
                <div>
                  <div className="text-xs font-bold mb-2">Common Masks:</div>
                  <div className="border border-gray-400 bg-white h-32 overflow-y-auto">
                    {commonMasks.map(item => (
                      <div
                        key={item.name}
                        className="p-1 cursor-pointer text-xs hover:bg-blue-100"
                        onClick={() => setMask(item.mask)}
                      >
                        <div className="font-semibold">{item.name}</div>
                        <div className="font-mono text-gray-600">{item.mask}</div>
                        <div className="text-gray-500">{item.example}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mask Characters */}
                <div>
                  <div className="text-xs font-bold mb-2">Mask Characters:</div>
                  <div className="border border-gray-400 bg-white h-32 overflow-y-auto">
                    {maskChars.map(item => (
                      <div key={item.char} className="p-1 text-xs">
                        <span className="font-mono font-bold mr-2">{item.char}</span>
                        <span className="text-gray-600">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Mask */}
              <div className="mt-3">
                <div className="text-xs font-bold mb-1">Input Mask:</div>
                <input
                  type="text"
                  value={mask}
                  onChange={e => setMask(e.target.value)}
                  className="w-full text-xs border border-gray-400 p-1 font-mono"
                  placeholder="Enter mask pattern"
                />
              </div>

              {/* Test Input */}
              <div className="mt-3">
                <div className="text-xs font-bold mb-1">Test Input:</div>
                <input
                  type="text"
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  className="w-full text-xs border border-gray-400 p-1"
                  placeholder="Test the mask here"
                />
              </div>

              {/* Preview */}
              <div className="mt-3">
                <div className="text-xs font-bold mb-1">Preview:</div>
                <div className="border border-gray-400 bg-white p-2 text-xs font-mono">
                  {mask || 'Enter a mask pattern'}
                </div>
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
