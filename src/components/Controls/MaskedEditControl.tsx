/**
 * VB6 MaskedEdit Control Implementation
 * 
 * Masked input control with full VB6 compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface MaskedEditControl {
  type: 'MaskedEdit';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Text Properties
  text: string;
  mask: string;
  format: string;
  promptChar: string;
  
  // Appearance
  backColor: string;
  foreColor: string;
  font: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  locked: boolean;
  
  // Validation
  validationError: boolean;
  autoTab: boolean;
  clipMode: number; // 0=IncludeLiterals, 1=ExcludeLiterals
  
  // Selection
  selStart: number;
  selLength: number;
  selText: string;
  
  // Appearance
  alignment: number; // 0=Left, 1=Right, 2=Center
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  mousePointer: number;
  tag: string;
  
  // Events
  onChange?: string;
  onValidationError?: string;
  onKeyPress?: string;
  onKeyDown?: string;
  onKeyUp?: string;
}

interface MaskedEditControlProps {
  control: MaskedEditControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

// Mask character definitions (VB6 compatible)
const MASK_CHARS = {
  '#': /[0-9]/,           // Digit (0-9)
  '0': /[0-9]/,           // Digit (0-9, required)
  '9': /[0-9 ]/,          // Digit or space
  'A': /[A-Za-z]/,        // Letter (A-Z, a-z)
  'a': /[A-Za-z ]/,       // Letter or space
  'L': /[A-Za-z]/,        // Letter (A-Z, a-z, required)
  'l': /[A-Za-z ]/,       // Letter or space
  '?': /[A-Za-z ]/,       // Letter or space
  'C': /./,               // Any character
  'c': /[ ]/,             // Any character or space
  '&': /./,               // Any character (required)
  '>': null,              // Convert to uppercase
  '<': null,              // Convert to lowercase
  '|': null,              // Disable case conversion
  '\\': null              // Escape next character
};

export const MaskedEditControl: React.FC<MaskedEditControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 100,
    height = 20,
    text = '',
    mask = '',
    format = '',
    promptChar = '_',
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = {
      name: 'MS Sans Serif',
      size: 8,
      bold: false,
      italic: false,
      underline: false
    },
    enabled = true,
    visible = true,
    locked = false,
    validationError = false,
    autoTab = false,
    clipMode = 0,
    selStart = 0,
    selLength = 0,
    selText = '',
    alignment = 0,
    appearance = 1,
    borderStyle = 1,
    mousePointer = 0,
    tag = ''
  } = control;

  const [displayText, setDisplayText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [caseMode, setCaseMode] = useState<'normal' | 'upper' | 'lower'>('normal');
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse mask and create display template
  const parseMask = useCallback((maskStr: string): { template: string, positions: number[] } => {
    if (!maskStr) return { template: '', positions: [] };
    
    let template = '';
    const positions: number[] = [];
    let i = 0;
    let templateIndex = 0;
    let currentCaseMode: 'normal' | 'upper' | 'lower' = 'normal';
    
    while (i < maskStr.length) {
      const char = maskStr[i];
      
      if (char === '\\' && i + 1 < maskStr.length) {
        // Escaped character - treat as literal
        template += maskStr[i + 1];
        i += 2;
        templateIndex++;
      } else if (char === '>') {
        currentCaseMode = 'upper';
        setCaseMode('upper');
        i++;
      } else if (char === '<') {
        currentCaseMode = 'lower';
        setCaseMode('lower');
        i++;
      } else if (char === '|') {
        currentCaseMode = 'normal';
        setCaseMode('normal');
        i++;
      } else if (Object.prototype.hasOwnProperty.call(MASK_CHARS, char) && MASK_CHARS[char as keyof typeof MASK_CHARS]) {
        // Input position
        template += promptChar;
        positions.push(templateIndex);
        templateIndex++;
        i++;
      } else {
        // Literal character
        template += char;
        templateIndex++;
        i++;
      }
    }
    
    return { template, positions };
  }, [promptChar]);

  const { template, positions } = parseMask(mask);

  // Apply mask to input value
  const applyMask = useCallback((value: string): { masked: string, valid: boolean } => {
    if (!mask) return { masked: value, valid: true };
    
    let masked = template;
    let valueIndex = 0;
    let valid = true;
    
    for (let i = 0; i < positions.length && valueIndex < value.length; i++) {
      const pos = positions[i];
      const maskChar = mask[i];
      let inputChar = value[valueIndex];
      
      // Apply case conversion
      if (caseMode === 'upper') {
        inputChar = inputChar.toUpperCase();
      } else if (caseMode === 'lower') {
        inputChar = inputChar.toLowerCase();
      }
      
      const pattern = MASK_CHARS[maskChar as keyof typeof MASK_CHARS];
      
      if (pattern && pattern.test(inputChar)) {
        masked = masked.substring(0, pos) + inputChar + masked.substring(pos + 1);
        valueIndex++;
      } else if (maskChar === '0' || maskChar === 'L' || maskChar === '&') {
        // Required character - validation fails
        valid = false;
        break;
      } else {
        // Optional character - skip
        valueIndex++;
      }
    }
    
    return { masked, valid };
  }, [mask, template, positions, caseMode]);

  // Update display text when mask or text changes
  useEffect(() => {
    if (mask) {
      const { masked, valid } = applyMask(text);
      setDisplayText(masked);
      setIsValid(valid);
      
      if (valid !== isValid) {
        onPropertyChange?.('validationError', !valid);
      }
    } else {
      setDisplayText(text);
      setIsValid(true);
    }
  }, [text, mask, template, applyMask, isValid, onPropertyChange]);

  // Handle input change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (locked || !enabled) return;
    
    const rawValue = event.target.value;
    
    if (mask) {
      // Extract only the input characters (exclude literals)
      let inputValue = '';
      const { positions } = parseMask(mask);
      
      for (const pos of positions) {
        if (pos < rawValue.length && rawValue[pos] !== promptChar) {
          inputValue += rawValue[pos];
        }
      }
      
      const { masked, valid } = applyMask(inputValue);
      setDisplayText(masked);
      setIsValid(valid);
      
      onPropertyChange?.('text', inputValue);
      onPropertyChange?.('validationError', !valid);
      
      if (!valid) {
        onEvent?.('ValidationError');
      }
    } else {
      setDisplayText(rawValue);
      onPropertyChange?.('text', rawValue);
    }
    
    onEvent?.('Change');
  }, [locked, enabled, mask, promptChar, parseMask, applyMask, onPropertyChange, onEvent]);

  // Handle key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enabled) return;
    
    const char = event.key;
    const keyCode = event.charCode || event.keyCode;
    
    // Check if character is valid for current mask position
    if (mask && inputRef.current) {
      const cursorPos = inputRef.current.selectionStart || 0;
      const maskPos = positions.findIndex(p => p >= cursorPos);
      
      if (maskPos >= 0 && maskPos < mask.length) {
        const maskChar = mask[maskPos];
        const pattern = MASK_CHARS[maskChar as keyof typeof MASK_CHARS];
        
        if (pattern && !pattern.test(char)) {
          event.preventDefault();
          return;
        }
      }
    }
    
    onEvent?.('KeyPress', { keyAscii: keyCode });
  }, [enabled, mask, positions, onEvent]);

  // Handle key down
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enabled) return;
    
    const keyCode = event.keyCode;
    
    // Handle tab behavior for autoTab
    if (autoTab && keyCode === 9) {
      if (mask && inputRef.current) {
        const { masked } = applyMask(text);
        const hasAllRequiredChars = !masked.includes(promptChar);
        
        if (hasAllRequiredChars) {
          // Move to next control
          const nextElement = document.querySelector(`[tabindex="${(parseInt(inputRef.current.tabIndex) || 0) + 1}"]`) as HTMLElement;
          if (nextElement) {
            nextElement.focus();
          }
        }
      }
    }
    
    onEvent?.('KeyDown', { keyCode, shift: event.shiftKey, ctrl: event.ctrlKey });
  }, [enabled, autoTab, mask, text, promptChar, applyMask, onEvent]);

  // Handle key up
  const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enabled) return;
    onEvent?.('KeyUp', { keyCode: event.keyCode, shift: event.shiftKey, ctrl: event.ctrlKey });
  }, [enabled, onEvent]);

  // Handle selection change
  const handleSelect = useCallback((event: React.SyntheticEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const start = input.selectionStart || 0;
    const length = (input.selectionEnd || 0) - start;
    const selectedText = input.value.substring(start, start + length);
    
    setCursorPosition(start);
    onPropertyChange?.('selStart', start);
    onPropertyChange?.('selLength', length);
    onPropertyChange?.('selText', selectedText);
  }, [onPropertyChange]);

  // Get formatted text based on clipMode
  const getFormattedText = useCallback((): string => {
    if (!mask) return text;
    
    if (clipMode === 1) {
      // Exclude literals - return only input characters
      let result = '';
      const { positions } = parseMask(mask);
      
      for (const pos of positions) {
        if (pos < displayText.length && displayText[pos] !== promptChar) {
          result += displayText[pos];
        }
      }
      return result;
    } else {
      // Include literals - return full masked text
      return displayText;
    }
  }, [text, mask, clipMode, displayText, promptChar, parseMask]);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    if (appearance === 0) return '1px solid #808080';
    return validationError || !isValid ? '2px inset #ff0000' : '2px inset #d0d0d0';
  };

  const getTextAlign = () => {
    switch (alignment) {
      case 1: return 'right';
      case 2: return 'center';
      default: return 'left';
    }
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'text';
  };

  return (
    <div
      className={`vb6-maskededit ${!enabled ? 'disabled' : ''} ${!isValid ? 'invalid' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        outline: isDesignMode ? '1px dotted #333' : 'none'
      }}
      data-name={name}
      data-type="MaskedEdit"
    >
      <input
        ref={inputRef}
        type="text"
        value={displayText}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onSelect={handleSelect}
        disabled={!enabled}
        readOnly={locked}
        placeholder={mask ? template : ''}
        style={{
          width: '100%',
          height: '100%',
          padding: '2px 4px',
          backgroundColor: backColor,
          color: foreColor,
          fontFamily: font.name,
          fontSize: `${font.size}pt`,
          fontWeight: font.bold ? 'bold' : 'normal',
          fontStyle: font.italic ? 'italic' : 'normal',
          textDecoration: font.underline ? 'underline' : 'none',
          textAlign: getTextAlign(),
          border: getBorderStyle(),
          cursor: getCursorStyle(),
          opacity: enabled ? 1 : 0.5,
          outline: 'none'
        }}
      />

      {/* Design Mode Info */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {name} (Mask: {mask || 'None'})
        </div>
      )}
    </div>
  );
};

export default MaskedEditControl;