/**
 * VB6 DHTML Page Designer Control
 * Provides complete HTML page design and editing capabilities for VB6 applications
 * Compatible with Internet Explorer engine and VB6 DHTML applications
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Control } from '../../types/Control';

interface DHtmlPageControlProps {
  control: Control;
  isDesignMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onChange?: (value: any) => void;
}

// DHTML Event types
export enum DHtmlEventType {
  onabort = 'onabort',
  onafterupdate = 'onafterupdate',
  onbeforeunload = 'onbeforeunload',
  onbeforeupdate = 'onbeforeupdate',
  onblur = 'onblur',
  onbounce = 'onbounce',
  onchange = 'onchange',
  onclick = 'onclick',
  ondataavailable = 'ondataavailable',
  ondatasetchanged = 'ondatasetchanged',
  ondatasetcomplete = 'ondatasetcomplete',
  ondblclick = 'ondblclick',
  ondragstart = 'ondragstart',
  onerror = 'onerror',
  onerrorupdate = 'onerrorupdate',
  onfilterchange = 'onfilterchange',
  onfinish = 'onfinish',
  onfocus = 'onfocus',
  onhelp = 'onhelp',
  onkeydown = 'onkeydown',
  onkeypress = 'onkeypress',
  onkeyup = 'onkeyup',
  onlayoutcomplete = 'onlayoutcomplete',
  onload = 'onload',
  onmousedown = 'onmousedown',
  onmousemove = 'onmousemove',
  onmouseout = 'onmouseout',
  onmouseover = 'onmouseover',
  onmouseup = 'onmouseup',
  onreadystatechange = 'onreadystatechange',
  onreset = 'onreset',
  onresize = 'onresize',
  onrowenter = 'onrowenter',
  onrowexit = 'onrowexit',
  onrowsdelete = 'onrowsdelete',
  onrowsinserted = 'onrowsinserted',
  onscroll = 'onscroll',
  onselect = 'onselect',
  onselectionchange = 'onselectionchange',
  onselectstart = 'onselectstart',
  onstart = 'onstart',
  onstop = 'onstop',
  onsubmit = 'onsubmit',
  onunload = 'onunload'
}

// DHTML Document properties
export interface DHtmlDocument {
  title: string;
  bgColor: string;
  fgColor: string;
  linkColor: string;
  alinkColor: string;
  vlinkColor: string;
  charset: string;
  defaultCharset: string;
  mimeType: string;
  fileSize: string;
  fileCreatedDate: string;
  fileModifiedDate: string;
  fileUpdatedDate: string;
  security: string;
  protocol: string;
  nameProp: string;
  url: string;
  domain: string;
  referrer: string;
  lastModified: string;
  cookie: string;
  expando: boolean;
  documentMode: number;
  compatMode: string;
  designMode: 'on' | 'off';
}

export const DHtmlPageControl = forwardRef<HTMLDivElement, DHtmlPageControlProps>(
  ({ control, isDesignMode = false, onClick, onDoubleClick, onChange }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [currentHtml, setCurrentHtml] = useState(control.html || '');
    const [documentProperties, setDocumentProperties] = useState<Partial<DHtmlDocument>>({
      title: control.documentTitle || 'Untitled',
      bgColor: control.bgColor || '#FFFFFF',
      fgColor: control.fgColor || '#000000',
      linkColor: control.linkColor || '#0000FF',
      alinkColor: control.alinkColor || '#FF0000',
      vlinkColor: control.vlinkColor || '#800080',
      charset: control.charset || 'UTF-8',
      designMode: isDesignMode ? 'on' : 'off'
    });

    // Initialize DHTML document
    useEffect(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          // Set up initial HTML structure
          const initialHtml = control.html || `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="${documentProperties.charset}">
              <title>${documentProperties.title}</title>
              <style>
                body {
                  margin: 0;
                  padding: 8px;
                  font-family: ${control.font?.name || 'Arial'}, sans-serif;
                  font-size: ${control.font?.size || 10}pt;
                  background-color: ${documentProperties.bgColor};
                  color: ${documentProperties.fgColor};
                }
                a { color: ${documentProperties.linkColor}; }
                a:visited { color: ${documentProperties.vlinkColor}; }
                a:active { color: ${documentProperties.alinkColor}; }
                ${control.customCSS || ''}
              </style>
              ${control.scriptBlock || ''}
            </head>
            <body>
              ${control.bodyContent || '<p>DHTML Page</p>'}
            </body>
            </html>
          `;
          
          doc.open();
          doc.write(initialHtml);
          doc.close();

          // Set design mode
          if (doc.body) {
            doc.designMode = documentProperties.designMode || 'off';
          }

          // Add event listeners
          const handleDocumentChange = () => {
            const newHtml = doc.documentElement?.outerHTML || '';
            setCurrentHtml(newHtml);
            onChange?.({ html: newHtml });
          };

          // Monitor content changes
          if (doc.body) {
            const observer = new MutationObserver(handleDocumentChange);
            observer.observe(doc.body, {
              childList: true,
              subtree: true,
              attributes: true,
              characterData: true
            });

            return () => {
              observer.disconnect();
            };
          }

          setIsReady(true);
        }
      }
    }, [control.html, documentProperties, isDesignMode]);

    // VB6 Methods implementation
    const vb6Methods = {
      // Document methods
      write: (text: string) => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          doc.write(text);
        }
      },

      writeln: (text: string) => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          doc.writeln(text);
        }
      },

      clear: () => {
        const doc = iframeRef.current?.contentDocument;
        if (doc && doc.body) {
          // Safely clear content by removing children
          while (doc.body.firstChild) {
            doc.body.removeChild(doc.body.firstChild);
          }
        }
      },

      createElement: (tagName: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.createElement(tagName);
      },

      getElementById: (id: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.getElementById(id);
      },

      getElementsByTagName: (tagName: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.getElementsByTagName(tagName);
      },

      getElementsByName: (name: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.getElementsByName(name);
      },

      // Selection and range methods
      createRange: () => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.createRange();
      },

      getSelection: () => {
        const win = iframeRef.current?.contentWindow;
        return win?.getSelection();
      },

      execCommand: (command: string, showUI: boolean = false, value?: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.execCommand(command, showUI, value);
      },

      queryCommandEnabled: (command: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.queryCommandEnabled(command);
      },

      queryCommandState: (command: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.queryCommandState(command);
      },

      queryCommandValue: (command: string) => {
        const doc = iframeRef.current?.contentDocument;
        return doc?.queryCommandValue(command);
      },

      // Style manipulation
      createStyleSheet: (url?: string, index?: number) => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          const style = doc.createElement('style');
          if (url) {
            style.setAttribute('href', url);
          }
          if (doc.head) {
            if (index !== undefined && index >= 0 && index < doc.head.children.length) {
              doc.head.insertBefore(style, doc.head.children[index]);
            } else {
              doc.head.appendChild(style);
            }
          }
          return style;
        }
      },

      // Navigation methods
      navigate: (url: string) => {
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
      },

      refresh: () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.location.reload();
        }
      },

      stop: () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.stop();
        }
      },

      print: () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.print();
        }
      },

      // Data binding methods
      dataTransfer: {
        clearData: (format?: string) => {
          // Implement data transfer for drag/drop
        },
        getData: (format: string) => {
          // Return data in specified format
        },
        setData: (format: string, data: string) => {
          // Set data for transfer
        }
      }
    };

    // Expose methods to parent
    useEffect(() => {
      if (control.ref && typeof control.ref === 'object' && 'current' in control.ref) {
        control.ref.current = vb6Methods;
      }
    }, [control.ref, vb6Methods]);

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x || 0,
      top: control.y || 0,
      width: control.width || 400,
      height: control.height || 300,
      backgroundColor: control.backColor || '#FFFFFF',
      border: control.borderStyle ? `${control.borderWidth || 1}px solid ${control.borderColor || '#000000'}` : 'none',
      boxShadow: control.appearance === '3D' ? 'inset -1px -1px #404040, inset 1px 1px #ffffff' : 'none',
      overflow: 'hidden',
      cursor: isDesignMode ? 'default' : 'auto',
      opacity: control.visible !== false ? 1 : 0,
      zIndex: control.zIndex || 'auto'
    };

    return (
      <div
        ref={ref}
        style={containerStyle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        data-control-type="DHtmlPage"
        data-control-name={control.name}
      >
        {isDesignMode && !control.src ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            border: '2px dashed #808080',
            color: '#404040',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌐</div>
              <div>DHTML Page Designer</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                {control.src || 'Design Mode'}
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={control.src || 'about:blank'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            sandbox={control.sandbox || 'allow-scripts allow-same-origin allow-forms'}
            title={control.name || 'DHTML Page'}
          />
        )}
        {control.showStatusBar && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            backgroundColor: '#f0f0f0',
            borderTop: '1px solid #808080',
            fontSize: '11px',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span>{isReady ? 'Ready' : 'Loading...'}</span>
          </div>
        )}
      </div>
    );
  }
);

DHtmlPageControl.displayName = 'DHtmlPageControl';

// Helper function to create DHTML elements
export function createDHtmlElement(tagName: string, attributes?: Record<string, any>): HTMLElement {
  const element = document.createElement(tagName);
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key === 'events' && typeof value === 'object') {
        Object.entries(value).forEach(([eventName, handler]) => {
          element.addEventListener(eventName, handler as EventListener);
        });
      } else {
        element.setAttribute(key, String(value));
      }
    });
  }
  return element;
}

export default DHtmlPageControl;