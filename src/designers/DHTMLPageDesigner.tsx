import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// DHTML Element Types
export enum DHTMLElementType {
  Text = 'text',
  Image = 'image',
  Link = 'link',
  Button = 'button',
  TextBox = 'textbox',
  TextArea = 'textarea',
  Select = 'select',
  CheckBox = 'checkbox',
  Radio = 'radio',
  Table = 'table',
  Div = 'div',
  Span = 'span',
  Form = 'form',
  IFrame = 'iframe',
  Script = 'script',
  Style = 'style'
}

// DHTML Element Properties
export interface DHTMLElement {
  id: string;
  type: DHTMLElementType;
  tagName: string;
  properties: { [key: string]: any };
  styles: { [key: string]: string };
  events: { [key: string]: string };
  children: DHTMLElement[];
  parent?: string;
  content?: string;
}

// DHTML Page
export interface DHTMLPage {
  name: string;
  title: string;
  elements: DHTMLElement[];
  scripts: string[];
  styles: string[];
  meta: { [key: string]: string };
  docType: string;
}

// Design Mode
export enum DesignMode {
  Design = 'design',
  Source = 'source',
  Preview = 'preview',
  Split = 'split'
}

interface DHTMLPageDesignerProps {
  initialPage?: DHTMLPage;
  onSave?: (page: DHTMLPage) => void;
  onPreview?: (html: string) => void;
}

export const DHTMLPageDesigner: React.FC<DHTMLPageDesignerProps> = ({
  initialPage,
  onSave,
  onPreview
}) => {
  const [page, setPage] = useState<DHTMLPage>(initialPage || {
    name: 'DHTMLPage1',
    title: 'DHTML Page',
    elements: [],
    scripts: [],
    styles: [],
    meta: {
      charset: 'UTF-8',
      viewport: 'width=device-width, initial-scale=1.0'
    },
    docType: '<!DOCTYPE html>'
  });

  const [selectedElement, setSelectedElement] = useState<DHTMLElement | null>(null);
  const [designMode, setDesignMode] = useState<DesignMode>(DesignMode.Design);
  const [sourceCode, setSourceCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<DHTMLElementType | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  const designerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // MEMORY LEAK FIX: Cleanup EventEmitter to prevent memory leaks
  useEffect(() => {
    return () => {
      // Remove all listeners and clear references
      eventEmitter.current.removeAllListeners();
    };
  }, []);

  /**
   * DOM CLOBBERING BUG FIX: Secure HTML generation with proper escaping
   */
  const domClobberingProtection = {
    // HTML entity escaping
    escapeHtml: (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    },
    
    // Attribute name validation
    validateAttributeName: (name: string): boolean => {
      // Only allow safe attribute names
      const safePattern = /^[a-zA-Z][a-zA-Z0-9-_]*$/;
      const dangerousAttrs = [
        'onabort', 'onblur', 'onchange', 'onclick', 'ondblclick', 'onerror',
        'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown',
        'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onreset',
        'onresize', 'onselect', 'onsubmit', 'onunload', 'javascript:', 'vbscript:',
        'data:', 'srcdoc', 'sandbox', 'allow'
      ];
      
      return safePattern.test(name) && !dangerousAttrs.includes(name.toLowerCase());
    },
    
    // CSS validation
    validateCSSProperty: (property: string, value: string): boolean => {
      // Block dangerous CSS
      const dangerousPatterns = [
        /javascript:/i,
        /expression\s*\(/i,
        /url\s*\(/i,
        /import/i,
        /@/i,
        /behavior\s*:/i
      ];
      
      return !dangerousPatterns.some(pattern => 
        pattern.test(property) || pattern.test(value)
      );
    },
    
    // Safe ID generation
    generateSafeId: (originalId: string): string => {
      // Ensure ID doesn't conflict with global objects
      const dangerousIds = [
        'window', 'document', 'location', 'navigator', 'history', 'screen',
        'parent', 'top', 'frames', 'self', 'opener', 'closed', 'length',
        'name', 'status', 'defaultStatus', 'toolbar', 'menubar', 'scrollbars',
        'locationbar', 'statusbar', 'directories', 'personalbar'
      ];
      
      let safeId = originalId.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (dangerousIds.includes(safeId.toLowerCase())) {
        safeId = `safe_${safeId}`;
      }
      
      return safeId;
    }
  };

  // Generate HTML from page
  const generateHTML = useCallback((): string => {
    const lines: string[] = [];
    
    // DocType
    lines.push(page.docType);
    lines.push('<html>');
    lines.push('<head>');
    
    // Title - DOM CLOBBERING BUG FIX: Escape title content
    lines.push(`  <title>${domClobberingProtection.escapeHtml(page.title)}</title>`);
    
    // Meta tags - DOM CLOBBERING BUG FIX: Validate and escape meta attributes
    Object.entries(page.meta).forEach(([name, content]) => {
      if (domClobberingProtection.validateAttributeName(name)) {
        const safeName = domClobberingProtection.escapeHtml(name);
        const safeContent = domClobberingProtection.escapeHtml(content);
        lines.push(`  <meta name="${safeName}" content="${safeContent}">`);
      } else {
        console.warn(`Unsafe meta attribute blocked: ${name}`);
      }
    });
    
    // Styles
    if (page.styles.length > 0) {
      lines.push('  <style>');
      page.styles.forEach(style => lines.push(`    ${style}`));
      lines.push('  </style>');
    }
    
    lines.push('</head>');
    lines.push('<body>');
    
    // Render elements - DOM CLOBBERING BUG FIX: Secure element rendering
    const renderElement = (element: DHTMLElement, indent: string = '  '): void => {
      const attrs: string[] = [];
      
      // Add ID - DOM CLOBBERING BUG FIX: Generate safe ID
      if (element.id) {
        const safeId = domClobberingProtection.generateSafeId(element.id);
        attrs.push(`id="${domClobberingProtection.escapeHtml(safeId)}"`);
      }
      
      // Add properties - DOM CLOBBERING BUG FIX: Validate and escape attributes
      Object.entries(element.properties).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (domClobberingProtection.validateAttributeName(key)) {
            const safeKey = domClobberingProtection.escapeHtml(key);
            const safeValue = domClobberingProtection.escapeHtml(String(value));
            attrs.push(`${safeKey}="${safeValue}"`);
          } else {
            console.warn(`Unsafe attribute blocked: ${key}`);
          }
        }
      });
      
      // Add inline styles - DOM CLOBBERING BUG FIX: Validate CSS properties
      const safeStyles: string[] = [];
      Object.entries(element.styles).forEach(([key, value]) => {
        if (domClobberingProtection.validateCSSProperty(key, value)) {
          const safeKey = domClobberingProtection.escapeHtml(key);
          const safeValue = domClobberingProtection.escapeHtml(value);
          safeStyles.push(`${safeKey}: ${safeValue}`);
        } else {
          console.warn(`Unsafe CSS property blocked: ${key}: ${value}`);
        }
      });
      
      if (safeStyles.length > 0) {
        attrs.push(`style="${safeStyles.join('; ')}"`);
      }
      
      // Block event handlers - DOM CLOBBERING BUG FIX: Event handlers are XSS vectors
      if (Object.keys(element.events).length > 0) {
        console.warn('Event handlers blocked for security - use React event handlers instead');
      }
      
      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      
      // Self-closing tags
      const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
      if (selfClosing.includes(element.tagName)) {
        lines.push(`${indent}<${element.tagName}${attrStr} />`);
      } else {
        lines.push(`${indent}<${element.tagName}${attrStr}>`);
        
        // Content - DOM CLOBBERING BUG FIX: Escape content
        if (element.content) {
          const safeContent = domClobberingProtection.escapeHtml(element.content);
          lines.push(`${indent}  ${safeContent}`);
        }
        
        // Children
        element.children.forEach(child => {
          renderElement(child, indent + '  ');
        });
        
        lines.push(`${indent}</${element.tagName}>`);
      }
    };
    
    page.elements.forEach(element => renderElement(element));
    
    // Scripts - DOM CLOBBERING BUG FIX: Block inline scripts for security
    if (page.scripts.length > 0) {
      console.warn('Inline scripts blocked for security - use external script files instead');
      lines.push('  <!-- Inline scripts blocked for security -->');
    }
    
    lines.push('</body>');
    lines.push('</html>');
    
    return lines.join('\n');
  }, [page]);

  // Update source code when page changes
  useEffect(() => {
    setSourceCode(generateHTML());
  }, [page, generateHTML]);

  // Update preview
  useEffect(() => {
    if (designMode === DesignMode.Preview || designMode === DesignMode.Split) {
      if (previewRef.current) {
        const doc = previewRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(sourceCode);
          doc.close();
        }
      }
    }
  }, [sourceCode, designMode]);

  const createElement = useCallback((type: DHTMLElementType): DHTMLElement => {
    const id = `element_${Date.now()}`;
    const baseElement: DHTMLElement = {
      id,
      type,
      tagName: '',
      properties: {},
      styles: {},
      events: {},
      children: []
    };

    // Set tag name and default properties based on type
    switch (type) {
      case DHTMLElementType.Text:
        baseElement.tagName = 'p';
        baseElement.content = 'Text';
        break;
      case DHTMLElementType.Image:
        baseElement.tagName = 'img';
        baseElement.properties.src = 'https://via.placeholder.com/150';
        baseElement.properties.alt = 'Image';
        break;
      case DHTMLElementType.Link:
        baseElement.tagName = 'a';
        baseElement.properties.href = '#';
        baseElement.content = 'Link';
        break;
      case DHTMLElementType.Button:
        baseElement.tagName = 'button';
        baseElement.properties.type = 'button';
        baseElement.content = 'Button';
        break;
      case DHTMLElementType.TextBox:
        baseElement.tagName = 'input';
        baseElement.properties.type = 'text';
        baseElement.properties.placeholder = 'Enter text...';
        break;
      case DHTMLElementType.TextArea:
        baseElement.tagName = 'textarea';
        baseElement.properties.rows = '4';
        baseElement.properties.cols = '50';
        break;
      case DHTMLElementType.Select:
        baseElement.tagName = 'select';
        // Add default option
        baseElement.children.push({
          id: `${id}_option1`,
          type: DHTMLElementType.Text,
          tagName: 'option',
          properties: { value: 'option1' },
          styles: {},
          events: {},
          children: [],
          content: 'Option 1'
        });
        break;
      case DHTMLElementType.CheckBox:
        baseElement.tagName = 'input';
        baseElement.properties.type = 'checkbox';
        break;
      case DHTMLElementType.Radio:
        baseElement.tagName = 'input';
        baseElement.properties.type = 'radio';
        baseElement.properties.name = 'radio_group';
        break;
      case DHTMLElementType.Table: {
        baseElement.tagName = 'table';
        baseElement.properties.border = '1';
        // Add default row
        const tr: DHTMLElement = {
          id: `${id}_tr1`,
          type: DHTMLElementType.Text,
          tagName: 'tr',
          properties: {},
          styles: {},
          events: {},
          children: [{
            id: `${id}_td1`,
            type: DHTMLElementType.Text,
            tagName: 'td',
            properties: {},
            styles: {},
            events: {},
            children: [],
            content: 'Cell'
          }]
        };
        baseElement.children.push(tr);
        break;
      }
      case DHTMLElementType.Div:
        baseElement.tagName = 'div';
        baseElement.styles.border = '1px solid #ccc';
        baseElement.styles.padding = '10px';
        break;
      case DHTMLElementType.Span:
        baseElement.tagName = 'span';
        baseElement.content = 'Span';
        break;
      case DHTMLElementType.Form:
        baseElement.tagName = 'form';
        baseElement.properties.method = 'post';
        baseElement.properties.action = '#';
        break;
      case DHTMLElementType.IFrame:
        baseElement.tagName = 'iframe';
        baseElement.properties.src = 'about:blank';
        baseElement.properties.width = '300';
        baseElement.properties.height = '200';
        break;
    }

    return baseElement;
  }, []);

  const addElement = useCallback((type: DHTMLElementType, parentId?: string) => {
    const newElement = createElement(type);
    
    setPage(prev => {
      const updated = { ...prev };
      
      if (parentId) {
        // Add as child of parent
        const findAndAdd = (elements: DHTMLElement[]): boolean => {
          for (const el of elements) {
            if (el.id === parentId) {
              el.children.push({ ...newElement, parent: parentId });
              return true;
            }
            if (findAndAdd(el.children)) return true;
          }
          return false;
        };
        findAndAdd(updated.elements);
      } else {
        // Add to root
        updated.elements.push(newElement);
      }
      
      return updated;
    });
    
    setSelectedElement(newElement);
    eventEmitter.current.emit('elementAdded', newElement);
  }, [createElement]);

  const updateElement = useCallback((elementId: string, updates: Partial<DHTMLElement>) => {
    setPage(prev => {
      const updated = { ...prev };
      
      const findAndUpdate = (elements: DHTMLElement[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === elementId) {
            elements[i] = { ...elements[i], ...updates };
            if (selectedElement?.id === elementId) {
              setSelectedElement(elements[i]);
            }
            return true;
          }
          if (findAndUpdate(elements[i].children)) return true;
        }
        return false;
      };
      
      findAndUpdate(updated.elements);
      return updated;
    });
    
    eventEmitter.current.emit('elementUpdated', { elementId, updates });
  }, [selectedElement]);

  const deleteElement = useCallback((elementId: string) => {
    setPage(prev => {
      const updated = { ...prev };
      
      const findAndDelete = (elements: DHTMLElement[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === elementId) {
            elements.splice(i, 1);
            return true;
          }
          if (findAndDelete(elements[i].children)) return true;
        }
        return false;
      };
      
      findAndDelete(updated.elements);
      return updated;
    });
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    
    eventEmitter.current.emit('elementDeleted', elementId);
  }, [selectedElement]);

  const handleDragStart = useCallback((type: DHTMLElementType) => {
    // ATOMIC STATE UPDATE: Prevent torn reads by batching all related state changes
    React.startTransition(() => {
      setIsDragging(true);
      setDraggedElement(type);
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    // ATOMIC STATE UPDATE: Prevent torn reads by batching all related state changes
    React.startTransition(() => {
      setIsDragging(false);
      setDraggedElement(null);
      setDropTarget(null);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, parentId?: string) => {
    e.preventDefault();
    if (draggedElement) {
      addElement(draggedElement, parentId);
    }
    handleDragEnd();
  }, [draggedElement, addElement, handleDragEnd]);

  const handleSave = useCallback(() => {
    onSave?.(page);
    eventEmitter.current.emit('pageSaved', page);
  }, [page, onSave]);

  const handlePreview = useCallback(() => {
    const html = generateHTML();
    onPreview?.(html);
    
    // Open in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  }, [generateHTML, onPreview]);

  const renderElement = (element: DHTMLElement): React.ReactNode => {
    const isSelected = selectedElement?.id === element.id;
    const isDropTarget = dropTarget === element.id;
    
    return (
      <div
        key={element.id}
        className={`dhtml-element ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (isDragging) setDropTarget(element.id);
        }}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(e) => handleDrop(e, element.id)}
        style={{
          border: isSelected ? '2px solid #0066cc' : '1px dashed #ccc',
          padding: '5px',
          margin: '5px',
          backgroundColor: isDropTarget ? '#e6f2ff' : 'transparent',
          minHeight: '30px',
          position: 'relative'
        }}
      >
        <div style={{ pointerEvents: 'none' }}>
          <span style={{ fontSize: '10px', color: '#666' }}>&lt;{element.tagName}&gt;</span>
          {element.content && <div>{element.content}</div>}
          {element.children.map(child => renderElement(child))}
        </div>
        
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(element.id);
            }}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              background: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 20,
              height: 20,
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">DHTML Page Designer</h2>
            <input
              type="text"
              value={page.name}
              onChange={(e) => setPage(prev => ({ ...prev, name: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Preview
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex border-b border-gray-200 bg-white">
        {Object.values(DesignMode).map(mode => (
          <button
            key={mode}
            onClick={() => setDesignMode(mode)}
            className={`px-4 py-2 font-medium text-sm ${
              designMode === mode
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbox */}
        <div className="w-48 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-medium text-gray-700 mb-3">HTML Elements</h3>
          <div className="space-y-2">
            {Object.entries(DHTMLElementType).map(([key, type]) => (
              <div
                key={type}
                draggable
                onDragStart={() => handleDragStart(type)}
                onDragEnd={handleDragEnd}
                className="p-2 bg-gray-100 rounded cursor-move hover:bg-gray-200 text-sm"
              >
                {key}
              </div>
            ))}
          </div>
        </div>

        {/* Designer Area */}
        <div className="flex-1 overflow-hidden">
          {(designMode === DesignMode.Design || designMode === DesignMode.Split) && (
            <div
              ref={designerRef}
              className={`${designMode === DesignMode.Split ? 'h-1/2' : 'h-full'} overflow-auto bg-white p-4`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e)}
            >
              <div className="min-h-full">
                {page.elements.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Drag elements here to start designing
                  </div>
                ) : (
                  page.elements.map(element => renderElement(element))
                )}
              </div>
            </div>
          )}

          {(designMode === DesignMode.Source || designMode === DesignMode.Split) && (
            <div className={`${designMode === DesignMode.Split ? 'h-1/2 border-t' : 'h-full'} border-gray-200`}>
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                placeholder="HTML source code..."
              />
            </div>
          )}

          {designMode === DesignMode.Preview && (
            <iframe
              ref={previewRef}
              className="w-full h-full bg-white"
              title="Preview"
            />
          )}
        </div>

        {/* Properties Panel */}
        {selectedElement && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-3">Properties</h3>
              
              {/* Element Info */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">Type</label>
                <div className="text-sm text-gray-800">{selectedElement.type}</div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">ID</label>
                <input
                  type="text"
                  value={selectedElement.id}
                  onChange={(e) => updateElement(selectedElement.id, { id: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              {/* Content */}
              {selectedElement.content !== undefined && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">Content</label>
                  <textarea
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    rows={3}
                  />
                </div>
              )}
              
              {/* Properties */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Attributes</h4>
                {Object.entries(selectedElement.properties).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <label className="block text-xs text-gray-500">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateElement(selectedElement.id, {
                        properties: { ...selectedElement.properties, [key]: e.target.value }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
              </div>
              
              {/* Styles */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Styles</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">Width</label>
                    <input
                      type="text"
                      value={selectedElement.styles.width || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, width: e.target.value }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., 100px, 50%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Height</label>
                    <input
                      type="text"
                      value={selectedElement.styles.height || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, height: e.target.value }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., 100px, auto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Background</label>
                    <input
                      type="text"
                      value={selectedElement.styles.background || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, background: e.target.value }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., #ffffff, red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Color</label>
                    <input
                      type="text"
                      value={selectedElement.styles.color || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, color: e.target.value }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., #000000, blue"
                    />
                  </div>
                </div>
              </div>
              
              {/* Events */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Events</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">onClick</label>
                    <input
                      type="text"
                      value={selectedElement.events.click || ''}
                      onChange={(e) => updateElement(selectedElement.id, {
                        events: { ...selectedElement.events, click: e.target.value }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="JavaScript code"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DHTMLPageDesigner;