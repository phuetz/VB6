import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Control } from '../../context/types';

interface MaskedEditProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

const MaskedEdit: React.FC<MaskedEditProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const properties = control.properties || {};

  // VB6 MaskedEdit Properties
  const mask = properties.Mask || '';
  const text = properties.Text || '';
  const clipText = properties.ClipText || '';
  const formattedText = properties.FormattedText || '';
  const promptChar = properties.PromptChar || '_';
  const promptInclude = properties.PromptInclude === true;
  const allowPrompt = properties.AllowPrompt !== false;
  const autoTab = properties.AutoTab === true;
  const hideSelection = properties.HideSelection === true;
  const maxLength = properties.MaxLength || 0;
  const passwordChar = properties.PasswordChar || '';
  const rightToLeft = properties.RightToLeft === true;
  const selectionStart = properties.SelStart || 0;
  const selectionLength = properties.SelLength || 0;

  // Mask character definitions (VB6 standard)
  const maskChars = {
    '0': { pattern: /[0-9]/, required: true, description: 'Digit (0-9)' },
    '9': { pattern: /[0-9]/, required: false, description: 'Digit or space' },
    '#': { pattern: /[0-9+\-\s]/, required: false, description: 'Digit, +, -, or space' },
    'L': { pattern: /[A-Za-z]/, required: true, description: 'Letter (A-Z)' },
    '?': { pattern: /[A-Za-z]/, required: false, description: 'Letter or space' },
    'A': { pattern: /[A-Za-z0-9]/, required: true, description: 'Alphanumeric' },
    'a': { pattern: /[A-Za-z0-9]/, required: false, description: 'Alphanumeric or space' },
    '&': { pattern: /./, required: true, description: 'Any character' },
    'C': { pattern: /./, required: false, description: 'Any character or space' },
    '.': { literal: true, char: '.' },
    ',': { literal: true, char: ',' },
    ':': { literal: true, char: ':' },
    ';': { literal: true, char: ';' },
    '-': { literal: true, char: '-' },
    '/': { literal: true, char: '/' },
    '(': { literal: true, char: '(' },
    ')': { literal: true, char: ')' },
    ' ': { literal: true, char: ' ' }
  };

  // Parse mask into segments
  const parseMask = useCallback((maskStr: string) => {
    const segments: Array<{
      type: 'input' | 'literal';
      char: string;
      pattern?: RegExp;
      required?: boolean;
      position: number;
    }> = [];

    for (let i = 0; i < maskStr.length; i++) {
      const char = maskStr[i];
      const maskDef = maskChars[char as keyof typeof maskChars];

      if (maskDef) {
        if (maskDef.literal) {
          segments.push({
            type: 'literal',
            char: maskDef.char,
            position: i
          });
        } else {
          segments.push({
            type: 'input',
            char,
            pattern: maskDef.pattern,
            required: maskDef.required,
            position: i
          });
        }
      } else {
        // Treat unknown characters as literals
        segments.push({
          type: 'literal',
          char,
          position: i
        });
      }
    }

    return segments;
  }, []);

  // Apply mask to input value
  const applyMask = useCallback((value: string, maskStr: string) => {
    if (!maskStr) return value;

    const segments = parseMask(maskStr);
    let result = '';
    let valueIndex = 0;

    for (const segment of segments) {
      if (segment.type === 'literal') {
        result += segment.char;
      } else {
        if (valueIndex < value.length) {
          const inputChar = value[valueIndex];
          if (segment.pattern && segment.pattern.test(inputChar)) {
            result += inputChar;
            valueIndex++;
          } else if (segment.required) {
            result += allowPrompt ? promptChar : '';
          } else {
            result += allowPrompt ? promptChar : '';
          }
        } else {
          result += allowPrompt ? promptChar : '';
        }
      }
    }

    return result;
  }, [parseMask, allowPrompt, promptChar]);

  // Extract raw value (without literals and prompt characters)
  const extractValue = useCallback((formattedValue: string, maskStr: string) => {
    if (!maskStr) return formattedValue;

    const segments = parseMask(maskStr);
    let result = '';
    let charIndex = 0;

    for (const segment of segments) {
      if (charIndex >= formattedValue.length) break;

      if (segment.type === 'input' && charIndex < formattedValue.length) {
        const char = formattedValue[charIndex];
        if (char !== promptChar) {
          result += char;
        }
      }
      charIndex++;
    }

    return result;
  }, [parseMask, promptChar]);

  // Validate character against mask position
  const validateChar = useCallback((char: string, position: number, maskStr: string) => {
    if (!maskStr) return true;

    const segments = parseMask(maskStr);
    if (position >= segments.length) return false;

    const segment = segments[position];
    if (segment.type === 'literal') {
      return char === segment.char;
    } else {
      return segment.pattern ? segment.pattern.test(char) : true;
    }
  }, [parseMask]);

  // Get next input position
  const getNextInputPosition = useCallback((position: number, maskStr: string, direction: 'forward' | 'backward' = 'forward') => {
    if (!maskStr) return position;

    const segments = parseMask(maskStr);
    let pos = position;

    if (direction === 'forward') {
      while (pos < segments.length) {
        if (segments[pos] && segments[pos].type === 'input') {
          return pos;
        }
        pos++;
      }
    } else {
      while (pos >= 0) {
        if (segments[pos] && segments[pos].type === 'input') {
          return pos;
        }
        pos--;
      }
    }

    return -1;
  }, [parseMask]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const maskedValue = applyMask(newValue, mask);
    
    setInputValue(maskedValue);

    // Update control properties
    if (control.events?.onChange) {
      control.events.onChange('Text', extractValue(maskedValue, mask));
      control.events.onChange('FormattedText', maskedValue);
      control.events.onChange('ClipText', promptInclude ? maskedValue : extractValue(maskedValue, mask));
    }

    // Trigger VB6 events
    if (control.events?.Change) {
      control.events.Change();
    }
  }, [mask, applyMask, extractValue, promptInclude, control.events]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mask) return;

    const char = e.key;
    const currentPos = e.currentTarget.selectionStart || 0;

    // Allow control keys
    if (e.ctrlKey || e.altKey || char.length !== 1) return;

    // Prevent default for invalid characters
    if (!validateChar(char, currentPos, mask)) {
      e.preventDefault();
      return;
    }

    // Auto-advance to next input position
    const nextPos = getNextInputPosition(currentPos + 1, mask);
    if (nextPos !== -1) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 0);
    }

    // Auto-tab to next control
    if (autoTab && currentPos === mask.length - 1) {
      setTimeout(() => {
        // In VB6, this would tab to the next control in tab order
        if (control.events?.LostFocus) {
          control.events.LostFocus();
        }
      }, 0);
    }
  }, [mask, validateChar, getNextInputPosition, autoTab, control.events]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentPos = e.currentTarget.selectionStart || 0;

    switch (e.key) {
      case 'Backspace':
        if (mask && currentPos > 0) {
          const prevPos = getNextInputPosition(currentPos - 1, mask, 'backward');
          if (prevPos !== -1) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.setSelectionRange(prevPos, prevPos);
              }
            }, 0);
          }
        }
        break;

      case 'Delete':
        if (mask) {
          const nextPos = getNextInputPosition(currentPos, mask);
          if (nextPos !== -1) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.setSelectionRange(nextPos, nextPos);
              }
            }, 0);
          }
        }
        break;

      case 'ArrowLeft':
        if (mask && currentPos > 0) {
          const prevPos = getNextInputPosition(currentPos - 1, mask, 'backward');
          if (prevPos !== -1) {
            e.preventDefault();
            inputRef.current?.setSelectionRange(prevPos, prevPos);
          }
        }
        break;

      case 'ArrowRight':
        if (mask && currentPos < mask.length) {
          const nextPos = getNextInputPosition(currentPos + 1, mask);
          if (nextPos !== -1) {
            e.preventDefault();
            inputRef.current?.setSelectionRange(nextPos, nextPos);
          }
        }
        break;

      case 'Home':
        if (mask) {
          const firstPos = getNextInputPosition(0, mask);
          if (firstPos !== -1) {
            e.preventDefault();
            inputRef.current?.setSelectionRange(firstPos, firstPos);
          }
        }
        break;

      case 'End':
        if (mask) {
          let lastPos = mask.length - 1;
          while (lastPos >= 0) {
            const pos = getNextInputPosition(lastPos, mask, 'backward');
            if (pos !== -1) {
              e.preventDefault();
              inputRef.current?.setSelectionRange(pos + 1, pos + 1);
              break;
            }
            lastPos--;
          }
        }
        break;
    }
  }, [mask, getNextInputPosition]);

  // Initialize input value
  useEffect(() => {
    const initialValue = text || formattedText || '';
    const maskedValue = applyMask(initialValue, mask);
    setInputValue(maskedValue);
  }, [text, formattedText, mask, applyMask]);

  // Mouse event handlers for control dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();

    if (e.detail === 2) {
      onDoubleClick();
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handles
    const handleSize = 8;
    const isOnRightEdge = x >= control.width - handleSize;
    const isOnBottomEdge = y >= control.height - handleSize;
    const isOnLeftEdge = x <= handleSize;
    const isOnTopEdge = y <= handleSize;

    if (selected && (isOnRightEdge || isOnBottomEdge || isOnLeftEdge || isOnTopEdge)) {
      setIsResizing(true);
      let corner = '';
      if (isOnTopEdge && isOnLeftEdge) corner = 'nw';
      else if (isOnTopEdge && isOnRightEdge) corner = 'ne';
      else if (isOnBottomEdge && isOnLeftEdge) corner = 'sw';
      else if (isOnBottomEdge && isOnRightEdge) corner = 'se';
      else if (isOnTopEdge) corner = 'n';
      else if (isOnBottomEdge) corner = 's';
      else if (isOnLeftEdge) corner = 'w';
      else if (isOnRightEdge) corner = 'e';
      setResizeCorner(corner);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Global mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        onMove(deltaX, deltaY);
      } else if (isResizing) {
        onResize(resizeCorner, deltaX, deltaY);
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeCorner, onMove, onResize]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '1px inset #c0c0c0',
    backgroundColor: properties.BackColor || '#ffffff',
    cursor: isDragging ? 'move' : 'default',
    display: 'flex',
    alignItems: 'center'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    padding: '2px 4px',
    backgroundColor: 'transparent',
    fontFamily: properties.FontName || 'MS Sans Serif',
    fontSize: `${properties.FontSize || 8}pt`,
    color: properties.ForeColor || '#000000',
    direction: rightToLeft ? 'rtl' : 'ltr',
    textAlign: rightToLeft ? 'right' : 'left',
    fontWeight: properties.FontBold ? 'bold' : 'normal',
    fontStyle: properties.FontItalic ? 'italic' : 'normal',
    textDecoration: properties.FontUnderline ? 'underline' : 'none'
  };

  // Display formatted value with password masking if needed
  const displayValue = passwordChar 
    ? inputValue.replace(/./g, passwordChar)
    : inputValue;

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      className="vb6-maskededit"
      title={`MaskedEdit - Mask: ${mask || 'None'}`}
    >
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onKeyDown={handleKeyDown}
        style={inputStyle}
        maxLength={maxLength || undefined}
        placeholder={mask ? mask.replace(/./g, promptChar) : ''}
        disabled={properties.Enabled === false}
        readOnly={properties.Locked === true}
        onFocus={() => {
          // Position cursor at first input position
          if (mask && inputRef.current) {
            const firstPos = getNextInputPosition(0, mask);
            if (firstPos !== -1) {
              setTimeout(() => {
                inputRef.current?.setSelectionRange(firstPos, firstPos);
              }, 0);
            }
          }
          
          if (control.events?.GotFocus) {
            control.events.GotFocus();
          }
        }}
        onBlur={() => {
          if (control.events?.LostFocus) {
            control.events.LostFocus();
          }
        }}
        onSelect={(e) => {
          const start = e.currentTarget.selectionStart || 0;
          const length = (e.currentTarget.selectionEnd || 0) - start;
          setCursorPosition(start);
          
          if (control.events?.onChange) {
            control.events.onChange('SelStart', start);
            control.events.onChange('SelLength', length);
          }
        }}
      />

      {/* Resize handles */}
      {selected && (
        <>
          <div className="vb6-resize-handle nw" style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'nw-resize' }} />
          <div className="vb6-resize-handle ne" style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'ne-resize' }} />
          <div className="vb6-resize-handle sw" style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'sw-resize' }} />
          <div className="vb6-resize-handle se" style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'se-resize' }} />
          <div className="vb6-resize-handle n" style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'n-resize' }} />
          <div className="vb6-resize-handle s" style={{ position: 'absolute', bottom: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 's-resize' }} />
          <div className="vb6-resize-handle w" style={{ position: 'absolute', top: '50%', left: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'w-resize' }} />
          <div className="vb6-resize-handle e" style={{ position: 'absolute', top: '50%', right: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'e-resize' }} />
        </>
      )}
    </div>
  );
};

export default MaskedEdit;