import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// User Control Designer Types
export enum ControlType {
  Label = 'Label',
  TextBox = 'TextBox',
  CommandButton = 'CommandButton',
  CheckBox = 'CheckBox',
  OptionButton = 'OptionButton',
  ListBox = 'ListBox',
  ComboBox = 'ComboBox',
  PictureBox = 'PictureBox',
  Image = 'Image',
  Frame = 'Frame',
  Timer = 'Timer',
  ScrollBar = 'ScrollBar',
  Shape = 'Shape',
  Line = 'Line',
}

export enum ResizeMode {
  None = 'None',
  UserSized = 'UserSized',
  AutoSize = 'AutoSize',
}

export enum PropertyScope {
  Public = 'Public',
  Private = 'Private',
  Friend = 'Friend',
}

export enum PropertyType {
  String = 'String',
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Boolean = 'Boolean',
  Variant = 'Variant',
  Object = 'Object',
  Enum = 'Enum',
}

export interface ConstituentControl {
  id: string;
  name: string;
  type: ControlType;
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  enabled: boolean;
  tabIndex: number;
  tabStop: boolean;
  properties: Record<string, any>;
  events: string[];
  zIndex: number;
}

export interface UserControlProperty {
  id: string;
  name: string;
  type: PropertyType;
  scope: PropertyScope;
  defaultValue: any;
  description: string;
  category: string;
  browsable: boolean;
  readOnly: boolean;
  designTimeOnly: boolean;
  runtimeOnly: boolean;
  enumValues?: string[];
}

export interface UserControlMethod {
  id: string;
  name: string;
  scope: PropertyScope;
  returnType: PropertyType;
  parameters: Array<{
    name: string;
    type: PropertyType;
    optional: boolean;
    defaultValue?: any;
  }>;
  description: string;
}

export interface UserControlEvent {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: PropertyType;
    byRef: boolean;
  }>;
  cancellable: boolean;
}

export interface UserControlSettings {
  name: string;
  className: string;
  description: string;
  version: string;
  toolboxBitmap: string;
  invisibleAtRuntime: boolean;
  canGetFocus: boolean;
  defaultCanExtend: boolean;
  persistable: boolean;
  publicCreatable: boolean;
  dataBindingBehavior: 'None' | 'SimpleBound' | 'ComplexBound';
  dataSourceBehavior: 'None' | 'DataSource';
  mtsTransactionMode:
    | 'NotAnMTSObject'
    | 'NoTransactions'
    | 'RequiresTransaction'
    | 'UsesTransaction'
    | 'RequiresNewTransaction';
  helpContextId: number;
  helpFile: string;
}

export interface UserControlProject {
  id: string;
  settings: UserControlSettings;
  properties: UserControlProperty[];
  methods: UserControlMethod[];
  events: UserControlEvent[];
  constituentControls: ConstituentControl[];
  userControlSize: { width: number; height: number };
  resizeMode: ResizeMode;
  scaleMode:
    | 'Twips'
    | 'Points'
    | 'Pixels'
    | 'Characters'
    | 'Inches'
    | 'Millimeters'
    | 'Centimeters';
  backColor: string;
  foreColor: string;
  font: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
  };
  lastModified: Date;
}

export interface ControlTemplate {
  type: ControlType;
  name: string;
  defaultProperties: Record<string, any>;
  defaultSize: { width: number; height: number };
  icon: string;
  category: string;
}

interface UserControlDesignerProps {
  initialProject?: UserControlProject;
  onProjectChange?: (project: UserControlProject) => void;
  onGenerateCode?: (project: UserControlProject) => { ctl: string; ctx: string };
  onTestControl?: (project: UserControlProject) => void;
  onSaveProject?: (project: UserControlProject) => void;
}

export const UserControlDesigner: React.FC<UserControlDesignerProps> = ({
  initialProject,
  onProjectChange,
  onGenerateCode,
  onTestControl,
  onSaveProject,
}) => {
  const [project, setProject] = useState<UserControlProject>({
    id: 'usercontrol1',
    settings: {
      name: 'UserControl1',
      className: 'UserControl1',
      description: 'Custom User Control',
      version: '1.0',
      toolboxBitmap: '',
      invisibleAtRuntime: false,
      canGetFocus: true,
      defaultCanExtend: false,
      persistable: true,
      publicCreatable: false,
      dataBindingBehavior: 'None',
      dataSourceBehavior: 'None',
      mtsTransactionMode: 'NotAnMTSObject',
      helpContextId: 0,
      helpFile: '',
    },
    properties: [],
    methods: [],
    events: [],
    constituentControls: [],
    userControlSize: { width: 300, height: 200 },
    resizeMode: ResizeMode.UserSized,
    scaleMode: 'Twips',
    backColor: '#F0F0F0',
    foreColor: '#000000',
    font: {
      name: 'MS Sans Serif',
      size: 8,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    },
    lastModified: new Date(),
  });

  const [selectedControl, setSelectedControl] = useState<ConstituentControl | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<UserControlProperty | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<UserControlMethod | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UserControlEvent | null>(null);
  const [draggedControlType, setDraggedControlType] = useState<ControlType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showProperties, setShowProperties] = useState(true);
  const [showToolbox, setShowToolbox] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'properties' | 'methods' | 'events'>(
    'design'
  );
  const [testMode, setTestMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(8);

  const eventEmitter = useRef(new EventEmitter());
  const designerRef = useRef<HTMLDivElement>(null);
  const userControlRef = useRef<HTMLDivElement>(null);

  // Control templates
  const controlTemplates: ControlTemplate[] = [
    {
      type: ControlType.Label,
      name: 'Label',
      defaultProperties: { Caption: 'Label1', Alignment: 0, BackStyle: 0 },
      defaultSize: { width: 60, height: 20 },
      icon: '📝',
      category: 'Standard',
    },
    {
      type: ControlType.TextBox,
      name: 'TextBox',
      defaultProperties: { Text: '', MultiLine: false, ScrollBars: 0 },
      defaultSize: { width: 100, height: 20 },
      icon: '📄',
      category: 'Standard',
    },
    {
      type: ControlType.CommandButton,
      name: 'CommandButton',
      defaultProperties: { Caption: 'Command1', Default: false, Cancel: false },
      defaultSize: { width: 75, height: 25 },
      icon: '🔘',
      category: 'Standard',
    },
    {
      type: ControlType.CheckBox,
      name: 'CheckBox',
      defaultProperties: { Caption: 'Check1', Value: 0 },
      defaultSize: { width: 80, height: 20 },
      icon: '☑️',
      category: 'Standard',
    },
    {
      type: ControlType.OptionButton,
      name: 'OptionButton',
      defaultProperties: { Caption: 'Option1', Value: false },
      defaultSize: { width: 80, height: 20 },
      icon: '🔘',
      category: 'Standard',
    },
    {
      type: ControlType.ListBox,
      name: 'ListBox',
      defaultProperties: { List: [], ListIndex: -1, MultiSelect: 0 },
      defaultSize: { width: 120, height: 80 },
      icon: '📋',
      category: 'Standard',
    },
    {
      type: ControlType.ComboBox,
      name: 'ComboBox',
      defaultProperties: { Text: '', Style: 0, List: [] },
      defaultSize: { width: 120, height: 20 },
      icon: '🔽',
      category: 'Standard',
    },
    {
      type: ControlType.PictureBox,
      name: 'PictureBox',
      defaultProperties: { Picture: '', AutoSize: false, BorderStyle: 1 },
      defaultSize: { width: 100, height: 100 },
      icon: '🖼️',
      category: 'Standard',
    },
    {
      type: ControlType.Image,
      name: 'Image',
      defaultProperties: { Picture: '', Stretch: false },
      defaultSize: { width: 60, height: 60 },
      icon: '🖼️',
      category: 'Standard',
    },
    {
      type: ControlType.Frame,
      name: 'Frame',
      defaultProperties: { Caption: 'Frame1', BorderStyle: 1 },
      defaultSize: { width: 120, height: 80 },
      icon: '🔲',
      category: 'Standard',
    },
    {
      type: ControlType.Timer,
      name: 'Timer',
      defaultProperties: { Interval: 0, Enabled: false },
      defaultSize: { width: 20, height: 20 },
      icon: '⏱️',
      category: 'Standard',
    },
  ];

  // Initialize project
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    } else {
      // Create default properties, methods, and events
      const defaultProperties: UserControlProperty[] = [
        {
          id: 'prop1',
          name: 'BackColor',
          type: PropertyType.Long,
          scope: PropertyScope.Public,
          defaultValue: '#F0F0F0',
          description: 'Background color of the user control',
          category: 'Appearance',
          browsable: true,
          readOnly: false,
          designTimeOnly: false,
          runtimeOnly: false,
        },
        {
          id: 'prop2',
          name: 'ForeColor',
          type: PropertyType.Long,
          scope: PropertyScope.Public,
          defaultValue: '#000000',
          description: 'Foreground color of the user control',
          category: 'Appearance',
          browsable: true,
          readOnly: false,
          designTimeOnly: false,
          runtimeOnly: false,
        },
        {
          id: 'prop3',
          name: 'Enabled',
          type: PropertyType.Boolean,
          scope: PropertyScope.Public,
          defaultValue: true,
          description: 'Determines whether the user control can respond to user-generated events',
          category: 'Behavior',
          browsable: true,
          readOnly: false,
          designTimeOnly: false,
          runtimeOnly: false,
        },
      ];

      const defaultMethods: UserControlMethod[] = [
        {
          id: 'method1',
          name: 'Refresh',
          scope: PropertyScope.Public,
          returnType: PropertyType.String,
          parameters: [],
          description: 'Repaints the user control',
        },
      ];

      const defaultEvents: UserControlEvent[] = [
        {
          id: 'event1',
          name: 'Click',
          description: 'Occurs when the user clicks the user control',
          parameters: [],
          cancellable: false,
        },
        {
          id: 'event2',
          name: 'Initialize',
          description: 'Occurs when the user control is first created',
          parameters: [],
          cancellable: false,
        },
        {
          id: 'event3',
          name: 'Resize',
          description: 'Occurs when the user control is resized',
          parameters: [],
          cancellable: false,
        },
      ];

      setProject(prev => ({
        ...prev,
        properties: defaultProperties,
        methods: defaultMethods,
        events: defaultEvents,
      }));
    }
  }, [initialProject]);

  // Notify parent of changes
  useEffect(() => {
    onProjectChange?.(project);
  }, [project, onProjectChange]);

  // Add constituent control
  const addConstituentControl = useCallback(
    (type: ControlType, x: number, y: number) => {
      const template = controlTemplates.find(t => t.type === type);
      if (!template) return;

      // Snap to grid if enabled
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      const controlCount = project.constituentControls.filter(c => c.type === type).length;
      const newControl: ConstituentControl = {
        id: `control_${Date.now()}`,
        name: `${template.name}${controlCount + 1}`,
        type,
        left: x,
        top: y,
        width: template.defaultSize.width,
        height: template.defaultSize.height,
        visible: true,
        enabled: true,
        tabIndex: project.constituentControls.length,
        tabStop: type !== ControlType.Label && type !== ControlType.Image,
        properties: { ...template.defaultProperties },
        events: ['Click', 'DblClick', 'MouseDown', 'MouseMove', 'MouseUp'],
        zIndex: project.constituentControls.length,
      };

      setProject(prev => ({
        ...prev,
        constituentControls: [...prev.constituentControls, newControl],
        lastModified: new Date(),
      }));

      setSelectedControl(newControl);
    },
    [project.constituentControls, snapToGrid, gridSize, controlTemplates]
  );

  // Update constituent control
  const updateConstituentControl = useCallback(
    (controlId: string, updates: Partial<ConstituentControl>) => {
      setProject(prev => ({
        ...prev,
        constituentControls: prev.constituentControls.map(control =>
          control.id === controlId ? { ...control, ...updates } : control
        ),
        lastModified: new Date(),
      }));
    },
    []
  );

  // Delete constituent control
  const deleteConstituentControl = useCallback(
    (controlId: string) => {
      setProject(prev => ({
        ...prev,
        constituentControls: prev.constituentControls.filter(control => control.id !== controlId),
        lastModified: new Date(),
      }));

      if (selectedControl?.id === controlId) {
        setSelectedControl(null);
      }
    },
    [selectedControl]
  );

  // Add user control property
  const addUserControlProperty = useCallback(() => {
    const newProperty: UserControlProperty = {
      id: `prop_${Date.now()}`,
      name: 'NewProperty',
      type: PropertyType.String,
      scope: PropertyScope.Public,
      defaultValue: '',
      description: 'New property',
      category: 'Custom',
      browsable: true,
      readOnly: false,
      designTimeOnly: false,
      runtimeOnly: false,
    };

    setProject(prev => ({
      ...prev,
      properties: [...prev.properties, newProperty],
      lastModified: new Date(),
    }));

    setSelectedProperty(newProperty);
  }, []);

  // Update user control property
  const updateUserControlProperty = useCallback(
    (propertyId: string, updates: Partial<UserControlProperty>) => {
      setProject(prev => ({
        ...prev,
        properties: prev.properties.map(prop =>
          prop.id === propertyId ? { ...prop, ...updates } : prop
        ),
        lastModified: new Date(),
      }));
    },
    []
  );

  // Delete user control property
  const deleteUserControlProperty = useCallback(
    (propertyId: string) => {
      setProject(prev => ({
        ...prev,
        properties: prev.properties.filter(prop => prop.id !== propertyId),
        lastModified: new Date(),
      }));

      if (selectedProperty?.id === propertyId) {
        setSelectedProperty(null);
      }
    },
    [selectedProperty]
  );

  // Handle canvas drop
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedControlType || !userControlRef.current) return;

      const rect = userControlRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (100 / zoom);
      const y = (e.clientY - rect.top) * (100 / zoom);

      addConstituentControl(draggedControlType, x, y);
      setDraggedControlType(null);
    },
    [draggedControlType, zoom, addConstituentControl]
  );

  // Handle control mouse down
  const handleControlMouseDown = useCallback(
    (e: React.MouseEvent, control: ConstituentControl) => {
      e.preventDefault();
      e.stopPropagation();

      if (!userControlRef.current) return;

      setSelectedControl(control);
      setIsDragging(true);

      const rect = userControlRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (100 / zoom);
      const y = (e.clientY - rect.top) * (100 / zoom);

      setDragOffset({
        x: x - control.left,
        y: y - control.top,
      });
    },
    [zoom]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedControl || !userControlRef.current) return;

      const rect = userControlRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left) * (100 / zoom) - dragOffset.x;
      let y = (e.clientY - rect.top) * (100 / zoom) - dragOffset.y;

      // Snap to grid if enabled
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      // Keep within bounds
      x = Math.max(0, Math.min(x, project.userControlSize.width - selectedControl.width));
      y = Math.max(0, Math.min(y, project.userControlSize.height - selectedControl.height));

      updateConstituentControl(selectedControl.id, { left: x, top: y });
    },
    [
      isDragging,
      selectedControl,
      dragOffset,
      zoom,
      snapToGrid,
      gridSize,
      project.userControlSize,
      updateConstituentControl,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Get control icon
  const getControlIcon = (type: ControlType): string => {
    const template = controlTemplates.find(t => t.type === type);
    return template?.icon || '🔲';
  };

  // Render constituent control
  const renderConstituentControl = (control: ConstituentControl): React.ReactNode => {
    const isSelected = selectedControl?.id === control.id;
    const template = controlTemplates.find(t => t.type === control.type);

    return (
      <div
        key={control.id}
        className={`absolute border cursor-pointer ${
          isSelected ? 'border-blue-500 border-2' : 'border-gray-400'
        } ${!control.visible ? 'opacity-50' : ''} ${!control.enabled ? 'opacity-75' : ''}`}
        style={{
          left: control.left * (zoom / 100),
          top: control.top * (zoom / 100),
          width: control.width * (zoom / 100),
          height: control.height * (zoom / 100),
          zIndex: control.zIndex,
          backgroundColor: control.type === ControlType.Label ? 'transparent' : '#F0F0F0',
        }}
        onMouseDown={e => handleControlMouseDown(e, control)}
        onDoubleClick={() => {
          // Open property editor or code editor
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
          <span className="mr-1">{getControlIcon(control.type)}</span>
          <span className="truncate">{control.name}</span>
        </div>

        {/* Selection handles */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
          </>
        )}
      </div>
    );
  };

  // Render grid
  const renderGrid = (): React.ReactNode => {
    if (!showGrid) return null;

    const gridLines = [];
    const scaledGridSize = gridSize * (zoom / 100);
    const width = project.userControlSize.width * (zoom / 100);
    const height = project.userControlSize.height * (zoom / 100);

    // Vertical lines
    for (let x = 0; x <= width; x += scaledGridSize) {
      gridLines.push(
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#E0E0E0" strokeWidth="0.5" />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += scaledGridSize) {
      gridLines.push(
        <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#E0E0E0" strokeWidth="0.5" />
      );
    }

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: width, height: height }}
      >
        {gridLines}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">User Control Designer</h3>
          <span className="text-xs text-gray-500">({project.settings.name})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTestMode(!testMode)}
            className={`px-2 py-1 text-xs rounded ${
              testMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="Test Mode"
          >
            🧪
          </button>

          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-2 py-1 text-xs rounded ${
              showCode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="View Code"
          >
            💻
          </button>

          <button
            onClick={() => onSaveProject?.(project)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Save"
          >
            💾
          </button>

          <select
            value={zoom}
            onChange={e => setZoom(parseInt(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-300">
        {[
          { key: 'design', label: 'Design', icon: '🎨' },
          { key: 'properties', label: 'Properties', icon: '🏷️' },
          { key: 'methods', label: 'Methods', icon: '🔧' },
          { key: 'events', label: 'Events', icon: '⚡' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              activeTab === tab.key
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        {showToolbox && activeTab === 'design' && (
          <div className="w-60 border-r border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">Toolbox</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-3 gap-1">
                {controlTemplates.map(template => (
                  <div
                    key={template.type}
                    className="flex flex-col items-center p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-100"
                    draggable
                    onDragStart={e => {
                      setDraggedControlType(template.type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onDragEnd={() => setDraggedControlType(null)}
                    title={template.name}
                  >
                    <span className="text-lg">{template.icon}</span>
                    <span className="text-xs text-center">{template.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Design Surface */}
        {activeTab === 'design' && (
          <div className="flex-1 overflow-hidden">
            <div className="p-4 h-full overflow-auto">
              <div className="flex items-center gap-2 mb-4">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={e => setShowGrid(e.target.checked)}
                  />
                  Show Grid
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={e => setSnapToGrid(e.target.checked)}
                  />
                  Snap to Grid
                </label>
                <select
                  value={gridSize}
                  onChange={e => setGridSize(parseInt(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value={4}>4px</option>
                  <option value={8}>8px</option>
                  <option value={12}>12px</option>
                  <option value={16}>16px</option>
                </select>
              </div>

              <div
                ref={designerRef}
                className="relative border-2 border-dashed border-gray-300"
                style={{
                  width: project.userControlSize.width * (zoom / 100),
                  height: project.userControlSize.height * (zoom / 100),
                  backgroundColor: project.backColor,
                }}
                onDrop={handleCanvasDrop}
                onDragOver={e => e.preventDefault()}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div ref={userControlRef} className="relative w-full h-full">
                  {renderGrid()}
                  {project.constituentControls.map(renderConstituentControl)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="flex-1 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-700">User Control Properties</h4>
                <button
                  onClick={addUserControlProperty}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Property
                </button>
              </div>

              <div className="space-y-2">
                {project.properties.map(property => (
                  <div
                    key={property.id}
                    className={`p-2 border rounded cursor-pointer ${
                      selectedProperty?.id === property.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-xs text-gray-600">
                          {property.type} - {property.scope}
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteUserControlProperty(property.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{property.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Methods Tab */}
        {activeTab === 'methods' && (
          <div className="flex-1 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-700">User Control Methods</h4>
                <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                  Add Method
                </button>
              </div>

              <div className="space-y-2">
                {project.methods.map(method => (
                  <div key={method.id} className="p-2 border border-gray-300 rounded">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-xs text-gray-600">
                      {method.returnType} - {method.scope}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{method.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="flex-1 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-700">User Control Events</h4>
                <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                  Add Event
                </button>
              </div>

              <div className="space-y-2">
                {project.events.map(event => (
                  <div key={event.id} className="p-2 border border-gray-300 rounded">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{event.description}</div>
                    {event.cancellable && <div className="text-xs text-blue-600">Cancellable</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Properties Panel */}
        {showProperties && (selectedControl || selectedProperty) && (
          <div className="w-64 border-l border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">
                {selectedControl ? 'Control Properties' : 'Property Details'}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {selectedControl && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedControl.name}
                      onChange={e =>
                        updateConstituentControl(selectedControl.id, { name: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Left</label>
                      <input
                        type="number"
                        value={selectedControl.left}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            left: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Top</label>
                      <input
                        type="number"
                        value={selectedControl.top}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            top: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={selectedControl.width}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            width: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={selectedControl.height}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            height: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedControl.visible}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            visible: e.target.checked,
                          })
                        }
                      />
                      Visible
                    </label>

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedControl.enabled}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            enabled: e.target.checked,
                          })
                        }
                      />
                      Enabled
                    </label>

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedControl.tabStop}
                        onChange={e =>
                          updateConstituentControl(selectedControl.id, {
                            tabStop: e.target.checked,
                          })
                        }
                      />
                      Tab Stop
                    </label>
                  </div>
                </div>
              )}

              {selectedProperty && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedProperty.name}
                      onChange={e =>
                        updateUserControlProperty(selectedProperty.id, { name: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={selectedProperty.type}
                      onChange={e =>
                        updateUserControlProperty(selectedProperty.id, {
                          type: e.target.value as PropertyType,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      {Object.values(PropertyType).map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Scope</label>
                    <select
                      value={selectedProperty.scope}
                      onChange={e =>
                        updateUserControlProperty(selectedProperty.id, {
                          scope: e.target.value as PropertyScope,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      {Object.values(PropertyScope).map(scope => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedProperty.description}
                      onChange={e =>
                        updateUserControlProperty(selectedProperty.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded h-16"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedProperty.browsable}
                        onChange={e =>
                          updateUserControlProperty(selectedProperty.id, {
                            browsable: e.target.checked,
                          })
                        }
                      />
                      Browsable
                    </label>

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedProperty.readOnly}
                        onChange={e =>
                          updateUserControlProperty(selectedProperty.id, {
                            readOnly: e.target.checked,
                          })
                        }
                      />
                      Read Only
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Controls: {project.constituentControls.length}</span>
          <span>Properties: {project.properties.length}</span>
          <span>Methods: {project.methods.length}</span>
          <span>Events: {project.events.length}</span>
          {selectedControl && (
            <span>
              Selected: {selectedControl.name} ({selectedControl.left}, {selectedControl.top})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Zoom: {zoom}%</span>
          <span>Grid: {gridSize}px</span>
          <span>
            Size: {project.userControlSize.width}×{project.userControlSize.height}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserControlDesigner;
