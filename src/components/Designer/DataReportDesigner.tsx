/**
 * VB6 DataReport Designer Implementation
 *
 * Visual designer for creating and managing data reports with sections, controls, and data binding
 */

import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Panel } from 'primereact/panel';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { ColorPicker } from 'primereact/colorpicker';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';

// DataReport Types
export interface DataReport {
  id: string;
  name: string;
  title: string;
  dataSource: string; // DataEnvironment connection
  dataCommand: string; // Command name
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  type:
    | 'reportHeader'
    | 'pageHeader'
    | 'groupHeader'
    | 'detail'
    | 'groupFooter'
    | 'pageFooter'
    | 'reportFooter';
  name: string;
  height: number;
  visible: boolean;
  backColor: string;
  keepTogether: boolean;
  forceNewPage: 'none' | 'before' | 'after' | 'beforeAndAfter';
  controls: ReportControl[];
  groupField?: string; // For group sections
}

export interface ReportControl {
  id: string;
  type: 'label' | 'textbox' | 'image' | 'line' | 'shape' | 'function';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;

  // Data binding
  dataField?: string;
  dataFormat?: string;

  // Text properties
  caption?: string;
  font?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  foreColor?: string;
  backColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';

  // Border properties
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderColor?: string;
  borderWidth?: number;

  // Shape properties (for line/shape controls)
  shapeType?: 'rectangle' | 'roundedRectangle' | 'circle' | 'line';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillStyle?: 'solid' | 'transparent';

  // Function properties (for calculated fields)
  functionType?: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'now' | 'page' | 'pages';
  functionExpression?: string;

  // Image properties
  picture?: string;
  pictureAlignment?: 'stretch' | 'center' | 'tile' | 'clip';
}

// Constants
const ReportConstants = {
  // Section types
  REPORT_HEADER: 'reportHeader',
  PAGE_HEADER: 'pageHeader',
  GROUP_HEADER: 'groupHeader',
  DETAIL: 'detail',
  GROUP_FOOTER: 'groupFooter',
  PAGE_FOOTER: 'pageFooter',
  REPORT_FOOTER: 'reportFooter',

  // Control types
  LABEL: 'label',
  TEXTBOX: 'textbox',
  IMAGE: 'image',
  LINE: 'line',
  SHAPE: 'shape',
  FUNCTION: 'function',

  // Paper sizes
  LETTER: 'letter',
  LEGAL: 'legal',
  A4: 'a4',
  A3: 'a3',
  CUSTOM: 'custom',

  // Alignments
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
};

interface DataReportDesignerProps {
  report: DataReport;
  onUpdate: (report: DataReport) => void;
  onClose: () => void;
}

// Draggable control from toolbox
interface DraggableControlProps {
  controlType: string;
  label: string;
  icon: string;
}

const DraggableControl: React.FC<DraggableControlProps> = ({ controlType, label, icon }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'reportControl',
    item: { type: controlType },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '8px',
        margin: '4px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <i className={`pi ${icon}`} style={{ fontSize: '20px' }} />
      <div style={{ fontSize: '12px', marginTop: '4px' }}>{label}</div>
    </div>
  );
};

// Report section component
interface ReportSectionComponentProps {
  section: ReportSection;
  onUpdate: (section: ReportSection) => void;
  selectedControl: ReportControl | null;
  onSelectControl: (control: ReportControl | null) => void;
}

const ReportSectionComponent: React.FC<ReportSectionComponentProps> = ({
  section,
  onUpdate,
  selectedControl,
  onSelectControl,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'reportControl',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const sectionRect = (drop as any).current?.getBoundingClientRect();

      if (offset && sectionRect) {
        const x = offset.x - sectionRect.left;
        const y = offset.y - sectionRect.top;

        const newControl: ReportControl = {
          id: `ctrl_${Date.now()}`,
          type: item.type,
          name: `${item.type}${section.controls.length + 1}`,
          left: Math.max(0, x - 50),
          top: Math.max(0, y - 10),
          width: item.type === 'line' ? 100 : 80,
          height: item.type === 'line' ? 1 : 20,
          caption: item.type === 'label' ? 'Label' : undefined,
          font: 'Arial',
          fontSize: 10,
          foreColor: '#000000',
          alignment: 'left',
        };

        const newSection = {
          ...section,
          controls: [...section.controls, newControl],
        };

        onUpdate(newSection);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleControlClick = (control: ReportControl, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectControl(control);
  };

  const handleSectionClick = () => {
    onSelectControl(null);
  };

  const updateControl = (controlId: string, updates: Partial<ReportControl>) => {
    const newSection = {
      ...section,
      controls: section.controls.map(ctrl =>
        ctrl.id === controlId ? { ...ctrl, ...updates } : ctrl
      ),
    };
    onUpdate(newSection);
  };

  const getSectionTitle = () => {
    switch (section.type) {
      case 'reportHeader':
        return 'Report Header';
      case 'pageHeader':
        return 'Page Header';
      case 'groupHeader':
        return `Group Header (${section.groupField || 'None'})`;
      case 'detail':
        return 'Detail';
      case 'groupFooter':
        return `Group Footer (${section.groupField || 'None'})`;
      case 'pageFooter':
        return 'Page Footer';
      case 'reportFooter':
        return 'Report Footer';
      default:
        return section.name;
    }
  };

  return (
    <div
      ref={drop}
      style={{
        marginBottom: '2px',
        border: '1px solid #ddd',
        backgroundColor: section.backColor || '#ffffff',
      }}
      onClick={handleSectionClick}
    >
      <div
        style={{
          backgroundColor: '#e0e0e0',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 'bold',
          borderBottom: '1px solid #ccc',
        }}
      >
        {getSectionTitle()}
      </div>
      <div
        style={{
          position: 'relative',
          height: `${section.height}px`,
          backgroundColor: isOver ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
          overflow: 'hidden',
        }}
      >
        {section.controls.map(control => (
          <ReportControlComponent
            key={control.id}
            control={control}
            selected={selectedControl?.id === control.id}
            onUpdate={updates => updateControl(control.id, updates)}
            onClick={e => handleControlClick(control, e)}
          />
        ))}
      </div>
    </div>
  );
};

// Report control component
interface ReportControlComponentProps {
  control: ReportControl;
  selected: boolean;
  onUpdate: (updates: Partial<ReportControl>) => void;
  onClick: (event: React.MouseEvent) => void;
}

const ReportControlComponent: React.FC<ReportControlComponentProps> = ({
  control,
  selected,
  onUpdate,
  onClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - control.left,
      y: e.clientY - control.top,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        onUpdate({
          left: Math.max(0, e.clientX - dragStart.x),
          top: Math.max(0, e.clientY - dragStart.y),
        });
      }
    },
    [isDragging, dragStart, onUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderControl = () => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${control.left}px`,
      top: `${control.top}px`,
      width: `${control.width}px`,
      height: `${control.height}px`,
      border: selected ? '1px dashed #007bff' : 'none',
      cursor: 'move',
      padding: '2px',
      boxSizing: 'border-box',
    };

    switch (control.type) {
      case 'label':
        return (
          <div
            style={{
              ...style,
              font: `${control.fontBold ? 'bold ' : ''}${control.fontItalic ? 'italic ' : ''}${control.fontSize}px ${control.font}`,
              color: control.foreColor,
              backgroundColor: control.backColor || 'transparent',
              textAlign: control.alignment,
              textDecoration: control.fontUnderline ? 'underline' : 'none',
              borderStyle: control.borderStyle || 'none',
              borderColor: control.borderColor,
              borderWidth: `${control.borderWidth || 0}px`,
            }}
          >
            {control.caption}
          </div>
        );

      case 'textbox':
        return (
          <div
            style={{
              ...style,
              font: `${control.fontBold ? 'bold ' : ''}${control.fontItalic ? 'italic ' : ''}${control.fontSize}px ${control.font}`,
              color: control.foreColor,
              backgroundColor: control.backColor || 'transparent',
              textAlign: control.alignment,
              borderStyle: control.borderStyle || 'solid',
              borderColor: control.borderColor || '#000000',
              borderWidth: `${control.borderWidth || 1}px`,
            }}
          >
            {control.dataField ? `[${control.dataField}]` : '[Field]'}
          </div>
        );

      case 'line':
        return (
          <div style={style}>
            <svg width={control.width} height={Math.max(control.height, 1)}>
              <line
                x1="0"
                y1="0"
                x2={control.width}
                y2={control.height}
                stroke={control.foreColor || '#000000'}
                strokeWidth={control.borderWidth || 1}
                strokeDasharray={
                  control.lineStyle === 'dashed'
                    ? '5,5'
                    : control.lineStyle === 'dotted'
                      ? '2,2'
                      : undefined
                }
              />
            </svg>
          </div>
        );

      case 'shape':
        return (
          <div style={style}>
            <svg width={control.width} height={control.height}>
              {control.shapeType === 'rectangle' && (
                <rect
                  x="0"
                  y="0"
                  width={control.width}
                  height={control.height}
                  fill={
                    control.fillStyle === 'transparent' ? 'none' : control.backColor || '#ffffff'
                  }
                  stroke={control.borderColor || '#000000'}
                  strokeWidth={control.borderWidth || 1}
                />
              )}
              {control.shapeType === 'circle' && (
                <circle
                  cx={control.width / 2}
                  cy={control.height / 2}
                  r={Math.min(control.width, control.height) / 2}
                  fill={
                    control.fillStyle === 'transparent' ? 'none' : control.backColor || '#ffffff'
                  }
                  stroke={control.borderColor || '#000000'}
                  strokeWidth={control.borderWidth || 1}
                />
              )}
            </svg>
          </div>
        );

      case 'image':
        return (
          <div
            style={{
              ...style,
              border: `1px solid ${control.borderColor || '#cccccc'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
            }}
          >
            <i className="pi pi-image" style={{ fontSize: '24px', color: '#999' }} />
          </div>
        );

      case 'function':
        return (
          <div
            style={{
              ...style,
              font: `${control.fontSize}px ${control.font}`,
              color: control.foreColor,
              backgroundColor: control.backColor || 'transparent',
              textAlign: control.alignment,
              borderStyle: control.borderStyle || 'none',
              borderColor: control.borderColor,
              borderWidth: `${control.borderWidth || 0}px`,
            }}
          >
            {control.functionType ? `[${control.functionType}()]` : '[Function]'}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div onMouseDown={handleMouseDown} onClick={onClick}>
      {renderControl()}
      {selected && (
        <>
          {/* Resize handles */}
          <div
            style={{
              position: 'absolute',
              left: control.left - 3,
              top: control.top - 3,
              width: 6,
              height: 6,
              backgroundColor: '#007bff',
              cursor: 'nw-resize',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: control.left + control.width - 3,
              top: control.top - 3,
              width: 6,
              height: 6,
              backgroundColor: '#007bff',
              cursor: 'ne-resize',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: control.left - 3,
              top: control.top + control.height - 3,
              width: 6,
              height: 6,
              backgroundColor: '#007bff',
              cursor: 'sw-resize',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: control.left + control.width - 3,
              top: control.top + control.height - 3,
              width: 6,
              height: 6,
              backgroundColor: '#007bff',
              cursor: 'se-resize',
            }}
          />
        </>
      )}
    </div>
  );
};

export const DataReportDesigner: React.FC<DataReportDesignerProps> = ({
  report,
  onUpdate,
  onClose,
}) => {
  const [currentReport, setCurrentReport] = useState<DataReport>(report);
  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const [selectedControl, setSelectedControl] = useState<ReportControl | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Paper sizes
  const paperSizes = [
    { label: 'Letter (8.5" x 11")', value: 'letter' },
    { label: 'Legal (8.5" x 14")', value: 'legal' },
    { label: 'A4 (210mm x 297mm)', value: 'a4' },
    { label: 'A3 (297mm x 420mm)', value: 'a3' },
    { label: 'Custom', value: 'custom' },
  ];

  // Control toolbox items
  const toolboxItems = [
    { type: 'label', label: 'Label', icon: 'pi-tag' },
    { type: 'textbox', label: 'Text Box', icon: 'pi-align-left' },
    { type: 'image', label: 'Image', icon: 'pi-image' },
    { type: 'line', label: 'Line', icon: 'pi-minus' },
    { type: 'shape', label: 'Shape', icon: 'pi-stop' },
    { type: 'function', label: 'Function', icon: 'pi-calculator' },
  ];

  // Function types
  const functionTypes = [
    { label: 'Sum', value: 'sum' },
    { label: 'Count', value: 'count' },
    { label: 'Average', value: 'avg' },
    { label: 'Minimum', value: 'min' },
    { label: 'Maximum', value: 'max' },
    { label: 'Now (Date/Time)', value: 'now' },
    { label: 'Page Number', value: 'page' },
    { label: 'Total Pages', value: 'pages' },
  ];

  // Update section
  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    const newReport = {
      ...currentReport,
      sections: currentReport.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    };
    setCurrentReport(newReport);
    onUpdate(newReport);
  };

  // Delete selected control
  const deleteSelectedControl = () => {
    if (!selectedControl || !selectedSection) return;

    const newSection = {
      ...selectedSection,
      controls: selectedSection.controls.filter(ctrl => ctrl.id !== selectedControl.id),
    };

    updateSection(selectedSection.id, newSection);
    setSelectedControl(null);
  };

  // Generate preview HTML
  const generatePreviewHTML = (): string => {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>${currentReport.title}</title>
    <style>
        @page {
            size: ${currentReport.paperSize} ${currentReport.orientation};
            margin: ${currentReport.margins.top}mm ${currentReport.margins.right}mm ${currentReport.margins.bottom}mm ${currentReport.margins.left}mm;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .report-section {
            position: relative;
            page-break-inside: avoid;
        }
        .report-control {
            position: absolute;
        }
        @media print {
            .page-break {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>`;

    // Add sections
    currentReport.sections.forEach(section => {
      if (!section.visible) return;

      html += `<div class="report-section" style="height: ${section.height}px; background-color: ${section.backColor || '#ffffff'};">`;

      // Add controls
      section.controls.forEach(control => {
        const controlStyle = `
          left: ${control.left}px;
          top: ${control.top}px;
          width: ${control.width}px;
          height: ${control.height}px;
          font: ${control.fontBold ? 'bold ' : ''}${control.fontItalic ? 'italic ' : ''}${control.fontSize}px ${control.font};
          color: ${control.foreColor};
          background-color: ${control.backColor || 'transparent'};
          text-align: ${control.alignment};
          ${control.fontUnderline ? 'text-decoration: underline;' : ''}
          ${control.borderStyle !== 'none' ? `border: ${control.borderWidth}px ${control.borderStyle} ${control.borderColor};` : ''}
        `;

        switch (control.type) {
          case 'label':
            html += `<div class="report-control" style="${controlStyle}">${control.caption}</div>`;
            break;
          case 'textbox':
            html += `<div class="report-control" style="${controlStyle}">[${control.dataField || 'Field'}]</div>`;
            break;
          case 'function':
            html += `<div class="report-control" style="${controlStyle}">[${control.functionType}()]</div>`;
            break;
          case 'line':
            html += `<div class="report-control" style="${controlStyle}">
              <svg width="${control.width}" height="${control.height}">
                <line x1="0" y1="0" x2="${control.width}" y2="${control.height}" 
                      stroke="${control.foreColor}" stroke-width="${control.borderWidth}" />
              </svg>
            </div>`;
            break;
        }
      });

      html += '</div>';
    });

    html += `
</body>
</html>`;

    return html;
  };

  // Export to VB6 code
  const exportToVB6 = () => {
    let code = `' DataReport Code Generated\n`;
    code += `' Report: ${currentReport.name}\n`;
    code += `' Generated: ${new Date().toLocaleString()}\n\n`;

    code += `Private Sub InitializeReport()\n`;
    code += `    Dim rpt As DataReport\n`;
    code += `    Set rpt = New DataReport\n\n`;

    code += `    ' Report Properties\n`;
    code += `    rpt.Title = "${currentReport.title}"\n`;
    code += `    rpt.DataSource = ${currentReport.dataSource}\n`;
    code += `    rpt.DataMember = "${currentReport.dataCommand}"\n\n`;

    code += `    ' Sections\n`;
    currentReport.sections.forEach(section => {
      const sectionVar = section.type.charAt(0).toUpperCase() + section.type.slice(1);
      code += `    With rpt.Sections("${section.type}")\n`;
      code += `        .Height = ${section.height * 15} ' twips\n`;
      code += `        .Visible = ${section.visible ? 'True' : 'False'}\n`;

      section.controls.forEach(control => {
        code += `\n        ' Control: ${control.name}\n`;
        code += `        .Controls.Add "${control.type}", "${control.name}"\n`;
        code += `        With .Controls("${control.name}")\n`;
        code += `            .Left = ${control.left * 15}\n`;
        code += `            .Top = ${control.top * 15}\n`;
        code += `            .Width = ${control.width * 15}\n`;
        code += `            .Height = ${control.height * 15}\n`;

        if (control.caption) {
          code += `            .Caption = "${control.caption}"\n`;
        }
        if (control.dataField) {
          code += `            .DataField = "${control.dataField}"\n`;
        }

        code += `        End With\n`;
      });

      code += `    End With\n\n`;
    });

    code += `    ' Show the report\n`;
    code += `    rpt.Show\n`;
    code += `End Sub\n`;

    navigator.clipboard.writeText(code);
    alert('VB6 code generated and copied to clipboard!');
  };

  const leftToolbar = (
    <div className="p-toolbar-group-left">
      <Button
        label="Save"
        icon="pi pi-save"
        onClick={() => onUpdate(currentReport)}
        className="p-mr-2"
      />
      <Button
        label="Preview"
        icon="pi pi-eye"
        onClick={() => setShowPreview(true)}
        className="p-mr-2"
      />
      <Button label="Export Code" icon="pi pi-code" onClick={exportToVB6} className="p-mr-2" />
      {selectedControl && (
        <Button
          label="Delete"
          icon="pi pi-trash"
          onClick={deleteSelectedControl}
          severity="danger"
        />
      )}
    </div>
  );

  const rightToolbar = (
    <div className="p-toolbar-group-right">
      <span className="p-mr-2">Zoom:</span>
      <Dropdown
        value={zoom}
        options={[50, 75, 100, 125, 150, 200].map(z => ({ label: `${z}%`, value: z }))}
        onChange={e => setZoom(e.value)}
        style={{ width: '100px' }}
      />
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Dialog
        header={`Data Report Designer - ${currentReport.name}`}
        visible={true}
        style={{ width: '95vw', height: '90vh' }}
        maximizable
        modal
        onHide={onClose}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Toolbar left={leftToolbar} right={rightToolbar} />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Toolbox */}
            <div
              style={{
                width: '200px',
                borderRight: '1px solid #ddd',
                padding: '10px',
                overflow: 'auto',
              }}
            >
              <h4>Toolbox</h4>
              {toolboxItems.map(item => (
                <DraggableControl
                  key={item.type}
                  controlType={item.type}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </div>

            {/* Report Canvas */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', backgroundColor: '#f5f5f5' }}>
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  width: currentReport.orientation === 'portrait' ? '8.5in' : '11in',
                  minHeight: currentReport.orientation === 'portrait' ? '11in' : '8.5in',
                  padding: '20px',
                }}
              >
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{currentReport.title}</h2>

                {currentReport.sections.map(section => (
                  <ReportSectionComponent
                    key={section.id}
                    section={section}
                    onUpdate={updatedSection => updateSection(section.id, updatedSection)}
                    selectedControl={selectedControl}
                    onSelectControl={control => {
                      setSelectedControl(control);
                      setSelectedSection(section);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Properties Panel */}
            <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
              <TabView>
                <TabPanel header="Report">
                  <div className="p-fluid">
                    <div className="p-field">
                      <label>Title</label>
                      <InputText
                        value={currentReport.title}
                        onChange={e =>
                          setCurrentReport({ ...currentReport, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="p-field">
                      <label>Paper Size</label>
                      <Dropdown
                        value={currentReport.paperSize}
                        options={paperSizes}
                        onChange={e => setCurrentReport({ ...currentReport, paperSize: e.value })}
                      />
                    </div>
                    <div className="p-field">
                      <label>Orientation</label>
                      <Dropdown
                        value={currentReport.orientation}
                        options={[
                          { label: 'Portrait', value: 'portrait' },
                          { label: 'Landscape', value: 'landscape' },
                        ]}
                        onChange={e => setCurrentReport({ ...currentReport, orientation: e.value })}
                      />
                    </div>
                  </div>
                </TabPanel>

                {selectedControl && (
                  <TabPanel header="Control">
                    <div className="p-fluid">
                      <div className="p-field">
                        <label>Name</label>
                        <InputText
                          value={selectedControl.name}
                          onChange={e => {
                            const updated = { ...selectedControl, name: e.target.value };
                            setSelectedControl(updated);
                            // Update in section
                            if (selectedSection) {
                              updateSection(selectedSection.id, {
                                controls: selectedSection.controls.map(c =>
                                  c.id === selectedControl.id ? updated : c
                                ),
                              });
                            }
                          }}
                        />
                      </div>

                      {selectedControl.type === 'label' && (
                        <div className="p-field">
                          <label>Caption</label>
                          <InputText
                            value={selectedControl.caption || ''}
                            onChange={e => {
                              const updated = { ...selectedControl, caption: e.target.value };
                              setSelectedControl(updated);
                              if (selectedSection) {
                                updateSection(selectedSection.id, {
                                  controls: selectedSection.controls.map(c =>
                                    c.id === selectedControl.id ? updated : c
                                  ),
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      {selectedControl.type === 'textbox' && (
                        <div className="p-field">
                          <label>Data Field</label>
                          <InputText
                            value={selectedControl.dataField || ''}
                            onChange={e => {
                              const updated = { ...selectedControl, dataField: e.target.value };
                              setSelectedControl(updated);
                              if (selectedSection) {
                                updateSection(selectedSection.id, {
                                  controls: selectedSection.controls.map(c =>
                                    c.id === selectedControl.id ? updated : c
                                  ),
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      {selectedControl.type === 'function' && (
                        <div className="p-field">
                          <label>Function Type</label>
                          <Dropdown
                            value={selectedControl.functionType}
                            options={functionTypes}
                            onChange={e => {
                              const updated = { ...selectedControl, functionType: e.value };
                              setSelectedControl(updated);
                              if (selectedSection) {
                                updateSection(selectedSection.id, {
                                  controls: selectedSection.controls.map(c =>
                                    c.id === selectedControl.id ? updated : c
                                  ),
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      <div className="p-field">
                        <label>Font Size</label>
                        <InputNumber
                          value={selectedControl.fontSize || 10}
                          onChange={e => {
                            const updated = { ...selectedControl, fontSize: e.value };
                            setSelectedControl(updated);
                            if (selectedSection) {
                              updateSection(selectedSection.id, {
                                controls: selectedSection.controls.map(c =>
                                  c.id === selectedControl.id ? updated : c
                                ),
                              });
                            }
                          }}
                          min={6}
                          max={72}
                        />
                      </div>

                      <div className="p-field">
                        <label>Text Color</label>
                        <ColorPicker
                          value={selectedControl.foreColor || '#000000'}
                          onChange={e => {
                            const updated = { ...selectedControl, foreColor: `#${e.value}` };
                            setSelectedControl(updated);
                            if (selectedSection) {
                              updateSection(selectedSection.id, {
                                controls: selectedSection.controls.map(c =>
                                  c.id === selectedControl.id ? updated : c
                                ),
                              });
                            }
                          }}
                        />
                      </div>

                      <div className="p-field-checkbox">
                        <Checkbox
                          inputId="fontBold"
                          checked={selectedControl.fontBold || false}
                          onChange={e => {
                            const updated = { ...selectedControl, fontBold: e.checked };
                            setSelectedControl(updated);
                            if (selectedSection) {
                              updateSection(selectedSection.id, {
                                controls: selectedSection.controls.map(c =>
                                  c.id === selectedControl.id ? updated : c
                                ),
                              });
                            }
                          }}
                        />
                        <label htmlFor="fontBold">Bold</label>
                      </div>

                      <div className="p-field-checkbox">
                        <Checkbox
                          inputId="fontItalic"
                          checked={selectedControl.fontItalic || false}
                          onChange={e => {
                            const updated = { ...selectedControl, fontItalic: e.checked };
                            setSelectedControl(updated);
                            if (selectedSection) {
                              updateSection(selectedSection.id, {
                                controls: selectedSection.controls.map(c =>
                                  c.id === selectedControl.id ? updated : c
                                ),
                              });
                            }
                          }}
                        />
                        <label htmlFor="fontItalic">Italic</label>
                      </div>
                    </div>
                  </TabPanel>
                )}
              </TabView>
            </div>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog
          header="Report Preview"
          visible={showPreview}
          style={{ width: '80vw', height: '80vh' }}
          modal
          onHide={() => setShowPreview(false)}
        >
          <iframe
            srcDoc={generatePreviewHTML()}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Report Preview"
          />
        </Dialog>
      </Dialog>
    </DndProvider>
  );
};

// Helper to create a new DataReport
export const createDataReport = (name: string = 'DataReport1'): DataReport => {
  return {
    id: `rpt_${Date.now()}`,
    name,
    title: 'New Report',
    dataSource: '',
    dataCommand: '',
    paperSize: 'letter',
    orientation: 'portrait',
    margins: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    sections: [
      {
        id: 'rh',
        type: 'reportHeader',
        name: 'Report Header',
        height: 50,
        visible: true,
        backColor: '#ffffff',
        keepTogether: true,
        forceNewPage: 'none',
        controls: [],
      },
      {
        id: 'ph',
        type: 'pageHeader',
        name: 'Page Header',
        height: 40,
        visible: true,
        backColor: '#ffffff',
        keepTogether: true,
        forceNewPage: 'none',
        controls: [],
      },
      {
        id: 'd',
        type: 'detail',
        name: 'Detail',
        height: 30,
        visible: true,
        backColor: '#ffffff',
        keepTogether: false,
        forceNewPage: 'none',
        controls: [],
      },
      {
        id: 'pf',
        type: 'pageFooter',
        name: 'Page Footer',
        height: 40,
        visible: true,
        backColor: '#ffffff',
        keepTogether: true,
        forceNewPage: 'none',
        controls: [],
      },
      {
        id: 'rf',
        type: 'reportFooter',
        name: 'Report Footer',
        height: 50,
        visible: true,
        backColor: '#ffffff',
        keepTogether: true,
        forceNewPage: 'none',
        controls: [],
      },
    ],
  };
};

export default DataReportDesigner;
