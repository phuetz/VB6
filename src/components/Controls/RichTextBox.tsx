import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Control } from '../../context/types';

interface RichTextBoxProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

interface RTFFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontName?: string;
  color?: string;
  backColor?: string;
}

const RichTextBox: React.FC<RichTextBoxProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  const properties = control.properties || {};

  // VB6 RichTextBox Properties
  const text = properties.Text || '';
  const textRTF = properties.TextRTF || '';
  const locked = properties.Locked === true;
  const multiLine = properties.MultiLine !== false;
  const scrollBars = properties.ScrollBars || 0; // 0=None, 1=Horizontal, 2=Vertical, 3=Both
  const wordWrap = properties.WordWrap !== false;
  const maxLength = properties.MaxLength || 0;
  const hideSelection = properties.HideSelection === true;
  const readOnly = properties.ReadOnly === true;
  const selectionAlignment = properties.SelAlignment || 0; // 0=Left, 1=Right, 2=Center
  const selectionBold = properties.SelBold === true;
  const selectionItalic = properties.SelItalic === true;
  const selectionUnderline = properties.SelUnderline === true;
  const selectionColor = properties.SelColor || '#000000';
  const selectionFontName = properties.SelFontName || 'MS Sans Serif';
  const selectionFontSize = properties.SelFontSize || 8;
  const bulletIndent = properties.BulletIndent || 0;
  const rightMargin = properties.RightMargin || 0;

  // Convert RTF to HTML (simplified implementation)
  const rtfToHtml = useCallback(
    (rtf: string): string => {
      if (!rtf) return text;

      // Basic RTF to HTML conversion
      let html = rtf;

      // Replace RTF formatting codes with HTML
      html = html.replace(/\\b([^\\]+)\\b0/g, '<b>$1</b>'); // Bold
      html = html.replace(/\\i([^\\]+)\\i0/g, '<i>$1</i>'); // Italic
      html = html.replace(/\\ul([^\\]+)\\ul0/g, '<u>$1</u>'); // Underline
      html = html.replace(/\\fs(\d+)([^\\]+)/g, '<span style="font-size: $1pt">$2</span>'); // Font size
      html = html.replace(
        /\\cf(\d+)([^\\]+)/g,
        '<span style="color: var(--rtf-color-$1)">$2</span>'
      ); // Color
      html = html.replace(/\\par/g, '<br>'); // Paragraph break
      html = html.replace(/\\tab/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); // Tab
      html = html.replace(/\\\\/g, '\\'); // Escaped backslash
      html = html.replace(/\\{/g, '{'); // Escaped brace
      html = html.replace(/\\}/g, '}'); // Escaped brace

      return html;
    },
    [text]
  );

  // Convert HTML to RTF (simplified implementation)
  const htmlToRtf = useCallback((html: string): string => {
    let rtf = html;

    // Convert HTML tags to RTF codes
    rtf = rtf.replace(/<b>(.*?)<\/b>/g, '\\b$1\\b0');
    rtf = rtf.replace(/<i>(.*?)<\/i>/g, '\\i$1\\i0');
    rtf = rtf.replace(/<u>(.*?)<\/u>/g, '\\ul$1\\ul0');
    rtf = rtf.replace(/<br>/g, '\\par');
    rtf = rtf.replace(/&nbsp;/g, ' ');

    return `{\\rtf1\\ansi\\deff0 ${rtf}}`;
  }, []);

  // Apply formatting to selected text
  const applyFormat = useCallback(
    (format: RTFFormat) => {
      if (!editorRef.current || !selectedRange) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const span = document.createElement('span');

      // Apply formatting styles
      if (format.bold !== undefined) {
        span.style.fontWeight = format.bold ? 'bold' : 'normal';
      }
      if (format.italic !== undefined) {
        span.style.fontStyle = format.italic ? 'italic' : 'normal';
      }
      if (format.underline !== undefined) {
        span.style.textDecoration = format.underline ? 'underline' : 'none';
      }
      if (format.fontSize) {
        span.style.fontSize = `${format.fontSize}pt`;
      }
      if (format.fontName) {
        span.style.fontFamily = format.fontName;
      }
      if (format.color) {
        span.style.color = format.color;
      }
      if (format.backColor) {
        span.style.backgroundColor = format.backColor;
      }

      try {
        range.surroundContents(span);
      } catch (e) {
        // If range spans multiple elements, extract and wrap content
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }

      selection.removeAllRanges();
    },
    [selectedRange]
  );

  // VB6 Methods simulation
  const vb6Methods = {
    Find: (searchString: string, start?: number, options?: number) => {
      if (!editorRef.current) return -1;
      const content = editorRef.current.innerText;
      const startPos = start || 0;
      const index = content.indexOf(searchString, startPos);
      return index;
    },

    GetLineFromChar: (charIndex: number) => {
      if (!editorRef.current) return 0;
      const content = editorRef.current.innerText;
      const textBeforeChar = content.substring(0, charIndex);
      return textBeforeChar.split('\n').length - 1;
    },

    LoadFile: (filename: string, fileType?: number) => {
      // Simulate file loading (in real VB6, this would load from disk)
    },

    SaveFile: (filename: string, fileType?: number) => {
      // Simulate file saving - use textContent for safer content extraction
      const content = editorRef.current?.textContent || '';
    },

    Span: (characterStart: number, characterEnd?: number) => {
      // Select text span
      if (!editorRef.current) return;

      const range = document.createRange();
      const textNode = editorRef.current.firstChild;
      if (textNode) {
        range.setStart(textNode, characterStart);
        range.setEnd(textNode, characterEnd || characterStart);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    },
  };

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSelectedRange(selection.getRangeAt(0));
    }
  }, []);

  // Handle text change
  const handleTextChange = useCallback(() => {
    if (!editorRef.current) return;

    // Use cloneNode and safe serialization instead of innerHTML
    const clone = editorRef.current.cloneNode(true) as HTMLElement;
    const serializer = new XMLSerializer();
    const html = serializer.serializeToString(clone);
    const rtf = htmlToRtf(html);

    // Trigger VB6 events
    if (control.events?.Change) {
      control.events.Change();
    }
  }, [control.events, htmlToRtf]);

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

  // Set up content editable events with proper cleanup
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Create stable references for cleanup
    const textChangeHandler = handleTextChange;
    const selectionChangeHandler = handleSelectionChange;

    editor.addEventListener('input', textChangeHandler);
    document.addEventListener('selectionchange', selectionChangeHandler);

    // Cleanup function with captured references
    return () => {
      editor.removeEventListener('input', textChangeHandler);
      document.removeEventListener('selectionchange', selectionChangeHandler);
    };
  }, [handleTextChange, handleSelectionChange]);

  // Apply RTF content safely
  useEffect(() => {
    if (editorRef.current && textRTF) {
      // Use DOMParser for safe HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${rtfToHtml(textRTF)}</div>`, 'text/html');
      const sanitizedDiv = doc.body.firstChild as HTMLElement;

      // Clear and safely append content
      editorRef.current.textContent = '';
      if (sanitizedDiv) {
        while (sanitizedDiv.firstChild) {
          editorRef.current.appendChild(sanitizedDiv.firstChild);
        }
      }
    } else if (editorRef.current && text) {
      editorRef.current.textContent = text;
    }
  }, [text, textRTF, rtfToHtml]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '2px inset #c0c0c0',
    backgroundColor: properties.BackColor || '#ffffff',
    fontFamily: properties.FontName || 'MS Sans Serif',
    fontSize: `${properties.FontSize || 8}pt`,
    color: properties.ForeColor || '#000000',
    cursor: isDragging ? 'move' : 'default',
    overflow:
      scrollBars === 0
        ? 'hidden'
        : scrollBars === 1
          ? 'scroll'
          : scrollBars === 2
            ? 'scroll'
            : 'auto',
    overflowX: scrollBars === 1 || scrollBars === 3 ? 'scroll' : 'hidden',
    overflowY: scrollBars === 2 || scrollBars === 3 ? 'scroll' : 'hidden',
  };

  const editorStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    padding: '2px',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    backgroundColor: 'transparent',
    wordWrap: wordWrap ? 'break-word' : 'normal',
    whiteSpace: multiLine ? 'pre-wrap' : 'nowrap',
    textAlign: selectionAlignment === 1 ? 'right' : selectionAlignment === 2 ? 'center' : 'left',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      className="vb6-richtextbox"
    >
      <div
        ref={editorRef}
        style={editorStyle}
        contentEditable={!readOnly && !locked}
        suppressContentEditableWarning={true}
        onKeyDown={e => {
          if (maxLength > 0 && editorRef.current) {
            const currentLength = editorRef.current.innerText.length;
            if (currentLength >= maxLength && e.key.length === 1) {
              e.preventDefault();
            }
          }
        }}
      />

      {/* Resize handles */}
      {selected && (
        <>
          <div
            className="vb6-resize-handle nw"
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'nw-resize',
            }}
          />
          <div
            className="vb6-resize-handle ne"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'ne-resize',
            }}
          />
          <div
            className="vb6-resize-handle sw"
            style={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'sw-resize',
            }}
          />
          <div
            className="vb6-resize-handle se"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'se-resize',
            }}
          />
          <div
            className="vb6-resize-handle n"
            style={{
              position: 'absolute',
              top: -4,
              left: '50%',
              marginLeft: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'n-resize',
            }}
          />
          <div
            className="vb6-resize-handle s"
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              marginLeft: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 's-resize',
            }}
          />
          <div
            className="vb6-resize-handle w"
            style={{
              position: 'absolute',
              top: '50%',
              left: -4,
              marginTop: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'w-resize',
            }}
          />
          <div
            className="vb6-resize-handle e"
            style={{
              position: 'absolute',
              top: '50%',
              right: -4,
              marginTop: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'e-resize',
            }}
          />
        </>
      )}
    </div>
  );
};

export default RichTextBox;
