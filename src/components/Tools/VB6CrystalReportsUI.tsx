/**
 * VB6 Crystal Reports UI - Complete Crystal Reports Management Interface
 * Provides report design, preview, parameter management, and export functionality
 * Compatible with VB6 Crystal Reports integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  VB6CrystalReportsInstance,
  CrystalReport,
  CrystalReportType,
  CrystalExportFormat,
  CrystalParameter,
  CrystalDataSource,
  CrystalField,
  CrystalFormula,
  CrystalSection,
  CrystalSectionType,
  CrystalFieldType,
  CrystalDataType,
  CrystalReportViewer
} from '../../services/VB6CrystalReports';

interface VB6CrystalReportsUIProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'reports' | 'designer' | 'viewer' | 'parameters' | 'export';

export const VB6CrystalReportsUI: React.FC<VB6CrystalReportsUIProps> = ({
  visible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [reports, setReports] = useState<CrystalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CrystalReport | null>(null);
  const [viewer, setViewer] = useState<CrystalReportViewer | null>(null);
  
  // Report management states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  
  // Parameter states
  const [parameterValues, setParameterValues] = useState<Map<string, any>>(new Map());
  
  // Export states
  const [exportFormat, setExportFormat] = useState<CrystalExportFormat>(CrystalExportFormat.PDF);
  const [exportFileName, setExportFileName] = useState<string>('');
  
  // Designer states
  const [selectedSection, setSelectedSection] = useState<CrystalSection | null>(null);
  const [selectedField, setSelectedField] = useState<CrystalField | null>(null);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<CrystalFieldType>(CrystalFieldType.DATABASE);
  
  // Formula editor states
  const [selectedFormula, setSelectedFormula] = useState<CrystalFormula | null>(null);
  const [formulaText, setFormulaText] = useState<string>('');
  const [newFormulaName, setNewFormulaName] = useState<string>('');

  useEffect(() => {
    if (visible) {
      refreshReports();
      initializeViewer();
    }
  }, [visible]);

  const refreshReports = () => {
    const allReports = VB6CrystalReportsInstance.getAllReports();
    setReports(allReports);
    if (allReports.length > 0 && !selectedReport) {
      setSelectedReport(allReports[0]);
    }
  };

  const initializeViewer = () => {
    const crystalViewer = VB6CrystalReportsInstance.createViewer();
    crystalViewer.onLoad = (report: CrystalReport) => {
      setStatus(`Report loaded: ${report.name}`);
    };
    crystalViewer.onPrint = (report: CrystalReport) => {
      setStatus(`Printing report: ${report.name}`);
    };
    crystalViewer.onExport = (report: CrystalReport, format: CrystalExportFormat) => {
      setStatus(`Exported report ${report.name} to ${format.toUpperCase()}`);
    };
    setViewer(crystalViewer);
  };

  // Report operations
  const handleOpenReport = async () => {
    const fileName = window.prompt('Enter report file name:', 'Report.rpt');
    if (fileName) {
      try {
        setIsLoading(true);
        setError('');
        const report = await VB6CrystalReportsInstance.openReport(fileName);
        setSelectedReport(report);
        refreshReports();
        setStatus(`Opened report: ${fileName}`);
      } catch (err) {
        setError(`Failed to open report: ${err}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveReport = async () => {
    if (!selectedReport) return;
    
    try {
      setIsLoading(true);
      setError('');
      const success = await VB6CrystalReportsInstance.saveReport(selectedReport);
      if (success) {
        setStatus(`Saved report: ${selectedReport.fileName}`);
      }
    } catch (err) {
      setError(`Failed to save report: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseReport = () => {
    if (selectedReport) {
      VB6CrystalReportsInstance.closeReport(selectedReport);
      setSelectedReport(null);
      refreshReports();
      setStatus('Report closed');
    }
  };

  const handleNewReport = () => {
    const crystalApp = VB6CrystalReportsInstance.createCrystalApplicationObject();
    const newReport = crystalApp.NewReport();
    setSelectedReport(newReport);
    refreshReports();
    setStatus('New report created');
  };

  // Preview and Print operations
  const handlePreviewReport = async () => {
    if (!selectedReport) return;
    
    try {
      setIsLoading(true);
      setError('');
      await VB6CrystalReportsInstance.previewReport(selectedReport);
      if (viewer) {
        viewer.reportSource = selectedReport;
        viewer.currentPageNumber = 1;
        viewer.totalPageCount = Math.ceil(Math.random() * 10) + 1; // Simulate page count
      }
      setActiveTab('viewer');
    } catch (err) {
      setError(`Failed to preview report: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReport = async () => {
    if (!selectedReport) return;
    
    try {
      setIsLoading(true);
      setError('');
      const success = await VB6CrystalReportsInstance.printReport(selectedReport, true);
      if (success) {
        setStatus(`Report printed: ${selectedReport.name}`);
      }
    } catch (err) {
      setError(`Failed to print report: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Export operations
  const handleExportReport = async () => {
    if (!selectedReport) return;
    
    const fileName = exportFileName || `${selectedReport.name}.${exportFormat}`;
    
    try {
      setIsLoading(true);
      setError('');
      const success = await VB6CrystalReportsInstance.exportReport(selectedReport, exportFormat, fileName);
      if (success) {
        setStatus(`Report exported to ${fileName}`);
      }
    } catch (err) {
      setError(`Failed to export report: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Parameter operations
  const handleSetParameters = () => {
    if (!selectedReport) return;
    
    const success = VB6CrystalReportsInstance.setParameters(selectedReport, parameterValues);
    if (success) {
      setStatus('Parameters updated');
    }
  };

  const handleParameterChange = (paramId: string, value: any) => {
    const newValues = new Map(parameterValues);
    newValues.set(paramId, value);
    setParameterValues(newValues);
  };

  // Designer operations
  const handleAddField = () => {
    if (!selectedReport || !selectedSection || !newFieldName) return;
    
    const newField: CrystalField = {
      id: `field-${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      dataType: CrystalDataType.STRING,
      displayString: newFieldName,
      format: {
        fontName: 'Arial',
        fontSize: 9,
        fontStyle: [],
        color: '#000000',
        backgroundColor: 'transparent',
        alignment: 'left'
      }
    };
    
    const success = VB6CrystalReportsInstance.addField(selectedReport, selectedSection.id, newField);
    if (success) {
      setStatus(`Added field: ${newFieldName}`);
      setNewFieldName('');
      refreshReports();
    }
  };

  const handleRemoveField = () => {
    if (!selectedReport || !selectedField) return;
    
    const success = VB6CrystalReportsInstance.removeField(selectedReport, selectedField.id);
    if (success) {
      setStatus(`Removed field: ${selectedField.name}`);
      setSelectedField(null);
      refreshReports();
    }
  };

  // Formula operations
  const handleAddFormula = () => {
    if (!selectedReport || !newFormulaName || !formulaText) return;
    
    const newFormula: CrystalFormula = {
      id: `formula-${Date.now()}`,
      name: newFormulaName,
      text: formulaText,
      syntax: 'crystal',
      dataType: CrystalDataType.STRING,
      fields: [],
      parameters: [],
      functions: []
    };
    
    const success = VB6CrystalReportsInstance.addFormula(selectedReport, newFormula);
    if (success) {
      setStatus(`Added formula: ${newFormulaName}`);
      setNewFormulaName('');
      setFormulaText('');
      refreshReports();
    }
  };

  const handleEditFormula = () => {
    if (!selectedReport || !selectedFormula) return;
    
    const success = VB6CrystalReportsInstance.editFormula(selectedReport, selectedFormula.id, formulaText);
    if (success) {
      setStatus(`Updated formula: ${selectedFormula.name}`);
      refreshReports();
    }
  };

  const handleDeleteFormula = () => {
    if (!selectedReport || !selectedFormula) return;
    
    const success = VB6CrystalReportsInstance.deleteFormula(selectedReport, selectedFormula.id);
    if (success) {
      setStatus(`Deleted formula: ${selectedFormula.name}`);
      setSelectedFormula(null);
      setFormulaText('');
      refreshReports();
    }
  };

  // Data operations
  const handleRefreshData = async () => {
    if (!selectedReport) return;
    
    try {
      setIsLoading(true);
      setError('');
      const success = await VB6CrystalReportsInstance.refreshData(selectedReport);
      if (success) {
        setStatus('Data refreshed');
      }
    } catch (err) {
      setError(`Failed to refresh data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatReportType = (type: CrystalReportType): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSectionType = (type: CrystalSectionType): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFieldType = (type: CrystalFieldType): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '1200px',
        height: '800px',
        backgroundColor: '#F0F0F0',
        border: '2px outset #C0C0C0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt'
      }}>
        {/* Title Bar */}
        <div style={{
          backgroundColor: '#0080FF',
          color: 'white',
          padding: '2px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold'
        }}>
          <span>VB6 Crystal Reports - Report Designer & Viewer</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '12px'
            }}
          >
            ×
          </button>
        </div>

        {/* Menu Bar */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderBottom: '1px solid #C0C0C0',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={handleNewReport}
            disabled={isLoading}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: '#F0F0F0',
              border: '1px outset #C0C0C0',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            New
          </button>
          <button
            onClick={handleOpenReport}
            disabled={isLoading}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: '#F0F0F0',
              border: '1px outset #C0C0C0',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            Open
          </button>
          <button
            onClick={handleSaveReport}
            disabled={isLoading || !selectedReport}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: selectedReport ? '#F0F0F0' : '#E0E0E0',
              border: '1px outset #C0C0C0',
              cursor: (isLoading || !selectedReport) ? 'not-allowed' : 'pointer'
            }}
          >
            Save
          </button>
          <button
            onClick={handleCloseReport}
            disabled={!selectedReport}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: selectedReport ? '#F0F0F0' : '#E0E0E0',
              border: '1px outset #C0C0C0',
              cursor: !selectedReport ? 'not-allowed' : 'pointer'
            }}
          >
            Close
          </button>
          <div style={{ borderLeft: '1px solid #C0C0C0', height: '20px', margin: '0 4px' }} />
          <button
            onClick={handlePreviewReport}
            disabled={isLoading || !selectedReport}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: selectedReport ? '#F0F0F0' : '#E0E0E0',
              border: '1px outset #C0C0C0',
              cursor: (isLoading || !selectedReport) ? 'not-allowed' : 'pointer'
            }}
          >
            Preview
          </button>
          <button
            onClick={handlePrintReport}
            disabled={isLoading || !selectedReport}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: selectedReport ? '#F0F0F0' : '#E0E0E0',
              border: '1px outset #C0C0C0',
              cursor: (isLoading || !selectedReport) ? 'not-allowed' : 'pointer'
            }}
          >
            Print
          </button>
          <button
            onClick={handleRefreshData}
            disabled={isLoading || !selectedReport}
            style={{
              padding: '2px 8px',
              fontSize: '8pt',
              backgroundColor: selectedReport ? '#F0F0F0' : '#E0E0E0',
              border: '1px outset #C0C0C0',
              cursor: (isLoading || !selectedReport) ? 'not-allowed' : 'pointer'
            }}
          >
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderBottom: '1px solid #C0C0C0',
          display: 'flex',
          gap: '0px'
        }}>
          {[
            { id: 'reports', label: 'Reports' },
            { id: 'designer', label: 'Designer' },
            { id: 'viewer', label: 'Viewer' },
            { id: 'parameters', label: 'Parameters' },
            { id: 'export', label: 'Export' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '4px 12px',
                fontSize: '8pt',
                backgroundColor: activeTab === tab.id ? '#FFFFFF' : '#E0E0E0',
                border: '1px outset #C0C0C0',
                borderBottom: activeTab === tab.id ? '1px solid #FFFFFF' : '1px solid #C0C0C0',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <>
              {/* Report List */}
              <div style={{
                width: '300px',
                backgroundColor: '#FFFFFF',
                border: '1px inset #C0C0C0',
                overflow: 'auto'
              }}>
                <div style={{ fontWeight: 'bold', backgroundColor: '#C0C0C0', padding: '4px', borderBottom: '1px solid #808080' }}>
                  Reports ({reports.length})
                </div>
                
                {reports.map(report => (
                  <div
                    key={report.id}
                    style={{
                      padding: '6px',
                      borderBottom: '1px solid #E0E0E0',
                      cursor: 'pointer',
                      backgroundColor: selectedReport?.id === report.id ? '#E0E0FF' : 'transparent'
                    }}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>{report.name}</div>
                    <div style={{ fontSize: '7pt', color: '#666' }}>
                      {formatReportType(report.type)} • v{report.version}
                    </div>
                    <div style={{ fontSize: '7pt', color: '#888' }}>
                      File: {report.fileName}
                    </div>
                    <div style={{ fontSize: '7pt', color: '#888' }}>
                      Fields: {report.fields.length} • Formulas: {report.formulas.length}
                    </div>
                  </div>
                ))}
              </div>

              {/* Report Details */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '8px', overflow: 'auto' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  Report Details
                </div>
                
                {selectedReport ? (
                  <div style={{ fontSize: '8pt' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '4px' }}>{selectedReport.name}</div>
                      <div>File: {selectedReport.fileName}</div>
                      <div>Type: {formatReportType(selectedReport.type)}</div>
                      <div>Version: {selectedReport.version}</div>
                      <div>Created: {selectedReport.created.toLocaleString()}</div>
                      <div>Modified: {selectedReport.modified.toLocaleString()}</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Page Setup:</div>
                      <div>Paper: {selectedReport.pageSetup.paperSize} ({selectedReport.pageSetup.orientation})</div>
                      <div>Size: {selectedReport.pageSetup.width}" × {selectedReport.pageSetup.height}"</div>
                      <div>Margins: T:{selectedReport.pageSetup.topMargin}" B:{selectedReport.pageSetup.bottomMargin}" L:{selectedReport.pageSetup.leftMargin}" R:{selectedReport.pageSetup.rightMargin}"</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Sections ({selectedReport.sections.length}):</div>
                      {selectedReport.sections.map(section => (
                        <div key={section.id} style={{ marginLeft: '8px', fontSize: '7pt' }}>
                          • {formatSectionType(section.type)} ({section.objects.length} objects)
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Fields ({selectedReport.fields.length}):</div>
                      {selectedReport.fields.slice(0, 10).map(field => (
                        <div key={field.id} style={{ marginLeft: '8px', fontSize: '7pt' }}>
                          • {field.name} ({formatFieldType(field.type)})
                        </div>
                      ))}
                      {selectedReport.fields.length > 10 && (
                        <div style={{ marginLeft: '8px', fontSize: '7pt', fontStyle: 'italic' }}>
                          ... and {selectedReport.fields.length - 10} more
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Formulas ({selectedReport.formulas.length}):</div>
                      {selectedReport.formulas.map(formula => (
                        <div key={formula.id} style={{ marginLeft: '8px', fontSize: '7pt' }}>
                          • {formula.name} ({formula.syntax})
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Parameters ({selectedReport.parameters.length}):</div>
                      {selectedReport.parameters.map(param => (
                        <div key={param.id} style={{ marginLeft: '8px', fontSize: '7pt' }}>
                          • {param.name}: {param.promptText}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Data Sources ({selectedReport.dataSources.length}):</div>
                      {selectedReport.dataSources.map(ds => (
                        <div key={ds.id} style={{ marginLeft: '8px', fontSize: '7pt' }}>
                          • {ds.name} ({ds.type}) - {ds.tables.length} tables
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#666', fontSize: '7pt', marginTop: '20px' }}>
                    Select a report to view details
                  </div>
                )}
              </div>
            </>
          )}

          {/* Designer Tab */}
          {activeTab === 'designer' && (
            <>
              {/* Designer Toolbox */}
              <div style={{
                width: '200px',
                backgroundColor: '#FFFFFF',
                border: '1px inset #C0C0C0',
                padding: '8px',
                overflow: 'auto'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  Report Designer
                </div>
                
                {selectedReport ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>Sections:</div>
                      {selectedReport.sections.map(section => (
                        <div
                          key={section.id}
                          style={{
                            padding: '2px 4px',
                            fontSize: '7pt',
                            cursor: 'pointer',
                            backgroundColor: selectedSection?.id === section.id ? '#E0E0FF' : 'transparent',
                            border: '1px solid transparent'
                          }}
                          onClick={() => setSelectedSection(section)}
                        >
                          {formatSectionType(section.type)}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>Add Field:</div>
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="Field name"
                        style={{ width: '100%', marginBottom: '4px', padding: '2px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                      />
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as CrystalFieldType)}
                        style={{ width: '100%', marginBottom: '4px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                      >
                        {Object.values(CrystalFieldType).map(type => (
                          <option key={type} value={type}>{formatFieldType(type)}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddField}
                        disabled={!selectedSection || !newFieldName}
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '7pt',
                          backgroundColor: '#E0E0E0',
                          border: '1px outset #C0C0C0',
                          cursor: (!selectedSection || !newFieldName) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Add Field
                      </button>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>Fields:</div>
                      {selectedReport.fields.map(field => (
                        <div
                          key={field.id}
                          style={{
                            padding: '2px 4px',
                            fontSize: '7pt',
                            cursor: 'pointer',
                            backgroundColor: selectedField?.id === field.id ? '#E0E0FF' : 'transparent',
                            border: '1px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => setSelectedField(field)}
                        >
                          <span>{field.name}</span>
                          {selectedField?.id === field.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveField();
                              }}
                              style={{
                                padding: '1px 3px',
                                fontSize: '6pt',
                                backgroundColor: '#FFE0E0',
                                border: '1px outset #C0C0C0',
                                cursor: 'pointer'
                              }}
                            >
                              Del
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#666', fontSize: '7pt' }}>
                    Select a report to design
                  </div>
                )}
              </div>

              {/* Designer Canvas */}
              <div style={{ flex: 1, backgroundColor: '#F8F8F8', border: '1px inset #C0C0C0', position: 'relative' }}>
                <div style={{ fontWeight: 'bold', backgroundColor: '#C0C0C0', padding: '4px', borderBottom: '1px solid #808080' }}>
                  Report Canvas
                </div>
                
                {selectedReport ? (
                  <div style={{ padding: '16px', height: 'calc(100% - 30px)', overflow: 'auto' }}>
                    {selectedReport.sections.map((section, index) => (
                      <div
                        key={section.id}
                        style={{
                          marginBottom: '8px',
                          border: selectedSection?.id === section.id ? '2px solid #0080FF' : '1px solid #C0C0C0',
                          backgroundColor: '#FFFFFF',
                          minHeight: `${section.height * 100}px`
                        }}
                        onClick={() => setSelectedSection(section)}
                      >
                        <div style={{
                          backgroundColor: '#E0E0E0',
                          padding: '2px 4px',
                          fontSize: '7pt',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #C0C0C0'
                        }}>
                          {formatSectionType(section.type)}
                        </div>
                        <div style={{ position: 'relative', padding: '4px', minHeight: `${section.height * 100 - 20}px` }}>
                          {section.objects.map(obj => (
                            <div
                              key={obj.id}
                              style={{
                                position: 'absolute',
                                left: `${obj.left * 72}px`, // Convert inches to pixels (72 DPI)
                                top: `${obj.top * 72}px`,
                                width: `${obj.width * 72}px`,
                                height: `${obj.height * 72}px`,
                                border: '1px dashed #888',
                                backgroundColor: 'rgba(0,128,255,0.1)',
                                fontSize: '7pt',
                                padding: '2px',
                                overflow: 'hidden'
                              }}
                            >
                              {obj.type === 'text' ? obj.text : 
                               obj.type === 'field' ? `{${obj.fieldName}}` : obj.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '10pt' }}>
                    Select a report to design
                  </div>
                )}
              </div>

              {/* Formula Editor */}
              <div style={{
                width: '250px',
                backgroundColor: '#FFFFFF',
                border: '1px inset #C0C0C0',
                padding: '8px',
                overflow: 'auto'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', backgroundColor: '#C0C0C0', padding: '2px' }}>
                  Formula Editor
                </div>
                
                {selectedReport ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>Add Formula:</div>
                      <input
                        type="text"
                        value={newFormulaName}
                        onChange={(e) => setNewFormulaName(e.target.value)}
                        placeholder="Formula name"
                        style={{ width: '100%', marginBottom: '4px', padding: '2px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                      />
                      <textarea
                        value={formulaText}
                        onChange={(e) => setFormulaText(e.target.value)}
                        placeholder="Formula text"
                        style={{ width: '100%', height: '60px', marginBottom: '4px', padding: '2px', border: '1px inset #C0C0C0', fontSize: '8pt', resize: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          onClick={handleAddFormula}
                          disabled={!newFormulaName || !formulaText}
                          style={{
                            flex: 1,
                            padding: '4px',
                            fontSize: '7pt',
                            backgroundColor: '#E0E0E0',
                            border: '1px outset #C0C0C0',
                            cursor: (!newFormulaName || !formulaText) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={handleEditFormula}
                          disabled={!selectedFormula || !formulaText}
                          style={{
                            flex: 1,
                            padding: '4px',
                            fontSize: '7pt',
                            backgroundColor: '#E0E0E0',
                            border: '1px outset #C0C0C0',
                            cursor: (!selectedFormula || !formulaText) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>Formulas:</div>
                      {selectedReport.formulas.map(formula => (
                        <div
                          key={formula.id}
                          style={{
                            padding: '2px 4px',
                            fontSize: '7pt',
                            cursor: 'pointer',
                            backgroundColor: selectedFormula?.id === formula.id ? '#E0E0FF' : 'transparent',
                            border: '1px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => {
                            setSelectedFormula(formula);
                            setFormulaText(formula.text);
                          }}
                        >
                          <span>{formula.name}</span>
                          {selectedFormula?.id === formula.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFormula();
                              }}
                              style={{
                                padding: '1px 3px',
                                fontSize: '6pt',
                                backgroundColor: '#FFE0E0',
                                border: '1px outset #C0C0C0',
                                cursor: 'pointer'
                              }}
                            >
                              Del
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#666', fontSize: '7pt' }}>
                    Select a report to edit formulas
                  </div>
                )}
              </div>
            </>
          )}

          {/* Viewer Tab */}
          {activeTab === 'viewer' && (
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', display: 'flex', flexDirection: 'column' }}>
              {/* Viewer Toolbar */}
              {viewer && viewer.displayToolbar && (
                <div style={{ backgroundColor: '#E0E0E0', padding: '4px', borderBottom: '1px solid #C0C0C0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => viewer.currentPageNumber = Math.max(1, viewer.currentPageNumber - 1)}
                    disabled={viewer.currentPageNumber <= 1}
                    style={{ padding: '2px 6px', fontSize: '8pt', backgroundColor: '#F0F0F0', border: '1px outset #C0C0C0' }}
                  >
                    ◀
                  </button>
                  <span style={{ fontSize: '8pt' }}>
                    Page {viewer.currentPageNumber} of {viewer.totalPageCount}
                  </span>
                  <button
                    onClick={() => viewer.currentPageNumber = Math.min(viewer.totalPageCount, viewer.currentPageNumber + 1)}
                    disabled={viewer.currentPageNumber >= viewer.totalPageCount}
                    style={{ padding: '2px 6px', fontSize: '8pt', backgroundColor: '#F0F0F0', border: '1px outset #C0C0C0' }}
                  >
                    ▶
                  </button>
                  <div style={{ borderLeft: '1px solid #C0C0C0', height: '20px', margin: '0 4px' }} />
                  <select
                    value={viewer.zoomLevel}
                    onChange={(e) => viewer.zoomLevel = parseInt(e.target.value)}
                    style={{ fontSize: '8pt', border: '1px inset #C0C0C0' }}
                  >
                    <option value={25}>25%</option>
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={100}>100%</option>
                    <option value={125}>125%</option>
                    <option value={150}>150%</option>
                    <option value={200}>200%</option>
                  </select>
                </div>
              )}

              {/* Report Preview */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px', backgroundColor: '#F0F0F0', display: 'flex', justifyContent: 'center' }}>
                {viewer && viewer.reportSource ? (
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #000000',
                    width: `${8.5 * (viewer.zoomLevel / 100) * 72}px`,
                    minHeight: `${11 * (viewer.zoomLevel / 100) * 72}px`,
                    padding: '16px',
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', marginBottom: '20px' }}>
                      {viewer.reportSource.name}
                    </div>
                    <div style={{ fontSize: '10pt', marginBottom: '16px' }}>
                      This is a preview of the Crystal Report. In a full implementation, 
                      this would show the actual rendered report with data.
                    </div>
                    <div style={{ fontSize: '8pt', color: '#666' }}>
                      Report: {viewer.reportSource.fileName}<br/>
                      Type: {formatReportType(viewer.reportSource.type)}<br/>
                      Sections: {viewer.reportSource.sections.length}<br/>
                      Fields: {viewer.reportSource.fields.length}<br/>
                      Formulas: {viewer.reportSource.formulas.length}<br/>
                      Parameters: {viewer.reportSource.parameters.length}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '10pt' }}>
                    No report loaded. Preview a report to view it here.
                  </div>
                )}
              </div>

              {/* Status Bar */}
              {viewer && viewer.displayStatusbar && (
                <div style={{ backgroundColor: '#E0E0E0', padding: '2px 4px', borderTop: '1px solid #C0C0C0', fontSize: '8pt', color: '#000080' }}>
                  {viewer.reportSource ? `Report: ${viewer.reportSource.name} - Ready` : 'No report loaded'}
                </div>
              )}
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '16px', overflow: 'auto' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '10pt' }}>
                Report Parameters
              </div>
              
              {selectedReport && selectedReport.parameters.length > 0 ? (
                <>
                  {selectedReport.parameters.map(param => (
                    <div key={param.id} style={{ marginBottom: '16px', padding: '8px', border: '1px solid #E0E0E0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{param.name}</div>
                      <div style={{ fontSize: '8pt', color: '#666', marginBottom: '8px' }}>{param.promptText}</div>
                      
                      {param.dataType === 'string' && (
                        <input
                          type="text"
                          value={parameterValues.get(param.name) || param.defaultValue || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          style={{ width: '300px', padding: '4px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                        />
                      )}
                      
                      {param.dataType === 'number' && (
                        <input
                          type="number"
                          value={parameterValues.get(param.name) || param.defaultValue || 0}
                          onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                          style={{ width: '150px', padding: '4px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                        />
                      )}
                      
                      {param.dataType === 'date' && (
                        <input
                          type="date"
                          value={parameterValues.get(param.name) || (param.defaultValue ? param.defaultValue.toISOString().split('T')[0] : '')}
                          onChange={(e) => handleParameterChange(param.name, new Date(e.target.value))}
                          style={{ width: '150px', padding: '4px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                        />
                      )}
                      
                      {param.dataType === 'boolean' && (
                        <input
                          type="checkbox"
                          checked={parameterValues.get(param.name) || param.defaultValue || false}
                          onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                          style={{ margin: '4px' }}
                        />
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={handleSetParameters}
                    style={{
                      padding: '6px 12px',
                      fontSize: '8pt',
                      backgroundColor: '#E0E0E0',
                      border: '1px outset #C0C0C0',
                      cursor: 'pointer'
                    }}
                  >
                    Apply Parameters
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '8pt' }}>
                  {selectedReport ? 'This report has no parameters' : 'Select a report to view parameters'}
                </div>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px inset #C0C0C0', padding: '16px', overflow: 'auto' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '10pt' }}>
                Export Report
              </div>
              
              {selectedReport ? (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>
                      Export Format:
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as CrystalExportFormat)}
                      style={{ width: '200px', padding: '4px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                    >
                      {Object.values(CrystalExportFormat).map(format => (
                        <option key={format} value={format}>{format.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '8pt' }}>
                      File Name:
                    </label>
                    <input
                      type="text"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      placeholder={`${selectedReport.name}.${exportFormat}`}
                      style={{ width: '400px', padding: '4px', border: '1px inset #C0C0C0', fontSize: '8pt' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '8pt' }}>Export Options:</div>
                    <div style={{ marginLeft: '16px' }}>
                      <label style={{ display: 'block', fontSize: '8pt', marginBottom: '4px' }}>
                        <input type="checkbox" defaultChecked={selectedReport.options.exportWithFormatting} />
                        {' '}Export with formatting
                      </label>
                      <label style={{ display: 'block', fontSize: '8pt', marginBottom: '4px' }}>
                        <input type="checkbox" defaultChecked />
                        {' '}Include page headers and footers
                      </label>
                      <label style={{ display: 'block', fontSize: '8pt', marginBottom: '4px' }}>
                        <input type="checkbox" defaultChecked />
                        {' '}Export all pages
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleExportReport}
                    disabled={isLoading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '8pt',
                      backgroundColor: '#E0E0E0',
                      border: '1px outset #C0C0C0',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Exporting...' : 'Export Report'}
                  </button>

                  <div style={{ marginTop: '24px', padding: '8px', backgroundColor: '#F0F0F0', border: '1px inset #C0C0C0' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '8pt' }}>Report Information:</div>
                    <div style={{ fontSize: '8pt' }}>
                      Name: {selectedReport.name}<br/>
                      Type: {formatReportType(selectedReport.type)}<br/>
                      Sections: {selectedReport.sections.length}<br/>
                      Fields: {selectedReport.fields.length}<br/>
                      Data Sources: {selectedReport.dataSources.length}<br/>
                      Page Size: {selectedReport.pageSetup.width}" × {selectedReport.pageSetup.height}" ({selectedReport.pageSetup.orientation})
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '8pt' }}>
                  Select a report to export
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div style={{
          backgroundColor: '#E0E0E0',
          padding: '2px 4px',
          borderTop: '1px solid #C0C0C0',
          fontSize: '8pt',
          color: error ? '#FF0000' : '#000080',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            {error || status || 'Ready'}
          </div>
          <div>
            Reports: {reports.length} | Selected: {selectedReport?.name || 'None'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VB6CrystalReportsUI;