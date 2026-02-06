import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Palette,
  Type,
  MoreHorizontal,
  FileImage,
  Settings,
  ChevronDown,
  X,
  Check,
  Eye,
  Folder,
} from 'lucide-react';

// Color Picker Editor
export const ColorEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const vb6Colors = [
    { name: 'Black', value: '#000000', vbValue: '&H0&' },
    { name: 'Dark Red', value: '#800000', vbValue: '&H80&' },
    { name: 'Dark Green', value: '#008000', vbValue: '&H8000&' },
    { name: 'Dark Yellow', value: '#808000', vbValue: '&H8080&' },
    { name: 'Dark Blue', value: '#000080', vbValue: '&H800000' },
    { name: 'Dark Magenta', value: '#800080', vbValue: '&H800080&' },
    { name: 'Dark Cyan', value: '#008080', vbValue: '&H808000&' },
    { name: 'Gray', value: '#808080', vbValue: '&H808080&' },
    { name: 'Light Gray', value: '#c0c0c0', vbValue: '&HC0C0C0&' },
    { name: 'Red', value: '#ff0000', vbValue: '&HFF&' },
    { name: 'Green', value: '#00ff00', vbValue: '&HFF00&' },
    { name: 'Yellow', value: '#ffff00', vbValue: '&HFFFF&' },
    { name: 'Blue', value: '#0000ff', vbValue: '&HFF0000&' },
    { name: 'Magenta', value: '#ff00ff', vbValue: '&HFF00FF&' },
    { name: 'Cyan', value: '#00ffff', vbValue: '&HFFFF00&' },
    { name: 'White', value: '#ffffff', vbValue: '&HFFFFFF&' },
  ];

  const systemColors = [
    { name: 'Button Face', value: '#f0f0f0', vbValue: '&H8000000F&' },
    { name: 'Button Text', value: '#000000', vbValue: '&H80000012&' },
    { name: 'Window Background', value: '#ffffff', vbValue: '&H80000005&' },
    { name: 'Window Text', value: '#000000', vbValue: '&H80000008&' },
    { name: 'Highlight', value: '#316ac5', vbValue: '&H8000000D&' },
    { name: 'Highlight Text', value: '#ffffff', vbValue: '&H8000000E&' },
  ];

  const handleColorSelect = (colorValue: string) => {
    onChange(colorValue);
    setShowPicker(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div
        className="w-6 h-4 border border-gray-400 cursor-pointer flex-shrink-0"
        style={{ backgroundColor: value }}
        onClick={() => setShowPicker(!showPicker)}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onFinish}
        className="flex-1 ml-1 text-xs border-0 outline-none"
      />

      {showPicker && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gray-400 shadow-lg p-2">
          <div className="mb-2">
            <div className="text-xs font-bold mb-1">Basic Colors</div>
            <div className="grid grid-cols-8 gap-1">
              {vb6Colors.map(color => (
                <div
                  key={color.name}
                  className="w-6 h-4 border border-gray-400 cursor-pointer"
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-2">
            <div className="text-xs font-bold mb-1">System Colors</div>
            <div className="grid grid-cols-4 gap-1">
              {systemColors.map(color => (
                <div
                  key={color.name}
                  className="w-6 h-4 border border-gray-400 cursor-pointer"
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.vbValue)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-2">
            <div className="text-xs font-bold mb-1">Custom Color</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                className="w-8 h-6"
              />
              <button
                onClick={() => handleColorSelect(customColor)}
                className="px-2 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
              >
                OK
              </button>
              <button
                onClick={() => setShowPicker(false)}
                className="px-2 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
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

// Font Editor
export const FontEditor: React.FC<{
  value: any;
  onChange: (value: any) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFont, setSelectedFont] = useState({
    name: value?.name || 'MS Sans Serif',
    size: value?.size || 8,
    bold: value?.bold || false,
    italic: value?.italic || false,
    underline: value?.underline || false,
    strikethrough: value?.strikethrough || false,
  });

  const fonts = [
    'MS Sans Serif',
    'Arial',
    'Times New Roman',
    'Courier New',
    'Tahoma',
    'Verdana',
    'Georgia',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Arial Black',
    'Palatino',
  ];

  const sizes = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  const handleOK = () => {
    onChange(selectedFont);
    setShowDialog(false);
    onFinish();
  };

  const fontDisplay = `${selectedFont.name}, ${selectedFont.size}pt${selectedFont.bold ? ', Bold' : ''}${selectedFont.italic ? ', Italic' : ''}`;

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {fontDisplay}
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
            {/* Title Bar */}
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Font</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Font Name */}
                <div>
                  <label className="text-xs font-bold">Font:</label>
                  <select
                    value={selectedFont.name}
                    onChange={e => setSelectedFont({ ...selectedFont, name: e.target.value })}
                    className="w-full mt-1 text-xs border border-gray-400 p-1"
                    size={8}
                  >
                    {fonts.map(font => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs font-bold">Size:</label>
                  <select
                    value={selectedFont.size}
                    onChange={e =>
                      setSelectedFont({ ...selectedFont, size: parseInt(e.target.value) })
                    }
                    className="w-full mt-1 text-xs border border-gray-400 p-1"
                    size={8}
                  >
                    {sizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Font Style */}
              <div className="mb-3">
                <label className="text-xs font-bold">Font style:</label>
                <div className="mt-1 space-y-1">
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={selectedFont.bold}
                      onChange={e => setSelectedFont({ ...selectedFont, bold: e.target.checked })}
                      className="mr-2"
                    />
                    Bold
                  </label>
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={selectedFont.italic}
                      onChange={e => setSelectedFont({ ...selectedFont, italic: e.target.checked })}
                      className="mr-2"
                    />
                    Italic
                  </label>
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={selectedFont.underline}
                      onChange={e =>
                        setSelectedFont({ ...selectedFont, underline: e.target.checked })
                      }
                      className="mr-2"
                    />
                    Underline
                  </label>
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={selectedFont.strikethrough}
                      onChange={e =>
                        setSelectedFont({ ...selectedFont, strikethrough: e.target.checked })
                      }
                      className="mr-2"
                    />
                    Strikeout
                  </label>
                </div>
              </div>

              {/* Sample */}
              <div className="mb-3">
                <label className="text-xs font-bold">Sample:</label>
                <div
                  className="mt-1 p-2 border border-gray-400 bg-white text-center"
                  style={{
                    fontFamily: selectedFont.name,
                    fontSize: `${selectedFont.size}pt`,
                    fontWeight: selectedFont.bold ? 'bold' : 'normal',
                    fontStyle: selectedFont.italic ? 'italic' : 'normal',
                    textDecoration:
                      `${selectedFont.underline ? 'underline' : ''} ${selectedFont.strikethrough ? 'line-through' : ''}`.trim(),
                  }}
                >
                  AaBbYyZz
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleOK}
                  className="px-3 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-3 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Picture Editor
export const PictureEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        onChange(result);
        setShowDialog(false);
        onFinish();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setShowDialog(false);
    onFinish();
  };

  return (
    <div className="relative flex items-center">
      <div className="flex-1 text-xs cursor-pointer" onClick={() => setShowDialog(true)}>
        {value ? '(Picture)' : '(None)'}
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
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 border border-gray-400 shadow-lg w-80">
            {/* Title Bar */}
            <div className="bg-blue-600 text-white px-2 py-1 flex justify-between items-center text-sm">
              <span>Load Picture</span>
              <button
                onClick={() => setShowDialog(false)}
                className="text-white hover:bg-blue-700 px-1"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="mb-3">
                <div className="text-xs mb-2">Current Picture:</div>
                <div className="border border-gray-400 bg-white p-2 h-32 flex items-center justify-center">
                  {value ? (
                    <img
                      src={value}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-xs">No picture</div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleBrowse}
                  className="px-3 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300 flex items-center gap-1"
                >
                  <Folder size={12} />
                  Browse...
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-3 py-1 text-xs bg-gray-200 border border-gray-400 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enum Dropdown Editor
export const EnumEditor: React.FC<{
  value: string;
  enumValues: string[];
  onChange: (value: string) => void;
  onFinish: () => void;
}> = ({ value, enumValues, onChange, onFinish }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (enumValue: string) => {
    onChange(enumValue);
    setIsOpen(false);
    onFinish();
  };

  const currentValue = enumValues.find(ev => ev.startsWith(value + ' ')) || value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center justify-between cursor-pointer text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex-1">{currentValue}</span>
        <ChevronDown size={12} className="ml-1" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-400 shadow-lg z-50 max-h-32 overflow-y-auto">
          {enumValues.map(enumValue => (
            <div
              key={enumValue}
              className="px-2 py-1 text-xs hover:bg-blue-100 cursor-pointer"
              onClick={() => handleSelect(enumValue)}
            >
              {enumValue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Boolean Editor
export const BooleanEditor: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
  onFinish: () => void;
}> = ({ value, onChange, onFinish }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (boolValue: boolean) => {
    onChange(boolValue);
    setIsOpen(false);
    onFinish();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center justify-between cursor-pointer text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex-1">{value ? 'True' : 'False'}</span>
        <ChevronDown size={12} className="ml-1" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-400 shadow-lg z-50">
          <div
            className="px-2 py-1 text-xs hover:bg-blue-100 cursor-pointer"
            onClick={() => handleSelect(true)}
          >
            True
          </div>
          <div
            className="px-2 py-1 text-xs hover:bg-blue-100 cursor-pointer"
            onClick={() => handleSelect(false)}
          >
            False
          </div>
        </div>
      )}
    </div>
  );
};

// String Editor
export const StringEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFinish: () => void;
  multiline?: boolean;
}> = ({ value, onChange, onFinish, multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      setEditing(false);
      onFinish();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  const handleBlur = () => {
    setEditing(false);
    onFinish();
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full text-xs border-0 outline-none resize-none"
          rows={3}
        />
      );
    } else {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full text-xs border-0 outline-none"
        />
      );
    }
  }

  return (
    <div className="text-xs cursor-text flex-1" onClick={() => setEditing(true)}>
      {value || '\u00A0'}
    </div>
  );
};

// Number Editor
export const NumberEditor: React.FC<{
  value: number;
  onChange: (value: number) => void;
  onFinish: () => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onChange, onFinish, min, max, step = 1 }) => {
  const [editing, setEditing] = useState(false);
  const [textValue, setTextValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const numValue = parseFloat(textValue) || 0;
      const clampedValue = Math.max(min || -Infinity, Math.min(max || Infinity, numValue));
      onChange(clampedValue);
      setEditing(false);
      onFinish();
    } else if (e.key === 'Escape') {
      setTextValue(String(value));
      setEditing(false);
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(textValue) || 0;
    const clampedValue = Math.max(min || -Infinity, Math.min(max || Infinity, numValue));
    onChange(clampedValue);
    setEditing(false);
    onFinish();
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setTextValue(String(value));
  }, [value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full text-xs border-0 outline-none"
      />
    );
  }

  return (
    <div className="text-xs cursor-text flex-1" onClick={() => setEditing(true)}>
      {value}
    </div>
  );
};
