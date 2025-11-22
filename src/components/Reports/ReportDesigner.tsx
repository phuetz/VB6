import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  X, Save, Play, Eye, Grid, ZoomIn, ZoomOut, Undo, Redo, 
  Copy, Clipboard, Trash2, Settings, Database, FileText, 
  Type, Hash, Calendar, Image, BarChart, Minus, Square,
  Plus, Move, MousePointer, Layers, Ruler
} from 'lucide-react';
import { 
  vb6ReportEngine, 
  ReportDefinition, 
  ReportSection, 
  ReportField, 
  ReportFieldType, 
  ReportSectionType, 
  TextAlignment, 
  BorderStyle 
} from '../../services/VB6ReportEngine';

interface ReportDesignerProps {
  visible: boolean;
  onClose: () => void;
  reportId?: string;
  onSave?: (report: ReportDefinition) => void;
}

interface DesignerState {
  selectedTool: string;
  selectedElements: string[];
  clipboard: ReportField[];
  undoStack: ReportDefinition[];
  redoStack: ReportDefinition[];
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

const FIELD_TOOLS = [
  { id: 'select', icon: MousePointer, label: 'Select', type: null },
  { id: 'text', icon: Type, label: 'Text Field', type: ReportFieldType.Text },
  { id: 'number', icon: Hash, label: 'Number Field', type: ReportFieldType.Number },
  { id: 'date', icon: Calendar, label: 'Date Field', type: ReportFieldType.Date },
  { id: 'formula', icon: FileText, label: 'Formula Field', type: ReportFieldType.Formula },
  { id: 'image', icon: Image, label: 'Image Field', type: ReportFieldType.Image },
  { id: 'barcode', icon: BarChart, label: 'Barcode Field', type: ReportFieldType.Barcode },
  { id: 'line', icon: Minus, label: 'Line', type: ReportFieldType.Line },
  { id: 'box', icon: Square, label: 'Box', type: ReportFieldType.Box }
];

export const ReportDesigner: React.FC<ReportDesignerProps> = ({
  visible,
  onClose,
  reportId,
  onSave
}) => {
  const [report, setReport] = useState<ReportDefinition | null>(null);
  const [designerState, setDesignerState] = useState<DesignerState>({
    selectedTool: 'select',
    selectedElements: [],
    clipboard: [],
    undoStack: [],
    redoStack: [],
    zoom: 100,
    showGrid: true,
    snapToGrid: true,
    gridSize: 10,
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });
  const [activeSection, setActiveSection] = useState<string>('details');
  const [showPreview, setShowPreview] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [selectedField, setSelectedField] = useState<ReportField | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Initialize report
  useEffect(() => {
    if (visible) {
      if (reportId) {
        const existingReport = vb6ReportEngine.getReport(reportId);
        if (existingReport) {
          setReport(existingReport);
        }
      } else {
        // Create new report
        const newReport = vb6ReportEngine.createReport('New Report', 'Untitled Report');
        setReport(newReport);
      }
    }
  }, [visible, reportId]);

  // Add field to section
  const addField = useCallback((sectionId: string, x: number, y: number, type: ReportFieldType) => {
    if (!report) return;

    const section = report.sections.find(s => s.id === sectionId);
    if (!section) return;

    const field = vb6ReportEngine.createField(type, x, y);
    section.fields.push(field);

    // Save to undo stack
    const newReport = { ...report };
    setDesignerState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack, report],
      redoStack: []
    }));

    setReport(newReport);
    setSelectedField(field);
    setDesignerState(prev => ({ ...prev, selectedElements: [field.id] }));
  }, [report]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent, sectionId: string) => {
    if (!report || designerState.selectedTool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (designerState.zoom / 100);
    const y = (e.clientY - rect.top) / (designerState.zoom / 100);

    // Snap to grid if enabled
    const snappedX = designerState.snapToGrid 
      ? Math.round(x / designerState.gridSize) * designerState.gridSize 
      : x;
    const snappedY = designerState.snapToGrid 
      ? Math.round(y / designerState.gridSize) * designerState.gridSize 
      : y;

    const tool = FIELD_TOOLS.find(t => t.id === designerState.selectedTool);
    if (tool?.type) {
      addField(sectionId, snappedX, snappedY, tool.type);
    }
  }, [report, designerState, addField]);

  // Select field
  const selectField = useCallback((field: ReportField) => {
    setSelectedField(field);
    setDesignerState(prev => ({ ...prev, selectedElements: [field.id] }));
  }, []);

  // Update field property
  const updateField = useCallback((fieldId: string, updates: Partial<ReportField>) => {
    if (!report) return;

    const newReport = { ...report };
    let fieldFound = false;

    newReport.sections.forEach(section => {
      const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex >= 0) {
        section.fields[fieldIndex] = { ...section.fields[fieldIndex], ...updates };
        fieldFound = true;
      }
    });

    if (fieldFound) {
      setReport(newReport);
      if (selectedField?.id === fieldId) {
        setSelectedField({ ...selectedField, ...updates });
      }
    }
  }, [report, selectedField]);

  // Delete selected field
  const deleteSelectedField = useCallback(() => {
    if (!report || !selectedField) return;

    const newReport = { ...report };
    newReport.sections.forEach(section => {
      section.fields = section.fields.filter(f => f.id !== selectedField.id);
    });

    setReport(newReport);
    setSelectedField(null);
    setDesignerState(prev => ({ ...prev, selectedElements: [] }));
  }, [report, selectedField]);

  // Copy field
  const copyField = useCallback(() => {
    if (selectedField) {
      setDesignerState(prev => ({ ...prev, clipboard: [selectedField] }));
    }
  }, [selectedField]);

  // Paste field
  const pasteField = useCallback(() => {
    if (!report || designerState.clipboard.length === 0) return;

    const section = report.sections.find(s => s.id === activeSection);
    if (!section) return;

    const fieldToCopy = designerState.clipboard[0];
    const newField = {
      ...fieldToCopy,
      id: `field_${Date.now()}_${Math.random()}`,
      x: fieldToCopy.x + 10,
      y: fieldToCopy.y + 10
    };

    section.fields.push(newField);
    setReport({ ...report });
    setSelectedField(newField);
  }, [report, designerState.clipboard, activeSection]);

  // Save report
  const saveReport = useCallback(() => {
    if (report) {
      vb6ReportEngine.saveReport(report);
      onSave?.(report);
    }
  }, [report, onSave]);

  // Preview report
  const previewReport = useCallback(async () => {
    if (!report) return;
    setShowPreview(true);
  }, [report]);

  // Zoom functions
  const zoomIn = () => setDesignerState(prev => ({ 
    ...prev, 
    zoom: Math.min(prev.zoom + 25, 400) 
  }));
  
  const zoomOut = () => setDesignerState(prev => ({ 
    ...prev, 
    zoom: Math.max(prev.zoom - 25, 25) 
  }));

  // Render section
  const renderSection = (section: ReportSection) => (
    <div
      key={section.id}
      className={`relative border-b border-gray-300 ${
        activeSection === section.id ? 'bg-blue-50' : 'bg-white'
      }`}
      style={{ 
        height: `${section.height * (designerState.zoom / 100)}px`,
        backgroundColor: section.backgroundColor !== 'transparent' ? section.backgroundColor : undefined
      }}
      onClick={(e) => handleCanvasClick(e, section.id)}
    >
      {/* Section Header */}
      <div 
        className="absolute -left-32 top-0 w-32 h-full bg-gray-100 border-r border-gray-300 flex items-center justify-center cursor-pointer"
        onClick={() => setActiveSection(section.id)}
      >
        <span className="text-xs font-medium text-gray-700 transform -rotate-90">
          {section.name}
        </span>
      </div>

      {/* Grid */}
      {designerState.showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e5e5 1px, transparent 1px),
              linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
            `,
            backgroundSize: `${designerState.gridSize * (designerState.zoom / 100)}px ${designerState.gridSize * (designerState.zoom / 100)}px`
          }}
        />
      )}

      {/* Fields */}
      {section.fields.map(field => (
        <div
          key={field.id}
          className={`absolute border cursor-pointer ${
            selectedField?.id === field.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-400 hover:border-gray-600'
          }`}
          style={{
            left: `${field.x * (designerState.zoom / 100)}px`,
            top: `${field.y * (designerState.zoom / 100)}px`,
            width: `${field.width * (designerState.zoom / 100)}px`,
            height: `${field.height * (designerState.zoom / 100)}px`,
            fontSize: `${field.formatting.fontSize * (designerState.zoom / 100)}px`,
            fontFamily: field.formatting.fontFamily,
            fontWeight: field.formatting.fontWeight,
            fontStyle: field.formatting.fontStyle,
            textDecoration: field.formatting.textDecoration,
            color: field.formatting.color,
            backgroundColor: field.formatting.backgroundColor !== 'transparent' 
              ? field.formatting.backgroundColor 
              : undefined,
            textAlign: field.formatting.alignment,
            borderStyle: field.formatting.borderStyle,
            borderColor: field.formatting.borderColor,
            borderWidth: field.formatting.borderWidth,
            padding: field.formatting.padding
          }}
          onClick={(e) => {
            e.stopPropagation();
            selectField(field);
          }}
        >
          <div className="truncate">
            {field.type === ReportFieldType.Text && (field.value || 'Text Field')}
            {field.type === ReportFieldType.Number && (field.value || '0')}
            {field.type === ReportFieldType.Date && (field.value || new Date().toLocaleDateString())}
            {field.type === ReportFieldType.Formula && (field.formula || '{Formula}')}
            {field.type === ReportFieldType.Image && '[Image]'}
            {field.type === ReportFieldType.Barcode && '[Barcode]'}
            {field.type === ReportFieldType.Line && '—'}
            {field.type === ReportFieldType.Box && '□'}
          </div>

          {/* Selection handles */}
          {selectedField?.id === field.id && (
            <>
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
              <div className="absolute -top-1 right-0 w-2 h-2 bg-blue-500 border border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white"></div>
            </>
          )}
        </div>
      ))}
    </div>
  );

  // Render properties panel
  const renderPropertiesPanel = () => (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Properties</h3>
      
      {selectedField ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={selectedField.name}
              onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
            <input
              type="text"
              value={String(selectedField.value || '')}
              onChange={(e) => updateField(selectedField.id, { value: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
              <input
                type="number"
                value={selectedField.x}
                onChange={(e) => updateField(selectedField.id, { x: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
              <input
                type="number"
                value={selectedField.y}
                onChange={(e) => updateField(selectedField.id, { y: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
              <input
                type="number"
                value={selectedField.width}
                onChange={(e) => updateField(selectedField.id, { width: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                value={selectedField.height}
                onChange={(e) => updateField(selectedField.id, { height: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
            <select
              value={selectedField.formatting.fontFamily}
              onChange={(e) => updateField(selectedField.id, { 
                formatting: { ...selectedField.formatting, fontFamily: e.target.value }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
            <input
              type="number"
              value={selectedField.formatting.fontSize}
              onChange={(e) => updateField(selectedField.id, { 
                formatting: { ...selectedField.formatting, fontSize: Number(e.target.value) }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
            <input
              type="color"
              value={selectedField.formatting.color}
              onChange={(e) => updateField(selectedField.id, { 
                formatting: { ...selectedField.formatting, color: e.target.value }
              })}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
            <select
              value={selectedField.formatting.alignment}
              onChange={(e) => updateField(selectedField.id, { 
                formatting: { ...selectedField.formatting, alignment: e.target.value as TextAlignment }
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value={TextAlignment.Left}>Left</option>
              <option value={TextAlignment.Center}>Center</option>
              <option value={TextAlignment.Right}>Right</option>
              <option value={TextAlignment.Justify}>Justify</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedField.formatting.fontWeight === 'bold'}
              onChange={(e) => updateField(selectedField.id, { 
                formatting: { 
                  ...selectedField.formatting, 
                  fontWeight: e.target.checked ? 'bold' : 'normal' 
                }
              })}
              className="rounded"
            />
            <label className="text-xs text-gray-700">Bold</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedField.formatting.fontStyle === 'italic'}
              onChange={(e) => updateField(selectedField.id, { 
                formatting: { 
                  ...selectedField.formatting, 
                  fontStyle: e.target.checked ? 'italic' : 'normal' 
                }
              })}
              className="rounded"
            />
            <label className="text-xs text-gray-700">Italic</label>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Select a field to edit properties
        </div>
      )}
    </div>
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[1200px] h-[800px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-purple-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Report Designer - {report?.title || 'New Report'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveReport}
              className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={previewReport}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              <Eye size={14} />
              Preview
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Toolbox */}
          <div className="w-16 bg-gray-50 border-r border-gray-200 p-2">
            <div className="space-y-2">
              {FIELD_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setDesignerState(prev => ({ ...prev, selectedTool: tool.id }))}
                    className={`w-12 h-12 flex items-center justify-center rounded border ${
                      designerState.selectedTool === tool.id
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                    title={tool.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
              <button
                onClick={zoomOut}
                className="p-1 hover:bg-gray-200 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {designerState.zoom}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1 hover:bg-gray-200 rounded"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              <button
                onClick={() => setDesignerState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                className={`p-1 rounded ${designerState.showGrid ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
                title="Toggle Grid"
              >
                <Grid size={16} />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <button
                onClick={copyField}
                disabled={!selectedField}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                title="Copy (Ctrl+C)"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={pasteField}
                disabled={designerState.clipboard.length === 0}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                title="Paste (Ctrl+V)"
              >
                <Clipboard size={16} />
              </button>
              <button
                onClick={deleteSelectedField}
                disabled={!selectedField}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 text-red-600"
                title="Delete (Del)"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex-1" />

              <span className="text-xs text-gray-500">
                Tool: {FIELD_TOOLS.find(t => t.id === designerState.selectedTool)?.label}
              </span>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <div className="bg-white shadow-lg mx-auto" style={{ width: '794px' }}>
                {/* Ruler */}
                <div className="h-6 bg-gray-200 border-b border-gray-300 flex items-center relative">
                  <div className="absolute left-32 right-0 h-full">
                    {/* Horizontal ruler marks */}
                    {Array.from({ length: Math.floor(594 / 10) }, (_, i) => (
                      <div
                        key={i}
                        className="absolute border-l border-gray-400"
                        style={{ 
                          left: `${i * 10 * (designerState.zoom / 100)}px`,
                          height: i % 5 === 0 ? '100%' : '50%',
                          borderColor: i % 10 === 0 ? '#666' : '#999'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Report Sections */}
                <div className="relative" style={{ marginLeft: '128px' }}>
                  {report?.sections.map(renderSection)}
                </div>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {showProperties && renderPropertiesPanel()}
        </div>
      </div>
    </div>
  );
};

export default ReportDesigner;