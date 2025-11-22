import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Control } from '../../context/types';

interface CommonDialogProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

interface FileFilter {
  description: string;
  extension: string;
}

const CommonDialog: React.FC<CommonDialogProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showColorDialog, setShowColorDialog] = useState(false);
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const properties = control.properties || {};

  // VB6 CommonDialog Properties
  const action = properties.Action || 0;
  const dialogTitle = properties.DialogTitle || '';
  const fileName = properties.FileName || '';
  const fileTitle = properties.FileTitle || '';
  const filter = properties.Filter || 'All Files (*.*)|*.*';
  const filterIndex = properties.FilterIndex || 1;
  const flags = properties.Flags || 0;
  const initDir = properties.InitDir || '';
  const maxFileSize = properties.MaxFileSize || 260;
  const defaultExt = properties.DefaultExt || '';
  
  // Color dialog properties
  const color = properties.Color || 0x000000;
  const customColors = properties.CustomColors || new Array(16).fill(0xFFFFFF);
  
  // Font dialog properties
  const fontName = properties.FontName || 'MS Sans Serif';
  const fontSize = properties.FontSize || 8;
  const fontBold = properties.FontBold === true;
  const fontItalic = properties.FontItalic === true;
  const fontUnderline = properties.FontUnderline === true;
  const fontStrikethru = properties.FontStrikethru === true;
  
  // Print dialog properties
  const copies = properties.Copies || 1;
  const fromPage = properties.FromPage || 1;
  const toPage = properties.ToPage || 1;
  const maxPage = properties.MaxPage || 9999;
  const minPage = properties.MinPage || 1;

  // Convert VB6 filter format to HTML input accept format
  const parseFilter = useCallback((filterStr: string): FileFilter[] => {
    const filters: FileFilter[] = [];
    const parts = filterStr.split('|');
    
    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        filters.push({
          description: parts[i],
          extension: parts[i + 1]
        });
      }
    }
    
    return filters;
  }, []);

  // Convert filter to HTML accept attribute
  const getAcceptAttribute = useCallback((filterStr: string, index: number): string => {
    const filters = parseFilter(filterStr);
    if (index > 0 && index <= filters.length) {
      const filter = filters[index - 1];
      return filter.extension.replace(/\*\./g, '.').replace(/;/g, ',');
    }
    return '*/*';
  }, [parseFilter]);

  // VB6 Methods
  const vb6Methods = useMemo(() => ({
    ShowOpen: () => {
      if (fileInputRef.current) {
        fileInputRef.current.multiple = false;
        fileInputRef.current.webkitdirectory = false;
        fileInputRef.current.accept = getAcceptAttribute(filter, filterIndex);
        fileInputRef.current.click();
      }
    },
    
    ShowSave: () => {
      // HTML5 doesn't have a native save dialog, simulate with download
      const link = document.createElement('a');
      link.download = fileName || 'untitled.txt';
      link.href = 'data:text/plain;charset=utf-8,'; // Empty file
      link.click();
    },
    
    ShowColor: () => {
      setShowColorDialog(true);
    },
    
    ShowFont: () => {
      setShowFontDialog(true);
    },
    
    ShowPrinter: () => {
      setShowPrintDialog(true);
    },
    
    ShowHelp: () => {
      // Simulate help dialog
      alert('Help dialog would open here');
    }
  }), [filter, filterIndex, fileName, control.events, fileInputRef]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Update properties
      if (control.events?.onChange) {
        control.events.onChange('FileName', file.name);
        control.events.onChange('FileTitle', file.name.split('.')[0]);
      }
      
      // Trigger Cancel event (VB6 uses 0 for OK, non-zero for Cancel)
      if (control.events?.Cancel) {
        control.events.Cancel(0); // OK
      }
    }
  }, [control.events]);

  // Color picker component
  const ColorPicker: React.FC<{ onClose: (color?: string) => void }> = ({ onClose }) => {
    const [selectedColor, setSelectedColor] = useState(`#${color.toString(16).padStart(6, '0')}`);
    
    const standardColors = [
      '#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#C0C0C0',
      '#808080', '#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF'
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-200 border-2 border-gray-400 p-4 w-96">
          <div className="bg-blue-600 text-white p-2 mb-3 font-bold text-sm">Color</div>
          
          <div className="mb-4">
            <div className="text-xs font-bold mb-2">Basic colors:</div>
            <div className="grid grid-cols-8 gap-1 mb-4">
              {standardColors.map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 border border-gray-400 cursor-pointer hover:border-black"
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            
            <div className="text-xs font-bold mb-2">Custom colors:</div>
            <div className="grid grid-cols-8 gap-1 mb-4">
              {customColors.map((_, index) => (
                <div
                  key={index}
                  className="w-8 h-8 border border-gray-400 bg-white cursor-pointer hover:border-black"
                  onClick={() => {
                    // In real VB6, this would open custom color picker
                    const customColor = prompt('Enter hex color (e.g., #FF0000):');
                    if (customColor) {
                      setSelectedColor(customColor);
                    }
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-xs font-bold block mb-1">Color:</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full h-8 border border-gray-400"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={() => onClose(selectedColor)}
            >
              OK
            </button>
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={() => onClose()}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Font picker component
  const FontPicker: React.FC<{ onClose: (font?: any) => void }> = ({ onClose }) => {
    const [selectedFont, setSelectedFont] = useState(fontName);
    const [selectedSize, setSelectedSize] = useState(fontSize);
    const [isBold, setIsBold] = useState(fontBold);
    const [isItalic, setIsItalic] = useState(fontItalic);
    const [isUnderline, setIsUnderline] = useState(fontUnderline);
    const [isStrikethru, setIsStrikethru] = useState(fontStrikethru);

    const fonts = [
      'MS Sans Serif', 'Arial', 'Times New Roman', 'Courier New', 'Verdana',
      'Tahoma', 'Georgia', 'Trebuchet MS', 'Comic Sans MS', 'Impact'
    ];
    
    const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-200 border-2 border-gray-400 p-4 w-96">
          <div className="bg-blue-600 text-white p-2 mb-3 font-bold text-sm">Font</div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs font-bold mb-1">Font:</div>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full border border-gray-400 p-1 text-xs"
                size={6}
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            
            <div>
              <div className="text-xs font-bold mb-1">Size:</div>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(Number(e.target.value))}
                className="w-full border border-gray-400 p-1 text-xs"
                size={6}
              >
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs font-bold mb-2">Effects:</div>
            <div className="space-y-1">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={isBold}
                  onChange={(e) => setIsBold(e.target.checked)}
                  className="mr-2"
                />
                Bold
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={isItalic}
                  onChange={(e) => setIsItalic(e.target.checked)}
                  className="mr-2"
                />
                Italic
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={isUnderline}
                  onChange={(e) => setIsUnderline(e.target.checked)}
                  className="mr-2"
                />
                Underline
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={isStrikethru}
                  onChange={(e) => setIsStrikethru(e.target.checked)}
                  className="mr-2"
                />
                Strikeout
              </label>
            </div>
          </div>
          
          <div className="mb-4 p-2 bg-white border border-gray-400">
            <div className="text-xs font-bold mb-1">Sample:</div>
            <div
              style={{
                fontFamily: selectedFont,
                fontSize: `${selectedSize}pt`,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
                textDecoration: `${isUnderline ? 'underline' : ''} ${isStrikethru ? 'line-through' : ''}`.trim()
              }}
            >
              AaBbYyZz
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={() => onClose({
                fontName: selectedFont,
                fontSize: selectedSize,
                fontBold: isBold,
                fontItalic: isItalic,
                fontUnderline: isUnderline,
                fontStrikethru: isStrikethru
              })}
            >
              OK
            </button>
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={() => onClose()}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Print dialog component
  const PrintDialog: React.FC<{ onClose: (options?: any) => void }> = ({ onClose }) => {
    const [printCopies, setPrintCopies] = useState(copies);
    const [printFromPage, setPrintFromPage] = useState(fromPage);
    const [printToPage, setPrintToPage] = useState(toPage);
    const [printRange, setPrintRange] = useState<'all' | 'pages' | 'selection'>('all');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-200 border-2 border-gray-400 p-4 w-80">
          <div className="bg-blue-600 text-white p-2 mb-3 font-bold text-sm">Print</div>
          
          <div className="mb-4">
            <div className="text-xs font-bold mb-2">Printer:</div>
            <div className="text-xs p-2 bg-white border border-gray-400">
              Default Printer (Simulated)
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs font-bold mb-2">Print range:</div>
            <div className="space-y-1">
              <label className="flex items-center text-xs">
                <input
                  type="radio"
                  name="printRange"
                  checked={printRange === 'all'}
                  onChange={() => setPrintRange('all')}
                  className="mr-2"
                />
                All
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="radio"
                  name="printRange"
                  checked={printRange === 'pages'}
                  onChange={() => setPrintRange('pages')}
                  className="mr-2"
                />
                Pages from
                <input
                  type="number"
                  value={printFromPage}
                  onChange={(e) => setPrintFromPage(Number(e.target.value))}
                  className="w-12 mx-1 px-1 border border-gray-400 text-xs"
                  min={minPage}
                  max={maxPage}
                />
                to
                <input
                  type="number"
                  value={printToPage}
                  onChange={(e) => setPrintToPage(Number(e.target.value))}
                  className="w-12 ml-1 px-1 border border-gray-400 text-xs"
                  min={minPage}
                  max={maxPage}
                />
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="radio"
                  name="printRange"
                  checked={printRange === 'selection'}
                  onChange={() => setPrintRange('selection')}
                  className="mr-2"
                />
                Selection
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-xs font-bold block mb-1">Copies:</label>
            <input
              type="number"
              value={printCopies}
              onChange={(e) => setPrintCopies(Number(e.target.value))}
              className="w-16 px-1 border border-gray-400 text-xs"
              min={1}
              max={999}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={() => {
                // Simulate printing
                window.print();
                onClose({
                  copies: printCopies,
                  fromPage: printFromPage,
                  toPage: printToPage,
                  range: printRange
                });
              }}
            >
              OK
            </button>
            <button
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
              onClick={() => onClose()}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();

    if (e.detail === 2) {
      onDoubleClick();
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Auto-execute action when Action property changes
  React.useEffect(() => {
    switch (action) {
      case 1: vb6Methods.ShowOpen(); break;
      case 2: vb6Methods.ShowSave(); break;
      case 3: vb6Methods.ShowColor(); break;
      case 4: vb6Methods.ShowFont(); break;
      case 5: vb6Methods.ShowPrinter(); break;
      case 6: vb6Methods.ShowHelp(); break;
    }
  }, [action, vb6Methods]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: 32,
    height: 32,
    border: selected ? '2px dashed #0066cc' : '1px solid #808080',
    backgroundColor: '#c0c0c0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isDragging ? 'move' : 'default',
    fontSize: '16px'
  };

  return (
    <>
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={handleMouseDown}
        className="vb6-commondialog"
        title="CommonDialog"
      >
        📋
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Color Dialog */}
      {showColorDialog && (
        <ColorPicker
          onClose={(color) => {
            setShowColorDialog(false);
            if (color && control.events?.onChange) {
              const colorValue = parseInt(color.slice(1), 16);
              control.events.onChange('Color', colorValue);
            }
            if (control.events?.Cancel) {
              control.events.Cancel(color ? 0 : 1);
            }
          }}
        />
      )}

      {/* Font Dialog */}
      {showFontDialog && (
        <FontPicker
          onClose={(font) => {
            setShowFontDialog(false);
            if (font && control.events?.onChange) {
              Object.keys(font).forEach(key => {
                control.events!.onChange!(key, font[key]);
              });
            }
            if (control.events?.Cancel) {
              control.events.Cancel(font ? 0 : 1);
            }
          }}
        />
      )}

      {/* Print Dialog */}
      {showPrintDialog && (
        <PrintDialog
          onClose={(options) => {
            setShowPrintDialog(false);
            if (options && control.events?.onChange) {
              Object.keys(options).forEach(key => {
                control.events!.onChange!(key, options[key]);
              });
            }
            if (control.events?.Cancel) {
              control.events.Cancel(options ? 0 : 1);
            }
          }}
        />
      )}
    </>
  );
};

export default CommonDialog;