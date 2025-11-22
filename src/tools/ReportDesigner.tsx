import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Report Designer Types
export enum ReportControlType {
  Label = 'Label',
  TextBox = 'TextBox',
  Image = 'Image',
  Line = 'Line',
  Shape = 'Shape',
  Chart = 'Chart',
  Barcode = 'Barcode',
  Subreport = 'Subreport'
}

export enum ReportSectionType {
  ReportHeader = 'ReportHeader',
  PageHeader = 'PageHeader',
  GroupHeader = 'GroupHeader',
  Detail = 'Detail',
  GroupFooter = 'GroupFooter',
  PageFooter = 'PageFooter',
  ReportFooter = 'ReportFooter'
}

export enum DataFieldType {
  Text = 'Text',
  Number = 'Number',
  Date = 'Date',
  Boolean = 'Boolean',
  Currency = 'Currency',
  Image = 'Image',
  Memo = 'Memo'
}

export enum AggregateFunction {
  Sum = 'Sum',
  Count = 'Count',
  Average = 'Average',
  Min = 'Min',
  Max = 'Max',
  StdDev = 'StdDev',
  Variance = 'Variance'
}

export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending'
}

export interface ReportControl {
  id: string;
  name: string;
  type: ReportControlType;
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  canGrow: boolean;
  canShrink: boolean;
  hideIfDuplicate: boolean;
  suppressIfZero: boolean;
  text: string;
  dataField: string;
  format: string;
  fontName: string;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  foreColor: string;
  backColor: string;
  borderStyle: 'None' | 'Solid' | 'Dashed' | 'Dotted';
  borderWidth: number;
  borderColor: string;
  alignment: 'Left' | 'Center' | 'Right' | 'Justify';
  verticalAlignment: 'Top' | 'Middle' | 'Bottom';
  wordWrap: boolean;
  hyperlink: string;
  tooltip: string;
  tag: string;
  aggregateFunction?: AggregateFunction;
  runningSum: boolean;
  resetAfterGroup: string;
}

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  name: string;
  height: number;
  visible: boolean;
  newPage: 'None' | 'Before' | 'After' | 'BeforeAndAfter';
  keepTogether: boolean;
  canGrow: boolean;
  canShrink: boolean;
  backColor: string;
  groupOn: string;
  groupInterval: number;
  sortOrder: SortOrder;
  controls: ReportControl[];
}

export interface DataField {
  name: string;
  type: DataFieldType;
  caption: string;
  description: string;
  length: number;
  precision: number;
  required: boolean;
  defaultValue: any;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'Table' | 'Query' | 'StoredProcedure' | 'Array' | 'XML' | 'JSON';
  connectionString: string;
  commandText: string;
  fields: DataField[];
  parameters: Array<{
    name: string;
    type: DataFieldType;
    defaultValue: any;
  }>;
}

export interface ReportGroup {
  id: string;
  name: string;
  expression: string;
  sortOrder: SortOrder;
  groupInterval: number;
  keepTogether: boolean;
  headerSection: string;
  footerSection: string;
}

export interface ReportSettings {
  name: string;
  title: string;
  description: string;
  author: string;
  keywords: string;
  subject: string;
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  orientation: 'Portrait' | 'Landscape';
  paperSize: string;
  gridsX: number;
  gridsY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  units: 'Inches' | 'Centimeters' | 'Twips' | 'Points';
  zoom: number;
}

export interface ReportProject {
  id: string;
  settings: ReportSettings;
  dataSources: DataSource[];
  sections: ReportSection[];
  groups: ReportGroup[];
  lastModified: Date;
}

interface ReportDesignerProps {
  initialProject?: ReportProject;
  onProjectChange?: (project: ReportProject) => void;
  onGenerateReport?: (project: ReportProject, data?: any[]) => void;
  onPreviewReport?: (project: ReportProject) => void;
  onExportReport?: (project: ReportProject, format: 'PDF' | 'HTML' | 'Excel' | 'Word') => void;
  onSaveProject?: (project: ReportProject) => void;
}

export const ReportDesigner: React.FC<ReportDesignerProps> = ({
  initialProject,
  onProjectChange,
  onGenerateReport,
  onPreviewReport,
  onExportReport,
  onSaveProject
}) => {
  const [project, setProject] = useState<ReportProject>({
    id: 'report1',
    settings: {
      name: 'Report1',
      title: 'New Report',
      description: '',
      author: 'User',
      keywords: '',
      subject: '',
      pageWidth: 8.5,
      pageHeight: 11,
      marginTop: 1,
      marginBottom: 1,
      marginLeft: 1,
      marginRight: 1,
      orientation: 'Portrait',
      paperSize: 'Letter',
      gridsX: 24,
      gridsY: 24,
      showGrid: true,
      snapToGrid: true,
      units: 'Inches',
      zoom: 100
    },
    dataSources: [],
    sections: [],
    groups: [],
    lastModified: new Date()
  });

  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const [selectedControl, setSelectedControl] = useState<ReportControl | null>(null);
  const [draggedControlType, setDraggedControlType] = useState<ReportControlType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showProperties, setShowProperties] = useState(true);
  const [showToolbox, setShowToolbox] = useState(true);
  const [showFieldList, setShowFieldList] = useState(true);
  const [activeTab, setActiveTab] = useState<'design' | 'preview' | 'data'>('design');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showReportSettings, setShowReportSettings] = useState(false);

  const eventEmitter = useRef(new EventEmitter());
  const designerRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Control templates
  const controlTemplates = [
    {
      type: ReportControlType.Label,
      name: 'Label',
      icon: '📝',
      defaultSize: { width: 80, height: 20 }
    },
    {
      type: ReportControlType.TextBox,
      name: 'TextBox',
      icon: '📄',
      defaultSize: { width: 100, height: 20 }
    },
    {
      type: ReportControlType.Image,
      name: 'Image',
      icon: '🖼️',
      defaultSize: { width: 80, height: 60 }
    },
    {
      type: ReportControlType.Line,
      name: 'Line',
      icon: '➖',
      defaultSize: { width: 100, height: 1 }
    },
    {
      type: ReportControlType.Shape,
      name: 'Shape',
      icon: '🔲',
      defaultSize: { width: 60, height: 60 }
    },
    {
      type: ReportControlType.Chart,
      name: 'Chart',
      icon: '📊',
      defaultSize: { width: 200, height: 150 }
    },
    {
      type: ReportControlType.Barcode,
      name: 'Barcode',
      icon: '🔢',
      defaultSize: { width: 120, height: 40 }
    },
    {
      type: ReportControlType.Subreport,
      name: 'Subreport',
      icon: '📋',
      defaultSize: { width: 200, height: 100 }
    }
  ];

  // Initialize project
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    } else {
      // Create default sections
      const defaultSections: ReportSection[] = [
        {
          id: 'reportheader',
          type: ReportSectionType.ReportHeader,
          name: 'Report Header',
          height: 0.5,
          visible: true,
          newPage: 'None',
          keepTogether: false,
          canGrow: false,
          canShrink: false,
          backColor: '#FFFFFF',
          groupOn: '',
          groupInterval: 1,
          sortOrder: SortOrder.Ascending,
          controls: []
        },
        {
          id: 'pageheader',
          type: ReportSectionType.PageHeader,
          name: 'Page Header',
          height: 0.25,
          visible: true,
          newPage: 'None',
          keepTogether: false,
          canGrow: false,
          canShrink: false,
          backColor: '#FFFFFF',
          groupOn: '',
          groupInterval: 1,
          sortOrder: SortOrder.Ascending,
          controls: []
        },
        {
          id: 'detail',
          type: ReportSectionType.Detail,
          name: 'Detail',
          height: 0.25,
          visible: true,
          newPage: 'None',
          keepTogether: false,
          canGrow: true,
          canShrink: false,
          backColor: '#FFFFFF',
          groupOn: '',
          groupInterval: 1,
          sortOrder: SortOrder.Ascending,
          controls: []
        },
        {
          id: 'pagefooter',
          type: ReportSectionType.PageFooter,
          name: 'Page Footer',
          height: 0.25,
          visible: true,
          newPage: 'None',
          keepTogether: false,
          canGrow: false,
          canShrink: false,
          backColor: '#FFFFFF',
          groupOn: '',
          groupInterval: 1,
          sortOrder: SortOrder.Ascending,
          controls: []
        },
        {
          id: 'reportfooter',
          type: ReportSectionType.ReportFooter,
          name: 'Report Footer',
          height: 0.5,
          visible: true,
          newPage: 'None',
          keepTogether: false,
          canGrow: false,
          canShrink: false,
          backColor: '#FFFFFF',
          groupOn: '',
          groupInterval: 1,
          sortOrder: SortOrder.Ascending,
          controls: []
        }
      ];

      // Create sample data source
      const sampleDataSource: DataSource = {
        id: 'datasource1',
        name: 'Customers',
        type: 'Table',
        connectionString: '',
        commandText: 'SELECT * FROM Customers',
        fields: [
          { name: 'CustomerID', type: DataFieldType.Text, caption: 'Customer ID', description: 'Unique customer identifier', length: 10, precision: 0, required: true, defaultValue: '' },
          { name: 'CompanyName', type: DataFieldType.Text, caption: 'Company Name', description: 'Customer company name', length: 50, precision: 0, required: true, defaultValue: '' },
          { name: 'ContactName', type: DataFieldType.Text, caption: 'Contact Name', description: 'Primary contact name', length: 30, precision: 0, required: false, defaultValue: '' },
          { name: 'ContactTitle', type: DataFieldType.Text, caption: 'Contact Title', description: 'Contact job title', length: 30, precision: 0, required: false, defaultValue: '' },
          { name: 'Address', type: DataFieldType.Text, caption: 'Address', description: 'Street address', length: 60, precision: 0, required: false, defaultValue: '' },
          { name: 'City', type: DataFieldType.Text, caption: 'City', description: 'City name', length: 30, precision: 0, required: false, defaultValue: '' },
          { name: 'Region', type: DataFieldType.Text, caption: 'Region', description: 'State or region', length: 15, precision: 0, required: false, defaultValue: '' },
          { name: 'PostalCode', type: DataFieldType.Text, caption: 'Postal Code', description: 'ZIP or postal code', length: 10, precision: 0, required: false, defaultValue: '' },
          { name: 'Country', type: DataFieldType.Text, caption: 'Country', description: 'Country name', length: 20, precision: 0, required: false, defaultValue: '' },
          { name: 'Phone', type: DataFieldType.Text, caption: 'Phone', description: 'Phone number', length: 24, precision: 0, required: false, defaultValue: '' }
        ],
        parameters: []
      };

      setProject(prev => ({
        ...prev,
        sections: defaultSections,
        dataSources: [sampleDataSource]
      }));

      setSelectedSection(defaultSections[2]); // Select Detail section by default
    }
  }, [initialProject]);

  // Notify parent of changes
  useEffect(() => {
    onProjectChange?.(project);
  }, [project, onProjectChange]);

  // Add control to section
  const addControlToSection = useCallback((sectionId: string, controlType: ReportControlType, x: number, y: number) => {
    const template = controlTemplates.find(t => t.type === controlType);
    if (!template) return;

    // Convert coordinates based on units and zoom
    const actualX = x * (100 / project.settings.zoom);
    const actualY = y * (100 / project.settings.zoom);

    // Snap to grid if enabled
    let snapX = actualX;
    let snapY = actualY;
    if (project.settings.snapToGrid) {
      const gridSizeX = project.settings.pageWidth / project.settings.gridsX;
      const gridSizeY = project.settings.pageHeight / project.settings.gridsY;
      snapX = Math.round(actualX / gridSizeX) * gridSizeX;
      snapY = Math.round(actualY / gridSizeY) * gridSizeY;
    }

    const controlCount = project.sections
      .flatMap(s => s.controls)
      .filter(c => c.type === controlType).length;

    const newControl: ReportControl = {
      id: `control_${Date.now()}`,
      name: `${template.name}${controlCount + 1}`,
      type: controlType,
      left: snapX,
      top: snapY,
      width: template.defaultSize.width / 72, // Convert to inches
      height: template.defaultSize.height / 72,
      visible: true,
      canGrow: false,
      canShrink: false,
      hideIfDuplicate: false,
      suppressIfZero: false,
      text: template.name,
      dataField: '',
      format: '',
      fontName: 'Arial',
      fontSize: 10,
      fontBold: false,
      fontItalic: false,
      fontUnderline: false,
      foreColor: '#000000',
      backColor: 'transparent',
      borderStyle: 'None',
      borderWidth: 1,
      borderColor: '#000000',
      alignment: 'Left',
      verticalAlignment: 'Top',
      wordWrap: false,
      hyperlink: '',
      tooltip: '',
      tag: '',
      runningSum: false,
      resetAfterGroup: ''
    };

    setProject(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, controls: [...section.controls, newControl] }
          : section
      ),
      lastModified: new Date()
    }));

    setSelectedControl(newControl);
  }, [project.settings, controlTemplates]);

  // Update control
  const updateControl = useCallback((controlId: string, updates: Partial<ReportControl>) => {
    setProject(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        controls: section.controls.map(control =>
          control.id === controlId ? { ...control, ...updates } : control
        )
      })),
      lastModified: new Date()
    }));
  }, []);

  // Delete control
  const deleteControl = useCallback((controlId: string) => {
    setProject(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        controls: section.controls.filter(control => control.id !== controlId)
      })),
      lastModified: new Date()
    }));

    if (selectedControl?.id === controlId) {
      setSelectedControl(null);
    }
  }, [selectedControl]);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setProject(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
      lastModified: new Date()
    }));
  }, []);

  // Handle canvas drop
  const handleCanvasDrop = useCallback((e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    if (!draggedControlType) return;

    const section = project.sections.find(s => s.id === sectionId);
    if (!section) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addControlToSection(sectionId, draggedControlType, x, y);
    setDraggedControlType(null);
  }, [draggedControlType, project.sections, addControlToSection]);

  // Handle control mouse down
  const handleControlMouseDown = useCallback((e: React.MouseEvent, control: ReportControl) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedControl(control);
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragOffset({ x, y });
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedControl) return;

    // Implementation for moving controls would go here
    // This would involve calculating new position and updating the control
  }, [isDragging, selectedControl]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Get section background color
  const getSectionBackgroundColor = (section: ReportSection): string => {
    switch (section.type) {
      case ReportSectionType.ReportHeader:
        return '#E8F4F8';
      case ReportSectionType.PageHeader:
        return '#F0F8E8';
      case ReportSectionType.Detail:
        return '#FFFFFF';
      case ReportSectionType.PageFooter:
        return '#F8F0E8';
      case ReportSectionType.ReportFooter:
        return '#F8E8F0';
      default:
        return '#FFFFFF';
    }
  };

  // Render grid
  const renderGrid = (width: number, height: number): React.ReactNode => {
    if (!project.settings.showGrid) return null;

    const gridLines = [];
    const gridSizeX = (width / project.settings.gridsX) * (project.settings.zoom / 100);
    const gridSizeY = (height / project.settings.gridsY) * (project.settings.zoom / 100);

    // Vertical lines
    for (let x = 0; x <= width; x += gridSizeX) {
      gridLines.push(
        <line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#E0E0E0"
          strokeWidth="0.5"
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSizeY) {
      gridLines.push(
        <line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#E0E0E0"
          strokeWidth="0.5"
        />
      );
    }

    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ width, height }}>
        {gridLines}
      </svg>
    );
  };

  // Render control
  const renderControl = (control: ReportControl): React.ReactNode => {
    const isSelected = selectedControl?.id === control.id;
    const zoom = project.settings.zoom / 100;

    const style: React.CSSProperties = {
      left: control.left * 72 * zoom, // Convert inches to pixels
      top: control.top * 72 * zoom,
      width: control.width * 72 * zoom,
      height: control.height * 72 * zoom,
      fontFamily: control.fontName,
      fontSize: control.fontSize * zoom,
      fontWeight: control.fontBold ? 'bold' : 'normal',
      fontStyle: control.fontItalic ? 'italic' : 'normal',
      textDecoration: control.fontUnderline ? 'underline' : 'none',
      color: control.foreColor,
      backgroundColor: control.backColor === 'transparent' ? 'transparent' : control.backColor,
      textAlign: control.alignment.toLowerCase() as any,
      border: control.borderStyle !== 'None' ? `${control.borderWidth}px ${control.borderStyle.toLowerCase()} ${control.borderColor}` : 'none',
      overflow: control.wordWrap ? 'visible' : 'hidden',
      whiteSpace: control.wordWrap ? 'normal' : 'nowrap'
    };

    return (
      <div
        key={control.id}
        className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={style}
        onMouseDown={(e) => handleControlMouseDown(e, control)}
      >
        <div className="w-full h-full flex items-center">
          {control.type === ReportControlType.Label && (
            <span>{control.text || control.name}</span>
          )}
          {control.type === ReportControlType.TextBox && (
            <span>{control.dataField ? `{${control.dataField}}` : control.text || '[TextBox]'}</span>
          )}
          {control.type === ReportControlType.Image && (
            <div className="w-full h-full bg-gray-100 border border-dashed border-gray-400 flex items-center justify-center text-xs">
              🖼️ Image
            </div>
          )}
          {control.type === ReportControlType.Line && (
            <div className="w-full border-t border-black"></div>
          )}
          {control.type === ReportControlType.Shape && (
            <div className="w-full h-full border border-black"></div>
          )}
          {control.type === ReportControlType.Chart && (
            <div className="w-full h-full bg-gray-100 border border-dashed border-gray-400 flex items-center justify-center text-xs">
              📊 Chart
            </div>
          )}
          {control.type === ReportControlType.Barcode && (
            <div className="w-full h-full bg-gray-100 border border-dashed border-gray-400 flex items-center justify-center text-xs">
              🔢 Barcode
            </div>
          )}
          {control.type === ReportControlType.Subreport && (
            <div className="w-full h-full bg-gray-100 border border-dashed border-gray-400 flex items-center justify-center text-xs">
              📋 Subreport
            </div>
          )}
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

  // Render section
  const renderSection = (section: ReportSection): React.ReactNode => {
    const isSelected = selectedSection?.id === section.id;
    const zoom = project.settings.zoom / 100;
    const pageWidth = project.settings.pageWidth * 72 * zoom; // Convert inches to pixels
    const sectionHeight = section.height * 72 * zoom;

    return (
      <div key={section.id} className="border-b border-gray-400">
        {/* Section Header */}
        <div
          className={`flex items-center justify-between px-2 py-1 text-xs font-medium cursor-pointer ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setSelectedSection(section)}
        >
          <span>{section.name}</span>
          <span>{section.height}"</span>
        </div>

        {/* Section Content */}
        <div
          className="relative border-l border-r border-gray-300"
          style={{
            width: pageWidth,
            height: sectionHeight,
            backgroundColor: getSectionBackgroundColor(section)
          }}
          onDrop={(e) => handleCanvasDrop(e, section.id)}
          onDragOver={(e) => e.preventDefault()}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {renderGrid(pageWidth, sectionHeight)}
          {section.controls.map(renderControl)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Report Designer</h3>
          <span className="text-xs text-gray-500">({project.settings.name})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreviewReport?.(project)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Preview"
          >
            👁️
          </button>
          
          <button
            onClick={() => onExportReport?.(project, 'PDF')}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            title="Export PDF"
          >
            📄
          </button>
          
          <button
            onClick={() => setShowReportSettings(true)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Report Settings"
          >
            ⚙️
          </button>
          
          <button
            onClick={() => onSaveProject?.(project)}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Save"
          >
            💾
          </button>
          
          <select
            value={project.settings.zoom}
            onChange={(e) => setProject(prev => ({
              ...prev,
              settings: { ...prev.settings, zoom: parseInt(e.target.value) }
            }))}
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
          { key: 'preview', label: 'Preview', icon: '👁️' },
          { key: 'data', label: 'Data', icon: '🗃️' }
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
          <div className="w-48 border-r border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">Toolbox</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1">
                {controlTemplates.map(template => (
                  <div
                    key={template.type}
                    className="flex flex-col items-center p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-100"
                    draggable
                    onDragStart={(e) => {
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

        {/* Field List */}
        {showFieldList && activeTab === 'design' && (
          <div className="w-48 border-r border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">Field List</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {project.dataSources.map(dataSource => (
                <div key={dataSource.id} className="mb-4">
                  <div className="font-medium text-sm text-gray-700 mb-2">{dataSource.name}</div>
                  <div className="space-y-1">
                    {dataSource.fields.map(field => (
                      <div
                        key={field.name}
                        className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100"
                        draggable
                        onDragStart={(e) => {
                          // Set data for creating a bound textbox
                          e.dataTransfer.setData('field', field.name);
                          setDraggedControlType(ReportControlType.TextBox);
                        }}
                        title={field.description}
                      >
                        📄 {field.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Design Surface */}
        {activeTab === 'design' && (
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <div
                ref={reportRef}
                className="bg-white shadow-lg border border-gray-400"
                style={{
                  width: project.settings.pageWidth * 72 * (project.settings.zoom / 100),
                  minHeight: project.settings.pageHeight * 72 * (project.settings.zoom / 100)
                }}
              >
                {project.sections.filter(s => s.visible).map(renderSection)}
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white shadow-lg border border-gray-400 p-8">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">👁️</div>
                <p className="text-lg">Report Preview</p>
                <p className="text-sm mt-2">Preview functionality would render the report with actual data</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Data Sources</h4>
                <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                  Add Data Source
                </button>
              </div>

              {project.dataSources.map(dataSource => (
                <div key={dataSource.id} className="border border-gray-300 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{dataSource.name}</div>
                    <div className="text-xs text-gray-500">{dataSource.type}</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{dataSource.commandText}</div>
                  <div className="text-xs text-gray-500">Fields: {dataSource.fields.length}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Properties Panel */}
        {showProperties && (selectedControl || selectedSection) && (
          <div className="w-64 border-l border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">Properties</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {selectedControl && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedControl.name}
                      onChange={(e) => updateControl(selectedControl.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                    <input
                      type="text"
                      value={selectedControl.text}
                      onChange={(e) => updateControl(selectedControl.id, { text: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Data Field</label>
                    <select
                      value={selectedControl.dataField}
                      onChange={(e) => updateControl(selectedControl.id, { dataField: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="">None</option>
                      {project.dataSources.flatMap(ds => 
                        ds.fields.map(field => (
                          <option key={field.name} value={field.name}>{field.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Left</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedControl.left}
                        onChange={(e) => updateControl(selectedControl.id, { left: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Top</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedControl.top}
                        onChange={(e) => updateControl(selectedControl.id, { top: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedControl.width}
                        onChange={(e) => updateControl(selectedControl.id, { width: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedControl.height}
                        onChange={(e) => updateControl(selectedControl.id, { height: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                    <select
                      value={selectedControl.fontName}
                      onChange={(e) => updateControl(selectedControl.id, { fontName: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                    <input
                      type="number"
                      min="6"
                      max="72"
                      value={selectedControl.fontSize}
                      onChange={(e) => updateControl(selectedControl.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedControl.fontBold}
                        onChange={(e) => updateControl(selectedControl.id, { fontBold: e.target.checked })}
                      />
                      Bold
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedControl.fontItalic}
                        onChange={(e) => updateControl(selectedControl.id, { fontItalic: e.target.checked })}
                      />
                      Italic
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedControl.visible}
                        onChange={(e) => updateControl(selectedControl.id, { visible: e.target.checked })}
                      />
                      Visible
                    </label>
                  </div>
                </div>
              )}

              {selectedSection && !selectedControl && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedSection.name}
                      onChange={(e) => updateSection(selectedSection.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedSection.height}
                      onChange={(e) => updateSection(selectedSection.id, { height: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedSection.visible}
                        onChange={(e) => updateSection(selectedSection.id, { visible: e.target.checked })}
                      />
                      Visible
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedSection.keepTogether}
                        onChange={(e) => updateSection(selectedSection.id, { keepTogether: e.target.checked })}
                      />
                      Keep Together
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedSection.canGrow}
                        onChange={(e) => updateSection(selectedSection.id, { canGrow: e.target.checked })}
                      />
                      Can Grow
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedSection.canShrink}
                        onChange={(e) => updateSection(selectedSection.id, { canShrink: e.target.checked })}
                      />
                      Can Shrink
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
          <span>Sections: {project.sections.length}</span>
          <span>Controls: {project.sections.reduce((total, s) => total + s.controls.length, 0)}</span>
          <span>Data Sources: {project.dataSources.length}</span>
          {selectedControl && (
            <span>
              Selected: {selectedControl.name} ({selectedControl.left.toFixed(2)}", {selectedControl.top.toFixed(2)}")
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Zoom: {project.settings.zoom}%</span>
          <span>Units: {project.settings.units}</span>
          <span>Page: {project.settings.pageWidth}"×{project.settings.pageHeight}"</span>
        </div>
      </div>
    </div>
  );
};

export default ReportDesigner;