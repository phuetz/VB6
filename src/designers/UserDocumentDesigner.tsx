import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// User Document Types
export enum DocumentContainerType {
  InternetExplorer = 'InternetExplorer',
  OfficeApplication = 'OfficeApplication',
  CustomContainer = 'CustomContainer',
  Standalone = 'Standalone',
}

export enum DocumentViewportMode {
  Normal = 'Normal',
  ScrollBars = 'ScrollBars',
  AutoScroll = 'AutoScroll',
  NoScroll = 'NoScroll',
}

export enum DocumentPrintMode {
  AllAtOnce = 'AllAtOnce',
  PageByPage = 'PageByPage',
  Selection = 'Selection',
}

export enum NavigationMode {
  None = 'None',
  Hyperlinks = 'Hyperlinks',
  Buttons = 'Buttons',
  Menu = 'Menu',
}

// Document Control Types
export enum DocumentControlType {
  Label = 'Label',
  TextBox = 'TextBox',
  CommandButton = 'CommandButton',
  CheckBox = 'CheckBox',
  OptionButton = 'OptionButton',
  ComboBox = 'ComboBox',
  ListBox = 'ListBox',
  Frame = 'Frame',
  Image = 'Image',
  PictureBox = 'PictureBox',
  Timer = 'Timer',
  HScrollBar = 'HScrollBar',
  VScrollBar = 'VScrollBar',
  Line = 'Line',
  Shape = 'Shape',
  OLE = 'OLE',
  WebBrowser = 'WebBrowser',
  ListView = 'ListView',
  TreeView = 'TreeView',
  ProgressBar = 'ProgressBar',
  Slider = 'Slider',
  StatusBar = 'StatusBar',
  ToolBar = 'ToolBar',
  TabStrip = 'TabStrip',
  SSTab = 'SSTab',
}

// Document Control
export interface DocumentControl {
  id: string;
  type: DocumentControlType;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  properties: { [key: string]: any };
  zIndex: number;
  visible: boolean;
  enabled: boolean;
  locked: boolean;
  tag: string;
}

// Hyperlink
export interface DocumentHyperlink {
  id: string;
  text: string;
  address: string;
  subAddress: string;
  screenTip: string;
  target: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

// Navigation Point
export interface NavigationPoint {
  id: string;
  name: string;
  caption: string;
  address: string;
  x: number;
  y: number;
}

// Document Page
export interface DocumentPage {
  id: string;
  name: string;
  title: string;
  size: {
    width: number;
    height: number;
  };
  margins: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  controls: DocumentControl[];
  hyperlinks: DocumentHyperlink[];
  navigationPoints: NavigationPoint[];
  backgroundImage?: string;
  backgroundColor?: string;
  printable: boolean;
}

// User Document Definition
export interface UserDocumentDefinition {
  name: string;
  title: string;
  author: string;
  description: string;
  version: string;
  containerType: DocumentContainerType;
  viewportMode: DocumentViewportMode;
  navigationMode: NavigationMode;
  printMode: DocumentPrintMode;
  persistable: boolean;
  scrollable: boolean;
  resizable: boolean;
  closeable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  helpFile?: string;
  helpContextId?: number;
  pages: DocumentPage[];
  menuBar: {
    enabled: boolean;
    items: Array<{
      caption: string;
      shortcut?: string;
      action: string;
    }>;
  };
  toolBar: {
    enabled: boolean;
    items: Array<{
      caption: string;
      icon?: string;
      action: string;
      tooltip?: string;
    }>;
  };
  statusBar: {
    enabled: boolean;
    panels: Array<{
      text: string;
      width: number;
      alignment: 'left' | 'center' | 'right';
    }>;
  };
}

interface UserDocumentDesignerProps {
  initialDocument?: UserDocumentDefinition;
  onSave?: (document: UserDocumentDefinition) => void;
  onPreview?: (document: UserDocumentDefinition) => void;
}

export const UserDocumentDesigner: React.FC<UserDocumentDesignerProps> = ({
  initialDocument,
  onSave,
  onPreview,
}) => {
  const [document, setDocument] = useState<UserDocumentDefinition>(
    initialDocument || {
      name: 'UserDocument1',
      title: 'User Document',
      author: '',
      description: '',
      version: '1.0',
      containerType: DocumentContainerType.InternetExplorer,
      viewportMode: DocumentViewportMode.ScrollBars,
      navigationMode: NavigationMode.Hyperlinks,
      printMode: DocumentPrintMode.AllAtOnce,
      persistable: true,
      scrollable: true,
      resizable: true,
      closeable: true,
      minimizable: true,
      maximizable: true,
      pages: [
        {
          id: 'page1',
          name: 'Page1',
          title: 'Page 1',
          size: { width: 800, height: 600 },
          margins: { left: 20, top: 20, right: 20, bottom: 20 },
          controls: [],
          hyperlinks: [],
          navigationPoints: [],
          printable: true,
        },
      ],
      menuBar: { enabled: false, items: [] },
      toolBar: { enabled: false, items: [] },
      statusBar: { enabled: false, panels: [] },
    }
  );

  const [selectedControl, setSelectedControl] = useState<{
    pageId: string;
    control: DocumentControl;
  } | null>(null);
  const [selectedPage, setSelectedPage] = useState<string>(document.pages[0]?.id || '');
  const [selectedHyperlink, setSelectedHyperlink] = useState<DocumentHyperlink | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DocumentControlType | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [mode, setMode] = useState<'design' | 'preview' | 'code'>('design');

  const designerRef = useRef<HTMLDivElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // MEMORY LEAK FIX: Cleanup EventEmitter to prevent memory leaks
  useEffect(() => {
    return () => {
      // Remove all listeners and clear references
      eventEmitter.current.removeAllListeners();
    };
  }, []);

  // Control toolbox items
  const toolboxItems = [
    { type: DocumentControlType.Label, icon: 'A', name: 'Label', category: 'Standard' },
    { type: DocumentControlType.TextBox, icon: '□', name: 'Text Box', category: 'Standard' },
    {
      type: DocumentControlType.CommandButton,
      icon: 'Btn',
      name: 'Command Button',
      category: 'Standard',
    },
    { type: DocumentControlType.CheckBox, icon: '☑', name: 'Check Box', category: 'Standard' },
    {
      type: DocumentControlType.OptionButton,
      icon: '◉',
      name: 'Option Button',
      category: 'Standard',
    },
    { type: DocumentControlType.ComboBox, icon: '▼', name: 'Combo Box', category: 'Standard' },
    { type: DocumentControlType.ListBox, icon: '≡', name: 'List Box', category: 'Standard' },
    { type: DocumentControlType.Frame, icon: '▢', name: 'Frame', category: 'Standard' },
    { type: DocumentControlType.Image, icon: '🖼️', name: 'Image', category: 'Standard' },
    { type: DocumentControlType.PictureBox, icon: '📷', name: 'Picture Box', category: 'Standard' },
    { type: DocumentControlType.Timer, icon: '⏱️', name: 'Timer', category: 'Standard' },
    {
      type: DocumentControlType.HScrollBar,
      icon: '↔',
      name: 'H Scroll Bar',
      category: 'Standard',
    },
    {
      type: DocumentControlType.VScrollBar,
      icon: '↕',
      name: 'V Scroll Bar',
      category: 'Standard',
    },
    { type: DocumentControlType.Line, icon: '━', name: 'Line', category: 'Standard' },
    { type: DocumentControlType.Shape, icon: '▭', name: 'Shape', category: 'Standard' },
    { type: DocumentControlType.WebBrowser, icon: '🌐', name: 'Web Browser', category: 'Internet' },
    {
      type: DocumentControlType.ListView,
      icon: '📋',
      name: 'List View',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.TreeView,
      icon: '🌳',
      name: 'Tree View',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.ProgressBar,
      icon: '▓▓▓░░',
      name: 'Progress Bar',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.Slider,
      icon: '◀═══▶',
      name: 'Slider',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.StatusBar,
      icon: '═══',
      name: 'Status Bar',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.ToolBar,
      icon: '🛠️',
      name: 'Tool Bar',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.TabStrip,
      icon: '▦▦▦',
      name: 'Tab Strip',
      category: 'Windows Common Controls',
    },
    {
      type: DocumentControlType.SSTab,
      icon: '📑',
      name: 'SSTab',
      category: 'Microsoft Tabbed Dialog Control',
    },
  ];

  const createControl = useCallback(
    (type: DocumentControlType, x: number, y: number): DocumentControl => {
      const id = `control_${Date.now()}`;
      const baseControl: DocumentControl = {
        id,
        type,
        name: `${type}${id}`,
        left: x,
        top: y,
        width: 100,
        height: 25,
        properties: {},
        zIndex: 0,
        visible: true,
        enabled: true,
        locked: false,
        tag: '',
      };

      // Set default properties based on type
      switch (type) {
        case DocumentControlType.Label:
          baseControl.properties = {
            caption: 'Label',
            alignment: 0, // Left
            autoSize: false,
            backStyle: 0, // Transparent
            borderStyle: 0, // None
            font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
          };
          break;
        case DocumentControlType.TextBox:
          baseControl.properties = {
            text: '',
            alignment: 0, // Left
            multiline: false,
            scrollBars: 0, // None
            passwordChar: '',
            maxLength: 0,
            locked: false,
          };
          baseControl.width = 120;
          break;
        case DocumentControlType.CommandButton:
          baseControl.properties = {
            caption: 'Command1',
            default: false,
            cancel: false,
            style: 0, // Standard
          };
          baseControl.width = 75;
          break;
        case DocumentControlType.CheckBox:
          baseControl.properties = {
            caption: 'Check1',
            value: 0, // Unchecked
            alignment: 0, // Left
          };
          baseControl.width = 120;
          break;
        case DocumentControlType.OptionButton:
          baseControl.properties = {
            caption: 'Option1',
            value: false,
            alignment: 0, // Left
          };
          baseControl.width = 120;
          break;
        case DocumentControlType.ComboBox:
          baseControl.properties = {
            style: 0, // Dropdown Combo
            text: '',
            sorted: false,
            list: [],
          };
          baseControl.width = 120;
          baseControl.height = 21;
          break;
        case DocumentControlType.ListBox:
          baseControl.properties = {
            multiSelect: 0, // None
            sorted: false,
            style: 0, // Standard
            list: [],
          };
          baseControl.width = 120;
          baseControl.height = 80;
          break;
        case DocumentControlType.Frame:
          baseControl.properties = {
            caption: 'Frame1',
          };
          baseControl.width = 150;
          baseControl.height = 100;
          break;
        case DocumentControlType.Image:
          baseControl.properties = {
            picture: '',
            stretch: true,
            borderStyle: 0, // None
          };
          baseControl.width = 80;
          baseControl.height = 80;
          break;
        case DocumentControlType.PictureBox:
          baseControl.properties = {
            picture: '',
            autoSize: false,
            borderStyle: 1, // Fixed Single
            scaleMode: 1, // Twips
          };
          baseControl.width = 100;
          baseControl.height = 80;
          break;
        case DocumentControlType.WebBrowser:
          baseControl.properties = {
            navigate: '',
            silent: false,
            offline: false,
          };
          baseControl.width = 300;
          baseControl.height = 200;
          break;
        case DocumentControlType.ListView:
          baseControl.properties = {
            view: 3, // Report
            labelEdit: 1, // Automatic
            hideSelection: true,
            multiSelect: false,
          };
          baseControl.width = 200;
          baseControl.height = 150;
          break;
        case DocumentControlType.TreeView:
          baseControl.properties = {
            labelEdit: 1, // Automatic
            lineStyle: 1, // Tree Lines
            style: 0, // Text Only
          };
          baseControl.width = 150;
          baseControl.height = 150;
          break;
        case DocumentControlType.ProgressBar:
          baseControl.properties = {
            min: 0,
            max: 100,
            value: 0,
            scrolling: 0, // Standard
          };
          baseControl.width = 150;
          baseControl.height = 20;
          break;
        case DocumentControlType.Slider:
          baseControl.properties = {
            min: 0,
            max: 10,
            value: 5,
            orientation: 0, // Horizontal
            tickStyle: 3, // Both Sides
          };
          baseControl.width = 150;
          baseControl.height = 30;
          break;
      }

      return baseControl;
    },
    []
  );

  const addControl = useCallback((pageId: string, control: DocumentControl) => {
    setDocument(prev => {
      const updated = { ...prev };
      const page = updated.pages.find(p => p.id === pageId);
      if (page) {
        page.controls.push(control);
      }
      return updated;
    });

    setSelectedControl({ pageId, control });
    eventEmitter.current.emit('controlAdded', { pageId, control });
  }, []);

  const updateControl = useCallback(
    (pageId: string, controlId: string, updates: Partial<DocumentControl>) => {
      setDocument(prev => {
        const updated = { ...prev };
        const page = updated.pages.find(p => p.id === pageId);
        if (page) {
          const controlIndex = page.controls.findIndex(c => c.id === controlId);
          if (controlIndex >= 0) {
            page.controls[controlIndex] = { ...page.controls[controlIndex], ...updates };

            if (selectedControl?.control.id === controlId) {
              setSelectedControl({ pageId, control: page.controls[controlIndex] });
            }
          }
        }
        return updated;
      });

      eventEmitter.current.emit('controlUpdated', { pageId, controlId, updates });
    },
    [selectedControl]
  );

  const deleteControl = useCallback(
    (pageId: string, controlId: string) => {
      setDocument(prev => {
        const updated = { ...prev };
        const page = updated.pages.find(p => p.id === pageId);
        if (page) {
          page.controls = page.controls.filter(c => c.id !== controlId);
        }
        return updated;
      });

      if (selectedControl?.control.id === controlId) {
        setSelectedControl(null);
      }

      eventEmitter.current.emit('controlDeleted', { pageId, controlId });
    },
    [selectedControl]
  );

  const addPage = useCallback(() => {
    const newPage: DocumentPage = {
      id: `page_${Date.now()}`,
      name: `Page${document.pages.length + 1}`,
      title: `Page ${document.pages.length + 1}`,
      size: { width: 800, height: 600 },
      margins: { left: 20, top: 20, right: 20, bottom: 20 },
      controls: [],
      hyperlinks: [],
      navigationPoints: [],
      printable: true,
    };

    setDocument(prev => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));

    setSelectedPage(newPage.id);
  }, [document.pages.length]);

  const addHyperlink = useCallback((pageId: string, x: number, y: number) => {
    const newHyperlink: DocumentHyperlink = {
      id: `hyperlink_${Date.now()}`,
      text: 'Hyperlink',
      address: 'http://www.example.com',
      subAddress: '',
      screenTip: '',
      target: '_blank',
      left: x,
      top: y,
      width: 100,
      height: 20,
    };

    setDocument(prev => {
      const updated = { ...prev };
      const page = updated.pages.find(p => p.id === pageId);
      if (page) {
        page.hyperlinks.push(newHyperlink);
      }
      return updated;
    });

    setSelectedHyperlink(newHyperlink);
  }, []);

  const handleDragStart = useCallback((type: DocumentControlType, e: React.MouseEvent) => {
    // ATOMIC STATE UPDATE: Prevent torn reads by batching all related state changes
    React.startTransition(() => {
      setIsDragging(true);
      setDraggedItem(type);
      setDragOffset({ x: e.clientX, y: e.clientY });
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    // ATOMIC STATE UPDATE: Prevent torn reads by batching all related state changes
    React.startTransition(() => {
      setIsDragging(false);
      setDraggedItem(null);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedItem) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const safeZoom = zoom === 0 ? 100 : zoom;
      const x = (e.clientX - rect.left) / (safeZoom / 100);
      const y = (e.clientY - rect.top) / (safeZoom / 100);

      // Snap to grid - prevent division by zero
      const safeGridSize = gridSize === 0 ? 10 : gridSize;
      const snappedX = Math.round(x / safeGridSize) * safeGridSize;
      const snappedY = Math.round(y / safeGridSize) * safeGridSize;

      const newControl = createControl(draggedItem, snappedX, snappedY);
      addControl(selectedPage, newControl);

      handleDragEnd();
    },
    [draggedItem, zoom, gridSize, createControl, addControl, selectedPage, handleDragEnd]
  );

  const handleSave = useCallback(() => {
    onSave?.(document);
    eventEmitter.current.emit('documentSaved', document);
  }, [document, onSave]);

  const handlePreview = useCallback(() => {
    onPreview?.(document);
    eventEmitter.current.emit('documentPreviewed', document);
  }, [document, onPreview]);

  const generateVBCode = useCallback((): string => {
    const lines: string[] = [];

    // Header
    lines.push(`VERSION 5.00`);
    lines.push(`Begin VB.UserDocument ${document.name}`);
    lines.push(`   Caption         =   "${document.title}"`);
    lines.push(`   ClientHeight    =   ${document.pages[0]?.size.height * 15 || 9000}`);
    lines.push(`   ClientLeft      =   0`);
    lines.push(`   ClientTop       =   0`);
    lines.push(`   ClientWidth     =   ${document.pages[0]?.size.width * 15 || 12000}`);
    lines.push(`   HelpFile        =   "${document.helpFile || ''}"`);
    lines.push(`   HelpContextID   =   ${document.helpContextId || 0}`);
    lines.push(`   MinHeight       =   ${document.pages[0]?.size.height || 600}`);
    lines.push(`   MinWidth        =   ${document.pages[0]?.size.width || 800}`);
    lines.push(
      `   Persistable     =   ${document.persistable ? 1 : 0}  '${document.persistable ? 'Persistable' : 'NotPersistable'}`
    );
    lines.push(
      `   ScrollBars      =   ${document.viewportMode === DocumentViewportMode.ScrollBars ? 3 : 0}  '${document.viewportMode}`
    );
    lines.push(`   ViewportHeight  =   ${document.pages[0]?.size.height || 600}`);
    lines.push(`   ViewportWidth   =   ${document.pages[0]?.size.width || 800}`);
    lines.push('');

    // Controls for first page
    const firstPage = document.pages[0];
    if (firstPage) {
      firstPage.controls.forEach(control => {
        const controlType =
          control.type === DocumentControlType.CommandButton
            ? 'CommandButton'
            : control.type === DocumentControlType.TextBox
              ? 'TextBox'
              : control.type === DocumentControlType.Label
                ? 'Label'
                : control.type === DocumentControlType.CheckBox
                  ? 'CheckBox'
                  : control.type === DocumentControlType.OptionButton
                    ? 'OptionButton'
                    : control.type === DocumentControlType.ComboBox
                      ? 'ComboBox'
                      : control.type === DocumentControlType.ListBox
                        ? 'ListBox'
                        : control.type === DocumentControlType.Frame
                          ? 'Frame'
                          : control.type === DocumentControlType.Image
                            ? 'Image'
                            : control.type === DocumentControlType.PictureBox
                              ? 'PictureBox'
                              : control.type === DocumentControlType.WebBrowser
                                ? 'WebBrowser'
                                : 'Control';

        lines.push(`   Begin VB.${controlType} ${control.name}`);
        lines.push(`      Height          =   ${control.height * 15}`);
        lines.push(`      Left            =   ${control.left * 15}`);
        lines.push(`      Top             =   ${control.top * 15}`);
        lines.push(`      Width           =   ${control.width * 15}`);

        // Add specific properties
        Object.entries(control.properties).forEach(([key, value]) => {
          if (key === 'caption' || key === 'text') {
            lines.push(
              `      ${key.charAt(0).toUpperCase() + key.slice(1)}          =   "${value}"`
            );
          } else if (typeof value === 'boolean') {
            lines.push(
              `      ${key.charAt(0).toUpperCase() + key.slice(1)}          =   ${value ? -1 : 0}  '${value ? 'True' : 'False'}`
            );
          } else if (typeof value === 'number') {
            lines.push(`      ${key.charAt(0).toUpperCase() + key.slice(1)}          =   ${value}`);
          }
        });

        lines.push(`   End`);
        lines.push('');
      });
    }

    lines.push('End');
    lines.push('');

    // Event procedures
    lines.push(`Attribute VB_Name = "${document.name}"`);
    lines.push(`Attribute VB_GlobalNameSpace = False`);
    lines.push(`Attribute VB_Creatable = True`);
    lines.push(`Attribute VB_PredeclaredId = False`);
    lines.push(`Attribute VB_Exposed = True`);
    lines.push('');

    // Standard events
    lines.push(`Private Sub UserDocument_Initialize()`);
    lines.push(`    ' Document initialization code`);
    lines.push(`End Sub`);
    lines.push('');

    lines.push(`Private Sub UserDocument_ReadProperties(PropBag As PropertyBag)`);
    lines.push(`    ' Read persistent properties`);
    lines.push(`End Sub`);
    lines.push('');

    lines.push(`Private Sub UserDocument_WriteProperties(PropBag As PropertyBag)`);
    lines.push(`    ' Write persistent properties`);
    lines.push(`End Sub`);
    lines.push('');

    lines.push(`Private Sub UserDocument_Show()`);
    lines.push(`    ' Document is being shown`);
    lines.push(`End Sub`);
    lines.push('');

    lines.push(`Private Sub UserDocument_Hide()`);
    lines.push(`    ' Document is being hidden`);
    lines.push(`End Sub`);
    lines.push('');

    // Navigation methods
    if (document.navigationMode !== NavigationMode.None) {
      lines.push(`Public Sub NavigateToPage(PageName As String)`);
      lines.push(`    ' Navigate to a specific page`);
      lines.push(`    Select Case PageName`);
      document.pages.forEach(page => {
        lines.push(`        Case "${page.name}"`);
        lines.push(`            ' Show ${page.title}`);
      });
      lines.push(`    End Select`);
      lines.push(`End Sub`);
      lines.push('');
    }

    return lines.join('\n');
  }, [document]);

  const renderControl = (control: DocumentControl): React.ReactNode => {
    const isSelected = selectedControl?.control.id === control.id;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: control.left,
      top: control.top,
      width: control.width,
      height: control.height,
      border: isSelected ? '2px solid #0066cc' : '1px solid #ccc',
      fontSize: '8pt',
      fontFamily: 'MS Sans Serif',
      zIndex: control.zIndex,
      visibility: control.visible ? 'visible' : 'hidden',
      opacity: control.enabled ? 1 : 0.5,
    };

    let content: React.ReactNode = null;

    switch (control.type) {
      case DocumentControlType.Label:
        content = (
          <div
            style={{
              ...style,
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              background: 'transparent',
            }}
          >
            {control.properties.caption || control.name}
          </div>
        );
        break;
      case DocumentControlType.TextBox:
        content = (
          <input
            type="text"
            value={control.properties.text || ''}
            readOnly
            style={{ ...style, padding: '2px', border: '1px inset #ddd' }}
          />
        );
        break;
      case DocumentControlType.CommandButton:
        content = (
          <button style={{ ...style, background: '#f0f0f0' }}>
            {control.properties.caption || control.name}
          </button>
        );
        break;
      case DocumentControlType.CheckBox:
        content = (
          <label style={{ ...style, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={control.properties.value} readOnly />
            <span style={{ marginLeft: '4px' }}>{control.properties.caption}</span>
          </label>
        );
        break;
      case DocumentControlType.ComboBox:
        content = (
          <select style={{ ...style, background: 'white' }}>
            <option>{control.properties.text || ''}</option>
          </select>
        );
        break;
      case DocumentControlType.WebBrowser:
        content = (
          <div
            style={{
              ...style,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px inset #ddd',
            }}
          >
            <span style={{ color: '#666' }}>🌐 WebBrowser</span>
          </div>
        );
        break;
      case DocumentControlType.ListView:
        content = (
          <div style={{ ...style, background: 'white', border: '1px inset #ddd', padding: '2px' }}>
            <div style={{ fontSize: '7pt', color: '#666' }}>ListView</div>
          </div>
        );
        break;
      case DocumentControlType.TreeView:
        content = (
          <div style={{ ...style, background: 'white', border: '1px inset #ddd', padding: '2px' }}>
            <div style={{ fontSize: '7pt', color: '#666' }}>🌳 TreeView</div>
          </div>
        );
        break;
      default:
        content = (
          <div
            style={{
              ...style,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
            }}
          >
            {control.type}
          </div>
        );
    }

    return (
      <div
        key={control.id}
        onClick={e => {
          e.stopPropagation();
          setSelectedControl({ pageId: selectedPage, control });
        }}
        style={{ position: 'relative' }}
      >
        {content}

        {isSelected && (
          <>
            {/* Resize handles */}
            <div
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 8,
                height: 8,
                backgroundColor: '#0066cc',
                cursor: 'se-resize',
              }}
            />
            {/* Delete button */}
            <button
              onClick={e => {
                e.stopPropagation();
                deleteControl(selectedPage, control.id);
              }}
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: 20,
                height: 20,
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </>
        )}
      </div>
    );
  };

  const renderHyperlink = (hyperlink: DocumentHyperlink): React.ReactNode => {
    const isSelected = selectedHyperlink?.id === hyperlink.id;

    return (
      <a
        key={hyperlink.id}
        href={hyperlink.address}
        target={hyperlink.target}
        onClick={e => {
          e.preventDefault();
          setSelectedHyperlink(hyperlink);
        }}
        style={{
          position: 'absolute',
          left: hyperlink.left,
          top: hyperlink.top,
          width: hyperlink.width,
          height: hyperlink.height,
          color: '#0000ff',
          textDecoration: 'underline',
          border: isSelected ? '2px solid #0066cc' : 'none',
          fontSize: '8pt',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}
        title={hyperlink.screenTip}
      >
        {hyperlink.text}
      </a>
    );
  };

  const activePage = document.pages.find(p => p.id === selectedPage);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">User Document Designer</h2>
            <input
              type="text"
              value={document.name}
              onChange={e => setDocument(prev => ({ ...prev, name: e.target.value }))}
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
        {(['design', 'preview', 'code'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 font-medium text-sm ${
              mode === m
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbox */}
        <div className="w-48 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-medium text-gray-700 mb-3">Toolbox</h3>

          {/* Group by category */}
          {['Standard', 'Windows Common Controls', 'Internet'].map(category => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{category}</h4>
              <div className="space-y-1">
                {toolboxItems
                  .filter(item => item.category === category)
                  .map(item => (
                    <div
                      key={item.type}
                      className="p-2 bg-gray-100 rounded cursor-move hover:bg-gray-200 flex items-center gap-2 text-xs"
                      onMouseDown={e => handleDragStart(item.type, e)}
                      onMouseUp={handleDragEnd}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">Pages</h3>
              <button
                onClick={addPage}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {document.pages.map(page => (
                <div
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedPage === page.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {page.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Designer Area */}
        <div className="flex-1 overflow-hidden">
          {mode === 'design' && (
            <div
              ref={designerRef}
              className="w-full h-full overflow-auto bg-gray-200 p-4"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            >
              {activePage && (
                <div
                  className="bg-white border border-gray-400 relative shadow-lg"
                  style={{
                    width: activePage.size.width,
                    height: activePage.size.height,
                    backgroundColor: activePage.backgroundColor || 'white',
                  }}
                  onMouseUp={handleDrop}
                  onMouseMove={e => {
                    if (isDragging) {
                      e.currentTarget.style.backgroundColor = '#f0f8ff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (isDragging) {
                      e.currentTarget.style.backgroundColor = activePage.backgroundColor || 'white';
                    }
                  }}
                  onDoubleClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / (zoom / 100);
                    const y = (e.clientY - rect.top) / (zoom / 100);
                    addHyperlink(selectedPage, x, y);
                  }}
                >
                  {/* Grid */}
                  {showGrid && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `repeating-linear-gradient(0deg, #f0f0f0 0px, transparent 1px, transparent ${gridSize}px),
                                       repeating-linear-gradient(90deg, #f0f0f0 0px, transparent 1px, transparent ${gridSize}px)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Rulers */}
                  {showRulers && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          top: -20,
                          left: 0,
                          right: 0,
                          height: 20,
                          backgroundColor: '#f0f0f0',
                          borderBottom: '1px solid #ccc',
                        }}
                      >
                        {Array.from({ length: Math.ceil(activePage.size.width / 50) }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              left: i * 50,
                              top: 10,
                              fontSize: '8px',
                              color: '#666',
                            }}
                          >
                            {i * 50}
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: -20,
                          top: 0,
                          bottom: 0,
                          width: 20,
                          backgroundColor: '#f0f0f0',
                          borderRight: '1px solid #ccc',
                        }}
                      >
                        {Array.from({ length: Math.ceil(activePage.size.height / 50) }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              top: i * 50,
                              left: 5,
                              fontSize: '8px',
                              color: '#666',
                              transform: 'rotate(-90deg)',
                              transformOrigin: 'left center',
                            }}
                          >
                            {i * 50}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Controls */}
                  {activePage.controls.map(control => renderControl(control))}

                  {/* Hyperlinks */}
                  {activePage.hyperlinks.map(hyperlink => renderHyperlink(hyperlink))}

                  {/* Navigation Points */}
                  {activePage.navigationPoints.map(point => (
                    <div
                      key={point.id}
                      style={{
                        position: 'absolute',
                        left: point.x - 5,
                        top: point.y - 5,
                        width: 10,
                        height: 10,
                        backgroundColor: '#ff6600',
                        borderRadius: '50%',
                        cursor: 'pointer',
                      }}
                      title={point.caption}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'preview' && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Document Preview</h3>
              <div className="bg-white border border-gray-300 rounded p-4">
                <h4 className="font-medium">{document.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{document.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Author:</strong> {document.author}
                  </div>
                  <div>
                    <strong>Version:</strong> {document.version}
                  </div>
                  <div>
                    <strong>Container:</strong> {document.containerType}
                  </div>
                  <div>
                    <strong>Viewport:</strong> {document.viewportMode}
                  </div>
                  <div>
                    <strong>Navigation:</strong> {document.navigationMode}
                  </div>
                  <div>
                    <strong>Pages:</strong> {document.pages.length}
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="font-medium mb-2">Pages:</h5>
                  <ul className="list-disc list-inside">
                    {document.pages.map(page => (
                      <li key={page.id} className="text-sm">
                        {page.title} ({page.controls.length} controls, {page.hyperlinks.length}{' '}
                        hyperlinks)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {mode === 'code' && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Generated VB6 Code</h3>
              <textarea
                value={generateVBCode()}
                readOnly
                className="w-full h-full font-mono text-sm p-2 border border-gray-300 rounded resize-none"
                style={{ minHeight: '500px' }}
              />
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {(selectedControl || selectedHyperlink) && mode === 'design' && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              {selectedControl && (
                <>
                  <h3 className="font-medium text-gray-700 mb-3">Control Properties</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <input
                      type="text"
                      value={selectedControl.control.name}
                      onChange={e =>
                        updateControl(selectedControl.pageId, selectedControl.control.id, {
                          name: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">
                      Position & Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Left</label>
                        <input
                          type="number"
                          value={selectedControl.control.left}
                          onChange={e =>
                            updateControl(selectedControl.pageId, selectedControl.control.id, {
                              left: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Top</label>
                        <input
                          type="number"
                          value={selectedControl.control.top}
                          onChange={e =>
                            updateControl(selectedControl.pageId, selectedControl.control.id, {
                              top: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Width</label>
                        <input
                          type="number"
                          value={selectedControl.control.width}
                          onChange={e =>
                            updateControl(selectedControl.pageId, selectedControl.control.id, {
                              width: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Height</label>
                        <input
                          type="number"
                          value={selectedControl.control.height}
                          onChange={e =>
                            updateControl(selectedControl.pageId, selectedControl.control.id, {
                              height: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Control-specific properties */}
                  {selectedControl.control.properties.caption !== undefined && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600">Caption</label>
                      <input
                        type="text"
                        value={selectedControl.control.properties.caption}
                        onChange={e =>
                          updateControl(selectedControl.pageId, selectedControl.control.id, {
                            properties: {
                              ...selectedControl.control.properties,
                              caption: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </>
              )}

              {selectedHyperlink && (
                <>
                  <h3 className="font-medium text-gray-700 mb-3">Hyperlink Properties</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Text</label>
                    <input
                      type="text"
                      value={selectedHyperlink.text}
                      onChange={e => {
                        const updated = { ...selectedHyperlink, text: e.target.value };
                        setDocument(prev => {
                          const newDoc = { ...prev };
                          const page = newDoc.pages.find(p => p.id === selectedPage);
                          if (page) {
                            const linkIndex = page.hyperlinks.findIndex(
                              h => h.id === selectedHyperlink.id
                            );
                            if (linkIndex >= 0) {
                              page.hyperlinks[linkIndex] = updated;
                            }
                          }
                          return newDoc;
                        });
                        setSelectedHyperlink(updated);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Address</label>
                    <input
                      type="text"
                      value={selectedHyperlink.address}
                      onChange={e => {
                        const updated = { ...selectedHyperlink, address: e.target.value };
                        setDocument(prev => {
                          const newDoc = { ...prev };
                          const page = newDoc.pages.find(p => p.id === selectedPage);
                          if (page) {
                            const linkIndex = page.hyperlinks.findIndex(
                              h => h.id === selectedHyperlink.id
                            );
                            if (linkIndex >= 0) {
                              page.hyperlinks[linkIndex] = updated;
                            }
                          }
                          return newDoc;
                        });
                        setSelectedHyperlink(updated);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDocumentDesigner;
