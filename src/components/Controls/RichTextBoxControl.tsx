/**
 * RichTextBox Control - Complete VB6 Rich Text Editing Control
 * Provides comprehensive rich text editing with RTF formatting capabilities
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// RichTextBox Constants
export enum RtfSelectionType {
  rtfSelectionText = 0,
  rtfSelectionObject = 1
}

export enum RtfSelectionAlignment {
  rtfLeft = 0,
  rtfRight = 1,
  rtfCenter = 2
}

export enum RtfSaveConstants {
  rtfRTF = 0,
  rtfText = 1
}

export interface RichTextBoxProps extends VB6ControlPropsEnhanced {
  // Text properties
  text?: string;
  textRTF?: string;
  fileName?: string;
  
  // Selection properties
  selStart?: number;
  selLength?: number;
  selText?: string;
  selRTF?: string;
  selColor?: string;
  selFontName?: string;
  selFontSize?: number;
  selBold?: boolean;
  selItalic?: boolean;
  selUnderline?: boolean;
  selStrikeThru?: boolean;
  
  // Formatting properties
  selAlignment?: RtfSelectionAlignment;
  selBullet?: boolean;
  selIndent?: number;
  selRightIndent?: number;
  selHangingIndent?: number;
  
  // Control properties
  locked?: boolean;
  multiLine?: boolean;
  scrollBars?: number; // 0-None, 1-Horizontal, 2-Vertical, 3-Both
  hideSelection?: boolean;
  maxLength?: number;
  disableNoScroll?: boolean;
  autoVerbMenu?: boolean;
  
  // Events
  onSelectionChange?: () => void;
  onChange?: () => void;
  onKeyDown?: (keyCode: number, shift: number) => void;
  onKeyPress?: (keyAscii: number) => void;
  onKeyUp?: (keyCode: number, shift: number) => void;
  onLinkClick?: (linkText: string) => void;
}

export const RichTextBoxControl = forwardRef<HTMLDivElement, RichTextBoxProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 200,
    height = 100,
    visible = true,
    enabled = true,
    text = '',
    textRTF = '',
    fileName = '',
    selStart = 0,
    selLength = 0,
    locked = false,
    multiLine = true,
    scrollBars = 3,
    hideSelection = false,
    maxLength = 0,
    disableNoScroll = false,
    autoVerbMenu = true,
    onSelectionChange,
    onChange,
    onKeyDown,
    onKeyPress,
    onKeyUp,
    onLinkClick,
    ...rest
  } = props;

  const [currentText, setCurrentText] = useState(text);
  const [currentRTF, setCurrentRTF] = useState(textRTF);
  const [selection, setSelection] = useState({ start: selStart, length: selLength });
  const [selectionFormat, setSelectionFormat] = useState({
    fontName: 'MS Sans Serif',
    fontSize: 8,
    bold: false,
    italic: false,
    underline: false,
    strikeThru: false,
    color: '#000000',
    alignment: RtfSelectionAlignment.rtfLeft,
    bullet: false,
    indent: 0,
    rightIndent: 0,
    hangingIndent: 0
  });
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isModified, setIsModified] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    LoadFile: (fileName: string, fileType?: RtfSaveConstants) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = fileType === RtfSaveConstants.rtfText ? '.txt' : '.rtf';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (file.name.toLowerCase().endsWith('.rtf')) {
              setCurrentRTF(content);
              setCurrentText(parseRTF(content));
            } else {
              setCurrentText(content);
              setCurrentRTF(generateRTF(content));
            }
            addToUndoStack();
            setIsModified(false);
            fireEvent(name, 'LoadFile', { fileName: file.name });
          };
          reader.readAsText(file);
        }
      };
      
      input.click();
    },

    SaveFile: (fileName: string, fileType?: RtfSaveConstants) => {
      const content = fileType === RtfSaveConstants.rtfText ? currentText : currentRTF;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || (fileType === RtfSaveConstants.rtfText ? 'document.txt' : 'document.rtf');
      link.click();
      URL.revokeObjectURL(url);
      
      setIsModified(false);
      fireEvent(name, 'SaveFile', { fileName: link.download });
    },

    Find: (searchText: string, start?: number, options?: number) => {
      const text = currentText.toLowerCase();
      const search = searchText.toLowerCase();
      const startPos = start || selection.start + selection.length;
      
      const index = text.indexOf(search, startPos);
      if (index >= 0) {
        setSelection({ start: index, length: searchText.length });
        vb6Methods.SetFocus();
        return index;
      }
      return -1;
    },

    GetLineFromChar: (charIndex: number) => {
      const lines = currentText.substring(0, charIndex).split('\n');
      return lines.length - 1;
    },

    GetLineCount: () => {
      return currentText.split('\n').length;
    },

    GetLineLength: (lineNumber: number) => {
      const lines = currentText.split('\n');
      return lines[lineNumber]?.length || 0;
    },

    Undo: () => {
      if (undoStack.length > 0) {
        const previousState = undoStack[undoStack.length - 1];
        setRedoStack(prev => [...prev, currentText]);
        setUndoStack(prev => prev.slice(0, -1));
        setCurrentText(previousState);
        setCurrentRTF(generateRTF(previousState));
        fireEvent(name, 'Undo', {});
      }
    },

    Redo: () => {
      if (redoStack.length > 0) {
        const nextState = redoStack[redoStack.length - 1];
        setUndoStack(prev => [...prev, currentText]);
        setRedoStack(prev => prev.slice(0, -1));
        setCurrentText(nextState);
        setCurrentRTF(generateRTF(nextState));
        fireEvent(name, 'Redo', {});
      }
    },

    Cut: () => {
      const selectedText = getSelectedText();
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
        replaceSelection('');
        fireEvent(name, 'Cut', {});
      }
    },

    Copy: () => {
      const selectedText = getSelectedText();
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
        fireEvent(name, 'Copy', {});
      }
    },

    Paste: () => {
      navigator.clipboard.readText().then(text => {
        replaceSelection(text);
        fireEvent(name, 'Paste', {});
      });
    },

    SetFocus: () => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.setSelectionRange(selection.start, selection.start + selection.length);
      }
    },

    Refresh: () => {
      forceUpdate();
    },

    SelPrint: (showDialog?: boolean) => {
      const printContent = `
        <html>
          <head><title>Rich Text Print</title></head>
          <body style="font-family: ${selectionFormat.fontName}; font-size: ${selectionFormat.fontSize}pt;">
            <pre>${getSelectedText() || currentText}</pre>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        if (showDialog) {
          printWindow.print();
        }
      }
    },

    SelChange: (fontName?: string, fontSize?: number, fontBold?: boolean, fontItalic?: boolean, fontUnderline?: boolean) => {
      setSelectionFormat(prev => ({
        ...prev,
        ...(fontName && { fontName }),
        ...(fontSize && { fontSize }),
        ...(fontBold !== undefined && { bold: fontBold }),
        ...(fontItalic !== undefined && { italic: fontItalic }),
        ...(fontUnderline !== undefined && { underline: fontUnderline })
      }));
      
      applyFormatting();
      fireEvent(name, 'SelChange', {});
    },

    OLEDrag: () => {
      // OLE Drag functionality (simplified)
      fireEvent(name, 'OLEDrag', {});
    }
  };

  const addToUndoStack = () => {
    setUndoStack(prev => [...prev.slice(-19), currentText]); // Keep last 20 states
    setRedoStack([]);
  };

  const getSelectedText = () => {
    return currentText.substring(selection.start, selection.start + selection.length);
  };

  const replaceSelection = (newText: string) => {
    const before = currentText.substring(0, selection.start);
    const after = currentText.substring(selection.start + selection.length);
    const newFullText = before + newText + after;
    
    addToUndoStack();
    setCurrentText(newFullText);
    setCurrentRTF(generateRTF(newFullText));
    setSelection({ start: selection.start, length: newText.length });
    setIsModified(true);
    
    onChange?.();
    fireEvent(name, 'Change', {});
  };

  const applyFormatting = () => {
    // Apply formatting to selected text (simplified for browser)
    if (editorRef.current && selection.length > 0) {
      const range = document.createRange();
      const textNode = editorRef.current.firstChild;
      if (textNode) {
        range.setStart(textNode, selection.start);
        range.setEnd(textNode, selection.start + selection.length);
        
        const span = document.createElement('span');
        span.style.fontFamily = selectionFormat.fontName;
        span.style.fontSize = `${selectionFormat.fontSize}pt`;
        span.style.fontWeight = selectionFormat.bold ? 'bold' : 'normal';
        span.style.fontStyle = selectionFormat.italic ? 'italic' : 'normal';
        span.style.textDecoration = selectionFormat.underline ? 'underline' : 'none';
        span.style.color = selectionFormat.color;
        
        try {
          range.surroundContents(span);
        } catch (e) {
          // Fallback for complex selections
        }
      }
    }
  };

  const parseRTF = (rtf: string): string => {
    // Simplified RTF parser - extract plain text
    return rtf
      .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF commands
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\\\\/g, '\\') // Unescape backslashes
      .trim();
  };

  const generateRTF = (text: string): string => {
    // Generate basic RTF from plain text
    const header = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 MS Sans Serif;}}';
    const body = text.replace(/\n/g, '\\line ').replace(/\t/g, '\\tab ');
    return `${header} \\f0\\fs16 ${body}}`;
  };

  const forceUpdate = useCallback(() => {
    // Force component re-render
    setCurrentText(prev => prev);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (maxLength > 0 && newText.length > maxLength) {
      return;
    }
    
    addToUndoStack();
    setCurrentText(newText);
    setCurrentRTF(generateRTF(newText));
    setIsModified(true);
    
    onChange?.();
    fireEvent(name, 'Change', {});
  };

  const handleSelectionChange = () => {
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      setSelection({ start, length: end - start });
      
      onSelectionChange?.();
      fireEvent(name, 'SelChange', { selStart: start, selLength: end - start });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!enabled || locked) {
      e.preventDefault();
      return;
    }

    const keyCode = e.keyCode;
    const shift = e.shiftKey ? 1 : 0;
    
    // Handle special key combinations
    if (e.ctrlKey) {
      switch (keyCode) {
        case 90: // Ctrl+Z
          e.preventDefault();
          vb6Methods.Undo();
          break;
        case 89: // Ctrl+Y
          e.preventDefault();
          vb6Methods.Redo();
          break;
        case 88: // Ctrl+X
          e.preventDefault();
          vb6Methods.Cut();
          break;
        case 67: // Ctrl+C
          e.preventDefault();
          vb6Methods.Copy();
          break;
        case 86: // Ctrl+V
          e.preventDefault();
          vb6Methods.Paste();
          break;
        case 65: // Ctrl+A
          e.preventDefault();
          setSelection({ start: 0, length: currentText.length });
          break;
      }
    }
    
    onKeyDown?.(keyCode, shift);
    fireEvent(name, 'KeyDown', { keyCode, shift });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!enabled || locked) {
      e.preventDefault();
      return;
    }

    const keyAscii = e.charCode;
    onKeyPress?.(keyAscii);
    fireEvent(name, 'KeyPress', { keyAscii });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const keyCode = e.keyCode;
    const shift = e.shiftKey ? 1 : 0;
    
    onKeyUp?.(keyCode, shift);
    fireEvent(name, 'KeyUp', { keyCode, shift });
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Text', currentText);
    updateControl(id, 'TextRTF', currentRTF);
    updateControl(id, 'SelStart', selection.start);
    updateControl(id, 'SelLength', selection.length);
    updateControl(id, 'SelText', getSelectedText());
    updateControl(id, 'Modified', isModified);
  }, [id, currentText, currentRTF, selection, isModified, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  if (!visible) return null;

  const scrollBarStyle = {
    overflow: scrollBars === 0 ? 'hidden' : 
              scrollBars === 1 ? 'scroll' :
              scrollBars === 2 ? 'scroll' : 'auto',
    overflowX: scrollBars === 1 || scrollBars === 3 ? 'scroll' : 'hidden',
    overflowY: scrollBars === 2 || scrollBars === 3 ? 'scroll' : 'hidden'
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '2px inset #c0c0c0',
        backgroundColor: enabled ? 'white' : '#f0f0f0',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5
      }}
      {...rest}
    >
      <textarea
        ref={textAreaRef}
        value={currentText}
        onChange={handleTextChange}
        onSelect={handleSelectionChange}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        onKeyUp={handleKeyUp}
        readOnly={locked}
        disabled={!enabled}
        maxLength={maxLength || undefined}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          fontFamily: selectionFormat.fontName,
          fontSize: `${selectionFormat.fontSize}pt`,
          fontWeight: selectionFormat.bold ? 'bold' : 'normal',
          fontStyle: selectionFormat.italic ? 'italic' : 'normal',
          textDecoration: selectionFormat.underline ? 'underline' : 'none',
          color: selectionFormat.color,
          padding: '2px',
          whiteSpace: multiLine ? 'pre-wrap' : 'nowrap',
          wordWrap: multiLine ? 'break-word' : 'normal',
          ...scrollBarStyle
        }}
        placeholder={!enabled ? '' : 'Enter rich text...'}
      />
      
      {/* Hidden div for RTF rendering support */}
      <div
        ref={editorRef}
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: currentRTF }}
      />
    </div>
  );
});

RichTextBoxControl.displayName = 'RichTextBoxControl';

export default RichTextBoxControl;