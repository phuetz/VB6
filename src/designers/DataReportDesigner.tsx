import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Report Section Types
export enum ReportSectionType {
  ReportHeader = 'ReportHeader',
  PageHeader = 'PageHeader',
  GroupHeader = 'GroupHeader',
  Detail = 'Detail',
  GroupFooter = 'GroupFooter',
  PageFooter = 'PageFooter',
  ReportFooter = 'ReportFooter',
}

// Report Control Types
export enum ReportControlType {
  Label = 'Label',
  TextBox = 'TextBox',
  Image = 'Image',
  Line = 'Line',
  Shape = 'Shape',
  Function = 'Function',
  SubReport = 'SubReport',
  PageBreak = 'PageBreak',
  Barcode = 'Barcode',
  Chart = 'Chart',
}

// Data Field Types
export enum DataFieldType {
  Database = 'Database',
  Parameter = 'Parameter',
  Calculated = 'Calculated',
  System = 'System',
}

// Aggregate Functions
export enum AggregateFunction {
  Sum = 'Sum',
  Count = 'Count',
  Average = 'Average',
  Min = 'Min',
  Max = 'Max',
  StdDev = 'StdDev',
  Variance = 'Variance',
}

// Report Control
export interface ReportControl {
  id: string;
  type: ReportControlType;
  left: number;
  top: number;
  width: number;
  height: number;
  properties: {
    name: string;
    dataField?: string;
    dataFieldType?: DataFieldType;
    text?: string;
    font?: {
      name: string;
      size: number;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };
    foreColor?: string;
    backColor?: string;
    borderStyle?: number;
    borderColor?: string;
    borderWidth?: number;
    alignment?: 'left' | 'center' | 'right';
    format?: string;
    visible?: boolean;
    canGrow?: boolean;
    canShrink?: boolean;
    aggregateFunction?: AggregateFunction;
  };
}

// Report Section
export interface ReportSection {
  type: ReportSectionType;
  height: number;
  visible: boolean;
  backColor?: string;
  keepTogether?: boolean;
  newPage?: boolean;
  controls: ReportControl[];
  groupField?: string;
}

// Report Definition
export interface ReportDefinition {
  name: string;
  title: string;
  dataSource?: string;
  connectionString?: string;
  query?: string;
  parameters: Array<{
    name: string;
    type: string;
    defaultValue: any;
    prompt: string;
  }>;
  sections: ReportSection[];
  pageSetup: {
    paperSize: string;
    orientation: 'portrait' | 'landscape';
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  };
}

// Toolbox Item
interface ToolboxItem {
  type: ReportControlType;
  icon: string;
  name: string;
}

interface DataReportDesignerProps {
  initialReport?: ReportDefinition;
  onSave?: (report: ReportDefinition) => void;
  onPreview?: (report: ReportDefinition) => void;
}

export const DataReportDesigner: React.FC<DataReportDesignerProps> = ({
  initialReport,
  onSave,
  onPreview,
}) => {
  const [report, setReport] = useState<ReportDefinition>(
    initialReport || {
      name: 'DataReport1',
      title: 'Data Report',
      sections: [
        { type: ReportSectionType.ReportHeader, height: 50, visible: true, controls: [] },
        { type: ReportSectionType.PageHeader, height: 30, visible: true, controls: [] },
        { type: ReportSectionType.Detail, height: 20, visible: true, controls: [] },
        { type: ReportSectionType.PageFooter, height: 30, visible: true, controls: [] },
        { type: ReportSectionType.ReportFooter, height: 50, visible: true, controls: [] },
      ],
      parameters: [],
      pageSetup: {
        paperSize: 'A4',
        orientation: 'portrait',
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
      },
    }
  );

  const [selectedControl, setSelectedControl] = useState<{
    sectionType: ReportSectionType;
    control: ReportControl;
  } | null>(null);
  const [selectedSection, setSelectedSection] = useState<ReportSectionType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<ReportControlType | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);

  const designerRef = useRef<HTMLDivElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // MEMORY LEAK FIX: Cleanup EventEmitter to prevent memory leaks
  useEffect(() => {
    return () => {
      // Remove all listeners and clear references
      eventEmitter.current.removeAllListeners();
    };
  }, []);

  // Toolbox items
  const toolboxItems: ToolboxItem[] = [
    { type: ReportControlType.Label, icon: 'A', name: 'Label' },
    { type: ReportControlType.TextBox, icon: '□', name: 'Text Box' },
    { type: ReportControlType.Image, icon: '🖼️', name: 'Image' },
    { type: ReportControlType.Line, icon: '━', name: 'Line' },
    { type: ReportControlType.Shape, icon: '▭', name: 'Shape' },
    { type: ReportControlType.Function, icon: 'Σ', name: 'Function' },
    { type: ReportControlType.Chart, icon: '📊', name: 'Chart' },
  ];

  const createControl = useCallback(
    (type: ReportControlType, x: number, y: number): ReportControl => {
      const id = `control_${Date.now()}`;
      const baseControl: ReportControl = {
        id,
        type,
        left: x,
        top: y,
        width: 100,
        height: 20,
        properties: {
          name: `${type}${id}`,
          visible: true,
          alignment: 'left',
        },
      };

      // Set default properties based on type
      switch (type) {
        case ReportControlType.Label:
          baseControl.properties.text = 'Label';
          baseControl.properties.font = { name: 'Arial', size: 10 };
          break;
        case ReportControlType.TextBox:
          baseControl.properties.dataField = '';
          baseControl.properties.font = { name: 'Arial', size: 10 };
          baseControl.properties.borderStyle = 1;
          break;
        case ReportControlType.Image:
          baseControl.width = 50;
          baseControl.height = 50;
          break;
        case ReportControlType.Line:
          baseControl.height = 1;
          baseControl.properties.borderWidth = 1;
          baseControl.properties.borderColor = '#000000';
          break;
        case ReportControlType.Shape:
          baseControl.width = 50;
          baseControl.height = 50;
          baseControl.properties.borderStyle = 1;
          break;
        case ReportControlType.Function:
          baseControl.properties.aggregateFunction = AggregateFunction.Sum;
          baseControl.properties.font = { name: 'Arial', size: 10 };
          break;
        case ReportControlType.Chart:
          baseControl.width = 200;
          baseControl.height = 150;
          break;
      }

      return baseControl;
    },
    []
  );

  const addControl = useCallback((sectionType: ReportSectionType, control: ReportControl) => {
    setReport(prev => {
      const updated = { ...prev };
      const section = updated.sections.find(s => s.type === sectionType);
      if (section) {
        section.controls.push(control);
      }
      return updated;
    });

    setSelectedControl({ sectionType, control });
    eventEmitter.current.emit('controlAdded', { sectionType, control });
  }, []);

  const updateControl = useCallback(
    (sectionType: ReportSectionType, controlId: string, updates: Partial<ReportControl>) => {
      setReport(prev => {
        const updated = { ...prev };
        const section = updated.sections.find(s => s.type === sectionType);
        if (section) {
          const controlIndex = section.controls.findIndex(c => c.id === controlId);
          if (controlIndex >= 0) {
            section.controls[controlIndex] = { ...section.controls[controlIndex], ...updates };

            // Update selected control if it's the one being updated
            if (selectedControl?.control.id === controlId) {
              setSelectedControl({ sectionType, control: section.controls[controlIndex] });
            }
          }
        }
        return updated;
      });

      eventEmitter.current.emit('controlUpdated', { sectionType, controlId, updates });
    },
    [selectedControl]
  );

  const deleteControl = useCallback(
    (sectionType: ReportSectionType, controlId: string) => {
      setReport(prev => {
        const updated = { ...prev };
        const section = updated.sections.find(s => s.type === sectionType);
        if (section) {
          section.controls = section.controls.filter(c => c.id !== controlId);
        }
        return updated;
      });

      if (selectedControl?.control.id === controlId) {
        setSelectedControl(null);
      }

      eventEmitter.current.emit('controlDeleted', { sectionType, controlId });
    },
    [selectedControl]
  );

  const updateSection = useCallback(
    (sectionType: ReportSectionType, updates: Partial<ReportSection>) => {
      setReport(prev => {
        const updated = { ...prev };
        const sectionIndex = updated.sections.findIndex(s => s.type === sectionType);
        if (sectionIndex >= 0) {
          updated.sections[sectionIndex] = { ...updated.sections[sectionIndex], ...updates };
        }
        return updated;
      });

      eventEmitter.current.emit('sectionUpdated', { sectionType, updates });
    },
    []
  );

  const handleDragStart = useCallback((type: ReportControlType, e: React.MouseEvent) => {
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
    (e: React.MouseEvent, sectionType: ReportSectionType) => {
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
      addControl(sectionType, newControl);

      handleDragEnd();
    },
    [draggedItem, zoom, gridSize, createControl, addControl, handleDragEnd]
  );

  const handleControlMouseDown = useCallback(
    (e: React.MouseEvent, sectionType: ReportSectionType, control: ReportControl) => {
      e.stopPropagation();
      setSelectedControl({ sectionType, control });

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = control.left;
      const startTop = control.top;

      const handleMouseMove = (e: MouseEvent) => {
        const safeZoom = zoom === 0 ? 100 : zoom;
        const deltaX = (e.clientX - startX) / (safeZoom / 100);
        const deltaY = (e.clientY - startY) / (safeZoom / 100);

        const safeGridSize = gridSize === 0 ? 8 : gridSize;
        const newLeft = Math.round((startLeft + deltaX) / safeGridSize) * safeGridSize;
        const newTop = Math.round((startTop + deltaY) / safeGridSize) * safeGridSize;

        updateControl(sectionType, control.id, {
          left: Math.max(0, newLeft),
          top: Math.max(0, newTop),
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [zoom, gridSize, updateControl]
  );

  const handleSave = useCallback(() => {
    onSave?.(report);
    eventEmitter.current.emit('reportSaved', report);
  }, [report, onSave]);

  const handlePreview = useCallback(() => {
    onPreview?.(report);
    eventEmitter.current.emit('reportPreviewed', report);
  }, [report, onPreview]);

  const renderControl = (
    control: ReportControl,
    sectionType: ReportSectionType
  ): React.ReactNode => {
    const isSelected = selectedControl?.control.id === control.id;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: control.left,
      top: control.top,
      width: control.width,
      height: control.height,
      border: isSelected ? '2px solid #0066cc' : '1px solid #ccc',
      backgroundColor: control.properties.backColor || 'transparent',
      color: control.properties.foreColor || '#000',
      fontSize: control.properties.font?.size || 10,
      fontFamily: control.properties.font?.name || 'Arial',
      fontWeight: control.properties.font?.bold ? 'bold' : 'normal',
      fontStyle: control.properties.font?.italic ? 'italic' : 'normal',
      textDecoration: control.properties.font?.underline ? 'underline' : 'none',
      textAlign: control.properties.alignment || 'left',
      cursor: 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent:
        control.properties.alignment === 'center'
          ? 'center'
          : control.properties.alignment === 'right'
            ? 'flex-end'
            : 'flex-start',
      padding: '2px',
      overflow: 'hidden',
    };

    let content: React.ReactNode = null;

    switch (control.type) {
      case ReportControlType.Label:
        content = control.properties.text || 'Label';
        break;
      case ReportControlType.TextBox:
        content = control.properties.dataField ? `[${control.properties.dataField}]` : '[Field]';
        break;
      case ReportControlType.Image:
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Image
          </div>
        );
        break;
      case ReportControlType.Line:
        style.borderTop = `${control.properties.borderWidth || 1}px solid ${control.properties.borderColor || '#000'}`;
        style.height = control.properties.borderWidth || 1;
        break;
      case ReportControlType.Shape:
        style.border = `${control.properties.borderWidth || 1}px solid ${control.properties.borderColor || '#000'}`;
        break;
      case ReportControlType.Function:
        content = `[${control.properties.aggregateFunction || 'Sum'}(${control.properties.dataField || 'Field'})]`;
        break;
      case ReportControlType.Chart:
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Chart
          </div>
        );
        break;
    }

    return (
      <div
        key={control.id}
        style={style}
        onMouseDown={e => handleControlMouseDown(e, sectionType, control)}
        onClick={e => {
          e.stopPropagation();
          setSelectedControl({ sectionType, control });
        }}
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
                deleteControl(sectionType, control.id);
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

  const renderSection = (section: ReportSection): React.ReactNode => {
    const isSelected = selectedSection === section.type;

    return (
      <div
        key={section.type}
        className="report-section"
        style={{
          position: 'relative',
          height: section.height,
          backgroundColor: section.backColor || '#fff',
          border: isSelected ? '2px solid #0066cc' : '1px solid #ddd',
          marginBottom: 5,
          cursor: 'pointer',
        }}
        onClick={() => setSelectedSection(section.type)}
        onMouseMove={e => {
          if (isDragging) {
            e.currentTarget.style.backgroundColor = '#f0f8ff';
          }
        }}
        onMouseLeave={e => {
          if (isDragging) {
            e.currentTarget.style.backgroundColor = section.backColor || '#fff';
          }
        }}
        onMouseUp={e => handleDrop(e, section.type)}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            backgroundColor: '#f0f0f0',
            padding: '2px 5px',
            fontSize: '10px',
            color: '#666',
            borderRight: '1px solid #ddd',
            borderBottom: '1px solid #ddd',
          }}
        >
          {section.type}
        </div>

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

        {section.controls.map(control => renderControl(control, section.type))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Data Report Designer</h2>
            <input
              type="text"
              value={report.name}
              onChange={e => setReport(prev => ({ ...prev, name: e.target.value }))}
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

      {/* Toolbar */}
      <div className="p-2 bg-white border-b border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Zoom:</label>
          <select
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>
        </div>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={showRulers}
            onChange={e => setShowRulers(e.target.checked)}
          />
          Rulers
        </label>

        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
          Grid
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm">Grid Size:</label>
          <input
            type="number"
            value={gridSize}
            onChange={e => setGridSize(Number(e.target.value))}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
            min={1}
            max={50}
          />
        </div>
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
                onMouseDown={e => handleDragStart(item.type, e)}
                onMouseUp={handleDragEnd}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Data Fields */}
          <h3 className="font-medium text-gray-700 mt-6 mb-3">Data Fields</h3>
          <div className="space-y-1 text-sm">
            <div className="p-2 bg-blue-50 rounded cursor-move hover:bg-blue-100">CustomerName</div>
            <div className="p-2 bg-blue-50 rounded cursor-move hover:bg-blue-100">OrderDate</div>
            <div className="p-2 bg-blue-50 rounded cursor-move hover:bg-blue-100">TotalAmount</div>
            <div className="p-2 bg-blue-50 rounded cursor-move hover:bg-blue-100">ProductName</div>
            <div className="p-2 bg-blue-50 rounded cursor-move hover:bg-blue-100">Quantity</div>
          </div>
        </div>

        {/* Designer Area */}
        <div
          ref={designerRef}
          className="flex-1 overflow-auto bg-gray-200 p-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        >
          <div
            className="bg-white shadow-lg"
            style={{ width: '210mm', minHeight: '297mm', padding: '10mm' }}
          >
            {showRulers && (
              <>
                {/* Horizontal Ruler */}
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: 0,
                    right: 0,
                    height: 20,
                    backgroundColor: '#f0f0f0',
                    borderBottom: '1px solid #ccc',
                    overflow: 'hidden',
                  }}
                >
                  {Array.from({ length: 21 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: i * 10 + 'mm',
                        top: 10,
                        fontSize: '8px',
                        color: '#666',
                      }}
                    >
                      {i}
                    </div>
                  ))}
                </div>

                {/* Vertical Ruler */}
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
                  {Array.from({ length: 30 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        top: i * 10 + 'mm',
                        left: 5,
                        fontSize: '8px',
                        color: '#666',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'left center',
                      }}
                    >
                      {i}
                    </div>
                  ))}
                </div>
              </>
            )}

            {report.sections.map(section => section.visible && renderSection(section))}
          </div>
        </div>

        {/* Properties Panel */}
        {(selectedControl || selectedSection) && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-3">Properties</h3>

              {selectedControl && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <input
                      type="text"
                      value={selectedControl.control.properties.name}
                      onChange={e =>
                        updateControl(selectedControl.sectionType, selectedControl.control.id, {
                          properties: {
                            ...selectedControl.control.properties,
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  {selectedControl.control.type === ReportControlType.TextBox && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600">Data Field</label>
                      <select
                        value={selectedControl.control.properties.dataField || ''}
                        onChange={e =>
                          updateControl(selectedControl.sectionType, selectedControl.control.id, {
                            properties: {
                              ...selectedControl.control.properties,
                              dataField: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">None</option>
                        <option value="CustomerName">CustomerName</option>
                        <option value="OrderDate">OrderDate</option>
                        <option value="TotalAmount">TotalAmount</option>
                        <option value="ProductName">ProductName</option>
                        <option value="Quantity">Quantity</option>
                      </select>
                    </div>
                  )}

                  {selectedControl.control.type === ReportControlType.Label && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600">Text</label>
                      <input
                        type="text"
                        value={selectedControl.control.properties.text || ''}
                        onChange={e =>
                          updateControl(selectedControl.sectionType, selectedControl.control.id, {
                            properties: {
                              ...selectedControl.control.properties,
                              text: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Position</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Left</label>
                        <input
                          type="number"
                          value={selectedControl.control.left}
                          onChange={e =>
                            updateControl(selectedControl.sectionType, selectedControl.control.id, {
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
                            updateControl(selectedControl.sectionType, selectedControl.control.id, {
                              top: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Width</label>
                        <input
                          type="number"
                          value={selectedControl.control.width}
                          onChange={e =>
                            updateControl(selectedControl.sectionType, selectedControl.control.id, {
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
                            updateControl(selectedControl.sectionType, selectedControl.control.id, {
                              height: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedSection && !selectedControl && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Section</label>
                    <div className="text-sm text-gray-800">{selectedSection}</div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">Height</label>
                    <input
                      type="number"
                      value={report.sections.find(s => s.type === selectedSection)?.height || 0}
                      onChange={e =>
                        updateSection(selectedSection, { height: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          report.sections.find(s => s.type === selectedSection)?.visible || false
                        }
                        onChange={e =>
                          updateSection(selectedSection, { visible: e.target.checked })
                        }
                      />
                      Visible
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          report.sections.find(s => s.type === selectedSection)?.keepTogether ||
                          false
                        }
                        onChange={e =>
                          updateSection(selectedSection, { keepTogether: e.target.checked })
                        }
                      />
                      Keep Together
                    </label>
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

export default DataReportDesigner;
