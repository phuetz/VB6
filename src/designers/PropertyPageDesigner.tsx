import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Property Types
export enum PropertyType {
  String = 'String',
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  Boolean = 'Boolean',
  Date = 'Date',
  Color = 'Color',
  Font = 'Font',
  Picture = 'Picture',
  Object = 'Object',
  Enum = 'Enum',
  Array = 'Array'
}

// Property Control Types
export enum PropertyControlType {
  TextBox = 'TextBox',
  Label = 'Label',
  CheckBox = 'CheckBox',
  OptionButton = 'OptionButton',
  ComboBox = 'ComboBox',
  ListBox = 'ListBox',
  VScrollBar = 'VScrollBar',
  HScrollBar = 'HScrollBar',
  Slider = 'Slider',
  ColorPicker = 'ColorPicker',
  FontPicker = 'FontPicker',
  FilePicker = 'FilePicker',
  DirectoryPicker = 'DirectoryPicker',
  Frame = 'Frame',
  TabStrip = 'TabStrip',
  CommandButton = 'CommandButton'
}

// Property Page Property
export interface PropertyPageProperty {
  name: string;
  caption: string;
  dataType: PropertyType;
  defaultValue: any;
  category: string;
  description: string;
  enumValues?: string[];
  minValue?: number;
  maxValue?: number;
  readOnly: boolean;
  browsable: boolean;
  designTimeOnly: boolean;
}

// Property Page Control
export interface PropertyPageControl {
  id: string;
  type: PropertyControlType;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  properties: { [key: string]: any };
  boundProperty?: string;
  tabIndex: number;
  visible: boolean;
  enabled: boolean;
}

// Property Page Tab
export interface PropertyPageTab {
  id: string;
  name: string;
  caption: string;
  controls: PropertyPageControl[];
  visible: boolean;
}

// Property Page Definition
export interface PropertyPageDefinition {
  name: string;
  caption: string;
  helpFile?: string;
  helpContextId?: number;
  properties: PropertyPageProperty[];
  tabs: PropertyPageTab[];
  size: {
    width: number;
    height: number;
  };
  standardButtons: {
    ok: boolean;
    cancel: boolean;
    apply: boolean;
    help: boolean;
  };
}

// Property Category
export interface PropertyCategory {
  name: string;
  displayName: string;
  description: string;
  expanded: boolean;
}

interface PropertyPageDesignerProps {
  initialPage?: PropertyPageDefinition;
  onSave?: (page: PropertyPageDefinition) => void;
  onPreview?: (page: PropertyPageDefinition) => void;
}

export const PropertyPageDesigner: React.FC<PropertyPageDesignerProps> = ({
  initialPage,
  onSave,
  onPreview
}) => {
  const [page, setPage] = useState<PropertyPageDefinition>(initialPage || {
    name: 'PropertyPage1',
    caption: 'Property Page',
    properties: [],
    tabs: [{
      id: 'tab1',
      name: 'Tab1',
      caption: 'General',
      controls: [],
      visible: true
    }],
    size: { width: 400, height: 300 },
    standardButtons: { ok: true, cancel: true, apply: true, help: false }
  });

  const [selectedControl, setSelectedControl] = useState<{ tabId: string; control: PropertyPageControl } | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>(page.tabs[0]?.id || '');
  const [selectedProperty, setSelectedProperty] = useState<PropertyPageProperty | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<PropertyControlType | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(8);
  const [activePanel, setActivePanel] = useState<'design' | 'properties' | 'preview'>('design');
  
  const designerRef = useRef<HTMLDivElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // Cleanup EventEmitter on unmount
  useEffect(() => {
    return () => {
      if (eventEmitter.current) {
        eventEmitter.current.removeAllListeners();
      }
    };
  }, []);

  // Default property categories
  const defaultCategories: PropertyCategory[] = [
    { name: 'Appearance', displayName: 'Appearance', description: 'Visual appearance properties', expanded: true },
    { name: 'Behavior', displayName: 'Behavior', description: 'Control behavior properties', expanded: true },
    { name: 'Data', displayName: 'Data', description: 'Data binding properties', expanded: false },
    { name: 'Font', displayName: 'Font', description: 'Font and text properties', expanded: false },
    { name: 'Misc', displayName: 'Misc', description: 'Miscellaneous properties', expanded: false }
  ];

  // Property control toolbox items
  const toolboxItems = [
    { type: PropertyControlType.Label, icon: 'A', name: 'Label' },
    { type: PropertyControlType.TextBox, icon: '□', name: 'Text Box' },
    { type: PropertyControlType.CheckBox, icon: '☑', name: 'Check Box' },
    { type: PropertyControlType.OptionButton, icon: '◉', name: 'Option Button' },
    { type: PropertyControlType.ComboBox, icon: '▼', name: 'Combo Box' },
    { type: PropertyControlType.ListBox, icon: '≡', name: 'List Box' },
    { type: PropertyControlType.CommandButton, icon: 'Btn', name: 'Command Button' },
    { type: PropertyControlType.Frame, icon: '▢', name: 'Frame' },
    { type: PropertyControlType.ColorPicker, icon: '🎨', name: 'Color Picker' },
    { type: PropertyControlType.FontPicker, icon: 'F', name: 'Font Picker' },
    { type: PropertyControlType.FilePicker, icon: '📁', name: 'File Picker' },
    { type: PropertyControlType.Slider, icon: '◀═══▶', name: 'Slider' }
  ];

  const createControl = useCallback((type: PropertyControlType, x: number, y: number): PropertyPageControl => {
    const id = `control_${Date.now()}`;
    const baseControl: PropertyPageControl = {
      id,
      type,
      name: `${type}${id}`,
      left: x,
      top: y,
      width: 100,
      height: 25,
      properties: {},
      tabIndex: 0,
      visible: true,
      enabled: true
    };

    // Set default properties based on type
    switch (type) {
      case PropertyControlType.Label:
        baseControl.properties.caption = 'Label:';
        baseControl.properties.alignment = 'Left';
        baseControl.properties.autoSize = true;
        break;
      case PropertyControlType.TextBox:
        baseControl.properties.text = '';
        baseControl.properties.maxLength = 0;
        baseControl.properties.passwordChar = '';
        baseControl.width = 120;
        break;
      case PropertyControlType.CheckBox:
        baseControl.properties.caption = 'Check Box';
        baseControl.properties.value = false;
        baseControl.width = 100;
        break;
      case PropertyControlType.OptionButton:
        baseControl.properties.caption = 'Option Button';
        baseControl.properties.value = false;
        baseControl.width = 120;
        break;
      case PropertyControlType.ComboBox:
        baseControl.properties.style = 'DropDown';
        baseControl.properties.sorted = false;
        baseControl.height = 21;
        baseControl.width = 120;
        break;
      case PropertyControlType.ListBox:
        baseControl.properties.sorted = false;
        baseControl.properties.multiSelect = false;
        baseControl.height = 80;
        baseControl.width = 120;
        break;
      case PropertyControlType.CommandButton:
        baseControl.properties.caption = 'Command';
        baseControl.properties.default = false;
        baseControl.properties.cancel = false;
        baseControl.width = 75;
        break;
      case PropertyControlType.Frame:
        baseControl.properties.caption = 'Frame';
        baseControl.width = 150;
        baseControl.height = 100;
        break;
      case PropertyControlType.ColorPicker:
        baseControl.properties.color = '#000000';
        baseControl.width = 80;
        break;
      case PropertyControlType.FontPicker:
        baseControl.properties.fontName = 'MS Sans Serif';
        baseControl.properties.fontSize = 8;
        baseControl.width = 120;
        break;
      case PropertyControlType.FilePicker:
        baseControl.properties.fileName = '';
        baseControl.properties.filter = 'All Files (*.*)|*.*';
        baseControl.width = 200;
        break;
      case PropertyControlType.Slider:
        baseControl.properties.min = 0;
        baseControl.properties.max = 100;
        baseControl.properties.value = 50;
        baseControl.width = 150;
        baseControl.height = 30;
        break;
    }

    return baseControl;
  }, []);

  const addControl = useCallback((tabId: string, control: PropertyPageControl) => {
    setPage(prev => {
      const updated = { ...prev };
      const tab = updated.tabs.find(t => t.id === tabId);
      if (tab) {
        tab.controls.push(control);
      }
      return updated;
    });
    
    setSelectedControl({ tabId, control });
    eventEmitter.current.emit('controlAdded', { tabId, control });
  }, []);

  const updateControl = useCallback((tabId: string, controlId: string, updates: Partial<PropertyPageControl>) => {
    setPage(prev => {
      const updated = { ...prev };
      const tab = updated.tabs.find(t => t.id === tabId);
      if (tab) {
        const controlIndex = tab.controls.findIndex(c => c.id === controlId);
        if (controlIndex >= 0) {
          tab.controls[controlIndex] = { ...tab.controls[controlIndex], ...updates };
          
          if (selectedControl?.control.id === controlId) {
            setSelectedControl({ tabId, control: tab.controls[controlIndex] });
          }
        }
      }
      return updated;
    });
    
    eventEmitter.current.emit('controlUpdated', { tabId, controlId, updates });
  }, [selectedControl]);

  const deleteControl = useCallback((tabId: string, controlId: string) => {
    setPage(prev => {
      const updated = { ...prev };
      const tab = updated.tabs.find(t => t.id === tabId);
      if (tab) {
        tab.controls = tab.controls.filter(c => c.id !== controlId);
      }
      return updated;
    });
    
    if (selectedControl?.control.id === controlId) {
      setSelectedControl(null);
    }
    
    eventEmitter.current.emit('controlDeleted', { tabId, controlId });
  }, [selectedControl]);

  const addTab = useCallback(() => {
    const newTab: PropertyPageTab = {
      id: `tab_${Date.now()}`,
      name: `Tab${page.tabs.length + 1}`,
      caption: `Tab ${page.tabs.length + 1}`,
      controls: [],
      visible: true
    };
    
    setPage(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab]
    }));
    
    setSelectedTab(newTab.id);
  }, [page.tabs.length]);

  const addProperty = useCallback(() => {
    const newProperty: PropertyPageProperty = {
      name: `Property${page.properties.length + 1}`,
      caption: `Property ${page.properties.length + 1}`,
      dataType: PropertyType.String,
      defaultValue: '',
      category: 'Misc',
      description: '',
      readOnly: false,
      browsable: true,
      designTimeOnly: false
    };
    
    setPage(prev => ({
      ...prev,
      properties: [...prev.properties, newProperty]
    }));
    
    setSelectedProperty(newProperty);
  }, [page.properties.length]);

  const handleDragStart = useCallback((type: PropertyControlType, e: React.MouseEvent) => {
    // ATOMIC STATE UPDATE: Prevent torn reads by batching all related state changes
    React.startTransition(() => {
      setIsDragging(true);
      setDraggedItem(type);
      setDragOffset({ x: e.clientX, y: e.clientY });
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    // ATOMIC STATE UPDATE: Prevent torn reads
    React.startTransition(() => {
      setIsDragging(false);
      setDraggedItem(null);
    });
  }, []);

  const handleDrop = useCallback((e: React.MouseEvent) => {
    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const safeZoom = zoom === 0 ? 100 : zoom;
    const x = (e.clientX - rect.left) / (safeZoom / 100);
    const y = (e.clientY - rect.top) / (safeZoom / 100);
    
    // Snap to grid
    const safeGridSize = gridSize === 0 ? 8 : gridSize;
    const snappedX = Math.round(x / safeGridSize) * safeGridSize;
    const snappedY = Math.round(y / safeGridSize) * safeGridSize;
    
    const newControl = createControl(draggedItem, snappedX, snappedY);
    addControl(selectedTab, newControl);
    
    handleDragEnd();
  }, [draggedItem, zoom, gridSize, createControl, addControl, selectedTab, handleDragEnd]);

  const handleSave = useCallback(() => {
    onSave?.(page);
    eventEmitter.current.emit('pageSaved', page);
  }, [page, onSave]);

  const handlePreview = useCallback(() => {
    onPreview?.(page);
    eventEmitter.current.emit('pagePreviewd', page);
  }, [page, onPreview]);

  const generateVBCode = useCallback((): string => {
    const lines: string[] = [];
    
    // Header
    lines.push(`VERSION 5.00`);
    lines.push(`Begin VB.PropertyPage ${page.name}`);
    lines.push(`   Caption         =   "${page.caption}"`);
    lines.push(`   ClientHeight    =   ${page.size.height * 15}`);
    lines.push(`   ClientLeft      =   0`);
    lines.push(`   ClientTop       =   0`);
    lines.push(`   ClientWidth     =   ${page.size.width * 15}`);
    lines.push(`   PaletteMode     =   0  'Halftone`);
    lines.push(`   ScaleHeight     =   ${page.size.height}`);
    lines.push(`   ScaleMode       =   3  'Pixel`);
    lines.push(`   ScaleWidth      =   ${page.size.width}`);
    lines.push('');
    
    // Controls for active tab
    const activeTab = page.tabs.find(t => t.id === selectedTab);
    if (activeTab) {
      activeTab.controls.forEach(control => {
        const controlType = control.type === PropertyControlType.CommandButton ? 'CommandButton' :
                          control.type === PropertyControlType.TextBox ? 'TextBox' :
                          control.type === PropertyControlType.Label ? 'Label' :
                          control.type === PropertyControlType.CheckBox ? 'CheckBox' :
                          control.type === PropertyControlType.OptionButton ? 'OptionButton' :
                          control.type === PropertyControlType.ComboBox ? 'ComboBox' :
                          control.type === PropertyControlType.ListBox ? 'ListBox' :
                          control.type === PropertyControlType.Frame ? 'Frame' : 'Control';
        
        lines.push(`   Begin VB.${controlType} ${control.name}`);
        lines.push(`      Height          =   ${control.height * 15}`);
        lines.push(`      Left            =   ${control.left * 15}`);
        lines.push(`      Top             =   ${control.top * 15}`);
        lines.push(`      Width           =   ${control.width * 15}`);
        
        // Add specific properties
        Object.entries(control.properties).forEach(([key, value]) => {
          if (typeof value === 'string') {
            lines.push(`      ${key}           =   "${value}"`);
          } else if (typeof value === 'boolean') {
            lines.push(`      ${key}           =   ${value ? -1 : 0}  '${value ? 'True' : 'False'}`);
          } else {
            lines.push(`      ${key}           =   ${value}`);
          }
        });
        
        lines.push(`   End`);
        lines.push('');
      });
    }
    
    lines.push('End');
    lines.push('');
    
    // Property declarations
    page.properties.forEach(prop => {
      lines.push(`' Property: ${prop.name}`);
      lines.push(`' Description: ${prop.description}`);
      lines.push(`Private m${prop.name} As ${prop.dataType}`);
      lines.push('');
    });
    
    // Property procedures
    page.properties.forEach(prop => {
      // Property Get
      lines.push(`Public Property Get ${prop.name}() As ${prop.dataType}`);
      lines.push(`    ${prop.name} = m${prop.name}`);
      lines.push(`End Property`);
      lines.push('');
      
      // Property Let/Set
      if (!prop.readOnly) {
        const letOrSet = prop.dataType === PropertyType.Object ? 'Set' : 'Let';
        lines.push(`Public Property ${letOrSet} ${prop.name}(${letOrSet === 'Set' ? 'ByRef ' : ''}ByVal New_${prop.name} As ${prop.dataType})`);
        lines.push(`    m${prop.name} = New_${prop.name}`);
        lines.push(`    PropertyChanged "${prop.name}"`);
        lines.push(`End Property`);
        lines.push('');
      }
    });
    
    return lines.join('\n');
  }, [page, selectedTab]);

  const renderControl = (control: PropertyPageControl): React.ReactNode => {
    const isSelected = selectedControl?.control.id === control.id;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: control.left,
      top: control.top,
      width: control.width,
      height: control.height,
      border: isSelected ? '2px solid #0066cc' : '1px solid #ccc',
      fontSize: '8pt',
      fontFamily: 'MS Sans Serif'
    };
    
    let content: React.ReactNode = null;
    
    switch (control.type) {
      case PropertyControlType.Label:
        content = (
          <div style={{ ...style, display: 'flex', alignItems: 'center', padding: '2px' }}>
            {control.properties.caption || control.name}
          </div>
        );
        break;
      case PropertyControlType.TextBox:
        content = (
          <input
            type="text"
            value={control.properties.text || ''}
            readOnly
            style={{ ...style, padding: '2px', border: '1px inset #ddd' }}
          />
        );
        break;
      case PropertyControlType.CheckBox:
        content = (
          <label style={{ ...style, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={control.properties.value} readOnly />
            <span style={{ marginLeft: '4px' }}>{control.properties.caption}</span>
          </label>
        );
        break;
      case PropertyControlType.CommandButton:
        content = (
          <button style={{ ...style, background: '#f0f0f0' }}>
            {control.properties.caption || control.name}
          </button>
        );
        break;
      case PropertyControlType.ComboBox:
        content = (
          <select style={{ ...style, background: 'white' }}>
            <option>{control.properties.text || ''}</option>
          </select>
        );
        break;
      case PropertyControlType.ColorPicker:
        content = (
          <div style={{ ...style, background: control.properties.color || '#000000' }} />
        );
        break;
      default:
        content = (
          <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
            {control.type}
          </div>
        );
    }
    
    return (
      <div
        key={control.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedControl({ tabId: selectedTab, control });
        }}
        style={{ position: 'relative' }}
      >
        {content}
        
        {isSelected && (
          <>
            {/* Resize handles */}
            <div style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'se-resize' }} />
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteControl(selectedTab, control.id);
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
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </>
        )}
      </div>
    );
  };

  const activeTab = page.tabs.find(t => t.id === selectedTab);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Property Page Designer</h2>
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
        {(['design', 'properties', 'preview'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setActivePanel(mode)}
            className={`px-4 py-2 font-medium text-sm ${
              activePanel === mode
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
          <h3 className="font-medium text-gray-700 mb-3">Toolbox</h3>
          <div className="space-y-2">
            {toolboxItems.map(item => (
              <div
                key={item.type}
                className="p-2 bg-gray-100 rounded cursor-move hover:bg-gray-200 flex items-center gap-2"
                onMouseDown={(e) => handleDragStart(item.type, e)}
                onMouseUp={handleDragEnd}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">Tabs</h3>
              <button
                onClick={addTab}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {page.tabs.map(tab => (
                <div
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {tab.caption}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">Properties</h3>
              <button
                onClick={addProperty}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {page.properties.map(prop => (
                <div
                  key={prop.name}
                  onClick={() => setSelectedProperty(prop)}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedProperty?.name === prop.name ? 'bg-green-100 text-green-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {prop.name} ({prop.dataType})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Designer Area */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'design' && (
            <div
              ref={designerRef}
              className="w-full h-full overflow-auto bg-gray-200 p-4"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            >
              <div
                className="bg-white border border-gray-400 relative"
                style={{ width: page.size.width, height: page.size.height }}
                onMouseUp={handleDrop}
                onMouseMove={(e) => {
                  if (isDragging) {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDragging) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {/* Grid */}
                {showGrid && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `repeating-linear-gradient(0deg, #f0f0f0 0px, transparent 1px, transparent ${gridSize}px),
                                     repeating-linear-gradient(90deg, #f0f0f0 0px, transparent 1px, transparent ${gridSize}px)`,
                    pointerEvents: 'none'
                  }} />
                )}
                
                {/* Tab Header */}
                <div className="flex border-b border-gray-300 bg-gray-100">
                  {page.tabs.map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`px-3 py-1 cursor-pointer text-sm border-r border-gray-300 ${
                        selectedTab === tab.id ? 'bg-white border-b-white' : 'hover:bg-gray-200'
                      }`}
                    >
                      {tab.caption}
                    </div>
                  ))}
                </div>
                
                {/* Tab Content */}
                <div className="relative" style={{ height: page.size.height - 25 }}>
                  {activeTab?.controls.map(control => renderControl(control))}
                </div>
                
                {/* Standard Buttons */}
                <div className="absolute bottom-8 right-8 flex gap-2">
                  {page.standardButtons.ok && (
                    <button className="px-3 py-1 bg-gray-200 border border-gray-400 text-xs">OK</button>
                  )}
                  {page.standardButtons.cancel && (
                    <button className="px-3 py-1 bg-gray-200 border border-gray-400 text-xs">Cancel</button>
                  )}
                  {page.standardButtons.apply && (
                    <button className="px-3 py-1 bg-gray-200 border border-gray-400 text-xs">Apply</button>
                  )}
                  {page.standardButtons.help && (
                    <button className="px-3 py-1 bg-gray-200 border border-gray-400 text-xs">Help</button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activePanel === 'properties' && (
            <div className="p-4 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Page Properties</h3>
              
              {/* Page Properties */}
              <div className="mb-6 p-4 border border-gray-300 rounded">
                <h4 className="font-medium mb-2">General</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={page.name}
                      onChange={(e) => setPage(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Caption</label>
                    <input
                      type="text"
                      value={page.caption}
                      onChange={(e) => setPage(prev => ({ ...prev, caption: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Width</label>
                    <input
                      type="number"
                      value={page.size.width}
                      onChange={(e) => setPage(prev => ({ ...prev, size: { ...prev.size, width: Number(e.target.value) } }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Height</label>
                    <input
                      type="number"
                      value={page.size.height}
                      onChange={(e) => setPage(prev => ({ ...prev, size: { ...prev.size, height: Number(e.target.value) } }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Property Definitions */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Custom Properties</h4>
                {page.properties.map((prop, index) => (
                  <div key={prop.name} className="p-3 border border-gray-300 rounded mb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <label>Name</label>
                        <input
                          type="text"
                          value={prop.name}
                          onChange={(e) => {
                            const updated = [...page.properties];
                            updated[index] = { ...prop, name: e.target.value };
                            setPage(prev => ({ ...prev, properties: updated }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label>Type</label>
                        <select
                          value={prop.dataType}
                          onChange={(e) => {
                            const updated = [...page.properties];
                            updated[index] = { ...prop, dataType: e.target.value as PropertyType };
                            setPage(prev => ({ ...prev, properties: updated }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        >
                          {Object.values(PropertyType).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label>Description</label>
                        <input
                          type="text"
                          value={prop.description}
                          onChange={(e) => {
                            const updated = [...page.properties];
                            updated[index] = { ...prop, description: e.target.value };
                            setPage(prev => ({ ...prev, properties: updated }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activePanel === 'preview' && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Generated VB6 Code</h3>
              <textarea
                value={generateVBCode()}
                readOnly
                className="w-full h-full font-mono text-sm p-2 border border-gray-300 rounded resize-none"
                style={{ minHeight: '400px' }}
              />
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedControl && activePanel === 'design' && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-3">Control Properties</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <input
                  type="text"
                  value={selectedControl.control.name}
                  onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                    name: e.target.value
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">Position & Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Left</label>
                    <input
                      type="number"
                      value={selectedControl.control.left}
                      onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                        left: Number(e.target.value)
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Top</label>
                    <input
                      type="number"
                      value={selectedControl.control.top}
                      onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                        top: Number(e.target.value)
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={selectedControl.control.width}
                      onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                        width: Number(e.target.value)
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={selectedControl.control.height}
                      onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                        height: Number(e.target.value)
                      })}
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
                    onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                      properties: { ...selectedControl.control.properties, caption: e.target.value }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              )}
              
              {selectedControl.control.properties.text !== undefined && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">Text</label>
                  <input
                    type="text"
                    value={selectedControl.control.properties.text}
                    onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                      properties: { ...selectedControl.control.properties, text: e.target.value }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">Bound Property</label>
                <select
                  value={selectedControl.control.boundProperty || ''}
                  onChange={(e) => updateControl(selectedControl.tabId, selectedControl.control.id, {
                    boundProperty: e.target.value || undefined
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">None</option>
                  {page.properties.map(prop => (
                    <option key={prop.name} value={prop.name}>{prop.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPageDesigner;