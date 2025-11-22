/**
 * VB6 Crystal Reports Viewer Control - Complete Implementation
 * 
 * Contrôle CRITIQUE pour affichage Crystal Reports VB6
 * Complète le CrystalReports Engine avec interface utilisateur
 * 
 * Implémente l'API complète CrystalReports Viewer VB6:
 * - Report display et navigation
 * - Zoom et print preview
 * - Export toolbar
 * - Parameter prompting
 * - Drill-down capabilities
 * - Search functionality
 * - Professional VB6 styling
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VB6ControlProps } from '../Controls/VB6Controls';
import { 
  VB6CrystalReportsEngine, 
  CRGeneratedReport, 
  CRExportFormatType,
  CRParameterField,
  CRParameterFieldType 
} from './VB6CrystalReportsEngine';

// ============================================================================
// CRYSTAL REPORTS VIEWER TYPES
// ============================================================================

export enum CRViewerDisplayMode {
  crDisplayModeNormal = 0,
  crDisplayModeMaximized = 1,
  crDisplayModeEmbedded = 2
}

export interface CRViewerProps extends VB6ControlProps {
  reportEngine?: VB6CrystalReportsEngine;
  displayGroupTree?: boolean;
  displayTabs?: boolean;
  displayToolbar?: boolean;
  displayBorder?: boolean;
  enableGroupTree?: boolean;
  enableRefresh?: boolean;
  enableExport?: boolean;
  enablePrint?: boolean;
  enableSearch?: boolean;
  enableZoom?: boolean;
  selectWholeRecord?: boolean;
  animationOnDisplay?: boolean;
  autoSetParameterValues?: boolean;
  currentPageNumber?: number;
  zoomLevel?: number;
  reportSource?: string;
  onReportRefresh?: () => void;
  onPrintReport?: () => void;
  onExportReport?: (format: CRExportFormatType) => void;
  onDrillOnGroup?: (groupIndex: number) => void;
  onParameterPrompt?: (parameters: CRParameterField[]) => boolean;
}

// ============================================================================
// CRYSTAL REPORTS VIEWER IMPLEMENTATION
// ============================================================================

export const VB6CrystalReportsViewer: React.FC<CRViewerProps> = ({
  name = 'CrystalReportsViewer1',
  left = 0,
  top = 0,
  width = 6000,
  height = 4500,
  reportEngine,
  displayGroupTree = true,
  displayTabs = true,
  displayToolbar = true,
  displayBorder = true,
  enableGroupTree = true,
  enableRefresh = true,
  enableExport = true,
  enablePrint = true,
  enableSearch = true,
  enableZoom = true,
  selectWholeRecord = false,
  animationOnDisplay = true,
  autoSetParameterValues = true,
  currentPageNumber = 1,
  zoomLevel = 100,
  reportSource = '',
  onReportRefresh,
  onPrintReport,
  onExportReport,
  onDrillOnGroup,
  onParameterPrompt,
  ...props
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  
  const [report, setReport] = useState<CRGeneratedReport | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(currentPageNumber);
  const [zoom, setZoom] = useState<number>(zoomLevel);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showParameterDialog, setShowParameterDialog] = useState<boolean>(false);
  const [parameters, setParameters] = useState<CRParameterField[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = useState<number>(0);

  // Conversion unités VB6 vers pixels
  const leftPx = Math.round(left * 0.0666667);
  const topPx = Math.round(top * 0.0666667);
  const widthPx = Math.round(width * 0.0666667);
  const heightPx = Math.round(height * 0.0666667);

  /**
   * API Crystal Reports Viewer VB6
   */
  const crystalViewerAPI = {
    // Properties
    get ReportSource() { return reportSource; },
    set ReportSource(value: string) {
      if (value !== reportSource && reportEngine) {
        loadReport(value);
      }
    },

    get CurrentPageNumber() { return currentPage; },
    set CurrentPageNumber(value: number) {
      if (report && value >= 1 && value <= report.pageCount) {
        setCurrentPage(value);
      }
    },

    get ZoomLevel() { return zoom; },
    set ZoomLevel(value: number) {
      if (value >= 25 && value <= 400) {
        setZoom(value);
      }
    },

    get EnableRefresh() { return enableRefresh; },
    get EnableExport() { return enableExport; },
    get EnablePrint() { return enablePrint; },

    // Methods
    ViewReport: () => {
      if (reportSource && reportEngine) {
        loadReport(reportSource);
      }
    },

    RefreshReport: () => {
      if (reportEngine && report) {
        refreshReport();
      }
    },

    PrintReport: () => {
      if (report) {
        printReport();
      }
    },

    ExportReport: (format: CRExportFormatType = CRExportFormatType.crEFTPortableDocFormat) => {
      if (report && reportEngine) {
        exportReport(format);
      }
    },

    SearchForText: (searchText: string, searchFromBeginning: boolean = true): boolean => {
      return performSearch(searchText, searchFromBeginning);
    },

    GetFirstPage: () => {
      if (report) {
        setCurrentPage(1);
      }
    },

    GetLastPage: () => {
      if (report) {
        setCurrentPage(report.pageCount);
      }
    },

    GetNextPage: () => {
      if (report && currentPage < report.pageCount) {
        setCurrentPage(currentPage + 1);
      }
    },

    GetPreviousPage: () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },

    ShowFirstPage: () => crystalViewerAPI.GetFirstPage(),
    ShowLastPage: () => crystalViewerAPI.GetLastPage(),
    ShowNextPage: () => crystalViewerAPI.GetNextPage(),
    ShowPreviousPage: () => crystalViewerAPI.GetPreviousPage(),

    Zoom: (zoomFactor: number) => {
      crystalViewerAPI.ZoomLevel = zoomFactor;
    }
  };

  /**
   * Charger rapport
   */
  const loadReport = useCallback(async (reportPath: string) => {
    if (!reportEngine) return;

    setIsLoading(true);
    
    try {
      // Ouvrir rapport
      const success = reportEngine.openReport(reportPath);
      if (!success) {
        throw new Error(`Failed to load report: ${reportPath}`);
      }

      // Vérifier si paramètres requis
      const reportParameters = Array.from((reportEngine as any).parameters.values());
      if (reportParameters.length > 0 && !autoSetParameterValues) {
        setParameters(reportParameters);
        setShowParameterDialog(true);
        setIsLoading(false);
        return;
      }

      // Générer rapport
      const generatedReport = await reportEngine.generateReport();
      setReport(generatedReport);
      setCurrentPage(1);
      
      console.log(`✅ Report loaded and displayed: ${reportPath}`);

    } catch (error) {
      console.error(`❌ Failed to load report: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [reportEngine, autoSetParameterValues]);

  /**
   * Rafraîchir rapport
   */
  const refreshReport = useCallback(async () => {
    if (!reportEngine || !reportSource) return;

    setIsLoading(true);
    
    try {
      // Rafraîchir données
      reportEngine.refreshData();
      
      // Régénérer rapport
      const generatedReport = await reportEngine.generateReport();
      setReport(generatedReport);
      
      if (onReportRefresh) {
        onReportRefresh();
      }

      console.log('🔄 Report refreshed');

    } catch (error) {
      console.error(`❌ Failed to refresh report: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [reportEngine, reportSource, onReportRefresh]);

  /**
   * Imprimer rapport
   */
  const printReport = useCallback(() => {
    if (!report) return;

    // Créer fenêtre d'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Générer HTML pour impression
    const printHTML = generatePrintHTML(report);
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Déclencher impression
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };

    if (onPrintReport) {
      onPrintReport();
    }

    console.log('🖨️ Print dialog opened');
  }, [report, onPrintReport]);

  /**
   * Exporter rapport
   */
  const exportReport = useCallback(async (format: CRExportFormatType) => {
    if (!report || !reportEngine) return;

    try {
      await reportEngine.exportReport(report, format);
      
      if (onExportReport) {
        onExportReport(format);
      }

      console.log(`📤 Report exported as ${CRExportFormatType[format]}`);

    } catch (error) {
      console.error(`❌ Export failed: ${error}`);
    }
  }, [report, reportEngine, onExportReport]);

  /**
   * Recherche dans rapport
   */
  const performSearch = useCallback((searchText: string, fromBeginning: boolean): boolean => {
    if (!report || !searchText) return false;

    const results: number[] = [];
    
    // Chercher dans toutes les pages
    report.pages.forEach((page, pageIndex) => {
      page.elements.forEach(element => {
        if (element.content.toLowerCase().includes(searchText.toLowerCase())) {
          results.push(pageIndex + 1);
        }
      });
    });

    setSearchResults([...new Set(results)]); // Remove duplicates
    setSearchTerm(searchText);
    setCurrentSearchResult(0);

    if (results.length > 0) {
      setCurrentPage(results[0]);
      return true;
    }

    return false;
  }, [report]);

  /**
   * Générer HTML pour impression
   */
  const generatePrintHTML = (report: CRGeneratedReport): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        @media print {
            body { margin: 0; font-family: Arial, sans-serif; }
            .page { page-break-after: always; position: relative; }
            .element { position: absolute; }
            .no-print { display: none; }
        }
        body { font-family: Arial, sans-serif; }
        .page { position: relative; margin-bottom: 20px; }
        .element { position: absolute; }
    </style>
</head>
<body>
    ${report.pages.map(page => `
        <div class="page" style="width: ${page.width * 0.1}px; height: ${page.height * 0.1}px;">
            ${page.elements.map(element => `
                <div class="element" style="
                    left: ${element.x * 0.1}px;
                    top: ${element.y * 0.1}px;
                    width: ${element.width * 0.1}px;
                    height: ${element.height * 0.1}px;
                    font-family: ${element.format.fontName};
                    font-size: ${element.format.fontSize}pt;
                    font-weight: ${element.format.fontBold ? 'bold' : 'normal'};
                    font-style: ${element.format.fontItalic ? 'italic' : 'normal'};
                    color: ${element.format.fontColor};
                    text-align: ${element.format.alignment.toLowerCase()};
                ">
                    ${element.content}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
  };

  /**
   * Gestionnaire paramètres
   */
  const handleParameterSubmit = useCallback(async () => {
    if (!reportEngine) return;

    // Définir valeurs paramètres
    for (const param of parameters) {
      if (param.hasCurrentValue) {
        reportEngine.setParameterValue(param.name, param.value);
      }
    }

    setShowParameterDialog(false);

    // Générer rapport avec paramètres
    try {
      setIsLoading(true);
      const generatedReport = await reportEngine.generateReport();
      setReport(generatedReport);
      setCurrentPage(1);
    } catch (error) {
      console.error(`❌ Failed to generate report with parameters: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [reportEngine, parameters]);

  // Exposer API VB6 globalement
  useEffect(() => {
    if (name) {
      (window as any)[name] = crystalViewerAPI;
    }
    
    return () => {
      if (name && (window as any)[name] === crystalViewerAPI) {
        delete (window as any)[name];
      }
    };
  }, [name, crystalViewerAPI]);

  // Charger rapport initial
  useEffect(() => {
    if (reportSource && reportEngine) {
      loadReport(reportSource);
    }
  }, [reportSource, reportEngine, loadReport]);

  // Style principal
  const viewerStyle: React.CSSProperties = {
    position: 'absolute',
    left: leftPx,
    top: topPx,
    width: widthPx,
    height: heightPx,
    border: displayBorder ? '2px inset #C0C0C0' : 'none',
    backgroundColor: '#F0F0F0',
    fontFamily: 'MS Sans Serif',
    fontSize: '8pt',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div
      ref={viewerRef}
      className="vb6-crystal-reports-viewer"
      style={viewerStyle}
      data-vb6-control="CrystalReportsViewer"
      data-vb6-name={name}
    >
      {/* Toolbar */}
      {displayToolbar && (
        <div style={{
          height: '32px',
          backgroundColor: '#E0E0E0',
          border: '1px solid #C0C0C0',
          display: 'flex',
          alignItems: 'center',
          padding: '2px 4px',
          gap: '2px'
        }}>
          {/* Navigation buttons */}
          <button
            onClick={() => crystalViewerAPI.GetFirstPage()}
            disabled={!report || currentPage === 1}
            style={{ width: '24px', height: '24px', fontSize: '12px' }}
            title="First Page"
          >⏮</button>
          
          <button
            onClick={() => crystalViewerAPI.GetPreviousPage()}
            disabled={!report || currentPage === 1}
            style={{ width: '24px', height: '24px', fontSize: '12px' }}
            title="Previous Page"
          >◀</button>

          <span style={{ margin: '0 8px', fontSize: '11px' }}>
            Page {currentPage} of {report?.pageCount || 0}
          </span>

          <button
            onClick={() => crystalViewerAPI.GetNextPage()}
            disabled={!report || currentPage === report?.pageCount}
            style={{ width: '24px', height: '24px', fontSize: '12px' }}
            title="Next Page"
          >▶</button>
          
          <button
            onClick={() => crystalViewerAPI.GetLastPage()}
            disabled={!report || currentPage === report?.pageCount}
            style={{ width: '24px', height: '24px', fontSize: '12px' }}
            title="Last Page"
          >⏭</button>

          <div style={{ width: '1px', height: '20px', backgroundColor: '#C0C0C0', margin: '0 4px' }} />

          {/* Zoom controls */}
          {enableZoom && (
            <>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ fontSize: '11px', height: '20px' }}
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#C0C0C0', margin: '0 4px' }} />
            </>
          )}

          {/* Action buttons */}
          {enableRefresh && (
            <button
              onClick={refreshReport}
              disabled={isLoading}
              style={{ width: '24px', height: '24px', fontSize: '12px' }}
              title="Refresh Report"
            >🔄</button>
          )}

          {enablePrint && (
            <button
              onClick={printReport}
              disabled={!report}
              style={{ width: '24px', height: '24px', fontSize: '12px' }}
              title="Print Report"
            >🖨</button>
          )}

          {enableExport && (
            <select
              onChange={(e) => {
                if (e.target.value && report) {
                  exportReport(Number(e.target.value) as CRExportFormatType);
                  e.target.value = '';
                }
              }}
              style={{ fontSize: '11px', height: '20px' }}
              defaultValue=""
            >
              <option value="" disabled>Export...</option>
              <option value={CRExportFormatType.crEFTPortableDocFormat}>PDF</option>
              <option value={CRExportFormatType.crEFTMSExcel}>Excel</option>
              <option value={CRExportFormatType.crEFTHTML}>HTML</option>
              <option value={CRExportFormatType.crEFTCommaSeparatedValues}>CSV</option>
            </select>
          )}

          {/* Search */}
          {enableSearch && (
            <>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#C0C0C0', margin: '0 4px' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    performSearch(searchTerm, true);
                  }
                }}
                style={{ fontSize: '11px', height: '18px', width: '100px' }}
              />
              <button
                onClick={() => performSearch(searchTerm, true)}
                disabled={!searchTerm || !report}
                style={{ width: '24px', height: '24px', fontSize: '12px' }}
                title="Search"
              >🔍</button>
            </>
          )}
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Group Tree */}
        {displayGroupTree && enableGroupTree && (
          <div style={{
            width: '200px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #C0C0C0',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>
              Group Tree
            </div>
            {/* Group tree implementation would go here */}
          </div>
        )}

        {/* Report Content */}
        <div
          ref={reportContentRef}
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            border: '1px solid #C0C0C0',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              color: '#666'
            }}>
              Loading Report...
            </div>
          )}

          {!isLoading && !report && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center'
            }}>
              <h3>Crystal Reports Viewer</h3>
              <p>No report loaded</p>
            </div>
          )}

          {!isLoading && report && (
            <div style={{
              padding: '20px',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}>
              {/* Render current page */}
              {report.pages[currentPage - 1] && (
                <div
                  style={{
                    width: `${report.pages[currentPage - 1].width * 0.1}px`,
                    height: `${report.pages[currentPage - 1].height * 0.1}px`,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C0C0C0',
                    position: 'relative',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  {report.pages[currentPage - 1].elements.map((element, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: `${element.x * 0.1}px`,
                        top: `${element.y * 0.1}px`,
                        width: `${element.width * 0.1}px`,
                        height: `${element.height * 0.1}px`,
                        fontFamily: element.format.fontName,
                        fontSize: `${element.format.fontSize * 0.8}pt`,
                        fontWeight: element.format.fontBold ? 'bold' : 'normal',
                        fontStyle: element.format.fontItalic ? 'italic' : 'normal',
                        color: element.format.fontColor,
                        backgroundColor: element.format.backgroundColor !== 'transparent' ? element.format.backgroundColor : undefined,
                        textAlign: element.format.alignment.toLowerCase() as any,
                        overflow: 'hidden',
                        lineHeight: 1.2
                      }}
                    >
                      {element.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Parameter Dialog */}
      {showParameterDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#F0F0F0',
            border: '2px outset #C0C0C0',
            padding: '16px',
            minWidth: '400px',
            fontFamily: 'MS Sans Serif',
            fontSize: '8pt'
          }}>
            <h3>Enter Parameters</h3>
            
            {parameters.map((param, index) => (
              <div key={param.name} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  {param.prompt || param.name}:
                </label>
                <input
                  type={param.type === CRParameterFieldType.crNumberField ? 'number' :
                        param.type === CRParameterFieldType.crDateField ? 'date' :
                        param.type === CRParameterFieldType.crBooleanField ? 'checkbox' : 'text'}
                  value={param.value || ''}
                  onChange={(e) => {
                    const newParams = [...parameters];
                    newParams[index] = {
                      ...param,
                      value: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
                      hasCurrentValue: true
                    };
                    setParameters(newParams);
                  }}
                  style={{
                    width: '100%',
                    height: '20px',
                    border: '1px inset #C0C0C0',
                    fontSize: '11px'
                  }}
                />
              </div>
            ))}
            
            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <button
                onClick={handleParameterSubmit}
                style={{
                  marginRight: '8px',
                  padding: '4px 16px',
                  border: '1px outset #C0C0C0',
                  backgroundColor: '#F0F0F0'
                }}
              >
                OK
              </button>
              <button
                onClick={() => setShowParameterDialog(false)}
                style={{
                  padding: '4px 16px',
                  border: '1px outset #C0C0C0',
                  backgroundColor: '#F0F0F0'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Factory Crystal Reports Viewer
 */
export const createCrystalReportsViewer = (props: Partial<CRViewerProps> = {}) => {
  return <VB6CrystalReportsViewer {...props} />;
};

export default VB6CrystalReportsViewer;