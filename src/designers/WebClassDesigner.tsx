import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// WebClass Types
export enum WebItemType {
  HTMLPage = 'HTMLPage',
  HTMLTemplate = 'HTMLTemplate',
  CustomWebItem = 'CustomWebItem',
  DatabasePage = 'DatabasePage',
  FormHandler = 'FormHandler',
  FileUpload = 'FileUpload',
}

export enum ResponseFormat {
  HTML = 'HTML',
  XML = 'XML',
  JSON = 'JSON',
  PlainText = 'PlainText',
  Binary = 'Binary',
}

export enum SessionManagement {
  None = 'None',
  Cookies = 'Cookies',
  URLRewriting = 'URLRewriting',
  HiddenFields = 'HiddenFields',
}

export enum StateManagement {
  None = 'None',
  InProcess = 'InProcess',
  StateServer = 'StateServer',
  Database = 'Database',
}

// WebItem Event Types
export enum WebItemEventType {
  Respond = 'Respond',
  ProcessTag = 'ProcessTag',
  UserEvent = 'UserEvent',
  Start = 'Start',
  End = 'End',
  Error = 'Error',
}

// Template Tag
export interface TemplateTag {
  id: string;
  name: string;
  replacement: string;
  htmlContent: string;
  attributes: { [key: string]: string };
}

// Web Item
export interface WebItem {
  id: string;
  type: WebItemType;
  name: string;
  tagPrefix: string;
  templateFile?: string;
  htmlContent: string;
  responseFormat: ResponseFormat;
  cacheTimeout: number;
  requiresAuth: boolean;
  events: Array<{
    type: WebItemEventType;
    code: string;
  }>;
  tags: TemplateTag[];
  customProperties: { [key: string]: any };
}

// Database Connection
export interface DatabaseConnection {
  name: string;
  connectionString: string;
  provider: string;
  timeout: number;
  pooling: boolean;
}

// Form Field
export interface FormField {
  name: string;
  type: string;
  required: boolean;
  validation: string;
  defaultValue: any;
}

// WebClass Definition
export interface WebClassDefinition {
  name: string;
  description: string;
  version: string;
  author: string;
  namespace: string;
  sessionManagement: SessionManagement;
  stateManagement: StateManagement;
  sessionTimeout: number;
  maxRequestSize: number;
  enableDebugging: boolean;
  enableTracing: boolean;
  defaultResponseFormat: ResponseFormat;
  templatePath: string;
  imageBasePath: string;
  stylesheetPath: string;
  scriptPath: string;
  webItems: WebItem[];
  databaseConnections: DatabaseConnection[];
  globalEvents: Array<{
    name: string;
    code: string;
  }>;
  customClasses: Array<{
    name: string;
    code: string;
  }>;
  configuration: {
    [key: string]: string;
  };
}

// HTML Element Types
export enum HTMLElementType {
  Div = 'div',
  Span = 'span',
  P = 'p',
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  Form = 'form',
  Input = 'input',
  TextArea = 'textarea',
  Select = 'select',
  Button = 'button',
  Table = 'table',
  Img = 'img',
  A = 'a',
  Ul = 'ul',
  Ol = 'ol',
  Li = 'li',
}

// HTML Element
export interface HTMLElement {
  id: string;
  type: HTMLElementType;
  attributes: { [key: string]: string };
  content: string;
  children: HTMLElement[];
  events: { [key: string]: string };
  styles: { [key: string]: string };
}

interface WebClassDesignerProps {
  initialWebClass?: WebClassDefinition;
  onSave?: (webClass: WebClassDefinition) => void;
  onPreview?: (webClass: WebClassDefinition) => void;
}

export const WebClassDesigner: React.FC<WebClassDesignerProps> = ({
  initialWebClass,
  onSave,
  onPreview,
}) => {
  const [webClass, setWebClass] = useState<WebClassDefinition>(
    initialWebClass || {
      name: 'WebClass1',
      description: 'Web Application',
      version: '1.0',
      author: '',
      namespace: 'WebApp',
      sessionManagement: SessionManagement.Cookies,
      stateManagement: StateManagement.InProcess,
      sessionTimeout: 20,
      maxRequestSize: 4096,
      enableDebugging: true,
      enableTracing: false,
      defaultResponseFormat: ResponseFormat.HTML,
      templatePath: 'templates/',
      imageBasePath: 'images/',
      stylesheetPath: 'css/',
      scriptPath: 'scripts/',
      webItems: [
        {
          id: 'home',
          type: WebItemType.HTMLPage,
          name: 'Home',
          tagPrefix: 'WC',
          htmlContent: '<html><body><h1>Welcome</h1></body></html>',
          responseFormat: ResponseFormat.HTML,
          cacheTimeout: 0,
          requiresAuth: false,
          events: [],
          tags: [],
          customProperties: {},
        },
      ],
      databaseConnections: [],
      globalEvents: [],
      customClasses: [],
      configuration: {},
    }
  );

  const [selectedWebItem, setSelectedWebItem] = useState<WebItem | null>(
    webClass.webItems[0] || null
  );
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'html' | 'events' | 'config'>('design');
  const [htmlContent, setHtmlContent] = useState(selectedWebItem?.htmlContent || '');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const designerRef = useRef<HTMLDivElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // HTML Element Toolbox
  const htmlElements = [
    { type: HTMLElementType.Div, icon: '▢', name: 'Div', category: 'Layout' },
    { type: HTMLElementType.Span, icon: '◦', name: 'Span', category: 'Layout' },
    { type: HTMLElementType.P, icon: '¶', name: 'Paragraph', category: 'Text' },
    { type: HTMLElementType.H1, icon: 'H1', name: 'Heading 1', category: 'Text' },
    { type: HTMLElementType.H2, icon: 'H2', name: 'Heading 2', category: 'Text' },
    { type: HTMLElementType.H3, icon: 'H3', name: 'Heading 3', category: 'Text' },
    { type: HTMLElementType.Form, icon: '📝', name: 'Form', category: 'Forms' },
    { type: HTMLElementType.Input, icon: '□', name: 'Input', category: 'Forms' },
    { type: HTMLElementType.TextArea, icon: '▦', name: 'Text Area', category: 'Forms' },
    { type: HTMLElementType.Select, icon: '▼', name: 'Select', category: 'Forms' },
    { type: HTMLElementType.Button, icon: 'Btn', name: 'Button', category: 'Forms' },
    { type: HTMLElementType.Table, icon: '▦', name: 'Table', category: 'Data' },
    { type: HTMLElementType.Img, icon: '🖼️', name: 'Image', category: 'Media' },
    { type: HTMLElementType.A, icon: '🔗', name: 'Link', category: 'Navigation' },
    { type: HTMLElementType.Ul, icon: '• • •', name: 'Unordered List', category: 'Lists' },
    { type: HTMLElementType.Ol, icon: '1 2 3', name: 'Ordered List', category: 'Lists' },
    { type: HTMLElementType.Li, icon: '•', name: 'List Item', category: 'Lists' },
  ];

  const addWebItem = useCallback(() => {
    const newWebItem: WebItem = {
      id: `webitem_${Date.now()}`,
      type: WebItemType.HTMLPage,
      name: `WebItem${webClass.webItems.length + 1}`,
      tagPrefix: 'WC',
      htmlContent:
        '<html><head><title>New Page</title></head><body><h1>New Page</h1></body></html>',
      responseFormat: ResponseFormat.HTML,
      cacheTimeout: 0,
      requiresAuth: false,
      events: [],
      tags: [],
      customProperties: {},
    };

    setWebClass(prev => ({
      ...prev,
      webItems: [...prev.webItems, newWebItem],
    }));

    setSelectedWebItem(newWebItem);
  }, [webClass.webItems.length]);

  const updateWebItem = useCallback(
    (webItemId: string, updates: Partial<WebItem>) => {
      setWebClass(prev => {
        const updated = { ...prev };
        const itemIndex = updated.webItems.findIndex(item => item.id === webItemId);
        if (itemIndex >= 0) {
          updated.webItems[itemIndex] = { ...updated.webItems[itemIndex], ...updates };

          if (selectedWebItem?.id === webItemId) {
            setSelectedWebItem(updated.webItems[itemIndex]);
          }
        }
        return updated;
      });

      eventEmitter.current.emit('webItemUpdated', { webItemId, updates });
    },
    [selectedWebItem]
  );

  const deleteWebItem = useCallback(
    (webItemId: string) => {
      setWebClass(prev => ({
        ...prev,
        webItems: prev.webItems.filter(item => item.id !== webItemId),
      }));

      if (selectedWebItem?.id === webItemId) {
        setSelectedWebItem(webClass.webItems[0] || null);
      }

      eventEmitter.current.emit('webItemDeleted', { webItemId });
    },
    [selectedWebItem, webClass.webItems]
  );

  const addTemplateTag = useCallback(
    (webItemId: string) => {
      const newTag: TemplateTag = {
        id: `tag_${Date.now()}`,
        name: `Tag${(selectedWebItem?.tags.length || 0) + 1}`,
        replacement: '',
        htmlContent: '<p>Template content</p>',
        attributes: {},
      };

      updateWebItem(webItemId, {
        tags: [...(selectedWebItem?.tags || []), newTag],
      });
    },
    [selectedWebItem, updateWebItem]
  );

  const addDatabaseConnection = useCallback(() => {
    const newConnection: DatabaseConnection = {
      name: `Connection${webClass.databaseConnections.length + 1}`,
      connectionString: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=database.mdb',
      provider: 'Microsoft.Jet.OLEDB.4.0',
      timeout: 30,
      pooling: true,
    };

    setWebClass(prev => ({
      ...prev,
      databaseConnections: [...prev.databaseConnections, newConnection],
    }));
  }, [webClass.databaseConnections.length]);

  const handleSave = useCallback(() => {
    onSave?.(webClass);
    eventEmitter.current.emit('webClassSaved', webClass);
  }, [webClass, onSave]);

  const handlePreview = useCallback(() => {
    onPreview?.(webClass);
    eventEmitter.current.emit('webClassPreviewed', webClass);
  }, [webClass, onPreview]);

  const generateVBCode = useCallback((): string => {
    const lines: string[] = [];

    // Header
    lines.push(`VERSION 1.0 CLASS`);
    lines.push(`BEGIN`);
    lines.push(`  MultiUse = -1  'True`);
    lines.push(`  Persistable = 0  'NotPersistable`);
    lines.push(`  DataBindingBehavior = 0  'vbNone`);
    lines.push(`  DataSourceBehavior  = 0  'vbNone`);
    lines.push(`  MTSTransactionMode  = 0  'NotAnMTSObject`);
    lines.push(`END`);
    lines.push(`Attribute VB_Name = "${webClass.name}"`);
    lines.push(`Attribute VB_GlobalNameSpace = False`);
    lines.push(`Attribute VB_Creatable = True`);
    lines.push(`Attribute VB_PredeclaredId = False`);
    lines.push(`Attribute VB_Exposed = True`);
    lines.push('');

    // WebClass declaration
    lines.push(`Option Explicit`);
    lines.push(`Option Compare Text`);
    lines.push('');
    lines.push(`'Local variable to hold reference to the WebClass`);
    lines.push(`Private WithEvents m_${webClass.name} As WebClass`);
    lines.push('');

    // Initialize event
    lines.push(`Private Sub Class_Initialize()`);
    lines.push(`    Set m_${webClass.name} = New WebClass`);
    lines.push(`    Set m_${webClass.name}.Application = App`);
    lines.push(`    m_${webClass.name}.Name = "${webClass.name}"`);
    lines.push(
      `    m_${webClass.name}.StateManagement = ${webClass.stateManagement === StateManagement.InProcess ? 'wcStateManagementInProcess' : '0'}`
    );
    lines.push(`    m_${webClass.name}.SessionTimeout = ${webClass.sessionTimeout}`);
    lines.push(`End Sub`);
    lines.push('');

    // Web Items
    webClass.webItems.forEach(webItem => {
      lines.push(`'${webItem.name} WebItem`);
      lines.push(`Private Sub m_${webClass.name}_${webItem.name}_Respond()`);
      lines.push(`    Dim strHTML As String`);
      lines.push('');

      if (webItem.type === WebItemType.HTMLTemplate) {
        lines.push(`    'Process template tags`);
        webItem.tags.forEach(tag => {
          lines.push(`    strHTML = Replace(strHTML, "<!--${tag.name}-->", "${tag.replacement}")`);
        });
      }

      lines.push(`    'Set content type`);
      lines.push(
        `    Response.ContentType = "${webItem.responseFormat === ResponseFormat.HTML ? 'text/html' : webItem.responseFormat === ResponseFormat.XML ? 'text/xml' : webItem.responseFormat === ResponseFormat.JSON ? 'application/json' : 'text/plain'}"`
      );
      lines.push('');

      if (webItem.cacheTimeout > 0) {
        lines.push(`    'Set cache timeout`);
        lines.push(`    Response.Expires = ${webItem.cacheTimeout}`);
        lines.push('');
      }

      lines.push(`    'Write HTML content`);
      lines.push(`    strHTML = "${webItem.htmlContent.replace(/"/g, '""')}"`);
      lines.push(`    Response.Write strHTML`);
      lines.push(`End Sub`);
      lines.push('');

      // Event handlers for the web item
      webItem.events.forEach(event => {
        lines.push(`Private Sub m_${webClass.name}_${webItem.name}_${event.type}()`);
        lines.push(`    ${event.code || "'Event handler code"}`);
        lines.push(`End Sub`);
        lines.push('');
      });
    });

    // Global events
    webClass.globalEvents.forEach(event => {
      lines.push(`Private Sub m_${webClass.name}_${event.name}()`);
      lines.push(`    ${event.code || "'Global event handler code"}`);
      lines.push(`End Sub`);
      lines.push('');
    });

    // Database connection methods
    if (webClass.databaseConnections.length > 0) {
      lines.push(`'Database connection methods`);
      webClass.databaseConnections.forEach(conn => {
        lines.push(`Private Function Get${conn.name}Connection() As ADODB.Connection`);
        lines.push(`    Dim conn As New ADODB.Connection`);
        lines.push(`    conn.ConnectionString = "${conn.connectionString}"`);
        lines.push(`    conn.ConnectionTimeout = ${conn.timeout}`);
        lines.push(`    conn.Open`);
        lines.push(`    Set Get${conn.name}Connection = conn`);
        lines.push(`End Function`);
        lines.push('');
      });
    }

    // Utility methods
    lines.push(`'Utility methods`);
    lines.push(`Private Function HTMLEncode(ByVal strText As String) As String`);
    lines.push(`    strText = Replace(strText, "&", "&amp;")`);
    lines.push(`    strText = Replace(strText, "<", "&lt;")`);
    lines.push(`    strText = Replace(strText, ">", "&gt;")`);
    lines.push(`    strText = Replace(strText, """", "&quot;")`);
    lines.push(`    HTMLEncode = strText`);
    lines.push(`End Function`);
    lines.push('');

    lines.push(`Private Function URLEncode(ByVal strText As String) As String`);
    lines.push(`    'URL encoding implementation`);
    lines.push(`    URLEncode = Server.URLEncode(strText)`);
    lines.push(`End Function`);
    lines.push('');

    // Session management helpers
    if (webClass.sessionManagement !== SessionManagement.None) {
      lines.push(`Private Function GetSessionValue(ByVal strKey As String) As Variant`);
      lines.push(`    GetSessionValue = Session(strKey)`);
      lines.push(`End Function`);
      lines.push('');

      lines.push(`Private Sub SetSessionValue(ByVal strKey As String, ByVal varValue As Variant)`);
      lines.push(`    Session(strKey) = varValue`);
      lines.push(`End Sub`);
      lines.push('');
    }

    return lines.join('\n');
  }, [webClass]);

  const generateHTML = useCallback((webItem: WebItem): string => {
    let html = webItem.htmlContent;

    // Process template tags - pre-compile regex for better performance
    webItem.tags.forEach(tag => {
      // Escape regex special characters in tag name
      const escapedTagName = tag.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagRegex = new RegExp(`<!--${escapedTagName}-->`, 'g');
      html = html.replace(tagRegex, tag.htmlContent || '');
    });

    return html;
  }, []);

  const renderWebItemPreview = useCallback(
    (webItem: WebItem): React.ReactNode => {
      const html = generateHTML(webItem);

      return (
        <div
          className="w-full h-full bg-white border"
          style={{
            width:
              previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px',
            height:
              previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '1024px' : '667px',
            maxWidth: '100%',
            margin: '0 auto',
          }}
        >
          <iframe
            srcDoc={html}
            className="w-full h-full"
            style={{ border: 'none' }}
            title={`${webItem.name} Preview`}
          />
        </div>
      );
    },
    [generateHTML, previewMode]
  );

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">WebClass Designer</h2>
            <input
              type="text"
              value={webClass.name}
              onChange={e => setWebClass(prev => ({ ...prev, name: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={previewMode}
              onChange={e => setPreviewMode(e.target.value as 'desktop' | 'tablet' | 'mobile')}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
              <option value="mobile">Mobile</option>
            </select>
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

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200 bg-white">
        {(['design', 'html', 'events', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          {activeTab === 'design' && (
            <div className="p-4">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">Web Items</h3>
                  <button
                    onClick={addWebItem}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {webClass.webItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedWebItem(item)}
                      className={`p-2 rounded cursor-pointer text-sm ${
                        selectedWebItem?.id === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">HTML Elements</h3>
                {['Layout', 'Text', 'Forms', 'Data', 'Media', 'Navigation', 'Lists'].map(
                  category => (
                    <div key={category} className="mb-3">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">{category}</h4>
                      <div className="space-y-1">
                        {htmlElements
                          .filter(el => el.category === category)
                          .map(element => (
                            <div
                              key={element.type}
                              className="p-2 bg-gray-100 rounded cursor-move hover:bg-gray-200 flex items-center gap-2 text-xs"
                            >
                              <span>{element.icon}</span>
                              <span>{element.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === 'html' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-2">Template Tags</h3>
              {selectedWebItem && (
                <>
                  <button
                    onClick={() => selectedWebItem && addTemplateTag(selectedWebItem.id)}
                    className="mb-2 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                  >
                    Add Tag
                  </button>
                  <div className="space-y-2">
                    {selectedWebItem.tags.map(tag => (
                      <div key={tag.id} className="p-2 border border-gray-300 rounded">
                        <input
                          type="text"
                          value={tag.name}
                          onChange={e => {
                            const updatedTags = selectedWebItem.tags.map(t =>
                              t.id === tag.id ? { ...t, name: e.target.value } : t
                            );
                            updateWebItem(selectedWebItem.id, { tags: updatedTags });
                          }}
                          className="w-full px-1 py-1 text-xs border border-gray-300 rounded mb-1"
                          placeholder="Tag name"
                        />
                        <textarea
                          value={tag.htmlContent}
                          onChange={e => {
                            const updatedTags = selectedWebItem.tags.map(t =>
                              t.id === tag.id ? { ...t, htmlContent: e.target.value } : t
                            );
                            updateWebItem(selectedWebItem.id, { tags: updatedTags });
                          }}
                          className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                          rows={3}
                          placeholder="HTML content"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-2">Event Handlers</h3>
              {selectedWebItem && (
                <div className="space-y-2">
                  {Object.values(WebItemEventType).map(eventType => (
                    <div key={eventType} className="p-2 border border-gray-300 rounded">
                      <div className="text-sm font-medium mb-1">{eventType}</div>
                      <textarea
                        value={selectedWebItem.events.find(e => e.type === eventType)?.code || ''}
                        onChange={e => {
                          const updatedEvents = [...selectedWebItem.events];
                          const existingIndex = updatedEvents.findIndex(
                            ev => ev.type === eventType
                          );

                          if (existingIndex >= 0) {
                            updatedEvents[existingIndex].code = e.target.value;
                          } else {
                            updatedEvents.push({ type: eventType, code: e.target.value });
                          }

                          updateWebItem(selectedWebItem.id, { events: updatedEvents });
                        }}
                        className="w-full px-1 py-1 text-xs font-mono border border-gray-300 rounded"
                        rows={4}
                        placeholder={`'${eventType} event handler code`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">Database Connections</h3>
                  <button
                    onClick={addDatabaseConnection}
                    className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {webClass.databaseConnections.map((conn, index) => (
                    <div key={index} className="p-2 border border-gray-300 rounded">
                      <input
                        type="text"
                        value={conn.name}
                        onChange={e => {
                          const updated = [...webClass.databaseConnections];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setWebClass(prev => ({ ...prev, databaseConnections: updated }));
                        }}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded mb-1"
                        placeholder="Connection name"
                      />
                      <textarea
                        value={conn.connectionString}
                        onChange={e => {
                          const updated = [...webClass.databaseConnections];
                          updated[index] = { ...updated[index], connectionString: e.target.value };
                          setWebClass(prev => ({ ...prev, databaseConnections: updated }));
                        }}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                        rows={2}
                        placeholder="Connection string"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="block text-xs font-medium">Session Management</label>
                    <select
                      value={webClass.sessionManagement}
                      onChange={e =>
                        setWebClass(prev => ({
                          ...prev,
                          sessionManagement: e.target.value as SessionManagement,
                        }))
                      }
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                    >
                      {Object.values(SessionManagement).map(mode => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium">State Management</label>
                    <select
                      value={webClass.stateManagement}
                      onChange={e =>
                        setWebClass(prev => ({
                          ...prev,
                          stateManagement: e.target.value as StateManagement,
                        }))
                      }
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                    >
                      {Object.values(StateManagement).map(mode => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={webClass.sessionTimeout}
                      onChange={e =>
                        setWebClass(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))
                      }
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'design' && selectedWebItem && (
            <div ref={designerRef} className="w-full h-full overflow-auto bg-gray-200 p-4">
              {renderWebItemPreview(selectedWebItem)}
            </div>
          )}

          {activeTab === 'html' && selectedWebItem && (
            <div className="w-full h-full p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">HTML Editor</h3>
                <div className="flex gap-2">
                  <select
                    value={selectedWebItem.type}
                    onChange={e =>
                      updateWebItem(selectedWebItem.id, { type: e.target.value as WebItemType })
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {Object.values(WebItemType).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedWebItem.responseFormat}
                    onChange={e =>
                      updateWebItem(selectedWebItem.id, {
                        responseFormat: e.target.value as ResponseFormat,
                      })
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {Object.values(ResponseFormat).map(format => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={selectedWebItem.htmlContent}
                onChange={e => {
                  updateWebItem(selectedWebItem.id, { htmlContent: e.target.value });
                  setHtmlContent(e.target.value);
                }}
                className="w-full h-full font-mono text-sm p-2 border border-gray-300 rounded resize-none"
                style={{ minHeight: '500px' }}
                placeholder="HTML content..."
              />
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Global Events</h3>

              <button
                onClick={() => {
                  const newEvent = {
                    name: `Event${webClass.globalEvents.length + 1}`,
                    code: "'Event handler code",
                  };
                  setWebClass(prev => ({
                    ...prev,
                    globalEvents: [...prev.globalEvents, newEvent],
                  }));
                }}
                className="mb-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Global Event
              </button>

              <div className="space-y-4">
                {webClass.globalEvents.map((event, index) => (
                  <div key={index} className="p-4 border border-gray-300 rounded">
                    <input
                      type="text"
                      value={event.name}
                      onChange={e => {
                        const updated = [...webClass.globalEvents];
                        updated[index] = { ...updated[index], name: e.target.value };
                        setWebClass(prev => ({ ...prev, globalEvents: updated }));
                      }}
                      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded"
                      placeholder="Event name"
                    />
                    <textarea
                      value={event.code}
                      onChange={e => {
                        const updated = [...webClass.globalEvents];
                        updated[index] = { ...updated[index], code: e.target.value };
                        setWebClass(prev => ({ ...prev, globalEvents: updated }));
                      }}
                      className="w-full font-mono text-sm p-2 border border-gray-300 rounded"
                      rows={8}
                      placeholder="VB6 code..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">WebClass Configuration</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">General Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium">Description</label>
                      <input
                        type="text"
                        value={webClass.description}
                        onChange={e =>
                          setWebClass(prev => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Author</label>
                      <input
                        type="text"
                        value={webClass.author}
                        onChange={e => setWebClass(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Version</label>
                      <input
                        type="text"
                        value={webClass.version}
                        onChange={e => setWebClass(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Resource Paths</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium">Template Path</label>
                      <input
                        type="text"
                        value={webClass.templatePath}
                        onChange={e =>
                          setWebClass(prev => ({ ...prev, templatePath: e.target.value }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Image Base Path</label>
                      <input
                        type="text"
                        value={webClass.imageBasePath}
                        onChange={e =>
                          setWebClass(prev => ({ ...prev, imageBasePath: e.target.value }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Stylesheet Path</label>
                      <input
                        type="text"
                        value={webClass.stylesheetPath}
                        onChange={e =>
                          setWebClass(prev => ({ ...prev, stylesheetPath: e.target.value }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Generated VB6 Code Preview</h4>
                <textarea
                  value={generateVBCode()}
                  readOnly
                  className="w-full font-mono text-sm p-2 border border-gray-300 rounded resize-none"
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedWebItem && activeTab === 'design' && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-3">WebItem Properties</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Name</label>
                  <input
                    type="text"
                    value={selectedWebItem.name}
                    onChange={e => updateWebItem(selectedWebItem.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Tag Prefix</label>
                  <input
                    type="text"
                    value={selectedWebItem.tagPrefix}
                    onChange={e => updateWebItem(selectedWebItem.id, { tagPrefix: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Cache Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={selectedWebItem.cacheTimeout}
                    onChange={e =>
                      updateWebItem(selectedWebItem.id, { cacheTimeout: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedWebItem.requiresAuth}
                      onChange={e =>
                        updateWebItem(selectedWebItem.id, { requiresAuth: e.target.checked })
                      }
                    />
                    Requires Authentication
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Template File</label>
                  <input
                    type="text"
                    value={selectedWebItem.templateFile || ''}
                    onChange={e =>
                      updateWebItem(selectedWebItem.id, { templateFile: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="template.html"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => deleteWebItem(selectedWebItem.id)}
                    className="w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Delete WebItem
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebClassDesigner;
